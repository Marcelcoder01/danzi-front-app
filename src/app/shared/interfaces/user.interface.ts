export interface User {
  id: string;
  roleId: string;
  name: string;
  surname?: string;
  email: string;
  phone?: string;
  photoUrl?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
