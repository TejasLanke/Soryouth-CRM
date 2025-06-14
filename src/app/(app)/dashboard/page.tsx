
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { UsersRound, FileText, IndianRupee, TrendingUp } from 'lucide-react';

export default function DashboardPage() {
  const stats = [
    { title: 'Active Leads', value: '125', icon: UsersRound, change: '+15%', changeType: 'positive' as const },
    { title: 'Quotations Sent', value: '42', icon: FileText, change: '+5', changeType: 'positive' as const },
    { title: 'Deals Won', value: '18', icon: IndianRupee, change: '-2', changeType: 'negative' as const }, // Changed icon
    { title: 'Conversion Rate', value: '14.4%', icon: TrendingUp, change: '+1.2%', changeType: 'positive' as const },
  ];

  return (
    <>
      <PageHeader title="Dashboard" description="Welcome to Soryouth. Here's an overview of your renewable energy business." />
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className={`text-xs ${stat.changeType === 'positive' ? 'text-green-600' : 'text-red-600'}`}>
                {stat.change} from last month
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest updates and communications.</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {[
                { text: 'New lead: Mark Johnson from website.', time: '10m ago' },
                { text: 'Quotation Q-2024-042 accepted by Green Solar Ltd.', time: '1h ago' },
                { text: 'Follow-up call scheduled with Sarah Connor.', time: '3h ago' },
                { text: 'Work completion report generated for Sky High Towers.', time: 'Yesterday' },
              ].map(item => (
                <li key={item.text} className="flex justify-between text-sm">
                  <span>{item.text}</span>
                  <span className="text-muted-foreground">{item.time}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Sales Pipeline Overview</CardTitle>
            <CardDescription>Leads distribution by status.</CardDescription>
          </CardHeader>
          <CardContent>
            {/* Placeholder for a chart or pipeline visualization */}
            <div className="flex items-center justify-center h-40 bg-muted rounded-md">
              <p className="text-muted-foreground">Sales Pipeline Chart Placeholder</p>
            </div>
             <img src="https://placehold.co/600x300.png" data-ai-hint="sales pipeline" alt="Sales Pipeline Chart" className="w-full mt-4 rounded-md"/>
          </CardContent>
        </Card>
      </div>
    </>
  );
}

