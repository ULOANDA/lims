# API Layer Documentation (`src/api/`)

**Version:** 1.0.0 | **Cập nhật:** 25/02/2026

---

## I. TỔNG QUAN

Thư mục `src/api/` chứa toàn bộ logic giao tiếp với Backend qua REST API. Kiến trúc tuân thủ nguyên tắc **Single Responsibility**: mỗi file quản lý một domain nghiệp vụ, cùng chia sẻ chung một Axios instance được cấu hình tập trung.

---

## II. CẤU TRÚC THƯ MỤC

```
src/api/
├── index.ts              # Entry & Auth API exports (login, logout, checkSessionStatus)
├── client.ts             # ★ Axios Instance tập trung (Base URL, Interceptors, Auth Token)
├── auth.ts               # Auth helper (getAuthCookies)
│
├── receipts.ts           # Receipt CRUD + React Query hooks
├── receiptsKeys.ts       # Query key factory cho receipts
├── samples.ts            # Sample CRUD + React Query hooks
├── samplesKeys.ts        # Query key factory cho samples
├── analyses.ts           # Analysis CRUD + React Query hooks
├── analysesKeys.ts       # Query key factory cho analyses
│
├── identities.ts         # Identity/User management API
├── library.ts            # Master Data (Matrix, Protocol, Parameter, SampleType, ParameterGroup)
├── files.ts              # File upload/download/delete API (document.files schema)
├── documents.ts          # Document management API (document.documents schema)
├── shipments.ts          # Logistics/Shipment API
│
├── crm/                  # CRM sub-module
│   ├── clients.ts        # Client CRUD + hooks
│   ├── orders.ts         # Order CRUD + hooks
│   ├── quotes.ts         # Quote CRUD + hooks
│   ├── crmKeys.ts        # CRM query key factory
│   └── shared.ts         # Shared CRM utilities
│
├── lab.ts                # Lab operations (placeholder/future)
├── reception.ts          # Reception operations (placeholder/future)
└── API_DOCUMENTATION.md  # Legacy API doc
```

---

## III. AXIOS CLIENT (`client.ts`) — CỐT LÕI

### 3.1 Cấu hình

| Config         | Giá trị                                                             | Ghi chú            |
| :------------- | :------------------------------------------------------------------ | :----------------- |
| `baseURL`      | `import.meta.env.VITE_BACKEND_URL` hoặc `http://localhost:3000`     | URL Backend        |
| `x-app-uid`    | `import.meta.env.VITE_APP_UID` hoặc `"lims-core"`                   | Định danh ứng dụng |
| `x-access-key` | `import.meta.env.VITE_ACCESS_KEY`                                   | API key            |
| Auth Token     | `Cookies.get("auth_token")` hoặc `VITE_DEV_BEARER_TOKEN` (dev mode) | Bearer token       |

### 3.2 Interceptors

**Request Interceptor:**

- Tự động đính `Authorization: Bearer <token>` nếu có token.

**Response Interceptor:**

- `401` → `toast.error("Session expired")` + redirect to login.
- `403` → `toast.error("Permission denied")`.
- `500` → Hiển thị `error.message` từ response body.
- Mọi lỗi khác → `toast.error("Unexpected error")`.

### 3.3 Response Type (`ApiResponse<T>`)

```typescript
interface ApiResponse<T = unknown> {
    success: boolean;
    statusCode: number;
    data?: T;
    meta?: ApiMeta | null; // Chỉ có trong list endpoints
    error?: ApiError | null;
}

interface ApiMeta {
    page: number;
    itemsPerPage: number;
    total: number;
    totalItems?: number;
    totalPages: number;
    countsByEntity?: Record<string, number>;
}
```

### 3.4 API Methods

| Method           | Signature                              | Trả về                      |
| :--------------- | :------------------------------------- | :-------------------------- |
| `api.get<T>`     | `(url, { headers?, params?, query? })` | `Promise<ApiResponse<T>>`   |
| `api.post<T>`    | `(url, { headers?, body?, query? })`   | `Promise<ApiResponse<T>>`   |
| `api.put<T>`     | `(url, { headers?, body?, query? })`   | `Promise<ApiResponse<T>>`   |
| `api.delete<T>`  | `(url, { headers?, body?, query? })`   | `Promise<ApiResponse<T>>`   |
| `api.getRaw<T>`  | `(url, { headers?, params?, query? })` | `Promise<T>` (raw response) |
| `api.postRaw<T>` | `(url, { headers?, body?, query? })`   | `Promise<T>` (raw response) |

