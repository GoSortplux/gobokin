'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { useAuth, setSharedReturnUrl } from '@/context/AuthContext';
import {
  FileText,
  Download,
  ExternalLink,
  Search,
  FolderOpen,
  ArrowLeft,
  Calendar,
  MapPin,
  Lock,
  LogIn,
  FileIcon,
  VideoIcon,
  ImageIcon,
  Folder,
  ChevronRight,
  Globe
} from 'lucide-react';
import api from '@/services/api';
import CustomLoader from '@/components/CustomLoader';
import { Event, Registration } from '@/types';
import { format } from 'date-fns';

interface Resource {
  id: string;
  title: string;
  description: string;
  fileUrl: string;
  resourceFile?: string;
  externalLink?: string;
  fileName: string;
  fileType: string;
  mimeType: string;
  fileSize: number;
  guestCategoryIds: string[];
  createdAt: string;
}

export default function EventResourcesClient() {
  const { organizerSlug } = useParams();
  const eventId = organizerSlug; // organizerSlug holds the event ID UUID for this dynamic segment pattern
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [event, setEvent] = useState<Event | null>(null);
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<'all' | 'documents' | 'media' | 'links'>('all');

  // Fetch Event details and resources
  const fetchData = useCallback(async () => {
    if (!user || !eventId) return;

    try {
      setLoading(true);
      // 1. Fetch Event details
      const eventRes = await api.get(`/events/${eventId}`);
      const eventData = eventRes.data.data;
      setEvent(eventData);

      // 2. Check if current user is the organizer of the event
      const isOrganizer =
        user.id === eventData.organizerId ||
        user._id === eventData.organizerId ||
        (eventData.organizer && (user.id === eventData.organizer.mongoUserId || user._id === eventData.organizer.mongoUserId));

      const resourcesHeaders: Record<string, string> = {};

      if (isOrganizer) {
        resourcesHeaders['x-user-role'] = 'organizer';
      } else {
        resourcesHeaders['x-user-role'] = 'guest';
        // 3. Try to fetch user registrations to see if they are registered for this event
        try {
          const regRes = await api.get('/events/my-registrations');
          const registrations = regRes.data.data || regRes.data;
          if (Array.isArray(registrations)) {
            const matchReg = registrations.find((reg: Registration) => reg.event.id === eventId);
            if (matchReg && matchReg.ticket?.id) {
              resourcesHeaders['x-guest-ticket-types'] = matchReg.ticket.id;
            }
          }
        } catch (regError) {
          console.error('Failed to load guest registrations for ticket headers:', regError);
        }
      }

      // 4. Fetch the resources with proper headers
      const resourcesRes = await api.get(`/events/${eventId}/resources`, {
        headers: resourcesHeaders
      });

      if (resourcesRes.data.success) {
        setResources(resourcesRes.data.data);
      }
    } catch (error) {
      console.error('Failed to load resources page data:', error);
    } finally {
      setLoading(false);
    }
  }, [eventId, user]);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user, fetchData]);

  // Handle Login redirection
  const handleLoginRedirect = () => {
    if (typeof window !== 'undefined') {
      setSharedReturnUrl(window.location.pathname + window.location.search);
    }
    router.push('/auth/login');
  };

  // Check file categories
  const getResourceCategory = (resource: Resource): 'documents' | 'media' | 'links' => {
    const type = resource.fileType?.toLowerCase();
    if (type === 'link' || resource.externalLink) return 'links';
    if (type === 'image' || type === 'video') return 'media';
    return 'documents';
  };

  // Filter resources based on query and folder category
  const filteredResources = useMemo(() => {
    return resources.filter((res) => {
      // 1. Category Filter
      const cat = getResourceCategory(res);
      if (activeCategory !== 'all' && cat !== activeCategory) return false;

      // 2. Search Query Filter
      if (searchQuery.trim() !== '') {
        const query = searchQuery.toLowerCase();
        const matchesTitle = res.title?.toLowerCase().includes(query);
        const matchesDesc = res.description?.toLowerCase().includes(query);
        const matchesFileName = res.fileName?.toLowerCase().includes(query);
        return matchesTitle || matchesDesc || matchesFileName;
      }

      return true;
    });
  }, [resources, activeCategory, searchQuery]);

  const formatFileSize = (bytes: number) => {
    if (!bytes || bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (resource: Resource) => {
    const type = resource.fileType?.toLowerCase();
    if (type === 'image') return <ImageIcon className="w-8 h-8 text-blue-500" />;
    if (type === 'video') return <VideoIcon className="w-8 h-8 text-purple-500" />;
    if (type === 'link' || resource.externalLink) return <ExternalLink className="w-8 h-8 text-emerald-500" />;
    if (resource.fileName?.endsWith('.pdf')) return <FileIcon className="w-8 h-8 text-rose-500" />;
    return <FileText className="w-8 h-8 text-amber-500" />;
  };

  const getFileBadgeStyle = (resource: Resource) => {
    const type = resource.fileType?.toLowerCase();
    if (type === 'image') return 'bg-blue-50 text-blue-600 border border-blue-100';
    if (type === 'video') return 'bg-purple-50 text-purple-600 border border-purple-100';
    if (type === 'link' || resource.externalLink) return 'bg-emerald-50 text-emerald-600 border border-emerald-100';
    return 'bg-amber-50 text-amber-600 border border-amber-100';
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50/50">
        <CustomLoader />
      </div>
    );
  }

  // Not signed in guard
  if (!user) {
    return (
      <div className="min-h-screen pt-32 pb-24 bg-gray-50/50 flex items-center justify-center px-4">
        <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-2xl p-8 sm:p-12 max-w-md w-full text-center relative overflow-hidden">
          <div className="absolute -top-16 -right-16 w-48 h-48 bg-primary/5 rounded-full blur-3xl"></div>
          <div className="w-20 h-20 bg-primary/10 text-primary rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-inner">
            <Lock size={36} />
          </div>
          <h2 className="text-3xl font-black text-gray-900 tracking-tight mb-4">Access Restricted</h2>
          <p className="text-gray-500 font-medium leading-relaxed mb-8">
            This folder contains event-specific materials shared by the organizer. You need to sign in with your Gobokin account to view them.
          </p>
          <div className="space-y-4">
            <button
              onClick={handleLoginRedirect}
              className="w-full bg-primary text-white font-black py-4 rounded-2xl shadow-xl shadow-primary/20 hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-2.5 uppercase tracking-widest text-xs"
            >
              <LogIn size={16} />
              Sign In to View
            </button>
            <button
              onClick={() => router.push('/auth/register')}
              className="w-full bg-white border border-gray-200 text-gray-700 font-bold py-4 rounded-2xl hover:bg-gray-50 transition-all text-xs uppercase tracking-wider"
            >
              Create Account
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50/50">
        <div className="flex flex-col items-center gap-4">
          <CustomLoader size={40} />
          <p className="text-gray-400 text-sm font-semibold uppercase tracking-widest">Loading Resources Folder...</p>
        </div>
      </div>
    );
  }

  const eventUrl = event?.organizer?.slug && event?.slug
    ? `/events/${event.organizer.slug}/${event.slug}`
    : `/events/${eventId}`;

  return (
    <div className="min-h-screen bg-gray-50/50 pt-28 pb-24">
      <div className="container mx-auto px-4 max-w-5xl">

        {/* Navigation Breadcrumb & Back button */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <button
            onClick={() => router.push(eventUrl)}
            className="flex items-center gap-2 text-xs font-bold text-gray-500 hover:text-primary transition-colors group w-fit"
          >
            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
            Back to Event Details
          </button>
          <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-widest text-gray-400">
            <span>Marketplace</span>
            <ChevronRight size={12} className="text-gray-300" />
            <span className="truncate max-w-[120px]">{event?.title}</span>
            <ChevronRight size={12} className="text-gray-300" />
            <span className="text-gray-900">Resources</span>
          </div>
        </div>

        {/* Dynamic Premium Header Card */}
        {event && (
          <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-xl overflow-hidden mb-10 flex flex-col md:flex-row items-stretch">
            {/* Left Image Section */}
            <div className="relative md:w-1/3 min-h-[200px] bg-gray-100">
              {event.bannerUrl ? (
                <Image src={event.bannerUrl} alt={event.title} fill className="object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-primary/10">
                  <FolderOpen size={64} />
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t md:bg-gradient-to-r from-black/60 via-black/20 to-transparent" />
              <div className="absolute bottom-6 left-6 md:hidden">
                <span className="px-3 py-1 bg-white/90 backdrop-blur-sm rounded-lg text-[9px] font-bold text-primary uppercase tracking-wider">
                  {event.category}
                </span>
              </div>
            </div>

            {/* Right Information Section */}
            <div className="p-8 md:p-10 flex-1 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="hidden md:flex items-center gap-2">
                  <span className="px-3.5 py-1.5 bg-primary/10 rounded-xl text-[10px] font-bold text-primary uppercase tracking-widest">
                    {event.category}
                  </span>
                  {event.type && (
                    <span className="px-3.5 py-1.5 bg-gray-50 rounded-xl text-[10px] font-bold text-gray-500 uppercase tracking-widest border border-gray-100 flex items-center gap-1.5">
                      <Globe size={12} />
                      {event.type}
                    </span>
                  )}
                </div>
                <h1 className="text-2xl sm:text-4xl font-semibold text-gray-900 tracking-tight leading-tight">
                  {event.title}
                </h1>
                <p className="text-sm text-gray-500 font-medium leading-relaxed line-clamp-2">
                  {event.description}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-8 pt-6 border-t border-gray-50 text-gray-500 text-xs font-semibold">
                <div className="flex items-center gap-2.5">
                  <Calendar size={16} className="text-primary flex-shrink-0" />
                  <span>{format(new Date(event.startDate), 'PPP p')}</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <MapPin size={16} className="text-primary flex-shrink-0" />
                  <span className="truncate">{event.location || 'Virtual Event'}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Folder-Like Navigation & Search Dashboard */}
        <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-xl p-6 sm:p-10 space-y-8">

          {/* Header row with search and category tabs */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-gray-50">
            {/* Clean Custom Tabs mimicking system folders */}
            <div className="flex items-center gap-2 p-1 bg-gray-50 rounded-2xl border border-gray-100 w-full lg:w-auto overflow-x-auto no-scrollbar">
              {[
                { id: 'all' as const, label: 'All Materials', count: resources.length },
                { id: 'documents' as const, label: 'Documents', count: resources.filter(r => getResourceCategory(r) === 'documents').length },
                { id: 'media' as const, label: 'Media', count: resources.filter(r => getResourceCategory(r) === 'media').length },
                { id: 'links' as const, label: 'Links', count: resources.filter(r => getResourceCategory(r) === 'links').length }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveCategory(tab.id)}
                  className={`flex-1 sm:flex-none px-5 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-300 whitespace-nowrap flex items-center justify-center gap-2 ${
                    activeCategory === tab.id
                      ? 'bg-white text-primary shadow-sm border border-gray-100'
                      : 'text-gray-400 hover:text-gray-600'
                  }`}
                >
                  {tab.id === 'all' ? <Folder size={14} /> : null}
                  {tab.label}
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-bold ${
                    activeCategory === tab.id ? 'bg-primary/10 text-primary' : 'bg-gray-100 text-gray-400'
                  }`}>
                    {tab.count}
                  </span>
                </button>
              ))}
            </div>

            {/* Premium Interactive Search Input */}
            <div className="relative w-full lg:w-80">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                placeholder="Search materials..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-5 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-primary/20 transition-all font-medium text-sm text-gray-800 placeholder:text-gray-400 outline-none"
              />
            </div>
          </div>

          {/* Folder Content Display */}
          {filteredResources.length === 0 ? (
            <div className="py-20 text-center flex flex-col items-center max-w-sm mx-auto">
              <div className="w-20 h-20 bg-gray-50 rounded-3xl flex items-center justify-center mb-6 text-gray-300 shadow-inner">
                <FolderOpen size={36} />
              </div>
              <h3 className="text-xl font-black text-gray-900 mb-2">
                {searchQuery ? 'No matches found' : 'Folder is Empty'}
              </h3>
              <p className="text-gray-500 font-medium leading-relaxed">
                {searchQuery
                  ? 'We couldn\'t find any files matching your search. Try checking the spelling or using a different query.'
                  : 'The organizer hasn\'t uploaded any shared materials for this category yet.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredResources.map((resource) => {
                const targetUrl = resource.resourceFile || resource.fileUrl || resource.externalLink;
                const isExternal = resource.fileType?.toLowerCase() === 'link' || !!resource.externalLink;

                return (
                  <div
                    key={resource.id}
                    className="bg-white rounded-3xl border border-gray-100 p-6 flex flex-col justify-between hover:shadow-xl hover:shadow-primary/5 hover:border-primary/20 transition-all duration-300 group"
                  >
                    <div>
                      {/* File Icon & Meta Badge */}
                      <div className="flex items-center justify-between mb-6">
                        <div className="p-3 bg-gray-50 rounded-2xl group-hover:bg-primary/5 transition-colors">
                          {getFileIcon(resource)}
                        </div>
                        <span className={`text-[9px] font-bold px-2.5 py-1 rounded-lg uppercase tracking-wider ${getFileBadgeStyle(resource)}`}>
                          {isExternal ? 'URL Link' : resource.fileName?.split('.').pop() || 'File'}
                        </span>
                      </div>

                      {/* Title & Description */}
                      <h4 className="font-bold text-gray-900 text-base line-clamp-1 group-hover:text-primary transition-colors">
                        {resource.title}
                      </h4>
                      <p className="text-xs text-gray-500 font-medium leading-relaxed mt-2 line-clamp-2 h-10">
                        {resource.description || 'No description provided.'}
                      </p>
                    </div>

                    {/* Bottom row: file sizes & primary download link */}
                    <div className="mt-6 pt-5 border-t border-gray-50 flex items-center justify-between">
                      <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider space-y-0.5">
                        {resource.fileSize > 0 && <p>{formatFileSize(resource.fileSize)}</p>}
                        <p>{format(new Date(resource.createdAt), 'MMM d, yyyy')}</p>
                      </div>

                      <a
                        href={targetUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-4 py-2.5 bg-gray-50 group-hover:bg-primary group-hover:text-white rounded-xl text-xs font-bold text-gray-700 transition-all shadow-sm"
                      >
                        {isExternal ? (
                          <>
                            Open Link
                            <ExternalLink size={14} />
                          </>
                        ) : (
                          <>
                            Download
                            <Download size={14} />
                          </>
                        )}
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
