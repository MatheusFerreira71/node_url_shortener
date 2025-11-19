import { ForbiddenException, Injectable } from '@nestjs/common';
// biome-ignore lint/style/useImportType: falso positivo, o nest precisa disso para a injeção de dependência
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
// biome-ignore lint/style/useImportType: falso positivo, o nest precisa disso para a injeção de dependência
import { Repository } from 'typeorm';
import type { Usecase } from '../../resources';
import type { Env } from '../../types/globals.types';
import { Link } from '../link.entity';
import type { ReturnedLink } from '../link.types';

@Injectable()
export class ListLinksByUserUsecase implements Usecase<string, ReturnedLink[]> {
	constructor(
		@InjectRepository(Link) private linkRepository: Repository<Link>,
		private configService: ConfigService<Env, true>,
	) {}

	async execute(user_id: string): Promise<ReturnedLink[]> {
		if (!user_id) {
			throw new ForbiddenException('Ação não permitida', {
				description: 'Você precisa estar logado para listar seus links',
				cause: 'ForbiddenError',
			});
		}

		const links = await this.linkRepository.findBy({ user_id });

		const mappedLinks = links.map<ReturnedLink>((link) => {
			const shortUrl = `${this.configService.get('BASE_URL')}/${link.hash}`;
			const {
				current_url,
				hash,
				expires_at,
				created_at,
				user_id,
				original_url,
				times_clicked,
				updated_at,
			} = link;

			return {
				current_url,
				hash,
				expires_at,
				created_at,
				user_id,
				original_url,
				times_clicked,
				updated_at,
				short_url: shortUrl,
			};
		});

		return mappedLinks;
	}
}
