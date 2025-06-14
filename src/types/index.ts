
export interface Lead {
  id: string;
  name: string;
  email: string;
  phone?: string;
  status: 'New' | 'Contacted' | 'Qualified' | 'Proposal Sent' | 'Won' | 'Lost';
  source?: string;
  assignedTo?: string;
  createdAt: string;
  updatedAt: string;
}

export type ClientType = 'Individual/Bungalow' | 'Housing Society' | 'Commercial' | 'Industrial';
export type ModuleType = 'Mono PERC' | 'TOPCon';
export type DCRStatus = 'DCR' | 'Non-DCR';

export interface Proposal {
  id: string; 
  proposalNumber: string;
  clientId: string; 
  
  name: string; 
  clientType: ClientType;
  contactPerson: string;
  location: string;
  capacity: number; 
  moduleType: ModuleType;
  dcrStatus: DCRStatus;
  inverterRating: number; 
  inverterQty: number;
  ratePerWatt: number; 
  proposalDate: string; // ISO date string

  baseAmount: number; 
  cgstAmount: number; 
  sgstAmount: number; 
  subtotalAmount: number; // baseAmount + cgstAmount + sgstAmount
  finalAmount: number; // This will be the same as subtotalAmount
  subsidyAmount: number; // Stored separately, not used in finalAmount calculation here

  createdAt: string; 
  updatedAt?: string; 
}

export type DocumentType =
  | 'Work Completion Report'
  | 'Purchase Order'
  | 'Annexure I'
  | 'DCR Declaration'
  | 'Net Metering Agreement'
  | 'Warranty Certificate'
  | 'Other';

export interface Document {
  id: string;
  title: string;
  type: DocumentType;
  relatedLeadId?: string; 
  relatedProposalId?: string;
  createdAt: string;
  filePath?: string; 
}

export interface Communication {
  id: string;
  leadId: string;
  type: 'Email' | 'Call' | 'SMS' | 'Meeting' | 'System Alert';
  subject?: string;
  content: string;
  direction: 'Incoming' | 'Outgoing';
  timestamp: string;
  recordedBy?: string;
}

export interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  disabled?: boolean;
  children?: NavItem[];
}
