import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { auth, db, isMockFirebase } from '../lib/firebase';
import { onAuthStateChanged, signOut as firebaseSignOut, User } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp, collection, query, limit, getDocs } from 'firebase/firestore';
import type { UserRole } from '../types/firestore';

interface AuthContextType {
  user: User | null;
  role: UserRole | null;
  isLoading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  role: null,
  isLoading: true,
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isMockFirebase) {
      setUser({ uid: 'mock-user', email: 'admin@eduro.fi', displayName: 'Mock Admin' } as any);
      setRole('admin');
      setIsLoading(false);
      return;
    }

    const fetchProfile = async (firebaseUser: User) => {
      try {
        const userDocRef = doc(db, 'users', firebaseUser.uid);
        const userDoc = await getDoc(userDocRef);
        
        if (userDoc.exists()) {
          setRole(userDoc.data().role as UserRole);
        } else {
          // Check if this is the first user in the system
          const usersRef = collection(db, 'users');
          const q = query(usersRef, limit(1));
          const snapshot = await getDocs(q);
          
          let defaultRole: UserRole = 'editor';
          
          // If no users exist, the first one becomes admin
          if (snapshot.empty) {
            defaultRole = 'admin';
          } else {
            // Check for initial admin email from environment
            const initialAdminEmail = import.meta.env.VITE_INITIAL_ADMIN_EMAIL;
            if (initialAdminEmail && firebaseUser.email === initialAdminEmail) {
              defaultRole = 'admin';
            }
          }

          await setDoc(userDocRef, {
            email: firebaseUser.email,
            role: defaultRole,
            created_at: serverTimestamp(),
            updated_at: serverTimestamp()
          });
          setRole(defaultRole);
        }
      } catch (err) {
        console.error('Error fetching profile:', err);
        // Don't set a default role on error to prevent unauthorized access
        setRole(null);
      }
    };

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        await fetchProfile(firebaseUser);
      } else {
        setUser(null);
        setRole(null);
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
  };

  return (
    <AuthContext.Provider value={{ user, role, isLoading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
