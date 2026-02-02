package com.fullStc.drive.util;

import java.util.HashMap;
import java.util.Map;

public class FuzzyMatchingUtil {
    
    // 단답형 명령어 사전
    private static final Map<String, String> COMMAND_MAP = new HashMap<>();
    
    static {
        // 단답형 명령어 패턴 정의
        // 다음 기사
        COMMAND_MAP.put("다음", "NEXT");
        COMMAND_MAP.put("넥스트", "NEXT");
        COMMAND_MAP.put("다음거", "NEXT");
        COMMAND_MAP.put("다음 기사", "NEXT");
        COMMAND_MAP.put("다음 뉴스", "NEXT");
        COMMAND_MAP.put("스킵", "NEXT");
        COMMAND_MAP.put("건너뛰기", "NEXT");
        COMMAND_MAP.put("건너뛰어", "NEXT");
        
        // 이전 기사
        COMMAND_MAP.put("이전", "PREV");
        COMMAND_MAP.put("이전거", "PREV");
        COMMAND_MAP.put("뒤로", "PREV");
        COMMAND_MAP.put("이전 뉴스", "PREV");
        COMMAND_MAP.put("이전 기사", "PREV");
        
        // 일시정지
        COMMAND_MAP.put("일시정지", "PAUSE");
        COMMAND_MAP.put("정지", "PAUSE");
        COMMAND_MAP.put("멈춰", "PAUSE");
        COMMAND_MAP.put("잠깐", "PAUSE");
        COMMAND_MAP.put("멈춤", "PAUSE");
        COMMAND_MAP.put("일시 정지", "PAUSE");
        
        // 재생
        COMMAND_MAP.put("재생", "RESUME");
        COMMAND_MAP.put("계속", "RESUME");
        COMMAND_MAP.put("다시", "RESUME");
        COMMAND_MAP.put("이어서", "RESUME");
        COMMAND_MAP.put("계속해", "RESUME");
        COMMAND_MAP.put("재개", "RESUME");
        
        // 중지
        COMMAND_MAP.put("중지", "STOP");
        COMMAND_MAP.put("그만", "STOP");
        COMMAND_MAP.put("끝", "STOP");
        COMMAND_MAP.put("종료", "STOP");
        COMMAND_MAP.put("그만해", "STOP");
        
        // 반복
        COMMAND_MAP.put("반복", "REPEAT");
        COMMAND_MAP.put("다시 들려줘", "REPEAT");
        COMMAND_MAP.put("다시 말해줘", "REPEAT");
        COMMAND_MAP.put("뭐라고", "REPEAT");
        COMMAND_MAP.put("뭐라고 했어", "REPEAT");
        
        // 이어듣기 선택
        COMMAND_MAP.put("이어듣기", "RESUME_CHOICE");
        COMMAND_MAP.put("이어서", "RESUME_CHOICE");
        COMMAND_MAP.put("계속 듣기", "RESUME_CHOICE");
        COMMAND_MAP.put("이전 뉴스", "RESUME_CHOICE");
        COMMAND_MAP.put("이어서 듣기", "RESUME_CHOICE");
        
        // 새 브리핑 선택
        COMMAND_MAP.put("새 브리핑", "NEW_BRIEFING_CHOICE");
        COMMAND_MAP.put("새로운", "NEW_BRIEFING_CHOICE");
        COMMAND_MAP.put("새로", "NEW_BRIEFING_CHOICE");
        COMMAND_MAP.put("처음부터", "NEW_BRIEFING_CHOICE");
        COMMAND_MAP.put("새로운 브리핑", "NEW_BRIEFING_CHOICE");
        
        // 히스토리
        COMMAND_MAP.put("히스토리", "HISTORY_OPEN");
        COMMAND_MAP.put("기록", "HISTORY_OPEN");
        COMMAND_MAP.put("들었던 뉴스", "HISTORY_OPEN");
        COMMAND_MAP.put("저장된 뉴스", "HISTORY_OPEN");
        
        // 도움말
        COMMAND_MAP.put("도움말", "HELP");
        COMMAND_MAP.put("명령어", "HELP");
        COMMAND_MAP.put("어떻게", "HELP");
        COMMAND_MAP.put("사용법", "HELP");
    }
    
    /**
     * 레벤슈타인 거리 계산
     */
    public static int levenshteinDistance(String s1, String s2) {
        int[][] dp = new int[s1.length() + 1][s2.length() + 1];
        
        for (int i = 0; i <= s1.length(); i++) {
            dp[i][0] = i;
        }
        for (int j = 0; j <= s2.length(); j++) {
            dp[0][j] = j;
        }
        
        for (int i = 1; i <= s1.length(); i++) {
            for (int j = 1; j <= s2.length(); j++) {
                if (s1.charAt(i - 1) == s2.charAt(j - 1)) {
                    dp[i][j] = dp[i - 1][j - 1];
                } else {
                    dp[i][j] = Math.min(
                        Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1),
                        dp[i - 1][j - 1] + 1
                    );
                }
            }
        }
        
        return dp[s1.length()][s2.length()];
    }
    
    /**
     * 단답형 명령어 매칭 (레벤슈타인 거리 기반)
     * @param input 사용자 입력 텍스트
     * @param threshold 최대 허용 거리 (기본값: 2)
     * @return 매칭된 Intent 또는 null
     */
    public static String matchCommand(String input, int threshold) {
        if (input == null || input.trim().isEmpty()) {
            return null;
        }
        
        input = input.trim().toLowerCase();
        
        // 정확한 매칭 먼저 시도
        if (COMMAND_MAP.containsKey(input)) {
            return COMMAND_MAP.get(input);
        }
        
        // 유사도 기반 매칭
        String bestMatch = null;
        int minDistance = Integer.MAX_VALUE;
        
        for (Map.Entry<String, String> entry : COMMAND_MAP.entrySet()) {
            int distance = levenshteinDistance(input, entry.getKey());
            if (distance < minDistance && distance <= threshold) {
                minDistance = distance;
                bestMatch = entry.getValue();
            }
        }
        
        return bestMatch;
    }
    
    /**
     * 기본 threshold(2)로 명령어 매칭
     */
    public static String matchCommand(String input) {
        return matchCommand(input, 2);
    }
}
