/**
 * @module chat.dto.spec
 * @description Jest / Vitest test suite.
 */

import {
  ChatStartDirectSchema,
  ChatCreateGroupSchema,
  ChatSendMessageSchema,
  ChatMuteRoomSchema,
  ChatEditMessageSchema,
  ChatEmojiSchema,
  ChatCreatePollSchema,
  ChatVotePollSchema,
  ChatPinMessageSchema,
  ChatAdvancedCreatePollSchema,
  ChatAdvancedVotePollSchema,
  ChatThreadMessageSchema,
  ChatForwardMessageSchema,
  ChatRequestUploadUrlSchema,
  ChatCompleteUploadSchema,
} from './chat.dto';

describe('ChatStartDirectSchema', () => {
  it('accepts valid targetUserId', () => {
    expect(ChatStartDirectSchema.safeParse({ targetUserId: 5 }).success).toBe(true);
  });
  it('rejects missing targetUserId', () => {
    expect(ChatStartDirectSchema.safeParse({}).success).toBe(false);
  });
  it('rejects non-positive targetUserId', () => {
    expect(ChatStartDirectSchema.safeParse({ targetUserId: 0 }).success).toBe(false);
  });
  it('rejects string targetUserId', () => {
    expect(ChatStartDirectSchema.safeParse({ targetUserId: 'user-1' }).success).toBe(false);
  });
});

describe('ChatCreateGroupSchema', () => {
  it('accepts valid group', () => {
    expect(ChatCreateGroupSchema.safeParse({ name: 'Team Chat', memberIds: [1, 2, 3] }).success).toBe(true);
  });
  it('rejects missing name', () => {
    expect(ChatCreateGroupSchema.safeParse({ memberIds: [1] }).success).toBe(false);
  });
  it('rejects empty name', () => {
    expect(ChatCreateGroupSchema.safeParse({ name: '', memberIds: [1] }).success).toBe(false);
  });
  it('rejects empty memberIds', () => {
    expect(ChatCreateGroupSchema.safeParse({ name: 'Group', memberIds: [] }).success).toBe(false);
  });
  it('rejects non-positive member IDs', () => {
    expect(ChatCreateGroupSchema.safeParse({ name: 'Group', memberIds: [0] }).success).toBe(false);
  });
});

describe('ChatSendMessageSchema', () => {
  it('accepts valid message', () => {
    expect(ChatSendMessageSchema.safeParse({ content: 'Hello!' }).success).toBe(true);
  });
  it('accepts message with all optional fields', () => {
    expect(ChatSendMessageSchema.safeParse({
      content: 'Hello!',
      fileUrl: 'https://cdn.example.com/file.pdf',
      fileName: 'file.pdf',
      fileType: 'application/pdf',
      replyToId: 42,
    }).success).toBe(true);
  });
  it('rejects empty content', () => {
    expect(ChatSendMessageSchema.safeParse({ content: '' }).success).toBe(false);
  });
  it('rejects missing content', () => {
    expect(ChatSendMessageSchema.safeParse({ fileUrl: 'https://example.com' }).success).toBe(false);
  });
  it('rejects invalid fileUrl', () => {
    expect(ChatSendMessageSchema.safeParse({ content: 'Hi', fileUrl: 'not-a-url' }).success).toBe(false);
  });
});

describe('ChatMuteRoomSchema', () => {
  it('accepts muted: true', () => {
    expect(ChatMuteRoomSchema.safeParse({ muted: true }).success).toBe(true);
  });
  it('accepts muted: false', () => {
    expect(ChatMuteRoomSchema.safeParse({ muted: false }).success).toBe(true);
  });
  it('rejects missing muted', () => {
    expect(ChatMuteRoomSchema.safeParse({}).success).toBe(false);
  });
  it('rejects string muted', () => {
    expect(ChatMuteRoomSchema.safeParse({ muted: 'yes' }).success).toBe(false);
  });
});

describe('ChatEditMessageSchema', () => {
  it('accepts valid content', () => {
    expect(ChatEditMessageSchema.safeParse({ content: 'Edited message' }).success).toBe(true);
  });
  it('rejects empty content', () => {
    expect(ChatEditMessageSchema.safeParse({ content: '' }).success).toBe(false);
  });
  it('rejects missing content', () => {
    expect(ChatEditMessageSchema.safeParse({}).success).toBe(false);
  });
});

describe('ChatEmojiSchema', () => {
  it('accepts valid emoji', () => {
    expect(ChatEmojiSchema.safeParse({ emoji: '👍' }).success).toBe(true);
  });
  it('rejects empty emoji', () => {
    expect(ChatEmojiSchema.safeParse({ emoji: '' }).success).toBe(false);
  });
  it('rejects missing emoji', () => {
    expect(ChatEmojiSchema.safeParse({}).success).toBe(false);
  });
});

describe('ChatCreatePollSchema', () => {
  it('accepts valid poll', () => {
    expect(ChatCreatePollSchema.safeParse({
      question: 'What day works?',
      options: ['Monday', 'Tuesday'],
    }).success).toBe(true);
  });
  it('accepts all optional fields', () => {
    expect(ChatCreatePollSchema.safeParse({
      question: 'Prefer?',
      options: ['A', 'B', 'C'],
      isMultiple: true,
      isAnonymous: false,
    }).success).toBe(true);
  });
  it('rejects missing question', () => {
    expect(ChatCreatePollSchema.safeParse({ options: ['A', 'B'] }).success).toBe(false);
  });
  it('rejects single option (min 2)', () => {
    expect(ChatCreatePollSchema.safeParse({ question: 'Q?', options: ['A'] }).success).toBe(false);
  });
  it('rejects more than 10 options', () => {
    const options = Array.from({ length: 11 }, (_, i) => `Option ${i + 1}`);
    expect(ChatCreatePollSchema.safeParse({ question: 'Q?', options }).success).toBe(false);
  });
});

