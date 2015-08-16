<?php
	class Game{
		private $score1;
		private $score2;
		private $team1;
		private $team2;
		private $cname;

		public function __construct( $t1, $t2, $cn ){
			$this -> score1 = 0;
			$this -> score2 = 0;
			$this -> team1 = $t1;
			$this -> team2 = $t2;
			$this -> cname = $cn;
		}

		public function getP1Score(){
			return $this -> score1;
		}
		public function setP1Score( $s ){
			$this -> score1 = $s;
		}

		public function getP2Score(){
			return $this -> score2;
		}
		public function setP2Score( $s ){
			$this -> score2 = $s;
		}

		public function getP1Name(){
			return $this -> team1;
		}
		public function getP2Name(){
			return $this -> team2;
		}

		public function getCompetitionName(){
			return $this -> cname;
		}
	}
?>