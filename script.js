document.addEventListener("DOMContentLoaded", () => {

const chatForm=document.getElementById("chatForm");
const input=document.getElementById("userInput");
const messages=document.getElementById("messages");
const chatArea=document.getElementById("chatArea");
const sendBtn=document.getElementById("sendBtn");
const voiceBtn=document.getElementById("voiceBtn");
const webBtn=document.getElementById("webBtn");
const newChatBtn=document.getElementById("newChatBtn");
const historyList=document.getElementById("historyList");

let currentConversation=[];
let allSessions=JSON.parse(localStorage.getItem("smartChatSessions"))||[];

let forceWebSearch=false;

renderHistoryUI();


// ======================
// WEB SEARCH BUTTON
// ======================

if(webBtn){

webBtn.addEventListener("click",()=>{

forceWebSearch=true;

input.focus();

webBtn.classList.add("active");

});

}


// ======================
// VOICE INPUT
// ======================

if(voiceBtn){

const SpeechRecognition=
window.SpeechRecognition||
window.webkitSpeechRecognition;

if(SpeechRecognition){

const recognition=new SpeechRecognition();

recognition.lang="en-US";

recognition.interimResults=false;

recognition.continuous=false;

voiceBtn.addEventListener("click",()=>{

recognition.start();

voiceBtn.innerHTML="🎙️";

});

recognition.onresult=(e)=>{

input.value=e.results[0][0].transcript;

voiceBtn.innerHTML="🎤";

};

recognition.onend=()=>{

voiceBtn.innerHTML="🎤";

};

}else{

voiceBtn.style.display="none";

}

}


// ======================
// NEW CHAT
// ======================

if(newChatBtn){

newChatBtn.addEventListener("click",()=>{

currentConversation=[];

messages.innerHTML=`

<div class="message ai-message">

<h2>👋 Welcome to SmartChat AI</h2>

<p>Hello! Ask me anything.</p>

</div>

`;

});

}


// ======================
// SEND MESSAGE
// ======================

chatForm.addEventListener("submit",async(e)=>{

e.preventDefault();

const text=input.value.trim();

if(!text) return;

addMessage(text,"user");

input.value="";

const aiDiv=addMessage("🤖 Thinking...","ai");

sendBtn.disabled=true;

try{

const res=await fetch("/api/chat",{

method:"POST",

headers:{
"Content-Type":"application/json"
},

body:JSON.stringify({

message:text,

webSearch:forceWebSearch

})

});

forceWebSearch=false;

webBtn.classList.remove("active");

const data=await res.json();

                aiDiv.innerHTML = "";

                // 🖼️ IMAGE RESPONSE
                if (data.type === "image") {

                    aiDiv.innerHTML = `
                        <p>${data.answer}</p>

                        <img
                            src="${data.imageUrl}"
                            class="ai-image"
                            alt="AI Image"
                        >

                        <button class="copy-btn">
                            📋 Copy Prompt
                        </button>
                    `;

                    aiDiv.querySelector(".copy-btn")
                        .onclick = () => {

                        navigator.clipboard.writeText(text);

                        alert("Prompt Copied!");

                    };

                }

                // 💬 TEXT RESPONSE
                else {

                    aiDiv.innerHTML = `
                        <p>${data.answer}</p>

                        <button class="copy-btn">
                            📋 Copy
                        </button>
                    `;

                    aiDiv.querySelector(".copy-btn")
                        .onclick = () => {

                        navigator.clipboard.writeText(
                            data.answer
                        );

                        alert("Copied!");

                    };

                }

                // Save Chat
                currentConversation.push({

                    question:text,

                    answer:data.answer

                });

                saveToRecentChats();

            }

            else{

                aiDiv.innerHTML=`
                    <p>
                    ⚠️ ${data.error}
                    </p>
                `;

            }

        }

        catch(err){

            aiDiv.innerHTML=`
            <p>

            ❌ ${err.message}

            </p>
            `;

        }

        finally{

            sendBtn.disabled=false;

            chatArea.scrollTop=
            chatArea.scrollHeight;

        }

    });


// ======================
// SAVE CHAT
// ======================

function saveToRecentChats(){

if(currentConversation.length===0)
return;

allSessions.unshift([...currentConversation]);

allSessions=allSessions.slice(0,15);

localStorage.setItem(

"smartChatSessions",

JSON.stringify(allSessions)

);

renderHistoryUI();

}


// ======================
// HISTORY
// ======================

function renderHistoryUI(){

historyList.innerHTML="";

if(allSessions.length===0){

historyList.innerHTML=`
<li>

No recent chats

</li>
`;

return;

}

allSessions.forEach(session=>{

const li=document.createElement("li");

li.textContent=
session[0].question;

li.onclick=()=>{

messages.innerHTML="";

currentConversation=[...session];

session.forEach(chat=>{

addMessage(

chat.question,

"user"

);

addMessage(

chat.answer,

"ai"

);

});

};

historyList.appendChild(li);

});

}


// ======================
// MESSAGE
// ======================

function addMessage(text,type){

const div=document.createElement("div");

div.className=

`message ${
type==="user"
?
"user-message"
:
"ai-message"
}`;

div.innerHTML=`
<p>${text}</p>
`;

messages.appendChild(div);

chatArea.scrollTop=

chatArea.scrollHeight;

return div;

}

});
    
