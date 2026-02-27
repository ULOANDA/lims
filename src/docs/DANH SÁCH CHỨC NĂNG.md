### PHẦN I: DANH MỤC TÀI NGUYÊN & QUYỀN HẠN (RESOURCES & PERMISSIONS)

Cấu trúc định danh quyền: `<resource>.<action>` (Ví dụ: `crm.clients.view`).

---

#### 1. Module CRM & Kinh doanh (Sales & Billing)

_Quản lý vòng đời khách hàng từ lúc tiếp cận đến khi thu tiền._

##### 1.1. Resource: `crm.clients`

**Ánh xạ DB:** `crm.clients`

| STT | Tên chức năng                | Phạm vi | Các cột tác động                                                                                                                                                                                |
| :-: | :--------------------------- | :-----: | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
|  1  | Xem danh sách & chi tiết KH  |    R    | `clientId`, `clientName`, `legalId`, `clientAddress`, `clientPhone`, `clientEmail`, `clientSaleScope`, `availableByIds`, `availableByName`, `clientContacts`, `invoiceInfo`, `totalOrderAmount` |
|  2  | Tạo mới khách hàng           |    C    | `clientName`, `legalId`, `clientAddress`, `clientPhone`, `clientEmail`, `clientSaleScope`, `availableByIds`, `availableByName`, `clientContacts`, `invoiceInfo`                                 |
|  3  | Cập nhật thông tin           |    U    | `clientName`, `clientAddress`, `clientPhone`, `clientEmail`, `clientContacts`, `invoiceInfo`                                                                                                    |
|  4  | Xóa khách hàng (Soft delete) |    D    | `deletedAt`, `deletedById`                                                                                                                                                                      |
|  5  | Gán nhân viên sale phụ trách |    U    | `clientSaleScope`, `availableByIds`, `availableByName`                                                                                                                                          |

##### 1.2. Resource: `crm.quotes`

**Ánh xạ DB:** `crm.quotes`

| STT | Tên chức năng             | Phạm vi | Các cột tác động                                                                                                                                                                                                                                        |
| :-: | :------------------------ | :-----: | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
|  1  | Xem báo giá               |    R    | `quoteId`, `quoteCode`, `clientId`, `client`, `salePersonId`, `salePerson`, `contactPerson`, `samples`, `totalFeeBeforeTax`, `totalFeeBeforeTaxAndDiscount`, `totalTaxValue`, `totalDiscountValue`, `taxRate`, `discount`, `totalAmount`, `quoteStatus` |
|  2  | Tạo báo giá nháp          |    C    | `quoteCode`, `clientId`, `client`, `salePersonId`, `salePerson`, `contactPerson`, `samples`, `totalFeeBeforeTax`, `totalFeeBeforeTaxAndDiscount`, `totalTaxValue`, `totalDiscountValue`, `taxRate`, `discount`, `totalAmount`, `quoteStatus`            |
|  3  | Chỉnh sửa báo giá         |    U    | `client`, `contactPerson`, `samples`, `totalFeeBeforeTax`, `totalFeeBeforeTaxAndDiscount`, `totalTaxValue`, `totalDiscountValue`, `taxRate`, `discount`, `totalAmount`                                                                                  |
|  4  | Duyệt mức chiết khấu cao  |    U    | `discount`, `totalDiscountValue`, `totalFeeBeforeTax`, `totalAmount`                                                                                                                                                                                    |
|  5  | Gửi báo giá               |    U    | `quoteStatus`                                                                                                                                                                                                                                           |
|  6  | Chuyển đổi thành Đơn hàng |    C    | Tạo record mới trong `crm.orders`                                                                                                                                                                                                                       |

##### 1.3. Resource: `crm.orders`

**Ánh xạ DB:** `crm.orders`

