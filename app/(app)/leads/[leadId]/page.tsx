
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
import { LEAD_PRIORITY_OPTIONS, FOLLOW_UP_TYPES, FOLLOW_UP_STATUSES, CLIENT_TYPES, DROP_REASON_OPTIONS } from '@/lib/constants';
import type { Lead, User, UserOptionType, LeadSourceOptionType, LeadStatusType, LeadPriorityType, ClientType, FollowUp, FollowUpStatus, AddActivityData, FollowUpType, CreateLeadData, AnyStatusType, DropReasonType, Proposal, CustomSetting } from '@/types';
import { format, parseISO, isValid } from 'date-fns';
import { ChevronLeft, ChevronRight, Edit, Phone, MessageSquare, Mail, MessageCircle, UserCircle2, FileText, ShoppingCart, Loader2, Save, Send, Video, Building, Repeat, Trash2, IndianRupee } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { getLeadById, updateLead, addActivity, convertToClient, dropLead, getActivitiesForLead } from '@/app/(app)/leads-list/actions';
import { getProposalsForLead, createOrUpdateProposal } from '@/app/(app)/proposals/actions';
import { getUsers } from '@/app/(app)/users/actions';
import { getLeadStatuses, getLeadSources } from '@/app/(app)/settings/actions';
import { LeadForm } from '@/app/(app)/leads/lead-form';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { ProposalPreviewDialog } from '@/app/(app)/proposals/proposal-preview-dialog';
import { ProposalForm } from '@/app/(app)/proposals/proposal-form';
import { TemplateSelectionDialog } from '@/app/(app)/proposals/template-selection-dialog';


