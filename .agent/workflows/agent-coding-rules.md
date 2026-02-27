---
description: Quy chuẩn viết code, cấu trúc logic, và quy tắc cho AI agent trên dự án LIMS-DEV
---

# QUY CHUẨN AGENT — LIMS-DEV PROJECT

> Tài liệu này là **nguồn sự thật duy nhất** (single source of truth) cho AI agent khi viết code, sửa code, hoặc tạo module mới trong dự án LIMS-DEV.
> Được tổng hợp từ tất cả source code trong `BLACK/`, `DOCUMENTATION/FLOWS/`, và `DOCUMENTATION/OTHER DOCS/`.

---

## I. KIẾN TRÚC TỔNG QUAN

### 1. Nền tảng Runtime

- **Runtime**: Node-RED (Function Nodes chạy JavaScript async).
- **Database**: PostgreSQL (nhiều schema: `lab`, `crm`, `library`, `identity`, `doc`, `qa`, `logistics`).
- **Cache**: Valkey (Redis-compatible) — lưu session, entity data.
- **Storage**: S3-compatible (qua `4_Storage.js`).
- **UI**: Static HTML files phục vụ qua `BLACK/server.js` (port 2000).
- **API Domain**: `https://red.irdop.org` (Node-RED HTTP endpoints).

### 2. Cấu trúc Thư mục

```
BLACK/
├── MAIN SERVICE/           # Core infrastructure (PHẢI LOAD TRƯỚC)
│   ├── 0_constant.js       # Policies, Roles, Permissions definition
│   ├── 1_cError.js         # Custom Error class
│   ├── 1_destr.js          # JSON parser helper
│   ├── 1_helper.js         # RANDOM_SAFE, GET_ROLE, RESOLVE_POLICIES, RESOLVE_PERMISSIONS
│   ├── 2_DB.js             # Database connection
│   ├── 3_valKey cache.js   # Valkey cache client
│   ├── 3_policy.json       # Policy definitions (JSON)
│   ├── 4_Entity.js         # ⭐ Core Entity class (Auth, Permissions, Filtering)
│   ├── 4_Storage.js        # S3 file storage
│   ├── 5_CheckDBQueue.js   # DB queue checker
│   ├── 6_apiRouter.js      # Generic API router (CLASS_MAP routing)
│   ├── 9_auth_api_handler.js  # Auth-specific handler
│   └── TEST AUTH handler.js   # Auth test runner
│
├── <MODULE>/               # Mỗi module (LAB, CRM, LIBRARY, DOC, IDENTITY, LOGISTICS, QA)
│   ├── 0_*_api_handler.js  # API Handlers (routing layer)
│   ├── 1_*Entities.js      # Base Entity class (LabEntity, CrmEntity, LibraryEntity...)
│   ├── 2_*.js              # Specific entity classes (Receipt, Sample, Order...)
│   └── TEST_*.js           # Test runner
│
├── UI/                     # Static HTML UI files
└── server.js               # Static file server (port 2000)
```

### 3. Naming Convention cho Files

| Prefix    | Ý nghĩa                          | Ví dụ                                     |
| --------- | -------------------------------- | ----------------------------------------- |
| `0_`      | API Handler (routing layer)      | `0_receipt_api_handler.js`                |
| `1_`      | Base Entity class (shared logic) | `1_labEntities.js`                        |
| `2_`      | Specific Entity class            | `2_Receipt.js`, `2_orders.js`             |
| `3_`      | Middleware/Config                | `3_policy.json`                           |
| `4_`      | Core Service                     | `4_Entity.js`, `4_Storage.js`             |
| `5_`-`9_` | Utility/Special handlers         | `6_apiRouter.js`, `9_auth_api_handler.js` |
| `TEST_`   | Test runner                      | `TEST_LAB.js`, `TEST_CRM.js`              |

### 4. Thứ tự Load (QUAN TRỌNG)

Các file PHẢI được load theo thứ tự số trong Node-RED:

