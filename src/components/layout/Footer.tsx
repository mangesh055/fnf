import React from 'react'
import { Link } from 'react-router-dom'
import { Mail, Phone } from 'lucide-react'
import logoImg from '../../assets/logo.jpeg'

const Instagram = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>
)

export default function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-400 pt-8 sm:pt-16 pb-6 sm:pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6 sm:gap-8 mb-8 sm:mb-12">
          {/* Brand */}
          <div className="col-span-2 lg:col-span-2">
            <div className="flex items-center gap-2 mb-2 sm:mb-4">
              <img 
                src={logoImg} 
                alt="FlatsNFood Logo" 
                className="w-7 h-7 sm:w-9 sm:h-9 object-contain rounded-lg sm:rounded-xl" 
              />
              <span className="text-lg sm:text-xl font-display font-bold text-white">
                FlatsN<span className="gradient-text">Food</span>
              </span>
            </div>
            <p className="text-xs sm:text-sm leading-relaxed mb-4 sm:mb-6 max-w-xs text-slate-400">
              India's smartest platform for student housing and digital mess management. 
              Find PGs, hostels, flats, and mess services near your college.
            </p>
            <div className="flex items-center gap-3">
              <a
                href="https://instagram.com"
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-slate-800 flex items-center justify-center hover:bg-brand-600 transition-colors group"
                title="Instagram"
              >
                <Instagram className="w-3.5 h-3.5 sm:w-4 sm:h-4 group-hover:text-white transition-colors" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="col-span-1">
            <h4 className="text-white text-xs sm:text-sm font-bold uppercase tracking-wider mb-2.5 sm:mb-4">Explore</h4>
            <ul className="space-y-2 sm:space-y-3 text-xs sm:text-sm">
              {[
                { label: 'Find Hostel', path: '/properties' },
                { label: 'Find Flat', path: '/properties' },
                { label: 'Mess Services', path: '/messes' },
                { label: 'Roommate Finder', path: '/roommates' },
              ].map(({ label, path }) => (
                <li key={label}>
                  <Link to={path} className="hover:text-white transition-colors">{label}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* For Owners */}
          <div className="col-span-1">
            <h4 className="text-white text-xs sm:text-sm font-bold uppercase tracking-wider mb-2.5 sm:mb-4">For Owners</h4>
            <ul className="space-y-2 sm:space-y-3 text-xs sm:text-sm">
              {[
                { label: 'List Property', path: '/auth' },
                { label: 'Register Mess', path: '/auth' },
                { label: 'Owner Dashboard', path: '/dashboard/owner' },
                { label: 'Analytics', path: '/dashboard/owner' },
              ].map(({ label, path }) => (
                <li key={label}>
                  <Link to={path} className="hover:text-white transition-colors">{label}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div className="col-span-2 md:col-span-2 lg:col-span-1 border-t border-slate-800/80 pt-4 sm:pt-0 sm:border-0">
            <h4 className="text-white text-xs sm:text-sm font-bold uppercase tracking-wider mb-2.5 sm:mb-4">Contact Us</h4>
            <ul className="space-y-2 sm:space-y-3 text-xs sm:text-sm">
              <li className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-brand-400 flex-shrink-0" />
                <a href="mailto:support.flatsnfoods@gmail.com" className="hover:text-white transition-colors text-xs sm:text-sm truncate">support.flatsnfoods@gmail.com</a>
              </li>
            </ul>
            <div className="mt-4 sm:mt-6">
              <h5 className="text-white text-xs font-semibold mb-2">Download App</h5>
              <div className="flex gap-2">
                <div onClick={() => alert('Coming soon!')} className="px-2.5 py-1.5 rounded-lg bg-slate-800 text-[11px] flex items-center gap-1.5 hover:bg-slate-700 cursor-pointer transition-colors">
                  <span>📱</span> App Store
                </div>
                <div onClick={() => alert('Coming soon!')} className="px-2.5 py-1.5 rounded-lg bg-slate-800 text-[11px] flex items-center gap-1.5 hover:bg-slate-700 cursor-pointer transition-colors">
                  <span>🤖</span> Play Store
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-800 pt-5 sm:pt-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs sm:text-sm text-center sm:text-left">
          <p>© 2026 FlatsNFood. Built with ❤️ for Indian students.</p>
          <div className="flex flex-wrap justify-center sm:justify-end items-center gap-x-4 gap-y-2 text-xs">
            <Link to="/feedback" className="hover:text-white transition-colors font-semibold text-brand-400 hover:text-brand-300">💬 Feedback</Link>
            <Link to="/privacy-policy" className="hover:text-white transition-colors">Privacy Policy</Link>
            <Link to="/terms-conditions" className="hover:text-white transition-colors">Terms & Conditions</Link>
            <Link to="/community-guidelines" className="hover:text-white transition-colors">Community Guidelines</Link>
            <Link to="/grievance-redressal" className="hover:text-white transition-colors">Grievance Redressal</Link>
            <Link to="/help" className="hover:text-white transition-colors">Help Center</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
