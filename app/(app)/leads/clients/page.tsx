
'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { MOCK_LEADS, LEAD_SOURCE_OPTIONS, USER_OPTIONS } from '@/lib/constants';
import type { Lead } from '@/types';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend as RechartsLegend, ResponsiveContainer, Cell, LabelList } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent, type ChartConfig } from '@/components/ui/chart';
import { TrendingUp, BarChart2, PieChart as PieChartIcon, Users } from 'lucide-react'; // Using BarChart2 for client sources
import { format, subDays, isWithinInterval, startOfDay, endOfDay, parseISO } from 'date-fns';

const COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

export default function ClientsListPage() {
  const clients = useMemo(() => MOCK_LEADS.filter(lead => lead.status === 'Deal Done'), []);

  const clientsLast30DaysData = useMemo(() => {
    const data: { date: string; count: number }[] = [];
    const today = startOfDay(new Date());
    for (let i = 29; i >= 0; i--) {
      const date = subDays(today, i);
      data.push({ date: format(date, 'MMM dd'), count: 0 });
    }

    clients.forEach(client => {
      const clientDate = parseISO(client.updatedAt); // Assuming updatedAt is when status changed to Deal Done
      const dayEntry = data.find(d => d.date === format(clientDate, 'MMM dd'));
      if (dayEntry && isWithinInterval(clientDate, { start: subDays(today, 29), end: endOfDay(today) })) {
        dayEntry.count++;
      }
    });
    return data;
  }, [clients]);

  const clientSourcesData = useMemo(() => {
    const counts: Record<string, number> = {};
    LEAD_SOURCE_OPTIONS.forEach(source => counts[source] = 0);

    clients.forEach(client => {
      if (client.source && counts[client.source] !== undefined) {
        counts[client.source]++;
      } else if (client.source) {
        counts[client.source] = 1; // Handle sources not in default options if any
      }
    });
    return Object.entries(counts)
      .map(([source, count]) => ({ source, clients: count }))
      .filter(item => item.clients > 0);
  }, [clients]);

  const userWiseClientsData = useMemo(() => {
    const counts: Record<string, number> = {};
    USER_OPTIONS.forEach(user => counts[user] = 0);

    clients.forEach(client => {
      if (client.assignedTo && counts[client.assignedTo] !== undefined) {
        counts[client.assignedTo]++;
      } else if (client.assignedTo) {
        counts[client.assignedTo] = 1;
      }
    });
    return Object.entries(counts)
      .map(([name, value], index) => ({ name, value, fill: COLORS[index % COLORS.length] }))
      .filter(item => item.value > 0);
  }, [clients]);

  const lineChartConfig: ChartConfig = {
    count: { label: 'New Clients', color: 'hsl(var(--chart-1))' },
  };
  const barChartConfig: ChartConfig = {
    clients: { label: 'Clients', color: 'hsl(var(--chart-2))' },
  };
   const pieChartConfig = useMemo(() => {
    const config: ChartConfig = {};
    userWiseClientsData.forEach(item => {
      config[item.name] = { label: item.name, color: item.fill };
    });
    return config;
  }, [userWiseClientsData]);


  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <TrendingUp className="h-6 w-6 text-primary" />
            <CardTitle>New Clients (Last 30 Days)</CardTitle>
          </div>
          <CardDescription>Number of new clients acquired daily over the past 30 days.</CardDescription>
        </CardHeader>
        <CardContent className="h-[300px] pb-0">
          {clientsLast30DaysData.length > 0 ? (
            <ChartContainer config={lineChartConfig} className="w-full h-full">
              <ResponsiveContainer>
                <LineChart data={clientsLast30DaysData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} />
                  <YAxis tickLine={false} axisLine={false} tickMargin={8} allowDecimals={false} />
                  <RechartsTooltip content={<ChartTooltipContent indicator="line" />} />
                  <ChartLegend content={<ChartLegendContent />} />
                  <Line type="monotone" dataKey="count" stroke="var(--color-count)" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
          ) : (
             <div className="flex items-center justify-center h-full text-muted-foreground">No client data in the last 30 days.</div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
                <BarChart2 className="h-6 w-6 text-primary" />
                <CardTitle>Client Sources</CardTitle>
            </div>
            <CardDescription>Distribution of clients based on their source.</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px] pb-0">
            {clientSourcesData.length > 0 ? (
                <ChartContainer config={barChartConfig} className="w-full h-full">
                <ResponsiveContainer>
                    <BarChart data={clientSourcesData} layout="vertical" margin={{ right: 20 }}>
                    <CartesianGrid horizontal={false} />
                    <YAxis dataKey="source" type="category" tickLine={false} axisLine={false} tickMargin={8} width={100} />
                    <XAxis type="number" allowDecimals={false} />
                    <RechartsTooltip content={<ChartTooltipContent />} />
                    <ChartLegend content={<ChartLegendContent />} />
                    <Bar dataKey="clients" fill="var(--color-clients)" radius={4}>
                         <LabelList dataKey="clients" position="right" offset={8} className="fill-foreground" fontSize={12} />
                    </Bar>
                    </BarChart>
                </ResponsiveContainer>
                </ChartContainer>
            ) : (
                 <div className="flex items-center justify-center h-full text-muted-foreground">No client source data available.</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
                <PieChartIcon className="h-6 w-6 text-primary" />
                <CardTitle>User-wise Clients</CardTitle>
            </div>
            <CardDescription>Client distribution among users.</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px] pb-0">
            {userWiseClientsData.length > 0 ? (
                <ChartContainer config={pieChartConfig} className="w-full h-full">
                    <ResponsiveContainer>
                    <PieChart>
                        <RechartsTooltip content={<ChartTooltipContent hideLabel />} />
                        <Pie data={userWiseClientsData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}>
                        {userWiseClientsData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                        </Pie>
                        <ChartLegend content={<ChartLegendContent />} />
                    </PieChart>
                    </ResponsiveContainer>
                </ChartContainer>
            ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">No user-wise client data available.</div>
            )}
          </CardContent>
        </Card>
      </div>
      <div className="mt-8">
        <img src="https://placehold.co/1200x300.png" data-ai-hint="clients overview charts" alt="Clients Overview" className="w-full rounded-lg object-cover"/>
      </div>
    </div>
  );
}
