# 🦁 DEFENDER: Intelligent Animal Intrusion Detection & Deterrent System

DEFENDER is a comprehensive, AI-powered Edge computing architecture designed to monitor live video/audio feeds, accurately detect physical wildlife intrusions using optimized neural networks, and provide real-time reporting and alerts.

## 🚀 Key Features

- **Decoupled Edge AI Streaming Architecture**:
  - The heavy lifting (YOLOv8 Inference) occurs entirely on edge devices (like a Raspberry Pi 5).
  - High-performance, low-latency streaming utilizing parallel JSON metadata channels (`/data`) and pure compressed video streams (`/stream`).
  - Browser-side GPU-accelerated `<canvas>` rendering overlays the bounding boxes locally (0 dropped frames, minimal network overhead).

- **Real-Time Interactive Dashboard**:
  - Global event states constantly sync with Edge Analytics polling.
  - Heatmap Visualization mapping total detected volume to geographic activity Zones.
  - Live Alert Feed offering one-click CSV & PDF Export tracking detection history.
  - Real-time Pi Hardware Analytics metric pillars (FPS & polling latency).

- **Advanced Dual-Modal AI**:
  - **Vision**: `YOLOv8` based computer vision models for live object classification and bounding box localization.
  - **Audio**: Hugging Face `transformers` Audio Spectrogram pipeline (`ast-finetuned-audioset`) for real-time auditory event classification (identifying roars, barks, footsteps).

## 🛠️ Technology Stack

- **Frontend Environment**:
  - Framework: React 18, Vite, TypeScript
  - Styling: Tailwind CSS, ShadCN UI, Lucide React (Icons)
  - Data Visualization: Recharts
  - Document Generation: jsPDF, jsPDF-AutoTable

- **Backend Environment**:
  - Framework: Python 3.10+, Flask, Werkzeug
  - AI Libraries: Ultralytics (YOLOv8), Transformers (Hugging Face / AST), PyTorch
  - Video Processing: OpenCV (`cv2`), NumPy

## 📦 Project Structure

```text
DEFENDER/
├── backend/            # Python Flask AI Server
│   ├── app.py          # Main application & routing logic
│   ├── start.bat       # Windows launch script
│   └── requirements.txt# Python dependencies
│
└── frontend/           # React + Vite Dashboard
    ├── src/            
    │   ├── pages/      # Routes: Dashboard, Alerts, MapView, Heatmap, Audio
    │   ├── components/ # Reusable React UI Elements
    │   └── App.tsx     # Routing setup
    ├── package.json    # Node dependencies
    └── vite.config.ts  
```

## ⚙️ Quick Start Installation

**1. Clone the Repository**
```bash
git clone https://github.com/Meenakshimkumar/DEFENDER-WEBSITE.git
cd DEFENDER-WEBSITE
```

**2. Start the Backend API (Python)**
```bash
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
python app.py
```
*(The backend runs on `http://127.0.0.1:5000`)*

**3. Start the Frontend Application (React/Vite)**
```bash
cd frontend
npm install
npm run dev
```
*(The frontend runs on `http://localhost:5173`)*

## 📡 Hardware Edge Configuration (Optional)

By default, the Web Dashboard is built to fetch live inference coordinates (`/data`) and video streams (`/stream`) from an active Edge AI Node (like a Raspberry Pi) at **`192.168.2.187:5000`**.

If you wish to change the targeted IP Address of your hardware, modify `PI_IP` inside `frontend/src/pages/MapView.tsx` or update the `PI_DATA_URL` inside `backend/app.py`.
