<?php
	require('../db.inc.php');

	function readline($prompt = "input> "){
		echo $prompt;
		$fp = fopen("php://stdin", "r");
		$line = rtrim( fgets($fp, 1024) );
		return $line;
	}

	$table_name  = readline("Competition Access ID: ");
	$cname       = readline("Competition Name: ");
	$public_val  = readline("Public (y/N)? ");
	$public      = ($public_val=="y")?"1":"0";
	$private_pwd = "";
	if( $public == "0" ){
		$private_pwd = password_hash(readline("Private Competition Password: "), PASSWORD_BCRYPT, ['cost' => 11]);
	}
	$password   = password_hash(readline("Competition Password: "), PASSWORD_BCRYPT, ['cost' => 11]);

	$mysqli = new mysqli( HOST, USER, PASSWORD, SB_DATABASE );
	if( $mysqli -> error ){
		die("Failed to connect to database: " . $mysqli -> error);
	}
	echo "Connected to database...\n";

	$query = "CREATE TABLE $table_name(
		Team1_Name varchar(45),
		Team2_Name varchar(45),
		Team1_Score int,
		Team2_Score int,
		comp_name varchar(45),
		room varchar(40),
		gid int AUTO_INCREMENT PRIMARY KEY
	)";

	echo "Constructed table query, executing...\n";

	$mysqli -> query( $query );

	if( $mysqli -> error ){
		die("Failed to connect to database: " . $mysqli -> error);
	}

	$query = "INSERT INTO `competitions` VALUES ( '$table_name', '$password', '$cname', $public, '$private_pwd', ''  )";

	$mysqli -> query( $query );

	if( $mysqli -> error ){
		die("Failed to connect to database: " . $mysqli -> error);
	}

	echo "Created competition table.\n";
?>