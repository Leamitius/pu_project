<?php

error_reporting(E_ALL);
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
mysqli_report(MYSQLI_REPORT_ERROR | MYSQLI_REPORT_STRICT);


header("Content-Type: application/json");

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

// Include mysqli connection
require_once "db.php";

$data = null;
if (str_contains($_SERVER["CONTENT_TYPE"] ?? "", "application/json")) {
    $data = json_decode(file_get_contents("php://input"), true);
}
$action = $_GET["action"] ?? "";


// ===================================================================
// GET ALL LEARNSETS
// ===================================================================
if ($action === "get_all_sets") {

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


if ($action === "get_all_questions") {

    if (!isset($_GET['learnset_id'])) {
        http_response_code(400);
        echo json_encode([
            "status" => "error",
            "message" => "learnset_id is required"
        ]);
        exit;
    }

    $learnset_id = intval($_GET['learnset_id']);

    $query = "
        SELECT *
        FROM questions
        WHERE learnset_id = ?
        ORDER BY position ASC, created_at ASC
    ";

    $stmt = $mysqli->prepare($query);
    if (!$stmt) {
        http_response_code(500);
        echo json_encode(["status" => "error", "message" => "Prepare failed"]);
        exit;
    }

    $stmt->bind_param("i", $learnset_id);
    $stmt->execute();

    $result = $stmt->get_result();
    if (!$result) {
        http_response_code(500);
        echo json_encode(["status" => "error", "message" => "Query failed"]);
        exit;
    }

    $rows = [];
    while ($row = $result->fetch_assoc()) {
        $rows[] = $row;
    }

    echo json_encode([
        "status" => "success",
        "data" => $rows
    ]);
    exit;
}


// ===================================================================
// GET QUESTIONS BY LEARNSET SLUG
// ===================================================================
if ($action === "get_questions_by_slug") {

    if (!isset($_GET['slug'])) {
        http_response_code(400);
        echo json_encode([
            "status" => "error",
            "message" => "slug is required"
        ]);
        exit;
    }

    $slug = $_GET['slug'];

    // 1. Get learnset_id from slug
    $stmt = $mysqli->prepare("
        SELECT learnset_id, title, description
        FROM learnsets
        WHERE slug = ?
        LIMIT 1
    ");

    if (!$stmt) {
        http_response_code(500);
        echo json_encode(["status" => "error", "message" => "Prepare failed"]);
        exit;
    }

    $stmt->bind_param("s", $slug);
    $stmt->execute();
    $result = $stmt->get_result();

    if ($result->num_rows === 0) {
        http_response_code(404);
        echo json_encode(["status" => "error", "message" => "Learnset not found"]);
        exit;
    }

    $learnset = $result->fetch_assoc();
    $learnset_id = $learnset['learnset_id'];

    // 2. Get questions
    $stmt = $mysqli->prepare("
        SELECT *
        FROM questions
        WHERE learnset_id = ?
        ORDER BY position ASC
    ");

    $stmt->bind_param("i", $learnset_id);
    $stmt->execute();
    $result = $stmt->get_result();

    $questions = [];
    while ($row = $result->fetch_assoc()) {
        $questions[] = $row;
    }

    echo json_encode([
        "status" => "success",
        "learnset" => [
            "learnset_id" => $learnset_id,
            "title" => $learnset['title'],
            "description" => $learnset['description'],
            "slug" => $slug
        ],
        "questions" => $questions
    ]);
    exit;
}


// ===================================================================
// ADD NEW LEARNSET
// ===================================================================
if ($action === "add_sets") {
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
// ADD QUESTION + IMAGE UPLOAD
// ===================================================================
if ($action === "add_question") {

    $learnset_id    = intval($_POST["learnset_id"] ?? 0);
    $question_text  = $_POST["question_text"] ?? "";   // leer erlaubt
    $answer_country = $_POST["answer_country"] ?? "";  // leer erlaubt
    $answer_text = $_POST["answer_text"] ?? "";  // leer erlaubt
    $position       = intval($_POST["position"] ?? 0);

    // ❗ EINZIGE Pflicht
    if (!$learnset_id) {
        http_response_code(400);
        echo json_encode([
            "status" => "error",
            "message" => "learnset_id required"
        ]);
        exit;
    }

    // ---------- IMAGE ----------
    $imagePath = null;

    if (!empty($_FILES["image"]["tmp_name"])) {
        $imagePath = handleImageUpload($_FILES["image"]);
    }

    // ---------- INSERT ----------
    $stmt = $mysqli->prepare("
        INSERT INTO questions
        (learnset_id, question_text, answer_country, answer_text, image, position, created_at)
        VALUES (?, ?, ?, ?, ?, ?, NOW())
    ");

    if (!$stmt) {
        http_response_code(500);
        echo json_encode([
            "status" => "error",
            "message" => "Prepare failed"
        ]);
        exit;
    }

    $stmt->bind_param(
        "issssi",
        $learnset_id,
        $question_text,
        $answer_country,
        $answer_text,
        $imagePath,
        $position
    );

    if (!$stmt->execute()) {
        http_response_code(500);
        echo json_encode([
            "status" => "error",
            "message" => "Insert failed"
        ]);
        exit;
    }

    echo json_encode([
        "status" => "success",
        "question_id" => $stmt->insert_id
    ]);
    exit;
}


// ===================================================================
// DELETE QUESTION (+ image)
// ===================================================================
if ($action === "delete_question") {

    $question_id = intval($_POST["question_id"] ?? $_GET["question_id"] ?? 0);

    if (!$question_id) {
        http_response_code(400);
        echo json_encode([
            "status" => "error",
            "message" => "question_id required"
        ]);
        exit;
    }

    // -----------------------------------------
    // Get image path
    // -----------------------------------------
    $stmt = $mysqli->prepare("SELECT image FROM questions WHERE question_id = ?");
    $stmt->bind_param("i", $question_id);
    $stmt->execute();
    $res = $stmt->get_result();
    $row = $res->fetch_assoc();

    if (!$row) {
        http_response_code(404);
        echo json_encode([
            "status" => "error",
            "message" => "Question not found"
        ]);
        exit;
    }

    $imagePath = $row["image"];

    // -----------------------------------------
    // Delete DB row
    // -----------------------------------------
    $stmt = $mysqli->prepare("DELETE FROM questions WHERE question_id = ?");
    $stmt->bind_param("i", $question_id);

    if (!$stmt->execute()) {
        http_response_code(500);
        echo json_encode([
            "status" => "error",
            "message" => "Delete failed"
        ]);
        exit;
    }

    // -----------------------------------------
    // Delete image file
    // -----------------------------------------
    if ($imagePath) {
        $fullPath = __DIR__ . $imagePath;
        if (file_exists($fullPath)) {
            @unlink($fullPath);
        }
    }

    echo json_encode([
        "status" => "success"
    ]);
    exit;
}



// ===================================================================
// UPDATE QUESTION (+ optional image)
// ===================================================================
if ($action === "update_question") {

    $question_id    = intval($_POST["question_id"] ?? 0);
    $question_text  = trim($_POST["question_text"] ?? "");
    $answer_country = trim($_POST["answer_country"] ?? "");
    $answer_text    = trim($_POST["answer_text"] ?? "");
    $position       = intval($_POST["position"] ?? 0);
    $remove_image   = intval($_POST["remove_image"] ?? 0);

    if (
        !$question_id ||
        !isset($_POST["question_text"]) ||
        !isset($_POST["answer_country"])
    ) {
        http_response_code(400);
        echo json_encode([
            "status" => "error",
            "message" => "Missing fields"
        ]);
        exit;
    }


    // --------------------------------------------------
    // Get current image
    // --------------------------------------------------
    $stmt = $mysqli->prepare("SELECT image FROM questions WHERE question_id = ?");
    $stmt->bind_param("i", $question_id);
    $stmt->execute();
    $current = $stmt->get_result()->fetch_assoc();

    if (!$current) {
        http_response_code(404);
        echo json_encode(["status" => "error", "message" => "Question not found"]);
        exit;
    }

    $imagePath = $current["image"];

    // --------------------------------------------------
    // Remove image
    // --------------------------------------------------
    if ($remove_image === 1 && $imagePath) {
        @unlink(__DIR__ . $imagePath);
        $imagePath = null;
    }

    // --------------------------------------------------
    // New image upload
    // --------------------------------------------------
    if (!empty($_FILES["image"]["tmp_name"])) {

        // delete old image
        if ($imagePath) {
            @unlink(__DIR__ . $imagePath);
        }

        $imagePath = handleImageUpload($_FILES["image"]);
    }

    // --------------------------------------------------
    // Update DB
    // --------------------------------------------------
    $stmt = $mysqli->prepare("
        UPDATE questions
        SET question_text = ?, answer_country = ?, answer_text = ?, image = ?, position = ?
        WHERE question_id = ?
    ");

    $stmt->bind_param(
        "ssssii",
        $question_text,
        $answer_country,
        $answer_text,
        $imagePath,
        $position,
        $question_id
    );

    if (!$stmt->execute()) {
        http_response_code(500);
        echo json_encode(["status" => "error", "message" => "Update failed"]);
        exit;
    }

    echo json_encode(["status" => "success"]);
    exit;
}




if ($action === "create_learnset") {

    $title = trim($_POST["title"] ?? "");
    $description = trim($_POST["description"] ?? "");

    if ($title === "") {
        http_response_code(400);
        echo json_encode(["status" => "error", "message" => "Title required"]);
        exit;
    }

    // ---------- SLUG ----------
    $baseSlug = generateSlug($title);
    $slug = $baseSlug;
    $i = 1;

    while (true) {
        $stmt = $mysqli->prepare("SELECT 1 FROM learnsets WHERE slug = ?");
        $stmt->bind_param("s", $slug);
        $stmt->execute();
        if ($stmt->get_result()->num_rows === 0) break;
        $slug = $baseSlug . "-" . $i++;
    }

    // ---------- INSERT ----------
    $stmt = $mysqli->prepare("
        INSERT INTO learnsets (title, description, slug, created_at)
        VALUES (?, ?, ?, NOW())
    ");

    $stmt->bind_param("sss", $title, $description, $slug);

    if (!$stmt->execute()) {
        http_response_code(500);
        echo json_encode(["status" => "error", "message" => "Insert failed"]);
        exit;
    }

    echo json_encode([
        "status" => "success",
        "learnset_id" => $stmt->insert_id,
        "slug" => $slug
    ]);
    exit;
}


if ($action === "update_learnset") {

    $learnset_id = intval($_POST["learnset_id"] ?? 0);
    $title = trim($_POST["title"] ?? "");
    $description = trim($_POST["description"] ?? "");

    if (!$learnset_id || $title === "") {
        http_response_code(400);
        echo json_encode(["status" => "error"]);
        exit;
    }

    $stmt = $mysqli->prepare("
        UPDATE learnsets
        SET title = ?, description = ?
        WHERE learnset_id = ?
    ");

    $stmt->bind_param("ssi", $title, $description, $learnset_id);

    if (!$stmt->execute()) {
        http_response_code(500);
        echo json_encode(["status" => "error"]);
        exit;
    }

    echo json_encode(["status" => "success"]);
    exit;
}


if ($action === "delete_learnset") {
    $id = intval($_GET["learnset_id"] ?? 0);

    $mysqli->query("DELETE FROM questions WHERE learnset_id = $id");
    $mysqli->query("DELETE FROM learnsets WHERE learnset_id = $id");

    echo json_encode(["status" => "success"]);
    exit;
}



// ===================================================================
// INVALID ACTION
// ===================================================================
echo json_encode(["status" => "error", "message" => "Invalid action"]);
exit;

function generateSlug($string)
{
    $slug = strtolower(trim($string));
    $slug = preg_replace('/[^a-z0-9]+/', '-', $slug);
    $slug = trim($slug, '-');
    return $slug;
}


function handleImageUpload($file)
{
    if ($file["error"] !== UPLOAD_ERR_OK) {
        echo json_encode(["status" => "error", "message" => "Upload failed"]);
        exit;
    }

    $allowed = ["image/jpeg", "image/png", "image/webp"];
    $mime = mime_content_type($file["tmp_name"]);

    if (!in_array($mime, $allowed)) {
        echo json_encode(["status" => "error", "message" => "Invalid image type"]);
        exit;
    }

    $dir = __DIR__ . "/uploads/questions/";
    if (!is_dir($dir)) mkdir($dir, 0755, true);

    $filename = uniqid("q_") . ".jpg";
    $target = $dir . $filename;

    compressImage($file["tmp_name"], $target);

    if (!file_exists($target)) {
        echo json_encode(["status" => "error", "message" => "Image save failed"]);
        exit;
    }

    return "/uploads/questions/" . $filename;
}



function compressImage($src, $dest)
{
    $info = getimagesize($src);
    if (!$info) {
        throw new Exception("Invalid image");
    }

    // ---------------------------------------
    // Load image
    // ---------------------------------------
    switch ($info["mime"]) {
        case "image/png":
            $img = imagecreatefrompng($src);
            imagepalettetotruecolor($img);
            imagealphablending($img, true);
            imagesavealpha($img, false);
            break;

        case "image/webp":
            $img = imagecreatefromwebp($src);
            break;

        case "image/jpeg":
            $img = imagecreatefromjpeg($src);
            break;

        default:
            throw new Exception("Unsupported image type");
    }

    if (!$img) {
        throw new Exception("Could not load image");
    }

    // ---------------------------------------
    // Compress loop
    // ---------------------------------------
    $quality = 85;

    do {
        imagejpeg($img, $dest, $quality);
        $quality -= 5;
    } while (filesize($dest) > 2 * 1024 * 1024 && $quality >= 40);

    imagedestroy($img);
}
