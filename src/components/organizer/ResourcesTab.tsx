'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  FileText,
  Upload,
  Trash2,
  Bell,
  Plus,
  ExternalLink,
  Info,
  X,
  Loader2,
  FileIcon,
  VideoIcon,
  ImageIcon,
  UploadCloud
} from 'lucide-react';
import api from '@/services/api';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import Swal from 'sweetalert2';

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
  notifiedAt?: string;
  createdAt: string;
}

interface TicketType {
  id: string;
  name: string;
}

interface ResourcesTabProps {
  eventId: string;
  ticketTypes: TicketType[];
}

export const ResourcesTab: React.FC<ResourcesTabProps> = ({ eventId, ticketTypes }) => {
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedTicketIds, setSelectedTicketIds] = useState<string[]>([]);
  const [resourceType, setResourceType] = useState<'file' | 'link'>('file');
  const [externalLink, setExternalLink] = useState('');
  const [uploadedFile, setUploadedFile] = useState<{ url: string; name: string; size: number; type: string; mimeType: string } | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchResources = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get(`/events/${eventId}/resources`, {
        headers: { 'x-user-role': 'organizer' }
      });
      if (response.data.success) {
        setResources(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching resources:', error);
      toast.error('Failed to load resources');
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    fetchResources();
  }, [fetchResources]);

  const uploadMedia = async (file: File) => {
    try {
      // 1. Get presigned URL
      const presignedResponse = await api.get('/events/utils/upload-url', {
        params: { fileName: file.name, fileType: file.type }
      });
      const { uploadUrl, fileUrl, publicUrl } = presignedResponse.data.data;
      const finalUrl = publicUrl || fileUrl;

      // 2. Upload to R2
      await axios.put(uploadUrl, file, {
        headers: { 'Content-Type': file.type },
        onUploadProgress: (progressEvent) => {
          const percent = Math.round((progressEvent.loaded * 100) / (progressEvent.total || file.size));
          setUploadProgress(percent);
        }
      });

      return finalUrl;
    } catch (error) {
      console.error('Upload failed:', error);
      throw error;
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const url = await uploadMedia(file);
      setUploadedFile({
        url,
        name: file.name,
        size: file.size,
        type: file.type.startsWith('image') ? 'image' : file.type.startsWith('video') ? 'video' : 'document',
        mimeType: file.type
      });
      toast.success('File uploaded successfully');
    } catch (error) {
      console.error('File upload failed:', error);
      toast.error('Failed to upload file');
    } finally {
      setIsUploading(false);
    }
  };

  const handleCreateResource = async () => {
    if (!title || (resourceType === 'file' && !uploadedFile) || (resourceType === 'link' && !externalLink)) {
      toast.error(resourceType === 'file' ? 'Please provide a title and upload a file' : 'Please provide a title and a link');
      return;
    }

    try {
      setIsUploading(true);

      const payload = {
        title,
        description,
        resourceFile: resourceType === 'file' ? uploadedFile?.url : undefined,
        externalLink: resourceType === 'link' ? externalLink : undefined,
        fileName: resourceType === 'file' ? uploadedFile?.name : 'External Link',
        fileType: resourceType === 'file' ? uploadedFile?.type : 'link',
        mimeType: resourceType === 'file' ? uploadedFile?.mimeType : 'text/html',
        fileSize: resourceType === 'file' ? uploadedFile?.size : 0,
        guestCategoryIds: selectedTicketIds,
      };

      const response = await api.post(`/events/${eventId}/resources`, payload);

      if (response.data.success) {
        toast.success('Resource uploaded successfully');
        setIsModalOpen(false);
        resetForm();
        fetchResources();
      }
    } catch (error) {
      console.error('Error creating resource:', error);
      toast.error('Failed to upload resource metadata');
    } finally {
      setIsUploading(false);
    }
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setSelectedTicketIds([]);
    setUploadedFile(null);
    setExternalLink('');
    setResourceType('file');
  };

  const handleDeleteResource = async (resourceId: string) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: "This will permanently delete the resource.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete it!'
    });

    if (result.isConfirmed) {
      try {
        await api.delete(`/events/${eventId}/resources/${resourceId}`);
        toast.success('Resource deleted');
        fetchResources();
      } catch (error) {
        console.error('Error deleting resource:', error);
        toast.error('Failed to delete resource');
      }
    }
  };

  const handleNotifyGuests = async (resourceId?: string) => {
    const resourceIds = resourceId ? [resourceId] : resources.map(r => r.id);

    if (resourceIds.length === 0) {
      toast.error('No resources to notify about');
      return;
    }

    try {
      const response = await api.post(`/events/${eventId}/resources/notify`, { resourceIds });
      if (response.data.success) {
        toast.success('Guests notified successfully');
        fetchResources();
      }
    } catch (error) {
      console.error('Error notifying guests:', error);
      toast.error('Failed to send notifications');
    }
  };

  const toggleTicketSelection = (ticketId: string) => {
    setSelectedTicketIds(prev =>
      prev.includes(ticketId)
        ? prev.filter(id => id !== ticketId)
        : [...prev, ticketId]
    );
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'image': return <ImageIcon className="w-5 h-5 text-blue-500" />;
      case 'video': return <VideoIcon className="w-5 h-5 text-purple-500" />;
      case 'link': return <ExternalLink className="w-5 h-5 text-emerald-500" />;
      default: return <FileIcon className="w-5 h-5 text-gray-500" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-blue-50">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Event Resources</h2>
          <p className="text-sm text-gray-500 mt-1">Upload materials, documents, and media for your guests to access.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center justify-center gap-2 px-5 py-3 bg-primary text-white rounded-xl hover:bg-primary/90 transition-all font-semibold shadow-lg shadow-primary/20"
        >
          <Upload className="w-4 h-4" />
          Upload New Resource
        </button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-dashed border-gray-200">
          <Loader2 className="w-10 h-10 text-primary animate-spin mb-4" />
          <p className="text-gray-500">Loading resources...</p>
        </div>
      ) : resources.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-dashed border-gray-200">
          <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
            <FileText className="w-8 h-8 text-gray-300" />
          </div>
          <h3 className="text-lg font-bold text-gray-900">No resources yet</h3>
          <p className="text-gray-500 max-w-sm text-center mt-2">
            Share event brochures, maps, presentation slides, or media files with your guests.
          </p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="mt-6 flex items-center gap-2 px-6 py-2.5 bg-primary text-white rounded-xl hover:bg-primary/90 transition-all font-medium"
          >
            <Plus className="w-4 h-4" />
            Add First Resource
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {resources.map((resource) => (
            <div key={resource.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-xl hover:shadow-blue-500/5 transition-all group flex flex-col">
              <div className="p-5 flex-1">
                <div className="flex items-start justify-between mb-4">
                  <div className="p-2.5 bg-blue-50 rounded-xl group-hover:bg-primary/10 transition-colors">
                    {getFileIcon(resource.fileType)}
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleNotifyGuests(resource.id)}
                      className="p-2 text-gray-400 hover:text-amber-500 hover:bg-amber-50 rounded-lg transition-all"
                      title="Notify guests about this resource"
                    >
                      <Bell className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteResource(resource.id)}
                      className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                      title="Delete resource"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <h4 className="font-bold text-gray-900 line-clamp-1">{resource.title}</h4>
                <p className="text-sm text-gray-500 mt-1 line-clamp-2 h-10">{resource.description || 'No description provided.'}</p>

                <div className="mt-4 flex flex-wrap gap-1.5">
                  {resource.guestCategoryIds.length === 0 ? (
                    <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 text-[10px] font-bold rounded-md uppercase tracking-wider">All Guests</span>
                  ) : (
                    resource.guestCategoryIds.map(id => {
                      const ticket = ticketTypes.find(t => t.id === id);
                      return (
                        <span key={id} className="px-2 py-0.5 bg-blue-50 text-primary text-[10px] font-bold rounded-md uppercase tracking-wider">
                          {ticket?.name || 'Unknown Ticket'}
                        </span>
                      );
                    })
                  )}
                </div>
              </div>

              <div className="p-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
                <div className="text-[11px] text-gray-400 font-medium">
                  {resource.fileSize > 0 && <span>{formatFileSize(resource.fileSize)} • </span>}
                  {new Date(resource.createdAt).toLocaleDateString()}
                </div>
                <a
                  href={resource.resourceFile || resource.fileUrl || resource.externalLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-xs font-bold text-primary hover:underline"
                >
                  View Material
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => !isUploading && setIsModalOpen(false)} />

          <div className="relative bg-white w-full max-w-xl rounded-[32px] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
            <div className="p-8 border-b border-gray-100 flex items-center justify-between bg-white sticky top-0 z-10">
              <h3 className="text-2xl font-bold text-gray-900">Upload Resource</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                disabled={isUploading}
                className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-all disabled:opacity-50"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-8 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Resource Title</label>
                <input
                  type="text"
                  placeholder="e.g. Event Itinerary, Presentation Slides"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-primary/20 transition-all font-medium"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Description (Optional)</label>
                <textarea
                  placeholder="Briefly describe what this resource is about..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-primary/20 transition-all font-medium resize-none"
                />
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Resource Type</label>
                <div className="flex gap-4 p-1 bg-gray-50 rounded-2xl w-fit">
                  <button
                    onClick={() => setResourceType('file')}
                    className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                      resourceType === 'file' ? 'bg-white text-primary shadow-sm' : 'text-gray-400 hover:text-gray-600'
                    }`}
                  >
                    Upload File
                  </button>
                  <button
                    onClick={() => setResourceType('link')}
                    className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                      resourceType === 'link' ? 'bg-white text-primary shadow-sm' : 'text-gray-400 hover:text-gray-600'
                    }`}
                  >
                    External Link
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Target Audience</label>
                <div className="flex flex-wrap gap-2">
                  {ticketTypes.map((ticket) => (
                    <button
                      key={ticket.id}
                      onClick={() => toggleTicketSelection(ticket.id)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${
                        selectedTicketIds.includes(ticket.id)
                          ? 'bg-primary border-primary text-white shadow-md shadow-primary/20'
                          : 'bg-gray-50 border-gray-100 text-gray-600 hover:border-gray-300'
                      }`}
                    >
                      {ticket.name}
                    </button>
                  ))}
                </div>
                <p className="flex items-center gap-1.5 text-[10px] text-gray-400 ml-1">
                  <Info className="w-3 h-3" />
                  Only guests with these tickets will see this resource. Leave empty for all guests.
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">
                  {resourceType === 'file' ? 'File Material' : 'Resource Link'}
                </label>

                {resourceType === 'link' ? (
                  <div className="relative">
                    <ExternalLink className="absolute left-6 top-1/2 -translate-y-1/2 text-primary" size={18} />
                    <input
                      type="url"
                      placeholder="https://example.com/resource"
                      value={externalLink}
                      onChange={(e) => setExternalLink(e.target.value)}
                      className="w-full pl-14 pr-6 py-5 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-primary/20 transition-all font-medium"
                    />
                  </div>
                ) : !uploadedFile ? (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className={`relative border-2 border-dashed rounded-2xl p-10 text-center transition-all duration-300 cursor-pointer
                      ${isUploading ? 'border-primary bg-primary/5' : 'border-gray-200 hover:bg-gray-50 hover:border-primary/30'}
                    `}
                  >
                    <input
                      type="file"
                      ref={fileInputRef}
                      className="hidden"
                      onChange={handleFileChange}
                      disabled={isUploading}
                    />
                    {isUploading ? (
                      <div className="flex flex-col items-center gap-4">
                        <Loader2 className="w-10 h-10 text-primary animate-spin" />
                        <div className="w-full max-w-xs bg-gray-100 rounded-full h-2 overflow-hidden">
                          <div
                            className="bg-primary h-full transition-all duration-300"
                            style={{ width: `${uploadProgress}%` }}
                          />
                        </div>
                        <p className="text-xs font-bold text-primary uppercase tracking-widest">{uploadProgress}% Uploading...</p>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center">
                        <UploadCloud className="w-10 h-10 text-gray-300 mb-3" />
                        <p className="text-sm font-bold text-gray-900 uppercase tracking-widest">Select File</p>
                        <p className="text-[10px] text-gray-400 mt-1">PDF, DOC, Images, Videos up to 50MB</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-4 bg-blue-50 rounded-2xl border border-dashed border-primary/30 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-white rounded-lg">
                        <FileText className="w-5 h-5 text-primary" />
                      </div>
                      <div className="overflow-hidden">
                        <p className="text-sm font-bold text-gray-900 truncate max-w-[200px]">{uploadedFile.name}</p>
                        <p className="text-xs text-gray-500">Ready to upload</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setUploadedFile(null)}
                      className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="p-8 bg-white border-t border-gray-100">
              <button
                onClick={handleCreateResource}
                disabled={isUploading || !title || !uploadedFile}
                className="w-full py-4 bg-primary text-white rounded-2xl font-bold uppercase tracking-widest hover:bg-primary/90 transition-all shadow-xl shadow-primary/25 disabled:opacity-50 disabled:shadow-none flex items-center justify-center gap-2"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Processing...
                  </>
                ) : 'Create Resource Material'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
