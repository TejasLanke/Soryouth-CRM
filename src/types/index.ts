
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
  id: string; // Unique ID for the proposal itself
  proposalNumber: string;
  clientId: string; // Identifier for the client this proposal belongs to
  
  // Client and Project Details
  name: string; // Name of the client (person, housing society, company)
  clientType: ClientType;
  contactPerson: string;
  location: string;
  capacity: number; // kW
  moduleType: ModuleType;
  dcrStatus: DCRStatus;
  inverterRating: number; // kW
  inverterQty: number;
  ratePerWatt: number; // ₹

  // Financials
  baseAmount: number; // Calculated: ratePerWatt * capacity * 1000
  cgstAmount: number; // Calculated: baseAmount * 0.069
  sgstAmount: number; // Calculated: baseAmount * 0.069
  subtotalAmount: number; // Calculated: baseAmount + cgstAmount + sgstAmount
  subsidyAmount: number;
  finalAmount: number; // Calculated: subtotalAmount - subsidyAmount

  // Proposal Status and Validity
  status: 'Draft' | 'Sent' | 'Accepted' | 'Rejected';
  validUntil: string; // ISO date string
  createdAt: string; // ISO date string
  updatedAt?: string; // ISO date string
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
  relatedLeadId?: string; // Kept for potential link to Leads module
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
