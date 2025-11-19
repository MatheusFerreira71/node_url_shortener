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
import {
	ApiBearerAuth,
	ApiOperation,
	ApiResponse,
	ApiTags,
} from '@nestjs/swagger';
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

@ApiTags('Links')
@Controller('link')
export class LinkController {
	constructor(
		private linkService: LinkService,
		private configService: ConfigService<Env, true>,
	) {}

	@ApiOperation({
		summary: 'Cria um novo link encurtado (autenticação opcional)',
	})
	@ApiResponse({
		status: 201,
		description: 'Link criado com sucesso',
	})
	@ApiResponse({
		status: 400,
		description: 'Dados inválidos',
	})
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

	@ApiBearerAuth()
	@ApiOperation({ summary: 'Deleta um link (requer autenticação)' })
	@ApiResponse({
		status: 204,
		description: 'Link deletado com sucesso',
	})
	@ApiResponse({
		status: 400,
		description: 'Dados inválidos',
	})
	@ApiResponse({
		status: 401,
		description: 'Não autorizado',
	})
	@ApiResponse({
		status: 403,
		description: 'Usuário não tem permissão para deletar este link',
	})
	@ApiResponse({
		status: 404,
		description: 'Link não encontrado',
	})
	@Delete(':hash')
	@HttpCode(HttpStatus.NO_CONTENT)
	@UseGuards(AuthGuard)
	async deleteLink(
		@User() user: Express.Request['user'],
		@Param(new ZodValidationPipe(DeleteLinkSchema)) { hash }: DeleteLinkDto,
	): Promise<void> {
		await this.linkService.deleteLink({ hash, user_id: user?.id ?? '' });
	}

	@ApiBearerAuth()
	@ApiOperation({ summary: 'Lista todos os links do usuário autenticado' })
	@ApiResponse({
		status: 200,
		description: 'Lista de links retornada com sucesso',
	})
	@ApiResponse({
		status: 401,
		description: 'Não autorizado',
	})
	@ApiResponse({
		status: 403,
		description: 'Usuário não tem permissão para listar estes links',
	})
	@Get()
	@HttpCode(HttpStatus.OK)
	@UseGuards(AuthGuard)
	async listLinks(
		@User() user: Express.Request['user'],
	): Promise<ReturnedLink[]> {
		return this.linkService.listLinksByUserId(user?.id ?? '');
	}

	@ApiBearerAuth()
	@ApiOperation({
		summary: 'Atualiza a URL de destino de um link (requer autenticação)',
	})
	@ApiResponse({
		status: 200,
		description: 'Link atualizado com sucesso',
	})
	@ApiResponse({
		status: 400,
		description: 'Dados inválidos',
	})
	@ApiResponse({
		status: 401,
		description: 'Não autorizado',
	})
	@ApiResponse({
		status: 403,
		description: 'Usuário não tem permissão para atualizar este link',
	})
	@ApiResponse({
		status: 404,
		description: 'Link não encontrado',
	})
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

	@ApiOperation({
		summary: 'Acessa um link encurtado e redireciona para a URL original',
	})
	@ApiResponse({
		status: 302,
		description: 'Redirecionamento realizado com sucesso',
	})
	@ApiResponse({
		status: 400,
		description: 'Dados inválidos',
	})
	@ApiResponse({
		status: 404,
		description: 'Link não encontrado ou expirado',
	})
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
