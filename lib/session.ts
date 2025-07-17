
'use server';

import { verifySession } from './auth';

export async function getSession() {
    return await verifySession();
}
