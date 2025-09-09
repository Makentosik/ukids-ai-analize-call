import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('🌱 Создание пользователя-администратора...');

    // Хешируем пароль
    const hashedPassword = await bcrypt.hash('admin123', 12);

    // Создаём пользователя-администратора
    const admin = await prisma.user.upsert({
      where: { email: 'admin@localhost' },
      update: {},
      create: {
        email: 'admin@localhost',
        name: 'Администратор',
        passwordHash: hashedPassword,
        role: 'ADMIN',
      },
    });

    console.log('✅ Создан пользователь:', admin);
    console.log('📧 Email: admin@localhost');
    console.log('🔑 Пароль: admin123');
  } catch (error) {
    console.error('❌ Ошибка:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
