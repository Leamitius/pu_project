<?php
$allowedOrigins = [
    '*'
];

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';

if (in_array($origin, $allowedOrigins)) {
    header("Access-Control-Allow-Origin: $origin");
    header("Access-Control-Allow-Credentials: true");
}

header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

header("Content-Type: application/json");

// Include mysqli connection
require_once "db.php";

$data = json_decode(file_get_contents("php://input"), true);
$action = $_GET["action"] ?? "";


// ===================================================================
// GET ALL LEARNSETS
// ===================================================================
if ($action === "get_all") {

    $query = "SELECT * FROM learnsets ORDER BY created_at DESC";
    $result = $mysqli->query($query);

    if (!$result) {
        http_response_code(500);
        echo json_encode(["status" => "error", "message" => "Database query failed"]);
        exit;
    }

    $rows = [];
    while ($row = $result->fetch_assoc()) {
        $rows[] = $row;
    }

    echo json_encode(["status" => "success", "data" => $rows]);
    exit;
}


// ===================================================================
// ADD NEW LEARNSET
// ===================================================================
if ($action === "add") {
    $user_id     = $data["user_id"] ?? null;
    $title       = $data["title"] ?? null;
    $description = $data["description"] ?? null;

    if (!$user_id || !$title) {
        http_response_code(400);
        echo json_encode(["status" => "error", "message" => "Missing user_id or title"]);
        exit;
    }

    $stmt = $mysqli->prepare("
        INSERT INTO learnsets (user_id, title, description)
        VALUES (?, ?, ?)
    ");

    if (!$stmt) {
        http_response_code(500);
        echo json_encode(["status" => "error", "message" => "Prepare failed"]);
        exit;
    }

    $stmt->bind_param("iss", $user_id, $title, $description);
    $success = $stmt->execute();

    if (!$success) {
        http_response_code(500);
        echo json_encode(["status" => "error", "message" => "Insert failed"]);
        exit;
    }

    echo json_encode(["status" => "success"]);
    exit;
}


// ===================================================================
// INVALID ACTION
// ===================================================================
echo json_encode(["status" => "error", "message" => "Invalid action"]);
exit;
