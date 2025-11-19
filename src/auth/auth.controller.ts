import {
	Body,
	Controller,
	HttpCode,
	HttpStatus,
	Post,
	UsePipes,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
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
	@ApiResponse({
		status: 200,
		description: 'Login realizado com sucesso',
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
