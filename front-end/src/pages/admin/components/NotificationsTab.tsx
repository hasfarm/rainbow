import React from 'react';
import { useState, useMemo, useRef } from 'react';
import { mockNotifications, priorityLabels, priorityColors } from '@/mocks/notifications';
import { exportToExcel, importFromExcel } from '@/utils/excel';
import type { Notification } from '@/mocks/notifications';

export default function NotificationsTab() {
  const [items, setItems] = useState<Notification[]>(mockNotifications);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'announcement' | 'private'>('all');
  const [priorityFilter, setPriorityFilter] = useState<Notification['priority'] | 'all'>('all');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [importMsg, setImportMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState({
    title: '',
    content: '',
    type: 'announcement' as 'announcement' | 'private',
    priority: 'normal' as Notification['priority'],
  });
  const [saved, setSaved] = useState(false);

  const filtered = useMemo(() => {
    let list = [...items];
    if (typeFilter !== 'all') list = list.filter((r) => r.type === typeFilter);
    if (priorityFilter !== 'all') list = list.filter((r) => r.priority === priorityFilter);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((r) =>
        r.title.toLowerCase().includes(q) ||
        r.content.toLowerCase().includes(q) ||
        r.senderName.toLowerCase().includes(q)
      );
    }
    return list.sort((a, b) => (a.date > b.date ? -1 : 1));
  }, [items, search, typeFilter, priorityFilter]);

  const stats = {
    total: items.length,
    announcement: items.filter((r) => r.type === 'announcement').length,
    private: items.filter((r) => r.type === 'private').length,
    unread: items.filter((r) => !r.isRead).length,
  };

  const handleExport = () => {
    const exportData = filtered.map((r) => ({
      'Tiêu đề': r.title || '(Tin nhắn riêng)',
      'Loại': r.type === 'announcement' ? 'Thông báo chung' : 'Tin nhắn riêng',
      'Nội dung': r.content,
      'Người gửi': r.senderName,
      'Ngày': r.date.slice(0, 10),
      'Mức độ': priorityLabels[r.priority],
      'Đã đọc': r.isRead ? 'Có' : 'Không',
    }));
    exportToExcel(exportData, `thong-bao-${new Date().toISOString().slice(0, 10)}`);
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const imported = await importFromExcel(file);
      const newItems: Notification[] = imported.map((row: Record<string, unknown>, idx: number) => ({
        id: `notif-imp-${Date.now()}-${idx}`,
        type: 'announcement' as const,
        title: String(row['Tiêu đề'] || row['title'] || ''),
        content: String(row['Nội dung'] || row['content'] || ''),
        senderName: 'Admin',
        senderPosition: 'Quản trị viên',
        senderAvatar: '',
        recipientId: null,
        date: new Date().toISOString(),
        isRead: false,
        priority: 'normal' as const,
      })).filter((r) => r.title || r.content);
      if (newItems.length === 0) {
        setImportMsg({ type: 'error', text: 'File không có dữ liệu hợp lệ.' });
        return;
      }
      setItems((prev) => [...newItems, ...prev]);
      setImportMsg({ type: 'success', text: `Đã import thành công ${newItems.length} thông báo.` });
    } catch {
      setImportMsg({ type: 'error', text: 'Lỗi đọc file. Vui lòng kiểm tra định dạng Excel.' });
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
    setTimeout(() => setImportMsg(null), 3000);
  };

  const openAdd = () => {
    setEditingId(null);
    setForm({ title: '', content: '', type: 'announcement', priority: 'normal' });
    setShowModal(true);
  };

  const openEdit = (item: Notification) => {
    setEditingId(item.id);
    setForm({
      title: item.title,
      content: item.content,
      type: item.type,
      priority: item.priority,
    });
    setShowModal(true);
  };

  const handleSave = () => {
    if (!form.title.trim() || !form.content.trim()) return;
    if (editingId) {
      setItems((prev) =>
        prev.map((i) =>
          i.id === editingId
            ? { ...i, title: form.title, content: form.content, type: form.type, priority: form.priority }
            : i,
        ),
      );
    } else {
      const newItem: Notification = {
        id: `notif-${Date.now()}`,
        type: form.type,
        title: form.title,
        content: form.content,
        senderName: 'Admin',
        senderPosition: 'Quản trị viên',
        senderAvatar: '',
        recipientId: null,
        date: new Date().toISOString(),
        isRead: false,
        priority: form.priority,
      };
      setItems((prev) => [newItem, ...prev]);
    }
    setShowModal(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleDelete = () => {
    if (!deleteId) return;
    setItems((prev) => prev.filter((i) => i.id !== deleteId));
    setDeleteId(null);
  };

  const toggleRead = (id: string) => {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, isRead: !i.isRead } : i)));
  };

  return (
    <div className="space-y-4 lg:space-y-5">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
        {[
          { label: 'Tổng thông báo', value: stats.total, icon: 'ri-notification-3-line', color: 'bg-primary-500' },
          { label: 'Thông báo chung', value: stats.announcement, icon: 'ri-megaphone-line', color: 'bg-accent-500' },
          { label: 'Tin nhắn riêng', value: stats.private, icon: 'ri-message-3-line', color: 'bg-secondary-500' },
          { label: 'Chưa đọc', value: stats.unread, icon: 'ri-mail-unread-line', color: 'bg-foreground-400' },
        ].map((s) => (
          <div key={s.label} className="bg-background-50 border border-background-200/70 rounded-xl p-3 lg:p-4">
            <div className="flex items-center gap-2.5">
              <span className={`w-8 h-8 ${s.color} rounded-lg flex items-center justify-center flex-shrink-0`}>
                <i className={`${s.icon} text-sm text-white`}></i>
              </span>
              <div>
                <p className="text-xs text-foreground-500">{s.label}</p>
                <p className="text-lg font-bold text-foreground-950">{s.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters + Add */}
      <div className="bg-background-50 border border-background-200/70 rounded-xl p-3 lg:p-4">
        {importMsg && (
          <div className={`flex items-center gap-2 text-sm rounded-lg px-4 py-2 mb-3 ${importMsg.type === 'success' ? 'text-accent-700 bg-accent-100' : 'text-red-700 bg-red-100'}`}>
            <i className={importMsg.type === 'success' ? 'ri-check-line' : 'ri-error-warning-line'}></i>
            {importMsg.text}
          </div>
        )}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-foreground-400 text-sm"></i>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm theo tiêu đề, nội dung, người gửi..."
              className="w-full h-10 pl-9 pr-3 rounded-lg border border-background-200/70 bg-background-50 text-sm text-foreground-900 focus:outline-none focus:border-primary-400"
            />
          </div>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as 'all' | 'announcement' | 'private')}
            className="h-10 px-3 rounded-lg border border-background-200/70 bg-background-50 text-sm text-foreground-900 focus:outline-none focus:border-primary-400 cursor-pointer"
          >
            <option value="all">Tất cả loại</option>
            <option value="announcement">Thông báo chung</option>
            <option value="private">Tin nhắn riêng</option>
          </select>
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value as Notification['priority'] | 'all')}
            className="h-10 px-3 rounded-lg border border-background-200/70 bg-background-50 text-sm text-foreground-900 focus:outline-none focus:border-primary-400 cursor-pointer"
          >
            <option value="all">Tất cả mức độ</option>
            <option value="normal">Thường</option>
            <option value="important">Quan trọng</option>
            <option value="urgent">Khẩn</option>
          </select>
          <div className="flex items-center gap-2">
            <button
              onClick={handleExport}
              className="h-10 px-3 rounded-lg border border-accent-200/70 bg-accent-100 text-accent-700 text-sm font-medium cursor-pointer whitespace-nowrap hover:bg-accent-200 transition-colors flex items-center gap-1.5"
            >
              <i className="ri-download-line"></i>
              <span>Export</span>
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="h-10 px-3 rounded-lg border border-secondary-200/70 bg-secondary-100 text-secondary-700 text-sm font-medium cursor-pointer whitespace-nowrap hover:bg-secondary-200 transition-colors flex items-center gap-1.5"
            >
              <i className="ri-upload-line"></i>
              <span>Import</span>
            </button>
            <input ref={fileInputRef} type="file" accept=".xlsx,.xls" onChange={handleImport} className="hidden" />
            <button
              onClick={openAdd}
              className="h-10 px-4 bg-primary-500 text-white rounded-lg flex items-center gap-1.5 whitespace-nowrap cursor-pointer text-sm font-medium hover:bg-primary-600 transition-colors"
            >
              <i className="ri-add-line"></i>
              <span>Thêm mới</span>
            </button>
          </div>
        </div>
      </div>

      {/* Saved toast */}
      {saved && (
        <div className="flex items-center gap-2 text-sm text-accent-700 bg-accent-100 rounded-lg px-4 py-2">
          <i className="ri-check-line"></i>
          Đã lưu thành công
        </div>
      )}

      {/* Desktop Table */}
      <div className="hidden lg:block bg-background-50 border border-background-200/70 rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-background-100/50 border-b border-background-200/70">
              <th className="text-left text-xs font-semibold text-foreground-600 px-4 py-3">Tiêu đề</th>
              <th className="text-left text-xs font-semibold text-foreground-600 px-4 py-3">Loại</th>
              <th className="text-left text-xs font-semibold text-foreground-600 px-4 py-3">Người gửi</th>
              <th className="text-left text-xs font-semibold text-foreground-600 px-4 py-3">Ngày</th>
              <th className="text-left text-xs font-semibold text-foreground-600 px-4 py-3">Mức độ</th>
              <th className="text-left text-xs font-semibold text-foreground-600 px-4 py-3">Đã đọc</th>
              <th className="text-right text-xs font-semibold text-foreground-600 px-4 py-3">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((item) => (
              <tr key={item.id} className={`border-b border-background-200/70 last:border-0 hover:bg-background-100/30 transition-colors ${!item.isRead ? 'bg-primary-50/30' : ''}`}>
                <td className="px-4 py-3">
                  <p className="text-sm font-medium text-foreground-950">{item.title || '(Tin nhắn riêng)'}</p>
                  <p className="text-xs text-foreground-500 truncate max-w-[240px]">{item.content}</p>
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${item.type === 'announcement' ? 'bg-accent-100 text-accent-700' : 'bg-secondary-100 text-secondary-700'}`}>
                    <i className={item.type === 'announcement' ? 'ri-megaphone-line' : 'ri-message-3-line'}></i>
                    {item.type === 'announcement' ? 'Thông báo' : 'Tin riêng'}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-foreground-700">{item.senderName}</td>
                <td className="px-4 py-3 text-xs text-foreground-500">{item.date.slice(0, 10)}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${priorityColors[item.priority]}`}>
                    {priorityLabels[item.priority]}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => toggleRead(item.id)}
                    className={`w-7 h-7 rounded-lg flex items-center justify-center cursor-pointer transition-colors ${item.isRead ? 'bg-accent-100 text-accent-600' : 'bg-primary-100 text-primary-600'}`}
                    title={item.isRead ? 'Đánh dấu chưa đọc' : 'Đánh dấu đã đọc'}
                  >
                    <i className={item.isRead ? 'ri-mail-open-line' : 'ri-mail-line'}></i>
                  </button>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      onClick={() => openEdit(item)}
                      className="w-8 h-8 rounded-lg bg-background-100 flex items-center justify-center cursor-pointer hover:bg-secondary-100 transition-colors"
                      title="Sửa"
                    >
                      <i className="ri-edit-line text-sm text-foreground-500"></i>
                    </button>
                    <button
                      onClick={() => setDeleteId(item.id)}
                      className="w-8 h-8 rounded-lg bg-background-100 flex items-center justify-center cursor-pointer hover:bg-red-100 transition-colors"
                      title="Xóa"
                    >
                      <i className="ri-delete-bin-line text-sm text-foreground-500"></i>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="text-center py-10 text-sm text-foreground-400">
            <i className="ri-notification-3-line text-2xl block mb-2"></i>
            Không có thông báo nào
          </div>
        )}
      </div>

      {/* Mobile Cards */}
      <div className="lg:hidden space-y-3">
        {filtered.map((item) => (
          <div key={item.id} className={`bg-background-50 border border-background-200/70 rounded-xl p-3.5 ${!item.isRead ? 'border-l-4 border-l-primary-400' : ''}`}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${item.type === 'announcement' ? 'bg-accent-100 text-accent-700' : 'bg-secondary-100 text-secondary-700'}`}>
                  <i className={item.type === 'announcement' ? 'ri-megaphone-line' : 'ri-message-3-line'}></i>
                </span>
                <span className="text-xs text-foreground-500">{item.date.slice(0, 10)}</span>
              </div>
              <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${priorityColors[item.priority]}`}>
                {priorityLabels[item.priority]}
              </span>
            </div>
            <p className="text-sm font-medium text-foreground-950 mb-1">{item.title || '(Tin nhắn riêng)'}</p>
            <p className="text-xs text-foreground-600 line-clamp-2 mb-2">{item.content}</p>
            <div className="flex items-center justify-between">
              <span className="text-xs text-foreground-500">Gửi bởi: {item.senderName}</span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => toggleRead(item.id)}
                  className={`w-7 h-7 rounded-lg flex items-center justify-center cursor-pointer transition-colors ${item.isRead ? 'bg-accent-100 text-accent-600' : 'bg-primary-100 text-primary-600'}`}
                >
                  <i className={item.isRead ? 'ri-mail-open-line' : 'ri-mail-line'}></i>
                </button>
                <button
                  onClick={() => openEdit(item)}
                  className="w-7 h-7 rounded-lg bg-background-100 flex items-center justify-center cursor-pointer hover:bg-secondary-100 transition-colors"
                >
                  <i className="ri-edit-line text-xs text-foreground-500"></i>
                </button>
                <button
                  onClick={() => setDeleteId(item.id)}
                  className="w-7 h-7 rounded-lg bg-background-100 flex items-center justify-center cursor-pointer hover:bg-red-100 transition-colors"
                >
                  <i className="ri-delete-bin-line text-xs text-foreground-500"></i>
                </button>
              </div>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="text-center py-8 text-sm text-foreground-400">
            <i className="ri-notification-3-line text-2xl block mb-2"></i>
            Không có thông báo nào
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowModal(false)}></div>
          <div className="relative bg-background-50 rounded-2xl w-[90%] max-w-md p-5">
            <div className="flex items-center gap-2.5 mb-4">
              <span className="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center">
                <i className={`${editingId ? 'ri-edit-line' : 'ri-add-line'} text-sm text-primary-500`}></i>
              </span>
              <h3 className="text-sm font-heading font-semibold text-foreground-950">
                {editingId ? 'Sửa thông báo' : 'Thêm thông báo mới'}
              </h3>
            </div>
            <div className="space-y-3 mb-4">
              <div>
                <label className="text-xs font-medium text-foreground-600 mb-1.5 block">Tiêu đề</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="Nhập tiêu đề thông báo"
                  className="w-full h-10 px-3 rounded-lg border border-background-200/70 bg-background-50 text-sm text-foreground-900 focus:outline-none focus:border-primary-400"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-foreground-600 mb-1.5 block">Nội dung</label>
                <textarea
                  value={form.content}
                  onChange={(e) => setForm({ ...form, content: e.target.value })}
                  placeholder="Nhập nội dung thông báo"
                  rows={4}
                  maxLength={500}
                  className="w-full px-3 py-2 rounded-lg border border-background-200/70 bg-background-50 text-sm text-foreground-900 focus:outline-none focus:border-primary-400 resize-none"
                />
                <p className="text-[10px] text-foreground-400 text-right mt-0.5">{form.content.length}/500</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-foreground-600 mb-1.5 block">Loại</label>
                  <select
                    value={form.type}
                    onChange={(e) => setForm({ ...form, type: e.target.value as 'announcement' | 'private' })}
                    className="w-full h-10 px-3 rounded-lg border border-background-200/70 bg-background-50 text-sm text-foreground-900 focus:outline-none focus:border-primary-400 cursor-pointer"
                  >
                    <option value="announcement">Thông báo chung</option>
                    <option value="private">Tin nhắn riêng</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-foreground-600 mb-1.5 block">Mức độ</label>
                  <select
                    value={form.priority}
                    onChange={(e) => setForm({ ...form, priority: e.target.value as Notification['priority'] })}
                    className="w-full h-10 px-3 rounded-lg border border-background-200/70 bg-background-50 text-sm text-foreground-900 focus:outline-none focus:border-primary-400 cursor-pointer"
                  >
                    <option value="normal">Thường</option>
                    <option value="important">Quan trọng</option>
                    <option value="urgent">Khẩn</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 h-10 rounded-lg border border-background-200/70 text-sm font-medium text-foreground-600 cursor-pointer whitespace-nowrap hover:bg-background-100 transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={handleSave}
                disabled={!form.title.trim() || !form.content.trim()}
                className="flex-1 h-10 rounded-lg bg-primary-500 text-white text-sm font-medium cursor-pointer whitespace-nowrap hover:bg-primary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {editingId ? 'Cập nhật' : 'Thêm mới'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {deleteId && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setDeleteId(null)}></div>
          <div className="relative bg-background-50 rounded-2xl w-[90%] max-w-sm p-5">
            <div className="text-center mb-4">
              <span className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <i className="ri-error-warning-line text-xl text-red-500"></i>
              </span>
              <h3 className="text-base font-heading font-semibold text-foreground-950">Xác nhận xóa</h3>
              <p className="text-sm text-foreground-500 mt-1">Thông báo này sẽ bị xóa vĩnh viễn. Bạn có chắc không?</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setDeleteId(null)}
                className="flex-1 h-10 rounded-lg border border-background-200/70 text-sm font-medium text-foreground-600 cursor-pointer whitespace-nowrap hover:bg-background-100 transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 h-10 rounded-lg bg-red-500 text-white text-sm font-medium cursor-pointer whitespace-nowrap hover:bg-red-600 transition-colors"
              >
                Xóa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}