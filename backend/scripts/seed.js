// scripts/seed.js
import pkg from '@prisma/client';
const { PrismaClient } = pkg;
import bcrypt from 'bcryptjs';
const prisma = new PrismaClient();

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
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
