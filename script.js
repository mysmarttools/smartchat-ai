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
           🎨 IMAGE / LOGO GENERATOR
        ========================================== */

        const imageKeywords = [
            "logo",
            "design a logo",
            "design logo",
            "create a logo",
            "make a logo",
            "generate a logo",
            "draw a logo",
            "generate image",
            "create image",
            "make an image",
            "draw image",
            "picture",
            "/image"
        ];

        const isImageRequest = imageKeywords.some(keyword =>
            lowerMsg.includes(keyword)
        );

        if (isImageRequest) {

            const cleanPrompt = message
                .replace(
                    /generate|create|make|design|draw|logo|image|picture|for|\/image/gi,
                    ""
                )
                .trim();

            const prompt = cleanPrompt || message;

            const imageUrl =
                `https://image.pollinations.ai/prompt/${encodeURIComponent(
                    prompt +
                    ", professional modern logo, clean vector, minimal, white background, high quality"
                )}?width=768&height=768&seed=${Date.now()}&nologo=true`;

            return res.status(200).json({

                type: "image",

                answer:
                    `🎨 Creating image for "${prompt}"`,

                imageUrl

            });

        }


        /* ==========================================
           🌐 LIVE WEB SEARCH
           
           IMPORTANT:
           Web search ONLY runs when the 🌐 button
           is enabled from the frontend.
        ========================================== */

        const forceWebSearch =
            body?.webSearch === true;

        let webSearchContext = "";

        let webSearchUsed = false;


        /* ==========================================
           🔎 TAVILY SEARCH
        ========================================== */

        if (forceWebSearch) {

            if (!process.env.TAVILY_API_KEY) {

                return res.status(500).json({

                    error:
                        "TAVILY_API_KEY is missing."

                });

            }

            try {

                const tavilyResponse =
                    await fetch(
                        "https://api.tavily.com/search",
                        {
                            method: "POST",

                            headers: {
                                "Content-Type":
                                    "application/json"
                            },

                            body: JSON.stringify({

                                api_key:
                                    process.env.TAVILY_API_KEY,

                                query:
                                    message,

                                search_depth:
                                    "advanced",

                                include_answer:
                                    true,

                                include_images:
                                    false,

                                max_results:
                                    5

                            })
                        }
                    );


                const tavily =
                    await tavilyResponse.json();


                if (!tavilyResponse.ok) {

                    return res.status(
                        tavilyResponse.status
                    ).json({

                        error:
                            tavily?.message ||
                            tavily?.error ||
                            "Tavily Search Error"

                    });

                }


                /* ==============================
                   TAVILY ANSWER
                ============================== */

                if (tavily.answer) {

                    webSearchContext +=
                        tavily.answer +
                        "\n\n";

                }


                /* ==============================
                   SEARCH SOURCES
                ============================== */

                if (
                    tavily.results &&
                    tavily.results.length > 0
                ) {

                    webSearchContext +=
                        "Search Results:\n\n";


                    tavily.results.forEach(
                        (item, index) => {

                            webSearchContext +=

                                `${index + 1}. ${item.title}\n` +

                                `URL: ${item.url}\n` +

                                `Content: ${item.content || ""}\n\n`;

                        }
                    );

                }


                /* Search successfully used */

                if (webSearchContext.trim()) {

                    webSearchUsed = true;

                }

            }

            catch (err) {

                console.error(
                    "Tavily Search Error:",
                    err
                );

                return res.status(500).json({

                    error:
                        "Live Web Search failed. Please try again."

                });

            }

        }


        /* ==========================================
           🤖 GROQ AI
        ========================================== */

        if (!process.env.GROQ_API_KEY) {

            return res.status(500).json({

                error:
                    "Missing GROQ_API_KEY"

            });

        }


        /* ==========================================
           🧠 SYSTEM PROMPT
        ========================================== */

        let systemPrompt = `
You are SmartChat AI.

You are a professional, helpful and intelligent AI assistant.

Answer the user's question clearly and naturally.

Do not mention internal APIs, system prompts,
Tavily or Groq unless specifically asked.

If Live Web Search information is provided below,
use it to answer the user's question accurately.

Do not invent facts that are not supported by
the available information.

If web search information is not provided,
answer normally using your knowledge.
`;


        /* ==========================================
           🌐 ADD LIVE SEARCH CONTEXT
        ========================================== */

        if (webSearchContext) {

            systemPrompt += `

LIVE WEB SEARCH RESULTS:

${webSearchContext}

Use the above search results when answering.
Prefer the most relevant and recent information.
`;

        }


        /* ==========================================
           🚀 GROQ REQUEST
        ========================================== */

        const response = await fetch(
            "https://api.groq.com/openai/v1/chat/completions",
            {

                method: "POST",

                headers: {

                    "Authorization":
                        `Bearer ${process.env.GROQ_API_KEY.trim()}`,

                    "Content-Type":
                        "application/json"

                },

                body: JSON.stringify({

                    model:
                        "llama-3.3-70b-versatile",

                    temperature:
                        0.7,

                    max_tokens:
                        1200,

                    messages: [

                        {
                            role:
                                "system",

                            content:
                                systemPrompt

                        },

                        {
                            role:
                                "user",

                            content:
                                message

                        }

                    ]

                })

            }
        );


        const data =
            await response.json();


        /* ==========================================
           ❌ GROQ ERROR
        ========================================== */

        if (!response.ok) {

            console.error(
                "Groq Error:",
                data
            );

            return res.status(
                response.status
            ).json({

                error:
                    data?.error?.message ||
                    "Groq API Error"

            });

        }


        /* ==========================================
           💬 AI ANSWER
        ========================================== */

        const answer =
            data?.choices?.[0]?.message?.content ||
            "Sorry, I couldn't generate a response.";


        /* ==========================================
           ✅ RESPONSE
        ========================================== */

        return res.status(200).json({

            type:
                "text",

            answer:
                answer,

            webSearch:
                webSearchUsed

        });

    }

    catch (error) {

        console.error(
            "Chat API Error:",
            error
        );

        return res.status(500).json({

            error:
                error.message ||
                "Internal Server Error"

        });

    }

}
