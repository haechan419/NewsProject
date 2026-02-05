import os
import time
import json
import re
import mysql.connector
from moviepy.config import change_settings 
from moviepy.editor import *
from moviepy.audio.AudioClip import AudioClip 
from moviepy.audio.fx.all import audio_fadein, audio_fadeout
import media_tools 
import openai

# Pillow 10.0.0 이상 호환성 패치 (ANTIALIAS 제거 대응)
try:
    from PIL import Image
    # Pillow 10.0.0 이상에서는 ANTIALIAS가 제거되었으므로 LANCZOS로 대체
    if not hasattr(Image, 'ANTIALIAS'):
        Image.ANTIALIAS = Image.LANCZOS
except ImportError:
    pass

# [1. 설정]
IMAGEMAGICK_BINARY = r"D:\ImageMagick-7.1.2-Q16-HDRI\magick.exe"
change_settings({"IMAGEMAGICK_BINARY": IMAGEMAGICK_BINARY})

DB_CONFIG = {
    'host': 'localhost', 
    'user': 'newsuser', 
    'password': 'newsuser', 
    'database': 'newsdb'
}

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
OUTPUT_DIR = os.path.join(BASE_DIR, "videos")
if not os.path.exists(OUTPUT_DIR):
    try:
        os.makedirs(OUTPUT_DIR)
        print(f"✅ 폴더 생성 성공: {OUTPUT_DIR}")
    except Exception as e:
        print(f"❌ 폴더 생성 실패: {e}")

# [2. AI 스토리보드 생성]
def get_storyboard_from_ai(news_text):
    print("🤖 [AI Director] 맥락 인지형 스크립트 구성 중...")
    system_prompt = "너는 '30초 뉴스' 편집자야. 형식: JSON [ {'text': '...', 'keyword': '...', 'type': 'video'} ] 만 출력해."
    try:
        response = openai.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "system", "content": system_prompt}, {"role": "user", "content": news_text}]
        )
        content = response.choices[0].message.content.strip()
        match = re.search(r'\[.*\]', content.replace("```json", "").replace("```", ""), re.DOTALL)
        return json.loads(match.group()) if match else None
    except Exception as e:
        print(f"⚠️ AI 분석 오류 (API키/잔액 확인 필요): {e}")
        return None

# [3. 보조 함수들]
def split_text_natural(text, min_len=8, max_len=18):
    words = text.split(' ')
    chunks, current_chunk, current_len = [], [], 0
    markers = ["은", "는", "이", "가", "을", "를", "에", "서", "로", "고", "며", "요", "죠", "다"]
    for word in words:
        current_chunk.append(word); current_len += len(word) + 1
        if current_len >= max_len or (current_len >= min_len and any(word.endswith(m) for m in markers)):
            chunks.append(' '.join(current_chunk)); current_chunk, current_len = [], 0
    if current_chunk: chunks.append(' '.join(current_chunk))
    return chunks

def make_scene_clip(text, keyword, media_type, index, video_mode="16:9"):
    is_portrait = (video_mode == "9:16")
    target_w, target_h = (720, 1280) if is_portrait else (1280, 720)
    audio_path = os.path.abspath(f"temp_audio_{index}.mp3")
    media_path_img = os.path.abspath(f"temp_media_{index}.jpg")
    media_path_vid = os.path.abspath(f"temp_media_{index}.mp4")
    temp_files = [audio_path]

    if not media_tools.create_tts(text, audio_path): return None, []
    
    tts_clip = AudioFileClip(audio_path)
    duration = tts_clip.duration + 0.6
    
    visual_clip = None
    if media_type == 'image' and media_tools.generate_free_image(keyword, media_path_img, is_portrait):
        visual_clip = ImageClip(media_path_img).set_duration(duration)
        temp_files.append(media_path_img)
    elif media_tools.download_pexels_video(keyword, media_path_vid, is_portrait):
        visual_clip = VideoFileClip(media_path_vid)
        temp_files.append(media_path_vid)
    
    if visual_clip is None:
        visual_clip = ColorClip(size=(target_w, target_h), color=(30, 30, 30)).set_duration(duration)

    visual_clip = visual_clip.resize(newsize=(target_w, target_h))
    if hasattr(visual_clip, 'duration') and visual_clip.duration < duration:
        visual_clip = vfx.loop(visual_clip, duration=duration)
    else:
        visual_clip = visual_clip.subclip(0, duration)

    # --------------------------------------------------------
    # ✅ 수정 포인트: sub_clips 변수를 먼저 빈 리스트로 만들어줍니다.
    # --------------------------------------------------------
    sub_clips = [] 
    
    # (선택 사항) 만약 화면에 자막을 넣고 싶다면, 
    # 여기서 TextClip을 생성해서 sub_clips.append(자막클립)를 하면 됩니다.
    # 지금은 자막 로직이 없으므로 빈 리스트로 둡니다.
    # --------------------------------------------------------

    final_scene = CompositeVideoClip([visual_clip] + sub_clips)
    return final_scene.set_audio(tts_clip), temp_files

