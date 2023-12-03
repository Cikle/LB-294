const binId = "656ca97754105e766fd909bc";
const apiKey = "$2a$10$pDsRdUpzRuhUwdLmzHKcQefFrQrf4zg/DcHXvYu0Iq/3Zbrg89tyu";
let data = [];

// Funktion zum Anhängen einer Nachricht an den Chat
function appendMessage(name, message, className) {
    const chatMessages = document.querySelector('.chat-messages');
    const isScrolledToBottom =
        chatMessages.scrollHeight - chatMessages.clientHeight <= chatMessages.scrollTop + 1;

    const messageContainer = document.createElement('div');
    messageContainer.className = `message ${className}`;

    const messageName = document.createElement('div');
    messageName.className = 'message-name';
    messageName.textContent = name;

    const messageText = document.createElement('div');

    // Überprüfung, ob die Nachricht einen Wikipedia-Link enthält
    if (message.includes('https://en.wikipedia.org/wiki/')) {
        const link = document.createElement('a');
        link.href = message;
        link.target = '_blank';
        link.textContent = message;
        messageText.appendChild(link);
    } else {
        messageText.innerHTML = message;
    }

    messageContainer.appendChild(messageName);
    messageContainer.appendChild(messageText);
    chatMessages.appendChild(messageContainer);

    // Scrollen zum unteren Ende des Chats, wenn vorher schon unten
    if (isScrolledToBottom) {
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
}

// Funktion zum Senden einer Nachricht
function sendMessage() {
    const userInput = document.querySelector('.user-input').value.toLowerCase();

    if (userInput.trim() === '') {
        return;
    }

    // Anhängen der Benutzernachricht an den Chat
    appendMessage('User', userInput, 'user-message');

    document.querySelector('.user-input').disabled = true;
    document.querySelector('.send-button').disabled = true;

    // Überprüfung, ob die Benutzereingabe eine Suche auslöst
    if (userInput.includes("search for")) {
        // Verarbeitung der Wikipedia-Suche
        const searchQuery = userInput.replace("search for", "").replace("what is", "").trim();
        const wikipediaLink = `https://en.wikipedia.org/wiki/${searchQuery.replace(/\s+/g, '_')}`;
        appendMessage('Cortex', `Here's what I found about <a href="${wikipediaLink}" target="_blank">${searchQuery}</a>:`, 'ai-message');
    } else {
        // Abrufen von Daten von JSONBin-API
        fetch(`https://api.jsonbin.io/v3/b/${binId}`, {
            headers: {
                'Content-Type': 'application/json',
                'X-Master-Key': apiKey,
            },
        })
            .then(response => response.json())
            .then(fetchedData => {
                // Finden und Anzeigen einer passenden KI-Antwort
                const aiResponse = findResponse(userInput, fetchedData.record);
                appendMessage('Cortex', aiResponse, 'ai-message');

                data = fetchedData.record;

                // Speichern der aktualisierten Daten in JSONBin
                saveDataToJson(data);
            })
            .catch(error => {
                // Fehlerbehandlung beim Abrufen von Antworten
                console.error('An error occurred while fetching responses.');
                console.error(error);
                appendMessage('Cortex', 'An error occurred while fetching responses.', 'ai-message');
            });
    }

    document.querySelector('.user-input').disabled = false;
    document.querySelector('.send-button').disabled = false;

    document.querySelector('.user-input').value = '';
}

// Funktion zum Verarbeiten von Tastatureingaben
function handleKeyPress(event) {
    if (event.key === 'Enter') {
        sendMessage();
    }
}

// Funktion zum Finden einer passenden Antwort
function findResponse(userInput, responses) {
    const lowerCaseInput = userInput.toLowerCase();

    for (const response of responses) {
        if (response.questionType.some(type => lowerCaseInput.includes(type.toLowerCase()))) {
            const randomIndex = Math.floor(Math.random() * response.responses.length);
            return response.responses[randomIndex];
        }
    }

    return "Use 'Help' for available commands";
}

// Modals idee von ChatGPT, jedoch implementiert mithilfe von https://www.freecodecamp.org/news/how-to-build-a-modal-with-javascript/

function openAddTypeModal() {
    document.getElementById('addTypeModal').style.display = 'block';
}

function closeAddTypeModal() {
    document.getElementById('addTypeModal').style.display = 'none';
}

function addTypeFromModal() {
    const typeInput = document.getElementById('typeInput').value.trim();
    const responsesInput = document.getElementById('responsesInput').value.trim();

    if (typeInput === '' || responsesInput === '') {
        alert('Please fill in both question types and responses.');
        return;
    }

    const questionTypes = typeInput.split(',').map(type => type.trim());
    const responses = responsesInput.split(',').map(response => response.trim());

    const newId = data.length + 1;
    const newType = {
        id: newId,
        questionType: questionTypes,
        responses: responses,
        dateAndTimeCreated: new Date().toISOString()
    };

    data.push(newType);

    saveDataToJson(data);

    const formattedQuestionTypes = questionTypes.join(', ');
    alert(`Types "${formattedQuestionTypes}" added successfully with ID ${newId}.`);
    closeAddTypeModal();
}

// Hilfe von ChatGPT und der JSONbin website https://jsonbin.io/api-reference

function saveDataToJson(data) {
    fetch(`https://api.jsonbin.io/v3/b/${binId}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'X-Master-Key': apiKey,
        },
        body: JSON.stringify(data), 
    })
        .then(response => response.json())
        .then(result => {
            console.log('Data saved successfully:', result);
        })
        .catch(error => {
            console.error('Error saving data:', error);
        });
}

function showRemoveTypeInput() {
    // Show the input field for Type ID
    document.getElementById('removeTypeInputContainer').style.display = 'flex';
}

function openRemoveTypeModal() {
    // Show the Remove Type modal
    document.getElementById('removeTypeModal').style.display = 'block';
}

function closeRemoveTypeModal() {
    // Close the Remove Type modal
    document.getElementById('removeTypeModal').style.display = 'none';
}

function deleteType() {
    // Get the ID entered by the user
    const removeTypeId = document.getElementById('removeTypeId').value.trim();

    // Validate if ID is provided
    if (removeTypeId === '') {
        alert('Please enter a Type ID to remove.');
        return;
    }

    // Convert the ID to a number
    const typeId = parseInt(removeTypeId, 10);

    // Check if the ID is in the restricted range (1 to 10)
    if (typeId >= 1 && typeId <= 10) {
        alert('Types with ID 1 to 10 cannot be deleted.');
        return;
    }

    // Find the index of the type with the provided ID
    const typeIndex = data.findIndex(type => type.id.toString() === removeTypeId);

    // Check if the type was found
    if (typeIndex === -1) {
        alert(`Type with ID ${removeTypeId} not found.`);
        return;
    }

    // Remove the type from the data array
    const removedType = data.splice(typeIndex, 1)[0];

    // Save the updated data to JSONBin
    saveDataToJson(data);

    alert(`Type with ID ${removeTypeId} removed successfully:\n${JSON.stringify(removedType)}`);
    // Close the Remove Type modal after deletion
    closeRemoveTypeModal();
}

data = [];

console.log('Data before saving:', data);
