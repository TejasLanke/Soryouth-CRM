
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { UserCheck } from 'lucide-react'; // Or any relevant icon

export default function ProspectsPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {/* Icon already in PageHeader from layout */}
          Prospects
        </CardTitle>
        <CardDescription>
          This page will display potential leads or prospects that require further qualification.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center justify-center h-64 bg-muted rounded-md">
          <UserCheck className="h-16 w-16 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">Prospects list placeholder.</p>
          <p className="text-sm text-muted-foreground">Future implementation will show a filtered list of leads considered as prospects.</p>
        </div>
        <img src="https://placehold.co/1200x400.png" data-ai-hint="prospects list" alt="Prospects List" className="w-full mt-6 rounded-lg object-cover"/>
      </CardContent>
    </Card>
  );
}
