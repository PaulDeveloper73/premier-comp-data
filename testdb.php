<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");

// Database Credentials
define('DB_HOST', 'localhost');
define('DB_NAME', 'rupafound_beneficiary_db');
define('DB_USER', 'rupafound_admin_pro_ben');
define('DB_PASS', 'K]y#.l$g*ec+hu=6');

try {
    $pdo = new PDO(
        "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME,
        DB_USER,
        DB_PASS
    );

    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    echo json_encode([
        "status" => "success",
        "message" => "Database connected successfully"
    ]);

} catch (PDOException $e) {
    echo json_encode([
        "status" => "error",
        "message" => $e->getMessage()
    ]);
}
