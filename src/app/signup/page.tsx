
'use client';

import { useEffect, useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { Logo } from '@/components/icons/logo';
import { signup } from './actions';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? 'Creating Account...' : 'Create Account'}
    </Button>
  );
}

export default function SignupPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [state, formAction] = useActionState(signup, { success: false, message: '' });

  useEffect(() => {
    if (!state.message) return;

    if (state.success) {
      toast({
        title: 'Success!',
        description: state.message,
      });
      router.push('/login');
    } else {
      toast({
        title: 'Signup Failed',
        description: state.message,
        variant: 'destructive',
      });
    }
  }, [state, router, toast]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-light dark:bg-dark bg-cover bg-center bg-no-repeat p-4">
      <Card className="w-full max-w-md bg-card/80 backdrop-blur-xl border border-white/20 shadow-xl">
        <CardHeader className="text-center">
            <div className="mx-auto mb-4">
                 <Logo className="[&_span]:text-foreground [&_svg]:text-primary" />
            </div>
          <CardTitle className="text-2xl">Create an Account</CardTitle>
          <CardDescription>Enter your details below to get started</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={formAction} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" name="name" type="text" placeholder="John Doe" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" placeholder="m@example.com" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" name="password" type="password" required />
            </div>
             <div className="space-y-2">
              <Label htmlFor="accessCode">Admin Access Code</Label>
              <Input id="accessCode" name="accessCode" type="password" required />
            </div>
            <SubmitButton />
          </form>
           <div className="mt-4 text-center text-sm">
            Already have an account?{' '}
            <Link href="/login" className="underline text-primary">
              Log in
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
