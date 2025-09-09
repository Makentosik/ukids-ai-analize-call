'use client';

import { useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import {
  GripVertical,
  X,
  Plus,
  Trash2
} from 'lucide-react';
import { uiText } from '@/lib/locale';

export type ChecklistItem = {
  id: string;
  text: string;
  description?: string;
  orderIndex: number;
  evaluationType: 'SCALE_1_10' | 'YES_NO';
};

type ChecklistItemsEditorProps = {
  items: ChecklistItem[];
  onChange: (items: ChecklistItem[]) => void;
  disabled?: boolean;
};

type SortableItemProps = {
  item: ChecklistItem;
  index: number;
  onUpdate: (id: string, updates: Partial<ChecklistItem>) => void;
  onRemove: (id: string) => void;
  disabled?: boolean;
};

function SortableItem({ item, index, onUpdate, onRemove, disabled }: SortableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`mb-2 ${isDragging ? 'opacity-50' : ''}`}
    >
      <Card>
        <CardContent className="p-4">
          <div className="space-y-3">
            {/* Первая строка - заголовок и управление */}
            <div className="flex items-center gap-3">
              {/* Drag handle */}
              <div
                {...attributes}
                {...listeners}
                className="cursor-grab active:cursor-grabbing flex-shrink-0"
              >
                <GripVertical className="h-4 w-4 text-gray-400" />
              </div>

              {/* Порядковый номер */}
              <Badge variant="outline" className="flex-shrink-0 min-w-[2rem] justify-center">
                {index + 1}
              </Badge>

              {/* Поле заголовка элемента */}
              <div className="flex-1">
                <Input
                  value={item.text}
                  onChange={(e) => onUpdate(item.id, { text: e.target.value })}
                  placeholder="Заголовок элемента (например: Поблагодарил клиента)"
                  disabled={disabled}
                  className="border-none shadow-none p-0 h-auto focus-visible:ring-0 font-medium"
                />
              </div>

              {/* Кнопка удаления */}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => onRemove(item.id)}
                disabled={disabled}
                className="flex-shrink-0 text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            {/* Вторая строка - тип оценки */}
            <div className="pl-12">
              <div className="flex items-center gap-3 mb-2">
                <Label className="text-sm font-medium min-w-[100px]">Тип оценки:</Label>
                <Select
                  value={item.evaluationType}
                  onValueChange={(value) => onUpdate(item.id, { evaluationType: value as 'SCALE_1_10' | 'YES_NO' })}
                  disabled={disabled}
                >
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SCALE_1_10">Шкала 1-10</SelectItem>
                    <SelectItem value="YES_NO">Да/Нет</SelectItem>
                  </SelectContent>
                </Select>
                <div className="text-xs text-muted-foreground">
                  {item.evaluationType === 'SCALE_1_10' ? 'Оценка по шкале от 1 до 10' : 'Выполнено или не выполнено'}
                </div>
              </div>
            </div>
            
            {/* Третья строка - описание */}
            <div className="pl-12">
              <Textarea
                value={item.description || ''}
                onChange={(e) => onUpdate(item.id, { description: e.target.value })}
                placeholder="Подробное описание элемента (опционально)"
                disabled={disabled}
                className="min-h-[60px] text-sm border-dashed"
                rows={2}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function ChecklistItemsEditor({
  items,
  onChange,
  disabled = false,
}: ChecklistItemsEditorProps) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = items.findIndex((item) => item.id === active.id);
      const newIndex = items.findIndex((item) => item.id === over.id);

      const reorderedItems = arrayMove(items, oldIndex, newIndex).map((item, index) => ({
        ...item,
        orderIndex: index,
      }));

      onChange(reorderedItems);
    }
  };

  const handleAddItem = () => {
    const newItem: ChecklistItem = {
      id: `temp-${Date.now()}`,
      text: '',
      description: '',
      orderIndex: items.length,
      evaluationType: 'SCALE_1_10',
    };
    onChange([...items, newItem]);
  };

  const handleUpdateItem = (id: string, updates: Partial<ChecklistItem>) => {
    const updatedItems = items.map((item) =>
      item.id === id ? { ...item, ...updates } : item
    );
    onChange(updatedItems);
  };

  const handleRemoveItem = (id: string) => {
    const filteredItems = items
      .filter((item) => item.id !== id)
      .map((item, index) => ({
        ...item,
        orderIndex: index,
      }));
    onChange(filteredItems);
  };

  const handleRemoveAll = () => {
    onChange([]);
  };

  if (items.length === 0) {
    return (
      <div className="space-y-4">
        <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
          <div className="text-gray-500 mb-4">
            <Plus className="mx-auto h-12 w-12 mb-2" />
            <p>Нет элементов чек-листа</p>
            <p className="text-sm">Добавьте первый элемент для начала работы</p>
          </div>
          <Button
            type="button"
            onClick={handleAddItem}
            disabled={disabled}
          >
            <Plus className="h-4 w-4 mr-2" />
            {uiText.checklists.addItem}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-sm font-medium">
          {uiText.checklists.items} ({items.length})
        </div>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleAddItem}
            disabled={disabled}
          >
            <Plus className="h-4 w-4 mr-2" />
            {uiText.checklists.addItem}
          </Button>
          {items.length > 1 && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleRemoveAll}
              disabled={disabled}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Удалить все
            </Button>
          )}
        </div>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={items} strategy={verticalListSortingStrategy}>
          <div className="space-y-2">
            {items.map((item, index) => (
              <SortableItem
                key={item.id}
                item={item}
                index={index}
                onUpdate={handleUpdateItem}
                onRemove={handleRemoveItem}
                disabled={disabled}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {items.length > 0 && (
        <div className="text-center">
          <Button
            type="button"
            variant="outline"
            onClick={handleAddItem}
            disabled={disabled}
          >
            <Plus className="h-4 w-4 mr-2" />
            {uiText.checklists.addItem}
          </Button>
        </div>
      )}

      {/* Подсказка */}
      <div className="text-sm text-muted-foreground bg-blue-50 p-3 rounded-lg">
        <div className="flex items-start gap-2">
          <GripVertical className="h-4 w-4 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-medium mb-1">Как использовать редактор:</p>
            <ul className="space-y-1 text-xs">
              <li>• Перетаскивайте элементы за иконку для изменения порядка</li>
              <li>• Заголовок обязателен, описание опционально</li>
              <li>• Описание помогает лучше понять суть проверки</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
