
'use client';

import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Printer, Download, Loader2 } from 'lucide-react';

interface DocumentPreviewDialogProps {
  isOpen: boolean;
  onClose: () => void;
  pdfUrl: string | null;
  docxUrl: string | null;
}

// Helper function to fetch a presigned URL
const fetchPresignedUrl = async (s3Url: string | null): Promise<string | null> => {
    if (!s3Url) return null;
    try {
        const s3Key = new URL(s3Url).pathname.substring(1);
        const response = await fetch(`/api/s3/presigned-url?key=${encodeURIComponent(s3Key)}`);
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to get secure URL.');
        }
        const data = await response.json();
        return data.url;
    } catch (err) {
        console.error(`Failed to fetch presigned URL for ${s3Url}:`, err);
        throw err; // Re-throw to be caught by the caller
    }
};


export function ProposalPreviewDialog({ isOpen, onClose, pdfUrl, docxUrl }: DocumentPreviewDialogProps) {
  const [viewablePdfUrl, setViewablePdfUrl] = useState<string | null>(null);
  const [downloadableDocxUrl, setDownloadableDocxUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setIsLoading(true);
      setError(null);
      setViewablePdfUrl(null);
      setDownloadableDocxUrl(null);

      const fetchAllUrls = async () => {
        try {
          const [pdf, docx] = await Promise.all([
            fetchPresignedUrl(pdfUrl),
            fetchPresignedUrl(docxUrl),
          ]);
          
          if (!pdf) {
            setError("No PDF URL provided or failed to get a secure link for it.");
          }

          setViewablePdfUrl(pdf);
          setDownloadableDocxUrl(docx);
        } catch (err) {
          setError(err instanceof Error ? err.message : 'An unknown error occurred while fetching secure links.');
        } finally {
          setIsLoading(false);
        }
      };
      
      fetchAllUrls();
    }
  }, [isOpen, pdfUrl, docxUrl]);

  const handlePrint = () => {
    if (!viewablePdfUrl) return;
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    iframe.src = viewablePdfUrl;
    document.body.appendChild(iframe);
    iframe.onload = () => {
      setTimeout(() => {
        try {
          iframe.contentWindow?.focus();
          iframe.contentWindow?.print();
        } catch (error) {
            console.error("Printing failed:", error);
            window.open(viewablePdfUrl, '_blank');
        } finally {
            document.body.removeChild(iframe);
        }
      }, 100);
    };
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Document Preview</DialogTitle>
          <DialogDescription>
            Preview your generated document. You can also print or download it.
          </DialogDescription>
        </DialogHeader>
        <div className="flex-grow border rounded-md overflow-hidden bg-muted/20 flex items-center justify-center">
          {isLoading && <Loader2 className="h-8 w-8 animate-spin" />}
          {error && <p className="text-destructive text-center p-4">Error loading preview: {error}</p>}
          {!isLoading && !error && viewablePdfUrl && (
            <iframe
              src={viewablePdfUrl}
              title="Document PDF Preview"
              className="w-full h-full"
              frameBorder="0"
            />
          )}
        </div>
        <DialogFooter className="sm:justify-between pt-4 flex-wrap">
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="secondary" disabled={!viewablePdfUrl}>
              <a href={viewablePdfUrl || '#'} download>
                  <Download className="mr-2 h-4 w-4" />
                  Download PDF
              </a>
            </Button>
            {docxUrl && (
              <Button asChild variant="secondary" disabled={!downloadableDocxUrl}>
                <a href={downloadableDocxUrl || '#'} download>
                    <Download className="mr-2 h-4 w-4" />
                    Download Word
                </a>
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
            <Button onClick={handlePrint} disabled={!viewablePdfUrl}>
              <Printer className="mr-2 h-4 w-4" />
              Print
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
