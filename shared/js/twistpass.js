/* Generic TwistPass stuff that will be used across all implementations */

var sp = {

	// This salt has nothing to do with password security, it's for copyright protection.
	// When TwistPass becomes amazingly popular and is used by billions of people around the world
	// and nasty opportunists start to make their own compatible knock-offs with adverts or malware
	// in them, this salt will allow us to have them taken down, because while the concept of
	// TwistPass is not patented, the code itself is protected by copyright, and this salt ensures
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
		var hashObj = new jsSHA("SHA-512", "TEXT", {numRounds: 20000});
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
