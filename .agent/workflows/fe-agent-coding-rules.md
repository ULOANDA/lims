---
description: Quy chuẩn viết code Frontend, cấu trúc logic, và quy tắc cho AI agent trên dự án LIMS Frontend (React + Vite + TypeScript)
---

# QUY CHUẨN AGENT — LIMS FRONTEND PROJECT

> **Mục đích:** Tài liệu này là **nguồn sự thật duy nhất** cho AI agent khi viết code Frontend.
> **Phạm vi:** Dự án LIMS-DEV Frontend (`src/` folder) — React 18 + Vite + TypeScript + Tailwind CSS v4.

---

## 🚨 BƯỚC ĐẦU TIÊN BẮT BUỘC — ĐỌC TÀI LIỆU LIÊN QUAN

**TRƯỚC KHI viết bất kỳ dòng code nào**, agent PHẢI đọc các tài liệu tham chiếu phù hợp với phạm vi công việc đang thực hiện:

### Tài liệu Quy tắc Chung:

| Tài liệu           | Đường dẫn           | Nội dung                                        |
| :----------------- | :------------------ | :---------------------------------------------- |
| **Core Rules**     | `RULE.md`           | Tech stack, directory structure, git workflow   |
| **FE Agent Rules** | `FE_AGENT_RULES.md` | Zero-tolerance rules: theming, i18n, API, types |

### Tài liệu Cấu trúc Code (đọc theo phạm vi):

| Phạm vi              | Tài liệu            | Đường dẫn                                           |
| :------------------- | :------------------ | :-------------------------------------------------- |
| API calls            | API Structure       | `src/api/0_API_STRUCTURE.md`                        |
| Configuration        | Config Structure    | `src/config/0_CONFIG_STRUCTURE.md`                  |
| Reception Components | Reception Structure | `src/components/reception/0_RECEPTION_STRUCTURE.md` |
| Sample Components    | Samples Structure   | `src/components/samples/0_SAMPLES_STRUCTURE.md`     |
| TypeScript Types     | Types Structure     | `src/types/0_TYPES_STRUCTURE.md`                    |
| Pages/Routing        | Pages Structure     | `src/pages/0_PAGES_STRUCTURE.md`                    |

### Tài liệu Nghiệp vụ & API Backend (đọc khi cần hiểu context):

| Tài liệu        | Đường dẫn                                | Nội dung                                                 |
| :-------------- | :--------------------------------------- | :------------------------------------------------------- |
| Database Schema | `src/docs/DATABASE.md`                   | ★ Schema tất cả bảng (single source of truth cho fields) |
| API Rule        | `src/docs/API_RULE.md`                   | Quy tắc URL, params, response format                     |
| Lab API         | `src/docs/LAB_API_DOCUMENTATION.md`      | Endpoints cho Receipt, Sample, Analysis                  |
| Lab Flow        | `src/docs/LAB_FLOW.md`                   | Business flow: Reception → Testing → Approval            |
| Auth API        | `src/docs/AUTH_API_DOCUMENTATION.md`     | Login, verify, logout                                    |
| Identity API    | `src/docs/IDENTITY_API_DOCUMENTATION.md` | User management                                          |
| Library API     | `src/docs/LIBRARY_API_DOCUMENTATION.md`  | Master data: Matrix, Parameter, Protocol                 |
| Document API    | `src/docs/DOCUMENT_API_DOCUMENTATION.md` | File & Document management                               |
| Shipment API    | `src/docs/SHIPMENT_API_DOCUMENTATION.md` | Logistics                                                |
| Theme System    | `src/config/theme/THEME_SYSTEM.md`       | Color tokens, semantic classes                           |
| Language System | `src/config/i18n/LANGUAGE_SYSTEM.md`     | i18n key conventions                                     |
| Chức năng       | `src/docs/DANH SÁCH CHỨC NĂNG.md`        | Danh sách tất cả chức năng hệ thống                      |
| Vị trí/Roles    | `src/docs/DANH SÁCH VỊ TRÍ.md`           | Vai trò và quyền hạn                                     |
| Phân quyền      | `src/docs/MA TRẬN PHÂN QUYỀN.md`         | Ma trận quyền chi tiết                                   |

---

## I. TECH STACK

