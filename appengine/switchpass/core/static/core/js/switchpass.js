/* Generator page */

(function(){

	var sp = {

		init: function(){
			$(".step:not(:last) input").on("keypress", sp.nextStepOnReturn);
			$(".step:not(:last) input").on("keyup", sp.enableNextButtonIfValid);
			$("#master-password-1").on("keyup", sp.updateStrengthOMeter);
			$("button.next-step").on("click", sp.nextStepClick);
			$("button.generate").on("click", sp.generateClick);
			$("button.prev-step").on("click", sp.prevStepClick);
			$(".show-password").on("change", sp.togglePasswordDisplay);
			var $first_input = $(".step:first").find("input:first").focus();
			sp.enableNextButtonIfValid.call($first_input[0]);
		},

		log: function(msg){
			if(typeof console !== "undefined"){
				console.log(msg);
			}
		},

		nextStepClick: function(){
			var $this = $(this);
			if($this.hasClass("disabled")){
				sp.showErrorMessage.call($this.closest(".step").find("input:first"));
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
			sp.log($button);
			sp.log($button.hasClass("disabled"));
			if(sp.isInputValid.call(this)){
				$button.removeClass("disabled");
				// While we're here we also remove any error message which has been previously
				// displayed (see showErrorMessage)
				sp.hideErrorMessage.call(this);
			}else{
				$button.addClass("disabled");
			}
		},

		isInputValid: function(){
			// Is the given input (`this`) valid?
			var $this = $(this);
			var validator = sp.inputValidators[$this.attr("id")];
			sp.log(validator);
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
			sp.nextStepClick.call(this); //trigger the showing of the next step as usual
			if(!$(this).hasClass("disabled")){
				var password = sp.generatePassword();
				$("#generated-password").val(password);
				sp.copyPasswordToClipboard(password);
				sp.nextStepClick.call($(".generating")[0]); //reveal the final 'result' step
				$("#generated-password").select();
			}
		},

		copyPasswordToClipboard: function(password){
			var $temp = $("<input>");
			$("body").append($temp);
			$temp.val(password).select();
			var success = document.execCommand("copy");
			$temp.remove();
			if(success){
				$(".copied").removeClass("hide");
			}
		},

		generatePassword: function(){
			// Here's where all the magic happens
			return "example" + Math.random();
		},

		togglePasswordDisplay: function(){
			var $this = $(this);
			var show = $this.is(":checked");
			var type = show === true ? "text" : "password";
			$this.closest(".step").find("input:first").attr("type", type);
		},

		updateStrengthOMeter: function(){
			var strength = sp.getPasswordStrength($(this).val());
			var colour = sp.getStrengthColour(strength);
			sp.log("password: " + $(this).val());
			sp.log("password legnth: " + String($(this).val().length));
			sp.log(strength);
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
			}else if(num_possibilities < 10000000000000000000000000){
				return "borderline";
			}else if(num_possibilities < 10000000000000000000000000000000){
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

		inputValidators: {
			"domain-name": function($el){
				return Boolean($el.val().length);
			},
			"master-password-1": function($el){
				var strength = sp.getPasswordStrength($el.val());
				return strength === "ok" || strength === "good";
			},
			"master-password-2": function($el){
				return $el.val() === $("#master-password-1").val();
			}
		}

	};

	sp.init();
})();



/* All Pages */

(function(){
	$(".button-collapse").sideNav();
})();
