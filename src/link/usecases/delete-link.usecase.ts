import {
	ForbiddenException,
	Injectable,
	NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
// biome-ignore lint/style/useImportType: falso positivo, o nest precisa disso para a injeção de dependência
import { Repository } from 'typeorm';
import type { Usecase } from '../../resources';
import { Link } from '../link.entity';
import type { DeleteLinkUsecasePayload } from '../link.types';

@Injectable()
export class DeleteLinkUsecase
	implements Usecase<DeleteLinkUsecasePayload, void>
{
	constructor(
		@InjectRepository(Link) private linkRepository: Repository<Link>,
	) {}

	async execute({ hash, user_id }: DeleteLinkUsecasePayload): Promise<void> {
		const link = await this.linkRepository.findOneBy({ hash });
		if (!link) {
			throw new NotFoundException('Link não encontrado', {
				description: `Não existe link ativo com o hash ${hash}`,
				cause: 'NotFoundError',
			});
		}

		if (!user_id || link.user_id !== user_id) {
			throw new ForbiddenException('Ação não permitida', {
				description: 'Você não tem permissão para deletar este link',
				cause: 'ForbiddenError',
			});
		}

		await this.linkRepository.softDelete({ hash });
	}
}
