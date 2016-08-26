// First, make our import <link> part of the actual page.
document.getElementById("generator-ui-placeholder").outerHTML = document.getElementById("generator-ui-import").import.getElementsByTagName("div")[0].outerHTML;

var chromeExt = {
	init: function(){
		chrome.tabs.query(
			{currentWindow: true, active: true},
			chromeExt.getTabsCallback
		);
	},

	getTabsCallback: function(tabs){
		// We expect to be given an array with 1 tab
		if(tabs && tabs.length === 1 && tabs[0].url){
			var name = tp.getNameFromUrl(tabs[0].url);
			ui.steps.name.input.val(name);
			ui.steps.name.validate();
			ui.dom.updateNormalisedName();
		}

	}
};


// Google Analytics
if("TODO" == "How do we detect if extension is in dev mode?"){
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


ui.init();
chromeExt.init();

