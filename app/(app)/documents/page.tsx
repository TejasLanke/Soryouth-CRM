
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
  Loader2,
  Banknote,
  ShieldCheck
} from 'lucide-react';
import { DocumentCreationDialog } from './document-creation-dialog';
import { DocumentTemplateSelectionDialog } from './document-template-selection-dialog';
import { ProposalPreviewDialog } from '../proposals/proposal-preview-dialog';
import { getDocumentTypes, getFinancialDocumentTypes } from '@/app/(app)/settings/actions';

export default function DocumentsPage() {
  const [documentTypes, setDocumentTypes] = useState<CustomSetting[]>([]);
  const [financialDocumentTypes, setFinancialDocumentTypes] = useState<CustomSetting[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [isTemplateDialogOpen, setIsTemplateDialogOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [documentTypeToCreate, setDocumentTypeToCreate] = useState<DocumentType | null>(null);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [previewData, setPreviewData] = useState<{ pdfUrl: string, docxUrl: string, documentId: string, isFinancialDocument: boolean } | null>(null);
  
  useEffect(() => {
    const fetchDocTypes = async () => {
        setIsLoading(true);
        const [docTypes, finDocTypes] = await Promise.all([
            getDocumentTypes(),
            getFinancialDocumentTypes()
        ]);
        setDocumentTypes(docTypes);
        setFinancialDocumentTypes(finDocTypes);
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
  
  const handleGenerationSuccess = (data: { pdfUrl: string, docxUrl: string, documentId: string, isFinancialDocument: boolean }) => {
    setIsCreateDialogOpen(false);
    setPreviewData(data);
  };

  const closeCreationDialogs = () => {
    setIsTemplateDialogOpen(false);
    setIsCreateDialogOpen(false);
    setDocumentTypeToCreate(null);
    setSelectedTemplateId(null);
  };

  const renderDocumentCards = (types: CustomSetting[], isFinancial: boolean) => {
    const Icon = isFinancial ? Banknote : FileText;
    const descriptionPrefix = isFinancial ? "Manage all generated financial" : "Manage all generated standard";
    
    return types.map(({ id, name }) => (
      <Card key={id} className="flex flex-col justify-between shadow-md hover:shadow-lg transition-shadow">
        <CardHeader>
          <div className="flex items-center gap-3 mb-2">
            <Icon className="h-8 w-8 text-primary" />
            <CardTitle className="font-headline text-xl">{name}</CardTitle>
          </div>
          <CardDescription>{descriptionPrefix} {name.toLowerCase()} documents.</CardDescription>
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
    ));
  };
  
  const allDocTypes = [...documentTypes, ...financialDocumentTypes];

  return (
    <>
      <PageHeader
        title="All Documents"
        description="Select a document type to view existing files or create new ones."
        icon={Files}
      />
       {isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : allDocTypes.length === 0 ? (
           <Card className="md:col-span-2 lg:col-span-3">
              <CardContent className="pt-6 text-center text-muted-foreground">
                  <Files className="mx-auto h-12 w-12 mb-4" />
                  <h3 className="text-xl font-semibold mb-2">No Document Types Found</h3>
                  <p>Go to "Manage Templates" to add custom document types first.</p>
              </CardContent>
          </Card>
      ) : (
        <div className="space-y-8">
            {documentTypes.length > 0 && (
                <div>
                    <h2 className="text-2xl font-semibold font-headline mb-4 flex items-center gap-2"><FileText className="h-6 w-6"/>Standard Documents</h2>
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3">
                        {renderDocumentCards(documentTypes, false)}
                    </div>
                </div>
            )}
            {financialDocumentTypes.length > 0 && (
                 <div>
                    <h2 className="text-2xl font-semibold font-headline mb-4 flex items-center gap-2"><ShieldCheck className="h-6 w-6"/>Financial Documents (Approval Required)</h2>
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3">
                        {renderDocumentCards(financialDocumentTypes, true)}
                    </div>
                </div>
            )}
        </div>
      )}
      
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
      
      {previewData && (
        <ProposalPreviewDialog
            isOpen={!!previewData}
            onClose={() => setPreviewData(null)}
            pdfUrl={previewData.pdfUrl}
            docxUrl={previewData.docxUrl}
            documentId={previewData.documentId}
            isFinancialDocument={previewData.isFinancialDocument}
        />
      )}
    </>
  );
}
