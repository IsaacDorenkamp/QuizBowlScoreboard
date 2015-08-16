<?php
	function GetSafeValue( $assoc, $val ){
		if( !isset($assoc[$val]) || empty($assoc[$val]) ){
			return 'INVALID';
		}

		return $assoc[$val];
	}
?>