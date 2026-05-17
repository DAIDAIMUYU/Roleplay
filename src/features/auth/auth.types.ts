import type { User, Session } from "@supabase/supabase-js";

export type AppRole = "owner" | "admin" | "user";

export type RunMode = "guest_demo" | "authenticated";

export interface Profile {
  id: string;
  handle: string | null;
  display_name: string | null;
  avatar_path: string | null;
  default_mode: string;
  created_at: string;
  updated_at: string;
}

export interface UserRole {
  id: string;
  user_id: string;
  role: AppRole;
  granted_by: string | null;
  granted_at: string;
}

export interface AuthState {
  supabaseConfigured: boolean;
  loading: boolean;
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  role: AppRole | null;
  mode: RunMode;
}

export type AuthAction =
  | { type: "INIT_START" }
  | { type: "INIT_GUEST"; supabaseConfigured: boolean }
  | { type: "INIT_AUTHENTICATED"; session: Session; user: User; profile: Profile; role: AppRole | null }
  | { type: "SIGNED_OUT" }
  | { type: "PROFILE_UPDATED"; profile: Profile };

export interface AuthContextValue extends AuthState {
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signUp: (email: string, password: string) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  isOwner: boolean;
  isAdmin: boolean;
  isUser: boolean;
  isGuestOrDemo: boolean;
}
