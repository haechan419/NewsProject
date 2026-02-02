package com.fullStc.news.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class NewsPipelineService {

    private final NaverEnrichService enrichService;
    private final KeywordClusterService keywordClusterService;
    private final SummarizerBatchService summarizerBatchService;
    private final EmbeddingBatchService embeddingBatchService;
    private final NewsQualityPythonService qualityPythonService;

    public PipelineResult run(int limitEach) {

        var enrich = enrichService.enrich(limitEach);

        int clustered = 0;
        try { clustered = keywordClusterService.clusterByKeywords(limitEach); }
        catch (Exception e) { System.out.println("[PIPELINE] keyword cluster skipped: " + e.getMessage()); }

        int summarized = 0;
        try { summarized = summarizerBatchService.fillAiSummaries(limitEach); }
        catch (Exception e) { System.out.println("[PIPELINE] summarize skipped: " + e.getMessage()); }

        int emb = 0;
        try { emb = embeddingBatchService.fillEmbeddings(limitEach); }
        catch (Exception e) { System.out.println("[PIPELINE] embedding skipped: " + e.getMessage()); }

        int verified = 0;
        try { verified = qualityPythonService.runQualityWithClustering(limitEach); }
        catch (Exception e) { System.out.println("[PIPELINE] python quality skipped: " + e.getMessage()); }

        return new PipelineResult(
                enrich.contentFilled(),
                0,
                clustered,
                summarized,
                emb,
                verified
        );
    }

    public record PipelineResult(
            int contentFilled,
            int aiSummaryFilled,
            int clustered,
            int summarized,
            int embeddingFilled,
            int verifiedUpdated
    ) {}
}
