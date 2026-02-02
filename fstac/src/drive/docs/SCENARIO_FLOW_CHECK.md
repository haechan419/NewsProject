# 드라이브 모드 시나리오별 코드 흐름 점검

사용자 시나리오를 기준으로, 각 단계에서 어떤 코드가 실행되는지 추적한 문서입니다.

---

## 1. 진입 ~ 환영 멘트 (FIRST_TIME / NEW_BRIEFING)

| 단계 | 사용자/시스템 동작 | 실행되는 코드 위치 | 상태/메시지 |
|------|-------------------|-------------------|-------------|
| 1.1 | 페이지 마운트 | `useEffect` (L468~494) → `initializeDriveMode()` → `enterDriveMode()` | - |
| 1.2 | `enterDriveMode()` 시작 | `enterDriveModeInProgressRef.current = true` (동시성 방지) | - |
| 1.3 | `driveApi.enterDriveMode(userId)` 성공 | L565~572: `setBriefingAudioUrl(welcomeAudioUrl)`, `setIsPlayingBriefing(true)`, `pendingEntryDataRef.current = data`, `playAudio(welcomeAudioUrl, null, 0)` | status: processing, message: "드라이브 모드에 오신 것을 환영합니다" |
| 1.4 | 환영 TTS 재생 완료 | `useDriveAudio` → `onPlaybackEnd(newsId=null)` (L259~380) | - |
| 1.5 | 브리핑 종료 처리 | `pendingEntryDataRef.current !== null` → `data.scenario === "NEW_BRIEFING" \|\| "FIRST_TIME_WELCOME"` (L309~333): 큐 설정, `data.briefingAudioUrl`로 추가 안내 재생 또는 `playNextNews()` | status: processing, "안녕하세요, 드라이브 모드 뉴스 브리핑을 시작합니다" 등 |
| 1.6 | 추가 안내 없이 큐만 있음 | L327~332: `playAudio(data.briefingAudioUrl, null, 0)` 또는 해당 분기 스킵 후 `onPlaybackEnd` 내 L363~368에서 `playNextNews()` | - |

**관련 상수/Ref:** `enterDriveModeInProgressRef`, `pendingEntryDataRef`, `briefingAudioUrlRef`, `isPlayingBriefingRef`

---

## 2. 재진입 시 이어듣기 선택 (RESUME_BRIEFING)

| 단계 | 사용자/시스템 동작 | 실행되는 코드 위치 | 상태/메시지 |
|------|-------------------|-------------------|-------------|
| 2.1 | 진입 응답이 `RESUME_BRIEFING` | `onPlaybackEnd(null)` 내 `data.scenario === "RESUME_BRIEFING"` (L279~307): `setResumeInfo`, `setCurrentNews`, 이어듣기 안내 TTS 재생 | "이전에 듣던 뉴스를 이어서 들으시겠습니까?" |
| 2.2 | 안내 TTS 종료 | `onPlaybackEnd(null)` (L336~360): `setShowResumeChoice(true)`, `waitTimerRef`로 **10초 타임아웃** 등록 | status: idle, message: "이전에 듣던 뉴스를 이어서 들을까요?" |
| 2.3 | **10초 동안 미선택** | `waitTimerRef` 콜백 (L350~365 또는 L197~210): `setStatusMessage("이어듣기 선택 시간이 지났습니다. 이어듣기를 자동으로 시작합니다.")`, `resumeInfoRef.current?.newsId` 있으면 **`handleResumeChoice("resume")`** 호출 | 자동 이어듣기 시작 |
| 2.4 | 10초 후 resumeInfo 없음 | 같은 콜백의 else: `setShowResumeChoice(false)`, `playNextNews()` 스케줄 | "다음 뉴스로 넘어갑니다" |
| 2.5 | 사용자가 "이어듣기" 선택 | `handleResumeChoice("resume")` (L1058~1081): `toResume = resumeInfo \|\| resumeInfoRef.current`, `playFixedMessage("RESUME_ANNOUNCEMENT")` 후 `playAudio(...startSentenceIdx)` | status: processing, "뉴스를 준비하고 있습니다..." |
| 2.6 | 사용자가 "새 브리핑" 선택 | `handleResumeChoice("new")` (L1082~1115): `driveApi.setDriveModeActive(false)` → `enterDriveMode()` → 큐/브리핑 URL 설정 후 `playAudio(finalBriefingUrl, null, 0)` | "새로운 뉴스 브리핑을 준비하고 있습니다..." |

