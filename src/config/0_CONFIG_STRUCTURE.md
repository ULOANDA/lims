# Config Layer Documentation (`src/config/`)

**Version:** 1.0.0 | **Cập nhật:** 25/02/2026

---

## I. TỔNG QUAN

Thư mục `src/config/` chứa toàn bộ cấu hình ứng dụng: hằng số, menu điều hướng, query keys, i18n, và theme. Đây là "bộ não" định nghĩa hành vi và giao diện của toàn hệ thống.

---

## II. CẤU TRÚC THƯ MỤC

```
src/config/
├── constants.ts              # Hằng số toàn cục (pagination, upload, date, money)
├── navigation.ts             # Cấu hình menu Sidebar
├── query-keys.ts             # Query Key Factory tập trung cho React Query
│
├── i18n/                     # Hệ thống đa ngôn ngữ
│   ├── LANGUAGE_SYSTEM.md    # Tài liệu quy chuẩn i18n
│   ├── index.ts              # i18next init config
│   └── locales/
│       ├── vi.ts             # Tiếng Việt (ngôn ngữ mặc định)
│       └── en.ts             # Tiếng Anh
│
└── theme/                    # Hệ thống Theme
    ├── THEME_SYSTEM.md       # Tài liệu quy chuẩn theme/color tokens
    ├── theme.config.ts       # Cấu hình màu sắc, CSS variables
    ├── ThemeContext.tsx       # React Context cho Dark/Light mode
    └── index.ts              # Re-export
```

---

## III. CHI TIẾT TỪNG FILE

### 3.1 `constants.ts` — Hằng số toàn cục

**Pagination:**

```typescript
PAGINATION_SIZE = [20, 50, 100, 200] as const;
DEFAULT_PAGINATION_SIZE = 20;
```

**Upload Limits:**

```typescript
MAX_UPLOAD = 10 * 1024 * 1024; // 10MB
ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
ACCEPTED_DOCUMENT_TYPES = ["application/pdf", "...xlsx", "...xls"];
```

**Date Formats (`date-fns` patterns):**

```typescript
DATE_FORMAT = {
    short: "dd/MM/yyyy", // Hiển thị ngày
    full: "dd/MM/yyyy HH:mm", // Hiển thị ngày + giờ
    api: "yyyy-MM-dd", // Format gửi lên API
};
```

**React Query Stale Times:**

```typescript
STALE_TIMES = {
    ZERO: 0, // Operational Data (luôn fetch mới)
    SHORT: 30_000, // Dashboard (30s)
    MEDIUM: 300_000, // Master Data (5 phút)
    LONG: 3_600_000, // Settings (1 giờ)
    INFINITY: Infinity, // Profile, Enumerations
};
```

**Number & Currency:**

```typescript
NUMBER_FORMAT_OPTIONS = {
    currency: { style: "currency", currency: "VND", maximumFractionDigits: 0 },
    float: { maximumFractionDigits: 2 },
    integer: { maximumFractionDigits: 0 },
};
DEFAULT_TAX_RATE = 0.08; // 8% VAT
```

### 3.2 `navigation.ts` — Menu Sidebar

Định nghĩa `NavItem[]` cho menu điều hướng chính:

```typescript
type NavItem = {
    title: string; // i18n key (VD: "sidebar.dashboard")
    href: string; // Route path
    icon?: LucideIcon; // Icon component từ lucide-react
    children?: NavItem[];
    permissions?: string[]; // RBAC roles cần thiết
};
```

**Menu hiện tại:**
| Mục | Route | Icon | Children |
|:---|:---|:---|:---|
| Dashboard | `/` | `LayoutDashboard` | — |
| Orders | `/orders` | `FileText` | Management, Create |
| Samples | `/samples` | `FlaskConical` | Reception, Analysis, Results |
| Clients | `/clients` | `Users` | — |
| Inventory | `/inventory` | `Package` | — |
| Accounting | `/accounting` | `Wallet` | — |
| Settings | `/settings` | `Settings` | Matrices, Parameters, Users |

