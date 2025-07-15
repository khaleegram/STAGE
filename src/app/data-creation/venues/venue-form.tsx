'use client';

import React, { useState, useEffect } from 'react';
import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { Venue } from '@/lib/types';
import { addVenue, updateVenue, deleteVenue } from './actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface VenueFormProps {
  venue: Venue | null;
  onClose: () => void;
}

export function VenueForm({ venue, onClose }: VenueFormProps) {
  const { toast } = useToast();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // Form state
  const [name, setName] = useState(venue?.name || '');
  const [code, setCode] = useState(venue?.code || '');
  const [capacity, setCapacity] = useState(venue?.capacity?.toString() || '');
  const [venueType, setVenueType] = useState<'CBT' | 'Written'>(venue?.venue_type || 'Written');
  const [latitude, setLatitude] = useState(venue?.latitude || '');
  const [longitude, setLongitude] = useState(venue?.longitude || '');
  const [radius, setRadius] = useState(venue?.radius?.toString() || '');

  useEffect(() => {
    setName(venue?.name || '');
    setCode(venue?.code || '');
    setCapacity(venue?.capacity?.toString() || '');
    setVenueType(venue?.venue_type || 'Written');
    setLatitude(venue?.latitude || '');
    setLongitude(venue?.longitude || '');
    setRadius(venue?.radius?.toString() || '');
  }, [venue]);

  // Server action setup
  const action = venue ? updateVenue.bind(null, venue.id) : addVenue;
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

  const handleDelete = async () => {
    if (!venue) return;
    const result = await deleteVenue(venue.id);
     toast({
        title: result.success ? 'Success' : 'Error',
        description: result.message,
        variant: result.success ? 'default' : 'destructive',
      });
      if (result.success) {
        setIsDeleteDialogOpen(false);
        onClose();
      }
  };

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="name" value={name} />
      <input type="hidden" name="code" value={code} />
      <input type="hidden" name="capacity" value={capacity} />
      <input type="hidden" name="venue_type" value={venueType} />
      <input type="hidden" name="latitude" value={latitude} />
      <input type="hidden" name="longitude" value={longitude} />
      <input type="hidden" name="radius" value={radius} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="venue-name" className="block text-sm font-medium mb-1">Venue Name</label>
          <Input id="venue-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., Main Auditorium" />
        </div>
        <div>
          <label htmlFor="venue-code" className="block text-sm font-medium mb-1">Venue Code</label>
          <Input id="venue-code" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="e.g., AUD" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="capacity" className="block text-sm font-medium mb-1">Capacity</label>
          <Input id="capacity" type="number" value={capacity} onChange={(e) => setCapacity(e.target.value)} placeholder="e.g., 500" min="1" />
        </div>
        <div>
          <label htmlFor="venue-type" className="block text-sm font-medium mb-1">Venue Type</label>
          <Select onValueChange={(value: 'CBT' | 'Written') => setVenueType(value)} value={venueType}>
            <SelectTrigger id="venue-type"><SelectValue placeholder="Select type" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="Written">Written</SelectItem>
              <SelectItem value="CBT">CBT</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

       <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label htmlFor="latitude" className="block text-sm font-medium mb-1">Latitude (Optional)</label>
          <Input id="latitude" value={latitude} onChange={(e) => setLatitude(e.target.value)} placeholder="e.g., 9.076478" />
        </div>
        <div>
          <label htmlFor="longitude" className="block text-sm font-medium mb-1">Longitude (Optional)</label>
          <Input id="longitude" value={longitude} onChange={(e) => setLongitude(e.target.value)} placeholder="e.g., 7.398574" />
        </div>
        <div>
          <label htmlFor="radius" className="block text-sm font-medium mb-1">Radius (m, Optional)</label>
          <Input id="radius" type="number" value={radius} onChange={(e) => setRadius(e.target.value)} placeholder="e.g., 50" min="0"/>
        </div>
      </div>


      {/* Actions */}
      <div className="flex justify-between items-center pt-4">
          <div>
              {venue && (
                  <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                      <AlertDialogTrigger asChild>
                          <Button type="button" variant="destructive">Delete</Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                          <AlertDialogHeader>
                              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                              <AlertDialogDescription>
                                  This action cannot be undone. This will permanently delete the venue.
                              </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={handleDelete}>Continue</AlertDialogAction>
                          </AlertDialogFooter>
                      </AlertDialogContent>
                  </AlertDialog>
              )}
          </div>
          <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
              <SubmitButton label={venue ? 'Update' : 'Add'} />
          </div>
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
