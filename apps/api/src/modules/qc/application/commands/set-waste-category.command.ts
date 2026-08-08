/**
 * @module set-waste-category.command
 * @description CQRS command: tag a QC defect's waste category (production|setup). Vision 09-qc#96 —
 * "Priladka (sozlash) braki alohida hisoblansin".
 */

export class SetWasteCategoryCommand {
  constructor(
    public readonly defectId: string,
    public readonly wasteCategory: 'production' | 'setup',
    public readonly userId: string,
  ) {}
}
