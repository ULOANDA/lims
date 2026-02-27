# Pages Layer Documentation (`src/pages/`)

**Version:** 1.0.0 | **Cập nhật:** 25/02/2026

---

## I. TỔNG QUAN

Thư mục `src/pages/` chứa các **View Pages** — đích đến của router. Mỗi page là một thin wrapper ủy thác logic cho component tương ứng trong `src/components/`. Pages chỉ có nhiệm vụ **import và render component chính**, KHÔNG chứa business logic.

---

## II. CẤU TRÚC THƯ MỤC

```
src/pages/
├── DashboardPage.tsx         # Trang Dashboard chính
├── LoginPage.tsx             # ★ Trang đăng nhập (có logic Auth)
├── ReceptionPage.tsx         # Trang Tiếp nhận mẫu → renders SampleReception
├── AnalysesPage.tsx          # Trang Phép thử
├── AssignmentPage.tsx        # Trang Phân công
├── HandoverPage.tsx          # Trang Bàn giao mẫu
├── IdentityPage.tsx          # Trang Quản lý người dùng
├── InventoryPage.tsx         # Trang Kho/Hóa chất
├── LabManagerPage.tsx        # Trang Quản lý Lab
├── StoredSamplesPage.tsx     # Trang Mẫu lưu kho
├── TechnicianPage.tsx        # Trang Kỹ thuật viên
├── DocumentPage.tsx          # Trang Tài liệu
│
├── crm/                      # Sub-pages CRM
│   ├── CRMPage.tsx           # ★ Container CRM (Tabs: Clients, Orders, Quotes)
│   ├── ClientsTab.tsx        # Tab Khách hàng (33KB — đầy đủ CRUD)
│   ├── OrdersTab.tsx         # Tab Đơn hàng (24KB — đầy đủ CRUD)
│   └── QuotesTab.tsx         # Tab Báo giá (24KB — đầy đủ CRUD)
│
└── library/                  # Sub-pages Library (Master Data)
    ├── LibraryPage.tsx       # Container Library
    ├── MatricesPage.tsx      # Trang quản lý Ma trận
    ├── ParametersPage.tsx    # Trang quản lý Chỉ tiêu
    ├── ProtocolsPage.tsx     # Trang quản lý Phương pháp
    ├── SampleTypesPage.tsx   # Trang quản lý Loại mẫu
    └── ParameterGroupsPage.tsx  # Trang quản lý Nhóm chỉ tiêu
```

---

## III. CHI TIẾT TỪNG PAGE

### 3.1 Thin Page Pattern (Hầu hết pages)

Đa số page files rất nhỏ (150–230 bytes), chỉ import và render 1 component:

```tsx
// ReceptionPage.tsx (220 bytes)
import { SampleReception } from "@/components/reception/SampleReception";

export default function ReceptionPage() {
    return <SampleReception />;
}
```

**Các page theo pattern này:**
| Page | Component chính | Size |
|:---|:---|:---|
| `ReceptionPage.tsx` | `reception/SampleReception` | 220B |
| `AnalysesPage.tsx` | `analyses/AnalysesList` | 150B |
| `AssignmentPage.tsx` | `assignment/AssignmentView` | 223B |
| `HandoverPage.tsx` | `handover/HandoverView` | 227B |
| `IdentityPage.tsx` | `identity/IdentityList` | 229B |
| `InventoryPage.tsx` | `inventory/InventoryList` | 229B |
| `LabManagerPage.tsx` | `lab-manager/LabManagerView` | 235B |
| `StoredSamplesPage.tsx` | `samples/SamplesTable` | 217B |
| `TechnicianPage.tsx` | `technician/TechnicianView` | 234B |
| `DocumentPage.tsx` | `document/DocumentView` | 215B |

### 3.2 `LoginPage.tsx` — Trang đăng nhập (5KB)

**Đặc biệt:** Đây là page DUY NHẤT có logic trực tiếp (login flow).

**Chức năng:**

- Form đăng nhập (email + password)
- Validation input
- Gọi `apis.auth.login()`
- Lưu token vào cookies
- Lưu user info vào cookies
- Redirect về Dashboard sau khi thành công
- Error handling với toast

**Flow:**

```
User nhập email/password
  → Submit form
  → POST /v2/auth/login
  → Success: lưu cookies (auth_token, user_id, user_name, user_roles)
  → Redirect to "/"
  → Fail: toast.error(message)
```

### 3.3 `DashboardPage.tsx` — Dashboard (417B)

Trang chủ sau khi đăng nhập. Hiển thị tổng quan hệ thống.

### 3.4 `crm/CRMPage.tsx` — CRM Container (3.5KB)

**Vai trò:** Quản lý layout CRM với 3 tabs.

**Tabs:**
| Tab | Component | Chức năng |
|:---|:---|:---|
| Clients | `ClientsTab` | CRUD khách hàng, search, filter |
| Orders | `OrdersTab` | CRUD đơn hàng, tính toán tài chính |
| Quotes | `QuotesTab` | CRUD báo giá, tạo đơn từ báo giá |

Mỗi tab là một component đầy đủ (20–34KB) với:

- Bảng dữ liệu (phân trang, sort, filter)
- Modal Create/Edit
- Modal Delete
- Inline editing cho một số fields

### 3.5 `library/` — Master Data Pages

Tất cả đều là thin pages render component tương ứng từ `components/library/`.

---

## IV. ROUTING

Pages được map với routes trong `App.tsx` (hoặc router config):

```
/               → DashboardPage
/login          → LoginPage
/reception      → ReceptionPage
/analyses       → AnalysesPage
/assignment     → AssignmentPage
/handover       → HandoverPage
/identity       → IdentityPage
/inventory      → InventoryPage
/lab-manager    → LabManagerPage
/stored-samples → StoredSamplesPage
/technician     → TechnicianPage
/documents      → DocumentPage
/crm/*          → CRMPage (tabs)
/library/*      → Library pages
```

---

## V. QUY TẮC KHI THÊM PAGE MỚI

1. **Thin Page pattern:** Page file CHỈ import + render component. Logic ở trong `src/components/`.
2. **Đặt tên:** `<Feature>Page.tsx` (PascalCase).
3. **Default export:** Dùng `export default function` cho lazy loading support.
4. **Route:** Thêm route tương ứng trong `App.tsx`.
5. **Navigation:** Thêm NavItem vào `config/navigation.ts`.
6. **i18n:** Thêm title key trong `sidebar.*` namespace.
7. **CRM/Library sub-pages:** Đặt trong thư mục con tương ứng.

---

## VI. LƯU Ý

- **LoginPage** là ngoại lệ duy nhất chứa logic trực tiếp (auth flow).
- **CRM tabs** (`ClientsTab`, `OrdersTab`, `QuotesTab`) là các component lớn (20–34KB) — cân nhắc tách thêm component con nếu cần mở rộng.
- Một số pages đang là placeholder (chỉ có component name, chưa có component thực).
