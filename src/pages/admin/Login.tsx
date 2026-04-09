import { useState, FormEvent } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { auth, googleProvider, isMockFirebase } from '../../lib/firebase';
import { signInWithPopup } from 'firebase/auth';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../../components/ui/Button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Label } from '../../components/ui/Label';
import { MonitorPlay, Mail, Lock, LogIn, UserPlus } from 'lucide-react';

export function Login() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<'login' | 'signup' | 'reset'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  
  const navigate = useNavigate();
  const { user, isLoading, signInWithEmail, signUpWithEmail, resetPassword } = useAuth();

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

  const handleEmailAuth = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      if (mode === 'login') {
        await signInWithEmail(email, password);
      } else if (mode === 'signup') {
        await signUpWithEmail(email, password);
      } else if (mode === 'reset') {
        await resetPassword(email);
        setMessage({ type: 'success', text: 'Salasanan palautuslinkki lähetetty sähköpostiisi.' });
        setMode('login');
      }
      if (mode !== 'reset') navigate('/admin');
    } catch (err: any) {
      console.error('Auth error:', err);
      setError(err.message || 'Toiminto epäonnistui.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
      <Card className="w-full max-w-md shadow-xl border-slate-200">
        <CardHeader className="space-y-2 text-center">
          <div className="flex justify-center mb-4">
            <div className="rounded-2xl bg-indigo-600 p-3 shadow-lg shadow-indigo-200">
              <MonitorPlay className="h-8 w-8 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-slate-900">Eduro InfoTV</CardTitle>
          <CardDescription className="text-slate-500">
            {mode === 'login' ? 'Kirjaudu sisään hallintapaneeliin' : 
             mode === 'signup' ? 'Luo uusi tili' : 'Palauta salasana'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {error && (
            <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600 border border-red-100">
              {error}
            </div>
          )}
          {message && (
            <div className={`rounded-lg p-3 text-sm border ${
              message.type === 'success' ? 'bg-green-50 text-green-600 border-green-100' : 'bg-red-50 text-red-600 border-red-100'
            }`}>
              {message.text}
            </div>
          )}

          {mode === 'signup' && (
            <div className="rounded-lg bg-indigo-50 p-3 text-sm text-indigo-700 border border-indigo-100">
              <p className="font-medium mb-1">Onko sinut kutsuttu?</p>
              <p>Käytä kutsussa annettua sähköpostiosoitetta. Rekisteröitymisen jälkeen sinut liitetään automaattisesti organisaatioon.</p>
            </div>
          )}
          
          <div className="flex p-1 bg-slate-100 rounded-lg mb-2">
            <button 
              onClick={() => { setMode('login'); setError(null); setMessage(null); }}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${mode === 'login' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Kirjaudu
            </button>
            <button 
              onClick={() => { setMode('signup'); setError(null); setMessage(null); }}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${mode === 'signup' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Luo tili
            </button>
          </div>

          <form onSubmit={handleEmailAuth} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Sähköposti</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="matti@eduro.fi" 
                  className="pl-10"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required 
                />
              </div>
            </div>
            
            {mode !== 'reset' && (
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label htmlFor="password">Salasana</Label>
                  {mode === 'login' && (
                    <button 
                      type="button"
                      onClick={() => setMode('reset')}
                      className="text-xs text-indigo-600 hover:underline"
                    >
                      Unohditko salasanan?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <Input 
                    id="password" 
                    type="password" 
                    placeholder="••••••••" 
                    className="pl-10"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required={mode !== 'reset'}
                  />
                </div>
              </div>
            )}

            <Button 
              type="submit" 
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white h-11" 
              disabled={loading}
            >
              {loading ? 'Käsitellään...' : 
               mode === 'login' ? 'Kirjaudu sisään' : 
               mode === 'signup' ? 'Luo tili' : 'Lähetä palautuslinkki'}
            </Button>
            
            {mode === 'reset' && (
              <button 
                type="button"
                onClick={() => setMode('login')}
                className="w-full text-sm text-slate-500 hover:text-slate-700"
              >
                Palaa kirjautumiseen
              </button>
            )}
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-slate-400">Tai jatka</span>
            </div>
          </div>

          <Button 
            className="w-full flex items-center justify-center gap-3 h-11 text-slate-700 font-medium border-slate-200 hover:bg-slate-50" 
            onClick={handleGoogleLogin} 
            disabled={loading}
            variant="outline"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24">
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
            Google-tilillä
          </Button>
        </CardContent>
        <CardFooter className="flex flex-col text-center text-xs text-slate-400">
          <p>Kirjautumalla hyväksyt palvelun käyttöehdot.</p>
        </CardFooter>
      </Card>
    </div>
  );
}