```
0_constant → 1_cError → 1_helper → 2_DB → 3_valKey → 4_Entity → 4_Storage
→ Sau đó: 1_*Entities.js (base) → 2_*.js (specific) → 0_*_api_handler.js
```

---

## II. QUY TẮC GLOBAL CONTEXT

### 1. Cách Access Shared Services

```javascript
// LUÔN LUÔN bắt đầu file bằng:
const mainService = global.get("mainService.js") || {};
const { db, Valkey, cError, Entity } = mainService;

// Load module entities:
const { Receipt, Sample, Analysis } = global.get("labEntities.js") || {};
const { Client, Order, Quote } = global.get("crmEntities.js") || {};
const { Matrix, Parameter } = global.get("libraryEntities.js") || {};
const { Document, File } = global.get("documentEntities.js") || {};
const { Identity } = global.get("identityEntities.js") || {};
const { Shipment } = global.get("logisticsEntities.js") || {};
```

### 2. Cách Export

```javascript
// Base entity files export qua global:
global.set("labEntities.js", {
    LabEntity,
    Receipt,
    Sample,
    Analysis,
    Equipment,
    InventoryItem,
    Solution,
    Report,
});

// Main service components:
mainService.Entity = Entity;
global.set("mainService.js", mainService);
```

### 3. Node Status

```javascript
// Mỗi file PHẢI set node status khi load:
node.status({ fill: "blue", shape: "ring", text: "Loading Lab Entities..." });
// ... code ...
node.status({ fill: "green", shape: "dot", text: "Lab Entities Ready" });
```

---

## III. ENTITY CLASS PATTERN (CỐT LÕI)

### 1. Cấu trúc Base Entity

Mỗi module có **1 Base Entity class** (LabEntity, CrmEntity, LibraryEntity...) chứa logic chung.

```javascript
class LabEntity {
    constructor({ data, entity }) {
        if (!data) throw new cError(400, "Data is required");
        this.entity = entity;        // Entity context (user permissions)
        Object.assign(this, data);   // Spread data fields
    }

    // ===== ABSTRACT (PHẢI override) =====
    static get pKey() { throw new Error("pKey must be overridden"); }
    static get tableName() { throw new Error("tableName must be overridden"); }

    // ===== SYSTEM =====
    static get quotedTable() { /* schema."tableName" */ }
    static get cachePrefix() { /* return "SCHEMA_TABLE_" */ }

    // ===== CORE METHODS =====
    static async getById({ id, authToken }) { ... }
    static async getList({ authToken, page, itemsPerPage, searchTerm, sortColumn, sortDirection, filter, otherFilters, option }) { ... }
    static async create({ data, authToken, client, syncCache }) { ... }
    async update({ data, client, syncCache }) { ... }
    async delete({ client, syncCache }) { ... }

    // ===== FILTERING =====
    static filterData({ instance, entity }) {
        if (!instance || !entity) return instance;
        return entity.filterDataResponse(instance);
    }

    // ===== AUDIT =====
    static async attachAuditIdentity({ row, entity }) { ... }
}
```

### 2. Specific Entity (Override)

```javascript
class Receipt extends LabEntity {
    static get pKey() {
        return "receiptId";
    }
    static get tableName() {
        return "lab.receipt";
    }
    // Override methods as needed (getFullById, create, etc.)
}

class Sample extends LabEntity {
    static get pKey() {
        return "sampleId";
    }
    static get tableName() {
        return "lab.sample";
    }
}
```

### 3. Quy tắc CRUD trong Entity

#### getById Pattern:

