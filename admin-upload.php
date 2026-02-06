<?php
/**
 * Atlantis Bevco - Admin Upload Handler
 * Handles authentication and PDF catalog uploads.
 */

// Strict error handling — don't leak errors to client
error_reporting(0);
ini_set('display_errors', '0');

// Only allow POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    header('Content-Type: application/json');
    echo json_encode(['success' => false, 'error' => 'Method not allowed']);
    exit;
}

// CORS and content type
header('Content-Type: application/json');
header('Cache-Control: no-store, no-cache, must-revalidate');

// Start session
session_start();

// --- Configuration ---
// Bcrypt hash of the admin password (generated from 'AtlantisBevco2026')
define('ADMIN_PASSWORD_HASH', '$2y$12$FoKyN1BT4KcwKTCmq.D2ReOrnBXq6mchrMy3lLBmO2lsmS20Nth0i');
define('CATALOG_DIR', __DIR__ . '/catalog');
define('CATALOG_FILE', CATALOG_DIR . '/Master_Portfolio.pdf');
define('CATALOG_BACKUP', CATALOG_DIR . '/Master_Portfolio_backup.pdf');
define('MAX_FILE_SIZE', 50 * 1024 * 1024); // 50MB
define('MAX_LOGIN_ATTEMPTS', 5);
define('LOCKOUT_SECONDS', 60);

// --- Route by action ---
$action = isset($_POST['action']) ? $_POST['action'] : '';

switch ($action) {
    case 'login':
        handleLogin();
        break;
    case 'upload':
        handleUpload();
        break;
    case 'status':
        handleStatus();
        break;
    case 'logout':
        handleLogout();
        break;
    default:
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Invalid action']);
}

exit;

// ========================================
// Action Handlers
// ========================================

function handleLogin() {
    $password = isset($_POST['password']) ? $_POST['password'] : '';

    // Rate limiting
    if (!isset($_SESSION['login_attempts'])) {
        $_SESSION['login_attempts'] = 0;
        $_SESSION['last_failed_attempt'] = 0;
    }

    // Check lockout
    if ($_SESSION['login_attempts'] >= MAX_LOGIN_ATTEMPTS) {
        $elapsed = time() - $_SESSION['last_failed_attempt'];
        if ($elapsed < LOCKOUT_SECONDS) {
            $remaining = LOCKOUT_SECONDS - $elapsed;
            echo json_encode([
                'success' => false,
                'error' => "Too many attempts. Try again in {$remaining} seconds."
            ]);
            return;
        }
        // Lockout expired, reset
        $_SESSION['login_attempts'] = 0;
    }

    // Verify password
    if (password_verify($password, ADMIN_PASSWORD_HASH)) {
        // Success — generate token and store in session
        $token = bin2hex(random_bytes(32));
        $_SESSION['admin_token'] = $token;
        $_SESSION['admin_authenticated'] = true;
        $_SESSION['login_attempts'] = 0;

        echo json_encode(['success' => true, 'token' => $token]);
    } else {
        // Failed
        $_SESSION['login_attempts']++;
        $_SESSION['last_failed_attempt'] = time();

        $remaining = MAX_LOGIN_ATTEMPTS - $_SESSION['login_attempts'];
        $msg = 'Invalid password.';
        if ($remaining <= 2 && $remaining > 0) {
            $msg .= " {$remaining} attempts remaining.";
        }

        echo json_encode(['success' => false, 'error' => $msg]);
    }
}

