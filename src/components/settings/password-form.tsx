
'use client';

import { useActionState, useEffect } from 'react';
import { useFormStatus } from 'react-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { updateUserPassword, signOut } from '@/lib/firebase/auth';
import { useRouter } from 'next/navigation';

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

  const handlePasswordUpdate = async (formData: FormData) => {
    const newPassword = formData.get('newPassword') as string;
    if (!newPassword || newPassword.length < 6) {
        toast({ title: 'Error', description: 'Password must be at least 6 characters.', variant: 'destructive' });
        return;
    }

    // In a real app, you'd verify the currentPassword here by re-authenticating the user.
    // For simplicity, we are skipping that step.
    const { error } = await updateUserPassword(newPassword);

    if (error) {
        toast({
            title: 'Error',
            description: `Failed to update password: ${error.message}`,
            variant: 'destructive',
        });
    } else {
        toast({
            title: 'Success!',
            description: 'Password updated successfully. You will be logged out now.',
        });
        await signOut();
        router.push('/login');
    }
  };


  return (
    <form action={handlePasswordUpdate} className="space-y-6">
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
