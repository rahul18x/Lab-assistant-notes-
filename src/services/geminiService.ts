import { GoogleGenAI } from "@google/genai";
import { StudyMaterial } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export const generateStudyMaterial = async (topicTitle: string, topicId: string): Promise<StudyMaterial> => {
  const prompt = `
    You are an expert tutor for the Rajasthan Lab Assistant Exam. 
    Topic: "${topicTitle}".
    
    Task:
    1. Create high-quality revision notes in Hindi for this topic. Focus on facts, figures, and most important concepts that appear in competitive exams (RSMSSB/RPSC). 
    2. Use Markdown for formatting (bold, bullet points, tables).
    3. Create 5 multiple-choice questions (MCQs) in Hindi based on the most important points of this topic.
    
    Output format:
    {
      "notes": "Markdown string containing revision notes in Hindi",
      "questions": [
        {
          "text": "Question text in Hindi",
          "options": ["A", "B", "C", "D"],
          "correctAnswer": 0,
          "explanation": "Brief explanation in Hindi"
        }
      ]
    }
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json"
      }
    });
    
    const data = JSON.parse(response.text || "{}");

    return {
      topicId,
      notes: data.notes || "सामग्री तैयार नहीं की जा सकी।",
      questions: (data.questions || []).map((q: any, i: number) => ({
        ...q,
        id: `${topicId}-q-${i}`
      }))
    };
  } catch (error) {
    console.error("Error generating study material:", error);
    throw error;
  }
};
