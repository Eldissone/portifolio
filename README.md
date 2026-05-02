# Portfolio EV — Full Stack

Este projecto está dividido em duas partes principais:

## 📁 Estrutura
- **`/frontend`**: Interface do utilizador (Vite, Vue, HTML/CSS).
- **`/backend`**: API e Base de Dados (Express, Prisma, PostgreSQL).

## 🚀 Como Executar

### 1. Instalação
Na raiz do projecto, executa:
```bash
npm run install:all
```

### 2. Base de Dados
Configura o `.env` dentro da pasta `/backend` e depois executa:
```bash
npm run db:push
npm run db:seed
```

### 3. Desenvolvimento
Para iniciar ambas as partes:
- Frontend: `npm run dev:frontend`
- Backend: `npm run dev:backend`
