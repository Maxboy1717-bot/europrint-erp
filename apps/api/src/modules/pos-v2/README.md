# POS v2 Module - Advanced Warehouse Operations

## Overview

POS v2 is an advanced warehouse management module providing extended operations beyond basic Point of Sale functionality. It includes inventory counting, internal warehouse transfers, barcode scanning, employee activity tracking, and comprehensive reporting.

## Features

### 1. Inventory Counting
- **Start Physical Count**: Create a new inventory count for a warehouse
- **Count Items**: Record physical quantities for each stock item
- **Variance Tracking**: Automatically calculate variance (counted - system quantity)
- **Approval Workflow**: Complete and approve counts with optional stock sync
- **Status Lifecycle**: Draft → In Progress → Completed → Approved

### 2. Transfer Requests
- **Create Transfer**: Request stock movement between warehouses
- **Request Management**: Track transfers through approval process
- **Status Workflow**: Pending → Approved → In Transit → Completed/Rejected
- **Line Items**: Multiple items per transfer with quantity approval

### 3. Barcode Scanning
- **Quick Lookup**: Find items by SKU or lot number
- **Stock Details**: Get current quantity, location, and expiry information
- **Real-time Data**: Pull live stock information for fast operations

### 4. Reports
- **Movement Reports**: Aggregated warehouse activity (completed counts/transfers)
- **Employee Activity**: Track user activities by date range
- **Low Stock Alerts**: Identify items below minimum quantity threshold

## Project Structure

```
pos-v2/
├── domain/
│   ├── aggregates/
│   │   ├── inventory-count.aggregate.ts
│   │   └── transfer-request.aggregate.ts
│   └── repositories/
│       └── i-pos-v2.repo.ts
├── infrastructure/
│   └── repositories/
│       └── drizzle-pos-v2.repo.ts
├── application/
│   ├── commands/
│   │   ├── start-inventory-count.command.ts
│   │   ├── update-count-line.command.ts
│   │   ├── complete-count.command.ts
│   │   ├── approve-count.command.ts
│   │   ├── create-transfer-request.command.ts
│   │   └── update-transfer-status.command.ts
│   └── queries/
│       ├── get-counts.query.ts
│       ├── get-requests.query.ts
│       ├── get-barcode.query.ts
│       └── get-movement-report.query.ts
├── presentation/
│   ├── dto/
│   │   └── pos-v2.dto.ts
│   ├── inventory-count.controller.ts
│   ├── requests.controller.ts
│   ├── barcode.controller.ts
│   └── reports.controller.ts
├── pos-v2.module.ts
└── index.ts
```

## API Endpoints

### Inventory Counts

```
GET    /pos-v2/inventory-counts              List counts
GET    /pos-v2/inventory-counts/:id          Get count details with lines
POST   /pos-v2/inventory-counts              Start new count (WAREHOUSE_MANAGER, SUPER_ADMIN)
PATCH  /pos-v2/inventory-counts/:id/lines/:lineId  Update counted quantity
PATCH  /pos-v2/inventory-counts/:id/complete        Complete count (WAREHOUSE_MANAGER)
PATCH  /pos-v2/inventory-counts/:id/approve         Approve count (WAREHOUSE_MANAGER, SUPER_ADMIN)
```

### Transfer Requests

```
GET    /pos-v2/transfer-requests              List requests
GET    /pos-v2/transfer-requests/:id          Get request details with lines
POST   /pos-v2/transfer-requests              Create transfer request
PATCH  /pos-v2/transfer-requests/:id/status   Update transfer status (WAREHOUSE_MANAGER)
```

### Barcode

```
GET    /pos-v2/barcode/lookup?barcode=XXX    Lookup by barcode (query)
POST   /pos-v2/barcode/lookup                 Lookup by barcode (body)
```

### Reports

```
GET    /pos-v2/reports/movements              Movement report (WAREHOUSE_MANAGER, SUPER_ADMIN, DIRECTOR)
GET    /pos-v2/reports/employee-activity     Employee activity (HR_MANAGER, SUPER_ADMIN)
GET    /pos-v2/reports/low-stock             Low stock report (WAREHOUSE_MANAGER, SUPER_ADMIN, DIRECTOR)
```

## Data Models

### Inventory Count Aggregate

```typescript
class InventoryCount {
  id: string;                    // Unique identifier
  warehouseId: string;           // Target warehouse
  countNumber: string;           // CNT-YYYYMMDD-XXX
  status: CountStatus;           // draft | in_progress | completed | approved
  lines: CountLine[];            // Items counted
  startedBy: string;             // User ID who started
  approvedBy: string | null;     // User ID who approved
  approvedAt: Date | null;       // Approval timestamp
  notes: string | null;          // Optional notes
  createdAt: Date;
  updatedAt: Date;
}

interface CountLine {
  id: string;
  countId: string;
  stockItemId: string;
  sku: string;
  itemName: string;
  systemQuantity: number;        // From database
  countedQuantity: number;       // Physical count
  variance: number;              // Difference (counted - system)
  unit: string;
  location: string | null;
  notes: string | null;
}
```

### Transfer Request Aggregate

