
import type { NavItem, Lead, Proposal, Document, Communication, DocumentType, ClientType, ModuleType, DCRStatus, ModuleWattage } from '@/types';
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
  Briefcase, // Added for Clients
  UserX,     // Added for Dropped Leads
  Rows,      // For Batch Proposals
} from 'lucide-react';
import { format, parseISO } from 'date-fns';

export const APP_NAME = "Soryouth";

// Primary CRM Navigation for the main sidebar
export const NAV_ITEMS: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/leads', label: 'Leads', icon: UsersRound },
  { href: '/proposals', label: 'Clients', icon: Briefcase }, // Clients page links to proposals list
  { href: '/communications', label: 'Communications', icon: MessageSquareText },
  { href: '/leads/dropped', label: 'Dropped Leads', icon: UserX },
];

// Secondary Navigation for tools/other sections, to be placed in a dropdown
export const TOOLS_NAV_ITEMS: NavItem[] = [
  { href: '/proposals/batch', label: 'Batch Proposals', icon: Rows },
  { href: '/documents', label: 'Documents', icon: Files },
  { href: '/document-customizer', label: 'AI Document Customizer', icon: WandSparkles },
  { href: '/automation', label: 'Automation Scripts', icon: TerminalSquare },
];


export const MOCK_LEADS: Lead[] = [
  { id: 'lead1', name: 'John Doe Lead', email: 'john.doe.lead@example.com', phone: '555-1234', status: 'New', source: 'Website', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'lead2', name: 'Jane Smith Lead', email: 'jane.smith.lead@example.com', phone: '555-5678', status: 'Contacted', source: 'Referral', assignedTo: 'Alice', createdAt: new Date(Date.now() - 86400000).toISOString(), updatedAt: new Date().toISOString() },
  { id: 'lead3', name: 'Robert Brown Lead', email: 'robert.brown.lead@example.com', status: 'Qualified', source: 'Cold Call', createdAt: new Date(Date.now() - 172800000).toISOString(), updatedAt: new Date().toISOString() },
  { id: 'lead4', name: 'Lost Cause Ltd', email: 'lost.cause@example.com', phone: '555-0000', status: 'Lost', source: 'Old Database', createdAt: new Date(Date.now() - 259200000).toISOString(), updatedAt: new Date(Date.now() - 86400000).toISOString() },
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
  // For Commercial/Industrial, subsidy remains 0

  return { baseAmount, cgstAmount, sgstAmount, subtotalAmount, finalAmount: finalAmountPreSubsidy, subsidyAmount };
};


