import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, ChevronUp } from 'lucide-react'

interface LegalPageLayoutProps {
  title: string;
  lastUpdated: string;
  effectiveDate: string;
  version: string;
  children: React.ReactNode;
  sections: { id: string; title: string }[];
}

export default function LegalPageLayout({
  title,
  lastUpdated,
  effectiveDate,
  version,
  children,
  sections,
}: LegalPageLayoutProps) {
  const [activeSection, setActiveSection] = useState<string>('');
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // Handle scroll to top button visibility
      if (window.scrollY > 400) {
        setShowScrollTop(true);
      } else {
        setShowScrollTop(false);
      }

      // Handle active section highlighting
      const sectionElements = sections.map(s => document.getElementById(s.id));
      let currentActive = '';
      
      for (const el of sectionElements) {
        if (el) {
          const rect = el.getBoundingClientRect();
          // If the section top is above or near the middle of the viewport
          if (rect.top <= window.innerHeight / 2) {
            currentActive = el.id;
          }
        }
      }
      
      if (currentActive) {
        setActiveSection(currentActive);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [sections]);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const scrollToSection = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    const element = document.getElementById(id);
    if (element) {
      // Adjust offset for navbar if needed
      const y = element.getBoundingClientRect().top + window.scrollY - 100;
      window.scrollTo({ top: y, behavior: 'smooth' });
      setActiveSection(id);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-20">
      {/* Header Gradient */}
      <div className="bg-gradient-to-b from-brand-900 via-brand-800 to-slate-900 pt-16 pb-32 px-6">
        <div className="max-w-6xl mx-auto">
          <Link to="/" className="inline-flex items-center gap-2 text-brand-200 hover:text-white mb-8 transition-colors text-sm font-medium">
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center md:text-left"
          >
            <h1 className="text-4xl md:text-5xl font-display font-bold text-white mb-4">
              {title}
            </h1>
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-sm text-brand-200">
              <span className="flex items-center gap-1">
                <strong>Last Updated:</strong> {lastUpdated}
              </span>
              <span className="hidden sm:inline">•</span>
              <span className="flex items-center gap-1">
                <strong>Effective Date:</strong> {effectiveDate}
              </span>
              <span className="hidden sm:inline">•</span>
              <span className="flex items-center gap-1">
                <strong>Version:</strong> {version}
              </span>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-6xl mx-auto px-6 -mt-20">
        <div className="flex flex-col lg:flex-row gap-8">
          
          {/* Sidebar Navigation */}
          <div className="hidden lg:block w-72 flex-shrink-0">
            <div className="sticky top-24 bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Contents</h3>
              <nav className="space-y-1">
                {sections.map((section) => (
                  <a
                    key={section.id}
                    href={`#${section.id}`}
                    onClick={(e) => scrollToSection(e, section.id)}
                    className={`block py-2 px-3 rounded-lg text-sm transition-all duration-200 ${
                      activeSection === section.id
                        ? 'bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-400 font-semibold'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                    }`}
                  >
                    {section.title}
                  </a>
                ))}
              </nav>
            </div>
          </div>

          {/* Document Content */}
          <div className="flex-1 min-w-0">
            <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 p-8 md:p-12 max-w-none 
              [&_h2]:font-display [&_h2]:font-bold [&_h2]:text-2xl [&_h2]:mb-6 [&_h2]:mt-12 [&_h2]:pb-2 [&_h2]:border-b [&_h2]:border-slate-100 dark:[&_h2]:border-slate-800 [&_h2]:text-slate-900 dark:[&_h2]:text-white first:[&_h2]:mt-0
              [&_h3]:font-display [&_h3]:font-bold [&_h3]:text-lg [&_h3]:mt-8 [&_h3]:mb-4 [&_h3]:text-slate-800 dark:[&_h3]:text-slate-200
              [&_p]:mb-5 [&_p]:text-slate-600 dark:[&_p]:text-slate-400 [&_p]:leading-relaxed
              [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:mb-6 [&_ul]:space-y-2 [&_ul]:text-slate-600 dark:[&_ul]:text-slate-400
              [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:mb-6 [&_ol]:space-y-2 [&_ol]:text-slate-600 dark:[&_ol]:text-slate-400
              [&_strong]:text-slate-900 dark:[&_strong]:text-white [&_strong]:font-semibold
              [&_a]:text-brand-600 dark:[&_a]:text-brand-400 hover:[&_a]:text-brand-700 hover:[&_a]:underline
              [&_table]:w-full [&_table]:mb-6 [&_table]:border-collapse
              [&_th]:bg-slate-50 dark:[&_th]:bg-slate-800/50 [&_th]:p-4 [&_th]:text-left [&_th]:font-semibold [&_th]:text-slate-900 dark:[&_th]:text-white
              [&_td]:p-4 [&_td]:border-b [&_td]:border-slate-100 dark:[&_td]:border-slate-800 [&_td]:text-slate-600 dark:[&_td]:text-slate-400
              ">
              {children}
            </div>
          </div>

        </div>
      </div>

      {/* Scroll to top button */}
      <motion.button
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ 
          opacity: showScrollTop ? 1 : 0, 
          scale: showScrollTop ? 1 : 0.8,
          pointerEvents: showScrollTop ? 'auto' : 'none'
        }}
        onClick={scrollToTop}
        className="fixed bottom-8 right-8 w-12 h-12 bg-white dark:bg-slate-800 rounded-full shadow-lg border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:text-brand-600 dark:hover:text-brand-400 transition-colors z-50"
      >
        <ChevronUp className="w-6 h-6" />
      </motion.button>
    </div>
  )
}
