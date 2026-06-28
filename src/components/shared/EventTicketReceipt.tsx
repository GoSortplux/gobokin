'use client';

import React, { useRef } from 'react';
import { toPng } from 'html-to-image';
import { jsPDF } from 'jspdf';
import { Registration, Event } from '@/types';
import { CheckCircle, Download, Share2, Printer, MapPin, Calendar, Ticket, ShieldCheck } from 'lucide-react';
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
          title: 'Event Ticket',
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
          Share Ticket
        </button>
      </div>

      {/* Receipt Content */}
      <div
        ref={receiptRef}
        className="w-full bg-white shadow-2xl rounded-[2.5rem] overflow-hidden border border-gray-100 relative"
      >
        <div className="absolute top-0 left-0 w-full h-3 bg-gradient-to-r from-primary via-secondary to-primary" />

        <div className="p-8 lg:p-14">
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-14 border-b border-gray-100 pb-10">
            <div className="flex flex-col">
              <div className="relative w-[180px] h-[60px] mb-4">
                <Image src="/logo.png" alt="Gobokin Logo" fill className="object-contain object-left" />
              </div>
              <p className="text-gray-400 font-bold uppercase tracking-[0.2em] text-[10px]">Official Digital Ticket</p>
            </div>
            <div className="mt-8 md:mt-0 md:text-right">
              <h2 className="text-4xl font-black text-primary italic uppercase leading-none tracking-tighter">Ticket</h2>
              <div className="inline-flex items-center gap-2 mt-3 px-4 py-1.5 bg-gray-50 rounded-full border border-gray-100">
                <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse" />
                <p className="text-gray-500 font-bold uppercase text-[9px] tracking-widest">ID: {order.id}</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 mb-14">
            {/* Left: Event & Buyer Info */}
            <div className="lg:col-span-4 space-y-12">
              <section>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-8 h-8 rounded-lg bg-primary/5 flex items-center justify-center">
                    <Calendar size={14} className="text-primary" />
                  </div>
                  <span className="text-gray-900 font-black uppercase italic text-[10px] tracking-wider">Event Details</span>
                </div>
                <div className="space-y-6">
                  <div>
                    <p className="text-2xl font-black text-gray-900 leading-tight mb-2 uppercase italic">{order.event?.title}</p>
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-2 text-gray-500 font-bold uppercase text-[10px]">
                        <Calendar size={12} className="text-secondary" />
                        <span>{formattedDate(order.event?.startDate)}</span>
                      </div>
                      {order.event?.category && (
                        <div className="flex items-center gap-2 text-gray-500 font-bold uppercase text-[10px]">
                          <Ticket size={12} className="text-secondary" />
                          <span>{order.event.category}</span>
                        </div>
                      )}
                      <div className="flex items-start gap-2 text-gray-500 font-bold uppercase text-[10px]">
                        <MapPin size={12} className="text-secondary mt-0.5" />
                        <span className="leading-relaxed">{order.event?.location || 'N/A'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              <section className="pt-8 border-t border-gray-100">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-8 h-8 rounded-lg bg-primary/5 flex items-center justify-center">
                    <ShieldCheck size={14} className="text-primary" />
                  </div>
                  <span className="text-gray-900 font-black uppercase italic text-[10px] tracking-wider">Status</span>
                </div>
                <div className="inline-flex px-5 py-2.5 bg-green-50 text-green-600 rounded-xl font-black uppercase text-[10px] tracking-[0.15em] border border-green-100 shadow-sm shadow-green-900/5">
                  {order.paymentStatus || 'PAID'}
                </div>
              </section>
            </div>

            {/* Right: Tickets List */}
            <div className="lg:col-span-8">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary/5 flex items-center justify-center">
                        <Ticket size={14} className="text-primary" />
                    </div>
                    <span className="text-gray-900 font-black uppercase italic text-[10px] tracking-wider">Your Passes ({order.registrations.length})</span>
                </div>
                <div className="h-[1px] flex-1 bg-gray-100 ml-6 hidden md:block" />
              </div>

              <div className="space-y-6">
                {order.registrations.map((reg, index) => (
                  <div key={index} className="group relative">
                    {/* Ticket Card */}
                    <div className="bg-white rounded-[2rem] border-2 border-gray-50 overflow-hidden shadow-xl shadow-gray-200/40 hover:border-secondary/20 transition-all duration-500">
                      <div className="absolute top-0 left-0 w-2 h-full bg-secondary" />

                      <div className="flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-dashed divide-gray-200">
                        {/* Ticket Content */}
                        <div className="flex-1 p-8 md:p-10">
                          <div className="flex justify-between items-start mb-8">
                            <div className="space-y-1">
                              <p className="text-[10px] font-black text-secondary uppercase tracking-[0.2em]">Admission Pass</p>
                              <h4 className="text-xl font-black text-gray-900 uppercase italic tracking-tight">{reg.ticket?.name || 'General Admission'}</h4>
                            </div>
                            <div className="text-right">
                              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Price</p>
                              <p className="text-xl font-black text-primary italic">₦{(reg.pricePaid || 0).toLocaleString()}</p>
                            </div>
                          </div>

                          <div className="space-y-6">
                            <div>
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Attendee Name</p>
                                <p className="text-base font-black text-gray-900 uppercase italic leading-tight">{reg.attendeeData?.fullName || order.buyerInfo?.fullName}</p>
                            </div>

                            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-50">
                                <div>
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Ticket No.</p>
                                    <p className="text-sm font-black text-primary font-mono">{reg.ticketNumber}</p>
                                </div>
                                {reg.transactionId && (
                                    <div className="text-right">
                                        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1">Ref No.</p>
                                        <p className="text-[9px] font-black text-gray-600 uppercase tracking-widest bg-gray-50 px-3 py-1 rounded-full inline-block">{reg.transactionId}</p>
                                    </div>
                                )}
                            </div>
                          </div>
                        </div>

                        {/* QR Code Section */}
                        <div className="w-full md:w-[220px] p-8 md:p-10 flex flex-col items-center justify-center bg-gray-50/50">
                          <div className="relative w-32 h-32 p-3 bg-white rounded-2xl shadow-xl shadow-gray-200/50 border border-gray-100 group-hover:scale-105 transition-transform duration-500">
                            <Image
                              src={reg.qrCodeUrl || `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${reg.ticketNumber}`}
                              alt={`QR Code for ${reg.ticketNumber}`}
                              fill
                              className="object-contain p-2"
                              unoptimized
                            />
                          </div>
                          <div className="mt-6 flex flex-col items-center gap-1">
                             <div className="flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Valid Pass</p>
                             </div>
                             <p className="text-[8px] font-bold text-gray-300 uppercase tracking-tighter">Scan at entry</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Ticket "Cuts" */}
                    <div className="hidden md:block absolute top-1/2 -left-3 w-6 h-6 bg-white rounded-full border-2 border-gray-50 shadow-inner -translate-y-1/2" />
                    <div className="hidden md:block absolute top-1/2 -right-3 w-6 h-6 bg-white rounded-full border-2 border-gray-50 shadow-inner -translate-y-1/2" />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Pricing Section */}
          <div className="bg-primary rounded-[3rem] p-10 lg:p-16 text-white relative overflow-hidden shadow-3xl shadow-primary/20 border-b-8 border-secondary">
            <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full -mr-32 -mt-32 blur-3xl" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-secondary/10 rounded-full -ml-20 -mb-20 blur-2xl" />

            <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-12">
              <div className="text-center md:text-left">
                <h3 className="text-secondary font-black uppercase tracking-[0.3em] text-[11px] mb-4">Total Amount Paid</h3>
                <p className="text-6xl md:text-7xl font-black italic tracking-tighter">₦{order.amountPaid.toLocaleString()}</p>
              </div>
              <div className="text-center md:text-right space-y-6">
                <p className="text-white/60 text-xs font-bold uppercase tracking-widest max-w-[240px] leading-relaxed mx-auto md:ml-auto md:mr-0">
                  Present your ticket numbers or QR codes at the venue for official check-in.
                </p>
                <div className="inline-flex items-center gap-3 px-8 py-3 bg-white/10 rounded-2xl border border-white/10 backdrop-blur-md">
                  <ShieldCheck size={18} className="text-secondary" />
                  <p className="text-[11px] font-black text-white uppercase tracking-[0.25em]">Verified Secure</p>
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
