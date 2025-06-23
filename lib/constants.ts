
import type { NavItem, Lead, Client, Proposal, Document, Communication, DocumentType, ClientType, LeadStatusType, LeadPriorityType, ClientStatusType, ClientPriorityType, UserOptionType, DropReasonType, Expense, Survey } from '@/types';
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
  Briefcase,
  UserX,
  Rows,
  CalendarDays,
  ListChecks,
  Receipt,
  Notebook,
  ClipboardList,
  ClipboardEdit,
  MapPinnedIcon,
  BarChart3,
} from 'lucide-react';
import { format, parseISO, addDays, subDays } from 'date-fns';

export const APP_NAME = "Soryouth";

// Primary CRM Navigation for the main sidebar
export const NAV_ITEMS: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/leads-list', label: 'Leads', icon: UsersRound },
  { href: '/clients-list', label: 'Clients', icon: Briefcase },
  { href: '/proposals', label: 'Proposals', icon: FileText },
  { href: '/dropped-leads-list', label: 'Dropped Leads', icon: UserX },
  { href: '/reports', label: 'Reports', icon: BarChart3 },
];

// Secondary Navigation for tools/other sections, in user profile dropdown
export const TOOLS_NAV_ITEMS: NavItem[] = [
  { href: '/expenses', label: 'Expenses', icon: Notebook },
  { href: '/communications', label: 'Communications', icon: MessageSquareText },
  { href: '/calendar', label: 'Calendar', icon: CalendarDays },
  { href: '/survey-reports', label: 'Survey Reports', icon: MapPinnedIcon },
  { href: '/tickets', label: 'Tickets', icon: Receipt },
  { href: '/proposals/batch', label: 'Batch Proposals', icon: Rows },
  { href: '/site-survey', label: 'Site Survey Form', icon: ClipboardEdit },
  { href: '/documents', label: 'Documents', icon: Files },
  { href: '/document-customizer', label: 'AI Document Customizer', icon: WandSparkles },
  { href: '/automation', label: 'Automation Scripts', icon: TerminalSquare },
];

export const CLIENT_TYPES = ['Individual/Bungalow', 'Housing Society', 'Commercial', 'Industrial', 'Other'] as const;
export const LEAD_STATUS_OPTIONS = ['New', 'Fresher', 'Requirement', 'Site Visit', 'Quotation Send', 'Follow-up', 'On Hold', 'Lost'] as const;
export const ACTIVE_LEAD_STATUS_OPTIONS = ['New', 'Fresher', 'Requirement', 'Site Visit', 'Quotation Send', 'Follow-up', 'On Hold'] as const;
export const CLIENT_STATUS_OPTIONS = ['Fresher', 'Deal Done', 'Installer', 'On Hold', 'Inactive'] as const;
export const LEAD_PRIORITY_OPTIONS = ['Hot', 'High', 'Medium', 'Average', 'Low'] as const;
export const CLIENT_PRIORITY_OPTIONS = ['Hot', 'Average'] as const;
export const LEAD_SOURCE_OPTIONS = ['Facebook', 'Website', 'Referral', 'Cold Call', 'Walk-in', 'Other', 'OWN Reference'] as const;
export const USER_OPTIONS = ['Mayur', 'Sales Rep A', 'Sales Rep B', 'Admin', 'System', 'Kanchan Nikam', 'tejas', 'MAYUR', 'Prasad mudholkar', 'Ritesh'] as const;
export const DROP_REASON_OPTIONS = [
    'Duplicate lead', 'Fake Lead', 'Not Feasible', 'Not Interested',
    'Requirement fullfilled', 'below 3kw', 'out of coverage area',
    'out of maharashtra', 'price issue', 'want in balcony', 'Other'
] as const;

export const FOLLOW_UP_TYPES = ['Call', 'SMS', 'Email', 'Meeting', 'Visit'] as const;
export const FOLLOW_UP_STATUSES = ['Answered', 'No reply', 'Rejected', 'Not connected'] as const;
export const MODULE_TYPES = ['Mono PERC', 'TOPCon'] as const;
export const DCR_STATUSES = ['DCR', 'Non-DCR'] as const;
export const MODULE_WATTAGE_OPTIONS = ["540", "545", "550", "585", "590"] as const;

