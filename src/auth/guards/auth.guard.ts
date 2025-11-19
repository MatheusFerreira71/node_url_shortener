import {
	type CanActivate,
	type ExecutionContext,
	Injectable,
	UnauthorizedException,
} from '@nestjs/common';
// biome-ignore lint/style/useImportType: falso positivo, o nest precisa disso para a injeção de dependência
import { ConfigService } from '@nestjs/config';
// biome-ignore lint/style/useImportType: falso positivo, o nest precisa disso para a injeção de dependência
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';
import type { Env } from '../../types/globals.types';
import type { JwtPayload } from '../auth.types';

@Injectable()
export class AuthGuard implements CanActivate {
	constructor(
		private jwtService: JwtService,
		private configService: ConfigService<Env, true>,
	) {}

	async canActivate(context: ExecutionContext): Promise<boolean> {
		const request = context.switchToHttp().getRequest<Request>();
		const token = this.extractTokenFromHeader(request);
		if (!token) {
			throw new UnauthorizedException('Token de autenticação não fornecido.', {
				description: 'É necessário fornecer um token de autenticação válido.',
				cause: 'UnauthorizedError',
			});
		}
		try {
			const payload = await this.jwtService.verifyAsync<JwtPayload>(token, {
				secret: this.configService.get('JWT_SECRET_KEY'),
			});

			request.user = { id: payload.sub };
		} catch {
			throw new UnauthorizedException('Token de autenticação inválido.', {
				description: 'O token de autenticação fornecido é inválido ou expirou.',
				cause: 'UnauthorizedError',
			});
		}
		return true;
	}

	private extractTokenFromHeader(request: Request): string | null {
		const authHeader = request.headers.authorization;

		if (!authHeader) {
			return null;
		}

		const [type, token] = authHeader.split(' ') ?? [];
		return type === 'Bearer' ? token : null;
	}
}