```typescript
class TransferRequest {
  id: string;
  requestNumber: string;         // TR-YYYYMMDD-XXXXX
  fromWarehouseId: string;
  toWarehouseId: string;
  status: RequestStatus;         // pending | approved | in_transit | completed | rejected
  lines: RequestLine[];
  requestedBy: string;
  approvedBy: string | null;
  approvedAt: Date | null;
  reason: string;
  createdAt: Date;
  updatedAt: Date;
}

interface RequestLine {
  id: string;
  requestId: string;
  stockItemId: string;
  itemName: string;
  sku: string;
  requestedQty: number;
  approvedQty: number | null;
  unit: string;
}
```

## Database Tables

### inventory_counts
- id (UUID, PK)
- warehouse_id (UUID)
- count_number (TEXT, UNIQUE)
- status (TEXT)
- started_by (TEXT)
- approved_by (TEXT)
- approved_at (TIMESTAMP)
- notes (TEXT)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)

### inventory_count_lines
- id (UUID, PK)
- count_id (UUID, FK)
- stock_item_id (UUID)
- sku (TEXT)
- item_name (TEXT)
- system_quantity (DECIMAL)
- counted_quantity (DECIMAL)
- variance (DECIMAL)
- unit (TEXT)
- location (TEXT)
- notes (TEXT)

### transfer_requests
- id (UUID, PK)
- request_number (TEXT, UNIQUE)
- from_warehouse_id (UUID)
- to_warehouse_id (UUID)
- status (TEXT)
- reason (TEXT)
- requested_by (TEXT)
- approved_by (TEXT)
- approved_at (TIMESTAMP)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)

### transfer_request_lines
- id (UUID, PK)
- request_id (UUID, FK)
- stock_item_id (UUID)
- item_name (TEXT)
- sku (TEXT)
- requested_qty (DECIMAL)
- approved_qty (DECIMAL)
- unit (TEXT)

## Usage Examples

### Start an Inventory Count

```typescript
const command = new StartInventoryCountCommand(
  warehouseId,
  userId,
  'Physical inventory check Q1 2024'
);
const result = await commandBus.execute(command);
```

### Update a Count Line

```typescript
const command = new UpdateCountLineCommand(
  countId,
  lineId,
  125.5,  // countedQuantity
  'Verified with scale'
);
const result = await commandBus.execute(command);
```

### Complete and Approve a Count

```typescript
// Complete the count
const completeCmd = new CompleteCountCommand(countId);
await commandBus.execute(completeCmd);

// Approve the count and sync stock
const approveCmd = new ApproveCountCommand(countId, approverId, true);
const result = await commandBus.execute(approveCmd);
```

### Create a Transfer Request

```typescript
const lines = [
  {
    stockItemId: 'item-1',
    itemName: 'Widget A',
    sku: 'WID-A-001',
    requestedQty: 100,
    unit: 'pcs'
  }
];

const command = new CreateTransferRequestCommand(
  fromWarehouseId,
  toWarehouseId,
  'Stock redistribution for Q4 campaign',
  lines,
  userId
);
const result = await commandBus.execute(command);
```

### Lookup Barcode

```typescript
const query = new GetBarcodeQuery('WID-A-001');
const result = await queryBus.execute(query);
// Returns: { id, sku, name, currentQuantity, unit, warehouseLocation, expiryDate }
```

### Get Movement Report

```typescript
const query = new GetMovementReportQuery(
  warehouseId,
  new Date('2024-01-01'),
  new Date('2024-01-31')
);
const result = await queryBus.execute(query);
// Returns: { warehouseId, date, countCompleted, transfersCompleted, totalVariance, totalItems }
```

## Error Handling

All operations return `Result<T>` with standardized error codes:

- `NOT_FOUND`: Resource not found
- `INVALID_STATUS`: Invalid status transition
- `INVALID_QUANTITY`: Invalid quantity value
- `INVALID_TRANSITION`: Cannot transition to requested status
- `SAME_WAREHOUSE`: Source and destination cannot be the same
- `UNCOUNTED_LINES`: Not all lines have been counted
- `DB_ERROR`: Database operation failure

## Authorization

All endpoints require JWT authentication. Role-based access control:

- **WAREHOUSE_MANAGER**: Full warehouse operations
- **SUPER_ADMIN**: All operations
- **DIRECTOR**: View reports
- **HR_MANAGER**: View employee activity reports
- All authenticated users: Barcode lookup, transfer requests

## Dependencies

- NestJS with CQRS pattern
- Drizzle ORM with PostgreSQL
- Zod for validation
- Custom Result<T> type for error handling

## Integration

To use in your NestJS application:

```typescript
// app.module.ts
import { PosV2Module } from './modules/pos-v2';

@Module({
  imports: [
    // ... other imports
    PosV2Module,
  ],
})
export class AppModule {}
```

## Notes

- All quantities are stored as DECIMAL with 3 decimal places for precision
- Count numbers are auto-generated: CNT-YYYYMMDD-XXX
- Transfer request numbers: TR-YYYYMMDD-XXXXX
- Stock sync on count approval is optional and controlled via command parameter
- Employee activity reports filter by exact date range (from <= date < to)
