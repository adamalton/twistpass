// First, make our import <link> part of the actual page.
document.getElementById("generator-ui-placeholder").outerHTML = document.getElementById("generator-ui-import").import.getElementsByTagName("div")[0].outerHTML;

var chromeExt = {

	lastUsedMasterPasswordHashStorageKey: "last-used-master-password-hash",

	init: function(){

		// Get info about the extension so we can decide how to setup Google Analytics.
		// Do this first so that we can (try to) define 'ga' before other stuff happens
		chrome.management.getSelf(chromeExt.getExtensionInfoCallback);

		// Query for information about the current page so that we can auto-populate the website
		// name in the first step of the UI
		chrome.tabs.query(
			{currentWindow: true, active: true},
			chromeExt.getTabsCallback
		);

		// Set the UI to use the last used master password hash to determine whether or not to show
		// the master password confirmation step
		ui.showConfirmStepDeterminer = "password-changed";

		// Query for the stored value of the last used master password hash, if we've got one
		// stored, and set it in the UI.
		chrome.storage.sync.get(
			chromeExt.lastUsedMasterPasswordHashStorageKey,
			chromeExt.getLastUsedMasterPasswordHashCallback
		);

		// Listen for when the last used master password hash changes, and store the new value
		$(document).on(
			ui.lastUsedMasterPasswordHashUpdatedEventName,
			chromeExt.lastUsedMasterPasswordHashChangedHandler
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
	},

	getLastUsedMasterPasswordHashCallback: function(items){
		var value = items[chromeExt.lastUsedMasterPasswordHashStorageKey];
		if(value){
			ui.lastUsedMasterPasswordHash = value;
		}
	},

	lastUsedMasterPasswordHashChangedHandler: function(e, value){
		tp.log("lastUsedMasterPasswordHashChangedHandler: " + value);
		var obj = {};
		obj[chromeExt.lastUsedMasterPasswordHashStorageKey] = value;
		chrome.storage.sync.set(obj);
	},

	getExtensionInfoCallback: function(extensionInfo){
		// Handle callback of when we get the extension info.  Use this to decide whether we set up
		// real Google Analytics or leave the dummy one in place.
		if(extensionInfo.installType !== "development"){
			(function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
			(i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
			m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
			})(window,document,'script','https://www.google-analytics.com/analytics.js','ga');
		}
		// Now that analytics is set up, register the page view
		ga('create', 'UA-71748771-1', 'auto');
		ga('send', 'pageview');
	}
};

// Define dummy analytics first, in case other stuff happens before getExtensionInfoCallback is called
var ga = function(a, b, c, d, e, f, g){
	var arr = [a, b, c, d, e, f, g];
	tp.log("[debug] Analytics call: [" + arr.join(", ") + "]");
};

ui.init();
chromeExt.init();

