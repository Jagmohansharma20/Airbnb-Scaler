'use client';

import React, { useEffect, useState } from 'react';
import { CheckCircle2, Loader2, ShieldCheck } from 'lucide-react';

interface MockPaymentModalProps {
  isOpen: boolean;
  totalPrice: number;
  houseName: string;
  onSuccess: () => void;
}

export function MockPaymentModal({
  isOpen,
  totalPrice,
  houseName,
  onSuccess,
}: MockPaymentModalProps) {
  const [step, setStep] = useState<'processing' | 'success'>('processing');

  useEffect(() => {
    if (isOpen) {
      setStep('processing');
      const timer = setTimeout(() => {
        setStep('success');
        const finishTimer = setTimeout(() => {
          onSuccess();
        }, 1500);
        return () => clearTimeout(finishTimer);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [isOpen, onSuccess]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl flex flex-col items-center text-center animate-in zoom-in-95 duration-200">
        
        {step === 'processing' ? (
          <>
            <div className="w-16 h-16 rounded-full bg-rose-50 flex items-center justify-center text-[#FF385C] mb-6">
              <Loader2 className="w-9 h-9 animate-spin" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              Processing Payment...
            </h3>
            <p className="text-gray-500 text-sm mb-6">
              Securely charging <span className="font-semibold text-gray-900">&#8377;{totalPrice.toLocaleString()}</span> for your stay at <span className="font-semibold text-gray-900">{houseName}</span>.
            </p>
            <div className="flex items-center gap-2 text-xs text-gray-400 bg-gray-50 px-3 py-1.5 rounded-full">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <span>Mock 256-Bit Encrypted Transaction</span>
            </div>
          </>
        ) : (
          <>
            <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600 mb-6 scale-110 transition-transform duration-300">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">
              Payment Successful!
            </h3>
            <p className="text-emerald-700 font-medium text-sm mb-4">
              Booking confirmed. Redirecting to your bookings...
            </p>
            <div className="text-xs text-gray-400">
              Transaction ID: MOCK-{Math.random().toString(36).substring(2, 10).toUpperCase()}
            </div>
          </>
        )}

      </div>
    </div>
  );
}
