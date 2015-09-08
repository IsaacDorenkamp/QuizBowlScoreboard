<?php
	require_once('db.inc.php');
	require_once('safe_values.php');
	require_once('errors.php');
	require_once('Game.class.php');
	require_once('Validator.class.php');


	class Protocol{
		private $watching = array();
		private $server;

		public function __construct( $server_obj ){
			$this -> server = $server_obj;
		}

		function process_instruction( $pi, $sock ){   //sock IS ONLY PROPAGATED TO OTHER FUNCTIONS!!!
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
					$output = "ERROR\n"
							 ."message: Invalid Access ID.";

					return $output;
				}

				$comp_row = $comp_rows -> fetch_assoc();

				if( !( password_verify( $comp_pwd, $comp_row['pwd'] ) ) ){
					$output = "ERROR\n"
							 ."message: Invalid Password.";

					return $output;
				}

				$comp = $comp_row['name'];
				$comp_id = $comp_row['cid'];


				if( empty( $gnm ) || empty( $t1n ) || empty( $t2n ) ){
					return ERR_INSUFFICIENT_DATA;
				}

				//Validator functions return true if the item (e.g. a game) already exists in the database.
				if( Validator::Game( $mysqli, $gnm, $access_id ) && !$override ){
					return "CONFIRM_OVERRIDE\n"
						  ."message: Game in room $gnm already exists.\nIf you wish to proceed with this action, enter\nthe competition password here and hit OK.";
				}

				$query = "INSERT INTO `$access_id` VALUES ( '$t1n', '$t2n', 0, 0, $comp_id, '$gnm', '' )";


				if( $mysqli -> error ) return ERR_DB . $mysqli -> error;

				$for="login";

				$gid = $mysqli -> insert_id;
				$other = "cid: $comp_id\n"
						."gid: $gid";

				$usepi = ParsedInstruction::parse( "CREATE_GAME\n"
												  ."gid:$gid\n"
												  ."T1S:0\n"
												  ."T2S:0\n"
												  ."T1N:$t1n\n"
												  ."T2N:$t2n" );

				$this -> process_watch_instruction( $usepi, $sock );

				break;
			case 'SAVE_SCORE':
				$game = GetSafeValue( $data, 'gid' );
				$t1s  = GetSafeValue( $data, 'T1S' );
				$t2s  = GetSafeValue( $data, 'T2S' );

				$comp = GetSafeValue( $data, 'comp' );
				$pwd  = GetSafeValue( $data, 'comp_pwd' );

				$rows = $mysqli -> query( "SELECT * FROM `competitions` WHERE cid=$comp" );

				if( !$rows){
					$output = "ERROR\n"
							 ."message: Invalid Access ID or Password.";
					return $output;
				}

				$row = $rows -> fetch_assoc();
				$cname = $row['name'];
				$caid  = $row['access_id'];

				if( (empty($game) && $game !== "0") || (empty($t1s) && $t1s !== "0") || (empty($t2s) && $t2s !== "0") ){
					return ERR_INSUFFICIENT_DATA;
				}

				$query = "UPDATE `$caid` SET Team1_Score = $t1s, Team2_Score = $t2s WHERE gid=$game";

				$mysqli -> query( $query );

				if( $mysqli -> error ) return "ERROR\nmessage: " . $mysqli -> error;

				$this -> process_watch_instruction( $pi, $sock );

				$for="saving";

				break;
			case 'FINZALIZE':
				$pwd = GetSafeValue($data, 'pwd');
				$gid = GetSafeValue($data, 'gid');
				$cid = GetSafeValue($data, 'cid');
				if( !isset($games[$gid]) ) break;
				unset( $games[$gid] );

				$row = $mysqli -> query( 'SELECT * FROM `competitions` WHERE cid=$cid' );
				$row = mysqli_fetch_assoc( $row );  //Makes things easier for us to just use the same variable here
				$password = $row['pwd'];
				$access_id = $row['access_id'];

				if( !password_verify( $pwd, $password ) ){
					return "ERROR\n"
						  ."message: Invalid password for competiton\n#$cid; will not finalize scores.";

				}

				$query = "INSERT INTO `finished_games` VALUES SELECT * FROM `games` WHERE gid=$gid;\n"
						."DELETE FROM `$access_id` WHERE gid=$gid";

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

		//---------------------------------------------//
		//---------------------------------------------//
		
		function disconnect( $user ){
			foreach( $this -> watching as $index => $client ){
				if( $client['USER'] === $user ){
					unset( $this -> watching[$index] );
					return true;
				}
			}
			return false;
		}
		
		
		//Process instructions for watching clients.
		function process_watch_instruction( $pi, $sock ){
			$instruction = $pi -> getInstruction();
			$data = $pi -> getData();

			$mysqli = new mysqli( HOST, USER, PASSWORD, SB_DATABASE );

			switch( $instruction ){
			case 'CREATE_GAME':
			case 'SAVE_SCORE':     //Propogated from process_instruction
				$t1s = GetSafeValue($data, 'T1S');
				$t2s = GetSafeValue($data, 'T2S');
				$t1n = GetSafeValue($data, 'T1N');
				$t2n = GetSafeValue($data, 'T2N');
				$gid = GetSafeValue($data, 'gid');

				$message = "SCORE_UPDATE\nGame_{$gid}\n{$gid}_T1S:$t1s\n{$gid}_T2S:$t2s\n{$gid}_T1N:$t1n\n{$gid}_T2N:$t2n";
				foreach( $this -> watching as $index => $client ){
					$this -> server -> send_data( $client['USER'], $message );  //$this -> server -> send() is protected.
				}
				break;
			case 'WATCH':
				$comp = GetSafeValue( $data, 'competition' );
				if( $comp == '' ){
					return "ERROR\n"
						  ."message: No room specified.";
				}

				$result = $mysqli -> query( "SELECT * FROM `competitions` WHERE access_id='$comp'" );
				if( !$result ){
					return "ERROR\n"
						  ."message: No competition called " . $comp;
				}

				$result_arr = $result -> fetch_assoc();

				if( GetSafeValue($data, 'pwd') == '' && !($result_arr['is_public']) ){

					return "AUTHENTICATE\n"
						  ."status: 0";        //status: 0 means no password has been given yet.
				}else if( GetSafeValue($data, 'pwd') != '' && !($result_arr['is_public']) ){
					$cpwd = $result_arr["private_password"];
					$gpwd = GetSafeValue($data, 'pwd');

					if( password_verify( $gpwd, $cpwd ) ){
						return "AUTHENTICATE\n"
							  ."status: 1";    //status: 1 means that a correct password has been given.
					}else{
						return "AUTHENTICATE\n"
						      ."status: -1";   //status: -1 means an incorrect password has been given.
					}
				}else;

				$cid = $result_arr["cid"];
				$caid = $result_arr["access_id"];
				$cname = $result_arr["name"];

				$dat = [
					'USER' => $sock,
					'COMPETITION' => $cid
				];
				array_push( $this -> watching, $dat );


				$query = "SELECT * FROM `$caid`"; //Resetting query variable. We don't ever really need to keep this the same after using it.
				$result = $mysqli -> query( $query );

				$config = "name: $cname\n";

				if( !$result ){
					return "OK";
				}

				$row = $result -> fetch_assoc();
				do{
					$gid  = $row["gid"];
					$room = $row["room"];
					$config .= "Game_" . $gid . "\n"
							  .$gid."_T1S:" . $row["Team1_Score"] . "\n"
							  .$gid."_T2S:" . $row["Team2_Score"] . "\n"
							  .$gid."_T1N:" . $row["Team1_Name"] . "\n"
							  .$gid."_T2N:" . $row["Team2_Name"] . "\n"
							  .$gid."_Name:" . $room . "\n";
				}while( $row = $result -> fetch_assoc() );

				return "INITIALIZE\n"
					  .$config;
			case 'UNWATCH':
				foreach( $this -> watching as $key => $value ){
					if( $value["USER"] -> id == $sock -> id ){
						echo "Client Unwatching Competition.";
						unset( $this -> watching[$key] );
					}
				}
				break;

			default:
				break;
			}

			return "OK";  //Just by default
		}
	}
?>