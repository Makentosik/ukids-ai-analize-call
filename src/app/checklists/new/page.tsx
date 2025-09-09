import { requirePermission } from '@/lib/rbac';
import ChecklistForm from '@/components/checklists/checklist-form';

export default async function NewChecklistPage() {
  // Require authentication and permissions
  await requirePermission('canManageChecklists');

  return (
    <ChecklistForm mode="create" />
  );
}