| Lớp          | Công nghệ                           | Version                  |
| :----------- | :---------------------------------- | :----------------------- |
| Runtime      | Node.js                             | 18+                      |
| Build Tool   | Vite                                | 5+                       |
| Language     | TypeScript                          | 5+ (Strict)              |
| UI Framework | React                               | 18                       |
| Styling      | Tailwind CSS                        | v4 (`@tailwindcss/vite`) |
| UI Library   | Shadcn/ui + Radix UI                | —                        |
| Icons        | lucide-react                        | —                        |
| Server State | @tanstack/react-query               | —                        |
| Client State | zustand / React Context             | —                        |
| Forms        | react-hook-form + zod               | —                        |
| Routing      | react-router-dom                    | v6+                      |
| Animations   | framer-motion / tailwindcss-animate | —                        |
| Theme        | next-themes                         | —                        |
| HTTP         | axios                               | —                        |
| Dates        | date-fns                            | —                        |
| Utils        | clsx, tailwind-merge                | —                        |
| Toasts       | sonner                              | —                        |

---

## II. CẤU TRÚC THƯ MỤC

```
src/
├── app/                    # Application setup (App.tsx, globals.css)
├── api/                    # ★ API layer (client.ts, receipts.ts, samples.ts, ...)
├── assets/                 # Static files (images, fonts)
├── components/
│   ├── common/             # Shared components (Pagination, StatusBadge, DataTable)
│   ├── layout/             # Layout (Sidebar, Header, MainContent)
│   ├── ui/                 # Shadcn base components (button, input, select, ...)
│   ├── reception/          # ★ Tiếp nhận mẫu (CreateReceipt, ReceiptDetail, SampleDetail)
│   ├── samples/            # ★ Quản lý mẫu standalone
│   ├── technician/         # Kỹ thuật viên
│   ├── lab-manager/        # Quản lý Lab
│   └── inventory/          # Kho
├── config/                 # ★ Constants, navigation, query-keys, i18n, theme
├── contexts/               # React Contexts (Auth, Theme)
├── hooks/                  # Custom hooks
├── pages/                  # ★ View pages (thin wrappers → components)
├── types/                  # ★ TypeScript interfaces
├── utils/                  # Helper/utility functions
├── docs/                   # ★ Documentation reference (DB schema, API docs, flows)
└── main.tsx                # Entry point
```

---

## III. QUY TẮC TUYỆT ĐỐI (ZERO TOLERANCE)

### 3.1 THEMING — Không hardcode màu

```tsx
// ❌ CẤM
<div className="bg-white text-black">
<div style={{ color: '#ff0000' }}>

// ✅ ĐÚNG
<div className="bg-background text-foreground">
<div className="text-destructive">
```

**Token bắt buộc nhớ:**

- Nền: `bg-background`, `bg-card`, `bg-muted`, `bg-popover`, `bg-sidebar`
- Text: `text-foreground`, `text-muted-foreground`, `text-primary-foreground`
- Border: `border-border`, `border-input`
- Status: `bg-success`, `bg-warning`, `bg-destructive`

### 3.2 I18N — Không hardcode text

```tsx
// ❌ CẤM
<Button>Lưu</Button>
<span>Trạng thái</span>

// ✅ ĐÚNG
<Button>{String(t("common.save"))}</Button>
<span>{String(t("lab.analyses.analysisStatus", { defaultValue: "Trạng thái" }))}</span>
```

**Cấu trúc key:** `Module.SubModule.field` (camelCase)

- `common.save`, `common.cancel`, `common.error`
- `reception.createReceipt.samplesList`
- `lab.samples.sampleId`, `lab.analyses.analysisStatus`
- `crm.clients.clientName`

### 3.3 TYPESCRIPT — Không dùng `any`

```tsx
// ❌ CẤM
const data: any = ...;
interface MyReceipt { ... }  // Không tự tạo type đã có

// ✅ ĐÚNG
import type { ReceiptDetail, ReceiptSample } from "@/types/receipt";
const data: ReceiptDetail = ...;
```

### 3.4 API — Tuân thủ response format

```tsx
// ❌ CẤM
const res = await fetch("/api/receipts");
const data = res.json(); // Không check success

// ✅ ĐÚNG
const { data, meta } = useReceiptsList(input);
// Hooks đã handle assertSuccess + error toast
```

### 3.5 NULL HANDLING — Luôn handle null

