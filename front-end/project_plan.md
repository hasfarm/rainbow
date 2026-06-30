# HRM - Ứng Dụng Quản Lý Chấm Công & Chăm Sóc Khách Hàng

## 1. Mô Tả Dự Án
Ứng dụng quản lý nhân sự nội bộ dành cho doanh nghiệp, tập trung vào chấm công, quản lý đơn đề xuất, nghỉ phép, tăng ca, timeline công việc và báo cáo chăm sóc khách hàng. Thiết kế mobile-first, giao diện tươi sáng trẻ trung. Mỗi nhân viên chỉ xem được dữ liệu của chính mình sau khi đăng nhập.

- **Đối tượng**: Nhân viên, Quản lý, Kế toán trưởng (KTT), Chuyên viên KT, HR, Phó kho
- **Nền tảng**: Mobile-first web app
- **Ngôn ngữ**: Tiếng Việt

## 2. Cấu Trúc Trang
- `/login` - Đăng nhập
- `/dashboard` - Trang chủ / Tổng quan
- `/attendance` - Chấm công (check-in/check-out)
- `/requests` - Đơn đề xuất (thanh toán, tạm ứng, hoàn ứng, tạm ứng lương)
- `/requests/new` - Tạo đơn đề xuất mới
- `/requests/:id` - Chi tiết đơn đề xuất
- `/office` - Office (thông báo, hướng dẫn, chính sách)
- `/overtime` - Tăng ca (phiếu xác nhận tăng ca)
- `/leave` - Xin nghỉ phép (nghỉ phép năm, không lương, đi trễ/về sớm, chế độ phụ nữ, nghỉ hưởng lương, công tác)
- `/leave/new` - Tạo đơn xin nghỉ mới
- `/leave/:id` - Chi tiết đơn xin nghỉ
- `/timeline` - Timeline công việc
- `/crm` - Báo cáo CSKH
- `/crm/customer/:id` - Chi tiết khách hàng
- `/profile` - Thông tin cá nhân

## 3. Danh Sách Tính Năng Chính

### 3.1. CHẤM CÔNG
- [ ] Check-in / Check-out theo IP WiFi hoặc chụp ảnh
- [ ] Hiển thị lịch sử chấm công cá nhân
- [ ] Trạng thái: đi làm, đi muộn, về sớm, vắng mặt

### 3.2. ĐƠN ĐỀ XUẤT
- [ ] Thanh toán chi phí: NV -> QL -> KTT -> CV KT
- [ ] Tạm ứng: NV -> QL -> KTT -> CV KT
- [ ] Hoàn ứng: NV -> KTT -> CV KT
- [ ] Tạm ứng lương: NV -> KTT -> CV KT
- [ ] Theo dõi trạng thái duyệt

### 3.3. OFFICE
- [ ] Xem thông báo nội bộ
- [ ] Xem hướng dẫn, chính sách, quy định (PDF/hình ảnh)
- [ ] Link Google Drive công ty

### 3.4. TĂNG CA
- [ ] Phiếu xác nhận tăng ca: NV -> Phó kho (ghi chú) -> QL -> HR
- [ ] Theo dõi trạng thái duyệt

### 3.5. XIN NGHỈ PHÉP
- [ ] Nghỉ phép năm / không lương (hiển thị số ngày phép còn lại)
- [ ] Xin đi trễ / về sớm
- [ ] Xin về theo chế độ phụ nữ
- [ ] Xin nghỉ hưởng chế độ lương (kết hôn, tang chế)
- [ ] Công tác thị trường
- [ ] Theo dõi trạng thái duyệt

### 3.6. TIMELINE CÔNG VIỆC
- [ ] Phân theo bộ phận/phòng ban
- [ ] Nhóm công việc - Trạng thái - Deadline - PIC - Mô tả - Thảo luận

### 3.7. BÁO CÁO CSKH
- [ ] Thông tin khách hàng cơ bản
- [ ] Nguồn khách hàng & chi phí tạo lead
- [ ] Lịch sử tương tác
- [ ] Lịch sử mua hàng
- [ ] Tồn kho đại lý
- [ ] Dữ liệu chăm sóc khách hàng
- [ ] Hiệu quả chương trình khuyến mãi

### 3.8. HỆ THỐNG
- [ ] Đăng nhập / Đăng xuất
- [ ] Phân quyền theo vai trò (NV, QL, KTT, CV KT, HR, Phó kho)
- [ ] Mỗi user chỉ xem dữ liệu của chính mình

## 4. Mô Hình Dữ Liệu (Mock Data)

### Users
| Field | Type | Mô tả |
|-------|------|-------|
| id | string | Mã NV |
| name | string | Họ tên |
| email | string | Email |
| password | string | Mật khẩu (mock) |
| role | enum | Nhân viên / Quản lý / KTT / CV KT / HR / Phó kho |
| department | string | Phòng ban |
| avatar | string | Ảnh đại diện |
| annual_leave | number | Số ngày phép năm còn lại |

