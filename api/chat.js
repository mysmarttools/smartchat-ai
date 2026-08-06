export default async function handler(req, res) {

    if (req.method !== "POST") {
        return res.status(405).json({
            error: "Method not allowed"
        });
    }

    try {

        let body = req.body;

        if (typeof body === "string") {

            try {

                body = JSON.parse(body);

            } catch (e) {}

        }

        const message = body?.message;

        if (!message || !message.trim()) {

            return res.status(400).json({
                error: "Message is required."
            });

        }

        const lowerMsg = message.toLowerCase();

        /* ==========================================
           AI IMAGE / LOGO GENERATOR
        ========================================== */

        const imageKeywords = [
            "logo",
            "design",
            "draw",
            "image",
            "picture",
            "generate image",
            "create image",
            "create a logo",
            "design logo",
            "/image"
        ];

        const isImageRequest = imageKeywords.some(word =>
            lowerMsg.includes(word)
        );

        if (isImageRequest) {

            const cleanPrompt = message
                .replace(/generate|create|design|draw|logo|image|picture|for|\/image/gi, "")
                .trim();

            const prompt = cleanPrompt || message;

            const imageUrl =
                `https://image.pollinations.ai/prompt/${encodeURIComponent(
                    prompt +
                    ", professional modern logo, clean vector, minimal, white background, 8k"
                )}?seed=${Date.now()}&width=768&height=768&nologo=true`;

            return res.status(200).json({

                type: "image",

                answer: `🎨 Creating image for: ${prompt}`,

                imageUrl

            });

        }

        /* ==========================================
           LIVE WEB SEARCH (TAVILY)
        ========================================== */

        const searchKeywords = [

            "search",
            "latest",
            "today",
            "news",
            "current",
            "weather",
            "price",
            "score",
            "update",
            "who is",
            "what is",
            "find"

        ];

        const isSearchReq =
            searchKeywords.some(word =>
                lowerMsg.includes(word)
            );

        let webSearchContext = "";

        if (isSearchReq && process.env.TAVILY_API_KEY) {

            try {

                const tavilyResponse = await fetch(

                    "https://api.tavily.com/search",

                    {

                        method: "POST",

                        headers: {

                            "Content-Type": "application/json"

                        },

                        body: JSON.stringify({

                            api_key:
                                process.env.TAVILY_API_KEY,

                            query: message,

                            search_depth: "advanced",

                            max_results: 5,

                            include_answer: true,

                            include_images: false

                        })

                    }

                );

                const tavily =
                    await tavilyResponse.json();

                if (tavily.answer) {

                    webSearchContext +=
                        tavily.answer + "\n\n";

                }

                if (tavily.results) {

                    webSearchContext +=
                        "Sources:\n\n";

                    tavily.results.forEach(item => {

                        webSearchContext +=
                            `${item.title}\n${item.url}\n\n`;

                    });

                }

            } catch (err) {

                console.log(
                    "Tavily Search Error:",
                    err.message
                );

            }

        }

        /* ==========================================
           GROQ AI CHAT
        ========================================== */

        if (!process.env.GROQ_API_KEY) {

            return res.status(500).json({

                error: "Missing GROQ_API_KEY"

            });

        }

        let systemPrompt = `
You are SmartChat AI.

You are intelligent, helpful and friendly.

Always answer professionally.

If web search results are provided,
use them to answer accurately.

Never say you cannot browse the internet
if web search context exists.
`;

        if (webSearchContext) {

            systemPrompt += `

Live Web Search:

${webSearchContext}

`;

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

                        {
                            role: "system",
                            content: systemPrompt
                        },

                        {
                            role: "user",
                            content: message.trim()
                        }

                    ],

                    temperature: 0.7,

                    max_tokens: 1024

                })

            }
        );

        const data = await response.json();

        if (!response.ok) {

            return res.status(response.status).json({

                error:
                    data?.error?.message ||
                    "Groq API Error"

            });

        }

        let answer =
            data?.choices?.[0]?.message?.content ||
            "Sorry, I couldn't generate a response.";

        // Add Web Search Badge
        if (webSearchContext) {

            answer += `

────────────────────

🌐 Answer generated using Live Web Search.

`;

        }

        return res.status(200).json({

            type: "text",

            answer

        });

    } catch (error) {

        console.error(error);

        return res.status(500).json({

            error: error.message || "Internal Server Error"

        });

    }

}
