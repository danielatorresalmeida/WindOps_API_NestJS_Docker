import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1760000000000 implements MigrationInterface {
  name = 'InitialSchema1760000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE turbines (
        id uuid PRIMARY KEY,
        name varchar(100) NOT NULL,
        location varchar(120) NOT NULL,
        capacity_kw integer NOT NULL CHECK (capacity_kw > 0),
        status varchar(16) NOT NULL DEFAULT 'ACTIVE'
          CHECK (status IN ('ACTIVE', 'MAINTENANCE', 'OFFLINE')),
        created_at timestamptz NOT NULL DEFAULT now()
      );
    `);
    await queryRunner.query(`
      CREATE TABLE maintenance_events (
        id uuid PRIMARY KEY,
        turbine_id uuid NOT NULL REFERENCES turbines(id) ON DELETE CASCADE,
        notes text NOT NULL,
        created_at timestamptz NOT NULL DEFAULT now()
      );
    `);
    await queryRunner.query('CREATE INDEX idx_maintenance_turbine ON maintenance_events(turbine_id)');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE maintenance_events');
    await queryRunner.query('DROP TABLE turbines');
  }
}
