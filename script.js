document.addEventListener("DOMContentLoaded", () => {
    const chatForm = document.getElementById("chatForm");
    const input = document.getElementById("userInput");
    const messages = document.getElementById("messages");
    const chatArea = document.getElementById("chatArea");
    const sendBtn = document.getElementById("sendBtn");
    const newChatBtn = document.getElementById("newChatBtn");
    const historyList = document.getElementById("historyList");

    let currentChat = [];

    // Local Storage se Recent Chats load karna
    loadHistory();

    // ===========================
    // ➕ NEW CHAT / CLEAR LOGIC
    // ===========================
    if (newChatBtn) {
        newChatBtn.addEventListener("click", () => {
            currentChat = []; // Reset current active chat
            messages.innerHTML = `
                <div class="message ai-message">
                    <h2>👋 Welcome to SmartChat AI</h2>
                    <p>Hello! Ask me anything.</p>
                </div>
            `;
            if (input) {
                input.value = "";
                input.focus();
            }
            if (chatArea) chatArea.scrollTop = 0;
        });
    }

    // ===========================
    // 📩 FORM SUBMIT & API LOGIC
    // ===========================
    if (chatForm) {
        chatForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            
            const text = input.value.trim();
            if (!text) return;

            // 1. User Message Display
            addMessage(text, "user");
            input.value = "";
            if (window.innerWidth <= 768) input.blur();

            // 2. AI Thinking Indicator
            const aiDiv = addMessage("🤖 Thinking...", "ai");
            if (sendBtn) sendBtn.disabled = true;

            try {
                const res = await fetch("/api/chat", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ message: text })
                });

                const data = await res.json();

                if (res.ok) {
                    const answer = data.answer || "No response";
                    aiDiv.querySelector("p").textContent = answer;

                    // History mein Save karein
                    currentChat.push({ question: text, answer: answer });
                    saveHistory();
                } else {
                    aiDiv.querySelector("p").textContent = "⚠️ " + (data.error || "API Error");
                }
            } catch (err) {
                aiDiv.querySelector("p").textContent = "❌ Connection Error: " + err.message;
            } finally {
                if (sendBtn) sendBtn.disabled = false;
                if (chatArea) chatArea.scrollTop = chatArea.scrollHeight;
            }
        });
    }

    // Helper: Screen par message append karna
    function addMessage(text, type) {
        const div = document.createElement("div");
        div.className = `message ${type === "user" ? "user-message" : "ai-message"}`;
        div.innerHTML = `<p>${text}</p>`;
        messages.appendChild(div);
        if (chatArea) chatArea.scrollTop = chatArea.scrollHeight;
        return div;
    }

    // ===========================
    // 📜 HISTORY & LOCALSTORAGE
    // ===========================
    function saveHistory() {
        if (currentChat.length === 0) return;
        let chats = JSON.parse(localStorage.getItem("smartChatHistory")) || [];
        
        // Agar new session start hua hai to top par insert karein
        const existingIndex = chats.findIndex(c => JSON.stringify(c) === JSON.stringify(currentChat.slice(0, -1)));
        if (existingIndex !== -1) {
            chats[existingIndex] = [...currentChat];
        } else {
            chats.unshift([...currentChat]);
        }

        // Maximum 10 chats save karein
        chats = chats.slice(0, 10);
        localStorage.setItem("smartChatHistory", JSON.stringify(chats));
        loadHistory();
    }

    function loadHistory() {
        if (!historyList) return;
        let chats = JSON.parse(localStorage.getItem("smartChatHistory")) || [];
        historyList.innerHTML = "";

        if (chats.length === 0) {
            historyList.innerHTML = `<li style="opacity:.6; font-size: 13px;">No recent chats</li>`;
            return;
        }

        chats.forEach((chat) => {
            const li = document.createElement("li");
            const firstQuestion = chat[0]?.question || "New Conversation";
            li.textContent = firstQuestion;

            // Chat reload karne par click event
            li.onclick = () => {
                messages.innerHTML = "";
                currentChat = [...chat];
                currentChat.forEach(item => {
                    addMessage(item.question, "user");
                    addMessage(item.answer, "ai");
                });
            };

            historyList.appendChild(li);
        });
    }
});
