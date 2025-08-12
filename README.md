# SecureTalk – End‑to‑End Encrypted Web Chat

> This is the refined README for my "Encrypted Chat" project. The goal is to help others get started quickly and build on it.

---

## 1. Overview
SecureTalk is a  **full‑stack, end‑to‑end encrypted (E2EE)** real‑time encrypted chat platform:
- **Transport security**: Site-wide enforced HTTPS (TLS 1.3).
- **Authentication security**: Passwords are pre‑hashed with SHA‑256 on the client, then stored on the server with bcrypt (12 rounds). The server never sees the plaintext password.
- **Message E2EE**: The browser generates a 256‑bit AES‑GCM key locally; only ciphertext is stored in the database, so the server cannot read messages.
- **Integrity & forward secrecy**: Each message uses a random IV (nonce) and includes a GCM tag to prevent tampering and isolate sessions.

> **Current limitation**: Only local conversations are supported for now. Once we upgrade to a trusted CA-issued certificate, online/public conversations will be enabled.

---

## 2. Core Features
-  Multi‑user real‑time chat rooms / 1‑on‑1 private chat
-  Browser‑side generation & management of session keys (supports import/export)
-  Zero‑Knowledge Authentication
-  MongoDB persistence (local or cloud) storing only ciphertext
-  One‑command local HTTPS cert generation via mkcert
-  Mitigates common security issues: MITM, weak password storage, plaintext leaks after DB dumps, etc.

---

## 3. Tech Stack
- **Backend**: Node.js + Express, MongoDB/Mongoose
- **Crypto**: AES‑GCM (Web Crypto API), SHA‑256 (client), bcrypt (server)
- **Transport**: HTTPS (TLS 1.3), mkcert for local dev certs
- **Frontend**: Vanilla JS / Fetch API / WebSocket (optional)

---

## 4. Quick Start
### 4.1 Environment Requirement
- Node.js ≥ 18
- MongoDB (Local or Cloud Atlas)
- mkcert (local HTTPS)

### 4.2 Clone and Install
```bash
git clone <your-repo-url>.git
cd securetalk
npm install
```

### 4.3 Generate Local HTTPS Certificate (TLS Dev Cert)

**mkcert**
```bash
mkcert -install
mkcert localhost 127.0.0.1 ::1
# Generates two files, e.g.: localhost.pem and localhost-key.pem
mkdir -p certs
mv localhost.pem certs/server.crt
mv localhost-key.pem certs/server.key
```

### 4.4 Configure Environment Variables (.env)
```dotenv
PORT=8443
MONGO_URI=mongodb://localhost:27017/securetalk
BCRYPT_ROUNDS=12
SESSION_SECRET=replace_me_with_random_32_bytes
TLS_CERT=./certs/server.crt
TLS_KEY=./certs/server.key
```

### 4.5 Start Service
```bash
npm start
```
Visit: https://localhost:8443

> On first visit, please "trust" the self-signed certificate in your browser.

---

## 5. How To Use
1. Set up the environment and generate TLS certificates.
2. Visit the HTTPS site → register an account (password is SHA‑256 pre‑hashed on the client, then stored with bcrypt on the server).
3. Start chatting:
   - The browser encrypts text with AES‑GCM → sends it to the server.
   - The server stores only ciphertext (ciphertext + IV + tag).
   - The recipient decrypts messages locally with their own key; the server never sees plaintext.
4. When you inspect raw data exported from the database, you'll only see ciphertext and random IVs.

---

## 6. Project Structure
```
securetalk/
├─ server.js                 # Express entry point
├─ package.json
├─ package-lock.json
├─ .gitignore
├─ public/                   # Static front-end (index.html, chat.html, css/js)
│   ├─ index.html
│   └─ chat.html
│   
├─ certs/                    # Dev TLS certs (server.crt / server.key or *.pem)
├─ scripts/                  # Optional helper scripts (e.g., keygen.js)
├─ node_modules/             # Installed dependencies (auto-generated)
└─ README.md
```

---

## 7. FAQ
**Q1: I switched computers/browsers and can't see my chat history.**  
A1: You need to export your old key and import it on the new device, otherwise the previous ciphertext can't be decrypted.

**Q2: Why do I need both HTTPS and E2EE?**  
A2: HTTPS protects against MITM and network eavesdropping; E2EE ensures the server/database can't read your plaintext even if breached. You need both.
---

## 8. License
MIT – do anything, but give credit.

---

### 9. Author

**Yunfei Bai* – Advanced Computing student @ The University of Sydney  
*Solo development, April – May 2024*


**Enjoy secure chatting!** 🔐💬
