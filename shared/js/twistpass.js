/* Generic TwistPass stuff that will be used across all implementations */

var tp = {

	// This salt has nothing to do with password security, it's for copyright protection.
	// When TwistPass becomes amazingly popular and is used by billions of people around the world
	// and nasty opportunists start to make their own compatible knock-offs with adverts or malware
	// in them, this salt will allow us to have them taken down, because while the concept of
	// TwistPass is not patented, the code itself is protected by copyright, and this salt ensures
	// that any compatible knock-off is (by the fact that it is compatible) in breach of copyright.
	sillySalt: "SxeMIZqM8fMlKZh4K6UzsZu45o3x6rK3yp3DXu2fu53ZHn6",

	normaliseName: function(name_text){
		// Given the text from the `name` input, return a normalised version.
		// Essentially this means removing whitespace and lowercasing it.
		// Note that this will need to be the same in all implementations
		name_text = name_text.toLowerCase();
		name_text = name_text.replace(/\s/g, ""); // Remove all whitespace
		name_text = name_text.replace(/[_-]/g, ""); // Remove underscores and hyphens
		return name_text;
	},

	getNameFromUrl: function(url){
		// TODO: given a URL, e.g. http://bbc.co.uk?a=b, extract the name, e.g. 'bbc'.
		// This is by its very nature an inexact, error-prone and ever-changing game.
		// First, remove trailing slashes, query strings, hash fragments and friends
		var domain_name = url.toLowerCase().replace(/\/$|\?.+|#.+/g, "");

		if(/^[a-z]+:\/\//.test(domain_name)){
			if(!/^https?:\/\//.test(domain_name)){
				//It starts with protocol:// and protocol is not http or https, bail.
				return "";
			}else{
				// Remove the protocol
				domain_name = domain_name.replace(/https?:\/\//, "");
			}
		}
		// Now remove any path
		domain_name = domain_name.replace(/\/.*/, "");

		if(!domain_name.match(/[^\.]\.[a-z]+$/)){
			// Doesn't look like a domain name at all
			return "";
		}
		var tld = domain_name.match(/\.([a-z]+$)/)[1];
		var sld = domain_name.match(/([^\.]+)\.[a-z]+$/)[1]; //Second level domain
		console.log("TLD:" + tld);
		console.log("SLD:" + sld);
		if(
			// The TLD is a country, and that country does not allow registration of SLDs
			(COUNTRY_TLDS.indexOf(tld) != -1 && COUNTRIES_WHICH_ALLOW_SLDS.indexOf(tld) != -1) ||
			// OR the SLD domain is a common non-registered part, e.g. co.xx, ac.xx, org.xx
			COMMON_SLDS.indexOf(sld) != -1
		){
			// We assume that the registered domain is the 3rd level domain
			var thld = domain_name.match(/([^\.]+)\.[a-z]+\.[a-z]+$/)[1];
			// Try to use the third level domain, or if there isn't one, fall back to the SLD
			return thld ? thld : sld;
		}
		// In all other cases (for now!) we just use the sld
		return sld;
	},

	generatePassword: function(name_text, master_password){
		// Here's where all the magic happens
		var domain = tp.normaliseName(name_text);
		var hashObj = new jsSHA("SHA-512", "TEXT", {numRounds: 20000});
		hashObj.update(domain);
		hashObj.update(master_password);
		hashObj.update(tp.sillySalt);
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

	timeGeneratePassword: function(name_text, master_password){
		var start = new Date().getTime();
		result = tp.generatePassword(name_text, master_password);
		var time = ((new Date()).getTime() - start) / 1000;
		tp.log("generatePassword took " + String(time) + " seconds");
		ga('send', 'event', "web", "event", "hash_time_seconds", time);
		return result;
	},

	hashName: function(name_text){
		// Used for keeping a local store of the previously-used domains, this function returns
		// a hash of the normalised domain so that we're not storing the domains in plain text.
		// (Easy to rainbow table for commonly-used sites, but might as well do it anyway)
		var name = tp.normaliseName(name_text);
		var hashObj = new jsSHA("SHA-512", "TEXT");
		hashObj.update(name);
		return hashObj.getHash("B64");
	},

	log: function(...args){
		if(typeof console !== "undefined"){
			console.log(...args);
		}
	}
};

var COUNTRY_TLDS = [
	"ac", "ad", "ae", "af", "ag", "ai", "al", "am", "an", "ao", "aq", "ar", "as", "at", "au", "aw",
	"ax", "az", "ba", "bb", "bd", "be", "bf", "bg", "bh", "bi", "bj", "bm", "bn", "bo", "bq", "br",
	"bs", "bt", "bv", "bw", "by", "bz", "ca", "cc", "cd", "cf", "cg", "ch", "ci", "ck", "cl", "cm",
	"cn", "co", "cr", "cu", "cv", "cw", "cx", "cy", "cz", "de", "dj", "dk", "dm", "do", "dz", "ec",
	"ee", "eg", "eh", "er", "es", "et", "eu", "fi", "fj", "fk", "fm", "fo", "fr", "ga", "gb", "gd",
	"ge", "gf", "gg", "gh", "gi", "gl", "gm", "gn", "gp", "gq", "gr", "gs", "gt", "gu", "gw", "gy",
	"hk", "hm", "hn", "hr", "ht", "hu", "id", "ie", "il", "im", "in", "io", "iq", "ir", "is", "it",
	"je", "jm", "jo", "jp", "ke", "kg", "kh", "ki", "km", "kn", "kp", "kr", "kw", "ky", "kz", "la",
	"lb", "lc", "li", "lk", "lr", "ls", "lt", "lu", "lv", "ly", "ma", "mc", "md", "me", "mg", "mh",
	"mk", "ml", "mm", "mn", "mo", "mp", "mq", "mr", "ms", "mt", "mu", "mv", "mw", "mx", "my", "mz",
	"na", "nc", "ne", "nf", "ng", "ni", "nl", "no", "np", "nr", "nu", "nz", "om", "pa", "pe", "pf",
	"pg", "ph", "pk", "pl", "pm", "pn", "pr", "ps", "pt", "pw", "py", "qa", "re", "ro", "rs", "ru",
	"rw", "sa", "sb", "sc", "sd", "se", "sg", "sh", "si", "sj", "sk", "sl", "sm", "sn", "so", "sr",
	"ss", "st", "su", "sv", "sx", "sy", "sz", "tc", "td", "tf", "tg", "th", "tj", "tk", "tl", "tm",
	"tn", "to", "tp", "tr", "tt", "tv", "tw", "tz", "ua", "ug", "uk", "us", "uy", "uz", "va", "vc",
	"ve", "vg", "vi", "vn", "vu", "wf", "ws", "ye", "yt", "za", "zm", "zw"
];
var COUNTRIES_WHICH_ALLOW_SLDS = [
	"ac", "ad", "ae", "af", "ag", "ai", "al", "am", "an", "aq", "as", "at", "aw", "ax", "az", "ba",
	"bb", "bd", "be", "bf", "bg", "bh", "bi", "bj", "bm", "bo", "bs", "bw", "by", "bz", "ca", "cc",
	"cd", "cf", "cg", "ch", "ci", "ck", "cl", "cm", "cn", "co", "cr", "cu", "cv", "cx", "cz", "de",
	"dj", "dk", "dm", "do", "dz", "ec", "ee", "eg", "es", "eu", "fi", "fj", "fm", "fo", "fr", "ga",
	"gd", "ge", "gg", "gi", "gl", "gm", "gp", "gr", "gs", "gt", "gw", "gy", "hk", "hm", "hn", "hr",
	"ht", "hu", "id", "ie", "im", "in", "io", "iq", "ir", "is", "it", "je", "jo", "jp", "kg", "ki",
	"km", "kn", "kr", "ky", "kz", "la", "lc", "li", "lk", "lt", "lu", "lv", "ly", "ma", "mc", "md",
	"me", "mg", "mk", "ml", "mn", "mo", "mp", "mr", "ms", "mu", "mv", "mw", "mx", "my", "na", "nc",
	"ne", "nf", "ng", "nl", "no", "nr", "nu", "nz", "pe", "pf", "ph", "pk", "pl", "pn", "pr", "ps",
	"pt", "pw", "re", "ro", "rs", "ru", "rw", "sa", "sc", "sd", "se", "sg", "sh", "si", "sk", "sl",
	"sm", "sn", "so", "sr", "st", "su", "sy", "tc", "td", "tf", "tg", "tj", "tk", "tl", "tm", "tn",
	"to", "tp", "tr", "tt", "tv", "tw", "ua", "ug", "uk", "us", "uy", "uz", "vc", "vg", "vi", "vn",
	"vu", "wf", "ws", "yt", "zm"
];
var COMMON_SLDS = ["co", "ac", "org"];
