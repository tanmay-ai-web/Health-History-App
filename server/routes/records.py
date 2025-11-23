# server/routes/records.py

from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime
from bson.objectid import ObjectId

records_bp = Blueprint('records', __name__)

# Utility function to check role from JWT payload
def check_role(role_name):
    identity = get_jwt_identity()
    return identity.get('role') == role_name, identity

# -------------------------------------------------------------
# 1. DOCTOR: NEW RECORD UPLOAD (Requires Doctor Role)
# -------------------------------------------------------------
@records_bp.route('/upload', methods=['POST'])
@jwt_required() # Is route ko access karne ke liye token chahiye
def upload_record():
    is_doctor, identity = check_role('Doctor')
    
    # Security Check: Sirf Doctor hi upload kar sakte hain
    if not is_doctor:
        return jsonify({"msg": "Authorization required: Doctor role"}), 403

    data = request.get_json()
    patient_id = data.get('patient_id') # Doctor yeh ID frontend se daalega
    problem_summary = data.get('problem_summary')
    report_url = data.get('report_url', None)

    if not all([patient_id, problem_summary]):
        return jsonify({"msg": "Missing patient ID or problem summary"}), 400

    # Record data banana
    new_record = {
        "patient_id_ref": patient_id,
        "doctor_id_ref": identity.get('doctor_id'), # JWT se Doctor ka ID liya
        "date": datetime.now().isoformat(),
        "problem_summary": problem_summary,
        "report_url": report_url
    }

    # Data DB mein insert karna
    try:
        current_app.records_collection.insert_one(new_record)
        return jsonify({"msg": "Record uploaded successfully", "patient": patient_id}), 201
    except Exception as e:
        return jsonify({"msg": "Database error", "error": str(e)}), 500


# -------------------------------------------------------------
# 2. PATIENT: VIEW OWN HISTORY (Requires Patient Role)
# -------------------------------------------------------------
@records_bp.route('/my-history', methods=['GET'])
@jwt_required() # Is route ko access karne ke liye token chahiye
def get_patient_history():
    is_patient, identity = check_role('Patient')
    
    # Security Check: Sirf Patient hi apni history dekh sakta hai
    if not is_patient:
        return jsonify({"msg": "Authorization required: Patient role"}), 403

    patient_id_from_token = identity.get('patient_id') # JWT se Patient ka ID liya
    
    if not patient_id_from_token:
        return jsonify({"msg": "Unique patient ID not found in token"}), 500

    # DB se saare records dhundna
    records_cursor = current_app.records_collection.find(
        {"patient_id_ref": patient_id_from_token}
    ).sort("date", -1) # Latest record pehle dikhega

    # Cursor ko list mein convert karna
    history = []
    for record in records_cursor:
        # MongoDB ke '_id' ko JSON serializable banane ke liye string mein convert karna
        record['_id'] = str(record['_id'])
        history.append(record)

    return jsonify({"history": history}), 200

# -------------------------------------------------------------
# 3. DOCTOR: VIEW ANY PATIENT'S HISTORY (Requires Doctor Role)
# -------------------------------------------------------------
@records_bp.route('/patient-history/<patient_id>', methods=['GET'])
@jwt_required() 
def doctor_view_history(patient_id):
    is_doctor, identity = check_role('Doctor')

    if not is_doctor:
        return jsonify({"msg": "Authorization required: Doctor role"}), 403

    # Doctor kisi bhi patient_id ka data query kar sakta hai
    records_cursor = current_app.records_collection.find(
        {"patient_id_ref": patient_id}
    ).sort("date", -1)

    history = []
    for record in records_cursor:
        record['_id'] = str(record['_id'])
        history.append(record)

    if not history:
        return jsonify({"msg": f"No records found for Patient ID: {patient_id}"}), 404

    return jsonify({"history": history}), 200
