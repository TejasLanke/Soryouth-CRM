
'use server';

import prisma from '@/lib/prisma';
import type { CustomSetting, SettingType, Template } from '@/types';
import { revalidatePath } from 'next/cache';
import { deleteGeneratedDocument } from '@/app/(app)/documents/actions';
import { deleteTemplate as deleteTemplateFile } from '@/app/(app)/manage-templates/actions';

// Helper to map Prisma CustomSetting to frontend CustomSetting type
function mapPrismaCustomSetting(setting: any): CustomSetting {
    return {
        id: setting.id,
        type: setting.type,
        name: setting.name,
        createdAt: setting.createdAt.toISOString(),
    };
}

export async function getSettingsByType(type: SettingType): Promise<CustomSetting[]> {
    try {
        const settings = await prisma.customSetting.findMany({
            where: { type },
            orderBy: { name: 'asc' },
        });
        return settings.map(mapPrismaCustomSetting);
    } catch (error) {
        console.error(`Failed to fetch settings for type ${type}:`, error);
        return [];
    }
}

export async function getLeadStatuses(): Promise<CustomSetting[]> {
    return getSettingsByType('LEAD_STATUS');
}

export async function getLeadSources(): Promise<CustomSetting[]> {
    return getSettingsByType('LEAD_SOURCE');
}

export async function getClientStatuses(): Promise<CustomSetting[]> {
    return getSettingsByType('CLIENT_STATUS');
}

export async function getDocumentTypes(): Promise<CustomSetting[]> {
    return getSettingsByType('DOCUMENT_TYPE');
}


export async function addSetting(type: SettingType, name: string): Promise<CustomSetting | { error: string }> {
    if (!name || name.trim().length === 0) {
        return { error: 'Name cannot be empty.' };
    }
    try {
        const newSetting = await prisma.customSetting.create({
            data: {
                type,
                name: name.trim(),
            },
        });
        
        // Revalidate relevant paths
        if (type === 'LEAD_STATUS' || type === 'LEAD_SOURCE') revalidatePath('/leads-list');
        if (type === 'CLIENT_STATUS') revalidatePath('/clients-list');
        if (type === 'DOCUMENT_TYPE') {
            revalidatePath('/documents');
            revalidatePath('/manage-templates');
        }
        
        return mapPrismaCustomSetting(newSetting);
    } catch (error: any) {
        if (error.code === 'P2002') { // Unique constraint violation
            return { error: `The name "${name}" already exists for this setting type.` };
        }
        console.error(`Failed to add setting for type ${type}:`, error);
        return { error: 'An unexpected error occurred.' };
    }
}

export async function deleteSetting(id: string): Promise<{ success: boolean; error?: string }> {
    try {
        const settingToDelete = await prisma.customSetting.findUnique({ where: { id } });
        if (!settingToDelete) {
             return { success: false, error: 'Setting not found.' };
        }

        await prisma.customSetting.delete({
            where: { id },
        });
        
        if (settingToDelete.type === 'LEAD_STATUS' || settingToDelete.type === 'LEAD_SOURCE') revalidatePath('/leads-list');
        if (settingToDelete.type === 'CLIENT_STATUS') revalidatePath('/clients-list');
        if (settingToDelete.type === 'DOCUMENT_TYPE') {
            revalidatePath('/documents');
            revalidatePath('/manage-templates');
        }

        return { success: true };
    } catch (error) {
        console.error('Failed to delete setting:', error);
        return { success: false, error: 'An unexpected error occurred.' };
    }
}

export async function getDeletionImpactForDocumentType(typeName: string): Promise<{ templateCount: number, documentCount: number }> {
    const templateCount = await prisma.template.count({
        where: { type: typeName }
    });
    const documentCount = await prisma.generatedDocument.count({
        where: { documentType: typeName }
    });
    return { templateCount, documentCount };
}

export async function deleteDocumentTypeAndContents(settingId: string): Promise<{ success: boolean, error?: string }> {
    try {
        const settingToDelete = await prisma.customSetting.findUnique({ where: { id: settingId } });
        if (!settingToDelete || settingToDelete.type !== 'DOCUMENT_TYPE') {
            return { success: false, error: 'Document type setting not found.' };
        }
        
        const typeName = settingToDelete.name;

        // Find all generated documents of this type
        const documentsToDelete = await prisma.generatedDocument.findMany({
            where: { documentType: typeName },
        });

        // Delete all associated files from S3 and records from DB
        for (const doc of documentsToDelete) {
            await deleteGeneratedDocument(doc.pdfUrl); // This handles both S3 files and DB record
        }
        
        // Find all templates of this type
        const templatesToDelete = await prisma.template.findMany({
            where: { type: typeName },
        });

        // Delete all associated template files from S3 and records from DB
        for (const template of templatesToDelete) {
            await deleteTemplateFile(template.id);
        }

        // Finally, delete the setting itself
        await prisma.customSetting.delete({ where: { id: settingId } });
        
        revalidatePath('/documents');
        revalidatePath('/manage-templates');

        return { success: true };

    } catch (error) {
        console.error('Failed to delete document type and its contents:', error);
        return { success: false, error: 'An unexpected error occurred during deletion.' };
    }
}
