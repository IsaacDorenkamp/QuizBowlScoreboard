<?php
	require('../db.inc.php');

	function readline($prompt = "input> "){
		echo $prompt;
		$fp = fopen("php://stdin", "r");
		$line = rtrim( fgets($fp, 1024) );
		return $line;
	}

	$table_name = readline("Competition Access ID: ");

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

	echo "Constructed query, executing...\n";

	$mysqli -> query( $query );

	if( $mysqli -> error ){
		die("Failed to connect to database: " . $mysqli -> error);
	}

	echo "Created competition table.\n";
?>