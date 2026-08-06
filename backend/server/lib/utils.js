import './env.js';

import crypto from 'crypto';

const EMBED_HOSTS = new Set([
  'youtube.com',
  'www.youtube.com',
  'youtu.be',
  'www.youtu.be',
  'vimeo.com',
  'www.vimeo.com',
  'player.vimeo.com',
]);

export function slugify(text) {
  return String(text || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 120);
}

export function parseTags(tags) {
  if (Array.isArray(tags)) return tags.map((t) => String(t).trim()).filter(Boolean);
  if (typeof tags === 'string') {
    return tags.split(',').map((t) => t.trim()).filter(Boolean);
  }
  return [];
}

export function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || '').trim());
}

export function sanitizeEmbeds(embeds) {
  if (!embeds) return [];
  const list = Array.isArray(embeds) ? embeds : [];
  return list
    .map((item) => {
      const url = typeof item === 'string' ? item : item?.url;
      if (!url) return null;
      try {
        const parsed = new URL(url);
        if (!EMBED_HOSTS.has(parsed.hostname)) return null;
        const host = parsed.hostname.replace(/^www\./, '');
        const provider = host.includes('vimeo') ? 'vimeo' : 'youtube';
        return { url: parsed.toString(), provider };
      } catch {
        return null;
      }
    })
    .filter(Boolean);
}

export function createDownloadTokenValue() {
  return crypto.randomBytes(32).toString('hex');
}

export function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

/** Simple in-memory rate limiter (per process). Good enough for single instance. */
export function createRateLimiter({ windowMs = 60_000, max = 10 } = {}) {
  const hits = new Map();

  return function rateLimit(req, res, next) {
    const key = `${req.ip || 'unknown'}:${req.path}`;
    const now = Date.now();
    const entry = hits.get(key);

    if (!entry || now > entry.resetAt) {
      hits.set(key, { count: 1, resetAt: now + windowMs });
      return next();
    }

    entry.count += 1;
    if (entry.count > max) {
      return res.status(429).json({ error: 'Demasiados pedidos. Tenta mais tarde.' });
    }
    return next();
  };
}

export function publicBookSelect() {
  return {
    id: true,
    slug: true,
    title: true,
    description: true,
    coverUrl: true,
    priceKz: true,
    priceEur: true,
    isFree: true,
    status: true,
    tags: true,
    createdAt: true,
    updatedAt: true,
    // filePath intentionally omitted
  };
}

export function paymentInstructions(method, orderId) {
  const whatsapp = process.env.PAYMENT_WHATSAPP || '244933170799';
  const bank = process.env.PAYMENT_BANK_DETAILS || 'Contacta-nos para dados bancários.';
  const multicaixa = process.env.PAYMENT_MULTICAIXA || 'Referência Multicaixa a confirmar após contacto.';

  const base = {
    orderRef: orderId.slice(0, 8).toUpperCase(),
    whatsappUrl: `https://wa.me/${whatsapp}?text=${encodeURIComponent(`Olá! Fiz o pedido ${orderId.slice(0, 8).toUpperCase()} e quero concluir o pagamento.`)}`,
  };

  if (method === 'whatsapp') {
    return { ...base, message: 'Envia comprovativo via WhatsApp com a referência do pedido.', details: `WhatsApp: +${whatsapp}` };
  }
  if (method === 'transfer') {
    return { ...base, message: 'Faz a transferência e guarda o comprovativo.', details: bank };
  }
  return { ...base, message: 'Paga via Multicaixa Express e guarda o comprovativo.', details: multicaixa };
}
