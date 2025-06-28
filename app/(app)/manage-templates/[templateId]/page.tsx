
'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getTemplateById } from '../actions';
import { PageHeader } from '@/components/page-header';
import { TemplateEditor } from '../template-editor';
import { Template } from '@/types';
import { Loader2, ClipboardPaste, PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export default function TemplateEditorPage() {
  const router = useRouter();
  const params = useParams();
  const templateId = Array.isArray(params.templateId) ? params.templateId[0] : params.templateId;

  const [template, setTemplate] = useState<Template | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isNew = templateId === 'new';

  useEffect(() => {
    if (!isNew && templateId) {
      setIsLoading(true);
      getTemplateById(templateId).then(data => {
        setTemplate(data);
        setIsLoading(false);
      });
    } else {
      setIsLoading(false);
    }
  }, [templateId, isNew]);

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const pageTitle = isNew ? 'Create New Template' : `Edit: ${template?.name || 'Template'}`;
  const pageIcon = isNew ? PlusCircle : ClipboardPaste;

  return (
    <>
      <div className="flex items-center gap-4 mb-6">
        <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => router.push('/manage-templates')}>
            <ArrowLeft className="h-4 w-4" />
            <span className="sr-only">Back</span>
        </Button>
        <PageHeader title={pageTitle} icon={pageIcon} />
      </div>
      <TemplateEditor template={template} />
    </>
  );
}
