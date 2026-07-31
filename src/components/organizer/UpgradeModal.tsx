'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Zap,
  Shield,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Sparkles,
  TrendingUp,
  Users,
  Ticket,
  PlusCircle,
  Calendar,
  Loader2,
  Mail
} from 'lucide-react';
import api from '@/services/api';
import { useOrganizerRules } from '@/hooks/useOrganizerRules';
import { SubscriptionPackage, OrganizerRule } from '@/types';
import { translateError } from '@/utils/errors';
import Swal from '@/utils/sweetalert';

interface UpgradeModalProps {
  isOpen: boolean;
  featureKey: string;
  onClose: () => void;
}

const FEATURE_CONFIGS: Record<string, {
  name: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  icon: React.ComponentType<any>;
  actionLabel: string;
  description: string;
}> = {
  MAX_GUESTS: {
    name: 'Guest Capacity',
    icon: Users,
    actionLabel: 'Adjust Capacity',
    description: 'The maximum expected guest capacity allowed for your event.'
  },
  MAX_TICKET_CATEGORIES: {
    name: 'Ticket Categories',
    icon: Ticket,
    actionLabel: 'Adjust Categories',
    description: 'The maximum different ticket types or tiers you can create.'
  },
  MAX_ACTIVE_EVENTS: {
    name: 'Active Events Limit',
    icon: Calendar,
    actionLabel: 'Manage Events',
    description: 'The maximum number of ongoing or draft events you can manage concurrently.'
  },
  MAX_STAFF: {
    name: 'Staff Pool Capacity',
    icon: Users,
    actionLabel: 'Adjust Staff',
    description: 'The maximum number of event staff/managers you can assign to your profile.'
  },
  BROADCAST_ALLOWED: {
    name: 'Guest Messaging',
    icon: Mail,
    actionLabel: 'Dismiss',
    description: 'Deliver dynamic real-time email announcements, schedule changes, and updates directly to your registered attendees.'
  },
  REMINDERS_ALLOWED: {
    name: 'Automated Reminders',
    icon: Sparkles,
    actionLabel: 'Later',
    description: 'Dynamic scheduled email & SMS reminders sent directly to your ticket holders.'
  },
  WALK_IN_REGISTRATION_ALLOWED: {
    name: 'Walk-in Registration',
    icon: PlusCircle,
    actionLabel: 'Dismiss',
    description: 'Register offline/walk-in guests directly inside your check-in dashboard.'
  },
  OFFLINE_CHECKIN_ALLOWED: {
    name: 'Offline Check-in Mode',
    icon: Shield,
    actionLabel: 'Dismiss',
    description: 'Secure client-side barcode scanning check-ins without active internet connection.'
  },
  RESOURCES_ALLOWED: {
    name: 'Resource & File Sharing',
    icon: TrendingUp,
    actionLabel: 'Dismiss',
    description: 'Directly distribute event slides, booklets, or resources to registered attendees.'
  }
};

