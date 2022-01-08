// this is the client
const socket = io();

// elements
const $messageForm = document.querySelector("#message-form");
const $messageFormInput = $messageForm.querySelector("input");
const $messageFormButton = $messageForm.querySelector("button");
const $GeoFormButton = document.querySelector("#send-location");
const $messages = document.querySelector("#messages");

// templates
const messageTemplate = document.querySelector("#message-template").innerHTML;
const locationTemplate = document.querySelector("#location-template").innerHTML;
const sidebarTemplate = document.querySelector("#sidebar-template").innerHTML;

//options
const { username, room } = Qs.parse(location.search, {
  ignoreQueryPrefix: true,
});

const autoscroll = () => {
  //new message element
  const $newMessage = $messages.lastElementChild;

  //height of the new message
  const newMessageStyles = getComputedStyle($newMessage);
  const newMessageMargin = parseInt(newMessageStyles.marginBottom);
  const newMessageHeight = $newMessage.offsetHeight + newMessageMargin;

  //visible height
  const visibleHeight = $messages.offsetHeight;

  //height of message container
  const containerHeight = $messages.scrollHeight;

  //how far have I scrolled?
  const scrollOffset = $messages.scrollTop + visibleHeight;

  if (containerHeight - newMessageHeight <= scrollOffset) {
    // make sure you were at the bottom before the last message was added
    // if that is true, then auto scroll, otherwise don't autosscroll
    $messages.scrollTop = $messages.scrollHeight;
    /*
A good Alternative
4 upvotes
Abdessattar · Lecture 173 · 2 years ago
You could have performed the auto-scrolling using two lines of codes as following:
 
const element=$message.lastElementChild
element.scrollIntoView({behavior: "smooth", block: "end", inline: "nearest"})
*/
  }
};

socket.on("message", (messageObjectFromServer) => {
  const html = Mustache.render(messageTemplate, {
    username: messageObjectFromServer.username,
    message: messageObjectFromServer.text,
    createdAt: moment(messageObjectFromServer.createdAt).format("h:mm a"),
  });

  $messages.insertAdjacentHTML("beforeend", html);
  autoscroll();
});

socket.on("locationMessage", (locationObjectFromServer) => {
  console.log(locationObjectFromServer.url); //---------------

  const html = Mustache.render(locationTemplate, {
    username: locationObjectFromServer.username,
    url: locationObjectFromServer.url,
    createdAt: moment(locationObjectFromServer.createdAt).format("h:mm a"),
  });

  $messages.insertAdjacentHTML("beforeend", html);
  autoscroll();
});

socket.on("roomData", ({ room, users }) => {
  const html = Mustache.render(sidebarTemplate, {
    room,
    users,
  });
  document.querySelector("#sidebar").innerHTML = html;
});

$messageForm.addEventListener("submit", (e) => {
  e.preventDefault();
  $messageFormButton.setAttribute("disabled", "disabled");

  const message = e.target.elements.message.value;

  socket.emit("sendMessage", message, (error) => {
    //-------------------
    $messageFormButton.removeAttribute("disabled");
    $messageFormInput.value = "";
    $messageFormInput.focus();

    if (error) {
      return console.log(error);
    }
    console.log("The message was delivered.");
  });
});

$GeoFormButton.addEventListener("click", () => {
  if (!navigator.geolocation) {
    return alert("Geolocation is not supported by your browser");
  }
  //this is async but does not support promises
  $GeoFormButton.setAttribute("disabled", "disabled");

  navigator.geolocation.getCurrentPosition((position) => {
    const positionObject = {
      lat: position.coords.latitude,
      long: position.coords.longitude,
    };
    //console.log(positionObject);
    socket.emit("sendLocation", positionObject, () => {
      $GeoFormButton.removeAttribute("disabled");
      console.log("position shared");
    });
  });
});

socket.emit("join", { username, room }, (error) => {
  // do something with the error
  if (error) {
    alert(error);
    location.href = "/";
  }
});