# [4. 메인 엔진 루프]
def run_engine():
    print("🚀 [Engine] 뉴스 영상 제작 엔진 가동 시작!")
    while True:
        # ★ 중요: 모든 주요 변수를 루프 시작 시 None으로 초기화 (NameError 방지)
        conn = None
        task = None
        final_video = None
        final_clips = []
        all_temps = []

        try:
            conn = mysql.connector.connect(**DB_CONFIG)
            cursor = conn.cursor(dictionary=True)
            
            cursor.execute("""
                SELECT * FROM tbl_video_task 
                WHERE status = 'PENDING' 
                ORDER BY vno ASC LIMIT 1
            """)
            task = cursor.fetchone()

            if task:
                vno = task['vno']
                cursor.execute("UPDATE tbl_video_task SET status = 'PROCESSING' WHERE vno = %s", (vno,))
                conn.commit()
                print(f"🎬 [Job {vno}] 제작을 시작합니다.")

                # AI 분석 수행
                story_board = get_storyboard_from_ai(task['raw_text'])
                
                # AI 분석 실패 시 (API키 오류 등)
                if not story_board:
                    print(f"❌ [Job {vno}] AI 분석 실패. 작업을 중단합니다.")
                    cursor.execute("UPDATE tbl_video_task SET status = 'FAILED' WHERE vno = %s", (vno,))
                    conn.commit()
                    continue

                v_mode = task.get('video_mode', '9:16')
                for i, scene in enumerate(story_board):
                    clip, files = make_scene_clip(scene['text'], scene['keyword'], scene['type'], i, v_mode)
                    if clip:
                        final_clips.append(clip)
                        all_temps.extend(files)

                if final_clips:
                    file_name = f"result_vno_{vno}.mp4"
                    save_path = os.path.join(OUTPUT_DIR, file_name)
                    
                    final_video = concatenate_videoclips(final_clips, method="compose")
                    final_video.write_videofile(save_path, fps=24, codec='libx264', audio_codec='libmp3lame', threads=4)
                    
                    cursor.execute("UPDATE tbl_video_task SET status = 'COMPLETED', video_url=%s WHERE vno = %s", (file_name, vno))
                    conn.commit()
                    print(f"✅ [Job {vno}] 제작 완료!")

            cursor.close()
        except Exception as e:
            # task 변수가 정의된 경우에만 작업 번호 출력
            vno_str = f"Job {task['vno']}" if task else "Unknown Job"
            print(f"❌ [Error] {vno_str} 엔진 작동 중 에러 발생: {e}")
        finally: 
            # ★ 자원 해제 안전장치 (정의 여부 확인 후 닫기)
            if final_video: 
                try: final_video.close()
                except: pass
            for c in final_clips: 
                try: c.close()
                except: pass
            if conn and conn.is_connected(): 
                conn.close()
            
            # 임시 파일 삭제
            for f in all_temps:
                if f and os.path.exists(f):
                    try: os.remove(f)
                    except: pass
        
        time.sleep(10)

if __name__ == "__main__":
    run_engine()