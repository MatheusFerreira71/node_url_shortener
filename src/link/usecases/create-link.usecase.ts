import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { nanoid } from 'nanoid';
// biome-ignore lint/style/useImportType: falso-positivo, o nest precisa disso para a injeção de dependência
import { Repository } from 'typeorm';
import type { Usecase } from '../../resources';
import { Link } from '../link.entity';
import type { CreateLinkDto } from '../link.types';
// biome-ignore lint/style/useImportType: falso-positivo, o nest precisa disso para a injeção de dependência
import { HashIsInvalidUsecase } from './hash-is-invalid.usecase';

@Injectable()
export class CreateLinkUsecase implements Usecase<CreateLinkDto, Link> {
	constructor(
		@InjectRepository(Link) private linkRepository: Repository<Link>,
		private hashIsValidUsecase: HashIsInvalidUsecase,
	) {}

	async execute({
		original_url,
		expires_at,
		user_id,
	}: CreateLinkDto): Promise<Link> {
		let hash: string = '';

		do {
			hash = nanoid(6);
		} while (await this.hashIsValidUsecase.execute(hash));

		const link = this.linkRepository.create({
			original_url,
			expires_at,
			user_id,
			current_url: original_url,
			hash,
		});

		await this.linkRepository.save(link);
		return link;
	}
}
