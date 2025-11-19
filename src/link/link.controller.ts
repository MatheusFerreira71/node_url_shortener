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
	ApiBody,
	ApiOperation,
	ApiParam,
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
	@ApiBody({
		schema: {
			type: 'object',
			properties: {
				original_url: {
					type: 'string',
					format: 'uri',
					example: 'https://www.example.com/pagina-muito-longa',
					description: 'URL original a ser encurtada',
				},
				expires_at: {
					type: 'string',
					example: '2025-12-31 23:59:59.999 +0000',
					description:
						'Data de expiração do link (opcional) no formato YYYY-MM-DD HH:mm:ss.SSS ±HHMM',
				},
			},
			required: ['original_url'],
		},
	})
	@ApiResponse({
		status: 201,
		description: 'Link criado com sucesso',
		schema: {
			type: 'object',
			properties: {
				hash: {
					type: 'string',
					example: 'a1b2c3',
				},
				short_url: {
					type: 'string',
					example: 'http://localhost:3000/link/a1b2c3',
				},
				current_url: {
					type: 'string',
					format: 'uri',
				},
				expires_at: {
					type: 'string',
					format: 'date-time',
					nullable: true,
				},
				created_at: {
					type: 'string',
					format: 'date-time',
				},
				user_id: {
					type: 'string',
					format: 'uuid',
					nullable: true,
				},
			},
		},
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

		const shortUrl = `${this.configService.get('BASE_URL')}/link/${hash}`;

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
	@ApiParam({
		name: 'hash',
		type: 'string',
		description: 'Hash do link a ser deletado (6 caracteres)',
		example: 'a1b2c3',
	})
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
		schema: {
			type: 'array',
			items: {
				type: 'object',
				properties: {
					hash: {
						type: 'string',
						example: 'a1b2c3',
					},
					short_url: {
						type: 'string',
						example: 'http://localhost:3000/link/a1b2c3',
					},
					original_url: {
						type: 'string',
						format: 'uri',
					},
					current_url: {
						type: 'string',
						format: 'uri',
					},
					times_clicked: {
						type: 'number',
					},
					expires_at: {
						type: 'string',
						format: 'date-time',
						nullable: true,
					},
					created_at: {
						type: 'string',
						format: 'date-time',
					},
					updated_at: {
						type: 'string',
						format: 'date-time',
					},
					user_id: {
						type: 'string',
						format: 'uuid',
					},
				},
			},
		},
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
	@ApiParam({
		name: 'hash',
		type: 'string',
		description: 'Hash do link a ser atualizado (6 caracteres)',
		example: 'a1b2c3',
	})
	@ApiBody({
		schema: {
			type: 'object',
			properties: {
				current_url: {
					type: 'string',
					format: 'uri',
					example: 'https://www.example.com/nova-url',
					description: 'Nova URL de destino',
				},
			},
			required: ['current_url'],
		},
	})
	@ApiResponse({
		status: 200,
		description: 'Link atualizado com sucesso',
		schema: {
			type: 'object',
			properties: {
				hash: {
					type: 'string',
					example: 'a1b2c3',
				},
				short_url: {
					type: 'string',
					example: 'http://localhost:3000/link/a1b2c3',
				},
				current_url: {
					type: 'string',
					format: 'uri',
				},
				expires_at: {
					type: 'string',
					format: 'date-time',
					nullable: true,
				},
				created_at: {
					type: 'string',
					format: 'date-time',
				},
				updated_at: {
					type: 'string',
					format: 'date-time',
				},
				user_id: {
					type: 'string',
					format: 'uuid',
					nullable: true,
				},
			},
		},
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
	@ApiParam({
		name: 'hash',
		type: 'string',
		description: 'Hash do link encurtado (6 caracteres)',
		example: 'a1b2c3',
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
