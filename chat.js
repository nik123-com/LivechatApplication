// chat.js (put this file next to index.html)

import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const SUPABASE_URL = "https://YOUR_PROJECT.supabase.co"; // replace
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlqeG9xeHVjbGdndWtpYXVpenp3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA1OTg5MjgsImV4cCI6MjA3NjE3NDkyOH0.x77W8R7xBkTA2gbCCFCB8BzsLVE3Dgip_ojQh1PbM88";                  // replace (anon public key)

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const messagesContainer = document.getElementById("chat-messages");
const messageInput = document.getElementById("message-input");

let userName = "";

export async function promptForName() {
  userName = prompt("Enter your name:");
  if (!userName) {
    alert("Name required");
    location.reload();
  } else {
    document.getElementById("chat-window").style.display = "flex";
    await loadMessages();
    subscribeToMessages();
  }
}

async function loadMessages() {
  const { data } = await supabase
    .from("messages")
    .select("*")
    .order("timestamp", { ascending: true });

  messagesContainer.innerHTML = "";
  data.forEach(displayMessage);
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function displayMessage(message) {
  const div = document.createElement("div");
  div.classList.add("message", message.user === userName ? "user-message" : "other-message");
  div.textContent = message.user === "System" ? message.text : `${message.user}: ${message.text}`;
  messagesContainer.appendChild(div);
}

export async function sendMessage() {
  const text = messageInput.value.trim();
  if (!text) return;
  await supabase.from("messages").insert([{ user: userName, text }]);
  messageInput.value = "";
}

function subscribeToMessages() {
  supabase
    .channel('public:messages')
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
      displayMessage(payload.new);
    })
    .subscribe();
}

// If index.html wants to call promptForName() on load, expose it globally:
window.promptForName = promptForName;
window.sendMessage = sendMessage;
