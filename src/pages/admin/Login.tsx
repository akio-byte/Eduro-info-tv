import { useState, useEffect, FormEvent } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { supabase, isMockSupabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Label } from '../../components/ui/Label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../../components/ui/Card';

export function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { user, isLoading } = useAuth();

  useEffect(() => {
    document.title = 'Eduro InfoTV';
  }, []);

  if (isLoading) {
    return (
      <div className="brand-admin-shell flex h-screen items-center justify-center">
        <div className="text-slate-500">Ladataan...</div>
      </div>
    );
  }

  if (user) {
    return <Navigate to="/admin" replace />;
  }

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (isMockSupabase) {
      setTimeout(() => {
        navigate('/admin');
      }, 500);
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      navigate('/admin');
    }
  };

  return (
    <div className="brand-admin-shell flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md overflow-hidden">
        <CardHeader className="space-y-4 border-b border-[var(--color-brand-border)] bg-[var(--color-brand-panel)]/90 text-center">
          <div className="mx-auto inline-flex rounded-2xl bg-[var(--color-brand-surface-muted)] px-5 py-4">
            <div className="brand-wordmark items-center">
              <span className="brand-wordmark__eyebrow text-[var(--color-brand-primary)]">Eduro</span>
              <span className="brand-wordmark__title text-[var(--color-brand-ink)]">InfoTV</span>
            </div>
          </div>
          <div>
            <CardTitle className="text-2xl">Hallintapaneeli</CardTitle>
            <CardDescription>Kirjaudu sisään hallinnoimaan aulan näytön sisältöä.</CardDescription>
          </div>
        </CardHeader>
        <form onSubmit={handleLogin}>
          <CardContent className="space-y-4 pt-6">
            {error && <div className="rounded-md bg-red-50 p-3 text-sm text-red-600">{error}</div>}
            {isMockSupabase && (
              <div className="rounded-md bg-[var(--color-brand-surface-muted)] p-3 text-sm text-[var(--color-brand-primary)]">
                Huom: Sovellus käyttää mock-dataa. Voit kirjautua sisään millä tahansa tunnuksilla.
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">Sähköposti</Label>
              <Input
                id="email"
                type="email"
                placeholder="nimi@eduro.fi"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Salasana</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button className="w-full" type="submit" disabled={loading}>
              {loading ? 'Kirjaudutaan...' : 'Kirjaudu sisään'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
