import {
	type ArgumentsHost,
	Catch,
	type ExceptionFilter,
	HttpStatus,
} from '@nestjs/common';
import type { Response } from 'express';
import z, { ZodError } from 'zod';

@Catch(ZodError)
export class ZodExceptionFilter implements ExceptionFilter {
	catch(exception: ZodError, host: ArgumentsHost): Response {
		const ctx = host.switchToHttp();
		const response = ctx.getResponse<Response>();

		return response.status(HttpStatus.BAD_REQUEST).json({
			statusCode: HttpStatus.BAD_REQUEST,
			message: 'Validação falhou',
			errors: z.treeifyError(exception),
		});
	}
}