### 3.5 Utility Functions trong client.ts

- **`makeUnknownError(err)`** — Tạo ApiResponse lỗi từ exception bất kỳ.
- **`toError(err)`** — Convert unknown thành Error instance.

---

## IV. MẪU THIẾT KẾ CHUNG (PATTERN) CHO MỖI API MODULE

Mỗi file API module (vd: `receipts.ts`, `samples.ts`) đều tuân theo cấu trúc thống nhất:

### 4.1 Imports & Types

```typescript
import api, { type ApiResponse } from "@/api/client";
import type { EntityDetail, EntityListItem, EntityCreateBody, ... } from "@/types/entity";
```

### 4.2 Input Interfaces

```typescript
interface EntityGetListInput {
    query?: { page?: number; itemsPerPage?: number; search?: string | null; ... };
    sort?: Record<string, unknown>;
}

interface EntityGetFullInput {
    entityId: string;
}

interface EntityCreateInput {
    body: EntityCreateBody;
}

interface EntityUpdateInput {
    body: EntityUpdateBody;
}

interface EntityDeleteInput {
    body: { entityId: string };
}
```

### 4.3 Helper Functions (có trong mỗi module)

- **`assertSuccess<T>(res)`** — Kiểm tra `res.success === true`, throw nếu lỗi, trả `T`.
- **`assertSuccessWithMeta<T>(res)`** — Như trên, thêm trả `{ data: T, meta: ApiMeta | null }`.
- **`stableKey(value)`** — JSON-stringify deterministic cho query key (sort object keys).

### 4.4 CRUD Functions

```typescript
export async function entityGetList(input = {}): Promise<ApiResponse<EntityListItem[]>> { ... }
export async function entityGetFull(input): Promise<ApiResponse<EntityDetail>> { ... }
export async function entityCreate(input): Promise<ApiResponse<EntityDetail>> { ... }
export async function entityUpdate(input): Promise<ApiResponse<EntityDetail>> { ... }
export async function entityDelete(input): Promise<ApiResponse<EntityDeleteResult>> { ... }
```

### 4.5 Filter Functions

```typescript
export async function entityFilter(input: EntityFilterInput): Promise<ApiResponse<EntityFilterItem[]>> { ... }
```

### 4.6 Query Key Factory

```typescript
export const entityKeys = {
    all: ["entities"] as const,
    list: (input?) => [...entityKeys.all, "list", stableKey(input)] as const,
    full: (input) => [...entityKeys.all, "full", input.entityId] as const,
    filter: (input) => [...entityKeys.all, "filter", stableKey(input)] as const,
};
```

### 4.7 React Query Hooks

```typescript
export function useEntityList(input?, opts?) {
    return useQuery({
        queryKey: entityKeys.list(input),
        queryFn: () => entityGetList(input).then(assertSuccessWithMeta),
        placeholderData: keepPreviousData,
        enabled: opts?.enabled ?? true,
    });
}

export function useEntityMutationCreate() {
    const qc = useQueryClient();
    const { t } = useTranslation();
    return useMutation({
        mutationFn: (input) => entityCreate(input).then(assertSuccess),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: entityKeys.all });
            toast.success(String(t("common.saveSuccess")));
        },
        onError: (err) => toast.error(toError(err).message),
    });
}
```

---

## V. DANH SÁCH API ENDPOINTS THEO MODULE

### 5.1 Receipts (`receipts.ts`)

