package com.fullStc.scrap.service;

import com.fullStc.scrap.dto.ScrapItemDto;

import java.util.List;

/** 스크랩 목록 조회 및 토글. tbl_user_news_scrap 사용. */
public interface ScrapService {

    /** 회원별 스크랩 목록 (최신순) */
    List<ScrapItemDto> getScrapItems(Long memberId);

    /** 회원별 스크랩된 뉴스 ID 목록 */
    List<String> getScrapNewsIds(Long memberId);

    /** 스크랩 토글. 추가 시 NewsCluster 스냅샷 저장. */
    void toggleScrap(Long memberId, String newsId);
}
