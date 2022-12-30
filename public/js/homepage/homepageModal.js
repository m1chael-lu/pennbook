// Defining modals
function makeWall(friendName) {
    var modal = document.createElement("div");
    modal.innerHTML = "<b><p style='color: grey'>" + friendName + "'s Wall</b>" +
        " </p><p> </p>";
    document.body.appendChild(modal);

    modal.style.zIndex = "999";
    modal.style.position = "absolute";
    modal.style.left = "20%";
    modal.style.top = "50%";
    modal.style.border = "2px solid #D3D3D3";
    modal.style.borderRadius = "5px";
    modal.style.backgroundColor = "white";
    modal.style.padding = "10px";
    modal.style.minHeight = "500px";
    modal.style.minWidth = "800px";
    modal.style.textAlign = "center";
    modal.style.opacity = "0.8";
    modal.id = friendName + " wall chatbox";
    modal.addEventListener('mousedown', function (event) {
        handleMouseDown(event, friendName + " wall");
    });
    var closeButton = document.createElement("button");
    closeButton.innerHTML = "<i class='fa fa-times'></i>";
    closeButton.className = "btn btn-sm btn-outline-secondary";
    closeButton.style.position = "absolute";
    closeButton.style.left = "10px";
    closeButton.style.top = "10px";
    closeButton.onclick = function () {
        document.body.removeChild(modal);
    };
    modal.appendChild(closeButton);
    currModal = modal;
    formPos.set(friendName + " wall", { x: 0, y: 0 });
}

function changeRequestToChat(user, curr) {
    var concatenated = user + ", " + currUser;
    if (curr) {
        $.post('/sendChatRequest', { friend: user, sendingType: 2 }, function (data) { })
        var index = visibleChatRequestsOthers.indexOf(user);
        visibleChatRequestsOthers.splice(index, 1);
    } else {
        $.post('/sendChatRequest', { friend: user, sendingType: 1 }, function (data) { })
    }
    $.post('/getchatid', { inputList: concatenated }, function (data) {
        if (data.success == true) {
            socket.emit('join', {room: data.chatid, user: currUser});
            if (!listeners.has(data.chatid)) {
                listeners.set(data.chatid, true);
                socket.on('send', function(mess) {
                    addMessage(data.chatid, mess.user, mess.message);
                })
            }
            visibleChatWindows.push(user);
            var modal = document.getElementById(user + " chatbox");
            document.body.removeChild(modal);
            dragging.status = false;

            var newModal = document.createElement("div");
            removeModal = function () {
                socket.emit('leave', {room : data.chatid, username: currUser});
                document.body.removeChild(newModal);
                var index = visibleChatWindows.findIndex(user);
                visibleChatWindows.splice(index, 1);
            };

            newModal.innerHTML =
                "<div class='card' style='width:500px; height:400px; border-radius: 20px'>" +
                    "<div class='card-body'>" +
                        "<button class='btn btn-outline-secondary' style='position:absolute; right: 40px; top:26px; z-index: 1000' onclick='removeModal()'> <i class='fa fa-times'></i> </button>" +
                        "<div id='message-container' style='height: 250px; overflow-y:auto'> " +
                            "<table class='table align-top' id='" + data.chatid + " table'>" +
                                "<thead>" +
                                    "<tr style='position:sticky; top:0; background: white; opacity: 0.99'>" +
                                        "<th class='text-left' style='color: black'> Chat with " + user + "</th> " +
                                    "</tr>" +
                                "</thead>" +
                            "</table>" +
                        "</div>" +
                        "<div class='form-group align-self-end mr-2' style='margin-top: 20px'>" +
                            "<input type='text' id='" + data.chatid + " input' class='form-control' style='float:left; width: 75%' placeholder='Enter message'>" +
                            "<button class='btn btn-primary' onclick='collectChat(\"" + data.chatid + "\")' style='font-size:15px; width:25%; margin-right: 0%; float:right'> Send </button>" +
                        "</div>" +
                    "</div>" +
                "</div>";

            document.body.appendChild(newModal);
            newModal.class = "container mt-5";
            newModal.id = data.chatid + " chatbox";
            newModal.style = "position: absolute; z-index: 999; opacity: .8";
            newModal.addEventListener('mousedown', function (event) {
                handleMouseDown(event, data.chatid);
            })
            var table = document.getElementById(data.chatid + " table");
            $.post('/getmessages', { user1: user, user2: currUser }, function (data) {
                for (let i = 0; i < data.items.Items.length; i++) {
                    var row = table.insertRow(-1);
                    row.style.height = "15px";
                    var cell = row.insertCell(0);
                    cell.className = "friend";
                    cell.innerHTML = "<td><b style='margin-right:5px'>" + data.items.Items[i].user.S + ":</b>" + data.items.Items[i].message.S + " </td>";
                }
            })
            
            currModal = newModal;
            formPos.set(data.chatid, { x: 0, y: 0 });
        }
    })
}

function openChatRequest(user, message) {
    var modal = document.createElement("div");
    modal.innerHTML = "<p style='color: grey'> Chat Request From " + user +
        " </p><p> " + message + " </p><button id='chatjoinbutton' onclick='changeRequestToChat(\"" + user +
        "\", true)' class='btn btn-outline-secondary'>Join</button>";
    document.body.appendChild(modal);

    modal.style.zIndex = "999";
    modal.style.position = "absolute";
    modal.style.left = "20%";
    modal.style.top = "50%";
    modal.style.border = "2px solid #D3D3D3";
    modal.style.borderRadius = "5px";
    modal.style.backgroundColor = "white";
    modal.style.padding = "10px";
    modal.id = user + " chatbox";
    modal.addEventListener('mousedown', function (event) {
        handleMouseDown(event, user);
    });


    var closeButton = document.createElement("button");
    closeButton.innerHTML = "<i class='fa fa-times'></i>";
    closeButton.className = "btn btn-outline-secondary";
    closeButton.onclick = function () {
        // Deleting the chat request and the modal associated with it
        $.post('/sendChatRequest', { friend: user, sendingType: 1 }, function (data) { })
        var index = visibleChatRequestsOthers.indexOf(user);
        visibleChatRequestsOthers.splice(index, 1);
        document.body.removeChild(modal);
    };
    modal.appendChild(closeButton);
    currModal = modal;
    formPos.set(friendName, { x: 0, y: 0 });
}

