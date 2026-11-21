(function (cjs, an) {

var p; // shortcut to reference prototypes
var lib={};var ss={};var img={};
lib.ssMetadata = [];


(lib.AnMovieClip = function(){
	this.actionFrames = [];
	this.ignorePause = false;
	this.gotoAndPlay = function(positionOrLabel){
		cjs.MovieClip.prototype.gotoAndPlay.call(this,positionOrLabel);
	}
	this.play = function(){
		cjs.MovieClip.prototype.play.call(this);
	}
	this.gotoAndStop = function(positionOrLabel){
		cjs.MovieClip.prototype.gotoAndStop.call(this,positionOrLabel);
	}
	this.stop = function(){
		cjs.MovieClip.prototype.stop.call(this);
	}
}).prototype = p = new cjs.MovieClip();
// symbols:
// helper functions:

function mc_symbol_clone() {
	var clone = this._cloneProps(new this.constructor(this.mode, this.startPosition, this.loop, this.reversed));
	clone.gotoAndStop(this.currentFrame);
	clone.paused = this.paused;
	clone.framerate = this.framerate;
	return clone;
}

function getMCSymbolPrototype(symbol, nominalBounds, frameBounds) {
	var prototype = cjs.extend(symbol, cjs.MovieClip);
	prototype.clone = mc_symbol_clone;
	prototype.nominalBounds = nominalBounds;
	prototype.frameBounds = frameBounds;
	return prototype;
	}


(lib.Weapons_Tab = function(mode,startPosition,loop,reversed) {
if (loop == null) { loop = true; }
if (reversed == null) { reversed = false; }
	var props = new Object();
	props.mode = mode;
	props.startPosition = startPosition;
	props.labels = {};
	props.loop = loop;
	props.reversed = reversed;
	cjs.MovieClip.apply(this,[props]);

	// Weapons
	this.shape = new cjs.Shape();
	this.shape.graphics.f("#FFFFFF").s().p("AgMBRIAAh+IAVAAIAAANQALgPASAAQASAAAKAOQAKAOAAATQAAAUgKAOQgLANgRAAQgOAAgNgNIAAAvgAALAAQAAAcAVAAQAUAAgBgcQAAgbgTAAQgVAAAAAbgAEuATIAYgDQADAOARAAQARAAAAgKQAAgGgKgCQghgHgIgGQgHgHAAgLQAAgcAmAAQAiAAAHAYIgXAFQgDgLgOAAQgQgBAAAIQAAAGAaAGQASAEAHAGQAIAFAAAMQAAAPgMAHQgMAJgRgBQglAAgHgcgABnAjQgNgNAAgWQAAgUANgOQAMgNAWAAQAVAAANANQANANAAAVQAAAUgOAOQgMANgVAAQgWABgMgNgAB5gTQgHAHAAAMQAAAMAHAIQAFAHALAAQALAAAFgHQAGgIAAgMQAAgMgGgHQgFgIgLAAQgLAAgFAIgAhrAoQgJgHAAgNQAAgKAGgHQAFgGAWgEQASgEAGgCIAAgDQAAgMgQAAQgMAAgFALIgVgEQAHgaAgAAQAXAAAIAIQAIAIAAAUIgBAbQABASAFALIgYAAIgDgJQgNAMgPgBQgOAAgIgHgAhXAKQgEADgBAFQAAAGAEADQAFAEAFgBQATAAAAgXIAAgGQgMADgQAGgAjMAiQgLgOAAgUQAAgUAMgOQALgNATAAQAsAAAAA2Ig9AAQABAWATAAQAMAAADgNIAZAEQgKAbgeAAQgXAAgLgNgAi9gHIAkAAQgBgVgRAAQgSAAAAAVgAEFAtIAAgtQAAgQgDgHQgDgFgIAAQgIgBgHAFQgFAFgBAXIAAApIgXAAIAAhaIAWAAIAAANQAMgPASAAQAfAAAAAlIAAA3gAkWAtIgZhdIgZBdIgbAAIgfh9IAaAAIATBWIAYhWIAdAAIAXBYIAThYIAaAAIgfB9g");
	this.shape.setTransform(-1.55,0.4);

	this.timeline.addTween(cjs.Tween.get(this.shape).wait(3));

	// Layer_3
	this.shape_1 = new cjs.Shape();
	this.shape_1.graphics.f().s("#FFFFFF").ss(1,1,1).p("AnsjxIPZAAIAAHjIvZAAg");
	this.shape_1.setTransform(-0.025,0);

	this.shape_2 = new cjs.Shape();
	this.shape_2.graphics.f("#1A1F2A").s().p("AnsDxIAAnhIPZAAIAAHhg");
	this.shape_2.setTransform(-0.025,0);

	this.shape_3 = new cjs.Shape();
	this.shape_3.graphics.f("#485572").s().p("AnsDxIAAnhIPZAAIAAHhg");
	this.shape_3.setTransform(-0.025,0);

	this.shape_4 = new cjs.Shape();
	this.shape_4.graphics.f("#927224").s().p("AnsDxIAAnhIPZAAIAAHhg");
	this.shape_4.setTransform(-0.025,0);

	this.timeline.addTween(cjs.Tween.get({}).to({state:[{t:this.shape_2},{t:this.shape_1}]}).to({state:[{t:this.shape_3},{t:this.shape_1}]},1).to({state:[{t:this.shape_4},{t:this.shape_1}]},1).wait(1));

	this._renderFirstFrame();

}).prototype = p = new cjs.MovieClip();
p.nominalBounds = new cjs.Rectangle(-50.3,-25.1,100.6,50.3);


(lib.Unit_Tab = function(mode,startPosition,loop,reversed) {
if (loop == null) { loop = true; }
if (reversed == null) { reversed = false; }
	var props = new Object();
	props.mode = mode;
	props.startPosition = startPosition;
	props.labels = {};
	props.loop = loop;
	props.reversed = reversed;
	cjs.MovieClip.apply(this,[props]);

	// Units
	this.shape = new cjs.Shape();
	this.shape.graphics.f("#FFFFFF").s().p("AB8AkIAZgEQACAPARAAQASgBAAgJQAAgGgKgCQgigHgIgIQgGgHgBgKQAAgcAnAAQAiABAGAYIgWAEQgEgLgNAAQgRAAAAAIQAAAFAaAFQATAFAHAFQAIAHAAALQAAAPgNAIQgMAIgRAAQgkAAgIgcgABPA5QgEgIAAgTIAAgnIgLAAIAAgUIALAAIAAgSIAYgNIAAAfIARAAIAAAUIgRAAIAAAkQAAAKACAEQABADAEAAQADAAAHgDIACATQgIAEgLAAQgPAAgFgHgAi9A6QgLgIgFgKQgEgLAAgaIAAhCIAaAAIAABDIABAWQABAHAHAFQAFAEAMAAQAOAAAFgGQAFgHAAgYIAAhEIAZAAIAABBQAAAXgCAMQgDAMgMAHQgKAIgVAAQgVAAgMgGgAAZA+IAAhbIAYAAIAABbgAgWA+IAAgvQAAgPgEgGQgCgGgKAAQgIAAgGAFQgFAEAAAYIAAApIgZAAIAAhbIAXAAIAAAOQAMgQASAAQAeAAAAAkIAAA5gAAZgpIAAgWIAYAAIAAAWg");
	this.shape.setTransform(-0.65,-1.25);

	this.timeline.addTween(cjs.Tween.get(this.shape).wait(3));

	// Layer_3
	this.shape_1 = new cjs.Shape();
	this.shape_1.graphics.f().s("#FFFFFF").ss(1,1,1).p("AnsjxIPZAAIAAHjIvZAAg");
	this.shape_1.setTransform(-0.025,0);

	this.shape_2 = new cjs.Shape();
	this.shape_2.graphics.f("#1A1F2A").s().p("AnsDxIAAnhIPZAAIAAHhg");
	this.shape_2.setTransform(-0.025,0);

	this.shape_3 = new cjs.Shape();
	this.shape_3.graphics.f("#485572").s().p("AnsDxIAAnhIPZAAIAAHhg");
	this.shape_3.setTransform(-0.025,0);

	this.shape_4 = new cjs.Shape();
	this.shape_4.graphics.f("#927224").s().p("AnsDxIAAnhIPZAAIAAHhg");
	this.shape_4.setTransform(-0.025,0);

	this.timeline.addTween(cjs.Tween.get({}).to({state:[{t:this.shape_2},{t:this.shape_1}]}).to({state:[{t:this.shape_3},{t:this.shape_1}]},1).to({state:[{t:this.shape_4},{t:this.shape_1}]},1).wait(1));

	this._renderFirstFrame();

}).prototype = p = new cjs.MovieClip();
p.nominalBounds = new cjs.Rectangle(-50.3,-25.1,100.6,50.3);


(lib.Turrent_Tab = function(mode,startPosition,loop,reversed) {
if (loop == null) { loop = true; }
if (reversed == null) { reversed = false; }
	var props = new Object();
	props.mode = mode;
	props.startPosition = startPosition;
	props.labels = {};
	props.loop = loop;
	props.reversed = reversed;
	cjs.MovieClip.apply(this,[props]);

	// Turrent
	this.shape = new cjs.Shape();
	this.shape.graphics.f("#FFFFFF").s().p("AEKA5QgEgIAAgTIAAgnIgLAAIAAgUIALAAIAAgSIAYgNIAAAfIARAAIAAAUIgRAAIAAAkQABAKABAEQABADAEAAQAEAAAGgDIACATQgJAEgKAAQgPAAgFgHgAA7AyQgKgOAAgTQAAgVALgNQALgOATAAQAsABAAA1Ig8AAQABAXASAAQALAAAEgOIAYAFQgJAbgeAAQgYAAgKgOgABKAJIAkAAQgBgVgRAAQgSAAAAAVgAi9AdIAAg6IAZAAIAAAqQAAATADAHQADAHAJAAQALgBAEgGQAFgIAAgWIAAgmIAYAAIAABbIgXAAIAAgOQgKAQgUAAQgfAAAAgjgADUA+IAAgvQAAgPgCgGQgEgGgJAAQgHAAgGAFQgHAEAAAYIAAApIgYAAIAAhbIAXAAIAAAOQAMgQASAAQAfAAAAAkIAAA5gAgNA+IAAhbIAVAAIAAAOQAKgPAMgBQAHAAAIAGIgHAUQgGgDgGAAQgJgBgDAJQgDAIAAAaIAAAcgAhSA+IAAhbIAXAAIAAAOQAKgPALgBQAIAAAIAGIgIAUQgGgDgFAAQgJgBgEAJQgDAIAAAaIAAAcgAkKA+IAAhoIgmAAIAAgVIBkAAIAAAVIgmAAIAABog");
	this.shape.setTransform(-1.45,-1.25);

	this.timeline.addTween(cjs.Tween.get(this.shape).wait(3));

	// Layer_3
	this.shape_1 = new cjs.Shape();
	this.shape_1.graphics.f().s("#FFFFFF").ss(1,1,1).p("AnsjxIPZAAIAAHjIvZAAg");
	this.shape_1.setTransform(-0.025,0);

	this.shape_2 = new cjs.Shape();
	this.shape_2.graphics.f("#1A1F2A").s().p("AnsDxIAAnhIPZAAIAAHhg");
	this.shape_2.setTransform(-0.025,0);

	this.shape_3 = new cjs.Shape();
	this.shape_3.graphics.f("#485572").s().p("AnsDxIAAnhIPZAAIAAHhg");
	this.shape_3.setTransform(-0.025,0);

	this.shape_4 = new cjs.Shape();
	this.shape_4.graphics.f("#927224").s().p("AnsDxIAAnhIPZAAIAAHhg");
	this.shape_4.setTransform(-0.025,0);

	this.timeline.addTween(cjs.Tween.get({}).to({state:[{t:this.shape_2},{t:this.shape_1}]}).to({state:[{t:this.shape_3},{t:this.shape_1}]},1).to({state:[{t:this.shape_4},{t:this.shape_1}]},1).wait(1));

	this._renderFirstFrame();

}).prototype = p = new cjs.MovieClip();
p.nominalBounds = new cjs.Rectangle(-50.3,-25.1,100.6,50.3);


(lib.Spawn_Tab = function(mode,startPosition,loop,reversed) {
if (loop == null) { loop = true; }
if (reversed == null) { reversed = false; }
	var props = new Object();
	props.mode = mode;
	props.startPosition = startPosition;
	props.labels = {};
	props.loop = loop;
	props.reversed = reversed;
	cjs.MovieClip.apply(this,[props]);

	// Spawn
	this.shape = new cjs.Shape();
	this.shape.graphics.f("#FFFFFF").s().p("AiXBSIAAh+IAXAAIAAANQAKgPASAAQASAAAKAOQAKAOAAASQAAAVgKAOQgKANgSAAQgOAAgNgNIAAAvgAh/AAQAAAdAVAAQAUAAAAgcQAAgbgUAAQgVAAAAAagAgoApQgJgHAAgNQAAgKAGgHQAFgGAWgEQAQgEAHgCIAAgDQAAgMgQAAQgLAAgFALIgVgEQAHgaAgAAQAWAAAIAIQAIAIAAAUIgBAbQAAASAGALIgYAAIgDgJQgMAMgQgBQgNAAgIgHgAgUALQgFADAAAFQAAAGAEADQAFAEAFgBQASAAAAgXIAAgGQgLADgQAGgAkSAFIAZgCQAEAYAXABQAZAAAAgSQAAgGgFgEQgGgDgVgEQgogLAAgbQAAgSAMgIQANgKAVABQAvgBABAmIgZABQgDgRgVgBQgVABAAALQAAAFAEADQAEAEAUAFQAfAJAIAJQAHALAAAMQAAAngzgBQgvABgFgsgAD6AuIAAguQAAgPgDgHQgDgFgJAAQgIgBgGAFQgGAFAAAXIAAApIgYAAIAAhaIAXAAIAAANQAMgPASAAQAfAAAAAlIAAA3gAB+AuIgPg6IgQA6IgXAAIgdhaIAXAAIARA7IAQg7IAXAAIAQA7IARg7IAYAAIgeBag");
	this.shape.setTransform(-1.825,0.3);

	this.timeline.addTween(cjs.Tween.get(this.shape).wait(3));

	// Layer_3
	this.shape_1 = new cjs.Shape();
	this.shape_1.graphics.f().s("#FFFFFF").ss(1,1,1).p("AnsjxIPZAAIAAHjIvZAAg");
	this.shape_1.setTransform(-0.025,0);

	this.shape_2 = new cjs.Shape();
	this.shape_2.graphics.f("#1A1F2A").s().p("AnsDxIAAnhIPZAAIAAHhg");
	this.shape_2.setTransform(-0.025,0);

	this.shape_3 = new cjs.Shape();
	this.shape_3.graphics.f("#485572").s().p("AnsDxIAAnhIPZAAIAAHhg");
	this.shape_3.setTransform(-0.025,0);

	this.shape_4 = new cjs.Shape();
	this.shape_4.graphics.f("#927224").s().p("AnsDxIAAnhIPZAAIAAHhg");
	this.shape_4.setTransform(-0.025,0);

	this.timeline.addTween(cjs.Tween.get({}).to({state:[{t:this.shape_2},{t:this.shape_1}]}).to({state:[{t:this.shape_3},{t:this.shape_1}]},1).to({state:[{t:this.shape_4},{t:this.shape_1}]},1).wait(1));

	this._renderFirstFrame();

}).prototype = p = new cjs.MovieClip();
p.nominalBounds = new cjs.Rectangle(-50.3,-25.1,100.6,50.3);


(lib.Skills_tab = function(mode,startPosition,loop,reversed) {
if (loop == null) { loop = true; }
if (reversed == null) { reversed = false; }
	var props = new Object();
	props.mode = mode;
	props.startPosition = startPosition;
	props.labels = {};
	props.loop = loop;
	props.reversed = reversed;
	cjs.MovieClip.apply(this,[props]);

	// Layer_1
	this.shape = new cjs.Shape();
	this.shape.graphics.f("#FFFFFF").s().p("ACJAlIAZgEQADAPAQAAQASgBAAgJQAAgGgKgCQgigHgHgIQgHgHAAgKQAAgcAmAAQAiABAHAYIgXAEQgDgLgOAAQgRAAAAAIQAAAEAaAGQATAFAHAFQAIAHAAALQAAAPgMAIQgNAIgRAAQgkAAgIgcgAjeAWIAZgCQAEAYAXAAQAZAAAAgSQAAgGgFgEQgGgDgVgFQgogJAAgcQAAgRAMgJQANgJAVAAQAvAAABAmIgZABQgDgSgVAAQgVAAAAAMQAAAFAEADQAEAEAUAFQAfAIAIAJQAHAKAAANQAAAngzAAQgvAAgFgrgABhA/IAAh9IAYAAIAAB9gAAwA/IAAh9IAYAAIAAB9gAAAA/IAAhbIAXAAIAABbgAgoA/IgYgpIgLALIAAAeIgYAAIAAh9IAYAAIAABCIAdggIAdAAIgfAhIAhA6gAAAgoIAAgWIAXAAIAAAWg");
	this.shape.setTransform(-0.925,-1.35);

	this.timeline.addTween(cjs.Tween.get(this.shape).wait(3));

	// Layer_2
	this.shape_1 = new cjs.Shape();
	this.shape_1.graphics.f().s("#FFFFFF").ss(1,1,1).p("AnsjxIPZAAIAAHjIvZAAg");
	this.shape_1.setTransform(-0.025,0);

	this.shape_2 = new cjs.Shape();
	this.shape_2.graphics.f("#1A1F2A").s().p("AnsDxIAAnhIPZAAIAAHhg");
	this.shape_2.setTransform(-0.025,0);

	this.shape_3 = new cjs.Shape();
	this.shape_3.graphics.f("#485572").s().p("AnsDxIAAnhIPZAAIAAHhg");
	this.shape_3.setTransform(-0.025,0);

	this.shape_4 = new cjs.Shape();
	this.shape_4.graphics.f("#927224").s().p("AnsDxIAAnhIPZAAIAAHhg");
	this.shape_4.setTransform(-0.025,0);

	this.timeline.addTween(cjs.Tween.get({}).to({state:[{t:this.shape_2},{t:this.shape_1}]}).to({state:[{t:this.shape_3},{t:this.shape_1}]},1).to({state:[{t:this.shape_4},{t:this.shape_1}]},1).wait(1));

	this._renderFirstFrame();

}).prototype = p = new cjs.MovieClip();
p.nominalBounds = new cjs.Rectangle(-50.3,-25.1,100.6,50.3);


(lib.scrollBar = function(mode,startPosition,loop,reversed) {
if (loop == null) { loop = true; }
if (reversed == null) { reversed = false; }
	var props = new Object();
	props.mode = mode;
	props.startPosition = startPosition;
	props.labels = {};
	props.loop = loop;
	props.reversed = reversed;
	cjs.MovieClip.apply(this,[props]);

	// Layer_1
	this.shape = new cjs.Shape();
	this.shape.graphics.f("#FFFFFF").s().p("AgQDZIAAmxIAhAAIAAGxg");
	this.shape.setTransform(0.025,-0.025);

	this.timeline.addTween(cjs.Tween.get(this.shape).wait(1));

	this._renderFirstFrame();

}).prototype = getMCSymbolPrototype(lib.scrollBar, new cjs.Rectangle(-1.6,-21.7,3.3,43.4), null);


(lib.Rule_Tab = function(mode,startPosition,loop,reversed) {
if (loop == null) { loop = true; }
if (reversed == null) { reversed = false; }
	var props = new Object();
	props.mode = mode;
	props.startPosition = startPosition;
	props.labels = {};
	props.loop = loop;
	props.reversed = reversed;
	cjs.MovieClip.apply(this,[props]);

	// Rule
	this.shape = new cjs.Shape();
	this.shape.graphics.f("#FFFFFF").s().p("ABqAyQgLgOAAgTQAAgVAMgNQALgOATAAQAsABAAA1Ig9AAQABAXATAAQALAAAEgOIAYAFQgJAbgeAAQgYAAgKgOgAB5AJIAkAAQgBgVgRAAQgSAAAAAVgAg2AdIAAg6IAZAAIAAAqQAAATADAHQACAHAKAAQALgBADgGQAEgIAAgWIAAgmIAZAAIAABbIgXAAIAAgOQgKAQgTAAQgfAAAAgjgAA1A+IAAh9IAZAAIAAB9gAhhA+IgbgpQgEgGgFgDQgFgCgLAAIgFAAIAAA0IgaAAIAAh9IA2AAQAZAAAMAHQAMAIAAAUQAAAdghAFQANAHAPAZIAQAYgAiagKIASAAQAUAAAGgDQAHgDAAgKQAAgKgGgDQgFgDgUAAIgUAAg");
	this.shape.setTransform(-0.525,-1.25);

	this.timeline.addTween(cjs.Tween.get(this.shape).wait(3));

	// Layer_3
	this.shape_1 = new cjs.Shape();
	this.shape_1.graphics.f().s("#FFFFFF").ss(1,1,1).p("AnsjxIPZAAIAAHjIvZAAg");
	this.shape_1.setTransform(-0.025,0);

	this.shape_2 = new cjs.Shape();
	this.shape_2.graphics.f("#1A1F2A").s().p("AnsDxIAAnhIPZAAIAAHhg");
	this.shape_2.setTransform(-0.025,0);

	this.shape_3 = new cjs.Shape();
	this.shape_3.graphics.f("#485572").s().p("AnsDxIAAnhIPZAAIAAHhg");
	this.shape_3.setTransform(-0.025,0);

	this.shape_4 = new cjs.Shape();
	this.shape_4.graphics.f("#927224").s().p("AnsDxIAAnhIPZAAIAAHhg");
	this.shape_4.setTransform(-0.025,0);

	this.timeline.addTween(cjs.Tween.get({}).to({state:[{t:this.shape_2},{t:this.shape_1}]}).to({state:[{t:this.shape_3},{t:this.shape_1}]},1).to({state:[{t:this.shape_4},{t:this.shape_1}]},1).wait(1));

	this._renderFirstFrame();

}).prototype = p = new cjs.MovieClip();
p.nominalBounds = new cjs.Rectangle(-50.3,-25.1,100.6,50.3);


(lib.Resource_Tab = function(mode,startPosition,loop,reversed) {
if (loop == null) { loop = true; }
if (reversed == null) { reversed = false; }
	var props = new Object();
	props.mode = mode;
	props.startPosition = startPosition;
	props.labels = {};
	props.loop = loop;
	props.reversed = reversed;
	cjs.MovieClip.apply(this,[props]);

	// Resource
	this.shape = new cjs.Shape();
	this.shape.graphics.f("#FFFFFF").s().p("AE8AyQgKgOAAgTQAAgVALgNQALgOAUAAQArABAAA1Ig8AAQABAXASAAQAMAAAEgOIAYAFQgKAbgeAAQgXAAgLgOgAFLAJIAkAAQgBgVgRAAQgSAAAAAVgADdAzQgLgNAAgWQAAgSAKgOQAKgPAYAAQAgABAJAdIgYADQgDgOgOAAQgUAAAAAaQAAAeAVAAQAOAAADgRIAYAEQgIAhgjAAQgUAAgMgNgAAmAdIAAg6IAZAAIAAAqQAAATADAHQACAHAKAAQALgBAEgGQAEgIAAgWIAAgmIAZAAIAABbIgXAAIAAgOQgLAQgTAAQgfAAAAgjgAg8AzQgNgMAAgYQAAgTANgNQANgOAVAAQAVAAAMAOQANANAAAUQAAAVgNANQgMAOgVAAQgVAAgNgNgAgqgDQgGAGAAANQAAANAGAIQAGAHAKAAQALAAAGgHQAFgJAAgMQAAgNgFgGQgGgIgLAAQgKAAgGAIgAiuAkIAYgEQADAPARAAQARgBAAgJQAAgGgKgCQghgHgIgIQgHgHAAgKQAAgcAnAAQAhABAHAYIgXAEQgDgLgOAAQgQAAAAAIQAAAFAaAFQASAFAIAFQAHAHAAALQAAAPgMAIQgMAIgRAAQglAAgHgcgAkEAyQgLgOAAgTQAAgVAMgNQALgOATAAQAsABAAA1Ig9AAQABAXATAAQALAAAEgOIAYAFQgJAbgeAAQgYAAgKgOgAj1AJIAkAAQgBgVgRAAQgSAAAAAVgACRA+IAAhbIAXAAIAAAOQAJgPAMgBQAIAAAIAGIgIAUQgGgDgFAAQgKgBgDAJQgDAIAAAaIAAAcgAkzA+IgcgpQgEgGgFgDQgFgCgLAAIgFAAIAAA0IgZAAIAAh9IA1AAQAZAAANAHQAMAIAAAUQAAAdghAFQAMAHAQAZIAPAYgAltgKIATAAQATAAAHgDQAHgDAAgKQAAgKgGgDQgGgDgUAAIgUAAg");
	this.shape.setTransform(-1.275,-1.25);

	this.timeline.addTween(cjs.Tween.get(this.shape).wait(3));

	// Layer_3
	this.shape_1 = new cjs.Shape();
	this.shape_1.graphics.f().s("#FFFFFF").ss(1,1,1).p("AnsjxIPZAAIAAHjIvZAAg");
	this.shape_1.setTransform(-0.025,0);

	this.shape_2 = new cjs.Shape();
	this.shape_2.graphics.f("#1A1F2A").s().p("AnsDxIAAnhIPZAAIAAHhg");
	this.shape_2.setTransform(-0.025,0);

	this.shape_3 = new cjs.Shape();
	this.shape_3.graphics.f("#485572").s().p("AnsDxIAAnhIPZAAIAAHhg");
	this.shape_3.setTransform(-0.025,0);

	this.shape_4 = new cjs.Shape();
	this.shape_4.graphics.f("#927224").s().p("AnsDxIAAnhIPZAAIAAHhg");
	this.shape_4.setTransform(-0.025,0);

	this.timeline.addTween(cjs.Tween.get({}).to({state:[{t:this.shape_2},{t:this.shape_1}]}).to({state:[{t:this.shape_3},{t:this.shape_1}]},1).to({state:[{t:this.shape_4},{t:this.shape_1}]},1).wait(1));

	this._renderFirstFrame();

}).prototype = p = new cjs.MovieClip();
p.nominalBounds = new cjs.Rectangle(-50.3,-25.1,100.6,50.3);


(lib.Pager = function(mode,startPosition,loop,reversed) {
if (loop == null) { loop = true; }
if (reversed == null) { reversed = false; }
	var props = new Object();
	props.mode = mode;
	props.startPosition = startPosition;
	props.labels = {};
	props.loop = loop;
	props.reversed = reversed;
	cjs.MovieClip.apply(this,[props]);

	// Layer_1
	this.shape = new cjs.Shape();
	this.shape.graphics.f().s("#FFFFFF").ss(1,1,1).p("AA5hwIhxBwIBxBx");
	this.shape.setTransform(0.025,-1.4125);

	this.shape_1 = new cjs.Shape();
	this.shape_1.graphics.f().s("#FFFFFF").ss(1,1,1).p("AickDIE5AAIAAIHIk5AAg");
	this.shape_1.setTransform(-0.025,0);

	this.shape_2 = new cjs.Shape();
	this.shape_2.graphics.f("#1A1F2A").s().p("AicEDIAAoFIE5AAIAAIFg");
	this.shape_2.setTransform(-0.025,0);

	this.shape_3 = new cjs.Shape();
	this.shape_3.graphics.f("#627DB9").s().p("AicEDIAAoFIE5AAIAAIFg");
	this.shape_3.setTransform(-0.025,0);

	this.shape_4 = new cjs.Shape();
	this.shape_4.graphics.f("#203461").s().p("AicEDIAAoFIE5AAIAAIFg");
	this.shape_4.setTransform(-0.025,0);

	this.timeline.addTween(cjs.Tween.get({}).to({state:[{t:this.shape_2},{t:this.shape_1},{t:this.shape}]}).to({state:[{t:this.shape_3},{t:this.shape_1},{t:this.shape}]},1).to({state:[{t:this.shape_4},{t:this.shape_1},{t:this.shape}]},1).to({state:[{t:this.shape_2},{t:this.shape_1},{t:this.shape}]},1).wait(1));

	this._renderFirstFrame();

}).prototype = p = new cjs.MovieClip();
p.nominalBounds = new cjs.Rectangle(-16.7,-26.9,33.4,53.9);


(lib.Item_Tab = function(mode,startPosition,loop,reversed) {
if (loop == null) { loop = true; }
if (reversed == null) { reversed = false; }
	var props = new Object();
	props.mode = mode;
	props.startPosition = startPosition;
	props.labels = {};
	props.loop = loop;
	props.reversed = reversed;
	cjs.MovieClip.apply(this,[props]);

	// Item
	this.shape = new cjs.Shape();
	this.shape.graphics.f("#FFFFFF").s().p("Ag5AyQgLgOAAgTQAAgVAMgNQALgOATAAQArABAAA1Ig8AAQABAXATAAQAMAAADgOIAYAFQgKAbgdAAQgXAAgLgOgAgqAJIAkAAQgBgVgRAAQgSAAAAAVgAhyA5QgEgIAAgTIAAgnIgLAAIAAgUIALAAIAAgSIAYgNIAAAfIARAAIAAAUIgRAAIAAAkQAAAKACAEQABADAEAAQADAAAHgDIACATQgJAEgKAAQgPAAgFgHgACRA+IAAg0QAAgPgDgDQgEgEgGAAQgRAAAAAeIAAAsIgZAAIAAgyQAAgLgCgGQgCgHgIAAQgJAAgFAFQgFAGAAATIAAAsIgYAAIAAhbIAWAAIAAANQAMgPAQAAQASAAAIAPQAMgPAQAAQAfAAAAAiIAAA7gAipA+IAAh9IAaAAIAAB9g");
	this.shape.setTransform(-0.5,-1.25);

	this.timeline.addTween(cjs.Tween.get(this.shape).wait(3));

	// Layer_3
	this.shape_1 = new cjs.Shape();
	this.shape_1.graphics.f().s("#FFFFFF").ss(1,1,1).p("AnsjxIPZAAIAAHjIvZAAg");
	this.shape_1.setTransform(-0.025,0);

	this.shape_2 = new cjs.Shape();
	this.shape_2.graphics.f("#1A1F2A").s().p("AnsDxIAAnhIPZAAIAAHhg");
	this.shape_2.setTransform(-0.025,0);

	this.shape_3 = new cjs.Shape();
	this.shape_3.graphics.f("#485572").s().p("AnsDxIAAnhIPZAAIAAHhg");
	this.shape_3.setTransform(-0.025,0);

	this.shape_4 = new cjs.Shape();
	this.shape_4.graphics.f("#927224").s().p("AnsDxIAAnhIPZAAIAAHhg");
	this.shape_4.setTransform(-0.025,0);

	this.timeline.addTween(cjs.Tween.get({}).to({state:[{t:this.shape_2},{t:this.shape_1}]}).to({state:[{t:this.shape_3},{t:this.shape_1}]},1).to({state:[{t:this.shape_4},{t:this.shape_1}]},1).wait(1));

	this._renderFirstFrame();

}).prototype = p = new cjs.MovieClip();
p.nominalBounds = new cjs.Rectangle(-50.3,-25.1,100.6,50.3);


(lib.FillColor = function(mode,startPosition,loop,reversed) {
if (loop == null) { loop = true; }
if (reversed == null) { reversed = false; }
	var props = new Object();
	props.mode = mode;
	props.startPosition = startPosition;
	props.labels = {};
	props.loop = loop;
	props.reversed = reversed;
	cjs.MovieClip.apply(this,[props]);

	// Layer_1
	this.shape = new cjs.Shape();
	this.shape.graphics.lf(["#000000","#300000"],[0,1],0,-382.7,0,382.7).s().p("EhoMA7zMAAAh3lMDQZAAAMAAAB3lg");
	this.shape.setTransform(0.025,0.025);

	this.timeline.addTween(cjs.Tween.get(this.shape).wait(1));

	this._renderFirstFrame();

}).prototype = getMCSymbolPrototype(lib.FillColor, new cjs.Rectangle(-666.8,-382.7,1333.6999999999998,765.5), null);


(lib.editor_settings = function(mode,startPosition,loop,reversed) {
if (loop == null) { loop = true; }
if (reversed == null) { reversed = false; }
	var props = new Object();
	props.mode = mode;
	props.startPosition = startPosition;
	props.labels = {};
	props.loop = loop;
	props.reversed = reversed;
	cjs.MovieClip.apply(this,[props]);

	// Layer_1
	this.shape = new cjs.Shape();
	this.shape.graphics.f().s("#FFFFFF").ss(1,1,1).p("EgqBgdtMBUEAAAMAAAA7bMhUEAAAg");
	this.shape.setTransform(0,0.025);

	this.shape_1 = new cjs.Shape();
	this.shape_1.graphics.f("#1A1F2A").s().p("EgqCAduMAAAg7bMBUEAAAMAAAA7bg");
	this.shape_1.setTransform(0,0.025);

	this.timeline.addTween(cjs.Tween.get({}).to({state:[{t:this.shape_1},{t:this.shape}]}).wait(1));

	this._renderFirstFrame();

}).prototype = getMCSymbolPrototype(lib.editor_settings, new cjs.Rectangle(-270,-191.1,540.1,382.29999999999995), null);


(lib.editor_map_wrap = function(mode,startPosition,loop,reversed) {
if (loop == null) { loop = true; }
if (reversed == null) { reversed = false; }
	var props = new Object();
	props.mode = mode;
	props.startPosition = startPosition;
	props.labels = {};
	props.loop = loop;
	props.reversed = reversed;
	cjs.MovieClip.apply(this,[props]);

	this.isSingleFrame = false;
	// timeline functions:
	this.frame_0 = function() {
		if(this.isSingleFrame) {
			return;
		}
		if(this.totalFrames == 1) {
			this.isSingleFrame = true;
		}
		// ============================================================================
		// Action: Frame 1 ภายใน MovieClip EditorMapWrap
		// ============================================================================
		var wrap = this;
		wrap.stop();
		
		window.UIBus = window.UIBus || new createjs.EventDispatcher();
		window.EditorData = window.EditorData || { doc: null };
		
		// 1. สร้าง Container สำหรับเก็บภาพวาดแผนที่ และเปิดใช้งานการเลื่อน/ซูม
		if (!wrap._mapContainer) {
		    wrap._mapContainer = new createjs.Container();
		    wrap.addChild(wrap._mapContainer);
		}
		var mapContainer = wrap._mapContainer;
		
		// 2. ฟังก์ชันวาดเส้นตารางแผนที่ตามข้อมูล Document
		function renderGrid() {
		    mapContainer.removeAllChildren();
		
		    var doc = window.EditorData.doc || {};
		    var cols = parseInt(doc.pathCols || doc.cols, 10) || 2;
		    var rows = parseInt(doc.pathRows || doc.rows, 10) || 2;
		
		    // ขนาดมาตรฐานตาม API Data Contract
		    var PATH_SIZE = 1024; // 1 ช่อง Path = 1024x1024 px
		    var L3_SIZE = 64;     // 1 ช่องย่อย L3 = 64x64 px (16 ช่องต่อ 1 Path)
		
		    var totalW = cols * PATH_SIZE;
		    var totalH = rows * PATH_SIZE;
		
		    // กำหนดจุดกึ่งกลางของแผนที่ให้อยู่ที่ (0, 0) เพื่อให้อยู่ตรงกลางจอ
		    var startX = -totalW / 2;
		    var startY = -totalH / 2;
		
		    // 2.1 วาดพื้นหลังแผนที่เป็นสีดำสนิท (#000000)
		    var bgShape = new createjs.Shape();
		    bgShape.graphics
		        .beginFill("#000000") // พื้นหลังสีดำสนิท
		        .drawRect(startX, startY, totalW, totalH);
		    mapContainer.addChild(bgShape);
		
		    // 2.2 วาดเส้นตารางย่อย L3 (64x64 px)
		    var l3Shape = new createjs.Shape();
		    l3Shape.graphics.beginStroke("rgba(255, 255, 255, 0.06)").setStrokeStyle(1);
		
		    var totalL3Cols = cols * 16;
		    var totalL3Rows = rows * 16;
		
		    for (var c = 0; c <= totalL3Cols; c++) {
		        var lx = startX + (c * L3_SIZE);
		        l3Shape.graphics.moveTo(lx, startY).lineTo(lx, startY + totalH);
		    }
		    for (var r = 0; r <= totalL3Rows; r++) {
		        var ly = startY + (r * L3_SIZE);
		        l3Shape.graphics.moveTo(startX, ly).lineTo(startX + totalW, ly);
		    }
		    mapContainer.addChild(l3Shape);
		
		    // 2.3 วาดเส้นตารางหลัก Path (1024x1024 px) และป้ายกำกับพิกัด
		    var pathShape = new createjs.Shape();
		    pathShape.graphics.beginStroke("rgba(0, 229, 255, 0.4)").setStrokeStyle(2);
		
		    for (var pc = 0; pc <= cols; pc++) {
		        var px = startX + (pc * PATH_SIZE);
		        pathShape.graphics.moveTo(px, startY).lineTo(px, startY + totalH);
		    }
		    for (var pr = 0; pr <= rows; pr++) {
		        var py = startY + (pr * PATH_SIZE);
		        pathShape.graphics.moveTo(startX, py).lineTo(startX + totalW, py);
		    }
		    mapContainer.addChild(pathShape);
		
		    // 2.4 วาดตัวเลขพิกัดกำกับแต่ละ Path Node [Col, Row]
		    for (var rowIdx = 0; rowIdx < rows; rowIdx++) {
		        for (var colIdx = 0; colIdx < cols; colIdx++) {
		            var labelX = startX + (colIdx * PATH_SIZE) + 24;
		            var labelY = startY + (rowIdx * PATH_SIZE) + 24;
		
		            var coordText = new createjs.Text(
		                "PATH [" + colIdx + ", " + rowIdx + "]\n(" + PATH_SIZE + "x" + PATH_SIZE + ")",
		                "bold 18px monospace",
		                "rgba(0, 229, 255, 0.7)"
		            );
		            coordText.x = labelX;
		            coordText.y = labelY;
		            mapContainer.addChild(coordText);
		        }
		    }
		
		    // 2.5 วาดเส้นกรอบขอบเขตแผนที่รอบนอกสุด (Outer Boundary Border)
		    var borderShape = new createjs.Shape();
		    borderShape.graphics
		        .beginStroke("#00e5ff")
		        .setStrokeStyle(3)
		        .drawRect(startX, startY, totalW, totalH);
		    mapContainer.addChild(borderShape);
		
		    console.log("[EditorMapWrap] เรนเดอร์แผนที่พื้นหลังสีดำสำเร็จ:", cols, "x", rows, "ช่อง (" + totalW + "x" + totalH + " px)");
		    if (wrap.stage) wrap.stage.update();
		}
		
		// 3. ระบบคลิกลากเลื่อนแผนที่ (Drag to Pan Canvas)
		var isDragging = false;
		var dragStart = { x: 0, y: 0 };
		var containerStart = { x: 0, y: 0 };
		
		wrap.cursor = "default";
		wrap.removeAllEventListeners("mousedown");
		wrap.on("mousedown", function (evt) {
		    isDragging = true;
		    wrap.cursor = "grab";
		    dragStart.x = evt.stageX;
		    dragStart.y = evt.stageY;
		    containerStart.x = mapContainer.x;
		    containerStart.y = mapContainer.y;
		});
		
		wrap.removeAllEventListeners("pressmove");
		wrap.on("pressmove", function (evt) {
		    if (!isDragging) return;
		    wrap.cursor = "grabbing";
		    var dx = evt.stageX - dragStart.x;
		    var dy = evt.stageY - dragStart.y;
		    mapContainer.x = containerStart.x + dx;
		    mapContainer.y = containerStart.y + dy;
		    if (wrap.stage) wrap.stage.update();
		});
		
		wrap.removeAllEventListeners("pressup");
		wrap.on("pressup", function () {
		    isDragging = false;
		    wrap.cursor = "default";
		});
		
		// 4. ระบบล้อเมาส์ Scrolling & Zooming (Mouse Wheel Zoom towards Cursor)
		function handleWheel(e) {
		    // ป้องกันหน้าเว็บเลื่อนเบราว์เซอร์
		    if (e.preventDefault) e.preventDefault();
		
		    var stage = wrap.stage;
		    if (!stage) return;
		
		    var zoomFactor = e.deltaY < 0 ? 1.12 : 0.88;
		    var currentScale = mapContainer.scaleX || 1;
		    var newScale = currentScale * zoomFactor;
		
		    // จำกัดขอบเขตอัตราส่วนการซูม (Min: 0.15x, Max: 3.0x)
		    if (newScale < 0.15) newScale = 0.15;
		    if (newScale > 3.0) newScale = 3.0;
		
		    // ซูมมุ่งเข้าหาตำแหน่งตัวชี้เมาส์
		    var mouseX = stage.mouseX - wrap.x;
		    var mouseY = stage.mouseY - wrap.y;
		
		    var localX = (mouseX - mapContainer.x) / currentScale;
		    var localY = (mouseY - mapContainer.y) / currentScale;
		
		    mapContainer.scaleX = newScale;
		    mapContainer.scaleY = newScale;
		
		    mapContainer.x = mouseX - (localX * newScale);
		    mapContainer.y = mouseY - (localY * newScale);
		
		    stage.update();
		}
		
		// ผูก Wheel Listener กับ Canvas หรือ Window
		if (wrap._wheelListener) {
		    window.removeEventListener("wheel", wrap._wheelListener);
		}
		wrap._wheelListener = handleWheel;
		window.addEventListener("wheel", wrap._wheelListener, { passive: false });
		
		// 5. สั่งวาดแผนที่ตอนเริ่มทำงาน
		renderGrid();
		
		// 6. รับฟัง Event เมื่อข้อมูลแผนที่ถูกโหลดหรือสร้างใหม่
		wrap._handleMapUpdate = function () {
		    // รีเซ็ตตำแหน่งและสเกลกลับตรงกลาง
		    mapContainer.x = 0;
		    mapContainer.y = 0;
		    mapContainer.scaleX = 1;
		    mapContainer.scaleY = 1;
		    renderGrid();
		};
		
		window.UIBus.off("MAP_DATA_READY", wrap._handleMapUpdate);
		window.UIBus.on("MAP_DATA_READY", wrap._handleMapUpdate);
		
		window.UIBus.off("EDITOR_MOUNTED", wrap._handleMapUpdate);
		window.UIBus.on("EDITOR_MOUNTED", wrap._handleMapUpdate);
	}

	// actions tween:
	this.timeline.addTween(cjs.Tween.get(this).call(this.frame_0).wait(1));

	// Layer_1
	this.shape = new cjs.Shape();
	this.shape.graphics.f().s("#101820").ss(1,1,1).p("Ehkig5vMDJFAAAMAAABzfMjJFAAAg");

	this.shape_1 = new cjs.Shape();
	this.shape_1.graphics.f("#FFFFFF").s().p("EhkhA5vMAAAhzdMDJDAAAMAAABzdg");

	this.timeline.addTween(cjs.Tween.get({}).to({state:[{t:this.shape_1},{t:this.shape}]}).wait(1));

	this._renderFirstFrame();

}).prototype = getMCSymbolPrototype(lib.editor_map_wrap, new cjs.Rectangle(-644.4,-370.5,1288.9,741.1), null);


(lib.ButtonArtCreate = function(mode,startPosition,loop,reversed) {
if (loop == null) { loop = true; }
if (reversed == null) { reversed = false; }
	var props = new Object();
	props.mode = mode;
	props.startPosition = startPosition;
	props.labels = {};
	props.loop = loop;
	props.reversed = reversed;
	cjs.MovieClip.apply(this,[props]);

	// Layer_3
	this.shape = new cjs.Shape();
	this.shape.graphics.f().s("#101820").ss(3,1,1).p("AORm1IAANrI8hAAIAAtrg");
	this.shape.setTransform(0,-4.375);

	this.timeline.addTween(cjs.Tween.get(this.shape).wait(2).to({regY:43.8,scaleY:0.8832,y:39.45},0).wait(1));

	// Layer_2
	this.shape_1 = new cjs.Shape();
	this.shape_1.graphics.f("#FFFFFF").s().p("AHwCFQgbgkAAgzQAAg2AegjQAcgiAzgBQBvABAACMIicAAQADA7AvgBQAfAAAJghIA/AKQgZBHhOAAQg9gBgagjgAIWAYIBdAAQgCg2gsAAQgvAAAAA2gAFdCUQgKgTgBgxIAAhnIgdAAIAAgxIAdAAIAAgvIA/glIAABUIArAAIAAAxIgrAAIAABeQAAAdADAIQAEAIAKAAQAJAAAQgHIAFAxQgVALgcAAQgngBgLgUgABXCVQgVgTAAggQgBgZAOgSQAPgUA5gLQAtgIAQgHIAAgHQABgggsAAQgeAAgLAeIg4gKQAShDBUgBQA7ABAUATQAVAUAAAyIgBBJQAAAwAOAeIg9AAQgFgJgEgRQggAfgqABQgigBgWgTgACMBGQgMAJAAAMQAAAQALAIQAKAJAOAAQAyAAgBg+IAAgNQgeAGgqAPgAiiCFQgbgkAAgzQAAg2AegjQAcgiAygBQBwABAACMIidAAQAEA7AwgBQAeAAAKghIA9AKQgZBHhNAAQg9gBgagjgAh7AYIBcAAQgBg2gtAAQguAAAAA2gAqMB2QgkgxAAhCQgBhNApgvQAogvBJAAQBoAAAaBgIhBAPQgNg2g4AAQhRAAAABuQAABwBPAAQA5ABAQhFIBAAUQgdBqhrAAQhMAAgkgzgAlfCjIAAjrIA7AAIAAAiQAXgoAeAAQAVAAAUAMIgUA4QgPgMgOAAQgXAAgJAXQgJAWAABEIAABIg");
	this.shape_1.setTransform(-2.7,-11.4);

	this.shape_2 = new cjs.Shape();
	this.shape_2.graphics.f("#FFFFFF").s().p("AHwCFQgbgkAAgzQAAg2AegjQAcgjAzABQBvgBAACNIicAAQADA6AvABQAfAAAJgjIA/AKQgZBHhOAAQg9ABgagkgAIWAYIBdAAQgCg2gsAAQgvAAAAA2gAFdCUQgKgTgBgyIAAhlIgdAAIAAgyIAdAAIAAgvIA/glIAABUIArAAIAAAyIgrAAIAABdQAAAcADAJQAEAIAKAAQAJAAAQgHIAFAyQgVAKgcgBQgnABgLgVgABXCVQgVgTAAghQgBgYAOgTQAPgTA5gLQAtgIAQgIIAAgGQABgggsAAQgeAAgLAeIg4gLQAShCBUAAQA7gBAUAVQAVATAAAzIgBBIQAAAxAOAdIg9AAQgFgJgEgSQggAhgqgBQgiABgWgUgACMBGQgMAIAAANQAAAQALAIQAKAIAOAAQAyAAgBg9IAAgNQgeAGgqAPgAiiCFQgbgkAAgzQAAg2AegjQAcgjAyABQBwgBAACNIidAAQAEA6AwABQAeAAAKgjIA9AKQgZBHhNAAQg9ABgagkgAh7AYIBcAAQgBg2gtAAQguAAAAA2gAqMB2QgkgyAAhBQgBhNApgvQAoguBJAAQBoAAAaBfIhBAQQgNg3g4AAQhRAAAABtQAABxBPABQA5AAAQhGIBAAVQgdBqhrgBQhMABgkgzgAlfCjIAAjrIA7AAIAAAiQAXgnAeAAQAVgBAUAMIgUA3QgPgLgOABQgXAAgJAVQgJAWAABEIAABJg");
	this.shape_2.setTransform(-2.7,-2.45);

	this.timeline.addTween(cjs.Tween.get({}).to({state:[{t:this.shape_1}]}).to({state:[{t:this.shape_1}]},1).to({state:[{t:this.shape_2}]},1).wait(1));

	// Layer_1
	this.shape_3 = new cjs.Shape();
	this.shape_3.graphics.f("#FF8A8A").s().p("AuQGKIAAsTIchAAIAAMTg");
	this.shape_3.setTransform(0,-8.75);

	this.shape_4 = new cjs.Shape();
	this.shape_4.graphics.f("#F96161").s().p("AuQAsIAAhXIchAAIAABXg");
	this.shape_4.setTransform(0,35.025);

	this.shape_5 = new cjs.Shape();
	this.shape_5.graphics.f("#BBB327").s().p("AuQAsIAAhXIchAAIAABXg");
	this.shape_5.setTransform(0,35.025);

	this.shape_6 = new cjs.Shape();
	this.shape_6.graphics.f("#F4E86F").s().p("AuQGKIAAsTIchAAIAAMTg");
	this.shape_6.setTransform(0,-8.75);

	this.shape_7 = new cjs.Shape();
	this.shape_7.graphics.f("#A82929").s().p("AuQGKIAAsTIchAAIAAMTg");
	this.shape_7.setTransform(0,0.15);

	this.timeline.addTween(cjs.Tween.get({}).to({state:[{t:this.shape_4},{t:this.shape_3}]}).to({state:[{t:this.shape_6},{t:this.shape_5}]},1).to({state:[{t:this.shape_7}]},1).wait(1));

	this._renderFirstFrame();

}).prototype = p = new cjs.MovieClip();
p.nominalBounds = new cjs.Rectangle(-92.7,-49.6,185.5,90.6);


(lib.BtnEditorArt = function(mode,startPosition,loop,reversed) {
if (loop == null) { loop = true; }
if (reversed == null) { reversed = false; }
	var props = new Object();
	props.mode = mode;
	props.startPosition = startPosition;
	props.labels = {};
	props.loop = loop;
	props.reversed = reversed;
	cjs.MovieClip.apply(this,[props]);

	// Layer_3
	this.shape = new cjs.Shape();
	this.shape.graphics.f("#F90000").s().p("AhpBpQgrgrgBg+QABg9ArgsQAsgsA9AAQA+AAAsAsQAsAsAAA9QAAA+gsArQgsAtg+gBQg9ABgsgtg");
	this.shape.setTransform(0.0602,-6.201,1.204,1.204);

	this.shape_1 = new cjs.Shape();
	this.shape_1.graphics.f("#C00000").s().p("AhpBpQgrgrgBg+QABg9ArgsQAsgsA9AAQA+AAAsAsQAsAsAAA9QAAA+gsArQgsAtg+gBQg9ABgsgtg");
	this.shape_1.setTransform(0.0602,0.299,1.204,1.204);

	this.shape_2 = new cjs.Shape();
	this.shape_2.graphics.f("#FF9E9E").s().p("AhpBpQgrgrgBg+QABg9ArgsQAsgsA9AAQA+AAAsAsQAsAsAAA9QAAA+gsArQgsAtg+gBQg9ABgsgtg");
	this.shape_2.setTransform(0.0602,-6.201,1.204,1.204);

	this.shape_3 = new cjs.Shape();
	this.shape_3.graphics.f("#FF4545").s().p("AhpBpQgrgrgBg+QABg9ArgsQAsgsA9AAQA+AAAsAsQAsAsAAA9QAAA+gsArQgsAtg+gBQg9ABgsgtg");
	this.shape_3.setTransform(0.0602,0.299,1.204,1.204);

	this.shape_4 = new cjs.Shape();
	this.shape_4.graphics.f("#650000").s().p("AhpBpQgrgrgBg+QABg9ArgsQAsgsA9AAQA+AAAsAsQAsAsAAA9QAAA+gsArQgsAtg+gBQg9ABgsgtg");
	this.shape_4.setTransform(0.0602,-0.401,1.204,1.204);

	this.timeline.addTween(cjs.Tween.get({}).to({state:[{t:this.shape_1},{t:this.shape}]}).to({state:[{t:this.shape_3},{t:this.shape_2}]},1).to({state:[{t:this.shape_1},{t:this.shape_4}]},1).to({state:[]},1).wait(1));

	// Layer_1
	this.shape_5 = new cjs.Shape();
	this.shape_5.graphics.f("#0D1019").s().p("AkQEkIAApHIIhAAIAAJHg");
	this.shape_5.setTransform(-0.075,31.9951,1,0.0976);

	this.shape_6 = new cjs.Shape();
	this.shape_6.graphics.f("#405176").s().p("AjeDfIAAm9IG9AAIAAG9g");
	this.shape_6.setTransform(-0.125,0);

	this.shape_7 = new cjs.Shape();
	this.shape_7.graphics.f("#2C3851").s().p("AkQEkIAApHIIhAAIAAJHg");
	this.shape_7.setTransform(-0.075,-0.05);

	this.shape_8 = new cjs.Shape();
	this.shape_8.graphics.f().s("#000000").ss(3,0,0,3).p("AkQkjIIhAAIAAJHIohAAg");
	this.shape_8.setTransform(-0.05,-31.3,1,1.1057,0,0,0,0,-31.2);

	this.timeline.addTween(cjs.Tween.get({}).to({state:[{t:this.shape_8},{t:this.shape_7},{t:this.shape_6},{t:this.shape_5}]}).to({state:[{t:this.shape_8},{t:this.shape_7},{t:this.shape_6},{t:this.shape_5}]},1).to({state:[{t:this.shape_8},{t:this.shape_7},{t:this.shape_6},{t:this.shape_5}]},1).to({state:[{t:this.shape_7}]},1).wait(1));

	this._renderFirstFrame();

}).prototype = p = new cjs.MovieClip();
p.nominalBounds = new cjs.Rectangle(-28.9,-30.5,57.7,67.6);


(lib.btn_new = function(mode,startPosition,loop,reversed) {
if (loop == null) { loop = true; }
if (reversed == null) { reversed = false; }
	var props = new Object();
	props.mode = mode;
	props.startPosition = startPosition;
	props.labels = {};
	props.loop = loop;
	props.reversed = reversed;
	cjs.MovieClip.apply(this,[props]);

	// Layer_2
	this.shape = new cjs.Shape();
	this.shape.graphics.f("#FFFFFF").s().p("AhaBnQgVgcAAgpQAAgqAXgcQAXgbAnAAQBYAAAABuIh7AAQADAvAmAAQAWAAAIgbIAxAIQgTA4g9AAQgwAAgVgcgAg8ARIBJAAQgBgqgjAAQgkAAgBAqgAD5B+Iggh4IggB4IgwAAIg7i5IAwAAIAkB5IAfh5IAwAAIAfB5IAjh5IAxAAIg8C5gAjLB+IhninIAACnIgxAAIAAkAIAyAAIBqCrIAAirIAvAAIAAEAg");
	this.shape.setTransform(1.75,-0.725);

	this.timeline.addTween(cjs.Tween.get(this.shape).wait(3));

	// Layer_1
	this.shape_1 = new cjs.Shape();
	this.shape_1.graphics.f().s("#666666").ss(2,1,1).p("Aquk7IVdAAIAAJ3I1dAAg");

	this.shape_2 = new cjs.Shape();
	this.shape_2.graphics.f("#0E1116").s().p("AquE8IAAp3IVdAAIAAJ3g");

	this.shape_3 = new cjs.Shape();
	this.shape_3.graphics.f().s("#FFFF00").ss(2,1,1).p("Aquk7IVdAAIAAJ3I1dAAg");

	this.shape_4 = new cjs.Shape();
	this.shape_4.graphics.f("#2D3D57").s().p("AquE8IAAp3IVdAAIAAJ3g");

	this.shape_5 = new cjs.Shape();
	this.shape_5.graphics.f().s("#FFFFFF").ss(2,1,1).p("Aquk7IVdAAIAAJ3I1dAAg");

	this.shape_6 = new cjs.Shape();
	this.shape_6.graphics.f("#1F2B40").s().p("AquE8IAAp3IVdAAIAAJ3g");

	this.timeline.addTween(cjs.Tween.get({}).to({state:[{t:this.shape_2},{t:this.shape_1}]}).to({state:[{t:this.shape_4},{t:this.shape_3}]},1).to({state:[{t:this.shape_6},{t:this.shape_5}]},1).wait(1));

	this._renderFirstFrame();

}).prototype = p = new cjs.MovieClip();
p.nominalBounds = new cjs.Rectangle(-69.6,-32.6,139.3,65.2);


(lib.btn_import = function(mode,startPosition,loop,reversed) {
if (loop == null) { loop = true; }
if (reversed == null) { reversed = false; }
	var props = new Object();
	props.mode = mode;
	props.startPosition = startPosition;
	props.labels = {};
	props.loop = loop;
	props.reversed = reversed;
	cjs.MovieClip.apply(this,[props]);

	// Layer_2
	this.shape = new cjs.Shape();
	this.shape.graphics.f("#FFFFFF").s().p("AhVBxIAAiwIAfAAIAAATQAOgWAaAAQAZAAAOATQAOAUAAAbQAAAcgOAUQgPATgYAAQgUAAgRgTIAABBgAg0gBQAAApAeAAQAaAAAAgoQAAgngbAAQgdAAAAAmgAFCA4QgGgKAAgbIAAg3IgQAAIAAgbIAQAAIAAgaIAigUIAAAuIAXAAIAAAbIgXAAIAAAyQAAAQACAEQACAFAFAAQAFAAAJgEIADAbQgMAFgPAAQgVAAgGgLgABMAxQgSgSAAggQAAgbATgTQASgTAeAAQAdAAATATQASASAAAdQAAAdgTATQgSATgdAAQgeAAgTgSgABmgcQgJALAAARQAAARAJALQAIALAPAAQAPAAAIgLQAIgLAAgRQAAgRgIgLQgIgKgPAAQgPAAgIAKgADYBAIAAh/IAgAAIAAASQANgVAQAAQAMAAAKAGIgKAeQgJgGgHAAQgNAAgFANQgFAMAAAkIAAAngAiYBAIAAhIQAAgWgGgFQgFgFgHAAQgaAAAAArIAAA9IgiAAIAAhFQAAgQgDgJQgCgKgNAAQgLAAgHAHQgHAHAAAcIAAA+IgjAAIAAh/IAgAAIAAARQARgUAXAAQAZAAALAUQARgUAXAAQAqAAAAAxIAABRgAl3BAIAAiwIAkAAIAACwg");
	this.shape.setTransform(-1.3496,1.5637,1.3205,1.3205);

	this.timeline.addTween(cjs.Tween.get(this.shape).wait(3));

	// Layer_1
	this.shape_1 = new cjs.Shape();
	this.shape_1.graphics.f().s("#666666").ss(2,1,1).p("Aquk7IVdAAIAAJ3I1dAAg");

	this.shape_2 = new cjs.Shape();
	this.shape_2.graphics.f("#0E1116").s().p("AquE8IAAp3IVdAAIAAJ3g");

	this.shape_3 = new cjs.Shape();
	this.shape_3.graphics.f().s("#FFFF00").ss(2,1,1).p("Aquk7IVdAAIAAJ3I1dAAg");

	this.shape_4 = new cjs.Shape();
	this.shape_4.graphics.f("#2D3D57").s().p("AquE8IAAp3IVdAAIAAJ3g");

	this.shape_5 = new cjs.Shape();
	this.shape_5.graphics.f().s("#FFFFFF").ss(2,1,1).p("Aquk7IVdAAIAAJ3I1dAAg");

	this.shape_6 = new cjs.Shape();
	this.shape_6.graphics.f("#1F2B40").s().p("AquE8IAAp3IVdAAIAAJ3g");

	this.timeline.addTween(cjs.Tween.get({}).to({state:[{t:this.shape_2},{t:this.shape_1}]}).to({state:[{t:this.shape_4},{t:this.shape_3}]},1).to({state:[{t:this.shape_6},{t:this.shape_5}]},1).wait(1));

	this._renderFirstFrame();

}).prototype = p = new cjs.MovieClip();
p.nominalBounds = new cjs.Rectangle(-69.6,-32.6,139.3,65.2);


(lib.btn_export = function(mode,startPosition,loop,reversed) {
if (loop == null) { loop = true; }
if (reversed == null) { reversed = false; }
	var props = new Object();
	props.mode = mode;
	props.startPosition = startPosition;
	props.labels = {};
	props.loop = loop;
	props.reversed = reversed;
	cjs.MovieClip.apply(this,[props]);

	// Layer_2
	this.shape = new cjs.Shape();
	this.shape.graphics.f("#FFFFFF").s().p("AhPBxIAAiwIAgAAIAAATQAOgWAaAAQAZAAAOATQAOAUAAAbQAAAcgPAUQgOATgYAAQgUAAgSgTIAABBgAgtgBQAAApAdAAQAbAAAAgoQAAgngbAAQgdAAAAAmgAFIA4QgGgKAAgbIAAg3IgQAAIAAgbIAQAAIAAgaIAigUIAAAuIAYAAIAAAbIgYAAIAAAyQAAAQACAEQACAFAGAAQAEAAAJgEIADAbQgMAFgPAAQgVAAgGgLgABTAxQgSgSAAggQAAgbASgTQASgTAeAAQAeAAASATQASASAAAdQAAAdgSATQgTATgdAAQgeAAgSgSgABsgcQgIALAAARQAAARAIALQAIALAPAAQAPAAAIgLQAJgLAAgRQAAgRgJgLQgIgKgPAAQgPAAgIAKgADfBAIAAh/IAfAAIAAASQANgVAQAAQAMAAALAGIgLAeQgIgGgIAAQgNAAgEANQgFAMAAAkIAAAngAiMBAIgagoIgaAoIgoAAIAuhBIgsg+IApAAIAXAjIAYgjIAoAAIgsA9IAwBCgAl9BAIAAiwICDAAIAAAeIhfAAIAAAnIBZAAIAAAeIhZAAIAAAvIBjAAIAAAeg");
	this.shape.setTransform(1.0962,-0.1565,1.2523,1.2523);

	this.timeline.addTween(cjs.Tween.get(this.shape).wait(3));

	// Layer_1
	this.shape_1 = new cjs.Shape();
	this.shape_1.graphics.f().s("#666666").ss(2,1,1).p("Aquk7IVdAAIAAJ3I1dAAg");

	this.shape_2 = new cjs.Shape();
	this.shape_2.graphics.f("#0E1116").s().p("AquE8IAAp3IVdAAIAAJ3g");

	this.shape_3 = new cjs.Shape();
	this.shape_3.graphics.f().s("#FFFF00").ss(2,1,1).p("Aquk7IVdAAIAAJ3I1dAAg");

	this.shape_4 = new cjs.Shape();
	this.shape_4.graphics.f("#2D3D57").s().p("AquE8IAAp3IVdAAIAAJ3g");

	this.shape_5 = new cjs.Shape();
	this.shape_5.graphics.f().s("#FFFFFF").ss(2,1,1).p("Aquk7IVdAAIAAJ3I1dAAg");

	this.shape_6 = new cjs.Shape();
	this.shape_6.graphics.f("#1F2B40").s().p("AquE8IAAp3IVdAAIAAJ3g");

	this.timeline.addTween(cjs.Tween.get({}).to({state:[{t:this.shape_2},{t:this.shape_1}]}).to({state:[{t:this.shape_4},{t:this.shape_3}]},1).to({state:[{t:this.shape_6},{t:this.shape_5}]},1).wait(1));

	this._renderFirstFrame();

}).prototype = p = new cjs.MovieClip();
p.nominalBounds = new cjs.Rectangle(-69.6,-32.6,139.3,65.2);


(lib.btn_confirm = function(mode,startPosition,loop,reversed) {
if (loop == null) { loop = true; }
if (reversed == null) { reversed = false; }
	var props = new Object();
	props.mode = mode;
	props.startPosition = startPosition;
	props.labels = {};
	props.loop = loop;
	props.reversed = reversed;
	cjs.MovieClip.apply(this,[props]);

	// Layer_2
	this.shape = new cjs.Shape();
	this.shape.graphics.f("#FFFFFF").s().p("AoZCWQglglAAhDQAAg2AlgmQAlgmA8AAQA7AAAmAlQAlAmAAA7QAAA6glAoQgmAlg6ABQg+gBgkgjgAnmgHQgRAVAAAkQAAAjARAWQAQAWAeAAQAeAAARgWQARgWAAgjQAAglgRgUQgRgWgeABQgegBgQAWgAt9CDQgog3AAhIQAAhVAtgzQAsg0BPAAQByAAAeBpIhIAQQgOg6g+AAQhZAAAAB4QAAB8BYABQA+AAAShNIBGAYQggBzh1AAQhUAAgog3gANhC0IAAiUQAAgsgLgKQgKgKgPAAQg0AAAABXIAAB9IhFAAIAAiPQAAgfgFgSQgGgUgYAAQgYAAgOAOQgPAOAAA6IAAB+IhFAAIAAkDIBAAAIAAAjQAigoAvAAQAyAAAXAoQAigoAuAAQBVgBAABkIAAClgAFmC0IAAkDIBAAAIAAAlQAbgqAgAAQAYAAAVAMIgVA8QgRgLgPAAQgaAAgKAXQgKAaAABJIAABRgADdC0IAAkDIBFAAIAAEDgAA/C0IAAjNIgmAAIAAg2IAmAAIAAgUQAAhVBQAAQAdAAAcAJIgJAvQgQgEgQAAQgbAAAAAiIAAATIAzAAIAAA2IgzAAIAADNgAhTC0IAAiFQAAgtgJgRQgJgRgZAAQgXAAgRANQgRANAABEIAAB2IhFAAIAAkDIBAAAIAAAnQAigtA0ABQBXAAAABmIAACigADdhzIAAhAIBFAAIAABAg");
	this.shape.setTransform(0.275,-1.65);

	this.timeline.addTween(cjs.Tween.get(this.shape).wait(3));

	// Layer_1
	this.shape_1 = new cjs.Shape();
	this.shape_1.graphics.f().s("#FFFFFF").ss(2,1,1).p("AwvmsMAhfAAAIAANZMghfAAAg");
	this.shape_1.setTransform(0,0.025);

	this.shape_2 = new cjs.Shape();
	this.shape_2.graphics.f("#576992").s().p("AwvGtIAAtZMAhfAAAIAANZg");
	this.shape_2.setTransform(0,0.025);

	this.shape_3 = new cjs.Shape();
	this.shape_3.graphics.f("#6B85C0").s().p("AwvGtIAAtZMAhfAAAIAANZg");
	this.shape_3.setTransform(0,0.025);

	this.shape_4 = new cjs.Shape();
	this.shape_4.graphics.f("#16181E").s().p("AwvGtIAAtZMAhfAAAIAANZg");
	this.shape_4.setTransform(0,0.025);

	this.timeline.addTween(cjs.Tween.get({}).to({state:[{t:this.shape_2},{t:this.shape_1}]}).to({state:[{t:this.shape_3},{t:this.shape_1}]},1).to({state:[{t:this.shape_4},{t:this.shape_1}]},1).wait(1));

	this._renderFirstFrame();

}).prototype = p = new cjs.MovieClip();
p.nominalBounds = new cjs.Rectangle(-108.2,-43.8,216.4,87.69999999999999);


(lib.btn_cancel = function(mode,startPosition,loop,reversed) {
if (loop == null) { loop = true; }
if (reversed == null) { reversed = false; }
	var props = new Object();
	props.mode = mode;
	props.startPosition = startPosition;
	props.labels = {};
	props.loop = loop;
	props.reversed = reversed;
	cjs.MovieClip.apply(this,[props]);

	// Layer_2
	this.shape = new cjs.Shape();
	this.shape.graphics.f("#FFFFFF").s().p("AHbCZQgfgpAAg6QAAg/AignQAhgoA5AAQCCAAgBCgIizAAQADBDA3AAQAjAAAKgmIBIALQgbBRhaAAQhHAAgegogAIIAdIBqAAQgCg/gzAAQg1AAAAA/gADACbQgignAAhAQAAg5AfgqQAfgpBGAAQBfAAAZBWIhGAMQgIgqgqAAQg6AAAABPQgBBXA8AAQAqAAAKgzIBHAMQgWBihoAAQg9AAgjgmgAmvCsQgZgWAAglQAAgdAQgVQAQgWBCgNQAzgKAUgIIAAgHQAAglgyAAQgiAAgNAiIhBgLQAWhNBgAAQBDAAAYAWQAXAXABA6IgBBUQAAA3APAiIhGAAQgEgLgFgTQgmAjgvAAQgoAAgZgVgAlyBQQgOALgBAPQAAARANAKQAMAJAQAAQA5AAAAhGIAAgPQgjAHgwAQgAsSCIQgpg5AAhLQgBhZAvg1QAug2BSAAQB4AAAeBtIhKASQgOg+hBAAQhdAAAAB+QgBCCBcAAQBBAAAShQIBKAYQgiB4h6AAQhXAAgqg5gAL1C8IAAl2IBHAAIAAF2gAAcC8IAAiLQAAgvgIgSQgKgSgZAAQgYAAgRAOQgTAOABBHIAAB7IhIAAIAAkPIBCAAIAAAoQAkgtA1AAQBbAAAABrIAACpg");
	this.shape.setTransform(-0.05,-1.175);

	this.timeline.addTween(cjs.Tween.get(this.shape).wait(3));

	// Layer_1
	this.shape_1 = new cjs.Shape();
	this.shape_1.graphics.f().s("#FFFFFF").ss(2,1,1).p("AwvmsMAhfAAAIAANZMghfAAAg");
	this.shape_1.setTransform(0,0.025);

	this.shape_2 = new cjs.Shape();
	this.shape_2.graphics.f("#820101").s().p("AwvGtIAAtZMAhfAAAIAANZg");
	this.shape_2.setTransform(0,0.025);

	this.shape_3 = new cjs.Shape();
	this.shape_3.graphics.f("#CC4646").s().p("AwvGtIAAtZMAhfAAAIAANZg");
	this.shape_3.setTransform(0,0.025);

	this.shape_4 = new cjs.Shape();
	this.shape_4.graphics.f("#4B0000").s().p("AwvGtIAAtZMAhfAAAIAANZg");
	this.shape_4.setTransform(0,0.025);

	this.timeline.addTween(cjs.Tween.get({}).to({state:[{t:this.shape_2},{t:this.shape_1}]}).to({state:[{t:this.shape_3},{t:this.shape_1}]},1).to({state:[{t:this.shape_4},{t:this.shape_1}]},1).wait(1));

	this._renderFirstFrame();

}).prototype = p = new cjs.MovieClip();
p.nominalBounds = new cjs.Rectangle(-108.2,-43.8,216.4,87.69999999999999);


(lib.Block_Tab = function(mode,startPosition,loop,reversed) {
if (loop == null) { loop = true; }
if (reversed == null) { reversed = false; }
	var props = new Object();
	props.mode = mode;
	props.startPosition = startPosition;
	props.labels = {};
	props.loop = loop;
	props.reversed = reversed;
	cjs.MovieClip.apply(this,[props]);

	// Block
	this.shape = new cjs.Shape();
	this.shape.graphics.f("#FFFFFF").s().p("AA5AzQgLgNAAgWQAAgSAKgOQAKgPAYAAQAgABAJAdIgYADQgDgOgOAAQgUAAAAAaQAAAeAVAAQAOAAADgRIAYAEQgIAhgjAAQgUAAgMgNgAgwAzQgNgMAAgYQAAgTANgNQANgOAVAAQAUAAANAOQANANAAAUQAAAVgNANQgNAOgUAAQgVAAgNgNgAgegDQgGAGAAANQAAANAGAIQAGAHAKAAQALAAAFgHQAFgJAAgMQAAgNgFgGQgFgIgLAAQgKAAgGAIgADPA+IgYgpIgLALIAAAeIgYAAIAAh9IAYAAIAABCIAdggIAdAAIgfAhIAhA6gAhpA+IAAh9IAZAAIAAB9gAjnA+IAAh9IAyAAQAeAAAKAJQAJAKAAAMQAAAUgSAIQAYAGAAAXQAAAOgHAJQgHAJgKACQgKADgcAAgAjOApIAYAAQARAAAHgDQAGgDAAgLQAAgKgHgDQgHgEgTAAIgVAAgAjOgNIARAAQAUAAAGgCQAGgDAAgKQAAgJgFgDQgGgCgXAAIgPAAg");
	this.shape.setTransform(0.175,-1.25);

	this.timeline.addTween(cjs.Tween.get(this.shape).wait(3));

	// Layer_3
	this.shape_1 = new cjs.Shape();
	this.shape_1.graphics.f().s("#FFFFFF").ss(1,1,1).p("AnsjxIPZAAIAAHjIvZAAg");
	this.shape_1.setTransform(-0.025,0);

	this.shape_2 = new cjs.Shape();
	this.shape_2.graphics.f("#1A1F2A").s().p("AnsDxIAAnhIPZAAIAAHhg");
	this.shape_2.setTransform(-0.025,0);

	this.shape_3 = new cjs.Shape();
	this.shape_3.graphics.f("#485572").s().p("AnsDxIAAnhIPZAAIAAHhg");
	this.shape_3.setTransform(-0.025,0);

	this.shape_4 = new cjs.Shape();
	this.shape_4.graphics.f("#927224").s().p("AnsDxIAAnhIPZAAIAAHhg");
	this.shape_4.setTransform(-0.025,0);

	this.timeline.addTween(cjs.Tween.get({}).to({state:[{t:this.shape_2},{t:this.shape_1}]}).to({state:[{t:this.shape_3},{t:this.shape_1}]},1).to({state:[{t:this.shape_4},{t:this.shape_1}]},1).wait(1));

	this._renderFirstFrame();

}).prototype = p = new cjs.MovieClip();
p.nominalBounds = new cjs.Rectangle(-50.3,-25.1,100.6,50.3);


(lib.ArtTemplate = function(mode,startPosition,loop,reversed) {
if (loop == null) { loop = true; }
if (reversed == null) { reversed = false; }
	var props = new Object();
	props.mode = mode;
	props.startPosition = startPosition;
	props.labels = {};
	props.loop = loop;
	props.reversed = reversed;
	cjs.MovieClip.apply(this,[props]);

	// Layer_1
	this.shape = new cjs.Shape();
	this.shape.graphics.f().s("#FFFFFF").ss(1,1,1).p("AuHjWIcPAAIAAGtI8PAAg");

	this.shape_1 = new cjs.Shape();
	this.shape_1.graphics.f("#1A1F2A").s().p("AuHDWIAAmrIcPAAIAAGrg");

	this.shape_2 = new cjs.Shape();
	this.shape_2.graphics.f("#5F6A83").s().p("AuHDWIAAmrIcPAAIAAGrg");

	this.shape_3 = new cjs.Shape();
	this.shape_3.graphics.f("#927224").s().p("AuHDWIAAmrIcPAAIAAGrg");

	this.shape_4 = new cjs.Shape();
	this.shape_4.graphics.f("rgba(146,114,36,0)").s().p("AuHDWIAAmrIcPAAIAAGrg");

	this.timeline.addTween(cjs.Tween.get({}).to({state:[{t:this.shape_1},{t:this.shape}]}).to({state:[{t:this.shape_2},{t:this.shape}]},1).to({state:[{t:this.shape_3},{t:this.shape}]},1).to({state:[{t:this.shape_4}]},1).wait(1));

	this._renderFirstFrame();

}).prototype = p = new cjs.MovieClip();
p.nominalBounds = new cjs.Rectangle(-91.3,-22.4,182.7,44.9);


(lib.ArtInput2 = function(mode,startPosition,loop,reversed) {
if (loop == null) { loop = true; }
if (reversed == null) { reversed = false; }
	var props = new Object();
	props.mode = mode;
	props.startPosition = startPosition;
	props.labels = {};
	props.loop = loop;
	props.reversed = reversed;
	cjs.MovieClip.apply(this,[props]);

	// Layer_1
	this.shape = new cjs.Shape();
	this.shape.graphics.f().s("#666666").ss(2,1,1).p("EggVgDHMBArAAAIAAGPMhArAAAg");

	this.shape_1 = new cjs.Shape();
	this.shape_1.graphics.f("#0E1116").s().p("EggUADIIAAmPMBApAAAIAAGPg");

	this.timeline.addTween(cjs.Tween.get({}).to({state:[{t:this.shape_1},{t:this.shape}]}).wait(1));

	this._renderFirstFrame();

}).prototype = getMCSymbolPrototype(lib.ArtInput2, new cjs.Rectangle(-207.9,-20.9,415.9,41.9), null);


(lib.ArtInput = function(mode,startPosition,loop,reversed) {
if (loop == null) { loop = true; }
if (reversed == null) { reversed = false; }
	var props = new Object();
	props.mode = mode;
	props.startPosition = startPosition;
	props.labels = {};
	props.loop = loop;
	props.reversed = reversed;
	cjs.MovieClip.apply(this,[props]);

	// Layer_1
	this.shape = new cjs.Shape();
	this.shape.graphics.f().s("#666666").ss(2,1,1).p("Aq4liIVxAAIAALFI1xAAg");

	this.shape_1 = new cjs.Shape();
	this.shape_1.graphics.f("#0E1116").s().p("Aq4FjIAArFIVxAAIAALFg");

	this.timeline.addTween(cjs.Tween.get({}).to({state:[{t:this.shape_1},{t:this.shape}]}).wait(1));

	this._renderFirstFrame();

}).prototype = getMCSymbolPrototype(lib.ArtInput, new cjs.Rectangle(-70.7,-36.5,141.4,73), null);


(lib.Area_Tab = function(mode,startPosition,loop,reversed) {
if (loop == null) { loop = true; }
if (reversed == null) { reversed = false; }
	var props = new Object();
	props.mode = mode;
	props.startPosition = startPosition;
	props.labels = {};
	props.loop = loop;
	props.reversed = reversed;
	cjs.MovieClip.apply(this,[props]);

	// Layer_2
	this.shape = new cjs.Shape();
	this.shape.graphics.f("#FFFFFF").s().p("ADeA/IgLgdIgzAAIgKAdIgbAAIAwh9IAbAAIAzB9gACoANIAjAAIgSgugAASA/IAAh9IBeAAIAAAVIhFAAIAAAcIA/AAIAAAUIg/AAIAAAjIBHAAIAAAVgAgZA/IgcgpQgDgGgGgDQgFgCgKAAIgGAAIAAA0IgZAAIAAh9IA1AAQAaAAAMAHQAMAIAAAUQAAAdghAFQAMAHAQAZIAPAYgAhTgJIATAAQAUAAAGgDQAHgDAAgKQAAgKgGgDQgFgDgVAAIgUAAgAiVA/IgLgdIgyAAIgLAdIgbAAIAxh9IAbAAIAzB9gAjKANIAiAAIgRgug");
	this.shape.setTransform(0.25,-1.35);

	this.timeline.addTween(cjs.Tween.get(this.shape).wait(3));

	// Layer_1
	this.shape_1 = new cjs.Shape();
	this.shape_1.graphics.f().s("#FFFFFF").ss(1,1,1).p("AnsjxIPZAAIAAHjIvZAAg");
	this.shape_1.setTransform(-0.025,0);

	this.shape_2 = new cjs.Shape();
	this.shape_2.graphics.f("#1A1F2A").s().p("AnsDxIAAnhIPZAAIAAHhg");
	this.shape_2.setTransform(-0.025,0);

	this.shape_3 = new cjs.Shape();
	this.shape_3.graphics.f("#485572").s().p("AnsDxIAAnhIPZAAIAAHhg");
	this.shape_3.setTransform(-0.025,0);

	this.shape_4 = new cjs.Shape();
	this.shape_4.graphics.f("#927224").s().p("AnsDxIAAnhIPZAAIAAHhg");
	this.shape_4.setTransform(-0.025,0);

	this.timeline.addTween(cjs.Tween.get({}).to({state:[{t:this.shape_2},{t:this.shape_1}]}).to({state:[{t:this.shape_3},{t:this.shape_1}]},1).to({state:[{t:this.shape_4},{t:this.shape_1}]},1).wait(1));

	this._renderFirstFrame();

}).prototype = p = new cjs.MovieClip();
p.nominalBounds = new cjs.Rectangle(-50.3,-25.1,100.6,50.3);


(lib.TemplateEditorPanel = function(mode,startPosition,loop,reversed) {
if (loop == null) { loop = true; }
if (reversed == null) { reversed = false; }
	var props = new Object();
	props.mode = mode;
	props.startPosition = startPosition;
	props.labels = {};
	props.loop = loop;
	props.reversed = reversed;
	cjs.MovieClip.apply(this,[props]);

	// TEXT
	this.txt_title = new cjs.Text("TEXT", "bold 18px 'Browallia New'", "#FFFFFF");
	this.txt_title.name = "txt_title";
	this.txt_title.textAlign = "center";
	this.txt_title.lineHeight = 26;
	this.txt_title.lineWidth = 176;
	this.txt_title.parent = this;
	this.txt_title.setTransform(-0.75,-11.75);

	this.timeline.addTween(cjs.Tween.get(this.txt_title).wait(1));

	// ArtTemplate
	this.bgState = new lib.ArtTemplate();
	this.bgState.name = "bgState";
	this.bgState.setTransform(-0.75,0);

	this.timeline.addTween(cjs.Tween.get(this.bgState).wait(1));

	this._renderFirstFrame();

}).prototype = getMCSymbolPrototype(lib.TemplateEditorPanel, new cjs.Rectangle(-91.6,-21.9,181.7,43.9), null);


(lib.TabGroupArt = function(mode,startPosition,loop,reversed) {
if (loop == null) { loop = true; }
if (reversed == null) { reversed = false; }
	var props = new Object();
	props.mode = mode;
	props.startPosition = startPosition;
	props.labels = {};
	props.loop = loop;
	props.reversed = reversed;
	cjs.MovieClip.apply(this,[props]);

	// Layer_2
	this.btn_pager_2 = new lib.Pager();
	this.btn_pager_2.name = "btn_pager_2";
	this.btn_pager_2.setTransform(246.1,-0.5,1,1,0,0,180);
	new cjs.ButtonHelper(this.btn_pager_2, 0, 1, 2, false, new lib.Pager(), 3);

	this.btn_pager_1 = new lib.Pager();
	this.btn_pager_1.name = "btn_pager_1";
	this.btn_pager_1.setTransform(-583.25,0.95);
	new cjs.ButtonHelper(this.btn_pager_1, 0, 1, 2, false, new lib.Pager(), 3);

	this.timeline.addTween(cjs.Tween.get({}).to({state:[{t:this.btn_pager_2}]}).to({state:[{t:this.btn_pager_1}]},1).wait(1));

	// Layer_1
	this.btn_resource = new lib.Resource_Tab();
	this.btn_resource.name = "btn_resource";
	this.btn_resource.setTransform(117.75,0);

	this.btn_turrets = new lib.Turrent_Tab();
	this.btn_turrets.name = "btn_turrets";
	this.btn_turrets.setTransform(11.95,0);

	this.btn_blocks = new lib.Block_Tab();
	this.btn_blocks.name = "btn_blocks";
	this.btn_blocks.setTransform(-93.8,0);

	this.btn_weapons = new lib.Weapons_Tab();
	this.btn_weapons.name = "btn_weapons";
	this.btn_weapons.setTransform(-202.35,0);

	this.btn_units = new lib.Unit_Tab();
	this.btn_units.name = "btn_units";
	this.btn_units.setTransform(-315,0);

	this.btn_spawn = new lib.Spawn_Tab();
	this.btn_spawn.name = "btn_spawn";
	this.btn_spawn.setTransform(-427.65,0);

	this.btn_area = new lib.Area_Tab();
	this.btn_area.name = "btn_area";
	this.btn_area.setTransform(-540.95,0);

	this.btn_rule = new lib.Rule_Tab();
	this.btn_rule.name = "btn_rule";
	this.btn_rule.setTransform(-264.65,0);

	this.btn_skills = new lib.Skills_tab();
	this.btn_skills.name = "btn_skills";
	this.btn_skills.setTransform(-380.05,0);

	this.btn_item = new lib.Item_Tab();
	this.btn_item.name = "btn_item";
	this.btn_item.setTransform(-494.3,0);

	this.timeline.addTween(cjs.Tween.get({}).to({state:[{t:this.btn_area},{t:this.btn_spawn},{t:this.btn_units},{t:this.btn_weapons},{t:this.btn_blocks},{t:this.btn_turrets},{t:this.btn_resource}]}).to({state:[{t:this.btn_item},{t:this.btn_skills},{t:this.btn_rule}]},1).wait(1));

	this._renderFirstFrame();

}).prototype = p = new cjs.MovieClip();
p.nominalBounds = new cjs.Rectangle(-599.9,-27.4,862.7,55.3);


(lib.TabGroup = function(mode,startPosition,loop,reversed) {
if (loop == null) { loop = true; }
if (reversed == null) { reversed = false; }
	var props = new Object();
	props.mode = mode;
	props.startPosition = startPosition;
	props.labels = {};
	props.loop = loop;
	props.reversed = reversed;
	cjs.MovieClip.apply(this,[props]);

	this.isSingleFrame = false;
	// timeline functions:
	this.frame_0 = function() {
		if(this.isSingleFrame) {
			return;
		}
		if(this.totalFrames == 1) {
			this.isSingleFrame = true;
		}
		// ============================================================================
		// Action: Frame 1 ภายใน MovieClip [กลุ่ม Tab]
		// ควบคุม TabButton (2 เฟรม), 10 ปุ่มแท็บ (MovieClip 3 เฟรม), และ btn_pager
		// ============================================================================
		var tabRoot = this;
		tabRoot.stop();
		
		window.UIBus = window.UIBus || new createjs.EventDispatcher();
		
		// อ้างอิง MovieClip ลูก TabButton
		var tabStrip = tabRoot.TabButton || tabRoot.tabButton || tabRoot.tab_strip;
		
		if (!tabStrip) {
		    console.error("[กลุ่ม Tab] ไม่พบ MovieClip ลูกชื่อ 'TabButton'");
		}
		
		// ----------------------------------------------------------------------------
		// 1. นิยามข้อมูล 10 แท็บตามลำดับ index (0-9)
		// ----------------------------------------------------------------------------
		var TAB_DEFINITIONS = [
		    { id: "area",     name: "btn_area",     frame: 0, tabIndex: 0 },
		    { id: "spawn",    name: "btn_spawn",    frame: 0, tabIndex: 1 },
		    { id: "units",    name: "btn_units",    frame: 0, tabIndex: 2 },
		    { id: "weapons",  name: "btn_weapons",  frame: 0, tabIndex: 3 },
		    { id: "blocks",   name: "btn_blocks",   frame: 0, tabIndex: 4 },
		    { id: "turrets",  name: "btn_turrets",  frame: 0, tabIndex: 5 },
		    { id: "resource", name: "btn_resource", frame: 0, tabIndex: 6 },
		    { id: "item",     name: "btn_item",     frame: 1, tabIndex: 7 },
		    { id: "skills",   name: "btn_skills",   frame: 1, tabIndex: 8 },
		    { id: "rule",     name: "btn_rule",     frame: 1, tabIndex: 9 }
		];
		
		// เก็บสถานะแท็บที่ถูกเลือกปัจจุบัน (เริ่มต้นที่แท็บแรก "area")
		var currentTabId = "area";
		var currentTabIndex = 0;
		
		// ดัชนีเฟรมสถานะของ MovieClip ปุ่มแท็บ 3 เฟรม
		var STATE_NORMAL   = 0; // Frame 1: ปกติ
		var STATE_HOVER    = 1; // Frame 2: เมาส์ชี้
		var STATE_SELECTED = 2; // Frame 3: ถูกเลือก (Selected)
		
		// ----------------------------------------------------------------------------
		// 2. ฟังก์ชันอัปเดตการแสดงผลของปุ่มทั้งหมดบนหน้าเฟรมปัจจุบันของ TabButton
		// ----------------------------------------------------------------------------
		function refreshButtonVisuals() {
		    if (!tabStrip) return;
		
		    var currentStripFrame = tabStrip.currentFrame || 0;
		
		    for (var i = 0; i < TAB_DEFINITIONS.length; i++) {
		        var def = TAB_DEFINITIONS[i];
		        if (def.frame !== currentStripFrame) continue;
		
		        var btn = tabStrip[def.name];
		        if (!btn) continue;
		
		        btn.stop();
		        if (def.id === currentTabId) {
		            btn.gotoAndStop(STATE_SELECTED); // ค้างที่ Frame 3 (Selected)
		        } else {
		            btn.gotoAndStop(STATE_NORMAL);   // กลับไป Frame 1 (Normal)
		        }
		    }
		
		    if (tabRoot.stage) tabRoot.stage.update();
		}
		
		// ----------------------------------------------------------------------------
		// 3. ฟังก์ชันเลือกแท็บ (Select Tab)
		// ----------------------------------------------------------------------------
		function selectTab(tabId, force) {
		    // กฎสำคัญ: ถ้าแท็บเดิมถูกเลือกอยู่แล้ว ไม่มีความจำเป็นต้องกดซ้ำ
		    if (tabId === currentTabId && !force) {
		        return;
		    }
		
		    var targetDef = null;
		    for (var i = 0; i < TAB_DEFINITIONS.length; i++) {
		        if (TAB_DEFINITIONS[i].id === tabId) {
		            targetDef = TAB_DEFINITIONS[i];
		            break;
		        }
		    }
		    if (!targetDef) return;
		
		    currentTabId = targetDef.id;
		    currentTabIndex = targetDef.tabIndex;
		
		    // อัปเดตกราฟิกสถานะปุ่ม
		    refreshButtonVisuals();
		
		    // ส่งสัญญาณ Event กลางสู่ระบบ (editor_rail และ editor-settings จะดักฟัง)
		    window.UIBus.dispatchEvent({
		        type: "TAB_SELECTED",
		        tabId: currentTabId,
		        tabIndex: currentTabIndex
		    });
		
		    console.log("[กลุ่ม Tab] สลับแท็บสำเร็จ:", currentTabId, "(Index:", currentTabIndex + ")");
		}
		
		// ----------------------------------------------------------------------------
		// 4. ผูก Event เมาส์ให้กับปุ่มแท็บและปุ่ม Pager บนเฟรมปัจจุบันของ TabButton
		// ----------------------------------------------------------------------------
		function bindCurrentFrameControls() {
		    if (!tabStrip) return;
		
		    var currentStripFrame = tabStrip.currentFrame || 0;
		
		    // 4.1 ผูกปุ่มแท็บในเฟรมนี้
		    for (var i = 0; i < TAB_DEFINITIONS.length; i++) {
		        (function (def) {
		            if (def.frame !== currentStripFrame) return;
		
		            var btn = tabStrip[def.name];
		            if (!btn) return;
		
		            btn.stop();
		            btn.cursor = "pointer";
		
		            // ปลด Event เก่าก่อนผูกใหม่ทุกครั้งที่สลับเฟรม
		            btn.removeAllEventListeners("rollover");
		            btn.removeAllEventListeners("rollout");
		            btn.removeAllEventListeners("mousedown");
		            btn.removeAllEventListeners("pressup");
		            btn.removeAllEventListeners("click");
		
		            // เมื่อเมาส์ชี้ (Hover)
		            btn.on("rollover", function () {
		                if (currentTabId !== def.id) {
		                    btn.gotoAndStop(STATE_HOVER); // Frame 2
		                    if (tabRoot.stage) tabRoot.stage.update();
		                }
		            });
		
		            // เมื่อเมาส์ออก (Out)
		            btn.on("rollout", function () {
		                if (currentTabId !== def.id) {
		                    btn.gotoAndStop(STATE_NORMAL); // Frame 1
		                    if (tabRoot.stage) tabRoot.stage.update();
		                }
		            });
		
		            // เมื่อกดคลิก (Mousedown) -> เข้าสู่สถานะ Selected ทันทีใน 0ms ไม่ซับซ้อน
		            btn.on("mousedown", function (evt) {
		                if (evt) evt.stopPropagation();
		                selectTab(def.id);
		            });
		        })(TAB_DEFINITIONS[i]);
		    }
		
		    // 4.2 ผูกปุ่ม Pager สำหรับเลื่อน Frame 1 <-> Frame 2 (รองรับ btn_pager_1, btn_pager_2)
		    function switchPage(targetFrame) {
		        tabStrip.gotoAndStop(targetFrame);
		        bindCurrentFrameControls();
		        refreshButtonVisuals();
		    }
		
		    function bindPagerPress(targetBtn, onTrigger) {
		        if (!targetBtn) return;
		        targetBtn.cursor = "pointer";
		        targetBtn.removeAllEventListeners("mousedown");
		        targetBtn.removeAllEventListeners("pressup");
		        targetBtn.removeAllEventListeners("click");
		
		        var isPagerDown = false;
		        targetBtn.on("mousedown", function (evt) {
		            if (evt) evt.stopPropagation();
		            isPagerDown = true;
		        });
		
		        targetBtn.on("pressup", function (evt) {
		            if (evt) evt.stopPropagation();
		            if (!isPagerDown) return;
		            isPagerDown = false;
		
		            var pt = targetBtn.globalToLocal(evt.stageX, evt.stageY);
		            if (targetBtn.hitTest(pt.x, pt.y)) {
		                onTrigger();
		            }
		        });
		    }
		
		    var hasBothPagers = Boolean(tabStrip.btn_pager_1 && tabStrip.btn_pager_2);
		
		    if (hasBothPagers) {
		        // กรณีมี 2 ปุ่มอยู่คู่กันบนหน้าจอเดียว:
		        // btn_pager_1 = ย้อนกลับไปหน้า 1 (Frame Index 0)
		        bindPagerPress(tabStrip.btn_pager_1, function () {
		            if (tabStrip.currentFrame !== 0) switchPage(0);
		        });
		
		        // btn_pager_2 = เลื่อนไปหน้า 2 (Frame Index 1)
		        bindPagerPress(tabStrip.btn_pager_2, function () {
		            if (tabStrip.currentFrame !== 1) switchPage(1);
		        });
		    } else {
		        // กรณีปุ่มอยู่คนละ Keyframe (Frame 1 เลื่อนไปหน้า 2, Frame 2 เลื่อนกลับหน้า 1)
		        var singlePager = tabStrip.btn_pager_1 || tabStrip.btn_pager_2 || tabStrip.btn_pager || tabStrip.is_pager;
		        if (singlePager) {
		            bindPagerPress(singlePager, function () {
		                var nextFrame = tabStrip.currentFrame === 0 ? 1 : 0;
		                switchPage(nextFrame);
		            });
		        }
		    }
		
		    refreshButtonVisuals();
		}
		
		// ----------------------------------------------------------------------------
		// 5. เริ่มต้นการทำงาน (Initialization)
		// ----------------------------------------------------------------------------
		if (tabStrip) {
		    tabStrip.gotoAndStop(0); // เริ่มต้นที่ Frame 1
		    bindCurrentFrameControls();
		    selectTab("area", true); // เลือกแท็บ area เป็นค่าเริ่มต้น
		}
		
		// ----------------------------------------------------------------------------
		// 6. ดักฟัง Event ภายนอกเผื่อมีระบบอื่นสั่งสลับแท็บ
		// ----------------------------------------------------------------------------
		tabRoot._handleExternalSelectTab = function (evt) {
		    if (!evt || !evt.tabId) return;
		
		    // หาว่าแท็บที่ต้องการอยู่อยู่ในเฟรมไหนของ TabButton
		    for (var j = 0; j < TAB_DEFINITIONS.length; j++) {
		        if (TAB_DEFINITIONS[j].id === evt.tabId) {
		            var targetFrame = TAB_DEFINITIONS[j].frame;
		            if (tabStrip && tabStrip.currentFrame !== targetFrame) {
		                tabStrip.gotoAndStop(targetFrame);
		                bindCurrentFrameControls();
		            }
		            selectTab(evt.tabId);
		            break;
		        }
		    }
		};
		
		window.UIBus.off("UI_SET_ACTIVE_TAB", tabRoot._handleExternalSelectTab);
		window.UIBus.on("UI_SET_ACTIVE_TAB", tabRoot._handleExternalSelectTab);
	}

	// actions tween:
	this.timeline.addTween(cjs.Tween.get(this).call(this.frame_0).wait(1));

	// Layer_1
	this.TabButton = new lib.TabGroupArt();
	this.TabButton.name = "TabButton";

	this.timeline.addTween(cjs.Tween.get(this.TabButton).wait(1));

	this._renderFirstFrame();

}).prototype = getMCSymbolPrototype(lib.TabGroup, new cjs.Rectangle(-590.8,-26.9,853.0999999999999,52.9), null);


(lib.panel_new = function(mode,startPosition,loop,reversed) {
if (loop == null) { loop = true; }
if (reversed == null) { reversed = false; }
	var props = new Object();
	props.mode = mode;
	props.startPosition = startPosition;
	props.labels = {};
	props.loop = loop;
	props.reversed = reversed;
	cjs.MovieClip.apply(this,[props]);

	this.isSingleFrame = false;
	// timeline functions:
	this.frame_0 = function() {
		if(this.isSingleFrame) {
			return;
		}
		if(this.totalFrames == 1) {
			this.isSingleFrame = true;
		}
		// ============================================================================
		// Action 2: Frame 1 ภายใน MovieClip panel_new
		// ============================================================================
		var panel = this;
		panel.stop();
		
		window.UIBus = window.UIBus || new createjs.EventDispatcher();
		
		// 1. ปุ่มยืนยัน (Confirm New Map)
		if (panel.btn_confirm) {
		    panel.btn_confirm.cursor = "pointer";
		    panel.btn_confirm.removeAllEventListeners("click");
		    panel.btn_confirm.on("click", function (evt) {
		        if (evt) evt.stopPropagation();
		        
		        // ส่งสัญญาณปิด Panel ทั้งหมด
		        window.UIBus.dispatchEvent({ type: "UI_CLOSE_CONFIRM_PANELS" });
		
		        // ส่งสัญญาณบอก Main Timeline ให้กลับไป Frame 1 (สร้างแมพใหม่)
		        window.UIBus.dispatchEvent({ type: "UI_REQUEST_NEW_MAP" });
		    });
		}
		
		// 2. ปุ่มยกเลิก (Cancel)
		if (panel.btn_cancel) {
		    panel.btn_cancel.cursor = "pointer";
		    panel.btn_cancel.removeAllEventListeners("click");
		    panel.btn_cancel.on("click", function (evt) {
		        if (evt) evt.stopPropagation();
		        window.UIBus.dispatchEvent({ type: "UI_CLOSE_CONFIRM_PANELS" });
		    });
		}
	}

	// actions tween:
	this.timeline.addTween(cjs.Tween.get(this).call(this.frame_0).wait(1));

	// Layer_3
	this.btn_cancel = new lib.btn_cancel();
	this.btn_cancel.name = "btn_cancel";
	this.btn_cancel.setTransform(155.3,113.05);
	new cjs.ButtonHelper(this.btn_cancel, 0, 1, 2);

	this.btn_confirm = new lib.btn_confirm();
	this.btn_confirm.name = "btn_confirm";
	this.btn_confirm.setTransform(-163.05,113.05);
	new cjs.ButtonHelper(this.btn_confirm, 0, 1, 2);

	this.timeline.addTween(cjs.Tween.get({}).to({state:[{t:this.btn_confirm},{t:this.btn_cancel}]}).wait(1));

	// Layer_2
	this.text = new cjs.Text("panel_new", "bold 55px 'Browallia New'", "#FFFFFF");
	this.text.textAlign = "center";
	this.text.lineHeight = 74;
	this.text.lineWidth = 560;
	this.text.parent = this;
	this.text.setTransform(5.25,-167.45);

	this.timeline.addTween(cjs.Tween.get(this.text).wait(1));

	// Layer_1
	this.shape = new cjs.Shape();
	this.shape.graphics.f().s("#FFFFFF").ss(2,1,1).p("EgtwgcZMBbhAAAMAAAA4zMhbhAAAg");

	this.shape_1 = new cjs.Shape();
	this.shape_1.graphics.f("#121418").s().p("EgtwAcZMAAAg4xMBbhAAAMAAAA4xg");

	this.timeline.addTween(cjs.Tween.get({}).to({state:[{t:this.shape_1},{t:this.shape}]}).wait(1));

	// Layer_4
	this.shape_2 = new cjs.Shape();
	this.shape_2.graphics.f("rgba(0,0,0,0.498)").s().p("EhnMA7kMAAAh3HMDOYAAAMAAAB3Hg");
	this.shape_2.setTransform(20.4,14.025);

	this.timeline.addTween(cjs.Tween.get(this.shape_2).wait(1));

	this._renderFirstFrame();

}).prototype = getMCSymbolPrototype(lib.panel_new, new cjs.Rectangle(-640,-367.2,1320.9,762.5), null);


(lib.panel_import = function(mode,startPosition,loop,reversed) {
if (loop == null) { loop = true; }
if (reversed == null) { reversed = false; }
	var props = new Object();
	props.mode = mode;
	props.startPosition = startPosition;
	props.labels = {};
	props.loop = loop;
	props.reversed = reversed;
	cjs.MovieClip.apply(this,[props]);

	this.isSingleFrame = false;
	// timeline functions:
	this.frame_0 = function() {
		if(this.isSingleFrame) {
			return;
		}
		if(this.totalFrames == 1) {
			this.isSingleFrame = true;
		}
		// ============================================================================
		// Action 3: Frame 1 ภายใน MovieClip panel_import
		// ============================================================================
		var panel = this;
		panel.stop();
		
		window.UIBus = window.UIBus || new createjs.EventDispatcher();
		window.EditorData = window.EditorData || { doc: null };
		
		// 1. ปุ่มยืนยัน (Confirm Import JSON)
		if (panel.btn_confirm) {
		    panel.btn_confirm.cursor = "pointer";
		    panel.btn_confirm.removeAllEventListeners("click");
		    panel.btn_confirm.on("click", function (evt) {
		        if (evt) evt.stopPropagation();
		
		        // ปิด Panel ทันที
		        window.UIBus.dispatchEvent({ type: "UI_CLOSE_CONFIRM_PANELS" });
		
		        // เปิด File Picker ในเบราว์เซอร์
		        var fileInput = document.createElement("input");
		        fileInput.type = "file";
		        fileInput.accept = ".json,application/json";
		        fileInput.style.display = "none";
		        document.body.appendChild(fileInput);
		
		        fileInput.onchange = function (e) {
		            var file = e.target.files && e.target.files[0];
		            if (!file) {
		                if (fileInput.parentNode) fileInput.parentNode.removeChild(fileInput);
		                return;
		            }
		
		            var reader = new FileReader();
		            reader.onload = function (readEvt) {
		                try {
		                    var parsed = JSON.parse(readEvt.target.result);
		                    window.EditorData.doc = parsed;
		
		                    // แจ้งให้ทุกส่วนของ Editor ทราบว่ามีข้อมูลแมพใหม่เข้ามา
		                    window.UIBus.dispatchEvent({
		                        type: "MAP_DATA_READY",
		                        doc: parsed
		                    });
		                } catch (err) {
		                    console.error("[panel_import] นำเข้าไฟล์ JSON ไม่สำเร็จ:", err);
		                }
		
		                if (fileInput.parentNode) fileInput.parentNode.removeChild(fileInput);
		            };
		            reader.readAsText(file);
		        };
		
		        fileInput.click();
		    });
		}
		
		// 2. ปุ่มยกเลิก (Cancel)
		if (panel.btn_cancel) {
		    panel.btn_cancel.cursor = "pointer";
		    panel.btn_cancel.removeAllEventListeners("click");
		    panel.btn_cancel.on("click", function (evt) {
		        if (evt) evt.stopPropagation();
		        window.UIBus.dispatchEvent({ type: "UI_CLOSE_CONFIRM_PANELS" });
		    });
		}
	}

	// actions tween:
	this.timeline.addTween(cjs.Tween.get(this).call(this.frame_0).wait(1));

	// Layer_3
	this.btn_cancel = new lib.btn_cancel();
	this.btn_cancel.name = "btn_cancel";
	this.btn_cancel.setTransform(155.3,113.05);
	new cjs.ButtonHelper(this.btn_cancel, 0, 1, 2);

	this.btn_confirm = new lib.btn_confirm();
	this.btn_confirm.name = "btn_confirm";
	this.btn_confirm.setTransform(-163.05,113.05);
	new cjs.ButtonHelper(this.btn_confirm, 0, 1, 2);

	this.timeline.addTween(cjs.Tween.get({}).to({state:[{t:this.btn_confirm},{t:this.btn_cancel}]}).wait(1));

	// Layer_2
	this.text = new cjs.Text("panel_import", "bold 55px 'Browallia New'", "#FFFFFF");
	this.text.textAlign = "center";
	this.text.lineHeight = 74;
	this.text.lineWidth = 560;
	this.text.parent = this;
	this.text.setTransform(5.25,-167.45);

	this.timeline.addTween(cjs.Tween.get(this.text).wait(1));

	// Layer_1
	this.shape = new cjs.Shape();
	this.shape.graphics.f().s("#FFFFFF").ss(2,1,1).p("EgtwgcZMBbhAAAMAAAA4zMhbhAAAg");

	this.shape_1 = new cjs.Shape();
	this.shape_1.graphics.f("#121418").s().p("EgtwAcZMAAAg4xMBbhAAAMAAAA4xg");

	this.timeline.addTween(cjs.Tween.get({}).to({state:[{t:this.shape_1},{t:this.shape}]}).wait(1));

	// Layer_4
	this.shape_2 = new cjs.Shape();
	this.shape_2.graphics.f("rgba(0,0,0,0.498)").s().p("EhnMA7kMAAAh3HMDOYAAAMAAAB3Hg");
	this.shape_2.setTransform(20.4,14.025);

	this.timeline.addTween(cjs.Tween.get(this.shape_2).wait(1));

	this._renderFirstFrame();

}).prototype = getMCSymbolPrototype(lib.panel_import, new cjs.Rectangle(-640,-367.2,1320.9,762.5), null);


(lib.panel_export = function(mode,startPosition,loop,reversed) {
if (loop == null) { loop = true; }
if (reversed == null) { reversed = false; }
	var props = new Object();
	props.mode = mode;
	props.startPosition = startPosition;
	props.labels = {};
	props.loop = loop;
	props.reversed = reversed;
	cjs.MovieClip.apply(this,[props]);

	this.isSingleFrame = false;
	// timeline functions:
	this.frame_0 = function() {
		if(this.isSingleFrame) {
			return;
		}
		if(this.totalFrames == 1) {
			this.isSingleFrame = true;
		}
		// ============================================================================
		// Action 4: Frame 1 ภายใน MovieClip panel_export
		// ============================================================================
		var panel = this;
		panel.stop();
		
		window.UIBus = window.UIBus || new createjs.EventDispatcher();
		window.EditorData = window.EditorData || { doc: null };
		
		// 1. ปุ่มยืนยัน (Confirm Export JSON)
		if (panel.btn_confirm) {
		    panel.btn_confirm.cursor = "pointer";
		    panel.btn_confirm.removeAllEventListeners("click");
		    panel.btn_confirm.on("click", function (evt) {
		        if (evt) evt.stopPropagation();
		
		        // ซ่อน Panel ผ่าน Event Bus
		        window.UIBus.dispatchEvent({ type: "UI_CLOSE_CONFIRM_PANELS" });
		
		        var doc = window.EditorData.doc;
		        if (!doc) {
		            console.warn("[panel_export] ไม่มีข้อมูลแผนที่สำหรับ Export");
		            return;
		        }
		
		        try {
		            var fileName = (doc.name || "theddos_map") + ".json";
		            var jsonStr = JSON.stringify(doc, null, 2);
		            var blob = new Blob([jsonStr], { type: "application/json;charset=utf-8" });
		
		            var a = document.createElement("a");
		            a.href = URL.createObjectURL(blob);
		            a.download = fileName;
		            a.style.display = "none";
		            document.body.appendChild(a);
		            a.click();
		
		            setTimeout(function () {
		                if (a.parentNode) a.parentNode.removeChild(a);
		                URL.revokeObjectURL(a.href);
		            }, 100);
		        } catch (err) {
		            console.error("[panel_export] ส่งออกไฟล์ JSON ไม่สำเร็จ:", err);
		        }
		    });
		}
		
		// 2. ปุ่มยกเลิก (Cancel)
		if (panel.btn_cancel) {
		    panel.btn_cancel.cursor = "pointer";
		    panel.btn_cancel.removeAllEventListeners("click");
		    panel.btn_cancel.on("click", function (evt) {
		        if (evt) evt.stopPropagation();
		        window.UIBus.dispatchEvent({ type: "UI_CLOSE_CONFIRM_PANELS" });
		    });
		}
	}

	// actions tween:
	this.timeline.addTween(cjs.Tween.get(this).call(this.frame_0).wait(1));

	// Layer_3
	this.btn_cancel = new lib.btn_cancel();
	this.btn_cancel.name = "btn_cancel";
	this.btn_cancel.setTransform(155.3,113.05);
	new cjs.ButtonHelper(this.btn_cancel, 0, 1, 2);

	this.btn_confirm = new lib.btn_confirm();
	this.btn_confirm.name = "btn_confirm";
	this.btn_confirm.setTransform(-163.05,113.05);
	new cjs.ButtonHelper(this.btn_confirm, 0, 1, 2);

	this.timeline.addTween(cjs.Tween.get({}).to({state:[{t:this.btn_confirm},{t:this.btn_cancel}]}).wait(1));

	// Layer_2
	this.text = new cjs.Text("panel_export", "bold 55px 'Browallia New'", "#FFFFFF");
	this.text.textAlign = "center";
	this.text.lineHeight = 74;
	this.text.lineWidth = 560;
	this.text.parent = this;
	this.text.setTransform(5.25,-167.45);

	this.timeline.addTween(cjs.Tween.get(this.text).wait(1));

	// Layer_1
	this.shape = new cjs.Shape();
	this.shape.graphics.f().s("#FFFFFF").ss(2,1,1).p("EgtwgcZMBbhAAAMAAAA4zMhbhAAAg");

	this.shape_1 = new cjs.Shape();
	this.shape_1.graphics.f("#121418").s().p("EgtwAcZMAAAg4xMBbhAAAMAAAA4xg");

	this.timeline.addTween(cjs.Tween.get({}).to({state:[{t:this.shape_1},{t:this.shape}]}).wait(1));

	// Layer_4
	this.shape_2 = new cjs.Shape();
	this.shape_2.graphics.f("rgba(0,0,0,0.498)").s().p("EhnMA7kMAAAh3HMDOYAAAMAAAB3Hg");
	this.shape_2.setTransform(20.4,14.025);

	this.timeline.addTween(cjs.Tween.get(this.shape_2).wait(1));

	this._renderFirstFrame();

}).prototype = getMCSymbolPrototype(lib.panel_export, new cjs.Rectangle(-640,-367.2,1320.9,762.5), null);


(lib.InputFieldRC = function(mode,startPosition,loop,reversed) {
if (loop == null) { loop = true; }
if (reversed == null) { reversed = false; }
	var props = new Object();
	props.mode = mode;
	props.startPosition = startPosition;
	props.labels = {};
	props.loop = loop;
	props.reversed = reversed;
	cjs.MovieClip.apply(this,[props]);

	// Layer_2
	this.txt_val = new cjs.Text("", "bold 38px 'Browallia New'", "#FFFFFF");
	this.txt_val.name = "txt_val";
	this.txt_val.textAlign = "center";
	this.txt_val.lineHeight = 52;
	this.txt_val.lineWidth = 115;
	this.txt_val.parent = this;
	this.txt_val.setTransform(1.2,-23.9);

	this.timeline.addTween(cjs.Tween.get(this.txt_val).wait(1));

	// Layer_1
	this.art_input = new lib.ArtInput();
	this.art_input.name = "art_input";

	this.timeline.addTween(cjs.Tween.get(this.art_input).wait(1));

	this._renderFirstFrame();

}).prototype = getMCSymbolPrototype(lib.InputFieldRC, new cjs.Rectangle(-70.7,-36.5,141.4,73), null);


(lib.InputField = function(mode,startPosition,loop,reversed) {
if (loop == null) { loop = true; }
if (reversed == null) { reversed = false; }
	var props = new Object();
	props.mode = mode;
	props.startPosition = startPosition;
	props.labels = {};
	props.loop = loop;
	props.reversed = reversed;
	cjs.MovieClip.apply(this,[props]);

	// Layer_2
	this.txt_input = new cjs.Text("", "bold 38px 'Browallia New'", "#FFFFFF");
	this.txt_input.name = "txt_input";
	this.txt_input.lineHeight = 52;
	this.txt_input.lineWidth = 401;
	this.txt_input.parent = this;
	this.txt_input.setTransform(-201.5,-24.4);

	this.timeline.addTween(cjs.Tween.get(this.txt_input).wait(1));

	// Layer_1
	this.art_bg = new lib.ArtInput2();
	this.art_bg.name = "art_bg";

	this.timeline.addTween(cjs.Tween.get(this.art_bg).wait(1));

	this._renderFirstFrame();

}).prototype = getMCSymbolPrototype(lib.InputField, new cjs.Rectangle(-207.9,-26.4,415.9,53.599999999999994), null);


(lib.Frame1 = function(mode,startPosition,loop,reversed) {
if (loop == null) { loop = true; }
if (reversed == null) { reversed = false; }
	var props = new Object();
	props.mode = mode;
	props.startPosition = startPosition;
	props.labels = {};
	props.loop = loop;
	props.reversed = reversed;
	cjs.MovieClip.apply(this,[props]);

	this.isSingleFrame = false;
	// timeline functions:
	this.frame_0 = function() {
		if(this.isSingleFrame) {
			return;
		}
		if(this.totalFrames == 1) {
			this.isSingleFrame = true;
		}
		if (window.EditorBridge && typeof window.EditorBridge.initCardCreate === "function") {
		    window.EditorBridge.initCardCreate(this);
		}
	}

	// actions tween:
	this.timeline.addTween(cjs.Tween.get(this).call(this.frame_0).wait(1));

	// Layer_2
	this.txt_error = new cjs.Text("\"...\"", "bold 30px 'Browallia New'", "#FF8A8A");
	this.txt_error.name = "txt_error";
	this.txt_error.textAlign = "center";
	this.txt_error.lineHeight = 41;
	this.txt_error.lineWidth = 398;
	this.txt_error.parent = this;
	this.txt_error.setTransform(-4.25,71.45);

	this.shape = new cjs.Shape();
	this.shape.graphics.f("#FFFFFF").s().p("AHFBHQgPgTAAgcQAAgdAQgTQAPgTAcAAQA9AAAABMIhVAAQABAgAaAAQARAAAFgTIAiAGQgNAmgrAAQghAAgOgTgAHZAMIAzAAQgBgdgYAAQgaAAAAAdgABdBQQgNgLAAgRQAAgOAIgKQAIgKAfgGQAZgFAIgEIAAgDQABgRgYAAQgQAAgHAQIgegGQAKgkAuAAQAfAAAMALQALALAAAaIAAAoQAAAaAHAQIgiAAIgEgOQgSARgWAAQgTAAgLgKgAB5AlQgGAEgBAHQAAAJAHAEQAFAFAHAAQAbAAAAgiIAAgHQgQAEgXAIgAkIBHQgOgTAAgcQAAgdAQgTQAPgTAcAAQA9AAAABMIhWAAQACAgAaAAQARAAAFgTIAiAGQgOAmgqAAQghAAgPgTgAjzAMIAzAAQgBgdgYAAQgaAAAAAdgAF8BXIAAhJQAAgVgGgFQgEgFgIAAQgaAAABArIAAA9IgjAAIAAhGQAAgQgCgIQgDgKgNAAQgKAAgIAHQgHAHAAAcIAAA+IgjAAIAAh/IAgAAIAAARQARgUAXAAQAZAAALAUQASgUAWAAQAqAAAAAwIAABSgAAVBXIAAhBQAAgWgFgJQgDgIgNAAQgLAAgIAGQgJAHAAAhIAAA6IgiAAIAAh/IAgAAIAAATQARgWAZAAQArAAAAAyIAABQgAlRBXIAAiwIAiAAIAACwgAmXBXIAAh/IAjAAIAAB/gAotBXIAAiwIB6AAIAAAeIhWAAIAAAqIBKAAIAAAdIhKAAIAABLgAmXg6IAAgfIAjAAIAAAfg");
	this.shape.setTransform(-136.45,-152.275);

	this.shape_1 = new cjs.Shape();
	this.shape_1.graphics.f("#FFFFFF").s().p("AGPA0IAigFQAEAUAXAAQAZAAAAgOQAAgIgOgDQgvgKgLgKQgKgLAAgNQAAgoA3AAQAvAAAJAiIggAGQgEgPgUAAQgXAAAAAKQAAAIAkAIQAbAGAKAIQALAJAAAQQAAAWgRALQgSALgYAAQgzAAgKgogAhxApIAAhQIAiAAIAAA6QAAAcAFAJQAEAKANAAQAQAAAGgKQAFgKAAggIAAg1IAhAAIAACAIgeAAIAAgUQgPAXgcAAQgrAAAAgzgAlCBKQgSgSAAghQAAgbASgTQASgTAeAAQAeAAASATQASATAAAcQAAAdgSATQgTAUgdAAQgeAAgSgSgAkpgDQgIAKAAARQAAASAIALQAIALAPAAQAPAAAIgLQAJgLAAgSQAAgRgJgKQgIgLgPAAQgPAAgIALgAnyBAQgUgbAAgjQAAgqAXgZQAVgaAoAAQA4AAAPA0IgkAJQgHgegeAAQgsAAAAA8QAAA9ArAAQAfAAAIgmIAjALQgQA6g6AAQgpAAgUgcgAFWBZIAAhCQAAgWgEgIQgEgJgNAAQgLAAgJAHQgIAHAAAhIAAA6IgiAAIAAiAIAfAAIAAATQARgWAaAAQArAAAAAzIAABQgAC/BZIAAhKQAAgUgFgGQgFgFgIAAQgZAAAAArIAAA+IgiAAIAAhHQAAgPgDgJQgDgKgMAAQgLAAgHAHQgIAIAAAbIAAA/IgiAAIAAiAIAfAAIAAASQARgVAXAAQAZAAAMAVQARgVAWAAQAqAAAAAxIAABSgAi1BZIAAixIAiAAIAACxg");
	this.shape_1.setTransform(95.125,-56.375);

	this.shape_2 = new cjs.Shape();
	this.shape_2.graphics.f("#FFFFFF").s().p("ADEAyIAigFQAEAUAXAAQAZAAAAgOQAAgHgOgDQgvgLgLgKQgKgKAAgOQAAgnA3AAQAvAAAJAiIggAGQgEgQgUAAQgXAAAAALQAAAIAkAHQAbAGAKAJQALAJAAAQQAAAVgRALQgSALgYAAQgzAAgKgogAh+BIQgSgSAAghQAAgaATgTQASgTAeAAQAdAAATATQASASAAAcQAAAegTATQgSATgdAAQgeAAgTgSgAhkgFQgJAKAAASQAAARAJALQAIALAPAAQAPAAAIgLQAIgLAAgRQAAgSgIgKQgIgKgPAAQgPAAgIAKgAB0BXIgWhTIgWBTIghAAIgoh/IAgAAIAYBTIAWhTIAhAAIAWBTIAYhTIAiAAIgqB/gAjGBXIgmg5QgGgJgHgEQgHgEgQAAIgHAAIAABKIgkAAIAAiwIBMAAQAjAAARAKQASALAAAcQAAAqgvAHQASAJAVAjIAWAigAkXgOIAbAAQAbAAAJgFQAKgEAAgOQAAgNgIgFQgIgEgdAAIgcAAg");
	this.shape_2.setTransform(-100.625,-56.225);

	this.shape_3 = new cjs.Shape();
	this.shape_3.graphics.f("#FFFFFF").s().p("AHABZIAAixIA6AAQAdAAAOADQANACALAOQALAOAAAWQAAATgJANQgIAMgNAGQgOAFghAAIgXAAIAABDgAHkgHIATAAQAYAAAKgGQAKgFAAgPQAAgOgJgFQgJgGgcAAIgRAAgAGGBZIgPgpIhIAAIgOApIgmAAIBFixIAmAAIBHCxgAE7ASIAxAAIgZhAgADJBZIAAiLIgjCLIgjAAIgjiLIAACLIgiAAIAAixIA2AAIAgB4IAhh4IA1AAIAACxgAhoBZIgjiEIgkCEIgmAAIgrixIAkAAIAbB5IAhh5IAqAAIAgB7IAbh7IAkAAIgsCxgAmVBZIAAixICEAAIAAAeIhgAAIAAAoIBZAAIAAAcIhZAAIAAAxIBjAAIAAAegAneBZIhIhzIAABzIghAAIAAixIAjAAIBJB2IAAh2IAgAAIAACxg");
	this.shape_3.setTransform(1.35,-186.325);

	this.timeline.addTween(cjs.Tween.get({}).to({state:[{t:this.shape_3},{t:this.shape_2},{t:this.shape_1},{t:this.shape},{t:this.txt_error}]}).wait(1));

	// Layer_5
	this.input_cols = new lib.InputFieldRC();
	this.input_cols.name = "input_cols";
	this.input_cols.setTransform(99.65,-2.75);

	this.input_rows = new lib.InputFieldRC();
	this.input_rows.name = "input_rows";
	this.input_rows.setTransform(-100.4,-2.75);

	this.btn_create = new lib.ButtonArtCreate();
	this.btn_create.name = "btn_create";
	this.btn_create.setTransform(-0.15,175.2,1,1,0,0,0,0.1,0.1);
	new cjs.ButtonHelper(this.btn_create, 0, 1, 2);

	this.input_name = new lib.InputField();
	this.input_name.name = "input_name";
	this.input_name.setTransform(0.05,-110,0.936,1);

	this.timeline.addTween(cjs.Tween.get({}).to({state:[{t:this.input_name},{t:this.btn_create},{t:this.input_rows},{t:this.input_cols}]}).wait(1));

	// Layer_3
	this.shape_4 = new cjs.Shape();
	this.shape_4.graphics.f().s("#101820").ss(5,1,1).p("Eg2jgm6MBtHAAAMAAABN1MhtHAAAg");
	this.shape_4.setTransform(-1.9166,-34.4009,0.6605,0.837);

	this.shape_5 = new cjs.Shape();
	this.shape_5.graphics.f("#5E1A12").s().p("EgBhggkIDDDRMAAAA6mIjDDSg");
	this.shape_5.setTransform(-222.95,-34.475);

	this.shape_6 = new cjs.Shape();
	this.shape_6.graphics.f("#101820").s().p("Egg+AdUMAAAg6nMBB9AAAMAAAA6ng");
	this.shape_6.setTransform(-2.025,-34.5);

	this.shape_7 = new cjs.Shape();
	this.shape_7.graphics.f("#45150F").s().p("EgkCABpIDEjRMBB9AAAIDEDRg");
	this.shape_7.setTransform(-2.05,163.525);

	this.shape_8 = new cjs.Shape();
	this.shape_8.graphics.f("#9D3428").s().p("Egg+ABoIjEjPMBIFAAAIjEDPg");
	this.shape_8.setTransform(-2.05,-232.5);

	this.shape_9 = new cjs.Shape();
	this.shape_9.graphics.f("#6F2219").s().p("AhhdTMAAAg6mIDDjRMAAABBJg");
	this.shape_9.setTransform(218.875,-34.475);

	this.timeline.addTween(cjs.Tween.get({}).to({state:[{t:this.shape_9},{t:this.shape_8},{t:this.shape_7},{t:this.shape_6},{t:this.shape_5},{t:this.shape_4}]}).wait(1));

	// Layer_4
	this.shape_10 = new cjs.Shape();
	this.shape_10.graphics.f().s("#101820").ss(2,1,1).p("APchhI+3AAIAADDIe3AAg");
	this.shape_10.setTransform(-5,-34.014,7.0188,1,-90);

	this.shape_11 = new cjs.Shape();
	this.shape_11.graphics.f("#E85D4C").s().p("AvbBiIAAjDIe3AAIAADDg");
	this.shape_11.setTransform(-5,-34.014,7.0188,1,-90);

	this.shape_12 = new cjs.Shape();
	this.shape_12.graphics.f().s("#101820").ss(2,1,1).p("APchhI+3AAIAADDIe3AAg");
	this.shape_12.setTransform(-8.2421,154.6,10.7361,1,180);

	this.shape_13 = new cjs.Shape();
	this.shape_13.graphics.f("#E85D4C").s().p("AvbBiIAAjDIe3AAIAADDg");
	this.shape_13.setTransform(-8.2421,154.6,10.7361,1,180);

	this.shape_14 = new cjs.Shape();
	this.shape_14.graphics.f().s("#101820").ss(2,1,1).p("EilxABiMFLjAAAIAAjDMlLjAAAg");
	this.shape_14.setTransform(-8.25,-160.8);

	this.shape_15 = new cjs.Shape();
	this.shape_15.graphics.f("#E85D4C").s().p("EilxABiIAAjDMFLjAAAIAADDg");
	this.shape_15.setTransform(-8.25,-160.8);

	this.timeline.addTween(cjs.Tween.get({}).to({state:[{t:this.shape_15},{t:this.shape_14},{t:this.shape_13},{t:this.shape_12},{t:this.shape_11},{t:this.shape_10}]}).wait(1));

	this._renderFirstFrame();

}).prototype = getMCSymbolPrototype(lib.Frame1, new cjs.Rectangle(-1070.2,-728.6,2124,1389.2), null);


(lib.EditorBar = function(mode,startPosition,loop,reversed) {
if (loop == null) { loop = true; }
if (reversed == null) { reversed = false; }
	var props = new Object();
	props.mode = mode;
	props.startPosition = startPosition;
	props.labels = {};
	props.loop = loop;
	props.reversed = reversed;
	cjs.MovieClip.apply(this,[props]);

	this.isSingleFrame = false;
	// timeline functions:
	this.frame_0 = function() {
		if(this.isSingleFrame) {
			return;
		}
		if(this.totalFrames == 1) {
			this.isSingleFrame = true;
		}
		// ============================================================================
		// EditorBar Short Binding (Clean Architecture)
		// ============================================================================
		var bar = this;
		bar.stop();
		
		window.UIBus = window.UIBus || new createjs.EventDispatcher();
		
		// เรียกใช้ฟังก์ชันจัดการ EditorBar จากโมดูล .js ภายนอก (เช่น panels.js)
		if (window.EditorPanels && window.EditorPanels.initEditorBar) {
		    window.EditorPanels.initEditorBar(bar);
		} else {
		    // Fallback พื้นฐานผูกปุ่มหลัก
		    if (bar.btn_new) {
		        bar.btn_new.cursor = "pointer";
		        bar.btn_new.on("click", function(e) { e.stopPropagation(); window.UIBus.dispatchEvent({ type: "UI_TOGGLE_CONFIRM_PANEL", panelName: "panel_new" }); });
		    }
		    if (bar.btn_import) {
		        bar.btn_import.cursor = "pointer";
		        bar.btn_import.on("click", function(e) { e.stopPropagation(); window.UIBus.dispatchEvent({ type: "UI_TOGGLE_CONFIRM_PANEL", panelName: "panel_import" }); });
		    }
		    if (bar.btn_export) {
		        bar.btn_export.cursor = "pointer";
		        bar.btn_export.on("click", function(e) { e.stopPropagation(); window.UIBus.dispatchEvent({ type: "UI_TOGGLE_CONFIRM_PANEL", panelName: "panel_export" }); });
		    }
		}
	}

	// actions tween:
	this.timeline.addTween(cjs.Tween.get(this).call(this.frame_0).wait(1));

	// panel_export
	this.panel_export = new lib.panel_export();
	this.panel_export.name = "panel_export";
	this.panel_export.setTransform(6.1,308.45,1,1,0,0,0,20.4,14);

	this.timeline.addTween(cjs.Tween.get(this.panel_export).wait(1));

	// panel_import
	this.panel_import = new lib.panel_import();
	this.panel_import.name = "panel_import";
	this.panel_import.setTransform(6.4,308.65,1,1,0,0,0,20.4,14);

	this.timeline.addTween(cjs.Tween.get(this.panel_import).wait(1));

	// panel_new
	this.panel_new = new lib.panel_new();
	this.panel_new.name = "panel_new";
	this.panel_new.setTransform(-14.3,294.5);

	this.timeline.addTween(cjs.Tween.get(this.panel_new).wait(1));

	// Layer_4
	this.btn_export = new lib.btn_export();
	this.btn_export.name = "btn_export";
	this.btn_export.setTransform(575.4,-21.2,0.7453,0.7453);
	new cjs.ButtonHelper(this.btn_export, 0, 1, 2);

	this.btn_import = new lib.btn_import();
	this.btn_import.name = "btn_import";
	this.btn_import.setTransform(449.25,-21.2,0.7453,0.7453);
	new cjs.ButtonHelper(this.btn_import, 0, 1, 2);

	this.btn_new = new lib.btn_new();
	this.btn_new.name = "btn_new";
	this.btn_new.setTransform(201.1,-21.2,0.7453,0.7453);
	new cjs.ButtonHelper(this.btn_new, 0, 1, 2);

	this.timeline.addTween(cjs.Tween.get({}).to({state:[{t:this.btn_new},{t:this.btn_import},{t:this.btn_export}]}).wait(1));

	// Layer_3
	this.txt_title = new cjs.Text("untitle_map", "bold 55px 'Browallia New'", "#FFFFFF");
	this.txt_title.name = "txt_title";
	this.txt_title.lineHeight = 74;
	this.txt_title.lineWidth = 375;
	this.txt_title.parent = this;
	this.txt_title.setTransform(-630.55,-54.15);

	this.timeline.addTween(cjs.Tween.get(this.txt_title).wait(1));

	// Layer_1
	this.shape = new cjs.Shape();
	this.shape.graphics.f("#1A1F2A").s().p("EhlFAEeIAAo7MDKLAAAIAAI7g");
	this.shape.setTransform(0.025,-22.9);

	this.timeline.addTween(cjs.Tween.get(this.shape).wait(1));

	// Layer_5
	this.shape_1 = new cjs.Shape();
	this.shape_1.graphics.lf(["rgba(0,0,0,0.498)","rgba(0,0,0,0)"],[0,1],0,-28.5,0,28.6).s().p("EhlFAEdIAAo6MDKLAAAIAAI6g");
	this.shape_1.setTransform(0.025,30.8);

	this.timeline.addTween(cjs.Tween.get(this.shape_1).wait(1));

	this._renderFirstFrame();

}).prototype = getMCSymbolPrototype(lib.EditorBar, new cjs.Rectangle(-654.3,-72.7,1321.1999999999998,762.6), null);


(lib.BtnEditorPanel = function(mode,startPosition,loop,reversed) {
if (loop == null) { loop = true; }
if (reversed == null) { reversed = false; }
	var props = new Object();
	props.mode = mode;
	props.startPosition = startPosition;
	props.labels = {};
	props.loop = loop;
	props.reversed = reversed;
	cjs.MovieClip.apply(this,[props]);

	this.isSingleFrame = false;
	// timeline functions:
	this.frame_0 = function() {
		if(this.isSingleFrame) {
			return;
		}
		if(this.totalFrames == 1) {
			this.isSingleFrame = true;
		}
		var btn = this;
		btn.cursor = "pointer";
		btn.removeAllEventListeners("click");
		
		btn.on("click", function (evt) {
		    if (evt) evt.stopPropagation();
		
		    // ยิง Event ไปที่ส่วนกลาง Panel จะรับฟังและเปิด/ปิดตัวเอง
		    window.UIBus.dispatchEvent({
		        type: "UI_TOGGLE_RIGHT_PANEL",
		        source: "ExternalToggleButton"
		    });
		});
	}

	// actions tween:
	this.timeline.addTween(cjs.Tween.get(this).call(this.frame_0).wait(1));

	// Layer_1
	this.ExternalToggleButton = new lib.BtnEditorArt();
	this.ExternalToggleButton.name = "ExternalToggleButton";
	this.ExternalToggleButton.setTransform(5.9,0,1,1,0,0,0,0.5,0);
	new cjs.ButtonHelper(this.ExternalToggleButton, 0, 1, 2, false, new lib.BtnEditorArt(), 3);

	this.timeline.addTween(cjs.Tween.get(this.ExternalToggleButton).wait(1));

	// Layer_3
	this.shape = new cjs.Shape();
	this.shape.graphics.f().s("#000000").ss(8,0,0,3).p("AijETQAAguAoikQAriwABgJQAIhDBggzQBZguAyAM");
	this.shape.setTransform(20.1497,-48.5324);

	this.timeline.addTween(cjs.Tween.get(this.shape).wait(1));

	this._renderFirstFrame();

}).prototype = getMCSymbolPrototype(lib.BtnEditorPanel, new cjs.Rectangle(-23.5,-81.5,64.1,118.6), null);


(lib.TrailGroup = function(mode,startPosition,loop,reversed) {
if (loop == null) { loop = true; }
if (reversed == null) { reversed = false; }
	var props = new Object();
	props.mode = mode;
	props.startPosition = startPosition;
	props.labels = {};
	props.loop = loop;
	props.reversed = reversed;
	cjs.MovieClip.apply(this,[props]);

	this.isSingleFrame = false;
	// timeline functions:
	this.frame_0 = function() {
		if(this.isSingleFrame) {
			return;
		}
		if(this.totalFrames == 1) {
			this.isSingleFrame = true;
		}
		// ============================================================================
		// TrailGroup Short Binding (Clean Architecture)
		// เรียกใช้ฟังก์ชันกลางจาก panels.js หรือ mapDoc.js ภายนอก
		// ============================================================================
		var rail = this;
		rail.stop();
		
		// ป้องกัน Event เมาส์ทะลุไปรบกวนฉากแผนที่ด้านหลัง (EditorMapWrap)
		rail.removeAllEventListeners("mousedown");
		rail.on("mousedown", function (evt) {
		    if (evt) evt.stopPropagation();
		});
		
		rail.removeAllEventListeners("pressmove");
		rail.on("pressmove", function (evt) {
		    if (evt) evt.stopPropagation();
		});
		
		// เรียกใช้ฟังก์ชันกลางจากระบบภายนอก (ผ่าน Global Controller)
		if (window.EditorPanels && window.EditorPanels.initTrailGroup) {
		    window.EditorPanels.initTrailGroup(rail);
		} else {
		    console.warn("[TrailGroup] ยังไม่พบ window.EditorPanels.initTrailGroup กรุณาตรวจสอบไฟล์ .js ภายนอก");
		}
	}

	// actions tween:
	this.timeline.addTween(cjs.Tween.get(this).call(this.frame_0).wait(1));

	// Layer_10 (mask)
	var mask = new cjs.Shape();
	mask._off = true;
	mask.graphics.p("AvSd6MAAAg7zIelAAMAAAA7zg");
	mask.setTransform(1.1749,167.2753);

	// Layer_7
	this.scrollBar = new lib.scrollBar();
	this.scrollBar.name = "scrollBar";
	this.scrollBar.setTransform(95.45,-20.8,1,8.6951,0,0,0,0.1,-21.7);

	var maskedShapeInstanceList = [this.scrollBar];

	for(var shapedInstanceItr = 0; shapedInstanceItr < maskedShapeInstanceList.length; shapedInstanceItr++) {
		maskedShapeInstanceList[shapedInstanceItr].mask = mask;
	}

	this.timeline.addTween(cjs.Tween.get(this.scrollBar).wait(1));

	// Layer_2
	this.itemTemplate = new lib.TemplateEditorPanel();
	this.itemTemplate.name = "itemTemplate";
	this.itemTemplate.setTransform(1.75,0.35);

	var maskedShapeInstanceList = [this.itemTemplate];

	for(var shapedInstanceItr = 0; shapedInstanceItr < maskedShapeInstanceList.length; shapedInstanceItr++) {
		maskedShapeInstanceList[shapedInstanceItr].mask = mask;
	}

	this.timeline.addTween(cjs.Tween.get(this.itemTemplate).wait(1));

	this._renderFirstFrame();

}).prototype = getMCSymbolPrototype(lib.TrailGroup, new cjs.Rectangle(-89.8,-21.6,186.89999999999998,378.20000000000005), null);


(lib.EditorPanelArt = function(mode,startPosition,loop,reversed) {
if (loop == null) { loop = true; }
if (reversed == null) { reversed = false; }
	var props = new Object();
	props.mode = mode;
	props.startPosition = startPosition;
	props.labels = {};
	props.loop = loop;
	props.reversed = reversed;
	cjs.MovieClip.apply(this,[props]);

	// Layer_3
	this.TabGroup = new lib.TabGroup();
	this.TabGroup.name = "TabGroup";
	this.TabGroup.setTransform(-302.45,-229.25,0.8645,0.8645,0,0,0,-0.1,0);

	this.timeline.addTween(cjs.Tween.get(this.TabGroup).wait(1));

	// Layer_6
	this.TrailGroup = new lib.TrailGroup();
	this.TrailGroup.name = "TrailGroup";
	this.TrailGroup.setTransform(-729.3,-165);

	this.timeline.addTween(cjs.Tween.get(this.TrailGroup).wait(1));

	// Layer_2
	this.editor_settings = new lib.editor_settings();
	this.editor_settings.name = "editor_settings";
	this.editor_settings.setTransform(-340.75,1);

	this.ExternalToggleButton = new lib.BtnEditorPanel();
	this.ExternalToggleButton.name = "ExternalToggleButton";
	this.ExternalToggleButton.setTransform(-877.4,-226.15,0.9053,0.9053,0,0,0,0.5,-0.1);

	this.shape = new cjs.Shape();
	this.shape.graphics.f().s("#FFFFFF").ss(1,1,1).p("EgBBgiXICCAAMAAABEvIiCAAg");
	this.shape.setTransform(-338.7573,1.0228,0.8645,0.8645);

	this.shape_1 = new cjs.Shape();
	this.shape_1.graphics.f("#1A1F2A").s().p("EgBBAiYMAAAhEvICDAAMAAABEvg");
	this.shape_1.setTransform(-338.7573,1.0228,0.8645,0.8645);

	this.shape_2 = new cjs.Shape();
	this.shape_2.graphics.f().s("#FFFFFF").ss(1,1,1).p("A7MmKMA2ZAAAIAAMVMg2ZAAAg");
	this.shape_2.setTransform(-446.2524,-228.6952,2.1967,0.7229);

	this.shape_3 = new cjs.Shape();
	this.shape_3.graphics.f("#1A1F2A").s().p("A7MGLIAAsVMA2ZAAAIAAMVg");
	this.shape_3.setTransform(-446.2524,-228.6952,2.1967,0.7229);

	this.timeline.addTween(cjs.Tween.get({}).to({state:[{t:this.shape_3},{t:this.shape_2},{t:this.shape_1},{t:this.shape},{t:this.ExternalToggleButton},{t:this.editor_settings}]}).wait(1));

	// Layer_4
	this.shape_4 = new cjs.Shape();
	this.shape_4.graphics.f().s("#FFFFFF").ss(1,1,1).p("AvS95IelAAMAAAA7zI+lAAg");
	this.shape_4.setTransform(-728.025,2.525);

	this.shape_5 = new cjs.Shape();
	this.shape_5.graphics.f("#1A1F2A").s().p("AvSd6MAAAg7zIelAAMAAAA7zg");
	this.shape_5.setTransform(-728.025,2.525);

	this.timeline.addTween(cjs.Tween.get({}).to({state:[{t:this.shape_5},{t:this.shape_4}]}).wait(1));

	// Layer_1
	this.shape_6 = new cjs.Shape();
	this.shape_6.graphics.f().s("#000000").ss(2,1,1).p("Eg+NgpdMB8bAAAMAAABS7Mh8bAAAg");
	this.shape_6.setTransform(-451.55,-38.2);

	this.shape_7 = new cjs.Shape();
	this.shape_7.graphics.f("#1A1F2A").s().p("Eg+NApeMAAAhS7MB8bAAAMAAABS7g");
	this.shape_7.setTransform(-451.55,-38.2);

	this.timeline.addTween(cjs.Tween.get({}).to({state:[{t:this.shape_7},{t:this.shape_6}]}).wait(1));

	this._renderFirstFrame();

}).prototype = getMCSymbolPrototype(lib.EditorPanelArt, new cjs.Rectangle(-899.1,-304.5,846.8000000000001,532.7), null);


(lib.EditorPanel = function(mode,startPosition,loop,reversed) {
if (loop == null) { loop = true; }
if (reversed == null) { reversed = false; }
	var props = new Object();
	props.mode = mode;
	props.startPosition = startPosition;
	props.labels = {};
	props.loop = loop;
	props.reversed = reversed;
	cjs.MovieClip.apply(this,[props]);

	// timeline functions:
	this.frame_0 = function() {
		var panel = this;
		window.UIBus = window.UIBus || new createjs.EventDispatcher();
		
		// สถานะการเปิด/ปิดเริ่มต้น
		panel._isPanelOpen = true;
		
		// ============================================================================
		// 1. การควบคุมไทม์ไลน์ (ใน Animate ให้กด F6 สร้าง Keyframe ใส่ this.stop() ที่ Frame 10)
		// ============================================================================
		// สั่งให้หยุดแช่ที่สถานะเปิด (Frame 1) เสมอเมื่อโหลด
		panel.gotoAndStop(0);
		
		// ============================================================================
		// 2. ฟังก์ชันรับฟัง Event การ Toggle จาก UIBus
		// ============================================================================
		panel._handleToggle = function (evt) {
		    panel._isPanelOpen = !panel._isPanelOpen;
		
		    if (!panel._isPanelOpen) {
		        // สั่งเล่นอนิเมชันขาปิด (Frame 2 -> Frame 10)
		        panel.gotoAndPlay(1);
		    } else {
		        // สั่งเล่นอนิเมชันขาเปิด (Frame 11 -> Frame 20)
		        panel.gotoAndPlay(10);
		    }
		};
		
		// เคลียร์ Event เก่ากันซ้ำซ้อน แล้วผูก Event เข้ากับ UIBus
		window.UIBus.off("UI_TOGGLE_RIGHT_PANEL", panel._handleToggle);
		window.UIBus.on("UI_TOGGLE_RIGHT_PANEL", panel._handleToggle);
		
		// ============================================================================
		// 3. ผูกปุ่มกด Toggle ภายใน Panel (ถ้ามีปุ่มอยู่ใน Symbol นี้)
		// ============================================================================
		if (panel.btn_toggle) {
		    panel.btn_toggle.cursor = "pointer";
		    panel.btn_toggle.removeAllEventListeners("click");
		    panel.btn_toggle.on("click", function (evt) {
		        if (evt) evt.stopPropagation();
		        window.UIBus.dispatchEvent({ type: "UI_TOGGLE_RIGHT_PANEL" });
		    });
		}
	}
	this.frame_9 = function() {
		this.stop();
	}
	this.frame_19 = function() {
		this.stop();
	}

	// actions tween:
	this.timeline.addTween(cjs.Tween.get(this).call(this.frame_0).wait(9).call(this.frame_9).wait(10).call(this.frame_19).wait(1));

	// Layer_2
	this.instance = new lib.EditorPanelArt();
	this.instance.setTransform(120.65,23.3);

	this.timeline.addTween(cjs.Tween.get(this.instance).to({x:-639.1},9,cjs.Ease.quadOut).to({x:120.65},10,cjs.Ease.backOut).wait(1));

	this._renderFirstFrame();

}).prototype = p = new cjs.MovieClip();
p.nominalBounds = new cjs.Rectangle(-1538.2,-281.2,1681.9,532.7);


// stage content:
(lib.Editor = function(mode,startPosition,loop,reversed) {
if (loop == null) { loop = true; }
if (reversed == null) { reversed = false; }
	var props = new Object();
	props.mode = mode;
	props.startPosition = startPosition;
	props.labels = {};
	props.loop = loop;
	props.reversed = reversed;
	cjs.MovieClip.apply(this,[props]);

	this.actionFrames = [0,1];
	// timeline functions:
	this.frame_0 = function() {
		var root = this;
		root.stop();
		
		window.UIBus = window.UIBus || new createjs.EventDispatcher();
		window.EditorData = window.EditorData || { doc: null };
		
		if (window.UIAnchor && window.lib && window.lib.properties) {
		    UIAnchor.base = lib.properties;
		}
		var bg = root.Color || root.BgScreen || root.bg;
		if (bg && window.UIAnchor) {
		    bg.mouseEnabled = false;
		    UIAnchor.fill(bg);
		}
		if (root.CardCreate && window.UIAnchor) {
		    UIAnchor.attach(root.CardCreate, "CENTER");
		}
		if (window.UIScreen) window.UIScreen.apply();
		
		window.UIBus.off("MAP_DATA_READY", root._onMapDataReady);
		root._onMapDataReady = function (evt) {
		    if (window.UIInput && window.UIInput.commit) {
		        window.UIInput.commit(true);
		    }
		    root.gotoAndStop(1); // Frame 2
		};
		window.UIBus.on("MAP_DATA_READY", root._onMapDataReady);
	}
	this.frame_1 = function() {
		// ============================================================================
		// Main Timeline Frame 2 Short Binding (Clean Architecture)
		// ============================================================================
		var root = this;
		root.stop();
		
		window.UIBus = window.UIBus || new createjs.EventDispatcher();
		window.EditorData = window.EditorData || { doc: null };
		
		// เรียกใช้ฟังก์ชันจัดการ Workspace และ UIAnchor จากโมดูล .js ภายนอก
		if (window.EditorMain && window.EditorMain.initWorkspace) {
		    window.EditorMain.initWorkspace(root);
		} else {
		    // Fallback พื้นฐานถ้ายังไม่โหลดโมดูลภายนอก
		    if (window.UIAnchor) {
		        if (root.EditorBar) window.UIAnchor.attach(root.EditorBar, "TOP_CENTER");
		        if (root.EditorPanel) window.UIAnchor.attach(root.EditorPanel, "MIDDLE_RIGHT");
		        if (root.EditorMapTools) window.UIAnchor.attach(root.EditorMapTools, "BOTTOM_CENTER");
		        if (root.editor_map_wrap || root.EditorMapWrap) {
		            window.UIAnchor.attach(root.editor_map_wrap || root.EditorMapWrap, "CENTER");
		        }
		        window.UIAnchor.updateAll();
		    }
		    window.UIBus.dispatchEvent({ type: "EDITOR_MOUNTED", doc: window.EditorData.doc });
		}
	}

	// actions tween:
	this.timeline.addTween(cjs.Tween.get(this).call(this.frame_0).wait(1).call(this.frame_1).wait(1));

	// Layer_5
	this.EditorBar = new lib.EditorBar();
	this.EditorBar.name = "EditorBar";
	this.EditorBar.setTransform(640.8,47.35);
	this.EditorBar._off = true;

	this.timeline.addTween(cjs.Tween.get(this.EditorBar).wait(1).to({_off:false},0).wait(1));

	// Layer_1
	this.CardCreate = new lib.Frame1();
	this.CardCreate.name = "CardCreate";
	this.CardCreate.setTransform(663.45,388.3);

	this.EditorPanel = new lib.EditorPanel();
	this.EditorPanel.name = "EditorPanel";
	this.EditorPanel.setTransform(1990.75,376.05);

	this.timeline.addTween(cjs.Tween.get({}).to({state:[{t:this.CardCreate}]}).to({state:[{t:this.EditorPanel}]},1).wait(1));

	// Layer_3
	this.BgScreen = new lib.FillColor();
	this.BgScreen.name = "BgScreen";
	this.BgScreen.setTransform(646.4,377.6);

	this.EditorMapWrap = new lib.editor_map_wrap();
	this.EditorMapWrap.name = "EditorMapWrap";
	this.EditorMapWrap.setTransform(639.7,370.15);

	this.timeline.addTween(cjs.Tween.get({}).to({state:[{t:this.BgScreen}]}).to({state:[{t:this.EditorMapWrap}]},1).wait(1));

	this._renderFirstFrame();

}).prototype = p = new lib.AnMovieClip();
p.nominalBounds = new cjs.Rectangle(233.2,19.6,1825.8999999999999,1029.3000000000002);
// library properties:
lib.properties = {
	id: '9ABDDA99C9EE9E48A87522F4E82DD46C',
	width: 1280,
	height: 720,
	fps: 30,
	color: "#FFFFFF",
	opacity: 1.00,
	manifest: [],
	preloads: []
};



// bootstrap callback support:

(lib.Stage = function(canvas) {
	createjs.Stage.call(this, canvas);
}).prototype = p = new createjs.Stage();

p.setAutoPlay = function(autoPlay) {
	this.tickEnabled = autoPlay;
}
p.play = function() { this.tickEnabled = true; this.getChildAt(0).gotoAndPlay(this.getTimelinePosition()) }
p.stop = function(ms) { if(ms) this.seek(ms); this.tickEnabled = false; }
p.seek = function(ms) { this.tickEnabled = true; this.getChildAt(0).gotoAndStop(lib.properties.fps * ms / 1000); }
p.getDuration = function() { return this.getChildAt(0).totalFrames / lib.properties.fps * 1000; }

p.getTimelinePosition = function() { return this.getChildAt(0).currentFrame / lib.properties.fps * 1000; }

an.bootcompsLoaded = an.bootcompsLoaded || [];
if(!an.bootstrapListeners) {
	an.bootstrapListeners=[];
}

an.bootstrapCallback=function(fnCallback) {
	an.bootstrapListeners.push(fnCallback);
	if(an.bootcompsLoaded.length > 0) {
		for(var i=0; i<an.bootcompsLoaded.length; ++i) {
			fnCallback(an.bootcompsLoaded[i]);
		}
	}
};

an.compositions = an.compositions || {};
an.compositions['9ABDDA99C9EE9E48A87522F4E82DD46C'] = {
	getStage: function() { return exportRoot.stage; },
	getLibrary: function() { return lib; },
	getSpriteSheet: function() { return ss; },
	getImages: function() { return img; }
};

an.compositionLoaded = function(id) {
	an.bootcompsLoaded.push(id);
	for(var j=0; j<an.bootstrapListeners.length; j++) {
		an.bootstrapListeners[j](id);
	}
}

an.getComposition = function(id) {
	return an.compositions[id];
}


an.makeResponsive = function(isResp, respDim, isScale, scaleType, domContainers) {		
	var lastW, lastH, lastS=1;		
	window.addEventListener('resize', resizeCanvas);		
	resizeCanvas();		
	function resizeCanvas() {			
		var w = lib.properties.width, h = lib.properties.height;			
		var iw = window.innerWidth, ih=window.innerHeight;			
		var pRatio = window.devicePixelRatio || 1, xRatio=iw/w, yRatio=ih/h, sRatio=1;			
		if(isResp) {                
			if((respDim=='width'&&lastW==iw) || (respDim=='height'&&lastH==ih)) {                    
				sRatio = lastS;                
			}				
			else if(!isScale) {					
				if(iw<w || ih<h)						
					sRatio = Math.min(xRatio, yRatio);				
			}				
			else if(scaleType==1) {					
				sRatio = Math.min(xRatio, yRatio);				
			}				
			else if(scaleType==2) {					
				sRatio = Math.max(xRatio, yRatio);				
			}			
		}
		domContainers[0].width = w * pRatio * sRatio;			
		domContainers[0].height = h * pRatio * sRatio;
		domContainers.forEach(function(container) {				
			container.style.width = w * sRatio + 'px';				
			container.style.height = h * sRatio + 'px';			
		});
		stage.scaleX = pRatio*sRatio;			
		stage.scaleY = pRatio*sRatio;
		lastW = iw; lastH = ih; lastS = sRatio;            
		stage.tickOnUpdate = false;            
		stage.update();            
		stage.tickOnUpdate = true;		
	}
}
an.handleSoundStreamOnTick = function(event) {
	if(!event.paused){
		var stageChild = stage.getChildAt(0);
		if(!stageChild.paused || stageChild.ignorePause){
			stageChild.syncStreamSounds();
		}
	}
}


})(createjs = createjs||{}, AdobeAn = AdobeAn||{});
var createjs, AdobeAn;