import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { IsMaster } from './common/decorators/is-master.decorator';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}
  @Get()
  @IsMaster()
  getHello(): string {
    return this.appService.getHello();
  }

  @IsMaster()
  @Get('/health')
  health() {
    return { status: 'ok' };
  }
}
