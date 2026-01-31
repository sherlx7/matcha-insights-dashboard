import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';

type HealthStatus = 'checking' | 'connected' | 'error';

interface HealthCheckResult {
  status: HealthStatus;
  message: string;
  details?: string;
}

export function useSupabaseHealth() {
  const [health, setHealth] = useState<HealthCheckResult>({
    status: 'checking',
    message: 'Checking connection...',
  });

  useEffect(() => {
    const checkHealth = async () => {
      // First check if env vars are present
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

      if (!supabaseUrl || !supabaseKey) {
        setHealth({
          status: 'error',
          message: 'Configuration Error',
          details: 'Missing Supabase environment variables. Please set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY.',
        });
        return;
      }

      try {
        // Try to get auth session as a lightweight connectivity check
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          setHealth({
            status: 'error',
            message: 'Connection Error',
            details: error.message,
          });
          return;
        }

        setHealth({
          status: 'connected',
          message: 'Connected to Supabase',
          details: data.session ? 'Authenticated' : 'Anonymous',
        });
      } catch (err) {
        setHealth({
          status: 'error',
          message: 'Network Error',
          details: err instanceof Error ? err.message : 'Failed to connect to Supabase',
        });
      }
    };

    checkHealth();
  }, []);

  return health;
}

export function SupabaseHealthIndicator({ showDetails = false }: { showDetails?: boolean }) {
  const health = useSupabaseHealth();

  const statusColors = {
    checking: 'text-yellow-500',
    connected: 'text-green-500',
    error: 'text-red-500',
  };

  const StatusIcon = {
    checking: Loader2,
    connected: CheckCircle2,
    error: AlertCircle,
  }[health.status];

  return (
    <div className="flex items-center gap-2 text-sm">
      <StatusIcon 
        className={`h-4 w-4 ${statusColors[health.status]} ${health.status === 'checking' ? 'animate-spin' : ''}`} 
      />
      <span className={statusColors[health.status]}>{health.message}</span>
      {showDetails && health.details && (
        <span className="text-muted-foreground">({health.details})</span>
      )}
    </div>
  );
}

export function SupabaseHealthBanner() {
  const health = useSupabaseHealth();

  if (health.status === 'connected') {
    return null;
  }

  if (health.status === 'checking') {
    return (
      <div className="bg-yellow-50 border-b border-yellow-200 px-4 py-2 text-center text-sm text-yellow-800">
        <Loader2 className="inline h-4 w-4 animate-spin mr-2" />
        Checking database connection...
      </div>
    );
  }

  return (
    <div className="bg-red-50 border-b border-red-200 px-4 py-3 text-center">
      <div className="flex items-center justify-center gap-2 text-red-800">
        <AlertCircle className="h-5 w-5" />
        <span className="font-medium">{health.message}</span>
      </div>
      {health.details && (
        <p className="text-sm text-red-600 mt-1">{health.details}</p>
      )}
    </div>
  );
}
