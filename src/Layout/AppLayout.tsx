// src/components/Layout/AppLayout.tsx

import React, { useState } from 'react';
import { Outlet } from 'react-router-dom'; // Cần import Outlet
import Header from './Header';
import Footer from './Footer';

// Giữ lại Home.css theo yêu cầu (Chứa cả layout và các styles chung)
import '../styles/Home.css'; 
import '../styles/ProductList.css'
import '../styles/Cart.css';

 
// Định nghĩa kiểu dữ liệu cho context để MarketList có thể sử dụng
type ContextType = { searchTerm: string };

// AppLayout component chính
const AppLayout: React.FC = () => {
    // State tìm kiếm được nâng lên AppLayout
    const [searchTerm, setSearchTerm] = useState('');
    
    return (
        <div className="market-page">
            
            {/* 1. HEADER (Full width) - Truyền state tìm kiếm */}
            <Header 
                searchTerm={searchTerm} 
                onSearchChange={setSearchTerm} 
            />
            
            {/* 2. CONTENT WRAPPER (Max-width 1200px) */}
            <div className="content-wrapper"> 
                
                {/* 🛑 SỬ DỤNG OUTLET: Để render component con (MarketList)
                   Truyền searchTerm xuống qua context */}
                <Outlet context={{ searchTerm } as ContextType} /> 
                
            </div>

            {/* 3. FOOTER (Full width) */}
            <Footer />
            
        </div>
    );
};

export default AppLayout;