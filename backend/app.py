from flask import Flask, jsonify
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from dotenv import load_dotenv
import os

load_dotenv()

app = Flask(__name__)
app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY', 'stockvision_dev_secret')
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = False  # tokens don't expire during dev
CORS(app, resources={r'/api/*': {'origins': '*'}}, supports_credentials=True)
jwt = JWTManager(app)

# Return JSON 401 with CORS headers instead of Flask-JWT default
@jwt.unauthorized_loader
def unauthorized_callback(reason):
    return jsonify({'success': False, 'error': f'Missing or invalid token: {reason}'}), 401

@jwt.invalid_token_loader
def invalid_token_callback(reason):
    return jsonify({'success': False, 'error': f'Invalid token: {reason}'}), 401

@jwt.expired_token_loader
def expired_token_callback(jwt_header, jwt_data):
    return jsonify({'success': False, 'error': 'Token has expired'}), 401

from routes.auth import auth_bp
from routes.stocks import stocks_bp
from routes.chatbot import chatbot_bp

app.register_blueprint(auth_bp,    url_prefix='/api/auth')
app.register_blueprint(stocks_bp,  url_prefix='/api/stocks')
app.register_blueprint(chatbot_bp, url_prefix='/api/chatbot')

if __name__ == '__main__':
    app.run(debug=True, port=5000)
