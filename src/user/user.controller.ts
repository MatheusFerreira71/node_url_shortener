import {
	Body,
	Controller,
	HttpCode,
	HttpStatus,
	Post,
	UsePipes,
} from '@nestjs/common';
import { ZodValidationPipe } from '../common/pipes';
import { UserCreateSchema } from './user.schema';
// biome-ignore lint/style/useImportType: falso positivo, o nest precisa usar isso na injeção de dependência
import { UserService } from './user.service';
import type { CreatedUserResponse, UserCreateDto } from './user.types';

@Controller('user')
export class UserController {
	constructor(private userService: UserService) {}

	@Post()
	@HttpCode(HttpStatus.CREATED)
	@UsePipes(new ZodValidationPipe(UserCreateSchema))
	async createUser(@Body() body: UserCreateDto): Promise<CreatedUserResponse> {
		const createdUser = await this.userService.createUser(body);

		return createdUser;
	}
}
