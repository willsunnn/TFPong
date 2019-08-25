import tensorflow as tf
from tensorflow import keras
import numpy as np
import random

print(tf.__version__)
checkpoint_path = "tf-models/"
training_data = "tf-models/training_data.txt"
old_training_data = "tf-models/old_training_data.txt"


class Model:
    checkpoint_path = checkpoint_path

    def __init__(self, model=None):
        if model is None:
            self.model = Model.create_model()
        else:
            self.model = model

    @staticmethod
    def create_model():
        model = tf.keras.models.Sequential([
            keras.layers.Dense(64, input_shape=[None, 12],activation=tf.nn.relu),
            keras.layers.Dense(16),
            keras.layers.Dense(3, activation=tf.nn.softmax)
        ])
        model.compile(optimizer='adam', loss=tf.keras.losses.mean_squared_error)
        return model

    def save_model(self, path=checkpoint_path+'model.h5'):
        self.model.save(path)

    @staticmethod
    def restore_model(path=checkpoint_path+'model.h5'):
        return Model(keras.models.load_model(path))

    def summary(self):
        return self.model.summary()

    def predict(self, state):
        predictions = self.model.predict([state])
        index = np.argmax(predictions[0])
        # index ranges from [0,2], our direction should range from [-1, 1]
        return index - 1

    @staticmethod
    def save_training_data(data):
        with open(training_data, 'a') as file:
            for states in data:
                file.write(f"{states[0]}; {states[1]}\n")

    @staticmethod
    def get_training_data(archive_data=True):
        data = []
        with open(training_data, 'r') as new_data, open(old_training_data, 'a') as old_data:
            for line in new_data:
                if archive_data:
                    old_data.write(str(line))
                game_state, player_move = line.split("; ")
                game_state = Model.preprocess_data(Model.flip_state(map(lambda x: int(x), game_state.strip("[]").split(", "))))
                player_move = [int(player_move) + 1]        # player_move ranges from [-1,1], tf output ranges from [0,2]
                data.append([game_state, player_move])
        if archive_data:
            with open(training_data, 'w') as new_data:
                new_data.truncate(0)
        return data

    @staticmethod
    def flip_state(state):  # flips the game as the data being trained is from the opposite paddle's perspective
        ball_x, ball_y, ball_vx, ball_vy, player_x, player_y, player_width, player_height, paddle_x, paddle_y, paddle_width, paddle_height, canvas_width, canvas_height = state
        return [canvas_width - ball_x, ball_y, -ball_vx, ball_vy, canvas_width - paddle_x, paddle_y,
                paddle_width, paddle_height, canvas_width - player_x, player_y, player_width, player_height,
                canvas_width, canvas_height]

    @staticmethod
    def preprocess_data(state):  # puts values from 0-1
        ball_x, ball_y, ball_vx, ball_vy, player_x, player_y, player_width, player_height, paddle_x, paddle_y, paddle_width, paddle_height, canvas_width, canvas_height = state
        return [[ball_x / canvas_width, ball_y / canvas_height, ball_vx / canvas_width,
                ball_vy / canvas_height, player_x / canvas_width, player_y / canvas_height,
                player_width / canvas_width, player_height / canvas_height, paddle_x / canvas_width,
                paddle_y / canvas_height, paddle_width / canvas_width, paddle_height / canvas_height]]

    def train_model(self):
        data = list(model.get_training_data(archive_data=False))
        random.shuffle(data)
        x_train, y_train = [], []
        for pair in data:
            x_train.append(pair[0])
            y_train.append(pair[1])
        x_train = np.array(x_train).reshape(-1, 1, 12)
        y_train = np.array(y_train)
        print(np.shape(x_train))
        history = self.model.fit(x=x_train, y=y_train, epochs=10)


if __name__ == "__main__":
    model = Model()
    model.train_model()
    model.save_model()