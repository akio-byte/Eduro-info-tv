import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { auth, googleProvider, isMockFirebase } from '../../lib/firebase';
import { signInWithPopup } from 'firebase/auth';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../../components/ui/Button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../../components/ui/Card';
import { MonitorPlay } from 'lucide-react';

export function Login() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <div className="text-slate-500">Ladataan...</div>
      </div>
    );
  }

  if (user) {
    return <Navigate to="/admin" replace />;
  }

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);

    if (isMockFirebase) {
      // Mock login success is handled by AuthContext
      setTimeout(() => {
        navigate('/admin');
      }, 500);
      return;
    }

    try {
      await signInWithPopup(auth, googleProvider);
      navigate('/admin');
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.message || 'Kirjautuminen epäonnistui.');
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-2 text-center">
          <div className="flex justify-center mb-4">
            <div className="rounded-full bg-slate-100 p-3">
              <MonitorPlay className="h-8 w-8 text-slate-900" />
            </div>
          </div>
          <CardTitle className="text-2xl">Eduro InfoTV</CardTitle>
          <CardDescription>
            Kirjaudu sisään hallintapaneeliin
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <div className="rounded-md bg-red-50 p-3 text-sm text-red-500">
              {error}
            </div>
          )}
          {isMockFirebase && (
            <div className="rounded-md bg-blue-50 p-3 text-sm text-blue-600">
              Huom: Sovellus käyttää mock-dataa. Voit kirjautua sisään millä tahansa tunnuksilla.
            </div>
          )}
          
          <div className="py-4">
            <Button 
              className="w-full flex items-center justify-center gap-3 h-12 text-lg font-medium" 
              onClick={handleGoogleLogin} 
              disabled={loading}
              variant="outline"
            >
              <svg className="h-6 w-6" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.27.81-.57z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
              Jatka Google-tilillä
            </Button>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col text-center text-xs text-slate-400">
          <p>Kirjautumalla hyväksyt palvelun käyttöehdot.</p>
        </CardFooter>
      </Card>
    </div>
  );
}
