import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export type UserRole = 'super_admin' | 'admin' | 'user' | 'veterinarian' | 'viewer' | 'member';

const isUserRole = (value: unknown): value is UserRole =>
  typeof value === 'string' &&
  ['super_admin', 'admin', 'user', 'veterinarian', 'viewer', 'member'].includes(value);

interface AuthContextType {
  user: User | null;
  session: Session | null;
  role: UserRole | null;
  loading: boolean;
  signUp: (email: string, password: string, fullName: string) => Promise<{ data?: any; error: any }>;
  signIn: (email: string, password: string) => Promise<{ data?: any; error: any }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: any }>;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);

  // Roles are resolved only from database-controlled records/RPC, never from email addresses or user-editable profile metadata.
  const determineRole = async (userId: string): Promise<UserRole> => {
    try {
      const { data: roleData, error: roleError } = await (supabase as any)
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .maybeSingle();

      if (!roleError && isUserRole(roleData?.role)) return roleData.role;

      const { data: rpcRole, error: rpcError } = await (supabase as any)
        .rpc('get_user_role', { _user_id: userId });

      if (!rpcError && isUserRole(rpcRole)) return rpcRole;
    } catch (error) {
      console.warn('Trusted role lookup failed; using least-privilege role.', error);
    }

    return 'user';
  };

  const handleUserSession = async (currentSession: Session | null) => {
    setSession(currentSession);
    const currentUser = currentSession?.user ?? null;
    setUser(currentUser);
    setRole(currentUser ? await determineRole(currentUser.id) : null);
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, currentSession) => {
        await handleUserSession(currentSession);
        setLoading(false);
      }
    );

    supabase.auth.getSession().then(async ({ data: { session: currentSession } }) => {
      await handleUserSession(currentSession);
      setLoading(false);
    }).catch((error) => {
      console.error('Session retrieval error:', error);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const refreshSession = async () => {
    const { data: { session: currentSession } } = await supabase.auth.getSession();
    await handleUserSession(currentSession);
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: { full_name: fullName },
        },
      });
      if (error) throw error;
      if (data.session) await handleUserSession(data.session);
      toast({
        title: 'Account Created!',
        description: data.session
          ? 'You are now authenticated and signed in.'
          : 'Please check your inbox if email verification is required.',
      });
      return { data, error: null };
    } catch (error: any) {
      return { error };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      if (data.session) await handleUserSession(data.session);
      toast({ title: 'Authenticated!', description: 'Welcome back to AniGuard.' });
      return { data, error: null };
    } catch (error: any) {
      return { error };
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setUser(null);
      setSession(null);
      setRole(null);
      toast({ title: 'Signed out', description: 'You have been successfully signed out.' });
    } catch (error: any) {
      console.error('Error signing out:', error);
      toast({
        title: 'Sign out failed',
        description: error?.message || 'Could not complete sign out.',
        variant: 'destructive',
      });
    }
  };

  const resetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      toast({ title: 'Check your email', description: 'Password reset link sent to your inbox.' });
      return { error: null };
    } catch (error: any) {
      return { error };
    }
  };

  return (
    <AuthContext.Provider value={{ user, session, role, loading, signUp, signIn, signOut, resetPassword, refreshSession }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}
