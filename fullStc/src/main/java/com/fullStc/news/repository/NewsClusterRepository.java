package com.fullStc.news.repository;


import org.springframework.data.jpa.repository.JpaRepository;
import com.fullStc.news.domain.NewsCluster;

import java.util.Optional;

public interface NewsClusterRepository extends JpaRepository<NewsCluster, Long> {

    Optional<NewsCluster> findByClusterKey(String clusterKey);
}
