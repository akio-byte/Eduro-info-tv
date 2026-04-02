import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { auth, db, isMockFirebase } from '../lib/firebase';
import { onAuthStateChanged, signOut as firebaseSignOut, User } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';

type Role = 'admin' | 'editor' | null;

interface AuthContextType {
  user: User | null;
  role: Role;
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
  const [role, setRole] = useState<Role>(null);
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
          setRole(userDoc.data().role as Role);
        } else {
          // Create profile for new user
          const defaultRole = firebaseUser.email === 'aki.oksala@gmail.com' ? 'admin' : 'editor';
          await setDoc(userDocRef, {
            email: firebaseUser.email,
            role: defaultRole,
            created_at: serverTimestamp()
          });
          setRole(defaultRole);
        }
      } catch (err) {
        console.error('Error fetching profile:', err);
        setRole('editor'); // Fallback
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
