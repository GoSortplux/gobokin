"use client";
import React from 'react';
import { Search, MapPin, Users, Calendar, Star, ShieldCheck, Filter, ArrowRight, CreditCard, Clock } from 'lucide-react';

const CustomerMarketingShowcase = () => {
  return (
    <div className="bg-white min-h-screen">
      {/* Hero Section */}
      <section className="relative pt-20 pb-32 overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-slate-50 -z-10 skew-y-3 origin-top-left"></div>
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <span className="text-blue-600 font-black uppercase tracking-widest text-sm mb-4 block">Experience Perfection</span>
            <h1 id="customer-hero" className="text-6xl font-black text-slate-900 mb-8 leading-tight tracking-tighter">Your Event. <br/><span className="text-blue-600 italic">The Perfect Space.</span></h1>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto font-medium">
              Discover, customize, and book the most exclusive venues in your city with Gobokin.
            </p>
          </div>

          {/* Search Bar Mockup */}
          <div id="search-mockup" className="max-w-4xl mx-auto bg-white p-4 rounded-[2.5rem] shadow-2xl border border-slate-100 flex flex-col md:flex-row gap-4 items-center mb-20">
            <div className="flex-1 w-full flex items-center gap-3 px-6 py-4 bg-slate-50 rounded-2xl border border-slate-100">
                <MapPin className="text-blue-600" size={20}/>
                <div className="text-left">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Location</p>
                    <p className="text-sm font-bold text-slate-900">Lagos, Nigeria</p>
                </div>
            </div>
            <div className="flex-1 w-full flex items-center gap-3 px-6 py-4 bg-slate-50 rounded-2xl border border-slate-100">
                <Users className="text-blue-600" size={20}/>
                <div className="text-left">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Guests</p>
                    <p className="text-sm font-bold text-slate-900">200 - 500 Guests</p>
                </div>
            </div>
            <button className="w-full md:w-auto px-10 py-5 bg-blue-600 text-white rounded-2xl font-black flex items-center justify-center gap-2 hover:bg-blue-700 transition-all shadow-lg shadow-blue-200">
                <Search size={20}/>
                <span>Find Venue</span>
            </button>
          </div>
        </div>
      </section>

      {/* Discovery Section */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row gap-16 items-start">
            <div className="lg:w-1/3 sticky top-10">
                <h2 className="text-4xl font-black text-slate-900 mb-6 tracking-tight">Smart <span className="text-blue-600">Filters</span></h2>
                <p className="text-slate-600 mb-8 font-medium">Narrow down your search with precise filters designed for every event type.</p>
                <div className="space-y-4">
                    {['Capacity', 'Price Range', 'Hall Type', 'Facilities', 'Availability'].map((filter) => (
                        <div key={filter} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                            <span className="font-bold text-slate-900">{filter}</span>
                            <Filter size={16} className="text-slate-400"/>
                        </div>
                    ))}
                </div>
            </div>
            <div id="venue-cards-grid" className="lg:w-2/3 grid grid-cols-1 md:grid-cols-2 gap-8">
                {[
                    { name: "Skyline Grand Hall", loc: "Victoria Island", price: "₦500,000", rating: "4.9", reviews: "124" },
                    { name: "Emerald Garden", loc: "Ikeja", price: "₦250,000", rating: "4.8", reviews: "89" }
                ].map((venue, i) => (
                    <div key={i} className="bg-white rounded-3xl overflow-hidden border border-slate-100 shadow-xl group hover:-translate-y-2 transition-all">
                        <div className="h-56 bg-slate-200 relative">
                            <div className="absolute top-4 right-4 bg-white/90 backdrop-blur px-3 py-1.5 rounded-xl flex items-center gap-1 shadow-sm">
                                <Star className="text-amber-500 fill-amber-500" size={14}/>
                                <span className="text-xs font-black text-slate-900">{venue.rating}</span>
                            </div>
                        </div>
                        <div className="p-6">
                            <h4 className="text-xl font-black text-slate-900 mb-1">{venue.name}</h4>
                            <div className="flex items-center gap-1 text-slate-400 mb-4">
                                <MapPin size={14}/>
                                <span className="text-xs font-bold uppercase tracking-widest">{venue.loc}</span>
                            </div>
                            <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase">Starts from</p>
                                    <p className="text-lg font-black text-blue-600">{venue.price}</p>
                                </div>
                                <div className="w-10 h-10 bg-slate-900 text-white rounded-xl flex items-center justify-center group-hover:bg-blue-600 transition-colors">
                                    <ArrowRight size={20}/>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
          </div>
        </div>
      </section>

      {/* Booking Flow Mockup */}
      <section className="py-20 bg-slate-900 text-white overflow-hidden">
        <div className="max-w-7xl mx-auto px-6">
            <div className="flex flex-col lg:flex-row items-center gap-20">
                <div id="booking-modal-closeup" className="lg:w-1/2">
                    <div className="bg-white rounded-[2.5rem] shadow-2xl p-8 text-slate-900 border border-slate-100">
                        <div className="flex justify-between items-center mb-8 pb-6 border-b border-slate-100">
                            <div>
                                <h3 className="text-2xl font-black">Book Venue</h3>
                                <p className="text-xs text-slate-400 font-bold uppercase tracking-[0.2em] mt-1">3 Simple Steps</p>
                            </div>
                            <div className="flex gap-2">
                                <div className="w-8 h-2 bg-blue-600 rounded-full"></div>
                                <div className="w-8 h-2 bg-blue-600 rounded-full"></div>
                                <div className="w-8 h-2 bg-slate-200 rounded-full"></div>
                            </div>
                        </div>
                        <div className="space-y-6">
                            <div className="p-5 bg-blue-50/50 rounded-2xl border border-blue-100">
                                <p className="text-[10px] font-black text-blue-600 uppercase mb-3">Selected Date & Time</p>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <Calendar className="text-blue-600" size={20}/>
                                        <span className="font-bold">Saturday, Dec 25, 2023</span>
                                    </div>
                                    <span className="text-xs font-black bg-white px-2 py-1 rounded-lg border border-blue-100">8 Hours</span>
                                </div>
                            </div>
                            <div className="space-y-3">
                                <p className="text-[10px] font-black text-slate-400 uppercase">Added Facilities</p>
                                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 bg-slate-900 text-white rounded-lg flex items-center justify-center"><CreditCard size={14}/></div>
                                        <span className="text-sm font-bold">Pro Sound System</span>
                                    </div>
                                    <span className="text-xs font-black text-blue-600">+₦25,000</span>
                                </div>
                            </div>
                            <div className="pt-6 border-t border-slate-100 flex items-center justify-between">
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase">Total Price</p>
                                    <p className="text-3xl font-black text-slate-900 tracking-tighter">₦525,000</p>
                                </div>
                                <button className="px-8 py-4 bg-blue-600 text-white rounded-2xl font-black shadow-lg shadow-blue-100 active:scale-95 transition-all">
                                    Complete Payment
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="lg:w-1/2">
                    <h2 className="text-5xl font-black mb-8 leading-tight tracking-tighter">Booking <br/><span className="text-blue-500 italic">Made Effortless.</span></h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                        {[
                            { icon: ShieldCheck, title: "Secure Payments", desc: "Encrypted transactions for your peace of mind." },
                            { icon: Clock, title: "Instant Verification", desc: "No more waiting for callbacks. Book instantly." },
                            { icon: Star, title: "Multi-session", desc: "One-click recurring bookings for recurring events." },
                            { icon: Calendar, title: "Easy Rescheduling", desc: "Flexible tools to manage your event dates." }
                        ].map((item, i) => (
                            <div key={i} className="space-y-4">
                                <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center text-blue-500"><item.icon size={24}/></div>
                                <div>
                                    <h4 className="text-xl font-bold">{item.title}</h4>
                                    <p className="text-slate-400 leading-relaxed text-sm">{item.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
      </section>

      {/* Footer Branding */}
      <footer className="py-20 bg-white border-t border-slate-200">
         <div className="max-w-7xl mx-auto px-6 text-center">
            <h2 className="text-3xl font-black italic text-slate-900 mb-2">Gobo<span className="text-blue-600 not-italic">kin</span></h2>
            <p className="text-slate-400 font-bold uppercase text-xs tracking-[0.5em]">Find Your Space. Create Your Story.</p>
         </div>
      </footer>
    </div>
  );
};

export default CustomerMarketingShowcase;