**관련 상수:** `RESUME_CHOICE_TIMEOUT_MS = 10000`

---

## 3. 음성 명령 (녹음 → 처리 → 실행)

| 단계 | 사용자/시스템 동작 | 실행되는 코드 위치 | 상태/메시지 |
|------|-------------------|-------------------|-------------|
| 3.1 | 마이크 버튼 누름 (일반) | `handleMicrophoneButtonClick()` (L954~986): `startRecording()` 호출 | status: recording, message: "말씀해주세요... (말이 멈추면 자동 종료)" |
| 3.2 | PTT 훅에서 녹음 시작 | `usePushToTalk` `onRecordingStart` (L134~139): `setStatus("recording")`, `setStatusMessage("말씀해주세요... (말이 멈추면 자동 종료)")` | UI: StatusIndicator "녹음 중" + 위 메시지, pulse 애니메이션 |
| 3.3 | 마이크 버튼 뗌 | `handleMicrophoneButtonUp()` (L989~1043): 쿨다운/중복 처리 후 `setStatus("processing")`, `setStatusMessage("음성을 인식하고 있습니다...")`, `stopRecording()` → `processVoiceCommand(audioBlob)` | status: processing, "음성을 인식하고 있습니다..." |
| 3.4 | 음성 분석 API 성공 + intent 있음 | `processVoiceCommand` (L622~640): `commandRetryCountRef.current = 0`, `setStatus("success")`, `setStatusMessage("명령 실행: {intent}")`, `handleCommand(intent)` | status: success → 2초 후 idle |
| 3.5 | intent 없음 (STT 실패 등) | L641~656: `handleCommand("STT_FAILED")` 또는 `"UNKNOWN")`, `playFixedMessage(...)` | "음성을 인식하지 못했습니다..." 등 |
| 3.6 | 네트워크 오류 | L658~689: `commandRetryCountRef` 기반 최대 3회, 2초 간격 재시도. 실패 시 "네트워크 연결 오류" | status: error |

**관련 Ref:** `isProcessingCommandRef`, `lastCommandTimeRef`, `COMMAND_COOLDOWN = 1000`, `commandRetryCountRef`, `MAX_COMMAND_RETRIES`, `COMMAND_RETRY_DELAY_MS`

---

## 4. 명령별 실행 (handleCommand)

| Intent | 실행 코드 위치 | 고정 멘트 / 동작 |
|--------|----------------|------------------|
| NEXT | L828~833: `recordHistory(..., "SKIPPED")`, `playFixedMessage("NEXT").then(() => playNextNews())` | "다음 기사를 읽어드릴게요" 후 다음 뉴스 |
| PAUSE | L834~837: `togglePause()`, `playFixedMessage("PAUSE")` | "일시정지되었습니다" |
| RESUME | L838~841: `togglePause()`, `playFixedMessage("RESUME")` | "재생을 계속합니다" |
| **STOP** | L851~858: `recordHistory(..., "REJECTED")`, `setStatus("processing")`, `setStatusMessage("드라이브 모드를 종료합니다.")`, **`playFixedMessage("STOP").then(() => stopDriveMode()).catch(() => stopDriveMode())`** | "드라이브 모드를 종료합니다." 후 종료 |
| UNKNOWN | L859: `playFixedMessage("UNKNOWN")` | "명령을 이해하지 못했습니다. '다음', '일시정지' 같은 명령어를 말씀해주세요." |
| STT_FAILED | L860: `playFixedMessage("STT_FAILED")` | "음성을 인식하지 못했습니다. 더 크고 명확하게 말씀해주세요." |
| RESUME_CHOICE | L861: `handleResumeChoice("resume")` (resumeInfo 있을 때) | - |
| NEW_BRIEFING_CHOICE | L862: `handleResumeChoice("new")` | - |

---

## 5. 고정 멘트 재생 (playFixedMessage) 및 메모리 정리

