import React, { useState } from 'react';
import { X, ExternalLink, Copy, Check, Printer } from 'lucide-react';
import QRCode from "react-qr-code"; 
import "../styles/QRCodeModal.css";

interface QRCodeModalProps {
    product: any;
    onClose: () => void;
    isOpen: boolean;
}

const QRCodeModal: React.FC<QRCodeModalProps> = ({ product, onClose, isOpen }) => {
    const [copied, setCopied] = useState(false);
    
    if (!isOpen || !product) return null;

    const traceLink = `${window.location.origin}/trace/${product.id}`; 

    const handlePrint = () => {
        const printWindow = window.open('', '', 'height=600,width=600');
        if(printWindow) {
            printWindow.document.write(`<html><head><title>In Tem</title></head><body style="text-align:center;font-family:sans-serif;">`);
            printWindow.document.write(`<h2>${product.name}</h2>`);
            const svg = document.getElementById("qr-svg")?.outerHTML;
            printWindow.document.write(svg || '');
            printWindow.document.write(`<p style="margin-top:10px;font-size:14px;">Quét mã để xem nhật ký canh tác</p>`);
            printWindow.document.write(`</body></html>`);
            printWindow.document.close();
            printWindow.print();
        }
    }

    const handleCopyLink = () => {
        navigator.clipboard.writeText(traceLink);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="qr-backdrop">
            <div className="qr-modal">
                
                <button className="qr-close-btn" onClick={onClose}>
                    <X size={22}/>
                </button>
                
                <h3 className="qr-title">Tem Truy Xuất Nguồn Gốc</h3>
                <p className="qr-sub">Quét mã để xem nhật ký canh tác</p>
                
                <div className="qr-box">
                    <QRCode id="qr-svg" value={traceLink} size={180} />
                </div>
                
                <div className="qr-product-name">{product.name}</div>
                <div className="qr-product-id">Mã SP: #{product.id}</div>

                <div className="qr-link-box">
                    <input 
                        type="text" 
                        value={traceLink} 
                        readOnly 
                        className="qr-link-input"
                    />
                    <button 
                        onClick={handleCopyLink}
                        className={`qr-copy-btn ${copied ? "active" : ""}`}
                    >
                        {copied ? <Check size={18}/> : <Copy size={18}/>}
                    </button>
                </div>
                
                <div className="qr-btn-group">
                    
                    <a 
                        href={traceLink} 
                        target="_blank" 
                        rel="noreferrer"
                        className="qr-btn-view"
                    >
                        <ExternalLink size={16} /> Xem Trang
                    </a>

                    <button 
                        onClick={handlePrint} 
                        className="qr-btn-print"
                    >
                        <Printer size={16} /> In Tem
                    </button>
                </div>
            </div>
        </div>
    );
}

export default QRCodeModal;
