import { Injectable } from '@nestjs/common';
// biome-ignore lint/style/useImportType: falso positivo, o nest precisa usar isso na injeção de dependência
import { CreateUser } from './usecases';
import type { CreatedUserResponse, UserCreateDto } from './user.types';

@Injectable()
export class UserService {
	constructor(private createUserUsecase: CreateUser) {}

	async createUser(args: UserCreateDto): Promise<CreatedUserResponse> {
		return await this.createUserUsecase.execute(args);
	}
}
