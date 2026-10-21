import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Turbine } from './turbine.entity';
import { MaintenanceEvent } from './maintenance.entity';
import { TurbinesController } from './turbines.controller';
import { TurbinesService } from './turbines.service';

@Module({
  imports: [TypeOrmModule.forFeature([Turbine, MaintenanceEvent])],
  controllers: [TurbinesController],
  providers: [TurbinesService],
})
export class TurbinesModule {}
