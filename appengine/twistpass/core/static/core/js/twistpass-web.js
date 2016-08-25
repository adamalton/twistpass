// General JS for TwistPass web version.
// Expects global variable 'ui' to exist (from ui.js).

/* Google Analytics */
if(!/localhost/.test(document.location.href)){
	(function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
	(i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
	m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
	})(window,document,'script','//www.google-analytics.com/analytics.js','ga');
}else{
	var ga = function(a, b, c, d, e, f, g){
		var arr = [a, b, c, d, e, f, g];
		tp.log("[debug] Analytics call: [" + arr.join(", ") + "]");
	}
}

ga('create', 'UA-71748771-1', 'auto');
ga('send', 'pageview');



if($("#generator-page").length){
	ui.init();
}

/* All Pages */

(function(){
	$(".button-collapse").sideNav();
})();
