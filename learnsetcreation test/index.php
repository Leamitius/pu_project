<?php
require 'db.php';

$result = $mysqli->query("SELECT * FROM learnsets ORDER BY created_at DESC");
?>
<!DOCTYPE html>
<html>
<head><title>Learnsets</title></head>
<body>
<h1>Learnsets</h1>
<a href="create_set.php">+ New Learnset</a>
<ul>
<?php while ($s = $result->fetch_assoc()): ?>
  <li>
    <strong><?= htmlspecialchars($s['title']) ?></strong> 
    (<a href="add_question.php?set=<?= $s['learnset_id'] ?>">Add Questions</a>)
  </li>
<?php endwhile; ?>
</ul>
</body>
</html>
