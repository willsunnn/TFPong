import tensorflow as tf
from tensorflow import keras
import numpy as np

print(tf.__version__)


def create_model():
    model = tf.keras.models.Sequential()
    return model


m = create_model()
m.summary()


def tf_pong_request(state):
    def simple_algorithm(ball_x, ball_y, ball_vx, ball_vy, player_x, player_y, player_width, player_height, paddle_x,
                          paddle_y, paddle_width, paddle_height, canvas_width, canvas_height):
        ball_radius = 10
        if ball_y - ball_radius > paddle_y + paddle_height / 2:
            return 1
        elif ball_y + ball_radius < paddle_y - paddle_height / 2:
            return -1
        return 0
    return simple_algorithm(*state)
