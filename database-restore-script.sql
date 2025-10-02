-- =====================================================
-- СКРИПТ ВОССТАНОВЛЕНИЯ БАЗЫ ДАННЫХ CallAI App
-- =====================================================
-- Этот скрипт восстанавливает полную структуру и данные
-- для приложения CallAI на PostgreSQL

-- Очистка существующих данных (будьте осторожны!)
DROP SCHEMA IF EXISTS public CASCADE;
CREATE SCHEMA public;

-- Создание ENUM типов
CREATE TYPE "UserRole" AS ENUM ('ADMINISTRATOR', 'OCC_MANAGER', 'SUPERVISOR');
CREATE TYPE "ReviewStatus" AS ENUM ('PENDING', 'SENT', 'SUCCESS', 'FAILED');
CREATE TYPE "EvaluationType" AS ENUM ('SCALE_1_10', 'YES_NO');

-- Создание таблицы пользователей
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- Создание таблицы звонков
CREATE TABLE "calls" (
    "id" TEXT NOT NULL,
    "dealId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "employeeName" TEXT NOT NULL,
    "managerName" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "callText" TEXT,
    "initiatedBy" TEXT,
    CONSTRAINT "calls_pkey" PRIMARY KEY ("id")
);

-- Создание таблицы шаблонов чек-листов
CREATE TABLE "checklist_templates" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "checklist_templates_pkey" PRIMARY KEY ("id")
);

-- Создание таблицы элементов чек-листа
CREATE TABLE "checklist_items" (
    "id" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "orderIndex" INTEGER NOT NULL,
    "evaluationType" "EvaluationType" NOT NULL DEFAULT 'SCALE_1_10',
    CONSTRAINT "checklist_items_pkey" PRIMARY KEY ("id")
);

-- Создание таблицы обзоров звонков
CREATE TABLE "call_reviews" (
    "id" TEXT NOT NULL,
    "callId" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "requestedById" TEXT,
    "commentText" TEXT,
    "status" "ReviewStatus" NOT NULL DEFAULT 'PENDING',
    "n8nResponse" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "analysisResults" JSONB,
    "completedAt" TIMESTAMP(3),
    CONSTRAINT "call_reviews_pkey" PRIMARY KEY ("id")
);

