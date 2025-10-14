<?php
require 'db.php';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $stmt = $mysqli->prepare("INSERT INTO learnsets (title, description) VALUES (?, ?)");
    $stmt->bind_param("ss", $_POST['title'], $_POST['description']);
    $stmt->execute();
    header("Location: index.php");
    exit;
}
?>
<!DOCTYPE html>
<html>
<head><title>Create Learnset</title></head>
<body>
<h1>Create Learnset</h1>
<form method="post">
  <label>Title: <input type="text" name="title" required></label><br>
  <label>Description: <textarea name="description"></textarea></label><br>
  <button type="submit">Create</button>
</form>
</body>
</html>