```javascript
static async getById({ id, authToken, client }) {
    // 1. Auth & Permission
    const entity = await Entity.getEntity({ authToken });
    entity.checkPermit({ sourceTable: this.tableName, action: "READ", isThrow: true });

    // 2. Check cache first
    const cacheKey = `${this.cachePrefix}${id}`;
    const cached = await Valkey.get(cacheKey);
    if (cached) return new this({ data: destr(cached), entity });

    // 3. Query DB
    const { rows } = await db.query(`SELECT * FROM ${this.quotedTable} WHERE "${this.pKey}" = $1`, [id]);
    if (!rows[0]) return null;

    // 4. Attach audit identity
    await this.attachAuditIdentity({ row: rows[0], entity });

    // 5. Cache result
    await Valkey.set(cacheKey, JSON.stringify(rows[0]), 600);

    // 6. Filter & return
    const instance = new this({ data: rows[0], entity });
    return this.filterData({ instance, entity });
}
```

#### getList Pattern:

```javascript
static async getList({ authToken, page = 1, itemsPerPage = 20, searchTerm, sortColumn = "createdAt", sortDirection = "DESC", ... }) {
    // 1. Auth & Permission
    const entity = await Entity.getEntity({ authToken });
    entity.checkPermit({ sourceTable: this.tableName, action: "READ", isThrow: true });

    // 2. Build SQL (COUNT first, then SELECT with LIMIT/OFFSET)
    // 3. Fetch IDs → then getById for each (leverages cache)
    // 4. Return { data: [...], pagination: { page, totalPages, total, itemsPerPage } }
}
```

#### create Pattern:

```javascript
static async create({ data, authToken, client, syncCache = true }) {
    // 1. Auth & Permission
    const entity = await Entity.getEntity({ authToken });
    entity.checkPermit({ sourceTable: this.tableName, action: "WRITE", isThrow: true });

    // 2. Generate ID
    data[this.pKey] = data[this.pKey] || `PREFIX_${RANDOM_SAFE_CAPS(7)}`;

    // 3. Add audit fields
    data.createdAt = new Date();
    data.createdById = entity.identityId;

    // 4. INSERT INTO
    // 5. Cache & return new instance
}
```

#### update Pattern:

```javascript
async update({ data, client, syncCache = true }) {
    // 1. Ownership validation (for LIMIT permissions)
    this.entity.validateOwnershipOrThrow({
        data: this,
        sourceTable: EntityClass.tableName,
        action: "WRITE",
    });

    // 2. Add audit
    data.modifiedAt = new Date();
    data.modifiedById = this.entity.identityId;

    // 3. UPDATE SET ... WHERE pKey = $1
    // 4. Invalidate cache
}
```

#### delete Pattern (SOFT DELETE):

```javascript
async delete({ client = null, syncCache = true } = {}) {
    // 1. Ownership validation
    this.entity.validateOwnershipOrThrow({
        data: this,
        sourceTable: EntityClass.tableName,
        action: "DELETE",
    });

    // 2. UPDATE SET "deletedAt" = NOW() WHERE pKey = $1
    // 3. Invalidate cache
}
```

---

## IV. API HANDLER PATTERN (0\_\*\_api_handler.js)

### 1. Template Chuẩn

**MỌI API handler PHẢI tuân theo cấu trúc này:**

