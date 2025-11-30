
import { GoogleGenAI, Type, Schema } from "@google/genai";
import { Conference, ReviewResult, AppConfig } from "../types";

// Helper to initialize AI with config overrides
const getAIClient = (config?: AppConfig) => {
  const envKey = process.env.API_KEY || '';
  const userKey = config?.modelConfig?.apiKey;
  const apiKey = userKey || envKey;

  if (!apiKey) throw new Error("API Key missing. Please set it in Settings or Environment.");

  const options: any = { apiKey };
  
  return new GoogleGenAI(options);
};

const getModelName = (config?: AppConfig) => {
  return config?.modelConfig?.modelName || 'gemini-2.5-flash';
};

const getModelConfig = (config: AppConfig) => {
  return {
    temperature: config.modelConfig.temperature,
    topK: config.modelConfig.topK,
    topP: config.modelConfig.topP,
  }
};

/**
 * Agent Step 1: Desk Reject Check
 */
export const checkDeskReject = async (
  paperText: string,
  conference: Conference,
  config: AppConfig
): Promise<{ isDeskReject: boolean; reason: string }> => {
  const ai = getAIClient(config);

  const prompt = `
    You are acting as ${config.userProfile.name}, a ${config.userProfile.role} at ${config.userProfile.affiliation}.
    Your expertise includes: ${config.userProfile.expertise}.

    You are evaluating a submission for ${conference.name} (${conference.shortName}).
    Your task is to perform a strict "Desk Reject" check.
    
    Conference Focus Area: ${conference.focusArea}
    
    Custom Rules/Guidelines:
    ${config.customConferences.find(c => c.id === conference.id)?.customRules || conference.customRules || "Review strictly based on technical content."}

    Criteria for Desk Reject:
    1. Significantly out of scope for the conference.
    2. Text is gibberish or too short to be a paper.
    
    IMPORTANT: Do NOT check for double-blind violations. Author names and affiliations are ALLOWED in this review process. Do NOT reject based on anonymity violations.

    Analyze the paper text provided below.
  `;

  const schema: Schema = {
    type: Type.OBJECT,
    properties: {
      isDeskReject: { type: Type.BOOLEAN, description: "True if the paper should be desk rejected." },
      reason: { type: Type.STRING, description: "Detailed reason for rejection, or 'Pass' if accepted." },
    },
    required: ["isDeskReject", "reason"],
  };

  try {
    const response = await ai.models.generateContent({
      model: getModelName(config),
      contents: [
        { role: 'user', parts: [{ text: prompt }] },
        { role: 'user', parts: [{ text: `--- BEGIN PAPER TEXT ---\n${paperText.substring(0, 10000)}\n--- END PAPER TEXT ---` }] }
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: schema,
        temperature: 0.1, // Deterministic for rules
      }
    });

    const result = JSON.parse(response.text || "{}");
    return {
      isDeskReject: result.isDeskReject,
      reason: result.reason
    };
  } catch (error) {
    console.error("Desk Reject Error:", error);
    return { isDeskReject: false, reason: "Auto-check failed or API error. Proceeding to review." };
  }
};

/**
 * Agent Step 2: Deep Review
 */
