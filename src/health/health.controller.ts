import { Controller, Get } from '@nestjs/common';
import * as packageJson from '../../package.json';

@Controller('health')
export class HealthController {
  @Get('version')
  getVersion() {
    return {
      name: packageJson.name,
      version: packageJson.version,
      description: packageJson.description,
    };
  }

  @Get('status')
  getHealth() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }
}
