import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
// biome-ignore lint/style/useImportType: falso positivo, o nest precisa usar isso na injeção de dependência
import { Repository } from 'typeorm';
import type { Usecase } from '../../resources';
import { User } from '../user.entity';

@Injectable()
export class FindByEmail implements Usecase<string, User> {
	constructor(
		@InjectRepository(User) private userRepository: Repository<User>,
	) {}

	async execute(email: string): Promise<User> {
		const user = await this.userRepository.findOne({
			where: { email },
		});

		if (!user) {
			throw new NotFoundException('Usuário não encontrado', {
				cause: 'NotFoundError',
				description: 'Nenhum usuário foi encontrado com o e-mail fornecido.',
			});
		}

		return user;
	}
}
