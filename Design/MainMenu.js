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


(lib.Ui_3 = function(mode,startPosition,loop,reversed) {
if (loop == null) { loop = true; }
if (reversed == null) { reversed = false; }
	var props = new Object();
	props.mode = mode;
	props.startPosition = startPosition;
	props.labels = {};
	props.loop = loop;
	props.reversed = reversed;
	cjs.MovieClip.apply(this,[props]);

	// Layer_7
	this.shape = new cjs.Shape();
	this.shape.graphics.f("rgba(255,191,184,0.247)").s().p("AxKN+ICriqIKRAAIirCqgAXxrOIhEAAICuiwIA0AAIAATFIieCegA6Nt+IHOAAIivCwIhsAAIAABsIizCzgAmjrOIA/g/IOnAAIg/A/g");
	this.shape.setTransform(0.35,54.2);

	this.timeline.addTween(cjs.Tween.get(this.shape).to({_off:true},1).wait(4));

	// Layer_2
	this.shape_1 = new cjs.Shape();
	this.shape_1.graphics.f().s("#101820").ss(3,0,0,3).p("Ax3lBMAjvAAAIAAKDMgjvAAAg");
	this.shape_1.setTransform(0.373,-48.95,1.0656,0.7726);

	this.shape_2 = new cjs.Shape();
	this.shape_2.graphics.f("#34120D").s().p("Ax3FBIAAqBMAjuAAAIAAKBg");
	this.shape_2.setTransform(0.373,-48.95,1.0656,0.7726);

	this.timeline.addTween(cjs.Tween.get({}).to({state:[{t:this.shape_2},{t:this.shape_1}]}).to({state:[]},1).wait(4));

	// Layer_5
	this.shape_3 = new cjs.Shape();
	this.shape_3.graphics.f().s("#333333").ss(1,1,1).p("A3lrRMAvLAAAIAAWjMgvLAAAg");
	this.shape_3.setTransform(1.45,54.425);

	this.shape_4 = new cjs.Shape();
	this.shape_4.graphics.f().s("#101820").ss(3,0,0,3).p("A6ON/IAA79MA0dAAAIAAb9g");
	this.shape_4.setTransform(0.35,54.2);

	this.shape_5 = new cjs.Shape();
	this.shape_5.graphics.f("#101820").s().p("A3lLSIAA2jMAvLAAAIAAWjg");
	this.shape_5.setTransform(1.45,54.425);

	this.shape_6 = new cjs.Shape();
	this.shape_6.graphics.f("#6F2219").s().p("A6NN+IAA78MA0cAAAIAAb8gA3aLUMAvLAAAIAA2iMgvLAAAg");
	this.shape_6.setTransform(0.35,54.2);

	this.shape_7 = new cjs.Shape();
	this.shape_7.graphics.f("#FFFFFF").s().p("AhRBaQgFgEAAgHIABgOIABgOIAAgVIAAgVIAAgVIAAgXIgCgUIgBgVQAAgHAGgGQAGgGAIAAQAIAAALAPQA0BMA0AvIAAgRQAAg5gBgUIgCgNIgBgNQAAgQARAAQATAAAAA7IAAASIAABJIgCATQgDAPgPAAQgIAAgKgJQgtgpg4hIIgBAkIABAcIAAAcQAAAjgRAAQgIAAgFgGg");
	this.shape_7.setTransform(-56.125,-65.525);

	this.shape_8 = new cjs.Shape();
	this.shape_8.graphics.f("#FFFFFF").s().p("Ag3BVQgEgFAAgGQAAgGAEgGQAGgEAHAAQAJAAANgCIAAg1QAAgeACgdIgZAAQgHAAgFgFQgEgEAAgHQgBgGAFgFQAFgEAFgBIAjgBQAVABAkAFQAOACgBAOQAAAHgFAEQgFAEgFAAIgfgEQgBAXAAAiIAAA0IAfAAQAIABAEAEQAEAFAAAGQAAAHgEAEQgFAFgHAAIgVABIgTAAIgXABIgYACQgHABgFgFg");
	this.shape_8.setTransform(-72.55,-65.45);

	this.shape_9 = new cjs.Shape();
	this.shape_9.graphics.f("#FFFFFF").s().p("Ag8BZQgEgGAAgHIAChNIABhOQABgHAEgEQAFgFAHAAQAHAAAEAFQAFAEAAAHIgBAcIgBAdIA7hBQAGgGAHAAQAHAAAEAEQAFAFABAHQAAAHgdAfQgUAWgWAVIAYAYQAQAOALAJQAGAEAIACQAMAEAAALQAAAGgDAEQgEAHgIAAQgRAAgagWQgIgHgdgdIAAAyQgBAFgDAEQgDAGgIAAQgJAAgGgHg");
	this.shape_9.setTransform(-85.9,-65.225);

	this.shape_10 = new cjs.Shape();
	this.shape_10.graphics.f("#FFFFFF").s().p("Ag+BMQgPgLAAgOQAAgHAFgFQAEgFAIAAQAKAAAGALQAGAOAXAAQATAAATgJQAUgIAAgMQAAgOgMgFQgIgDgagBQgUgBgQgGQgWgJABgTQAAgWAYgTQAYgUAcABQAMgBAQAGQAVAGAAAJQAAAGgEAFQgFAFgHAAQgGAAgLgDIgQgCQgPAAgNAHQgOAIAAAJQAAAEAEADQAFACAIACIAdABQAaACAPANQARANAAAZQAAAegiAQQgbAMggAAQgeAAgRgOg");
	this.shape_10.setTransform(-101.95,-65.15);

	this.timeline.addTween(cjs.Tween.get({}).to({state:[{t:this.shape_6},{t:this.shape_5},{t:this.shape_4},{t:this.shape_3}]}).to({state:[]},1).to({state:[{t:this.shape_10},{t:this.shape_9},{t:this.shape_8},{t:this.shape_7}]},1).to({state:[]},1).wait(2));

	// Layer_8
	this.shape_11 = new cjs.Shape();
	this.shape_11.graphics.f().s("#101820").ss(3,1,1).p("Ailg6IFLAAIAAB1IlLAAg");
	this.shape_11.setTransform(-184.6931,5.85,1.0351,1);

	this.shape_12 = new cjs.Shape();
	this.shape_12.graphics.f("#E85D4C").s().p("AilA7IAAh0IFLAAIAAB0g");
	this.shape_12.setTransform(-184.6931,5.85,1.0351,1);

	this.shape_13 = new cjs.Shape();
	this.shape_13.graphics.f().s("#101820").ss(3,1,1).p("Ailg6IFLAAIAAB1IlLAAg");
	this.shape_13.setTransform(181.4569,103.05,1.0351,1);

	this.shape_14 = new cjs.Shape();
	this.shape_14.graphics.f("#E85D4C").s().p("AilA7IAAh0IFLAAIAAB0g");
	this.shape_14.setTransform(181.4569,103.05,1.0351,1);

	this.shape_15 = new cjs.Shape();
	this.shape_15.graphics.f().s("#101820").ss(3,1,1).p("Ailg6IFLAAIAAB1IlLAAg");
	this.shape_15.setTransform(181.4569,37.3,1.0351,1);

	this.shape_16 = new cjs.Shape();
	this.shape_16.graphics.f("#E85D4C").s().p("AilA7IAAh0IFLAAIAAB0g");
	this.shape_16.setTransform(181.4569,37.3,1.0351,1);

	this.shape_17 = new cjs.Shape();
	this.shape_17.graphics.f().s("#101820").ss(3,1,1).p("Ailg6IFLAAIAAB1IlLAAg");
	this.shape_17.setTransform(181.4569,-18.25,1.0351,1);

	this.shape_18 = new cjs.Shape();
	this.shape_18.graphics.f("#E85D4C").s().p("AilA7IAAh0IFLAAIAAB0g");
	this.shape_18.setTransform(181.4569,-18.25,1.0351,1);

	this.shape_19 = new cjs.Shape();
	this.shape_19.graphics.f("#101820").s().p("AgSAnQgGgGAAgJIAKABQACAKAMAAIAHgBQAEgCACgCQACgCAAgEQABgDAAgKQgHAIgJAAQgIAAgFgEQgGgEgEgGQgDgHAAgJQAAgPAHgIQAHgJAMABQAKAAAHAJIAAgIIAKAAIAAA0QAAALgCAFQgCAGgDADQgEAEgFACQgFACgGgBQgMAAgGgEgAgLgcQgEAHAAAJQAAAXAPAAQAIgBAFgFQAEgGAAgKQAAgKgFgHQgEgGgIAAQgHAAgEAGg");
	this.shape_19.setTransform(92.075,169.1);

	this.shape_20 = new cjs.Shape();
	this.shape_20.graphics.f("#101820").s().p("AAPAfIAAgkQAAgQgNAAQgPAAAAAUIAAAgIgLAAIAAg8IAKAAIAAAJQAGgKAMAAQAVAAAAAWIAAAng");
	this.shape_20.setTransform(85.675,167.875);

	this.shape_21 = new cjs.Shape();
	this.shape_21.graphics.f("#101820").s().p("AgEAqIAAg8IAJAAIAAA8gAgEgeIAAgLIAJAAIAAALg");
	this.shape_21.setTransform(81.125,166.8);

	this.shape_22 = new cjs.Shape();
	this.shape_22.graphics.f("#101820").s().p("AAPAqIAAgnQAAgNgOAAQgEAAgEADQgEACgBAFQgCACAAAHIAAAhIgKAAIAAhTIAKAAIAAAeQAIgJAKABQAIAAAFADQAFADACAFQABAFAAAGIAAAng");
	this.shape_22.setTransform(76.55,166.8);

	this.shape_23 = new cjs.Shape();
	this.shape_23.graphics.f("#101820").s().p("AgFAqIAAhJIgcAAIAAgKIBDAAIAAAKIgcAAIAABJg");
	this.shape_23.setTransform(69.7,166.8);

	this.shape_24 = new cjs.Shape();
	this.shape_24.graphics.f("#101820").s().p("AAQAfIgQgZIgPAZIgMAAIAVgfIgUgeIANAAIAJAPIAEAHIAEgHIAKgPIANAAIgWAdIAXAgg");
	this.shape_24.setTransform(59.25,167.95);

	this.shape_25 = new cjs.Shape();
	this.shape_25.graphics.f("#101820").s().p("AgEAqIAAg8IAJAAIAAA8gAgEgeIAAgLIAJAAIAAALg");
	this.shape_25.setTransform(54.975,166.8);

	this.shape_26 = new cjs.Shape();
	this.shape_26.graphics.f("#101820").s().p("AgcAqIAAhTIA5AAIAAAKIguAAIAAAaIAnAAIAAAJIgnAAIAAAmg");
	this.shape_26.setTransform(50.3,166.8);

	this.shape_27 = new cjs.Shape();
	this.shape_27.graphics.f("#101820").s().p("AgEAcIAAgXIgXAAIAAgJIAXAAIAAgXIAJAAIAAAXIAXAAIAAAJIgXAAIAAAXg");
	this.shape_27.setTransform(43.075,166.875);

	this.shape_28 = new cjs.Shape();
	this.shape_28.graphics.f("#101820").s().p("AgSAmQgGgFAAgJIAKABQACAKAMAAIAHgBQAEgCACgCQACgCAAgEQABgDAAgKQgHAIgJAAQgIAAgFgEQgGgEgEgGQgDgHAAgJQAAgPAHgIQAHgJAMAAQAKABAHAIIAAgHIAKAAIAAAzQAAANgCAEQgCAGgDADQgEAEgFACQgFABgGAAQgMABgGgGgAgLgbQgEAGAAAKQAAAVAPAAQAIAAAFgFQAEgGAAgKQAAgKgFgGQgEgHgIAAQgHAAgEAHg");
	this.shape_28.setTransform(100.025,144.6);

	this.shape_29 = new cjs.Shape();
	this.shape_29.graphics.f("#101820").s().p("AAPAfIAAgkQAAgQgNAAQgPAAAAAUIAAAgIgLAAIAAg8IAKAAIAAAJQAGgKAMAAQAVAAAAAWIAAAng");
	this.shape_29.setTransform(93.625,143.375);

	this.shape_30 = new cjs.Shape();
	this.shape_30.graphics.f("#101820").s().p("AgEAqIAAg8IAJAAIAAA8gAgEgeIAAgLIAJAAIAAALg");
	this.shape_30.setTransform(89.075,142.3);

	this.shape_31 = new cjs.Shape();
	this.shape_31.graphics.f("#101820").s().p("AAOAqIAAgnQABgOgNAAQgFAAgEAEQgEACgBAEQgCAEABAGIAAAhIgLAAIAAhTIALAAIAAAeQAHgJAKAAQAIAAAFAEQAEADACAFQACAFAAAGIAAAng");
	this.shape_31.setTransform(84.5,142.3);

	this.shape_32 = new cjs.Shape();
	this.shape_32.graphics.f("#101820").s().p("AgEAqIAAhJIgcAAIAAgKIBBAAIAAAKIgbAAIAABJg");
	this.shape_32.setTransform(77.65,142.3);

	this.shape_33 = new cjs.Shape();
	this.shape_33.graphics.f("#101820").s().p("AAMAfIgMguIgLAuIgLAAIgTg9IALAAIANAwIADgMIAKgkIAKAAIAMAuIAOguIAKAAIgTA9g");
	this.shape_33.setTransform(65.775,143.45);

	this.shape_34 = new cjs.Shape();
	this.shape_34.graphics.f("#101820").s().p("AgOAcQgGgDgEgIQgDgGAAgLQAAgOAHgIQAIgJANAAIAFABIAFABIAEACIAEADIADAEIADAFIACAFIABAHIAAAGIgsAAQAAAJAFAGQAFAFAHABQAMAAAEgNIALABQgGAUgVAAQgIAAgHgEgAgHgUQgEACgCAEQgDAEAAAFIAhAAQgBgIgFgFQgEgFgGABQgEgBgEADg");
	this.shape_34.setTransform(58.25,143.45);

	this.shape_35 = new cjs.Shape();
	this.shape_35.graphics.f("#101820").s().p("AAWAqIgshBIAABBIgKAAIAAhTIALAAIArBBIAAhBIALAAIAABTg");
	this.shape_35.setTransform(50.7,142.3);

	this.shape_36 = new cjs.Shape();
	this.shape_36.graphics.f("#101820").s().p("AgEAcIAAgXIgXAAIAAgJIAXAAIAAgXIAJAAIAAAXIAXAAIAAAJIgXAAIAAAXg");
	this.shape_36.setTransform(43.075,142.375);

	this.shape_37 = new cjs.Shape();
	this.shape_37.graphics.f("#101820").s().p("AgPAcQgFgDgEgIQgDgHAAgKQgBgPAJgIQAHgIAMAAQAIAAAGADQAGAEAFAGQADAIAAAKQAAAQgIAIQgIAIgMAAQgIAAgHgEgAgMgQQgFAHAAAJQAAAHACAGQACAFAFACQADAEAFAAQAIgBAGgGQAEgHAAgKQAAgKgFgGQgFgHgIABQgIAAgEAGg");
	this.shape_37.setTransform(100.85,118.95);

	this.shape_38 = new cjs.Shape();
	this.shape_38.graphics.f("#101820").s().p("AgEAqIAAg8IAJAAIAAA8gAgEgdIAAgMIAJAAIAAAMg");
	this.shape_38.setTransform(96.275,117.8);

	this.shape_39 = new cjs.Shape();
	this.shape_39.graphics.f("#101820").s().p("AgTAiQgHgKAAgNQABgKADgGQADgIAGgDQAGgEAHAAQAKAAAGAIIAAgeIAKAAIAABTIgJAAIAAgHQgGAJgLAAQgLAAgIgJgAgPALQAAAHACAFQACAFAEADQAEADADAAQAIAAAFgGQAEgGAAgKQAAgMgEgFQgFgHgIAAQgPAAAAAXg");
	this.shape_39.setTransform(91.5,117.875);

	this.shape_40 = new cjs.Shape();
	this.shape_40.graphics.f("#101820").s().p("AgNAeQgEgCgCgDQgDgDgBgEIgBgLIAAglIALAAIAAAhIAAAKIACAFIAEADIAGABQAFAAAEgDQAEgCABgFIABgLIAAgfIALAAIAAA8IgKAAIAAgJQgHAKgLAAQgGAAgEgBg");
	this.shape_40.setTransform(85.125,119.025);

	this.shape_41 = new cjs.Shape();
	this.shape_41.graphics.f("#101820").s().p("AAbAqIgKgaIgiAAIgKAaIgLAAIAghTIALAAIAiBTgAgFgQIgJAXIAbAAIgIgWIgFgRIgFAQg");
	this.shape_41.setTransform(77.975,117.8);

	this.shape_42 = new cjs.Shape();
	this.shape_42.graphics.f("#101820").s().p("AAMAfIgMgvIgLAvIgLAAIgTg8IALAAIANAvIADgMIAKgjIAKAAIAMAtIAOgtIAKAAIgTA8g");
	this.shape_42.setTransform(65.775,118.95);

	this.shape_43 = new cjs.Shape();
	this.shape_43.graphics.f("#101820").s().p("AgOAcQgGgDgEgIQgDgGAAgLQAAgNAHgJQAIgJANAAIAFABIAFABIAEACIAEADIADAEIADAFIACAGIABAGIAAAFIgsAAQAAAKAFAGQAFAFAHABQAMAAAEgNIALABQgGAUgVAAQgIAAgHgEgAgHgUQgEACgCAEQgDAEAAAFIAhAAQgBgJgFgEQgEgFgGABQgEAAgEACg");
	this.shape_43.setTransform(58.25,118.95);

	this.shape_44 = new cjs.Shape();
	this.shape_44.graphics.f("#101820").s().p("AAWAqIgshBIAABBIgKAAIAAhTIALAAIArBBIAAhBIALAAIAABTg");
	this.shape_44.setTransform(50.7,117.8);

	this.shape_45 = new cjs.Shape();
	this.shape_45.graphics.f("#101820").s().p("AgEAcIAAgXIgXAAIAAgJIAXAAIAAgXIAJAAIAAAXIAXAAIAAAJIgXAAIAAAXg");
	this.shape_45.setTransform(43.075,117.875);

	this.shape_46 = new cjs.Shape();
	this.shape_46.graphics.f("#101820").s().p("AgbACQAAgsAdAAQAHAAAFACQAFADADAFQADAEABAHIgKAAQgCgHgDgDQgEgCgFAAQgIgBgFAJQgFAHgBARQAIgLAMAAQAHAAAGAEQAFADADAFQAEAHAAAHQAAANgIAJQgIAHgLAAQgcAAAAgpgAgHAAQgEABgCADQgCAFAAAFQAAAJAFAGQAFAFAGABQAHAAAFgGQAEgGAAgIQAAgGgCgEQgCgFgEAAQgDgDgFAAQgEAAgEADg");
	this.shape_46.setTransform(175.825,93.35);

	this.shape_47 = new cjs.Shape();
	this.shape_47.graphics.f("#101820").s().p("AgbAqQAAgHAFgHQAFgIAMgJIAMgLIAHgJQADgFAAgEQAAgEgCgEQgCgDgEgCQgDgCgFAAQgHAAgEAFQgEAEAAAIIgLgBQACgYAYAAQAMAAAHAGQAIAHAAAKQAAAGgEAIQgEAGgRAOIgKAJIgGAHIApAAIAAAKg");
	this.shape_47.setTransform(169.175,93.275);

	this.shape_48 = new cjs.Shape();
	this.shape_48.graphics.f("#101820").s().p("AgaAAQgBgqAbAAQAbAAABAqQgBArgbAAQgbAAABgrgAgQAAQAAAjAQAAQARAAAAgjQAAghgRAAQgQAAAAAhg");
	this.shape_48.setTransform(162.75,93.35);

	this.shape_49 = new cjs.Shape();
	this.shape_49.graphics.f("#101820").s().p("AgbAqQAAgHAFgHQAFgIAMgJIAMgLIAHgJQADgFAAgEQAAgEgCgEQgCgDgEgCQgDgCgFAAQgHAAgEAFQgEAEAAAIIgLgBQACgYAYAAQAMAAAHAGQAIAHAAAKQAAAGgEAIQgEAGgRAOIgKAJIgGAHIApAAIAAAKg");
	this.shape_49.setTransform(156.075,93.275);

	this.shape_50 = new cjs.Shape();
	this.shape_50.graphics.f("#101820").s().p("AgPAsIAXhXIAIAAIgXBXg");
	this.shape_50.setTransform(151.325,93.3);

	this.shape_51 = new cjs.Shape();
	this.shape_51.graphics.f("#101820").s().p("AgbAAQABgqAaAAQAcAAgBAqQABArgcAAQgaAAgBgrgAgQAAQAAAjAQAAQAQAAABgjQgBghgQAAQgQAAAAAhg");
	this.shape_51.setTransform(146.4,93.35);

	this.shape_52 = new cjs.Shape();
	this.shape_52.graphics.f("#101820").s().p("AAFAqIAAhBQgIAIgMAFIAAgKQASgJAGgMIAHAAIAABTg");
	this.shape_52.setTransform(139.45,93.275);

	this.shape_53 = new cjs.Shape();
	this.shape_53.graphics.f("#101820").s().p("AgPAsIAXhXIAIAAIgXBXg");
	this.shape_53.setTransform(134.975,93.3);

	this.shape_54 = new cjs.Shape();
	this.shape_54.graphics.f("#101820").s().p("AgSAkQgIgGgBgLIALgBQACAQAOAAQAEAAAEgCQADgDADgEQADgFAAgHQAAgIgFgFQgFgFgHAAQgKAAgFAHIgKgBIAIgqIApAAIAAAKIghAAIgEAWQAIgFAHAAQAHAAAGAEQAGADADAGQAEAFAAAIQAAAJgEAHQgEAHgGAEQgHADgHAAQgLAAgHgGg");
	this.shape_54.setTransform(130.075,93.425);

	this.shape_55 = new cjs.Shape();
	this.shape_55.graphics.f("#101820").s().p("AgbAqQAAgHAFgHQAFgIAMgJIAMgLIAHgJQADgFAAgEQAAgEgCgEQgCgDgEgCQgDgCgFAAQgHAAgEAFQgEAEAAAIIgLgBQACgYAYAAQAMAAAHAGQAIAHAAAKQAAAGgEAIQgEAGgRAOIgKAJIgGAHIApAAIAAAKg");
	this.shape_55.setTransform(123.375,93.275);

	this.shape_56 = new cjs.Shape();
	this.shape_56.graphics.f("#101820").s().p("AgeAqIAAhTIA7AAIAAAKIgwAAIAAAZIAtAAIAAAKIgtAAIAAAcIAyAAIAAAKg");
	this.shape_56.setTransform(112.475,93.3);

	this.shape_57 = new cjs.Shape();
	this.shape_57.graphics.f("#101820").s().p("AgFAqIAAhJIgcAAIAAgKIBDAAIAAAKIgcAAIAABJg");
	this.shape_57.setTransform(104.8,93.3);

	this.shape_58 = new cjs.Shape();
	this.shape_58.graphics.f("#101820").s().p("AAbAqIgKgaIgiAAIgKAaIgLAAIAghTIALAAIAiBTgAgFgQIgJAXIAbAAIgIgWIgFgRIgFAQg");
	this.shape_58.setTransform(97.275,93.3);

	this.shape_59 = new cjs.Shape();
	this.shape_59.graphics.f("#101820").s().p("AgiAqIAAhTIAdAAIAOABQAGABAGAFQAGAEAEAKQAEAIAAAMQAAATgJALQgJAMgUAAgAgXAgIASAAQAKAAAGgDQAGgEADgHQADgIAAgKQAAgHgBgGQgCgGgDgEQgDgEgFgCQgEgCgKAAIgSAAg");
	this.shape_59.setTransform(89.225,93.3);

	this.shape_60 = new cjs.Shape();
	this.shape_60.graphics.f("#101820").s().p("AgfAqIAAhTIAfAAIAMABQAFABAFACQAEADADAFQADAGAAAGQAAAZggAAIgUAAIAAAigAgUgBIAVAAQAUAAAAgQIgBgGIgDgFQgCgCgDAAIgMgBIgUAAg");
	this.shape_60.setTransform(81.125,93.3);

	this.shape_61 = new cjs.Shape();
	this.shape_61.graphics.f("#101820").s().p("AgYAjQgIgIAAgVIAAgwIALAAIAAAwQAAAKACAEQABAFADACQACADAEABQAEACAFAAQAHAAAFgCQAFgDACgFQADgFAAgMIAAgwIALAAIAAAwQAAAMgCAGQgCAHgFAEQgEAEgGACQgGACgIAAQgPAAgJgIg");
	this.shape_61.setTransform(72.725,93.375);

	this.shape_62 = new cjs.Shape();
	this.shape_62.graphics.f("#101820").s().p("AgNApQgIgEgFgFQgFgGgDgIQgEgIAAgKQAAgSALgMQALgNAUAAQAcAAAGAZIgKADQgFgSgTAAQgOAAgIAJQgIAJAAAPQAAARAJAIQAJAJAMAAQAOAAAKgJIAAgQIgYAAIAAgJIAjAAIAAAfQgQANgTAAQgJAAgIgDg");
	this.shape_62.setTransform(59.85,93.3);

	this.shape_63 = new cjs.Shape();
	this.shape_63.graphics.f("#101820").s().p("AgUAmQgJgGgFgJQgFgKAAgMQAAgLAEgKQAFgLAJgGQAJgFAMgBQAJAAAHAEQAIACAFAHQAFAFADAIQADAIAAAJQAAAOgEAJQgFAJgKAGQgKAFgLABQgKgBgKgFgAgLgeQgFACgEAEQgEAFgCAHQgCAGAAAHQAAAKAEAHQAEAIAGAEQAGAEAIAAQAOAAAHgJQAIgKAAgPQAAgKgEgHQgDgIgHgEQgGgEgJAAQgGAAgFADg");
	this.shape_63.setTransform(50.775,93.3);

	this.shape_64 = new cjs.Shape();
	this.shape_64.graphics.f("#101820").s().p("AgZAqIAAhTIALAAIAABJIAoAAIAAAKg");
	this.shape_64.setTransform(43.125,93.3);

	this.shape_65 = new cjs.Shape();
	this.shape_65.graphics.f().s("#000000").ss(3,0,0,3).p("ArPjtIWfAAIAAHbI2fAAg");
	this.shape_65.setTransform(-79.3062,-66.1823,0.7102,0.7668);

	this.shape_66 = new cjs.Shape();
	this.shape_66.graphics.f("#34120D").s().p("ArPDuIAAnbIWfAAIAAHbg");
	this.shape_66.setTransform(-79.3062,-66.1823,0.7102,0.7668);

	this.timeline.addTween(cjs.Tween.get({}).to({state:[{t:this.shape_18},{t:this.shape_17},{t:this.shape_16},{t:this.shape_15},{t:this.shape_14},{t:this.shape_13},{t:this.shape_12},{t:this.shape_11}]}).to({state:[{t:this.shape_64},{t:this.shape_63},{t:this.shape_62},{t:this.shape_61},{t:this.shape_60},{t:this.shape_59},{t:this.shape_58},{t:this.shape_57},{t:this.shape_56},{t:this.shape_55},{t:this.shape_54},{t:this.shape_53},{t:this.shape_52},{t:this.shape_51},{t:this.shape_50},{t:this.shape_49},{t:this.shape_48},{t:this.shape_47},{t:this.shape_46},{t:this.shape_45},{t:this.shape_44},{t:this.shape_43},{t:this.shape_42},{t:this.shape_41},{t:this.shape_40},{t:this.shape_39},{t:this.shape_38},{t:this.shape_37},{t:this.shape_36},{t:this.shape_35},{t:this.shape_34},{t:this.shape_33},{t:this.shape_32},{t:this.shape_31},{t:this.shape_30},{t:this.shape_29},{t:this.shape_28},{t:this.shape_27},{t:this.shape_26},{t:this.shape_25},{t:this.shape_24},{t:this.shape_23},{t:this.shape_22},{t:this.shape_21},{t:this.shape_20},{t:this.shape_19}]},1).to({state:[{t:this.shape_66},{t:this.shape_65}]},1).to({state:[]},1).wait(2));

	// Layer_9
	this.shape_67 = new cjs.Shape();
	this.shape_67.graphics.f().s("#000000").ss(3,0,0,3).p("AyJ5zMAkTAAAMAAAAznMgkTAAAgAwU4BMAgnAAAMAAAAwmMggnAAAg");
	this.shape_67.setTransform(135.25,230.8);

	this.shape_68 = new cjs.Shape();
	this.shape_68.graphics.f("#FFD6D1").s().p("AwTYTMAAAgwlMAgnAAAMAAAAwlg");
	this.shape_68.setTransform(135.175,232.575);

	this.shape_69 = new cjs.Shape();
	this.shape_69.graphics.f("#6F2219").s().p("AyJZ0MAAAgznMAkSAAAMAAAAzngAwUYlMAgnAAAMAAAgwmMggnAAAg");
	this.shape_69.setTransform(135.25,230.8);

	this.shape_70 = new cjs.Shape();
	this.shape_70.graphics.f().s("#000000").ss(3,0,0,3).p("EA9dglcMAAABK5Mh65AAAMAAAhK5gEA7ugjuMAAABHbMh3tAAAMAAAhHbg");
	this.shape_70.setTransform(488.375,169.375);

	this.shape_71 = new cjs.Shape();
	this.shape_71.graphics.f("#FFD6D1").s().p("Eg72AjuMAAAhHbMB3tAAAMAAABHbg");
	this.shape_71.setTransform(487.475,169.275);

	this.shape_72 = new cjs.Shape();
	this.shape_72.graphics.f("#6F2219").s().p("Eg9cAldMAAAhK5MB65AAAMAAABK5gEg7/AjtMB3tAAAMAAAhHbMh3tAAAg");
	this.shape_72.setTransform(488.375,169.375);

	this.shape_73 = new cjs.Shape();
	this.shape_73.graphics.f().s("#000000").ss(3,0,0,3).p("Asw72IZgAAMAAAA3/I5gAAgAuM9lIcZAAMAAAA7LI8ZAAg");
	this.shape_73.setTransform(-14.5207,119.425,1.2064,1);

	this.shape_74 = new cjs.Shape();
	this.shape_74.graphics.f("#FFD6D1").s().p("AswcAMAAAg3/IZhAAMAAAA3/g");
	this.shape_74.setTransform(-14.581,120.325,1.2064,1);

	this.shape_75 = new cjs.Shape();
	this.shape_75.graphics.f("#6F2219").s().p("AuMdmMAAAg7LIcYAAMAAAA7LgAswcJIZgAAMAAAg3/I5gAAg");
	this.shape_75.setTransform(-14.5207,119.425,1.2064,1);

	this.timeline.addTween(cjs.Tween.get({}).to({state:[]}).to({state:[{t:this.shape_69},{t:this.shape_68},{t:this.shape_67}]},1).to({state:[{t:this.shape_75},{t:this.shape_74},{t:this.shape_73},{t:this.shape_72},{t:this.shape_71},{t:this.shape_70}]},1).to({state:[]},1).wait(2));

	// Layer_3
	this.shape_76 = new cjs.Shape();
	this.shape_76.graphics.lf(["#E85D4C","rgba(232,93,76,0)"],[0,1],0,133.7,0,-133.7).s().p("A3wU5MgMygpxMBJFAAAMgMyApxg");
	this.shape_76.setTransform(0.575,-121.1);

	this.timeline.addTween(cjs.Tween.get(this.shape_76).to({_off:true},1).wait(4));

	this._renderFirstFrame();

}).prototype = p = new cjs.MovieClip();
p.nominalBounds = new cjs.Rectangle(-233.3,-254.8,1116.5,665.4000000000001);


(lib.Ui_1 = function(mode,startPosition,loop,reversed) {
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
	this.shape.graphics.f("rgba(0,0,0,0.2)").s().p("AkrEsIAApXIJXAAIAAJXg");
	this.shape.setTransform(-0.0208,-0.0208,0.9167,0.9167);
	this.shape._off = true;

	this.timeline.addTween(cjs.Tween.get(this.shape).wait(8).to({_off:false},0).to({_off:true},1).wait(10));

	this._renderFirstFrame();

}).prototype = p = new cjs.MovieClip();
p.nominalBounds = new cjs.Rectangle(-360.6,-320,721.3,543.2);


(lib.TheDDOS_Logo = function(mode,startPosition,loop,reversed) {
if (loop == null) { loop = true; }
if (reversed == null) { reversed = false; }
	var props = new Object();
	props.mode = mode;
	props.startPosition = startPosition;
	props.labels = {};
	props.loop = loop;
	props.reversed = reversed;
	cjs.MovieClip.apply(this,[props]);

	// Layer_4
	this.shape = new cjs.Shape();
	this.shape.graphics.f("#FFFFFF").s().p("AHSFuQgLgFgHAAQgPAAgHASIgJAAIAAh0IAJAAQAIAsAcAcQAZAdAmAAQAVAAARgMQARgMAAgXQAAgRgOgOQgNgOgmgTQg1gZgWgYQgXgXAAgiQAAglAcgaQAbgaAoAAQAUAAAaAMQAaAKAEAAQALAAAFgWIAGAAIADBnIgJAAQgHgkgYgZQgZgZgfAAQgUABgPAJQgQALgBAVQABAQAOANQAOANAvAYQA5AbARAYQAQAYAAAcQAAApgfAaQgdAagtABQgaAAgigOgABcFKQgpgyAAg+QAAgoASgjQAQgjAmgXQAkgXA1AAQAxAAAjASQAkASAWAkQAWAkAAAwQAABCgsAxQgrAuhLABQhRAAgpgygACEDcQAACOBSAAQBQAAAAiLQAAiThQgBQhSAAAACRgAknF0IAAgIIALAAQAKAAAJgDQAIgEADgGQACgGAAgZIAAjKIgBgZQgBgHgIgGQgIgFgOgBIgLAAIAAgJICJAAQBXAAAqAqQAqArAABGQAABKgsAnQgtAnhSAAgAizFDQAAASAFAIQAEAHARAAQBVAAAAiFQAAg0gNggQgNgfgTgNQgUgMguAAgAp2F0IAAgIIALAAQALAAAIgDQAIgEADgGQADgGAAgZIAAjKQAAgSgCgHQgBgHgHgGQgJgFgOgBIgLAAIAAgJICKAAQBWAAArAqQAqArAABGQAABKgsAnQguAnhRAAgAoBFDQABASADAIQAFAHARAAQBUAAAAiFQAAg0gNggQgNgfgTgNQgUgMgtAAgACUiVIAAgGIAIAAQAOAAAGgGQAEgHAAgUIAAiXIgBgTQAAgGgHgDQgFgFgLAAIgIAAIAAgGIDAAAIAABDIgGAAQgGgcgLgKQgLgKgMgDQgMgCgXgBIgXAAIAABeIAEAAQAnAAAFg3IAHAAIAAB4IgHAAQgDgegLgMQgKgLgYAAIAABAQAAAYAFAFQAFAEAZABQA/gBAQg8IAHAAIgKBJgAAPiVIAAgGIAHAAQAPAAAFgGQAFgHAAgUIAAhHIhQAAIAABHIABATQABAFAGAFQAGAEAKAAIAIAAIAAAGIh3AAIAAgGIAHAAQAPAAAFgGQAEgHAAgUIAAiXIgBgTQAAgGgHgDQgFgFgLAAIgHAAIAAgGIB3AAIAAAGIgIAAQgOAAgFAHQgFAGAAAUIAABBIBQAAIAAhBIgBgTQAAgGgHgDQgGgFgLAAIgHAAIAAgGIB3AAIAAAGIgIAAQgPAAgEAHQgFAGAAAUIAACXIABATQABAFAGAFQAGAEAKAAIAIAAIAAAGgAkwiVIAAgGIAIAAQALAAAEgDQAFgEACgEQACgFAAgRIAAixIgQAAQgPABgKADQgKAFgIALQgGAMgDARIgHAAIAAg+IDPAAIAAA+IgGAAQgFgTgKgMQgIgMgIgDQgIgCgPgBIgQAAIAACxIAAATQACAFAFAFQAHAEALAAIAIAAIAAAGg");
	this.shape.setTransform(-0.65,23.25);
	this.shape._off = true;

	this.timeline.addTween(cjs.Tween.get(this.shape).wait(2).to({_off:false},0).wait(1));

	// Layer_2
	this.shape_1 = new cjs.Shape();
	this.shape_1.graphics.f().s("#FFFFFF").ss(9,0,0,3).p("AxMOkIRM8dIRMcdg");
	this.shape_1.setTransform(2.35,-8.05,1,1,0,0,0,2.1,0);
	this.shape_1._off = true;

	this.timeline.addTween(cjs.Tween.get(this.shape_1).wait(2).to({_off:false},0).wait(1));

	this._renderFirstFrame();

}).prototype = p = new cjs.MovieClip();
p.nominalBounds = new cjs.Rectangle(-131.7,-130.9,261.9,261.9);


(lib.IconUi = function(mode,startPosition,loop,reversed) {
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
	this.shape.graphics.f("#FFFFFF").s().p("AglBLIAAiVIByhPIAAB4QA6gHAAAoQAAApg6gHIAAB4gAiGA8IAAh3IBWAAIAAB3g");
	this.shape.setTransform(1.375,0);

	this.shape_1 = new cjs.Shape();
	this.shape_1.graphics.f("rgba(255,0,0,0.8)").s().p("ACDCYIgtgqIhyhuIgLgKIg4g0Ig+g8QgGgFAAgIQAAgJAFgGQAGgGAIAAQAIAAAHAGIBlBgIByBsIBIBEQAGAGAAAJQAAAIgFAGQgGAGgIAAIgBAAQgIAAgFgFg");
	this.shape_1.setTransform(0.475,0.3);

	this.shape_2 = new cjs.Shape();
	this.shape_2.graphics.f("#FFFFFF").s().p("AglBLIAAhIIByBuIAAApgAiGA8IAAh3IAeAAIA4A0IAABDgAglgzIAAgXIByhPIAAB4QA6gHAAAoQAAApg6gHIAAAXg");
	this.shape_2.setTransform(1.375,0);

	this.shape_3 = new cjs.Shape();
	this.shape_3.graphics.f("#FFFFFF").s().p("AiwCrIgGgjIDdjXIgFgEQAOgMABgQQACgIgCgFQgLgagoAHQgUAEgSAIQAggtAwAHQAPADAPAHIANAHQAKAHAKAJQAUATAAALQAAALAQAIQALAGAQADQAJABAFAGIADAFIgrAnQgFgFgMgVQgJgRgLgCQgMgCgNALQgGAGgCAFIgFgFIjODkg");
	this.shape_3.setTransform(0.55,-0.1721);

	this.timeline.addTween(cjs.Tween.get({}).to({state:[]}).to({state:[{t:this.shape}]},2).to({state:[{t:this.shape_2},{t:this.shape_1}]},1).to({state:[]},1).to({state:[{t:this.shape_3}]},2).to({state:[]},1).wait(7));

	this._renderFirstFrame();

}).prototype = p = new cjs.MovieClip();
p.nominalBounds = new cjs.Rectangle(-18.8,-18.4,39.400000000000006,38.9);


