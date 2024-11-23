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
    echo json_encode([]);
    exit;
}

$content = file_get_contents($filepath);
if ($content === false) {
    http_response_code(500);
    echo json_encode(['error' => 'Could not read file']);
    exit;
}

// If file is empty, return empty array
if (empty($content)) {
    echo json_encode([]);
    exit;
}

echo $content;