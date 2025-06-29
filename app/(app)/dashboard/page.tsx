
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
  Loader2
} from 'lucide-react';
import { useState, useEffect, useMemo } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent, type ChartConfig } from '@/components/ui/chart';
import type { Lead, Client, DroppedLead, User } from '@/types';
import { getLeads } from '@/app/(app)/leads-list/actions';
import { getDroppedLeads } from '@/app/(app)/dropped-leads-list/actions';
import { getActiveClients, getInactiveClients } from '@/app/(app)/clients-list/actions';
import { getUsers } from '@/app/(app)/users/actions';


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
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const [attendanceStatus, setAttendanceStatus] = useState('Not Punched In');
  const [isPunchedIn, setIsPunchedIn] = useState(false);

  const handlePunchInOut = () => {
    setIsPunchedIn(!isPunchedIn);
    setAttendanceStatus(isPunchedIn ? 'Not Punched In' : 'Punched In');
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
            <p className="text-lg">Current Status: <span className={`font-semibold ${isPunchedIn ? 'text-green-600' : 'text-red-600'}`}>{attendanceStatus}</span></p>
            <Button onClick={handlePunchInOut} className="w-full">
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
