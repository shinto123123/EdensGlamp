<?php
session_start();
$host = "localhost";
$user = "root";
$pass = "";
$db = "mini_project";

$conn = new mysqli($host, $user, $pass, $db);

if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}

// Assume user's email is stored in session after login/registration
$email = $_SESSION['email'] ?? '';


$name = '';
if ($email) {
    $stmt = $conn->prepare("SELECT name FROM tbl_customer WHERE email = ?");
    $stmt->bind_param("s", $email);
    $stmt->execute();
    $stmt->bind_result($name);
    $stmt->fetch();
    $stmt->close();
}
$conn->close();
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Service Appointment Website</title>
<link rel="stylesheet" href="/mini_project/home.css">
  <link rel="stylesheet" href="loggedin.css" >
  
</head>
<body>



  <header class="navbar">
    <div class="logo"><a href="home.html">Service Appointment Scheduler</a></div>
    <nav class="nav-links">
      <a href="#">Services</a>
      <a href="#">Pricing</a>
      <a href="#">About us</a>
      <a href="#">Contact us</a>
    </nav>
    <div class="user-actions">
      <a href="#" class="subscription-btn">Subscribe</a>
      <a href="#" class="help-btn">Help</a>
      <div class="profile-photo" onclick="toggleDropdown()">
  <img src="https://cdn-icons-png.flaticon.com/512/3135/3135715.png" alt="Profile" />
  <div class="profile-name"><?php echo htmlspecialchars($name); ?></div>

  <div id="dropdown-menu" class="dropdown-menu">
    <a href="settings.php">Settings</a>
    <a href="/mini_project/home.html">Logout</a>
  </div>
</div>
    </div>
  </header>


  
  <h1 class="viewname">hi <?php echo htmlspecialchars($name); ?></h1>
  


  <script src="loggedin.js"></script>
</body>
</html>