(lib.IconMeun = function(mode,startPosition,loop,reversed) {
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
	this.shape.graphics.f("#101820").s().p("AChA/IgCgBQgGAIgNgBQgKABgLgKQgQgPgSgVIAAAMQAAAngZgDQgLAAgHgIIgBgBQgGgHAAgJIAAgBQgUAYgdAAQgaAAgRgPIgBABQgDADgGADIAAAAIgBABQgJAEgSADIgBAAQgRADgLAAQgRAAgIgIQgGADgHAAQgOADgKgYIgEgJIgEAAIgIABIgHAQIgBAAIAAABQgHAMgOAAQgKAAgHgGQgIgHAAgLQgBgFAKgUIAAgEQgBgLANgEIATgfQAYgkAJADQATgBAGAVIAAABIAAAAIAFAWIABAFIAAgcQAAgJAGgHQAGgIAMAAQAKAAAGAGIABABIABABQAHAHAAAJQAAAlgCAdIAVgFIAAAAIAFgBIAAgEQAAgcASgXQAVgcAgABQAcAAAQAOQACgFAEgEIABgBQAHgHAKAAQAMgCAMARQARAZARATIgBgRIAAgCIAAgEIAAgBIgBAAIAAgKQgBgYAaAAQAJgBAGAGQAGgHANAAIAHABIALgCIAQgBQAUAAAMAEIABAAIAAABQAPAGAAAQQAAAJgFAHIAAAAIAAAAQgEAFgFACIABABQAJAGAAAMQABAVgXACIgBAAIgQACIgQABIAAABIAIAAIANAAIABAAIAHgBQAJAAAGAFQAKAGAAAOQAAAUgUAEIAAAAQgIABgYAAQgfAAgIgKgAClgtIABAHIAAAHIgBAcIgBAaQAAAWAHAHQAHAGAWAAQAWAAAHgBQAIgCAAgHQAAgFgEgDQgCgCgEAAIgEABIgEAAIgNAAIgNAAIgJAAQgBgCAAgOIAAgOIAegCIAQgCQAJgBAAgHQAAgEgDgDQgDgCgEAAIgRABIgLABIgCAAIgNABIAAgOIAAgBIAAgMIANgCIALgBQAKAAALADIADABQAEAAADgEQACgCAAgEQAAgGgGgDQgKgDgRAAIgOABIgPACQgCgBgDAAQgKAAAAAKgAiHgyQgCACAAAEQAAAlgCAcIgCAWQAAAPARAAQAKAAAQgDQAQgDAIgDQAGgDAAgGQAAgDgCgDQgDgDgEAAIgDAAQgZAIgRAAIACgRQACgdAAglQAAgEgDgCQgDgDgEAAQgEAAgDADgAA0gzQgDAEAAAEIABAMIABAMIAAANIAAAMIAAAMIgBAMIAAAJIAAAIQAAAEACADQADADAFAAQAKAAAAgVIAAgQIAAgQIAAgQIADgBQAfAnAZAXQAGAFAFAAQAJAAABgJIABgLIABgqIAAgLQAAgigLAAQgKAAAAAJIAAAIIABAHIABAtIAAACIgGACQgbgZgcgoQgGgJgGAAQgEAAgEADgAgxgeQgPATAAAXQAAATAQANQAOALAUAAQAYAAAPgVQAOgTAAgWQAAgWgMgLQgMgLgXAAQgZAAgQAVgAitApQAGAMAFAAQAEAAADgCQADgDAAgEQAAgDgDgGIgDgJIgKgsIgFgWQgCgJgIAAQgEAAgRAaIgVAiQgHACAAADIABAEQgKAUAAAEQAAAEADACQADADAEAAQAFAAADgFIALgXIARgCIAQgBQADALADAIgAgjAeQgJgHAAgLQAAgQAKgOQALgPAPAAQAPAAAGAGQAGAFAAAPQAAAQgJANQgKAPgOAAQgNAAgIgHgAgdAMQAAAEADACQAFAEAHAAQAIgBAFgHQAFgKAAgLIgBgJIAAAAQgDgCgIAAQgIABgGAIIAAAAQgHAJAAAMgAi7gQIAEAWIgJABIgKABIAPgYg");
	this.shape.setTransform(0.4205,15.425);

	this.shape_1 = new cjs.Shape();
	this.shape_1.graphics.f("#FFFFFF").s().p("ACrA0QgHgHAAgWIABgaIABgcIAAgHIgBgHQAAgKAKAAQADAAACABIAPgCIAOgBQARAAAKADQAGADAAAGQAAAEgCACQgDAEgEAAIgDgBQgLgDgKAAIgLABIgNACIAAAMIAAABIAAAOIANgBIACAAIALgBIARgBQAEAAADACQADADAAAEQAAAHgJABIgQACIgeACIAAAOQAAAOABACIAJAAIANAAIANAAIAEAAIAEgBQAEAAACACQAEADAAAFQAAAHgIACQgHABgWAAQgWAAgHgGgAiNArIACgWQACgcAAglQAAgEACgCQADgDAEAAQAEAAADADQADACAAAEQAAAlgCAdIgCARQARAAAZgIIADAAQAEAAADADQACADAAADQAAAGgGADQgIADgQADQgQADgKAAQgRAAAAgPgAA0A2QgCgDAAgEIAAgIIAAgJIABgMIAAgMIAAgMIAAgNIgBgMIgBgMQAAgEADgEQAEgDAEAAQAGAAAGAJQAcAoAbAZIAGAGIAAgIIAAgCIgBgtIgBgHIAAgIQAAgJAKAAQALAAAAAiIAAALIgBAqIgBALQgBAJgJAAQgFAAgGgFQgZgXgfgnIgDgEIAAAFIAAAQIAAAQIAAAQQAAAVgKAAQgFAAgDgDgAgwAsQgQgNAAgTQAAgXAPgTQAQgVAZAAQAXAAAMALQAMALAAAWQAAAWgOATQgPAVgYAAQgUAAgOgLgAgigSQgKAOAAAQQAAALAJAHQAIAHANAAQAOAAAKgPQAJgNAAgQQAAgPgGgFQgGgGgPAAQgPAAgLAPgAitApQgDgIgDgLIgQABIgRACIgLAXQgDAFgFAAQgEAAgDgDQgDgCAAgEQAAgEAKgUIgBgEQAAgDAHgCIAVgiQARgaAEAAQAIAAACAJIAFAWIAKAsIADAJQADAGAAADQAAAEgDADQgDACgEAAQgFAAgGgMgAjKAIIAKgBIAJgBIgEgWIgPAYg");
	this.shape_1.setTransform(0.425,15.425);

	this.shape_2 = new cjs.Shape();
	this.shape_2.graphics.f("#FFFFFF").s().p("ADBB4IgEgQIgHgkIgKAdIgEANQgCAHgEAFQgDAGgHAAQgGAAgEgHIgDgNIgKglIgIAiIgDAPQgDAKgIAAQgEAAgDgDQgCgDAAgEQAAgLAFgQIAHgaIAEgVQADgPAEgFQADgFAGAAQAGAAADAHQADAGADASQADASAGAUQAIgUAHgYIADgQQAEgKAIAAQAHAAAEAMIADARQAEAdAGAVIAGAXQAAAEgDACQgDADgEAAQgIAAgDgLgAAAB2QgOgNAAgTQAAgYAOgTQAQgVAZAAQAYAAAMALQAMALgBAWQAAAXgNATQgPAVgaAAQgTAAgPgLgAAPA3QgLAOABARQgBALAKAHQAIAHAMAAQAQAAAKgPQAJgNAAgRQAAgPgHgFQgGgGgPAAQgPAAgLAPgAhuB2QgQgNAAgTQAAgYAPgTQAJgMAMgFQAJgEALAAQAXAAAMALQANALAAAWQAAAXgOATQgPAVgZAAQgVAAgNgLgAhhA3QgJAOgBARQABALAIAHQAJAHANAAQAPAAAKgPQAJgNAAgRQAAgPgGgFQgHgGgPAAQgPAAgMAPgAjSB9QgDgDAAgEIAAgPIAAgPIAAg4QAAgEADgEQAEgEAGAAIARACQAJABAHADQAdAPAAAWQAAAJgGAGQgHAHgMAFQASAKAKALQACACAAAEQAAAEgDACQgCADgFAAQgDAAgDgDQgVgTgZgIIABAWQAAAEgDADQgCADgEAAQgFAAgCgDgAjCBMIADAAQAQAAAJgEIAGgFQADgDAAgBQAAgIgKgHQgJgHgLgBIgHAAgAi1gYQgPgKAAgNQAAgLALAAQAJAAAAALQAAAEAHAEQAHAFAGAAQADAAAAgJIACgVIABgnIAAgFIgCAAIgIAAIgIAAQgEAAgCgCQgDgDgBgEQAAgKANAAIAHABIAGAAIANgBIANAAQASAAAAAKQABADgDADQgDADgEAAIgEAAIgFAAIgEAAIgBAFQAAAxgGAWQgFAQgOAAQgNAAgMgIgABagVQgCgDAAgEIAAgIIAAgJIABgMIAAgMIAAgNIAAgNIgBgMIgBgMQAAgEADgEQAEgDAEAAQAGAAAGAJQAfAsAeAcIAAgKIgBguIgBgHIAAgIQAAgJAKAAQALAAAAAiIAAALIgBArIgBALQgBAJgJAAQgFAAgFgFQgbgYghgrIAAAWIAAAQIAAAQQAAAVgKAAQgEAAgEgDgAhWgfQgQgNAAgTQAAgYAOgTQARgVAZAAQAXAAAMALQALALAAAWQAAAXgMATQgQAVgZAAQgTAAgOgLgAhJheQgKAOAAARQAAALAJAHQAJAHAMAAQAQAAAKgPQAJgNAAgRIAAgDQAAgMgHgFQgFgGgQAAQgQAAgLAPgAAKgYQgCgDgBgEQAAgDADgDQADgDAEAAIAOgBIAAgfQAAgSABgRIgPAAQgEAAgDgCQgCgDgBgEQABgEACgDQACgCAEAAIAUgBQANAAAVADQAIABAAAIQAAAFgDACQgDACgDAAIgSgBIgBAhIAAAfIATgBQADAAAEADQACADAAAEQAAAEgDACQgCADgFAAIgLAAIgMAAIgOACIgOABQgEAAgDgDg");
	this.shape_2.setTransform(0.25,10.475);

	this.shape_3 = new cjs.Shape();
	this.shape_3.graphics.f("#101820").s().p("ACzB9IAAAAIAAgBIgDAFIgBABQgIAOgOgBQgPABgHgOQgIAQgPgBQgLAAgHgIIgCgCQgEgGgBgHQgTAWgdAAQgaAAgRgOIAAgBQgJgHgEgIIgCADIgBAAQgUAbggAAQgNAAgKgDIgBAAQgLgEgIgHIgCgBIgEAFQgHAHgLAAQgIABgIgHIgBgBQgJgJgKgFQAAAIgGAGIgCABIgBABQgGAHgJAAQgKAAgIgIQgHgGAAgLIAAgOIAAgQIAAg4QgBgGAFgIIAFgFQAGgJAOABIAAAAIATADIgBgBQAJABAMAFIABAAIAFACIAAABQATALAHAOIAFgHQAJgMAMgGIAEgDIACgBIABAAQALgFAOAAQAPAAAQAFIACABIACABIAAABQAGACAEAFIABAAQAHAGAEAJIACgDQALgOANgHIACgBQAMgFAOAAQAOAAAQAGIABgBIACABQAHADAGAGIAAAAQAJAIAEAMQAEgSAFgGIAEgFQAIgHAJAAQAJgBAIAIIAGAIIAEAMIACgIIACgGIAFgGQAHgIALAAQAJgBAJAJIADAFIgDACIAEgCIAEAJIAAABQABAFACAOIAEAXQACANADALIAAAAIACAGIABABQAFATgBACQAAALgIAHQgHAGgKAAIgDAAQgPAAgHgVgAC9BoIAEAQQAEALAHAAQAEAAADgDQADgCAAgEIgGgXQgGgVgEgdIgDgRQgEgMgHAAQgIAAgEAKIgDAQQgHAYgIAUQgGgUgDgSQgDgSgDgGQgDgHgGAAQgFAAgEAFQgDAFgDAPIgFAVIgHAaQgFAQAAALQAAAEACADQADADAFAAQAHAAADgKIADgPIAIgiIAKAlIAEANQADAHAHAAQAGAAADgGQAEgFACgHIAEgNIAKgdIAHAkgAAAArQgOATAAAYQAAATAOANQAPALAUAAQAZAAAPgVQAOgTAAgXQAAgWgMgLQgMgLgYAAQgZAAgQAVgAhaAaQgMAFgJAMQgPATAAAYQAAATAQANQAOALAUAAQAZAAAPgVQAOgTAAgXQAAgWgNgLQgLgLgYAAQgLAAgJAEgAjSAYQgDAEAAAEIAAA4IAAAPIAAAPQAAAEADADQACADAFAAQAEAAACgDQADgDAAgEIgBgWQAZAIAVATQADADADAAQAFAAADgDQACgCAAgEQAAgEgCgCQgKgLgRgKQAMgFAGgHQAGgGAAgJQAAgWgdgPQgHgDgJgBIgRgCIgCAAQgFAAgDAEgAAOBoQgJgHAAgLQAAgRAKgOQALgPAPAAQAQAAAGAGQAGAFAAAPQAAARgJANQgKAPgPAAQgNAAgIgHgAAVBNIgCAJQABAEAEADQAEADAHAAIAEgBIgBAAQAIgEACgDQAFgIABgJIAAAAIAAgFIgBgJIAAAAQgEgCgIAAQgIABgGAIIAAAAQgEAGgCAHgAhiBoQgIgHgBgLQABgRAJgOQAMgPAPAAQAPAAAHAGQAGAFAAAPQAAARgJANQgKAPgPAAQgNAAgJgHgAhTA/IgBAAIAAABQgEAGgCAHIgBAJQAAAEAPAGQALgFACgDQAFgHABgKIAAgFIgBgJIAAAAQgEgCgIAAQgIABgFAHgAjCBMIAAgkIAHAAQALABAJAHQAKAHAAAIQAAABgDADIgGAFQgJAEgQAAIgDAAgAicgBQgRAAgQgLIAAAAIgDgCIgBAAQgJgIgEgIQgFgIABgJIAAgHQADgTAWAAQANAAAGAIIABgVIAAAAIAAgHIgDAAQgKAAgFgFIgCgCIgFgGQgDgGABgFIAAgGQACgTAZAAIAJABIAEAAIAMgBIAOAAQAgAAACATIAAAAIABgBIABAAQATgSAZAAQAcAAAQANIACgEIAAgBIABAAQAFgFAIgBIABAAIAAAAIAVgBQAOAAAWADIAAAAIABAAIAGACIABgBIABgBQAHgHALAAQALgCAMARIABAAIAEAHIAGAGIgBAAIARAWIAIAKIAAgBIgBgRIAAgCIgBgGIgBgJIAAgDQABgVAYAAQARgDAHAYIABAIIABAUIAAALIAAAYIAAAGIAAANIgBALIAAACIAAABIgBABIgBAFIgOgFIAOAFQgHAPgQAAQgKABgLgKIgQgPIgSgVIAAAMIgBAJIgBAIQgHAUgQgBQgMAAgHgIIAAAAQgFACgHAAIgKAAIgBAAIgMAAIgLACIgBAAIgQABQgJAAgIgGIAAAAIAAgBQgCgDgCgDIgCgGQgGAHgIAFQgOAIgTAAQgSAAgOgIIgKgGQgHgFgEgGIgBgCIAAABQgHgOgBgLQgBgKgBAFIAAAAIAAACIgBAAIAAAAIABAAIgBAFIgEAYIgBACIgDAJIAAAAIgBACIgCADIAAAAQgKANgQAAIgBAAgAjEgvQAAANAPAKQAMAIANAAQAOAAAFgQQAGgWAAgxIABgFIAFAAIAEAAIAEAAQAEAAADgDQADgDAAgDQAAgKgTAAIgNAAIgNABIgGAAIgHgBQgMAAgBAKQABAEADADQACACAEAAIAIAAIAIAAIACAAIAAAFIgBAnIgBAVQgBAJgDAAQgGAAgHgFQgHgEAAgEQAAgLgJAAQgKAAgBALgABah/QgDAEAAAEIABAMIABAMIAAANIAAANIAAAMIAAAMIAAAJIgBAIQAAAEACADQAEADAFAAQAKAAgBgVIAAgQIAAgQIAAgWQAiArAaAYQAGAFAFAAQAIAAACgJIAAgLIABgrIAAgLQAAgigLAAQgKAAAAAJIABAIIABAHIAAAuIAAAKQgegcgfgsQgGgJgFAAQgFAAgEADgAhYhqQgOATAAAYQAAATAQANQAOALATAAQAaAAAPgVQAMgTAAgXQABgWgLgLQgNgLgXAAQgZAAgRAVgAAfhIIAAAfIgNABQgFAAgDADQgCADAAADQAAAEACADQADADAEAAIAOgBIAOgCIAMAAIALAAQAFAAACgDQADgCAAgEQAAgEgCgDQgEgDgDAAIgTABIAAgfIABghIASABQADAAADgCQADgCAAgFQAAgIgIgBQgVgDgNAAIgUABQgEAAgCACQgCADAAAEQAAAEACADQADACAEAAIAPAAQgBARAAASgABBhWIAAABIAAAMIAAAPIAEAAIAFABIAAgBIAAgDIAAgIIAAgNIAAgEIAAgEIgFAAIgDAAIgBAEgAhJgtQgJgHAAgLQAAgRAKgOQAKgPAQAAQAQAAAFAGQAHAFAAAMIAAADQAAARgJANQgKAPgQAAQgMAAgIgHgAhAhPIAAAAQgEAHAEAQIAHACIAEABIAEgBQAGgBAEgGIAAAAIADgGQADgJAAgHIAAgCIAAgBIgBgGIgBAAQgDgCgIAAQgIABgHAIIgCAFIgBAAg");
	this.shape_3.setTransform(0.2498,10.4724);

	this.shape_4 = new cjs.Shape();
	this.shape_4.graphics.f("#101820").s().p("ABpBCQgDgDgCgDQgCAEgEADIgBAAIAAABQgHAFgKAAQgJAAgIgFIgBgBIAAgBQgIgIAAgJQAAgJAIgIIAAAAIAAgBQAIgGAKAAQALAAAHAGIAAAAIAEAEIAAg/IAAgIIAAgIQAAgKAHgGIABgBIABgBQAGgHAKAAIAGABIAKgCIABAAIABAAIANAAQAJAAAOADIABAAQAMAEAHAFQAHgHAKAAQAIAAAGAEIAFgGIABAAIAAgBQAHgEAJAAQAJAAAGAFIABABIABAAQAHAHAAAKIAAAeIABgBQANgOAVAAQAQAAAKAFQATAKAAATQAAAJgHAJQAKAFAAAPQACAQgWAKIgBAAQgMAFgNAAQgWAAgOgKIgEgDQgFAPgRgCQgKAAgHgHIgCgCIgDACQgGAGgKAAQgJAAgHgGIgBAAIAAgBQgHgGAAgLIAAgMIgBgNIAAgFQgHAFgIAAIgMAAIgKgBIgCABIAAAeQAAALgIAHQgHAGgKAAQgKAAgHgHgAB0gzQgDADAAAEIAAAIIAAAIIAABNQAAAEADADQACACAEAAQAEAAADgCQADgDAAgEIAAgrQAMgDAFAAIALABIALAAQAEAAADgCQACgCAAgEQAAgIgIgBIgXgBIgCAAIgDAAIgMACIAAgWIAMgCIAKgBQANAAAIADIAEABQAEAAADgDQACgDAAgEQAAgFgOgEQgMgDgIAAIgMAAIgPACIgEgBQgEAAgDADgABEArQgDADAAADQAAAEADADQAEACAEAAQAFAAADgCQAEgDAAgEQAAgEgEgDQgDgCgFAAQgEAAgEADgAEcAvQAKAHARAAQAKAAAKgEQALgFAAgHQAAgHgHAAQgDAAgGADQgGAEgJAAQgGAAgFgCQgFgCgDgDIAXgLIAQgHQAIgGAAgHQAAgKgKgFQgIgEgMAAQgRAAgKANIgFAGIgDgBIAAABIADAAQgFAKAAAMQAAAIADAHIAAAAIgBAAIABAAQADAFAGAFgADzg3QgDACAAAEIAABeQAAAEADADQACACAEAAQAKAAAAgNIAAhaQAAgEgDgCQgCgCgEAAQgEAAgDACgADNgRQgCADAAAEIgBAOIgBAPIABANIAAAMQAAAEACADQADACAEAAQAEAAADgCQADgDAAgEIgBgMIAAgNIABgPIAAgOQAAgEgCgDQgDgCgEAAQgEAAgDACgADPgvQgDADAAAEQAAAEADADQADADAEAAQAFAAADgDQADgDAAgEQAAgEgDgDQgDgDgFAAQgEAAgDADgAgaBHIAAAAIgNgFQgIgBgFgFIAAAAIgDACQgHAGgJAAQgOADgLgYIgDgJIgFAAIgHABIgHAQIgBAAIAAAAQgDAFgDADQgHAFgIAAQgKAAgHgGQgHgGgBgKQgUAYgeAAQgZAAgSgPIAAAAQgEAEgGADIAAAAIAAABQgJAEgTADIAAAAQgRADgLAAQghAAABgeIAAgBIABgWIAAAAQACgcAAgkQAAgJAGgHQAHgIAMAAQAJAAAHAGIABABIABABQAGAHAAAJQAAAlgCAdIAVgFIAAAAIAGgBIAAgEQAAgcARgXIAAAAQAVgcAhABQAeAAAPAPQARAOAAAeIAAAHIABAAIAUgfQAYgkAJADQATgBAGAVIAAABIAAAAIAEAWIAFAWIAAgVIAAAAIAAgXQgBgJAJgJIgBABQAIgKALABQAEgBANAHIABAAIAKAEIAAAAQAXAIARAQQAWAVgBAZQAAAQgIAOIAAgBQgHAPgOAIQgOAKgZAAQgGAAgJgCgAgogyQgDADAAAEIAAAXIAAAWIAAAUIgBAVQAAADADADQACADAFAAQAEADAIACIALABQAUAAALgHQAKgHAGgLQAGgKAAgMQAAgTgRgQQgOgOgTgGIgNgGQgJgEgCAAQgEAAgEAEgAlPgyQgDACAAAEQAAAlgCAcIgBAWQAAAPARAAQAKAAAPgDQARgDAIgDQAGgDAAgGQAAgDgCgDQgDgDgEAAIgDAAQgaAIgQAAIABgRQACgdAAglQAAgEgDgCQgCgDgEAAQgFAAgCADgAj6geQgOATAAAXQAAATAPANQAOALAUAAQAZAAAQgVQANgTAAgWQAAgWgMgLQgMgLgXAAQgZAAgRAVgAhSApQAGAMAFAAQAEAAADgCQADgDAAgEQAAgDgDgGIgDgJIgKgsIgFgWQgCgJgIAAQgEAAgRAaIgMAUIgJAOQgHACAAADIABAEQgKAUAAAEQAAAEADACQADADAEAAQAFAAADgFIAHgNIAEgKIARgCIAQgBQADALADAIgAgSAnIgGgDIAAhCQAVAIAGAFQAUAMAAAQQAAAHgEAHQgDAHgGAEQgHAEgOAAIgHgBgAgJAZQAHAAADgCQADgCACgDIAAAAQACgEAAgDQgBgJgLgHIgBAAIgEgCgAjsAeQgJgHAAgLQAAgQAKgOQALgPAQAAQAPAAAGAGQAHAFAAAPQAAAQgJANQgKAPgQAAQgMAAgJgHgAjQgSQgJABgGAIIAAAAQgHAJAAAMQAAAEADACQAFAEAHAAQAIgBAFgHQAHgKAAgLQAAgGgCgDIAAAAIAAAAQgDgCgIAAIAAAAgAEqABQAEgEAHAAQAHAAAFADQgGADgJAEIgPAGQACgIAFgEgAhggQIAEAWIgJABIgKABIAPgYg");
	this.shape_4.setTransform(-0.8176,12.325);

	this.shape_5 = new cjs.Shape();
	this.shape_5.graphics.f("#FFFFFF").s().p("AB0A4QgDgDAAgEIAAhNIAAgIIAAgIQAAgEADgDQADgDAEAAIAEABIAPgCIAMAAQAIAAAMADQAOAEAAAFQAAAEgCADQgDADgEAAIgEgBQgIgDgNAAIgKABIgMACIAAAWIANgCIACAAIACAAIAXABQAIABAAAIQAAAEgCACQgDACgEAAIgLAAIgLgBQgFAAgMADIAAArQAAAEgDADQgDACgEAAQgEAAgCgCgABEA4QgDgDAAgEQAAgDADgDQAEgDAEAAQAFAAADACQAEADAAAEQAAAEgEADQgDACgFAAQgEAAgEgCgAgWA5QgIgCgEgDQgFAAgCgDQgDgDAAgDIABgVIAAgUIAAgWIAAgXQAAgEADgDQAEgEAEAAQACAAAJAEIANAGQATAGAOAOQARAQAAATQAAAMgGAKQgGALgKAHQgLAHgUAAIgLgBgAgYAkIAGADIAHABQAOAAAHgEQAGgEADgHQAEgHAAgHQAAgQgUgMQgGgFgVgIgAlVArIABgWQACgcAAglQAAgEADgCQACgDAFAAQAEAAACADQADACAAAEQAAAlgCAdIgBARQAQAAAagIIADAAQAEAAADADQACADAAADQAAAGgGADQgIADgRADQgPADgKAAQgRAAAAgPgAj5AsQgPgNAAgTQAAgXAOgTQARgVAZAAQAXAAAMALQAMALAAAWQAAAWgNATQgQAVgZAAQgUAAgOgLgAjrgSQgKAOAAAQQAAALAJAHQAJAHAMAAQAQAAAKgPQAJgNAAgQQAAgPgHgFQgGgGgPAAQgQAAgLAPgAEcAvQgGgFgDgFQgDgHAAgIQAAgMAFgKIAFgGQAKgNARAAQAMAAAIAEQAKAFAAAKQAAAHgIAGIgQAHIgXALQADADAFACQAFACAGAAQAJAAAGgEQAGgDADAAQAHAAAAAHQAAAHgLAFQgKAEgKAAQgRAAgKgHgAEqABQgFAEgCAIIAPgGQAJgEAGgDQgFgDgHAAQgHAAgEAEgADzA0QgDgDAAgEIAAheQAAgEADgCQADgCAEAAQAEAAACACQADACAAAEIAABaQAAANgKAAQgEAAgCgCgADMAzQgCgDAAgEIAAgMIgBgNIABgPIABgOQAAgEACgDQADgCAEAAQAEAAADACQACADAAAEIAAAOIgBAPIAAANIABAMQAAAEgDADQgDACgEAAQgEAAgDgCgAhSApQgDgIgDgLIgQABIgRACIgEAKIgHANQgDAFgFAAQgEAAgDgDQgDgCAAgEQAAgEAKgUIgBgEQAAgDAHgCIAJgOIAMgUQARgaAEAAQAIAAACAJIAFAWIAKAsIADAJQADAGAAADQAAAEgDADQgDACgEAAQgFAAgGgMgAhvAIIAKgBIAJgBIgEgWIgPAYgADPghQgDgDAAgEQAAgEADgDQADgDAEAAQAFAAADADQADADAAAEQAAAEgDADQgDADgFAAQgEAAgDgDg");
	this.shape_5.setTransform(-0.825,12.325);

	this.timeline.addTween(cjs.Tween.get({}).to({state:[]}).to({state:[{t:this.shape_1},{t:this.shape}]},2).to({state:[{t:this.shape_3},{t:this.shape_2}]},1).to({state:[]},1).to({state:[{t:this.shape_5},{t:this.shape_4}]},1).to({state:[]},1).wait(3));

	// Layer_2
	this.shape_6 = new cjs.Shape();
	this.shape_6.graphics.f("#101820").s().p("AhhC3IAYilIAXAAQgKgGgHgIQghggAAguQAAguAhghQAdgdAmAAQAnAAAdAdQAhAhAAAuQAAAughAgQgIAIgJAGIAWAAIAZClg");
	this.shape_6.setTransform(0.25,0.775);

	this.shape_7 = new cjs.Shape();
	this.shape_7.graphics.f("#101820").s().p("Ah2DeIAdjIIAbAAQgKgIgKgJQgngnAAg4QAAg4AngoQAjgjAvAAQAvAAAjAjQAoAoABA4QgBA4goAnQgJAJgLAIIAbAAIAdDIg");
	this.shape_7.setTransform(-21.1,22.2,0.6788,0.6788,0,-7.495,172.505,-0.1,22.2);

	this.shape_8 = new cjs.Shape();
	this.shape_8.graphics.f("#101820").s().p("Ah2DeIAdjIIAbAAQgKgIgKgJQgngnAAg4QAAg4AngoQAjgjAvAAQAvAAAjAjQAoAoABA4QgBA4goAnQgJAJgLAIIAbAAIAdDIg");
	this.shape_8.setTransform(20.45,22.2,0.6788,0.6788,7.495,0,0,-0.1,22.2);

	this.shape_9 = new cjs.Shape();
	this.shape_9.graphics.f("#101820").s().p("AhhDxIAHifIAAAAIATh/IAWAAQgJgGgHgHQggggAAgtQAAgtAgggQAbgcAmAAQAmAAAcAcQAgAgAAAtQAAAtggAgQgIAHgIAGIAVAAIATB/IAAAAIADCfg");
	this.shape_9.setTransform(0.25,11.05,1,1,0,0,0,0,11.5);

	this.shape_10 = new cjs.Shape();
	this.shape_10.graphics.f("#101820").s().p("ACODfIAAjRIkWAAIAADRIhjAAIAAl2IHXAAIAAF2gAhKDfIAAiSICaAAIAACSgAjrilIAAg5IDhAAIAAA5g");
	this.shape_10.setTransform(-0.325,0.9);

	this.shape_11 = new cjs.Shape();
	this.shape_11.graphics.f("#101820").s().p("AjbCOQgiAAgggXQgogbABglQAAgpAlABQAlAAAAAoIAJAHIAAAAQAIAFAHACQgBgCAAgEIAAgBIAEgvQACghAAgxIgIAAIAAAAIgSgBQgQAAgJgKIABABQgNgKAAgRQgBgkAsAAIARABIAOAAIAdgCIAAAAIAeAAQA7AAgDAmQAAAOgIAJIgBABQgLAMgQAAIgKgBIgGAAQgBBvgPAzIAAgBQgPAxgnAAIgCAAgAk1A3QAAAeAgAWQAdAUAdAAQAeAAALgmQAQgyAAhvIAAgLIAMAAIAKAAIAJABQAKAAAGgHQAFgGAAgIQAAgXgpAAIgdAAIgeACIgPAAIgQgBQgcAAAAAVQAAAKAHAGQAGAFAJAAIATABIASAAIAEAAIAAAKQAAA1gCAjIgEAwQgCAVgFAAQgPAAgQgLQgPgLAAgIQAAgZgWAAQgWAAAAAZgAEhCHQghAAgDghIAAABIgFghIABAAQgDgSAAgQIAAgPIABgMIAAgGIgFAFQgKAPgHAWIgBAOIgBANIgBAPIAAgBIgBAMQAAAPgKALIgBABQgLAKgPAAQgPAAgKgKIgBgBQgKgKAAgQIgBgMIgBgOQAAgQACgcIACgoIAAgNIgBgPQAAgPALgLQALgKAPAAQAWgBAJAQQATgMAUABQAnAAAPAhIABAAQAIATAAAkIAAALIAAAKQAAALADARIAAABQADAUAAANQAAAPgKAKIAAABQgLAKgPAAIAAAAgAEGgDIAAAGIAAAGIgBANIAAAOQAAAPACARIAFAhQACATATAAQAJAAAGgGQAGgGAAgJQAAgMgDgTQgDgTAAgMIAAgKIAAgLQAAgggHgRQgMgYgdAAQgZAAgXAWIAAgBQgCgZgUAAQgJAAgHAGQgGAGAAAJIABAOIAAAOIgCApQgCAbAAAQIABANIABANQAAAKAGAGQAGAGAJAAQAJAAAHgGQAGgHAAgJIABgNIABgNIABgOIABgPQAIgaAMgRQANgQAOAAQAFAAAAANgAhVBsIAAAAQgbgZgCgrQgBgnAXgfIAAAAQAcglAyAAQAmAAAXAfIAAAAQATAaAAAlQAAAqgWAdQgbAjgqAAQgjAAgZgZgAhQgVQgUAbABAiQABAkAXAWQAVAUAdAAQAjAAAWgdQATgaAAgkQAAgggQgWQgTgZgeAAQgqAAgYAfgABQB2IgBgBQgKgKAAgPIAAgcIAAAAIgBgdIABgjIAAAAIACghQAAgQALgKIgBABQAGgGAIgDQgGgCgEgEQgMgMAAgQQAAgQAMgLQALgLARAAQAQAAALALIAAAAQAMAMAAAPQAAAQgMALIAAABQgHAGgIACQAFADADAEIAAgBQALAJAAARQAAAOgCAVIgBAhIAAAdIABAcQAAAQgLAKQgKAKgQAAIAAAAQgQAAgJgKgABcgwQgGAGAAAJIgCAiIgBAiIABAdIAAAcQAAAJAGAGQAGAGAJAAQAKAAAGgGQAGgGAAgJIgBgcIAAgdIABgiQACgUAAgOQAAgJgGgGQgGgGgKAAQgJAAgGAGgABfh1QgHAHAAAJQAAAKAHAHQAHAGALAAQAKAAAHgGQAHgHAAgKQAAgJgHgHQgHgHgKAAQgLAAgHAHgAgtBFQgLgKAAgTQAAgUAKgOQALgRATAAQAbAAgCAxQAAASgLAMQgKAIgNAAQgLAAgJgHgAghANIgBABQgHALAAAPQAAALAFAGIABAAQAEAEAGAAQAHAAAGgFQAHgHAAgLQABgVgFgKQgCgEgFAAQgLAAgGAKg");
	this.shape_11.setTransform(-0.6758,-0.9233);

	this.shape_12 = new cjs.Shape();
	this.shape_12.graphics.f("#FFFFFF").s().p("AkVBrQgggWAAgeQAAgZAWAAQAWAAAAAZQAAAIAPALQAQALAPAAQAFAAACgVIAEgwQACgjAAg1IAAgKIgEAAIgSAAIgTgBQgJAAgGgFQgHgGAAgKQAAgVAcAAIAQABIAPAAIAegCIAdAAQApAAAAAXQAAAIgFAGQgGAHgKAAIgJgBIgKAAIgMAAIAAALQAABvgQAyQgLAmgeAAQgdAAgdgUgAEMBlIgFghQgCgRAAgPIAAgOIABgNIAAgGIAAgGQAAgNgFAAQgOAAgNAQQgMARgIAaIgBAPIgBAOIgBANIgBANQAAAJgGAHQgHAGgJAAQgJAAgGgGQgGgGAAgKIgBgNIgBgNQAAgQACgbIACgpIAAgOIgBgOQAAgJAGgGQAHgGAJAAQAUAAACAZIAAABQAXgWAZAAQAdAAAMAYQAHARAAAgIAAALIAAAKQAAAMADATQADATAAAMQAAAJgGAGQgGAGgJAAQgTAAgCgTgAhLBiQgXgWgBgkQgBgiAUgbQAYgfAqAAQAeAAATAZQAQAWAAAgQAAAkgTAaQgWAdgjAAQgdAAgVgUgAguAGQgKAOAAAUQAAATALAKQAJAHALAAQANAAAKgIQALgMAAgSQACgxgbAAQgTAAgLARgABaBrQgGgGAAgJIAAgcIgBgdIABgiIACgiQAAgJAGgGQAGgGAJAAQAKAAAGAGQAGAGAAAJQAAAOgCAUIgBAiIAAAdIABAcQAAAJgGAGQgGAGgKAAQgJAAgGgGgABfhUQgHgHAAgKQAAgJAHgHQAHgHALAAQAKAAAHAHQAHAHAAAJQAAAKgHAHQgHAGgKAAQgLAAgHgGg");
	this.shape_12.setTransform(-0.675,-0.925);

	this.shape_13 = new cjs.Shape();
	this.shape_13.graphics.f("#101820").s().p("AEpBsQgrAAgNgOIAAAAQgSgNAAgsQAAgPADgdIACgcQgGACgIAAIgbgBIgJAAIABAbQADAcAAARIABAKIgBgBIACANQgBAMgFAJQgJARgRAAQgMAAgIgIIAAAAQgKgIAAgOIAAgHIABgCIgBgOIgBgRIgCglIgCgaQgVAAgNgDIAAAAQgYgGABgXQgBgLAIgJQAJgKAOAAIACAAIARACIABAAIAPABIATAAIABAAIAUAAIAaABIAXABQAIAAAHADQAGgPAVABQAGAAAFACIAUgEQAMgCALAAQAfAAASAHQAUAIAAAUQAAAMgHAHQgIALgPAAIgIgBIgBAAQgPgEgPAAIgPABIgHABIgBAPIAagDIAbgCQANAAAJAIQAJAIAAAOQAAAZgaAEIgCAAIgZACIABAAIgjADIAAAIIAAALIACAAIATAAIAAAAIAVgBIAFAAIAIgBQAMAAAIAHIAAAAQAKAIAAAPQABAZgaAEIABAAQgLADgkAAIgBAAgADxhIIABAMIABALIgCAsQgDAcABAOQAAAjALALQALAKAkAAQAiAAALgDQANgCAAgMQAAgHgGgEQgEgEgGAAIgHABIgGAAIgVABIgTAAQgNAAgBgBQgDgDAAgWIABgWIAvgEIAZgCQAOgCAAgMQAAgHgFgEQgEgEgHAAIgaACIgqAEIABgrIAUgEIARgBQARAAASAFIAEAAQAHAAAEgFQAEgEAAgGQAAgKgKgDQgQgHgcAAIgVACQgMABgMAEQgEgDgFAAQgPAAAAAQgABPhNQgEAEAAAGQAAALAMADQAOAEAYAAIAGAAQAAAKADAdIACAmIABAQIABAPIgBAFIAAAEQAAAHAFAEQAEAEAGAAQAIAAAFgJQADgGABgIIgBgLIgBgLQAAgRgCgbIgEgsIAbABIAaABQAHAAAEgEQAFgEAAgGQAAgHgFgEQgEgEgHAAIgZgBIgYgBIgUAAIgUAAIgSgBIgRgCIgBAAQgGAAgEAFgAjkBbIABABQgJgJAAgMQgiAdgkgBQgeAAgWgWIAAAAQgUgWAAgdQgBgoAkgrQAhgmAiABIAJAAIACAAIABAAQAHgEAIAAQAPAAAHAKQAKgMARABIAAAAIAbACIABAAQASACANAHIAAAAQA4AcgBArQAAATgOAPIAAAAIgKAKQAPAKAJALIAIgRIAAgHQgCgMARgGQAOgZASgaQAhgzAMADQAXgBAHAbIABABIAGAiIARBHIAAABIAEAKIAAABQAGANAAAGQgBAOgKAJQgJAHgLAAIgBAAQgQACgOgfIAAgBIgHgTIgNACIgBAAIgRABIgOAdIgBABQgIAPgSAAQgLAAgJgHIAAgBIgDgCIgBAAIAAABQgKAJgMgBQgLABgKgKIAAAAQgVgUgZgLIABANQAAAMgJAJQgJAJgNAAQgNAAgJgKgAjYhOQgFAGABAHIAABXIgBAYIAAAZQAAAGAEAEQAFAFAGAAQAHAAAEgFQAEgEABgGIgCgjQAoAMAhAeQAFAFAFAAQAHAAAEgEQAFgFAAgGQAAgFgEgFQgOgQgdgQQATgIAKgLQAKgKAAgOQAAgigvgYQgKgFgPgCIgcgCIgBAAQgJAAgFAGgAAeBBQAIAUAJAAQAGAAAFgEQAEgEAAgHQAAgEgDgKIgGgOIgRhHIgGgiQgEgPgMAAQgGAAgbApQgSAdgQAaQgKADgBAFQAAADACADQgQAgAAAGQAAAGAFAEQAFAEAFAAQAJAAAFgIQAMgYAFgMIAbgCIAZgDQAEARAGANgAlLgvQggAmAAAjQAAAXAQASQARARAYAAQAgAAAdgZQAGgFAAgGQAAgGgFgEQgEgFgGAAQgFAAgIAGIgRAKQgLAGgLAAQgLAAgIgJQgHgIgBgMQAAgaAagdQARgVAOAAIAJABQACABACAFQAFAKAKAAQAIAAAEgGQACgEAAgGQABgMgCgJQgDgNgLAAQgGAAgGAFIgGgBIgJAAQgcAAgbAggAk9AaQAAAGADAEIABAAQADAEAEAAQAIAAAHgEIAPgKIAAAAQAOgJAIABQAKAAAJAGIAAgCIAAgrQgGADgHAAQgTAAgJgRIAAAAQgIACgMAOIAAAAQgVAYAAAVgAgEgGIAIgPIADgFIAAAGIAEARIADANIgPABIgPACIAMgTgAi/ADIAAg5IAMABQARACAPALQAPALAAAMQAAACgEAFQgFAFgGADQgMAFgbAAIgFAAgAiwgLQAOgBAIgEIAAAAIAGgEQgCgEgGgEIAAAAQgKgHgKgCg");
	this.shape_13.setTransform(-0.1002,0.4751);

	this.shape_14 = new cjs.Shape();
	this.shape_14.graphics.f("#FFFFFF").s().p("AD6BTQgMgLABgjQgBgOADgcIACgsIgBgLIgBgMQAAgQAPAAQAFAAAEADQAMgEAMgBIAVgCQAbAAARAHQAKADAAAKQAAAGgEAEQgEAFgHAAIgEAAQgSgFgRAAIgRABIgUAEIgBArIAqgEIAagCQAHAAAEAEQAFAEAAAHQAAAMgOACIgZACIgvAEIgBAWQAAAWADADQABABAMAAIAUAAIAVgBIAGAAIAHgBQAGAAAEAEQAGAEAAAHQAAAMgNACQgLADgiAAQgkAAgLgKgAjZBRQgEgEAAgGIAAgZIABgYIAAhXQgBgHAFgGQAGgHAJABIAbACQAQACAKAFQAvAYgBAiQAAAOgJAKQgKALgTAIQAdAQAOAQQAEAFAAAFQAAAGgFAFQgEAEgHAAQgGAAgFgFQgggegogMIABAjQAAAGgEAEQgFAFgGAAQgGAAgFgFgAi/ADIAFAAQAbAAAMgFQAGgDAEgFQAFgFAAgCQAAgMgPgLQgPgLgRgCIgMgBgAAeBBQgGgNgEgRIgZADIgbACQgFAMgMAYQgFAIgJAAQgGAAgFgEQgEgEAAgGQAAgGAQggQgCgDAAgDQABgFAKgDQAQgaASgdQAbgpAGAAQAMAAAEAPIAGAiIARBHIAGAOQADAKAAAEQAAAHgEAEQgFAEgGAAQgJAAgIgUgAAEgVIgIAPIgMATIAPgCIAPgBIgDgNIgEgRIgBgGIgCAFgAlbBDQgQgSAAgXQAAgjAggmQAbggAcAAIAJAAIAGABQAGgFAGAAQALAAADANQABAJAAAMQAAAGgDAEQgEAGgHAAQgLAAgEgKQgCgFgCgBIgJgBQgOAAgSAVQgZAdAAAaQABAMAHAIQAIAJALAAQALAAALgGIARgKQAIgGAEAAQAHAAAEAFQAFAEAAAGQAAAGgGAFQgeAZgfAAQgYAAgRgRgACNBPQgEgEAAgHIAAgEIABgFIgBgPIgBgQIgCgmQgDgdAAgKIgGAAQgYAAgOgEQgMgDAAgLQAAgGADgEQAFgFAHAAIARACIASABIAUAAIAUAAIAYABIAZABQAHAAAEAEQAFAEAAAHQAAAGgFAEQgEAEgHAAIgagBIgbgBIAEAsQACAbAAARIAAALIABALQAAAIgDAGQgFAJgIAAQgGAAgFgEg");
	this.shape_14.setTransform(-0.1,0.475);

	this.shape_15 = new cjs.Shape();
	this.shape_15.graphics.f("#FFFFFF").s().p("Ai4BTIADgrQAEg5AAhIQgBgIAGgFQAFgGAIABQAIgBAFAGQAGAFAAAIQAABIgEA8IgCAgQAgAAAygPIAGgBQAIAAAFAGQAFAGAAAGQAAAMgLAFQgRAIghAFQgeAFgUAAQghAAAAgdgADVBoQgHgGAAgHQAAgHAdgxIgegsIgrhEQgCgFgBgFQAAgHAHgFQAFgGAIAAQAJAAAHAJIAKARIAXAnQAOAYALAOIAeg+IALgdQAGgLAMgBQAHAAAHAGQAFAFAAAHQAAAFgIAQIgbA9QgRAmgNAXIgWApQgIAMgKAAQgHAAgGgFgACABnQgLAAgLgYQgHgRgFgUIghADQgVABgLACQgHAPgPAeQgGAJgKAAQgHAAgGgEQgGgGAAgIQABgGATgoQgCgEAAgEQABgGAMgEQASggAYgkQAigyAHAAQAPAAAFARIAJAsQAIAlAMAyIAGASQAGAMAAAFQgBAIgFAGQgGAFgGAAIgBgBgAAwAOQAHgBAMgBIATgBIgJgtIgdAwgAlGBiQgEgGAAgHIAAglQAAgVACgoQADgqAAgUQAAgkATACIAOgCIATAAQAbAAAXARQAZATAAAbQAAAjgbAUQgYASgiAAIgLgCIgBA+QAAAHgFAGQgFAEgHAAQgIAAgGgEgAkihMIAAATQABAPgDAgIAJABQAVgBAOgJQAPgLAAgSQAAgLgOgJQgOgJgPAAIgHAAIgHABg");
	this.shape_15.setTransform(0,0.75);

	this.shape_16 = new cjs.Shape();
	this.shape_16.graphics.f("#333333").s().p("AiXB/QgxAAABgsIAAgBIADgrIACgrQgIAMgOALQgbAUglAAIAAAuQAAAOgKAJQgJAJgOABQgOgBgJgJQgKgJAAgOIAAglQAAgVADgpQADgpAAgUQAAgXAHgLQAJgPARAAIANgBIAVgBQAfAAAbAUIAAAAQAOAKAIANIAAgGQAAgNAKgKIAAgBQAKgJAOgBQAOABAKAJQAKAKAAAOQAABIgEA8IAAABIAAABIgBAOQAagDAkgKIgBAAQAGgCAEAAQAQAAAJALIABAAIAAABIAJgTIgBgJQgBgNATgHQARgeAWgiQApg9ANADQAbAAAIAdIAAAAIAAABIAJArQAIAnALAxIAAAAIAGAPIAAABQAHAPgBAHQAAAPgKAKIAAAAQgLAJgNAAIgBAAQgSABgQgjIAAgBQgFgLgEgPIgVACIgXACIgTAmIAAABQgLARgSAAQgMAAgLgJIAAAAIgFgGIgIAFIAAAAIgBAAQgRAIgkAGQgfAFgVAAIAAAAgAishmQgGAGAAAHQAABIgDA5IgDArQAAAdAhAAQAUAAAegFQAhgFAQgIQAMgFAAgMQAAgGgFgGQgFgGgJAAIgFABQgyAPggAAIACggQAEg8AAhIQAAgHgGgGQgFgGgIABQgIgBgFAGgABqBPQALAYAKAAQAIABAGgFQAFgGAAgIQAAgFgFgMIgGgSQgMgygIglIgJgsQgFgRgPAAQgIAAghAyQgYAkgTAgQgLAEgBAGQAAAEACAEQgUAoAAAGQAAAIAGAGQAGAEAHAAQAKAAAGgJQAPgeAGgPQAMgCAVgBIAhgDQAFAUAHARgAlFhLQAAAUgDAqQgDAoAAAVIAAAlQAAAHAFAGQAFAEAIAAQAIAAAFgEQAFgGAAgHIABg+IALACQAhAAAZgSQAbgUAAgjQAAgbgagTQgXgRgaAAIgUAAIgNACIgBAAQgSAAAAAigADiB8QgNAAgKgJIAAABQgMgLAAgOQgBgIAbgvIgZglIAAAAIgrhEIAAAAIgBgBQgEgIAAgJQAAgNALgLIAAAAQAKgIAOgBQAPAAAMAPIABAAIABABIAKARIAAAAIAAABIAXAmIAAAAIAKAQIASgmIAAAAIAMgcIAAgBQAJgVAWAAQANAAAKAJQALAJAAAPQABAHgKAUIAAABIgbA8QgSAngNAXIABAAIgYAqIAAABQgMASgQAAIgCAAgAClhjQgGAFAAAHQAAAFADAFIArBEIAdAsQgcAxAAAHQAAAHAHAGQAFAFAIAAQAKAAAIgMIAWgpQANgXARgmIAbg9QAIgQAAgFQAAgHgGgFQgGgGgHAAQgMABgGALIgMAdIgdA+QgLgOgOgYIgXgnIgKgRQgIgJgIAAQgIAAgGAGgABNghIAJAsIgTABQgNABgGABIAdgvgAkkgKQACggAAgPIAAgTIAGgBIAIAAQAPAAAOAJQAOAJAAALQAAASgPALQgOAJgVABIgJgBgAkTg5IgBAgQALgBAIgGIAAAAQAJgGAAgKQgBgEgGgDIAAAAQgJgGgLAAIAAAEg");
	this.shape_16.setTransform(0.0039,0.75);

	this.timeline.addTween(cjs.Tween.get({}).to({state:[]}).to({state:[{t:this.shape_6}]},2).to({state:[{t:this.shape_9},{t:this.shape_8},{t:this.shape_7}]},1).to({state:[]},1).to({state:[{t:this.shape_10}]},1).to({state:[{t:this.shape_12},{t:this.shape_11}]},1).to({state:[{t:this.shape_14},{t:this.shape_13}]},1).to({state:[{t:this.shape_16},{t:this.shape_15}]},1).wait(1));

	this._renderFirstFrame();

}).prototype = p = new cjs.MovieClip();
p.nominalBounds = new cjs.Rectangle(-39.5,-24.6,78.3,49.7);


