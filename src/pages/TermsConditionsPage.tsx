import React from 'react'
import LegalPageLayout from '../components/layout/LegalPageLayout'
import { Link } from 'react-router-dom'

export default function TermsConditionsPage() {
  const sections = [
    { id: 'acceptance', title: '1. Acceptance of Terms' },
    { id: 'eligibility', title: '2. Eligibility' },
    { id: 'about', title: '3. About the Platform' },
    { id: 'role', title: '4. Role of FlatsNFood' },
    { id: 'accounts', title: '5. User Accounts' },
    { id: 'obligations', title: '6. User Obligations' },
    { id: 'content', title: '7. Listings and Content' },
    { id: 'mess-subs', title: '8. Mess Subscriptions & QR' },
    { id: 'marketplace', title: '9. Community Marketplace' },
    { id: 'ip', title: '10. Intellectual Property' },
    { id: 'disclaimers', title: '11. Disclaimers' },
    { id: 'liability', title: '12. Limitation of Liability' },
    { id: 'indemnification', title: '13. Indemnification' },
    { id: 'disputes', title: '14. Dispute Resolution' },
    { id: 'modifications', title: '15. Modifications' },
    { id: 'severability', title: '16. Severability' },
    { id: 'entire-agreement', title: '17. Entire Agreement' },
    { id: 'contact', title: '18. Contact' },
  ]

  return (
    <LegalPageLayout
      title="Terms & Conditions"
      lastUpdated="20 July 2026"
      effectiveDate="20 July 2026"
      version="1.0"
      sections={sections}
    >
      <section id="acceptance">
        <h2>1. ACCEPTANCE OF TERMS</h2>
        <p>These Terms & Conditions ("Terms") constitute a legally binding agreement between you ("User," "you," "your") and [Your Registered Entity Name] ("FlatsNFood," "we," "us," "our"), the operator of the FlatsNFood platform (the "Platform").</p>
        <p>By accessing, browsing, or using the Platform, you agree to be bound by these Terms, our <Link to="/privacy-policy">Privacy Policy</Link>, <Link to="/community-guidelines">Community Guidelines</Link>, and all other policies referenced herein. If you do not agree, you must not use the Platform.</p>
        <p>These Terms are published in accordance with:</p>
        <ul>
          <li>The <strong>Information Technology Act, 2000</strong> (IT Act)</li>
          <li>The <strong>Information Technology (Intermediary Guidelines and Digital Media Ethics Code) Rules, 2021</strong></li>
          <li>The <strong>Consumer Protection Act, 2019</strong> and the <strong>Consumer Protection (E-Commerce) Rules, 2020</strong></li>
          <li>The <strong>Indian Contract Act, 1872</strong></li>
          <li>The <strong>Digital Personal Data Protection Act, 2023</strong></li>
        </ul>
      </section>

      <section id="eligibility">
        <h2>2. ELIGIBILITY</h2>
        <ul>
          <li>You must be at least <strong>18 years of age</strong> and a resident of India to use the Platform.</li>
          <li>You must be legally competent to enter into a binding contract under the Indian Contract Act, 1872.</li>
          <li>By registering, you represent that all information provided is accurate, complete, and current.</li>
        </ul>
      </section>

      <section id="about">
        <h2>3. ABOUT THE PLATFORM</h2>
        <p>FlatsNFood is a technology-enabled discovery and listing platform that connects students with accommodation providers, mess/tiffin service providers, and fellow students. The Platform offers:</p>
        <ul>
          <li><strong>Property Discovery:</strong> Browse and search PGs, hostels, flats, shared rooms, and private rooms with filters for rent, location, amenities, and gender preference.</li>
          <li><strong>Mess Discovery & Subscriptions:</strong> Discover mess/tiffin services, view menus and plans, subscribe to meal plans, and track attendance via QR-based system.</li>
          <li><strong>Roommate Matching:</strong> Find compatible roommates based on budget, college, lifestyle preferences, and location.</li>
          <li><strong>Community Marketplace:</strong> Buy, sell, and exchange items (notes, books, cycles, bikes) and post events/announcements.</li>
          <li><strong>Reviews & Ratings:</strong> Read and write reviews for properties and messes.</li>
          <li><strong>Dashboards:</strong> Role-specific dashboards for students, property owners, mess owners, and administrators.</li>
        </ul>
      </section>

      <section id="role">
        <h2>4. ROLE OF FLATSNFOOD</h2>
        
        <h3>4.1 Platform / Intermediary Status</h3>
        <p>FlatsNFood operates as an <strong>intermediary</strong> and <strong>e-commerce marketplace entity</strong> under the IT Act, 2000 and the Consumer Protection (E-Commerce) Rules, 2020. We:</p>
        <ul>
          <li>Provide a technology platform to facilitate connections between students and service providers.</li>
          <li>Do <strong>not</strong> own, operate, manage, or control any property, hostel, PG, or mess listed on the Platform.</li>
          <li>Do <strong>not</strong> act as a real estate agent, broker, landlord, food service provider, or employer.</li>
          <li>Do <strong>not</strong> guarantee the quality, safety, legality, or availability of any listing.</li>
        </ul>

        <h3>4.2 No Endorsement</h3>
        <p>Listing a property or mess on FlatsNFood does not constitute an endorsement, recommendation, or guarantee by us. Users must exercise their own judgement and due diligence.</p>

        <h3>4.3 Limitation of Role</h3>
        <p>All transactions (rental agreements, mess subscriptions, marketplace purchases) are directly between the relevant users. FlatsNFood is not a party to any such transaction and bears no liability for disputes arising therefrom, except as required under applicable law.</p>
      </section>

      <section id="accounts">
        <h2>5. USER ACCOUNTS</h2>
        
        <h3>5.1 Registration</h3>
        <ul>
          <li>You must create an account to access most features.</li>
          <li>You must provide accurate information and select the appropriate role: <strong>Student</strong>, <strong>Property Owner</strong>, or <strong>Mess Owner</strong>.</li>
          <li>One person may hold only <strong>one account</strong> unless authorised otherwise.</li>
        </ul>

        <h3>5.2 Account Security</h3>
        <ul>
          <li>You are responsible for maintaining the confidentiality of your credentials.</li>
          <li>You must notify us immediately of any unauthorised access.</li>
          <li>We are not liable for losses arising from unauthorised use of your account.</li>
        </ul>

        <h3>5.3 Account Termination</h3>
        <p>We reserve the right to suspend or terminate accounts that:</p>
        <ul>
          <li>Violate these Terms or any Platform policy.</li>
          <li>Contain false, misleading, or fraudulent information.</li>
          <li>Engage in spamming, harassment, or abuse.</li>
          <li>Remain inactive for more than 12 months.</li>
        </ul>
      </section>

      <section id="obligations">
        <h2>6. USER OBLIGATIONS</h2>
        
        <h3>6.1 General Conduct</h3>
        <p>You agree to:</p>
        <ul>
          <li>Use the Platform only for lawful purposes.</li>
          <li>Not post false, misleading, defamatory, or obscene content.</li>
          <li>Not infringe the intellectual property rights of others.</li>
          <li>Not engage in harassment, threats, discrimination, or hate speech.</li>
          <li>Not attempt to gain unauthorised access to the Platform or other users' data.</li>
          <li>Not use automated tools (bots, scrapers) without written permission.</li>
          <li>Comply with our <Link to="/community-guidelines">Community Guidelines</Link>.</li>
        </ul>

        <h3>6.2 For Property Owners</h3>
        <ul>
          <li>All listing information must be accurate, current, and not misleading.</li>
          <li>You must have lawful authority to list the property.</li>
          <li>You must comply with all applicable local laws, building codes, and tenancy regulations.</li>
          <li>You must not discriminate unlawfully in tenant selection.</li>
          <li>You are solely responsible for the physical condition, safety, and legal compliance of your property.</li>
        </ul>

        <h3>6.3 For Mess Owners</h3>
        <ul>
          <li>All menu information, pricing, and meal plans must be accurate.</li>
          <li>You must comply with applicable food safety and hygiene regulations (FSSAI licensing).</li>
          <li>You must honour active subscriptions as per the plan terms.</li>
          <li>QR codes for attendance must be generated and managed honestly.</li>
          <li>You are solely responsible for food quality, hygiene, and service delivery.</li>
        </ul>

        <h3>6.4 For Students</h3>
        <ul>
          <li>Use the Platform responsibly when searching for accommodation and services.</li>
          <li>Honour commitments made through subscriptions and agreements with owners.</li>
          <li>Reviews must be honest, factual, and based on genuine experience.</li>
          <li>Community marketplace posts must be genuine and accurately priced.</li>
        </ul>
      </section>

      <section id="content">
        <h2>7. LISTINGS AND CONTENT</h2>
        
        <h3>7.1 User-Generated Content</h3>
        <p>By posting content (listings, reviews, community posts, images) on the Platform, you:</p>
        <ul>
          <li>Grant FlatsNFood a non-exclusive, royalty-free, worldwide licence to use, display, reproduce, and distribute such content for Platform operations.</li>
          <li>Represent that you own the content or have the right to post it.</li>
          <li>Agree that FlatsNFood may remove content that violates these Terms or applicable law.</li>
        </ul>

        <h3>7.2 Verification and Featured Listings</h3>
        <ul>
          <li>FlatsNFood may offer "Verified" and "Featured" badges for listings.</li>
          <li>Verification involves basic checks but does <strong>not</strong> guarantee accuracy, quality, or safety.</li>
          <li>Featured status may involve promotional placement.</li>
        </ul>

        <h3>7.3 Reviews</h3>
        <ul>
          <li>Reviews must reflect genuine experiences.</li>
          <li>We do not edit or censor reviews except for violations of Community Guidelines.</li>
          <li>Property/mess owners may respond to reviews publicly.</li>
        </ul>
      </section>

      <section id="mess-subs">
        <h2>8. MESS SUBSCRIPTIONS AND QR ATTENDANCE</h2>
        
        <h3>8.1 Subscription Terms</h3>
        <ul>
          <li>Mess subscriptions are agreements between you and the mess owner.</li>
          <li>FlatsNFood facilitates the subscription process but is not a party to the agreement.</li>
          <li>Subscription status (active/expired/cancelled/pending) is tracked on the Platform.</li>
        </ul>

        <h3>8.2 QR-Based Attendance</h3>
        <ul>
          <li>Students mark meal attendance by scanning daily QR codes generated by the mess owner.</li>
          <li>QR codes are time-limited and meal-specific (breakfast/lunch/dinner/snack).</li>
          <li>Location verification may be required (with your consent).</li>
          <li>Meal tokens are issued upon successful scan and have a validity period.</li>
          <li>Misuse of QR codes (sharing, screenshot manipulation) may result in account suspension.</li>
        </ul>

        <h3>8.3 Payments</h3>
        <ul>
          <li>Payment processing is handled through third-party payment gateways.</li>
          <li>FlatsNFood does not store your payment instrument details (card numbers, UPI PINs).</li>
          <li>Disputes regarding payments for mess subscriptions should be raised with the mess owner and/or our Grievance Officer.</li>
        </ul>
      </section>

      <section id="marketplace">
        <h2>9. COMMUNITY MARKETPLACE</h2>
        <ul>
          <li>The marketplace allows students to post items for sale/exchange in categories: notes, books, cycles, bikes, events, announcements, general.</li>
          <li>All transactions are directly between users.</li>
          <li>FlatsNFood is not responsible for the quality, legality, or delivery of items.</li>
          <li>Prohibited items include illegal goods, weapons, drugs, counterfeit goods, and any items restricted under applicable law.</li>
        </ul>
      </section>

      <section id="ip">
        <h2>10. INTELLECTUAL PROPERTY</h2>
        
        <h3>10.1 FlatsNFood IP</h3>
        <ul>
          <li>The Platform, including its design, code, logos, branding, user interface, and original content, is the intellectual property of FlatsNFood.</li>
          <li>You may not copy, modify, distribute, or create derivative works without written permission.</li>
        </ul>

        <h3>10.2 User IP</h3>
        <ul>
          <li>You retain ownership of original content you post.</li>
          <li>By posting, you grant FlatsNFood the licence described in Section 7.1.</li>
        </ul>
      </section>

      <section id="disclaimers">
        <h2>11. DISCLAIMERS</h2>
        <ul>
          <li>The Platform is provided on an <strong>"AS IS"</strong> and <strong>"AS AVAILABLE"</strong> basis.</li>
          <li>We make <strong>no warranties</strong> (express or implied) regarding the accuracy, reliability, completeness, or suitability of listings, services, or content.</li>
          <li>We do <strong>not</strong> guarantee uninterrupted or error-free operation.</li>
          <li>We are <strong>not</strong> responsible for the acts, omissions, or conduct of any user, property owner, mess owner, or third party.</li>
        </ul>
      </section>

      <section id="liability">
        <h2>12. LIMITATION OF LIABILITY</h2>
        <p>To the maximum extent permitted by applicable law:</p>
        <ul>
          <li>FlatsNFood shall not be liable for any indirect, incidental, special, consequential, or punitive damages.</li>
          <li>Our total aggregate liability for any claim shall not exceed the amount paid by you to FlatsNFood (if any) in the 12 months preceding the claim.</li>
          <li>This limitation applies to all causes of action, including breach of contract, tort, negligence, and strict liability.</li>
        </ul>
      </section>

      <section id="indemnification">
        <h2>13. INDEMNIFICATION</h2>
        <p>You agree to indemnify, defend, and hold harmless FlatsNFood, its officers, directors, employees, and agents from and against all claims, damages, losses, liabilities, costs, and expenses (including legal fees) arising from:</p>
        <ul>
          <li>Your use of the Platform.</li>
          <li>Your violation of these Terms.</li>
          <li>Your violation of any third-party rights.</li>
          <li>Content you post on the Platform.</li>
        </ul>
      </section>

      <section id="disputes">
        <h2>14. DISPUTE RESOLUTION</h2>
        
        <h3>14.1 Governing Law</h3>
        <p>These Terms are governed by the laws of the Republic of India.</p>

        <h3>14.2 Arbitration</h3>
        <p>Any dispute arising from these Terms shall first be attempted to be resolved amicably. If unresolved within 30 days, it shall be referred to <strong>arbitration</strong> under the Arbitration and Conciliation Act, 1996. The arbitration shall be conducted by a sole arbitrator, in English, at [Your City], India.</p>

        <h3>14.3 Jurisdiction</h3>
        <p>Subject to arbitration, courts in [Your City], India shall have exclusive jurisdiction.</p>
      </section>

      <section id="modifications">
        <h2>15. MODIFICATIONS</h2>
        <p>We may modify these Terms at any time. Material changes will be notified via in-app notification and/or email at least <strong>15 days</strong> before taking effect. Continued use after the effective date constitutes acceptance.</p>
      </section>

      <section id="severability">
        <h2>16. SEVERABILITY</h2>
        <p>If any provision is found invalid or unenforceable, the remaining provisions shall continue in full force and effect.</p>
      </section>

      <section id="entire-agreement">
        <h2>17. ENTIRE AGREEMENT</h2>
        <p>These Terms, together with the <Link to="/privacy-policy">Privacy Policy</Link>, constitute the entire agreement between you and FlatsNFood.</p>
      </section>

      <section id="contact">
        <h2>18. CONTACT</h2>
        <p>For questions about these Terms:</p>
        <ul>
          <li><strong>Email:</strong> legal@flatsnfoods.in</li>
          <li><strong>Address:</strong> [Registered Office Address]</li>
        </ul>
      </section>

      <section id="short-disclaimer" className="mt-8">
        <h2>19. DISCLAIMER</h2>
        <p>The information provided on the Platform is for general informational purposes only. We make no representations or warranties of any kind, express or implied, about the completeness, accuracy, reliability, suitability, or availability with respect to the Platform or the information, products, services, or related graphics contained on the Platform for any purpose. Any reliance you place on such information is therefore strictly at your own risk.</p>
      </section>

      <div className="mt-8 p-4 bg-slate-100 dark:bg-slate-800 rounded-lg text-sm text-slate-500 dark:text-slate-400 italic">
        <strong>DISCLAIMER:</strong> These Terms & Conditions are drafted to align with applicable Indian laws and are intended for review by qualified legal counsel before publication. They do not constitute legal advice.
        <br /><br />
        © 2026 FlatsNFood. All rights reserved.
      </div>
    </LegalPageLayout>
  )
}
