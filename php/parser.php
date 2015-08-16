<?php
	//Message Parser -- Parsing Message from the Client

	class ParsedInstruction{
		private $inst;
		private $data;

		public function __construct( $i, $d ){
			$this -> inst = $i;
			$this -> data = $d;
		}

		public function getInstruction(){
			return $this -> inst;
		}

		public function getData(){
			return $this -> data;
		}


		public static function parse( $raw ){
			$lines = explode( "\n", $raw );

			$instruction = $lines[0];

			$data = [];
			$first = true;
			foreach( $lines as $line ){
				if( $first ){ //Skip first instruction line
					$first = false;
					continue;
				}
				$key = explode( ':', $line )[0];
				$value = implode( array_slice( explode( ':', $line ), 1 ), ':' );

				$data[$key] = $value;
			}

			return new ParsedInstruction( $instruction, $data );
		}
	}
?>