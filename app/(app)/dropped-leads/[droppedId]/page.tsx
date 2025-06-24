
'use client';

import { useEffect, useState, useTransition } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from "@/components/ui/label";
import { LEAD_SOURCE_OPTIONS, CLIENT_TYPES } from '@/lib/constants';
import type { DroppedLead, FollowUp } from '@/types';
import { format, parseISO, isValid } from 'date-fns';
import { ChevronLeft, Phone, MessageSquare, Mail, MessageCircle, UserCircle2, Loader2, Send, Video, Building, Repeat, Trash2, CalendarX2 } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { getDroppedLeadById, getActivitiesForDroppedLead, reactivateLead } from '@/app/(app)/dropped-leads-list/actions';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

const ActivityIcon = ({ type, className }: { type: string, className?: string }) => {
  const defaultClassName = "h-4 w-4";
  const finalClassName = cn(defaultClassName, className);

  switch (type) {
    case 'Call': return <Phone className={finalClassName} />;
    case 'SMS': return <MessageSquare className={finalClassName} />;
    case 'Email': return <Mail className={finalClassName} />;
    case 'Meeting': return <Video className={finalClassName} />;
    case 'Visit': return <Building className={finalClassName} />;
    default: return <Send className={finalClassName} />;
  }
};

export default function DroppedLeadDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const droppedId = typeof params.droppedId === 'string' ? params.droppedId : null;
  const { toast } = useToast();
  const [droppedLead, setDroppedLead] = useState<DroppedLead | null | undefined>(undefined);
  const [isReactivating, startReactivationTransition] = useTransition();
  const [activities, setActivities] = useState<FollowUp[]>([]);
  const [isActivitiesLoading, setActivitiesLoading] = useState(true);

  useEffect(() => {
    if (droppedId) {
      const fetchDetails = async () => {
        setDroppedLead(undefined);
        setActivitiesLoading(true);
        try {
          const [fetchedLead, fetchedActivities] = await Promise.all([
            getDroppedLeadById(droppedId),
            getActivitiesForDroppedLead(droppedId)
          ]);
          setDroppedLead(fetchedLead);
          setActivities(fetchedActivities);
        } catch (error) {
          console.error("Failed to fetch dropped lead details:", error);
          setDroppedLead(null);
          toast({
            title: "Error",
            description: "Could not load dropped lead details.",
            variant: "destructive",
          });
        } finally {
          setActivitiesLoading(false);
        }
      };
      fetchDetails();
    } else {
      setDroppedLead(null);
    }
  }, [droppedId, toast]);
  
  const handleReactivateLead = () => {
    if (!droppedLead) return;
    startReactivationTransition(async () => {
        const result = await reactivateLead(droppedLead.id);
        if (result.success && result.newLeadId) {
            toast({
                title: "Lead Reactivated",
                description: `${droppedLead.name} has been moved back to the active leads list.`
            });
            router.push(`/leads/${result.newLeadId}`);
        } else {
             toast({
                title: "Reactivation Failed",
                description: result.message || "Could not reactivate the lead.",
                variant: "destructive",
            });
        }
    });
  };

  if (droppedLead === undefined) {
    return (
        <div className="flex flex-1 items-center justify-center h-full">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="ml-4 text-lg text-muted-foreground">Loading Dropped Lead Details...</p>
        </div>
    );
  }

  if (droppedLead === null) {
    return (
        <div className="flex flex-col flex-1 items-center justify-center h-full p-8 text-center">
            <UserCircle2 className="h-16 w-16 mb-4 text-destructive" />
            <h2 className="text-2xl font-semibold mb-2">Dropped Lead Not Found</h2>
            <p className="text-muted-foreground mb-6">
                The dropped lead you are looking for does not exist or could not be loaded.
            </p>
            <Button onClick={() => router.push('/dropped-leads-list')}>
                <ChevronLeft className="mr-2 h-4 w-4" /> Back to Dropped Leads List
            </Button>
        </div>
    );
  }

  const creationDateTime = droppedLead.createdAt && isValid(parseISO(droppedLead.createdAt)) ? format(parseISO(droppedLead.createdAt), 'dd-MM-yyyy HH:mm') : 'N/A';
  const droppedDateTime = droppedLead.droppedAt && isValid(parseISO(droppedLead.droppedAt)) ? format(parseISO(droppedLead.droppedAt), 'dd-MM-yyyy HH:mm') : 'N/A';

  return (
    <div className="flex flex-col h-full">
      <div className="flex justify-between items-center p-4 border-b bg-card sticky top-0 z-10">
        <h1 className="text-xl font-semibold font-headline">{droppedLead.name}</h1>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => router.back()}>
            <ChevronLeft className="h-4 w-4 mr-1" /> Back
          </Button>
        </div>
      </div>

      <div className="flex-grow p-4 overflow-y-auto">
        <Card className="mb-6 bg-destructive/10 border-destructive/30">
            <CardHeader>
                <div className="flex items-center gap-3">
                    <CalendarX2 className="h-6 w-6 text-destructive"/>
                    <CardTitle className="text-destructive">Lead Dropped</CardTitle>
                </div>
            </CardHeader>
            <CardContent>
                <p><span className="font-semibold">Reason:</span> {droppedLead.dropReason}</p>
                {droppedLead.dropComment && <p><span className="font-semibold">Comment:</span> {droppedLead.dropComment}</p>}
                <p className="text-xs text-muted-foreground mt-2">Dropped on: {droppedDateTime}</p>
            </CardContent>
        </Card>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-3 space-y-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-semibold">Lead Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-xl font-bold text-primary">{droppedLead.name}</p>
                <p className="text-sm text-muted-foreground">{droppedLead.phone || 'No phone number'}</p>
                 <p className="text-sm text-muted-foreground">{droppedLead.email || 'No email'}</p>
                <p className="text-xs text-muted-foreground">Originally Created: {creationDateTime}</p>
                <div className="space-y-1">
                  <Label className="text-xs font-medium">Stage at Drop</Label>
                  <p className="text-sm p-2 bg-muted rounded-md">{droppedLead.status}</p>
                </div>
                 <div className="space-y-1">
                  <Label className="text-xs font-medium">Priority at Drop</Label>
                  <p className="text-sm p-2 bg-muted rounded-md">{droppedLead.priority || 'N/A'}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-md">Details at Drop</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <Label className="text-xs">Source</Label>
                   <p className="text-sm p-2 bg-muted rounded-md">{droppedLead.source || 'N/A'}</p>
                </div>
                 <div>
                  <Label className="text-xs">Customer Type</Label>
                   <p className="text-sm p-2 bg-muted rounded-md">{droppedLead.clientType || 'N/A'}</p>
                </div>
                <div>
                  <Label className="text-xs">Kilowatt</Label>
                   <p className="text-sm p-2 bg-muted rounded-md">{droppedLead.kilowatt ? `${droppedLead.kilowatt} kW` : 'N/A'}</p>
                </div>
                 <div>
                  <Label className="text-xs">Address</Label>
                  <p className="text-sm bg-muted p-2 rounded-md min-h-[40px]">{droppedLead.address || 'Not specified'}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-md">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                 <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button className="w-full" variant="outline" size="sm" disabled={isReactivating}>
                      <Repeat className="mr-2 h-4 w-4" /> Reactivate Lead
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Reactivate Lead?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will move "{droppedLead.name}" and all its history back to the active leads list. Are you sure?
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleReactivateLead} disabled={isReactivating}>
                        {isReactivating ? "Reactivating..." : "Yes, Reactivate"}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-6 space-y-6">
            <Card>
              <CardHeader><CardTitle>Activity History ({droppedLead.followupCount || 0})</CardTitle></CardHeader>
              <CardContent>
                {isActivitiesLoading ? (
                   <div className="flex items-center justify-center p-6"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
                ) : activities.length > 0 ? (
                  <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
                    {activities.map(activity => (
                      <div key={activity.id} className="flex items-start gap-4 p-3 border rounded-md">
                         <Avatar className="h-9 w-9 border mt-1">
                           <ActivityIcon type={activity.type} className="h-full w-full p-2 text-muted-foreground" />
                        </Avatar>
                        <div className="flex-1 space-y-1.5">
                           <p className="text-sm font-semibold">
                              {activity.comment || (activity.followupOrTask === 'Task' ? 'Task Scheduled' : 'Activity Logged')}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {format(parseISO(activity.createdAt), 'dd-MM-yyyy p')} by {activity.createdBy || 'System'}
                          </p>
                           <div className="flex items-center gap-2 flex-wrap pt-1">
                              <Badge variant="secondary" className="capitalize bg-blue-100 text-blue-800 border-transparent hover:bg-blue-200">
                                 {activity.type}
                              </Badge>
                              {activity.leadStageAtTimeOfFollowUp && (
                                <Badge variant="outline" className="capitalize bg-slate-800 text-white border-transparent hover:bg-slate-700">{activity.leadStageAtTimeOfFollowUp}</Badge>
                              )}
                              {activity.followupOrTask === 'Task' ? (
                                <Badge className="bg-green-600 text-white border-transparent hover:bg-green-700">
                                  Task Due: {activity.taskDate ? format(parseISO(activity.taskDate), 'dd-MM-yyyy') : ''} {activity.taskTime || ''}
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="bg-slate-800 text-white border-transparent hover:bg-slate-700">Followup</Badge>
                              )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-center text-muted-foreground py-6">No activity history found.</p>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-3 space-y-6">
            <Card>
              <CardContent className="pt-6 space-y-1">
                <div className="flex items-center gap-2">
                   <Avatar className="h-8 w-8"><AvatarImage src={`https://placehold.co/40x40.png?text=${droppedLead.assignedTo?.charAt(0) || 'U'}`} data-ai-hint="user avatar" /><AvatarFallback>{droppedLead.assignedTo?.charAt(0) || 'U'}</AvatarFallback></Avatar>
                   <p className="text-sm font-medium flex-grow bg-muted px-3 py-2 rounded-md h-9 flex items-center">{droppedLead.assignedTo || 'Unassigned'}</p>
                </div>
                <p className="text-xs text-muted-foreground ml-10">Assigned to</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 space-y-1">
                 <div className="flex items-center gap-2">
                   <Avatar className="h-8 w-8"><AvatarImage src={`https://placehold.co/40x40.png?text=${droppedLead.createdBy?.charAt(0) || 'S'}`} data-ai-hint="user avatar"/><AvatarFallback>{droppedLead.createdBy?.charAt(0) || 'S'}</AvatarFallback></Avatar>
                  <p className="text-sm font-medium flex-grow bg-muted px-3 py-2 rounded-md h-9 flex items-center">{droppedLead.createdBy || 'System'}</p>
                </div>
                <p className="text-xs text-muted-foreground ml-10">Created by</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
