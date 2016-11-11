

function runExperiment(){
	
	serverPsych.request(function (settings){
		//do things with the settings
		var forcedChoiceStim;
		var forcedChoiceTrialCounter = 0;		
		var tobeadded;
		var ratingStims = [];
		
	    var build_node = {
			type: "call-function",
			func: function(){
				ImageRater.loadList(ratingStims);
				
				choiceTimeline = ImageRater.getTimeline(8, [0], 2);
				if(choiceTimeline === false){
					jsPsych.endExperiment("Could not proceed with choice task");
				}
			}
	    };
			    
	    
		settings.timeline.forEach(function(block, idx, timeline){
			if(block.type == "rating"){
				//im polishing up the rating block

				var stimsOrder = [];
				tobeadded= idx + 1;
				ratingStims = jsPsych.randomization.shuffle(settings.resources.images);
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
					for(var i=0; i < settings.length; i++){
						var blockBuilder = [];
						blockBuilder.push({stimulus: function(){return forcedChoiceStim[forcedChoiceTrialCounter]}});
					};
					return blockBuilder;
				});
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