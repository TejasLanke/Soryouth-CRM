
'use server';

import type { Template, CreateTemplateData } from '@/types';
import { revalidatePath } from 'next/cache';
import prisma from '@/lib/prisma';
import { deleteFileFromS3 } from '@/lib/s3';

// Helper to map Prisma template to frontend Template type
function mapPrismaTemplateToTemplateType(prismaTemplate: any): Template {
  return {
    id: prismaTemplate.id,
    name: prismaTemplate.name,
    type: prismaTemplate.type,
    originalDocxPath: prismaTemplate.originalDocxPath,
    placeholdersJson: prismaTemplate.placeholdersJson ?? null,
    createdAt: prismaTemplate.createdAt.toISOString(),
    updatedAt: prismaTemplate.updatedAt.toISOString(),
  };
}

export async function getTemplates(): Promise<Template[]> {
  try {
    const templates = await prisma.template.findMany({
      orderBy: {
        updatedAt: 'desc',
      },
    });
    return templates.map(mapPrismaTemplateToTemplateType);
  } catch (error) {
    console.error("Error fetching templates:", error);
    return [];
  }
}

export async function getTemplateById(id: string): Promise<Template | null> {
  if (!id) return null;
  try {
    const template = await prisma.template.findUnique({
      where: { id },
    });
    return template ? mapPrismaTemplateToTemplateType(template) : null;
  } catch (error) {
    console.error(`Error fetching template with id ${id}:`, error);
    return null;
  }
}

export async function saveTemplate(data: { id?: string; name: string; type: 'Proposal' | 'Document'; originalDocxPath: string, placeholdersJson?: string }): Promise<Template | null> {
  try {
    let savedTemplate;
    const dataToSave = {
        name: data.name,
        type: data.type,
        originalDocxPath: data.originalDocxPath,
        placeholdersJson: data.placeholdersJson,
    };

    if (data.id) {
      // Fetch the old template to get the old file path
      const oldTemplate = await prisma.template.findUnique({
        where: { id: data.id },
      });

      // Update existing template
      savedTemplate = await prisma.template.update({
        where: { id: data.id },
        data: dataToSave,
      });

      // If the path has changed and an old path existed, delete the old file from S3
      if (oldTemplate && oldTemplate.originalDocxPath && oldTemplate.originalDocxPath !== data.originalDocxPath) {
        try {
            const s3Url = new URL(oldTemplate.originalDocxPath);
            const key = s3Url.pathname.substring(1); // Remove leading '/'
            await deleteFileFromS3(key);
        } catch (error) {
            console.error(`Failed to delete old template file from S3: ${oldTemplate.originalDocxPath}`, error);
            // Log the error but don't block the update. The new template is saved.
        }
      }
      revalidatePath(`/manage-templates/${data.id}`);
    } else {
      // Create new template
      savedTemplate = await prisma.template.create({
        data: dataToSave,
      });
    }
    revalidatePath('/manage-templates');
    return mapPrismaTemplateToTemplateType(savedTemplate);
  } catch (error) {
    console.error("Error saving template:", error);
    return null;
  }
}

export async function deleteTemplate(id: string): Promise<{ success: boolean }> {
  try {
    const templateToDelete = await prisma.template.findUnique({
      where: { id },
    });

    if (!templateToDelete) {
      return { success: false };
    }

    // Delete the associated file from S3 first
    if (templateToDelete.originalDocxPath) {
        try {
            // Extract the key from the full S3 URL
            const s3Url = new URL(templateToDelete.originalDocxPath);
            const key = s3Url.pathname.substring(1); // Remove leading '/'
            await deleteFileFromS3(key);
        } catch (error) {
            console.error(`Failed to delete template file from S3: ${templateToDelete.originalDocxPath}`, error);
            // Log the error but proceed with deleting the DB record to avoid orphans in the UI.
        }
    }

    // Then delete from DB
    await prisma.template.delete({ where: { id } });
    
    revalidatePath('/manage-templates');
    return { success: true };
  } catch (error) {
    console.error("Error deleting template:", error);
    return { success: false };
  }
}
