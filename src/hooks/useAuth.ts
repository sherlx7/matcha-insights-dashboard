import { useState, useEffect } from 'react';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

interface User {
  id: string;
  email: string;
  name: string | null;
  role: 'ADMIN' | 'VIEWER' | 'USER';
}

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
  session: { token: string } | null;
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

  const checkAuth = async () => {
    const token = localStorage.getItem('matcha_auth_token');
    const storedUser = localStorage.getItem('matcha_user');

    if (!token || !storedUser) {
      setAuthState({
        user: null,
        session: null,
        profile: null,
        permissions: null,
        isLoading: false,
        isAdmin: false,
        isApproved: false,
      });
      return;
    }

    try {
      // Verify token with backend
      const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        // Token invalid, clear storage
        localStorage.removeItem('matcha_auth_token');
        localStorage.removeItem('matcha_user');
        setAuthState({
          user: null,
          session: null,
          profile: null,
          permissions: null,
          isLoading: false,
          isAdmin: false,
          isApproved: false,
        });
        return;
      }

      const userData = await response.json();
      const user = userData.user;
      const isAdmin = user.role === 'ADMIN';

      // Create a profile-like object from user data
      const profile: Profile = {
        id: user.id,
        user_id: user.id,
        email: user.email,
        full_name: user.name,
        avatar_url: null,
        approval_status: 'approved', // All users are approved in our system
        approved_at: null,
        approved_by: null,
        has_completed_tutorial: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // All ADMIN users have full permissions
      const permissions: Permissions = {
        can_access_financials: isAdmin,
        can_access_operations: isAdmin,
        can_access_sandbox: isAdmin,
      };

      setAuthState({
        user,
        session: { token },
        profile,
        permissions,
        isLoading: false,
        isAdmin,
        isApproved: true,
      });
    } catch (error) {
      console.error('Error checking auth:', error);
      setAuthState({
        user: null,
        session: null,
        profile: null,
        permissions: null,
        isLoading: false,
        isAdmin: false,
        isApproved: false,
      });
    }
  };

  useEffect(() => {
    checkAuth();

    // Listen for storage changes (login/logout from other tabs)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'matcha_auth_token') {
        checkAuth();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const signOut = async () => {
    localStorage.removeItem('matcha_auth_token');
    localStorage.removeItem('matcha_user');
    setAuthState({
      user: null,
      session: null,
      profile: null,
      permissions: null,
      isLoading: false,
      isAdmin: false,
      isApproved: false,
    });
    window.location.href = '/auth';
  };

  const refetchProfile = async () => {
    await checkAuth();
  };

  return {
    ...authState,
    signOut,
    refetchProfile,
  };
}
