from flask import Flask, render_template, request
from model import Model

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


@app.route('/airequest')
def pong_ai_algorithm():
    state = list(map(lambda s: float(s), request.args.get('state').split(",")))

    def simple_algorithm(ball_x, ball_y, ball_vx, ball_vy, player_x, player_y, player_width, player_height, paddle_x,
                          paddle_y, paddle_width, paddle_height, canvas_width, canvas_height):
        ball_radius = 10
        if ball_y - ball_radius > paddle_y + paddle_height / 2:
            return 1
        elif ball_y + ball_radius < paddle_y - paddle_height / 2:
            return -1
        return 0
    return str(simple_algorithm(*state))


@app.route('/tfrequest')
def process_request():
    state = list(map(lambda s: float(s), request.args.get('state').split(",")))
    model = Model(prev_model=Model.checkpoint_path+"model.h5")
    return str(model.pong_request(state))


@app.route('/tfteach', methods=["POST"])
def recieve_data():
    print(request.json)
    states = request.json["states"]
    Model.save_training_data(states)
    return ""


if __name__ == "__main__":
    app.run(debug=True)
