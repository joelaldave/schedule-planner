
export interface User {
    id: string;
    name: string;
    email: string;
    avatar: string;
    fullName?: string;
    createdAt?: string;
    lastSignInAt?: string;
    role?: 'admin' | 'user' | 'moderator';
    status?: 'active' | 'inactive' | 'suspended';
}


export interface UserFilters {
  search?: string;
  role?: 'admin' | 'moderator' | 'user' | 'all';
  status?: 'active' | 'inactive' | 'suspended' | 'all';
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
    id: any;
    email: any;
    full_name: any;
    role: any;
    status: any;
    created_at: any;
    updated_at: any;
    last_sign_in_at: any;
}