**Lưu ý:** `title` dùng **i18n key**, KHÔNG hardcode text.

### 3.3 `query-keys.ts` — Query Key Factory

Quản lý tập trung query keys cho `@tanstack/react-query`:

```typescript
export const QUERY_KEYS = {
    identity:  { all, profile(), sessions() },
    clients:   { all, lists(), list(filters), details(), detail(id) },
    orders:    { all, lists(), list(filters), details(), detail(id), print(id) },
    quotes:    { all, lists(), list(filters), details(), detail(id) },
    library: {
        all,
        matrices:   { all, list() },
        sampleTypes: { all, list() },
        parameters: { all, list(filters?) },
        methods:    { all, list() },
    },
    reception: {
        all,
        receipts: { all, list(filters), detail(id) },
    },
    samples:   { all, lists(), list(filters), details(), detail(id), tracking(id) },
};
```

**Quy tắc:**

- Hierarchy: `entity → action → params`
- Spread pattern: `[...entity.all, "action", ...params]`
- Hỗ trợ `invalidateQueries` ở bất kỳ cấp nào (invalidate `entity.all` sẽ clear tất cả queries của entity đó)

### 3.4 `i18n/` — Đa ngôn ngữ

**Cấu hình (`index.ts`):**

- Sử dụng `i18next` + `react-i18next`
- Ngôn ngữ mặc định: `vi`
- Ngôn ngữ hỗ trợ: `vi`, `en`
- Lưu preference: `localStorage` key `i18nextLng`

**Cấu trúc key:**

```
Module → SubModule/Entity → Field
VD: reception.createReceipt.samplesList
    lab.analyses.analysisStatus
    common.save
    crm.clients.clientName
```

**Quy tắc:**

- KHÔNG hardcode text trong JSX
- Dùng `t("namespace.key")` hoặc `t("namespace.key", { defaultValue: "Fallback" })`
- Keys dùng **camelCase**
- Chi tiết: xem `i18n/LANGUAGE_SYSTEM.md`

### 3.5 `theme/` — Hệ thống Theme

**ThemeContext.tsx:**

- Quản lý Dark/Light mode qua React Context
- Persist preference trong `localStorage`

**theme.config.ts:**

- Định nghĩa CSS custom properties cho semantic color tokens
- Tích hợp với Tailwind CSS v4

**Semantic Tokens cốt lõi:**
| Token | Light | Dùng cho |
|:---|:---|:---|
| `--background` | `#fff` | Nền trang |
| `--foreground` | `#0a0a0a` | Text chính |
| `--card` | `#fff` | Nền card |
| `--muted` | `#f5f5f5` | Nền phụ/mờ |
| `--primary` | Brand blue | Nút chính, link |
| `--destructive` | Red | Xóa, lỗi |
| `--success` | Green | Thành công |
| `--warning` | Yellow | Cảnh báo |

**Quy tắc:**

- **CẤM** dùng `bg-white`, `bg-black`, `text-[#hex]`
- **BẮT BUỘC** dùng `bg-background`, `text-foreground`, `border-border`...
- Chi tiết: xem `theme/THEME_SYSTEM.md`

---

## IV. QUY TẮC KHI SỬA/THÊM CONFIG

1. **Hằng số** → thêm vào `constants.ts`, KHÔNG hardcode trong component.
2. **Menu mới** → thêm vào `navigation.ts`, title dùng i18n key.
3. **Query key mới** → thêm vào `query-keys.ts`, tuân thủ hierarchy pattern.
4. **Text mới** → thêm key vào cả `locales/vi.ts` và `locales/en.ts`.
5. **Màu sắc mới** → thêm vào `theme.config.ts` như CSS variable, rồi dùng class Tailwind tương ứng.
