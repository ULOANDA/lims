# Types Layer Documentation (`src/types/`)

**Version:** 1.0.0 | **Cập nhật:** 25/02/2026

---

## I. TỔNG QUAN

Thư mục `src/types/` định nghĩa tất cả TypeScript interfaces và types cho toàn bộ ứng dụng. Đây là **Single Source of Truth** cho cấu trúc dữ liệu — mọi component và API module đều PHẢI import types từ đây.

---

## II. CẤU TRÚC THƯ MỤC

```
src/types/
├── 0_TYPES_DOCUMENTATION.md    # Tài liệu tham chiếu types (legacy)
├── common.ts                   # ★ Base types dùng chung (BaseEntity, LabelValue, AddressInfo)
├── identity.ts                 # Identity/User types (IdentityRole, Identity, Session)
├── crm.ts                      # CRM types (Client, Order, Quote)
├── lab.ts                      # Lab entity types (Receipt, Sample, Analysis, Equipment, Inventory)
├── receipt.ts                  # ★ Receipt-specific types (ReceiptDetail, ReceiptSample, ReceiptAnalysis)
├── sample.ts                   # ★ Sample-specific types (SampleDetail, SampleAnalysis)
├── analysis.ts                 # ★ Analysis-specific types (AnalysisDetail, AnalysisListItem)
├── library.ts                  # Master Data types (Matrix, Protocol, Parameter, SampleType)
├── document.ts                 # Document management types
├── service.ts                  # Service/utility types
├── mockdata.ts                 # Mock data cho testing/development
│
└── crm/                        # CRM sub-types (duplicated, phục vụ import ngắn)
    ├── client.ts
    ├── order.ts
    └── quote.ts (3 files)
```

---

## III. CHI TIẾT TỪNG FILE

### 3.1 `common.ts` — Base Types

```typescript
// Audit columns chung cho hầu hết entities
interface BaseEntity {
    createdAt: string;
    createdById: string;
    modifiedAt: string;
    modifiedById: string;
    deletedAt?: string | null; // Soft Delete
}

// JSONB phổ biến
interface LabelValue {
    label: string;
    value: string | number | boolean;
}
interface AddressInfo {
    address: string;
    ward?;
    district?;
    city?;
    country?;
}

// Utility types
type EntityInfo = { type: "staff" | string };
type MoneyValue = number | string;
type MaybeMoney = MoneyValue | null;
type MaybeNumber = number | string | null;
```

**Quy tắc:** Mọi entity có audit fields → `extends BaseEntity`.

---

### 3.2 `identity.ts` — Người dùng & Phiên

```typescript
type IdentityRole = {
    admin?: boolean;
    customerService?: boolean;
    technician?: boolean;
    collaborator?: boolean;
    // ... tổng cộng 14 roles
    [key: string]: boolean | undefined;   // Extensible
};

interface Identity extends BaseEntity {
    identityId: string;
    email: string;
    identityName?: string;
    alias?: string;
    roles: IdentityRole;
    permissions?: Record<string, any>;
    identityStatus: "active" | "inactive";
}

interface Session { sessionId, identityId, sessionExpiry, sessionStatus, ... }
```

---

### 3.3 `crm.ts` — CRM (Client, Order, Quote)

**Client:**

```typescript
interface Client extends BaseEntity {
    clientId: string;
    clientName: string;
    clientSaleScope: "public" | "private";
    contacts: ClientContact[];
    invoiceInfo?: InvoiceInfo; // taxAddress, taxCode, taxName, taxEmail
    totalOrderAmount: number;
    // ...legalId, clientAddress, clientPhone, clientEmail
}
```

**Order:**

```typescript
interface Order extends BaseEntity {
    orderId: string;
    clientId: string;
    client: Partial<Client>; // Snapshot
    samples: OrderSampleItem[]; // Mỗi sample có analyses[]
    totalAmount: number;
    orderStatus: "Pending" | "Processing" | "Completed" | "Cancelled";
    paymentStatus: "Unpaid" | "Partial" | "Paid" | "Debt";
    transactions: Transaction[];
    // ...taxRate, discountRate, invoiceNumbers, receiptId, etc.
}
```

