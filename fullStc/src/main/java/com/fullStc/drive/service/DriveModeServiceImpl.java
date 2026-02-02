package com.fullStc.drive.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fullStc.drive.dto.*;
import com.fullStc.drive.entity.*;
import com.fullStc.drive.enums.HistoryStatus;
import com.fullStc.drive.repository.*;
import com.fullStc.drive.util.FuzzyMatchingUtil;
import com.fullStc.member.domain.enums.NewsCategory;
import com.fullStc.member.service.CategoryService;
import com.fullStc.news.domain.NewsCluster;
import com.fullStc.news.repository.NewsClusterRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class DriveModeServiceImpl implements DriveModeService {

    private final PlaybackStateRepository playbackStateRepository;
    private final DriveCommandLogRepository driveCommandLogRepository;
    private final VoiceProcessingService voiceProcessingService;
    
    // 분리된 서비스들
    private final QueueService queueService;
    private final SettingsService settingsService;
    private final HistoryService historyService;
    
    // 플레이리스트 관련
    private final CategoryService categoryService;
    private final NewsClusterRepository newsClusterRepository;
    private final DriveHistoryRepository driveHistoryRepository;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Override
    @Transactional(readOnly = true)
    public EntryScenarioResponse getEntryScenario(Long userId) {
        log.info("[getEntryScenario] userId={}: 플레이리스트 선택 화면으로 진입", userId);
        return EntryScenarioResponse.builder()
                .scenario("PLAYLIST_SELECTION")
                .build();
    }

    @Override
    public NewsQueueResponse generateNewsQueue(Long userId) {
        // QueueService에 위임
        return queueService.generateNewsQueue(userId);
    }

    @Override
    public CommandIntentResponse analyzeCommand(String rawText, Long userId) {
        // 로컬 필터링만 수행 (Python 호출은 VoiceProcessingService에서)
        String intent = FuzzyMatchingUtil.matchCommand(rawText);
        
        if (intent != null) {
            // 로컬에서 처리 가능한 단답형 명령
            logCommand(userId, rawText, intent, 0.9f, true, null);
            
            return CommandIntentResponse.builder()
                    .intent(intent)
                    .confidence(0.9f)
                    .processedLocally(true)
                    .message("명령이 로컬에서 처리되었습니다: " + intent)
                    .build();
        }
        
        // 로컬에서 처리 불가능한 경우 (Python 호출은 Controller에서 결정)
        return CommandIntentResponse.builder()
                .intent(null)
                .confidence(0.0f)
                .processedLocally(false)
                .message("복잡한 명령은 Python 서버에서 분석합니다.")
                .build();
    }

    @Override
    @Transactional
    public void syncPlaybackState(Long userId, String playlistId, Integer currentTime) {
        Optional<PlaybackState> stateOpt = playbackStateRepository.findById(userId);
        
        PlaybackState state;
        if (stateOpt.isPresent()) {
            state = stateOpt.get();
            state.setPlaylistId(playlistId != null ? playlistId : "");
            state.setCurrentTime(currentTime != null ? currentTime : 0);
            state.setIsActive(true);
            state.setUpdatedAt(LocalDateTime.now());
        } else {
            state = PlaybackState.builder()
                    .userId(userId)
                    .playlistId(playlistId != null ? playlistId : "")
                    .currentTime(currentTime != null ? currentTime : 0)
                    .isActive(true)
                    .updatedAt(LocalDateTime.now())
                    .build();
        }
        
        playbackStateRepository.save(state);
        log.debug("재생 상태 동기화 완료: userId={}, playlistId={}, currentTime={}, updatedAt={}", 
                userId, playlistId, currentTime, state.getUpdatedAt());
    }

    @Override
    @Transactional
    public void setDriveModeActive(Long userId, Boolean isActive) {
        Optional<PlaybackState> stateOpt = playbackStateRepository.findById(userId);
        
        if (stateOpt.isPresent()) {
            PlaybackState state = stateOpt.get();
            state.setIsActive(isActive);
            
            // 비활성화 시 재생 상태 초기화 (다시 들어갔을 때 이전 명령이 이어서 나오지 않도록)
            if (!isActive) {
                state.setPlaylistId("");
                state.setCurrentTime(0);
            }
            
            playbackStateRepository.save(state);
        } else if (isActive) {
            // 활성화 시 새로 생성
            PlaybackState state = PlaybackState.builder()
                    .userId(userId)
                    .playlistId("")
                    .currentTime(0)
                    .isActive(true)
                    .updatedAt(LocalDateTime.now())
                    .build();
            playbackStateRepository.save(state);
        }
    }

    @Override
    public DriveSettingsDto getSettings(Long userId) {
        // SettingsService에 위임
        return settingsService.getSettings(userId);
    }

    @Override
    @Transactional
    public DriveSettingsDto updateSettings(Long userId, DriveSettingsDto dto) {
        // SettingsService에 위임
        return settingsService.updateSettings(userId, dto);
    }

    @Override
    @Transactional
    public void recordHistory(Long userId, String newsId, String category, 
                             HistoryStatus status, Integer listenDuration, Boolean isRecommended, Integer lastSentenceIdx) {
        // HistoryService에 위임
        historyService.recordHistory(userId, newsId, category, status, listenDuration, isRecommended, lastSentenceIdx);
    }

    @Override
    public List<DriveHistoryDto> getHistory(Long userId) {
        // HistoryService에 위임
        return historyService.getHistory(userId);
    }

    @Override
    @Transactional
    public void deleteHistory(Long historyId) {
        // HistoryService에 위임
        historyService.deleteHistory(historyId);
    }

    @Override
    @Transactional
    public void logCommand(Long userId, String rawText, String intent, Float confScore, Boolean isSuccess, String errorMsg) {
        DriveCommandLog log = DriveCommandLog.builder()
                .userId(userId)
                .rawText(rawText)
                .intent(intent)
                .confScore(confScore)
                .isSuccess(isSuccess)
                .errorMsg(errorMsg)
                .build();
        
        driveCommandLogRepository.save(log);
    }

    @Override
    public byte[] generateTTS(String text, String voiceType, Float speed, String newsId) {
        return voiceProcessingService.generateSpeech(text, voiceType, speed, newsId);
    }

    /**
     * 단건 뉴스 텍스트 조회 (단건 뉴스 이어듣기 전용).
     * 플레이리스트 방식에서는 문장 인덱스 없이 playback_position(초)만 사용함.
     */
    @Override
    public String getNewsText(String newsId, Integer startSentenceIdx) {
        String fullText = null;
        try {
            fullText = com.fullStc.drive.util.MockNewsData.getNewsTextByNewsId(newsId);
            if (fullText != null) {
                log.info("뉴스 텍스트 조회 성공: newsId={}, 텍스트 길이={}", newsId, fullText.length());
            } else {
                log.warn("MockNewsData에서 뉴스를 찾지 못함: newsId={}", newsId);
            }
        } catch (Exception e) {
            log.error("MockNewsData에서 뉴스 조회 중 오류 발생: newsId={}, error={}", newsId, e.getMessage(), e);
        }
        
        if (fullText == null || fullText.trim().isEmpty()) {
            log.warn("뉴스 텍스트가 비어있음. 기본 메시지 사용: newsId={}", newsId);
            fullText = "이것은 " + newsId + " 뉴스의 Mock TTS 텍스트입니다. 실제 구현 시 integrated_summary 테이블에서 summary_text를 조회합니다.";
        }
        
        if (startSentenceIdx != null && startSentenceIdx > 0) {
            String[] sentences = fullText.split("[.!?]\\s*");
            if (startSentenceIdx < sentences.length) {
                StringBuilder sb = new StringBuilder();
                for (int i = startSentenceIdx; i < sentences.length; i++) {
                    if (sb.length() > 0) {
                        sb.append(". ");
                    }
                    sb.append(sentences[i].trim());
                }
                fullText = sb.toString();
                log.debug("이어듣기: 문장 {}부터 재생 (총 {}문장)", startSentenceIdx, sentences.length);
            } else {
                log.warn("startSentenceIdx({})가 문장 수({})를 초과함. 전체 텍스트 사용", 
                        startSentenceIdx, sentences.length);
            }
        }
        
        return fullText;
    }

    @Override
    public String generateTTSUrl(String text, String voiceType, Float speed) {
        try {
            String normalizedVoiceType = normalizeVoiceType(voiceType);
            Float normalizedSpeed = speed != null ? speed : 1.0f;
            
            String ttsUrl = "/api/drive/tts/script?text=" + 
                    java.net.URLEncoder.encode(text, java.nio.charset.StandardCharsets.UTF_8) +
                    "&voiceType=" + normalizedVoiceType + 
                    "&speed=" + normalizedSpeed;
            
            return ttsUrl;
        } catch (Exception e) {
            log.error("TTS URL 생성 실패: text={}, voiceType={}, speed={}, error={}", 
                    text, voiceType, speed, e.getMessage(), e);
            throw new RuntimeException("TTS URL 생성 실패", e);
        }
    }

    private String normalizeVoiceType(String voiceType) {
        if (voiceType == null || voiceType.trim().isEmpty() || "DEFAULT".equalsIgnoreCase(voiceType)) {
            return "nova";
        }
        return voiceType.toLowerCase();
    }

    @Override
    @Transactional(readOnly = true)
    public List<PlaylistMetadataDto> getPlaylists(Long userId) {
        log.info("[getPlaylists] userId={}", userId);
        
        List<String> userCategories = categoryService.getUserCategories(userId);
        int expectedCount = 3;
        
        List<PlaylistMetadataDto> playlists = new ArrayList<>();
        
        playlists.add(PlaylistMetadataDto.builder()
                .id("interest")
                .title("오늘의 관심 뉴스")
                .description("관심 카테고리 뉴스를 모았습니다")
                .expectedCount(expectedCount)
                .build());
        
        playlists.add(PlaylistMetadataDto.builder()
                .id("latest")
                .title("오늘의 주요 뉴스")
                .description("오늘 가장 중요한 뉴스를 모았습니다")
                .expectedCount(3)
                .build());
        
        playlists.add(PlaylistMetadataDto.builder()
                .id("economy")
                .title("경제·비즈니스 뉴스")
                .description("경제와 비즈니스 관련 뉴스를 모았습니다")
                .expectedCount(3)
                .build());
        
        playlists.add(PlaylistMetadataDto.builder()
                .id("politics_society")
                .title("정치·사회 뉴스")
                .description("정치와 사회 관련 뉴스를 모았습니다")
                .expectedCount(3)
                .build());
        
        playlists.add(PlaylistMetadataDto.builder()
                .id("it")
                .title("IT·과학 뉴스")
                .description("IT와 과학 관련 뉴스를 모았습니다")
                .expectedCount(3)
                .build());
        
        playlists.add(PlaylistMetadataDto.builder()
                .id("hot")
                .title("긴급 속보")
                .description("지금 가장 중요한 긴급 뉴스를 모았습니다")
                .expectedCount(3)
                .build());
        
        return playlists;
    }

    @Override
    @Transactional
    public PlaylistSelectionResponse selectPlaylist(Long userId, String playlistId) {
        log.info("[selectPlaylist] userId={}, playlistId={}", userId, playlistId);
        
        List<NewsCluster> clusters;
        String playlistTitle;
        int limit;
        String interestEmptyMessage = null;
        List<String> interestAllowedCrawlCategories = null;
        
        switch (playlistId) {
            case "interest":
                List<String> userCategories = categoryService.getUserCategories(userId);
                log.info("[selectPlaylist] interest - userCategories(from DB)={}", userCategories);
                if (userCategories.isEmpty()) {
                    clusters = new ArrayList<>();
                    interestEmptyMessage = "관심 카테고리를 설정해주세요.";
                } else {
                    List<String> categoriesForQuery = toCrawlCategories(userCategories);
                    log.info("[selectPlaylist] interest - categoriesForQuery(크롤용)={}", categoriesForQuery);
                    interestAllowedCrawlCategories = new ArrayList<>(categoriesForQuery);
                    if (categoriesForQuery.isEmpty()) {
                        clusters = new ArrayList<>();
                        interestEmptyMessage = "관심 카테고리를 설정해주세요.";
                    } else {
                        clusters = getInterestClustersBalanced(categoriesForQuery, 3);
                        clusters = filterClustersByRequestedCategories(clusters, categoriesForQuery);
                        if (clusters.isEmpty()) {
                            interestEmptyMessage = "해당 카테고리의 뉴스가 없습니다.";
                        }
                    }
                }
                playlistTitle = "오늘의 관심 뉴스";
                limit = 3;
                break;
                
            case "latest":
                clusters = newsClusterRepository.findTop20ByClusterSummaryIsNotNullOrderByIdDesc()
                        .stream().limit(3).collect(Collectors.toList());
                playlistTitle = "오늘의 주요 뉴스";
                limit = 3;
                break;
                
            case "economy":
                clusters = getInterestClustersBalanced(Arrays.asList("economy", "business"), 3);
                playlistTitle = "경제·비즈니스 뉴스";
                limit = 3;
                break;
                
            case "politics_society":
                clusters = getInterestClustersBalanced(Arrays.asList("politics", "society"), 3);
                playlistTitle = "정치·사회 뉴스";
                limit = 3;
                break;
                
            case "it":
                clusters = getInterestClustersBalanced(Collections.singletonList("it"), 3);
                playlistTitle = "IT·과학 뉴스";
                limit = 3;
                break;
                
            case "hot":
                clusters = newsClusterRepository.findTop20ByClusterSummaryIsNotNullOrderByIdDesc()
                        .stream().limit(3).collect(Collectors.toList());
                playlistTitle = "긴급 속보";
                limit = 3;
                break;
                
            default:
                throw new IllegalArgumentException("알 수 없는 플레이리스트 ID: " + playlistId);
        }
        
        List<NewsItemDto> newsList = clusters.stream()
                .map(cluster -> {
                    String summary = (cluster.getClusterSummary() != null && !cluster.getClusterSummary().trim().isEmpty())
                            ? cluster.getClusterSummary()
                            : (cluster.getClusterTitle() != null ? cluster.getClusterTitle() : "");
                    return NewsItemDto.builder()
                            .newsId(String.valueOf(cluster.getId()))
                            .clusterKey(cluster.getClusterKey())
                            .title(cluster.getClusterTitle() != null ? cluster.getClusterTitle() : "제목 없음")
                            .category(cluster.getCategory() != null ? cluster.getCategory() : "일반")
                            .summary(summary)
                            .build();
                })
                .collect(Collectors.toList());
        
        final List<String> allowedForInterestFilter = interestAllowedCrawlCategories;
        if ("interest".equals(playlistId) && allowedForInterestFilter != null && !allowedForInterestFilter.isEmpty()) {
            newsList = newsList.stream()
                    .filter(item -> {
                        String crawl = normalizeClusterCategoryToCrawl(item.getCategory());
                        boolean allow = crawl != null && allowedForInterestFilter.contains(crawl);
                        if (!allow && item.getCategory() != null) {
                            log.debug("[selectPlaylist] interest - 제외: category={} -> crawl={}", item.getCategory(), crawl);
                        }
                        return allow;
                    })
                    .collect(Collectors.toList());
            if (newsList.isEmpty()) {
                interestEmptyMessage = interestEmptyMessage != null ? interestEmptyMessage : "해당 카테고리의 뉴스가 없습니다.";
            }
        }
        
        if (newsList.isEmpty()) {
            String msg = "interest".equals(playlistId) && interestEmptyMessage != null
                    ? interestEmptyMessage
                    : "해당 카테고리의 뉴스가 없습니다.";
            return PlaylistSelectionResponse.builder()
                    .playlistId(playlistId)
                    .playlistTitle(playlistTitle)
                    .newsList(newsList)
                    .message(msg)
                    .historyId(null)
                    .audioUrl(null)
                    .build();
        }
        
        // 현재 뉴스 목록의 clusterKey 목록 (정렬) - null 제외
        List<String> currentClusterKeys = newsList.stream()
                .map(NewsItemDto::getClusterKey)
                .filter(key -> key != null && !key.isEmpty())  // null 및 빈 문자열 제외
                .sorted()
                .collect(Collectors.toList());
        
        // 최근 1시간 내 같은 플레이리스트의 히스토리 조회
        LocalDateTime oneHourAgo = LocalDateTime.now().minusHours(1);
        List<DriveHistory> recentHistories = driveHistoryRepository.findByUserIdAndPlaylistIdAndCreatedAtAfter(
                userId, playlistId, oneHourAgo);
        
        // 같은 뉴스 목록인 히스토리 찾기 (clusterKey로 비교)
        Optional<DriveHistory> duplicateHistory = recentHistories.stream()
                .filter(h -> {
                    try {
                        if (h.getNewsList() == null || h.getNewsList().isEmpty()) {
                            return false;
                        }
                        List<NewsItemDto> historyNewsList = objectMapper.readValue(
                                h.getNewsList(),
                                new TypeReference<List<NewsItemDto>>() {});
                        List<String> historyClusterKeys = historyNewsList.stream()
                                .map(NewsItemDto::getClusterKey)
                                .filter(key -> key != null && !key.isEmpty())  // null 및 빈 문자열 제외
                                .sorted()
                                .collect(Collectors.toList());
                        return currentClusterKeys.equals(historyClusterKeys);
                    } catch (Exception e) {
                        log.warn("히스토리 뉴스 목록 파싱 실패: historyId={}, error={}", h.getHistoryId(), e.getMessage());
                        return false;
                    }
                })
                .findFirst();
        
        Long historyId;
        boolean isDuplicate = false;
        String message = null;
        
        if (duplicateHistory.isPresent()) {
            // 같은 뉴스 목록이면 기존 히스토리 재사용
            historyId = duplicateHistory.get().getHistoryId();
            isDuplicate = true;
            message = "뉴스가 아직 업데이트되지 않았습니다. 이전 플레이리스트를 재생합니다.";
            log.info("[selectPlaylist] 같은 뉴스 목록 발견: userId={}, playlistId={}, historyId={}", 
                    userId, playlistId, historyId);
        } else {
            // 새로운 히스토리 생성
            historyId = historyService.createPlaylistHistory(userId, playlistId, playlistTitle, newsList);
            log.info("[selectPlaylist] 새로운 히스토리 생성: userId={}, playlistId={}, historyId={}", 
                    userId, playlistId, historyId);
        }
        
        String audioUrl = String.format("/api/drive/tts/playlist?playlistId=%s&historyId=%d", playlistId, historyId);
        
        return PlaylistSelectionResponse.builder()
                .historyId(historyId)
                .playlistId(playlistId)
                .playlistTitle(playlistTitle)
                .newsList(newsList)
                .audioUrl(audioUrl)
                .isDuplicate(isDuplicate)
                .message(message)
                .build();
    }

    /** Category-first, then summary-required. Balanced count per category, then take top by updatedAt. No fallback to other categories. */
    private List<NewsCluster> getInterestClustersBalanced(List<String> categoriesForQuery, int totalLimit) {
        if (categoriesForQuery == null || categoriesForQuery.isEmpty()) {
            return new ArrayList<>();
        }
        if (categoriesForQuery.size() == 1) {
            return newsClusterRepository.findByCategoriesOrderByUpdatedAtDesc(categoriesForQuery, totalLimit);
        }
        int perCategory = (int) Math.ceil((double) totalLimit / categoriesForQuery.size());
        List<NewsCluster> merged = new ArrayList<>();
        for (String category : categoriesForQuery) {
            List<String> one = Collections.singletonList(category);
            merged.addAll(newsClusterRepository.findByCategoriesOrderByUpdatedAtDesc(one, perCategory));
        }
        // ID 기준 중복 제거 후 updatedAt 최신순 정렬, 상위 totalLimit건
        return merged.stream()
                .collect(Collectors.toMap(NewsCluster::getId, c -> c, (a, b) -> a))
                .values().stream()
                .sorted(Comparator.comparing(NewsCluster::getUpdatedAt, Comparator.nullsLast(Comparator.reverseOrder())))
                .limit(totalLimit)
                .collect(Collectors.toList());
    }

    /**
     * 관심 플레이리스트 전용: DB에서 잘못 반환된 다른 카테고리(e.g. economy)를 제거하고,
     * 요청한 카테고리(categoriesForQuery)에 해당하는 클러스터만 반환
     */
    private List<NewsCluster> filterClustersByRequestedCategories(List<NewsCluster> clusters, List<String> categoriesForQuery) {
        if (clusters == null || categoriesForQuery == null || categoriesForQuery.isEmpty()) {
            return clusters != null ? clusters : new ArrayList<>();
        }
        return clusters.stream()
                .filter(c -> {
                    String crawl = normalizeClusterCategoryToCrawl(c.getCategory());
                    return crawl != null && categoriesForQuery.contains(crawl);
                })
                .collect(Collectors.toList());
    }

    /** news_cluster.category(DB 값, 한글/영문 혼용 가능)를 크롤 카테고리(소문자 영문)로 정규화 */
    private String normalizeClusterCategoryToCrawl(String category) {
        if (category == null || category.isBlank()) return null;
        String t = category.trim();
        try {
            return NewsCategory.fromCrawlCategory(t).toCrawlCategory();
        } catch (IllegalArgumentException e1) {
            try {
                return NewsCategory.fromDisplayName(t).toCrawlCategory();
            } catch (IllegalArgumentException e2) {
                return null;
            }
        }
    }

    /**
     * 회원 관심 카테고리(한글 표시명)를 news_cluster용 영문 카테고리로 변환 (드라이브 모드 전용)
     */
    private List<String> toCrawlCategories(List<String> userCategories) {
        if (userCategories == null || userCategories.isEmpty()) {
            return List.of();
        }
        List<String> result = new ArrayList<>();
        for (String cat : userCategories) {
            if (cat == null || cat.isBlank()) continue;
            String trimmed = cat.trim();
            try {
                NewsCategory nc = NewsCategory.fromCrawlCategory(trimmed);
                result.add(nc.toCrawlCategory());
            } catch (IllegalArgumentException e1) {
                try {
                    NewsCategory nc = NewsCategory.fromDisplayName(trimmed);
                    result.add(nc.toCrawlCategory());
                } catch (IllegalArgumentException e2) {
                    String lower = trimmed.toLowerCase();
                    switch (lower) {
                        case "엔터":
                        case "엔터테인먼트":
                        case "스포츠":
                            result.add("culture");
                            break;
                        case "국제":
                            result.add("world");
                            break;
                        case "it/과학":
                        case "it":
                            result.add("it");
                            break;
                        default:
                            log.debug("[drive] 알 수 없는 관심 카테고리, 조회에서 제외: {}", trimmed);
                            break;
                    }
                }
            }
        }
        return result.stream().distinct().collect(Collectors.toList());
    }
    
    @Override
    public DriveHistoryDto getHistoryById(Long historyId) {
        return historyService.getHistoryById(historyId);
    }

    @Override
    public List<NewsItemDto> getNewsListForTTS(Long historyId) {
        DriveHistoryDto history = historyService.getHistoryById(historyId);
        if (history == null) {
            return null;
        }
        List<NewsItemDto> newsList = new ArrayList<>();
        if (history.getNewsList() != null) {
            for (NewsItemDto item : history.getNewsList()) {
                newsList.add(NewsItemDto.builder()
                        .newsId(item.getNewsId())
                        .title(item.getTitle())
                        .category(item.getCategory())
                        .summary(item.getSummary() != null ? item.getSummary() : "")
                        .build());
            }
        }
        return newsList;
    }
    
    @Override
    public byte[] getHistoryTTS(Long historyId) {
        DriveHistoryDto history = historyService.getHistoryById(historyId);
        if (history == null) {
            log.warn("히스토리를 찾을 수 없음: historyId={}", historyId);
            return null;
        }
        return voiceProcessingService.getHistoryTTS(historyId);
    }
    
    @Override
    public void updatePlaylistHistory(Long historyId, HistoryStatus status, Integer currentTime, Integer listenDuration) {
        historyService.updatePlaylistHistory(historyId, status, currentTime, listenDuration);
    }

}
