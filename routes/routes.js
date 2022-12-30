const { checkchat, retrievefriends } = require('../models/database.js');
var db = require('../models/database.js');
var crypto = require('crypto');
const session = require('express-session');


function generateChatID(inputList) {
	inputList.sort();
	concatenated = inputList.join('-');
	return crypto.createHash('sha256').update(concatenated).digest('hex');
}

var getLogin = function(req, res) {
	res.render('login.ejs', { message: null });
};

var getHome = function(req, res) {
	var session = req.session;
	if (session.username == undefined) {
		res.redirect('/login');
		return;
	}
	db.editOnline(true, session.username, function(err) {
		if (err) {
			console.log(err);
		}
	})
	// If logged in, it goes to the home page
	var inputName = session.username;

	db.retrievefriends(inputName, function(err, dataFriends) {
		if (err) {
			console.log(err);
		} else {
			// pulling friends 
			db.scanPosts(inputName, dataFriends.user_2.SS, function(err, dataPosts) {
				if (err) {
					console.log(err);
				} else {
					db.sampleNews(function(err, dataNews) {
						if (err) {
							console.log(err);
						} else {
							res.render('homepage.ejs', { friends: dataFriends, posts: dataPosts, news: dataNews,
								 user: inputName, message: null });
						}
					});
				}
			});
		}
	});
}

var getSignup = function(req, res) {
	// Loading signup page
	res.render('signup.ejs', { message: null });
};

var postCheckLogin = function(req, res) {
	// Pulling session, username, and request
	var session = req.session;
	var username = req.body.username;
	var password = req.body.password;
	db.login(username, password, function(err, data) {
		// Checking if login was successful
		if (data == null) {
			// If login failed, redirects back to main page with error message
			res.render('login.ejs', { message: "Error: Invalid Login" });
		} else if (data) {
			session.username = username;
			// If successfull, routes to the restaurant page
			res.redirect("/");
		}
	})
}

var createAccount = function(req, res) {
	// Pulling session, username, password, and fullname from req
	var session = req.session;
	var login_name = req.body.username;
	var affiliation = req.body.affiliation;
	var birthday = req.body.birthday;
	var email = req.body.email;
	var first_name = req.body.firstname;
	var last_name = req.body.lastname;
	var password = req.body.password;
	var interests = req.body.listElement.split(", ").filter(s => s.length > 0);

	// Running the database function that verifies if a username is taken
	db.usernameCheck(login_name, function(err, data) {
		if (data == null) {
			// Creating account if the username is not taken
			db.createAccount(login_name, affiliation, birthday, email,
				first_name, last_name, password, interests, function(err, data) {
					if (err) {
						res.render('signup.ejs', { message: err });
					}
				});

			// Assigning session's username and redirecting'
			session.username = login_name;
			res.redirect("/");
		} else {
			// Signup fails
			res.render('signup.ejs', { message: "Invalid Login" });
		}
	})

}

var logOut = function(req, res) {
	// Pulls session and logs out
	var session = req.session;
	db.editOnline(false, session.username, function(err) {
		if (err) {
			console.log(err);
		}
	})

	session.username = null;
	res.redirect("/login");
}

var addFriend = function(req, res) {
	// Pulls session and other inputs
	var session = req.session;
	var friend = req.body.friend;
	var user = session.username;
	var add = req.body.add;

	db.createPost(user, user + " has just friended " + friend, "", function(err) {})
	
	// Adds the restaurant with the input
	if (user != friend) {
		db.addfriend(user, friend, add, function(err) {
		console.log(err);
		if (err == null) {
			return res.send({
				success: true
			});
		}
	})
	} else {
		return res.send({
			success: false
		})
	}
}

var accountSettings = function(req, res) {
	res.render("accountsettings.ejs");
}

var updateSettings = function(req, res) {
	// Pulling session, username, password, and fullname from req
	var session = req.session;
	var login_name = session.username;

	var newAffiliation = req.body.affiliation;
	var newEmail = req.body.email;
	var newPassword = req.body.password;
	var newInterests = req.body.listElement.split(", ").filter(s => s.length > 0);
	var changes = req.body.changes.replace("affiliation->", "");
	changes = changes.replace("interests->", "");
	changes = changes.split(", ");
	if (changes[0] === "true") {
		var title = login_name + " is now affiliated with " + newAffiliation;
		db.createPost(login_name, title, "", function(err, data) {})
	}
	if (changes[1] === "true") {
		var temp = login_name + " is now interested in ";
		if (newInterests.length == 1) {
			temp = newInterests[0];
		} else if (newInterests.length == 2) {
			temp = newInterests[0] + " and " + newInterests[1]
;		} else if (newInterests.length > 2) {
			for (let i = 0; i < newInterests.length; i++) {
				if (i < newInterests.length - 2) {
					temp += newInterests[i] + ", ";
				} else if (i == newInterests.length - 2){
					temp += newInterests[i] + ", and ";
				} else {
					temp += newInterests[i];
				}
			}
		}
		db.createPost(login_name, temp, "", (err, data)=>{})
	}

	db.updateSettings(login_name, newEmail, newPassword, newAffiliation, newInterests, function(err, data) {
		if (data == null) {
			res.send({
				error: "error updating data"
			});
		} else {
			res.redirect('/');
		}
	});
}

