package com.fullStc.news.extract;

public interface ArticleExtractor {
    boolean supports(String url);
    String name();
    String extract(String url) throws Exception;
}
