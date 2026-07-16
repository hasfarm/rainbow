import { AdminSidebar } from '@/components/feature/AdminSidebar';
import { AuthContext } from '@/hooks/useAuth';
import { useContext, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  createLeaveRemain,
  deleteLeaveRemain,
  fetchLeaveRemainEmployees,
  fetchLeaveRemainRecords,
  updateLeaveRemain,
  type LeaveRemainEmployeeOption,
  type LeaveRemainPayload,
  type LeaveRemainRecord,
} from './api';

type LeaveRemainForm = {
  userCode: string;
  year: string;
  remainingDays: string;
};

const emptyForm: LeaveRemainForm = {
  userCode: '',
  year: String(new Date().getFullYear()),
  remainingDays: '0',
};

export default function LeaveRemainPage() {
  const { user } = useContext(AuthContext);
  const [records, setRecords] = useState<LeaveRemainRecord[]>([]);
  const [employees, setEmployees] = useState<LeaveRemainEmployeeOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [yearFilter, setYearFilter] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeletingId, setIsDeletingId] = useState<number | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [form, setForm] = useState<LeaveRemainForm>(emptyForm);

  const isAdmin = (user?.role ?? '').toLowerCase() === 'admin';

  async function loadRecords(nextQuery = query, nextYear = yearFilter) {
    setIsLoading(true);
    setError(null);

    try {
      const parsedYear = nextYear.trim() === '' ? undefined : Number(nextYear);
      const data = await fetchLeaveRemainRecords(nextQuery, Number.isFinite(parsedYear) ? parsedYear : undefined);
      setRecords(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Khong the tai du lieu phep ton');
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    async function bootstrap() {
      setIsLoading(true);
      setError(null);

      try {
        const [employeeOptions, leaveRemainData] = await Promise.all([
          fetchLeaveRemainEmployees(),
          fetchLeaveRemainRecords(),
        ]);
        setEmployees(employeeOptions);
        setRecords(leaveRemainData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Khong the tai du lieu phep ton');
      } finally {
        setIsLoading(false);
      }
    }

    if (isAdmin) {
      void bootstrap();
    }
  }, [isAdmin]);

  function openCreateModal() {
    setEditingId(null);
    setForm({
      ...emptyForm,
      userCode: employees[0]?.code ?? '',
    });
    setFormError(null);
    setIsModalOpen(true);
  }

  function openEditModal(record: LeaveRemainRecord) {
    setEditingId(record.id);
    setForm({
      userCode: record.userCode,
      year: String(record.year),
      remainingDays: String(record.remainingDays),
    });
    setFormError(null);
    setIsModalOpen(true);
  }

  function closeModal() {
    if (isSaving) {
      return;
    }
    setIsModalOpen(false);
    setFormError(null);
  }

  function getEmployeeDisplay(record: LeaveRemainRecord): string {
    if (record.employeeName) {
      return `${record.employeeName} (${record.userCode})`;
    }

    const employee = employees.find((item) => item.code === record.userCode);
    if (!employee) {
      return record.userCode;
    }

    return `${employee.name} (${employee.code})`;
  }

  function buildPayload(): LeaveRemainPayload | null {
    const year = Number(form.year);
    const remainingDays = Number(form.remainingDays);

    if (!form.userCode) {
      setFormError('Vui long chon nhan vien');
      return null;
    }

    if (!Number.isInteger(year) || year < 2000 || year > 2100) {
      setFormError('Nam khong hop le');
      return null;
    }

    if (!Number.isFinite(remainingDays) || remainingDays < 0) {
      setFormError('So ngay phep ton phai lon hon hoac bang 0');
      return null;
    }

    return {
      userCode: form.userCode,
      year,
      remainingDays,
    };
  }

  async function handleSave(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const payload = buildPayload();
    if (!payload) {
      return;
    }

    setIsSaving(true);
    setFormError(null);

    try {
      if (editingId === null) {
        await createLeaveRemain(payload);
      } else {
        await updateLeaveRemain(editingId, payload);
      }

      setIsModalOpen(false);
      await loadRecords();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Khong the luu du lieu');
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete(record: LeaveRemainRecord) {
    const confirmed = window.confirm(`Xoa phep ton cua ${getEmployeeDisplay(record)} nam ${record.year}?`);
    if (!confirmed) {
      return;
    }

    setIsDeletingId(record.id);
    setError(null);

    try {
      await deleteLeaveRemain(record.id);
      await loadRecords();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Khong the xoa du lieu');
    } finally {
      setIsDeletingId(null);
    }
  }

  async function handleSearch(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await loadRecords(query, yearFilter);
  }

  const stats = useMemo(() => {
    const totalRecords = records.length;
    const currentYear = new Date().getFullYear();
    const currentYearRecords = records.filter((item) => item.year === currentYear).length;
    const totalRemainingDays = records.reduce((sum, item) => sum + item.remainingDays, 0);

    return {
      totalRecords,
      currentYearRecords,
      totalRemainingDays,
    };
  }, [records]);

  if (!isAdmin) {
    return (
      <div className="px-4 pt-6 pb-6">
        <div className="rounded-xl border border-primary-200 bg-primary-50 px-4 py-3 text-sm text-primary-700">
          Ban khong co quyen truy cap trang quan ly phep ton.
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background-100 via-background-50 to-accent-50/60 p-3 md:p-6">
      <div className="mx-auto max-w-[1320px] rounded-3xl border border-background-200/70 bg-background-50 shadow-[0_28px_70px_rgba(15,23,42,0.12)] overflow-hidden">
        <div className="grid md:grid-cols-[240px_1fr] min-h-[760px]">
          <AdminSidebar />

          <section className="p-4 md:p-6 lg:p-7 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.9),rgba(255,255,255,0.65))] min-w-0">
            <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <span className="h-11 w-11 rounded-2xl bg-accent-500 text-white flex items-center justify-center shadow-[0_10px_25px_rgba(16,185,129,0.35)]">
                  <i className="ri-calendar-check-line text-xl"></i>
                </span>
                <div>
                  <h1 className="text-2xl font-heading font-bold text-foreground-900">Quan ly phep ton</h1>
                  <p className="text-sm text-foreground-500 mt-1">CRUD du lieu so ngay nghi con lai theo nhan vien va nam</p>
                </div>
              </div>

              <div className="flex items-center gap-2 w-full md:w-auto justify-end">
                <Link to="/dashboard" className="rounded-xl border border-background-200 px-3 py-2 text-sm text-foreground-700 hover:bg-background-100">
                  Ve dashboard
                </Link>
                <button
                  onClick={openCreateModal}
                  className="rounded-xl bg-primary-500 px-3.5 py-2 text-sm font-medium text-white hover:bg-primary-600"
                >
                  Them phep ton
                </button>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3 mb-4">
              <MiniStat title="Tong ban ghi" value={stats.totalRecords} icon="ri-database-2-line" tone="primary" />
              <MiniStat title="Ban ghi nam nay" value={stats.currentYearRecords} icon="ri-calendar-line" tone="accent" />
              <MiniStat title="Tong ngay con lai" value={stats.totalRemainingDays.toFixed(1)} icon="ri-time-line" tone="secondary" />
            </div>

            <div className="rounded-2xl border border-background-200 bg-background-50 p-4 shadow-sm">
              <form onSubmit={handleSearch} className="mb-4 flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-2 rounded-xl border border-background-200 bg-background-50 px-2 py-1.5 flex-1 min-w-[220px]">
                  <i className="ri-search-line text-foreground-400 pl-1"></i>
                  <input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Tim theo ma NV, ten, phong ban"
                    className="w-full bg-transparent px-2 py-1 text-sm outline-none"
                  />
                </div>
                <input
                  type="number"
                  value={yearFilter}
                  onChange={(event) => setYearFilter(event.target.value)}
                  placeholder="Loc theo nam"
                  className="w-[140px] rounded-xl border border-background-200 bg-background-50 px-3 py-2 text-sm"
                />
                <button type="submit" className="rounded-xl border border-background-200 px-3 py-2 text-sm hover:bg-background-100">
                  Loc
                </button>
              </form>

              {isLoading && (
                <div className="space-y-2">
                  <div className="skeleton h-10"></div>
                  <div className="skeleton h-10"></div>
                  <div className="skeleton h-10"></div>
                </div>
              )}

              {!isLoading && error && (
                <div className="rounded-xl border border-red-200 bg-red-50 text-red-700 px-4 py-3 text-sm">{error}</div>
              )}

              {!isLoading && !error && (
                <div className="overflow-x-auto pb-1">
                  <table className="w-full min-w-[920px] text-sm">
                    <thead>
                      <tr className="text-left text-foreground-500 border-b border-background-200 bg-background-50">
                        <th className="py-2.5 pr-4 font-medium">Nhan vien</th>
                        <th className="py-2.5 pr-4 font-medium">Phong ban</th>
                        <th className="py-2.5 pr-4 font-medium">Chuc vu</th>
                        <th className="py-2.5 pr-4 font-medium">Nam</th>
                        <th className="py-2.5 pr-4 font-medium">Ngay con lai</th>
                        <th className="py-2.5 pr-4 font-medium">Cap nhat</th>
                        <th className="py-2.5 font-medium text-center">Thao tac</th>
                      </tr>
                    </thead>
                    <tbody>
                      {records.map((record) => (
                        <tr key={record.id} className="border-b border-background-100 odd:bg-background-50 even:bg-background-100/40 hover:bg-accent-50/50 transition-colors">
                          <td className="py-2.5 pr-4 text-foreground-900 font-medium">{getEmployeeDisplay(record)}</td>
                          <td className="py-2.5 pr-4 text-foreground-600">{record.department || '-'}</td>
                          <td className="py-2.5 pr-4 text-foreground-600">{record.position || '-'}</td>
                          <td className="py-2.5 pr-4 text-foreground-700">{record.year}</td>
                          <td className="py-2.5 pr-4 text-foreground-700">{record.remainingDays}</td>
                          <td className="py-2.5 pr-4 text-foreground-600">{formatDateTime(record.updatedAt)}</td>
                          <td className="py-2.5 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => openEditModal(record)}
                                className="inline-flex items-center gap-1 rounded-lg border border-background-200 px-2.5 py-1.5 text-xs text-foreground-700 hover:bg-background-100 transition-colors"
                              >
                                <i className="ri-edit-line"></i>
                                Sua
                              </button>
                              <button
                                onClick={() => void handleDelete(record)}
                                disabled={isDeletingId === record.id}
                                className="inline-flex items-center gap-1 rounded-lg border border-red-200 px-2.5 py-1.5 text-xs text-red-600 hover:bg-red-50 transition-colors disabled:opacity-60"
                              >
                                <i className="ri-delete-bin-line"></i>
                                {isDeletingId === record.id ? 'Dang xoa...' : 'Xoa'}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-foreground-950/40 backdrop-blur-[2px] p-4">
          <form onSubmit={handleSave} className="w-full max-w-lg rounded-2xl border border-background-200 bg-background-50 p-5 md:p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-foreground-900">{editingId === null ? 'Them phep ton' : 'Cap nhat phep ton'}</h2>
              <button type="button" onClick={closeModal} className="rounded-lg border border-background-200 px-2.5 py-1 text-sm">
                Dong
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-foreground-700 mb-1">Nhan vien</label>
                <select
                  value={form.userCode}
                  onChange={(event) => setForm((prev) => ({ ...prev, userCode: event.target.value }))}
                  className="w-full rounded-xl border border-background-200 bg-background-50 px-3 py-2.5 text-sm"
                >
                  <option value="">Chon nhan vien</option>
                  {employees.map((employee) => (
                    <option key={employee.code} value={employee.code}>
                      {employee.name} ({employee.code})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-foreground-700 mb-1">Nam</label>
                  <input
                    type="number"
                    min={2000}
                    max={2100}
                    value={form.year}
                    onChange={(event) => setForm((prev) => ({ ...prev, year: event.target.value }))}
                    className="w-full rounded-xl border border-background-200 bg-background-50 px-3 py-2.5 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground-700 mb-1">Ngay phep con lai</label>
                  <input
                    type="number"
                    min={0}
                    step="0.5"
                    value={form.remainingDays}
                    onChange={(event) => setForm((prev) => ({ ...prev, remainingDays: event.target.value }))}
                    className="w-full rounded-xl border border-background-200 bg-background-50 px-3 py-2.5 text-sm"
                  />
                </div>
              </div>

              {formError && (
                <div className="rounded-xl border border-red-200 bg-red-50 text-red-700 px-3 py-2 text-sm">{formError}</div>
              )}
            </div>

            <div className="mt-5 flex items-center justify-end gap-2">
              <button type="button" onClick={closeModal} className="rounded-xl border border-background-200 px-3 py-2 text-sm hover:bg-background-100">
                Huy
              </button>
              <button type="submit" disabled={isSaving} className="rounded-xl bg-primary-500 px-3.5 py-2 text-sm font-medium text-white hover:bg-primary-600 disabled:opacity-60">
                {isSaving ? 'Dang luu...' : editingId === null ? 'Tao moi' : 'Cap nhat'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

function formatDateTime(value: string | null): string {
  if (!value) {
    return '-';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '-';
  }

  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')} ${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;
}

type MiniStatProps = {
  title: string;
  value: number | string;
  icon: string;
  tone: 'primary' | 'accent' | 'secondary';
};

function MiniStat({ title, value, icon, tone }: MiniStatProps) {
  const toneMap: Record<MiniStatProps['tone'], { iconBg: string; iconText: string; valueText: string }> = {
    primary: {
      iconBg: 'bg-primary-100',
      iconText: 'text-primary-600',
      valueText: 'text-primary-700',
    },
    accent: {
      iconBg: 'bg-accent-100',
      iconText: 'text-accent-600',
      valueText: 'text-accent-700',
    },
    secondary: {
      iconBg: 'bg-secondary-100',
      iconText: 'text-secondary-600',
      valueText: 'text-secondary-700',
    },
  };

  const palette = toneMap[tone];

  return (
    <article className="rounded-2xl border border-background-200 bg-background-50 p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-foreground-500">{title}</p>
          <p className={`mt-1 text-2xl font-heading font-bold ${palette.valueText}`}>{value}</p>
        </div>
        <span className={`h-10 w-10 rounded-xl ${palette.iconBg} ${palette.iconText} flex items-center justify-center`}>
          <i className={`${icon} text-lg`}></i>
        </span>
      </div>
    </article>
  );
}
