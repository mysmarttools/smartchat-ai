document.addEventListener("DOMContentLoaded", () => {

    // Elements
    const input = document.getElementById("userInput");
    const sendBtn = document.getElementById("sendBtn");
    const messages = document.getElementById("messages");
    const newChatBtn = document.getElementById("newChatBtn");
    const historyList = document.getElementById("historyList");

    // Current Conversation
    let currentChat = [];

    // Load Previous History
    loadHistory();

    // Send Button Event (click works fine on mobile too, no touchend needed)
    if (sendBtn) {
        sendBtn.addEventListener("click", sendMessage);
    }

    // Input Keydown Event
    if (input) {
        input.addEventListener("keydown", (e) => {
            if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
            }
        });
    }

    // New Chat Button Event
    if (newChatBtn) {
        const handleNewChat = () => {
            currentChat = [];
            messages.innerHTML = `
                <div class="message ai-message">
                    <h2>👋 Welcome to SmartChat AI</h2>
                    <p>Hello! Ask me anything.</p>
                </div>
            `;
            input.value = "";
            input.focus();
        };

        newChatBtn.addEventListener("click", handleNewChat);
    }

    // Send Message
    async function sendMessage() {
        const text = input.value.trim();
        if (!text) return;

        addMessage(text, "user");
        input.value = "";

        // Hide keyboard on small screens after send
        if (window.innerWidth < 768) {
            input.blur();
        }

        const loading = addMessage("🤖 Thinking...", "ai");

        try {
            const response = await fetch("/api/chat", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    message: text
                })
            });

            const data = await response.json();
            loading.remove();

            const answer = data.answer || "No response.";
            addMessage(answer, "ai");

            currentChat.push({
                question: text,
                answer: answer
            });

            saveHistory();

        } catch (err) {
            loading.remove();
            addMessage("❌ Something went wrong.", "ai");
            console.error(err);
        }
    }

    // Add Message
    function addMessage(text, type) {
        const div = document.createElement("div");
        div.className = "message " + (type === "user" ? "user-message" : "ai-message");
        div.innerHTML = `<p>${text}</p>`;

        messages.appendChild(div);

        // Mobile-Safe Auto Scroll
        setTimeout(() => {
            const chatArea = document.querySelector(".chat-area");
            if (chatArea) {
                chatArea.scrollTop = chatArea.scrollHeight;
            }
        }, 50);

        return div;
    }

    // Save Current Conversation
    function saveHistory() {
        if (currentChat.length === 0) return;

        let chats = JSON.parse(localStorage.getItem("chatHistory")) || [];

        // Remove duplicate conversation
        chats = chats.filter(chat =>
            JSON.stringify(chat) !== JSON.stringify(currentChat)
        );

        // Add latest chat on top
        chats.unshift([...currentChat]);

        // Keep only last 10 chats
        chats = chats.slice(0, 10);

        localStorage.setItem("chatHistory", JSON.stringify(chats));
        loadHistory();
    }

    // Load Sidebar History
    function loadHistory() {
        if (!historyList) return;

        let chats = JSON.parse(localStorage.getItem("chatHistory")) || [];
        historyList.innerHTML = "";

        if (chats.length === 0) {
            historyList.innerHTML = `
                <li style="opacity:.6;cursor:default;">
                    No chats yet
                </li>
            `;
            return;
        }

        chats.forEach((chat, index) => {
            const li = document.createElement("li");
            li.textContent = chat[0]?.question || `Chat ${index + 1}`;

            const loadSelectedChat = () => {
                messages.innerHTML = "";
                currentChat = [...chat];

                currentChat.forEach(item => {
                    addMessage(item.question, "user");
                    addMessage(item.answer, "ai");
                });
            };

            li.addEventListener("click", loadSelectedChat);

            historyList.appendChild(li);
        });
    }
});
