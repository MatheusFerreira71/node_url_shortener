import { Body, Controller, Post, Res } from '@nestjs/common';
import type { Response } from 'express';
import { UserCreateSchema } from './user.schema';
// biome-ignore lint/style/useImportType: falso positivo, o nest precisa usar isso na injeção de dependência
import { UserService } from './user.service';
import type { UserCreateDto } from './user.types';

@Controller('user')
export class UserController {
	constructor(private userService: UserService) {}

	@Post()
	async createUser(
		@Body() body: UserCreateDto,
		@Res() res: Response,
	): Promise<Response> {
		const parsedBody = UserCreateSchema.parse(body);

		const createdUser = await this.userService.createUser(parsedBody);

		return res.json(createdUser);
	}
}
