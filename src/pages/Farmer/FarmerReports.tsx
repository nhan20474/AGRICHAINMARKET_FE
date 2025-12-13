import React, { useState, useEffect } from 'react';
import { RefreshCw, DollarSign, Package } from 'lucide-react';
import { reportService, ChartDataPoint } from '../../services/reportService';
import SimpleBarChart from '../../components/SimpleBarChart';

const FarmerReports: React.FC = () => {
    const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
    const [loading, setLoading] = useState(false);
    const [sellerId, setSellerId] = useState<number | null>(null);
    
    const [dateRange, setDateRange] = useState({
        from: new Date(new Date().setDate(new Date().getDate() - 7)).toISOString().split('T')[0], 
        to: new Date().toISOString().split('T')[0] 
    });

    useEffect(() => {
        const userStr = localStorage.getItem('user');
        if (userStr) setSellerId(Number(JSON.parse(userStr).id));
    }, []);

    useEffect(() => {
        if (sellerId) loadData();
    }, [sellerId, dateRange]);

    const loadData = async () => {
        if (!sellerId) return;
        setLoading(true);
        try {
            // Farmer chỉ lấy dữ liệu của mình (truyền seller_id)
            const data = await reportService.getChartData({
                seller_id: sellerId,
                from_date: dateRange.from,
                to_date: dateRange.to,
                type: 'daily'
            });
            setChartData(data);
        } catch (error) { console.error(error); }
        setLoading(false);
    };

    const totalRevenue = chartData.reduce((sum, d) => sum + d.revenue, 0);
    const totalOrders = chartData.reduce((sum, d) => sum + d.orders, 0);

    if (!sellerId) return <div>Vui lòng đăng nhập.</div>;

    return (
        <div className="farmer-reports fade-in" style={{padding: 20}}>
            <h2 className="section-title" style={{margin:'0 0 20px 0'}}>📈 Hiệu quả kinh doanh</h2>

            <div style={{display:'flex', gap:10, marginBottom:20}}>
                <input type="date" value={dateRange.from} onChange={e => setDateRange({...dateRange, from: e.target.value})} style={{padding:8, borderRadius:6, border:'1px solid #ddd'}} />
                <span style={{alignSelf:'center'}}>-</span>
                <input type="date" value={dateRange.to} onChange={e => setDateRange({...dateRange, to: e.target.value})} style={{padding:8, borderRadius:6, border:'1px solid #ddd'}} />
            </div>

            <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 30}}>
                <div style={{background: '#f0fdf4', padding: 20, borderRadius: 12, color: '#15803d', border:'1px solid #bbf7d0'}}>
                    <div style={{fontSize: 14, display:'flex', alignItems:'center', gap:5}}><DollarSign size={16}/> Doanh thu</div>
                    <div style={{fontSize: 24, fontWeight: 800}}>{totalRevenue.toLocaleString('vi-VN')}đ</div>
                </div>
                <div style={{background: '#fff7ed', padding: 20, borderRadius: 12, color: '#c2410c', border:'1px solid #fed7aa'}}>
                    <div style={{fontSize: 14, display:'flex', alignItems:'center', gap:5}}><Package size={16}/> Đơn hàng</div>
                    <div style={{fontSize: 24, fontWeight: 800}}>{totalOrders}</div>
                </div>
            </div>

            <div style={{background: '#fff', padding: 20, borderRadius: 12, border: '1px solid #eee', boxShadow: '0 2px 8px rgba(0,0,0,0.05)'}}>
                <h4 style={{marginTop:0, color:'#555'}}>Biểu đồ doanh thu theo ngày</h4>
                {loading ? <div style={{textAlign:'center', padding:20}}>Đang tải...</div> : (
                    <SimpleBarChart 
                        data={chartData.map(d => ({ label: d.label, value: d.revenue, tooltip: `${d.label}: ${d.revenue.toLocaleString()}đ` }))}
                        color="#28a745"
                    />
                )}
            </div>
        </div>
    );
};

export default FarmerReports;