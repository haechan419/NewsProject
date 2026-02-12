import os, time, json, re, mysql.connector
from moviepy.config import change_settings
from moviepy.editor import *
import media_tools
import openai
from dotenv import load_dotenv

# [.env 파일 로드 및 환경 설정]
load_dotenv()
openai.api_key = os.getenv("OPENAI_API_KEY")

# [1. 환경 설정]
IMAGEMAGICK_BINARY =os.getenv("IMAGEMAGICK_PATH")
change_settings({"IMAGEMAGICK_BINARY": IMAGEMAGICK_BINARY})

# DB설정 연동
DB_CONFIG = {
    'host': os.getenv("DB_HOST"),
    'user': os.getenv("DB_USER"),
    'password': os.getenv("DB_PASS"),
    'database': os.getenv("DB_NAME")
}
print(f"DEBUG: DB 접속 시도 유저 -> {os.getenv('DB_USER')}")
print(f"DEBUG: DB 접속 시도 호스트 -> {os.getenv('DB_HOST')}")
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
OUTPUT_DIR = os.path.join(BASE_DIR, "videos")
# videos 폴더가 없으면 자동 생성
os.makedirs(OUTPUT_DIR, exist_ok=True)

# [2. AI 스토리보드 - 문맥 중심 고퀄리티 리포트]
def get_storyboard_from_ai(news_text):
    print("🤖 [AI Director] 문맥 중심 고퀄리티 대본 구성 중...")
    system_prompt = """
    너는 시청률 1위 뉴스의 수석 작가야. 딱딱한 정보를 시청자가 편하게 들을 수 있는 '스토리텔링형 뉴스'로 재구성해줘.
    [작성 규칙]
    1. 맥락 전환: '한편', '이어서' 대신 "IT 소식에 이어 이번엔 경제 동향 짚어봅니다"처럼 자연스럽게 연결해.
    2. 전문 어미: "~인 것으로 알려졌습니다", "~할 전망입니다" 사용.
    3. 자막 최적화: 자막 1줄 분량인 공백 포함 30~35자 내외가 가장 좋아.
    4. 시각화: 특정 인물/기업은 'image', 일반 배경은 'video'로 지정해.
    형식: JSON [ {"text": "자연스러운 멘트", "keyword": "영어 키워드", "type": "video|image"} ]
    """
    try:
        response = openai.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": f"다음 기사들을 엮어줘: {news_text}"}
            ],
            temperature=0.8
        )
        content = response.choices[0].message.content.strip()
        match = re.search(r'\[.*\]', content.replace("```json", "").replace("```", ""), re.DOTALL)
        return json.loads(match.group()) if match else None
    except Exception as e:
        print(f"⚠️ 대본 생성 오류: {e}"); return None

# [2.5 한국형 상징물 & 지역 최적화 필터]
def apply_korean_context_filter(keyword):
    """AI가 생성한 영어 키워드를 한국적 상징물로 치환합니다."""
    k = keyword.lower()

    # 1. 정치 및 인물 상징화 (인물 실명 대신 상징물로)
    politics_map = {
        "politician": "The National Assembly of the Republic of Korea, Yeouido",
        "assembly": "The National Assembly of the Republic of Korea building",
        "prosecutor": "Supreme Prosecutors Office of the Republic of Korea building, Seoul",
        "investigation": "Press conference with many microphones and camera flashes, professional news",
        "court": "The Supreme Court of Korea gavel and scales of justice",
        "president": "The Office of the President of the Republic of Korea, Yongsan",
    }

    # 2. 한국 도시별 대표 랜드마크 (해외 도시 방지)
    city_map = {
        "seoul": "N Seoul Tower and Han River cityscape",
        "incheon": "Incheon Bridge South Korea",
        "busan": "Gwangandaegyo Bridge Busan",
        "daegu": "83 Tower night view Daegu"
    }

    # 키워드 매칭 (가장 먼저 발견되는 상징물 적용)
    for key, val in politics_map.items():
        if key in k: return val
    for key, val in city_map.items():
        if key in k: return val

    # 기본: 한국적 맥락 강제 부여
    return f"{keyword}, South Korea style"

