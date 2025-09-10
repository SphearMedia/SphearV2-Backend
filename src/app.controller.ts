import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  @Get('/')
  root() {
    return {
      status: 'Sphear Music API is online',
      time: new Date().toISOString(),
    };
  }
}
