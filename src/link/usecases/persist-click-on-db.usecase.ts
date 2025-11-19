import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
// biome-ignore lint/style/useImportType: falso positivo, o nest precisa disso para a injeção de dependência
import { Repository } from 'typeorm';
// biome-ignore lint/style/useImportType: falso positivo, o nest precisa disso para a injeção de dependência
import { RedisService } from '../../redis/redis.service';
import type { Usecase } from '../../resources';
import { Link } from '../link.entity';

@Injectable()
export class PersistClickOnDbUsecase implements Usecase<void, void> {
	constructor(
		@InjectRepository(Link) private linkRepository: Repository<Link>,
		private redisService: RedisService,
	) {}

	@Cron(CronExpression.EVERY_MINUTE)
	async execute(): Promise<void> {
		const clickedLinks = await this.redisService.getAllKeys();

		const clickedLinksFindPromises = clickedLinks.map<Promise<Link | null>>(
			(redisKey) => {
				const id = redisKey.replace('link-', '');
				return this.linkRepository.findOneBy({ id });
			},
		);

		const possibleRetrivedLinks = await Promise.all(clickedLinksFindPromises);

		const retrivedLinks = possibleRetrivedLinks.filter((link) => !!link);

		const updatePromises: Promise<Link>[] = [];

		for await (const link of retrivedLinks) {
			const redisKey = `link-${link.id}`;
			const clicks = await this.redisService.getKeyValue(redisKey);

			link.times_clicked = Number(link.times_clicked) + Number(clicks ?? 0);
			updatePromises.push(this.linkRepository.save(link));
		}

		await Promise.all(updatePromises);

		const removePromises = clickedLinks.map<Promise<void>>((redisKey) => {
			return this.redisService.removeKey(redisKey);
		});

		await Promise.all(removePromises);
	}
}
