import json
from flask import Flask, render_template

app = Flask(__name__)

@app.route('/')
def index():
    combined_data = []
    
    # Load 2^p - 1
    try:
        with open('2^p-1.json', 'r') as f:
            minus_data = json.load(f)
            for entry in minus_data: 
                entry['type'] = 'minus' # Label as 2^p - 1
            combined_data.extend(minus_data)
    except FileNotFoundError:
        pass

    # Load 2^p + 1
    try:
        with open('2^p+1.json', 'r') as f:
            plus_data = json.load(f)
            for entry in plus_data: 
                entry['type'] = 'plus' # Label as 2^p + 1
            combined_data.extend(plus_data)
    except FileNotFoundError:
        pass

    return render_template('index.html', data=combined_data)

if __name__ == '__main__':
    app.run(debug=True, port=5000)