
'use client';

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
  PieChart as PieChartIcon,
  Users, 
  CalendarRange, 
  Sigma,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { useState, useEffect, useMemo } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent, type ChartConfig } from '@/components/ui/chart';
import type { Lead, Client, DroppedLead, User } from '@/types';
import { getLeads } from '@/app/(app)/leads-list/actions';
import { getDroppedLeads } from '@/app/(app)/dropped-leads-list/actions';
import { getActiveClients, getInactiveClients } from '@/app/(app)/clients-list/actions';
import { getUsers } from '@/app/(app)/users/actions';
import { useToast } from '@/hooks/use-toast';
import { punchIn, punchOut, getCurrentUserAttendanceStatus } from '@/app/(app)/attendance/actions';
import { format } from 'date-fns';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';


const COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

export default function DashboardOverviewPage() {
  const [dashboardData, setDashboardData] = useState({
    totalLeads: 0,
    totalClients: 0,
    dealsWon: 0,
    leadsDropped: 0,
    dealsByUser: [] as { name: string; value: number; fill: string }[],
    leadsByUser: [] as { name: string; value: number; fill: string }[],
  });
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);

  // Attendance State
  const [isPunchedIn, setIsPunchedIn] = useState(false);
  const [punchInTime, setPunchInTime] = useState<string | null>(null);

  const refreshAttendanceStatus = async () => {
    const status = await getCurrentUserAttendanceStatus();
    setIsPunchedIn(status.isPunchedIn);
    setPunchInTime(status.punchInTime || null);
  };

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [activeLeads, droppedLeads, activeClients, inactiveClients, users] = await Promise.all([
            getLeads(),
            getDroppedLeads(),
            getActiveClients(),
            getInactiveClients(),
            getUsers(),
        ]);
        
        const userNames = users.map(u => u.name);

        const leadsByUser = userNames.map((user, index) => ({
            name: user,
            value: activeLeads.filter(lead => lead.assignedTo === user).length,
            fill: COLORS[index % COLORS.length],
        })).filter(item => item.value > 0);

        const dealsByUser = userNames.map((user, index) => ({
            name: user,
            value: activeClients.filter(client => client.assignedTo === user).length,
            fill: COLORS[index % COLORS.length],
        })).filter(item => item.value > 0);

        setDashboardData({
            totalLeads: activeLeads.length,
            totalClients: activeClients.length + inactiveClients.length,
            dealsWon: activeClients.length,
            leadsDropped: droppedLeads.length,
            leadsByUser,
            dealsByUser,
        });

        await refreshAttendanceStatus();
        
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const handlePunchInOut = () => {
    setIsProcessing(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const location = { latitude, longitude };
          
          const action = isPunchedIn ? punchOut : punchIn;
          const result = await action(location);

          if (result && result.success) {
            toast({ title: 'Success', description: `You have successfully punched ${isPunchedIn ? 'out' : 'in'}.` });
            await refreshAttendanceStatus();
          } else {
            toast({ title: 'Error', description: result?.error || 'An unknown error occurred.', variant: 'destructive' });
          }
        } catch (e) {
            console.error("Punch in/out failed:", e);
            toast({ title: 'Error', description: 'An unexpected server error occurred.', variant: 'destructive' });
        } finally {
            setIsProcessing(false);
        }
      },
      (error) => {
        toast({
          title: 'Location Error',
          description: `Could not get your location: ${error.message}. Please enable location services.`,
          variant: 'destructive',
        });
        setIsProcessing(false);
      }
    );
  };
  
  const dealsByUserChartConfig = useMemo(() => {
    const config: ChartConfig = {};
    dashboardData.dealsByUser.forEach(item => {
      config[item.name] = { label: item.name, color: item.fill };
    });
    return config;
  }, [dashboardData.dealsByUser]);

  const leadsByUserChartConfig = useMemo(() => {
    const config: ChartConfig = {};
    dashboardData.leadsByUser.forEach(item => {
      config[item.name] = { label: item.name, color: item.fill };
    });
    return config;
  }, [dashboardData.leadsByUser]);

  const topSalesPerformers = [...dashboardData.dealsByUser].sort((a,b) => b.value - a.value).slice(0, 3);
  const topLeadHandlers = [...dashboardData.leadsByUser].sort((a,b) => b.value - a.value).slice(0, 3);

  if (isLoading) {
    return (
        <div className="flex flex-1 items-center justify-center h-full">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="ml-4 text-lg text-muted-foreground">Loading Dashboard Data...</p>
        </div>
    );
  }

  const topStats = [
    { title: 'Active Leads', value: dashboardData.totalLeads.toString(), icon: UsersRound, dataAiHint: "total leads count" },
    { title: 'Total Clients', value: dashboardData.totalClients.toString(), icon: Briefcase, dataAiHint: "total clients count" },
    { title: 'Deals Won', value: dashboardData.dealsWon.toString(), icon: Award, dataAiHint: "deals won count" },
    { title: 'Leads Dropped', value: dashboardData.leadsDropped.toString(), icon: UserX, dataAiHint: "leads dropped count" },
  ];

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        {topStats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

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
             {isPunchedIn ? (
                <Alert variant="default" className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-center">
                    <AlertTitle className="text-green-800 dark:text-green-300">You are Punched In</AlertTitle>
                    <AlertDescription className="text-green-700 dark:text-green-400">
                        Punched in at: <span className="font-semibold">{punchInTime}</span>
                    </AlertDescription>
                </Alert>
             ) : (
                 <Alert variant="destructive" className="bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-center">
                    <AlertCircle className="h-4 w-4 !left-1/2 -translate-x-1/2 !top-2"/>
                    <AlertTitle className="text-red-800 dark:text-red-300 pt-4">You are Punched Out</AlertTitle>
                </Alert>
             )}
            <Button onClick={handlePunchInOut} className="w-full" disabled={isProcessing}>
                {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : null}
                {isPunchedIn ? 'Punch Out' : 'Punch In'}
            </Button>
          </CardContent>
        </Card>

        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              Deals Won Leaderboard
            </CardTitle>
            <CardDescription>Top performers by number of deals closed.</CardDescription>
          </CardHeader>
          <CardContent>
            {topSalesPerformers.length > 0 ? (
                <ul className="space-y-2 text-sm">
                    {topSalesPerformers.map((user, index) => (
                         <li key={user.name} className="flex justify-between"><span>{index + 1}. {user.name}</span> <span className="font-semibold">{user.value} Deals</span></li>
                    ))}
                </ul>
            ) : <p className="text-sm text-muted-foreground">No deal data available.</p>}
          </CardContent>
        </Card>
        
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
               Lead Assignment Leaderboard
            </CardTitle>
            <CardDescription>Top users by number of assigned active leads.</CardDescription>
          </CardHeader>
          <CardContent>
             {topLeadHandlers.length > 0 ? (
                <ul className="space-y-2 text-sm">
                    {topLeadHandlers.map((user, index) => (
                        <li key={user.name} className="flex justify-between"><span>{index + 1}. {user.name}</span> <span className="font-semibold">{user.value} Leads</span></li>
                    ))}
                </ul>
             ) : <p className="text-sm text-muted-foreground">No lead assignment data available.</p>}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2 mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChartIcon className="h-5 w-5 text-primary" />
              Deals by User
            </CardTitle>
            <CardDescription>Distribution of deals closed by each user.</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            {dashboardData.dealsByUser.length > 0 ? (
              <ChartContainer config={dealsByUserChartConfig} className="h-full w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Tooltip content={<ChartTooltipContent hideLabel />} />
                    <Pie data={dashboardData.dealsByUser} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                      {dashboardData.dealsByUser.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <ChartLegend content={<ChartLegendContent />} />
                  </PieChart>
                </ResponsiveContainer>
              </ChartContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">No deal data to display.</div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Active Leads by User
            </CardTitle>
            <CardDescription>Distribution of active leads assigned to each user.</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
             {dashboardData.leadsByUser.length > 0 ? (
              <ChartContainer config={leadsByUserChartConfig} className="h-full w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Tooltip content={<ChartTooltipContent hideLabel />} />
                    <Pie data={dashboardData.leadsByUser} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                      {dashboardData.leadsByUser.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <ChartLegend content={<ChartLegendContent />} />
                  </PieChart>
                </ResponsiveContainer>
              </ChartContainer>
            ) : (
               <div className="flex items-center justify-center h-full text-muted-foreground">No lead assignment data to display.</div>
            )}
          </CardContent>
        </Card>
      </div>
      
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
