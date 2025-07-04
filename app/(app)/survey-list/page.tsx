'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SURVEY_STATUS_OPTIONS } from '@/lib/constants';
import type { SiteSurvey, SurveyStatusType, SurveySortConfig, SurveyStatusFilterItem } from '@/types';
import { format, parseISO } from 'date-fns';
import { Filter, Search, PlusCircle, Settings2, ListChecks } from 'lucide-react';
import { SurveysTable } from './surveys-table';
import { useToast } from "@/hooks/use-toast";
import { getSiteSurveys } from '@/app/(app)/site-survey/actions';
import { useRouter } from 'next/navigation';

export default function SurveyListPage() {
  const router = useRouter();
  const [surveys, setSurveys] = useState<SiteSurvey[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const [activeFilter, setActiveFilter] = useState<SurveyStatusType | 'all'>('all');
  const [sortConfig, setSortConfig] = useState<SurveySortConfig | null>(null);

  useEffect(() => {
    async function fetchData() {
        setIsLoading(true);
        const fetchedSurveys = await getSiteSurveys();
        setSurveys(fetchedSurveys);
        setIsLoading(false);
    }
    fetchData();
  }, []);

  const statusFilters = useMemo((): SurveyStatusFilterItem[] => {
    const counts: { [key: string]: number } = {};
    SURVEY_STATUS_OPTIONS.forEach(status => counts[status] = 0);
    counts['all'] = surveys.length;

    surveys.forEach(survey => {
      if (counts[survey.status] !== undefined) {
        counts[survey.status]++;
      }
    });

    const filters: SurveyStatusFilterItem[] = [{ label: 'Show all', value: 'all', count: counts.all }];
    SURVEY_STATUS_OPTIONS.forEach(status => {
      if(counts[status] > 0) {
        filters.push({ label: status, value: status, count: counts[status] });
      }
    });

    return filters;
  }, [surveys]);


  const sortedAndFilteredSurveys = useMemo(() => {
    let currentSurveys = [...surveys];
    if (activeFilter !== 'all') {
      currentSurveys = currentSurveys.filter(survey => survey.status === activeFilter);
    }
    
    if (sortConfig !== null) {
      currentSurveys.sort((a, b) => {
        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];

        if (aValue === undefined && bValue === undefined) return 0;
        if (aValue === undefined) return sortConfig.direction === 'ascending' ? 1 : -1;
        if (bValue === undefined) return sortConfig.direction === 'ascending' ? -1 : 1;
        
        if (['date', 'createdAt', 'updatedAt'].includes(sortConfig.key)) {
            const dateA = new Date(aValue as string).getTime();
            const dateB = new Date(bValue as string).getTime();
            return sortConfig.direction === 'ascending' ? dateA - dateB : dateB - dateA;
        }
        
        if (typeof aValue === 'string' && typeof bValue === 'string') {
          return sortConfig.direction === 'ascending'
            ? aValue.localeCompare(bValue)
            : bValue.localeCompare(aValue);
        }
        
        if (typeof aValue === 'number' && typeof bValue === 'number') {
           return sortConfig.direction === 'ascending' ? aValue - bValue : bValue - aValue;
        }

        return 0;
      });
    }
    return currentSurveys;
  }, [surveys, activeFilter, sortConfig]);

  const requestSort = (key: keyof SiteSurvey) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };
  
  if (isLoading) {
    return <PageHeader title="Survey List" description="Loading surveys..." icon={ListChecks} />;
  }

  return (
    <>
      <PageHeader
        title="Survey List"
        description="Manage all site surveys."
        icon={ListChecks}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" disabled>
              <Filter className="mr-2 h-4 w-4" /> Filter
            </Button>
            <Button variant="outline" size="sm" disabled>
              <Search className="mr-2 h-4 w-4" /> Search
            </Button>
            <Button size="sm" onClick={() => router.push('/site-survey')}>
              <PlusCircle className="mr-2 h-4 w-4" /> Add Survey
            </Button>
            <Button variant="ghost" size="icon" onClick={() => toast({title: "Settings Clicked", description: "Settings dialog not yet implemented."})}>
              <Settings2 className="h-5 w-5" />
            </Button>
          </div>
        }
      />
      <div className="mb-4">
        <div className="flex flex-wrap gap-2 items-center">
          {statusFilters.map(filter => (
            <Button
              key={filter.value}
              variant={activeFilter === filter.value ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setActiveFilter(filter.value as SurveyStatusType | 'all')}
              className={`py-1 px-3 h-auto text-xs rounded-full ${activeFilter === filter.value ? 'border-b-2 border-primary font-semibold' : 'text-muted-foreground'}`}
            >
              {filter.label}
              <Badge variant={activeFilter === filter.value ? 'default' : 'secondary'} className="ml-2 rounded-sm px-1.5 py-0.5 text-[10px] h-4 leading-none">
                {filter.count}
              </Badge>
            </Button>
          ))}
        </div>
      </div>
      
      <SurveysTable 
        surveys={sortedAndFilteredSurveys} 
        onEditSurvey={(survey) => { 
            toast({title: "Edit Survey Clicked", description: `Survey: ${survey.surveyNumber}. Form not implemented.`})
        }}
        onDeleteSurvey={(surveyId) => { 
          toast({ title: "Delete Survey Clicked", description: "Delete action not implemented." });
        }}
        sortConfig={sortConfig}
        requestSort={requestSort}
      />
    </>
  );
}