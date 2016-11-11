

function runExperiment(){
	
	serverPsych.request(function (settings){
		//do things with the settings
		var forcedChoiceStim;
		var forcedChoiceTrialCounter = 0;		
		var tobeadded;
		var ratingStims = [];
		
		ImageRater.loadList(settings.resources.image);
		
	    var build_node = {
			type: "call-function",
			func: function(){
				forcedChoiceStim = ImageRater.getTimeline(8, [0], 2);
				if(forcedChoiceStim == false){
					jsPsych.endExperiment("Could not proceed with choice task");
				}
			}
	    };
			    
	    
		settings.timeline.forEach(function(block, idx, timeline){
			if(block.type == "rating"){
				//im polishing up the rating block

				var stimsOrder = [];
				tobeadded= idx + 1;
				ratingStims = jsPsych.randomization.shuffle(settings.resources.image);
			    ratingStims.forEach(function(image, idx, imagesArray){
					stimsOrder.push({stimulus: image});
				});	
			    block.timeline = stimsOrder;
			    block.on_finish = function(data){
			    	if(data.rating !== null ){
			    		ImageRater.rate(data.stimulus, data.rating);
			    	}
				}
			    
			}
			else if(block.type =='forcedchoice'){
				//im polishing up the forcedChoice block
				block.on_finish = function(data){
					forcedChoiceTrialCounter++;
				}
				
				block.timeline = (function(){
					var blockBuilder = [];
					for(var i=0; i < block.length; i++){
						
						blockBuilder.push({stimuli: function(){return forcedChoiceStim[forcedChoiceTrialCounter]}});
					};
					return blockBuilder;
				})();
			}
		});
		
		settings.timeline.splice(tobeadded, 0, build_node);
		
		jsPsych.init({
			timeline: settings.timeline,
			on_finish: function(data){
				serverPsych.save(data);
			},
			display_element: $('#jsPsychTarget')
		});
	});
	
}