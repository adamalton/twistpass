/* Generic Switchpass stuff that will be used across all implementations */

var sp = {

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
	}
};


/* Generator page UI */

(function(){

	var ui = {

		init: function(){
			$(".step:not(:last) input").on("keypress", ui.nextStepOnReturn);
			$(".step:not(:last) input").on("keyup", ui.enableNextButtonIfValid);
			$("#domain-name").on("keyup", ui.updateNormalisedDomainName);
			$("#master-password-1").on("keyup", ui.updateStrengthOMeter).on("keyup", ui.updatePassword2RequiredLength);
			$("#master-password-2").on("keyup", ui.updatePasswordsMatchIndicator);
			$("button.next-step").on("click", ui.nextStepClick);
			$("button.generate").on("click", ui.generateClick);
			$("button.prev-step").on("click", ui.prevStepClick);
			$(".show-password").on("change", ui.togglePasswordDisplay);
			$("#copy").on("click", ui.copyPasswordToClipboard);
			var $first_input = $(".step:first").find("input:first").focus();
			ui.enableNextButtonIfValid.call($first_input[0]);
		},

		log: function(msg){
			if(typeof console !== "undefined"){
				console.log(msg);
			}
		},

		nextStepClick: function(){
			var $this = $(this);
			if($this.hasClass("disabled")){
				ui.showErrorMessage.call($this.closest(".step").find("input:first")[0]);
			}else{
				$this.closest(".step").addClass("hide").next().removeClass("hide").find("input:first").focus();
			}
		},

		prevStepClick: function(){
			$(this).closest(".step").addClass("hide").prev().removeClass("hide").find("input:first").focus();
		},

		enableNextButtonIfValid: function(){
			// If `this` <input> is valid then enable the "Next" button in this step
			var $this = $(this);
			var $button = $this.closest(".step").find("button.next-step,button.generate");
			ui.log($button);
			ui.log($button.hasClass("disabled"));
			if(ui.isInputValid.call(this)){
				$button.removeClass("disabled");
				// While we're here we also remove any error message which has been previously
				// displayed (see showErrorMessage)
				ui.hideErrorMessage.call(this);
			}else{
				$button.addClass("disabled");
			}
		},

		isInputValid: function(){
			// Is the given input (`this`) valid?
			var $this = $(this);
			var validator = ui.inputValidators[$this.attr("id")];
			ui.log(validator);
			console.log("Is valid: " + validator($this));
			return validator($this);
		},

		nextStepOnReturn: function(e){
			// When the return key is pressed, continue to the next step if this step is valid
			if(e.keyCode === 13){
				var $button = $(this).closest(".step").find("button.next-step,button.generate");
				$button.trigger("click");
			}
		},

		showErrorMessage: function(){
			// Show the error message for the given input (`this`).  We only do this when the user
			// tries to continue to the next step, we don't update it continuously as they type.
			$(this).addClass("invalid");
		},

		hideErrorMessage: function(){
			$(this).removeClass("invalid");
		},

		generateClick: function(){
			// Event handler for when the "Generate" button is clicked
			ui.nextStepClick.call(this); //trigger the showing of the next step as usual
			if(!$(this).hasClass("disabled")){
				setTimeout(ui.generatePassword, 100);
			}
		},

		generatePassword: function(){
			// Separated only to allow us to delay it so that the UI can update *before* we
			// set off the hashing algorithm
			var password = sp.generatePassword($("#domain-name").val(), $("#master-password-1").val());
			$("#generated-password").val(password);
			ui.copyPasswordToClipboard(password);
			ui.nextStepClick.call($(".generating")[0]); //reveal the final 'result' step
			$("#generated-password").select();
		},

		copyPasswordToClipboard: function(password){
			var $temp = $("<input>");
			$("body").append($temp);
			$temp.val(password).select();
			var success = document.execCommand("copy");
			$temp.remove();
			if(success){
				$(".not-copied").addClass("hide");
				$(".copied").removeClass("hide");
			}
			$("#generated-password").select(); // Select the input again
		},

		togglePasswordDisplay: function(){
			var $this = $(this);
			var show = $this.is(":checked");
			var type = show === true ? "text" : "password";
			$this.closest(".step").find("input:first").attr("type", type);
		},

		updateNormalisedDomainName: function(){
			$(".normalised-domain-name").text(sp.normaliseDomain($(this).val()));
		},

		updateStrengthOMeter: function(){
			var strength = ui.getPasswordStrength($(this).val());
			var colour = ui.getStrengthColour(strength);
			ui.log("password: " + $(this).val());
			ui.log("password legnth: " + String($(this).val().length));
			ui.log(strength);
			$("#strength").removeClass("nothing pathetic very-weak weak borderline ok good")
				.addClass(strength);
			$(".strength-desc").addClass("hide");
			$(".strength-desc." + strength).removeClass("hide");
			$("#strength .progress div").removeClass("grey red orange blue green").addClass(colour);
		},

		getPasswordStrength: function(password){
			// Very basic alorithm for determining roughly how "strong" a password is.
			// Ignores unicode and whether or not things are dictionary words
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

		updatePasswordsMatchIndicator: function(){
			// Update an indiactor to show if the 2 passwords do(n't) match
			var $this = $(this);
			var this_val = $this.val();
			if(this_val !== $("#master-password-1").val().slice(0, this_val.length)){
				ui.showErrorMessage.call(this);
			}else{
				ui.hideErrorMessage.call(this);
			}
		},

		updatePassword2RequiredLength: function(){
			// Update the limit value for the "x/y" character counter on the master-password-2 input
			$("#master-password-2").attr("length", $(this).val().length);
		},

		inputValidators: {
			"domain-name": function($el){
				return Boolean($el.val().length);
			},
			"master-password-1": function($el){
				var strength = ui.getPasswordStrength($el.val());
				return strength === "ok" || strength === "good";
			},
			"master-password-2": function($el){
				return $el.val() === $("#master-password-1").val();
			}
		},

	};

	ui.init();
})();



/* All Pages */

(function(){
	$(".button-collapse").sideNav();
})();
