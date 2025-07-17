
'use client';

import { useActionState, useEffect, useState } from 'react';
import { useFormStatus } from 'react-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { updateProfile } from '@/app/settings/actions';
import Image from 'next/image';

// Mock user data. In a real app, this would come from an auth context.
const user = {
    name: 'Admin User',
    email: 'admin@example.com',
    profilePicture: 'https://placehold.co/100x100.png',
};

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
  const [state, formAction] = useActionState(updateProfile, { success: false, message: '' });

  const [name, setName] = useState(user.name);

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
    <form action={formAction} className="space-y-6">
       <div className="flex items-center gap-4">
            <Image
                src={user.profilePicture}
                alt="Profile picture"
                width={80}
                height={80}
                className="rounded-full object-cover"
                data-ai-hint="person avatar"
            />
            <div>
                <Label htmlFor="picture">Profile Picture</Label>
                <Input id="picture" type="file" className="mt-1"/>
                <p className="text-xs text-muted-foreground mt-1">PNG, JPG, GIF up to 10MB.</p>
            </div>
       </div>

      <div className="space-y-2">
        <Label htmlFor="name">Name</Label>
        <Input id="name" name="name" value={name} onChange={e => setName(e.target.value)} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" value={user.email} readOnly disabled />
        <p className="text-xs text-muted-foreground">Your email address is verified and cannot be changed.</p>
      </div>
      
      <div className="flex justify-end">
        <SubmitButton />
      </div>
    </form>
  );
}
