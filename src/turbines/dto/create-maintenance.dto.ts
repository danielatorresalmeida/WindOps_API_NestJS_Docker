import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateMaintenanceDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  notes!: string;
}
