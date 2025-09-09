import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requirePermission } from '@/lib/rbac';
import { createChecklistSchema } from '@/lib/validations';

interface RouteParams {
  params: { id: string };
}

// GET /api/checklists/[id] - получить один чек-лист
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { user } = await requirePermission('canManageChecklists');
    const { id: checklistId } = await params;

    const checklist = await prisma.checklistTemplate.findUnique({
      where: { id: checklistId },
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
            reviews: true,
          },
        },
      },
    });

    if (!checklist) {
      return NextResponse.json({ error: 'Чек-лист не найден' }, { status: 404 });
    }

    return NextResponse.json(checklist);
  } catch (error: any) {
    console.error('Ошибка получения чек-листа:', error);

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

// PUT /api/checklists/[id] - обновить чек-лист
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { user } = await requirePermission('canManageChecklists');
    const { id: checklistId } = await params;
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

    // Валидация данных
    const validationResult = createChecklistSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: 'Неверный формат данных',
          details: validationResult.error.errors
        },
        { status: 400 }
      );
    }

    const { name, description, isActive, items } = validationResult.data;

    // Проверяем существование чек-листа
    const existingChecklist = await prisma.checklistTemplate.findUnique({
      where: { id: checklistId },
      include: {
        items: true,
      },
    });

    if (!existingChecklist) {
      return NextResponse.json({ error: 'Чек-лист не найден' }, { status: 404 });
    }

    // Обновляем чек-лист в транзакции
    const updatedChecklist = await prisma.$transaction(async (tx) => {
      // Удаляем все существующие элементы
      await tx.checklistItem.deleteMany({
        where: { templateId: checklistId },
      });

      // Обновляем основную информацию и создаем новые элементы
      return tx.checklistTemplate.update({
        where: { id: checklistId },
        data: {
          title: name, // Map name to title for the database
          description,
          isActive,
          items: {
            create: items.map((item, index) => ({
              title: item.text, // Map text to title for database
              description: item.description || '',
              orderIndex: index,
              evaluationType: item.evaluationType || 'SCALE_1_10',
            })),
          },
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
        },
      });
    });

    return NextResponse.json(updatedChecklist);
  } catch (error: any) {
    console.error('Ошибка обновления чек-листа:', error);

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

// DELETE /api/checklists/[id] - удалить чек-лист
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { user } = await requirePermission('canManageChecklists');
    const { id: checklistId } = await params;

    // Проверяем существование чек-листа
    const existingChecklist = await prisma.checklistTemplate.findUnique({
      where: { id: checklistId },
      include: {
        _count: {
          select: {
            reviews: true,
          },
        },
      },
    });

    if (!existingChecklist) {
      return NextResponse.json({ error: 'Чек-лист не найден' }, { status: 404 });
    }

    // Проверяем, используется ли чек-лист в проверках
    if (existingChecklist._count.reviews > 0) {
      return NextResponse.json(
        { 
          error: 'Нельзя удалить чек-лист, который используется в проверках',
          details: `Этот чек-лист используется в ${existingChecklist._count.reviews} проверках`
        },
        { status: 409 }
      );
    }

    // Удаляем чек-лист (элементы удалятся каскадно)
    await prisma.checklistTemplate.delete({
      where: { id: checklistId },
    });

    return NextResponse.json({ message: 'Чек-лист успешно удален' });
  } catch (error: any) {
    console.error('Ошибка удаления чек-листа:', error);

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
