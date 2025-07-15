'use client';

import React, { useState, useEffect } from 'react';
import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { AcademicSession } from '@/lib/types';
import { addSession, updateSession } from './actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface SessionFormProps {
  session: AcademicSession | null;
  onClose: () => void;
}

export function SessionForm({ session, onClose }: SessionFormProps) {
  const { toast } = useToast();
  const [sessionName, setSessionName] = useState(session?.session_name || '');
  const [status, setStatus] = useState<'open' | 'closed' | 'locked'>(session?.status || 'open');

  useEffect(() => {
    if (session) {
      setSessionName(session.session_name);
      setStatus(session.status);
    }
  }, [session]);
  
  const action = session ? updateSession.bind(null, session.id) : addSession;
  const [state, formAction] = useActionState(action, { success: false, message: '' });

  useEffect(() => {
    if (state.message) {
      toast({
        title: state.success ? 'Success' : 'Error',
        description: state.message,
        variant: state.success ? 'default' : 'destructive',
      });
      if (state.success) {
        onClose();
      }
    }
  }, [state, toast, onClose]);

  return (
    <form action={formAction} className="space-y-4">
        <input type="hidden" name="session_name" value={sessionName} />
        <input type="hidden" name="status" value={status} />

        <div>
            <Label htmlFor="session-name">Session Name</Label>
            <Input
                id="session-name"
                value={sessionName}
                onChange={(e) => setSessionName(e.target.value)}
                placeholder="e.g., 2024/2025"
                required
            />
             <p className="text-xs text-muted-foreground mt-1">Must be in YYYY/YYYY format.</p>
        </div>

        <div>
             <Label htmlFor="status">Status</Label>
             <Select onValueChange={(value: 'open' | 'closed' | 'locked') => setStatus(value)} value={status}>
                <SelectTrigger id="status"><SelectValue placeholder="Select status" /></SelectTrigger>
                <SelectContent>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                    <SelectItem value="locked">Locked</SelectItem>
                </SelectContent>
            </Select>
        </div>
        
        <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <SubmitButton label={session ? 'Update Session' : 'Add Session'} />
        </div>
    </form>
  );
}

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? `${label}...` : label}
    </Button>
  );
}
