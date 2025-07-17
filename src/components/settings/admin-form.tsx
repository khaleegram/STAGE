
'use client';

import { useActionState, useEffect } from 'react';
import { useFormStatus } from 'react-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { updateAccessCode } from '@/app/settings/actions';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? 'Updating...' : 'Update Access Code'}
    </Button>
  );
}

export function AdminForm() {
  const { toast } = useToast();
  
  const [state, formAction] = useActionState(updateAccessCode, { success: false, message: '' });

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
      <div className="space-y-2">
        <Label htmlFor="currentCode">Current Access Code</Label>
        <Input id="currentCode" name="currentCode" type="password" required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="newCode">New Access Code</Label>
        <Input id="newCode" name="newCode" type="password" required />
        <p className="text-xs text-muted-foreground">
          The new code must be at least 6 characters long.
        </p>
      </div>
      <div className="flex justify-end">
        <SubmitButton />
      </div>
    </form>
  );
}
