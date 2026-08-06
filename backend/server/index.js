// server/index.js
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

import prisma from './lib/prisma.js';
import { authenticate, getJwtSecret } from './lib/auth.js';
import postsRouter from './routes/posts.js';
import booksRouter from './routes/books.js';
import ordersRouter from './routes/orders.js';
import downloadsRouter from './routes/downloads.js';
import uploadRouter from './routes/upload.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:4173',
  'https://www.eldissone.com',
  'https://eldissone.com',
  process.env.FRONTEND_URL,
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS bloqueado para: ${origin}`));
    }
  },
  credentials: true,
}));

app.use(express.json({ limit: '1mb' }));

app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });

    if (user && await bcrypt.compare(password, user.password)) {
      const token = jwt.sign({ userId: user.id }, getJwtSecret(), { expiresIn: '24h' });
      res.json({ token, user: { id: user.id, email: user.email, name: user.name } });
    } else {
      res.status(401).json({ error: 'Credenciais inválidas' });
    }
  } catch (error) {
    console.error('❌ Erro no login:', error);
    res.status(500).json({ error: 'Erro ao fazer login' });
  }
});

// Projects
app.get('/api/projects', async (req, res) => {
  try {
    const projects = await prisma.project.findMany({ orderBy: { order: 'asc' } });
    res.json(projects);
  } catch (error) {
    console.error('❌ Erro ao buscar projetos:', error);
    res.status(500).json({ error: 'Erro ao buscar projetos' });
  }
});

app.post('/api/projects', authenticate, async (req, res) => {
  try {
    const project = await prisma.project.create({ data: req.body });
    res.status(201).json(project);
  } catch (error) {
    console.error('❌ Erro ao criar projeto:', error);
    res.status(500).json({ error: 'Erro ao criar projeto' });
  }
});

app.put('/api/projects/:id', authenticate, async (req, res) => {
  try {
    const project = await prisma.project.update({
      where: { id: req.params.id },
      data: req.body,
    });
    res.json(project);
  } catch (error) {
    console.error('❌ Erro ao atualizar projeto:', error);
    res.status(500).json({ error: 'Erro ao atualizar projeto' });
  }
});

app.delete('/api/projects/:id', authenticate, async (req, res) => {
  try {
    await prisma.project.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (error) {
    console.error('❌ Erro ao deletar projeto:', error);
    res.status(500).json({ error: 'Erro ao deletar projeto' });
  }
});

// Services
app.get('/api/services', async (req, res) => {
  try {
    const services = await prisma.service.findMany({
      orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
    });
    res.json(services);
  } catch (error) {
    console.error('❌ Erro ao buscar serviços:', error);
    res.status(500).json({ error: 'Erro ao buscar serviços' });
  }
});

app.post('/api/services', authenticate, async (req, res) => {
  try {
    const { features, ...rest } = req.body;
    const service = await prisma.service.create({
      data: {
        ...rest,
        features: Array.isArray(features) ? features : features.split(',').map((f) => f.trim()),
      },
    });
    res.status(201).json(service);
  } catch (error) {
    console.error('❌ Erro ao criar serviço:', error);
    res.status(500).json({ error: 'Erro ao criar serviço' });
  }
});

app.put('/api/services/:id', authenticate, async (req, res) => {
  try {
    const { features, ...rest } = req.body;
    const service = await prisma.service.update({
      where: { id: req.params.id },
      data: {
        ...rest,
        features: Array.isArray(features) ? features : features.split(',').map((f) => f.trim()),
      },
    });
    res.json(service);
  } catch (error) {
    console.error('❌ Erro ao atualizar serviço:', error);
    res.status(500).json({ error: 'Erro ao atualizar serviço' });
  }
});

app.delete('/api/services/:id', authenticate, async (req, res) => {
  try {
    await prisma.service.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (error) {
    console.error('❌ Erro ao deletar serviço:', error);
    res.status(500).json({ error: 'Erro ao deletar serviço' });
  }
});

// New modules
app.use('/api/upload', uploadRouter);
app.use('/api/posts', postsRouter);
app.use('/api/books', booksRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/downloads', downloadsRouter);

// Servir o frontend (dist) em produção
const distPath = path.join(__dirname, '../../frontend/dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  const pageRoutes = [
    '/src/pages/admin.html',
    '/src/pages/servicos.html',
    '/src/pages/projeto.html',
    '/src/pages/blog.html',
    '/src/pages/blog-post.html',
    '/src/pages/biblioteca.html',
    '/src/pages/livro.html',
    '/src/pages/download.html',
  ];
  for (const route of pageRoutes) {
    app.get(route, (req, res) => {
      res.sendFile(path.join(distPath, route.replace(/^\//, '')));
    });
  }
  app.get('*', (req, res) => {
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
