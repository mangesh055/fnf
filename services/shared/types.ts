export interface ServiceResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: string;
}

export interface UserTokenPayload {
  id: string;
  email: string;
  role: 'student' | 'owner' | 'mess_owner' | 'admin';
}
