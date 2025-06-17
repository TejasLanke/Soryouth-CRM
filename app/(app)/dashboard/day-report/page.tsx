
'use client';

import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MOCK_LEADS, MOCK_PROPOSALS, MOCK_COMMUNICATIONS, USER_OPTIONS } from '@/lib/constants';
import type { Lead, Proposal, Communication } from '@/types';
import { format, parseISO, isWithinInterval, startOfDay, endOfDay, subDays } from 'date-fns';
import type { DateRange } from 'react-day-picker';
import { CalendarIcon, Users, UserX, FileText, Award, Phone, BellRing, TrendingDown, TrendingUp, LineChart as LineChartIcon, Filter } from 'lucide-react';
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent, type ChartConfig } from '@/components/ui/chart';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend as RechartsLegend, ResponsiveContainer } from 'recharts';
import { cn } from '@/lib/utils';


const initialDateRange: DateRange = {
  from: subDays(new Date(), 7),
  to: new Date(),
};

interface DayReportStats {
  leadsCreated: number;
  leadsDropped: number;
  proposalsCreated: number;
  dealsWon: number;
  dealsLost: number; // Same as leadsDropped for this context
  followUps: number;
  calls: number; // Placeholder
  reminders: number; // Placeholder
  chartData: { date: string; created: number; dropped: number }[];
  droppedLeadsDetails: Lead[];
  wonDealsDetails: Lead[];
}

