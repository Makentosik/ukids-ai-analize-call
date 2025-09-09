import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requirePermission } from '@/lib/rbac';

export async function POST(request: NextRequest) {
  try {
    // Требуем права администратора для массового удаления звонков
    const { user } = await requirePermission('canDeleteCalls');
    
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

    const { callIds } = body;

    if (!callIds || !Array.isArray(callIds) || callIds.length === 0) {
      return NextResponse.json(
        { error: 'Необходимо указать массив ID звонков' },
        { status: 400 }
      );
    }

    if (callIds.length > 100) {
      return NextResponse.json(
        { error: 'За раз можно удалить максимум 100 звонков' },
        { status: 400 }
      );
    }

    // Проверяем существование звонков
    const existingCalls = await prisma.call.findMany({
      where: {
        id: {
          in: callIds
        }
      },
      include: {
        reviews: {
          select: { id: true }
        }
      }
    });

    if (existingCalls.length === 0) {
      return NextResponse.json(
        { error: 'Ни один из указанных звонков не найден' },
        { status: 404 }
      );
    }

    const existingCallIds = existingCalls.map(call => call.id);
    const notFoundIds = callIds.filter((id: string) => !existingCallIds.includes(id));
    const totalReviews = existingCalls.reduce((sum, call) => sum + call.reviews.length, 0);

    // Массовое удаление в транзакции
    const result = await prisma.$transaction(async (prisma) => {
      // Удаляем все связанные проверки
      const deletedReviews = await prisma.callReview.deleteMany({
        where: {
          callId: {
            in: existingCallIds
          }
        }
      });

      // Удаляем звонки
      const deletedCalls = await prisma.call.deleteMany({
        where: {
          id: {
            in: existingCallIds
          }
        }
      });

      return {
        deletedCallsCount: deletedCalls.count,
        deletedReviewsCount: deletedReviews.count
      };
    });

    console.log(`✅ Массово удалено ${result.deletedCallsCount} звонков и ${result.deletedReviewsCount} связанных проверок`);

    return NextResponse.json({
      message: `Успешно удалено ${result.deletedCallsCount} звонков`,
      deletedCalls: result.deletedCallsCount,
      deletedReviews: result.deletedReviewsCount,
      notFoundIds: notFoundIds.length > 0 ? notFoundIds : undefined
    });

  } catch (error: any) {
    console.error('Ошибка массового удаления звонков:', error);

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
