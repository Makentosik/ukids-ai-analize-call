# API автоматической обработки входящих звонков

## Обзор

Система автоматической обработки входящих звонков обеспечивает полный цикл:
1. Получение данных о звонке от внешних систем
2. Автоматический поиск активного дефолтного чек-листа  
3. Создание задачи на анализ
4. Отправка в n8n для AI-анализа
5. Получение и сохранение результатов анализа
6. Уведомление внешних систем о завершении

## Эндпоинты

### POST /api/incoming-call

**Описание**: Получает данные входящего звонка, создает запись в базе и автоматически запускает процесс анализа.

**Структура входящих данных**:
```json
{
  "call_id": "unique_id",           // Обязательно: уникальный ID звонка  
  "phone_number": "+1234567890",   // Опционально: номер телефона
  "duration": 300,                 // Опционально: длительность в секундах
  "transcription": "текст расшифровки звонка", // Опционально: текст звонка
  "timestamp": "2025-09-09T10:00:00Z"          // Обязательно: время звонка в ISO format
}
```

**Алгоритм обработки**:
1. Создание/обновление записи Call в базе данных
2. Поиск активного дефолтного чек-листа (isActive: true, isDefault: true)
3. Создание CallReview записи со статусом PENDING
4. Отправка данных в n8n для AI-анализа
5. Отправка уведомления на внешний webhook

**Ответ при успехе (201)**:
```json
{
  "success": true,
  "call": {
    "id": "test-incoming-20250909-120203",
    "dealId": "UNKNOWN",  
    "createdAt": "2025-09-09T12:02:03.000Z",
    "employeeName": "Тест Сотрудник",
    "managerName": "Тест Менеджер", 
    "payload": {
      "callType": "inbound",
      "duration": 300,
      "phoneNumber": "+1234567890"
    },
    "callText": "Тестовый звонок...",
    "reviews": [...]
  },
  "review": {
    "id": "cmfcbnt170001v8r49wjukscg",
    "callId": "test-incoming-20250909-120203", 
    "templateId": "default-checklist",
    "status": "SUCCESS|FAILED|PENDING",
    "createdAt": "2025-09-09T09:02:05.753Z",
    "template": {
      "title": "Базовая оценка звонка"
    }
  }
}
```

### POST /api/incoming-call/results

**Описание**: Получает результаты анализа от n8n и обновляет CallReview, затем отправляет финальное уведомление.

**Структура входящих данных**:
```json
{
  "reviewId": "cmfcbnt170001v8r49wjukscg",  // ID созданной ранее CallReview записи
  "status": "success",                      // "success" | "failed"  
  "analysisResults": {                      // Результаты анализа от AI
    "scores": [
      {
        "itemTitle": "Поздоровался с клиентом",
        "evaluationType": "YES_NO",
        "result": "YES",
        "confidence": 0.95
      },
      {
        "itemTitle": "Выяснил потребность клиента", 
        "evaluationType": "SCALE_1_10",
        "score": 8,
        "confidence": 0.87
      }
    ],
    "overallScore": 7.5,
    "summary": "Звонок прошел хорошо, менеджер следовал скрипту"
  }
}
```

**Ответ при успехе (200)**:
```json
{
  "success": true,
  "message": "Результаты анализа успешно сохранены",
  "review": {
    "id": "cmfcbnt170001v8r49wjukscg",
    "status": "SUCCESS",
    "analysisResults": {...},
    "completedAt": "2025-09-09T12:05:30.000Z",
    "call": {...},
    "template": {...}
  }
}
```

## Интеграция с n8n

### Отправка на анализ

**URL**: Определяется переменной окружения `N8N_WEBHOOK_URL`  
**По умолчанию**: `https://miquenaluekos.beget.app/webhook/callai`

**Payload для n8n**:
```json
{
  "id": "call-id",
  "text": "расшифровка звонка",
  "checklist": [
    {
      "title": "Поздоровался с клиентом",
      "description": "Менеджер вежливо поздоровался...", 
      "evaluationType": "YES_NO"
    }
  ],
  "reviewId": "review-id-для-обратной-связи"
}
```

### Получение результатов

n8n должен отправить результаты анализа на `/api/incoming-call/results` (см. выше).

## Уведомления внешних систем

После завершения анализа система отправляет уведомление на:  
`https://miquenaluekos.beget.app/webhook/callai`

**Payload уведомления**:
```json
{
  "type": "analysis_completed",
  "callId": "call-id",
  "reviewId": "review-id", 
  "status": "SUCCESS|FAILED",
  "analysisResults": {...},
  "call": {
    "id": "call-id",
    "dealId": "DEAL-001",
    "employeeName": "Имя сотрудника",
    "managerName": "Имя менеджера", 
    "createdAt": "2025-09-09T10:00:00Z",
    "payload": {...}
  },
  "template": {
    "title": "Название чек-листа",
    "items": [...]
  },
  "completedAt": "2025-09-09T12:05:30.000Z"
}
```

## Требования

1. **Активный дефолтный чек-лист**: В системе должен быть хотя бы один чек-лист с `isActive: true` и `isDefault: true`
2. **Переменные окружения**:
   - `N8N_WEBHOOK_URL` - URL для отправки данных в n8n
   - `DATABASE_URL` - подключение к базе данных PostgreSQL
3. **Структура базы данных**: Требуются таблицы `calls`, `call_reviews`, `checklist_templates`, `checklist_items`

## Тестирование

```bash
# Тест создания входящего звонка
curl -X POST http://localhost:3000/api/incoming-call \
  -H "Content-Type: application/json" \
  -d '{
    "call_id": "test-incoming-123",
    "phone_number": "+1234567890", 
    "duration": 300,
    "transcription": "Тестовый звонок для проверки",
    "timestamp": "2025-09-09T12:00:00Z"
  }'

# Тест получения результатов (заменить reviewId на реальный)
curl -X POST http://localhost:3000/api/incoming-call/results \
  -H "Content-Type: application/json" \
  -d '{
    "reviewId": "cmfcbnt170001v8r49wjukscg",
    "status": "success",
    "analysisResults": {
      "scores": [
        {
          "itemTitle": "Поздоровался с клиентом",
          "evaluationType": "YES_NO", 
          "result": "YES",
          "confidence": 0.95
        }
      ],
      "overallScore": 8.5
    }
  }'
```

## Логирование

Все операции логируются в консоль сервера с префиксами:
- `📥` - получение входящих данных  
- `✅` - успешные операции
- `📤` - отправка внешних уведомлений
- `⚠️` - предупреждения
- `❌` - ошибки