var checkChatRequests = function(req, res) {
	var session = req.session;
	var user = session.username;
	var accepted = req.body.accepted;
	db.checkchat(user, accepted, function(err, data) {
		if (data != null) {
			res.send({
				success: true,
				user: data
			});
		}
	});
}

// Compiling chat request info
var sendChatRequest = function(req, res) {
	var session = req.session;
	var user = session.username;
	var friend = req.body.friend;
	var send = req.body.sendingType;
	var message = req.body.message;
	if (message == null) {
		message = ""
	}
	db.sendchatrequest(user, friend, send, message, function(err, data) {
		if (data != null) {
			res.send({
				success: true
			});
		}
	})
}

// Finding a friend and their status
var checkFriendStatus = function(req, res) {
	var username = req.body.user;
	db.checkfriendstatus(username, function(err, data) {
		if (err) {
			console.log(err);
		}
		if (data == true) {
			res.send({
				success: true,
				user: username
			});
		} else {
			res.send({
				success: false,
				user: username
			});
		}
	})
}

// General function for retrieving friends for a given user
var retrieveFriends = function(req, res) {
	var session = req.session;
	var username = session.username;
	db.retrievefriends(username, function(err, data) {
		if (err) {
			console.log(err);
		} else {
			if (data.user_2 != undefined) {
				res.send(data.user_2.SS);
			} else {
				res.send(null);
			}
		}
	});
}

// Scanning through posts (used in refresh)
var scanPosts = function(req, res) {
	var session = req.session;
	var username = session.username;
	db.retrievefriends(username, function(err, dataFriends) {
		if (err) {
			console.log(err);
		} else {
			// pulling friends 
			db.scanPosts(username, dataFriends.user_2.SS, function(err, dataPosts) {
				if (err) {
					console.log(err);
				} else {
					res.send({
						success: true,
						data: dataPosts
					});
				}
			});
		}
	});
}

// Route to get dropdown items based off of a keyword
var retrieveDropdown = function(req, res) {
	var word = req.body.keyword;
	db.dropdownsearch(word, function(err, data) {
		if (data == null) {
		} else {
			res.send({
				success: true,
				users: data.Items
			});
		}
	})
}

// Unfriend route that deletes a friend from a user's string set list of friends. 
var unfriend =  function(req, res) {
	var session = req.session;
	var user = session.username;
	var toUnfriend = req.body.username;

	db.addfriend(user, toUnfriend, false, function(err, data) {
		if (err) {
			console.log(err);
			res.send({
				success: false,
			});
		} else {
			res.send({
				success: true
			});
		}
	}) 
}


var getUserInfo = function(req, res) {
	var session = req.session;
	var user = session.username;

	db.getuserinfo(user, function(err, data) {
		if (data == null) {
			res.send({
				success: false
			})
		} else {
			res.send({
				success: true,
				userinfo: data
			})
		}
	})
}

// Retrieve a chatid given a list of users
var getChatId = function(req, res) {
	var inputList = req.body.inputList;
	inputList = inputList.split(", ").filter(x => x.length > 0)
	var hashed = generateChatID(inputList);
	res.send({
		success: true,
		chatid: hashed
	})
}

// Retrieve the messages given a chatid or a list of users
var retrieveMessages = function(req, res) {
	var chatid = req.body.chat;
	var user_1 = req.body.user1;
	var user_2 = req.body.user2;

	if (!chatid) {
		inputList = [];
		inputList.push(user_1)
		inputList.push(user_2);
		chatid = generateChatID(inputList);
	}

	db.retrieveMessages(chatid, function(err, data) {
		if (data == null) {
			console.log(err);
		} else {
			res.send({
				success: true,
				items: data
			})
		}
	})
}

// Adding a message into the database
var addMessage = function(user, message, chatid) {
	db.addMessage(user, message, chatid, function(err, data) {})
}

