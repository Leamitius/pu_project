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
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Create Learnset</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <div class="container">
    <h1>Create Learnset</h1>
    <form method="post" class="form">
      <label>Title:</label>
      <input type="text" name="title" required>
      <label>Description:</label>
      <textarea name="description"></textarea>
      <input type="submit" value="Create">
    </form>
    <p><a href="index.php">⬅ Back to Learnsets</a></p>
  </div>
</body>
</html>