```tsx
// ❌ CẤM
<span>{sample.sampleName}</span>  // Có thể crash nếu null

// ✅ ĐÚNG
<span>{sample.sampleName ?? "-"}</span>
// Hoặc với dates:
<span>{sample.sampleRetentionDate ? new Date(sample.sampleRetentionDate).toLocaleDateString() : "-"}</span>
```

---

## IV. CẤU TRÚC COMPONENT

### 4.1 Template Component

```tsx
// 1. Imports (Order: React → Libraries → Internal)
import { useState, useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import type { ReceiptSample } from "@/types/receipt";

// 2. Props Interface
interface SampleCardProps {
    sample: ReceiptSample;
    isEditing: boolean;
    onSave: (sample: ReceiptSample) => void;
}

// 3. Component
export function SampleCard({ sample, isEditing, onSave }: SampleCardProps) {
    // 3.1 Hooks
    const { t } = useTranslation();
    const [editedSample, setEditedSample] = useState(sample);

    // 3.2 Derived State
    const displayName = useMemo(() => sample.sampleName ?? "-", [sample.sampleName]);

    // 3.3 Handlers
    const handleSave = useCallback(() => {
        onSave(editedSample);
    }, [editedSample, onSave]);

    // 3.4 Render
    return (
        <div className="bg-card border border-border rounded-lg p-4">
            <Label className="text-xs text-muted-foreground">{String(t("lab.samples.sampleName"))}</Label>
            {isEditing ? (
                <Input value={editedSample.sampleName ?? ""} onChange={(e) => setEditedSample({ ...editedSample, sampleName: e.target.value })} className="mt-1 h-8 text-sm bg-background" />
            ) : (
                <div className="text-sm font-medium text-foreground mt-1">{displayName}</div>
            )}
        </div>
    );
}
```

### 4.2 Page Pattern (Thin Wrapper)

```tsx
// src/pages/ReceptionPage.tsx
import { SampleReception } from "@/components/reception/SampleReception";

export default function ReceptionPage() {
    return <SampleReception />;
}
```

### 4.3 API Hook Usage Pattern

```tsx
// Sử dụng hooks từ src/api/
const { data: receipts, isLoading, error } = useReceiptsList(input);
const createMutation = useReceiptMutationCreate();

// List data
if (isLoading) return <TableSkeleton rows={5} columns={4} />;
if (error) return <Alert variant="destructive">{error.message}</Alert>;

// Mutation
const handleCreate = () => {
    createMutation.mutate(
        { body: formData },
        {
            onSuccess: () => toast.success(String(t("common.saveSuccess"))),
        },
    );
};
```

---

## V. CÁC PATTERN QUAN TRỌNG

### 5.1 Edit Mode Pattern (cho Detail Modals)

```tsx
const [isEditing, setIsEditing] = useState(false);
const [editedData, setEditedData] = useState(originalData);

// Toggle edit
const handleEdit = () => setIsEditing(true);
const handleCancel = () => { setIsEditing(false); setEditedData(originalData); };
const handleSave = () => { mutation.mutate(editedData); setIsEditing(false); };

// Field rendering
{isEditing ? (
    <Input value={editedData.field ?? ""} onChange={...} />
) : (
    <div>{originalData.field ?? "-"}</div>
)}
```

### 5.2 Status Badge Pattern

```tsx
// Dùng Badge với variant semantic
<Badge variant="outline">{sample.sampleStatus ?? "-"}</Badge>;

// Hoặc với color mapping helper
function getStatusBadge(status: string) {
    switch (status) {
        case "Done":
            return <Badge className="bg-success text-success-foreground">Done</Badge>;
        case "Processing":
            return <Badge className="bg-primary text-primary-foreground">Processing</Badge>;
        case "Pending":
            return <Badge variant="outline">Pending</Badge>;
        default:
            return <Badge variant="secondary">{status}</Badge>;
    }
}
```

### 5.3 Table Pattern

```tsx
<div className="bg-background border border-border rounded-lg overflow-hidden">
    <div className="overflow-x-auto">
        <table className="w-full text-sm">
            <thead className="bg-muted/50 border-b border-border">
                <tr>
                    <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">{String(t("lab.samples.sampleId"))}</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-border">
                {items.map((item) => (
                    <tr key={item.id} className="hover:bg-muted/30">
                        <td className="px-3 py-2">{item.sampleId}</td>
                    </tr>
                ))}
            </tbody>
        </table>
    </div>
</div>
```

