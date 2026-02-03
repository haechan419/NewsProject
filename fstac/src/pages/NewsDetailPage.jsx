import React, { useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './NewsDetailPage.css';

const FormattedSummary = ({ text }) => {
    if (!text) return null;

    const extractText = (fullText, startTag, endTag) => {
        const startIndex = fullText.indexOf(startTag);
        if (startIndex === -1) return null;
        const contentStart = startIndex + startTag.length;
        const contentEnd = endTag ? fullText.indexOf(endTag) : fullText.length;
        if (endTag && fullText.indexOf(endTag) === -1) return fullText.substring(contentStart).trim();
        return fullText.substring(contentStart, contentEnd).trim();
    };

    const intro = extractText(text, '[서론]', '[본론]');
    const body = extractText(text, '[본론]', text.includes('[결론]') ? '[결론]' : null);
    const conclusion = extractText(text, '[결론]', null);

    // 태그 없으면 1박스
    if (!intro && !body && !conclusion) {
        return (
            <div className="detailSection neutral">
                <div className="detailText">{text}</div>
            </div>
        );
    }

    return (
        <div className="detailStack">
            {intro && (
                <div className="detailSection intro">
                    <div className="detailBadge">💡 핵심 요약</div>
                    <div className="detailText">{intro}</div>
                </div>
            )}
            {body && (
                <div className="detailSection body">
                    <div className="detailBadge">📖 상세 내용</div>
                    <div className="detailText">{body}</div>
                </div>
            )}
            {conclusion && (
                <div className="detailSection conc">
                    <div className="detailBadge">🏁 시사점 & 전망</div>
                    <div className="detailText">{conclusion}</div>
                </div>
            )}
        </div>
    );
};

const NewsDetailPage = () => {
    const navigate = useNavigate();
    const location = useLocation();

    // ✅ CategoryPage에서 넘긴 state
    const news = location.state?.news;

    const [toast, setToast] = useState('');

    const formatDate = (dateString) => {
        if (!dateString) return '';
        return String(dateString).split('T')[0].replace(/-/g, '.');
    };

    const originUrl = useMemo(() => news?.originalUrl || news?.url || '', [news]);
    const summaryText = useMemo(() => news?.clusterSummary || news?.summary || '', [news]);

    const copyLink = async () => {
        if (!originUrl) {
            setToast('복사할 링크가 없어요 😵');
            setTimeout(() => setToast(''), 1400);
            return;
        }
        try {
            await navigator.clipboard.writeText(originUrl);
            setToast('링크 복사 완료! ✅');
            setTimeout(() => setToast(''), 1400);
        } catch (e) {
            // clipboard 권한 막히는 환경 대비: fallback
            try {
                const temp = document.createElement('textarea');
                temp.value = originUrl;
                document.body.appendChild(temp);
                temp.select();
                document.execCommand('copy');
                document.body.removeChild(temp);

                setToast('링크 복사 완료! ✅');
                setTimeout(() => setToast(''), 1400);
            } catch {
                setToast('복사 실패 😭 주소를 직접 복사해줘');
                setTimeout(() => setToast(''), 1600);
            }
        }
    };

    const fromScrapList = location.state?.fromScrapList;
    const goBack = () => {
        if (fromScrapList) navigate('/mypage?tab=scrap');
        else navigate(-1);
    };

    // ✅ state 없이 직접 주소로 들어온 경우(새로고침 포함)
    if (!news) {
        return (
            <div className="detailWrap">
                <div className="detailCard">
                    <div className="detailTop">
                        <button className="backBtn" onClick={goBack}>← 뒤로</button>
                    </div>

                    <h1 className="detailTitle">기사 정보를 불러올 수 없어요</h1>
                    <p className="detailHint">
                        지금은 백엔드 상세 API가 없어서,<br />
                        카테고리 목록에서 눌러 들어와야 상세가 보여요.
                    </p>
                </div>
            </div>
        );
    }

    return (
            <div className="detailWrap">
            <div className="detailCard">
                <div className="detailTop">
                    <button className="backBtn" onClick={goBack}>← 뒤로</button>

                    <div className="detailMeta">
                        <span className="metaPill">AI SUMMARY</span>
                        <span className="metaDot">•</span>
                        <span className="metaDate">{formatDate(news.date || news.publishedAt)}</span>
                    </div>
                </div>

                <h1 className="detailTitle">{news.title}</h1>

                <FormattedSummary text={summaryText} />

                <div className="detailActions">
                    <button
                        className="originBtn"
                        onClick={() => originUrl && window.open(originUrl, '_blank', 'noopener,noreferrer')}
                        disabled={!originUrl}
                        title={!originUrl ? '원문 링크가 없습니다' : ''}
                    >
                        원문 기사 보기 ↗
                    </button>

                    <button
                        className="copyBtn"
                        onClick={copyLink}
                        disabled={!originUrl}
                        title={!originUrl ? '복사할 링크가 없습니다' : ''}
                    >
                        링크 복사하기
                    </button>
                </div>

                {/* 토스트 */}
                {toast && <div className="toast">{toast}</div>}
            </div>
        </div>
    );
};

export default NewsDetailPage;
