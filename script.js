document.addEventListener("DOMContentLoaded", () => {
    const input = document.getElementById("userInput");
    const sendBtn = document.getElementById("sendBtn");
    const messages = document.getElementById("messages");
    const newChatBtn = document.getElementById("newChatBtn");

    // Send Button Click
    if (sendBtn) {
        sendBtn.addEventListener("click", sendMessage);
    }

    // Enter Key Send (Shift+Enter for newline)
    if (input) {
        input.addEventListener("keydown", function(e) {
            if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
            }
        });
    }

    // ➕ New Chat Clear Logic
    if (newChatBtn) {
        newChatBtn.addEventListener("click", () => {
            messages.innerHTML = `
                <div class="message ai-message">
                    <h2>👋 Welcome to SmartChat AI</h2>
                    <p>Hello! Ask me anything.</p>
                </div>
            `;
            input.value = "";
            input.focus();
        });
    }

    async function sendMessage() {
        const text = input.value.trim();
        if (text === "") return;

        addMessage(text, "user");
        input.value = "";

        const loading = addMessage("🤖 Thinking...", "ai");

        try {
            const response = await fetch("/api/chat", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ message: text })
            });

            const data = await response.json();
            loading.remove();
            addMessage(data.answer, "ai");

        } catch (error) {
            loading.remove();
            addMessage(
                "❌ Something went wrong. Please try again.",
                "ai"
            );
            console.error(error);
        }
    }

    function addMessage(text, type) {
        const div = document.createElement("div");
        div.classList.add("message");

        if (type === "user") {
            div.classList.add("user-message");
        } else {
            div.classList.add("ai-message");
        }

        div.innerHTML = `<p>${text}</p>`;
        messages.appendChild(div);

        // Scroll smooth to bottom
        const chatArea = document.querySelector(".chat-area");
        chatArea.scrollTop = chatArea.scrollHeight;

        return div;
    }
});
