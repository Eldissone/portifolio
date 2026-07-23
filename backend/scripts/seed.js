// scripts/seed.js
import pkg from '@prisma/client';
const { PrismaClient } = pkg;
import bcrypt from 'bcryptjs';
const prisma = new PrismaClient();

const DEFAULT_SERVICES = [
  {
    title: 'Domínio + Email Profissional',
    description: 'Compra, configuração de domínio e criação de emails com o teu nome.',
    priceKz: '55 000 Kz',
    priceEur: '50 €',
    delivery: '2 a 6 dias',
    features: ['Registo do domínio (.com, .ao, .net)', 'Até 5 emails profissionais', 'Configuração DNS incluída'],
    isFeatured: false,
  },
  {
    title: 'Site Institucional',
    description: 'Sites profissionais para apresentar a tua empresa ou marca pessoal.',
    priceKz: '660 000 Kz',
    priceEur: '600 €',
    delivery: '2 a 4 semanas',
    features: ['Design responsivo (mobile/desktop)', 'Até 6 páginas', 'SEO básico optimizado', 'Formulário de contacto', '1 mês de suporte incluído'],
    isFeatured: true,
  },
  {
    title: 'Plataforma de Gestão',
    description: 'Sistemas web para gerir o teu negócio (clientes, stock, facturas).',
    priceKz: '2 750 000 Kz',
    priceEur: '2 500 €',
    delivery: '6 a 12 semanas',
    features: ['Painel administrativo completo', 'Autenticação e perfis de utilizador', 'Relatórios e exportação PDF', 'API REST integrada'],
    isFeatured: false,
  },
  {
    title: 'Landing Page',
    description: 'Página de alta conversão para captar leads, vender produtos ou promover eventos.',
    priceKz: '220 000 Kz',
    priceEur: '200 €',
    delivery: '1 a 2 semanas',
    features: ['Design premium focado em conversão', 'Integração com WhatsApp', 'Optimização para Google'],
    isFeatured: false,
  },
  {
    title: 'App com Integração de IA',
    description: 'Aplicações web com funcionalidades de inteligência artificial — chatbots, análise e automação.',
    priceKz: '3 300 000 Kz',
    priceEur: '3 000 €',
    delivery: '8 a 16 semanas',
    features: ['Integração com GPT / Gemini', 'Análise automática de dados', 'Relatórios inteligentes'],
    isFeatured: false,
  },
  {
    title: 'Consultoria & Mentoria',
    description: 'Sessões de consultoria técnica para startups, developers e empreendedores digitais.',
    priceKz: '55 000 Kz/h',
    priceEur: '50 €/h',
    delivery: 'Flexível — presencial ou remoto',
    features: ['Auditoria de código e arquitectura', 'Estratégia de produto digital', 'Mentoria para developers'],
    isFeatured: false,
  },
];

async function seedServices() {
  for (const [index, service] of DEFAULT_SERVICES.entries()) {
    const data = { ...service, order: index };
    const existing = await prisma.service.findFirst({ where: { title: service.title } });

    if (existing) {
      await prisma.service.update({ where: { id: existing.id }, data });
      console.log('Serviço actualizado:', service.title);
    } else {
      await prisma.service.create({ data });
      console.log('Serviço criado:', service.title);
    }
  }
}

async function main() {
  const hashedPassword = await bcrypt.hash('admin123', 10);
  
  const admin = await prisma.user.upsert({
    where: { email: 'admin@eldissone.dev' },
    update: {},
    create: {
      email: 'admin@eldissone.dev',
      name: 'Admin',
      password: hashedPassword,
    },
  });

  console.log('Admin user created/verified:', admin.email);

  await seedServices();
  console.log(`${DEFAULT_SERVICES.length} serviços registados na base de dados.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
