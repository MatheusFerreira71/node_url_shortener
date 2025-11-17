import { Injectable, UnauthorizedException } from '@nestjs/common';
// biome-ignore lint/style/useImportType: falso positivo, o nest precisa usar isso na injeção de dependência
import { JwtService } from '@nestjs/jwt';
// biome-ignore lint/style/useImportType: falso positivo, o nest precisa usar isso na injeção de dependência
import { CommonService } from '../../common/common.service';
import type { Usecase } from '../../resources';
// biome-ignore lint/style/useImportType: falso positivo, o nest precisa usar isso na injeção de dependência
import { UserService } from '../../user/user.service';
import type { LoginDto, LoginResponse } from '../auth.types';

@Injectable()
export class Login implements Usecase<LoginDto, LoginResponse> {
	constructor(
		private userService: UserService,
		private commonService: CommonService,
		private jwtService: JwtService,
	) {}

	async execute({ email, password }: LoginDto): Promise<LoginResponse> {
		const user = await this.userService.findByEmail(email);

		const isPasswordValid = await this.commonService.compare(
			password,
			user.password,
		);

		if (!isPasswordValid) {
			throw new UnauthorizedException('Credenciais inválidas.', {
				description: 'O email ou a senha fornecidos estão incorretos.',
				cause: 'UnauthorizedError',
			});
		}

		const payload = { sub: user.id, email: user.email };
		return {
			access_token: await this.jwtService.signAsync(payload),
			expires_at: new Date(Date.now() + 3600 * 1000),
		};
	}
}
