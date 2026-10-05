export interface PaymentMethod {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean | null;
  createdAt: string | null;
  updatedAt: string | null;
}
