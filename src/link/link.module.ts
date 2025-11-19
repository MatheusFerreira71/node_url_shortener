import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RedisModule } from '../redis/redis.module';
import { LinkController } from './link.controller';
import { Link } from './link.entity';
import { LinkService } from './link.service';
import {
	AccessLinkUsecase,
	CreateLinkUsecase,
	DeleteLinkUsecase,
	HashIsInvalidUsecase,
	ListLinksByUserUsecase,
	PersistClickOnDbUsecase,
	UpdateLinkUsecase,
} from './usecases';

@Module({
	providers: [
		LinkService,
		CreateLinkUsecase,
		UpdateLinkUsecase,
		DeleteLinkUsecase,
		ListLinksByUserUsecase,
		HashIsInvalidUsecase,
		AccessLinkUsecase,
		PersistClickOnDbUsecase,
	],
	controllers: [LinkController],
	imports: [TypeOrmModule.forFeature([Link]), RedisModule],
	exports: [LinkService],
})
export class LinkModule {}
