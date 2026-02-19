"use client";
import React, { useState, useEffect } from "react";
import api from "@/services/api";
import LoadingSpinner from "@/components/admin/LoadingSpinner";
import { Edit, Trash, PlusCircle } from "lucide-react";
import RuleModal from "@/components/admin/RuleModal";
import Swal from "@/utils/sweetalert";
import { SubscriptionRule } from "@/types";

const SubscriptionRulesTab = () => {
  const [rules, setRules] = useState<SubscriptionRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRule, setSelectedRule] = useState<Partial<SubscriptionRule> | undefined>(undefined);

  useEffect(() => {
    fetchRules();
  }, []);

  const fetchRules = async () => {
    setLoading(true);
    try {
      const response = await api.get("/subscription-rules");
      setRules(response.data.data);
    } catch (error) {
      console.error("Error fetching rules:", error);
      Swal.fire("Error", "Could not fetch subscription rules.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleAddRule = () => {
    setSelectedRule(undefined);
    setIsModalOpen(true);
  };

  const handleEditRule = (rule: SubscriptionRule) => {
    setSelectedRule(rule);
    setIsModalOpen(true);
  };

  const handleModalSubmit = async (rule: Partial<SubscriptionRule>) => {
    try {
      if (rule._id) {
        await api.patch(`/subscription-rules/${rule._id}`, rule);
        Swal.fire('Success!', 'Rule updated.', 'success');
      } else {
        await api.post('/subscription-rules', rule);
        Swal.fire('Success!', 'New rule created.', 'success');
      }
      fetchRules();
      setIsModalOpen(false);
    } catch (error) {
      console.error("Error saving rule:", error);
      Swal.fire('Error', 'Could not save the rule.', 'error');
    }
  };

  const handleDeleteRule = async (ruleId: string) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: "This will permanently delete the subscription rule. This might affect license tiers using this rule.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      confirmButtonText: 'Yes, delete it!'
    });

    if (result.isConfirmed) {
      try {
        await api.delete(`/subscription-rules/${ruleId}`);
        Swal.fire('Deleted!', 'The rule has been deleted.', 'success');
        fetchRules();
      } catch (error) {
        console.error("Error deleting rule:", error);
        Swal.fire('Error', 'Could not delete the rule.', 'error');
      }
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <RuleModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleModalSubmit}
        rule={selectedRule}
      />
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-2xl font-bold text-gray-800">Subscription Rules</h2>
        <button
            onClick={handleAddRule}
            className="bg-primary text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-opacity-90"
        >
          <PlusCircle size={20} />
          <span>Add New Rule</span>
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-widest">Name</th>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-widest">Key</th>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-widest">Type</th>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-widest">Description</th>
              <th className="px-6 py-4 text-right text-xs font-bold text-gray-400 uppercase tracking-widest">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {rules.map((rule) => (
              rule && <tr key={rule._id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-800">{rule.name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">{rule.key}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <span className="bg-blue-50 text-blue-600 px-2 py-1 rounded-md text-[10px] font-bold uppercase">{rule.type}</span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">{rule.description}</td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button onClick={() => handleEditRule(rule)} className="text-gray-400 hover:text-indigo-600 transition-colors mr-3">
                    <Edit size={18} />
                  </button>
                  <button onClick={() => handleDeleteRule(rule._id)} className="text-gray-400 hover:text-red-600 transition-colors">
                    <Trash size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {rules.length === 0 && (
          <div className="text-center py-12 text-gray-500">
              <h3 className="text-lg font-medium">No rules found.</h3>
              <p>Click &quot;Add New Rule&quot; to get started.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SubscriptionRulesTab;
