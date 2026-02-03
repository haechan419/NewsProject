import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import axios from 'axios';
import { getMyPageData } from '@/api/myPageApi';
import { toggleScrap } from '@/scrap/api/scrapApi';
import './CategoryPage.css';

const CategoryPage = () => {
    const { category } = useParams();
    const navigate = useNavigate();
    const { user } = useSelector((state) => state.auth || {});
    const memberId = user?.id ?? user?.memberId ?? null;

    const [articles, setArticles] = useState([]);
    const [loading, setLoading] = useState(false);
    const [scrapIds, setScrapIds] = useState([]);

    // ✅ 리스트에서 처음에 보여줄 개수(헤드라인 제외)
    const [visibleCount, setVisibleCount] = useState(5);

    // ✅ 백엔드 주소
    const API_BASE = 'http://localhost:8080';

    const displayTitle = useMemo(() => {
        if (!category) return 'NEWS';
        switch (category) {
            case 'economy': return 'ECONOMY';
            case 'politics': return 'POLITICS';
            case 'society': return 'SOCIETY';
            case 'it': return 'IT & SCIENCE';
            case 'culture': return 'CULTURE & ART';
            case 'world': return 'INTERNATIONAL';
            default: return String(category).toUpperCase();
        }
    }, [category]);

    const issueNo = useMemo(() => {
        const map = { politics: 1, economy: 2, society: 3, it: 4, culture: 5, world: 6 };
        return map[category] || 4;
    }, [category]);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const res = await axios.get(`${API_BASE}/briefing?category=${category}`, {
                    withCredentials: true,
                });
                setArticles(res.data || []);
            } catch (error) {
                console.error('뉴스 로딩 실패:', error);
                if (error?.response?.status === 401) {
                    alert('로그인이 만료되었습니다. 다시 로그인해주세요.');
                    navigate('/login');
                }
            } finally {
                setLoading(false);
            }
        };
        if (category) fetchData();
    }, [category, navigate]);

    useEffect(() => {
        setVisibleCount(5);
    }, [category]);

    // 스크랩 ID 목록 로드 (별 채움 표시용)
    useEffect(() => {
        if (!memberId) return;
        const load = async () => {
            try {
                const data = await getMyPageData(memberId);
                const ids = data?.scrapNewsIds || data?.scrapItems?.map((i) => i.newsId) || [];
                setScrapIds(ids.map(String));
            } catch {
                setScrapIds([]);
            }
        };
        load();
    }, [memberId]);

    const handleScrapClick = useCallback(
        async (e, newsId) => {
            e.stopPropagation();
            if (!memberId) {
                alert('로그인 후 스크랩할 수 있습니다.');
                return;
            }
            try {
                await toggleScrap(memberId, String(newsId));
                setScrapIds((prev) =>
                    prev.includes(String(newsId))
                        ? prev.filter((id) => id !== String(newsId))
                        : [...prev, String(newsId)]
                );
            } catch (err) {
                console.error('스크랩 토글 실패:', err);
                alert('스크랩 처리에 실패했습니다.');
            }
        },
        [memberId]
    );

    const formatDate = (d) => {
        if (!d) return '';
        return String(d).split('T')[0].replace(/-/g, '.');
    };

    const getImg = (news) => {
        const raw = (news && (news.image || news.imageUrl || news.thumbnail)) || '';
        const s = String(raw).trim();
        if (!s || s === 'null' || s === 'undefined') return '';
        return s;
    };

    const getPreview = (text) => {
        if (!text) return '';
        const t = String(text);

        const introStart = t.indexOf('[서론]');
        const bodyStart = t.indexOf('[본론]');
        const concStart = t.indexOf('[결론]');

        let candidate = t;

        if (introStart !== -1) {
            const start = introStart + '[서론]'.length;
            const end = bodyStart !== -1 ? bodyStart : (concStart !== -1 ? concStart : t.length);
            candidate = t.substring(start, end).trim();
        }

        candidate = candidate.replace(/\s+/g, ' ').trim();
        if (!candidate) candidate = t.replace(/\s+/g, ' ').trim();

        return candidate.length > 110 ? candidate.substring(0, 110) + '…' : candidate;
    };

    // ✅ SVG 폴백 (외부 요청 없음)
    const svgFallback = (cat) => {
        const safeCat = String(cat || 'NEWS').toUpperCase().replace(/[<>&]/g, '');
        const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="1024" height="600">
        <rect width="100%" height="100%" fill="#eee"/>
        <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#aaa" font-size="40" font-family="Arial">${safeCat}</text>
        <text x="50%" y="60%" dominant-baseline="middle" text-anchor="middle" fill="#ccc" font-size="20" font-family="Arial">Image Refreshing...</text>
      </svg>
    `.trim();
        return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
    };

    // ✅ 이미지 깨짐 감지 → 즉시 SVG로 바꾸고 → 백엔드 신고
    const handleImgError = (e, newsId) => {
        const el = e.currentTarget;

        // 무한 루프 방지
        if (el.dataset.fallback === '1') return;
        el.dataset.fallback = '1';

        // 1) 즉시 SVG로 교체
        el.src = svgFallback(category);

        // 2) 백엔드에 fail 신고 (있을 때만)
        if (newsId) {
            axios.post(`${API_BASE}/api/images/fail/${newsId}`, null, { withCredentials: true })
                .catch(() => {});
        }
    };

    const headlineNews = articles.length > 0 ? articles[0] : null;

    // ✅ 리스트는 헤드라인 제외하고 visibleCount만큼
    const otherNews = articles.length > 0 ? articles.slice(1, 1 + visibleCount) : [];
    const hasMore = articles.length > (1 + visibleCount);

    return (
        <div className="catPage">
            {/* 히어로 배너 */}
            <div className="category-hero">
                <div className="hero-inner">
                    <div className="hero-chip">ISSUE NO.{issueNo}</div>
                    <h1 className="hero-title">{displayTitle}</h1>
                    <div className="hero-sub">오늘의 핵심 이슈</div>
                </div>
            </div>

            <div className="category-container">
                {loading ? (
                    <div className="loading-box">
                        <div className="spinner"></div>
                        <p>AI가 뉴스를 분석 중...</p>
                    </div>
                ) : (
                    <>
                        {/* ✅ 헤드라인 (기존 클래스 유지) */}
                        {headlineNews ? (
                            <section className="headlineGrid">
                                <div className="headlineMedia">
                                    <img
                                        src={getImg(headlineNews) || svgFallback(category)}
                                        alt="headline"
                                        loading="eager"
                                        referrerPolicy="no-referrer"
                                        onError={(e) => handleImgError(e, headlineNews.id)}
                                    />
                                </div>

                                <article className="headlineNaverCard">
                                    <div className="headlineLabel">Headline News</div>

                                    <h2 className="headlineNaverTitle">{headlineNews.title}</h2>

                                    <p className="headlineNaverDesc">
                                        {getPreview(headlineNews.clusterSummary || headlineNews.summary)}
                                    </p>

                                    <div className="headlineBottom">
                                        <button
                                            className="headlineNaverLink"
                                            onClick={() =>
                                                navigate(`/news/${headlineNews.id}`, { state: { news: headlineNews } })
                                            }
                                        >
                                            ↗ 상세 페이지 보기
                                        </button>

                                        <span className="headlineDate">
                      {formatDate(headlineNews.date || headlineNews.publishedAt)}
                    </span>
                                    </div>
                                </article>
                            </section>
                        ) : (
                            <div className="empty-message">
                                등록된 뉴스가 없습니다.<br />(데이터 수집 대기 중)
                            </div>
                        )}

                        {/* ✅ 리스트 (기존 DOM/클래스 구조 유지) */}
                        <div className="news-list naverList">
                            {otherNews.map((news, idx) => (
                                <div
                                    key={news.id}
                                    className="naverItem"
                                    onClick={() => navigate(`/news/${news.id}`, { state: { news } })}
                                    role="button"
                                    tabIndex={0}
                                >
                                    <div className="naverLeft">
                                        <div className="naverThumb">
                                            <img
                                                src={getImg(news) || svgFallback(category)}
                                                alt="뉴스 썸네일"
                                                loading="lazy"
                                                referrerPolicy="no-referrer"
                                                onError={(e) => handleImgError(e, news.id)}
                                            />
                                        </div>

                                        <div className="naverInfo">
                                            <h3 className="naverTitle">{news.title}</h3>
                                            <p className="naverDesc">
                                                {getPreview(news.clusterSummary || news.summary)}
                                            </p>

                                            <div className="naverMeta">
                                                <span className="sourceName">{news.sourceName || 'AI Briefing'}</span>
                                                <span className="metaSep">•</span>
                                                <span className="listDate">{formatDate(news.date || news.publishedAt)}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <button
                                        type="button"
                                        className="naverScrap"
                                        onClick={(e) => handleScrapClick(e, news.id)}
                                        title={scrapIds.includes(String(news.id)) ? '스크랩 해제' : '스크랩'}
                                        aria-label={scrapIds.includes(String(news.id)) ? '스크랩 해제' : '스크랩'}
                                    >
                                        {scrapIds.includes(String(news.id)) ? '★' : '☆'}
                                    </button>
                                </div>
                            ))}
                        </div>

                        {/* ✅ 더보기 버튼 */}
                        <div className="more-row">
                            {hasMore && (
                                <button className="more-btn" onClick={() => setVisibleCount(v => v + 5)}>
                                    뉴스 더보기 ▾
                                </button>
                            )}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default CategoryPage;
