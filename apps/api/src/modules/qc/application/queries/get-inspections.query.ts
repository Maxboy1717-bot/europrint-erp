export class GetInspectionsQuery {
  constructor(readonly status?: string,
    readonly inspectorId?: string,
    readonly referenceType?: string,
    readonly page: number = 1,
    readonly limit: number = 20) {}
}
