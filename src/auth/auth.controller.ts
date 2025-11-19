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
import { LoginSchema } from './auth.schema';
// biome-ignore lint/style/useImportType: falso positivo, o nest precisa usar isso na injeção de dependência
import { AuthService } from './auth.service';
import type { LoginDto, LoginResponse } from './auth.types';

@ApiTags('Autenticação')
@Controller('auth')
export class AuthController {
	constructor(private authService: AuthService) {}

	@ApiOperation({ summary: 'Realiza login e retorna token JWT' })
	@ApiBody({
		schema: {
			type: 'object',
			properties: {
				email: {
					type: 'string',
					format: 'email',
					example: 'usuario@example.com',
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
		status: 200,
		description: 'Login realizado com sucesso',
		schema: {
			type: 'object',
			properties: {
				access_token: {
					type: 'string',
					example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
				},
				expires_at: {
					type: 'string',
					format: 'date-time',
					example: '2025-11-20T12:00:00.000Z',
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
		description: 'Credenciais inválidas',
	})
	@HttpCode(HttpStatus.OK)
	@Post('login')
	@UsePipes(new ZodValidationPipe(LoginSchema))
	async login(@Body() dto: LoginDto): Promise<LoginResponse> {
		const loginResponse = await this.authService.login(dto);
		return loginResponse;
	}
}