| STT | Tên chức năng                  | Phạm vi | Các cột tác động                                                                                                                                                                                                                                                                                                                                                  |
| :-: | :----------------------------- | :-----: | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
|  1  | Xem đơn hàng                   |    R    | `orderId`, `quoteId`, `clientId`, `client`, `contactPerson`, `reportRecipient`, `salePersonId`, `salePerson`, `saleCommissionPercent`, `samples`, `totalAmount`, `totalFeeBeforeTax`, `totalFeeBeforeTaxAndDiscount`, `totalTaxValue`, `totalDiscountValue`, `orderStatus`, `taxRate`, `discountRate`, `paymentStatus`, `transactions`, `orderUri`, `requestForm` |
|  2  | Tạo đơn hàng mới               |    C    | `quoteId`, `clientId`, `client`, `contactPerson`, `reportRecipient`, `salePersonId`, `salePerson`, `saleCommissionPercent`, `samples`, `totalAmount`, `totalFeeBeforeTax`, `totalFeeBeforeTaxAndDiscount`, `totalTaxValue`, `totalDiscountValue`, `orderStatus`, `taxRate`, `discountRate`, `paymentStatus`, `orderUri`, `requestForm`                            |
|  3  | Cập nhật thông tin             |    U    | `client`, `contactPerson`, `reportRecipient`, `samples`, `totalAmount`, `totalFeeBeforeTax`, `totalFeeBeforeTaxAndDiscount`, `totalTaxValue`, `totalDiscountValue`, `taxRate`, `discountRate`                                                                                                                                                                     |
|  4  | Hủy đơn hàng                   |    U    | `orderStatus`                                                                                                                                                                                                                                                                                                                                                     |
|  5  | Cập nhật trạng thái thanh toán |    U    | `paymentStatus`, `transactions`                                                                                                                                                                                                                                                                                                                                   |
|  6  | Xử lý hoàn trả/Hủy có phí      |    U    | `orderStatus`, `paymentStatus`, `transactions`                                                                                                                                                                                                                                                                                                                    |

##### 1.4. Resource: `crm.invoices`

**Ánh xạ DB:** `crm.orders` (cột `transactions`)

| STT | Tên chức năng                         | Phạm vi | Các cột tác động                                                       |
| :-: | :------------------------------------ | :-----: | :--------------------------------------------------------------------- |
|  1  | Xem lịch sử giao dịch                 |    R    | `transactions`, `paymentStatus`, `totalAmount`                         |
|  2  | Xuất phiếu thu/Hóa đơn                |   C/U   | `transactions`                                                         |
|  3  | Xuất file Excel/PDF báo cáo doanh thu |    R    | `orderId`, `totalAmount`, `paymentStatus`, `transactions`, `createdAt` |

##### 1.5. Resource: `crm.complaints`

**Ánh xạ DB:** `crm.complaints` (bảng mới cần tạo)

| STT | Tên chức năng             | Phạm vi | Các cột tác động                                                                                                                        |
| :-: | :------------------------ | :-----: | :-------------------------------------------------------------------------------------------------------------------------------------- |
|  1  | Xem danh sách khiếu nại   |    R    | `complaintId`, `orderId`, `clientId`, `complaintTitle`, `reason`, `attachFiles`, `investigationResult`, `resolution`, `complaintStatus` |
|  2  | Tạo ticket khiếu nại      |    C    | `orderId`, `clientId`, `complaintTitle`, `reason`, `attachFiles`, `complaintStatus`                                                     |
|  3  | Cập nhật kết quả điều tra |    U    | `investigationResult`, `complaintStatus`                                                                                                |
|  4  | Đề xuất phương án xử lý   |    U    | `resolution`, `complaintStatus`                                                                                                         |

##### 1.6. Resource: `crm.incomingRequests`

**Ánh xạ DB:** `crm.incomingRequests`

