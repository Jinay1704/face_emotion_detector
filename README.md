# 😊 EmotionAI — Face Emotion Detection Web App

A full-stack AI-powered web application that detects human emotions (Angry, Happy, Sad) from images and videos using deep learning.

![EmotionAI Banner](https://img.shields.io/badge/EmotionAI-Emotion%20Detection-indigo?style=for-the-badge)
![Python](https://img.shields.io/badge/Python-3.10-blue?style=flat-square&logo=python)
![TensorFlow](https://img.shields.io/badge/TensorFlow-2.x-orange?style=flat-square&logo=tensorflow)
![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react)
![Node.js](https://img.shields.io/badge/Node.js-20-green?style=flat-square&logo=nodedotjs)


---


## 🎯 Overview

EmotionAI is a SaaS web application that uses a fine-tuned **EfficientNet-B4** deep learning model to detect emotions from:
- 📸 **Images** — Detects emotions on every face in an uploaded photo
- 🎥 **Videos** — Processes videos frame by frame with emotion timeline

The app includes a full subscription system (Free / Pro / Enterprise) powered by **Clerk** authentication and billing.

---

## ✨ Features

| Feature | Free | Pro | Enterprise |
|---|---|---|---|
| Image predictions | 10/month | 200/month | Unlimited |
| Video analysis | ❌ | ✅ 2 min max | ✅ 10 min max |
| File upload size | 5 MB | 50 MB | 200 MB |
| Prediction history | ✅ | ✅ | ✅ |
| Download annotated images | ✅ | ✅ | ✅ |
| Emotion timeline charts | ❌ | ✅ | ✅ |
| MediaPipe face detection | ✅ | ✅ | ✅ |
| Priority support | ❌ | ✅ | ✅ |
| Analytics dashboard | ❌ | ❌ | ✅ |

### Core Features
- 🔍 **Multi-face detection** — Detects and classifies emotions on every face simultaneously
- 🏷️ **Annotated output** — Returns image/video with bounding boxes and emotion labels
- 📊 **Confidence scores** — Shows probability for each emotion class
- 📁 **Prediction history** — Full searchable history of all past predictions
- 🔐 **Secure auth** — Email, Google, GitHub sign-in via Clerk
- 💳 **Billing** — Subscription management with plan upgrades/downgrades

---

## 🛠️ Tech Stack

### Machine Learning Service (Python)
| Technology | Purpose |
|---|---|
| Python 3.10 | ML service language |
| TensorFlow / Keras | Deep learning framework |
| EfficientNet-B4 | Fine-tuned emotion classification model |
| MediaPipe Tasks API | Real-time face detection |
| OpenCV (cv2) | Image/video processing & annotation |
| NumPy | Array operations |
| Flask | REST API server for ML |

### Backend (Node.js)
| Technology | Purpose |
|---|---|
| Node.js 20 | Runtime |
| Express.js | REST API framework |
| Clerk (@clerk/express) | Authentication & user management |
| MongoDB + Mongoose | Database & ODM |
| Cloudinary | Image & video cloud storage |
| Multer | File upload handling |
| Helmet | Security headers |
| Express Rate Limit | API rate limiting |
| Svix | Clerk webhook verification |

### Frontend (React)
| Technology | Purpose |
|---|---|
| React 18 | UI framework |
| Vite | Build tool & dev server |
| React Router v6 | Client-side routing |
| Clerk (@clerk/clerk-react) | Auth UI components |
| Tailwind CSS | Utility-first styling |
| Axios | HTTP client |
| React Dropzone | Drag & drop file uploads |
| React Hot Toast | Notifications |
| Lucide React | Icons |
| Chart.js | Emotion confidence charts |

### Cloud Services
| Service | Purpose | Free Tier |
|---|---|---|
| MongoDB Atlas | Database | 512MB |
| Cloudinary | Media storage | 25GB |
| Clerk | Auth & billing | 10k MAU |

---


---

## 🚀 Getting Started

### Prerequisites

Make sure you have installed:
- [Node.js 20+](https://nodejs.org)
- [Python 3.10+](https://python.org)
- [Git](https://git-scm.com)
- [Docker Desktop](https://docker.com/products/docker-desktop) (optional)

### 1. Clone the repository

```bash
git clone https://github.com/YOUR_USERNAME/emotionai.git
cd emotionai
```

### 2. Add the ML model

Download the trained model and place it at:
```
ml_services/models/efficientnet_full_model.keras
```

> The model file is not included in the repository due to its size (~150MB).
> Contact the author or train your own using the provided Colab notebook.

### 3. Set up environment variables

Create `server/.env`:
```env
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5173
ML_SERVICE_URL=http://localhost:5001

MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/emotion_detection

CLERK_PUBLISHABLE_KEY=pk_test_xxxxxxxxxxxx
CLERK_SECRET_KEY=sk_test_xxxxxxxxxxxx
CLERK_WEBHOOK_SECRET=whsec_xxxxxxxxxxxx

CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

Create `client/.env`:
```env
VITE_API_URL=http://localhost:5000/api
VITE_CLERK_PUBLISHABLE_KEY=pk_test_xxxxxxxxxxxx
```

### 4. Install dependencies

```bash
# Install server dependencies
cd server && npm install && cd ..

# Install client dependencies
cd client && npm install && cd ..

# Install Python dependencies
cd ml_services/backend && pip install -r requirements.txt && cd ../..
```

### 5. Run the application

**Option A — Using start.bat (Windows, one click)**
```
Double-click start.bat in root folder
```

**Option B — Manual (3 terminals)**

Terminal 1 — Flask ML:
```bash
cd ml_services/backend
python app.py
```

Terminal 2 — Express Server:
```bash
cd server
npm run dev
```

Terminal 3 — React Client:
```bash
cd client
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) 🎉

---

## 💳 Subscription Plans

### Free — $0/month
- 10 image predictions per month
- Full prediction history
- Download annotated results
- MediaPipe face detection

### Pro — $9/month
- 200 predictions per month
- Video analysis (2 min max)
- 50 MB file uploads
- Emotion timeline charts
- Priority support

### Enterprise — $29/month
- Unlimited predictions
- Video analysis (10 min max)
- 200 MB file uploads
- Full analytics dashboard
- Dedicated support

---

## 🤖 ML Model Details

### Architecture
- **Base Model:** EfficientNet-B4 (pretrained on ImageNet)
- **Fine-tuned on:** FER2013 + custom dataset
- **Input size:** 256 × 256 × 3 (RGB)
- **Output classes:** 3 (Angry 😠, Happy 😊, Sad 😢)
- **Framework:** TensorFlow / Keras



### Performance
- **Single face:** ~200ms
- **Multiple faces:** ~300-500ms (batch processing)
- **Video (per frame):** ~150ms after model warmup

---

## 🔧 Clerk Setup

### 1. Create Clerk Application
1. Go to [clerk.com](https://clerk.com) → Create application
2. Enable Email, Google, GitHub sign-in
3. Copy `Publishable Key` and `Secret Key`

### 2. Configure Webhook
1. Clerk Dashboard → Developers → Webhooks
2. Add endpoint: `https://YOUR_DOMAIN/api/clerk/webhook`
3. Subscribe to events:
   - `user.created`
   - `user.updated`
   - `user.deleted`
   - `user.subscription.created`
   - `user.subscription.updated`
   - `user.subscription.deleted`
4. Copy `Signing Secret`

### 3. Local Webhook (Development)
Use VS Code Port Forwarding:
```
VS Code → PORTS tab → Forward port 5000 → Set Public
Copy URL → Use as webhook endpoint in Clerk
```

---

## 🚢 Deployment

### Recommended Stack
| Service | Platform | Cost |
|---|---|---|
| Flask ML | Hugging Face Spaces | Free |
| Express | Render | Free |
| React | Render Static Site | Free |
| MongoDB | Atlas M0 | Free |
| Cloudinary | Free tier | Free |

### Deploy Flask on Hugging Face Spaces
1. Create account at [huggingface.co](https://huggingface.co)
2. New Space → Docker SDK
3. Upload `ml_services/backend/` files + model
4. Change port to 7860 in `app.py`

### Deploy Express on Render
1. Connect GitHub repo
2. Root Directory: `server`
3. Build: `npm install`
4. Start: `node server.js`
5. Add all `.env` variables

### Deploy React on Render
1. New Static Site
2. Root Directory: `client`
3. Build: `npm install && npm run build`
4. Publish: `dist`
5. Add `VITE_API_URL` and `VITE_CLERK_PUBLISHABLE_KEY`

---

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch: `git checkout -b feature/AmazingFeature`
3. Commit changes: `git commit -m 'Add AmazingFeature'`
4. Push to branch: `git push origin feature/AmazingFeature`
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License.

---

## 👨‍💻 Author

**Jinay Parmar**
- GitHub: [@piyush-eon](https://github.com/piyush-eon)
- LinkedIn: [Jinay Parmar](https://linkedin.com/in/jinayparmar)

---

## 🙏 Acknowledgements

- [EfficientNet](https://arxiv.org/abs/1905.11946) — Tan & Le, 2019
- [MediaPipe](https://mediapipe.dev) — Google
- [Clerk](https://clerk.com) — Authentication
- [Cloudinary](https://cloudinary.com) — Media storage
- [MongoDB Atlas](https://cloud.mongodb.com) — Database

---

<div align="center">
  Made with ❤️ by Jinay Parmar
</div>
