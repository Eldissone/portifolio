import { Router } from 'express';
import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma.js';
import { authenticate, getJwtSecret } from '../lib/auth.js';
import { slugify, parseTags, sanitizeEmbeds } from '../lib/utils.js';

const router = Router();

function buildPostData(body, { isCreate = false } = {}) {
  const title = body.title?.trim();
  if (!title) throw new Error('Título é obrigatório');

  const slug = slugify(body.slug || title);
  if (!slug) throw new Error('Slug inválido');

  const status = ['draft', 'published', 'archived'].includes(body.status)
    ? body.status
    : 'draft';

  const data = {
    title,
    slug,
    excerpt: body.excerpt?.trim() || null,
    content: body.content ?? '',
    coverUrl: body.coverUrl || body.imageUrl || null,
    status,
    tags: parseTags(body.tags),
    metaTitle: body.metaTitle?.trim() || null,
    metaDescription: body.metaDescription?.trim() || null,
    videoEmbeds: sanitizeEmbeds(body.videoEmbeds),
  };

  if (status === 'published') {
    data.publishedAt = body.publishedAt ? new Date(body.publishedAt) : new Date();
  } else if (isCreate) {
    data.publishedAt = null;
  } else if (status !== 'published') {
    // keep existing publishedAt on update unless explicitly cleared — handled in route
  }

  return data;
}

// Public list
router.get('/', async (req, res) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 12));
    const skip = (page - 1) * limit;
    const q = String(req.query.q || '').trim();
    const tag = String(req.query.tag || '').trim();

    const where = { status: 'published' };

    if (q) {
      where.OR = [
        { title: { contains: q, mode: 'insensitive' } },
        { excerpt: { contains: q, mode: 'insensitive' } },
        { content: { contains: q, mode: 'insensitive' } },
      ];
    }
    if (tag) {
      where.tags = { has: tag };
    }

    const [items, total] = await Promise.all([
      prisma.post.findMany({
        where,
        orderBy: [{ publishedAt: 'desc' }, { createdAt: 'desc' }],
        skip,
        take: limit,
      }),
      prisma.post.count({ where }),
    ]);

    res.set('Cache-Control', 'public, max-age=60');
    res.json({ items, total, page, limit, totalPages: Math.ceil(total / limit) });
  } catch (error) {
    console.error('❌ Erro ao listar posts:', error);
    res.status(500).json({ error: 'Erro ao listar posts' });
  }
});

// Admin: list all (flat array for admin UI compatibility)
router.get('/admin/all', authenticate, async (req, res) => {
  try {
    const posts = await prisma.post.findMany({
      orderBy: [{ createdAt: 'desc' }],
    });
    res.json(posts);
  } catch (error) {
    console.error('❌ Erro ao listar posts (admin):', error);
    res.status(500).json({ error: 'Erro ao listar posts' });
  }
});

router.get('/:slug', async (req, res) => {
  try {
    const post = await prisma.post.findUnique({ where: { slug: req.params.slug } });
    if (!post) return res.status(404).json({ error: 'Post não encontrado' });

    if (post.status !== 'published') {
      const token = req.headers.authorization?.split(' ')[1];
      if (!token) return res.status(404).json({ error: 'Post não encontrado' });
      try {
        jwt.verify(token, getJwtSecret());
      } catch {
        return res.status(404).json({ error: 'Post não encontrado' });
      }
    }

    res.set('Cache-Control', 'public, max-age=60');
    res.json(post);
  } catch (error) {
    console.error('❌ Erro ao buscar post:', error);
    res.status(500).json({ error: 'Erro ao buscar post' });
  }
});

router.post('/', authenticate, async (req, res) => {
  try {
    const data = buildPostData(req.body, { isCreate: true });
    const post = await prisma.post.create({ data });
    res.status(201).json(post);
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(409).json({ error: 'Slug já existe' });
    }
    console.error('❌ Erro ao criar post:', error);
    res.status(400).json({ error: error.message || 'Erro ao criar post' });
  }
});

router.put('/:id', authenticate, async (req, res) => {
  try {
    const existing = await prisma.post.findUnique({ where: { id: req.params.id } });
    if (!existing) return res.status(404).json({ error: 'Post não encontrado' });

    const data = buildPostData({ ...existing, ...req.body });
    if (data.status === 'published' && !existing.publishedAt) {
      data.publishedAt = new Date();
    } else if (data.status === 'published') {
      data.publishedAt = existing.publishedAt;
    }

    const post = await prisma.post.update({
      where: { id: req.params.id },
      data,
    });
    res.json(post);
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(409).json({ error: 'Slug já existe' });
    }
    console.error('❌ Erro ao atualizar post:', error);
    res.status(400).json({ error: error.message || 'Erro ao atualizar post' });
  }
});

router.delete('/:id', authenticate, async (req, res) => {
  try {
    await prisma.post.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (error) {
    console.error('❌ Erro ao apagar post:', error);
    res.status(500).json({ error: 'Erro ao apagar post' });
  }
});

export default router;
