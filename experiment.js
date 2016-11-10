

function runExperiment(){
	
	serverPsych.request(function (settings){
		//do things with the settings
		var forcedChoiceStim;
		var forcedChoiceTrialCounter = 0;		
		var tobeadded;
		
	    var build_node = {
			type: "call-function",
			func: function(){
				choiceTimeline = ImageRater.getTimeline(8, [0], 32);
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
				var ratingStims = jsPsych.randomization.shuffle(settings.resources.images);
			    ratingStims.forEach(function(image, idx, imagesArray){
					stimsOrder.push({stimulus: image});
				});	
			    block.timeline = stimsOrder;
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
			}
		});
	});
	
}
