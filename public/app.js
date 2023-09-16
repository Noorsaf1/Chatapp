var socket = io();

var userlist = document.getElementById("active_users_list");
var roomlist = document.getElementById("active_rooms_list");
var message = document.getElementById("messageInput");
var sendMessageBtn = document.getElementById("send_message_btn");
var roomInput = document.getElementById("roomInput");
var createRoomBtn = document.getElementById("room_add_icon_holder");
var chatDisplay = document.getElementById("chat");
var gifSearchInput = document.getElementById("gifSearchInput");
var gifResults = document.getElementById("gifResults");

var currentRoom = "global";
var myUsername = "";

// Skapar en objekt för att spara chat-historiken för varje rum
var chatHistory = {};

// Skapa en variabel och element för skrivande indikator
var typingTimeout;
var typingIndicator = document.createElement('div');
typingIndicator.className = 'typing-indicator';
document.body.appendChild(typingIndicator); // ändrat till body för att säkerställa att det visas

socket.on("connect", function () {
  myUsername = prompt("Enter name: ");
  socket.emit("createUser", myUsername);
});

sendMessageBtn.addEventListener("click", function () {
  socket.emit("sendMessage", message.value);
  message.value = "";
});

message.addEventListener('input', function () {
  clearTimeout(typingTimeout);
  if(message.value.trim() !== "") {
    socket.emit('user typing');
    typingTimeout = setTimeout(function () {
      socket.emit('stop typing');
    }, 2000);
  } else {
    socket.emit('stop typing');
  }
});

createRoomBtn.addEventListener("click", function () {
  let roomName = roomInput.value.trim();
  if (roomName !== "") {
    socket.emit("createRoom", roomName);
    roomInput.value = "";
  }
});


socket.on("updateChat", function (username, data) {
  if (username === "INFO") {
    chatDisplay.innerHTML += `<div class="announcement"><span>${data}</span></div>`;
  } else {
    chatDisplay.innerHTML += `<div class="message_holder ${
      username === myUsername ? "me" : ""
    }"><div class="pic"></div><div class="message_box"><div id="message" class="message"><span class="message_name">${username}</span><span class="message_text">${data}</span></div></div></div>`;
  }
  // Uppdatera chatHistorik för det aktuella rummet
  chatHistory[currentRoom] = chatDisplay.innerHTML;

  chatDisplay.scrollTop = chatDisplay.scrollHeight;
});

socket.on("updateUsers", function (usernames) {
  userlist.innerHTML = "";
  for (var user in usernames) {
    userlist.innerHTML += `<div class="user_card"><div class="pic"></div><span>${user}</span></div>`;
  }
});

socket.on("updateRooms", function (rooms, newRoom) {
  roomlist.innerHTML = "";
  for (var index in rooms) {
    roomlist.innerHTML += `<div class="room_card" id="${rooms[index].name}" onclick="changeRoom('${rooms[index].name}')"><div class="room_item_content"><div class="pic"></div><div class="roomInfo"><span class="room_name">#${rooms[index].name}</span><span class="room_author">${rooms[index].creator}</span></div></div></div>`;
  }
  document.getElementById(currentRoom).classList.add("active_item");

  // Återställ chatDisplay till chatHistorik för det aktuella rummet när rummen uppdateras
  chatDisplay.innerHTML = chatHistory[currentRoom] || '';
});

function changeRoom(room) {
  if (room != currentRoom) {

     // Spara chatHistorik för det nuvarande rummet innan du byter
     chatHistory[currentRoom] = chatDisplay.innerHTML;

    socket.emit("updateRooms", room);
    document.getElementById(currentRoom).classList.remove("active_item");
    currentRoom = room;
    document.getElementById(currentRoom).classList.add("active_item");

     //  chatHistorik för det nya rummet
     chatDisplay.innerHTML = chatHistory[currentRoom] || '';
  }
}

gifSearchInput.addEventListener("keyup", function () {
  var query = gifSearchInput.value;
  if (query.length >= 3) {
    fetch(`https://api.giphy.com/v1/gifs/search?api_key=bsYW3K7bbqwPjfKGcwz9FwkRXaehF3vS&q=${query}&limit=5`)
      .then(response => response.json())
      .then(data => {
        gifResults.innerHTML = data.data
          .map(result => `<img src="${result.images.fixed_height.url}" style="width: 100px; height: 100px;" onclick="sendGif('${result.images.fixed_height.url}')" />`)
          .join("");
      });
  }
});

function sendGif(url) {
  socket.emit("sendMessage", `<img src="${url}" />`);
  gifSearchInput.value = "";
  gifResults.innerHTML = "";
}

message.addEventListener('focus', function () {
  socket.emit('user typing');
});

message.addEventListener('blur', function () {
  socket.emit('stop typing');
});

socket.on('user typing', function (username) {
  typingIndicator.textContent = `${username} is typing...`;
});

socket.on('stop typing', function () {
  typingIndicator.textContent = '';
});
