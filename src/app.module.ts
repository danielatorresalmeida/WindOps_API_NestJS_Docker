import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HealthController } from './health.controller';
import { TurbinesModule } from './turbines/turbines.module';
import { Turbine } from './turbines/turbine.entity';
import { MaintenanceEvent } from './turbines/maintenance.entity';
import { InitialSchema1760000000000 } from './database/migrations/1760000000000-initial-schema';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres' as const,
        url: config.getOrThrow<string>('DATABASE_URL'),
        entities: [Turbine, MaintenanceEvent],
        migrations: [InitialSchema1760000000000],
        migrationsRun: true,
        synchronize: false,
        retryAttempts: 12,
        retryDelay: 2000,
      }),
    }),
    TurbinesModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
