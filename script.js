// Global scope function for New Chat / Clear Chat
function clearChat() {
    const messages = document.getElementById("messages");
    const input = document.getElementById("userInput");

    if (messages) {
        // Chat area ko completely clear karke default welcome message reset karein
        messages.replaceChildren(); // Modern & safest way to clear DOM nodes

        const defaultWelcome = document.createElement("div");
        defaultWelcome.className = "message ai-message";
        defaultWelcome.innerHTML = `
            <h2>👋 Welcome to SmartChat AI</h2>
            <p>Hello! Ask me anything.</p>
        `;
        messages.appendChild(defaultWelcome);
    }

    if (input) {
        input.value = "";
        input.focus();
    }
}

// App execution
document.addEventListener("DOMContentLoaded", () => {
    const input = document.getElementById("userInput");
    const sendBtn = document.getElementById("sendBtn");
    const newChatBtn = document.getElementById("newChatBtn");

    // Event Listeners
    if (newChatBtn) {
        newChatBtn.onclick = clearChat;
    }

    if (sendBtn) {
        sendBtn.addEventListener("click", sendMessage);
    }

    if (input) {
        input.addEventListener("keydown", function(e){
            if(e.key === "Enter" && !e.shiftKey){
                e.preventDefault();
                sendMessage();
            }
        });
    }

    async function sendMessage(){
        const text = input.value.trim();
        if(text === "") return;

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

        } catch(error) {
            loading.remove();
            addMessage(
                "❌ Something went wrong. Please try again.",
                "ai"
            );
            console.log(error);
        }
    }

    function addMessage(text, type){
        const messages = document.getElementById("messages");
        if(!messages) return;

        const div = document.createElement("div");
        div.classList.add("message");

        if(type === "user"){
            div.classList.add("user-message");
        } else {
            div.classList.add("ai-message");
        }

        div.innerHTML = `<p>${text}</p>`;
        messages.appendChild(div);
        messages.scrollTop = messages.scrollHeight;

        return div;
    }
});
