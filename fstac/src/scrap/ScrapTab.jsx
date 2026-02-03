import React, { useEffect, useMemo, useState } from "react";
import ScrapGrid from "./components/ScrapGrid";
import { toggleScrap } from "./api/scrapApi";
import "./components/ScrapTab.css";

const SORT_LATEST = "desc";
const SORT_OLDEST = "asc";
const CATEGORY_ALL = "";
const SEARCH_DEBOUNCE_MS = 350;

/** 카테고리 필터 드롭다운 표시용 한글 라벨 */
const CATEGORY_LABELS = {
  politics: "정치",
  economy: "경제",
  culture: "문화",
  it: "IT/과학",
  society: "사회",
  world: "국제",
};
const CATEGORY_ORDER = ["정치", "경제", "문화", "IT/과학", "사회", "국제"];

const getCategoryLabel = (value) =>
  CATEGORY_LABELS[value?.toLowerCase?.() ?? ""] ?? value;
const getCategorySortKey = (value) => {
  const label = getCategoryLabel(value);
  const idx = CATEGORY_ORDER.indexOf(label);
  return idx >= 0 ? idx : CATEGORY_ORDER.length;
};

/** 마이페이지 스크랩 탭. 정렬·카테고리·검색 툴바 및 카드 그리드. 검색어 디바운스 적용. */
const ScrapTab = ({ scrapItems = [], memberId, onUnscrapSuccess }) => {
  const [sortOrder, setSortOrder] = useState(SORT_LATEST);
  const [categoryFilter, setCategoryFilter] = useState(CATEGORY_ALL);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const categories = useMemo(() => {
    const set = new Set();
    scrapItems.forEach((item) => {
      if (item.category && item.category.trim()) set.add(item.category.trim());
    });
    return Array.from(set).sort(
      (a, b) => getCategorySortKey(a) - getCategorySortKey(b)
    );
  }, [scrapItems]);

  const filteredItems = useMemo(() => {
    let list = [...scrapItems];
    if (categoryFilter !== CATEGORY_ALL) {
      list = list.filter((item) => item.category === categoryFilter);
    }
    const q = debouncedSearchQuery.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (item) => item.title && item.title.toLowerCase().includes(q)
      );
    }
    list.sort((a, b) => {
      const at = a.scrapedAt ? new Date(a.scrapedAt).getTime() : 0;
      const bt = b.scrapedAt ? new Date(b.scrapedAt).getTime() : 0;
      return sortOrder === SORT_LATEST ? bt - at : at - bt;
    });
    return list;
  }, [scrapItems, categoryFilter, debouncedSearchQuery, sortOrder]);

  const isEmptyByFilter = scrapItems.length > 0 && filteredItems.length === 0;

  const handleUnscrap = async (item) => {
    if (!memberId || !item.newsId) return;
    try {
      await toggleScrap(memberId, String(item.newsId));
      if (onUnscrapSuccess) onUnscrapSuccess(item);
    } catch (err) {
      console.error("스크랩 해제 실패:", err);
      alert("스크랩 해제에 실패했습니다.");
    }
  };

  return (
    <div className="scrap-tab">
      <div className="scrap-toolbar">
        <div className="scrap-toolbar-group">
          <label htmlFor="scrap-sort" className="scrap-toolbar-label">
            정렬
          </label>
          <select
            id="scrap-sort"
            className="scrap-toolbar-select"
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            aria-label="정렬"
          >
            <option value={SORT_LATEST}>최신순</option>
            <option value={SORT_OLDEST}>오래된 순</option>
          </select>
        </div>
        <div className="scrap-toolbar-group">
          <label htmlFor="scrap-category" className="scrap-toolbar-label">
            카테고리
          </label>
          <select
            id="scrap-category"
            className="scrap-toolbar-select"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            aria-label="카테고리 필터"
          >
            <option value={CATEGORY_ALL}>전체</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {getCategoryLabel(cat)}
              </option>
            ))}
          </select>
        </div>
        <div className="scrap-toolbar-group scrap-toolbar-search-wrap">
          <label htmlFor="scrap-search" className="scrap-toolbar-label">
            검색
          </label>
          <input
            id="scrap-search"
            type="search"
            className="scrap-toolbar-search"
            placeholder="제목으로 검색"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            aria-label="제목 검색"
          />
        </div>
      </div>
      <ScrapGrid
        items={filteredItems}
        onUnscrap={handleUnscrap}
        emptyReason={isEmptyByFilter ? "no_match" : scrapItems.length === 0 ? "no_scraps" : null}
      />
    </div>
  );
};

export default ScrapTab;