function handleUpload() {
    // Verify authentication
    if (!verifyToken()) {
        http_response_code(401);
        echo json_encode(['success' => false, 'error' => 'Not authenticated']);
        return;
    }

    // Check that a file was uploaded
    if (!isset($_FILES['catalog_pdf']) || $_FILES['catalog_pdf']['error'] !== UPLOAD_ERR_OK) {
        $errorMsg = 'No file uploaded.';
        if (isset($_FILES['catalog_pdf'])) {
            switch ($_FILES['catalog_pdf']['error']) {
                case UPLOAD_ERR_INI_SIZE:
                case UPLOAD_ERR_FORM_SIZE:
                    $errorMsg = 'File is too large. Maximum size is 50MB.';
                    break;
                case UPLOAD_ERR_PARTIAL:
                    $errorMsg = 'Upload was interrupted. Please try again.';
                    break;
                case UPLOAD_ERR_NO_FILE:
                    $errorMsg = 'No file was selected.';
                    break;
                default:
                    $errorMsg = 'Upload failed. Please try again.';
            }
        }
        echo json_encode(['success' => false, 'error' => $errorMsg]);
        return;
    }

    $file = $_FILES['catalog_pdf'];

    // Validate file size
    if ($file['size'] > MAX_FILE_SIZE) {
        echo json_encode(['success' => false, 'error' => 'File is too large. Maximum size is 50MB.']);
        return;
    }

    // Validate MIME type using finfo (reliable check)
    $finfo = finfo_open(FILEINFO_MIME_TYPE);
    $mimeType = finfo_file($finfo, $file['tmp_name']);
    finfo_close($finfo);

    if ($mimeType !== 'application/pdf') {
        echo json_encode(['success' => false, 'error' => 'Invalid file type. Only PDF files are accepted.']);
        return;
    }

    // Validate file extension
    $ext = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
    if ($ext !== 'pdf') {
        echo json_encode(['success' => false, 'error' => 'Invalid file extension. Only .pdf files are accepted.']);
        return;
    }

    // Ensure catalog directory exists
    if (!is_dir(CATALOG_DIR)) {
        mkdir(CATALOG_DIR, 0755, true);
    }

    // Backup existing catalog if it exists
    if (file_exists(CATALOG_FILE)) {
        copy(CATALOG_FILE, CATALOG_BACKUP);
    }

    // Move uploaded file to catalog location
    if (move_uploaded_file($file['tmp_name'], CATALOG_FILE)) {
        $size = filesize(CATALOG_FILE);
        echo json_encode([
            'success' => true,
            'message' => 'Catalog updated successfully.',
            'size' => $size,
            'size_formatted' => formatFileSize($size),
            'modified' => date('M j, Y \a\t g:i A', filemtime(CATALOG_FILE))
        ]);
    } else {
        echo json_encode(['success' => false, 'error' => 'Failed to save file. Please check server permissions.']);
    }
}

function handleStatus() {
    // Verify authentication
    if (!verifyToken()) {
        http_response_code(401);
        echo json_encode(['success' => false, 'error' => 'Not authenticated']);
        return;
    }

    if (file_exists(CATALOG_FILE)) {
        $size = filesize(CATALOG_FILE);
        echo json_encode([
            'success' => true,
            'exists' => true,
            'size' => $size,
            'size_formatted' => formatFileSize($size),
            'modified' => date('M j, Y \a\t g:i A', filemtime(CATALOG_FILE))
        ]);
    } else {
        echo json_encode([
            'success' => true,
            'exists' => false
        ]);
    }
}

function handleLogout() {
    $_SESSION = [];
    session_destroy();
    echo json_encode(['success' => true]);
}

// ========================================
// Helpers
// ========================================

function verifyToken() {
    $token = isset($_POST['token']) ? $_POST['token'] : '';
    return !empty($token)
        && isset($_SESSION['admin_authenticated'])
        && $_SESSION['admin_authenticated'] === true
        && isset($_SESSION['admin_token'])
        && hash_equals($_SESSION['admin_token'], $token);
}

function formatFileSize($bytes) {
    if ($bytes >= 1048576) {
        return round($bytes / 1048576, 1) . ' MB';
    } elseif ($bytes >= 1024) {
        return round($bytes / 1024, 1) . ' KB';
    }
    return $bytes . ' bytes';
}
