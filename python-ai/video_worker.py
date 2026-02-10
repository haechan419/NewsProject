import os
import time
import json
import re
import mysql.connector
from moviepy.config import change_settings 
from moviepy.editor import *
from moviepy.audio.AudioClip import AudioClip 
from moviepy.audio.fx.all import audio_fadein, audio_fadeout
<<<<<<< HEAD
from dotenv import load_dotenv
import media_tools 
import openai

# [1. 경로 및 환경 설정]
# .env 파일에서 환경 변수 로드
load_dotenv()

# 이미지매직 경로 (사용자님 환경 유지)
IMAGEMAGICK_BINARY = r"D:\ImageMagick-7.1.2-Q16-HDRI\magick.exe"
change_settings({"IMAGEMAGICK_BINARY": IMAGEMAGICK_BINARY})

#OpenAI API Key 설정 (.env 파일에서 로드)
openai.api_key = os.getenv("OPENAI_API_KEY")
if not openai.api_key:
    print("[경고] OPENAI_API_KEY가 .env 파일에 설정되지 않았습니다.")


# 팀 프로젝트 DB 설정 (newsdb로 통합)
DB_CONFIG = {
    'host': 'localhost', 
    'user': 'newsuser', 
    'password': 'newsuser', 
    'database': 'newsdb' # 데이터베이스명 수정 완료
}

# 영상 결과물이 저장될 백엔드 경로 (Spring Boot upload 폴더)
# 구조: NEWSPROJECT-MASTER/fullStc/upload/videos
OUTPUT_DIR = r"D:\NewsProject-master\NewsProject-master\fullStc\upload\videos"
if not os.path.exists(OUTPUT_DIR):
    os.makedirs(OUTPUT_DIR)

# ------------------------------------------------------------------------------
# [2. AI Director: 스토리보드 생성]
# ------------------------------------------------------------------------------
def get_storyboard_from_ai(news_text):
    print("[AI Director] 뉴스 요약본 기반 영상 구성 중...")
    system_prompt = """
    너는 전문 뉴스 영상 편집자야. 다음 단계를 거쳐 30초 이내의 숏폼 스크립트를 짜줘.

    1. [전체 맥락 파악]: 입력된 기사 전체의 핵심 주제를 먼저 파악해.
    2. [장면 구성]: 기사를 서론-본론-결론 3장면으로 요약해.
    3. [키워드 선언]: 각 문장의 키워드는 '전체 주제'와 '해당 문장'의 연결고리를 고려해 작성해.
       - 반드시 **구체적인 시각적 묘사가 담긴 영어(English)**로 작성할 것.
       - 예: 전체 주제가 '삼성 반도체'라면, '혁신'이라는 문장의 키워드는 'Innovation'이 아니라 
         'Advanced microchip glowing circuit board'와 같이 해당 맥락의 사물로 지정해.
    4. [시간 제한]: 전체 분량은 25~30초 사이, 총 글자 수는 150자 이내로 제한해.

    출력 형식: 오직 JSON [ {"text": "...", "keyword": "...", "type": "video"} ]
    """
=======
import media_tools 
import openai

# [1. 설정]
IMAGEMAGICK_BINARY = r"D:\ImageMagick-7.1.2-Q16-HDRI\magick.exe"
change_settings({"IMAGEMAGICK_BINARY": IMAGEMAGICK_BINARY})

DB_CONFIG = {
    'host': 'localhost', 
    'user': 'root', 
    'password': '1234', 
    'database': 'newsdb'
}

OUTPUT_DIR = r"D:\1teamnews\fullStc\upload\videos"
if not os.path.exists(OUTPUT_DIR):
    os.makedirs(OUTPUT_DIR)

# [2. AI 스토리보드 생성]
def get_storyboard_from_ai(news_text):
    print("🤖 [AI Director] 맥락 인지형 스크립트 구성 중...")
    system_prompt = "너는 '30초 뉴스' 편집자야. 형식: JSON [ {'text': '...', 'keyword': '...', 'type': 'video'} ] 만 출력해."
