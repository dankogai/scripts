
let timerIDs = [];
let counter = 0;
timerIDs[0] = ThreadManager.setInterval(function(){
	print(counter++ + ": HogeFuga");
}, 1000);
timerIDs[1] = ThreadManager.setInterval(function(){
	print("FooBar");
}, 2500);

ThreadManager.setTimeout(function(){
	timerIDs.forEach(function(timerID){
		ThreadManager.clearInterval(timerID);
	});
	print("END");
}, 10000);
ThreadManager.wait();

