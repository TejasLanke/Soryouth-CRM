
import type { NavItem, Lead, Proposal, Document, Communication, DocumentType, ClientType, ModuleType, DCRStatus, ModuleWattage, LeadStatusType, LeadPriorityType, LeadSourceOptionType, UserOptionType, DropReasonType } from '@/types';
import {
  LayoutDashboard,
  UsersRound,
  FileText,
  Files,
  MessageSquareText,
  WandSparkles,
  TerminalSquare,
  CheckSquare,
  Award,
  Edit,
  Eye,
  FileSignature,
  Briefcase, // For Clients
  UserX,     // For Dropped Leads
  Rows,      // For Batch Proposals
  CalendarDays, // For Calendar
} from 'lucide-react';
import { format, parseISO, addDays, subDays } from 'date-fns';

export const APP_NAME = "Soryouth";

// Primary CRM Navigation for the main sidebar
export const NAV_ITEMS: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/leads', label: 'Leads', icon: UsersRound },
  { href: '/proposals', label: 'Clients', icon: Briefcase },
  { href: '/communications', label: 'Communications', icon: MessageSquareText },
  { href: '/calendar', label: 'Calendar', icon: CalendarDays },
  { href: '/leads/dropped', label: 'Dropped Leads', icon: UserX },
];

// Secondary Navigation for tools/other sections, in user profile dropdown
export const TOOLS_NAV_ITEMS: NavItem[] = [
  { href: '/proposals/batch', label: 'Batch Proposals', icon: Rows },
  { href: '/documents', label: 'Documents', icon: Files },
  { href: '/document-customizer', label: 'AI Document Customizer', icon: WandSparkles },
  { href: '/automation', label: 'Automation Scripts', icon: TerminalSquare },
];

// Customizable Lead Statuses - reflects stages in the image
export const LEAD_STATUS_OPTIONS = ['fresher', 'Requirement', 'site visit', 'Quotation send', 'Followup', 'Deal Done', 'installer', 'ON HOLD', 'Lost', 'New'] as const;

export const LEAD_PRIORITY_OPTIONS = ['High', 'Medium', 'Low'] as const;

// Made LEAD_SOURCE_OPTIONS an array of strings for easier management via settings dialog
export const LEAD_SOURCE_OPTIONS = ['Facebook', 'Website', 'Referral', 'Cold Call', 'Walk-in', 'Other'] as const;

export const USER_OPTIONS = ['Mayur', 'Sales Rep A', 'Sales Rep B', 'Admin', 'System', 'Kanchan Nikam'] as const;

export const DROP_REASON_OPTIONS = [
    'Duplicate lead', 'Fake Lead', 'Not Feasible', 'Not Interested', 
    'Requirement fullfilled', 'below 3kw', 'out of coverage area', 
    'out of maharashtra', 'price issue', 'want in balcony', 'Other'
] as const;


