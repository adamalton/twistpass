// JS for the HTML-based user interface.
// Expects a global variable called 'ga' to exist for making Google Analytics calls to.

var ui = {

	generatedPassword: null,
	currentNameHash: null,
	nameHasBeenUsedBefore: false,

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
			}
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
					// Depending on whether or not the user has generated a password for this
					// name or not before we either want to show the master password confirmation
					// step, or just generate the password
					if(ui.nameHasBeenUsedBefore){
						ui.dom.showStep("generate");
					}else{
						ui.dom.showStep("master2");
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
				tp.log("password legnth: " + String($(this).val().length));
				tp.log(strength);
				$("#strength").removeClass("nothing pathetic very-weak weak borderline ok good")
					.addClass(strength);
				$(".strength-desc").addClass("hide");
				$(".strength-desc." + strength).removeClass("hide");
				$("#strength .progress div").removeClass("grey red orange blue green").addClass(colour);
			},

			updateMaster2RequiredLength: function(){
				ui.steps.master2.updateRequiredLengthDisplay(ui.steps.master1.input.val().length);
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
			}
		},

		result: {
			init: function(){
				// Called when the entire UI is first loaded (i.e. on page load)
				var input = $("#generated-password");
				ui.steps.result.input = input;
				$("#copy").on("click", ui.dom.copyPasswordToClipboard);
			},

			load: function(){
				// Called when this step is (re-)displayed
				ui.analytics.logStep("result");
				ui.steps.result.input.val(ui.generatedPassword).select();
				ui.dom.copyPasswordToClipboard(); // might be blocked by browser if hashing took too long
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
