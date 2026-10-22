import 'reflect-metadata';
import { type INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import { AppModule } from '../app.module';

// These tests MUST use a separate, disposable PostgreSQL database.
// The port and database name guard against accidental use of the development DB.
const EXPECTED_HOSTS = new Set(['127.0.0.1', 'localhost']);
const MISSING_TURBINE_ID = '00000000-0000-4000-8000-000000000000';

interface TurbineResponse {
  id: string;
  name: string;
  location: string;
  capacityKw: number;
  status: string;
}

interface MaintenanceResponse {
  id: string;
  turbineId: string;
  notes: string;
}

describe('WindOps HTTP + PostgreSQL integration', () => {
  let app: INestApplication | undefined;
  let baseUrl: string;
  let database: DataSource;

  beforeAll(async () => {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error(
        'Set DATABASE_URL to the isolated windops_test database on port 5435.',
      );
    }

    const url = new URL(connectionString);
    if (
      !EXPECTED_HOSTS.has(url.hostname) ||
      url.port !== '5435' ||
      url.pathname !== '/windops_test' ||
      url.username !== 'windops_test'
    ) {
      throw new Error(
        'Refusing to run: integration tests require local windops_test on port 5435.',
      );
    }

    const testingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = testingModule.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.listen(0, '127.0.0.1');
    baseUrl = await app.getUrl();
    database = app.get(DataSource);
  }, 60_000);

  afterAll(async () => {
    await app?.close();
  });

  it('starts the app, runs migrations and responds to health checks', async () => {
    expect(database.isInitialized).toBe(true);
    expect(await database.query("SELECT to_regclass('public.turbines') AS table_name"))
      .toEqual([{ table_name: 'turbines' }]);

    const response = await fetch(baseUrl + '/health');
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      status: 'ok',
      service: 'windops-api',
    });
  });

  it('persists a turbine and its maintenance through real HTTP requests', async () => {
    const createResponse = await fetch(baseUrl + '/turbines', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Integration T-' + Date.now(),
        location: 'Test wind farm',
        capacityKw: 2500,
      }),
    });
    expect(createResponse.status).toBe(201);
    const turbine = (await createResponse.json()) as TurbineResponse;
    expect(turbine.id).toEqual(expect.any(String));
    expect(turbine.status).toBe('ACTIVE');

    const queryRows = (await database.query(
      'SELECT status FROM turbines WHERE id = $1',
      [turbine.id],
    )) as Array<{ status: string }>;
    expect(queryRows).toEqual([{ status: 'ACTIVE' }]);

    const updateResponse = await fetch(
      baseUrl + '/turbines/' + turbine.id + '/status',
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'MAINTENANCE' }),
      },
    );
    expect(updateResponse.status).toBe(200);
    expect((await updateResponse.json()) as TurbineResponse).toMatchObject({
      id: turbine.id,
      status: 'MAINTENANCE',
    });

    const maintenanceResponse = await fetch(
      baseUrl + '/turbines/' + turbine.id + '/maintenance',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: 'Integration test inspection' }),
      },
    );
    expect(maintenanceResponse.status).toBe(201);
    const maintenance = (await maintenanceResponse.json()) as MaintenanceResponse;
    expect(maintenance.turbineId).toBe(turbine.id);

    const getResponse = await fetch(baseUrl + '/turbines/' + turbine.id);
    expect(getResponse.status).toBe(200);
    expect((await getResponse.json()) as TurbineResponse).toMatchObject({
      id: turbine.id,
      status: 'MAINTENANCE',
    });

    const historyResponse = await fetch(
      baseUrl + '/turbines/' + turbine.id + '/maintenance',
    );
    expect(historyResponse.status).toBe(200);
    const history = (await historyResponse.json()) as MaintenanceResponse[];
    expect(history).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: maintenance.id,
          turbineId: turbine.id,
          notes: 'Integration test inspection',
        }),
      ]),
    );

    const persistedEvents = (await database.query(
      'SELECT turbine_id FROM maintenance_events WHERE id = $1',
      [maintenance.id],
    )) as Array<{ turbine_id: string }>;
    expect(persistedEvents).toEqual([{ turbine_id: turbine.id }]);
  });

  it('rejects invalid input via the global ValidationPipe', async () => {
    const response = await fetch(baseUrl + '/turbines', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Invalid',
        location: 'Test',
        capacityKw: -1,
        unexpectedField: true,
      }),
    });
    expect(response.status).toBe(400);
  });

  it('returns 404 for a well-formed but unknown turbine UUID', async () => {
    const response = await fetch(baseUrl + '/turbines/' + MISSING_TURBINE_ID);
    expect(response.status).toBe(404);
  });
});
