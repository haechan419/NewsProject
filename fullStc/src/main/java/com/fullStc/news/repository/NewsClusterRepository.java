package com.fullStc.news.repository;


import org.springframework.data.jpa.repository.JpaRepository;
import com.fullStc.news.domain.NewsCluster;

import java.util.List;
import java.util.Optional;

public interface NewsClusterRepository extends JpaRepository<NewsCluster, Long> {

    Optional<NewsCluster> findByClusterKey(String clusterKey);
    List<NewsCluster> findTop20ByClusterSummaryIsNotNullOrderByIdDesc();
}
