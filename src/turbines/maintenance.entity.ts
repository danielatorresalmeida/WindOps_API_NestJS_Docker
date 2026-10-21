import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { Turbine } from './turbine.entity';

@Entity({ name: 'maintenance_events' })
export class MaintenanceEvent {
  @PrimaryColumn('uuid')
  id!: string;

  @Column({ name: 'turbine_id', type: 'uuid' })
  turbineId!: string;

  @Column({ type: 'text' })
  notes!: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @ManyToOne(() => Turbine, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'turbine_id' })
  turbine!: Turbine;
}
