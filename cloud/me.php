<?php
require_once __DIR__ . '/common.php';
check_api_key();

$u = current_user();
json_ok(['user' => $u ? public_user($u) : null]);
