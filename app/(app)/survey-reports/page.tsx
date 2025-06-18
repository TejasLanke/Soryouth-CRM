
'use client';

import { useMemo } from 'react';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, PieChart, Pie, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Cell, Legend as RechartsLegend, LabelList } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent, type ChartConfig } from '@/components/ui/chart';
import { ClipboardList, CalendarDays, MapPin, Building, Home, Sun } from 'lucide-react';
import { format, subDays, isWithinInterval, startOfDay, endOfDay, parseISO } from 'date-fns';

const COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

// Mock Survey Data
const MOCK_SURVEYS = [
  { id: 'survey1', date: subDays(new Date(), 5).toISOString(), location: 'Pune', type: 'Commercial', surveyor: 'Mayur' },
  { id: 'survey2', date: subDays(new Date(), 10).toISOString(), location: 'Mumbai', type: 'Residential', surveyor: 'Kanchan Nikam' },
  { id: 'survey3', date: subDays(new Date(), 15).toISOString(), location: 'Pune', type: 'Industrial', surveyor: 'Tejas' },
  { id: 'survey4', date: subDays(new Date(), 20).toISOString(), location: 'Nagpur', type: 'Residential', surveyor: 'Ritesh' },
  { id: 'survey5', date: subDays(new Date(), 25).toISOString(), location: 'Mumbai', type: 'Commercial', surveyor: 'Mayur' },
  { id: 'survey6', date: subDays(new Date(), 35).toISOString(), location: 'Pune', type: 'Residential', surveyor: 'Kanchan Nikam' }, // Older than 30 days
  { id: 'survey7', date: subDays(new Date(), 2).toISOString(), location: 'Satara', type: 'Commercial', surveyor: 'Prasad mudholkar' },
  { id: 'survey8', date: subDays(new Date(), 8).toISOString(), location: 'Pune', type: 'Commercial', surveyor: 'Tejas' },
  { id: 'survey9', date: subDays(new Date(), 12).toISOString(), location: 'Mumbai', type: 'Industrial', surveyor: 'Mayur' },
  { id: 'survey10', date: subDays(new Date(), 18).toISOString(), location: 'Nagpur', type: 'Residential', surveyor: 'Ritesh' },
];

type SurveyType = 'Commercial' | 'Industrial' | 'Residential';
const SURVEY_TYPES: SurveyType[] = ['Commercial', 'Industrial', 'Residential'];

