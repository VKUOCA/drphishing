import React, { useState } from "react";
import "./App.css";
import ResultText from "./ResultText";
import Logo from "./logo.png";
import Logo2 from "./logo2.png";
import ResultFile from "./ResultFile";

function App() {
  const [currentView, setCurrentView] = useState("home");
  const [inputContent, setInputContent] = useState("");
  const [selectedFile, setSelectedFile] = useState(null); 
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [selectedType, setSelectedType] = useState("text");
  const [showConsentPopup, setShowConsentPopup] = useState(false);
  const [showPrivacyPolicy, setShowPrivacyPolicy] = useState(false);
  const [showLogo, setShowLogo] = useState(true); // 로고 상태 관리

  // 파일 선택
  const handleFileChange = (event) => {
    setSelectedFile(event.target.files[0]);
  };

  const handleEmailAnalysis = async () => {
    if (!inputContent.trim()) {
      alert("이메일 본문을 입력하세요!");
      return;
    }
  
    setLoading(true);
    try {
      const response = await fetch("http://127.0.0.1:8000/analyze_email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: inputContent }),
      });
  
      if (!response.ok) {
        console.error("서버 응답 오류:", response.status);
        return;
      }
  
      const data = await response.json();
      console.log("API 응답:", data);
  
      setResult(data);
      setCurrentView("result-text");
    } catch (error) {
      console.error("API 요청 실패:", error);
    }
    setLoading(false);
  };

  const handleFileAnalysis = async () => {
    if (!selectedFile) {
      alert("첨부파일을 선택하세요!");
      return;
    }
  
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
  
      const response = await fetch("http://127.0.0.1:8000/analyze_file", {
        method: "POST",
        body: formData,
      });
  
      if (!response.ok) {
        console.error("서버 응답 오류:", response.status);
        return;
      }
  
      const data = await response.json();
      console.log("파일 분석 API 응답:", data);
  
      setResult(data.analysis_result);
      setCurrentView("result-file");
    } catch (error) {
      console.error("파일 API 요청 실패:", error);
    }
    setLoading(false);
  };

      // 결과 화면
      if (currentView === "result-text") {
        return <ResultText result={result} setCurrentView={setCurrentView} />;
      }
    
      if (currentView === "result-file") {
        return <ResultFile result={result} setCurrentView={setCurrentView} />;
      }

  // 동의 팝업에서 처리하는 동의/비동의 함수
  const handleConsent = (consent) => {
    setShowConsentPopup(false); // 동의 팝업 닫기

    if (consent) {
      console.log("사용자가 동의했습니다.");

      // 검사 유형에 따라 본문 분석 또는 파일 분석을 실행
      if (selectedType === "text") {
        handleEmailAnalysis(); // 이메일 본문 분석 실행
      } else if (selectedType === "file") {
        handleFileAnalysis(); // 첨부파일 분석 실행
      }
    } else {
      console.log("사용자가 동의하지 않았습니다.");
      alert("개인정보 수집에 동의해야 분석을 진행할 수 있습니다.");
    }
  };

  // 파일 검사 동의 처리 함수
  const handleFileConsent = (consent) => {
    setShowConsentPopup(false); // 동의 팝업 닫기

    if (consent) {
      console.log("사용자가 동의했습니다.");

      // 첨부파일 분석 실행
      handleFileAnalysis();
    } else {
      console.log("사용자가 동의하지 않았습니다.");
      alert("개인정보 수집에 동의해야 파일 분석을 진행할 수 있습니다.");
    }
  };

  // 개인정보 처리방침 모달 창을 열기
  const togglePrivacyPolicy = () => {
    setShowPrivacyPolicy(!showPrivacyPolicy);
  };

  // 메인 화면 렌더링
  return (
    <div className="app-container">
      <h2 className="header-text">이메일 피싱 위험을 확인해보세요.</h2>

      <div className="document-type-container">
        <h3 className="document-type-title">검사유형</h3>
        <div className="tab-container">
          <button
            className={`tab ${selectedType === "text" ? "active" : ""}`}
            onClick={() => setSelectedType("text")}
          >
            본문
          </button>
          <button
            className={`tab ${selectedType === "file" ? "active" : ""}`}
            onClick={() => setSelectedType("file")}
          >
            첨부파일
          </button>
        </div>
      </div>

      <div className="email-analysis-box">
        {selectedType === "text" ? (
          <>
            {showLogo && inputContent.trim() === "" && (
              <img src={Logo} alt="로고" className="input-logo" />
            )}
            <textarea
              className="email-input"
              placeholder={showLogo ? "" : "이메일 본문을 입력하세요..."}
              value={inputContent}
              onChange={(e) => setInputContent(e.target.value)}
              maxLength={1000}
              onFocus={() => setShowLogo(false)}
              onBlur={() => {
                if (inputContent.trim() === "") {
                  setShowLogo(true);
                }
              }}
            />
            <div className="footer">
              <span className="char-count">{inputContent.length} / 1,000 자</span>
              <button
                className="analyze-button"
                onClick={() => setShowConsentPopup(true)}
                disabled={loading}
              >
                {loading ? "분석 중..." : "결과 확인하기"}
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="file-upload-box">
              <label htmlFor="file-upload" className="custom-file-button">
              📁 파일 선택
              </label>
              <input
                id="file-upload"
                type="file"
                onChange={handleFileChange}
                style={{ display: "none" }}
              />
              {selectedFile && (
                <p className="selected-file-name">🔗 선택된 파일 : {selectedFile.name}</p>
              )}
              <div className="file-info">
                <p><strong>지원되는 파일 형식</strong></p>
                <span>[실행 파일] .exe .dll .sys .scr .drv .ocx .cpl<br /></span>
                <span>[일반 바이너리 파일] 모든 바이너리 파일 (.bin 등)<br /></span>
                <span>[기타 모든 파일] 모든 파일 해시 분석 및 YARA 검사 가능</span>
                <p><strong>분석이 제한될 수 있는 파일</strong></p>
                <span>암호화된 파일 (암호를 모르면 분석 불가능)<br /></span>
                <span>비정상적으로 손상된 파일</span>
              </div>
            </div>
            <div className="file-upload-footer">
              <button
                className="analyze-button"
                onClick={() => setShowConsentPopup(true)}
                disabled={loading}
              >
                {loading ? "분석 중..." : "결과 확인하기"}
              </button>
            </div>
          </>
        )}
      </div>


      {showConsentPopup && (
        <div className="consent-popup">
          <div className="popup-content">
            <h3>개인정보 수집 및 이용 동의</h3>
            <p>
              이메일 피싱 분석 서비스를 이용하기 위해, 아래와 같이 개인정보를 수집·이용합니다.
            </p>
            <table className="consent-table">
              <thead>
              <tr>
                    <th>수집 항목</th>
                    <th>이용 목적</th>
                    <th>보유 및 이용기간</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>이메일 제목</td>
                    <td>피싱 여부 분석 및 위험도 평가</td>
                    <td>분석 완료 후 30일 이내 삭제</td>
                  </tr>
                  <tr>
                    <td>발신자 이메일 주소</td>
                    <td>이메일 출처 검증<br/>(SPF, DKIM, DMARC 검사)</td>
                    <td>분석 완료 후 30일 이내 삭제</td>
                  </tr>
                  <tr>
                    <td>이메일 내 포함된 URL</td>
                    <td>피싱 사이트 여부 판단 및 위험 분석</td>
                    <td>분석 완료 후 30일 이내 삭제</td>
                  </tr>
                  <tr>
                    <td>첨부파일 정보 (파일명, 해시값)</td>
                    <td>악성코드 탐지 및 보안 위협 평가</td>
                    <td>분석 완료 후 30일 이내 삭제</td>
                  </tr>
                  <tr>
                    <td>사용자의 서비스 이용 기록</td>
                    <td>서비스 개선 및 부정 이용 방지</td>
                    <td>최대 1년간 보관 후 삭제</td>
                  </tr>
              </tbody>
            </table>
            <p className="medium-text">
             사용자의 개인정보는 암호화된 상태로 안전하게 보호됩니다.
             사용자는 언제든지 개인정보 삭제 요청을 할 수 있습니다.
            </p>
            <p>
              <span
                className="privacy-link"
                onClick={togglePrivacyPolicy}
                style={{ textDecoration: "underline", cursor: "pointer" }}
              >
                개인정보 처리방침 자세히 보기
              </span>
            </p>
            <p className="small-text">
             동의하지 않으실 경우, 이메일 분석 서비스 이용이 제한됩니다.
            </p>
            <div className="popup-buttons">
              <button className="consent-small-button agree" onClick={() => handleConsent(true)}>
                ✔ 동의하고 분석하기
              </button>
              <button className="consent-small-button disagree" onClick={() => handleConsent(false)}>
                ✖ 비동의
              </button>
            </div>
          </div>
        </div>
      )}

      {showPrivacyPolicy && (
        <div className="privacy-popup">
          <div className="privacy-popup-content">
          <div className="popup-header">
            <img src={Logo2} alt="Dr. Phishing 로고" className="popup-logo" />
            <span className="privacy-title">개인정보처리방침</span>
          </div>
          <div className="privacy-content">
              <h4>1. 총칙</h4>
              <p>
              Dr. Phishing(이하 "서비스")는 이용자의 개인정보를 보호하고, 관련 법령을 준수하기 위해 다음과 같이 개인정보 처리방침을 수립하여 공개합니다. 본 서비스는 「개인정보 보호법」 및 관련 법령을 준수하여 개인정보를 적법하고 안전하게 처리하고 있습니다.
              </p>

              <h4>2. 개인정보의 처리 목적</h4>
              <p>
              본 서비스는 사용자의 이메일을 분석하여 피싱 여부를 판별하고, 보안 위협을 식별하는 기능을 제공합니다. 개인정보는 다음의 목적을 위해 수집 및 이용됩니다.
              </p>
              <ul style={{ paddingLeft: "0" }}>
              <li style={{ paddingLeft: "10px", listStylePosition: "inside" }}>
              이메일 및 첨부파일 보안 분석
                <ul style={{ marginLeft: "15px", paddingLeft: "10px", listStylePosition: "inside" }}>
                  <li style={{ marginTop: "10px", marginBottom: "1px" }}>
                  이메일 및 첨부파일을 AI 모델을 활용하여 분석하고, 피싱 가능성을 판단합니다.
                  </li>
                  <li>
                  피싱 가능성이 높은 문장을 자동으로 식별하여 표시합니다.
                  </li>
                </ul>
              </li>
              <li style={{ paddingLeft: "10px", listStylePosition: "inside" }}>
                SPF, DKIM, DMARC 검사 수행
                <ul style={{ marginLeft: "15px", paddingLeft: "10px", listStylePosition: "inside" }}>
                  <li style={{ marginTop: "10px", marginBottom: "1px" }}>
                    이메일 발신자의 도메인 인증 상태를 확인하여 위·변조 가능성을 분석합니다.
                  </li>
                </ul>
              </li>
              <li style={{ paddingLeft: "10px", listStylePosition: "inside" }}>
              URL 보안 검사
                <ul style={{ marginLeft: "15px", paddingLeft: "10px", listStylePosition: "inside" }}>
                  <li style={{ marginTop: "10px", marginBottom: "1px" }}>
                  이메일 본문 내 포함된 URL을 분석하여 피싱 사이트 여부를 판별합니다.
                  </li>
                  <li>
                  Google Safe Browsing 및 AI 모델을 활용한 탐지 기능을 제공합니다.
                  </li>
                </ul>
              </li>
              <li style={{ paddingLeft: "10px", listStylePosition: "inside" }}>
              첨부파일 악성코드 탐지 및 정적 분석
                <ul style={{ marginLeft: "15px", paddingLeft: "10px", listStylePosition: "inside" }}>
                  <li style={{ marginTop: "10px", marginBottom: "1px" }}>
                  업로드된 파일을 대상으로 악성코드 존재 여부를 분석합니다.
                  </li>
                  <li>
                  YARA 룰셋 기반의 보안 탐지 기능을 수행합니다.
                  </li>
                </ul>
              </li>
              <li style={{ paddingLeft: "10px", listStylePosition: "inside" }}>
                서비스 개선 및 연구 활용
                <ul style={{ marginLeft: "15px", paddingLeft: "10px", listStylePosition: "inside" }}>
                  <li style={{ marginTop: "10px", marginBottom: "1px" }}>
                  AI 모델의 성능 개선 및 피싱 탐지 기술 향상을 위한 연구 목적으로 활용됩니다.
                  </li>
                </ul>
              </li>
              <li style={{ paddingLeft: "10px", listStylePosition: "inside" }}>
                법적 의무 준수 및 보안 조치
                <ul style={{ marginLeft: "15px", paddingLeft: "10px", listStylePosition: "inside" }}>
                  <li style={{ marginTop: "10px", marginBottom: "1px" }}>
                    보안 사고 예방 및 대응을 위한 기록 보관
                  </li>
                  <li>
                    법령상 의무 준수를 위한 데이터 저장 및 관리
                  </li>
                </ul>
              </li>
              </ul>
              <p>수집된 개인정보는 상기 목적 이외의 용도로 사용되지 않으며, 목적 변경 시 「개인정보 보호법」 제18조에 따라 별도의 동의를 받을 예정입니다.</p>
              <h4>3. 처리하는 개인정보 항목 및 보유 기간</h4>
              <p>
              본 서비스는 이용자의 이메일 및 파일을 분석하기 위해 아래와 같은 개인정보를 수집 및 처리합니다.
              </p>
              <table className="privacy-table">
                <thead>
                  <tr>
                    <th>수집 항목</th>
                    <th>이용 목적</th>
                    <th>보유 및 이용기간</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>이메일 제목</td>
                    <td>피싱 여부 분석 및 위험도 평가</td>
                    <td>분석 완료 후 30일 이내 삭제</td>
                  </tr>
                  <tr>
                    <td>발신자 이메일 주소</td>
                    <td>이메일 출처 검증<br/>(SPF, DKIM, DMARC 검사)</td>
                    <td>분석 완료 후 30일 이내 삭제</td>
                  </tr>
                  <tr>
                    <td>이메일 내 포함된 URL</td>
                    <td>피싱 사이트 여부 판단 및 위험 분석</td>
                    <td>분석 완료 후 30일 이내 삭제</td>
                  </tr>
                  <tr>
                    <td>첨부파일 정보 (파일명, 해시값)</td>
                    <td>악성코드 탐지 및 보안 위협 평가</td>
                    <td>분석 완료 후 30일 이내 삭제</td>
                  </tr>
                  <tr>
                    <td>사용자의 서비스 이용 기록</td>
                    <td>서비스 개선 및 부정 이용 방지</td>
                    <td>최대 1년간 보관 후 삭제</td>
                  </tr>
                </tbody>
              </table>
              <p>
              ※ 익명화된 데이터는 연구 목적으로 장기 보존될 수 있습니다.
              </p>
              <h4>4. 이용자의 권리 및 행사 방법</h4>
              <p>이용자는 개인정보 보호법에 따라 자신의 개인정보에 대해 다음과 같은 권리를 행사할 수 있습니다.</p>
              <ul style={{ paddingLeft: "0" }}>
              <li style={{ paddingLeft: "10px", listStylePosition: "inside" }}>
              개인정보 열람 요청
                <ul style={{ marginLeft: "15px", paddingLeft: "10px", listStylePosition: "inside" }}>
                  <li style={{ marginTop: "10px", marginBottom: "1px" }}>
                  이용자는 본 서비스가 보유하고 있는 자신의 개인정보를 확인할 수 있습니다.
                  </li>
                </ul>
              </li>
              <li style={{ paddingLeft: "10px", listStylePosition: "inside" }}>
              개인정보 정정 및 삭제 요청
                <ul style={{ marginLeft: "15px", paddingLeft: "10px", listStylePosition: "inside" }}>
                  <li style={{ marginTop: "10px", marginBottom: "1px" }}>
                  개인정보가 부정확하거나 변경된 경우, 이용자는 정정 또는 삭제를 요청할 수 있습니다. 단, 법령상 보관이 필요한 경우 즉시 삭제가 불가능할 수 있습니다.
                  </li>
                </ul>
              </li>
              <li style={{ paddingLeft: "10px", listStylePosition: "inside" }}>
              개인정보 처리 정지 요청
                <ul style={{ marginLeft: "15px", paddingLeft: "10px", listStylePosition: "inside" }}>
                  <li style={{ marginTop: "10px", marginBottom: "1px" }}>
                  특정한 상황에서 개인정보 처리의 일시적 정지를 요청할 수 있습니다.
                  </li>
                </ul>
              </li>
              <li style={{ paddingLeft: "10px", listStylePosition: "inside" }}>
              자동화된 의사결정에 대한 이의제기
                <ul style={{ marginLeft: "15px", paddingLeft: "10px", listStylePosition: "inside" }}>
                  <li style={{ marginTop: "10px", marginBottom: "1px" }}>
                  AI 기반의 자동 분석 결과에 대해 재평가를 요청할 수 있습니다.
                  </li>
                  <li style={{ marginTop: "10px", marginBottom: "1px" }}>
                  자동 분석 결과가 부정확하다고 판단될 경우, 이용자는 서비스 내 재검토 요청 기능을 이용할 수 있습니다.
                  </li>
                </ul>
              </li>
              <p>위 요청은 Dr.Phishing 개인정보 보호팀(이메일 : drphishing@gmail.com)으로 연락 가능합니다.</p>
              </ul>
              <h4>5. 자동화된 의사결정 및 프로파일링 관련 안내</h4>
              <p>본 서비스는 AI 모델을 활용하여 이메일 및 첨부파일의 피싱 여부를 자동으로 분석합니다. 자동화된 의사결정과 관련된 주요 사항은 다음과 같습니다.</p>

              <ul style={{ paddingLeft: "0" }}>
              <li style={{ paddingLeft: "10px", listStylePosition: "inside" }}>
              AI 기반 분석 절차
                <ul style={{ marginLeft: "15px", paddingLeft: "10px", listStylePosition: "inside" }}>
                  <li style={{ marginTop: "10px", marginBottom: "1px" }}>
                  AI 모델이 이메일 및 파일을 분석하여 피싱 가능성이 높은 문장 및 악성코드 패턴을 자동 감지합니다.
                  </li>
                  <li>
                  Google Safe Browsing 및 AI 탐지 모델을 활용하여 URL의 피싱 여부를 분석합니다.
                  </li>
                  <li>
                  AI 분석 결과를 기반으로 이메일 및 첨부파일의 최종 보안 상태를 결정합니다.
                  </li>
                </ul>
              </li>
              <li style={{ paddingLeft: "10px", listStylePosition: "inside" }}>
              이용자의 권리 보장
                <ul style={{ marginLeft: "15px", paddingLeft: "10px", listStylePosition: "inside" }}>
                  <li style={{ marginTop: "10px", marginBottom: "1px" }}>
                  AI 자동 분석 결과가 부정확하다고 판단될 경우, 이용자는 수동 검토 요청 기능을 통해 재평가를 요청할 수 있습니다.
                  </li>
                  <li>
                  자동화된 분석 결과가 이용자에게 법적 또는 중대한 영향을 미칠 경우, 이용자는 이에 대해 이의를 제기할 수 있습니다.
                  </li>
                </ul>
              </li>
              </ul>
              <h4>6. 개인정보의 보호 조치</h4>
              <p>본 서비스는 개인정보 보호를 위해 다음과 같은 보안 조치를 시행합니다.</p>
              <ul style={{ paddingLeft: "0" }}>
              <li style={{ paddingLeft: "10px", listStylePosition: "inside" }}>
                관리적 조치
                <ul style={{ marginLeft: "15px", paddingLeft: "10px", listStylePosition: "inside" }}>
                  <li style={{ marginTop: "10px", marginBottom: "1px" }}>
                    개인정보 보호를 위한 내부관리 계획 수립 및 시행
                  </li>
                  <li>
                    개인정보 처리 담당자 교육 및 접근 권한 관리
                  </li>
                </ul>
              </li>
              <li style={{ paddingLeft: "10px", listStylePosition: "inside" }}>
                기술적 조치
                <ul style={{ marginLeft: "15px", paddingLeft: "10px", listStylePosition: "inside" }}>
                  <li style={{ marginTop: "10px", marginBottom: "1px" }}>
                  개인정보 암호화 및 보안 소프트웨어 설치
                  </li>
                  <li style={{ marginTop: "10px", marginBottom: "1px" }}>
                  정기적인 보안 점검 및 취약점 패치 수행
                  </li>
                </ul>
              </li>
              <li style={{ paddingLeft: "10px", listStylePosition: "inside" }}>
                물리적 조치
                <ul style={{ marginLeft: "15px", paddingLeft: "10px", listStylePosition: "inside" }}>
                  <li style={{ marginTop: "10px", marginBottom: "1px" }}>
                    개인정보 보관 시스템 접근 통제
                  </li>
                  <li>
                    서버실 및 자료 보관소 접근 제한
                  </li>
                </ul>
              </li>
              </ul>
              <h4>7. 개인정보 처리방침 변경 및 고지 의무</h4>
              <p>본 서비스는 개인정보 처리방침 변경 시 이용자에게 사전 공지하며, 최소 7일 전에 홈페이지 공지사항을 통해 안내합니다.</p>
              <ul style={{ paddingLeft: "0" }}>
              <li style={{ paddingLeft: "10px", listStylePosition: "inside" }}>
              변경 사항 발생 시 고지 방법
                <ul style={{ marginLeft: "15px", paddingLeft: "10px", listStylePosition: "inside" }}>
                  <li style={{ marginTop: "10px", marginBottom: "1px" }}>
                  서비스 홈페이지 공지사항 게시판에 사전 공지
                  </li>
                  <li>
                  중대한 변경 사항 발생 시 개별 이메일 통지
                  </li>
                </ul>
              </li>
              </ul>
              <h4>8. 개인정보 보호책임자 및 문의처</h4>
              <p>이용자는 개인정보 보호 관련 문의, 불만 처리, 피해 구제 등을 아래의 연락처를 통해 요청할 수 있습니다.</p>
              <ul style={{ paddingLeft: "0" }}>
              <li style={{ paddingLeft: "10px", listStylePosition: "inside" }}>
              개인정보 보호책임자
                <ul style={{ marginLeft: "15px", paddingLeft: "10px", listStylePosition: "inside" }}>
                  <li style={{ marginTop: "10px", marginBottom: "1px" }}>
                  담당 부서 : Dr.Phishing 개인정보 보호팀
                  </li>
                  <li>
                  이메일 : drphishing@gmail.com
                  </li>
                </ul>
              </li>
              <li style={{ paddingLeft: "10px", listStylePosition: "inside" }}>
              고객 문의처
                <ul style={{ marginLeft: "15px", paddingLeft: "10px", listStylePosition: "inside" }}>
                  <li style={{ marginTop: "10px", marginBottom: "1px" }}>
                  운영 시간 : 평일 09:00 ~ 18:00 (주말, 공휴일 제외)
                  </li>
                  <li>
                  문의 가능 사항 : 개인정보 조회, 수정, 삭제 요청, 보안 관련 문의
                  </li>
                </ul>
              </li>
              </ul>
              <h4>본 서비스는 이용자의 개인정보를 보호하기 위해 지속적으로 개인정보 처리방침을 점검하고 개선해 나가겠습니다.</h4>
              <button className="close-button" onClick={togglePrivacyPolicy}>
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;