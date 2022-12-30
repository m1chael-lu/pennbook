var AWS = require('aws-sdk');
AWS.config.update({ region: 'us-east-1' });
var db = new AWS.DynamoDB();
var crypto = require('crypto');
// const io = require('socket.io')();

function generatePostID(user, title) {
	concatenated = user + "-" + title
	return crypto.createHash('sha256').update(concatenated).digest('hex');
}

function hash(password) {
	return crypto.createHash('sha256').update(password).digest('hex');
}

function generateChatID(inputList) {
	inputList.sort();
	concatenated = inputList.join('-');
	return crypto.createHash('sha256').update(concatenated).digest('hex');
}


var users_login = function (username, password, callback) {

	// Defining parameters for lookup
	var params = {
		KeyConditionExpression: "login_name = :u",
		FilterExpression: "contains (password, :p)",
		ExpressionAttributeValues: {
			":u": {
				S: username
			},
			":p": {
				S: hash(password)
			}
		},
		TableName: "users"
	};

	// Queries through the database of users to check if the username + password combination works
	db.query(params, function (err, data) {
		if (err || data.Items.length == 0) {
			callback(err, null);
		} else {
			callback(err, data.Items[0]);
		}
	})
};

var username_check = function (username, callback) {
	// Defining parameters
	var params = {
		KeyConditions: {
			login_name: {
				ComparisonOperator: 'EQ',
				AttributeValueList: [{ S: username }]
			}
		},
		TableName: "users",
	};

	// Querying the usernames to check if it exists
	db.query(params, function (err, data) {
		if (err || data.Items.length == 0) {
			callback(err, null);
		} else {
			callback(err, data);
		}
	});
}

var create_account = function (login_name, affiliation, birthday, email,
	first_name, last_name, password, interests, callback) {

	// Adding into friends database
	var params_friends = {
		Item: {
			"user_1": {
				S: login_name
			},
			"user_2": {
				S: []
			}
		},
		TableName: "friends"
	};

	db.putItem(params_friends, function (err, data) {
		console.log(err);
	})

	// Ensuring valid input
	if (password.length == 0) {
		callback("Invalid password");
	} else if (first_name.length == 0) {
		callback("Invalid first name");
	}

	// Defining the query parameters
	var params = {
		Item: {
			"login_name": {
				S: login_name
			},
			"affiliation": {
				S: affiliation
			},
			"birthday": {
				S: birthday
			},
			"email": {
				S: email
			},
			"first_name": {
				S: first_name
			},
			"last_name": {
				S: last_name
			},
			"password": {
				S: hash(password)
			},
			"online": {
				BOOL: true
			},
			"Interests": {
				SS: interests
			},
			"chatrequest": {
				S: ""
			}
		},
		TableName: "users"
	};

	var params2 = {
		Item: {
			"user_1": {
				S: login_name
			}
		},
		TableName: "friends"
	};

	db.putItem(params2, function (err, data) {
		console.log(err);
	})

	// Adding new account into users
	db.putItem(params, function (err, data) {
		console.log(err);
		if (err) {
			callback(err, null);
		}
		else {
			callback(null, data);
		};
	});
}

var updatesettings = function(user, newEmail, newPassword, newAffiliation, newInterests, callback) {
	var params1 = {
		Key: {
			login_name:
				{ S: user }
		},
		TableName: "users",
	};

	if (newPassword.length > 0) {
		params1.ExpressionAttributeValues = {
			':pass': { S: hash(newPassword) },
			':email' : { S: newEmail},
			':affil' : {S: newAffiliation},
			':interests' : {SS: newInterests}
		};
		params1.UpdateExpression = 'SET password = :pass, email = :email, affiliation = :affil, Interests = :interests';
	} else {
		params1.ExpressionAttributeValues = {
			':email' : { S: newEmail},
			':affil' : {S: newAffiliation},
			':interests' : {SS: newInterests}
		};
		params1.UpdateExpression = 'SET email = :email, affiliation = :affil, Interests = :interests';
	}

	db.updateItem(params1, function (err, data) {
		if (err) {
			console.log(err);
			callback(err, null);
		} else {
			callback(err, data);
		}
	});
}

