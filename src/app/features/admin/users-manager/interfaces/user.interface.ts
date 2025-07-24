
export interface User {
    id: string;
    name: string;
    email: string;
    avatar: string;
    fullName?: string;
    createdAt?: string;
    lastSignInAt?: string;
    role?: 'admin' | 'user' | 'moderator';
    status?: 'active' | 'inactive' ;
}


export interface UserFilters {
  search?: string;
  role?: 'admin' | 'moderator' | 'user' | 'all';
  status?: 'active' | 'inactive' | 'all';
  page?: number;
  limit?: number;
}

export interface UserStats {
  total: number;
  active: number;
  inactive: number;
  newThisMonth: number;
}


export interface PaginatedUsers {
  users: User[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface UserResponse {
    id: string;
    email: string;
    name: string;
    role: string;
    status: boolean;
    created_at: string;
    updated_at: string;
    last_sign_in_at: string | null;
}
