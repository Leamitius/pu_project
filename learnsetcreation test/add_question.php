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
<html>
<head><title>Add Question</title></head>
<body>
<h1>Add Question to Learnset #<?= htmlspecialchars($set_id) ?></h1>
<form method="post">
  <label>Image URL: <input type="text" name="image_url"></label><br>
  <label>Correct Country: 
    <select name="correct_country" required>
      <?php foreach ($countries as $code => $name): ?>
        <option value="<?= $code ?>"><?= $name ?></option>
      <?php endforeach; ?>
    </select>
  </label><br>
  <button type="submit">Add Question</button>
</form>
</body>
</html>
