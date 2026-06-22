import os
import urllib.request

base_url = "https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/"
models_dir = os.path.join(os.path.dirname(__file__), "public", "models")

if not os.path.exists(models_dir):
    os.makedirs(models_dir)

files = [
    "tiny_face_detector_model-weights_manifest.json",
    "tiny_face_detector_model-shard1",
    "face_landmark_68_model-weights_manifest.json",
    "face_landmark_68_model-shard1",
    "face_recognition_model-weights_manifest.json",
    "face_recognition_model-shard1",
    "face_recognition_model-shard2"
]

for file in files:
    url = base_url + file
    dest = os.path.join(models_dir, file)
    if not os.path.exists(dest):
        print(f"Downloading {file}...")
        urllib.request.urlretrieve(url, dest)
    else:
        print(f"File {file} already exists.")

print("All models downloaded successfully.")
