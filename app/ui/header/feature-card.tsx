const FeatureCard: React.FC<FeatureCardProps> = ({ icon, title, subtitle }) => {
  return (
    <div className="bg-white rounded-lg px-2 py-3 flex items-center hover:bg-neutral-100">
      <div className="flex-shrink-0 w-8 h-3.5">{icon}</div>
      <div>
        <h3 className="text-sm text-baseBlack">{title}</h3>
        <p className="text-xs text-neutral-500">{subtitle}</p>
      </div>
    </div>
  );
};

export default FeatureCard;
