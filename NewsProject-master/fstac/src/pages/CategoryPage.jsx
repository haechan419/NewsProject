import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './CategoryPage.css';

// ★ [핵심] 텍스트를 분석해서 예쁜 디자인으로 바꿔주는 서브 컴포넌트
const FormattedSummary = ({ text }) => {
    if (!text) return null;

    // 헬퍼 함수: 텍스트 추출기
    const extractText = (fullText, startTag, endTag) => {
        const startIndex = fullText.indexOf(startTag);
        if (startIndex === -1) return null;
        const contentStart = startIndex + startTag.length;
        const contentEnd = endTag ? fullText.indexOf(endTag) : fullText.length;
        // endTag가 없으면(-1) 끝까지 자름
        if (endTag && fullText.indexOf(endTag) === -1) return fullText.substring(contentStart).trim();
        return fullText.substring(contentStart, contentEnd).trim();
    };

    const intro = extractText(text, '[서론]', '[본론]');
    const body = extractText(text, '[본론]', text.includes('[결론]') ? '[결론]' : null);
    const conclusion = extractText(text, '[결론]', null);

    // 태그가 하나도 없으면 그냥 보여줌
    if (!intro && !body && !conclusion) {
        return (
            <div className="section-box style-body">
                <div className="text-content">{text}</div>
            </div>
        );
    }

    return (
        <div className="summary-container">
            {intro && (
                <div className="section-box style-intro">
                    <div className="badge badge-intro">💡 핵심 요약</div>
                    <div className="text-content">{intro}</div>
                </div>
            )}
            {body && (
                <div className="section-box style-body">
                    <div className="badge badge-body">📖 상세 내용</div>
                    <div className="text-content">{body}</div>
                </div>
            )}
            {conclusion && (
                <div className="section-box style-conc">
                    <div className="badge badge-conc">🏁 시사점 & 전망</div>
                    <div className="text-content">{conclusion}</div>
                </div>
            )}
        </div>
    );
};

const CategoryPage = () => {
    const { category } = useParams();
    const navigate = useNavigate();

    const [articles, setArticles] = useState([]);
    const [loading, setLoading] = useState(false);

    // 화면 타이틀 설정
    let displayTitle = 'NEWS';
    if (category) {
        switch(category) {
            case 'economy':  displayTitle = 'ECONOMY'; break;
            case 'politics': displayTitle = 'POLITICS'; break;
            case 'society':  displayTitle = 'SOCIETY'; break;
            case 'it':       displayTitle = 'IT & SCIENCE'; break;
            case 'culture':  displayTitle = 'CULTURE & ART'; break;
            case 'world':    displayTitle = 'INTERNATIONAL'; break;
            default:         displayTitle = category.toUpperCase();
        }
    }

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                // API 호출
                const res = await axios.get(`http://localhost:8080/briefing?category=${category}`, {
                    withCredentials: true,
                });
                setArticles(res.data || []);
            } catch (error) {
                console.error("뉴스 로딩 실패:", error);
                if (error.response && error.response.status === 401) {
                    alert("로그인이 만료되었습니다. 다시 로그인해주세요.");
                    navigate('/login');
                }
            } finally {
                setLoading(false);
            }
        };

        if (category) fetchData();
    }, [category, navigate]);

    // 날짜 포맷팅
    const formatDate = (dateString) => {
        if (!dateString) return '';
        // "2026-02-02T14:00:00" -> "2026.02.02"
        return dateString.split('T')[0].replace(/-/g, '.');
    };

    const headlineNews = articles.length > 0 ? articles[0] : null;
    const otherNews = articles.length > 0 ? articles.slice(1) : [];

    return (
        <>
            {/* 헤더 영역 */}
            <div className="category-header">
                <div className="header-content">
                    <span className="issue-tag">ISSUE BRIEFING</span>
                    <h1>{displayTitle}</h1>
                    <p>AI가 엄선한 오늘의 핵심 이슈</p>
                </div>
            </div>

            <div className="category-container">
                {loading ? (
                    <div className="loading-box">AI가 뉴스를 분석하고 있습니다... 🤖</div>
                ) : (
                    <>
                        {/* 1. ★ 디자인이 적용된 헤드라인 뉴스 카드 */}
                        {headlineNews ? (
                            <div className="news-card">
                                {/* 메타 정보 */}
                                <div className="article-meta">
                                    <span>HEADLINE NEWS</span>
                                    <span>•</span>
                                    <span>AI SUMMARY</span>
                                    <span>•</span>
                                    <span>{formatDate(headlineNews.date || headlineNews.publishedAt)}</span>
                                </div>

                                {/* 제목 */}
                                <h2 className="article-title">{headlineNews.title}</h2>

                                <div className="divider"></div>

                                {/* ★ 여기가 핵심! [서론][본론] 텍스트를 예쁘게 변환 */}
                                {/* 주의: DB에서 가져온 필드명이 summary인지 clusterSummary인지 확인하세요 */}
                                <FormattedSummary text={headlineNews.clusterSummary || headlineNews.summary} />

                                {/* 원문 보기 버튼 */}
                                <div style={{ marginTop: '30px', textAlign: 'center' }}>
                                    <button
                                        className="read-more-btn"
                                        onClick={() => window.open(headlineNews.originalUrl || headlineNews.url)}
                                    >
                                        언론사 원문 보기 ↗
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="empty-message">
                                등록된 뉴스가 없습니다.<br/>(데이터 수집 대기 중)
                            </div>
                        )}

                        {/* 2. 나머지 뉴스 리스트 (기존 유지) */}
                        <div className="news-list">
                            {otherNews.map((news) => (
                                <div key={news.id} className="news-item">
                                    {news.image && (
                                        <div className="news-thumb">
                                            <img src={news.image} alt="뉴스 썸네일" />
                                        </div>
                                    )}
                                    <div className="news-info">
                                        <h3 className="news-title">{news.title}</h3>
                                        {/* 리스트에는 그냥 텍스트만 보여주거나, 앞부분만 자름 */}
                                        <p className="news-desc">
                                            {(news.summary || '').substring(0, 100)}...
                                        </p>
                                        <div className="news-source">
                                            <span className="source-name">AI Briefing</span>
                                            <span className="news-date">{formatDate(news.date || news.publishedAt)}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </div>
        </>
    );
};

export default CategoryPage;