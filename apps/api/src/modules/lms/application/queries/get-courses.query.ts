/**
 * @module get-courses.query
 * @description Source module. See exports for details.
 */

export class GetCoursesQuery {
  constructor(readonly isMandatory?: boolean,
    readonly category?: string,
    readonly page: number = 1,
    readonly limit: number = 20) {}
}
