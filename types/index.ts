
import type { LEAD_STATUS_OPTIONS, LEAD_PRIORITY_OPTIONS, LEAD_SOURCE_OPTIONS, USER_OPTIONS } from '@/lib/constants';

// Deriving LeadStatusType from the LEAD_STATUS_OPTIONS const array
export type LeadStatusType = typeof LEAD_STATUS_OPTIONS[number];
export type LeadPriorityType = typeof LEAD_PRIORITY_OPTIONS[number];
export type LeadSourceOptionType = typeof LEAD_SOURCE_OPTIONS[number];
export type UserOptionType = typeof USER_OPTIONS[number];


export interface Lead {
  id: string;
  name: string;
  email?: string; // Optional
  phone?: string;
  status: LeadStatusType; // This will represent "Stage"
  source?: LeadSourceOptionType;
  assignedTo?: UserOptionType;
  createdAt: string;
  updatedAt: string;
  lastCommentText?: string;
  lastCommentDate?: string; // Format: dd-MM-yyyy
  nextFollowUpDate?: string; // Format: yyyy-MM-dd
  nextFollowUpTime?: string; // Format: HH:mm
  kilowatt?: number;
  address?: string;
  priority?: LeadPriorityType;
}

export type ClientType = 'Individual/Bungalow' | 'Housing Society' | 'Commercial' | 'Industrial';
export type ModuleType = 'Mono PERC' | 'TOPCon';
export type DCRStatus = 'DCR' | 'Non-DCR';
export type ModuleWattage = "540" | "545" | "550" | "585" | "590";

export interface Proposal {
  id: string;
  proposalNumber: string;
  clientId: string;

  name: string; // Client/Company Name
  clientType: ClientType;
  contactPerson: string;
  location: string;
  capacity: number; // kW
  moduleType: ModuleType;
  moduleWattage: ModuleWattage;
  dcrStatus: DCRStatus;
  inverterRating: number; // kW
  inverterQty: number;
  ratePerWatt: number; // ₹
  proposalDate: string; // ISO date string

  // Financials
  baseAmount: number; // ratePerWatt * capacity * 1000
  cgstAmount: number; // baseAmount * 0.069
  sgstAmount: number; // baseAmount * 0.069
  subtotalAmount: number; // baseAmount + cgstAmount + sgstAmount (This is the total before subsidy)
  finalAmount: number; // This will be the same as subtotalAmount. Represents amount before subsidy.
  subsidyAmount: number; // Stored separately.

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

// For the new status filter bar
export interface StatusFilterItem {
  label: LeadStatusType | 'Show all';
  count: number;
  value: LeadStatusType | 'all';
}

// For table sorting
export interface SortConfig {
  key: keyof Lead;
  direction: 'ascending' | 'descending';
}
