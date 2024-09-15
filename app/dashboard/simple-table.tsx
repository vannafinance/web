/* eslint-disable */
"use client";

export const SimpleTableComponent: React.FC<{
  title: string;
  data: any;
  headers: string[];
}> = ({ title, data, headers }) => (
  <div className="w-full max-w-xl mx-auto font-sans mb-6">
    <h2 className="text-xl font-semibold mb-1 ml-2">{title}</h2>
    <div className="bg-baseComplementary rounded-lg overflow-hidden py-2">
      <table className="w-full border-collapse overflow-hidden">
        <thead>
          <tr className="">
            {headers.map((header, index) => (
              <th
                key={header}
                className={`py-2 px-3 text-left text-xs font-semibold text-neutral-500 ${
                  index !== headers.length - 1
                    ? "border-r border-neutral-300"
                    : ""
                }`}
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Object.entries(data).map(([asset, values], rowIndex) => (
            <tr key={rowIndex}>
              <td className="py-1 px-3 text-baseBlack text-xs font-semibold border-r border-neutral-300">
                {asset}
              </td>
              {headers.slice(1).map((header, colIndex) => (
                <td
                  key={`${asset}-${header}`}
                  className={`py-1 px-3 text-baseBlack text-xs font-normal text-center ${
                    colIndex !== headers.length - 2
                      ? "border-r border-neutral-300"
                      : ""
                  }`}
                >
                  {(values as Record<string, any>)[header] || ""}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);