(lib.ColorBg = function(mode,startPosition,loop,reversed) {
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
		UIScreen.fill(this);
	}

	// actions tween:
	this.timeline.addTween(cjs.Tween.get(this).call(this.frame_0).wait(20));

	// Layer_2
	this.shape = new cjs.Shape();
	this.shape.graphics.lf(["#000000","rgba(0,0,0,0)"],[0,1],7.4,-234.4,7.4,-553.9).s().p("Ehj/A4QMAAAhwfMDH/AAAMAAABwfg");
	this.shape.setTransform(0,0.025);

	this.shape_1 = new cjs.Shape();
	this.shape_1.graphics.lf(["#000000","rgba(0,0,0,0)"],[0,1],7,-213.6,7,-533.1).s().p("Ehj/A4QMAAAhwfMDH/AAAMAAABwfg");
	this.shape_1.setTransform(0,0.025);

	this.timeline.addTween(cjs.Tween.get({}).to({state:[{t:this.shape}]}).to({state:[{t:this.shape_1}]},1).to({state:[]},1).wait(18));

	// Layer_1
	this.shape_2 = new cjs.Shape();
	this.shape_2.graphics.f("#201010").s().p("Ehj/A4QMAAAhwfMDH/AAAMAAABwfg");
	this.shape_2.setTransform(0,0.025);

	this.timeline.addTween(cjs.Tween.get(this.shape_2).wait(1).to({_off:true},1).wait(18));

	this._renderFirstFrame();

}).prototype = p = new cjs.MovieClip();
p.nominalBounds = new cjs.Rectangle(-640,-360,1280,720.1);


(lib.Btn_Color_2 = function(mode,startPosition,loop,reversed) {
if (loop == null) { loop = true; }
if (reversed == null) { reversed = false; }
	var props = new Object();
	props.mode = mode;
	props.startPosition = startPosition;
	props.labels = {};
	props.loop = loop;
	props.reversed = reversed;
	cjs.MovieClip.apply(this,[props]);

	// Layer_4
	this.shape = new cjs.Shape();
	this.shape.graphics.f("#FF9A8D").s().p("AmGDuIAAnbIMNAAIAAHbg");
	this.shape.setTransform(0,-5.25);

	this.shape_1 = new cjs.Shape();
	this.shape_1.graphics.f("#FFBEB6").s().p("AmeEMIAAoXIM9AAIAAIXgAmGDuIMNAAIAAnbIsNAAg");
	this.shape_1.setTransform(0,-5.25);

	this.shape_2 = new cjs.Shape();
	this.shape_2.graphics.f("#FF705E").s().p("AmeAWIAAgsIM9AAIAAAsg");
	this.shape_2.setTransform(0,23.8);

	this.shape_3 = new cjs.Shape();
	this.shape_3.graphics.f("#101820").s().p("Am8FBIAAqAIN5AAIAAKAgAmeD1IAAAtIM9AAIAAgtIAAoWIs9AAg");
	this.shape_3.setTransform(0,-3);

	this.shape_4 = new cjs.Shape();
	this.shape_4.graphics.f("#AC8C0F").s().p("AmeAWIAAgsIM9AAIAAAsg");
	this.shape_4.setTransform(0,23.8);

	this.shape_5 = new cjs.Shape();
	this.shape_5.graphics.f("#FFD52D").s().p("AmGDuIAAnbIMNAAIAAHbg");
	this.shape_5.setTransform(0,-5.25);

	this.shape_6 = new cjs.Shape();
	this.shape_6.graphics.f("#FFE67E").s().p("AmeEMIAAoXIM9AAIAAIXgAmGDuIMNAAIAAnbIsNAAg");
	this.shape_6.setTransform(0,-5.25);

	this.shape_7 = new cjs.Shape();
	this.shape_7.graphics.f("#941B1B").s().p("AmGDuIAAnbIMNAAIAAHbg");
	this.shape_7.setTransform(0,-0.75);

	this.shape_8 = new cjs.Shape();
	this.shape_8.graphics.f("#51010A").s().p("AmeEMIAAoXIM9AAIAAIXgAmGDuIMNAAIAAnbIsNAAg");
	this.shape_8.setTransform(0,-0.75);

	this.shape_9 = new cjs.Shape();
	this.shape_9.graphics.f("#101820").s().p("Am8EqIAApTIN5AAIAAJTgAmeEMIM9AAIAAoXIs9AAg");
	this.shape_9.setTransform(0,-0.75);

	this.timeline.addTween(cjs.Tween.get({}).to({state:[{t:this.shape_3},{t:this.shape_2},{t:this.shape_1},{t:this.shape}]}).to({state:[{t:this.shape_3},{t:this.shape_6},{t:this.shape_5},{t:this.shape_4}]},1).to({state:[]},1).to({state:[{t:this.shape_9},{t:this.shape_8},{t:this.shape_7}]},1).wait(1));

	this._renderFirstFrame();

}).prototype = p = new cjs.MovieClip();
p.nominalBounds = new cjs.Rectangle(-44.5,-35,89,64.1);


(lib.Btn_Color = function(mode,startPosition,loop,reversed) {
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
	this.shape.graphics.f().s("#101820").ss(3,1,0,3).p("Aj5D6IAAnzIHzAAIAAHzg");

	this.timeline.addTween(cjs.Tween.get(this.shape).to({_off:true},1).wait(1).to({_off:false},0).to({_off:true},1).wait(1).to({_off:false},0).wait(5));

	// Layer_1
	this.shape_1 = new cjs.Shape();
	this.shape_1.graphics.f("#636363").s().p("AgYD6IAAnzIAxAyIAAGPIAAAAIgwAyg");
	this.shape_1.setTransform(-22.475,0.025);

	this.shape_2 = new cjs.Shape();
	this.shape_2.graphics.f("#2D2D2D").s().p("Aj5AZIAygxIGOAAIAzAxg");
	this.shape_2.setTransform(0.05,22.5);

	this.shape_3 = new cjs.Shape();
	this.shape_3.graphics.f("#949494").s().p("AgYDHIAAmOIAxgyIAAHzg");
	this.shape_3.setTransform(22.5,0.05);

	this.shape_4 = new cjs.Shape();
	this.shape_4.graphics.f("#C0C0C0").s().p("AjHDIIAAAAIAAmPIGPAAIAAAAIAAGPg");

	this.shape_5 = new cjs.Shape();
	this.shape_5.graphics.f("#B4B4B4").s().p("ADIAZImPAAIgygxIAAAAIHzAAIAAABIgyAwg");
	this.shape_5.setTransform(0,-22.475);

	this.shape_6 = new cjs.Shape();
	this.shape_6.graphics.f("#4B739B").s().p("AgYD6IAAnzIAxAyIAAGPIAAAAIgwAyg");
	this.shape_6.setTransform(-22.475,0.025);

	this.shape_7 = new cjs.Shape();
	this.shape_7.graphics.f("#385571").s().p("Aj5AZIAygxIGOAAIAzAxg");
	this.shape_7.setTransform(0.05,22.5);

	this.shape_8 = new cjs.Shape();
	this.shape_8.graphics.f("#679BCF").s().p("AjHDIIAAAAIAAmPIGPAAIAAAAIAAGPg");

	this.shape_9 = new cjs.Shape();
	this.shape_9.graphics.f("#4E78A2").s().p("AgYDHIAAmOIAxgyIAAHzg");
	this.shape_9.setTransform(22.5,0.05);

	this.shape_10 = new cjs.Shape();
	this.shape_10.graphics.f("#B4D9FF").s().p("ADIAZImPAAIgygxIAAAAIHzAAIAAABIgyAwg");
	this.shape_10.setTransform(0,-22.475);

	this.shape_11 = new cjs.Shape();
	this.shape_11.graphics.f("#FF6552").s().p("AgYDHIAAmOIAxgyIAAHzg");
	this.shape_11.setTransform(22.5,0.05);

	this.shape_12 = new cjs.Shape();
	this.shape_12.graphics.f("#741B11").s().p("Aj5AZIAygxIGOAAIAzAxg");
	this.shape_12.setTransform(0.05,22.5);

	this.shape_13 = new cjs.Shape();
	this.shape_13.graphics.f("#AD3B2E").s().p("AgYD6IAAnzIAxAyIAAGPIAAAAIgwAyg");
	this.shape_13.setTransform(-22.475,0.025);

	this.shape_14 = new cjs.Shape();
	this.shape_14.graphics.f("#FF9588").s().p("ADIAZImPAAIgygxIAAAAIHzAAIAAABIgyAwg");
	this.shape_14.setTransform(0,-22.475);

	this.shape_15 = new cjs.Shape();
	this.shape_15.graphics.f("#E85D4C").s().p("AjHDIIAAAAIAAmPIGPAAIAAAAIAAGPg");

	this.shape_16 = new cjs.Shape();
	this.shape_16.graphics.f("#EE1A1A").s().p("ADIAZImPAAIgygxIAAAAIHzAAIAAABIgyAwg");
	this.shape_16.setTransform(0,-22.475);

	this.shape_17 = new cjs.Shape();
	this.shape_17.graphics.f("#6C0000").s().p("AgYD6IAAnzIAxAyIAAGPIAAAAIgwAyg");
	this.shape_17.setTransform(-22.475,0.025);

	this.shape_18 = new cjs.Shape();
	this.shape_18.graphics.f("#C20000").s().p("AjHDIIAAAAIAAmPIGPAAIAAAAIAAGPg");

	this.shape_19 = new cjs.Shape();
	this.shape_19.graphics.f("#910000").s().p("AgYDHIAAmOIAxgyIAAHzg");
	this.shape_19.setTransform(22.5,0.05);

	this.shape_20 = new cjs.Shape();
	this.shape_20.graphics.f("#370000").s().p("Aj5AZIAygxIGOAAIAzAxg");
	this.shape_20.setTransform(0.05,22.5);

	this.shape_21 = new cjs.Shape();
	this.shape_21.graphics.f("#9B8D4B").s().p("AgYD6IAAnzIAxAyIAAGPIAAAAIgwAyg");
	this.shape_21.setTransform(-22.475,0.025);

	this.shape_22 = new cjs.Shape();
	this.shape_22.graphics.f("#716638").s().p("Aj5AZIAygxIGOAAIAzAxg");
	this.shape_22.setTransform(0.05,22.5);

	this.shape_23 = new cjs.Shape();
	this.shape_23.graphics.f("#FFF2B4").s().p("ADIAZImPAAIgygxIAAAAIHzAAIAAABIgyAwg");
	this.shape_23.setTransform(0,-22.475);

	this.shape_24 = new cjs.Shape();
	this.shape_24.graphics.f("#A2944E").s().p("AgYDHIAAmOIAxgyIAAHzg");
	this.shape_24.setTransform(22.5,0.05);

	this.shape_25 = new cjs.Shape();
	this.shape_25.graphics.f("#CFBD67").s().p("AjHDIIAAAAIAAmPIGPAAIAAAAIAAGPg");

	this.shape_26 = new cjs.Shape();
	this.shape_26.graphics.f("#C8BE8B").s().p("ADIAZImPAAIgygxIAAAAIHzAAIAAABIgyAwg");
	this.shape_26.setTransform(0,-22.475);

	this.shape_27 = new cjs.Shape();
	this.shape_27.graphics.f("#7C723E").s().p("AjHDIIAAAAIAAmPIGPAAIAAAAIAAGPg");

	this.shape_28 = new cjs.Shape();
	this.shape_28.graphics.f("#574F28").s().p("AgYD6IAAnzIAxAyIAAGPIAAAAIgwAyg");
	this.shape_28.setTransform(-22.475,0.025);

	this.shape_29 = new cjs.Shape();
	this.shape_29.graphics.f("#6F6535").s().p("AgYDHIAAmOIAxgyIAAHzg");
	this.shape_29.setTransform(22.5,0.05);

	this.shape_30 = new cjs.Shape();
	this.shape_30.graphics.f("#37321A").s().p("Aj5AZIAygxIGOAAIAzAxg");
	this.shape_30.setTransform(0.05,22.5);

	this.shape_31 = new cjs.Shape();
	this.shape_31.graphics.f("#FFF6CC").s().p("ADIAZImPAAIgygxIAAAAIHzAAIAAABIgyAwg");
	this.shape_31.setTransform(0,-22.475);

	this.shape_32 = new cjs.Shape();
	this.shape_32.graphics.f("#D4C26D").s().p("AgYD6IAAnzIAxAyIAAGPIAAAAIgwAyg");
	this.shape_32.setTransform(-22.475,0.025);

	this.shape_33 = new cjs.Shape();
	this.shape_33.graphics.f("#B9A861").s().p("Aj5AZIAygxIGOAAIAzAxg");
	this.shape_33.setTransform(0.05,22.5);

	this.shape_34 = new cjs.Shape();
	this.shape_34.graphics.f("#D9C666").s().p("AgYDHIAAmOIAxgyIAAHzg");
	this.shape_34.setTransform(22.5,0.05);

	this.shape_35 = new cjs.Shape();
	this.shape_35.graphics.f("#FFE982").s().p("AjHDIIAAAAIAAmPIGPAAIAAAAIAAGPg");

	this.timeline.addTween(cjs.Tween.get({}).to({state:[{t:this.shape_5},{t:this.shape_4},{t:this.shape_3},{t:this.shape_2},{t:this.shape_1}]}).to({state:[]},1).to({state:[{t:this.shape_10},{t:this.shape_9},{t:this.shape_8},{t:this.shape_7},{t:this.shape_6}]},1).to({state:[]},1).to({state:[{t:this.shape_15},{t:this.shape_14},{t:this.shape_13},{t:this.shape_12},{t:this.shape_11}]},1).to({state:[{t:this.shape_20},{t:this.shape_19},{t:this.shape_18},{t:this.shape_17},{t:this.shape_16}]},1).to({state:[{t:this.shape_25},{t:this.shape_24},{t:this.shape_23},{t:this.shape_22},{t:this.shape_21}]},1).to({state:[{t:this.shape_30},{t:this.shape_29},{t:this.shape_28},{t:this.shape_27},{t:this.shape_26}]},1).to({state:[{t:this.shape_35},{t:this.shape_34},{t:this.shape_33},{t:this.shape_32},{t:this.shape_31}]},1).wait(1));

	this._renderFirstFrame();

}).prototype = p = new cjs.MovieClip();
p.nominalBounds = new cjs.Rectangle(-26.5,-26.5,53,53);


(lib.TextInput = function(mode,startPosition,loop,reversed) {
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
		// ===== เขียนใน Frame 1 ของ MovieClip ที่มี Dynamic Text "IdTextinput" =====
		var self = this;
		var txt = self.IdTextinput;   // Instance name ของ Dynamic Text ช่อง Input
		var PLACEHOLDER = "Your name...";
		
		// ---------- 0. Global State & Event Dispatcher ----------
		window.UIInput = window.UIInput || new createjs.EventDispatcher();
		if (typeof window.UIInput.value === "undefined") window.UIInput.value = "";
		if (typeof window.UIInput.maxLength === "undefined") window.UIInput.maxLength = 20;
		
		// ฟังก์ชันเก็บค่าลง Global พร้อมกระจาย Event แจ้งเตือน
		window.UIInput.set = window.UIInput.set || function (val) {
		    window.UIInput.value = val;
		    window.UIInput.dispatchEvent({
		        type: "INPUT_CHANGE",
		        value: val
		    });
		};
		
		// ---------- 1. สร้าง DOM <input> ครั้งเดียว เก็บไว้ที่ global ----------
		if (!window.UIInput.el) {
		    var el = document.createElement("input");
		    el.type = "text";
		    el.maxLength = window.UIInput.maxLength;
		    el.style.cssText =
		        "position:fixed;display:none;z-index:999;box-sizing:border-box;" +
		        "text-align:center;background:rgba(140, 88, 80, 1);color:#fff;" +
		        "border:4px solid #FFE257;outline:none;padding:0 6px;border-radius:6px;";
		
		    document.body.appendChild(el);
		    window.UIInput.el = el;
		
		    window.UIInput.commit = function (save) {
		        var inp = window.UIInput.el;
		        if (!inp || inp.style.display === "none") return;
		        inp.style.display = "none";
		        if (save) {
		            window.UIInput.set(inp.value.trim());
		        }
		        if (window.UIInput.refresh) window.UIInput.refresh();
		    };
		
		    el.addEventListener("keydown", function (e) {
		        if (e.key === "Enter") window.UIInput.commit(true);
		        else if (e.key === "Escape") window.UIInput.commit(false);
		    });
		
		    el.addEventListener("blur", function () {
		        window.UIInput.commit(true);
		    });
		
		    var outsideHandler = function (e) {
		        var inp = window.UIInput.el;
		        if (!inp || inp.style.display === "none") return;
		        if (e.target === inp) return;
		        window.UIInput.commit(true);
		    };
		
		    window.addEventListener("pointerdown", outsideHandler, true);
		    window.addEventListener("mousedown", outsideHandler, true);
		    window.addEventListener("touchstart", outsideHandler, true);
		}
		
		// ---------- 2. คำนวณตำแหน่งจริงของ Text ปัจจุบัน (รองรับการ Resize และ Snap) ----------
		window.UIInput.place = function () {
		    var t = window.UIInput.target;
		    var inp = window.UIInput.el;
		    if (!t || !inp || !t.txt) return;
		
		    if (!t.txt.stage) {
		        window.UIInput.commit(false);
		        return;
		    }
		
		    var rect = canvas.getBoundingClientRect();
		    var k = rect.width / canvas.width;
		    var m = t.txt.getConcatenatedMatrix();
		    var sx = Math.sqrt(m.a * m.a + m.b * m.b) * k;
		
		    var match = /(\d+(?:\.\d+)?)px/.exec(t.txt.font);
		    var basePx = match ? parseFloat(match[1]) : t.fs;
		    var fontPx = basePx * sx;
		
		    var w = Math.max(t.hw * sx, 180);
		    var h = fontPx * 1.5;
		    var cx = rect.left + m.tx * k;
		    var left = (t.txt.textAlign === "center") ? cx - w / 2 : cx;
		
		    inp.style.left = left + "px";
		    inp.style.top = (rect.top + m.ty * k) + "px";
		    inp.style.width = w + "px";
		    inp.style.height = h + "px";
		    inp.style.font = t.txt.font.replace(/\d+(?:\.\d+)?px/, fontPx + "px");
		    inp.style.lineHeight = h + "px";
		};
		
		// ---------- 3. ผูกกับ Dynamic Text ปัจจุบัน ----------
		if (txt) {
		    var fs = parseFloat(txt.font) || 20;
		    var hw = txt.lineWidth || 250;
		
		    var hit = new createjs.Shape();
		    var hx = (txt.textAlign === "center") ? -hw / 2 : 0;
		    hit.graphics.beginFill("#000").drawRect(hx, 0, hw, fs * 1.5);
		    txt.hitArea = hit;
		    txt.mouseEnabled = true;
		    txt.cursor = "text";
		
		    function render() {
		        var v = window.UIInput.value;
		        txt.text = v ? v : PLACEHOLDER;
		        txt.alpha = v ? 1 : 0.6;
		    }
		    window.UIInput.refresh = render;
		    render();
		
		    window.UIInput.target = { txt: txt, fs: fs, hw: hw };
		
		    txt.removeAllEventListeners("click");
		    txt.on("click", function (evt) {
		        if (evt) evt.stopPropagation();
		        var inp = window.UIInput.el;
		        window.UIInput.target = { txt: txt, fs: fs, hw: hw };
		        inp.value = window.UIInput.value;
		        window.UIInput.place();
		        inp.style.display = "block";
		        inp.focus();
		        inp.select();
		    });
		
		    if (window.UIInput._tick) createjs.Ticker.off("tick", window.UIInput._tick);
		    window.UIInput._tick = createjs.Ticker.on("tick", function () {
		        if (window.UIInput.el && window.UIInput.el.style.display !== "none") {
		            window.UIInput.place();
		        }
		    });
		}
	}

	// actions tween:
	this.timeline.addTween(cjs.Tween.get(this).call(this.frame_0).wait(1));

	// Layer_1
	this.IdTextinput = new cjs.Text("\"Your name...\"", "bold 36px 'Angsana New'", "#FFFFFF");
	this.IdTextinput.name = "IdTextinput";
	this.IdTextinput.textAlign = "center";
	this.IdTextinput.lineHeight = 50;
	this.IdTextinput.lineWidth = 237;
	this.IdTextinput.parent = this;
	this.IdTextinput.setTransform(-0.05,-16.75);

	this.timeline.addTween(cjs.Tween.get(this.IdTextinput).wait(1));

	this._renderFirstFrame();

}).prototype = getMCSymbolPrototype(lib.TextInput, new cjs.Rectangle(-120.3,-18.7,240.6,55.2), null);


(lib.PreviewMap = function(mode,startPosition,loop,reversed) {
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
	this.shape.graphics.f("#666666").s().p("A3bXcMAAAgu3MAu3AAAMAAAAu3g");

	this.timeline.addTween(cjs.Tween.get(this.shape).wait(1));

	this._renderFirstFrame();

}).prototype = getMCSymbolPrototype(lib.PreviewMap, new cjs.Rectangle(-150,-150,300,300), null);


(lib.OutPutName = function(mode,startPosition,loop,reversed) {
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
		// ===== เขียนใน Frame 1 ของ Symbol/Timeline ที่มี Dynamic Text "TxtOutput" =====
		var self = this;
		var out = self.TxtOutput;   // Instance name ของ Dynamic Text ช่อง Output
		
		window.UIInput = window.UIInput || new createjs.EventDispatcher();
		if (typeof window.UIInput.value === "undefined") window.UIInput.value = "";
		
		if (out) {
		    // 1. นำค่าปัจจุบันจาก Global มาแสดงทันทีที่ถูกสร้างขึ้นบน Stage
		    out.text = window.UIInput.value;
		
		    // 2. ล้าง listener เก่าของ Text ตัวนี้ก่อน เพื่อป้องกันการทำงานซ้อนเมื่อวนเฟรม
		    if (out._onInput) {
		        window.UIInput.off("INPUT_SUBMIT", out._onInput);
		    }
		
		    out._onInput = function (e) {
		        out.text = e.value;
		    };
		
		    // 3. ผูกดักฟัง Event INPUT_SUBMIT จากส่วนกลาง
		    window.UIInput.on("INPUT_SUBMIT", out._onInput);
		
		    // 4. ถอด Listener อัตโนมัติเมื่อ Text ถูกถอดออกจาก Stage
		    out.on("removed", function () {
		        window.UIInput.off("INPUT_SUBMIT", out._onInput);
		    });
		}
	}

	// actions tween:
	this.timeline.addTween(cjs.Tween.get(this).call(this.frame_0).wait(1));

	// Layer_1
	this.TxtOutput = new cjs.Text("OutPutName", "bold 22px 'Comic Sans MS'", "#FFFFFF");
	this.TxtOutput.name = "TxtOutput";
	this.TxtOutput.lineHeight = 33;
	this.TxtOutput.lineWidth = 188;
	this.TxtOutput.parent = this;
	this.TxtOutput.setTransform(-86.95,-4.7);

	this.timeline.addTween(cjs.Tween.get(this.TxtOutput).wait(1));

	this._renderFirstFrame();

}).prototype = getMCSymbolPrototype(lib.OutPutName, new cjs.Rectangle(-88.9,-6.7,192.4,34.7), null);


(lib.OpenCatalog = function(mode,startPosition,loop,reversed) {
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
	this.shape.graphics.f("#FFFFFF").s().p("AifCgIAAk/IE/AAIAAE/gAiLCMIEXAAIAAkXIkXAAgAh3B4IAAjvIDvAAIAADvg");
	this.shape.setTransform(-11.181,-0.1122,1.7935,1.7935);

	this.shape_1 = new cjs.Shape();
	this.shape_1.graphics.f("#FFFF00").s().p("AifCgIAAk/IE/AAIAAE/gAiLCMIEXAAIAAkXIkXAAgAh3B4IAAjvIDvAAIAADvg");
	this.shape_1.setTransform(-11.181,-0.1122,1.7935,1.7935);

	this.shape_2 = new cjs.Shape();
	this.shape_2.graphics.f("#FF0000").s().p("AifCgIAAk/IE/AAIAAE/gAiLCMIEXAAIAAkXIkXAAgAh3B4IAAjvIDvAAIAADvg");
	this.shape_2.setTransform(-11.181,-0.1122,1.7935,1.7935);

	this.timeline.addTween(cjs.Tween.get({}).to({state:[{t:this.shape}]}).to({state:[{t:this.shape_1}]},1).to({state:[{t:this.shape_2}]},1).wait(1));

	// Layer_2
	this.shape_3 = new cjs.Shape();
	this.shape_3.graphics.f().s("#000000").ss(3,0,0,3).p("AqIj2IURAAIAAHtI0RAAg");
	this.shape_3.setTransform(-18.0676,0.3951,0.786,1.4838);

	this.shape_4 = new cjs.Shape();
	this.shape_4.graphics.f().s("#000000").ss(3,0,0,3).p("An9luIP7AAIAALdIv7AAg");
	this.shape_4.setTransform(-18.075,0.4);

	this.timeline.addTween(cjs.Tween.get({}).to({state:[{t:this.shape_3}]}).to({state:[{t:this.shape_3}]},1).to({state:[{t:this.shape_4}]},1).wait(1));

	// Layer_1
	this.shape_5 = new cjs.Shape();
	this.shape_5.graphics.f("#993131").s().p("AhWD3IAAntICtAAIAAHtg");
	this.shape_5.setTransform(-62.2602,0.3951,0.786,1.4838);

	this.shape_6 = new cjs.Shape();
	this.shape_6.graphics.f("#AD5555").s().p("AoxD3IAAntIRjAAIAAHtg");
	this.shape_6.setTransform(-11.2294,0.3951,0.786,1.4838);

	this.shape_7 = new cjs.Shape();
	this.shape_7.graphics.f("#FF2525").s().p("AhWD3IAAntICtAAIAAHtg");
	this.shape_7.setTransform(-62.2602,0.3951,0.786,1.4838);

	this.shape_8 = new cjs.Shape();
	this.shape_8.graphics.f("#FF9D9D").s().p("AoxD3IAAntIRjAAIAAHtg");
	this.shape_8.setTransform(-11.2294,0.3951,0.786,1.4838);

	this.shape_9 = new cjs.Shape();
	this.shape_9.graphics.f("#2B0101").s().p("AhWD3IAAntICtAAIAAHtg");
	this.shape_9.setTransform(-62.2602,0.3951,0.786,1.4838);

	this.shape_10 = new cjs.Shape();
	this.shape_10.graphics.f("#570404").s().p("AoxD3IAAntIRjAAIAAHtg");
	this.shape_10.setTransform(-11.2294,0.3951,0.786,1.4838);

	this.timeline.addTween(cjs.Tween.get({}).to({state:[{t:this.shape_6},{t:this.shape_5}]}).to({state:[{t:this.shape_8},{t:this.shape_7}]},1).to({state:[{t:this.shape_10},{t:this.shape_9}]},1).wait(1));

	this._renderFirstFrame();

}).prototype = p = new cjs.MovieClip();
p.nominalBounds = new cjs.Rectangle(-70.6,-37.7,105.1,76.30000000000001);


