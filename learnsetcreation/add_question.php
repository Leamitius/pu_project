<?php
require 'db.php';

$set_id = $_GET['set'] ?? null;
if (!$set_id) {
    die("No learnset selected.");
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $stmt = $mysqli->prepare("INSERT INTO geo_questions (learnset_id, image_url, correct_country) VALUES (?, ?, ?)");
    $stmt->bind_param("iss", $set_id, $_POST['image_url'], $_POST['correct_country']);
    $stmt->execute();
}

$countries = [
    "FR" => "France",
    "DE" => "Germany",
    "IT" => "Italy",
    "ES" => "Spain",
    "US" => "United States",
    "CN" => "China"
];
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Add Question</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <div class="container">
    <h1>Add Question to Learnset #<?= htmlspecialchars($set_id) ?></h1>
    <form method="post" class="form">
      <label>Image URL:</label>
      <input type="text" name="image_url" placeholder="https://example.com/image.jpg" required>
      <label>Correct Country:</label>
      <select name="correct_country" required>
        <?php foreach ($countries as $code => $name): ?>
          <option value="<?= $code ?>"><?= $name ?></option>
        <?php endforeach; ?>
      </select>
      <input type="submit" value="Add Question">
    </form>
    <p><a href="index.php">⬅ Back to Learnsets</a></p>
  </div>
</body>
</html>
