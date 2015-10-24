<?php
	class Validator{
		static function Game( $mysqli, $room, $comp ){
			$res = $mysqli -> query("SELECT * FROM `$comp` WHERE room='$room'");

			if( $res && $res -> num_rows ){
				return true;
			}

			return false;
		}
		static function Competition( $mysqli, $caid ){
			$res = $mysqli -> query("SELECT * FROM `competitions` WHERE access_id='$caid'");

			if( ($res && $res -> num_rows) || $res=='competitions' ){
				return true;
			}

			return false;
		}
	}
?>