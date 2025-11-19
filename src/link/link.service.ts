import { Injectable } from '@nestjs/common';
import type { Link } from './link.entity';
import type {
	CreateLinkDto,
	DeleteLinkUsecasePayload,
	ReturnedLink,
	UpdateLinkResponse,
	UpdateLinkUsecasePayload,
} from './link.types';
// biome-ignore lint/style/useImportType: falso positivo, o nest precisa disso para a injeção de dependência
import {
	AccessLinkUsecase,
	CreateLinkUsecase,
	DeleteLinkUsecase,
	ListLinksByUserUsecase,
	UpdateLinkUsecase,
} from './usecases';

@Injectable()
export class LinkService {
	constructor(
		private createLinkUsecase: CreateLinkUsecase,
		private deleteLinkUsecase: DeleteLinkUsecase,
		private listLinksByUserUsecase: ListLinksByUserUsecase,
		private updateLinkUsecase: UpdateLinkUsecase,
		private accessLinkUsecase: AccessLinkUsecase,
	) {}

	async createLink(args: CreateLinkDto): Promise<Link> {
		return this.createLinkUsecase.execute(args);
	}

	async deleteLink(payload: DeleteLinkUsecasePayload): Promise<void> {
		return this.deleteLinkUsecase.execute(payload);
	}

	async listLinksByUserId(user_id: string): Promise<ReturnedLink[]> {
		return this.listLinksByUserUsecase.execute(user_id);
	}

	async updateLink(
		payload: UpdateLinkUsecasePayload,
	): Promise<UpdateLinkResponse> {
		return this.updateLinkUsecase.execute(payload);
	}

	async accessLink(hash: string): Promise<string> {
		return this.accessLinkUsecase.execute(hash);
	}
}
