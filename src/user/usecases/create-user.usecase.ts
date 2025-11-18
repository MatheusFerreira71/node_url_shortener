import { ConflictException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
// biome-ignore lint/style/useImportType: falso positivo, o nest precisa usar isso na injeção de dependência
import { Repository } from 'typeorm';
// biome-ignore lint/style/useImportType: falso positivo, o nest precisa usar isso na injeção de dependência
import { CommonService } from '../../common/common.service';
import type { Usecase } from '../../resources';
import { User } from '../user.entity';
import type { CreatedUserResponse, UserCreateDto } from '../user.types';

@Injectable()
export class CreateUser implements Usecase<UserCreateDto, CreatedUserResponse> {
	constructor(
		@InjectRepository(User) private usersRepository: Repository<User>,
		private commonService: CommonService,
	) {}

	async execute(args: UserCreateDto): Promise<CreatedUserResponse> {
		const hasEmail = await this.usersRepository.findOne({
			where: { email: args.email },
		});

		if (hasEmail) {
			throw new ConflictException('E-mail já está sendo usado', {
				cause: 'ValidationError',
				description: 'O e-mail fornecido já está registrado.',
			});
		}

		const hashedPassword = await this.commonService.hash(args.password);
		const userToCreate = { ...args, password: hashedPassword };

		const user = this.usersRepository.create(userToCreate);

		await this.usersRepository.save(user);

		const { created_at, email, id, name } = user;

		return { created_at, email, id, name };
	}
}
