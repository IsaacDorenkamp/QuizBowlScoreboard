<?php
	require_once('./websockets.php');
	require_once('./parser.php');
	require_once('./instruction_handler.php');

	error_reporting( E_ALL );

	//Scoreboard WebSocket server
	class Scoreboard_Server extends WebSocketServer{
		protected function process( $sock, $message ){
			$pi = ParsedInstruction::parse( $message );

			$this -> send( $sock, process_instruction( $pi ));
		}

		protected function connected( $user ){} //Do nothing, no need to track user
		protected function closed( $user ){}    //No need to perform any cleanup tasks
	}

	$server = new Scoreboard_Server( '0.0.0.0', '9000' );

	try{
		$server -> run();
	}catch( Exception $e ){
		$server -> stdout ( $e -> getMessage() );
	}
?>