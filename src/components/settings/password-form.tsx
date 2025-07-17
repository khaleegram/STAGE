
'use client';

import { useActionState, useEffect } from 'react';
import { useFormStatus } from 'react-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { signOut } from '@/lib/firebase/auth';
import { useRouter } from 'next/navigation';
import { updateUserPassword } from '@/app/settings/actions';

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
      if (state.success) {
        // Sign out and redirect after successful password change
        const handleSignOut = async () => {
          await signOut();
          router.push('/login');
        };
        handleSignOut();
      }
    }
  }, [state, toast, router]);


  return (
    <form action={formAction} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="currentPassword">Current Password</Label>
        <Input id="currentPassword" name="currentPassword" type="password" required disabled />
        <p className="text-xs text-muted-foreground">Verification of current password is not yet implemented.</p>
      </div>
      <div className="space-y-2">
        <Label htmlFor="newPassword">New Password</Label>
        <Input id="newPassword" name="newPassword" type="password" required />
      </div>
      <div className="flex justify-end">
        <SubmitButton />
      </div>
    </form>
  );
}
