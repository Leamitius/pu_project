<?php
error_reporting(E_ALL);
ini_set('display_errors', 0);  // Don't display errors as HTML
ini_set('log_errors', 1);
ini_set('error_log', __DIR__ . '/error.log');

$mysqli = new mysqli(
    "pihezigo.mysql.db.internal",   // host
    "pihezigo_pu",                  // user
    "Robolution123+",               // password
    "pihezigo_putest"               // database
);

if ($mysqli->connect_error) {
    http_response_code(500);
    die(json_encode(["status" => "error", "message" => "Database connection failed"]));
}
?>
