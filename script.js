document.addEventListener("DOMContentLoaded", () => {

    const input = document.getElementById("userInput");
    const sendBtn = document.getElementById("sendBtn");
    const messages = document.getElementById("messages");
    const chatArea = document.getElementById("chatArea");
    const newChatBtn = document.getElementById("newChatBtn");
    const historyList = document.getElementById("historyList");
    const chatForm = document.getElementById("chatForm");

    let currentChat = [];
    let isSending = false;

    loadHistory();

    // Form Submit Event (Mobile + Desktop)
    if (chatForm) {
        chatForm.addEventListener("submit", (e) => {
            e.preventDefault();
            sendMessage();
        });
    }

    // New Chat Button
    if (newChatBtn) {
        newChatBtn.addEventListener("click", (e) => {
            e.preventDefault();
            currentChat = [];
            localStorage.removeItem("chatHistory");

            if (messages) {
                messages.innerHTML = `
                    <div class="message ai-message">
                        <h2>👋 Welcome to SmartChat AI</h2>
                        <p>Hello! Ask me anything.</p>
                    </div>
                `;
            }

            if (input) {
                input.value = "";
                input.blur();
            }

            loadHistory();
        });
    }

    async function sendMessage() {
        if (isSending) return;

        const text = input.value.trim();
        if (!text) return;

        isSending = true;
        if (sendBtn) sendBtn.disabled = true;

        // 1. Text instantly add karein
        addMessage(text, "user");
        input.value = "";

        // Mobile keyboard focus handling
        if (window.innerWidth <= 768) {
            input.blur();
        }

        // 2. Loading Indicator
        const loadingDiv = addMessage("🤖 Thinking...", "ai");

        try {
            const response = await fetch("/api/chat", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ message: text })
            });

            if (loadingDiv) loadingDiv.remove();

            const data = await response.json();

            if (!response.ok) {
                addMessage("⚠️ " + (data.error || "API Error"), "ai");
                return;
            }

            const answer = data.answer || "No response received.";
            addMessage(answer, "ai");

            currentChat.push({ question: text, answer: answer });
            saveHistory();

        } catch (error) {
            if (loadingDiv) loadingDiv.remove();
            addMessage("❌ Connection error. Please try again.", "ai");
            console.error("Chat Error:", error);
        } finally {
            isSending = false;
            if (sendBtn) sendBtn.disabled = false;
        }
    }

    function addMessage(text, type) {
        if (!messages) return null;

        const div = document.createElement("div");
        div.className = "message " + (type === "user" ? "user-message" : "ai-message");
        
        const p = document.createElement("p");
        p.textContent = text;
        div.appendChild(p);

        messages.appendChild(div);

        // Instant Scroll to Bottom
        setTimeout(() => {
            if (chatArea) {
                chatArea.scrollTop = chatArea.scrollHeight;
            }
        }, 50);

        return div;
    }

    function saveHistory() {
        if (currentChat.length === 0) return;
        let chats = JSON.parse(localStorage.getItem("chatHistory")) || [];
        chats.unshift([...currentChat]);
        chats = chats.slice(0, 10);
        localStorage.setItem("chatHistory", JSON.stringify(chats));
        loadHistory();
    }

    function loadHistory() {
        if (!historyList) return;
        let chats = JSON.parse(localStorage.getItem("chatHistory")) || [];
        historyList.innerHTML = "";

        if (chats.length === 0) {
            historyList.innerHTML = `<li style="opacity:.6">No chats yet</li>`;
            return;
        }

        chats.forEach((chat, index) => {
            const li = document.createElement("li");
            li.textContent = chat[0]?.question || `Chat ${index + 1}`;
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
