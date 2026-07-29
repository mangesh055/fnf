import React from 'react'
import { Link } from 'react-router-dom'
import LegalPageLayout from '../components/layout/LegalPageLayout'

export default function PrivacyPolicyPage() {
  const sections = [
    { id: 'introduction', title: '1. Introduction' },
    { id: 'definitions', title: '2. Definitions' },
    { id: 'data-we-collect', title: '3. Data We Collect' },
    { id: 'purpose-and-lawful-basis', title: '4. Purpose & Lawful Basis' },
    { id: 'consent', title: '5. Consent' },
    { id: 'how-we-use', title: '6. How We Use Your Data' },
    { id: 'data-sharing', title: '7. Data Sharing & Disclosure' },
    { id: 'data-retention', title: '8. Data Retention' },
    { id: 'data-security', title: '9. Data Security' },
    { id: 'your-rights', title: '10. Your Rights' },
    { id: 'cookies', title: '11. Cookies' },
    { id: 'third-party-links', title: '12. Third-Party Links' },
    { id: 'changes', title: '13. Changes to this Policy' },

    { id: 'governing-law', title: '14. Governing Law' },

  ]

  return (
    <LegalPageLayout
      title="Privacy Policy"
      lastUpdated="20 July 2026"
      effectiveDate="20 July 2026"
      version="1.0"
      sections={sections}
    >
      <section id="introduction">
        <h2>1. INTRODUCTION</h2>
        <p>FlatsNFood ("we," "us," "our," or the "Platform") is operated by [Your Registered Entity Name] (CIN: [___]), a company incorporated under the Companies Act, 2013, having its registered office at [Your Registered Address, City, State – Pincode, India].</p>
        <p>This Privacy Policy describes how we collect, use, store, process, transfer, disclose, and protect personal data of individuals ("you," "your," or "Data Principal") who access or use our website, mobile application, and associated services (the "Services").</p>
        <p>This Policy is published in compliance with:</p>
        <ul>
          <li>The <strong>Digital Personal Data Protection Act, 2023</strong> (DPDP Act)</li>
          <li>The <strong>Information Technology Act, 2000</strong> (IT Act), including the SPDI Rules, 2011</li>
          <li>The <strong>Consumer Protection (E-Commerce) Rules, 2020</strong>, as applicable</li>
        </ul>
        <p>By using the Platform, you acknowledge that you have read and agree to this Privacy Policy. If you do not agree, please do not use our Services.</p>
      </section>

      <section id="definitions">
        <h2>2. DEFINITIONS</h2>
        <ul>
          <li><strong>"Data Principal"</strong> — the individual to whom personal data relates (DPDP Act, 2023).</li>
          <li><strong>"Data Fiduciary"</strong> — FlatsNFood, which determines the purpose and means of processing.</li>
          <li><strong>"Personal Data"</strong> — any data about an identifiable individual.</li>
          <li><strong>"Processing"</strong> — collection, storage, use, sharing, disclosure, erasure, or destruction of personal data.</li>
          <li><strong>"SPDI"</strong> — Sensitive Personal Data or Information as defined under the SPDI Rules, 2011.</li>
          <li><strong>"Services"</strong> — all features on the Platform: property listings, mess discovery/subscriptions, roommate matching, community marketplace, QR-based meal attendance, reviews, notifications, and related functionalities.</li>
          <li><strong>"User Account"</strong> — your registered account categorised as Student, Property Owner, Mess Owner, or Admin.</li>
        </ul>
      </section>

      <section id="data-we-collect">
        <h2>3. DATA WE COLLECT</h2>
        
        <h3>3.1 Information You Provide Directly</h3>
        <p><strong>Account Registration:</strong> Full name, email, password (hashed), phone number, user role (student/property owner/mess owner).</p>
        <p><strong>Profile Information:</strong> Avatar/photo, college name, branch/department, gender, biography.</p>
        <p><strong>Property Listings:</strong> Title, description, type (PG/hostel/flat/shared room/private room), rent, deposit, full address, city, state, pincode, contact phone/email, Google Maps URL, images, amenities (WiFi, AC, laundry, CCTV, parking, etc.), room availability, gender preference.</p>
        <p><strong>Mess Listings:</strong> Name, description, address, city, state, contact phone/email, monthly/per-meal charges, meal types, service hours, menu card, photos, Google Maps URL.</p>
        <p><strong>Mess Subscriptions:</strong> Selected plan, duration, meal preferences, amount paid, payment status.</p>
        <p><strong>Meal Attendance:</strong> QR code scan data, meal type, date, time of attendance, token codes.</p>
        <p><strong>Reviews & Ratings:</strong> Star ratings, written reviews, attached photographs.</p>
        <p><strong>Roommate Profile:</strong> Budget range, preferred city, college, branch, gender, food preference (veg/non-veg/both), smoking habits, sleep schedule, accommodation preference, description.</p>
        <p><strong>Community Marketplace:</strong> Post title, content, category (notes/books/cycles/bikes/events/announcements/general), images, pricing.</p>
        <p><strong>Communication & Support:</strong> Messages to listing owners, support requests.</p>

        <h3>3.2 Information Collected Automatically</h3>
        <ul>
          <li><strong>Device Information:</strong> Device type, OS, browser, screen resolution, device identifiers.</li>
          <li><strong>Log Data:</strong> IP address, timestamps, pages viewed, referral URLs, session duration.</li>
          <li><strong>Location Data:</strong> Latitude/longitude coordinates (only when you explicitly enable location services for proximity search or location-verified meal attendance).</li>
          <li><strong>Cookies & Local Storage:</strong> Session tokens, authentication state, theme preference (dark/light mode), notification preferences.</li>
        </ul>

        <h3>3.3 Information from Third Parties</h3>
        <ul>
          <li><strong>Google OAuth</strong> (if implemented): Name, email, profile picture.</li>
          <li><strong>Payment Gateways</strong> (if implemented): Transaction ID, payment status, partial instrument details (we do not store full card numbers).</li>
          <li><strong>Google Maps API:</strong> Geolocation data, map tiles for property/mess location display.</li>
        </ul>

        <h3>3.4 Data We Do NOT Collect</h3>
        <p>We do not knowingly collect: Aadhaar numbers, biometric data, bank account/card numbers or UPI PINs directly, caste/religious/political data, health records, or data from individuals below 18 years of age.</p>
      </section>

      <section id="purpose-and-lawful-basis">
        <h2>4. PURPOSE AND LAWFUL BASIS FOR PROCESSING</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs uppercase bg-slate-50 dark:bg-slate-800">
              <tr>
                <th className="px-4 py-3">Purpose</th>
                <th className="px-4 py-3">Lawful Basis</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b dark:border-slate-700">
                <td className="px-4 py-3">Account creation and management</td>
                <td className="px-4 py-3">Consent at registration (DPDP Act, Section 6)</td>
              </tr>
              <tr className="border-b dark:border-slate-700">
                <td className="px-4 py-3">Displaying property/mess listings</td>
                <td className="px-4 py-3">Performance of requested service</td>
              </tr>
              <tr className="border-b dark:border-slate-700">
                <td className="px-4 py-3">Mess subscriptions, QR attendance, meal tokens</td>
                <td className="px-4 py-3">Performance of service; contractual necessity</td>
              </tr>
              <tr className="border-b dark:border-slate-700">
                <td className="px-4 py-3">Roommate matching</td>
                <td className="px-4 py-3">Consent; performance of service</td>
              </tr>
              <tr className="border-b dark:border-slate-700">
                <td className="px-4 py-3">Community marketplace</td>
                <td className="px-4 py-3">Performance of service</td>
              </tr>
              <tr className="border-b dark:border-slate-700">
                <td className="px-4 py-3">Notifications (subscription expiry, menu updates, reviews, payments)</td>
                <td className="px-4 py-3">Consent; legitimate interest</td>
              </tr>
              <tr className="border-b dark:border-slate-700">
                <td className="px-4 py-3">Location-verified attendance</td>
                <td className="px-4 py-3">Explicit consent for location access</td>
              </tr>
              <tr className="border-b dark:border-slate-700">
                <td className="px-4 py-3">Fraud prevention and platform security</td>
                <td className="px-4 py-3">Legitimate interest; IT Act compliance</td>
              </tr>
              <tr className="border-b dark:border-slate-700">
                <td className="px-4 py-3">Legal compliance</td>
                <td className="px-4 py-3">Compliance with applicable law</td>
              </tr>
              <tr>
                <td className="px-4 py-3">Analytics and improvement</td>
                <td className="px-4 py-3">Legitimate interest (anonymised/aggregated data)</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section id="consent">
        <h2>5. CONSENT</h2>
        <p><strong>Obtaining Consent:</strong> We obtain your free, specific, informed, unconditional, and unambiguous consent before processing personal data, through clear affirmative action at registration. Specific consents are requested for optional features (location access, push/email notifications).</p>
        <p><strong>Withdrawal of Consent:</strong> You may withdraw consent at any time via Settings or by contacting our Grievance Officer. Withdrawal does not affect prior lawful processing. Some features may become unavailable upon withdrawal.</p>
        <p><strong>Children's Data:</strong> FlatsNFood is for college students aged 18+. We do not knowingly collect data from minors. If discovered, such data will be promptly deleted.</p>
      </section>

      <section id="how-we-use">
        <h2>6. HOW WE USE YOUR DATA</h2>
        <ul>
          <li><strong>Account Management:</strong> Authentication and role-based access (student, property owner, mess owner, admin).</li>
          <li><strong>Search & Discovery:</strong> Powering filters for properties (type, rent, city, gender, amenities, rating, proximity) and mess discovery.</li>
          <li><strong>Subscriptions & Attendance:</strong> Processing subscriptions, generating daily QR codes, validating scans, issuing meal tokens, tracking status.</li>
          <li><strong>Listings:</strong> Enabling owners to create, update, and manage listings with images, amenities, and pricing.</li>
          <li><strong>Community:</strong> Facilitating the marketplace for notes, books, cycles, bikes, events, and discussions.</li>
          <li><strong>Reviews:</strong> Displaying user-generated reviews and ratings.</li>
          <li><strong>Notifications:</strong> Subscription expiry, menu updates, messages, reviews, attendance, payments, listing approvals.</li>
          <li><strong>Safety & Security:</strong> Fraud detection, content moderation, enforcing Terms & Community Guidelines.</li>
          <li><strong>Analytics:</strong> Anonymised usage pattern analysis for service improvement.</li>
        </ul>
      </section>

      <section id="data-sharing">
        <h2>7. DATA SHARING AND DISCLOSURE</h2>
        
        <h3>7.1 Who We Share With</h3>
        <ul>
          <li><strong>Other Platform Users:</strong> Name, avatar, college, reviews, listings, community posts, roommate profile (per visibility settings).</li>
          <li><strong>Property/Mess Owners:</strong> Your name and contact info when you enquire or subscribe.</li>
          <li><strong>Payment Processors:</strong> Transaction details for subscription payments.</li>
          <li><strong>Cloud Infrastructure Providers:</strong> Encrypted data for hosting/storage.</li>
          <li><strong>Analytics Providers:</strong> Anonymised/pseudonymised usage data.</li>
          <li><strong>Law Enforcement / Government:</strong> As required by valid legal process.</li>
        </ul>

        <h3>7.2 We Do NOT</h3>
        <ul>
          <li>Sell your personal data to third parties.</li>
          <li>Share data with advertisers for targeted advertising.</li>
          <li>Trade user data with data brokers.</li>
        </ul>

        <h3>7.3 Cross-Border Transfers</h3>
        <p>If data is transferred outside India, we ensure compliance with the DPDP Act, 2023, including adequate protection or appropriate contractual safeguards. Our infrastructure providers may have servers outside India.</p>
      </section>

      <section id="data-retention">
        <h2>8. DATA RETENTION</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left mb-4">
            <thead className="text-xs uppercase bg-slate-50 dark:bg-slate-800">
              <tr>
                <th className="px-4 py-3">Data Category</th>
                <th className="px-4 py-3">Retention Period</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b dark:border-slate-700">
                <td className="px-4 py-3">Account Information</td>
                <td className="px-4 py-3">Until deletion or 3 years of inactivity</td>
              </tr>
              <tr className="border-b dark:border-slate-700">
                <td className="px-4 py-3">Property/Mess Listings</td>
                <td className="px-4 py-3">Duration of activity + 1 year post-deactivation</td>
              </tr>
              <tr className="border-b dark:border-slate-700">
                <td className="px-4 py-3">Subscription & Attendance Records</td>
                <td className="px-4 py-3">3 years from subscription end</td>
              </tr>
              <tr className="border-b dark:border-slate-700">
                <td className="px-4 py-3">Meal Tokens & QR Logs</td>
                <td className="px-4 py-3">1 year from generation</td>
              </tr>
              <tr className="border-b dark:border-slate-700">
                <td className="px-4 py-3">Reviews & Ratings</td>
                <td className="px-4 py-3">Duration of account existence</td>
              </tr>
              <tr className="border-b dark:border-slate-700">
                <td className="px-4 py-3">Community Posts</td>
                <td className="px-4 py-3">Until deleted by user or account deletion</td>
              </tr>
              <tr className="border-b dark:border-slate-700">
                <td className="px-4 py-3">Roommate Profiles</td>
                <td className="px-4 py-3">Until deactivated or 6 months of inactivity</td>
              </tr>
              <tr className="border-b dark:border-slate-700">
                <td className="px-4 py-3">Log & Analytics Data</td>
                <td className="px-4 py-3">12 months (rolling)</td>
              </tr>
              <tr>
                <td className="px-4 py-3">Support Tickets</td>
                <td className="px-4 py-3">2 years from resolution</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p>Upon expiry, data will be securely deleted or anonymised.</p>
      </section>

      <section id="data-security">
        <h2>9. DATA SECURITY</h2>
        <p>In accordance with the IT Act, 2000 and SPDI Rules, 2011:</p>
        
        <p><strong>Technical Safeguards:</strong></p>
        <ul>
          <li>TLS 1.2+ encryption in transit; AES-256 encryption at rest.</li>
          <li>Passwords hashed using bcrypt/Argon2.</li>
          <li>Role-based access control (RBAC); secure session management.</li>
          <li>Cloud infrastructure with SOC 2 compliance; regular vulnerability assessments.</li>
        </ul>

        <p><strong>Organisational Safeguards:</strong></p>
        <ul>
          <li>Need-to-know access restrictions; confidentiality obligations for staff.</li>
          <li>Security awareness training; incident response plan.</li>
        </ul>

        <p><strong>Breach Notification:</strong></p>
        <ul>
          <li>We will notify the Data Protection Board of India and affected Data Principals without undue delay, as required under the DPDP Act, 2023.</li>
        </ul>
      </section>

      <section id="your-rights">
        <h2>10. YOUR RIGHTS AS A DATA PRINCIPAL</h2>
        <p>Under the DPDP Act, 2023:</p>
        <div className="overflow-x-auto mb-4">
          <table className="w-full text-sm text-left">
            <thead className="text-xs uppercase bg-slate-50 dark:bg-slate-800">
              <tr>
                <th className="px-4 py-3">Right</th>
                <th className="px-4 py-3">Description</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b dark:border-slate-700">
                <td className="px-4 py-3 font-semibold">Access</td>
                <td className="px-4 py-3">Request confirmation and summary of your data processing</td>
              </tr>
              <tr className="border-b dark:border-slate-700">
                <td className="px-4 py-3 font-semibold">Correction</td>
                <td className="px-4 py-3">Request correction of inaccurate or incomplete data</td>
              </tr>
              <tr className="border-b dark:border-slate-700">
                <td className="px-4 py-3 font-semibold">Erasure</td>
                <td className="px-4 py-3">Request deletion where data is no longer necessary (subject to legal retention)</td>
              </tr>
              <tr className="border-b dark:border-slate-700">
                <td className="px-4 py-3 font-semibold">Withdraw Consent</td>
                <td className="px-4 py-3">Withdraw previously given consent</td>
              </tr>
              <tr className="border-b dark:border-slate-700">
                <td className="px-4 py-3 font-semibold">Grievance Redressal</td>
                <td className="px-4 py-3">Raise complaints about data processing</td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-semibold">Nomination</td>
                <td className="px-4 py-3">Nominate another individual for rights exercise in case of death/incapacity</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p>We respond within <strong>30 days</strong> or as prescribed by law.</p>
      </section>

      <section id="cookies">
        <h2>11. COOKIES & LOCAL STORAGE</h2>
        <p>We use strictly necessary cookies (authentication, sessions, security), functional cookies (theme preferences), and analytics cookies (anonymised usage) to improve your experience. We do not use advertising cookies. We use localStorage for auth tokens and theme settings. By using the Platform, you consent to our use of these technologies.</p>
      </section>

      <section id="third-party-links">
        <h2>12. THIRD-PARTY LINKS</h2>
        <p>The Platform may link to third-party sites (e.g., Google Maps). We are not responsible for their privacy practices.</p>
      </section>

      <section id="changes">
        <h2>13. CHANGES TO THIS POLICY</h2>
        <p>Material changes will be communicated via in-app notification and/or email at least <strong>7 days</strong> before taking effect. Continued use constitutes acceptance. Archived versions available on request.</p>
      </section>



      <section id="governing-law">
        <h2>14. GOVERNING LAW</h2>
        <p>Governed by the laws of India. Disputes subject to exclusive jurisdiction of courts in [Your City], India.</p>
      </section>



      <section id="short-disclaimer" className="mt-8">
        <h2>15. DISCLAIMER</h2>
        <p>While we implement reasonable security measures, no data transmission over the Internet can be guaranteed as completely secure. We cannot guarantee absolute data security and your use of the Platform is at your own risk. We are not responsible for third-party links or their privacy practices.</p>
      </section>

      <div className="mt-8 p-4 bg-slate-100 dark:bg-slate-800 rounded-lg text-sm text-slate-500 dark:text-slate-400 italic">
        <strong>DISCLAIMER:</strong> This Privacy Policy is drafted to align with applicable Indian laws and is intended for review by qualified legal counsel before publication. It does not constitute legal advice.
        <br /><br />
        © 2026 FlatsNFood. All rights reserved.
      </div>
    </LegalPageLayout>
  )
}
