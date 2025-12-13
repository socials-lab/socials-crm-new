import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
// TEMPORARILY DISABLED - Supabase auth
// import { useAuth } from '@/hooks/useAuth';

// Temporary Auth page - Supabase disabled, auto-redirect to home
export default function Auth() {
  const navigate = useNavigate();
  
  useEffect(() => {
    // Auto-redirect since auth is disabled
    navigate('/');
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <p className="text-muted-foreground">Přesměrování...</p>
    </div>
  );
}
