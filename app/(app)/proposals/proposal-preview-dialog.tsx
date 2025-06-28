
'use client';

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Printer, Download } from 'lucide-react';

interface ProposalPreviewDialogProps {
  isOpen: boolean;
  onClose: () => void;
  pdfUrl: string | null;
  docxUrl: string | null;
}

export function ProposalPreviewDialog({ isOpen, onClose, pdfUrl, docxUrl }: ProposalPreviewDialogProps) {
  if (!pdfUrl) return null;

  const handlePrint = () => {
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    iframe.src = pdfUrl;
    document.body.appendChild(iframe);
    iframe.onload = () => {
      setTimeout(() => {
        try {
          iframe.contentWindow?.focus();
          iframe.contentWindow?.print();
        } catch (error) {
            console.error("Printing failed:", error);
            // Fallback for cross-origin issues if any
            window.open(pdfUrl, '_blank');
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
          <DialogTitle>Proposal Generated</DialogTitle>
          <DialogDescription>
            Your proposal PDF has been created. You can preview, print, or download it.
          </DialogDescription>
        </DialogHeader>
        <div className="flex-grow border rounded-md overflow-hidden bg-muted/20">
          <iframe
            src={pdfUrl}
            title="Proposal PDF Preview"
            className="w-full h-full"
            frameBorder="0"
          />
        </div>
        <DialogFooter className="sm:justify-between pt-4 flex-wrap">
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="secondary">
              <a href={pdfUrl} download={`proposal-${Date.now()}.pdf`}>
                  <Download className="mr-2 h-4 w-4" />
                  Download PDF
              </a>
            </Button>
            {docxUrl && (
              <Button asChild variant="secondary">
                <a href={docxUrl} download={`proposal-${Date.now()}.docx`}>
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
            <Button onClick={handlePrint}>
              <Printer className="mr-2 h-4 w-4" />
              Print
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
