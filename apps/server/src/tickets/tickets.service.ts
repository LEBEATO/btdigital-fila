import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TicketsGateway } from './tickets.gateway';

@Injectable()
export class TicketsService {
  private priorityCallsInRow = 0;

  constructor(
    private readonly prisma: PrismaService,
    private readonly ticketsGateway: TicketsGateway,
  ) {}

  async create(priority: 'NORMAL' | 'PRIORITY' = 'NORMAL') {
    const prefix = priority === 'PRIORITY' ? 'P' : 'A';

    const lastTicket = await this.prisma.ticket.findFirst({
      where: { priority },
      orderBy: { number: 'desc' },
    });

    const nextNumber = (lastTicket?.number ?? 0) + 1;
    const code = `${prefix}-${String(nextNumber).padStart(3, '0')}`;

    return this.prisma.ticket.create({
      data: { number: nextNumber, code, status: 'WAITING', priority },
    });
  }

  async findAll() {
    return this.prisma.ticket.findMany({
      orderBy: { createdAt: 'asc' },
    });
  }

  async callNext(counter: number) {
    const activeTicket = await this.prisma.ticket.findFirst({
      where: {
        counter,
        status: { in: ['CALLED', 'SERVING'] },
      },
      orderBy: { calledAt: 'desc' },
    });

    if (activeTicket) {
      return {
        message: `O guichê ${counter} já possui a senha ${activeTicket.code} em andamento.`,
      };
    }

    const priorityTicket = await this.prisma.ticket.findFirst({
      where: { status: 'WAITING', priority: 'PRIORITY' },
      orderBy: { createdAt: 'asc' },
    });

    const normalTicket = await this.prisma.ticket.findFirst({
      where: { status: 'WAITING', priority: 'NORMAL' },
      orderBy: { createdAt: 'asc' },
    });

    if (!priorityTicket && !normalTicket) {
      return { message: 'Não há senhas aguardando atendimento.' };
    }

    let nextTicket;

    if (priorityTicket && normalTicket) {
      if (this.priorityCallsInRow < 2) {
        nextTicket = priorityTicket;
        this.priorityCallsInRow++;
      } else {
        nextTicket = normalTicket;
        this.priorityCallsInRow = 0;
      }
    } else if (priorityTicket) {
      nextTicket = priorityTicket;
    } else {
      nextTicket = normalTicket;
      this.priorityCallsInRow = 0;
    }

    const calledTicket = await this.prisma.ticket.update({
      where: { id: nextTicket.id },
      data: { status: 'CALLED', counter, calledAt: new Date() },
    });

    this.ticketsGateway.emitTicketCalled(calledTicket);
    return calledTicket;
  }

  async startService(id: number) {
    const ticket = await this.prisma.ticket.findUnique({ where: { id } });

    if (!ticket) return { message: 'Senha não encontrada.' };

    if (ticket.status !== 'CALLED') {
      return { message: 'Esta senha precisa estar chamada antes de iniciar o atendimento.' };
    }

    return this.prisma.ticket.update({
      where: { id },
      data: { status: 'SERVING', startedAt: new Date() },
    });
  }

  async finishService(id: number) {
    const ticket = await this.prisma.ticket.findUnique({ where: { id } });

    if (!ticket) return { message: 'Senha não encontrada.' };

    if (ticket.status !== 'SERVING') {
      return { message: 'Esta senha precisa estar em atendimento antes de ser finalizada.' };
    }

    return this.prisma.ticket.update({
      where: { id },
      data: { status: 'FINISHED', finishedAt: new Date() },
    });
  }
}
