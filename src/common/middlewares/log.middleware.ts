import type { NestMiddleware } from '@nestjs/common';
import { Injectable, Logger } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';

@Injectable()
export class LogMiddleware implements NestMiddleware {
	private readonly logger = new Logger('HTTP');

	use(req: Request, res: Response, next: NextFunction) {
		const { method, originalUrl, ip } = req;
		const userAgent = req.get('user-agent') || '';
		const startTime = Date.now();

		// Log da requisição
		this.logger.log(`→ ${method} ${originalUrl} - ${ip} - ${userAgent}`);

		// Intercepta o final da resposta
		res.on('finish', () => {
			const { statusCode } = res;
			const responseTime = Date.now() - startTime;
			const statusEmoji =
				statusCode >= 400 ? '❌' : statusCode >= 300 ? '↩️' : '✅';

			this.logger.log(
				`${statusEmoji} ${method} ${originalUrl} ${statusCode} - ${responseTime}ms`,
			);
		});

		next();
	}
}
