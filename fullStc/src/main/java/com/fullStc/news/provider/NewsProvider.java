package com.fullStc.news.provider;

import com.fullStc.news.dto.UnifiedArticle;

import java.util.List;

public interface NewsProvider {
    String name(); // provider id
    List<UnifiedArticle> fetch(String category, String query, int size);
}
