export type UserRole = 'SOCIETY_ADMIN' | 'COMMITTEE_MEMBER' | 'SECURITY' | 'RESIDENT';

export interface UserProfile {
  id: string;
  fullName: string;
  email: string;
  role: UserRole;
  status: 'ACTIVE' | 'INACTIVE';
  phone?: string | null;
  flatId?: string | null;
  createdAt: string;
}

export interface AuthResponse {
  success: boolean;
  data: {
    user: UserProfile;
  };
  message?: string;
}
