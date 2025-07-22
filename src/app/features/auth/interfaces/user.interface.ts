export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  fullName?: string;
  createdAt?: string;
  lastSignInAt?: string;
  provider?: string;
}

export interface UserMetadata {
  full_name?: string;
  avatar_url?: string;
  [key: string]: any;
}

export interface AppUser {
  id: string;
  name: string;
  email: string;
  avatar: string;
  metadata?: UserMetadata;
  isOnline?: boolean;
  role?: 'admin' | 'user' | 'moderator';
}