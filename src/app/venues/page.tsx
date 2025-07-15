import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { db } from '@/lib/firebase';
import { Venue } from '@/lib/types';
import { collection, getDocs, QueryDocumentSnapshot, DocumentData } from 'firebase/firestore';
import { PlusCircle, MoreHorizontal } from 'lucide-react';

async function getVenues(): Promise<Venue[]> {
  try {
    const venuesCollection = collection(db, 'venues');
    const venueSnapshot = await getDocs(venuesCollection);
    const venuesList = venueSnapshot.docs.map((doc: QueryDocumentSnapshot<DocumentData>) => {
        const data = doc.data();
        return {
            id: doc.id,
            name: data.name || 'Unnamed Venue',
            code: data.code || 'N/A',
            capacity: data.capacity || 0,
            venue_type: data.venue_type || 'Written',
        }
    });
    return venuesList;
  } catch (error) {
    console.error("Error fetching venues: ", error);
    // Fallback mock data
    return [
        { id: '1', name: 'AUDITORIUM', code: 'MLK', capacity: 300, venue_type: 'CBT' },
        { id: '2', name: 'Muhammad Lawal Kaita', code: 'MLK', capacity: 312, venue_type: 'Written' },
    ];
  }
}

export default async function VenuesPage() {
  const venues = await getVenues();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Venues</h1>
        <Button>
          <PlusCircle className="mr-2" />
          Add Venue
        </Button>
      </div>

      <Card>
        <CardHeader>
            <CardTitle>Manage Venues</CardTitle>
            <CardDescription>Manage your university's exam venues.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Code</TableHead>
                <TableHead>Capacity</TableHead>
                <TableHead>Venue Type</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {venues.map((venue) => (
                <TableRow key={venue.id}>
                  <TableCell className="font-medium">{venue.name}</TableCell>
                  <TableCell>{venue.code}</TableCell>
                  <TableCell>{venue.capacity}</TableCell>
                  <TableCell>{venue.venue_type}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
