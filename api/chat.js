export default async function handler(req, res) {

    if (req.method !== "POST") {
        return res.status(405).json({
            error: "Method not allowed"
        });
    }

    // Yahan user ka message receive hoga

    // Yahan Groq API call hogi

    // AI ka response website ko return hoga

}
