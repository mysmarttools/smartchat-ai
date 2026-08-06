export default async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method not allowed" });
    }

    try {
        let body = req.body;
        if (typeof body === "string") {
            try { body = JSON.parse(body); } catch (e) {}
        }

        const message = body?.message;
        if (!message || typeof message !== "string" || !message.trim()) {
            return res.status(400).json({ error: "Message is required." });
        }

        const lowerMsg = message.toLowerCase();

        // 🎨 1. Check if user is asking for Logo or Image Generation
        const isImageRequest = 
            lowerMsg.includes("logo") || 
            lowerMsg.includes("design") || 
            lowerMsg.includes("generate image") || 
            lowerMsg.includes("draw") || 
            lowerMsg.includes("create an image") ||
            lowerMsg.startsWith("/image");

        if (isImageRequest) {
            // Clean up prompt for image generation
            const cleanPrompt = message
                .replace(/generate|create|design|draw|a logo for|a logo|image of|picture of|\/image/gi, "")
                .trim();

            const finalPrompt = cleanPrompt || message;
            
            // Pollinations Free Image Engine URL
            const encodedPrompt = encodeURIComponent(`${finalPrompt}, clean vector logo design, professional, high resolution, 8k, graphic design`);
            const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=512&height=512&nologo=true&seed=${Math.floor(Math.random() * 1000000)}`;

            return res.status(200).json({
                type: "image",
                answer: `Here is your requested logo design for: **"${finalPrompt}"**`,
                imageUrl: imageUrl
            });
        }

        // 🌐 2. WEB SEARCH CHECK
        // Agar user latest information, news ya search ke baare me pooche
        const searchKeywords = ["search", "latest", "news", "today", "current", "weather", "price", "who is", "what is", "score", "update"];
        const isSearchReq = searchKeywords.some(kw => lowerMsg.includes(kw));

        let webSearchContext = "";

        if (isSearchReq) {
            try {
                // Free DuckDuckGo Instant Answer Search API
                const searchResponse = await fetch(
                    `https://api.duckduckgo.com/?q=${encodeURIComponent(message)}&format=json&no_html=1&skip_disambig=1`
                );
                const searchData = await searchResponse.json();

                if (searchData.AbstractText) {
                    webSearchContext = `[Web Search Snippet]: ${searchData.AbstractText}`;
                } else if (searchData.RelatedTopics && searchData.RelatedTopics.length > 0) {
                    const snippets = searchData.RelatedTopics
                        .slice(0, 3)
                        .map(item => item.Text)
                        .filter(Boolean)
                        .join("\n");
                    if (snippets) {
                        webSearchContext = `[Web Search Context]:\n${snippets}`;
                    }
                }
            } catch (err) {
                console.log("Web search fetch failed, continuing with direct AI response:", err.message);
            }
        }

        // 💬 3. Regular Chat Response using Groq
        if (!process.env.GROQ_API_KEY) {
            return res.status(500).json({ error: "GROQ_API_KEY is missing." });
        }

        // System prompt definition with Web Search awareness
        let systemPrompt = "You are SmartChat AI, a helpful and smart AI assistant.";
        if (webSearchContext) {
            systemPrompt += ` Use the following live web search context to give an accurate, updated answer if relevant:\n${webSearchContext}`;
        }

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
                        { role: "system", content: systemPrompt },
                        { role: "user", content: message.trim() }
                    ],
                    max_tokens: 1024
                })
            }
        );

        const data = await response.json();

        if (!response.ok) {
            return res.status(response.status).json({ error: data.error?.message || "Groq Error" });
        }

        return res.status(200).json({
            type: "text",
            answer: data.choices?.[0]?.message?.content || "No answer"
        });

    } catch (error) {
        return res.status(500).json({ error: error.message || "Server Error" });
    }
}