# [3. 장면 제작 - 고정 자막 및 분할 로직 핵심]
def make_hybrid_scene(scene, index, video_mode="16:9"):
    is_portrait = (video_mode == "9:16")
    target_w, target_h = (720, 1280) if is_portrait else (1280, 720)
    audio_path = os.path.join(BASE_DIR, f"temp_audio_{index}.mp3")
    media_path = os.path.join(BASE_DIR, f"temp_media_{index}")
    filtered_k = apply_korean_context_filter(scene.get('keyword', 'news'))
    print(f"🔍 [Filter] '{scene['keyword']}' -> '{filtered_k}'")

    # 1. TTS 및 오디오
    if not media_tools.create_tts(scene['text'], audio_path): return None, []
    tts_clip = AudioFileClip(audio_path)
    duration = tts_clip.duration
    temp_files = [audio_path]

    # 2. 비주얼 로직 (이전과 동일)
    visual_clip = None
    if scene['type'] == 'image':
        img_file = media_path + ".jpg"
        if media_tools.generate_free_image(filtered_k, img_file, is_portrait):
            visual_clip = ImageClip(img_file).set_duration(duration + 0.5)
            temp_files.append(img_file)

    if visual_clip is None:
        vid_file = media_path + ".mp4"
        if media_tools.download_pexels_video(scene['keyword'], vid_file, is_portrait):
            raw = VideoFileClip(vid_file)
            visual_clip = vfx.loop(raw, duration=duration + 1) if raw.duration < duration else raw
            temp_files.append(vid_file)
        else:
            img_file = media_path + "_fallback.jpg"
            if media_tools.generate_free_image(scene['keyword'], img_file, is_portrait):
                visual_clip = ImageClip(img_file).set_duration(duration + 0.5)
                temp_files.append(img_file)
            else:
                visual_clip = ColorClip(size=(target_w, target_h), color=(30, 30, 30)).set_duration(duration)

    #화면 리사이징 처리 => 일단 주석처리
    # visual_clip = visual_clip.resize(newsize=(target_w, target_h)).subclip(0, duration)


    # 비율 채우기 및 크롭
    img_w, img_h = visual_clip.size
    target_ratio = target_w / target_h
    img_ratio = img_w / img_h

    if img_ratio > target_ratio:
        # 이미지가 더 가로로 긴 경우: 세로를 맞추고 좌우를 자름
        visual_clip = visual_clip.resize(height=target_h)
    else:
        # 이미지가 더 세로로 긴 경우: 가로를 맞추고 위아래를 자름
        visual_clip = visual_clip.resize(width=target_w)

    # 중앙을 기준으로 타겟 사이즈만큼 크롭
    visual_clip = visual_clip.crop(x_center=visual_clip.w/2, y_center=visual_clip.h/2,
                                   width=target_w, height=target_h)

    # 0초부터 duration까지 확정
    visual_clip = visual_clip.subclip(0, duration)
    # 자막 로직
    fixed_fs = 35 if is_portrait else 50
    pos_y = target_h * (0.80 if is_portrait else 0.85)
    # 화면 너비의 90%를 넘지 못하도록 제한선 설정
    max_txt_w = target_w * 0.90

    full_text = scene['text']
    subtitle_clips = []

    # 텍스트 클립 생성 및 안전 리사이징
    def create_safe_text_clip(txt_content, duration_part, start_time=0):
        # 일단 고정 크기로 생성
        st = TextClip(txt_content, fontsize=fixed_fs, color='white', font="C:/Windows/Fonts/malgunbd.ttf", method='label')
        # 핵심: 화면보다 넓으면 강제로 줄임
        if st.w > max_txt_w:
            st = st.resize(width=max_txt_w)
        return st.set_duration(duration_part).set_start(start_time).set_position('center')

    # 분할 로직 적용
    if len(full_text) > 30:
        mid = len(full_text) // 2
        split_idx = full_text.find(' ', mid - 5, mid + 5)
        if split_idx == -1: split_idx = mid
        parts = [full_text[:split_idx], full_text[split_idx:].strip()]
        part_dur = duration / 2
        for i, p in enumerate(parts):
            st = create_safe_text_clip(p, part_dur, i * part_dur)
            subtitle_clips.append(st)
    else:
        st = create_safe_text_clip(full_text, duration)
        subtitle_clips.append(st)

    # 자막 배경바 (높이 고정)
    bg_h = fixed_fs + 40
    txt_bg = ColorClip(size=(target_w, bg_h), color=(0,0,0)).set_opacity(0.6).set_duration(duration)

    subtitle_group = CompositeVideoClip([txt_bg] + subtitle_clips, size=(target_w, bg_h)).set_position(('center', pos_y))

    # 최종 합성
    final_scene = CompositeVideoClip([visual_clip, subtitle_group]).set_audio(tts_clip)
    return final_scene, temp_files


