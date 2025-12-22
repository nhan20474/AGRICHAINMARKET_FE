import React, { useState, useEffect } from 'react';
import { RefreshCw, BarChart2 } from 'lucide-react';
import { reportService, ChartDataPoint } from '../../services/reportService';
import SimpleBarChart from '../../components/SimpleBarChart';


const AdminReports: React.FC = () => {
    const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
    const [loading, setLoading] = useState(false);
    const [syncing, setSyncing] = useState(false);
    
    // Filter
    const [dateRange, setDateRange] = useState({
        from: new Date(new Date().setDate(new Date().getDate() - 7)).toISOString().split('T')[0], 
        to: new Date().toISOString().split('T')[0]
    });
    const [viewType, setViewType] = useState<'daily' | 'monthly'>('daily');

    useEffect(() => {
    loadData();
    }, [dateRange.from, dateRange.to, viewType]);


    const loadData = async () => {
        setLoading(true);
        try {
            // Admin không truyền seller_id -> Lấy toàn sàn
            const data = await reportService.getChartData({
                from_date: viewType === 'monthly'
                    ? dateRange.from.slice(0, 7) + '-01'
                    : dateRange.from,
                to_date: dateRange.to,
                type: viewType
            });
            setChartData(data);
        } catch (error) { console.error(error); }
        setLoading(false);
    };

    const handleSync = async () => {
        setSyncing(true);
        try {
            await reportService.syncData();
            alert("Đã cập nhật số liệu hệ thống!");
            loadData();
        } catch (e) { alert("Lỗi đồng bộ"); }
        setSyncing(false);
    };

    const totalRevenue = chartData.reduce((sum, d) => sum + d.revenue, 0);

    return (
        <div className="admin-reports fade-in" style={{padding: 20}}>
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20}}>
               {!loading && chartData.length === 0 && (
                    <div style={{ textAlign:'center', padding:20, color:'#888' }}>
                        Không có dữ liệu trong khoảng thời gian này
                    </div>
                )}
                <div style={{display:'flex', gap: 10}}>
                    <select value={viewType} onChange={(e) => setViewType(e.target.value as any)} style={{padding:8, borderRadius:6, border:'1px solid #ddd'}}>
                        <option value="daily">Theo Ngày</option>
                        <option value="monthly">Theo Tháng</option>
                    </select>
                    <button onClick={handleSync} disabled={syncing} style={{padding:'8px 12px', background:'#fff', border:'1px solid #28a745', color:'#28a745', borderRadius:6, cursor:'pointer', display:'flex', alignItems:'center', gap:5}}>
                        <RefreshCw size={16} className={syncing?'spin':''}/> {syncing ? 'Syncing...' : 'Cập nhật'}
                    </button>
                </div>
            </div>

            <div style={{background: '#e3f2fd', padding: 20, borderRadius: 12, marginBottom: 30}}>
                <div style={{fontSize: 14, color: '#0d47a1'}}>Tổng doanh thu (Giai đoạn này)</div>
                <div style={{fontSize: 32, fontWeight: 800, color: '#0d47a1'}}>{totalRevenue.toLocaleString('vi-VN')}đ</div>
            </div>

            <div style={{background: '#fff', padding: 20, borderRadius: 12, border: '1px solid #eee', boxShadow: '0 2px 8px rgba(0,0,0,0.05)'}}>
                <h4 style={{marginTop:0, color:'#555'}}>Biểu đồ Doanh Thu</h4>
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

export default AdminReports;