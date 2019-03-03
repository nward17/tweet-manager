<?php
	// Do not allow API access unless POST data exists
	if(isset($_POST) && !empty($_POST)) {
        define('access', true);
        
        // Require the database configuration file
		require('config.php');

        // Retrieve the endpoint call
	    $action = $_POST['action'];

	    // Route call to API function
	    switch($action) {
	    	case 'searchTwitterHashtags' : searchTwitterHashtags(); break;
	    	case 'getTweets' : getTweets(); break;
            case 'addTweet' : addTweet(); break;
            case 'deleteTweet' : deleteTweet(); break;
	    }
	} else {
        die('Direct access is not permitted.');
    }

    // Send an error message back to the AJAX call
    function returnError($message) {
        die(json_encode(array('type' => 'error', 'message' => $message)));
    }

    // Send a success message back to the AJAX call
    function returnSuccess($message) {
        echo json_encode(array('type' => 'success', 'message' => $message));
    }

    // Call the Twitter API and search for tweets
	function searchTwitterHashtags() {
        $hashtag = trim($_POST['hashtag']);

        // Do not query with an empty hashtag
        if ($hashtag === '') {
            returnError(MISSING_HASHTAG);
        }

        // Get the API token for the session
        $auth = base64_encode(urlencode(TWITTER_CONSUMER_KEY) . ':' . urlencode(TWITTER_CONSUMER_SECRET));
        $options = array(
            CURLOPT_URL => OAUTH_TOKEN_URL,
            CURLOPT_HTTPHEADER => array('Authorization: Basic ' . $auth),
            CURLOPT_POSTFIELDS => "grant_type=client_credentials",
            CURLOPT_RETURNTRANSFER => 1
        );
        $getToken = curl_init();
        curl_setopt_array($getToken, $options);
        $token = json_decode(curl_exec($getToken));
        $token = $token->access_token;
        curl_close($getToken);

        // An API token must exist otherwise the next call will fail
        if ($token === '') {
            returnError(TWITTER_API_ERROR);
        }

        // Get the Tweets based on the hashtag
        $searchEndpoint = SEARCH_TWEETS_URL . '?q=' . urlencode($hashtag) . '&result_type=recent&tweet_mode=extended';
        $options = array(
            CURLOPT_URL => $searchEndpoint,
            CURLOPT_HTTPHEADER => array('Authorization: Bearer ' . $token)
        );
        $getTweets = curl_init();
        curl_setopt_array($getTweets, $options);
        curl_exec($getTweets);
        curl_close($getTweets);
    }

    // Retrieve the tweets from the database
    function getTweets() {
        global $conn;
        
        try {
            // Return the newest first
            $stmt = $conn->prepare("SELECT * FROM tweets ORDER BY id DESC");
            $stmt->execute();
            $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
            echo json_encode($rows);
        } catch(PDOException $exception) {
            returnError(DB_ERROR);
        }
    }
    
    // Add a tweet to the database
    function addTweet() {
        global $conn;

        // Array of tweet parameters
        $tweet = json_decode($_POST['tweet'], true);

        // Format twitter date
        $date = date('Y-m-d H:i:s', strtotime($tweet['createdAt']));
        
        $tweetToInsert = array(
            ':id_str' => $tweet['tweetId'],
            ':profile_image_url_https' => $tweet['image'],
            ':name' => $tweet['name'],
            ':screen_name' => $tweet['handle'],
            ':full_text' => $tweet['text'],
            ':created_at' => $date
        );

        try {
            // Attempt to insert the tweet
            $stmt = $conn->prepare("INSERT INTO tweets (id_str, profile_image_url_https, name, screen_name, full_text, created_at)
                                    VALUES (:id_str, :profile_image_url_https, :name, :screen_name, :full_text, :created_at)");
            $stmt->execute($tweetToInsert);
        } catch(PDOException $exception) {
            returnError(DB_ERROR);
        }

        returnSuccess(SUCCESSFUL_INSERT);
    }

    // Delete a tweet from the database
    function deleteTweet() {
        global $conn;

        // Array of tweet parameters
        $tweet = json_decode($_POST['tweet'], true);

        //The primary key of the tweet that we are deleting
        $id = $tweet['id'];

        try {
            // Attempt to delete the tweet
            $stmt = $conn->prepare("DELETE FROM tweets WHERE id = :id");
            $stmt->execute(array(':id' => $id));
        } catch(PDOException $exception) {
            returnError(DB_ERROR);
        }

        returnSuccess(SUCCESSFUL_DELETE);
    }
?>