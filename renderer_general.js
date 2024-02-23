console.log("renderer general aktiv");
document.getElementById("sendButton").addEventListener("click", () => {
    window.electronAPI.sendMessage("messageChannel", "RendererTEST");
  });
  
  window.electronAPI.receiveMessage("replyChannel", (message) => {
    console.log(`Received reply: ${message}`);
  });





