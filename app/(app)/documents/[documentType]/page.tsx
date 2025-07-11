
'use client';

import { useState, useEffect, useTransition } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { PageHeader } from '@/components/page-header';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { DOCUMENT_TYPES_CONFIG } from '@/lib/constants';
import { Loader2, ArrowLeft, FileText, Trash2, Eye, Edit } from 'lucide-react';
import { getGeneratedDocuments, deleteGeneratedDocument } from '../actions';
import type { GeneratedDocument, CustomSetting } from '@/types';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { ProposalPreviewDialog } from '@/app/(app)/proposals/proposal-preview-dialog';
import { getDocumentTypes } from '@/app/(app)/settings/actions';
import { DocumentCreationDialog } from '../document-creation-dialog';

export default function GeneratedDocumentsPage() {
    const router = useRouter();
    const params = useParams();
    const { toast } = useToast();
    const [isDeleting, startDeleteTransition] = useTransition();

    const documentTypeParam = params.documentType;
    const documentType = documentTypeParam ? decodeURIComponent(Array.isArray(documentTypeParam) ? documentTypeParam[0] : documentTypeParam) : undefined;
    
    const [documents, setDocuments] = useState<GeneratedDocument[]>([]);
    const [documentTypes, setDocumentTypes] = useState<CustomSetting[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [previewUrls, setPreviewUrls] = useState<{ pdfUrl: string, docxUrl: string } | null>(null);

    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [documentToEdit, setDocumentToEdit] = useState<GeneratedDocument | null>(null);

    const documentConfig = documentType ? DOCUMENT_TYPES_CONFIG.find(dt => dt.type === documentType) : undefined;

    const refreshDocuments = async () => {
        if (documentType) {
            const fetchedDocs = await getGeneratedDocuments(documentType);
            setDocuments(fetchedDocs);
        }
    };
    
    useEffect(() => {
        const fetchPageData = async () => {
            setIsLoading(true);
            const [fetchedDocTypes, fetchedDocs] = await Promise.all([
                getDocumentTypes(),
                documentType ? getGeneratedDocuments(documentType) : Promise.resolve([]),
            ]);
            setDocumentTypes(fetchedDocTypes);
            setDocuments(fetchedDocs);
            setIsLoading(false);
        };
        fetchPageData();
    }, [documentType]);
    
    const isValidDocType = documentType && documentTypes.some(dt => dt.name === documentType);

    const handleDelete = (doc: GeneratedDocument) => {
        startDeleteTransition(async () => {
            const result = await deleteGeneratedDocument(doc.pdfUrl);
            if(result.success) {
                toast({ title: 'Document Deleted', description: `Successfully deleted document for ${doc.clientName}.` });
                setDocuments(prev => prev.filter(d => d.pdfUrl !== doc.pdfUrl));
            } else {
                toast({ title: 'Error', description: result.error || 'Failed to delete the document.', variant: 'destructive' });
            }
        });
    };

    const handleEdit = (doc: GeneratedDocument) => {
        setDocumentToEdit(doc);
        setIsCreateDialogOpen(true);
    };

    const handleGenerationSuccess = (urls: { pdfUrl: string, docxUrl: string }) => {
        setIsCreateDialogOpen(false);
        setDocumentToEdit(null);
        refreshDocuments();
        setPreviewUrls(urls);
    };

    const closeCreationDialogs = () => {
        setIsCreateDialogOpen(false);
        setDocumentToEdit(null);
    };

    if (isLoading) {
        return (
            <div className="flex h-64 items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }
    
    if (!isValidDocType || !documentType) {
         return (
             <>
                <PageHeader
                    title="Invalid Document Type"
                    description="The document type specified in the URL does not exist."
                    icon={FileText}
                    actions={
                        <Button onClick={() => router.push('/documents')} variant="outline">
                            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Document Types
                        </Button>
                    }
                />
                 <Card className="mt-6">
                    <CardContent className="pt-6 text-center text-muted-foreground">
                        <p>Please select a valid document type from the Documents page.</p>
                    </CardContent>
                </Card>
            </>
         );
    }

    return (
        <>
            <PageHeader
                title={documentType!}
                description={`Manage all generated ${documentType!.toLowerCase()} documents.`}
                icon={documentConfig?.icon || FileText}
                actions={
                    <Button onClick={() => router.push('/documents')} variant="outline">
                        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Document Types
                    </Button>
                }
            />
            {documents.length === 0 ? (
                <Card className="mt-6">
                    <CardContent className="pt-6 text-center text-muted-foreground">
                        <FileText className="mx-auto h-12 w-12 mb-4" />
                        <h3 className="text-xl font-semibold mb-2">No Documents Found</h3>
                        <p>No documents of this type have been generated yet.</p>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {documents.map((doc) => (
                        <Card key={doc.pdfUrl} className="flex flex-col">
                            <CardHeader>
                                <CardTitle className="font-headline">{doc.clientName}</CardTitle>
                                <CardDescription>
                                    Generated: {format(new Date(doc.createdAt), 'dd MMM, yyyy p')}
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="flex-grow" />
                            <CardFooter className="flex justify-end gap-2">
                                <Button variant="outline" size="sm" onClick={() => setPreviewUrls({ pdfUrl: doc.pdfUrl, docxUrl: doc.docxUrl })}>
                                    <Eye className="mr-2 h-4 w-4" /> View
                                </Button>
                                <Button variant="secondary" size="sm" onClick={() => handleEdit(doc)}>
                                    <Edit className="mr-2 h-4 w-4" /> Edit & Regenerate
                                </Button>
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button variant="destructive" size="icon" title="Delete Document">
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                This will permanently delete both the PDF and DOCX files for "{doc.clientName}". This action cannot be undone.
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                            <AlertDialogAction onClick={() => handleDelete(doc)} disabled={isDeleting} className={buttonVariants({ variant: 'destructive'})}>
                                                {isDeleting ? 'Deleting...' : 'Yes, Delete'}
                                            </AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            )}
             {previewUrls && (
                <ProposalPreviewDialog
                    isOpen={!!previewUrls}
                    onClose={() => setPreviewUrls(null)}
                    pdfUrl={previewUrls.pdfUrl}
                    docxUrl={previewUrls.docxUrl}
                />
            )}
            {isCreateDialogOpen && (
                <DocumentCreationDialog
                  isOpen={isCreateDialogOpen}
                  onClose={closeCreationDialogs}
                  documentType={documentToEdit?.documentType || documentType}
                  templateId={documentToEdit?.templateId || null}
                  documentToEdit={documentToEdit}
                  onSuccess={handleGenerationSuccess}
                />
            )}
        </>
    );
}
