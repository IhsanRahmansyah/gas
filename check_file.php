<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST');
header('Access-Control-Allow-Headers: Content-Type');

$filename = $_GET['file'] ?? '';

if (empty($filename)) {
    http_response_code(400);
    echo json_encode(['error' => 'Filename is required']);
    exit;
}

// Ensure the filename is safe
$safename = basename($filename);
if ($safename !== $filename) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid filename']);
    exit;
}

$filepath = __DIR__ . '/' . $safename;

if (!file_exists($filepath)) {
    // Create file with empty array
    file_put_contents($filepath, '[]');
}

echo json_encode(['success' => true]);