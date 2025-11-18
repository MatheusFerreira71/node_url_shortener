import { Body, Controller, Post, Res, UsePipes } from '@nestjs/common';
import type { Response } from 'express';
import { ZodValidationPipe } from '../common/pipes';
import { UserCreateSchema } from './user.schema';
// biome-ignore lint/style/useImportType: falso positivo, o nest precisa usar isso na injeção de dependência
import { UserService } from './user.service';
import type { UserCreateDto } from './user.types';

@Controller('user')
export class UserController {
	constructor(private userService: UserService) {}

	@Post()
	@UsePipes(new ZodValidationPipe(UserCreateSchema))
	async createUser(
		@Body() body: UserCreateDto,
		@Res() res: Response,
	): Promise<Response> {
		const createdUser = await this.userService.createUser(body);

		return res.json(createdUser);
	}
}
