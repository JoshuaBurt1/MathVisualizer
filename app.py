import json
from flask import Flask, render_template

app = Flask(__name__)

@app.route('/')
def index():
    # Open and read the local JSON file
    try:
        with open('mersenne.json', 'r') as f:
            mersenne_data = json.load(f)
    except FileNotFoundError:
        mersenne_data = [] # Fallback if file is missing

    return render_template('index.html', data=mersenne_data)

if __name__ == '__main__':
    app.run(debug=True, port=5000)