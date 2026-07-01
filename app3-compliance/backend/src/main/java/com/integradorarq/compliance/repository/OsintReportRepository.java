package com.integradorarq.compliance.repository;

import com.integradorarq.compliance.model.OsintReport;
import org.springframework.data.elasticsearch.repository.ElasticsearchRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface OsintReportRepository extends ElasticsearchRepository<OsintReport, String> {
    List<OsintReport> findByFullNameContainingOrTargetId(String fullName, String targetId);
}
