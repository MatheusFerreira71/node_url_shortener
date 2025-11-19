import {
	Body,
	Controller,
	Delete,
	Get,
	HttpCode,
	HttpStatus,
	Param,
	Patch,
	Post,
	Res,
	UseGuards,
	UseInterceptors,
} from '@nestjs/common';
// biome-ignore lint/style/useImportType: falso positivo, o nest precisa disso para a injeção de dependência
import { ConfigService } from '@nestjs/config';
import type { Response } from 'express';
import { User } from '../auth/decorators';
import { AuthGuard } from '../auth/guards';
import { SetLoggedUserOnRequestInterceptor } from '../auth/interceptors';
import { ZodValidationPipe } from '../common/pipes';
import type { Env } from '../types/globals.types';
import {
	AccessLinkSchemaParams,
	CreateLinkSchema,
	DeleteLinkSchema,
	UpdateLinkSchemaBody,
	UpdateLinkSchemaParams,
} from './link.schema';
// biome-ignore lint/style/useImportType: falso positivo, o nest precisa disso para a injeção de dependência
import { LinkService } from './link.service';
import type {
	AccessLinkParamsDto,
	CreateLinkDto,
	CreateLinkResponse,
	DeleteLinkDto,
	ReturnedLink,
	UpdateLinkBodyDto,
	UpdateLinkParamsDto,
	UpdateLinkResponse,
} from './link.types';

@Controller('link')
export class LinkController {
	constructor(
		private linkService: LinkService,
		private configService: ConfigService<Env, true>,
	) {}

	@Post()
	@HttpCode(HttpStatus.CREATED)
	@UseInterceptors(SetLoggedUserOnRequestInterceptor)
	async createLink(
		@User() user: Express.Request['user'],
		@Body(new ZodValidationPipe(CreateLinkSchema)) createLinkDto: Pick<
			CreateLinkDto,
			'expires_at' | 'original_url'
		>,
	): Promise<CreateLinkResponse> {
		const payload = {
			...createLinkDto,
			user_id: user?.id,
		};

		const { expires_at, created_at, current_url, hash, user_id } =
			await this.linkService.createLink(payload);

		const shortUrl = `${this.configService.get('BASE_URL')}/${hash}`;

		return {
			expires_at,
			created_at,
			current_url,
			hash,
			user_id,
			short_url: shortUrl,
		};
	}

	@Delete(':hash')
	@HttpCode(HttpStatus.NO_CONTENT)
	@UseGuards(AuthGuard)
	async deleteLink(
		@User() user: Express.Request['user'],
		@Param(new ZodValidationPipe(DeleteLinkSchema)) { hash }: DeleteLinkDto,
	): Promise<void> {
		await this.linkService.deleteLink({ hash, user_id: user?.id ?? '' });
	}

	@Get()
	@HttpCode(HttpStatus.OK)
	@UseGuards(AuthGuard)
	async listLinks(
		@User() user: Express.Request['user'],
	): Promise<ReturnedLink[]> {
		return this.linkService.listLinksByUserId(user?.id ?? '');
	}

	@Patch(':hash')
	@HttpCode(HttpStatus.OK)
	@UseGuards(AuthGuard)
	async updateLink(
		@User() user: Express.Request['user'],
		@Body(new ZodValidationPipe(UpdateLinkSchemaBody)) {
			current_url,
		}: UpdateLinkBodyDto,
		@Param(new ZodValidationPipe(UpdateLinkSchemaParams)) {
			hash,
		}: UpdateLinkParamsDto,
	): Promise<UpdateLinkResponse> {
		return this.linkService.updateLink({
			hash,
			current_url,
			user_id: user?.id ?? '',
		});
	}

	@Get(':hash')
	@HttpCode(HttpStatus.FOUND)
	async accessLink(
		@Param(new ZodValidationPipe(AccessLinkSchemaParams))
		{ hash }: AccessLinkParamsDto,
		@Res() res: Response,
	): Promise<void> {
		const destination = await this.linkService.accessLink(hash);

		res.location(destination);
		res.redirect(destination);
	}
}