describe('ChatVotePollSchema', () => {
  it('accepts valid optionIndices', () => {
    expect(ChatVotePollSchema.safeParse({ optionIndices: [0, 2] }).success).toBe(true);
  });
  it('accepts empty optionIndices', () => {
    expect(ChatVotePollSchema.safeParse({ optionIndices: [] }).success).toBe(true);
  });
  it('rejects missing optionIndices', () => {
    expect(ChatVotePollSchema.safeParse({}).success).toBe(false);
  });
  it('rejects negative index', () => {
    expect(ChatVotePollSchema.safeParse({ optionIndices: [-1] }).success).toBe(false);
  });
});

describe('ChatPinMessageSchema', () => {
  it('accepts pin: true', () => {
    expect(ChatPinMessageSchema.safeParse({ pin: true }).success).toBe(true);
  });
  it('accepts all optional (no fields)', () => {
    expect(ChatPinMessageSchema.safeParse({}).success).toBe(true);
  });
});

describe('ChatAdvancedCreatePollSchema', () => {
  it('accepts valid poll with numeric roomId', () => {
    expect(ChatAdvancedCreatePollSchema.safeParse({
      roomId: 1,
      question: 'Q?',
      options: ['Yes', 'No'],
    }).success).toBe(true);
  });
  it('accepts string roomId', () => {
    expect(ChatAdvancedCreatePollSchema.safeParse({
      roomId: 'room-abc',
      question: 'Q?',
      options: ['A', 'B'],
    }).success).toBe(true);
  });
  it('rejects missing roomId', () => {
    expect(ChatAdvancedCreatePollSchema.safeParse({ question: 'Q?', options: ['A', 'B'] }).success).toBe(false);
  });
  it('rejects single option', () => {
    expect(ChatAdvancedCreatePollSchema.safeParse({ roomId: 1, question: 'Q?', options: ['A'] }).success).toBe(false);
  });
});

describe('ChatAdvancedVotePollSchema', () => {
  it('accepts single numeric optionIndex', () => {
    expect(ChatAdvancedVotePollSchema.safeParse({ optionIndex: 0 }).success).toBe(true);
  });
  it('accepts array optionIndex', () => {
    expect(ChatAdvancedVotePollSchema.safeParse({ optionIndex: [0, 1] }).success).toBe(true);
  });
  it('rejects missing optionIndex', () => {
    expect(ChatAdvancedVotePollSchema.safeParse({}).success).toBe(false);
  });
});

describe('ChatThreadMessageSchema', () => {
  it('accepts valid content', () => {
    expect(ChatThreadMessageSchema.safeParse({ content: 'Thread reply' }).success).toBe(true);
  });
  it('rejects empty content', () => {
    expect(ChatThreadMessageSchema.safeParse({ content: '' }).success).toBe(false);
  });
});

describe('ChatForwardMessageSchema', () => {
  it('accepts numeric targetRoomId', () => {
    expect(ChatForwardMessageSchema.safeParse({ targetRoomId: 5 }).success).toBe(true);
  });
  it('accepts string targetRoomId', () => {
    expect(ChatForwardMessageSchema.safeParse({ targetRoomId: 'room-xyz' }).success).toBe(true);
  });
  it('rejects missing targetRoomId', () => {
    expect(ChatForwardMessageSchema.safeParse({}).success).toBe(false);
  });
  it('rejects empty string targetRoomId', () => {
    expect(ChatForwardMessageSchema.safeParse({ targetRoomId: '' }).success).toBe(false);
  });
});

describe('ChatRequestUploadUrlSchema', () => {
  it('accepts valid upload request', () => {
    expect(ChatRequestUploadUrlSchema.safeParse({
      name: 'report.pdf',
      size: 1024 * 1024,
      contentType: 'application/pdf',
      roomId: 1,
    }).success).toBe(true);
  });
  it('rejects missing required fields', () => {
    expect(ChatRequestUploadUrlSchema.safeParse({ name: 'file.pdf' }).success).toBe(false);
  });
  it('rejects non-positive size', () => {
    expect(ChatRequestUploadUrlSchema.safeParse({
      name: 'f.pdf', size: 0, contentType: 'application/pdf', roomId: 1,
    }).success).toBe(false);
  });
});

describe('ChatCompleteUploadSchema', () => {
  it('accepts valid complete upload', () => {
    expect(ChatCompleteUploadSchema.safeParse({
      roomId: 1,
      fileUrl: 'https://cdn.example.com/file.pdf',
      fileName: 'file.pdf',
      fileType: 'application/pdf',
      fileSize: 1024,
    }).success).toBe(true);
  });
  it('rejects missing roomId', () => {
    expect(ChatCompleteUploadSchema.safeParse({
      fileUrl: 'https://cdn.example.com/f.pdf', fileName: 'f.pdf', fileType: 'pdf', fileSize: 100,
    }).success).toBe(false);
  });
  it('rejects non-positive fileSize', () => {
    expect(ChatCompleteUploadSchema.safeParse({
      roomId: 1, fileUrl: 'https://cdn.example.com/f.pdf', fileName: 'f.pdf', fileType: 'pdf', fileSize: 0,
    }).success).toBe(false);
  });
});
