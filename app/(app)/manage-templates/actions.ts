
'use server';

import type { Template, CreateTemplateData } from '@/types';
import { revalidatePath } from 'next/cache';
import fs from 'fs/promises';
import path from 'path';
import prisma from '@/lib/prisma';

// Helper to map Prisma template to frontend Template type
function mapPrismaTemplateToTemplateType(prismaTemplate: any): Template {
  return {
    id: prismaTemplate.id,
    name: prismaTemplate.name,
    type: prismaTemplate.type,
    originalDocxPath: prismaTemplate.originalDocxPath,
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

export async function saveTemplate(data: { id?: string; name: string; type: 'Proposal' | 'Document'; originalDocxPath: string }): Promise<Template | null> {
  try {
    let savedTemplate;
    if (data.id) {
      // Update existing template
      savedTemplate = await prisma.template.update({
        where: { id: data.id },
        data: {
          name: data.name,
          type: data.type,
          originalDocxPath: data.originalDocxPath,
        },
      });
      revalidatePath(`/manage-templates/${data.id}`);
    } else {
      // Create new template
      savedTemplate = await prisma.template.create({
        data: {
          name: data.name,
          type: data.type,
          originalDocxPath: data.originalDocxPath,
        },
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

    // Delete from DB first
    await prisma.template.delete({ where: { id } });

    // Then delete the associated file
    if (templateToDelete.originalDocxPath) {
        try {
            const filePath = path.join(process.cwd(), 'public', templateToDelete.originalDocxPath);
            await fs.unlink(filePath);
        } catch (error) {
            console.error(`Failed to delete template file: ${templateToDelete.originalDocxPath}`, error);
            // Don't throw, as the DB entry is already deleted. Log the error.
        }
    }
    
    revalidatePath('/manage-templates');
    return { success: true };
  } catch (error) {
    console.error("Error deleting template:", error);
    return { success: false };
  }
}
