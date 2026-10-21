import { Column, CreateDateColumn, Entity, PrimaryColumn } from 'typeorm';
import { TurbineStatus } from './turbine-status.enum';

@Entity({ name: 'turbines' })
export class Turbine {
  @PrimaryColumn('uuid')
  id!: string;

  @Column({ length: 100 })
  name!: string;

  @Column({ length: 120 })
  location!: string;

  @Column({ name: 'capacity_kw', type: 'integer' })
  capacityKw!: number;

  @Column({ type: 'varchar', length: 16, default: TurbineStatus.ACTIVE })
  status!: TurbineStatus;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}
