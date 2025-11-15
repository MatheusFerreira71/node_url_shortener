import path from 'node:path';
import type { ConfigService } from '@nestjs/config';
import type { TypeOrmModuleOptions } from '@nestjs/typeorm';
import type { Env } from './env.config';

export const typeOrmConfig = (
  config: ConfigService<Env, true>,
): TypeOrmModuleOptions => ({
  type: 'postgres',
  host: config.get('DB_HOST', { infer: true }),
  port: config.get('DB_PORT', { infer: true }),
  username: config.get('DB_USER', { infer: true }),
  password: config.get('DB_PASS', { infer: true }),
  database: config.get('DB_NAME', { infer: true }),
  autoLoadEntities: true,
  migrations: [
    path.join(__dirname, '..', 'database', 'migrations', '*.{ts,js}'),
  ],
  synchronize: false,
});
