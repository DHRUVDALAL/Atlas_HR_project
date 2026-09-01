# ATLAS HR SYSTEM: THE ULTIMATE MASTER DEPLOYMENT & TROUBLESHOOTING GUIDE
**Project:** ATLAS HR Recruitment Portal  
**Client:** Abhiyanta India Solutions  
**Server Environment:** Ubuntu Linux VM (Internal IP: 192.168.1.77)  
**Public IP:** 58.84.63.125 (Tata Play Broadband)  
**Firewall:** Sophos XGS 136 (192.168.1.1)  

---

## SECTION 1: ARCHITECTURE & PREREQUISITES
Before deploying any code, the Ubuntu server must be configured with the correct software stack.

### 1.1 Required Software Installation
To prepare a fresh Ubuntu server, the following components must be installed:
\\\ash
# 1. Update system packages
sudo apt update && sudo apt upgrade -y

# 2. Install Python & Virtual Environment tools
sudo apt install python3 python3-pip python3-venv -y

# 3. Install Node.js & NPM (Using NodeSource for latest LTS)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# 4. Install PM2 (Process Manager to keep apps running forever)
sudo npm install -g pm2

# 5. Install Nginx (The Web Server / Reverse Proxy)
sudo apt install nginx -y
\\\

---

## SECTION 2: FILE TRANSFER & HOT RELOADING
### 2.1 Initial Project Transfer
We avoided using Git and directly transferred the local Windows code to the Linux server using Secure Copy Protocol (SCP).
1. On your Windows PC, compress the \Atlas_HR_project-main\ folder into a \.zip\ file.
2. Open Windows Command Prompt (CMD) and run:
   \\\cmd
   scp C:\Users\dhruv\Desktop\Atlas_HR_project-main\project.zip ai_ais@192.168.1.77:/var/www/projects/atlas_hr/
   \\\
3. SSH into the Ubuntu server and unzip it:
   \\\ash
   cd /var/www/projects/atlas_hr
   unzip project.zip -d code
   \\\

### 2.2 The "Hot-Reload" Process (Pushing Updates)
When making small changes on your local Windows PC (like fixing an email bug), do NOT re-zip the entire project. Transfer only the updated file:
\\\cmd
# Example: Pushing an updated Python service file
scp C:\Users\dhruv\Desktop\Atlas_HR_project-main\backend\services\email_service.py ai_ais@192.168.1.77:/var/www/projects/atlas_hr/code/backend/services/
\\\
After pushing the file, you MUST restart the PM2 process on the server to apply the changes:
\\\ash
pm2 restart atlas-backend
\\\

---

## SECTION 3: BACKEND DEPLOYMENT (FASTAPI)
The backend is built with Python (FastAPI) and requires an isolated virtual environment.

### 3.1 Environment Setup
\\\ash
cd /var/www/projects/atlas_hr/code/backend
# Create the isolated environment
python3 -m venv venv
# Activate it (You must do this every time you run manual python commands!)
source venv/bin/activate
# Install all required Python packages
pip install -r requirements.txt
\\\

### 3.2 Database Configuration & Migrations
Ensure the .env file in the backend folder contains the correct PostgreSQL credentials. Then, create the database tables:
\\\ash
alembic upgrade head
\\\

### 3.3 Starting the Backend with PM2
We use PM2 so the server automatically restarts if it crashes or if the VM reboots.
\\\ash
pm2 start uvicorn --name "atlas-backend" -- -m app.main:app --host 127.0.0.1 --port 8001
pm2 save
pm2 startup
\\\

---

## SECTION 4: FRONTEND DEPLOYMENT (REACT / TANSTACK)
The frontend was generated using Lovable.dev (Vite & TanStack Start). This caused a major architectural issue during deployment.

### 4.1 The Cloudflare Build Issue (CRITICAL)
**The Problem:** By default, Lovable configures the build engine (Nitro) to compile the code for a "Cloudflare Worker" environment. Standard Linux VMs cannot run Cloudflare worker code. If you try to run it using Node, it will exit immediately, causing a **502 Bad Gateway**.
**The Solution:** You MUST force the compiler to build a standard Node.js server using an environment variable.

### 4.2 Building the Frontend
\\\ash
cd /var/www/projects/atlas_hr/code/frontend-new
npm install

# CRITICAL: Force the Node-Server preset during build
NITRO_PRESET=node-server npm run build
\\\

### 4.3 Starting the Frontend
\\\ash
# The build output is located in the hidden .output folder
PORT=3000 pm2 start .output/server/index.mjs --name "atlas-frontend"
pm2 save
\\\

---

## SECTION 5: NGINX & REVERSE PROXY
Nginx acts as the "traffic cop". When a user visits tlas.abhiyantatech.com on Port 80 (HTTP) or 443 (HTTPS), Nginx intercepts it.
- If the URL starts with /api/, it routes traffic to the Python backend (Port 8001).
- If the URL is anything else, it routes traffic to the React frontend (Port 3000).