### Attendance
| Field | Type | Mô tả |
|-------|------|-------|
| id | string | Mã chấm công |
| user_id | string | Mã NV |
| date | string | Ngày |
| check_in | string | Giờ vào |
| check_out | string | Giờ ra |
| status | enum | Đúng giờ / Đi muộn / Về sớm |
| photo | string | Ảnh chấm công (nếu có) |

### Requests (Đơn đề xuất)
| Field | Type | Mô tả |
|-------|------|-------|
| id | string | Mã đơn |
| user_id | string | Người tạo |
| type | enum | Thanh toán / Tạm ứng / Hoàn ứng / Tạm ứng lương |
| amount | number | Số tiền |
| description | string | Mô tả |
| status | enum | Chờ duyệt / QL đã duyệt / KTT đã duyệt / CV KT đã confirm / Từ chối |
| approvals | json | Lịch sử duyệt |

### Leave (Nghỉ phép)
| Field | Type | Mô tả |
|-------|------|-------|
| id | string | Mã đơn |
| user_id | string | Người tạo |
| type | enum | Phép năm / Không lương / Đi trễ / Về sớm / Chế độ PN / Kết hôn / Tang chế / Công tác |
| start_date | string | Ngày bắt đầu |
| end_date | string | Ngày kết thúc |
| start_time | string | Giờ bắt đầu |
| end_time | string | Giờ kết thúc |
| reason | string | Lý do |
| status | enum | Chờ duyệt / Đã duyệt / Từ chối |

### Overtime (Tăng ca)
| Field | Type | Mô tả |
|-------|------|-------|
| id | string | Mã phiếu |
| user_id | string | Người tạo |
| date | string | Ngày tăng ca |
| start_time | string | Giờ bắt đầu |
| end_time | string | Giờ kết thúc |
| reason | string | Lý do |
| status | enum | Chờ PK / PK đã duyệt / QL đã duyệt / HR đã xác nhận / Từ chối |

### Work Timeline
| Field | Type | Mô tả |
|-------|------|-------|
| id | string | Mã công việc |
| department | string | Phòng ban |
| group | string | Nhóm công việc |
| title | string | Tên công việc |
| status | enum | Chưa làm / Đang làm / Hoàn thành / Trễ hạn |
| deadline | string | Deadline |
| pic | string | Người phụ trách |
| description | string | Mô tả |
| discussions | json | Thảo luận |

### CRM Customers
| Field | Type | Mô tả |
|-------|------|-------|
| id | string | Mã KH |
| name | string | Tên KH / Công ty |
| contact_person | string | Người liên hệ |
| position | string | Chức vụ |
| phone | string | SĐT |
| email | string | Email |
| address | string | Địa chỉ |
| website | string | Website |
| region | string | Khu vực KD |
| dealer_type | string | Loại hình đại lý |
| store_size | string | Quy mô cửa hàng |
| branches | number | Số chi nhánh |
| customer_group | enum | VIP / A / B / C |
| source | enum | Facebook / TikTok / Website / Giới thiệu / Hội chợ / Sales tự khai thác / Đại lý giới thiệu |
| lead_date | string | Ngày tạo lead |
| pic | string | Người phụ trách |
| lead_cost | number | Chi phí tạo lead |
| birthday | string | Sinh nhật |
| contract_date | string | Ngày ký HĐ |
| credit_limit | number | Hạn mức công nợ |

## 5. Tích Hợp Bên Thứ Ba
- Hiện tại chưa kết nối Supabase - sử dụng mock data
- Có thể nâng cấp lên Supabase sau khi hoàn thiện UI

## 6. Kế Hoạch Phát Triển

### Phase 1: Khung Giao Diện & Đăng Nhập + Chấm Công
- Mục tiêu: Thiết lập layout mobile-first, bottom navigation, trang đăng nhập, trang chấm công
- Deliverable: Login page, bottom nav layout, dashboard, attendance page với mock data

### Phase 2: Đơn Đề Xuất & Quy Trình Duyệt
- Mục tiêu: Hoàn thiện các loại đơn đề xuất và luồng duyệt
- Deliverable: Danh sách đơn, tạo đơn mới, chi tiết đơn, luồng duyệt

### Phase 3: Xin Nghỉ Phép
- Mục tiêu: Hoàn thiện các loại đơn xin nghỉ
- Deliverable: Danh sách nghỉ phép, tạo đơn nghỉ, các loại nghỉ khác nhau

### Phase 4: Tăng Ca & Office
- Mục tiêu: Module tăng ca và bảng tin nội bộ
- Deliverable: Phiếu tăng ca, duyệt tăng ca, xem thông báo/tài liệu

### Phase 5: Timeline Công Việc
- Mục tiêu: Quản lý công việc theo phòng ban
- Deliverable: Timeline view, filter theo phòng ban, thảo luận công việc

### Phase 6: Báo Cáo CSKH
- Mục tiêu: Module CRM đầy đủ
- Deliverable: Danh sách KH, chi tiết KH, lịch sử tương tác, báo cáo