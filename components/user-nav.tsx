
import { verifySession } from '@/lib/auth';
import { UserNavClient } from './user-nav-client';

export async function UserNav() {
  const session = await verifySession();
  return <UserNavClient user={session} />;
}