```javascript
// 0_example_api_handler.js
// API HANDLER FOR <RESOURCE_NAME> (<MODULE> MODULE)
// Route: /v2/<resource>/:action/:option?
// Methods: GET, POST
// STRICT COMPLIANCE WITH DOCUMENTATION/API_RULE.md

try {
    const mainService = global.get("mainService.js");
    const { cError } = mainService;
    const { TargetEntity } = global.get("<moduleEntities>.js");
    const TargetClass = TargetEntity;
    const RESOURCE_NAME = "TargetEntity";

    // 1. Parse Params
    const params = msg.req.params || {};
    const action = params.action ? params.action.toLowerCase() : "";
    const option = params.optional ? params.optional.toLowerCase() : "";
    const method = msg.req.method;
    const body = msg.req.body || {};
    const query = msg.req.query || {};

    // 2. Auth Token
    const authHeader = msg.req.headers["authorization"] || "";
    const authToken = authHeader.startsWith("Bearer ") ? authHeader.split(" ")[1] : authHeader || msg.req.cookies["sid"];

    // 3. Routing Logic
    let result;
    const pKey = TargetClass.pKey || "id";

    /* --- ACTION: GET (Method: GET) --- */
    if (action === "get" && method === "GET") {
        if (option === "list") {
            result = await TargetClass.getList({ ...query, authToken });
        } else if (option === "detail") {
            const id = query[pKey] || query.id;
            if (!id) throw new cError(400, `Missing ${pKey} in query params`);
            result = await TargetClass.getById({ id, authToken });
            if (!result) throw new cError(404, `${RESOURCE_NAME} not found`);
        } else if (option === "full") {
            const id = query[pKey] || query.id;
            if (!id) throw new cError(400, `Missing ${pKey} in query params`);
            result = await TargetClass.getFullById({ id, authToken });
            if (!result) throw new cError(404, `${RESOURCE_NAME} not found`);
        } else {
            throw new cError(400, `Invalid GET option '${option}'.`);
        }

        /* --- ACTION: CREATE (Method: POST) --- */
    } else if (action === "create" && method === "POST") {
        result = await TargetClass.create({ data: body, authToken });

        /* --- ACTION: UPDATE (Method: POST) --- */
    } else if (action === "update" && method === "POST") {
        const id = body[pKey] || body.id;
        if (!id) throw new cError(400, `Missing ${pKey} in body`);
        const instance = await TargetClass.getById({ id, authToken });
        if (!instance) throw new cError(404, `${RESOURCE_NAME} not found`);
        result = await instance.update({ data: body });

        /* --- ACTION: DELETE (Method: POST) --- */
    } else if (action === "delete" && method === "POST") {
        const id = body[pKey] || body.id;
        if (!id) throw new cError(400, `Missing ${pKey} in body`);
        const instance = await TargetClass.getById({ id, authToken });
        if (!instance) throw new cError(404, `${RESOURCE_NAME} not found`);
        await instance.delete({});
        result = { success: true, id, status: "Deleted" };
    } else {
        throw new cError(400, `Invalid Action '${action}' or Method '${method}'`);
    }

    msg.payload = result;
    msg.statusCode = 200;
} catch (err) {
    const status = err.statusCode || err.status || 500;
    const message = err.message || "Internal Server Error";
    node.error(`[API ${RESOURCE_NAME}] Error: ${message}`);
    msg.payload = { error: message, code: err.code || status };
    msg.statusCode = status;
}
return msg;
```

### 2. Quy tắc API Handler

| #   | Quy tắc                          | Mô tả                                                          |
| --- | -------------------------------- | -------------------------------------------------------------- |
| 1   | **try/catch toàn bộ**            | Wrap MỌI THỨ trong try/catch, KHÔNG có await nào ngoài try     |
| 2   | **Synchronous routing**          | Dùng if/else if, KHÔNG dùng switch hay async routing framework |
| 3   | **Token parsing chuẩn**          | Luôn check `Bearer ` prefix → split → fallback cookie `sid`    |
| 4   | **Error format nhất quán**       | `{ error: message, code: statusCode }`                         |
| 5   | **Chỉ GET và POST**              | GET cho đọc, POST cho create/update/delete                     |
| 6   | **msg.payload = result**         | Node-RED convention: payload IS the response body              |
| 7   | **msg.statusCode = 200/4xx/5xx** | Set HTTP status code                                           |
| 8   | **return msg**                   | Cuối cùng LUÔN return msg                                      |

---

## V. QUY TẮC API URL (THEO API_RULE.md)

### 1. Cấu trúc URL

```
/v2/<resource>/:action/:option
```

### 2. Ma trận Hành động

