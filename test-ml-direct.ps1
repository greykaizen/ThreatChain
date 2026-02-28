$body = @{
    entity_type = "report"
    entity_id = "test-123"
    features = @{
        total_reports = 50
        vt_detections = 10
        abuse_score = 75
        confidence = 80
        threatfox_iocs = 5
        mitre_confidence = 60
        asshole_score = 45
        classification_confidence = 70
        usage_type = "datacenter"
        country_code = "US"
        threat_category = "malware"
        infrastructure_type = "cloud"
        suspicious_isp = 1
        young_domain = 0
        residential_proxy = 0
        verified_identity = 1
        published_ip_ranges = 1
        signal_abuse_reports = 1
        signal_vt_detections = 1
        signal_threatfox = 1
        signal_suspicious_infra = 0
        signal_behavioral = 0
        reports_to_vt_ratio = 5
        has_ssl_data = 1
        ssl_port_open = 1
    }
} | ConvertTo-Json

Write-Host "Testing ML Service directly..." -ForegroundColor Cyan
Write-Host "Sending request to http://localhost:5001/ml/predict/trust-score" -ForegroundColor Yellow

try {
    $response = Invoke-RestMethod -Uri "http://localhost:5001/ml/predict/trust-score" -Method Post -Body $body -ContentType "application/json" -UseBasicParsing
    
    Write-Host "`n✅ ML Service Response:" -ForegroundColor Green
    Write-Host "Success: $($response.success)" -ForegroundColor White
    Write-Host "Abuse Score: $($response.predictions.abuse_score)" -ForegroundColor White
    Write-Host "Confidence: $($response.predictions.confidence)" -ForegroundColor White
    Write-Host "Auto Blocked: $($response.predictions.auto_blocked)" -ForegroundColor White
    Write-Host "Block Probability: $($response.predictions.auto_blocked_probability)" -ForegroundColor White
    Write-Host "Inference Time: $($response.inference_time_ms) ms" -ForegroundColor White
} catch {
    Write-Host "`n❌ Error calling ML service:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
}
