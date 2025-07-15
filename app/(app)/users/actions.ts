
'use server';

import { z } from 'zod';
import prisma from '@/lib/prisma';
import { hashPassword, verifySession } from '@/lib/auth';
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
      isActive: prismaUser.isActive,
      createdAt: prismaUser.createdAt.toISOString(),
    };
  }

const userSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  email: z.string().email({ message: "Invalid email address." }),
  phone: z.string().min(10, { message: "Phone number must be at least 10 digits." }),
  role: z.enum(USER_ROLES),
});

const addUserSchema = userSchema.extend({
  password: z.string().min(6, { message: "Password must be at least 6 characters." }),
});

const editUserSchema = userSchema.extend({
  password: z.string().min(6, "Password must be at least 6 characters.").optional().or(z.literal('')),
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
        isActive: true, // New users are active by default
      },
    });

  } catch (error) {
    console.error(error);
    return { error: 'Could not create user. Please try again.' };
  }
  
  revalidatePath('/users');
  return { success: true, message: `User '${name}' created successfully with the role '${role}'.` };
}

export async function updateUser(userId: string, formData: FormData) {
    const data = Object.fromEntries(formData.entries());
    const validatedFields = editUserSchema.safeParse(data);
    
    if (!validatedFields.success) {
        const errorMessages = validatedFields.error.errors.map(e => e.message).join(', ');
        return { success: false, error: `Invalid fields: ${errorMessages}` };
    }
    
    const { password, ...userData } = validatedFields.data;
    const updateData: Partial<User & {password?: string}> = { ...userData };
    
    try {
        if (password) {
            updateData.password = await hashPassword(password);
        }

        await prisma.user.update({
            where: { id: userId },
            data: updateData,
        });
        
        revalidatePath('/users');
        return { success: true };
    } catch (error) {
        console.error(`Failed to update user ${userId}:`, error);
        return { success: false, error: 'An unexpected error occurred while updating the user.' };
    }
}

export async function toggleUserStatus(userId: string, currentStatus: boolean): Promise<{ success: boolean; error?: string }> {
    const session = await verifySession();
    if (!session?.userId) {
        return { success: false, error: 'Authentication required.' };
    }
    if (session.userId === userId) {
        return { success: false, error: 'You cannot change the status of your own account.' };
    }

    try {
        await prisma.user.update({
            where: { id: userId },
            data: { isActive: !currentStatus },
        });
        revalidatePath('/users');
        return { success: true };
    } catch (error) {
        console.error(`Failed to toggle status for user ${userId}:`, error);
        return { success: false, error: 'An unexpected error occurred.' };
    }
}

export async function deleteUser(userId: string): Promise<{ success: boolean; error?: string }> {
    const session = await verifySession();
    if (!session?.userId) {
        return { success: false, error: 'Authentication required.' };
    }
    if (session.userId === userId) {
        return { success: false, error: 'You cannot delete your own account.' };
    }

    try {
        await prisma.user.delete({
            where: { id: userId },
        });
        revalidatePath('/users');
        return { success: true };
    } catch (error) {
        console.error("Failed to delete user:", error);
        if (typeof error === 'object' && error !== null && 'code' in error && error.code === 'P2003') {
             return { success: false, error: 'Cannot delete user. They are still assigned to leads, clients, or other records. Please reassign them first.' };
        }
        return { success: false, error: 'An unexpected error occurred while deleting the user.' };
    }
}
