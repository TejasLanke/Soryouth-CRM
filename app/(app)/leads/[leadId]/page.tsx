
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
import { USER_OPTIONS, LEAD_SOURCE_OPTIONS, LEAD_STATUS_OPTIONS, LEAD_PRIORITY_OPTIONS, FOLLOW_UP_TYPES, FOLLOW_UP_STATUSES, CLIENT_TYPES } from '@/lib/constants';
import type { Lead, UserOptionType, LeadSourceOptionType, LeadStatusType, LeadPriorityType, ClientType, FollowUp, FollowUpStatus, AddActivityData, FollowUpType, CreateLeadData } from '@/types';
import { format, parseISO, isValid } from 'date-fns';
import { ChevronLeft, ChevronRight, Edit, Phone, MessageSquare, Mail, MessageCircle, Clock, UserCircle2, FileText, ShoppingCart, ReceiptText, Loader2, Save, Calendar, Send, Video, Building } from 'lucide-react';
import { ProposalForm } from '@/app/(app)/proposals/proposal-form';
import { DocumentCreationDialog } from '@/app/(app)/documents/document-creation-dialog';
import { useToast } from "@/hooks/use-toast";
import { getLeadById, updateLead, addActivity, getActivitiesForLead } from '@/app/(app)/leads-list/actions';
import { LeadForm } from '@/app/(app)/leads/lead-form';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

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

