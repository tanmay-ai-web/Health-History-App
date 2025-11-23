# server/routes/auth.py

from flask import Blueprint, request, jsonify, current_app
from bcrypt import hashpw, gensalt, checkpw
from flask_jwt_extended import create_access_token
from datetime import timedelta
from bson.objectid import ObjectId

# Blueprint banao: 'auth_bp' naam ka ek mini-application
auth_bp = Blueprint('auth', __name__)

# Registration Route
@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')
    role = data.get('role') # 'Patient' ya 'Doctor'

    if not all([email, password, role]):
        return jsonify({"msg": "Missing email, password, or role"}), 400

    # Role validation
    if role not in ['Patient', 'Doctor']:
        return jsonify({"msg": "Invalid role specified"}), 400

    # Database collection ko access karna
    users_collection = current_app.users_collection 
    
    # 1. User check (agar pehle se exist karta hai)
    if users_collection.find_one({"email": email}):
        return jsonify({"msg": "User already exists"}), 409

    # 2. Password Hashing
    # gensalt() salt generate karta hai. bcrypt password ko hash karta hai.
    hashed_password = hashpw(password.encode('utf-8'), gensalt())

    # 3. Unique ID generation (Hackathon simplification)
    # Doctor ko koi bhi random 'verified_id' de sakte hain.
    # Patient ko koi bhi random 'unique_patient_id' de sakte hain.
    
    unique_id_field = None
    if role == 'Doctor':
        # Generate a simple mock ID for the Doctor
        unique_id_field = "DR-" + str(ObjectId())[-6:] 
    elif role == 'Patient':
        # Generate a simple mock ID for the Patient
        unique_id_field = "P-" + str(ObjectId())[-6:]
        
    # 4. User ko DB mein save karna
    new_user = {
        "email": email,
        "password": hashed_password.decode('utf-8'), # DB mein string save karte hain
        "role": role,
    }
    
    # Unique ID ko role ke hisaab se add karna
    if role == 'Doctor':
        new_user['verified_id'] = unique_id_field
    elif role == 'Patient':
        new_user['unique_patient_id'] = unique_id_field
        
    users_collection.insert_one(new_user)

    return jsonify({
        "msg": f"{role} registered successfully!",
        "id": unique_id_field # Newly generated ID return karna
    }), 201


# Login Route
@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')

    if not all([email, password]):
        return jsonify({"msg": "Missing email or password"}), 400

    users_collection = current_app.users_collection

    # 1. Email se user dhundna
    user = users_collection.find_one({"email": email})

    # 2. Password check karna
    if user and checkpw(password.encode('utf-8'), user['password'].encode('utf-8')):
        
        # 3. JWT Token banana
        # MongoDB _id ko string mein convert karna zaroori hai
        identity_data = {
            "id": str(user['_id']), 
            "role": user['role']
        }
        
        # Agar Patient hai, toh uska unique_patient_id token mein daalo
        if user['role'] == 'Patient' and 'unique_patient_id' in user:
            identity_data['patient_id'] = user['unique_patient_id']
        
        # Agar Doctor hai, toh uska verified_id token mein daalo
        if user['role'] == 'Doctor' and 'verified_id' in user:
            identity_data['doctor_id'] = user['verified_id']
            
        # Token creation (1 hour expiration)
        access_token = create_access_token(
            identity=identity_data, 
            expires_delta=timedelta(hours=1) 
        )

        return jsonify({
            "msg": "Login Successful",
            "token": access_token,
            "role": user['role'],
            "user_identity": identity_data.get('patient_id') or identity_data.get('doctor_id')
        }), 200
    else:
        return jsonify({"msg": "Bad email or password"}), 401