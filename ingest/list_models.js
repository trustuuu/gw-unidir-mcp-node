import { GoogleGenerativeAI } from "@google/generative-ai";

async function checkModels() {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  try {
    // listModels는 genAI 객체에서 바로 호출해야 합니다.
    const result = await genAI.listModels();

    console.log("--- 사용 가능한 모델 리스트 ---");
    result.models.forEach((m) => {
      // 임베딩 지원 여부를 확인합니다.
      if (m.supportedGenerationMethods.includes("embedContent")) {
        console.log(`모델명: ${m.name} (임베딩 지원)`);
      }
    });
  } catch (e) {
    console.error("리스트 확인 실패:", e);
  }
}
checkModels();
