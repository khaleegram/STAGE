
'use client';

import { useActionState, useEffect } from 'react';
import { useFormStatus } from 'react-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { updateUserPassword } from '@/app/settings/actions';
import { signOut } from '@/lib/firebase/auth';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? 'Saving...' : 'Save Password'}
    </Button>
  );
}

export function PasswordForm() {
  const { toast } = useToast();
  const router = useRouter();

  const [state, formAction] = useActionState(updateUserPassword, { success: false, message: '' });

  useEffect(() => {
    if (state.message) {
      toast({
        title: state.success ? 'Success' : 'Error',
        description: state.message,
        variant: state.success ? 'default' : 'destructive',
      });
      // After showing the toast for a successful password change,
      // we can redirect the user or let them log out manually.
      // Automatically logging them out here can cause issues.
      if (state.success) {
        setTimeout(async () => {
          await signOut();
          router.push('/login');
        }, 3000); // Give user time to read the toast.
      }
    }
  }, [state, router, toast]);


  return (
    <form action={formAction} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="newPassword">New Password</Label>
        <Input id="newPassword" name="newPassword" type="password" required />
         <p className="text-xs text-muted-foreground">
          Password must be at least 6 characters. You will be logged out after a successful change.
        </p>
      </div>
      <div className="flex justify-end">
        <SubmitButton />
      </div>
    </form>
  );
}
