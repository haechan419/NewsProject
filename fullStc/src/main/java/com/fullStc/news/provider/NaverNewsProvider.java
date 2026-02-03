package com.fullStc.news.provider;

import org.springframework.http.HttpHeaders;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;
import com.fullStc.news.dto.UnifiedArticle;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Instant;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.concurrent.ThreadLocalRandom;

@Component
public class NaverNewsProvider implements NewsProvider {

    private final WebClient client;
    private final String clientId;
    private final String clientSecret;

    public NaverNewsProvider(
            WebClient.Builder builder,
            org.springframework.core.env.Environment env) {
        this.clientId = Objects.requireNonNull(env.getProperty("news.naver.clientId"), "NAVER_CLIENT_ID missing");
        this.clientSecret = Objects.requireNonNull(env.getProperty("news.naver.clientSecret"),
                "NAVER_CLIENT_SECRET missing");
        String baseUrl = Objects.requireNonNull(env.getProperty("news.naver.baseUrl"), "naver baseUrl missing");

        this.client = builder
                .baseUrl(baseUrl)
                .defaultHeader("X-Naver-Client-Id", clientId)
                .defaultHeader("X-Naver-Client-Secret", clientSecret)
                .build();
    }

    @Override
    public String name() {
        return "naver";
    }

    @Override
    public List<UnifiedArticle> fetch(String category, String query, int size) {

        // ★ [수정 1] 검색어(query)가 없으면 카테고리를 한국어 검색어로 변환!
        // (스케줄러가 query를 null로 보내도, 여기서 알아서 한국어로 바꿔서 검색함)
        String finalQuery = query;
        if (finalQuery == null || finalQuery.isBlank()) {
            finalQuery = mapCategoryToKeyword(category);
        }

        // size: 최대 100까지 가능하지만 MVP는 20~30 추천
        String targetQuery = finalQuery; // lambda용 final 변수

        Map resp = client.get()
                .uri(uriBuilder -> uriBuilder
                        .queryParam("query", targetQuery) // ★ 수정된 검색어 사용
                        .queryParam("display", Math.min(Math.max(size, 1), 30))
                        .queryParam("sort", "date") // sim(정확도순) or date(날짜순)
                        .build())
                .header(HttpHeaders.ACCEPT, "application/json")
                .retrieve()
                .bodyToMono(Map.class)
                .block();

        if (resp == null)
            return List.of();
        Object itemsObj = resp.get("items");
        if (!(itemsObj instanceof List<?> items))
            return List.of();

        List<UnifiedArticle> out = new ArrayList<>();
        for (Object o : items) {
            if (!(o instanceof Map<?, ?> m))
                continue;

            String title = stripHtml(s(m.get("title")));
            String summary = stripHtml(s(m.get("description")));
            String url = s(m.get("link"));
            String pubDate = s(m.get("pubDate"));
            Instant publishedAt = parseRfc1123(pubDate);

            // ID 생성 로직 (URL 없으면 제목+날짜로 해시)
            String id = hash(url.isBlank() ? (title + "|" + pubDate) : url);

            out.add(new UnifiedArticle(
                    id,
                    title,
                    summary,
                    url,
                    null,
                    publishedAt,
                    "Naver Search",
                    name(),
                    category // 원본 카테고리 유지
            ));
        }
        return out;
    }

    // ★ [수정 2] 영어 카테고리를 네이버 검색용 한국어 키워드로 변환하는 메소드 추가
// ; 필요

