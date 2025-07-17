
'use client';

import { useActionState, useEffect, useState } from 'react';
import { useFormStatus } from 'react-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { updateUserProfile } from '@/lib/firebase/auth';
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
  
  const [name, setName] = useState('');

  useEffect(() => {
      if (user?.displayName) {
          setName(user.displayName);
      }
  }, [user]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const { error } = await updateUserProfile(name);
    if (error) {
         toast({
            title: 'Error',
            description: error.message,
            variant: 'destructive',
        });
    } else {
        toast({
            title: 'Success',
            description: 'Profile updated successfully.',
        });
    }
  };


  return (
    <form onSubmit={handleSubmit} className="space-y-6">
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
                <Input id="picture" type="file" className="mt-1" disabled/>
                <p className="text-xs text-muted-foreground mt-1">Feature coming soon.</p>
            </div>
       </div>

      <div className="space-y-2">
        <Label htmlFor="name">Name</Label>
        <Input id="name" name="name" value={name} onChange={e => setName(e.target.value)} />
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
