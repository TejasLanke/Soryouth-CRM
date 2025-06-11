import type { NavItem, Lead, Quotation, Document, Communication } from '@/types';
import {
  LayoutDashboard,
  UsersRound,
  FileText,
  Files,
  MessageSquareText,
  WandSparkles,
  TerminalSquare,
} from 'lucide-react';

export const APP_NAME = "Soryouth";

export const NAV_ITEMS: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/leads', label: 'Leads', icon: UsersRound },
  { href: '/quotations', label: 'Quotations', icon: FileText },
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

export const MOCK_QUOTATIONS: Quotation[] = [
  { id: 'q1', leadId: '1', leadName: 'John Doe', quotationNumber: 'Q-2024-001', amount: 15000, status: 'Draft', createdAt: new Date().toISOString(), validUntil: new Date(Date.now() + 2592000000).toISOString() },
  { id: 'q2', leadId: '2', leadName: 'Jane Smith', quotationNumber: 'Q-2024-002', amount: 22000, status: 'Sent', createdAt: new Date(Date.now() - 86400000).toISOString(), validUntil: new Date(Date.now() + 2505600000).toISOString() },
];

export const MOCK_DOCUMENTS: Document[] = [
  { id: 'd1', title: 'Work Completion for Project Sunbeam', type: 'Work Completion Report', relatedLeadId: '2', createdAt: new Date().toISOString() },
  { id: 'd2', title: 'Invoice INV-2024-050', type: 'Invoice', relatedLeadId: '1', createdAt: new Date(Date.now() - 172800000).toISOString() },
];

export const MOCK_COMMUNICATIONS: Communication[] = [
    { id: 'c1', leadId: '1', type: 'Email', subject: 'Introductory Email', content: 'Sent initial contact email.', direction: 'Outgoing', timestamp: new Date(Date.now() - 86400000 * 2).toISOString(), recordedBy: 'System' },
    { id: 'c2', leadId: '1', type: 'Call', content: 'Follow-up call regarding their solar needs. They are interested.', direction: 'Outgoing', timestamp: new Date(Date.now() - 86400000).toISOString(), recordedBy: 'Sales Rep A' },
    { id: 'c3', leadId: '2', type: 'System Alert', content: 'Lead status changed to "Contacted".', direction: 'Outgoing', timestamp: new Date(Date.now() - 3600000).toISOString() },
    { id: 'c4', leadId: '2', type: 'Meeting', subject: 'Site Visit', content: 'Scheduled site visit for next Tuesday.', direction: 'Outgoing', timestamp: new Date().toISOString(), recordedBy: 'Sales Rep B'},
];
