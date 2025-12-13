import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { shippingService, ShippingInfo } from '../../services/shippingService';

const statusOptions = [
  { value: 'pending', label: 'Chờ xử lý' },
  { value: 'processing', label: 'Đang xử lý' },
  { value: 'shipped', label: 'Đã giao cho đơn vị vận chuyển' },
  { value: 'delivered', label: 'Đã giao hàng' },
  { value: 'cancelled', label: 'Đã hủy' }
];

const ShippingUpdate: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const [info, setInfo] = useState<ShippingInfo | null>(null);
  const [form, setForm] = useState({
    shipping_company: '',
    tracking_number: '',
    shipping_status: '',
    shipped_at: '',
    delivered_at: ''
  });
  const [loading, setLoading] = useState(true);
  const [notify, setNotify] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    if (!orderId) return;
    setLoading(true);
    shippingService.getByOrder(Number(orderId))
      .then(data => {
        setInfo(data);
        setForm({
          shipping_company: data?.shipping_company || '',
          tracking_number: data?.tracking_number || '',
          shipping_status: data?.shipping_status || '',
          shipped_at: data?.shipped_at ? data.shipped_at.substring(0, 16) : '',
          delivered_at: data?.delivered_at ? data.delivered_at.substring(0, 16) : ''
        });
        setLoading(false);
      })
      .catch(() => {
        setInfo(null);
        setLoading(false);
      });
  }, [orderId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setNotify('');
    try {
      await shippingService.upsert(Number(orderId), {
        ...form,
        shipped_at: form.shipped_at ? new Date(form.shipped_at).toISOString() : undefined,
        delivered_at: form.delivered_at ? new Date(form.delivered_at).toISOString() : undefined
      });
      setNotify('Cập nhật vận chuyển thành công!');
      setTimeout(() => {
        setNotify('');
        navigate('/shipping-list');
      }, 1200);
    } catch (err: any) {
      setNotify(err.message || 'Cập nhật vận chuyển thất bại');
    }
  };

  if (loading) return <div style={{padding:32}}>Đang tải thông tin vận chuyển...</div>;
  if (!info) return <div style={{padding:32, color:'red'}}>Không tìm thấy thông tin vận chuyển cho đơn hàng này.</div>;

  return (
    <div className="shipping-update-page" style={{maxWidth:480, margin:'32px auto', background:'#fff', borderRadius:8, boxShadow:'0 2px 12px rgba(0,0,0,0.08)', padding:32}}>
      <h2>Cập nhật vận chuyển</h2>
      {notify && (
        <div className="notify-bottom show" style={{background: notify.includes('thành công') ? '#38b000' : '#D32F2F'}}>
          <span className="notify-icon">{notify.includes('thành công') ? '✔' : '✖'}</span>
          <span className="notify-text">{notify}</span>
        </div>
      )}
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Đơn vị vận chuyển</label>
          <input
            type="text"
            name="shipping_company"
            value={form.shipping_company}
            onChange={handleChange}
            required
          />
        </div>
        <div className="form-group">
          <label>Mã vận đơn</label>
          <input
            type="text"
            name="tracking_number"
            value={form.tracking_number}
            onChange={handleChange}
            required
          />
        </div>
        <div className="form-group">
          <label>Trạng thái vận chuyển</label>
          <select
            name="shipping_status"
            value={form.shipping_status}
            onChange={handleChange}
            required
          >
            <option value="">Chọn trạng thái</option>
            {statusOptions.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label>Ngày giao</label>
          <input
            type="datetime-local"
            name="shipped_at"
            value={form.shipped_at}
            onChange={handleChange}
          />
        </div>
        <div className="form-group">
          <label>Ngày nhận</label>
          <input
            type="datetime-local"
            name="delivered_at"
            value={form.delivered_at}
            onChange={handleChange}
          />
        </div>
        <button type="submit" style={{background:'#1976d2', color:'#fff', border:'none', borderRadius:6, padding:'10px 24px', fontWeight:600, cursor:'pointer'}}>
          Cập nhật
        </button>
      </form>
    </div>
  );
};

export default ShippingUpdate;
