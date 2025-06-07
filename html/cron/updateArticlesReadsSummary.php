<?php
require_once __DIR__ . '/../common/coreHead.php'; // Adjust to your DB bootstrap

// Build the summary query
$summaryQuery = "
    REPLACE INTO articlesReadsSummary (articles_id, read_count, updated_at)
    SELECT articles_id, COUNT(*) AS read_count, NOW()
    FROM articlesReads
    WHERE articlesReads_timestamp >= DATE_SUB(NOW(), INTERVAL 1 WEEK)
    GROUP BY articles_id
";

// Run the query
$result = $DBLIB->rawQuery($summaryQuery);

if (!$result) {
    error_log("Failed to update articlesReadSummary: " . $DBLIB->getLastError());
    echo "Failed to update summary.\n";
    return;
}

echo "articlesReadSummary updated successfully.\n";