(lib.HashingOutPut = function(mode,startPosition,loop,reversed) {
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
		var self = this;
		var out = self.txt_HashCode || self.txt_Hash || self.txt_Value || self.txt_output;
		
		// ตรวจสอบว่ามี createjs และ window.UIRoom พร้อมใช้งานจริงหรือไม่
		if (out && typeof createjs !== "undefined") {
		    window.UIRoom = window.UIRoom || new createjs.EventDispatcher();
		
		    // 1. แสดงค่าเริ่มต้น
		    out.text = (window.UIRoom && window.UIRoom.hashCode) || "------";
		    if (out.stage) out.stage.update();
		
		    // 2. ป้องกัน Error กรณี window.UIRoom หรือฟังก์ชันเดิมไม่มีอยู่
		    if (window.UIRoom && out._onRoomEnter) {
		        if (typeof window.UIRoom.off === "function") {
		            window.UIRoom.off("ROOM_ENTER", out._onRoomEnter);
		            if (out._onRoomLeave) window.UIRoom.off("ROOM_LEAVE", out._onRoomLeave);
		        }
		    }
		
		    out._onRoomEnter = function (e) {
		        if (out && out.text !== undefined) {
		            out.text = (e && e.hashCode) || (window.UIRoom && window.UIRoom.hashCode) || "------";
		            if (out.stage) out.stage.update();
		        }
		    };
		
		    out._onRoomLeave = function () {
		        if (out && out.text !== undefined) {
		            out.text = "------";
		            if (out.stage) out.stage.update();
		        }
		    };
		
		    // 3. ผูก Event เมื่อ window.UIRoom พร้อม
		    if (window.UIRoom && typeof window.UIRoom.on === "function") {
		        window.UIRoom.on("ROOM_ENTER", out._onRoomEnter);
		        window.UIRoom.on("ROOM_LEAVE", out._onRoomLeave);
		    }
		
		    // 4. ถอด Listener เมื่อถูกลบออกจาก Stage (ตรวจสอบ window.UIRoom ก่อนเรียกใช้เสมอ)
		    if (typeof out.on === "function") {
		        out.on("removed", function () {
		            if (window.UIRoom && typeof window.UIRoom.off === "function") {
		                if (out._onRoomEnter) window.UIRoom.off("ROOM_ENTER", out._onRoomEnter);
		                if (out._onRoomLeave) window.UIRoom.off("ROOM_LEAVE", out._onRoomLeave);
		            }
		        });
		    }
		}
	}

	// actions tween:
	this.timeline.addTween(cjs.Tween.get(this).call(this.frame_0).wait(1));

	// Layer_3
	this.txt_HashCode = new cjs.Text("", "bold 37px 'Browallia New'", "#FF8D80");
	this.txt_HashCode.name = "txt_HashCode";
	this.txt_HashCode.textAlign = "center";
	this.txt_HashCode.lineHeight = 56;
	this.txt_HashCode.lineWidth = 138;
	this.txt_HashCode.parent = this;
	this.txt_HashCode.setTransform(2.25,-24.05);

	this.timeline.addTween(cjs.Tween.get(this.txt_HashCode).wait(1));

	this._renderFirstFrame();

}).prototype = getMCSymbolPrototype(lib.HashingOutPut, new cjs.Rectangle(-68.5,-26,141.6,52.2), null);


(lib.handle_bar = function(mode,startPosition,loop,reversed) {
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
	this.shape.graphics.f("#D85040").s().p("AgcCeIAAk7IA5AAIAAE7g");
	this.shape.setTransform(0.025,-0.025);

	this.timeline.addTween(cjs.Tween.get(this.shape).wait(1));

	this._renderFirstFrame();

}).prototype = getMCSymbolPrototype(lib.handle_bar, new cjs.Rectangle(-2.8,-15.8,5.699999999999999,31.6), null);


(lib.BtnListRoomMuitPlayer = function(mode,startPosition,loop,reversed) {
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
	this.shape.graphics.f("#A73C2F").s().p("EgpGAEMIAAoXMBMxAAAIAAIXgEgw6ADPIAAmeIGdAAIAAGegEAqqADFIBpmFIAAgGIEoAAIAAGLgEAk6ADFIAAmLIGTAAIhqGLg");
	this.shape.setTransform(-0.025,-0.025);

	this.shape_1 = new cjs.Shape();
	this.shape_1.graphics.f("#CE756A").s().p("EgpGAEMIAAoXMBMxAAAIAAIXgEgw6ADPIAAmeIGdAAIAAGegEAqqADFIBpmFIAAgGIEoAAIAAGLgEAk6ADFIAAmLIGTAAIhqGLg");
	this.shape_1.setTransform(-0.025,-0.025);

	this.shape_2 = new cjs.Shape();
	this.shape_2.graphics.f("#4D140D").s().p("EgpGAEMIAAoXMBMxAAAIAAIXgEgw6ADPIAAmeIGdAAIAAGegEAqqADFIBpmFIAAgGIEoAAIAAGLgEAk6ADFIAAmLIGTAAIhqGLg");
	this.shape_2.setTransform(-0.025,-0.025);

	this.shape_3 = new cjs.Shape();
	this.shape_3.graphics.f("#4D140D").s().p("Egw6gEKMBh1gACIAAIXMhh1AACg");
	this.shape_3.setTransform(-0.025,-0.05);

	this.timeline.addTween(cjs.Tween.get({}).to({state:[{t:this.shape}]}).to({state:[{t:this.shape_1}]},1).to({state:[{t:this.shape_2}]},1).to({state:[{t:this.shape_3}]},1).wait(1));

	this._renderFirstFrame();

}).prototype = p = new cjs.MovieClip();
p.nominalBounds = new cjs.Rectangle(-313.1,-26.9,626.2,53.7);


(lib.BtnListRoomAlone = function(mode,startPosition,loop,reversed) {
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
	this.shape.graphics.f("#A73C2F").s().p("EgpFAEMIAAoXMBaAAAAIAAIXgEgw6ADPIAAmeIGdAAIAAGeg");
	this.shape.setTransform(-0.05,-0.025);

	this.shape_1 = new cjs.Shape();
	this.shape_1.graphics.f("#CE756A").s().p("EgpFAEMIAAoXMBaAAAAIAAIXgEgw6ADPIAAmeIGdAAIAAGeg");
	this.shape_1.setTransform(-0.05,-0.025);

	this.shape_2 = new cjs.Shape();
	this.shape_2.graphics.f("#4D140D").s().p("EgpFAEMIAAoXMBaAAAAIAAIXgEgw6ADPIAAmeIGdAAIAAGeg");
	this.shape_2.setTransform(-0.05,-0.025);

	this.shape_3 = new cjs.Shape();
	this.shape_3.graphics.f("#4D140D").s().p("EgxYAFEIAAqHMBixAAAIAAKHg");
	this.shape_3.setTransform(-3.05,-0.025);

	this.timeline.addTween(cjs.Tween.get({}).to({state:[{t:this.shape}]}).to({state:[{t:this.shape_1}]},1).to({state:[{t:this.shape_2}]},1).to({state:[{t:this.shape_3}]},1).wait(1));

	this._renderFirstFrame();

}).prototype = p = new cjs.MovieClip();
p.nominalBounds = new cjs.Rectangle(-319.1,-32.4,632.2,64.8);


(lib.BtnLisArtInRoom = function(mode,startPosition,loop,reversed) {
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
	this.shape.graphics.f("#A73C2F").s().p("AR6EMIAAoXIfBAAIAAIXgEgpFAEMIAAoXMA5TAAAIAAIXgEgw6ADPIAAmeIGdAAIAAGeg");
	this.shape.setTransform(-0.05,-0.025);

	this.shape_1 = new cjs.Shape();
	this.shape_1.graphics.f("#CE756A").s().p("AR6EMIAAoXIfBAAIAAIXgEgpFAEMIAAoXMA5TAAAIAAIXgEgw6ADPIAAmeIGdAAIAAGeg");
	this.shape_1.setTransform(-0.05,-0.025);

	this.shape_2 = new cjs.Shape();
	this.shape_2.graphics.f("#4D140D").s().p("AR6EMIAAoXIfBAAIAAIXgEgpFAEMIAAoXMA5TAAAIAAIXgEgw6ADPIAAmeIGdAAIAAGeg");
	this.shape_2.setTransform(-0.05,-0.025);

	this.shape_3 = new cjs.Shape();
	this.shape_3.graphics.f("#4D140D").s().p("EgxYAFEIAAqHMBixAAAIAAKHg");
	this.shape_3.setTransform(-3.05,-0.025);

	this.timeline.addTween(cjs.Tween.get({}).to({state:[{t:this.shape}]}).to({state:[{t:this.shape_1}]},1).to({state:[{t:this.shape_2}]},1).to({state:[{t:this.shape_3}]},1).wait(1));

	this._renderFirstFrame();

}).prototype = p = new cjs.MovieClip();
p.nominalBounds = new cjs.Rectangle(-319.1,-32.4,632.2,64.8);


(lib.ArtPlay = function(mode,startPosition,loop,reversed) {
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
	this.shape.graphics.f("#FFFFFF").s().p("AHuDHIAAinIiRjmIBeAAIBeCeIBbieIBdAAIiTDmIAACngAEEDHIgjhaIieAAIghBaIhVAAICbmNIBUAAICgGNgABbApIBtAAIg3iSgAleDHIAAmNIBRAAIAAFKIDIAAIAABDgArQDHIAAmNICBAAQBDAAAdAGQAfAGAZAfQAYAfAAAwQAAAsgTAeQgTAbgfAMQgeAMhJAAIg1AAIAACWgAqAgRIAtAAQA0AAAWgMQAXgMAAghQAAgggTgNQgVgLg+AAIgoAAg");
	this.shape.setTransform(-2.1,-3.125);

	this.timeline.addTween(cjs.Tween.get(this.shape).wait(2).to({y:5.125},0).wait(1));

	// Layer_1
	this.shape_1 = new cjs.Shape();
	this.shape_1.graphics.f("#D8AF4A").s().p("AzrFsIAArXMAnXAAAIAALXg");
	this.shape_1.setTransform(-0.425,-3.425);

	this.shape_2 = new cjs.Shape();
	this.shape_2.graphics.f("#96901F").s().p("A0DAiIAAhDMAoHAAAIAABDg");
	this.shape_2.setTransform(-0.425,40.95);

	this.shape_3 = new cjs.Shape();
	this.shape_3.graphics.f("#F9FFB6").s().p("A0DGaIAAsyMAoHAAAIAAMygAzrFsMAnXAAAIAArWMgnXAAAg");
	this.shape_3.setTransform(-0.425,-3.45);

	this.shape_4 = new cjs.Shape();
	this.shape_4.graphics.f("#101820").s().p("A0hHZIAAuxMApDAAAIAAOxgA0DF3IAABFMAoHAAAIAAhFIAAsyMgoHAAAg");
	this.shape_4.setTransform(-0.425,0);

	this.shape_5 = new cjs.Shape();
	this.shape_5.graphics.f("#FF705E").s().p("A0DAiIAAhDMAoHAAAIAABDg");
	this.shape_5.setTransform(-0.425,40.95);

	this.shape_6 = new cjs.Shape();
	this.shape_6.graphics.f("#FF9A8D").s().p("AzrFsIAArXMAnXAAAIAALXg");
	this.shape_6.setTransform(-0.425,-3.425);

	this.shape_7 = new cjs.Shape();
	this.shape_7.graphics.f("#FFBEB6").s().p("A0DGaIAAsyMAoHAAAIAAMygAzrFsMAnXAAAIAArWMgnXAAAg");
	this.shape_7.setTransform(-0.425,-3.45);

	this.shape_8 = new cjs.Shape();
	this.shape_8.graphics.f("#CE6262").s().p("AzrFsIAArXMAnXAAAIAALXg");
	this.shape_8.setTransform(-0.425,3.475);

	this.shape_9 = new cjs.Shape();
	this.shape_9.graphics.f("#870909").s().p("A0DAiIAAhDMAoHAAAIAABDg");
	this.shape_9.setTransform(-0.425,-40.95);

	this.shape_10 = new cjs.Shape();
	this.shape_10.graphics.f("#FFBEB6").s().p("A0DGZIAAsyMAoHAAAIAAMygAzrFsMAnXAAAIAArXMgnXAAAg");
	this.shape_10.setTransform(-0.425,3.45);

	this.shape_11 = new cjs.Shape();
	this.shape_11.graphics.f("#101820").s().p("A0hHZIAAuxMApDAAAIAAOxgA0Dl2IAAMyMAoHAAAIAAsyIAAhFMgoHAAAg");
	this.shape_11.setTransform(-0.425,0);

	this.timeline.addTween(cjs.Tween.get({}).to({state:[{t:this.shape_4},{t:this.shape_3},{t:this.shape_2},{t:this.shape_1}]}).to({state:[{t:this.shape_4},{t:this.shape_7},{t:this.shape_6},{t:this.shape_5}]},1).to({state:[{t:this.shape_11},{t:this.shape_10},{t:this.shape_9},{t:this.shape_8}]},1).wait(1));

	this._renderFirstFrame();

}).prototype = p = new cjs.MovieClip();
p.nominalBounds = new cjs.Rectangle(-131.8,-47.2,262.8,94.5);


(lib.ArtHash = function(mode,startPosition,loop,reversed) {
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
	this.shape.graphics.f().s("#101820").ss(2,1,1).p("AvxkNIfjAAIAAIbI/jAAg");

	this.shape_1 = new cjs.Shape();
	this.shape_1.graphics.f("#D85040").s().p("AvxEOIAAobIfjAAIAAIbg");

	this.timeline.addTween(cjs.Tween.get({}).to({state:[{t:this.shape_1},{t:this.shape}]}).wait(1));

	this._renderFirstFrame();

}).prototype = getMCSymbolPrototype(lib.ArtHash, new cjs.Rectangle(-102,-28,204,56), null);


(lib.ArtBack = function(mode,startPosition,loop,reversed) {
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
	this.shape.graphics.f("#FFFFFF").s().p("Aj5CEIAAhcIDAAAIAAirIEzEHg");
	this.shape.setTransform(-0.25,-4.9);

	this.shape_1 = new cjs.Shape();
	this.shape_1.graphics.f("#FF9A8D").s().p("AmFDuIAAnbIMMAAIAAHbg");
	this.shape_1.setTransform(0,-2.25);

	this.shape_2 = new cjs.Shape();
	this.shape_2.graphics.f("#FFBEB6").s().p("AmeEMIAAoXIM9AAIAAIXgAmFDuIMMAAIAAnbIsMAAg");
	this.shape_2.setTransform(0,-2.25);

	this.shape_3 = new cjs.Shape();
	this.shape_3.graphics.f("#FF705E").s().p("AmeAXIAAgsIM9AAIAAAsg");
	this.shape_3.setTransform(0,26.8);

	this.shape_4 = new cjs.Shape();
	this.shape_4.graphics.f("#101820").s().p("Am8FAIAAp/IN5AAIAAJ/gAmeEjIM9AAIAApFIs9AAg");

	this.shape_5 = new cjs.Shape();
	this.shape_5.graphics.f("#ECDF4E").s().p("AmFDuIAAnbIMMAAIAAHbg");
	this.shape_5.setTransform(0,-2.25);

	this.shape_6 = new cjs.Shape();
	this.shape_6.graphics.f("#FFFEB6").s().p("AmeEMIAAoXIM9AAIAAIXgAmFDuIMMAAIAAnbIsMAAg");
	this.shape_6.setTransform(0,-2.25);

	this.shape_7 = new cjs.Shape();
	this.shape_7.graphics.f("#B8B023").s().p("AmeAXIAAgsIM9AAIAAAsg");
	this.shape_7.setTransform(0,26.8);

	this.shape_8 = new cjs.Shape();
	this.shape_8.graphics.f("#F91212").s().p("Aj5CEIAAhcIDAAAIAAirIEzEHg");
	this.shape_8.setTransform(-0.25,1.95);

	this.shape_9 = new cjs.Shape();
	this.shape_9.graphics.f("#830C0C").s().p("AmFDuIAAnbIMMAAIAAHbg");
	this.shape_9.setTransform(0,2.25);

	this.shape_10 = new cjs.Shape();
	this.shape_10.graphics.f("#8D3333").s().p("AmeEMIAAoXIM9AAIAAIXgAmFDuIMMAAIAAnbIsMAAg");
	this.shape_10.setTransform(0,2.25);

	this.shape_11 = new cjs.Shape();
	this.shape_11.graphics.f("#4A0E07").s().p("AmeAXIAAgsIM9AAIAAAsg");
	this.shape_11.setTransform(0,-26.8);

	this.timeline.addTween(cjs.Tween.get({}).to({state:[{t:this.shape_4},{t:this.shape_3},{t:this.shape_2},{t:this.shape_1},{t:this.shape}]}).to({state:[{t:this.shape_4},{t:this.shape_7},{t:this.shape_6},{t:this.shape_5},{t:this.shape}]},1).to({state:[{t:this.shape_4},{t:this.shape_11},{t:this.shape_10},{t:this.shape_9},{t:this.shape_8}]},1).wait(1));

	this._renderFirstFrame();

}).prototype = p = new cjs.MovieClip();
p.nominalBounds = new cjs.Rectangle(-44.5,-32,89,64.1);


(lib.Art_nameRoom = function(mode,startPosition,loop,reversed) {
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
	this.shape.graphics.f("#D85040").s().p("EgmRADHIAAmNMBMjAAAIAAGNgA1ngFQgRARAAAYQAAAdAQAQQAQAQAcAAQAZABARgSQARgQAAgbQAAgagRgQQgQgQgagBQgbAAgQARgA3vgFQgQARAAAYQAAAdAQAQQAQAQAbAAQAaABARgSQAQgQAAgbQAAgagQgQQgRgQgagBQgbAAgQARgA9MgFQgPARAAAbQAAAYAOARQANARAeAAQAlAAAMghIgegGQgFAQgOAAQgYAAgBgcIBMAAQAAhEg2AAQgZAAgOARgEghTAAQIAAAEQgIADgVAFQgdAFgGAIQgIALAAAMQAAAPALAJQAMAJAQAAQATAAARgPQABAGADAHIAeAAQgHgNAAgZIAAgjQAAgYgKgKQgKgKgcAAQgpABgJAfIAbAFQAFgOAQAAQAUAAAAAPgAxlAFQAEAFAAATIAABCIAfAAIAAhKQAAgrgmAAQgVABgOARQgKgRgXgBQgVABgPARIAAgPIgcAAIAAByIAfAAIAAg4QAAgaAGgHQAHgFAKAAQAKgBADAJQADAKAAAMIAABAIAeAAIAAg3QAAgnAXAAQAHgBAFAFgA4JBfIgUgfQgTgfgQgIQAqgHAAglQAAgZgPgKQgQgJgfAAIhEAAIAACeIAgAAIAAhCIAHAAQAOAAAFACQAHAFAFAHIAiA0IAnAAgA+TAFQAFAFAAATIAABCIAeAAIAAhKQAAgrglAAQgVABgPARQgKgRgWgBQgWABgOARIAAgPIgcAAIAAByIAeAAIAAg4QAAgaAHgHQAGgFAKAAQALgBADAJQACAKAAAMIAABAIAfAAIAAg3QAAgnAXAAQAHgBAEAFgEgjUABfIAgAAIAAieIgeAAIAABoIhBhoIgfAAIAACeIAeAAIAAhngEgh3ABHQgFgDAAgIQAAgFAGgGIAjgKIAAAHQAAAegYAAQgGAAgGgFgA1RA/QgHgLAAgOQAAgRAHgJQAHgKAOABQAMgBAIAKQAHAJAAAQQAAAPgHALQgIAKgMAAQgOAAgHgKgA3YA/QgIgLAAgOQAAgRAIgJQAHgKANABQANgBAIAKQAHAJAAAQQAAAPgHALQgIAKgNAAQgNAAgHgKgA86AcQAAgbAWAAQAWAAABAbgA54AEIAAgoIAZAAQAaAAAHAEQAHAEAAAMQAAANgJADQgIADgZABg");
	this.shape.setTransform(0.025,0);

	this.shape_1 = new cjs.Shape();
	this.shape_1.graphics.f("#FFFFFF").s().p("AFSBAQgQgPAAgeQAAgXARgSQAQgQAbAAQAaAAAQAQQARARAAAZQAAAbgRARQgRARgZAAQgcAAgQgRgAFpgEQgHAJAAAQQAAAPAHAKQAHAKAOAAQAMAAAIgKQAHgKAAgQQAAgPgHgJQgIgJgMAAQgOAAgHAJgADLBAQgQgPAAgeQAAgXAQgSQAQgQAbAAQAaAAARAQQAQARAAAZQAAAbgQARQgRARgaAAQgbAAgQgRgADigEQgIAJAAAQQAAAPAIAKQAHAKANAAQANAAAIgKQAHgKAAgQQAAgPgHgJQgIgJgNAAQgNAAgHAJgAiSA/QgOgRAAgYQAAgaAPgSQAOgQAZAAQA2AAAABDIhMAAQABAcAYAAQAOAAAFgQIAeAGQgMAiglAAQgeAAgNgSgAh/ALIAtAAQgBgagWAAQgWAAAAAagAnVBIQgLgKAAgPQAAgMAIgKQAGgJAdgFQAVgFAIgDIAAgDQAAgPgUAAQgQAAgFAOIgbgFQAJggApAAQAcAAAKAKQAKAJAAAYIAAAjQAAAZAHANIgeAAQgDgGgBgHQgRAQgTAAQgQAAgMgJgAm7AgQgGAGAAAGQAAAHAFAEQAGAEAGAAQAYAAAAgeIAAgHIgjAKgAJZBOIAAhCQAAgSgEgFQgFgEgHAAQgXAAAAAmIAAA3IgeAAIAAg/QAAgNgDgJQgDgIgKAAQgKAAgHAGQgGAGAAAZIAAA4IgfAAIAAhyIAcAAIAAAQQAPgSAVAAQAXAAAKASQAOgSAVAAQAmAAAAAqIAABKgACKBOIgigzQgFgIgHgEQgFgDgOAAIgHAAIAABCIggAAIAAieIBEAAQAfAAAQAKQAPAJAAAaQAAAlgqAGQAQAIATAfIAUAfgABCgMIAXAAQAZAAAIgFQAJgDAAgNQAAgMgHgEQgHgEgaAAIgZAAgAjTBOIAAhCQAAgSgFgFQgEgEgHAAQgXAAAAAmIAAA3IgfAAIAAg/QAAgNgCgJQgDgIgLAAQgKAAgGAGQgHAGAAAZIAAA4IgeAAIAAhyIAcAAIAAAQQAOgSAWAAQAWAAAKASQAPgSAVAAQAlAAAAAqIAABKgAoZBOIhAhnIAABnIgeAAIAAieIAfAAIBBBpIAAhpIAeAAIAACeg");
	this.shape_1.setTransform(-172.275,1.675);

	this.shape_2 = new cjs.Shape();
	this.shape_2.graphics.f("#FF9C91").s().p("EgmRADHIAAmNMBMjAAAIAAGNgA1ngFQgRARAAAYQAAAdAQAQQAQAQAcAAQAZABARgSQARgQAAgbQAAgagRgQQgQgQgagBQgbAAgQARgA3vgFQgQARAAAYQAAAdAQAQQAQAQAbAAQAaABARgSQAQgQAAgbQAAgagQgQQgRgQgagBQgbAAgQARgA9MgFQgPARAAAbQAAAYAOARQANARAeAAQAlAAAMghIgegGQgFAQgOAAQgYAAgBgcIBMAAQAAhEg2AAQgZAAgOARgEghTAAQIAAAEQgIADgVAFQgdAFgGAIQgIALAAAMQAAAPALAJQAMAJAQAAQATAAARgPQABAGADAHIAeAAQgHgNAAgZIAAgjQAAgYgKgKQgKgKgcAAQgpABgJAfIAbAFQAFgOAQAAQAUAAAAAPgAxlAFQAEAFAAATIAABCIAfAAIAAhKQAAgrgmAAQgVABgOARQgKgRgXgBQgVABgPARIAAgPIgcAAIAAByIAfAAIAAg4QAAgaAGgHQAHgFAKAAQAKgBADAJQADAKAAAMIAABAIAeAAIAAg3QAAgnAXAAQAHgBAFAFgA4JBfIgUgfQgTgfgQgIQAqgHAAglQAAgZgPgKQgQgJgfAAIhEAAIAACeIAgAAIAAhCIAHAAQAOAAAFACQAHAFAFAHIAiA0IAnAAgA+TAFQAFAFAAATIAABCIAeAAIAAhKQAAgrglAAQgVABgPARQgKgRgWgBQgWABgOARIAAgPIgcAAIAAByIAeAAIAAg4QAAgaAHgHQAGgFAKAAQALgBADAJQACAKAAAMIAABAIAfAAIAAg3QAAgnAXAAQAHgBAEAFgEgjUABfIAgAAIAAieIgeAAIAABoIhBhoIgfAAIAACeIAeAAIAAhngEgh3ABHQgFgDAAgIQAAgFAGgGIAjgKIAAAHQAAAegYAAQgGAAgGgFgA1RA/QgHgLAAgOQAAgRAHgJQAHgKAOABQAMgBAIAKQAHAJAAAQQAAAPgHALQgIAKgMAAQgOAAgHgKgA3YA/QgIgLAAgOQAAgRAIgJQAHgKANABQANgBAIAKQAHAJAAAQQAAAPgHALQgIAKgNAAQgNAAgHgKgA86AcQAAgbAWAAQAWAAABAbgA54AEIAAgoIAZAAQAaAAAHAEQAHAEAAAMQAAANgJADQgIADgZABg");
	this.shape_2.setTransform(0.025,0);

	this.shape_3 = new cjs.Shape();
	this.shape_3.graphics.f("#82251B").s().p("EgmRADHIAAmNMBMjAAAIAAGNgA1ngFQgRARAAAYQAAAdAQAQQAQAQAcAAQAZABARgSQARgQAAgbQAAgagRgQQgQgQgagBQgbAAgQARgA3vgFQgQARAAAYQAAAdAQAQQAQAQAbAAQAaABARgSQAQgQAAgbQAAgagQgQQgRgQgagBQgbAAgQARgA9MgFQgPARAAAbQAAAYAOARQANARAeAAQAlAAAMghIgegGQgFAQgOAAQgYAAgBgcIBMAAQAAhEg2AAQgZAAgOARgEghTAAQIAAAEQgIADgVAFQgdAFgGAIQgIALAAAMQAAAPALAJQAMAJAQAAQATAAARgPQABAGADAHIAeAAQgHgNAAgZIAAgjQAAgYgKgKQgKgKgcAAQgpABgJAfIAbAFQAFgOAQAAQAUAAAAAPgAxlAFQAEAFAAATIAABCIAfAAIAAhKQAAgrgmAAQgVABgOARQgKgRgXgBQgVABgPARIAAgPIgcAAIAAByIAfAAIAAg4QAAgaAGgHQAHgFAKAAQAKgBADAJQADAKAAAMIAABAIAeAAIAAg3QAAgnAXAAQAHgBAFAFgA4JBfIgUgfQgTgfgQgIQAqgHAAglQAAgZgPgKQgQgJgfAAIhEAAIAACeIAgAAIAAhCIAHAAQAOAAAFACQAHAFAFAHIAiA0IAnAAgA+TAFQAFAFAAATIAABCIAeAAIAAhKQAAgrglAAQgVABgPARQgKgRgWgBQgWABgOARIAAgPIgcAAIAAByIAeAAIAAg4QAAgaAHgHQAGgFAKAAQALgBADAJQACAKAAAMIAABAIAfAAIAAg3QAAgnAXAAQAHgBAEAFgEgjUABfIAgAAIAAieIgeAAIAABoIhBhoIgfAAIAACeIAeAAIAAhngEgh3ABHQgFgDAAgIQAAgFAGgGIAjgKIAAAHQAAAegYAAQgGAAgGgFgA1RA/QgHgLAAgOQAAgRAHgJQAHgKAOABQAMgBAIAKQAHAJAAAQQAAAPgHALQgIAKgMAAQgOAAgHgKgA3YA/QgIgLAAgOQAAgRAIgJQAHgKANABQANgBAIAKQAHAJAAAQQAAAPgHALQgIAKgNAAQgNAAgHgKgA86AcQAAgbAWAAQAWAAABAbgA54AEIAAgoIAZAAQAaAAAHAEQAHAEAAAMQAAANgJADQgIADgZABg");
	this.shape_3.setTransform(0.025,0);

	this.timeline.addTween(cjs.Tween.get({}).to({state:[{t:this.shape_1},{t:this.shape}]}).to({state:[{t:this.shape_1},{t:this.shape_2}]},1).to({state:[{t:this.shape_1},{t:this.shape_3}]},1).wait(1));

	this._renderFirstFrame();

}).prototype = p = new cjs.MovieClip();
p.nominalBounds = new cjs.Rectangle(-244.9,-19.9,489.9,39.8);


(lib.Art_N = function(mode,startPosition,loop,reversed) {
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
	this.shape.graphics.f("#FFFFFF").s().p("AAZBBIgzhUIAABUIgZAAIAAiBIAaAAIA0BWIAAhWIAZAAIAACBg");
	this.shape.setTransform(0.975,-4.775);

	this.shape_1 = new cjs.Shape();
	this.shape_1.graphics.f("#D85040").s().p("AAPEKIiEiGIhQAAIAAmNIGLAAIAAITgAAjARIAaAAIAAiBIgYAAIAABXIg0hXIgaAAIAACBIAZAAIAAhUg");
	this.shape_1.setTransform(0,0.025);

	this.shape_2 = new cjs.Shape();
	this.shape_2.graphics.f("#FF9C91").s().p("AAPEKIiEiGIhQAAIAAmNIGLAAIAAITgAAjARIAaAAIAAiBIgYAAIAABXIg0hXIgaAAIAACBIAZAAIAAhUg");
	this.shape_2.setTransform(0,0.025);

	this.shape_3 = new cjs.Shape();
	this.shape_3.graphics.f("#82251B").s().p("AAPEKIiEiGIhQAAIAAmNIGLAAIAAITgAAjARIAaAAIAAiBIgYAAIAABXIg0hXIgaAAIAACBIAZAAIAAhUg");
	this.shape_3.setTransform(0,0.025);

	this.timeline.addTween(cjs.Tween.get({}).to({state:[{t:this.shape_1},{t:this.shape}]}).to({state:[{t:this.shape},{t:this.shape_2}]},1).to({state:[{t:this.shape},{t:this.shape_3}]},1).wait(1));

	this._renderFirstFrame();

}).prototype = p = new cjs.MovieClip();
p.nominalBounds = new cjs.Rectangle(-19.8,-26.5,39.6,53.1);


(lib.Art_Max = function(mode,startPosition,loop,reversed) {
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
	this.shape.graphics.f("#D85040").s().p("AjTDHIAAmNIGnAAIAAGNgACvBJIgpg+IAmg5IgdAAIgXAnIgYgnIgdAAIAmA5IgpA+Igwh3IgZAAIgvB3IAaAAIAKgbIAvAAIAKAbIAbAAIAdAAIAagqIAbAqIAdAAgAhaBJIAWAAIAAh3IglAAIgUBQIgWhQIglAAIAAB3IAWAAIAAhdIAYBdIAYAAIAYhdgAgNAaIAQgsIAQAsg");
	this.shape.setTransform(-0.025,0);

	this.shape_1 = new cjs.Shape();
	this.shape_1.graphics.f("#FFFFFF").s().p("ACXA8IgbgqIgaAqIgdAAIAog9Iglg6IAcAAIAZAnIAXgnIAdAAIgmA6IApA9gAAqA8IgKgbIgwAAIgKAbIgZAAIAvh3IAYAAIAxB3gAgIANIAgAAIgQgsgAhWA8IAAhdIgXBdIgYAAIgYhdIAABdIgWAAIAAh3IAkAAIAWBQIAVhQIAlAAIAAB3g");
	this.shape_1.setTransform(-0.5,1.3);

	this.shape_2 = new cjs.Shape();
	this.shape_2.graphics.f("#FF9C91").s().p("AjTDHIAAmNIGnAAIAAGNgACvBJIgpg+IAmg5IgdAAIgXAnIgYgnIgdAAIAmA5IgpA+Igwh3IgZAAIgvB3IAaAAIAKgbIAvAAIAKAbIAbAAIAdAAIAagqIAbAqIAdAAgAhaBJIAWAAIAAh3IglAAIgUBQIgWhQIglAAIAAB3IAWAAIAAhdIAYBdIAYAAIAYhdgAgNAaIAQgsIAQAsg");
	this.shape_2.setTransform(-0.025,0);

	this.shape_3 = new cjs.Shape();
	this.shape_3.graphics.f("#82251B").s().p("AjTDHIAAmNIGnAAIAAGNgACvBJIgpg+IAmg5IgdAAIgXAnIgYgnIgdAAIAmA5IgpA+Igwh3IgZAAIgvB3IAaAAIAKgbIAvAAIAKAbIAbAAIAdAAIAagqIAbAqIAdAAgAhaBJIAWAAIAAh3IglAAIgUBQIgWhQIglAAIAAB3IAWAAIAAhdIAYBdIAYAAIAYhdgAgNAaIAQgsIAQAsg");
	this.shape_3.setTransform(-0.025,0);

	this.timeline.addTween(cjs.Tween.get({}).to({state:[{t:this.shape_1},{t:this.shape}]}).to({state:[{t:this.shape_1},{t:this.shape_2}]},1).to({state:[{t:this.shape_1},{t:this.shape_3}]},1).wait(1));

	this._renderFirstFrame();

}).prototype = p = new cjs.MovieClip();
p.nominalBounds = new cjs.Rectangle(-21.2,-19.9,42.4,39.8);


(lib.Art_Index = function(mode,startPosition,loop,reversed) {
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
	this.shape.graphics.f("#D85040").s().p("AjfEKIAAoTIG/AAIAAGNIhcAAIiECGgAATg8QgQAQAAAZQgBAdARAQQAQAQAaAAQAaAAARgSQARgRAAgZQAAgagRgRQgRgQgaAAQgbAAgPARgACRAnIAeAAIAAgeIgeAAgAg3AnIAgAAIAAieIgeAAIAABqIhBhqIgfAAIAACeIAeAAIAAhmgAApAHQgHgJAAgPQAAgRAHgJQAHgJANAAQAOAAAIAJQAHAJAAAQQAAAQgHAJQgIAKgOAAQgMAAgIgKg");
	this.shape.setTransform(0,0.025);

	this.shape_1 = new cjs.Shape();
	this.shape_1.graphics.f("#FFFFFF").s().p("AAGBBQgPgQAAgeQAAgYAPgQQAQgRAbAAQAaAAARARQAQARAAAYQAAAagQARQgRASgaAAQgaAAgRgQgAAdgDQgHAHAAARQAAAPAHAKQAHAKANAAQANAAAIgKQAHgJABgRQgBgQgHgHQgIgKgNAAQgNAAgHAKgACEBPIAAgfIAeAAIAAAfgAhDBPIhAhnIAABnIgfAAIAAifIAgAAIBABpIAAhpIAeAAIAACfg");
	this.shape_1.setTransform(1.25,-3.9);

	this.shape_2 = new cjs.Shape();
	this.shape_2.graphics.f("#FF9C91").s().p("AjfEKIAAoTIG/AAIAAGNIhcAAIiECGgAATg8QgQAQAAAZQgBAdARAQQAQAQAaAAQAaAAARgSQARgRAAgZQAAgagRgRQgRgQgaAAQgbAAgPARgACRAnIAeAAIAAgeIgeAAgAg3AnIAgAAIAAieIgeAAIAABqIhBhqIgfAAIAACeIAeAAIAAhmgAApAHQgHgJAAgPQAAgRAHgJQAHgJANAAQAOAAAIAJQAHAJAAAQQAAAQgHAJQgIAKgOAAQgMAAgIgKg");
	this.shape_2.setTransform(0,0.025);

	this.shape_3 = new cjs.Shape();
	this.shape_3.graphics.f("#82251B").s().p("AjfEKIAAoTIG/AAIAAGNIhcAAIiECGgAATg8QgQAQAAAZQgBAdARAQQAQAQAaAAQAaAAARgSQARgRAAgZQAAgagRgRQgRgQgaAAQgbAAgPARgACRAnIAeAAIAAgeIgeAAgAg3AnIAgAAIAAieIgeAAIAABqIhBhqIgfAAIAACeIAeAAIAAhmgAApAHQgHgJAAgPQAAgRAHgJQAHgJANAAQAOAAAIAJQAHAJAAAQQAAAQgHAJQgIAKgOAAQgMAAgIgKg");
	this.shape_3.setTransform(0,0.025);

	this.timeline.addTween(cjs.Tween.get({}).to({state:[{t:this.shape_1},{t:this.shape}]}).to({state:[{t:this.shape_1},{t:this.shape_2}]},1).to({state:[{t:this.shape_1},{t:this.shape_3}]},1).wait(1));

	this._renderFirstFrame();

}).prototype = p = new cjs.MovieClip();
p.nominalBounds = new cjs.Rectangle(-22.4,-26.5,44.8,53.1);