export const MOCK_LEADS: Lead[] = [
  {
    id: 'lead1', name: 'Pramod Agrawal', email: 'pramod.agrawal@example.com', phone: '6263537508',
    status: 'Fresher', source: 'Facebook', createdAt: subDays(new Date(),5).toISOString(), updatedAt: new Date().toISOString(),
    lastCommentText: 'lb 8000/-', lastCommentDate: format(subDays(new Date(), 2), 'dd-MM-yyyy'),
    kilowatt: 10, clientType: 'Commercial', nextFollowUpDate: format(addDays(new Date(), 5), 'yyyy-MM-dd'), nextFollowUpTime: '10:00',
    address: '123 Main St, Nagpur', priority: 'High', assignedTo: 'Mayur', createdBy: 'Admin', electricityBillUrl: '/mock-bills/pramod-bill.pdf', followupCount: 3,
  },
  {
    id: 'lead2', name: 'sir (Jane Smith)', email: 'jane.smith.lead@example.com', phone: '7001173134',
    status: 'Requirement', source: 'Facebook', assignedTo: 'Sales Rep A', createdBy: 'Mayur',
    createdAt: new Date(Date.now() - 86400000).toISOString(), updatedAt: new Date().toISOString(),
    lastCommentText: 'Not answering', lastCommentDate: format(subDays(new Date(), 1), 'dd-MM-yyyy'),
    kilowatt: 5, clientType: 'Individual/Bungalow', nextFollowUpDate: format(addDays(new Date(), 7), 'yyyy-MM-dd'), nextFollowUpTime: '14:30',
    address: '456 Oak Ave, Mumbai', priority: 'Medium', electricityBillUrl: '/mock-bills/jane-bill.jpg', followupCount: 5,
  },
   {
    id: 'lead4', name: 'Lost Cause Ltd', email: 'lost.cause@example.com', phone: '555-0000',
    status: 'Lost', source: 'Facebook', dropReason: 'Not Interested',
    createdAt: new Date(Date.now() - 259200000).toISOString(), updatedAt: new Date(Date.now() - 86400000).toISOString(),
    kilowatt: 0, clientType: 'Other', priority: 'Low', assignedTo: 'System', createdBy: 'System', followupCount: 0,
  },
];

export const MOCK_CLIENTS: Client[] = [
   {
    id: 'client1', name: 'Green Valley Society', status: 'Deal Done', clientType: 'Housing Society', phone: '9876543210', assignedTo: 'Mayur',
    createdAt: subDays(new Date(), 100).toISOString(), updatedAt: subDays(new Date(), 10).toISOString(), electricityBillUrl: '/mock-bills/greenvalley-bill.pdf', followupCount: 12
  },
  {
    id: 'client2', name: 'Mr. Anil Patel (Bungalow)', status: 'Deal Done', clientType: 'Individual/Bungalow', phone: '9876543211', assignedTo: 'Sales Rep A',
    createdAt: subDays(new Date(), 120).toISOString(), updatedAt: subDays(new Date(), 5).toISOString(), followupCount: 8
  },
  {
    id: 'client3', name: 'FutureTech Industries', status: 'Installer', clientType: 'Commercial', phone: '9876543212', assignedTo: 'Sales Rep B',
    createdAt: subDays(new Date(), 80).toISOString(), updatedAt: subDays(new Date(), 1).toISOString(), followupCount: 15
  },
];


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
];

export const DOCUMENT_TYPES_CONFIG: Array<{ type: DocumentType; icon: React.ComponentType<{ className?: string }>; description: string }> = [
  { type: 'Work Completion Report', icon: CheckSquare, description: 'Reports confirming project completion.' }, { type: 'Purchase Order', icon: FileText, description: 'Purchase orders for goods or services.' }, { type: 'Annexure I', icon: FileSignature, description: 'Annexure I documents for compliance.' }, { type: 'DCR Declaration', icon: Edit, description: 'Declarations related to domestic content requirement.' }, { type: 'Net Metering Agreement', icon: Eye, description: 'Agreements for net metering services.' }, { type: 'Warranty Certificate', icon: Award, description: 'Certificates for product/service warranties.' },
];

export const MOCK_DOCUMENTS: Document[] = [
  { id: 'd1', title: 'Work Completion for Project Sunbeam', type: 'Work Completion Report', relatedClientId: 'client2', createdAt: new Date().toISOString(), relatedProposalId: 'prop2' }, { id: 'd2', title: 'Purchase Order PO-2024-050', type: 'Purchase Order', relatedLeadId: 'lead1', createdAt: new Date(Date.now() - 172800000).toISOString() },
];

export const MOCK_COMMUNICATIONS: Communication[] = [
    { id: 'c1', leadId: 'lead1', type: 'Email', subject: 'Introductory Email', content: 'Sent initial contact email.', direction: 'Outgoing', timestamp: new Date(Date.now() - 86400000 * 2).toISOString(), recordedBy: 'System' }, { id: 'c2', clientId: 'client1', type: 'Call', content: 'Follow-up call regarding their solar needs. They are interested.', direction: 'Outgoing', timestamp: new Date(Date.now() - 86400000).toISOString(), recordedBy: 'Sales Rep A' },
];

export const EXPENSE_CATEGORIES = ['Travel', 'Food', 'Supplies', 'Utilities', 'Software', 'Training', 'Marketing', 'Other'] as const;

export const MOCK_EXPENSES: Expense[] = [];
export const SURVEY_STATUS_OPTIONS = ['Scheduled', 'In Progress', 'Completed', 'Cancelled', 'On Hold'] as const;
export const SURVEY_TYPE_OPTIONS = ['Commercial', 'Residential', 'Industrial', 'Agricultural', 'Other'] as const;
export const MOCK_SURVEYS: Survey[] = [];
export const CONSUMER_CATEGORIES_OPTIONS = CLIENT_TYPES;
export const METER_PHASES = ['Single Phase', 'Three Phase', 'Not Applicable'] as const;
export const CONSUMER_LOAD_TYPES = ['LT', 'HT'] as const;
export const ROOF_TYPES = ['Metal', 'RCC', 'Asbestos', 'Other'] as const;
export const DISCOM_OPTIONS = ['MSEDCL', 'Adani Electricity', 'Tata Power', 'Torrent Power', 'Other'] as const;
