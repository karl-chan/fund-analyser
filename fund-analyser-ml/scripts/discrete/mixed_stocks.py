from keras.models import Sequential
from keras.layers import Dense
from keras.utils import to_categorical
from sklearn.model_selection import train_test_split
import pandas as pd
import numpy as np
import pdb

bounds = [-np.inf, -0.02, -0.01, 0, 0.01, 0.02, np.inf]

def pcToFloat(pc):
    return float(pc.strip("%"))/100 if isinstance(pc, str) else pc

def preprocess(df):
    target_cols = range(9, 29)
    for col in target_cols:
        df.iloc[:, col] = df.iloc[:, col].apply(pcToFloat) # convert pc strings to floats

    df = df[np.isfinite(df["returns.5Y"]) & np.isfinite(df["percentiles.1D"])] #remove nan rows

    global bounds
    x = df.iloc[:, target_cols].as_matrix()# to numpy array
    y = pd.cut(df["returns.3D"], bounds, labels=range(len(bounds)-1)).as_matrix() # categorical split at -1%, 0%, 1%
    return x, to_categorical(y)


raw = pd.read_csv("../../fund_20170710.csv")
x, y = preprocess(raw)

model = Sequential()
model.add(Dense(10, input_shape=(20,), activation="relu"))
model.add(Dense(len(bounds)-1, activation="sigmoid"))

print("Compiling model...")
model.compile(loss="categorical_crossentropy", optimizer="adam", metrics=["accuracy"])
print("Compiled model.")

print("Fitting model...")
model.fit(x, y, epochs=1000, validation_split=0.2, verbose=2)
print("Fitted model.")

print("Evaluating model...")
scores = model.evaluate(x, y)
print("Evaluated model.")
print("\n%s: %.2f%%" % (model.metrics_names[1], scores[1]*100))


test = pd.read_csv("../../fund_20170713.csv")

x_test, y_test = preprocess(test)

print("Evaluating model2...")
scores = model.evaluate(x_test, y_test)
print("Evaluated model2.")
print("\n%s: %.2f%%" % (model.metrics_names[1], scores[1]*100))

print("Predicting model2...")

# y_pred = model.predict(x[2000:])
# print(y_pred)

y_pred = model.predict(x_test)
pass