import {
  createContext,
  useCallback,
  useEffect,
  useReducer,
  type ReactNode,
} from "react";
import { supabase, isSupabaseConfigured } from "./supabaseClient";
import type { AuthContextValue, AuthState, AuthAction, Profile, AppRole } from "./auth.types";

export const AuthContext = createContext<AuthContextValue | null>(null);

const initialState: AuthState = {
  supabaseConfigured: false,
  loading: true,
  session: null,
  user: null,
  profile: null,
  role: null,
  mode: "guest_demo",
};

function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case "INIT_START":
      return { ...state, loading: true };
    case "INIT_GUEST":
      return {
        ...state,
        loading: false,
        supabaseConfigured: action.supabaseConfigured,
        session: null,
        user: null,
        profile: null,
        role: null,
        mode: "guest_demo",
      };
    case "INIT_AUTHENTICATED":
      return {
        ...state,
        loading: false,
        supabaseConfigured: true,
        session: action.session,
        user: action.user,
        profile: action.profile,
        role: action.role,
        mode: "authenticated",
      };
    case "SIGNED_OUT":
      return {
        ...state,
        loading: false,
        session: null,
        user: null,
        profile: null,
        role: null,
        mode: "guest_demo",
      };
    case "PROFILE_UPDATED":
      return { ...state, profile: action.profile };
    default:
      return state;
  }
}

async function fetchProfile(userId: string): Promise<Profile | null> {
  if (!supabase) return null;
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();
  return data as Profile | null;
}

async function fetchUserRole(userId: string): Promise<AppRole | null> {
  if (!supabase) return null;
  const { data } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .maybeSingle();
  return (data?.role as AppRole) ?? "user";
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, initialState);
  const configured = isSupabaseConfigured();

  useEffect(() => {
    if (!supabase) {
      dispatch({ type: "INIT_GUEST", supabaseConfigured: false });
      return;
    }

    dispatch({ type: "INIT_START" });

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session?.user) {
        dispatch({ type: "INIT_GUEST", supabaseConfigured: true });
        return;
      }

      const [profile, role] = await Promise.all([
        fetchProfile(session.user.id),
        fetchUserRole(session.user.id),
      ]);

      dispatch({
        type: "INIT_AUTHENTICATED",
        session,
        user: session.user,
        profile: profile!,
        role,
      });
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_OUT") {
        dispatch({ type: "SIGNED_OUT" });
        return;
      }

      if (event === "SIGNED_IN" && session?.user) {
        const [profile, role] = await Promise.all([
          fetchProfile(session.user.id),
          fetchUserRole(session.user.id),
        ]);
        dispatch({
          type: "INIT_AUTHENTICATED",
          session,
          user: session.user,
          profile: profile!,
          role,
        });
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    if (!supabase) return { error: "Supabase 未配置" };
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error?.message };
  }, []);

  const signUp = useCallback(async (email: string, password: string) => {
    if (!supabase) return { error: "Supabase 未配置" };
    const { error } = await supabase.auth.signUp({ email, password });
    return { error: error?.message };
  }, []);

  const signOut = useCallback(async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
  }, []);

  const refreshProfile = useCallback(async () => {
    if (!supabase || !state.user) return;
    const profile = await fetchProfile(state.user.id);
    if (profile) {
      dispatch({ type: "PROFILE_UPDATED", profile });
    }
  }, [state.user]);

  const value: AuthContextValue = {
    ...state,
    supabaseConfigured: configured,
    signIn,
    signUp,
    signOut,
    refreshProfile,
    isOwner: state.role === "owner",
    isAdmin: state.role === "admin",
    isUser: state.role === "user" || state.mode === "authenticated",
    isGuestOrDemo: state.mode === "guest_demo",
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
