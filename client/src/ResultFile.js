import React, { useState, useEffect } from "react";
import "./ResultFile.css";

const ResultFile = ({ result, setCurrentView }) => {
  const [fileInfo, setFileInfo] = useState({});
  const [virusTotalInfo, setVirusTotalInfo] = useState({});
  const [yaraDetected, setYaraDetected] = useState(false);
  const [maliciousCount, setMaliciousCount] = useState(0);
  const [suspiciousCount, setSuspiciousCount] = useState(0);
  const [undetectedCount, setUndetectedCount] = useState(0);

  useEffect(() => {
    if (result) {
      const fileData = result.file_info || {};
      const yaraMatches = result.yara_result?.matches || [];
  
      // VirusTotal 데이터 가져오기
      const vtData = result.vt_result?.data?.attributes || {}; 
      const vtMeta = result.vt_result?.meta?.file_info || {}; // SHA256 가져오기
      const vtStats = vtData.last_analysis_stats || {}; // 악성 탐지 결과 가져오기
  
      // PDF도 정상적으로 VirusTotal 결과를 가져오도록 설정
      setFileInfo(fileData);
  
      setVirusTotalInfo({
        malicious: vtStats.malicious || 0,
        suspicious: vtStats.suspicious || 0,
        undetected: vtStats.undetected || 0,
        sha256: vtMeta.sha256 || vtData.sha256 || "", //PDF 파일에서도 sha256을 가져오도록 수정
      });
  
      setYaraDetected(yaraMatches.length > 0);
      setMaliciousCount(vtStats.malicious || 0);
      setSuspiciousCount(vtStats.suspicious || 0);
      setUndetectedCount(vtStats.undetected || 0);
    }
  
    console.log("백엔드 응답 데이터:", result);
  }, [result]);
  

  if (!result) {
    return <div className="error-message">파일 정보를 불러오는 중...</div>;
  }

  // 파일명 설정
  const fileName = result?.original_filename || "알 수 없음";

  // 파일 크기 변환 함수
  const formatFileSize = (sizeInBytes) => {
    if (!sizeInBytes) return "알 수 없음";
    if (sizeInBytes < 1024) return `${sizeInBytes} bytes`;
    if (sizeInBytes < 1048576) return `${(sizeInBytes / 1024).toFixed(0)}KB (${sizeInBytes.toLocaleString()} 바이트)`;
    if (sizeInBytes < 1073741824) return `${(sizeInBytes / 1048576).toFixed(0)}MB (${sizeInBytes.toLocaleString()} 바이트)`;
    return `${(sizeInBytes / 1073741824).toFixed(0)}GB (${sizeInBytes.toLocaleString()} 바이트)`;
  };

  // 기타 파일 정보
  const fileSize = fileInfo.size ? `${fileInfo.size} bytes` : "알 수 없음";
  const fileType = fileInfo.type || "알 수 없음";
  const md5 = fileInfo.md5 || "알 수 없음";
  const sha256 = fileInfo.sha256 || "알 수 없음";

  // 위험도 분류
  const riskStatus =
    maliciousCount >= 10 ? "위험" :
    maliciousCount > 0 ? "의심" : "안전";

  const riskMessages = {
    "위험": `🚨 이 파일은 ${maliciousCount}개의 보안 엔진에서 악성코드로 탐지되었습니다. 실행을 피하는 것이 좋습니다.`,
    "의심": `⚠️ 이 파일은 ${maliciousCount}개의 보안 엔진에서 의심스러운 요소가 감지되었습니다. 신뢰할 수 있는 출처인지 확인하세요.`,
    "안전": "✅ 이 파일은 현재 보안 위협이 발견되지 않았습니다. 하지만 신뢰할 수 있는 출처에서 받은 파일인지 확인하세요."
  };

  return (
    <div className="result-container">
      <h2 className="result-header">파일 보안 진단 결과</h2>

      {/* 위험도 상태 표시 */}
      <div className={`risk-status-container ${riskStatus.toLowerCase()}`}>
        <h2 className={`risk-status ${riskStatus.toLowerCase()}`}>{riskStatus}</h2>
        <p className="risk-message">{riskMessages[riskStatus]}</p>
      </div>

      {/* 파일 정보 */}
      <div className="details-grid">
        <div className="detail-card">
          <h3>📁 파일 정보</h3>
          <p><strong>파일명 :</strong> {fileName}</p>
          <p><strong>파일 크기 :</strong> {formatFileSize(fileInfo.size)}</p>
          <p><strong>파일 형식 :</strong> {fileType}</p>
          <p><strong>MD5 :</strong> {md5}</p>
          <p><strong>SHA-256 :</strong> <span className="sha256">{sha256}</span></p>
        </div>

        <div className="detail-card">
          <h3>🔒 검사 결과</h3>
          <h3>VirusTotal</h3>
          <p><strong>악성 탐지 :</strong> {virusTotalInfo.malicious}개</p>
          <p><strong>의심스러운 탐지 :</strong> {virusTotalInfo.suspicious}개</p>
          <p><strong>탐지되지 않음 :</strong> {virusTotalInfo.undetected}개 엔진에서 정상으로 판정</p>

          <p>
            <strong>VirusTotal 분석 링크 : </strong>
            {virusTotalInfo.sha256 ? (
              <a
                href={`https://www.virustotal.com/gui/file/${virusTotalInfo.sha256}/detection`}
                target="_blank"
                rel="noopener noreferrer"
              >
                검사 결과 보기
              </a>
            ) : (
              "VirusTotal 데이터 없음"
            )}
          </p>
          <h3>YARA</h3>
          <p className={`yara-result ${yaraDetected ? "warning" : "safe"}`}>
            {yaraDetected ? "이 파일은 위험할 수 있습니다." : "이 파일은 안전한 것으로 보입니다."}
          </p>
          <p className="yara-description">
            [ 참고 ] YARA는 파일에서 악성 코드나 의심스러운 패턴을 찾는 도구로, 보안 전문가들이 악성 코드 탐지에 사용합니다.
          </p>
        </div>
      </div>

      <button className="detail-button" onClick={() => setCurrentView("home")}>
        다시 검사하기
      </button>
    </div>
  );
};

export default ResultFile;