    private String mapCategoryToKeyword(String category) {
        if (category == null) return "뉴스";

        List<String> keywords;

        switch (category.toLowerCase()) {
            case "politics":
                // [정치] 국회와 정당이 기사를 쏟아냅니다.
                keywords = List.of(
                        // 🔥 대장 키워드 (확률 UP)
                        "정치", "정치", "정치", "정치", "정치",
                        "국회", "국회", "국회",
                        "대통령실", "대통령실",

                        // 🌊 세부 키워드 (다양성)
                        "국민의힘", "더불어민주당", "총선", "선거", "정당",
                        "행정", "입법", "정책", "외교", "안보", "통일",
                        "국무회의", "장관", "인사청문회", "지방자치"
                );
                break;

            case "economy":
                // [경제] 주식, 부동산, 기업이 메인입니다.
                keywords = List.of(
                        // 🔥 대장 키워드
                        "경제", "경제", "경제", "경제", "경제",
                        "증시", "증시", "주식", "코스피",
                        "부동산", "부동산", "아파트",

                        // 🌊 세부 키워드
                        "기업", "삼성전자", "SK", "현대차", "재테크",
                        "금융", "은행", "금리", "환율", "물가",
                        "수출", "무역", "반도체", "배터리", "스타트업",
                        "가상화폐", "비트코인", "재계", "분양"
                );
                break;

            case "society":
                // [사회] 사건사고와 날씨는 실시간으로 뜹니다.
                keywords = List.of(
                        // 🔥 대장 키워드
                        "사회", "사회", "사회", "사회", "사회",
                        "사건", "사건", "사고", "사고",
                        "날씨", "날씨",

                        // 🌊 세부 키워드
                        "교육", "입시", "학교", "노동", "임금", "파업",
                        "환경", "기후", "미세먼지", "의료", "병원", "건강",
                        "법원", "재판", "검찰", "경찰", "수사",
                        "교통", "지하철", "복지", "인권", "시위"
                );
                break;

            case "culture":
                // [문화] 연예계 소식과 건강 정보가 가장 빠릅니다.
                keywords = List.of(
                        // 🔥 대장 키워드
                        "생활", "생활", "문화", "문화", "문화",
                        "연예", "연예", "방송", "방송",

                        // 🌊 세부 키워드
                        "여행", "관광", "맛집", "음식", "요리",
                        "건강", "헬스", "운동", "다이어트",
                        "영화", "극장", "OTT", "넷플릭스",
                        "도서", "책", "신간", "공연", "전시", "미술",
                        "축제", "패션", "뷰티"
                );
                break;

            case "world":
                // [국제] 미국, 중국, 일본이 뉴스의 80%입니다.
                keywords = List.of(
                        // 🔥 대장 키워드
                        "국제", "국제", "국제", "국제", "국제",
                        "미국", "미국", "미국",
                        "중국", "중국",
                        "일본", "일본",

                        // 🌊 세부 키워드
                        "유럽", "영국", "프랑스", "독일",
                        "아시아", "베트남", "인도",
                        "러시아", "우크라이나", "중동", "이스라엘",
                        "해외주식", "나스닥", "테슬라", "애플"
                );
                break;

            case "it":
                // [IT] AI와 스마트폰이 대세입니다.
                keywords = List.of(
                        // 🔥 대장 키워드
                        "IT", "IT", "IT", "IT", "IT",
                        "과학", "과학", "기술", "테크",
                        "AI", "AI", "인공지능",

                        // 🌊 세부 키워드
                        "스마트폰", "갤럭시", "아이폰", "모바일", "앱",
                        "게임", "롤", "e스포츠",
                        "카카오", "네이버", "플랫폼",
                        "보안", "해킹", "우주", "로봇", "드론",
                        "통신", "5G", "6G", "클라우드", "데이터"
                );
                break;

            default:
                keywords = List.of(category);
        }

        // 랜덤 뽑기
        String selectedKeyword = keywords.get(ThreadLocalRandom.current().nextInt(keywords.size()));

        // 로그 확인용
        System.out.println("🎲 [" + category + "] 뽑힌 검색어: " + selectedKeyword);

        return selectedKeyword;
    }

    private static String s(Object v) {
        return v == null ? "" : String.valueOf(v);
    }

    private static String stripHtml(String x) {
        if (x == null)
            return "";
        return x.replaceAll("<[^>]*>", "").replace("&quot;", "\"").replace("&apos;", "'").trim();
    }

    private static Instant parseRfc1123(String pubDate) {
        try {
            // 예: "Thu, 22 Jan 2026 00:00:00 +0900"
            ZonedDateTime zdt = ZonedDateTime.parse(pubDate, DateTimeFormatter.RFC_1123_DATE_TIME);
            return zdt.toInstant();
        } catch (Exception e) {
            return Instant.EPOCH;
        }
    }

    private static String hash(String input) {
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            byte[] dig = md.digest(input.getBytes(StandardCharsets.UTF_8));
            StringBuilder sb = new StringBuilder();
            for (byte b : dig)
                sb.append(String.format("%02x", b));
            return sb.toString();
        } catch (Exception e) {
            return UUID.randomUUID().toString();
        }
    }
}