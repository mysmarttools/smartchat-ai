document.addEventListener("DOMContentLoaded", () => {

    const chatForm = document.getElementById("chatForm");
    const input = document.getElementById("userInput");
    const messages = document.getElementById("messages");
    const chatArea = document.getElementById("chatArea");

    const sendBtn = document.getElementById("sendBtn");
    const voiceBtn = document.getElementById("voiceBtn");

    // IMPORTANT: HTML button ID should be webSearchBtn
    const webSearchBtn = document.getElementById("webSearchBtn");

    const newChatBtn = document.getElementById("newChatBtn");
    const historyList = document.getElementById("historyList");

    let currentConversation = [];

    let allSessions =
        JSON.parse(localStorage.getItem("smartChatSessions")) || [];

    let forceWebSearch = false;


    // ==========================================
    // INITIAL LOAD
    // ==========================================

    renderHistoryUI();


    // ==========================================
    // 🌐 LIVE WEB SEARCH BUTTON
    // ==========================================

    if (webSearchBtn) {

        webSearchBtn.addEventListener("click", () => {

            forceWebSearch = !forceWebSearch;

            if (forceWebSearch) {

                webSearchBtn.classList.add("active");

                webSearchBtn.innerHTML = "🌐 ON";

                webSearchBtn.title =
                    "Live Web Search is ON";

            } else {

                webSearchBtn.classList.remove("active");

                webSearchBtn.innerHTML = "🌐";

                webSearchBtn.title =
                    "Live Web Search is OFF";

            }

        });

    }


    // ==========================================
    // 🎤 VOICE INPUT
    // ==========================================

    if (voiceBtn) {

        const SpeechRecognition =
            window.SpeechRecognition ||
            window.webkitSpeechRecognition;

        if (SpeechRecognition) {

            const recognition =
                new SpeechRecognition();

            recognition.lang = "en-US";

            recognition.interimResults = false;

            recognition.continuous = false;


            voiceBtn.addEventListener("click", () => {

                try {

                    recognition.start();

                    voiceBtn.innerHTML = "🎙️";

                    voiceBtn.classList.add("active");

                } catch (error) {

                    console.log(
                        "Voice already running."
                    );

                }

            });


            recognition.onresult = (event) => {

                const transcript =
                    event.results[0][0].transcript;

                input.value = transcript;

                input.focus();

            };


            recognition.onend = () => {

                voiceBtn.innerHTML = "🎤";

                voiceBtn.classList.remove("active");

            };


            recognition.onerror = (event) => {

                console.log(
                    "Voice Error:",
                    event.error
                );

                voiceBtn.innerHTML = "🎤";

                voiceBtn.classList.remove("active");

            };

        } else {

            voiceBtn.style.display = "none";

        }

    }


    // ==========================================
    // ➕ NEW CHAT
    // ==========================================

    if (newChatBtn) {

        newChatBtn.addEventListener("click", () => {

            currentConversation = [];

            messages.innerHTML = `
                <div class="message ai-message">

                    <h2>👋 Welcome to SmartChat AI</h2>

                    <p>
                        Hello! Ask me anything.
                    </p>

                </div>
            `;

            input.value = "";

            forceWebSearch = false;

            if (webSearchBtn) {

                webSearchBtn.classList.remove("active");

                webSearchBtn.innerHTML = "🌐";

                webSearchBtn.title =
                    "Live Web Search is OFF";

            }

            input.focus();

            if (chatArea) {

                chatArea.scrollTop = 0;

            }

        });

    }


    // ==========================================
    // 📩 SEND MESSAGE
    // ==========================================

    if (chatForm) {

        chatForm.addEventListener(
            "submit",
            async (event) => {

                event.preventDefault();

                const text =
                    input.value.trim();

                if (!text) return;


                // User message
                addMessage(
                    text,
                    "user"
                );


                input.value = "";


                // Thinking message
                const aiDiv =
                    addMessage(
                        "🤖 Thinking...",
                        "ai"
                    );


                if (sendBtn) {

                    sendBtn.disabled = true;

                }


                try {

                    const response =
                        await fetch(
                            "/api/chat",
                            {
                                method: "POST",

                                headers: {
                                    "Content-Type":
                                        "application/json"
                                },

                                body: JSON.stringify({

                                    message: text,

                                    webSearch:
                                        forceWebSearch

                                })

                            }
                        );


                    const data =
                        await response.json();


                    // Reset web search after request
                    forceWebSearch = false;


                    if (webSearchBtn) {

                        webSearchBtn.classList.remove(
                            "active"
                        );

                        webSearchBtn.innerHTML =
                            "🌐";

                        webSearchBtn.title =
                            "Live Web Search is OFF";

                    }


                    if (!response.ok) {

                        aiDiv.innerHTML = `
                            <p>
                                ⚠️ ${
                                    data.error ||
                                    "Something went wrong."
                                }
                            </p>
                        `;

                        return;

                    }


                    // ==========================================
                    // IMAGE RESPONSE
                    // ==========================================

                    if (data.type === "image") {

                        showImageResponse(
                            aiDiv,
                            data,
                            text
                        );

                    }

                    // ==========================================
                    // TEXT RESPONSE
                    // ==========================================

                    else {

                        showTextResponse(
                            aiDiv,
                            data
                        );

                    }


                    // Save conversation
                    currentConversation.push({

                        question: text,

                        answer:
                            data.answer || ""

                    });


                    saveToRecentChats();

                }

                catch (error) {

                    console.error(error);

                    aiDiv.innerHTML = `
                        <p>
                            ❌ Connection Error.
                            Please try again.
                        </p>
                    `;

                }

                finally {

                    if (sendBtn) {

                        sendBtn.disabled = false;

                    }

                    if (chatArea) {

                        chatArea.scrollTop =
                            chatArea.scrollHeight;

                    }

                }

            }
        );

    }


    // ==========================================
    // MESSAGE FUNCTION
    // ==========================================

    function addMessage(text, type) {

        const div =
            document.createElement("div");

        div.className =
            `message ${
                type === "user"
                    ? "user-message"
                    : "ai-message"
            }`;


        const paragraph =
            document.createElement("p");

        paragraph.textContent = text;


        div.appendChild(paragraph);

        messages.appendChild(div);


        if (chatArea) {

            chatArea.scrollTop =
                chatArea.scrollHeight;

        }


        return div;

    }


                              // ==========================================
    // 🖼️ IMAGE RESPONSE
    // ==========================================

    function showImageResponse(aiDiv, data, originalPrompt) {

        aiDiv.innerHTML = `
            <p>${escapeHTML(data.answer || "🎨 Image generated")}</p>

            <img
                src="${escapeHTML(data.imageUrl || "")}"
                class="ai-image"
                alt="AI Generated Image"
                loading="lazy"
            >

            <div class="message-actions">

                <button class="copy-btn">
                    📋 Copy Prompt
                </button>

                <a
                    href="${escapeHTML(data.imageUrl || "")}"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="copy-btn"
                >
                    🔗 Open Image
                </a>

            </div>
        `;


        const copyBtn =
            aiDiv.querySelector(".copy-btn");

        if (copyBtn) {

            copyBtn.addEventListener(
                "click",
                async () => {

                    try {

                        await navigator.clipboard.writeText(
                            originalPrompt
                        );

                        copyBtn.textContent =
                            "✅ Copied!";

                        setTimeout(() => {

                            copyBtn.textContent =
                                "📋 Copy Prompt";

                        }, 1500);

                    } catch (error) {

                        console.log(
                            "Copy failed:",
                            error
                        );

                    }

                }
            );

        }

    }


    // ==========================================
    // 💬 TEXT RESPONSE
    // ==========================================

    function showTextResponse(aiDiv, data) {

        let answer =
            data.answer ||
            "Sorry, I couldn't generate a response.";


        let badge = "";


        // 🌐 Web Search Badge
        if (data.webSearch === true) {

            badge = `
                <div class="web-badge">
                    🌐 Live Web Search
                </div>
            `;

        }


        aiDiv.innerHTML = `

            ${badge}

            <p>${formatAnswer(answer)}</p>

            <button class="copy-btn">
                📋 Copy
            </button>

        `;


        const copyBtn =
            aiDiv.querySelector(".copy-btn");


        if (copyBtn) {

            copyBtn.addEventListener(
                "click",
                async () => {

                    try {

                        await navigator.clipboard.writeText(
                            answer
                        );

                        copyBtn.textContent =
                            "✅ Copied!";

                        setTimeout(() => {

                            copyBtn.textContent =
                                "📋 Copy";

                        }, 1500);

                    } catch (error) {

                        console.log(
                            "Copy failed:",
                            error
                        );

                    }

                }
            );

        }

    }


    // ==========================================
    // ✨ FORMAT AI ANSWER
    // ==========================================

    function formatAnswer(text) {

        if (!text) return "";


        return escapeHTML(text)
            .replace(
                /\*\*(.*?)\*\*/g,
                "<strong>$1</strong>"
            )
            .replace(
                /\n/g,
                "<br>"
            );

    }


    // ==========================================
    // 🔐 BASIC HTML ESCAPE
    // ==========================================

    function escapeHTML(value) {

        return String(value)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");

    }


    // ==========================================
    // 💾 SAVE RECENT CHAT
    // ==========================================

    function saveToRecentChats() {

        if (
            currentConversation.length === 0
        ) {

            return;

        }


        /*
         * Agar current conversation pehle se
         * saved hai to usko update karein.
         */

        const firstQuestion =
            currentConversation[0].question;


        const existingIndex =
            allSessions.findIndex(
                session =>
                    session &&
                    session.length &&
                    session[0].question ===
                        firstQuestion
            );


        if (existingIndex !== -1) {

            allSessions[existingIndex] =
                [...currentConversation];

        } else {

            allSessions.unshift(
                [...currentConversation]
            );

        }


        // Maximum 15 recent chats
        allSessions =
            allSessions.slice(0, 15);


        localStorage.setItem(
            "smartChatSessions",
            JSON.stringify(allSessions)
        );


        renderHistoryUI();

    }


    // ==========================================
    // 📜 RENDER CHAT HISTORY
    // ==========================================

    function renderHistoryUI() {

        if (!historyList) {

            return;

        }


        historyList.innerHTML = "";


        if (
            allSessions.length === 0
        ) {

            const emptyItem =
                document.createElement("li");

            emptyItem.textContent =
                "No recent chats";

            emptyItem.style.opacity =
                "0.6";

            historyList.appendChild(
                emptyItem
            );

            return;

        }


        allSessions.forEach(
            (session) => {

                if (
                    !session ||
                    session.length === 0
                ) {

                    return;

                }


                const li =
                    document.createElement("li");


                li.textContent =
                    session[0].question;


                li.title =
                    session[0].question;


                li.addEventListener(
                    "click",
                    () => {

                        messages.innerHTML = "";

                        currentConversation =
                            [...session];


                        session.forEach(
                            chat => {

                                addMessage(
                                    chat.question,
                                    "user"
                                );


                                addMessage(
                                    chat.answer,
                                    "ai"
                                );

                            }
                        );


                        if (chatArea) {

                            chatArea.scrollTop =
                                chatArea.scrollHeight;

                        }

                    }
                );


                historyList.appendChild(li);

            }
        );

    }


    // ==========================================
    // ⌨️ ENTER TO SEND
    // ==========================================

    if (input) {

        input.addEventListener(
            "keydown",
            (event) => {

                if (
                    event.key === "Enter" &&
                    !event.shiftKey
                ) {

                    event.preventDefault();


                    if (chatForm) {

                        chatForm.requestSubmit();

                    }

                }

            }
        );

    }


    // ==========================================
    // 🔄 AUTO SCROLL
    // ==========================================

    if (chatArea) {

        chatArea.scrollTop =
            chatArea.scrollHeight;

    }

});
