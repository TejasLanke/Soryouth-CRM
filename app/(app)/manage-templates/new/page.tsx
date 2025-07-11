
'use client';

import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/page-header';
import { TemplateEditor } from '../template-editor';
import { PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useEffect, useState } from 'react';
import { getDocumentTypes } from '@/app/(app)/settings/actions';
import type { CustomSetting } from '@/types';
import { Loader2 } from 'lucide-react';

export default function NewTemplatePage() {
  const router = useRouter();
  const [documentTypes, setDocumentTypes] = useState<CustomSetting[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
      const fetchTypes = async () => {
          setIsLoading(true);
          const types = await getDocumentTypes();
          setDocumentTypes(types);
          setIsLoading(false);
      }
      fetchTypes();
  }, []);

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center gap-4 mb-6">
        <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => router.push('/manage-templates')}>
            <ArrowLeft className="h-4 w-4" />
            <span className="sr-only">Back</span>
        </Button>
        <PageHeader title="Create New Template" icon={PlusCircle} />
      </div>
      <TemplateEditor template={null} documentTypes={documentTypes} />
    </>
  );
}
