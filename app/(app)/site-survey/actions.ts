
'use server';

import prisma from '@/lib/prisma';
import type { SiteSurvey, CreateSiteSurveyData } from '@/types';
import { revalidatePath } from 'next/cache';
import { verifySession } from '@/lib/auth';
import { format, parseISO } from 'date-fns';

function mapPrismaSurvey(survey: any): SiteSurvey {
  return {
    id: survey.id,
    surveyNumber: survey.surveyNumber,
    consumerName: survey.consumerName,
    date: format(survey.date, 'yyyy-MM-dd'),
    consumerCategory: survey.consumerCategory,
    location: survey.location,
    numberOfMeters: survey.numberOfMeters,
    meterRating: survey.meterRating ?? undefined,
    meterPhase: survey.meterPhase ?? undefined,
    electricityAmount: survey.electricityAmount ?? undefined,
    consumerLoadType: survey.consumerLoadType,
    roofType: survey.roofType,
    buildingHeight: survey.buildingHeight,
    shadowFreeArea: survey.shadowFreeArea,
    discom: survey.discom,
    sanctionedLoad: survey.sanctionedLoad ?? undefined,
    remark: survey.remark ?? undefined,
    electricityBillFiles: survey.electricityBillFiles ?? [],
    status: survey.status,
    createdAt: survey.createdAt.toISOString(),
    updatedAt: survey.updatedAt.toISOString(),
    leadId: survey.leadId ?? undefined,
    clientId: survey.clientId ?? undefined,
    droppedLeadId: survey.droppedLeadId ?? undefined,
    surveyorName: survey.surveyor.name,
    surveyorId: survey.surveyorId,
  };
}

export async function createSiteSurvey(data: CreateSiteSurveyData): Promise<SiteSurvey | { error: string }> {
  const session = await verifySession();
  if (!session?.userId) {
    return { error: 'Authentication required.' };
  }

  try {
    const surveyor = await prisma.user.findUnique({
      where: { id: data.surveyorId },
    });
    if (!surveyor) {
      return { error: 'Selected surveyor not found.' };
    }

    const newSurvey = await prisma.siteSurvey.create({
      data: {
        surveyNumber: `SRV-${Date.now()}`,
        consumerName: data.consumerName,
        date: parseISO(data.date),
        consumerCategory: data.consumerCategory,
        location: data.location,
        numberOfMeters: data.numberOfMeters,
        meterRating: data.meterRating,
        meterPhase: data.meterPhase,
        electricityAmount: data.electricityAmount,
        consumerLoadType: data.consumerLoadType,
        roofType: data.roofType,
        buildingHeight: data.buildingHeight,
        shadowFreeArea: data.shadowFreeArea,
        discom: data.discom,
        sanctionedLoad: data.sanctionedLoad,
        remark: data.remark,
        electricityBillFiles: data.electricityBillFiles,
        status: 'Scheduled', // Default status for a new survey
        leadId: data.leadId,
        clientId: data.clientId,
        surveyorId: surveyor.id,
      },
      include: {
        surveyor: true,
      },
    });

  


    revalidatePath('/site-survey');
    revalidatePath('/survey-list');
    if (data.leadId) revalidatePath(`/leads/${data.leadId}`);
    if (data.clientId) revalidatePath(`/clients/${data.clientId}`);

    return mapPrismaSurvey(newSurvey);
  } catch (error) {
    console.error('Failed to create site survey:', error);
    return { error: 'An unexpected error occurred while saving the survey.' };
  }
}

export async function getSiteSurveys(): Promise<SiteSurvey[]> {
  try {
    const surveys = await prisma.siteSurvey.findMany({
      orderBy: { date: 'desc' },
      include: { surveyor: true },
    });
    return surveys.map(mapPrismaSurvey);
  } catch (error) {
    console.error('Failed to fetch site surveys:', error);
    return [];
  }
}

export async function getSurveysForLead(leadId: string): Promise<SiteSurvey[]> {
  try {
    const surveys = await prisma.siteSurvey.findMany({
      where: { leadId },
      orderBy: { date: 'desc' },
      include: { surveyor: true },
    });
    return surveys.map(mapPrismaSurvey);
  } catch (error) {
    console.error(`Failed to fetch surveys for lead ${leadId}:`, error);
    return [];
  }
}

export async function getSurveysForClient(clientId: string): Promise<SiteSurvey[]> {
  try {
    const surveys = await prisma.siteSurvey.findMany({
      where: { clientId },
      orderBy: { date: 'desc' },
      include: { surveyor: true },
    });
    return surveys.map(mapPrismaSurvey);
  } catch (error) {
    console.error(`Failed to fetch surveys for client ${clientId}:`, error);
    return [];
  }
}

export async function getSurveysForDroppedLead(droppedLeadId: string): Promise<SiteSurvey[]> {
  try {
    const surveys = await prisma.siteSurvey.findMany({
      where: { droppedLeadId },
      orderBy: { date: 'desc' },
      include: { surveyor: true },
    });
    return surveys.map(mapPrismaSurvey);
  } catch (error) {
    console.error(`Failed to fetch surveys for dropped lead ${droppedLeadId}:`, error);
    return [];
  }
}
