"use client";
import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { AlertTriangle, CheckCircle, Clock, Info, ShieldCheck, ChevronRight } from "lucide-react";
import api from "@/services/api";

interface Incident {
  _id: string;
  title: string;
  message: string;
  type: string;
  status: string;
  createdAt: string;
}

const StatusPage = () => {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchIncidents = async () => {
      try {
        const res = await api.get("/admin/incidents");
        const data = res.data.data;
        setIncidents(Array.isArray(data) ? data : (Array.isArray(data?.incidents) ? data.incidents : []));
      } catch (error) {
        console.error("Error fetching status:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchIncidents();
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'resolved':
      case 'completed':
        return <CheckCircle className="text-green-500" size={24} />;
      case 'investigating':
      case 'identified':
        return <AlertTriangle className="text-amber-500" size={24} />;
      case 'monitoring':
      case 'in-progress':
        return <Clock className="text-blue-500" size={24} />;
      default:
        return <Info className="text-gray-500" size={24} />;
    }
  };

  const isSystemDown = Array.isArray(incidents) && incidents.some(i => i.status !== 'resolved' && i.type === 'incident');

  return (
    <div className="min-h-screen bg-gray-50 font-sans selection:bg-primary selection:text-white">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 py-6">
        <div className="container mx-auto px-4 flex justify-between items-center">
          <Link href="/" className="flex items-center gap-3 group">
            <Image
              src="/logo-icon.png"
              alt="Gobokin Logo"
              width={40}
              height={40}
              className="group-hover:rotate-12 transition-transform duration-300"
            />
            <span className="text-xl font-black uppercase italic tracking-tighter text-gray-900">Gobokin Status</span>
          </Link>
          <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 rounded-full text-xs font-black uppercase italic border border-green-100">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            System Operational
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12 max-w-4xl">
        {/* Hero Status */}
        <div className={`mb-12 p-8 rounded-[2.5rem] shadow-2xl shadow-gray-200/50 flex flex-col md:flex-row items-center gap-8 ${
          isSystemDown ? "bg-amber-500 text-white" : "bg-primary text-white"
        }`}>
          <div className="p-6 bg-white/20 rounded-[2rem] backdrop-blur-sm">
            {isSystemDown ? <AlertTriangle size={64} /> : <ShieldCheck size={64} />}
          </div>
          <div className="text-center md:text-left">
            <h1 className="text-4xl font-black uppercase italic mb-2 tracking-tight">
              {isSystemDown ? "Partial System Outage" : "All Systems Operational"}
            </h1>
            <p className="text-white/80 font-bold italic uppercase text-sm tracking-wide">
              {isSystemDown ? "We are currently investigating issues with some services." : "Our services are running smoothly and monitored 24/7."}
            </p>
          </div>
        </div>

        {/* Incidents Feed */}
        <div className="space-y-8">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-black text-gray-900 uppercase italic">Recent Updates</h2>
            <div className="h-px flex-1 mx-6 bg-gray-200" />
          </div>

          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-32 bg-white rounded-3xl animate-pulse border border-gray-100" />
              ))}
            </div>
          ) : incidents.length > 0 ? (
            <div className="space-y-6">
              {incidents.map((incident) => (
                <div key={incident._id} className="bg-white rounded-[2rem] p-8 border border-gray-100 shadow-sm hover:shadow-md transition-all">
                  <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-6">
                    <div className="flex items-center gap-4">
                      {getStatusIcon(incident.status)}
                      <div>
                        <h3 className="text-xl font-black text-gray-900 uppercase italic leading-none">{incident.title}</h3>
                        <p className="text-[10px] text-gray-400 font-black uppercase italic mt-1.5 tracking-wider">
                          Post ID: {incident._id.slice(-8)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`px-4 py-1 rounded-full text-[10px] font-black uppercase italic border ${
                        incident.status === 'resolved' ? 'bg-green-50 text-green-600 border-green-100' :
                        'bg-amber-50 text-amber-600 border-amber-100'
                      }`}>
                        {incident.status}
                      </span>
                      <span className="text-xs text-gray-400 font-bold italic">
                        {new Date(incident.createdAt).toLocaleDateString('en-US', {
                          month: 'long', day: 'numeric', year: 'numeric'
                        })}
                      </span>
                    </div>
                  </div>

                  <div
                    className="prose prose-sm max-w-none text-gray-600 font-medium leading-relaxed italic"
                    dangerouslySetInnerHTML={{ __html: incident.message }}
                  />

                  {incident.status !== 'resolved' && (
                    <div className="mt-8 flex items-center gap-2 text-primary font-black uppercase italic text-xs">
                      We are continuing to monitor the situation
                      <ChevronRight size={14} className="animate-bounce-x" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-24 bg-white rounded-[3rem] border-4 border-dashed border-gray-100">
              <CheckCircle size={80} className="mx-auto text-gray-100 mb-6" />
              <p className="text-xl font-black text-gray-300 uppercase italic">No incidents reported in the last 30 days</p>
            </div>
          )}
        </div>
      </main>

      <footer className="container mx-auto px-4 py-12 border-t border-gray-200 mt-12 flex flex-col md:flex-row justify-between items-center gap-6">
        <p className="text-xs font-bold text-gray-400 uppercase italic tracking-widest">
          © {new Date().getFullYear()} Gobokin Platform Services
        </p>
        <div className="flex gap-8">
          <Link href="/" className="text-xs font-black text-gray-400 hover:text-primary uppercase italic transition-colors">Back to Gobokin</Link>
          <Link href="#" className="text-xs font-black text-gray-400 hover:text-primary uppercase italic transition-colors">Support</Link>
          <Link href="#" className="text-xs font-black text-gray-400 hover:text-primary uppercase italic transition-colors">API Docs</Link>
        </div>
      </footer>

      <style jsx global>{`
        @keyframes bounce-x {
          0%, 100% { transform: translateX(0); }
          50% { transform: translateX(4px); }
        }
        .animate-bounce-x {
          animation: bounce-x 1s infinite;
        }
      `}</style>
    </div>
  );
};

export default StatusPage;
