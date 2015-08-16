<?php
	require_once('db.inc.php');
	require_once('safe_values.php');
	require_once('errors.php');
	require_once('Game.class.php');
	require_once('Validator.class.php');

	$games = [];

	function process_instruction( $pi ){
		$instruction = $pi -> getInstruction();
		$data = $pi -> getData();

		$mysqli = new mysqli( HOST, USER, PASSWORD, SB_DATABASE );

		$for = "general";
		$other = "";

		switch( $instruction ){
		case 'NOTIFY':
			$addr = GetSafeValue( $data, 'email' );
			$cont = GetSafeValue( $data, 'content' );
			
			$success = mail( $addr, 'QuizBowl Notification', $cont, 'From: notifications@quizbowl.us'  );
			break;
		case 'CREATE_GAME':
			$gnm     = $mysqli -> real_escape_string( GetSafeValue($data, 'room') );
			$comp_pwd    = $mysqli -> real_escape_string( GetSafeValue($data, 'password') );

			$access_id = $mysqli -> real_escape_string( GetSafeValue($data, 'access_id') );

			$t1n     = $mysqli -> real_escape_string( GetSafeValue($data, 'Team1_Name') );
			$t2n     = $mysqli -> real_escape_string( GetSafeValue($data, 'Team2_Name') );

			$override = GetSafeValue( $data, 'progress-override' )=="true"?true:false;

			$comp_rows = $mysqli -> query( "SELECT * FROM `competitions` WHERE access_id='$access_id'" );
			if( !($comp_rows -> num_rows) ){
				$output = <<<HTML
ERROR
message: Invalid Access ID.
HTML;
				return $output;
			}

			$comp_row = $comp_rows -> fetch_assoc();

			if( !( password_verify( $comp_pwd, $comp_row['pwd'] ) ) ){
				$output = <<<HTML
ERROR
message: Invalid Password.
HTML;
				return $output;
			}

			$comp = $comp_row['name'];
			$comp_id = $comp_row['cid'];


			if( empty( $gnm ) || empty( $t1n ) || empty( $t2n ) ){
				return ERR_INSUFFICIENT_DATA;
			}

			//Validator functions return true if the item (e.g. a game) already exists in the database.
			if( Validator::Game( $mysqli, $gnm ) && !$override ){
				return <<<ERROR_MSG
CONFIRM_OVERRIDE
message: Game in room $gnm already exists.\nIf you wish to proceed with this action, enter\nthe competition password here and hit OK.
ERROR_MSG;
			}


			$games[$gnm] = new Game( $t1n, $t2n, $gnm );

			$query = "INSERT INTO `games` VALUES ( '$t1n', '$t2n', 0, 0, '$comp', $comp_id, '$gnm', '' )";

			$mysqli -> query( $query );

			echo $mysqli -> error;

			if( $mysqli -> error ) return ERR_DB . $mysqli -> error;

			$for="login";

			$gid = $mysqli -> insert_id;
			$other = <<<data
cid: $comp_id
gid: $gid
data;

			break;
		case 'SAVE_SCORE':
			$game = GetSafeValue( $data, 'room' );
			$t1s  = GetSafeValue( $data, 'Team1_Score' );
			$t2s  = GetSafeValue( $data, 'Team2_Score' );
			$pwd  = GetSafeValue( $data, 'comp_pwd' );
			$hash = password_hash( $pwd, PASSWORD_BCRYPT, ['cost' => 11] );

			$rows = $mysqli -> query( "SELECT * FROM `competitions` WHERE $pwd='$hash'" );

			if( !$rows){
				$output = <<<ERROR_MSG
ERROR
message: Invalid Access ID or Password.
ERROR_MSG;
				return $output;
			}

			if( empty($game) || empty($t1s) || empty($t2s) ){
				return ERR_INSUFFICIENT_DATA;
			}

			$query = "UPDATE `games` SET Team1_Score=$t1s, Team2_Score=$t2s WHERE room=$game";

			$mysqli -> query( $query );

			if( $mysqli -> error ) return ERR_DB;

			$for="saving";

			break;
		case 'FINZALIZE':
			$pwd = GetSafeValue($data, 'pwd');
			$gid = GetSafeValue($data, 'gid');
			$cid = GetSafeValue($data, 'cid');
			if( !isset($games[$gid]) ) break;
			unset( $games[$gid] );

			$row = $mysqli -> query( 'SELECT pwd FROM `competitions` WHERE cid=$cid' );
			$row = mysqli_fetch_assoc( $row );  //Makes things easier for us to just use the same variable here
			$password = $row['pwd'];

			if( !password_verify( $pwd, $password ) ){
				return <<<ERROR_MSG
ERROR
message: Invalid password for competiton\n#$cid; will not finalize scores.
ERROR_MSG;
			}

			$query = <<<query
INSERT INTO `finished_games` VALUES SELECT * FROM `games` WHERE gid=$gid;
DELETE FROM `finished_games` WHERE gid=$gid
query;
			$mysqli -> query( $query );

			$for = "finalizing";
		case 'ECHO':
			//Testing scenarios
			return GetSafeValue($data, 'data');
		default:
			return ERR_INVALID_INSTRUCTION . ': ' . $instruction;
		}

		return <<<OUTPUT
OK
for:$for
$other
OUTPUT;
	}
?>