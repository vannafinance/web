"use client";

import { ArrowCircleUpRight } from "@phosphor-icons/react";
import TradingInfoPanel from "./trading-info-panel";
import { useEffect, useState } from "react";

const BorrowerDashboard = () => {
  const [depositedAmount, setDepositedAmount] = useState<string | undefined>();
  const [repayableAmount, setRepayableAmount] = useState<string | undefined>();
  const [repayablePercentage, setRepayablePercentage] = useState<
    string | undefined
  >();
  const [borrowedAmount, setBorrowedAmount] = useState<string | undefined>();
  const [borrowedLeverage, setBorrowedLeverage] = useState<
    string | undefined
  >();
  const [withdrawableAmount, setWithdrawableAmount] = useState<
    string | undefined
  >();

  // TODO: delete below useEffect
  useEffect(() => {
    setDepositedAmount(undefined);
    setRepayableAmount(undefined);
    setRepayablePercentage(undefined);
    setBorrowedAmount(undefined);
    setBorrowedLeverage(undefined);
    setWithdrawableAmount(undefined);
  }, []);

  return (
    <div>
      <div className="grid grid-cols-2 gap-x-4 my-3 lg:my-0 text-baseBlack dark:text-baseWhite">
        <div className="bg-white dark:bg-baseDark rounded-3xl border border-purpleBG-lighter dark:border-neutral-700 p-3 lg:p-6 mb-5 lg:mb-7">
          <div className="flex justify-between items-start mb-10">
            <h2 className="text-base font-medium">
              Deopsited Amount
            </h2>
            <ArrowCircleUpRight size={24} fill="#7a45da" />
          </div>
          <p className="text-2xl lg:text-3xl font-semibold mb-2">
            {depositedAmount ? depositedAmount : "-"}
          </p>
        </div>

        <div className="bg-white dark:bg-baseDark rounded-3xl border border-purpleBG-lighter dark:border-neutral-700 p-3 lg:p-6 mb-5 lg:mb-7">
          <div className="flex justify-between items-start mb-10">
            <h2 className="text-base font-medium">
              Repayable Amount
            </h2>
            <ArrowCircleUpRight size={24} fill="#7a45da" />
          </div>
          <p className="text-2xl lg:text-3xl font-semibold mb-2">
            {repayableAmount ? repayableAmount : "-"}{" "}
            {repayablePercentage && (
              <span className="text-baseSuccess-300 text-base font-medium">
                {repayablePercentage}
              </span>
            )}
          </p>
        </div>

        <div className="bg-white dark:bg-baseDark rounded-3xl border border-purpleBG-lighter dark:border-neutral-700 p-3 lg:p-6 mb-5 lg:mb-7">
          <div className="flex justify-between items-start mb-10">
            <h2 className="text-base font-medium">
              Borrowed Amount
            </h2>
            <ArrowCircleUpRight size={24} fill="#7a45da" />
          </div>
          <p className="text-2xl lg:text-3xl font-semibold mb-2">
            {borrowedAmount ? borrowedAmount : "-"}{" "}
            {borrowedLeverage && (
              <span className="px-2 inline-flex text-xs leading-4 font-medium rounded-md bg-purpleBG-lighter text-purple">
                {borrowedLeverage}x Leverage
              </span>
            )}
          </p>
        </div>

        <div className="bg-white dark:bg-baseDark rounded-3xl border border-purpleBG-lighter dark:border-neutral-700 p-3 lg:p-6 mb-5 lg:mb-7">
          <div className="flex justify-between items-start mb-10">
            <h2 className="text-base font-medium">
              Withdrawable Amount
            </h2>
            <ArrowCircleUpRight size={24} fill="#7a45da" />
          </div>
          <p className="text-2xl lg:text-3xl font-semibold mb-2">
            {withdrawableAmount ? withdrawableAmount : "-"}
          </p>
        </div>
      </div>

      <div className="rounded-3xl border border-purpleBG-lighter dark:border-neutral-700 py-10 px-2 sm:px-5 mb-5">
        <TradingInfoPanel />
      </div>
    </div>
  );
};

export default BorrowerDashboard;
