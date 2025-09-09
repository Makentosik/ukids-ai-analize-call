'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
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
import { Trash2, Loader2, CheckSquare, Square } from 'lucide-react';
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
  }>;
};

type BulkDeleteCallsProps = {
  calls: Call[];
  onDeleteSuccess?: () => void;
};

export function BulkDeleteCalls({ calls, onDeleteSuccess }: BulkDeleteCallsProps) {
  const { data: session } = useSession();
  const [selectedCalls, setSelectedCalls] = useState<Set<string>>(new Set());
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isClearAllDialogOpen, setIsClearAllDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Проверяем права на удаление
  const canDelete = session?.user?.role === 'ADMINISTRATOR' || session?.user?.role === 'OCC_MANAGER';
  const isAdmin = session?.user?.role === 'ADMINISTRATOR';

  if (!canDelete) {
    return null;
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedCalls(new Set(calls.map(call => call.id)));
    } else {
      setSelectedCalls(new Set());
    }
  };

  const handleSelectCall = (callId: string, checked: boolean) => {
    const newSelected = new Set(selectedCalls);
    if (checked) {
      newSelected.add(callId);
    } else {
      newSelected.delete(callId);
    }
    setSelectedCalls(newSelected);
  };

  const handleBulkDelete = async () => {
    try {
      setIsLoading(true);
      
      const response = await fetch('/api/calls/bulk-delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          callIds: Array.from(selectedCalls)
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Ошибка при массовом удалении');
      }

      const result = await response.json();
      
      toast.success(result.message);
      setSelectedCalls(new Set());
      
      if (onDeleteSuccess) {
        onDeleteSuccess();
      }
      
    } catch (error: any) {
      console.error('Ошибка массового удаления:', error);
      toast.error(error.message || 'Не удалось удалить звонки');
    } finally {
      setIsLoading(false);
      setIsDeleteDialogOpen(false);
    }
  };

  const handleClearAll = async () => {
    try {
      setIsLoading(true);
      
      const response = await fetch('/api/calls/clear-all', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          confirmation: 'DELETE_ALL_CALLS'
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Ошибка при очистке базы');
      }

      const result = await response.json();
      
      toast.success(result.message);
      setSelectedCalls(new Set());
      
      if (onDeleteSuccess) {
        onDeleteSuccess();
      }
      
    } catch (error: any) {
      console.error('Ошибка очистки базы:', error);
      toast.error(error.message || 'Не удалось очистить базу данных');
    } finally {
      setIsLoading(false);
      setIsClearAllDialogOpen(false);
    }
  };

  const selectedCount = selectedCalls.size;
  const allSelected = selectedCount === calls.length && calls.length > 0;
  const someSelected = selectedCount > 0 && selectedCount < calls.length;

  return (
    <>
      <div className="flex items-center gap-4 py-4 border-b">
        <div className="flex items-center gap-2">
          <Checkbox
            checked={allSelected}
            indeterminate={someSelected}
            onCheckedChange={handleSelectAll}
            disabled={calls.length === 0}
          />
          <span className="text-sm text-gray-600">
            {selectedCount > 0 ? `Выбрано: ${selectedCount}` : 'Выбрать все'}
          </span>
        </div>

        {selectedCount > 0 && (
          <Button
            variant="destructive"
            size="sm"
            onClick={() => setIsDeleteDialogOpen(true)}
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4 mr-2" />
            )}
            Удалить выбранные ({selectedCount})
          </Button>
        )}

        {isAdmin && calls.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsClearAllDialogOpen(true)}
            disabled={isLoading}
            className="ml-auto text-red-600 hover:text-red-700 border-red-200 hover:border-red-300"
          >
            🗑️ Очистить всю базу
          </Button>
        )}
      </div>

      {/* Функция выбора для каждой строки */}
      {calls.length > 0 && (
        <div className="hidden">
          {/* Этот div скрыт, но предоставляет функции для CallActions */}
          {calls.map(call => (
            <Checkbox
              key={call.id}
              checked={selectedCalls.has(call.id)}
              onCheckedChange={(checked) => handleSelectCall(call.id, !!checked)}
            />
          ))}
        </div>
      )}

      {/* Диалог массового удаления */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Массовое удаление звонков</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>
                Вы собираетесь удалить <strong>{selectedCount}</strong> звонков.
              </p>
              <p className="text-amber-600">
                ⚠️ Эта операция необратима и удалит все выбранные звонки вместе со всеми связанными данными:
              </p>
              <ul className="list-disc list-inside text-sm space-y-1">
                <li>Детали звонков и метаданные</li>
                <li>Все связанные проверки</li>
                <li>Результаты анализов и комментарии</li>
              </ul>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>
              Отмена
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkDelete}
              disabled={isLoading}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Удаление...
                </>
              ) : (
                `Удалить ${selectedCount} звонков`
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Диалог полной очистки */}
      <AlertDialog open={isClearAllDialogOpen} onOpenChange={setIsClearAllDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>🗑️ Полная очистка базы данных</AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                <p className="font-semibold text-red-800">
                  ⚠️ ОПАСНАЯ ОПЕРАЦИЯ ⚠️
                </p>
                <p className="text-red-700">
                  Вы собираетесь удалить <strong>ВСЕ</strong> звонки из базы данных.
                </p>
              </div>
              <p>Будут удалены:</p>
              <ul className="list-disc list-inside text-sm space-y-1">
                <li>Все {calls.length} звонков</li>
                <li>Все связанные проверки</li>
                <li>Все результаты анализов</li>
                <li>Все комментарии и метаданные</li>
              </ul>
              <p className="font-semibold text-red-600">
                Эта операция НЕОБРАТИМА!
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>
              Отмена
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleClearAll}
              disabled={isLoading}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Очистка...
                </>
              ) : (
                '🗑️ Очистить всю базу'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
