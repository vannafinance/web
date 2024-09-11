"use client";

import { poolDetailsPlaceholder } from "@/app/lib/static-values";
import { Copy, Info } from "@phosphor-icons/react";
import Tooltip from "../components/tooltip";
import { useWeb3React } from "@web3-react/core";
import { useNetwork } from "@/app/context/network-context";
import { getShortenedAddress } from "@/app/lib/web3-constants";
import { useEffect, useState } from "react";

const PoolDetails = () => {
  const { account, library } = useWeb3React();
  const { currentNetwork } = useNetwork();
  const [details, setDetails] = useState(poolDetailsPlaceholder);

  // useEffect(() => {
    //   try {
  //     if (account) {
//       const fetchValues = async () => {
  
          // TODO:: add data fetching here

          // setDetails();
          // Note: as done in pool-table.tsx file after data fetching
          // Note: pools.map, do the same here after data fetching
          // Note: add condition and assign specific variables to it.
          // Note: and then update the updatedDetails using setDetails()
          // Note: function above.

  //       };

  //       fetchValues();
  //     } else {
  //       setDetails(poolDetailsPlaceholder);
  //     }
  //   } catch (error) {
  //     console.error(error);
  //   }
  // }, [account]);

  const handleCopyAddress = (address: string) => {
    navigator.clipboard.writeText(address);
    // .then(() => {
    //   alert("Address copied to clipboard!");
    // });
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 py-12 px-4 border border-neutral-300 rounded-2xl">
      {details.map((item, index) => (
        <div key={index} className="flex flex-col">
          <div className="flex items-center">
            <span className="text-sm text-baseBlack mr-1">{item.label}</span>
            <Tooltip content={item.tooltip}>
              <Info size={16} color="black" />
            </Tooltip>
          </div>
          <div className="font-semibold text-lg mt-1.5">{item.value}</div>
        </div>
      ))}
      <div className="flex flex-col">
        <div className="flex items-center cursor-pointer">
          <span className="text-sm text-baseBlack mr-1">ADDRESS</span>
          <Copy
            size={16}
            color="black"
            onClick={() => handleCopyAddress(account ? account : "")}
          />
        </div>
        <div className="font-semibold text-lg mt-1.5">
          {getShortenedAddress(account ? account : "")}
        </div>
      </div>
    </div>
  );
};

export default PoolDetails;
