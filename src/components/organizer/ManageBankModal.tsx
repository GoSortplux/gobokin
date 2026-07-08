"use client";
import React, { useState, useEffect } from "react";
import { X, Building2, Hash, User, ShieldCheck, AlertCircle } from "lucide-react";
import api from "@/services/api";
import { OrganizerBankAccount } from "@/types";
import SearchableBankSelect from "@/components/vendor/SearchableBankSelect";
import CustomLoader from "@/components/CustomLoader";
import Swal from "@/utils/sweetalert";
import { translateError } from "@/utils/errors";

interface Bank {
  name: string;
  code: string;
}

interface ManageBankModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialData?: OrganizerBankAccount | null;
}

const ManageBankModal = ({ isOpen, onClose, onSuccess, initialData }: ManageBankModalProps) => {
  const [bankAccount, setBankAccount] = useState({
    bankCode: initialData?.bankCode || "",
    bankName: initialData?.bankName || "",
    accountNumber: initialData?.accountNumber || "",
    accountName: initialData?.accountName || "",
  });
  const [banks, setBanks] = useState<Bank[]>([]);
  const [isValidating, setIsValidating] = useState(false);
  const [isAccountValidated, setIsAccountValidated] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingBanks, setLoadingBanks] = useState(true);

  useEffect(() => {
    if (isOpen) {
      fetchBanks();
      if (initialData) {
        setBankAccount({
          bankCode: initialData.bankCode,
          bankName: initialData.bankName,
          accountNumber: initialData.accountNumber,
          accountName: initialData.accountName,
        });
        setIsAccountValidated(true);
      } else {
        setBankAccount({
          bankCode: "",
          bankName: "",
          accountNumber: "",
          accountName: "",
        });
        setIsAccountValidated(false);
      }
    }
  }, [isOpen, initialData]);

  const fetchBanks = async () => {
    try {
      setLoadingBanks(true);
      const response = await api.get("/monnify/banks");
      setBanks(response.data.data || []);
    } catch (error) {
      console.error("Failed to fetch banks:", error);
    } finally {
      setLoadingBanks(false);
    }
  };

  useEffect(() => {
    // If user changes input, we reset validation
    // But we don't want to reset if it's the initial load with data
    if (initialData &&
        bankAccount.accountNumber === initialData.accountNumber &&
        bankAccount.bankCode === initialData.bankCode) {
      return;
    }

    setIsAccountValidated(false);
    setBankAccount(prev => ({ ...prev, accountName: "" }));
  }, [bankAccount.accountNumber, bankAccount.bankCode, initialData]);

  useEffect(() => {
    const validateAccount = async () => {
      setIsValidating(true);
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
        }
      } catch (error) {
        console.error("Validation error:", error);
      } finally {
        setIsValidating(false);
      }
    };

    const timer = setTimeout(() => {
      if (bankAccount.accountNumber.length === 10 && bankAccount.bankCode && !isAccountValidated) {
        validateAccount();
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [bankAccount.accountNumber, bankAccount.bankCode, isAccountValidated]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name === "accountNumber") {
      const sanitized = value.replace(/\D/g, "").slice(0, 10);
      setBankAccount((prev) => ({ ...prev, [name]: sanitized }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAccountValidated) {
      Swal.fire("Validation Required", "Please provide a valid account number and bank.", "warning");
      return;
    }

    setIsSubmitting(true);
    try {
      await api.post("/events/my-organizer-profile/bank-account", bankAccount);
      Swal.fire({
        title: "Success!",
        text: "Bank account submitted for verification.",
        icon: "success",
        confirmButtonColor: "#295FA7"
      });
      onSuccess();
      onClose();
    } catch (error) {
      Swal.fire("Error", translateError(error), "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-xl rounded-[2rem] sm:rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="bg-primary p-5 sm:p-7 text-white relative shrink-0">
          <button
            onClick={onClose}
            className="absolute top-4 sm:top-5 right-4 sm:right-6 p-2 hover:bg-white/10 rounded-xl transition-colors"
          >
            <X className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/20 rounded-xl sm:rounded-2xl flex items-center justify-center backdrop-blur-md">
              <Building2 className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight">Payout Settings</h2>
              <p className="text-white/70 text-[11px] sm:text-sm font-medium">Manage where you receive your earnings</p>
            </div>
          </div>
        </div>

        <div className="p-5 sm:p-7 space-y-6 overflow-y-auto no-scrollbar flex-1">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2 ml-1">
                <Building2 size={12} className="text-primary" />
                Select Bank
              </label>
              <SearchableBankSelect
                banks={banks}
                selectedBankCode={bankAccount.bankCode}
                onSelect={(bank) => setBankAccount(prev => ({ ...prev, bankCode: bank.code, bankName: bank.name }))}
                disabled={loadingBanks}
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2 ml-1">
                <Hash size={12} className="text-primary" />
                Account Number
              </label>
              <div className="relative">
                <input
                  name="accountNumber"
                  type="text"
                  placeholder="Enter 10-digit Account Number"
                  value={bankAccount.accountNumber}
                  onChange={handleInputChange}
                  className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl text-sm font-bold focus:border-primary focus:bg-white outline-none transition-all tracking-wider"
                />
                {isValidating && (
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2 text-primary">
                    <CustomLoader size={16} />
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2 ml-1">
                <User size={12} className="text-primary" />
                Account Name
              </label>
              <div className={`p-5 rounded-2xl border-2 bg-gray-50 flex items-center min-h-[60px] ${isAccountValidated ? 'border-emerald-100 bg-emerald-50/30' : 'border-gray-100'}`}>
                {bankAccount.accountName ? (
                  <div className="flex items-center gap-3">
                    <p className={`font-black text-sm ${isAccountValidated ? 'text-emerald-700' : 'text-gray-700'}`}>
                      {bankAccount.accountName}
                    </p>
                    {isAccountValidated && <ShieldCheck size={16} className="text-emerald-500" />}
                  </div>
                ) : (
                  <p className="text-gray-400 font-medium italic text-xs">Enter account details to verify name...</p>
                )}
              </div>
            </div>

            <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100 flex items-start gap-3">
              <AlertCircle size={16} className="text-amber-600 shrink-0 mt-0.5" />
              <p className="text-[10px] text-amber-700 font-medium leading-relaxed">
                Your account details will be verified with Monnify and submitted for Admin approval. Ensure the name matches your official business or personal bank record.
              </p>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="p-5 sm:p-7 bg-gray-50/80 backdrop-blur-md border-t border-gray-100 shrink-0">
          <div className="flex items-center gap-3 sm:gap-4">
            <button
              onClick={onClose}
              className="flex-1 px-6 py-3.5 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-gray-900 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={!isAccountValidated || isSubmitting || isValidating}
              className="flex-[2] flex items-center justify-center gap-3 bg-primary text-white px-8 py-3.5 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl shadow-primary/30 hover:shadow-primary/40 hover:-translate-y-0.5 active:translate-y-0 transition-all disabled:opacity-50 disabled:pointer-events-none"
            >
              {isSubmitting ? (
                <>
                  <CustomLoader size={16} />
                  Saving...
                </>
              ) : (
                "Save Account Details"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManageBankModal;
