
'use client';

import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  UsersRound, 
  Briefcase, 
  Award, 
  UserX, 
  Clock, 
  BarChart3, 
  TrendingUp, 
  PieChart, 
  Users, 
  CalendarRange, 
  Sigma,
  ListChecks
} from 'lucide-react';
import { MOCK_LEADS, MOCK_PROPOSALS } from '@/lib/constants'; // Assuming these are available client-side or fetched
import { useState, useEffect } from 'react';

// Helper function to count unique clients from proposals
const countUniqueClients = (proposals: typeof MOCK_PROPOSALS) => {
  if (!proposals || proposals.length === 0) return 0;
  const clientIds = new Set(proposals.map(p => p.clientId));
  return clientIds.size;
};

export default function DashboardPage() {
  const [dashboardData, setDashboardData] = useState({
    totalLeads: 0,
    totalClients: 0,
    dealsWon: 0,
    leadsDropped: 0,
  });

  useEffect(() => {
    // Simulating data fetching and processing for a real app
    // In a real app, this data would come from API calls
    const leads = MOCK_LEADS;
    const proposals = MOCK_PROPOSALS;

    setDashboardData({
      totalLeads: leads.length,
      totalClients: countUniqueClients(proposals),
      dealsWon: leads.filter(lead => lead.status === 'Deal Done').length,
      leadsDropped: leads.filter(lead => lead.status === 'Lost').length,
    });
  }, []);

  const topStats = [
    { title: 'Total Leads', value: dashboardData.totalLeads.toString(), icon: UsersRound, dataAiHint: "total leads count" },
    { title: 'Total Clients', value: dashboardData.totalClients.toString(), icon: Briefcase, dataAiHint: "total clients count" },
    { title: 'Deals Won', value: dashboardData.dealsWon.toString(), icon: Award, dataAiHint: "deals won count" },
    { title: 'Leads Dropped', value: dashboardData.leadsDropped.toString(), icon: UserX, dataAiHint: "leads dropped count" },
  ];

  const [attendanceStatus, setAttendanceStatus] = useState('Not Punched In');
  const [isPunchedIn, setIsPunchedIn] = useState(false);

  const handlePunchInOut = () => {
    setIsPunchedIn(!isPunchedIn);
    setAttendanceStatus(isPunchedIn ? 'Not Punched In' : 'Punched In');
    // In a real app, you'd also record the timestamp and send to backend
  };


  return (
    <>
      <PageHeader 
        title="Dashboard Overview" 
        description="Key metrics and performance indicators for Soryouth."
      />
      
      {/* Top Stats Row */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        {topStats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stat.value}</div>
              {/* <p className="text-xs text-muted-foreground">Placeholder change</p> */}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Second Row: Attendance & Leaderboards */}
      <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-3 mb-8">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              Attendance
            </CardTitle>
            <CardDescription>Track your work hours</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center space-y-3">
            <p className="text-lg">Current Status: <span className={`font-semibold ${isPunchedIn ? 'text-green-600' : 'text-red-600'}`}>{attendanceStatus}</span></p>
            <Button onClick={handlePunchInOut} className="w-full">
              {isPunchedIn ? 'Punch Out' : 'Punch In'}
            </Button>
             <img src="https://placehold.co/300x150.png" data-ai-hint="attendance tracker" alt="Attendance Tracker" className="w-full mt-4 rounded-md object-cover"/>
          </CardContent>
        </Card>

        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              Sales Leaderboard (Count)
            </CardTitle>
            <CardDescription>Top performers by number of deals closed.</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              <li className="flex justify-between"><span>1. Mayur S.</span> <span className="font-semibold">15 Deals</span></li>
              <li className="flex justify-between"><span>2. Kanchan N.</span> <span className="font-semibold">12 Deals</span></li>
              <li className="flex justify-between"><span>3. Sales Rep A</span> <span className="font-semibold">10 Deals</span></li>
            </ul>
            <img src="https://placehold.co/300x200.png" data-ai-hint="sales count leaderboard" alt="Sales Leaderboard by Count" className="w-full mt-4 rounded-md object-cover"/>
          </CardContent>
        </Card>
        
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
               Sales Leaderboard (Value)
            </CardTitle>
            <CardDescription>Top performers by total sales value.</CardDescription>
          </CardHeader>
          <CardContent>
             <ul className="space-y-2 text-sm">
              <li className="flex justify-between"><span>1. Mayur S.</span> <span className="font-semibold">₹5,50,000</span></li>
              <li className="flex justify-between"><span>2. Kanchan N.</span> <span className="font-semibold">₹4,20,000</span></li>
              <li className="flex justify-between"><span>3. Sales Rep B</span> <span className="font-semibold">₹3,80,000</span></li>
            </ul>
            <img src="https://placehold.co/300x200.png" data-ai-hint="sales value leaderboard" alt="Sales Leaderboard by Value" className="w-full mt-4 rounded-md object-cover"/>
          </CardContent>
        </Card>
      </div>

      {/* Third Row: User-Specific Charts */}
      <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2 mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5 text-primary" />
              Deals by User
            </CardTitle>
            <CardDescription>Distribution of deals closed by each user.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center h-60 bg-muted rounded-md">
               <img src="https://placehold.co/500x300.png" data-ai-hint="deals by user chart" alt="Deals by User Chart" className="w-full h-full object-contain"/>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Leads by User
            </CardTitle>
            <CardDescription>Distribution of leads assigned to each user.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center h-60 bg-muted rounded-md">
              <img src="https://placehold.co/500x300.png" data-ai-hint="leads by user chart" alt="Leads by User Chart" className="w-full h-full object-contain"/>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Fourth Row: Yearly Sales Charts */}
      <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarRange className="h-5 w-5 text-primary" />
              Yearly Sales (Value)
            </CardTitle>
            <CardDescription>Total sales value over the year.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center h-60 bg-muted rounded-md">
              <img src="https://placehold.co/500x300.png" data-ai-hint="yearly sales value chart" alt="Yearly Sales Value Chart" className="w-full h-full object-contain"/>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
             <Sigma className="h-5 w-5 text-primary" />
              Yearly Sales (Count)
            </CardTitle>
            <CardDescription>Total number of deals closed over the year.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center h-60 bg-muted rounded-md">
              <img src="https://placehold.co/500x300.png" data-ai-hint="yearly sales count chart" alt="Yearly Sales Count Chart" className="w-full h-full object-contain"/>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
