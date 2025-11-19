import {
	Body,
	Controller,
	HttpCode,
	HttpStatus,
	Post,
	UsePipes,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ZodValidationPipe } from '../common/pipes';
import { UserCreateSchema } from './user.schema';
// biome-ignore lint/style/useImportType: falso positivo, o nest precisa usar isso na injeção de dependência
import { UserService } from './user.service';
import type { CreatedUserResponse, UserCreateDto } from './user.types';

@ApiTags('Usuários')
@Controller('user')
export class UserController {
	constructor(private userService: UserService) {}

	@ApiOperation({ summary: 'Cria um novo usuário' })
	@ApiResponse({
		status: 201,
		description: 'Usuário criado com sucesso',
	})
	@ApiResponse({
		status: 400,
		description: 'Dados inválidos ou email já cadastrado',
	})
	@ApiResponse({
		status: 409,
		description: 'Email já cadastrado',
	})
	@Post()
	@HttpCode(HttpStatus.CREATED)
	@UsePipes(new ZodValidationPipe(UserCreateSchema))
	async createUser(@Body() body: UserCreateDto): Promise<CreatedUserResponse> {
		const createdUser = await this.userService.createUser(body);

		return createdUser;
	}
}
