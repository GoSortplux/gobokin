'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { X, ShieldCheck, CheckSquare, Square } from 'lucide-react';
import api from '@/services/api';
import { Policy } from '@/types';
import { useAuth } from '@/context/AuthContext';
import Swal from '@/utils/sweetalert';
import { translateError } from '@/utils/errors';
import CustomLoader from '@/components/CustomLoader';

const MarkdownRenderer = ({ content }: { content?: string }) => {
  if (!content) return null;
  const lines = content.split('\n');

  return (
    <div className="space-y-6 text-gray-700 leading-loose">
      {lines.map((line, index) => {
        const trimmedLine = line.trim();
        if (!trimmedLine) return <div key={index} className="h-4" />;

        // Headers
        if (line.startsWith('# ')) {
          return (
            <h1 key={index} className="text-3xl font-black text-gray-900 mt-10 mb-6 tracking-tight border-b-2 border-gray-100 pb-4">
              {line.substring(2)}
            </h1>
          );
        }
        if (line.startsWith('## ')) {
          return (
            <h2 key={index} className="text-xl font-extrabold text-gray-800 mt-8 mb-4">
              {line.substring(3)}
            </h2>
          );
        }
        if (line.startsWith('### ')) {
            return (
              <h3 key={index} className="text-lg font-bold text-gray-800 mt-6 mb-3">
                {line.substring(4)}
              </h3>
            );
          }
        if (line.startsWith('#### ')) {
          return (
            <h4 key={index} className="text-base font-bold text-gray-700 mt-5 mb-2">
              {line.substring(5)}
            </h4>
          );
        }

        // List items with special bullet 
        if (trimmedLine.startsWith('')) {
          return (
            <div key={index} className="flex items-start space-x-4 ml-6 mb-4 group">
              <div className="mt-2.5 w-1.5 h-1.5 rounded-full bg-primary/30 group-hover:bg-primary transition-colors shrink-0" />
              <p className="flex-1 text-base md:text-lg text-gray-600">{trimmedLine.substring(1).trim()}</p>
            </div>
          );
        }

        // Bold text logic
        const parts = line.split(/(\*\*.*?\*\*)/g);
        const renderedLine = parts.map((part, i) => {
          if (part.startsWith('**') && part.endsWith('**')) {
            return <strong key={i} className="font-bold text-gray-900">{part.slice(2, -2)}</strong>;
          }
          return part;
        });

        return <p key={index} className="text-base md:text-lg text-gray-600">{renderedLine}</p>;
      })}
    </div>
  );
};

interface PolicyModalProps {
  isOpen: boolean;
  onAccept: () => void;
  onClose?: () => void;
  slug?: string; // Optional: fetch a specific policy
  isMandatory?: boolean;
  type: 'general' | 'hall-owner';
  compact?: boolean;
  skipUserUpdate?: boolean;
}

