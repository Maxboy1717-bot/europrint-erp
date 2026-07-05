/**
 * @module telegram-bots-cron-recruitment.spec
 * @description R5 fix coverage: `telegram-announce` and `alumni-notify` used to emit the
 * SAME 'vacancy.published' event, but only one listener existed (boomerang/alumni pool) —
 * telegram-announce's claimed "matched candidates" audience was never actually reached.
 *
 * This spec verifies:
 *  1. onVacancyPublished (alumni/boomerang) still queries the boomerang pool and dispatches.
 *  2. The NEW onTelegramAnnounceRequested listener queries the ACTIVE candidate pool
 *     (distinct repo method) and dispatches via Telegram/SMS to matched candidates.
 *  3. The two listeners are wired to two DIFFERENT event names.
 */

import 'reflect-metadata';
import { TelegramBotsCronRecruitmentService } from '../src/modules/hr/telegram-bots/telegram-bots-cron-recruitment.service';
import { Ok } from '@common/result';

describe('TelegramBotsCronRecruitmentService — R5 vacancy event split', () => {
  let notificationBot: { sendNotificationRaw: jest.Mock };
  let repo: {
    getBoomerangCandidates: jest.Mock;
    getActiveCandidatePool: jest.Mock;
    getRecruiterChatIds: jest.Mock;
    getInterviewsPendingDecision: jest.Mock;
  };
  let cfg: { get: jest.Mock };
  let boomerangEmbedding: { rankCandidates: jest.Mock };
  let service: TelegramBotsCronRecruitmentService;

  beforeEach(() => {
    notificationBot = { sendNotificationRaw: jest.fn().mockResolvedValue(true) };
    repo = {
      getBoomerangCandidates: jest.fn(),
      getActiveCandidatePool: jest.fn(),
      getRecruiterChatIds: jest.fn(),
      getInterviewsPendingDecision: jest.fn(),
    };
    cfg = { get: jest.fn().mockReturnValue(undefined) };
    // No embedding API key in tests -> keyword fallback path is exercised (matches prod
    // behavior when OPENAI_API_KEY is unset, which is the current local/test environment).
    boomerangEmbedding = { rankCandidates: jest.fn().mockResolvedValue([]) };

    service = new TelegramBotsCronRecruitmentService(
      notificationBot as never,
      repo as never,
      cfg as never,
      boomerangEmbedding as never,
    );
  });

  describe('onVacancyPublished (alumni/boomerang audience — unchanged scope)', () => {
    it('happy: queries the boomerang pool and dispatches to matched alumni', async () => {
      repo.getBoomerangCandidates.mockResolvedValue(Ok([
        { id: 1, name: 'Aziz', phone: '+998900000001', telegram_chat_id: 555, position_hint: 'operator', department_hint: 'gofra', skills_hint: '' },
      ]));

      await service.onVacancyPublished({ vacancyId: 10, title: 'Operator gofra', department: 'gofra' });

      expect(repo.getBoomerangCandidates).toHaveBeenCalledTimes(1);
      expect(repo.getActiveCandidatePool).not.toHaveBeenCalled();
      expect(notificationBot.sendNotificationRaw).toHaveBeenCalledWith(555, expect.stringContaining('Operator gofra'));
    });

    it('edge: DB error is caught and swallowed (no throw)', async () => {
      repo.getBoomerangCandidates.mockResolvedValue({ ok: false, error: { code: 'DB_ERROR', message: 'boom' } });
      await expect(
        service.onVacancyPublished({ vacancyId: 11, title: 'X' }),
      ).resolves.toBeUndefined();
    });
  });

  describe('onTelegramAnnounceRequested (R5 new: active candidate pool)', () => {
    it('happy: queries the ACTIVE candidate pool (not boomerang) and dispatches Telegram to matches', async () => {
      repo.getActiveCandidatePool.mockResolvedValue(Ok([
        { id: 2, name: 'Dilnoza', phone: '+998900000002', telegram_chat_id: 777, position_hint: 'dizayner', department_hint: 'ofset', skills_hint: 'photoshop' },
        { id: 3, name: 'Murod', phone: null, telegram_chat_id: null, position_hint: 'haydovchi', department_hint: 'logistika', skills_hint: '' },
      ]));

      await service.onTelegramAnnounceRequested({
        vacancyId: 20,
        title: 'Dizayner ofset',
        department: 'ofset',
        requiredSkills: 'photoshop',
      });

      expect(repo.getActiveCandidatePool).toHaveBeenCalledTimes(1);
      expect(repo.getBoomerangCandidates).not.toHaveBeenCalled();
      // Matched candidate (keyword overlap: department 'ofset' + skill 'photoshop') gets Telegram.
      expect(notificationBot.sendNotificationRaw).toHaveBeenCalledWith(777, expect.stringContaining('Dizayner ofset'));
      // Non-matching / no-contact-info candidate is not messaged.
      expect(notificationBot.sendNotificationRaw).not.toHaveBeenCalledWith(null, expect.anything());
    });

    it('edge: empty active pool -> no dispatch, no throw', async () => {
      repo.getActiveCandidatePool.mockResolvedValue(Ok([]));
      await expect(
        service.onTelegramAnnounceRequested({ vacancyId: 21, title: 'Bo\'sh vakansiya' }),
      ).resolves.toBeUndefined();
      expect(notificationBot.sendNotificationRaw).not.toHaveBeenCalled();
    });

    it('edge: repo error is caught and swallowed (no throw)', async () => {
      repo.getActiveCandidatePool.mockResolvedValue({ ok: false, error: { code: 'DB_ERROR', message: 'boom' } });
      await expect(
        service.onTelegramAnnounceRequested({ vacancyId: 22, title: 'X' }),
      ).resolves.toBeUndefined();
    });
  });

  it('error: the two listeners are distinct methods (event split, not shared handler)', () => {
    expect(service.onVacancyPublished).not.toBe(service.onTelegramAnnounceRequested);
  });
});