export default function SurveyReportsPage() {
  const surveysInLast30Days = useMemo(() => {
    const today = startOfDay(new Date());
    const thirtyDaysAgo = startOfDay(subDays(today, 29)); // include today
    return MOCK_SURVEYS.filter(survey => {
      const surveyDate = parseISO(survey.date);
      return isWithinInterval(surveyDate, { start: thirtyDaysAgo, end: endOfDay(today) });
    });
  }, []);

  const locationDistributionData = useMemo(() => {
    const counts: Record<string, number> = {};
    surveysInLast30Days.forEach(survey => {
      counts[survey.location] = (counts[survey.location] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([location, count]) => ({ location, surveys: count }))
      .sort((a, b) => b.surveys - a.surveys);
  }, [surveysInLast30Days]);

  const typeDistributionData = useMemo(() => {
    const counts: Record<SurveyType, number> = { Commercial: 0, Industrial: 0, Residential: 0 };
    surveysInLast30Days.forEach(survey => {
      counts[survey.type]++;
    });
    return SURVEY_TYPES.map((type, index) => ({
      name: type,
      value: counts[type],
      fill: COLORS[index % COLORS.length],
    })).filter(item => item.value > 0);
  }, [surveysInLast30Days]);

  const locationChartConfig: ChartConfig = {
    surveys: { label: 'Surveys', color: 'hsl(var(--chart-1))' },
  };

  const typeChartConfig = useMemo(() => {
    const config: ChartConfig = {};
    typeDistributionData.forEach(item => {
      config[item.name] = { label: item.name, color: item.fill };
    });
    return config;
  }, [typeDistributionData]);


  const SurveyTypeIcon = ({ type }: { type: SurveyType }) => {
    switch (type) {
      case 'Commercial': return <Building className="h-4 w-4 text-muted-foreground" />;
      case 'Industrial': return <Sun className="h-4 w-4 text-muted-foreground" />; // Using Sun as placeholder for industrial
      case 'Residential': return <Home className="h-4 w-4 text-muted-foreground" />;
      default: return <ClipboardList className="h-4 w-4 text-muted-foreground" />;
    }
  };

  return (
    <>
      <PageHeader
        title="Survey Reports"
        description="Overview of recent survey activities, distributions by location and type."
        icon={ClipboardList}
      />

      <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-3 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Surveys (Last 30 Days)</CardTitle>
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{surveysInLast30Days.length}</div>
            <p className="text-xs text-muted-foreground">
              Total surveys conducted in the past 30 days.
            </p>
          </CardContent>
        </Card>
        {/* Add more stat cards if needed */}
      </div>

      <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-primary" />
                <CardTitle>Location-wise Distribution</CardTitle>
            </div>
            <CardDescription>Number of surveys conducted per location in the last 30 days.</CardDescription>
          </CardHeader>
          <CardContent className="h-[350px] pb-0">
            {locationDistributionData.length > 0 ? (
              <ChartContainer config={locationChartConfig} className="w-full h-full">
                <ResponsiveContainer>
                  <BarChart data={locationDistributionData} layout="vertical" margin={{ right: 30, left: 10 }}>
                    <CartesianGrid horizontal={false} />
                    <XAxis type="number" allowDecimals={false} />
                    <YAxis dataKey="location" type="category" tickLine={false} axisLine={false} tickMargin={8} width={80} />
                    <RechartsTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="surveys" fill="var(--color-surveys)" radius={[0, 4, 4, 0]} barSize={30}>
                        <LabelList dataKey="surveys" position="right" offset={8} className="fill-foreground" fontSize={12} />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">No survey data for location distribution.</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
                <ClipboardList className="h-5 w-5 text-primary" />
                <CardTitle>Type-wise Distribution</CardTitle>
            </div>
            <CardDescription>Breakdown of surveys by type (Commercial, Industrial, Residential) in the last 30 days.</CardDescription>
          </CardHeader>
          <CardContent className="h-[350px] pb-0">
            {typeDistributionData.length > 0 ? (
              <ChartContainer config={typeChartConfig} className="w-full h-full">
                <ResponsiveContainer>
                  <PieChart>
                    <RechartsTooltip content={<ChartTooltipContent hideLabel />} />
                    <Pie data={typeDistributionData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} labelLine={false} label={({ name, percent, value }) => `${name}: ${value} (${(percent * 100).toFixed(0)}%)`}>
                      {typeDistributionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <RechartsLegend content={<ChartLegendContent nameKey="name" />} />
                  </PieChart>
                </ResponsiveContainer>
              </ChartContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">No survey data for type distribution.</div>
            )}
          </CardContent>
        </Card>
      </div>
      
      <Card className="mt-6">
        <CardHeader>
            <CardTitle>Recent Surveys List (Last 30 Days)</CardTitle>
            <CardDescription>A quick look at the most recent surveys.</CardDescription>
        </CardHeader>
        <CardContent>
            {surveysInLast30Days.length > 0 ? (
                <div className="space-y-3">
                    {surveysInLast30Days.slice(0, 5).map(survey => ( // Display top 5 recent
                        <div key={survey.id} className="flex items-center justify-between p-3 border rounded-md hover:bg-muted/50">
                            <div>
                                <p className="font-medium text-sm">Survey ID: {survey.id}</p>
                                <p className="text-xs text-muted-foreground">
                                    <MapPin className="inline h-3 w-3 mr-1"/>{survey.location} - 
                                    <SurveyTypeIcon type={survey.type as SurveyType}/> {survey.type}
                                </p>
                            </div>
                            <div className="text-right">
                                <p className="text-sm">{format(parseISO(survey.date), "dd MMM, yyyy")}</p>
                                <p className="text-xs text-muted-foreground">By: {survey.surveyor}</p>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <p className="text-sm text-muted-foreground text-center py-4">No surveys conducted in the last 30 days.</p>
            )}
        </CardContent>
      </Card>

    </>
  );
}


    