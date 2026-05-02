export class DowntimeEvent {
  constructor(public readonly id: string,
    public readonly sessionId: string,
    public readonly workCenterId: string | null,
    public readonly eventType: string,
    public readonly reasonCode: string,
    public readonly startedAt: Date,
    public endedAt: Date | null,
    public readonly durationMinutes: number | null,
    public readonly reportedBy: string,
    public readonly notes: string | null,
    public readonly createdAt: Date) {}

  get isOngoing(): boolean {
    return this.endedAt === null;
  }
}

export const DOWNTIME_REASON_CODES = [
  { code: 'MAINT', name: 'Profilaktik texnik xizmat' },
  { code: 'BREAK', name: 'Mashina nosozligi' },
  { code: 'MATERIAL', name: 'Xom ashyo yetishmasligi' },
  { code: 'OPERATOR', name: "Operator yo'qligi" },
  { code: 'QUALITY', name: 'Sifat muammosi' },
  { code: 'SETUP', name: 'Jihozni sozlash' },
  { code: 'POWER', name: 'Elektr uzilishi' },
  { code: 'OTHER', name: 'Boshqa sabab' },
];
