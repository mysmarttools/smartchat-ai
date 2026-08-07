document.addEventListener("DOMContentLoaded", () => {

    const chatForm =
        document.getElementById("chatForm");

    const input =
        document.getElementById("userInput");

    const messages =
        document.getElementById("messages");

    const chatArea =
        document.getElementById("chatArea");

    const sendBtn =
        document.getElementById("sendBtn");

    const voiceBtn =
        document.getElementById("voiceBtn");

    const webBtn =
        document.getElementById("webSearchBtn");

    const newChatBtn =
        document.getElementById("newChatBtn");

    const historyList =
        document.getElementById("historyList");


    let currentConversation = [];

    let allSessions =
        JSON.parse(
            localStorage.getItem("smartChatSessions")
        ) || [];

    let forceWebSearch = false;


    renderHistoryUI();


    /* ==========================================
       🌐 WEB SEARCH BUTTON
    ========================================== */

    if (webBtn) {

        webBtn.addEventListener("click", () => {

            forceWebSearch =
                !forceWebSearch;

            if (forceWebSearch) {

                webBtn.classList.add("active");

                webBtn.innerHTML = "🌐";

                webBtn.title =
                    "Live Web Search ON";

            } else {

                webBtn.classList.remove("active");

                webBtn.innerHTML = "🌐";

                webBtn.title =
                    "Live Web Search";

            }

            if (input) {
                input.focus();
            }

        });

    }


    /* ==========================================
       🎤 VOICE INPUT
    ========================================== */

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


            voiceBtn.addEventListener(
                "click",
                () => {

                    try {

                        recognition.start();

                        voiceBtn.innerHTML =
                            "🎙️";

                    } catch (error) {

                        console.log(
                            "Voice already active"
                        );

                    }

                }
            );


            recognition.onresult =
                (event) => {

                    const transcript =
                        event.results[0][0]
                            .transcript;

                    input.value =
                        transcript;

                    input.focus();

                };


            recognition.onend =
                () => {

                    voiceBtn.innerHTML =
                        "🎤";

                };


            recognition.onerror =
                () => {

                    voiceBtn.innerHTML =
                        "🎤";

                };

        } else {

            voiceBtn.style.display =
                "none";

        }

    }


    /* ==========================================
       ➕ NEW CHAT
    ========================================== */

    if (newChatBtn) {

        newChatBtn.addEventListener(
            "click",
            () => {

                currentConversation = [];

                messages.innerHTML = `

                    <div class="message ai-message">

                        <h2>
                            👋 Welcome to SmartChat AI
                        </h2>

                        <p>
                            Hello! Ask me anything.
                        </p>

                    </div>

                `;

                if (input) {

                    input.value = "";

                    input.focus();

                }

            }
        );

    }


    /* ==========================================
       📩 SEND MESSAGE
    ========================================== */

    if (chatForm) {

        chatForm.addEventListener(
            "submit",
            async (e) => {

                e.preventDefault();


                const text =
                    input.value.trim();


                if (!text) {
                    return;
                }


                addMessage(
                    text,
                    "user"
                );


                input.value = "";


                const aiDiv =
                    addMessage(
                        "🤖 Thinking...",
                        "ai"
                    );


                sendBtn.disabled =
                    true;


                const searchWasEnabled =
                    forceWebSearch;


                try {

                    const res =
                        await fetch(
                            "/api/chat",
                            {
                                method: "POST",

                                headers: {
                                    "Content-Type":
                                        "application/json"
                                },

                                body:
                                    JSON.stringify({

                                        message:
                                            text,

                                        webSearch:
                                            searchWasEnabled

                                    })

                            }
                        );


                    const data =
                        await res.json();


                    /* Reset web search */

                    forceWebSearch =
                        false;

                    if (webBtn) {

                        webBtn.classList
                            .remove("active");

                        webBtn.innerHTML =
                            "🌐";

                        webBtn.title =
                            "Live Web Search";

                    }


                    if (res.ok) {

                        aiDiv.innerHTML = "";


                        /* ==================================
                           🖼️ IMAGE RESPONSE
                        ================================== */

                        if (
                            data.type ===
                            "image"
                        ) {

                            aiDiv.innerHTML = `

                                <p>
                                    ${escapeHTML(
                                        data.answer
                                    )}
                                </p>

                                <img
                                    src="${data.imageUrl}"
                                    class="ai-image"
                                    alt="AI Generated Image"
                                    loading="lazy"
                                >

                                <button
                                    class="copy-btn"
                                    type="button"
                                >
                                    📋 Copy Prompt
                                </button>

                            `;


                            const copyBtn =
                                aiDiv.querySelector(
                                    ".copy-btn"
                                );


                            if (copyBtn) {

                                copyBtn.onclick =
                                    () => {

                                        copyText(text);

                                        copyBtn.innerHTML =
                                            "✅ Copied!";

                                        setTimeout(
                                            () => {

                                                copyBtn.innerHTML =
                                                    "📋 Copy Prompt";

                                            },
                                            1500
                                        );

                                    };

                            }

                        }


                        /* ==================================
                           💬 TEXT RESPONSE
                        ================================== */

                        else {

                            const formattedAnswer =
                                formatAIResponse(
                                    data.answer
                                );


                            aiDiv.innerHTML = `

                                ${
                                    data.webSearch
                                        ? `
                                            <div class="web-badge">
                                                🌐 Live Web Search
                                            </div>
                                          `
                                        : ""
                                }

                                <div class="ai-content">
                                    ${formattedAnswer}
                                </div>

                                <button
                                    class="copy-btn"
                                    type="button"
                                >
                                    📋 Copy
                                </button>

                            `;


                            const copyBtn =
                                aiDiv.querySelector(
                                    ".copy-btn"
                                );


                            if (copyBtn) {

                                copyBtn.onclick =
                                    () => {

                                        copyText(
                                            data.answer
                                        );

                                        copyBtn.innerHTML =
                                            "✅ Copied!";

                                        setTimeout(
                                            () => {

                                                copyBtn.innerHTML =
                                                    "📋 Copy";

                                            },
                                            1500
                                        );

                                    };

                            }

                        }


                        /* ==================================
                           SAVE CHAT
                        ================================== */

                        currentConversation.push({

                            question:
                                text,

                            answer:
                                data.answer

                        });


                        saveToRecentChats();

                    }


                    /* ==================================
                       ❌ API ERROR
                    ================================== */

                    else {

                        aiDiv.innerHTML = `

                            <p>
                                ⚠️ ${
                                    escapeHTML(
                                        data.error ||
                                        "API Error"
                                    )
                                }
                            </p>

                        `;

                    }

                }

                catch (err) {

                    aiDiv.innerHTML = `

                        <p>
                            ❌ ${
                                escapeHTML(
                                    err.message
                                )
                            }
                        </p>

                    `;

                }


                finally {

                    sendBtn.disabled =
                        false;

                    chatArea.scrollTop =
                        chatArea.scrollHeight;

                }

            }
        );

    }


    /* ==========================================
       💾 SAVE CHAT
    ========================================== */

    function saveToRecentChats() {

        if (
            currentConversation.length === 0
        ) {

            return;

        }


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


        allSessions =
            allSessions.slice(0, 15);


        localStorage.setItem(
            "smartChatSessions",
            JSON.stringify(
                allSessions
            )
        );


        renderHistoryUI();

    }


    /* ==========================================
       📜 HISTORY
    ========================================== */

    function renderHistoryUI() {

        if (!historyList) {
            return;
        }


        historyList.innerHTML = "";


        if (
            allSessions.length === 0
        ) {

            historyList.innerHTML = `
                <li style="opacity:.6;">
                    No recent chats
                </li>
            `;

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
                    document.createElement(
                        "li"
                    );


                li.textContent =
                    session[0].question;


                li.onclick =
                    () => {

                        messages.innerHTML =
                            "";

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

                    };


                historyList.appendChild(
                    li
                );

            }
        );

    }


    /* ==========================================
       💬 ADD MESSAGE
    ========================================== */

    function addMessage(
        text,
        type
    ) {

        const div =
            document.createElement(
                "div"
            );


        div.className =
            `message ${
                type === "user"
                    ? "user-message"
                    : "ai-message"
            }`;


        if (type === "ai") {

            div.innerHTML = `
                <p>
                    ${escapeHTML(text)}
                </p>
            `;

        } else {

            div.innerHTML = `
                <p>
                    ${escapeHTML(text)}
                </p>
            `;

        }


        messages.appendChild(
            div
        );


        chatArea.scrollTop =
            chatArea.scrollHeight;


        return div;

    }


    /* ==========================================
       🔗 FORMAT AI RESPONSE
    ========================================== */

    function formatAIResponse(text) {

        if (!text) {
            return "";
        }


        let html =
            escapeHTML(text);


        /* Markdown links */

        html = html.replace(
            /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g,
            '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>'
        );


        /* Bold */

        html = html.replace(
            /\*\*(.*?)\*\*/g,
            "<strong>$1</strong>"
        );


        /* Italic */

        html = html.replace(
            /(?<!\*)\*([^*]+)\*(?!\*)/g,
            "<em>$1</em>"
        );


        /* URLs */

        html = html.replace(
            /(?<!["'>])(https?:\/\/[^\s<]+)/g,
            '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>'
        );


        /* Line breaks */

        html =
            html.replace(
                /\n\n/g,
                "<br><br>"
            );


        html =
            html.replace(
                /\n/g,
                "<br>"
            );


        return html;

    }


    /* ==========================================
       🔒 ESCAPE HTML
    ========================================== */

    function escapeHTML(text) {

        if (!text) {
            return "";
        }


        return String(text)
            .replace(/&/g, "&amp;")
            .replace(
                /</g,
                "&lt;"
            )
            .replace(
                />/g,
                "&gt;"
            )
            .replace(
                /"/g,
                "&quot;"
            )
            .replace(
                /'/g,
                "&#039;"
            );

    }


    /* ==========================================
       📋 COPY
    ========================================== */

    async function copyText(text) {

        try {

            await navigator.clipboard
                .writeText(text);

        }

        catch (error) {

            console.log(
                "Copy failed:",
                error
            );

        }

    }

});
