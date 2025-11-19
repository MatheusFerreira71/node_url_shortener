import type z from 'zod';
import type { Link } from './link.entity';
import type {
	AccessLinkSchemaParams,
	CreateLinkSchema,
	DeleteLinkSchema,
	UpdateLinkSchemaBody,
	UpdateLinkSchemaParams,
} from './link.schema';

export type CreateLinkDto = z.infer<typeof CreateLinkSchema> & {
	user_id?: string;
};
export type DeleteLinkDto = z.infer<typeof DeleteLinkSchema>;
export type UpdateLinkBodyDto = z.infer<typeof UpdateLinkSchemaBody>;
export type UpdateLinkParamsDto = z.infer<typeof UpdateLinkSchemaParams>;
export type AccessLinkParamsDto = z.infer<typeof AccessLinkSchemaParams>;

export type CreateLinkResponse = Pick<
	Link,
	'current_url' | 'hash' | 'expires_at' | 'created_at' | 'user_id'
> & {
	short_url: string;
};

export type ReturnedLink = Pick<
	Link,
	| 'current_url'
	| 'hash'
	| 'expires_at'
	| 'created_at'
	| 'user_id'
	| 'original_url'
	| 'updated_at'
	| 'times_clicked'
> & {
	short_url: string;
};

export type DeleteLinkUsecasePayload = DeleteLinkDto & {
	user_id: string;
};

export type UpdateLinkUsecasePayload = UpdateLinkBodyDto &
	UpdateLinkParamsDto & {
		user_id: string;
	};

export type UpdateLinkResponse = Pick<
	Link,
	| 'current_url'
	| 'hash'
	| 'expires_at'
	| 'created_at'
	| 'user_id'
	| 'updated_at'
> & {
	short_url: string;
};
