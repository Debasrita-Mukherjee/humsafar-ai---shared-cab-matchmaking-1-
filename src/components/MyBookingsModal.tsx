import React from 'react';
import { X, Ticket, MapPin, Clock, ArrowRight, Trash2, QrCode } from 'lucide-react';
import { PoolMatchResult } from '../types';

export interface ConfirmedBookingRecord {
  bookingId: string;
  cabId?: string;
  title: string;
  pickup: string;
  destination: string;
  departureTime: string;
  farePaid: number;
  vehicleName: string;
  vehicleNumber: string;
  pinCode: string;
  matchSnapshot: PoolMatchResult;
}

interface MyBookingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookings: ConfirmedBookingRecord[];
  onViewBoardingPass: (booking: ConfirmedBookingRecord) => void;
  onCancelBooking: (bookingId: string) => void;
}

export const MyBookingsModal: React.FC<MyBookingsModalProps> = ({
  isOpen,
  onClose,
  bookings,
  onViewBoardingPass,
  onCancelBooking,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/35 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-xl w-full p-6 sm:p-7 border border-slate-200 shadow-2xl my-8 relative">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close My Bookings"
          className="absolute top-5 right-5 text-slate-400 hover:text-slate-700 p-1.5 rounded-xl hover:bg-slate-100"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100">
          <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center shrink-0">
            <Ticket className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900 font-display">
              My Shared Cab Bookings
            </h3>
            <p className="text-xs text-slate-500">
              Active passes, boarding PINs, and scheduled Kolkata shared rides
            </p>
          </div>
        </div>

        <div className="mt-5 space-y-3 max-h-[60vh] overflow-y-auto">
          {bookings.length === 0 ? (
            <div className="p-8 rounded-2xl bg-slate-50 border border-slate-200 text-center space-y-2">
              <p className="text-sm font-bold text-slate-900">No confirmed rides yet</p>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Search for a shared cab along Kolkata Airport, Howrah, Sealdah, or Salt Lake corridors and click &ldquo;Book Shared Cab&rdquo; to generate your boarding pass.
              </p>
            </div>
          ) : (
            bookings.map((booking) => (
              <div
                key={booking.bookingId}
                className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <span className="font-mono font-bold text-blue-600">{booking.bookingId}</span>
                      <span aria-hidden="true">·</span>
                      <span>{booking.vehicleName}</span>
                    </div>
                    <h4 className="text-sm font-bold text-slate-900 mt-0.5 flex items-center gap-1.5 flex-wrap">
                      <MapPin className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                      <span>{booking.pickup}</span>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{booking.destination}</span>
                    </h4>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block">
                      Pooled Fare
                    </span>
                    <span className="text-base font-extrabold font-mono text-slate-900 tabular-nums">
                      ₹{booking.farePaid}
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-200/80 text-xs">
                  <div className="flex items-center gap-3 text-slate-600">
                    <span className="flex items-center gap-1 font-mono tabular-nums">
                      <Clock className="w-3.5 h-3.5 text-blue-600" />
                      {booking.departureTime}
                    </span>
                    <span className="font-mono font-semibold text-slate-800">
                      PIN: {booking.pinCode}
                    </span>
                    <span className="font-mono text-slate-500">{booking.vehicleNumber}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => onViewBoardingPass(booking)}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors flex items-center gap-1.5"
                    >
                      <QrCode className="w-3.5 h-3.5" />
                      <span>Boarding Pass</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onCancelBooking(booking.bookingId)}
                      aria-label="Cancel booking"
                      className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
