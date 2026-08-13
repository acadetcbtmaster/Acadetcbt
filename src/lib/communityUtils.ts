export function isContentApprovedAndVisible(item: {
  approvalStatus?: 'Draft' | 'Approved' | 'Rejected' | 'Archived';
  status?: string;
  visibility?: 'visible' | 'hidden';
  isHidden?: boolean;
} | null | undefined): boolean {
  if (!item) return false;

  // Check approvalStatus if explicitly defined
  if (item.approvalStatus) {
    if (item.approvalStatus !== 'Approved') {
      return false;
    }
  } else if (item.status) {
    // If status is present, check if it's draft, hidden, rejected, or archived
    if (['Draft', 'Hidden', 'Rejected', 'Archived', 'draft', 'hidden', 'rejected', 'archived', 'inactive'].includes(item.status)) {
      return false;
    }
  }

  // Check visibility / isHidden
  if (item.visibility === 'hidden' || item.isHidden === true) {
    return false;
  }

  return true;
}
