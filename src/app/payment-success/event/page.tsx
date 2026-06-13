"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import api from "@/services/api";
import CustomLoader from "@/components/CustomLoader";
import EventTicketReceipt from "@/components/shared/EventTicketReceipt";
import { ArrowLeft, Home, LayoutDashboard } from "lucide-react";

const EventPaymentSuccessContent = () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [orderData, setOrderData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const fetchOrderDetails = async () => {
      const orderId = searchParams.get("orderId");

      if (!orderId) {
        router.push("/");
        return;
      }

      try {
        setLoading(true);
        const response = await api.get(`/events/orders/${orderId}`);
        if (response.data && response.data.data) {
          setOrderData(response.data.data);
        } else {
          setError("Failed to load order details.");
        }
      } catch (err) {
        console.error("Failed to fetch order details:", err);
        setError("An error occurred while fetching your order details.");
      } finally {
        setLoading(false);
      }
    };

    fetchOrderDetails();
  }, [searchParams, router]);

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen space-y-4 bg-gray-50">
        <CustomLoader size={48} />
        <p className="text-gray-600 font-bold uppercase text-xs tracking-widest animate-pulse">Confirming your tickets...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen text-center p-4 bg-gray-50">
        <div className="bg-white p-12 rounded-[3rem] shadow-2xl shadow-red-900/5 max-w-md border border-red-50">
            <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-red-500 text-4xl font-black">!</span>
            </div>
            <h2 className="text-2xl font-black text-gray-900 mb-4 italic uppercase">Oops!</h2>
            <p className="text-gray-600 font-medium mb-8 leading-relaxed">{error}</p>
            <Link href="/" className="inline-flex items-center px-8 py-4 rounded-2xl shadow-xl text-white bg-primary hover:bg-primary/90 transition-all font-black italic uppercase text-sm">
                Go to Homepage
            </Link>
        </div>
      </div>
    );
  }

  if (!orderData) return null;

  return (
    <div className="bg-gray-50 min-h-screen pb-20 pt-24">
      <div className="max-w-4xl mx-auto px-4 mb-8 flex justify-between items-center">
        <Link
            href="/dashboard?tab=events"
            className="flex items-center gap-2 text-gray-500 hover:text-primary transition-colors font-black uppercase text-xs tracking-widest group"
        >
            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
            My Tickets
        </Link>
        <Link
            href="/"
            className="flex items-center gap-2 text-gray-500 hover:text-primary transition-colors font-black uppercase text-xs tracking-widest"
        >
            <Home size={16} />
            Home
        </Link>
      </div>

      <EventTicketReceipt order={orderData} isSuccessPage={true} />

      <div className="max-w-4xl mx-auto px-4 mt-12 flex flex-col md:flex-row justify-center gap-4">
        <Link
          href="/dashboard?tab=events"
          className="inline-flex items-center justify-center px-10 py-5 bg-primary text-white font-black italic uppercase rounded-2xl shadow-2xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all group"
        >
          <LayoutDashboard className="mr-3" size={20} />
          Go to Dashboard
        </Link>
        <button
          onClick={() => window.print()}
          className="inline-flex items-center justify-center px-10 py-5 bg-white text-gray-900 border-2 border-gray-100 font-black italic uppercase rounded-2xl shadow-xl hover:bg-gray-50 transition-all"
        >
          Print All Tickets
        </button>
      </div>
    </div>
  );
};

const EventPaymentSuccessPage = () => {
    return (
        <Suspense fallback={
            <div className="flex justify-center items-center min-h-screen bg-gray-50">
                <CustomLoader size={48} />
            </div>
        }>
            <EventPaymentSuccessContent />
        </Suspense>
    )
}

export default EventPaymentSuccessPage;
