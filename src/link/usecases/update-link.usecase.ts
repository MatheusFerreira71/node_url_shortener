import {
	ForbiddenException,
	Injectable,
	NotFoundException,
} from '@nestjs/common';
// biome-ignore lint/style/useImportType: falso positivo, o nest precisa disso para a injeção de dependência
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
// biome-ignore lint/style/useImportType: falso positivo, o nest precisa disso para a injeção de dependência
import { Repository } from 'typeorm';
import type { Usecase } from '../../resources';
import type { Env } from '../../types/globals.types';
import { Link } from '../link.entity';
import type {
	UpdateLinkResponse,
	UpdateLinkUsecasePayload,
} from '../link.types';

@Injectable()
export class UpdateLinkUsecase
	implements Usecase<UpdateLinkUsecasePayload, UpdateLinkResponse>
{
	constructor(
		@InjectRepository(Link) private linkRepository: Repository<Link>,
		private configService: ConfigService<Env, true>,
	) {}

	async execute({
		hash,
		current_url,
		user_id,
	}: UpdateLinkUsecasePayload): Promise<UpdateLinkResponse> {
		const link = await this.linkRepository.findOneBy({ hash });

		if (!link) {
			throw new NotFoundException('Link não encontrado', {
				description: `Não existe link ativo com o hash ${hash}`,
				cause: 'NotFoundError',
			});
		}

		if (!user_id || link.user_id !== user_id) {
			throw new ForbiddenException('Ação não permitida', {
				description: 'Você não tem permissão para atualizar este link',
				cause: 'ForbiddenError',
			});
		}

		const { expires_at, created_at, updated_at } =
			await this.linkRepository.save({
				...link,
				current_url,
			});

		const shortUrl = `${this.configService.get('BASE_URL')}/link/${link.hash}`;

		return {
			current_url,
			hash,
			expires_at,
			created_at,
			user_id,
			updated_at,
			short_url: shortUrl,
		};
	}
}