export const MOCK_PROPOSALS: Proposal[] = [
  {
    id: 'prop1',
    proposalNumber: 'P-2024-001',
    clientId: 'client1', // Corresponds to a lead/client
    name: 'Green Valley Society',
    clientType: 'Housing Society',
    contactPerson: 'Mr. Sharma',
    location: 'Pune, MH',
    capacity: 50,
    moduleType: 'Mono PERC',
    moduleWattage: '545',
    dcrStatus: 'DCR',
    inverterRating: 50,
    inverterQty: 2,
    ratePerWatt: 40,
    proposalDate: format(new Date(Date.now() - 86400000 * 7), 'yyyy-MM-dd'),
    ...calculateFinancialsAndSubsidy(40, 50, 'Housing Society'),
    createdAt: new Date(Date.now() - 86400000 * 7).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: 'prop2',
    proposalNumber: 'P-2024-002',
    clientId: 'client2', // Corresponds to a lead/client
    name: 'Mr. Anil Patel (Bungalow)',
    clientType: 'Individual/Bungalow',
    contactPerson: 'Mr. Anil Patel',
    location: 'Mumbai, MH',
    capacity: 10, // capacity >= 3, so subsidy will be 78000
    moduleType: 'TOPCon',
    moduleWattage: '585',
    dcrStatus: 'Non-DCR',
    inverterRating: 10,
    inverterQty: 1,
    ratePerWatt: 45,
    proposalDate: format(new Date(Date.now() - 86400000 * 12), 'yyyy-MM-dd'),
    ...calculateFinancialsAndSubsidy(45, 10, 'Individual/Bungalow'),
    createdAt: new Date(Date.now() - 86400000 * 12).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 1).toISOString(),
  },
  {
    id: 'prop3',
    proposalNumber: 'P-2024-003',
    clientId: 'client3', // Corresponds to a lead/client
    name: 'FutureTech Industries',
    clientType: 'Commercial',
    contactPerson: 'Ms. Priya Singh',
    location: 'Nagpur, MH',
    capacity: 200,
    moduleType: 'Mono PERC',
    moduleWattage: '550',
    dcrStatus: 'Non-DCR', 
    inverterRating: 200,
    inverterQty: 5,
    ratePerWatt: 38,
    proposalDate: format(new Date(Date.now() - 86400000 * 3), 'yyyy-MM-dd'),
    ...calculateFinancialsAndSubsidy(38, 200, 'Commercial'),
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 1).toISOString(),
  },
   {
    id: 'prop4',
    proposalNumber: 'P-2024-004',
    clientId: 'client1', // Another proposal for Green Valley Society
    name: 'Green Valley Society',
    clientType: 'Housing Society',
    contactPerson: 'Mr. Sharma',
    location: 'Pune, MH',
    capacity: 75,
    moduleType: 'TOPCon',
    moduleWattage: '590',
    dcrStatus: 'DCR',
    inverterRating: 75,
    inverterQty: 3,
    ratePerWatt: 39,
    proposalDate: format(new Date(Date.now() - 86400000 * 1), 'yyyy-MM-dd'),
    ...calculateFinancialsAndSubsidy(39, 75, 'Housing Society'),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  { 
    id: 'prop5',
    proposalNumber: 'P-2024-005',
    clientId: 'client4',
    name: 'Mrs. Sunita Rao (Bungalow)',
    clientType: 'Individual/Bungalow',
    contactPerson: 'Mrs. Sunita Rao',
    location: 'Nashik, MH',
    capacity: 1, 
    moduleType: 'Mono PERC',
    moduleWattage: '540',
    dcrStatus: 'DCR',
    inverterRating: 1,
    inverterQty: 1,
    ratePerWatt: 50,
    proposalDate: format(new Date(Date.now() - 86400000 * 2), 'yyyy-MM-dd'),
    ...calculateFinancialsAndSubsidy(50, 1, 'Individual/Bungalow'), 
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  { 
    id: 'prop6',
    proposalNumber: 'P-2024-006',
    clientId: 'client5',
    name: 'Mr. Vijay Kumar (Bungalow)',
    clientType: 'Individual/Bungalow',
    contactPerson: 'Mr. Vijay Kumar',
    location: 'Aurangabad, MH',
    capacity: 2, 
    moduleType: 'TOPCon',
    moduleWattage: '550',
    dcrStatus: 'Non-DCR',
    inverterRating: 2,
    inverterQty: 1,
    ratePerWatt: 48,
    proposalDate: format(new Date(Date.now() - 86400000 * 5), 'yyyy-MM-dd'),
    ...calculateFinancialsAndSubsidy(48, 2, 'Individual/Bungalow'), 
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
    updatedAt: new Date().toISOString(),
  },
];


export const DOCUMENT_TYPES_CONFIG: Array<{ type: DocumentType; icon: React.ComponentType<{ className?: string }>; description: string }> = [
  { type: 'Work Completion Report', icon: CheckSquare, description: 'Reports confirming project completion.' },
  { type: 'Purchase Order', icon: FileText, description: 'Purchase orders for goods or services.' },
  { type: 'Annexure I', icon: FileSignature, description: 'Annexure I documents for compliance.' },
  { type: 'DCR Declaration', icon: Edit, description: 'Declarations related to domestic content requirement.' },
  { type: 'Net Metering Agreement', icon: Eye, description: 'Agreements for net metering services.' },
  { type: 'Warranty Certificate', icon: Award, description: 'Certificates for product/service warranties.' },
];


export const MOCK_DOCUMENTS: Document[] = [
  { id: 'd1', title: 'Work Completion for Project Sunbeam', type: 'Work Completion Report', relatedLeadId: 'lead2', createdAt: new Date().toISOString(), relatedProposalId: 'prop2' },
  { id: 'd2', title: 'Purchase Order PO-2024-050', type: 'Purchase Order', relatedLeadId: 'lead1', createdAt: new Date(Date.now() - 172800000).toISOString() },
  { id: 'd3', title: 'Standard Service Annexure Alpha', type: 'Annexure I', relatedLeadId: 'lead1', createdAt: new Date(Date.now() - 86400000).toISOString() },
  { id: 'd4', title: 'DCR Declaration for Green Energy Solutions', type: 'DCR Declaration', relatedLeadId: 'lead3', createdAt: new Date().toISOString() },
  { id: 'd5', title: 'Net Metering - 123 Main St', type: 'Net Metering Agreement', relatedLeadId: 'lead1', createdAt: new Date(Date.now() - 2*86400000).toISOString() },
  { id: 'd6', title: 'System Warranty - Project Sunbeam', type: 'Warranty Certificate', relatedLeadId: 'lead2', createdAt: new Date().toISOString(), relatedProposalId: 'prop2' },
  { id: 'd7', title: 'Purchase Order PO-2024-051', type: 'Purchase Order', relatedLeadId: 'lead3', createdAt: new Date(Date.now() - 90000000).toISOString() },
];

export const MOCK_COMMUNICATIONS: Communication[] = [
    { id: 'c1', leadId: 'lead1', type: 'Email', subject: 'Introductory Email', content: 'Sent initial contact email.', direction: 'Outgoing', timestamp: new Date(Date.now() - 86400000 * 2).toISOString(), recordedBy: 'System' },
    { id: 'c2', leadId: 'lead1', type: 'Call', content: 'Follow-up call regarding their solar needs. They are interested.', direction: 'Outgoing', timestamp: new Date(Date.now() - 86400000).toISOString(), recordedBy: 'Sales Rep A' },
    { id: 'c3', leadId: 'lead2', type: 'System Alert', content: 'Lead status changed to "Contacted".', direction: 'Outgoing', timestamp: new Date(Date.now() - 3600000).toISOString() },
    { id: 'c4', leadId: 'lead2', type: 'Meeting', subject: 'Site Visit', content: 'Scheduled site visit for next Tuesday.', direction: 'Outgoing', timestamp: new Date().toISOString(), recordedBy: 'Sales Rep B'},
];
