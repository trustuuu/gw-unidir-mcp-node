import fs from "fs";

/**
 * 서비스 계정 JSON 파일을 Base64로 변환하는 함수
 * @param {string} filePath - JSON 파일 경로
 */
function encodeServiceAccount(filePath) {
  try {
    // 1. 파일 읽기
    const fileContent = fs.readFileSync(filePath, "utf-8");

    // 2. JSON 유효성 검사 (선택 사항)
    JSON.parse(fileContent);

    // 3. Base64 인코딩
    const base64String = Buffer.from(fileContent).toString("base64");

    console.log("=== Base64 Encoded Key ===");
    console.log(base64String);
    console.log("==========================");
    console.log(
      "\n위 문자열을 복사하여 Vercel의 환경변수(GCP_SERVICE_ACCOUNT_BASE64)에 넣으세요.",
    );
  } catch (error) {
    console.error(
      "파일을 읽거나 인코딩하는 중 오류가 발생했습니다:",
      error.message,
    );
  }
}

// 파일명을 본인의 파일명으로 수정하세요.
encodeServiceAccount("../__secret/jovial-talon-480722-u3-fb61309ed5ec.json");