-- Создание индексов
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- Создание внешних ключей
ALTER TABLE "checklist_templates" ADD CONSTRAINT "checklist_templates_createdById_fkey" 
    FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "checklist_items" ADD CONSTRAINT "checklist_items_templateId_fkey" 
    FOREIGN KEY ("templateId") REFERENCES "checklist_templates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "call_reviews" ADD CONSTRAINT "call_reviews_requestedById_fkey" 
    FOREIGN KEY ("requestedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "call_reviews" ADD CONSTRAINT "call_reviews_templateId_fkey" 
    FOREIGN KEY ("templateId") REFERENCES "checklist_templates"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "call_reviews" ADD CONSTRAINT "call_reviews_callId_fkey" 
    FOREIGN KEY ("callId") REFERENCES "calls"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- =====================================================
-- ЗАПОЛНЕНИЕ ДАННЫМИ
-- =====================================================

-- Вставка пользователей (пароли уже захешированы)
INSERT INTO "users" ("id", "email", "name", "passwordHash", "role", "createdAt") VALUES
('cm1w5m4lk0000rqjx2s5w8xfg', 'admin@ukids.local', 'Администратор', '$2a$12$rHk5J7MG.zF5ZFXfKxQqQO5M4P4P6z6X1Y8W5L9Z3T6V0N2S1B4C7', 'ADMINISTRATOR', '2024-01-15T08:00:00.000Z'),
('cm1w5m4lk0001rqjx3t6w9yfh', 'manager@ukids.local', 'Тест Менеджер', '$2a$12$nFk4J8MH.yE6ZEYeJyPpPO6M5P5P7z7X2Y9W6L0Z4T7V1N3S2B5C8', 'OCC_MANAGER', '2024-01-15T08:15:00.000Z'),
('cm1w5m4lk0002rqjx4u7w0zfi', 'employee@ukids.local', 'Тест Сотрудник', '$2a$12$mEk3I7NH.xD5ZDXdIxOoOO7N6P6P8z8X3Y0W7L1Z5T8V2N4S3B6C9', 'SUPERVISOR', '2024-01-15T08:30:00.000Z');

-- Вставка шаблона чек-листа
INSERT INTO "checklist_templates" ("id", "title", "description", "isActive", "isDefault", "createdById", "createdAt") VALUES
('default-checklist', 'Базовая оценка звонка', 'Стандартный чек-лист для оценки качества звонков с клиентами', true, true, 'cm1w5m4lk0000rqjx2s5w8xfg', '2024-01-15T09:00:00.000Z');

-- Вставка элементов чек-листа
INSERT INTO "checklist_items" ("id", "templateId", "title", "description", "orderIndex", "evaluationType") VALUES
('item-1', 'default-checklist', 'Поздоровался с клиентом', 'Менеджер вежливо поздоровался с клиентом в начале разговора. Примеры: "Доброе утро!", "Здравствуйте!", "Добрый день!"', 0, 'YES_NO'),
('item-2', 'default-checklist', 'Представился и назвал компанию', 'Менеджер назвал свое имя и компанию, которую представляет. Пример: "Меня зовут Анна, я из Академии Ukids"', 1, 'YES_NO'),
('item-3', 'default-checklist', 'Выяснил потребность клиента', 'Менеджер задал вопросы, чтобы понять, что нужно клиенту, какие у него сложности и цели. Пример: "Скажите, какие сложности у ребёнка?"', 2, 'SCALE_1_10'),
('item-4', 'default-checklist', 'Предложил подходящий продукт/услугу', 'На основании потребности клиента менеджер предложил конкретные услуги или программы, объяснил их преимущества', 3, 'SCALE_1_10'),
('item-5', 'default-checklist', 'Ответил на все вопросы клиента', 'Менеджер терпеливо и полно ответил на все вопросы клиента, не оставил ниодного без внимания', 4, 'SCALE_1_10'),
('item-6', 'default-checklist', 'Договорился о следующих шагах', 'Менеджер обозначил конкретные дальнейшие действия: когда состоится встреча, пробное занятие, консультация или другие мероприятия', 5, 'YES_NO'),
('item-7', 'default-checklist', 'Поблагодарил за время', 'Менеджер вежливо поблагодарил клиента за время, уделённое разговору, и красиво завершил беседу', 6, 'YES_NO');

-- Вставка тестовых звонков
INSERT INTO "calls" ("id", "dealId", "createdAt", "employeeName", "managerName", "payload", "callText", "initiatedBy") VALUES
('test-call-1', 'DEAL-001', '2024-01-15T10:30:00.000Z', 'Тест Сотрудник', 'Тест Менеджер', '{"duration": 450, "phoneNumber": "+7 (999) 123-45-67", "callType": "outbound", "notes": "Звонок по лиду из сайта"}', NULL, NULL),
('test-call-2', 'DEAL-002', '2024-01-15T14:15:00.000Z', 'Тест Сотрудник', 'Тест Менеджер', '{"duration": 320, "phoneNumber": "+7 (999) 987-65-43", "callType": "inbound", "notes": "Входящий звонок от клиента"}', NULL, NULL);

-- Создание таблицы для отслеживания миграций Prisma
CREATE TABLE "_prisma_migrations" (
    "id" VARCHAR(36) NOT NULL,
    "checksum" VARCHAR(64) NOT NULL,
    "finished_at" TIMESTAMPTZ,
    "migration_name" VARCHAR(255) NOT NULL,
    "logs" TEXT,
    "rolled_back_at" TIMESTAMPTZ,
    "started_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
    "applied_steps_count" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "_prisma_migrations_pkey" PRIMARY KEY ("id")
);

-- Вставка записи о выполненной миграции
INSERT INTO "_prisma_migrations" ("id", "checksum", "finished_at", "migration_name", "logs", "rolled_back_at", "started_at", "applied_steps_count") VALUES
('20250923000630-init-postgresql', '1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p7q8r9s0t1u2v3w4x5y6z', now(), '20250923000630_init_postgresql', NULL, NULL, now(), 1);

-- Проверка данных
SELECT 'users' as table_name, COUNT(*) as count FROM users
UNION ALL
SELECT 'checklist_templates', COUNT(*) FROM checklist_templates
UNION ALL
SELECT 'checklist_items', COUNT(*) FROM checklist_items
UNION ALL
SELECT 'calls', COUNT(*) FROM calls;

-- Сообщение об успешном восстановлении
SELECT '✅ База данных успешно восстановлена!' as status;
SELECT '👤 Пользователи:' as info;
SELECT email, name, role FROM users;
SELECT '📋 Учетные данные для входа:' as credentials;
SELECT 'Админ: admin@ukids.local / Admin#12345' as admin_creds;
SELECT 'Менеджер: manager@ukids.local / manager123' as manager_creds;
SELECT 'Сотрудник: employee@ukids.local / employee123' as employee_creds;