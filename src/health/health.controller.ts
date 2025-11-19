import { Controller, Get, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
// biome-ignore lint/style/useImportType: falso positivo, o nest precisa das classes para injeção de dependência
import {
	HealthCheck,
	HealthCheckService,
	HttpHealthIndicator,
	MemoryHealthIndicator,
	TypeOrmHealthIndicator,
} from '@nestjs/terminus';
import * as packageJson from '../../package.json';
import type { VersionResponse } from './health.types';

@ApiTags('Health Check')
@Controller('health')
export class HealthController {
	constructor(
		private health: HealthCheckService,
		private http: HttpHealthIndicator,
		private db: TypeOrmHealthIndicator,
		private memory: MemoryHealthIndicator,
	) {}

	@ApiOperation({ summary: 'Retorna a versão da aplicação' })
	@ApiResponse({
		status: 200,
		description: 'Versão retornada com sucesso',
	})
	@HttpCode(HttpStatus.OK)
	@Get('version')
	getVersion(): VersionResponse {
		return {
			name: packageJson.name,
			version: packageJson.version,
			description: packageJson.description,
		};
	}

	@ApiOperation({ summary: 'Verifica o status da conexão HTTP' })
	@ApiResponse({
		status: 200,
		description: 'Health check HTTP realizado com sucesso',
	})
	@HttpCode(HttpStatus.OK)
	@Get('http')
	@HealthCheck()
	httpHealth() {
		return this.health.check([
			() => this.http.pingCheck('nestjs-docs', 'https://docs.nestjs.com'),
		]);
	}

	@ApiOperation({
		summary: 'Verifica o status da conexão com o banco de dados',
	})
	@ApiResponse({
		status: 200,
		description: 'Health check do banco realizado com sucesso',
	})
	@HttpCode(HttpStatus.OK)
	@Get('db')
	@HealthCheck()
	dbHealth() {
		return this.health.check([() => this.db.pingCheck('database')]);
	}

	@ApiOperation({ summary: 'Verifica o status de uso de memória' })
	@ApiResponse({
		status: 200,
		description: 'Health check de memória realizado com sucesso',
	})
	@HttpCode(HttpStatus.OK)
	@Get('memory')
	@HealthCheck()
	memoryHealth() {
		return this.health.check([
			() => this.memory.checkHeap('memory_heap', 512 * 1024 * 1024),
			() => this.memory.checkRSS('memory_rss', 1024 * 1024 * 1024),
		]);
	}
}
