"use client";
import React, { useState, useEffect } from "react";
import api from "@/services/api";
import LoadingSpinner from "@/components/admin/LoadingSpinner";
import { Edit, Trash, PlusCircle, ShieldCheck } from "lucide-react";
import TierModal from "@/components/admin/TierModal";
import Swal from "@/utils/sweetalert";
import { LicenseTier, SubscriptionRule } from "@/types";

const LicenseTiersTab = () => {
  const [tiers, setTiers] = useState<LicenseTier[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTier, setSelectedTier] = useState<Partial<LicenseTier> | undefined>(undefined);

  useEffect(() => {
    fetchTiers();
  }, []);

  const fetchTiers = async () => {
    setLoading(true);
    try {
      const response = await api.get("/license-tiers");
      setTiers(response.data.data);
    } catch (error) {
      console.error("Error fetching license tiers:", error);
      Swal.fire("Error", "Could not fetch license tiers.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleAddTier = () => {
    setSelectedTier(undefined);
    setIsModalOpen(true);
  };

  const handleEditTier = (tier: LicenseTier) => {
    setSelectedTier(tier);
    setIsModalOpen(true);
  };

  const handleModalSubmit = async (tier: LicenseTier) => {
    try {
      if (tier._id) {
        await api.patch(`/license-tiers/${tier._id}`, tier);
        Swal.fire('Success!', 'License tier updated.', 'success');
      } else {
        await api.post('/license-tiers', tier);
        Swal.fire('Success!', 'New license tier created.', 'success');
      }
      fetchTiers();
      setIsModalOpen(false);
    } catch (error) {
      console.error("Error saving tier:", error);
      Swal.fire('Error', 'Could not save the tier.', 'error');
    }
  };

  const handleDeleteTier = async (tierId: string) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: "This will permanently delete the license tier.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      confirmButtonText: 'Yes, delete it!'
    });

    if (result.isConfirmed) {
      try {
        await api.delete(`/license-tiers/${tierId}`);
        Swal.fire('Deleted!', 'The license tier has been deleted.', 'success');
        fetchTiers();
      } catch (error) {
        console.error("Error deleting tier:", error);
        Swal.fire('Error', 'Could not delete the tier.', 'error');
      }
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <TierModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleModalSubmit}
        tier={selectedTier}
      />
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-2xl font-bold text-gray-800">License Tiers</h2>
        <button
            onClick={handleAddTier}
            className="bg-primary text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-opacity-90"
        >
          <PlusCircle size={20} />
          <span>Add New Tier</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {tiers.map(tier => (
            <div
              key={tier._id}
              className="bg-gradient-to-br from-white to-gray-50 p-6 shadow-lg rounded-xl flex flex-col transform hover:-translate-y-2 transition-all duration-300 hover:shadow-2xl"
            >
                <div className="flex-grow">
                    <div className="flex justify-between items-start">
                        <div className="flex flex-col">
                          <h2 className="text-2xl font-bold text-gray-800">{tier.name}</h2>
                          <div className="mt-1">
                            {tier.isPublic ? (
                              <span className="bg-green-50 text-green-600 text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border border-green-100">Public</span>
                            ) : (
                              <span className="bg-gray-50 text-gray-400 text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border border-gray-100">Private</span>
                            )}
                          </div>
                        </div>
                        <span className="bg-primary/10 text-primary font-semibold text-xs px-3 py-1 rounded-full">
                            {tier.minHalls === tier.maxHalls ? `${tier.minHalls} Venue${tier.minHalls > 1 ? 's' : ''}` : `${tier.minHalls}-${tier.maxHalls} Venues`}
                        </span>
                    </div>
                    <p className="text-4xl font-extrabold text-primary my-4">₦{tier.price}<span className="text-lg font-medium text-gray-500">/{tier.durationInDays} days</span></p>

                    {tier.discount && tier.discount.value > 0 && (
                      <div className="mb-4 p-2 bg-green-50 rounded-lg border border-green-100">
                        <p className="text-xs font-bold text-green-700 uppercase tracking-wider">Discount Active</p>
                        <p className="text-sm text-green-600">
                          {tier.discount.type === 'percentage' ? `${tier.discount.value}%` : `₦${tier.discount.value}`} off
                        </p>
                      </div>
                    )}

                    <p className="text-sm font-semibold text-gray-500 mb-3 uppercase">Features</p>
                    <ul className="space-y-2 mb-4">
                        {Array.isArray(tier.features) && tier.features.map((feature, index) => (
                            <li key={index} className="flex items-center">
                                <ShieldCheck className="text-green-500 mr-3" size={18}/>
                                <span className="text-gray-700 text-sm">{feature}</span>
                            </li>
                        ))}
                    </ul>

                    {tier.rules && tier.rules.length > 0 && (
                      <>
                        <p className="text-sm font-semibold text-gray-500 mb-3 uppercase">Rules</p>
                        <ul className="space-y-2">
                          {tier.rules.map((ruleItem, index) => {
                            const rule = ruleItem.rule;
                            const isObjectRule = rule && typeof rule === 'object';
                            const ruleName = isObjectRule ? (rule as SubscriptionRule).name : (rule || 'Unknown Rule');
                            const ruleType = isObjectRule ? (rule as SubscriptionRule).type : null;
                            let displayValue = ruleItem.value;

                            if (ruleType === 'boolean' || typeof ruleItem.value === 'boolean') {
                              displayValue = ruleItem.value ? 'Yes' : 'No';
                            }

                            return (
                              <li key={index} className="flex justify-between items-center text-sm text-gray-700 bg-gray-100 px-3 py-1 rounded-md">
                                <span>{ruleName}</span>
                                <span className="font-bold text-primary">{displayValue}</span>
                              </li>
                            );
                          })}
                        </ul>
                      </>
                    )}
                </div>
                <div className="mt-6 pt-4 border-t border-gray-200 flex justify-end space-x-3">
                    <button onClick={() => handleEditTier(tier)} className="text-gray-400 hover:text-indigo-600 transition-colors"><Edit size={20} /></button>
                    <button onClick={() => tier._id && handleDeleteTier(tier._id)} className="text-gray-400 hover:text-red-600 transition-colors"><Trash size={20} /></button>
                </div>
            </div>
        ))}
      </div>

      {tiers.length === 0 && !loading && (
        <div className="text-center py-12 text-gray-500">
            <h3 className="text-lg font-medium">No license tiers found.</h3>
            <p>Click &quot;Add New Tier&quot; to get started.</p>
        </div>
      )}
    </div>
  );
};

export default LicenseTiersTab;
