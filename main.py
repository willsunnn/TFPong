from flask import Flask, render_template, request


app = Flask(__name__)


@app.route('/')
@app.route('/index')
def index():
    return render_template("index.html", title="Home")


@app.route('/about')
def about():
    return render_template("about.html", title="About")


@app.route('/play')
def play():
    return render_template("game.html", title="Pong")


@app.route('/run', methods=["upper"])
def func():
    if request.method == "upper":
        return "Hello World".upper()
    else:
        return "Hello World"