export const MOCK_LEADS: Lead[] = [
  { 
    id: 'lead1', name: 'Pramod Agrawal', email: 'pramod.agrawal@example.com', phone: '6263537508', 
    status: 'fresher', source: 'Facebook', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    lastCommentText: 'lb 8000/-', lastCommentDate: format(subDays(new Date(), 2), 'dd-MM-yyyy'), 
    kilowatt: 0, nextFollowUpDate: format(addDays(new Date(), 5), 'yyyy-MM-dd'), nextFollowUpTime: '10:00',
    address: '123 Main St, Nagpur', priority: 'High', assignedTo: 'Mayur'
  },
  { 
    id: 'lead2', name: 'sir (Jane Smith)', email: 'jane.smith.lead@example.com', phone: '7001173134', 
    status: 'fresher', source: 'Facebook', assignedTo: 'Sales Rep A', 
    createdAt: new Date(Date.now() - 86400000).toISOString(), updatedAt: new Date().toISOString(),
    lastCommentText: 'Not answering', lastCommentDate: format(subDays(new Date(), 1), 'dd-MM-yyyy'), 
    kilowatt: 0, nextFollowUpDate: format(addDays(new Date(), 7), 'yyyy-MM-dd'), nextFollowUpTime: '14:30',
    address: '456 Oak Ave, Mumbai', priority: 'Medium'
  },
  { 
    id: 'lead3', name: 'Namdeorao Dhote', phone: '7498437694', 
    status: 'fresher', source: 'Facebook', 
    createdAt: new Date(Date.now() - 172800000).toISOString(), updatedAt: new Date().toISOString(),
    lastCommentText: 'kusum solar ka lagana hai...', lastCommentDate: format(new Date(), 'dd-MM-yyyy'), 
    kilowatt: 0, nextFollowUpDate: format(addDays(new Date(), 3), 'yyyy-MM-dd'),
    address: '789 Pine Rd, Pune', priority: 'Low', assignedTo: 'Sales Rep B'
  },
  { 
    id: 'lead4', name: 'Lost Cause Ltd', email: 'lost.cause@example.com', phone: '555-0000', 
    status: 'Lost', source: 'Other', dropReason: 'Not Interested',
    createdAt: new Date(Date.now() - 259200000).toISOString(), updatedAt: new Date(Date.now() - 86400000).toISOString(),
    lastCommentText: 'No interest.', lastCommentDate: format(subDays(new Date(), 30), 'dd-MM-yyyy'),
    kilowatt: 0, assignedTo: 'System'
  },
  { 
    id: 'lead5', name: 'Sunshine Apartments', email: 'sunshine@example.com', phone: '555-1111', 
    status: 'Requirement', source: 'Referral', assignedTo: 'Mayur', 
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString(), updatedAt: new Date().toISOString(),
    lastCommentText: 'Needs 50kW system. Site visit scheduled.', lastCommentDate: format(subDays(new Date(), 3), 'dd-MM-yyyy'),
    kilowatt: 50, nextFollowUpDate: format(addDays(new Date(), 2), 'yyyy-MM-dd'), nextFollowUpTime: '11:00',
    address: 'Apt 101, Sunshine Complex, Nagpur', priority: 'High'
  },
  {
    id: 'lead6', name: 'Tech Solutions Inc.', email: 'tech@example.com', phone: '555-2222',
    status: 'Quotation send', source: 'Website', assignedTo: 'Sales Rep A',
    createdAt: new Date(Date.now() - 86400000 * 10).toISOString(), updatedAt: new Date().toISOString(),
    lastCommentText: 'Quotation sent for 25kW.', lastCommentDate: format(subDays(new Date(), 1), 'dd-MM-yyyy'),
    kilowatt: 25, nextFollowUpDate: format(addDays(new Date(), 10), 'yyyy-MM-dd'),
    address: 'Plot 42, Industrial Area, Hingna', priority: 'Medium'
  },
   {
    id: 'lead7', name: 'Green Pastures Farm', phone: '555-3333',
    status: 'site visit', source: 'Walk-in',
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(), updatedAt: new Date().toISOString(),
    lastCommentText: 'Site visit completed. Positive feedback.', lastCommentDate: format(new Date(), 'dd-MM-yyyy'),
    kilowatt: 15, nextFollowUpDate: format(addDays(new Date(), 4), 'yyyy-MM-dd'),
    address: 'Rural Route 5, Near Village X', priority: 'Medium', assignedTo: 'Sales Rep B'
  },
  { 
    id: 'lead8', name: 'sir (Dropped Example)', phone: '7796226623', 
    status: 'Lost', source: 'Facebook', dropReason: 'Not Feasible', assignedTo: 'Kanchan Nikam', 
    createdAt: '2025-06-12T05:53:00.000Z', // Example past date
    updatedAt: '2025-06-12T05:53:00.000Z', // Drop date
    lastCommentText: 'Client found cheaper alternative.', lastCommentDate: format(parseISO('2025-06-12T05:53:00.000Z'), 'dd-MM-yyyy'), 
    kilowatt: 0, address: '1 Info Park, Test City', priority: 'Medium'
  },
   { 
    id: 'lead9', name: 'Ajaz Ahmad', phone: '8400005785', 
    status: 'Lost', source: 'Referral', dropReason: 'out of maharashtra', assignedTo: 'Kanchan Nikam', 
    createdAt: '2025-06-11T06:44:00.000Z', // Example past date
    updatedAt: '2025-06-11T06:44:00.000Z', // Drop date
    lastCommentText: 'Client relocating.', lastCommentDate: format(parseISO('2025-06-11T06:44:00.000Z'), 'dd-MM-yyyy'), 
    kilowatt: 0, address: '2 Tech Towers, Test City', priority: 'Low'
  },
  { 
    id: 'lead10', name: 'Fake Client Co.', phone: '9930637381', 
    status: 'Lost', source: 'Other', dropReason: 'Fake Lead', assignedTo: 'Kanchan Nikam', 
    createdAt: '2025-06-12T05:35:00.000Z', // Example past date
    updatedAt: '2025-06-12T05:35:00.000Z', // Drop date
    lastCommentText: 'Invalid contact details provided.', lastCommentDate: format(parseISO('2025-06-12T05:35:00.000Z'), 'dd-MM-yyyy'), 
    kilowatt: 0, address: 'N/A', priority: 'Low'
  }
];

export const CLIENT_TYPES: ClientType[] = ['Individual/Bungalow', 'Housing Society', 'Commercial', 'Industrial'];
export const MODULE_TYPES: ModuleType[] = ['Mono PERC', 'TOPCon'];
export const DCR_STATUSES: DCRStatus[] = ['DCR', 'Non-DCR'];
export const MODULE_WATTAGE_OPTIONS: ModuleWattage[] = ["540", "545", "550", "585", "590"];

