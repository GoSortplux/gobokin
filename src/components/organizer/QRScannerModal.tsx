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
              qrbox: { width: 350, height: 350 },
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
        className="bg-white w-full h-full sm:h-auto sm:max-h-[90vh] sm:max-w-2xl sm:rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-primary p-4 sm:p-6 text-white relative shrink-0">
          <button
            onClick={onClose}
            className="absolute top-3 sm:top-5 right-3 sm:right-6 p-2 hover:bg-white/10 rounded-xl transition-colors"
          >
            <X className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
          <div className="flex items-center gap-3 sm:gap-4">
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

        <div className="p-4 sm:p-6 overflow-y-auto no-scrollbar flex-1 flex flex-col">
          <style jsx global>{`
            #qr-reader {
              border: none !important;
              display: flex !important;
              flex-direction: column !important;
            }
            #qr-reader__scan_region {
              order: 2 !important;
              flex: 1 !important;
              display: flex !important;
              justify-content: center !important;
              align-items: center !important;
              min-height: 0 !important;
            }
            #qr-reader__scan_region video {
              width: 100% !important;
              height: 100% !important;
              object-fit: cover !important;
              border-radius: 1rem;
            }
            #qr-reader__dashboard {
              order: 1 !important;
              padding: 1rem !important;
              width: 100% !important;
              background: white !important;
              z-index: 10 !important;
            }
            #qr-reader__dashboard_section_csr button {
              padding: 10px 20px !important;
              background-color: #000 !important;
              color: white !important;
              border-radius: 12px !important;
              border: none !important;
              font-weight: bold !important;
              text-transform: uppercase !important;
              font-size: 12px !important;
              letter-spacing: 0.05em !important;
              transition: all 0.2s !important;
            }
            #qr-reader__dashboard_section_csr button:hover {
              opacity: 0.8 !important;
              transform: translateY(-1px) !important;
            }
          `}</style>
          <div
            id="qr-reader"
            className="flex-1 overflow-hidden rounded-2xl bg-gray-50 min-h-[400px] sm:min-h-[500px] flex items-center justify-center relative"
          >
            <div className="flex flex-col items-center gap-3 text-gray-400">
              <CameraOff size={48} />
              <p className="font-bold">Initializing Camera...</p>
            </div>
          </div>

          <div className="mt-6 p-4 bg-primary/5 rounded-2xl border border-primary/10 shrink-0">
            <p className="text-xs text-primary font-black text-center uppercase tracking-[0.2em]">Scanning Tips</p>
            <p className="text-xs text-gray-600 text-center mt-1.5 leading-relaxed">
              Ensure adequate lighting and hold your device steady. The scanner will automatically detect the ticket code.
            </p>
          </div>
        </div>

        {/* Footer - Only show on desktop or larger screens to save space on mobile */}
        <div className="hidden sm:block p-5 sm:p-6 bg-gray-50/80 backdrop-blur-md border-t border-gray-100 shrink-0">
          <div className="flex justify-end gap-3 sm:gap-4">
            <button
              onClick={onClose}
              className="px-4 sm:px-6 py-2.5 sm:py-3 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-gray-900 transition-colors"
            >
              Close Scanner
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QRScannerModal;
