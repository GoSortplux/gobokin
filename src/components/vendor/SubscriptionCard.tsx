import React from "react";
import { CheckCircle, Tag } from 'lucide-react';
import { LicenseTier } from "@/types";

interface SubscriptionCardProps {
  tier: LicenseTier;
  isCurrent: boolean;
  isRecommended: boolean;
  hasAnyActiveSubscription?: boolean;
  onSelect: () => void;
}

const SubscriptionCard: React.FC<SubscriptionCardProps> = ({
  tier,
  isCurrent,
  isRecommended,
  hasAnyActiveSubscription = false,
  onSelect
}) => {
  const hasActiveDiscount = React.useMemo(() => {
    if (!tier.discount || !tier.discount.value || tier.discount.value <= 0) return false;

    // Check for expiry if expiryDate exists
    if (tier.discount.expiryDate) {
      const expiry = new Date(tier.discount.expiryDate);
      if (expiry < new Date()) return false;
    }

    return true;
  }, [tier.discount]);

  const discountedPrice = React.useMemo(() => {
    if (!hasActiveDiscount || !tier.discount) return tier.price;

    const price = Number(tier.price);
    const discountValue = Number(tier.discount.value);

    if (tier.discount.type === 'percentage') {
      return price - (price * (discountValue / 100));
    } else if (tier.discount.type === 'fixed') {
      return Math.max(0, price - discountValue);
    }
    return price;
  }, [tier.price, tier.discount, hasActiveDiscount]);

  return (
    <div
      className={`border rounded-xl p-6 shadow-lg relative transition-all duration-300 transform hover:-translate-y-2 cursor-pointer ${isCurrent ? 'border-secondary bg-secondary/5' : 'bg-white hover:shadow-2xl'} ${isRecommended ? 'border-primary ring-1 ring-primary/20' : 'border-gray-100'}`}
      onClick={onSelect}
      data-testid={`subscription-card-${tier._id}`}
    >
      {isRecommended && (
        <span className="absolute top-0 right-0 bg-primary text-white text-[10px] uppercase tracking-widest font-black px-4 py-1.5 rounded-bl-xl rounded-tr-xl">
          Recommended
        </span>
      )}

      {hasActiveDiscount && (
        <div className="absolute top-0 left-0 bg-green-500 text-white text-[10px] uppercase tracking-widest font-black px-4 py-1.5 rounded-br-xl rounded-tl-xl flex items-center gap-1.5">
          <Tag size={12} />
          {tier.discount?.type === 'percentage' ? `${tier.discount?.value}% OFF` : `₦${Number(tier.discount?.value).toLocaleString()} OFF`}
        </div>
      )}

      <div className="mt-4">
        <h3 className="text-xl font-black text-gray-800 mb-4 uppercase italic">{tier.name}</h3>

        <div className="mb-6">
          {hasActiveDiscount ? (
            <div className="flex flex-col">
              <span className="text-sm text-gray-400 line-through font-bold">₦{Number(tier.price).toLocaleString()}</span>
              <div className="flex items-baseline gap-1 flex-wrap">
                <span className="text-3xl sm:text-4xl font-black text-primary italic">₦{discountedPrice.toLocaleString()}</span>
                <span className="text-gray-500 font-bold text-sm">/{tier.durationInDays} days</span>
              </div>
            </div>
          ) : (
            <div className="flex items-baseline gap-1 flex-wrap">
              <span className="text-3xl sm:text-4xl font-black text-gray-900 italic">₦{tier.price.toLocaleString()}</span>
              <span className="text-gray-500 font-bold text-sm">/{tier.durationInDays} days</span>
            </div>
          )}
        </div>
      </div>

      <div className="mb-8">
        <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4 border-b border-gray-50 pb-2">Plan Features</h4>
        <ul className="space-y-3 text-gray-700">
          {Array.isArray(tier.features) && tier.features.map((feature, index) => (
            <li key={index} className="flex items-start">
              <CheckCircle className="text-green-500 w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
              <span className="text-sm font-medium">{feature}</span>
            </li>
          ))}
          {Array.isArray(tier.rules) && tier.rules.map((ruleItem, index) => {
            if (!ruleItem.displayText) return null;

            return (
              <li key={`rule-${index}`} className="flex items-start">
                <CheckCircle className="text-green-500 w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
                <span className="text-sm font-medium">{ruleItem.displayText}</span>
              </li>
            );
          })}
        </ul>
      </div>

      <button
        className={`w-full py-4 rounded-2xl font-black uppercase tracking-widest text-xs transition-all duration-300 shadow-lg ${isCurrent ? 'bg-gray-300 cursor-not-allowed shadow-none text-gray-500' : 'bg-primary hover:bg-indigo-700 text-white shadow-primary/20 hover:shadow-primary/40'}`}
        disabled={isCurrent}
      >
        {isCurrent ? 'Active Subscription' : hasAnyActiveSubscription ? 'Upgrade Now' : 'Purchase Now'}
      </button>
    </div>
  );
};

export default SubscriptionCard;
