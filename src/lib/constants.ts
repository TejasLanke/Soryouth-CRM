
import type { NavItem, Lead, Proposal, Document, Communication, DocumentType, ClientType, ModuleType, DCRStatus, ModuleWattage, LeadStatusType, LeadPriorityType, LeadSourceOptionType, UserOptionType, DropReasonType, Expense, ExpenseCategory } from '@/types';
import {
  LayoutDashboard,
  UsersRound,
  FileText, // Used for Proposals link
  Files,
  MessageSquareText,
  WandSparkles,
  TerminalSquare,
  CheckSquare,
  Award,
  Edit,
  Eye,
  FileSignature,
  Briefcase, // Used for Clients link
  UserX,
  Rows,
  CalendarDays,
  ListChecks,
  UserCheck,
  Receipt,
} from 'lucide-react';
import { format, parseISO, addDays, subDays } from 'date-fns';

export const APP_NAME = "Soryouth";

// Primary CRM Navigation for the main sidebar
export const NAV_ITEMS: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/leads/current', label: 'Summary', icon: UsersRound },
  { href: '/proposals', label: 'Proposals', icon: FileText },
  { href: '/clients', label: 'Clients', icon: Briefcase },
  { href: '/communications', label: 'Communications', icon: MessageSquareText },
  { href: '/calendar', label: 'Calendar', icon: CalendarDays },
];

// Secondary Navigation for tools/other sections, in user profile dropdown
export const TOOLS_NAV_ITEMS: NavItem[] = [
  { href: '/proposals/batch', label: 'Batch Proposals', icon: Rows },
  { href: '/documents', label: 'Documents', icon: Files },
  { href: '/document-customizer', label: 'AI Document Customizer', icon: WandSparkles },
  { href: '/automation', label: 'Automation Scripts', icon: TerminalSquare },
  { href: '/expenses', label: 'Expenses', icon: Receipt },
];

export const CLIENT_TYPES = ['Individual/Bungalow', 'Housing Society', 'Commercial', 'Industrial', 'Other'] as const;
export const LEAD_STATUS_OPTIONS = ['fresher', 'Requirement', 'site visit', 'Quotation send', 'Followup', 'Deal Done', 'installer', 'ON HOLD', 'Lost', 'New'] as const;
export const LEAD_PRIORITY_OPTIONS = ['High', 'Medium', 'Low', 'Average'] as const;
export const LEAD_SOURCE_OPTIONS = ['Facebook', 'Website', 'Referral', 'Cold Call', 'Walk-in', 'Other', 'OWN Reference'] as const;
export const USER_OPTIONS = ['Mayur', 'Sales Rep A', 'Sales Rep B', 'Admin', 'System', 'Kanchan Nikam', 'tejas', 'MAYUR', 'Prasad mudholkar', 'Ritesh'] as const;
export const DROP_REASON_OPTIONS = [
    'Duplicate lead', 'Fake Lead', 'Not Feasible', 'Not Interested',
    'Requirement fullfilled', 'below 3kw', 'out of coverage area',
    'out of maharashtra', 'price issue', 'want in balcony', 'Other'
] as const;

// Constants for Lead Detail Page
export const FOLLOW_UP_TYPES = ['Call', 'SMS', 'Email', 'Meeting', 'Visit'] as const;
export const FOLLOW_UP_STATUSES = ['Answered', 'No reply', 'Rejected', 'Not connected'] as const;


