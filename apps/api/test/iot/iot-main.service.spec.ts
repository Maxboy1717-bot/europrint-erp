/**
 * Smoke spec for IotMainService (Rule 22: every service needs a unit test).
 */
import { IotMainService } from '../../src/modules/iot/application/iot-main.service';

describe('IotMainService', () => {
  const Ok = <T>(data: T) => ({ ok: true, data } as const);
  const mainRepoStub = {
    findAlerts:           jest.fn().mockResolvedValue(Ok([])),
    acknowledgeAlert:     jest.fn().mockResolvedValue(Ok({ id: 'a1' })),
    findAttendanceLive:   jest.fn().mockResolvedValue(Ok([])),
    findRoomInspections:  jest.fn().mockResolvedValue(Ok([])),
    findEmployeeHealth:   jest.fn().mockResolvedValue(Ok([])),
    findMachinesCurrent:  jest.fn().mockResolvedValue(Ok([])),
  };
  const oeeRepoStub = {
    findProductionMetrics: jest.fn().mockResolvedValue(Ok({})),
    findShiftReport:       jest.fn().mockResolvedValue(Ok({})),
  };

  it('class is defined', () => {
    expect(IotMainService).toBeDefined();
  });

  it('class name matches expected', () => {
    expect(IotMainService.name).toBe('IotMainService');
  });

  it('is constructible with both repo stubs', () => {
    const svc = new IotMainService(mainRepoStub as never, oeeRepoStub as never);
    expect(svc).toBeInstanceOf(IotMainService);
  });

  it('getAlerts forwards filters and limit to repo.findAlerts', () => {
    const svc = new IotMainService(mainRepoStub as never, oeeRepoStub as never);
    void svc.getAlerts('open', 'high', 20);
    expect(mainRepoStub.findAlerts).toHaveBeenCalledWith('open', 'high', 20);
  });

  it('acknowledgeAlert delegates to repo.acknowledgeAlert', () => {
    const svc = new IotMainService(mainRepoStub as never, oeeRepoStub as never);
    void svc.acknowledgeAlert('a-1');
    expect(mainRepoStub.acknowledgeAlert).toHaveBeenCalledWith('a-1');
  });

  it('getAttendanceLive delegates to repo.findAttendanceLive', () => {
    const svc = new IotMainService(mainRepoStub as never, oeeRepoStub as never);
    void svc.getAttendanceLive();
    expect(mainRepoStub.findAttendanceLive).toHaveBeenCalled();
  });
});
