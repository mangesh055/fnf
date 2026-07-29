# 🚀 Complete Deployment Guide for FlatsNFood

This document provides a step-by-step walkthrough to deploy your **FlatsNFood** web application to **Vercel** with a **Custom Domain**, production **Supabase Database**, and **Google OAuth Sign-In**.

---

## 📋 Overview of Deployment Steps

1. [Supabase Database Initialization](#1-supabase-database-initialization)
2. [Vercel Deployment Setup](#2-vercel-deployment-setup)
3. [Custom Domain Setup & DNS Configuration](#3-custom-domain-setup--dns-configuration)
4. [Production Google OAuth & Auth Redirect Configuration](#4-production-google-oauth--auth-redirect-configuration)
5. [Post-Deployment Verification Checklist](#5-post-deployment-verification-checklist)

---

## 1. Supabase Database Initialization

Before deploying your frontend, your Supabase production database must be configured with all necessary tables, policies, and auto-triggers.

### Steps:
1. Log in to your [Supabase Dashboard](https://supabase.com/dashboard).
2. Create a **New Project** (e.g., `flatsnfood-prod`) and choose your preferred database region (e.g., *Mumbai / India*).
3. Copy your project credentials from **Project Settings** ➔ **API**:
   - **Project URL**: `https://<your-project-ref>.supabase.co`
   - **anon / public key**: `eyJhbGci...`
4. In the Supabase left sidebar, open the **SQL Editor**.
5. Click **New Query**, open the file `supabase/setup_complete_database.sql` from this repository, copy all contents, paste it into the editor, and click **Run**.

---

## 2. Vercel Deployment Setup

Vercel provides free, high-performance hosting for Vite + React web applications.

### Code Preparation:
This project includes a `vercel.json` file in the root directory to handle single-page application (SPA) routing:

```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

### Steps to Deploy:
1. Push your latest code to your **GitHub** / GitLab repository:
   ```bash
   git add .
   git commit -m "Prepare production deployment"
   git push origin main
   ```
2. Log in to [Vercel.com](https://vercel.com) and click **Add New** ➔ **Project**.
3. Import your GitHub repository (`FlatsNFood`).
4. In the **Configure Project** screen, expand **Environment Variables** and add:

| Key | Example Value | Notes |
| :--- | :--- | :--- |
| `VITE_SUPABASE_URL` | `https://your-project.supabase.co` | Your Supabase Project URL |
| `VITE_SUPABASE_ANON_KEY` | `eyJhbGci...` | Your Supabase Anon Key |
| `VITE_ADMIN_PIN` | `7391` | Admin Security PIN |

5. Click **Deploy**. Vercel will build your application and generate a free preview URL (e.g., `https://flatsnfood.vercel.app`).

---

## 3. Custom Domain Setup & DNS Configuration

You can purchase a custom domain (e.g., `flatsnfood.in` or `flatsnfood.com`) from any domain registrar such as **GoDaddy**, **Namecheap**, **Hostinger**, **Porkbun**, or **Google Domains**.

### A. Add Domain in Vercel:
1. Open your Vercel Project Dashboard.
2. Go to **Settings** ➔ **Domains**.
3. Type your domain name (e.g. `flatsnfood.in`) and click **Add**.
4. Select the option to add both `flatsnfood.in` and `www.flatsnfood.in`.

### B. Configure DNS Records in your Registrar Dashboard:
Log in to your domain registrar (GoDaddy / Hostinger / Namecheap), go to **DNS Management**, and set up the following two records:

| Record Type | Name / Host | Value / Target | TTL |
| :--- | :--- | :--- | :--- |
| **A Record** | `@` | `76.76.21.21` | Automatic / 300s |
| **CNAME Record** | `www` | `cname.vercel-dns.com` | Automatic / 300s |

> ⏱️ **Note:** SSL Certificate generation and DNS propagation usually take 1 to 5 minutes. Vercel automatically provisions a **Free SSL Certificate (HTTPS)** for your domain.

---

## 4. Production Google OAuth & Auth Redirect Configuration

To enable seamless **Google OAuth Sign-In** on your live custom domain:

### A. Update Supabase Auth Settings:
1. Go to your **Supabase Dashboard** ➔ **Authentication** ➔ **URL Configuration**.
2. Set **Site URL** to:
   ```text
   https://flatsnfood.in
   ```
3. Under **Redirect URLs**, add your production URLs:
   ```text
   https://flatsnfood.in
   https://flatsnfood.in/auth
   https://www.flatsnfood.in
   https://www.flatsnfood.in/auth
   https://flatsnfood.vercel.app
   ```

### B. Update Google Cloud Console OAuth Credentials:
1. Open [Google Cloud Console Credentials](https://console.cloud.google.com/apis/credentials).
2. Click on your **OAuth 2.0 Client ID**.
3. Under **Authorized JavaScript Origins**, add:
   - `https://flatsnfood.in`
   - `https://www.flatsnfood.in`
   - `https://flatsnfood.vercel.app`
4. Under **Authorized Redirect URIs**, ensure your Supabase Auth callback URL is present:
   - `https://<your-supabase-project-ref>.supabase.co/auth/v1/callback`
5. Click **Save**.

---

## 5. Post-Deployment Verification Checklist

Once your deployment is complete, verify the following:

- [ ] **HTTPS Security**: Open `https://flatsnfood.in` and verify the secure padlock icon.
- [ ] **SPA Direct Navigation**: Refresh the browser on sub-routes like `https://flatsnfood.in/properties` or `https://flatsnfood.in/auth` to confirm 404 error page is NOT shown.
- [ ] **Google Sign-In**: Click **Continue with Google** on the Sign In / Create Account page to confirm smooth login redirect.
- [ ] **Profile Activation**: Test mobile number & role completion on first sign-in.
- [ ] **Data Persistence**: Verify listings and user actions save into Supabase.

---

🎉 **Congratulations! Your FlatsNFood platform is live in production.**
