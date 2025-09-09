'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
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
import { MoreHorizontal, Edit2, Trash2, Power, PowerOff, Star, Eye } from 'lucide-react';
import { uiText, toastMessages } from '@/lib/locale';
import { toast } from 'sonner';

type Checklist = {
  id: string;
  name: string;
  isActive: boolean;
  isDefault?: boolean;
  reviewCount: number;
};

type ChecklistActionsProps = {
  checklist: Checklist;
};

export function ChecklistActions({ checklist }: ChecklistActionsProps) {
  const router = useRouter();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleToggleStatus = async () => {
    try {
      setIsLoading(true);
      
      const response = await fetch(`/api/checklists/${checklist.id}/toggle`, {
        method: 'PATCH',
      });

      if (!response.ok) {
        throw new Error('Failed to toggle checklist status');
      }

      toast.success(uiText.checklists.toggleSuccess);
      router.refresh();
    } catch (error) {
      console.error('Error toggling checklist status:', error);
      toast.error('Ошибка при изменении статуса чек-листа');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSetDefault = async () => {
    try {
      setIsLoading(true);
      
      const response = await fetch('/api/checklists/set-default', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ checklistId: checklist.id }),
      });

      if (!response.ok) {
        throw new Error('Failed to set default checklist');
      }

      toast.success('Чек-лист установлен как дефолтный');
      router.refresh();
    } catch (error) {
      console.error('Error setting default checklist:', error);
      toast.error('Ошибка при установке дефолтного чек-листа');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      setIsLoading(true);
      
      const response = await fetch(`/api/checklists/${checklist.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        if (response.status === 409) {
          toast.error(uiText.checklists.deleteError);
        } else {
          throw new Error('Failed to delete checklist');
        }
        return;
      }

      toast.success(uiText.checklists.deleteSuccess);
      router.refresh();
    } catch (error) {
      console.error('Error deleting checklist:', error);
      toast.error('Ошибка при удалении чек-листа');
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
            <MoreHorizontal className="h-4 w-4" />
            <span className="sr-only">{uiText.checklists.actions}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem asChild>
            <Link href={`/checklists/${checklist.id}`}>
              <Eye className="mr-2 h-4 w-4" />
              Просмотреть
            </Link>
          </DropdownMenuItem>
          
          <DropdownMenuItem asChild>
            <Link href={`/checklists/${checklist.id}/edit`}>
              <Edit2 className="mr-2 h-4 w-4" />
              {uiText.common.edit}
            </Link>
          </DropdownMenuItem>
          
          <DropdownMenuItem onClick={handleToggleStatus} disabled={isLoading}>
            {checklist.isActive ? (
              <>
                <PowerOff className="mr-2 h-4 w-4" />
                Деактивировать
              </>
            ) : (
              <>
                <Power className="mr-2 h-4 w-4" />
                Активировать
              </>
            )}
          </DropdownMenuItem>
          
          {checklist.isActive && (
            <DropdownMenuItem 
              onClick={handleSetDefault} 
              disabled={isLoading || checklist.isDefault}
            >
              <Star className={`mr-2 h-4 w-4 ${checklist.isDefault ? 'fill-yellow-400 text-yellow-400' : ''}`} />
              {checklist.isDefault ? 'Дефолтный' : 'Сделать дефолтным'}
            </DropdownMenuItem>
          )}

          <DropdownMenuSeparator />
          
          <DropdownMenuItem
            onClick={() => setIsDeleteDialogOpen(true)}
            disabled={isLoading}
            className="text-red-600 focus:text-red-600"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            {uiText.common.delete}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{uiText.checklists.confirmDelete}</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>
                Вы собираетесь удалить чек-лист <strong>"{checklist.name}"</strong>.
              </p>
              <p>{uiText.checklists.confirmDeleteText}</p>
              {checklist.reviewCount > 0 && (
                <p className="text-amber-600 font-medium">
                  ⚠️ Внимание: Этот чек-лист использовался в {checklist.reviewCount} проверках. 
                  Удаление может нарушить целостность данных.
                </p>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>
              {uiText.common.cancel}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isLoading}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              {isLoading ? uiText.common.loading : uiText.common.delete}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
