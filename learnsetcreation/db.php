<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);

$mysqli = new mysqli(
    "pihezigo.mysql.db.internal",   // host
    "pihezigo_pu",                  // user
    "Robolution123+",               // password
    "pihezigo_putest"               // database
);

if ($mysqli->connect_error) {
    die("Database connection failed: " . $mysqli->connect_error);
}
?>
