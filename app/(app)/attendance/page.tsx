
'use client';

import { useEffect, useState } from 'react';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, CheckSquare, MapPin } from 'lucide-react';
import { getAllAttendanceRecords } from './actions';
import type { Attendance } from '@/types';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

function LocationLink({ location }: { location?: string | null }) {
    if (!location) return <span>-</span>;
    return (
        <Link
            href={`https://www.google.com/maps?q=${location}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-primary hover:underline"
        >
            <MapPin className="h-4 w-4" />
            <span>View Map</span>
        </Link>
    );
}

export default function AttendancePage() {
    const [records, setRecords] = useState<Attendance[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchRecords = async () => {
            setIsLoading(true);
            const fetchedRecords = await getAllAttendanceRecords();
            setRecords(fetchedRecords);
            setIsLoading(false);
        };
        fetchRecords();
    }, []);

    return (
        <>
            <PageHeader
                title="Attendance Records"
                description="View all user punch-in and punch-out records."
                icon={CheckSquare}
            />
            <Card>
                <CardContent className="p-0">
                    {isLoading ? (
                        <div className="flex justify-center items-center h-64">
                            <Loader2 className="h-8 w-8 animate-spin" />
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>User</TableHead>
                                    <TableHead>Punch In Time</TableHead>
                                    <TableHead>Punch In Location</TableHead>
                                    <TableHead>Punch Out Time</TableHead>
                                    <TableHead>Punch Out Location</TableHead>
                                    <TableHead className="text-right">Work Duration</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {records.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="h-24 text-center">
                                            No attendance records found.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    records.map(record => (
                                        <TableRow key={record.id}>
                                            <TableCell className="font-medium">{record.userName}</TableCell>
                                            <TableCell>{record.punchInTime}</TableCell>
                                            <TableCell><LocationLink location={record.punchInLocation} /></TableCell>
                                            <TableCell>{record.punchOutTime || <Badge variant="secondary">Punched In</Badge>}</TableCell>
                                            <TableCell><LocationLink location={record.punchOutLocation} /></TableCell>
                                            <TableCell className="text-right font-mono">{record.workDuration}</TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </>
    );
}
