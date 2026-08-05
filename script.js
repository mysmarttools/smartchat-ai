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

    // Send Button Event (Click & Touch for Mobile)
    if (sendBtn) {
        sendBtn.addEventListener("click", sendMessage);
        sendBtn.addEventListener("touchend", (e) => {
            e.preventDefault(); // Mobile double tap issue fix
            sendMessage();
        });
    }

    // Mobile Keyboard Fix (Enter key press)
    if (input) {
        input.addEventListener("keydown", (e) => {
            if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
            }
        });
    }

    // New Chat Button (Desktop + Mobile Touch)
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
        newChatBtn.addEventListener("touchend", (e) => {
            e.preventDefault();
            handleNewChat();
        });
    }

    // Send Message Logic
    async function sendMessage() {
        const text = input.value.trim();
        if (!text) return;

        addMessage(text, "user");
        input.value = "";
        
        // Mobile keyboard blur (optional: keeps input smooth)
        if(window.innerWidth < 768){
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

    // Add Message Logic
    function addMessage(text, type) {
        const div = document.createElement("div");
        div.className = "message " + (type === "user" ? "user-message" : "ai-message");
        div.innerHTML = `<p>${text}</p>`;

        messages.appendChild(div);

        // Mobile Safe Auto Scroll
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

        chats = chats.filter(chat =>
            JSON.stringify(chat) !== JSON.stringify(currentChat)
        );

        chats.unshift([...currentChat]);
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
            li.addEventListener("touchend", (e) => {
                e.preventDefault();
                loadSelectedChat();
            });

            historyList.appendChild(li);
        });
    }
});
