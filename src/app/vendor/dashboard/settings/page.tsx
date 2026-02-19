"use client";
import React, { useState, useEffect } from "react";
import api from "@/services/api";
import SubscriptionCard from "@/components/vendor/SubscriptionCard";
import SearchableBankSelect from "@/components/vendor/SearchableBankSelect";
import axios from "axios";
import { Edit2, Building2, User, Hash, Shield } from "lucide-react";
import CustomLoader from "@/components/CustomLoader";
import Swal from "@/utils/sweetalert";
import withAuth from "@/components/auth/withAuth";
import { LicenseTier } from "@/types";

// Interfaces for our data structures
interface BankAccount {
  accountNumber: string;
  bankName: string;
  accountName: string;
  bankCode?: string;
  bvn?: string;
  nin?: string;
}

interface Bank {
  name: string;
  code: string;
}

interface Tier {
  _id: string;
  name: string;
}

interface CurrentSubscription {
  tier: Tier;
  status: string;
  purchaseDate: string;
  price: number;
}

interface SubscriptionHistoryItem {
  _id: string;
  tier: Tier;
  purchaseDate: string;
  price: number;
  status: string;
}

const SettingsPage = () => {
  const [activeTab, setActiveTab] = useState("licenses");

  // State for Bank Account
  const [bankAccount, setBankAccount] = useState<BankAccount>({
    accountNumber: "",
    bankName: "",
    accountName: "",
    bankCode: "",
    bvn: "",
    nin: "",
  });
  const [banks, setBanks] = useState<Bank[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [isAccountValidated, setIsAccountValidated] = useState(false);
  const [bankLoading, setBankLoading] = useState(true);
  const [bankError, setBankError] = useState<string | null>(null);

  // State for Licenses
  const [licenseTiers, setLicenseTiers] = useState<LicenseTier[]>([]);
  const [currentSubscription, setCurrentSubscription] = useState<CurrentSubscription | null>(null);
  const [subscriptionHistory, setSubscriptionHistory] = useState<SubscriptionHistoryItem[]>([]);
  const [recommendedTier, setRecommendedTier] = useState<string | null>(null);
  const [licenseLoading, setLicenseLoading] = useState(true);
  const [licenseError, setLicenseError] = useState<string | null>(null);

  const maskValue = (val?: string) => {
    if (!val) return "Not Set";
    if (val.length < 4) return val;
    return "*".repeat(val.length - 4) + val.slice(-4);
  };

  const fetchLicenseData = async () => {
    setLicenseLoading(true);
    setLicenseError(null);
    try {
      const [tiersRes, subRes, historyRes, recommendRes] = await Promise.all([
        api.get("/license-tiers"),
        api.get("/licenses/my-subscription").catch(err => (err.response?.status === 404 ? null : Promise.reject(err))),
        api.get("/licenses/my-history"),
        api.get("/licenses/recommend").catch(err => (err.response?.status === 404 ? null : Promise.reject(err))),
      ]);
      setLicenseTiers(tiersRes.data.data);
      setCurrentSubscription(subRes ? subRes.data.data : null);
      setSubscriptionHistory(historyRes.data.data);
      if (recommendRes && recommendRes.data.data.recommendedTier) {
        setRecommendedTier(recommendRes.data.data.recommendedTier._id);
      }
    } catch (error) {
      console.error("Error fetching license data:", error);
      setLicenseError("Failed to load subscription details. Please try again later.");
    } finally {
      setLicenseLoading(false);
    }
  };

  const fetchBankData = async () => {
    setBankLoading(true);
    setBankError(null);
    try {
      const [bankRes, banksListRes] = await Promise.all([
        api.get("/users/me/bank-details").catch(err => {
          if (err.response?.status === 404) return { data: { data: null } };
          throw err;
        }),
        api.get("/monnify/banks")
      ]);
      const bankData = bankRes.data.data || { accountNumber: "", bankName: "", accountName: "", bankCode: "", bvn: "", nin: "" };
      const banksList = banksListRes.data.data || [];

      // If bankName is missing but bankCode is present, resolve it from the banks list
      if (bankData.bankCode && !bankData.bankName && banksList.length > 0) {
        const matchingBank = banksList.find((b: Bank) => b.code === bankData.bankCode);
        if (matchingBank) {
          bankData.bankName = matchingBank.name;
        }
      }

      setBankAccount(bankData);
      setBanks(banksList);
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 403) {
        setBankError("You do not have permission to view or edit bank account details.");
      } else {
        setBankError("Failed to load bank account details. Please try again later.");
      }
      console.error("Error fetching bank account:", error);
    } finally {
      setBankLoading(false);
    }
  };

  useEffect(() => {
    const validateAccount = async () => {
      if (bankAccount.accountNumber.length === 10 && bankAccount.bankCode) {
        setIsValidating(true);
        setIsAccountValidated(false);
        try {
          const response = await api.post("/monnify/validate-account", {
            accountNumber: bankAccount.accountNumber,
            bankCode: bankAccount.bankCode
          });
          if (response.data.data && response.data.data.accountName) {
            setBankAccount(prev => ({
              ...prev,
              accountName: response.data.data.accountName
            }));
            setIsAccountValidated(true);
          } else {
            Swal.fire({
              title: "Validation Failed",
              text: "Could not retrieve account name. Please check your bank and account number.",
              icon: "error",
              confirmButtonColor: "#4F46E5",
            });
          }
        } catch (error) {
          console.error("Validation error:", error);
          Swal.fire({
            title: "Validation Error",
            text: "Invalid account details or validation failed. Please try again.",
            icon: "error",
            confirmButtonColor: "#4F46E5",
          });
        } finally {
          setIsValidating(false);
        }
      } else {
        setIsAccountValidated(false);
      }
    };

    if (isEditing) {
      validateAccount();
    }
  }, [bankAccount.accountNumber, bankAccount.bankCode, isEditing]);

  useEffect(() => {
    if (activeTab === "account") {
      fetchBankData();
    } else if (activeTab === "licenses") {
      fetchLicenseData();
    }
  }, [activeTab]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name === "accountNumber") {
      const sanitized = value.replace(/\D/g, "").slice(0, 10);
      setBankAccount((prev) => ({ ...prev, [name]: sanitized }));
    } else if (name === "bvn" || name === "nin") {
      const sanitized = value.replace(/\D/g, "").slice(0, 11);
      setBankAccount((prev) => ({ ...prev, [name]: sanitized }));
    } else {
      setBankAccount((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAccountValidated) {
      Swal.fire({
        title: "Incomplete Details",
        text: "Please provide a valid account number and bank.",
        icon: "warning",
        confirmButtonColor: "#4F46E5",
      });
      return;
    }

    if (!bankAccount.bvn || bankAccount.bvn.length !== 11) {
      Swal.fire({
        title: "Invalid BVN",
        text: "BVN must be exactly 11 digits.",
        icon: "warning",
        confirmButtonColor: "#4F46E5",
      });
      return;
    }

    if (!bankAccount.nin || bankAccount.nin.length !== 11) {
      Swal.fire({
        title: "Invalid NIN",
        text: "NIN must be exactly 11 digits.",
        icon: "warning",
        confirmButtonColor: "#4F46E5",
      });
      return;
    }

    Swal.fire({
      title: "Saving Details...",
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      },
    });

    try {
      await api.patch("/users/me/bank-details", {
        bankCode: bankAccount.bankCode,
        accountNumber: bankAccount.accountNumber,
        bvn: bankAccount.bvn,
        nin: bankAccount.nin,
      });
      Swal.fire({
        title: "Success!",
        text: "Bank account updated successfully!",
        icon: "success",
        confirmButtonColor: "#4F46E5",
      });
      setIsEditing(false);
    } catch (error) {
      console.error("Error updating bank account:", error);
      Swal.fire({
        title: "Error!",
        text: "Failed to update bank account. Please try again.",
        icon: "error",
        confirmButtonColor: "#4F46E5",
      });
    }
  };

  const handleSelectPlan = async (tierId: string, tierName: string) => {
    const action = currentSubscription ? "upgrade" : "purchase";
    const result = await Swal.fire({
      title: `Confirm ${action}`,
      text: `Are you sure you want to ${action} the ${tierName} plan?`,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: `Yes, ${action} it!`,
      cancelButtonText: "No, cancel",
    });

    if (result.isConfirmed) {
      Swal.fire({
        title: "Processing...",
        text: "Please wait while we process your request.",
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        },
      });

      try {
        const endpoint = currentSubscription ? "/licenses/upgrade" : "/licenses";
        const payload = currentSubscription ? { newTierId: tierId } : { tierId: tierId };
        const response = await api.post(endpoint, payload);

        let checkoutUrl = response.data.data.checkoutUrl;

        if (checkoutUrl) {
          // Append type=subscription to the checkout URL if not already present
          const url = new URL(checkoutUrl);
          if (!url.searchParams.has('type')) {
            url.searchParams.set('type', 'subscription');
            checkoutUrl = url.toString();
          }

          Swal.close();
          window.location.href = checkoutUrl;
        } else {
          Swal.fire("Error!", "Could not retrieve payment link. Please try again.", "error");
        }
      } catch (error) {
        console.error(`Failed to ${action} plan:`, error);
        Swal.fire("Error!", `There was an error trying to ${action} the plan. Please try again.`, "error");
      }
    }
  };

  const getExpiryDate = (purchaseDate: string, durationInDays: number) => {
    const date = new Date(purchaseDate);
    date.setDate(date.getDate() + durationInDays);
    return date.toLocaleDateString();
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6 text-primary">Settings</h1>
      <div className="flex border-b border-gray-300 mb-6">
        <button onClick={() => setActiveTab("account")} className={`py-2 px-4 text-lg ${activeTab === "account" ? "border-b-2 border-primary text-primary" : "text-gray-500"}`}>Bank Account</button>
        <button onClick={() => setActiveTab("licenses")} className={`py-2 px-4 text-lg ${activeTab === "licenses" ? "border-b-2 border-primary text-primary" : "text-gray-500"}`}>Licenses & Subscriptions</button>
      </div>

      <div>
        {activeTab === "account" && (
          bankLoading ? (
            <div className="flex flex-col items-center justify-center py-20 bg-white rounded-xl shadow-sm border border-gray-100">
              <CustomLoader size={40} className="mb-4" />
              <p className="text-gray-500 font-medium">Loading bank details...</p>
            </div>
          ) :
          <div className="bg-white p-8 shadow-sm rounded-xl border border-gray-100">
            <div className="flex items-center justify-between mb-8 pb-4 border-b border-gray-50">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Settlement Account</h2>
                <p className="text-gray-500 text-sm mt-1">This is where your payments will be disbursed.</p>
              </div>
              {!isEditing && !bankError && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-primary bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors"
                >
                  <Edit2 className="w-4 h-4" />
                  Edit Details
                </button>
              )}
            </div>

            {bankError ? (
              <div className="text-red-600 p-6 bg-red-50 rounded-xl border border-red-100 flex flex-col items-center text-center">
                <p className="font-medium">{bankError}</p>
                <button
                  onClick={() => window.location.reload()}
                  className="mt-4 text-sm font-bold underline"
                >
                  Try again
                </button>
              </div>
            ) : !isEditing ? (
              // View Mode
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-gray-400 text-sm font-medium uppercase tracking-wider">
                    <Building2 className="w-4 h-4" />
                    Bank Name
                  </div>
                  <p className="text-lg font-semibold text-gray-800">{bankAccount.bankName || "Not Set"}</p>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-gray-400 text-sm font-medium uppercase tracking-wider">
                    <Hash className="w-4 h-4" />
                    Account Number
                  </div>
                  <p className="text-lg font-semibold text-gray-800 tracking-wider">{bankAccount.accountNumber || "Not Set"}</p>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-gray-400 text-sm font-medium uppercase tracking-wider">
                    <User className="w-4 h-4" />
                    Account Name
                  </div>
                  <p className="text-lg font-semibold text-gray-800">{bankAccount.accountName || "Not Set"}</p>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-gray-400 text-sm font-medium uppercase tracking-wider">
                    <Shield className="w-4 h-4" />
                    BVN
                  </div>
                  <p className="text-lg font-semibold text-gray-800 tracking-wider">{maskValue(bankAccount.bvn)}</p>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-gray-400 text-sm font-medium uppercase tracking-wider">
                    <Shield className="w-4 h-4" />
                    NIN
                  </div>
                  <p className="text-lg font-semibold text-gray-800 tracking-wider">{maskValue(bankAccount.nin)}</p>
                </div>
                {(!bankAccount.bankName || !bankAccount.accountNumber || !bankAccount.bvn || !bankAccount.nin) && (
                  <div className="md:col-span-2 lg:col-span-3 mt-4">
                    <button
                      onClick={() => setIsEditing(true)}
                      className="w-full py-4 border-2 border-dashed border-gray-200 rounded-xl text-gray-400 font-medium hover:border-primary hover:text-primary transition-all flex items-center justify-center gap-2"
                    >
                      Click here to add your bank details
                    </button>
                  </div>
                )}
              </div>
            ) : (
              // Edit Mode
              <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">Select Bank</label>
                  <SearchableBankSelect
                    banks={banks}
                    selectedBankCode={bankAccount.bankCode}
                    onSelect={(bank) => setBankAccount(prev => ({ ...prev, bankCode: bank.code, bankName: bank.name }))}
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="accountNumber" className="block text-sm font-semibold text-gray-700">Account Number</label>
                  <div className="relative">
                    <input
                      id="accountNumber"
                      name="accountNumber"
                      type="text"
                      placeholder="Enter 10-digit Account Number"
                      value={bankAccount.accountNumber}
                      onChange={handleInputChange}
                      className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all tracking-widest text-lg font-medium"
                    />
                    {isValidating && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2 text-primary">
                        <CustomLoader size={16} />
                        <span className="text-xs font-medium">Validating...</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">Account Name</label>
                  <div className={`p-4 rounded-lg border bg-gray-50 min-h-[56px] flex items-center ${isAccountValidated ? 'border-green-200' : 'border-gray-200'}`}>
                    {bankAccount.accountName ? (
                      <p className={`font-bold ${isAccountValidated ? 'text-green-700' : 'text-gray-700'}`}>
                        {bankAccount.accountName}
                      </p>
                    ) : (
                      <p className="text-gray-400 italic text-sm">Enter account details to verify name...</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label htmlFor="bvn" className="block text-sm font-semibold text-gray-700">BVN (11 Digits)</label>
                    <input
                      id="bvn"
                      name="bvn"
                      type="text"
                      placeholder="Enter 11-digit BVN"
                      value={bankAccount.bvn}
                      onChange={handleInputChange}
                      className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all tracking-widest text-lg font-medium ${bankAccount.bvn && bankAccount.bvn.length !== 11 ? 'border-red-300' : ''}`}
                    />
                    {bankAccount.bvn && bankAccount.bvn.length !== 11 && (
                      <p className="text-red-500 text-xs">BVN must be exactly 11 digits</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="nin" className="block text-sm font-semibold text-gray-700">NIN (11 Digits)</label>
                    <input
                      id="nin"
                      name="nin"
                      type="text"
                      placeholder="Enter 11-digit NIN"
                      value={bankAccount.nin}
                      onChange={handleInputChange}
                      className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all tracking-widest text-lg font-medium ${bankAccount.nin && bankAccount.nin.length !== 11 ? 'border-red-300' : ''}`}
                    />
                    {bankAccount.nin && bankAccount.nin.length !== 11 && (
                      <p className="text-red-500 text-xs">NIN must be exactly 11 digits</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-4 pt-4">
                  <button
                    type="submit"
                    disabled={!isAccountValidated || isValidating || bankAccount.bvn?.length !== 11 || bankAccount.nin?.length !== 11}
                    className={`flex-1 py-3 px-6 rounded-lg font-bold text-white transition-all ${!isAccountValidated || isValidating || bankAccount.bvn?.length !== 11 || bankAccount.nin?.length !== 11 ? 'bg-gray-300 cursor-not-allowed' : 'bg-primary hover:bg-indigo-700 shadow-md hover:shadow-lg'}`}
                  >
                    Save Account Details
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditing(false);
                      fetchBankData();
                    }}
                    className="px-6 py-3 border border-gray-200 rounded-lg font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {activeTab === "licenses" && (
          licenseLoading ? (
            <div className="flex flex-col items-center justify-center py-20 bg-white rounded-xl shadow-sm border border-gray-100">
              <CustomLoader size={40} className="mb-4" />
              <p className="text-gray-500 font-medium">Loading subscription details...</p>
            </div>
          ) :
          licenseError ? <div className="text-red-600 p-4 bg-red-50 border border-red-100 rounded-lg">{licenseError}</div> :
          <div>
            <div className="mb-12">
              <h2 className="text-2xl font-semibold text-gray-800 mb-6">Upgrade or Purchase a Subscription</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                {licenseTiers.filter(t => t.isPublic).map((tier) => (
                  <SubscriptionCard
                    key={tier._id}
                    tier={tier}
                    isCurrent={currentSubscription?.tier._id === tier._id}
                    isRecommended={tier._id === recommendedTier}
                    hasAnyActiveSubscription={!!currentSubscription}
                    onSelect={() => handleSelectPlan(tier._id, tier.name)}
                  />
                ))}
              </div>
            </div>

            <div className="mb-12">
              <h2 className="text-2xl font-black text-gray-800 mb-6 uppercase italic">Your Current Subscription</h2>
              <div className="bg-white p-8 shadow-xl rounded-3xl border border-gray-100 overflow-hidden relative">
                {currentSubscription ? (
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-2xl font-black text-primary uppercase italic">{currentSubscription.tier.name}</h3>
                        <span className="px-3 py-1 bg-green-50 text-green-600 text-[10px] font-black uppercase tracking-widest rounded-full border border-green-100">
                          {currentSubscription.status}
                        </span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                        <div className="space-y-1">
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Purchased On</p>
                          <p className="text-sm font-bold text-gray-700">{new Date(currentSubscription.purchaseDate).toLocaleDateString()}</p>
                        </div>
                        {(() => {
                          const currentTierDetails = licenseTiers.find(t => t._id === currentSubscription.tier._id);
                          if (currentTierDetails) {
                            return (
                              <div className="space-y-1">
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Expires On</p>
                                <p className="text-sm font-bold text-gray-700">{getExpiryDate(currentSubscription.purchaseDate, currentTierDetails.durationInDays)}</p>
                              </div>
                            );
                          }
                          return null;
                        })()}
                      </div>
                    </div>
                    <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100 text-center md:text-right">
                       <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Subscription Fee</p>
                       {(() => {
                         const tierDetails = licenseTiers.find(t => t._id === currentSubscription.tier._id);
                         const hasDiscount = tierDetails?.discount && (tierDetails.discount.value || 0) > 0;
                         const isExpired = tierDetails?.discount?.expiryDate && new Date(tierDetails.discount.expiryDate) < new Date();

                         if (hasDiscount && !isExpired && tierDetails && tierDetails.discount) {
                           const price = Number(tierDetails.price);
                           const discVal = Number(tierDetails.discount.value);
                           let discounted = price;
                           if (tierDetails.discount.type === 'percentage') {
                             discounted = price - (price * (discVal / 100));
                           } else if (tierDetails.discount.type === 'fixed') {
                             discounted = Math.max(0, price - discVal);
                           }

                           return (
                             <div className="flex flex-col items-center md:items-end">
                               <span className="text-xs text-gray-400 line-through font-bold">₦{price.toLocaleString()}</span>
                               <p className="text-3xl font-black text-primary italic">₦{discounted.toLocaleString()}</p>
                             </div>
                           );
                         }

                         return <p className="text-3xl font-black text-gray-900 italic">₦{currentSubscription.price.toLocaleString()}</p>;
                       })()}
                    </div>
                  </div>
                ) : (
                  <div className="py-10 text-center">
                    <div className="bg-gray-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Shield className="text-gray-300" size={32} />
                    </div>
                    <p className="text-gray-500 font-bold italic">No active subscription found.</p>
                    <p className="text-sm text-gray-400 mt-1">Upgrade your plan to unlock more features.</p>
                  </div>
                )}
              </div>
            </div>

            <div>
              <h2 className="text-2xl font-black text-gray-800 mb-6 uppercase italic">Subscription History</h2>
              <div className="bg-white shadow-xl rounded-3xl border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-100">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Date</th>
                        <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Package</th>
                        <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Amount Paid</th>
                        <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {subscriptionHistory.length > 0 ? subscriptionHistory.map((item) => (
                        <tr key={item._id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-700">{new Date(item.purchaseDate).toLocaleDateString()}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-sm font-black text-primary uppercase italic">{item.tier.name}</span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">₦{item.price.toLocaleString()}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                              item.status === 'active' || item.status === 'completed'
                                ? 'bg-green-50 text-green-600 border-green-100'
                                : item.status === 'pending'
                                ? 'bg-amber-50 text-amber-600 border-amber-100'
                                : 'bg-gray-50 text-gray-500 border-gray-100'
                            }`}>
                              {item.status}
                            </span>
                          </td>
                        </tr>
                      )) : (
                        <tr>
                          <td colSpan={4} className="px-6 py-12 text-center text-gray-400 italic font-bold">
                            No subscription history found.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default withAuth(SettingsPage, ["hall-owner"]);
