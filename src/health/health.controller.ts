import { Controller, Get, HttpCode, HttpStatus } from '@nestjs/common';
// biome-ignore lint/style/useImportType: falso positivo, o nest precisa das classes para injeção de dependência
import {
	HealthCheck,
	HealthCheckService,
	HttpHealthIndicator,
	MemoryHealthIndicator,
	TypeOrmHealthIndicator,
} from '@nestjs/terminus';
import * as packageJson from '../../package.json';

@Controller('health')
export class HealthController {
	constructor(
		private health: HealthCheckService,
		private http: HttpHealthIndicator,
		private db: TypeOrmHealthIndicator,
		private memory: MemoryHealthIndicator,
	) {}

	@HttpCode(HttpStatus.OK)
	@Get('version')
	getVersion() {
		return {
			name: packageJson.name,
			version: packageJson.version,
			description: packageJson.description,
		};
	}

	@HttpCode(HttpStatus.OK)
	@Get('http')
	@HealthCheck()
	httpHealth() {
		return this.health.check([
			() => this.http.pingCheck('nestjs-docs', 'https://docs.nestjs.com'),
		]);
	}

	@HttpCode(HttpStatus.OK)
	@Get('db')
	@HealthCheck()
	dbHealth() {
		return this.health.check([() => this.db.pingCheck('database')]);
	}

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
