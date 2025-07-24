import React from 'react';

interface PriceBoxProps {
    symbol: string;
    price: string;
    // percentChange: string | null;
}

const PriceBox: React.FC<PriceBoxProps> = ({ symbol, price }) => {
    // if (percentChange === null) {
    //     return (
    //         <tr className="relative h-12">
    //             <td colSpan={14} className="py-2 text-center border-b border-neutral-700">
    //                 <div className="absolute left-1/2 -translate-x-1/2 -translate-y-1/2 top-1/2 bg-[#1C1D1F] px-4 py-1.5 rounded border border-neutral-800 z-10">
    //                     <span className="font-medium whitespace-nowrap text-sm">
    //                         {symbol} ${price}{' '}
    //                         <span className="text-neutral-500">
    //                             Loading...
    //                         </span>
    //                     </span>
    //                 </div>
    //             </td>
    //         </tr>
    //     );
    // }

    // const isPositive = parseFloat(percentChange) >= 0;
    // const arrow = isPositive ? '▲' : '▼';

    return (
        <tr className="relative h-12">
            <td colSpan={14} className="py-2 text-center border-b border-neutral-700">
                <div className="absolute left-1/2 -translate-x-1/2 -translate-y-1/2 top-1/2 bg-[#1C1D1F] px-4 py-1.5 rounded border border-neutral-800 z-10">
                    <span className="font-medium whitespace-nowrap text-sm">
                        {symbol} ${price}{' '}
                        {/* <span className={`${isPositive ? 'text-green-500' : 'text-red-500'}`}>
                            {arrow} {Math.abs(parseFloat(percentChange))}%
                        </span> */}
                    </span>
                </div>
            </td>
        </tr>
    );
};

export default PriceBox; 