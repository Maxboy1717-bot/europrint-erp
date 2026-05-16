/**
 * Unit tests for ChatAdminRepository.
 * Covers each public method with happy + Err paths.
 */

import { makeDbChain } from '../_setup/db-mock';

const dbStub = makeDbChain([]);

jest.mock('@shared/db', () => ({
  db: dbStub,
  chatRooms: {
    id: 'rooms.id', name: 'rooms.name', type: 'rooms.type',
    created_at: 'rooms.created_at', is_archived: 'rooms.is_archived',
  },
  chatMembers: {
    id: 'members.id', room_id: 'members.room_id', user_id: 'members.user_id',
    role: 'members.role', joined_at: 'members.joined_at',
  },
  appUsers: { id: 'users.id', full_name: 'users.full_name' },
  chatMessages: {
    id: 'msg.id', sender_id: 'msg.sender_id', room_id: 'msg.room_id',
    content: 'msg.content', text: 'msg.text', created_at: 'msg.created_at',
    is_deleted: 'msg.is_deleted',
  },
}));

import { ChatAdminRepository } from '../../src/modules/chat/repositories/chat-admin.repository';

describe('ChatAdminRepository', () => {
  let repo: ChatAdminRepository;
  beforeEach(() => {
    repo = new ChatAdminRepository();
    dbStub.__setResolved([]);
  });

  describe('findAllRooms', () => {
    it('returns Ok with mapped rooms when query succeeds', async () => {
      dbStub.__setResolved([
        { id: 'r1', name: 'General', type: 'GROUP', created_at: '2025-01-01', is_archived: false, member_count: 3 },
      ]);
      const r = await repo.findAllRooms();
      expect(r.ok).toBe(true);
      if (r.ok) {
        expect(r.data).toHaveLength(1);
        expect(r.data[0]?.memberCount).toBe(3);
        expect(r.data[0]?.isArchived).toBe(false);
      }
    });

    it('returns Ok with empty array when no rooms', async () => {
      dbStub.__setResolved([]);
      const r = await repo.findAllRooms();
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toEqual([]);
    });

    it('returns Err when DB throws', async () => {
      dbStub.__setRejected(new Error('db error'));
      const r = await repo.findAllRooms();
      expect(r.ok).toBe(false);
    });
  });

  describe('findRoomMembers', () => {
    it('returns Ok with mapped members when records exist', async () => {
      dbStub.__setResolved([
        { user_id: 'u1', full_name: 'Alice', role: 'admin', joined_at: '2025-01-01' },
      ]);
      const r = await repo.findRoomMembers('r1');
      expect(r.ok).toBe(true);
      if (r.ok) {
        expect(r.data[0]?.userId).toBe('u1');
        expect(r.data[0]?.role).toBe('admin');
      }
    });

    it('returns Ok with empty array when no members', async () => {
      dbStub.__setResolved([]);
      const r = await repo.findRoomMembers('r1');
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toEqual([]);
    });

    it('returns Err when DB throws', async () => {
      dbStub.__setRejected(new Error('boom'));
      const r = await repo.findRoomMembers('r1');
      expect(r.ok).toBe(false);
    });
  });

  describe('roomExistsById', () => {
    it('returns Ok(true) when room found', async () => {
      dbStub.__setResolved([{ id: 'r1' }]);
      const r = await repo.roomExistsById('r1');
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toBe(true);
    });

    it('returns Ok(false) when room missing', async () => {
      dbStub.__setResolved([]);
      const r = await repo.roomExistsById('missing');
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toBe(false);
    });

    it('returns Err when DB throws', async () => {
      dbStub.__setRejected(new Error('x'));
      const r = await repo.roomExistsById('r1');
      expect(r.ok).toBe(false);
    });
  });

  describe('setRoomArchived', () => {
    it('returns Ok when update succeeds', async () => {
      dbStub.__setResolved(undefined);
      const r = await repo.setRoomArchived('r1');
      expect(r.ok).toBe(true);
    });

    it('returns Ok when nothing updated', async () => {
      dbStub.__setResolved([]);
      const r = await repo.setRoomArchived('missing');
      expect(r.ok).toBe(true);
    });

    it('returns Err when DB throws', async () => {
      dbStub.__setRejected(new Error('locked'));
      const r = await repo.setRoomArchived('r1');
      expect(r.ok).toBe(false);
    });
  });

  describe('deleteMember', () => {
    it('returns Ok when delete succeeds', async () => {
      dbStub.__setResolved(undefined);
      const r = await repo.deleteMember('r1', 'u1');
      expect(r.ok).toBe(true);
    });

    it('returns Ok when nothing matched', async () => {
      dbStub.__setResolved([]);
      const r = await repo.deleteMember('r1', 'absent');
      expect(r.ok).toBe(true);
    });

    it('returns Err when DB throws', async () => {
      dbStub.__setRejected(new Error('FK'));
      const r = await repo.deleteMember('r1', 'u1');
      expect(r.ok).toBe(false);
    });
  });

  describe('memberExists', () => {
    it('returns Ok(true) when member present', async () => {
      dbStub.__setResolved([{ id: 1 }]);
      const r = await repo.memberExists('r1', 'u1');
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toBe(true);
    });

    it('returns Ok(false) when not present', async () => {
      dbStub.__setResolved([]);
      const r = await repo.memberExists('r1', 'u9');
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toBe(false);
    });

    it('returns Err when DB throws', async () => {
      dbStub.__setRejected(new Error('x'));
      const r = await repo.memberExists('r1', 'u1');
      expect(r.ok).toBe(false);
    });
  });

  describe('setMemberRole', () => {
    it('returns Ok when update succeeds', async () => {
      dbStub.__setResolved(undefined);
      const r = await repo.setMemberRole('r1', 'u1', 'admin');
      expect(r.ok).toBe(true);
    });

    it('returns Ok when no rows matched', async () => {
      dbStub.__setResolved([]);
      const r = await repo.setMemberRole('r1', 'u9', 'member');
      expect(r.ok).toBe(true);
    });

    it('returns Err when DB throws', async () => {
      dbStub.__setRejected(new Error('boom'));
      const r = await repo.setMemberRole('r1', 'u1', 'admin');
      expect(r.ok).toBe(false);
    });
  });

  describe('findAuditLogs', () => {
    it('returns Ok with log rows when present', async () => {
      dbStub.__setResolved([{ event_id: 'm1', user_id: 'u1' }]);
      const r = await repo.findAuditLogs(10);
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toHaveLength(1);
    });

    it('returns Ok with empty array when no logs', async () => {
      dbStub.__setResolved([]);
      const r = await repo.findAuditLogs(10);
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toEqual([]);
    });

    it('returns Err when DB throws', async () => {
      dbStub.__setRejected(new Error('audit fail'));
      const r = await repo.findAuditLogs(10);
      expect(r.ok).toBe(false);
    });
  });
});
