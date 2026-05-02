import { ChatService } from '../src/modules/chat/chat.service';

describe('ChatService – room membership authorization', () => {
  let service: ChatService;
  let mockRoomSvc: { isRoomMember: jest.Mock };

  beforeEach(() => {
    mockRoomSvc = { isRoomMember: jest.fn() };
    service = new ChatService(
      mockRoomSvc as any,
      {} as any,
      {} as any,
      {} as any,
    );
    jest.clearAllMocks();
  });

  it('isRoomMember returns true when user is a member', async () => {
    mockRoomSvc.isRoomMember.mockResolvedValue(true);
    const result = await service.isRoomMember(1, 42);
    expect(result).toBe(true);
  });

  it('isRoomMember returns false when user is NOT a member', async () => {
    mockRoomSvc.isRoomMember.mockResolvedValue(false);
    const result = await service.isRoomMember(99, 42);
    expect(result).toBe(false);
  });

  it('isRoomMember queries chat_members with correct roomId and userId', async () => {
    mockRoomSvc.isRoomMember.mockResolvedValue(false);
    await service.isRoomMember(5, 10);
    expect(mockRoomSvc.isRoomMember).toHaveBeenCalledWith(5, 10);
  });
});