| Function                | Method | Endpoint                      | Input                    | Response               |
| :---------------------- | :----- | :---------------------------- | :----------------------- | :--------------------- |
| `receiptsGetList`       | POST   | `/v2/receipts/get/list`       | `ReceiptsGetListInput`   | `ReceiptListItem[]`    |
| `receiptsGetProcessing` | POST   | `/v2/receipts/get/processing` | `ReceiptsGetListInput`   | `ReceiptDetail[]`      |
| `receiptsGetFull`       | POST   | `/v2/receipts/get/full`       | `{ receiptId }`          | `ReceiptDetail`        |
| `receiptsCreate`        | POST   | `/v2/receipts/create`         | `ReceiptsCreateBody`     | `ReceiptDetail`        |
| `receiptsCreateFull`    | POST   | `/v2/receipts/create/full`    | `ReceiptsCreateFullBody` | `ReceiptDetail`        |
| `receiptsUpdate`        | POST   | `/v2/receipts/update`         | `ReceiptsUpdateBody`     | `ReceiptDetail`        |
| `receiptsDelete`        | POST   | `/v2/receipts/delete`         | `{ receiptId }`          | `ReceiptDeleteResult`  |
| `receiptsFilter`        | POST   | `/v2/receipts/filter`         | `ReceiptsFilterBody`     | `ReceiptsFilterItem[]` |

**Hooks:** `useReceiptsList`, `useReceiptsFull`, `useReceiptsProcessing`, `useReceiptMutationCreate`, `useReceiptMutationCreateFull`, `useReceiptMutationUpdate`, `useReceiptMutationDelete`

### 5.2 Samples (`samples.ts`)

| Function               | Method | Endpoint                     | Input                 | Response              |
| :--------------------- | :----- | :--------------------------- | :-------------------- | :-------------------- |
| `samplesGetList`       | POST   | `/v2/samples/get/list`       | `SamplesGetListInput` | `SampleListItem[]`    |
| `samplesGetFull`       | POST   | `/v2/samples/get/full`       | `{ sampleId }`        | `SampleDetail`        |
| `samplesGetProcessing` | POST   | `/v2/samples/get/processing` | `SamplesGetListInput` | `SampleListItem[]`    |
| `samplesCreate`        | POST   | `/v2/samples/create`         | `SamplesCreateBody`   | `SampleDetail`        |
| `samplesUpdate`        | POST   | `/v2/samples/update`         | `SamplesUpdateBody`   | `SampleDetail`        |
| `samplesDelete`        | POST   | `/v2/samples/delete`         | `{ sampleId }`        | `SamplesDeleteResult` |
| `samplesFilter`        | POST   | `/v2/samples/filter`         | `SamplesFilterBody`   | `SamplesFilterItem[]` |

**Hooks:** `useSamplesList`, `useSampleFull`, `useSamplesProcessing`, `useSampleMutationCreate`, `useSampleMutationUpdate`, `useSampleMutationDelete`

### 5.3 Analyses (`analyses.ts`)

| Function                | Method | Endpoint                      | Input                  | Response               |
| :---------------------- | :----- | :---------------------------- | :--------------------- | :--------------------- |
| `analysesGetList`       | POST   | `/v2/analyses/get/list`       | `AnalysesGetListInput` | `AnalysisListItem[]`   |
| `analysesGetDetail`     | POST   | `/v2/analyses/get/detail`     | `{ analysisId }`       | `AnalysisDetail`       |
| `analysesGetProcessing` | POST   | `/v2/analyses/get/processing` | `AnalysesGetListInput` | `AnalysisListItem[]`   |
| `analysesCreate`        | POST   | `/v2/analyses/create`         | `AnalysesCreateBody`   | `AnalysisDetail`       |
| `analysesUpdate`        | POST   | `/v2/analyses/update`         | `AnalysesUpdateBody`   | `AnalysisDetail`       |
| `analysesDelete`        | POST   | `/v2/analyses/delete`         | `{ analysisId }`       | `AnalysesDeleteResult` |

**Hooks:** `useAnalysesList`, `useAnalysisDetail`, `useAnalysesProcessing`, `useAnalysisMutationCreate`, `useAnalysisMutationUpdate`, `useAnalysisMutationDelete`

### 5.4 Files (`files.ts`)

