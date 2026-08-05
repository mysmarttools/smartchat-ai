const input = document.getElementById("userInput");
const sendBtn = document.getElementById("sendBtn");
const messages = document.getElementById("messages");
const newChatBtn = document.getElementById("newChatBtn");

sendBtn.addEventListener("click", sendMessage);


input.addEventListener("keydown", function(e){

    if(e.key === "Enter" && !e.shiftKey){

        e.preventDefault();
        sendMessage();

    }

});


async function sendMessage(){

    const text = input.value.trim();

    if(text === "") return;


    addMessage(text,"user");

    input.value="";


    const loading = addMessage("🤖 Thinking...","ai");


    try{


        const response = await fetch("/api/chat",{

            method:"POST",

            headers:{
                "Content-Type":"application/json"
            },

            body:JSON.stringify({

                message:text

            })

        });


        const data = await response.json();


        loading.remove();


        addMessage(data.answer,"ai");


    }catch(error){


        loading.remove();


        addMessage(
            "❌ Something went wrong. Please try again.",
            "ai"
        );


        console.log(error);

    }

}



function addMessage(text,type){


    const div=document.createElement("div");


    div.classList.add("message");


    if(type==="user"){

        div.classList.add("user-message");

    }else{

        div.classList.add("ai-message");

    }


    div.innerHTML=`<p>${text}</p>`;


    messages.appendChild(div);


    messages.scrollTop=messages.scrollHeight;


    return div;

}

newChatBtn.addEventListener("click", () => {

    messages.innerHTML = `
        <div class="message ai-message">
            <h2>👋 Welcome to SmartChat AI</h2>
            <p>Hello! Ask me anything.</p>
        </div>
    `;

    input.value = "";
    input.focus();

});

newChatBtn.addEventListener("click", () => {
    alert("Button Working");
});
