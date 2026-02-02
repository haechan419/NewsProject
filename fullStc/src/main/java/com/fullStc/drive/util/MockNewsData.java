package com.fullStc.drive.util;

import com.fullStc.drive.dto.NewsSummaryDto;
import java.util.*;

/**
 * Mock 뉴스 데이터 제공 유틸리티
 * 
 * 테스트용 실제 뉴스 예시 데이터를 제공합니다.
 */
public class MockNewsData {
    
    // 카테고리별 Mock 뉴스 데이터
    private static final Map<String, List<NewsSummaryDto>> MOCK_NEWS_BY_CATEGORY = new HashMap<>();
    
    static {
        initializeMockData();
    }
    
    private static void initializeMockData() {
        // IT 카테고리
        List<NewsSummaryDto> itNews = Arrays.asList(
            NewsSummaryDto.builder()
                .newsId("mock_it_001")
                .category("IT")
                .title("AI 기술 발전으로 인한 산업 변화")
                .summaryText("최근 인공지능 기술의 급속한 발전으로 여러 산업 분야에서 혁신이 일어나고 있습니다. 특히 생성형 AI의 등장으로 콘텐츠 제작, 고객 서비스, 의료 진단 등 다양한 영역에서 변화가 감지되고 있습니다. 전문가들은 이러한 기술이 향후 5년 내 많은 직업의 형태를 바꿀 것으로 예상하고 있습니다.")
                .isHot(false)
                .build(),
            NewsSummaryDto.builder()
                .newsId("mock_it_002")
                .category("IT")
                .title("클라우드 컴퓨팅 시장 급성장")
                .summaryText("국내 클라우드 컴퓨팅 시장이 올해 전년 대비 30% 이상 성장할 것으로 전망됩니다. 중소기업들의 클라우드 전환 가속화와 공공기관의 디지털 전환 프로젝트가 주요 성장 동력으로 꼽히고 있습니다.")
                .isHot(false)
                .build(),
            NewsSummaryDto.builder()
                .newsId("mock_it_003")
                .category("IT")
                .title("사이버 보안 강화 정책 발표")
                .summaryText("정부가 기업들의 사이버 보안 역량 강화를 위한 종합 지원 방안을 발표했습니다. 특히 중소기업 대상 보안 컨설팅과 교육 프로그램을 확대하고, 보안 솔루션 도입 시 재정 지원을 제공한다고 밝혔습니다.")
                .isHot(false)
                .build()
        );
        MOCK_NEWS_BY_CATEGORY.put("IT", itNews);
        
        // 경제 카테고리
        List<NewsSummaryDto> economyNews = Arrays.asList(
            NewsSummaryDto.builder()
                .newsId("mock_economy_001")
                .category("경제")
                .title("중소기업 지원 정책 발표")
                .summaryText("정부가 오늘 중소기업 경쟁력 강화를 위한 종합 지원 패키지를 발표했습니다. 이번 정책은 자금 지원, 세제 혜택, 인력 양성 프로그램 등을 포함하고 있으며, 내년 상반기부터 단계적으로 시행될 예정입니다. 특히 기술 중소기업에 대한 R&D 지원을 대폭 확대한다는 점이 눈에 띕니다.")
                .isHot(false)
                .build(),
            NewsSummaryDto.builder()
                .newsId("mock_economy_002")
                .category("경제")
                .title("수출 회복세 지속")
                .summaryText("올해 11월 수출이 전년 동월 대비 5% 증가하며 회복세를 이어가고 있습니다. 반도체와 자동차 부품 수출이 크게 늘어났으며, 신흥국 시장 진출 확대로 수출 다변화도 진행되고 있습니다.")
                .isHot(false)
                .build(),
            NewsSummaryDto.builder()
                .newsId("mock_economy_003")
                .category("경제")
                .title("부동산 시장 안정화 조치")
                .summaryText("정부가 부동산 시장 안정화를 위한 추가 조치를 발표했습니다. 투기 수요 억제와 실수요자 지원에 중점을 두고 있으며, 특히 청년층 주거 안정을 위한 임대주택 공급 확대 계획이 포함되어 있습니다.")
                .isHot(false)
                .build()
        );
        MOCK_NEWS_BY_CATEGORY.put("경제", economyNews);
        
        // 정치 카테고리
        List<NewsSummaryDto> politicsNews = Arrays.asList(
            NewsSummaryDto.builder()
                .newsId("mock_politics_001")
                .category("정치")
                .title("국정 개혁 방안 논의")
                .summaryText("국회에서 국정 개혁을 위한 특별위원회가 구성되어 본격적인 논의에 들어갔습니다. 행정 효율성 제고와 투명성 강화가 주요 의제로 다뤄지고 있으며, 시민 참여 확대 방안도 함께 검토되고 있습니다.")
                .isHot(false)
                .build(),
            NewsSummaryDto.builder()
                .newsId("mock_politics_002")
                .category("정치")
                .title("지역균형발전 정책 발표")
                .summaryText("정부가 수도권 집중 완화와 지역 균형 발전을 위한 새로운 정책을 발표했습니다. 지방 대학 육성, 지역 산업 클러스터 조성, 인프라 확충 등이 포함되어 있으며, 장기적인 지역 발전 전략으로 평가받고 있습니다.")
                .isHot(false)
                .build()
        );
        MOCK_NEWS_BY_CATEGORY.put("정치", politicsNews);
        
        // 사회 카테고리
        List<NewsSummaryDto> societyNews = Arrays.asList(
            NewsSummaryDto.builder()
                .newsId("mock_society_001")
                .category("사회")
                .title("인구 고령화 대응 방안")
                .summaryText("통계청이 발표한 자료에 따르면 우리나라의 고령화 속도가 세계 최고 수준입니다. 이에 정부는 노인 일자리 창출, 건강 관리 시스템 강화, 세대 간 소통 프로그램 확대 등의 종합 대응 방안을 마련하고 있습니다.")
                .isHot(false)
                .build(),
            NewsSummaryDto.builder()
                .newsId("mock_society_002")
                .category("사회")
                .title("교육 혁신 정책 추진")
                .summaryText("교육부가 미래 인재 양성을 위한 교육 혁신 정책을 발표했습니다. 디지털 리터러시 강화, 창의적 사고력 함양, 글로벌 역량 개발에 중점을 두고 있으며, 초중고 교육과정 전반에 걸쳐 변화가 예상됩니다.")
                .isHot(false)
                .build()
        );
        MOCK_NEWS_BY_CATEGORY.put("사회", societyNews);
        
        // BREAKING 카테고리 (긴급 뉴스)
        List<NewsSummaryDto> breakingNews = Arrays.asList(
            NewsSummaryDto.builder()
                .newsId("mock_breaking_001")
                .category("BREAKING")
                .title("긴급 속보: 주요 정책 발표")
                .summaryText("정부가 오늘 오후 주요 경제 정책을 긴급 발표했습니다. 이번 정책은 중소기업 지원과 일자리 창출에 중점을 두고 있으며, 내년 상반기부터 시행될 예정입니다. 관계자는 이번 조치가 경제 회복에 중요한 전환점이 될 것이라고 밝혔습니다.")
                .isHot(true)
                .build(),
            NewsSummaryDto.builder()
                .newsId("mock_breaking_002")
                .category("BREAKING")
                .title("긴급 속보: 국제 협정 체결")
                .summaryText("우리나라가 주요 무역 상대국과 새로운 경제 협력 협정을 체결했습니다. 이번 협정은 양국 간 무역 장벽 완화와 투자 확대를 포함하고 있으며, 양국 경제에 상호 이익이 될 것으로 기대되고 있습니다.")
                .isHot(true)
                .build()
        );
        MOCK_NEWS_BY_CATEGORY.put("BREAKING", breakingNews);
    }
    
