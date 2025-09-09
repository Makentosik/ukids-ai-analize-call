import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requirePermission } from '@/lib/rbac';
import { UserRole } from '@prisma/client';

export async function POST(request: NextRequest) {
  try {
    // Требуем права администратора для полной очистки
    const { user } = await requirePermission('canDeleteCalls');
    
    // Дополнительная проверка - только администраторы могут очистить всю базу
    if (user.role !== UserRole.ADMINISTRATOR) {
      return NextResponse.json(
        { error: 'Только администраторы могут очищать всю базу данных звонков' },
        { status: 403 }
      );
    }
    
    let body;
    try {
      body = await request.json();
    } catch (jsonError) {
      console.error('Ошибка парсинга JSON:', jsonError);
      return NextResponse.json(
        { error: 'Неверный формат данных JSON' },
        { status: 400 }
      );
    }

    const { confirmation } = body;

    // Требуем явное подтверждение для безопасности
    if (confirmation !== 'DELETE_ALL_CALLS') {
      return NextResponse.json(
        { 
          error: 'Для подтверждения полной очистки необходимо передать confirmation: "DELETE_ALL_CALLS"',
          hint: 'Эта операция необратима и удалит ВСЕ звонки из базы данных'
        },
        { status: 400 }
      );
    }

    // Получаем статистику перед удалением
    const callsCount = await prisma.call.count();
    const reviewsCount = await prisma.callReview.count();

    if (callsCount === 0) {
      return NextResponse.json({
        message: 'База данных звонков уже пуста',
        deletedCalls: 0,
        deletedReviews: 0
      });
    }

    // Полная очистка в транзакции
    const result = await prisma.$transaction(async (prisma) => {
      // Сначала удаляем все проверки
      const deletedReviews = await prisma.callReview.deleteMany({});
      
      // Затем удаляем все звонки
      const deletedCalls = await prisma.call.deleteMany({});

      return {
        deletedCallsCount: deletedCalls.count,
        deletedReviewsCount: deletedReviews.count
      };
    });

    console.log(`🗑️ ПОЛНАЯ ОЧИСТКА: удалено ${result.deletedCallsCount} звонков и ${result.deletedReviewsCount} проверок администратором ${user.name}`);

    return NextResponse.json({
      message: '🗑️ База данных звонков полностью очищена',
      deletedCalls: result.deletedCallsCount,
      deletedReviews: result.deletedReviewsCount,
      clearedBy: user.name,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('Ошибка полной очистки звонков:', error);

    if (error.message === 'Не авторизован') {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    }

    if (error.message === 'Недостаточно прав') {
      return NextResponse.json({ error: 'Недостаточно прав' }, { status: 403 });
    }

    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера', details: error.message },
      { status: 500 }
    );
  }
}
