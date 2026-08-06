export default async function handler(req, res) {

    if (req.method !== "POST") {
        return res.status(405).json({
            error: "Method not allowed"
        });
    }

    try {

        const { message } = req.body;

        if (!message) {
            return res.status(400).json({
                error: "Message required"
            });
        }

        const response = await fetch(
            "https://api.groq.com/openai/v1/chat/completions",
            {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
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
                            content: message
                        }
                    ]

                })
            }
        );


        const data = await response.json();

if (!response.ok) {
    return res.status(response.status).json({
        error: data.error?.message || "API Error"
    });
}

res.status(200).json({
    answer: data.choices?.[0]?.message?.content || "No response"
});


    } catch(error){

        res.status(500).json({

            error: error.message

        });

    }

}
