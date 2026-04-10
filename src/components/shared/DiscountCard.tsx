"use client";

import React from 'react';
import Image from 'next/image';
import { Ticket, Sparkles } from 'lucide-react';
import { formatDateLong } from '@/utils/date';

interface DiscountCardProps {
  venueName: string;
  code: string;
  discountPercentage: number;
  expiryDate?: string;
  daysRemaining?: number;
}

const DiscountCard: React.FC<DiscountCardProps> = ({
  venueName,
  code,
  discountPercentage,
  expiryDate,
  daysRemaining
}) => {
  return (
    <div
      className="w-[500px] min-h-[350px] bg-white relative overflow-hidden flex flex-col border border-gray-100 shadow-2xl"
      style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
    >
      {/* Decorative Background Elements */}
      <div className="absolute top-0 right-0 w-40 h-40 bg-primary/5 rounded-full -mr-20 -mt-20" />
      <div className="absolute bottom-0 left-0 w-32 h-32 bg-secondary/5 rounded-full -ml-16 -mb-16" />

      {/* Header with Logo */}
      <div className="p-6 flex justify-between items-center border-b border-dashed border-gray-200">
        <div className="relative w-32 h-10">
          <Image
            src="/logo.png"
            alt="GoBokin Logo"
            fill
            className="object-contain object-left"
          />
        </div>
        <div className="flex items-center gap-2 text-primary font-bold text-sm uppercase tracking-widest">
          <Ticket size={16} />
          <span>Voucher</span>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-8 flex flex-col items-center justify-center text-center">
        <div className="mb-2">
          <p className="text-gray-400 text-xs font-bold uppercase tracking-[0.2em] mb-1">Exclusive Discount for</p>
          <h2 className="text-xl font-black text-gray-900 leading-tight">{venueName}</h2>
        </div>

        <div className="my-4 bg-gray-50 px-8 py-4 rounded-2xl border-2 border-dashed border-primary relative group w-full max-w-[400px]">
          <p className="text-3xl font-black text-primary tracking-[0.1em] uppercase break-all">{code}</p>
          <div className="absolute -top-3 -right-3 bg-secondary text-white p-1.5 rounded-full shadow-lg">
            <Sparkles size={14} className="animate-pulse" />
          </div>
        </div>

        <div>
          <p className="text-2xl font-black text-secondary uppercase">
            Get {discountPercentage}% OFF
          </p>
          {expiryDate && (
            <p className="text-sm font-bold text-gray-700 mt-1">
              Valid until {formatDateLong(expiryDate)}
              {daysRemaining !== undefined && (
                <span className="text-xs text-primary ml-2 italic">
                  ({daysRemaining} {daysRemaining === 1 ? 'day' : 'days'} left)
                </span>
              )}
            </p>
          )}
          <p className="text-[10px] text-gray-400 font-medium mt-1">
            Valid for offline bookings made directly with the venue owner via GoBokin.
          </p>
        </div>
      </div>

      {/* Footer Decoration */}
      <div className="h-2 w-full flex">
        <div className="h-full flex-1 bg-primary" />
        <div className="h-full flex-1 bg-secondary" />
      </div>

      {/* Side Notches for Voucher Look */}
      <div className="absolute top-1/2 -left-3 w-6 h-6 bg-white border border-gray-100 rounded-full shadow-inner transform -translate-y-1/2" />
      <div className="absolute top-1/2 -right-3 w-6 h-6 bg-white border border-gray-100 rounded-full shadow-inner transform -translate-y-1/2" />
    </div>
  );
};

export default DiscountCard;