export default function DayReportPage() {
  const [dateRange, setDateRange] = useState<DateRange | undefined>(initialDateRange);
  const [selectedUser, setSelectedUser] = useState<string>('all');
  const [reportStats, setReportStats] = useState<DayReportStats | null>(null);

  const handleApplyFilters = () => {
    const fromDate = dateRange?.from ? startOfDay(dateRange.from) : undefined;
    const toDate = dateRange?.to ? endOfDay(dateRange.to) : undefined;

    const filteredLeads = MOCK_LEADS.filter(lead => {
      const leadDate = parseISO(lead.createdAt);
      const userMatch = selectedUser === 'all' || lead.assignedTo === selectedUser;
      const dateMatch = fromDate && toDate ? isWithinInterval(leadDate, { start: fromDate, end: toDate }) : true;
      return userMatch && dateMatch;
    });
    
    const filteredProposals = MOCK_PROPOSALS.filter(proposal => {
      const proposalDate = parseISO(proposal.createdAt);
       // Assuming proposals might not have assignedTo directly, or we filter by client's leads' assignee.
       // For simplicity, if a user is selected, we might need to cross-reference or apply user filter differently for proposals.
       // Here, I'm just filtering by date for proposals.
      const dateMatch = fromDate && toDate ? isWithinInterval(proposalDate, { start: fromDate, end: toDate }) : true;
      return dateMatch; 
    });

    const leadsCreated = filteredLeads.length;
    const leadsDroppedList = filteredLeads.filter(lead => lead.status === 'Lost');
    const leadsDropped = leadsDroppedList.length;
    const dealsWonList = filteredLeads.filter(lead => lead.status === 'Deal Done');
    const dealsWon = dealsWonList.length;
    
    const followUps = filteredLeads.filter(lead => {
        if (!lead.nextFollowUpDate) return false;
        const followupDate = parseISO(lead.nextFollowUpDate);
        return fromDate && toDate ? isWithinInterval(followupDate, { start: fromDate, end: toDate }) : true;
    }).length;

    // Chart Data - simplified daily aggregation for Leads Created vs Dropped
    const dailyChartData: { [date: string]: { created: number; dropped: number } } = {};
    if(fromDate && toDate) {
        for (let d = new Date(fromDate); d <= toDate; d.setDate(d.getDate() + 1)) {
            const dateStr = format(d, 'MMM dd');
            dailyChartData[dateStr] = { created: 0, dropped: 0 };
        }
    }

    filteredLeads.forEach(lead => {
        const createdDateStr = format(parseISO(lead.createdAt), 'MMM dd');
        if (dailyChartData[createdDateStr]) {
            dailyChartData[createdDateStr].created++;
        }
        if (lead.status === 'Lost') {
            const droppedDateStr = format(parseISO(lead.updatedAt), 'MMM dd');
            if (dailyChartData[droppedDateStr]) {
                dailyChartData[droppedDateStr].dropped++;
            }
        }
    });
    
    const chartDataFinal = Object.entries(dailyChartData).map(([date, counts]) => ({ date, ...counts }));
    
    setReportStats({
      leadsCreated,
      leadsDropped,
      proposalsCreated: filteredProposals.length, // Based on proposals created in range
      dealsWon,
      dealsLost: leadsDropped,
      followUps,
      calls: 0, // Placeholder
      reminders: 0, // Placeholder
      chartData: chartDataFinal.sort((a,b) => parseISO(a.date).getTime() - parseISO(b.date).getTime()), // Ensure chronological for chart
      droppedLeadsDetails: leadsDroppedList.slice(0, 5), // Show top 5 recent
      wonDealsDetails: dealsWonList.slice(0, 5), // Show top 5 recent
    });
  };

  useEffect(() => {
    // Initial report generation
    handleApplyFilters();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run once on mount

  const statCards = reportStats ? [
    { title: 'Leads Created', value: reportStats.leadsCreated, icon: Users, trend: 'neutral' },
    { title: 'Leads Dropped', value: reportStats.leadsDropped, icon: UserX, trend: 'neutral' },
    { title: 'Proposals Created', value: reportStats.proposalsCreated, icon: FileText, trend: 'neutral' },
    { title: 'Deals Won', value: reportStats.dealsWon, icon: Award, trend: 'positive' },
    { title: 'Follow-ups Scheduled', value: reportStats.followUps, icon: BellRing, trend: 'neutral' },
    { title: 'Calls Made', value: reportStats.calls, icon: Phone, trend: 'neutral' },
  ] : [];

  const lineChartConfig: ChartConfig = {
    created: { label: 'Leads Created', color: 'hsl(var(--chart-2))' },
    dropped: { label: 'Leads Dropped', color: 'hsl(var(--chart-5))' },
  };


  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>Select date range and user to generate the report.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col sm:flex-row gap-4 items-end">
          <div className="grid gap-2">
            <label htmlFor="date-range" className="text-sm font-medium">Date Range</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  id="date-range"
                  variant={"outline"}
                  className={cn(
                    "w-[260px] justify-start text-left font-normal",
                    !dateRange && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateRange?.from ? (
                    dateRange.to ? (
                      <>
                        {format(dateRange.from, "LLL dd, y")} -{" "}
                        {format(dateRange.to, "LLL dd, y")}
                      </>
                    ) : (
                      format(dateRange.from, "LLL dd, y")
                    )
                  ) : (
                    <span>Pick a date range</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  initialFocus
                  mode="range"
                  defaultMonth={dateRange?.from}
                  selected={dateRange}
                  onSelect={setDateRange}
                  numberOfMonths={2}
                />
              </PopoverContent>
            </Popover>
          </div>
          <div className="grid gap-2">
            <label htmlFor="user-select" className="text-sm font-medium">User</label>
            <Select value={selectedUser} onValueChange={setSelectedUser}>
              <SelectTrigger id="user-select" className="w-[180px]">
                <SelectValue placeholder="Select User" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Users</SelectItem>
                {USER_OPTIONS.map(user => (
                  <SelectItem key={user} value={user}>{user}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={handleApplyFilters} className="sm:ml-auto">
             <Filter className="mr-2 h-4 w-4" /> Apply Filters
          </Button>
        </CardContent>
      </Card>

      {reportStats ? (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            {statCards.map(stat => (
              <Card key={stat.title}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                  <stat.icon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stat.value}</div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <LineChartIcon className="h-5 w-5 text-primary" />
                Leads Created vs. Dropped
              </CardTitle>
              <CardDescription>Trend of leads created and dropped over the selected period.</CardDescription>
            </CardHeader>
            <CardContent className="h-[350px]">
              <ChartContainer config={lineChartConfig} className="w-full h-full">
                <ResponsiveContainer>
                  <LineChart data={reportStats.chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} />
                    <YAxis tickLine={false} axisLine={false} tickMargin={8} allowDecimals={false} />
                    <RechartsTooltip content={<ChartTooltipContent indicator="line" />} />
                    <ChartLegend content={<ChartLegendContent />} />
                    <Line type="monotone" dataKey="created" stroke="var(--color-created)" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="dropped" stroke="var(--color-dropped)" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>

          <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Recently Dropped Leads</CardTitle>
                <CardDescription>Details of the latest leads marked as 'Lost'.</CardDescription>
              </CardHeader>
              <CardContent>
                {reportStats.droppedLeadsDetails.length > 0 ? (
                  <ul className="space-y-3">
                    {reportStats.droppedLeadsDetails.map(lead => (
                      <li key={lead.id} className="text-sm p-2 border rounded-md bg-muted/30">
                        <p className="font-medium">{lead.name} <span className="text-xs text-muted-foreground">({lead.phone || 'N/A'})</span></p>
                        <p>Dropped on: {format(parseISO(lead.updatedAt), 'dd MMM, yyyy')}</p>
                        <p>Reason: {lead.dropReason || 'Not specified'}</p>
                        <p className="text-xs text-muted-foreground">Assigned to: {lead.assignedTo || 'N/A'}</p>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground">No leads dropped in this period/filter.</p>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Recently Won Deals</CardTitle>
                <CardDescription>Details of the latest leads marked as 'Deal Done'.</CardDescription>
              </CardHeader>
              <CardContent>
                 {reportStats.wonDealsDetails.length > 0 ? (
                  <ul className="space-y-3">
                    {reportStats.wonDealsDetails.map(lead => (
                      <li key={lead.id} className="text-sm p-2 border rounded-md bg-muted/30">
                        <p className="font-medium">{lead.name} <span className="text-xs text-muted-foreground">({lead.phone || 'N/A'})</span></p>
                        <p>Won on: {format(parseISO(lead.updatedAt), 'dd MMM, yyyy')}</p>
                        <p>Kilowatt: {lead.kilowatt || 'N/A'} kW</p>
                         <p className="text-xs text-muted-foreground">Assigned to: {lead.assignedTo || 'N/A'}</p>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground">No deals won in this period/filter.</p>
                )}
              </CardContent>
            </Card>
          </div>

        </>
      ) : (
        <Card>
          <CardContent className="pt-6 text-center text-muted-foreground">
            <p>Select filters and click "Apply" to view the report.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
