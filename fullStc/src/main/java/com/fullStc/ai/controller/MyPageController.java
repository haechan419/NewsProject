package com.fullStc.ai.controller;

import com.fullStc.ai.dto.MyPageResponseDTO;
import com.fullStc.ai.service.MyPageService;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.springframework.web.bind.annotation.*;

@RestController
// ★ 기존 "/api/mypage"에서 "/api/ai/mypage"로 수정합니다.
@RequestMapping("/api/ai/mypage") 
@Log4j2
@RequiredArgsConstructor
public class MyPageController {
    
    private final MyPageService myPageService;

    // 이제 이 메서드는 GET /api/ai/mypage/{memberId} 요청을 처리합니다.
    @GetMapping("/{memberId}")
    public MyPageResponseDTO getMyPage(@PathVariable("memberId") Long memberId) {
        log.info("마이페이지 조회 요청 - 회원번호: " + memberId);
        return myPageService.getMyPageData(memberId);
    }

    // 뉴스 스크랩 토글 주소도 자동으로 /api/ai/mypage/scrap이 됩니다.
    @PostMapping("/scrap")
    public String toggleScrap(@RequestParam("memberId") Long memberId,
                             @RequestParam("newsId") String newsId) {
        log.info("스크랩 토글 요청 - 회원: " + memberId + ", 뉴스: " + newsId);
        myPageService.toggleScrap(memberId, newsId);
        return "SUCCESS";
    }
}