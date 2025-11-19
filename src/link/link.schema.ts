import { z } from 'zod';

export const CreateLinkSchema = z.object({
	original_url: z.url().min(1),
	expires_at: z
		.string()
		.regex(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}\.\d{3} [+-]\d{4}$/)
		.transform((val) => new Date(val))
		.optional(),
});

export const DeleteLinkSchema = z.object({
	hash: z.string().min(6).max(6),
});

export const UpdateLinkSchemaBody = z.object({
	current_url: z.url().min(1),
});

export const UpdateLinkSchemaParams = z.object({
	hash: z.string().min(6).max(6),
});

export const AccessLinkSchemaParams = z.object({
	hash: z.string().min(6).max(6),
});
