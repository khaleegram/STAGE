
'use client';

import { useActionState, useEffect, useRef } from 'react';
import { useFormStatus } from 'react-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { updateUserProfile } from '@/app/settings/actions';
import Image from 'next/image';
import { useAuth } from '@/hooks/use-auth';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? 'Saving...' : 'Save Changes'}
    </Button>
  );
}

export function ProfileForm() {
  const { toast } = useToast();
  const { user } = useAuth();
  const formRef = useRef<HTMLFormElement>(null);

  const [state, formAction] = useActionState(updateUserProfile, { success: false, message: '' });

  useEffect(() => {
    if (state.message) {
      toast({
        title: state.success ? 'Success' : 'Error',
        description: state.message,
        variant: state.success ? 'default' : 'destructive',
      });
    }
  }, [state, toast]);

  return (
    <form ref={formRef} action={formAction} className="space-y-6">
       <div className="flex items-center gap-4">
            <Image
                src={user?.photoURL || 'https://placehold.co/100x100.png'}
                alt="Profile picture"
                width={80}
                height={80}
                className="rounded-full object-cover"
                data-ai-hint="person avatar"
            />
            <div>
                <Label htmlFor="picture">Profile Picture</Label>
                <Input id="picture" name="photoURL" type="file" className="mt-1" disabled/>
                <p className="text-xs text-muted-foreground mt-1">Feature coming soon.</p>
            </div>
       </div>

      <div className="space-y-2">
        <Label htmlFor="name">Name</Label>
        <Input id="name" name="name" defaultValue={user?.displayName || ''} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" value={user?.email || ''} readOnly disabled />
        <p className="text-xs text-muted-foreground">Your email address is verified and cannot be changed.</p>
      </div>
      
      <div className="flex justify-end">
        <SubmitButton />
      </div>
    </form>
  );
}
