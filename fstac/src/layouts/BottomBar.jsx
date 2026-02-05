import React from 'react';

const BottomBar = () => {
    return (
        <footer className="bg-white border-t border-gray-200">
            <div className="mx-auto px-[100px] py-10">

                {/* 상단 채널 링크 */}
                <div className="flex items-center gap-6 text-sm text-gray-500 border-b border-gray-200 pb-4 mb-6">
                    <span className="font-semibold text-black">유튜브 채널</span>
                    {['연합뉴스', 'K-Culture NOW', '통동테크', '더건강', 'KOREA NOW', 'NK NOW', 'K-VIBE'].map(link => (
                        <a key={link} href="#" className="hover:text-gray-800">
                            {link}
                        </a>
                    ))}
                </div>

                {/* 메인 정보 영역 */}
                <div className="flex justify-between items-start">

                    {/* 왼쪽: 로고 + 정보 */}
                    <div className="flex gap-6">
                        <div className="text-xl font-bold text-gray-400">
                            NEWS PULSE
                        </div>

                        <div className="text-xs text-gray-600 leading-6">
                            <div>
                                NewsPulse | 서울특별시 중구 세종대로 124 |
                                대표: 홍길동 | 고객센터: 02-970-5421
                            </div>
                            <div>
                                사업자등록번호: 000-00-00000 |
                                통신판매업신고번호: 2026-서울중구-0124 |
                                개인정보처리방침
                            </div>
                            <div>
                                본 서비스는 뉴스 정보를 요약·가공하여 제공하며,
                                원문 저작권은 각 언론사에 있습니다.
                            </div>

                            <div className="mt-3 text-gray-400">
                                ©2026 NewsPulse
                            </div>
                        </div>
                    </div>

                    {/* 오른쪽: Family site */}
                    <div>
                        <button className="
              flex items-center justify-between
              w-[180px] h-[40px]
              border border-gray-300
              px-4 text-sm text-gray-700
              hover:bg-gray-50
            ">
                            <span>Family site</span>
                            <span className="text-lg">+</span>
                        </button>
                    </div>

                </div>
            </div>
        </footer>
    );
};

export default BottomBar;