(lib.TemplateListMuitPlayer = function(mode,startPosition,loop,reversed) {
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
		// ===== เขียนใน Frame 1 ภายใน Symbol: TemplateList =====
		var self = this;
		self.stop();
		
		self._data = null;
		self.cursor = "pointer";
		
		// 1. ฟังก์ชันรับข้อมูลตัวแปร (เรียกโดยตรงตอน Clone)
		self.setData = function (data) {
		    if (!data) return;
		    self._data = data;
		
		    // ผูกค่าตัวแปรลง Dynamic Text ตาม ID ที่มีอยู่จริงใน Symbol
		    if (self.txt_Index) {
		        self.txt_Index.text = data.index !== undefined ? data.index : "";
		    }
		    if (self.txt_Name) {
		        self.txt_Name.text = data.name || "";
		    }
		    if (self.txt_Max) {
		        self.txt_Max.text = data.maxroom !== undefined ? data.maxroom : "-";
		    }
		    if (self.txt_Current) {
		        self.txt_Current.text = data.currentroom !== undefined ? data.currentroom : "-";
		    }
		
		    if (self.stage) self.stage.update();
		};
		
		// 2. จัดการ Event Hover ภายในตัวเอง ส่งต่อไปที่ Global UIPreview
		self.removeAllEventListeners("rollover");
		self.removeAllEventListeners("rollout");
		
		self.on("rollover", function () {
		    if (self._data && window.UIPreview && window.UIPreview.show) {
		        window.UIPreview.show(self._data);
		    }
		});
		
		self.on("rollout", function () {
		    if (window.UIPreview && window.UIPreview.clear) {
		        window.UIPreview.clear();
		    }
		});
	}

	// actions tween:
	this.timeline.addTween(cjs.Tween.get(this).call(this.frame_0).wait(1));

	// Index_n
	this.txt_Index = new cjs.Text("NN", "bold 37px 'Browallia New'", "#FFFFFF");
	this.txt_Index.name = "txt_Index";
	this.txt_Index.textAlign = "center";
	this.txt_Index.lineHeight = 56;
	this.txt_Index.parent = this;
	this.txt_Index.setTransform(-247.4,-22.4,0.8366,0.8366);

	this.timeline.addTween(cjs.Tween.get(this.txt_Index).wait(1));

	// Layer_5
	this.txt_Current = new cjs.Text("NN ", "bold 29px 'Browallia New'", "#FFFFFF");
	this.txt_Current.name = "txt_Current";
	this.txt_Current.textAlign = "center";
	this.txt_Current.lineHeight = 44;
	this.txt_Current.parent = this;
	this.txt_Current.setTransform(246.15,-11.05,0.8366,0.8366);

	this.txt_Max = new cjs.Text("NN ", "bold 29px 'Browallia New'", "#FFFFFF");
	this.txt_Max.name = "txt_Max";
	this.txt_Max.textAlign = "center";
	this.txt_Max.lineHeight = 44;
	this.txt_Max.parent = this;
	this.txt_Max.setTransform(209.65,-22.75,0.8366,0.8366);

	this.timeline.addTween(cjs.Tween.get({}).to({state:[{t:this.txt_Max},{t:this.txt_Current}]}).wait(1));

	// Layer_6
	this.txt_Name = new cjs.Text("NAME ROOM", "bold 37px 'Browallia New'", "#FFFFFF");
	this.txt_Name.name = "txt_Name";
	this.txt_Name.lineHeight = 56;
	this.txt_Name.lineWidth = 473;
	this.txt_Name.parent = this;
	this.txt_Name.setTransform(-215.75,-23.05,0.8366,0.8366);

	this.timeline.addTween(cjs.Tween.get(this.txt_Name).wait(1));

	// Layer_3
	this.ListRoomArt = new lib.BtnListRoomMuitPlayer();
	this.ListRoomArt.name = "ListRoomArt";
	this.ListRoomArt.setTransform(-2.95,-3.8,0.8366,0.8366,0,0,0,-0.1,-0.2);
	new cjs.ButtonHelper(this.ListRoomArt, 0, 1, 2, false, new lib.BtnListRoomMuitPlayer(), 3);

	this.timeline.addTween(cjs.Tween.get(this.ListRoomArt).wait(1));

	this._renderFirstFrame();

}).prototype = getMCSymbolPrototype(lib.TemplateListMuitPlayer, new cjs.Rectangle(-264.8,-26.1,526.3,48.400000000000006), null);


(lib.TemplateListAlone = function(mode,startPosition,loop,reversed) {
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
		// ===== เขียนใน Frame 1 ภายใน Symbol: TemplateList =====
		var self = this;
		self.stop();
		
		self._data = null;
		self.cursor = "pointer";
		
		// 1. เปิดให้ชิ้นส่วนข้างใน (เช่น Art Button) แสดงสถานะ Hover/Down เพื่อ UX
		self.mouseChildren = true;
		
		// 2. ปิดการรับเมาส์ของ Text ทั้งหมดเพื่อให้เมาส์ "Point ทะลุ" ไปถึงปุ่ม Art ด้านหลัง 100%
		var textFields = [self.txt_Index, self.txt_Name, self.txt_Max, self.txt_Current];
		textFields.forEach(function (tf) {
		    if (tf) {
		        tf.mouseEnabled = false;
		    }
		});
		
		// 3. ฟังก์ชันรับข้อมูลตัวแปร (เรียกโดยตรงตอน Clone)
		self.setData = function (data) {
		    if (!data) return;
		    self._data = data;
		
		    if (self.txt_Index) {
		        self.txt_Index.text = data.index !== undefined ? data.index : "";
		        self.txt_Index.mouseEnabled = false;
		    }
		    if (self.txt_Name) {
		        self.txt_Name.text = data.name || "";
		        self.txt_Name.mouseEnabled = false;
		    }
		    if (self.txt_Max) {
		        self.txt_Max.text = data.maxroom !== undefined ? data.maxroom : "-";
		        self.txt_Max.mouseEnabled = false;
		    }
		    if (self.txt_Current) {
		        self.txt_Current.text = data.currentroom !== undefined ? data.currentroom : "-";
		        self.txt_Current.mouseEnabled = false;
		    }
		
		    if (self.stage) self.stage.update();
		};
		
		// 2. จัดการ Event Hover ภายในตัวเอง ส่งต่อไปที่ Global UIPreview
		self.removeAllEventListeners("rollover");
		self.removeAllEventListeners("rollout");
		
		self.on("rollover", function () {
		    if (self._data && window.UIPreview && window.UIPreview.show) {
		        window.UIPreview.show(self._data);
		    }
		});
		
		self.on("rollout", function () {
		    if (window.UIPreview && window.UIPreview.clear) {
		        window.UIPreview.clear();
		    }
		});
		
		// 3. เมื่อคลิกเลือกแถวรายการ สั่งเข้าห้อง InRoom ผ่าน Global Bus
		self.removeAllEventListeners("click");
		self.on("click", function (evt) {
		    if (evt) evt.stopPropagation();
		    console.log("🖱️ [CLICK TEMPLATE ROW] คลิกแถวต้นแบบ:", self._data);
		    if (self._data && window.UIRoom && window.UIRoom.enter) {
		        window.UIRoom.enter(self._data);
		    } else {
		        console.warn("⚠️ ไม่พบข้อมูลแถวหรือ window.UIRoom.enter");
		    }
		});
	}

	// actions tween:
	this.timeline.addTween(cjs.Tween.get(this).call(this.frame_0).wait(1));

	// Index_n
	this.txt_Index = new cjs.Text("NN", "bold 37px 'Browallia New'", "#FFFFFF");
	this.txt_Index.name = "txt_Index";
	this.txt_Index.textAlign = "center";
	this.txt_Index.lineHeight = 56;
	this.txt_Index.parent = this;
	this.txt_Index.setTransform(-242.65,-21.4,0.8262,0.8262);

	this.timeline.addTween(cjs.Tween.get(this.txt_Index).wait(1));

	// Layer_6
	this.txt_Name = new cjs.Text("NAME ROOM", "bold 37px 'Browallia New'", "#FFFFFF");
	this.txt_Name.name = "txt_Name";
	this.txt_Name.lineHeight = 56;
	this.txt_Name.lineWidth = 473;
	this.txt_Name.parent = this;
	this.txt_Name.setTransform(-211.4,-22,0.8262,0.8262);

	this.timeline.addTween(cjs.Tween.get(this.txt_Name).wait(1));

	// Layer_3
	this.ListRoomArt = new lib.BtnListRoomAlone();
	this.ListRoomArt.name = "ListRoomArt";
	this.ListRoomArt.setTransform(-1.2,-2.95,0.8262,0.8262,0,0,0,-0.1,-0.1);
	new cjs.ButtonHelper(this.ListRoomArt, 0, 1, 2, false, new lib.BtnListRoomAlone(), 3);

	this.timeline.addTween(cjs.Tween.get(this.ListRoomArt).wait(1));

	// Layer_2
	this.shape = new cjs.Shape();
	this.shape.graphics.f("rgba(77,20,13,0)").s().p("EgotAFEIAAqHMBRbAAAIAAKHg");
	this.shape.setTransform(-0.65,-0.025);

	this.timeline.addTween(cjs.Tween.get(this.shape).wait(1));

	this._renderFirstFrame();

}).prototype = getMCSymbolPrototype(lib.TemplateListAlone, new cjs.Rectangle(-261.2,-32.4,521.2,64.8), null);


(lib.TemplateInRoom = function(mode,startPosition,loop,reversed) {
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
		// ===== เขียนใน Frame 1 ภายใน Symbol: TemplateInRoom =====
		var self = this;
		self.stop();
		
		self._data = null;
		
		[self.txt_Index, self.txt_PlayerName, self.txt_Role].forEach(function (tf) {
		    if (tf) tf.mouseEnabled = false;
		});
		
		self.setData = function (player) {
		    if (!player) return;
		    self._data = player;
		
		    if (self.txt_Index)      self.txt_Index.text = player.index !== undefined ? player.index : "";
		    if (self.txt_PlayerName) self.txt_PlayerName.text = player.name || "";
		    if (self.txt_Role)       self.txt_Role.text = player.isHost ? "HOST" : "GUEST";
		
		    var myName = (window.UIInput && window.UIInput.value && window.UIInput.value.trim()) || "Host Player";
		    var amIHost = (window.UIRoom && window.UIRoom.players && window.UIRoom.players.length > 0 && 
		                   (window.UIRoom.players[0].name === myName || window.UIRoom.players[0].isHost));
		
		    var kickBtn = self.btn_Kick || self.btn_kick;
		    if (kickBtn) {
		        kickBtn.visible = (amIHost && !player.isHost);
		        kickBtn.cursor = "pointer";
		        kickBtn.removeAllEventListeners("click");
		        kickBtn.on("click", function (evt) {
		            if (evt) evt.stopPropagation();
		            if (window.UIRoom && window.UIRoom.kickPlayer) {
		                window.UIRoom.kickPlayer(self._data.index);
		            }
		        });
		    }
		
		    if (amIHost && !player.isHost) {
		        self.cursor = "pointer";
		        self.removeAllEventListeners("click");
		        self.on("click", function (evt) {
		            if (evt) evt.stopPropagation();
		            console.log("👢 Host สั่งเตะ Guest ออกจากห้อง:", self._data.name);
		            if (window.UIRoom && window.UIRoom.kickPlayer) {
		                window.UIRoom.kickPlayer(self._data.index);
		            }
		        });
		    } else {
		        self.cursor = "default";
		        self.removeAllEventListeners("click");
		    }
		
		    if (self.stage) self.stage.update();
		};
	}

	// actions tween:
	this.timeline.addTween(cjs.Tween.get(this).call(this.frame_0).wait(1));

	// Index_n
	this.txt_Index = new cjs.Text("NN", "bold 37px 'Browallia New'", "#FFFFFF");
	this.txt_Index.name = "txt_Index";
	this.txt_Index.textAlign = "center";
	this.txt_Index.lineHeight = 56;
	this.txt_Index.parent = this;
	this.txt_Index.setTransform(-242.65,-21.4,0.8262,0.8262);

	this.timeline.addTween(cjs.Tween.get(this.txt_Index).wait(1));

	// Layer_6
	this.txt_Role = new cjs.Text("Role", "bold 37px 'Browallia New'", "#FFFFFF");
	this.txt_Role.name = "txt_Role";
	this.txt_Role.lineHeight = 56;
	this.txt_Role.lineWidth = 191;
	this.txt_Role.parent = this;
	this.txt_Role.setTransform(98.2,-22,0.8262,0.8262);

	this.txt_PlayerName = new cjs.Text("NAME ROOM", "bold 37px 'Browallia New'", "#FFFFFF");
	this.txt_PlayerName.name = "txt_PlayerName";
	this.txt_PlayerName.lineHeight = 56;
	this.txt_PlayerName.lineWidth = 354;
	this.txt_PlayerName.parent = this;
	this.txt_PlayerName.setTransform(-211.4,-22,0.8262,0.8262);

	this.timeline.addTween(cjs.Tween.get({}).to({state:[{t:this.txt_PlayerName},{t:this.txt_Role}]}).wait(1));

	// Layer_3
	this.ListRoomArt = new lib.BtnLisArtInRoom();
	this.ListRoomArt.name = "ListRoomArt";
	this.ListRoomArt.setTransform(-1.2,-2.95,0.8262,0.8262,0,0,0,-0.1,-0.1);
	new cjs.ButtonHelper(this.ListRoomArt, 0, 1, 2, false, new lib.BtnLisArtInRoom(), 3);

	this.timeline.addTween(cjs.Tween.get(this.ListRoomArt).wait(1));

	// Layer_2
	this.shape = new cjs.Shape();
	this.shape.graphics.f("rgba(77,20,13,0)").s().p("EgotAFEIAAqHMBRbAAAIAAKHg");
	this.shape.setTransform(-0.65,-0.025);

	this.timeline.addTween(cjs.Tween.get(this.shape).wait(1));

	this._renderFirstFrame();

}).prototype = getMCSymbolPrototype(lib.TemplateInRoom, new cjs.Rectangle(-261.2,-32.4,521.2,64.8), null);


(lib.Select_JoinRoom_player = function(mode,startPosition,loop,reversed) {
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
	this.Logo_Resource = new lib.IconMeun("single",3);
	this.Logo_Resource.name = "Logo_Resource";
	this.Logo_Resource.setTransform(1.4,0.6,1,1,0,0,0,0.4,0.5);

	this.timeline.addTween(cjs.Tween.get(this.Logo_Resource).wait(1).to({startPosition:3},0).wait(1).to({y:4.45},0).wait(1));

	// Layer_1
	this.Btn_Press_false = new lib.Btn_Color_2("single",0);
	this.Btn_Press_false.name = "Btn_Press_false";
	this.Btn_Press_false.setTransform(-0.25,5.6);

	this.timeline.addTween(cjs.Tween.get(this.Btn_Press_false).wait(1).to({startPosition:1},0).wait(1).to({startPosition:3},0).wait(1));

	this._renderFirstFrame();

}).prototype = p = new cjs.MovieClip();
p.nominalBounds = new cjs.Rectangle(-44.7,-29.4,89,64.1);


(lib.Select_Alone_player = function(mode,startPosition,loop,reversed) {
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
	this.Logo_Resource = new lib.IconMeun("single",2);
	this.Logo_Resource.name = "Logo_Resource";
	this.Logo_Resource.setTransform(1.4,0.6,1,1,0,0,0,0.4,0.5);

	this.timeline.addTween(cjs.Tween.get(this.Logo_Resource).wait(1).to({startPosition:2},0).wait(1).to({y:4.45},0).wait(1));

	// Layer_1
	this.Btn_Press_false = new lib.Btn_Color_2("single",0);
	this.Btn_Press_false.name = "Btn_Press_false";
	this.Btn_Press_false.setTransform(-0.25,5.6);

	this.timeline.addTween(cjs.Tween.get(this.Btn_Press_false).wait(1).to({startPosition:1},0).wait(1).to({startPosition:3},0).wait(1));

	this._renderFirstFrame();

}).prototype = p = new cjs.MovieClip();
p.nominalBounds = new cjs.Rectangle(-44.7,-29.4,89,64.1);


(lib.PanelLogUpdateAnimation = function(mode,startPosition,loop,reversed) {
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
	this.frame_9 = function() {
		this.stop();
	}
	this.frame_19 = function() {
		this.stop();
	}

	// actions tween:
	this.timeline.addTween(cjs.Tween.get(this).wait(9).call(this.frame_9).wait(10).call(this.frame_19).wait(1));

	// Layer_1
	this.PanelLogUpdate = new lib.Ui_3("single",1);
	this.PanelLogUpdate.name = "PanelLogUpdate";
	this.PanelLogUpdate.setTransform(-135.25,-230.8);

	this.timeline.addTween(cjs.Tween.get(this.PanelLogUpdate).to({x:-412},9,cjs.Ease.backInOut).wait(1).to({startPosition:1},0).to({x:-135.05},9,cjs.Ease.backInOut).wait(1));

	this._renderFirstFrame();

}).prototype = p = new cjs.MovieClip();
p.nominalBounds = new cjs.Rectangle(-421.6,-166.7,566.7,333.4);


(lib.ListPanelMuitPlayer = function(mode,startPosition,loop,reversed) {
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
		// ===== เขียนใน Frame 1 ของ MovieClip กลุ่ม List (Multiplayer) =====
		var self = this;
		self.stop();
		
		var JSON_URL = "data/folder2/multiplayer_list.json";
		var roomData = [];
		
		// 1. คอนเทนเนอร์เนื้อหา (ระบบ Safety ป้องกันการลบกราฟิกแม่)
		var content = self.list_content;
		if (!content) {
		    if (!self._autoRowsContainer) {
		        self._autoRowsContainer = new createjs.Container();
		        self.addChild(self._autoRowsContainer);
		        if (self.trail_bar) self.addChild(self.trail_bar);
		        if (self.handle_bar) self.addChild(self.handle_bar);
		    }
		    content = self._autoRowsContainer;
		}
		
		var trail = self.trail_bar;
		var handle = self.handle_bar;
		
		var ITEM_HEIGHT = 45;
		var VIEW_HEIGHT = 320;
		var contentStartY = content.y;
		
		var trailTop = trail ? trail.y : 0;
		var trailHeight = trail ? (trail.nominalBounds ? trail.nominalBounds.height * trail.scaleY : 300) : 300;
		var handleHeight = handle ? (handle.nominalBounds ? handle.nominalBounds.height * handle.scaleY : 40) : 40;
		var handleMinY = trailTop;
		var handleMaxY = trailTop + trailHeight - handleHeight;
		
		function renderList(items) {
		    content.removeAllChildren();
		    content.y = contentStartY;
		
		    var masterRow = self.Template || self.template_row || (self.list_content && self.list_content.Template);
		    var RowClass = (masterRow && masterRow.constructor) || 
		                   lib.TemplateList || lib.Template || lib.MultiItemTemplate || lib.ItemTemplate;
		
		    if (masterRow) {
		        masterRow.visible = false;
		    }
		
		    if (!RowClass) {
		        console.warn("⚠️ แนะนำ: วางแถวต้นแบบไว้บน Stage 1 ชิ้นแล้วตั้งชื่อ Instance Name ว่า 'Template'");
		    }
		
		    items.forEach(function (data, i) {
		        var row;
		        if (RowClass) {
		            row = new RowClass();
		            if (typeof row.frame_0 === "function") row.frame_0();
		            if (typeof row.setData === "function") row.setData(data);
		            if (row.txt_Index)   row.txt_Index.text = data.index !== undefined ? data.index : (i + 1);
		            if (row.txt_Name)    row.txt_Name.text = data.name || "";
		            if (row.txt_Max)     row.txt_Max.text = data.maxroom !== undefined ? data.maxroom : "-";
		            if (row.txt_Current) row.txt_Current.text = data.currentroom !== undefined ? data.currentroom : "-";
		
		            row.cursor = "pointer";
		            row.removeAllEventListeners("rollover");
		            row.removeAllEventListeners("rollout");
		            row.on("rollover", function () {
		                if (window.UIPreview && window.UIPreview.show) window.UIPreview.show(data);
		            });
		            row.on("rollout", function () {
		                if (window.UIPreview && window.UIPreview.clear) window.UIPreview.clear();
		            });
		        } else {
		            row = new createjs.Container();
		            var bg = new createjs.Shape();
		            bg.graphics.beginFill("rgba(255,255,255,0.08)").drawRoundRect(0, 0, 380, 38, 6);
		            var t = new createjs.Text((data.index || (i + 1)) + ".  " + (data.name || "") + "  [" + (data.currentroom || 0) + "/" + (data.maxroom || 0) + "]", "13px sans-serif", "#ffffff");
		            t.x = 12; t.y = 10;
		            row.addChild(bg, t);
		
		            row.cursor = "pointer";
		            row.on("rollover", function () {
		                if (window.UIPreview && window.UIPreview.show) window.UIPreview.show(data);
		            });
		            row.on("rollout", function () {
		                if (window.UIPreview && window.UIPreview.clear) window.UIPreview.clear();
		            });
		        }
		
		        row.y = i * ITEM_HEIGHT;
		        content.addChild(row);
		    });
		
		    updateScrollState(items.length);
		    if (self.stage) self.stage.update();
		}
		
		var maxScrollDist = 0;
		
		function updateScrollState(itemCount) {
		    var totalHeight = itemCount * ITEM_HEIGHT;
		    maxScrollDist = Math.max(0, totalHeight - VIEW_HEIGHT);
		
		    if (maxScrollDist <= 0) {
		        if (trail) trail.visible = false;
		        if (handle) handle.visible = false;
		        content.y = contentStartY;
		    } else {
		        if (trail) trail.visible = true;
		        if (handle) {
		            handle.visible = true;
		            handle.y = handleMinY;
		        }
		    }
		}
		
		function setScrollByRatio(ratio) {
		    ratio = Math.max(0, Math.min(1, ratio));
		    content.y = contentStartY - (ratio * maxScrollDist);
		    if (handle) {
		        handle.y = handleMinY + (ratio * (handleMaxY - handleMinY));
		    }
		    if (self.stage) self.stage.update();
		}
		
		if (handle) {
		    handle.cursor = "pointer";
		    handle.removeAllEventListeners("pressmove");
		    handle.on("pressmove", function (evt) {
		        if (maxScrollDist <= 0) return;
		        var pt = self.globalToLocal(evt.stageX, evt.stageY);
		        var targetY = Math.max(handleMinY, Math.min(handleMaxY, pt.y - (handleHeight / 2)));
		        var ratio = (targetY - handleMinY) / (handleMaxY - handleMinY);
		        setScrollByRatio(ratio);
		    });
		}
		
		function handleWheel(e) {
		    if (maxScrollDist <= 0) return;
		    var currentDist = contentStartY - content.y;
		    var delta = (e.deltaY || e.wheelDelta || 0);
		    var step = delta > 0 ? 30 : -30;
		    var newDist = Math.max(0, Math.min(maxScrollDist, currentDist + step));
		    var ratio = newDist / maxScrollDist;
		    setScrollByRatio(ratio);
		}
		
		if (!self._wheelBound) {
		    self._wheelBound = true;
		    window.addEventListener("wheel", function (e) {
		        if (self.stage) {
		            var pt = self.globalToLocal(self.stage.mouseX, self.stage.mouseY);
		            if (pt.x >= 0 && pt.x <= 400 && pt.y >= 0 && pt.y <= VIEW_HEIGHT) {
		                e.preventDefault();
		                handleWheel(e);
		            }
		        }
		    }, { passive: false });
		}
		
		function updateSortAndRender(field, order) {
		    roomData = window.UISort.sortArray(roomData, field, order);
		    renderList(roomData);
		}
		
		window.UISort.off("SORT_CHANGE", self._onSortChange);
		self._onSortChange = function (evt) {
		    updateSortAndRender(evt.field, evt.order);
		};
		window.UISort.on("SORT_CHANGE", self._onSortChange);
		
		fetch(JSON_URL)
		    .then(function (res) { return res.json(); })
		    .then(function (data) {
		        console.log("✅ โหลด JSON สำเร็จ:", JSON_URL);
		        roomData = Array.isArray(data) ? data : (data.list || []);
		        updateSortAndRender(window.UISort.field, window.UISort.order);
		    })
		    .catch(function (err) {
		        console.warn("⚠️ ไม่พบไฟล์ JSON (ใช้ข้อมูล Fallback 10 รายการ):", err);
		        roomData = [
		            { index: 1, name: "Asia East Official #1", maxroom: 16, currentroom: 6, lore: "Dedicated low-latency server in Tokyo.", image: "server_tokyo" },
		            { index: 2, name: "Guild War Coliseum A", maxroom: 32, currentroom: 28, lore: "Official faction warfare battleground.", image: "server_guild" },
		            { index: 3, name: "Casual Sandbox & Hangout", maxroom: 10, currentroom: 3, lore: "Peaceful non-pvp lobby with infinite respawns.", image: "server_casual" },
		            { index: 4, name: "Infernal Dragon Raid", maxroom: 12, currentroom: 12, lore: "Mythic tier 12-player raid chamber.", image: "server_dragon" },
		            { index: 5, name: "Underground Deathmatch", maxroom: 20, currentroom: 14, lore: "Fast-paced free-for-all bloodbath.", image: "server_deathmatch" },
		            { index: 6, name: "Frozen Citadel Siege", maxroom: 24, currentroom: 19, lore: "Tactical fortress breach mode.", image: "server_citadel" },
		            { index: 7, name: "Speedrun Cooperative Hub", maxroom: 4, currentroom: 2, lore: "Duo and quad dungeon time-trials.", image: "server_speedrun" },
		            { index: 8, name: "Pirate Cove Escort", maxroom: 16, currentroom: 11, lore: "Payload escort mission along coast.", image: "server_pirate" },
		            { index: 9, name: "Cyber District Hide & Seek", maxroom: 12, currentroom: 8, lore: "Hunters tracking shape-shifting prop fugitives.", image: "server_cyber" },
		            { index: 10, name: "Championship Grand Final", maxroom: 10, currentroom: 10, lore: "Spectated tournament broadcast lobby.", image: "server_final" }
		        ];
		        updateSortAndRender(window.UISort.field, window.UISort.order);
		    });
	}

	// actions tween:
	this.timeline.addTween(cjs.Tween.get(this).call(this.frame_0).wait(1));

	// Layer_5 (mask)
	var mask = new cjs.Shape();
	mask._off = true;
	mask.graphics.p("AUKYTMAAAgwlIBXAAMAAAAwlg");
	mask.setTransform(137.65,131.25);

	// Layer_6
	this.handle_bar = new lib.handle_bar();
	this.handle_bar.name = "handle_bar";
	this.handle_bar.setTransform(270.9,-6.85);

	var maskedShapeInstanceList = [this.handle_bar];

	for(var shapedInstanceItr = 0; shapedInstanceItr < maskedShapeInstanceList.length; shapedInstanceItr++) {
		maskedShapeInstanceList[shapedInstanceItr].mask = mask;
	}

	this.timeline.addTween(cjs.Tween.get(this.handle_bar).wait(1));

	// Layer_1
	this.Template = new lib.TemplateListMuitPlayer();
	this.Template.name = "Template";
	this.Template.setTransform(-0.15,-4.6);

	this.timeline.addTween(cjs.Tween.get(this.Template).wait(1));

	this._renderFirstFrame();

}).prototype = getMCSymbolPrototype(lib.ListPanelMuitPlayer, new cjs.Rectangle(-264.9,-30.6,538.7,48.3), null);


(lib.ListPanelAlone = function(mode,startPosition,loop,reversed) {
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
		// ===== เขียนใน Frame 1 ของ MovieClip กลุ่ม List (Alone) =====
		var self = this;
		self.stop();
		
		var JSON_URL = "data/folder1/alone_list.json";
		var roomData = [];
		
		// 1. คอนเทนเนอร์เนื้อหา (ระบบ Safety ป้องกันการลบกราฟิกแม่)
		var content = self.list_content;
		if (!content) {
		    if (!self._autoRowsContainer) {
		        self._autoRowsContainer = new createjs.Container();
		        self.addChild(self._autoRowsContainer);
		        if (self.trail_bar) self.addChild(self.trail_bar);
		        if (self.handle_bar) self.addChild(self.handle_bar);
		    }
		    content = self._autoRowsContainer;
		}
		
		var trail = self.trail_bar;
		var handle = self.handle_bar;
		
		var ITEM_HEIGHT = 45;
		var VIEW_HEIGHT = 320;
		var contentStartY = content.y;
		
		var trailTop = trail ? trail.y : 0;
		var trailHeight = trail ? (trail.nominalBounds ? trail.nominalBounds.height * trail.scaleY : 300) : 300;
		var handleHeight = handle ? (handle.nominalBounds ? handle.nominalBounds.height * handle.scaleY : 40) : 40;
		var handleMinY = trailTop;
		var handleMaxY = trailTop + trailHeight - handleHeight;
		
		function renderList(items) {
		    content.removeAllChildren();
		    content.y = contentStartY;
		
		    var masterRow = self.Template || self.template_row || (self.list_content && self.list_content.Template);
		    var RowClass = (masterRow && masterRow.constructor) || 
		                   lib.TemplateList || lib.Template || lib.ItemTemplate || lib.AloneItemTemplate;
		
		    if (masterRow) {
		        masterRow.visible = false;
		    }
		
		    if (!RowClass) {
		        console.warn("⚠️ แนะนำ: วางแถวต้นแบบไว้บน Stage 1 ชิ้นแล้วตั้งชื่อ Instance Name ว่า 'Template'");
		    }
		
		    items.forEach(function (data, i) {
		        var row;
		        if (RowClass) {
		            row = new RowClass();
		            if (typeof row.frame_0 === "function") row.frame_0();
		            if (typeof row.setData === "function") row.setData(data);
		            if (row.txt_Index)   row.txt_Index.text = data.index !== undefined ? data.index : (i + 1);
		            if (row.txt_Name)    row.txt_Name.text = data.name || "";
		            if (row.txt_Max)     row.txt_Max.text = data.maxroom !== undefined ? data.maxroom : "-";
		            if (row.txt_Current) row.txt_Current.text = data.currentroom !== undefined ? data.currentroom : "-";
		
		            // ผูกระบบ Hover ส่งไป Preview กลาง และคลิกเข้าห้อง
		            row.cursor = "pointer";
		            row.removeAllEventListeners("rollover");
		            row.removeAllEventListeners("rollout");
		            row.removeAllEventListeners("click");
		
		            row.on("rollover", function () {
		                if (window.UIPreview && window.UIPreview.show) window.UIPreview.show(data);
		            });
		            row.on("rollout", function () {
		                if (window.UIPreview && window.UIPreview.clear) window.UIPreview.clear();
		            });
		            row.on("click", function (evt) {
		                if (evt) evt.stopPropagation();
		                console.log("🖱️ [CLICK ROOM ALONE] คลิกเลือกห้อง:", data);
		                if (window.UIRoom && window.UIRoom.enter) {
		                    window.UIRoom.enter(data);
		                } else {
		                    console.warn("⚠️ ไม่พบ window.UIRoom หรือฟังก์ชัน enter ใน Global");
		                }
		            });
		        } else {
		            row = new createjs.Container();
		            row.mouseChildren = false;
		            var bg = new createjs.Shape();
		            bg.graphics.beginFill("rgba(255,255,255,0.08)").drawRoundRect(0, 0, 360, 38, 6);
		            var t = new createjs.Text((data.index || (i + 1)) + ".  " + (data.name || ""), "14px sans-serif", "#ffffff");
		            t.x = 12; t.y = 10;
		            row.addChild(bg, t);
		
		            row.cursor = "pointer";
		            row.removeAllEventListeners("rollover");
		            row.removeAllEventListeners("rollout");
		            row.removeAllEventListeners("click");
		
		            row.on("rollover", function () {
		                if (window.UIPreview && window.UIPreview.show) window.UIPreview.show(data);
		            });
		            row.on("rollout", function () {
		                if (window.UIPreview && window.UIPreview.clear) window.UIPreview.clear();
		            });
		            row.on("click", function (evt) {
		                if (evt) evt.stopPropagation();
		                console.log("🖱️ [CLICK ROOM ALONE FALLBACK] คลิกเลือกห้อง:", data);
		                if (window.UIRoom && window.UIRoom.enter) {
		                    window.UIRoom.enter(data);
		                } else {
		                    console.warn("⚠️ ไม่พบ window.UIRoom หรือฟังก์ชัน enter ใน Global");
		                }
		            });
		        }
		
		        row.y = i * ITEM_HEIGHT;
		        content.addChild(row);
		    });
		
		    updateScrollState(items.length);
		    if (self.stage) self.stage.update();
		}
		
		var maxScrollDist = 0;
		
		function updateScrollState(itemCount) {
		    var totalHeight = itemCount * ITEM_HEIGHT;
		    maxScrollDist = Math.max(0, totalHeight - VIEW_HEIGHT);
		
		    if (maxScrollDist <= 0) {
		        if (trail) trail.visible = false;
		        if (handle) handle.visible = false;
		        content.y = contentStartY;
		    } else {
		        if (trail) trail.visible = true;
		        if (handle) {
		            handle.visible = true;
		            handle.y = handleMinY;
		        }
		    }
		}
		
		function setScrollByRatio(ratio) {
		    ratio = Math.max(0, Math.min(1, ratio));
		    content.y = contentStartY - (ratio * maxScrollDist);
		    if (handle) {
		        handle.y = handleMinY + (ratio * (handleMaxY - handleMinY));
		    }
		    if (self.stage) self.stage.update();
		}
		
		if (handle) {
		    handle.cursor = "pointer";
		    handle.removeAllEventListeners("pressmove");
		    handle.on("pressmove", function (evt) {
		        if (maxScrollDist <= 0) return;
		        var pt = self.globalToLocal(evt.stageX, evt.stageY);
		        var targetY = Math.max(handleMinY, Math.min(handleMaxY, pt.y - (handleHeight / 2)));
		        var ratio = (targetY - handleMinY) / (handleMaxY - handleMinY);
		        setScrollByRatio(ratio);
		    });
		}
		
		function handleWheel(e) {
		    if (maxScrollDist <= 0) return;
		    var currentDist = contentStartY - content.y;
		    var delta = (e.deltaY || e.wheelDelta || 0);
		    var step = delta > 0 ? 30 : -30;
		    var newDist = Math.max(0, Math.min(maxScrollDist, currentDist + step));
		    var ratio = newDist / maxScrollDist;
		    setScrollByRatio(ratio);
		}
		
		if (!self._wheelBound) {
		    self._wheelBound = true;
		    window.addEventListener("wheel", function (e) {
		        if (self.stage) {
		            var pt = self.globalToLocal(self.stage.mouseX, self.stage.mouseY);
		            if (pt.x >= 0 && pt.x <= 400 && pt.y >= 0 && pt.y <= VIEW_HEIGHT) {
		                e.preventDefault();
		                handleWheel(e);
		            }
		        }
		    }, { passive: false });
		}
		
		function updateSortAndRender(field, order) {
		    roomData = window.UISort.sortArray(roomData, field, order);
		    renderList(roomData);
		}
		
		window.UISort.off("SORT_CHANGE", self._onSortChange);
		self._onSortChange = function (evt) {
		    updateSortAndRender(evt.field, evt.order);
		};
		window.UISort.on("SORT_CHANGE", self._onSortChange);
		
		fetch(JSON_URL)
		    .then(function (res) { return res.json(); })
		    .then(function (data) {
		        console.log("✅ โหลด JSON สำเร็จ:", JSON_URL);
		        roomData = Array.isArray(data) ? data : (data.list || []);
		        updateSortAndRender(window.UISort.field, window.UISort.order);
		    })
		    .catch(function (err) {
		        console.warn("⚠️ ไม่พบไฟล์ JSON (ใช้ข้อมูล Fallback 10 รายการ):", err);
		        roomData = [
		            { index: 1, name: "Beginner Training Ground", maxroom: 1, currentroom: 1, lore: "A tranquil courtyard designed for novice adventurers.", image: "img_training" },
		            { index: 2, name: "Whispering Forest", maxroom: 1, currentroom: 0, lore: "Ancient dense woodland with bioluminescent flora.", image: "img_forest" },
		            { index: 3, name: "Sunken Catacombs", maxroom: 1, currentroom: 1, lore: "Flooded subterranean tomb echoing with whispers.", image: "img_catacombs" },
		            { index: 4, name: "Desert Labyrinth", maxroom: 1, currentroom: 0, lore: "Shifting sand dunes sheltering clockwork monoliths.", image: "img_desert" },
		            { index: 5, name: "Obsidian Sanctuary", maxroom: 1, currentroom: 1, lore: "Sacred volcanic altar carved from black volcanic rock.", image: "img_obsidian" },
		            { index: 6, name: "Crystal Mine Depths", maxroom: 1, currentroom: 0, lore: "Deep cavern veins packed with resonant crystals.", image: "img_crystal" },
		            { index: 7, name: "Windspire Peak", maxroom: 1, currentroom: 1, lore: "High altitude watchtower with ferocious gale currents.", image: "img_windspire" },
		            { index: 8, name: "Frozen Abyss", maxroom: 1, currentroom: 0, lore: "Permafrost glacial canyon with blue ice relics.", image: "img_frozen" },
		            { index: 9, name: "Thunder Bastion", maxroom: 1, currentroom: 1, lore: "Electrified fortress pinnacle attracting lightning.", image: "img_thunder" },
		            { index: 10, name: "Astral Void Chamber", maxroom: 1, currentroom: 0, lore: "Weightless pocket dimension floating between cosmic rifts.", image: "img_astral" }
		        ];
		        updateSortAndRender(window.UISort.field, window.UISort.order);
		    });
	}

	// actions tween:
	this.timeline.addTween(cjs.Tween.get(this).call(this.frame_0).wait(1));

	// Layer_5 (mask)
	var mask = new cjs.Shape();
	mask._off = true;
	mask.graphics.p("AUKYTMAAAgwlIBXAAMAAAAwlg");
	mask.setTransform(137.65,131.25);

	// Layer_6
	this.handle_bar = new lib.handle_bar();
	this.handle_bar.name = "handle_bar";
	this.handle_bar.setTransform(270.9,-6.85);

	var maskedShapeInstanceList = [this.handle_bar];

	for(var shapedInstanceItr = 0; shapedInstanceItr < maskedShapeInstanceList.length; shapedInstanceItr++) {
		maskedShapeInstanceList[shapedInstanceItr].mask = mask;
	}

	this.timeline.addTween(cjs.Tween.get(this.handle_bar).wait(1));

	// Layer_1
	this.Template = new lib.TemplateListAlone();
	this.Template.name = "Template";
	this.Template.setTransform(-0.15,-4.6);

	this.timeline.addTween(cjs.Tween.get(this.Template).wait(1));

	this._renderFirstFrame();

}).prototype = getMCSymbolPrototype(lib.ListPanelAlone, new cjs.Rectangle(-261.4,-37,535.2,64.8), null);


