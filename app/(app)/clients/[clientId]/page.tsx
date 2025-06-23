
'use client';

import { useEffect, useState, useTransition, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { USER_OPTIONS, FOLLOW_UP_TYPES, FOLLOW_UP_STATUSES, CLIENT_STATUS_OPTIONS, CLIENT_PRIORITY_OPTIONS } from '@/lib/constants';
import type { Client, UserOptionType, FollowUp, FollowUpStatus, AddActivityData, FollowUpType, CreateClientData, ClientStatusType, ClientPriorityType } from '@/types';
import { format, parseISO, isValid } from 'date-fns';
import { ChevronLeft, ChevronRight, Edit, Phone, MessageSquare, Mail, MessageCircle, UserCircle2, FileText, ShoppingCart, Loader2, Save, Send, Video, Building, Repeat } from 'lucide-react';
import { ProposalForm } from '@/app/(app)/proposals/proposal-form';
import { DocumentCreationDialog } from '@/app/(app)/documents/document-creation-dialog';
import { useToast } from "@/hooks/use-toast";
import { getClientById, updateClient, addClientActivity, getActivitiesForClient, convertClientToLead } from '@/app/(app)/clients-list/actions';
import { ClientForm } from '@/app/(app)/clients/client-form';
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

export default function ClientDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const clientId = typeof params.clientId === 'string' ? params.clientId : null;
  const { toast } = useToast();
  const [client, setClient] = useState<Client | null | undefined>(undefined);
  const [isFormPending, startFormTransition] = useTransition();
  const [isUpdating, startUpdateTransition] = useTransition();
  const [isConverting, startConversionTransition] = useTransition();
  
  const [activities, setActivities] = useState<FollowUp[]>([]);
  const [isActivitiesLoading, setActivitiesLoading] = useState(true);

  const [isProposalFormOpen, setIsProposalFormOpen] = useState(false);
  const [isDocumentDialogOpen, setIsDocumentDialogOpen] = useState(false);
  const [documentTypeToCreate, setDocumentTypeToCreate] = useState<'Purchase Order' | null>(null);
  const [isEditFormOpen, setIsEditFormOpen] = useState(false);

  const [activityType, setActivityType] = useState<FollowUpType>(FOLLOW_UP_TYPES[0]);
  const [activityDate, setActivityDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [activityTime, setActivityTime] = useState<string>(format(new Date(), 'HH:mm'));
  const [activityStatus, setActivityStatus] = useState<FollowUpStatus>(FOLLOW_UP_STATUSES[0]);
  const [activityClientStage, setActivityClientStage] = useState<ClientStatusType | undefined>();
  const [activityComment, setActivityComment] = useState('');
  
  const [taskForUser, setTaskForUser] = useState<UserOptionType | undefined>(USER_OPTIONS[0]);
  const [taskDate, setTaskDate] = useState('');
  const [taskTime, setTaskTime] = useState('');

  useEffect(() => {
    if (clientId) {
      const fetchClientDetails = async () => {
        setClient(undefined);
        try {
          const fetchedClient = await getClientById(clientId);
          setClient(fetchedClient);
          if (fetchedClient) {
            setActivityClientStage(fetchedClient.status as ClientStatusType);
          }
        } catch (error) {
          console.error("Failed to fetch client details:", error);
          setClient(null);
          toast({
            title: "Error",
            description: "Could not load client details.",
            variant: "destructive",
          });
        }
      };
      fetchClientDetails();
      
      const fetchActivities = async () => {
        setActivitiesLoading(true);
        const fetchedActivities = await getActivitiesForClient(clientId);
        setActivities(fetchedActivities);
        setActivitiesLoading(false);
      };
      fetchActivities();
    } else {
      setClient(null);
    }
  }, [clientId, toast]);

  useEffect(() => {
    if (client) {
        setActivityClientStage(client.status as ClientStatusType);
    }
  }, [client]);

  const handleSaveActivity = () => {
    if (!client) return;

    startFormTransition(async () => {
      const isTask = taskDate && taskTime;
      const activityCategory = isTask ? 'Task' : 'Followup';

      const activityData: AddActivityData = {
        followupOrTask: activityCategory,
        clientId: client.id,
        type: activityType,
        date: activityDate,
        time: activityTime,
        status: activityStatus,
        leadStageAtTimeOfFollowUp: activityClientStage,
        comment: activityComment,
        createdBy: 'Mayur', 
        ...(isTask && {
          taskForUser,
          taskDate,
          taskTime
        }),
      };

      const newActivity = await addClientActivity(activityData);

      if (newActivity) {
        toast({
          title: `${activityCategory} Saved`,
          description: `${activityType} for ${client.name} has been recorded.`,
        });
        setActivities(prev => [newActivity, ...prev]);
        const updatedClient = await getClientById(client.id);
        if (updatedClient) {
          setClient(updatedClient);
        }
        setActivityComment('');
        setTaskForUser(USER_OPTIONS[0]);
        setTaskDate('');
        setTaskTime('');
      } else {
        toast({
          title: 'Error',
          description: `Failed to save ${activityCategory}.`,
          variant: 'destructive',
        });
      }
    });
  };
  
  const handleAttributeChange = (
    key: 'status' | 'priority' | 'assignedTo',
    value: string | number
  ) => {
    if (!client || value === undefined || isUpdating) return;
    const originalClient = { ...client };

    setClient(prev => (prev ? { ...prev, [key]: value } : null));

    startUpdateTransition(async () => {
        const result = await updateClient(client.id, { [key]: value });
        if (result) {
            setClient(result);
            toast({
                title: `${key.charAt(0).toUpperCase() + key.slice(1)} Updated`,
                description: `Client ${key} set to "${value}".`,
            });
        } else {
            setClient(originalClient);
            toast({
                title: "Update Failed",
                description: `Could not update client ${key}.`,
                variant: "destructive",
            });
        }
    });
  };

  const handleOpenEditForm = () => {
    if (client) {
      setIsEditFormOpen(true);
    }
  };

  const handleEditFormSubmit = async (updatedClientData: CreateClientData | Client) => {
    if (!client || !client.id) return;
    startFormTransition(async () => {
      const result = await updateClient(client.id, updatedClientData as Partial<CreateClientData>);
      if (result) {
        setClient(result);
        toast({ title: "Client Updated", description: `${result.name}'s information has been updated.` });
        setIsEditFormOpen(false);
      } else {
        toast({ title: "Error", description: "Failed to update client.", variant: "destructive" });
      }
    });
  };
  
  const handleConvertToLead = () => {
    if (!client || isConverting) return;
    startConversionTransition(async () => {
        const result = await convertClientToLead(client.id);
        if (result.success && result.leadId) {
            toast({
                title: "Conversion Successful",
                description: `${client.name} has been converted back to a lead.`
            });
            router.push(`/leads/${result.leadId}`);
        } else {
            toast({
                title: "Conversion Failed",
                description: result.message || "Could not convert client to lead.",
                variant: "destructive",
            });
        }
    });
  };

  if (client === undefined) {
    return (
        <div className="flex flex-1 items-center justify-center h-full">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="ml-4 text-lg text-muted-foreground">Loading Client Details...</p>
        </div>
    );
  }

  if (client === null) {
    return (
        <div className="flex flex-col flex-1 items-center justify-center h-full p-8 text-center">
            <UserCircle2 className="h-16 w-16 mb-4 text-destructive" />
            <h2 className="text-2xl font-semibold mb-2">Client Not Found</h2>
            <p className="text-muted-foreground mb-6">
                The client you are looking for does not exist or could not be loaded.
            </p>
            <Button onClick={() => router.push('/clients-list')}>
                <ChevronLeft className="mr-2 h-4 w-4" /> Back to Clients List
            </Button>
        </div>
    );
  }

  const creationDateTime = client.createdAt && isValid(parseISO(client.createdAt)) ? format(parseISO(client.createdAt), 'dd-MM-yyyy HH:mm') : 'N/A';
  const nextFollowUpDisplay = client.nextFollowUpDate && isValid(parseISO(client.nextFollowUpDate))
    ? `${format(parseISO(client.nextFollowUpDate), 'dd-MM-yyyy')} ${client.nextFollowUpTime || ''}`.trim()
    : 'Not set';
  
  return (
    <div className="flex flex-col h-full">
      <div className="flex justify-between items-center p-4 border-b bg-card sticky top-0 z-10">
        <h1 className="text-xl font-semibold font-headline">{client.name}</h1>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => router.back()}>
            <ChevronLeft className="h-4 w-4 mr-1" /> Back
          </Button>
          <Button variant="outline" size="sm" disabled>Next <ChevronRight className="h-4 w-4 ml-1" /></Button>
        </div>
      </div>

      <div className="flex-grow p-4 overflow-y-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-3 space-y-6">
            <Card>
              <CardHeader className="flex flex-row justify-between items-center pb-2">
                <CardTitle className="text-lg font-semibold">Client Information</CardTitle>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleOpenEditForm} >
                  <Edit className="h-4 w-4" />
                </Button>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-xl font-bold text-primary">{client.name}</p>
                <p className="text-sm text-muted-foreground">{client.phone || 'No phone number'}</p>
                <p className="text-xs text-muted-foreground">Client Since: {creationDateTime}</p>
                <div>
                  <Label htmlFor="client-stage" className="text-xs font-medium">Stage</Label>
                  <Select value={client.status || ''} onValueChange={(value) => handleAttributeChange('status', value)} disabled={isUpdating}>
                    <SelectTrigger id="client-stage" className="h-8 text-xs">
                      <SelectValue placeholder="Select stage" />
                    </SelectTrigger>
                    <SelectContent>
                      {CLIENT_STATUS_OPTIONS.map(stage => <SelectItem key={stage} value={stage} className="text-xs">{stage}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                 <div>
                  <Label htmlFor="client-priority" className="text-xs font-medium">Priority</Label>
                  <Select value={client.priority || ''} onValueChange={(value) => handleAttributeChange('priority', value as ClientPriorityType)} disabled={isUpdating}>
                    <SelectTrigger id="client-priority" className="h-8 text-xs">
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                    <SelectContent>
                      {CLIENT_PRIORITY_OPTIONS.map(p => <SelectItem key={p} value={p} className="text-xs">{p}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                 <div>
                  <p className="text-xs font-medium">Next follow-up:</p>
                  <p className="text-sm">{nextFollowUpDisplay}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-md">Communication</CardTitle>
              </CardHeader>
              <CardContent className="flex justify-around items-center">
                <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary" disabled><Phone className="h-5 w-5" /></Button>
                <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary" disabled><MessageSquare className="h-5 w-5" /></Button>
                <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary" disabled><Mail className="h-5 w-5" /></Button>
                <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary" disabled><MessageCircle className="h-5 w-5" /></Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-md">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" size="sm" className="w-full" disabled={isConverting}>
                      <Repeat className="mr-2 h-4 w-4" /> Convert to Lead
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Convert Client to Lead?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will move "{client.name}" back to the leads list. This action can be reversed later. Are you sure?
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleConvertToLead} disabled={isConverting}>
                        {isConverting ? "Converting..." : "Yes, Convert"}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
                <Button onClick={() => setIsProposalFormOpen(true)} className="w-full" size="sm"><FileText className="mr-2 h-4 w-4" /> Create Proposal</Button>
                <Button onClick={() => { setDocumentTypeToCreate('Purchase Order'); setIsDocumentDialogOpen(true); }} className="w-full" variant="outline" size="sm"><ShoppingCart className="mr-2 h-4 w-4" /> Create Purchase Order</Button>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-6 space-y-6">
             <Card>
              <CardHeader><CardTitle>New Activity</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
                  <div className="sm:col-span-1">
                    <Select value={activityType} onValueChange={(val) => setActivityType(val as FollowUpType)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>{FOLLOW_UP_TYPES.map(type => <SelectItem key={type} value={type}>{type}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="sm:col-span-1"><Input type="date" value={activityDate} onChange={e => setActivityDate(e.target.value)} /></div>
                  <div className="sm:col-span-1"><Input type="time" value={activityTime} onChange={e => setActivityTime(e.target.value)} /></div>
                </div>
                <RadioGroup value={activityStatus} onValueChange={(value) => setActivityStatus(value as FollowUpStatus)} className="flex flex-wrap gap-x-4 gap-y-2">
                    {FOLLOW_UP_STATUSES.map(status => (<div key={status} className="flex items-center space-x-2"><RadioGroupItem value={status} id={`activity-status-${status}`} /><Label htmlFor={`activity-status-${status}`} className="text-sm font-normal">{status}</Label></div>))}
                </RadioGroup>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="activityClientStage">Client Stage</Label>
                    <Select value={activityClientStage} onValueChange={(val) => setActivityClientStage(val as ClientStatusType)}><SelectTrigger id="activityClientStage"><SelectValue placeholder="Select stage" /></SelectTrigger><SelectContent>{CLIENT_STATUS_OPTIONS.map(stage => <SelectItem key={stage} value={stage}>{stage}</SelectItem>)}</SelectContent></Select>
                  </div>
                </div>
                <div>
                  <Label htmlFor="activityComment">Activity Comment</Label>
                  <Textarea id="activityComment" placeholder="Enter comment..." value={activityComment} onChange={e => setActivityComment(e.target.value)} />
                </div>
                <Separator />
                <div>
                    <h3 className="text-md font-semibold mb-2">Schedule new task</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
                        <div>
                            <Label htmlFor="taskForUser">Task for</Label>
                            <Select value={taskForUser} onValueChange={(val) => setTaskForUser(val as UserOptionType)}><SelectTrigger id="taskForUser"><SelectValue placeholder="Select user" /></SelectTrigger><SelectContent>{USER_OPTIONS.map(user => <SelectItem key={user} value={user}>{user}</SelectItem>)}</SelectContent></Select>
                        </div>
                        <div><Label htmlFor="taskDate">Task date</Label><Input type="date" id="taskDate" value={taskDate} onChange={e => setTaskDate(e.target.value)}/></div>
                        <div><Label htmlFor="taskTime">Task time</Label><Input type="time" id="taskTime" value={taskTime} onChange={e => setTaskTime(e.target.value)}/></div>
                    </div>
                </div>
                <Button onClick={handleSaveActivity} className="w-full bg-green-600 hover:bg-green-700" disabled={isFormPending}>
                  {isFormPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : null} Save
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Activity History ({client.followUpCount || 0})</CardTitle></CardHeader>
              <CardContent>
                {isActivitiesLoading ? (
                   <div className="flex items-center justify-center p-6"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
                ) : activities.length > 0 ? (
                  <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
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
                            <Badge variant="secondary" className="capitalize bg-teal-100 text-teal-800 border-transparent hover:bg-teal-200">
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
                  <p className="text-sm text-center text-muted-foreground py-6">No activity history yet.</p>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-3 space-y-6">
            <Card>
              <CardContent className="pt-6 space-y-1">
                <div className="flex items-center gap-2">
                   <Avatar className="h-8 w-8"><AvatarImage src={`https://placehold.co/40x40.png?text=${client.assignedTo?.charAt(0) || 'U'}`} data-ai-hint="user avatar" /><AvatarFallback>{client.assignedTo?.charAt(0) || 'U'}</AvatarFallback></Avatar>
                   <Select
                      value={client.assignedTo || ''}
                      onValueChange={(value) => handleAttributeChange('assignedTo', value as UserOptionType)}
                      disabled={isUpdating}
                    >
                      <SelectTrigger className="h-9 text-sm flex-grow">
                        <SelectValue placeholder="Unassigned" />
                      </SelectTrigger>
                      <SelectContent>{USER_OPTIONS.map(user => <SelectItem key={user} value={user} className="text-sm">{user}</SelectItem>)}</SelectContent>
                    </Select>
                </div>
                <p className="text-xs text-muted-foreground ml-10">Assigned to</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 space-y-1">
                 <div className="flex items-center gap-2">
                   <Avatar className="h-8 w-8"><AvatarImage src={`https://placehold.co/40x40.png?text=${client.createdBy?.charAt(0) || 'S'}`} data-ai-hint="user avatar"/><AvatarFallback>{client.createdBy?.charAt(0) || 'S'}</AvatarFallback></Avatar>
                  <p className="text-sm font-medium flex-grow bg-muted px-3 py-2 rounded-md h-9 flex items-center">{client.createdBy || 'System'}</p>
                </div>
                <p className="text-xs text-muted-foreground ml-10">Created by</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2 pt-4"><CardTitle className="text-md">Notes</CardTitle></CardHeader>
              <CardContent><Textarea placeholder="Add notes here..." className="min-h-[100px] bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800" /></CardContent>
            </Card>
          </div>
        </div>
      </div>
      {isProposalFormOpen && client && (<ProposalForm isOpen={isProposalFormOpen} onClose={() => setIsProposalFormOpen(false)} onSubmit={() => {}} initialData={{ clientId: client.id, name: client.name, clientType: client.clientType || 'Other' }} />)}
      {isDocumentDialogOpen && documentTypeToCreate === 'Purchase Order' && client && (<DocumentCreationDialog isOpen={isDocumentDialogOpen} onClose={() => setIsDocumentDialogOpen(false)} documentType="Purchase Order" />)}
      {isEditFormOpen && client && (<ClientForm isOpen={isEditFormOpen} onClose={() => setIsEditFormOpen(false)} onSubmit={handleEditFormSubmit} client={client}/>)}
    </div>
  );
}
