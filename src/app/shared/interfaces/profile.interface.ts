export interface Profile {
  id: string;
  roleId: string | null;
  fullName: string | null;
  email: string;
  phone: string | null;
  photoUrl: string | null;
  isActive: boolean | null;
  createdAt: string | null;
  updatedAt: string | null;
}