| 단계 | 실행되는 코드 위치 | 비고 |
|------|-------------------|------|
| 5.1 | `playFixedMessage(intent)` 진입 | L754: `session = ++fixedMessageSessionRef.current`, L757: `cleanupFixedMessageAudio()` (이전 인스턴스 pause + 리스너 제거 + src='' + ref null) |
| 5.2 | 재생 시도 | L765~809: `playOnce(staticAudioUrl)` → 실패 시 `playOnce(apiFallbackUrl)`. `canplaythrough` → `audio.play().catch` (NotAllowedError 시 "재생을 위해 화면을 한 번 클릭해주세요.") |
| 5.3 | 종료/에러 시 | `onEnded` / `onError`: `finished = true`, `fixedMessageAudioRef.current = null` (해당 오디오만 해제) |
| 5.4 | finally | L819~821: `session === fixedMessageSessionRef.current`이면 `cleanupFixedMessageAudio()` 한 번 더 호출 |
| 5.5 | Unmount / stopDriveMode | L476~492: `fixedMessageSessionRef.current += 1`, `fixedMessageAudioRef.current` pause/src=''/null. `stopDriveMode()` (L917~918): `cleanupFixedMessageAudio()` |

**고정 멘트 키/문구 (시나리오별):**  
NEXT, PAUSE, RESUME, RESUME_ANNOUNCEMENT, UNKNOWN, STT_FAILED, HELP, QUEUE_EMPTY, TTS_RETRY, NEXT_NEWS_SUGGESTION, **STOP**("드라이브 모드를 종료합니다.")

---

## 6. 다음 뉴스 재생 (playNextNews)

| 단계 | 실행되는 코드 위치 | 비고 |
|------|-------------------|------|
| 6.1 | 진입 시 중복 방지 | L781~782: `if (isPlayingNextNewsRef.current) return;` → `isPlayingNextNewsRef.current = true` |
| 6.2 | 큐 비어 있음 | L784~789: `setStatusMessage("모든 뉴스를 재생했습니다")`, `setStatus("idle")`, `playFixedMessage("QUEUE_EMPTY")`, return |
| 6.3 | 큐에서 1개 추출 | L791~802: `nextNews = currentQueue[0]`, `setNewsQueue(newQueue)`, `setCurrentNews(newsWithTitle)`, `playAudio(audioUrl, nextNews.newsId, 0)` |
| 6.4 | 재생 시작 시 | `onPlaybackStart(newsId)` (L442~454): `isPlayingNextNewsRef.current = false`, `setStatus("playing")`, `newsStartTimeRef.current = Date.now()` 등 |
| 6.5 | 재생 종료 시 | `onPlaybackEnd(newsId)` (L416~439): `recordHistory(..., "COMPLETED")`, `lastProcessedNewsIdRef.current = newsId`, `playNextNews()` |

---

## 7. UI 피드백 요약 (recording / processing)

| 상태 | 설정 위치 | 표시 (StatusIndicator + 메시지) |
|------|-----------|----------------------------------|
| recording | `onRecordingStart` (L137~138), `handleMicrophoneButtonClick` (L962~963) | 라벨: "녹음 중", 메시지: "말씀해주세요... (말이 멈추면 자동 종료)", pulse |
| processing | `handleMicrophoneButtonUp` (L1012~1013), TTS 재시도 (L150~151), `handleResumeChoice` (L1068~1069), `playNextNews` (L888~889), STOP (L855~856) 등 | 라벨: "처리 중", 메시지: "음성을 인식하고 있습니다...", "뉴스를 준비하고 있습니다..." 등, pulse |
| success | `processVoiceCommand` (L632~633) | 라벨: "성공", 2초 후 idle 복귀 |

---

## 8. 네트워크 재시도 정책

| 대상 | 상수 | 코드 위치 |
|------|------|-----------|
| 진입 실패 | `MAX_INIT_RETRIES = 3`, `INIT_RETRY_DELAY_MS = 2000` | `enterDriveMode` catch (L576~596), `initRetryCountRef` |
| 음성 명령 실패 | `MAX_COMMAND_RETRIES = 3`, `COMMAND_RETRY_DELAY_MS = 2000` | `processVoiceCommand` catch (L662~684), `commandRetryCountRef` |

위 문서는 `DriveModePage.jsx` 및 `useDriveAudio` 기준으로 작성되었으며, 라인 번호는 변경될 수 있습니다.
