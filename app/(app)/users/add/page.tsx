
'use client';

import Link from 'next/link';
import { useFormStatus } from 'react-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from 'lucide-react';
import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { addUser } from '@/app/(app)/users/actions';
import { useActionState } from 'react';
import { USER_ROLES } from '@/lib/constants';
import { PageHeader } from '@/components/page-header';
import { UserPlus } from 'lucide-react';

const initialState: { error?: string; success?: boolean; message?: string } = {};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
      {pending ? 'Adding User...' : 'Add User'}
    </Button>
  );
}

export default function AddUserPage() {
  const [state, formAction] = useActionState(addUser, initialState);
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
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl font-headline">User Details</CardTitle>
        <CardDescription>Fill out the form to create a new user.</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-4">
           <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <Input id="name" name="name" placeholder="John Doe" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" placeholder="you@example.com" required />
          </div>
           <div className="space-y-2">
            <Label htmlFor="phone">Mobile No.</Label>
            <Input id="phone" name="phone" type="tel" placeholder="9876543210" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" name="password" type="password" placeholder="••••••••" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <Select name="role" required defaultValue={USER_ROLES[1]}>
              <SelectTrigger id="role">
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                {USER_ROLES.map(role => (
                  <SelectItem key={role} value={role}>{role}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <SubmitButton />
        </form>
      </CardContent>
    </Card>
    </>
  );
}
