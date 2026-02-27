# HỆ THỐNG QUẢN LÝ IDENTITY & POLICY (PHÂN QUYỀN)

Tài liệu này mô tả chi tiết kiến trúc, logic và cơ chế hoạt động của hệ thống phân quyền (Role-Based Access Control - RBAC) trong LIMS, tập trung vào `IdentityEntity`, `Entity` và cơ chế **Decimal Permission Masking** (Quyền hạn giới hạn theo số thập phân).

---

## 1. Tổng Quan Kiến Trúc

Hệ thống phân quyền được thiết kế để kiểm soát truy cập ở mức **Column-Level (Cột)** và **Row-Level (Dòng)**, dựa trên cấu trúc:
**Identity (Người dùng)** → **Roles (Vai trò)** → **Policies (Chính sách)** → **Permissions (Quyền hạn chi tiết)**.

### Các Thành Phần Chính

1. **Identity (User/System)**: Thực thể thực hiện hành động.
2. **Role (`ROLE_...`)**: Nhóm các Policy. Ví dụ: `ROLE_TECHNICIAN` bao gồm `POL_SAMPLE_VIEW`, `POL_TEST_EXECUTE`, v.v.
3. **Policy (`POL_...`)**: Quy định quyền truy cập cụ thể vào một hoặc nhiều bảng.
    - **Trạng thái Policy**:
        - `ALLOW`: Cho phép truy cập đầy đủ theo định nghĩa.
        - `DENY`: Từ chối truy cập (ghi đè ALLOW).
        - `LIMIT`: Cho phép truy cập nhưng giới hạn dữ liệu (chỉ xem/sửa được dữ liệu của chính mình - Row-Level Security).
4. **Permission (Granular)**: Map chi tiết từ `Table` → `Column` → `Action Mask` (Read/Write/Delete).

---

## 2. Cơ Chế Decimal Permission Masking (Quyền Hạn Thập Phân)

### 2.1. Khái Niệm

Thay vì sử dụng cờ boolean `_limit_`, hệ thống sử dụng **giá trị thập phân (x.5)** để biểu thị quyền hạn bị giới hạn:

| Quyền Hạn                | Giá Trị Bình Thường | Giá Trị Giới Hạn (LIMIT) |
| ------------------------ | ------------------- | ------------------------ |
| READ only                | 1                   | **0.5**                  |
| READ + WRITE             | 3 (1+2)             | **2.5** (0.5+2)          |
| FULL (READ+WRITE+DELETE) | 7 (1+2+4)           | **6.5** (0.5+2+4)        |

### 2.2. Logic Tính Toán

Khi resolve permissions trong `Entity` constructor:

1. **Tổng hợp Policies từ Roles**: Lấy tất cả policy codes từ các role của user.
2. **Kiểm tra trạng thái LIMIT**: Với mỗi bảng, kiểm tra xem **TẤT CẢ** các policy cấp quyền cho bảng đó có trạng thái `LIMIT` hay không.
3. **Áp dụng Decimal Mask**:
    - Nếu **CÓ ÍT NHẤT MỘT** policy là `ALLOW` (không limit) → Giữ nguyên giá trị permission (1, 3, 7).
    - Nếu **TẤT CẢ** policy đều là `LIMIT` → **Trừ 0.5** từ mỗi column permission.

```javascript
// Ví dụ trong 4_Entity.js constructor
if (!hasFullAccess) {
    for (const col of Object.keys(mergedCols)) {
        mergedCols[col] = mergedCols[col] - 0.5;
    }
}
```

---

## 3. Luồng Dữ Liệu & Xử Lý Logic

### 3.1. Đăng Nhập & Khởi Tạo Session (`Entity.login`)

Khi người dùng đăng nhập:

1. Hệ thống tải thông tin `Identity` từ DB.
2. Lấy danh sách `identityRoles` (ví dụ: `["ROLE_TECHNICIAN", "ROLE_VALIDATOR"]`).
3. **Resolve Policies**: Từ Roles, hệ thống phân giải ra danh sách tất cả Policy Codes tương ứng.
4. **Resolve Permissions**: Từ Policies, hệ thống tổng hợp thành Permission Map (Table -> Columns) với giá trị decimal nếu bị LIMIT.
5. **Lưu Cache**: Thông tin này (Roles, Policies, Permissions) được lưu vào Valkey cache.

### 3.2. Quản Lý Role & Policy (`IdentityEntity`)

Các phương thức quản lý Role cập nhật trực tiếp trạng thái Policy trong cột `identityPolicies` (JSONB) của User:

- **`addRole(roleCode)`**:
    - Thêm Role vào danh sách `identityRoles`.
    - Tìm các Policy thuộc Role đó → Set trạng thái `ALLOW` trong `identityPolicies`.
