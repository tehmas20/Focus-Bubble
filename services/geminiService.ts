import { GoogleGenAI } from "@google/genai";
import { SessionData, Priority } from "../types";

// Initialize Gemini AI
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const analyzeGoal = async (rawGoal: string, history: SessionData[] = []): Promise<{ refined: string; priority: Priority }> => {
  try {
    const model = "gemini-2.5-flash";
    
    // Create a context string from recent history
    const recentHistory = history
      .slice(0, 5) // Last 5 sessions
      .map(s => `- [${s.priority || 'MEDIUM'}] "${s.goal}": ${s.completed ? 'COMPLETED' : 'FAILED'}`)
      .join('\n');

    const prompt = `
      Analyze this productivity goal: "${rawGoal}"
      
      User's Recent History:
      ${recentHistory}

      1. Rewrite the goal to be specific, actionable, and motivating (atomic habit style, under 10 words).
      2. Assign a priority level (HIGH, MEDIUM, LOW).
         - Logic: If they failed a similar task recently, mark HIGH (urgent). If it contains words like "deadline", "submit", "fix", mark HIGH. "Study", "Read" is usually MEDIUM. "Check", "Email" is LOW.

      Output purely JSON:
      {
        "refined": "The rewritten goal text",
        "priority": "HIGH" | "MEDIUM" | "LOW"
      }
    `;

    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      }
    });

    const text = response.text?.trim();
    if (!text) throw new Error("No response from AI");

    const result = JSON.parse(text);
    
    // Validate priority
    let priority = Priority.MEDIUM;
    if (result.priority === "HIGH") priority = Priority.HIGH;
    if (result.priority === "LOW") priority = Priority.LOW;

    return {
      refined: result.refined || rawGoal,
      priority
    };

  } catch (error) {
    console.error("Goal Analysis Error:", error);
    return { refined: rawGoal, priority: Priority.MEDIUM }; // Fallback
  }
};

export const generateInsight = async (
  currentSession: SessionData,
  history: SessionData[]
): Promise<string> => {
  try {
    const model = "gemini-2.5-flash";
    
    // Construct a prompt that includes context from previous sessions
    const historySummary = history.slice(-3).map(s => 
      `- Goal: "${s.goal}" [${s.priority || 'MEDIUM'}], Completed: ${s.completed}, Blockers: "${s.blockers || 'None'}"`
    ).join('\n');

    const prompt = `
      You are a master productivity coach (like James Clear or Greg McKeown). The user just finished a deep focus session.
      
      Session Data:
      - Goal: "${currentSession.goal}"
      - Priority: ${currentSession.priority || "MEDIUM"}
      - Duration: ${Math.floor(currentSession.durationSeconds / 60)} minutes
      - Outcome: ${currentSession.completed ? "SUCCESS" : "FAILED"}
      - User's Reflection on Blockers: "${currentSession.blockers || "None"}"

      Recent History:
      ${historySummary}

      Your Mission:
      Provide ONE "Tiny Insight" (max 25 words). 
      - If they failed: Identify the specific friction point and suggest a micro-adjustment. Be kind but sharp.
      - If they succeeded: Reinforce the specific habit loop or identity.
      - Tone: Minimalist, direct, warm.
      - No preamble. Just the insight.
    `;

    const response = await ai.models.generateContent({
      model,
      contents: prompt,
    });

    return response.text?.trim() || "Focus is a muscle. Good workout today.";

  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Focus is a muscle. Good workout today."; // Fallback
  }
};