export const MOCK_LEADS: Lead[] = [
  {
    id: 'lead1', name: 'Pramod Agrawal', email: 'pramod.agrawal@example.com', phone: '6263537508',
    status: 'fresher', source: 'Facebook', createdAt: subDays(new Date(),5).toISOString(), updatedAt: new Date().toISOString(),
    lastCommentText: 'lb 8000/-', lastCommentDate: format(subDays(new Date(), 2), 'dd-MM-yyyy'),
    kilowatt: 10, clientType: 'Commercial', nextFollowUpDate: format(addDays(new Date(), 5), 'yyyy-MM-dd'), nextFollowUpTime: '10:00',
    address: '123 Main St, Nagpur', priority: 'High', assignedTo: 'Mayur', createdBy: 'Admin'
  },
  {
    id: 'lead2', name: 'sir (Jane Smith)', email: 'jane.smith.lead@example.com', phone: '7001173134',
    status: 'Deal Done', source: 'Facebook', assignedTo: 'Sales Rep A', createdBy: 'Mayur',
    createdAt: new Date(Date.now() - 86400000).toISOString(), updatedAt: new Date().toISOString(),
    lastCommentText: 'Not answering', lastCommentDate: format(subDays(new Date(), 1), 'dd-MM-yyyy'),
    kilowatt: 5, clientType: 'Individual/Bungalow', nextFollowUpDate: format(addDays(new Date(), 7), 'yyyy-MM-dd'), nextFollowUpTime: '14:30',
    address: '456 Oak Ave, Mumbai', priority: 'Medium'
  },
  {
    id: 'lead_sky_avenue', name: 'Sky avenue Manu Bhai', phone: '8355979653',
    status: 'ON HOLD', source: 'OWN Reference',
    createdAt: '2025-05-28T12:32:00.000Z',
    updatedAt: new Date().toISOString(),
    lastCommentText: 'Initial entry.', lastCommentDate: format(parseISO('2025-05-28T12:32:00.000Z'), 'dd-MM-yyyy'),
    kilowatt: 25, clientType: 'Housing Society',
    nextFollowUpDate: undefined,
    nextFollowUpTime: undefined,
    address: 'kalyan', priority: 'Average', assignedTo: 'Ritesh', createdBy: 'Ritesh'
  },
  {
    id: 'lead3', name: 'Namdeorao Dhote', phone: '7498437694',
    status: 'fresher', source: 'Facebook', createdBy: 'Kanchan Nikam',
    createdAt: new Date(Date.now() - 172800000).toISOString(), updatedAt: new Date().toISOString(),
    lastCommentText: 'kusum solar ka lagana hai...', lastCommentDate: format(new Date(), 'dd-MM-yyyy'),
    kilowatt: 3, clientType: 'Individual/Bungalow', nextFollowUpDate: format(addDays(new Date(), 3), 'yyyy-MM-dd'),
    address: '789 Pine Rd, Pune', priority: 'Low', assignedTo: 'Sales Rep B'
  },
  {
    id: 'lead4', name: 'Lost Cause Ltd', email: 'lost.cause@example.com', phone: '555-0000',
    status: 'Lost', source: 'Old Database', dropReason: 'Not Interested',
    createdAt: new Date(Date.now() - 259200000).toISOString(), updatedAt: new Date(Date.now() - 86400000).toISOString(),
    kilowatt: 0, clientType: 'Other', priority: 'Low', assignedTo: 'System', createdBy: 'System'
  },
   {
    id: 'client1', name: 'Green Valley Society', // Corresponds to proposal client
    status: 'Deal Done', clientType: 'Housing Society',
    createdAt: subDays(new Date(), 100).toISOString(), updatedAt: subDays(new Date(), 10).toISOString(),
  },
  {
    id: 'client2', name: 'Mr. Anil Patel (Bungalow)', // Corresponds to proposal client
    status: 'Deal Done', clientType: 'Individual/Bungalow',
    createdAt: subDays(new Date(), 120).toISOString(), updatedAt: subDays(new Date(), 5).toISOString(),
  },
  {
    id: 'client3', name: 'FutureTech Industries', // Corresponds to proposal client
    status: 'Deal Done', clientType: 'Commercial',
    createdAt: subDays(new Date(), 80).toISOString(), updatedAt: subDays(new Date(), 1).toISOString(),
  },
];

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
   {
    id: 'prop_lead11', proposalNumber: 'P-2024-011', clientId: 'lead11', name: 'Future Solar Systems', clientType: 'Commercial', contactPerson: 'Mr. Raj Verma', location: '100 Solar Drive, Tech Park, Pune', capacity: 100, moduleType: 'TOPCon', moduleWattage: '590', dcrStatus: 'Non-DCR', inverterRating: 100, inverterQty: 2, ratePerWatt: 37, proposalDate: format(subDays(new Date(), 20), 'yyyy-MM-dd'), ...calculateFinancialsAndSubsidy(37, 100, 'Commercial'), createdAt: subDays(new Date(), 20).toISOString(), updatedAt: subDays(new Date(), 3).toISOString(),
  },
  {
    id: 'prop_lead12', proposalNumber: 'P-2024-012', clientId: 'lead12', name: 'Rooftop Renewables Ltd.', clientType: 'Commercial', contactPerson: 'Ms. Anita Desai', location: '25 Green Avenue, Mumbai', capacity: 75, moduleType: 'Mono PERC', moduleWattage: '550', dcrStatus: 'Non-DCR', inverterRating: 75, inverterQty: 1, ratePerWatt: 39, proposalDate: format(subDays(new Date(), 45), 'yyyy-MM-dd'), ...calculateFinancialsAndSubsidy(39, 75, 'Commercial'), createdAt: subDays(new Date(), 45).toISOString(), updatedAt: subDays(new Date(), 6).toISOString(),
  },
  {
    id: 'prop_client3_new', proposalNumber: 'P-2024-015', clientId: 'client3', name: 'FutureTech Industries', clientType: 'Commercial', contactPerson: 'Ms. Priya Singh', location: 'Nagpur, MH', capacity: 150, moduleType: 'TOPCon', moduleWattage: '585', dcrStatus: 'Non-DCR', inverterRating: 150, inverterQty: 3, ratePerWatt: 36, proposalDate: format(subDays(new Date(), 2), 'yyyy-MM-dd'), ...calculateFinancialsAndSubsidy(36, 150, 'Commercial'), createdAt: subDays(new Date(), 2).toISOString(), updatedAt: new Date().toISOString(),
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

export const EXPENSE_CATEGORIES = ['Travel', 'Food', 'Supplies', 'Utilities', 'Software', 'Training', 'Marketing', 'Other'] as const;

export const MOCK_EXPENSES: Expense[] = [
  {
    id: 'exp1',
    userId: 'user123',
    userName: 'Mayur',
    date: format(subDays(new Date(), 5), 'yyyy-MM-dd'),
    category: 'Travel',
    amount: 1500,
    description: 'Client meeting in Pune - Fuel & Tolls',
    status: 'Approved',
    submittedAt: subDays(new Date(), 5).toISOString(),
    reviewedBy: 'Admin',
    reviewedAt: subDays(new Date(), 4).toISOString(),
  },
  {
    id: 'exp2',
    userId: 'user456',
    userName: 'Kanchan Nikam',
    date: format(subDays(new Date(), 2), 'yyyy-MM-dd'),
    category: 'Food',
    amount: 350,
    description: 'Lunch with potential client',
    status: 'Pending',
    submittedAt: subDays(new Date(), 2).toISOString(),
  },
  {
    id: 'exp3',
    userId: 'user123',
    userName: 'Mayur',
    date: format(subDays(new Date(), 10), 'yyyy-MM-dd'),
    category: 'Supplies',
    amount: 800,
    description: 'Stationery and office supplies',
    status: 'Rejected',
    submittedAt: subDays(new Date(), 10).toISOString(),
    reviewedBy: 'Admin',
    reviewedAt: subDays(new Date(), 9).toISOString(),
  },
];
