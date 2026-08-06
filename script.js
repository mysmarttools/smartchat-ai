document.addEventListener("DOMContentLoaded", () => {
    const chatForm = document.getElementById("chatForm");
    const input = document.getElementById("userInput");
    const messages = document.getElementById("messages");
    const chatArea = document.getElementById("chatArea");
    const sendBtn = document.getElementById("sendBtn");
    const newChatBtn = document.getElementById("newChatBtn"); // New Chat Button

    // ===========================
    // ➕ NEW CHAT / CLEAR BUTTON LOGIC
    // ===========================
    if (newChatBtn) {
        newChatBtn.addEventListener("click", () => {
            // 1. Messages container ko clear karke Welcome screen wapis layein
            messages.innerHTML = `
                <div class="message ai-message">
                    <h2>👋 Welcome to SmartChat AI</h2>
                    <p>Hello! Ask me anything.</p>
                </div>
            `;

            // 2. Input box empty karein aur focus dein
            if (input) {
                input.value = "";
                input.focus();
            }

            // 3. Scroll to top/reset
            if (chatArea) {
                chatArea.scrollTop = 0;
            }
        });
    }

    // Form Submit Event (Existing Logic)
    if (chatForm) {
        chatForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            
            const text = input.value.trim();
            if (!text) return;

            // User Message append
            const userDiv = document.createElement("div");
            userDiv.className = "message user-message";
            userDiv.innerHTML = `<p>${text}</p>`;
            messages.appendChild(userDiv);

            input.value = "";
            if (window.innerWidth <= 768) input.blur();

            if (chatArea) chatArea.scrollTop = chatArea.scrollHeight;

            // AI Loading Indicator
            const aiDiv = document.createElement("div");
            aiDiv.className = "message ai-message";
            aiDiv.innerHTML = `<p>🤖 Thinking...</p>`;
            messages.appendChild(aiDiv);
            if (chatArea) chatArea.scrollTop = chatArea.scrollHeight;

            if (sendBtn) sendBtn.disabled = true;

            try {
                const res = await fetch("/api/chat", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ message: text })
                });

                const data = await res.json();

                if (res.ok) {
                    aiDiv.innerHTML = `<p>${data.answer || "No response"}</p>`;
                } else {
                    aiDiv.innerHTML = `<p>⚠️ ${data.error || "API Error"}</p>`;
                }
            } catch (err) {
                aiDiv.innerHTML = `<p>❌ Connection Error: ${err.message}</p>`;
            } finally {
                if (sendBtn) sendBtn.disabled = false;
                if (chatArea) chatArea.scrollTop = chatArea.scrollHeight;
            }
        });
    }
});