const PolicyModal = ({
  isOpen,
  onAccept,
  onClose,
  slug,
  isMandatory = false,
  type,
  compact = false,
  skipUserUpdate = false
}: PolicyModalProps) => {
  const { user, updateUser } = useAuth();
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [checkedPolicies, setCheckedPolicies] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [isScrolledToEnd, setIsScrolledToEnd] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const scrollableContentRef = useRef<HTMLDivElement>(null);

  const userRole = Array.isArray(user?.role) ? user?.role?.join(',') : '';

  const fetchPolicies = useCallback(async () => {
    setLoading(true);
    try {
      let slugsToFetch: string[] = [];

      if (slug) {
        slugsToFetch = [slug];
      } else {
        const response = await api.get('/policies');
        const policyList = response.data.data || [];

        // Filter policies based on type and user role before fetching full content
        slugsToFetch = policyList
          .filter((p: Policy) => {
            if (type === 'general') {
              // If user is just a 'user', hide 'hall-owner-agreement'
              const isHallOwner = userRole?.includes('hall-owner') || userRole?.includes('super-admin');
              if (p.slug === 'hall-owner-agreement' && !isHallOwner) {
                return false;
              }
            }
            return true;
          })
          .map((p: Policy) => p.slug);
      }

      // Explicitly use the /policies/{slug} route to get full content for each policy
      const fullPolicies = await Promise.all(
        slugsToFetch.map(async (s) => {
          const res = await api.get(`/policies/${s}`);
          return res.data.data;
        })
      );

      // Sort alphabetically by title
      const sortedPolicies = fullPolicies.sort((a, b) => a.title.localeCompare(b.title));

      setPolicies(sortedPolicies);

      // Initialize checkboxes
      const initialChecked: Record<string, boolean> = {};
      sortedPolicies.forEach(p => {
        initialChecked[p._id] = false;
      });
      setCheckedPolicies(initialChecked);

    } catch (err) {
      console.error('Failed to fetch policies:', err);
      Swal.toast.fire({
        icon: 'error',
        title: translateError(err),
      });
    } finally {
      setLoading(false);
    }
  }, [slug, type, userRole]);

  useEffect(() => {
    if (isOpen) {
      fetchPolicies();
      setIsScrolledToEnd(false);
      setScrollProgress(0);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen, fetchPolicies]);

  useEffect(() => {
    if (isOpen && !loading && policies.length > 0) {
      const checkScrollable = () => {
        if (scrollableContentRef.current) {
          const { scrollHeight, clientHeight } = scrollableContentRef.current;
          if (scrollHeight <= clientHeight + 10) {
            setIsScrolledToEnd(true);
            setScrollProgress(100);
          }
        }
      };

      const timer = setTimeout(checkScrollable, 500);
      return () => clearTimeout(timer);
    }
  }, [isOpen, loading, policies]);

  const handleScroll = () => {
    if (!scrollableContentRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollableContentRef.current;

    const totalScrollable = scrollHeight - clientHeight;
    const currentProgress = totalScrollable > 0 ? (scrollTop / totalScrollable) * 100 : 100;
    setScrollProgress(currentProgress);

    if (scrollTop + clientHeight >= scrollHeight - 60) {
      setIsScrolledToEnd(true);
    }
  };

  const toggleCheckbox = (id: string) => {
    setCheckedPolicies(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const toggleAllCheckboxes = () => {
    const nextValue = !allChecked;
    const nextChecked: Record<string, boolean> = {};
    policies.forEach(p => {
      nextChecked[p._id] = nextValue;
    });
    setCheckedPolicies(nextChecked);
  };

  const allChecked = policies.length > 0 && policies.every(p => checkedPolicies[p._id]);

  const handleAccept = async () => {
    if (!allChecked || accepting) return;

    setAccepting(true);
    if (skipUserUpdate) {
      onAccept();
      return;
    }
    try {
      const payload = type === 'general'
        ? { hasAcceptedLatestPolicies: true }
        : { hasAcceptedHallOwnerPolicy: true };

      await api.patch('/users/me', payload);

      // Update local context immediately to prevent modal from flickering/reappearing
      updateUser(payload);

      Swal.toast.fire({
        icon: 'success',
        title: 'Policy accepted successfully',
      });

      onAccept();
    } catch (err) {
      console.error('Failed to accept policy:', err);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: translateError(err),
      });
    } finally {
      setAccepting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/40 backdrop-blur-md animate-in fade-in duration-300">
      <div
        className={`bg-white ${compact ? 'rounded-3xl max-w-2xl' : 'rounded-[2.5rem] max-w-3xl'} shadow-[0_30px_100px_rgba(0,0,0,0.25)] w-full overflow-hidden flex flex-col animate-in slide-in-from-bottom-4 duration-300 max-h-[90vh] border border-white/20`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={`${compact ? 'px-6 py-6' : 'px-8 py-8'} border-b border-gray-50 flex items-center justify-between`}>
          <div className="flex items-center space-x-4">
            <div className={`${compact ? 'p-2' : 'p-3'} bg-primary/5 rounded-2xl text-primary`}>
              <ShieldCheck size={compact ? 24 : 28} />
            </div>
            <div>
              <h2 className={`${compact ? 'text-xl' : 'text-2xl'} font-black text-gray-900 tracking-tight`}>
                {type === 'hall-owner' ? 'Venue Owner Agreement' : (slug === 'refund-policy' ? 'Refund & Cancellation Policy' : 'Updated Policies')}
              </h2>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-[0.2em] mt-0.5">Review and Accept Agreement</p>
            </div>
          </div>
          {!isMandatory && onClose && (
            <button
              onClick={onClose}
              className="p-3 hover:bg-gray-100 rounded-full transition-all text-gray-400 hover:text-gray-900"
            >
              <X size={24} />
            </button>
          )}
        </div>

        {/* Progress Bar */}
        {!loading && policies.length > 0 && (
          <div className="h-1 w-full bg-gray-50">
            <div
              className="h-full bg-primary transition-all duration-300 ease-out"
              style={{ width: `${scrollProgress}%` }}
            />
          </div>
        )}

        {/* Content */}
        <div
          ref={scrollableContentRef}
          onScroll={handleScroll}
          className={`${compact ? 'p-6 md:p-10' : 'p-8 md:p-16'} overflow-y-auto flex-grow bg-white scroll-smooth`}
        >
          {loading ? (
            <div className="flex flex-col items-center justify-center py-24">
              <CustomLoader size={60} className="mb-6" />
              <p className="text-gray-400 font-black uppercase text-[10px] tracking-[0.3em] animate-pulse">Authenticating Policies</p>
            </div>
          ) : policies.length > 0 ? (
            <div className={compact ? "space-y-12" : "space-y-24"}>
              {policies.map((policy) => (
                <div key={policy._id} className="relative">
                  <div className={compact ? "mb-6" : "mb-10"}>
                    <h3 className={`${compact ? 'text-2xl' : 'text-4xl'} font-black text-gray-900 mb-4 tracking-tight leading-none`}>
                      {policy.title}
                    </h3>
                    <div className="flex items-center space-x-3 text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                      <span className="px-2 py-1 bg-gray-100 rounded text-gray-500">Version {policy.version}</span>
                      <span className="w-1 h-1 rounded-full bg-gray-300" />
                      <span>Effective: {new Date(policy.effectiveDate).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                    </div>
                  </div>

                  <div className={`prose ${compact ? 'prose-sm' : 'prose-lg'} max-w-none`}>
                    <MarkdownRenderer content={policy.content} />
                  </div>

                  {!compact && (
                    <div className={`mt-12 p-8 bg-gray-50/50 rounded-[2rem] border border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-8 transition-all ${isScrolledToEnd ? 'hover:bg-gray-50' : 'opacity-50'}`}>
                      <button
                        onClick={() => toggleCheckbox(policy._id)}
                        disabled={!isScrolledToEnd}
                        className={`flex items-start space-x-5 text-left group ${!isScrolledToEnd ? 'cursor-not-allowed' : ''}`}
                      >
                        <div className={`mt-1 transition-all transform active:scale-90 ${checkedPolicies[policy._id] ? 'text-primary' : (isScrolledToEnd ? 'text-gray-300 group-hover:text-primary/40' : 'text-gray-200')}`}>
                          {checkedPolicies[policy._id] ? <CheckSquare size={36} /> : <Square size={36} />}
                        </div>
                        <div>
                          <span className={`block text-xl font-black transition-colors ${checkedPolicies[policy._id] ? 'text-gray-900' : 'text-gray-500 group-hover:text-gray-700'}`}>
                            Acknowledge & Agree
                          </span>
                          <span className="text-sm text-gray-400 mt-1 block leading-relaxed font-medium">I have fully read and understood the terms of the {policy.title}</span>
                        </div>
                      </button>

                      {checkedPolicies[policy._id] && (
                          <div className="flex items-center space-x-2 text-emerald-500 animate-in fade-in zoom-in duration-500">
                              <ShieldCheck size={24} />
                              <span className="text-[10px] font-black uppercase tracking-[0.2em]">Verified</span>
                          </div>
                      )}
                    </div>
                  )}
                </div>
              ))}

              {compact && (
                <div className={`mt-8 p-6 bg-gray-50/50 rounded-2xl border border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-6 transition-all ${isScrolledToEnd ? 'hover:bg-gray-50' : 'opacity-50'}`}>
                  <button
                    onClick={toggleAllCheckboxes}
                    disabled={!isScrolledToEnd}
                    className={`flex items-start space-x-4 text-left group ${!isScrolledToEnd ? 'cursor-not-allowed' : ''}`}
                  >
                    <div className={`mt-1 transition-all transform active:scale-90 ${allChecked ? 'text-primary' : (isScrolledToEnd ? 'text-gray-300 group-hover:text-primary/40' : 'text-gray-200')}`}>
                      {allChecked ? <CheckSquare size={28} /> : <Square size={28} />}
                    </div>
                    <div>
                      <span className={`block text-lg font-black transition-colors ${allChecked ? 'text-gray-900' : 'text-gray-500 group-hover:text-gray-700'}`}>
                        Acknowledge All Policies
                      </span>
                      <span className="text-xs text-gray-400 mt-1 block leading-relaxed font-medium">I have fully read and understood the terms of all policies listed above.</span>
                    </div>
                  </button>

                  {allChecked && (
                      <div className="flex items-center space-x-2 text-emerald-500 animate-in fade-in zoom-in duration-500">
                          <ShieldCheck size={20} />
                          <span className="text-[10px] font-black uppercase tracking-[0.2em]">Verified</span>
                      </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-24">
              <p className="text-gray-400 font-bold uppercase text-xs tracking-widest">No policies found.</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-8 py-8 border-t border-gray-50 bg-gray-50/30 flex flex-col md:flex-row items-center justify-between gap-6">
          <p className="text-xs text-gray-400 max-w-[18rem] text-center md:text-left font-medium leading-relaxed">
            By accepting, you acknowledge that you have read and agree to be bound by the terms above.
          </p>
          <div className="flex items-center space-x-4 w-full md:w-auto">
            {isMandatory && type === 'general' ? (
              <button
                 onClick={() => window.location.href = '/'}
                 className="flex-1 md:flex-none px-8 py-4 text-xs font-black uppercase tracking-widest text-gray-400 bg-white border border-gray-100 rounded-2xl hover:text-gray-600 hover:bg-gray-50 transition-all active:scale-95"
              >
                Decline
              </button>
            ) : !isMandatory && onClose && (
              <button
                onClick={onClose}
                className="flex-1 md:flex-none px-8 py-4 text-xs font-black uppercase tracking-widest text-gray-400 bg-white border border-gray-100 rounded-2xl hover:text-gray-600 hover:bg-gray-50 transition-all active:scale-95"
              >
                Cancel
              </button>
            )}
            <button
              onClick={handleAccept}
              disabled={loading || !isScrolledToEnd || accepting || !allChecked}
              className={`flex-1 md:flex-none px-12 py-4 text-xs font-black uppercase tracking-[0.2em] text-white rounded-2xl transition-all shadow-xl flex items-center justify-center space-x-3 active:scale-95 ${
                isScrolledToEnd && !accepting && allChecked
                  ? 'bg-primary hover:bg-primary-dark shadow-primary/25'
                  : 'bg-gray-300 cursor-not-allowed shadow-none'
              }`}
            >
              {accepting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white animate-spin rounded-full" />
                  <span>Processing...</span>
                </>
              ) : (
                <span>Accept Agreement</span>
              )}
            </button>
          </div>
        </div>
        {!isScrolledToEnd && !loading && (
            <div className="bg-primary/5 py-2 text-center">
                <p className="text-[10px] text-primary font-bold uppercase tracking-[0.3em] animate-pulse">Scroll to Bottom to Unlock</p>
            </div>
        )}
      </div>
    </div>
  );
};

export default PolicyModal;
