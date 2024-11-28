/* eslint-disable */
"use client";

import { capitalizeFirstLetter } from "@/app/lib/helper";
import Loader from "../components/loader";

export const SimpleTableComponent: React.FC<{
  title: string;
  data: any;
  headers: string[];
  loading: boolean;
}> = ({ title, data, headers, loading }) => (
  <div className="flex-1 w-full max-w-full mx-auto font-sans mb-6 overflow-auto">
    <h2 className="text-xl font-semibold mb-1 ml-2">{title}</h2>
    <div className="bg-baseComplementary dark:bg-baseDarkComplementary rounded-lg overflow-hidden py-2">
      <table className="w-full max-w-full table-auto border-collapse">
        <thead>
          <tr>
            {headers.map((header, index) => (
              <th
                key={header}
                className={`py-2 px-2 text-xs font-semibold text-neutral-500 ${
                  index !== headers.length - 1
                    ? "border-r border-neutral-300 dark:border-neutral-700"
                    : ""
                } ${index === 0 ? "text-left" : ""}`}
              >
                {capitalizeFirstLetter(header)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <Loader />
          ) : (
            Object.entries(data).map(([asset, values], rowIndex) => (
              <tr key={rowIndex}>
                <td className="py-1 px-2 text-xs font-semibold border-r border-neutral-300 dark:border-neutral-700">
                  {capitalizeFirstLetter(asset)}
                </td>
                {headers.slice(1).map((header, colIndex) => (
                  <td
                    key={`${asset}-${header}`}
                    className={`py-1 px-2 text-xs font-normal text-center ${
                      colIndex !== headers.length - 2
                        ? "border-r border-neutral-300 dark:border-neutral-700"
                        : ""
                    }`}
                  >
                    {(values as Record<string, any>)[header] || ""}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  </div>
);