const dropLeadSchema = z.object({
  dropReason: z.enum(DROP_REASON_OPTIONS, { required_error: "Drop reason is required." }),
  dropComment: z.string().optional(),
});
type DropLeadFormValues = z.infer<typeof dropLeadSchema>;

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
  const [users, setUsers] = useState<User[]>([]);
  const [leadStatuses, setLeadStatuses] = useState<CustomSetting[]>([]);
  const [leadSources, setLeadSources] = useState<CustomSetting[]>([]);
  const [isFormPending, startFormTransition] = useTransition();
  const [isUpdating, startUpdateTransition] = useTransition();
  const [isDropping, startDropTransition] = useTransition();
  
  const [activities, setActivities] = useState<FollowUp[]>([]);
  const [isActivitiesLoading, setActivitiesLoading] = useState(true);

  const [isEditFormOpen, setIsEditFormOpen] = useState(false);
  const [isDropDialogOpen, setIsDropDialogOpen] = useState(false);
  const [isProposalFormOpen, setIsProposalFormOpen] = useState(false);
  const [isTemplateDialogOpen, setIsTemplateDialogOpen] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [proposals, setProposals] = useState<Proposal[]>([]);

  const [activityType, setActivityType] = useState<FollowUpType>(FOLLOW_UP_TYPES[0]);
  const [activityDate, setActivityDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [activityTime, setActivityTime] = useState<string>(format(new Date(), 'HH:mm'));
  const [activityStatus, setActivityStatus] = useState<FollowUpStatus>(FOLLOW_UP_STATUSES[0]);
  const [activityLeadStage, setActivityLeadStage] = useState<LeadStatusType | undefined>();
  const [activityPriority, setActivityPriority] = useState<LeadPriorityType | undefined>();
  const [activityComment, setActivityComment] = useState('');
  
  const [taskForUser, setTaskForUser] = useState<string | undefined>(undefined);
  const [taskDate, setTaskDate] = useState('');
  const [taskTime, setTaskTime] = useState('');

  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [selectedProposalForPreview, setSelectedProposalForPreview] = useState<Proposal | null>(null);

  const dropForm = useForm<DropLeadFormValues>({
    resolver: zodResolver(dropLeadSchema),
  });

  const fetchProposals = async () => {
    if (leadId) {
      const fetchedProposals = await getProposalsForLead(leadId);
      setProposals(fetchedProposals);
    }
  };

  useEffect(() => {
    if (leadId) {
      const fetchLeadDetails = async () => {
        setLead(undefined);
        try {
          const [fetchedLead, fetchedUsers, fetchedStatuses, fetchedSources] = await Promise.all([
            getLeadById(leadId),
            getUsers(),
            getLeadStatuses(),
            getLeadSources(),
          ]);
          setLead(fetchedLead);
          setUsers(fetchedUsers);
          setLeadStatuses(fetchedStatuses);
          setLeadSources(fetchedSources);

          if (fetchedLead) {
            setActivityLeadStage(fetchedLead.status as LeadStatusType);
            setActivityPriority(fetchedLead.priority as LeadPriorityType || undefined);
          }
          if (fetchedUsers.length > 0) {
            setTaskForUser(fetchedUsers[0].name);
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
      
      const fetchActivities = async () => {
        setActivitiesLoading(true);
        const fetchedActivities = await getActivitiesForLead(leadId);
        setActivities(fetchedActivities);
        setActivitiesLoading(false);
      };

      fetchLeadDetails();
      fetchActivities();
      fetchProposals();
    } else {
      setLead(null);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leadId, toast]);

  useEffect(() => {
    if (lead) {
        setActivityLeadStage(lead.status as LeadStatusType);
        setActivityPriority(lead.priority as LeadPriorityType || undefined);
    }
  }, [lead]);

  const handleProposalSubmit = async (data: Partial<Proposal>) => {
    startFormTransition(async () => {
      const result = await createOrUpdateProposal(data);
      if (result) {
        toast({
          title: "Proposal History Updated",
          description: `Proposal ${data.proposalNumber} has been saved.`,
        });
        await fetchProposals(); 
        if(result.pdfUrl) {
          setSelectedProposalForPreview(result);
          setIsPreviewOpen(true);
        }
      } else {
        toast({ title: "Error", description: "Could not save the proposal to the database.", variant: "destructive" });
      }
    });
    setIsProposalFormOpen(false);
    setSelectedTemplateId(null);
  };
  
  const handleCreateNewProposal = () => {
      setIsTemplateDialogOpen(true);
  };

  const handleTemplateSelected = (templateId: string) => {
      setSelectedTemplateId(templateId);
      setIsTemplateDialogOpen(false);
      setIsProposalFormOpen(true);
  };

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
        const updatedLead = await getLeadById(lead.id);
        if (updatedLead) {
          setLead(updatedLead);
        }
        setActivityComment('');
        if (users.length > 0) {
            setTaskForUser(users[0].name);
        }
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
            setLead(result);
            toast({
                title: `${key.charAt(0).toUpperCase() + key.slice(1)} Updated`,
                description: `Lead ${key} set to "${value}".`,
            });
        } else {
            setLead(originalLead);
            toast({
                title: "Update Failed",
                description: `Could not update lead ${key}.`,
                variant: "destructive",
            });
        }
    });
  };

  const handleConvertToClient = () => {
    if (!lead || isUpdating) return;
    startUpdateTransition(async () => {
      const result = await convertToClient(lead.id);
      if (result.success && result.clientId) {
        toast({
          title: "Conversion Successful",
          description: `${lead.name} is now a client.`
        });
        router.push(`/clients/${result.clientId}`);
      } else {
        toast({
          title: "Conversion Failed",
          description: result.message || "Could not convert lead to client.",
          variant: "destructive",
        });
      }
    });
  };
  
  const handleDropLead = (values: DropLeadFormValues) => {
    if (!lead) return;
    startDropTransition(async () => {
        const result = await dropLead(lead.id, values.dropReason, values.dropComment);
        if (result.success) {
            toast({
                title: "Lead Dropped",
                description: `${lead.name} has been moved to the dropped leads list.`
            });
            router.push('/dropped-leads-list');
        } else {
            toast({
                title: "Drop Failed",
                description: result.message || "Could not drop lead.",
                variant: "destructive",
            });
            setIsDropDialogOpen(false);
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
            <AlertDialog open={isDropDialogOpen} onOpenChange={setIsDropDialogOpen}>
                <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="sm" disabled={isDropping}><Trash2 className="mr-2 h-4 w-4" /> Drop lead</Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                    <Form {...dropForm}>
                        <form onSubmit={dropForm.handleSubmit(handleDropLead)}>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Drop Lead: {lead.name}?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    Select a reason for dropping this lead. This action will move the lead to the dropped list and cannot be undone directly.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <div className="py-4 space-y-4">
                                <FormField control={dropForm.control} name="dropReason"
                                    render={({ field }) => (
                                        <FormItem>
                                            <Label>Reason *</Label>
                                            <Select onValueChange={field.onChange} value={field.value}>
                                                <FormControl>
                                                    <SelectTrigger><SelectValue placeholder="Select a drop reason" /></SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    {DROP_REASON_OPTIONS.map(reason => <SelectItem key={reason} value={reason}>{reason}</SelectItem>)}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField control={dropForm.control} name="dropComment"
                                    render={({ field }) => (
                                        <FormItem>
                                            <Label>Comment (Optional)</Label>
                                            <FormControl><Textarea placeholder="Add an optional comment..." {...field} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                            <AlertDialogFooter>
                                <AlertDialogCancel disabled={isDropping}>Cancel</AlertDialogCancel>
                                <Button type="submit" variant="destructive" disabled={isDropping}>
                                    {isDropping && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                                    Confirm Drop
                                </Button>
                            </AlertDialogFooter>
                        </form>
                    </Form>
                </AlertDialogContent>
            </AlertDialog>
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
                      {leadStatuses.map(stage => <SelectItem key={stage.id} value={stage.name} className="text-xs">{stage.name}</SelectItem>)}
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
                <Button asChild variant="ghost" size="icon" className="text-muted-foreground hover:text-primary" disabled={!lead.phone}>
                  <a href={lead.phone ? `tel:${lead.phone}` : undefined}><Phone className="h-5 w-5" /></a>
                </Button>
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
                  <Input id="leadSource" value={lead.source || 'N/A'} disabled className="h-8 text-xs" />
                </div>
                <div>
                  <Label className="text-xs">Address</Label>
                  <p className="text-sm bg-muted p-2 rounded-md min-h-[40px]">{lead.address || 'Not specified'}</p>
                </div>
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
                    defaultValue={lead.kilowatt ?? ''}
                    onBlur={(e) => handleAttributeChange('kilowatt', parseFloat(e.target.value) || 0)}
                    className="h-8 text-xs"
                    disabled={isUpdating}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-md">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button className="w-full bg-green-600 hover:bg-green-700" size="sm" disabled={isUpdating}>
                      <Repeat className="mr-2 h-4 w-4" /> Convert to Client
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Convert Lead to Client?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will convert "{lead.name}" into a client, moving them and their activity history to the Clients section. This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleConvertToClient} disabled={isUpdating}>
                        {isUpdating ? "Converting..." : "Yes, Convert"}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
                <Button className="w-full" variant="outline" size="sm" onClick={handleCreateNewProposal}><FileText className="mr-2 h-4 w-4" /> Create Proposal</Button>
                <Button className="w-full" variant="outline" size="sm" disabled><ShoppingCart className="mr-2 h-4 w-4" /> Create Purchase Order</Button>
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
                    <Select value={activityLeadStage} onValueChange={(val) => setActivityLeadStage(val as LeadStatusType)}><SelectTrigger id="activityLeadStage"><SelectValue placeholder="Select stage" /></SelectTrigger><SelectContent>{leadStatuses.map(stage => <SelectItem key={stage.id} value={stage.name}>{stage.name}</SelectItem>)}</SelectContent></Select>
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
                            <Select value={taskForUser} onValueChange={(val) => setTaskForUser(val)}><SelectTrigger id="taskForUser"><SelectValue placeholder="Select user" /></SelectTrigger><SelectContent>{users.map(user => <SelectItem key={user.id} value={user.name}>{user.name}</SelectItem>)}</SelectContent></Select>
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
              <CardHeader><CardTitle>Activity History ({lead.followupCount || 0})</CardTitle></CardHeader>
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
                              <Badge variant="secondary" className="capitalize bg-blue-100 text-blue-800 border-transparent hover:bg-blue-200">
                                 {activity.type}
                              </Badge>
                              {activity.leadStageAtTimeOfFollowUp && (
                                <Badge variant="outline" className="capitalize bg-slate-800 text-white border-transparent hover:bg-slate-700">{activity.leadStageAtTimeOfFollowUp}</Badge>
                              )}
                              {activity.followupOrTask === 'Task' ? (
                                <Badge className="bg-green-600 text-white border-transparent hover:bg-green-700">
                                  Task For: {activity.taskForUser} Due: {activity.taskDate ? format(parseISO(activity.taskDate), 'dd-MM-yyyy') : ''} {activity.taskTime || ''}
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
                      onValueChange={(value) => handleAttributeChange('assignedTo', value)}
                      disabled={isUpdating}
                    >
                      <SelectTrigger className="h-9 text-sm flex-grow">
                        <SelectValue placeholder="Unassigned" />
                      </SelectTrigger>
                      <SelectContent>{users.map(user => <SelectItem key={user.id} value={user.name}>{user.name}</SelectItem>)}</SelectContent>
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
              <CardHeader><CardTitle>Proposal History ({proposals.length})</CardTitle></CardHeader>
              <CardContent>
                {proposals.length > 0 ? (
                  <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                    {proposals.map(proposal => (
                      <div key={proposal.id} onClick={() => { setSelectedProposalForPreview(proposal); setIsPreviewOpen(true); }} className="flex items-center justify-between p-3 border rounded-md cursor-pointer hover:bg-muted/50">
                        <div className="flex items-center gap-3">
                          <FileText className="h-5 w-5 text-muted-foreground" />
                          <div>
                            <p className="font-semibold text-sm">{proposal.proposalNumber}</p>
                            <p className="text-xs text-muted-foreground">Capacity: {proposal.capacity} kW</p>
                          </div>
                        </div>
                        <div className="text-right">
                           <p className="font-semibold text-sm flex items-center"><IndianRupee className="h-4 w-4 mr-0.5" />{proposal.finalAmount.toLocaleString('en-IN')}</p>
                           <p className="text-xs text-muted-foreground">{format(parseISO(proposal.proposalDate), 'dd MMM yyyy')}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                   <p className="text-sm text-center text-muted-foreground py-6">No proposals created for this lead yet.</p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      {isEditFormOpen && lead && (<LeadForm isOpen={isEditFormOpen} onClose={() => setIsEditFormOpen(false)} onSubmit={handleEditFormSubmit} lead={lead} users={users} statuses={leadStatuses} sources={leadSources} />)}
      {isProposalFormOpen && lead && (
          <ProposalForm 
            isOpen={isProposalFormOpen} 
            onClose={() => { setIsProposalFormOpen(false); setSelectedTemplateId(null); }} 
            onSubmit={handleProposalSubmit} 
            clients={[]} 
            leads={[lead]}
            templateId={selectedTemplateId} 
          />
      )}
      <TemplateSelectionDialog
        isOpen={isTemplateDialogOpen}
        onClose={() => setIsTemplateDialogOpen(false)}
        onSelect={handleTemplateSelected}
      />
      {isPreviewOpen && selectedProposalForPreview && (
        <ProposalPreviewDialog
          isOpen={isPreviewOpen}
          onClose={() => setIsPreviewOpen(false)}
          pdfUrl={selectedProposalForPreview.pdfUrl || null}
          docxUrl={selectedProposalForPreview.docxUrl || null}
        />
      )}
    </div>
  );
}
