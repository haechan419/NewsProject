import React from "react";
import { useNavigate } from "react-router-dom";

const PLACEHOLDER_IMAGE =
  "https://via.placeholder.com/320x180/1a1a2e/eee?text=News";

/** 스크랩 항목 카드. 클릭 시 뉴스 상세 페이지로 이동. */
const ScrapCard = ({ item, onUnscrap }) => {
  const navigate = useNavigate();
  const imageUrl = item.imageUrl || PLACEHOLDER_IMAGE;
  const title = item.title || "제목 없음";
  const scrapedAt = item.scrapedAt
    ? new Date(item.scrapedAt).toLocaleDateString("ko-KR", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : "";

  const handleCardClick = () => {
    const newsForDetail = {
      id: item.newsId,
      title: item.title,
      clusterSummary: item.summary,
      summary: item.summary,
      originalUrl: item.url,
      url: item.url,
      date: item.scrapedAt,
      publishedAt: item.scrapedAt,
      imageUrl: item.imageUrl,
      image: item.imageUrl,
      category: item.category,
    };
    navigate(`/news/${item.newsId}`, { state: { news: newsForDetail, fromScrapList: true } });
  };

  const handleStarClick = (e) => {
    e.stopPropagation();
    if (onUnscrap) onUnscrap(item);
  };

  return (
    <div className="scrap-card" onClick={handleCardClick}>
      <div className="scrap-card-thumb">
        <img src={imageUrl} alt={title} />
        {item.category && (
          <span className="scrap-card-category">{item.category}</span>
        )}
      </div>
      <div className="scrap-card-info">
        <h3 className="scrap-card-title">{title}</h3>
        <div className="scrap-card-info-bottom">
          {scrapedAt && <span className="scrap-card-date">{scrapedAt}</span>}
          {onUnscrap && (
            <button
              type="button"
              className="scrap-card-star"
              onClick={handleStarClick}
              title="스크랩 해제"
              aria-label="스크랩 해제"
            >
              ★
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ScrapCard;
