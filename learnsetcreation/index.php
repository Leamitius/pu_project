<?php
require 'db.php';
$result = $mysqli->query("SELECT * FROM learnsets ORDER BY created_at DESC");
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Learnsets</title>
  <link rel="stylesheet" href="style.css">
  <script defer src="script.js"></script>
</head>
<body>
  <div class="container">
    <h1>📚 Learnsets</h1>
    <div style="text-align: center; margin-bottom: 20px;">
      <a href="create_set.php"><button>+ New Learnset</button></a>
    </div>
    <ul>
      <?php while ($s = $result->fetch_assoc()): ?>
        <li class="learnset-card">
          <strong><?= htmlspecialchars($s['title']) ?></strong><br>
          <small><?= htmlspecialchars($s['description'] ?? '') ?></small><br><br>
          <a href="add_question.php?set=<?= $s['learnset_id'] ?>">➕ Add Questions</a>
        </li>
      <?php endwhile; ?>
    </ul>
  </div>
</body>
</html>
