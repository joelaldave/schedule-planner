import { User, UserResponse } from "../interfaces/user.interface";


export function fromSupabaseUser(user: UserResponse): User {
  return {
    id: user.id,
    name: user.full_name,
    email: user.email,
    avatar: '', // Assuming avatar is not provided in UserResponse
    fullName: user.full_name,
    createdAt: user.created_at,
    lastSignInAt: user.last_sign_in_at,
    role: user.role,
    status: user.status
  }
}