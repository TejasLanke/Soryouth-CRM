
import type { LEAD_PRIORITY_OPTIONS, USER_OPTIONS, DROP_REASON_OPTIONS, CLIENT_TYPES, EXPENSE_CATEGORIES, FOLLOW_UP_TYPES, FOLLOW_UP_STATUSES, MODULE_TYPES, DCR_STATUSES, MODULE_WATTAGE_OPTIONS, SURVEY_STATUS_OPTIONS, SURVEY_TYPE_OPTIONS, METER_PHASES, CONSUMER_LOAD_TYPES, ROOF_TYPES, DISCOM_OPTIONS, CLIENT_PRIORITY_OPTIONS, USER_ROLES } from '@/lib/constants';

// Deriving types from the const arrays ensures type safety and single source of truth
export type LeadStatusType = string;
export type LeadSourceOptionType = string;
export type ClientStatusType = string;

export type LeadPriorityType = typeof LEAD_PRIORITY_OPTIONS[number];
export type UserOptionType = typeof USER_OPTIONS[number];
export type DropReasonType = typeof DROP_REASON_OPTIONS[number];
export type ClientType = typeof CLIENT_TYPES[number];
export type ModuleType = typeof MODULE_TYPES[number];
export type DCRStatus = typeof DCR_STATUSES[number];
export type ModuleWattage = typeof MODULE_WATTAGE_OPTIONS[number];
export type ClientPriorityType = typeof CLIENT_PRIORITY_OPTIONS[number];
export type UserRole = typeof USER_ROLES[number];


export type AnyStatusType = LeadStatusType | ClientStatusType;

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  createdAt: string;
}

export interface Lead {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  status: LeadStatusType;
  source?: LeadSourceOptionType | null;
  assignedTo?: string | null;
  createdBy?: string | null;
  createdAt: string;
  updatedAt: string;
  lastCommentText?: string | null;
  lastCommentDate?: string | null;
  nextFollowUpDate?: string | null;
  nextFollowUpTime?: string | null;
  kilowatt?: number | null;
  address?: string | null;
  priority?: LeadPriorityType | null;
  dropReason?: DropReasonType | null;
  clientType?: ClientType | null;
  electricityBillUrl?: string | null;
  followupCount?: number;
}
export type CreateLeadData = Omit<Lead, 'id' | 'createdAt' | 'updatedAt' | 'followupCount'>;

export interface DroppedLead extends Omit<Lead, 'status' | 'updatedAt'> {
  status: 'Lost';
  dropReason: DropReasonType;
  dropComment?: string | null;
  droppedAt: string;
}

export interface Client {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  status: ClientStatusType;
  priority?: ClientPriorityType | null;
  assignedTo?: string | null;
  createdBy?: string | null;
  createdAt: string;
  updatedAt: string;
  kilowatt?: number | null;
  address?: string | null;
  clientType?: ClientType | null;
  electricityBillUrl?: string | null;
  followupCount?: number;
  lastCommentText?: string | null;
  lastCommentDate?: string | null;
  nextFollowUpDate?: string | null;
  nextFollowUpTime?: string | null;
}
export type CreateClientData = Omit<Client, 'id' | 'createdAt' | 'updatedAt' | 'followupCount' | 'lastCommentText' | 'lastCommentDate' | 'nextFollowUpDate' | 'nextFollowUpTime'>;


export interface Proposal {
  id: string;
  proposalNumber: string;
  clientId?: string;
  leadId?: string;
  templateId?: string;
  name: string;
  clientType: ClientType;
  contactPerson: string;
  location: string;
  phone?: string | null;
  email?: string | null;
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
  pdfUrl?: string | null;
  docxUrl?: string | null;

  // Additional Fields
  requiredSpace?: number;
  generationPerDay?: number;
  generationPerYear?: number;
  unitRate?: number;
  savingsPerYear?: number;
  laKitQty?: number;
  acdbDcdbQty?: number;
  earthingKitQty?: number;
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
  relatedClientId?: string;
  relatedProposalId?: string;
  createdAt: string;
  filePath?: string;
}

