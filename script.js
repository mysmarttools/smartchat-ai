document.addEventListener("DOMContentLoaded", () => {

    const input = document.getElementById("userInput");
    const sendBtn = document.getElementById("sendBtn");
    const messages = document.getElementById("messages");
    const newChatBtn = document.getElementById("newChatBtn");
    const historyList = document.getElementById("historyList");
    const chatForm = document.getElementById("chatForm");

    let currentChat = [];
    let isSending = false;

    loadHistory();

    // Android & Mobile Form Submission Handler
    if (chatForm) {
        chatForm.addEventListener("submit", (e) => {
            e.preventDefault();
            sendMessage();
        });
    }

    // Enter Key Handler for Textarea (Desktop + Android)
    if (input) {
        input.addEventListener("keydown", (e) => {
            if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                if (chatForm) {
                    chatForm.requestSubmit(); // Triggers proper form submit
                } else {
                    sendMessage();
                }
            }
        });
    }

    // New Chat Button Event
    if (newChatBtn) {
        newChatBtn.addEventListener("click", function (e) {
            e.preventDefault();
            e.stopPropagation();

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

        if (sendBtn) {
            sendBtn.disabled = true;
        }

        addMessage(text, "user");
        input.value = "";

        // Blur input on mobile after send to collapse keyboard smoothly (Optional)
        if (window.innerWidth <= 768) {
            input.blur();
        }

        const loading = addMessage("🤖 Thinking...", "ai");

        try {
            const response = await fetch(
                window.location.origin + "/api/chat",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        message: text
                    })
                }
            );

            const data = await response.json();
            loading.remove();

            if (!response.ok) {
                addMessage(
                    "⚠️ " + (data.error || "API Error"),
                    "ai"
                );
                return;
            }

            const answer = data.answer || "No response received.";
            addMessage(answer, "ai");

            currentChat.push({
                question: text,
                answer: answer
            });

            saveHistory();

        } catch (error) {
            if (loading) loading.remove();

            addMessage(
                "❌ Connection error. Please try again.",
                "ai"
            );
            console.error(error);

        } finally {
            isSending = false;
            if (sendBtn) {
                sendBtn.disabled = false;
            }
        }
    }

    function addMessage(text, type) {
        const div = document.createElement("div");
        div.className = "message " + (type === "user" ? "user-message" : "ai-message");
        div.innerHTML = `<p>${text}</p>`;

        messages.appendChild(div);

        // Mobile Screen Dynamic Scroll Fix
        requestAnimationFrame(() => {
            const chatArea = document.querySelector(".chat-area");
            if (chatArea) {
                chatArea.scrollTop = chatArea.scrollHeight;
            }
        });

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
