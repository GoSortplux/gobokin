"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import api from "@/services/api";
import Swal from "@/utils/sweetalert";
import { translateError } from "@/utils/errors";
import { Briefcase, Globe, FileText, UserPlus, ArrowRight, CheckCircle2 } from "lucide-react";

const ApplyOrganizer = () => {
  const router = useRouter();
  const { user, updateToken } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    bio: "",
    website: "",
    experience: "",
    portfolio: "",
    references: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      Swal.showLoading();
      const response = await api.post("/events/become-an-organizer", {
        data: {
          experience: formData.experience,
          portfolio: formData.portfolio,
          references: formData.references.split(",").map((r) => r.trim()),
        },
        bio: formData.bio,
        website: formData.website,
      });

      await Swal.fire({
        title: "Application Submitted!",
        text: "Your application to become an event organizer has been sent for review.",
        icon: "success",
        confirmButtonColor: "#295FA7",
      });

      // Refresh token to see if role updated (might be manual approval but good to check)
      try {
        const refreshRes = await api.post('/auth/refresh-token');
        if (refreshRes.data?.data?.accessToken) {
          updateToken(refreshRes.data.data.accessToken);
        }
      } catch (e) {
        console.error("Token refresh failed", e);
      }

      router.push("/dashboard");
    } catch (error) {
      console.error("Failed to apply as organizer:", error);
      Swal.fire("Error", translateError(error), "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-24 pb-12 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="bg-primary p-8 text-white">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm">
                <UserPlus size={32} />
              </div>
              <h1 className="text-3xl font-black">Become an Event Organizer</h1>
            </div>
            <p className="text-blue-100 text-lg">
              Unlock the power to create events, manage ticketing, and track attendees all in one place.
            </p>
          </div>

          <div className="p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
                    <Globe size={16} className="text-primary" />
                    Website / Portfolio Link
                  </label>
                  <input
                    type="url"
                    name="website"
                    required
                    placeholder="https://yourwebsite.com"
                    className="w-full p-4 bg-gray-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-primary/20 transition-all"
                    value={formData.website}
                    onChange={handleChange}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
                    <Briefcase size={16} className="text-primary" />
                    Years of Experience
                  </label>
                  <input
                    type="text"
                    name="experience"
                    required
                    placeholder="e.g., 5 years in corporate events"
                    className="w-full p-4 bg-gray-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-primary/20 transition-all"
                    value={formData.experience}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
                  <FileText size={16} className="text-primary" />
                  Short Bio
                </label>
                <textarea
                  name="bio"
                  required
                  rows={3}
                  placeholder="Tell us about your event organizing background..."
                  className="w-full p-4 bg-gray-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-primary/20 transition-all"
                  value={formData.bio}
                  onChange={handleChange}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700">Portfolio Highlights</label>
                <textarea
                  name="portfolio"
                  required
                  rows={3}
                  placeholder="Briefly describe your most successful events..."
                  className="w-full p-4 bg-gray-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-primary/20 transition-all"
                  value={formData.portfolio}
                  onChange={handleChange}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700">References (Comma separated)</label>
                <input
                  type="text"
                  name="references"
                  required
                  placeholder="Company Name 1, Event Name 2, etc."
                  className="w-full p-4 bg-gray-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-primary/20 transition-all"
                  value={formData.references}
                  onChange={handleChange}
                />
              </div>

              <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100 space-y-4">
                <h3 className="font-bold text-primary flex items-center gap-2">
                  <CheckCircle2 size={18} />
                  Organizer Benefits
                </h3>
                <ul className="text-sm text-blue-800 space-y-2">
                  <li className="flex items-center gap-2">• Create multi-day events with sessions</li>
                  <li className="flex items-center gap-2">• Manage multiple ticket types (Free/Paid)</li>
                  <li className="flex items-center gap-2">• QR-based check-in and attendance tracking</li>
                  <li className="flex items-center gap-2">• Automated payouts and financial analytics</li>
                </ul>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-primary text-white font-black py-4 rounded-2xl hover:bg-opacity-90 transition-all shadow-xl shadow-primary/20 flex items-center justify-center gap-2 group disabled:opacity-50"
              >
                {loading ? "Submitting Application..." : "Submit Application"}
                <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApplyOrganizer;
