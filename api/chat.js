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

        const message = body?.message?.trim();

        if (!message) {
            return res.status(400).json({
                error: "Message is required."
            });
        }

        const lowerMsg = message.toLowerCase();

        /* ==========================================
           IMAGE / LOGO GENERATOR
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

        const isImageRequest = imageKeywords.some(keyword =>
            lowerMsg.includes(keyword)
        );

        if (isImageRequest) {

            const cleanPrompt = message
                .replace(
                    /generate|create|design|draw|logo|image|picture|for|\/image/gi,
                    ""
                )
                .trim();

            const prompt = cleanPrompt || message;

            const imageUrl =
                `https://image.pollinations.ai/prompt/${encodeURIComponent(
                    prompt +
                    ", professional modern logo, clean vector, minimal, white background, 8k, high quality"
                )}?width=768&height=768&seed=${Date.now()}&nologo=true`;

            return res.status(200).json({

                type: "image",

                answer: `🎨 Creating image for "${prompt}"`,

                imageUrl

            });

        }

        /* ==========================================
           LIVE WEB SEARCH
        ========================================== */

        const forceWebSearch =
            body?.webSearch === true;

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
            "find",
            "stock",
            "bitcoin",
            "gold",
            "football",
            "cricket"

        ];

        const isSearchReq =

            forceWebSearch ||

            searchKeywords.some(keyword =>
                lowerMsg.includes(keyword)
            );

        let webSearchContext = "";

        if (
            isSearchReq &&
            process.env.TAVILY_API_KEY
        ) {

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

                            include_answer: true,

                            include_images: false,

                            max_results: 5

                        })

                    }

                );

                const tavily =
                    await tavilyResponse.json();

                if (tavily.answer) {

                    webSearchContext +=
                        tavily.answer + "\n\n";

                }

                if (
                    tavily.results &&
                    tavily.results.length
                ) {

                    webSearchContext +=
                        "Sources:\n\n";

                    tavily.results.forEach(item => {

                        webSearchContext +=
                            `• ${item.title}\n${item.url}\n\n`;

                    });

                }

            } catch (err) {

                console.log(
                    "Tavily Error:",
                    err.message
                );

            }

        }

        /* ==========================================
           GROQ AI
        ========================================== */

        if (!process.env.GROQ_API_KEY) {

            return res.status(500).json({

                error: "Missing GROQ_API_KEY"

            });

        }

        let systemPrompt = `

You are SmartChat AI.

You are a professional AI assistant.

Answer clearly and accurately.

If Live Web Search context exists,
use that information in your answer.

If there are source links,
use them naturally.

Never say you cannot browse
the internet if search context exists.

`;


            if (webSearchContext) {

            systemPrompt += `

========================
LIVE WEB SEARCH
========================

${webSearchContext}

`;

        }

        const response = await fetch(

            "https://api.groq.com/openai/v1/chat/completions",

            {

                method: "POST",

                headers: {

                    Authorization: `Bearer ${process.env.GROQ_API_KEY.trim()}`,

                    "Content-Type": "application/json"

                },

                body: JSON.stringify({

                    model: "llama-3.3-70b-versatile",

                    temperature: 0.7,

                    max_tokens: 1200,

                    messages: [

                        {

                            role: "system",

                            content: systemPrompt

                        },

                        {

                            role: "user",

                            content: message

                        }

                    ]

                })

            }

        );

        const data = await response.json();

        if (!response.ok) {

            console.log(data);

            return res.status(response.status).json({

                error:

                    data?.error?.message ||

                    "Groq API Error"

            });

        }

        let answer =

            data?.choices?.[0]?.message?.content ||

            "Sorry, I couldn't generate a response.";

        
        

        return res.status(200).json({

            type: "text",

            answer: answer,

            webSearch: isSearchReq

        });

    }

    catch (error) {

        console.error(error);

        return res.status(500).json({

            error:

                error.message ||

                "Internal Server Error"

        });

    }

}
