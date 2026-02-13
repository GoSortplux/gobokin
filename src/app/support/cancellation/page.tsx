'use client';

import React, { useState, useEffect } from 'react';
import api from '@/services/api';
import { Policy } from '@/types';
import CustomLoader from '@/components/CustomLoader';
import { ShieldCheck, CalendarX, RotateCcw } from 'lucide-react';

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

const CancellationOptionsPage = () => {
  const [policy, setPolicy] = useState<Policy | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPolicy = async () => {
      try {
        const res = await api.get('/policies/refund-policy');
        setPolicy(res.data.data);
      } catch (err) {
        console.error('Failed to fetch refund policy:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchPolicy();
  }, []);

  return (
    <div className="min-h-screen bg-white pt-32 pb-20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-6xl font-black text-gray-900 mb-6 tracking-tight">
              Cancellation Options
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
              We understand that plans change. Here&apos;s everything you need to know about cancellations and refunds.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
            <div className="p-6 bg-gray-50 rounded-3xl flex items-center space-x-4">
              <div className="p-3 bg-blue-100 rounded-2xl text-blue-600">
                <CalendarX size={24} />
              </div>
              <div>
                <h3 className="font-bold text-gray-900">Easy Cancellation</h3>
                <p className="text-xs text-gray-500">Manage from your dashboard</p>
              </div>
            </div>
            <div className="p-6 bg-gray-50 rounded-3xl flex items-center space-x-4">
              <div className="p-3 bg-emerald-100 rounded-2xl text-emerald-600">
                <RotateCcw size={24} />
              </div>
              <div>
                <h3 className="font-bold text-gray-900">Fair Refunds</h3>
                <p className="text-xs text-gray-500">Based on policy timelines</p>
              </div>
            </div>
            <div className="p-6 bg-gray-50 rounded-3xl flex items-center space-x-4">
              <div className="p-3 bg-purple-100 rounded-2xl text-purple-600">
                <ShieldCheck size={24} />
              </div>
              <div>
                <h3 className="font-bold text-gray-900">Protected Bookings</h3>
                <p className="text-xs text-gray-500">Verified and secure</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-[2.5rem] border border-gray-100 p-8 md:p-16 shadow-2xl shadow-gray-100">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20">
                <CustomLoader size={50} />
                <p className="mt-6 text-gray-400 font-bold uppercase text-[10px] tracking-widest animate-pulse">Loading Policy Details</p>
              </div>
            ) : policy ? (
              <div>
                <div className="mb-10 pb-10 border-b border-gray-50">
                  <h2 className="text-3xl font-black text-gray-900 mb-2">{policy.title}</h2>
                  <div className="flex items-center space-x-3 text-xs text-gray-400 font-bold uppercase tracking-widest">
                    <span>Version {policy.version}</span>
                    <span className="w-1 h-1 rounded-full bg-gray-300" />
                    <span>Updated {new Date(policy.effectiveDate).toLocaleDateString()}</span>
                  </div>
                </div>
                <MarkdownRenderer content={policy.content} />
              </div>
            ) : (
              <div className="text-center py-20">
                <p className="text-gray-500 font-medium">Policy information is currently unavailable. Please contact support.</p>
              </div>
            )}
          </div>

          <div className="mt-12 text-center">
            <p className="text-gray-500 mb-6">Need more clarification about a specific booking?</p>
            <a href="/support/help-center" className="inline-flex items-center space-x-2 text-primary font-black uppercase tracking-widest text-xs hover:underline">
              <span>Contact Support</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CancellationOptionsPage;