| STT | Tên chức năng                 | Phạm vi | Các cột tác động                                                     |
| :-: | :---------------------------- | :-----: | :------------------------------------------------------------------- |
|  1  | Xem danh sách yêu cầu gửi mẫu |    R    | `requestId`, `senderInfo`, `requestContent`, `status`, `requestDate` |
|  2  | Tạo yêu cầu (Manual/Portal)   |    C    | `senderInfo`, `requestContent`, `documentIds`                        |
|  3  | Chuyển đổi thành Đơn hàng     |    U    | `status` (Converted), `linkedOrderId`, tạo mới `crm.orders`          |
|  4  | Từ chối yêu cầu               |    U    | `status` (Rejected)                                                  |

##### 1.7. Resource: `crm.transactions`

**Ánh xạ DB:** `crm.orders` (cột `transactions`) hoặc `crm.transactions` (bảng mới cần tạo)

| STT | Tên chức năng                     | Phạm vi | Các cột tác động                                                                |
| :-: | :-------------------------------- | :-----: | :------------------------------------------------------------------------------ |
|  1  | Xem log giao dịch (SMS/Bank)      |    R    | `transactionId`, `amount`, `content`, `transactionDate`, `status`, `senderBank` |
|  2  | Tạo giao dịch thủ công (Tiền mặt) |    C    | `amount`, `content`, `refType`, `transactionDate`                               |
|  3  | Đối soát & Gán vào đơn hàng       |    U    | `refOrderId`, `status` (Mapped), trigger update `crm.orders.paymentStatus`      |
|  4  | Bỏ qua giao dịch (Spam/Sai)       |    U    | `status` (Ignored)                                                              |

---

#### 2. Module Thư viện & Dữ liệu gốc (Master Data)

_Xương sống kỹ thuật của hệ thống. Yêu cầu quy trình "Đề xuất -> Duyệt" chặt chẽ._

##### 2.1. Resource: `library.parameters`

**Ánh xạ DB:** `library.parameters`

| STT | Tên chức năng                | Phạm vi | Các cột tác động                                                  |
| :-: | :--------------------------- | :-----: | :---------------------------------------------------------------- |
|  1  | Xem danh mục chỉ tiêu        |    R    | `parameterId`, `parameterName`, `displayStyle`, `technicianAlias` |
|  2  | Tạo mới chỉ tiêu (Draft)     |    C    | `parameterName`, `displayStyle`, `technicianAlias`                |
|  3  | Sửa tên/đơn vị/alias         |    U    | `parameterName`, `displayStyle`, `technicianAlias`                |
|  4  | Ẩn chỉ tiêu (không dùng nữa) |    D    | `deletedAt`, `deletedById`                                        |

##### 2.2. Resource: `library.protocols`

**Ánh xạ DB:** `library.protocols`

| STT | Tên chức năng                    | Phạm vi | Các cột tác động                                                        |
| :-: | :------------------------------- | :-----: | :---------------------------------------------------------------------- |
|  1  | Xem danh mục phương pháp         |    R    | `protocolId`, `protocolCode`, `protocolSource`, `protocolAccreditation` |
|  2  | Cập nhật version phương pháp mới |   C/U   | `protocolCode`, `protocolSource`, `protocolAccreditation`               |
|  3  | Duyệt áp dụng phương pháp        |    U    | `protocolAccreditation`                                                 |

##### 2.3. Resource: `library.matrices`

**Ánh xạ DB:** `library.matrices`

| STT | Tên chức năng                     | Phạm vi | Các cột tác động                                                                                                                                                                                                                                                       |
| :-: | :-------------------------------- | :-----: | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
|  1  | Tra cứu giá và giới hạn (LOD/LOQ) |    R    | `matrixId`, `parameterId`, `protocolId`, `sampleTypeId`, `protocolCode`, `protocolSource`, `protocolAccreditation`, `parameterName`, `sampleTypeName`, `feeBeforeTax`, `taxRate`, `feeAfterTax`, `LOD`, `LOQ`, `thresholdLimit`, `turnaroundTime`, `technicianGroupId` |
|  2  | Đề xuất giá mới hoặc giới hạn mới |   C/U   | `feeBeforeTax`, `taxRate`, `feeAfterTax`, `LOD`, `LOQ`, `thresholdLimit`                                                                                                                                                                                               |
|  3  | Duyệt thay đổi giá/giới hạn       |    U    | `feeBeforeTax`, `taxRate`, `feeAfterTax`, `LOD`, `LOQ`, `thresholdLimit`                                                                                                                                                                                               |