# 메인 엔진 루프
def run_engine():
    print("🚀 [Engine] 아나운서 싱크 & 자막 분할 모드 가동!")
    while True:
        conn = None
        all_temps, final_clips = [], []
        final_video = None
        try:
            conn = mysql.connector.connect(**DB_CONFIG)
            cursor = conn.cursor(dictionary=True)
            cursor.execute("SELECT * FROM tbl_video_task WHERE status = 'PENDING' ORDER BY vno ASC LIMIT 1")
            task = cursor.fetchone()

            if task:
                vno = task['vno']
                print(f"🎬 [Job {vno}] 제작 시작...")
                cursor.execute("UPDATE tbl_video_task SET status = 'PROCESSING' WHERE vno = %s", (vno,))
                conn.commit()

                story_board = get_storyboard_from_ai(task['raw_text'])
                if story_board:
                    for i, scene in enumerate(story_board):
                        clip, files = make_hybrid_scene(scene, i, task.get('video_mode', '16:9'))
                        if clip:
                            final_clips.append(clip)
                            all_temps.extend(files)

                    if final_clips:
                        # 출력 폴더가 없으면 생성 (안전장치)
                        os.makedirs(OUTPUT_DIR, exist_ok=True)
                        file_name = f"result_vno_{vno}.mp4"
                        save_path = os.path.join(OUTPUT_DIR, file_name)
                        final_video = concatenate_videoclips(final_clips, method="compose")
                        final_video.write_videofile(save_path, fps=24, codec='libx264', audio_codec='aac', threads=8, preset='ultrafast')
                        
                        # 파일 저장 확인
                        if os.path.exists(save_path):
                            file_size = os.path.getsize(save_path)
                            print(f"✅ [Job {vno}] 영상 파일 저장 완료: {file_name} ({file_size} bytes)")
                        else:
                            print(f"⚠️ [Job {vno}] 영상 파일 저장 실패: {save_path}")
                        
                        # DB 업데이트
                        cursor.execute("UPDATE tbl_video_task SET status = 'COMPLETED', video_url=%s WHERE vno = %s", (file_name, vno))
                        conn.commit()
                        print(f"✅ [Job {vno}] 제작 완료! DB 업데이트: video_url={file_name}")
            cursor.close()
        except Exception as e: print(f"❌ 에러: {e}")
        finally:
            # DB 연결 종료
            if conn and conn.is_connected(): conn.close()
            
            # 모든 비디오 클립 명시적으로 닫기 (파일 핸들 해제)
            if final_video:
                try:
                    final_video.close()
                except:
                    pass
            
            for c in final_clips:
                try:
                    c.close()
                except:
                    pass
            
            # 약간의 지연 후 임시 파일 삭제 (파일 핸들이 완전히 해제될 때까지 대기)
            time.sleep(0.5)
            
            # 임시 파일 삭제 (재시도 로직 포함)
            for f in all_temps:
                if f and os.path.exists(f):
                    max_retries = 3
                    for attempt in range(max_retries):
                        try:
                            os.remove(f)
                            break  # 성공하면 루프 종료
                        except PermissionError:
                            if attempt < max_retries - 1:
                                time.sleep(0.5)  # 0.5초 대기 후 재시도
                            else:
                                print(f"임시 파일 삭제 실패 (재시도 {max_retries}회): {f}")
                        except Exception as e:
                            # PermissionError 외 다른 에러는 로그만 남기고 넘어감
                            if attempt == max_retries - 1:
                                print(f"임시 파일 삭제 중 예외: {f}, {e}")
                            break
            
            # MoviePy가 생성한 추가 임시 파일들도 정리 (BASE_DIR 내 TEMP_MPY_* 패턴)
            try:
                for temp_file in os.listdir(BASE_DIR):
                    if temp_file.startswith("result_vno_") and "TEMP_MPY_" in temp_file:
                        temp_path = os.path.join(BASE_DIR, temp_file)
                        if os.path.isfile(temp_path):
                            try:
                                os.remove(temp_path)
                            except (PermissionError, OSError):
                                pass  # 삭제 실패해도 계속 진행
            except Exception:
                pass  # 디렉토리 읽기 실패해도 계속 진행
                
        time.sleep(10)

if __name__ == "__main__":
    run_engine()