
'use client';

import Link from 'next/link';
import { useFormStatus } from 'react-dom';
import { useActionState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from 'lucide-react';
import { signup } from '@/app/(auth)/actions';
import { useRouter } from 'next/navigation';

const initialState: { error?: string; success?: boolean; message?: string } = {};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
      {pending ? 'Creating Account...' : 'Create Admin Account'}
    </Button>
  );
}

export default function SignupPage() {
  const [state, formAction] = useActionState(signup, initialState);
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    if (state?.error) {
      toast({
        title: "Signup Failed",
        description: state.error,
        variant: "destructive",
      });
    } else if (state?.success) {
      toast({
        title: "Account Created",
        description: state.message,
      });
      router.push('/login');
    }
  }, [state, toast, router]);

  return (
    <Card className="shadow-xl">
      <CardHeader>
        <CardTitle className="text-2xl font-headline">Create First Admin Account</CardTitle>
        <CardDescription>This form is for creating the initial administrator. After this, new users must be added by an admin.</CardDescription>
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
          <SubmitButton />
        </form>
      </CardContent>
       <CardFooter className="flex flex-col items-center gap-2 text-sm">
        <p>Already have an account?{' '}
            <Link href="/login" className="font-medium text-primary hover:underline">
                Login
            </Link>
        </p>
      </CardFooter>
    </Card>
  );
}
