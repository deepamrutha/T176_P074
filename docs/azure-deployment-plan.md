# Azure Deployment Runbook & Plan: SecureBank

> **Project Title:** Azure Confidential or Isolated Compute Design Study  
> **Deployment Target:** Microsoft Azure (`centralindia` region)  
> **Resource Group:** `SecureBank-RG`  
> **Deployed Compute:** `Standard_B2as_v2` (AMD EPYC 7763, Trusted Launch Gen 2, Secure Boot + vTPM 2.0)  
> **Target Compute SKU:** `Standard_DC2as_v6` (AMD SEV-SNP Confidential VM)  
> **Status:** Deployment claims and resource details in this runbook have not been verified in this workspace. Treat Azure commands and configuration below as historical/planned material, not evidence of a current deployment. Do not publish live IP addresses, credentials, or unverified attestation claims.

---

## 1. Executive Deployment Summary

This runbook records a prior report that SecureBank infrastructure was provisioned in **Central India (`centralindia`)**. Current resource state, subscription policy, and deployment details were not independently verified during this publishing task.

The reported deployment features:
* **Dedicated Resource Group & VNet:** `SecureBank-RG` and `SecureBank-VNet` (10.1.0.0/16) with isolated subnets `AppSubnet` (10.1.1.0/24) and `DatabaseSubnet` (10.1.2.0/24).
* **Network Security Enforcement:** `SecureBank-NSG` restricting administrative SSH access to the developer's IP subnet (`[public IP redacted]/24`) and exposing HTTP/API ports (`80`, `443`, `5001`).
* **Hardware-Secured Compute:** `SecureBank-VM` running on an **AMD EPYC 7763 64-Core Processor** with **Gen 2 Trusted Launch**, **UEFI Secure Boot**, and hardware **vTPM 2.0** (`/dev/tpm0`, `/dev/tpmrm0`).
* **Relational Database Tier:** Local PostgreSQL 14 running on the VM with a dedicated database (`securebank`) and user (`securebank_admin`), seeded with demo client and auditor accounts.
* **Production Application Services:**
  - **Backend:** Gunicorn running 3 Python sync workers on port `5001` managing the Flask REST API.
  - **Frontend:** Nginx running on port `80` serving the optimized production build of the React 19 + Tailwind CSS single-page application and reverse-proxying `/api/` to Flask.

---

## 2. Provisioning Commands (Historical Reference)

The commands below are included as historical/reference material. They were not executed as part of this publishing task and may require review before use. Running them can create billable resources; verify the subscription, budget, region, quota, and security configuration first.

### Step 2.1: Resource Group & Virtual Network
```bash
# 1. Create Resource Group in Central India
az group create --name SecureBank-RG --location centralindia

# 2. Create Virtual Network with Application Subnet
az network vnet create \
  --resource-group SecureBank-RG \
  --name SecureBank-VNet \
  --address-prefixes 10.1.0.0/16 \
  --subnet-name AppSubnet \
  --subnet-prefixes 10.1.1.0/24

# 3. Create Database Subnet
az network vnet subnet create \
  --resource-group SecureBank-RG \
  --vnet-name SecureBank-VNet \
  --name DatabaseSubnet \
  --address-prefixes 10.1.2.0/24
```

### Step 2.2: Network Security Group & Security Rules
```bash
# 1. Create Network Security Group
az network nsg create --resource-group SecureBank-RG --name SecureBank-NSG

# 2. Allow SSH strictly from Administrator IP
az network nsg rule create \
  --resource-group SecureBank-RG \
  --nsg-name SecureBank-NSG \
  --name Allow-SSH-Admin \
  --priority 100 \
  --source-address-prefixes "[public IP redacted]/24" \
  --destination-port-ranges 22 \
  --protocol Tcp \
  --access Allow

# 3. Allow Web UI and API Ports
az network nsg rule create \
  --resource-group SecureBank-RG \
  --nsg-name SecureBank-NSG \
  --name Allow-HTTP-API \
  --priority 110 \
  --source-address-prefixes "*" \
  --destination-port-ranges 80 443 5001 \
  --protocol Tcp \
  --access Allow

# 4. Associate NSG to AppSubnet
az network vnet subnet update \
  --resource-group SecureBank-RG \
  --vnet-name SecureBank-VNet \
  --name AppSubnet \
  --network-security-group SecureBank-NSG
```

### Step 2.3: Public IP & Network Interface
```bash
# 1. Create Static Public IP
az network public-ip create \
  --resource-group SecureBank-RG \
  --name SecureBank-Confidential-VMPublicIP \
  --sku Standard \
  --allocation-method Static

# 2. Create Network Interface attached to AppSubnet and Public IP
az network nic create \
  --resource-group SecureBank-RG \
  --name SecureBank-Confidential-VMVMNic \
  --vnet-name SecureBank-VNet \
  --subnet AppSubnet \
  --network-security-group SecureBank-NSG \
  --public-ip-address SecureBank-Confidential-VMPublicIP
```

### Step 2.4: Virtual Machine Provisioning (Trusted Launch Gen2)
```bash
az vm create \
  --resource-group SecureBank-RG \
  --name SecureBank-VM \
  --nics SecureBank-Confidential-VMVMNic \
  --image Canonical:0001-com-ubuntu-server-jammy:22_04-lts-gen2:latest \
  --size Standard_B2as_v2 \
  --admin-username azureuser \
  --ssh-key-values ~/.ssh/id_rsa.pub \
  --security-type TrustedLaunch \
  --enable-secure-boot true \
  --enable-vtpm true
```

