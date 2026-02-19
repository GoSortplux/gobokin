"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import api from "@/services/api";
import UnifiedReceipt from "@/components/shared/UnifiedReceipt";
import SubscriptionReceipt from "@/components/shared/SubscriptionReceipt";
import { Booking } from "@/types";
import { ArrowLeft, Home, LayoutDashboard } from "lucide-react";

// Define a type for the data for type safety
interface BookingDetails {
  _id: string;
  hall?: {
    _id: string;
    name: string;
    location: string;
  };
  user?: {
    _id: string;
    fullName: string;
    email: string;
  };
  bookingId?: string;
  reservationId?: string;
  startTime?: string;
  endTime?: string;
  bookingDates?: { startTime: string; endTime: string }[];
  totalPrice: number;
  paidAmount?: number;
  balanceAmount?: number;
  reservationFee?: number;
  paymentStatus?: string;
  selectedFacilities?: {
    facility: {
        name: string;
    }
    quantity: number;
    cost: number;
  }[];
  // Subscription specific fields
  tier?: { name: string };
  purchaseDate?: string;
  price?: number;
}

const PaymentSuccessContent = () => {
  const [details, setDetails] = useState<BookingDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const router = useRouter();
  const isSubscription = searchParams.get("type") === "subscription";

  useEffect(() => {
    const fetchDetails = async () => {
      const bId = searchParams.get("bookingId");
      const rId = searchParams.get("reservationId");
      const id = bId || rId;

      if (isSubscription) {
        try {
          const response = await api.get("/licenses/my-subscription");
          if (response.data && response.data.data) {
            setDetails(response.data.data);
            setLoading(false);
            return;
          }
        } catch (err) {
          console.error("Failed to fetch subscription details", err);
        }
      }

      if (!id && !isSubscription) {
        router.push("/");
        return;
      }

      if (isSubscription) return;

      // Check if the ID is a 24-character hex string (MongoDB ObjectId)
      const isObjectId = id && id.length === 24 && /^[0-9a-fA-F]+$/.test(id);

      const endpoints = [];
      if (isObjectId) {
        if (bId) endpoints.push(`/bookings/${id}`);
        if (rId) endpoints.push(`/reservations/${id}`);
        endpoints.push(`/bookings/search/${id}`);
      } else {
        endpoints.push(`/bookings/search/${id}`);
      }

      let success = false;

      for (const endpoint of endpoints) {
        try {
          const response = await api.get(endpoint);
          if (response.data && response.data.data) {
            setDetails(response.data.data);
            success = true;
            break;
          }
        } catch (err) {
          console.error(`Failed to fetch details from ${endpoint}`, err);
        }
      }

      // Fallback: If we have an ObjectId but couldn't fetch details directly,
      // search through user's bookings and reservations to find a match.
      if (!success && isObjectId) {
        try {
          const [bookingsRes, reservationsRes] = await Promise.all([
            api.get('/bookings/my-bookings').catch(() => ({ data: { data: [] } })),
            api.get('/reservations/my-reservations').catch(() => ({ data: { data: { reservations: [] } } }))
          ]);

          const bookings = (bookingsRes.data.data || []) as BookingDetails[];
          const reservations = (reservationsRes.data.data.reservations || []) as BookingDetails[];

          const foundBooking = bookings.find((b) => b._id === id);
          if (foundBooking) {
            setDetails(foundBooking);
            success = true;
          } else {
            const foundRes = reservations.find((r) => r._id === id);
            if (foundRes) {
              setDetails(foundRes);
              success = true;
            }
          }
        } catch (err) {
          console.error("Fallback search failed", err);
        }
      }

      if (!success) {
        setError("Failed to load booking/reservation details.");
      }
      setLoading(false);
    };

    fetchDetails();
  }, [searchParams, router, isSubscription]);

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        <p className="text-gray-600 font-medium">Verifying payment details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen text-center p-4">
        <div className="bg-red-50 p-8 rounded-3xl max-w-md">
            <p className="text-red-600 text-lg font-bold mb-4">{error}</p>
            <Link href="/" className="inline-flex items-center px-6 py-3 rounded-xl shadow-lg text-white bg-primary hover:bg-primary/90 transition-all font-bold">
                Go to Homepage
            </Link>
        </div>
      </div>
    );
  }

  if (!details) {
    return null;
  }

  // Handle Subscription Receipt
  if (isSubscription) {
    if (!details?.tier) {
      return (
        <div className="flex flex-col justify-center items-center min-h-screen text-center p-4">
          <div className="bg-red-50 p-8 rounded-3xl max-w-md">
              <p className="text-red-600 text-lg font-bold mb-4">Subscription record not found.</p>
              <Link href="/" className="inline-flex items-center px-6 py-3 rounded-xl shadow-lg text-white bg-primary hover:bg-primary/90 transition-all font-bold">
                  Go to Homepage
              </Link>
          </div>
        </div>
      );
    }

    const subData = {
      tier: details.tier,
      status: "Active",
      purchaseDate: details.purchaseDate || new Date().toISOString(),
      price: details.price || 0
    };

    return (
      <div className="bg-gray-50 min-h-screen pb-20 pt-10">
        <div className="max-w-4xl mx-auto px-4 mb-6 flex justify-between items-center">
          <Link
              href="/vendor/dashboard"
              className="flex items-center gap-2 text-gray-500 hover:text-primary transition-colors font-bold uppercase text-xs tracking-widest"
          >
              <ArrowLeft size={16} />
              Dashboard
          </Link>
          <Link
              href="/"
              className="flex items-center gap-2 text-gray-500 hover:text-primary transition-colors font-bold uppercase text-xs tracking-widest"
          >
              <Home size={16} />
              Home
          </Link>
        </div>

        <SubscriptionReceipt data={subData} isSuccessPage={true} />

        <div className="max-w-4xl mx-auto px-4 mt-8 flex justify-center">
          <Link
            href="/vendor/dashboard"
            className="inline-flex items-center px-8 py-4 bg-primary text-white font-black italic uppercase rounded-2xl shadow-xl hover:shadow-primary/20 transition-all hover:scale-105 active:scale-95"
          >
            <LayoutDashboard className="mr-3" size={24} />
            Continue to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  // Normalize data for UnifiedReceipt
  const normalizedData = {
    ...details,
    bookingId: details.bookingId || details.reservationId || 'N/A',
    bookingDates: details.bookingDates || (details.startTime && details.endTime ? [{ startTime: details.startTime, endTime: details.endTime }] : []),
    venue: details.hall || { name: 'N/A', location: 'N/A' },
    user: details.user || (typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('user') || '{}') : {}),
  } as unknown as Booking;

  return (
    <div className="bg-gray-50 min-h-screen pb-20 pt-10">
      <div className="max-w-4xl mx-auto px-4 mb-6 flex justify-between items-center">
        <Link
            href="/dashboard"
            className="flex items-center gap-2 text-gray-500 hover:text-primary transition-colors font-bold uppercase text-xs tracking-widest"
        >
            <ArrowLeft size={16} />
            My Dashboard
        </Link>
        <Link
            href="/"
            className="flex items-center gap-2 text-gray-500 hover:text-primary transition-colors font-bold uppercase text-xs tracking-widest"
        >
            <Home size={16} />
            Home
        </Link>
      </div>

      <UnifiedReceipt data={normalizedData} isSuccessPage={true} />
    </div>
  );
};


const PaymentSuccessPage = () => {
    return (
        <Suspense fallback={
            <div className="flex justify-center items-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        }>
            <PaymentSuccessContent />
        </Suspense>
    )
}

export default PaymentSuccessPage;
