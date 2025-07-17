
'use client';

import { useState, useEffect } from 'react';
import { getSession } from '@/lib/session';

type Session = {
  isAuth: boolean;
  userId: string;
  name: string;
  email: string;
  role: string;
} | null;


// This is a client-side hook to get session data without making a new server request on every render.
// It's useful for components deep in the tree that need user info.
export function useSession() {
  const [session, setSession] = useState<Session | undefined>(undefined);

  useEffect(() => {
    getSession().then(setSession);
  }, []);

  return session;
}