| Method   | URL Pattern                           | Mô tả                       |
| -------- | ------------------------------------- | --------------------------- |
| **GET**  | `/v2/:resource/get/list`              | Danh sách phân trang        |
| **GET**  | `/v2/:resource/get/detail?<pKey>=...` | Chi tiết 1 bản ghi (flat)   |
| **GET**  | `/v2/:resource/get/full?<pKey>=...`   | Chi tiết + nested relations |
| **POST** | `/v2/:resource/create`                | Tạo mới                     |
| **POST** | `/v2/:resource/create/bulk`           | Tạo hàng loạt               |
| **POST** | `/v2/:resource/create/full`           | Tạo transactional (Cha+Con) |
| **POST** | `/v2/:resource/update`                | Cập nhật                    |
| **POST** | `/v2/:resource/delete`                | Xóa mềm                     |

### 3. Auth Endpoints (RIÊNG)

Auth KHÔNG tuân theo cấu trúc resource chuẩn:

| Method   | URL               | Mô tả                                |
| -------- | ----------------- | ------------------------------------ |
| **POST** | `/v2/auth/login`  | Đăng nhập → `{ token, identity }`    |
| **GET**  | `/v2/auth/verify` | Verify token → `{ valid, identity }` |
| **POST** | `/v2/auth/logout` | Đăng xuất                            |

### 4. Standard Query Params (GET /get/list)

| Param                   | Type   | Default     | Mô tả            |
| ----------------------- | ------ | ----------- | ---------------- |
| `page`                  | number | 1           | Trang hiện tại   |
| `itemsPerPage`          | number | 10-20       | Số dòng/trang    |
| `sortColumn`            | string | `createdAt` | Cột sort         |
| `sortDirection`         | string | `DESC`      | ASC/DESC         |
| `search` / `searchTerm` | string | null        | Từ khóa tìm kiếm |

### 5. Response Format

```javascript
// SUCCESS (list):
{
    data: [...],
    pagination: { page, totalPages, total, itemsPerPage }
}

// SUCCESS (detail):
{ ...entityFields }

// ERROR:
{
    error: "Error message",
    code: 400 | 401 | 403 | 404 | 500
}
```

---

## VI. NAMING CONVENTIONS

### 1. URL Resource Names

| Quy tắc                    | Ví dụ                             |
| -------------------------- | --------------------------------- |
| kebab-case, số nhiều       | `sample-types`, `inventory-items` |
| Ngoại lệ: resource đã quen | `equipment` (không đếm được)      |

### 2. Database / Code Names

| Quy tắc                              | Ví dụ                                 |
| ------------------------------------ | ------------------------------------- |
| camelCase cho columns                | `createdAt`, `sampleId`, `clientName` |
| schema.tableName cho table reference | `lab.receipt`, `crm.orders`           |
| PascalCase cho Class                 | `LabEntity`, `Receipt`, `CrmEntity`   |

### 3. ID Generation

```javascript
// Pattern: PREFIX_RANDOM
const id = `REC_${RANDOM_SAFE_CAPS(7)}`; // REC_AB3F7KM
const id = `SAM_${RANDOM_SAFE_CAPS(7)}`; // SAM_XY9P2RT
const id = `SS_${RANDOM_SAFE(32)}`; // Session IDs
```

### 4. Policy & Role Naming

```javascript
// Roles: ROLE_<UPPERCASE>
("ROLE_SUPER_ADMIN", "ROLE_TECHNICIAN", "ROLE_SALES_EXEC");

// Policies: POL_<UPPERCASE>
("POL_CRM_VIEW_BASIC", "POL_TEST_EXECUTE", "POL_SYS_CONFIG");
```

---

## VII. HỆ THỐNG PHÂN QUYỀN (SECURITY)

### 1. 3 Lớp Bảo Vệ (Defense in Depth)

| Layer       | Method                              | Khi nào            | Mục đích                              |
| ----------- | ----------------------------------- | ------------------ | ------------------------------------- |
| **Layer 1** | `entity.checkPermit()`              | Đầu mỗi operation  | Gate check - có quyền không?          |
| **Layer 2** | `entity.validateOwnershipOrThrow()` | Trước WRITE/DELETE | Ownership check cho LIMIT permissions |
| **Layer 3** | `entity.filterDataResponse()`       | Trước return data  | Column-level & row-level data masking |

