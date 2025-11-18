import {
	Body,
	Controller,
	HttpCode,
	HttpStatus,
	Post,
	Res,
	UsePipes,
} from '@nestjs/common';
import type { Response } from 'express';
import { ZodValidationPipe } from '../common/pipes';
import { LoginSchema } from './auth.schema';
// biome-ignore lint/style/useImportType: falso positivo, o nest precisa usar isso na injeção de dependência
import { AuthService } from './auth.service';
import type { LoginDto } from './auth.types';

@Controller('auth')
export class AuthController {
	constructor(private authService: AuthService) {}

	@HttpCode(HttpStatus.OK)
	@Post('login')
	@UsePipes(new ZodValidationPipe(LoginSchema))
	async login(@Body() dto: LoginDto, @Res() res: Response): Promise<Response> {
		const loginResponse = await this.authService.login(dto);
		return res.json(loginResponse);
	}
}
