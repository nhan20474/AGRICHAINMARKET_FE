import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';

const PaymentResult = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState('processing');
  const [message, setMessage] = useState('Đang xác thực thanh toán...');

  useEffect(() => {
    const verifyPayment = async () => {
      const isSuccessRoute = location.pathname.includes('success');
      
      // MoMo trả về orderId trong URL params
      const momoOrderId = searchParams.get('orderId');
      const resultCode = searchParams.get('resultCode');
      const extraData = searchParams.get('extraData');

      // Parse order_id từ orderInfo (format: "Thanh toán đơn hàng #36")
      const orderInfo = searchParams.get('orderInfo');
      const orderIdMatch = orderInfo?.match(/#(\d+)/);
      const realOrderId = orderIdMatch ? orderIdMatch[1] : null;

      console.log('🔍 Payment callback params:', { 
        momoOrderId, 
        resultCode, 
        orderInfo, 
        realOrderId, 
        isSuccessRoute 
      });

      if (!realOrderId) {
        setStatus('failed');
        setMessage('Không tìm thấy mã đơn hàng');
        return;
      }

      // Nếu resultCode != 0 thì thanh toán thất bại
      if (resultCode !== '0') {
        setStatus('failed');
        setMessage('Thanh toán đã bị hủy hoặc thất bại');
        return;
      }

      try {
        // Gọi API verify thanh toán - chỉ gửi order_id
        const response = await fetch('http://localhost:3000/api/payments/momo/verify', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            order_id: parseInt(realOrderId) // Chỉ gửi order_id
          })
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.error('❌ API Error:', errorData);
          
          // Nếu 404 và đã paid, có thể là payment đã xử lý
          if (response.status === 404 && errorData.isPaid === false) {
            throw new Error('Không tìm thấy thông tin thanh toán. Vui lòng liên hệ hỗ trợ.');
          }
          
          throw new Error(`HTTP ${response.status}: ${errorData.error || 'Unknown error'}`);
        }

        const data = await response.json();
        console.log('✅ Verify response:', data);

        if (data.success && data.isPaid) {
          setStatus('success');
          setMessage('Thanh toán thành công! Đơn hàng của bạn đã được xác nhận.');
        } else if (data.payment_status === 'pending') {
          setStatus('pending');
          setMessage('Giao dịch đang được xử lý. Vui lòng kiểm tra lại sau.');
        } else {
          setStatus('failed');
          setMessage(data.message || 'Thanh toán thất bại');
        }
      } catch (error) {
        console.error('Verify payment error:', error);
        setStatus('failed');
        setMessage(`Có lỗi xảy ra: ${error.message}`);
      }
    };

    verifyPayment();
  }, [location, searchParams]);

  const getStatusIcon = () => {
    switch (status) {
      case 'success': return '✅';
      case 'failed': return '❌';
      case 'pending': return '⏳';
      default: return '🔄';
    }
  };

  const getStatusTitle = () => {
    switch (status) {
      case 'success': return 'Thanh toán thành công!';
      case 'failed': return 'Thanh toán thất bại';
      case 'pending': return 'Đang xử lý...';
      default: return 'Đang xác thực...';
    }
  };

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center', 
      minHeight: '100vh',
      padding: '20px',
      backgroundColor: '#f5f5f5'
    }}>
      <div style={{
        backgroundColor: 'white',
        padding: '40px',
        borderRadius: '8px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        textAlign: 'center',
        maxWidth: '500px'
      }}>
        <div style={{ fontSize: '64px', marginBottom: '20px' }}>
          {getStatusIcon()}
        </div>
        <h1 style={{ marginBottom: '16px' }}>{getStatusTitle()}</h1>
        <p style={{ color: '#666', marginBottom: '24px' }}>{message}</p>
        
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
          <button 
            onClick={() => navigate('/order-history')}
            style={{ 
              padding: '12px 24px', 
              cursor: 'pointer',
              backgroundColor: '#1890ff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              fontSize: '16px'
            }}
          >
            Xem đơn hàng
          </button>
          <button 
            onClick={() => navigate('/shop')}
            style={{ 
              padding: '12px 24px', 
              cursor: 'pointer',
              backgroundColor: '#fff',
              color: '#1890ff',
              border: '1px solid #1890ff',
              borderRadius: '4px',
              fontSize: '16px'
            }}
          >
            Tiếp tục mua sắm
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentResult;
