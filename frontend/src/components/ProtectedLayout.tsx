import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../utils/store';

interface Props {
  children: React.ReactNode;
}

export function ProtectedLayout({ children }: Props) {
  const navigate = useNavigate();
  const { session, loading } = useAuthStore();

  useEffect(() => {
    if (!loading && !session) {
      navigate('/Login');
    }
  }, [session, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            CoupleCents
          </h1>
          <button
            onClick={() => useAuthStore.getState().signOut()}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Sign Out
          </button>
        </div>
      </nav>
      <main className="container mx-auto px-4 py-8">{children}</main>
    </div>
  );
}
