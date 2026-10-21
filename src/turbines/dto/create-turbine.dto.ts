import { IsInt, IsNotEmpty, IsString, Max, MaxLength, Min } from 'class-validator';

export class CreateTurbineDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  location!: string;

  @IsInt()
  @Min(1)
  @Max(50000)
  capacityKw!: number;
}
