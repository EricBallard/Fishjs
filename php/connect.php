<?php

$servername = "host";
$database = "database";
$username = "user";
$password = "pass";

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