### 2. Decimal Permission System

```
Full Access:  READ=1, WRITE=3, FULL=7
LIMIT Access: READ=0.5, WRITE=2.5, FULL=6.5

Kiểm tra: colMask % 1 !== 0 → là LIMIT → check ownership
```

### 3. Ownership Columns

```javascript
const OWNER_COLS = ["technicianId", "salePersonId", "createdById", "modifiedById"];
const OWNER_ARRAY_COLS = ["technicianIds"];
```

### 4. Auth Token Flow

```
Client → Bearer Token/Cookie → API Handler → Entity.getEntity({ authToken })
    → Check Valkey cache → nếu miss → Query DB (sessions + identities)
    → Resolve Policies → Calculate Permissions (with decimal masking)
    → Return Entity instance
```

---

## VIII. TEST RUNNER PATTERN (TEST\_\*.js)

### 1. Template Chuẩn

```javascript
// API Test Runner for <MODULE> Module
// Returns formatted text output for documentation
// Covers: getList, getById, create, update, delete

try {
    const mainService = global.get("mainService.js") || {};
    const { cError, db, Entity } = mainService;
    const { TargetEntity } = global.get("<module>Entities.js") || {};

    // Admin credentials for testing
    const ADMIN_CREDENTIALS = {
        email: "admin@lims.com",
        password: "password123",
    };

    let output = [];

    function addSection(title, data) {
        output.push(`\n${"=".repeat(80)}`);
        output.push(`${title}`);
        output.push(`${"=".repeat(80)}\n`);
        output.push(JSON.stringify(data, null, 2));
        output.push("\n");
        node.warn(`[TEST] ${title} completed.`);
    }

    // Schema fallback helper
    async function getTableSchema(tableName) { ... }

    output.push("<MODULE> MODULE - API RESPONSE DOCUMENTATION");
    output.push("Generated at: " + new Date().toISOString() + "\n");

    // 1. LOGIN
    const loginRes = await Entity.login({ ... });
    const authToken = loginRes.token;
    addSection("LOGIN SUCCESS", { token: authToken, identity: loginRes.identity });

    // 2. GET LIST
    const listRes = await TargetEntity.getList({ authToken, page: 1, itemsPerPage: 5 });
    addSection("GET LIST", listRes);

    // 3. GET BY ID (from list data)
    if (listRes.data && listRes.data.length > 0) {
        const firstId = listRes.data[0][TargetEntity.pKey];
        const detail = await TargetEntity.getById({ id: firstId, authToken });
        addSection("GET BY ID", detail);
    }

    // 4. Additional tests (search, permissions, etc.)
    ...

    // OUTPUT
    msg.payload = output.join("\n");
} catch (e) {
    msg.payload = `[TEST FAILED] ${e.message}\n${e.stack}`;
    node.error(e.message);
}
return msg;
```

### 2. Quy tắc cho Auth Test Runner

Auth test runner hiển thị cả **REQUEST** và **RESPONSE**:

```javascript
function addTestCase(title, request, response) {
    output.push(`\n${"=".repeat(80)}`);
    output.push(`${title}`);
    output.push(`${"=".repeat(80)}\n`);
    output.push("REQUEST:");
    output.push(JSON.stringify(request, null, 2));
    output.push("\nRESPONSE:");
    output.push(JSON.stringify(response, null, 2));
}
```

---

## IX. ERROR HANDLING (cError)

### 1. Cách sử dụng cError

```javascript
// Cú pháp: new cError(statusCode, message)
throw new cError(400, "Email and password required");
throw new cError(401, "Invalid credentials");
throw new cError(403, "Permission denied");
throw new cError(404, "Record not found");
throw new cError(500, "Internal server error");
```

### 2. Error Codes chuẩn