- **`removeRole(roleCode)`**:
    - Xóa Role khỏi danh sách `identityRoles`.
    - Tìm các Policy thuộc Role đó → Set trạng thái `DENY` trong `identityPolicies`.
    - _Lưu ý: DENY có độ ưu tiên cao nhất, đảm bảo thu hồi quyền ngay lập tức._
- **`updatePolicy(policyCode, status)`**:
    - Cập nhật trạng thái cụ thể (`ALLOW`, `DENY`, `LIMIT`) cho một Policy lẻ trong `identityPolicies`.

---

## 4. Cơ Chế Thực Thi Quyền (`Entity.js`)

### 4.1. Kiểm Tra Quyền Truy Cập (`checkPermit`)

**Signature**: `checkPermit({ sourceTable, action, data, isThrow })`

**Tham số**:

- `sourceTable`: Tên bảng cần kiểm tra (ví dụ: `"lab.sample"`).
- `action`: Loại hành động - `"READ"` | `"WRITE"` | `"DELETE"`.
- `data` (optional): Dữ liệu bản ghi cụ thể để kiểm tra ownership.
- `isThrow`: Có throw error nếu không có quyền hay không.

**Logic**:

1. **Lấy max permission** của user trên bảng đó.
2. **Kiểm tra permission mask**:
    - Nếu là **số nguyên** (1, 3, 7) và `>= required mask` → **ALLOW** (quyền đầy đủ).
    - Nếu là **số thập phân** (0.5, 2.5, 6.5):
        - **Có `data` truyền vào**: Gọi `#checkOwnership(data)` để kiểm tra xem user có phải owner không.
            - Nếu **LÀ OWNER** → **ALLOW**.
            - Nếu **KHÔNG PHẢI OWNER** → **DENY** (throw 403).
        - **Không có `data`**: Trả về `true` (cho phép tiếp tục, việc lọc dữ liệu sẽ xử lý sau).

### 4.2. Kiểm Tra Ownership (`#checkOwnership`)

**Private method** kiểm tra xem user có sở hữu bản ghi hay không dựa trên các cột FK tới `identity.identities`:

**Các cột Owner được kiểm tra**:

- `technicianId`
- `salePersonId`
- `createdById`
- `modifiedById`
- `technicianIds` (array)

```javascript
#checkOwnership(data) {
    const myId = this.#identityId;
    const OWNER_COLS = ["technicianId", "salePersonId", "createdById", "modifiedById"];
    const OWNER_ARRAY_COLS = ["technicianIds"];

    for (const col of OWNER_COLS) {
        if (data[col] && data[col] === myId) return true;
    }
    for (const col of OWNER_ARRAY_COLS) {
        if (Array.isArray(data[col]) && data[col].includes(myId)) return true;
    }
    return false;
}
```

### 4.3. Validate Ownership cho Write/Delete (`validateOwnershipOrThrow`)

**Signature**: `validateOwnershipOrThrow({ data, sourceTable, action })`

Method này được gọi trong `update()` và `delete()` của `LabEntity` để đảm bảo user chỉ có thể sửa/xóa dữ liệu của chính mình khi có quyền LIMIT:

1. Kiểm tra permission mask của user trên bảng.
2. Nếu mask là **số nguyên** → Bỏ qua (quyền đầy đủ).
3. Nếu mask là **số thập phân** (x.5):
    - Gọi `#checkOwnership(data)`.
    - Nếu **KHÔNG PHẢI OWNER** → **Throw 403** với message rõ ràng.

### 4.4. Lọc Dữ Liệu Trả Về (`filterDataResponse`)

Hàm đệ quy này đảm bảo User chỉ nhìn thấy đúng những gì được phép.

**Quy Tắc Lọc (Filtering Rules)**:

1. **Auto-Allow Audit Columns**:
    - Các cột hệ thống (`createdAt`, `createdById`, `modifiedAt`, `modifiedById`, `deletedAt`) **LUÔN LUÔN** được giữ lại.

2. **Table Matching (Khớp Bảng)**:
    - Hệ thống so sánh các key trong Object dữ liệu với các Permission Map đã biết.
    - Nếu khớp → Áp dụng bộ lọc của bảng đó.
    - Nếu không khớp → Giữ nguyên (cho pagination wrapper, success flags...).

3. **Decimal Permission Filtering (MỚI)**:
    - Với mỗi column trong bảng, kiểm tra `colMask % 1`:
        - **Nếu `colMask % 1 !== 0`** (là số thập phân - quyền LIMIT):
            - Gọi `#checkOwnership(item)`.
            - Nếu **LÀ OWNER**: Giữ nguyên giá trị.
            - Nếu **KHÔNG PHẢI OWNER**: Set giá trị = `null` (mask data).
        - **Nếu `colMask >= 1`** (số nguyên - quyền đầy đủ): Giữ nguyên giá trị.
        - **Nếu `colMask === 0`**: Bỏ qua column (không có quyền READ).

