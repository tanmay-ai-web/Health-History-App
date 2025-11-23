# server/app.py
from flask import Flask, jsonify
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from pymongo import MongoClient
import os
from dotenv import load_dotenv
from routes.auth import auth_bp

# .env file load karein
load_dotenv()

app = Flask(__name__)
CORS(app) # Frontend se connectivity ke liye

# Configuration
app.config["tanmayaiweb1"] = os.getenv("tanmayaiweb1")
jwt = JWTManager(app)

# MongoDB connection
try:
    client = MongoClient(os.getenv("MONGO_URI"))
    db = client['HealthHistoryDB']
    # Collections ko app object mein store karna behtar hai taaki woh sabhi files mein available ho
    app.db = db 
    app.users_collection = db['users']
    app.records_collection = db['records']
    print("Connected to MongoDB Atlas successfully!")
except Exception as e:
    print(f"Error connecting to MongoDB: {e}")

# Home Route
@app.route('/', methods=['GET'])
def home():
    return jsonify({"message": "Health History API is running and connected to DB!"}), 200

# --- NEW: REGISTER BLUEPRINT ---
# /auth se shuru hone waale saare routes auth_bp mein honge
app.register_blueprint(auth_bp, url_prefix='/auth') 
# -------------------------------
from routes.records import records_bp # Import
app.register_blueprint(records_bp, url_prefix='/records')

if __name__ == '_main_':
    # Production deployment ke liye is line ko hata dete hain, lekin abhi theek hai
    app.run(debug=True,port=5000)