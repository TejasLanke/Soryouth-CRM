import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MOCK_COMMUNICATIONS } from '@/lib/constants';
import type { Communication } from '@/types';
import { MessageSquareText, Mail, Phone, Users, AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const CommunicationIcon = ({ type }: { type: Communication['type'] }) => {
  switch (type) {
    case 'Email': return <Mail className="h-5 w-5 text-primary" />;
    case 'Call': return <Phone className="h-5 w-5 text-green-500" />;
    case 'SMS': return <MessageSquareText className="h-5 w-5 text-blue-500" />; // Assuming SMS is like a message
    case 'Meeting': return <Users className="h-5 w-5 text-purple-500" />;
    case 'System Alert': return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
    default: return <MessageSquareText className="h-5 w-5 text-muted-foreground" />;
  }
};

export default function CommunicationsPage() {
  const communications = MOCK_COMMUNICATIONS;

  return (
    <>
      <PageHeader
        title="Communication History"
        description="View all customer communications and system alerts."
        icon={MessageSquareText}
      />
      <div className="space-y-6">
        {communications.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center text-muted-foreground">
                <MessageSquareText className="mx-auto h-12 w-12 mb-4" />
                <h3 className="text-xl font-semibold mb-2">No Communications Yet</h3>
                <p>All communications with leads and customers will appear here.</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          communications.map((comm) => (
            <Card key={comm.id} className="shadow-sm">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <CommunicationIcon type={comm.type} />
                        <CardTitle className="text-lg font-headline">{comm.subject || comm.type}</CardTitle>
                    </div>
                    <Badge variant={comm.direction === 'Outgoing' ? 'secondary' : 'outline'}>
                        {comm.direction}
                    </Badge>
                </div>
                <CardDescription>
                  Lead ID: {comm.leadId} | Recorded by: {comm.recordedBy || 'System'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-foreground mb-2">{comm.content}</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(comm.timestamp).toLocaleString()}
                </p>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </>
  );
}
