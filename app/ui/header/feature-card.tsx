"use client";

import Image from "next/image";

const FeatureCard: React.FC<FeatureCardProps> = ({
  icon,
  title,
  subtitle,
  isSoon,
}) => {
  return (
    <div className="bg-white dark:bg-baseDark rounded-lg px-2 py-3 flex items-start space-x-2 hover:bg-neutral-100 dark:hover:bg-baseDarkComplementary">
      <Image
        width="24"
        height="24"
        src={icon}
        alt={title + " menu icon"}
        className="mt-1"
      />
      <div>
        <h3 className="text-sm text-baseBlack dark:text-baseComplementary">
          {title}{" "}
          {isSoon && (<button className="py-0.5 px-1 bg-gradient-to-r from-gradient-1 to-gradient-2 text-xs rounded-md text-baseWhite">
            soon
          </button>)}
        </h3>
        <p className="text-xs text-neutral-500">{subtitle}</p>
      </div>
    </div>
  );
};

export default FeatureCard;
