<?php

$servername = "webbiker-database.czw3xqzkib0h.us-east-2.rds.amazonaws.com";
$database = "portfolio_database";
$username = "admin";
$password = "Pa55word";

// Create connection
$dbc = new mysqli($servername, $username, $password, $database);

// Check connection
if ($dbc -> connect_errno) {
    echo "Failed to connect to MySQL: " . $mysqli -> connect_error;
    exit();
}

// Validate table
$initTable = "CREATE TABLE IF NOT EXISTS `fishjs_vistors` (
    `ip` TEXT NOT NULL,
    `views` INT DEFAULT 1
);";

mysqli_query($dbc, $initTable) or die("Bad Query: $initTable");

?>