var add_friend = function (user, n, add, callback) {
	username_check(n, function (err, data) {
		if (err) {
			callback(`User with login name "${n}" does not exist`);
		}
	});

	var friends1;
	var friends2;

	// First do two retrieve friends calls to get their existing set of friends
	retrieve_friends(user, function (err, data) {
		if (data.user_2 == null) {
			friends1 = [];
		} else {
			friends1 = data.user_2.SS;
		};
		retrieve_friends(n, function (err, data) {
			if (data.user_2 == null) {
				friends2 = [];
			} else {
				friends2 = data.user_2.SS;
			};
			// Adding friends
			if (add) {
				friends1.push(n);
				friends2.push(user);
			} else {
				const index1 = friends1.indexOf(n);
				const index2 = friends2.indexOf(user);
				friends1.splice(index1, 1);
				friends2.splice(index2, 1);
			}

			// Updating attributes
			var params1 = {
				Key: {
					user_1:
						{ S: user }
				},
				TableName: "friends",
			};


			if (friends1.length > 0) {
				params1.ExpressionAttributeValues = {
					':user_2': { SS: friends1 }
				};
				params1.UpdateExpression = 'SET user_2 = :user_2';
			} else {
				params1.UpdateExpression = 'REMOVE user_2';
			}

			db.updateItem(params1, function (err) {
				if (err) {
					callback(err);
				};
			});

			var params2 = {
				Key: {
					user_1:
						{ S: n }
				},
				TableName: "friends",
			};

			if (friends2.length > 0) {
				params2.ExpressionAttributeValues = {
					':user_2': { SS: friends2 }
				};
				params2.UpdateExpression = 'SET user_2 = :user_2';
			} else {
				params2.UpdateExpression = 'REMOVE user_2';
			}

			db.updateItem(params2, function (err) {
				if (err) {
					callback(err);
				};
			});

			callback(null);
		})
	});

}

var retrieve_friends = function (username, callback) {
	// Defining parameters
	var params = {
		KeyConditions: {
			user_1: {
				ComparisonOperator: 'EQ',
				AttributeValueList: [{ S: username }]
			}
		},
		TableName: "friends",
	};

	// Querying the usernames to check if it exists
	db.query(params, function (err, data) {
		if (err || data.Items.length == 0) {
			callback(err, null);
		} else {
			for (let i = 0; i < data.Items.length; i++) {
				if (!data.Items[i].user_2) {
					data.Items[i].user_2 = {
						SS: []
					};
				}
			}
			callback(err, data.Items[0]);
		}
	});
}

var check_chat = function (username, accepted, callback) {
	accepted = accepted === 'true';
	const params = {
		TableName: 'chatrequest',
		FilterExpression: 'userrequested = :user AND accepted = :acc',
		ExpressionAttributeValues: {
			':user' : {
				S : username
			},
			':acc' : {
				BOOL: accepted
			}
		}
	};

	if (accepted) {
		params.FilterExpression = '#user = :user AND accepted = :acc';
		params.ExpressionAttributeNames = {
			'#user' : 'user'
		}
	}

	db.scan(params, function(err, data) {
		if (err) {
			console.log(err);
			callback(err, null);
		} else {
			callback(err, data);
		}
	})
}

var send_chat_request = function (username, friendname, send, message, callback) {
	var usersList = []
	usersList.push(username);
	usersList.push(friendname);
	var chatid = generateChatID(usersList);
	var userMessage = "";
	if (message) {
		userMessage = message;
	}
	
	if (send == 0) {
		var params = {
			Item: {
				"chatid": {
					S: chatid
				},
				"userrequested": {
					S: friendname
				},
				"user": {
					S: username
				},
				"accepted": {
					BOOL: false
				}, 
				"message" : {
					S: userMessage
				}
			},
			TableName: "chatrequest"
		};

		db.putItem(params, function (err, data) {
			if (err) {
				callback(err, null);
			} else {
				callback(err, data);
			}
		})
	} else if (send == 2) {
		var params = {
			Key: {
				'chatid' :
					{ S: chatid }
			},
			TableName: "chatrequest",
			ExpressionAttributeValues: {
				':status': { BOOL : true }
			},
			UpdateExpression: 'SET accepted = :status'
		};
		db.updateItem(params, function (err, data) {
			if (err) {
				callback(err, null);
			} else {
				callback(err, data);
			}
		})
	} else {
		var params = {
			TableName: 'chatrequest',
			Key: {
				'chatid' : {S : chatid}
			}
		}
		db.deleteItem(params, function(err, data) {
			if (err) {
				console.log(err)
			} else {
				callback(err, data);
			}
		})
	} 
}

var editOnlineStatus = function (changeTo, username, callback) {
	var params = {
		Key: {
			login_name:
				{ S: username }
		},
		TableName: "users",
		ExpressionAttributeValues: {
			':status': { "BOOL": changeTo }
		},
		ExpressionAttributeNames: {
			'#status': 'online'
		},
		UpdateExpression: 'SET #status = :status'
	};

	db.updateItem(params, function (err) {
		if (err) {
			callback(err);
		};
	});
}

var checkFriendStatus = function (username, callback) {
	var params = {
		TableName: 'users',
		Key: {
			'login_name': {
				S: username
			}
		}
	};

	db.getItem(params, function (err, data) {
		if (data.Item.online.BOOL === true) {
			callback(err, true);
		} else {
			callback(err, false);
		}
	})
}

var dropdownSearch = function (keyword, callback) {
	const params = {
		TableName: 'users',
		FilterExpression: 'begins_with(#login_name, :login_name)',
		ExpressionAttributeNames: {
			'#login_name': 'login_name'
		},
		ExpressionAttributeValues: {
			':login_name': {
				S: keyword
			}
		},
		ProjectionExpression: "#login_name"
	};

	db.scan(params, function (err, data) {
		if (err) {
			console.log(err);
			callback(err, null);
		} else {
			callback(null, data);
		}
	})
};

