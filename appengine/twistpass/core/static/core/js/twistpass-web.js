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


var privateDeviceControl = {
	// ************ Private device / last used master password hash stuff ************
	// Show the checkbox that asks the user if they're on a private device or not, and if they are
	// then listen for the event that fires when the last used master password changes and store
	// hash fragment in a cookie

	hashCookieName: "lumph",
	checkbox: null,

	init: function() {

		// Show the checkbox that lets you say whether or not you're on a private device, which is
		// hidden by default because it's not used for the Chrome extension
		document.querySelector("[data-private-device-div]").classList.remove("hide");

		privateDeviceControl.checkbox = document.querySelector("input[name='private-device']");

		// Get the last used master password hash from cookie, if it exists
		let value = privateDeviceControl.getCookie(privateDeviceControl.hashCookieName);
		tp.log("Cookie value: ", value);
		if (value) {
			ui.lastUsedMasterPasswordHash = value;
			privateDeviceControl.checkbox.checked = true;
			privateDeviceControl.checkboxSetToTrueHandler();
		}

		privateDeviceControl.checkbox.addEventListener(
			"change",
			privateDeviceControl.checkboxChangeHandler
		);

		$(document).on(
			ui.lastUsedMasterPasswordHashUpdatedEventName,
			privateDeviceControl.lastUsedMasterPasswordHashChangedHandler
		);
	},

	getCookie: function(name) {
		let cookies = document.cookie.split(";");
		for (let cookie of cookies) {
			let nameValPair = cookie.split("=");
			if (nameValPair[0].trim() === name) {
				return decodeURIComponent(nameValPair[1].trim());
			}
		}
	},

	setCookie: function(name, value) {
		// Encode value in order to escape semicolons, commas, and whitespace
		let cookie = name + "=" + encodeURIComponent(value);
		cookie += "; path=/; max-age=" + 86400 * 365;
		cookie += "; samesite strict";
		if (document.location.protocol.startsWith("https")) {
			cookie += "; secure";
		}
		document.cookie = cookie;
	},

	deleteCookie: function(name) {
		document.cookie = name + "=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
	},

	checkboxSetToTrueHandler: function() {
		ui.showConfirmStepDeterminer = "password-changed";
	},

	checkboxSetToFalseHandler: function() {
		ui.lastUsedMasterPasswordHash = null;
		ui.showConfirmStepDeterminer = "name-not-previously-used";
		// Trash the cookie
		privateDeviceControl.deleteCookie(privateDeviceControl.hashCookieName);
	},

	checkboxChangeHandler: function(event) {
		if (event.target.checked) {
			privateDeviceControl.checkboxSetToTrueHandler();
		} else {
			privateDeviceControl.checkboxSetToFalseHandler();
		}
	},

	lastUsedMasterPasswordHashChangedHandler: function(event, value){
		privateDeviceControl.setCookie(privateDeviceControl.hashCookieName, value);
	},

};



/* Generator Page */

if($("#generator-page").length){
	ui.init();
	privateDeviceControl.init();
}


/* All Pages */

(function(){
	$(".button-collapse").sideNav();
})();
