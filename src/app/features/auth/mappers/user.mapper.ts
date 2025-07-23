import { User as UserSupabase } from "@supabase/supabase-js";
import { Profile } from "../interfaces/profile.interface";


export function mapUser(user: UserSupabase | null): Profile {
  return {
    id: user?.id || '',
    name: user?.user_metadata?.['name'] || 'Cargando...',
    email: user?.email || 'cargando@ejemplo.com',
    avatar: user?.user_metadata?.['avatar_url'] || `https://picsum.photos/40/40?random=${user?.id?.slice(0, 4)}`,
    fullName: user?.user_metadata?.['full_name'],
    createdAt: user?.created_at || '',
    lastSignInAt: user?.last_sign_in_at || '',
    provider: user?.app_metadata?.provider || ''
  };
}