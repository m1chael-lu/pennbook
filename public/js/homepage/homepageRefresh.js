var refresh = function () {
    var friends;
    // Checking if any friends are online
    $.post('/retrievefriends', {}, function (data) {
        friends = data;
        for (var i = 0; i < friends.length; i++) {
            $.post('/checkfriendstatus', { user: friends[i] }, function (data) {
                if (data.success == true) {
                    var indicator = document.getElementById(data.user + " indicator");
                    indicator.className = indicator.className.replace("secondary", "success");
                } else {
                    var indicator = document.getElementById(data.user + " indicator");
                    indicator.className = indicator.className.replace("success", "secondary");
                }
            });
        }
    });
    $.post('/checkchatrequest', {accepted: false}, function (data) {
        if (data.success == true) {
            for (let i = 0; i < data.user.Items.length; i++) {
                if (!visibleChatRequestsOthers.includes(data.user.Items[i].user.S)) {
                    visibleChatRequestsOthers.push(data.user.Items[i].user.S);
                    openChatRequest(data.user.Items[i].user.S, data.user.Items[i].message.S);
                }
            }
        }
    });
    $.post('/checkchatrequest', {accepted: true}, function (data) {
        console.log(data);
        if (data.success == true) {
            for (let i = 0; i < data.user.Items.length; i++) {
                visibleChatWindows.push(data.user.Items[i].userrequested.S);
                changeRequestToChat(data.user.Items[i].userrequested.S);
            }
        }
    });
    $.post('/scanPosts', {}, function(data) {
        var posts = data.data;
        var postID = [];
        for (let i = 0; i < posts.length; i++) {
            postID.push(posts[i].postid.S);
        }
        if (localposts.length == 0) {
            localposts = postID;
        } else if (localposts.length < postID.length) {
            var newPosts = postID.length - localposts.length;
            localposts = postID;
            for (let i = newPosts - 1; i >= 0; i--) {
                // Create the postID[i] post
                var table = document.getElementById("postslist");
                var row = table.insertRow(1);
                row.style.height = "20px";
                var cell = row.insertCell(-1);
                cell.innerHTML = '<td class="post">' +
								'<div class="card mt-3">' +
									'<div class="card-body">' +
										'<h5 class="card-title">' + posts[i].title.S + '</h5>' +
										'<p class="card-text">' + posts[i].description.S +
											'<div style="position:absolute; right: 20px; top: 56px; color: rgb(157, 157, 157); text-transform: capitalize;">' + posts[i].author.S + '</div>' +
										'</p>' +
									'</div>' +
									'<div style="position: absolute; right:12px; top:21px; color: lightgrey">' +
										posts[i].timestamp.N +
									'</div>' +
									'<div class="card-footer">' +
									'<h6>Comments</h6>' +
									'<div class="comments-container" id="' + posts[i].postid.S + ' comments" style="min-height: 100px; overflow-y: scroll;">' +
									'</div>' +
									'<div class="input-group mt-3">' +
									'<input type="text" id="' + posts[i].postid.S + ' commentbox" class="form-control" placeholder="Add a comment..." aria-label="Comment" aria-describedby="button-addon2">' +
										'<div class="input-group-append">' +
											'<button class="btn btn-outline-secondary" type="button" id="button-addon2"' +
											'onclick="comment(\''+ posts[i].postid.S + '\', \'' + posts[i].timestamp.N + '\')">' +
											'Post Comment</button>' +
										'</div>' +
									  '</div>' +
									'</div>' +
								  '</div>' +
                            '</td>'
            }
        }
    })
    setTimeout(refresh, refreshRate);
}