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

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key';

// Configurar pasta de uploads
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log('📁 Pasta de uploads criada:', uploadsDir);
}

// Configurar armazenamento de ficheiros
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    // Sanitizar nome: remover acentos, espaços e caracteres especiais
    const sanitized = file.originalname
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9._-]/g, '_')
      .replace(/__+/g, '_')
      .toLowerCase();
    
    const fileName = `${Date.now()}-${sanitized}`;
    cb(null, fileName);
  }
});

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


// Servir ficheiros da pasta uploads
app.use('/uploads', express.static(uploadsDir));

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
// Upload Route — Armazenamento Local
app.post('/api/upload', authenticate, upload.single('image'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'Nenhuma imagem enviada' });
  }

  console.log('📤 Upload bem-sucedido:', {
    fileName: req.file.filename,
    size: req.file.size,
    mimetype: req.file.mimetype
  });

  // URL relativa da imagem
  const imageUrl = `/uploads/${req.file.filename}`;
  
  console.log('🔗 URL da imagem:', imageUrl);
  res.json({ imageUrl });
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
    if (req.path.startsWith('/api') || req.path.startsWith('/uploads')) return;
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
