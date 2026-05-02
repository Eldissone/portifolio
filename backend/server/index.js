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

dotenv.config();

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key';

// Ensure upload directory exists
const uploadDir = 'uploads';
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

// Multer Storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`)
});
const upload = multer({ storage });

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));

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

// Upload Route
app.post('/api/upload', authenticate, upload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Nenhuma imagem enviada' });
  res.json({ imageUrl: `/uploads/${req.file.filename}` });
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

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
