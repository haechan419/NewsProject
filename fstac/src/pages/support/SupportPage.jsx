// SupportPage.jsx
import { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import ReactMarkdown from 'react-markdown';
import { getFaqs, getFaqById, createFaq, updateFaq, deleteFaq, searchFaqs } from '../../api/faqApi';
import { sendQaMessage } from '../../api/qaApi';
import { getMyInquiries, createInquiry, getInquiryById, getAllInquiries, updateInquiry, getInquiryByIdForAdmin } from '../../api/inquiryApi';
import apiClient from '../../api/axios';

// ★ 업로드하신 이미지를 import 합니다 (경로는 실제 파일 위치에 맞게 수정해주세요)
// 만약 이미지가 없다면 주석 처리하고 이모티콘을 사용하세요.
import chatIcon from '../../assets/images/chat-icon.png';
import emailIcon from '../../assets/images/email.png'; 

// 챗봇 메뉴 아이콘 이미지
import profileIcon from '../../assets/images/profile.png';
import videoIcon from '../../assets/images/video.png';
import carIcon from '../../assets/images/car.png';
import boardIcon from '../../assets/images/board.png';
import questionIcon from '../../assets/images/question.png';
import homeIcon from '../../assets/images/home.png';

// 카테고리 정보
const CATEGORIES = [
  { value: 'VIDEO', label: '영상제작' },
  { value: 'POST', label: '게시물작성' },
  { value: 'ACCOUNT', label: '프로필/계정' },
  { value: 'ETC', label: '기타' }
];

// 챗봇 버튼 메뉴 구조
const CHATBOT_MENU = {
  main: [
    { id: 'account', label: '계정관리', iconImg: profileIcon },
    { id: 'video', label: '영상제작', iconImg: videoIcon },
    { id: 'drive', label: '드라이브모드', iconImg: carIcon },
    { id: 'post', label: '게시물작성', iconImg: boardIcon },
    { id: 'etc', label: '기타문의', iconImg: questionIcon },
  ],
  // =========================================
  // 프로필/계정 (ACCOUNT) 카테고리 - 15개
  // =========================================
  account: [
    { id: 'profile_change', label: '프로필 정보 변경', answer: '**프로필 정보 변경 방법**\n\n1. 상단 메뉴에서 **프로필** 또는 **내 정보** 메뉴를 클릭합니다.\n2. 프로필 수정 페이지로 이동합니다.\n3. 이름, 이메일, 프로필 사진 등 원하는 정보를 수정합니다.\n4. **저장** 버튼을 클릭하면 즉시 반영됩니다.' },
    { id: 'password_change', label: '비밀번호 변경', answer: '**비밀번호 변경 방법**\n\n1. 프로필 설정 페이지에서 **비밀번호 변경** 메뉴를 선택합니다.\n2. 현재 비밀번호를 입력합니다.\n3. 새로운 비밀번호를 입력합니다.\n\n> 보안을 위해 비밀번호는 정기적으로 변경하시는 것을 권장합니다.' },
    { id: 'password_forgot', label: '비밀번호를 잊어버렸어요', answer: '**비밀번호 찾기 방법**\n\n1. 로그인 화면에서 **비밀번호 찾기**를 클릭합니다.\n2. 가입 시 사용한 이메일을 입력합니다.\n3. 비밀번호 재설정 링크가 이메일로 발송됩니다.\n\n> 이메일이 오지 않으면 스팸함을 확인해주세요.' },
    { id: 'my_posts', label: '내 게시물/댓글 확인', answer: '**내 활동 확인 방법**\n\n프로필 페이지의 **내 활동** 또는 **작성한 글** 메뉴에서 작성한 게시물과 댓글을 모두 확인하실 수 있습니다.\n\n날짜별, 카테고리별로 필터링하여 검색할 수도 있습니다.' },
    { id: 'logout', label: '로그아웃 방법', answer: '**로그아웃 방법**\n\n1. 상단 메뉴 오른쪽의 프로필 아이콘을 클릭합니다.\n2. 드롭다운 메뉴가 나타납니다.\n3. **로그아웃** 버튼을 클릭합니다.\n\n> 보안을 위해 공용 컴퓨터 사용 시 반드시 로그아웃하시기 바랍니다.' },
    { id: 'face_login_fail', label: '얼굴인식 로그인 실패', answer: '**얼굴인식 로그인 실패 해결**\n\n1. 프로필 수정에서 **얼굴 사진을 재등록**해주세요.\n2. 밝은 조명에서 얼굴 정면을 촬영합니다.\n3. 모자나 마스크는 벗은 상태에서 등록해주세요.\n\n> 등록된 사진과 현재 모습이 많이 다르면 인식이 어려울 수 있습니다.' },
    { id: 'face_data', label: '얼굴 정보 저장 위치', answer: '**얼굴 정보 보안 안내**\n\n얼굴 정보는 **암호화**되어 안전하게 저장됩니다.\n\n회원 탈퇴 시 얼굴 정보도 함께 삭제되어 개인정보가 보호됩니다.' },
    { id: 'social_login', label: '소셜 로그인 문제', answer: '**소셜 로그인(카카오/네이버/구글) 문제 해결**\n\n네트워크 오류로 인해 일시적으로 사용자 정보 조회에 실패했을 수 있습니다.\n\n1. 잠시 후 다시 로그인을 시도해주세요.\n2. 문제가 계속되면 **1:1 문의**를 남겨주세요.' },
    { id: 'social_info', label: '소셜 로그인 시 저장 정보', answer: '**소셜 로그인 저장 정보 안내**\n\n소셜 로그인 시 저장되는 정보:\n- 닉네임\n- 이메일 정보\n\n> 비밀번호는 저장되지 않으며, 소셜 플랫폼의 보안 정책에 따라 안전하게 처리됩니다.' },
    { id: 'withdraw', label: '회원 탈퇴', answer: '**회원 탈퇴 안내**\n\n회원 탈퇴 시 가입하신 사용자의 **모든 정보가 삭제**됩니다.\n\n삭제되는 정보:\n- 얼굴 정보\n- 작성한 게시글\n- 댓글\n- 기타 모든 데이터\n\n> ⚠️ 삭제된 데이터는 **복구가 불가능**합니다.' },
    { id: 'nickname_change', label: '닉네임 변경', answer: '**닉네임 변경 방법**\n\n프로필 수정 페이지에서 닉네임을 변경할 수 있습니다.\n\n> 단, 이미 다른 사용자가 사용 중인 닉네임은 사용할 수 없습니다.' },
    { id: 'profile_image', label: '프로필 이미지 변경', answer: '**프로필 이미지 변경 방법**\n\n1. 프로필 수정 페이지로 이동합니다.\n2. 새로운 이미지를 업로드합니다.\n\n> 지원 형식: JPG, PNG\n> 너무 큰 파일은 업로드가 제한될 수 있습니다.' },
    { id: 'login_session', label: '로그인 상태가 자꾸 풀려요', answer: '**로그인 유지 문제 해결**\n\n보안을 위해 일정 시간이 지나면 자동으로 로그아웃됩니다.\n\n- 자주 사용하시는 기기라면 **로그인 유지** 옵션을 선택해주세요.\n- 브라우저 쿠키가 차단되어 있으면 로그인 유지가 되지 않을 수 있습니다.' },
    { id: 'email_change', label: '이메일 변경', answer: '**이메일 변경 방법**\n\n프로필 수정 페이지에서 이메일을 변경할 수 있습니다.\n\n- 변경 시 **이메일 인증**이 필요합니다.\n- 이미 다른 계정에서 사용 중인 이메일은 사용할 수 없습니다.' },
    { id: 'category_setting', label: '관심 카테고리 설정', answer: '**관심 카테고리 설정 방법**\n\n프로필 설정 또는 관심 카테고리 메뉴에서 원하는 뉴스 카테고리를 선택할 수 있습니다.\n\n> 선택한 카테고리의 뉴스가 우선적으로 표시됩니다.' },
  ],
  // =========================================
  // 영상제작 (VIDEO) 카테고리 - 15개
  // =========================================
  video: [
    { id: 'how_to_create', label: '영상 제작 방법', answer: '**영상 제작 방법**\n\n1. 메인 페이지에서 **영상 제작** 메뉴를 선택합니다.\n2. 영상 제작 페이지로 이동합니다.\n3. 제목과 내용을 입력합니다.\n4. 원하는 영상 스타일을 선택합니다.\n5. **제작하기** 버튼을 클릭합니다.\n\n> AI가 자동으로 영상을 생성해드립니다.' },
    { id: 'create_time', label: '영상 제작 소요 시간', answer: '**영상 제작 소요 시간**\n\n영상 제작 시간은 영상 길이와 복잡도에 따라 다릅니다.\n\n- **1-3분 길이 영상**: 약 5-10분 소요\n\n> 제작이 완료되면 알림을 통해 확인하실 수 있습니다.' },
    { id: 'video_delete', label: '영상 수정/삭제', answer: '**영상 수정 및 삭제**\n\n- 제작한 영상은 **수정할 수 없습니다**.\n- **삭제만 가능**합니다.\n\n영상 상세 페이지에서 삭제 버튼을 클릭하시면 됩니다.\n\n> ⚠️ 삭제된 영상은 복구할 수 없으니 신중하게 결정해주세요.' },
    { id: 'file_format', label: '지원 파일 형식', answer: '**지원 파일 형식**\n\n- **MP4**\n- **MOV**\n- **AVI**\n\n> 최대 파일 크기: 500MB\n> 고화질 영상의 경우 제작 시간이 더 오래 걸릴 수 있습니다.' },
    { id: 'video_error', label: '영상 제작 중 오류', answer: '**영상 제작 오류 해결**\n\n영상 제작 중 오류가 발생하면 제작이 중단됩니다.\n\n1. 같은 내용으로 다시 제작을 시도해 보세요.\n2. 계속 오류가 발생하면 고객센터로 문의해 주세요.\n\n> 오류 메시지를 함께 알려주시면 더 빠르게 해결할 수 있습니다.' },
    { id: 'video_download', label: '영상 다운로드 방법', answer: '**영상 다운로드 방법**\n\n1. 제작이 완료된 영상의 상세 페이지로 이동합니다.\n2. **다운로드** 버튼을 클릭합니다.\n\n> 다운로드한 영상은 기기의 다운로드 폴더에 저장됩니다.' },
    { id: 'video_cost', label: '영상 제작 비용', answer: '**영상 제작 비용 안내**\n\n현재 영상 제작 기능은 **무료**로 제공됩니다.\n\n> 향후 유료 기능이 추가될 경우 사전에 공지해드리겠습니다.' },
    { id: 'video_subtitle', label: '자막 추가 가능 여부', answer: '**자막 기능 안내**\n\n현재는 **자동 자막 생성 기능을 지원하지 않습니다**.\n\n> 향후 업데이트를 통해 자막 기능이 추가될 예정입니다.' },
    { id: 'video_resolution', label: '영상 해상도 설정', answer: '**영상 해상도 안내**\n\n영상 제작 시 기본 해상도는 **1080p**로 설정됩니다.\n\n> 고해상도 옵션은 현재 준비 중이며, 향후 업데이트를 통해 제공될 예정입니다.' },
    { id: 'video_limit', label: '영상 제작 한도', answer: '**영상 제작 한도 안내**\n\n현재는 **일일 제작 한도가 없습니다**.\n\n> 다만 서버 부하를 고려하여 동시에 여러 영상을 제작하는 것은 권장하지 않습니다.' },
    { id: 'video_bgm', label: '배경음악 추가', answer: '**배경음악 기능 안내**\n\n현재는 **배경음악 추가 기능을 지원하지 않습니다**.\n\n> 향후 업데이트를 통해 배경음악 라이브러리가 제공될 예정입니다.' },
    { id: 'video_refund', label: '영상 제작 실패 시 환불', answer: '**환불 안내**\n\n영상 제작은 **무료 서비스**이므로 환불 대상이 아닙니다.\n\n제작 실패 시:\n1. 같은 내용으로 다시 제작을 시도해 보세요.\n2. 또는 고객센터로 문의해 주세요.' },
    { id: 'video_share', label: '영상 공유 방법', answer: '**영상 공유 방법**\n\n1. 제작한 영상의 상세 페이지로 이동합니다.\n2. **공유** 버튼을 클릭합니다.\n3. 공유 링크를 복사합니다.\n\n> 생성된 링크를 다른 사람과 공유할 수 있습니다.' },
    { id: 'video_template', label: '템플릿 선택', answer: '**템플릿 기능 안내**\n\n현재는 **기본 템플릿만 제공**됩니다.\n\n> 향후 다양한 템플릿이 추가될 예정입니다.\n> 템플릿 선택 기능은 영상 제작 페이지에서 확인하실 수 있습니다.' },
    { id: 'video_cancel', label: '영상 제작 취소', answer: '**영상 제작 취소 안내**\n\n영상 제작이 시작되면 **취소할 수 없습니다**.\n\n- 제작이 완료되기 전까지는 대기 상태로 유지됩니다.\n- 완료되면 알림을 받으실 수 있습니다.' },
  ],
  // =========================================
  // 드라이브 모드 (DRIVE) 카테고리 - 15개
  // =========================================
  drive: [
    { id: 'how_to_use', label: '드라이브 모드 사용법', answer: '**드라이브 모드 사용법**\n\n드라이브 모드는 운전 중에도 안전하게 뉴스를 들을 수 있는 기능입니다.\n\n1. 메인 페이지에서 **드라이브 모드**를 선택합니다.\n2. 플레이리스트를 선택합니다.\n3. 음성 명령으로 조작할 수 있습니다.' },
    { id: 'playlist_slow', label: '플레이리스트 로딩이 느려요', answer: '**플레이리스트 로딩 지연 안내**\n\n선택하신 주제에 맞는 뉴스를 모아 음성으로 만드는 시간이 필요합니다.\n\n- 보통 **몇 초에서 10초** 정도 걸립니다.\n- 네트워크 상황에 따라 다소 달라질 수 있습니다.' },
    { id: 'playlist_stuck', label: '플레이리스트 준비 중 멈춤', answer: '**플레이리스트 멈춤 해결**\n\n최대 **1분 정도**까지는 기다려 보세요.\n\n그래도 진행이 없으면:\n1. 화면을 닫습니다.\n2. 같은 플레이리스트를 다시 선택해 보세요.\n\n> 자주 그렇다면 Wi-Fi·데이터 연결과 앱 최신 버전을 확인해 보세요.' },
    { id: 'playback_stop', label: '재생 중 끊김', answer: '**재생 끊김 해결**\n\n네트워크가 잠깐 불안정하거나 앱이 백그라운드로 갈 때 끊길 수 있습니다.\n\n해결 방법:\n1. 같은 플레이리스트를 다시 선택합니다.\n2. 또는 히스토리에서 해당 플레이리스트를 골라 다시 재생합니다.\n\n> 자주 반복되면 연결 상태와 앱 버전을 확인해 주세요.' },
    { id: 'voice_not_recognized', label: '음성 인식 실패', answer: '**음성 인식 실패 해결**\n\n- 조용한 곳에서 마이크에 가깝게, **짧게** 말해 보세요.\n- 차량·블루투스 소음이 크면 **화면 버튼**으로 조작해 보세요.' },
    { id: 'command_not_understood', label: '명령어를 이해 못해요', answer: '**명령어 인식 개선**\n\n다음과 같은 **짧은 표현**을 사용해 보세요:\n- "일시정지"\n- "재생"\n- "다음 기사"\n- "10초 앞으로"\n- "도움말"\n\n> 문장이 길거나 다른 표현이면 인식이 어려울 수 있습니다.' },
    { id: 'continue_listening', label: '이어서 듣기', answer: '**이어서 듣기 안내**\n\n이전에 들으시던 플레이리스트는 **히스토리**에 남아 있습니다.\n\n1. 드라이브 모드에서 히스토리 탭을 엽니다.\n2. 해당 플레이리스트를 선택합니다.\n\n> 처음부터 다시 들으실 수 있습니다.' },
    { id: 'history', label: '이전 뉴스 다시 듣기', answer: '**히스토리 기능 안내**\n\n네, **히스토리**에서 들었던 플레이리스트를 선택하시면 해당 플레이리스트를 처음부터 다시 재생할 수 있습니다.' },
    { id: 'tts_error', label: '음성 생성 오류', answer: '**음성 생성 오류 해결**\n\n1. 잠시 뒤 같은 플레이리스트를 다시 선택해 보세요.\n2. 계속되면 앱을 완전히 종료했다가 다시 켜 보세요.\n\n> 같은 현상이 반복되면 고객센터로 문의해 주세요.' },
    { id: 'connection_error', label: '연결 문제 오류', answer: '**연결 문제 해결**\n\n네트워크가 불안정한 상태입니다.\n\n1. Wi-Fi나 데이터 연결을 확인합니다.\n2. 통신이 안정된 곳에서 다시 시도해 보세요.' },
    { id: 'playlist_topics', label: '플레이리스트 주제', answer: '**플레이리스트 주제 안내**\n\n다양한 카테고리별 플레이리스트를 제공합니다:\n- 정치\n- 경제\n- 사회\n- IT/과학\n- 스포츠\n- 국제\n\n> 관심 카테고리를 설정하시면 해당 주제의 플레이리스트가 우선 표시됩니다.' },
    { id: 'voice_commands', label: '음성 명령 목록', answer: '**음성 명령 목록**\n\n사용 가능한 명령:\n- "일시정지"\n- "재생"\n- "다음 기사"\n- "이전 기사"\n- "10초 앞으로"\n- "10초 뒤로"\n- "도움말"\n\n> 짧고 명확하게 말씀하시면 더 잘 인식됩니다.' },
    { id: 'background_play', label: '백그라운드 재생', answer: '**백그라운드 재생 안내**\n\n네, 드라이브 모드는 **백그라운드에서도 계속 재생**됩니다.\n\n> 다만 일부 기기나 브라우저에서는 백그라운드 재생이 제한될 수 있습니다.' },
    { id: 'playlist_length', label: '플레이리스트 길이', answer: '**플레이리스트 길이 안내**\n\n플레이리스트는 선택하신 주제의 최신 뉴스들을 모아 약 **10-15분 분량**으로 구성됩니다.\n\n> 재생 중에도 언제든지 다음 기사로 넘어가거나 일시정지할 수 있습니다.' },
    { id: 'audio_quality', label: '음성 품질 문제', answer: '**음성 품질 개선**\n\n네트워크 상태가 불안정하거나 서버 부하가 있을 때 음성 품질이 떨어질 수 있습니다.\n\n해결 방법:\n1. 잠시 후 다시 시도합니다.\n2. Wi-Fi 연결이 안정적인 환경에서 사용해 보세요.' },
  ],
  // =========================================
  // 게시물작성 (POST) 카테고리 - 20개
  // =========================================
  post: [
    { id: 'how_to_write', label: '게시물 작성 방법', answer: '**게시물 작성 방법**\n\n1. 상단 메뉴에서 **게시판**을 선택합니다.\n2. 또는 메인 페이지의 **게시글 작성** 버튼을 클릭합니다.\n3. 일반 게시판과 토론 게시판 중 선택합니다.\n4. 제목과 내용을 입력합니다.\n5. 파일을 첨부할 수 있습니다.' },
    { id: 'file_attach', label: '이미지/파일 첨부', answer: '**파일 첨부 안내**\n\n게시물 작성 시 파일 첨부 기능을 통해 이미지, 문서 등 다양한 파일을 첨부하실 수 있습니다.\n\n- **최대 5개**까지 첨부 가능\n- 각 파일은 **최대 10MB**까지 업로드 가능' },
    { id: 'edit_delete', label: '게시물 수정/삭제', answer: '**게시물 수정 및 삭제**\n\n본인이 작성한 게시물은 게시물 상세 페이지에서 **수정** 및 **삭제** 버튼을 통해 수정하거나 삭제할 수 있습니다.\n\n> 다만 댓글이 달린 게시물의 경우 삭제 시 주의가 필요합니다.' },
    { id: 'board_type', label: '일반/토론 게시판 차이', answer: '**게시판 종류 안내**\n\n- **일반 게시판**: 자유롭게 의견을 나눌 수 있는 공간\n- **토론 게시판**: 특정 주제에 대해 찬반 의견을 나누는 공간\n\n> 토론 게시판 작성 시에는 토론 주제를 반드시 입력해야 합니다.' },
    { id: 'comment_not_shown', label: '댓글이 안 보여요', answer: '**댓글 표시 문제 해결**\n\n네트워크 문제로 댓글 등록이 실패했을 수 있습니다.\n\n1. 새로고침 후 댓글이 보이는지 확인합니다.\n2. 안 보이면 다시 작성해주세요.\n\n> 부적절한 내용의 댓글은 자동으로 필터링될 수 있습니다.' },
    { id: 'like_not_working', label: '좋아요가 안 눌려요', answer: '**좋아요 버튼 문제 해결**\n\n- **로그인 상태**에서만 좋아요를 누를 수 있습니다.\n- 같은 게시글에 이미 좋아요를 누르셨다면 다시 누르면 **좋아요가 취소**됩니다.' },
    { id: 'vote_not_working', label: '토론 투표가 안 돼요', answer: '**토론 투표 문제 해결**\n\n- 토론 게시글의 투표는 **한 번만** 참여할 수 있습니다.\n- 이미 투표하셨다면 변경이 불가능합니다.\n- 로그인 상태를 확인해주세요.' },
    { id: 'video_upload', label: '동영상 업로드', answer: '**동영상 업로드 안내**\n\n현재는 **이미지와 문서 파일만** 첨부 가능합니다.\n\n> 동영상 업로드 기능은 향후 업데이트를 통해 제공될 예정입니다.' },
    { id: 'search_post', label: '게시물 검색', answer: '**게시물 검색 방법**\n\n게시판 페이지 상단의 **검색창**에 키워드를 입력하시면 제목과 내용에서 검색됩니다.\n\n> 검색 결과는 최신순으로 정렬되어 표시됩니다.' },
    { id: 'reply', label: '대댓글 작성', answer: '**대댓글 작성 방법**\n\n네, 댓글에 대댓글을 달 수 있습니다.\n\n댓글 옆의 **답글** 버튼을 클릭하시면 대댓글을 작성할 수 있습니다.' },
    { id: 'link_attach', label: '링크 첨부', answer: '**링크 첨부 방법**\n\n게시물 내용에 직접 URL을 입력하시면 **자동으로 링크로 변환**됩니다.\n\n> 클릭하면 해당 페이지로 이동할 수 있습니다.' },
    { id: 'restore_post', label: '삭제된 게시물 복구', answer: '**삭제 복구 안내**\n\n삭제된 게시물은 **복구할 수 없습니다**.\n\n삭제하기 전에 신중하게 결정해주세요.\n\n> 댓글이 달린 게시물의 경우 삭제 전에 댓글 작성자에게 알림이 전송됩니다.' },
    { id: 'char_limit', label: '글자 수 제한', answer: '**글자 수 제한 안내**\n\n- **제목**: 최대 255자\n- **내용**: 최대 10,000자\n\n> 내용이 길 경우 여러 개의 게시물로 나누어 작성하는 것을 권장합니다.' },
    { id: 'hashtag', label: '해시태그 추가', answer: '**해시태그 기능 안내**\n\n현재는 **해시태그 기능을 지원하지 않습니다**.\n\n> 향후 업데이트를 통해 해시태그 기능이 추가될 예정입니다.' },
    { id: 'private_post', label: '비공개 게시물', answer: '**비공개 게시물 안내**\n\n현재는 **모든 게시물이 공개**됩니다.\n\n> 비공개 게시물 기능은 향후 업데이트를 통해 제공될 예정입니다.' },
    { id: 'image_not_shown', label: '이미지가 안 보여요', answer: '**이미지 표시 문제 해결**\n\n이미지 파일 형식이 지원되지 않거나 파일이 손상되었을 수 있습니다.\n\n- 지원 형식: **JPG, PNG, GIF**\n- 파일 크기가 **10MB를 초과**하면 업로드되지 않습니다.' },
    { id: 'draft_save', label: '임시 저장', answer: '**임시 저장 안내**\n\n현재는 **임시 저장 기능을 지원하지 않습니다**.\n\n작성 중인 내용은 브라우저의 자동 저장 기능을 활용하시거나, 별도로 복사해 두시는 것을 권장합니다.' },
    { id: 'quote', label: '인용 기능', answer: '**인용 기능 안내**\n\n현재는 **인용 기능을 지원하지 않습니다**.\n\n다른 게시물을 참고하고 싶으시면 링크를 첨부하시거나 내용을 직접 인용해 주세요.' },
    { id: 'emoji', label: '이모지 사용', answer: '**이모지 사용 안내**\n\n네, 게시물 제목과 내용에 **이모지를 사용**할 수 있습니다.\n\n> 키보드의 이모지 입력 기능을 사용하시면 됩니다.' },
    { id: 'file_download', label: '첨부파일 다운로드', answer: '**첨부파일 다운로드**\n\n게시물에 첨부된 파일은 게시물 상세 페이지에서 다운로드할 수 있습니다.\n\n> 파일명을 클릭하시면 다운로드가 시작됩니다.' },
  ],
  // =========================================
  // 기타 (ETC) 카테고리 - 5개
  // =========================================
  etc: [
    { id: 'ai_difference', label: 'AI 챗봇 차이점', answer: '**고객센터 AI vs AI 비서**\n\n- **고객센터 AI**: 서비스 이용 관련 FAQ와 문의사항에 특화\n- **AI 비서** (오른쪽 하단): 실시간 뉴스 검색, 일반 정보 검색 등 다양한 기능 제공\n\n> 서비스 이용 문의는 고객센터 AI를, 뉴스나 일반 정보가 필요하시면 AI 비서를 이용해주세요.' },
    { id: 'faq_qa', label: 'FAQ와 Q&A 사용법', answer: '**FAQ와 Q&A 사용법**\n\n1. **FAQ** (자주 묻는 질문)\n   - 카테고리별 FAQ 버튼을 클릭하면 즉시 미리 정의된 답변을 확인\n   - 빠르고 정확한 정보를 원할 때 사용\n\n2. **Q&A** (질의응답)\n   - 채팅창에 궁금한 내용을 자유롭게 입력\n   - GPT-4o-mini AI가 FAQ 데이터베이스를 참고하여 답변' },
    { id: 'ticket', label: '챗봇으로 해결 안 될 때', answer: '**문의 티켓 작성**\n\n챗봇으로 해결되지 않는 문제나 추가 문의가 필요한 경우:\n\n1. **문의 티켓 작성** 버튼을 클릭합니다.\n2. 문의 내용을 상세히 작성합니다.\n3. 관리자가 확인 후 **24시간 이내**에 답변드립니다.\n\n> 문의 티켓은 **내 문의 내역**에서 확인하실 수 있습니다.' },
    { id: 'error_report', label: '오류 발생 시', answer: '**오류 신고 방법**\n\n오류 발생 시 다음 정보를 포함하여 문의해주시면 빠르게 해결해드릴 수 있습니다:\n\n- 발생한 오류 메시지\n- 오류가 발생한 페이지\n- 사용 중이던 브라우저 및 버전\n- 오류 발생 시간\n\n> 고객센터 문의 티켓을 통해 문의해주시면 **24시간 이내**에 답변드리겠습니다.' },
    { id: 'privacy_policy', label: '개인정보 보호', answer: '**개인정보 보호 안내**\n\n저희는 **개인정보보호법**을 준수하며 사용자의 개인정보를 안전하게 보호합니다.\n\n- 비밀번호는 **암호화**되어 저장\n- 이메일 주소는 뉴스레터 발송 외에는 제3자에게 제공되지 않음' },
  ],
};

const SupportPage = () => {
  const { user } = useSelector((state) => state.auth);
  
  const isAdmin = Boolean(
    user?.roleNames?.includes('ADMIN') || 
    user?.roles?.includes('ADMIN') || 
    user?.memberRoleList?.includes('ADMIN') ||
    user?.roleNames?.some(role => role === 'ADMIN' || role === 'ROLE_ADMIN')
  );

  // activeTab: 초기값은 'faq' (메인화면)
  const [activeTab, setActiveTab] = useState('faq'); 
  
  // FAQ 관련 상태
  const [faqs, setFaqs] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [faqLoading, setFaqLoading] = useState(false);
  const [readFaqModal, setReadFaqModal] = useState(null);
  const [visibleCount, setVisibleCount] = useState(8); // ★ 처음에 보여줄 개수 8개
  const [searchTerm, setSearchTerm] = useState(''); // 검색어 상태

  // 챗봇 관련 상태
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [sessionId, setSessionId] = useState(null);
  const [qaLoading, setQaLoading] = useState(false);
  const messagesEndRef = useRef(null);
  
  // 챗봇 버튼 메뉴 상태
  const [menuLevel, setMenuLevel] = useState('main'); // 'main' | 'account' | 'video' | 'drive' | 'post' | 'etc'
  const [menuHistory, setMenuHistory] = useState([]); // 뒤로가기용 히스토리

  // 문의 관련 상태
  const [inquiries, setInquiries] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedInquiry, setSelectedInquiry] = useState(null);
  const [inquiryForm, setInquiryForm] = useState({ title: '', content: '', category: '' });
  const [inquiryLoading, setInquiryLoading] = useState(false);

  // FAQ 관리자 모달
  const [showFaqModal, setShowFaqModal] = useState(false);
  const [editingFaq, setEditingFaq] = useState(null);
  const [faqForm, setFaqForm] = useState({ category: 'VIDEO', question: '', answer: '', keywords: '' });
  const [adminResponse, setAdminResponse] = useState('');

  useEffect(() => {
    apiClient.get('/api/category/list').catch(() => {});
  }, []);

  // 카테고리가 변경될 때마다 FAQ 다시 로드 & 더보기 카운트 초기화
  useEffect(() => {
    setSearchTerm('');
    loadFaqs();
    setVisibleCount(8); 
  }, [selectedCategory]);

  useEffect(() => {
    if (activeTab === 'inquiry' || activeTab === 'inquiry-admin') {
      loadInquiries();
    }
  }, [activeTab]);

  // 자동 스크롤 기능 비활성화
  // useEffect(() => {
  //   messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  // }, [messages]);

  const loadFaqs = async () => {
    setFaqLoading(true);
    try {
      const data = await getFaqs(selectedCategory);
      setFaqs(data);
    } catch (error) {
      console.error('Error loading FAQs:', error);
    } finally {
      setFaqLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      loadFaqs(); // 검색어가 없으면 전체 목록 다시 로드
      return;
    }
    setFaqLoading(true);
    try {
      const data = await searchFaqs(searchTerm, selectedCategory);
      setFaqs(data);
      setVisibleCount(8);
    } catch (error) {
      console.error('Error searching FAQs:', error);
    } finally {
      setFaqLoading(false);
    }
  };

  const loadInquiries = async () => {
    setInquiryLoading(true);
    try {
      const data = activeTab === 'inquiry-admin' ? await getAllInquiries() : await getMyInquiries();
      setInquiries(data);
    } catch (error) {
      console.error('Error loading inquiries:', error);
    } finally {
      setInquiryLoading(false);
    }
  };

  const handleFaqClick = async (faqId) => {
    try {
      const faq = await getFaqById(faqId);
      setReadFaqModal(faq);
    } catch (error) { console.error(error); }
  };

  // ★ 더보기 버튼 핸들러
  const handleLoadMore = () => {
    setVisibleCount(prev => prev + 8);
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || qaLoading) return;
    const userMessage = inputMessage.trim();
    setInputMessage('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setQaLoading(true);
    try {
      const history = messages.map(m => ({ role: m.role, content: m.content }));
      const response = await sendQaMessage(userMessage, sessionId, history);
      setSessionId(response.sessionId);
      setMessages(prev => [...prev, { role: 'assistant', content: response.reply }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'assistant', content: '오류가 발생했습니다.' }]);
    } finally {
      setQaLoading(false);
    }
  };

  // 챗봇 메뉴 버튼 클릭 핸들러
  const handleMenuClick = (menuItem) => {
    if (CHATBOT_MENU[menuItem.id]) {
      // 하위 메뉴가 있으면 해당 메뉴로 이동
      setMenuHistory(prev => [...prev, menuLevel]);
      setMenuLevel(menuItem.id);
    } else if (menuItem.answer) {
      // 답변이 있으면 채팅에 표시
      setMessages(prev => [
        ...prev,
        { role: 'user', content: menuItem.label },
        { role: 'assistant', content: menuItem.answer }
      ]);
      // 메뉴를 메인으로 초기화
      setMenuLevel('main');
      setMenuHistory([]);
    }
  };

  // 챗봇 메뉴 뒤로가기 핸들러
  const handleMenuBack = () => {
    const prev = menuHistory[menuHistory.length - 1] || 'main';
    setMenuHistory(h => h.slice(0, -1));
    setMenuLevel(prev);
  };

  // 챗봇 메뉴 초기화 (처음으로)
  const handleMenuReset = () => {
    setMenuLevel('main');
    setMenuHistory([]);
  };

  // ... (문의 생성, 조회, 답변 등 기존 로직 유지 - 코드 길이를 위해 생략하지 않고 기능 보존)
  const handleCreateInquiry = async () => {
    if (!inquiryForm.title.trim() || !inquiryForm.content.trim()) return;
    try {
      await createInquiry({ ...inquiryForm, category: inquiryForm.category || null });
      setShowCreateModal(false);
      setInquiryForm({ title: '', content: '', category: '' });
      loadInquiries();
      alert('문의 등록 완료');
    } catch (error) { alert('실패'); }
  };

  const handleViewInquiry = async (id) => {
    try {
      const data = await getInquiryById(id);
      setSelectedInquiry(data);
      setAdminResponse(data.adminResponse || '');
      setShowDetailModal(true);
    } catch (error) {}
  };

  const handleViewInquiryForAdmin = async (id) => {
    try {
      const data = await getInquiryByIdForAdmin(id);
      setSelectedInquiry(data);
      setAdminResponse(data.adminResponse || '');
      setShowDetailModal(true);
    } catch (error) {}
  };

  const handleAdminResponse = async () => {
    if (!adminResponse.trim()) return;
    try {
      await updateInquiry(selectedInquiry.id, { status: 'COMPLETED', adminResponse });
      setShowDetailModal(false);
      loadInquiries();
      alert('답변 등록 완료');
    } catch (error) {}
  };

  const handleSaveFaq = async () => {
    if (!faqForm.question.trim() || !faqForm.answer.trim()) return;
    try {
      editingFaq ? await updateFaq(editingFaq.id, faqForm) : await createFaq(faqForm);
      setShowFaqModal(false);
      setEditingFaq(null);
      setFaqForm({ category: 'VIDEO', question: '', answer: '', keywords: '' });
      loadFaqs();
    } catch (error) {}
  };

  const handleDeleteFaq = async (id) => {
    if (!window.confirm('삭제하시겠습니까?')) return;
    try {
      await deleteFaq(id);
      if (readFaqModal?.id === id) setReadFaqModal(null);
      loadFaqs();
    } catch (error) {}
  };

  const openEditFaqModal = (faq) => {
    setEditingFaq(faq);
    setFaqForm({ category: faq.category, question: faq.question, answer: faq.answer, keywords: faq.keywords || '' });
    setReadFaqModal(null);
    setShowFaqModal(true);
  };

  // 뒤로가기 버튼 컴포넌트
  const BackButton = () => (
    <button 
      onClick={() => setActiveTab('faq')}
      className="flex items-center gap-2 text-gray-500 hover:text-gray-900 font-bold mb-6 transition-colors group"
    >
      <span className="w-8 h-8 rounded-full bg-gray-100 group-hover:bg-gray-200 flex items-center justify-center">←</span>
      <span>고객센터 홈으로</span>
    </button>
  );

  return (
    <div className="min-h-[calc(100vh-140px)] bg-white pb-20">
      
      {/* [1] 고정 헤더 섹션 (빨간 박스 영역) 
        - 배경색: slate-900 (진한 네이비/블랙 계열)
        - 텍스트: 중앙 정렬
      */}
      <div className="w-full bg-slate-900 py-16 px-4 mb-10">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl font-extrabold text-white mb-4 tracking-tight">
            고객센터
          </h1>
          <p className="text-slate-300 text-lg">
            무엇을 도와드릴까요? 궁금한 내용을 검색하거나 선택해주세요.
          </p>
          
          {/* 검색창 */}
          <div className="mt-8 relative max-w-xl mx-auto">
             <input 
                type="text" 
                placeholder="궁금한 점을 검색해보세요" 
                className="w-full py-4 px-6 rounded-full border-none outline-none bg-white text-gray-900 shadow-lg placeholder-gray-400"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.nativeEvent.isComposing) {
                    handleSearch();
                  }
                }}
             />
             <button 
               className="absolute right-4 top-1/2 transform -translate-y-1/2 text-slate-900 font-bold p-2 hover:bg-gray-100 rounded-full transition-colors"
               onClick={handleSearch}
             >
               🔍
             </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4">
        
        {/* 메인 화면 (FAQ 목록) - 탭 버튼 제거됨 */}
        {activeTab === 'faq' && (
          <div className="space-y-12 animate-fadeIn">
            
            {/* 카테고리 필터 (중앙 정렬) */}
            <div className="flex flex-wrap gap-2 items-center justify-center">
              <button 
                className={`px-5 py-2.5 rounded-full text-sm font-bold transition-all border
                  ${selectedCategory === null 
                    ? 'bg-slate-800 border-slate-800 text-white shadow-md' 
                    : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300'}`}
                onClick={() => setSelectedCategory(null)}
              >
                전체
              </button>
              {CATEGORIES.map(cat => (
                <button 
                  key={cat.value}
                  className={`px-5 py-2.5 rounded-full text-sm font-bold transition-all border
                    ${selectedCategory === cat.value 
                      ? 'bg-slate-800 border-slate-800 text-white shadow-md' 
                      : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300'}`}
                  onClick={() => setSelectedCategory(cat.value)}
                >
                  {cat.label}
                </button>
              ))}
              
              {isAdmin && (
                <button 
                  className="ml-4 px-4 py-2 bg-blue-600 text-white rounded-full text-sm font-medium hover:bg-blue-700 shadow-sm"
                  onClick={() => {
                    setEditingFaq(null);
                    setFaqForm({ category: 'VIDEO', question: '', answer: '', keywords: '' });
                    setShowFaqModal(true);
                  }}
                >
                  + FAQ 등록
                </button>
              )}
            </div>

            {/* 자주 찾는 질문 그리드 */}
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-6 px-2">자주 찾는 도움말</h3>
              
              {faqLoading ? (
                <div className="text-center py-20 text-gray-500">로딩 중...</div>
              ) : faqs.length === 0 ? (
                <div className="text-center py-20 bg-gray-50 rounded-xl text-gray-500 border border-dashed border-gray-300">
                  등록된 도움말이 없습니다.
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                    {/* ★ 슬라이스: visibleCount 만큼만 보여줍니다 */}
                    {faqs.slice(0, visibleCount).map(faq => (
                      <div 
                        key={faq.id} 
                        className="group bg-white border border-gray-200 rounded-xl p-6 cursor-pointer hover:border-gray-400 hover:shadow-lg transition-all duration-200 flex flex-col justify-between h-full min-h-[160px]"
                        onClick={() => handleFaqClick(faq.id)}
                      >
                        <div>
                          <div className="flex items-start gap-2 mb-3">
                            <span className="font-bold text-slate-900 text-lg leading-tight">Q.</span>
                            <span className="font-bold text-gray-800 leading-tight group-hover:underline decoration-2 underline-offset-4 line-clamp-3">
                              {faq.question}
                            </span>
                          </div>
                        </div>
                        <div className="mt-4">
                          <span className="inline-block px-2.5 py-1 bg-gray-100 text-gray-600 rounded text-xs font-bold">
                            #{faq.categoryName}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* ★ 더보기 버튼: 남은 FAQ가 있을 때만 표시 */}
                  {visibleCount < faqs.length && (
                    <div className="mt-10 text-center">
                      <button 
                        onClick={handleLoadMore}
                        className="px-10 py-3 bg-white border border-gray-300 text-gray-700 rounded-full font-bold hover:bg-gray-50 hover:border-gray-400 transition-all shadow-sm flex items-center gap-2 mx-auto"
                      >
                        <span>+ 도움말 더보기</span>
                        <span className="text-xs text-gray-400">({Math.min(visibleCount + 8, faqs.length)}/{faqs.length})</span>
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* 하단 액션 버튼 (챗봇, 문의하기) */}
            <div className="pt-12 border-t border-gray-200">
              <h3 className="text-xl font-bold text-gray-900 mb-6 px-2">다른 도움이 필요하신가요?</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* 1. 챗봇 상담 카드 */}
                <div 
                  onClick={() => setActiveTab('qa')}
                  className="bg-slate-800 hover:bg-slate-700 text-white rounded-xl p-8 cursor-pointer transition-colors shadow-lg flex items-center justify-between group"
                >
                  <div className="flex items-center gap-6">
                    {/* ★ 이모티콘 대신 이미지 사용 */}
                    {chatIcon ? (
                      <img src={chatIcon} alt="Chat Icon" className="w-16 h-16 rounded-full object-cover invert" />
                    ) : (
                      <span className="text-5xl">🤖</span> 
                    )}
                    <div>
                      <h4 className="text-xl font-bold mb-1">AI 챗봇 상담</h4>
                      <p className="text-slate-300 text-sm">
                        24시간 언제든지<br/>궁금한 점을 물어보세요.
                      </p>
                    </div>
                  </div>
                  <div className="bg-slate-700 group-hover:bg-slate-600 p-3 rounded-full transition-colors">
                    <span className="text-xl">➜</span>
                  </div>
                </div>

                {/* 2. 1:1 문의 카드 */}
                <div 
                  onClick={() => setActiveTab(isAdmin ? 'inquiry-admin' : 'inquiry')}
                  className="bg-slate-800 hover:bg-slate-700 text-white rounded-xl p-8 cursor-pointer transition-colors shadow-lg flex items-center justify-between group"
                >
                  <div className="flex items-center gap-6">
                     {/* ★ 이메일 아이콘 이미지 사용 */}
                     {emailIcon ? (
                       <img src={emailIcon} alt="Email Icon" className="w-16 h-16 rounded-full object-contain invert p-1" />
                     ) : (
                       <span className="text-5xl bg-white/10 rounded-full w-16 h-16 flex items-center justify-center grayscale brightness-200">📝</span>
                     )}
                    <div>
                      <h4 className="text-xl font-bold mb-1">{isAdmin ? '문의 관리' : '1:1 문의하기'}</h4>
                      <p className="text-slate-300 text-sm">
                        {isAdmin 
                          ? <>사용자 문의를 확인하고<br/>답변을 작성하세요.</>
                          : <>해결되지 않은 문제는<br/>직접 문의를 남겨주세요.</>}
                      </p>
                    </div>
                  </div>
                  <div className="bg-slate-700 group-hover:bg-slate-600 p-3 rounded-full transition-colors">
                    <span className="text-xl">➜</span>
                  </div>
                </div>

              </div>
            </div>
          </div>
        )}

        {/* --- 챗봇 화면 --- */}
        {activeTab === 'qa' && (
          <div className="max-w-4xl mx-auto animate-fadeIn">
            <BackButton /> {/* 뒤로가기 버튼 */}
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden flex flex-col h-[700px]">
              <div className="p-4 bg-slate-900 text-white font-medium flex items-center gap-3">
                 {/* 헤더에도 작은 아이콘 넣기 */}
                 {chatIcon && <img src={chatIcon} className="w-8 h-8 object-contain bg-white rounded-full p-1"/>}
                 <span>AI 상담원</span>
              </div>
              <div className="flex-1 overflow-y-auto p-6 bg-gray-50 space-y-4">
                {/* 환영 메시지 & 버튼 메뉴 (대화가 없을 때) */}
                {messages.length === 0 ? (
                  <div className="space-y-3">
                    {/* 환영 메시지 - 채팅 버블 형식 */}
                    <div className="flex justify-start">
                      <div className="max-w-[85%] bg-white border border-gray-200 rounded-2xl rounded-bl-none px-4 py-3 shadow-sm">
                        <p className="text-sm text-gray-800 leading-relaxed">
                          안녕하세요! 저희 뉴스 플랫폼 고객센터에 오신 것을 환영합니다.
                        </p>
                        <p className="text-sm text-gray-600 mt-1">어떤 도움을 드릴 수 있을까요?</p>
                        
                        {/* 뒤로가기 버튼 (메인이 아닐 때) */}
                        {menuLevel !== 'main' && (
                          <button
                            onClick={handleMenuBack}
                            className="flex items-center gap-1 text-blue-600 hover:text-blue-800 text-xs font-medium mt-3 transition-colors"
                          >
                            <span>←</span>
                            <span>뒤로가기</span>
                          </button>
                        )}
                        
                        {/* 메뉴 버튼 - 가로 나열, 글자 크기에 맞춤 */}
                        <div className="flex flex-wrap gap-2 mt-3">
                          {CHATBOT_MENU[menuLevel]?.map((item) => (
                            <button
                              key={item.id}
                              onClick={() => handleMenuClick(item)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 hover:bg-blue-50 border border-gray-200 hover:border-blue-400 rounded-full text-sm transition-all whitespace-nowrap"
                            >
                              {item.iconImg ? <img src={item.iconImg} alt="" className="w-4 h-4 object-contain" /> : item.icon && <span className="text-sm">{item.icon}</span>}
                              <span className="text-gray-700 hover:text-blue-600">{item.label}</span>
                            </button>
                          ))}
                        </div>
                        
                        <p className="text-xs text-gray-400 mt-3">
                          필요한 부분을 말씀해 주시면 최선을 다해 도와드리겠습니다!
                        </p>
                      </div>
                    </div>
                    
                    {/* 또는 직접 질문 안내 */}
                    <div className="text-center">
                      <span className="text-xs text-gray-400">── 또는 직접 질문해주세요 ──</span>
                    </div>
                  </div>
                ) : (
                  <>
                    {messages.map((msg, idx) => (
                      <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed shadow-sm
                          ${msg.role === 'user' ? 'bg-blue-600 text-white rounded-br-none' : 'bg-white border border-gray-200 text-gray-800 rounded-bl-none'}`}>
                          {msg.role === 'assistant' ? (
                            <div className="qa-markdown-content">
                              <ReactMarkdown
                                components={{
                                  // 굵은 글씨 스타일
                                  strong: ({node, ...props}) => <strong className="font-semibold text-blue-600" {...props} />,
                                  // 리스트 스타일 - 간격 줄임
                                  ol: ({node, ...props}) => <ol className="list-decimal list-inside space-y-1 my-2" {...props} />,
                                  ul: ({node, ...props}) => <ul className="list-disc list-inside space-y-1 my-2" {...props} />,
                                  li: ({node, ...props}) => <li className="leading-relaxed" {...props} />,
                                  // 문단 스타일
                                  p: ({node, ...props}) => <p className="mb-2 last:mb-0 leading-relaxed" {...props} />,
                                }}
                              >
                                {msg.content}
                              </ReactMarkdown>
                            </div>
                          ) : (
                            msg.content
                          )}
                        </div>
                      </div>
                    ))}
                    
                    {/* 대화 후 메뉴 버튼 (로딩 중 아닐 때) - 채팅 버블 형식 */}
                    {!qaLoading && (
                      <div className="flex justify-start">
                        <div className="max-w-[85%] bg-white border border-gray-200 rounded-2xl rounded-bl-none px-4 py-3 shadow-sm">
                          <p className="text-xs text-gray-500 mb-2">다른 도움이 필요하신가요?</p>
                          
                          {/* 뒤로가기 / 처음으로 버튼 */}
                          {(menuLevel !== 'main' || menuHistory.length > 0) && (
                            <div className="flex gap-2 mb-2">
                              {menuLevel !== 'main' && (
                                <button
                                  onClick={handleMenuBack}
                                  className="px-2 py-1 text-xs text-blue-600 hover:bg-blue-50 border border-blue-200 rounded-full transition-colors"
                                >
                                  ← 뒤로
                                </button>
                              )}
                              {menuHistory.length > 0 && (
                                <button
                                  onClick={handleMenuReset}
                                  className="inline-flex items-center gap-1 px-2 py-1 text-xs text-gray-600 hover:bg-gray-100 border border-gray-200 rounded-full transition-colors"
                                >
                                  <img src={homeIcon} alt="" className="w-3.5 h-3.5 object-contain" /> 처음으로
                                </button>
                              )}
                            </div>
                          )}
                          
                          {/* 메뉴 버튼 - 가로 나열, 글자 크기에 맞춤 */}
                          <div className="flex flex-wrap gap-1.5">
                            {CHATBOT_MENU[menuLevel]?.map((item) => (
                              <button
                                key={item.id}
                                onClick={() => handleMenuClick(item)}
                                className="inline-flex items-center gap-1 px-2.5 py-1 bg-gray-50 hover:bg-blue-50 border border-gray-200 hover:border-blue-400 rounded-full text-xs transition-all whitespace-nowrap"
                              >
                                {item.iconImg ? <img src={item.iconImg} alt="" className="w-3.5 h-3.5 object-contain" /> : item.icon && <span className="text-xs">{item.icon}</span>}
                                <span className="text-gray-700 hover:text-blue-600">{item.label}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                )}
                {qaLoading && <div className="text-sm text-gray-500 px-4">답변 작성 중...</div>}
                <div ref={messagesEndRef} />
              </div>
              <div className="p-4 bg-white border-t border-gray-200 flex gap-2">
                <input
                  type="text"
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="메시지를 입력하세요..."
                  disabled={qaLoading}
                />
                <button onClick={handleSendMessage} disabled={!inputMessage.trim() || qaLoading} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300">전송</button>
              </div>
            </div>
          </div>
        )}

        {/* --- 문의하기 화면 --- */}
        {(activeTab === 'inquiry' || activeTab === 'inquiry-admin') && (
          <div className="space-y-6 animate-fadeIn">
            <div className="flex justify-between items-end">
              <BackButton /> {/* 뒤로가기 버튼 */}
              {!activeTab.includes('admin') && (
                 <button className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 shadow-sm mb-6" onClick={() => setShowCreateModal(true)}>+ 1:1 문의 작성</button>
              )}
            </div>
            
            {/* 문의 내역 테이블 */}
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
               {/* ... (기존 테이블 코드 동일) ... */}
               <div className="grid grid-cols-12 gap-4 px-6 py-3 bg-gray-50 border-b border-gray-200 text-sm font-semibold text-gray-500">
                <div className="col-span-2 text-center">상태</div>
                <div className="col-span-1 text-center">분류</div>
                {activeTab === 'inquiry-admin' && <div className="col-span-2 text-center">작성자</div>}
                <div className={activeTab === 'inquiry-admin' ? 'col-span-4' : 'col-span-6'}>제목</div>
                <div className="col-span-3 text-right">작성일</div>
              </div>
              {inquiryLoading ? (
                <div className="text-center py-12 text-gray-500">로딩 중...</div>
              ) : inquiries.length === 0 ? (
                <div className="text-center py-12 text-gray-500">문의 내역이 없습니다.</div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {inquiries.map(inquiry => (
                    <div 
                      key={inquiry.id} 
                      className="grid grid-cols-12 gap-4 px-6 py-4 hover:bg-gray-50 cursor-pointer items-center"
                      onClick={() => activeTab === 'inquiry-admin' ? handleViewInquiryForAdmin(inquiry.id) : handleViewInquiry(inquiry.id)}
                    >
                      <div className="col-span-2 text-center">
                        <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold
                          ${inquiry.status === 'COMPLETED' ? 'bg-green-100 text-green-800' : inquiry.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' : 'bg-blue-100 text-blue-800'}`}>
                          {inquiry.statusName}
                        </span>
                      </div>
                      <div className="col-span-1 text-center text-sm text-gray-500">{inquiry.categoryName || '-'}</div>
                      {activeTab === 'inquiry-admin' && (
                        <div className="col-span-2 text-center text-sm text-gray-700">
                          {inquiry.userNickname || inquiry.userEmail || '-'}
                        </div>
                      )}
                      <div className={activeTab === 'inquiry-admin' ? 'col-span-4' : 'col-span-6'}>
                        <div className="text-sm font-medium text-gray-900 truncate">{inquiry.title}</div>
                      </div>
                      <div className="col-span-3 text-right text-sm text-gray-500">{new Date(inquiry.createdAt).toLocaleDateString()}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

      </div>

      {/* 모달 컴포넌트들 (FAQ 읽기, 문의 작성 등 - 기존 코드 유지) */}
      {readFaqModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setReadFaqModal(null)}>
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-start sticky top-0 bg-white">
              <div>
                <span className="inline-block px-2.5 py-1 bg-gray-100 text-gray-600 rounded text-xs font-bold mb-2">{readFaqModal.categoryName}</span>
                <h3 className="text-xl font-bold text-gray-900">{readFaqModal.question}</h3>
              </div>
              <button className="text-gray-400 hover:text-gray-600 text-2xl" onClick={() => setReadFaqModal(null)}>×</button>
            </div>
            <div className="px-8 py-8 prose max-w-none text-gray-700 whitespace-pre-wrap">{readFaqModal.answer}</div>
            {isAdmin && (
              <div className="px-8 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-2">
                <button className="px-4 py-2 border border-gray-300 rounded" onClick={() => openEditFaqModal(readFaqModal)}>수정</button>
                <button className="px-4 py-2 bg-red-50 text-red-600 rounded" onClick={() => handleDeleteFaq(readFaqModal.id)}>삭제</button>
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* 문의 작성 및 상세 모달, FAQ 관리 모달은 기존 코드와 동일하므로 생략하지 않고 포함되어 있다고 가정합니다 */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowCreateModal(false)}>
           <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6" onClick={e => e.stopPropagation()}>
              <h3 className="text-lg font-bold mb-4">문의 작성</h3>
              {/* 폼 내용 생략 (기존과 동일) */}
              <div className="space-y-4">
                  <select className="w-full border p-2 rounded" value={inquiryForm.category} onChange={e => setInquiryForm({...inquiryForm, category: e.target.value})}>
                      <option value="">카테고리 선택</option>
                      {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
                  <input type="text" className="w-full border p-2 rounded" placeholder="제목" value={inquiryForm.title} onChange={e => setInquiryForm({...inquiryForm, title: e.target.value})} />
                  <textarea className="w-full border p-2 rounded h-32" placeholder="내용" value={inquiryForm.content} onChange={e => setInquiryForm({...inquiryForm, content: e.target.value})} />
              </div>
              <div className="flex justify-end gap-2 mt-4">
                  <button onClick={() => setShowCreateModal(false)} className="px-4 py-2 border rounded">취소</button>
                  <button onClick={handleCreateInquiry} className="px-4 py-2 bg-slate-900 text-white rounded">등록</button>
              </div>
           </div>
        </div>
      )}
      
      {showDetailModal && selectedInquiry && (
         <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowDetailModal(false)}>
            <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full max-h-[80vh] overflow-y-auto p-6" onClick={e => e.stopPropagation()}>
               <div className="flex justify-between mb-4">
                   <h3 className="text-xl font-bold">{selectedInquiry.title}</h3>
                   <button onClick={() => setShowDetailModal(false)}>×</button>
               </div>
               <div className="bg-gray-50 p-4 rounded mb-4 whitespace-pre-wrap">{selectedInquiry.content}</div>
               {/* 답변 영역 로직 (기존과 동일) */}
               {selectedInquiry.adminResponse ? (
                   <div className="bg-blue-50 p-4 rounded border border-blue-100">
                       <div className="font-bold mb-2">관리자 답변</div>
                       {selectedInquiry.adminResponse}
                   </div>
               ) : isAdmin ? (
                   <div>
                       <textarea className="w-full border p-2 rounded h-24 mb-2" value={adminResponse} onChange={e => setAdminResponse(e.target.value)} placeholder="답변 입력"/>
                       <button onClick={handleAdminResponse} className="w-full bg-blue-600 text-white py-2 rounded">답변 등록</button>
                   </div>
               ) : <div className="text-gray-500 text-center">답변 대기 중</div>}
            </div>
         </div>
      )}

      {showFaqModal && (
        // FAQ 등록 모달 (기존과 동일)
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowFaqModal(false)}>
            <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6" onClick={e => e.stopPropagation()}>
               <h3 className="font-bold text-lg mb-4">{editingFaq ? 'FAQ 수정' : 'FAQ 등록'}</h3>
               <div className="space-y-3">
                  <select className="w-full border p-2 rounded" value={faqForm.category} onChange={e => setFaqForm({...faqForm, category: e.target.value})}>
                      {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
                  <input className="w-full border p-2 rounded" placeholder="질문" value={faqForm.question} onChange={e => setFaqForm({...faqForm, question: e.target.value})} />
                  <textarea className="w-full border p-2 rounded h-24" placeholder="답변" value={faqForm.answer} onChange={e => setFaqForm({...faqForm, answer: e.target.value})} />
                  <input className="w-full border p-2 rounded" placeholder="키워드" value={faqForm.keywords} onChange={e => setFaqForm({...faqForm, keywords: e.target.value})} />
               </div>
               <div className="flex justify-end gap-2 mt-4">
                  <button onClick={() => setShowFaqModal(false)} className="px-4 py-2 border rounded">취소</button>
                  <button onClick={handleSaveFaq} className="px-4 py-2 bg-slate-900 text-white rounded">저장</button>
               </div>
            </div>
        </div>
      )}

    </div>
  );
};

export default SupportPage;