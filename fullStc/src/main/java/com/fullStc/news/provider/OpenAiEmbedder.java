package com.fullStc.news.provider;

public interface OpenAiEmbedder {
    float[] embed(String text);
}