##### 2.4. Resource: `library.sample_types`

**Ánh xạ DB:** `library.sampleTypes`

| STT | Tên chức năng                               | Phạm vi | Các cột tác động                                     |
| :-: | :------------------------------------------ | :-----: | :--------------------------------------------------- |
|  1  | Xem danh mục nhóm sản phẩm                  |    R    | `sampleTypeId`, `sampleTypeName`, `displayTypeStyle` |
|  2  | Thêm/Sửa/Xóa loại mẫu                       |  C/U/D  | `sampleTypeName`, `displayTypeStyle`                 |
|  3  | Cấu hình thời gian lưu mẫu/hủy mẫu mặc định |    U    | Metadata trong `displayTypeStyle` hoặc bảng riêng    |

##### 2.5. Resource: `library.standards`

**Ánh xạ DB:** `library.standards` (bảng mới cần tạo)

| STT | Tên chức năng                        | Phạm vi | Các cột tác động                                                                                              |
| :-: | :----------------------------------- | :-----: | :------------------------------------------------------------------------------------------------------------ |
|  1  | Tra cứu TCVN/ISO                     |    R    | `standardId`, `standardCode`, `standardName`, `standardSource`, `effectiveDate`, `expiryDate`, `documentFile` |
|  2  | Cập nhật hiệu lực, upload bản scan   |    U    | `effectiveDate`, `expiryDate`, `documentFile`                                                                 |
|  3  | Cấu hình nhắc hạn rà soát tiêu chuẩn |    U    | `expiryDate`, `alertDate`                                                                                     |

---

#### 3. Module Vận hành Phòng Lab (Lab Operations)

_Module lõi. Quyền hạn được chia nhỏ nhất để đảm bảo tính toàn vẹn dữ liệu (Data Integrity)._

##### 3.1. Resource: `lab.receipts`

**Ánh xạ DB:** `lab.receipt`

| STT | Tên chức năng                   | Phạm vi | Các cột tác động                                                                                                                                                                            |
| :-: | :------------------------------ | :-----: | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
|  1  | Xem phiếu nhận                  |    R    | `receiptId`, `receiptCode` (mapping check), `status`, `receiptDate`, `deadline`, `note`, `paymentStatus`, `orderId`, `clientId`, `contactPerson`, `reportRecipient`, `trackingNo`, `client` |
|  2  | Tạo phiếu nhận mới              |    C    | `orderId`, `clientId`, `client`, `contactPerson`, `reportRecipient`, `status`, `deadline`, `note`                                                                                           |
|  3  | Sửa thông tin hành chính        |    U    | `note`, `deadline`, `contactPerson`, `reportRecipient`                                                                                                                                      |
|  4  | In phiếu nhận/Biên bản bàn giao |    R    | Tất cả các cột để render PDF                                                                                                                                                                |
|  5  | Xác nhận hoàn thành đơn         |    U    | `status`                                                                                                                                                                                    |

##### 3.2. Resource: `lab.samples`

**Ánh xạ DB:** `lab.sample`