### 5.1 Nginx Configuration File
Location: /etc/nginx/sites-available/atlas
\\\
ginx
server {
    listen 80;
    server_name atlas.abhiyantatech.com;
    
    # Redirect HTTP to HTTPS automatically
    return 301 https://\System.Management.Automation.Internal.Host.InternalHost\;
}

server {
    listen 443 ssl;
    server_name atlas.abhiyantatech.com;

    # SSL Certificates (Required for HTTPS)
    ssl_certificate /var/www/projects/atlas_hr/ssl/fullchain.crt;
    ssl_certificate_key /var/www/projects/atlas_hr/ssl/private.key;

    # Backend API Routing
    location /api/ {
        proxy_pass http://127.0.0.1:8001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \System.Management.Automation.Internal.Host.InternalHost;
        proxy_cache_bypass \;
    }

    # Frontend Routing
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \System.Management.Automation.Internal.Host.InternalHost;
        proxy_cache_bypass \;
    }
}
\\\
Symlink the file and restart:
\\\ash
sudo ln -s /etc/nginx/sites-available/atlas /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
\\\

---

## SECTION 6: ENTERPRISE NETWORKING & FIREWALL

### 6.1 Sophos XGS 136 Firewall Configuration
To expose the internal server (192.168.1.77) to the public internet, we created a DNAT rule.
1. Log into the Sophos Firewall (192.168.1.1).
2. Navigate to **Rules and policies > NAT rules**.
3. Click **Add NAT rule > Server access assistant (DNAT)**.
4. **Internal Server IP:** 192.168.1.77
5. **Public IP Interface:** Port2 (Tata Broadband WAN).
6. **Services:** HTTP (80) and HTTPS (443).

### 6.2 The "Hairpin NAT" Office Wi-Fi Issue
**The Problem:** The website worked flawlessly on 5G mobile data, but when employees connected to the Abhiyanta office Wi-Fi, the website timed out. The Sophos firewall blocked internal devices from reaching the public IP.
**The Fix (Two-Part Solution):**
1. **Firewall Tweak:** Edit the DNAT rule in Sophos. Under "Inbound Interface", remove "Port2" and select **"Any"**.
2. **Split-Brain DNS (The Ultimate Fix):** Log into the Windows Active Directory Server (192.168.1.5). Open the DNS Manager. Under the Forward Lookup Zone for bhiyantatech.com, create a new **A-Record** named tlas that points directly to the internal IP 192.168.1.77. This forces internal computers to bypass the firewall completely and route directly to the server.

### 6.3 BigRock DNS Conflicts
**The Problem:** The domain intermittently showed a "403 Forbidden" page or a directfwd.com placeholder.
**The Cause:** BigRock automatically injected a default "Domain Parking" IP (103.76.231.90) into the DNS records. Browsers were randomly connecting to the parking IP instead of the Tata IP.
**The Fix:** Logged into the BigRock control panel, found the A-Record pointing to 103.76.231.90, and permanently deleted it.

---

## SECTION 7: CRITICAL BUGS AND RESOLUTIONS

### Bug 1: Missing HTML Email Templates
**Symptom:** The automated emails were being sent as plain-text 1-liners (e.g., "Your application has been registered") instead of the highly formatted Apple-style HTML templates.
**Root Cause:** The email_templates database table was empty because the seed script was never run on the production server. The backend caught the 404 Not Found exception and triggered the emergency allback_html.
**Resolution:** Ran the Python seeding function directly on the server to inject the templates:
\\\python
cd /var/www/projects/atlas_hr/code/backend
source venv/bin/activate
python -c "
import sys; sys.path.insert(0, '.')
from database.connection import SessionLocal
from services.email_template_service import seed_email_templates
db = SessionLocal()
seed_email_templates(db)
"
\\\

### Bug 2: The Duplicate Email Queue Glitch
**Symptom:** When Candidate 2 applied, Candidate 1 received a duplicate, blank email. When Candidate 3 applied, Candidates 1 and 2 received emails again.
**Root Cause:** In ackend/services/email_service.py, the process_email_queue() function processed the queue but failed to delete the email item after sending it. It simply incremented item.attempts += 1. Every time the queue was processed, it resent every email that had less than 3 attempts.
**Resolution:** We modified email_service.py to physically delete the item from the queue:
\\\python
# OLD CODE (Broken):
item.attempts += 1
item.locked = False
db.flush()

# NEW CODE (Fixed):
db.delete(item)
db.flush()
\\\

### Bug 3: Internal Server Error (500) on Form Submission
**Symptom:** Submitting the application form resulted in a "Request failed with status 500".
**Root Cause:** The PostgreSQL database enforces a UNIQUE CONSTRAINT on the email column in the candidates table. We were using the exact same test email address (dhruvdalal.abhiyanta@gmail.com) for multiple submissions, causing a database crash before the email trigger could run.
**Resolution:** Used a different test email address for subsequent tests.

---
*End of Master Document. Generated for Abhiyanta India Solutions.*
