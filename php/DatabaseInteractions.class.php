<?php
	require_once('db.inc.php');

	class DatabaseInteractions{
		private $mysqli;

		public function __construct( $database ){
			$this -> mysqli = new mysqli( HOST, USER, PASSWORD, $database );
		}

		public function query( $q ){
			return $this -> mysqli -> query( $q );
		}

		public function getMySQLi(){
			return $this -> mysqli;  //For certain operations requiring the MySQLi link
		}
	}
?>