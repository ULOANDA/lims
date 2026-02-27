# Library Module (`src/components/library`)

## Tổng quan

Module **Library** quản lý toàn bộ dữ liệu danh mục (catalog) của hệ thống LIMS, bao gồm: **Cấu hình (Matrices)**, **Chỉ tiêu (Parameters)**, **Nhóm chỉ tiêu (Parameter Groups)**, **Phương pháp (Protocols)**, và **Loại mẫu (Sample Types)**.

## Cấu trúc thư mục

```
library/
├── LibraryHeader.tsx          # Header chung cho tất cả trang (search, add button, title)
├── hooks/                     # Custom hooks dùng chung
│   ├── useDebouncedValue.ts   # Debounce giá trị search
│   ├── useServerPagination.ts # Quản lý phân trang phía server
│   └── useLibraryData.ts      # Types và hooks cho dữ liệu thư viện
├── matrices/                  # Quản lý cấu hình (Matrices)
├── parameterGroups/           # Quản lý nhóm chỉ tiêu
├── parameters/                # Quản lý chỉ tiêu (Parameters)
├── protocols/                 # Quản lý phương pháp (Protocols)
└── sampleTypes/               # Quản lý loại mẫu (Sample Types)
```

## Kiến trúc chung

Mỗi thư mục con (matrices, parameters, ...) tuân theo mẫu kiến trúc sau:

| Component                               | Vai trò                                                             |
| --------------------------------------- | ------------------------------------------------------------------- |
| `*View.tsx`                             | Component chính (page-level). Quản lý state, gọi API, phân trang    |
| `*Table.tsx`                            | Bảng danh sách có filter Excel-style, sắp xếp, chọn hàng            |
| `*DetailPanel.tsx` / `*DetailModal.tsx` | Hiển thị chi tiết khi click vào hàng. Có nút **Edit** (✏️) optional |
| `*CreateModal.tsx`                      | Modal tạo mới (hoặc chỉnh sửa nếu truyền `initialData`)             |
| `*EditModal.tsx`                        | Modal chỉnh sửa (nếu tách riêng)                                    |
| `*DeleteConfirm.tsx`                    | Dialog xác nhận xóa                                                 |

## Tính năng nút Edit trên DetailPanel

Tất cả 4 DetailPanel (`ProtocolDetailPanel`, `ParameterDetailPanel`, `MatrixDetailPanel`, `SampleTypeDetailPanel`) đều hỗ trợ prop `onEdit?`:

- Khi Parent View truyền callback `onEdit`, nút ✏️ (Pencil icon) hiển thị bên cạnh nút X (Close)
- Click nút Edit → gọi `onEdit(currentData)` → Parent View mở modal chỉnh sửa
- Nếu `onEdit` không được truyền, nút Edit ẩn (backward compatible)

## API Layer

Tất cả API calls được định nghĩa trong `src/api/library.ts`, bao gồm:

- **CRUD operations**: `list`, `detail`, `full`, `create`, `update`, `delete`
- **React Query hooks**: `useMatricesList`, `useMatrixDetail`, `useProtocolsList`, `useProtocolDetail`, ...
- **Filter API**: `useParametersFilter`, `useSampleTypesFilter`, ...
- **Full data endpoints**: `/v2/protocols/get/full`, `/v2/parameters/get/full`, `/v2/sampleTypes/get/full`

## i18n Keys

### Namespace structure

| Namespace                   | Mô tả                         |
| --------------------------- | ----------------------------- |
| `library.matrices.*`        | Labels cấu hình, bảng, detail |
| `library.protocols.*`       | Labels phương pháp            |
| `library.parameters.*`      | Labels chỉ tiêu               |
| `library.sampleTypes.*`     | Labels loại mẫu               |
| `library.parameterGroups.*` | Labels nhóm chỉ tiêu          |

### Common keys dùng chung

| Key                 | Mô tả             |
| ------------------- | ----------------- |
| `common.edit`       | "Chỉnh sửa"       |
| `common.noData`     | "Chưa có dữ liệu" |
| `common.loading`    | "Đang tải..."     |
| `common.errorTitle` | "Có lỗi xảy ra"   |
| `common.close`      | "Đóng"            |

## Shared Components

- **`LibraryHeader`**: Header chung với tiêu đề, ô tìm kiếm, nút thêm mới
- **`Pagination`**: Component phân trang (từ `@/components/ui/pagination`)
- **`MatricesAccordionItem`**: Accordion item cho hiển thị matrix trong ParameterDetailPanel, SampleTypeDetailPanel

## Luồng dữ liệu (Data Flow)

```
View (state management)
  ├── API hook (useXxxList) → React Query → Backend API
  ├── Table (display + filter)
  │     ├── ExcelFilterPopover (column-level filters)
  │     └── Action buttons (Edit, Delete)
  ├── DetailPanel (read-only detail + Edit button)
  │     ├── Full data fetch via useXxxDetail/useXxxFull
  │     ├── Loading/Error states
  │     └── onEdit → opens EditModal
  └── CreateModal / EditModal (write operations)
```

## Quy ước

1. **Cột Actions**: Tất cả bảng đều có cột `Actions` ở cuối với nút Edit (và Delete nếu có)
2. **DisplayStyle**: Các cột `displayStyle` / `displayTypeStyle` luôn render **2 dòng** (default + eng), hỗ trợ markdown inline (`*text*` → _in nghiêng_) qua `renderInlineEm`
3. **Phân trang**: Sử dụng `useServerPagination` hook + `Pagination` component. Chỉ có 1 khối phân trang duy nhất cho mỗi bảng
4. **Edit vs Detail**: Nút Edit mở modal chỉnh sửa (popup), click vào hàng mở panel chi tiết (sidebar). Panel chi tiết cũng có nút Edit.
5. **Full data fetch**: DetailPanel sử dụng hook riêng (vd: `useProtocolDetail`) để fetch full data thay vì chỉ dùng list data
