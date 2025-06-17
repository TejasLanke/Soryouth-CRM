
import type { LEAD_STATUS_OPTIONS, LEAD_PRIORITY_OPTIONS, LEAD_SOURCE_OPTIONS, USER_OPTIONS, DROP_REASON_OPTIONS, CLIENT_TYPES, EXPENSE_CATEGORIES, FOLLOW_UP_TYPES, FOLLOW_UP_STATUSES, MODULE_TYPES, DCR_STATUSES, MODULE_WATTAGE_OPTIONS } from '@/lib/constants';

// Deriving types from the const arrays ensures type safety and single source of truth
export type LeadStatusType = typeof LEAD_STATUS_OPTIONS[number];
export type LeadPriorityType = typeof LEAD_PRIORITY_OPTIONS[number];
export type LeadSourceOptionType = typeof LEAD_SOURCE_OPTIONS[number];
export type UserOptionType = typeof USER_OPTIONS[number];
export type DropReasonType = typeof DROP_REASON_OPTIONS[number];
export type ClientType = typeof CLIENT_TYPES[number];
export type ModuleType = typeof MODULE_TYPES[number];
export type DCRStatus = typeof DCR_STATUSES[number];
export type ModuleWattage = typeof MODULE_WATTAGE_OPTIONS[number];


export interface Lead {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  status: LeadStatusType;
  source?: LeadSourceOptionType;
  assignedTo?: UserOptionType;
  createdBy?: UserOptionType;
  createdAt: string;
  updatedAt: string;
  lastCommentText?: string;
  lastCommentDate?: string;
  nextFollowUpDate?: string;
  nextFollowUpTime?: string;
  kilowatt?: number;
  address?: string;
  priority?: LeadPriorityType;
  dropReason?: DropReasonType;
  clientType?: ClientType;
}

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
  moduleWattage: ModuleWattage;
  dcrStatus: DCRStatus;
  inverterRating: number;
  inverterQty: number;
  ratePerWatt: number;
  proposalDate: string;

  baseAmount: number;
  cgstAmount: number;
  sgstAmount: number;
  subtotalAmount: number;
  finalAmount: number;
  subsidyAmount: number;

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

export interface StatusFilterItem {
  label: LeadStatusType | 'Show all';
  count: number;
  value: LeadStatusType | 'all';
}

export interface DropReasonFilterItem {
  label: DropReasonType | 'Show all';
  count: number;
  value: DropReasonType | 'all';
}

export interface SortConfig {
  key: keyof Lead;
  direction: 'ascending' | 'descending';
}

export type FollowUpType = typeof FOLLOW_UP_TYPES[number];
export type FollowUpStatus = typeof FOLLOW_UP_STATUSES[number];

export interface FollowUp {
  id: string;
  leadId: string;
  type: FollowUpType;
  date: string;
  time: string;
  status: FollowUpStatus;
  priority: LeadPriorityType;
  leadStage: LeadStatusType;
  comment: string;
  createdBy: UserOptionType;
  createdAt: string;
}

export interface Task {
  id: string;
  leadId: string;
  assignedTo: UserOptionType;
  dueDate: string;
  dueTime: string;
  description: string;
  status: 'Pending' | 'Completed' | 'Overdue';
  createdAt: string;
}

export type ExpenseCategory = typeof EXPENSE_CATEGORIES[number];
export type ExpenseStatus = 'Pending' | 'Approved' | 'Rejected';

export interface Expense {
  id: string;
  userId: string;
  userName?: string;
  date: string;
  category: ExpenseCategory;
  amount: number;
  description: string;
  receiptUrl?: string;
  status: ExpenseStatus;
  submittedAt: string;
  reviewedBy?: UserOptionType;
  reviewedAt?: string;
}