| STT | Tên chức năng                      | Phạm vi | Các cột tác động                                                                                                                                                                                                               |
| :-: | :--------------------------------- | :-----: | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
|  1  | Xem thông tin mẫu                  |    R    | `sampleId`, `receiptId`, `sampleTypeName`, `sampleInformation`, `sampleDescription`, `sampleVolume`, `status`, `sampleName`, `matrix`, `purpose`, `handoverAt`, `handoverDetail`, `productType`, `deletedAt`, `emailsReceived` |
|  2  | In tem nhãn (Barcode/QR)           |    R    | `sampleId`, `sampleInformation`, `sampleName`                                                                                                                                                                                  |
|  3  | Mã hóa mẫu (Sinh mã mù - Blinding) |    U    | `sampleId` (auto-generate), `sampleInformation` (Masking)                                                                                                                                                                      |
|  4  | Cập nhật vị trí lưu kho            |    U    | `status`                                                                                                                                                                                                                       |
|  5  | Hủy mẫu (Lập biên bản hủy)         |    U    | `status`, `deletedAt`                                                                                                                                                                                                          |
|  6  | Chia mẫu (Aliquot)                 |    C    | Tạo record mẫu con mới với `parentSampleId`                                                                                                                                                                                    |

##### 3.3. Resource: `lab.analyses`

**Ánh xạ DB:** `lab.analysis`

| STT | Tên chức năng                    | Phạm vi | Các cột tác động                                                                                                                                                                                                                                                                                                                                                                                     |
| :-: | :------------------------------- | :-----: | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
|  1  | Xem chỉ tiêu                     |    R    | `id`, `receiptId`, `sampleId`, `protocolId`, `parameterId`, `technicianId`, `technicianIds`, `deadline`, `parameterName`, `protocolCode`, `resultUnit`, `resultValue`, `lodq`, `matrix`, `reviewedById`, `submitLastResultAt`, `submitLastResultById`, `resultReference`, `scientificField`, `exInfo`, `accreditation`, `docId`, `labTestFileId`, `technicianAlias`, `metadata`, `note`, `deletedAt` |
|  2  | Phân công KTV (Trưởng phòng)     |    U    | `technicianId`, `technicianIds`, `technicianAlias`                                                                                                                                                                                                                                                                                                                                                   |
|  3  | Nhập kết quả thô/Upload raw data |    U    | `resultValue`, `resultUnit`, `labTestFileId` (`fileId`), `metadata`                                                                                                                                                                                                                                                                                                                                  |
|  4  | Soát xét kết quả (QC/Reviewer)   |    U    | `reviewedById`, `status` (via metadata or virtual field)                                                                                                                                                                                                                                                                                                                                             |
|  5  | Duyệt kết quả (Manager)          |    U    | `status`, `reviewedById`                                                                                                                                                                                                                                                                                                                                                                             |
|  6  | Điều phối tải (San mẫu)          |    U    | `technicianId`, `technicianIds`                                                                                                                                                                                                                                                                                                                                                                      |

##### 3.4. Resource: `lab.solutions`

**Ánh xạ DB:** `lab.solutions` (bảng mới cần tạo)

| STT | Tên chức năng                               | Phạm vi | Các cột tác động                                                                                                        |
| :-: | :------------------------------------------ | :-----: | :---------------------------------------------------------------------------------------------------------------------- |
|  1  | Xem danh sách dung dịch                     |    R    | `solutionId`, `solutionName`, `concentration`, `parentChemicalId`, `preparedDate`, `expiryDate`, `preparedBy`, `volume` |
|  2  | Pha chế (Ghi nhận hóa chất gốc, nồng độ)    |    C    | `solutionName`, `concentration`, `parentChemicalId`, `preparedDate`, `expiryDate`, `preparedBy`, `volume`               |
|  3  | In tem nhãn dung dịch                       |    R    | `solutionId`, `solutionName`, `concentration`, `expiryDate`                                                             |
|  4  | Ghi nhận sử dụng (trừ tồn kho hóa chất gốc) |    U    | `volume`, link to `inventory_items`                                                                                     |

##### 3.5. Resource: `lab.reports`

**Ánh xạ DB:** `lab.report`

