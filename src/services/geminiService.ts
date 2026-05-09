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

export const generateModelPaper = async (paperTitle: string, paperId: string): Promise<StudyMaterial> => {
  const prompt = `
    You are an expert for the Rajasthan Lab Assistant Exam. 
    Paper: "${paperTitle}".
    
    Task:
    1. Create a "Model Paper Summary" in Hindi. List 15-20 most important topics and facts that were actually asked or are likely to be asked in the ${paperTitle}.
    2. Format the response as a comprehensive revision guide.
    3. Include exactly 25 high-quality MCQs that represent the difficulty level of the ${paperTitle}. Ensure variety across Science (Bio/Phy/Chem) and GK/Rajasthan History/Geography.
    
    Output format:
    {
      "notes": "Markdown string (Hindi revision notes)",
      "questions": [
        {
          "text": "Question in Hindi",
          "options": ["A", "B", "C", "D"],
          "correctAnswer": 0,
          "explanation": "Brief explanation"
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
      topicId: paperId,
      notes: data.notes || "पेपर डेटा उपलब्ध नहीं है।",
      questions: (data.questions || []).map((q: any, i: number) => ({
        ...q,
        id: `${paperId}-q-${i}`
      }))
    };
  } catch (error) {
    console.error("Error generating model paper:", error);
    throw error;
  }
};

export const chatWithAI = async (message: string, history: any[] = [], imageBase64?: string): Promise<string> => {
  try {
    const chat = ai.chats.create({
      model: "gemini-3-flash-preview",
      config: {
        systemInstruction: "You are a specialized AI Study Assistant created by _rahul18x for Rajasthan Lab Assistant Exam aspirants. \n\nIMPORTANT RULES:\n1. If a user greets you (Hi, Hello, Namaste, or first message), ALWAYS start by saying: 'मैं _rahul18x का बनाया हुआ AI Assistant हूँ। बताओ आपको Lab Assistant Exam की तैयारी से रिलेटेड क्या बात करनी है?'\n2. Always respond in the EXACT same language or script the user uses (if they ask in Hindi, answer in Hindi; if in English, answer in English; if in Hinglish/Roman Hindi, answer in Hinglish).\n3. Provide concise, accurate information on Biology, Physics, Chemistry, and Rajasthan GK.\n4. If an image is provided, analyze the concept or question inside it.\n5. If asked to generate a paper, provide 5-10 high-quality MCQs in Markdown.",
      },
      history: history,
    });

    const parts: any[] = [{ text: message }];
    if (imageBase64) {
      parts.push({
        inlineData: {
          data: imageBase64,
          mimeType: "image/jpeg"
        }
      });
    }

    const response = await chat.sendMessage({
      message: parts
    });

    return response.text || "माफी चाहता हूँ, मैं अभी उत्तर नहीं दे पा रहा हूँ।";
  } catch (error) {
    console.error("AI Chat Error:", error);
    return "सर्वर त्रुटि। कृपया बाद में प्रयास करें।";
  }
};
