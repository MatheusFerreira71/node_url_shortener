import {
	Body,
	Controller,
	HttpCode,
	HttpStatus,
	Post,
	UsePipes,
} from '@nestjs/common';
import { ZodValidationPipe } from '../common/pipes';
import { LoginSchema } from './auth.schema';
// biome-ignore lint/style/useImportType: falso positivo, o nest precisa usar isso na injeção de dependência
import { AuthService } from './auth.service';
import type { LoginDto, LoginResponse } from './auth.types';

@Controller('auth')
export class AuthController {
	constructor(private authService: AuthService) {}

	@HttpCode(HttpStatus.OK)
	@Post('login')
	@UsePipes(new ZodValidationPipe(LoginSchema))
	async login(@Body() dto: LoginDto): Promise<LoginResponse> {
		const loginResponse = await this.authService.login(dto);
		return loginResponse;
	}
}
