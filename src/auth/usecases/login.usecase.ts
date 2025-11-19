import { Injectable, UnauthorizedException } from '@nestjs/common';
// biome-ignore lint/style/useImportType: falso positivo, o nest precisa usar isso na injeção de dependência
import { JwtService } from '@nestjs/jwt';
// biome-ignore lint/style/useImportType: falso positivo, o nest precisa usar isso na injeção de dependência
import { BcryptService } from '../../bcrypt/bcrypt.service';
import type { Usecase } from '../../resources';
// biome-ignore lint/style/useImportType: falso positivo, o nest precisa usar isso na injeção de dependência
import { UserService } from '../../user/user.service';
import type { JwtPayload, LoginDto, LoginResponse } from '../auth.types';

@Injectable()
export class LoginUsecase implements Usecase<LoginDto, LoginResponse> {
	constructor(
		private userService: UserService,
		private bcryptService: BcryptService,
		private jwtService: JwtService,
	) {}

	async execute({ email, password }: LoginDto): Promise<LoginResponse> {
		const user = await this.userService.findByEmail(email);

		const isPasswordValid = await this.bcryptService.compare(
			password,
			user.password,
		);

		if (!isPasswordValid) {
			throw new UnauthorizedException('Credenciais inválidas.', {
				description: 'O email ou a senha fornecidos estão incorretos.',
				cause: 'UnauthorizedError',
			});
		}

		const payload: JwtPayload = { sub: user.id };
		return {
			access_token: await this.jwtService.signAsync<JwtPayload>(payload),
			expires_at: new Date(Date.now() + 3600 * 1000),
		};
	}
}
