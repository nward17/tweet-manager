<?php
    // Do not create a connection object if direct access is being made
    if(!defined('access')) {
        die('Direct access is not permitted.');
    } else {
        // Define messages that can be returned to AJAX
        define('MISSING_HASHTAG', 'Please enter a hashtag to search for.');
        define('TWITTER_API_ERROR', 'An error has occurred contacting the Twitter API.');
        define('DB_ERROR', 'Failed to contact the tweets database.');
        define('SUCCESSFUL_INSERT', 'You have successfully saved the tweet.');
        define('SUCCESSFUL_DELETE', 'You have successfully deleted the tweet.');

        // Define the necessary fields for the Twitter API calls
        define('TWITTER_CONSUMER_KEY', '');
        define('TWITTER_CONSUMER_SECRET', '');
        define('OAUTH_TOKEN_URL', 'https://api.twitter.com/oauth2/token');
        define('SEARCH_TWEETS_URL', 'https://api.twitter.com/1.1/search/tweets.json');

        // Credentials for MySQL server
        $host = 'localhost';
        $username = '';
        $password = '';
        $database = 'tweets';
 
 		// Create the MySQL PDO object
        $conn = new PDO("mysql:host=$host;dbname=$database", $username, $password, array(PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION));
    }
?>