export const performDeepReview = async (
  paperText: string,
  conference: Conference,
  config: AppConfig
): Promise<ReviewResult> => {
  const ai = getAIClient(config);

  const prompt = `
    You are acting as ${config.userProfile.name}, a ${config.userProfile.role} at ${config.userProfile.affiliation}.
    Your expertise is: ${config.userProfile.expertise}.

    Conduct a full technical review of the paper below for ${conference.name}.
    
    Reference Style Guide & Few-Shot Examples (Use this tone/style):
    ${config.fewShotExamples}

    Structure your review EXACTLY with the following sections:
    1. Desk Rejection Assessment (Briefly confirm Paper Length, Topic Compatibility, Minimum Quality. IGNORE Anonymity/Double-blind checks).
    2. Paper Summary
    3. Paper Strengths (Detailed discussion)
    4. Paper Weaknesses (Detailed discussion)
    5. Potentially Missing Related Work
    6. Questions and Suggestions for Rebuttal
    7. Ratings (1-10 Scale for Relevance, Novelty, Technical Quality, Presentation, Reproducibility, Confidence)
    8. Ethics Review (Flag and Description)
    9. GenAI Content Analysis (Assess if the text appears to be LLM generated)

    Provide a final decision (Accept, Weak Accept, Weak Reject, Reject).
  `;

  const schema: Schema = {
    type: Type.OBJECT,
    properties: {
      deskRejectAssessment: { type: Type.STRING, description: "Brief confirmation of length, topic, quality. State that Anonymity check was skipped." },
      summary: { type: Type.STRING },
      strengths: { type: Type.STRING, description: "Detailed paragraphs describing strengths." },
      weaknesses: { type: Type.STRING, description: "Detailed paragraphs describing weaknesses." },
      missingRelatedWork: { type: Type.STRING },
      questionsForRebuttal: { type: Type.STRING },
      
      ratings: {
        type: Type.OBJECT,
        properties: {
          relevance: { type: Type.INTEGER },
          novelty: { type: Type.INTEGER },
          technicalQuality: { type: Type.INTEGER },
          presentation: { type: Type.INTEGER },
          reproducibility: { type: Type.INTEGER },
          confidence: { type: Type.INTEGER },
        },
        required: ["relevance", "novelty", "technicalQuality", "presentation", "reproducibility", "confidence"]
      },
      
      finalDecision: { type: Type.STRING, enum: ["Accept", "Weak Accept", "Weak Reject", "Reject"] },
      ethicsFlag: { type: Type.STRING, enum: ["Yes", "No"] },
      ethicsDescription: { type: Type.STRING },
      genAIAnalysis: { type: Type.STRING, description: "Justification of whether content seems AI-generated." }
    },
    required: ["deskRejectAssessment", "summary", "strengths", "weaknesses", "ratings", "finalDecision", "ethicsFlag", "genAIAnalysis"]
  };

  try {
    const response = await ai.models.generateContent({
      model: getModelName(config), 
      contents: [
        { role: 'user', parts: [{ text: prompt }] },
        { role: 'user', parts: [{ text: `--- PAPER CONTENT ---\n${paperText.substring(0, 30000)}` }] } 
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: schema,
        ...getModelConfig(config),
      }
    });

    const json = JSON.parse(response.text || "{}");
    
    return {
      isDeskReject: false,
      deskRejectAssessment: json.deskRejectAssessment,
      summary: json.summary,
      strengths: json.strengths,
      weaknesses: json.weaknesses,
      missingRelatedWork: json.missingRelatedWork,
      questionsForRebuttal: json.questionsForRebuttal,
      ratings: json.ratings,
      ethicsFlag: json.ethicsFlag,
      ethicsDescription: json.ethicsDescription,
      genAIAnalysis: json.genAIAnalysis,
      finalDecision: json.finalDecision,
      rawOutput: response.text
    };
  } catch (error) {
    console.error("Deep Review Error:", error);
    throw error;
  }
};

/**
 * Agent Step 3: Rebuttal Simulator
 */
export const generateRebuttalResponse = async (
  history: { role: string; text: string }[],
  paperTitle: string,
  initialReview: ReviewResult,
  conferenceName: string,
  config: AppConfig
): Promise<string> => {
   const ai = getAIClient(config);

   const systemInstruction = `
    You are acting as ${config.userProfile.name}, a ${config.userProfile.role}.
    You have reviewed the paper "${paperTitle}" for ${conferenceName} and gave a decision of "${initialReview.finalDecision}".
    
    Your main criticisms were:
    ${initialReview.weaknesses}

    The author is engaging in a rebuttal. Respond to their arguments. 
    Defend your position if they don't provide evidence, but acknowledge valid points.
    Keep responses professional, academic, and concise.
   `;

   const prevHistory = history.slice(0, -1).map(h => ({
     role: h.role,
     parts: [{ text: h.text }]
   }));
   
   const lastMsg = history[history.length - 1];

   const chat = ai.chats.create({
      model: getModelName(config),
      config: { 
        systemInstruction,
        temperature: 0.7 
      },
      history: prevHistory
   });

   const response = await chat.sendMessage({ message: lastMsg.text });
   return response.text || "I have no further comments.";
};
