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
    <div className="fixed inset-0 z-[100] flex justify-center items-center p-4">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        className="bg-white rounded-[2rem] sm:rounded-[2.5rem] shadow-2xl w-full max-w-lg relative z-10 animate-in fade-in zoom-in-95 border border-gray-100 flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 sm:top-6 sm:right-6 text-gray-400 hover:text-gray-900 bg-gray-50 hover:bg-gray-100 p-2 rounded-xl transition-all cursor-pointer z-20"
          aria-label="Close modal"
        >
          <X size={18} />
        </button>

        <div className="p-6 sm:p-8 overflow-y-auto custom-scrollbar">
          <div className="mb-6 sm:mb-8">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mb-4">
              <Tag size={28} className="sm:hidden" />
              <Tag size={32} className="hidden sm:block" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tighter uppercase italic leading-tight">
              {isEdit ? 'Update' : 'Global'} <span className="text-primary not-italic">{isEdit ? 'Discount' : 'Discount'}</span>
            </h2>
            <p className="text-xs sm:text-sm text-gray-500 font-medium mt-1">
              {isEdit ? 'Update existing discount code details.' : 'Create a discount code that applies to your events.'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
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

            <div className="flex gap-3 sm:gap-4 pt-2 sm:pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3 sm:py-4 rounded-xl sm:rounded-2xl text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-gray-500 bg-gray-50 hover:bg-gray-100 transition-all border border-gray-100"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || (!applyToAll && selectedEventIds.length === 0)}
                className="flex-1 py-3 sm:py-4 rounded-xl sm:rounded-2xl text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-white bg-primary hover:bg-opacity-90 transition-all shadow-xl shadow-primary/20 disabled:opacity-50"
              >
                {loading ? '...' : isEdit ? 'Update Discount' : 'Create Discount'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default GlobalDiscountModal;