### 5.4 Grid Layout Pattern

```tsx
// Form fields — responsive grid
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-y-4 gap-x-6">
    <div>
        <Label className="text-xs text-muted-foreground">{String(t("field.label"))}</Label>
        <div className="text-sm font-medium text-foreground mt-1">{value ?? "-"}</div>
    </div>
    {/* Full-width field */}
    <div className="col-span-1 md:col-span-2 lg:col-span-3">
        <Label>...</Label>
        <div>...</div>
    </div>
</div>
```

### 5.5 Modal Pattern

```tsx
// Modal header
<div className="flex items-center justify-between p-3 border-b border-border bg-muted/30">
    <h2 className="text-lg font-semibold text-foreground">{title}</h2>
    <div className="flex items-center gap-2">
        {/* Action buttons */}
        <Button variant="ghost" size="sm" onClick={onClose}><X /></Button>
    </div>
</div>

// Modal body
<div className="flex-1 overflow-y-auto p-4 space-y-4">
    {/* Content */}
</div>
```

---

## VI. QUERY KEY MANAGEMENT

### 6.1 Query Keys tập trung

```typescript
// ❌ CẤM hardcode
useQuery({ queryKey: ["receipts", "list"] });

// ✅ ĐÚNG - dùng từ config/query-keys.ts hoặc entity module
useQuery({ queryKey: receiptsKeys.list(input) });
useQuery({ queryKey: QUERY_KEYS.reception.receipts.list(filters) });
```

### 6.2 Mutation Invalidation

```typescript
// Sau mutation, PHẢI invalidate queries liên quan
onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: receiptsKeys.all });
    toast.success(String(t("common.saveSuccess")));
};
```

---

## VII. LIÊN KẾT GIỮA CÁC MODULE

### 7.1 Luồng dữ liệu Receipt → Sample → Analysis

```
Receipt (ReceiptDetail)
  └── samples: ReceiptSample[]
       └── analyses: ReceiptAnalysis[]

Types liên quan:
  - src/types/receipt.ts → ReceiptDetail, ReceiptSample, ReceiptAnalysis
  - src/types/sample.ts  → SampleDetail, SampleAnalysis (standalone)
  - src/types/analysis.ts → AnalysisDetail, AnalysisListItem (standalone)
  - src/types/lab.ts      → Receipt, Sample, Analysis (canonical DB-level)

APIs liên quan:
  - src/api/receipts.ts → CRUD receipts (bao gồm samples + analyses nested)
  - src/api/samples.ts  → CRUD samples (standalone)
  - src/api/analyses.ts → CRUD analyses (standalone)
```

### 7.2 Khi nào dùng type nào?

| Context                         | Type file     | Key types                                           |
| :------------------------------ | :------------ | :-------------------------------------------------- |
| Trong ReceiptDetailModal        | `receipt.ts`  | `ReceiptDetail`, `ReceiptSample`, `ReceiptAnalysis` |
| Trong SamplesTable (standalone) | `sample.ts`   | `SampleListItem`, `SampleDetail`, `SampleAnalysis`  |
| Trong AnalysesPage              | `analysis.ts` | `AnalysisListItem`, `AnalysisDetail`                |
| Trong Library pages             | `library.ts`  | `Matrix`, `Protocol`, `Parameter`, `SampleType`     |
| Trong CRM pages                 | `crm.ts`      | `Client`, `Order`, `Quote`                          |

---

## VIII. CONSTANTS & DEFAULTS

### 8.1 Hằng số quan trọng (từ `config/constants.ts`)

```typescript
DEFAULT_PAGINATION_SIZE = 20
PAGINATION_SIZE = [20, 50, 100, 200]
MAX_UPLOAD = 10MB
DATE_FORMAT = { short: "dd/MM/yyyy", full: "dd/MM/yyyy HH:mm", api: "yyyy-MM-dd" }
STALE_TIMES = { ZERO: 0, SHORT: 30s, MEDIUM: 5min, LONG: 1h, INFINITY }
DEFAULT_TAX_RATE = 0.08
```

### 8.2 Database Field Reference (từ `docs/DATABASE.md`)

