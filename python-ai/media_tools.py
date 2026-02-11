import os
import requests
import urllib.parse
import random
import asyncio
import edge_tts
import time
from huggingface_hub import InferenceClient
from dotenv import load_dotenv

load_dotenv()
# 환경 변수에서 가져오기
HF_TOKEN = os.getenv("HF_TOKEN")
PEXELS_API_KEY = os.getenv("PEXELS_API_KEY")

if not HF_TOKEN:
    print("⚠️ 경고: .env 파일에서 HF_TOKEN을 찾을 수 없습니다.")

# 허깅페이스 공식 클라이언트 초기화
hf_client = InferenceClient(token=HF_TOKEN)

def create_tts(text, filename):
    try:
        if os.path.exists(filename): os.remove(filename)
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        communicate = edge_tts.Communicate(text, "ko-KR-SunHiNeural")
        loop.run_until_complete(communicate.save(filename))
        loop.close()
        return os.path.exists(filename) and os.path.getsize(filename) > 1000
    except: return False

def generate_free_image(prompt, filename, is_portrait):
    try:
        print(f"🎨 [HF Client] 이미지 생성 요청 중: {prompt[:15]}...")

        # 1. 비율에 따른 키워드 설정
        # 9:16(세로)일 때와 16:9(가로)일 때 AI에게 줄 힌트를 다르게 합니다.
        if is_portrait:
            ratio_desc = "vertical smartphone portrait orientation, 9:16 aspect ratio"
        else:
            ratio_desc = "wide cinematic landscape orientation, 16:9 aspect ratio"

        # 2. 프롬프트 재구성 (비율 설명 추가 및 불필요한 단어 정리)
        enhanced_prompt = (
            f"A photorealistic editorial shot of {prompt}, {ratio_desc}, "
            f"professional photography, cinematic lighting, 4k, high resolution, "
            f"detailed texture, no cameras, no journalists."
        )

        # 3. 이미지 생성 요청
        image = hf_client.text_to_image(
            enhanced_prompt,
            model="black-forest-labs/FLUX.1-schnell"
        )

        # 결과 저장
        image.save(filename)

        # 파일 크기 검사
        if os.path.getsize(filename) < 10000:
            raise Exception("Generated image is too small (possible error image)")

        print(f"✅ [HF Client] 이미지 생성 성공: {filename} (Portrait: {is_portrait})")
        return True

    except Exception as e:
        print(f"❌ HF 에러 발생: {e}")
        return _generate_pollinations_backup(prompt, filename, is_portrait)

def _generate_pollinations_backup(prompt, filename, is_portrait):
    """
    허깅페이스가 응답하지 않을 때만 작동하는 백업 로직입니다.
    사용자님이 로그인하신 상태이므로 시드값을 섞어 제한을 피합니다.
    """
    w, h = (720, 1280) if is_portrait else (1280, 720)
    seed = random.randint(1, 999999)
    url = f"https://image.pollinations.ai/prompt/{urllib.parse.quote(prompt)}?width={w}&height={h}&nologo=true&seed={seed}&model=flux"
    try:
        res = requests.get(url, timeout=25)
        if res.status_code == 200:
            with open(filename, 'wb') as f: f.write(res.content)
            print(f"⚠️ HF 실패로 인해 Pollinations 백업본 사용됨")
            return True
        return False
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