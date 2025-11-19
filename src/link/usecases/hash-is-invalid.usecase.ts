import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
// biome-ignore lint/style/useImportType: falso positivo, o nest precisa disso para a injeção de dependência
import { Repository } from 'typeorm';
import type { Usecase } from '../../resources';
import { Link } from '../link.entity';

@Injectable()
export class HashIsInvalidUsecase implements Usecase<string, boolean> {
	constructor(
		@InjectRepository(Link) private linkRepository: Repository<Link>,
	) {}

	async execute(hash: string): Promise<boolean> {
		const link = await this.linkRepository.findOne({ where: { hash } });
		return !!link;
	}
}
