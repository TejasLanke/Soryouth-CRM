
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { MOCK_QUOTATIONS } from '@/lib/constants';
import type { Quotation } from '@/types';
import { FileText, PlusCircle, Download, Eye, Edit3 } from 'lucide-react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';

export default function QuotationsPage() {
  const quotations = MOCK_QUOTATIONS;

  const getStatusColor = (status: Quotation['status']) => {
    switch (status) {
      case 'Draft': return 'bg-yellow-500 hover:bg-yellow-600';
      case 'Sent': return 'bg-blue-500 hover:bg-blue-600';
      case 'Accepted': return 'bg-green-500 hover:bg-green-600';
      case 'Rejected': return 'bg-red-500 hover:bg-red-600';
      default: return 'bg-gray-500 hover:bg-gray-600';
    }
  };


  return (
    <>
      <PageHeader
        title="Quotations"
        description="Manage and generate quotations for your clients."
        icon={FileText}
        actions={
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" /> Create New Quotation
          </Button>
        }
      />
      {quotations.length === 0 ? (
        <Card className="mt-6">
          <CardContent className="pt-6">
            <div className="text-center text-muted-foreground">
              <FileText className="mx-auto h-12 w-12 mb-4" />
              <h3 className="text-xl font-semibold mb-2">No Quotations Yet</h3>
              <p className="mb-4">Start by creating your first quotation.</p>
              <Button>
                <PlusCircle className="mr-2 h-4 w-4" /> Create New Quotation
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {quotations.map((quotation) => (
            <Card key={quotation.id} className="flex flex-col">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle className="font-headline">{quotation.quotationNumber}</CardTitle>
                  <Badge variant={quotation.status === 'Accepted' ? 'default' : quotation.status === 'Rejected' ? 'destructive' : 'secondary'}>
                    {quotation.status}
                  </Badge>
                </div>
                <CardDescription>For: {quotation.leadName}</CardDescription>
              </CardHeader>
              <CardContent className="flex-grow">
                <p className="text-2xl font-semibold text-primary">₹{quotation.amount.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Created: {new Date(quotation.createdAt).toLocaleDateString()}
                </p>
                <p className="text-sm text-muted-foreground">
                  Valid Until: {new Date(quotation.validUntil).toLocaleDateString()}
                </p>
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
        <img src="https://placehold.co/1200x300.png" data-ai-hint="quotation process" alt="Quotation Process Banner" className="w-full rounded-lg object-cover"/>
      </div>
    </>
  );
}
