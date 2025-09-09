import { PrismaClient, UserRole, EvaluationType } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Запуск сидинга базы данных...');

  // Хэшируем пароль для админа
  const hashedPassword = await bcrypt.hash('Admin#12345', 12);

  // Создаем администратора
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@ukids.local' },
    update: {},
    create: {
      email: 'admin@ukids.local',
      name: 'Администратор',
      passwordHash: hashedPassword,
      role: UserRole.ADMINISTRATOR,
    },
  });

  console.log('✅ Создан пользователь-администратор:', adminUser);

  // Создаем тестового менеджера
  const managerPassword = await bcrypt.hash('manager123', 12);
  const managerUser = await prisma.user.upsert({
    where: { email: 'manager@ukids.local' },
    update: {},
    create: {
      email: 'manager@ukids.local',
      name: 'Тест Менеджер',
      passwordHash: managerPassword,
      role: UserRole.OCC_MANAGER,
    },
  });

  console.log('✅ Создан пользователь-менеджер:', managerUser);

  // Создаем тестового сотрудника
  const employeePassword = await bcrypt.hash('employee123', 12);
  const employeeUser = await prisma.user.upsert({
    where: { email: 'employee@ukids.local' },
    update: {},
    create: {
      email: 'employee@ukids.local',
      name: 'Тест Сотрудник',
      passwordHash: employeePassword,
      role: UserRole.SUPERVISOR,
    },
  });

  console.log('✅ Создан пользователь-сотрудник:', employeeUser);

  // Создаем базовый чек-лист для оценки звонков
  const baseChecklist = await prisma.checklistTemplate.upsert({
    where: { id: 'default-checklist' },
    update: {},
    create: {
      id: 'default-checklist',
      title: 'Базовая оценка звонка',
      description: 'Стандартный чек-лист для оценки качества звонков с клиентами',
      isActive: true,
      isDefault: true,
      createdById: adminUser.id,
      items: {
        create: [
          {
            title: 'Поздоровался с клиентом',
            description: 'Менеджер вежливо поздоровался с клиентом в начале разговора. Примеры: "Доброе утро!", "Здравствуйте!", "Добрый день!"',
            orderIndex: 0,
            evaluationType: EvaluationType.YES_NO,
          },
          {
            title: 'Представился и назвал компанию',
            description: 'Менеджер назвал свое имя и компанию, которую представляет. Пример: "Меня зовут Анна, я из Академии Ukids"',
            orderIndex: 1,
            evaluationType: EvaluationType.YES_NO,
          },
          {
            title: 'Выяснил потребность клиента',
            description: 'Менеджер задал вопросы, чтобы понять, что нужно клиенту, какие у него сложности и цели. Пример: "Скажите, какие сложности у ребёнка?"',
            orderIndex: 2,
            evaluationType: EvaluationType.SCALE_1_10,
          },
          {
            title: 'Предложил подходящий продукт/услугу',
            description: 'На основании потребности клиента менеджер предложил конкретные услуги или программы, объяснил их преимущества',
            orderIndex: 3,
            evaluationType: EvaluationType.SCALE_1_10,
          },
          {
            title: 'Ответил на все вопросы клиента',
            description: 'Менеджер терпеливо и полно ответил на все вопросы клиента, не оставил ниодного без внимания',
            orderIndex: 4,
            evaluationType: EvaluationType.SCALE_1_10,
          },
          {
            title: 'Договорился о следующих шагах',
            description: 'Менеджер обозначил конкретные дальнейшие действия: когда состоится встреча, пробное занятие, консультация или другие мероприятия',
            orderIndex: 5,
            evaluationType: EvaluationType.YES_NO,
          },
          {
            title: 'Поблагодарил за время',
            description: 'Менеджер вежливо поблагодарил клиента за время, уделённое разговору, и красиво завершил беседу',
            orderIndex: 6,
            evaluationType: EvaluationType.YES_NO,
          },
        ],
      },
    },
    include: {
      items: true,
    },
  });

  console.log('✅ Создан базовый чек-лист:', baseChecklist);

  // Создаем тестовые звонки
  const testCall1 = await prisma.call.upsert({
    where: { id: 'test-call-1' },
    update: {},
    create: {
      id: 'test-call-1',
      dealId: 'DEAL-001',
      createdAt: new Date('2024-01-15T10:30:00Z'),
      employeeName: 'Тест Сотрудник',
      managerName: 'Тест Менеджер',
      payload: {
        duration: 450,
        phoneNumber: '+7 (999) 123-45-67',
        callType: 'outbound',
        notes: 'Звонок по лиду из сайта'
      },
    },
  });

  const testCall2 = await prisma.call.upsert({
    where: { id: 'test-call-2' },
    update: {},
    create: {
      id: 'test-call-2',
      dealId: 'DEAL-002',
      createdAt: new Date('2024-01-15T14:15:00Z'),
      employeeName: 'Тест Сотрудник',
      managerName: 'Тест Менеджер',
      payload: {
        duration: 320,
        phoneNumber: '+7 (999) 987-65-43',
        callType: 'inbound',
        notes: 'Входящий звонок от клиента'
      },
    },
  });

  console.log('✅ Созданы тестовые звонки:', [testCall1, testCall2]);

  console.log('🎉 Сидинг базы данных завершен успешно!');
}

main()
  .catch((e) => {
    console.error('❌ Ошибка при сидинге:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