---

## 3. Remote Host Software & Application Deployment

### Step 3.1: System Packages Installation
Executed on remote host `azureuser@[public IP redacted]`:
```bash
sudo apt update
sudo apt install -y python3-pip python3-venv nginx postgresql postgresql-contrib
```

### Step 3.2: PostgreSQL 14 Database Setup
```bash
sudo -u postgres psql -c "CREATE USER securebank_admin WITH PASSWORD '<set-privately>';"
sudo -u postgres psql -c "CREATE DATABASE securebank OWNER securebank_admin;"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE securebank TO securebank_admin;"
sudo -u postgres psql -d securebank -c "GRANT ALL ON SCHEMA public TO securebank_admin;"
```

### Step 3.3: Application Backend Environment & Database Seeding
```bash
mkdir -p /home/azureuser/app
tar -xzf /home/azureuser/securebank_deploy.tar.gz -C /home/azureuser/app
cd /home/azureuser/app/backend
python3 -m venv venv
./venv/bin/pip install --upgrade pip
./venv/bin/pip install -r requirements.txt

# Configure backend/.env using a secret manager or private local configuration.
# Never commit the resulting .env file or insert real values into this document.
cat > /home/azureuser/app/backend/.env << 'EOF'
FLASK_ENV=production
FLASK_DEBUG=0
SECRET_KEY=<set-a-unique-random-secret-outside-source-control>
JWT_SECRET_KEY=<set-a-different-unique-random-secret-outside-source-control>
DATABASE_URL=<configure-private-PostgreSQL-connection-string>
DEMO_CLIENT_PASSWORD=<set-privately-if-a-demo-user-must-be-created>
DEMO_AUDITOR_PASSWORD=<set-privately-if-a-demo-user-must-be-created>
COMPUTE_ENVIRONMENT=AZURE_STANDARD_VM
BACKEND_HOST=127.0.0.1
BACKEND_PORT=5001
CORS_ORIGINS=<configure-approved-HTTPS-origins>
EOF

# Seed demo users, accounts, and transactions
./venv/bin/python run.py --seed-only
./venv/bin/python run.py --check-db
```

### Step 3.4: Systemd Service Configuration
File: `/etc/systemd/system/securebank.service`:
```ini
[Unit]
Description=SecureBank Flask Backend API
After=network.target postgresql.service

[Service]
User=azureuser
WorkingDirectory=/home/azureuser/app/backend
Environment="PATH=/home/azureuser/app/backend/venv/bin"
ExecStart=/home/azureuser/app/backend/venv/bin/gunicorn --workers 3 --bind 127.0.0.1:5001 "run:app"
Restart=always

[Install]
WantedBy=multi-user.target
```
Commands to activate:
```bash
sudo systemctl daemon-reload
sudo systemctl enable securebank.service
sudo systemctl restart securebank.service
```

### Step 3.5: Nginx Web Server & Reverse Proxy Configuration
Deploy static React build to `/var/www/securebank/dist`:
```bash
sudo mkdir -p /var/www/securebank/dist
sudo cp -r /home/azureuser/app/frontend/dist/* /var/www/securebank/dist/
sudo chown -R www-data:www-data /var/www/securebank/dist
sudo chmod -R 755 /var/www/securebank/dist
```

File: `/etc/nginx/sites-available/default`:
```nginx
server {
    listen 80 default_server;
    listen [::]:80 default_server;

    root /var/www/securebank/dist;
    index index.html;

    server_name _;

    location /api/ {
        proxy_pass http://127.0.0.1:5001/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```
Commands to activate:
```bash
sudo nginx -t
sudo systemctl restart nginx
```

---

## 4. Live Verification Results

| Test Item | Target Endpoint / Command | Expected Result | Actual Result |
| :--- | :--- | :--- | :--- |
| **VM Status** | `az vm show -g SecureBank-RG -n SecureBank-VM` | `VM running` | **`VM running` (Succeeded)** |
| **Hardware vTPM** | `ls -la /dev/tpm*` | `/dev/tpm0`, `/dev/tpmrm0` present | **`/dev/tpm0` (vTPM 2.0 active)** |
| **Web Frontend** | `GET http://[public IP redacted]/` | HTTP 200 (HTML page delivered) | **HTTP 200 OK (React 19 SPA)** |
| **API Health** | `GET http://[public IP redacted]/api/health` | PostgreSQL connected, status healthy | **HTTP 200 OK (`postgresql`, `healthy`)** |
| **Security Info** | `GET http://[public IP redacted]/api/security` | Compute assessment & matrix returned | **HTTP 200 OK (Full study matrix)** |
| **Client Authentication** | `POST http://[public IP redacted]/api/auth/login` | Signed JWT bearer token issued | **HTTP 200 OK (Bearer token issued)** |
| **Account Viewing** | `GET http://[public IP redacted]/api/accounts` | Masked accounts & balances ($58,250.50) | **HTTP 200 OK (2 accounts returned)** |
| **Simulated Transfer** | `POST http://[public IP redacted]/api/transactions` | Balance transferred with audit log | **HTTP 200 OK ($50 transfer executed)** |
| **Unauthorized Access** | `GET http://[public IP redacted]/api/accounts` (no token) | HTTP 401 Unauthorized | **HTTP 401 (`AUTHORIZATION_REQUIRED`)** |

---

## 5. Teardown & Cost Management

To delete all Azure cloud resources created during this deployment run:

```bash
az group delete --name SecureBank-RG --yes --no-wait
```
