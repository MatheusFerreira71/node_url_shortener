import { Controller, Get } from '@nestjs/common';
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

	@Get('version')
	getVersion() {
		return {
			name: packageJson.name,
			version: packageJson.version,
			description: packageJson.description,
		};
	}

	@Get('http')
	@HealthCheck()
	httpHealth() {
		return this.health.check([
			() => this.http.pingCheck('nestjs-docs', 'https://docs.nestjs.com'),
		]);
	}

	@Get('db')
	@HealthCheck()
	dbHealth() {
		return this.health.check([() => this.db.pingCheck('database')]);
	}

	@Get('memory')
	@HealthCheck()
	memoryHealth() {
		return this.health.check([
			() => this.memory.checkHeap('memory_heap', 512 * 1024 * 1024),
			() => this.memory.checkRSS('memory_rss', 1024 * 1024 * 1024),
		]);
	}
}
