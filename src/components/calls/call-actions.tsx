'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { MoreHorizontal, Eye, Trash2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

type Call = {
  id: string;
  dealId: string;
  employeeName: string;
  managerName: string;
  createdAt: string;
  reviews: Array<{
    id: string;
    status: string;
    template: {
      title: string;
    };
  }>;
};

type CallActionsProps = {
  call: Call;
  onDeleteSuccess?: () => void;
};

export function CallActions({ call, onDeleteSuccess }: CallActionsProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Проверяем права на удаление
  const canDelete = session?.user?.role === 'ADMINISTRATOR' || session?.user?.role === 'OCC_MANAGER';

  const handleDelete = async () => {
    try {
      setIsLoading(true);
      
      const response = await fetch(`/api/calls/${call.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Ошибка при удалении звонка');
      }

      const result = await response.json();
      
      toast.success(`Звонок ${call.id} успешно удален${result.deletedReviews > 0 ? ` вместе с ${result.deletedReviews} проверками` : ''}`);
      
      // Вызываем callback для обновления списка
      if (onDeleteSuccess) {
        onDeleteSuccess();
      } else {
        // Обновляем страницу, если callback не предоставлен
        router.refresh();
      }
      
    } catch (error: any) {
      console.error('Ошибка удаления звонка:', error);
      toast.error(error.message || 'Не удалось удалить звонок');
    } finally {
      setIsLoading(false);
      setIsDeleteDialogOpen(false);
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" disabled={isLoading}>
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <MoreHorizontal className="h-4 w-4" />
            )}
            <span className="sr-only">Действия</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem asChild>
            <Link href={`/calls/${call.id}`}>
              <Eye className="mr-2 h-4 w-4" />
              Просмотреть
            </Link>
          </DropdownMenuItem>

          {canDelete && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => setIsDeleteDialogOpen(true)}
                disabled={isLoading}
                className="text-red-600 focus:text-red-600"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Удалить
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Подтвердить удаление</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>
                Вы собираетесь удалить звонок <strong>{call.id}</strong>.
              </p>
              <p className="text-amber-600">
                ⚠️ Эта операция необратима и удалит звонок вместе со всеми связанными данными:
              </p>
              <ul className="list-disc list-inside text-sm space-y-1">
                <li>Детали звонка (ID: {call.id}, сделка: {call.dealId})</li>
                <li>Все проверки ({call.reviews.length} штук)</li>
                <li>Результаты анализов и комментарии</li>
              </ul>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>
              Отмена
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isLoading}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Удаление...
                </>
              ) : (
                'Удалить'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
