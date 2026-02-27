# Quy Trình Tái Cấu Trúc Project IRDOP

> **CRM đã có sẵn ở Partner project** → bỏ qua.
> Scope: API layer, LAB, LIBRARY, DOCUMENT, SERVICE, COMMON, NOTIFICATION, Utils.

## Cấu Trúc Thư Mục Mục Tiêu

```
src/
├── api/                          # API layer by modules
│   ├── client.js                 # Base API client (từ helperFunctionCallAPI.js)
│   ├── auth.js                   # Auth APIs
│   ├── lab.js                    # Receipts, Samples, Analyses APIs
│   ├── library.js                # Parameters, Protocols, Matrices APIs
│   ├── document.js               # Files, Documents APIs
│   ├── service.js                # Shipments APIs
│   └── index.js                  # Centralized exports
├── data/                         # Constants
│   └── constants.js              # Status enums, etc.
├── types/                        # JSDoc type definitions
│   ├── lab.js
│   └── common.js
├── components/                   # By business domain
│   ├── common/                   # Shared (Breadcrumb, Input, AuthGuard, FilterBar...)
│   ├── lab/
│   │   ├── receipts/             # CreateReceipt, CreateReceiptFromCRM
│   │   ├── samples/              # SampleImageUpload, PrintSampleTag, filterable...
│   │   ├── analyses/             # AnalyteInfor, AnalyteBulkUpdate, ProcessingAnalysis...
│   │   ├── dashboard/            # ProcessingSampleV2, labDashboard subfolders
│   │   ├── reports/              # LabResultReport, TemplateExperimentReport
│   │   ├── experiments/          # ExperimentDetail, ExperimentLog
│   │   └── editor/               # Editor, DocumentEditor, DiagramEditor, LabDocument...
│   ├── library/
│   │   ├── parameters/           # Parameter.jsx
│   │   └── protocols/            # ProtocolDetail, ProtocolInfor
│   ├── document/
│   │   └── file/                 # FileForm, FileDashboardView, FileColumn...
│   ├── service/
│   │   └── shipment/             # ShipmentForm
│   ├── account/                  # AccountInfor
│   ├── notification/             # ProcessingQueue, ExtractedDataModal, ConfirmLabResult
│   ├── orderDashboard/           # GIỮ NGUYÊN (CRM)
│   └── ui/                       # GIỮ NGUYÊN
├── contexts/                     # React Contexts only
│   ├── GlobalContext.jsx
│   └── TaskQueueContext.jsx
├── utils/                        # Utility functions (migrated from contexts/)
│   ├── formatHelpers.js
│   ├── htmlUtils.js
│   ├── reportUtils.js
│   └── previewUtils.js
├── pages/                        # GIỮ NGUYÊN
└── sections/                     # GIỮ NGUYÊN
```

## Các Bước Thực Hiện

### ✅ Bước 1: Git Branch & Backup

### ✅ Bước 2: Tạo Folder Structure mới

### ✅ Bước 3: Tạo API Base Client (re-export từ helperFunctionCallAPI.js)

### ✅ Bước 4: Tạo API Module Files (auth, lab, library, document, service)

### ✅ Bước 5: Tạo Constants & Types

### ✅ Bước 6: Migrate Utils (formatHelpers, convertHTML, reportUtils, previewUtils)

### ✅ Bước 7: Migrate Components — COMMON

### ✅ Bước 8: Migrate Components — LAB

### ✅ Bước 9: Migrate Components — LIBRARY, DOCUMENT, SERVICE, ACCOUNT, NOTIFICATION

### ✅ Bước 10: Update App.jsx Imports

### ✅ Bước 11: Update Pages Imports

### ✅ Bước 12: Cleanup folders cũ

### ✅ Bước 13: Final Verification

## Chiến Thuật Migration

- **Re-export**: File cũ re-export từ file mới → không break imports hiện có
- **Incremental**: Migrate từng file, test sau mỗi nhóm
- **Git**: Commit sau mỗi phase hoàn thành
