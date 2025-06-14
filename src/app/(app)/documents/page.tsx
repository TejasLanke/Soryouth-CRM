'use client';

import { useState } from 'react';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { MOCK_DOCUMENTS } from '@/lib/constants';
import type { Document, DocumentType } from '@/types';
import { 
  Files, 
  PlusCircle, 
  Download, 
  Eye, 
  Edit3, 
  ArrowLeft, 
  FileSignature, 
  FileText as FileTextIcon, 
  CheckSquare, 
  Award,
  Edit as EditIcon,
  type LucideIcon
} from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';

const DOCUMENT_TYPES_CONFIG: Array<{ type: DocumentType; icon: LucideIcon; description: string }> = [
  { type: 'Work Completion Report', icon: CheckSquare, description: 'Reports confirming project completion.' },
  { type: 'Invoice', icon: FileTextIcon, description: 'Billing documents for services/products.' },
  { type: 'Contract', icon: FileSignature, description: 'Legal agreements and contracts.' },
  { type: 'Proposal Document', icon: EditIcon, description: 'Proposals and quotations for leads.' },
  { type: 'Site Survey Report', icon: Eye, description: 'Reports from on-site assessments.' },
  { type: 'Warranty Certificate', icon: Award, description: 'Certificates for product/service warranties.' },
];

export default function DocumentsPage() {
  const [selectedType, setSelectedType] = useState<DocumentType | null>(null);
  const allDocuments = MOCK_DOCUMENTS;
  const { toast } = useToast();

  const handleTypeSelect = (type: DocumentType) => {
    setSelectedType(type);
  };

  const handleCreateNew = (type: DocumentType) => {
    toast({
      title: `Create New ${type}`,
      description: `Placeholder for creating a new ${type.toLowerCase()}. This would typically open a form or editor.`,
    });
    // In a real app, this would navigate to a form or open a dialog/modal
    // For example: router.push(`/documents/new?type=${encodeURIComponent(type)}`);
  };

  const filteredDocuments = selectedType
    ? allDocuments.filter(doc => doc.type === selectedType)
    : [];

  if (selectedType) {
    const selectedTypeConfig = DOCUMENT_TYPES_CONFIG.find(dt => dt.type === selectedType);
    return (
      <>
        <PageHeader
          title={`${selectedType}s`}
          description={`Manage your ${selectedType.toLowerCase()} documents.`}
          icon={selectedTypeConfig?.icon || Files}
        />
        <Button onClick={() => setSelectedType(null)} variant="outline" className="mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Document Types
        </Button>

        {filteredDocuments.length === 0 ? (
          <Card className="mt-6">
            <CardContent className="pt-6">
              <div className="text-center text-muted-foreground">
                {selectedTypeConfig?.icon ? <selectedTypeConfig.icon className="mx-auto h-12 w-12 mb-4 text-muted-foreground" /> : <Files className="mx-auto h-12 w-12 mb-4" /> }
                <h3 className="text-xl font-semibold mb-2">No {selectedType}s Yet</h3>
                <p className="mb-4">Start by creating your first {selectedType.toLowerCase()}.</p>
                <Button onClick={() => handleCreateNew(selectedType)}>
                  <PlusCircle className="mr-2 h-4 w-4" /> Create New {selectedType}
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredDocuments.map((doc) => (
              <Card key={doc.id} className="flex flex-col">
                <CardHeader>
                  <CardTitle className="font-headline">{doc.title}</CardTitle>
                  <CardDescription>{doc.type}</CardDescription>
                </CardHeader>
                <CardContent className="flex-grow">
                  <p className="text-sm text-muted-foreground">
                    Created: {new Date(doc.createdAt).toLocaleDateString()}
                  </p>
                  {doc.relatedLeadId && <p className="text-sm text-muted-foreground">Related Lead ID: {doc.relatedLeadId}</p>}
                </CardContent>
                <CardFooter className="flex justify-end gap-2">
                   <Button variant="outline" size="sm" disabled> {/* Placeholder actions */}
                    <Eye className="mr-1.5 h-3.5 w-3.5" /> View
                  </Button>
                  <Button variant="outline" size="sm" disabled> {/* Placeholder actions */}
                    <Edit3 className="mr-1.5 h-3.5 w-3.5" /> Edit
                  </Button>
                   <Button size="sm" disabled> {/* Placeholder actions */}
                    <Download className="mr-1.5 h-3.5 w-3.5" /> Download
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
         <div className="mt-8">
          <img src={`https://placehold.co/1200x300.png`} data-ai-hint={`${selectedType?.toLowerCase().replace(/\s+/g, '_')} documents list`} alt={`${selectedType} documents`} className="w-full rounded-lg object-cover"/>
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
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3"> {/* Ensure 3 columns on large screens */}
        {DOCUMENT_TYPES_CONFIG.map(({ type, icon: Icon, description }) => (
          <Card key={type} className="flex flex-col justify-between shadow-md hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <Icon className="h-8 w-8 text-primary" />
                <CardTitle className="font-headline text-xl">{type}</CardTitle>
              </div>
              <CardDescription>{description}</CardDescription>
            </CardHeader>
            <CardContent className="flex-grow" /> {/* Spacer to push footer down */}
            <CardFooter className="flex flex-col sm:flex-row justify-end gap-2 pt-4 border-t mt-4">
              <Button variant="outline" size="sm" onClick={() => handleTypeSelect(type)} className="w-full sm:w-auto">
                <Eye className="mr-1.5 h-3.5 w-3.5" /> View Existing
              </Button>
              <Button size="sm" onClick={() => handleCreateNew(type)} className="w-full sm:w-auto">
                <PlusCircle className="mr-1.5 h-3.5 w-3.5" /> Create New
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
      <div className="mt-8">
        <img src="https://placehold.co/1200x300.png" data-ai-hint="document types selection" alt="Document Type Selection" className="w-full rounded-lg object-cover"/>
      </div>
    </>
  );
}
