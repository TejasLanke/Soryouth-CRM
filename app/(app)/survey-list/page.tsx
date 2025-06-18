
'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MOCK_SURVEYS, SURVEY_STATUS_OPTIONS, USER_OPTIONS } from '@/lib/constants';
import type { Survey, SurveyStatusType, SurveySortConfig, SurveyStatusFilterItem } from '@/types';
import { format, parseISO } from 'date-fns';
import { Filter, Search, PlusCircle, Settings2, ClipboardList, ListChecks } from 'lucide-react';
// import { SurveyForm } from './survey-form'; // Placeholder for future SurveyForm
import { SurveysTable } from './surveys-table';
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from '@/components/ui/card';

export default function SurveyListPage() {
  const [surveys, setSurveys] = useState<Survey[]>(MOCK_SURVEYS);
  const [isFormOpen, setIsFormOpen] = useState(false); // For SurveyForm dialog
  const [isSettingsDialogOpen, setIsSettingsDialogOpen] = useState(false); // For settings dialog
  const [selectedSurveyForEdit, setSelectedSurveyForEdit] = useState<Survey | null>(null);
  const { toast } = useToast();
  const [activeFilter, setActiveFilter] = useState<SurveyStatusType | 'all'>('all');
  const [sortConfig, setSortConfig] = useState<SurveySortConfig | null>(null);

  const handleAddSurvey = () => {
    setSelectedSurveyForEdit(null);
    // setIsFormOpen(true); // Uncomment when SurveyForm is ready
    toast({ title: "Add Survey Clicked", description: "SurveyForm not yet implemented." });
  };

  // Placeholder for form submission logic
  const handleFormSubmit = (surveyData: Survey) => {
    if (selectedSurveyForEdit) {
      setSurveys(prevSurveys => prevSurveys.map(s => s.id === surveyData.id ? { ...s, ...surveyData, updatedAt: new Date().toISOString() } : s));
      toast({ title: "Survey Updated", description: `Survey ${surveyData.surveyNumber} has been updated.` });
    } else {
      const newSurvey: Survey = {
        ...surveyData,
        id: `survey-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setSurveys(prevSurveys => [newSurvey, ...prevSurveys]);
      toast({ title: "Survey Added", description: `Survey ${newSurvey.surveyNumber} has been added.` });
    }
    setIsFormOpen(false);
    setSelectedSurveyForEdit(null);
  };
  
  const statusFilters = useMemo((): SurveyStatusFilterItem[] => {
    const counts: Record<string, number> = { all: 0 };
    SURVEY_STATUS_OPTIONS.forEach(status => counts[status] = 0);

    surveys.forEach(survey => {
      counts.all++;
      if (counts[survey.status] !== undefined) {
        counts[survey.status]++;
      }
    });
    return [{ label: 'Show all', value: 'all', count: counts.all }, 
            ...SURVEY_STATUS_OPTIONS.map(status => ({ label: status, value: status, count: counts[status] || 0 }))
           ].filter(f => f.count > 0 || f.value === 'all');
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
        
        if (sortConfig.key === 'surveyDate' || sortConfig.key === 'createdAt' || sortConfig.key === 'updatedAt') {
          const dateA = aValue ? parseISO(aValue as string).getTime() : 0;
          const dateB = bValue ? parseISO(bValue as string).getTime() : 0;
          if (dateA < dateB) return sortConfig.direction === 'ascending' ? -1 : 1;
          if (dateA > dateB) return sortConfig.direction === 'ascending' ? 1 : -1;
          return 0;
        }
        
        if (String(aValue).toLowerCase() < String(bValue).toLowerCase()) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (String(aValue).toLowerCase() > String(bValue).toLowerCase()) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }
    return currentSurveys;
  }, [surveys, activeFilter, sortConfig]);

  const requestSort = (key: keyof Survey) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  return (
    <>
      <PageHeader
        title="Survey List"
        description="Manage all surveys."
        icon={ListChecks} // Using ListChecks similar to Leads List
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" disabled>
              <Filter className="mr-2 h-4 w-4" /> Filter
            </Button>
            <Button variant="outline" size="sm" disabled>
              <Search className="mr-2 h-4 w-4" /> Search
            </Button>
            <Button size="sm" onClick={handleAddSurvey}>
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
              onClick={() => setActiveFilter(filter.value)}
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
            setSelectedSurveyForEdit(survey); 
            // setIsFormOpen(true); // Uncomment when SurveyForm is ready
            toast({title: "Edit Survey Clicked", description: `Survey: ${survey.surveyNumber}. Form not implemented.`})
        }}
        onDeleteSurvey={(surveyId) => { 
          setSurveys(prev => prev.filter(s => s.id !== surveyId)); 
          toast({ title: "Survey Deleted (Placeholder)" });
        }}
        sortConfig={sortConfig}
        requestSort={requestSort}
      />

      {/* Placeholder for SurveyForm Dialog */}
      {/* {isFormOpen && (
        <SurveyForm
          isOpen={isFormOpen}
          onClose={() => setIsFormOpen(false)}
          onSubmit={handleFormSubmit}
          survey={selectedSurveyForEdit}
        />
      )} */}
      {/* Placeholder for Settings Dialog */}
      {/* {isSettingsDialogOpen && (
        <SurveySettingsDialog
          isOpen={isSettingsDialogOpen}
          onClose={() => setIsSettingsDialogOpen(false)}
          // Pass initial settings if needed
        />
      )} */}
       <img src="https://placehold.co/1200x300.png" data-ai-hint="survey list table" alt="Survey List" className="w-full mt-8 rounded-lg object-cover"/>
    </>
  );
}
