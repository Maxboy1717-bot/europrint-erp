export class GetDowntimeSummaryQuery {
  constructor(public readonly from: Date,
    public readonly to: Date) {}
}