| Code | Ý nghĩa        | Khi nào dùng                     |
| ---- | -------------- | -------------------------------- |
| 400  | Bad Request    | Thiếu params, validation fail    |
| 401  | Unauthorized   | Token invalid/expired/missing    |
| 403  | Forbidden      | Không có quyền truy cập resource |
| 404  | Not Found      | Record không tồn tại             |
| 500  | Internal Error | Lỗi hệ thống, DB error           |

### 3. Error Response Format

```javascript
// Trong API handler catch block:
catch (err) {
    const status = err.statusCode || err.status || 500;
    const message = err.message || "Internal Server Error";
    node.error(`[API ${RESOURCE_NAME}] Error: ${message}`);
    msg.payload = { error: message, code: err.code || status };
    msg.statusCode = status;
}
```

---

## X. CACHE STRATEGY

### 1. Cache Keys

```javascript
// Pattern: SCHEMA_TABLE_<id>
const cacheKey = `LAB_RECEIPT_${receiptId}`;
const cacheKey = `CRM_ORDER_${orderId}`;
const cacheKey = `LIB_MATRIX_${matrixId}`;
```

### 2. Cache TTL

```javascript
// Entity data: 600s (10 phút)
await Valkey.set(cacheKey, JSON.stringify(data), 600);

// Session: 7 ngày (604800s)
await Valkey.set(`SESSION_${sessionId}`, JSON.stringify(sessionData), 604800);
```

### 3. Cache Invalidation

```javascript
// Trong update() và delete():
await Valkey.del(cacheKey);
```

---

## XI. DATABASE CONVENTIONS

### 1. SQL Query Pattern

```javascript
// LUÔN dùng parameterized queries
const { rows } = await db.query(`SELECT * FROM ${this.quotedTable} WHERE "${this.pKey}" = $1`, [id]);

// KHÔNG BAO GIỜ string concatenation
// ❌ `SELECT * FROM ${table} WHERE id = '${id}'`
```

### 2. Audit Fields

Mỗi table PHẢI có:

- `createdAt` (timestamp)
- `createdById` (varchar → FK identity.identities)
- `modifiedAt` (timestamp, nullable)
- `modifiedById` (varchar, nullable)
- `deletedAt` (timestamp, nullable — soft delete marker)

### 3. Soft Delete

```javascript
// KHÔNG xóa vật lý. Set deletedAt:
UPDATE ${this.quotedTable} SET "deletedAt" = NOW() WHERE "${this.pKey}" = $1
```

---

## XII. UI CONVENTIONS

### 1. Static HTML Pattern

- File: `BLACK/UI/<Page Name>.html`
- Single-file: HTML + CSS + JS trong 1 file
- Dark theme mặc định (CSS variables)
- Font: Inter (Google Fonts)
- API calls qua fetch() với Bearer token

### 2. Auth Flow trong UI

```javascript
const API_DOMAIN = "https://red.irdop.org";
const API_BASE = `${API_DOMAIN}/v2/<resource>`;      // Resource API
const API_AUTH = `${API_DOMAIN}/v2/auth`;              // Auth API (RIÊNG)

// Token lưu trong cookie:
setCookie("authToken", token, 7);  // 7 days

// Mỗi API call gửi Authorization header:
headers: { "Authorization": `Bearer ${getAuthToken()}` }

// Auto logout khi 401:
if (response.status === 401) { logout(); }
```

---

## XIII. DOCUMENTATION CONVENTIONS

### 1. Cấu trúc Documentation

```
DOCUMENTATION/
├── FLOWS/
│   ├── <MODULE>_FLOW.md               # Luồng hoạt động (business logic)
│   └── <MODULE>_API_DOCUMENTATION.md  # API documentation (endpoints + examples)
├── OTHER DOCS/
│   ├── API_RULE.md                    # Quy tắc API chung
│   ├── FLOW_ARCHITECTURE.md           # Kiến trúc hệ thống
│   ├── IDENTITY_AND_POLICY_SYSTEM.md  # Hệ thống phân quyền
│   ├── DATABASE.md                    # Schema database
│   ├── DANH SÁCH VỊ TRÍ.md           # Roles definition
│   └── MA TRẬN PHÂN QUYỀN.md         # Permission matrix
└── TEMPLATE DATA/
    └── api_test_*.txt                 # Test output logs
```

