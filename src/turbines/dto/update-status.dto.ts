import { IsEnum } from 'class-validator';
import { TurbineStatus } from '../turbine-status.enum';

export class UpdateStatusDto {
  @IsEnum(TurbineStatus)
  status!: TurbineStatus;
}
