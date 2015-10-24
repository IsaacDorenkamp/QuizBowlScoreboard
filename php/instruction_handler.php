<?php
	require_once('db.inc.php');
	require_once('safe_values.php');
	require_once('errors.php');
	require_once('Game.class.php');
	require_once('Validator.class.php');

	function censor( $pwd ){
		$len = strlen( $pwd );
		$output = "";
		for( $i = 0; $i < $len; $i++ ){
			$output .= "*";
		}
		return $output;
	}


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
			//Make sure to use NodeJS if you decide to reprogram the server. I only used PHP because the original hosting plan didn't support NodeJS.//
			//Little did I know we would need the Virtual Server plan (which supports Node) anyway to support the Websocket server! This is the story of the birth of this program.//
			case 'CREATE_GAME':
				$gnm     = $mysqli -> real_escape_string( GetSafeValue($data, 'room') );
				$comp_pwd    = $mysqli -> real_escape_string( GetSafeValue($data, 'password') );

				$access_id = $mysqli -> real_escape_string( GetSafeValue($data, 'access_id') );

				$t1n     = $mysqli -> real_escape_string( GetSafeValue($data, 'Team1_Name') );
				$t2n     = $mysqli -> real_escape_string( GetSafeValue($data, 'Team2_Name') );

				if( empty( $gnm ) || empty( $t1n ) || empty( $t2n ) ){
					return "ERROR\n"
						  ."message: Insufficient data given to create game.";
				}

				$comp_rows = $mysqli -> query( "SELECT * FROM `competitions` WHERE access_id='$access_id'" );
				if( !$comp_rows || !($comp_rows -> num_rows) ){
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

				$query = "INSERT INTO `$access_id` VALUES ( '$t1n', '$t2n', 0, 0, $comp_id, '$gnm', 0, '' )";

				$mysqli -> query( $query );

				if( $mysqli -> error ) return "ERROR\n" . "message: " . $mysqli -> error;

				$for="login";

				$cnm = $comp_row['name'];

				$gid = $mysqli -> insert_id;
				$other = "cid: $comp_id\n"
						."gid: $gid\n"
						."cnm: $cnm";

				$usepi = ParsedInstruction::parse( "CREATE_GAME\n"
												  ."gid:$gid\n"
												  ."T1S:0\n"
												  ."T2S:0\n"
												  ."T1N:$t1n\n"
												  ."T2N:$t2n\n"
												  ."access_id:$access_id\n"
												  ."finished:false" );

				$this -> process_watch_instruction( $usepi, $sock );

				break;
			case 'RECOVER_GAME':
				$comp_pwd    = $mysqli -> real_escape_string( GetSafeValue($data, 'password') );
				$access_id = $mysqli -> real_escape_string( GetSafeValue($data, 'access_id') );
				$gid = $mysqli -> real_escape_string( GetSafeValue($data, 'gid') );

				if( empty( $comp_pwd ) || empty( $access_id ) || empty( $gid ) ){
					return "ERROR\n"
						  ."message: Insufficient data given to recover game.";
				}

				$comp_rows = $mysqli -> query( "SELECT * FROM `competitions` WHERE access_id='$access_id'" );
				if( !$comp_rows || !($comp_rows -> num_rows) ){
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

				$query = "SELECT * FROM `$access_id` WHERE gid=$gid";

				$resset = $mysqli -> query( $query );

				if( !$resset || !($resset -> num_rows) ){
					return "ERROR\n"
						  ."message: Game with GID $gid not found.";
				}

				$res = $resset -> fetch_assoc();

				$t1s = $res['Team1_Score'];
				$t2s = $res['Team2_Score'];
				$t1n = $res['Team1_Name'];
				$t2n = $res['Team2_Name'];
				$gnm = $res['room'];
				$cnm = $comp_row['name'];

				$for="recover";
				$other = "cid: $comp_id\n"
						."gid: $gid\n"
						."T1S: $t1s\n"
						."T2S: $t2s\n"
						."T1N: $t1n\n"
						."T2N: $t2n\n"
						."room: $gnm\n"
						."cnm: $cnm";

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
			case 'FINALIZE':
				$pwd = $mysqli -> real_escape_string( GetSafeValue($data, 'pwd') );
				$gid = $mysqli -> real_escape_string( GetSafeValue($data, 'gid') );
				$cid = $mysqli -> real_escape_string( GetSafeValue($data, 'cid') );

				$row = $mysqli -> query( "SELECT * FROM `competitions` WHERE cid=$cid" );
				if( $mysqli -> error ){
					return "ERROR\n"
						  ."message: " . $mysqli -> error;
				}
				if( !$row ){
					return "ERROR\n"
						  ."message: No competition with that ID was found!";
				}
				$row = $row -> fetch_assoc();  //Makes things easier for us to just use the same variable here
				$password = $row['pwd'];
				$access_id = $row['access_id'];

				if( !password_verify( $pwd, $password ) ){
					return "ERROR\n"
						  ."message: Invalid password for competition\n#$cid; will not finalize scores.";
				}

				$query = "UPDATE `$access_id` SET finished=1 WHERE gid=$gid\n";

				$mysqli -> query( $query );
				if( $mysqli -> error ){
					return "ERROR\n"
						  ."message: " . $mysqli -> error;
				}

				$this -> process_watch_instruction( $pi, $sock );

				$for = "finalizing";
				break;
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

			$message = 'SCORE_UPDATE';

			switch( $instruction ){
			case 'CREATE_GAME':
				$message = 'NEW_GAME';
			case 'SAVE_SCORE':     //Propogated from process_instruction
				$t1s = GetSafeValue($data, 'T1S');
				$t2s = GetSafeValue($data, 'T2S');
				$t1n = GetSafeValue($data, 'T1N');
				$t2n = GetSafeValue($data, 'T2N');
				$gid = GetSafeValue($data, 'gid');

				$room = "";

				if( $message == 'NEW_GAME' ){
					$aid = GetSafeValue($data, 'access_id');
					if( !$aid ){
						return "OK"; //The client doesn't really care.
					}
					$res = $mysqli -> query( "SELECT room FROM `$aid` WHERE gid=$gid" );
					if( !$res ){
						return "OK"; //Same as above; the client doesn't really care.
					}

					$row = $res -> fetch_assoc();
					$room = $row['room'];
				}

				$message = "SCORE_UPDATE\nGame_{$gid}:$room\n{$gid}_T1S:$t1s\n{$gid}_T2S:$t2s\n{$gid}_T1N:$t1n\n{$gid}_T2N:$t2n";

				foreach( $this -> watching as $index => $client ){
					$this -> server -> send_data( $client['USER'], $message );  //$this -> server -> send() is protected.
				}
				break;
			case 'FINALIZE':
				$gid = GetSafeValue($data, 'gid');
				$cid = GetSafeValue($data, 'cid');

				$message = "GAME_OVER\ngid:{$gid}";

				foreach( $this -> watching as $index => $client ){
					$this -> server -> send_data( $client['USER'], $message );
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
						//Do nothing
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

				if( $result -> num_rows == 0 ){
					return "INITIALIZE\n" . $config;
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
							  .$gid."_Finished:" . (($row["finished"]=="1")?"true":"false") . "\n"
							  .$gid."_Name:" . $room . "\n";
				}while( $row = $result -> fetch_assoc() );

				return "INITIALIZE\n"
					  .$config;
			case 'LIST_COMPETITIONS':
				$query = "SELECT * FROM `competitions` WHERE is_public=1";
				$results = $mysqli -> query( $query );

				if( !$results ){
					return "NO_COMPETITIONS";
				}

				$output = "POPULATE_CLIST";

				while( ($row = $results -> fetch_assoc()) ){
					$output .= "\n" . $row['access_id'] . ":" . $row['name'];
				}

				return $output;
			case 'CREATE_COMPETITION':
				$cname = $mysqli -> real_escape_string( GetSafeValue($data, 'Name') );
				$aid   = $mysqli -> real_escape_string( GetSafeValue($data, 'ID') );
				$pwd   = $mysqli -> real_escape_string( password_hash(GetSafeValue($data, 'Password'), PASSWORD_BCRYPT, ['cost' => 11]) );
				$ispub = (GetSafeValue($data, 'ispublic')=="false")?false:true;
				$vk    = $mysqli -> real_escape_string( password_hash(GetSafeValue($data, 'viewkey'), PASSWORD_BCRYPT, ['cost' => 11]) );

				if( !$cname || !$aid || !$pwd || (!$ispub && (!$vk)) ){
					$error = "ERROR\n"
							."message: Insufficient Data. Be sure to fill in all required form fields.";
				}
				if( $ispub ){
					$vk = "NULL";
				}else{
					$vk = "'" . $vk . "'";
				}
				if( Validator::Competition($mysqli, $aid) ){
					$error = "ERROR\n"
						    ."message: Competition already exists.";
					return $error;
				}
				$query = <<<QUERY
CREATE TABLE $cname(
	Team1_Name varchar(45),
	Team2_Name varchar(45),
	Team1_Score int,
	Team2_Score int,
	comp_name varchar(45),
	room varchar(40),
	finished boolean,
	gid int AUTO_INCREMENT PRIMARY KEY
)
QUERY;
				
				$mysqli -> query( $query );

				if( $mysqli -> error ) return "ERROR\nmessage: " . $mysqli -> error;

				$pubval = $ispub?'1':'0';

				$query = "INSERT INTO `competitions` VALUES ('$cname', '$pwd', '$aid', $pubval, $vk, '')";

				$mysqli -> query( $query );

				if( $mysqli -> error ) return "ERROR\nmessage: " . $mysqli -> error;

				return "CREATED\n"
					  ."Name: $cname\n"
					  ."ID: $aid\n"
					  ."Password: " . censor($pwd) . "\n"
					  ."Public: " . (($ispub)?'Yes':'No') . "\n"
					  .((!$ispub)?"ViewKey: " . $vk:"");
				break;
			case 'UNWATCH':
				foreach( $this -> watching as $key => $value ){
					if( $value["USER"] -> id == $sock -> id ){
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