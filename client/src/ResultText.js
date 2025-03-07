import React, { useEffect, useState } from "react";
import "./ResultText.css";

const ResultText = ({ result, setCurrentView }) => {
  const [percentage, setPercentage] = useState(0);
  const [riskStatus, setRiskStatus] = useState("의심");

//SPF, DKIM, DMARC 검사 결과 정리 함수
const formatSecurityCheck = (label, value) => {
  if (!value) return <span className="error">검사 결과 없음</span>;

  const statusMatch = value.match(/\[(정상|주의|경고|위험|검사 실패|잘못된 도메인)]/);
  if (statusMatch) {
    const statusText = statusMatch[0];
    const statusWord = statusMatch[1];
    const messageText = value.replace(statusText, "").trim();

    let className = "";
    if (statusWord === "정상") className = "success";
    else if (statusWord === "주의" || statusWord === "경고") className = "warning";
    else className = "error";

    return (
      <>
        <span className={className}>{statusText}</span> {messageText}
      </>
    );
  }
  return value;
};

  // 위험도 상태 계산 및 설정
  useEffect(() => {
    if (result) {
      let finalRiskScore = 0;
  
      // KoBERT 분석 결과 반영
      let kobertRisk = result.kobert_result?.score ? Math.round(result.kobert_result.score * 100) : 0;

      // KoELECTRA 분석 결과 반영
      let koelectraRisk = result.koelectra_result?.score ? Math.round(result.koelectra_result.score * 100) : 0;
  
      // URL 분석 결과 반영
      let phishingUrls = result.url_results?.filter(url => url.ml_result?.is_phishing_ml) || [];
      let hasHighRiskUrl = phishingUrls.some(url => url.ml_result?.phishing_probability_ml === 1.0);
  
      // SPF/DKIM/DMARC 보안 문제 반영
      let securityWarnings = [
        result.spf_result?.includes("주의") || result.spf_result?.includes("경고"),
        result.dkim_result?.includes("주의") || result.dkim_result?.includes("경고"),
        result.dmarc_result?.includes("잘못된 도메인")
      ].filter(Boolean).length;
  
      // 최종 점수 계산 (가중치 반영)
      finalRiskScore = Math.round(
        kobertRisk * 0.5 + koelectraRisk * 0.3 + (phishingUrls.length * 10) + (securityWarnings * 5)
      );
  
      // URL 피싱 위험 100%인 경우 강제 `"위험"`
      if (hasHighRiskUrl) {
        finalRiskScore = 100;
      }
  
      // 위험 상태 설정 (보안 문제, URL 피싱 여부 추가 반영)
      let riskLabel = "의심";
      if (finalRiskScore > 75 || hasHighRiskUrl) riskLabel = "위험";
      else if (finalRiskScore < 30 && phishingUrls.length === 0 && securityWarnings === 0) riskLabel = "정상";
      setPercentage(finalRiskScore);
      setRiskStatus(riskLabel);
    }
  }, [result]);
  
  // URL 분석 결과 종합 함수
  const getFinalDecision = (urlData) => {
    if (!urlData) return { status: "알 수 없음", reason: "URL 분석 결과 없음" };
  
    const { google_safe_browsing_result, ml_result } = urlData;
  
    if (google_safe_browsing_result) {
      return { 
              status: "위험", 
              reason: "Google Safe Browsing에서 피싱 사이트로 감지되었습니다.",
              warningMessage: "위험! 해당 링크를 클릭하지 마세요." // 추가된 경고 메시지
       };
    }
  
    if (ml_result?.is_phishing_ml) {
      return {
        status: "주의",
        reason: `ML 분석 결과 피싱 가능성 ${Math.round(ml_result.phishing_probability_ml * 100)}%입니다.`,
        warningMessage: "주의! 해당 링크를 클릭하지 않는 것이 안전합니다." // 추가된 경고 메시지
      };
    }
  
    return { status: "안전", reason: "Google Safe Browsing 및 ML 분석 결과에서 위협 없음." };
  };
  
  return (
    <div className="result-container">
      <h2 className="result-header">이메일 피싱 위험도</h2>

      {/* 원형 프로그래스 바 */}
      <div className="circular-progress">
        <svg width="150" height="150">
          <circle className="progress-background" cx="75" cy="75" r="65" />
          <circle
            className={`progress-value ${riskStatus}`}
            cx="75" cy="75"
            r="65"
            strokeDasharray="409"
            strokeDashoffset={409 - (409 * percentage) / 100}
          />
        </svg>
        <span className="progress-text">{percentage}%</span>
      </div>

      <div className={`risk-status ${riskStatus}`}>{riskStatus}</div>

      {/* 피싱 의심 문장 & URL 분석 결과 */}
      <div className="summary-container">
        <div className="summary-box">
          <div className="summary-title">피싱 의심 문장</div>
          <div className="summary-content">
            {result && result.suspicious_sentences?.length > 0 ? (
              <ul>
            {Array.from(new Set(result.suspicious_sentences || [])).slice(0, 3).map((sentence, index) => (
              <li key={index}>{sentence}</li>
            ))}
          </ul>
            ) : (
              <p className="no-data"> 피싱 의심 문장이 발견되지 않았습니다.</p>
            )}

            <div className="summary-title">URL 분석 결과</div>
            {/* URL 분석 결과 */}
            {result?.url_results?.length > 0 ? (
              result.url_results.map((urlData, index) => {
                const decision = getFinalDecision(urlData);

                return (
                  <p key={index} className="url-analysis">
                    🔗 <a href={urlData.url} target="_blank" rel="noopener noreferrer" className="url-link">
                      {urlData.url}
                    </a>
                    <br />
                    <span className={decision.status === "위험" || decision.status === "주의" ? "danger" : "safe"}>
                    [{decision.status}] {decision.reason}
                    </span>
                    <br />
                    {decision.warningMessage && ( //warningMessage
                    <span className="warning-message">⚠️ {decision.warningMessage}</span>
                  )}
                    <br />
                  </p>
                );
              })
            ) : (
              <p className="no-data"> 분석된 URL이 없습니다.</p>
            )}
          </div>
        </div>

        {/* 세부 보안 검사 결과 */}
        <div className="summary-box">
          <div className="summary-title">이메일 보안 검사 결과</div>
          <div className="summary-content">
            {result ? (
              <ul>
                <li>
                  <strong>SPF (발신자 위장 여부 검사)</strong>{" "}
                  <br />
                  {formatSecurityCheck("SPF", result.spf_result)}
                </li>
                <li>
                  <strong>DKIM (이메일 위·변조 여부 확인)</strong>{" "}
                  <br />
                  {formatSecurityCheck("DKIM", result.dkim_result)}
                </li>
                <li>
                  <strong>DMARC (도메인 보안 정책 준수 여부)</strong>{" "}
                  <br />
                  {formatSecurityCheck("DMARC", result.dmarc_result)}
                </li>
              </ul>
            ) : (
              "세부 결과가 없습니다."
            )}
          </div>
        </div>
      </div>

      <button className="detail-button" onClick={() => setCurrentView("home")}>
        다시 검사하기
      </button>
    </div>
  );
};

export default ResultText;
