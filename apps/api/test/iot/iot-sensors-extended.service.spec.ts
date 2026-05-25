/**
 * Smoke spec for IotSensorsExtendedService (Rule 22: every service needs a unit test).
 */
import { IotSensorsExtendedService } from '../../src/modules/iot/application/iot-sensors-extended.service';

describe('IotSensorsExtendedService', () => {
  const Ok = <T>(data: T) => ({ ok: true, data } as const);
  const repoStub = {
    findDashboard:    jest.fn().mockResolvedValue(Ok({})),
    findLiveReadings: jest.fn().mockResolvedValue(Ok([])),
    findAlerts:       jest.fn().mockResolvedValue(Ok([])),
    findOee:          jest.fn().mockResolvedValue(Ok({ oee: 0.85 })),
    listSensors:      jest.fn().mockResolvedValue(Ok({ items: [], total: 0 })),
    findSensorTrends: jest.fn().mockResolvedValue(Ok([])),
  };

  it('class is defined', () => {
    expect(IotSensorsExtendedService).toBeDefined();
  });

  it('class name matches expected', () => {
    expect(IotSensorsExtendedService.name).toBe('IotSensorsExtendedService');
  });

  it('is constructible with a repo stub', () => {
    const svc = new IotSensorsExtendedService(repoStub as never);
    expect(svc).toBeInstanceOf(IotSensorsExtendedService);
  });

  it('getDashboard delegates to repo.findDashboard', () => {
    const svc = new IotSensorsExtendedService(repoStub as never);
    void svc.getDashboard();
    expect(repoStub.findDashboard).toHaveBeenCalled();
  });

  it('getOee defaults to a 7-day window when period is undefined', () => {
    const svc = new IotSensorsExtendedService(repoStub as never);
    void svc.getOee('dev-1', undefined);
    expect(repoStub.findOee).toHaveBeenCalledWith('dev-1', 7);
  });

  it('getAlerts forwards severity and limit to the repo', () => {
    const svc = new IotSensorsExtendedService(repoStub as never);
    void svc.getAlerts('high', 10);
    expect(repoStub.findAlerts).toHaveBeenCalledWith('high', 10);
  });
});
