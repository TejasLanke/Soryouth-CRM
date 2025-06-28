
'use client';

import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ClipboardPaste, PlusCircle, Edit } from 'lucide-react';
import type { Template } from '@/types';
import { getTemplates } from './actions';
import Link from 'next/link';
import { format } from 'date-fns';

export default function ManageTemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchTemplates() {
      setIsLoading(true);
      const fetchedTemplates = await getTemplates();
      setTemplates(fetchedTemplates);
      setIsLoading(false);
    }
    fetchTemplates();
  }, []);

  const proposalTemplates = templates.filter(t => t.type === 'Proposal');
  const documentTemplates = templates.filter(t => t.type === 'Document');

  const renderTemplateList = (templateList: Template[]) => {
    if (isLoading) {
      return <p>Loading templates...</p>;
    }
    if (templateList.length === 0) {
      return <p className="text-sm text-muted-foreground">No templates found for this category.</p>;
    }
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {templateList.map(template => (
          <Card key={template.id}>
            <CardHeader>
              <CardTitle>{template.name}</CardTitle>
              <CardDescription>
                Last updated: {format(new Date(template.updatedAt), 'dd MMM, yyyy')}
              </CardDescription>
            </CardHeader>
            <CardFooter>
              <Button asChild variant="secondary" size="sm">
                <Link href={`/manage-templates/${template.id}`}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit Template
                </Link>
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    );
  };

  return (
    <>
      <PageHeader
        title="Manage Templates"
        description="Create, edit, and manage your proposal and document templates."
        icon={ClipboardPaste}
        actions={
          <Button asChild>
            <Link href="/manage-templates/new">
              <PlusCircle className="mr-2 h-4 w-4" />
              Create New Template
            </Link>
          </Button>
        }
      />
      <Tabs defaultValue="proposal">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="proposal">Proposal Templates ({proposalTemplates.length})</TabsTrigger>
          <TabsTrigger value="document">Document Templates ({documentTemplates.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="proposal" className="mt-6">
          {renderTemplateList(proposalTemplates)}
        </TabsContent>
        <TabsContent value="document" className="mt-6">
          {renderTemplateList(documentTemplates)}
        </TabsContent>
      </Tabs>
    </>
  );
}
