# Скрипт для очистки проекта CallAI
Write-Host "Начинаем очистку проекта..." -ForegroundColor Green

# Очистка npm кеша
Write-Host "Очистка npm кеша..." -ForegroundColor Yellow
npm cache clean --force

# Удаление папки сборки
Write-Host "Удаление папки .next..." -ForegroundColor Yellow
Remove-Item -Recurse -Force .next -ErrorAction SilentlyContinue

# Удаление временных файлов TypeScript
Write-Host "Удаление временных файлов TypeScript..." -ForegroundColor Yellow
Remove-Item -Force *.tsbuildinfo -ErrorAction SilentlyContinue

# Очистка логов
Write-Host "Удаление логов..." -ForegroundColor Yellow
Remove-Item -Force npm-debug.log* -ErrorAction SilentlyContinue
Remove-Item -Force yarn-debug.log* -ErrorAction SilentlyContinue
Remove-Item -Force yarn-error.log* -ErrorAction SilentlyContinue

# Подсчет размера после очистки
Write-Host "Подсчет текущего размера проекта..." -ForegroundColor Yellow
$size = (Get-ChildItem -Recurse | Measure-Object -Sum Length).Sum
$sizeMB = [Math]::Round($size / 1MB, 2)

Write-Host "Очистка завершена! Текущий размер проекта: $sizeMB МБ" -ForegroundColor Green
Write-Host "Для дополнительной экономии места рассмотрите:" -ForegroundColor Cyan
Write-Host "1. Удаление неиспользуемых зависимостей" -ForegroundColor White
Write-Host "2. Переход на pnpm вместо npm (экономия ~30%)" -ForegroundColor White
Write-Host "3. Использование Docker multi-stage builds для продакшена" -ForegroundColor White
