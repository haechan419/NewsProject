package com.fullStc.config;

import com.fullStc.support.domain.Faq;
import com.fullStc.support.domain.FaqCategory;
import com.fullStc.support.repository.FaqRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/**
 * FAQ 초기 데이터 생성
 * 애플리케이션 시작 시 FAQ 샘플 데이터를 자동으로 생성합니다.
 */
@Component
@Order(2) // DataInitializer 이후에 실행
@Slf4j
@RequiredArgsConstructor
@org.springframework.boot.autoconfigure.condition.ConditionalOnProperty(
    name = "app.init.dummy-data",
    havingValue = "true",
    matchIfMissing = true
)
public class FaqDataInitializer implements ApplicationRunner {

    private final FaqRepository faqRepository;

    @Override
    @Transactional
    public void run(ApplicationArguments args) throws Exception {
        log.info("=== FAQ 초기 데이터 생성 시작 ===");

        // 이미 FAQ 데이터가 있으면 스킵
        if (faqRepository.count() > 0) {
            log.info("FAQ 데이터가 이미 존재합니다. 초기화를 건너뜁니다.");
            return;
        }

        // 영상제작 관련 FAQ
        createFaq(FaqCategory.VIDEO, 
            "영상을 제작하려면 어떻게 해야 하나요?",
            "메인 페이지에서 '영상 제작' 메뉴를 선택하시면 영상 제작 페이지로 이동할 수 있습니다. 제목과 내용을 입력하고 원하는 영상 스타일을 선택한 후 '제작하기' 버튼을 클릭하시면 AI가 자동으로 영상을 생성해드립니다.",
            "영상, 제작, 만들기, 생성");

        createFaq(FaqCategory.VIDEO, 
            "영상 제작에 시간이 얼마나 걸리나요?",
            "영상 제작 시간은 영상 길이와 복잡도에 따라 다르지만, 일반적으로 1-3분 길이의 영상은 약 5-10분 정도 소요됩니다. 제작이 완료되면 알림을 통해 확인하실 수 있습니다.",
            "영상, 시간, 소요, 완료");

        createFaq(FaqCategory.VIDEO, 
            "제작한 영상을 수정하거나 삭제할 수 있나요?",
            "안됩니다.",
            "영상, 수정, 삭제, 편집");

        createFaq(FaqCategory.VIDEO, 
            "영상 제작 시 어떤 파일 형식을 지원하나요?",
            "현재 MP4, MOV, AVI 형식을 지원하며, 최대 파일 크기는 500MB까지 업로드 가능합니다. 고화질 영상의 경우 제작 시간이 더 오래 걸릴 수 있습니다.",
            "영상, 파일, 형식, MP4, MOV, AVI");

        // 게시물작성 관련 FAQ
        createFaq(FaqCategory.POST, 
            "게시물을 작성하려면 어떻게 해야 하나요?",
            "상단 메뉴에서 '게시판'을 선택하시거나 메인 페이지의 '게시글 작성' 버튼을 클릭하시면 됩니다. 일반 게시판과 토론 게시판 중 선택할 수 있으며, 제목과 내용을 입력한 후 파일을 첨부할 수 있습니다.",
            "게시물, 작성, 글쓰기, 게시판");

        createFaq(FaqCategory.POST, 
            "게시물에 이미지나 파일을 첨부할 수 있나요?",
            "네, 가능합니다. 게시물 작성 시 파일 첨부 기능을 통해 이미지, 문서 등 다양한 파일을 첨부하실 수 있습니다. 최대 5개까지 첨부 가능하며, 각 파일은 최대 10MB까지 업로드 가능합니다.",
            "게시물, 이미지, 파일, 첨부, 업로드");

        createFaq(FaqCategory.POST, 
            "작성한 게시물을 수정하거나 삭제할 수 있나요?",
            "본인이 작성한 게시물은 게시물 상세 페이지에서 '수정' 및 '삭제' 버튼을 통해 수정하거나 삭제할 수 있습니다. 다만 댓글이 달린 게시물의 경우 삭제 시 주의가 필요합니다.",
            "게시물, 수정, 삭제, 편집");

        createFaq(FaqCategory.POST, 
            "일반 게시판과 토론 게시판의 차이는 무엇인가요?",
            "일반 게시판은 자유롭게 의견을 나눌 수 있는 공간이며, 토론 게시판은 특정 주제에 대해 찬반 의견을 나누는 공간입니다. 토론 게시판 작성 시에는 토론 주제를 반드시 입력해야 합니다.",
            "게시판, 일반, 토론, 차이, 찬반");

        // 프로필/계정 관련 FAQ
        createFaq(FaqCategory.ACCOUNT, 
            "내 프로필 정보를 변경하고 싶어요.",
            "상단 메뉴에서 '프로필' 또는 '내 정보' 메뉴를 클릭하시면 프로필 수정 페이지로 이동합니다. 이름, 이메일, 프로필 사진 등 원하는 정보를 수정하실 수 있습니다. 변경사항은 저장 버튼을 클릭하시면 즉시 반영됩니다.",
            "프로필, 정보, 변경, 수정");

        createFaq(FaqCategory.ACCOUNT, 
            "비밀번호를 변경하고 싶어요.",
            "프로필 설정 페이지에서 '비밀번호 변경' 메뉴를 선택하시면 비밀번호 변경 페이지로 이동합니다. 현재 비밀번호를 입력한 후 새로운 비밀번호를 입력하시면 됩니다. 보안을 위해 비밀번호는 정기적으로 변경하시는 것을 권장합니다.",
            "비밀번호, 변경, 보안");

        createFaq(FaqCategory.ACCOUNT, 
            "내가 작성한 게시물과 댓글을 확인하고 싶어요.",
            "프로필 페이지의 '내 활동' 또는 '작성한 글' 메뉴에서 작성한 게시물과 댓글을 모두 확인하실 수 있습니다. 날짜별, 카테고리별로 필터링하여 검색할 수도 있습니다.",
            "게시물, 댓글, 확인, 내활동");

        createFaq(FaqCategory.ACCOUNT, 
            "로그아웃은 어떻게 하나요?",
            "상단 메뉴 오른쪽의 프로필 아이콘을 클릭하시면 드롭다운 메뉴가 나타납니다. '로그아웃' 버튼을 클릭하시면 로그아웃됩니다. 보안을 위해 공용 컴퓨터 사용 시 반드시 로그아웃하시기 바랍니다.",
            "로그아웃, 로그인, 보안");

        // 기타 문의 FAQ
        createFaq(FaqCategory.ETC, 
            "FAQ와 Q&A는 어떻게 사용하나요?",
            "고객센터 페이지에서 두 가지 방법으로 이용하실 수 있습니다:\n\n1. FAQ (자주 묻는 질문): 카테고리별 FAQ 버튼을 클릭하면 즉시 미리 정의된 답변을 확인할 수 있습니다. 빠르고 정확한 정보를 원할 때 사용하세요.\n\n2. Q&A (질의응답): 채팅창에 궁금한 내용을 자유롭게 입력하시면 HyperCLOVA AI가 FAQ 데이터베이스를 참고하여 답변해드립니다. 원하는 질문을 직접 물어볼 수 있습니다.",
            "FAQ, QA, 사용법, 고객센터");

        createFaq(FaqCategory.ETC, 
            "챗봇으로 해결되지 않는 문제는 어떻게 하나요?",
            "챗봇으로 해결되지 않는 문제나 추가 문의가 필요한 경우 '문의 티켓 작성' 버튼을 통해 직접 문의글을 작성하실 수 있습니다. 문의 내용을 상세히 작성해주시면 관리자가 확인 후 24시간 이내에 답변드리겠습니다. 문의 티켓은 '내 문의 내역'에서 확인하실 수 있습니다.",
            "챗봇, 문의, 티켓, 해결");

        createFaq(FaqCategory.ETC, 
            "서비스 이용 중 오류가 발생했어요.",
            "오류 발생 시 다음 정보를 포함하여 문의해주시면 빠르게 해결해드릴 수 있습니다:\n- 발생한 오류 메시지\n- 오류가 발생한 페이지\n- 사용 중이던 브라우저 및 버전\n- 오류 발생 시간\n\n고객센터 문의 티켓을 통해 문의해주시면 24시간 이내에 답변드리겠습니다.",
            "오류, 에러, 버그, 문제");

        createFaq(FaqCategory.ETC, 
            "개인정보는 어떻게 보호되나요?",
            "저희는 개인정보보호법을 준수하며 사용자의 개인정보를 안전하게 보호합니다. 비밀번호는 암호화되어 저장되며, 이메일 주소는 뉴스레터 발송 외에는 제3자에게 제공되지 않습니다.",
            "개인정보, 보호, 보안, 암호화");

        log.info("=== FAQ 초기 데이터 생성 완료 (총 {}건) ===", faqRepository.count());
    }

    private void createFaq(FaqCategory category, String question, String answer, String keywords) {
        Faq faq = Faq.builder()
                .category(category)
                .question(question)
                .answer(answer)
                .keywords(keywords)
                .build();
        faqRepository.save(faq);
        log.debug("FAQ 생성: [{}] {}", category, question.substring(0, Math.min(30, question.length())));
    }
}
