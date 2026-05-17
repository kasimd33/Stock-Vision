from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token
import bcrypt
from models.db import users_col

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.json
    if not data or not data.get('email') or not data.get('password') or not data.get('name'):
        return jsonify({'error': 'Name, email and password are required'}), 400
    if users_col.find_one({'email': data['email'].lower()}):
        return jsonify({'error': 'Email already registered'}), 400

    # Store hash as string to avoid BSON bytes issues
    hashed = bcrypt.hashpw(data['password'].encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    user = {'name': data['name'], 'email': data['email'].lower(), 'password': hashed}
    result = users_col.insert_one(user)
    token = create_access_token(identity=str(result.inserted_id))
    return jsonify({'token': token, 'user': {'name': data['name'], 'email': data['email'].lower()}})

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.json
    if not data or not data.get('email') or not data.get('password'):
        return jsonify({'error': 'Email and password are required'}), 400

    user = users_col.find_one({'email': data['email'].lower()})
    if not user:
        return jsonify({'error': 'Invalid email or password'}), 401

    stored = user['password']
    # Handle both str and bytes stored passwords
    if isinstance(stored, str):
        stored = stored.encode('utf-8')

    if not bcrypt.checkpw(data['password'].encode('utf-8'), stored):
        return jsonify({'error': 'Invalid email or password'}), 401

    token = create_access_token(identity=str(user['_id']))
    return jsonify({'token': token, 'user': {'name': user['name'], 'email': user['email']}})
