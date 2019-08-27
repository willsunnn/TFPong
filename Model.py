import tensorflow as tf
from tensorflow import keras
import numpy as np
import random
from tensorflow.python.platform import gfile


directory_path = "tf-models/"
training_data = directory_path + "training_data.txt"
old_training_data = directory_path + "old_training_data.txt"
h5_path = directory_path + "model.h5"
protobuf_file = directory_path + "model.pb"
protobuf_txt_file = directory_path + "model.pbtxt"


class Model:
    directory_path = directory_path
    h5_path = h5_path
    protobuf_file = protobuf_file
    protobuf_txt_file = protobuf_txt_file

    input_layer_name = "game_state"
    output_layer_name = "move_layer"

    def __init__(self, model=None):
        if model is None:
            self.model = Model.create_model()
        else:
            self.model = model

    @staticmethod
    def create_model():
        model = tf.keras.models.Sequential([
            keras.layers.Dense(64, input_shape=[1, 12], activation=tf.nn.relu, name=Model.input_layer_name),
            keras.layers.Dense(64),
            keras.layers.Dense(16),
            keras.layers.Dense(3, activation=tf.nn.softmax, name=Model.output_layer_name)
        ])
        model.compile(optimizer='adam', loss=tf.keras.losses.mean_squared_error)
        return model

    def save_model(self, path=h5_path):
        self.model.save(path)

    @staticmethod
    def restore_model(path=h5_path):
        return Model(keras.models.load_model(path))

    def summary(self):
        return self.model.summary()

    def predict(self, state):
        state = Model.preprocess_data(state)
        data = np.array([state])
        predictions = self.model.predict(data)
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
                player_move = [int(player_move) + 1]       # player_move ranges from [-1,1], tf output ranges from [0,2]
                data.append([game_state, player_move])
        if archive_data:
            with open(training_data, 'w') as new_data:
                new_data.truncate(0)
        return data

    @staticmethod
    def flip_state(state):  # flips the game as the data being trained is from the opposite paddle's perspective
        ball_x, ball_y, ball_vx, ball_vy, player_x, player_y, player_width, player_height, paddle_x, paddle_y, paddle_width, paddle_height, canvas_width, canvas_height = state
        return [canvas_width - ball_x, canvas_height - ball_y, -ball_vx, -ball_vy, canvas_width - paddle_x,
                canvas_height - paddle_y, paddle_width, paddle_height, canvas_width - player_x, canvas_height - player_y,
                player_width, player_height, canvas_width, canvas_height]

    @staticmethod
    def preprocess_data(state):  # puts values from 0-1
        ball_x, ball_y, ball_vx, ball_vy, player_x, player_y, player_width, player_height, paddle_x, paddle_y, paddle_width, paddle_height, canvas_width, canvas_height = state
        return [[ball_x / canvas_width, ball_y / canvas_height, ball_vx / canvas_width,
                ball_vy / canvas_height, player_x / canvas_width, player_y / canvas_height,
                player_width / canvas_width, player_height / canvas_height, paddle_x / canvas_width,
                paddle_y / canvas_height, paddle_width / canvas_width, paddle_height / canvas_height]]

    def train_model(self, archive_data=True):
        data = list(Model.get_training_data(archive_data=archive_data))
        random.shuffle(data)
        x_train, y_train = [], []
        for pair in data:
            x_train.append(pair[0])
            y_train.append(pair[1])
        x_train = np.array(x_train).reshape(-1, 1, 12)
        y_train = np.array(y_train)
        history = self.model.fit(x=x_train, y=y_train, epochs=10)
        print(history)

    def freeze_graph(self):
        # HELPER METHOD TAKEN FROM: medium.com/@pipidog/how-to-convert-your-keras-models-to-tensorflow-e471400b886a
        def freeze_session(session, keep_var_names=None, output_names=None, clear_devices=True):
            from tensorflow.python.framework.graph_util import convert_variables_to_constants
            graph = session.graph
            with graph.as_default():
                freeze_var_names = list(set(v.op.name for v in tf.global_variables()).difference(keep_var_names or []))
                output_names = output_names or []
                output_names += [v.op.name for v in tf.global_variables()]
                # Convert graph to graph protobuf
                input_graph_def = graph.as_graph_def()
                if clear_devices:
                    for node in input_graph_def.node:
                        node.device = ""
                frozen_graph = convert_variables_to_constants(session, input_graph_def, output_names, freeze_var_names)
                return frozen_graph
        tf.keras.backend.set_learning_phase(0)
        graph = freeze_session(tf.keras.backend.get_session(), output_names=[out.op.name for out in self.model.outputs])
        tf.train.write_graph(graph, Model.directory_path, 'model.pb', as_text=False)

    @staticmethod
    def predict_from_frozen(state):
        state = np.array(Model.preprocess_data(state))
        with tf.Session() as sess, gfile.FastGFile(Model.protobuf_file, 'rb') as f:
            graph_def = tf.GraphDef()
            graph_def.ParseFromString(f.read())
            sess.graph.as_default()
            g_in = tf.import_graph_def(graph_def)
            tensor_output = sess.graph.get_tensor_by_name('import/move_layer/truediv:0')
            tensor_input = sess.graph.get_tensor_by_name('import/game_state_input:0')
            predictions = sess.run(tensor_output, {tensor_input: [state]})
            return np.argmax(predictions[0][0])-1


if __name__ == "__main__":
    m = Model.restore_model()
    print("Model successfully restored")
    try:
        m.train_model(archive_data=True)
        print("Model successfully trained")
    except ValueError:  # empty training data
        print("No new training data was found")
    m.save_model()
    print("Model successfuly saved to /tf-models/model.h5")
    m.freeze_graph()
    print("Model successfuly frozen to /tf-models/model.pb")
