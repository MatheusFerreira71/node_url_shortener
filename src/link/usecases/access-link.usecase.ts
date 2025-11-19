import { GoneException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
// biome-ignore lint/style/useImportType: falso positivo, o nest precisa disso para a injeção de dependência
import { Repository } from 'typeorm';
// biome-ignore lint/style/useImportType: falso positivo, o nest precisa disso para a injeção de dependência
import { RedisService } from '../../redis/redis.service';
import type { Usecase } from '../../resources';
import { Link } from '../link.entity';

@Injectable()
export class AccessLinkUsecase implements Usecase<string, string> {
	constructor(
		@InjectRepository(Link) private linkRepository: Repository<Link>,
		private redisService: RedisService,
	) {}

	async execute(hash: string): Promise<string> {
		const link = await this.linkRepository.findOneBy({ hash });

		if (!link) {
			throw new NotFoundException('Link não encontrado', {
				description: `Não existe link ativo com o hash ${hash}`,
				cause: 'NotFoundError',
			});
		}

		if (link.expires_at && link.expires_at < new Date()) {
			throw new GoneException('Link expirado', {
				description: `O link com hash ${hash} expirou.`,
				cause: 'GoneError',
			});
		}

		await this.redisService.incrementKey(link.id);

		return link.current_url;
	}
}
