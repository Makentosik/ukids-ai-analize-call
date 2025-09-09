import { notFound } from 'next/navigation';
import Link from 'next/link';
import { requirePermission } from '@/lib/rbac';
import { prisma } from '@/lib/prisma';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ArrowLeft, Edit2, Star } from 'lucide-react';
import { dt } from '@/lib/locale';

type ChecklistDetailPageProps = {
  params: {
    id: string;
  };
};

async function getChecklist(id: string) {
  try {
    const checklist = await prisma.checklistTemplate.findUnique({
      where: { id },
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

    return checklist;
  } catch (error) {
    console.error('Error loading checklist:', error);
    return null;
  }
}

function getEvaluationTypeLabel(type: string) {
  switch (type) {
    case 'SCALE_1_10':
      return 'Шкала 1-10';
    case 'YES_NO':
      return 'Да/Нет';
    default:
      return type;
  }
}

function getEvaluationTypeDescription(type: string) {
  switch (type) {
    case 'SCALE_1_10':
      return 'Оценка по шкале от 1 до 10';
    case 'YES_NO':
      return 'Выполнено или не выполнено';
    default:
      return '';
  }
}

export default async function ChecklistDetailPage({ params }: ChecklistDetailPageProps) {
  // Require authentication and permissions
  await requirePermission('canManageChecklists');

  const { id } = await params;
  const checklist = await getChecklist(id);

  if (!checklist) {
    notFound();
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/checklists">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Назад к списку
            </Link>
          </Button>
        </div>
        
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold tracking-tight">{checklist.title}</h1>
              <Badge variant={checklist.isActive ? 'default' : 'secondary'}>
                {checklist.isActive ? 'Активный' : 'Неактивный'}
              </Badge>
              {checklist.isDefault && (
                <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300">
                  <Star className="mr-1 h-3 w-3 fill-yellow-400 text-yellow-400" />
                  Дефолтный
                </Badge>
              )}
            </div>
            {checklist.description && (
              <p className="text-muted-foreground mt-2">{checklist.description}</p>
            )}
            <div className="flex items-center gap-4 mt-4 text-sm text-muted-foreground">
              <span>Создан: {dt(checklist.createdAt)}</span>
              <span>Создатель: {checklist.createdBy.name}</span>
              <span>Использований: {checklist._count.reviews}</span>
            </div>
          </div>
          <Button asChild>
            <Link href={`/checklists/${checklist.id}/edit`}>
              <Edit2 className="h-4 w-4 mr-2" />
              Редактировать
            </Link>
          </Button>
        </div>
      </div>

      {/* Items Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            Элементы чек-листа ({checklist.items.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {checklist.items.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                Нет элементов в чек-листе
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">#</TableHead>
                  <TableHead>Название</TableHead>
                  <TableHead>Описание</TableHead>
                  <TableHead className="w-32">Тип оценки</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {checklist.items.map((item, index) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium text-center">
                      <Badge variant="outline" className="min-w-[2rem] justify-center">
                        {index + 1}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">
                      {item.title}
                    </TableCell>
                    <TableCell className="max-w-md">
                      <div className="text-sm text-muted-foreground">
                        {item.description || '—'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <Badge 
                          variant={item.evaluationType === 'SCALE_1_10' ? 'default' : 'secondary'}
                          className="block text-center"
                        >
                          {getEvaluationTypeLabel(item.evaluationType)}
                        </Badge>
                        <div className="text-xs text-muted-foreground text-center">
                          {getEvaluationTypeDescription(item.evaluationType)}
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
