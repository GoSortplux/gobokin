'use client';

import React, { useRef } from 'react';
import { toPng } from 'html-to-image';
import { jsPDF } from 'jspdf';
import { Registration, Event } from '@/types';
import { CheckCircle, Download, Share2, Printer, MapPin, Calendar, Ticket, User, ShieldCheck } from 'lucide-react';
import Image from 'next/image';
import Swal from '@/utils/sweetalert';

interface EventTicketReceiptProps {
  order: {
    id: string;
    event: Partial<Event>;
    registrations: Registration[];
    buyerInfo: {
      fullName: string;
      email: string;
    };
    amountPaid: number;
    paymentStatus: string;
    createdAt: string;
  };
  isSuccessPage?: boolean;
}

const EventTicketReceipt: React.FC<EventTicketReceiptProps> = ({ order, isSuccessPage = false }) => {
  const receiptRef = useRef<HTMLDivElement>(null);

  const formattedDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const handleDownloadImage = async () => {
    if (receiptRef.current === null) return;
    try {
      const dataUrl = await toPng(receiptRef.current, { cacheBust: true, backgroundColor: '#ffffff' });
      const link = document.createElement('a');
      link.download = `ticket-receipt-${order.id}.png`;
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
      pdf.save(`ticket-receipt-${order.id}.pdf`);
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
      const file = new File([blob], `receipt-${order.id}.png`, { type: 'image/png' });

      if (navigator.share && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: 'Event Ticket Receipt',
          text: `I just got my tickets for ${order.event?.title || 'the event'}! Order ID: ${order.id}`,
        });
      } else {
        handleDownloadImage();
      }
    } catch (err) {
      console.error('Error sharing', err);
      handleDownloadImage();
    }
  };

  return (
    <div className="flex flex-col items-center w-full max-w-4xl mx-auto p-4 lg:p-8">
      {isSuccessPage && (
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-4">
            <CheckCircle className="w-12 h-12 text-green-600" />
          </div>
          <h1 className="text-4xl font-black text-gray-900 mb-2 italic uppercase">Registration Successful!</h1>
          <p className="text-gray-600 text-lg">Your tickets have been confirmed and sent to your email.</p>
        </div>
      )}

      {/* Action Buttons */}
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
      </div>

      {/* Receipt Content */}
      <div
        ref={receiptRef}
        className="w-full bg-white shadow-2xl rounded-[2rem] overflow-hidden border border-gray-100 relative"
      >
        <div className="absolute top-0 left-0 w-full h-4 bg-primary" />

        <div className="p-8 lg:p-12">
          {/* Header */}
          <div className="flex flex-col lg:row justify-between items-start lg:items-center mb-12 border-b border-gray-100 pb-8">
            <div className="flex flex-col">
              <Image src="/logo.png" alt="Gobokin Logo" width={180} height={60} className="mb-4 object-contain" />
              <p className="text-gray-500 font-medium italic">Official Event Ticket Receipt</p>
            </div>
            <div className="mt-6 lg:mt-0 text-right">
              <h2 className="text-3xl font-black text-primary italic uppercase leading-none">Receipt</h2>
              <p className="text-gray-400 mt-2 font-bold tracking-widest uppercase text-xs">Order ID: {order.id}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-12">
            {/* Left: Event & Venue */}
            <div className="space-y-10">
              <section>
                <div className="flex items-center gap-3 mb-4 text-primary font-bold uppercase tracking-wider text-[10px]">
                  <Calendar size={16} />
                  <span>Event Information</span>
                </div>
                <div className="bg-gray-50 p-6 rounded-2xl">
                  <p className="text-xl font-black text-gray-900 mb-2">{order.event?.title}</p>
                  <div className="flex items-center gap-2 text-gray-600 text-sm mb-2">
                    <Calendar size={14} className="text-primary" />
                    <span>{formattedDate(order.event?.startDate)}</span>
                  </div>
                  {order.event?.category && (
                    <div className="flex items-center gap-2 text-gray-600 text-sm mb-2">
                      <Ticket size={14} className="text-primary" />
                      <span className="capitalize">{order.event.category} Event</span>
                    </div>
                  )}
                  <div className="flex items-start gap-2 text-gray-600 text-sm">
                    <MapPin size={14} className="text-primary mt-1" />
                    <span>{order.event?.location || 'N/A'}</span>
                  </div>
                </div>
              </section>

              <section>
                <div className="flex items-center gap-3 mb-4 text-primary font-bold uppercase tracking-wider text-[10px]">
                  <User size={16} />
                  <span>Buyer Details</span>
                </div>
                <div className="bg-gray-50 p-6 rounded-2xl">
                  <p className="font-bold text-gray-900">{order.buyerInfo?.fullName}</p>
                  <p className="text-gray-500 text-sm">{order.buyerInfo?.email}</p>
                </div>
              </section>
            </div>

            {/* Right: Tickets */}
            <div className="space-y-10">
              <section>
                <div className="flex items-center gap-3 mb-4 text-primary font-bold uppercase tracking-wider text-[10px]">
                  <Ticket size={16} />
                  <span>Your Tickets ({order.registrations.length})</span>
                </div>
                <div className="space-y-4">
                  {order.registrations.map((reg, index) => (
                    <div key={index} className="bg-gray-50 p-6 rounded-2xl border border-gray-100">
                      <div className="flex flex-col md:flex-row justify-between gap-6">
                        <div className="flex-1 space-y-3">
                          <div className="flex items-center gap-2">
                            <User size={14} className="text-primary" />
                            <p className="font-bold text-gray-900">{reg.attendeeData?.fullName || order.buyerInfo?.fullName}</p>
                          </div>

                          <div>
                            <p className="font-black text-primary text-sm uppercase tracking-tight">{reg.ticket?.name || 'General Admission'}</p>
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Ticket #: {reg.ticketNumber}</p>
                            {reg.transactionId && (
                                <p className="text-[9px] text-gray-400 font-medium uppercase tracking-wider mt-0.5">Ref: {reg.transactionId}</p>
                            )}
                          </div>

                          <div className="pt-2">
                            <p className="font-black text-gray-900 text-lg">₦{(reg.pricePaid || 0).toLocaleString()}</p>
                          </div>
                        </div>

                        <div className="flex flex-col items-center justify-center p-3 bg-white rounded-xl shadow-sm border border-gray-100 w-full md:w-32 shrink-0">
                             <div className="relative w-24 h-24">
                                <Image
                                  src={reg.qrCodeUrl || `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${reg.ticketNumber}`}
                                  alt={`QR Code for ${reg.ticketNumber}`}
                                  fill
                                  className="object-contain"
                                  unoptimized
                                />
                             </div>
                             <p className="text-[8px] font-bold text-gray-400 mt-2 uppercase tracking-tighter">Scan to Check-in</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              <section>
                <div className="flex items-center gap-3 mb-4 text-primary font-bold uppercase tracking-wider text-[10px]">
                  <ShieldCheck size={16} />
                  <span>Payment Status</span>
                </div>
                <div className="inline-block px-4 py-2 bg-green-50 text-green-600 rounded-xl font-black uppercase text-[10px] tracking-widest border border-green-100">
                  {order.paymentStatus || 'PAID'}
                </div>
              </section>
            </div>
          </div>

          {/* Pricing Section */}
          <div className="bg-gray-900 rounded-[2.5rem] p-8 lg:p-12 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32" />

            <div className="relative z-10 flex flex-col md:row justify-between items-center gap-8">
              <div>
                <h3 className="text-gray-400 font-bold uppercase tracking-widest text-[10px] mb-2">Total Amount Paid</h3>
                <p className="text-5xl font-black italic">₦{order.amountPaid.toLocaleString()}</p>
              </div>
              <div className="text-center md:text-right">
                <p className="text-gray-400 text-sm italic mb-4 max-w-xs">This is an official proof of payment. Please present your ticket number at the venue.</p>
                <div className="inline-block border border-white/20 px-6 py-2 rounded-xl">
                  <p className="text-[10px] font-bold text-white uppercase tracking-[0.2em]">Verified Transaction</p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-12 text-center text-gray-400 text-[10px] uppercase font-bold tracking-widest">
            <p>&copy; {new Date().getFullYear()} Gobokin Platform. All rights reserved.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventTicketReceipt;