function sendChatRequest(friendName) {
    var send = 1;
    requestBox = document.getElementById(friendName + " chatbox");
    if (requestBox.innerHTML.includes("Submit")) {
        send = 0;
    }
    var toSend = document.getElementById(friendName + " chatrequest").value;
    $.post('/sendChatRequest', { friend: friendName, sendingType: send, message: toSend }, function (data) {
        if (data.success) {
        } else {
            alert("failed to send");
        }
    })
    if (send == 0) {
        requestBox.innerHTML = currModal.innerHTML.replace("Submit", "Cancel");
    } else {
        requestBox.innerHTML = currModal.innerHTML.replace("Cancel", "Submit");
    }
}

function removeModal(friendName) {
    document.body.removeChild(document.getElementById(friendName + " chatbox"));
}

function openFriend(friendName) {
    $.post('/checkfriendstatus', { user: friendName }, function (data) {
        if (data.success == true) {
            var modal = document.createElement("div");
            modal.innerHTML = "<p style='color: grey'> Chat Request To " + friendName +
                " </p><input id='" + friendName + " chatrequest' type='text'><p></p>" + 
                "<button class='btn btn-outline-secondary' onClick='sendChatRequest(\"" + friendName + "\")'" +
                ">Submit</button>" +
                "<button class='btn btn-outline-secondary' onclick='removeModal(\"" + 
                friendName + "\")'><i class='fa fa-times'></i></button>";
                
            document.body.appendChild(modal);

            modal.style.zIndex = "999";
            modal.style.position = "absolute";
            modal.style.left = "20%";
            modal.style.top = "50%";
            modal.style.border = "2px solid #D3D3D3";
            modal.style.borderRadius = "5px";
            modal.style.backgroundColor = "white";
            modal.style.padding = "10px";
            modal.style.userSelect = "none";
            modal.id = friendName + " chatbox";
            modal.addEventListener('mousedown', function (event) {
                handleMouseDown(event, friendName);
            });
            currModal = modal;
            formPos.set(friendName, { x: 0, y: 0 });
        }
    })
}

function addlocal() {
    localposts.push("filler");
}

function openPost() {
    var modal = document.createElement("div");
    modal.innerHTML = "<p style='color: grey; text-align: center;'> Create Post"+
        "<div> " +
            "<form id='new post form' action='/createpost' method='post'> " +
                "<input type='text' class='form-control' id='post title' name='title' placeholder='Title' style=' margin-top: 10px; margin-bottom:10px'>" +
                "<textarea rows='5' cols='50' id='post description' name='description' class='form-control' placeholder='Description' style='height:250px'></textarea>" +
                "<button type='submit' class='btn btn-primary' style='margin-top: 10px' onclick='addlocal()'>Post</button>"
            "</form>" +			  
        "</div>";
    document.body.appendChild(modal);

    modal.style.zIndex = "999";
    modal.style.position = "absolute";
    modal.style.left = "40%";
    modal.style.top = "30%";
    modal.style.border = "2px solid #D3D3D3";
    modal.style.borderRadius = "5px";
    modal.style.backgroundColor = "white";
    modal.style.padding = "10px";
    modal.style.userSelect = "none";
    modal.style.width = "500px";
    modal.style.height = "415px";
    modal.id = "post" + " chatbox";
    modal.addEventListener('mousedown', function (event) {
        handleMouseDown(event, "post");
    });

    

    var closeButton = document.createElement("button");
    closeButton.innerHTML = "<i class='fa fa-times'></i>";
    closeButton.className = "btn btn-sm btn-outline-secondary";
    closeButton.style.position = "absolute";
    closeButton.style.left = "10px";
    closeButton.style.top = "10px";
    closeButton.onclick = function () {
        document.body.removeChild(modal);
    };
    modal.appendChild(closeButton);
    currModal = modal;
    formPos.set("post", { x: 0, y: 0 });
        
}

let dragging = { status: false, user: "" };
let mousePos = { x: 0, y: 0 };
let formPos = new Map;
let showDropdown = false;
var selectedModal;

// Creating event handlers
function handleMouseDown(event, friendName) {
    dragging = { status: true, user: friendName };
    currModal = document.getElementById(friendName + " chatbox");
    mousePos = { x: event.clientX, y: event.clientY };
    formPos.set(friendName, { x: currModal.offsetLeft, y: currModal.offsetTop });
}

document.addEventListener('mousemove', handleMouseMove);
document.addEventListener('mouseup', handleMouseUp);
document.addEventListener("click", function () {
    if (showDropdown = true) {
        closeDropdown();
        showDropdown = false;
    }
})

function handleMouseUp() {
    dragging.status = false;
}

function handleMouseMove(event) {
    if (dragging.status) {
        const newForm = {
            x: formPos.get(dragging.user).x + event.clientX - mousePos.x,
            y: formPos.get(dragging.user).y + event.clientY - mousePos.y
        }
        currModal.style.left = newForm.x + 'px';
        currModal.style.top = newForm.y + 'px';
    }
}

function closeFriend() {
    var modal = document.querySelector("modal");
    modal.style.display = "none";
}