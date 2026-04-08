import React, { useState, useEffect, FormEvent } from 'react';
import { db, isMockFirebase } from '../../lib/firebase';
import { collection, onSnapshot, query, orderBy, updateDoc, deleteDoc, doc, serverTimestamp, addDoc, Timestamp, where } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../../lib/firestore-utils';
import { Button } from '../../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Label } from '../../components/ui/Label';
import { Switch } from '../../components/ui/Switch';
import { Input } from '../../components/ui/Input';
import { Trash2, User as UserIcon, Shield, ShieldAlert, Mail, UserPlus, Clock } from 'lucide-react';
import { format, addDays } from 'date-fns';
import { fi } from 'date-fns/locale';
import { useAuth } from '../../contexts/AuthContext';
import type { UserProfile, Invitation, UserRole } from '../../types/firestore';

export function Users() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<UserRole>('editor');
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const { user: currentUser, role: currentRole, orgId } = useAuth();

  useEffect(() => {
    if (currentRole !== 'admin' || !orgId) {
      setLoading(false);
      return;
    }

    if (isMockFirebase) {
      setUsers([
        { id: '1', email: 'admin@eduro.fi', role: 'admin', org_id: 'default-org', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
        { id: '2', email: 'editor@eduro.fi', role: 'editor', org_id: 'default-org', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
      ]);
      setInvitations([
        { id: 'inv1', email: 'new@eduro.fi', org_id: 'default-org', role: 'editor', invited_by: '1', status: 'pending', created_at: new Date().toISOString(), expires_at: addDays(new Date(), 7).toISOString() }
      ]);
      setLoading(false);
      return;
    }

    const usersQuery = query(
      collection(db, 'users'), 
      where('org_id', '==', orgId),
      orderBy('email', 'asc')
    );
    const unsubUsers = onSnapshot(usersQuery, (snapshot) => {
      const data = snapshot.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data(),
          created_at: doc.data().created_at?.toDate?.()?.toISOString() || doc.data().created_at || new Date().toISOString(),
        } as UserProfile));
      setUsers(data);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'users'));

    const invitesQuery = query(
      collection(db, 'invitations'), 
      where('org_id', '==', orgId),
      orderBy('created_at', 'desc')
    );
    const unsubInvites = onSnapshot(invitesQuery, (snapshot) => {
      const data = snapshot.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data(),
          created_at: doc.data().created_at?.toDate?.()?.toISOString() || doc.data().created_at || new Date().toISOString(),
          expires_at: doc.data().expires_at?.toDate?.()?.toISOString() || doc.data().expires_at || new Date().toISOString(),
        } as Invitation));
      setInvitations(data);
      setLoading(false);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'invitations'));

    return () => {
      unsubUsers();
      unsubInvites();
    };
  }, [currentRole, orgId]);

  async function handleInvite(e: FormEvent) {
    e.preventDefault();
    if (!inviteEmail || !orgId || !currentUser) return;

    if (isMockFirebase) {
      const newInvite: Invitation = {
        id: Math.random().toString(),
        email: inviteEmail,
        org_id: orgId,
        role: inviteRole,
        invited_by: currentUser.uid,
        status: 'pending',
        created_at: new Date().toISOString(),
        expires_at: addDays(new Date(), 7).toISOString()
      };
      setInvitations([newInvite, ...invitations]);
      setInviteEmail('');
      setMessage({ type: 'success', text: `Kutsu lähetetty osoitteeseen ${inviteEmail}` });
      return;
    }

    try {
      await addDoc(collection(db, 'invitations'), {
        email: inviteEmail,
        org_id: orgId,
        role: inviteRole,
        invited_by: currentUser.uid,
        status: 'pending',
        created_at: serverTimestamp(),
        expires_at: Timestamp.fromDate(addDays(new Date(), 7))
      });
      setInviteEmail('');
      setMessage({ type: 'success', text: `Kutsu lähetetty osoitteeseen ${inviteEmail}` });
    } catch (error) {
      setMessage({ type: 'error', text: 'Kutsun lähettäminen epäonnistui.' });
      handleFirestoreError(error, OperationType.CREATE, 'invitations');
    }
  }

  async function toggleRole(userId: string, currentRole: UserRole) {
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

  async function handleDeleteUser(userId: string) {
    if (userId === currentUser?.uid) {
      setMessage({ type: 'error', text: 'Et voi poistaa omaa käyttäjääsi.' });
      return;
    }

    if (!confirm('Haluatko varmasti poistaa tämän käyttäjän?')) return;

    if (isMockFirebase) {
      setUsers(prev => prev.filter(u => u.id !== userId));
      return;
    }

    try {
      await deleteDoc(doc(db, 'users', userId));
      setMessage({ type: 'success', text: 'Käyttäjä poistettu.' });
    } catch (error) {
      setMessage({ type: 'error', text: 'Poisto epäonnistui.' });
      handleFirestoreError(error, OperationType.DELETE, `users/${userId}`);
    }
  }

  async function handleDeleteInvite(inviteId: string) {
    if (!confirm('Haluatko varmasti perua tämän kutsun?')) return;

    if (isMockFirebase) {
      setInvitations(prev => prev.filter(i => i.id !== inviteId));
      return;
    }

    try {
      await deleteDoc(doc(db, 'invitations', inviteId));
      setMessage({ type: 'success', text: 'Kutsu peruttu.' });
    } catch (error) {
      setMessage({ type: 'error', text: 'Kutsun peruminen epäonnistui.' });
      handleFirestoreError(error, OperationType.DELETE, `invitations/${inviteId}`);
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
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Käyttäjien hallinta</h1>
        <p className="text-slate-500 mt-2">Kutsu uusia käyttäjiä ja hallitse organisaatiosi jäseniä.</p>
      </div>

      {message && (
        <div className={`p-4 rounded-md ${message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
          {message.text}
        </div>
      )}

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <UserPlus className="h-5 w-5" />
                Kutsu käyttäjä
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleInvite} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Sähköpostiosoite</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="matti.meikalainen@eduro.fi"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Rooli</Label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="role"
                        checked={inviteRole === 'editor'}
                        onChange={() => setInviteRole('editor')}
                        className="text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className="text-sm">Toimittaja</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="role"
                        checked={inviteRole === 'admin'}
                        onChange={() => setInviteRole('admin')}
                        className="text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className="text-sm">Ylläpitäjä</span>
                    </label>
                  </div>
                </div>
                <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white">
                  Lähetä kutsu
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <section className="space-y-4">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Shield className="h-5 w-5 text-slate-400" />
              Aktiiviset käyttäjät
            </h2>
            <div className="grid gap-4">
              {loading ? (
                <div className="text-slate-500">Ladataan...</div>
              ) : users.length === 0 ? (
                <Card><CardContent className="py-8 text-center text-slate-500">Ei käyttäjiä.</CardContent></Card>
              ) : (
                users.map((user) => (
                  <Card key={user.id} className={user.id === currentUser?.uid ? 'border-indigo-100 bg-indigo-50/30' : ''}>
                    <CardContent className="flex items-center justify-between p-4">
                      <div className="flex items-center space-x-3">
                        <div className={`p-2 rounded-full ${user.role === 'admin' ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-600'}`}>
                          {user.role === 'admin' ? <ShieldAlert className="h-5 w-5" /> : <Shield className="h-5 w-5" />}
                        </div>
                        <div>
                          <h3 className="font-medium text-slate-900 flex items-center">
                            {user.email}
                            {user.id === currentUser?.uid && (
                              <span className="ml-2 text-[10px] uppercase font-bold bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded">Sinä</span>
                            )}
                          </h3>
                          <p className="text-xs text-slate-500">
                            {user.role === 'admin' ? 'Ylläpitäjä' : 'Toimittaja'}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-2">
                          <Label htmlFor={`role-${user.id}`} className="text-xs">Ylläpitäjä</Label>
                          <Switch
                            id={`role-${user.id}`}
                            checked={user.role === 'admin'}
                            onCheckedChange={() => toggleRole(user.id, user.role)}
                            disabled={user.id === currentUser?.uid}
                            className="scale-75"
                          />
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-slate-400 hover:text-red-600"
                          onClick={() => handleDeleteUser(user.id)}
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
          </section>

          {invitations.length > 0 && (
            <section className="space-y-4">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <Mail className="h-5 w-5 text-slate-400" />
                Odottavat kutsut
              </h2>
              <div className="grid gap-4">
                {invitations.map((invite) => (
                  <Card key={invite.id} className="border-dashed">
                    <CardContent className="flex items-center justify-between p-4">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 rounded-full bg-slate-50 text-slate-400">
                          <Clock className="h-5 w-5" />
                        </div>
                        <div>
                          <h3 className="font-medium text-slate-900">{invite.email}</h3>
                          <p className="text-xs text-slate-500">
                            Kutsuttu: {format(new Date(invite.created_at), 'd.M.yyyy', { locale: fi })} • 
                            Rooli: {invite.role === 'admin' ? 'Ylläpitäjä' : 'Toimittaja'}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-slate-400 hover:text-red-600"
                        onClick={() => handleDeleteInvite(invite.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
