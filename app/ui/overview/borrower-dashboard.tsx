"use client";

import { ArrowCircleUpRight } from "@phosphor-icons/react";
import TradingInfoPanel from "./trading-info-panel";
import { useEffect, useState } from "react";

const BorrowerDashboard = () => {
  const [totalHolding, setTotalHolding] = useState();
  const [repayableAmount, setRepayableAmount] = useState();
  const [repayablePercentage, setRepayablePercentage] = useState();
  const [borrowedAmount, setBorrowedAmount] = useState();
  const [borrowedLeverage, setBorrowedLeverage] = useState();
  const [withdrawableAmount, setWithdrawableAmount] = useState();

  // TODO: delete below useEffect
  useEffect(() => {
    setTotalHolding(undefined);
    setRepayableAmount(undefined);
    setRepayablePercentage(undefined);
    setBorrowedAmount(undefined);
    setBorrowedLeverage(undefined);
    setWithdrawableAmount(undefined);
  }, []);

  return (
    <div>
      <div className="grid grid-cols-2 gap-x-4 my-3 lg:my-0">
        <div className="bg-white rounded-3xl border border-purpleBG-lighter p-3 lg:p-6 mb-5 lg:mb-7">
          <div className="flex justify-between items-start mb-10">
            <h2 className="text-base font-medium text-baseBlack">
              Total Holdings
            </h2>
            <ArrowCircleUpRight size={24} fill="#7a45da" />
          </div>
          <p className="text-2xl lg:text-3xl font-semibold text-baseBlack mb-2">
            {totalHolding ? totalHolding : "-"}
          </p>
        </div>

        <div className="bg-white rounded-3xl border border-purpleBG-lighter p-3 lg:p-6 mb-5 lg:mb-7">
          <div className="flex justify-between items-start mb-10">
            <h2 className="text-base font-medium text-baseBlack">
              Repayable Amount
            </h2>
            <ArrowCircleUpRight size={24} fill="#7a45da" />
          </div>
          <p className="text-2xl lg:text-3xl font-semibold text-baseBlack mb-2">
            {repayableAmount ? repayableAmount : "-"}{" "}
            {repayablePercentage && (
              <span className="text-baseSuccess-300 text-base font-medium">
                {repayablePercentage}
              </span>
            )}
          </p>
        </div>

        <div className="bg-white rounded-3xl border border-purpleBG-lighter p-3 lg:p-6 mb-5 lg:mb-7">
          <div className="flex justify-between items-start mb-10">
            <h2 className="text-base font-medium text-baseBlack">
              Borrowed Amount
            </h2>
            <ArrowCircleUpRight size={24} fill="#7a45da" />
          </div>
          <p className="text-2xl lg:text-3xl font-semibold text-baseBlack mb-2">
            {borrowedAmount ? borrowedAmount : "-"}{" "}
            {borrowedLeverage && (
              <span className="px-2 inline-flex text-xs leading-4 font-medium rounded-md bg-purpleBG-lighter text-purple">
                {borrowedLeverage}x Leverage
              </span>
            )}
          </p>
        </div>

        <div className="bg-white rounded-3xl border border-purpleBG-lighter p-3 lg:p-6 mb-5 lg:mb-7">
          <div className="flex justify-between items-start mb-10">
            <h2 className="text-base font-medium text-baseBlack">
              Withdrawable Amount
            </h2>
            <ArrowCircleUpRight size={24} fill="#7a45da" />
          </div>
          <p className="text-2xl lg:text-3xl font-semibold text-baseBlack mb-2">
            {withdrawableAmount ? withdrawableAmount : "-"}
          </p>
        </div>
      </div>

      <div className="rounded-3xl border border-purpleBG-lighter py-10 px-2 sm:px-5 mb-5">
        <TradingInfoPanel />
      </div>
    </div>
  );
};

export default BorrowerDashboard;
