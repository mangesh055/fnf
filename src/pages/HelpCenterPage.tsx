import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HelpCircle, ChevronDown, MessageCircle, Phone } from 'lucide-react';
import { cn } from '../lib/utils';

const faqs = [
  {
    category: "For Students",
    questions: [
      {
        q: "How does the Digital Mess Attendance (QR) work?",
        a: "Navigate to your Student Dashboard and click 'Scan QR'. Point your camera at the Mess Owner's static QR code poster. The system will automatically verify your subscription and daily meal limit. Once validated, your meal count is deducted and the attendance is logged instantly."
      },
      {
        q: "What happens if my mess subscription expires?",
        a: "You will not be able to scan the QR code successfully. The scanner will notify you that you do not have an active subscription for that mess. You must contact the Mess Owner to renew your plan."
      },
      {
        q: "How does the Roommate finder work?",
        a: "You can create a Roommate Profile specifying your preferences. For privacy and safety, the system enforces gender-based filtering—you will only see potential roommates of the same gender. You can browse profiles and contact them directly."
      }
    ]
  },
  {
    category: "For Property & Mess Owners",
    questions: [
      {
        q: "How do I add a new property or mess listing?",
        a: "Log in to your respective Owner Dashboard and navigate to the 'Listings' or 'Manage Mess' section. Fill out the details, upload photos (handled securely via Cloudinary), and publish. Students can immediately see your listing in the search results."
      },
      {
        q: "How can I track student meal attendance?",
        a: "Your Mess Owner Dashboard includes an 'Attendance' tab. Every time a student scans your static QR code, their attendance is logged there in real-time. You can also track active subscriptions and remaining meal counts for all registered students."
      }
    ]
  }
];

export default function HelpCenterPage() {
  const [openFaq, setOpenFaq] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-12 pt-24">
      <div className="max-w-4xl mx-auto px-4">
        
        {/* Header */}
        <div className="text-center mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center justify-center w-16 h-16 bg-brand-500/10 text-brand-500 rounded-2xl mb-4"
          >
            <HelpCircle className="w-8 h-8" />
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-5xl font-display font-bold text-slate-900 dark:text-white mb-4"
          >
            How can we help?
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-lg text-slate-500 max-w-2xl mx-auto"
          >
            Find answers to common questions about FlatsNFood's smart housing and mess platform.
          </motion.p>
        </div>

        {/* FAQs */}
        <div className="space-y-8">
          {faqs.map((group, groupIdx) => (
            <motion.div 
              key={group.category}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + (groupIdx * 0.1) }}
            >
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">{group.category}</h2>
              <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
                {group.questions.map((faq, idx) => {
                  const isOpen = openFaq === faq.q;
                  return (
                    <div 
                      key={faq.q}
                      className={cn(
                        "border-b border-slate-200 dark:border-slate-800 last:border-0",
                        isOpen ? "bg-slate-50 dark:bg-slate-800/50" : ""
                      )}
                    >
                      <button
                        onClick={() => setOpenFaq(isOpen ? null : faq.q)}
                        className="w-full text-left px-6 py-4 flex items-center justify-between focus:outline-none"
                      >
                        <span className="font-medium text-slate-900 dark:text-white pr-4">{faq.q}</span>
                        <ChevronDown className={cn("w-5 h-5 text-slate-400 transition-transform", isOpen && "rotate-180")} />
                      </button>
                      <AnimatePresence>
                        {isOpen && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden"
                          >
                            <div className="px-6 pb-4 text-slate-600 dark:text-slate-300">
                              {faq.a}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Contact Support */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mt-12 bg-brand-500 rounded-2xl p-8 text-center text-white"
        >
          <h2 className="text-2xl font-bold mb-2">Still need help?</h2>
          <p className="text-brand-100 mb-6">Our support team is always ready to assist you with any platform issues.</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a href="mailto:support.flatsnfoods@gmail.com" className="btn-secondary w-full sm:w-auto flex items-center justify-center gap-2 border-white/20 hover:bg-white/10 text-white">
              <MessageCircle className="w-4 h-4" />
              Email Support
            </a>
          </div>
        </motion.div>

      </div>
    </div>
  );
}
