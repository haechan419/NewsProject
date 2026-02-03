import React from "react";
import ScrapCard from "./ScrapCard";

/** 스크랩 카드 그리드. emptyReason: no_scraps | no_match */
const ScrapGrid = ({ items, onUnscrap, emptyReason = null }) => {
  if (!items || items.length === 0) {
    const isNoMatch = emptyReason === "no_match";
    return (
      <div className="scrap-grid-empty">
        <p>{isNoMatch ? "조건에 맞는 스크랩이 없습니다." : "아직 스크랩한 뉴스가 없습니다."}</p>
        <p className="scrap-grid-empty-hint">
          {isNoMatch ? "다른 정렬·카테고리·검색 조건을 시도해 보세요." : "메인 피드에서 스크랩 버튼을 눌러 저장해보세요."}
        </p>
      </div>
    );
  }

  return (
    <div className="scrap-grid">
      {items.map((item) => (
        <ScrapCard key={item.sno ?? item.newsId} item={item} onUnscrap={onUnscrap} />
      ))}
    </div>
  );
};

export default ScrapGrid;
