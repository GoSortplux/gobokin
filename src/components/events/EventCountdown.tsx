"use client";
import React, { useState, useEffect } from "react";
import { Clock } from "lucide-react";

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  total: number;
}

const calculateTimeLeft = (targetDate: string): TimeLeft => {
  const difference = +new Date(targetDate) - +new Date();
  let timeLeft: TimeLeft = {
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    total: difference,
  };

  if (difference > 0) {
    timeLeft = {
      days: Math.floor(difference / (1000 * 60 * 60 * 24)),
      hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
      minutes: Math.floor((difference / 1000 / 60) % 60),
      seconds: Math.floor((difference / 1000) % 60),
      total: difference,
    };
  }

  return timeLeft;
};

const EventCountdown = ({ targetDate }: { targetDate: string }) => {
  const [timeLeft, setTimeLeft] = useState<TimeLeft | null>(null);

  useEffect(() => {
    // Initial calculation
    setTimeLeft(calculateTimeLeft(targetDate));

    const timer = setInterval(() => {
      const newTimeLeft = calculateTimeLeft(targetDate);
      setTimeLeft(newTimeLeft);
      if (newTimeLeft.total <= 0) {
        clearInterval(timer);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [targetDate]);

  if (!timeLeft || timeLeft.total <= 0) {
    return null;
  }

  const isUrgent = timeLeft.total < 24 * 60 * 60 * 1000;

  const formatNumber = (num: number) => num.toString().padStart(2, "0");

  return (
    <div className={`flex items-center gap-2 px-4 py-2 rounded-xl backdrop-blur-md shadow-sm border ${
      isUrgent
        ? "bg-rose-50 border-rose-100 text-rose-600 animate-pulse"
        : "bg-white/90 border-gray-100 text-gray-700"
    }`}>
      <Clock size={14} className={isUrgent ? "text-rose-500" : "text-primary"} />
      <div className="flex items-center gap-1 font-mono text-sm font-black tracking-tighter">
        <span>{formatNumber(timeLeft.days)}d</span>
        <span className="opacity-30">:</span>
        <span>{formatNumber(timeLeft.hours)}h</span>
        <span className="opacity-30">:</span>
        <span>{formatNumber(timeLeft.minutes)}m</span>
        <span className="opacity-30">:</span>
        <span>{formatNumber(timeLeft.seconds)}s</span>
      </div>
      {isUrgent && (
        <span className="text-[10px] font-bold uppercase tracking-widest ml-1 hidden md:inline">
          Starts Soon
        </span>
      )}
    </div>
  );
};

export default EventCountdown;
