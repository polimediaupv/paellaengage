/* base.js: some utility functions to complement jQuery library 
	Copyright (c) 2012 Fernando Serrano Carpena
	fernando@vitaminew.com
	http://www.vitaminew.com/basejs
*/

/*
  Part 1:
  Class, version 2.7
  Copyright (c) 2006, 2007, 2008, Alex Arnell <alex@twologic.com>
  
  Redistribution and use in source and binary forms, with or without modification, are
  permitted provided that the following conditions are met:

  * Redistributions of source code must retain the above copyright notice, this list
    of conditions and the following disclaimer.
  * Redistributions in binary form must reproduce the above copyright notice, this
    list of conditions and the following disclaimer in the documentation and/or other
    materials provided with the distribution.
  * Neither the name of typicalnoise.com nor the names of its contributors may be
    used to endorse or promote products derived from this software without specific prior
    written permission.

  THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY
  EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF
  MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL
  THE COPYRIGHT OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
  SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT
  OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION)
  HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR
  TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
  SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
*/

var Class = (function() {
  var __extending = {};

  return {
    extend: function(parent, def) {
      if (arguments.length == 1) { def = parent; parent = null; }
      var func = function() {
        if (arguments[0] ==  __extending) { return; }
        if (!this.initialize) {
        	this.initialize = function() {}
        }
        this.initialize.apply(this, arguments);
      };
      if (typeof(parent) == 'function') {
        func.prototype = new parent( __extending);
      }
      var mixins = [];
      if (def && def.include) {
        if (def.include.reverse) {
          // methods defined in later mixins should override prior
          mixins = mixins.concat(def.include.reverse());
        } else {
          mixins.push(def.include);
        }
        delete def.include; // clean syntax sugar
      }
      if (def) Class.inherit(func.prototype, def);
      for (var i = 0; (mixin = mixins[i]); i++) {
        Class.mixin(func.prototype, mixin);
      }
      return func;
    },
    mixin: function (dest, src, clobber) {
      clobber = clobber || false;
      if (typeof(src) != 'undefined' && src !== null) {
        for (var prop in src) {
          if (clobber || (!dest[prop] && typeof(src[prop]) == 'function')) {
            dest[prop] = src[prop];
          }
        }
      }
      return dest;
    },
    inherit: function(dest, src, fname) {
      if (arguments.length == 3) {
        var ancestor = dest[fname], descendent = src[fname], method = descendent;
        descendent = function() {
          var ref = this.parent; this.parent = ancestor;
          var result = method.apply(this, arguments);
          ref ? this.parent = ref : delete this.parent;
          return result;
        };
        // mask the underlying method
        descendent.valueOf = function() { return method; };
        descendent.toString = function() { return method.toString(); };
        dest[fname] = descendent;
      } else {
        for (var prop in src) {
          if (dest[prop] && typeof(src[prop]) == 'function') {
            Class.inherit(dest, src, prop);
          } else {
            dest[prop] = src[prop];
          }
        }
      }
      return dest;
    },
    singleton: function() {
      var args = arguments;
      if (args.length == 2 && args[0].getInstance) {
        var klass = args[0].getInstance(__extending);
        // we're extending a singleton swap it out for it's class
        if (klass) { args[0] = klass; }
      }

      return (function(args){
        // store instance and class in private variables
        var instance = false;
        var klass = Class.extend.apply(args.callee, args);
        return {
          getInstance: function () {
            if (arguments[0] == __extending) return klass;
            if (instance) return instance;
            return (instance = new klass());
          }
        };
      })(args);
    }
  };
})();

// finally remap Class.create for backward compatability with prototype
Class.create = function() {
  return Class.extend.apply(this, arguments);
};


/* Part 2: base.js library */

