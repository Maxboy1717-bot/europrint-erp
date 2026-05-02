export class GetMyEnrollmentsQuery {
  constructor(readonly userId: string,
    readonly status?: string,
    readonly page: number = 1,
    readonly limit: number = 20) {}
}
