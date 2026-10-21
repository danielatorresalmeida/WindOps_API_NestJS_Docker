import { NotFoundException } from '@nestjs/common';
import { TurbinesService } from './turbines.service';
import { TurbineStatus } from './turbine-status.enum';

const id = '123e4567-e89b-42d3-a456-426614174000';

describe('TurbinesService', () => {
  const turbines = {
    find: jest.fn(),
    findOneBy: jest.fn(),
    create: jest.fn((value: unknown) => value),
    save: jest.fn((value: unknown) => Promise.resolve(value)),
  };
  const events = {
    find: jest.fn(),
    create: jest.fn((value: unknown) => value),
    save: jest.fn((value: unknown) => Promise.resolve(value)),
  };
  const service = new TurbinesService(turbines as never, events as never);

  beforeEach(() => jest.clearAllMocks());

  it('creates a turbine active by default', async () => {
    const result = await service.create({ name: 'T-01', location: 'Cascais', capacityKw: 2000 });
    expect(result.status).toBe(TurbineStatus.ACTIVE);
    expect(result.id).toEqual(expect.any(String));
    expect(turbines.save).toHaveBeenCalledTimes(1);
  });

  it('returns 404 if a turbine does not exist', async () => {
    turbines.findOneBy.mockResolvedValueOnce(null);
    await expect(service.findOne(id)).rejects.toThrow(NotFoundException);
  });

  it('updates the status of an existing turbine', async () => {
    turbines.findOneBy.mockResolvedValueOnce({ id, status: TurbineStatus.ACTIVE });
    const updated = await service.setStatus(id, { status: TurbineStatus.MAINTENANCE });
    expect(updated.status).toBe(TurbineStatus.MAINTENANCE);
  });

  it('stores a maintenance event linked to an existing turbine', async () => {
    turbines.findOneBy.mockResolvedValueOnce({ id, status: TurbineStatus.ACTIVE });
    const event = await service.addMaintenance(id, { notes: 'Visual inspection completed' });
    expect(event.turbineId).toBe(id);
    expect(events.save).toHaveBeenCalledTimes(1);
  });
});
