import { ArrowCircleUpRight } from "@phosphor-icons/react";
import TradingInfoPanel from "./trading-info-panel";

const BorrowerDashboard = () => {
  return (
    <div>
      <div className="grid grid-cols-2 gap-x-4">
        <div className="bg-white rounded-3xl border border-purpleBG-lighter p-6 mb-7">
          <div className="flex justify-between items-start mb-10">
            <h2 className="text-base font-medium text-baseBlack">
              Total Holdings
            </h2>
            <ArrowCircleUpRight size={24} fill="#7a45da" />
          </div>
          <p className="text-3xl font-semibold text-baseBlack mb-2">$1000.00</p>
        </div>

        <div className="bg-white rounded-3xl border border-purpleBG-lighter p-6 mb-7">
          <div className="flex justify-between items-start mb-10">
            <h2 className="text-base font-medium text-baseBlack">
              Repayable Amount
            </h2>
            <ArrowCircleUpRight size={24} fill="#7a45da" />
          </div>
          <p className="text-3xl font-semibold text-baseBlack mb-2">
            $4080.00{" "}
            <span className="text-baseSuccess-300 text-base font-medium">
              +$80(2.00%)
            </span>
          </p>
        </div>

        <div className="bg-white rounded-3xl border border-purpleBG-lighter p-6 mb-7">
          <div className="flex justify-between items-start mb-10">
            <h2 className="text-base font-medium text-baseBlack">
              Borrowed Amount
            </h2>
            <ArrowCircleUpRight size={24} fill="#7a45da" />
          </div>
          <p className="text-3xl font-semibold text-baseBlack mb-2">
            $5000.00{" "}
            <span className="px-2 inline-flex text-xs leading-4 font-medium rounded-md bg-purpleBG-lighter text-purple">
              5x Leverage
            </span>
          </p>
        </div>

        <div className="bg-white rounded-3xl border border-purpleBG-lighter p-6 mb-7">
          <div className="flex justify-between items-start mb-10">
            <h2 className="text-base font-medium text-baseBlack">
              Withdrawable Amount
            </h2>
            <ArrowCircleUpRight size={24} fill="#7a45da" />
          </div>
          <p className="text-3xl font-semibold text-baseBlack mb-2">$1500.00</p>
        </div>
      </div>

      <div className="rounded-3xl border border-purpleBG-lighter py-10 px-5 mb-5">
        <TradingInfoPanel />
      </div>
    </div>
  );
};

export default BorrowerDashboard;
