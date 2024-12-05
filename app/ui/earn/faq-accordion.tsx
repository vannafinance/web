"use client";

import { CaretDown, DiscordLogo } from "@phosphor-icons/react";
import Link from "next/link";
import React, { useState } from "react";

interface FAQItem {
  question: string;
  answer: string;
}

const faqs: FAQItem[] = [
  {
    question: "Where is the yield/interest coming from?",
    answer: "Yield comes from borrowers who pay interest on leveraged margin loans, along with liquidation fees shared with lenders.",
  },
  {
    question: "How safe is lending on Vanna?",
    answer: "Lending is safe due to isolated pools, efficient liquidation mechanisms and no impermanent loss risk. Each pool is protected independently to minimize systemic risk.",
  },
  {
    question: "Are these passive pools or can I be liquidated?",
    answer: "These are passive pools and liquidity providers cannot be liquidated. Borrowers bear the liquidation risk.",
  },
  {
    question: "Where can I claim my APY and rewards?",
    answer: "APY and rewards are automatically accrued and can be claimed directly from your Vanna dashboard.",
  },
  {
    question: "Is there some hidden fee or withdrawal fee?",
    answer: "There are no hidden fees. Withdrawal fees, if any, are transparently displayed at the time of withdrawal.",
  },
  {
    question: "Is my liquidity locked? Can I withdraw any time?",
    answer: "Liquidity is not locked, and you can withdraw anytime, subject to pool utilization and availability of funds.",
  },
];

const FAQAccordion = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className="mx-auto py-16">
      <div className="flex flex-col sm:flex-row gap-10 text-base">
        <div className="sm:flex-none w-full sm:w-4/12">
          <h2 className="text-5xl font-bold mb-4 dark:text-baseWhite">FAQs</h2>
          <p className="text-neutral-500 mb-6">
            Some basic questions related to Vanna
          </p>
          <Link href="https://discord.gg/zwZGkNd3Fb" target="_blank">
            <button className="bg-purpleBG-lighter text-purple px-4 py-2 rounded-lg flex items-center space-x-2">
              <DiscordLogo size={24} color="#7a45da" weight="fill" />
              <span className="font-semibold">Join Discord</span>
            </button>
          </Link>
        </div>
        <div className="flex flex-col w-full gap-0">
          {faqs.map((faq, index) => (
            <div key={index}>
              <button
                className="w-full text-left py-4 flex justify-between items-center border-b border-neutral-300 focus:outline-none dark:text-baseWhite"
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
              >
                <span>{faq.question}</span>
                <CaretDown
                  className={`w-5 h-5 transition-transform ${
                    openIndex === index ? "transform rotate-180" : ""
                  }`}
                />
              </button>
              {openIndex === index && (
                <div className="mt-4 pl-2 mb-6 text-neutral-500">
                  {faq.answer}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FAQAccordion;
