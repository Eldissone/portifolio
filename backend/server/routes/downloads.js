import { Router } from 'express';
import prisma from '../lib/prisma.js';
import { hashToken, createRateLimiter } from '../lib/utils.js';
import { createSignedDownloadUrl } from '../lib/supabase.js';

const router = Router();
const downloadLimiter = createRateLimiter({ windowMs: 60_000, max: 20 });

router.get('/:token', downloadLimiter, async (req, res) => {
  try {
    const rawToken = String(req.params.token || '').trim();
    if (!rawToken || rawToken.length < 32) {
      return res.status(400).json({ error: 'Token inválido' });
    }

    const tokenHash = hashToken(rawToken);
    const record = await prisma.downloadToken.findUnique({
      where: { tokenHash },
      include: {
        book: {
          select: { id: true, title: true, slug: true, filePath: true, status: true },
        },
      },
    });

    if (!record || record.revoked) {
      return res.status(404).json({ error: 'Link inválido ou revogado' });
    }
    if (record.expiresAt < new Date()) {
      return res.status(410).json({ error: 'Link expirado' });
    }
    if (record.usedCount >= record.maxUses) {
      return res.status(410).json({ error: 'Limite de downloads atingido' });
    }
    if (!record.book?.filePath || record.book.status === 'archived') {
      return res.status(404).json({ error: 'Ficheiro indisponível' });
    }

    const signedUrl = await createSignedDownloadUrl(record.book.filePath);

    await prisma.downloadToken.update({
      where: { id: record.id },
      data: { usedCount: { increment: 1 } },
    });

    res.set('Cache-Control', 'no-store');
    res.json({
      url: signedUrl,
      book: { id: record.book.id, title: record.book.title, slug: record.book.slug },
      remainingUses: Math.max(0, record.maxUses - record.usedCount - 1),
      expiresAt: record.expiresAt,
      readerPath: `/src/pages/reader.html?token=${encodeURIComponent(rawToken)}`,
    });
  } catch (error) {
    console.error('❌ Erro no download:', error);
    res.status(500).json({ error: 'Erro ao processar download' });
  }
});

export default router;
