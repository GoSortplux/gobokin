
'use client';

import SharedBookingModal from '@/components/shared/SharedBookingModal';
import { useState } from 'react';

export default function TestModalPage() {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div className="p-8">
      <button
        onClick={() => setIsOpen(true)}
        className="px-4 py-2 bg-primary text-white rounded"
      >
        Open Modal
      </button>
      <SharedBookingModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onSubmit={(data, type) => console.log(data, type)}
        userRole="vendor"
      />
    </div>
  );
}