export default function LeadDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const leadId = typeof params.leadId === 'string' ? params.leadId : null;
  const { toast } = useToast();
  const [lead, setLead] = useState<Lead | null | undefined>(undefined);
  const [isFormPending, startFormTransition] = useTransition();
  const [isUpdating, startUpdateTransition] = useTransition();
  
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
  const [activityLeadStage, setActivityLeadStage] = useState<LeadStatusType | undefined>();
  const [activityPriority, setActivityPriority] = useState<LeadPriorityType | undefined>();
  const [activityComment, setActivityComment] = useState('');
  
  const [taskForUser, setTaskForUser] = useState<UserOptionType | undefined>(USER_OPTIONS[0]);
  const [taskDate, setTaskDate] = useState('');
  const [taskTime, setTaskTime] = useState('');

  useEffect(() => {
    if (leadId) {
      const fetchLeadDetails = async () => {
        setLead(undefined);
        try {
          const fetchedLead = await getLeadById(leadId);
          setLead(fetchedLead);
          if (fetchedLead) {
            setActivityLeadStage(fetchedLead.status);
            setActivityPriority(fetchedLead.priority || undefined);
          }
        } catch (error) {
          console.error("Failed to fetch lead details:", error);
          setLead(null);
          toast({
            title: "Error",
            description: "Could not load lead details.",
            variant: "destructive",
          });
        }
      };
      fetchLeadDetails();
      
      const fetchActivities = async () => {
        setActivitiesLoading(true);
        const fetchedActivities = await getActivitiesForLead(leadId);
        setActivities(fetchedActivities);
        setActivitiesLoading(false);
      };
      fetchActivities();
    } else {
      setLead(null);
    }
  }, [leadId, toast]);

  useEffect(() => {
    if (lead) {
        setActivityLeadStage(lead.status);
        setActivityPriority(lead.priority || undefined);
    }
  }, [lead]);

  const handleSaveActivity = () => {
    if (!lead) return;

    startFormTransition(async () => {
      const isTask = taskDate && taskTime;
      const activityCategory = isTask ? 'Task' : 'Followup';

      const activityData: AddActivityData = {
        followupOrTask: activityCategory,
        leadId: lead.id,
        type: activityType,
        date: activityDate,
        time: activityTime,
        status: activityStatus,
        leadStageAtTimeOfFollowUp: activityLeadStage,
        comment: activityComment,
        createdBy: 'Mayur', // Placeholder for authenticated user
        priority: activityPriority,
        ...(isTask && {
          taskForUser,
          taskDate,
          taskTime
        }),
      };

      const newActivity = await addActivity(activityData);

      if (newActivity) {
        toast({
          title: `${activityCategory} Saved`,
          description: `${activityType} for ${lead.name} has been recorded.`,
        });
        setActivities(prev => [newActivity, ...prev]);

        // Re-fetch lead to update counts and next follow-up dates
        const updatedLead = await getLeadById(lead.id);
        if (updatedLead) {
          setLead(updatedLead);
        }
        
        // Reset form fields
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

  const handleOpenProposalForm = () => setIsProposalFormOpen(true);
  const handleProposalFormSubmit = (proposalData: any) => {
    console.log("Proposal Data Submitted from Lead Detail:", proposalData);
    toast({ title: "Proposal Creation Initiated (Logged)", description: `Proposal for ${lead?.name} is being processed.`});
    setIsProposalFormOpen(false);
  };

  const handleOpenPurchaseOrderDialog = () => {
    setDocumentTypeToCreate('Purchase Order');
    setIsDocumentDialogOpen(true);
  };

  const handleCloseDocumentDialog = () => {
    setIsDocumentDialogOpen(false);
    setDocumentTypeToCreate(null);
  };

  const handleViewElectricityBill = () => {
    if (lead?.electricityBillUrl) {
      window.open(lead.electricityBillUrl, '_blank');
    } else {
      toast({ title: "No Bill Available", description: "Electricity bill has not been uploaded for this lead.", variant: "destructive" });
    }
  };

  const handleOpenEditForm = () => {
    if (lead) {
      setIsEditFormOpen(true);
    }
  };

  const handleEditFormSubmit = async (updatedLeadData: CreateLeadData | Lead) => {
    if (!lead || !lead.id) return;
    startFormTransition(async () => {
      const result = await updateLead(lead.id, updatedLeadData as Partial<CreateLeadData>);
      if (result) {
        setLead(result);
        toast({ title: "Lead Updated", description: `${result.name}'s information has been updated.` });
        setIsEditFormOpen(false);
      } else {
        toast({ title: "Error", description: "Failed to update lead.", variant: "destructive" });
      }
    });
  };
  
  const handleAttributeChange = (
    key: 'status' | 'priority' | 'assignedTo' | 'clientType' | 'kilowatt',
    value: string | number
  ) => {
    if (!lead || value === undefined || isUpdating) return;
    const originalLead = { ...lead };

    setLead(prev => (prev ? { ...prev, [key]: value } : null));

    startUpdateTransition(async () => {
        const result = await updateLead(lead.id, { [key]: value });
        if (result) {
            setLead(result); // Sync with server state
            toast({
                title: `${key.charAt(0).toUpperCase() + key.slice(1)} Updated`,
                description: `Lead ${key} set to "${value}".`,
            });
        } else {
            setLead(originalLead); // Revert on failure
            toast({
                title: "Update Failed",
                description: `Could not update lead ${key}.`,
                variant: "destructive",
            });
        }
    });
  };

  if (lead === undefined) {
    return (
        <div className="flex flex-1 items-center justify-center h-full">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="ml-4 text-lg text-muted-foreground">Loading Lead Details...</p>
        </div>
    );
  }

  if (lead === null) {
    return (
        <div className="flex flex-col flex-1 items-center justify-center h-full p-8 text-center">
            <UserCircle2 className="h-16 w-16 mb-4 text-destructive" />
            <h2 className="text-2xl font-semibold mb-2">Lead Not Found</h2>
            <p className="text-muted-foreground mb-6">
                The lead you are looking for does not exist or could not be loaded.
            </p>
            <Button onClick={() => router.push('/leads-list')}>
                <ChevronLeft className="mr-2 h-4 w-4" /> Back to Leads List
            </Button>
        </div>
    );
  }

  const creationDateTime = lead.createdAt && isValid(parseISO(lead.createdAt)) ? format(parseISO(lead.createdAt), 'dd-MM-yyyy HH:mm') : 'N/A';
  const nextFollowUpDisplay = lead.nextFollowUpDate && isValid(parseISO(lead.nextFollowUpDate))
    ? `${format(parseISO(lead.nextFollowUpDate), 'dd-MM-yyyy')} ${lead.nextFollowUpTime || ''}`.trim()
    : 'Not set';

  return (
    <div className="flex flex-col h-full">
      <div className="flex justify-between items-center p-4 border-b bg-card sticky top-0 z-10">
        <h1 className="text-xl font-semibold font-headline">{lead.name}</h1>
        <div className="flex gap-2">
          <Button variant="destructive" size="sm" disabled>Drop lead</Button>
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
                <CardTitle className="text-lg font-semibold">Lead Information</CardTitle>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleOpenEditForm} >
                  <Edit className="h-4 w-4" />
                </Button>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-xl font-bold text-primary">{lead.name}</p>
                <p className="text-sm text-muted-foreground">{lead.phone || 'No phone number'}</p>
                <p className="text-xs text-muted-foreground">Created: {creationDateTime}</p>
                <div>
                  <Label htmlFor="lead-status" className="text-xs font-medium">Stage</Label>
                  <Select value={lead.status || ''} onValueChange={(value) => handleAttributeChange('status', value)} disabled={isUpdating}>
                    <SelectTrigger id="lead-status" className="h-8 text-xs">
                      <SelectValue placeholder="Select stage" />
                    </SelectTrigger>
                    <SelectContent>
                      {LEAD_STATUS_OPTIONS.map(stage => <SelectItem key={stage} value={stage} className="text-xs">{stage}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                 <div>
                  <Label htmlFor="lead-priority" className="text-xs font-medium">Priority</Label>
                  <Select value={lead.priority || ''} onValueChange={(value) => handleAttributeChange('priority', value as LeadPriorityType)} disabled={isUpdating}>
                    <SelectTrigger id="lead-priority" className="h-8 text-xs">
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                    <SelectContent>
                      {LEAD_PRIORITY_OPTIONS.map(p => <SelectItem key={p} value={p} className="text-xs">{p}</SelectItem>)}
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
                <CardTitle className="text-md">Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <Label htmlFor="leadSource" className="text-xs">Source</Label>
                  <Select value={lead.source || undefined} disabled>
                    <SelectTrigger id="leadSource" className="h-8 text-xs">
                      <SelectValue placeholder="Select source" />
                    </SelectTrigger>
                    <SelectContent>
                      {LEAD_SOURCE_OPTIONS.map(src => <SelectItem key={src} value={src} className="text-xs">{src}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Address</Label>
                  <p className="text-sm bg-muted p-2 rounded-md min-h-[40px]">{lead.address || 'Not specified'}</p>
                </div>
                 {(lead.electricityBillUrl || lead.status === 'fresher') && (
                  <div>
                    <Button onClick={handleViewElectricityBill} variant={lead.electricityBillUrl ? "outline" : "secondary"} size="sm" className="w-full mt-2" disabled={!lead.electricityBillUrl}>
                      <ReceiptText className="mr-2 h-4 w-4" />
                      {lead.electricityBillUrl ? 'View Electricity Bill' : 'Upload Bill (Soon)'}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-md">Lead Attributes</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                 <div>
                  <Label htmlFor="customerType" className="text-xs">Customer Type</Label>
                  <Select
                    value={lead.clientType || undefined}
                    onValueChange={(value) => handleAttributeChange('clientType', value as ClientType)}
                    disabled={isUpdating}
                  >
                    <SelectTrigger id="customerType" className="h-8 text-xs">
                      <SelectValue placeholder="Select customer type" />
                    </SelectTrigger>
                    <SelectContent>
                      {CLIENT_TYPES.map(type => <SelectItem key={type} value={type} className="text-xs">{type}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="kilowatt" className="text-xs">Kilowatt</Label>
                  <Input
                    id="kilowatt"
                    type="number"
                    value={lead.kilowatt ?? ''}
                    onChange={(e) => handleAttributeChange('kilowatt', parseFloat(e.target.value) || 0)}
                    className="h-8 text-xs"
                    disabled={isUpdating}
                  />
                </div>
                 <div>
                  <Label htmlFor="entityType" className="text-xs">Type</Label>
                  <Select value="Lead" disabled>
                    <SelectTrigger id="entityType" className="h-8 text-xs bg-muted"><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="Lead" className="text-xs">Lead</SelectItem></SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-md">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button onClick={handleOpenProposalForm} className="w-full" size="sm"><FileText className="mr-2 h-4 w-4" /> Create Proposal</Button>
                <Button onClick={handleOpenPurchaseOrderDialog} className="w-full" variant="outline" size="sm"><ShoppingCart className="mr-2 h-4 w-4" /> Create Purchase Order</Button>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-6 space-y-6">
            <Card>
              <CardHeader><CardTitle>New follow-up</CardTitle></CardHeader>
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
                    <Label htmlFor="activityLeadStage">Lead Stage</Label>
                    <Select value={activityLeadStage} onValueChange={(val) => setActivityLeadStage(val as LeadStatusType)}><SelectTrigger id="activityLeadStage"><SelectValue placeholder="Select stage" /></SelectTrigger><SelectContent>{LEAD_STATUS_OPTIONS.map(stage => <SelectItem key={stage} value={stage}>{stage}</SelectItem>)}</SelectContent></Select>
                  </div>
                   <div>
                    <Label htmlFor="activityPriority">Lead Priority</Label>
                    <Select value={activityPriority} onValueChange={(val) => setActivityPriority(val as LeadPriorityType)}><SelectTrigger id="activityPriority"><SelectValue placeholder="Select priority" /></SelectTrigger><SelectContent>{LEAD_PRIORITY_OPTIONS.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent></Select>
                  </div>
                </div>
                <div>
                  <Label htmlFor="activityComment">Follow-up Comment</Label>
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
              <CardHeader><CardTitle>Activity History ({lead.followUpCount || 0})</CardTitle></CardHeader>
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
                              {activity.comment || (activity.followupOrTask === 'Task' ? 'Task Scheduled' : 'Follow-up Logged')}
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
                   <Avatar className="h-8 w-8"><AvatarImage src={`https://placehold.co/40x40.png?text=${lead.assignedTo?.charAt(0) || 'U'}`} data-ai-hint="user avatar" /><AvatarFallback>{lead.assignedTo?.charAt(0) || 'U'}</AvatarFallback></Avatar>
                   <Select
                      value={lead.assignedTo || ''}
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
                   <Avatar className="h-8 w-8"><AvatarImage src={`https://placehold.co/40x40.png?text=${lead.createdBy?.charAt(0) || 'S'}`} data-ai-hint="user avatar"/><AvatarFallback>{lead.createdBy?.charAt(0) || 'S'}</AvatarFallback></Avatar>
                  <p className="text-sm font-medium flex-grow bg-muted px-3 py-2 rounded-md h-9 flex items-center">{lead.createdBy || 'System'}</p>
                </div>
                <p className="text-xs text-muted-foreground ml-10">Created by</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2 pt-4"><CardTitle className="text-md">Notes</CardTitle></CardHeader>
              <CardContent><Textarea placeholder="Add notes here..." className="min-h-[100px] bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800" /></CardContent>
            </Card>
            <Card>
                <CardHeader className="pb-2 pt-4"><CardTitle className="text-md">Associated Contacts</CardTitle></CardHeader>
                <CardContent className="text-center"><p className="text-4xl font-bold text-primary">0</p></CardContent>
            </Card>
          </div>
        </div>
      </div>
      {isProposalFormOpen && lead && (<ProposalForm isOpen={isProposalFormOpen} onClose={() => setIsProposalFormOpen(false)} onSubmit={handleProposalFormSubmit} initialData={{ clientId: lead.id, name: lead.name, clientType: lead.clientType || CLIENT_TYPES[0] }} />)}
      {isDocumentDialogOpen && documentTypeToCreate === 'Purchase Order' && lead && (<DocumentCreationDialog isOpen={isDocumentDialogOpen} onClose={handleCloseDocumentDialog} documentType="Purchase Order" />)}
      {isEditFormOpen && lead && (<LeadForm isOpen={isEditFormOpen} onClose={() => setIsEditFormOpen(false)} onSubmit={handleEditFormSubmit} lead={lead} />)}
    </div>
  );
}
