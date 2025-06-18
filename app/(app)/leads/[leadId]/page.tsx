
'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
// PageHeader is not used here as the layout for /leads/[leadId] handles its own header structure
import { MOCK_LEADS, USER_OPTIONS, LEAD_SOURCE_OPTIONS, LEAD_STATUS_OPTIONS, LEAD_PRIORITY_OPTIONS, FOLLOW_UP_TYPES, FOLLOW_UP_STATUSES, CLIENT_TYPES } from '@/lib/constants';
import type { Lead, UserOptionType, LeadSourceOptionType, LeadStatusType, LeadPriorityType, ClientType } from '@/types';
import { format, parseISO, isValid } from 'date-fns';
import { ChevronLeft, ChevronRight, Edit, Phone, MessageSquare, Mail, MessageCircle, Clock, UserCircle2, FileText, ShoppingCart } from 'lucide-react';
import { ProposalForm } from '@/app/(app)/proposals/proposal-form';
import { DocumentCreationDialog } from '@/app/(app)/documents/document-creation-dialog';
import { useToast } from '@/hooks/use-toast';

export default function LeadDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const leadId = typeof params.leadId === 'string' ? params.leadId : null;
  const { toast } = useToast();
  const [lead, setLead] = useState<Lead | null | undefined>(undefined); 

  const [isProposalFormOpen, setIsProposalFormOpen] = useState(false);
  const [isDocumentDialogOpen, setIsDocumentDialogOpen] = useState(false);
  const [documentTypeToCreate, setDocumentTypeToCreate] = useState<'Purchase Order' | null>(null);


  const [followUpType, setFollowUpType] = useState<string>(FOLLOW_UP_TYPES[0]);
  const [followUpDate, setFollowUpDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [followUpTime, setFollowUpTime] = useState<string>(format(new Date(), 'HH:mm'));
  const [followUpStatus, setFollowUpStatus] = useState<string>(FOLLOW_UP_STATUSES[0]);
  const [followUpPriority, setFollowUpPriority] = useState<LeadPriorityType | undefined>(LEAD_PRIORITY_OPTIONS[1]); 
  const [followUpLeadStage, setFollowUpLeadStage] = useState<LeadStatusType | undefined>();
  const [followUpComment, setFollowUpComment] = useState('');

  const [taskForUser, setTaskForUser] = useState<UserOptionType | undefined>(USER_OPTIONS[0]);
  const [taskDate, setTaskDate] = useState('');
  const [taskTime, setTaskTime] = useState('');


  useEffect(() => {
    if (leadId) {
      const foundLead = MOCK_LEADS.find(l => l.id === leadId);
      setLead(foundLead || null);
      if (foundLead) {
        setFollowUpLeadStage(foundLead.status);
        setFollowUpPriority(foundLead.priority || LEAD_PRIORITY_OPTIONS[1]);
      }
    } else {
      setLead(null); // Explicitly set to null if leadId is not found/valid
    }
  }, [leadId]);

  const handleSaveFollowUp = () => {
    console.log({
      leadId,
      followUpType,
      followUpDate,
      followUpTime,
      followUpStatus,
      followUpPriority,
      followUpLeadStage,
      followUpComment
    });
    toast({title: "Follow-up Saved", description: "Follow-up details logged to console."})
  };

  const handleSaveTask = () => {
    console.log({
      leadId,
      taskForUser,
      taskDate,
      taskTime,
    });
    toast({title: "Task Saved", description: "Task details logged to console."})
  };

  const handleOpenProposalForm = () => setIsProposalFormOpen(true);
  const handleProposalFormSubmit = (proposalData: any) => {
    console.log("Proposal Data Submitted from Lead Detail:", proposalData);
    toast({ title: "Proposal Creation Initiated", description: `Proposal for ${lead?.name} (Lead ID: ${lead?.id}) is being processed.`});
    setIsProposalFormOpen(false);
    // Here you would typically call an action to save the proposal
    // For now, we just log and show a toast
  };

  const handleOpenPurchaseOrderDialog = () => {
    setDocumentTypeToCreate('Purchase Order');
    setIsDocumentDialogOpen(true);
  };
  
  const handleCloseDocumentDialog = () => {
    setIsDocumentDialogOpen(false);
    setDocumentTypeToCreate(null);
  };


  if (lead === undefined) {
    // Basic loading state, replace with PageHeader if it fits layout better
    return <div className="flex justify-center items-center h-full"><p>Loading Lead Details...</p></div>;
  }

  if (lead === null) {
    // Basic not found state
    return <div className="flex flex-col justify-center items-center h-full"><UserCircle2 className="h-12 w-12 mb-4 text-muted-foreground"/><p className="text-xl">Lead Not Found</p><p className="text-muted-foreground">The lead you are looking for does not exist or could not be loaded.</p></div>;
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
          <Button variant="outline" size="sm" onClick={() => router.push('/leads/current')}>
            <ChevronLeft className="h-4 w-4 mr-1" /> Back to list
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
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => router.push(`/leads/edit/${lead.id}`)} disabled> 
                  <Edit className="h-4 w-4" />
                </Button>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-xl font-bold text-primary">{lead.name}</p>
                <p className="text-sm text-muted-foreground">{lead.phone || 'No phone number'}</p>
                <p className="text-xs text-muted-foreground">Created: {creationDateTime}</p>
                <div className="mt-2">
                  <p className="text-xs font-medium">Next follow-up:</p>
                  <p className="text-sm">{nextFollowUpDisplay}</p>
                </div>
                <div className="mt-2 flex flex-wrap gap-1">
                  <Badge variant="secondary" className="capitalize">{lead.status || 'N/A'}</Badge>
                  {lead.priority && <Badge variant={lead.priority === 'High' ? 'destructive' : 'outline'} className="capitalize">{lead.priority}</Badge>}
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
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-md">Lead Attributes</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <Label htmlFor="kilowatt" className="text-xs">Kilowatt</Label>
                  <Input id="kilowatt" value={lead.kilowatt || 0} readOnly className="h-8 text-xs bg-muted"/>
                </div>
                <div>
                  <Label htmlFor="customerType" className="text-xs">Customer Type</Label>
                  <Select value={lead.clientType || undefined} disabled>
                    <SelectTrigger id="customerType" className="h-8 text-xs bg-muted">
                      <SelectValue placeholder="N/A" />
                    </SelectTrigger>
                    <SelectContent>
                      {CLIENT_TYPES.map(type => <SelectItem key={type} value={type} className="text-xs">{type}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                 <div>
                  <Label htmlFor="entityType" className="text-xs">Type</Label>
                  <Select value="Lead" disabled>
                    <SelectTrigger id="entityType" className="h-8 text-xs bg-muted">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Lead" className="text-xs">Lead</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-md">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button onClick={handleOpenProposalForm} className="w-full" size="sm">
                  <FileText className="mr-2 h-4 w-4" /> Create Proposal
                </Button>
                <Button onClick={handleOpenPurchaseOrderDialog} className="w-full" variant="outline" size="sm">
                  <ShoppingCart className="mr-2 h-4 w-4" /> Create Purchase Order
                </Button>
              </CardContent>
            </Card>


          </div>

          <div className="lg:col-span-6 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>New Follow-up</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
                  <div className="sm:col-span-1">
                    <Label htmlFor="followUpType">Type</Label>
                    <Select value={followUpType} onValueChange={setFollowUpType}>
                      <SelectTrigger id="followUpType"><SelectValue /></SelectTrigger>
                      <SelectContent>{FOLLOW_UP_TYPES.map(type => <SelectItem key={type} value={type}>{type}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="sm:col-span-1">
                    <Label htmlFor="followUpDate">Date</Label>
                    <Input type="date" id="followUpDate" value={followUpDate} onChange={e => setFollowUpDate(e.target.value)} />
                  </div>
                   <div className="sm:col-span-1">
                    <Label htmlFor="followUpTime">Time</Label>
                    <Input type="time" id="followUpTime" value={followUpTime} onChange={e => setFollowUpTime(e.target.value)} />
                  </div>
                </div>
                <RadioGroup value={followUpStatus} onValueChange={setFollowUpStatus} className="flex flex-wrap gap-x-4 gap-y-2">
                    {FOLLOW_UP_STATUSES.map(status => (
                        <div key={status} className="flex items-center space-x-2">
                            <RadioGroupItem value={status} id={`followup-status-${status}`} />
                            <Label htmlFor={`followup-status-${status}`} className="text-sm font-normal">{status}</Label>
                        </div>
                    ))}
                </RadioGroup>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="followUpPriority">Priority</Label>
                    <Select value={followUpPriority} onValueChange={(val) => setFollowUpPriority(val as LeadPriorityType)}>
                      <SelectTrigger id="followUpPriority"><SelectValue placeholder="Select priority" /></SelectTrigger>
                      <SelectContent>{LEAD_PRIORITY_OPTIONS.map(prio => <SelectItem key={prio} value={prio}>{prio}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="followUpLeadStage">Lead Stage</Label>
                    <Select value={followUpLeadStage} onValueChange={(val) => setFollowUpLeadStage(val as LeadStatusType)}>
                      <SelectTrigger id="followUpLeadStage"><SelectValue placeholder="Select stage" /></SelectTrigger>
                      <SelectContent>{LEAD_STATUS_OPTIONS.map(stage => <SelectItem key={stage} value={stage}>{stage}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label htmlFor="followUpComment">Follow-up Comment</Label>
                  <Textarea id="followUpComment" placeholder="Enter comment..." value={followUpComment} onChange={e => setFollowUpComment(e.target.value)} />
                </div>
                 <Button onClick={handleSaveFollowUp} className="w-full">Save Follow-up</Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Schedule New Task</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                 <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
                    <div>
                        <Label htmlFor="taskForUser">Task for</Label>
                        <Select value={taskForUser} onValueChange={(val) => setTaskForUser(val as UserOptionType)}>
                        <SelectTrigger id="taskForUser"><SelectValue placeholder="Select user" /></SelectTrigger>
                        <SelectContent>{USER_OPTIONS.map(user => <SelectItem key={user} value={user}>{user}</SelectItem>)}</SelectContent>
                        </Select>
                    </div>
                    <div>
                        <Label htmlFor="taskDate">Task Date</Label>
                        <Input type="date" id="taskDate" value={taskDate} onChange={e => setTaskDate(e.target.value)}/>
                    </div>
                     <div>
                        <Label htmlFor="taskTime">Task Time</Label>
                        <Input type="time" id="taskTime" value={taskTime} onChange={e => setTaskTime(e.target.value)}/>
                    </div>
                 </div>
                 <Button onClick={handleSaveTask} className="w-full">Save Task</Button>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>All Follow-ups (0)</CardTitle> 
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">No follow-up history yet.</p>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-3 space-y-6">
            <Card>
              <CardContent className="pt-6 space-y-1">
                <div className="flex items-center gap-2">
                   <Avatar className="h-8 w-8">
                    <AvatarImage src={`https://placehold.co/40x40.png?text=${lead.assignedTo?.charAt(0) || 'U'}`} data-ai-hint="user avatar" />
                    <AvatarFallback>{lead.assignedTo?.charAt(0) || 'U'}</AvatarFallback>
                  </Avatar>
                  <Select value={lead.assignedTo || undefined} disabled>
                    <SelectTrigger className="h-9 text-sm flex-grow"><SelectValue placeholder="Unassigned" /></SelectTrigger>
                    <SelectContent>{USER_OPTIONS.map(user => <SelectItem key={user} value={user} className="text-sm">{user}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <p className="text-xs text-muted-foreground ml-10">Assigned to</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 space-y-1">
                 <div className="flex items-center gap-2">
                   <Avatar className="h-8 w-8">
                    <AvatarImage src={`https://placehold.co/40x40.png?text=${lead.createdBy?.charAt(0) || 'S'}`} data-ai-hint="user avatar"/>
                    <AvatarFallback>{lead.createdBy?.charAt(0) || 'S'}</AvatarFallback>
                  </Avatar>
                  <p className="text-sm font-medium flex-grow bg-muted px-3 py-2 rounded-md h-9 flex items-center">{lead.createdBy || 'System'}</p>
                </div>
                <p className="text-xs text-muted-foreground ml-10">Created by</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2 pt-4">
                <CardTitle className="text-md">Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea placeholder="Add notes here..." className="min-h-[100px] bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800" />
              </CardContent>
            </Card>
            <Card>
                <CardHeader className="pb-2 pt-4">
                    <CardTitle className="text-md">Associated Contacts</CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                    <p className="text-4xl font-bold text-primary">0</p>
                </CardContent>
            </Card>
          </div>
        </div>
      </div>
      {isProposalFormOpen && lead && (
        <ProposalForm
          isOpen={isProposalFormOpen}
          onClose={() => setIsProposalFormOpen(false)}
          onSubmit={handleProposalFormSubmit}
          initialData={{
            clientId: lead.id,
            name: lead.name,
            clientType: lead.clientType || CLIENT_TYPES[0] 
          }}
        />
      )}
      {isDocumentDialogOpen && documentTypeToCreate === 'Purchase Order' && lead && (
        <DocumentCreationDialog
          isOpen={isDocumentDialogOpen}
          onClose={handleCloseDocumentDialog}
          documentType="Purchase Order" 
        />
      )}
    </div>
  );
}
