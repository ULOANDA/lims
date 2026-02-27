# Sample Types – Loại mẫu (`library/sampleTypes`)

## Tổng quan

Quản lý danh sách **loại mẫu** (Sample Types). Mỗi loại mẫu (VD: Nước uống, Nước thải, Đất...) có cấu hình hiển thị (`displayTypeStyle`) với hai phiên bản ngôn ngữ (default + eng).

## Danh sách file

| File                        | Mô tả                                                                                      |
| --------------------------- | ------------------------------------------------------------------------------------------ |
| `SampleTypesView.tsx`       | Component chính: state, API, phân trang, quản lý modal create (hỗ trợ edit pre-fill)       |
| `SampleTypesTable.tsx`      | Bảng danh sách với filter Excel-style. Cột: ID, Tên, Display Style, Ngày tạo, Actions      |
| `SampleTypeDetailPanel.tsx` | Panel chi tiết bên phải khi click vào hàng, hiển thị thông tin chung và danh sách matrices |
| `SampleTypeCreateModal.tsx` | Modal tạo mới / chỉnh sửa. Nhận `initialData` prop tùy chọn để pre-fill khi edit           |

## Luồng hoạt động

1. **Xem danh sách**: `SampleTypesView` gọi `useSampleTypesList` với phân trang server-side (20/page)
2. **Lọc**: Filter Excel-style cho cột: sampleTypeId, sampleTypeName, displayTypeStyle
3. **Xem chi tiết**: Click hàng → `SampleTypeDetailPanel` (sidebar phải)
4. **Chỉnh sửa**: Click nút Edit → `SampleTypeCreateModal` được mở với `initialData` pre-filled
5. **Tạo mới**: Click nút Add → `SampleTypeCreateModal` mở với form trống

## Cột Display Type Style

Cột `displayTypeStyle` hiển thị **2 dòng**:

- Dòng 1: `displayTypeStyle.default` – chữ lớn, màu foreground
- Dòng 2: `displayTypeStyle.eng` – chữ nhỏ, màu muted
- Hỗ trợ markdown inline: `*text*` → _in nghiêng_ qua `renderInlineEm`

## API Endpoints

- `GET /v2/sampleTypes/get/list` – Danh sách (có phân trang, tìm kiếm)
- `POST /v2/sampleTypes/create` – Tạo mới
- `POST /v2/sampleTypes/filter` – Filter Excel-style

## Lưu ý

- Hiện tại chưa có API update cho Sample Types. Nút Edit mở modal tạo mới pre-filled
- `SampleTypeCreateModal` nhận prop `initialData?: { sampleTypeName, displayDefault, displayEng }` để hỗ trợ edit
