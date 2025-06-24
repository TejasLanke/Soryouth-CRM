
import 'server-only';
import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import bcrypt from 'bcryptjs';

const secretKey = process.env.JWT_SECRET;

if (!secretKey) {
  throw new Error('JWT_SECRET environment variable is not set');
}

const key = new TextEncoder().encode(secretKey);

export async function encrypt(payload: any) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('1d') // Set session to expire in 1 day
    .sign(key);
}

export async function decrypt(input: string): Promise<any> {
  try {
    const { payload } = await jwtVerify(input, key, {
      algorithms: ['HS256'],
    });
    return payload;
  } catch (error) {
    // This will be caught for expired or invalid tokens
    console.log('Failed to verify session');
    return null;
  }
}

export async function createSession(userId: string, name: string, email: string) {
  const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 1 day
  const session = await encrypt({ userId, name, email, expires });

  (await cookies()).set('session', session, { expires, httpOnly: true });
}

export async function verifySession() {
  const cookie = (await cookies()).get('session')?.value;
  if (!cookie) {
    return null;
  }
  const session = await decrypt(cookie);
  if (!session?.userId) {
    return null;
  }
  return { isAuth: true, userId: session.userId, name: session.name, email: session.email };
}

export async function deleteSession() {
  (await cookies()).delete('session');
}

export async function hashPassword(password: string) {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(password, salt);
}

export async function comparePassword(password: string, hash: string) {
  return await bcrypt.compare(password, hash);
}
