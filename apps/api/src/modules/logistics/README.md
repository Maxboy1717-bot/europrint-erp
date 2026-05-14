# Logistics module (`apps/api/src/modules/logistics/`)

> Route planning, delivery scheduling, and geo primitives. Operates over
> the customer/supplier address graph + city road network.

## Subfolder map

```
logistics/
├── domain/services/
│   ├── geo.service.ts                  Haversine distance + geofence
│   └── route.service.ts                Dijkstra shortest-path
├── application/                        Use-case handlers
├── routes/                             Saved route definitions (frequent runs)
├── deliveries/                         Delivery records + tracking
├── infrastructure/                     Drizzle repositories
├── presentation/                       NestJS controllers
└── logistics.module.ts                 Wiring
```

## What this module does

```
Sales order → delivery scheduled
        ↓
Customer address resolved → geocoded (lat/lon stored)
        ↓
Route planner picks driver/vehicle
        ↓
Dijkstra finds shortest path through depots/stops
        ↓
Driver tablet receives turn-by-turn list
        ↓
On delivery: customer signature + photo → delivery record closed
```

## Key algorithms

| Need to know...                          | Read this                                   |
|------------------------------------------|---------------------------------------------|
| Haversine distance (km between lat/lons) | `domain/services/geo.service.ts`            |
| Circular + polygon geofence check        | `domain/services/geo.service.ts`            |
| Dijkstra shortest-path (km/min/UZS cost) | `domain/services/route.service.ts`          |

## Why distance/route choice MATTERS

Delivery cost is ~60% fuel and ~20% driver wages — both proportional to
route length. A 10% routing improvement on 200 deliveries/month is
real money. Wrong distance math (Euclidean vs Haversine) under-quotes by
~10-30% at Tashkent's latitude — leading to under-priced delivery and
sustained losses.

Reading order to understand the math:
1. `geo.service.ts` top-of-file — why Haversine, why R=6371 km
2. `route.service.ts` top-of-file — why Dijkstra, why binary heap

## Geofence usage

Used for:
- **Delivery zones** — "is this customer in our same-day area?"
- **Driver clock-in** — geo-fenced to depot for accurate timesheets
  (integrates with `hr/attendance/`)
- **Customer presence** — for some VIP customers, automatic SMS when
  driver enters a 500m circle around the address

## Routing weights — what `weight` means

The graph's edge weights are caller-defined. We have three modes in use:
- **Distance (km)** — minimize fuel
- **Time (minutes)** — minimize driver hours (rush hour congestion in edges)
- **Cost (UZS)** — combined fuel + tolls + driver-time

The graph is built per request from `road_segments` + `delivery_zones`.
Static; refresh via batch job on map updates (~quarterly).

## Conventions

- Coordinates always lat/lon decimal, never lat/long swapped.
  `isValidCoord` enforces [-90..90] / [-180..180] at boundary.
- Distance in km, time in minutes, cost in UZS. Don't mix; pick one
  weight semantic per route.
- Delivery records are immutable once closed. Corrections create a
  follow-up record linked by `original_id`.

## Where to read deeper

- Haversine vs Euclidean choice → top of `domain/services/geo.service.ts`
- Dijkstra + min-heap rationale → top of `domain/services/route.service.ts`
- Delivery workflow → `deliveries/` controllers