(lib.InRoom = function(mode,startPosition,loop,reversed) {
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
		// ===== เขียนใน Frame 1 ของ MovieClip: InRoom =====
		var self = this;
		self.stop();
		
		var playersContainer = self.players_content;
		if (!playersContainer) {
		    if (!self._autoPlayersContainer) {
		        self._autoPlayersContainer = new createjs.Container();
		        self.addChild(self._autoPlayersContainer);
		        if (self.trail_bar) self.addChild(self.trail_bar);
		        if (self.handle_bar) self.addChild(self.handle_bar);
		    }
		    playersContainer = self._autoPlayersContainer;
		}
		
		var trail = self.trail_bar;
		var handle = self.handle_bar;
		
		var ROW_HEIGHT = 44;
		var VIEW_HEIGHT = 260;
		var startY = playersContainer.y;
		
		var trailTop = trail ? trail.y : 0;
		var trailHeight = trail ? (trail.nominalBounds ? trail.nominalBounds.height * trail.scaleY : 250) : 250;
		var handleHeight = handle ? (handle.nominalBounds ? handle.nominalBounds.height * handle.scaleY : 40) : 40;
		var handleMinY = trailTop;
		var handleMaxY = trailTop + trailHeight - handleHeight;
		
		var masterTemplate = self.TemplateInRoom || self.template_in_room || self.Template;
		if (masterTemplate) masterTemplate.visible = false;
		
		var maxScrollDist = 0;
		
		function updateScrollState(count) {
		    var totalHeight = count * ROW_HEIGHT;
		    maxScrollDist = Math.max(0, totalHeight - VIEW_HEIGHT);
		
		    if (maxScrollDist <= 0) {
		        if (trail) trail.visible = false;
		        if (handle) handle.visible = false;
		        playersContainer.y = startY;
		    } else {
		        if (trail) trail.visible = true;
		        if (handle) {
		            handle.visible = true;
		            handle.y = handleMinY;
		        }
		    }
		}
		
		function setScrollByRatio(ratio) {
		    ratio = Math.max(0, Math.min(1, ratio));
		    playersContainer.y = startY - (ratio * maxScrollDist);
		    if (handle) {
		        handle.y = handleMinY + (ratio * (handleMaxY - handleMinY));
		    }
		    if (self.stage) self.stage.update();
		}
		
		if (handle) {
		    handle.cursor = "pointer";
		    handle.removeAllEventListeners("pressmove");
		    handle.on("pressmove", function (evt) {
		        if (maxScrollDist <= 0) return;
		        var pt = self.globalToLocal(evt.stageX, evt.stageY);
		        var targetY = Math.max(handleMinY, Math.min(handleMaxY, pt.y - (handleHeight / 2)));
		        var ratio = (targetY - handleMinY) / (handleMaxY - handleMinY);
		        setScrollByRatio(ratio);
		    });
		}
		
		function handleWheel(e) {
		    if (maxScrollDist <= 0) return;
		    var currentDist = startY - playersContainer.y;
		    var delta = (e.deltaY || e.wheelDelta || 0);
		    var step = delta > 0 ? 30 : -30;
		    var newDist = Math.max(0, Math.min(maxScrollDist, currentDist + step));
		    var ratio = newDist / maxScrollDist;
		    setScrollByRatio(ratio);
		}
		
		if (!self._wheelBound) {
		    self._wheelBound = true;
		    window.addEventListener("wheel", function (e) {
		        if (self.stage) {
		            var pt = self.globalToLocal(self.stage.mouseX, self.stage.mouseY);
		            if (pt.x >= 0 && pt.x <= 400 && pt.y >= 0 && pt.y <= VIEW_HEIGHT) {
		                e.preventDefault();
		                handleWheel(e);
		            }
		        }
		    }, { passive: false });
		}
		
		function renderPlayers(players) {
		    playersContainer.removeAllChildren();
		    playersContainer.y = startY;
		
		    var list = players || (window.UIRoom && window.UIRoom.players) || [];
		    var RowClass = (masterTemplate && masterTemplate.constructor) || 
		                   lib.TemplateInRoom || lib.PlayerRowTemplate || lib.Template;
		
		    list.forEach(function (player, i) {
		        var row;
		        if (RowClass) {
		            row = new RowClass();
		            if (typeof row.frame_0 === "function") row.frame_0();
		            if (typeof row.setData === "function") row.setData(player);
		            if (row.txt_Index)      row.txt_Index.text = player.index !== undefined ? player.index : (i + 1);
		            if (row.txt_PlayerName) row.txt_PlayerName.text = player.name || ("Player " + (i + 1));
		            if (row.txt_Role)       row.txt_Role.text = player.isHost ? "HOST" : "GUEST";
		        } else {
		            row = new createjs.Container();
		            var bg = new createjs.Shape();
		            var color = player.isHost ? "rgba(79, 70, 229, 0.3)" : "rgba(255, 255, 255, 0.08)";
		            bg.graphics.beginFill(color).drawRoundRect(0, 0, 320, 36, 6);
		            var t = new createjs.Text((player.index || (i + 1)) + ".  " + (player.name || "Player") + (player.isHost ? "  [HOST]" : "  (Guest)"), "14px sans-serif", "#ffffff");
		            t.x = 12; t.y = 9;
		            row.addChild(bg, t);
		
		            var myName = (window.UIInput && window.UIInput.value && window.UIInput.value.trim()) || "Host Player";
		            var amIHost = (window.UIRoom.players.length > 0 && (window.UIRoom.players[0].name === myName || window.UIRoom.players[0].isHost));
		            if (amIHost && !player.isHost) {
		                row.cursor = "pointer";
		                row.on("click", function () { window.UIRoom.kickPlayer(player.index); });
		            }
		        }
		        row.y = i * ROW_HEIGHT;
		        playersContainer.addChild(row);
		    });
		
		    updateScrollState(list.length);
		
		    if (self.txt_RoomTitle && window.UIRoom && window.UIRoom.currentRoom) {
		        var r = window.UIRoom.currentRoom;
		        self.txt_RoomTitle.text = r.name || r.NameRoom || r.RoomName || "Game Room";
		    }
		    if (self.stage) self.stage.update();
		}
		
		var playBtn = self.btn_Play || self.btn_play;
		if (playBtn) {
		    playBtn.cursor = "pointer";
		    playBtn.removeAllEventListeners("click");
		    playBtn.on("click", function (evt) {
		        if (evt) evt.stopPropagation();
		        console.log("🎮 [MOCKUP] เริ่มเกม! ผู้เล่น:", window.UIRoom.players, "ห้อง:", window.UIRoom.currentRoom);
		        window.UIBus.dispatchEvent({
		            type: "GAME_START_TRIGGER",
		            room: window.UIRoom.currentRoom,
		            players: window.UIRoom.players,
		            hashCode: window.UIRoom.hashCode
		        });
		    });
		}
		
		var leaveBtn = self.btn_Leave || self.btn_leave || self.btn_Back || self.btn_back;
		if (leaveBtn) {
		    leaveBtn.cursor = "pointer";
		    leaveBtn.removeAllEventListeners("click");
		    leaveBtn.on("click", function (evt) {
		        if (evt) evt.stopPropagation();
		        if (window.UIRoom && window.UIRoom.leave) window.UIRoom.leave();
		    });
		}
		
		window.UIRoom = window.UIRoom || new createjs.EventDispatcher();
		window.UIRoom.off("ROOM_ENTER", self._onRoomEnter);
		window.UIRoom.off("PLAYER_JOINED", self._onPlayerJoined);
		window.UIRoom.off("PLAYER_KICKED", self._onPlayerKicked);
		
		self._onRoomEnter = function (evt) { renderPlayers(evt.players || window.UIRoom.players); };
		self._onPlayerJoined = function (evt) { renderPlayers(evt.players || window.UIRoom.players); };
		self._onPlayerKicked = function (evt) {
		    var myName = (window.UIInput && window.UIInput.value && window.UIInput.value.trim()) || "Guest";
		    if (evt.kickedPlayer && evt.kickedPlayer.name === myName) {
		        if (window.UIRoom && window.UIRoom.leave) window.UIRoom.leave();
		        return;
		    }
		    renderPlayers(evt.players || window.UIRoom.players);
		};
		
		window.UIRoom.on("ROOM_ENTER", self._onRoomEnter);
		window.UIRoom.on("PLAYER_JOINED", self._onPlayerJoined);
		window.UIRoom.on("PLAYER_KICKED", self._onPlayerKicked);
		renderPlayers(window.UIRoom.players);
		
		self.on("removed", function () {
		    window.UIRoom.off("ROOM_ENTER", self._onRoomEnter);
		    window.UIRoom.off("PLAYER_JOINED", self._onPlayerJoined);
		    window.UIRoom.off("PLAYER_KICKED", self._onPlayerKicked);
		});
	}

	// actions tween:
	this.timeline.addTween(cjs.Tween.get(this).call(this.frame_0).wait(1));

	// InRoom
	this.TemplateInRoom = new lib.TemplateInRoom();
	this.TemplateInRoom.name = "TemplateInRoom";

	this.timeline.addTween(cjs.Tween.get(this.TemplateInRoom).wait(1));

	// trail_bar (mask)
	var mask = new cjs.Shape();
	mask._off = true;
	mask.graphics.p("ATzcMMAAAg4XIBWAAMAAAA4Xg");
	mask.setTransform(135.3,159.3);

	// handle_bar
	this.handle_bar = new lib.handle_bar();
	this.handle_bar.name = "handle_bar";
	this.handle_bar.setTransform(266.2,-3.75);

	var maskedShapeInstanceList = [this.handle_bar];

	for(var shapedInstanceItr = 0; shapedInstanceItr < maskedShapeInstanceList.length; shapedInstanceItr++) {
		maskedShapeInstanceList[shapedInstanceItr].mask = mask;
	}

	this.timeline.addTween(cjs.Tween.get(this.handle_bar).wait(1));

	// btn_Leave
	this.btn_Leave = new lib.ArtBack();
	this.btn_Leave.name = "btn_Leave";
	this.btn_Leave.setTransform(604.8,361.1,0.8371,0.8371);
	new cjs.ButtonHelper(this.btn_Leave, 0, 1, 2);

	this.timeline.addTween(cjs.Tween.get(this.btn_Leave).wait(1));

	// btn_Play
	this.btn_Play = new lib.ArtPlay();
	this.btn_Play.name = "btn_Play";
	this.btn_Play.setTransform(428.15,353.45,0.8371,0.8371);
	new cjs.ButtonHelper(this.btn_Play, 0, 1, 2);

	this.timeline.addTween(cjs.Tween.get(this.btn_Play).wait(1));

	this._renderFirstFrame();

}).prototype = getMCSymbolPrototype(lib.InRoom, new cjs.Rectangle(-261.2,-32.4,903.3,425.4), null);


(lib.InputHash = function(mode,startPosition,loop,reversed) {
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
		// ===== เขียนใน Frame 1 ของ MovieClip ที่มีช่องกรอกรหัส Hash =====
		var self = this;
		self.stop();
		
		var PLACEHOLDER = "Enter #RM-XXXX...";
		
		function getArtElement() {
		    return self.art_input || self.art_bg || self.bg || self.box || self.IdArt;
		}
		
		function getTargetText() {
		    return self.IdHashInput || self.txt_HashInput || self.txt_Input || self.txt_HashCode;
		}
		
		window.UIHashInput = window.UIHashInput || new createjs.EventDispatcher();
		if (typeof window.UIHashInput.value === "undefined") window.UIHashInput.value = "";
		if (typeof window.UIHashInput.maxLength === "undefined") window.UIHashInput.maxLength = 12;
		
		window.UIHashInput.submit = function (val) {
		    var code = (val || "").trim();
		    if (!code) return;
		    window.UIHashInput.value = code;
		    console.log("🔑 ยืนยันรหัส Hash เข้าร่วมห้อง:", code);
		    if (window.UIRoom && window.UIRoom.joinByHash) {
		        window.UIRoom.joinByHash(code);
		    }
		};
		
		if (!window.UIHashInput.el) {
		    var el = document.createElement("input");
		    el.type = "text";
		    el.maxLength = window.UIHashInput.maxLength;
		    el.placeholder = "#RM-0000";
		    el.style.cssText =
		        "position:fixed;display:none;z-index:999;box-sizing:border-box;" +
		        "text-align:center;background:rgba(30, 27, 75, 0.95);color:#38bdf8;" +
		        "border:2px solid #818cf8;outline:none;padding:0 8px;border-radius:6px;" +
		        "font-family:monospace;letter-spacing:1px;font-weight:bold;";
		
		    document.body.appendChild(el);
		    window.UIHashInput.el = el;
		
		    window.UIHashInput.commit = function (save) {
		        var inp = window.UIHashInput.el;
		        if (!inp || inp.style.display === "none") return;
		        var typed = inp.value.trim();
		        inp.style.display = "none";
		        if (save && typed) window.UIHashInput.submit(typed);
		        if (window.UIHashInput.refresh) window.UIHashInput.refresh();
		        var st = window.stage || (window.UIHashInput.target && window.UIHashInput.target.ref && window.UIHashInput.target.ref.stage);
		        if (st) st.update();
		    };
		
		    el.addEventListener("keydown", function (e) {
		        if (e.key === "Enter") window.UIHashInput.commit(true);
		        else if (e.key === "Escape") window.UIHashInput.commit(false);
		    });
		
		    el.addEventListener("blur", function () { window.UIHashInput.commit(true); });
		
		    var outsideHandler = function (e) {
		        var inp = window.UIHashInput.el;
		        if (!inp || inp.style.display === "none") return;
		        if (e.target === inp) return;
		        window.UIHashInput.commit(true);
		    };
		
		    window.addEventListener("pointerdown", outsideHandler, true);
		    window.addEventListener("mousedown", outsideHandler, true);
		    window.addEventListener("touchstart", outsideHandler, true);
		}
		
		window.UIHashInput.place = function () {
		    var t = window.UIHashInput.target;
		    var inp = window.UIHashInput.el;
		    if (!t || !inp || !t.ref) return;
		
		    var cv = window.canvas || document.querySelector("canvas");
		    if (!cv || !t.ref.stage) {
		        window.UIHashInput.commit(true);
		        return;
		    }
		
		    var rect = cv.getBoundingClientRect();
		    var dpr = window.devicePixelRatio || 1;
		
		    var pt = t.ref.localToGlobal(t.bx, t.by);
		    var screenX = rect.left + (pt.x * (rect.width / (cv.width / dpr)));
		    var screenY = rect.top + (pt.y * (rect.height / (cv.height / dpr)));
		
		    var screenW = t.bw * (rect.width / (cv.width / dpr));
		    var screenH = t.bh * (rect.height / (cv.height / dpr));
		
		    inp.style.left = screenX + "px";
		    inp.style.top = screenY + "px";
		    inp.style.width = Math.max(screenW, 140) + "px";
		    inp.style.height = Math.max(screenH, 32) + "px";
		    inp.style.fontSize = Math.max(14, Math.round(screenH * 0.45)) + "px";
		    inp.style.lineHeight = Math.max(screenH, 32) + "px";
		};
		
		function bindHashInput() {
		    var art = getArtElement();
		    var txt = getTargetText();
		
		    if (!art && !txt) return;
		    if (self._hashBound) return;
		    self._hashBound = true;
		
		    var bx = 0, by = 0, bw = 200, bh = 40;
		    var refObj = art || txt;
		
		    if (art) {
		        var b = art.nominalBounds || (art.getBounds && art.getBounds());
		        if (b) {
		            bx = b.x;
		            by = b.y;
		            bw = b.width;
		            bh = b.height;
		        }
		        art.cursor = "text";
		    } else if (txt) {
		        var fs = parseFloat(txt.font) || 18;
		        bw = txt.lineWidth || 200;
		        bh = fs * 1.6;
		        bx = (txt.textAlign === "center") ? -bw / 2 : 0;
		        by = 0;
		    }
		
		    window.UIHashInput.target = { ref: refObj, bx: bx, by: by, bw: bw, bh: bh };
		
		    function renderText() {
		        if (!txt) return;
		        var v = window.UIHashInput.value;
		        txt.text = v ? v : PLACEHOLDER;
		        txt.alpha = v ? 1 : 0.6;
		        if (txt.stage) txt.stage.update();
		    }
		    window.UIHashInput.refresh = renderText;
		    renderText();
		
		    function openInput(evt) {
		        if (evt) evt.stopPropagation();
		        var inp = window.UIHashInput.el;
		        inp.value = window.UIHashInput.value;
		        window.UIHashInput.place();
		        inp.style.display = "block";
		        inp.focus();
		        inp.select();
		    }
		
		    if (art) {
		        art.removeAllEventListeners("click");
		        art.on("click", openInput);
		    }
		
		    if (txt) {
		        txt.cursor = "text";
		        txt.mouseEnabled = true;
		        txt.removeAllEventListeners("click");
		        txt.on("click", openInput);
		    }
		
		    if (window.UIHashInput._tick) createjs.Ticker.off("tick", window.UIHashInput._tick);
		    window.UIHashInput._tick = createjs.Ticker.on("tick", function () {
		        if (window.UIHashInput.el && window.UIHashInput.el.style.display !== "none") {
		            window.UIHashInput.place();
		        }
		    });
		}
		
		bindHashInput();
		if (!self._hashBound) {
		    setTimeout(bindHashInput, 50);
		}
		
		var joinBtn = self.btn_Join || self.btn_join;
		if (joinBtn) {
		    joinBtn.cursor = "pointer";
		    joinBtn.removeAllEventListeners("click");
		    joinBtn.on("click", function (evt) {
		        if (evt) evt.stopPropagation();
		        if (window.UIHashInput && window.UIHashInput.commit) {
		            window.UIHashInput.commit(true);
		        }
		    });
		}
	}

	// actions tween:
	this.timeline.addTween(cjs.Tween.get(this).call(this.frame_0).wait(1));

	// Layer_2
	this.IdHashInput = new cjs.Text("", "bold 38px 'Browallia New'", "#FFFFFF");
	this.IdHashInput.name = "IdHashInput";
	this.IdHashInput.textAlign = "center";
	this.IdHashInput.lineHeight = 55;
	this.IdHashInput.lineWidth = 198;
	this.IdHashInput.parent = this;
	this.IdHashInput.setTransform(-30.35,-16.7);

	this.timeline.addTween(cjs.Tween.get(this.IdHashInput).wait(1));

	// Layer_1
	this.art_input = new lib.ArtHash();
	this.art_input.name = "art_input";
	this.art_input.setTransform(-31.35,8.1);

	this.timeline.addTween(cjs.Tween.get(this.art_input).wait(1));

	this._renderFirstFrame();

}).prototype = getMCSymbolPrototype(lib.InputHash, new cjs.Rectangle(-133.3,-19.9,204,56), null);


(lib.BtnSelect_JoinRoom_player = function(mode,startPosition,loop,reversed) {
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
		// ===== โค้ดสำหรับปุ่ม Multiplayer =====
		var self = this;
		self.cursor = "pointer";
		self.removeAllEventListeners("click");
		
		self.on("click", function (evt) {
		    if (evt) evt.stopPropagation();
		
		    // 1. ตรวจสอบว่าระบบกำลังเปลี่ยนหน้าอยู่หรือไม่ ถ้ากำลังเปลี่ยน ห้ามกดซ้ำ
		    if (window.UIBus && window.UIBus.isNavigating) {
		        return;
		    }
		
		    // 2. ล็อกสถานะทันที ป้องกันการกดเบิ้ลหรือกดสลับปุ่ม
		    window.UIBus = window.UIBus || new createjs.EventDispatcher();
		    window.UIBus.isNavigating = true;
		
		    // 3. ยิงคำสั่ง Transition สั่ง Main Timeline ไป Frame 3 (Index 2 ใน JS)
		    window.UIBus.dispatchEvent({
		        type: "START_TRANSITION",
		        targetFrame: 2, // Frame 3 ใน Animate
		        source: "Button_Multiplayer"
		    });
		});
	}

	// actions tween:
	this.timeline.addTween(cjs.Tween.get(this).call(this.frame_0).wait(1));

	// Layer_1
	this.Select_JoinRoom_player = new lib.Select_JoinRoom_player();
	this.Select_JoinRoom_player.name = "Select_JoinRoom_player";
	this.Select_JoinRoom_player.setTransform(0.25,-2.6);
	new cjs.ButtonHelper(this.Select_JoinRoom_player, 0, 1, 2);

	this.timeline.addTween(cjs.Tween.get(this.Select_JoinRoom_player).wait(1));

	this._renderFirstFrame();

}).prototype = getMCSymbolPrototype(lib.BtnSelect_JoinRoom_player, new cjs.Rectangle(-44.5,-32,89,64.1), null);


(lib.BtnSelect_Alone_player = function(mode,startPosition,loop,reversed) {
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
		// ===== โค้ดสำหรับปุ่ม Alone =====
		var self = this;
		self.cursor = "pointer";
		self.removeAllEventListeners("click");
		
		self.on("click", function (evt) {
		    if (evt) evt.stopPropagation();
		
		    // 1. ตรวจสอบว่าระบบกำลังเปลี่ยนหน้าอยู่หรือไม่ ถ้ากำลังเปลี่ยน ห้ามกดซ้ำ
		    if (window.UIBus && window.UIBus.isNavigating) {
		        return;
		    }
		
		    // 2. ล็อกสถานะทันที ป้องกันการกดเบิ้ลหรือกดสลับปุ่ม
		    window.UIBus = window.UIBus || new createjs.EventDispatcher();
		    window.UIBus.isNavigating = true;
		
		    // 3. ยิงคำสั่ง Transition สั่ง Main Timeline ไป Frame 2 (Index 1 ใน JS)
		    window.UIBus.dispatchEvent({
		        type: "START_TRANSITION",
		        targetFrame: 1, // Frame 2 ใน Animate
		        source: "Button_Alone"
		    });
		});
	}

	// actions tween:
	this.timeline.addTween(cjs.Tween.get(this).call(this.frame_0).wait(1));

	// Layer_1
	this.Select_Alone_player = new lib.Select_Alone_player();
	this.Select_Alone_player.name = "Select_Alone_player";
	this.Select_Alone_player.setTransform(0.25,-2.6);
	new cjs.ButtonHelper(this.Select_Alone_player, 0, 1, 2);

	this.timeline.addTween(cjs.Tween.get(this.Select_Alone_player).wait(1));

	this._renderFirstFrame();

}).prototype = getMCSymbolPrototype(lib.BtnSelect_Alone_player, new cjs.Rectangle(-44.5,-32,89,64.1), null);


(lib.btnOpenCatalog = function(mode,startPosition,loop,reversed) {
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
		// โค้ดที่ตัวปุ่ม (ขายนิ่งๆ ไม่ต้องอ้างอิง parent)
		var self = this;
		self.cursor = "pointer";
		
		self.removeAllEventListeners("click");
		self.on("click", function(evt) {
		    evt.stopPropagation();
		    // ยิง Event กลางออกไป ไม่ต้องสนใจว่าใครฟังอยู่
		    window.UIBus.dispatchEvent("CATALOG_TOGGLE_REQUESTED");
		});
	}

	// actions tween:
	this.timeline.addTween(cjs.Tween.get(this).call(this.frame_0).wait(1));

	// Layer_1
	this.OpenCatalog = new lib.OpenCatalog();
	this.OpenCatalog.name = "OpenCatalog";
	this.OpenCatalog.setTransform(18.1,-0.4);
	new cjs.ButtonHelper(this.OpenCatalog, 0, 1, 2);

	this.timeline.addTween(cjs.Tween.get(this.OpenCatalog).wait(1));

	this._renderFirstFrame();

}).prototype = getMCSymbolPrototype(lib.btnOpenCatalog, new cjs.Rectangle(-52.5,-38.1,105.1,76.30000000000001), null);


(lib.BtnMax = function(mode,startPosition,loop,reversed) {
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
	this.instance = new lib.Art_Max();
	this.instance.setTransform(-0.55,-6.65);
	new cjs.ButtonHelper(this.instance, 0, 1, 2);

	this.timeline.addTween(cjs.Tween.get(this.instance).wait(1));

	this._renderFirstFrame();

}).prototype = getMCSymbolPrototype(lib.BtnMax, new cjs.Rectangle(-21.7,-26.5,42.3,39.8), null);


(lib.BtnCurrent = function(mode,startPosition,loop,reversed) {
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
	this.instance = new lib.Art_N();
	new cjs.ButtonHelper(this.instance, 0, 1, 2);

	this.timeline.addTween(cjs.Tween.get(this.instance).wait(1));

	this._renderFirstFrame();

}).prototype = getMCSymbolPrototype(lib.BtnCurrent, new cjs.Rectangle(-19.8,-26.5,39.6,53.1), null);


(lib.BtnBack = function(mode,startPosition,loop,reversed) {
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
		// ===== เขียนใน Frame 1 ของ MovieClip ปุ่ม Back =====
		var self = this;
		self.cursor = "pointer";
		self.removeAllEventListeners("click");
		
		self.on("click", function (evt) {
		    if (evt) evt.stopPropagation();
		    
		    // ยิงคำสั่งไปที่ Global Bus สั่ง Main Timeline กลับไป Frame 1 (Index 0)
		    window.UIBus.dispatchEvent({
		        type: "NAV_MAIN_FRAME",
		        frame: 0
		    });
		});
	}

	// actions tween:
	this.timeline.addTween(cjs.Tween.get(this).call(this.frame_0).wait(1));

	// Layer_1
	this.btn_Back = new lib.ArtBack();
	this.btn_Back.name = "btn_Back";
	new cjs.ButtonHelper(this.btn_Back, 0, 1, 2);

	this.timeline.addTween(cjs.Tween.get(this.btn_Back).wait(1));

	this._renderFirstFrame();

}).prototype = getMCSymbolPrototype(lib.BtnBack, new cjs.Rectangle(-44.5,-32,89,64.1), null);


(lib.Btn_Red_LabelShow_on = function(mode,startPosition,loop,reversed) {
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
	this.Btn = new lib.Btn_Color("single",4);
	this.Btn.name = "Btn";

	this.timeline.addTween(cjs.Tween.get(this.Btn).wait(1).to({startPosition:8},0).wait(1).to({startPosition:5},0).wait(1));

	this._renderFirstFrame();

}).prototype = p = new cjs.MovieClip();
p.nominalBounds = new cjs.Rectangle(-26.5,-26.5,53,53);


(lib.btn_NameRoom = function(mode,startPosition,loop,reversed) {
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
	this.instance = new lib.Art_nameRoom();
	new cjs.ButtonHelper(this.instance, 0, 1, 2);

	this.timeline.addTween(cjs.Tween.get(this.instance).wait(1));

	this._renderFirstFrame();

}).prototype = getMCSymbolPrototype(lib.btn_NameRoom, new cjs.Rectangle(-244.9,-19.9,489.9,39.8), null);


(lib.btn_Link = function(mode,startPosition,loop,reversed) {
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
	this.Icon_Setting = new lib.IconUi("single",6);
	this.Icon_Setting.name = "Icon_Setting";
	this.Icon_Setting.setTransform(-0.25,-0.2,1,1,0,0,0,-0.1,-0.1);

	this.timeline.addTween(cjs.Tween.get(this.Icon_Setting).wait(3));

	// Layer_1
	this.Btn_Bule_on = new lib.Btn_Color("single",0);
	this.Btn_Bule_on.name = "Btn_Bule_on";

	this.timeline.addTween(cjs.Tween.get(this.Btn_Bule_on).wait(1).to({startPosition:8},0).wait(1).to({startPosition:5},0).wait(1));

	this._renderFirstFrame();

}).prototype = p = new cjs.MovieClip();
p.nominalBounds = new cjs.Rectangle(-26.5,-26.5,53,53);


(lib.Btn_Index = function(mode,startPosition,loop,reversed) {
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
	this.instance = new lib.Art_Index();
	new cjs.ButtonHelper(this.instance, 0, 1, 2);

	this.timeline.addTween(cjs.Tween.get(this.instance).wait(1));

	this._renderFirstFrame();

}).prototype = getMCSymbolPrototype(lib.Btn_Index, new cjs.Rectangle(-22.4,-26.5,44.8,53.1), null);


(lib.Btn_Detail = function(mode,startPosition,loop,reversed) {
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
	this.shape.graphics.f("#FFFF00").s().p("AidB7IA4g4IAHAHIA9g8IAVAVIg9A8IAHAHIg4A5gAiNB5IAMAMIAngoIgMgMgAA2AyQgmAAgcgYIgHgGQgegeAAgsQAAgrAegeIAHgHQATgQAYgFQALgDAMAAQAMAAALADQAdAGAWAWQAeAfABArQAAAsgeAdQgdAdgpABIgEAAgAAChqQgIAIgGALQgIAPAAATQAAASAIAQQAGAKAIAJQAVAUAfAAIACABIAAgBIABAAIABAAIABAAQAIgBAIgCIABAAIADgBIABAAIABAAIAAAAIADgBIABgBIABAAIAAAAIABgBQALgGAJgIQAVgVABggQAAgegWgWQgWgVgegBIgBAAQgfAAgVAWgABAAHIgDAAIAAAAIgEgCIgDgCIgBAAIAAAAIgBgBIgCgCIgBgBIgBgBIABgCIAFgDIABAAIABgBIACAAIACgBIABAAIAAgBIABAAIAFgBIABAAIABAAIAKAAIABAAIAFAAIABABIABAAIACAAIADAAIABACIAAABIAAABIgBAAIAAAAIgCAEIgEAEIgCABIgBABIAAAAIgBAAIgCABIgCABIAAAAIAAAAIgBAAIgFABgAAJhCIgBgBIAAgCIAAgBIAAgHIAAgBIAAgCIACgGIAFgKIABgBIAAgCIACgBIACgDIAGgFIAJgGIAIgDIAIgCIAOAAIACABIACABIACAAIAGACIACABIAIAGIACACIAAABIAAACIgKgBIgDABIgDAAIgEAAIgDAAIgCABIgCAAIgBAAIgBAAIgHACIgBABIgBAAIgCABIgBAAIgCABIgCABIgCABIgBABIgBAAIgBABIgBABIgDABIAAAAIgBABIgCABIAAAAIgDADIgBAAIgHAIIgBABIgEADIgBACIAAABIgBABIgBABIAAABIgBABIgBABg");
	this.shape.setTransform(-0.1,0.125);

	this.shape_1 = new cjs.Shape();
	this.shape_1.graphics.f("#FFFFFF").s().p("AidB7IA4g4IAHAHIA9g8IAVAVIg9A8IAHAHIg4A5gAiNB5IAMAMIAngoIgMgMgAA2AyQgmAAgcgYIgHgGQgegeAAgsQAAgrAegeIAHgHQATgQAYgFQALgDAMAAQAMAAALADQAdAGAWAWQAeAfABArQAAAsgeAdQgdAdgpABIgEAAgAAChqQgIAIgGALQgIAPAAATQAAASAIAQQAGAKAIAJQAVAUAfAAIACABIAAgBIABAAIABAAIABAAQAIgBAIgCIABAAIADgBIABAAIABAAIAAAAIADgBIABgBIABAAIAAAAIABgBQALgGAJgIQAVgVABggQAAgegWgWQgWgVgegBIgBAAQgfAAgVAWgABAAHIgDAAIAAAAIgEgCIgDgCIgBAAIAAAAIgBgBIgCgCIgBgBIgBgBIABgCIAFgDIABAAIABgBIACAAIACgBIABAAIAAgBIABAAIAFgBIABAAIABAAIAKAAIABAAIAFAAIABABIABAAIACAAIADAAIABACIAAABIAAABIgBAAIAAAAIgCAEIgEAEIgCABIgBABIAAAAIgBAAIgCABIgCABIAAAAIAAAAIgBAAIgFABgAAJhCIgBgBIAAgCIAAgBIAAgHIAAgBIAAgCIACgGIAFgKIABgBIAAgCIACgBIACgDIAGgFIAJgGIAIgDIAIgCIAOAAIACABIACABIACAAIAGACIACABIAIAGIACACIAAABIAAACIgKgBIgDABIgDAAIgEAAIgDAAIgCABIgCAAIgBAAIgBAAIgHACIgBABIgBAAIgCABIgBAAIgCABIgCABIgCABIgBABIgBAAIgBABIgBABIgDABIAAAAIgBABIgCABIAAAAIgDADIgBAAIgHAIIgBABIgEADIgBACIAAABIgBABIgBABIAAABIgBABIgBABg");
	this.shape_1.setTransform(-0.1,0.125);

	this.timeline.addTween(cjs.Tween.get({}).to({state:[{t:this.shape}]}).to({state:[{t:this.shape_1}]},1).to({state:[{t:this.shape}]},1).wait(1));

	// Layer_1
	this.Btn_Bule_on = new lib.Btn_Color("single",6);
	this.Btn_Bule_on.name = "Btn_Bule_on";

	this.timeline.addTween(cjs.Tween.get(this.Btn_Bule_on).wait(1).to({startPosition:8},0).wait(1).to({startPosition:7},0).wait(1));

	this._renderFirstFrame();

}).prototype = p = new cjs.MovieClip();
p.nominalBounds = new cjs.Rectangle(-26.5,-26.5,53,53);


(lib.btn_Audio_true = function(mode,startPosition,loop,reversed) {
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
	this.Icon_Setting = new lib.IconUi("single",2);
	this.Icon_Setting.name = "Icon_Setting";
	this.Icon_Setting.setTransform(-0.25,-0.2,1,1,0,0,0,-0.1,-0.1);

	this.timeline.addTween(cjs.Tween.get(this.Icon_Setting).wait(1).to({startPosition:2},0).wait(1).to({startPosition:2},0).wait(1));

	// Layer_1
	this.Btn_Bule_on = new lib.Btn_Color("single",2);
	this.Btn_Bule_on.name = "Btn_Bule_on";

	this.timeline.addTween(cjs.Tween.get(this.Btn_Bule_on).wait(1).to({startPosition:4},0).wait(1).to({startPosition:5},0).wait(1));

	this._renderFirstFrame();

}).prototype = p = new cjs.MovieClip();
p.nominalBounds = new cjs.Rectangle(-26.5,-26.5,53,53);


(lib.btn_Audio_false = function(mode,startPosition,loop,reversed) {
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
	this.Icon_Setting = new lib.IconUi("single",3);
	this.Icon_Setting.name = "Icon_Setting";
	this.Icon_Setting.setTransform(-0.25,-0.2,1,1,0,0,0,-0.1,-0.1);

	this.timeline.addTween(cjs.Tween.get(this.Icon_Setting).wait(1).to({startPosition:3},0).wait(1).to({startPosition:3},0).wait(1));

	// Layer_1
	this.Btn_Bule_on = new lib.Btn_Color("single",4);
	this.Btn_Bule_on.name = "Btn_Bule_on";

	this.timeline.addTween(cjs.Tween.get(this.Btn_Bule_on).wait(1).to({startPosition:8},0).wait(1).to({startPosition:5},0).wait(1));

	this._renderFirstFrame();

}).prototype = p = new cjs.MovieClip();
p.nominalBounds = new cjs.Rectangle(-26.5,-26.5,53,53);


(lib.AudioInit = function(mode,startPosition,loop,reversed) {
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
	this.btn_Audio = new lib.btn_Audio_true();
	this.btn_Audio.name = "btn_Audio";
	new cjs.ButtonHelper(this.btn_Audio, 0, 1, 2);

	this.btn_Audio_1 = new lib.btn_Audio_false();
	this.btn_Audio_1.name = "btn_Audio_1";
	new cjs.ButtonHelper(this.btn_Audio_1, 0, 1, 2);

	this.timeline.addTween(cjs.Tween.get({}).to({state:[{t:this.btn_Audio}]}).to({state:[{t:this.btn_Audio_1}]},1).wait(1));

	this._renderFirstFrame();

}).prototype = p = new cjs.MovieClip();
p.nominalBounds = new cjs.Rectangle(-26.5,-26.5,53,53);


