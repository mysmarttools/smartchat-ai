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

        // 🎨 Check if user is asking for Logo or Image Generation
        const isImageRequest = 
            lowerMsg.includes("logo") || 
            lowerMsg.includes("design") || 
            lowerMsg.includes("generate image") || 
            lowerMsg.includes("draw") || 
            lowerMsg.includes("create an image") ||
            lowerMsg.startsWith("/image");

        if (isImageRequest) {
            // Prompt Clean-up
            let cleanPrompt = message
                .replace(/generate|create|design|draw|a logo for|a logo|image of|picture of|\/image/gi, "")
                .trim();

            if (!cleanPrompt) cleanPrompt = message;

            // 💎 Ultra-Professional Graphic Design Prompt Architecture
            const highEndPrompt = `Professional corporate vector logo for ${cleanPrompt}, minimal geometric logo mark, premium brand identity, graphic design masterpiece, crisp sharp vector lines, isolated white background, flat design, Behance spotlight award winning logo design, 8k resolution`;

            const encodedPrompt = encodeURIComponent(highEndPrompt);
            const randomSeed = Math.floor(Math.random() * 9999999);

            // 🚀 Flux Model Integration (High Definition & Text Precision)
            const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1024&height=1024&nologo=true&seed=${randomSeed}&model=flux&enhance=true`;

            return res.status(200).json({
                type: "image",
                answer: `Here is your high-end professional logo design for: **"${cleanPrompt}"**`,
                imageUrl: imageUrl
            });
        }

        // 💬 Regular Groq Chat AI
        if (!process.env.GROQ_API_KEY) {
            return res.status(500).json({ error: "GROQ_API_KEY is missing." });
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
                        { role: "system", content: "You are a helpful AI assistant." },
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
