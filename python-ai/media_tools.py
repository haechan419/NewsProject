import os
import requests
import urllib.parse
import random
import asyncio
import edge_tts
import time
from moviepy.editor import *

PEXELS_API_KEY = "V40wJCS0yZNXMGkHy3Lez2PhN5trLmxs9NNayvvpxSe9il2EvOJpfEXa"

def create_tts(text, filename):
    """파일이 정상 생성될 때까지 보장하는 TTS 생성 함수"""
    try:
        if os.path.exists(filename): os.remove(filename)
        
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        communicate = edge_tts.Communicate(text, "ko-KR-SunHiNeural")
        loop.run_until_complete(communicate.save(filename))
        loop.close()

        # 파일 생성 및 크기 검증 (최소 1KB)
        for _ in range(10):
            if os.path.exists(filename) and os.path.getsize(filename) > 1000:
                return True
            time.sleep(0.5)
        return False
    except: return False

def generate_free_image(prompt, filename, is_portrait):
    w, h = (720, 1280) if is_portrait else (1280, 720)
    url = f"https://image.pollinations.ai/prompt/{urllib.parse.quote(prompt)}?width={w}&height={h}&nologo=true&seed={random.randint(1,9999)}"
    try:
        res = requests.get(url, timeout=20)
        with open(filename, 'wb') as f: f.write(res.content)
        return True
    except: return False

def download_pexels_video(keyword, filename, is_portrait):
    orientation = "portrait" if is_portrait else "landscape"
    headers = {'Authorization': PEXELS_API_KEY}
    url = f"https://api.pexels.com/videos/search?query={keyword}&per_page=15&orientation={orientation}"
    try:
        res = requests.get(url, headers=headers).json()
        if not res.get('videos'): return False
        selected = random.choice(res['videos'])
        video_url = selected['video_files'][0]['link']
        with open(filename, 'wb') as f: f.write(requests.get(video_url).content)
        return True
    except: return False