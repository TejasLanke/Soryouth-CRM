
import type { NavItem, Lead, Proposal, Document, Communication, DocumentType } from '@/types';
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
  IndianRupee
} from 'lucide-react';

export const APP_NAME = "Soryouth";

export const NAV_ITEMS: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/leads', label: 'Leads', icon: UsersRound },
  { href: '/proposals', label: 'Proposals', icon: FileText },
  { href: '/documents', label: 'Documents', icon: Files },
  { href: '/communications', label: 'Communications', icon: MessageSquareText },
  { href: '/document-customizer', label: 'AI Document Customizer', icon: WandSparkles },
  { href: '/automation', label: 'Automation Scripts', icon: TerminalSquare },
];

export const MOCK_LEADS: Lead[] = [
  { id: '1', name: 'John Doe', email: 'john.doe@example.com', phone: '555-1234', status: 'New', source: 'Website', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: '2', name: 'Jane Smith', email: 'jane.smith@example.com', phone: '555-5678', status: 'Contacted', source: 'Referral', assignedTo: 'Alice', createdAt: new Date(Date.now() - 86400000).toISOString(), updatedAt: new Date().toISOString() },
  { id: '3', name: 'Robert Brown', email: 'robert.brown@example.com', status: 'Qualified', source: 'Cold Call', createdAt: new Date(Date.now() - 172800000).toISOString(), updatedAt: new Date().toISOString() },
];

export const MOCK_PROPOSALS: Proposal[] = [
  { id: 'p1', leadId: '1', leadName: 'John Doe', proposalNumber: 'P-2024-001', amount: 150000, status: 'Draft', createdAt: new Date().toISOString(), validUntil: new Date(Date.now() + 2592000000).toISOString() },
  { id: 'p2', leadId: '2', leadName: 'Jane Smith', proposalNumber: 'P-2024-002', amount: 220000, status: 'Sent', createdAt: new Date(Date.now() - 86400000).toISOString(), validUntil: new Date(Date.now() + 2505600000).toISOString() },
  { id: 'p3', leadId: '3', leadName: 'Robert Brown', proposalNumber: 'P-2024-003', amount: 185000, status: 'Accepted', createdAt: new Date(Date.now() - 172800000).toISOString(), validUntil: new Date(Date.now() + 2419200000).toISOString() },
  { id: 'p4', leadId: '1', leadName: 'John Doe', proposalNumber: 'P-2024-004', amount: 95000, status: 'Rejected', createdAt: new Date(Date.now() - 259200000).toISOString(), validUntil: new Date(Date.now() + 2332800000).toISOString() },
];

export const DOCUMENT_TYPES_CONFIG: Array<{ type: DocumentType; icon: React.ComponentType<{ className?: string }>; description: string }> = [
  { type: 'Work Completion Report', icon: CheckSquare, description: 'Reports confirming project completion.' },
  { type: 'Purchase Order', icon: FileText, description: 'Purchase orders for goods or services.' },
  { type: 'Annexure I', icon: FileSignature, description: 'Annexure I documents for compliance.' },
  { type: 'DCR Declaration', icon: Edit, description: 'Declarations related to Daily Commissioning Reports.' },
  { type: 'Net Metering Agreement', icon: Eye, description: 'Agreements for net metering services.' },
  { type: 'Warranty Certificate', icon: Award, description: 'Certificates for product/service warranties.' },
  // { type: 'Other', icon: Files, description: 'Other general documents.'}
];


export const MOCK_DOCUMENTS: Document[] = [
  { id: 'd1', title: 'Work Completion for Project Sunbeam', type: 'Work Completion Report', relatedLeadId: '2', createdAt: new Date().toISOString() },
  { id: 'd2', title: 'Purchase Order PO-2024-050', type: 'Purchase Order', relatedLeadId: '1', createdAt: new Date(Date.now() - 172800000).toISOString() },
  { id: 'd3', title: 'Standard Service Annexure Alpha', type: 'Annexure I', relatedLeadId: '1', createdAt: new Date(Date.now() - 86400000).toISOString() },
  { id: 'd4', title: 'DCR Declaration for Green Energy Solutions', type: 'DCR Declaration', relatedLeadId: '3', createdAt: new Date().toISOString() }, 
  { id: 'd5', title: 'Net Metering - 123 Main St', type: 'Net Metering Agreement', relatedLeadId: '1', createdAt: new Date(Date.now() - 2*86400000).toISOString() },
  { id: 'd6', title: 'System Warranty - Project Sunbeam', type: 'Warranty Certificate', relatedLeadId: '2', createdAt: new Date().toISOString() },
  { id: 'd7', title: 'Purchase Order PO-2024-051', type: 'Purchase Order', relatedLeadId: '3', createdAt: new Date(Date.now() - 90000000).toISOString(), relatedProposalId: 'p3' },
];

export const MOCK_COMMUNICATIONS: Communication[] = [
    { id: 'c1', leadId: '1', type: 'Email', subject: 'Introductory Email', content: 'Sent initial contact email.', direction: 'Outgoing', timestamp: new Date(Date.now() - 86400000 * 2).toISOString(), recordedBy: 'System' },
    { id: 'c2', leadId: '1', type: 'Call', content: 'Follow-up call regarding their solar needs. They are interested.', direction: 'Outgoing', timestamp: new Date(Date.now() - 86400000).toISOString(), recordedBy: 'Sales Rep A' },
    { id: 'c3', leadId: '2', type: 'System Alert', content: 'Lead status changed to "Contacted".', direction: 'Outgoing', timestamp: new Date(Date.now() - 3600000).toISOString() },
    { id: 'c4', leadId: '2', type: 'Meeting', subject: 'Site Visit', content: 'Scheduled site visit for next Tuesday.', direction: 'Outgoing', timestamp: new Date().toISOString(), recordedBy: 'Sales Rep B'},
];

export const PROPOSAL_STATUSES: Proposal['status'][] = ['Draft', 'Sent', 'Accepted', 'Rejected'];

