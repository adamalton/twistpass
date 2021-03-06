// JS for the HTML-based user interface.
// Expects a global variable called 'ga' to exist for making Google Analytics calls to.
// ui.init() must be called from somewhere.

// If you want to take advantage of the functionality that makes the master password confirmation
// step only appear if the master password differs from what the user used last time, then you need
// to set ui.showConfirmStepDeterminer to "password-changed" and then set (if you know the value)
// set ui.lastUsedMasterPasswordHash before the user interacts with the master password step.
// You should also listen for the jQuery custom event which is fired when this value changes, in
// order that you can store the updated value when it changes.
// Because of the fact that it stores a 1 CHARACTER hash of the password, this option should not be
// used on shared computers.  Hence it's currently only used in the Chrome extenstion.

var ui = {

	generatedPassword: null,
	currentNameHash: null,
	nameHasBeenUsedBefore: false,
	showConfirmStepDeterminer: "name-not-previously-used", // Can be set to "password-changed"
	lastUsedMasterPasswordHash: "",
	lastUsedMasterPasswordHashUpdatedEventName: "last-used-master-password-hash-changed",
	selfDestructTimeout: null, // JS timeout ID for destroying the master & generated password
	selfDestructTime: 120000, // Amount of time (ms) until self destruct happens after inactivity

	init: function(){
		ui.steps.common.init();
		ui.steps.name.init();
		ui.steps.master1.init();
		ui.steps.master2.init();
		ui.steps.generate.init();
		ui.steps.result.init();

		ui.steps.name.load(); // This step is what's initially displayed
	},

	steps: {
		// Functionality which is discrete to each step
		// ============================================

		common: {
			// Ok, not all of the functionality is discrete to each step!
			// ==========================================================

			init: function(){
				$("button.prev-step").on("click", ui.dom.showPreviousStep);
				$(".show-password").on("change", ui.dom.togglePasswordDisplay);
			},

			submitOnReturn: function(e){
				// When the return key is pressed, continue to the next step if this step is valid
				if(e.keyCode === 13){
					var step_name = $(this).closest(".step").data("step-name");
					ui.steps[step_name].submit();
				}
			},

			reset: function(){
				// Reset the UI back to the beginning and trash all sensitive data in the page
				ui.steps.name.input.val("");
				ui.steps.master1.input.val("");
				ui.steps.master2.input.val("");
				ui.steps.master1.updateStrengthOMeter();
				ui.steps.result.input.val("");
				ui.dom.showStep("name");
			},

			setSelfDestruct: function(){
				// Set the timers for 6 minutes James!  Ok Alec.
				// Note that this is the same function to RE-set the timeout, as well as set it
				if(ui.selfDestructTimeout !== null){
					clearTimeout(ui.selfDestructTimeout);
				}
				ui.selfDestructTimeout = setTimeout(ui.steps.common.reset, ui.selfDestructTime);
			},

		},

		name: {
			init: function(){
				// Called when the entire UI is first loaded (i.e. on page load)
				var input = $("#name");
				ui.steps.name.input = input;
				input.on("keypress", ui.steps.common.submitOnReturn);
				input.on("keyup", ui.steps.name.validate);
				input.on("keyup", ui.dom.updateNormalisedName);
				var button = $(".step.name button").eq(0);
				ui.steps.name.button = button;
				button.on("click", ui.steps.name.submit);
			},

			load: function(){
				// Called when this step is (re-)displayed
				ui.analytics.logStep("name");
				ui.steps.name.input.focus();
				// If the user refreshes the page then the 'name' input may be pre-populated,
				// so validate what's in there to start with.
				ui.steps.name.validate();
			},

			validate: function(){
				// Peform validation and update the UI of this step accordingly.
				// Returns the result of isValid() for convenience.
				var is_valid = ui.steps.name.isValid();
				if(is_valid){
					ui.steps.name.button.removeClass("disabled");
					ui.steps.name.input.removeClass("invalid");
				}else{
					ui.steps.name.button.addClass("disabled");
					// Note that we don't show an error message on the input unless the user
					// tries to submit the step
				}
				return is_valid;
			},

			submit: function(){
				// Called when the user (tries to) submit(s) this step
				if(ui.steps.name.validate()){
					ui.steps.name.checkIfNameHasBeenUsedBefore();
					ui.dom.showStep("master1");
				}else{
					// Display of the error message is only done here when the user tries
					// to subit the step, not every time we validate, which is on each keystroke
					ui.steps.name.input.addClass("invalid");
				}
			},

			isValid: function(){
				return Boolean(ui.steps.name.input.val().length);
			},

			checkIfNameHasBeenUsedBefore: function(){
				// See if the user has previously generated a password for this name, and update
				// ui.nameHasBeenUsedBefore accordingly
				var previous_hashes = JSON.parse(localStorage.getItem("previously-used-name-hashes") || "[]");
				// For a bit of extra privacy we store hashes of the previously used names
				ui.currentNameHash = tp.hashName(ui.steps.name.input.val());
				ui.nameHasBeenUsedBefore = previous_hashes.indexOf(ui.currentNameHash) != -1;
			}
		},

		master1: {
			init: function(){
				// Called when the entire UI is first loaded (i.e. on page load)
				var input = $("#master-password-1");
				ui.steps.master1.input = input;
				input.on("keypress", ui.steps.common.submitOnReturn);
				input.on("keyup", ui.steps.master1.validate);
				input.on("keyup", ui.steps.master1.updateStrengthOMeter);
				input.on("keyup", ui.steps.master1.updateMaster2RequiredLength);
				var button= $(".step.master1 button.next-step").eq(0);
				ui.steps.master1.button = button;
				button.on("click", ui.steps.master1.submit);
			},

			load: function(){
				// Called when this step is (re-)displayed
				ui.analytics.logStep("master1");
				ui.steps.master1.input.focus();
				// Update the submit button to say "Next" or "Generate" depending on whether or not
				// we need to show the master password confirmation step
				ui.steps.master1.button.find("span").addClass("hide");

				if(ui.nameHasBeenUsedBefore){
					ui.steps.master1.button.find("span.generate-text").removeClass("hide");
				}else{
					ui.steps.master1.button.find("span.next-text").removeClass("hide");
				}

			},

			validate: function(){
				// Peform validation and update the UI of this step accordingly.
				// Returns the result of isValid() for convenience.
				var is_valid = ui.steps.master1.isValid();
				if(is_valid){
					ui.steps.master1.button.removeClass("disabled");
					ui.steps.master1.input.removeClass("invalid");
				}else{
					ui.steps.master1.button.addClass("disabled");
					// Note that we don't show an error message on the input unless the user
					// tries to submit the step
				}
				return is_valid;
			},

			submit: function(){
				// Called when the user (tries to) submit(s) this step
				if(ui.steps.master1.validate()){
					// We now have sensitive data in the page, so self destruct if we're left unattended
					ui.steps.common.setSelfDestruct();
					// We may or may not want the user to confirm their master password.  We have 2
					// different ways of deciding whether or not to do this
					if(ui.showConfirmStepDeterminer === "password-changed" && ui.steps.master1.masterPasswordHasChanged()){
						ui.steps.master2.showReason("master-changed");
						ui.dom.showStep("master2");
					}else if(ui.showConfirmStepDeterminer === "name-not-previously-used" && !ui.nameHasBeenUsedBefore){
						ui.steps.master2.showReason("new-name");
						ui.dom.showStep("master2");
					}else{
						ui.dom.showStep("generate");
					}
				}else{
					// Display of the error message is only done here when the user tries
					// to subit the step, not every time we validate, which is on each keystroke
					ui.steps.master1.input.addClass("invalid");
				}
			},

			isValid: function(){
				var strength = ui.steps.master1.getPasswordStrength();
				return strength === "ok" || strength === "good";
			},

			getPasswordStrength: function(){
				// Very basic alorithm for determining roughly how "strong" a password is.
				// Ignores unicode and whether or not things are dictionary words
				var password = ui.steps.master1.input.val();
				var num_possible_chars = 26;
				var num_possibilities;

				if(password.length === 0){
					return "nothing";
				}

				if(password.toLowerCase() !== password && password.toUpperCase() !== password){
					num_possible_chars += 26;
				}
				// Does the password contain any unicode characters?
				if(/[^\u0000-\u00ff]/.test(password)){
					// This theorectically opens up the number of possibilities hugely, but the
					// likelihood is that there are only a few characters that people will commonly
					// use, therefore we only increase the number of possible characters by 10
					num_possible_chars += 10;
				}
				// Does the password contain any digits?
				if(/[0-9]/.test(password)){
					num_possible_chars += 10;
				}
				num_possibilities = Math.pow(num_possible_chars, password.length);

				if(num_possibilities < 10000000000){
					return "pathetic";
				}else if(num_possibilities < 1000000000000){
					return "very-weak";
				}else if(num_possibilities < 1000000000000000000){
					return "weak";
				}else if(num_possibilities < 18921600000000000000000){ // A trillion attempts per second for 600 years
					return "borderline";
				}else if(num_possibilities < 189216000000000000000000000000){
					return "ok";
				}
				return "good";
			},

			getStrengthColour: function(strength){
				// Given a strength as a string, e.g. "weak", return a CSS class for the colour
				switch(strength) {
					case "nothing":
						return "grey";
					case "pathetic":
						return "red";
					case "very-weak":
						return "red";
					case "weak":
						return "orange";
					case "borderline":
						return "orange";
					case "ok":
						return "blue";
					case "good":
						return "green";
					}
			},

			updateStrengthOMeter: function(){
				var strength = ui.steps.master1.getPasswordStrength();
				var colour = ui.steps.master1.getStrengthColour(strength);
				tp.log("password legnth: " + String(ui.steps.master1.input.val().length));
				tp.log(strength);
				$("#strength").removeClass("nothing pathetic very-weak weak borderline ok good")
					.addClass(strength);
				$(".strength-desc").addClass("hide");
				$(".strength-desc." + strength).removeClass("hide");
				$("#strength .progress div").removeClass("grey red orange blue green").addClass(colour);
			},

			updateMaster2RequiredLength: function(){
				ui.steps.master2.updateRequiredLengthDisplay(ui.steps.master1.input.val().length);
			},

			masterPasswordHasChanged: function(){
				// IS the current value of the master password (1) field (probably) different to
				// what the user typed last time?
				// We determine this by comparing a 1 CHARACTER hash of the current and previous
				// passwords.  Storing a full hash would be a security vulnerability because if
				// it was leaked (which is quite possible on shared computers) then it could be
				// used to find the master password.  So instead we store a single character of
				// a hash, which will catch a change in the password in the majority of cases, but
				// will be of very little us to anyone trying to work out what the master password
				// is.
				if(!ui.lastUsedMasterPasswordHash){
					// We have no previous hash to compare to, so assume nothing has changed.
					return false;
				}
				return ui.steps.master1.getMasterPasswordHash() !== ui.lastUsedMasterPasswordHash;
			},

			getMasterPasswordHash: function(){
				// Return a SINGLE CHARACTER hash of the master password.
				// This is used for detecting when the user has (probably) typed a different master
				// password to last time, but as its only one character, leaking it doesn't have a
				// huge effect on security (it reduces the brute force effort by 64x).
				var hashObj = new jsSHA("SHA-512", "TEXT", {numRounds: 1000});
				hashObj.update(ui.steps.master1.input.val());
				return hashObj.getHash("B64").substr(0, 1);
			}
		},

		master2: {
			init: function(){
				// Called when the entire UI is first loaded (i.e. on page load)
				var input = $("#master-password-2");
				ui.steps.master2.input = input;
				input.on("keypress", ui.steps.common.submitOnReturn);
				input.on("keyup", ui.steps.master2.validate);
				input.on("keyup", ui.steps.master2.updatePasswordsMatchIndicator);
				var button= $(".step.master2 button.next-step").eq(0);
				ui.steps.master2.button = button;
				button.on("click", ui.steps.master2.submit);
			},

			load: function(){
				// Called when this step is (re-)displayed
				ui.analytics.logStep("master2");
				ui.steps.master2.input.focus();

			},

			validate: function(){
				// Peform validation and update the UI of this step accordingly.
				// Returns the result of isValid() for convenience.
				var is_valid = ui.steps.master2.isValid();
				if(is_valid){
					ui.steps.master2.button.removeClass("disabled");
					ui.steps.master2.input.removeClass("invalid");
				}else{
					ui.steps.master2.button.addClass("disabled");
					// Note that we don't show an error message on the input unless the user
					// tries to submit the step
				}
				return is_valid;
			},

			submit: function(){
				// Called when the user (tries to) submit(s) this step

				// Regardless of whether or not this step validates, we still have sensitive data
				// (because they passed step 1), but the fact they passed step 1 means that the
				// self-destruction timer has already been set. But we want to reset the countdown.
				ui.steps.common.setSelfDestruct();

				if(ui.steps.master2.validate()){
					ui.dom.showStep("generate");
				}else{
					// Display of the error message is only done here when the user tries
					// to subit the step, not every time we validate, which is on each keystroke
					ui.steps.master2.input.addClass("invalid");
				}
			},

			isValid: function(){
				return ui.steps.master2.input.val() === ui.steps.master1.input.val();
			},

			updateRequiredLengthDisplay: function(length){
				// Update the limit value for the "x/y" character counter on the master-password-2 input
				ui.steps.master2.input.attr("length", length);
			},

			updatePasswordsMatchIndicator: function(e){
				// Nasty edge case:
				// If the keystroke that triggered this function was the return key then we don't want
				// to clear the error message, otherwise hitting return when the passwords don't match
				// attempts to submit this step, submission is refused, error message is shown, error
				// message is immediately cleared again
				if(e.keyCode === 13){
					return;
				}

				// Detect if the confirmation password is correct *so far*, and if not show an error msg
				var this_val = ui.steps.master2.input.val();
				if(this_val !== ui.steps.master1.input.val().slice(0, this_val.length)){
					tp.log("invalid");
					ui.steps.master2.input.addClass("invalid");
				}else{
					tp.log("valid");
					ui.steps.master2.input.removeClass("invalid");
				}
			},

			showReason: function(reason){
				// Display text to the user to explain why we're asking for their master password again.
				$(".master2-reason").hide().find("." + reason).show();
			}
		},

		generate: {
			init: function(){
				// Called when the entire UI is first loaded (i.e. on page load)
				var button= $(".step.generate button.next-step").eq(0);
				ui.steps.generate.button = button;
				button.on("click", ui.steps.generate.submit);
			},

			load: function(){
				// Called when this step is (re-)displayed
				ui.analytics.logStep("generate");
				// We need to let the UI finish switching to this step before we start the
				// hashing algoirthm, otherwise it doesn't update
				setTimeout(ui.steps.generate.generatePassword, 100);
			},

			submit: function(){
				// Called when the user (tries to) submit(s) this step
			},

			generatePassword: function(){
				// Separated only to allow us to delay it so that the UI can update *before* we
				// set off the hashing algorithm
				ui.generatedPassword = tp.timeGeneratePassword(
					ui.steps.name.input.val(), // Normalisation is done for us
					ui.steps.master1.input.val()
				);
				ui.steps.generate.addNameToPreviouslyUsedList();
				ui.steps.generate.storeLastUsedMasterPasswordHash();
				ui.dom.showStep("result");
			},

			addNameToPreviouslyUsedList: function(){
				// Store the name of the password that we've generated so that we don't ask the
				// user to confirm the master password for it next time
				var hashes = JSON.parse(localStorage.getItem("previously-used-name-hashes") || "[]");
				tp.log("hashes...");
				tp.log(hashes);
				tp.log(typeof hashes);
				hashes.push(tp.hashName(ui.steps.name.input.val()));
				localStorage.setItem("previously-used-name-hashes", JSON.stringify(hashes));
			},

			storeLastUsedMasterPasswordHash: function(){
				// Store the (possibly updated) last used master password hash.
				var new_hash = ui.steps.master1.getMasterPasswordHash();
				if(new_hash !== ui.lastUsedMasterPasswordHash){
					ui.lastUsedMasterPasswordHash = new_hash;
					// We only store it in local JS variable here, and we fire an event to allow
					// other things (such as the Chrome extension) to listen for it.
					$(document).trigger(
						ui.lastUsedMasterPasswordHashUpdatedEventName,
						[ui.lastUsedMasterPasswordHash]
					);
				}
			},
		},

		result: {
			init: function(){
				// Called when the entire UI is first loaded (i.e. on page load)
				var input = $("#generated-password");
				ui.steps.result.input = input;
				$("#reset").on("click", ui.steps.common.reset);
				$("#copy").on("click", ui.dom.copyPasswordToClipboard);
			},

			load: function(){
				// Called when this step is (re-)displayed
				ui.analytics.logStep("result");

				// We now have (even more) sensitive data in the page, so make sure the self-destruct
				// timer is set, and (more likely) reset it so that the user has time to copy their
				// generated password before we blow everything up
				ui.steps.common.setSelfDestruct();

				ui.steps.result.input.val(ui.generatedPassword).select();
				ui.dom.copyPasswordToClipboard(); // might be blocked by browser if hashing took too long
				// Wipe out the value(s) from the master password input(s) so that it stays in
				// memory for as little time as possible
				ui.steps.master1.input.val("");
				ui.steps.master2.input.val("");
			},

			submit: function(){
				// Called when the user (tries to) submit(s) this step
			}
		}
	},

	dom: {
		// General functions for manipulating the page UI
		// ==============================================
		showStep: function(step){
			// Show the given step, hiding the others
			$(".step").addClass("hide");
			$(".step." + step).removeClass("hide");
			ui.steps[step].load();
		},

		showPreviousStep: function(){
			var previous_step_name = $(".step:not(.hide)").prev().data("step-name");
			ui.dom.showStep(previous_step_name);
		},

		updateNormalisedName: function(){
			// Update the various bits of the page which say "Your password for {name}".
			$(".normalised-name").text(tp.normaliseName(ui.steps.name.input.val()));
		},

		togglePasswordDisplay: function(){
			// Arguably the part of this which works out whether to show or hide the password
			// (rather than the part which manipulates the DOM) should be in ui.steps.common
			var $this = $(this);
			var show = $this.is(":checked");
			var type = show === true ? "text" : "password";
			$this.closest(".step").find("input:first").attr("type", type);
		},

		copyPasswordToClipboard: function(){
			var $temp = $("<input>");
			$("body").append($temp);
			$temp.val(ui.generatedPassword).select();
			var success = document.execCommand("copy");
			$temp.remove();
			if(success){
				$(".not-copied").addClass("hide");
				$(".copied").removeClass("hide");
			}
			$(ui.steps.result.input).select(); // Select the input again
		}
	},

	analytics: {
		logStep: function(step_name){
			ga('send', 'event', 'generator-ui-interaction', step_name + '-step-loaded', 'generator-steps');
		}
	}
};
