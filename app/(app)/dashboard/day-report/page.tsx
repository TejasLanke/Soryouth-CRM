
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
import { CalendarIcon, Users, UserX, FileText, Award, Phone, BellRing, TrendingDown, TrendingUp, LineChart as LineChartIcon, Filter, UserCircle2 } from 'lucide-react';
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent, type ChartConfig } from '@/components/ui/chart';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend as RechartsLegend, ResponsiveContainer } from 'recharts';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';


const initialDateRange: DateRange = {
  from: subDays(new Date(), 7),
  to: new Date(),
};

interface UserReportRow {
  userId: string;
  userName: string;
  avatarUrl?: string; // Placeholder for avatar
  leadsCreated: number;
  leadsDropped: number;
  dealsCreated: number; // proposals created
  dealsWon: number;
  dealsLost: number;
  followUps: number;
  calls: number;
  callDuration: string; // e.g., "0h 0m"
  reminders: number;
}

interface DayReportStats {
  leadsCreated: number;
  leadsDropped: number;
  proposalsCreated: number;
  dealsWon: number;
  dealsLost: number;
  followUps: number;
  calls: number;
  reminders: number;
  chartData: { date: string; created: number; dropped: number }[];
  droppedLeadsDetails: Lead[];
  wonDealsDetails: Lead[];
  userWiseSummary: UserReportRow[];
}

