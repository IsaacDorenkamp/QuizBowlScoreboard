<?php
	function GetSafeValue( $assoc, $val ){
		if( !isset($assoc[$val]) || empty($assoc[$val]) ){
			if( isset($assoc[$val]) && $assoc[$val] == "0" ){
				return "0";
			}
			return '';
		}

		return $assoc[$val];
	}
?>