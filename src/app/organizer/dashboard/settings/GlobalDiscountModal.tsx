'use client';

import { useState, useEffect, useRef } from 'react';
import { X, Tag, Percent, Calendar, UserCheck, Hash, CheckSquare, Square, ChevronDown, Filter } from 'lucide-react';
import { Event, GlobalDiscount } from '@/types';
import api from '@/services/api';
import useOnClickOutside from '@/hooks/useOnClickOutside';

interface GlobalDiscountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (formData: {
    code: string;
    discountPercentage: number;
    expiryDate: string;
    maxUsagePerGuest: number;
    maxUsage: number;
    applicableEventIds: string[];
  }) => void;
  loading?: boolean;
  discount?: GlobalDiscount | null;
}

const GlobalDiscountModal: React.FC<GlobalDiscountModalProps> = ({ isOpen, onClose, onSubmit, loading, discount }) => {
  const isEdit = !!discount;

  const [formData, setFormData] = useState({
    code: '',
    discountPercentage: 0,
    expiryDate: '',
    maxUsagePerGuest: 1,
    maxUsage: 100,
  });

  const [applyToAll, setApplyToAll] = useState(true);
  const [selectedEventIds, setSelectedEventIds] = useState<string[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [showEventList, setShowEventList] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useOnClickOutside(dropdownRef, () => setShowEventList(false));

  useEffect(() => {
    if (isOpen) {
      if (discount) {
        // Convert UTC to local for datetime-local input
        const localDate = discount.expiryDate ? new Date(discount.expiryDate) : null;
        const formattedDate = localDate
          ? new Date(localDate.getTime() - localDate.getTimezoneOffset() * 60000).toISOString().slice(0, 16)
          : '';

        setFormData({
          code: discount.code,
          discountPercentage: discount.discountPercentage,
          expiryDate: formattedDate,
          maxUsagePerGuest: discount.maxUsagePerGuest,
          maxUsage: discount.maxUsage || 100,
        });
        setApplyToAll(!discount.applicableEventIds || discount.applicableEventIds.length === 0);
        setSelectedEventIds(discount.applicableEventIds || []);
      } else {
        setFormData({
          code: '',
          discountPercentage: 0,
          expiryDate: '',
          maxUsagePerGuest: 1,
          maxUsage: 100,
        });
        setApplyToAll(true);
        setSelectedEventIds([]);
      }
      fetchEvents();
    }
  }, [isOpen, discount]);

  const fetchEvents = async () => {
    try {
      setEventsLoading(true);
      const response = await api.get('/events/my-events');
      setEvents(response.data.data || []);
    } catch (error) {
      console.error('Failed to fetch events:', error);
    } finally {
      setEventsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'discountPercentage' || name === 'maxUsagePerGuest' || name === 'maxUsage' ? Number(value) : value,
    }));
  };

  const toggleEvent = (eventId: string) => {
    setSelectedEventIds(prev =>
      prev.includes(eventId)
        ? prev.filter(id => id !== eventId)
        : [...prev, eventId]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.expiryDate) {
        return; // HTML5 'required' should catch this, but safety first
    }

    const submissionData = {
        ...formData,
        expiryDate: new Date(formData.expiryDate).toISOString(),
        applicableEventIds: applyToAll ? [] : selectedEventIds,
    };
    onSubmit(submissionData);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div
        role="dialog"
        aria-modal="true"
        className="bg-white w-full max-w-lg rounded-[2rem] sm:rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col max-h-[85vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-primary p-5 sm:p-7 text-white relative shrink-0">
          <button
            onClick={onClose}
            className="absolute top-4 sm:top-5 right-4 sm:right-6 p-2 hover:bg-white/10 rounded-xl transition-colors"
          >
            <X className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
          <div className="flex items-center gap-3 sm:gap-4 mb-1 sm:mb-2">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/20 rounded-xl sm:rounded-2xl flex items-center justify-center backdrop-blur-md">
              <Tag className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight uppercase italic leading-tight">
                {isEdit ? 'Update' : 'Global'} <span className="text-white not-italic">{isEdit ? 'Discount' : 'Discount'}</span>
              </h2>
              <p className="text-white/70 text-[11px] sm:text-sm font-medium">{isEdit ? 'Update existing discount code details.' : 'Create a discount code that applies to your events.'}</p>
            </div>
          </div>
        </div>

        <div className="p-5 sm:p-7 space-y-6 sm:space-y-7 overflow-y-auto no-scrollbar flex-1">
          <form id="discount-form" onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
            <div className="space-y-1.5 sm:space-y-2">
              <label className="text-[9px] sm:text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Discount Code</label>
              <div className="relative">
                <Tag size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  name="code"
                  placeholder="e.g. SUMMER2024"
                  value={formData.code}
                  onChange={handleChange}
                  className="w-full pl-11 pr-4 py-3 sm:py-4 bg-gray-50 border border-gray-200 rounded-xl sm:rounded-2xl text-sm font-bold focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all outline-none uppercase"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5 sm:space-y-2">
                    <label className="text-[9px] sm:text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Discount (%)</label>
                    <div className="relative">
                        <Percent size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="number"
                            name="discountPercentage"
                            placeholder="10"
                            min="1"
                            max="100"
                            value={formData.discountPercentage || ''}
                            onChange={handleChange}
                            className="w-full pl-11 pr-4 py-3 sm:py-4 bg-gray-50 border border-gray-200 rounded-xl sm:rounded-2xl text-sm font-bold focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all outline-none"
                            required
                        />
                    </div>
                </div>

                <div className="space-y-1.5 sm:space-y-2">
                    <label className="text-[9px] sm:text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Total Usage Limit</label>
                    <div className="relative">
                        <Hash size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="number"
                            name="maxUsage"
                            placeholder="100"
                            min="1"
                            value={formData.maxUsage || ''}
                            onChange={handleChange}
                            className="w-full pl-11 pr-4 py-3 sm:py-4 bg-gray-50 border border-gray-200 rounded-xl sm:rounded-2xl text-sm font-bold focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all outline-none"
                            required
                        />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5 sm:space-y-2">
                    <label className="text-[9px] sm:text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Max Usage Per Guest</label>
                    <div className="relative">
                        <UserCheck size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="number"
                            name="maxUsagePerGuest"
                            placeholder="1"
                            min="1"
                            value={formData.maxUsagePerGuest || ''}
                            onChange={handleChange}
                            className="w-full pl-11 pr-4 py-3 sm:py-4 bg-gray-50 border border-gray-200 rounded-xl sm:rounded-2xl text-sm font-bold focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all outline-none"
                            required
                        />
                    </div>
                </div>

                <div className="space-y-1.5 sm:space-y-2">
                    <label className="text-[9px] sm:text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Expiry Date & Time</label>
                    <div className="relative">
                        <Calendar size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="datetime-local"
                            name="expiryDate"
                            value={formData.expiryDate}
                            onChange={handleChange}
                            className="w-full pl-11 pr-4 py-3 sm:py-4 bg-gray-50 border border-gray-200 rounded-xl sm:rounded-2xl text-sm font-bold focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all outline-none"
                            required
                        />
                    </div>
                </div>
            </div>


            <div className="space-y-3">
              <label className="text-[9px] sm:text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Apply To</label>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setApplyToAll(true)}
                  className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-xl border transition-all text-xs font-bold ${
                    applyToAll
                    ? 'bg-primary/5 border-primary text-primary shadow-sm'
                    : 'bg-gray-50 border-gray-200 text-gray-500 hover:bg-gray-100'
                  }`}
                >
                  <Tag size={14} />
                  All Events
                </button>
                <button
                  type="button"
                  onClick={() => setApplyToAll(false)}
                  className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-xl border transition-all text-xs font-bold ${
                    !applyToAll
                    ? 'bg-primary/5 border-primary text-primary shadow-sm'
                    : 'bg-gray-50 border-gray-200 text-gray-500 hover:bg-gray-100'
                  }`}
                >
                  <Filter size={14} />
                  Specific Events
                </button>
              </div>
            </div>

            {!applyToAll && (
              <div className="space-y-1.5 sm:space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                <label className="text-[9px] sm:text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Select Events</label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowEventList(!showEventList)}
                    className="w-full px-4 py-3 sm:py-4 bg-gray-50 border border-gray-200 rounded-xl sm:rounded-2xl text-sm font-bold text-left flex justify-between items-center focus:ring-4 focus:ring-primary/5 transition-all outline-none"
                  >
                    <span className={selectedEventIds.length === 0 ? 'text-gray-400' : 'text-gray-900'}>
                      {selectedEventIds.length === 0
                        ? 'Select specific events...'
                        : `${selectedEventIds.length} event${selectedEventIds.length > 1 ? 's' : ''} selected`}
                    </span>
                    <ChevronDown size={18} className={`text-gray-400 transition-transform ${showEventList ? 'rotate-180' : ''}`} />
                  </button>

                  {showEventList && (
                    <div ref={dropdownRef} className="absolute z-20 left-0 right-0 mt-2 bg-white border border-gray-100 rounded-2xl shadow-xl p-2 max-h-48 overflow-y-auto custom-scrollbar animate-in zoom-in-95 duration-200">
                      {eventsLoading ? (
                        <div className="p-4 text-center text-xs font-bold text-gray-400 italic">Loading events...</div>
                      ) : events.length === 0 ? (
                        <div className="p-4 text-center text-xs font-bold text-gray-400 italic">No events found</div>
                      ) : (
                        <div className="space-y-1">
                          {events.map((event) => (
                            <button
                              key={event.id}
                              type="button"
                              onClick={() => toggleEvent(event.id)}
                              className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all hover:bg-gray-50 text-left ${
                                selectedEventIds.includes(event.id) ? 'bg-primary/5' : ''
                              }`}
                            >
                              {selectedEventIds.includes(event.id) ? (
                                <CheckSquare size={18} className="text-primary" />
                              ) : (
                                <Square size={18} className="text-gray-300" />
                              )}
                              <div>
                                <p className={`text-sm font-bold ${selectedEventIds.includes(event.id) ? 'text-primary' : 'text-gray-700'}`}>
                                  {event.title}
                                </p>
                                <p className="text-[10px] text-gray-400 font-medium">{new Date(event.startDate).toLocaleDateString()}</p>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

          </form>
        </div>

        {/* Footer */}
        <div className="p-5 sm:p-7 bg-gray-50/80 backdrop-blur-md border-t border-gray-100 shrink-0">
          <div className="flex justify-end gap-3 sm:gap-4">
            <button
              onClick={onClose}
              className="px-4 sm:px-6 py-2.5 sm:py-3 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-gray-900 transition-colors"
            >
              Cancel
            </button>
            <button
              form="discount-form"
              type="submit"
              disabled={loading || (!applyToAll && selectedEventIds.length === 0)}
              className="px-6 sm:px-10 py-2.5 sm:py-3.5 rounded-xl sm:rounded-2xl bg-primary text-white font-black text-[10px] uppercase tracking-[0.1em] sm:tracking-[0.2em] shadow-xl shadow-primary/30 hover:shadow-primary/40 hover:-translate-y-0.5 transition-all disabled:opacity-50"
            >
              {loading ? 'Processing...' : isEdit ? 'Update Discount' : 'Create Discount'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GlobalDiscountModal;
