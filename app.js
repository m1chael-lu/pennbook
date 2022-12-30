var express = require('express');
var session = require('express-session');
var routes = require('./routes/routes.js');
var app = express();
var httpServer = require("http").createServer(app);
const io = require('socket.io')(httpServer);

io.on('connection', function(socket) {
    socket.on('join', function(data) {
        if (!socket.rooms.has(data.room)) {
            socket.join(data.room);
            socket.in(data.room).emit('send', {message: data.user + ' joined room', user: null});
        }
    });
    socket.on('send', function(data) {
        routes.post_addMessage(data.user, data.message, data.room);
        socket.in(data.room).emit('send', {message: data.message, user: data.user})
    });
    socket.on('leave', function(data) {
        socket.leave(data.room);
        socket.in(data.room).emit('send', {message: data.username + ' left room', user: null});
    })
})


app.use(express.urlencoded());
// Setting up the Express Session
app.use(session({secret: 'loginSecret', username: null, resave: false, saveUninitialized: true}));

// Defining the GET and POST requests
app.get('/', routes.get_home);
app.get('/signup', routes.get_signup);
app.post('/checkLogin', routes.post_checkLogin);
app.post('/createaccount', routes.post_createAccount);
app.get('/login', routes.get_login);
app.get('/logout', routes.post_logout);
app.post('/addFriend', routes.post_addFriend);
app.get('/accountsettings', routes.get_accountSettings);
app.post('/checkchatrequest', routes.post_checkChatRequest);
app.post('/updatesettings', routes.post_updateSettings);
app.post('/sendchatrequest', routes.post_sendChatRequest);
app.post('/checkfriendstatus', routes.post_checkFriendStatus);
app.post('/retrievefriends', routes.post_retrieveFriends);
app.post('/scanPosts', routes.post_scanPosts);
app.post('/retrievedropdownitems', routes.post_retrieveDropdown);
app.post('/unfriend', routes.post_unfriend);
app.post('/getuserinfo', routes.post_getUserInfo);
app.post('/getchatid', routes.post_getchatid);
app.post('/getmessages', routes.post_retrieveMessages);
app.post('/createpost', routes.post_createPost);
app.get('/visualizer', routes.get_visualizer);
app.get('/friendvisualization', routes.get_visualization);
app.get('/getFriends/:user', routes.get_friends);
app.post('/createcomment', routes.post_createComment);

app.use(express.static('/home/nets2120/git/G38/public'));

httpServer.listen(3000);
console.log('Server running on port 3000. Now open http://localhost:3000/ in your browser!');
