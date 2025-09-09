import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/rbac';
import { UserRole } from '@prisma/client';

interface RouteParams {
  params: { id: string; reviewId: string };
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { user } = await requireAuth();
    const { id: callId, reviewId } = await params;

    if (!callId || !reviewId) {
      return NextResponse.json({ 
        error: 'ID звонка и ID проверки обязательны' 
      }, { status: 400 });
    }

    // Находим проверку для проверки прав доступа
    const review = await prisma.callReview.findUnique({
      where: { id: reviewId },
      include: {
        requestedBy: {
          select: { id: true, name: true }
        },
        template: {
          select: { title: true }
        }
      }
    });

    if (!review) {
      return NextResponse.json({ 
        error: 'Проверка не найдена' 
      }, { status: 404 });
    }

    // Проверяем, что проверка относится к указанному звонку
    if (review.callId !== callId) {
      return NextResponse.json({ 
        error: 'Проверка не относится к указанному звонку' 
      }, { status: 400 });
    }

    // Проверяем права на удаление
    const userRole = user.role as UserRole;
    const canDelete = 
      // Администраторы и OCC_MANAGER могут удалять любые проверки
      ['ADMINISTRATOR', 'OCC_MANAGER'].includes(userRole) ||
      // Пользователь может удалить только свою проверку
      review.requestedBy?.id === user.id;

    if (!canDelete) {
      return NextResponse.json({ 
        error: 'Недостаточно прав для удаления этой проверки' 
      }, { status: 403 });
    }

    // Удаляем проверку
    const deletedReview = await prisma.callReview.delete({
      where: { id: reviewId }
    });

    console.log(`✅ Удалена проверка ${reviewId} для звонка ${callId} пользователем ${user.name}`);

    return NextResponse.json({ 
      message: 'Проверка успешно удалена',
      deletedReview: {
        id: deletedReview.id,
        templateTitle: review.template.title,
        requestedBy: review.requestedBy?.name || 'Автоматическая проверка'
      }
    });

  } catch (error: any) {
    console.error('Ошибка удаления проверки:', error);

    if (error.message === 'Не авторизован') {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    }

    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера', details: error.message },
      { status: 500 }
    );
  }
}
