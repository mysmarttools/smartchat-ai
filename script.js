document.addEventListener("DOMContentLoaded", () => {

    const input = document.getElementById("userInput");
    const sendBtn = document.getElementById("sendBtn");
    const messages = document.getElementById("messages");
    const newChatBtn = document.getElementById("newChatBtn");
    const historyList = document.getElementById("historyList");

    // Current Chat
    let currentChat = [];

    loadHistory();

    sendBtn.addEventListener("click", sendMessage);

    input.addEventListener("keydown", function (e) {

        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }

    });

    // New Chat
    newChatBtn.addEventListener("click", () => {

        currentChat = [];

        messages.innerHTML = `
            <div class="message ai-message">
                <h2>👋 Welcome to SmartChat AI</h2>
                <p>Hello! Ask me anything.</p>
            </div>
        `;

        input.value = "";
        input.focus();

    });

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

                body: JSON.stringify({
                    message: text
                })

            });

            const data = await response.json();

            loading.remove();

            addMessage(data.answer, "ai");

            // Save Current Conversation
            currentChat.push({
                question: text,
                answer: data.answer
            });

            saveHistory();

        } catch (error) {

            loading.remove();

            addMessage("❌ Something went wrong.", "ai");

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

        messages.scrollTop = messages.scrollHeight;

        return div;

    }

    // Save Conversation
    function saveHistory() {

        if (currentChat.length === 0) return;

        let chats = JSON.parse(localStorage.getItem("chatHistory")) || [];

        // Remove old copy of current chat
        chats = chats.filter(chat => {
            return JSON.stringify(chat) !== JSON.stringify(currentChat);
        });

        chats.unshift([...currentChat]);

        chats = chats.slice(0, 10);

        localStorage.setItem("chatHistory", JSON.stringify(chats));

        loadHistory();

    }

    // Load Sidebar
    function loadHistory() {

        let chats = JSON.parse(localStorage.getItem("chatHistory")) || [];

        historyList.innerHTML = "";

        chats.forEach(chat => {

            const li = document.createElement("li");

            li.textContent = chat[0]?.question || "New Chat";

            li.addEventListener("click", () => {

                messages.innerHTML = "";

                currentChat = [...chat];

                currentChat.forEach(item => {

                    addMessage(item.question, "user");
                    addMessage(item.answer, "ai");

                });

            });

            historyList.appendChild(li);

        });

    }

});
