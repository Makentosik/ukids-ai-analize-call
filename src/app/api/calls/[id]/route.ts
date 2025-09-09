import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, canViewCall, requirePermission } from '@/lib/rbac';
import { UserRole } from '@prisma/client';

interface RouteParams {
  params: { id: string };
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { user } = await requireAuth();
    const { id: callId } = await params;

    if (!callId) {
      return NextResponse.json({ error: 'ID звонка обязателен' }, { status: 400 });
    }

    // Получаем звонок с полной информацией
    const call = await prisma.call.findUnique({
      where: { id: callId },
      include: {
        reviews: {
          include: {
            template: {
              select: {
                title: true,
              },
            },
            requestedBy: {
              select: {
                id: true,
                name: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });

    if (!call) {
      return NextResponse.json({ error: 'Звонок не найден' }, { status: 404 });
    }

    // Проверяем права на просмотр этого звонка
    if (!canViewCall(user.role as UserRole, user.name, call.employeeName)) {
      return NextResponse.json({ error: 'Недостаточно прав' }, { status: 403 });
    }

    return NextResponse.json(call);
  } catch (error: any) {
    console.error('Ошибка получения звонка:', error);

    if (error.message === 'Не авторизован') {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    }

    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    // Требуем права администратора для удаления звонков
    const { user } = await requirePermission('canDeleteCalls');
    const { id: callId } = await params;

    if (!callId) {
      return NextResponse.json({ error: 'ID звонка обязателен' }, { status: 400 });
    }

    // Проверяем существование звонка
    const existingCall = await prisma.call.findUnique({
      where: { id: callId },
      include: {
        reviews: {
          select: { id: true }
        }
      }
    });

    if (!existingCall) {
      return NextResponse.json({ error: 'Звонок не найден' }, { status: 404 });
    }

    // Удаляем звонок и все связанные данные в транзакции
    const result = await prisma.$transaction(async (prisma) => {
      // Удаляем все связанные проверки (reviews)
      await prisma.callReview.deleteMany({
        where: { callId }
      });

      // Удаляем сам звонок
      const deletedCall = await prisma.call.delete({
        where: { id: callId }
      });

      return {
        deletedCall,
        deletedReviews: existingCall.reviews.length
      };
    });

    console.log(`✅ Удален звонок ${callId} и ${result.deletedReviews} связанных проверок`);

    return NextResponse.json({ 
      message: 'Звонок успешно удален',
      deletedCall: result.deletedCall,
      deletedReviews: result.deletedReviews
    });

  } catch (error: any) {
    console.error('Ошибка удаления звонка:', error);

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
