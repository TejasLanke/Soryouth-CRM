
'use client';

import type { SiteSurvey, SurveySortConfig, SurveyStatusType, SurveyTypeOption, UserOptionType } from '@/types';
import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button, buttonVariants } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Edit2, Trash2, MoreVertical, ArrowUpDown, ClipboardList, UserCircle2, MapPin, CalendarDays, Building, Home, Sun } from 'lucide-react';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Card, CardContent } from '@/components/ui/card';
import { format, parseISO, isValid } from 'date-fns';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface SurveysTableProps {
  surveys: SiteSurvey[];
  onEditSurvey?: (survey: SiteSurvey) => void;
  onDeleteSurvey?: (surveyId: string) => void;
  sortConfig?: SurveySortConfig | null;
  requestSort?: (key: keyof SiteSurvey) => void;
}

const formatDateInternal = (dateString?: string) => {
  if (!dateString) return '-';
  try {
    const date = parseISO(dateString);
    if (isValid(date)) {
      return format(date, 'dd MMM, yyyy');
    }
    return dateString; 
  } catch (e) {
    return dateString; 
  }
};

const SurveyTypeDisplayIcon = ({ type }: { type: SurveyTypeOption }) => {
    switch (type) {
      case 'Commercial': return <Building className="h-4 w-4 mr-1 text-muted-foreground" />;
      case 'Residential': return <Home className="h-4 w-4 mr-1 text-muted-foreground" />;
      case 'Industrial': return <Sun className="h-4 w-4 mr-1 text-muted-foreground" />;
      case 'Agricultural': return <ClipboardList className="h-4 w-4 mr-1 text-muted-foreground" />; // Example icon
      default: return <ClipboardList className="h-4 w-4 mr-1 text-muted-foreground" />;
    }
};

export function SurveysTable({ surveys, onEditSurvey, onDeleteSurvey, sortConfig, requestSort }: SurveysTableProps) {
  
  const getStatusBadgeVariant = (status: SurveyStatusType) => {
    switch (status) {
      case 'Completed': return 'default';
      case 'Scheduled': return 'secondary';
      case 'In Progress': return 'outline'; // You might want a specific color for this
      case 'Cancelled': return 'destructive';
      case 'On Hold': return 'secondary'; // Using secondary, could be outline with specific color
      default: return 'outline';
    }
  };

  const getSortIndicator = (key: keyof SiteSurvey) => {
    if (!requestSort || !sortConfig || sortConfig.key !== key) {
      return <ArrowUpDown className="ml-1 h-3 w-3 opacity-50" />;
    }
    return sortConfig.direction === 'ascending' ? 
      <ArrowUpDown className="ml-1 h-3 w-3 transform rotate-0 text-primary" /> : 
      <ArrowUpDown className="ml-1 h-3 w-3 transform rotate-180 text-primary" />;
  };
  
  const renderHeaderCell = (label: string, sortKey: keyof SiteSurvey) => (
    <TableHead className="text-muted-foreground whitespace-nowrap">
      {requestSort ? (
        <Button variant="ghost" size="sm" className="px-1 py-0 h-auto text-xs" onClick={() => requestSort(sortKey)}>
          {label} {getSortIndicator(sortKey)}
        </Button>
      ) : (
        label
      )}
    </TableHead>
  );

  return (
    <div className="space-y-4">
      <Card className="shadow-sm border-none">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30 hover:bg-muted/40">
                <TableHead className="w-[50px] text-muted-foreground">
                  <Checkbox id="selectAllSurveys" aria-label="Select all surveys" />
                </TableHead>
                {renderHeaderCell('Survey No.', 'surveyNumber')}
                {renderHeaderCell('Client Name', 'consumerName')}
                {renderHeaderCell('Location', 'location')}
                {renderHeaderCell('Survey Date', 'date')}
                {renderHeaderCell('Surveyor', 'surveyorName')}
                {renderHeaderCell('Type', 'consumerCategory')}
                {renderHeaderCell('Status', 'status')}
                {onEditSurvey && onDeleteSurvey && <TableHead className="text-right text-muted-foreground">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {surveys.map((survey) => (
                <TableRow key={survey.id} className="hover:bg-muted/20">
                  <TableCell>
                    <Checkbox id={`select-survey-${survey.id}`} aria-label={`Select survey ${survey.surveyNumber}`} />
                  </TableCell>
                  <TableCell className="font-medium py-3 text-xs">
                      {survey.surveyNumber.slice(-8)}
                  </TableCell>
                  <TableCell className="py-3 text-sm">{survey.consumerName || '-'}</TableCell>
                  <TableCell className="py-3 text-xs">{survey.location || '-'}</TableCell>
                  <TableCell className="py-3 text-xs">{formatDateInternal(survey.date)}</TableCell>
                  <TableCell className="py-3">
                     <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                            <AvatarImage src={`https://placehold.co/40x40.png?text=${survey.surveyorName?.charAt(0) || 'S'}`} data-ai-hint="user avatar" alt={survey.surveyorName || 'Surveyor'} />
                            <AvatarFallback>{survey.surveyorName ? survey.surveyorName.charAt(0).toUpperCase() : 'S'}</AvatarFallback>
                        </Avatar>
                        <span className="text-xs">{survey.surveyorName || '-'}</span>
                    </div>
                  </TableCell>
                  <TableCell className="py-3 text-xs">
                    <div className="flex items-center">
                        <SurveyTypeDisplayIcon type={survey.consumerCategory as SurveyTypeOption} />
                        {survey.consumerCategory}
                    </div>
                  </TableCell>
                  <TableCell className="py-3">
                    <Badge variant={getStatusBadgeVariant(survey.status as SurveyStatusType)} className="capitalize text-xs">{survey.status}</Badge>
                  </TableCell>
                  {onEditSurvey && onDeleteSurvey && (
                    <TableCell className="text-right py-3">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => onEditSurvey(survey)} disabled>
                            <Edit2 className="mr-2 h-4 w-4" /> Edit
                          </DropdownMenuItem>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-900/50" disabled>
                                <Trash2 className="mr-2 h-4 w-4" /> Delete
                              </DropdownMenuItem>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This action cannot be undone. This will permanently delete survey "{survey.surveyNumber}".
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => onDeleteSurvey(survey.id)} className={buttonVariants({ variant: "destructive" })}>
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      {surveys.length === 0 && (
        <div className="text-center text-muted-foreground py-12">
            <ClipboardList className="mx-auto h-12 w-12 text-gray-400 mb-3" />
            <h3 className="text-lg font-medium">No surveys found.</h3>
            <p className="text-sm">Try adjusting your filters or add a new survey.</p>
        </div>
      )}
    </div>
  );
}
