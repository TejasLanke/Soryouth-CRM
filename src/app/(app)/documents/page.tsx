import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { MOCK_DOCUMENTS } from '@/lib/constants';
import type { Document } from '@/types';
import { Files, PlusCircle, Download, Eye, Edit3 } from 'lucide-react';
import Link from 'next/link';

export default function DocumentsPage() {
  const documents = MOCK_DOCUMENTS;

  return (
    <>
      <PageHeader
        title="Documents"
        description="Generate and manage work completion reports and other necessary documents."
        icon={Files}
        actions={
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" /> Generate New Document
          </Button>
        }
      />
      {documents.length === 0 ? (
         <Card className="mt-6">
          <CardContent className="pt-6">
            <div className="text-center text-muted-foreground">
              <Files className="mx-auto h-12 w-12 mb-4" />
              <h3 className="text-xl font-semibold mb-2">No Documents Yet</h3>
              <p className="mb-4">Start by generating your first document.</p>
              <Button>
                <PlusCircle className="mr-2 h-4 w-4" /> Generate New Document
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {documents.map((doc) => (
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
                 <Button variant="outline" size="sm">
                  <Eye className="mr-1.5 h-3.5 w-3.5" /> View
                </Button>
                <Button variant="outline" size="sm">
                  <Edit3 className="mr-1.5 h-3.5 w-3.5" /> Edit
                </Button>
                 <Button size="sm">
                  <Download className="mr-1.5 h-3.5 w-3.5" /> Download
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
      <div className="mt-8">
        <img src="https://placehold.co/1200x300.png" data-ai-hint="document management" alt="Document Management System" className="w-full rounded-lg object-cover"/>
      </div>
    </>
  );
}
