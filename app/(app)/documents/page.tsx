
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import type { DocumentType, CustomSetting } from '@/types';
import { 
  Files, 
  PlusCircle, 
  Eye, 
  FileText,
  Loader2
} from 'lucide-react';
import { DocumentCreationDialog } from './document-creation-dialog';
import { DocumentTemplateSelectionDialog } from './document-template-selection-dialog';
import { ProposalPreviewDialog } from '../proposals/proposal-preview-dialog';
import { getDocumentTypes } from '@/app/(app)/settings/actions';

export default function DocumentsPage() {
  const [documentTypes, setDocumentTypes] = useState<CustomSetting[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [isTemplateDialogOpen, setIsTemplateDialogOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [documentTypeToCreate, setDocumentTypeToCreate] = useState<DocumentType | null>(null);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [previewUrls, setPreviewUrls] = useState<{ pdfUrl: string, docxUrl: string } | null>(null);
  
  useEffect(() => {
    const fetchDocTypes = async () => {
        setIsLoading(true);
        const types = await getDocumentTypes();
        setDocumentTypes(types);
        setIsLoading(false);
    }
    fetchDocTypes();
  }, []);

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

  if (isLoading) {
    return (
      <>
        <PageHeader
          title="Documents"
          description="Select a document type to view existing files or create new ones."
          icon={Files}
        />
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Documents"
        description="Select a document type to view existing files or create new ones."
        icon={Files}
      />
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3">
        {documentTypes.map(({ id, name }) => (
          <Card key={id} className="flex flex-col justify-between shadow-md hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <FileText className="h-8 w-8 text-primary" />
                <CardTitle className="font-headline text-xl">{name}</CardTitle>
              </div>
              <CardDescription>Manage all generated {name.toLowerCase()} documents.</CardDescription>
            </CardHeader>
            <CardContent className="flex-grow" />
            <CardFooter className="flex flex-col sm:flex-row justify-end gap-2 pt-4 border-t mt-4">
              <Button asChild variant="outline" size="sm" className="w-full sm:w-auto">
                <Link href={`/documents/${encodeURIComponent(name)}`}>
                  <Eye className="mr-1.5 h-3.5 w-3.5" /> View Existing
                </Link>
              </Button>
              <Button size="sm" onClick={() => handleCreateNewClick(name)} className="w-full sm:w-auto">
                <PlusCircle className="mr-1.5 h-3.5 w-3.5" /> Create New
              </Button>
            </CardFooter>
          </Card>
        ))}
        {documentTypes.length === 0 && (
             <Card className="md:col-span-2 lg:col-span-3">
                <CardContent className="pt-6 text-center text-muted-foreground">
                    <Files className="mx-auto h-12 w-12 mb-4" />
                    <h3 className="text-xl font-semibold mb-2">No Document Types Found</h3>
                    <p>Go to "Manage Templates" to add custom document types first.</p>
                </CardContent>
            </Card>
        )}
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
