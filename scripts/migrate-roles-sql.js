const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function migrateUserRolesSql() {
  console.log('🚀 Начинаем SQL миграцию ролей пользователей...');

  try {
    // Получаем текущее состояние
    console.log('\n📋 Текущие роли:');
    const currentRoles = await prisma.$queryRaw`SELECT role, COUNT(*) as count FROM users GROUP BY role`;
    console.log(currentRoles);

    // Обновляем роли напрямую через SQL
    console.log('\n🔄 Обновляем роли...');
    
    const adminUpdated = await prisma.$executeRaw`UPDATE users SET role = 'ADMINISTRATOR' WHERE role = 'ADMIN'`;
    console.log(`✅ Обновлено ADMIN → ADMINISTRATOR: ${adminUpdated} записей`);

    const managerUpdated = await prisma.$executeRaw`UPDATE users SET role = 'OCC_MANAGER' WHERE role = 'MANAGER'`;
    console.log(`✅ Обновлено MANAGER → OCC_MANAGER: ${managerUpdated} записей`);

    const employeeUpdated = await prisma.$executeRaw`UPDATE users SET role = 'SUPERVISOR' WHERE role = 'EMPLOYEE'`;
    console.log(`✅ Обновлено EMPLOYEE → SUPERVISOR: ${employeeUpdated} записей`);

    // Проверяем результат
    console.log('\n📊 Роли после миграции:');
    const finalRoles = await prisma.$queryRaw`SELECT role, COUNT(*) as count FROM users GROUP BY role`;
    console.log(finalRoles);

  } catch (error) {
    console.error('❌ Ошибка при миграции:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Запускаем миграцию
migrateUserRolesSql()
  .then(() => {
    console.log('\n✨ SQL миграция успешно завершена!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 SQL миграция завершилась с ошибкой:', error);
    process.exit(1);
  });
