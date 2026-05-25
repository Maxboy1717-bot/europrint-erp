/**
 * @module get-notifications.query
 * @description Source module. See exports for details.
 */

export class GetNotificationsQuery {
  constructor(readonly userId: string,
    readonly filters: {
      isRead?: boolean;
      page?: number;
      limit?: number;
    }) {}
}
