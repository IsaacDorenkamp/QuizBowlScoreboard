<?php
	$pwd = $argv[1];
	echo password_hash( $pwd, PASSWORD_BCRYPT, ['cost' => 11] );
?>