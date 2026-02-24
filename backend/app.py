import os
import cv2
import numpy as np
from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
from werkzeug.utils import secure_filename
from ultralytics import YOLO
import io
from PIL import Image
# Importing `pipeline` lazily inside the audio endpoint to avoid
# downloading large models at application startup.
import threading

app = Flask(__name__)
# Enable CORS for all routes (to allow requests from the React frontend)
CORS(app)

# Load the YOLO model (using the fast and lightweight yolov8n model)
# It will download automatically on first run if not present
print("Loading YOLOv8 AI Model...")
model = YOLO('yolov8n.pt')

# Load the Audio Spectrogram Transformer model
# This will download the ~345MB model on the first run of the app
print("Loading Audio Classification AI Model (this may take a few minutes on first run)...")
from transformers import pipeline
import traceback
try:
    audio_classifier = pipeline("audio-classification", model="MIT/ast-finetuned-audioset-10-10-0.4593")
    print("Audio Classification Model loaded successfully!")
except Exception as e:
    print(f"Failed to load audio model: {e}")
    audio_classifier = None

# Ensure an upload folder exists
UPLOAD_FOLDER = 'uploads'
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'mp4', 'avi', 'wav', 'webm', 'ogg', 'mp3', 'flac', 'aac', 'm4a', 'wma', 'alac', 'opus', 'aiff', 'ape'}

def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

from datetime import datetime

@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({"status": "running"}), 200

# In-memory storage for recent detection events (for Dashboard and Alerts)
# In a real production app, this would be a database (PostgreSQL/SQLite).
detection_events = []

def determine_deterrent(animal, severity):
    if not animal:
        return "None"
    
    animal_lower = str(animal).lower().strip()
    
    if 'elephant' in animal_lower:
        return "Bee Sound & Flashlight Strobe"
    elif any(predator in animal_lower for predator in ['bear', 'lion', 'tiger', 'wolf', 'panther', 'leopard']):
        return "High-Intensity Siren & Flashlight"
    elif any(mid_threat in animal_lower for mid_threat in ['boar', 'deer', 'moose', 'buffalo', 'rhino', 'zebra']):
        return "Ultrasonic Sound & Flashlight"
    elif any(small_threat in animal_lower for small_threat in ['dog', 'fox', 'coyote', 'cat', 'raccoon', 'possum', 'skunk']):
        return "Ultrasonic Sound"
    elif any(bird in animal_lower for bird in ['bird', 'pigeon', 'crow', 'owl', 'hawk', 'eagle']):
        return "High-Pitch Ultrasonic"
    elif 'human' in animal_lower or 'person' in animal_lower:
        return "None" # Let pass silently due to low severity categorization
    
    # Fallback based on severity if animal type isn't specifically mapped
    if severity == 'high':
        return "Siren & Flashlight"
    elif severity == 'medium':
        return "Ultrasonic Sound"
    else:
        return "None"

def add_event(source, animal, confidence, severity="medium"):
    # Emoji mapper for UI
    emoji_map = {
        'elephant': '🐘', 'zebra': '🦓', 'lion': '🦁', 'tiger': '🐅', 'wolf': '🐺',
        'fox': '🦊', 'dog': '🐕', 'cat': '🐈', 'cow': '🐄', 'pig': '🐖', 'sheep': '🐑',
        'goat': '🐐', 'horse': '🐎', 'bird': '🦅', 'pigeon': '🕊️', 'owl': '🦉',
        'duck': '🦆', 'rooster': '🐓', 'chicken': '🐔', 'turkey': '🦃', 'frog': '🐸',
        'snake': '🐍', 'mouse': '🐁', 'rat': '🐀', 'squirrel': '🐿️', 'insect': '🦟'
    }
    
    emoji_key = str(animal).lower().split('/')[0] if animal else ''
    emoji = emoji_map.get(emoji_key, '⚠️')

    deterrent = determine_deterrent(animal, severity)

    event = {
        "id": int(datetime.now().timestamp() * 1000),
        "animal": animal or "Unknown",
        "subtext": f"Detected via {source} ({confidence*100:.1f}%)",
        "timestamp": datetime.now().strftime("%I:%M %p"),
        "severity": severity,
        "deterrent": deterrent,
        "emoji": emoji
    }
    detection_events.insert(0, event)
    # Keep only the latest 50 events to prevent memory leaks
    if len(detection_events) > 50:
        detection_events.pop()
        
    # Automatically dispatch SMS to the farmer if severity is high or medium
    if severity in ["high", "medium"]:
        contact = system_settings.get("emergency_contact")
        if contact:
            sms_msg = f"🚨 DEFENDER ALERT 🚨\n{emoji} {animal} detected!\nSource: {source}\nDeterrent Executed: {deterrent}\nPlease check your dashboard immediately."
            # Fire and forget (don't block the API response returning to the frontend)
            import threading
            threading.Thread(target=send_sms_alert, args=(contact, sms_msg)).start()

