import React, { useState } from 'react';
import { Copy, Check, Phone, MapPin } from 'lucide-react';

interface DemoModalProps {
  isOpen: boolean;
  onClose: () => void;
  phone: string;
  name?: string;
  directionUrl?: string;
  address?: string;
}

const DemoModal: React.FC<DemoModalProps> = ({ isOpen, onClose, phone, name, directionUrl, address }) => {
  const [copiedPhone, setCopiedPhone] = useState(false);

  if (!isOpen) return null;

  const handleCopy = (text: string, setCopied: (v: boolean) => void) => {
    navigator.clipboard.writeText(text || '');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-[100] flex justify-center items-center px-4">
      <div className="absolute inset-0 bg-black/0 cursor-pointer" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        className="relative z-10 bg-white rounded-xl p-6 md:p-8 max-w-sm w-full shadow-2xl border border-gray-200"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-2xl font-bold mb-6 text-gray-800">Contact Details</h2>

        <div className="space-y-4 mb-8">
          {name && (
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Representative</label>
              <div className="p-3 rounded-lg bg-gray-50 border border-gray-100 text-gray-900 font-bold text-sm">
                {name}
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">Phone Number</label>
            <div className="flex items-center gap-2">
              <a
                href={`tel:${phone}`}
                className="flex-grow flex items-center gap-2 p-2 rounded-lg bg-gray-50 hover:bg-gray-100 text-blue-600 transition-colors border border-gray-100"
              >
                <Phone size={18} />
                <span className="font-semibold">{phone}</span>
              </a>
              <button
                onClick={() => handleCopy(phone, setCopiedPhone)}
                className="p-2.5 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-500 transition-all active:scale-95"
                title="Copy phone number"
              >
                {copiedPhone ? <Check size={18} className="text-green-500" /> : <Copy size={18} />}
              </button>
            </div>
          </div>

          {directionUrl && (
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Location</label>
              <div className="flex items-center gap-2">
                <a
                  href={directionUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-grow flex items-center gap-2 p-2 rounded-lg bg-gray-50 hover:bg-gray-100 text-red-600 transition-colors border border-gray-100"
                >
                  <MapPin size={18} />
                  <span className="font-semibold text-sm">Get Directions</span>
                </a>
              </div>
            </div>
          )}

          {address && (
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Office Address</label>
              <div className="p-3 rounded-lg bg-gray-50 border border-gray-100 text-gray-700 text-sm">
                {address}
              </div>
            </div>
          )}
        </div>

        <button
          onClick={onClose}
          className="w-full bg-[#295FA7] hover:bg-[#204a8a] text-white font-bold py-3 px-4 rounded-xl transition duration-300 shadow-md"
        >
          Close
        </button>
      </div>
    </div>
  );
};

export default DemoModal;
