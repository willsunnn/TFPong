import tensorflow as tf
from tensorflow import keras
import numpy as np

print(tf.__version__)
checkpoint_path = "tf-models/"
training_data = "tf-models/training_data.txt"
old_training_data = "tf-models/old_training_data.txt"


class Model:
    checkpoint_path = checkpoint_path

    def __init__(self, prev_model=""):
        self.model = None
        if prev_model != "":
            self.model = Model.restore_model(prev_model)
        else:
            self.create_model()

    def create_model(self):
        model = tf.keras.models.Sequential([
            keras.layers.Dense(256, input_shape=[1, ], activation=tf.nn.relu),
            keras.layers.Dense(512),
            keras.layers.Dense(3, activation=tf.nn.softmax)
        ])
        model.compile(optimizer='adam', loss=tf.keras.losses.mean_squared_error)
        self.model = model

    def summary(self):
        return self.model.summary()

    def pong_request(self, state):
        predictions = self.model.predict([state])
        index = np.argmax(predictions[0])
        # index ranges from [0,2], our direction should range from [-1, 1]
        return index - 1

    @staticmethod
    def save_training_data(data):
        with open(training_data, 'w') as file:
            for states in data:
                file.write(f"{states[0]}; {states[1]}\n")

    def get_training_data(self):
        def flip_state(state):
            ball_x, ball_y, ball_vx, ball_vy, player_x, player_y, player_width, player_height, paddle_x, paddle_y, paddle_width, paddle_height, canvas_width, canvas_height = state
            modified_state = [canvas_width-ball_x, ball_y, -ball_vx, ball_vy, canvas_width-paddle_x, paddle_y, paddle_width, paddle_height, canvas_width-player_x, player_y, player_width, player_height, canvas_width, canvas_height]
            return modified_state

        with open(training_data, 'r') as new_data, open(old_training_data, 'w') as old_data:
            for line in new_data:
                old_data.write(line)
                game_state, player_move = line.split("; ")
                game_state = flip_state(map(lambda x: int(x), game_state.strip("[]").split(", ")))
                player_move = int(player_move) + 1   # player_move ranges from [-1,1], tf output ranges from [0,2]
                print(game_state, player_move)
        with open(training_data, 'w') as new_data:
            new_data.truncate(0)


    def save_model(self):
        self.model.save(Model.checkpoint_path+'model.h5')

    @staticmethod
    def convert_h5_to_protocol_buffer(path = checkpoint_path+"model.h5"):
        K = keras.backend
        model = keras.models.load_model(path)
        print(model.outputs, model.inputs)

    @staticmethod
    def restore_model(path):
        return keras.models.load_model(path)

if __name__ == "__main__":
    m = Model()
    m.train_on_training_data()