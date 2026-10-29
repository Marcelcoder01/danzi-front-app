import type { StudentPaymentPeriod } from '../interfaces/student.interface';

export function getPaymentPeriodMonths(
  period: StudentPaymentPeriod | undefined,
  from?: string | null,
  to?: string | null,
): number {
  if (period === '2') return 2;
  if (period !== 'custom' || !from || !to) return 1;

  const start = new Date(`${from}T12:00:00`);
  const end = new Date(`${to}T12:00:00`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end < start) return 1;

  const monthDifference =
    (end.getFullYear() - start.getFullYear()) * 12 + end.getMonth() - start.getMonth();
  const partialNextMonth = end.getDate() > start.getDate() ? 1 : 0;
  return Math.max(1, monthDifference + partialNextMonth);
}

export function getPaymentPeriodDays(
  period: StudentPaymentPeriod | undefined,
  from?: string | null,
  to?: string | null,
): number {
  if (period === '2') return 56;
  if (period !== 'custom' || !from || !to) return 28;

  const start = new Date(`${from}T00:00:00Z`);
  const end = new Date(`${to}T00:00:00Z`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end < start) return 28;
  return Math.floor((end.getTime() - start.getTime()) / 86_400_000) + 1;
}
