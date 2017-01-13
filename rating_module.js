/**
* Module for organising visual stimuli and their rating as decided by the subject during the experiment.
* Also allows to create randomized and balanced stimuli pairs.
*
* @author Daniel Rivas
*/
var ImageRater = (function(){
	var module = {};
	
	var unsortedVault = {};
	
	var vault = {
		'-3': {},
		'-2': {},
		'-1': {},
		'0' : {},
		'1' : {},
		'2' : {},
		'3'	: {}
	};
	
	/**
	 * Searches all urls with the given rating and returns the one that has been used the least times, or false if all have been used more than allowed.
	 * increments its usage count before returning.
	 * 
	 * @param {number}	rating	The rating for which we wish to search
	 * @param {number}	max		The maximal usage count that the returned image can have
	 * @param {String}	exclude	An url that you wish to filter out, helps preventing choosing the same url in a row
	 * 
	 * @return {string|boolean} An image url if found, or false if none respects the maximum usage count
	 * @private
	 */
	function getImage(rating, max, exclude){
		exclude = exclude || "";
		var candidate;
		var usage = Infinity;
		var group = vault[rating.toString()];
		
		var possibleImages = Object.keys(group)
		shuffle(possibleImage);
		
		possibleImages.forEach(function(url){
			if(group[url] < max){
				return url;
			}
		})
		return false;
	};
	
	function shuffle(a) {
	    var j, x, i;
	    for (i = a.length; i; i--) {
	        j = Math.floor(Math.random() * i);
	        x = a[i - 1];
	        a[i - 1] = a[j];
	        a[j] = x;
	    }
	}
	
	
	
	function checkCollision(first, second){
		var res = false;
		first.forEach(function(i){
			second.forEach(function(j){
				if(i === j){
					res = true;
				};
			});
		});
		return res;
	}
	
	
	function hasRepeats(timeline){
		var result = [];
		timeline.forEach(function(elem, idx, arr){
			if( idx+1 < arr.length ){
				if(checkCollision(elem, arr[idx+1])){
					result.push(idx);
				}
			}
		});
		return result.length > 0 ? result : false;
	}
	
	
	function goodSpot(elem, idx, arr){
		var prev = false;
		var next = false;
		if(idx != 0){
			prev = checkCollision(elem, arr[idx-1]);
		}
		if(idx < (arr.length-1) ){
			next = checkCollision(elem, arr[idx+1]);
		}
		
		if( !(prev && next)){
			return true
		}
	}
	
	
	function exchange(timeline, from, to){
				
		var movedElem = timeline[from];
		var removedElem = timeline[to];
		if( goodSpot(movedElem, to, timeline) && goodSpot(removedElem, from, timeline)){
			//we can switch both pairs without problems!
			
			var temp1 = timeline.splice(from, 1);
			var temp2 = timeline.splice(to, 1);
			timeline.splice(from, 0, temp2);
			timeline.splice(to, 0, temp1);
			
			return true
		}
		else{
			return false
		}
	}
	
	
	/**
	* Stores a single image URL under an optional name in the store
	*/
	module.loadSingle = function(url, name){
		var pathComponents = url.split("/");
		name = name || pathComponents[pathComponents.length-1].split(".")[0]; //keep the filename at the end of the URL but without the extension
		unsortedVault[name] = url;
	}
	
	module.loadList = function(urls){
		urls.forEach(function(elt){
			module.loadSingle(elt);
		})
	}
	
	
	/**
	* Associates a signed integer rating to the url of an image for future reference
	*/
	module.rate = function(url, rating){
		vault[rating.toString()][url] = 0;
		unsortedVault[url]=rating;
	}
	
	/**
	 * Returns the rating of an image according to its url
	 */
	module.getRating = function(url){
		return unsortedVault[url];
	}
		
	/**
	* Returns the number of images that have been given the specified rating so far
	*/
	module.getSize = function(rating){
		return Object.keys(vault[rating.toString()]).length;
	}
	
	function alreadyHas(arr, target){
		for(var i=0;i<arr.length; i++){
			if((arr[i][0] == target[0] && arr[i][1] == target[1]) || (arr[i][0] == target[1] && arr[i][1] == target[0])){
				return true;
			}
		}
		return false;
	}
	
	/**
	 * Initializes the vault with custom rating values
	 */
	module.initRatings = function(start, count){
		vault = {};
		for(var i=start; i<count+1; i++){
			vault[i] = {};
		};
	}
	
	
	/**
	* 
	*/
	module.getPairs = function(repeat_limit, distances, num_pairs){
		repeat_limit = repeat_limit || 8;
		var pairs = {};
		
		//we need to form an array of pairs for each demanded distance
		var success = distances.every(function(distance, i, array) {
			if(distance < 0 ){
				throw "cannot create pairs of negative distances";
			}
			pairs[distance.toString()] = []
			//enumerate all possible rating combinations that respect the given distance
			var possibilities = [];
			for(var i=0; i< 4; i++){ //TODO: allow arbitrary number of rating values
				if(i+distance < 4){
					possibilities.push([i.toString(), (i+distance).toString()]);
				}
			}
			
			//now continuously loop through those rating pairs (0-2, 1-3, etc) and try to create a pair with one images of the corresponding rating
			var pairCount = 0;
			var pairCursor = 0;
			var failure = false;
			
			//circling through the array of possibilities as long as we don't have enough pairs
			while(pairCount < num_pairs){
				if(possibilities.length === 0){
					failure = true;
					break;
				}
				if(pairCursor >= possibilities.length){
					pairCursor = 0;
				}
				//choose which of the possible pair types to try
				var pairType = possibilities[pairCursor];
				// try to find a usable pair of images
				var first;
				var secnd;
				
				
				// Let's get the shuffled list of all image names that have been rated as the first rating of the current rating pair
				var firstSubgroup = vault[pairType[0].toString()];
				var firstImgCandidates = Object.keys(firstSubgroup);
				shuffle(firstImgCandidates);
				//Go through each of them, verifying that:
				firstImgCandidates.some(function(candidateFirst){
					//It has not been used more than the limit number of times
					if(firstSubgroup[candidateFirst] >= repeat_limit) return false;
					first = candidateFirst //we have a winner! store it in the 'first' variable
					
					//having found a first image that can still be used, iterate through all the images of the other rating making sure that:
					var secndSubgroup = vault[pairType[1].toString()];
					var secndImgCandidates = Object.keys(secndSubgroup);
					shuffle(secndImgCandidates);
					
					var found = secndImgCandidates.some(function(candidateSecnd){ //see documentation for Array#some https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/some
						//1) it has not been used more than the repeat limit
						usageCount = secndSubgroup[candidateSecnd];
						if(usageCount >= repeat_limit) return false; //used too often, pass!
						//2) it would not form a pair that has already been used
						if(alreadyHas(pairs[distance.toString()], [first, candidateSecnd])) return false;
						//3) it is not the very same image
						if(first == candidateSecnd) return false;
						
						//we have a winner! assign to the 'secnd' variable
						secnd = candidateSecnd;
						
						return true;
					})
					if(found){
						return true; //success!
					}
					else{
						//we could not find a friend for the first image so we must return false and keep looking amond the firstImgCandidates...
						return false
					}
				});

				//if we could not find a suitable image for either rating, BUT don't abort, we might be able to reach enough pairs using other pairTypes
				if(!(first && secnd)){
					possibilities.splice(pairCursor, 1); //remove that possibility since we were not able to find a pair for it. Do not incremenent cursors since rest of array was shifted already
				}
				else{
					//we found suitable image names! we must increment their usage count
					vault[pairType[0].toString()][first] += 1;
					vault[pairType[1].toString()][secnd] += 1;
					
					var thePair = [first, secnd];
					//randomly shuffle the elements of the pair so that there is no bias
					shuffle(thePair)
					
					pairs[distance.toString()].push(thePair);
					pairCursor++;
					pairCount++;
				}
			}
			return !failure;
		});
		
		if(success){
			return pairs;
		}
		else{
			return false;
		}
	}
	
	/**
	 * Constructs the list of image pairs necessary for the forced-choice binary task, balanced among the distance between the rating among pair members.
	 * 
	 * @param {integer} 	repeat_limit	The maximum number of times an url can appear among all pairs
	 * @param {integer[]}	distances		the rating differences for which you want to create pairs, must be all positive
	 * @param {integer}		num_pairs		How many pairs per entry in the distances array you want.
	 * @return {Array[]|boolean}			An array of url pairs (two-entry array)
	 * @public
	 */
	module.getTimeline = function(repeat_limit, distances, num_pairs){
		//default values based on previous paper "Testing necessary regional frontal contributions to value assessment and fixation-based updating"
		repeat_limit = repeat_limit || 8;
		distances = distances || [0, 1 ,2];
		num_pairs = num_pairs || 34;
		
		var pairs = module.getPairs(repeat_limit, distances, num_pairs);
		if(pairs){
			var timeline = [];
			for (dist in pairs){
				if(pairs.hasOwnProperty(dist)){
					timeline = timeline.concat(pairs[dist]);
				}
			}
			shuffle(timeline);
			//We must check here whether we have consecutive pairs that share even a single image.\
			if(hasRepeats(timeline)){
				var errors;
				var tries=0;
				while(errors = hasRepeats( timeline )){
					
					if(tries > 100){ //this horrible method is only slightly better than a bogosort https://en.wikipedia.org/wiki/Bogosort
						throw "impossible to construct a timeline with no adjacent repeats of images"
					}
					
					var success = false;
					success = errors.every(function(error, i, array) {
						var wrongPair = timeline[error];
						var newplace = false;
						
						return timeline.some(function(elem, i){
							if(exchange(timeline, error, i)){
								return true;
							}
						});
					});
					
					
					if(success){
						return timeline;
					}
					else{
						shuffle(timeline);
						tries++;
					}
				}
			}
			else{
				return timeline;
			}
		}
		else{
			return false
		}
	}
	
	return module;
})();