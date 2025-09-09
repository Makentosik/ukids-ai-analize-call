import { Suspense } from 'react';
import Link from 'next/link';
import { requireAuth, requirePermission } from '@/lib/rbac';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Plus, MoreHorizontal, Edit2, Trash2, Power, PowerOff, Star } from 'lucide-react';
import { uiText, dt } from '@/lib/locale';
import { ChecklistActions } from '@/components/checklists/checklist-actions';

async function getChecklists() {
  try {
    const checklists = await prisma.checklistTemplate.findMany({
      include: {
        items: {
          select: {
            id: true,
          },
        },
        _count: {
          select: {
            reviews: true,
          },
        },
        createdBy: {
          select: {
            name: true,
          },
        },
      },
      orderBy: [
        { isActive: 'desc' },
        { createdAt: 'desc' },
      ],
    });

    return checklists.map(checklist => ({
      ...checklist,
      name: checklist.title, // Map title to name for compatibility
      itemCount: checklist.items.length,
      reviewCount: checklist._count.reviews,
      items: undefined,
      _count: undefined,
    }));
  } catch (error) {
    console.error('Error loading checklists:', error);
    return [];
  }
}

function ChecklistsTable({ checklists }: { checklists: Awaited<ReturnType<typeof getChecklists>> }) {
  if (checklists.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16">
          <div className="text-center">
            <div className="mb-4">
              <Plus className="mx-auto h-12 w-12 text-gray-400" />
            </div>
            <h3 className="mb-2 text-lg font-semibold">{uiText.checklists.noChecklistsFound}</h3>
            <p className="mb-4 text-sm text-muted-foreground">
              Начните с создания первого чек-листа для оценки звонков
            </p>
            <Button asChild>
              <Link href="/checklists/new">
                <Plus className="mr-2 h-4 w-4" />
                {uiText.checklists.newChecklist}
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{uiText.checklists.name}</TableHead>
            <TableHead>{uiText.checklists.description}</TableHead>
            <TableHead className="text-center">{uiText.checklists.status}</TableHead>
            <TableHead className="text-center">Дефолтный</TableHead>
            <TableHead className="text-center">{uiText.checklists.itemsCount}</TableHead>
            <TableHead className="text-center">Использований</TableHead>
            <TableHead>{uiText.checklists.updated}</TableHead>
            <TableHead className="text-right">{uiText.checklists.actions}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {checklists.map((checklist) => (
            <TableRow key={checklist.id}>
              <TableCell className="font-medium">
                <div className="flex flex-col">
                  <span>{checklist.name}</span>
                  <span className="text-xs text-muted-foreground">ID: {checklist.id}</span>
                </div>
              </TableCell>
              <TableCell className="max-w-xs">
                <div className="truncate" title={checklist.description || ''}>
                  {checklist.description || '—'}
                </div>
              </TableCell>
              <TableCell className="text-center">
                <Badge variant={checklist.isActive ? 'default' : 'secondary'}>
                  {checklist.isActive ? uiText.checklists.active : uiText.checklists.inactive}
                </Badge>
              </TableCell>
              <TableCell className="text-center">
                {checklist.isDefault && (
                  <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300">
                    <Star className="mr-1 h-3 w-3 fill-yellow-400 text-yellow-400" />
                    Дефолт
                  </Badge>
                )}
              </TableCell>
              <TableCell className="text-center">
                <Badge variant="outline">
                  {checklist.itemCount} {checklist.itemCount === 1 ? 'элемент' : 'элементов'}
                </Badge>
              </TableCell>
              <TableCell className="text-center">
                <Badge variant={checklist.reviewCount > 0 ? 'default' : 'secondary'}>
                  {checklist.reviewCount}
                </Badge>
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {dt(checklist.updatedAt)}
              </TableCell>
              <TableCell className="text-right">
                <ChecklistActions checklist={checklist} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
}

function ChecklistsPageContent() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{uiText.checklists.title}</h1>
            <p className="text-muted-foreground mt-2">
              Управляйте чек-листами для оценки качества звонков
            </p>
          </div>
          <Button asChild>
            <Link href="/checklists/new">
              <Plus className="mr-2 h-4 w-4" />
              {uiText.checklists.newChecklist}
            </Link>
          </Button>
        </div>
      </div>

      <Suspense fallback={
        <Card>
          <CardContent className="flex items-center justify-center py-16">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p>{uiText.common.loading}</p>
            </div>
          </CardContent>
        </Card>
      }>
        <ChecklistsAsync />
      </Suspense>
    </div>
  );
}

async function ChecklistsAsync() {
  const checklists = await getChecklists();
  return <ChecklistsTable checklists={checklists} />;
}

export default async function ChecklistsPage() {
  // Require authentication and permissions
  await requirePermission('canManageChecklists');

  return <ChecklistsPageContent />;
}
