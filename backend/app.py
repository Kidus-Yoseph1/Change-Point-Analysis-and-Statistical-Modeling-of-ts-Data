from flask import Flask, jsonify, request
from flask_cors import CORS
import pandas as pd
import os

app = Flask(__name__)
CORS(app)

# Use absolute paths so it doesn't matter where you start the terminal
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
# Note: analysis.py saves to 'backend/price_data.csv'
PRICE_PATH = os.path.join(BASE_DIR, '../backend', 'price_data.csv')
RESULTS_PATH = os.path.join(BASE_DIR, '/..backend', 'model_results.csv')

@app.route('/')
def home():
    return "Oil API is running! Check /api/historical"

@app.route('/api/historical', methods=['GET'])
def get_historical():
    if not os.path.exists(PRICE_PATH):
        return jsonify({"error": f"File not found at {PRICE_PATH}"}), 404
    
    df = pd.read_csv(PRICE_PATH)
    # Downsample to ~2000 points so React doesn't crash on 1M rows
    step = max(1, len(df) // 2000)
    return jsonify(df.iloc[::step].to_dict(orient='records'))

@app.route('/api/results', methods=['GET'])
def get_results():
    if not os.path.exists(RESULTS_PATH):
        return jsonify({"error": "Results file not found"}), 404
    df = pd.read_csv(RESULTS_PATH)
    return jsonify(df.to_dict(orient='records'))

@app.route('/api/events', methods=['GET'])
def get_events():
    if not os.path.exists(PRICE_PATH):
        return jsonify({"error": "Data not found"}), 404
    df = pd.read_csv(PRICE_PATH)
    # Filter for geopolitical events for the highlight feature
    events = df[df['Event_Name'] != 'No Event']
    return jsonify(events.to_dict(orient='records'))

if __name__ == '__main__':
    # Force it to run on port 5000
    app.run(debug=True, port=5000)
