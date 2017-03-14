// LOOK INTO USING requestAnimationFrame

// Keep a reference to the Box2D World
var world;

// The scale between Box2D units and pixels
var SCALE = 30;

// Multiply to convert degrees to radians.
var D2R = Math.PI / 180;

// Multiply to convert radians to degrees.
var R2D = 180 / Math.PI;

// 360 degrees in radians.
var PI2 = Math.PI * 2;
var interval;

//Cache the canvas DOM reference
var canvas;

//Are we debug drawing
var debug = false;

// Shorthand "imports"
var b2Vec2 = Box2D.Common.Math.b2Vec2,
	b2BodyDef = Box2D.Dynamics.b2BodyDef,
	b2AABB = Box2D.Collision.b2AABB,
	b2Body = Box2D.Dynamics.b2Body,
	b2FixtureDef = Box2D.Dynamics.b2FixtureDef,
	b2Fixture = Box2D.Dynamics.b2Fixture,
	b2World = Box2D.Dynamics.b2World,
	b2MassData = Box2D.Collision.Shapes.b2MassData,
	b2PolygonShape = Box2D.Collision.Shapes.b2PolygonShape,
	b2CircleShape = Box2D.Collision.Shapes.b2CircleShape,
	b2DebugDraw = Box2D.Dynamics.b2DebugDraw,
	b2MouseJointDef =  Box2D.Dynamics.Joints.b2MouseJointDef,
	b2EdgeShape = Box2D.Collision.Shapes.b2EdgeShape;

	var mouse_pressed = false;
	var mouse_joint = false;
	var mouse_x, mouse_y;

function init() {

	//Create the Box2D World with horisontal and vertical gravity (10 is close enough to 9.8)
	world = new b2World(
	new b2Vec2(0, 7) //gravity
	, true //allow sleep
	);

	//setup debug draw
	//var debugDraw = new b2DebugDraw();
	canvas = $("#canvas");
	/*debugDraw.SetSprite(canvas[0].getContext("2d"));
	debugDraw.SetDrawScale(SCALE);
	debugDraw.SetFillAlpha(0.3);
	debugDraw.SetLineThickness(1.0);
	debugDraw.SetFlags(b2DebugDraw.e_shapeBit | b2DebugDraw.e_jointBit);
	world.SetDebugDraw(debugDraw);*/

	//Create DOB OBjects
	createDOMObjects();

	//Make sure that the screen canvas for debug drawing matches the window size
	resizeHandler();
	$(window).bind('resize', resizeHandler);

	//Create the ground
	var w = $(window).width();
	var h = $(window).height()*3;

	//Do one animation interation and start animating
	interval = setInterval(update,1000/60);
	update();

}

function createDOMObjects() {
	//iterate all div elements and create them in the Box2D system
	$("#phys div").each(function (a,b) {
		var domObj = $(b);
		var domPos = $(b).position();
		var width = domObj.width() / 2 ;
		var height = domObj.height() / 2;

        var x = (domPos.left) + width;
        var y = (domPos.top) + height;
        var body = createBox(x,y,width,height);
		body.m_userData = {domObj:domObj, width:width, height:height};


		//Reset DOM object position for use with CSS3 positioning
		domObj.css({'left':'0px', 'top':'0px'});
	});


$("#stat div").each(function (a,b) {
		var domObj = $(b);
		var domPos = $(b).position();
		var width = domObj.width() / 2 ;
		var height = domObj.height() / 2

        var x = (domPos.left) + width;
        var y = (domPos.top) + height;
        var body = createBox(x,y,width,height,1);
		body.m_userData = {domObj:domObj, width:width, height:height};
		domObj.css({'left':'0px', 'top':'0px'});
	});

}


function createDebris(x,y,width,height) {
	var bodyDef = new b2BodyDef;
	bodyDef.type = b2Body.b2_dynamicBody;
	bodyDef.position.x = x / SCALE;
	bodyDef.position.y = y / SCALE;

	var fixDef = new b2FixtureDef;
   	fixDef.density = 5;
   	fixDef.friction = 0.3;
   	fixDef.restitution = 0.4;

	fixDef.shape = new b2PolygonShape;
	fixDef.shape.SetAsBox(width / SCALE, height / SCALE);
	var thisbody = world.CreateBody(bodyDef);
	//thisbody.ApplyTorque(Math.random()*10000-5000);
	//thisbody.ApplyImpulse(new b2Vec2(Math.random()*500-250,Math.random()*500-250),(bodyDef.position.x,bodyDef.position.y));
	return thisbody.CreateFixture(fixDef);
}

function createBox(x,y,width,height, static) {
	var bodyDef = new b2BodyDef;
	bodyDef.type = static ? b2Body.b2_staticBody : b2Body.b2_dynamicBody;
	bodyDef.position.x = x / SCALE;
	bodyDef.position.y = y / SCALE;
	bodyDef.angle = static ? 0 : Math.random() - 0.5;

	var fixDef = new b2FixtureDef;
   	fixDef.density = 5;
   	fixDef.friction = 0.5;
   	fixDef.restitution = 0.6;

	fixDef.shape = new b2PolygonShape;
	fixDef.shape.SetAsBox(width / SCALE, height / SCALE);
	var thisbody = world.CreateBody(bodyDef);
	return thisbody.CreateFixture(fixDef);
}

//Animate DOM objects
function drawDOMObjects() {
	var i = 0;
	for (var b = world.m_bodyList; b; b = b.m_next) {
         for (var f = b.m_fixtureList; f; f = f.m_next) {
				if (f.m_userData) {
					//Retrieve positions and rotations from the Box2d world
					var x = Math.floor((f.m_body.m_xf.position.x * SCALE) - f.m_userData.width);
					var y = Math.floor((f.m_body.m_xf.position.y * SCALE) - f.m_userData.height);

					if ((y > 1000) || (y < -200) || (x > 1500) || (x < -400)){
						 world.DestroyBody(f.m_body);
						 var css = {'visibility':'hidden'};
						 f.m_userData.domObj.css(css);
						 //f.m_userData.domObj.parentNode.removeChild(f.m_userData.domObj);
					} else {
					//CSS3 transform does not like negative values or infitate decimals
						var r = Math.round(((f.m_body.m_sweep.a + PI2) % PI2) * R2D * 100) / 100;

						var css = {'-webkit-transform':'translate(' + x + 'px,' + y + 'px) rotate(' + r  + 'deg)', '-moz-transform':'translate(' + x + 'px,' + y + 'px) rotate(' + r  + 'deg)', '-ms-transform':'translate(' + x + 'px,' + y + 'px) rotate(' + r  + 'deg)'  , '-o-transform':'translate(' + x + 'px,' + y + 'px) rotate(' + r  + 'deg)', 'transform':'translate(' + x + 'px,' + y + 'px) rotate(' + r  + 'deg)'};

						f.m_userData.domObj.css(css);
					}
				}
         }
      }
};

//Method for animating
function update() {
	//I tried to use this cross browser animation snippet from Paul Irish, but it killed the performance/timing.
	//Ill have to look more at it later, when I have the time.
	//requestAnimFrame(update);

	updateMouseDrag();
//   resource js: DebugMouseDrag.js

	world.Step(
	1 / 20 //frame-rate
	, 3 //velocity iterations
	, 3 //position iterations
	);
	//If you experience strange results, enable the debug drawing
	/*if (debug) {
		world.DrawDebugData();
	}*/
	drawDOMObjects();
	world.ClearForces();
}

//Keep the canvas size correct for debug drawing
function resizeHandler() {
	canvas.attr('width', $(window).width());
	canvas.attr('height', $(window).height());
}
