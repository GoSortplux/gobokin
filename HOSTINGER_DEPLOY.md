# Hostinger Subdomain & Redirect Configuration Guide

This guide explains how to set up and maintain the subdomain `event.gobokin.com` and resolve redirect loops for `/events` on Hostinger.

---

## 🛠️ Step 1: Remove the Physical `events` Directory
Next.js routes are virtual. If a physical directory named `events` exists inside your `public_html` folder (e.g. `/home/u178724430/domains/gobokin.com/public_html/events`), it creates a conflict with Next.js's trailing-slash logic:
1. Apache’s `mod_dir` automatically redirects `https://gobokin.com/events` to `https://gobokin.com/events/` (with trailing slash) because the physical directory exists.
2. Next.js automatically redirects `https://gobokin.com/events/` back to `https://gobokin.com/events` (without trailing slash).
3. This causes an infinite loop resulting in `ERR_TOO_MANY_REDIRECTS`.

**Action Needed on Hostinger:**
* Log into the Hostinger File Manager or connect via FTP/SFTP.
* Go to `/home/u178724430/domains/gobokin.com/public_html/`.
* **Delete or rename** the physical `events` folder (e.g., rename it to `_events_old` or backup any assets inside it and delete it).

---

## 🌐 Step 2: Configure the Subdomain in Hostinger Panel
To make `event.gobokin.com` load the dynamic events page of the Next.js app seamlessly:
1. Log in to your Hostinger control panel.
2. Go to **Domains ➔ Subdomains**.
3. Point `event.gobokin.com` directly to the main root folder: `/public_html` (instead of `/public_html/events`).
   * *Note:* If you are editing an existing subdomain, you can change the folder pointer from `/public_html/events` to `/public_html` (the same folder as `gobokin.com`).
4. Ensure SSL is active/installed for `event.gobokin.com` inside the SSL section of Hostinger.

---

## 📝 Step 3: Replace the `.htaccess` File
Since Next.js Middleware now handles the subdomain routing internally, we no longer need complex Apache-level URL rewriting for `event.gobokin.com`.

Replace the `.htaccess` file in `/home/u178724430/domains/gobokin.com/public_html/.htaccess` with the following optimized and clean configuration:

```apache
RewriteEngine On

# Clean and robust HTTPS redirection for all domains/subdomains
RewriteCond %{HTTPS} off
RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]

# Phusion Passenger Node.js Configuration
PassengerAppRoot /home/u178724430/domains/gobokin.com/nodejs
PassengerAppType node
PassengerNodejs /opt/alt/alt-nodejs22/root/bin/node
PassengerStartupFile server.js
PassengerBaseURI /
PassengerRestartDir /home/u178724430/domains/gobokin.com/nodejs/tmp

RewriteRule ^\.builds - [F,L]
SetEnv NODE_OPTIONS "--require /home/u178724430/domains/gobokin.com/public_html/.builds/config/preload-timestamp.js"
SetEnv LSNODE_CONSOLE_LOG console.log
SetEnv TOKIO_WORKER_THREADS 2
```

---

## 🔄 Step 4: Restart the Next.js/Node.js Server
After deploying the new code and updating the files above, restart your Phusion Passenger application to apply the middleware and routing changes.

**How to restart:**
* Either click the **"Restart"** button for Node.js in the Hostinger control panel.
* Or create/touch a file named `restart.txt` inside `/home/u178724430/domains/gobokin.com/nodejs/tmp/`.
  *(In Hostinger, simply touching this file forces Passenger to reload the application on the next request).*
