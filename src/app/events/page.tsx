"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Calendar,
  Search,
  Filter,
  MapPin,
  Ticket,
  ArrowRight,
  PlusCircle,
  Layers,
  Clock,
  LayoutGrid,
  List,
  ChevronRight,
  TrendingUp,
  Star,
  CheckCircle2
} from "lucide-react";
import Image from "next/image";
import api from "@/services/api";
import { Event } from "@/types";
import CustomLoader from "@/components/CustomLoader";
import Swal from "@/utils/sweetalert";
import { translateError } from "@/utils/errors";

interface DiscoveryData {
  featured: Event[];
  upcoming: Event[];
  byCategory: Record<string, Event[]>;
}

const EventDiscovery = () => {
  const [discoveryData, setDiscoveryData] = useState<DiscoveryData>({ featured: [], upcoming: [], byCategory: {} });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");

  useEffect(() => {
    fetchDiscoveryEvents();
  }, []);

  const fetchDiscoveryEvents = async () => {
    try {
      setLoading(true);
      const response = await api.get("/events/discovery");
      const data = response.data.data;
      // The API returns { featured: [], upcoming: [], byCategory: {} } in data
      if (data) {
        setDiscoveryData({
          featured: data.featured || [],
          upcoming: data.upcoming || [],
          byCategory: data.byCategory || {}
        });
      }
    } catch (error) {
      console.error("Failed to fetch discovery events:", error);
      Swal.fire("Error", translateError(error), "error");
    } finally {
      setLoading(false);
    }
  };

  const categories = ["All", ...Object.keys(discoveryData?.byCategory || {})];

  if (loading) return <div className="min-h-screen pt-32 flex items-center justify-center"><CustomLoader /></div>;

  const renderEventCard = (event: Event, variant: 'featured' | 'standard' = 'standard') => (
    <Link
      key={event.id}
      href={`/events/${event.id}`}
      className={`bg-white border border-gray-100 shadow-sm overflow-hidden hover:shadow-2xl hover:shadow-blue-900/10 transition-all duration-500 group ${
        variant === 'featured' ? 'rounded-[3rem]' : 'rounded-[2.5rem]'
      }`}
    >
      <div className={`relative w-full overflow-hidden ${variant === 'featured' ? 'h-72' : 'h-64'}`}>
        {event.bannerUrl ? (
          <Image src={event.bannerUrl} alt={event.title} fill className="object-cover transition-transform duration-700 group-hover:scale-110" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center">
             <Calendar size={48} className="text-primary/20" />
          </div>
        )}
        <div className="absolute top-5 left-5">
          <span className="px-4 py-2 rounded-2xl bg-white/90 backdrop-blur-md shadow-sm text-[10px] font-black uppercase tracking-widest text-primary">
            {event.category}
          </span>
        </div>
        {event.isFeatured && (
          <div className="absolute top-5 right-5">
            <div className="w-10 h-10 bg-amber-400 text-white rounded-2xl flex items-center justify-center shadow-lg">
              <Star size={18} />
            </div>
          </div>
        )}
      </div>

      <div className="p-6">
        <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">
          <Clock size={14} className="text-primary" />
          {new Date(event.startDate).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })} • {new Date(event.startDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
        <h3 className={`font-black text-gray-900 mb-4 line-clamp-1 group-hover:text-primary transition-colors ${variant === 'featured' ? 'text-2xl' : 'text-xl'}`}>{event.title}</h3>

        <div className="flex items-center gap-2 text-sm text-gray-500 font-medium mb-6">
          <MapPin size={16} className="text-gray-400" />
          <span className="line-clamp-1">{event.location || "Virtual Event"}</span>
        </div>

        <div className="flex items-center justify-between pt-6 border-t border-gray-50">
          <div className="space-y-0.5">
            <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Starts from</p>
            <p className="text-lg font-black text-gray-900">
              {event.tickets?.[0]?.price > 0 ? `₦${event.tickets[0].price.toLocaleString()}` : "Free"}
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-primary text-white flex items-center justify-center shadow-lg shadow-primary/20 group-hover:translate-x-1 transition-transform">
            <ArrowRight size={20} />
          </div>
        </div>
      </div>
    </Link>
  );

  return (
    <div className="min-h-screen bg-gray-50 pt-24 pb-20">
      {/* Hero Section */}
      <section className="container mx-auto px-4 mb-16">
        <div className="bg-primary rounded-[3rem] p-8 lg:p-16 text-white relative overflow-hidden shadow-2xl shadow-primary/20">
          <div className="relative z-10 max-w-2xl">
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest mb-6">
              <TrendingUp size={14} />
              Trending Events in your area
            </div>
            <h1 className="text-4xl lg:text-6xl font-black mb-6 leading-tight">Discover Unforgettable Experiences</h1>
            <p className="text-blue-100 text-lg mb-8 font-medium">Join thousands of people discovering local workshops, conferences, and festivals near you.</p>

            <div className="relative max-w-md">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400" size={24} />
              <input
                type="text"
                placeholder="Search events, workshops, or festivals..."
                className="w-full pl-14 pr-4 py-5 bg-white border-none rounded-3xl text-gray-900 shadow-lg focus:ring-4 focus:ring-white/20 transition-all font-medium"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-white/10 to-transparent pointer-events-none"></div>
          <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-blue-400/20 rounded-full blur-3xl"></div>
          <div className="absolute top-12 right-24 hidden lg:block animate-bounce duration-[3000ms]">
             <div className="bg-white/10 backdrop-blur-md p-6 rounded-3xl border border-white/20 shadow-xl">
                <div className="flex items-center gap-3">
                   <div className="w-12 h-12 bg-emerald-400 rounded-2xl flex items-center justify-center">
                      <CheckCircle2 size={24} />
                   </div>
                   <div>
                      <p className="font-black text-sm uppercase tracking-widest">Verified Events</p>
                      <p className="text-blue-100 text-xs">Quality guaranteed by Gobokin</p>
                   </div>
                </div>
             </div>
          </div>
        </div>
      </section>

      {/* Featured Section */}
      {discoveryData?.featured?.length > 0 && (
        <section className="container mx-auto px-4 mb-20">
          <div className="flex items-center justify-between mb-8">
             <h2 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-3">
               <Star className="text-amber-400 fill-amber-400" size={28} />
               Featured Events
             </h2>
             <Link href="/events?filter=featured" className="text-primary font-bold hover:underline flex items-center gap-1">
                View all featured
                <ChevronRight size={18} />
             </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {discoveryData.featured.map(event => renderEventCard(event, 'featured'))}
          </div>
        </section>
      )}

      {/* Category Filter */}
      <section className="container mx-auto px-4 mb-12 sticky top-24 z-20">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-8 bg-white/80 backdrop-blur-md p-3 rounded-[2rem] shadow-sm border border-gray-100">
           <div className="flex items-center gap-2 overflow-x-auto no-scrollbar w-full lg:w-auto px-2">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-6 py-3.5 rounded-2xl text-sm font-bold whitespace-nowrap transition-all ${
                    activeCategory === cat
                      ? "bg-primary text-white shadow-xl shadow-primary/20"
                      : "text-gray-500 hover:bg-gray-50"
                  }`}
                >
                  {cat}
                </button>
              ))}
           </div>

           <div className="flex items-center gap-4 w-full lg:w-auto justify-end">
              <button className="flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-gray-50 text-gray-700 font-bold text-sm hover:bg-gray-100 transition-all">
                <Filter size={18} />
                Filters
              </button>
           </div>
        </div>
      </section>

      {/* Main Grid: Shows Upcoming or Categorized */}
      <section className="container mx-auto px-4">
        {activeCategory === "All" ? (
          <div className="space-y-20">
            {/* Upcoming Section */}
            {discoveryData?.upcoming?.length > 0 && (
              <div>
                <h2 className="text-3xl font-black text-gray-900 tracking-tight mb-8">Upcoming Experiences</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                  {discoveryData.upcoming.map(event => renderEventCard(event))}
                </div>
              </div>
            )}

            {/* Categorized Sections Preview */}
            {Object.entries(discoveryData?.byCategory || {}).map(([category, events]) => (
               <div key={category}>
                  <div className="flex items-center justify-between mb-8">
                     <h2 className="text-3xl font-black text-gray-900 tracking-tight">{category}</h2>
                     <button onClick={() => setActiveCategory(category)} className="text-primary font-bold hover:underline">See more</button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                    {events && Array.isArray(events) && events.slice(0, 4).map(event => renderEventCard(event))}
                  </div>
               </div>
            ))}
          </div>
        ) : (
          <div>
            <h2 className="text-3xl font-black text-gray-900 tracking-tight mb-8">{activeCategory} Events</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {discoveryData?.byCategory?.[activeCategory]?.map(event => renderEventCard(event)) || (
                <div className="col-span-full py-20 text-center bg-white rounded-[3rem] border border-gray-100">
                   <p className="text-gray-500 font-medium">No events found in this category.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </section>
    </div>
  );
};

export default EventDiscovery;
