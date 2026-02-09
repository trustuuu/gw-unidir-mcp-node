import dotenv from "dotenv";
dotenv.config();

async function listTunedModels() {
  const apiKey = "AIzaSyCERkIXqUFhgOnCADnSYaolTpCnxXJULaw"; //process.env.GEMINI_API_KEY;
  const url = new URL(
    "https://generativelanguage.googleapis.com/v1beta/tunedModels?key=" +
      apiKey +
      "&pageSize=100",
  );
  console.log("apiKey", apiKey, process.env.GEMINI_API_KEY);
  const response = await fetch(url);
  const data = await response.json();

  if (data.error) {
    console.error("상세 에러 내용:", data.error.message);
    return;
  }
  console.log("성공! 튜닝 모델 리스트:", data);
}

// import { ModelServiceClient } from "@google-cloud/aiplatform";

// const client = new ModelServiceClient();
// const [models] = await client.listModels({
//   parent: `projects/392082489530/locations/us-central1`,
// });

// models.forEach((m) => {
//   console.log(m.name);
// });

listTunedModels();
