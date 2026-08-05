const input = document.getElementById("userInput");
const sendBtn = document.getElementById("sendBtn");
const messages = document.getElementById("messages");

// Send Button
sendBtn.addEventListener("click", sendMessage);

// Press Enter
input.addEventListener("keydown", function (e) {
    if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
});

function sendMessage() {

    const text = input.value.trim();

    if (text === "") return;

    // User Message
    addMessage(text, "user");

    input.value = "";

    // Fake AI Thinking
    setTimeout(() => {

        addMessage("🤖 Thinking...", "ai");

    }, 500);

}

// Add Message
function addMessage(text, type) {

    const message = document.createElement("div");

    message.classList.add("message");

    if (type === "user") {
        message.classList.add("user-message");
    } else {
        message.classList.add("ai-message");
    }

    message.innerHTML = `<p>${text}</p>`;

    messages.appendChild(message);

    messages.scrollTop = messages.scrollHeight;

}
