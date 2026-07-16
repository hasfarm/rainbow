export const mockUsers = [
  {
    id: 'NV001',
    name: 'Nguyễn Văn An',
    email: 'an.nguyen@company.vn',
    password: '123456',
    role: 'staff' as const,
    department: 'Kinh Doanh',
    position: 'Nhân viên kinh doanh',
    avatar: 'https://readdy.ai/api/search-image?query=Vietnamese%20young%20professional%20man%20portrait%20warm%20friendly%20smile%20clean%20background%20soft%20lighting%20modern%20office%20style%20professional%20headshot&width=200&height=200&seq=avatar-an&orientation=squarish',
    annualLeave: 12,
    phone: '0901 234 567',
    joinDate: '2024-03-15',
    gender: 'Nam' as const,
    birthDate: '1998-05-12',
    status: 'active' as const,
    employmentType: 'official' as const,
    title: 'Chuyên viên kinh doanh',
    startDate: '2024-03-15',
    officialDate: '2024-06-15',
    specialization: 'B2B Sales',
    jobPosition: 'Nhân viên kinh doanh',
  },
  {
    id: 'NV002',
    name: 'Trần Thị Bình',
    email: 'binh.tran@company.vn',
    password: '123456',
    role: 'manager' as const,
    department: 'Kinh Doanh',
    position: 'Quản lý kinh doanh',
    avatar: 'https://readdy.ai/api/search-image?query=Vietnamese%20young%20professional%20woman%20portrait%20warm%20confident%20smile%20clean%20background%20soft%20lighting%20modern%20office%20style%20professional%20headshot&width=200&height=200&seq=avatar-binh&orientation=squarish',
    annualLeave: 14,
    phone: '0902 345 678',
    joinDate: '2023-06-20',
    gender: 'Nữ' as const,
    birthDate: '1990-08-22',
    status: 'active' as const,
    employmentType: 'official' as const,
    title: 'Trưởng phòng kinh doanh',
    startDate: '2023-06-20',
    officialDate: '2023-09-20',
    specialization: 'Enterprise Sales',
    jobPosition: 'Quản lý kinh doanh',
  },
  {
    id: 'NV003',
    name: 'Lê Văn Cường',
    email: 'cuong.le@company.vn',
    password: '123456',
    role: 'staff' as const,
    department: 'Kho Vận',
    position: 'Nhân viên kho',
    avatar: 'https://readdy.ai/api/search-image?query=Vietnamese%20young%20professional%20man%20portrait%20friendly%20smile%20clean%20background%20soft%20lighting%20modern%20warehouse%20style%20professional%20headshot&width=200&height=200&seq=avatar-cuong&orientation=squarish',
    annualLeave: 10,
    phone: '0903 456 789',
    joinDate: '2024-01-10',
    gender: 'Nam' as const,
    birthDate: '1995-11-03',
    status: 'active' as const,
    employmentType: 'official' as const,
    title: 'Nhân viên',
    startDate: '2024-01-10',
    officialDate: '2024-04-10',
    specialization: 'Quản lý hàng tồn',
    jobPosition: 'Nhân viên kho',
  },
  {
    id: 'NV004',
    name: 'Phạm Thị Dung',
    email: 'dung.pham@company.vn',
    password: '123456',
    role: 'hr' as const,
    department: 'Nhân Sự',
    position: 'Chuyên viên nhân sự',
    avatar: 'https://readdy.ai/api/search-image?query=Vietnamese%20young%20professional%20woman%20portrait%20warm%20friendly%20smile%20clean%20background%20soft%20lighting%20modern%20office%20style%20professional%20headshot&width=200&height=200&seq=avatar-dung&orientation=squarish',
    annualLeave: 14,
    phone: '0904 567 890',
    joinDate: '2023-09-01',
    gender: 'Nữ' as const,
    birthDate: '1993-02-14',
    status: 'active' as const,
    employmentType: 'official' as const,
    title: 'Chuyên viên',
    startDate: '2023-09-01',
    officialDate: '2023-12-01',
    specialization: 'Tuyển dụng & Đào tạo',
    jobPosition: 'Chuyên viên nhân sự',
  },
  {
    id: 'NV005',
    name: 'Hoàng Văn Em',
    email: 'em.hoang@company.vn',
    password: '123456',
    role: 'accountant' as const,
    department: 'Kế Toán',
    position: 'Kế toán trưởng',
    avatar: 'https://readdy.ai/api/search-image?query=Vietnamese%20middle%20aged%20professional%20man%20portrait%20serious%20warm%20expression%20clean%20background%20soft%20lighting%20modern%20office%20style%20professional%20headshot&width=200&height=200&seq=avatar-em&orientation=squarish',
    annualLeave: 14,
    phone: '0905 678 901',
    joinDate: '2022-04-15',
    gender: 'Nam' as const,
    birthDate: '1985-07-30',
    status: 'active' as const,
    employmentType: 'official' as const,
    title: 'Kế toán trưởng',
    startDate: '2022-04-15',
    officialDate: '2022-07-15',
    specialization: 'Kế toán tổng hợp',
    jobPosition: 'Kế toán trưởng',
  },
  {
    id: 'NV006',
    name: 'Ngô Thị Phương',
    email: 'phuong.ngo@company.vn',
    password: '123456',
    role: 'deputy_warehouse' as const,
    department: 'Kho Vận',
    position: 'Phó kho',
    avatar: 'https://readdy.ai/api/search-image?query=Vietnamese%20young%20professional%20woman%20portrait%20warm%20capable%20smile%20clean%20background%20soft%20lighting%20modern%20warehouse%20style%20professional%20headshot&width=200&height=200&seq=avatar-phuong&orientation=squarish',
    annualLeave: 12,
    phone: '0906 789 012',
    joinDate: '2023-11-01',
    gender: 'Nữ' as const,
    birthDate: '1992-09-18',
    status: 'active' as const,
    employmentType: 'official' as const,
    title: 'Phó trưởng kho',
    startDate: '2023-11-01',
    officialDate: '2024-02-01',
    specialization: 'Quản lý xuất nhập',
    jobPosition: 'Phó kho',
  },
  {
    id: 'NV007',
    name: 'Vũ Đức Hải',
    email: 'hai.vu@company.vn',
    password: '123456',
    role: 'warehouse_staff' as const,
    department: 'Kho Vận',
    position: 'Nhân viên kho',
    avatar: 'https://readdy.ai/api/search-image?query=Vietnamese%20young%20professional%20man%20portrait%20friendly%20capable%20expression%20clean%20background%20soft%20lighting%20modern%20warehouse%20setting%20professional%20headshot&width=200&height=200&seq=avatar-hai&orientation=squarish',
    annualLeave: 10,
    phone: '0907 890 123',
    joinDate: '2024-05-20',
    gender: 'Nam' as const,
    birthDate: '1999-12-25',
    status: 'active' as const,
    employmentType: 'probation' as const,
    title: 'Nhân viên tập sự',
    startDate: '2024-05-20',
    officialDate: '2024-08-20',
    specialization: 'Vận hành xe nâng',
    jobPosition: 'Nhân viên kho',
  },
  {
    id: 'NV008',
    name: 'Đặng Thị Lan',
    email: 'lan.dang@company.vn',
    password: '123456',
    role: 'warehouse_staff' as const,
    department: 'Kho Vận',
    position: 'Nhân viên kho',
    avatar: 'https://readdy.ai/api/search-image?query=Vietnamese%20young%20professional%20woman%20portrait%20warm%20friendly%20smile%20clean%20background%20soft%20lighting%20modern%20warehouse%20style%20professional%20headshot&width=200&height=200&seq=avatar-lan&orientation=squarish',
    annualLeave: 10,
    phone: '0908 901 234',
    joinDate: '2024-08-12',
    gender: 'Nữ' as const,
    birthDate: '1997-03-08',
    status: 'active' as const,
    employmentType: 'probation' as const,
    title: 'Nhân viên tập sự',
    startDate: '2024-08-12',
    officialDate: '2024-11-12',
    specialization: 'Kiểm kê hàng hóa',
    jobPosition: 'Nhân viên kho',
  },
  {
    id: 'NV009',
    name: 'Mai Thanh Tùng',
    email: 'tung.mai@company.vn',
    password: '123456',
    role: 'warehouse_manager' as const,
    department: 'Kho Vận',
    position: 'Quản lý kho',
    avatar: 'https://readdy.ai/api/search-image?query=Vietnamese%20middle%20aged%20professional%20man%20portrait%20serious%20capable%20expression%20clean%20background%20soft%20lighting%20modern%20warehouse%20management%20style%20professional%20headshot&width=200&height=200&seq=avatar-tung&orientation=squarish',
    annualLeave: 14,
    phone: '0909 012 345',
    joinDate: '2022-07-01',
    gender: 'Nam' as const,
    birthDate: '1988-01-15',
    status: 'active' as const,
    employmentType: 'official' as const,
    title: 'Trưởng kho',
    startDate: '2022-07-01',
    officialDate: '2022-10-01',
    specialization: 'Quản lý chuỗi cung ứng',
    jobPosition: 'Quản lý kho',
  },
];

