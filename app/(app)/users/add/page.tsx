
'use client';

import { PageHeader } from '@/components/page-header';
import { UserPlus } from 'lucide-react';
import { UserForm } from '../user-form';
import { addUser } from '../actions';
import { useActionState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getUserRoles } from '@/app/(app)/settings/actions';
import type { CustomSetting } from '@/types';
import { Loader2 } from 'lucide-react';

const initialState: { error?: string; success?: boolean; message?: string } = {};

export default function AddUserPage() {
    const [state, formAction] = useActionState(addUser, initialState);
    const [roles, setRoles] = useState<CustomSetting[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { toast } = useToast();
    const router = useRouter();

    useEffect(() => {
        if (state?.error) {
            toast({
                title: "Failed to Add User",
                description: state.error,
                variant: "destructive",
            });
        } else if (state?.success) {
            toast({
                title: "User Added",
                description: state.message || "The new user has been created successfully.",
            });
            router.push('/users');
        }
    }, [state, toast, router]);

    useEffect(() => {
        async function fetchRoles() {
            setIsLoading(true);
            const fetchedRoles = await getUserRoles();
            setRoles(fetchedRoles);
            setIsLoading(false);
        }
        fetchRoles();
    }, []);

  return (
    <>
      <PageHeader
        title="Add New User"
        description="Create a new user account and assign them a role."
        icon={UserPlus}
      />
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : (
        <UserForm formAction={formAction} roles={roles} />
      )}
    </>
  );
}
