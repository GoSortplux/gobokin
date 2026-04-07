"use client";
import React from 'react';
import { X, RefreshCcw, FileText, List, User, Phone, Calendar, UserPlus } from 'lucide-react';
import { Booking, Venue, UserProfile, ReferralSource } from '@/types';

interface AdminBookingDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: Booking;
  venues: Venue[];
}

const AdminBookingDetailsModal: React.FC<AdminBookingDetailsModalProps> = ({ isOpen, onClose, booking, venues }) => {
  if (!isOpen) return null;

  const hallId = typeof booking.hall === 'string' ? booking.hall : (booking.hall as Venue)?._id || (booking.hall as Venue)?.id;
  const hallName = venues.find(h => h._id === hallId || h.id === hallId)?.name || 'N/A';

  const startTime = booking.bookingDates?.[0]?.startTime || '';

  return (
    <div className="fixed inset-0 z-50 flex justify-center items-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm cursor-pointer" onClick={onClose} />
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto relative z-10" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-900 p-2 hover:bg-gray-100 rounded-lg transition-all cursor-pointer">
          <X size={24} />
        </button>

        <div className="mb-8">
          <h2 className="text-2xl font-black text-gray-900">Booking Details</h2>
          <p className="text-sm text-gray-500 font-medium uppercase tracking-tighter">Detailed overview for booking #{booking.bookingId}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Section 1: Basic & Timeline */}
          <div className="space-y-6">
            <div className="bg-gray-50 p-4 rounded-xl space-y-4">
              <h3 className="flex items-center gap-2 text-xs font-black text-gray-400 uppercase tracking-widest border-b pb-2">
                <Calendar size={14} /> Basic Information
              </h3>
              <div className="space-y-3 text-sm">
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase">Venue Name</label>
                  <p className="font-bold text-gray-900">{hallName}</p>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase">Event Details</label>
                  <p className="text-gray-800">{booking.eventDetails || 'Private Event'}</p>
                </div>
                <div className="flex justify-between">
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase">Start Date</label>
                    <p className="font-bold text-gray-900">{startTime ? new Date(startTime).toLocaleDateString() : 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase">Status</label>
                    <div className="mt-1">
                      <span className={`px-2 py-0.5 inline-flex text-[10px] leading-5 font-black rounded-full uppercase ${
                          (booking.status || booking.bookingStatus) === 'confirmed' ? 'bg-green-100 text-green-800' :
                          (booking.status || booking.bookingStatus) === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                      }`}>
                          {booking.status || booking.bookingStatus || 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Customer Details */}
            <div className="bg-white p-4 border border-gray-100 rounded-xl shadow-sm space-y-4">
              <h3 className="flex items-center gap-2 text-xs font-black text-gray-400 uppercase tracking-widest border-b pb-2">
                <User size={14} /> Customer Details
              </h3>
              <div className="text-sm space-y-3">
                {typeof booking.user === 'object' && booking.user && (
                  <>
                    <div className="flex items-center gap-3">
                      <div className="bg-primary/10 p-2 rounded-lg text-primary">
                        <User size={16} />
                      </div>
                      <div className="overflow-hidden">
                        <p className="font-black text-gray-900 truncate">{(booking.user as UserProfile).fullName}</p>
                        <p className="text-[10px] text-gray-500 font-bold uppercase truncate">{(booking.user as UserProfile).email}</p>
                      </div>
                    </div>
                    {(booking.user as UserProfile).phone && (
                      <div className="flex items-center gap-2 text-gray-600 pl-1">
                        <Phone size={14} className="text-gray-400" />
                        <span className="font-medium">{(booking.user as UserProfile).phone}</span>
                      </div>
                    )}
                  </>
                )}
                {booking.walkInUserDetails && (
                  <div className="pt-2 space-y-1">
                    <p className="text-[10px] font-bold text-gray-400 uppercase">Walk-in User</p>
                    <p className="font-bold text-gray-800">{booking.walkInUserDetails.fullName}</p>
                    <p className="text-gray-600 font-medium">{booking.walkInUserDetails.phone}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Referral Information */}
            {(booking.referralCode || booking.referralSource) && (
              <div className="bg-blue-50/50 p-4 border border-blue-100 rounded-xl shadow-sm space-y-4">
                <h3 className="flex items-center gap-2 text-xs font-black text-blue-700 uppercase tracking-widest border-b border-blue-100/50 pb-2">
                  <UserPlus size={14} /> Referral Tracking
                </h3>
                <div className="text-sm space-y-3">
                  {booking.referralCode && (
                    <div>
                      <label className="text-[10px] font-bold text-gray-400 uppercase">Referral Code</label>
                      <p className="font-mono font-bold text-primary">{booking.referralCode}</p>
                    </div>
                  )}
                  {booking.referralSource && (
                    <div>
                      <label className="text-[10px] font-bold text-gray-400 uppercase">Referral Source</label>
                      <p className="text-gray-800 font-medium">
                        {typeof booking.referralSource === 'object'
                          ? (booking.referralSource as ReferralSource).name
                          : booking.referralSource === 'others'
                            ? (booking.referralSourceOther || 'Other')
                            : booking.referralSource}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Section 2: Financials & Payout */}
          <div className="space-y-6">
            <div className="bg-white p-4 border border-gray-100 rounded-xl shadow-sm space-y-4">
              <h3 className="flex items-center gap-2 text-xs font-black text-gray-400 uppercase tracking-widest border-b pb-2">
                <FileText size={14} /> Financials
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-gray-500">
                  <span>Original Price</span>
                  <span>₦{(booking.originalPrice || booking.totalPrice || 0).toLocaleString()}</span>
                </div>
                {booking.facilitiesPrice !== undefined && booking.facilitiesPrice > 0 && (
                  <div className="flex justify-between text-blue-600 font-medium">
                    <span>Facilities</span>
                    <span>+ ₦{booking.facilitiesPrice.toLocaleString()}</span>
                  </div>
                )}
                {booking.discountAmount ? (
                  <div className="flex justify-between text-rose-600 font-medium">
                    <span>Discount</span>
                    <span>- ₦{booking.discountAmount.toLocaleString()}</span>
                  </div>
                ) : null}
                <div className="flex justify-between pt-2 border-t border-gray-100 text-lg font-black text-gray-900">
                  <span>Total</span>
                  <span>₦{booking.totalPrice?.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-[11px] pt-1">
                  <span className="text-gray-400 uppercase font-bold tracking-tight">Payment Status</span>
                  <span className={`uppercase font-black ${booking.paymentStatus === 'paid' ? 'text-blue-600' : 'text-amber-600'}`}>
                    {booking.paymentStatus}
                  </span>
                </div>
              </div>
            </div>

            {booking.payout && (
              <div className="bg-emerald-50/50 p-4 border border-emerald-100 rounded-xl shadow-sm space-y-4">
                <h3 className="flex items-center gap-2 text-xs font-black text-emerald-700 uppercase tracking-widest border-b border-emerald-100/50 pb-2">
                  <RefreshCcw size={14} /> Payout
                </h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-emerald-700 font-medium">Payout Amount</span>
                    <span className="font-black text-emerald-900">₦{booking.payout.amount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-emerald-700 font-medium">Status</span>
                    <span className={`uppercase font-black ${booking.payout.status === 'completed' ? 'text-emerald-600' : 'text-amber-600'}`}>
                      {booking.payout.status}
                    </span>
                  </div>
                  <div className="pt-2 space-y-1">
                    <p className="text-[10px] font-bold text-emerald-600 uppercase">Bank Details</p>
                    <p className="font-bold text-emerald-900">{booking.payout.bankName}</p>
                    <p className="text-emerald-800 font-medium">{booking.payout.accountNumber}</p>
                    <p className="text-emerald-700 italic text-xs truncate">{booking.payout.accountName}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Selected Facilities if any */}
        {booking.selectedFacilities && booking.selectedFacilities.length > 0 && (
          <div className="mt-8">
            <h3 className="flex items-center gap-2 text-xs font-black text-gray-400 uppercase tracking-widest mb-4">
              <List size={14} /> Selected Facilities
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {booking.selectedFacilities.map((f, idx) => (
                <div key={idx} className="flex justify-between items-center bg-gray-50 p-3 rounded-xl border border-gray-100">
                  <span className="text-sm font-bold text-gray-800">{f.name} (x{f.quantity})</span>
                  <span className="text-sm font-black text-gray-900">₦{f.cost.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Refund history if any */}
        {booking.refundDetails && booking.refundDetails.totalRefundedAmount > 0 && (
          <div className="mt-8">
            <h3 className="flex items-center gap-2 text-xs font-black text-rose-500 uppercase tracking-widest mb-4">
              <RefreshCcw size={14} /> Refund History
            </h3>
            <div className="bg-rose-50/30 border border-rose-100 rounded-xl overflow-hidden">
               <div className="p-4 border-b border-rose-100 flex justify-between items-center">
                  <span className="text-sm font-bold text-rose-700">Total Refunded</span>
                  <span className="text-lg font-black text-rose-900">₦{booking.refundDetails.totalRefundedAmount.toLocaleString()}</span>
               </div>
               <div className="p-4 space-y-3">
                  {booking.refundDetails.refundHistory.map((refund, idx) => (
                    <div key={idx} className="bg-white p-3 rounded-lg border border-rose-50 text-sm shadow-sm">
                      <div className="flex justify-between mb-1">
                         <span className="font-black text-gray-900">₦{refund.amount.toLocaleString()}</span>
                         <span className="text-[10px] text-gray-400 font-bold">{typeof refund.date === 'string' ? new Date(refund.date).toLocaleDateString() : 'N/A'}</span>
                      </div>
                      <p className="text-gray-500 italic text-xs">&quot;{refund.note}&quot;</p>
                    </div>
                  ))}
               </div>
            </div>
          </div>
        )}

        <div className="flex justify-end mt-10">
            <button onClick={onClose} className="px-8 py-3 rounded-xl text-white bg-primary font-bold hover:bg-primary-dark shadow-lg shadow-blue-200 transition-all active:scale-95">
                Close Details
            </button>
        </div>
      </div>
    </div>
  );
};

export default AdminBookingDetailsModal;
