

function runExperiment(){
	
	serverPsych.request(function (settings){
		//do things with the settings
		
		settings.timeline.forEach(function(element){
			if(element.type == "rating"){
				//im polishing up the rating block
			}
			else if(element.type =='forcedchoice'){
				
			}
		});
		
		jsPsych.init({
			timeline: settings.timeline,
			on_finish: function(data){
				serverPsych.save(data);
			}
		});
	});
	
}
