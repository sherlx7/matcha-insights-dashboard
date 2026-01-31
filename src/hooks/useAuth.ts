import { useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface Profile {
  id: string;
  user_id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  approval_status: 'pending' | 'approved' | 'rejected';
  approved_at: string | null;
  approved_by: string | null;
  has_completed_tutorial: boolean;
  created_at: string;
  updated_at: string;
}

interface Permissions {
  can_access_financials: boolean;
  can_access_operations: boolean;
  can_access_sandbox: boolean;
}

interface AuthState {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  permissions: Permissions | null;
  isLoading: boolean;
  isAdmin: boolean;
  isApproved: boolean;
}

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    session: null,
    profile: null,
    permissions: null,
    isLoading: true,
    isAdmin: false,
    isApproved: false,
  });

  const fetchUserData = async (userId: string) => {
    try {
      // Fetch profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      // Fetch role
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .single();

      // Fetch permissions
      const { data: permissionsData } = await supabase
        .from('user_permissions')
        .select('can_access_financials, can_access_operations, can_access_sandbox')
        .eq('user_id', userId)
        .single();

      const isAdmin = roleData?.role === 'admin';
      const isApproved = profileData?.approval_status === 'approved';

      return {
        profile: profileData as Profile | null,
        permissions: permissionsData as Permissions | null,
        isAdmin,
        isApproved,
      };
    } catch (error) {
      console.error('Error fetching user data:', error);
      return {
        profile: null,
        permissions: null,
        isAdmin: false,
        isApproved: false,
      };
    }
  };

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (session?.user) {
          const userData = await fetchUserData(session.user.id);
          setAuthState({
            session,
            user: session.user,
            ...userData,
            isLoading: false,
          });
        } else {
          setAuthState({
            session: null,
            user: null,
            profile: null,
            permissions: null,
            isAdmin: false,
            isApproved: false,
            isLoading: false,
          });
        }
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        const userData = await fetchUserData(session.user.id);
        setAuthState({
          session,
          user: session.user,
          ...userData,
          isLoading: false,
        });
      } else {
        setAuthState({
          session: null,
          user: null,
          profile: null,
          permissions: null,
          isAdmin: false,
          isApproved: false,
          isLoading: false,
        });
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const refetchProfile = async () => {
    if (authState.user) {
      const userData = await fetchUserData(authState.user.id);
      setAuthState((prev) => ({
        ...prev,
        ...userData,
      }));
    }
  };

  return {
    ...authState,
    signOut,
    refetchProfile,
  };
}
