"use client";
import React, { useState, useEffect } from "react";
import { X, Globe, Instagram, Twitter, Linkedin, Facebook, Mail, Info } from "lucide-react";
import api from "@/services/api";
import CustomLoader from "@/components/CustomLoader";
import { Organizer } from "@/types";

interface PublicOrganizerProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  slug: string;
}

const PublicOrganizerProfileModal = ({ isOpen, onClose, slug }: PublicOrganizerProfileModalProps) => {
  const [organizer, setOrganizer] = useState<Organizer | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrganizer = async () => {
      if (!isOpen || !slug) return;

      try {
        setLoading(true);
        setError(null);
        const response = await api.get(`/events/o/${slug}`);
        // The API might return the organizer directly in data or nested
        const data = response.data.data || response.data;
        setOrganizer(data);
      } catch (err) {
        console.error("Failed to fetch organizer profile:", err);
        setError("Could not load organizer profile. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchOrganizer();
  }, [isOpen, slug]);

  if (!isOpen) return null;

  const renderSocialIcon = (platform: string, url: string) => {
    const iconSize = 20;
    const commonClasses = "p-3 bg-gray-50 rounded-2xl text-gray-400 hover:text-primary hover:bg-primary/5 transition-all";

    let Icon = Globe;
    if (platform.toLowerCase().includes('instagram')) Icon = Instagram;
    else if (platform.toLowerCase().includes('twitter') || platform.toLowerCase().includes('x.com')) Icon = Twitter;
    else if (platform.toLowerCase().includes('linkedin')) Icon = Linkedin;
    else if (platform.toLowerCase().includes('facebook')) Icon = Facebook;

    return (
      <a
        key={platform}
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className={commonClasses}
        title={platform}
      >
        <Icon size={iconSize} />
      </a>
    );
  };

  return (
    <div
      className="fixed inset-0 z-[110] flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        className="bg-white w-full max-w-xl rounded-[2rem] sm:rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col max-h-[85vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header/Banner Area */}
        <div className="h-32 bg-gradient-to-r from-primary/20 via-primary/10 to-transparent relative shrink-0">
          <button
            onClick={onClose}
            className="absolute top-4 sm:top-6 right-4 sm:right-6 p-2 bg-white/80 backdrop-blur-md hover:bg-white shadow-sm rounded-xl text-gray-400 hover:text-gray-900 transition-all z-10"
          >
            <X size={20} />
          </button>
        </div>

        <div className="px-5 sm:px-8 pb-10 -mt-12 relative overflow-y-auto no-scrollbar flex-1">
          {loading ? (
            <div className="py-20 flex justify-center">
              <CustomLoader />
            </div>
          ) : error ? (
            <div className="py-20 text-center space-y-4">
              <div className="w-16 h-16 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mx-auto">
                <Info size={32} />
              </div>
              <p className="text-gray-600 font-medium">{error}</p>
              <button
                onClick={onClose}
                className="px-6 py-2 bg-gray-100 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-200 transition-all"
              >
                Close
              </button>
            </div>
          ) : organizer ? (
            <div className="space-y-8">
              {/* Profile Info */}
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="w-24 h-24 bg-white rounded-3xl flex items-center justify-center text-primary text-3xl font-black shadow-xl border-4 border-white">
                  {organizer.userProfile?.fullName?.[0] || 'O'}
                </div>

                <div className="space-y-1">
                  <h3 className="text-2xl font-black text-gray-900 tracking-tight">
                    {organizer.userProfile?.fullName || "Verified Organizer"}
                  </h3>
                  <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">
                    Verified Organizer
                  </p>
                </div>
              </div>

              {/* Bio Section */}
              <div className="space-y-3">
                <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">About the Organizer</h4>
                <div className="bg-gray-50 p-6 rounded-[2rem] text-gray-600 text-sm font-medium leading-relaxed">
                  {organizer.bio || "No biography provided."}
                </div>
              </div>

              {/* Contact & Socials */}
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {organizer.website && (
                    <a
                      href={organizer.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-4 bg-gray-50 rounded-2xl hover:bg-white hover:shadow-md border border-transparent hover:border-primary/10 transition-all group"
                    >
                      <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-primary shadow-sm group-hover:scale-110 transition-transform">
                        <Globe size={18} />
                      </div>
                      <div className="overflow-hidden">
                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Website</p>
                        <p className="text-sm font-bold text-gray-900 truncate">{organizer.website.replace(/^https?:\/\//, '')}</p>
                      </div>
                    </a>
                  )}
                  {organizer.userProfile?.email && (
                    <a
                      href={`mailto:${organizer.userProfile.email}`}
                      className="flex items-center gap-3 p-4 bg-gray-50 rounded-2xl hover:bg-white hover:shadow-md border border-transparent hover:border-primary/10 transition-all group"
                    >
                      <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-primary shadow-sm group-hover:scale-110 transition-transform">
                        <Mail size={18} />
                      </div>
                      <div className="overflow-hidden">
                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Email</p>
                        <p className="text-sm font-bold text-gray-900 truncate">{organizer.userProfile.email}</p>
                      </div>
                    </a>
                  )}
                </div>

                {organizer.socialLinks && Object.keys(organizer.socialLinks).length > 0 && (
                  <div className="space-y-3">
                    <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Social Presence</h4>
                    <div className="flex flex-wrap gap-3">
                      {Object.entries(organizer.socialLinks).map(([platform, url]) =>
                        url ? renderSocialIcon(platform, url) : null
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Action */}
              <div className="pt-4">
                <button
                  onClick={onClose}
                  className="w-full py-5 bg-gray-900 text-white font-black rounded-2xl hover:bg-gray-800 transition-all shadow-xl shadow-gray-900/10 uppercase tracking-widest text-xs"
                >
                  Close Profile
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default PublicOrganizerProfileModal;
