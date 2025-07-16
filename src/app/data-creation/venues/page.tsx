'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { db } from '@/lib/firebase';
import { Venue } from '@/lib/types';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { VenueForm } from './venue-form';
import Link from 'next/link';
import { MapPin } from 'lucide-react';
import { Card } from '@/components/ui/card';

const VenuesPage: React.FC = () => {
  const [venues, setVenues] = useState<Venue[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingVenue, setEditingVenue] = useState<Venue | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const venuesQuery = query(collection(db, 'venues'), orderBy('name'));
    const unsubscribe = onSnapshot(venuesQuery, (snapshot) => {
      const venuesList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Venue));
      setVenues(venuesList);
      setIsLoading(false);
    }, (error) => {
      console.error("Error fetching venues: ", error);
      toast({ title: 'Error', description: 'Could not fetch venues.', variant: 'destructive' });
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [toast]);

  const handleAddNew = () => {
    setEditingVenue(null);
    setShowModal(true);
  };

  const handleEdit = (venue: Venue) => {
    setEditingVenue(venue);
    setShowModal(true);
  };

  const filteredVenues = useMemo(() => {
      return venues.filter((venue) =>
        venue.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        venue.code.toLowerCase().includes(searchTerm.toLowerCase())
      );
  }, [venues, searchTerm]);

  return (
    <Card className="p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <h3 className="text-2xl font-bold mb-6 text-primary">Manage Venues</h3>

        <div className="mb-4 flex flex-col sm:flex-row justify-between items-center">
          <Input
            type="text"
            placeholder="Search venues by name or code..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full sm:max-w-sm mb-2 sm:mb-0"
          />
          <Button
            onClick={handleAddNew}
            className="w-full sm:w-auto"
          >
            + Add Venue
          </Button>
        </div>

        {isLoading ? (
            <div className="space-y-4">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
            </div>
        ) : (
            <>
                {/* Desktop Table View */}
                <div className="overflow-x-auto hidden sm:block rounded-lg">
                  <table className="min-w-full table-auto">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="p-4 text-left font-semibold">#</th>
                        <th className="p-4 text-left font-semibold">Name</th>
                        <th className="p-4 text-left font-semibold">Code</th>
                        <th className="p-4 text-left font-semibold">Capacity</th>
                        <th className="p-4 text-left font-semibold">Type</th>
                        <th className="p-4 text-left font-semibold">Map</th>
                        <th className="p-4 text-left font-semibold">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/50">
                      {filteredVenues.map((venue, index) => (
                        <tr key={venue.id} className="hover:bg-muted/30">
                          <td className="p-4">{index + 1}</td>
                          <td className="p-4 font-medium">{venue.name}</td>
                          <td className="p-4">{venue.code}</td>
                          <td className="p-4">{venue.capacity}</td>
                          <td className="p-4">{venue.venue_type}</td>
                          <td className="p-4">
                            {(venue.latitude && venue.longitude) ? (
                                <Link href={`https://www.google.com/maps?q=${venue.latitude},${venue.longitude}`} target="_blank" rel="noopener noreferrer">
                                    <Button variant="outline" size="sm">
                                        <MapPin className="mr-2 h-4 w-4"/> View
                                    </Button>
                                </Link>
                              ) : 'N/A'}
                          </td>
                          <td className="p-4 flex space-x-2">
                            <Button variant="outline" size="sm" onClick={() => handleEdit(venue)}>
                              Edit
                            </Button>
                          </td>
                        </tr>
                      ))}
                      {filteredVenues.length === 0 && (
                        <tr>
                          <td colSpan={7} className="text-center p-4 text-muted-foreground">
                            No venues found
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Card View */}
                <div className="space-y-4 block sm:hidden">
                  {filteredVenues.map((venue, index) => (
                    <Card key={venue.id} className="p-4">
                        <div className="flex justify-between items-start mb-2">
                             <h4 className="font-bold text-primary">#{index + 1} - {venue.name}</h4>
                             <Button variant="outline" size="sm" onClick={() => handleEdit(venue)}>
                                Edit
                            </Button>
                        </div>
                         <div className="space-y-1 text-sm">
                            <p><strong>Code:</strong> {venue.code}</p>
                            <p><strong>Capacity:</strong> {venue.capacity}</p>
                            <p><strong>Type:</strong> {venue.venue_type}</p>
                            <p><strong>Map:</strong> {(venue.latitude && venue.longitude) ? (
                                <Link href={`https://www.google.com/maps?q=${venue.latitude},${venue.longitude}`} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                                    View on Google Maps
                                </Link>
                              ) : 'N/A'}
                            </p>
                         </div>
                    </Card>
                  ))}
                  {filteredVenues.length === 0 && (
                    <div className="text-center p-4 text-muted-foreground">
                      No venues found
                    </div>
                  )}
                </div>
            </>
        )}
      </div>

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>{editingVenue ? 'Edit Venue' : 'Add New Venue'}</DialogTitle>
          </DialogHeader>
          <VenueForm
            venue={editingVenue}
            onClose={() => setShowModal(false)}
          />
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default VenuesPage;
