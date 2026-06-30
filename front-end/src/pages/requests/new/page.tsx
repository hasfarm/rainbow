import PlaceholderPage from '@/pages/placeholder/page';

export default function RequestsNewPage() {
  return (
    <PlaceholderPage
      title="Tạo đơn đề xuất"
      icon="ri-file-add-line"
      description="Tạo đơn đề xuất mới: chọn loại đơn, nhập số tiền, mô tả và gửi lên cấp trên phê duyệt."
      phase={2}
    />
  );
}