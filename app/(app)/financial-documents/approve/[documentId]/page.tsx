
'use client';

import { useState, useEffect, useTransition } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Loader2, ShieldCheck, CheckCircle2, XCircle, ArrowLeft, FileText } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { getFinancialDocumentById, reviewFinancialDocument } from '@/app/(app)/documents/actions';
import type { FinancialDocument } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { ProposalPreviewDialog } from '@/app/(app)/proposals/proposal-preview-dialog';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

export default function ApproveFinancialDocumentPage() {
    const router = useRouter();
    const params = useParams();
    const { toast } = useToast();
    const documentId = typeof params.documentId === 'string' ? params.documentId : '';
    
    const [document, setDocument] = useState<FinancialDocument | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, startSubmitTransition] = useTransition();

    useEffect(() => {
        if (documentId) {
            setIsLoading(true);
            getFinancialDocumentById(documentId)
                .then(doc => {
                    setDocument(doc);
                    setIsLoading(false);
                })
                .catch(err => {
                    toast({ title: 'Error', description: 'Failed to load document.', variant: 'destructive' });
                    setIsLoading(false);
                });
        }
    }, [documentId, toast]);

    const handleReview = (status: 'Approved' | 'Rejected') => {
        if (!document) return;
        startSubmitTransition(async () => {
            const result = await reviewFinancialDocument(document.id, status);
            if (result.success) {
                toast({ title: 'Success', description: `Document has been ${status.toLowerCase()}.` });
                router.push(`/documents/${encodeURIComponent(document.documentType)}`);
            } else {
                toast({ title: 'Error', description: result.error || 'Failed to update status.', variant: 'destructive' });
            }
        });
    };

    if (isLoading) {
        return (
            <div className="flex h-64 items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }
    
    if (!document) {
        return (
            <>
                <PageHeader title="Document Not Found" icon={FileText} />
                <p>The requested document could not be found or you do not have permission to view it.</p>
            </>
        );
    }

    return (
        <>
            <PageHeader 
                title={`Review: ${document.documentType}`} 
                description={`For client: ${document.clientName}`}
                icon={ShieldCheck}
                actions={<Button variant="outline" onClick={() => router.back()}><ArrowLeft className="h-4 w-4 mr-2"/>Back</Button>}
            />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                     <Card className="h-[75vh]">
                        <CardContent className="p-0 h-full">
                           <ProposalPreviewDialog
                                isOpen={true}
                                onClose={() => {}} // Keep it open
                                pdfUrl={document.pdfUrl}
                                docxUrl={document.docxUrl}
                            />
                        </CardContent>
                     </Card>
                </div>
                <div className="lg:col-span-1">
                    <Card>
                        <CardHeader>
                            <CardTitle>Review & Action</CardTitle>
                            <CardDescription>
                                Review the document and either approve or reject it.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <h4 className="font-semibold">Current Status</h4>
                                <Badge variant={document.status === 'Approved' ? 'default' : document.status === 'Rejected' ? 'destructive' : 'secondary'}>
                                    {document.status}
                                </Badge>
                            </div>
                             {document.reviewedAt && (
                                <div>
                                    <h4 className="font-semibold">Reviewed By</h4>
                                    <p className="text-sm">{document.reviewedBy?.name || 'N/A'} on {format(new Date(document.reviewedAt), 'dd MMM yyyy')}</p>
                                </div>
                             )}
                        </CardContent>
                        <CardFooter className="flex flex-col gap-2">
                            <Button 
                                className="w-full bg-green-600 hover:bg-green-700"
                                onClick={() => handleReview('Approved')}
                                disabled={isSubmitting || document.status === 'Approved'}
                            >
                                {isSubmitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin"/> : <CheckCircle2 className="h-4 w-4 mr-2" />}
                                Approve
                            </Button>
                            <Button
                                variant="destructive" 
                                className="w-full"
                                onClick={() => handleReview('Rejected')}
                                disabled={isSubmitting || document.status === 'Rejected'}
                            >
                                 {isSubmitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin"/> : <XCircle className="h-4 w-4 mr-2" />}
                                Reject
                            </Button>
                        </CardFooter>
                    </Card>
                </div>
            </div>
        </>
    )

}