// Generating post route
var createPost = function(req, res) {
	var title = req.body.title;
	var description = req.body.description;
	var user = req.session.username;
	db.createPost(user, title, description, function(err, data) {
		if (data) {
			/*
			res.send({
				success: true
			});
			*/
		} else {
			/*
			res.send({
				success: false
			});
			*/
		}
		res.redirect('/');
	});
}

// Route to the visualizer file
var visualizer = function(req, res){
    newUser = req.session.username;
    if (newUser) {
        db.retrieveUsers(function(err, data)
            {
          if (!err) {
            res.render('friendvisualizer.ejs', {users: data, user: newUser});
          } else {
            console.log(err);
          }
            });
      } else {
            res.redirect('/login', {message: "Haven't logged in yet..."});
        }
}


// First layer visualization
var visualization = function(req, res) {
	var currUser = req.session.username;

	db.getuserinfo(currUser, function(err, data) {
		if (err) {
			console.log(err);
		} else {
			var childrenArray = [];
			db.retrievefriends(currUser, function(err, data2) {
				if (err) {
					console.log(err);
				} else {
					for (let i = 0; i < data2.user_2.SS.length; i++) {
						let name = data2.user_2.SS[i].charAt(0).toUpperCase() + data2.user_2.SS[i].slice(1);
						newJSON = {"id" : data2.user_2.SS[i], "name" : name, "data" : {"affiliation" : "Upenn"}, "children": []}
						childrenArray.push(newJSON);
					}
					var name = currUser.charAt(0).toUpperCase() + currUser.slice(1);
					var json = {"id" : currUser, "name" : name, "children" : childrenArray};
					res.send(json);
				}
			})
		}
	}) 
}

// Second layer visualization
var friends = function(req, res) {
	var expandedUser = req.params.user;
	var currUser = req.session.username;

	db.retrievefriends(expandedUser, function(err, data) {
		// First building the expanded user's JSON
		expandedChildren = [];
		for (let i = 0; i < data.user_2.SS.length; i++) {
			let name = data.user_2.SS[i].charAt(0).toUpperCase() + data.user_2.SS[i].slice(1);
			newJSON = {"id" : data.user_2.SS[i], "name" : name, "data" : {"affiliation" : "Upenn"}, "children": []}
			expandedChildren.push(newJSON);
		}
		let expandedName = expandedUser.charAt(0).toUpperCase() + expandedUser.slice(1);
		expandedJSON = {"id" : expandedUser, "name": expandedName, "children": expandedChildren};

		// Now building the current user's JSON
		db.retrievefriends(currUser, function(err, data) {
			childrenArray = [];
			for (let i = 0; i < data.user_2.SS.length; i++) {
				if (data.user_2.SS[i] != expandedUser) {
					let name = data.user_2.SS[i].charAt(0).toUpperCase() + data.user_2.SS[i].slice(1);
					newJSON = {"id" : data.user_2.SS[i], "name" : name, "data" : {"affiliation" : "Upenn"}, "children": []}
				} else {
					newJSON = expandedJSON;
				}
				childrenArray.push(newJSON);
			}
			var name = currUser.charAt(0).toUpperCase() + currUser.slice(1);
			var json = {"id" : currUser, "name" : name, "children" : childrenArray};
			res.send(json);
		})
	})
}

// Build comment
var createComment = function(req, res) {
	var postid = req.body.postid;
	var timestamp = req.body.timestamp;
	var comment = req.body.comment;
	var user = req.session.username;
	db.createComment(postid, timestamp, comment, user, function(err, data) {
		if (data != null) {
			return res.send({
				success: true
			});
		}
	});
}

// Defining the route functions
var routes = {
	get_home: getHome,
	get_signup: getSignup,
	post_checkLogin: postCheckLogin,
	post_createAccount: createAccount,
	post_logout: logOut,
	post_addFriend: addFriend,
	get_login: getLogin,
	get_accountSettings: accountSettings,
	post_checkChatRequest: checkChatRequests,
	post_updateSettings: updateSettings,
	post_sendChatRequest: sendChatRequest,
	post_checkFriendStatus: checkFriendStatus,
	post_retrieveFriends: retrieveFriends,
	post_scanPosts: scanPosts,
	post_retrieveDropdown: retrieveDropdown,
	post_unfriend: unfriend,
	post_getUserInfo: getUserInfo,
	post_getchatid: getChatId,
	post_retrieveMessages: retrieveMessages,
	post_addMessage: addMessage,
	post_createPost: createPost,
	get_visualizer: visualizer,
	get_visualization: visualization,
	get_friends: friends,
	post_createComment: createComment,
};

module.exports = routes;
