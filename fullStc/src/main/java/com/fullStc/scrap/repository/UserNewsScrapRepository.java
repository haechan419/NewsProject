package com.fullStc.scrap.repository;

import com.fullStc.scrap.domain.UserNewsScrap;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

/** tbl_user_news_scrap 리포지토리 */
public interface UserNewsScrapRepository extends JpaRepository<UserNewsScrap, Long> {

    List<UserNewsScrap> findByMemberIdOrderByRegDateDesc(Long memberId);

    Optional<UserNewsScrap> findByMemberIdAndNewsId(Long memberId, String newsId);
}
