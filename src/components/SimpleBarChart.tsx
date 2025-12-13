import React from 'react';

interface Props {
    data: { label: string; value: number; tooltip: string }[];
    color: string;
    height?: number;
}

const SimpleBarChart: React.FC<Props> = ({ data, color, height = 200 }) => {
    if (data.length === 0) return <div style={{textAlign:'center', padding: 20, color:'#999'}}>Chưa có dữ liệu</div>;

    const maxValue = Math.max(...data.map(d => d.value));

    return (
        <div style={{ display: 'flex', alignItems: 'flex-end', height: height, gap: 10, padding: '10px 0' }}>
            {data.map((item, idx) => {
                const percent = maxValue > 0 ? (item.value / maxValue) * 100 : 0;
                return (
                    <div key={idx} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', group: 'true' } as any} title={item.tooltip}>
                        <div style={{ 
                            width: '100%', 
                            height: `${percent}%`, 
                            backgroundColor: color, 
                            borderRadius: '4px 4px 0 0',
                            transition: 'height 0.5s ease',
                            minHeight: percent > 0 ? 4 : 0,
                            position: 'relative'
                        }}>
                           {/* Tooltip on hover (Optional CSS logic) */}
                        </div>
                        <span style={{ fontSize: 10, color: '#666', marginTop: 5, whiteSpace: 'nowrap', overflow:'hidden', textOverflow:'ellipsis', maxWidth:'100%' }}>
                            {item.label.split('-').slice(1).join('/')} {/* Chỉ hiện Ngày/Tháng */}
                        </span>
                    </div>
                );
            })}
        </div>
    );
};

export default SimpleBarChart;