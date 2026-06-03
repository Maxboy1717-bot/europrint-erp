# Deferred: iot-sensors createSensor — canonical insert exists but unwired (2026-06-02)

**Status:** DEFERRED (owner-approved fallback option c). Not urgent.
**Branch:** chore/schema-convergence
**Source:** PAKET 4 P0 item #5.

## Summary

`POST /api/iot-sensors` (createSensor, `iot-sensors-main.controller.ts:140`) is a fake-create:
it echoes the request body with a `Date.now()` id and writes nothing to the DB. The chosen fix
was option (a): delegate to the existing canonical real insert instead of duplicating it.
Investigation showed the canonical insert exists but is NOT injectable, so per the owner's
condition this is deferred to option (c).

## Evidence (read-only)

- **Canonical real insert EXISTS but is dead-wired:**
  - `iot/sensors/sensors.repository.ts:40` `SensorsRepository.create` -> `db.insert(iotSensors)
    .values(...).returning()`.
  - `iot/sensors/sensors.service.ts:56` `SensorsService.create` wraps it (Result).
  - BUT `SensorsService` / `SensorsRepository` are registered in **NO** module — a grep of every
    `*.module.ts` in `apps/api/src` returns 0 matches. They are unwired/dead infrastructure and
    cannot be injected until both are added as providers to `iot.module.ts`.
- The fake controller (`IotSensorsMainController`) uses a different, wired service
  (`IotSensorsExtendedService`).
- **No frontend caller** for `POST /api/iot-sensors`. `IoTDashboard.tsx` only reads
  dashboard / live / alerts / oee / readings; there is no sensor-registration form. Nothing is
  actively losing data through this endpoint.

## Why deferred (option c)

Per the owner's condition: *"if the injection is complex (module wiring / circular) — stop and
defer (c)."* Wiring up the dead `SensorsService` + `SensorsRepository` (2 new providers) and
injecting them is module surgery on currently-dead code, and the endpoint has no FE caller — so
it is not urgent. (Option b — a second insert inside `IotSensorsExtendedService` — was rejected
because it would duplicate the canonical insert, against the #1 DRY lesson.)

## The real task (later, when an IoT sensor-registration UI exists)

Option (a), preferred:
1. Register `SensorsService` + `SensorsRepository` as providers in `iot.module.ts`.
2. Inject `SensorsService` into `IotSensorsMainController`.
3. Delegate `createSensor` to `SensorsService.create`; tighten `CreateSensorSchema` so `name`
   and `type` are required; generate `sensor_code` (NOT NULL on `iot_sensors`) in the mapping.

`iot_sensors` NOT NULL columns: `sensor_code`, `name`, `type`.

## Urgency: LOW

No FE caller; nothing depends on this create path today. Safe to defer until an IoT
sensor-registration flow is built.