### 2. Tạo API Documentation

Khi tạo `<MODULE>_API_DOCUMENTATION.md`, PHẢI bao gồm:

1. **Overview** — Tổng quan module
2. **Authentication** — Cách auth (Bearer token / Cookie)
3. **Endpoints** — Mỗi endpoint có:
    - URL, Method
    - Request params/body (JSON example)
    - Response body (JSON example)
    - Error responses
4. **Data Models** — Cấu trúc object trả về
5. **Error Codes** — Bảng mã lỗi
6. **Security Notes** — Lưu ý bảo mật

### 3. Tạo Flow Documentation

Khi tạo `<MODULE>_FLOW.md`, PHẢI bao gồm:

1. **Tổng quan** — Module làm gì
2. **File nguồn** — Base class + specific classes
3. **Luồng xử lý** — Step-by-step cho mỗi operation (getById, getList, create, update, delete)
4. **Phân quyền** — Policies liên quan
5. **Filtering** — Nếu có logic lọc đặc biệt

---

## XIV. CHECKLIST CHO AGENT

Khi viết code mới hoặc sửa code, agent PHẢI kiểm tra:

### Khi tạo Module mới:

- [ ] Tạo `1_<module>Entities.js` (base class) kế thừa pattern từ LabEntity/CrmEntity
- [ ] Tạo `2_<EntityName>.js` cho mỗi entity (override pKey, tableName)
- [ ] Tạo `0_<entity>_api_handler.js` theo template chuẩn
- [ ] Tạo `TEST_<MODULE>.js` theo pattern chuẩn
- [ ] Register trong `6_apiRouter.js` CLASS_MAP
- [ ] Tạo `<MODULE>_FLOW.md` và `<MODULE>_API_DOCUMENTATION.md`

### Khi sửa Entity method:

- [ ] checkPermit ở đầu method
- [ ] validateOwnershipOrThrow trước WRITE/DELETE (nếu module hỗ trợ)
- [ ] filterData/filterDataResponse trước return
- [ ] Cache invalidation sau update/delete
- [ ] Audit fields (createdAt/modifiedAt/createdById/modifiedById)

### Khi sửa API handler:

- [ ] Toàn bộ trong try/catch
- [ ] Auth token parsing chuẩn (Bearer → Cookie fallback)
- [ ] Error response format nhất quán
- [ ] msg.statusCode luôn được set
- [ ] return msg ở cuối

### Khi tạo UI:

- [ ] API_AUTH = `/v2/auth` (KHÔNG phải `/v2/identities`)
- [ ] API_BASE = `/v2/<resource>` (cho resource-specific calls)
- [ ] Auto logout khi 401
- [ ] Token lưu trong cookie

---

## XV. ANTI-PATTERNS (KHÔNG ĐƯỢC LÀM)

| ❌ SAI                                  | ✅ ĐÚNG                                 |
| --------------------------------------- | --------------------------------------- | --- | --------------- | --- | --- |
| `await` ngoài try/catch                 | Wrap MỌI async trong try/catch          |
| String concatenation trong SQL          | Parameterized queries `$1, $2`          |
| Hard delete (DROP/DELETE FROM)          | Soft delete (`deletedAt = NOW()`)       |
| Return raw DB rows                      | Wrap trong Entity instance + filterData |
| Auth endpoint `/v2/identities/login`    | Auth endpoint `/v2/auth/login`          |
| `switch(action)`                        | `if/else if` chain                      |
| Missing `return msg`                    | LUÔN `return msg` cuối file             |
| Missing `node.error()`                  | Log error trước return                  |
| `global.get("x")` không có `            |                                         | {}` | LUÔN fallback ` |     | {}` |
| Khởi tạo Entity không có `entity` param | LUÔN truyền `{ data, entity }`          |
