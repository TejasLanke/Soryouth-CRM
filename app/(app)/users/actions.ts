
'use server';

import { z } from 'zod';
import prisma from '@/lib/prisma';
import { hashPassword } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import type { User, UserRole } from '@/types';
import { USER_ROLES } from '@/lib/constants';

function mapPrismaUserToUserType(prismaUser: any): User {
    return {
      id: prismaUser.id,
      name: prismaUser.name,
      email: prismaUser.email,
      phone: prismaUser.phone,
      role: prismaUser.role,
      createdAt: prismaUser.createdAt.toISOString(),
    };
  }

const addUserSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  email: z.string().email({ message: "Invalid email address." }),
  phone: z.string().min(10, { message: "Phone number must be at least 10 digits." }),
  password: z.string().min(6, { message: "Password must be at least 6 characters." }),
  role: z.enum(USER_ROLES),
});

export async function getUsers(): Promise<User[]> {
    try {
        const users = await prisma.user.findMany({
            orderBy: {
                createdAt: 'desc',
            },
        });
        return users.map(mapPrismaUserToUserType);
    } catch (error) {
        console.error("Failed to fetch users:", error);
        return [];
    }
}

export async function addUser(prevState: any, formData: FormData) {
  const validatedFields = addUserSchema.safeParse(Object.fromEntries(formData.entries()));

  if (!validatedFields.success) {
    // Flatten errors to provide a more user-friendly message
    const errorMessages = validatedFields.error.errors.map(e => e.message).join(', ');
    return { error: `Invalid fields: ${errorMessages}` };
  }
  
  const { name, email, phone, password, role } = validatedFields.data;

  try {
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return { error: 'User with this email already exists.' };
    }

    const hashedPassword = await hashPassword(password);
    
    await prisma.user.create({
      data: {
        name,
        email,
        phone,
        password: hashedPassword,
        role: role,
      },
    });

  } catch (error) {
    console.error(error);
    return { error: 'Could not create user. Please try again.' };
  }
  
  revalidatePath('/users');
  return { success: true, message: `User '${name}' created successfully with the role '${role}'.` };
}
