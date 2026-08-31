export interface UserAccount {
  username: string;
  fullname: string;
  email?: string;
  password?: string;
  role: 'superadmin' | 'editor' | 'viewer' | 'serviser' | 'warehouse_specialist' | string;
  createdAt?: string;
}
