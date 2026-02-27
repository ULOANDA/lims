# Parameter Groups – Nhóm chỉ tiêu (`library/parameterGroups`)

## Tổng quan

Quản lý **nhóm chỉ tiêu** (Parameter Groups). Mỗi nhóm gom nhiều chỉ tiêu (parameters) thuộc cùng một loại mẫu (sample type), kèm thông tin giá và danh sách matrix liên quan.

## Danh sách file

| File                            | Mô tả                                                                                                                  |
| ------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `ParameterGroupsView.tsx`       | Component chính: state, API call `useParameterGroupsAll`, phân trang local (client-side slice), modal create           |
| `ParameterGroupsTable.tsx`      | Bảng danh sách với filter Excel-style. Cột: Group ID, Group Name, Sample Type, Matrix IDs, Giá trước/sau thuế, Actions |
| `ParameterGroupCreateModal.tsx` | Modal tạo nhóm chỉ tiêu mới                                                                                            |

## Luồng hoạt động

1. **Xem danh sách**: `ParameterGroupsView` gọi `useParameterGroupsAll` lấy toàn bộ (5000 items), sau đó phân trang client-side (10/page)
2. **Lọc**: Filter Excel-style cho cột: groupId, groupName, sampleTypeName
3. **Chỉnh sửa**: Cột Actions có nút Edit (hiện chuẩn bị, `onEdit` đang truyền `() => {}`)
4. **Tạo mới**: Click nút Add → `ParameterGroupCreateModal`

## Đặc điểm

- **Phân trang client-side**: Khác các module khác (server-side), module này tải toàn bộ rồi slice theo page
- **Matrix badges**: Hiển thị tối đa 3 matrix IDs dạng Badge, đếm thêm nếu có nhiều hơn
- **Giá tiền**: Format bằng `Intl.NumberFormat` locale VND

## API Endpoints

- `GET /v2/parameterGroups/get/list` – Danh sách (lấy toàn bộ, itemsPerPage=5000)
- `POST /v2/parameterGroups/create` – Tạo mới
- `POST /v2/parameterGroups/filter` – Filter Excel-style
