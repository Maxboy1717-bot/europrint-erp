/**
 * @module sd-machine-format.service
 * @description SD machine-format catalog (72/52SM/KVA) rec+price — vision 06-sd #102. Result<T> only;
 *   controller delegates here; repo owns the DB (Qoida 15).
 */

import { Inject, Injectable } from '@nestjs/common';
import { Result } from '@common/result';
import {
  ISdMachineFormatRepo, SD_MACHINE_FORMAT_REPO,
  MachineFormatRow, ItemFormatRow, CreateMachineFormatInput, UpdateMachineFormatInput,
} from '../domain/repositories/i-sd-machine-format.repo';

@Injectable()
export class SdMachineFormatService {
  constructor(
    @Inject(SD_MACHINE_FORMAT_REPO) private readonly repo: ISdMachineFormatRepo,
  ) {}

  listFormats(activeOnly: boolean): Promise<Result<MachineFormatRow[]>> {
    return this.repo.listFormats(activeOnly);
  }

  createFormat(input: CreateMachineFormatInput): Promise<Result<MachineFormatRow>> {
    return this.repo.createFormat(input);
  }

  updateFormat(id: number, patch: UpdateMachineFormatInput): Promise<Result<MachineFormatRow>> {
    return this.repo.updateFormat(id, patch);
  }

  setItemFormat(itemId: number, formatCode: string): Promise<Result<ItemFormatRow>> {
    return this.repo.setItemFormat(itemId, formatCode);
  }
}