export interface Communication {
  id: string;
  leadId?: string;
  clientId?: string;
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
  label: string;
  count: number;
  value: string;
}

export interface ClientStatusFilterItem {
  label: string;
  count: number;
  value: string;
}

export interface DropReasonFilterItem {
  label: DropReasonType | 'Show all';
  count: number;
  value: DropReasonType | 'all';
}

export type Item = Lead | Client | DroppedLead;
export type GenericSortConfig<T extends Item> = { key: keyof T; direction: 'ascending' | 'descending' };
export type LeadSortConfig = GenericSortConfig<Lead>;
export type ClientSortConfig = GenericSortConfig<Client>;
export type DroppedLeadSortConfig = GenericSortConfig<DroppedLead>;


export type FollowUpType = typeof FOLLOW_UP_TYPES[number];
export type FollowUpStatus = typeof FOLLOW_UP_STATUSES[number];

export interface FollowUp {
  id: string;
  leadId?: string;
  clientId?: string;
  droppedLeadId?: string;
  type: FollowUpType;
  date: string;
  time?: string;
  status: FollowUpStatus;
  leadStageAtTimeOfFollowUp?: AnyStatusType;
  comment?: string;
  createdBy?: string;
  createdAt: string;
  followupOrTask: 'Followup' | 'Task';
  taskForUser?: string;
  taskDate?: string;
  taskTime?: string;
}

export type AddActivityData = Omit<FollowUp, 'id' | 'createdAt' | 'droppedLeadId' | 'createdBy'> & {
  priority?: LeadPriorityType | ClientPriorityType;
};


export interface Task {
  id: string;
  entityId: string;
  entityType: 'lead' | 'client';
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

export type SurveyStatusType = typeof SURVEY_STATUS_OPTIONS[number];
export type SurveyTypeOption = typeof SURVEY_TYPE_OPTIONS[number];

export interface Survey {
  id: string;
  surveyNumber: string;
  clientName: string;
  location: string;
  surveyDate: string;
  surveyorName: UserOptionType;
  status: SurveyStatusType;
  type: SurveyTypeOption;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SurveySortConfig {
  key: keyof Survey;
  direction: 'ascending' | 'descending';
}

export interface SurveyStatusFilterItem {
  label: SurveyStatusType | 'Show all';
  count: number;
  value: SurveyStatusType | 'all';
}

export type ConsumerCategoryType = ClientType;
export type MeterPhaseType = typeof METER_PHASES[number];
export type ConsumerLoadType = typeof CONSUMER_LOAD_TYPES[number];
export type RoofType = typeof ROOF_TYPES[number];
export type DiscomType = typeof DISCOM_OPTIONS[number];

export interface SiteSurveyData {
  consumerName: string;
  date: string;
  consumerCategory: ConsumerCategoryType;
  location: string;
  numberOfMeters: number;
  meterRating?: string;
  meterPhase?: MeterPhaseType;
  electricityAmount?: number;
  consumerLoadType: ConsumerLoadType;
  roofType: RoofType;
  buildingHeight: string;
  shadowFreeArea: string;
  discom: DiscomType;
  sanctionedLoad?: string;
  remark?: string;
  surveyorName: UserOptionType;
  electricityBillFile?: File | null;
}

export type SiteSurveyFormValues = Omit<SiteSurveyData, 'electricityBillFile'> & {
  electricityBillFile?: FileList | null;
};

export type ProposalOrDocumentType = 'Proposal' | DocumentType;

export interface Template {
  id: string;
  name: string;
  type: ProposalOrDocumentType;
  originalDocxPath: string;
  createdAt: string;
  updatedAt: string;
}

export type CreateTemplateData = Omit<Template, 'id' | 'createdAt' | 'updatedAt'>;

export type SettingType = 'LEAD_STATUS' | 'LEAD_SOURCE' | 'CLIENT_STATUS';

export interface CustomSetting {
    id: string;
    type: SettingType;
    name: string;
    createdAt: string;
}
