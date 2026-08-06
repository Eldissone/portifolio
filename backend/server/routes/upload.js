import { Router } from 'express';
import multer from 'multer';
import { authenticate } from '../lib/auth.js';
import { uploadPublicImage } from '../lib/supabase.js';

const router = Router();

const imageUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error('Tipo de ficheiro não suportado'));
  },
});

router.post('/', authenticate, imageUpload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Nenhuma imagem enviada' });
    }

    const folder = req.body.folder === 'blog' || req.body.folder === 'books'
      ? req.body.folder
      : 'portfolio';

    const { publicUrl } = await uploadPublicImage(
      req.file.buffer,
      req.file.mimetype,
      req.file.originalname,
      folder
    );

    console.log('📤 Upload para Supabase bem-sucedido:', {
      size: req.file.size,
      url: publicUrl,
    });

    res.json({ imageUrl: publicUrl });
  } catch (error) {
    console.error('❌ Erro no upload:', error);
    if (error.rlsBlocked) {
      return res.status(500).json({
        error: 'Permissão negada no Supabase Storage. Defina SUPABASE_SERVICE_ROLE_KEY no backend.',
      });
    }
    res.status(500).json({ error: error.message || 'Erro ao processar upload' });
  }
});

export default router;
