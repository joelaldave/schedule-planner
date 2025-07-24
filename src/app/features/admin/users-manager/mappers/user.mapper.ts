import { User, UserResponse } from "../interfaces/user.interface";


export function fromSupabaseUser(user: UserResponse): User {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    avatar: '', // Assuming avatar is not provided in UserResponse
    fullName: user.name,
    createdAt: user.created_at,
    lastSignInAt: user.last_sign_in_at || undefined,
    role: user.role as 'admin' | 'user' | 'moderator' | undefined,
    status: user.status ? 'active' : 'inactive'
  }
}