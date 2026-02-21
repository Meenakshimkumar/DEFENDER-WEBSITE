import os
from transformers import pipeline

if __name__ == "__main__":
    audio_classifier = pipeline("audio-classification", model="MIT/ast-finetuned-audioset-10-10-0.4593")
    print("Model loaded")
    import urllib.request
    urllib.request.urlretrieve("https://huggingface.co/datasets/Narsil/asr_dummy/resolve/main/mlk.flac", "test.flac")
    print(audio_classifier("test.flac"))
