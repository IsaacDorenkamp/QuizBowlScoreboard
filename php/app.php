<?php
	require_once('./websockets.php');
	require_once('./parser.php');
	require_once('./instruction_handler.php');

	error_reporting( E_ALL );

	//Scoreboard WebSocket server
	class Scoreboard_Server extends WebSocketServer{
		private $proto;

		public function send_data( $recipient, $data ){ //$this -> send() is protected. This method is used so that we can send data from $this -> proto.
			$this -> send( $recipient, $data );
		}

		public function __construct( $ip, $port ){
			parent::__construct( $ip, $port );
			$this -> proto = new Protocol( $this );
		}

		protected function process( $sock, $message ){
			$pi = ParsedInstruction::parse( $message );

			if( isset( $pi -> getData()["WATCH_CLIENT"] ) && $pi -> getData()["WATCH_CLIENT"] == 'true' ){
				$this -> send( $sock, $this -> proto -> process_watch_instruction( $pi, $sock ) );
				return;
			}

			$this -> send( $sock, $this -> proto -> process_instruction( $pi, $sock ));
		}

		protected function connected( $user ){} //Do nothing, no need to track user
		protected function closed( $user ){
			$this -> proto -> disconnect( $user );
		}
	}

	$server = new Scoreboard_Server( '0.0.0.0', '9000' );

	try{
		$server -> run();
	}catch( Exception $e ){
		$server -> stdout ( $e -> getMessage() );
	}
?>