var getUserInfo = function(username, callback) {
	const params = {
		TableName: 'users',
		Key: {
			'login_name': { S: username }
		}
	};

	db.getItem(params, function (err, data) {
		if (data == null) {
			callback(err, null);
		} else {
			callback(err, data.Item);
		}
	})
}

var retrieve_messages = function(chatid, callback) {
	var params = {
		TableName: "chat",
		KeyConditionExpression: 'chatid = :chatid', 
		ExpressionAttributeValues: {
			':chatid' : {
				S : chatid
			}
		},
		ScanIndexForward: true, 
		Limit: 50
	}

	db.query(params, function (err, data) {
		if (err) {
			console.log(err);
			callback(err, null);
		} else {
			callback(err, data);
		}
	})
};

var add_message = function(user, message, chatid, callback) {
	var params = {
		Item: {
			"chatid": {
				S: chatid
			},
			"message": {
				S: message
			},
			"user": {
				S: user
			},
			"timestamp" : {
				N: Date.now().toString()
			}
		},
		TableName: "chat"
	};

	db.putItem(params, function (err, data) {
		if (err) {
			console.log(err);
			callback(err, null);
		} else {
			callback(err, data);
		}
	})
}

var scan_posts = function(username, friendslist, callback) {
	var concatenated = friendslist.join();
	concatenated += username;

	const params = {
		TableName: "posts",
		FilterExpression: "contains(:users, #author)",
		ExpressionAttributeNames: {
			"#author" : "author"
		},
		ExpressionAttributeValues: {
		  ":users": {S : concatenated}
		},
	};

	db.scan(params, function (err, data) {
		if (err || data.Items.length == 0) {
			callback(err, null);
		} else {
			data.Items.sort((a, b) => {
				if (parseInt(a.timestamp.N) < parseInt(b.timestamp.N)) {
					return 1;
				} else if (parseInt(a.timestamp.N) > parseInt(b.timestamp.N)) {
					return -1;
				} else {
					return 0;
				}
			});

			for (let i = 0; i < data.Items.length; i++) {
				var readable = new Date(parseInt(data.Items[i].timestamp.N));
				data.Items[i].timestamp.N = readable.toLocaleString('en-US', {timezone: 'America/New_York'})
			}

			callback(err, data.Items);
		}
	});
}

var create_post = function(author, title, description, callback) {
	var post_id = generatePostID(author, title);

	var params = {
		Item: {
			"postid": {
				S: post_id
			},
			"timestamp": {
				N: Date.now().toString()
			},
			"author": {
				S: author
			},
			"title": {
				S: title
			},
			"description" : {
				S: description
			},
			"comments" : {
				SS: [ "" ]
			}
		},
		TableName: "posts"
	};

	db.putItem(params, function(err, data) {
		if (err) {
			console.log(err);
			callback(err, null);
		} else {
			callback(err, data);
		}
	})
}

var create_comment = function(postid, timestamp, comment, user, callback) {
	var commentWithUser = user + ": " + comment;

	var params = {
		KeyConditions: {
			'postid': {
				ComparisonOperator: 'EQ',
				AttributeValueList: [{ S: postid }]
			}
		},
		TableName: "posts",
	};

	// Querying the usernames to check if it exists
	db.query(params, function (err, data) {
		if (err || data.Items.length == 0) {
			console.error('Error updating item: ', JSON.stringify(err, null, 2));
		} else {
			var comments = data.Items[0].comments.SS;
			comments.push(commentWithUser);
			var oldtimestamp = data.Items[0].timestamp.N;
			const params = {
				TableName: 'posts',
				Key: {
					'postid': {
						S: postid
					},
					'timestamp' : {
						N: oldtimestamp
					}
				},
				UpdateExpression: 'SET comments = :newComment',
				ExpressionAttributeValues: {
					':newComment' : {SS : comments}
				},
				ReturnValues: 'UPDATED_NEW'
			};

			db.updateItem(params, function(err, data) {});
		}
	});
}

var sample_news = function(callback) {
	const params = {
		TableName: 'news_articles',
		Limit: 6
	};

	db.scan(params, (err, data) => {
		if (err) {
			callback(err, null);
		} else {
			callback(null, data.Items);
		}
	});
}

var retrieve_users = function(callback) {
	const params = {
		TableName: 'users'
	}

	db.scan(params, (err, data) => {
		if (err) {
			console.log(err);
			callback(err, null);
		} else {
			callback(err, data);
		}
	})
}

var database = {
	login: users_login,
	usernameCheck: username_check,
	createAccount: create_account,
	addfriend: add_friend,
	retrievefriends: retrieve_friends,
	checkchat: check_chat,
	sendchatrequest: send_chat_request,
	editOnline: editOnlineStatus,
	checkfriendstatus: checkFriendStatus,
	dropdownsearch: dropdownSearch,
	getuserinfo: getUserInfo,
	updateSettings: updatesettings,
	retrieveMessages: retrieve_messages,
	addMessage: add_message,
	scanPosts: scan_posts,
	createPost: create_post,
	createComment: create_comment,
	sampleNews: sample_news,
	retrieveUsers: retrieve_users
};

module.exports = database;
