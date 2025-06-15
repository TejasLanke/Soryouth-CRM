import { PageHeader } from '@/components/page-header';
import { WandSparkles } from 'lucide-react';
import { DocumentCustomizerForm } from './customizer-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function DocumentCustomizerPage() {
  return (
    <>
      <PageHeader
        title="AI Document Customizer"
        description="Use AI to modify document templates based on your instructions. Provide the original template and instructions to get a customized version."
        icon={WandSparkles}
      />
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Customize Your Template</CardTitle>
          <CardDescription>
            Enter your existing document template and specify the changes you need. Our AI will generate the modified template for you.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DocumentCustomizerForm />
        </CardContent>
      </Card>
       <Card className="mt-8">
        <CardHeader>
            <CardTitle>How it Works</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
            <div className="flex items-start gap-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground">1</div>
                <div>
                    <h4 className="font-semibold">Paste Your Template</h4>
                    <p className="text-sm text-muted-foreground">Copy and paste your existing document template into the "Original Template" field.</p>
                </div>
            </div>
            <div className="flex items-start gap-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground">2</div>
                <div>
                    <h4 className="font-semibold">Provide Instructions</h4>
                    <p className="text-sm text-muted-foreground">Clearly describe the changes you want to make in the "Customization Instructions" field. Be specific for best results.</p>
                </div>
            </div>
            <div className="flex items-start gap-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground">3</div>
                <div>
                    <h4 className="font-semibold">Generate & Review</h4>
                    <p className="text-sm text-muted-foreground">Click "Customize Template". The AI will process your request and display the "Modified Template". Review and use it as needed.</p>
                </div>
            </div>
             <img src="https://placehold.co/600x300.png" data-ai-hint="AI document editing" alt="AI Document Customization Process" className="w-full mt-4 rounded-md object-cover"/>
        </CardContent>
      </Card>
    </>
  );
}