Khi cần biết field nào có trong entity → **ĐỌC `src/docs/DATABASE.md`** — đây là nguồn sự thật duy nhất.

Ví dụ bảng `samples`:

```
sampleId, sampleName, receiptId, sampleTypeId, productType, sampleTypeName,
sampleClientInfo, sampleInfo (jsonb[]), sampleReceiptInfo (jsonb[]),
sampleStatus, sampleVolume, sampleWeight, samplePreservation,
sampleStorageLoc, sampleRetentionDate, sampleDisposalDate,
sampleIsReference, samplingInfo (jsonb), physicalState, sampleNote,
parentSampleId, custodyLog (jsonb[]), retentionServiceFee
```

---

## IX. PRE-SUBMISSION CHECKLIST

Agent PHẢI tự kiểm tra trước khi hoàn thành:

- [ ] Không hardcode colors (không `bg-white`, `text-black`, `#hex`)
- [ ] Không hardcode text (mọi text dùng `t()` hoặc `String(t("key"))`)
- [ ] Không dùng `any` type
- [ ] Types import từ `src/types/` (không tự định nghĩa lại)
- [ ] Null handled (mọi field optional hiển thị `?? "-"`)
- [ ] Loading state có (Skeleton, không spinner toàn trang)
- [ ] Error state có (Alert/Toast)
- [ ] Responsive (Grid system, `overflow-x-auto` cho table)
- [ ] Query keys từ factory (không hardcode string)
- [ ] Mutation có invalidateQueries
- [ ] API hooks có `enabled` option khi cần
- [ ] Dates format đúng (dùng `DATE_FORMAT` từ constants)
- [ ] Run `npx tsc --noEmit` để verify TypeScript pass

---

## X. CÁCH TIẾP CẬN TỪNG LOẠI TASK

### 10.1 Thêm field mới vào form/modal

1. Đọc `src/docs/DATABASE.md` → xác nhận field tồn tại trong schema.
2. Check type file tương ứng (`receipt.ts`, `sample.ts`, ...) → field đã có trong type chưa?
3. Nếu chưa → thêm field vào type file.
4. Thêm field vào component (view mode + edit mode).
5. Thêm i18n key vào locale files.
6. Run `npx tsc --noEmit` để verify.

### 10.2 Tạo API module mới

1. Đọc `src/api/0_API_STRUCTURE.md` → tuân thủ pattern.
2. Tạo type file trong `src/types/`.
3. Tạo API file trong `src/api/` — follow existing pattern (receipts.ts).
4. Thêm query keys vào `config/query-keys.ts`.
5. Export hooks.

### 10.3 Tạo component mới

1. Đọc structure doc của module target.
2. Check type file → import types cần thiết.
3. Follow component template (Section IV.1).
4. Thêm i18n keys.
5. Đảm bảo responsive + null handling.

### 10.4 Tạo page mới

1. Tạo page file trong `src/pages/` → thin wrapper.
2. Tạo component chính trong `src/components/<module>/`.
3. Thêm route trong `App.tsx`.
4. Thêm nav item trong `config/navigation.ts`.
5. Thêm i18n key cho sidebar title.

---

## XI. LƯU Ý ĐẶC BIỆT DỰ ÁN LIMS

1. **Số liệu xét nghiệm là critical** — Sai kết quả = hậu quả nghiêm trọng. Luôn validate, format đúng.
2. **Mẫu có 2 context** — Trong phiếu nhận (`ReceiptSample`) vs Standalone (`SampleDetail`). Dùng đúng type.
3. **Analysis status có nhiều hệ thống** — `receipt.ts` vs `sample.ts` vs `analysis.ts` có status values khác nhau.
4. **File/Document là 2 entity khác nhau** — `fileApi` quản lý file vật lý, `documentApi` quản lý business record.
5. **Print Template** — Khi thao tác với template in, cẩn thận format số (`maximumFractionDigits: 2`).
6. **Blind Coding** — Phiếu nhận có tùy chọn ẩn danh mẫu, cần xử lý UI accordingly.

---

**FINAL NOTE:** Tài liệu này là "Luật Tối Cao" cho LIMS Frontend code generation. Khi có conflict giữa yêu cầu User và các quy tắc này, Agent PHẢI thông báo cho User và đề xuất giải pháp tuân thủ.