(lib.ArtCatalog = function(mode,startPosition,loop,reversed) {
if (loop == null) { loop = true; }
if (reversed == null) { reversed = false; }
	var props = new Object();
	props.mode = mode;
	props.startPosition = startPosition;
	props.labels = {};
	props.loop = loop;
	props.reversed = reversed;
	cjs.MovieClip.apply(this,[props]);

	// Ui_1
	this.Skin_Default_1 = new lib.Ui_1("single",8);
	this.Skin_Default_1.name = "Skin_Default_1";
	this.Skin_Default_1.setTransform(-212.75,-134.35);

	this.Skin_Default_1_1 = new lib.Ui_1("single",8);
	this.Skin_Default_1_1.name = "Skin_Default_1_1";
	this.Skin_Default_1_1.setTransform(-450.4,-134.35);

	this.timeline.addTween(cjs.Tween.get({}).to({state:[{t:this.Skin_Default_1_1},{t:this.Skin_Default_1}]}).wait(1));

	// Ui_3
	this.LabelSkin = new lib.Ui_3("single",2);
	this.LabelSkin.name = "LabelSkin";
	this.LabelSkin.setTransform(-374.1,-126.25);

	this.timeline.addTween(cjs.Tween.get(this.LabelSkin).wait(1));

	// Layer_2
	this.shape = new cjs.Shape();
	this.shape.graphics.f().s("#101820").ss(3,0,0,3).p("AhTGQIgwBGIBCAtIAxhHIABgBQA4hfAlhwQB4llh5mLIhMAXQBxFyhwFOQghBmg0BXg");
	this.shape.setTransform(-311.0196,190.2823,1.4942,1.048,0,39.5198,31.5912);

	this.shape_1 = new cjs.Shape();
	this.shape_1.graphics.f("#CF5446").s().p("AiGHXIAwhGQA0hXAihmQBvlOhwlyIBLgXQB5GLh4FlQglBwg4BfIgBABIgxBHg");
	this.shape_1.setTransform(-310.5775,190.4297,1.4942,1.048,0,39.5198,31.5912);

	this.timeline.addTween(cjs.Tween.get({}).to({state:[{t:this.shape_1},{t:this.shape}]}).wait(1));

	// Layer_12
	this.shape_2 = new cjs.Shape();
	this.shape_2.graphics.f().s("#101820").ss(3,0,0,3).p("AgZHQIBTAsIAlhGIhRgrQhag1g8g8IAAAAQhYhWgEhSQABhSBThOQBYhVB0hHQCNhWAQgOQBKg9AOhaIAAgBQAEgaAAggIhQAAQAAAZgDAVQgKA9gyApIABAAQgQANiFBRQh7BLhfBbQhwBrAEBwQAABvB0BxQBCBCBkA7g");
	this.shape_2.setTransform(19.9587,-231.5148,1,1,0,0,180);

	this.shape_3 = new cjs.Shape();
	this.shape_3.graphics.f("#CF5446").s().p("AgZHTIgBgBQhkg7hChBQh0hyAAhuQgEhxBwhqQBfhcB7hLQCFhRAQgMIgBAAQAygpAKg9QADgVAAgaIBQAAQAAAhgEAaIAAAAQgOBbhKA9QgQANiNBXQh0BGhYBVQhTBPgBBRQAEBTBYBWIAAAAQA8A7BaA1IBRArIglBHg");
	this.shape_3.setTransform(19.9587,-231.775,1,1,0,0,180);

	this.shape_4 = new cjs.Shape();
	this.shape_4.graphics.f().s("#101820").ss(3,0,0,3).p("AhTGQIgwBGIBCAtIAxhHIABgBQA4hfAlhwQB4llh5mLIhMAXQBxFyhwFOQghBmg0BXg");
	this.shape_4.setTransform(-188.2812,-229.7728,1,1,0,0,180);

	this.shape_5 = new cjs.Shape();
	this.shape_5.graphics.f("#CF5446").s().p("AiGHXIAwhGQA0hXAihmQBvlOhwlyIBLgXQB5GLh4FlQglBwg4BfIgBABIgxBHg");
	this.shape_5.setTransform(-188.575,-229.875,1,1,0,0,180);

	this.shape_6 = new cjs.Shape();
	this.shape_6.graphics.f().s("#101820").ss(3,0,0,3).p("AgZHQIBTAsIAlhGIhRgrQhag1g8g8IAAAAQhYhWgEhSQABhSBThOQBYhVB0hHQCNhWAQgOQBKg9AOhaIAAgBQAEgaAAggIhQAAQAAAZgDAVQgKA9gyApIABAAQgQANiFBRQh7BLhfBbQhwBrAEBwQAABvB0BxQBCBCBkA7g");
	this.shape_6.setTransform(274.5414,-231.5148);

	this.shape_7 = new cjs.Shape();
	this.shape_7.graphics.f("#CF5446").s().p("AgZHTIgBgBQhkg7hChBQh0hyAAhuQgEhxBwhqQBfhcB7hLQCFhRAQgMIgBAAQAygpAKg9QADgVAAgaIBQAAQAAAhgEAaIAAAAQgOBbhKA9QgQANiNBXQh0BGhYBVQhTBPgBBRQAEBTBYBWIAAAAQA8A7BaA1IBRArIglBHg");
	this.shape_7.setTransform(274.5414,-231.775);

	this.shape_8 = new cjs.Shape();
	this.shape_8.graphics.f().s("#101820").ss(3,0,0,3).p("AhTGQIgwBGIBCAtIAxhHIABgBQA4hfAlhwQB4llh5mLIhMAXQBxFyhwFOQghBmg0BXg");
	this.shape_8.setTransform(369.4312,-229.7728);

	this.shape_9 = new cjs.Shape();
	this.shape_9.graphics.f("#CF5446").s().p("AiGHXIAwhGQA0hXAihmQBvlOhwlyIBLgXQB5GLh4FlQglBwg4BfIgBABIgxBHg");
	this.shape_9.setTransform(369.7251,-229.875);

	this.shape_10 = new cjs.Shape();
	this.shape_10.graphics.f().s("#101820").ss(3,0,0,3).p("AgZHQIBTAsIAlhGIhRgrQhag1g8g8IAAAAQhYhWgEhSQABhSBThOQBYhVB0hHQCNhWAQgOQBKg9AOhaIAAgBQAEgaAAggIhQAAQAAAZgDAVQgKA9gyApIABAAQgQANiFBRQh7BLhfBbQhwBrAEBwQAABvB0BxQBCBCBkA7g");
	this.shape_10.setTransform(-476.6586,-231.5148);

	this.shape_11 = new cjs.Shape();
	this.shape_11.graphics.f("#CF5446").s().p("AgZHTIgBgBQhkg7hChBQh0hyAAhuQgEhxBwhqQBfhcB7hLQCFhRAQgMIgBAAQAygpAKg9QADgVAAgaIBQAAQAAAhgEAaIAAAAQgOBbhKA9QgQANiNBXQh0BGhYBVQhTBPgBBRQAEBTBYBWIAAAAQA8A7BaA1IBRArIglBHg");
	this.shape_11.setTransform(-476.6586,-231.775);

	this.shape_12 = new cjs.Shape();
	this.shape_12.graphics.f().s("#101820").ss(3,0,0,3).p("AhTGQIgwBGIBCAtIAxhHIABgBQA4hfAlhwQB4llh5mLIhMAXQBxFyhwFOQghBmg0BXg");
	this.shape_12.setTransform(-381.7688,-229.7728);

	this.shape_13 = new cjs.Shape();
	this.shape_13.graphics.f("#CF5446").s().p("AiGHXIAwhGQA0hXAihmQBvlOhwlyIBLgXQB5GLh4FlQglBwg4BfIgBABIgxBHg");
	this.shape_13.setTransform(-381.4749,-229.875);

	this.timeline.addTween(cjs.Tween.get({}).to({state:[{t:this.shape_13},{t:this.shape_12},{t:this.shape_11},{t:this.shape_10},{t:this.shape_9},{t:this.shape_8},{t:this.shape_7},{t:this.shape_6},{t:this.shape_5},{t:this.shape_4},{t:this.shape_3},{t:this.shape_2}]}).wait(1));

	this._renderFirstFrame();

}).prototype = getMCSymbolPrototype(lib.ArtCatalog, new cjs.Rectangle(-509,-284.3,1018.1,568.7), null);


(lib.Symbol1 = function(mode,startPosition,loop,reversed) {
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
	this.btn_Link = new lib.btn_Link();
	this.btn_Link.name = "btn_Link";
	new cjs.ButtonHelper(this.btn_Link, 0, 1, 2);

	this.timeline.addTween(cjs.Tween.get(this.btn_Link).wait(1));

	this._renderFirstFrame();

}).prototype = getMCSymbolPrototype(lib.Symbol1, new cjs.Rectangle(-26.5,-26.5,53,53), null);


(lib.Start_2_2 = function(mode,startPosition,loop,reversed) {
if (loop == null) { loop = true; }
if (reversed == null) { reversed = false; }
	var props = new Object();
	props.mode = mode;
	props.startPosition = startPosition;
	props.labels = {};
	props.loop = loop;
	props.reversed = reversed;
	cjs.MovieClip.apply(this,[props]);

	// Layer_4
	this.Logo_Game = new lib.TheDDOS_Logo("single",2);
	this.Logo_Game.name = "Logo_Game";
	this.Logo_Game.setTransform(-1.45,-131.6,0.9753,0.9753,0,0,0,-0.8,-0.1);

	this.timeline.addTween(cjs.Tween.get(this.Logo_Game).wait(1));

	// Layer_3
	this.Select_JoinRoom_player = new lib.BtnSelect_JoinRoom_player();
	this.Select_JoinRoom_player.name = "Select_JoinRoom_player";
	this.Select_JoinRoom_player.setTransform(64.3,201.95);

	this.Select_Alone_player = new lib.BtnSelect_Alone_player();
	this.Select_Alone_player.name = "Select_Alone_player";
	this.Select_Alone_player.setTransform(-52.65,202.6);

	this.timeline.addTween(cjs.Tween.get({}).to({state:[{t:this.Select_Alone_player},{t:this.Select_JoinRoom_player}]}).wait(1));

	// Layer_5
	this.TextInput = new lib.TextInput();
	this.TextInput.name = "TextInput";
	this.TextInput.setTransform(-0.7,-14.05);

	this.timeline.addTween(cjs.Tween.get(this.TextInput).wait(1));

	// Layer_2
	this.LabelMeun = new lib.Ui_3("single",0);
	this.LabelMeun.name = "LabelMeun";
	this.LabelMeun.setTransform(-0.55,40.35);

	this.timeline.addTween(cjs.Tween.get(this.LabelMeun).wait(1));

	this._renderFirstFrame();

}).prototype = getMCSymbolPrototype(lib.Start_2_2, new cjs.Rectangle(-233.9,-234.6,467.9,469.29999999999995), null);


(lib.SortMuitPlayer = function(mode,startPosition,loop,reversed) {
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
		// ===== เขียนใน Frame 1 ของ MovieClip กลุ่ม Sort (Multiplayer) =====
		var self = this;
		self.stop();
		
		function bindSortBtn(btn, field) {
		    if (!btn) return;
		    btn.cursor = "pointer";
		    btn.removeAllEventListeners("click");
		    btn.on("click", function (evt) {
		        if (evt) evt.stopPropagation();
		        window.UISort.set(field);
		    });
		}
		
		bindSortBtn(self.btn_Index, "index");
		bindSortBtn(self.btn_ListRoom, "name");
		bindSortBtn(self.btn_Max, "maxroom");
		bindSortBtn(self.btn_Current, "currentroom");
	}

	// actions tween:
	this.timeline.addTween(cjs.Tween.get(this).call(this.frame_0).wait(1));

	// Layer_1
	this.btn_Current = new lib.BtnCurrent();
	this.btn_Current.name = "btn_Current";
	this.btn_Current.setTransform(248.5,0,0.8371,0.8371);

	this.btn_Max = new lib.BtnMax();
	this.btn_Max.name = "btn_Max";
	this.btn_Max.setTransform(210.9,0.1,0.8371,0.8371);

	this.btn_ListRoom = new lib.btn_NameRoom();
	this.btn_ListRoom.name = "btn_ListRoom";
	this.btn_ListRoom.setTransform(-17.25,-5.45,0.8371,0.8371);

	this.btn_Index = new lib.Btn_Index();
	this.btn_Index.name = "btn_Index";
	this.btn_Index.setTransform(-246.25,0.1,0.8371,0.8371);

	this.timeline.addTween(cjs.Tween.get({}).to({state:[{t:this.btn_Index},{t:this.btn_ListRoom},{t:this.btn_Max},{t:this.btn_Current}]}).wait(1));

	this._renderFirstFrame();

}).prototype = getMCSymbolPrototype(lib.SortMuitPlayer, new cjs.Rectangle(-265,-22.2,530.1,44.599999999999994), null);


(lib.SortAlone = function(mode,startPosition,loop,reversed) {
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
		// ===== เขียนใน Frame 1 ของ MovieClip กลุ่ม Sort (Alone) =====
		var self = this;
		self.stop();
		
		// ปุ่ม ID: btn_Index
		if (self.btn_Index) {
		    self.btn_Index.cursor = "pointer";
		    self.btn_Index.removeAllEventListeners("click");
		    self.btn_Index.on("click", function (evt) {
		        if (evt) evt.stopPropagation();
		        window.UISort.set("index"); // สั่งสลับการเรียงลำดับ index ไปที่ Global
		    });
		}
		
		// ปุ่ม ID: btn_ListRoom
		if (self.btn_ListRoom) {
		    self.btn_ListRoom.cursor = "pointer";
		    self.btn_ListRoom.removeAllEventListeners("click");
		    self.btn_ListRoom.on("click", function (evt) {
		        if (evt) evt.stopPropagation();
		        window.UISort.set("name"); // สั่งสลับการเรียงลำดับ name ไปที่ Global
		    });
		}
	}

	// actions tween:
	this.timeline.addTween(cjs.Tween.get(this).call(this.frame_0).wait(1));

	// Layer_1
	this.shape = new cjs.Shape();
	this.shape.graphics.f("#D85040").s().p("ADSDeIhwhvInLABIAAlMILTgBIAAG7g");
	this.shape.setTransform(228.8,-0.075);

	this.btn_ListRoom = new lib.btn_NameRoom();
	this.btn_ListRoom.name = "btn_ListRoom";
	this.btn_ListRoom.setTransform(-17.3,-5.55,0.8371,0.8371);

	this.btn_Index = new lib.Btn_Index();
	this.btn_Index.name = "btn_Index";
	this.btn_Index.setTransform(-246.3,0,0.8371,0.8371);

	this.timeline.addTween(cjs.Tween.get({}).to({state:[{t:this.btn_Index},{t:this.btn_ListRoom},{t:this.shape}]}).wait(1));

	this._renderFirstFrame();

}).prototype = getMCSymbolPrototype(lib.SortAlone, new cjs.Rectangle(-265,-22.3,530,44.6), null);


(lib.PreviewRoom = function(mode,startPosition,loop,reversed) {
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
		// ===== เขียนใน Frame 1 ของ MovieClip กลุ่ม Preview =====
		var self = this;
		self.stop();
		
		// Dynamic Text 2 อันอยู่ใน MovieClip เดียวกัน (Flow เดียวกัน ต่างแค่ ID)
		var txtName = self.NameRoom || self.RoomName || self.txt_Name;
		var txtLore = self.lore || self.txt_Lore;
		var btnDetail = self.btn_Detail;
		
		var isDetailVisible = true;
		
		// 1. ฟังก์ชันล้างค่า (Clear)
		function clearPreview() {
		    if (txtName) txtName.text = "";
		    if (txtLore) txtLore.text = "";
		    if (self.stage) self.stage.update();
		}
		
		// 2. ฟังก์ชันแสดงผล (Show) - Logic เดียวกัน Flow เดียวกันเป๊ะ
		function showPreview(data) {
		    if (!data) return;
		
		    if (txtName) txtName.text = data.name || data.nameroom || "";
		    if (txtLore) txtLore.text = data.lore || "";
		
		    if (self.stage) self.stage.update();
		}
		
		clearPreview();
		
		// 3. ปุ่มเปิด-ปิดการมองเห็น Lore
		if (btnDetail) {
		    btnDetail.cursor = "pointer";
		    btnDetail.removeAllEventListeners("click");
		    btnDetail.on("click", function (evt) {
		        if (evt) evt.stopPropagation();
		        isDetailVisible = !isDetailVisible;
		        if (txtLore) txtLore.visible = isDetailVisible;
		        if (self.stage) self.stage.update();
		    });
		}
		
		// 4. ผูก Event Bus จาก UIPreview กลาง
		window.UIPreview.off("PREVIEW_SHOW", self._onShow);
		window.UIPreview.off("PREVIEW_CLEAR", self._onClear);
		
		self._onShow = function (evt) { 
		    showPreview(evt.data); 
		};
		
		self._onClear = function () { 
		    clearPreview(); 
		};
		
		window.UIPreview.on("PREVIEW_SHOW", self._onShow);
		window.UIPreview.on("PREVIEW_CLEAR", self._onClear);
		
		self.on("removed", function () {
		    window.UIPreview.off("PREVIEW_SHOW", self._onShow);
		    window.UIPreview.off("PREVIEW_CLEAR", self._onClear);
		});
	}

	// actions tween:
	this.timeline.addTween(cjs.Tween.get(this).call(this.frame_0).wait(1));

	// Layer_7 (mask)
	var mask = new cjs.Shape();
	mask._off = true;
	mask.graphics.p("A3CXDMAAAguFMAuFAAAMAAAAuFg");
	mask.setTransform(-0.3,-43.9);

	// Layer_6
	this.txt_Lore = new cjs.Text("TEST\nTEST\nTEST\nTEST\nTEST", "bold 32px 'Browallia New'", "#FFFFFF");
	this.txt_Lore.name = "txt_Lore";
	this.txt_Lore.lineHeight = 37;
	this.txt_Lore.lineWidth = 276;
	this.txt_Lore.parent = this;
	this.txt_Lore.setTransform(-142.85,-188.25);

	var maskedShapeInstanceList = [this.txt_Lore];

	for(var shapedInstanceItr = 0; shapedInstanceItr < maskedShapeInstanceList.length; shapedInstanceItr++) {
		maskedShapeInstanceList[shapedInstanceItr].mask = mask;
	}

	this.timeline.addTween(cjs.Tween.get(this.txt_Lore).wait(1));

	// PreviewMap
	this._previewImage = new lib.PreviewMap();
	this._previewImage.name = "_previewImage";
	this._previewImage.setTransform(-1.25,-43.8);

	this.timeline.addTween(cjs.Tween.get(this._previewImage).wait(1));

	// Layer_5
	this.btn_Detail = new lib.Btn_Detail();
	this.btn_Detail.name = "btn_Detail";
	this.btn_Detail.setTransform(147.85,236);
	new cjs.ButtonHelper(this.btn_Detail, 0, 1, 2);

	this.timeline.addTween(cjs.Tween.get(this.btn_Detail).wait(1));

	// PreviewName
	this.NameRoom = new cjs.Text("NAME MAP", "bold 38px 'Browallia New'", "#FFFFFF");
	this.NameRoom.name = "NameRoom";
	this.NameRoom.textAlign = "center";
	this.NameRoom.lineHeight = 55;
	this.NameRoom.lineWidth = 280;
	this.NameRoom.parent = this;
	this.NameRoom.setTransform(-0.7,142.55);

	this.timeline.addTween(cjs.Tween.get(this.NameRoom).wait(1));

	// Layer_1
	this.shape = new cjs.Shape();
	this.shape.graphics.f("#D85040").s().p("A3bEoIAApPMAu3AAAIAAJPg");
	this.shape.setTransform(1.3,164.25);

	this.timeline.addTween(cjs.Tween.get(this.shape).wait(1));

	this._renderFirstFrame();

}).prototype = getMCSymbolPrototype(lib.PreviewRoom, new cjs.Rectangle(-151.2,-193.8,325.6,456.3), null);


(lib.panelMuitPlayerArt = function(mode,startPosition,loop,reversed) {
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
	this.BtnBack = new lib.BtnBack();
	this.BtnBack.name = "BtnBack";
	this.BtnBack.setTransform(474.9,205.8,0.8371,0.8371);

	this.timeline.addTween(cjs.Tween.get(this.BtnBack).wait(1));

	// Layer_2
	this.instance = new lib.SortMuitPlayer();
	this.instance.setTransform(-121.9,-158.2);

	this.timeline.addTween(cjs.Tween.get(this.instance).wait(1));

	// Layer_8 (mask)
	var mask = new cjs.Shape();
	mask._off = true;
	mask.graphics.p("EgqZAYSMAAAgwjMBUzAAAMAAAAwjg");
	mask.setTransform(-123.175,25.3);

	// Layer_4
	this.ListPanel = new lib.ListPanelMuitPlayer();
	this.ListPanel.name = "ListPanel";
	this.ListPanel.setTransform(-125.75,-101.9);

	var maskedShapeInstanceList = [this.ListPanel];

	for(var shapedInstanceItr = 0; shapedInstanceItr < maskedShapeInstanceList.length; shapedInstanceItr++) {
		maskedShapeInstanceList[shapedInstanceItr].mask = mask;
	}

	this.timeline.addTween(cjs.Tween.get(this.ListPanel).wait(1));

	// Layer_1
	this.shape = new cjs.Shape();
	this.shape.graphics.f("#FF7667").s().p("ApDCRIAAgcICyAAIAAAcgAM3A4QgdgfgBg0QAAg2AdgfQAcggAzAAQA7AAAZAjQAaAiAAAvQgBA1gdAfQgcAfgzAAQgzAAgcgfgANIgcQAAAiAQAVQARAVAdAAQAfAAAQgXQAPgWAAggQAAhMg+AAQg+AAAABNgAloA4QgdgfAAg0QABg2AcgfQAcggAzAAQA6AAAZAjQAaAiAAAvQAAA1gcAfQgdAfgzAAQgzAAgdgfgAlWgcQAAAiAQAVQAQAVAeAAQAfAAAPgXQAQgWAAggQAAhMg+AAQg+AAAABNgAWmBTIAAjfICmAAIAAAmIh4AAIAAAyIBvAAIAAAlIhvAAIAAA8IB8AAIAAAmgATnBTIAAjfIAtAAIAAC5IBwAAIAAAmgAQWBTIAAjfIBJAAQAkAAATADQAQADANASQAPARAAAcQAAAYgMARQgKAQgRAHQgSAGgoAAIgeAAIAABUgARDgnIAZAAQAeAAAMgGQAMgHAAgTQAAgRgLgHQgKgHgkAAIgWAAgAJRBTIAAjfICnAAIAAAmIh5AAIAAAyIBwAAIAAAlIhwAAIAAA8IB9AAIAAAmgAGABTIAAjfIBJAAQAlAAASADQARADAOASQANARAAAcQAAAYgKARQgMAQgQAHQgSAGgpAAIgdAAIAABUgAGugnIAZAAQAdAAANgGQANgHAAgTQAAgRgMgHQgKgHgkAAIgWAAgAEpBTIAAgrIArAAIAAArgABYBTIAAjfICnAAIAAAmIh5AAIAAAyIBxAAIAAAlIhxAAIAAA8IB9AAIAAAmgAgDBTIhaiSIAACSIgrAAIAAjfIAsAAIBcCUIAAiUIApAAIAADfgArABTIAAhdIhSiCIA1AAIA1BZIAzhZIA0AAIhSCCIAABdgAtJBTIgxhJQgHgKgJgEQgJgGgUAAIgIAAIAABdIguAAIAAjfIBgAAQAsAAAWANQAWANAAAkQAAA3g8AIQAYAMAbAqIAcAsgAuvgtIAhAAQAiAAAMgGQANgGAAgSQAAgQgLgGQgKgFgkAAIgjAAgAyuBTIAAjfICnAAIAAAmIh5AAIAAAyIBxAAIAAAlIhxAAIAAA8IB9AAIAAAmgA1FBTIhQjfIAxAAIA5ClIA3ilIAwAAIhRDfgA5PBTIAAjfICmAAIAAAmIh4AAIAAAyIBvAAIAAAlIhvAAIAAA8IB8AAIAAAmg");
	this.shape.setTransform(-408.4,-215.1,1.5376,1.5376,0,0,0,-161.1,12);

	this.shape_1 = new cjs.Shape();
	this.shape_1.graphics.f().s("#101820").ss(2,1,1).p("APchhI+3AAIAADDIe3AAg");
	this.shape_1.setTransform(226.15,299.8058,1.5493,1,90);

	this.shape_2 = new cjs.Shape();
	this.shape_2.graphics.f("#E85D4C").s().p("AvbBiIAAjDIe3AAIAADDg");
	this.shape_2.setTransform(226.15,299.8058,1.5493,1,90);

	this.shape_3 = new cjs.Shape();
	this.shape_3.graphics.f().s("#101820").ss(2,1,1).p("APchhI+3AAIAADDIe3AAg");
	this.shape_3.setTransform(-364.6,358.7058,1.5493,1,90);

	this.shape_4 = new cjs.Shape();
	this.shape_4.graphics.f("#E85D4C").s().p("AvbBiIAAjDIe3AAIAADDg");
	this.shape_4.setTransform(-364.6,358.7058,1.5493,1,90);

	this.shape_5 = new cjs.Shape();
	this.shape_5.graphics.f().s("#101820").ss(2,1,1).p("APchhI+3AAIAADDIe3AAg");
	this.shape_5.setTransform(112.75,-359.7942,1.5493,1,90);

	this.shape_6 = new cjs.Shape();
	this.shape_6.graphics.f("#E85D4C").s().p("AvbBiIAAjDIe3AAIAADDg");
	this.shape_6.setTransform(112.75,-359.7942,1.5493,1,90);

	this.shape_7 = new cjs.Shape();
	this.shape_7.graphics.f().s("#101820").ss(2,1,1).p("APchhI+3AAIAADDIe3AAg");
	this.shape_7.setTransform(445.2,-421.8442,1.5493,1,90);

	this.shape_8 = new cjs.Shape();
	this.shape_8.graphics.f("#E85D4C").s().p("AvbBiIAAjDIe3AAIAADDg");
	this.shape_8.setTransform(445.2,-421.8442,1.5493,1,90);

	this.shape_9 = new cjs.Shape();
	this.shape_9.graphics.f().s("#101820").ss(2,1,1).p("APchhI+3AAIAADDIe3AAg");
	this.shape_9.setTransform(479.7,-421.8442,1.5493,1,90);

	this.shape_10 = new cjs.Shape();
	this.shape_10.graphics.f("#E85D4C").s().p("AvbBiIAAjDIe3AAIAADDg");
	this.shape_10.setTransform(479.7,-421.8442,1.5493,1,90);

	this.shape_11 = new cjs.Shape();
	this.shape_11.graphics.f().s("#101820").ss(2,1,1).p("APchhI+3AAIAADDIe3AAg");
	this.shape_11.setTransform(-567.5442,184.85,1.5493,1);

	this.shape_12 = new cjs.Shape();
	this.shape_12.graphics.f("#E85D4C").s().p("AvbBiIAAjDIe3AAIAADDg");
	this.shape_12.setTransform(-567.5442,184.85,1.5493,1);

	this.shape_13 = new cjs.Shape();
	this.shape_13.graphics.f().s("#101820").ss(2,1,1).p("APchhI+3AAIAADDIe3AAg");
	this.shape_13.setTransform(-567.5442,-76.25,1.5493,1);

	this.shape_14 = new cjs.Shape();
	this.shape_14.graphics.f("#E85D4C").s().p("AvbBiIAAjDIe3AAIAADDg");
	this.shape_14.setTransform(-567.5442,-76.25,1.5493,1);

	this.shape_15 = new cjs.Shape();
	this.shape_15.graphics.f().s("#101820").ss(2,1,1).p("APchhI+3AAIAADDIe3AAg");
	this.shape_15.setTransform(-567.5942,-114,1.5493,1);

	this.shape_16 = new cjs.Shape();
	this.shape_16.graphics.f("#E85D4C").s().p("AvbBiIAAjDIe3AAIAADDg");
	this.shape_16.setTransform(-567.5942,-114,1.5493,1);

	this.PreviewList = new lib.PreviewRoom();
	this.PreviewList.name = "PreviewList";
	this.PreviewList.setTransform(349.45,-77.7,0.8371,0.8371);

	this.shape_17 = new cjs.Shape();
	this.shape_17.graphics.f().s("#101820").ss(5,1,1).p("Egcxgm6MA5jAAAMAAABN1Mg5jAAAg");
	this.shape_17.setTransform(349.6625,-61.9374,0.8369,0.8369);

	this.shape_18 = new cjs.Shape();
	this.shape_18.graphics.f("#9D3428").s().p("A5GB9Ijrj5MA5jAAAIjqD5g");
	this.shape_18.setTransform(349.5848,-259.9825,0.8369,0.8369);

	this.shape_19 = new cjs.Shape();
	this.shape_19.graphics.f("#6F2219").s().p("EgB0AjBMAAAhGBIDpj6MAAABN1g");
	this.shape_19.setTransform(493.942,-61.9621,0.8369,0.8369);

	this.shape_20 = new cjs.Shape();
	this.shape_20.graphics.f("#5E1A12").s().p("EgB0gm6IDpD6MAAABGBIjpD6g");
	this.shape_20.setTransform(205.2486,-61.9621,0.8369,0.8369);

	this.shape_21 = new cjs.Shape();
	this.shape_21.graphics.f("#45150F").s().p("A8xB9IDrj5MAyOAAAIDqD5g");
	this.shape_21.setTransform(349.5848,136.0582,0.8369,0.8369);

	this.shape_22 = new cjs.Shape();
	this.shape_22.graphics.f("#101820").s().p("EgZHAjBMAAAhGBMAyPAAAMAAABGBg");
	this.shape_22.setTransform(349.6057,-61.9621,0.8369,0.8369);

	this.shape_23 = new cjs.Shape();
	this.shape_23.graphics.f().s("#101820").ss(5,1,1).p("Egyzgi8MBlnAAAMAAABF5MhlnAAAg");
	this.shape_23.setTransform(-122.1762,2.5271,0.8369,0.8369);

	this.shape_24 = new cjs.Shape();
	this.shape_24.graphics.f().s("#101820").ss(3,1,1).p("AkFh0IILAAIAADpIoLAAg");
	this.shape_24.setTransform(192.007,113.8806,0.8369,0.8369);

	this.shape_25 = new cjs.Shape();
	this.shape_25.graphics.f("#E85D4C").s().p("AkFB1IAAjpIIKAAIAADpg");
	this.shape_25.setTransform(191.9228,113.7979,0.8369,0.8369);

	this.shape_26 = new cjs.Shape();
	this.shape_26.graphics.f().s("#101820").ss(3,1,1).p("AkFh0IILAAIAADpIoLAAg");
	this.shape_26.setTransform(192.007,-143.8727,0.8369,0.8369);

	this.shape_27 = new cjs.Shape();
	this.shape_27.graphics.f("#E85D4C").s().p("AkFB1IAAjpIIKAAIAADpg");
	this.shape_27.setTransform(191.9228,-143.8273,0.8369,0.8369);

	this.shape_28 = new cjs.Shape();
	this.shape_28.graphics.f().s("#101820").ss(3,1,1).p("AkFh0IILAAIAADpIoLAAg");
	this.shape_28.setTransform(192.007,-181.7856,0.8369,0.8369);

	this.shape_29 = new cjs.Shape();
	this.shape_29.graphics.f("#E85D4C").s().p("AkFB1IAAjpIIKAAIAADpg");
	this.shape_29.setTransform(191.9228,-181.7785,0.8369,0.8369);

	this.shape_30 = new cjs.Shape();
	this.shape_30.graphics.f().s("#101820").ss(2,1,1).p("APchhI+3AAIAADDIe3AAg");
	this.shape_30.setTransform(-567.5942,-172.15,1.5493,1);

	this.shape_31 = new cjs.Shape();
	this.shape_31.graphics.f("#E85D4C").s().p("AvbBiIAAjDIe3AAIAADDg");
	this.shape_31.setTransform(-567.5942,-172.15,1.5493,1);

	this.shape_32 = new cjs.Shape();
	this.shape_32.graphics.f().s("#101820").ss(5,1,1).p("Eg2jgm6MBtHAAAMAAABN1MhtHAAAg");
	this.shape_32.setTransform(-122.1207,2.5552,0.8371,0.8371);

	this.shape_33 = new cjs.Shape();
	this.shape_33.graphics.f("#9D3428").s().p("Egy5AB9Ijqj5MBtHAAAIjpD5g");
	this.shape_33.setTransform(-122.1693,-195.5297,0.8369,0.8369);

	this.shape_34 = new cjs.Shape();
	this.shape_34.graphics.f("#6F2219").s().p("EgB0AjBMAAAhGBIDpj6MAAABN1g");
	this.shape_34.setTransform(160.3414,2.5123,0.8369,0.8369);

	this.shape_35 = new cjs.Shape();
	this.shape_35.graphics.f("#45150F").s().p("Eg2jAB9IDqj5MBl0AAAIDpD5g");
	this.shape_35.setTransform(-122.1693,200.5543,0.8369,0.8369);

	this.shape_36 = new cjs.Shape();
	this.shape_36.graphics.f("#101820").s().p("Egy5AjBMAAAhGBMBlzAAAMAAABGBg");
	this.shape_36.setTransform(-122.1274,2.5123,0.8369,0.8369);

	this.shape_37 = new cjs.Shape();
	this.shape_37.graphics.f("#5E1A12").s().p("EgB0gm6IDpD6MAAABGBIjpD6g");
	this.shape_37.setTransform(-404.6381,2.5123,0.8369,0.8369);

	this.shape_38 = new cjs.Shape();
	this.shape_38.graphics.f().s("#101820").ss(3,1,1).p("AkFh0IILAAIAADpIoLAAg");
	this.shape_38.setTransform(473.2306,163.493,0.8369,0.8369,-90);

	this.shape_39 = new cjs.Shape();
	this.shape_39.graphics.f("#E85D4C").s().p("AkFB1IAAjpIIKAAIAADpg");
	this.shape_39.setTransform(473.1479,163.5773,0.8369,0.8369,-90);

	this.timeline.addTween(cjs.Tween.get({}).to({state:[{t:this.shape_39},{t:this.shape_38},{t:this.shape_37},{t:this.shape_36},{t:this.shape_35},{t:this.shape_34},{t:this.shape_33},{t:this.shape_32},{t:this.shape_31},{t:this.shape_30},{t:this.shape_29},{t:this.shape_28},{t:this.shape_27},{t:this.shape_26},{t:this.shape_25},{t:this.shape_24},{t:this.shape_23},{t:this.shape_22},{t:this.shape_21},{t:this.shape_20},{t:this.shape_19},{t:this.shape_18},{t:this.shape_17},{t:this.PreviewList},{t:this.shape_16},{t:this.shape_15},{t:this.shape_14},{t:this.shape_13},{t:this.shape_12},{t:this.shape_11},{t:this.shape_10},{t:this.shape_9},{t:this.shape_8},{t:this.shape_7},{t:this.shape_6},{t:this.shape_5},{t:this.shape_4},{t:this.shape_3},{t:this.shape_2},{t:this.shape_1},{t:this.shape}]}).wait(1));

	this._renderFirstFrame();

}).prototype = getMCSymbolPrototype(lib.panelMuitPlayerArt, new cjs.Rectangle(-721.7,-575.9,1233.9,1088.6999999999998), null);


(lib.PanelMuitPlayer = function(mode,startPosition,loop,reversed) {
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
	this.frame_19 = function() {
		this.stop();
	}

	// actions tween:
	this.timeline.addTween(cjs.Tween.get(this).wait(19).call(this.frame_19).wait(1));

	// Layer_1
	this.instance = new lib.panelMuitPlayerArt();
	this.instance.setTransform(-1233.85,-1.2,1,1,0,0,0,0.5,-1.2);

	this.timeline.addTween(cjs.Tween.get(this.instance).to({x:37.85},19,cjs.Ease.sineOut).wait(1));

	this._renderFirstFrame();

}).prototype = p = new cjs.MovieClip();
p.nominalBounds = new cjs.Rectangle(-1956,-575.9,2505.5,1088.6999999999998);