@app.route('/api/events', methods=['GET'])
def get_events():
    return jsonify(detection_events), 200

from flask import Flask, request, jsonify, send_file, Response

import time

@app.route('/api/summary', methods=['GET'])
def get_summary():
    intrusions = sum(1 for e in detection_events if e['severity'] == 'high')
    animals = len(detection_events)
    # Consider events within the last ~10 seconds as actively deterring currently. 
    # For now, we'll proxy it by taking the last 3 events and checking if they have an active deterrent.
    active_det = sum(1 for e in detection_events[:3] if e.get('deterrent', 'None') != 'None')
    
    return jsonify({
        "total_intrusions": intrusions,
        "animals_detected": animals,
        "active_deterrents": active_det,
        "status": "Online"
    }), 200

# --- RASPBERRY PI POLL CONFIGURATION ---
PI_DATA_URL = "http://100.122.74.118:5000/data"

import requests
import os

# --- SMS NOTIFICATION SETTINGS ---
# Global in-memory settings (in production, use a database)
system_settings = {
    "emergency_contact": ""
}

def send_sms_alert(to_number, message_body):
    if not to_number:
        print("SMS Cancelled: No emergency contact configured.")
        return False
        
    print(f"Attempting to send SMS to {to_number} using Textbelt API...")
    
    try:
        # Using Textbelt for 1 free SMS per day out-of-the-box (no twilio account needed for testing)
        resp = requests.post('https://textbelt.com/text', data={
            'phone': to_number,
            'message': message_body,
            'key': 'textbelt',
        })
        result = resp.json()
        
        if result.get('success'):
            print(f"SMS Sent Successfully! Quota remaining: {result.get('quotaRemaining')}")
            return True
        else:
            print(f"Textbelt SMS Failed: {result.get('error')}")
            # Fallback to console mock if the free daily quota is exhausted
            print(f"[MOCK FALLBACK] To: {to_number} | Msg: {message_body}")
            return False
            
    except Exception as e:
        print(f"SMS Delivery Failed: {e}")
        return False

@app.route('/api/settings', methods=['GET', 'POST'])
def manage_settings():
    if request.method == 'POST':
        data = request.json
        if not data or 'emergency_contact' not in data:
            return jsonify({"error": "Missing emergency_contact"}), 400
            
        system_settings["emergency_contact"] = data["emergency_contact"]
        return jsonify({"status": "success", "message": "Settings updated"}), 200
        
    return jsonify(system_settings), 200

@app.route('/api/test_sms', methods=['POST'])
def test_sms_endpoint():
    contact = system_settings.get("emergency_contact")
    if not contact:
        return jsonify({"error": "No emergency contact saved in settings."}), 400
        
    success = send_sms_alert(
        to_number=contact,
        message_body="🚨 DEFENDER SYSTEM TEST 🚨\nYour alert configuration is working correctly. You will receive real-time notifications here for high severity farm intrusions."
    )
    
    if success:
        return jsonify({"status": "success"}), 200
    else:
        return jsonify({"error": "Failed to send SMS. Daily free quota may be exhausted, check backend logs."}), 500

import requests

def pi_polling_worker():
    """
    Constantly polls the Raspberry Pi's JSON data stream to sync detections
    into the central Flask event list for the Dashboard, Alerts, and Heatmap.
    """
    last_frame_id = -1
    last_logged_time = 0

    CLASS_NAMES = {
        0: "Buffalo",
        1: "Elephant",
        2: "Rhino",
        3: "Zebra"
    }
    
    while True:
        try:
            # Poll at 2 Hz for logging purposes to keep the Dashboard updated without spamming
            time.sleep(0.5)
            
            res = requests.get(PI_DATA_URL, timeout=2.0)
            if res.status_code != 200:
                continue

            data = res.json()
            if not data or 'frame_id' not in data:
                continue
                
            frame_id = data['frame_id']
            if frame_id == last_frame_id:
                continue
            last_frame_id = frame_id
            
            # Check for stale data (older than 2 seconds)
            # if time.time() - float(data.get('timestamp', 0)) > 2.0:
            #     continue

            boxes = data.get('boxes', [])
            if not boxes:
                continue

            # Throttle event logging to max 1 event every 5 seconds
            current_time = time.time()
            if current_time - last_logged_time > 5:
                # Find the most confident detection
                best_box = max(boxes, key=lambda b: b.get('prob', 0))
                highest_conf = best_box.get('prob', 0)
                class_id = best_box.get('label', -1)
                best_class = CLASS_NAMES.get(class_id, f"Class {class_id}")
                
                # All classes from the Edge AI Demo (Rhino, Elephant, Buffalo, Zebra) are large wildlife
                severity = "high"
                
                add_event(source="Edge AI Stream", animal=best_class, confidence=highest_conf, severity=severity)
                last_logged_time = current_time

        except Exception as e:
            time.sleep(2)

