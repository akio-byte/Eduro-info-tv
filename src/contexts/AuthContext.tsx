import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { auth, db, isMockFirebase } from '../lib/firebase';
import { onAuthStateChanged, signOut as firebaseSignOut, User } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp, collection, query, where, limit, getDocs, updateDoc } from 'firebase/firestore';
import type { UserRole } from '../types/firestore';

interface AuthContextType {
  user: User | null;
  role: UserRole | null;
  orgId: string | null;
  isLoading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  role: null,
  orgId: null,
  isLoading: true,
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [orgId, setOrgId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isMockFirebase) {
      setUser({ uid: 'mock-user', email: 'admin@eduro.fi', displayName: 'Mock Admin' } as any);
      setRole('admin');
      setOrgId('default-org');
      setIsLoading(false);
      return;
    }

    const fetchProfile = async (firebaseUser: User) => {
      // Prevent redundant calls if already loading or already set
      if (role && user?.uid === firebaseUser.uid) return;

      try {
        const userDocRef = doc(db, 'users', firebaseUser.uid);
        const userDoc = await getDoc(userDocRef);
        
        if (userDoc.exists()) {
          const data = userDoc.data();
          setRole(data.role as UserRole);
          setOrgId(data.org_id || 'default-org');
        } else {
          // Check for pending invitation
          const invitesRef = collection(db, 'invitations');
          const qInvite = query(
            invitesRef, 
            where('email', '==', firebaseUser.email), 
            where('status', '==', 'pending'),
            limit(1)
          );
          const inviteSnapshot = await getDocs(qInvite);
          
          let defaultRole: UserRole = 'editor';
          let defaultOrgId = 'default-org';
          let invitationId: string | null = null;

          if (!inviteSnapshot.empty) {
            const inviteDoc = inviteSnapshot.docs[0];
            const inviteData = inviteDoc.data();
            defaultRole = inviteData.role;
            defaultOrgId = inviteData.org_id;
            invitationId = inviteDoc.id;
          } else {
            // Check for initial admin email from environment
            const initialAdminEmail = import.meta.env.VITE_INITIAL_ADMIN_EMAIL;
            
            if (initialAdminEmail && firebaseUser.email === initialAdminEmail) {
              defaultRole = 'admin';
            } else {
              // Check if this is the first user in the system (bootstrap)
              // We'll try to see if any users exist, but we must handle permission errors
              try {
                const usersRef = collection(db, 'users');
                const qUsers = query(usersRef, limit(1));
                const usersSnapshot = await getDocs(qUsers);
                
                if (usersSnapshot.empty) {
                  defaultRole = 'admin';
                } else {
                  throw new Error('Sinulla ei ole kutsua tähän järjestelmään.');
                }
              } catch (err) {
                // If we can't check if users exist, and we aren't the bootstrap admin, we block
                if (err instanceof Error && err.message === 'Sinulla ei ole kutsua tähän järjestelmään.') {
                  throw err;
                }
                console.error('Permission error checking for first user, assuming not first:', err);
                throw new Error('Sinulla ei ole kutsua tähän järjestelmään.');
              }
            }
          }

          await setDoc(userDocRef, {
            email: firebaseUser.email,
            role: defaultRole,
            org_id: defaultOrgId,
            created_at: serverTimestamp(),
            updated_at: serverTimestamp()
          });

          if (invitationId) {
            await updateDoc(doc(db, 'invitations', invitationId), {
              status: 'accepted',
              updated_at: serverTimestamp()
            });
          }

          setRole(defaultRole);
          setOrgId(defaultOrgId);
        }
      } catch (err) {
        console.error('Error fetching profile:', err);
        setRole(null);
        setOrgId(null);
        // If it's an invitation error, we might want to sign out
        if (err instanceof Error && err.message === 'Sinulla ei ole kutsua tähän järjestelmään.') {
          await firebaseSignOut(auth);
        }
      }
    };

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        await fetchProfile(firebaseUser);
      } else {
        setUser(null);
        setRole(null);
        setOrgId(null);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signOut = async () => {
    if (!isMockFirebase) {
      await firebaseSignOut(auth);
    }
    setUser(null);
    setRole(null);
    setOrgId(null);
  };

  return (
    <AuthContext.Provider value={{ user, role, orgId, isLoading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
