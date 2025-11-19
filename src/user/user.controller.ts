import {
	Body,
	Controller,
	HttpCode,
	HttpStatus,
	Post,
	UsePipes,
} from '@nestjs/common';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ZodValidationPipe } from '../common/pipes';
import { UserCreateSchema } from './user.schema';
// biome-ignore lint/style/useImportType: falso positivo, o nest precisa usar isso na injeção de dependência
import { UserService } from './user.service';
import type { CreatedUserResponse, UserCreateDto } from './user.types';

@ApiTags('Usuários')
@Controller('user')
export class UserController {
	constructor(private userService: UserService) {}

	@ApiOperation({ summary: 'Cria um novo usuário' })
	@ApiBody({
		schema: {
			type: 'object',
			properties: {
				name: {
					type: 'string',
					example: 'João Silva',
					description: 'Nome do usuário (opcional)',
					maxLength: 100,
				},
				email: {
					type: 'string',
					format: 'email',
					example: 'joao@example.com',
					description: 'Email do usuário',
					maxLength: 150,
				},
				password: {
					type: 'string',
					example: 'senha123',
					description: 'Senha do usuário',
					minLength: 6,
					maxLength: 50,
				},
			},
			required: ['email', 'password'],
		},
	})
	@ApiResponse({
		status: 201,
		description: 'Usuário criado com sucesso',
		schema: {
			type: 'object',
			properties: {
				id: {
					type: 'string',
					format: 'uuid',
				},
				name: {
					type: 'string',
				},
				email: {
					type: 'string',
					format: 'email',
				},
				created_at: {
					type: 'string',
					format: 'date-time',
				},
			},
		},
	})
	@ApiResponse({
		status: 400,
		description: 'Dados inválidos ou email já cadastrado',
	})
	@ApiResponse({
		status: 409,
		description: 'Email já cadastrado',
	})
	@Post()
	@HttpCode(HttpStatus.CREATED)
	@UsePipes(new ZodValidationPipe(UserCreateSchema))
	async createUser(@Body() body: UserCreateDto): Promise<CreatedUserResponse> {
		const createdUser = await this.userService.createUser(body);

		return createdUser;
	}
}
