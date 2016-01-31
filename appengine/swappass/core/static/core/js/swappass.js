/* Generic SwapPass stuff that will be used across all implementations */

var sp = {

	// This salt has nothing to do with password security, it's for copyright protection.
	// When SwapPass becomes amazingly popular and is used by billions of people around the world
	// and nasty opportunists start to make their own compatible knock-offs with adverts or malware
	// in them, this salt will allow us to have them taken down, because while the concept of
	// SwapPass is not patented, the code itself is protected by copyright, and this salt ensures
	// that any compatible knock-off is (by the fact that it is compatible) in breach of copyright.
	sillySalt: "SxeMIZqM8fMlKZh4K6UzsZu45o3x6rK3yp3DXu2fu53ZHn6",

	normaliseDomain: function(domain_text){
		// Given the text from the `domain` input, return the perceived domain name
		// Note that this will need to be the same in all implementations
		domain_text = domain_text.toLowerCase().trim();
		if(/^https?:\/\//.test(domain_text) || /^[a-z0-9-][a-z0-9\.-]*\.[a-z]{2,}\/?/.test(domain_text)){
			// If it looks like a domain name
			domain_text = domain_text.replace(/^https?:\/\//, "").replace(/\/.*/, ""); // get only the domain bit
			if(/^www\./.test(domain_text) && domain_text.match(/\./).length >= 2){
				// If it starts with www. and www. is not the main part of the domain (e.g. it's not www.com)
				domain_text = domain_text.replace(/^www\./, ""); // Strip out the leading www.
			}

		}
		return domain_text;
	},

	generatePassword: function(domain_text, master_password){
		// Here's where all the magic happens
		var domain = sp.normaliseDomain(domain_text);
		var hashObj = new jsSHA("SHA-512", "TEXT", {numRounds: 100000});
		hashObj.update(domain);
		hashObj.update(master_password);
		hashObj.update(sp.sillySalt);
		var result = hashObj.getHash("B64");
		result = result.slice(0, 20);
		// Now give it as good a chance as possible of being accepted by fussy websites
		result = result.replace(/\//g, "!"); // replace forward slashes with exclamation marks
		if(result === result.toLowerCase()){ // If it's all lowercase
			// Make the first character uppercase
			result = result.slice(0, 1).toUpperCase() + result.slice(1, result.length);
		}else if(result === result.toUpperCase()){ // If it's all uppercase
			result = result.slice(0, 1).toLowerCase() + result.slice(1, result.length);
			// Make the first character lowercase
		}
		if(!/!|\+/.test(result)){ // If it doesn't contain any punctuation
			result += "!"; // Add an exclamation mark onto the end
		}
		return result;
	},

	timeGeneratePassword: function(domain_text, master_password){
		var start = new Date().getTime();
		result = sp.generatePassword(domain_text, master_password);
		var time = ((new Date()).getTime() - start) / 1000;
		sp.log("generatePassword took " + String(time) + " seconds");
		ga('send', 'event', "web", "event", "hash_time_seconds", time);
		return result;
	},

	hashDomain: function(domain_text){
		// Used for keeping a local store of the previously-used domains, this function returns
		// a hash of the normalised domain so that we're not storing the domains in plain text.
		// (Easy to rainbow table for commonly-used sites, but might as well do it anyway)
		var domain = sp.normaliseDomain(domain_text);
		var hashObj = new jsSHA("SHA-512", "TEXT");
		hashObj.update(domain);
		return hashObj.getHash("B64");
	},

	log: function(msg){
		if(typeof console !== "undefined"){
			console.log(msg);
		}
	}
};


/* Generator page UI */


var ui = {

	generatedPassword: null,
	currentDomainHash: null,
	domainHasBeenUsedBefore: false,

	init: function(){
		ui.steps.common.init();
		ui.steps.domain.init();
		ui.steps.master1.init();
		ui.steps.master2.init();
		ui.steps.generate.init();
		ui.steps.result.init();

		ui.steps.domain.load(); // This step is what's initially displayed
	},

	steps: {
		// Functionality which is discrete to each step
		// ============================================

		common: {
			// Ok, not all of the functionality is discrete to each step!
			// ==========================================================

			init: function(){
				$("button.prev-step").on("click", ui.dom.showPrevioiusStep);
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

		domain: {
			init: function(){
				// Called when the entire UI is first loaded (i.e. on page load)
				var input = $("#domain-name");
				ui.steps.domain.input = input;
				input.on("keypress", ui.steps.common.submitOnReturn);
				input.on("keyup", ui.steps.domain.validate);
				input.on("keyup", ui.dom.updateNormalisedDomainName);
				var button = $(".step.domain button").eq(0);
				ui.steps.domain.button = button;
				button.on("click", ui.steps.domain.submit);
			},

			load: function(){
				// Called when this step is (re-)displayed
				ui.analytics.logStep("domain");
				ui.steps.domain.input.focus();
				// If the user refreshes the page then the 'domain' input may be pre-populated,
				// so validate what's in there to start with.
				ui.steps.domain.validate();
			},

			validate: function(){
				// Peform validation and update the UI of this step accordingly.
				// Returns the result of isValid() for convenience.
				var is_valid = ui.steps.domain.isValid();
				if(is_valid){
					ui.steps.domain.button.removeClass("disabled");
					ui.steps.domain.input.removeClass("invalid");
				}else{
					ui.steps.domain.button.addClass("disabled");
					// Note that we don't show an error message on the input unless the user
					// tries to submit the step
				}
				return is_valid;
			},

			submit: function(){
				// Called when the user (tries to) submit(s) this step
				if(ui.steps.domain.validate()){
					ui.steps.domain.checkIfDomainHasBeenUsedBefore();
					ui.dom.showStep("master1");
				}else{
					// Display of the error message is only done here when the user tries
					// to subit the step, not every time we validate, which is on each keystroke
					ui.steps.domain.input.addClass("invalid");
				}
			},

			isValid: function(){
				return Boolean(ui.steps.domain.input.val().length);
			},

			checkIfDomainHasBeenUsedBefore: function(){
				// See if the user has previously generated a password for this domain, and update
				// ui.domainHasBeenUsedBefore accordingly
				var previous_hashes = JSON.parse(localStorage.getItem("previously-used-domain-hashes") || "[]");
				// For a bit of extra privacy we store hashes of the previously used domains
				ui.currentDomainHash = sp.hashDomain(ui.steps.domain.input.val());
				ui.domainHasBeenUsedBefore = previous_hashes.indexOf(ui.currentDomainHash) != -1;
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

				if(ui.domainHasBeenUsedBefore){
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
					// domain or not before we either want to show the master password confirmation
					// step, or just generate the password
					if(ui.domainHasBeenUsedBefore){
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
				}else if(num_possibilities < 100000000000000000000000){
					return "borderline";
				}else if(num_possibilities < 100000000000000000000000000000){
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
				sp.log("password: " + $(this).val());
				sp.log("password legnth: " + String($(this).val().length));
				sp.log(strength);
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
					sp.log("invalid");
					ui.steps.master2.input.addClass("invalid");
				}else{
					sp.log("valid");
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
				ui.generatedPassword = sp.timeGeneratePassword(
					ui.steps.domain.input.val(), // Normalisation is done for us
					ui.steps.master1.input.val()
				);
				ui.steps.generate.addDomainToPreviouslyUsedList();
				ui.dom.showStep("result");
			},

			addDomainToPreviouslyUsedList: function(){
				// Store the domain of the password that we've generated so that we don't ask the
				// user to confirm the master password for it next time
				var hashes = JSON.parse(localStorage.getItem("previously-used-domain-hashes") || "[]");
				sp.log("hashes...");
				sp.log(hashes);
				sp.log(typeof hashes);
				hashes.push(sp.hashDomain(ui.steps.domain.input.val()));
				localStorage.setItem("previously-used-domain-hashes", JSON.stringify(hashes));
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

		showPrevioiusStep: function(){
			var previous_step_name = $(".step:not(.hide)").prev().data("step-name");
			ui.dom.showStep(previous_step_name);
		},

		updateNormalisedDomainName: function(){
			// Update the various bits of the page which say "Your password for {domain-name}".
			$(".normalised-domain-name").text(sp.normaliseDomain(ui.steps.domain.input.val()));
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


/* Google Analytics */
if(!/localhost/.test(document.location.href)){
	(function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
	(i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
	m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
	})(window,document,'script','//www.google-analytics.com/analytics.js','ga');
}else{
	var ga = function(a, b, c, d, e, f, g){
		var arr = [a, b, c, d, e, f, g];
		sp.log("[debug] Analytics call: [" + arr.join(", ") + "]");
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
