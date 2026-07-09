import { AdminSidebar } from '@/components/feature/AdminSidebar';
import { AuthContext } from '@/hooks/useAuth';
import { useContext, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

type Employee = {
  id: number;
  employee_code: string | null;
  name: string;
  email: string;
  role: string | null;
  phone: string | null;
  department: string | null;
  position: string | null;
  working_status: string | null;
  employee_type: 'official' | 'probation' | null;
  gender: 'male' | 'female' | null;
  annual_leave: number | null;
  join_date: string | null;
  official_working_date: string | null;
  current_salary: number | null;
};

type EmployeeForm = {
  employee_code: string;
  name: string;
  email: string;
  password: string;
  role: string;
  phone: string;
  department: string;
  position: string;
  working_status: string;
  employee_type: '' | 'official' | 'probation';
  gender: '' | 'male' | 'female';
  annual_leave: string;
  join_date: string;
  official_working_date: string;
  current_salary: string;
};

const emptyForm: EmployeeForm = {
  employee_code: '',
  name: '',
  email: '',
  password: '',
  role: 'staff',
  phone: '',
  department: '',
  position: '',
  working_status: '',
  employee_type: '',
  gender: '',
  annual_leave: '0',
  join_date: '',
  official_working_date: '',
  current_salary: '',
};

function getAuthHeaders(extra?: HeadersInit): HeadersInit {
  const token = localStorage.getItem('hrm_auth_token');

  return {
    Accept: 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(extra ?? {}),
  };
}

export default function EmployeesPage() {
  const { user } = useContext(AuthContext);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEmployeeId, setEditingEmployeeId] = useState<number | null>(null);
  const [form, setForm] = useState<EmployeeForm>(emptyForm);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeletingId, setIsDeletingId] = useState<number | null>(null);

  async function loadEmployees(search = '') {
    setIsLoading(true);
    setError(null);

    try {
      const url = new URL('/back-end/public/api/users', window.location.origin);
      url.searchParams.set('per_page', '200');
      if (search.trim() !== '') {
        url.searchParams.set('q', search.trim());
      }

      const response = await fetch(url.toString(), {
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`);
      }

      const payload = (await response.json()) as { data?: Employee[] };
      setEmployees(Array.isArray(payload.data) ? payload.data : []);
    } catch {
      setError('Could not load employees. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadEmployees(query);
  }, []);

  function openCreateModal() {
    setEditingEmployeeId(null);
    setForm(emptyForm);
    setFormError(null);
    setIsModalOpen(true);
  }

  function openEditModal(employee: Employee) {
    setEditingEmployeeId(employee.id);
    setForm({
      employee_code: employee.employee_code ?? '',
      name: employee.name,
      email: employee.email,
      password: '',
      role: employee.role ?? 'staff',
      phone: employee.phone ?? '',
      department: employee.department ?? '',
      position: employee.position ?? '',
      working_status: employee.working_status ?? '',
      employee_type: employee.employee_type ?? '',
      gender: employee.gender ?? '',
      annual_leave: String(employee.annual_leave ?? 0),
      join_date: employee.join_date ?? '',
      official_working_date: employee.official_working_date ?? '',
      current_salary: employee.current_salary == null ? '' : String(employee.current_salary),
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

  async function handleSearch(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await loadEmployees(query);
  }

  async function handleDelete(employee: Employee) {
    const confirmed = window.confirm(`Delete user ${employee.name}?`);
    if (!confirmed) {
      return;
    }

    setIsDeletingId(employee.id);

    try {
      const response = await fetch(`/back-end/public/api/users/${employee.id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error('Delete failed');
      }

      await loadEmployees(query);
    } catch {
      setError('Could not delete user.');
    } finally {
      setIsDeletingId(null);
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
    setIsSaving(true);

    const payload: Record<string, string | number | null> = {
      employee_code: form.employee_code || null,
      name: form.name,
      email: form.email,
      role: form.role || null,
      phone: form.phone || null,
      department: form.department || null,
      position: form.position || null,
      working_status: form.working_status || null,
      employee_type: form.employee_type || null,
      gender: form.gender || null,
      annual_leave: form.annual_leave === '' ? 0 : Number(form.annual_leave),
      join_date: form.join_date || null,
      official_working_date: form.official_working_date || null,
      current_salary: form.current_salary === '' ? null : Number(form.current_salary),
    };

    if (editingEmployeeId === null) {
      payload.password = form.password;
    } else if (form.password.trim() !== '') {
      payload.password = form.password;
    }

    try {
      const url = editingEmployeeId === null
        ? '/back-end/public/api/users'
        : `/back-end/public/api/users/${editingEmployeeId}`;

      const response = await fetch(url, {
        method: editingEmployeeId === null ? 'POST' : 'PUT',
        headers: getAuthHeaders({
          'Content-Type': 'application/json',
        }),
        body: JSON.stringify(payload),
      });

      if (response.status === 422) {
        const body = (await response.json()) as { message?: string; errors?: Record<string, string[]> };
        const firstError = body.errors ? Object.values(body.errors)[0]?.[0] : null;
        throw new Error(firstError || body.message || 'Validation failed');
      }

      if (!response.ok) {
        throw new Error('Save failed');
      }

      setIsModalOpen(false);
      await loadEmployees(query);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Could not save user.');
    } finally {
      setIsSaving(false);
    }
  }

  const stats = useMemo(() => {
    const total = employees.length;
    const official = employees.filter((item) => item.employee_type === 'official').length;
    const probation = employees.filter((item) => item.employee_type === 'probation').length;
    const female = employees.filter((item) => item.gender === 'female').length;

    return { total, official, probation, female };
  }, [employees]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background-100 via-background-50 to-accent-50/60 p-3 md:p-6">
      <div className="mx-auto max-w-[1320px] rounded-3xl border border-background-200/70 bg-background-50 shadow-[0_28px_70px_rgba(15,23,42,0.12)] overflow-hidden">
        <div className="grid md:grid-cols-[240px_1fr] min-h-[760px]">
          <AdminSidebar />

          <section className="p-4 md:p-6 lg:p-7 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.9),rgba(255,255,255,0.65))] min-w-0">
            <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <span className="h-11 w-11 rounded-2xl bg-primary-500 text-white flex items-center justify-center shadow-[0_10px_25px_rgba(244,114,65,0.35)]">
                  <i className="ri-group-line text-xl"></i>
                </span>
                <div>
                  <h1 className="text-2xl font-heading font-bold text-foreground-900">Employee Directory</h1>
                  <p className="text-sm text-foreground-500 mt-1">Manage users from Laravel API connected to MySQL</p>
                </div>
              </div>

              <div className="flex items-center gap-3 w-full md:w-auto justify-end">
                <button className="h-10 w-10 rounded-xl border border-background-200 text-foreground-500 hover:bg-background-100 transition-colors">
                  <i className="ri-notification-3-line"></i>
                </button>
                <Link to="/profile" className="flex items-center gap-2 rounded-xl border border-background-200 bg-background-50 px-3 py-1.5 shadow-sm max-w-full md:max-w-[260px] min-w-0">
                  <span className="h-9 w-9 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center overflow-hidden">
                    {user?.avatar ? (
                      <img src={user.avatar} alt={user.name} className="h-full w-full object-cover" />
                    ) : (
                      <i className="ri-user-line text-lg"></i>
                    )}
                  </span>
                  <span className="min-w-0 hidden sm:block">
                    <span className="block text-sm font-semibold text-foreground-900 truncate">{user?.name ?? 'Staff User'}</span>
                    <span className="block text-[11px] text-foreground-500 truncate">{user?.position ?? 'HR'}</span>
                  </span>
                </Link>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 mb-4">
              <MiniStat title="Total Employees" value={stats.total} icon="ri-team-line" tone="primary" hint="Active records" />
              <MiniStat title="Official" value={stats.official} icon="ri-award-line" tone="accent" hint="Full-time" />
              <MiniStat title="Probation" value={stats.probation} icon="ri-time-line" tone="secondary" hint="Trial period" />
              <MiniStat title="Female" value={stats.female} icon="ri-user-heart-line" tone="foreground" hint="Gender ratio" />
            </div>

            <div className="rounded-2xl border border-background-200 bg-background-50 p-4 shadow-sm">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-semibold text-foreground-900">All users</h3>
                  <p className="text-xs text-foreground-500 mt-0.5">{employees.length} records loaded</p>
                </div>

                <div className="flex items-center gap-2 flex-wrap justify-end w-full sm:w-auto">
                  <form onSubmit={handleSearch} className="flex items-center gap-2 rounded-xl border border-background-200 bg-background-50 px-2 py-1.5 w-full sm:w-auto">
                    <i className="ri-search-line text-foreground-400 pl-1"></i>
                    <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search name, email, code" className="w-full sm:w-[220px] md:w-[260px] bg-transparent px-2 py-1 text-sm outline-none min-w-0" />
                    <button
                      type="submit"
                      className="rounded-lg border border-background-200 px-3 py-1.5 text-sm text-foreground-700 hover:bg-background-100 transition-colors"
                    >
                      Search
                    </button>
                  </form>

                  <button
                    onClick={openCreateModal}
                    className="rounded-xl bg-primary-500 px-3.5 py-2 text-sm font-medium text-white hover:bg-primary-600 w-full sm:w-auto"
                  >
                    Add user
                  </button>
                </div>
              </div>

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
                  <table className="w-full min-w-[1080px] text-sm">
                    <thead>
                      <tr className="text-left text-foreground-500 border-b border-background-200 bg-background-50">
                        <th className="sticky top-0 z-10 bg-background-50 py-2.5 pr-4 font-medium">Code</th>
                        <th className="sticky top-0 z-10 bg-background-50 py-2.5 pr-4 font-medium">Name</th>
                        <th className="sticky top-0 z-10 bg-background-50 py-2.5 pr-4 font-medium">Email</th>
                        <th className="sticky top-0 z-10 bg-background-50 py-2.5 pr-4 font-medium">Phone</th>
                        <th className="sticky top-0 z-10 bg-background-50 py-2.5 pr-4 font-medium">Department</th>
                        <th className="sticky top-0 z-10 bg-background-50 py-2.5 pr-4 font-medium">Position</th>
                        <th className="sticky top-0 z-10 bg-background-50 py-2.5 pr-4 font-medium">Type</th>
                        <th className="sticky top-0 z-10 bg-background-50 py-2.5 pr-4 font-medium">Gender</th>
                        <th className="sticky top-0 z-10 bg-background-50 py-2.5 pr-4 font-medium">Status</th>
                        <th className="sticky top-0 z-10 bg-background-50 py-2.5 pr-4 font-medium">Join Date</th>
                        <th className="sticky top-0 z-10 bg-background-50 py-2.5 font-medium text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {employees.map((employee) => (
                        <tr key={employee.id} className="border-b border-background-100 odd:bg-background-50 even:bg-background-100/40 hover:bg-accent-50/50 transition-colors">
                          <td className="py-3 pr-4 text-foreground-700 whitespace-nowrap">{employee.employee_code ?? '-'}</td>
                          <td className="py-3 pr-4">
                            <div className="flex items-center gap-2.5">
                              <span className="h-8 w-8 rounded-full bg-primary-100 text-primary-700 text-xs font-semibold flex items-center justify-center">
                                {getInitials(employee.name)}
                              </span>
                              <span className="text-foreground-900 font-medium">{employee.name}</span>
                            </div>
                          </td>
                          <td className="py-2.5 pr-4 text-foreground-600 whitespace-nowrap">{employee.email}</td>
                          <td className="py-2.5 pr-4 text-foreground-600 whitespace-nowrap">{employee.phone ?? '-'}</td>
                          <td className="py-2.5 pr-4 text-foreground-600">{employee.department ?? '-'}</td>
                          <td className="py-2.5 pr-4 text-foreground-600">{employee.position ?? '-'}</td>
                          <td className="py-2.5 pr-4">
                            <EmployeeTypeBadge type={employee.employee_type} />
                          </td>
                          <td className="py-2.5 pr-4">
                            <GenderBadge gender={employee.gender} />
                          </td>
                          <td className="py-2.5 pr-4">
                            <StatusBadge status={employee.working_status} />
                          </td>
                          <td className="py-2.5 pr-4 text-foreground-600 whitespace-nowrap">{formatDate(employee.join_date)}</td>
                          <td className="py-2.5 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => openEditModal(employee)}
                                className="inline-flex items-center gap-1 rounded-lg border border-background-200 px-2.5 py-1.5 text-xs text-foreground-700 hover:bg-background-100 transition-colors"
                              >
                                <i className="ri-edit-line"></i>
                                Edit
                              </button>
                              <button
                                onClick={() => void handleDelete(employee)}
                                disabled={isDeletingId === employee.id}
                                className="inline-flex items-center gap-1 rounded-lg border border-red-200 px-2.5 py-1.5 text-xs text-red-600 hover:bg-red-50 transition-colors disabled:opacity-60"
                              >
                                <i className="ri-delete-bin-line"></i>
                                {isDeletingId === employee.id ? 'Deleting...' : 'Delete'}
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

            {isModalOpen && (
              <div className="fixed inset-0 z-[70] flex items-center justify-center bg-foreground-950/40 backdrop-blur-[2px] p-4">
                <form onSubmit={handleSubmit} className="w-full max-w-3xl rounded-2xl border border-background-200 bg-background-50 p-5 md:p-6 shadow-2xl">
                  <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-foreground-900">
                      {editingEmployeeId === null ? 'Create user' : 'Update user'}
                    </h2>
                    <button type="button" onClick={closeModal} className="rounded-lg border border-background-200 px-2.5 py-1 text-sm">
                      Close
                    </button>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2 max-h-[62vh] overflow-y-auto pr-1">
                    <Field label="Employee Code" value={form.employee_code} onChange={(value) => setForm((prev) => ({ ...prev, employee_code: value }))} />
                    <Field label="Name" required value={form.name} onChange={(value) => setForm((prev) => ({ ...prev, name: value }))} />
                    <Field label="Email" required value={form.email} onChange={(value) => setForm((prev) => ({ ...prev, email: value }))} />
                    <Field label={editingEmployeeId === null ? 'Password' : 'Password (optional)'} required={editingEmployeeId === null} type="password" value={form.password} onChange={(value) => setForm((prev) => ({ ...prev, password: value }))} />
                    <Field label="Phone" value={form.phone} onChange={(value) => setForm((prev) => ({ ...prev, phone: value }))} />
                    <Field label="Department" value={form.department} onChange={(value) => setForm((prev) => ({ ...prev, department: value }))} />
                    <Field label="Position" value={form.position} onChange={(value) => setForm((prev) => ({ ...prev, position: value }))} />
                    <Field label="Role" value={form.role} onChange={(value) => setForm((prev) => ({ ...prev, role: value }))} />
                    <Field label="Working Status" value={form.working_status} onChange={(value) => setForm((prev) => ({ ...prev, working_status: value }))} />
                    <SelectField
                      label="Employee Type"
                      value={form.employee_type}
                      onChange={(value) => setForm((prev) => ({ ...prev, employee_type: value as EmployeeForm['employee_type'] }))}
                      options={[
                        { label: 'Select type', value: '' },
                        { label: 'Official', value: 'official' },
                        { label: 'Probation', value: 'probation' },
                      ]}
                    />
                    <SelectField
                      label="Gender"
                      value={form.gender}
                      onChange={(value) => setForm((prev) => ({ ...prev, gender: value as EmployeeForm['gender'] }))}
                      options={[
                        { label: 'Select gender', value: '' },
                        { label: 'Male', value: 'male' },
                        { label: 'Female', value: 'female' },
                      ]}
                    />
                    <Field label="Annual Leave" type="number" value={form.annual_leave} onChange={(value) => setForm((prev) => ({ ...prev, annual_leave: value }))} />
                    <Field label="Join Date" type="date" value={form.join_date} onChange={(value) => setForm((prev) => ({ ...prev, join_date: value }))} />
                    <Field label="Official Date" type="date" value={form.official_working_date} onChange={(value) => setForm((prev) => ({ ...prev, official_working_date: value }))} />
                    <Field label="Current Salary" type="number" value={form.current_salary} onChange={(value) => setForm((prev) => ({ ...prev, current_salary: value }))} />
                  </div>

                  {formError && (
                    <p className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{formError}</p>
                  )}

                  <div className="mt-4 flex justify-end">
                    <button
                      type="submit"
                      disabled={isSaving}
                      className="rounded-xl bg-primary-500 px-4 py-2 text-sm font-medium text-white hover:bg-primary-600 disabled:opacity-70"
                    >
                      {isSaving ? 'Saving...' : editingEmployeeId === null ? 'Create user' : 'Update user'}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = 'text',
  required = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
}) {
  return (
    <label className="flex flex-col gap-1.5 text-xs text-foreground-600">
      <span className="font-medium">{label}</span>
      <input
        required={required}
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="rounded-xl border border-background-200 bg-background-50 px-3 py-2 text-sm text-foreground-900 outline-none focus:border-primary-300 focus:ring-2 focus:ring-primary-100"
      />
    </label>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ label: string; value: string }>;
}) {
  return (
    <label className="flex flex-col gap-1.5 text-xs text-foreground-600">
      <span className="font-medium">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="rounded-xl border border-background-200 bg-background-50 px-3 py-2 text-sm text-foreground-900 outline-none focus:border-primary-300 focus:ring-2 focus:ring-primary-100"
      >
        {options.map((option) => (
          <option key={option.value || 'empty'} value={option.value}>{option.label}</option>
        ))}
      </select>
    </label>
  );
}

function MiniStat({ title, value, icon, tone, hint }: { title: string; value: number; icon: string; tone: 'primary' | 'accent' | 'secondary' | 'foreground'; hint: string }) {
  const toneMap = {
    primary: 'bg-primary-500 text-white shadow-[0_8px_20px_rgba(244,114,65,0.35)]',
    accent: 'bg-accent-500 text-white shadow-[0_8px_20px_rgba(20,184,166,0.28)]',
    secondary: 'bg-secondary-500 text-white shadow-[0_8px_20px_rgba(234,179,8,0.24)]',
    foreground: 'bg-foreground-800 text-white shadow-[0_8px_20px_rgba(15,23,42,0.3)]',
  };

  return (
    <div className="rounded-2xl border border-background-200 bg-background-50 p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-xs text-foreground-500">{title}</p>
        <span className={`h-8 w-8 rounded-xl flex items-center justify-center ${toneMap[tone]}`}>
          <i className={icon}></i>
        </span>
      </div>
      <p className="text-2xl font-bold text-foreground-900">{value}</p>
      <p className="text-xs text-foreground-500 mt-1">{hint}</p>
    </div>
  );
}

function EmployeeTypeBadge({ type }: { type: Employee['employee_type'] }) {
  if (type === 'official') {
    return <span className="rounded-full bg-accent-100 px-2.5 py-1 text-[11px] font-semibold text-accent-700">Official</span>;
  }

  if (type === 'probation') {
    return <span className="rounded-full bg-secondary-100 px-2.5 py-1 text-[11px] font-semibold text-secondary-700">Probation</span>;
  }

  return <span className="rounded-full bg-background-100 px-2.5 py-1 text-[11px] font-semibold text-foreground-500">N/A</span>;
}

function GenderBadge({ gender }: { gender: Employee['gender'] }) {
  if (gender === 'female') {
    return <span className="rounded-full bg-pink-100 px-2.5 py-1 text-[11px] font-semibold text-pink-700">Female</span>;
  }

  if (gender === 'male') {
    return <span className="rounded-full bg-sky-100 px-2.5 py-1 text-[11px] font-semibold text-sky-700">Male</span>;
  }

  return <span className="rounded-full bg-background-100 px-2.5 py-1 text-[11px] font-semibold text-foreground-500">N/A</span>;
}

function StatusBadge({ status }: { status: string | null }) {
  const normalized = (status ?? '').toLowerCase();

  if (normalized.includes('dang') || normalized.includes('active')) {
    return <span className="rounded-full bg-accent-100 px-2.5 py-1 text-[11px] font-semibold text-accent-700">Active</span>;
  }

  if (status) {
    return <span className="rounded-full bg-secondary-100 px-2.5 py-1 text-[11px] font-semibold text-secondary-700">{status}</span>;
  }

  return <span className="rounded-full bg-background-100 px-2.5 py-1 text-[11px] font-semibold text-foreground-500">-</span>;
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const first = parts[0]?.[0] ?? '';
  const last = parts.length > 1 ? parts[parts.length - 1][0] : '';
  return (first + last).toUpperCase() || 'U';
}

function formatDate(value: string | null): string {
  if (!value) {
    return '-';
  }

  return value.includes('T') ? value.split('T')[0] : value;
}
