<?php

// Block direct access to file, echo js to redirect to index
$ajax = $_GET['ajax'];

if (!$ajax) {
    echo ("<script> window.location.href = '../index.html'; </script>");
    exit();
}

// Create connection
$dbc = new mysqli(
    $_SERVER["mysql_host"],
    $_SERVER["mysql_user"],
    $_SERVER["mysql_pass"],
    $_SERVER["mysql_db"]
);

// Check connection
if ($dbc->connect_errno) {
    echo "Failed to connect to MySQL: " . $mysqli->connect_error;
    exit();
}

// Validate table
/*
$initTable = "CREATE TABLE IF NOT EXISTS `fishjs_vistors` (
    `ip` TEXT NOT NULL,
    `views` INT DEFAULT 1
);";

mysqli_query($dbc, $initTable) or die("Bad Query: $initTable");
*/