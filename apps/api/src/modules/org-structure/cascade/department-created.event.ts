/**
 * @module org-structure/cascade/department-created.event
 * @description EP-ORG-041 (ORG-CASCADE) — domain event published AFTER a new
 *   org_departments node is committed. Carries the minimum the cascade listener
 *   needs to decide whether to auto-provision a warehouse + grant the node head
 *   the warehouse RBAC role.
 *
 * Channel: EventEmitter2 (canonical — see docs/EVENT_KATALOGI.md §9 HR/ORG).
 * Event name constant lives in ./org-cascade.constants.ts (ORG_CASCADE_EVENT).
 */

export class DepartmentCreatedEvent {
  constructor(
    /** org_departments.id (serial int) of the freshly-created node. */
    public readonly nodeId: number,
    /** node_type of the new node (e.g. 'department' | 'sex' | 'warehouse'). */
    public readonly nodeType: string,
    /** users.id of the node head, or null when not yet assigned (Q-40: never fabricated). */
    public readonly headUserId: number | null,
    /** Display name of the node — used to label the auto-created warehouse. */
    public readonly name: string,
    /** ISO8601 timestamp of when the node was created. */
    public readonly createdAt: string = new Date().toISOString(),
  ) {}
}
