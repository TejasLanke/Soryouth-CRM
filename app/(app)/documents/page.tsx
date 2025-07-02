
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { DOCUMENT_TYPES_CONFIG } from '@/lib/constants';
import type { Document, DocumentType } from '@/types';
import { 
  Files, 
  PlusCircle, 
  Download, 
  Eye, 
  Edit3, 
  ArrowLeft, 
  type LucideIcon
} from 'lucide-react';
import { DocumentCreationDialog } from './document-creation-dialog';
import { DocumentTemplateSelectionDialog } from './document-template-selection-dialog';
import { ProposalPreviewDialog } from '../proposals/proposal-preview-dialog';

export default function DocumentsPage() {
  const [isTemplateDialogOpen, setIsTemplateDialogOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [documentTypeToCreate, setDocumentTypeToCreate] = useState<DocumentType | null>(null);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [previewUrls, setPreviewUrls] = useState<{ pdfUrl: string, docxUrl: string } | null>(null);
  
  const handleCreateNewClick = (type: DocumentType) => {
    setDocumentTypeToCreate(type);
    setIsTemplateDialogOpen(true);
  };

  const handleTemplateSelected = (templateId: string) => {
    setSelectedTemplateId(templateId);
    setIsTemplateDialogOpen(false);
    setIsCreateDialogOpen(true);
  };
  
  const handleGenerationSuccess = (urls: { pdfUrl: string, docxUrl: string }) => {
    setIsCreateDialogOpen(false); // Close the creation form
    setPreviewUrls(urls); // Set urls to open the preview
  };

  const closeCreationDialogs = () => {
    setIsTemplateDialogOpen(false);
    setIsCreateDialogOpen(false);
    setDocumentTypeToCreate(null);
    setSelectedTemplateId(null);
  };

  return (
    <>
      <PageHeader
        title="Documents"
        description="Select a document type to view existing files or create new ones."
        icon={Files}
      />
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3">
        {DOCUMENT_TYPES_CONFIG.map(({ type, icon: Icon, description }) => (
          <Card key={type} className="flex flex-col justify-between shadow-md hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <Icon className="h-8 w-8 text-primary" />
                <CardTitle className="font-headline text-xl">{type}</CardTitle>
              </div>
              <CardDescription>{description}</CardDescription>
            </CardHeader>
            <CardContent className="flex-grow" />
            <CardFooter className="flex flex-col sm:flex-row justify-end gap-2 pt-4 border-t mt-4">
              <Button asChild variant="outline" size="sm" className="w-full sm:w-auto">
                <Link href={`/documents/${encodeURIComponent(type)}`}>
                  <Eye className="mr-1.5 h-3.5 w-3.5" /> View Existing
                </Link>
              </Button>
              <Button size="sm" onClick={() => handleCreateNewClick(type)} className="w-full sm:w-auto">
                <PlusCircle className="mr-1.5 h-3.5 w-3.5" /> Create New
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
      <div className="mt-8">
        <img src="https://placehold.co/1200x300.png" data-ai-hint="document types selection" alt="Document Type Selection" className="w-full rounded-lg object-cover"/>
      </div>
      
      {documentTypeToCreate && (
        <DocumentTemplateSelectionDialog
          isOpen={isTemplateDialogOpen}
          onClose={closeCreationDialogs}
          onSelect={handleTemplateSelected}
          documentType={documentTypeToCreate}
        />
      )}
      
      {isCreateDialogOpen && documentTypeToCreate && selectedTemplateId && (
        <DocumentCreationDialog
          isOpen={isCreateDialogOpen}
          onClose={closeCreationDialogs}
          documentType={documentTypeToCreate}
          templateId={selectedTemplateId}
          onSuccess={handleGenerationSuccess}
        />
      )}
      
      {previewUrls && (
        <ProposalPreviewDialog
            isOpen={!!previewUrls}
            onClose={() => setPreviewUrls(null)}
            pdfUrl={previewUrls.pdfUrl}
            docxUrl={previewUrls.docxUrl}
        />
      )}
    </>
  );
}
