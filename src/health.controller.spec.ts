import { HealthController } from './health.controller';

describe('HealthController', () => {
  it('returns health status', () => {
    expect(new HealthController().check()).toEqual({ status: 'ok', service: 'windops-api' });
  });
});