>>>>>>> a946f6f6b18974710cc396ee87547a607e4cf163
    try:
        response = openai.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "system", "content": system_prompt}, {"role": "user", "content": news_text}]
        )
        content = response.choices[0].message.content.strip()
<<<<<<< HEAD
        content = content.replace("```json", "").replace("```", "").strip()
        match = re.search(r'\[.*\]', content, re.DOTALL)
        return json.loads(match.group()) if match else None
    except Exception as e:
        print(f"[AI 분석 오류] {e}")
        return None

# ------------------------------------------------------------------------------
# [3. 장면 제작 로직 (사용자 원본 유지)]
# ------------------------------------------------------------------------------
=======
        match = re.search(r'\[.*\]', content.replace("```json", "").replace("```", ""), re.DOTALL)
        return json.loads(match.group()) if match else None
    except Exception as e:
        print(f"⚠️ AI 분석 오류 (API키/잔액 확인 필요): {e}")
        return None

# [3. 보조 함수들]
>>>>>>> a946f6f6b18974710cc396ee87547a607e4cf163
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

<<<<<<< HEAD
def get_compatible_silence(duration, reference_clip):
    fps, nchannels = reference_clip.fps, reference_clip.nchannels
    make_frame = lambda t: [0]*nchannels if nchannels > 1 else 0
    return AudioClip(make_frame, duration=duration, fps=fps)

def make_scene_clip(text, keyword, media_type, index, video_mode="16:9"):
    is_portrait = (video_mode == "9:16")
    target_w, target_h = (720, 1280) if is_portrait else (1280, 720)
    font_scale = 0.065 if is_portrait else 0.045
    subtitle_max_len = 16 if is_portrait else 25
    
    audio_path = os.path.abspath(f"temp_audio_{index}.mp3")
    media_path_base = os.path.abspath(f"temp_media_{index}")
    temp_files = [audio_path]
    
    media_tools.create_tts(text, audio_path)
    time.sleep(1.0)
    tts_clip = AudioFileClip(audio_path)
    
    # 오디오 패딩
    p_start = get_compatible_silence(0.1, tts_clip)
    p_end = get_compatible_silence(0.5, tts_clip)
    tts_clip = tts_clip.fx(audio_fadein, 0.05).fx(audio_fadeout, 0.1)
    final_audio = concatenate_audioclips([p_start, tts_clip, p_end])
    duration = final_audio.duration

    # 비주얼 소스 확보
    visual_clip = None
    media_path_img = media_path_base + ".jpg"
    media_path_vid = media_path_base + ".mp4"

    if media_type == 'image':
        if media_tools.generate_free_image(keyword, media_path_img, is_portrait):
            visual_clip = ImageClip(media_path_img).set_duration(duration)
            temp_files.append(media_path_img)

    if visual_clip is None: # 비디오 시도
        if media_tools.download_pexels_video(keyword, media_path_vid, is_portrait):
            visual_clip = VideoFileClip(media_path_vid)
            temp_files.append(media_path_vid)
        else:
            visual_clip = ColorClip(size=(target_w, target_h), color=(30, 30, 30)).set_duration(duration)

    visual_clip = visual_clip.resize(newsize=(target_w, target_h))
    if hasattr(visual_clip, 'duration'):
        visual_clip = vfx.loop(visual_clip, duration=duration) if visual_clip.duration < duration else visual_clip.subclip(0, duration)
    
    visual_clip = visual_clip.set_audio(final_audio)

    # 자막 생성
    text_chunks = split_text_natural(text, min_len=8, max_len=subtitle_max_len)
    active_duration = tts_clip.duration
    start_time = 0.1
    sub_clips = []
    
    for chunk in text_chunks:
        c_duration = (len(chunk)/len(text)) * active_duration
        txt = TextClip(chunk, fontsize=int(target_w*font_scale), color='white', font="C:/Windows/Fonts/malgun.ttf", 
                       method='caption', align='center', size=(int(target_w*0.9), None))
        bg = ColorClip(size=(target_w, txt.h + 50), color=(0,0,0)).set_opacity(0.6)
        block = CompositeVideoClip([bg, txt.set_position('center')], size=bg.size).set_position(('center', 'bottom')).set_start(start_time).set_duration(c_duration)
        sub_clips.append(block)
        start_time += c_duration

    return CompositeVideoClip([visual_clip] + sub_clips), temp_files