4. **Strict Whitelist**:
    - Các cột KHÔNG có trong Permission Map sẽ bị loại bỏ (trừ khi là nested relation).

5. **Xử Lý Cấu Trúc Lồng Nhau**:
    - Nếu gặp nested object/array → Kiểm tra xem có khớp với bảng khác không.
    - Nếu khớp → Đệ quy lọc tiếp.
    - Nếu không khớp → Bỏ qua (hidden JSONB data).

---

## 5. Tích Hợp vào Lab Entities

### 5.1. Centralized Filtering (`LabEntity.filterData`)

**File**: `BLACK/LAB/1_labEntities.js`

Thêm static method `filterData` làm điểm tập trung cho việc lọc dữ liệu:

```javascript
static filterData({ instance, entity }) {
    if (!instance || !entity) return instance;
    return entity.filterDataResponse(instance);
}
```

Method này:

- Được gọi trong `getById` sau khi query DB.
- Có thể được **override** ở các subclass nếu cần logic lọc đặc biệt.

### 5.2. Ownership Validation trong Update/Delete

**File**: `BLACK/LAB/1_labEntities.js`

Cả `update()` và `delete()` đều thêm validation:

```javascript
// Trong update()
this.entity.validateOwnershipOrThrow({
    data: this,
    sourceTable: EntityClass.tableName,
    action: "WRITE",
});

// Trong delete()
this.entity.validateOwnershipOrThrow({
    data: this,
    sourceTable: EntityClass.tableName,
    action: "DELETE",
});
```

---

## 6. Ví Dụ Minh Họa

### Kịch bản 1: TECHNICIAN với quyền LIMIT xem Samples

**Cấu hình**:

- **User**: `identityId = "USR001"`
- **Role**: `ROLE_TECHNICIAN`
- **Policy**: `POL_SAMPLE_VIEW` với trạng thái `LIMIT`
- **Permission Mask**: `0.5` (READ LIMIT) cho các cột `sampleId`, `status`, `matrix`

**Data thực tế**:

```json
[
    {
        "sampleId": "SP001",
        "status": "pending",
        "technicianId": "USR001", // Của chính mình
        "createdAt": "2023-01-01"
    },
    {
        "sampleId": "SP002",
        "status": "completed",
        "technicianId": "USR002", // Của người khác
        "createdAt": "2023-01-02"
    }
]
```

**Kết quả sau `filterDataResponse`**:

```json
[
    {
        "sampleId": "SP001", // Hiển thị vì là owner
        "status": "pending",
        "createdAt": "2023-01-01"
    },
    {
        "sampleId": null, // Mask vì không phải owner
        "status": null,
        "createdAt": "2023-01-02"
    }
]
```

### Kịch bản 2: TECHNICIAN cố gắng update Sample của người khác

**Request**: `PATCH /api/samples/SP002` (thuộc về USR002)

**Kết quả**:

```
403 Forbidden
{
  "error": "Restricted: you can only write your own data"
}
```

Vì `validateOwnershipOrThrow` được gọi trong `update()` và phát hiện user không phải owner.

---

## 7. Quy Trình Cập Nhật Logic

Khi cần thay đổi quyền hạn:

1. **Sửa đổi Policies/Roles**: Cập nhật `0_constant.js` hoặc `3_policy.json`.
2. **Thay đổi logic lọc**: Cập nhật `filterDataResponse` trong `4_Entity.js`.
3. **Thay đổi cách gán Role**: Cập nhật `1_identityEntities.js`.
4. **Thêm Owner Columns**: Nếu cần kiểm tra ownership qua cột mới, cập nhật `#checkOwnership` trong `4_Entity.js`.
5. **Clear Cache**: User cần login lại hoặc trigger cập nhật cache để áp dụng thay đổi mới nhất.

---

## 8. Lưu Ý Quan Trọng

### 8.1. Performance

- Decimal permission check (`% 1`) rất nhanh (O(1)).
- Ownership check chỉ chạy khi cần thiết (khi mask là x.5).
- Cache Valkey giúp tránh re-calculate permissions mỗi request.

### 8.2. Security

- **Defense in Depth**: Có 3 lớp bảo vệ:
    1. `checkPermit` ở đầu hàm (gate check).
    2. `validateOwnershipOrThrow` trước write/delete.
    3. `filterDataResponse` trước trả về data.
- **Fail-Safe**: Mặc định là DENY nếu không có permission rõ ràng.

### 8.3. Extensibility

- Có thể override `filterData` ở từng Entity class để custom logic.
- Có thể thêm owner columns mới vào `#checkOwnership` dễ dàng.
- Decimal system cho phép mở rộng thêm các mức giới hạn khác trong tương lai (ví dụ: 0.25 cho read-only-metadata).
