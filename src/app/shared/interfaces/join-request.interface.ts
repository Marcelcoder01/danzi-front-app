export type JoinRequestStatus = 'pending' | 'approved' | 'rejected' | 'cancelled';
export type JoinRequestDecision = Extract<JoinRequestStatus, 'approved' | 'rejected'>;

export interface JoinRequestRow {
  id: string;
  organization_id: string;
  user_id: string;
  status: JoinRequestStatus;
  message: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
}

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

export const JOIN_REQUEST_COLUMNS =
  'id, organization_id, user_id, status, message, reviewed_by, reviewed_at, created_at, updated_at';

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

export function toJoinRequest(row: JoinRequestRow): JoinRequest {
  return {
    id: row.id,
    organizationId: row.organization_id,
    userId: row.user_id,
    status: row.status,
    message: row.message,
    reviewedBy: row.reviewed_by,
    reviewedAt: row.reviewed_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
