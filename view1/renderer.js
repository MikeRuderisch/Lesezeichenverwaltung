document.getElementById("sendButton").addEventListener("click", () => {
    window.electronAPI.sendMessage("messageChannel", "RendererTEST");
  });
  
  window.electronAPI.receiveMessage("replyChannel", (message) => {
    console.log(`Received reply: ${message}`);
  });

  document.addEventListener('DOMContentLoaded', () => {
    console.log("Dom geladen")
    window.electronAPI.receiveMessage("data", (data) => {
      console.log("Daten empfangen");
      console.log("Empfangene Daten:", data);
      new DataTable('#example', {
        data: data,
        columns: [
            { title: 'Category', data: 'Category' },
            { title: 'Title', data: 'Title' },
            { title: 'Date', data: 'Date' },
            { title: 'Tags', data: 'Tags' }        
        ],
        initComplete: function () {
            this.api().columns().every(function () {
                let column = this;
                let title = column.footer().textContent;
     
                // Create input element
                let input = document.createElement('input');
                input.placeholder = title;
                column.footer().replaceChildren(input);
     
                // Event listener for user input
                input.addEventListener('keyup', () => {
                    if (column.search() !== this.value) {
                        column.search(input.value).draw();
                    }
                });
            });
        }
      });
    });
  });




