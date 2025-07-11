<?php
session_start(); // Start session

// DB connection
$host = "localhost";
$user = "root";
$pass = "";
$db = "mini_project";

$conn = new mysqli($host, $user, $pass, $db);

// Check connection
if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}

// Get form data
$name = $_POST['name'];
$email = $_POST['email'];
$password = password_hash($_POST['password'], PASSWORD_BCRYPT);

// Insert into table
$sql = "INSERT INTO tbl_customer (name, email, password) VALUES (?, ?, ?)";
$stmt = $conn->prepare($sql);
$stmt->bind_param("sss", $name, $email, $password);

if ($stmt->execute()) {
    // Set session variable
    $_SESSION['email'] = $email;

    // Redirect
    header("Location: /mini_project/signedup/loggedin.php");
    exit();
} else {
    echo "Error: " . $stmt->error;
}

$stmt->close();
$conn->close();
?>
