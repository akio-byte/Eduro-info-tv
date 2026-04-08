import { Outlet, Navigate } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Button } from '../ui/Button';
import { useAuth } from '../../contexts/AuthContext';

export function AdminLayout() {
  const { user, role, isLoading, signOut } = useAuth();

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <div className="text-slate-500">Ladataan...</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/admin/login" replace />;
  }

  // Prevent access if no role is assigned (e.g. profile creation failed or unauthorized)
  if (!role) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-slate-50 p-4 text-center">
        <div className="max-w-md space-y-4">
          <h1 className="text-2xl font-bold text-slate-900">Pääsy evätty</h1>
          <p className="text-slate-600">
            Sinulla ei ole oikeuksia hallintapaneeliin tai profiilisi lataaminen epäonnistui.
            Varmista, että olet saanut kutsun järjestelmään.
          </p>
          <Button onClick={() => signOut()} variant="outline">
            Kirjaudu ulos
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-white">
      <Sidebar />
      <main className="flex-1 overflow-y-auto bg-slate-50/50 p-8">
        <div className="mx-auto max-w-5xl">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
