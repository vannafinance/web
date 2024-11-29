import { Info } from "@phosphor-icons/react";

interface InfoRowProps {
  label: string;
  value: string;
  subValue?: string;
}

const InfoRow: React.FC<InfoRowProps> = ({ label, value, subValue }) => (
  <div className="flex flex-col px-2 sm:px-5 py-7 text-baseBlack dark:text-baseWhite">
    <div className="flex justify-between items-center mb-4 sm:mb-1">
      <span className="text-base font-medium">{label}</span>
      <Info size={16} />
    </div>
    <div className="font-semibold text-2xl">
      {value ? value : "0"}{" "}
      {subValue && (
        <span className="text-baseSuccess-300 text-base font-medium ml-1">
          ({subValue})
        </span>
      )}
    </div>
  </div>
);

export default InfoRow;
