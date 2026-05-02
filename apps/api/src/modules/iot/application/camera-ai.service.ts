import { Injectable } from '@nestjs/common';
import { Ok, Err, Result } from '@common/result';
import { DrizzleCameraAiRepo } from '../infrastructure/repositories/drizzle-camera-ai.repo';

@Injectable()
export class CameraAiService {
  constructor(private readonly repo: DrizzleCameraAiRepo) {}

  getSummary(): ReturnType<DrizzleCameraAiRepo['findSummary']> {
    return this.repo.findSummary();
  }

  getSafetyTrends(days: number): ReturnType<DrizzleCameraAiRepo['findSafetyTrends']> {
    return this.repo.findSafetyTrends(days);
  }

  getQualityAnalysis(): ReturnType<DrizzleCameraAiRepo['findQualityAnalysis']> {
    return this.repo.findQualityAnalysis();
  }

  getProductivityScores(): ReturnType<DrizzleCameraAiRepo['findProductivityScores']> {
    return this.repo.findProductivityScores();
  }

  getMachineUtilization(): ReturnType<DrizzleCameraAiRepo['findMachineUtilization']> {
    return this.repo.findMachineUtilization();
  }

  getAnomalyDetection(): ReturnType<DrizzleCameraAiRepo['findAnomalyDetection']> {
    return this.repo.findAnomalyDetection();
  }

  listCamerasAi(): ReturnType<DrizzleCameraAiRepo['listActiveCameras']> {
    return this.repo.listActiveCameras();
  }

  getCameraTriggerRules(id: string): ReturnType<DrizzleCameraAiRepo['findCameraConfig']> {
    return this.repo.findCameraConfig(id);
  }

  async updateCameraPrompt(
    id: string,
    prompt: string,
    zone: string,
    alertThreshold: number,
    isActive: boolean,
    triggerRules: unknown[],
  ): Promise<Result<{ cameraId: string; prompt: string; zone: string; alertThreshold: number; isActive: boolean }>> {
    const configResult = await this.repo.findCameraConfig(id);
    if (!configResult.ok) return Err(configResult.error);
    const promptConfig = JSON.stringify({ ai_prompt: prompt, rules: triggerRules });
    const upsertResult = await this.repo.upsertCameraConfig(
      id, String(configResult.data.cameraName ?? ''), promptConfig, zone, alertThreshold, isActive,
    );
    if (!upsertResult.ok) return Err(upsertResult.error);
    return Ok({ cameraId: id, prompt, zone, alertThreshold, isActive });
  }

  async updateCameraTriggerRulesFromBody(
    id: string,
    triggerRules: unknown[],
    zone: string,
    alertThreshold: number,
    isActive: boolean,
  ): Promise<Result<{ cameraId: string; triggerRules: unknown[] }>> {
    const configResult = await this.repo.findCameraConfig(id);
    if (!configResult.ok) return Err(configResult.error);
    const rulesJson = JSON.stringify(triggerRules);
    const upsertResult = await this.repo.upsertCameraConfig(
      id, String(configResult.data.cameraName ?? ''), rulesJson, zone, alertThreshold, isActive,
    );
    if (!upsertResult.ok) return Err(upsertResult.error);
    return Ok({ cameraId: id, triggerRules });
  }
}
