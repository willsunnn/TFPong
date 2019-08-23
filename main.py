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


@app.route('/tfrequest')
def process_request():
    state = list(map(lambda s: float(s), request.args.get('state').split(",")))
    return str(send_to_algorithm(*state))


def send_to_algorithm(ball_x, ball_y, ball_vx, ball_vy, player_y, paddle_x, paddle_y, paddle_height, canvas_width, canvas_height):
    ball_radius = 10
    if ball_y - ball_radius > paddle_y + paddle_height / 2:
        return 1
    elif ball_y + ball_radius < paddle_y - paddle_height / 2:
        return -1
    return 0


@app.route('/tfteach')
def recieve_data():
    pass
