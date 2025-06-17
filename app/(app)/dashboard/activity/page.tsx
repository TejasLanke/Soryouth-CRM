
'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent, type ChartConfig } from '@/components/ui/chart';
import { PieChart, Pie, Cell, Tooltip as RechartsTooltip } from 'recharts';
import { CalendarIcon, Phone, MessageSquare, Mail, Users, UserCircle, MessageCircle as MessageCircleIcon } from 'lucide-react';
import { format } from 'date-fns';
import { USER_OPTIONS } from '@/lib/constants';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

// Mock data based on the image for UI representation
const activityStatsData = [
  { type: 'Calls', count: 426, Icon: Phone, color: 'bg-blue-500 dark:bg-blue-600' },
  { type: 'Whatsapp', count: 0, Icon: MessageSquare, color: 'bg-green-500 dark:bg-green-600' },
  { type: 'SMS', count: 0, Icon: MessageSquare, color: 'bg-green-500 dark:bg-green-600' },
  { type: 'Email', count: 0, Icon: Mail, color: 'bg-green-500 dark:bg-green-600' },
  { type: 'Visits', count: 0, Icon: Users, color: 'bg-yellow-500 dark:bg-yellow-600' },
];

const activityTypeChartData = [
  { name: 'Calls', value: 426, fill: 'hsl(var(--chart-1))' },
  { name: 'Whatsapp', value: 0, fill: 'hsl(var(--chart-2))' },
  { name: 'SMS', value: 0, fill: 'hsl(var(--chart-3))' },
  { name: 'Email', value: 0, fill: 'hsl(var(--chart-4))' },
  { name: 'Visits', value: 0, fill: 'hsl(var(--chart-5))' },
];

const userActivityChartData = [
  { name: 'tejas', value: 150, fill: 'hsl(var(--chart-1))' },
  { name: 'Kanchan Nikam', value: 100, fill: 'hsl(var(--chart-2))' },
  { name: 'MAYUR', value: 120, fill: 'hsl(var(--chart-3))' },
  { name: 'Prasad mudholkar', value: 50, fill: 'hsl(var(--chart-4))' },
  { name: 'Ritesh', value: 6, fill: 'hsl(var(--chart-5))' },
];

// Sample roles for users based on image and placeholders
const teamMembers = USER_OPTIONS.map(user => {
    let role = 'User'; // Default role
    if (user === 'tejas') role = 'Support';
    else if (user === 'MAYUR') role = 'Admin';
    else if (user === 'Kanchan Nikam') role = 'User';
    else if (user === 'Prasad mudholkar') role = 'User';
    else if (user === 'Ritesh') role = 'User';
    // Surbhi panday is in image but not USER_OPTIONS, will use existing users.
    return {
        name: user,
        role: role,
        avatar: `https://placehold.co/40x40.png?text=${user.charAt(0)}`,
        avatarHint: "user avatar"
    }
}).slice(0, 6); // Display a few for the UI example

export default function ActivityPage() {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date('2025-06-10')); // Matching image

  const activityChartConfig: ChartConfig = useMemo(() => {
    const config: ChartConfig = {};
    activityTypeChartData.forEach(item => {
      config[item.name] = { label: item.name, color: item.fill };
    });
    return config;
  }, []);

  const userChartConfig: ChartConfig = useMemo(() => {
    const config: ChartConfig = {};
    userActivityChartData.forEach(item => {
      config[item.name] = { label: item.name, color: item.fill };
    });
    return config;
  }, []);


  return (
    <div className="flex flex-col lg:flex-row gap-6 h-full">
      {/* Main Content Area */}
      <div className="flex-grow lg:w-2/3 space-y-6">
        <div className="flex justify-between items-center">
          {/* Title is handled by DashboardLayout */}
          <div></div> {/* Spacer */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={"outline"}
                className="w-[200px] justify-start text-left font-normal"
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {selectedDate ? format(selectedDate, "dd-MM-yyyy") : <span>Pick a date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {activityStatsData.map((stat) => (
            <Card key={stat.type} className="shadow-md">
              <CardContent className="p-4 flex items-center gap-4">
                <div className={`flex-shrink-0 h-12 w-12 rounded-full ${stat.color} flex items-center justify-center text-white font-bold text-lg`}>
                  {stat.count}
                </div>
                <div className="flex items-center">
                  <stat.Icon className="h-5 w-5 mr-2 text-muted-foreground" />
                  <p className="text-sm font-medium text-foreground">{stat.type}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Pie Charts */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle>Activity type</CardTitle>
            </CardHeader>
            <CardContent className="h-[250px] pb-0">
              <ChartContainer config={activityChartConfig} className="w-full h-full">
                <PieChart accessibilityLayer>
                  <RechartsTooltip content={<ChartTooltipContent hideLabel />} />
                  <Pie data={activityTypeChartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} labelLine={false} label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}>
                    {activityTypeChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  {/* <ChartLegend content={<ChartLegendContent />} /> */}
                </PieChart>
              </ChartContainer>
            </CardContent>
          </Card>
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle>User</CardTitle>
            </CardHeader>
            <CardContent className="h-[250px] pb-0">
                <ChartContainer config={userChartConfig} className="w-full h-full">
                <PieChart accessibilityLayer>
                  <RechartsTooltip content={<ChartTooltipContent hideLabel />} />
                  <Pie data={userActivityChartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} labelLine={false} label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}>
                    {userActivityChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                   {/* <ChartLegend content={<ChartLegendContent nameKey="name" />} /> */}
                </PieChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Team Sidebar Area */}
      <div className="lg:w-1/3 lg:max-w-xs flex-shrink-0">
        <Card className="shadow-md h-full flex flex-col">
          <CardHeader>
            <CardTitle>Team</CardTitle>
          </CardHeader>
          <CardContent className="flex-grow overflow-hidden p-0">
            <ScrollArea className="h-full">
              <div className="p-4 space-y-4">
                {teamMembers.map(member => (
                  <div key={member.name} className="flex items-center gap-3">
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={member.avatar} data-ai-hint={member.avatarHint} alt={member.name} />
                      <AvatarFallback>{member.name.charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">{member.name}</p>
                      <p className="text-xs text-muted-foreground">{member.role}</p>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
          <div className="p-4 border-t mt-auto">
            <Button variant="ghost" className="w-full justify-center relative">
              <MessageCircleIcon className="h-8 w-8 text-primary" />
              <Badge variant="destructive" className="absolute top-0 right-1/3 -translate-y-1/2 px-1.5 py-0.5 text-xs rounded-full">1</Badge>
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