var UserAgent = Class.create({
	system:{},
	browser:{},

	initialize:function(userAgentString) {
		if (!userAgentString) {
			userAgentString = navigator.userAgent;
		}
		this.parseOperatingSystem(userAgentString);
		this.parseBrowser(userAgentString);
	},

	parseOperatingSystem:function(userAgentString) {
		this.system.MacOS = /Macintosh/.test(userAgentString);
		this.system.Windows = /Windows/.test(userAgentString);
		this.system.iPhone = /iPhone/.test(userAgentString);
		this.system.iPodTouch = /iPod/.test(userAgentString);
		this.system.iPad = /iPad/.test(userAgentString);
		this.system.iOS = this.system.iPhone || this.system.iPad || this.system.iPodTouch;
		this.system.Android = /Android/.test(userAgentString);
		this.system.Linux = (this.system.Android) ? false:/Linux/.test(userAgentString);

		if (this.system.MacOS) {
			this.system.OSName = "Mac OS X";
			this.parseMacOSVersion(userAgentString);
		}
		else if (this.system.Windows) {
			this.system.OSName = "Windows";
			this.parseWindowsVersion(userAgentString);
		}
		else if (this.system.Linux) {
			this.system.OSName = "Linux";
			this.parseLinuxVersion(userAgentString);
		}
		else if (this.system.iOS) {
			this.system.OSName = "iOS";
			this.parseIOSVersion(userAgentString);
		}
		else if (this.system.Android) {
			this.system.OSName = "Android";
			this.parseAndroidVersion(userAgentString);
		}
	},

	parseBrowser:function(userAgentString) {
		// Safari: Version/X.X.X Safari/XXX
		// Chrome: Chrome/XX.X.XX.XX Safari/XXX
		// Opera: Opera/X.XX
		// Firefox: Gecko/XXXXXX Firefox/XX.XX.XX
		// Explorer: MSIE X.X
		this.browser.Version = {};
		this.browser.Safari = /Version\/([\d\.]+) Safari\//.test(userAgentString);
		if (this.browser.Safari) {
			this.browser.Name = "Safari";
			this.browser.Vendor = "Apple";
			this.browser.Version.versionString = RegExp.$1;
		}

		this.browser.Chrome = /Chrome\/([\d\.]+) Safari\//.test(userAgentString);
		if (this.browser.Chrome) {
			this.browser.Name = "Chrome";
			this.browser.Vendor = "Google";
			this.browser.Version.versionString = RegExp.$1;
		}

		this.browser.Opera = /Opera\/[\d\.]+/.test(userAgentString);
		if (this.browser.Opera) {
			this.browser.Name = "Opera";
			this.browser.Vendor = "Opera Software";
			var versionString = /Version\/([\d\.]+)/.test(userAgentString);
			this.browser.Version.versionString = RegExp.$1;
		}

		this.browser.Firefox = /Gecko\/[\d\.]+ Firefox\/([\d\.]+)/.test(userAgentString);
		if (this.browser.Firefox) {
			this.browser.Name = "Firefox";
			this.browser.Vendor = "Mozilla Foundation";
			this.browser.Version.versionString = RegExp.$1;
		}
		
		this.browser.Explorer = /MSIE ([\d\.]+)/.test(userAgentString);
		if (this.browser.Explorer) {
			this.browser.Name = "Internet Explorer";
			this.browser.Vendor = "Microsoft";
			this.browser.Version.versionString = RegExp.$1;
		}
		
		if (this.system.iOS) {
			this.browser.IsMobileVersion = true;
			this.browser.MobileSafari = /Version\/([\d\.]+) Mobile/.test(userAgentString);
			if (this.browser.MobileSafari) {
				this.browser.Name = "Mobile Safari";
				this.browser.Vendor = "Apple";
				this.browser.Version.versionString = RegExp.$1;
			}
			this.browser.Android = false;
		}
		else if (this.system.Android) {
			this.browser.IsMobileVersion = true;
			this.browser.Android = /Version\/([\d\.]+) Mobile/.test(userAgentString);
			if (this.browser.MobileSafari) {
				this.browser.Name = "Android Browser";
				this.browser.Vendor = "Google";
				this.browser.Version.versionString = RegExp.$1;
			}
			else {
				this.browser.Chrome = /Chrome\/([\d\.]+)/.test(userAgentString);
				this.browser.Name = "Chrome";
				this.browser.Vendor = "Google";
				this.browser.Version.versionString = RegExp.$1;
			}
			
			this.browser.Safari = false;
		}
		else {
			this.browser.IsMobileVersion = false;
		}
		
		this.parseBrowserVersion(userAgentString);
	},

	parseBrowserVersion:function(userAgentString) {
		if (/([\d]+)\.([\d]+)\.*([\d]*)/.test(this.browser.Version.versionString)) {
			this.browser.Version.major = Number(RegExp.$1);
			this.browser.Version.minor = Number(RegExp.$2);
			this.browser.Version.revision = (RegExp.$3) ? Number(RegExp.$3):0;
		}
	},

	parseMacOSVersion:function(userAgentString) {
		var versionString = (/Mac OS X (\d+_\d+_*\d*)/.test(userAgentString)) ? RegExp.$1:'';
		this.system.Version = {};
		// Safari/Chrome
		if (versionString!='') {
			if (/(\d+)_(\d+)_*(\d*)/.test(versionString)) {
				this.system.Version.major = Number(RegExp.$1);
				this.system.Version.minor = Number(RegExp.$2);
				this.system.Version.revision = (RegExp.$3) ? Number(RegExp.$3):0;
			}
		}
		// Firefox/Opera
		else { 
			versionString = (/Mac OS X (\d+\.\d+\.*\d*)/.test(userAgentString)) ? RegExp.$1:'Unknown';
			if (/(\d+)\.(\d+)\.*(\d*)/.test(versionString)) {
				this.system.Version.major = Number(RegExp.$1);
				this.system.Version.minor = Number(RegExp.$2);
				this.system.Version.revision = (RegExp.$3) ? Number(RegExp.$3):0;
			}
		}
		if (!this.system.Version.major) {
			this.system.Version.major = 0;
			this.system.Version.minor = 0;
			this.system.Version.revision = 0;
		}
		this.system.Version.stringValue = this.system.Version.major + '.' + this.system.Version.minor + '.' + this.system.Version.revision;
		switch (this.system.Version.minor) {
			case 0:
				this.system.Version.name = "Cheetah";
				break;
			case 1:
				this.system.Version.name = "Puma";
				break;
			case 2:
				this.system.Version.name = "Jaguar";
				break;
			case 3:
				this.system.Version.name = "Panther";
				break;
			case 4:
				this.system.Version.name = "Tiger";
				break;
			case 5:
				this.system.Version.name = "Leopard";
				break;
			case 6:
				this.system.Version.name = "Snow Leopard";
				break;
			case 7:
				this.system.Version.name = "Lion";
				break;
			case 8:
				this.system.Version.name = "Mountain Lion";
				break;
		}
	},

	parseWindowsVersion:function(userAgentString) {
		this.system.Version = {};
		if (/NT (\d+)\.(\d*)/.test(userAgentString)) {
			this.system.Version.major = Number(RegExp.$1);
			this.system.Version.minor = Number(RegExp.$2);
			this.system.Version.revision = 0;	// Solo por compatibilidad
			this.system.Version.stringValue = "NT " + this.system.Version.major + "." + this.system.Version.minor;
			var major = this.system.Version.major;
			var minor = this.system.Version.minor;
			var name = 'undefined';
			if (major==5) {
				if (minor==0) this.system.Version.name = '2000';
				else this.system.Version.name = 'XP';
			}
			else if (major==6) {
				if (minor==0) this.system.Version.name = 'Vista';
				else if (minor==1) this.system.Version.name = '7';
				else if (minor==2) this.system.Version.name = '8';
			}
		}
		else {
			this.system.Version.major = 0;
			this.system.Version.minor = 0;
			this.system.Version.name = "Unknown";
			this.system.Version.stringValue = "Unknown";
		}
	},
	
	parseLinuxVersion:function(userAgentString) {
		// Muchos navegadores no proporcionan información sobre la distribución de linux... no se puede hacer mucho más que esto
		this.system.Version = {};
		this.system.Version.major = 0;
		this.system.Version.minor = 0;
		this.system.Version.revision = 0;
		this.system.Version.name = "";
		this.system.Version.stringValue = "Unknown distribution";
	},

	parseIOSVersion:function(userAgentString) {
		this.system.Version = {};
		if (/iPhone OS (\d+)_(\d+)_*(\d*)/i.test(userAgentString)) {
			this.system.Version.major = Number(RegExp.$1);
			this.system.Version.minor = Number(RegExp.$2);
			this.system.Version.revision = (RegExp.$3) ? Number(RegExp.$3):0;
			this.system.Version.stringValue = this.system.Version.major + "." + this.system.Version.minor + '.' + this.system.Version.revision;
			this.system.Version.name = "iOS";
		}
		else {
			this.system.Version.major = 0;
			this.system.Version.minor = 0;
			this.system.Version.name = "Unknown";
			this.system.Version.stringValue = "Unknown";
		}
	},

	parseAndroidVersion:function(userAgentString) {
		this.system.Version = {};
		if (/Android (\d+)\.(\d+)\.*(\d*)/.test(userAgentString)) {
			this.system.Version.major = Number(RegExp.$1);
			this.system.Version.minor = Number(RegExp.$2);
			this.system.Version.revision = (RegExp.$3) ? Number(RegExp.$3):0;
			this.system.Version.stringValue = this.system.Version.major + "." + this.system.Version.minor + '.' + this.system.Version.revision;
		}
		else {
			this.system.Version.major = 0;
			this.system.Version.minor = 0;
			this.system.Version.revision = 0;
		}
		if (/Build\/([a-zA-Z]+)/.test(userAgentString)) {
			this.system.Version.name = RegExp.$1;
		}
		else {
			this.system.Version.name = "Unknown version";
		}
		this.system.Version.stringValue = this.system.Version.major + "." + this.system.Version.minor + '.' + this.system.Version.revision;
	},

	getInfoString:function() {
		return navigator.userAgent;
	}
});


var TimerManager = Class.create({
	timerArray:new Array(),
	lastId:0,

	setupTimer:function(timer,time) {
		this.lastId++;
		timer.timerId = this.lastId;
		timer.timeout = time;
		this.timerArray[this.lastId] = timer;
		timer.jsTimerId = setTimeout("timerManager.executeTimerCallback(" + this.lastId + ")",time);
	},

	executeTimerCallback:function(timerId) {
		var timer = this.timerArray[timerId];
		if (timer && timer.callback) {
			timer.callback(timer,timer.params);
		}
		if (timer.repeat) {
			timer.jsTimerId = setTimeout("timerManager.executeTimerCallback(" + timer.timerId + ")",timer.timeout);
		}
	}
});

var timerManager = new TimerManager();

var Timer = Class.create({
	timerId:0,
	callback:null,
	params:null,
	jsTimerId:0,
	repeat:false,
	timeout:0,
	
	initialize:function(callback,time,params) {
		this.callback = callback;
		this.params = params;
		timerManager.setupTimer(this,time);
	},
	
	cancel:function() {
		clearTimeout(this.jsTimerId);
	}
});