export type UserRole = 'staff' | 'manager' | 'accountant' | 'accountant_specialist' | 'hr' | 'deputy_warehouse' | 'warehouse_staff' | 'warehouse_manager';

export type Gender = 'Nam' | 'Nữ';

export type EmployeeStatus = 'active' | 'inactive';

export type EmploymentType = 'probation' | 'official';

export interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  role: UserRole;
  department: string;
  position: string;
  avatar: string;
  annualLeave: number;
  phone: string;
  joinDate: string;
  gender: Gender;
  birthDate: string;
  status: EmployeeStatus;
  employmentType: EmploymentType;
  title: string;
  startDate: string;
  officialDate: string;
  specialization: string;
  jobPosition: string;
}

export const roleLabels: Record<UserRole, string> = {
  staff: 'Nhân viên',
  manager: 'Quản lý',
  accountant: 'Kế toán trưởng',
  accountant_specialist: 'Chuyên viên KT',
  hr: 'Nhân sự',
  deputy_warehouse: 'Phó kho',
  warehouse_staff: 'Nhân viên kho',
  warehouse_manager: 'Quản lý kho',
};

export const statusLabels: Record<EmployeeStatus, string> = {
  active: 'Đang làm',
  inactive: 'Đã nghỉ',
};

export const employmentTypeLabels: Record<EmploymentType, string> = {
  probation: 'Thử việc',
  official: 'Chính thức',
};

export function calcSeniority(startDate: string, referenceDate?: string): string {
  const start = new Date(startDate);
  const ref = referenceDate ? new Date(referenceDate) : new Date();
  let years = ref.getFullYear() - start.getFullYear();
  let months = ref.getMonth() - start.getMonth();
  if (months < 0) {
    years -= 1;
    months += 12;
  }
  const totalMonths = years * 12 + months;
  if (totalMonths < 12) return `${totalMonths} tháng`;
  const y = Math.floor(totalMonths / 12);
  const m = totalMonths % 12;
  return m > 0 ? `${y} năm ${m} tháng` : `${y} năm`;
}