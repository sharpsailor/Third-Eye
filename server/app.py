import cv2
import numpy as np
import base64
import streamlit as st
from PIL import Image
from flask import Flask, render_template, request
from flask_cors import CORS
import json
from flask_socketio import SocketIO, emit
import io
import eventlet
eventlet.monkey_patch()
app = Flask(__name__)
app.config['SECRET_KEY'] = 'secret!'
socketio = SocketIO(
    app, cors_allowed_origins='http://localhost:3000', async_mode='eventlet')
CORS(app)


def get_predictor_model():
    from model import Model
    model = Model()
    return model


@app.route('/')
def home():
    return "Hello from the Flast Server"


@app.route('/upload-image', methods=['POST'])
def upload_image():
    model = get_predictor_model()
    req_image = request.files['image']
    image = Image.open(req_image).convert('RGB')
    image = np.array(image)
    print("image array :", image)
    label_text = model.predict(image=image)['label'].title()
    label_text_json = json.dumps(label_text)
    print(label_text_json)
    return label_text_json


@socketio.on('connect')
def handle_connect():
    print('Client connected')


@socketio.on('disconnect')
def handle_disconnect():
    print('Client disconnected')


@socketio.on('video_stream')
def handle_video_stream(data):
    client_ip = request.environ['REMOTE_ADDR']
    image_data = base64.b64decode(data.split(',')[1])
    image = Image.open(io.BytesIO(image_data)).convert('RGB')
    image = np.array(image)
    label_text = model.predict(image=image)['label'].title()
    response = {
        "ip": client_ip,
        "result": label_text
    }
    label_text_json = json.dumps(response)
    emit('result', label_text_json)


model = get_predictor_model()
if __name__ == '__main__':
    socketio.run(app, host='0.0.0.0', port=5000,
                 debug=True, use_reloader=False)
