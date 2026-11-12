export type JoinRequestStatus = 'pending' | 'approved' | 'rejected' | 'cancelled';
export type JoinRequestDecision = Extract<JoinRequestStatus, 'approved' | 'rejected'>;

export interface JoinRequest {
  id: string;
  organizationId: string;
  userId: string;
  status: JoinRequestStatus;
  message: string | null;
  reviewedBy: string | null;
  reviewedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export const JOIN_REQUEST_STATUSES: readonly JoinRequestStatus[] = [
  'pending',
  'approved',
  'rejected',
  'cancelled',
];

export const JOIN_REQUEST_STATUS_LABELS: Record<JoinRequestStatus, string> = {
  pending: 'Pendiente',
  approved: 'Aprobada',
  rejected: 'Rechazada',
  cancelled: 'Cancelada',
};

export const JOIN_REQUEST_STATUS_CLASSES: Record<JoinRequestStatus, string> = {
  pending: 'bg-amber-50 text-amber-700',
  approved: 'bg-emerald-50 text-emerald-700',
  rejected: 'bg-red-50 text-red-700',
  cancelled: 'bg-slate-100 text-slate-600',
};
