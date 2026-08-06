 export default async function handler(req, res) {
    console.log("API HIT | Method:", req.method);

    // 1. Method Check
    if (req.method !== "POST") {
        return res.status(405).json({
            error: "Method not allowed"
        });
    }

    try {
        // Safe Body Parsing for Vercel/Node environment
        let body = req.body;
        if (typeof body === "string") {
            try {
                body = JSON.parse(body);
            } catch (e) {
                console.error("JSON Parsing Error:", e);
            }
        }

        console.log("PARSED BODY:", body);

        const message = body?.message;

        if (!message || typeof message !== "string" || !message.trim()) {
            return res.status(400).json({
                error: "Message is required and must be a non-empty string."
            });
        }

        // 2. Groq API Key Verification
        if (!process.env.GROQ_API_KEY) {
            console.error("CRITICAL ERROR: GROQ_API_KEY is not defined in Environment Variables.");
            return res.status(500).json({
                error: "Server configuration error: GROQ_API_KEY is missing."
            });
        }

        // 3. Groq Fetch Request
        const response = await fetch(
            "https://api.groq.com/openai/v1/chat/completions",
            {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${process.env.GROQ_API_KEY.trim()}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    model: "llama-3.3-70b-versatile",
                    messages: [
                        {
                            role: "system",
                            content: "You are a helpful AI assistant."
                        },
                        {
                            role: "user",
                            content: message.trim()
                        }
                    ],
                    max_tokens: 1024 // Mobile response delay se bachne ke liye limit
                })
            }
        );

        const data = await response.json();
        console.log("GROQ RESPONSE STATUS:", response.status);

        if (!response.ok) {
            console.error("GROQ API ERROR DETAILED:", data);
            return res.status(response.status).json({
                error: data.error?.message || "Groq API returned an error"
            });
        }

        const answer = data.choices?.[0]?.message?.content;

        if (!answer) {
            return res.status(500).json({
                error: "No answer string was returned from Groq."
            });
        }

        return res.status(200).json({
            answer: answer
        });

    } catch (error) {
        console.error("SERVER CRASH ERROR:", error);
        return res.status(500).json({
            error: error.message || "Internal Server Error"
        });
    }
}








<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
