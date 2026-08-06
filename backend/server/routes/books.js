import { Router } from 'express';
import multer from 'multer';
import prisma from '../lib/prisma.js';
import { authenticate } from '../lib/auth.js';
import { uploadPrivatePdf } from '../lib/supabase.js';
import {
  slugify,
  parseTags,
  publicBookSelect,
  createDownloadTokenValue,
  hashToken,
  createRateLimiter,
} from '../lib/utils.js';
import {
  downloadTokenTtlHours,
  downloadTokenMaxUses,
} from '../lib/supabase.js';

const router = Router();
const freeDownloadLimiter = createRateLimiter({ windowMs: 60_000, max: 5 });

const pdfUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') cb(null, true);
    else cb(new Error('Apenas PDF é permitido'));
  },
});

function buildBookData(body) {
  const title = body.title?.trim();
  if (!title) throw new Error('Título é obrigatório');

  const slug = slugify(body.slug || title);
  if (!slug) throw new Error('Slug inválido');

  const status = ['draft', 'published', 'archived'].includes(body.status)
    ? body.status
    : 'draft';

  const isFree = body.isFree === true || body.isFree === 'true' || body.isFree === '1';

  return {
    title,
    slug,
    description: body.description?.trim() || '',
    coverUrl: body.coverUrl || body.imageUrl || null,
    priceKz: isFree ? null : (body.priceKz?.trim() || null),
    priceEur: isFree ? null : (body.priceEur?.trim() || null),
    isFree,
    status,
    tags: parseTags(body.tags),
  };
}

router.get('/', async (req, res) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 12));
    const skip = (page - 1) * limit;
    const q = String(req.query.q || '').trim();
    const tag = String(req.query.tag || '').trim();
    const freeOnly = req.query.free === '1';

    const where = { status: 'published' };
    if (freeOnly) where.isFree = true;
    if (q) {
      where.OR = [
        { title: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
      ];
    }
    if (tag) where.tags = { has: tag };

    const [items, total] = await Promise.all([
      prisma.book.findMany({
        where,
        select: publicBookSelect(),
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.book.count({ where }),
    ]);

    res.set('Cache-Control', 'public, max-age=60');
    res.json({ items, total, page, limit, totalPages: Math.ceil(total / limit) });
  } catch (error) {
    console.error('❌ Erro ao listar livros:', error);
    res.status(500).json({ error: 'Erro ao listar livros' });
  }
});

router.get('/admin/all', authenticate, async (req, res) => {
  try {
    const books = await prisma.book.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        ...publicBookSelect(),
        filePath: true,
      },
    });
    // Mark hasFile without exposing full path to UI if desired — still useful for admin
    res.json(
      books.map(({ filePath, ...book }) => ({
        ...book,
        hasFile: Boolean(filePath),
      }))
    );
  } catch (error) {
    console.error('❌ Erro ao listar livros (admin):', error);
    res.status(500).json({ error: 'Erro ao listar livros' });
  }
});

router.get('/:slug', async (req, res) => {
  try {
    const book = await prisma.book.findUnique({
      where: { slug: req.params.slug },
      select: publicBookSelect(),
    });
    if (!book || book.status !== 'published') {
      return res.status(404).json({ error: 'Livro não encontrado' });
    }
    res.set('Cache-Control', 'public, max-age=60');
    res.json(book);
  } catch (error) {
    console.error('❌ Erro ao buscar livro:', error);
    res.status(500).json({ error: 'Erro ao buscar livro' });
  }
});

router.post('/', authenticate, async (req, res) => {
  try {
    const data = buildBookData(req.body);
    const book = await prisma.book.create({ data });
    res.status(201).json(book);
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(409).json({ error: 'Slug já existe' });
    }
    console.error('❌ Erro ao criar livro:', error);
    res.status(400).json({ error: error.message || 'Erro ao criar livro' });
  }
});

router.put('/:id', authenticate, async (req, res) => {
  try {
    const existing = await prisma.book.findUnique({ where: { id: req.params.id } });
    if (!existing) return res.status(404).json({ error: 'Livro não encontrado' });

    const data = buildBookData({ ...existing, ...req.body });
    const book = await prisma.book.update({
      where: { id: req.params.id },
      data,
    });
    res.json(book);
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(409).json({ error: 'Slug já existe' });
    }
    console.error('❌ Erro ao atualizar livro:', error);
    res.status(400).json({ error: error.message || 'Erro ao atualizar livro' });
  }
});

router.delete('/:id', authenticate, async (req, res) => {
  try {
    await prisma.book.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (error) {
    console.error('❌ Erro ao apagar livro:', error);
    res.status(500).json({ error: 'Erro ao apagar livro' });
  }
});

router.post('/:id/file', authenticate, pdfUpload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'Nenhum PDF enviado' });

    const book = await prisma.book.findUnique({ where: { id: req.params.id } });
    if (!book) return res.status(404).json({ error: 'Livro não encontrado' });

    const filePath = await uploadPrivatePdf(req.file.buffer, req.file.originalname, book.id);
    const updated = await prisma.book.update({
      where: { id: book.id },
      data: { filePath },
    });

    res.json({ id: updated.id, hasFile: true });
  } catch (error) {
    console.error('❌ Erro no upload do PDF:', error);
    if (error.rlsBlocked) {
      return res.status(500).json({
        error: 'Permissão negada no Supabase Storage. Verifica SUPABASE_SERVICE_ROLE_KEY e o bucket privado.',
      });
    }
    res.status(500).json({ error: error.message || 'Erro ao fazer upload do PDF' });
  }
});

router.post('/:id/free-download', freeDownloadLimiter, async (req, res) => {
  try {
    const book = await prisma.book.findUnique({ where: { id: req.params.id } });
    if (!book || book.status !== 'published') {
      return res.status(404).json({ error: 'Livro não encontrado' });
    }
    if (!book.isFree) {
      return res.status(403).json({ error: 'Este livro não é gratuito' });
    }
    if (!book.filePath) {
      return res.status(404).json({ error: 'Ficheiro indisponível' });
    }

    const rawToken = createDownloadTokenValue();
    const expiresAt = new Date(Date.now() + downloadTokenTtlHours * 60 * 60 * 1000);

    await prisma.downloadToken.create({
      data: {
        bookId: book.id,
        orderId: null,
        tokenHash: hashToken(rawToken),
        expiresAt,
        maxUses: downloadTokenMaxUses,
      },
    });

    const frontendUrl = process.env.FRONTEND_URL || 'https://www.eldissone.com';
    res.json({
      downloadUrl: `${frontendUrl}/src/pages/download.html?token=${rawToken}`,
      token: rawToken,
      expiresAt,
    });
  } catch (error) {
    console.error('❌ Erro no download gratuito:', error);
    res.status(500).json({ error: 'Erro ao gerar download' });
  }
});

export default router;
