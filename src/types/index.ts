
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

export interface Proposal {
  id: string;
  leadId: string;
  leadName: string;
  proposalNumber: string;
  amount: number;
  status: 'Draft' | 'Sent' | 'Accepted' | 'Rejected';
  createdAt: string;
  validUntil: string;
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
  filePath?: string; // or content string
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
