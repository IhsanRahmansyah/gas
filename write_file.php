<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST');
header('Access-Control-Allow-Headers: Content-Type');

// Get POST data
$input = file_get_contents('php://input');
$data = json_decode($input, true);

if (!isset($data['filename']) || !isset($data['data'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Filename and data are required']);
    exit;
}

// Ensure the filename is safe
$safename = basename($data['filename']);
if ($safename !== $data['filename']) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid filename']);
    exit;
}

$filepath = __DIR__ . '/' . $safename;

// Write data to file
$success = file_put_contents($filepath, json_encode($data['data'], JSON_PRETTY_PRINT));

if ($success === false) {
    http_response_code(500);
    echo json_encode(['error' => 'Could not write to file']);
    exit;
}

echo json_encode(['success' => true]);