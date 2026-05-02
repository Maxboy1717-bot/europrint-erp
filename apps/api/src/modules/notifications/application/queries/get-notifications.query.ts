export class GetNotificationsQuery {
  constructor(readonly userId: string,
    readonly filters: {
      isRead?: boolean;
      page?: number;
      limit?: number;
    }) {}
}
