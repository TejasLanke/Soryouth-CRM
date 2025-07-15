
'use client';

import { PageHeader } from '@/components/page-header';
import { UserPlus } from 'lucide-react';
import { UserForm } from '../user-form';
import { addUser } from '../actions';
import { useFormState } from 'react-dom';
import { useToast } from '@/hooks/use-toast';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

const initialState: { error?: string; success?: boolean; message?: string } = {};

export default function AddUserPage() {
    const [state, formAction] = useFormState(addUser, initialState);
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

  return (
    <>
      <PageHeader
        title="Add New User"
        description="Create a new user account and assign them a role."
        icon={UserPlus}
      />
      <UserForm formAction={formAction} />
    </>
  );
}
