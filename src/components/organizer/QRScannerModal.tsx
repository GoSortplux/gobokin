"use client";
import React, { useEffect, useRef } from "react";
import { X, CameraOff } from "lucide-react";
import { Html5QrcodeScanner, Html5QrcodeScanType } from "html5-qrcode";

interface QRScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScanSuccess: (decodedText: string) => void;
}

const QRScannerModal: React.FC<QRScannerModalProps> = ({ isOpen, onClose, onScanSuccess }) => {
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);

  useEffect(() => {
    if (isOpen) {
      // Small delay to ensure the container is rendered
      const timer = setTimeout(() => {
        if (!scannerRef.current) {
          scannerRef.current = new Html5QrcodeScanner(
            "qr-reader",
            {
              fps: 10,
              qrbox: { width: 250, height: 250 },
              rememberLastUsedCamera: true,
              supportedScanTypes: [Html5QrcodeScanType.SCAN_TYPE_CAMERA],
            },
            /* verbose= */ false
          );

          scannerRef.current.render(
            (decodedText) => {
              onScanSuccess(decodedText);
              // We don't stop here, parent will close modal
            },
            (_errorMessage) => {
              // Ignore common errors like QR code not found
              // console.log(_errorMessage);
            }
          );
        }
      }, 300);

      return () => {
        clearTimeout(timer);
        if (scannerRef.current) {
          scannerRef.current.clear().catch((error) => {
            console.error("Failed to clear scanner", error);
          });
          scannerRef.current = null;
        }
      };
    }
  }, [isOpen, onScanSuccess]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div
        role="dialog"
        aria-modal="true"
        className="bg-white w-full max-w-lg rounded-[2rem] sm:rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col max-h-[85vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-primary p-5 sm:p-7 text-white relative shrink-0">
          <button
            onClick={onClose}
            className="absolute top-4 sm:top-5 right-4 sm:right-6 p-2 hover:bg-white/10 rounded-xl transition-colors"
          >
            <X className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
          <div className="flex items-center gap-3 sm:gap-4 mb-1 sm:mb-2">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/20 rounded-xl sm:rounded-2xl flex items-center justify-center backdrop-blur-md">
              <CameraOff className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight uppercase italic">
                QR <span className="text-white not-italic">Scanner</span>
              </h2>
              <p className="text-white/70 text-[11px] sm:text-sm font-medium">Center code in the box below</p>
            </div>
          </div>
        </div>

        <div className="p-5 sm:p-7 overflow-y-auto no-scrollbar flex-1">
          <div id="qr-reader" className="overflow-hidden rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50 min-h-[300px] flex items-center justify-center">
            <div className="flex flex-col items-center gap-3 text-gray-400">
              <CameraOff size={48} />
              <p className="font-bold">Initializing Camera...</p>
            </div>
          </div>

          <div className="mt-8 p-4 bg-primary/5 rounded-2xl border border-primary/10">
            <p className="text-xs text-primary font-black text-center uppercase tracking-[0.2em]">Scanning Tips</p>
            <p className="text-xs text-gray-600 text-center mt-2 leading-relaxed">
              Ensure adequate lighting and hold your device steady. The scanner will automatically detect the ticket code.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-5 sm:p-7 bg-gray-50/80 backdrop-blur-md border-t border-gray-100 shrink-0">
          <div className="flex justify-end gap-3 sm:gap-4">
            <button
              onClick={onClose}
              className="px-4 sm:px-6 py-2.5 sm:py-3 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-gray-900 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QRScannerModal;
