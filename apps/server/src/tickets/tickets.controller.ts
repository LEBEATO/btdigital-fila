import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { TicketsService } from './tickets.service';

@Controller('tickets')
export class TicketsController {
  constructor(private readonly ticketsService: TicketsService) {}

  @Post('normal')
  createNormal() {
    return this.ticketsService.create('NORMAL');
  }

  @Post('priority')
  createPriority() {
    return this.ticketsService.create('PRIORITY');
  }

  @Get()
  findAll() {
    return this.ticketsService.findAll();
  }

  @Post('call-next/:counter')
  callNext(@Param('counter', ParseIntPipe) counter: number) {
    return this.ticketsService.callNext(counter);
  }

  @Patch(':id/start')
  startService(@Param('id', ParseIntPipe) id: number) {
    return this.ticketsService.startService(id);
  }

  @Patch(':id/finish')
  finishService(@Param('id', ParseIntPipe) id: number) {
    return this.ticketsService.finishService(id);
  }
}