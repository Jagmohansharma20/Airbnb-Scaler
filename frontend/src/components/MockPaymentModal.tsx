'use client';

import React, { useState, useEffect } from 'react';
import { 
  CheckCircle2, 
  Loader2, 
  ShieldCheck, 
  CreditCard, 
  Smartphone, 
  Building, 
  X, 
  Lock,
  ArrowRight
} from 'lucide-react';

interface MockPaymentModalProps {
  isOpen: boolean;
  totalPrice: number;
  houseName: string;
  nights?: number;
  startDate?: string;
  endDate?: string;
  guests?: number;
  onSuccess: () => void;
  onCancel: () => void;
}

export function MockPaymentModal({
  isOpen,
  totalPrice,
  houseName,
  nights = 1,
  startDate,
  endDate,
  guests = 1,
  onSuccess,
  onCancel,
}: MockPaymentModalProps) {
  const [method, setMethod] = useState<'upi' | 'card' | 'netbanking'>('upi');
  const [upiId, setUpiId] = useState('guest@okhdfcbank');
  const [state, setState] = useState<'idle' | 'processing' | 'success'>('idle');

  // Reset state whenever modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setState('idle');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handlePay = () => {
    setState('processing');
    
    const procTimer = setTimeout(() => {
      setState('success');
      const succTimer = setTimeout(() => {
        onSuccess();
      }, 1200);
      return () => clearTimeout(succTimer);
    }, 1800);

    return () => clearTimeout(procTimer);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 border border-gray-100 flex flex-col">
        
        {/* Razorpay-style Header */}
        <div className="bg-[#0b1a30] text-white p-6 relative">
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[#0c83ff] flex items-center justify-center text-white font-black text-sm shadow-md">
                ₹
              </div>
              <div>
                <span className="text-xs font-extrabold uppercase tracking-widest text-[#0c83ff]">
                  Razorpay Checkout
                </span>
                <p className="text-[10px] text-gray-400">Mock Payment Sandbox</p>
              </div>
            </div>

            {state === 'idle' && (
              <button
                type="button"
                onClick={onCancel}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-gray-300 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="pt-4 flex items-end justify-between">
            <div>
              <p className="text-xs text-gray-400 font-medium">Paying for stay at</p>
              <h3 className="text-lg font-bold text-white tracking-tight line-clamp-1">
                {houseName}
              </h3>
              {startDate && endDate && (
                <p className="text-[11px] text-gray-400 mt-0.5">
                  {nights} {nights === 1 ? 'night' : 'nights'} &middot; {guests} {guests === 1 ? 'guest' : 'guests'}
                </p>
              )}
            </div>

            <div className="text-right">
              <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">Total Amount</p>
              <p className="text-2xl font-black text-white">
                &#8377;{totalPrice.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        {/* Modal Body States */}
        <div className="p-6 space-y-6">
          
          {state === 'idle' && (
            <>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-3">
                  Select Payment Method
                </label>

                <div className="space-y-2.5">
                  
                  {/* UPI */}
                  <label
                    className={`flex items-center justify-between p-4 rounded-2xl border cursor-pointer transition-all ${
                      method === 'upi'
                        ? 'border-[#0c83ff] bg-blue-50/50 shadow-sm ring-1 ring-[#0c83ff]'
                        : 'border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-3.5">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        method === 'upi' ? 'bg-[#0c83ff] text-white' : 'bg-gray-100 text-gray-600'
                      }`}>
                        <Smartphone className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-900">UPI / QR</p>
                        <p className="text-xs text-gray-500">Google Pay, PhonePe, Paytm, BHIM</p>
                      </div>
                    </div>
                    <input
                      type="radio"
                      name="payment_method"
                      value="upi"
                      checked={method === 'upi'}
                      onChange={() => setMethod('upi')}
                      className="text-[#0c83ff] focus:ring-[#0c83ff]"
                    />
                  </label>

                  {method === 'upi' && (
                    <div className="pl-14 pr-2 -mt-1 pb-1">
                      <input
                        type="text"
                        value={upiId}
                        onChange={(e) => setUpiId(e.target.value)}
                        placeholder="yourname@upi"
                        className="w-full px-3.5 py-2 text-xs rounded-xl border border-gray-300 text-gray-800 focus:border-[#0c83ff] outline-none"
                      />
                    </div>
                  )}

                  {/* Card */}
                  <label
                    className={`flex items-center justify-between p-4 rounded-2xl border cursor-pointer transition-all ${
                      method === 'card'
                        ? 'border-[#0c83ff] bg-blue-50/50 shadow-sm ring-1 ring-[#0c83ff]'
                        : 'border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-3.5">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        method === 'card' ? 'bg-[#0c83ff] text-white' : 'bg-gray-100 text-gray-600'
                      }`}>
                        <CreditCard className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-900">Cards</p>
                        <p className="text-xs text-gray-500">Credit / Debit Card (Visa, MasterCard, RuPay)</p>
                      </div>
                    </div>
                    <input
                      type="radio"
                      name="payment_method"
                      value="card"
                      checked={method === 'card'}
                      onChange={() => setMethod('card')}
                      className="text-[#0c83ff] focus:ring-[#0c83ff]"
                    />
                  </label>

                  {/* Net Banking */}
                  <label
                    className={`flex items-center justify-between p-4 rounded-2xl border cursor-pointer transition-all ${
                      method === 'netbanking'
                        ? 'border-[#0c83ff] bg-blue-50/50 shadow-sm ring-1 ring-[#0c83ff]'
                        : 'border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-3.5">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        method === 'netbanking' ? 'bg-[#0c83ff] text-white' : 'bg-gray-100 text-gray-600'
                      }`}>
                        <Building className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-900">Net Banking</p>
                        <p className="text-xs text-gray-500">All major Indian banks supported</p>
                      </div>
                    </div>
                    <input
                      type="radio"
                      name="payment_method"
                      value="netbanking"
                      checked={method === 'netbanking'}
                      onChange={() => setMethod('netbanking')}
                      className="text-[#0c83ff] focus:ring-[#0c83ff]"
                    />
                  </label>

                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-2">
                <button
                  type="button"
                  onClick={handlePay}
                  className="w-full py-4 px-6 rounded-2xl bg-[#0c83ff] hover:bg-[#0070e0] active:scale-[0.98] text-white font-bold text-base shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2"
                >
                  <Lock className="w-4 h-4" />
                  <span>Pay &#8377;{totalPrice.toLocaleString()}</span>
                  <ArrowRight className="w-4 h-4 ml-1" />
                </button>

                <button
                  type="button"
                  onClick={onCancel}
                  className="w-full py-3 px-4 rounded-2xl text-gray-500 hover:text-gray-800 hover:bg-gray-50 text-xs font-semibold transition-colors"
                >
                  Cancel Payment
                </button>
              </div>

              <div className="flex items-center justify-center gap-2 text-[11px] text-gray-400 pt-1">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                <span>Simulated Secure 256-Bit SSL Encrypted Checkout</span>
              </div>
            </>
          )}

          {state === 'processing' && (
            <div className="py-8 flex flex-col items-center text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-blue-50 text-[#0c83ff] flex items-center justify-center">
                <Loader2 className="w-9 h-9 animate-spin" />
              </div>
              <div>
                <h4 className="text-xl font-bold text-gray-900">Processing Payment...</h4>
                <p className="text-xs text-gray-500 mt-1 max-w-xs">
                  Authorizing transaction of <strong className="text-gray-900">&#8377;{totalPrice.toLocaleString()}</strong>. Please do not refresh or close this window.
                </p>
              </div>
              <div className="text-[11px] text-gray-400 bg-gray-50 px-3.5 py-1.5 rounded-full flex items-center gap-1.5">
                <Lock className="w-3 h-3 text-[#0c83ff]" />
                <span>Connecting to Payment Gateway...</span>
              </div>
            </div>
          )}

          {state === 'success' && (
            <div className="py-8 flex flex-col items-center text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center scale-110 transition-transform duration-300">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <div>
                <h4 className="text-2xl font-bold text-gray-900">Payment Successful!</h4>
                <p className="text-xs text-emerald-700 font-semibold mt-1">
                  &#8377;{totalPrice.toLocaleString()} paid successfully.
                </p>
                <p className="text-xs text-gray-500 mt-2">
                  Confirming your stay reservation at {houseName}...
                </p>
              </div>
              <div className="text-[10px] text-gray-400 font-mono">
                MOCK-RZP-{Math.random().toString(36).substring(2, 10).toUpperCase()}
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
