import { Router } from 'express';
import prisma from '../lib/prisma.js';
import { authenticate } from '../lib/auth.js';
import {
  isValidEmail,
  createRateLimiter,
  paymentInstructions,
  createDownloadTokenValue,
  hashToken,
} from '../lib/utils.js';
import {
  downloadTokenTtlHours,
  downloadTokenMaxUses,
} from '../lib/supabase.js';

const router = Router();
const orderLimiter = createRateLimiter({ windowMs: 60_000, max: 8 });

const ALLOWED_METHODS = new Set(['multicaixa', 'transfer', 'whatsapp']);
const ALLOWED_STATUSES = new Set(['pending', 'paid', 'rejected', 'expired']);

async function issueDownloadToken(order, bookId) {
  // Revoke previous tokens for this order
  await prisma.downloadToken.updateMany({
    where: { orderId: order.id, revoked: false },
    data: { revoked: true },
  });

  const rawToken = createDownloadTokenValue();
  const expiresAt = new Date(Date.now() + downloadTokenTtlHours * 60 * 60 * 1000);

  await prisma.downloadToken.create({
    data: {
      bookId,
      orderId: order.id,
      tokenHash: hashToken(rawToken),
      expiresAt,
      maxUses: downloadTokenMaxUses,
    },
  });

  const frontendUrl = process.env.FRONTEND_URL || 'https://www.eldissone.com';
  return {
    token: rawToken,
    downloadUrl: `${frontendUrl}/src/pages/download.html?token=${rawToken}`,
    expiresAt,
  };
}

router.post('/', orderLimiter, async (req, res) => {
  try {
    const { bookId, customerName, customerEmail, method, notes } = req.body;

    if (!bookId || !customerName?.trim() || !customerEmail?.trim() || !method) {
      return res.status(400).json({ error: 'Dados do pedido incompletos' });
    }
    if (!isValidEmail(customerEmail)) {
      return res.status(400).json({ error: 'Email inválido' });
    }
    if (!ALLOWED_METHODS.has(method)) {
      return res.status(400).json({ error: 'Método de pagamento inválido' });
    }

    const book = await prisma.book.findUnique({ where: { id: bookId } });
    if (!book || book.status !== 'published') {
      return res.status(404).json({ error: 'Livro não encontrado' });
    }
    if (book.isFree) {
      return res.status(400).json({ error: 'Este livro é gratuito — usa o download gratuito' });
    }

    const order = await prisma.order.create({
      data: {
        bookId: book.id,
        customerName: customerName.trim(),
        customerEmail: customerEmail.trim().toLowerCase(),
        method,
        notes: notes?.trim() || null,
        status: 'pending',
      },
      include: {
        book: {
          select: { id: true, title: true, slug: true, priceKz: true, priceEur: true },
        },
      },
    });

    res.status(201).json({
      order: {
        id: order.id,
        status: order.status,
        method: order.method,
        customerName: order.customerName,
        customerEmail: order.customerEmail,
        book: order.book,
        createdAt: order.createdAt,
      },
      payment: paymentInstructions(method, order.id),
    });
  } catch (error) {
    console.error('❌ Erro ao criar pedido:', error);
    res.status(500).json({ error: 'Erro ao criar pedido' });
  }
});

router.get('/', authenticate, async (req, res) => {
  try {
    const status = req.query.status ? String(req.query.status) : undefined;
    const where = status && ALLOWED_STATUSES.has(status) ? { status } : {};

    const orders = await prisma.order.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        book: {
          select: { id: true, title: true, slug: true, priceKz: true, priceEur: true, coverUrl: true },
        },
        downloadTokens: {
          where: { revoked: false },
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: { id: true, expiresAt: true, usedCount: true, maxUses: true, createdAt: true },
        },
      },
    });

    res.json(orders);
  } catch (error) {
    console.error('❌ Erro ao listar pedidos:', error);
    res.status(500).json({ error: 'Erro ao listar pedidos' });
  }
});

router.patch('/:id', authenticate, async (req, res) => {
  try {
    const order = await prisma.order.findUnique({
      where: { id: req.params.id },
      include: { book: true },
    });
    if (!order) return res.status(404).json({ error: 'Pedido não encontrado' });

    const { status, notes, action } = req.body;
    let download = null;

    if (action === 'resend') {
      if (order.status !== 'paid') {
        return res.status(400).json({ error: 'Só podes reenviar link de pedidos pagos' });
      }
      if (!order.book.filePath) {
        return res.status(400).json({ error: 'Livro sem ficheiro PDF' });
      }
      download = await issueDownloadToken(order, order.bookId);
      return res.json({ order, download });
    }

    if (status && !ALLOWED_STATUSES.has(status)) {
      return res.status(400).json({ error: 'Estado inválido' });
    }

    const data = {};
    if (typeof notes === 'string') data.notes = notes.trim() || null;
    if (status) {
      data.status = status;
      if (status === 'paid') data.paidAt = new Date();
    }

    const updated = await prisma.order.update({
      where: { id: order.id },
      data,
      include: {
        book: {
          select: { id: true, title: true, slug: true, priceKz: true, priceEur: true, coverUrl: true, filePath: true },
        },
      },
    });

    if (status === 'paid') {
      if (!updated.book.filePath) {
        return res.status(400).json({
          error: 'Pagamento marcado, mas o livro não tem PDF. Faz upload do ficheiro e usa Reenviar link.',
          order: { ...updated, book: { ...updated.book, filePath: undefined, hasFile: false } },
        });
      }
      download = await issueDownloadToken(updated, updated.bookId);
    }

    const { filePath, ...bookPublic } = updated.book;
    res.json({
      order: { ...updated, book: { ...bookPublic, hasFile: Boolean(filePath) } },
      download,
    });
  } catch (error) {
    console.error('❌ Erro ao atualizar pedido:', error);
    res.status(500).json({ error: 'Erro ao atualizar pedido' });
  }
});

export default router;
