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

    const displayTitle = useMemo(() => {
        if (!category) return 'NEWS';
        switch (category) {
            case 'economy': return 'ECONOMY';
            case 'politics': return 'POLITICS';
            case 'society': return 'SOCIETY';
            case 'it': return 'IT & SCIENCE';
            case 'culture': return 'CULTURE & ART';
            case 'world': return 'INTERNATIONAL';
            default: return category.toUpperCase();
        }
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
                if (error.response && error.response.status === 401) {
                    alert('로그인이 만료되었습니다. 다시 로그인해주세요.');
                    navigate('/login');
                }
            } finally {
                setLoading(false);
            }
        };
        if (category) fetchData();
    }, [category, navigate]);

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

    const formatDate = (dateString) => {
        if (!dateString) return '';
        return dateString.split('T')[0].replace(/-/g, '.');
    };

    const getImg = (news) => news?.image || news?.imageUrl || news?.thumbnail || '';

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
    const otherNews = articles.length > 0 ? articles.slice(1) : [];

    return (
        <div className="catPage">
            {/* 히어로 배너 */}
            <div className="category-hero">
                <div className="hero-inner">
                    <div className="hero-chip">ISSUE NO.4</div>
                    <h1 className="hero-title">{displayTitle}</h1>
                    <div className="hero-sub">오늘의 핵심 이슈</div>
                </div>
            </div>

            <div className="category-container">
                {loading ? (
                    <div className="loading-box">AI가 뉴스를 분석하고 있습니다... 🤖</div>
                ) : (
                    <>
                        {/* ✅ 헤드라인: 네이버 카드 느낌 */}
                        {headlineNews ? (
                            <section className="headlineGrid">
                                <div className="headlineMedia">
                                    {getImg(headlineNews) ? (
                                        <img src={getImg(headlineNews)} alt="headline" />
                                    ) : (
                                        <div className="mediaPlaceholder" />
                                    )}
                                </div>

                                <article className="headlineNaverCard">
                                    <div className="headlineLabel">Headline News</div>

                                    <h2 className="headlineNaverTitle">
                                        {headlineNews.title}
                                    </h2>

                                    <p className="headlineNaverDesc">
                                        {getPreview(headlineNews.clusterSummary || headlineNews.summary)}
                                    </p>

                                    <div className="headlineBottom">
                                        <button
                                            className="headlineNaverLink"
                                            onClick={() => navigate(`/news/${headlineNews.id}`, { state: { news: headlineNews } })}
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

                        {/* ✅ 리스트: 프리뷰만 */}
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
                                                <img src={getImg(news)} alt="뉴스 썸네일" />
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

                        <div className="more-row">
                            <button className="more-btn">헤드라인 더보기 ▾</button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default CategoryPage;
