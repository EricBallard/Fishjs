<?php

// Connect
require 'connect.php';

// Cache user ip
$userIP = $_SERVER['REMOTE_ADDR'];

// Cache views related to ip
$sql = "SELECT views FROM fishjs_vistors WHERE ip = '$userIP'";
$result = mysqli_query($dbc, $sql);

// Validate result
if (
    !empty($result)
    && isset($result)
    && ($array = mysqli_fetch_array($result)) != null
) {
    // Welcome back :')
    $views = (int)$array[0];
    $views += (int)1;

    $query = "UPDATE fishjs_vistors SET views = '$views' WHERE ip = '$userIP'";
} else {
    // First connection
    $views = (int)1;
    $query = "INSERT INTO fishjs_vistors (ip, views) values ('$userIP', $views)";
}

// Return views with punctuation
$result = $views == 1 ? $views .= " time" : $views .= " times";
echo "$result";

// Update db with new view
mysqli_query($dbc, $query);
mysqli_close($dbc);
