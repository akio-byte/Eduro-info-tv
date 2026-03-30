import { useState, useEffect, FormEvent } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { supabase, isMockSupabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Label } from '../../components/ui/Label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../../components/ui/Card';
import { MonitorPlay } from 'lucide-react';

export function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (isMockSupabase) {
      // Mock login success handled by AuthContext (it sets mock user on mount)
      // but if we are here, it means we somehow bypassed it. Let's just navigate.
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
        <form onSubmit={handleLogin}>
          <CardContent className="space-y-4">
            {error && (
              <div className="rounded-md bg-red-50 p-3 text-sm text-red-500">
                {error}
              </div>
            )}
            {isMockSupabase && (
              <div className="rounded-md bg-blue-50 p-3 text-sm text-blue-600">
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
