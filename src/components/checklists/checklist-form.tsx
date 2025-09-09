'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { uiText } from '@/lib/locale';
import { toast } from 'sonner';
import ChecklistItemsEditor, { ChecklistItem } from './checklist-items-editor';

// Form schema with validation
const checklistFormSchema = z.object({
  name: z.string()
    .min(1, { message: 'Название обязательно' })
    .min(3, { message: 'Минимальная длина названия - 3 символа' })
    .max(255, { message: 'Максимальная длина названия - 255 символов' }),
  description: z.string()
    .max(1000, { message: 'Максимальная длина описания - 1000 символов' })
    .optional(),
  isActive: z.boolean().default(true),
});

type ChecklistFormData = z.infer<typeof checklistFormSchema>;

export type ChecklistFormProps = {
  mode: 'create' | 'edit';
  initialData?: {
    id?: string;
    name: string;
    description?: string | null;
    isActive: boolean;
    items: ChecklistItem[];
  };
  onSubmit?: (data: ChecklistFormData & { items: ChecklistItem[] }) => Promise<void>;
};

export default function ChecklistForm({ mode, initialData, onSubmit }: ChecklistFormProps) {
  const router = useRouter();
  const [items, setItems] = useState<ChecklistItem[]>(initialData?.items || []);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm({
    resolver: zodResolver(checklistFormSchema),
    defaultValues: {
      name: initialData?.name || '',
      description: initialData?.description || '',
      isActive: initialData?.isActive ?? true,
    },
  });

  const handleSubmit = async (data: ChecklistFormData) => {
    // Validate items
    if (items.length === 0) {
      toast.error(uiText.checklists.emptyItems);
      return;
    }

    // Check for empty item texts
    const emptyItems = items.filter(item => !item.text.trim());
    if (emptyItems.length > 0) {
      toast.error('Все элементы должны иметь текст');
      return;
    }

    // Check for duplicate item texts
    const itemTexts = items.map(item => item.text.trim().toLowerCase());
    const duplicates = itemTexts.filter((text, index) => itemTexts.indexOf(text) !== index);
    if (duplicates.length > 0) {
      toast.error(uiText.checklists.duplicateNames);
      return;
    }

    try {
      setIsSubmitting(true);

      if (onSubmit) {
        await onSubmit({ ...data, items });
      } else {
        // Default submission logic
        const url = mode === 'create' 
          ? '/api/checklists' 
          : `/api/checklists/${initialData?.id}`;
        
        const method = mode === 'create' ? 'POST' : 'PUT';

        const response = await fetch(url, {
          method,
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ...data,
            items: items.map((item, index) => ({
              ...item,
              orderIndex: index,
            })),
          }),
        });

        if (!response.ok) {
          throw new Error(`Failed to ${mode} checklist`);
        }

        const result = await response.json();
        
        toast.success(
          mode === 'create' 
            ? uiText.checklists.saveSuccess 
            : uiText.checklists.updateSuccess
        );

        router.push('/checklists');
      }
    } catch (error) {
      console.error(`Error ${mode}ing checklist:`, error);
      toast.error(
        mode === 'create' 
          ? uiText.checklists.saveError 
          : 'Ошибка при обновлении чек-листа'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    router.push('/checklists');
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/checklists">
              <ArrowLeft className="h-4 w-4 mr-2" />
              {uiText.checklists.backToList}
            </Link>
          </Button>
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {mode === 'create' ? uiText.checklists.createChecklist : uiText.checklists.editChecklist}
          </h1>
          <p className="text-muted-foreground mt-2">
            {mode === 'create' 
              ? 'Создайте новый чек-лист для оценки качества звонков' 
              : 'Редактируйте существующий чек-лист'}
          </p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Основная информация</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{uiText.checklists.name} *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Введите название чек-листа"
                        {...field}
                        disabled={isSubmitting}
                      />
                    </FormControl>
                    <FormDescription>
                      Краткое и понятное название для чек-листа
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{uiText.checklists.description}</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Опишите назначение и область применения чек-листа"
                        className="min-h-[80px]"
                        {...field}
                        disabled={isSubmitting}
                      />
                    </FormControl>
                    <FormDescription>
                      Подробное описание чек-листа и его использования
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled={isSubmitting}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>{uiText.checklists.active}</FormLabel>
                      <FormDescription>
                        Активные чек-листы доступны для использования при оценке звонков
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Separator />

          {/* Checklist Items */}
          <Card>
            <CardHeader>
              <CardTitle>{uiText.checklists.items}</CardTitle>
            </CardHeader>
            <CardContent>
              <ChecklistItemsEditor
                items={items}
                onChange={setItems}
                disabled={isSubmitting}
              />
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex items-center justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={isSubmitting}
            >
              {uiText.common.cancel}
            </Button>
            
            <Button
              type="submit"
              disabled={isSubmitting || items.length === 0}
            >
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <Save className="mr-2 h-4 w-4" />
              {mode === 'create' ? uiText.checklists.createChecklist : uiText.common.save}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
