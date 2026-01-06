<?php

ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);
mysqli_report(MYSQLI_REPORT_ERROR | MYSQLI_REPORT_STRICT);



header("Content-Type: application/json");

session_set_cookie_params([
    'lifetime' => 0,
    'path' => '/',
    'domain' => '.geolearnr.ch',
    'secure' => true,
    'httponly' => true,
    'samesite' => 'None'
]);

session_start();


$allowedOrigins = [
    "https://geolearnr.ch"
];

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';

if (in_array($origin, $allowedOrigins, true)) {
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


if ($action === "get_public_learnsets") {

    $result = $mysqli->query("
        SELECT learnset_id, title, description, slug
        FROM learnsets
        WHERE state = 'visible'
        ORDER BY created_at DESC
    ");

    echo json_encode([
        "status" => "success",
        "data" => $result->fetch_all(MYSQLI_ASSOC)
    ]);
    exit;
}


if ($action === "get_public_questions_by_slug") {

    $slug = $_GET["slug"] ?? "";

    $stmt = $mysqli->prepare("
        SELECT learnset_id, title, description, state
        FROM learnsets
        WHERE slug = ?
        LIMIT 1
    ");
    $stmt->bind_param("s", $slug);
    $stmt->execute();

    $learnset = $stmt->get_result()->fetch_assoc();

    if (!$learnset) {
        http_response_code(404);
        exit;
    }

    // ⛔ Hidden Sets dürfen NICHT öffentlich geladen werden
    if ($learnset["state"] === "hidden") {
        http_response_code(403);
        echo json_encode(["status" => "forbidden"]);
        exit;
    }

    $stmt = $mysqli->prepare("
        SELECT question_text, answer_country, answer_text, image
        FROM questions
        WHERE learnset_id = ?
        ORDER BY position ASC
    ");
    $stmt->bind_param("i", $learnset["learnset_id"]);
    $stmt->execute();

    echo json_encode([
        "status" => "success",
        "learnset" => $learnset,
        "questions" => $stmt->get_result()->fetch_all(MYSQLI_ASSOC)
    ]);
    exit;
}


if ($action === "get_all_sets") {

    $auth = requireAuth();
    $user_id = $auth["user_id"];
    $isAdmin = ($auth["role"] === "admin");

    if ($isAdmin) {
        $stmt = $mysqli->prepare("
            SELECT * FROM learnsets ORDER BY created_at DESC
        ");
    } else {
        $stmt = $mysqli->prepare("
            SELECT * FROM learnsets
            WHERE user_id = ?
            ORDER BY created_at DESC
        ");
        $stmt->bind_param("s", $user_id);
    }

    $stmt->execute();
    $res = $stmt->get_result();

    $rows = [];
    while ($row = $res->fetch_assoc()) {
        $rows[] = $row;
    }

    echo json_encode(["status" => "success", "data" => $rows]);
    exit;
}


if ($action === "get_questions_by_slug") {

    $auth = requireAuth();
    $user_id = $auth["user_id"];
    $isAdmin = ($auth["role"] === "admin");

    $slug = $_GET["slug"] ?? "";

    $stmt = $mysqli->prepare("
        SELECT *
        FROM learnsets
        WHERE slug = ?
        AND (user_id = ? OR ? = 1)
        LIMIT 1
    ");
    $stmt->bind_param("ssi", $slug, $user_id, $isAdmin);
    $stmt->execute();

    $learnset = $stmt->get_result()->fetch_assoc();

    if (!$learnset) {
        http_response_code(403);
        echo json_encode(["status" => "forbidden"]);
        exit;
    }

    $stmt = $mysqli->prepare("
        SELECT *
        FROM questions
        WHERE learnset_id = ?
        ORDER BY position ASC
    ");
    $stmt->bind_param("i", $learnset["learnset_id"]);
    $stmt->execute();

    echo json_encode([
        "status" => "success",
        "learnset" => $learnset,
        "questions" => $stmt->get_result()->fetch_all(MYSQLI_ASSOC)
    ]);
    exit;
}


if ($action === "add_question") {

    $auth = requireAuth();
    $user_id = $auth["user_id"];
    $isAdmin = ($auth["role"] === "admin");

    $learnset_id = intval($_POST["learnset_id"] ?? 0);

    if (!$learnset_id) {
        http_response_code(400);
        echo json_encode(["status" => "error"]);
        exit;
    }

    $stmt = $mysqli->prepare("
        SELECT 1 FROM learnsets
        WHERE learnset_id = ?
        AND (user_id = ? OR ? = 1)
    ");
    $stmt->bind_param("isi", $learnset_id, $user_id, $isAdmin);
    $stmt->execute();

    if ($stmt->get_result()->num_rows === 0) {
        http_response_code(403);
        exit;
    }

    $imagePath = null;
    if (!empty($_FILES["image"]["tmp_name"])) {
        $imagePath = handleImageUpload($_FILES["image"]);
    }

    $stmt = $mysqli->prepare("
        INSERT INTO questions
        (learnset_id, question_text, answer_country, answer_text, image, position, created_at)
        VALUES (?, ?, ?, ?, ?, ?, NOW())
    ");

    $position = intval($_POST["position"] ?? 0);

    $stmt->bind_param(
        "issssi",
        $learnset_id,
        $_POST["question_text"],
        $_POST["answer_country"],
        $_POST["answer_text"],
        $imagePath,
        $position
    );


    $stmt->execute();

    echo json_encode(["status" => "success"]);
    exit;
}


if ($action === "delete_question") {

    $auth = requireAuth();
    $user_id = $auth["user_id"];
    $isAdmin = ($auth["role"] === "admin");

    $question_id = intval($_POST["question_id"] ?? 0);

    $stmt = $mysqli->prepare("
        SELECT q.image
        FROM questions q
        JOIN learnsets l ON q.learnset_id = l.learnset_id
        WHERE q.question_id = ?
        AND (l.user_id = ? OR ? = 1)
    ");
    $stmt->bind_param("isi", $question_id, $user_id, $isAdmin);
    $stmt->execute();

    $row = $stmt->get_result()->fetch_assoc();
    if (!$row) {
        http_response_code(403);
        exit;
    }

    if ($row["image"]) {
        @unlink(__DIR__ . $row["image"]);
    }

    $stmt = $mysqli->prepare("DELETE FROM questions WHERE question_id = ?");
    $stmt->bind_param("i", $question_id);
    $stmt->execute();

    echo json_encode(["status" => "success"]);
    exit;
}


if ($action === "update_question") {

    $auth = requireAuth();
    $user_id = $auth["user_id"];
    $isAdmin = ($auth["role"] === "admin");

    $question_id = intval($_POST["question_id"] ?? 0);

    $stmt = $mysqli->prepare("
        SELECT q.image
        FROM questions q
        JOIN learnsets l ON q.learnset_id = l.learnset_id
        WHERE q.question_id = ?
        AND (l.user_id = ? OR ? = 1)
    ");
    $stmt->bind_param("isi", $question_id, $user_id, $isAdmin);
    $stmt->execute();

    $row = $stmt->get_result()->fetch_assoc();
    if (!$row) {
        http_response_code(403);
        exit;
    }

    $imagePath = $row["image"];

    // 1️⃣ Bild explizit entfernen
    if (!empty($_POST["remove_image"]) && $_POST["remove_image"] == "1") {
        if ($imagePath && file_exists(__DIR__ . $imagePath)) {
            unlink(__DIR__ . $imagePath);
        }
        $imagePath = null;
    }

    // 2️⃣ Neues Bild hochladen (ersetzt immer das alte)
    if (!empty($_FILES["image"]["tmp_name"])) {
        if ($imagePath && file_exists(__DIR__ . $imagePath)) {
            unlink(__DIR__ . $imagePath);
        }
        $imagePath = handleImageUpload($_FILES["image"]);
    }


    $stmt = $mysqli->prepare("
        UPDATE questions
        SET question_text = ?, answer_country = ?, answer_text = ?, image = ?
        WHERE question_id = ?
    ");
    $stmt->bind_param(
        "ssssi",
        $_POST["question_text"],
        $_POST["answer_country"],
        $_POST["answer_text"],
        $imagePath,
        $question_id
    );

    $stmt->execute();
    echo json_encode(["status" => "success"]);
    exit;
}


if ($action === "create_learnset") {

    $auth = requireAuth();
    $user_id = $auth["user_id"];

    $title = trim($_POST["title"] ?? "");
    $description = trim($_POST["description"] ?? "");

    if ($title === "") {
        http_response_code(400);
        echo json_encode(["status" => "error", "message" => "Title required"]);
        exit;
    }

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

    $stmt = $mysqli->prepare("
        INSERT INTO learnsets (title, description, slug, user_id, created_at)
        VALUES (?, ?, ?, ?, NOW())
    ");
    $stmt->bind_param("ssss", $title, $description, $slug, $user_id);
    $stmt->execute();

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

    $auth = requireAuth();
    $user_id = $auth["user_id"];

    $stmt = $mysqli->prepare("
    UPDATE learnsets
    SET title = ?, description = ?
    WHERE learnset_id = ? AND user_id = ?");
    $stmt->bind_param("ssis", $title, $description, $learnset_id, $user_id);

    if (!$stmt->execute()) {
        http_response_code(500);
        echo json_encode(["status" => "error"]);
        exit;
    }

    echo json_encode(["status" => "success"]);
    exit;
}


if ($action === "delete_learnset") {

    $auth = requireAuth();
    $user_id = $auth["user_id"];
    $isAdmin = ($auth["role"] === "admin");

    $learnset_id = intval($_GET["learnset_id"] ?? 0);

    $stmt = $mysqli->prepare("
        SELECT 1 FROM learnsets
        WHERE learnset_id = ?
        AND (user_id = ? OR ? = 1)
    ");
    $stmt->bind_param("isi", $learnset_id, $user_id, $isAdmin);
    $stmt->execute();

    if ($stmt->get_result()->num_rows === 0) {
        http_response_code(403);
        exit;
    }

    $mysqli->query("DELETE FROM questions WHERE learnset_id = $learnset_id");
    $mysqli->query("DELETE FROM learnsets WHERE learnset_id = $learnset_id");

    echo json_encode(["status" => "success"]);
    exit;
}


if ($action === "toggle_visibility") {

    $auth = requireAuth();
    $user_id = $auth["user_id"];
    $isAdmin = ($auth["role"] === "admin");

    $learnset_id = intval($_POST["learnset_id"] ?? 0);
    if (!$learnset_id) {
        http_response_code(400);
        echo json_encode(["status" => "error"]);
        exit;
    }

    // Prüfen ob der User Zugriff hat (Owner oder Admin)
    $stmt = $mysqli->prepare("
        SELECT 1 FROM learnsets
        WHERE learnset_id = ?
        AND (user_id = ? OR ? = 1)
    ");
    $stmt->bind_param("isi", $learnset_id, $user_id, $isAdmin);
    $stmt->execute();

    if ($stmt->get_result()->num_rows === 0) {
        http_response_code(403);
        echo json_encode(["status" => "forbidden"]);
        exit;
    }

    // State umschalten
    $stmt = $mysqli->prepare("
        UPDATE learnsets
        SET state = IF(state='visible','hidden','visible')
        WHERE learnset_id = ?
    ");
    $stmt->bind_param("i", $learnset_id);

    if (!$stmt->execute()) {
        http_response_code(500);
        echo json_encode(["status" => "error"]);
        exit;
    }

    echo json_encode(["status" => "success"]);
    exit;
}


if ($action === "me") {
    // session_start();

    echo json_encode([
        "logged_in" => isset($_SESSION["user_id"]),
        "user_id"   => $_SESSION["user_id"] ?? null,
        "name"      => $_SESSION["name"] ?? null,
        "picture"   => $_SESSION["picture"] ?? null,
        "role"      => $_SESSION["role"] ?? "user"
    ]);
    exit;
}


if ($action === "google_login") {
    // session_start();

    $input = json_decode(file_get_contents("php://input"), true);

    $idToken =
        $_POST["credential"]
        ?? $_POST["id_token"]
        ?? $input["credential"]
        ?? $input["id_token"]
        ?? null;

    if (!$idToken) {
        http_response_code(400);
        echo json_encode(["status" => "error", "message" => "Missing id token"]);
        exit;
    }

    $data = verifyGoogleToken($idToken);
    if (!$data) {
        http_response_code(401);
        echo json_encode(["status" => "error"]);
        exit;
    }

    $user_id = $data["sub"];
    $email   = $data["email"] ?? null;
    $name    = $data["name"] ?? null;
    $picture = $data["picture"] ?? null;

    // ✅ USER ANLEGEN ODER AKTUALISIEREN
    $stmt = $mysqli->prepare("
        INSERT INTO users (user_id, email, name, picture)
        VALUES (?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
            email = VALUES(email),
            name = VALUES(name),
            picture = VALUES(picture)
    ");
    $stmt->bind_param("ssss", $user_id, $email, $name, $picture);
    $stmt->execute();

    // ✅ ROLE AUS DB LADEN
    $stmt = $mysqli->prepare("
        SELECT role FROM users WHERE user_id = ?
    ");
    $stmt->bind_param("s", $user_id);
    $stmt->execute();
    $user = $stmt->get_result()->fetch_assoc();

    // ✅ SESSION SETZEN
    $_SESSION["user_id"] = $user_id;
    $_SESSION["name"]    = $name;
    $_SESSION["picture"] = $picture;
    $_SESSION["role"]    = $user["role"] ?? "user";

    echo json_encode(["status" => "success"]);
    exit;
}


if ($action === "logout") {
    // session_start();
    session_destroy();

    echo json_encode(["status" => "success"]);
    exit;
}


if ($action === "session_debug") {
    // session_start(); // Falls noch nicht gestartet

    echo json_encode([
        "session_id" => session_id(),
        "session" => $_SESSION,
        "cookies" => $_COOKIE
    ]);
    exit;
}


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
    try {
        if ($file["error"] !== UPLOAD_ERR_OK) {
            throw new Exception("Upload failed");
        }

        $allowed = ["image/jpeg", "image/png", "image/webp"];
        $mime = mime_content_type($file["tmp_name"]);

        if (!in_array($mime, $allowed, true)) {
            throw new Exception("Invalid image type");
        }

        $dir = __DIR__ . "/uploads/questions/";
        if (!is_dir($dir)) mkdir($dir, 0755, true);

        $filename = uniqid("q_") . ".jpg";
        $target = $dir . $filename;

        compressImage($file["tmp_name"], $target);

        if (!file_exists($target)) {
            throw new Exception("Image save failed");
        }

        return "/uploads/questions/" . $filename;
    } catch (Throwable $e) {
        http_response_code(400);
        echo json_encode([
            "status" => "error",
            "message" => $e->getMessage()
        ]);
        exit;
    }
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


function requireAuth()
{
    // session_start();

    if (!isset($_SESSION["user_id"])) {
        http_response_code(401);
        echo json_encode(["status" => "unauthorized"]);
        exit;
    }

    return [
        "user_id" => $_SESSION["user_id"],
        "role"    => $_SESSION["role"] ?? "user"
    ];
}


function verifyGoogleToken($idToken)
{
    $url = "https://oauth2.googleapis.com/tokeninfo?id_token=" . urlencode($idToken);
    $response = file_get_contents($url);
    if (!$response) return null;

    $data = json_decode($response, true);
    if (!isset($data["sub"])) return null;

    return $data;
}
