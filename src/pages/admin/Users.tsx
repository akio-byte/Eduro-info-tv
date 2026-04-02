import { useState, useEffect } from 'react';
import { db, isMockFirebase } from '../../lib/firebase';
import { collection, onSnapshot, query, orderBy, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../../lib/firestore-utils';
import { Button } from '../../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Label } from '../../components/ui/Label';
import { Switch } from '../../components/ui/Switch';
import { Trash2, User as UserIcon, Shield, ShieldAlert } from 'lucide-react';
import { format } from 'date-fns';
import { fi } from 'date-fns/locale';
import { useAuth } from '../../contexts/AuthContext';

interface UserProfile {
  id: string;
  email: string;
  role: 'admin' | 'editor';
  created_at: any;
}

export function Users() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const { user: currentUser, role: currentRole } = useAuth();

  useEffect(() => {
    if (currentRole !== 'admin') {
      setLoading(false);
      return;
    }

    if (isMockFirebase) {
      setUsers([
        { id: '1', email: 'admin@eduro.fi', role: 'admin', created_at: new Date().toISOString() },
        { id: '2', email: 'editor@eduro.fi', role: 'editor', created_at: new Date().toISOString() },
      ]);
      setLoading(false);
      return;
    }

    const q = query(collection(db, 'users'), orderBy('email', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        created_at: doc.data().created_at?.toDate?.()?.toISOString() || doc.data().created_at || new Date().toISOString(),
      } as UserProfile));
      setUsers(data);
      setLoading(false);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'users'));

    return () => unsubscribe();
  }, [currentRole]);

  async function toggleRole(userId: string, currentRole: 'admin' | 'editor') {
    if (userId === currentUser?.uid) {
      setMessage({ type: 'error', text: 'Et voi muuttaa omaa rooliasi.' });
      return;
    }

    const newRole = currentRole === 'admin' ? 'editor' : 'admin';
    
    if (isMockFirebase) {
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
      return;
    }

    try {
      await updateDoc(doc(db, 'users', userId), {
        role: newRole,
        updated_at: serverTimestamp(),
      });
      setMessage({ type: 'success', text: `Käyttäjän rooli päivitetty: ${newRole}` });
    } catch (error) {
      setMessage({ type: 'error', text: 'Roolin päivitys epäonnistui.' });
      handleFirestoreError(error, OperationType.UPDATE, `users/${userId}`);
    }
  }

  async function handleDelete(userId: string) {
    if (userId === currentUser?.uid) {
      setMessage({ type: 'error', text: 'Et voi poistaa omaa käyttäjääsi.' });
      return;
    }

    if (!confirm('Haluatko varmasti poistaa tämän käyttäjän profiilin? Huom: Tämä ei poista käyttäjää Firebase Authenticationista, mutta hän ei enää pääse hallintapaneeliin.')) return;

    if (isMockFirebase) {
      setUsers(prev => prev.filter(u => u.id !== userId));
      return;
    }

    try {
      await deleteDoc(doc(db, 'users', userId));
      setMessage({ type: 'success', text: 'Käyttäjäprofiili poistettu.' });
    } catch (error) {
      setMessage({ type: 'error', text: 'Poisto epäonnistui.' });
      handleFirestoreError(error, OperationType.DELETE, `users/${userId}`);
    }
  }

  if (currentRole !== 'admin') {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-slate-900">Ei käyttöoikeutta</h2>
          <p className="mt-2 text-slate-500">Vain ylläpitäjät voivat hallita käyttäjiä.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Käyttäjät</h1>
        <p className="text-slate-500 mt-2">Hallitse hallintapaneelin käyttäjiä ja heidän roolejaan.</p>
      </div>

      {message && (
        <div className={`p-4 rounded-md ${message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
          {message.text}
        </div>
      )}

      <div className="grid gap-4">
        {loading ? (
          <div className="text-slate-500">Ladataan...</div>
        ) : users.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-slate-500">
              Ei käyttäjiä löytynyt.
            </CardContent>
          </Card>
        ) : (
          users.map((user) => (
            <Card key={user.id} className={user.id === currentUser?.uid ? 'border-blue-200 bg-blue-50/30' : ''}>
              <CardContent className="flex items-center justify-between p-6">
                <div className="flex items-center space-x-4">
                  <div className={`p-2 rounded-full ${user.role === 'admin' ? 'bg-purple-100 text-purple-600' : 'bg-slate-100 text-slate-600'}`}>
                    {user.role === 'admin' ? <ShieldAlert className="h-6 w-6" /> : <Shield className="h-6 w-6" />}
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900 flex items-center">
                      {user.email}
                      {user.id === currentUser?.uid && (
                        <span className="ml-2 text-xs font-normal bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">Sinä</span>
                      )}
                    </h3>
                    <p className="text-sm text-slate-500">
                      Rooli: {user.role === 'admin' ? 'Ylläpitäjä' : 'Toimittaja'} • 
                      Liittynyt: {format(new Date(user.created_at), 'd.M.yyyy', { locale: fi })}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-6">
                  <div className="flex items-center space-x-2">
                    <Label htmlFor={`role-${user.id}`} className="text-sm font-medium">
                      Ylläpitäjä
                    </Label>
                    <Switch
                      id={`role-${user.id}`}
                      checked={user.role === 'admin'}
                      onCheckedChange={() => toggleRole(user.id, user.role)}
                      disabled={user.id === currentUser?.uid}
                    />
                  </div>
                  
                  <Button
                    variant="outline"
                    size="icon"
                    className="text-red-500 hover:text-red-600 hover:bg-red-50"
                    onClick={() => handleDelete(user.id)}
                    disabled={user.id === currentUser?.uid}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <Card className="bg-slate-50 border-dashed">
        <CardContent className="p-6">
          <div className="flex items-start space-x-3">
            <UserIcon className="h-5 w-5 text-slate-400 mt-0.5" />
            <div>
              <h4 className="font-medium text-slate-900">Kuinka lisätä uusia käyttäjiä?</h4>
              <p className="text-sm text-slate-500 mt-1">
                Uudet käyttäjät voivat kirjautua sisään hallintapaneelin kirjautumissivulla. 
                Ensimmäisen kirjautumisen jälkeen heidät lisätään tähän listaan "Toimittaja"-roolilla. 
                Ylläpitäjänä voit sen jälkeen muuttaa heidän rooliaan tai poistaa heidät.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
