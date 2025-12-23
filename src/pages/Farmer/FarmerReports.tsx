import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
    DollarSign, Package, Calendar, TrendingUp, 
    Filter, ArrowRight, ShoppingBag, CreditCard 
} from 'lucide-react';
import { ReportService, SalesTrendItem, TopProductItem } from '../../services/reportService';
import SimpleBarChart from '../../components/SimpleBarChart';
import '../../styles/FarmerReports.css';

interface FarmerReportsProps {
    sellerId?: number;
}

const FarmerReports: React.FC<FarmerReportsProps> = ({ sellerId: propSellerId }) => {
    // --- STATE ---
    const [sellerId, setSellerId] = useState<number | null>(propSellerId || null);
    const [chartData, setChartData] = useState<SalesTrendItem[]>([]);
    const [topProducts, setTopProducts] = useState<TopProductItem[]>([]);
    const [loading, setLoading] = useState(false);
    
    // Quản lý thời gian filter
    const [dateRange, setDateRange] = useState({
        from: new Date(Date.now() - 6 * 86400000).toISOString().split('T')[0], // 7 ngày gần nhất (tính cả hôm nay)
        to: new Date().toISOString().split('T')[0]
    });
    const [activePreset, setActivePreset] = useState<'7days' | 'thisMonth' | 'lastMonth' | 'custom'>('7days');

    // --- EFFECT: Lấy SellerID nếu không truyền props ---
    useEffect(() => {
        if (!propSellerId) {
            const userStr = localStorage.getItem('user');
            if (userStr) {
                try {
                    setSellerId(Number(JSON.parse(userStr).id));
                } catch (e) {
                    console.error("Lỗi parse user:", e);
                }
            }
        } else {
            setSellerId(propSellerId);
        }
    }, [propSellerId]);

    // --- LOGIC: Chọn nhanh thời gian ---
    const handlePresetChange = (preset: '7days' | 'thisMonth' | 'lastMonth') => {
        setActivePreset(preset);
        const today = new Date();
        let from = '';
        let to = today.toISOString().split('T')[0];

        if (preset === '7days') {
            const d = new Date();
            d.setDate(d.getDate() - 6);
            from = d.toISOString().split('T')[0];
        } else if (preset === 'thisMonth') {
            const d = new Date(today.getFullYear(), today.getMonth(), 1);
            from = d.toISOString().split('T')[0];
        } else if (preset === 'lastMonth') {
            const firstDay = new Date(today.getFullYear(), today.getMonth() - 1, 1);
            const lastDay = new Date(today.getFullYear(), today.getMonth(), 0);
            from = firstDay.toISOString().split('T')[0];
            to = lastDay.toISOString().split('T')[0];
        }
        setDateRange({ from, to });
    };

    const handleCustomDateChange = (field: 'from' | 'to', value: string) => {
        setActivePreset('custom');
        setDateRange(prev => ({ ...prev, [field]: value }));
    };

    // --- API: Load dữ liệu ---
    const loadReportData = useCallback(async () => {
        if (!sellerId) return;
        setLoading(true);
        try {
            // Gọi song song 2 API: Biểu đồ & Top sản phẩm
            const [trendRes, topProdRes] = await Promise.all([
                ReportService.getFarmerTrend(sellerId, 'daily', dateRange.from, dateRange.to),
                ReportService.getFarmerTopProducts(sellerId, 5) // Lấy top 5 sản phẩm
            ]);
            
            setChartData(trendRes);
            setTopProducts(topProdRes);
        } catch (e) {
            console.error("Lỗi tải báo cáo:", e);
        } finally {
            setLoading(false);
        }
    }, [sellerId, dateRange]);

    useEffect(() => {
        loadReportData();
    }, [loadReportData]);

    // --- CALCULATIONS: Tính toán tổng hợp ---
    const summary = useMemo(() => {
        const revenue = chartData.reduce((sum, item) => sum + Number(item.total_revenue), 0);
        const orders = chartData.reduce((sum, item) => sum + Number(item.total_orders), 0);
        const quantity = chartData.reduce((sum, item) => sum + Number(item.total_quantity || 0), 0);
        const avgOrderValue = orders > 0 ? revenue / orders : 0;

        return { revenue, orders, quantity, avgOrderValue };
    }, [chartData]);

    if (!sellerId) return <div className="empty-state-modern">Vui lòng đăng nhập để xem báo cáo.</div>;

    return (
        <div className="fr-container fade-in">
            {/* 1. HEADER & FILTER TOOLBAR */}
            <div className="fr-header">
                <div>
                    <h2 className="fr-title">Tổng quan kinh doanh</h2>
                    <p className="fr-subtitle">Theo dõi hiệu suất bán hàng của bạn theo thời gian thực.</p>
                </div>
                
                <div className="fr-toolbar">
                    <div className="fr-presets">
                        <button 
                            className={`fr-preset-btn ${activePreset === '7days' ? 'active' : ''}`}
                            onClick={() => handlePresetChange('7days')}
                        >7 ngày qua</button>
                        <button 
                            className={`fr-preset-btn ${activePreset === 'thisMonth' ? 'active' : ''}`}
                            onClick={() => handlePresetChange('thisMonth')}
                        >Tháng này</button>
                        <button 
                            className={`fr-preset-btn ${activePreset === 'lastMonth' ? 'active' : ''}`}
                            onClick={() => handlePresetChange('lastMonth')}
                        >Tháng trước</button>
                    </div>
                    <div className="fr-date-picker">
                        <Filter size={16} className="text-gray-400" />
                        <input 
                            type="date" 
                            value={dateRange.from} 
                            onChange={(e) => handleCustomDateChange('from', e.target.value)}
                        />
                        <span className="text-gray-400">-</span>
                        <input 
                            type="date" 
                            value={dateRange.to} 
                            onChange={(e) => handleCustomDateChange('to', e.target.value)}
                        />
                    </div>
                </div>
            </div>

            {/* 2. SUMMARY CARDS */}
            <div className="fr-summary-grid">
                <ModernStatCard 
                    title="Tổng Doanh Thu" 
                    value={summary.revenue} 
                    isCurrency 
                    icon={<DollarSign size={24} />} 
                    color="emerald"
                />
                <ModernStatCard 
                    title="Tổng Đơn Hàng" 
                    value={summary.orders} 
                    icon={<ShoppingBag size={24} />} 
                    color="blue"
                />
                <ModernStatCard 
                    title="Sản Phẩm Đã Bán" 
                    value={summary.quantity} 
                    icon={<Package size={24} />} 
                    color="purple"
                />
                <ModernStatCard 
                    title="Giá Trị TB/Đơn" 
                    value={summary.avgOrderValue} 
                    isCurrency 
                    icon={<CreditCard size={24} />} 
                    color="orange"
                />
            </div>

            {/* 3. MAIN CONTENT: CHART & TOP PRODUCTS */}
            <div className="fr-content-grid">
                
                {/* Left: Chart */}
                <div className="fr-card fr-chart-section">
                    <div className="fr-card-header">
                        <h3><TrendingUp size={20}/> Biểu đồ doanh thu</h3>
                    </div>
                    <div className="fr-chart-wrapper">
                        {loading ? (
                            <div className="fr-loading">
                                <div className="spinner"></div> Đang tải dữ liệu...
                            </div>
                        ) : chartData.length === 0 ? (
                            <div className="fr-empty">Không có dữ liệu trong khoảng thời gian này</div>
                        ) : (
                            <SimpleBarChart
                                data={chartData.map(d => ({
                                    label: d.label.split('-').slice(1).join('/'), // Format ngày MM/DD cho gọn
                                    value: Number(d.total_revenue),
                                    tooltip: `${d.label}: ${Number(d.total_revenue).toLocaleString('vi-VN')}đ`
                                }))}
                                color="#10B981" // Emerald 500
                            />
                        )}
                    </div>
                </div>

                {/* Right: Top Products */}
                <div className="fr-card fr-top-products">
                    <div className="fr-card-header">
                        <h3><Package size={20}/> Top sản phẩm bán chạy</h3>
                    </div>
                    <div className="fr-products-list">
                        {loading ? (
                            <div className="fr-loading-mini">Đang tải...</div>
                        ) : topProducts.length === 0 ? (
                            <div className="fr-empty-mini">Chưa có sản phẩm nào bán được.</div>
                        ) : (
                            topProducts.map((prod, idx) => (
                                <div key={prod.product_id} className="fr-product-item">
                                    <div className="fr-prod-rank">{idx + 1}</div>
                                    <div className="fr-prod-info">
                                        <span className="fr-prod-name">Sản phẩm #{prod.product_id}</span>
                                        <span className="fr-prod-sales">{Number(prod.total_sold)} đã bán</span>
                                    </div>
                                    <div className="fr-prod-revenue">
                                        {Number(prod.revenue).toLocaleString('vi-VN')}đ
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                    <div className="fr-card-footer">
                        <button className="fr-btn-link">Xem tất cả sản phẩm <ArrowRight size={14}/></button>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default FarmerReports;

// --- SUB COMPONENT: MODERN STAT CARD ---
const ModernStatCard: React.FC<{
    title: string;
    value: number;
    icon: React.ReactNode;
    color: 'emerald' | 'blue' | 'purple' | 'orange';
    isCurrency?: boolean;
}> = ({ title, value, icon, color, isCurrency }) => {
    
    // Định nghĩa màu sắc dynamic
    const colorMap = {
        emerald: { bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-100' },
        blue: { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-100' },
        purple: { bg: 'bg-purple-50', text: 'text-purple-600', border: 'border-purple-100' },
        orange: { bg: 'bg-orange-50', text: 'text-orange-600', border: 'border-orange-100' },
    };
    const theme = colorMap[color];

    return (
        <div className={`fr-stat-card ${theme.border}`}>
            <div className={`fr-stat-icon ${theme.bg} ${theme.text}`}>
                {icon}
            </div>
            <div className="fr-stat-content">
                <p className="fr-stat-title">{title}</p>
                <h4 className="fr-stat-value">
                    {isCurrency 
                        ? value.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' }) 
                        : value.toLocaleString('vi-VN')}
                </h4>
            </div>
        </div>
    );
};