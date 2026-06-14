"use client";

import { useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import CustomLoader from "@/components/CustomLoader";

const EventsVerifyContent = () => {
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    // Extract all potential reference parameters
    const reference = searchParams.get("reference") ||
                      searchParams.get("paymentReference") ||
                      searchParams.get("transactionReference") ||
                      searchParams.get("trcref");

    const type = searchParams.get("type") || "event";

    if (reference) {
      // Redirect to the unified payment verification page with the parameters
      // We use /payment/verify as the central engine for verification
      router.replace(`/payment/verify?reference=${encodeURIComponent(reference)}&type=${encodeURIComponent(type)}`);
    } else {
      // If no reference, redirect home
      router.replace("/");
    }
  }, [searchParams, router]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
      <div className="bg-white p-10 rounded-2xl shadow-xl text-center max-w-md w-full border border-gray-100">
        <CustomLoader size={64} className="mx-auto mb-6" />
        <h1 className="text-2xl font-bold text-gray-800 tracking-tight mb-2">Initializing Verification</h1>
        <p className="text-gray-600 font-medium">Please wait while we prepare to verify your payment...</p>
      </div>
    </div>
  );
};

const EventsVerifyPage = () => {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
        <CustomLoader size={64} />
      </div>
    }>
      <EventsVerifyContent />
    </Suspense>
  );
};

export default EventsVerifyPage;
