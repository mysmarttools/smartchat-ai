document.addEventListener("DOMContentLoaded", () => {
    const chatForm = document.getElementById("chatForm");
    const input = document.getElementById("userInput");
    const messages = document.getElementById("messages");
    const chatArea = document.getElementById("chatArea");
    const sendBtn = document.getElementById("sendBtn");
    const newChatBtn = document.getElementById("newChatBtn");
    const historyList = document.getElementById("historyList");

    let currentConversation = [];
    let allSessions = JSON.parse(localStorage.getItem("smartChatSessions")) || [];

    // Page load par pehly se saved history show karein
    renderHistoryUI();

    // ===========================
    // ➕ NEW CHAT BUTTON
    // ===========================
    if (newChatBtn) {
        newChatBtn.addEventListener("click", () => {
            currentConversation = []; // Reset current active chat session
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
    // 📩 FORM SUBMIT LOGIC
    // ===========================
    if (chatForm) {
        chatForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            
            const text = input.value.trim();
            if (!text) return;

            // 1. User message show karein
            addMessageToDOM(text, "user");
            input.value = "";
            if (window.innerWidth <= 768) input.blur();

            // 2. AI Thinking indicator
            const aiDiv = addMessageToDOM("🤖 Thinking...", "ai");
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

                    // 3. Conversation memory update & LocalStorage Sync
                    currentConversation.push({ question: text, answer: answer });
                    saveToRecentChats();
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

    // Helper: Message DOM mein add aur scroll karna
    function addMessageToDOM(text, type) {
        const div = document.createElement("div");
        div.className = `message ${type === "user" ? "user-message" : "ai-message"}`;
        div.innerHTML = `<p>${text}</p>`;
        messages.appendChild(div);
        if (chatArea) chatArea.scrollTop = chatArea.scrollHeight;
        return div;
    }

    // ===========================
    // 📜 RECENT CHAT SAVING LOGIC
    // ===========================
    function saveToRecentChats() {
        if (currentConversation.length === 0) return;

        // Check karein ke active conversation pehly se list mein hai ya nayi hai
        let existingIndex = allSessions.findIndex(session => 
            session.length > 0 && session[0].question === currentConversation[0].question
        );

        if (existingIndex !== -1) {
            // Purani active conversation ko update karein
            allSessions[existingIndex] = [...currentConversation];
        } else {
            // Nayi chat top par add karein
            allSessions.unshift([...currentConversation]);
        }

        // Limit to last 15 chats
        allSessions = allSessions.slice(0, 15);

        localStorage.setItem("smartChatSessions", JSON.stringify(allSessions));
        renderHistoryUI();
    }

    function renderHistoryUI() {
        if (!historyList) return;
        historyList.innerHTML = "";

        if (allSessions.length === 0) {
            historyList.innerHTML = `<li style="opacity:.6; font-size: 13px;">No recent chats</li>`;
            return;
        }

        allSessions.forEach((session, index) => {
            if (!session || session.length === 0) return;

            const li = document.createElement("li");
            const firstQuestion = session[0].question;
            li.textContent = firstQuestion;

            // Click karne par purani chat load karna
            li.onclick = () => {
                messages.innerHTML = "";
                currentConversation = [...session];
                currentConversation.forEach(item => {
                    addMessageToDOM(item.question, "user");
                    addMessageToDOM(item.answer, "ai");
                });
            };

            historyList.appendChild(li);
        });
    }
});
