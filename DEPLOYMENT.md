# 🚀 Руководство по деплою CallAI App

## 📋 Подготовка к деплою

### 1. Проверьте локальную сборку
```bash
npm run build
npm start
```

### 2. Подготовьте GitHub репозиторий
```bash
git add .
git commit -m "Production ready"
git push origin main
```

## 🌐 Варианты хостинга

### 🔥 Vercel (Рекомендуется)

**Преимущества:**
- Автоматический деплой из GitHub
- Встроенная PostgreSQL (Vercel Postgres)
- Бесплатный план
- CDN и оптимизации из коробки

**Пошаговая инструкция:**

1. **Создайте аккаунт на Vercel.com**
2. **Подключите GitHub репозиторий:**
   - Import project → выберите ваш репозиторий
   - Framework: Next.js (автоматически определится)
   
3. **Настройте базу данных:**
   - В Vercel Dashboard → Storage → Create Database → Postgres
   - Скопируйте DATABASE_URL из настроек

4. **Добавьте переменные окружения:**
   ```
   DATABASE_URL=postgresql://[из Vercel Postgres]
   NEXTAUTH_SECRET=[сгенерируйте: openssl rand -base64 32]
   NEXTAUTH_URL=https://your-app.vercel.app
   N8N_WEBHOOK_URL=https://your-n8n-instance.com/webhook/callai
   N8N_WEBHOOK_SECRET=your-webhook-secret
   ```

5. **Настройте автодеплой:**
   - Vercel автоматически деплоит при push в main
   - Добавьте VERCEL_TOKEN в GitHub Secrets для CI/CD

### 🚂 Railway

**Преимущества:**
- Простая настройка
- Встроенная PostgreSQL
- $5/месяц за все

**Пошаговая инструкция:**

1. **Зарегистрируйтесь на Railway.app**
2. **Создайте новый проект:**
   - Deploy from GitHub repo
   - Выберите ваш репозиторий

3. **Добавьте PostgreSQL:**
   - Add service → Database → PostgreSQL
   - Railway автоматически создаст DATABASE_URL

4. **Настройте переменные окружения:**
   - Variables → Add переменные из .env.production.example

5. **Настройте домен:**
   - Settings → Domains → Generate Domain

## 🔧 Настройка CI/CD

### GitHub Actions (уже настроен)

**Секреты, которые нужно добавить в GitHub:**
- Settings → Secrets and variables → Actions

```
VERCEL_TOKEN - токен Vercel CLI
RAILWAY_TOKEN - токен Railway CLI  
```

### Автоматические миграции

При деплое автоматически выполнится:
1. `npm install`
2. `prisma generate`
3. `npm run build`
4. `prisma migrate deploy` (в production)

## 🛠 Команды для управления

### Локальная разработка
```bash
npm run dev          # Запуск dev сервера
npm run build        # Сборка для production
npm run db:migrate   # Применить миграции
npm run db:seed      # Заполнить базу тестовыми данными
```

### Production управление
```bash
npm run db:deploy    # Применить миграции в production
npm run db:reset:prod # Сброс базы данных (ОСТОРОЖНО!)
npm run clean        # Очистка проекта
npm run size         # Проверка размера
```

### Docker (альтернативный деплой)
```bash
npm run docker:build # Собрать Docker образ
npm run docker:run   # Запустить контейнер
```

## 🔄 Процесс обновления

### Автоматический (через Git)
1. Внесите изменения в код
2. Коммит и push в main ветку
3. Vercel/Railway автоматически деплоит

```bash
git add .
git commit -m "Описание изменений"
git push origin main
# 🎉 Автоматический деплой!
```

### Ручное обновление (если нужно)
```bash
# Для Vercel
vercel --prod

# Для Railway
railway up
```

## 📊 Мониторинг

### Health Check
- URL: `https://your-app.com/api/health`
- Проверяет подключение к базе данных
- Возвращает статус приложения

### Логи
- **Vercel:** Dashboard → Functions → View Logs
- **Railway:** Dashboard → Deployments → View Logs

## 🔒 Безопасность

### Обязательно настройте:
1. **NEXTAUTH_SECRET** - уникальный ключ для сессий
2. **DATABASE_URL** - безопасное подключение к БД
3. **N8N_WEBHOOK_SECRET** - защищенный webhook
4. **Переменные окружения** - никогда не коммитьте в Git

### Рекомендации:
- Используйте HTTPS (автоматически в Vercel/Railway)
- Настройте CORS для API
- Регулярно обновляйте зависимости

## 📈 Масштабирование

### При росте нагрузки:
1. **Database:** Перейдите на Supabase или PlanetScale
2. **Caching:** Добавьте Redis
3. **CDN:** Vercel/Railway включают автоматически
4. **Monitoring:** Добавьте Sentry для отслеживания ошибок

## 🆘 Troubleshooting

### Частые проблемы:

**Build fails:**
```bash
# Проверьте локально
npm run build
npx tsc --noEmit
```

**Database connection:**
- Проверьте DATABASE_URL
- Убедитесь что миграции применены

**Environment variables:**
- Проверьте все переменные в dashboard
- NEXTAUTH_URL должен совпадать с доменом

## 📞 Поддержка

При проблемах проверьте:
1. Health check: `/api/health`
2. Логи в dashboard провайдера
3. GitHub Actions результаты
4. Database connectivity

---

🎉 **Готово!** Теперь ваше приложение автоматически обновляется при каждом push в main ветку!
