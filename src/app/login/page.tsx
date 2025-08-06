
'use client';

import { useEffect, useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { Logo } from '@/components/icons/logo';
import { login } from './actions';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { Separator } from '@/components/ui/separator';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth } from '@/lib/firebase';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? 'Signing In...' : 'Sign In with Email'}
    </Button>
  );
}

function GoogleSignInButton() {
    const { toast } = useToast();
    const router = useRouter();
  
    const handleGoogleSignIn = async () => {
      const provider = new GoogleAuthProvider();
      try {
        await signInWithPopup(auth, provider);
        toast({ title: 'Success', description: 'Signed in with Google successfully.' });
        router.push('/');
      } catch (error) {
        console.error("Google Sign-In Error:", error);
        toast({ title: 'Error', description: 'Could not sign in with Google.', variant: 'destructive' });
      }
    };
  
    return (
      <Button variant="outline" className="w-full" onClick={handleGoogleSignIn} type="button">
        <svg className="mr-2 h-4 w-4" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512">
            <path fill="currentColor" d="M488 261.8C488 403.3 381.5 512 244 512 110.3 512 0 401.7 0 265.4c0-137 110.3-247.4 244-247.4 67.9 0 121.2 26.7 165.2 68.6l-67.2 67.2c-20-19.2-45.7-31.4-78.2-31.4-91.8 0-166.4 75.2-166.4 167.7 0 92.5 74.6 167.7 166.4 167.7 99.4 0 141.5-73.8 147.2-111.4H244v-87.1h244z"></path>
        </svg>
        Sign In with Google
      </Button>
    );
  }

export default function LoginPage() {
  const { toast } = useToast();
  const [state, formAction] = useActionState(login, { success: false, message: '' });
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // This effect only handles displaying the toast message from the server action.
    if (!state.message) return;

    if (state.success) {
      toast({
        title: 'Login Successful',
        description: 'Redirecting to your dashboard...',
      });
      // The redirect is now handled by the main layout's ProtectedLayout component
    } else {
      toast({
        title: 'Login Failed',
        description: state.message,
        variant: 'destructive',
      });
    }
  }, [state, toast]);

  useEffect(() => {
    // Redirect if user is already logged in
    if (user) {
      router.push('/');
    }
  }, [user, router]);


  return (
    <div className="flex min-h-screen items-center justify-center bg-light dark:bg-dark bg-cover bg-center bg-no-repeat p-4">
      <Card className="w-full max-w-md bg-card/80 backdrop-blur-xl border border-white/20 shadow-xl">
        <CardHeader className="text-center">
           <div className="mx-auto mb-4">
                <Logo className="[&_span]:text-foreground [&_svg]:text-primary" />
           </div>
          <CardTitle className="text-2xl">Welcome Back!</CardTitle>
          <CardDescription>Enter your credentials to access your account</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <form action={formAction} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="m@example.com"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input id="password" name="password" type="password" required />
              </div>
              <SubmitButton />
            </form>
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  Or continue with
                </span>
              </div>
            </div>
            <GoogleSignInButton />
          </div>
           <div className="mt-4 text-center text-sm">
            Don&apos;t have an account?{' '}
            <Link href="/signup" className="underline text-primary">
              Sign up
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