(lib.panelAloneArt = function(mode,startPosition,loop,reversed) {
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
		// ===== เขียนใน Frame 1 ภายใน Symbol: AlonePanel =====
		var self = this;
		self.stop();
		
		var listMc = self.ListPanel || self.list_panel;
		var sortMc = self.SortAlone || self.sort_alone || self.SortPanel;
		var inRoomMc = self.InRoom || self.in_room;
		var previewMc = self.PreviewList || self.preview_List;
		
		function showListView() {
		    if (listMc) listMc.visible = true;
		    if (sortMc) sortMc.visible = true;
		    if (inRoomMc) inRoomMc.visible = false;
		    if (previewMc) previewMc.visible = true;
		    if (self.stage) self.stage.update();
		}
		
		function showInRoomView() {
		    if (listMc) listMc.visible = false;
		    if (sortMc) sortMc.visible = false;
		    if (inRoomMc) inRoomMc.visible = true;
		    if (previewMc) previewMc.visible = true;
		    if (self.stage) self.stage.update();
		}
		
		showListView();
		
		window.UIRoom = window.UIRoom || new createjs.EventDispatcher();
		
		window.UIRoom.off("ROOM_ENTER", self._onEnter);
		window.UIRoom.off("ROOM_LEAVE", self._onLeave);
		
		self._onEnter = function (evt) {
		    showInRoomView();
		};
		
		self._onLeave = function () {
		    showListView();
		};
		
		window.UIRoom.on("ROOM_ENTER", self._onEnter);
		window.UIRoom.on("ROOM_LEAVE", self._onLeave);
		
		self.on("removed", function () {
		    window.UIRoom.off("ROOM_ENTER", self._onEnter);
		    window.UIRoom.off("ROOM_LEAVE", self._onLeave);
		});
	}

	// actions tween:
	this.timeline.addTween(cjs.Tween.get(this).call(this.frame_0).wait(1));

	// Layer_10
	this.PreviewList = new lib.PreviewRoom();
	this.PreviewList.name = "PreviewList";
	this.PreviewList.setTransform(349.45,-94.75,0.8371,0.8371);

	this.timeline.addTween(cjs.Tween.get(this.PreviewList).wait(1));

	// Layer_12 (mask)
	var mask = new cjs.Shape();
	mask._off = true;
	mask.graphics.p("EAQ3AgqIAApKImTAAIAAAiMhTgAAAMAAAg4rMBTgAAAMAAAA16IGTAAIAAjAMA4GAAAIAAOZg");
	mask.setTransform(80,11.475);

	// Layer_7
	this.in_room = new lib.InRoom();
	this.in_room.name = "in_room";
	this.in_room.setTransform(-130.1,-172.65);

	var maskedShapeInstanceList = [this.in_room];

	for(var shapedInstanceItr = 0; shapedInstanceItr < maskedShapeInstanceList.length; shapedInstanceItr++) {
		maskedShapeInstanceList[shapedInstanceItr].mask = mask;
	}

	this.timeline.addTween(cjs.Tween.get(this.in_room).wait(1));

	// Layer_5
	this.shape = new cjs.Shape();
	this.shape.graphics.f("#606060").s().p("AwyFXIAAqtMAhlAAAIAAKtgAwdExMAg7AAAIAApgMgg7AAAg");
	this.shape.setTransform(297.95,178.075);

	this.shape_1 = new cjs.Shape();
	this.shape_1.graphics.f("#2F2F2F").s().p("AwyAdIAAg5MAhlAAAIAAA5g");
	this.shape_1.setTransform(297.95,215.225);

	this.shape_2 = new cjs.Shape();
	this.shape_2.graphics.f("#101820").s().p("AxLGMIAAsXMAiXAAAIAAMXgAwyE6IAAA5MAhlAAAIAAg5IAAqsMghlAAAg");
	this.shape_2.setTransform(297.95,180.95);

	this.shape_3 = new cjs.Shape();
	this.shape_3.graphics.f("#FFFFFF").s().p("AGeCmIAAiLIh6jAIBPAAIBOCEIBNiEIBOAAIh7DAIAACLgADaCmIgehKIiEAAIgcBKIhGAAICAlLIBHAAICGFLgABMAjIBbAAIguh6gAkkCmIAAlLIBDAAIAAEUICnAAIAAA3gApbCmIAAlLIBsAAQA4AAAZAEQAaAFAVAaQATAaABApQgBAkgPAZQgQAXgaAKQgZAKg9AAIgsAAIAAB9gAoXgOIAkAAQAtAAASgKQATgKAAgbQAAgbgQgLQgSgKgzAAIghAAg");
	this.shape_3.setTransform(296.55,178.325);

	this.shape_4 = new cjs.Shape();
	this.shape_4.graphics.f("#808080").s().p("AwdEwIAApfMAg7AAAIAAJfgAGQAeIAACKIBDAAIAAiKIB7jBIhOAAIhNCEIhOiEIhPAAgACuBeIAeBKIBJAAIiGlLIhHAAIiAFLIBGAAIAchKgAkyCoIDqAAIAAg3IinAAIAAkUIhDAAgAppCoIBEAAIAAh9IAsAAQA9AAAZgKQAagJAQgYQAPgZABgkQgBgpgTgaQgVgagagEQgZgFg4AAIhsAAgAA+AlIAth6IAuB6gAolgMIAAhfIAhAAQAzAAASAKQAQALAAAbQAAAbgTALQgSAJgtAAg");
	this.shape_4.setTransform(297.95,178.1);

	this.timeline.addTween(cjs.Tween.get({}).to({state:[{t:this.shape_4},{t:this.shape_3},{t:this.shape_2},{t:this.shape_1},{t:this.shape}]}).wait(1));

	// Layer_3
	this.BtnBack = new lib.BtnBack();
	this.BtnBack.name = "BtnBack";
	this.BtnBack.setTransform(474.9,188.75,0.8371,0.8371);

	this.timeline.addTween(cjs.Tween.get(this.BtnBack).wait(1));

	// Layer_2
	this.SortAlone = new lib.SortAlone();
	this.SortAlone.name = "SortAlone";
	this.SortAlone.setTransform(-121.9,-175.25);

	this.timeline.addTween(cjs.Tween.get(this.SortAlone).wait(1));

	// Layer_8 (mask)
	var mask_1 = new cjs.Shape();
	mask_1._off = true;
	mask_1.graphics.p("EgqZAYTMAAAgwlMBUzAAAMAAAAwlg");
	mask_1.setTransform(-123.175,8.25);

	// Layer_4
	this.ListPanel = new lib.ListPanelAlone();
	this.ListPanel.name = "ListPanel";
	this.ListPanel.setTransform(-125.75,-118.95);

	var maskedShapeInstanceList = [this.ListPanel];

	for(var shapedInstanceItr = 0; shapedInstanceItr < maskedShapeInstanceList.length; shapedInstanceItr++) {
		maskedShapeInstanceList[shapedInstanceItr].mask = mask_1;
	}

	this.timeline.addTween(cjs.Tween.get(this.ListPanel).wait(1));

	// Layer_6
	this.instance = new lib.HashingOutPut();
	this.instance.setTransform(91.2,234.1);

	this.timeline.addTween(cjs.Tween.get(this.instance).wait(1));

	// Layer_1
	this.shape_5 = new cjs.Shape();
	this.shape_5.graphics.f().s("#101820").ss(3,1,1).p("Ar8k5IAAJzIX4AAIAApzg");
	this.shape_5.setTransform(93.2,234.325);

	this.shape_6 = new cjs.Shape();
	this.shape_6.graphics.f("#45150F").s().p("Ar8AhIA+hBIAAABIV+AAIA8BAg");
	this.shape_6.setTransform(93.2,262.475);

	this.shape_7 = new cjs.Shape();
	this.shape_7.graphics.f("#5E1A12").s().p("Agek5IA9BBIAAHxIg9BBg");
	this.shape_7.setTransform(19.825,234.325);

	this.shape_8 = new cjs.Shape();
	this.shape_8.graphics.f("#101820").s().p("Aq/D6IAAgBIAAnxIAAgBIV/AAIAAABIAAHyg");
	this.shape_8.setTransform(93.25,234.325);

	this.shape_9 = new cjs.Shape();
	this.shape_9.graphics.f("#9D3428").s().p("Ar8ggIX4AAIg8BAIAAAAI1+AAIAAABg");
	this.shape_9.setTransform(93.2,206.175);

	this.shape_10 = new cjs.Shape();
	this.shape_10.graphics.f("#6F2219").s().p("AgdD6IAAnyIA7hBIAAJzg");
	this.shape_10.setTransform(166.625,234.325);

	this.shape_11 = new cjs.Shape();
	this.shape_11.graphics.f().s("#101820").ss(2,1,1).p("APchhI+3AAIAADDIe3AAg");
	this.shape_11.setTransform(226.15,282.7558,1.5493,1,90);

	this.shape_12 = new cjs.Shape();
	this.shape_12.graphics.f("#E85D4C").s().p("AvbBiIAAjDIe3AAIAADDg");
	this.shape_12.setTransform(226.15,282.7558,1.5493,1,90);

	this.shape_13 = new cjs.Shape();
	this.shape_13.graphics.f().s("#101820").ss(2,1,1).p("APchhI+3AAIAADDIe3AAg");
	this.shape_13.setTransform(-364.6,341.6558,1.5493,1,90);

	this.shape_14 = new cjs.Shape();
	this.shape_14.graphics.f("#E85D4C").s().p("AvbBiIAAjDIe3AAIAADDg");
	this.shape_14.setTransform(-364.6,341.6558,1.5493,1,90);

	this.shape_15 = new cjs.Shape();
	this.shape_15.graphics.f().s("#101820").ss(2,1,1).p("APchhI+3AAIAADDIe3AAg");
	this.shape_15.setTransform(112.75,-376.8442,1.5493,1,90);

	this.shape_16 = new cjs.Shape();
	this.shape_16.graphics.f("#E85D4C").s().p("AvbBiIAAjDIe3AAIAADDg");
	this.shape_16.setTransform(112.75,-376.8442,1.5493,1,90);

	this.shape_17 = new cjs.Shape();
	this.shape_17.graphics.f().s("#101820").ss(2,1,1).p("APchhI+3AAIAADDIe3AAg");
	this.shape_17.setTransform(445.2,-438.8942,1.5493,1,90);

	this.shape_18 = new cjs.Shape();
	this.shape_18.graphics.f("#E85D4C").s().p("AvbBiIAAjDIe3AAIAADDg");
	this.shape_18.setTransform(445.2,-438.8942,1.5493,1,90);

	this.shape_19 = new cjs.Shape();
	this.shape_19.graphics.f().s("#101820").ss(2,1,1).p("APchhI+3AAIAADDIe3AAg");
	this.shape_19.setTransform(479.7,-438.8942,1.5493,1,90);

	this.shape_20 = new cjs.Shape();
	this.shape_20.graphics.f("#E85D4C").s().p("AvbBiIAAjDIe3AAIAADDg");
	this.shape_20.setTransform(479.7,-438.8942,1.5493,1,90);

	this.shape_21 = new cjs.Shape();
	this.shape_21.graphics.f().s("#101820").ss(2,1,1).p("APchhI+3AAIAADDIe3AAg");
	this.shape_21.setTransform(-567.5442,167.8,1.5493,1);

	this.shape_22 = new cjs.Shape();
	this.shape_22.graphics.f("#E85D4C").s().p("AvbBiIAAjDIe3AAIAADDg");
	this.shape_22.setTransform(-567.5442,167.8,1.5493,1);

	this.shape_23 = new cjs.Shape();
	this.shape_23.graphics.f().s("#101820").ss(2,1,1).p("APchhI+3AAIAADDIe3AAg");
	this.shape_23.setTransform(-567.5442,-93.3,1.5493,1);

	this.shape_24 = new cjs.Shape();
	this.shape_24.graphics.f("#E85D4C").s().p("AvbBiIAAjDIe3AAIAADDg");
	this.shape_24.setTransform(-567.5442,-93.3,1.5493,1);

	this.shape_25 = new cjs.Shape();
	this.shape_25.graphics.f().s("#101820").ss(2,1,1).p("APchhI+3AAIAADDIe3AAg");
	this.shape_25.setTransform(-567.5942,-131.05,1.5493,1);

	this.shape_26 = new cjs.Shape();
	this.shape_26.graphics.f("#E85D4C").s().p("AvbBiIAAjDIe3AAIAADDg");
	this.shape_26.setTransform(-567.5942,-131.05,1.5493,1);

	this.shape_27 = new cjs.Shape();
	this.shape_27.graphics.f("#FF7667").s().p("AqxENIAAgzIFLAAIAAAzgAfcCLQgngWgOgkQgOgjAAhWIAAjeIBVAAIAADiQAAAxADAWQAEAYAVAPQAUAOAkAAQAuAAASgVQAQgWAAhNIAAjmIBUAAIAADbQAABMgJAmQgKAmgkAbQgmAZhFAAQhDAAglgWgAX6BnQg2g4AAhhQAAhmA2g6QA0g6BgAAQBsAAAvBAQAwA/gBBZQABBig3A5Qg1A6heAAQheAAg3g6gAYcg1QAABAAdAnQAeAmA4AAQA6AAAcgpQAcgoAAg+QAAiOhyAAQh0AAABCQgAkYBnQg2g4AAhhQAAhmA1g6QA1g6BfAAQBrAAAvBAQAvA/ABBZQAABig2A5Qg2A6hdAAQhfAAg1g6gAj4g1QAABAAfAnQAdAmA4AAQA6AAAdgpQAbgoAAg+QAAiOhyAAQh0AAAACQgEgiuABnQg3g4AAhhQAAhmA2g6QA1g6BeAAQBsAAAwBAQAvA/AABZQAABjg1A4Qg2A6heAAQheAAg2g6gEgiNgA1QAABAAdAnQAeAmA4AAQA6AAAcgpQAdgpgBg9QAAiOhyAAQh0AAABCQgAS+CaIAAiuIiZjyIBkAAIBiClIBgilIBgAAIiZDyIAACugAOvCaIAAhQIBQAAIAABQgAIrCaIAAmgIE1AAIAABHIjhAAIAABcIDRAAIAABGIjRAAIAABxIDpAAIAABGgAF9CaIinkPIAAEPIhOAAIAAmgIBRAAICqEWIAAkWIBPAAIAAGggAuYCaIAAiuIiajyIBkAAIBiClIBfilIBhAAIiZDyIAACugA1qCaIAAmgIBUAAIAAFaIDRAAIAABGgA4XCaIiokPIAAEPIhPAAIAAmgIBSAAICrEWIAAkWIBNAAIAAGgg");
	this.shape_27.setTransform(-218.2815,-251.1391,0.8368,0.8368);

	this.shape_28 = new cjs.Shape();
	this.shape_28.graphics.f().s("#101820").ss(5,1,1).p("Egcxgm6MA5jAAAMAAABN1Mg5jAAAg");
	this.shape_28.setTransform(349.7159,-79.0022,0.8369,0.8369);

	this.shape_29 = new cjs.Shape();
	this.shape_29.graphics.f("#9D3428").s().p("A5GB9Ijrj5MA5jAAAIjqD5g");
	this.shape_29.setTransform(349.6226,-277.0378,0.8368,0.8368);

	this.shape_30 = new cjs.Shape();
	this.shape_30.graphics.f("#6F2219").s().p("EgB0AjBMAAAhGBIDpj6MAAABN1g");
	this.shape_30.setTransform(493.9693,-79.0319,0.8368,0.8368);

	this.shape_31 = new cjs.Shape();
	this.shape_31.graphics.f("#5E1A12").s().p("EgB0gm6IDpD6MAAABGBIjpD6g");
	this.shape_31.setTransform(205.2969,-79.0319,0.8368,0.8368);

	this.shape_32 = new cjs.Shape();
	this.shape_32.graphics.f("#45150F").s().p("A8xB9IDrj5MAyOAAAIDqD5g");
	this.shape_32.setTransform(349.6226,118.974,0.8368,0.8368);

	this.shape_33 = new cjs.Shape();
	this.shape_33.graphics.f("#101820").s().p("EgZHAjBMAAAhGBMAyPAAAMAAABGBg");
	this.shape_33.setTransform(349.6436,-79.0319,0.8368,0.8368);

	this.shape_34 = new cjs.Shape();
	this.shape_34.graphics.f().s("#101820").ss(5,1,1).p("Egyzgi8MBlnAAAMAAABF5MhlnAAAg");
	this.shape_34.setTransform(-122.1971,-14.5413,0.8369,0.8369);

	this.shape_35 = new cjs.Shape();
	this.shape_35.graphics.f().s("#101820").ss(3,1,1).p("AkFh0IILAAIAADpIoLAAg");
	this.shape_35.setTransform(191.969,96.8061,0.8369,0.8369);

	this.shape_36 = new cjs.Shape();
	this.shape_36.graphics.f("#E85D4C").s().p("AkFB1IAAjpIIKAAIAADpg");
	this.shape_36.setTransform(191.8721,96.7153,0.8368,0.8368);

	this.shape_37 = new cjs.Shape();
	this.shape_37.graphics.f().s("#101820").ss(3,1,1).p("AkFh0IILAAIAADpIoLAAg");
	this.shape_37.setTransform(191.969,-160.9331,0.8369,0.8369);

	this.shape_38 = new cjs.Shape();
	this.shape_38.graphics.f("#E85D4C").s().p("AkFB1IAAjpIIKAAIAADpg");
	this.shape_38.setTransform(191.8721,-160.8911,0.8368,0.8368);

	this.shape_39 = new cjs.Shape();
	this.shape_39.graphics.f().s("#101820").ss(3,1,1).p("AkFh0IILAAIAADpIoLAAg");
	this.shape_39.setTransform(191.969,-198.8439,0.8369,0.8369);

	this.shape_40 = new cjs.Shape();
	this.shape_40.graphics.f("#E85D4C").s().p("AkFB1IAAjpIIKAAIAADpg");
	this.shape_40.setTransform(191.8721,-198.8396,0.8368,0.8368);

	this.shape_41 = new cjs.Shape();
	this.shape_41.graphics.f().s("#101820").ss(2,1,1).p("APchhI+3AAIAADDIe3AAg");
	this.shape_41.setTransform(-567.5942,-189.2,1.5493,1);

	this.shape_42 = new cjs.Shape();
	this.shape_42.graphics.f("#E85D4C").s().p("AvbBiIAAjDIe3AAIAADDg");
	this.shape_42.setTransform(-567.5942,-189.2,1.5493,1);

	this.shape_43 = new cjs.Shape();
	this.shape_43.graphics.f().s("#101820").ss(5,1,1).p("Eg2jgm6MBtHAAAMAAABN1MhtHAAAg");
	this.shape_43.setTransform(-122.1207,-14.4948,0.8371,0.8371);

	this.shape_44 = new cjs.Shape();
	this.shape_44.graphics.f("#9D3428").s().p("Egy5AB9Ijqj5MBtHAAAIjpD5g");
	this.shape_44.setTransform(-122.1901,-212.5872,0.8369,0.8369);

	this.shape_45 = new cjs.Shape();
	this.shape_45.graphics.f("#6F2219").s().p("EgB0AjBMAAAhGBIDpj6MAAABN1g");
	this.shape_45.setTransform(160.3051,-14.5561,0.8369,0.8369);

	this.shape_46 = new cjs.Shape();
	this.shape_46.graphics.f("#45150F").s().p("Eg2jAB9IDqj5MBl0AAAIDpD5g");
	this.shape_46.setTransform(-122.1901,183.4751,0.8369,0.8369);

	this.shape_47 = new cjs.Shape();
	this.shape_47.graphics.f("#101820").s().p("Egy5AjBMAAAhGBMBlzAAAMAAABGBg");
	this.shape_47.setTransform(-122.1483,-14.5561,0.8369,0.8369);

	this.shape_48 = new cjs.Shape();
	this.shape_48.graphics.f("#5E1A12").s().p("EgB0gm6IDpD6MAAABGBIjpD6g");
	this.shape_48.setTransform(-404.6435,-14.5561,0.8369,0.8369);

	this.shape_49 = new cjs.Shape();
	this.shape_49.graphics.f().s("#101820").ss(3,1,1).p("AkFh0IILAAIAADpIoLAAg");
	this.shape_49.setTransform(473.2061,146.481,0.8369,0.8369,-90);

	this.shape_50 = new cjs.Shape();
	this.shape_50.graphics.f("#E85D4C").s().p("AkFB1IAAjpIIKAAIAADpg");
	this.shape_50.setTransform(473.1153,146.5779,0.8368,0.8368,-90);

	this.shape_51 = new cjs.Shape();
	this.shape_51.graphics.f().s("#101820").ss(2,1,1).p("APchhI+3AAIAADDIe3AAg");
	this.shape_51.setTransform(-73.8164,234.5,3.0392,1,180);

	this.shape_52 = new cjs.Shape();
	this.shape_52.graphics.f("#E85D4C").s().p("AvbBiIAAjDIe3AAIAADDg");
	this.shape_52.setTransform(-73.8164,234.5,3.0392,1,180);

	this.shape_53 = new cjs.Shape();
	this.shape_53.graphics.f().s("#101820").ss(2,1,1).p("APchhI+3AAIAADDIe3AAg");
	this.shape_53.setTransform(322.051,186.65,1.5827,1,180);

	this.shape_54 = new cjs.Shape();
	this.shape_54.graphics.f("#E85D4C").s().p("AvbBiIAAjDIe3AAIAADDg");
	this.shape_54.setTransform(322.051,186.65,1.5827,1,180);

	this.timeline.addTween(cjs.Tween.get({}).to({state:[{t:this.shape_54},{t:this.shape_53},{t:this.shape_52},{t:this.shape_51},{t:this.shape_50},{t:this.shape_49},{t:this.shape_48},{t:this.shape_47},{t:this.shape_46},{t:this.shape_45},{t:this.shape_44},{t:this.shape_43},{t:this.shape_42},{t:this.shape_41},{t:this.shape_40},{t:this.shape_39},{t:this.shape_38},{t:this.shape_37},{t:this.shape_36},{t:this.shape_35},{t:this.shape_34},{t:this.shape_33},{t:this.shape_32},{t:this.shape_31},{t:this.shape_30},{t:this.shape_29},{t:this.shape_28},{t:this.shape_27},{t:this.shape_26},{t:this.shape_25},{t:this.shape_24},{t:this.shape_23},{t:this.shape_22},{t:this.shape_21},{t:this.shape_20},{t:this.shape_19},{t:this.shape_18},{t:this.shape_17},{t:this.shape_16},{t:this.shape_15},{t:this.shape_14},{t:this.shape_13},{t:this.shape_12},{t:this.shape_11},{t:this.shape_10},{t:this.shape_9},{t:this.shape_8},{t:this.shape_7},{t:this.shape_6},{t:this.shape_5}]}).wait(1));

	this._renderFirstFrame();

}).prototype = getMCSymbolPrototype(lib.panelAloneArt, new cjs.Rectangle(-721.7,-593,1233.9,1088.8), null);


(lib.PanelAlone = function(mode,startPosition,loop,reversed) {
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
	this.frame_19 = function() {
		this.stop();
	}

	// actions tween:
	this.timeline.addTween(cjs.Tween.get(this).wait(19).call(this.frame_19).wait(1));

	// Layer_1
	this.instance = new lib.panelAloneArt();
	this.instance.setTransform(-1233.85,-1.2,1,1,0,0,0,0.5,-1.2);

	this.timeline.addTween(cjs.Tween.get(this.instance).to({x:37.85},19,cjs.Ease.sineOut).wait(1));

	this._renderFirstFrame();

}).prototype = p = new cjs.MovieClip();
p.nominalBounds = new cjs.Rectangle(-1956,-593,2540.3,1088.8);


(lib.BtnLog = function(mode,startPosition,loop,reversed) {
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
		// โค้ดที่ตัวปุ่ม (ขายนิ่งๆ ไม่ต้องอ้างอิง parent)
		var self = this;
		self.cursor = "pointer";
		
		self.removeAllEventListeners("click");
		self.on("click", function(evt) {
		    evt.stopPropagation();
		    // ยิง Event กลางออกไป ไม่ต้องสนใจว่าใครฟังอยู่
		    window.UILog.dispatchEvent("Log_TOGGLE_REQUESTED");
		});
	}

	// actions tween:
	this.timeline.addTween(cjs.Tween.get(this).call(this.frame_0).wait(1));

	// Layer_1
	this.Btn_Red_LabelShow_on = new lib.Btn_Red_LabelShow_on();
	this.Btn_Red_LabelShow_on.name = "Btn_Red_LabelShow_on";
	new cjs.ButtonHelper(this.Btn_Red_LabelShow_on, 0, 1, 2);

	this.timeline.addTween(cjs.Tween.get(this.Btn_Red_LabelShow_on).wait(1));

	this._renderFirstFrame();

}).prototype = getMCSymbolPrototype(lib.BtnLog, new cjs.Rectangle(-26.5,-26.5,53,53), null);


(lib.btn_AudioUse = function(mode,startPosition,loop,reversed) {
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
		//ของปุ่มเสียง
		var self = this;
		self.stop();
		
		window.UIAudio = window.UIAudio || new createjs.EventDispatcher();
		if (typeof window.UIAudio.muted === "undefined") window.UIAudio.muted = false;
		// ===== ตั้งชื่อเฟรมของ _audioInit ตรงนี้ให้ตรงกับที่ตั้งไว้ใน Animate =====
		var LABEL_UNMUTED = "true";   // Frame 1 (Index 0) = เสียงเปิด
		var LABEL_MUTED   = "false";  // Frame 2 (Index 1) = เสียงปิด
		// ===========================================================================
		
		function showState(muted) {
		    var icon = self._audioInit; // MovieClip ลูกที่มี 2 เฟรม
		    if (!icon) return;
		    var label = muted ? LABEL_MUTED : LABEL_UNMUTED;
		    var fallbackIndex = muted ? 1 : 0;
		    var hasLabel = icon.labels && icon.labels.some(function (l) { return l.label === label; });
		    icon.gotoAndStop(hasLabel ? label : fallbackIndex); // ไม่เจอชื่อ ใช้ index แทน
		}
		
		// รับ Event จากส่วนกลาง (sync ทุกปุ่ม)
		self._onAudioChange = function (e) { showState(e.muted); };
		
		function subscribe() {
		    window.UIAudio.off("AUDIO_CHANGE", self._onAudioChange);
		    window.UIAudio.on("AUDIO_CHANGE", self._onAudioChange);
		    showState(window.UIAudio.muted);
		}
		
		if (!self._audioBound) {
		    self._audioBound = true; // ใช้ชื่ออื่น เพราะ _audioInit ถูกใช้เป็นชื่อ instance ลูกแล้ว
		    self.cursor = "pointer";
		
		    // Publisher: กดแล้วสลับ muted ส่วนกลาง แล้วกระจายข่าว
		    self.on("click", function (evt) {
		        if (evt) evt.stopPropagation();
		        window.UIAudio.muted = !window.UIAudio.muted;
		        window.UIAudio.dispatchEvent({
		            type: "AUDIO_CHANGE",
		            muted: window.UIAudio.muted
		        });
		    });
		
		    // กัน listener ค้างเมื่อถูกถอดออกจาก Stage และผูกใหม่เมื่อถูกใส่กลับมา
		    self.on("removed", function () {
		        window.UIAudio.off("AUDIO_CHANGE", self._onAudioChange);
		    });
		    self.on("added", subscribe);
		}
		
		subscribe();
	}

	// actions tween:
	this.timeline.addTween(cjs.Tween.get(this).call(this.frame_0).wait(1));

	// AudioInit
	this._audioInit = new lib.AudioInit();
	this._audioInit.name = "_audioInit";

	this.timeline.addTween(cjs.Tween.get(this._audioInit).wait(1));

	this._renderFirstFrame();

}).prototype = getMCSymbolPrototype(lib.btn_AudioUse, new cjs.Rectangle(-26.5,-26.5,53,53), null);


(lib.ArtCatalogBtn = function(mode,startPosition,loop,reversed) {
if (loop == null) { loop = true; }
if (reversed == null) { reversed = false; }
	var props = new Object();
	props.mode = mode;
	props.startPosition = startPosition;
	props.labels = {};
	props.loop = loop;
	props.reversed = reversed;
	cjs.MovieClip.apply(this,[props]);

	// OpenCatalog
	this.instance = new lib.btnOpenCatalog();
	this.instance.setTransform(102.7,219.95);

	this.timeline.addTween(cjs.Tween.get(this.instance).wait(1));

	// ArtCatalog
	this.ArtCatalog = new lib.ArtCatalog();
	this.ArtCatalog.name = "ArtCatalog";
	this.ArtCatalog.setTransform(486.9,0);

	this.timeline.addTween(cjs.Tween.get(this.ArtCatalog).wait(1));

	this._renderFirstFrame();

}).prototype = getMCSymbolPrototype(lib.ArtCatalogBtn, new cjs.Rectangle(-22.1,-284.3,1018.1,568.7), null);


(lib.GroupCenter = function(mode,startPosition,loop,reversed) {
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
	this.frame_19 = function() {
		this.stop();
	}
	this.frame_39 = function() {
		this.stop();
	}

	// actions tween:
	this.timeline.addTween(cjs.Tween.get(this).wait(19).call(this.frame_19).wait(20).call(this.frame_39).wait(1));

	// Layer_2
	this.instance = new lib.Start_2_2();
	this.instance.setTransform(2.05,-604.5);

	this.timeline.addTween(cjs.Tween.get(this.instance).to({y:-22.2},19,cjs.Ease.backOut).to({y:-656.2},20,cjs.Ease.backIn).wait(1));

	this._renderFirstFrame();

}).prototype = p = new cjs.MovieClip();
p.nominalBounds = new cjs.Rectangle(-231.8,-890.9,467.8,1166.3);


(lib.Start_1 = function(mode,startPosition,loop,reversed) {
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
		// โค้ดใน LogUpdate
		var self = this;
		var isLogOpen = true; // State ภายในของตัวเอง
		
		if (self.PanelLogUpdate) {
		    self.PanelLogUpdate.gotoAndStop(0);
		}
		
		// ลงทะเบียนเป็น Observer รอรับฟังข่าวจาก UIBus
		window.UILog.off("Log_TOGGLE_REQUESTED", self._onToggle); // ลบของเก่ากันซ้ำ
		self._onToggle = function(evt) {
		    isLogOpen = !isLogOpen;
		    
		    if (self.PanelLogUpdate) {
		        if (!isLogOpen) {
		            self.PanelLogUpdate.gotoAndPlay(1);  // ขาปิด
		        } else {
		            self.PanelLogUpdate.gotoAndPlay(10); // ขาเปิด
		        }
		    }
		};
		
		window.UILog.on("Log_TOGGLE_REQUESTED", self._onToggle);
	}

	// actions tween:
	this.timeline.addTween(cjs.Tween.get(this).call(this.frame_0).wait(1));

	// Layer_5
	this.OPN = new lib.OutPutName();
	this.OPN.name = "OPN";
	this.OPN.setTransform(30.3,-168.4);

	this.timeline.addTween(cjs.Tween.get(this.OPN).wait(1));

	// Layer_2
	this.BtnLog = new lib.BtnLog();
	this.BtnLog.name = "BtnLog";
	this.BtnLog.setTransform(-99.95,-165.65);

	this.timeline.addTween(cjs.Tween.get(this.BtnLog).wait(1));

	// Layer_1
	this.PanelLogUpdate = new lib.PanelLogUpdateAnimation();
	this.PanelLogUpdate.name = "PanelLogUpdate";
	this.PanelLogUpdate.setTransform(-17.05,-6.5,1,1,0,0,0,-8.8,-32);

	this.timeline.addTween(cjs.Tween.get(this.PanelLogUpdate).wait(1));

	this._renderFirstFrame();

}).prototype = getMCSymbolPrototype(lib.Start_1, new cjs.Rectangle(-126.4,-192.1,260.20000000000005,384.29999999999995), null);


(lib.PanelCatalog = function(mode,startPosition,loop,reversed) {
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
	this.frame_9 = function() {
		this.stop();
	}
	this.frame_19 = function() {
		this.stop();
	}

	// actions tween:
	this.timeline.addTween(cjs.Tween.get(this).wait(9).call(this.frame_9).wait(10).call(this.frame_19).wait(1));

	// ArtCatalogBtn
	this.Artca = new lib.ArtCatalogBtn();
	this.Artca.name = "Artca";
	this.Artca.setTransform(-467.9,0);

	this.timeline.addTween(cjs.Tween.get(this.Artca).to({x:-1277.3},9,cjs.Ease.backInOut).wait(1).to({x:-467.9},9,cjs.Ease.backInOut).wait(1));

	this._renderFirstFrame();

}).prototype = p = new cjs.MovieClip();
p.nominalBounds = new cjs.Rectangle(-1379,-284.3,1986.7,568.7);


(lib.LogUpdate = function(mode,startPosition,loop,reversed) {
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
	this.frame_19 = function() {
		this.stop();
	}
	this.frame_39 = function() {
		this.stop();
	}

	// actions tween:
	this.timeline.addTween(cjs.Tween.get(this).wait(19).call(this.frame_19).wait(20).call(this.frame_39).wait(1));

	// Start_1
	this.instance = new lib.Start_1();
	this.instance.setTransform(-257.65,-0.5);

	this.timeline.addTween(cjs.Tween.get(this.instance).to({x:8.25},19,cjs.Ease.backOut).to({x:-299.8},20,cjs.Ease.backIn).wait(1));

	this._renderFirstFrame();

}).prototype = p = new cjs.MovieClip();
p.nominalBounds = new cjs.Rectangle(-426.2,-192.6,598.8,384.29999999999995);


(lib.Start_3 = function(mode,startPosition,loop,reversed) {
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
		// โค้ดใน CatalogSkin
		var self = this;
		var isCatalogOpen = true; // State ภายในของตัวเอง
		
		if (self.PanelCatalog) {
		    self.PanelCatalog.gotoAndStop(0);
		}
		
		// ลงทะเบียนเป็น Observer รอรับฟังข่าวจาก UIBus
		window.UIBus.off("CATALOG_TOGGLE_REQUESTED", self._onToggle); // ลบของเก่ากันซ้ำ
		self._onToggle = function(evt) {
		    isCatalogOpen = !isCatalogOpen;
		    
		    if (self.PanelCatalog) {
		        if (!isCatalogOpen) {
		            self.PanelCatalog.gotoAndPlay(1);  // ขาปิด
		        } else {
		            self.PanelCatalog.gotoAndPlay(10); // ขาเปิด
		        }
		    }
		};
		
		window.UIBus.on("CATALOG_TOGGLE_REQUESTED", self._onToggle);
	}

	// actions tween:
	this.timeline.addTween(cjs.Tween.get(this).call(this.frame_0).wait(1));

	// PanelCataglog
	this.PanelCatalog = new lib.PanelCatalog();
	this.PanelCatalog.name = "PanelCatalog";
	this.PanelCatalog.setTransform(-19,0);

	this.timeline.addTween(cjs.Tween.get(this.PanelCatalog).wait(1));

	this._renderFirstFrame();

}).prototype = getMCSymbolPrototype(lib.Start_3, new cjs.Rectangle(-509,-284.3,1018.1,568.7), null);


(lib.CatalogSkin = function(mode,startPosition,loop,reversed) {
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
	this.frame_19 = function() {
		this.stop();
	}
	this.frame_39 = function() {
		this.stop();
	}

	// actions tween:
	this.timeline.addTween(cjs.Tween.get(this).wait(19).call(this.frame_19).wait(20).call(this.frame_39).wait(1));

	// Start_3
	this.instance = new lib.Start_3();
	this.instance.setTransform(611.5,282.85);

	this.timeline.addTween(cjs.Tween.get(this.instance).to({x:285.35},19,cjs.Ease.backOut).to({x:567.95},20,cjs.Ease.backIn).wait(1));

	this._renderFirstFrame();

}).prototype = p = new cjs.MovieClip();
p.nominalBounds = new cjs.Rectangle(-256.2,-1.5,1376.8,568.7);


// stage content:
(lib.MainMenu = function(mode,startPosition,loop,reversed) {
if (loop == null) { loop = false; }
if (reversed == null) { reversed = false; }
	var props = new Object();
	props.mode = mode;
	props.startPosition = startPosition;
	props.labels = {};
	props.loop = loop;
	props.reversed = reversed;
	cjs.MovieClip.apply(this,[props]);

	this.actionFrames = [0,1,2];
	// timeline functions:
	this.frame_0 = function() {
		// ===== Main Timeline (Frame 1) : Actions - Frame =====
		this.stop();
		var root = this;
		
		// 1. ปลดล็อกระบบนำทาง และรีเซ็ต MovieClip ให้เล่นอนิเมชันขาเข้าทุกครั้งที่กลับมาที่ Frame 1
		window.UIBus = window.UIBus || new createjs.EventDispatcher();
		window.UIBus.isNavigating = false;
		
		// รีเซ็ต MovieClip ทั้ง 3 ตัวให้กลับไปเล่นจาก Frame 1 (Index 0 ใน JS)
		// แก้ปัญหาเมื่อกด Back กลับมาแล้วค้างอยู่ที่เฟรม 40 (ขาออก)
		if (root.Menu)        root.Menu.gotoAndPlay(0);
		if (root.LogUpdate)   root.LogUpdate.gotoAndPlay(0);
		if (root.CatalogSkin) root.CatalogSkin.gotoAndPlay(0);
		
		// 2. ตั้งขนาด Base Stage ดั้งเดิมจาก Animate Document (เช่น 1280x720)
		UIAnchor.base = lib.properties;
		
		// 3. ผูก Anchor ให้กับทุก Panel และ Button
		function bindAnchors() {
		    if (root.Color)        UIAnchor.fill(root.Color);                         // Background เต็มจอ
		    if (root.Menu)         UIAnchor.attach(root.Menu,        "CENTER");       // Panel Menu
		    if (root.LogUpdate)    UIAnchor.attach(root.LogUpdate,   "TOP_LEFT");     // Panel LogUpdate
		    if (root.CatalogSkin)  UIAnchor.attach(root.CatalogSkin, "TOP_RIGHT");    // Panel CatalogSkin
		    if (root.btn_Audio)    UIAnchor.attach(root.btn_Audio,   "BOTTOM_LEFT");  // ปุ่มเสียง
		    if (root.Btn_link)     UIAnchor.attach(root.Btn_link,    "BOTTOM_RIGHT"); // ปุ่มลิงก์
			if (root.InputHash)		UIAnchor.attach(root.InputHash,    "BOTTOM_LEFT");
		}
		
		bindAnchors();
		if (window.UIScreen) window.UIScreen.apply();
		
		// 4. ระบบ Transition รวมศูนย์: สั่ง Panel ทั้ง 3 ตัวเล่นขาออก (เฟรม 21-40) แล้วกระโดดเฟรม
		window.UIBus.off("START_TRANSITION", root._onStartTransition);
		
		root._onStartTransition = function (evt) {
		    if (!evt || evt.targetFrame === undefined) return;
		
		    var targetFrame = evt.targetFrame; // Index 1 = Frame 2 (Alone), Index 2 = Frame 3 (Multiplayer)
		
		    if (root.Menu)        root.Menu.gotoAndPlay(20);
		    if (root.LogUpdate)   root.LogUpdate.gotoAndPlay(20);
		    if (root.CatalogSkin) root.CatalogSkin.gotoAndPlay(20);
		
		    var fps = (lib.properties && lib.properties.fps) || 30;
		    var durationMs = (20 / fps) * 1000;
		
		    setTimeout(function () {
		        root.gotoAndStop(targetFrame);
		    }, durationMs);
		};
		
		window.UIBus.on("START_TRANSITION", root._onStartTransition);
	}
	this.frame_1 = function() {
		// ===== Main Timeline (Frame 2 : Alone) =====
		this.stop();
		var root = this;
		
		// 1. ผูก Anchor จัดตำแหน่ง AlonePanel กึ่งกลางจอ
		function bindFrame2Anchors() {
		    if (root.AlonePanel) UIAnchor.attach(root.AlonePanel, "CENTER");
		}
		bindFrame2Anchors();
		if (window.UIScreen) window.UIScreen.apply();
		
		// 2. รับคำสั่งเปลี่ยนเฟรมจากปุ่มภายใน Panel (Event: NAV_MAIN_FRAME)
		window.UIBus.off("NAV_MAIN_FRAME", root._onNavFrame2);
		root._onNavFrame2 = function (evt) {
		    if (evt && evt.frame !== undefined) {
		        root.gotoAndStop(evt.frame);
		    }
		};
		window.UIBus.on("NAV_MAIN_FRAME", root._onNavFrame2);
	}
	this.frame_2 = function() {
		// ===== Main Timeline (Frame 3 : Multiplayer) =====
		this.stop();
		var root = this;
		
		function bindFrame3Anchors() {
		    if (root.MutilPLayerPanel)  UIAnchor.attach(root.MutilPLayerPanel, "CENTER");
		}
		bindFrame3Anchors();
		if (window.UIScreen) window.UIScreen.apply();
		
		// ดักฟังคำสั่งย้อนกลับจาก Event Bus
		window.UIBus.off("NAV_MAIN_FRAME", root._onNavMainFrame3);
		root._onNavMainFrame3 = function (evt) {
		    if (evt && evt.frame !== undefined) {
		        root.gotoAndStop(evt.frame);
		    }
		};
		window.UIBus.on("NAV_MAIN_FRAME", root._onNavMainFrame3);
	}

	// actions tween:
	this.timeline.addTween(cjs.Tween.get(this).call(this.frame_0).wait(1).call(this.frame_1).wait(1).call(this.frame_2).wait(1));

	// Alone_svg
	this.InputHash = new lib.InputHash();
	this.InputHash.name = "InputHash";
	this.InputHash.setTransform(216.15,675.05);

	this.CatalogSkin = new lib.CatalogSkin();
	this.CatalogSkin.name = "CatalogSkin";
	this.CatalogSkin.setTransform(1253.4,-67.8);

	this.AlonePanel = new lib.PanelAlone();
	this.AlonePanel.name = "AlonePanel";
	this.AlonePanel.setTransform(602.45,371.3,1,1,0,0,0,0.5,-1.2);

	this.MutilPLayerPanel = new lib.PanelMuitPlayer();
	this.MutilPLayerPanel.name = "MutilPLayerPanel";
	this.MutilPLayerPanel.setTransform(602.45,371.3,1,1,0,0,0,0.5,-1.2);

	this.timeline.addTween(cjs.Tween.get({}).to({state:[{t:this.CatalogSkin},{t:this.InputHash}]}).to({state:[{t:this.AlonePanel}]},1).to({state:[{t:this.MutilPLayerPanel}]},1).wait(1));

	// LogUpdate
	this.LogUpdate = new lib.LogUpdate();
	this.LogUpdate.name = "LogUpdate";
	this.LogUpdate.setTransform(129.1,200.7,1,1,0,0,0,-8.8,-7);

	this.timeline.addTween(cjs.Tween.get(this.LogUpdate).to({_off:true},1).wait(2));

	// btn_Link
	this.Btn_link = new lib.Symbol1();
	this.Btn_link.name = "Btn_link";
	this.Btn_link.setTransform(1237.6,683.5);

	this.timeline.addTween(cjs.Tween.get(this.Btn_link).to({_off:true},1).wait(2));

	// btn_Audio
	this.btn_Audio = new lib.btn_AudioUse();
	this.btn_Audio.name = "btn_Audio";
	this.btn_Audio.setTransform(47.2,683.5);

	this.timeline.addTween(cjs.Tween.get(this.btn_Audio).to({_off:true},1).wait(2));

	// GroupCenter
	this.Menu = new lib.GroupCenter();
	this.Menu.name = "Menu";
	this.Menu.setTransform(640,360.3);

	this.timeline.addTween(cjs.Tween.get(this.Menu).to({_off:true},1).wait(2));

	// ColorBg
	this.Color = new lib.ColorBg("synched",0);
	this.Color.name = "Color";
	this.Color.setTransform(640,360.3);

	this.timeline.addTween(cjs.Tween.get(this.Color).wait(1).to({startPosition:0},0).wait(1).to({startPosition:1},0).wait(1));

	this._renderFirstFrame();

}).prototype = p = new lib.AnMovieClip();
p.nominalBounds = new cjs.Rectangle(-714.1,-118.9,3088.1,1004.1999999999999);
// library properties:
lib.properties = {
	id: '7E65D3D82A70B04BBA1E8CA78976B597',
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
an.compositions['7E65D3D82A70B04BBA1E8CA78976B597'] = {
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