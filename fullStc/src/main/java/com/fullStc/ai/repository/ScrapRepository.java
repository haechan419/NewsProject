package com.fullStc.ai.repository;

import com.fullStc.ai.domain.Scrap;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface ScrapRepository extends JpaRepository<Scrap, Long> {
    // 사용자가 찜한 뉴스 목록 (news.id 해시값 기준)
    List<Scrap> findByMemberId(Long memberId);

    // 최근 스크랩 순 정렬 (스크랩 탭 카드 목록용)
    List<Scrap> findByMemberIdOrderByRegDateDesc(Long memberId);

    // 이미 스크랩한 기사인지 확인 (중복 방지)
    Optional<Scrap> findByMemberIdAndNewsId(Long memberId, String newsId);
}