| STT | Tên chức năng                                       | Phạm vi | Các cột tác động                                                |
| :-: | :-------------------------------------------------- | :-----: | :-------------------------------------------------------------- |
|  1  | Xem báo cáo nháp/chính thức                         |    R    | `id`, `refNumber`, `sampleId`, `headerSection`, `footerSection` |
|  2  | Sinh báo cáo từ kết quả đã duyệt                    |    C    | `id`, `refNumber`, `sampleId`, `headerSection`, `footerSection` |
|  3  | Chỉnh sửa bố cục/lời phê                            |    U    | `headerSection`, `footerSection`, `noteSection`                 |
|  4  | Ký số (Digital Sign) và phát hành                   |    U    | `signatureSection`                                              |
|  5  | Thu hồi báo cáo đã phát hành (Re-issue version mới) |   C/U   | Tạo version mới, đánh dấu cũ là `recalled`                      |

---

#### 4. Module Quản lý Tài nguyên Lab (Resources & Assets)

##### 4.1. Resource: `lab.equipment`

**Ánh xạ DB:** `lab.equipment` (bảng mới cần tạo)

| STT | Tên chức năng                               | Phạm vi | Các cột tác động                                                                                                               |
| :-: | :------------------------------------------ | :-----: | :----------------------------------------------------------------------------------------------------------------------------- |
|  1  | Xem danh sách & trạng thái                  |    R    | `equipmentId`, `equipmentName`, `equipmentCode`, `equipmentStatus`, `equipmentCalibDate`, `equipmentNextCalib`, `equipmentLog` |
|  2  | Thêm/Sửa hồ sơ thiết bị                     |   C/U   | `equipmentName`, `equipmentCode`, `equipmentStatus`, `equipmentCalibDate`, `equipmentNextCalib`                                |
|  3  | Ghi nhật ký sử dụng                         |    U    | `equipmentLog`                                                                                                                 |
|  4  | Cập nhật lịch sử bảo trì/hiệu chuẩn         |    U    | `equipmentCalibDate`, `equipmentNextCalib`, `equipmentLog`                                                                     |
|  5  | Khóa thiết bị (khi hỏng/quá hạn hiệu chuẩn) |    U    | `equipmentStatus`                                                                                                              |

##### 4.2. Resource: `lab.inventory`

**Ánh xạ DB:** `lab.inventory_items` (bảng mới cần tạo)

| STT | Tên chức năng                           | Phạm vi | Các cột tác động                                                                                                         |
| :-: | :-------------------------------------- | :-----: | :----------------------------------------------------------------------------------------------------------------------- |
|  1  | Xem tồn kho                             |    R    | `itemId`, `itemName`, `itemType`, `itemStockQty`, `itemUnit`, `itemLotNo`, `itemExpiryDate`, `itemLocation`, `itemCasNo` |
|  2  | Nhập kho (Mua mới)                      |   C/U   | `itemName`, `itemType`, `itemStockQty`, `itemUnit`, `itemLotNo`, `itemExpiryDate`, `itemLocation`, `itemCasNo`           |
|  3  | Xuất kho (Sử dụng cho mẫu) - check FEFO |    U    | `itemStockQty`                                                                                                           |
|  4  | Kiểm kê/Điều chỉnh số lượng             |    U    | `itemStockQty`                                                                                                           |
|  5  | Hủy hóa chất/rác thải nguy hại          |    U    | `itemStockQty`, `itemStatus` (nếu có)                                                                                    |
|  6  | Cài đặt ngưỡng cảnh báo                 |    U    | Metadata hoặc bảng riêng `inventory_alerts`                                                                              |

---

#### 5. Module Tài liệu & Hệ thống (Documents & System)

##### 5.1. Resource: `qa.nc`

**Ánh xạ DB:** `qa.nc_reports` (bảng mới cần tạo)

