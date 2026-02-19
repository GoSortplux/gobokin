'use client';

import { useState, useCallback, useEffect } from 'react';
import Image from 'next/image';
import api from '@/services/api';
import axios from 'axios';
import { isVideo } from '@/utils/media';
import { UploadCloud, X, CheckCircle, Video, Trash2 } from 'lucide-react';
import Swal from "@/utils/sweetalert";

interface MediaUploadProps {
  hallId: string;
  initialImages?: string[];
  initialVideos?: string[];
  onUploadSuccess: (mediaUrls: string[]) => void;
}

const MAX_IMAGES = 5;
const MAX_VIDEOS = 1;

const MediaUpload: React.FC<MediaUploadProps> = ({ hallId, initialImages = [], initialVideos = [], onUploadSuccess }) => {
  const [currentImages, setCurrentImages] = useState<string[]>(initialImages);
  const [currentVideos, setCurrentVideos] = useState<string[]>(initialVideos);
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [uploadProgress, setUploadProgress] = useState<Record<number, number>>({});
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Update internal state when initial props change (e.g. when opening modal for different venue)
  useEffect(() => {
    setCurrentImages(initialImages);
    setCurrentVideos(initialVideos);
  }, [initialImages, initialVideos]);

  const isVideoFile = useCallback((file: File) => file.type.startsWith('video/'), []);

  const handleFileChange = useCallback((selectedFiles: FileList | null) => {
    if (selectedFiles) {
      const selectedFilesArray = Array.from(selectedFiles);

      const newFiles: File[] = [];
      let skippedVideos = 0;
      let skippedImages = 0;

      let tempCurrentVideosCount = currentVideos.length + files.filter(f => isVideoFile(f)).length;
      let tempCurrentImagesCount = currentImages.length + files.filter(f => !isVideoFile(f)).length;

      selectedFilesArray.forEach(file => {
        if (isVideoFile(file)) {
          if (tempCurrentVideosCount < MAX_VIDEOS) {
            newFiles.push(file);
            tempCurrentVideosCount++;
          } else {
            skippedVideos++;
          }
        } else {
          if (tempCurrentImagesCount < MAX_IMAGES) {
            newFiles.push(file);
            tempCurrentImagesCount++;
          } else {
            skippedImages++;
          }
        }
      });

      if (skippedVideos > 0 || skippedImages > 0) {
        Swal.fire({
          icon: 'warning',
          title: 'Limit Reached',
          text: `You can only have up to ${MAX_IMAGES} images and ${MAX_VIDEOS} video. ${skippedImages > 0 ? skippedImages + ' images' : ''} ${skippedVideos > 0 ? 'and ' + skippedVideos + ' videos' : ''} were skipped.`,
        });
      }

      if (newFiles.length > 0) {
        setFiles((prevFiles) => [...prevFiles, ...newFiles]);
        const newPreviews = newFiles.map(file => URL.createObjectURL(file));
        setPreviews((prevPreviews) => [...prevPreviews, ...newPreviews]);
      }
    }
  }, [files, isVideoFile, currentImages.length, currentVideos.length]);

  const removeFile = (index: number) => {
    setFiles((prevFiles) => prevFiles.filter((_, i) => i !== index));
    setPreviews((prevPreviews) => {
      const newPreviews = prevPreviews.filter((_, i) => i !== index);
      // Revoke the object URL to free up memory
      URL.revokeObjectURL(previews[index]);
      return newPreviews;
    });
  };

  const onDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const onDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const onDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileChange(e.dataTransfer.files);
  }, [handleFileChange]);

  const handleDeleteMedia = async (url: string, type: 'image' | 'video') => {
    if (type === 'image' && currentImages.length <= 1) {
      Swal.toast.fire({
        icon: 'error',
        title: 'A venue must have at least one image.',
      });
      return;
    }

    const result = await Swal.destructive.fire({
      title: 'Are you sure?',
      text: `Do you want to delete this ${type}? This action cannot be undone.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete it!'
    });

    if (result.isConfirmed) {
      setIsDeleting(true);
      try {
        await api.delete(`/halls/${hallId}/media`, {
          data: { mediaUrl: url }
        });

        if (type === 'image') {
          setCurrentImages(prev => prev.filter(img => img !== url));
        } else {
          setCurrentVideos(prev => prev.filter(vid => vid !== url));
        }

        Swal.toast.fire({
          icon: 'success',
          title: `The ${type} has been deleted.`,
        });
      } catch (error) {
        console.error('Failed to delete media:', error);
        Swal.toast.fire({
          icon: 'error',
          title: error instanceof Error ? error.message : 'Something went wrong while deleting the media.',
        });
      } finally {
        setIsDeleting(false);
      }
    }
  };

  const handleUpload = async () => {
    if (files.length === 0) return;
    setIsUploading(true);
    setUploadSuccess(false);

    try {
      // Step 1 & 2: Get presigned URL and upload to R2 for each file in parallel
      const uploadPromises = files.map(async (file, index) => {
        try {
          // Step 1: Generate presigned URL
          const presignedResponse = await api.get('/halls/media/presigned-url', {
            params: {
              fileName: file.name,
              fileType: file.type,
            },
          });

          const { uploadUrl, publicUrl } = presignedResponse.data.data;

          // Step 2: Direct Binary PUT to R2
          // We use direct axios to avoid our API interceptors (Auth headers, BaseURL)
          await axios.put(uploadUrl, file, {
            headers: {
              'Content-Type': file.type,
            },
            onUploadProgress: (progressEvent) => {
              const percentCompleted = Math.round(
                (progressEvent.loaded * 100) / (progressEvent.total || file.size)
              );
              setUploadProgress((prev) => ({
                ...prev,
                [index]: percentCompleted,
              }));
            },
          });

          return { url: publicUrl, fileType: file.type };
        } catch (error) {
          console.error(`Failed to upload file ${file.name}:`, error);
          return null; // Resolve to null so we can filter failed uploads
        }
      });

      const mediaResults = await Promise.all(uploadPromises);
      const mediaForStep3 = mediaResults.filter((item): item is { url: string; fileType: string } => item !== null);

      if (mediaForStep3.length === 0) {
        throw new Error('All file uploads failed.');
      }

      // Step 3: Finalize media upload and initiate processing (Watermarking)
      const finalizeResponse = await api.post('/halls/media/upload', {
        media: mediaForStep3,
      });

      const uploadedUrls = finalizeResponse.data.data.urls;

      if (uploadedUrls && uploadedUrls.length > 0) {
        // Associate the processed URLs with the venue (Only if hallId is present)
        if (hallId) {
          const backendUploadPromises = uploadedUrls.map((url: string) => {
            const isVideoUrl = isVideo(url);
            const payload = isVideoUrl ? { videoUrl: url } : { imageUrl: url };
            return api.post(`/halls/${hallId}/media`, payload);
          });
          await Promise.all(backendUploadPromises);
        }

        // Update local state with new URLs
        const newImages = uploadedUrls.filter((url: string) => !isVideo(url));
        const newVideos = uploadedUrls.filter((url: string) => isVideo(url));

        setCurrentImages((prev) => [...prev, ...newImages]);
        setCurrentVideos((prev) => [...prev, ...newVideos]);

        onUploadSuccess(uploadedUrls);
        setUploadSuccess(true);
      } else {
        throw new Error('No files were processed successfully.');
      }

      // Clear fields on success
      setFiles([]);
      previews.forEach((p) => URL.revokeObjectURL(p));
      setPreviews([]);
      setUploadProgress({});
    } catch (error: unknown) {
      console.error('Upload failed:', error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Upload failed. Please check your connection and try again.';
      Swal.fire('Error', errorMessage, 'error');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="border border-gray-300 p-6 rounded-lg mt-6 bg-gray-50">
      <h3 className="text-xl font-semibold mb-4 text-gray-800">Venue Media</h3>

      {/* Existing Media Section */}
      {(currentImages.length > 0 || currentVideos.length > 0) && (
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <h4 className="font-semibold text-gray-700">Current Media:</h4>
            <div className="flex gap-4 text-xs font-medium text-gray-500">
               <span>Images: {currentImages.length}/{MAX_IMAGES}</span>
               <span>Videos: {currentVideos.length}/{MAX_VIDEOS}</span>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {currentVideos.map((url, index) => (
              <div key={`vid-${index}`} className="relative group h-32">
                <div className="relative w-full h-full bg-black rounded-md border border-gray-200 flex items-center justify-center overflow-hidden">
                  <video
                    src={url}
                    className="w-full h-full object-cover opacity-60"
                  />
                  <Video size={32} className="text-white absolute z-10" />
                </div>
                {!isDeleting && (
                  <button
                    type="button"
                    onClick={() => handleDeleteMedia(url, 'video')}
                    className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity z-30 shadow-md"
                    aria-label="Delete video"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            ))}
            {currentImages.map((url, index) => (
              <div key={`img-${index}`} className="relative group h-32">
                <Image
                  src={url}
                  alt={`venue image ${index}`}
                  fill
                  className="object-cover rounded-md border border-gray-200"
                  unoptimized
                />
                {!isDeleting && (
                  <button
                    type="button"
                    onClick={() => handleDeleteMedia(url, 'image')}
                    className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity z-30 shadow-md"
                    aria-label="Delete image"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <p className="text-sm text-gray-600 mb-4">
        {hallId ? 'Drag & drop files or click to select more media.' : 'Save the venue details before uploading images.'}
      </p>

      <div
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-all duration-300
                    ${isDragging ? 'border-primary bg-blue-50' : 'border-gray-300 bg-white'}
                    ${!hallId ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
      >
        <input
          type="file"
          multiple
          onChange={(e) => handleFileChange(e.target.files)}
          className="absolute inset-0 w-full h-full opacity-0"
          disabled={!hallId || (currentImages.length >= MAX_IMAGES && currentVideos.length >= MAX_VIDEOS)}
          accept="image/*,video/*"
        />
        <div className="flex flex-col items-center">
          <UploadCloud size={48} className="text-gray-400 mb-3" />
          <p className="font-semibold text-gray-700">Click to upload or drag and drop</p>
          <p className="text-xs text-gray-500">
            {MAX_IMAGES - currentImages.length} images and {MAX_VIDEOS - currentVideos.length} video remaining
          </p>
        </div>
      </div>

      {previews.length > 0 && (
        <div className="mt-6">
          <h4 className="font-semibold text-gray-800 mb-2">Selected for Upload:</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {previews.map((preview, index) => (
              <div key={`new-${index}`} className="relative group h-32">
                {files[index] && isVideoFile(files[index]) ? (
                  <div className="relative w-full h-full bg-black rounded-md border border-gray-200 flex items-center justify-center overflow-hidden">
                    <video
                      src={preview}
                      className="w-full h-full object-cover opacity-60"
                    />
                    <Video size={32} className="text-white absolute z-10" />
                  </div>
                ) : (
                  <Image
                    src={preview}
                    alt={`preview ${index}`}
                    fill
                    className="object-cover rounded-md border border-gray-200"
                    unoptimized
                  />
                )}

                {isUploading && uploadProgress[index] !== undefined && (
                  <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center rounded-md z-20">
                    <div className="w-4/5 bg-gray-200 rounded-full h-1.5 mb-1">
                      <div
                        className="bg-primary h-1.5 rounded-full transition-all duration-300"
                        style={{ width: `${uploadProgress[index]}%` }}
                      ></div>
                    </div>
                    <span className="text-[10px] text-white font-bold">{uploadProgress[index]}%</span>
                  </div>
                )}

                {!isUploading && (
                  <button
                    type="button"
                    onClick={() => removeFile(index)}
                    className="absolute top-1 right-1 bg-gray-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity z-30"
                    aria-label="Remove file"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-6 flex justify-end items-center space-x-4">
        {uploadSuccess && (
          <div className="flex items-center text-green-600">
            <CheckCircle size={20} className="mr-2"/>
            <span>Upload successful!</span>
          </div>
        )}
        <button
          type="button"
          onClick={handleUpload}
          disabled={isUploading || files.length === 0 || !hallId}
          className="px-6 py-2 font-semibold bg-primary text-white rounded-md disabled:bg-gray-400 hover:bg-primary-dark transition-colors"
        >
          {isUploading ? 'Uploading...' : `Upload ${files.length} File(s)`}
        </button>
      </div>
    </div>
  );
};

export default MediaUpload;
