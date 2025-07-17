
'use client';

import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { updateUserProfile } from '@/lib/firebase/auth';
import Image from 'next/image';
import { useAuth } from '@/hooks/use-auth';

export function ProfileForm() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    
    startTransition(async () => {
      const result = await updateUserProfile(formData);
      toast({
        title: result.success ? 'Success' : 'Error',
        description: result.message,
        variant: result.success ? 'default' : 'destructive',
      });
    });
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
        <Button type="submit" disabled={isPending}>
          {isPending ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </form>
  );
}
