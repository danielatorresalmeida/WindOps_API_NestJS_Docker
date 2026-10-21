import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post } from '@nestjs/common';
import { CreateMaintenanceDto } from './dto/create-maintenance.dto';
import { CreateTurbineDto } from './dto/create-turbine.dto';
import { UpdateStatusDto } from './dto/update-status.dto';
import { TurbinesService } from './turbines.service';

@Controller('turbines')
export class TurbinesController {
  constructor(private readonly service: TurbinesService) {}

  @Get()
  list() {
    return this.service.list();
  }

  @Post()
  create(@Body() body: CreateTurbineDto) {
    return this.service.create(body);
  }

  @Get(':id')
  findOne(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string) {
    return this.service.findOne(id);
  }

  @Patch(':id/status')
  setStatus(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() body: UpdateStatusDto,
  ) {
    return this.service.setStatus(id, body);
  }

  @Post(':id/maintenance')
  addMaintenance(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() body: CreateMaintenanceDto,
  ) {
    return this.service.addMaintenance(id, body);
  }

  @Get(':id/maintenance')
  listMaintenance(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string) {
    return this.service.listMaintenance(id);
  }
}