    /**
     * 카테고리별 랜덤 Mock 뉴스 반환
     */
    public static NewsSummaryDto getRandomNewsByCategory(String category) {
        List<NewsSummaryDto> newsList = MOCK_NEWS_BY_CATEGORY.get(category);
        if (newsList == null || newsList.isEmpty()) {
            // 기본 뉴스 반환
            return createDefaultNews(category, false);
        }
        int randomIndex = (int) (Math.random() * newsList.size());
        return newsList.get(randomIndex);
    }
    
    /**
     * Hot 뉴스 반환 (BREAKING 카테고리)
     */
    public static NewsSummaryDto getRandomHotNews() {
        List<NewsSummaryDto> breakingNews = MOCK_NEWS_BY_CATEGORY.get("BREAKING");
        if (breakingNews == null || breakingNews.isEmpty()) {
            return createDefaultNews("BREAKING", true);
        }
        int randomIndex = (int) (Math.random() * breakingNews.size());
        return breakingNews.get(randomIndex);
    }
    
    /**
     * newsId로 뉴스 제목 조회 (히스토리용)
     */
    public static String getNewsTitleByNewsId(String newsId) {
        for (List<NewsSummaryDto> newsList : MOCK_NEWS_BY_CATEGORY.values()) {
            for (NewsSummaryDto news : newsList) {
                if (news.getNewsId().equals(newsId)) {
                    return news.getTitle();
                }
            }
        }
        return "알 수 없는 뉴스";
    }

    /**
     * newsId로 뉴스 텍스트 조회 (TTS용)
     */
    public static String getNewsTextByNewsId(String newsId) {
        // 모든 카테고리에서 newsId로 뉴스 찾기
        for (List<NewsSummaryDto> newsList : MOCK_NEWS_BY_CATEGORY.values()) {
            for (NewsSummaryDto news : newsList) {
                if (news.getNewsId().equals(newsId)) {
                    return news.getSummaryText();
                }
            }
        }
        return null;
    }
    
    /**
     * 기본 뉴스 생성 (카테고리가 없을 경우)
     */
    private static NewsSummaryDto createDefaultNews(String category, Boolean isHot) {
        String newsId = "mock_" + category.toLowerCase() + "_" + System.currentTimeMillis();
        return NewsSummaryDto.builder()
                .newsId(newsId)
                .category(category)
                .title(category + " 관련 뉴스")
                .summaryText("이것은 " + category + " 카테고리의 Mock 뉴스 요약입니다. 실제 구현 시 integrated_summary 테이블에서 조회합니다.")
                .isHot(isHot)
                .build();
    }
}

