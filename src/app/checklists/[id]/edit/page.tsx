import { notFound } from 'next/navigation';
import { requirePermission } from '@/lib/rbac';
import { prisma } from '@/lib/prisma';
import ChecklistForm from '@/components/checklists/checklist-form';
import { ChecklistItem } from '@/components/checklists/checklist-items-editor';

type EditChecklistPageProps = {
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
      },
    });

    if (!checklist) {
      return null;
    }

    return {
      ...checklist,
      name: checklist.title, // Map title to name for compatibility
      items: checklist.items.map((item): ChecklistItem => ({
        id: item.id,
        text: item.title,
        description: item.description || '',
        orderIndex: item.orderIndex,
        evaluationType: item.evaluationType || 'SCALE_1_10',
      })),
    };
  } catch (error) {
    console.error('Error loading checklist:', error);
    return null;
  }
}

export default async function EditChecklistPage({ params }: EditChecklistPageProps) {
  // Require authentication and permissions
  await requirePermission('canManageChecklists');

  const { id } = await params;
  const checklist = await getChecklist(id);

  if (!checklist) {
    notFound();
  }

  return (
    <ChecklistForm
      mode="edit"
      initialData={checklist}
    />
  );
}
