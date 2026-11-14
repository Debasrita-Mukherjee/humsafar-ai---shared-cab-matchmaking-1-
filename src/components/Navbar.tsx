import React, { useState } from 'react';
import { Car, Menu, X, User, ShieldCheck, LogOut } from 'lucide-react';

interface NavbarProps {
  activeSection: string;
  onSelectSection: (section: string) => void;
  onOpenOfferRide: () => void;
  onOpenMyBookings: () => void;
  onOpenAuthModal: () => void;
  currentUserAccount: { name: string; email: string; verified: boolean } | null;
  onLogout: () => void;
  confirmedBookingsCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeSection,
  onSelectSection,
  onOpenOfferRide,
  onOpenMyBookings,
  onOpenAuthModal,
  currentUserAccount,
  onLogout,
  confirmedBookingsCount,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleNavClick = (section: string) => {
    setMobileMenuOpen(false);
    onSelectSection(section);
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-8 h-16">
          {/* Left: Humsafar AI Logo & Brand Name */}
          <a
            href="#home"
            onClick={(e) => {
              e.preventDefault();
              handleNavClick('home');
            }}
            className="flex items-center gap-2.5 whitespace-nowrap shrink-0 group"
          >
            <span className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs group-hover:bg-blue-700 transition-colors">
              <Car className="w-5 h-5" />
            </span>
            <span className="text-lg font-extrabold tracking-tight text-slate-900 font-display">
              Humsafar AI
            </span>
          </a>

          {/* Right: Desktop Navigation Links + Primary Action */}
          <div className="hidden lg:flex items-center gap-7">
            <nav className="flex items-center gap-6 text-sm font-medium text-slate-600">
              <button
                type="button"
                onClick={() => handleNavClick('home')}
                className={`py-1 transition-colors whitespace-nowrap shrink-0 border-b-2 ${
                  activeSection === 'home'
                    ? 'text-blue-600 border-blue-600 font-semibold'
                    : 'border-transparent hover:text-blue-600'
                }`}
              >
                Home
              </button>
              <button
                type="button"
                onClick={() => handleNavClick('find-rides')}
                className={`py-1 transition-colors whitespace-nowrap shrink-0 border-b-2 ${
                  activeSection === 'find-rides'
                    ? 'text-blue-600 border-blue-600 font-semibold'
                    : 'border-transparent hover:text-blue-600'
                }`}
              >
                Find Rides
              </button>
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenOfferRide();
                }}
                className="py-1 border-b-2 border-transparent hover:text-blue-600 transition-colors whitespace-nowrap shrink-0"
              >
                Offer a Ride
              </button>
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenMyBookings();
                }}
                className="py-1 border-b-2 border-transparent hover:text-blue-600 transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5"
              >
                <span>My Bookings</span>
                {confirmedBookingsCount > 0 && (
                  <span className="text-xs font-mono font-bold text-blue-600">
                    ({confirmedBookingsCount})
                  </span>
                )}
              </button>
              <button
                type="button"
                onClick={() => handleNavClick('about-us')}
                className={`py-1 transition-colors whitespace-nowrap shrink-0 border-b-2 ${
                  activeSection === 'about-us'
                    ? 'text-blue-600 border-blue-600 font-semibold'
                    : 'border-transparent hover:text-blue-600'
                }`}
              >
                About Us
              </button>
            </nav>

            {currentUserAccount ? (
              <div className="flex items-center gap-2.5 pl-4 border-l border-slate-200 shrink-0">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-800">
                  <ShieldCheck className="w-4 h-4 text-blue-600" />
                  <span className="whitespace-nowrap">{currentUserAccount.name}</span>
                </div>
                <button
                  type="button"
                  onClick={onLogout}
                  title="Sign out"
                  className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={onOpenAuthModal}
                className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all shadow-xs whitespace-nowrap shrink-0"
              >
                <User className="w-3.5 h-3.5" />
                <span>Login / Sign Up</span>
              </button>
            )}
          </div>

          {/* Mobile Hamburger Button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle Menu"
            className="lg:hidden p-2 rounded-xl text-slate-700 hover:bg-slate-100 transition-colors"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-white border-t border-slate-200 px-4 py-4 space-y-2 shadow-lg">
          <button
            type="button"
            onClick={() => handleNavClick('home')}
            className="w-full text-left px-3 py-2.5 rounded-xl text-sm font-medium text-slate-800 hover:bg-blue-50 hover:text-blue-600"
          >
            Home
          </button>
          <button
            type="button"
            onClick={() => handleNavClick('find-rides')}
            className="w-full text-left px-3 py-2.5 rounded-xl text-sm font-medium text-slate-800 hover:bg-blue-50 hover:text-blue-600"
          >
            Find Rides
          </button>
          <button
            type="button"
            onClick={() => {
              setMobileMenuOpen(false);
              onOpenOfferRide();
            }}
            className="w-full text-left px-3 py-2.5 rounded-xl text-sm font-medium text-slate-800 hover:bg-blue-50 hover:text-blue-600"
          >
            Offer a Ride
          </button>
          <button
            type="button"
            onClick={() => {
              setMobileMenuOpen(false);
              onOpenMyBookings();
            }}
            className="w-full text-left px-3 py-2.5 rounded-xl text-sm font-medium text-slate-800 hover:bg-blue-50 hover:text-blue-600 flex items-center justify-between"
          >
            <span>My Bookings</span>
            {confirmedBookingsCount > 0 && (
              <span className="text-xs font-mono font-bold text-blue-600">
                {confirmedBookingsCount} active
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => handleNavClick('about-us')}
            className="w-full text-left px-3 py-2.5 rounded-xl text-sm font-medium text-slate-800 hover:bg-blue-50 hover:text-blue-600"
          >
            About Us
          </button>
          <div className="pt-2 border-t border-slate-100">
            {currentUserAccount ? (
              <div className="flex items-center justify-between px-3 py-2">
                <span className="text-sm font-semibold text-slate-900">{currentUserAccount.name}</span>
                <button
                  type="button"
                  onClick={() => {
                    onLogout();
                    setMobileMenuOpen(false);
                  }}
                  className="text-xs font-semibold text-blue-600"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenAuthModal();
                }}
                className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors"
              >
                Login / Sign Up
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
