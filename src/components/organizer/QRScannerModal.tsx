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
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-gray-900/80 backdrop-blur-sm"
        onClick={onClose}
      ></div>

      <div className="relative bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h3 className="text-xl font-black text-gray-900">QR Scanner</h3>
            <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">Center code in the box below</p>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 bg-gray-50 text-gray-500 rounded-full flex items-center justify-center hover:bg-gray-100 hover:text-gray-900 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6">
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

        <div className="p-6 bg-gray-50 flex justify-center">
           <button
             onClick={onClose}
             className="px-8 py-3 bg-white border border-gray-200 text-gray-900 font-black rounded-xl hover:bg-gray-100 transition-all text-sm uppercase tracking-widest"
           >
              Cancel
           </button>
        </div>
      </div>
    </div>
  );
};

export default QRScannerModal;
