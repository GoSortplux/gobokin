"use client";

import React, { useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import CustomLoader from "@/components/CustomLoader";

const EventPaymentSuccessContent = () => {
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const orderId = searchParams.get("orderId");
    if (orderId) {
      // Build search params string to preserve existing query parameters (like reference)
      const paramsString = searchParams.toString();
      const queryString = paramsString ? `?${paramsString}` : "";
      router.replace(`/events/orders/${orderId}/success${queryString}`);
    } else {
      router.replace("/");
    }
  }, [searchParams, router]);

  return (
    <div className="flex flex-col justify-center items-center min-h-screen space-y-4 bg-gray-50">
      <CustomLoader size={48} />
      <p className="text-gray-600 font-bold uppercase text-xs tracking-widest animate-pulse">
        Redirecting to your tickets...
      </p>
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
  );
};

export default EventPaymentSuccessPage;
