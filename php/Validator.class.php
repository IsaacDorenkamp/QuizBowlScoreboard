<?php
	class Validator{
		static function Game( $mysqli, $room ){
			$numrows = $mysqli -> query("SELECT * FROM `games` WHERE room='$room'") -> num_rows;

			if( $numrows ){
				return true;
			}

			return false;
		}
	}
?>