import {
	type CallHandler,
	type ExecutionContext,
	Injectable,
	type NestInterceptor,
} from '@nestjs/common';
// biome-ignore lint/style/useImportType: falso positivo, o nest precisa disso para a injeção de dependência
import { ConfigService } from '@nestjs/config';
// biome-ignore lint/style/useImportType: falso positivo, o nest precisa disso para a injeção de dependência
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';
import type { Observable } from 'rxjs';
import type { Env } from '../../types/globals.types';
import type { JwtPayload } from '../auth.types';

@Injectable()
export class SetLoggedUserOnRequestInterceptor
	implements NestInterceptor<void, void>
{
	constructor(
		private jwtService: JwtService,
		private configService: ConfigService<Env, true>,
	) {}

	async intercept(
		context: ExecutionContext,
		next: CallHandler<void>,
	): Promise<Observable<void>> {
		const request = context.switchToHttp().getRequest<Request>();
		const token = this.extractTokenFromHeader(request);
		if (!token) {
			request.user = undefined;

			return next.handle();
		}
		try {
			const payload = await this.jwtService.verifyAsync<JwtPayload>(token, {
				secret: this.configService.get('JWT_SECRET_KEY'),
			});

			request.user = { id: payload.sub };
		} catch {
			request.user = undefined;

			return next.handle();
		}

		return next.handle();
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
