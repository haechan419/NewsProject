import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './CategoryPage.css';

const CategoryPage = () => {
    const { category } = useParams();
    const navigate = useNavigate();

    const [articles, setArticles] = useState([]);
    const [loading, setLoading] = useState(false);

    // ✅ 리스트에서 처음에 보여줄 개수(헤드라인 제외)
    const [visibleCount, setVisibleCount] = useState(5);

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

    // ✅ (선택) 카테고리별 ISSUE NO 매핑
    const issueNo = useMemo(() => {
        const map = {
            politics: 1,
            economy: 2,
            society: 3,
            it: 4,
            culture: 5,
            world: 6,
        };
        return (category && map[category]) ? map[category] : 4;
    }, [category]);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const res = await axios.get(`http://localhost:8080/briefing?category=${category}`, {
                    withCredentials: true,
                });
                setArticles(res.data || []);
            } catch (error) {
                console.error('뉴스 로딩 실패:', error);
                if (error?.response && error.response.status === 401) {
                    alert('로그인이 만료되었습니다. 다시 로그인해주세요.');
                    navigate('/login');
                }
            } finally {
                setLoading(false);
            }
        };

        if (category) fetchData();
    }, [category, navigate]);

    // ✅ 카테고리 바뀌면 "더보기" 상태 초기화
    useEffect(() => {
        setVisibleCount(5);
    }, [category]);

    const formatDate = (dateString) => {
        if (!dateString) return '';
        return String(dateString).split('T')[0].replace(/-/g, '.');
    };

    /**
     * ✅ 이미지 URL 뽑기 + 쓰레기값 방어
     * - null/undefined/빈문자
     * - "null" 같은 문자열
     */
    const getImg = (news) => {
        const raw = (news && (news.image || news.imageUrl || news.thumbnail)) || '';
        if (!raw) return '';
        const s = String(raw).trim();
        if (!s || s.toLowerCase() === 'null' || s.toLowerCase() === 'undefined') return '';
        return s;
    };

    // ✅ 요약에서 짧은 프리뷰 뽑기 (서론 우선)
    const getPreview = (text) => {
        if (!text) return '';
        const t = String(text);

        const introStart = t.indexOf('[서론]');
        const bodyStart = t.indexOf('[본론]');
        const concStart = t.indexOf('[결론]');

        let candidate = t;

        if (introStart !== -1) {
            const start = introStart + '[서론]'.length;
            const end =
                bodyStart !== -1
                    ? bodyStart
                    : concStart !== -1
                        ? concStart
                        : t.length;
            candidate = t.substring(start, end).trim();
        }

        candidate = candidate.replace(/\s+/g, ' ').trim();
        if (!candidate) candidate = t.replace(/\s+/g, ' ').trim();

        return candidate.length > 110 ? candidate.substring(0, 110) + '…' : candidate;
    };

    const headlineNews = articles.length > 0 ? articles[0] : null;

    // ✅ 리스트는 헤드라인(0) 제외하고, visibleCount만큼만 보여준다
    const otherNews = articles.length > 0 ? articles.slice(1, 1 + visibleCount) : [];

    // ✅ "더보기" 버튼 표시 여부
    const hasMore = articles.length > (1 + visibleCount);

    const handleMore = () => {
        setVisibleCount((prev) => prev + 5);
    };

    // ✅ 폴백 이미지 경로(프론트 public/fallback.png)
    const FALLBACK_SRC = '/fallback.png';

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
                    <div className="loading-box">AI가 뉴스를 분석하고 있습니다... 🤖</div>
                ) : (
                    <>
                        {/* ✅ 헤드라인 */}
                        {headlineNews ? (
                            <section className="headlineGrid">
                                <div className="headlineMedia">
                                    {getImg(headlineNews) ? (
                                        <img
                                            src={getImg(headlineNews)}
                                            alt="headline"
                                            referrerPolicy="no-referrer"
                                            loading="lazy"
                                            onError={(e) => {
                                                if (e.currentTarget.src.includes(FALLBACK_SRC)) return;
                                                e.currentTarget.src = FALLBACK_SRC;
                                            }}
                                        />
                                    ) : (
                                        <div className="mediaPlaceholder" />
                                    )}
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

                        {/* ✅ 리스트 */}
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
                                            {getImg(news) ? (
                                                <img
                                                    src={getImg(news)}
                                                    alt="뉴스 썸네일"
                                                    referrerPolicy="no-referrer"
                                                    loading="lazy"
                                                    onError={(e) => {
                                                        if (e.currentTarget.src.includes(FALLBACK_SRC)) return;
                                                        e.currentTarget.src = FALLBACK_SRC;
                                                    }}
                                                />
                                            ) : (
                                                <div className="thumbPlaceholder" />
                                            )}
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

                                    {/* ✅ 순위: 헤드라인이 1번이니까 리스트는 2번부터 */}
                                    <div className="naverRank">{idx + 2}</div>
                                </div>
                            ))}
                        </div>

                        {/* ✅ 더보기 버튼 */}
                        <div className="more-row">
                            {hasMore && (
                                <button className="more-btn" onClick={handleMore}>
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
