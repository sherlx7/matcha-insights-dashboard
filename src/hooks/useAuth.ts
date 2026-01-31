import { useState, useEffect, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface UserProfile {
  id: string;
  user_id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  approval_status: 'pending' | 'approved' | 'rejected';
}

interface UserPermissions {
  can_access_financials: boolean;
  can_access_operations: boolean;
  can_access_sandbox: boolean;
}

interface AuthState {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  permissions: UserPermissions | null;
  isAdmin: boolean;
  isApproved: boolean;
  isLoading: boolean;
}

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    session: null,
    profile: null,
    permissions: null,
    isAdmin: false,
    isApproved: false,
    isLoading: true,
  });

  const fetchUserData = useCallback(async (userId: string) => {
    try {
      // Fetch profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      // Fetch permissions
      const { data: permissions } = await supabase
        .from('user_permissions')
        .select('can_access_financials, can_access_operations, can_access_sandbox')
        .eq('user_id', userId)
        .single();

      // Fetch role
      const { data: roles } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId);

      const isAdmin = roles?.some(r => r.role === 'admin') ?? false;
      const isApproved = profile?.approval_status === 'approved';

      return { profile, permissions, isAdmin, isApproved };
    } catch (error) {
      console.error('Error fetching user data:', error);
      return { profile: null, permissions: null, isAdmin: false, isApproved: false };
    }
  }, []);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setAuthState(prev => ({
          ...prev,
          session,
          user: session?.user ?? null,
        }));

        // Defer fetching user data to avoid deadlock
        if (session?.user) {
          setTimeout(() => {
            fetchUserData(session.user.id).then(({ profile, permissions, isAdmin, isApproved }) => {
              setAuthState(prev => ({
                ...prev,
                profile: profile as UserProfile | null,
                permissions: permissions as UserPermissions | null,
                isAdmin,
                isApproved,
                isLoading: false,
              }));
            });
          }, 0);
        } else {
          setAuthState(prev => ({
            ...prev,
            profile: null,
            permissions: null,
            isAdmin: false,
            isApproved: false,
            isLoading: false,
          }));
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setAuthState(prev => ({
        ...prev,
        session,
        user: session?.user ?? null,
      }));

      if (session?.user) {
        fetchUserData(session.user.id).then(({ profile, permissions, isAdmin, isApproved }) => {
          setAuthState(prev => ({
            ...prev,
            profile: profile as UserProfile | null,
            permissions: permissions as UserPermissions | null,
            isAdmin,
            isApproved,
            isLoading: false,
          }));
        });
      } else {
        setAuthState(prev => ({ ...prev, isLoading: false }));
      }
    });

    return () => subscription.unsubscribe();
  }, [fetchUserData]);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return {
    ...authState,
    signOut,
  };
}
