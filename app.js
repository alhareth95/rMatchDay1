(function () {
    'use strict';
    angular.module('RedPandasPlayers', [])
	.controller('PlayerController', PlayerController)
	.service('PlayerListService', PlayerListService)
	.constant('ApiBasePath1', "./players.json")
	.directive('playerList', playerListDirective);


	function playerListDirective() {
		var ddo = {
			restrict: "E",
			templateUrl: 'players.html',
			scope: {
				players: '<'
			},
			controller: playerListDirectiveController,
			controllerAs: 'dctrl',
			bindToController: true
		};
		return ddo;
		}

	function playerListDirectiveController() {
		var pdctrl = this;
		pdctrl.isempty = function (){
		if (pdctrl.foundItems.length === 0 && pdctrl.foundItems !== 'undefined'){
			return true;
		}
		return false;
	};
	}


	function PlayerController(PlayerListService) {
		var pla = this;

		
		
		
		
		pla.search = "";
		pla.result = "";
		pla.matchPlayer = [];
		if(pla.players == null){
			var promise = PlayerListService.getPlayerList();
			promise.then(function (response) {
			//console.log("inside promise");
			pla.players = response.data;
			//console.log(pla.players);
			})
			.catch(function (error) {
				console.log("Something went terribly wrong.");
			});
		}
		pla.redTeam = [];
		pla.blueTeam = [];
		pla.blueTeamStrength ;
		pla.redTeamStrength ;
		pla.ganerate = function ganerate(){
			var result = equalTeams(pla.matchPlayer);
		
		pla.blueTeam = result.teams[0];
		pla.redTeam = result.teams[1];
		pla.blueTeamStrength = result.strengths[0];
		pla.redTeamStrength = result.strengths[1];
		if(pla.matchPlayer.length % 2 == 1){
			var weekerTeam = 1 ;
			if(pla.blueTeamStrength < pla.redTeamStrength){
				weekerTeam = 0;
			}
			var leftedPlayer = pla.matchPlayer;
			for(var i = 0 ; i < pla.blueTeam.length ; i ++){
				var player1 = pla.blueTeam[i];
				var player2 = pla.redTeam[i];
				var idx = leftedPlayer.indexOf(player1);
				if (idx > -1) {
					leftedPlayer.splice(idx, 1);
				}
				var idx = leftedPlayer.indexOf(player2);
				if (idx > -1) {
					leftedPlayer.splice(idx, 1);
				}
			}
			if(leftedPlayer != null && leftedPlayer.length > 0){
				if(weekerTeam == 0){
					pla.blueTeam.push(leftedPlayer[0]);
					pla.blueTeamStrength = pla.blueTeamStrength + leftedPlayer[0].strength;
				}else{
					pla.redTeam.push(leftedPlayer[0]);
					pla.redTeamStrength = pla.redTeamStrength + leftedPlayer[0].strength;
				}
				
			}
		}
		}
		

		pla.toggleSelection = function toggleSelection(player) {
			//console.log("inside selector " , player);
			var idx = pla.matchPlayer.indexOf(player);
			if (idx > -1) {
			  // is currently selected
			  pla.matchPlayer.splice(idx, 1);
			 }
			 else {
			   // is newly selected
			   pla.matchPlayer.push(player);
			 }
		  };
		
		function compareStrength(a, b) { // for sorting players and selections
			return a.strength - b.strength;
		}
		function teamStrength(players) {
			return players.reduce(function(total, player) {return total + player.strength;}, 0);
		}
		function selectionStrength(players, selection) {
			return players.reduce(function(total, player, index) {return total + player.strength * selection[index];}, 0);
		}
		function nextPermutation(selection) { // reverse-lexicographical next permutation of a bit array
			var max = true, pos = selection.length, set = 1;
			while (pos-- && (max || !selection[pos])) if (selection[pos]) ++set; else max = false;
			if (pos < 0) return false;
			selection[pos] = 0;
			while (++pos < selection.length) selection[pos] = set-- > 0 ? 1 : 0;
			return true;
		}
		function swapPlayers(wTeam, sTeam, wSelect, sSelect) {
			for (var i = 0, j = 0; i < wSelect.length; i++) {
				if (wSelect[i]) {
					while (!sSelect[j]) ++j;
					var temp = wTeam[i];
					wTeam[i] = sTeam[j];
					sTeam[j++] = temp;
				}
			}
		}
		function equalTeams(players) {
			// SORT PLAYERS FROM WEAKEST TO STRONGEST
			players.sort(compareStrength);
			// INITIAL DISTRIBUTION OF PLAYERS INTO WEAKER AND STRONGER TEAM (ALTERNATING)
			var wTeam = [], sTeam = [];
			for (var i = players.length % 2; i < players.length; i += 2) {
				wTeam.push(players[i]);
				sTeam.push(players[i + 1]);
			}
			/*if(players.length % 2 ==1){
				sTeam.push(players[players.length -1]);
			}*/
			var teamSize = wTeam.length;
			// CALCULATE INITIAL STRENGTH DIFFERENCE
			var initDiff = teamStrength(sTeam) - teamStrength(wTeam);
			var bestDiff = initDiff;
			var wBestSel = [], sBestSel = [];
			// CHECK SELECTIONS OF EVERY SIZE
			for (var selSize = 1; selSize < teamSize && bestDiff > 1; selSize++) {
				var wSelections = [], sSelections = [], selection = [];
				// CREATE INITIAL SELECTION BIT-ARRAY FOR WEAKER TEAM (SKIP PLAYER 1)
				for (var i = 0; i < teamSize; i++)
					selection[i] = (i > 0 && i <= selSize) ? 1 : 0;
				// STORE ALL SELECTIONS FROM WEAKER TEAM AND THEIR STRENGTH
				do wSelections.push({selection: selection.slice(), strength: selectionStrength(wTeam, selection)});
				while (nextPermutation(selection));
				// SORT SELECTIONS FROM WEAKEST TO STRONGEST
				wSelections.sort(compareStrength);
				// CREATE INITIAL SELECTION BIT-ARRAY FOR STRONGER TEAM
				for (var i = 0; i < teamSize; i++)
					selection[i] = (i < selSize) ? 1 : 0;
				// STORE ALL SELECTIONS FROM STRONGER TEAM AND THEIR STRENGTH
				do sSelections.push({selection: selection.slice(), strength: selectionStrength(sTeam, selection)});
				while (nextPermutation(selection));
				// SORT SELECTIONS FROM WEAKEST TO STRONGEST
				sSelections.sort(compareStrength);
				// ITERATE OVER SELECTIONS FROM BOTH TEAMS
				var wPos = 0, sPos = 0;
				while (wPos < wSelections.length && sPos < sSelections.length) {
					// CALCULATE STRENGTH DIFFERENCE IF THESE SELECTIONS WERE SWAPPED
					var wStrength = wSelections[wPos].strength, sStrength = sSelections[sPos].strength;
					var diff = Math.abs(initDiff - 2 * (sStrength - wStrength));
					// SET NEW BEST STRENGTH DIFFERENCE IF SMALLER THAN CURRENT BEST
					if (diff < bestDiff) {
						bestDiff = diff;
						wBestSel = wSelections[wPos].selection.slice();
						sBestSel = sSelections[sPos].selection.slice();
						// STOP SEARCHING IF PERFECT SOLUTION FOUND (DIFFERENCE 0 OR 1)
						if (bestDiff < 2) break;
					}
					// ADVANCE TO NEXT SELECTION FROM WEAKER OR STRONGER TEAM
					if (2 * (sStrength - wStrength) > initDiff) ++wPos; else ++sPos;
				}
			}
			// PERFORM SWAP OF BEST PAIR OF SELECTIONS FROM EACH TEAM
			swapPlayers(wTeam, sTeam, wBestSel, sBestSel);
			return {teams: [wTeam, sTeam], strengths: [teamStrength(wTeam), teamStrength(sTeam)]};
		}
		
		
	  }

	  PlayerListService.$inject = ['$http', 'ApiBasePath1'];
	  function PlayerListService($http, ApiBasePath1) {
	  var service = this;
	  service.getPlayerList = function () {
		//console.log("inside getPlayerList");
		//console.log("ApiBasePath " , ApiBasePath1);
		  var response = $http({
		  method: "GET",
		  url: (ApiBasePath1)
		  });
  
		  return response;
		};}
    
 })();
