import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requirePermission } from '@/lib/rbac';

interface RouteParams {
  params: { id: string };
}

// PATCH /api/checklists/[id]/toggle - переключить активность чек-листа
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { user } = await requirePermission('canManageChecklists');
    const checklistId = params.id;

    // Получаем текущий чек-лист
    const existingChecklist = await prisma.checklistTemplate.findUnique({
      where: { id: checklistId },
      select: {
        id: true,
        isActive: true,
        title: true,
      },
    });

    if (!existingChecklist) {
      return NextResponse.json({ error: 'Чек-лист не найден' }, { status: 404 });
    }

    // Переключаем статус активности
    const updatedChecklist = await prisma.checklistTemplate.update({
      where: { id: checklistId },
      data: {
        isActive: !existingChecklist.isActive,
      },
      include: {
        items: {
          orderBy: {
            orderIndex: 'asc',
          },
        },
        createdBy: {
          select: {
            name: true,
          },
        },
        _count: {
          select: {
            items: true,
            reviews: true,
          },
        },
      },
    });

    return NextResponse.json({
      checklist: updatedChecklist,
      message: `Чек-лист "${updatedChecklist.title}" ${updatedChecklist.isActive ? 'активирован' : 'деактивирован'}`,
    });
  } catch (error: any) {
    console.error('Ошибка переключения активности чек-листа:', error);

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
