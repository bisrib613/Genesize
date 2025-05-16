/**
 * Generate a Google Discover-friendly title replacement for a given original title.
 * Uses Gemini 2.0 via @google/genai npm package with models.generateContent.
 * 
 * @param {string} title - Original article title to be transformed.
 * @returns {Promise<string>} - HTML string containing the new title in <body><h1>.
 */

const { GoogleGenAI, HarmCategory, HarmBlockThreshold } = require("@google/genai");

const fs                = require('fs');
async function generateTitle(title) {
    const fileContents = fs.readFileSync('apikey_valid.txt', 'utf8');
          const lines = fileContents.split('\n');
          const key = lines[Math.floor(Math.random() * lines.length)];
  const client = new GoogleGenAI({apiKey: key});

  const prompt = `
Rewrite the following title into a Google Discover–friendly version.

Requirements:
- Max 70 characters.
- Use natural, engaging tone.
- No clickbait.
- Do NOT use a question format.
- Output only in this HTML format:

<body>
  
  <h1>{{non_question_style_title}}</h1>
</body>

Original Title: "${title}"

`;

  try {
    const response = await client.models.generateContent({
      model: "gemini-2.5-flash-preview-04-17",
      contents: prompt,
      temperature: 0.7,
      maxOutputTokens: 100,
    });
    titlebyai = response.text.trim();
    const text = titlebyai.match(/<h1>(.*?)<\/h1>/)?.[1]?.trim() || '';

    return text;
  } catch (error) {
    console.error("Error generating title:", error);
    throw error;
  }
}
async function generateContentjson(prompt, system = "false", retryCount = 0) {
  const maxRetries = 5;

  try {
    const fileContents = fs.readFileSync('apikey_valid.txt', 'utf8');
    const lines = fileContents.split('\n').filter(line => line.trim() !== '');
    const key = lines[Math.floor(Math.random() * lines.length)].trim();

    const client = new GoogleGenAI({ apiKey: key });

    let finalPrompt = prompt;

    if (system !== "false") {
      const sys = fs.readFileSync('systemg.txt', 'utf8');
      finalPrompt = sys + "\n\n" + prompt;
    }
    const config = {
      temperature: 0.7,
      topP: 0.9,
      
      responseMimeType: "application/json",
    };
    if (system !== "false") {
      const systemInstruction = fs.readFileSync('systemg.txt', 'utf8');
      config.systemInstruction = systemInstruction;
    }

    const response = await client.models.generateContent({
      model: "gemini-2.0-flash",
      contents: finalPrompt,
      
      config
      // safetySettings tidak selalu wajib, tergantung versi lib nya
    });

    const text = response.text.trim();

    // parse JSON dari response text
   try {
      const json = JSON.parse(text);
      if (Array.isArray(json) && json[0]) {
        return json[0];
      }

      if (typeof json === 'object' && json !== null) {
        return json;
      }

    } catch (parseError) {
      console.error("❌ JSON parsing error:", parseError.message);
      console.error("Raw model response:\n", text);
      throw parseError; // trigger retry from outer catch
    }

    // cek properti 'article'
    

    return json;

  } catch (error) {
    console.error("Error in generateContentjson:", error);
    if (retryCount < maxRetries) {
      console.log(`Retry generateContentjson attempt ${retryCount + 1}`);
      return generateContentjson(prompt, system, retryCount + 1);
    } else {
      throw new Error("Max retries reached. Failed to generate content.");
    }
  }
}
async function generateContenttxt(prompt, system = "false", retryCount = 0) {
  const maxRetries = 5;

  try {
    const fileContents = fs.readFileSync('apikey_valid.txt', 'utf8');
    const lines = fileContents.split('\n').filter(line => line.trim() !== '');
    const key = lines[Math.floor(Math.random() * lines.length)].trim();

    const client = new GoogleGenAI({ apiKey: key });

    let finalPrompt = prompt;

    if (system !== "false") {
      const sys = fs.readFileSync('systemg.txt', 'utf8');
      finalPrompt = sys + "\n\n" + prompt;
    }
    const config = {
      temperature: 0.7,
      topP: 0.9,
      
      
    };
    if (system !== "false") {
      const systemInstruction = fs.readFileSync('systemg.txt', 'utf8');
      config.systemInstruction = systemInstruction;
    }

    const response = await client.models.generateContent({
      model: "gemini-2.0-flash",
      contents: finalPrompt,
      
      config
      // safetySettings tidak selalu wajib, tergantung versi lib nya
    });

    const text = response.text.trim();

    // parse JSON dari response text
   

    // cek properti 'article'
    

    return text;

  } catch (error) {
    
    if (retryCount < maxRetries) {
      console.log(`Retry generateContentjson attempt ${retryCount + 1}`);
      return generateContentjson(prompt, system, retryCount + 1);
    } else {
      throw new Error("Max retries reached. Failed to generate content.");
    }
  }
}
module.exports = {generateTitle,generateContentjson,generateContenttxt};
