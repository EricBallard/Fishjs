<?php
require 'connect.php';

// Get total vistors in db
$result = mysqli_query($dbc, "SELECT * FROM fishjs_vistors");
$vistors = mysqli_num_rows($result);

echo "$vistors";
mysqli_close($dbc);

?>