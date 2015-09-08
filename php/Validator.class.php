<?php
	class Validator{
		static function Game( $mysqli, $room, $comp ){
			$res = $mysqli -> query("SELECT * FROM `$comp` WHERE room='$room'");

			if( $res && $res -> num_rows ){
				return true;
			}

			return false;
		}
	}
?>