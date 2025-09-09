import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requirePermission } from '@/lib/rbac';

export async function PATCH(request: NextRequest) {
  try {
    // Проверяем права на управление чек-листами
    const { user } = await requirePermission('canManageChecklists');

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

    const { checklistId } = body;

    if (!checklistId) {
      return NextResponse.json(
        { error: 'Не указан ID чек-листа' },
        { status: 400 }
      );
    }

    // Проверяем существование чек-листа
    const existingChecklist = await prisma.checklistTemplate.findUnique({
      where: { id: checklistId }
    });

    if (!existingChecklist) {
      return NextResponse.json(
        { error: 'Чек-лист не найден' },
        { status: 404 }
      );
    }

    // Выполняем операцию в транзакции для обеспечения консистентности
    const result = await prisma.$transaction(async (prisma) => {
      // Снимаем дефолтный статус со всех чек-листов
      await prisma.checklistTemplate.updateMany({
        data: { isDefault: false }
      });

      // Устанавливаем дефолтный статус для выбранного чек-листа
      // и активируем его, если он был неактивен
      const updatedChecklist = await prisma.checklistTemplate.update({
        where: { id: checklistId },
        data: { 
          isDefault: true,
          isActive: true 
        },
        include: {
          items: {
            orderBy: { orderIndex: 'asc' }
          },
          createdBy: {
            select: { name: true }
          }
        }
      });

      return updatedChecklist;
    });

    console.log(`✅ Установлен дефолтный чек-лист: ${result.title} (${result.id})`);

    return NextResponse.json({ 
      message: 'Дефолтный чек-лист установлен',
      checklist: result
    });

  } catch (error: any) {
    console.error('Ошибка установки дефолтного чек-листа:', error);

    if (error.message === 'Не авторизован') {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    }

    if (error.message === 'Недостаточно прав') {
      return NextResponse.json({ error: 'Недостаточно прав' }, { status: 403 });
    }

    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}
