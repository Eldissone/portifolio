// server/index.js
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import pkg from '@prisma/client';
const { PrismaClient } = pkg;
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key';

// Inicializar Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const bucketName = process.env.SUPABASE_BUCKET || 'portfolio-uploads';

let supabase;
if (supabaseUrl && supabaseKey) {
  supabase = createClient(supabaseUrl, supabaseKey);
  console.log('✅ Supabase conectado');
} else {
  console.warn('⚠️  Variáveis Supabase não configuradas');
}

// Configurar multer para armazenamento em memória
const storage = multer.memoryStorage();

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
  fileFilter: (req, file, cb) => {
    const allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Tipo de ficheiro não suportado'));
    }
  }
});

// Origens permitidas (dev + produção)
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:4173',
  'https://www.eldissone.com',
  'https://eldissone.com',
  process.env.FRONTEND_URL
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Permitir requests sem origin (ex: Postman, servidor-a-servidor)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS bloqueado para: ${origin}`));
    }
  },
  credentials: true
}));
app.use(express.json());

// Middlewares
const authenticate = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

// Auth Routes
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await prisma.user.findUnique({ where: { email } });
  
  if (user && await bcrypt.compare(password, user.password)) {
    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '24h' });
    res.json({ token, user: { id: user.id, email: user.email, name: user.name } });
  } else {
    res.status(401).json({ error: 'Credenciais inválidas' });
  }
});

// Projects API
app.get('/api/projects', async (req, res) => {
  const projects = await prisma.project.findMany({ orderBy: { order: 'asc' } });
  res.json(projects);
});

app.post('/api/projects', authenticate, async (req, res) => {
  const project = await prisma.project.create({ data: req.body });
  res.status(201).json(project);
});

app.put('/api/projects/:id', authenticate, async (req, res) => {
  const project = await prisma.project.update({
    where: { id: req.params.id },
    data: req.body
  });
  res.json(project);
});

app.delete('/api/projects/:id', authenticate, async (req, res) => {
  await prisma.project.delete({ where: { id: req.params.id } });
  res.status(204).send();
});

// Upload Route — Supabase Storage
app.post('/api/upload', authenticate, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Nenhuma imagem enviada' });
    }

    if (!supabase) {
      return res.status(500).json({ error: 'Armazenamento não configurado' });
    }

    // Sanitizar nome do ficheiro
    const sanitized = req.file.originalname
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9._-]/g, '_')
      .replace(/__+/g, '_')
      .toLowerCase();
    
    const fileName = `${Date.now()}-${sanitized}`;
    const filePath = `portfolio/${fileName}`;

    // Upload para Supabase Storage
    const { data, error } = await supabase.storage
      .from(bucketName)
      .upload(filePath, req.file.buffer, {
        contentType: req.file.mimetype,
        upsert: false
      });

    if (error) {
      console.error('❌ Erro ao fazer upload:', error);
      return res.status(500).json({ error: 'Erro ao fazer upload da imagem' });
    }

    // Obter URL pública
    const { data } = supabase.storage
      .from(bucketName)
      .getPublicUrl(filePath);

    const publicUrl = data?.publicUrl;

    if (!publicUrl) {
      console.error('❌ Erro ao gerar URL pública');
      return res.status(500).json({ error: 'Erro ao gerar URL da imagem' });
    }

    console.log('📤 Upload para Supabase bem-sucedido:', {
      fileName: fileName,
      size: req.file.size,
      url: publicUrl
    });

    res.json({ imageUrl: publicUrl });
  } catch (error) {
    console.error('❌ Erro no upload:', error);
    res.status(500).json({ error: 'Erro ao processar upload' });
  }
});

// Services API
app.get('/api/services', async (req, res) => {
  const services = await prisma.service.findMany({ orderBy: { createdAt: 'desc' } });
  res.json(services);
});

app.post('/api/services', authenticate, async (req, res) => {
  const { features, ...rest } = req.body;
  const service = await prisma.service.create({ 
    data: { 
      ...rest,
      features: Array.isArray(features) ? features : features.split(',').map(f => f.trim())
    } 
  });
  res.status(201).json(service);
});

app.put('/api/services/:id', authenticate, async (req, res) => {
  const { features, ...rest } = req.body;
  const service = await prisma.service.update({
    where: { id: req.params.id },
    data: {
      ...rest,
      features: Array.isArray(features) ? features : features.split(',').map(f => f.trim())
    }
  });
  res.json(service);
});

app.delete('/api/services/:id', authenticate, async (req, res) => {
  await prisma.service.delete({ where: { id: req.params.id } });
  res.status(204).send();
});

// Servir o frontend (dist) em produção
const distPath = path.join(__dirname, '../../frontend/dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  // Redirecionar páginas HTML específicas
  app.get('/src/pages/admin.html', (req, res) => {
    res.sendFile(path.join(distPath, 'src/pages/admin.html'));
  });
  app.get('/src/pages/servicos.html', (req, res) => {
    res.sendFile(path.join(distPath, 'src/pages/servicos.html'));
  });
  app.get('/src/pages/projeto.html', (req, res) => {
    res.sendFile(path.join(distPath, 'src/pages/projeto.html'));
  });
  // Fallback para o index principal
  app.get('*', (req, res) => {
    // Não interceptar rotas de API
    if (req.path.startsWith('/api')) return;
    res.sendFile(path.join(distPath, 'index.html'));
  });
  console.log(`📁 A servir frontend de: ${distPath}`);
}

if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`\n${'='.repeat(50)}`);
    console.log(`✅ Servidor a correr na porta ${PORT}`);
    console.log(`${'='.repeat(50)}\n`);
  });
}

export default app;
