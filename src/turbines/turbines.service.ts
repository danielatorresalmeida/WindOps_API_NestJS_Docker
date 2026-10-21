import { randomUUID } from 'node:crypto';
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateMaintenanceDto } from './dto/create-maintenance.dto';
import { CreateTurbineDto } from './dto/create-turbine.dto';
import { UpdateStatusDto } from './dto/update-status.dto';
import { MaintenanceEvent } from './maintenance.entity';
import { TurbineStatus } from './turbine-status.enum';
import { Turbine } from './turbine.entity';

@Injectable()
export class TurbinesService {
  constructor(
    @InjectRepository(Turbine)
    private readonly turbineRepository: Repository<Turbine>,
    @InjectRepository(MaintenanceEvent)
    private readonly maintenanceRepository: Repository<MaintenanceEvent>,
  ) {}

  list(): Promise<Turbine[]> {
    return this.turbineRepository.find({ order: { createdAt: 'DESC' } });
  }

  async findOne(id: string): Promise<Turbine> {
    const turbine = await this.turbineRepository.findOneBy({ id });
    if (!turbine) throw new NotFoundException('Turbine not found');
    return turbine;
  }

  create(input: CreateTurbineDto): Promise<Turbine> {
    const turbine = this.turbineRepository.create({
      id: randomUUID(),
      ...input,
      status: TurbineStatus.ACTIVE,
    });
    return this.turbineRepository.save(turbine);
  }

  async setStatus(id: string, input: UpdateStatusDto): Promise<Turbine> {
    const turbine = await this.findOne(id);
    turbine.status = input.status;
    return this.turbineRepository.save(turbine);
  }

  async addMaintenance(id: string, input: CreateMaintenanceDto): Promise<MaintenanceEvent> {
    await this.findOne(id);
    const event = this.maintenanceRepository.create({
      id: randomUUID(),
      turbineId: id,
      notes: input.notes,
    });
    return this.maintenanceRepository.save(event);
  }

  async listMaintenance(id: string): Promise<MaintenanceEvent[]> {
    await this.findOne(id);
    return this.maintenanceRepository.find({
      where: { turbineId: id },
      order: { createdAt: 'DESC' },
    });
  }
}