| STT | Tên chức năng                        | Phạm vi | Các cột tác động                                                                       |
| :-: | :----------------------------------- | :-----: | :------------------------------------------------------------------------------------- |
|  1  | Ghi nhận sự cố (NC)                  |    C    | `ncId`, `ncTitle`, `ncDescription`, `ncType`, `ncStatus`, `reportedBy`, `reportedDate` |
|  2  | Phân tích nguyên nhân & CAPA         |    U    | `rootCause`, `correctiveAction`, `preventiveAction`, `ncStatus`                        |
|  3  | Đóng phiếu NC (sau khi đã khắc phục) |    U    | `ncStatus`, `closedDate`, `closedBy`                                                   |

##### 5.2. Resource: `system.risks`

**Ánh xạ DB:** `system.risk_registers` (bảng mới cần tạo)

| STT | Tên chức năng               | Phạm vi | Các cột tác động                                                                                                               |
| :-: | :-------------------------- | :-----: | :----------------------------------------------------------------------------------------------------------------------------- |
|  1  | Xem sổ tay rủi ro           |    R    | `riskId`, `riskTitle`, `riskDescription`, `riskCategory`, `probability`, `impact`, `riskScore`, `mitigationPlan`, `riskStatus` |
|  2  | Đánh giá & Chấm điểm rủi ro |   C/U   | `riskTitle`, `riskDescription`, `riskCategory`, `probability`, `impact`, `riskScore`, `mitigationPlan`                         |
|  3  | Theo dõi kế hoạch hành động |    U    | `mitigationPlan`, `riskStatus`, `actionOwner`, `dueDate`                                                                       |

##### 5.3. Resource: `logistics.shipments`

**Ánh xạ DB:** `service.shipments` (bảng mới cần tạo)

| STT | Tên chức năng                             | Phạm vi | Các cột tác động                                                  |
| :-: | :---------------------------------------- | :-----: | :---------------------------------------------------------------- |
|  1  | Tạo vận đơn (kết nối API hãng vận chuyển) |    C    | `shipmentId`, `trackingNumber`, `provider`, `status`, `shipOrder` |
|  2  | Theo dõi hành trình                       |    R    | `shipmentId`, `trackingNumber`, `status`, `shipOrder`             |
|  3  | In phiếu gửi hàng                         |    R    | Tất cả các cột để render label                                    |

##### 5.4. Resource: `document.files`

**Ánh xạ DB:** `file.info`

| STT | Tên chức năng                                   | Phạm vi | Các cột tác động                                                                           |
| :-: | :---------------------------------------------- | :-----: | :----------------------------------------------------------------------------------------- |
|  1  | Tải lên (chia theo tag: SOP, Contract, RawData) |    C    | `fileName`, `objectName`, `fileStatus`, `systemTags`, `userTags`, `originInfo`, `metadata` |
|  2  | Xem/Tải về                                      |    R    | `id`, `fileName`, `objectName`, `systemTags`, `userTags`                                   |
|  3  | Quản lý phiên bản tài liệu                      |   C/U   | Tạo version mới                                                                            |
|  4  | Xóa file (Admin only)                           |    D    | `deletedAt`, `objectStatus`                                                                |

##### 5.5. Resource: `system.identities`

**Ánh xạ DB:** `identity.identities`, `identity.sessions`

| STT | Tên chức năng                             | Phạm vi | Các cột tác động                                                                          |
| :-: | :---------------------------------------- | :-----: | :---------------------------------------------------------------------------------------- |
|  1  | Xem danh sách nhân viên                   |    R    | `identityId`, `email`, `identityName`, `alias`, `roles`, `permissions`, `identityStatus`  |
|  2  | Tạo/Khóa tài khoản, Reset mật khẩu        |   C/U   | `email`, `identityName`, `alias`, `roles`, `permissions`, `password`, `identityStatus`    |
|  3  | Cấu hình Role và Permission Matrix        |    U    | `roles`, `permissions`                                                                    |
|  4  | Xem nhật ký hệ thống (Ai làm gì, lúc nào) |    R    | Audit columns: `createdAt`, `createdById`, `modifiedAt`, `modifiedById` across all tables |
