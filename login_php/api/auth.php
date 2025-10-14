<?php
session_start();
header('Content-Type: application/json');

// Your Google OAuth 2.0 client ID
$CLIENT_ID = '882122884872-lqc2utdp744cju280483c0qt9bmtns5m.apps.googleusercontent.com';

// Get POSTed token
$input = json_decode(file_get_contents('php://input'), true);
$id_token = $input['token'] ?? '';

if (!$id_token) {
    echo json_encode(['success'=>false,'message'=>'No token provided']);
    exit;
}

// Helper: decode base64 URL
function base64UrlDecode($input) {
    $remainder = strlen($input) % 4;
    if ($remainder) {
        $input .= str_repeat('=', 4 - $remainder);
    }
    return base64_decode(strtr($input, '-_', '+/'));
}

// Split JWT
$jwt_parts = explode('.', $id_token);
if (count($jwt_parts) != 3) {
    echo json_encode(['success'=>false,'message'=>'Invalid token']);
    exit;
}

// Decode payload
$payload = json_decode(base64UrlDecode($jwt_parts[1]), true);

// Verify audience
if ($payload['aud'] !== $CLIENT_ID) {
    echo json_encode(['success'=>false,'message'=>'Invalid audience']);
    exit;
}

// Verify expiry
if ($payload['exp'] < time()) {
    echo json_encode(['success'=>false,'message'=>'Token expired']);
    exit;
}

// Token is valid, extract user info
$name = $payload['name'] ?? 'User';
$email = $payload['email'] ?? '';
$picture = $payload['picture'] ?? '';

// Connect to MySQL
$mysqli = new mysqli("pihezigo.mysql.db.internal", "pihezigo_pu", "Robolution123+", "pihezigo_putest");
if ($mysqli->connect_errno) {
    echo json_encode(['success'=>false,'message'=>'DB connection failed']);
    exit;
}

// Escape input
$name = $mysqli->real_escape_string($name);
$email = $mysqli->real_escape_string($email);
$picture = $mysqli->real_escape_string($picture);

// Check if user exists
$result = $mysqli->query("SELECT * FROM users WHERE email='$email'");
if ($result->num_rows === 0) {
    $mysqli->query("INSERT INTO users (name,email,picture) VALUES ('$name','$email','$picture')");
}

// Save session
$_SESSION['user'] = [
    'name' => $name,
    'email' => $email,
    'picture' => $picture
];

echo json_encode(['success'=>true,'user'=>$_SESSION['user']]);