| Function         | Method | Endpoint               | Input                            | Response                  |
| :--------------- | :----- | :--------------------- | :------------------------------- | :------------------------ |
| `fileApi.list`   | GET    | `/v2/files/get/list`   | query                            | `FileInfo[]`              |
| `fileApi.detail` | GET    | `/v2/files/get/detail` | `{ id }`                         | `FileInfo`                |
| `fileApi.url`    | GET    | `/v2/files/get/url`    | `{ id, expiresIn? }`             | `FileUrlResponse`         |
| `fileApi.upload` | POST   | `/v2/files/upload`     | `FormData \| FileUploadJsonBody` | `FileInfo`                |
| `fileApi.delete` | POST   | `/v2/files/delete`     | `{ fileId }`                     | `{ success, id, status }` |

**Helper:** `buildFileUploadFormData(file, opts)` — Tạo FormData cho upload.

### 5.5 Documents (`documents.ts`)

| Function             | Method | Endpoint                   | Input                               | Response                  |
| :------------------- | :----- | :------------------------- | :---------------------------------- | :------------------------ |
| `documentApi.list`   | GET    | `/v2/documents/get/list`   | query                               | `DocumentInfo[]`          |
| `documentApi.detail` | GET    | `/v2/documents/get/detail` | `{ id }`                            | `DocumentInfo`            |
| `documentApi.full`   | GET    | `/v2/documents/get/full`   | `{ id }`                            | `DocumentFullInfo`        |
| `documentApi.url`    | GET    | `/v2/documents/get/url`    | `{ id, expiresIn? }`                | `DocumentUrlResponse`     |
| `documentApi.create` | POST   | `/v2/documents/create`     | `FormData \| DocumentCreateRefBody` | `DocumentInfo`            |
| `documentApi.update` | POST   | `/v2/documents/update`     | `DocumentUpdateBody`                | `DocumentInfo`            |
| `documentApi.delete` | POST   | `/v2/documents/delete`     | `{ id }`                            | `{ success, id, status }` |

### 5.6 CRM (`crm/`)

- **`crm/clients.ts`** → Client CRUD + hooks (`useClientsList`, `useClientMutationCreate`, ...)
- **`crm/orders.ts`** → Order CRUD + hooks
- **`crm/quotes.ts`** → Quote CRUD + hooks
- **`crm/crmKeys.ts`** → Query keys cho tất cả CRM entities
- **`crm/shared.ts`** → Shared utilities (assertSuccess, stableKey)

### 5.7 Identities (`identities.ts`)

CRUD cho quản lý người dùng: `identitiesGetList`, `identitiesGetDetail`, `identitiesCreate`, `identitiesUpdate`, `identitiesDelete`, `identitiesAddRole`, `identitiesRemoveRole`.

**Hooks:** `useIdentitiesList`, `useIdentityDetail`, `useIdentitiesFilter`.

### 5.8 Library (`library.ts`) — Master Data

CRUD cho 5 entity: **Matrix**, **Protocol**, **Parameter**, **SampleType**, **ParameterGroup**.

Mỗi entity có: `getList`, `create`, `update`, `delete`, `filter` + React Query hooks tương ứng.

---

## VI. QUY TẮC KHI THÊM MỚI API

1. **Import từ `@/api/client`**, KHÔNG tạo axios instance mới.
2. **Tạo Input Interface** rõ ràng cho mỗi hàm API.
3. **Types import từ `@/types/`**, KHÔNG định nghĩa lại.
4. **Bao gồm `noCacheHeaders`** cho endpoints cần dữ liệu mới nhất.
5. **Query Key Factory** phải dùng `stableKey()` cho filter/sort params.
6. **Hooks phải có `enabled` option** để control khi nào fetch.
7. **Mutation hooks phải `invalidateQueries`** sau khi thành công.
8. **Toast messages** dùng `t()` cho i18n.

---

## VII. LƯU Ý QUAN TRỌNG

- **Tất cả endpoints dùng POST** (kể cả GET-like operations) — Đây là convention của backend.
- **noCacheHeaders** được đính kèm cho list/detail endpoints để tránh browser cache.
- **`keepPreviousData`** được dùng trong list hooks để tránh flicker khi paginate.
- **Error handling** đã được xử lý ở interceptor level, nhưng hooks vẫn nên catch lỗi bổ sung.
