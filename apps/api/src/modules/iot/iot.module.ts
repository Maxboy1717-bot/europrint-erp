/**
 * @module iot.module
 * @description NestJS @Module() definition. Providers, controllers, and imports for this feature slice.
 */

import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { RecordSensorReadingHandler } from './application/commands/record-sensor-reading.handler';
import { RegisterDeviceHandler } from './application/commands/register-device.handler';
import { UpdateDeviceThresholdsHandler } from './application/commands/update-device-thresholds.handler';
import { GetDevicesHandler } from './application/queries/get-devices.handler';
import { GetReadingsHandler } from './application/queries/get-readings.handler';
import { GetAnomaliesHandler } from './application/queries/get-anomalies.handler';
import { AnomalyDetectedHandler } from './infrastructure/event-handlers/anomaly-detected.handler';
import { DrizzleSensorRepo } from './infrastructure/repositories/drizzle-sensor.repo';
import { DrizzleIotMainRepo } from './infrastructure/repositories/drizzle-iot-main.repo';
import { DrizzleIotOeeRepo } from './infrastructure/repositories/drizzle-iot-oee.repo';
import { DrizzleCameraRepo } from './infrastructure/repositories/drizzle-camera.repo';
import { DrizzleCameraDashboardRepo } from './infrastructure/repositories/drizzle-camera-dashboard.repo';
import { DrizzleIotSensorsRepo } from './infrastructure/repositories/drizzle-iot-sensors.repo';
import { DrizzleCameraAiRepo } from './infrastructure/repositories/drizzle-camera-ai.repo';
import { SENSOR_REPO } from './domain/repositories/i-sensor.repo';
import { AuthModule } from '../auth/auth.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { IotSensorsController } from './presentation/iot-sensors.controller';
import { IotCameraController } from './presentation/iot-camera.controller';
import { IotCameraEventsController } from './presentation/iot-camera-events.controller';
import { CameraAiController } from './presentation/camera-ai.controller';
import { CameraRecognitionController } from './presentation/camera-recognition.controller';
import { CameraHeatmapController, CameraReportsController } from './presentation/camera-heatmap-reports.controller';
import { CameraDashboardController } from './presentation/camera-dashboard.controller';
import {
  CameraAlertsRouteController,
  CameraSettingsController,
  CamerasListController,
  CameraEmployeeRatingsController,
  AiCameraController,
  MachineStatusCurrentController,
  MachineStatusLogsController,
  SafetyViolationsController,
  EmployeeProductivityController,
  QualityDefectsCameraController,
} from './presentation/camera-alerts.controller';
import { IotMainController } from './presentation/iot-main.controller';
import { IotAlertsController } from './presentation/iot-alerts.controller';
import { IotTabletController } from './presentation/iot-tablet.controller';
import { IotSensorsMainController } from './presentation/iot-sensors-main.controller';
import { IotCameraService } from './application/iot-camera.service';
import { IotCameraRepository } from './infrastructure/repositories/iot-camera.repository';
import { IOT_CAMERA_REPO } from './domain/repositories/i-iot-camera.repo';
import { IotCameraEventsService } from './application/iot-camera-events.service';
import { IotCameraEventsRepository } from './infrastructure/repositories/iot-camera-events.repository';
import { IOT_CAMERA_EVENTS_REPO } from './domain/repositories/i-iot-camera-events.repo';
import { CameraAiService } from './application/camera-ai.service';
import { CameraExtendedService } from './application/camera-extended.service';
import { CameraDashboardService } from './application/camera-dashboard.service';
import { IotMainService } from './application/iot-main.service';
import { IotSensorsExtendedService } from './application/iot-sensors-extended.service';

const commandHandlers = [RecordSensorReadingHandler, RegisterDeviceHandler, UpdateDeviceThresholdsHandler];
const eventHandlers = [AnomalyDetectedHandler];
const queryHandlers = [GetDevicesHandler, GetReadingsHandler, GetAnomaliesHandler];

const newControllers = [
  CameraRecognitionController,
  CameraHeatmapController,
  CameraReportsController,
  CameraDashboardController,
  CameraAlertsRouteController,
  CameraSettingsController,
  CamerasListController,
  CameraEmployeeRatingsController,
  AiCameraController,
  MachineStatusCurrentController,
  MachineStatusLogsController,
  SafetyViolationsController,
  EmployeeProductivityController,
  QualityDefectsCameraController,
  IotMainController,
  IotAlertsController,
  IotTabletController,
  IotSensorsMainController,
];

const newRepositories = [
  DrizzleIotMainRepo,
  DrizzleIotOeeRepo,
  DrizzleCameraRepo,
  DrizzleCameraDashboardRepo,
  DrizzleIotSensorsRepo,
  DrizzleCameraAiRepo,
];

@Module({
  imports: [AuthModule, CqrsModule, NotificationsModule],
  controllers: [
    IotSensorsController,
    IotCameraController,
    IotCameraEventsController,
    CameraAiController,
    ...newControllers,
  ],
  providers: [
    ...commandHandlers,
    ...eventHandlers,
    ...queryHandlers,
    { provide: SENSOR_REPO, useClass: DrizzleSensorRepo },
    ...newRepositories,
    IotCameraRepository,
    { provide: IOT_CAMERA_REPO, useClass: IotCameraRepository },
    IotCameraService,
    IotCameraEventsRepository,
    { provide: IOT_CAMERA_EVENTS_REPO, useClass: IotCameraEventsRepository },
    IotCameraEventsService,
    CameraAiService,
    CameraExtendedService,
    CameraDashboardService,
    IotMainService,
    IotSensorsExtendedService,
  ],
  exports: [SENSOR_REPO],
})
export class IotModule {}
