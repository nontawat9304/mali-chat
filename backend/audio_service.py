import edge_tts
import speech_recognition as sr
from pydub import AudioSegment
import io
import os
import uuid

# Configuration
# Tuning V4: "15-year-old Japanese girl" style (Simulated)
# - PITCH +60Hz: Higher pitch (Younger)
# - RATE -5%: Slightly slower than native
VOICE = "th-TH-PremwadeeNeural"
RATE = "-5%"
PITCH = "+60Hz"

async def generate_audio(text: str, output_file: str):
    # Direct Thai Text -> Thai Voice (No Transliteration needed for Premwadee)
    communicate = edge_tts.Communicate(text, VOICE, rate=RATE, pitch=PITCH)
    await communicate.save(output_file)
    return output_file

def transcribe_audio(audio_file_path: str, language="th-TH") -> str:
    recognizer = sr.Recognizer()
    
    # Convert audio to wav if needed (pydub)
    # SpeechRecognition prefers WAV
    sound = AudioSegment.from_file(audio_file_path)
    wav_path = audio_file_path + ".wav"
    sound.export(wav_path, format="wav")
    
    with sr.AudioFile(wav_path) as source:
        audio_data = recognizer.record(source)
        try:
            text = recognizer.recognize_google(audio_data, language=language)
            return text
        except sr.UnknownValueError:
            return ""
        except sr.RequestError as e:
            print(f"Could not request results; {e}")
            return ""
