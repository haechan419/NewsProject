package com.fullStc.ai.repository;

import com.fullStc.ai.domain.MemberConfig;
import org.springframework.data.jpa.repository.JpaRepository;

// 제네릭의 두 번째 인자가 Long인지 꼭 확인하세요!
public interface MemberConfigRepository extends JpaRepository<MemberConfig, Long> {
}