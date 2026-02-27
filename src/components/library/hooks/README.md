# Hooks (`library/hooks`)

## Tổng quan

Custom hooks dùng chung trong toàn bộ module Library.

## Danh sách

### `useDebouncedValue.ts`

Trả về giá trị đã debounce sau khoảng delay (mặc định ms). Dùng cho ô tìm kiếm để tránh gọi API liên tục.

```tsx
const debouncedSearch = useDebouncedValue(searchTerm, 300);
```

### `useServerPagination.ts`

Quản lý trạng thái phân trang từ server: `currentPage`, `itemsPerPage`, `handlePageChange`, `handleItemsPerPageChange`, `resetPage`.

```tsx
const pagination = useServerPagination(serverTotalPages, 20);
```

**Tham số:**

- `serverTotalPages: number | null` – Tổng số trang từ API
- `defaultItemsPerPage: number` – Số item mặc định mỗi trang

### `useLibraryData.ts`

Định nghĩa types mở rộng và hooks hỗ trợ cho dữ liệu thư viện:

- `ParameterWithMatrices` – Type mở rộng Parameter kèm danh sách matrices
- Các helper functions transform dữ liệu
