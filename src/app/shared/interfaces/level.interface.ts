export interface Level {
  id: string;
  name: string;
  description: string | null;
  sortOrder: number;
  isActive: boolean | null;
  createdAt: string | null;
  updatedAt: string | null;
}
