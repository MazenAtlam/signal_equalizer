# Backend/app.py

from flask import Flask, jsonify
from flask_cors import CORS
import os

# Import blueprints
from blueprints.audio_bp import audio_bp
from blueprints.equalizer_bp import equalizer_bp

# Define necessary paths
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
UPLOAD_FOLDER = os.path.join(BASE_DIR, 'temp_signals')

def create_app():
    app = Flask(__name__)
    
    # Configuration
    app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
    
    # Ensure the upload directory exists
    os.makedirs(UPLOAD_FOLDER, exist_ok=True)
    
    # Enable CORS for frontend communication
    CORS(app) 
    
    # --- Register Blueprints (API Modules) ---
    app.register_blueprint(audio_bp, url_prefix='/api/audio')
    app.register_blueprint(equalizer_bp, url_prefix='/api/equalizer')

    # --- Root Route ---
    @app.route('/')
    def index():
        return "Signal Equalizer Backend Running! Connect your React client to /api/..."

    # --- Global Error Handler ---
    @app.errorhandler(404)
    def not_found(error):
        return jsonify({'error': 'Resource not found'}), 404

    return app

if __name__ == '__main__':
    app = create_app()
    # Recommended port 5000 for Flask API
    app.run(debug=True, port=5000)