# AegisAI

Real-time flood and heat risk intelligence: ML-scored zones, live alerts, safe routing,
a what-if simulator, and an AI assistant.

## Stack

- Client: React 18, Vite, Tailwind v4, Framer Motion, Leaflet, Recharts
- Server: Node.js, Express, Zod, Firebase Admin
- ML: FastAPI, scikit-learn (gradient boosting)
- Data/Auth: Firebase Auth + Firestore, OpenWeather, OSRM, Groq

## Run locally

```bash
# 1. ML service
cd ml-service && python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
python training/prepare_data.py && python training/train.py
uvicorn app.main:app --reload --port 8000

# 2. Server
cd server && npm install && npm run dev

# 3. Client
cd client && npm install && npm run dev
```

Open http://localhost:5173. With `DEV_BYPASS_AUTH=true` (server) and
`VITE_DEV_BYPASS_AUTH=true` (client) no login is needed.

## Environment

Server `.env`: PORT, CLIENT*URL, ML_SERVICE_URL, GROQ_API_KEY, OPENWEATHER_API_KEY,
DEV_BYPASS_AUTH, FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY
Client `.env`: VITE_API_URL, VITE_DEV_BYPASS_AUTH, VITE_FIREBASE*\*

Every key is optional locally. Missing keys fall back to simulated weather,
rule-based scoring, and rule-based chat.

## Deploy

1. ML service (Render web service, root `ml-service`)
   - Build: `pip install -r requirements.txt && python training/prepare_data.py && python training/train.py`
   - Start: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
2. Server (Render web service, root `server`)
   - Build: `npm install` / Start: `npm start`
   - Set all server env vars. `DEV_BYPASS_AUTH=false`, `ML_SERVICE_URL=<ml url>`,
     `CLIENT_URL=<vercel url>`
3. Client (Vercel, root `client`, framework Vite)
   - Set `VITE_API_URL=https://<server-url>/api`, `VITE_DEV_BYPASS_AUTH=false`, `VITE_FIREBASE_*`
   - Add the Vercel domain to Firebase Auth > Settings > Authorized domains
4. Firebase: deploy `firebase/` rules and indexes, run `node seedFirestore.js`,
   then `node setAdmin.js you@example.com`

## API

GET /api/health · GET /api/zones · GET /api/zones/:id · POST /api/predict ·
GET /api/alerts · POST /api/alerts/scan (admin) · PATCH /api/alerts/:id/ack ·
POST /api/route · POST /api/simulate · POST /api/chat · POST /api/chat/explain
