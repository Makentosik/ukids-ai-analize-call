import { z } from 'zod';

// Схема для входящего webhook от n8n
export const n8nCallWebhookSchema = z.object({
  id: z.string().min(1, 'ID обязателен'),
  deal_id: z.string().min(1, 'ID сделки обязателен'),
  created_at: z.string().optional(),
  employe: z.string().min(1, 'Имя сотрудника обязательно'),
  employe_rug: z.string().min(1, 'Имя руководителя обязательно'),
  initiated_by: z.string().optional(), // Кто запустил бизнес-процесс в Б24
  call_text: z.string().optional(), // Текст звонка (расшифровка)
  // Дополнительные поля могут быть добавлены в payload
}).passthrough(); // Разрешаем дополнительные поля

// Схема для отправки в n8n
export const sendToN8nSchema = z.object({
  id: z.string(),
  text: z.string().optional(),
  checklist: z.array(z.object({
    title: z.string(),
    description: z.string().optional(),
    evaluationType: z.enum(['SCALE_1_10', 'YES_NO']), // Убираем optional() - это поле обязательное
  })),
  reviewId: z.string().optional(),
});

// Схема для поиска и фильтрации звонков
export const callsSearchSchema = z.object({
  search: z.string().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  sortBy: z.enum(['createdAt', 'dealId', 'employeeName']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// Схема для создания проверки звонка
export const createCallReviewSchema = z.object({
  templateId: z.string().min(1, 'Выберите чек-лист'),
  commentText: z.string().optional(),
});

// Схема для создания чек-листа
export const createChecklistSchema = z.object({
  name: z.string().min(1, 'Название обязательно').max(200, 'Максимум 200 символов'),
  description: z.string().optional().nullable(),
  isActive: z.boolean().default(true),
  items: z.array(z.object({
    text: z.string().min(1, 'Заголовок элемента обязателен').max(200, 'Максимум 200 символов'),
    description: z.string().optional().nullable().refine(
      (val) => !val || val.length <= 500, 
      { message: 'Описание не может быть длиннее 500 символов' }
    ),
    orderIndex: z.number().int().min(0),
    evaluationType: z.enum(['SCALE_1_10', 'YES_NO']).default('SCALE_1_10'),
  })).min(1, 'Добавьте хотя бы один элемент'),
});

// Схема для создания пользователя (админ панель)
export const createUserSchema = z.object({
  email: z.string().email('Неверный формат email'),
  name: z.string().min(1, 'Имя обязательно').max(100, 'Максимум 100 символов'),
  password: z.string().min(6, 'Минимум 6 символов').max(100, 'Максимум 100 символов'),
  role: z.enum(['ADMINISTRATOR', 'OCC_MANAGER', 'SUPERVISOR'], {
    message: 'Выберите роль пользователя',
  }),
});

// Схема для обновления профиля
export const updateProfileSchema = z.object({
  name: z.string().min(1, 'Имя обязательно').max(100, 'Максимум 100 символов'),
  email: z.string().email('Неверный формат email'),
});

// Схема для смены пароля
export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Укажите текущий пароль'),
  newPassword: z.string().min(6, 'Минимум 6 символов').max(100, 'Максимум 100 символов'),
  confirmPassword: z.string().min(1, 'Подтвердите пароль'),
}).refine(data => data.newPassword === data.confirmPassword, {
  message: 'Пароли не совпадают',
  path: ['confirmPassword'],
});

// Схема для получения результатов анализа от n8n
export const n8nResultsSchema = z.object({
  id: z.string().min(1, 'ID обязателен').optional(), // ID звонка или проверки
  ok: z.boolean(),
  checklist: z.array(z.object({
    step: z.string(),
    description: z.string().optional(),
    evaluationType: z.enum(['SCALE_1_10', 'YES_NO']), // Убираем optional() - это поле важно для анализа
    done: z.boolean().optional(), // Для YES_NO типов
    score: z.number().min(1).max(10).optional(), // Для SCALE_1_10 типов
    evidence: z.string().optional(),
  })).optional(),
  triggers: z.array(z.string()).optional(),
  recommendations: z.array(z.string()).optional(),
  stats: z.object({
    total: z.number(),
    done: z.number(),
    notDone: z.number(),
    unknown: z.number(),
  }).optional(),
  markdown: z.string().optional(),
  original: z.object({
    id: z.string(),
    results: z.array(z.object({
      step: z.string(),
      description: z.string().optional(),
      evaluationType: z.enum(['SCALE_1_10', 'YES_NO']), // Также убираем optional()
      done: z.boolean().optional(), // Для YES_NO типов
      score: z.number().min(1).max(10).optional(), // Для SCALE_1_10 типов
      evidence: z.string().optional(),
    })),
    summary: z.string().optional(),
  }).optional(),
  reviewId: z.string().optional(), // ID проверки для обновления
});

// Типы для TypeScript
export type N8nCallWebhook = z.infer<typeof n8nCallWebhookSchema>;
export type SendToN8nPayload = z.infer<typeof sendToN8nSchema>;
export type N8nResults = z.infer<typeof n8nResultsSchema>;
export type CallsSearchParams = z.infer<typeof callsSearchSchema>;
export type CreateCallReview = z.infer<typeof createCallReviewSchema>;
export type CreateChecklist = z.infer<typeof createChecklistSchema>;
export type CreateUser = z.infer<typeof createUserSchema>;
export type UpdateProfile = z.infer<typeof updateProfileSchema>;
export type ChangePassword = z.infer<typeof changePasswordSchema>;

// Утилиты для валидации дат
export const parseDateString = (dateStr?: string): Date | undefined => {
  if (!dateStr) return undefined;
  
  const parsed = new Date(dateStr);
  if (isNaN(parsed.getTime())) {
    return undefined;
  }
  
  return parsed;
};

// Функция для безопасного парсинга JSON
export const safeJsonParse = (jsonString: string): any => {
  try {
    return JSON.parse(jsonString);
  } catch {
    return null;
  }
};
