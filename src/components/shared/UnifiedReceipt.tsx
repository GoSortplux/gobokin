"use client";

import React, { useRef } from 'react';
import { toPng } from 'html-to-image';
import { jsPDF } from 'jspdf';
import { Booking, Reservation, Venue } from '@/types';
import { CheckCircle, Download, Share2, Printer, MapPin, Calendar, Clock, CreditCard, Building2, User } from 'lucide-react';
import Image from 'next/image';
import Swal from '@/utils/sweetalert';

interface UnifiedReceiptProps {
  data: Booking | Reservation;
  isSuccessPage?: boolean;
}

const UnifiedReceipt: React.FC<UnifiedReceiptProps> = ({ data, isSuccessPage = false }) => {
  const receiptRef = useRef<HTMLDivElement>(null);

  const isBooking = (item: Booking | Reservation): item is Booking => {
    return 'bookingId' in item;
  };

  const id = isBooking(data) ? data.bookingId : data.reservationId;
  const venue = typeof data.hall === 'object' ? (data.hall as Venue) : null;

  // Calculate financial details
  const amountPaid = data.paidAmount || data.reservationFee || data.totalPrice;
  const balance = data.balanceAmount !== undefined
    ? data.balanceAmount
    : (data.reservationFee ? Math.max(0, data.totalPrice - data.reservationFee) : 0);
  const hasBalance = balance > 0;
  const totalValue = amountPaid + balance;
  const user = typeof data.user === 'object' ? (data.user as { fullName?: string; email?: string }) : null;

  const formattedDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const formattedTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleDownloadImage = async () => {
    if (receiptRef.current === null) return;
    try {
      const dataUrl = await toPng(receiptRef.current, { cacheBust: true, backgroundColor: '#ffffff' });
      const link = document.createElement('a');
      link.download = `receipt-${id}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Failed to download image', err);
      Swal.fire({
        icon: 'error',
        title: 'Download Failed',
        text: 'Could not generate image. Please try again.',
      });
    }
  };

  const handleDownloadPDF = async () => {
    if (receiptRef.current === null) return;
    try {
      const dataUrl = await toPng(receiptRef.current, { cacheBust: true, backgroundColor: '#ffffff' });
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgProps = pdf.getImageProperties(dataUrl);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      pdf.addImage(dataUrl, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`receipt-${id}.pdf`);
    } catch (err) {
      console.error('Failed to download PDF', err);
      Swal.fire({
        icon: 'error',
        title: 'Download Failed',
        text: 'Could not generate PDF. Please try again.',
      });
    }
  };

  const handleShare = async () => {
    if (receiptRef.current === null) return;
    try {
      const dataUrl = await toPng(receiptRef.current, { cacheBust: true, backgroundColor: '#ffffff' });
      const blob = await (await fetch(dataUrl)).blob();
      const file = new File([blob], `receipt-${id}.png`, { type: 'image/png' });

      if (navigator.share && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: 'Booking Receipt',
          text: `Here is my booking receipt for ${venue?.name || 'the venue'}. Receipt ID: ${id}`,
        });
      } else {
        // Fallback to image download if sharing is not supported
        handleDownloadImage();
      }
    } catch (err) {
      console.error('Error sharing', err);
      handleDownloadImage();
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="flex flex-col items-center w-full max-w-4xl mx-auto p-4 lg:p-8">
      {isSuccessPage && (
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-4">
            <CheckCircle className="w-12 h-12 text-green-600" />
          </div>
          <h1 className="text-4xl font-black text-gray-900 mb-2 italic uppercase">Payment Successful!</h1>
          <p className="text-gray-600 text-lg">Thank you. Your transaction was successful and your booking is confirmed.</p>
        </div>
      )}

      {/* Action Buttons - Hidden in Print */}
      <div className="flex flex-wrap justify-center gap-4 mb-8 print:hidden">
        <button
          onClick={handleDownloadPDF}
          className="flex items-center gap-2 px-6 py-3 bg-primary text-white font-bold rounded-xl hover:bg-primary/90 transition-all shadow-lg hover:shadow-primary/20"
        >
          <Download size={20} />
          Download PDF
        </button>
        <button
          onClick={handleDownloadImage}
          className="flex items-center gap-2 px-6 py-3 bg-secondary text-white font-bold rounded-xl hover:bg-secondary/90 transition-all shadow-lg hover:shadow-secondary/20"
        >
          <Printer size={20} />
          Save as Image
        </button>
        <button
          onClick={handleShare}
          className="flex items-center gap-2 px-6 py-3 bg-gray-800 text-white font-bold rounded-xl hover:bg-gray-700 transition-all shadow-lg"
        >
          <Share2 size={20} />
          Share Receipt
        </button>
        <button
          onClick={handlePrint}
          className="flex items-center gap-2 px-6 py-3 bg-blue-500 text-white font-bold rounded-xl hover:bg-blue-600 transition-all shadow-lg"
        >
          <Printer size={20} />
          Print
        </button>
      </div>

      {/* The Actual Receipt Content */}
      <div
        ref={receiptRef}
        className="w-full bg-white shadow-2xl print:shadow-none rounded-[2rem] print:rounded-none overflow-hidden print:overflow-visible border border-gray-100 print:border-none relative print-content"
        style={{ minHeight: '800px' }}
      >
        {/* Certificate Decoration */}
        <div className="absolute top-0 left-0 w-full h-4 bg-primary" />
        <div className="absolute bottom-0 left-0 w-full h-4 bg-secondary" />

        <div className="p-8 lg:p-12">
          {/* Header */}
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-12 border-b border-gray-100 pb-8">
            <div>
              <Image src="/logo.png" alt="Gobokin Logo" width={180} height={60} className="mb-4 object-contain" />
              <p className="text-gray-500 font-medium">Modern Event Booking Platform</p>
            </div>
            <div className="mt-6 lg:mt-0 text-right">
              <h2 className="text-3xl font-black text-primary italic uppercase leading-none">Receipt</h2>
              <p className="text-gray-400 mt-2 font-bold tracking-widest uppercase">ID: {id}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Left Column: Customer & Venue */}
            <div className="space-y-10">
              <section>
                <div className="flex items-center gap-3 mb-4 text-primary font-bold uppercase tracking-wider text-sm">
                  <User size={18} />
                  <span>Customer Information</span>
                </div>
                <div className="bg-gray-50 p-6 rounded-2xl">
                  <p className="text-xl font-bold text-gray-900">{user?.fullName || 'N/A'}</p>
                  <p className="text-gray-600 mt-1">{user?.email || 'N/A'}</p>
                </div>
              </section>

              <section>
                <div className="flex items-center gap-3 mb-4 text-primary font-bold uppercase tracking-wider text-sm">
                  <Building2 size={18} />
                  <span>Venue Details</span>
                </div>
                <div className="bg-gray-50 p-6 rounded-2xl">
                  <p className="text-xl font-bold text-gray-900">{venue?.name || 'N/A'}</p>
                  <div className="flex items-start gap-2 text-gray-600 mt-2">
                    <MapPin size={18} className="mt-1 flex-shrink-0" />
                    <span>{venue?.location || 'N/A'}</span>
                  </div>
                </div>
              </section>
            </div>

            {/* Right Column: Booking Details */}
            <div className="space-y-10">
              <section>
                <div className="flex items-center gap-3 mb-4 text-primary font-bold uppercase tracking-wider text-sm">
                  <Calendar size={18} />
                  <span>Booking Dates & Times</span>
                </div>
                <div className="bg-gray-50 p-6 rounded-2xl space-y-4">
                  {data.bookingDates.map((date, index) => (
                    <div key={index} className="flex justify-between items-center pb-3 border-b border-gray-200 last:border-0 last:pb-0">
                      <div>
                        <p className="font-bold text-gray-800">{formattedDate(date.startTime)}</p>
                        <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                          <Clock size={14} />
                          <span>{formattedTime(date.startTime)} - {formattedTime(date.endTime)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              <section>
                <div className="flex items-center gap-3 mb-4 text-primary font-bold uppercase tracking-wider text-sm">
                  <CreditCard size={18} />
                  <span>Payment Status</span>
                </div>
                <div className="inline-block px-4 py-2 bg-green-100 text-green-700 rounded-full font-bold uppercase text-xs tracking-widest border border-green-200">
                  {data.paymentStatus || 'Paid'}
                </div>
              </section>
            </div>
          </div>

          {/* Pricing Section */}
          <div className="mt-16 bg-primary/5 rounded-[2.5rem] p-8 lg:p-12 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full -mr-32 -mt-32" />

            <div className="relative z-10">
              <div className="flex flex-col lg:flex-row justify-between items-center gap-8 mb-8">
                <div>
                  <h3 className="text-gray-500 font-bold uppercase tracking-widest text-sm mb-2">
                    {hasBalance ? "Amount Paid (Deposit)" : "Total Amount Paid"}
                  </h3>
                  <p className="text-5xl font-black text-primary leading-none">
                    ₦{amountPaid.toLocaleString()}
                  </p>
                </div>
                <div className="text-center lg:text-right">
                  <p className="text-gray-400 italic mb-4 max-w-xs">This document serves as official proof of payment for the services described above.</p>
                  <div className="inline-block border-2 border-gray-200 px-8 py-3 rounded-xl">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-[0.3em]">Verified Transaction</p>
                  </div>
                </div>
              </div>

              {hasBalance && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-8 border-t border-primary/10">
                  <div className="bg-white/50 p-6 rounded-2xl backdrop-blur-sm border border-primary/5">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Total Booking Value</p>
                    <p className="text-2xl font-black text-gray-900">₦{totalValue.toLocaleString()}</p>
                  </div>
                  <div className="bg-primary text-white p-6 rounded-2xl shadow-xl shadow-primary/20">
                    <p className="text-[10px] font-bold text-primary-100 uppercase tracking-widest mb-1">Outstanding Balance</p>
                    <p className="text-2xl font-black">₦{balance.toLocaleString()}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Footer Branding */}
          <div className="mt-12 text-center text-gray-400 text-sm">
            <p>&copy; {new Date().getFullYear()} Gobokin, Inc. All rights reserved.</p>
            <p className="mt-1">www.gogobokin.com</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UnifiedReceipt;
