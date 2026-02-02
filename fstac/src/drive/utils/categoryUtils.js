const CATEGORY_MAP = {
  economy: "경제",
  politics: "정치",
  it: "IT",
  society: "사회",
  world: "글로벌",
  culture: "문화",
};

/**
 * @param {string} category
 * @returns {string}
 */
export function getCategoryDisplayName(category) {
  if (!category) return "일반";
  return CATEGORY_MAP[category.toLowerCase()] || "일반";
}

/**
 * @param {string} title
 * @param {string} category
 * @returns {string}
 */
export function formatNewsTitleWithCategory(title, category) {
  const categoryName = getCategoryDisplayName(category);
  return `[${categoryName}] ${title}`;
}
