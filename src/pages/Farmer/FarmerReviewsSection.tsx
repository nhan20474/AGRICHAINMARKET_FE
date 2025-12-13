import React, { useEffect, useState } from 'react';
import { Star, MessageSquare, User, Calendar, Filter } from 'lucide-react';
import { reviewService, Review } from '../../services/reviewService';

interface Props {
    sellerId: number;
}

const FarmerReviewsSection: React.FC<Props> = ({ sellerId }) => {
    const [reviews, setReviews] = useState<Review[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterStar, setFilterStar] = useState<number | 'all'>('all');

    useEffect(() => {
        fetchReviews();
    }, [sellerId]);

    const fetchReviews = async () => {
        setLoading(true);
        try {
            // Gọi API lấy review của seller này
            const data = await reviewService.getBySeller(sellerId);
            setReviews(data);
        } catch (error) {
            console.error(error);
        }
        setLoading(false);
    };

    // Tính toán thống kê
    const totalReviews = reviews.length;
    const avgRating = totalReviews > 0 
        ? (reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews).toFixed(1) 
        : "0.0";

    // Lọc danh sách hiển thị
    const filteredReviews = filterStar === 'all' 
        ? reviews 
        : reviews.filter(r => r.rating === filterStar);

    if (loading) return <div className="p-8 text-center text-gray-500">Đang tải đánh giá...</div>;

    return (
        <div className="farmer-reviews-section fade-in">
            <h2 className="section-title" style={{marginBottom: 20, fontSize: 20, fontWeight: 700, color: '#333'}}>
                ⭐ Đánh giá từ khách hàng
            </h2>

            {/* 1. Thống kê tổng quan */}
            <div className="review-overview-card" style={{display: 'flex', gap: 30, background: '#fff', padding: 24, borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.05)', marginBottom: 30, border: '1px solid #eee'}}>
                <div style={{textAlign: 'center', minWidth: 120, borderRight: '1px solid #eee'}}>
                    <div style={{fontSize: 48, fontWeight: 800, color: '#2d3436', lineHeight: 1}}>{avgRating}</div>
                    <div style={{display: 'flex', justifyContent: 'center', gap: 4, margin: '8px 0'}}>
                        {[1,2,3,4,5].map(s => <Star key={s} size={16} fill={s <= Math.round(Number(avgRating)) ? "#FFC107" : "#ddd"} stroke="none"/>)}
                    </div>
                    <div style={{fontSize: 13, color: '#666'}}>{totalReviews} nhận xét</div>
                </div>

                <div style={{flex: 1}}>
                    <div style={{display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10, fontSize: 14, fontWeight: 600, color: '#555'}}>
                        <Filter size={16}/> Lọc theo sao:
                    </div>
                    <div style={{display: 'flex', gap: 8, flexWrap: 'wrap'}}>
                        <button 
                            onClick={() => setFilterStar('all')}
                            style={{
                                padding: '6px 16px', borderRadius: 20, border: '1px solid #ddd', cursor: 'pointer',
                                background: filterStar === 'all' ? '#333' : '#fff',
                                color: filterStar === 'all' ? '#fff' : '#333',
                                fontSize: 13, fontWeight: 600
                            }}
                        >
                            Tất cả
                        </button>
                        {[5, 4, 3, 2, 1].map(star => (
                            <button 
                                key={star}
                                onClick={() => setFilterStar(star)}
                                style={{
                                    padding: '6px 16px', borderRadius: 20, border: '1px solid #ddd', cursor: 'pointer',
                                    background: filterStar === star ? '#fff' : '#fff',
                                    borderColor: filterStar === star ? '#FFC107' : '#ddd',
                                    color: filterStar === star ? '#FFC107' : '#333',
                                    fontSize: 13, fontWeight: 600,
                                    display: 'flex', alignItems: 'center', gap: 4
                                }}
                            >
                                {star} <Star size={12} fill="#FFC107" stroke="none"/>
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* 2. Danh sách Review */}
            <div className="farmer-review-list" style={{display: 'flex', flexDirection: 'column', gap: 15}}>
                {filteredReviews.length === 0 && (
                    <div style={{textAlign: 'center', padding: 40, color: '#999', background: '#fff', borderRadius: 8}}>
                        Không có đánh giá nào phù hợp.
                    </div>
                )}

                {filteredReviews.map(review => (
                    <div key={review.id} className="farmer-review-item" style={{background: '#fff', padding: 20, borderRadius: 8, border: '1px solid #eee', display: 'flex', gap: 20}}>
                        {/* Cột trái: Thông tin khách & Sản phẩm */}
                        <div style={{width: 200, flexShrink: 0}}>
                            <div style={{display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8}}>
                                <div style={{width: 32, height: 32, borderRadius: '50%', background: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                                    <User size={16} color="#666"/>
                                </div>
                                <div style={{fontSize: 14, fontWeight: 600, color: '#333'}}>
                                    {review.user_name || `Khách #${review.user_id}`}
                                </div>
                            </div>
                            <div style={{fontSize: 12, color: '#888', display: 'flex', alignItems: 'center', gap: 4, marginBottom: 8}}>
                                <Calendar size={12}/> {new Date(review.created_at).toLocaleDateString('vi-VN')}
                            </div>
                            <div style={{fontSize: 13, color: '#007bff', fontWeight: 500, background: '#e3f2fd', padding: '4px 8px', borderRadius: 4, display: 'inline-block'}}>
                                {review.product_name || `Sản phẩm #${review.product_id}`}
                            </div>
                        </div>

                        {/* Cột phải: Nội dung đánh giá */}
                        <div style={{flex: 1, borderLeft: '1px solid #f5f5f5', paddingLeft: 20}}>
                            <div style={{display: 'flex', gap: 2, marginBottom: 8}}>
                                {[...Array(5)].map((_, i) => (
                                    <Star key={i} size={16} fill={i < review.rating ? "#FFC107" : "#eee"} stroke="none"/>
                                ))}
                            </div>
                            <p style={{fontSize: 15, color: '#444', lineHeight: 1.5, margin: 0}}>
                                {review.comment || <span style={{fontStyle: 'italic', color: '#999'}}>Khách hàng không để lại bình luận.</span>}
                            </p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default FarmerReviewsSection;