export default function DayReportPage() {
  const [dateRange, setDateRange] = useState<DateRange | undefined>(initialDateRange);
  const [selectedUserFilter, setSelectedUserFilter] = useState<string>('all'); // For top-level filter
  const [reportStats, setReportStats] = useState<DayReportStats | null>(null);

  const handleApplyFilters = () => {
    const fromDate = dateRange?.from ? startOfDay(dateRange.from) : undefined;
    const toDate = dateRange?.to ? endOfDay(dateRange.to) : undefined;

    // Filter leads based on main page filters (date and selectedUserFilter)
    const pageFilteredLeads = MOCK_LEADS.filter(lead => {
      const leadDate = parseISO(lead.createdAt);
      const userMatch = selectedUserFilter === 'all' || lead.assignedTo === selectedUserFilter;
      const dateMatch = fromDate && toDate ? isWithinInterval(leadDate, { start: fromDate, end: toDate }) : true;
      return userMatch && dateMatch;
    });
    
    const pageFilteredProposals = MOCK_PROPOSALS.filter(proposal => {
      const proposalDate = parseISO(proposal.createdAt);
      const dateMatch = fromDate && toDate ? isWithinInterval(proposalDate, { start: fromDate, end: toDate }) : true;
      // Further filter proposals if a specific user is selected for the main report
      if (selectedUserFilter !== 'all') {
        const clientLead = MOCK_LEADS.find(l => l.id === proposal.clientId);
        return dateMatch && clientLead?.assignedTo === selectedUserFilter;
      }
      return dateMatch;
    });

    const leadsCreated = pageFilteredLeads.length;
    const leadsDroppedList = pageFilteredLeads.filter(lead => lead.status === 'Lost' && fromDate && toDate && isWithinInterval(parseISO(lead.updatedAt), {start: fromDate, end: toDate}));
    const leadsDropped = leadsDroppedList.length;
    const dealsWonList = pageFilteredLeads.filter(lead => lead.status === 'Deal Done' && fromDate && toDate && isWithinInterval(parseISO(lead.updatedAt), {start: fromDate, end: toDate}));
    const dealsWon = dealsWonList.length;
    
    const followUps = pageFilteredLeads.filter(lead => {
        if (!lead.nextFollowUpDate) return false;
        const followupDate = parseISO(lead.nextFollowUpDate);
        return fromDate && toDate ? isWithinInterval(followupDate, { start: fromDate, end: toDate }) : true;
    }).length;

    const dailyChartData: { [date: string]: { created: number; dropped: number } } = {};
    if(fromDate && toDate) {
        for (let d = new Date(fromDate); d <= toDate; d.setDate(d.getDate() + 1)) {
            const dateStr = format(d, 'MMM dd');
            dailyChartData[dateStr] = { created: 0, dropped: 0 };
        }
    }

    pageFilteredLeads.forEach(lead => {
        const createdDateStr = format(parseISO(lead.createdAt), 'MMM dd');
        if (dailyChartData[createdDateStr]) {
            dailyChartData[createdDateStr].created++;
        }
        if (lead.status === 'Lost' && fromDate && toDate && isWithinInterval(parseISO(lead.updatedAt), {start: fromDate, end: toDate})) {
            const droppedDateStr = format(parseISO(lead.updatedAt), 'MMM dd');
            if (dailyChartData[droppedDateStr]) {
                dailyChartData[droppedDateStr].dropped++;
            }
        }
    });
    
    const chartDataFinal = Object.entries(dailyChartData).map(([date, counts]) => ({ date, ...counts })).sort((a, b) => parseISO(a.date + ' ' + new Date().getFullYear()).getTime() - parseISO(b.date + ' ' + new Date().getFullYear()).getTime());

    // User-wise summary calculation
    const userWiseSummaryData: UserReportRow[] = USER_OPTIONS.map(user => {
        const userLeads = MOCK_LEADS.filter(lead => lead.assignedTo === user);
        
        const userLeadsCreatedInRange = userLeads.filter(lead => 
            fromDate && toDate && isWithinInterval(parseISO(lead.createdAt), { start: fromDate, end: toDate })
        ).length;

        const userLeadsDroppedInRange = userLeads.filter(lead => 
            lead.status === 'Lost' && fromDate && toDate && isWithinInterval(parseISO(lead.updatedAt), { start: fromDate, end: toDate })
        ).length;

        const userDealsWonInRange = userLeads.filter(lead =>
            lead.status === 'Deal Done' && fromDate && toDate && isWithinInterval(parseISO(lead.updatedAt), { start: fromDate, end: toDate })
        ).length;
        
        const userProposalsCreatedInRange = MOCK_PROPOSALS.filter(proposal => {
            const clientLead = MOCK_LEADS.find(l => l.id === proposal.clientId);
            return clientLead?.assignedTo === user && fromDate && toDate && isWithinInterval(parseISO(proposal.createdAt), { start: fromDate, end: toDate });
        }).length;

        const userFollowUpsInRange = userLeads.filter(lead => 
            lead.nextFollowUpDate && fromDate && toDate && isWithinInterval(parseISO(lead.nextFollowUpDate), { start: fromDate, end: toDate })
        ).length;

        return {
            userId: user,
            userName: user,
            avatarUrl: `https://placehold.co/32x32.png?text=${user.charAt(0)}`, // Simple placeholder
            leadsCreated: userLeadsCreatedInRange,
            leadsDropped: userLeadsDroppedInRange,
            dealsCreated: userProposalsCreatedInRange, // Proposals created
            dealsWon: userDealsWonInRange,
            dealsLost: userLeadsDroppedInRange, // Same as leads dropped
            followUps: userFollowUpsInRange,
            calls: 0, // Placeholder
            callDuration: "0h 0m", // Placeholder
            reminders: 0, // Placeholder
        };
    });
    
    setReportStats({
      leadsCreated,
      leadsDropped,
      proposalsCreated: pageFilteredProposals.length,
      dealsWon,
      dealsLost: leadsDropped,
      followUps,
      calls: 0, 
      reminders: 0, 
      chartData: chartDataFinal,
      droppedLeadsDetails: leadsDroppedList.slice(0, 5),
      wonDealsDetails: dealsWonList.slice(0, 5),
      userWiseSummary: userWiseSummaryData,
    });
  };

  useEffect(() => {
    handleApplyFilters();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const statCards = reportStats ? [
    { title: 'Leads Created', value: reportStats.leadsCreated, icon: Users, trend: 'neutral' },
    { title: 'Leads Dropped', value: reportStats.leadsDropped, icon: UserX, trend: 'neutral' },
    { title: 'Proposals Created', value: reportStats.proposalsCreated, icon: FileText, trend: 'neutral' },
    { title: 'Deals Won', value: reportStats.dealsWon, icon: Award, trend: 'positive' },
    { title: 'Follow-ups Scheduled', value: reportStats.followUps, icon: BellRing, trend: 'neutral' },
    { title: 'Calls Made', value: reportStats.calls, icon: Phone, trend: 'neutral' },
  ] : [];

  const lineChartConfig: ChartConfig = {
    created: { label: 'Leads Created', color: 'hsl(var(--secondary))' }, // Changed to secondary color (green)
    dropped: { label: 'Leads Dropped', color: 'hsl(var(--chart-5))' }, // Kept as red-ish
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
            <Select value={selectedUserFilter} onValueChange={setSelectedUserFilter}>
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

          <Card>
            <CardHeader>
              <CardTitle>User-wise report</CardTitle>
              <CardDescription>Performance summary for each user in the selected period.</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead className="text-center">Leads Created</TableHead>
                    <TableHead className="text-center">Leads Dropped</TableHead>
                    <TableHead className="text-center">Proposals Created</TableHead>
                    <TableHead className="text-center">Deals Won</TableHead>
                    <TableHead className="text-center">Deals Lost</TableHead>
                    <TableHead className="text-center">Follow-ups</TableHead>
                    <TableHead className="text-center">Calls</TableHead>
                    <TableHead className="text-center">Call Duration</TableHead>
                    <TableHead className="text-center">Reminders</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reportStats.userWiseSummary.length > 0 ? reportStats.userWiseSummary.map(userStat => (
                    <TableRow key={userStat.userId}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={userStat.avatarUrl} data-ai-hint="user avatar" alt={userStat.userName} />
                            <AvatarFallback>{userStat.userName.charAt(0).toUpperCase()}</AvatarFallback>
                          </Avatar>
                          <span className="font-medium">{userStat.userName}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        {userStat.leadsCreated > 0 ? <Badge variant="default">{userStat.leadsCreated}</Badge> : userStat.leadsCreated}
                      </TableCell>
                      <TableCell className="text-center">
                        {userStat.leadsDropped > 0 ? <Badge variant="destructive">{userStat.leadsDropped}</Badge> : userStat.leadsDropped}
                      </TableCell>
                       <TableCell className="text-center">
                        {userStat.dealsCreated > 0 ? <Badge variant="default">{userStat.dealsCreated}</Badge> : userStat.dealsCreated}
                      </TableCell>
                      <TableCell className="text-center">
                        {userStat.dealsWon > 0 ? <Badge variant="default">{userStat.dealsWon}</Badge> : userStat.dealsWon}
                      </TableCell>
                      <TableCell className="text-center">
                         {userStat.dealsLost > 0 ? <Badge variant="destructive">{userStat.dealsLost}</Badge> : userStat.dealsLost}
                      </TableCell>
                      <TableCell className="text-center">
                        {userStat.followUps > 0 ? <Badge variant="default">{userStat.followUps}</Badge> : userStat.followUps}
                      </TableCell>
                      <TableCell className="text-center">
                        {userStat.calls > 0 ? <Badge variant="default">{userStat.calls}</Badge> : userStat.calls}
                      </TableCell>
                      <TableCell className="text-center">
                        {userStat.callDuration !== "0h 0m" ? <Badge variant="default">{userStat.callDuration}</Badge> : userStat.callDuration}
                      </TableCell>
                      <TableCell className="text-center">
                        {userStat.reminders > 0 ? <Badge variant="default">{userStat.reminders}</Badge> : userStat.reminders}
                      </TableCell>
                    </TableRow>
                  )) : (
                    <TableRow>
                        <TableCell colSpan={10} className="text-center text-muted-foreground">
                            No user data to display for the selected filters.
                        </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

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

