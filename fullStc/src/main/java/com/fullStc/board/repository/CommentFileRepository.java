package com.fullStc.board.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.fullStc.board.domain.CommentFile;

@Repository
public interface CommentFileRepository extends JpaRepository<CommentFile, Long> {
}