**Quote:** Tương tự Order nhưng có `quoteStatus: "Draft" | "Sent" | "Approved" | "Expired"`.

---

### 3.4 `receipt.ts` — Phiếu nhận mẫu (Core file, 331 lines)

**⚠️ File quan trọng nhất — Chứa types cho toàn bộ luồng Reception.**

**Shared Types:**

```typescript
type IsoDateString = string;
type ReceiptStatus = "Pending" | "Processing" | "Done" | "Cancelled" | (string & {});
type SampleStatus = "Received" | "InPrep" | "Distributed" | "Retained" | "Disposed" | "Returned" | (string & {});
type AnalysisStatus = "Pending" | "Testing" | ... | (string & {});
type IdentitySnapshot = { identityId, identityName, alias? };
```

**Receipt Types:**

| Type              | Dùng cho             | Fields chính                                                                                                                                                                                         |
| :---------------- | :------------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ReceiptListItem` | Danh sách phiếu      | receiptId, receiptCode, receiptStatus, client, receiptDate                                                                                                                                           |
| `ReceiptDetail`   | Chi tiết phiếu       | ReceiptListItem + orderId, senderInfo, conditionCheck, reportConfig, isBlindCoded, samples[]                                                                                                         |
| `ReceiptSample`   | Mẫu trong phiếu      | sampleId, sampleName, sampleTypeName, sampleStatus, samplePreservation, physicalState, sampleVolume, sampleWeight, sampleStorageLoc, sampleRetentionDate, sampleDisposalDate, sampleNote, analyses[] |
| `ReceiptAnalysis` | Phép thử trong phiếu | analysisId, parameterName, protocolCode, analysisStatus, analysisResult, technicianId, analysisDeadline, qaReview, rawData                                                                           |

**CRUD Body Types:**

```typescript
ReceiptsCreateBody; // Tạo phiếu (cơ bản)
ReceiptsCreateFullBody; // Tạo phiếu + mẫu + phép thử (create/full)
ReceiptsUpdateBody; // Cập nhật phiếu
ReceiptsDeleteBody; // Xóa phiếu
```

---

### 3.5 `sample.ts` — Mẫu thử nghiệm (standalone, 174 lines)

**Dùng cho module `components/samples/` (quản lý mẫu độc lập, không qua phiếu).**

**Status Enums (const arrays cho Select options):**

```typescript
SAMPLE_STATUS_VALUES = ["Received", "Analyzing", "Stored", "Disposed"] as const;
ANALYSIS_STATUS_VALUES = ["Assigned", "Testing", "Completed"] as const;
ANALYSIS_RESULT_STATUS_VALUES = ["NotEvaluated", "Pass", "Fail"] as const;
```

**Key Types:**

| Type                | Dùng cho           | Ghi chú                                                                      |
| :------------------ | :----------------- | :--------------------------------------------------------------------------- |
| `SampleListItem`    | Bảng list          | Lightweight: sampleId, receiptId, sampleTypeName, sampleStatus, sampleVolume |
| `SampleDetail`      | Chi tiết mẫu       | Full: tất cả fields + analyses: SampleAnalysis[]                             |
| `SampleAnalysis`    | Phép thử trong mẫu | Tương tự ReceiptAnalysis nhưng có thêm modifiedAt, modifiedById              |
| `SamplesCreateBody` | Tạo mẫu            | receiptId (FK bắt buộc), sampleTypeId                                        |
| `SamplesUpdateBody` | Sửa mẫu            | sampleId (PK), sampleStatus?, sampleStorageLoc?                              |

---

### 3.6 `analysis.ts` — Phép thử (163 lines)

**Dùng cho API và components quản lý phép thử riêng.**

**Status Types (DB-specific, khác với receipt/sample types):**

```typescript
AnalysisStatusDb = "Pending" | "Testing" | "DataEntered" | "TechReview" | "Approved" | "ReTest" | "Cancelled";
AnalysisResultStatusDb = "Pass" | "Fail" | "NotEvaluated";
```

| Type                 | Fields chính                                                                     |
| :------------------- | :------------------------------------------------------------------------------- |
| `AnalysisListItem`   | analysisId, sampleId, parameterName, analysisStatus, analysisResult, createdAt   |
| `AnalysisDetail`     | Full info: + matrixId, analysisDeadline, technician, rawInputData, resultHistory |
| `AnalysesCreateBody` | sampleId (required), analysisStatus (required), + all optional fields            |
| `AnalysesUpdateBody` | analysisId (required), + all optional fields                                     |
| `ListMeta`           | page, itemsPerPage, total, totalPages                                            |

---

### 3.7 `lab.ts` — Lab Entities (116 lines)

**Canonical types cho Lab — đồng bộ 1:1 với DATABASE.md schema.**

Chứa:

- `Receipt extends BaseEntity` (full DB schema)
- `Sample extends BaseEntity` (full DB schema)
- `Analysis extends BaseEntity` (full DB schema)
- `Equipment extends BaseEntity` (equipmentId, equipmentStatus: "Active" | "Maintenance" | "Broken")
- `InventoryItem extends BaseEntity` (itemId, itemType: "Chemical" | "Glassware" | ...)

---

### 3.8 `library.ts` — Master Data (75 lines)

```typescript
Matrix extends BaseEntity { matrixId, parameterId, protocolId, sampleTypeId, protocolCode, parameterName, sampleTypeName, feeBeforeTax, feeAfterTax, LOD?, LOQ?, ... }
Protocol extends BaseEntity { protocolId, protocolCode, protocolSource, protocolAccreditation? }
Parameter extends BaseEntity { parameterId, parameterName, displayStyle?, technicianAlias? }
SampleType extends BaseEntity { sampleTypeId, sampleTypeName, displayTypeStyle? }
ParameterGroup extends BaseEntity { groupId, groupName, matrixIds[], feeBeforeTax, feeAfterTax, ... }
```

---

## IV. QUAN HỆ GIỮA CÁC TYPES

```
                    ┌─────────────┐
                    │  common.ts  │
                    │ BaseEntity  │
                    └──────┬──────┘
           ┌───────────────┼───────────────┐
           ▼               ▼               ▼
     ┌───────────┐   ┌──────────┐   ┌───────────┐
     │  lab.ts   │   │ crm.ts   │   │library.ts │
     │ Receipt   │   │ Client   │   │ Matrix    │
     │ Sample    │   │ Order    │   │ Protocol  │
     │ Analysis  │   │ Quote    │   │ Parameter │
     └───────────┘   └──────────┘   └───────────┘

     ┌─────────────────────────────────────┐
     │     receipt.ts (API-specific)       │
     │ ReceiptDetail, ReceiptSample,       │
     │ ReceiptAnalysis, ReceiptsCreateBody │
     └─────────────────────────────────────┘
     ┌─────────────────────────────────────┐
     │      sample.ts (API-specific)       │
     │ SampleDetail, SampleAnalysis,       │
     │ SamplesCreateBody, SamplesUpdateBody│
     └─────────────────────────────────────┘
     ┌─────────────────────────────────────┐
     │     analysis.ts (API-specific)      │
     │ AnalysisDetail, AnalysisListItem,   │
     │ AnalysesCreateBody, AnalysesUpdate  │
     └─────────────────────────────────────┘
```

**Lưu ý quan trọng:**

- `lab.ts` = Canonical types (1:1 với DB schema)
- `receipt.ts`, `sample.ts`, `analysis.ts` = API-specific types (có thêm fields cho UI/API)
- Khi có conflict → ưu tiên file API-specific (`receipt.ts` etc.)

---

## V. QUY TẮC KHI SỬA/THÊM TYPES

1. **CẤM `any`** — Dùng `unknown` + type guard hoặc cụ thể hóa.
2. **CẤM tạo type local** trong component — PHẢI định nghĩa trong `src/types/`.
3. **Optional fields** dùng `?` + `| null` (VD: `fieldName?: string | null`).
4. **Extensible types** thêm `[key: string]: unknown` ở cuối.
5. **Status enums** dùng const arrays + `ExtensibleString<>` pattern.
6. **Số liệu** dùng `string | number | null` (BE có thể trả string hoặc number).
7. **Ngày tháng** dùng `IsoDateString` (= `string`), KHÔNG dùng `Date`.
8. **Khi thêm field mới** → cập nhật ở CÙNG LÚC: type file + DATABASE.md.