# Start the background Pi polling thread immediately
pi_thread = threading.Thread(target=pi_polling_worker, daemon=True)
pi_thread.start()

@app.route('/api/detect', methods=['POST'])
def detect_objects():
    if 'file' not in request.files:
        return jsonify({"error": "No file part in the request"}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400
        
    if file and allowed_file(file.filename):
        filename = secure_filename(file.filename)
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(filepath)
        
        try:
            # Run YOLOv8 inference on the image
            results = model(filepath)
            
            # Predict returns a list of Results objects
            # We take the first one since we processed one image
            result = results[0]
            
            # Get the annotated image array (BGR format as per OpenCV)
            annotated_frame = result.plot()
            
            # Convert BGR (OpenCV) to RGB (PIL)
            annotated_frame_rgb = cv2.cvtColor(annotated_frame, cv2.COLOR_BGR2RGB)
            
            # Convert the array back to a PIL Image
            img_pil = Image.fromarray(annotated_frame_rgb)
            
            # Save to a bytes buffer
            img_io = io.BytesIO()
            img_pil.save(img_io, 'JPEG', quality=90)
            img_io.seek(0)
            
            # Optional: Extract specific detections to return as JSON summary
            detections = []
            for box in result.boxes:
                # Class mapping: model.names is a dict mapping class ID to name
                class_id = int(box.cls[0].item())
                confidence = float(box.conf[0].item())
                class_name = model.names[class_id]
                
                detections.append({
                    "class": class_name,
                    "confidence": round(confidence, 2)
                })

            # Log this event for the dashboard if anything was detected
            if detections:
                top_det = max(detections, key=lambda x: x['confidence'])
                animal_name = top_det['class'].capitalize()
                
                # Default severity logic
                severity = "medium"
                if animal_name.lower() in ['bear', 'wolf', 'lion', 'tiger']:
                    severity = "high"
                elif animal_name.lower() in ['person', 'bird', 'cat', 'dog']:
                    severity = "low"
                    
                add_event(source="Camera", animal=animal_name, confidence=top_det['confidence'], severity=severity)

            # Send the image back to the client directly
            # This is easiest for the frontend to render as an img tag source
            return send_file(img_io, mimetype='image/jpeg', as_attachment=False, download_name='result.jpg')
            
        except Exception as e:
            return jsonify({"error": str(e)}), 500
        finally:
            # Clean up the uploaded file to save space
            if os.path.exists(filepath):
                os.remove(filepath)

    return jsonify({"error": "File type not allowed"}), 400

@app.route('/api/detect-audio', methods=['POST'])
def detect_audio():
    if 'file' not in request.files:
        return jsonify({"error": "No file part in the request"}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400
        
    if file and allowed_file(file.filename):
        filename = secure_filename(file.filename)
        if filename == 'blob':
            filename = 'audio_capture.webm'
            
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(filepath)
        
        try:
            if audio_classifier is None:
                return jsonify({"error": "Audio model failed to initialize on the backend."}), 500

            print(f"Running audio classification on {filepath}")
            predictions = audio_classifier(filepath)
            print(f"Audio Predictions: {predictions}")
            
            # Ensure predictions is strictly a list of dictionaries
            # HF pipeline usually returns [{'score': 0.99, 'label': 'dog'}, ...]
            normalized_results = []
            if isinstance(predictions, list):
                if len(predictions) > 0 and isinstance(predictions[0], list):
                    # Sometimes audio pipelines return nested lists [[{...}, {...}]]
                    predictions = predictions[0]
                    
                for p in predictions:
                    if isinstance(p, dict) and 'label' in p and 'score' in p:
                        normalized_results.append({
                            "label": str(p['label']),
                            "score": float(p['score'])
                        })

            print(f"Normalized Results: {normalized_results}")
            
            # Map specific actions and keywords directly to a Clean Proper Animal Name
            animal_mapping = {
                'dog': 'Dog', 'bark': 'Dog', 'bow-wow': 'Dog', 'howl': 'Wolf', 'growl': 'Dog/Wolf',
                'cat': 'Cat', 'purr': 'Cat', 'meow': 'Cat', 'hiss': 'Cat', 'caterwaul': 'Cat',
                'horse': 'Horse', 'neigh': 'Horse', 'whinny': 'Horse', 'snort': 'Horse',
                'cow': 'Cow', 'moo': 'Cow', 'bellow': 'Cow',
                'pig': 'Pig', 'oink': 'Pig',
                'goat': 'Goat', 'bleat': 'Sheep/Goat',
                'sheep': 'Sheep',
                'chicken': 'Chicken', 'cluck': 'Chicken',
                'rooster': 'Rooster', 'crowing': 'Rooster',
                'turkey': 'Turkey', 'gobble': 'Turkey',
                'duck': 'Duck', 'quack': 'Duck',
                'goose': 'Goose', 'honk': 'Goose',
                'lion': 'Lion', 'roar': 'Lion/Tiger',
                'tiger': 'Tiger',
                'wolf': 'Wolf', 'wolves': 'Wolf',
                'rodent': 'Rodent', 'rat': 'Rat', 'mouse': 'Mouse',
                'bird': 'Bird', 'chirp': 'Bird', 'tweet': 'Bird', 'squawk': 'Bird', 
                'pigeon': 'Pigeon', 'dove': 'Dove', 'coo': 'Pigeon', 'caw': 'Crow',
                'owl': 'Owl', 'hoot': 'Owl',
                'crow': 'Crow', 
                'frog': 'Frog', 'croak': 'Frog',
                'snake': 'Snake', 'rattle': 'Snake',
                'whale': 'Whale', 'trumpet': 'Elephant', 'squeal': 'Elephant','grunt': 'Elephant', 'zebra': 'Zebra', 'squirrel': 'Squirrel',
                'insect': 'Insect', 'cricket': 'Cricket', 'mosquito': 'Mosquito', 'fly': 'Fly', 'bee': 'Bee', 'wasp': 'Wasp',
                'human': 'Human', 'speech': 'Human', 'conversation': 'Human', 'shout': 'Human', 'yell': 'Human', 
                'scream': 'Human', 'whisper': 'Human', 'laugh': 'Human', 'cry': 'Human', 'cough': 'Human', 
                'sneeze': 'Human', 'breath': 'Human', 'footstep': 'Human', 'voice': 'Human', 'person': 'Human'
            }
            
            # These are generic AudioSet classes that we want to IGNORE so specific animals win
            generic_ignore_exact = ['animal', 'wild animals', 'wildlife', 'pet', 'livestock', 'domestic animals, pets']
            
            filtered_results = []
            for item in normalized_results:
                label_lower = str(item.get('label', '')).lower()
                
                # If it's exactly a generic term or contains it entirely on its own, skip it
                if label_lower in generic_ignore_exact:
                    continue
                    
                mapped_animal = None
                for kw, proper_name in animal_mapping.items():
                    if kw in label_lower:
                        mapped_animal = proper_name
                        break
                
                if mapped_animal:
                    mapped_item = {
                        "original_label": str(item["label"]),
                        "label": str(mapped_animal),
                        "score": float(item["score"])
                    }
                    filtered_results.append(mapped_item)
                    
            print(f"Filtered Animal Results: {filtered_results}")
            
            identified_animal = None
            confidence = None
            if len(filtered_results) > 0:
                top = max(filtered_results, key=lambda p: p.get("score", 0))
                identified_animal = top.get("label")
                confidence = float(top.get("score", 0))

            # Log this event for the dashboard if an animal was identified
            if identified_animal:
                severity = "medium"
                animal_lower = str(identified_animal).lower()
                if animal_lower in ['wolf', 'lion', 'tiger', 'bear', 'elephant', 'wild boar', 'panther']:
                    severity = "high"
                elif animal_lower in ['bird', 'cat', 'dog', 'chicken', 'duck', 'human', 'person']:
                    severity = "low"
                    
                add_event(source="Audio Sensor", animal=identified_animal, confidence=confidence, severity=severity)

            return jsonify({
                "results": filtered_results, 
                "identified_animal": identified_animal, 
                "confidence": confidence
            }), 200
            
        except Exception as e:
            traceback.print_exc()
            return jsonify({"error": str(e)}), 500
        finally:
            if os.path.exists(filepath):
                try:
                    os.remove(filepath)
                except Exception as cleanup_err:
                    print(f"Failed to clean up file {filepath}: {cleanup_err}")

    return jsonify({"error": "File type not allowed"}), 400

if __name__ == '__main__':
    # Run the Flask app on port 5000 (disable reloader to prevent Windows watchdog loop)
    app.run(debug=True, use_reloader=False, host='0.0.0.0', port=5000)