const calculateFinancialsAndSubsidy = (ratePerWatt: number, capacity: number, clientType: ClientType): Pick<Proposal, 'baseAmount' | 'cgstAmount' | 'sgstAmount' | 'subtotalAmount' | 'finalAmount' | 'subsidyAmount'> => {
  const baseAmount = ratePerWatt * capacity * 1000;
  const cgstAmount = baseAmount * 0.069;
  const sgstAmount = baseAmount * 0.069;
  const subtotalAmount = baseAmount + cgstAmount + sgstAmount;
  const finalAmountPreSubsidy = subtotalAmount;

  let subsidyAmount = 0;
  if (clientType === 'Housing Society') {
    subsidyAmount = 18000 * capacity;
  } else if (clientType === 'Individual/Bungalow') {
    if (capacity === 1) subsidyAmount = 30000;
    else if (capacity === 2) subsidyAmount = 60000;
    else if (capacity >= 3) subsidyAmount = 78000;
    else subsidyAmount = 0;
  }
  return { baseAmount, cgstAmount, sgstAmount, subtotalAmount, finalAmount: finalAmountPreSubsidy, subsidyAmount };
};

export const MOCK_PROPOSALS: Proposal[] = [
  {
    id: 'prop1', proposalNumber: 'P-2024-001', clientId: 'client1', name: 'Green Valley Society', clientType: 'Housing Society', contactPerson: 'Mr. Sharma', location: 'Pune, MH', capacity: 50, moduleType: 'Mono PERC', moduleWattage: '545', dcrStatus: 'DCR', inverterRating: 50, inverterQty: 2, ratePerWatt: 40, proposalDate: format(new Date(Date.now() - 86400000 * 7), 'yyyy-MM-dd'), ...calculateFinancialsAndSubsidy(40, 50, 'Housing Society'), createdAt: new Date(Date.now() - 86400000 * 7).toISOString(), updatedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: 'prop2', proposalNumber: 'P-2024-002', clientId: 'client2', name: 'Mr. Anil Patel (Bungalow)', clientType: 'Individual/Bungalow', contactPerson: 'Mr. Anil Patel', location: 'Mumbai, MH', capacity: 10, moduleType: 'TOPCon', moduleWattage: '585', dcrStatus: 'Non-DCR', inverterRating: 10, inverterQty: 1, ratePerWatt: 45, proposalDate: format(new Date(Date.now() - 86400000 * 12), 'yyyy-MM-dd'), ...calculateFinancialsAndSubsidy(45, 10, 'Individual/Bungalow'), createdAt: new Date(Date.now() - 86400000 * 12).toISOString(), updatedAt: new Date(Date.now() - 86400000 * 1).toISOString(),
  },
];

export const DOCUMENT_TYPES_CONFIG: Array<{ type: DocumentType; icon: React.ComponentType<{ className?: string }>; description: string }> = [
  { type: 'Work Completion Report', icon: CheckSquare, description: 'Reports confirming project completion.' }, { type: 'Purchase Order', icon: FileText, description: 'Purchase orders for goods or services.' }, { type: 'Annexure I', icon: FileSignature, description: 'Annexure I documents for compliance.' }, { type: 'DCR Declaration', icon: Edit, description: 'Declarations related to domestic content requirement.' }, { type: 'Net Metering Agreement', icon: Eye, description: 'Agreements for net metering services.' }, { type: 'Warranty Certificate', icon: Award, description: 'Certificates for product/service warranties.' },
];

export const MOCK_DOCUMENTS: Document[] = [
  { id: 'd1', title: 'Work Completion for Project Sunbeam', type: 'Work Completion Report', relatedLeadId: 'lead2', createdAt: new Date().toISOString(), relatedProposalId: 'prop2' }, { id: 'd2', title: 'Purchase Order PO-2024-050', type: 'Purchase Order', relatedLeadId: 'lead1', createdAt: new Date(Date.now() - 172800000).toISOString() },
];

export const MOCK_COMMUNICATIONS: Communication[] = [
    { id: 'c1', leadId: 'lead1', type: 'Email', subject: 'Introductory Email', content: 'Sent initial contact email.', direction: 'Outgoing', timestamp: new Date(Date.now() - 86400000 * 2).toISOString(), recordedBy: 'System' }, { id: 'c2', leadId: 'lead1', type: 'Call', content: 'Follow-up call regarding their solar needs. They are interested.', direction: 'Outgoing', timestamp: new Date(Date.now() - 86400000).toISOString(), recordedBy: 'Sales Rep A' },
];
