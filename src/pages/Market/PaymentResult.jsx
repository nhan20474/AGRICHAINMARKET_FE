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
      // Support both MoMo and VNPay callbacks.
      // VNPay returns query params like vnp_ResponseCode, vnp_TxnRef, vnp_OrderInfo
      const vnpResponse = searchParams.get('vnp_ResponseCode');
      const vnpTxnRef = searchParams.get('vnp_TxnRef');
      const vnpOrderInfo = searchParams.get('vnp_OrderInfo');

      // MoMo params
      const momoOrderId = searchParams.get('orderId');
      const resultCode = searchParams.get('resultCode');
      const orderInfo = searchParams.get('orderInfo') || vnpOrderInfo;

      // Try to parse order_id from orderInfo like "Thanh toan don hang #123" or "Thanh toán đơn hàng #123"
      const orderIdMatch = orderInfo?.match(/#(\d+)/);
      let realOrderId = orderIdMatch ? orderIdMatch[1] : (momoOrderId || null);

      // Fallback: check sessionStorage (FE saved pending order before redirect)
      if (!realOrderId) {
        const pending = sessionStorage.getItem('pending_payment_order') || sessionStorage.getItem('pendingOrder');
        if (pending) {
          try {
            const parsed = pending.startsWith('{') ? JSON.parse(pending) : { order_id: pending };
            realOrderId = parsed.order_id ? String(parsed.order_id) : (parsed || null);
          } catch (e) {
            realOrderId = pending;
          }
        }
      }

      console.log('🔍 Payment callback params:', {
        vnpResponse, vnpTxnRef, vnpOrderInfo, momoOrderId, resultCode, orderInfo, realOrderId
      });

      if (!realOrderId) {
        setStatus('failed');
        setMessage('Không tìm thấy mã đơn hàng. Vui lòng kiểm tra Lịch sử đơn hàng hoặc liên hệ hỗ trợ.');
        return;
      }

      // If MoMo and resultCode indicates failure
      if (resultCode && resultCode !== '0') {
        setStatus('failed');
        setMessage('Thanh toán đã bị hủy hoặc thất bại');
        return;
      }

      // For VNPay we will poll status endpoint, for MoMo we call verify endpoint
      try {
        if (vnpResponse || searchParams.get('code')) {
          // If VNPay returned an error page (e.g. code=70) we still attempt polling using stored orderId
          const codeParam = searchParams.get('code');
          if (codeParam) {
            console.warn('VNPay returned error code:', codeParam);
            setMessage(`VNPay trả về lỗi (code=${codeParam}). Đang kiểm tra trạng thái đơn hàng...`);
          }

          // VNPay flow: start polling status until paid/failed
          let attempts = 0;
          const maxAttempts = 20;
          const interval = 3000;

          const poll = async () => {
            attempts++;
            try {
              const resp = await fetch(`http://localhost:3000/api/payments/status/${realOrderId}`);
              if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
              const j = await resp.json();
              if (j.payment_status === 'paid') {
                setStatus('success');
                setMessage('Thanh toán thành công! Đơn hàng đã được xác nhận.');
                // cleanup pending keys
                sessionStorage.removeItem('pending_payment_order');
                sessionStorage.removeItem('pendingOrder');
                return;
              }
              if (j.payment_status === 'failed') {
                setStatus('failed');
                setMessage('Thanh toán thất bại.');
                sessionStorage.removeItem('pending_payment_order');
                sessionStorage.removeItem('pendingOrder');
                return;
              }
              if (attempts < maxAttempts) {
                setTimeout(poll, interval);
              } else {
                setStatus('pending');
                setMessage('Giao dịch đang được xử lý. Vui lòng kiểm tra lại sau.');
              }
            } catch (err) {
              console.error('Polling error:', err);
              if (attempts < maxAttempts) setTimeout(poll, interval);
              else {
                setStatus('pending');
                setMessage('Không thể xác thực ngay lúc này. Vui lòng kiểm tra Lịch sử đơn hàng sau vài phút.');
              }
            }
          };
          poll();
        } else {
          // MoMo verify
          const response = await fetch('http://localhost:3000/api/payments/momo/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ order_id: parseInt(realOrderId) })
          });
          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error('❌ API Error:', errorData);
            throw new Error(`HTTP ${response.status}: ${errorData.error || 'Unknown error'}`);
          }
          const data = await response.json();
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