# ------------------------------------------------------------------------------
# [4. 메인 루프: DB 연동 및 작업 처리]
# ------------------------------------------------------------------------------
def run_engine():
    print("[Engine] 뉴스 영상 제작 일꾼이 출근했습니다! (newsdb 감시 중)")
    while True:
        conn = None
=======
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

    return visual_clip.set_audio(tts_clip), temp_files

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

>>>>>>> a946f6f6b18974710cc396ee87547a607e4cf163
        try:
            conn = mysql.connector.connect(**DB_CONFIG)
            cursor = conn.cursor(dictionary=True)
            
<<<<<<< HEAD
            # PENDING 상태인 작업 1개 가져오기
            cursor.execute("""
    SELECT * FROM tbl_video_task 
    WHERE status = 'PENDING' 
    AND regdate > NOW() - INTERVAL 15 MINUTE
    ORDER BY vno ASC LIMIT 1
""")
=======
            cursor.execute("""
                SELECT * FROM tbl_video_task 
                WHERE status = 'PENDING' 
                ORDER BY vno ASC LIMIT 1
            """)
>>>>>>> a946f6f6b18974710cc396ee87547a607e4cf163
            task = cursor.fetchone()

            if task:
                vno = task['vno']
<<<<<<< HEAD
                print(f"[Job {vno}] 제작을 시작합니다. (유형: {task['task_type']})")
                
                cursor.execute("UPDATE tbl_video_task SET status = 'PROCESSING' WHERE vno = %s", (vno,))
                conn.commit()

                # 스토리보드 생성
                story_board = get_storyboard_from_ai(task['raw_text'])
                if not story_board:
                    story_board = [{"text": "기사를 분석하는 중입니다.", "keyword": "digital news", "type": "video"}]

                final_clips, all_temps = [], []
                for i, scene in enumerate(story_board):
                    # video_mode 컬럼이 없을 경우를 대비해 기본값 "16:9" 사용
                    v_mode = task.get('video_mode', '16:9')
                    clip, files = make_scene_clip(scene.get('text', ''), scene.get('keyword', 'news'), scene.get('type', 'video'), i, v_mode)
                    final_clips.append(clip)
                    all_temps.extend(files)

                # 결과물 파일명 및 저장 경로 설정
                file_name = f"result_vno_{vno}.mp4"
                save_path = os.path.join(OUTPUT_DIR, file_name)

                final_video = concatenate_videoclips(final_clips, method="compose")
                final_video.write_videofile(save_path, fps=24, codec='libx264', audio_codec='libmp3lame', threads=4)
                
                # 자원 해제 (WinError 32 방지)
                final_video.close()
                for c in final_clips: c.close()
                time.sleep(2)

                # DB 업데이트 (완료 상태 및 영상 URL 저장)
                cursor.execute("UPDATE tbl_video_task SET status = 'COMPLETED', video_url=%s WHERE vno = %s", (file_name, vno))
                conn.commit()
                print(f"[Job {vno}] 제작 완료! 저장 위치: {save_path}")
                
                # 임시 파일 삭제
                for f in all_temps:
                    if f and os.path.exists(f):
                        try: os.remove(f)
                        except: pass
            
            cursor.close()
        except Exception as e:
            print(f"[Error] 엔진 작동 중 에러 발생: {e}")
        finally: 
            if conn: conn.close()
        
        time.sleep(10) # 10초마다 DB 확인
=======
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
>>>>>>> a946f6f6b18974710cc396ee87547a607e4cf163

if __name__ == "__main__":
    run_engine()