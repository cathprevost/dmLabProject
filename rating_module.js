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
	function getLeastUsed(rating, max, exclude){
		exclude = exclude || "";
		var candidate;
		var usage = Infinity;
		var group = vault[rating.toString()];
		for (url in group){
			if(group.hasOwnProperty(url)){
				if(group[url] < usage && url !== exclude){
					usage = group[url];
					candidate = url;
				}
			}	
		}
		if(usage > max){
			//failed to find an entry used less than the max param
			return false;
		}
		else{
			group[candidate] = group[candidate] + 1;
			return candidate;
		}
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
	}
	
	/**
	* Returns the number of images that have been given the specified rating so far
	*/
	module.getSize = function(rating){
		return Object.keys(vault[rating.toString()]).length;
	}
	
	/**
	* 
	*/
	module.getPairs = function(repeat_limit, distances, num_pairs){
		repeat_limit = repeat_limit || 8;
		var pairs = {};
		
		//we need to form an array of pairs for each demanded distance
		var success = distances.every(function(elt, i, array) {
			if(elt < 0 ){
				throw "cannot create pairs of negative distances";
			}
			pairs[elt.toString()] = []
			//enumerate all possible rating combinations that respect the given distance
			var possibilities = [];
			for(var i=0; i< 4; i++){ //TODO: allow arbitrary number of rating values
				if(i+elt < 4){
					possibilities.push([i.toString(), (i+elt).toString()]);
				}
			}
			
			//now continuously loop through those rating pairs (0-2, 1-3, etc) and try to create a pair with one images of the corresponding rating
			var pairCount = 0;
			var pairCursor = 0;
			var failure = false;
			
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
				// try to find a usable image for each rating in the pair
				var first = getLeastUsed(pairType[0], repeat_limit);
				var secnd;
				if(first){
					secnd = getLeastUsed(pairType[1], repeat_limit, first);
				}
				
				//if we could not find a suitable image for either rating, BUT don't abort, we might be able to reach enough pairs using other pairTypes
				if(!(first && secnd)){
					possibilities.splice(pairCursor, 1); //remove that possibility since we were not able to find a pair for it. Do not incremenent cursors since rest of array was shifted already
				}
				else{
					//we found suitable image names, increment their usage count and return the pair
					pairs[elt.toString()].push([first, secnd]);
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
			return timeline;
		}
		else{
			return false
		}
	}
	
	return module;
})();