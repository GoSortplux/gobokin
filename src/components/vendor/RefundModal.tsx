'use client';

import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import api from '@/services/api';
import { translateError } from '@/utils/errors';
import Swal from "@/utils/sweetalert";

interface RefundModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: {
    _id: string;
    id?: string;
    bookingId?: string;
    reservationId?: string;
    totalPrice?: number;
    refundDetails?: {
      totalRefundableAmount: number;
      totalRefundedAmount: number;
      refundHistory: {
        amount: number;
        note: string;
        date: string | { $date: string };
        recordedBy: string | { _id: string; fullName: string };
      }[];
    };
  } | null;
  type: 'booking' | 'reservation';
  onSuccess: () => void;
}

const RefundModal: React.FC<RefundModalProps> = ({ isOpen, onClose, item, type, onSuccess }) => {
  const [totalRefundableAmount, setTotalRefundableAmount] = useState<number>(0);
  const [refundAmount, setRefundAmount] = useState<number>(0);
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen && item) {
      const price = item.totalPrice || 0;
      const initialRefundable = item.refundDetails?.totalRefundableAmount || price;
      const refunded = item.refundDetails?.totalRefundedAmount || 0;

      setTotalRefundableAmount(initialRefundable);
      setRefundAmount(Math.max(0, initialRefundable - refunded));
      setNote('');
      setError('');
    }
  }, [isOpen, item]);

  const totalRefundedAmount = item?.refundDetails?.totalRefundedAmount || 0;
  const remainingBalance = Math.max(0, totalRefundableAmount - totalRefundedAmount);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!item) return;

    if (refundAmount <= 0) {
      setError('Refund amount must be greater than zero.');
      return;
    }

    if (refundAmount > remainingBalance) {
      setError(`Refund amount cannot exceed the remaining balance (₦${remainingBalance.toLocaleString()}).`);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const endpoint = type === 'reservation'
        ? `/reservations/${item._id}/record-refund`
        : `/bookings/${item._id}/record-refund`;

      await api.patch(endpoint, {
        totalRefundableAmount,
        refundAmount,
        note,
      });

      Swal.fire({
        icon: 'success',
        title: 'Refund Recorded!',
        text: 'The refund has been successfully recorded.',
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000
      });
      onSuccess();
      onClose();
    } catch (err) {
      console.error('Failed to record refund:', err);
      setError(translateError(err));
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !item) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-center items-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        className="bg-white p-8 rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto relative z-10 animate-in fade-in zoom-in-95"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-6 right-6 text-gray-400 hover:text-gray-900 bg-gray-50 hover:bg-gray-100 p-2 rounded-xl transition-all cursor-pointer"
        >
          <X size={20} />
        </button>

        <div className="mb-8 text-center">
          <h2 className="text-3xl font-black text-gray-900 tracking-tighter uppercase italic">Record <span className="text-primary not-italic">Refund</span></h2>
          <p className="text-sm text-gray-500 font-medium">{type === 'reservation' ? 'Reservation' : 'Booking'} ID: {item.bookingId || item.reservationId}</p>
        </div>

        {error && <p className="mb-4 bg-rose-50 text-rose-600 p-3 rounded-xl text-xs font-bold border border-rose-100">{error}</p>}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Total Refundable (₦)</label>
              <input
                type="number"
                value={totalRefundableAmount}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setTotalRefundableAmount(val);
                  const newRemaining = Math.max(0, val - totalRefundedAmount);
                  if (refundAmount > newRemaining) {
                    setRefundAmount(newRemaining);
                  }
                }}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all font-semibold text-gray-900"
                required
                min="0"
                step="0.01"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Already Refunded (₦)</label>
              <div className="w-full px-4 py-2.5 border border-gray-100 bg-gray-50 rounded-xl font-bold text-rose-600">
                ₦{totalRefundedAmount.toLocaleString()}
              </div>
            </div>
          </div>

          <div className="bg-blue-50/50 p-4 rounded-2xl border border-blue-100/50">
            <div className="flex justify-between items-center mb-3">
              <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">Remaining Balance</span>
              <span className="text-xl font-black text-blue-900">₦{remainingBalance.toLocaleString()}</span>
            </div>

            <label className="block text-[10px] font-bold text-blue-400 uppercase mb-1.5">New Refund Amount (₦)</label>
            <input
              type="number"
              value={refundAmount}
              onChange={(e) => setRefundAmount(Number(e.target.value))}
              className="w-full px-4 py-3 border border-blue-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all font-black text-blue-600 text-lg"
              required
              min="0"
              max={remainingBalance}
              step="0.01"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Note / Reason</label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-sm"
              rows={2}
              placeholder="e.g., Partial refund due to early cancellation policy"
            />
          </div>

          {item.refundDetails?.refundHistory && item.refundDetails.refundHistory.length > 0 && (
            <div className="pt-2">
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Refund History</label>
              <div className="space-y-2 max-h-32 overflow-y-auto pr-1 custom-scrollbar">
                {item.refundDetails.refundHistory.map((history, idx) => {
                  const dateStr = typeof history.date === 'object' && '$date' in history.date
                    ? history.date.$date
                    : history.date as string;
                  return (
                    <div key={idx} className="flex justify-between items-center p-3 bg-gray-50 rounded-xl border border-gray-100">
                      <div>
                        <p className="text-xs font-bold text-gray-900">₦{history.amount.toLocaleString()}</p>
                        <p className="text-[10px] text-gray-500">{new Date(dateStr).toLocaleDateString()} • {history.note || 'No note'}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 font-bold rounded-xl hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-6 py-3 bg-primary text-white font-bold rounded-xl hover:bg-primary-dark transition-colors disabled:opacity-50"
            >
              {loading ? 'Processing...' : 'Record Refund'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RefundModal;