export const UpgradeModal: React.FC<UpgradeModalProps> = ({ isOpen, featureKey, onClose }) => {
  const { rules, title: currentPlanTitle } = useOrganizerRules();
  const [packages, setPackages] = useState<SubscriptionPackage[]>([]);
  const [packagesLoading, setPackagesLoading] = useState(false);
  const [purchasingId, setPurchasingId] = useState<string | null>(null);

  // Fetch subscription packages dynamically
  useEffect(() => {
    if (!isOpen) return;

    const fetchPackages = async () => {
      try {
        setPackagesLoading(true);
        const response = await api.get('/events/admin/packages');
        setPackages(response.data.data || []);
      } catch (error) {
        console.error('Failed to fetch packages for upgrade modal:', error);
      } finally {
        setPackagesLoading(false);
      }
    };

    fetchPackages();
  }, [isOpen]);

  const config = FEATURE_CONFIGS[featureKey] || {
    name: 'Premium Feature',
    icon: Zap,
    actionLabel: 'Dismiss',
    description: 'This operational feature is restricted on your current account tier.'
  };

  const IconComponent = config.icon;

  // Retrieve current active rule from context rules
  const activeRule = useMemo(() => {
    return rules.find(r => r.key === featureKey);
  }, [rules, featureKey]);

  // Handle direct subscription purchase and payment initialization
  const handlePurchase = async (packageId: string) => {
    try {
      setPurchasingId(packageId);
      Swal.showLoading();
      const response = await api.post('/events/subscriptions/initialize', {
        packageId
      });

      const url = response.data?.data?.checkoutUrl || response.data?.data?.paymentUrl;
      if (response.data.success && url) {
        window.location.href = url;
      } else {
        throw new Error('Failed to initialize subscription checkout');
      }
    } catch (error) {
      Swal.fire('Error', translateError(error), 'error');
    } finally {
      setPurchasingId(null);
    }
  };

  // Helper to format package rule values beautifully
  const formatRuleValue = (val: string | boolean | undefined) => {
    if (val === undefined || val === null) return 'Not Included';
    if (val === 'true' || val === true) return 'Included';
    if (val === 'false' || val === false) return 'Not Included';
    if (val === '-1') return 'Unlimited';
    return val;
  };

  const getPackageRuleValue = (pkg: SubscriptionPackage, key: string) => {
    const rule = pkg.rules?.find(r => r.ruleKey === key);
    return rule ? rule.ruleValue : 'false';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] overflow-y-auto flex items-center justify-center p-4">
      {/* Blurred Backdrop */}
      <div
        className="fixed inset-0 bg-gray-950/60 backdrop-blur-md transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Main Modal Panel */}
      <div className="relative bg-white rounded-[2.5rem] border border-gray-100 shadow-2xl shadow-gray-900/40 w-full max-w-5xl max-h-[90vh] overflow-y-auto no-scrollbar animate-in zoom-in-95 duration-300 flex flex-col">

        {/* Floating Accent Glow */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-secondary/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 pointer-events-none"></div>

        {/* Modal Header */}
        <div className="px-8 pt-8 pb-4 flex items-start justify-between border-b border-gray-50 relative z-10">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-amber-50 text-amber-500 rounded-2xl flex items-center justify-center shadow-sm shrink-0">
              <Zap size={24} className="animate-pulse" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[10px] font-black text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md uppercase tracking-widest border border-amber-100">
                  Plan Limit Exceeded
                </span>
                <span className="text-xs font-bold text-gray-400">
                  {currentPlanTitle || 'Free Plan Account'}
                </span>
              </div>
              <h2 className="text-2xl font-black text-gray-900 tracking-tight mt-1">Upgrade Your Account</h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 bg-gray-50 hover:bg-gray-100 rounded-xl text-gray-400 hover:text-gray-900 transition-colors shrink-0"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-8 space-y-10 flex-1 relative z-10">

          {/* Section 1: Exceeded Feature Highlight Cards */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-1 h-4 bg-primary rounded-full"></div>
              <h3 className="text-xs font-black text-gray-900 uppercase tracking-widest">Exceeded Limit</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Current Status Card */}
              <div className="p-6 bg-rose-50/30 border border-rose-100 rounded-3xl flex flex-col justify-between space-y-4">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-white text-rose-500 rounded-2xl flex items-center justify-center shadow-sm border border-rose-100 shrink-0">
                    <IconComponent size={24} />
                  </div>
                  <div>
                    <h4 className="font-black text-gray-900 text-lg leading-tight">{config.name}</h4>
                    <p className="text-xs text-gray-500 font-medium mt-1 leading-relaxed">{config.description}</p>
                  </div>
                </div>

                <div className="pt-4 border-t border-rose-100/50">
                  <div className="flex justify-between items-baseline">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Your Current Capacity</span>
                    <span className="text-2xl font-black text-rose-600 italic">
                      {activeRule ? formatRuleValue(activeRule.value) : 'Restricted'}
                    </span>
                  </div>
                  <p className="text-[10px] text-rose-500/80 font-bold uppercase tracking-tight mt-1">
                    ⚠️ Plan Limit reached. Adjust settings or unlock the premium tier below.
                  </p>
                </div>
              </div>

              {/* Upgrade Advantage Card */}
              <div className="p-6 bg-primary/5 border border-primary/10 rounded-3xl flex flex-col justify-between space-y-4">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-white text-primary rounded-2xl flex items-center justify-center shadow-sm border border-primary/10 shrink-0">
                    <CheckCircle2 size={24} />
                  </div>
                  <div>
                    <h4 className="font-black text-gray-900 text-lg leading-tight">Premium Solution</h4>
                    <p className="text-xs text-gray-500 font-medium mt-1 leading-relaxed">
                      Instant upgrade scales this feature to unlimited or multi-fold limits to guarantee smooth attendee operations.
                    </p>
                  </div>
                </div>

                <div className="pt-4 border-t border-primary/10">
                  <div className="flex justify-between items-baseline">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Premium Plan Limit</span>
                    <span className="text-2xl font-black text-primary italic">
                      {packages.length > 0
                        ? formatRuleValue(getPackageRuleValue(packages[packages.length - 1], featureKey))
                        : 'Unlimited'
                      }
                    </span>
                  </div>
                  <p className="text-[10px] text-primary/80 font-bold uppercase tracking-tight mt-1">
                    🚀 Gain instant activation upon successful monnify validation.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Dynamically Fetched Subscription Packages Grid */}
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <div className="w-1 h-4 bg-primary rounded-full"></div>
                <h3 className="text-xs font-black text-gray-900 uppercase tracking-widest">Available Packages</h3>
              </div>
              <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest bg-gray-50 border border-gray-100 px-3 py-1 rounded-xl">
                Monnify Secured Gateways
              </span>
            </div>

            {packagesLoading ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Loading Premium Packages...</p>
              </div>
            ) : packages.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {packages.map((pkg) => {
                  const hasDiscount = (pkg.pricingBreakdown?.discountAmount ?? 0) > 0;
                  const finalPrice = pkg.pricingBreakdown ? pkg.pricingBreakdown.finalPrice : pkg.price;
                  const currencySym = pkg.pricingBreakdown?.currency === 'USD' ? '$' : '₦';

                  return (
                    <div
                      key={pkg.id}
                      className="bg-white rounded-3xl border border-gray-100 shadow-lg hover:shadow-xl transition-all duration-300 p-6 flex flex-col justify-between space-y-6 relative overflow-hidden group hover:border-primary/20"
                    >
                      {/* Popular / Best value badge if last */}
                      {hasDiscount && (
                        <div className="absolute top-4 right-4 bg-rose-50 text-rose-600 text-[8px] font-black px-2 py-0.5 rounded-full border border-rose-100 uppercase tracking-widest">
                          {pkg.pricingBreakdown?.discountPercentage}% OFF
                        </div>
                      )}

                      <div className="space-y-4">
                        <div>
                          <h4 className="text-lg font-black text-gray-900 tracking-tight uppercase italic">{pkg.name}</h4>
                          <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest mt-1">{pkg.durationDays} Days Duration</p>
                        </div>

                        {/* Price Area */}
                        <div className="p-4 bg-gray-50/50 rounded-2xl border border-gray-50/50 flex flex-col">
                          <div className="flex items-baseline gap-1.5">
                            <span className="text-2xl font-black text-primary tracking-tighter italic">
                              {currencySym}{finalPrice.toLocaleString()}
                            </span>
                            {hasDiscount && (
                              <span className="text-xs text-gray-400 line-through font-bold">
                                {currencySym}{pkg.pricingBreakdown?.basePrice.toLocaleString()}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Rules List inside Package */}
                        <div className="space-y-2.5 pt-2">
                          <p className="text-[8px] font-black text-gray-400 uppercase tracking-wider">Package Limits & Capabilities</p>
                          <div className="space-y-2">
                            {pkg.rules.map((rule, idx) => {
                              const ruleValueFormatted = formatRuleValue(rule.ruleValue);
                              const isThisFeature = rule.ruleKey === featureKey;

                              return (
                                <div
                                  key={idx}
                                  className={`flex items-center justify-between text-xs p-2 rounded-xl transition-colors ${
                                    isThisFeature ? 'bg-primary/5 border border-primary/10' : 'bg-transparent'
                                  }`}
                                >
                                  <span className={`text-[10px] font-bold uppercase ${isThisFeature ? 'text-primary font-black' : 'text-gray-500'}`}>
                                    {rule.ruleKey.replace(/_/g, ' ')}
                                  </span>
                                  <span className={`font-black italic ${isThisFeature ? 'text-primary' : 'text-gray-700'}`}>
                                    {rule.ruleKey === 'COMMISSION_RATE' ? `%${ruleValueFormatted}` : ruleValueFormatted}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>

                      {/* Upgrade Now Button */}
                      <button
                        onClick={() => handlePurchase(pkg.id)}
                        disabled={purchasingId === pkg.id}
                        className="w-full bg-gray-900 text-white font-black py-3.5 rounded-2xl hover:bg-primary transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-widest text-[10px]"
                      >
                        {purchasingId === pkg.id ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          <>
                            Upgrade Now
                            <ArrowRight size={12} />
                          </>
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-10 bg-gray-50 rounded-3xl border border-dashed border-gray-200">
                <AlertCircle size={24} className="text-gray-300 mx-auto mb-2" />
                <p className="text-xs text-gray-400 font-medium">No operational premium packages available right now.</p>
              </div>
            )}
          </div>

          {/* Section 3: Comparative Grid of Other Critical Features */}
          <div className="space-y-4 pt-4 border-t border-gray-50">
            <div className="flex items-center gap-2">
              <div className="w-1 h-4 bg-primary rounded-full"></div>
              <h3 className="text-xs font-black text-gray-900 uppercase tracking-widest">Other Rules & Permissions Comparison</h3>
            </div>

            <div className="bg-gray-50/50 border border-gray-100 rounded-3xl p-6 overflow-x-auto no-scrollbar">
              <div className="min-w-[600px] divide-y divide-gray-100">
                {/* Header row */}
                <div className="grid grid-cols-3 pb-3 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                  <div>Operational Feature</div>
                  <div className="text-center">Your Current Plan</div>
                  <div className="text-right">Premium Package Maximum</div>
                </div>

                {/* Compare items dynamically */}
                {rules.filter(r => r.key !== featureKey).map((rule: OrganizerRule) => {
                  const matchingPremiumValues = packages.map(pkg => getPackageRuleValue(pkg, rule.key));
                  const maxPremiumValue = matchingPremiumValues.length > 0
                    ? formatRuleValue(matchingPremiumValues[matchingPremiumValues.length - 1])
                    : 'Included / Unlimited';

                  return (
                    <div key={rule.key} className="grid grid-cols-3 py-3.5 items-center text-xs">
                      <div className="flex flex-col">
                        <span className="font-black text-gray-800 uppercase tracking-tight">{rule.title}</span>
                        <span className="text-[9px] text-gray-400 mt-0.5 leading-none">{rule.description}</span>
                      </div>
                      <div className="text-center">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-black italic ${
                          rule.isRestricted ? 'bg-rose-50 text-rose-600 border border-rose-100' : 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                        }`}>
                          {formatRuleValue(rule.value)}
                        </span>
                      </div>
                      <div className="text-right font-black italic text-primary">
                        {maxPremiumValue}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

        </div>

        {/* Modal Footer Controls */}
        <div className="bg-gray-50 px-8 py-5 border-t border-gray-100 flex items-center justify-between">
          <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">
            Gobokin Subscription Protocol Secured
          </p>
          <button
            onClick={onClose}
            className="flex items-center gap-2 bg-white text-gray-700 hover:text-gray-900 border border-gray-200 font-black px-6 py-3 rounded-2xl hover:bg-gray-50 transition-all text-[10px] uppercase tracking-[0.2em] shadow-sm cursor-pointer"
          >
            {config.actionLabel}
          </button>
        </div>

      </div>
    </div>
  );
};
