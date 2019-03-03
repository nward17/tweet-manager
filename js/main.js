// Define error messages that can be returned to the user
const ERROR_MESSAGE = "An error has occurred. Please try again later.";
const MISSING_HASHTAG = "Please enter a hashtag to search for.";

// Twitter URL for viewing a specific tweet
const TWEET_URL = "https://twitter.com/placeholder/status/";

$(function() {
    // Event listener for the search tweets form
    $(document).on("submit", "form#searchTweets",function() {
        resetSearchForm();

        // Get the hashtag to search for
        var hashtag = $(this).find("input").val().trim();

        if (hashtag) {
            searchTwitterHashtags(hashtag);
        } else {
            // Empty hashtags are not allowed since we need something to query by
            returnError(MISSING_HASHTAG);
        }

        return false;
    });

    // Event listener for the filter tweets form
    $(document).on("submit", "form#filterTweets",function() {

        // Get filter text
        var filterText = $(this).find("input").val().trim().toLowerCase();

        $("#saved .tweets-container .row").each(function(index) {
            var tweet = $(this);
            var tweetObj = JSON.parse($(this).find(".tweet-object").val());

            // Hide all tweets
            tweet.hide();

            // Only show if the filter text matches the tweet's content
            Object.keys(tweetObj).forEach(function(key) {
                if (key === "name" || key === "handle" || key === "text") {
                    if (tweetObj[key].toLowerCase().indexOf(filterText) != -1) {
                        tweet.show();
                    }
                }
            });
        });

        return false;
    });

    // Retrieve the currently stored tweets
    getTweets();
});

// Open the tweet in a new tab
function openExternalTweet(tweetId) {
    window.open(TWEET_URL + tweetId, "_blank");
}

// Clear out any old form errors
function resetSearchForm() {
    $("#search .tweets-container").empty();
    $("#search .message-alert").hide();
}

// Return an error message back to the user
function returnError(message) {
    var messageAlert = $(".message-alert");
    messageAlert.removeClass("alert-danger alert-success").addClass("alert-danger");
    messageAlert.html(message);
    messageAlert.fadeTo(2000, 500).fadeOut(500);
}

// Return a success message back to the user
function returnSuccess(message) {
    var messageAlert = $(".message-alert");
    messageAlert.removeClass("alert-danger alert-success").addClass("alert-success");
    messageAlert.html(message);
    messageAlert.fadeTo(2000, 500).fadeOut(500);
}

// Render the tweets from the database into the DOM
function renderTweets(tweets, tab) {
    var source = $("#tweet-template").html();
    var template = Handlebars.compile(source);
    var isSearch = tab === "search";

    // Empty container for new render
    $("#" + tab + " .tweets-container").empty();

    if (tweets.length === 0) {
        $("#" + tab + " .tweets-container").append("No Tweets have been found");
    } else {
        tweets.forEach(function(tweet) {
            // Set the tweet data for the UI element
            var context = {
                id: isSearch ? 0 : tweet.id,
                tweetId: tweet.id_str,
                actionType: isSearch ? "add" : "delete",
                actionIcon: isSearch ? "fa-plus-square" : "fa-trash",
                actionColor: isSearch ? "text-success" : "text-danger",
                image: isSearch ? tweet.user.profile_image_url_https : tweet.profile_image_url_https,
                name: isSearch ? tweet.user.name : tweet.name,
                handle: isSearch ? tweet.user.screen_name : tweet.screen_name,
                text: tweet.full_text,
                createdAt: tweet.created_at,
                createdAtFormatted: isSearch ? moment(tweet.created_at, "ddd MMM D HH:mm:ss ZZ YYYY").format("LT - LL") : moment(tweet.created_at).format('LT - LL')
            };
    
            // Add the tweet itself as a hidden element
            context.tweet = JSON.stringify(context);
    
            // Append the tweet to the container
            $("#" + tab + " .tweets-container").append(template(context));
        });
    }
}

// Call the PHP endpoint that will query the Twitter API
function searchTwitterHashtags(hashtag) {
    $.ajax({
        type: "POST",
        url: "php/tweet_manager.php",
        data: {
            action: "searchTwitterHashtags",
            hashtag: hashtag
        },
    }).done(function(response) {
        try {
            response = JSON.parse(response);

            if (response.type === "error") {
                // Return the error message to the user
                returnError(response.message);
            } else {
                renderTweets(response.statuses, "search");
            }
        } catch(e) {
            returnError(ERROR_MESSAGE);
        }
    }).fail(function() {
        returnError(ERROR_MESSAGE);
    });
}

// Call the PHP endpoint to retrieve the currently stored tweets
function getTweets() {
    $.ajax({
        type: "POST",
        url: "php/tweet_manager.php",
        data: {
            action: "getTweets"
        },
    }).done(function(response) {
        try {
            response = JSON.parse(response);

            if (response.type === "error") {
                // Return the error message to the user
                returnError(response.message);
            } else {
                renderTweets(response, "saved");
            }
        } catch(e) {
            returnError(ERROR_MESSAGE);
        }
    }).fail(function() {
        returnError(ERROR_MESSAGE);
    });
}

// Call the PHP endpoint to add a tweet to the database
function addTweet(tweetId) {
    $.ajax({
        type: "POST",
        url: "php/tweet_manager.php",
        data: {
            action: "addTweet",
            tweet: $("#search form#tweet-" + tweetId).find(".tweet-object").val()
        },
    }).done(function(response) {
        try {
            response = JSON.parse(response);

            if (response.type === "error") {
                returnError(response.message);
            } else if (response.type === "success") {
                returnSuccess(response.message);

                // Retrieve the currently stored tweets
                getTweets();
            }
        } catch(e) {
            returnError(ERROR_MESSAGE);
        }
    }).fail(function() {
        returnError(ERROR_MESSAGE);
    });
}

// Opens a delete confirmation dialog and deletes the tweet on confirm
function deleteTweet(tweetId) {
    console.log(tweetId)
    $('#confirmDelete').modal('show'); 

    $("#confirmDelete button.submit-delete").click(function() {

        // Call the PHP endpoint to delete a tweet from the database
        $.ajax({
            type: "POST",
            url: "php/tweet_manager.php",
            data: {
                action: "deleteTweet",
                tweet: $("#saved form#tweet-" + tweetId).find(".tweet-object").val()
            },
        }).done(function(response) {
            try {
                // Close the delete confirmation modal
                $('#confirmDelete').modal('hide');

                response = JSON.parse(response);
    
                if (response.type === "error") {
                    returnError(response.message);
                } else if (response.type === "success") {
                    returnSuccess(response.message);

                    // Retrieve the currently stored tweets
                    getTweets();
                }
            } catch(e) {
                returnError(ERROR_MESSAGE);
            }
        }).fail(function() {
            returnError(ERROR_MESSAGE);
        });
    });
}