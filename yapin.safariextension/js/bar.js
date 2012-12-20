var CLOSURE_NO_DEPS = true;
var COMPILED = false;
var goog = goog || {};
goog.global = this;
goog.DEBUG = true;
goog.LOCALE = "en";
goog.provide = function(name) {
  if(!COMPILED) {
    if(goog.isProvided_(name)) {
      throw Error('Namespace "' + name + '" already declared.');
    }
    delete goog.implicitNamespaces_[name];
    var namespace = name;
    while(namespace = namespace.substring(0, namespace.lastIndexOf("."))) {
      if(goog.getObjectByName(namespace)) {
        break
      }
      goog.implicitNamespaces_[namespace] = true
    }
  }
  goog.exportPath_(name)
};
goog.setTestOnly = function(opt_message) {
  if(COMPILED && !goog.DEBUG) {
    opt_message = opt_message || "";
    throw Error("Importing test-only code into non-debug environment" + opt_message ? ": " + opt_message : ".");
  }
};
if(!COMPILED) {
  goog.isProvided_ = function(name) {
    return!goog.implicitNamespaces_[name] && !!goog.getObjectByName(name)
  };
  goog.implicitNamespaces_ = {}
}
goog.exportPath_ = function(name, opt_object, opt_objectToExportTo) {
  var parts = name.split(".");
  var cur = opt_objectToExportTo || goog.global;
  if(!(parts[0] in cur) && cur.execScript) {
    cur.execScript("var " + parts[0])
  }
  for(var part;parts.length && (part = parts.shift());) {
    if(!parts.length && goog.isDef(opt_object)) {
      cur[part] = opt_object
    }else {
      if(cur[part]) {
        cur = cur[part]
      }else {
        cur = cur[part] = {}
      }
    }
  }
};
goog.getObjectByName = function(name, opt_obj) {
  var parts = name.split(".");
  var cur = opt_obj || goog.global;
  for(var part;part = parts.shift();) {
    if(goog.isDefAndNotNull(cur[part])) {
      cur = cur[part]
    }else {
      return null
    }
  }
  return cur
};
goog.globalize = function(obj, opt_global) {
  var global = opt_global || goog.global;
  for(var x in obj) {
    global[x] = obj[x]
  }
};
goog.addDependency = function(relPath, provides, requires) {
  if(!COMPILED) {
    var provide, require;
    var path = relPath.replace(/\\/g, "/");
    var deps = goog.dependencies_;
    for(var i = 0;provide = provides[i];i++) {
      deps.nameToPath[provide] = path;
      if(!(path in deps.pathToNames)) {
        deps.pathToNames[path] = {}
      }
      deps.pathToNames[path][provide] = true
    }
    for(var j = 0;require = requires[j];j++) {
      if(!(path in deps.requires)) {
        deps.requires[path] = {}
      }
      deps.requires[path][require] = true
    }
  }
};
goog.ENABLE_DEBUG_LOADER = true;
goog.require = function(name) {
  if(!COMPILED) {
    if(goog.isProvided_(name)) {
      return
    }
    if(goog.ENABLE_DEBUG_LOADER) {
      var path = goog.getPathFromDeps_(name);
      if(path) {
        goog.included_[path] = true;
        goog.writeScripts_();
        return
      }
    }
    var errorMessage = "goog.require could not find: " + name;
    if(goog.global.console) {
      goog.global.console["error"](errorMessage)
    }
    throw Error(errorMessage);
  }
};
goog.basePath = "";
goog.global.CLOSURE_BASE_PATH;
goog.global.CLOSURE_NO_DEPS;
goog.global.CLOSURE_IMPORT_SCRIPT;
goog.nullFunction = function() {
};
goog.identityFunction = function(var_args) {
  return arguments[0]
};
goog.abstractMethod = function() {
  throw Error("unimplemented abstract method");
};
goog.addSingletonGetter = function(ctor) {
  ctor.getInstance = function() {
    return ctor.instance_ || (ctor.instance_ = new ctor)
  }
};
if(!COMPILED && goog.ENABLE_DEBUG_LOADER) {
  goog.included_ = {};
  goog.dependencies_ = {pathToNames:{}, nameToPath:{}, requires:{}, visited:{}, written:{}};
  goog.inHtmlDocument_ = function() {
    var doc = goog.global.document;
    return typeof doc != "undefined" && "write" in doc
  };
  goog.findBasePath_ = function() {
    if(goog.global.CLOSURE_BASE_PATH) {
      goog.basePath = goog.global.CLOSURE_BASE_PATH;
      return
    }else {
      if(!goog.inHtmlDocument_()) {
        return
      }
    }
    var doc = goog.global.document;
    var scripts = doc.getElementsByTagName("script");
    for(var i = scripts.length - 1;i >= 0;--i) {
      var src = scripts[i].src;
      var qmark = src.lastIndexOf("?");
      var l = qmark == -1 ? src.length : qmark;
      if(src.substr(l - 7, 7) == "base.js") {
        goog.basePath = src.substr(0, l - 7);
        return
      }
    }
  };
  goog.importScript_ = function(src) {
    var importScript = goog.global.CLOSURE_IMPORT_SCRIPT || goog.writeScriptTag_;
    if(!goog.dependencies_.written[src] && importScript(src)) {
      goog.dependencies_.written[src] = true
    }
  };
  goog.writeScriptTag_ = function(src) {
    if(goog.inHtmlDocument_()) {
      var doc = goog.global.document;
      doc.write('<script type="text/javascript" src="' + src + '"></' + "script>");
      return true
    }else {
      return false
    }
  };
  goog.writeScripts_ = function() {
    var scripts = [];
    var seenScript = {};
    var deps = goog.dependencies_;
    function visitNode(path) {
      if(path in deps.written) {
        return
      }
      if(path in deps.visited) {
        if(!(path in seenScript)) {
          seenScript[path] = true;
          scripts.push(path)
        }
        return
      }
      deps.visited[path] = true;
      if(path in deps.requires) {
        for(var requireName in deps.requires[path]) {
          if(!goog.isProvided_(requireName)) {
            if(requireName in deps.nameToPath) {
              visitNode(deps.nameToPath[requireName])
            }else {
              throw Error("Undefined nameToPath for " + requireName);
            }
          }
        }
      }
      if(!(path in seenScript)) {
        seenScript[path] = true;
        scripts.push(path)
      }
    }
    for(var path in goog.included_) {
      if(!deps.written[path]) {
        visitNode(path)
      }
    }
    for(var i = 0;i < scripts.length;i++) {
      if(scripts[i]) {
        goog.importScript_(goog.basePath + scripts[i])
      }else {
        throw Error("Undefined script input");
      }
    }
  };
  goog.getPathFromDeps_ = function(rule) {
    if(rule in goog.dependencies_.nameToPath) {
      return goog.dependencies_.nameToPath[rule]
    }else {
      return null
    }
  };
  goog.findBasePath_();
  if(!goog.global.CLOSURE_NO_DEPS) {
    goog.importScript_(goog.basePath + "deps.js")
  }
}
goog.typeOf = function(value) {
  var s = typeof value;
  if(s == "object") {
    if(value) {
      if(value instanceof Array) {
        return"array"
      }else {
        if(value instanceof Object) {
          return s
        }
      }
      var className = Object.prototype.toString.call(value);
      if(className == "[object Window]") {
        return"object"
      }
      if(className == "[object Array]" || typeof value.length == "number" && typeof value.splice != "undefined" && typeof value.propertyIsEnumerable != "undefined" && !value.propertyIsEnumerable("splice")) {
        return"array"
      }
      if(className == "[object Function]" || typeof value.call != "undefined" && typeof value.propertyIsEnumerable != "undefined" && !value.propertyIsEnumerable("call")) {
        return"function"
      }
    }else {
      return"null"
    }
  }else {
    if(s == "function" && typeof value.call == "undefined") {
      return"object"
    }
  }
  return s
};
goog.propertyIsEnumerableCustom_ = function(object, propName) {
  if(propName in object) {
    for(var key in object) {
      if(key == propName && Object.prototype.hasOwnProperty.call(object, propName)) {
        return true
      }
    }
  }
  return false
};
goog.propertyIsEnumerable_ = function(object, propName) {
  if(object instanceof Object) {
    return Object.prototype.propertyIsEnumerable.call(object, propName)
  }else {
    return goog.propertyIsEnumerableCustom_(object, propName)
  }
};
goog.isDef = function(val) {
  return val !== undefined
};
goog.isNull = function(val) {
  return val === null
};
goog.isDefAndNotNull = function(val) {
  return val != null
};
goog.isArray = function(val) {
  return goog.typeOf(val) == "array"
};
goog.isArrayLike = function(val) {
  var type = goog.typeOf(val);
  return type == "array" || type == "object" && typeof val.length == "number"
};
goog.isDateLike = function(val) {
  return goog.isObject(val) && typeof val.getFullYear == "function"
};
goog.isString = function(val) {
  return typeof val == "string"
};
goog.isBoolean = function(val) {
  return typeof val == "boolean"
};
goog.isNumber = function(val) {
  return typeof val == "number"
};
goog.isFunction = function(val) {
  return goog.typeOf(val) == "function"
};
goog.isObject = function(val) {
  var type = goog.typeOf(val);
  return type == "object" || type == "array" || type == "function"
};
goog.getUid = function(obj) {
  return obj[goog.UID_PROPERTY_] || (obj[goog.UID_PROPERTY_] = ++goog.uidCounter_)
};
goog.removeUid = function(obj) {
  if("removeAttribute" in obj) {
    obj.removeAttribute(goog.UID_PROPERTY_)
  }
  try {
    delete obj[goog.UID_PROPERTY_]
  }catch(ex) {
  }
};
goog.UID_PROPERTY_ = "closure_uid_" + Math.floor(Math.random() * 2147483648).toString(36);
goog.uidCounter_ = 0;
goog.getHashCode = goog.getUid;
goog.removeHashCode = goog.removeUid;
goog.cloneObject = function(obj) {
  var type = goog.typeOf(obj);
  if(type == "object" || type == "array") {
    if(obj.clone) {
      return obj.clone()
    }
    var clone = type == "array" ? [] : {};
    for(var key in obj) {
      clone[key] = goog.cloneObject(obj[key])
    }
    return clone
  }
  return obj
};
Object.prototype.clone;
goog.bindNative_ = function(fn, selfObj, var_args) {
  return fn.call.apply(fn.bind, arguments)
};
goog.bindJs_ = function(fn, selfObj, var_args) {
  if(!fn) {
    throw new Error;
  }
  if(arguments.length > 2) {
    var boundArgs = Array.prototype.slice.call(arguments, 2);
    return function() {
      var newArgs = Array.prototype.slice.call(arguments);
      Array.prototype.unshift.apply(newArgs, boundArgs);
      return fn.apply(selfObj, newArgs)
    }
  }else {
    return function() {
      return fn.apply(selfObj, arguments)
    }
  }
};
goog.bind = function(fn, selfObj, var_args) {
  if(Function.prototype.bind && Function.prototype.bind.toString().indexOf("native code") != -1) {
    goog.bind = goog.bindNative_
  }else {
    goog.bind = goog.bindJs_
  }
  return goog.bind.apply(null, arguments)
};
goog.partial = function(fn, var_args) {
  var args = Array.prototype.slice.call(arguments, 1);
  return function() {
    var newArgs = Array.prototype.slice.call(arguments);
    newArgs.unshift.apply(newArgs, args);
    return fn.apply(this, newArgs)
  }
};
goog.mixin = function(target, source) {
  for(var x in source) {
    target[x] = source[x]
  }
};
goog.now = Date.now || function() {
  return+new Date
};
goog.globalEval = function(script) {
  if(goog.global.execScript) {
    goog.global.execScript(script, "JavaScript")
  }else {
    if(goog.global.eval) {
      if(goog.evalWorksForGlobals_ == null) {
        goog.global.eval("var _et_ = 1;");
        if(typeof goog.global["_et_"] != "undefined") {
          delete goog.global["_et_"];
          goog.evalWorksForGlobals_ = true
        }else {
          goog.evalWorksForGlobals_ = false
        }
      }
      if(goog.evalWorksForGlobals_) {
        goog.global.eval(script)
      }else {
        var doc = goog.global.document;
        var scriptElt = doc.createElement("script");
        scriptElt.type = "text/javascript";
        scriptElt.defer = false;
        scriptElt.appendChild(doc.createTextNode(script));
        doc.body.appendChild(scriptElt);
        doc.body.removeChild(scriptElt)
      }
    }else {
      throw Error("goog.globalEval not available");
    }
  }
};
goog.evalWorksForGlobals_ = null;
goog.cssNameMapping_;
goog.cssNameMappingStyle_;
goog.getCssName = function(className, opt_modifier) {
  var getMapping = function(cssName) {
    return goog.cssNameMapping_[cssName] || cssName
  };
  var renameByParts = function(cssName) {
    var parts = cssName.split("-");
    var mapped = [];
    for(var i = 0;i < parts.length;i++) {
      mapped.push(getMapping(parts[i]))
    }
    return mapped.join("-")
  };
  var rename;
  if(goog.cssNameMapping_) {
    rename = goog.cssNameMappingStyle_ == "BY_WHOLE" ? getMapping : renameByParts
  }else {
    rename = function(a) {
      return a
    }
  }
  if(opt_modifier) {
    return className + "-" + rename(opt_modifier)
  }else {
    return rename(className)
  }
};
goog.setCssNameMapping = function(mapping, opt_style) {
  goog.cssNameMapping_ = mapping;
  goog.cssNameMappingStyle_ = opt_style
};
goog.global.CLOSURE_CSS_NAME_MAPPING;
if(!COMPILED && goog.global.CLOSURE_CSS_NAME_MAPPING) {
  goog.cssNameMapping_ = goog.global.CLOSURE_CSS_NAME_MAPPING
}
goog.getMsg = function(str, opt_values) {
  var values = opt_values || {};
  for(var key in values) {
    var value = ("" + values[key]).replace(/\$/g, "$$$$");
    str = str.replace(new RegExp("\\{\\$" + key + "\\}", "gi"), value)
  }
  return str
};
goog.exportSymbol = function(publicPath, object, opt_objectToExportTo) {
  goog.exportPath_(publicPath, object, opt_objectToExportTo)
};
goog.exportProperty = function(object, publicName, symbol) {
  object[publicName] = symbol
};
goog.inherits = function(childCtor, parentCtor) {
  function tempCtor() {
  }
  tempCtor.prototype = parentCtor.prototype;
  childCtor.superClass_ = parentCtor.prototype;
  childCtor.prototype = new tempCtor;
  childCtor.prototype.constructor = childCtor
};
goog.base = function(me, opt_methodName, var_args) {
  var caller = arguments.callee.caller;
  if(caller.superClass_) {
    return caller.superClass_.constructor.apply(me, Array.prototype.slice.call(arguments, 1))
  }
  var args = Array.prototype.slice.call(arguments, 2);
  var foundCaller = false;
  for(var ctor = me.constructor;ctor;ctor = ctor.superClass_ && ctor.superClass_.constructor) {
    if(ctor.prototype[opt_methodName] === caller) {
      foundCaller = true
    }else {
      if(foundCaller) {
        return ctor.prototype[opt_methodName].apply(me, args)
      }
    }
  }
  if(me[opt_methodName] === caller) {
    return me.constructor.prototype[opt_methodName].apply(me, args)
  }else {
    throw Error("goog.base called from a method of one name " + "to a method of a different name");
  }
};
goog.scope = function(fn) {
  fn.call(goog.global)
};
goog.provide("goog.debug.Error");
goog.debug.Error = function(opt_msg) {
  this.stack = (new Error).stack || "";
  if(opt_msg) {
    this.message = String(opt_msg)
  }
};
goog.inherits(goog.debug.Error, Error);
goog.debug.Error.prototype.name = "CustomError";
goog.provide("goog.string");
goog.provide("goog.string.Unicode");
goog.string.Unicode = {NBSP:"\u00a0"};
goog.string.startsWith = function(str, prefix) {
  return str.lastIndexOf(prefix, 0) == 0
};
goog.string.endsWith = function(str, suffix) {
  var l = str.length - suffix.length;
  return l >= 0 && str.indexOf(suffix, l) == l
};
goog.string.caseInsensitiveStartsWith = function(str, prefix) {
  return goog.string.caseInsensitiveCompare(prefix, str.substr(0, prefix.length)) == 0
};
goog.string.caseInsensitiveEndsWith = function(str, suffix) {
  return goog.string.caseInsensitiveCompare(suffix, str.substr(str.length - suffix.length, suffix.length)) == 0
};
goog.string.subs = function(str, var_args) {
  for(var i = 1;i < arguments.length;i++) {
    var replacement = String(arguments[i]).replace(/\$/g, "$$$$");
    str = str.replace(/\%s/, replacement)
  }
  return str
};
goog.string.collapseWhitespace = function(str) {
  return str.replace(/[\s\xa0]+/g, " ").replace(/^\s+|\s+$/g, "")
};
goog.string.isEmpty = function(str) {
  return/^[\s\xa0]*$/.test(str)
};
goog.string.isEmptySafe = function(str) {
  return goog.string.isEmpty(goog.string.makeSafe(str))
};
goog.string.isBreakingWhitespace = function(str) {
  return!/[^\t\n\r ]/.test(str)
};
goog.string.isAlpha = function(str) {
  return!/[^a-zA-Z]/.test(str)
};
goog.string.isNumeric = function(str) {
  return!/[^0-9]/.test(str)
};
goog.string.isAlphaNumeric = function(str) {
  return!/[^a-zA-Z0-9]/.test(str)
};
goog.string.isSpace = function(ch) {
  return ch == " "
};
goog.string.isUnicodeChar = function(ch) {
  return ch.length == 1 && ch >= " " && ch <= "~" || ch >= "\u0080" && ch <= "\ufffd"
};
goog.string.stripNewlines = function(str) {
  return str.replace(/(\r\n|\r|\n)+/g, " ")
};
goog.string.canonicalizeNewlines = function(str) {
  return str.replace(/(\r\n|\r|\n)/g, "\n")
};
goog.string.normalizeWhitespace = function(str) {
  return str.replace(/\xa0|\s/g, " ")
};
goog.string.normalizeSpaces = function(str) {
  return str.replace(/\xa0|[ \t]+/g, " ")
};
goog.string.collapseBreakingSpaces = function(str) {
  return str.replace(/[\t\r\n ]+/g, " ").replace(/^[\t\r\n ]+|[\t\r\n ]+$/g, "")
};
goog.string.trim = function(str) {
  return str.replace(/^[\s\xa0]+|[\s\xa0]+$/g, "")
};
goog.string.trimLeft = function(str) {
  return str.replace(/^[\s\xa0]+/, "")
};
goog.string.trimRight = function(str) {
  return str.replace(/[\s\xa0]+$/, "")
};
goog.string.caseInsensitiveCompare = function(str1, str2) {
  var test1 = String(str1).toLowerCase();
  var test2 = String(str2).toLowerCase();
  if(test1 < test2) {
    return-1
  }else {
    if(test1 == test2) {
      return 0
    }else {
      return 1
    }
  }
};
goog.string.numerateCompareRegExp_ = /(\.\d+)|(\d+)|(\D+)/g;
goog.string.numerateCompare = function(str1, str2) {
  if(str1 == str2) {
    return 0
  }
  if(!str1) {
    return-1
  }
  if(!str2) {
    return 1
  }
  var tokens1 = str1.toLowerCase().match(goog.string.numerateCompareRegExp_);
  var tokens2 = str2.toLowerCase().match(goog.string.numerateCompareRegExp_);
  var count = Math.min(tokens1.length, tokens2.length);
  for(var i = 0;i < count;i++) {
    var a = tokens1[i];
    var b = tokens2[i];
    if(a != b) {
      var num1 = parseInt(a, 10);
      if(!isNaN(num1)) {
        var num2 = parseInt(b, 10);
        if(!isNaN(num2) && num1 - num2) {
          return num1 - num2
        }
      }
      return a < b ? -1 : 1
    }
  }
  if(tokens1.length != tokens2.length) {
    return tokens1.length - tokens2.length
  }
  return str1 < str2 ? -1 : 1
};
goog.string.encodeUriRegExp_ = /^[a-zA-Z0-9\-_.!~*'()]*$/;
goog.string.urlEncode = function(str) {
  str = String(str);
  if(!goog.string.encodeUriRegExp_.test(str)) {
    return encodeURIComponent(str)
  }
  return str
};
goog.string.urlDecode = function(str) {
  return decodeURIComponent(str.replace(/\+/g, " "))
};
goog.string.newLineToBr = function(str, opt_xml) {
  return str.replace(/(\r\n|\r|\n)/g, opt_xml ? "<br />" : "<br>")
};
goog.string.htmlEscape = function(str, opt_isLikelyToContainHtmlChars) {
  if(opt_isLikelyToContainHtmlChars) {
    return str.replace(goog.string.amperRe_, "&amp;").replace(goog.string.ltRe_, "&lt;").replace(goog.string.gtRe_, "&gt;").replace(goog.string.quotRe_, "&quot;")
  }else {
    if(!goog.string.allRe_.test(str)) {
      return str
    }
    if(str.indexOf("&") != -1) {
      str = str.replace(goog.string.amperRe_, "&amp;")
    }
    if(str.indexOf("<") != -1) {
      str = str.replace(goog.string.ltRe_, "&lt;")
    }
    if(str.indexOf(">") != -1) {
      str = str.replace(goog.string.gtRe_, "&gt;")
    }
    if(str.indexOf('"') != -1) {
      str = str.replace(goog.string.quotRe_, "&quot;")
    }
    return str
  }
};
goog.string.amperRe_ = /&/g;
goog.string.ltRe_ = /</g;
goog.string.gtRe_ = />/g;
goog.string.quotRe_ = /\"/g;
goog.string.allRe_ = /[&<>\"]/;
goog.string.unescapeEntities = function(str) {
  if(goog.string.contains(str, "&")) {
    if("document" in goog.global) {
      return goog.string.unescapeEntitiesUsingDom_(str)
    }else {
      return goog.string.unescapePureXmlEntities_(str)
    }
  }
  return str
};
goog.string.unescapeEntitiesUsingDom_ = function(str) {
  var seen = {"&amp;":"&", "&lt;":"<", "&gt;":">", "&quot;":'"'};
  var div = document.createElement("div");
  return str.replace(goog.string.HTML_ENTITY_PATTERN_, function(s, entity) {
    var value = seen[s];
    if(value) {
      return value
    }
    if(entity.charAt(0) == "#") {
      var n = Number("0" + entity.substr(1));
      if(!isNaN(n)) {
        value = String.fromCharCode(n)
      }
    }
    if(!value) {
      div.innerHTML = s + " ";
      value = div.firstChild.nodeValue.slice(0, -1)
    }
    return seen[s] = value
  })
};
goog.string.unescapePureXmlEntities_ = function(str) {
  return str.replace(/&([^;]+);/g, function(s, entity) {
    switch(entity) {
      case "amp":
        return"&";
      case "lt":
        return"<";
      case "gt":
        return">";
      case "quot":
        return'"';
      default:
        if(entity.charAt(0) == "#") {
          var n = Number("0" + entity.substr(1));
          if(!isNaN(n)) {
            return String.fromCharCode(n)
          }
        }
        return s
    }
  })
};
goog.string.HTML_ENTITY_PATTERN_ = /&([^;\s<&]+);?/g;
goog.string.whitespaceEscape = function(str, opt_xml) {
  return goog.string.newLineToBr(str.replace(/  /g, " &#160;"), opt_xml)
};
goog.string.stripQuotes = function(str, quoteChars) {
  var length = quoteChars.length;
  for(var i = 0;i < length;i++) {
    var quoteChar = length == 1 ? quoteChars : quoteChars.charAt(i);
    if(str.charAt(0) == quoteChar && str.charAt(str.length - 1) == quoteChar) {
      return str.substring(1, str.length - 1)
    }
  }
  return str
};
goog.string.truncate = function(str, chars, opt_protectEscapedCharacters) {
  if(opt_protectEscapedCharacters) {
    str = goog.string.unescapeEntities(str)
  }
  if(str.length > chars) {
    str = str.substring(0, chars - 3) + "..."
  }
  if(opt_protectEscapedCharacters) {
    str = goog.string.htmlEscape(str)
  }
  return str
};
goog.string.truncateMiddle = function(str, chars, opt_protectEscapedCharacters, opt_trailingChars) {
  if(opt_protectEscapedCharacters) {
    str = goog.string.unescapeEntities(str)
  }
  if(opt_trailingChars && str.length > chars) {
    if(opt_trailingChars > chars) {
      opt_trailingChars = chars
    }
    var endPoint = str.length - opt_trailingChars;
    var startPoint = chars - opt_trailingChars;
    str = str.substring(0, startPoint) + "..." + str.substring(endPoint)
  }else {
    if(str.length > chars) {
      var half = Math.floor(chars / 2);
      var endPos = str.length - half;
      half += chars % 2;
      str = str.substring(0, half) + "..." + str.substring(endPos)
    }
  }
  if(opt_protectEscapedCharacters) {
    str = goog.string.htmlEscape(str)
  }
  return str
};
goog.string.specialEscapeChars_ = {"\x00":"\\0", "\u0008":"\\b", "\u000c":"\\f", "\n":"\\n", "\r":"\\r", "\t":"\\t", "\x0B":"\\x0B", '"':'\\"', "\\":"\\\\"};
goog.string.jsEscapeCache_ = {"'":"\\'"};
goog.string.quote = function(s) {
  s = String(s);
  if(s.quote) {
    return s.quote()
  }else {
    var sb = ['"'];
    for(var i = 0;i < s.length;i++) {
      var ch = s.charAt(i);
      var cc = ch.charCodeAt(0);
      sb[i + 1] = goog.string.specialEscapeChars_[ch] || (cc > 31 && cc < 127 ? ch : goog.string.escapeChar(ch))
    }
    sb.push('"');
    return sb.join("")
  }
};
goog.string.escapeString = function(str) {
  var sb = [];
  for(var i = 0;i < str.length;i++) {
    sb[i] = goog.string.escapeChar(str.charAt(i))
  }
  return sb.join("")
};
goog.string.escapeChar = function(c) {
  if(c in goog.string.jsEscapeCache_) {
    return goog.string.jsEscapeCache_[c]
  }
  if(c in goog.string.specialEscapeChars_) {
    return goog.string.jsEscapeCache_[c] = goog.string.specialEscapeChars_[c]
  }
  var rv = c;
  var cc = c.charCodeAt(0);
  if(cc > 31 && cc < 127) {
    rv = c
  }else {
    if(cc < 256) {
      rv = "\\x";
      if(cc < 16 || cc > 256) {
        rv += "0"
      }
    }else {
      rv = "\\u";
      if(cc < 4096) {
        rv += "0"
      }
    }
    rv += cc.toString(16).toUpperCase()
  }
  return goog.string.jsEscapeCache_[c] = rv
};
goog.string.toMap = function(s) {
  var rv = {};
  for(var i = 0;i < s.length;i++) {
    rv[s.charAt(i)] = true
  }
  return rv
};
goog.string.contains = function(s, ss) {
  return s.indexOf(ss) != -1
};
goog.string.removeAt = function(s, index, stringLength) {
  var resultStr = s;
  if(index >= 0 && index < s.length && stringLength > 0) {
    resultStr = s.substr(0, index) + s.substr(index + stringLength, s.length - index - stringLength)
  }
  return resultStr
};
goog.string.remove = function(s, ss) {
  var re = new RegExp(goog.string.regExpEscape(ss), "");
  return s.replace(re, "")
};
goog.string.removeAll = function(s, ss) {
  var re = new RegExp(goog.string.regExpEscape(ss), "g");
  return s.replace(re, "")
};
goog.string.regExpEscape = function(s) {
  return String(s).replace(/([-()\[\]{}+?*.$\^|,:#<!\\])/g, "\\$1").replace(/\x08/g, "\\x08")
};
goog.string.repeat = function(string, length) {
  return(new Array(length + 1)).join(string)
};
goog.string.padNumber = function(num, length, opt_precision) {
  var s = goog.isDef(opt_precision) ? num.toFixed(opt_precision) : String(num);
  var index = s.indexOf(".");
  if(index == -1) {
    index = s.length
  }
  return goog.string.repeat("0", Math.max(0, length - index)) + s
};
goog.string.makeSafe = function(obj) {
  return obj == null ? "" : String(obj)
};
goog.string.buildString = function(var_args) {
  return Array.prototype.join.call(arguments, "")
};
goog.string.getRandomString = function() {
  var x = 2147483648;
  return Math.floor(Math.random() * x).toString(36) + Math.abs(Math.floor(Math.random() * x) ^ goog.now()).toString(36)
};
goog.string.compareVersions = function(version1, version2) {
  var order = 0;
  var v1Subs = goog.string.trim(String(version1)).split(".");
  var v2Subs = goog.string.trim(String(version2)).split(".");
  var subCount = Math.max(v1Subs.length, v2Subs.length);
  for(var subIdx = 0;order == 0 && subIdx < subCount;subIdx++) {
    var v1Sub = v1Subs[subIdx] || "";
    var v2Sub = v2Subs[subIdx] || "";
    var v1CompParser = new RegExp("(\\d*)(\\D*)", "g");
    var v2CompParser = new RegExp("(\\d*)(\\D*)", "g");
    do {
      var v1Comp = v1CompParser.exec(v1Sub) || ["", "", ""];
      var v2Comp = v2CompParser.exec(v2Sub) || ["", "", ""];
      if(v1Comp[0].length == 0 && v2Comp[0].length == 0) {
        break
      }
      var v1CompNum = v1Comp[1].length == 0 ? 0 : parseInt(v1Comp[1], 10);
      var v2CompNum = v2Comp[1].length == 0 ? 0 : parseInt(v2Comp[1], 10);
      order = goog.string.compareElements_(v1CompNum, v2CompNum) || goog.string.compareElements_(v1Comp[2].length == 0, v2Comp[2].length == 0) || goog.string.compareElements_(v1Comp[2], v2Comp[2])
    }while(order == 0)
  }
  return order
};
goog.string.compareElements_ = function(left, right) {
  if(left < right) {
    return-1
  }else {
    if(left > right) {
      return 1
    }
  }
  return 0
};
goog.string.HASHCODE_MAX_ = 4294967296;
goog.string.hashCode = function(str) {
  var result = 0;
  for(var i = 0;i < str.length;++i) {
    result = 31 * result + str.charCodeAt(i);
    result %= goog.string.HASHCODE_MAX_
  }
  return result
};
goog.string.uniqueStringCounter_ = Math.random() * 2147483648 | 0;
goog.string.createUniqueString = function() {
  return"goog_" + goog.string.uniqueStringCounter_++
};
goog.string.toNumber = function(str) {
  var num = Number(str);
  if(num == 0 && goog.string.isEmpty(str)) {
    return NaN
  }
  return num
};
goog.string.toCamelCaseCache_ = {};
goog.string.toCamelCase = function(str) {
  return goog.string.toCamelCaseCache_[str] || (goog.string.toCamelCaseCache_[str] = String(str).replace(/\-([a-z])/g, function(all, match) {
    return match.toUpperCase()
  }))
};
goog.string.toSelectorCaseCache_ = {};
goog.string.toSelectorCase = function(str) {
  return goog.string.toSelectorCaseCache_[str] || (goog.string.toSelectorCaseCache_[str] = String(str).replace(/([A-Z])/g, "-$1").toLowerCase())
};
goog.provide("goog.asserts");
goog.provide("goog.asserts.AssertionError");
goog.require("goog.debug.Error");
goog.require("goog.string");
goog.asserts.ENABLE_ASSERTS = goog.DEBUG;
goog.asserts.AssertionError = function(messagePattern, messageArgs) {
  messageArgs.unshift(messagePattern);
  goog.debug.Error.call(this, goog.string.subs.apply(null, messageArgs));
  messageArgs.shift();
  this.messagePattern = messagePattern
};
goog.inherits(goog.asserts.AssertionError, goog.debug.Error);
goog.asserts.AssertionError.prototype.name = "AssertionError";
goog.asserts.doAssertFailure_ = function(defaultMessage, defaultArgs, givenMessage, givenArgs) {
  var message = "Assertion failed";
  if(givenMessage) {
    message += ": " + givenMessage;
    var args = givenArgs
  }else {
    if(defaultMessage) {
      message += ": " + defaultMessage;
      args = defaultArgs
    }
  }
  throw new goog.asserts.AssertionError("" + message, args || []);
};
goog.asserts.assert = function(condition, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !condition) {
    goog.asserts.doAssertFailure_("", null, opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return condition
};
goog.asserts.fail = function(opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS) {
    throw new goog.asserts.AssertionError("Failure" + (opt_message ? ": " + opt_message : ""), Array.prototype.slice.call(arguments, 1));
  }
};
goog.asserts.assertNumber = function(value, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !goog.isNumber(value)) {
    goog.asserts.doAssertFailure_("Expected number but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return value
};
goog.asserts.assertString = function(value, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !goog.isString(value)) {
    goog.asserts.doAssertFailure_("Expected string but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return value
};
goog.asserts.assertFunction = function(value, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !goog.isFunction(value)) {
    goog.asserts.doAssertFailure_("Expected function but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return value
};
goog.asserts.assertObject = function(value, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !goog.isObject(value)) {
    goog.asserts.doAssertFailure_("Expected object but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return value
};
goog.asserts.assertArray = function(value, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !goog.isArray(value)) {
    goog.asserts.doAssertFailure_("Expected array but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return value
};
goog.asserts.assertBoolean = function(value, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !goog.isBoolean(value)) {
    goog.asserts.doAssertFailure_("Expected boolean but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return value
};
goog.asserts.assertInstanceof = function(value, type, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !(value instanceof type)) {
    goog.asserts.doAssertFailure_("instanceof check failed.", null, opt_message, Array.prototype.slice.call(arguments, 3))
  }
};
goog.provide("goog.array");
goog.provide("goog.array.ArrayLike");
goog.require("goog.asserts");
goog.NATIVE_ARRAY_PROTOTYPES = true;
goog.array.ArrayLike;
goog.array.peek = function(array) {
  return array[array.length - 1]
};
goog.array.ARRAY_PROTOTYPE_ = Array.prototype;
goog.array.indexOf = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.indexOf ? function(arr, obj, opt_fromIndex) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.indexOf.call(arr, obj, opt_fromIndex)
} : function(arr, obj, opt_fromIndex) {
  var fromIndex = opt_fromIndex == null ? 0 : opt_fromIndex < 0 ? Math.max(0, arr.length + opt_fromIndex) : opt_fromIndex;
  if(goog.isString(arr)) {
    if(!goog.isString(obj) || obj.length != 1) {
      return-1
    }
    return arr.indexOf(obj, fromIndex)
  }
  for(var i = fromIndex;i < arr.length;i++) {
    if(i in arr && arr[i] === obj) {
      return i
    }
  }
  return-1
};
goog.array.lastIndexOf = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.lastIndexOf ? function(arr, obj, opt_fromIndex) {
  goog.asserts.assert(arr.length != null);
  var fromIndex = opt_fromIndex == null ? arr.length - 1 : opt_fromIndex;
  return goog.array.ARRAY_PROTOTYPE_.lastIndexOf.call(arr, obj, fromIndex)
} : function(arr, obj, opt_fromIndex) {
  var fromIndex = opt_fromIndex == null ? arr.length - 1 : opt_fromIndex;
  if(fromIndex < 0) {
    fromIndex = Math.max(0, arr.length + fromIndex)
  }
  if(goog.isString(arr)) {
    if(!goog.isString(obj) || obj.length != 1) {
      return-1
    }
    return arr.lastIndexOf(obj, fromIndex)
  }
  for(var i = fromIndex;i >= 0;i--) {
    if(i in arr && arr[i] === obj) {
      return i
    }
  }
  return-1
};
goog.array.forEach = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.forEach ? function(arr, f, opt_obj) {
  goog.asserts.assert(arr.length != null);
  goog.array.ARRAY_PROTOTYPE_.forEach.call(arr, f, opt_obj)
} : function(arr, f, opt_obj) {
  var l = arr.length;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = 0;i < l;i++) {
    if(i in arr2) {
      f.call(opt_obj, arr2[i], i, arr)
    }
  }
};
goog.array.forEachRight = function(arr, f, opt_obj) {
  var l = arr.length;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = l - 1;i >= 0;--i) {
    if(i in arr2) {
      f.call(opt_obj, arr2[i], i, arr)
    }
  }
};
goog.array.filter = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.filter ? function(arr, f, opt_obj) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.filter.call(arr, f, opt_obj)
} : function(arr, f, opt_obj) {
  var l = arr.length;
  var res = [];
  var resLength = 0;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = 0;i < l;i++) {
    if(i in arr2) {
      var val = arr2[i];
      if(f.call(opt_obj, val, i, arr)) {
        res[resLength++] = val
      }
    }
  }
  return res
};
goog.array.map = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.map ? function(arr, f, opt_obj) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.map.call(arr, f, opt_obj)
} : function(arr, f, opt_obj) {
  var l = arr.length;
  var res = new Array(l);
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = 0;i < l;i++) {
    if(i in arr2) {
      res[i] = f.call(opt_obj, arr2[i], i, arr)
    }
  }
  return res
};
goog.array.reduce = function(arr, f, val, opt_obj) {
  if(arr.reduce) {
    if(opt_obj) {
      return arr.reduce(goog.bind(f, opt_obj), val)
    }else {
      return arr.reduce(f, val)
    }
  }
  var rval = val;
  goog.array.forEach(arr, function(val, index) {
    rval = f.call(opt_obj, rval, val, index, arr)
  });
  return rval
};
goog.array.reduceRight = function(arr, f, val, opt_obj) {
  if(arr.reduceRight) {
    if(opt_obj) {
      return arr.reduceRight(goog.bind(f, opt_obj), val)
    }else {
      return arr.reduceRight(f, val)
    }
  }
  var rval = val;
  goog.array.forEachRight(arr, function(val, index) {
    rval = f.call(opt_obj, rval, val, index, arr)
  });
  return rval
};
goog.array.some = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.some ? function(arr, f, opt_obj) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.some.call(arr, f, opt_obj)
} : function(arr, f, opt_obj) {
  var l = arr.length;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = 0;i < l;i++) {
    if(i in arr2 && f.call(opt_obj, arr2[i], i, arr)) {
      return true
    }
  }
  return false
};
goog.array.every = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.every ? function(arr, f, opt_obj) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.every.call(arr, f, opt_obj)
} : function(arr, f, opt_obj) {
  var l = arr.length;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = 0;i < l;i++) {
    if(i in arr2 && !f.call(opt_obj, arr2[i], i, arr)) {
      return false
    }
  }
  return true
};
goog.array.find = function(arr, f, opt_obj) {
  var i = goog.array.findIndex(arr, f, opt_obj);
  return i < 0 ? null : goog.isString(arr) ? arr.charAt(i) : arr[i]
};
goog.array.findIndex = function(arr, f, opt_obj) {
  var l = arr.length;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = 0;i < l;i++) {
    if(i in arr2 && f.call(opt_obj, arr2[i], i, arr)) {
      return i
    }
  }
  return-1
};
goog.array.findRight = function(arr, f, opt_obj) {
  var i = goog.array.findIndexRight(arr, f, opt_obj);
  return i < 0 ? null : goog.isString(arr) ? arr.charAt(i) : arr[i]
};
goog.array.findIndexRight = function(arr, f, opt_obj) {
  var l = arr.length;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = l - 1;i >= 0;i--) {
    if(i in arr2 && f.call(opt_obj, arr2[i], i, arr)) {
      return i
    }
  }
  return-1
};
goog.array.contains = function(arr, obj) {
  return goog.array.indexOf(arr, obj) >= 0
};
goog.array.isEmpty = function(arr) {
  return arr.length == 0
};
goog.array.clear = function(arr) {
  if(!goog.isArray(arr)) {
    for(var i = arr.length - 1;i >= 0;i--) {
      delete arr[i]
    }
  }
  arr.length = 0
};
goog.array.insert = function(arr, obj) {
  if(!goog.array.contains(arr, obj)) {
    arr.push(obj)
  }
};
goog.array.insertAt = function(arr, obj, opt_i) {
  goog.array.splice(arr, opt_i, 0, obj)
};
goog.array.insertArrayAt = function(arr, elementsToAdd, opt_i) {
  goog.partial(goog.array.splice, arr, opt_i, 0).apply(null, elementsToAdd)
};
goog.array.insertBefore = function(arr, obj, opt_obj2) {
  var i;
  if(arguments.length == 2 || (i = goog.array.indexOf(arr, opt_obj2)) < 0) {
    arr.push(obj)
  }else {
    goog.array.insertAt(arr, obj, i)
  }
};
goog.array.remove = function(arr, obj) {
  var i = goog.array.indexOf(arr, obj);
  var rv;
  if(rv = i >= 0) {
    goog.array.removeAt(arr, i)
  }
  return rv
};
goog.array.removeAt = function(arr, i) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.splice.call(arr, i, 1).length == 1
};
goog.array.removeIf = function(arr, f, opt_obj) {
  var i = goog.array.findIndex(arr, f, opt_obj);
  if(i >= 0) {
    goog.array.removeAt(arr, i);
    return true
  }
  return false
};
goog.array.concat = function(var_args) {
  return goog.array.ARRAY_PROTOTYPE_.concat.apply(goog.array.ARRAY_PROTOTYPE_, arguments)
};
goog.array.clone = function(arr) {
  if(goog.isArray(arr)) {
    return goog.array.concat(arr)
  }else {
    var rv = [];
    for(var i = 0, len = arr.length;i < len;i++) {
      rv[i] = arr[i]
    }
    return rv
  }
};
goog.array.toArray = function(object) {
  if(goog.isArray(object)) {
    return goog.array.concat(object)
  }
  return goog.array.clone(object)
};
goog.array.extend = function(arr1, var_args) {
  for(var i = 1;i < arguments.length;i++) {
    var arr2 = arguments[i];
    var isArrayLike;
    if(goog.isArray(arr2) || (isArrayLike = goog.isArrayLike(arr2)) && arr2.hasOwnProperty("callee")) {
      arr1.push.apply(arr1, arr2)
    }else {
      if(isArrayLike) {
        var len1 = arr1.length;
        var len2 = arr2.length;
        for(var j = 0;j < len2;j++) {
          arr1[len1 + j] = arr2[j]
        }
      }else {
        arr1.push(arr2)
      }
    }
  }
};
goog.array.splice = function(arr, index, howMany, var_args) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.splice.apply(arr, goog.array.slice(arguments, 1))
};
goog.array.slice = function(arr, start, opt_end) {
  goog.asserts.assert(arr.length != null);
  if(arguments.length <= 2) {
    return goog.array.ARRAY_PROTOTYPE_.slice.call(arr, start)
  }else {
    return goog.array.ARRAY_PROTOTYPE_.slice.call(arr, start, opt_end)
  }
};
goog.array.removeDuplicates = function(arr, opt_rv) {
  var returnArray = opt_rv || arr;
  var seen = {}, cursorInsert = 0, cursorRead = 0;
  while(cursorRead < arr.length) {
    var current = arr[cursorRead++];
    var key = goog.isObject(current) ? "o" + goog.getUid(current) : (typeof current).charAt(0) + current;
    if(!Object.prototype.hasOwnProperty.call(seen, key)) {
      seen[key] = true;
      returnArray[cursorInsert++] = current
    }
  }
  returnArray.length = cursorInsert
};
goog.array.binarySearch = function(arr, target, opt_compareFn) {
  return goog.array.binarySearch_(arr, opt_compareFn || goog.array.defaultCompare, false, target)
};
goog.array.binarySelect = function(arr, evaluator, opt_obj) {
  return goog.array.binarySearch_(arr, evaluator, true, undefined, opt_obj)
};
goog.array.binarySearch_ = function(arr, compareFn, isEvaluator, opt_target, opt_selfObj) {
  var left = 0;
  var right = arr.length;
  var found;
  while(left < right) {
    var middle = left + right >> 1;
    var compareResult;
    if(isEvaluator) {
      compareResult = compareFn.call(opt_selfObj, arr[middle], middle, arr)
    }else {
      compareResult = compareFn(opt_target, arr[middle])
    }
    if(compareResult > 0) {
      left = middle + 1
    }else {
      right = middle;
      found = !compareResult
    }
  }
  return found ? left : ~left
};
goog.array.sort = function(arr, opt_compareFn) {
  goog.asserts.assert(arr.length != null);
  goog.array.ARRAY_PROTOTYPE_.sort.call(arr, opt_compareFn || goog.array.defaultCompare)
};
goog.array.stableSort = function(arr, opt_compareFn) {
  for(var i = 0;i < arr.length;i++) {
    arr[i] = {index:i, value:arr[i]}
  }
  var valueCompareFn = opt_compareFn || goog.array.defaultCompare;
  function stableCompareFn(obj1, obj2) {
    return valueCompareFn(obj1.value, obj2.value) || obj1.index - obj2.index
  }
  goog.array.sort(arr, stableCompareFn);
  for(var i = 0;i < arr.length;i++) {
    arr[i] = arr[i].value
  }
};
goog.array.sortObjectsByKey = function(arr, key, opt_compareFn) {
  var compare = opt_compareFn || goog.array.defaultCompare;
  goog.array.sort(arr, function(a, b) {
    return compare(a[key], b[key])
  })
};
goog.array.isSorted = function(arr, opt_compareFn, opt_strict) {
  var compare = opt_compareFn || goog.array.defaultCompare;
  for(var i = 1;i < arr.length;i++) {
    var compareResult = compare(arr[i - 1], arr[i]);
    if(compareResult > 0 || compareResult == 0 && opt_strict) {
      return false
    }
  }
  return true
};
goog.array.equals = function(arr1, arr2, opt_equalsFn) {
  if(!goog.isArrayLike(arr1) || !goog.isArrayLike(arr2) || arr1.length != arr2.length) {
    return false
  }
  var l = arr1.length;
  var equalsFn = opt_equalsFn || goog.array.defaultCompareEquality;
  for(var i = 0;i < l;i++) {
    if(!equalsFn(arr1[i], arr2[i])) {
      return false
    }
  }
  return true
};
goog.array.compare = function(arr1, arr2, opt_equalsFn) {
  return goog.array.equals(arr1, arr2, opt_equalsFn)
};
goog.array.compare3 = function(arr1, arr2, opt_compareFn) {
  var compare = opt_compareFn || goog.array.defaultCompare;
  var l = Math.min(arr1.length, arr2.length);
  for(var i = 0;i < l;i++) {
    var result = compare(arr1[i], arr2[i]);
    if(result != 0) {
      return result
    }
  }
  return goog.array.defaultCompare(arr1.length, arr2.length)
};
goog.array.defaultCompare = function(a, b) {
  return a > b ? 1 : a < b ? -1 : 0
};
goog.array.defaultCompareEquality = function(a, b) {
  return a === b
};
goog.array.binaryInsert = function(array, value, opt_compareFn) {
  var index = goog.array.binarySearch(array, value, opt_compareFn);
  if(index < 0) {
    goog.array.insertAt(array, value, -(index + 1));
    return true
  }
  return false
};
goog.array.binaryRemove = function(array, value, opt_compareFn) {
  var index = goog.array.binarySearch(array, value, opt_compareFn);
  return index >= 0 ? goog.array.removeAt(array, index) : false
};
goog.array.bucket = function(array, sorter) {
  var buckets = {};
  for(var i = 0;i < array.length;i++) {
    var value = array[i];
    var key = sorter(value, i, array);
    if(goog.isDef(key)) {
      var bucket = buckets[key] || (buckets[key] = []);
      bucket.push(value)
    }
  }
  return buckets
};
goog.array.repeat = function(value, n) {
  var array = [];
  for(var i = 0;i < n;i++) {
    array[i] = value
  }
  return array
};
goog.array.flatten = function(var_args) {
  var result = [];
  for(var i = 0;i < arguments.length;i++) {
    var element = arguments[i];
    if(goog.isArray(element)) {
      result.push.apply(result, goog.array.flatten.apply(null, element))
    }else {
      result.push(element)
    }
  }
  return result
};
goog.array.rotate = function(array, n) {
  goog.asserts.assert(array.length != null);
  if(array.length) {
    n %= array.length;
    if(n > 0) {
      goog.array.ARRAY_PROTOTYPE_.unshift.apply(array, array.splice(-n, n))
    }else {
      if(n < 0) {
        goog.array.ARRAY_PROTOTYPE_.push.apply(array, array.splice(0, -n))
      }
    }
  }
  return array
};
goog.array.zip = function(var_args) {
  if(!arguments.length) {
    return[]
  }
  var result = [];
  for(var i = 0;true;i++) {
    var value = [];
    for(var j = 0;j < arguments.length;j++) {
      var arr = arguments[j];
      if(i >= arr.length) {
        return result
      }
      value.push(arr[i])
    }
    result.push(value)
  }
};
goog.array.shuffle = function(arr, opt_randFn) {
  var randFn = opt_randFn || Math.random;
  for(var i = arr.length - 1;i > 0;i--) {
    var j = Math.floor(randFn() * (i + 1));
    var tmp = arr[i];
    arr[i] = arr[j];
    arr[j] = tmp
  }
};
goog.provide("goog.object");
goog.object.forEach = function(obj, f, opt_obj) {
  for(var key in obj) {
    f.call(opt_obj, obj[key], key, obj)
  }
};
goog.object.filter = function(obj, f, opt_obj) {
  var res = {};
  for(var key in obj) {
    if(f.call(opt_obj, obj[key], key, obj)) {
      res[key] = obj[key]
    }
  }
  return res
};
goog.object.map = function(obj, f, opt_obj) {
  var res = {};
  for(var key in obj) {
    res[key] = f.call(opt_obj, obj[key], key, obj)
  }
  return res
};
goog.object.some = function(obj, f, opt_obj) {
  for(var key in obj) {
    if(f.call(opt_obj, obj[key], key, obj)) {
      return true
    }
  }
  return false
};
goog.object.every = function(obj, f, opt_obj) {
  for(var key in obj) {
    if(!f.call(opt_obj, obj[key], key, obj)) {
      return false
    }
  }
  return true
};
goog.object.getCount = function(obj) {
  var rv = 0;
  for(var key in obj) {
    rv++
  }
  return rv
};
goog.object.getAnyKey = function(obj) {
  for(var key in obj) {
    return key
  }
};
goog.object.getAnyValue = function(obj) {
  for(var key in obj) {
    return obj[key]
  }
};
goog.object.contains = function(obj, val) {
  return goog.object.containsValue(obj, val)
};
goog.object.getValues = function(obj) {
  var res = [];
  var i = 0;
  for(var key in obj) {
    res[i++] = obj[key]
  }
  return res
};
goog.object.getKeys = function(obj) {
  var res = [];
  var i = 0;
  for(var key in obj) {
    res[i++] = key
  }
  return res
};
goog.object.getValueByKeys = function(obj, var_args) {
  var isArrayLike = goog.isArrayLike(var_args);
  var keys = isArrayLike ? var_args : arguments;
  for(var i = isArrayLike ? 0 : 1;i < keys.length;i++) {
    obj = obj[keys[i]];
    if(!goog.isDef(obj)) {
      break
    }
  }
  return obj
};
goog.object.containsKey = function(obj, key) {
  return key in obj
};
goog.object.containsValue = function(obj, val) {
  for(var key in obj) {
    if(obj[key] == val) {
      return true
    }
  }
  return false
};
goog.object.findKey = function(obj, f, opt_this) {
  for(var key in obj) {
    if(f.call(opt_this, obj[key], key, obj)) {
      return key
    }
  }
  return undefined
};
goog.object.findValue = function(obj, f, opt_this) {
  var key = goog.object.findKey(obj, f, opt_this);
  return key && obj[key]
};
goog.object.isEmpty = function(obj) {
  for(var key in obj) {
    return false
  }
  return true
};
goog.object.clear = function(obj) {
  for(var i in obj) {
    delete obj[i]
  }
};
goog.object.remove = function(obj, key) {
  var rv;
  if(rv = key in obj) {
    delete obj[key]
  }
  return rv
};
goog.object.add = function(obj, key, val) {
  if(key in obj) {
    throw Error('The object already contains the key "' + key + '"');
  }
  goog.object.set(obj, key, val)
};
goog.object.get = function(obj, key, opt_val) {
  if(key in obj) {
    return obj[key]
  }
  return opt_val
};
goog.object.set = function(obj, key, value) {
  obj[key] = value
};
goog.object.setIfUndefined = function(obj, key, value) {
  return key in obj ? obj[key] : obj[key] = value
};
goog.object.clone = function(obj) {
  var res = {};
  for(var key in obj) {
    res[key] = obj[key]
  }
  return res
};
goog.object.unsafeClone = function(obj) {
  var type = goog.typeOf(obj);
  if(type == "object" || type == "array") {
    if(obj.clone) {
      return obj.clone()
    }
    var clone = type == "array" ? [] : {};
    for(var key in obj) {
      clone[key] = goog.object.unsafeClone(obj[key])
    }
    return clone
  }
  return obj
};
goog.object.transpose = function(obj) {
  var transposed = {};
  for(var key in obj) {
    transposed[obj[key]] = key
  }
  return transposed
};
goog.object.PROTOTYPE_FIELDS_ = ["constructor", "hasOwnProperty", "isPrototypeOf", "propertyIsEnumerable", "toLocaleString", "toString", "valueOf"];
goog.object.extend = function(target, var_args) {
  var key, source;
  for(var i = 1;i < arguments.length;i++) {
    source = arguments[i];
    for(key in source) {
      target[key] = source[key]
    }
    for(var j = 0;j < goog.object.PROTOTYPE_FIELDS_.length;j++) {
      key = goog.object.PROTOTYPE_FIELDS_[j];
      if(Object.prototype.hasOwnProperty.call(source, key)) {
        target[key] = source[key]
      }
    }
  }
};
goog.object.create = function(var_args) {
  var argLength = arguments.length;
  if(argLength == 1 && goog.isArray(arguments[0])) {
    return goog.object.create.apply(null, arguments[0])
  }
  if(argLength % 2) {
    throw Error("Uneven number of arguments");
  }
  var rv = {};
  for(var i = 0;i < argLength;i += 2) {
    rv[arguments[i]] = arguments[i + 1]
  }
  return rv
};
goog.object.createSet = function(var_args) {
  var argLength = arguments.length;
  if(argLength == 1 && goog.isArray(arguments[0])) {
    return goog.object.createSet.apply(null, arguments[0])
  }
  var rv = {};
  for(var i = 0;i < argLength;i++) {
    rv[arguments[i]] = true
  }
  return rv
};
goog.provide("goog.string.format");
goog.require("goog.string");
goog.string.format = function(formatString, var_args) {
  var args = Array.prototype.slice.call(arguments);
  var template = args.shift();
  if(typeof template == "undefined") {
    throw Error("[goog.string.format] Template required");
  }
  var formatRe = /%([0\-\ \+]*)(\d+)?(\.(\d+))?([%sfdiu])/g;
  function replacerDemuxer(match, flags, width, dotp, precision, type, offset, wholeString) {
    if(type == "%") {
      return"%"
    }
    var value = args.shift();
    if(typeof value == "undefined") {
      throw Error("[goog.string.format] Not enough arguments");
    }
    arguments[0] = value;
    return goog.string.format.demuxes_[type].apply(null, arguments)
  }
  return template.replace(formatRe, replacerDemuxer)
};
goog.string.format.demuxes_ = {};
goog.string.format.demuxes_["s"] = function(value, flags, width, dotp, precision, type, offset, wholeString) {
  var replacement = value;
  if(isNaN(width) || width == "" || replacement.length >= width) {
    return replacement
  }
  if(flags.indexOf("-", 0) > -1) {
    replacement = replacement + goog.string.repeat(" ", width - replacement.length)
  }else {
    replacement = goog.string.repeat(" ", width - replacement.length) + replacement
  }
  return replacement
};
goog.string.format.demuxes_["f"] = function(value, flags, width, dotp, precision, type, offset, wholeString) {
  var replacement = value.toString();
  if(!(isNaN(precision) || precision == "")) {
    replacement = value.toFixed(precision)
  }
  var sign;
  if(value < 0) {
    sign = "-"
  }else {
    if(flags.indexOf("+") >= 0) {
      sign = "+"
    }else {
      if(flags.indexOf(" ") >= 0) {
        sign = " "
      }else {
        sign = ""
      }
    }
  }
  if(value >= 0) {
    replacement = sign + replacement
  }
  if(isNaN(width) || replacement.length >= width) {
    return replacement
  }
  replacement = isNaN(precision) ? Math.abs(value).toString() : Math.abs(value).toFixed(precision);
  var padCount = width - replacement.length - sign.length;
  if(flags.indexOf("-", 0) >= 0) {
    replacement = sign + replacement + goog.string.repeat(" ", padCount)
  }else {
    var paddingChar = flags.indexOf("0", 0) >= 0 ? "0" : " ";
    replacement = sign + goog.string.repeat(paddingChar, padCount) + replacement
  }
  return replacement
};
goog.string.format.demuxes_["d"] = function(value, flags, width, dotp, precision, type, offset, wholeString) {
  return goog.string.format.demuxes_["f"](parseInt(value, 10), flags, width, dotp, 0, type, offset, wholeString)
};
goog.string.format.demuxes_["i"] = goog.string.format.demuxes_["d"];
goog.string.format.demuxes_["u"] = goog.string.format.demuxes_["d"];
goog.provide("goog.userAgent.jscript");
goog.require("goog.string");
goog.userAgent.jscript.ASSUME_NO_JSCRIPT = false;
goog.userAgent.jscript.init_ = function() {
  var hasScriptEngine = "ScriptEngine" in goog.global;
  goog.userAgent.jscript.DETECTED_HAS_JSCRIPT_ = hasScriptEngine && goog.global["ScriptEngine"]() == "JScript";
  goog.userAgent.jscript.DETECTED_VERSION_ = goog.userAgent.jscript.DETECTED_HAS_JSCRIPT_ ? goog.global["ScriptEngineMajorVersion"]() + "." + goog.global["ScriptEngineMinorVersion"]() + "." + goog.global["ScriptEngineBuildVersion"]() : "0"
};
if(!goog.userAgent.jscript.ASSUME_NO_JSCRIPT) {
  goog.userAgent.jscript.init_()
}
goog.userAgent.jscript.HAS_JSCRIPT = goog.userAgent.jscript.ASSUME_NO_JSCRIPT ? false : goog.userAgent.jscript.DETECTED_HAS_JSCRIPT_;
goog.userAgent.jscript.VERSION = goog.userAgent.jscript.ASSUME_NO_JSCRIPT ? "0" : goog.userAgent.jscript.DETECTED_VERSION_;
goog.userAgent.jscript.isVersion = function(version) {
  return goog.string.compareVersions(goog.userAgent.jscript.VERSION, version) >= 0
};
goog.provide("goog.string.StringBuffer");
goog.require("goog.userAgent.jscript");
goog.string.StringBuffer = function(opt_a1, var_args) {
  this.buffer_ = goog.userAgent.jscript.HAS_JSCRIPT ? [] : "";
  if(opt_a1 != null) {
    this.append.apply(this, arguments)
  }
};
goog.string.StringBuffer.prototype.set = function(s) {
  this.clear();
  this.append(s)
};
if(goog.userAgent.jscript.HAS_JSCRIPT) {
  goog.string.StringBuffer.prototype.bufferLength_ = 0;
  goog.string.StringBuffer.prototype.append = function(a1, opt_a2, var_args) {
    if(opt_a2 == null) {
      this.buffer_[this.bufferLength_++] = a1
    }else {
      this.buffer_.push.apply(this.buffer_, arguments);
      this.bufferLength_ = this.buffer_.length
    }
    return this
  }
}else {
  goog.string.StringBuffer.prototype.append = function(a1, opt_a2, var_args) {
    this.buffer_ += a1;
    if(opt_a2 != null) {
      for(var i = 1;i < arguments.length;i++) {
        this.buffer_ += arguments[i]
      }
    }
    return this
  }
}
goog.string.StringBuffer.prototype.clear = function() {
  if(goog.userAgent.jscript.HAS_JSCRIPT) {
    this.buffer_.length = 0;
    this.bufferLength_ = 0
  }else {
    this.buffer_ = ""
  }
};
goog.string.StringBuffer.prototype.getLength = function() {
  return this.toString().length
};
goog.string.StringBuffer.prototype.toString = function() {
  if(goog.userAgent.jscript.HAS_JSCRIPT) {
    var str = this.buffer_.join("");
    this.clear();
    if(str) {
      this.append(str)
    }
    return str
  }else {
    return this.buffer_
  }
};
goog.provide("cljs.core");
goog.require("goog.array");
goog.require("goog.object");
goog.require("goog.string.format");
goog.require("goog.string.StringBuffer");
goog.require("goog.string");
cljs.core._STAR_unchecked_if_STAR_ = false;
cljs.core._STAR_print_fn_STAR_ = function _STAR_print_fn_STAR_(_) {
  throw new Error("No *print-fn* fn set for evaluation environment");
};
cljs.core.truth_ = function truth_(x) {
  return x != null && x !== false
};
cljs.core.type_satisfies_ = function type_satisfies_(p, x) {
  var x__13591 = x == null ? null : x;
  if(p[goog.typeOf(x__13591)]) {
    return true
  }else {
    if(p["_"]) {
      return true
    }else {
      if("\ufdd0'else") {
        return false
      }else {
        return null
      }
    }
  }
};
cljs.core.is_proto_ = function is_proto_(x) {
  return x.constructor.prototype === x
};
cljs.core._STAR_main_cli_fn_STAR_ = null;
cljs.core.missing_protocol = function missing_protocol(proto, obj) {
  return Error(["No protocol method ", proto, " defined for type ", goog.typeOf(obj), ": ", obj].join(""))
};
cljs.core.aclone = function aclone(array_like) {
  return array_like.slice()
};
cljs.core.array = function array(var_args) {
  return Array.prototype.slice.call(arguments)
};
cljs.core.make_array = function() {
  var make_array = null;
  var make_array__1 = function(size) {
    return new Array(size)
  };
  var make_array__2 = function(type, size) {
    return make_array.call(null, size)
  };
  make_array = function(type, size) {
    switch(arguments.length) {
      case 1:
        return make_array__1.call(this, type);
      case 2:
        return make_array__2.call(this, type, size)
    }
    throw"Invalid arity: " + arguments.length;
  };
  make_array.cljs$lang$arity$1 = make_array__1;
  make_array.cljs$lang$arity$2 = make_array__2;
  return make_array
}();
cljs.core.aget = function() {
  var aget = null;
  var aget__2 = function(array, i) {
    return array[i]
  };
  var aget__3 = function() {
    var G__13592__delegate = function(array, i, idxs) {
      return cljs.core.apply.call(null, aget, aget.call(null, array, i), idxs)
    };
    var G__13592 = function(array, i, var_args) {
      var idxs = null;
      if(goog.isDef(var_args)) {
        idxs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__13592__delegate.call(this, array, i, idxs)
    };
    G__13592.cljs$lang$maxFixedArity = 2;
    G__13592.cljs$lang$applyTo = function(arglist__13593) {
      var array = cljs.core.first(arglist__13593);
      var i = cljs.core.first(cljs.core.next(arglist__13593));
      var idxs = cljs.core.rest(cljs.core.next(arglist__13593));
      return G__13592__delegate(array, i, idxs)
    };
    G__13592.cljs$lang$arity$variadic = G__13592__delegate;
    return G__13592
  }();
  aget = function(array, i, var_args) {
    var idxs = var_args;
    switch(arguments.length) {
      case 2:
        return aget__2.call(this, array, i);
      default:
        return aget__3.cljs$lang$arity$variadic(array, i, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  aget.cljs$lang$maxFixedArity = 2;
  aget.cljs$lang$applyTo = aget__3.cljs$lang$applyTo;
  aget.cljs$lang$arity$2 = aget__2;
  aget.cljs$lang$arity$variadic = aget__3.cljs$lang$arity$variadic;
  return aget
}();
cljs.core.aset = function aset(array, i, val) {
  return array[i] = val
};
cljs.core.alength = function alength(array) {
  return array.length
};
cljs.core.into_array = function() {
  var into_array = null;
  var into_array__1 = function(aseq) {
    return into_array.call(null, null, aseq)
  };
  var into_array__2 = function(type, aseq) {
    return cljs.core.reduce.call(null, function(a, x) {
      a.push(x);
      return a
    }, [], aseq)
  };
  into_array = function(type, aseq) {
    switch(arguments.length) {
      case 1:
        return into_array__1.call(this, type);
      case 2:
        return into_array__2.call(this, type, aseq)
    }
    throw"Invalid arity: " + arguments.length;
  };
  into_array.cljs$lang$arity$1 = into_array__1;
  into_array.cljs$lang$arity$2 = into_array__2;
  return into_array
}();
cljs.core.IFn = {};
cljs.core._invoke = function() {
  var _invoke = null;
  var _invoke__1 = function(this$) {
    if(function() {
      var and__3822__auto____13678 = this$;
      if(and__3822__auto____13678) {
        return this$.cljs$core$IFn$_invoke$arity$1
      }else {
        return and__3822__auto____13678
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$1(this$)
    }else {
      var x__2363__auto____13679 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____13680 = cljs.core._invoke[goog.typeOf(x__2363__auto____13679)];
        if(or__3824__auto____13680) {
          return or__3824__auto____13680
        }else {
          var or__3824__auto____13681 = cljs.core._invoke["_"];
          if(or__3824__auto____13681) {
            return or__3824__auto____13681
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$)
    }
  };
  var _invoke__2 = function(this$, a) {
    if(function() {
      var and__3822__auto____13682 = this$;
      if(and__3822__auto____13682) {
        return this$.cljs$core$IFn$_invoke$arity$2
      }else {
        return and__3822__auto____13682
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$2(this$, a)
    }else {
      var x__2363__auto____13683 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____13684 = cljs.core._invoke[goog.typeOf(x__2363__auto____13683)];
        if(or__3824__auto____13684) {
          return or__3824__auto____13684
        }else {
          var or__3824__auto____13685 = cljs.core._invoke["_"];
          if(or__3824__auto____13685) {
            return or__3824__auto____13685
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a)
    }
  };
  var _invoke__3 = function(this$, a, b) {
    if(function() {
      var and__3822__auto____13686 = this$;
      if(and__3822__auto____13686) {
        return this$.cljs$core$IFn$_invoke$arity$3
      }else {
        return and__3822__auto____13686
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$3(this$, a, b)
    }else {
      var x__2363__auto____13687 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____13688 = cljs.core._invoke[goog.typeOf(x__2363__auto____13687)];
        if(or__3824__auto____13688) {
          return or__3824__auto____13688
        }else {
          var or__3824__auto____13689 = cljs.core._invoke["_"];
          if(or__3824__auto____13689) {
            return or__3824__auto____13689
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b)
    }
  };
  var _invoke__4 = function(this$, a, b, c) {
    if(function() {
      var and__3822__auto____13690 = this$;
      if(and__3822__auto____13690) {
        return this$.cljs$core$IFn$_invoke$arity$4
      }else {
        return and__3822__auto____13690
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$4(this$, a, b, c)
    }else {
      var x__2363__auto____13691 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____13692 = cljs.core._invoke[goog.typeOf(x__2363__auto____13691)];
        if(or__3824__auto____13692) {
          return or__3824__auto____13692
        }else {
          var or__3824__auto____13693 = cljs.core._invoke["_"];
          if(or__3824__auto____13693) {
            return or__3824__auto____13693
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c)
    }
  };
  var _invoke__5 = function(this$, a, b, c, d) {
    if(function() {
      var and__3822__auto____13694 = this$;
      if(and__3822__auto____13694) {
        return this$.cljs$core$IFn$_invoke$arity$5
      }else {
        return and__3822__auto____13694
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$5(this$, a, b, c, d)
    }else {
      var x__2363__auto____13695 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____13696 = cljs.core._invoke[goog.typeOf(x__2363__auto____13695)];
        if(or__3824__auto____13696) {
          return or__3824__auto____13696
        }else {
          var or__3824__auto____13697 = cljs.core._invoke["_"];
          if(or__3824__auto____13697) {
            return or__3824__auto____13697
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d)
    }
  };
  var _invoke__6 = function(this$, a, b, c, d, e) {
    if(function() {
      var and__3822__auto____13698 = this$;
      if(and__3822__auto____13698) {
        return this$.cljs$core$IFn$_invoke$arity$6
      }else {
        return and__3822__auto____13698
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$6(this$, a, b, c, d, e)
    }else {
      var x__2363__auto____13699 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____13700 = cljs.core._invoke[goog.typeOf(x__2363__auto____13699)];
        if(or__3824__auto____13700) {
          return or__3824__auto____13700
        }else {
          var or__3824__auto____13701 = cljs.core._invoke["_"];
          if(or__3824__auto____13701) {
            return or__3824__auto____13701
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e)
    }
  };
  var _invoke__7 = function(this$, a, b, c, d, e, f) {
    if(function() {
      var and__3822__auto____13702 = this$;
      if(and__3822__auto____13702) {
        return this$.cljs$core$IFn$_invoke$arity$7
      }else {
        return and__3822__auto____13702
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$7(this$, a, b, c, d, e, f)
    }else {
      var x__2363__auto____13703 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____13704 = cljs.core._invoke[goog.typeOf(x__2363__auto____13703)];
        if(or__3824__auto____13704) {
          return or__3824__auto____13704
        }else {
          var or__3824__auto____13705 = cljs.core._invoke["_"];
          if(or__3824__auto____13705) {
            return or__3824__auto____13705
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f)
    }
  };
  var _invoke__8 = function(this$, a, b, c, d, e, f, g) {
    if(function() {
      var and__3822__auto____13706 = this$;
      if(and__3822__auto____13706) {
        return this$.cljs$core$IFn$_invoke$arity$8
      }else {
        return and__3822__auto____13706
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$8(this$, a, b, c, d, e, f, g)
    }else {
      var x__2363__auto____13707 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____13708 = cljs.core._invoke[goog.typeOf(x__2363__auto____13707)];
        if(or__3824__auto____13708) {
          return or__3824__auto____13708
        }else {
          var or__3824__auto____13709 = cljs.core._invoke["_"];
          if(or__3824__auto____13709) {
            return or__3824__auto____13709
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g)
    }
  };
  var _invoke__9 = function(this$, a, b, c, d, e, f, g, h) {
    if(function() {
      var and__3822__auto____13710 = this$;
      if(and__3822__auto____13710) {
        return this$.cljs$core$IFn$_invoke$arity$9
      }else {
        return and__3822__auto____13710
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$9(this$, a, b, c, d, e, f, g, h)
    }else {
      var x__2363__auto____13711 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____13712 = cljs.core._invoke[goog.typeOf(x__2363__auto____13711)];
        if(or__3824__auto____13712) {
          return or__3824__auto____13712
        }else {
          var or__3824__auto____13713 = cljs.core._invoke["_"];
          if(or__3824__auto____13713) {
            return or__3824__auto____13713
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h)
    }
  };
  var _invoke__10 = function(this$, a, b, c, d, e, f, g, h, i) {
    if(function() {
      var and__3822__auto____13714 = this$;
      if(and__3822__auto____13714) {
        return this$.cljs$core$IFn$_invoke$arity$10
      }else {
        return and__3822__auto____13714
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$10(this$, a, b, c, d, e, f, g, h, i)
    }else {
      var x__2363__auto____13715 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____13716 = cljs.core._invoke[goog.typeOf(x__2363__auto____13715)];
        if(or__3824__auto____13716) {
          return or__3824__auto____13716
        }else {
          var or__3824__auto____13717 = cljs.core._invoke["_"];
          if(or__3824__auto____13717) {
            return or__3824__auto____13717
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i)
    }
  };
  var _invoke__11 = function(this$, a, b, c, d, e, f, g, h, i, j) {
    if(function() {
      var and__3822__auto____13718 = this$;
      if(and__3822__auto____13718) {
        return this$.cljs$core$IFn$_invoke$arity$11
      }else {
        return and__3822__auto____13718
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$11(this$, a, b, c, d, e, f, g, h, i, j)
    }else {
      var x__2363__auto____13719 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____13720 = cljs.core._invoke[goog.typeOf(x__2363__auto____13719)];
        if(or__3824__auto____13720) {
          return or__3824__auto____13720
        }else {
          var or__3824__auto____13721 = cljs.core._invoke["_"];
          if(or__3824__auto____13721) {
            return or__3824__auto____13721
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j)
    }
  };
  var _invoke__12 = function(this$, a, b, c, d, e, f, g, h, i, j, k) {
    if(function() {
      var and__3822__auto____13722 = this$;
      if(and__3822__auto____13722) {
        return this$.cljs$core$IFn$_invoke$arity$12
      }else {
        return and__3822__auto____13722
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$12(this$, a, b, c, d, e, f, g, h, i, j, k)
    }else {
      var x__2363__auto____13723 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____13724 = cljs.core._invoke[goog.typeOf(x__2363__auto____13723)];
        if(or__3824__auto____13724) {
          return or__3824__auto____13724
        }else {
          var or__3824__auto____13725 = cljs.core._invoke["_"];
          if(or__3824__auto____13725) {
            return or__3824__auto____13725
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k)
    }
  };
  var _invoke__13 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l) {
    if(function() {
      var and__3822__auto____13726 = this$;
      if(and__3822__auto____13726) {
        return this$.cljs$core$IFn$_invoke$arity$13
      }else {
        return and__3822__auto____13726
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$13(this$, a, b, c, d, e, f, g, h, i, j, k, l)
    }else {
      var x__2363__auto____13727 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____13728 = cljs.core._invoke[goog.typeOf(x__2363__auto____13727)];
        if(or__3824__auto____13728) {
          return or__3824__auto____13728
        }else {
          var or__3824__auto____13729 = cljs.core._invoke["_"];
          if(or__3824__auto____13729) {
            return or__3824__auto____13729
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l)
    }
  };
  var _invoke__14 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m) {
    if(function() {
      var and__3822__auto____13730 = this$;
      if(and__3822__auto____13730) {
        return this$.cljs$core$IFn$_invoke$arity$14
      }else {
        return and__3822__auto____13730
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$14(this$, a, b, c, d, e, f, g, h, i, j, k, l, m)
    }else {
      var x__2363__auto____13731 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____13732 = cljs.core._invoke[goog.typeOf(x__2363__auto____13731)];
        if(or__3824__auto____13732) {
          return or__3824__auto____13732
        }else {
          var or__3824__auto____13733 = cljs.core._invoke["_"];
          if(or__3824__auto____13733) {
            return or__3824__auto____13733
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m)
    }
  };
  var _invoke__15 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n) {
    if(function() {
      var and__3822__auto____13734 = this$;
      if(and__3822__auto____13734) {
        return this$.cljs$core$IFn$_invoke$arity$15
      }else {
        return and__3822__auto____13734
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$15(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n)
    }else {
      var x__2363__auto____13735 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____13736 = cljs.core._invoke[goog.typeOf(x__2363__auto____13735)];
        if(or__3824__auto____13736) {
          return or__3824__auto____13736
        }else {
          var or__3824__auto____13737 = cljs.core._invoke["_"];
          if(or__3824__auto____13737) {
            return or__3824__auto____13737
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n)
    }
  };
  var _invoke__16 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o) {
    if(function() {
      var and__3822__auto____13738 = this$;
      if(and__3822__auto____13738) {
        return this$.cljs$core$IFn$_invoke$arity$16
      }else {
        return and__3822__auto____13738
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$16(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o)
    }else {
      var x__2363__auto____13739 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____13740 = cljs.core._invoke[goog.typeOf(x__2363__auto____13739)];
        if(or__3824__auto____13740) {
          return or__3824__auto____13740
        }else {
          var or__3824__auto____13741 = cljs.core._invoke["_"];
          if(or__3824__auto____13741) {
            return or__3824__auto____13741
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o)
    }
  };
  var _invoke__17 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p) {
    if(function() {
      var and__3822__auto____13742 = this$;
      if(and__3822__auto____13742) {
        return this$.cljs$core$IFn$_invoke$arity$17
      }else {
        return and__3822__auto____13742
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$17(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p)
    }else {
      var x__2363__auto____13743 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____13744 = cljs.core._invoke[goog.typeOf(x__2363__auto____13743)];
        if(or__3824__auto____13744) {
          return or__3824__auto____13744
        }else {
          var or__3824__auto____13745 = cljs.core._invoke["_"];
          if(or__3824__auto____13745) {
            return or__3824__auto____13745
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p)
    }
  };
  var _invoke__18 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q) {
    if(function() {
      var and__3822__auto____13746 = this$;
      if(and__3822__auto____13746) {
        return this$.cljs$core$IFn$_invoke$arity$18
      }else {
        return and__3822__auto____13746
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$18(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q)
    }else {
      var x__2363__auto____13747 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____13748 = cljs.core._invoke[goog.typeOf(x__2363__auto____13747)];
        if(or__3824__auto____13748) {
          return or__3824__auto____13748
        }else {
          var or__3824__auto____13749 = cljs.core._invoke["_"];
          if(or__3824__auto____13749) {
            return or__3824__auto____13749
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q)
    }
  };
  var _invoke__19 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s) {
    if(function() {
      var and__3822__auto____13750 = this$;
      if(and__3822__auto____13750) {
        return this$.cljs$core$IFn$_invoke$arity$19
      }else {
        return and__3822__auto____13750
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$19(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s)
    }else {
      var x__2363__auto____13751 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____13752 = cljs.core._invoke[goog.typeOf(x__2363__auto____13751)];
        if(or__3824__auto____13752) {
          return or__3824__auto____13752
        }else {
          var or__3824__auto____13753 = cljs.core._invoke["_"];
          if(or__3824__auto____13753) {
            return or__3824__auto____13753
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s)
    }
  };
  var _invoke__20 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t) {
    if(function() {
      var and__3822__auto____13754 = this$;
      if(and__3822__auto____13754) {
        return this$.cljs$core$IFn$_invoke$arity$20
      }else {
        return and__3822__auto____13754
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$20(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t)
    }else {
      var x__2363__auto____13755 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____13756 = cljs.core._invoke[goog.typeOf(x__2363__auto____13755)];
        if(or__3824__auto____13756) {
          return or__3824__auto____13756
        }else {
          var or__3824__auto____13757 = cljs.core._invoke["_"];
          if(or__3824__auto____13757) {
            return or__3824__auto____13757
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t)
    }
  };
  var _invoke__21 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t, rest) {
    if(function() {
      var and__3822__auto____13758 = this$;
      if(and__3822__auto____13758) {
        return this$.cljs$core$IFn$_invoke$arity$21
      }else {
        return and__3822__auto____13758
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$21(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t, rest)
    }else {
      var x__2363__auto____13759 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____13760 = cljs.core._invoke[goog.typeOf(x__2363__auto____13759)];
        if(or__3824__auto____13760) {
          return or__3824__auto____13760
        }else {
          var or__3824__auto____13761 = cljs.core._invoke["_"];
          if(or__3824__auto____13761) {
            return or__3824__auto____13761
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t, rest)
    }
  };
  _invoke = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t, rest) {
    switch(arguments.length) {
      case 1:
        return _invoke__1.call(this, this$);
      case 2:
        return _invoke__2.call(this, this$, a);
      case 3:
        return _invoke__3.call(this, this$, a, b);
      case 4:
        return _invoke__4.call(this, this$, a, b, c);
      case 5:
        return _invoke__5.call(this, this$, a, b, c, d);
      case 6:
        return _invoke__6.call(this, this$, a, b, c, d, e);
      case 7:
        return _invoke__7.call(this, this$, a, b, c, d, e, f);
      case 8:
        return _invoke__8.call(this, this$, a, b, c, d, e, f, g);
      case 9:
        return _invoke__9.call(this, this$, a, b, c, d, e, f, g, h);
      case 10:
        return _invoke__10.call(this, this$, a, b, c, d, e, f, g, h, i);
      case 11:
        return _invoke__11.call(this, this$, a, b, c, d, e, f, g, h, i, j);
      case 12:
        return _invoke__12.call(this, this$, a, b, c, d, e, f, g, h, i, j, k);
      case 13:
        return _invoke__13.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l);
      case 14:
        return _invoke__14.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m);
      case 15:
        return _invoke__15.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n);
      case 16:
        return _invoke__16.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o);
      case 17:
        return _invoke__17.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p);
      case 18:
        return _invoke__18.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q);
      case 19:
        return _invoke__19.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s);
      case 20:
        return _invoke__20.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t);
      case 21:
        return _invoke__21.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t, rest)
    }
    throw"Invalid arity: " + arguments.length;
  };
  _invoke.cljs$lang$arity$1 = _invoke__1;
  _invoke.cljs$lang$arity$2 = _invoke__2;
  _invoke.cljs$lang$arity$3 = _invoke__3;
  _invoke.cljs$lang$arity$4 = _invoke__4;
  _invoke.cljs$lang$arity$5 = _invoke__5;
  _invoke.cljs$lang$arity$6 = _invoke__6;
  _invoke.cljs$lang$arity$7 = _invoke__7;
  _invoke.cljs$lang$arity$8 = _invoke__8;
  _invoke.cljs$lang$arity$9 = _invoke__9;
  _invoke.cljs$lang$arity$10 = _invoke__10;
  _invoke.cljs$lang$arity$11 = _invoke__11;
  _invoke.cljs$lang$arity$12 = _invoke__12;
  _invoke.cljs$lang$arity$13 = _invoke__13;
  _invoke.cljs$lang$arity$14 = _invoke__14;
  _invoke.cljs$lang$arity$15 = _invoke__15;
  _invoke.cljs$lang$arity$16 = _invoke__16;
  _invoke.cljs$lang$arity$17 = _invoke__17;
  _invoke.cljs$lang$arity$18 = _invoke__18;
  _invoke.cljs$lang$arity$19 = _invoke__19;
  _invoke.cljs$lang$arity$20 = _invoke__20;
  _invoke.cljs$lang$arity$21 = _invoke__21;
  return _invoke
}();
cljs.core.ICounted = {};
cljs.core._count = function _count(coll) {
  if(function() {
    var and__3822__auto____13766 = coll;
    if(and__3822__auto____13766) {
      return coll.cljs$core$ICounted$_count$arity$1
    }else {
      return and__3822__auto____13766
    }
  }()) {
    return coll.cljs$core$ICounted$_count$arity$1(coll)
  }else {
    var x__2363__auto____13767 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____13768 = cljs.core._count[goog.typeOf(x__2363__auto____13767)];
      if(or__3824__auto____13768) {
        return or__3824__auto____13768
      }else {
        var or__3824__auto____13769 = cljs.core._count["_"];
        if(or__3824__auto____13769) {
          return or__3824__auto____13769
        }else {
          throw cljs.core.missing_protocol.call(null, "ICounted.-count", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.IEmptyableCollection = {};
cljs.core._empty = function _empty(coll) {
  if(function() {
    var and__3822__auto____13774 = coll;
    if(and__3822__auto____13774) {
      return coll.cljs$core$IEmptyableCollection$_empty$arity$1
    }else {
      return and__3822__auto____13774
    }
  }()) {
    return coll.cljs$core$IEmptyableCollection$_empty$arity$1(coll)
  }else {
    var x__2363__auto____13775 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____13776 = cljs.core._empty[goog.typeOf(x__2363__auto____13775)];
      if(or__3824__auto____13776) {
        return or__3824__auto____13776
      }else {
        var or__3824__auto____13777 = cljs.core._empty["_"];
        if(or__3824__auto____13777) {
          return or__3824__auto____13777
        }else {
          throw cljs.core.missing_protocol.call(null, "IEmptyableCollection.-empty", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.ICollection = {};
cljs.core._conj = function _conj(coll, o) {
  if(function() {
    var and__3822__auto____13782 = coll;
    if(and__3822__auto____13782) {
      return coll.cljs$core$ICollection$_conj$arity$2
    }else {
      return and__3822__auto____13782
    }
  }()) {
    return coll.cljs$core$ICollection$_conj$arity$2(coll, o)
  }else {
    var x__2363__auto____13783 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____13784 = cljs.core._conj[goog.typeOf(x__2363__auto____13783)];
      if(or__3824__auto____13784) {
        return or__3824__auto____13784
      }else {
        var or__3824__auto____13785 = cljs.core._conj["_"];
        if(or__3824__auto____13785) {
          return or__3824__auto____13785
        }else {
          throw cljs.core.missing_protocol.call(null, "ICollection.-conj", coll);
        }
      }
    }().call(null, coll, o)
  }
};
cljs.core.IIndexed = {};
cljs.core._nth = function() {
  var _nth = null;
  var _nth__2 = function(coll, n) {
    if(function() {
      var and__3822__auto____13794 = coll;
      if(and__3822__auto____13794) {
        return coll.cljs$core$IIndexed$_nth$arity$2
      }else {
        return and__3822__auto____13794
      }
    }()) {
      return coll.cljs$core$IIndexed$_nth$arity$2(coll, n)
    }else {
      var x__2363__auto____13795 = coll == null ? null : coll;
      return function() {
        var or__3824__auto____13796 = cljs.core._nth[goog.typeOf(x__2363__auto____13795)];
        if(or__3824__auto____13796) {
          return or__3824__auto____13796
        }else {
          var or__3824__auto____13797 = cljs.core._nth["_"];
          if(or__3824__auto____13797) {
            return or__3824__auto____13797
          }else {
            throw cljs.core.missing_protocol.call(null, "IIndexed.-nth", coll);
          }
        }
      }().call(null, coll, n)
    }
  };
  var _nth__3 = function(coll, n, not_found) {
    if(function() {
      var and__3822__auto____13798 = coll;
      if(and__3822__auto____13798) {
        return coll.cljs$core$IIndexed$_nth$arity$3
      }else {
        return and__3822__auto____13798
      }
    }()) {
      return coll.cljs$core$IIndexed$_nth$arity$3(coll, n, not_found)
    }else {
      var x__2363__auto____13799 = coll == null ? null : coll;
      return function() {
        var or__3824__auto____13800 = cljs.core._nth[goog.typeOf(x__2363__auto____13799)];
        if(or__3824__auto____13800) {
          return or__3824__auto____13800
        }else {
          var or__3824__auto____13801 = cljs.core._nth["_"];
          if(or__3824__auto____13801) {
            return or__3824__auto____13801
          }else {
            throw cljs.core.missing_protocol.call(null, "IIndexed.-nth", coll);
          }
        }
      }().call(null, coll, n, not_found)
    }
  };
  _nth = function(coll, n, not_found) {
    switch(arguments.length) {
      case 2:
        return _nth__2.call(this, coll, n);
      case 3:
        return _nth__3.call(this, coll, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  _nth.cljs$lang$arity$2 = _nth__2;
  _nth.cljs$lang$arity$3 = _nth__3;
  return _nth
}();
cljs.core.ASeq = {};
cljs.core.ISeq = {};
cljs.core._first = function _first(coll) {
  if(function() {
    var and__3822__auto____13806 = coll;
    if(and__3822__auto____13806) {
      return coll.cljs$core$ISeq$_first$arity$1
    }else {
      return and__3822__auto____13806
    }
  }()) {
    return coll.cljs$core$ISeq$_first$arity$1(coll)
  }else {
    var x__2363__auto____13807 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____13808 = cljs.core._first[goog.typeOf(x__2363__auto____13807)];
      if(or__3824__auto____13808) {
        return or__3824__auto____13808
      }else {
        var or__3824__auto____13809 = cljs.core._first["_"];
        if(or__3824__auto____13809) {
          return or__3824__auto____13809
        }else {
          throw cljs.core.missing_protocol.call(null, "ISeq.-first", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core._rest = function _rest(coll) {
  if(function() {
    var and__3822__auto____13814 = coll;
    if(and__3822__auto____13814) {
      return coll.cljs$core$ISeq$_rest$arity$1
    }else {
      return and__3822__auto____13814
    }
  }()) {
    return coll.cljs$core$ISeq$_rest$arity$1(coll)
  }else {
    var x__2363__auto____13815 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____13816 = cljs.core._rest[goog.typeOf(x__2363__auto____13815)];
      if(or__3824__auto____13816) {
        return or__3824__auto____13816
      }else {
        var or__3824__auto____13817 = cljs.core._rest["_"];
        if(or__3824__auto____13817) {
          return or__3824__auto____13817
        }else {
          throw cljs.core.missing_protocol.call(null, "ISeq.-rest", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.INext = {};
cljs.core._next = function _next(coll) {
  if(function() {
    var and__3822__auto____13822 = coll;
    if(and__3822__auto____13822) {
      return coll.cljs$core$INext$_next$arity$1
    }else {
      return and__3822__auto____13822
    }
  }()) {
    return coll.cljs$core$INext$_next$arity$1(coll)
  }else {
    var x__2363__auto____13823 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____13824 = cljs.core._next[goog.typeOf(x__2363__auto____13823)];
      if(or__3824__auto____13824) {
        return or__3824__auto____13824
      }else {
        var or__3824__auto____13825 = cljs.core._next["_"];
        if(or__3824__auto____13825) {
          return or__3824__auto____13825
        }else {
          throw cljs.core.missing_protocol.call(null, "INext.-next", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.ILookup = {};
cljs.core._lookup = function() {
  var _lookup = null;
  var _lookup__2 = function(o, k) {
    if(function() {
      var and__3822__auto____13834 = o;
      if(and__3822__auto____13834) {
        return o.cljs$core$ILookup$_lookup$arity$2
      }else {
        return and__3822__auto____13834
      }
    }()) {
      return o.cljs$core$ILookup$_lookup$arity$2(o, k)
    }else {
      var x__2363__auto____13835 = o == null ? null : o;
      return function() {
        var or__3824__auto____13836 = cljs.core._lookup[goog.typeOf(x__2363__auto____13835)];
        if(or__3824__auto____13836) {
          return or__3824__auto____13836
        }else {
          var or__3824__auto____13837 = cljs.core._lookup["_"];
          if(or__3824__auto____13837) {
            return or__3824__auto____13837
          }else {
            throw cljs.core.missing_protocol.call(null, "ILookup.-lookup", o);
          }
        }
      }().call(null, o, k)
    }
  };
  var _lookup__3 = function(o, k, not_found) {
    if(function() {
      var and__3822__auto____13838 = o;
      if(and__3822__auto____13838) {
        return o.cljs$core$ILookup$_lookup$arity$3
      }else {
        return and__3822__auto____13838
      }
    }()) {
      return o.cljs$core$ILookup$_lookup$arity$3(o, k, not_found)
    }else {
      var x__2363__auto____13839 = o == null ? null : o;
      return function() {
        var or__3824__auto____13840 = cljs.core._lookup[goog.typeOf(x__2363__auto____13839)];
        if(or__3824__auto____13840) {
          return or__3824__auto____13840
        }else {
          var or__3824__auto____13841 = cljs.core._lookup["_"];
          if(or__3824__auto____13841) {
            return or__3824__auto____13841
          }else {
            throw cljs.core.missing_protocol.call(null, "ILookup.-lookup", o);
          }
        }
      }().call(null, o, k, not_found)
    }
  };
  _lookup = function(o, k, not_found) {
    switch(arguments.length) {
      case 2:
        return _lookup__2.call(this, o, k);
      case 3:
        return _lookup__3.call(this, o, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  _lookup.cljs$lang$arity$2 = _lookup__2;
  _lookup.cljs$lang$arity$3 = _lookup__3;
  return _lookup
}();
cljs.core.IAssociative = {};
cljs.core._contains_key_QMARK_ = function _contains_key_QMARK_(coll, k) {
  if(function() {
    var and__3822__auto____13846 = coll;
    if(and__3822__auto____13846) {
      return coll.cljs$core$IAssociative$_contains_key_QMARK_$arity$2
    }else {
      return and__3822__auto____13846
    }
  }()) {
    return coll.cljs$core$IAssociative$_contains_key_QMARK_$arity$2(coll, k)
  }else {
    var x__2363__auto____13847 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____13848 = cljs.core._contains_key_QMARK_[goog.typeOf(x__2363__auto____13847)];
      if(or__3824__auto____13848) {
        return or__3824__auto____13848
      }else {
        var or__3824__auto____13849 = cljs.core._contains_key_QMARK_["_"];
        if(or__3824__auto____13849) {
          return or__3824__auto____13849
        }else {
          throw cljs.core.missing_protocol.call(null, "IAssociative.-contains-key?", coll);
        }
      }
    }().call(null, coll, k)
  }
};
cljs.core._assoc = function _assoc(coll, k, v) {
  if(function() {
    var and__3822__auto____13854 = coll;
    if(and__3822__auto____13854) {
      return coll.cljs$core$IAssociative$_assoc$arity$3
    }else {
      return and__3822__auto____13854
    }
  }()) {
    return coll.cljs$core$IAssociative$_assoc$arity$3(coll, k, v)
  }else {
    var x__2363__auto____13855 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____13856 = cljs.core._assoc[goog.typeOf(x__2363__auto____13855)];
      if(or__3824__auto____13856) {
        return or__3824__auto____13856
      }else {
        var or__3824__auto____13857 = cljs.core._assoc["_"];
        if(or__3824__auto____13857) {
          return or__3824__auto____13857
        }else {
          throw cljs.core.missing_protocol.call(null, "IAssociative.-assoc", coll);
        }
      }
    }().call(null, coll, k, v)
  }
};
cljs.core.IMap = {};
cljs.core._dissoc = function _dissoc(coll, k) {
  if(function() {
    var and__3822__auto____13862 = coll;
    if(and__3822__auto____13862) {
      return coll.cljs$core$IMap$_dissoc$arity$2
    }else {
      return and__3822__auto____13862
    }
  }()) {
    return coll.cljs$core$IMap$_dissoc$arity$2(coll, k)
  }else {
    var x__2363__auto____13863 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____13864 = cljs.core._dissoc[goog.typeOf(x__2363__auto____13863)];
      if(or__3824__auto____13864) {
        return or__3824__auto____13864
      }else {
        var or__3824__auto____13865 = cljs.core._dissoc["_"];
        if(or__3824__auto____13865) {
          return or__3824__auto____13865
        }else {
          throw cljs.core.missing_protocol.call(null, "IMap.-dissoc", coll);
        }
      }
    }().call(null, coll, k)
  }
};
cljs.core.IMapEntry = {};
cljs.core._key = function _key(coll) {
  if(function() {
    var and__3822__auto____13870 = coll;
    if(and__3822__auto____13870) {
      return coll.cljs$core$IMapEntry$_key$arity$1
    }else {
      return and__3822__auto____13870
    }
  }()) {
    return coll.cljs$core$IMapEntry$_key$arity$1(coll)
  }else {
    var x__2363__auto____13871 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____13872 = cljs.core._key[goog.typeOf(x__2363__auto____13871)];
      if(or__3824__auto____13872) {
        return or__3824__auto____13872
      }else {
        var or__3824__auto____13873 = cljs.core._key["_"];
        if(or__3824__auto____13873) {
          return or__3824__auto____13873
        }else {
          throw cljs.core.missing_protocol.call(null, "IMapEntry.-key", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core._val = function _val(coll) {
  if(function() {
    var and__3822__auto____13878 = coll;
    if(and__3822__auto____13878) {
      return coll.cljs$core$IMapEntry$_val$arity$1
    }else {
      return and__3822__auto____13878
    }
  }()) {
    return coll.cljs$core$IMapEntry$_val$arity$1(coll)
  }else {
    var x__2363__auto____13879 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____13880 = cljs.core._val[goog.typeOf(x__2363__auto____13879)];
      if(or__3824__auto____13880) {
        return or__3824__auto____13880
      }else {
        var or__3824__auto____13881 = cljs.core._val["_"];
        if(or__3824__auto____13881) {
          return or__3824__auto____13881
        }else {
          throw cljs.core.missing_protocol.call(null, "IMapEntry.-val", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.ISet = {};
cljs.core._disjoin = function _disjoin(coll, v) {
  if(function() {
    var and__3822__auto____13886 = coll;
    if(and__3822__auto____13886) {
      return coll.cljs$core$ISet$_disjoin$arity$2
    }else {
      return and__3822__auto____13886
    }
  }()) {
    return coll.cljs$core$ISet$_disjoin$arity$2(coll, v)
  }else {
    var x__2363__auto____13887 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____13888 = cljs.core._disjoin[goog.typeOf(x__2363__auto____13887)];
      if(or__3824__auto____13888) {
        return or__3824__auto____13888
      }else {
        var or__3824__auto____13889 = cljs.core._disjoin["_"];
        if(or__3824__auto____13889) {
          return or__3824__auto____13889
        }else {
          throw cljs.core.missing_protocol.call(null, "ISet.-disjoin", coll);
        }
      }
    }().call(null, coll, v)
  }
};
cljs.core.IStack = {};
cljs.core._peek = function _peek(coll) {
  if(function() {
    var and__3822__auto____13894 = coll;
    if(and__3822__auto____13894) {
      return coll.cljs$core$IStack$_peek$arity$1
    }else {
      return and__3822__auto____13894
    }
  }()) {
    return coll.cljs$core$IStack$_peek$arity$1(coll)
  }else {
    var x__2363__auto____13895 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____13896 = cljs.core._peek[goog.typeOf(x__2363__auto____13895)];
      if(or__3824__auto____13896) {
        return or__3824__auto____13896
      }else {
        var or__3824__auto____13897 = cljs.core._peek["_"];
        if(or__3824__auto____13897) {
          return or__3824__auto____13897
        }else {
          throw cljs.core.missing_protocol.call(null, "IStack.-peek", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core._pop = function _pop(coll) {
  if(function() {
    var and__3822__auto____13902 = coll;
    if(and__3822__auto____13902) {
      return coll.cljs$core$IStack$_pop$arity$1
    }else {
      return and__3822__auto____13902
    }
  }()) {
    return coll.cljs$core$IStack$_pop$arity$1(coll)
  }else {
    var x__2363__auto____13903 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____13904 = cljs.core._pop[goog.typeOf(x__2363__auto____13903)];
      if(or__3824__auto____13904) {
        return or__3824__auto____13904
      }else {
        var or__3824__auto____13905 = cljs.core._pop["_"];
        if(or__3824__auto____13905) {
          return or__3824__auto____13905
        }else {
          throw cljs.core.missing_protocol.call(null, "IStack.-pop", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.IVector = {};
cljs.core._assoc_n = function _assoc_n(coll, n, val) {
  if(function() {
    var and__3822__auto____13910 = coll;
    if(and__3822__auto____13910) {
      return coll.cljs$core$IVector$_assoc_n$arity$3
    }else {
      return and__3822__auto____13910
    }
  }()) {
    return coll.cljs$core$IVector$_assoc_n$arity$3(coll, n, val)
  }else {
    var x__2363__auto____13911 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____13912 = cljs.core._assoc_n[goog.typeOf(x__2363__auto____13911)];
      if(or__3824__auto____13912) {
        return or__3824__auto____13912
      }else {
        var or__3824__auto____13913 = cljs.core._assoc_n["_"];
        if(or__3824__auto____13913) {
          return or__3824__auto____13913
        }else {
          throw cljs.core.missing_protocol.call(null, "IVector.-assoc-n", coll);
        }
      }
    }().call(null, coll, n, val)
  }
};
cljs.core.IDeref = {};
cljs.core._deref = function _deref(o) {
  if(function() {
    var and__3822__auto____13918 = o;
    if(and__3822__auto____13918) {
      return o.cljs$core$IDeref$_deref$arity$1
    }else {
      return and__3822__auto____13918
    }
  }()) {
    return o.cljs$core$IDeref$_deref$arity$1(o)
  }else {
    var x__2363__auto____13919 = o == null ? null : o;
    return function() {
      var or__3824__auto____13920 = cljs.core._deref[goog.typeOf(x__2363__auto____13919)];
      if(or__3824__auto____13920) {
        return or__3824__auto____13920
      }else {
        var or__3824__auto____13921 = cljs.core._deref["_"];
        if(or__3824__auto____13921) {
          return or__3824__auto____13921
        }else {
          throw cljs.core.missing_protocol.call(null, "IDeref.-deref", o);
        }
      }
    }().call(null, o)
  }
};
cljs.core.IDerefWithTimeout = {};
cljs.core._deref_with_timeout = function _deref_with_timeout(o, msec, timeout_val) {
  if(function() {
    var and__3822__auto____13926 = o;
    if(and__3822__auto____13926) {
      return o.cljs$core$IDerefWithTimeout$_deref_with_timeout$arity$3
    }else {
      return and__3822__auto____13926
    }
  }()) {
    return o.cljs$core$IDerefWithTimeout$_deref_with_timeout$arity$3(o, msec, timeout_val)
  }else {
    var x__2363__auto____13927 = o == null ? null : o;
    return function() {
      var or__3824__auto____13928 = cljs.core._deref_with_timeout[goog.typeOf(x__2363__auto____13927)];
      if(or__3824__auto____13928) {
        return or__3824__auto____13928
      }else {
        var or__3824__auto____13929 = cljs.core._deref_with_timeout["_"];
        if(or__3824__auto____13929) {
          return or__3824__auto____13929
        }else {
          throw cljs.core.missing_protocol.call(null, "IDerefWithTimeout.-deref-with-timeout", o);
        }
      }
    }().call(null, o, msec, timeout_val)
  }
};
cljs.core.IMeta = {};
cljs.core._meta = function _meta(o) {
  if(function() {
    var and__3822__auto____13934 = o;
    if(and__3822__auto____13934) {
      return o.cljs$core$IMeta$_meta$arity$1
    }else {
      return and__3822__auto____13934
    }
  }()) {
    return o.cljs$core$IMeta$_meta$arity$1(o)
  }else {
    var x__2363__auto____13935 = o == null ? null : o;
    return function() {
      var or__3824__auto____13936 = cljs.core._meta[goog.typeOf(x__2363__auto____13935)];
      if(or__3824__auto____13936) {
        return or__3824__auto____13936
      }else {
        var or__3824__auto____13937 = cljs.core._meta["_"];
        if(or__3824__auto____13937) {
          return or__3824__auto____13937
        }else {
          throw cljs.core.missing_protocol.call(null, "IMeta.-meta", o);
        }
      }
    }().call(null, o)
  }
};
cljs.core.IWithMeta = {};
cljs.core._with_meta = function _with_meta(o, meta) {
  if(function() {
    var and__3822__auto____13942 = o;
    if(and__3822__auto____13942) {
      return o.cljs$core$IWithMeta$_with_meta$arity$2
    }else {
      return and__3822__auto____13942
    }
  }()) {
    return o.cljs$core$IWithMeta$_with_meta$arity$2(o, meta)
  }else {
    var x__2363__auto____13943 = o == null ? null : o;
    return function() {
      var or__3824__auto____13944 = cljs.core._with_meta[goog.typeOf(x__2363__auto____13943)];
      if(or__3824__auto____13944) {
        return or__3824__auto____13944
      }else {
        var or__3824__auto____13945 = cljs.core._with_meta["_"];
        if(or__3824__auto____13945) {
          return or__3824__auto____13945
        }else {
          throw cljs.core.missing_protocol.call(null, "IWithMeta.-with-meta", o);
        }
      }
    }().call(null, o, meta)
  }
};
cljs.core.IReduce = {};
cljs.core._reduce = function() {
  var _reduce = null;
  var _reduce__2 = function(coll, f) {
    if(function() {
      var and__3822__auto____13954 = coll;
      if(and__3822__auto____13954) {
        return coll.cljs$core$IReduce$_reduce$arity$2
      }else {
        return and__3822__auto____13954
      }
    }()) {
      return coll.cljs$core$IReduce$_reduce$arity$2(coll, f)
    }else {
      var x__2363__auto____13955 = coll == null ? null : coll;
      return function() {
        var or__3824__auto____13956 = cljs.core._reduce[goog.typeOf(x__2363__auto____13955)];
        if(or__3824__auto____13956) {
          return or__3824__auto____13956
        }else {
          var or__3824__auto____13957 = cljs.core._reduce["_"];
          if(or__3824__auto____13957) {
            return or__3824__auto____13957
          }else {
            throw cljs.core.missing_protocol.call(null, "IReduce.-reduce", coll);
          }
        }
      }().call(null, coll, f)
    }
  };
  var _reduce__3 = function(coll, f, start) {
    if(function() {
      var and__3822__auto____13958 = coll;
      if(and__3822__auto____13958) {
        return coll.cljs$core$IReduce$_reduce$arity$3
      }else {
        return and__3822__auto____13958
      }
    }()) {
      return coll.cljs$core$IReduce$_reduce$arity$3(coll, f, start)
    }else {
      var x__2363__auto____13959 = coll == null ? null : coll;
      return function() {
        var or__3824__auto____13960 = cljs.core._reduce[goog.typeOf(x__2363__auto____13959)];
        if(or__3824__auto____13960) {
          return or__3824__auto____13960
        }else {
          var or__3824__auto____13961 = cljs.core._reduce["_"];
          if(or__3824__auto____13961) {
            return or__3824__auto____13961
          }else {
            throw cljs.core.missing_protocol.call(null, "IReduce.-reduce", coll);
          }
        }
      }().call(null, coll, f, start)
    }
  };
  _reduce = function(coll, f, start) {
    switch(arguments.length) {
      case 2:
        return _reduce__2.call(this, coll, f);
      case 3:
        return _reduce__3.call(this, coll, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  _reduce.cljs$lang$arity$2 = _reduce__2;
  _reduce.cljs$lang$arity$3 = _reduce__3;
  return _reduce
}();
cljs.core.IKVReduce = {};
cljs.core._kv_reduce = function _kv_reduce(coll, f, init) {
  if(function() {
    var and__3822__auto____13966 = coll;
    if(and__3822__auto____13966) {
      return coll.cljs$core$IKVReduce$_kv_reduce$arity$3
    }else {
      return and__3822__auto____13966
    }
  }()) {
    return coll.cljs$core$IKVReduce$_kv_reduce$arity$3(coll, f, init)
  }else {
    var x__2363__auto____13967 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____13968 = cljs.core._kv_reduce[goog.typeOf(x__2363__auto____13967)];
      if(or__3824__auto____13968) {
        return or__3824__auto____13968
      }else {
        var or__3824__auto____13969 = cljs.core._kv_reduce["_"];
        if(or__3824__auto____13969) {
          return or__3824__auto____13969
        }else {
          throw cljs.core.missing_protocol.call(null, "IKVReduce.-kv-reduce", coll);
        }
      }
    }().call(null, coll, f, init)
  }
};
cljs.core.IEquiv = {};
cljs.core._equiv = function _equiv(o, other) {
  if(function() {
    var and__3822__auto____13974 = o;
    if(and__3822__auto____13974) {
      return o.cljs$core$IEquiv$_equiv$arity$2
    }else {
      return and__3822__auto____13974
    }
  }()) {
    return o.cljs$core$IEquiv$_equiv$arity$2(o, other)
  }else {
    var x__2363__auto____13975 = o == null ? null : o;
    return function() {
      var or__3824__auto____13976 = cljs.core._equiv[goog.typeOf(x__2363__auto____13975)];
      if(or__3824__auto____13976) {
        return or__3824__auto____13976
      }else {
        var or__3824__auto____13977 = cljs.core._equiv["_"];
        if(or__3824__auto____13977) {
          return or__3824__auto____13977
        }else {
          throw cljs.core.missing_protocol.call(null, "IEquiv.-equiv", o);
        }
      }
    }().call(null, o, other)
  }
};
cljs.core.IHash = {};
cljs.core._hash = function _hash(o) {
  if(function() {
    var and__3822__auto____13982 = o;
    if(and__3822__auto____13982) {
      return o.cljs$core$IHash$_hash$arity$1
    }else {
      return and__3822__auto____13982
    }
  }()) {
    return o.cljs$core$IHash$_hash$arity$1(o)
  }else {
    var x__2363__auto____13983 = o == null ? null : o;
    return function() {
      var or__3824__auto____13984 = cljs.core._hash[goog.typeOf(x__2363__auto____13983)];
      if(or__3824__auto____13984) {
        return or__3824__auto____13984
      }else {
        var or__3824__auto____13985 = cljs.core._hash["_"];
        if(or__3824__auto____13985) {
          return or__3824__auto____13985
        }else {
          throw cljs.core.missing_protocol.call(null, "IHash.-hash", o);
        }
      }
    }().call(null, o)
  }
};
cljs.core.ISeqable = {};
cljs.core._seq = function _seq(o) {
  if(function() {
    var and__3822__auto____13990 = o;
    if(and__3822__auto____13990) {
      return o.cljs$core$ISeqable$_seq$arity$1
    }else {
      return and__3822__auto____13990
    }
  }()) {
    return o.cljs$core$ISeqable$_seq$arity$1(o)
  }else {
    var x__2363__auto____13991 = o == null ? null : o;
    return function() {
      var or__3824__auto____13992 = cljs.core._seq[goog.typeOf(x__2363__auto____13991)];
      if(or__3824__auto____13992) {
        return or__3824__auto____13992
      }else {
        var or__3824__auto____13993 = cljs.core._seq["_"];
        if(or__3824__auto____13993) {
          return or__3824__auto____13993
        }else {
          throw cljs.core.missing_protocol.call(null, "ISeqable.-seq", o);
        }
      }
    }().call(null, o)
  }
};
cljs.core.ISequential = {};
cljs.core.IList = {};
cljs.core.IRecord = {};
cljs.core.IReversible = {};
cljs.core._rseq = function _rseq(coll) {
  if(function() {
    var and__3822__auto____13998 = coll;
    if(and__3822__auto____13998) {
      return coll.cljs$core$IReversible$_rseq$arity$1
    }else {
      return and__3822__auto____13998
    }
  }()) {
    return coll.cljs$core$IReversible$_rseq$arity$1(coll)
  }else {
    var x__2363__auto____13999 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____14000 = cljs.core._rseq[goog.typeOf(x__2363__auto____13999)];
      if(or__3824__auto____14000) {
        return or__3824__auto____14000
      }else {
        var or__3824__auto____14001 = cljs.core._rseq["_"];
        if(or__3824__auto____14001) {
          return or__3824__auto____14001
        }else {
          throw cljs.core.missing_protocol.call(null, "IReversible.-rseq", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.ISorted = {};
cljs.core._sorted_seq = function _sorted_seq(coll, ascending_QMARK_) {
  if(function() {
    var and__3822__auto____14006 = coll;
    if(and__3822__auto____14006) {
      return coll.cljs$core$ISorted$_sorted_seq$arity$2
    }else {
      return and__3822__auto____14006
    }
  }()) {
    return coll.cljs$core$ISorted$_sorted_seq$arity$2(coll, ascending_QMARK_)
  }else {
    var x__2363__auto____14007 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____14008 = cljs.core._sorted_seq[goog.typeOf(x__2363__auto____14007)];
      if(or__3824__auto____14008) {
        return or__3824__auto____14008
      }else {
        var or__3824__auto____14009 = cljs.core._sorted_seq["_"];
        if(or__3824__auto____14009) {
          return or__3824__auto____14009
        }else {
          throw cljs.core.missing_protocol.call(null, "ISorted.-sorted-seq", coll);
        }
      }
    }().call(null, coll, ascending_QMARK_)
  }
};
cljs.core._sorted_seq_from = function _sorted_seq_from(coll, k, ascending_QMARK_) {
  if(function() {
    var and__3822__auto____14014 = coll;
    if(and__3822__auto____14014) {
      return coll.cljs$core$ISorted$_sorted_seq_from$arity$3
    }else {
      return and__3822__auto____14014
    }
  }()) {
    return coll.cljs$core$ISorted$_sorted_seq_from$arity$3(coll, k, ascending_QMARK_)
  }else {
    var x__2363__auto____14015 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____14016 = cljs.core._sorted_seq_from[goog.typeOf(x__2363__auto____14015)];
      if(or__3824__auto____14016) {
        return or__3824__auto____14016
      }else {
        var or__3824__auto____14017 = cljs.core._sorted_seq_from["_"];
        if(or__3824__auto____14017) {
          return or__3824__auto____14017
        }else {
          throw cljs.core.missing_protocol.call(null, "ISorted.-sorted-seq-from", coll);
        }
      }
    }().call(null, coll, k, ascending_QMARK_)
  }
};
cljs.core._entry_key = function _entry_key(coll, entry) {
  if(function() {
    var and__3822__auto____14022 = coll;
    if(and__3822__auto____14022) {
      return coll.cljs$core$ISorted$_entry_key$arity$2
    }else {
      return and__3822__auto____14022
    }
  }()) {
    return coll.cljs$core$ISorted$_entry_key$arity$2(coll, entry)
  }else {
    var x__2363__auto____14023 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____14024 = cljs.core._entry_key[goog.typeOf(x__2363__auto____14023)];
      if(or__3824__auto____14024) {
        return or__3824__auto____14024
      }else {
        var or__3824__auto____14025 = cljs.core._entry_key["_"];
        if(or__3824__auto____14025) {
          return or__3824__auto____14025
        }else {
          throw cljs.core.missing_protocol.call(null, "ISorted.-entry-key", coll);
        }
      }
    }().call(null, coll, entry)
  }
};
cljs.core._comparator = function _comparator(coll) {
  if(function() {
    var and__3822__auto____14030 = coll;
    if(and__3822__auto____14030) {
      return coll.cljs$core$ISorted$_comparator$arity$1
    }else {
      return and__3822__auto____14030
    }
  }()) {
    return coll.cljs$core$ISorted$_comparator$arity$1(coll)
  }else {
    var x__2363__auto____14031 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____14032 = cljs.core._comparator[goog.typeOf(x__2363__auto____14031)];
      if(or__3824__auto____14032) {
        return or__3824__auto____14032
      }else {
        var or__3824__auto____14033 = cljs.core._comparator["_"];
        if(or__3824__auto____14033) {
          return or__3824__auto____14033
        }else {
          throw cljs.core.missing_protocol.call(null, "ISorted.-comparator", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.IPrintable = {};
cljs.core._pr_seq = function _pr_seq(o, opts) {
  if(function() {
    var and__3822__auto____14038 = o;
    if(and__3822__auto____14038) {
      return o.cljs$core$IPrintable$_pr_seq$arity$2
    }else {
      return and__3822__auto____14038
    }
  }()) {
    return o.cljs$core$IPrintable$_pr_seq$arity$2(o, opts)
  }else {
    var x__2363__auto____14039 = o == null ? null : o;
    return function() {
      var or__3824__auto____14040 = cljs.core._pr_seq[goog.typeOf(x__2363__auto____14039)];
      if(or__3824__auto____14040) {
        return or__3824__auto____14040
      }else {
        var or__3824__auto____14041 = cljs.core._pr_seq["_"];
        if(or__3824__auto____14041) {
          return or__3824__auto____14041
        }else {
          throw cljs.core.missing_protocol.call(null, "IPrintable.-pr-seq", o);
        }
      }
    }().call(null, o, opts)
  }
};
cljs.core.IPending = {};
cljs.core._realized_QMARK_ = function _realized_QMARK_(d) {
  if(function() {
    var and__3822__auto____14046 = d;
    if(and__3822__auto____14046) {
      return d.cljs$core$IPending$_realized_QMARK_$arity$1
    }else {
      return and__3822__auto____14046
    }
  }()) {
    return d.cljs$core$IPending$_realized_QMARK_$arity$1(d)
  }else {
    var x__2363__auto____14047 = d == null ? null : d;
    return function() {
      var or__3824__auto____14048 = cljs.core._realized_QMARK_[goog.typeOf(x__2363__auto____14047)];
      if(or__3824__auto____14048) {
        return or__3824__auto____14048
      }else {
        var or__3824__auto____14049 = cljs.core._realized_QMARK_["_"];
        if(or__3824__auto____14049) {
          return or__3824__auto____14049
        }else {
          throw cljs.core.missing_protocol.call(null, "IPending.-realized?", d);
        }
      }
    }().call(null, d)
  }
};
cljs.core.IWatchable = {};
cljs.core._notify_watches = function _notify_watches(this$, oldval, newval) {
  if(function() {
    var and__3822__auto____14054 = this$;
    if(and__3822__auto____14054) {
      return this$.cljs$core$IWatchable$_notify_watches$arity$3
    }else {
      return and__3822__auto____14054
    }
  }()) {
    return this$.cljs$core$IWatchable$_notify_watches$arity$3(this$, oldval, newval)
  }else {
    var x__2363__auto____14055 = this$ == null ? null : this$;
    return function() {
      var or__3824__auto____14056 = cljs.core._notify_watches[goog.typeOf(x__2363__auto____14055)];
      if(or__3824__auto____14056) {
        return or__3824__auto____14056
      }else {
        var or__3824__auto____14057 = cljs.core._notify_watches["_"];
        if(or__3824__auto____14057) {
          return or__3824__auto____14057
        }else {
          throw cljs.core.missing_protocol.call(null, "IWatchable.-notify-watches", this$);
        }
      }
    }().call(null, this$, oldval, newval)
  }
};
cljs.core._add_watch = function _add_watch(this$, key, f) {
  if(function() {
    var and__3822__auto____14062 = this$;
    if(and__3822__auto____14062) {
      return this$.cljs$core$IWatchable$_add_watch$arity$3
    }else {
      return and__3822__auto____14062
    }
  }()) {
    return this$.cljs$core$IWatchable$_add_watch$arity$3(this$, key, f)
  }else {
    var x__2363__auto____14063 = this$ == null ? null : this$;
    return function() {
      var or__3824__auto____14064 = cljs.core._add_watch[goog.typeOf(x__2363__auto____14063)];
      if(or__3824__auto____14064) {
        return or__3824__auto____14064
      }else {
        var or__3824__auto____14065 = cljs.core._add_watch["_"];
        if(or__3824__auto____14065) {
          return or__3824__auto____14065
        }else {
          throw cljs.core.missing_protocol.call(null, "IWatchable.-add-watch", this$);
        }
      }
    }().call(null, this$, key, f)
  }
};
cljs.core._remove_watch = function _remove_watch(this$, key) {
  if(function() {
    var and__3822__auto____14070 = this$;
    if(and__3822__auto____14070) {
      return this$.cljs$core$IWatchable$_remove_watch$arity$2
    }else {
      return and__3822__auto____14070
    }
  }()) {
    return this$.cljs$core$IWatchable$_remove_watch$arity$2(this$, key)
  }else {
    var x__2363__auto____14071 = this$ == null ? null : this$;
    return function() {
      var or__3824__auto____14072 = cljs.core._remove_watch[goog.typeOf(x__2363__auto____14071)];
      if(or__3824__auto____14072) {
        return or__3824__auto____14072
      }else {
        var or__3824__auto____14073 = cljs.core._remove_watch["_"];
        if(or__3824__auto____14073) {
          return or__3824__auto____14073
        }else {
          throw cljs.core.missing_protocol.call(null, "IWatchable.-remove-watch", this$);
        }
      }
    }().call(null, this$, key)
  }
};
cljs.core.IEditableCollection = {};
cljs.core._as_transient = function _as_transient(coll) {
  if(function() {
    var and__3822__auto____14078 = coll;
    if(and__3822__auto____14078) {
      return coll.cljs$core$IEditableCollection$_as_transient$arity$1
    }else {
      return and__3822__auto____14078
    }
  }()) {
    return coll.cljs$core$IEditableCollection$_as_transient$arity$1(coll)
  }else {
    var x__2363__auto____14079 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____14080 = cljs.core._as_transient[goog.typeOf(x__2363__auto____14079)];
      if(or__3824__auto____14080) {
        return or__3824__auto____14080
      }else {
        var or__3824__auto____14081 = cljs.core._as_transient["_"];
        if(or__3824__auto____14081) {
          return or__3824__auto____14081
        }else {
          throw cljs.core.missing_protocol.call(null, "IEditableCollection.-as-transient", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.ITransientCollection = {};
cljs.core._conj_BANG_ = function _conj_BANG_(tcoll, val) {
  if(function() {
    var and__3822__auto____14086 = tcoll;
    if(and__3822__auto____14086) {
      return tcoll.cljs$core$ITransientCollection$_conj_BANG_$arity$2
    }else {
      return and__3822__auto____14086
    }
  }()) {
    return tcoll.cljs$core$ITransientCollection$_conj_BANG_$arity$2(tcoll, val)
  }else {
    var x__2363__auto____14087 = tcoll == null ? null : tcoll;
    return function() {
      var or__3824__auto____14088 = cljs.core._conj_BANG_[goog.typeOf(x__2363__auto____14087)];
      if(or__3824__auto____14088) {
        return or__3824__auto____14088
      }else {
        var or__3824__auto____14089 = cljs.core._conj_BANG_["_"];
        if(or__3824__auto____14089) {
          return or__3824__auto____14089
        }else {
          throw cljs.core.missing_protocol.call(null, "ITransientCollection.-conj!", tcoll);
        }
      }
    }().call(null, tcoll, val)
  }
};
cljs.core._persistent_BANG_ = function _persistent_BANG_(tcoll) {
  if(function() {
    var and__3822__auto____14094 = tcoll;
    if(and__3822__auto____14094) {
      return tcoll.cljs$core$ITransientCollection$_persistent_BANG_$arity$1
    }else {
      return and__3822__auto____14094
    }
  }()) {
    return tcoll.cljs$core$ITransientCollection$_persistent_BANG_$arity$1(tcoll)
  }else {
    var x__2363__auto____14095 = tcoll == null ? null : tcoll;
    return function() {
      var or__3824__auto____14096 = cljs.core._persistent_BANG_[goog.typeOf(x__2363__auto____14095)];
      if(or__3824__auto____14096) {
        return or__3824__auto____14096
      }else {
        var or__3824__auto____14097 = cljs.core._persistent_BANG_["_"];
        if(or__3824__auto____14097) {
          return or__3824__auto____14097
        }else {
          throw cljs.core.missing_protocol.call(null, "ITransientCollection.-persistent!", tcoll);
        }
      }
    }().call(null, tcoll)
  }
};
cljs.core.ITransientAssociative = {};
cljs.core._assoc_BANG_ = function _assoc_BANG_(tcoll, key, val) {
  if(function() {
    var and__3822__auto____14102 = tcoll;
    if(and__3822__auto____14102) {
      return tcoll.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3
    }else {
      return and__3822__auto____14102
    }
  }()) {
    return tcoll.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3(tcoll, key, val)
  }else {
    var x__2363__auto____14103 = tcoll == null ? null : tcoll;
    return function() {
      var or__3824__auto____14104 = cljs.core._assoc_BANG_[goog.typeOf(x__2363__auto____14103)];
      if(or__3824__auto____14104) {
        return or__3824__auto____14104
      }else {
        var or__3824__auto____14105 = cljs.core._assoc_BANG_["_"];
        if(or__3824__auto____14105) {
          return or__3824__auto____14105
        }else {
          throw cljs.core.missing_protocol.call(null, "ITransientAssociative.-assoc!", tcoll);
        }
      }
    }().call(null, tcoll, key, val)
  }
};
cljs.core.ITransientMap = {};
cljs.core._dissoc_BANG_ = function _dissoc_BANG_(tcoll, key) {
  if(function() {
    var and__3822__auto____14110 = tcoll;
    if(and__3822__auto____14110) {
      return tcoll.cljs$core$ITransientMap$_dissoc_BANG_$arity$2
    }else {
      return and__3822__auto____14110
    }
  }()) {
    return tcoll.cljs$core$ITransientMap$_dissoc_BANG_$arity$2(tcoll, key)
  }else {
    var x__2363__auto____14111 = tcoll == null ? null : tcoll;
    return function() {
      var or__3824__auto____14112 = cljs.core._dissoc_BANG_[goog.typeOf(x__2363__auto____14111)];
      if(or__3824__auto____14112) {
        return or__3824__auto____14112
      }else {
        var or__3824__auto____14113 = cljs.core._dissoc_BANG_["_"];
        if(or__3824__auto____14113) {
          return or__3824__auto____14113
        }else {
          throw cljs.core.missing_protocol.call(null, "ITransientMap.-dissoc!", tcoll);
        }
      }
    }().call(null, tcoll, key)
  }
};
cljs.core.ITransientVector = {};
cljs.core._assoc_n_BANG_ = function _assoc_n_BANG_(tcoll, n, val) {
  if(function() {
    var and__3822__auto____14118 = tcoll;
    if(and__3822__auto____14118) {
      return tcoll.cljs$core$ITransientVector$_assoc_n_BANG_$arity$3
    }else {
      return and__3822__auto____14118
    }
  }()) {
    return tcoll.cljs$core$ITransientVector$_assoc_n_BANG_$arity$3(tcoll, n, val)
  }else {
    var x__2363__auto____14119 = tcoll == null ? null : tcoll;
    return function() {
      var or__3824__auto____14120 = cljs.core._assoc_n_BANG_[goog.typeOf(x__2363__auto____14119)];
      if(or__3824__auto____14120) {
        return or__3824__auto____14120
      }else {
        var or__3824__auto____14121 = cljs.core._assoc_n_BANG_["_"];
        if(or__3824__auto____14121) {
          return or__3824__auto____14121
        }else {
          throw cljs.core.missing_protocol.call(null, "ITransientVector.-assoc-n!", tcoll);
        }
      }
    }().call(null, tcoll, n, val)
  }
};
cljs.core._pop_BANG_ = function _pop_BANG_(tcoll) {
  if(function() {
    var and__3822__auto____14126 = tcoll;
    if(and__3822__auto____14126) {
      return tcoll.cljs$core$ITransientVector$_pop_BANG_$arity$1
    }else {
      return and__3822__auto____14126
    }
  }()) {
    return tcoll.cljs$core$ITransientVector$_pop_BANG_$arity$1(tcoll)
  }else {
    var x__2363__auto____14127 = tcoll == null ? null : tcoll;
    return function() {
      var or__3824__auto____14128 = cljs.core._pop_BANG_[goog.typeOf(x__2363__auto____14127)];
      if(or__3824__auto____14128) {
        return or__3824__auto____14128
      }else {
        var or__3824__auto____14129 = cljs.core._pop_BANG_["_"];
        if(or__3824__auto____14129) {
          return or__3824__auto____14129
        }else {
          throw cljs.core.missing_protocol.call(null, "ITransientVector.-pop!", tcoll);
        }
      }
    }().call(null, tcoll)
  }
};
cljs.core.ITransientSet = {};
cljs.core._disjoin_BANG_ = function _disjoin_BANG_(tcoll, v) {
  if(function() {
    var and__3822__auto____14134 = tcoll;
    if(and__3822__auto____14134) {
      return tcoll.cljs$core$ITransientSet$_disjoin_BANG_$arity$2
    }else {
      return and__3822__auto____14134
    }
  }()) {
    return tcoll.cljs$core$ITransientSet$_disjoin_BANG_$arity$2(tcoll, v)
  }else {
    var x__2363__auto____14135 = tcoll == null ? null : tcoll;
    return function() {
      var or__3824__auto____14136 = cljs.core._disjoin_BANG_[goog.typeOf(x__2363__auto____14135)];
      if(or__3824__auto____14136) {
        return or__3824__auto____14136
      }else {
        var or__3824__auto____14137 = cljs.core._disjoin_BANG_["_"];
        if(or__3824__auto____14137) {
          return or__3824__auto____14137
        }else {
          throw cljs.core.missing_protocol.call(null, "ITransientSet.-disjoin!", tcoll);
        }
      }
    }().call(null, tcoll, v)
  }
};
cljs.core.IComparable = {};
cljs.core._compare = function _compare(x, y) {
  if(function() {
    var and__3822__auto____14142 = x;
    if(and__3822__auto____14142) {
      return x.cljs$core$IComparable$_compare$arity$2
    }else {
      return and__3822__auto____14142
    }
  }()) {
    return x.cljs$core$IComparable$_compare$arity$2(x, y)
  }else {
    var x__2363__auto____14143 = x == null ? null : x;
    return function() {
      var or__3824__auto____14144 = cljs.core._compare[goog.typeOf(x__2363__auto____14143)];
      if(or__3824__auto____14144) {
        return or__3824__auto____14144
      }else {
        var or__3824__auto____14145 = cljs.core._compare["_"];
        if(or__3824__auto____14145) {
          return or__3824__auto____14145
        }else {
          throw cljs.core.missing_protocol.call(null, "IComparable.-compare", x);
        }
      }
    }().call(null, x, y)
  }
};
cljs.core.IChunk = {};
cljs.core._drop_first = function _drop_first(coll) {
  if(function() {
    var and__3822__auto____14150 = coll;
    if(and__3822__auto____14150) {
      return coll.cljs$core$IChunk$_drop_first$arity$1
    }else {
      return and__3822__auto____14150
    }
  }()) {
    return coll.cljs$core$IChunk$_drop_first$arity$1(coll)
  }else {
    var x__2363__auto____14151 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____14152 = cljs.core._drop_first[goog.typeOf(x__2363__auto____14151)];
      if(or__3824__auto____14152) {
        return or__3824__auto____14152
      }else {
        var or__3824__auto____14153 = cljs.core._drop_first["_"];
        if(or__3824__auto____14153) {
          return or__3824__auto____14153
        }else {
          throw cljs.core.missing_protocol.call(null, "IChunk.-drop-first", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.IChunkedSeq = {};
cljs.core._chunked_first = function _chunked_first(coll) {
  if(function() {
    var and__3822__auto____14158 = coll;
    if(and__3822__auto____14158) {
      return coll.cljs$core$IChunkedSeq$_chunked_first$arity$1
    }else {
      return and__3822__auto____14158
    }
  }()) {
    return coll.cljs$core$IChunkedSeq$_chunked_first$arity$1(coll)
  }else {
    var x__2363__auto____14159 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____14160 = cljs.core._chunked_first[goog.typeOf(x__2363__auto____14159)];
      if(or__3824__auto____14160) {
        return or__3824__auto____14160
      }else {
        var or__3824__auto____14161 = cljs.core._chunked_first["_"];
        if(or__3824__auto____14161) {
          return or__3824__auto____14161
        }else {
          throw cljs.core.missing_protocol.call(null, "IChunkedSeq.-chunked-first", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core._chunked_rest = function _chunked_rest(coll) {
  if(function() {
    var and__3822__auto____14166 = coll;
    if(and__3822__auto____14166) {
      return coll.cljs$core$IChunkedSeq$_chunked_rest$arity$1
    }else {
      return and__3822__auto____14166
    }
  }()) {
    return coll.cljs$core$IChunkedSeq$_chunked_rest$arity$1(coll)
  }else {
    var x__2363__auto____14167 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____14168 = cljs.core._chunked_rest[goog.typeOf(x__2363__auto____14167)];
      if(or__3824__auto____14168) {
        return or__3824__auto____14168
      }else {
        var or__3824__auto____14169 = cljs.core._chunked_rest["_"];
        if(or__3824__auto____14169) {
          return or__3824__auto____14169
        }else {
          throw cljs.core.missing_protocol.call(null, "IChunkedSeq.-chunked-rest", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.IChunkedNext = {};
cljs.core._chunked_next = function _chunked_next(coll) {
  if(function() {
    var and__3822__auto____14174 = coll;
    if(and__3822__auto____14174) {
      return coll.cljs$core$IChunkedNext$_chunked_next$arity$1
    }else {
      return and__3822__auto____14174
    }
  }()) {
    return coll.cljs$core$IChunkedNext$_chunked_next$arity$1(coll)
  }else {
    var x__2363__auto____14175 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____14176 = cljs.core._chunked_next[goog.typeOf(x__2363__auto____14175)];
      if(or__3824__auto____14176) {
        return or__3824__auto____14176
      }else {
        var or__3824__auto____14177 = cljs.core._chunked_next["_"];
        if(or__3824__auto____14177) {
          return or__3824__auto____14177
        }else {
          throw cljs.core.missing_protocol.call(null, "IChunkedNext.-chunked-next", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.identical_QMARK_ = function identical_QMARK_(x, y) {
  return x === y
};
cljs.core._EQ_ = function() {
  var _EQ_ = null;
  var _EQ___1 = function(x) {
    return true
  };
  var _EQ___2 = function(x, y) {
    var or__3824__auto____14179 = x === y;
    if(or__3824__auto____14179) {
      return or__3824__auto____14179
    }else {
      return cljs.core._equiv.call(null, x, y)
    }
  };
  var _EQ___3 = function() {
    var G__14180__delegate = function(x, y, more) {
      while(true) {
        if(cljs.core.truth_(_EQ_.call(null, x, y))) {
          if(cljs.core.next.call(null, more)) {
            var G__14181 = y;
            var G__14182 = cljs.core.first.call(null, more);
            var G__14183 = cljs.core.next.call(null, more);
            x = G__14181;
            y = G__14182;
            more = G__14183;
            continue
          }else {
            return _EQ_.call(null, y, cljs.core.first.call(null, more))
          }
        }else {
          return false
        }
        break
      }
    };
    var G__14180 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__14180__delegate.call(this, x, y, more)
    };
    G__14180.cljs$lang$maxFixedArity = 2;
    G__14180.cljs$lang$applyTo = function(arglist__14184) {
      var x = cljs.core.first(arglist__14184);
      var y = cljs.core.first(cljs.core.next(arglist__14184));
      var more = cljs.core.rest(cljs.core.next(arglist__14184));
      return G__14180__delegate(x, y, more)
    };
    G__14180.cljs$lang$arity$variadic = G__14180__delegate;
    return G__14180
  }();
  _EQ_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _EQ___1.call(this, x);
      case 2:
        return _EQ___2.call(this, x, y);
      default:
        return _EQ___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _EQ_.cljs$lang$maxFixedArity = 2;
  _EQ_.cljs$lang$applyTo = _EQ___3.cljs$lang$applyTo;
  _EQ_.cljs$lang$arity$1 = _EQ___1;
  _EQ_.cljs$lang$arity$2 = _EQ___2;
  _EQ_.cljs$lang$arity$variadic = _EQ___3.cljs$lang$arity$variadic;
  return _EQ_
}();
cljs.core.nil_QMARK_ = function nil_QMARK_(x) {
  return x == null
};
cljs.core.type = function type(x) {
  if(x == null) {
    return null
  }else {
    return x.constructor
  }
};
cljs.core.instance_QMARK_ = function instance_QMARK_(t, o) {
  return o instanceof t
};
cljs.core.IHash["null"] = true;
cljs.core._hash["null"] = function(o) {
  return 0
};
cljs.core.ILookup["null"] = true;
cljs.core._lookup["null"] = function() {
  var G__14185 = null;
  var G__14185__2 = function(o, k) {
    return null
  };
  var G__14185__3 = function(o, k, not_found) {
    return not_found
  };
  G__14185 = function(o, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__14185__2.call(this, o, k);
      case 3:
        return G__14185__3.call(this, o, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__14185
}();
cljs.core.IAssociative["null"] = true;
cljs.core._assoc["null"] = function(_, k, v) {
  return cljs.core.hash_map.call(null, k, v)
};
cljs.core.INext["null"] = true;
cljs.core._next["null"] = function(_) {
  return null
};
cljs.core.ICollection["null"] = true;
cljs.core._conj["null"] = function(_, o) {
  return cljs.core.list.call(null, o)
};
cljs.core.IReduce["null"] = true;
cljs.core._reduce["null"] = function() {
  var G__14186 = null;
  var G__14186__2 = function(_, f) {
    return f.call(null)
  };
  var G__14186__3 = function(_, f, start) {
    return start
  };
  G__14186 = function(_, f, start) {
    switch(arguments.length) {
      case 2:
        return G__14186__2.call(this, _, f);
      case 3:
        return G__14186__3.call(this, _, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__14186
}();
cljs.core.IPrintable["null"] = true;
cljs.core._pr_seq["null"] = function(o) {
  return cljs.core.list.call(null, "nil")
};
cljs.core.ISet["null"] = true;
cljs.core._disjoin["null"] = function(_, v) {
  return null
};
cljs.core.ICounted["null"] = true;
cljs.core._count["null"] = function(_) {
  return 0
};
cljs.core.IStack["null"] = true;
cljs.core._peek["null"] = function(_) {
  return null
};
cljs.core._pop["null"] = function(_) {
  return null
};
cljs.core.ISeq["null"] = true;
cljs.core._first["null"] = function(_) {
  return null
};
cljs.core._rest["null"] = function(_) {
  return cljs.core.list.call(null)
};
cljs.core.IEquiv["null"] = true;
cljs.core._equiv["null"] = function(_, o) {
  return o == null
};
cljs.core.IWithMeta["null"] = true;
cljs.core._with_meta["null"] = function(_, meta) {
  return null
};
cljs.core.IMeta["null"] = true;
cljs.core._meta["null"] = function(_) {
  return null
};
cljs.core.IIndexed["null"] = true;
cljs.core._nth["null"] = function() {
  var G__14187 = null;
  var G__14187__2 = function(_, n) {
    return null
  };
  var G__14187__3 = function(_, n, not_found) {
    return not_found
  };
  G__14187 = function(_, n, not_found) {
    switch(arguments.length) {
      case 2:
        return G__14187__2.call(this, _, n);
      case 3:
        return G__14187__3.call(this, _, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__14187
}();
cljs.core.IEmptyableCollection["null"] = true;
cljs.core._empty["null"] = function(_) {
  return null
};
cljs.core.IMap["null"] = true;
cljs.core._dissoc["null"] = function(_, k) {
  return null
};
Date.prototype.cljs$core$IEquiv$ = true;
Date.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(o, other) {
  var and__3822__auto____14188 = cljs.core.instance_QMARK_.call(null, Date, other);
  if(and__3822__auto____14188) {
    return o.toString() === other.toString()
  }else {
    return and__3822__auto____14188
  }
};
cljs.core.IHash["number"] = true;
cljs.core._hash["number"] = function(o) {
  return o
};
cljs.core.IEquiv["number"] = true;
cljs.core._equiv["number"] = function(x, o) {
  return x === o
};
cljs.core.IHash["boolean"] = true;
cljs.core._hash["boolean"] = function(o) {
  if(o === true) {
    return 1
  }else {
    return 0
  }
};
cljs.core.IHash["_"] = true;
cljs.core._hash["_"] = function(o) {
  return goog.getUid(o)
};
cljs.core.inc = function inc(x) {
  return x + 1
};
cljs.core.ci_reduce = function() {
  var ci_reduce = null;
  var ci_reduce__2 = function(cicoll, f) {
    var cnt__14201 = cljs.core._count.call(null, cicoll);
    if(cnt__14201 === 0) {
      return f.call(null)
    }else {
      var val__14202 = cljs.core._nth.call(null, cicoll, 0);
      var n__14203 = 1;
      while(true) {
        if(n__14203 < cnt__14201) {
          var nval__14204 = f.call(null, val__14202, cljs.core._nth.call(null, cicoll, n__14203));
          if(cljs.core.reduced_QMARK_.call(null, nval__14204)) {
            return cljs.core.deref.call(null, nval__14204)
          }else {
            var G__14213 = nval__14204;
            var G__14214 = n__14203 + 1;
            val__14202 = G__14213;
            n__14203 = G__14214;
            continue
          }
        }else {
          return val__14202
        }
        break
      }
    }
  };
  var ci_reduce__3 = function(cicoll, f, val) {
    var cnt__14205 = cljs.core._count.call(null, cicoll);
    var val__14206 = val;
    var n__14207 = 0;
    while(true) {
      if(n__14207 < cnt__14205) {
        var nval__14208 = f.call(null, val__14206, cljs.core._nth.call(null, cicoll, n__14207));
        if(cljs.core.reduced_QMARK_.call(null, nval__14208)) {
          return cljs.core.deref.call(null, nval__14208)
        }else {
          var G__14215 = nval__14208;
          var G__14216 = n__14207 + 1;
          val__14206 = G__14215;
          n__14207 = G__14216;
          continue
        }
      }else {
        return val__14206
      }
      break
    }
  };
  var ci_reduce__4 = function(cicoll, f, val, idx) {
    var cnt__14209 = cljs.core._count.call(null, cicoll);
    var val__14210 = val;
    var n__14211 = idx;
    while(true) {
      if(n__14211 < cnt__14209) {
        var nval__14212 = f.call(null, val__14210, cljs.core._nth.call(null, cicoll, n__14211));
        if(cljs.core.reduced_QMARK_.call(null, nval__14212)) {
          return cljs.core.deref.call(null, nval__14212)
        }else {
          var G__14217 = nval__14212;
          var G__14218 = n__14211 + 1;
          val__14210 = G__14217;
          n__14211 = G__14218;
          continue
        }
      }else {
        return val__14210
      }
      break
    }
  };
  ci_reduce = function(cicoll, f, val, idx) {
    switch(arguments.length) {
      case 2:
        return ci_reduce__2.call(this, cicoll, f);
      case 3:
        return ci_reduce__3.call(this, cicoll, f, val);
      case 4:
        return ci_reduce__4.call(this, cicoll, f, val, idx)
    }
    throw"Invalid arity: " + arguments.length;
  };
  ci_reduce.cljs$lang$arity$2 = ci_reduce__2;
  ci_reduce.cljs$lang$arity$3 = ci_reduce__3;
  ci_reduce.cljs$lang$arity$4 = ci_reduce__4;
  return ci_reduce
}();
cljs.core.array_reduce = function() {
  var array_reduce = null;
  var array_reduce__2 = function(arr, f) {
    var cnt__14231 = arr.length;
    if(arr.length === 0) {
      return f.call(null)
    }else {
      var val__14232 = arr[0];
      var n__14233 = 1;
      while(true) {
        if(n__14233 < cnt__14231) {
          var nval__14234 = f.call(null, val__14232, arr[n__14233]);
          if(cljs.core.reduced_QMARK_.call(null, nval__14234)) {
            return cljs.core.deref.call(null, nval__14234)
          }else {
            var G__14243 = nval__14234;
            var G__14244 = n__14233 + 1;
            val__14232 = G__14243;
            n__14233 = G__14244;
            continue
          }
        }else {
          return val__14232
        }
        break
      }
    }
  };
  var array_reduce__3 = function(arr, f, val) {
    var cnt__14235 = arr.length;
    var val__14236 = val;
    var n__14237 = 0;
    while(true) {
      if(n__14237 < cnt__14235) {
        var nval__14238 = f.call(null, val__14236, arr[n__14237]);
        if(cljs.core.reduced_QMARK_.call(null, nval__14238)) {
          return cljs.core.deref.call(null, nval__14238)
        }else {
          var G__14245 = nval__14238;
          var G__14246 = n__14237 + 1;
          val__14236 = G__14245;
          n__14237 = G__14246;
          continue
        }
      }else {
        return val__14236
      }
      break
    }
  };
  var array_reduce__4 = function(arr, f, val, idx) {
    var cnt__14239 = arr.length;
    var val__14240 = val;
    var n__14241 = idx;
    while(true) {
      if(n__14241 < cnt__14239) {
        var nval__14242 = f.call(null, val__14240, arr[n__14241]);
        if(cljs.core.reduced_QMARK_.call(null, nval__14242)) {
          return cljs.core.deref.call(null, nval__14242)
        }else {
          var G__14247 = nval__14242;
          var G__14248 = n__14241 + 1;
          val__14240 = G__14247;
          n__14241 = G__14248;
          continue
        }
      }else {
        return val__14240
      }
      break
    }
  };
  array_reduce = function(arr, f, val, idx) {
    switch(arguments.length) {
      case 2:
        return array_reduce__2.call(this, arr, f);
      case 3:
        return array_reduce__3.call(this, arr, f, val);
      case 4:
        return array_reduce__4.call(this, arr, f, val, idx)
    }
    throw"Invalid arity: " + arguments.length;
  };
  array_reduce.cljs$lang$arity$2 = array_reduce__2;
  array_reduce.cljs$lang$arity$3 = array_reduce__3;
  array_reduce.cljs$lang$arity$4 = array_reduce__4;
  return array_reduce
}();
cljs.core.IndexedSeq = function(a, i) {
  this.a = a;
  this.i = i;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 166199546
};
cljs.core.IndexedSeq.cljs$lang$type = true;
cljs.core.IndexedSeq.cljs$lang$ctorPrSeq = function(this__2309__auto__) {
  return cljs.core.list.call(null, "cljs.core/IndexedSeq")
};
cljs.core.IndexedSeq.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__14249 = this;
  return cljs.core.hash_coll.call(null, coll)
};
cljs.core.IndexedSeq.prototype.cljs$core$INext$_next$arity$1 = function(_) {
  var this__14250 = this;
  if(this__14250.i + 1 < this__14250.a.length) {
    return new cljs.core.IndexedSeq(this__14250.a, this__14250.i + 1)
  }else {
    return null
  }
};
cljs.core.IndexedSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__14251 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.IndexedSeq.prototype.cljs$core$IReversible$_rseq$arity$1 = function(coll) {
  var this__14252 = this;
  var c__14253 = coll.cljs$core$ICounted$_count$arity$1(coll);
  if(c__14253 > 0) {
    return new cljs.core.RSeq(coll, c__14253 - 1, null)
  }else {
    return cljs.core.List.EMPTY
  }
};
cljs.core.IndexedSeq.prototype.toString = function() {
  var this__14254 = this;
  var this__14255 = this;
  return cljs.core.pr_str.call(null, this__14255)
};
cljs.core.IndexedSeq.prototype.cljs$core$IReduce$_reduce$arity$2 = function(coll, f) {
  var this__14256 = this;
  if(cljs.core.counted_QMARK_.call(null, this__14256.a)) {
    return cljs.core.ci_reduce.call(null, this__14256.a, f, this__14256.a[this__14256.i], this__14256.i + 1)
  }else {
    return cljs.core.ci_reduce.call(null, coll, f, this__14256.a[this__14256.i], 0)
  }
};
cljs.core.IndexedSeq.prototype.cljs$core$IReduce$_reduce$arity$3 = function(coll, f, start) {
  var this__14257 = this;
  if(cljs.core.counted_QMARK_.call(null, this__14257.a)) {
    return cljs.core.ci_reduce.call(null, this__14257.a, f, start, this__14257.i)
  }else {
    return cljs.core.ci_reduce.call(null, coll, f, start, 0)
  }
};
cljs.core.IndexedSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(this$) {
  var this__14258 = this;
  return this$
};
cljs.core.IndexedSeq.prototype.cljs$core$ICounted$_count$arity$1 = function(_) {
  var this__14259 = this;
  return this__14259.a.length - this__14259.i
};
cljs.core.IndexedSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(_) {
  var this__14260 = this;
  return this__14260.a[this__14260.i]
};
cljs.core.IndexedSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(_) {
  var this__14261 = this;
  if(this__14261.i + 1 < this__14261.a.length) {
    return new cljs.core.IndexedSeq(this__14261.a, this__14261.i + 1)
  }else {
    return cljs.core.list.call(null)
  }
};
cljs.core.IndexedSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__14262 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.IndexedSeq.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, n) {
  var this__14263 = this;
  var i__14264 = n + this__14263.i;
  if(i__14264 < this__14263.a.length) {
    return this__14263.a[i__14264]
  }else {
    return null
  }
};
cljs.core.IndexedSeq.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, n, not_found) {
  var this__14265 = this;
  var i__14266 = n + this__14265.i;
  if(i__14266 < this__14265.a.length) {
    return this__14265.a[i__14266]
  }else {
    return not_found
  }
};
cljs.core.IndexedSeq;
cljs.core.prim_seq = function() {
  var prim_seq = null;
  var prim_seq__1 = function(prim) {
    return prim_seq.call(null, prim, 0)
  };
  var prim_seq__2 = function(prim, i) {
    if(prim.length === 0) {
      return null
    }else {
      return new cljs.core.IndexedSeq(prim, i)
    }
  };
  prim_seq = function(prim, i) {
    switch(arguments.length) {
      case 1:
        return prim_seq__1.call(this, prim);
      case 2:
        return prim_seq__2.call(this, prim, i)
    }
    throw"Invalid arity: " + arguments.length;
  };
  prim_seq.cljs$lang$arity$1 = prim_seq__1;
  prim_seq.cljs$lang$arity$2 = prim_seq__2;
  return prim_seq
}();
cljs.core.array_seq = function() {
  var array_seq = null;
  var array_seq__1 = function(array) {
    return cljs.core.prim_seq.call(null, array, 0)
  };
  var array_seq__2 = function(array, i) {
    return cljs.core.prim_seq.call(null, array, i)
  };
  array_seq = function(array, i) {
    switch(arguments.length) {
      case 1:
        return array_seq__1.call(this, array);
      case 2:
        return array_seq__2.call(this, array, i)
    }
    throw"Invalid arity: " + arguments.length;
  };
  array_seq.cljs$lang$arity$1 = array_seq__1;
  array_seq.cljs$lang$arity$2 = array_seq__2;
  return array_seq
}();
cljs.core.IReduce["array"] = true;
cljs.core._reduce["array"] = function() {
  var G__14267 = null;
  var G__14267__2 = function(array, f) {
    return cljs.core.ci_reduce.call(null, array, f)
  };
  var G__14267__3 = function(array, f, start) {
    return cljs.core.ci_reduce.call(null, array, f, start)
  };
  G__14267 = function(array, f, start) {
    switch(arguments.length) {
      case 2:
        return G__14267__2.call(this, array, f);
      case 3:
        return G__14267__3.call(this, array, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__14267
}();
cljs.core.ILookup["array"] = true;
cljs.core._lookup["array"] = function() {
  var G__14268 = null;
  var G__14268__2 = function(array, k) {
    return array[k]
  };
  var G__14268__3 = function(array, k, not_found) {
    return cljs.core._nth.call(null, array, k, not_found)
  };
  G__14268 = function(array, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__14268__2.call(this, array, k);
      case 3:
        return G__14268__3.call(this, array, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__14268
}();
cljs.core.IIndexed["array"] = true;
cljs.core._nth["array"] = function() {
  var G__14269 = null;
  var G__14269__2 = function(array, n) {
    if(n < array.length) {
      return array[n]
    }else {
      return null
    }
  };
  var G__14269__3 = function(array, n, not_found) {
    if(n < array.length) {
      return array[n]
    }else {
      return not_found
    }
  };
  G__14269 = function(array, n, not_found) {
    switch(arguments.length) {
      case 2:
        return G__14269__2.call(this, array, n);
      case 3:
        return G__14269__3.call(this, array, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__14269
}();
cljs.core.ICounted["array"] = true;
cljs.core._count["array"] = function(a) {
  return a.length
};
cljs.core.ISeqable["array"] = true;
cljs.core._seq["array"] = function(array) {
  return cljs.core.array_seq.call(null, array, 0)
};
cljs.core.RSeq = function(ci, i, meta) {
  this.ci = ci;
  this.i = i;
  this.meta = meta;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 31850570
};
cljs.core.RSeq.cljs$lang$type = true;
cljs.core.RSeq.cljs$lang$ctorPrSeq = function(this__2309__auto__) {
  return cljs.core.list.call(null, "cljs.core/RSeq")
};
cljs.core.RSeq.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__14270 = this;
  return cljs.core.hash_coll.call(null, coll)
};
cljs.core.RSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__14271 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.RSeq.prototype.toString = function() {
  var this__14272 = this;
  var this__14273 = this;
  return cljs.core.pr_str.call(null, this__14273)
};
cljs.core.RSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__14274 = this;
  return coll
};
cljs.core.RSeq.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__14275 = this;
  return this__14275.i + 1
};
cljs.core.RSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__14276 = this;
  return cljs.core._nth.call(null, this__14276.ci, this__14276.i)
};
cljs.core.RSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__14277 = this;
  if(this__14277.i > 0) {
    return new cljs.core.RSeq(this__14277.ci, this__14277.i - 1, null)
  }else {
    return cljs.core.List.EMPTY
  }
};
cljs.core.RSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__14278 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.RSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, new_meta) {
  var this__14279 = this;
  return new cljs.core.RSeq(this__14279.ci, this__14279.i, new_meta)
};
cljs.core.RSeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__14280 = this;
  return this__14280.meta
};
cljs.core.RSeq;
cljs.core.seq = function seq(coll) {
  if(coll == null) {
    return null
  }else {
    if(function() {
      var G__14284__14285 = coll;
      if(G__14284__14285) {
        if(function() {
          var or__3824__auto____14286 = G__14284__14285.cljs$lang$protocol_mask$partition0$ & 32;
          if(or__3824__auto____14286) {
            return or__3824__auto____14286
          }else {
            return G__14284__14285.cljs$core$ASeq$
          }
        }()) {
          return true
        }else {
          if(!G__14284__14285.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.ASeq, G__14284__14285)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.ASeq, G__14284__14285)
      }
    }()) {
      return coll
    }else {
      return cljs.core._seq.call(null, coll)
    }
  }
};
cljs.core.first = function first(coll) {
  if(coll == null) {
    return null
  }else {
    if(function() {
      var G__14291__14292 = coll;
      if(G__14291__14292) {
        if(function() {
          var or__3824__auto____14293 = G__14291__14292.cljs$lang$protocol_mask$partition0$ & 64;
          if(or__3824__auto____14293) {
            return or__3824__auto____14293
          }else {
            return G__14291__14292.cljs$core$ISeq$
          }
        }()) {
          return true
        }else {
          if(!G__14291__14292.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__14291__14292)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__14291__14292)
      }
    }()) {
      return cljs.core._first.call(null, coll)
    }else {
      var s__14294 = cljs.core.seq.call(null, coll);
      if(s__14294 == null) {
        return null
      }else {
        return cljs.core._first.call(null, s__14294)
      }
    }
  }
};
cljs.core.rest = function rest(coll) {
  if(!(coll == null)) {
    if(function() {
      var G__14299__14300 = coll;
      if(G__14299__14300) {
        if(function() {
          var or__3824__auto____14301 = G__14299__14300.cljs$lang$protocol_mask$partition0$ & 64;
          if(or__3824__auto____14301) {
            return or__3824__auto____14301
          }else {
            return G__14299__14300.cljs$core$ISeq$
          }
        }()) {
          return true
        }else {
          if(!G__14299__14300.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__14299__14300)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__14299__14300)
      }
    }()) {
      return cljs.core._rest.call(null, coll)
    }else {
      var s__14302 = cljs.core.seq.call(null, coll);
      if(!(s__14302 == null)) {
        return cljs.core._rest.call(null, s__14302)
      }else {
        return cljs.core.List.EMPTY
      }
    }
  }else {
    return cljs.core.List.EMPTY
  }
};
cljs.core.next = function next(coll) {
  if(coll == null) {
    return null
  }else {
    if(function() {
      var G__14306__14307 = coll;
      if(G__14306__14307) {
        if(function() {
          var or__3824__auto____14308 = G__14306__14307.cljs$lang$protocol_mask$partition0$ & 128;
          if(or__3824__auto____14308) {
            return or__3824__auto____14308
          }else {
            return G__14306__14307.cljs$core$INext$
          }
        }()) {
          return true
        }else {
          if(!G__14306__14307.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.INext, G__14306__14307)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.INext, G__14306__14307)
      }
    }()) {
      return cljs.core._next.call(null, coll)
    }else {
      return cljs.core.seq.call(null, cljs.core.rest.call(null, coll))
    }
  }
};
cljs.core.second = function second(coll) {
  return cljs.core.first.call(null, cljs.core.next.call(null, coll))
};
cljs.core.ffirst = function ffirst(coll) {
  return cljs.core.first.call(null, cljs.core.first.call(null, coll))
};
cljs.core.nfirst = function nfirst(coll) {
  return cljs.core.next.call(null, cljs.core.first.call(null, coll))
};
cljs.core.fnext = function fnext(coll) {
  return cljs.core.first.call(null, cljs.core.next.call(null, coll))
};
cljs.core.nnext = function nnext(coll) {
  return cljs.core.next.call(null, cljs.core.next.call(null, coll))
};
cljs.core.last = function last(s) {
  while(true) {
    var sn__14310 = cljs.core.next.call(null, s);
    if(!(sn__14310 == null)) {
      var G__14311 = sn__14310;
      s = G__14311;
      continue
    }else {
      return cljs.core.first.call(null, s)
    }
    break
  }
};
cljs.core.IEquiv["_"] = true;
cljs.core._equiv["_"] = function(x, o) {
  return x === o
};
cljs.core.not = function not(x) {
  if(cljs.core.truth_(x)) {
    return false
  }else {
    return true
  }
};
cljs.core.conj = function() {
  var conj = null;
  var conj__2 = function(coll, x) {
    return cljs.core._conj.call(null, coll, x)
  };
  var conj__3 = function() {
    var G__14312__delegate = function(coll, x, xs) {
      while(true) {
        if(cljs.core.truth_(xs)) {
          var G__14313 = conj.call(null, coll, x);
          var G__14314 = cljs.core.first.call(null, xs);
          var G__14315 = cljs.core.next.call(null, xs);
          coll = G__14313;
          x = G__14314;
          xs = G__14315;
          continue
        }else {
          return conj.call(null, coll, x)
        }
        break
      }
    };
    var G__14312 = function(coll, x, var_args) {
      var xs = null;
      if(goog.isDef(var_args)) {
        xs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__14312__delegate.call(this, coll, x, xs)
    };
    G__14312.cljs$lang$maxFixedArity = 2;
    G__14312.cljs$lang$applyTo = function(arglist__14316) {
      var coll = cljs.core.first(arglist__14316);
      var x = cljs.core.first(cljs.core.next(arglist__14316));
      var xs = cljs.core.rest(cljs.core.next(arglist__14316));
      return G__14312__delegate(coll, x, xs)
    };
    G__14312.cljs$lang$arity$variadic = G__14312__delegate;
    return G__14312
  }();
  conj = function(coll, x, var_args) {
    var xs = var_args;
    switch(arguments.length) {
      case 2:
        return conj__2.call(this, coll, x);
      default:
        return conj__3.cljs$lang$arity$variadic(coll, x, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  conj.cljs$lang$maxFixedArity = 2;
  conj.cljs$lang$applyTo = conj__3.cljs$lang$applyTo;
  conj.cljs$lang$arity$2 = conj__2;
  conj.cljs$lang$arity$variadic = conj__3.cljs$lang$arity$variadic;
  return conj
}();
cljs.core.empty = function empty(coll) {
  return cljs.core._empty.call(null, coll)
};
cljs.core.accumulating_seq_count = function accumulating_seq_count(coll) {
  var s__14319 = cljs.core.seq.call(null, coll);
  var acc__14320 = 0;
  while(true) {
    if(cljs.core.counted_QMARK_.call(null, s__14319)) {
      return acc__14320 + cljs.core._count.call(null, s__14319)
    }else {
      var G__14321 = cljs.core.next.call(null, s__14319);
      var G__14322 = acc__14320 + 1;
      s__14319 = G__14321;
      acc__14320 = G__14322;
      continue
    }
    break
  }
};
cljs.core.count = function count(coll) {
  if(cljs.core.counted_QMARK_.call(null, coll)) {
    return cljs.core._count.call(null, coll)
  }else {
    return cljs.core.accumulating_seq_count.call(null, coll)
  }
};
cljs.core.linear_traversal_nth = function() {
  var linear_traversal_nth = null;
  var linear_traversal_nth__2 = function(coll, n) {
    if(coll == null) {
      throw new Error("Index out of bounds");
    }else {
      if(n === 0) {
        if(cljs.core.seq.call(null, coll)) {
          return cljs.core.first.call(null, coll)
        }else {
          throw new Error("Index out of bounds");
        }
      }else {
        if(cljs.core.indexed_QMARK_.call(null, coll)) {
          return cljs.core._nth.call(null, coll, n)
        }else {
          if(cljs.core.seq.call(null, coll)) {
            return linear_traversal_nth.call(null, cljs.core.next.call(null, coll), n - 1)
          }else {
            if("\ufdd0'else") {
              throw new Error("Index out of bounds");
            }else {
              return null
            }
          }
        }
      }
    }
  };
  var linear_traversal_nth__3 = function(coll, n, not_found) {
    if(coll == null) {
      return not_found
    }else {
      if(n === 0) {
        if(cljs.core.seq.call(null, coll)) {
          return cljs.core.first.call(null, coll)
        }else {
          return not_found
        }
      }else {
        if(cljs.core.indexed_QMARK_.call(null, coll)) {
          return cljs.core._nth.call(null, coll, n, not_found)
        }else {
          if(cljs.core.seq.call(null, coll)) {
            return linear_traversal_nth.call(null, cljs.core.next.call(null, coll), n - 1, not_found)
          }else {
            if("\ufdd0'else") {
              return not_found
            }else {
              return null
            }
          }
        }
      }
    }
  };
  linear_traversal_nth = function(coll, n, not_found) {
    switch(arguments.length) {
      case 2:
        return linear_traversal_nth__2.call(this, coll, n);
      case 3:
        return linear_traversal_nth__3.call(this, coll, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  linear_traversal_nth.cljs$lang$arity$2 = linear_traversal_nth__2;
  linear_traversal_nth.cljs$lang$arity$3 = linear_traversal_nth__3;
  return linear_traversal_nth
}();
cljs.core.nth = function() {
  var nth = null;
  var nth__2 = function(coll, n) {
    if(coll == null) {
      return null
    }else {
      if(function() {
        var G__14329__14330 = coll;
        if(G__14329__14330) {
          if(function() {
            var or__3824__auto____14331 = G__14329__14330.cljs$lang$protocol_mask$partition0$ & 16;
            if(or__3824__auto____14331) {
              return or__3824__auto____14331
            }else {
              return G__14329__14330.cljs$core$IIndexed$
            }
          }()) {
            return true
          }else {
            if(!G__14329__14330.cljs$lang$protocol_mask$partition0$) {
              return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__14329__14330)
            }else {
              return false
            }
          }
        }else {
          return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__14329__14330)
        }
      }()) {
        return cljs.core._nth.call(null, coll, Math.floor(n))
      }else {
        return cljs.core.linear_traversal_nth.call(null, coll, Math.floor(n))
      }
    }
  };
  var nth__3 = function(coll, n, not_found) {
    if(!(coll == null)) {
      if(function() {
        var G__14332__14333 = coll;
        if(G__14332__14333) {
          if(function() {
            var or__3824__auto____14334 = G__14332__14333.cljs$lang$protocol_mask$partition0$ & 16;
            if(or__3824__auto____14334) {
              return or__3824__auto____14334
            }else {
              return G__14332__14333.cljs$core$IIndexed$
            }
          }()) {
            return true
          }else {
            if(!G__14332__14333.cljs$lang$protocol_mask$partition0$) {
              return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__14332__14333)
            }else {
              return false
            }
          }
        }else {
          return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__14332__14333)
        }
      }()) {
        return cljs.core._nth.call(null, coll, Math.floor(n), not_found)
      }else {
        return cljs.core.linear_traversal_nth.call(null, coll, Math.floor(n), not_found)
      }
    }else {
      return not_found
    }
  };
  nth = function(coll, n, not_found) {
    switch(arguments.length) {
      case 2:
        return nth__2.call(this, coll, n);
      case 3:
        return nth__3.call(this, coll, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  nth.cljs$lang$arity$2 = nth__2;
  nth.cljs$lang$arity$3 = nth__3;
  return nth
}();
cljs.core.get = function() {
  var get = null;
  var get__2 = function(o, k) {
    return cljs.core._lookup.call(null, o, k)
  };
  var get__3 = function(o, k, not_found) {
    return cljs.core._lookup.call(null, o, k, not_found)
  };
  get = function(o, k, not_found) {
    switch(arguments.length) {
      case 2:
        return get__2.call(this, o, k);
      case 3:
        return get__3.call(this, o, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  get.cljs$lang$arity$2 = get__2;
  get.cljs$lang$arity$3 = get__3;
  return get
}();
cljs.core.assoc = function() {
  var assoc = null;
  var assoc__3 = function(coll, k, v) {
    return cljs.core._assoc.call(null, coll, k, v)
  };
  var assoc__4 = function() {
    var G__14337__delegate = function(coll, k, v, kvs) {
      while(true) {
        var ret__14336 = assoc.call(null, coll, k, v);
        if(cljs.core.truth_(kvs)) {
          var G__14338 = ret__14336;
          var G__14339 = cljs.core.first.call(null, kvs);
          var G__14340 = cljs.core.second.call(null, kvs);
          var G__14341 = cljs.core.nnext.call(null, kvs);
          coll = G__14338;
          k = G__14339;
          v = G__14340;
          kvs = G__14341;
          continue
        }else {
          return ret__14336
        }
        break
      }
    };
    var G__14337 = function(coll, k, v, var_args) {
      var kvs = null;
      if(goog.isDef(var_args)) {
        kvs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__14337__delegate.call(this, coll, k, v, kvs)
    };
    G__14337.cljs$lang$maxFixedArity = 3;
    G__14337.cljs$lang$applyTo = function(arglist__14342) {
      var coll = cljs.core.first(arglist__14342);
      var k = cljs.core.first(cljs.core.next(arglist__14342));
      var v = cljs.core.first(cljs.core.next(cljs.core.next(arglist__14342)));
      var kvs = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__14342)));
      return G__14337__delegate(coll, k, v, kvs)
    };
    G__14337.cljs$lang$arity$variadic = G__14337__delegate;
    return G__14337
  }();
  assoc = function(coll, k, v, var_args) {
    var kvs = var_args;
    switch(arguments.length) {
      case 3:
        return assoc__3.call(this, coll, k, v);
      default:
        return assoc__4.cljs$lang$arity$variadic(coll, k, v, cljs.core.array_seq(arguments, 3))
    }
    throw"Invalid arity: " + arguments.length;
  };
  assoc.cljs$lang$maxFixedArity = 3;
  assoc.cljs$lang$applyTo = assoc__4.cljs$lang$applyTo;
  assoc.cljs$lang$arity$3 = assoc__3;
  assoc.cljs$lang$arity$variadic = assoc__4.cljs$lang$arity$variadic;
  return assoc
}();
cljs.core.dissoc = function() {
  var dissoc = null;
  var dissoc__1 = function(coll) {
    return coll
  };
  var dissoc__2 = function(coll, k) {
    return cljs.core._dissoc.call(null, coll, k)
  };
  var dissoc__3 = function() {
    var G__14345__delegate = function(coll, k, ks) {
      while(true) {
        var ret__14344 = dissoc.call(null, coll, k);
        if(cljs.core.truth_(ks)) {
          var G__14346 = ret__14344;
          var G__14347 = cljs.core.first.call(null, ks);
          var G__14348 = cljs.core.next.call(null, ks);
          coll = G__14346;
          k = G__14347;
          ks = G__14348;
          continue
        }else {
          return ret__14344
        }
        break
      }
    };
    var G__14345 = function(coll, k, var_args) {
      var ks = null;
      if(goog.isDef(var_args)) {
        ks = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__14345__delegate.call(this, coll, k, ks)
    };
    G__14345.cljs$lang$maxFixedArity = 2;
    G__14345.cljs$lang$applyTo = function(arglist__14349) {
      var coll = cljs.core.first(arglist__14349);
      var k = cljs.core.first(cljs.core.next(arglist__14349));
      var ks = cljs.core.rest(cljs.core.next(arglist__14349));
      return G__14345__delegate(coll, k, ks)
    };
    G__14345.cljs$lang$arity$variadic = G__14345__delegate;
    return G__14345
  }();
  dissoc = function(coll, k, var_args) {
    var ks = var_args;
    switch(arguments.length) {
      case 1:
        return dissoc__1.call(this, coll);
      case 2:
        return dissoc__2.call(this, coll, k);
      default:
        return dissoc__3.cljs$lang$arity$variadic(coll, k, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  dissoc.cljs$lang$maxFixedArity = 2;
  dissoc.cljs$lang$applyTo = dissoc__3.cljs$lang$applyTo;
  dissoc.cljs$lang$arity$1 = dissoc__1;
  dissoc.cljs$lang$arity$2 = dissoc__2;
  dissoc.cljs$lang$arity$variadic = dissoc__3.cljs$lang$arity$variadic;
  return dissoc
}();
cljs.core.with_meta = function with_meta(o, meta) {
  return cljs.core._with_meta.call(null, o, meta)
};
cljs.core.meta = function meta(o) {
  if(function() {
    var G__14353__14354 = o;
    if(G__14353__14354) {
      if(function() {
        var or__3824__auto____14355 = G__14353__14354.cljs$lang$protocol_mask$partition0$ & 131072;
        if(or__3824__auto____14355) {
          return or__3824__auto____14355
        }else {
          return G__14353__14354.cljs$core$IMeta$
        }
      }()) {
        return true
      }else {
        if(!G__14353__14354.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.IMeta, G__14353__14354)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.IMeta, G__14353__14354)
    }
  }()) {
    return cljs.core._meta.call(null, o)
  }else {
    return null
  }
};
cljs.core.peek = function peek(coll) {
  return cljs.core._peek.call(null, coll)
};
cljs.core.pop = function pop(coll) {
  return cljs.core._pop.call(null, coll)
};
cljs.core.disj = function() {
  var disj = null;
  var disj__1 = function(coll) {
    return coll
  };
  var disj__2 = function(coll, k) {
    return cljs.core._disjoin.call(null, coll, k)
  };
  var disj__3 = function() {
    var G__14358__delegate = function(coll, k, ks) {
      while(true) {
        var ret__14357 = disj.call(null, coll, k);
        if(cljs.core.truth_(ks)) {
          var G__14359 = ret__14357;
          var G__14360 = cljs.core.first.call(null, ks);
          var G__14361 = cljs.core.next.call(null, ks);
          coll = G__14359;
          k = G__14360;
          ks = G__14361;
          continue
        }else {
          return ret__14357
        }
        break
      }
    };
    var G__14358 = function(coll, k, var_args) {
      var ks = null;
      if(goog.isDef(var_args)) {
        ks = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__14358__delegate.call(this, coll, k, ks)
    };
    G__14358.cljs$lang$maxFixedArity = 2;
    G__14358.cljs$lang$applyTo = function(arglist__14362) {
      var coll = cljs.core.first(arglist__14362);
      var k = cljs.core.first(cljs.core.next(arglist__14362));
      var ks = cljs.core.rest(cljs.core.next(arglist__14362));
      return G__14358__delegate(coll, k, ks)
    };
    G__14358.cljs$lang$arity$variadic = G__14358__delegate;
    return G__14358
  }();
  disj = function(coll, k, var_args) {
    var ks = var_args;
    switch(arguments.length) {
      case 1:
        return disj__1.call(this, coll);
      case 2:
        return disj__2.call(this, coll, k);
      default:
        return disj__3.cljs$lang$arity$variadic(coll, k, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  disj.cljs$lang$maxFixedArity = 2;
  disj.cljs$lang$applyTo = disj__3.cljs$lang$applyTo;
  disj.cljs$lang$arity$1 = disj__1;
  disj.cljs$lang$arity$2 = disj__2;
  disj.cljs$lang$arity$variadic = disj__3.cljs$lang$arity$variadic;
  return disj
}();
cljs.core.string_hash_cache = {};
cljs.core.string_hash_cache_count = 0;
cljs.core.add_to_string_hash_cache = function add_to_string_hash_cache(k) {
  var h__14364 = goog.string.hashCode(k);
  cljs.core.string_hash_cache[k] = h__14364;
  cljs.core.string_hash_cache_count = cljs.core.string_hash_cache_count + 1;
  return h__14364
};
cljs.core.check_string_hash_cache = function check_string_hash_cache(k) {
  if(cljs.core.string_hash_cache_count > 255) {
    cljs.core.string_hash_cache = {};
    cljs.core.string_hash_cache_count = 0
  }else {
  }
  var h__14366 = cljs.core.string_hash_cache[k];
  if(!(h__14366 == null)) {
    return h__14366
  }else {
    return cljs.core.add_to_string_hash_cache.call(null, k)
  }
};
cljs.core.hash = function() {
  var hash = null;
  var hash__1 = function(o) {
    return hash.call(null, o, true)
  };
  var hash__2 = function(o, check_cache) {
    if(function() {
      var and__3822__auto____14368 = goog.isString(o);
      if(and__3822__auto____14368) {
        return check_cache
      }else {
        return and__3822__auto____14368
      }
    }()) {
      return cljs.core.check_string_hash_cache.call(null, o)
    }else {
      return cljs.core._hash.call(null, o)
    }
  };
  hash = function(o, check_cache) {
    switch(arguments.length) {
      case 1:
        return hash__1.call(this, o);
      case 2:
        return hash__2.call(this, o, check_cache)
    }
    throw"Invalid arity: " + arguments.length;
  };
  hash.cljs$lang$arity$1 = hash__1;
  hash.cljs$lang$arity$2 = hash__2;
  return hash
}();
cljs.core.empty_QMARK_ = function empty_QMARK_(coll) {
  return cljs.core.not.call(null, cljs.core.seq.call(null, coll))
};
cljs.core.coll_QMARK_ = function coll_QMARK_(x) {
  if(x == null) {
    return false
  }else {
    var G__14372__14373 = x;
    if(G__14372__14373) {
      if(function() {
        var or__3824__auto____14374 = G__14372__14373.cljs$lang$protocol_mask$partition0$ & 8;
        if(or__3824__auto____14374) {
          return or__3824__auto____14374
        }else {
          return G__14372__14373.cljs$core$ICollection$
        }
      }()) {
        return true
      }else {
        if(!G__14372__14373.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.ICollection, G__14372__14373)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.ICollection, G__14372__14373)
    }
  }
};
cljs.core.set_QMARK_ = function set_QMARK_(x) {
  if(x == null) {
    return false
  }else {
    var G__14378__14379 = x;
    if(G__14378__14379) {
      if(function() {
        var or__3824__auto____14380 = G__14378__14379.cljs$lang$protocol_mask$partition0$ & 4096;
        if(or__3824__auto____14380) {
          return or__3824__auto____14380
        }else {
          return G__14378__14379.cljs$core$ISet$
        }
      }()) {
        return true
      }else {
        if(!G__14378__14379.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.ISet, G__14378__14379)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.ISet, G__14378__14379)
    }
  }
};
cljs.core.associative_QMARK_ = function associative_QMARK_(x) {
  var G__14384__14385 = x;
  if(G__14384__14385) {
    if(function() {
      var or__3824__auto____14386 = G__14384__14385.cljs$lang$protocol_mask$partition0$ & 512;
      if(or__3824__auto____14386) {
        return or__3824__auto____14386
      }else {
        return G__14384__14385.cljs$core$IAssociative$
      }
    }()) {
      return true
    }else {
      if(!G__14384__14385.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IAssociative, G__14384__14385)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IAssociative, G__14384__14385)
  }
};
cljs.core.sequential_QMARK_ = function sequential_QMARK_(x) {
  var G__14390__14391 = x;
  if(G__14390__14391) {
    if(function() {
      var or__3824__auto____14392 = G__14390__14391.cljs$lang$protocol_mask$partition0$ & 16777216;
      if(or__3824__auto____14392) {
        return or__3824__auto____14392
      }else {
        return G__14390__14391.cljs$core$ISequential$
      }
    }()) {
      return true
    }else {
      if(!G__14390__14391.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.ISequential, G__14390__14391)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.ISequential, G__14390__14391)
  }
};
cljs.core.counted_QMARK_ = function counted_QMARK_(x) {
  var G__14396__14397 = x;
  if(G__14396__14397) {
    if(function() {
      var or__3824__auto____14398 = G__14396__14397.cljs$lang$protocol_mask$partition0$ & 2;
      if(or__3824__auto____14398) {
        return or__3824__auto____14398
      }else {
        return G__14396__14397.cljs$core$ICounted$
      }
    }()) {
      return true
    }else {
      if(!G__14396__14397.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.ICounted, G__14396__14397)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.ICounted, G__14396__14397)
  }
};
cljs.core.indexed_QMARK_ = function indexed_QMARK_(x) {
  var G__14402__14403 = x;
  if(G__14402__14403) {
    if(function() {
      var or__3824__auto____14404 = G__14402__14403.cljs$lang$protocol_mask$partition0$ & 16;
      if(or__3824__auto____14404) {
        return or__3824__auto____14404
      }else {
        return G__14402__14403.cljs$core$IIndexed$
      }
    }()) {
      return true
    }else {
      if(!G__14402__14403.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__14402__14403)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__14402__14403)
  }
};
cljs.core.reduceable_QMARK_ = function reduceable_QMARK_(x) {
  var G__14408__14409 = x;
  if(G__14408__14409) {
    if(function() {
      var or__3824__auto____14410 = G__14408__14409.cljs$lang$protocol_mask$partition0$ & 524288;
      if(or__3824__auto____14410) {
        return or__3824__auto____14410
      }else {
        return G__14408__14409.cljs$core$IReduce$
      }
    }()) {
      return true
    }else {
      if(!G__14408__14409.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__14408__14409)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__14408__14409)
  }
};
cljs.core.map_QMARK_ = function map_QMARK_(x) {
  if(x == null) {
    return false
  }else {
    var G__14414__14415 = x;
    if(G__14414__14415) {
      if(function() {
        var or__3824__auto____14416 = G__14414__14415.cljs$lang$protocol_mask$partition0$ & 1024;
        if(or__3824__auto____14416) {
          return or__3824__auto____14416
        }else {
          return G__14414__14415.cljs$core$IMap$
        }
      }()) {
        return true
      }else {
        if(!G__14414__14415.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.IMap, G__14414__14415)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.IMap, G__14414__14415)
    }
  }
};
cljs.core.vector_QMARK_ = function vector_QMARK_(x) {
  var G__14420__14421 = x;
  if(G__14420__14421) {
    if(function() {
      var or__3824__auto____14422 = G__14420__14421.cljs$lang$protocol_mask$partition0$ & 16384;
      if(or__3824__auto____14422) {
        return or__3824__auto____14422
      }else {
        return G__14420__14421.cljs$core$IVector$
      }
    }()) {
      return true
    }else {
      if(!G__14420__14421.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IVector, G__14420__14421)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IVector, G__14420__14421)
  }
};
cljs.core.chunked_seq_QMARK_ = function chunked_seq_QMARK_(x) {
  var G__14426__14427 = x;
  if(G__14426__14427) {
    if(cljs.core.truth_(function() {
      var or__3824__auto____14428 = null;
      if(cljs.core.truth_(or__3824__auto____14428)) {
        return or__3824__auto____14428
      }else {
        return G__14426__14427.cljs$core$IChunkedSeq$
      }
    }())) {
      return true
    }else {
      if(!G__14426__14427.cljs$lang$protocol_mask$partition$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IChunkedSeq, G__14426__14427)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IChunkedSeq, G__14426__14427)
  }
};
cljs.core.js_obj = function() {
  var js_obj = null;
  var js_obj__0 = function() {
    return{}
  };
  var js_obj__1 = function() {
    var G__14429__delegate = function(keyvals) {
      return cljs.core.apply.call(null, goog.object.create, keyvals)
    };
    var G__14429 = function(var_args) {
      var keyvals = null;
      if(goog.isDef(var_args)) {
        keyvals = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
      }
      return G__14429__delegate.call(this, keyvals)
    };
    G__14429.cljs$lang$maxFixedArity = 0;
    G__14429.cljs$lang$applyTo = function(arglist__14430) {
      var keyvals = cljs.core.seq(arglist__14430);
      return G__14429__delegate(keyvals)
    };
    G__14429.cljs$lang$arity$variadic = G__14429__delegate;
    return G__14429
  }();
  js_obj = function(var_args) {
    var keyvals = var_args;
    switch(arguments.length) {
      case 0:
        return js_obj__0.call(this);
      default:
        return js_obj__1.cljs$lang$arity$variadic(cljs.core.array_seq(arguments, 0))
    }
    throw"Invalid arity: " + arguments.length;
  };
  js_obj.cljs$lang$maxFixedArity = 0;
  js_obj.cljs$lang$applyTo = js_obj__1.cljs$lang$applyTo;
  js_obj.cljs$lang$arity$0 = js_obj__0;
  js_obj.cljs$lang$arity$variadic = js_obj__1.cljs$lang$arity$variadic;
  return js_obj
}();
cljs.core.js_keys = function js_keys(obj) {
  var keys__14432 = [];
  goog.object.forEach(obj, function(val, key, obj) {
    return keys__14432.push(key)
  });
  return keys__14432
};
cljs.core.js_delete = function js_delete(obj, key) {
  return delete obj[key]
};
cljs.core.array_copy = function array_copy(from, i, to, j, len) {
  var i__14436 = i;
  var j__14437 = j;
  var len__14438 = len;
  while(true) {
    if(len__14438 === 0) {
      return to
    }else {
      to[j__14437] = from[i__14436];
      var G__14439 = i__14436 + 1;
      var G__14440 = j__14437 + 1;
      var G__14441 = len__14438 - 1;
      i__14436 = G__14439;
      j__14437 = G__14440;
      len__14438 = G__14441;
      continue
    }
    break
  }
};
cljs.core.array_copy_downward = function array_copy_downward(from, i, to, j, len) {
  var i__14445 = i + (len - 1);
  var j__14446 = j + (len - 1);
  var len__14447 = len;
  while(true) {
    if(len__14447 === 0) {
      return to
    }else {
      to[j__14446] = from[i__14445];
      var G__14448 = i__14445 - 1;
      var G__14449 = j__14446 - 1;
      var G__14450 = len__14447 - 1;
      i__14445 = G__14448;
      j__14446 = G__14449;
      len__14447 = G__14450;
      continue
    }
    break
  }
};
cljs.core.lookup_sentinel = {};
cljs.core.false_QMARK_ = function false_QMARK_(x) {
  return x === false
};
cljs.core.true_QMARK_ = function true_QMARK_(x) {
  return x === true
};
cljs.core.undefined_QMARK_ = function undefined_QMARK_(x) {
  return void 0 === x
};
cljs.core.seq_QMARK_ = function seq_QMARK_(s) {
  if(s == null) {
    return false
  }else {
    var G__14454__14455 = s;
    if(G__14454__14455) {
      if(function() {
        var or__3824__auto____14456 = G__14454__14455.cljs$lang$protocol_mask$partition0$ & 64;
        if(or__3824__auto____14456) {
          return or__3824__auto____14456
        }else {
          return G__14454__14455.cljs$core$ISeq$
        }
      }()) {
        return true
      }else {
        if(!G__14454__14455.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__14454__14455)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__14454__14455)
    }
  }
};
cljs.core.seqable_QMARK_ = function seqable_QMARK_(s) {
  var G__14460__14461 = s;
  if(G__14460__14461) {
    if(function() {
      var or__3824__auto____14462 = G__14460__14461.cljs$lang$protocol_mask$partition0$ & 8388608;
      if(or__3824__auto____14462) {
        return or__3824__auto____14462
      }else {
        return G__14460__14461.cljs$core$ISeqable$
      }
    }()) {
      return true
    }else {
      if(!G__14460__14461.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.ISeqable, G__14460__14461)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.ISeqable, G__14460__14461)
  }
};
cljs.core.boolean$ = function boolean$(x) {
  if(cljs.core.truth_(x)) {
    return true
  }else {
    return false
  }
};
cljs.core.string_QMARK_ = function string_QMARK_(x) {
  var and__3822__auto____14465 = goog.isString(x);
  if(and__3822__auto____14465) {
    return!function() {
      var or__3824__auto____14466 = x.charAt(0) === "\ufdd0";
      if(or__3824__auto____14466) {
        return or__3824__auto____14466
      }else {
        return x.charAt(0) === "\ufdd1"
      }
    }()
  }else {
    return and__3822__auto____14465
  }
};
cljs.core.keyword_QMARK_ = function keyword_QMARK_(x) {
  var and__3822__auto____14468 = goog.isString(x);
  if(and__3822__auto____14468) {
    return x.charAt(0) === "\ufdd0"
  }else {
    return and__3822__auto____14468
  }
};
cljs.core.symbol_QMARK_ = function symbol_QMARK_(x) {
  var and__3822__auto____14470 = goog.isString(x);
  if(and__3822__auto____14470) {
    return x.charAt(0) === "\ufdd1"
  }else {
    return and__3822__auto____14470
  }
};
cljs.core.number_QMARK_ = function number_QMARK_(n) {
  return goog.isNumber(n)
};
cljs.core.fn_QMARK_ = function fn_QMARK_(f) {
  return goog.isFunction(f)
};
cljs.core.ifn_QMARK_ = function ifn_QMARK_(f) {
  var or__3824__auto____14475 = cljs.core.fn_QMARK_.call(null, f);
  if(or__3824__auto____14475) {
    return or__3824__auto____14475
  }else {
    var G__14476__14477 = f;
    if(G__14476__14477) {
      if(function() {
        var or__3824__auto____14478 = G__14476__14477.cljs$lang$protocol_mask$partition0$ & 1;
        if(or__3824__auto____14478) {
          return or__3824__auto____14478
        }else {
          return G__14476__14477.cljs$core$IFn$
        }
      }()) {
        return true
      }else {
        if(!G__14476__14477.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.IFn, G__14476__14477)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.IFn, G__14476__14477)
    }
  }
};
cljs.core.integer_QMARK_ = function integer_QMARK_(n) {
  var and__3822__auto____14480 = cljs.core.number_QMARK_.call(null, n);
  if(and__3822__auto____14480) {
    return n == n.toFixed()
  }else {
    return and__3822__auto____14480
  }
};
cljs.core.contains_QMARK_ = function contains_QMARK_(coll, v) {
  if(cljs.core._lookup.call(null, coll, v, cljs.core.lookup_sentinel) === cljs.core.lookup_sentinel) {
    return false
  }else {
    return true
  }
};
cljs.core.find = function find(coll, k) {
  if(cljs.core.truth_(function() {
    var and__3822__auto____14483 = coll;
    if(cljs.core.truth_(and__3822__auto____14483)) {
      var and__3822__auto____14484 = cljs.core.associative_QMARK_.call(null, coll);
      if(and__3822__auto____14484) {
        return cljs.core.contains_QMARK_.call(null, coll, k)
      }else {
        return and__3822__auto____14484
      }
    }else {
      return and__3822__auto____14483
    }
  }())) {
    return cljs.core.PersistentVector.fromArray([k, cljs.core._lookup.call(null, coll, k)], true)
  }else {
    return null
  }
};
cljs.core.distinct_QMARK_ = function() {
  var distinct_QMARK_ = null;
  var distinct_QMARK___1 = function(x) {
    return true
  };
  var distinct_QMARK___2 = function(x, y) {
    return!cljs.core._EQ_.call(null, x, y)
  };
  var distinct_QMARK___3 = function() {
    var G__14493__delegate = function(x, y, more) {
      if(!cljs.core._EQ_.call(null, x, y)) {
        var s__14489 = cljs.core.PersistentHashSet.fromArray([y, x]);
        var xs__14490 = more;
        while(true) {
          var x__14491 = cljs.core.first.call(null, xs__14490);
          var etc__14492 = cljs.core.next.call(null, xs__14490);
          if(cljs.core.truth_(xs__14490)) {
            if(cljs.core.contains_QMARK_.call(null, s__14489, x__14491)) {
              return false
            }else {
              var G__14494 = cljs.core.conj.call(null, s__14489, x__14491);
              var G__14495 = etc__14492;
              s__14489 = G__14494;
              xs__14490 = G__14495;
              continue
            }
          }else {
            return true
          }
          break
        }
      }else {
        return false
      }
    };
    var G__14493 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__14493__delegate.call(this, x, y, more)
    };
    G__14493.cljs$lang$maxFixedArity = 2;
    G__14493.cljs$lang$applyTo = function(arglist__14496) {
      var x = cljs.core.first(arglist__14496);
      var y = cljs.core.first(cljs.core.next(arglist__14496));
      var more = cljs.core.rest(cljs.core.next(arglist__14496));
      return G__14493__delegate(x, y, more)
    };
    G__14493.cljs$lang$arity$variadic = G__14493__delegate;
    return G__14493
  }();
  distinct_QMARK_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return distinct_QMARK___1.call(this, x);
      case 2:
        return distinct_QMARK___2.call(this, x, y);
      default:
        return distinct_QMARK___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  distinct_QMARK_.cljs$lang$maxFixedArity = 2;
  distinct_QMARK_.cljs$lang$applyTo = distinct_QMARK___3.cljs$lang$applyTo;
  distinct_QMARK_.cljs$lang$arity$1 = distinct_QMARK___1;
  distinct_QMARK_.cljs$lang$arity$2 = distinct_QMARK___2;
  distinct_QMARK_.cljs$lang$arity$variadic = distinct_QMARK___3.cljs$lang$arity$variadic;
  return distinct_QMARK_
}();
cljs.core.compare = function compare(x, y) {
  if(x === y) {
    return 0
  }else {
    if(x == null) {
      return-1
    }else {
      if(y == null) {
        return 1
      }else {
        if(cljs.core.type.call(null, x) === cljs.core.type.call(null, y)) {
          if(function() {
            var G__14500__14501 = x;
            if(G__14500__14501) {
              if(cljs.core.truth_(function() {
                var or__3824__auto____14502 = null;
                if(cljs.core.truth_(or__3824__auto____14502)) {
                  return or__3824__auto____14502
                }else {
                  return G__14500__14501.cljs$core$IComparable$
                }
              }())) {
                return true
              }else {
                if(!G__14500__14501.cljs$lang$protocol_mask$partition$) {
                  return cljs.core.type_satisfies_.call(null, cljs.core.IComparable, G__14500__14501)
                }else {
                  return false
                }
              }
            }else {
              return cljs.core.type_satisfies_.call(null, cljs.core.IComparable, G__14500__14501)
            }
          }()) {
            return cljs.core._compare.call(null, x, y)
          }else {
            return goog.array.defaultCompare(x, y)
          }
        }else {
          if("\ufdd0'else") {
            throw new Error("compare on non-nil objects of different types");
          }else {
            return null
          }
        }
      }
    }
  }
};
cljs.core.compare_indexed = function() {
  var compare_indexed = null;
  var compare_indexed__2 = function(xs, ys) {
    var xl__14507 = cljs.core.count.call(null, xs);
    var yl__14508 = cljs.core.count.call(null, ys);
    if(xl__14507 < yl__14508) {
      return-1
    }else {
      if(xl__14507 > yl__14508) {
        return 1
      }else {
        if("\ufdd0'else") {
          return compare_indexed.call(null, xs, ys, xl__14507, 0)
        }else {
          return null
        }
      }
    }
  };
  var compare_indexed__4 = function(xs, ys, len, n) {
    while(true) {
      var d__14509 = cljs.core.compare.call(null, cljs.core.nth.call(null, xs, n), cljs.core.nth.call(null, ys, n));
      if(function() {
        var and__3822__auto____14510 = d__14509 === 0;
        if(and__3822__auto____14510) {
          return n + 1 < len
        }else {
          return and__3822__auto____14510
        }
      }()) {
        var G__14511 = xs;
        var G__14512 = ys;
        var G__14513 = len;
        var G__14514 = n + 1;
        xs = G__14511;
        ys = G__14512;
        len = G__14513;
        n = G__14514;
        continue
      }else {
        return d__14509
      }
      break
    }
  };
  compare_indexed = function(xs, ys, len, n) {
    switch(arguments.length) {
      case 2:
        return compare_indexed__2.call(this, xs, ys);
      case 4:
        return compare_indexed__4.call(this, xs, ys, len, n)
    }
    throw"Invalid arity: " + arguments.length;
  };
  compare_indexed.cljs$lang$arity$2 = compare_indexed__2;
  compare_indexed.cljs$lang$arity$4 = compare_indexed__4;
  return compare_indexed
}();
cljs.core.fn__GT_comparator = function fn__GT_comparator(f) {
  if(cljs.core._EQ_.call(null, f, cljs.core.compare)) {
    return cljs.core.compare
  }else {
    return function(x, y) {
      var r__14516 = f.call(null, x, y);
      if(cljs.core.number_QMARK_.call(null, r__14516)) {
        return r__14516
      }else {
        if(cljs.core.truth_(r__14516)) {
          return-1
        }else {
          if(cljs.core.truth_(f.call(null, y, x))) {
            return 1
          }else {
            return 0
          }
        }
      }
    }
  }
};
cljs.core.sort = function() {
  var sort = null;
  var sort__1 = function(coll) {
    return sort.call(null, cljs.core.compare, coll)
  };
  var sort__2 = function(comp, coll) {
    if(cljs.core.seq.call(null, coll)) {
      var a__14518 = cljs.core.to_array.call(null, coll);
      goog.array.stableSort(a__14518, cljs.core.fn__GT_comparator.call(null, comp));
      return cljs.core.seq.call(null, a__14518)
    }else {
      return cljs.core.List.EMPTY
    }
  };
  sort = function(comp, coll) {
    switch(arguments.length) {
      case 1:
        return sort__1.call(this, comp);
      case 2:
        return sort__2.call(this, comp, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  sort.cljs$lang$arity$1 = sort__1;
  sort.cljs$lang$arity$2 = sort__2;
  return sort
}();
cljs.core.sort_by = function() {
  var sort_by = null;
  var sort_by__2 = function(keyfn, coll) {
    return sort_by.call(null, keyfn, cljs.core.compare, coll)
  };
  var sort_by__3 = function(keyfn, comp, coll) {
    return cljs.core.sort.call(null, function(x, y) {
      return cljs.core.fn__GT_comparator.call(null, comp).call(null, keyfn.call(null, x), keyfn.call(null, y))
    }, coll)
  };
  sort_by = function(keyfn, comp, coll) {
    switch(arguments.length) {
      case 2:
        return sort_by__2.call(this, keyfn, comp);
      case 3:
        return sort_by__3.call(this, keyfn, comp, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  sort_by.cljs$lang$arity$2 = sort_by__2;
  sort_by.cljs$lang$arity$3 = sort_by__3;
  return sort_by
}();
cljs.core.seq_reduce = function() {
  var seq_reduce = null;
  var seq_reduce__2 = function(f, coll) {
    var temp__3971__auto____14524 = cljs.core.seq.call(null, coll);
    if(temp__3971__auto____14524) {
      var s__14525 = temp__3971__auto____14524;
      return cljs.core.reduce.call(null, f, cljs.core.first.call(null, s__14525), cljs.core.next.call(null, s__14525))
    }else {
      return f.call(null)
    }
  };
  var seq_reduce__3 = function(f, val, coll) {
    var val__14526 = val;
    var coll__14527 = cljs.core.seq.call(null, coll);
    while(true) {
      if(coll__14527) {
        var nval__14528 = f.call(null, val__14526, cljs.core.first.call(null, coll__14527));
        if(cljs.core.reduced_QMARK_.call(null, nval__14528)) {
          return cljs.core.deref.call(null, nval__14528)
        }else {
          var G__14529 = nval__14528;
          var G__14530 = cljs.core.next.call(null, coll__14527);
          val__14526 = G__14529;
          coll__14527 = G__14530;
          continue
        }
      }else {
        return val__14526
      }
      break
    }
  };
  seq_reduce = function(f, val, coll) {
    switch(arguments.length) {
      case 2:
        return seq_reduce__2.call(this, f, val);
      case 3:
        return seq_reduce__3.call(this, f, val, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  seq_reduce.cljs$lang$arity$2 = seq_reduce__2;
  seq_reduce.cljs$lang$arity$3 = seq_reduce__3;
  return seq_reduce
}();
cljs.core.shuffle = function shuffle(coll) {
  var a__14532 = cljs.core.to_array.call(null, coll);
  goog.array.shuffle(a__14532);
  return cljs.core.vec.call(null, a__14532)
};
cljs.core.reduce = function() {
  var reduce = null;
  var reduce__2 = function(f, coll) {
    if(function() {
      var G__14539__14540 = coll;
      if(G__14539__14540) {
        if(function() {
          var or__3824__auto____14541 = G__14539__14540.cljs$lang$protocol_mask$partition0$ & 524288;
          if(or__3824__auto____14541) {
            return or__3824__auto____14541
          }else {
            return G__14539__14540.cljs$core$IReduce$
          }
        }()) {
          return true
        }else {
          if(!G__14539__14540.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__14539__14540)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__14539__14540)
      }
    }()) {
      return cljs.core._reduce.call(null, coll, f)
    }else {
      return cljs.core.seq_reduce.call(null, f, coll)
    }
  };
  var reduce__3 = function(f, val, coll) {
    if(function() {
      var G__14542__14543 = coll;
      if(G__14542__14543) {
        if(function() {
          var or__3824__auto____14544 = G__14542__14543.cljs$lang$protocol_mask$partition0$ & 524288;
          if(or__3824__auto____14544) {
            return or__3824__auto____14544
          }else {
            return G__14542__14543.cljs$core$IReduce$
          }
        }()) {
          return true
        }else {
          if(!G__14542__14543.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__14542__14543)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__14542__14543)
      }
    }()) {
      return cljs.core._reduce.call(null, coll, f, val)
    }else {
      return cljs.core.seq_reduce.call(null, f, val, coll)
    }
  };
  reduce = function(f, val, coll) {
    switch(arguments.length) {
      case 2:
        return reduce__2.call(this, f, val);
      case 3:
        return reduce__3.call(this, f, val, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  reduce.cljs$lang$arity$2 = reduce__2;
  reduce.cljs$lang$arity$3 = reduce__3;
  return reduce
}();
cljs.core.reduce_kv = function reduce_kv(f, init, coll) {
  return cljs.core._kv_reduce.call(null, coll, f, init)
};
cljs.core.Reduced = function(val) {
  this.val = val;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 32768
};
cljs.core.Reduced.cljs$lang$type = true;
cljs.core.Reduced.cljs$lang$ctorPrSeq = function(this__2309__auto__) {
  return cljs.core.list.call(null, "cljs.core/Reduced")
};
cljs.core.Reduced.prototype.cljs$core$IDeref$_deref$arity$1 = function(o) {
  var this__14545 = this;
  return this__14545.val
};
cljs.core.Reduced;
cljs.core.reduced_QMARK_ = function reduced_QMARK_(r) {
  return cljs.core.instance_QMARK_.call(null, cljs.core.Reduced, r)
};
cljs.core.reduced = function reduced(x) {
  return new cljs.core.Reduced(x)
};
cljs.core._PLUS_ = function() {
  var _PLUS_ = null;
  var _PLUS___0 = function() {
    return 0
  };
  var _PLUS___1 = function(x) {
    return x
  };
  var _PLUS___2 = function(x, y) {
    return x + y
  };
  var _PLUS___3 = function() {
    var G__14546__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, _PLUS_, x + y, more)
    };
    var G__14546 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__14546__delegate.call(this, x, y, more)
    };
    G__14546.cljs$lang$maxFixedArity = 2;
    G__14546.cljs$lang$applyTo = function(arglist__14547) {
      var x = cljs.core.first(arglist__14547);
      var y = cljs.core.first(cljs.core.next(arglist__14547));
      var more = cljs.core.rest(cljs.core.next(arglist__14547));
      return G__14546__delegate(x, y, more)
    };
    G__14546.cljs$lang$arity$variadic = G__14546__delegate;
    return G__14546
  }();
  _PLUS_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 0:
        return _PLUS___0.call(this);
      case 1:
        return _PLUS___1.call(this, x);
      case 2:
        return _PLUS___2.call(this, x, y);
      default:
        return _PLUS___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _PLUS_.cljs$lang$maxFixedArity = 2;
  _PLUS_.cljs$lang$applyTo = _PLUS___3.cljs$lang$applyTo;
  _PLUS_.cljs$lang$arity$0 = _PLUS___0;
  _PLUS_.cljs$lang$arity$1 = _PLUS___1;
  _PLUS_.cljs$lang$arity$2 = _PLUS___2;
  _PLUS_.cljs$lang$arity$variadic = _PLUS___3.cljs$lang$arity$variadic;
  return _PLUS_
}();
cljs.core._ = function() {
  var _ = null;
  var ___1 = function(x) {
    return-x
  };
  var ___2 = function(x, y) {
    return x - y
  };
  var ___3 = function() {
    var G__14548__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, _, x - y, more)
    };
    var G__14548 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__14548__delegate.call(this, x, y, more)
    };
    G__14548.cljs$lang$maxFixedArity = 2;
    G__14548.cljs$lang$applyTo = function(arglist__14549) {
      var x = cljs.core.first(arglist__14549);
      var y = cljs.core.first(cljs.core.next(arglist__14549));
      var more = cljs.core.rest(cljs.core.next(arglist__14549));
      return G__14548__delegate(x, y, more)
    };
    G__14548.cljs$lang$arity$variadic = G__14548__delegate;
    return G__14548
  }();
  _ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return ___1.call(this, x);
      case 2:
        return ___2.call(this, x, y);
      default:
        return ___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _.cljs$lang$maxFixedArity = 2;
  _.cljs$lang$applyTo = ___3.cljs$lang$applyTo;
  _.cljs$lang$arity$1 = ___1;
  _.cljs$lang$arity$2 = ___2;
  _.cljs$lang$arity$variadic = ___3.cljs$lang$arity$variadic;
  return _
}();
cljs.core._STAR_ = function() {
  var _STAR_ = null;
  var _STAR___0 = function() {
    return 1
  };
  var _STAR___1 = function(x) {
    return x
  };
  var _STAR___2 = function(x, y) {
    return x * y
  };
  var _STAR___3 = function() {
    var G__14550__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, _STAR_, x * y, more)
    };
    var G__14550 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__14550__delegate.call(this, x, y, more)
    };
    G__14550.cljs$lang$maxFixedArity = 2;
    G__14550.cljs$lang$applyTo = function(arglist__14551) {
      var x = cljs.core.first(arglist__14551);
      var y = cljs.core.first(cljs.core.next(arglist__14551));
      var more = cljs.core.rest(cljs.core.next(arglist__14551));
      return G__14550__delegate(x, y, more)
    };
    G__14550.cljs$lang$arity$variadic = G__14550__delegate;
    return G__14550
  }();
  _STAR_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 0:
        return _STAR___0.call(this);
      case 1:
        return _STAR___1.call(this, x);
      case 2:
        return _STAR___2.call(this, x, y);
      default:
        return _STAR___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _STAR_.cljs$lang$maxFixedArity = 2;
  _STAR_.cljs$lang$applyTo = _STAR___3.cljs$lang$applyTo;
  _STAR_.cljs$lang$arity$0 = _STAR___0;
  _STAR_.cljs$lang$arity$1 = _STAR___1;
  _STAR_.cljs$lang$arity$2 = _STAR___2;
  _STAR_.cljs$lang$arity$variadic = _STAR___3.cljs$lang$arity$variadic;
  return _STAR_
}();
cljs.core._SLASH_ = function() {
  var _SLASH_ = null;
  var _SLASH___1 = function(x) {
    return _SLASH_.call(null, 1, x)
  };
  var _SLASH___2 = function(x, y) {
    return x / y
  };
  var _SLASH___3 = function() {
    var G__14552__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, _SLASH_, _SLASH_.call(null, x, y), more)
    };
    var G__14552 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__14552__delegate.call(this, x, y, more)
    };
    G__14552.cljs$lang$maxFixedArity = 2;
    G__14552.cljs$lang$applyTo = function(arglist__14553) {
      var x = cljs.core.first(arglist__14553);
      var y = cljs.core.first(cljs.core.next(arglist__14553));
      var more = cljs.core.rest(cljs.core.next(arglist__14553));
      return G__14552__delegate(x, y, more)
    };
    G__14552.cljs$lang$arity$variadic = G__14552__delegate;
    return G__14552
  }();
  _SLASH_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _SLASH___1.call(this, x);
      case 2:
        return _SLASH___2.call(this, x, y);
      default:
        return _SLASH___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _SLASH_.cljs$lang$maxFixedArity = 2;
  _SLASH_.cljs$lang$applyTo = _SLASH___3.cljs$lang$applyTo;
  _SLASH_.cljs$lang$arity$1 = _SLASH___1;
  _SLASH_.cljs$lang$arity$2 = _SLASH___2;
  _SLASH_.cljs$lang$arity$variadic = _SLASH___3.cljs$lang$arity$variadic;
  return _SLASH_
}();
cljs.core._LT_ = function() {
  var _LT_ = null;
  var _LT___1 = function(x) {
    return true
  };
  var _LT___2 = function(x, y) {
    return x < y
  };
  var _LT___3 = function() {
    var G__14554__delegate = function(x, y, more) {
      while(true) {
        if(x < y) {
          if(cljs.core.next.call(null, more)) {
            var G__14555 = y;
            var G__14556 = cljs.core.first.call(null, more);
            var G__14557 = cljs.core.next.call(null, more);
            x = G__14555;
            y = G__14556;
            more = G__14557;
            continue
          }else {
            return y < cljs.core.first.call(null, more)
          }
        }else {
          return false
        }
        break
      }
    };
    var G__14554 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__14554__delegate.call(this, x, y, more)
    };
    G__14554.cljs$lang$maxFixedArity = 2;
    G__14554.cljs$lang$applyTo = function(arglist__14558) {
      var x = cljs.core.first(arglist__14558);
      var y = cljs.core.first(cljs.core.next(arglist__14558));
      var more = cljs.core.rest(cljs.core.next(arglist__14558));
      return G__14554__delegate(x, y, more)
    };
    G__14554.cljs$lang$arity$variadic = G__14554__delegate;
    return G__14554
  }();
  _LT_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _LT___1.call(this, x);
      case 2:
        return _LT___2.call(this, x, y);
      default:
        return _LT___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _LT_.cljs$lang$maxFixedArity = 2;
  _LT_.cljs$lang$applyTo = _LT___3.cljs$lang$applyTo;
  _LT_.cljs$lang$arity$1 = _LT___1;
  _LT_.cljs$lang$arity$2 = _LT___2;
  _LT_.cljs$lang$arity$variadic = _LT___3.cljs$lang$arity$variadic;
  return _LT_
}();
cljs.core._LT__EQ_ = function() {
  var _LT__EQ_ = null;
  var _LT__EQ___1 = function(x) {
    return true
  };
  var _LT__EQ___2 = function(x, y) {
    return x <= y
  };
  var _LT__EQ___3 = function() {
    var G__14559__delegate = function(x, y, more) {
      while(true) {
        if(x <= y) {
          if(cljs.core.next.call(null, more)) {
            var G__14560 = y;
            var G__14561 = cljs.core.first.call(null, more);
            var G__14562 = cljs.core.next.call(null, more);
            x = G__14560;
            y = G__14561;
            more = G__14562;
            continue
          }else {
            return y <= cljs.core.first.call(null, more)
          }
        }else {
          return false
        }
        break
      }
    };
    var G__14559 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__14559__delegate.call(this, x, y, more)
    };
    G__14559.cljs$lang$maxFixedArity = 2;
    G__14559.cljs$lang$applyTo = function(arglist__14563) {
      var x = cljs.core.first(arglist__14563);
      var y = cljs.core.first(cljs.core.next(arglist__14563));
      var more = cljs.core.rest(cljs.core.next(arglist__14563));
      return G__14559__delegate(x, y, more)
    };
    G__14559.cljs$lang$arity$variadic = G__14559__delegate;
    return G__14559
  }();
  _LT__EQ_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _LT__EQ___1.call(this, x);
      case 2:
        return _LT__EQ___2.call(this, x, y);
      default:
        return _LT__EQ___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _LT__EQ_.cljs$lang$maxFixedArity = 2;
  _LT__EQ_.cljs$lang$applyTo = _LT__EQ___3.cljs$lang$applyTo;
  _LT__EQ_.cljs$lang$arity$1 = _LT__EQ___1;
  _LT__EQ_.cljs$lang$arity$2 = _LT__EQ___2;
  _LT__EQ_.cljs$lang$arity$variadic = _LT__EQ___3.cljs$lang$arity$variadic;
  return _LT__EQ_
}();
cljs.core._GT_ = function() {
  var _GT_ = null;
  var _GT___1 = function(x) {
    return true
  };
  var _GT___2 = function(x, y) {
    return x > y
  };
  var _GT___3 = function() {
    var G__14564__delegate = function(x, y, more) {
      while(true) {
        if(x > y) {
          if(cljs.core.next.call(null, more)) {
            var G__14565 = y;
            var G__14566 = cljs.core.first.call(null, more);
            var G__14567 = cljs.core.next.call(null, more);
            x = G__14565;
            y = G__14566;
            more = G__14567;
            continue
          }else {
            return y > cljs.core.first.call(null, more)
          }
        }else {
          return false
        }
        break
      }
    };
    var G__14564 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__14564__delegate.call(this, x, y, more)
    };
    G__14564.cljs$lang$maxFixedArity = 2;
    G__14564.cljs$lang$applyTo = function(arglist__14568) {
      var x = cljs.core.first(arglist__14568);
      var y = cljs.core.first(cljs.core.next(arglist__14568));
      var more = cljs.core.rest(cljs.core.next(arglist__14568));
      return G__14564__delegate(x, y, more)
    };
    G__14564.cljs$lang$arity$variadic = G__14564__delegate;
    return G__14564
  }();
  _GT_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _GT___1.call(this, x);
      case 2:
        return _GT___2.call(this, x, y);
      default:
        return _GT___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _GT_.cljs$lang$maxFixedArity = 2;
  _GT_.cljs$lang$applyTo = _GT___3.cljs$lang$applyTo;
  _GT_.cljs$lang$arity$1 = _GT___1;
  _GT_.cljs$lang$arity$2 = _GT___2;
  _GT_.cljs$lang$arity$variadic = _GT___3.cljs$lang$arity$variadic;
  return _GT_
}();
cljs.core._GT__EQ_ = function() {
  var _GT__EQ_ = null;
  var _GT__EQ___1 = function(x) {
    return true
  };
  var _GT__EQ___2 = function(x, y) {
    return x >= y
  };
  var _GT__EQ___3 = function() {
    var G__14569__delegate = function(x, y, more) {
      while(true) {
        if(x >= y) {
          if(cljs.core.next.call(null, more)) {
            var G__14570 = y;
            var G__14571 = cljs.core.first.call(null, more);
            var G__14572 = cljs.core.next.call(null, more);
            x = G__14570;
            y = G__14571;
            more = G__14572;
            continue
          }else {
            return y >= cljs.core.first.call(null, more)
          }
        }else {
          return false
        }
        break
      }
    };
    var G__14569 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__14569__delegate.call(this, x, y, more)
    };
    G__14569.cljs$lang$maxFixedArity = 2;
    G__14569.cljs$lang$applyTo = function(arglist__14573) {
      var x = cljs.core.first(arglist__14573);
      var y = cljs.core.first(cljs.core.next(arglist__14573));
      var more = cljs.core.rest(cljs.core.next(arglist__14573));
      return G__14569__delegate(x, y, more)
    };
    G__14569.cljs$lang$arity$variadic = G__14569__delegate;
    return G__14569
  }();
  _GT__EQ_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _GT__EQ___1.call(this, x);
      case 2:
        return _GT__EQ___2.call(this, x, y);
      default:
        return _GT__EQ___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _GT__EQ_.cljs$lang$maxFixedArity = 2;
  _GT__EQ_.cljs$lang$applyTo = _GT__EQ___3.cljs$lang$applyTo;
  _GT__EQ_.cljs$lang$arity$1 = _GT__EQ___1;
  _GT__EQ_.cljs$lang$arity$2 = _GT__EQ___2;
  _GT__EQ_.cljs$lang$arity$variadic = _GT__EQ___3.cljs$lang$arity$variadic;
  return _GT__EQ_
}();
cljs.core.dec = function dec(x) {
  return x - 1
};
cljs.core.max = function() {
  var max = null;
  var max__1 = function(x) {
    return x
  };
  var max__2 = function(x, y) {
    return x > y ? x : y
  };
  var max__3 = function() {
    var G__14574__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, max, x > y ? x : y, more)
    };
    var G__14574 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__14574__delegate.call(this, x, y, more)
    };
    G__14574.cljs$lang$maxFixedArity = 2;
    G__14574.cljs$lang$applyTo = function(arglist__14575) {
      var x = cljs.core.first(arglist__14575);
      var y = cljs.core.first(cljs.core.next(arglist__14575));
      var more = cljs.core.rest(cljs.core.next(arglist__14575));
      return G__14574__delegate(x, y, more)
    };
    G__14574.cljs$lang$arity$variadic = G__14574__delegate;
    return G__14574
  }();
  max = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return max__1.call(this, x);
      case 2:
        return max__2.call(this, x, y);
      default:
        return max__3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  max.cljs$lang$maxFixedArity = 2;
  max.cljs$lang$applyTo = max__3.cljs$lang$applyTo;
  max.cljs$lang$arity$1 = max__1;
  max.cljs$lang$arity$2 = max__2;
  max.cljs$lang$arity$variadic = max__3.cljs$lang$arity$variadic;
  return max
}();
cljs.core.min = function() {
  var min = null;
  var min__1 = function(x) {
    return x
  };
  var min__2 = function(x, y) {
    return x < y ? x : y
  };
  var min__3 = function() {
    var G__14576__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, min, x < y ? x : y, more)
    };
    var G__14576 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__14576__delegate.call(this, x, y, more)
    };
    G__14576.cljs$lang$maxFixedArity = 2;
    G__14576.cljs$lang$applyTo = function(arglist__14577) {
      var x = cljs.core.first(arglist__14577);
      var y = cljs.core.first(cljs.core.next(arglist__14577));
      var more = cljs.core.rest(cljs.core.next(arglist__14577));
      return G__14576__delegate(x, y, more)
    };
    G__14576.cljs$lang$arity$variadic = G__14576__delegate;
    return G__14576
  }();
  min = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return min__1.call(this, x);
      case 2:
        return min__2.call(this, x, y);
      default:
        return min__3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  min.cljs$lang$maxFixedArity = 2;
  min.cljs$lang$applyTo = min__3.cljs$lang$applyTo;
  min.cljs$lang$arity$1 = min__1;
  min.cljs$lang$arity$2 = min__2;
  min.cljs$lang$arity$variadic = min__3.cljs$lang$arity$variadic;
  return min
}();
cljs.core.fix = function fix(q) {
  if(q >= 0) {
    return Math.floor.call(null, q)
  }else {
    return Math.ceil.call(null, q)
  }
};
cljs.core.int$ = function int$(x) {
  return cljs.core.fix.call(null, x)
};
cljs.core.long$ = function long$(x) {
  return cljs.core.fix.call(null, x)
};
cljs.core.mod = function mod(n, d) {
  return n % d
};
cljs.core.quot = function quot(n, d) {
  var rem__14579 = n % d;
  return cljs.core.fix.call(null, (n - rem__14579) / d)
};
cljs.core.rem = function rem(n, d) {
  var q__14581 = cljs.core.quot.call(null, n, d);
  return n - d * q__14581
};
cljs.core.rand = function() {
  var rand = null;
  var rand__0 = function() {
    return Math.random.call(null)
  };
  var rand__1 = function(n) {
    return n * rand.call(null)
  };
  rand = function(n) {
    switch(arguments.length) {
      case 0:
        return rand__0.call(this);
      case 1:
        return rand__1.call(this, n)
    }
    throw"Invalid arity: " + arguments.length;
  };
  rand.cljs$lang$arity$0 = rand__0;
  rand.cljs$lang$arity$1 = rand__1;
  return rand
}();
cljs.core.rand_int = function rand_int(n) {
  return cljs.core.fix.call(null, cljs.core.rand.call(null, n))
};
cljs.core.bit_xor = function bit_xor(x, y) {
  return x ^ y
};
cljs.core.bit_and = function bit_and(x, y) {
  return x & y
};
cljs.core.bit_or = function bit_or(x, y) {
  return x | y
};
cljs.core.bit_and_not = function bit_and_not(x, y) {
  return x & ~y
};
cljs.core.bit_clear = function bit_clear(x, n) {
  return x & ~(1 << n)
};
cljs.core.bit_flip = function bit_flip(x, n) {
  return x ^ 1 << n
};
cljs.core.bit_not = function bit_not(x) {
  return~x
};
cljs.core.bit_set = function bit_set(x, n) {
  return x | 1 << n
};
cljs.core.bit_test = function bit_test(x, n) {
  return(x & 1 << n) != 0
};
cljs.core.bit_shift_left = function bit_shift_left(x, n) {
  return x << n
};
cljs.core.bit_shift_right = function bit_shift_right(x, n) {
  return x >> n
};
cljs.core.bit_shift_right_zero_fill = function bit_shift_right_zero_fill(x, n) {
  return x >>> n
};
cljs.core.bit_count = function bit_count(v) {
  var v__14584 = v - (v >> 1 & 1431655765);
  var v__14585 = (v__14584 & 858993459) + (v__14584 >> 2 & 858993459);
  return(v__14585 + (v__14585 >> 4) & 252645135) * 16843009 >> 24
};
cljs.core._EQ__EQ_ = function() {
  var _EQ__EQ_ = null;
  var _EQ__EQ___1 = function(x) {
    return true
  };
  var _EQ__EQ___2 = function(x, y) {
    return cljs.core._equiv.call(null, x, y)
  };
  var _EQ__EQ___3 = function() {
    var G__14586__delegate = function(x, y, more) {
      while(true) {
        if(cljs.core.truth_(_EQ__EQ_.call(null, x, y))) {
          if(cljs.core.next.call(null, more)) {
            var G__14587 = y;
            var G__14588 = cljs.core.first.call(null, more);
            var G__14589 = cljs.core.next.call(null, more);
            x = G__14587;
            y = G__14588;
            more = G__14589;
            continue
          }else {
            return _EQ__EQ_.call(null, y, cljs.core.first.call(null, more))
          }
        }else {
          return false
        }
        break
      }
    };
    var G__14586 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__14586__delegate.call(this, x, y, more)
    };
    G__14586.cljs$lang$maxFixedArity = 2;
    G__14586.cljs$lang$applyTo = function(arglist__14590) {
      var x = cljs.core.first(arglist__14590);
      var y = cljs.core.first(cljs.core.next(arglist__14590));
      var more = cljs.core.rest(cljs.core.next(arglist__14590));
      return G__14586__delegate(x, y, more)
    };
    G__14586.cljs$lang$arity$variadic = G__14586__delegate;
    return G__14586
  }();
  _EQ__EQ_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _EQ__EQ___1.call(this, x);
      case 2:
        return _EQ__EQ___2.call(this, x, y);
      default:
        return _EQ__EQ___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _EQ__EQ_.cljs$lang$maxFixedArity = 2;
  _EQ__EQ_.cljs$lang$applyTo = _EQ__EQ___3.cljs$lang$applyTo;
  _EQ__EQ_.cljs$lang$arity$1 = _EQ__EQ___1;
  _EQ__EQ_.cljs$lang$arity$2 = _EQ__EQ___2;
  _EQ__EQ_.cljs$lang$arity$variadic = _EQ__EQ___3.cljs$lang$arity$variadic;
  return _EQ__EQ_
}();
cljs.core.pos_QMARK_ = function pos_QMARK_(n) {
  return n > 0
};
cljs.core.zero_QMARK_ = function zero_QMARK_(n) {
  return n === 0
};
cljs.core.neg_QMARK_ = function neg_QMARK_(x) {
  return x < 0
};
cljs.core.nthnext = function nthnext(coll, n) {
  var n__14594 = n;
  var xs__14595 = cljs.core.seq.call(null, coll);
  while(true) {
    if(cljs.core.truth_(function() {
      var and__3822__auto____14596 = xs__14595;
      if(and__3822__auto____14596) {
        return n__14594 > 0
      }else {
        return and__3822__auto____14596
      }
    }())) {
      var G__14597 = n__14594 - 1;
      var G__14598 = cljs.core.next.call(null, xs__14595);
      n__14594 = G__14597;
      xs__14595 = G__14598;
      continue
    }else {
      return xs__14595
    }
    break
  }
};
cljs.core.str_STAR_ = function() {
  var str_STAR_ = null;
  var str_STAR___0 = function() {
    return""
  };
  var str_STAR___1 = function(x) {
    if(x == null) {
      return""
    }else {
      if("\ufdd0'else") {
        return x.toString()
      }else {
        return null
      }
    }
  };
  var str_STAR___2 = function() {
    var G__14599__delegate = function(x, ys) {
      return function(sb, more) {
        while(true) {
          if(cljs.core.truth_(more)) {
            var G__14600 = sb.append(str_STAR_.call(null, cljs.core.first.call(null, more)));
            var G__14601 = cljs.core.next.call(null, more);
            sb = G__14600;
            more = G__14601;
            continue
          }else {
            return str_STAR_.call(null, sb)
          }
          break
        }
      }.call(null, new goog.string.StringBuffer(str_STAR_.call(null, x)), ys)
    };
    var G__14599 = function(x, var_args) {
      var ys = null;
      if(goog.isDef(var_args)) {
        ys = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__14599__delegate.call(this, x, ys)
    };
    G__14599.cljs$lang$maxFixedArity = 1;
    G__14599.cljs$lang$applyTo = function(arglist__14602) {
      var x = cljs.core.first(arglist__14602);
      var ys = cljs.core.rest(arglist__14602);
      return G__14599__delegate(x, ys)
    };
    G__14599.cljs$lang$arity$variadic = G__14599__delegate;
    return G__14599
  }();
  str_STAR_ = function(x, var_args) {
    var ys = var_args;
    switch(arguments.length) {
      case 0:
        return str_STAR___0.call(this);
      case 1:
        return str_STAR___1.call(this, x);
      default:
        return str_STAR___2.cljs$lang$arity$variadic(x, cljs.core.array_seq(arguments, 1))
    }
    throw"Invalid arity: " + arguments.length;
  };
  str_STAR_.cljs$lang$maxFixedArity = 1;
  str_STAR_.cljs$lang$applyTo = str_STAR___2.cljs$lang$applyTo;
  str_STAR_.cljs$lang$arity$0 = str_STAR___0;
  str_STAR_.cljs$lang$arity$1 = str_STAR___1;
  str_STAR_.cljs$lang$arity$variadic = str_STAR___2.cljs$lang$arity$variadic;
  return str_STAR_
}();
cljs.core.str = function() {
  var str = null;
  var str__0 = function() {
    return""
  };
  var str__1 = function(x) {
    if(cljs.core.symbol_QMARK_.call(null, x)) {
      return x.substring(2, x.length)
    }else {
      if(cljs.core.keyword_QMARK_.call(null, x)) {
        return cljs.core.str_STAR_.call(null, ":", x.substring(2, x.length))
      }else {
        if(x == null) {
          return""
        }else {
          if("\ufdd0'else") {
            return x.toString()
          }else {
            return null
          }
        }
      }
    }
  };
  var str__2 = function() {
    var G__14603__delegate = function(x, ys) {
      return function(sb, more) {
        while(true) {
          if(cljs.core.truth_(more)) {
            var G__14604 = sb.append(str.call(null, cljs.core.first.call(null, more)));
            var G__14605 = cljs.core.next.call(null, more);
            sb = G__14604;
            more = G__14605;
            continue
          }else {
            return cljs.core.str_STAR_.call(null, sb)
          }
          break
        }
      }.call(null, new goog.string.StringBuffer(str.call(null, x)), ys)
    };
    var G__14603 = function(x, var_args) {
      var ys = null;
      if(goog.isDef(var_args)) {
        ys = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__14603__delegate.call(this, x, ys)
    };
    G__14603.cljs$lang$maxFixedArity = 1;
    G__14603.cljs$lang$applyTo = function(arglist__14606) {
      var x = cljs.core.first(arglist__14606);
      var ys = cljs.core.rest(arglist__14606);
      return G__14603__delegate(x, ys)
    };
    G__14603.cljs$lang$arity$variadic = G__14603__delegate;
    return G__14603
  }();
  str = function(x, var_args) {
    var ys = var_args;
    switch(arguments.length) {
      case 0:
        return str__0.call(this);
      case 1:
        return str__1.call(this, x);
      default:
        return str__2.cljs$lang$arity$variadic(x, cljs.core.array_seq(arguments, 1))
    }
    throw"Invalid arity: " + arguments.length;
  };
  str.cljs$lang$maxFixedArity = 1;
  str.cljs$lang$applyTo = str__2.cljs$lang$applyTo;
  str.cljs$lang$arity$0 = str__0;
  str.cljs$lang$arity$1 = str__1;
  str.cljs$lang$arity$variadic = str__2.cljs$lang$arity$variadic;
  return str
}();
cljs.core.subs = function() {
  var subs = null;
  var subs__2 = function(s, start) {
    return s.substring(start)
  };
  var subs__3 = function(s, start, end) {
    return s.substring(start, end)
  };
  subs = function(s, start, end) {
    switch(arguments.length) {
      case 2:
        return subs__2.call(this, s, start);
      case 3:
        return subs__3.call(this, s, start, end)
    }
    throw"Invalid arity: " + arguments.length;
  };
  subs.cljs$lang$arity$2 = subs__2;
  subs.cljs$lang$arity$3 = subs__3;
  return subs
}();
cljs.core.format = function() {
  var format__delegate = function(fmt, args) {
    return cljs.core.apply.call(null, goog.string.format, fmt, args)
  };
  var format = function(fmt, var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return format__delegate.call(this, fmt, args)
  };
  format.cljs$lang$maxFixedArity = 1;
  format.cljs$lang$applyTo = function(arglist__14607) {
    var fmt = cljs.core.first(arglist__14607);
    var args = cljs.core.rest(arglist__14607);
    return format__delegate(fmt, args)
  };
  format.cljs$lang$arity$variadic = format__delegate;
  return format
}();
cljs.core.symbol = function() {
  var symbol = null;
  var symbol__1 = function(name) {
    if(cljs.core.symbol_QMARK_.call(null, name)) {
      name
    }else {
      if(cljs.core.keyword_QMARK_.call(null, name)) {
        cljs.core.str_STAR_.call(null, "\ufdd1", "'", cljs.core.subs.call(null, name, 2))
      }else {
      }
    }
    return cljs.core.str_STAR_.call(null, "\ufdd1", "'", name)
  };
  var symbol__2 = function(ns, name) {
    return symbol.call(null, cljs.core.str_STAR_.call(null, ns, "/", name))
  };
  symbol = function(ns, name) {
    switch(arguments.length) {
      case 1:
        return symbol__1.call(this, ns);
      case 2:
        return symbol__2.call(this, ns, name)
    }
    throw"Invalid arity: " + arguments.length;
  };
  symbol.cljs$lang$arity$1 = symbol__1;
  symbol.cljs$lang$arity$2 = symbol__2;
  return symbol
}();
cljs.core.keyword = function() {
  var keyword = null;
  var keyword__1 = function(name) {
    if(cljs.core.keyword_QMARK_.call(null, name)) {
      return name
    }else {
      if(cljs.core.symbol_QMARK_.call(null, name)) {
        return cljs.core.str_STAR_.call(null, "\ufdd0", "'", cljs.core.subs.call(null, name, 2))
      }else {
        if("\ufdd0'else") {
          return cljs.core.str_STAR_.call(null, "\ufdd0", "'", name)
        }else {
          return null
        }
      }
    }
  };
  var keyword__2 = function(ns, name) {
    return keyword.call(null, cljs.core.str_STAR_.call(null, ns, "/", name))
  };
  keyword = function(ns, name) {
    switch(arguments.length) {
      case 1:
        return keyword__1.call(this, ns);
      case 2:
        return keyword__2.call(this, ns, name)
    }
    throw"Invalid arity: " + arguments.length;
  };
  keyword.cljs$lang$arity$1 = keyword__1;
  keyword.cljs$lang$arity$2 = keyword__2;
  return keyword
}();
cljs.core.equiv_sequential = function equiv_sequential(x, y) {
  return cljs.core.boolean$.call(null, cljs.core.sequential_QMARK_.call(null, y) ? function() {
    var xs__14610 = cljs.core.seq.call(null, x);
    var ys__14611 = cljs.core.seq.call(null, y);
    while(true) {
      if(xs__14610 == null) {
        return ys__14611 == null
      }else {
        if(ys__14611 == null) {
          return false
        }else {
          if(cljs.core._EQ_.call(null, cljs.core.first.call(null, xs__14610), cljs.core.first.call(null, ys__14611))) {
            var G__14612 = cljs.core.next.call(null, xs__14610);
            var G__14613 = cljs.core.next.call(null, ys__14611);
            xs__14610 = G__14612;
            ys__14611 = G__14613;
            continue
          }else {
            if("\ufdd0'else") {
              return false
            }else {
              return null
            }
          }
        }
      }
      break
    }
  }() : null)
};
cljs.core.hash_combine = function hash_combine(seed, hash) {
  return seed ^ hash + 2654435769 + (seed << 6) + (seed >> 2)
};
cljs.core.hash_coll = function hash_coll(coll) {
  return cljs.core.reduce.call(null, function(p1__14614_SHARP_, p2__14615_SHARP_) {
    return cljs.core.hash_combine.call(null, p1__14614_SHARP_, cljs.core.hash.call(null, p2__14615_SHARP_, false))
  }, cljs.core.hash.call(null, cljs.core.first.call(null, coll), false), cljs.core.next.call(null, coll))
};
cljs.core.hash_imap = function hash_imap(m) {
  var h__14619 = 0;
  var s__14620 = cljs.core.seq.call(null, m);
  while(true) {
    if(s__14620) {
      var e__14621 = cljs.core.first.call(null, s__14620);
      var G__14622 = (h__14619 + (cljs.core.hash.call(null, cljs.core.key.call(null, e__14621)) ^ cljs.core.hash.call(null, cljs.core.val.call(null, e__14621)))) % 4503599627370496;
      var G__14623 = cljs.core.next.call(null, s__14620);
      h__14619 = G__14622;
      s__14620 = G__14623;
      continue
    }else {
      return h__14619
    }
    break
  }
};
cljs.core.hash_iset = function hash_iset(s) {
  var h__14627 = 0;
  var s__14628 = cljs.core.seq.call(null, s);
  while(true) {
    if(s__14628) {
      var e__14629 = cljs.core.first.call(null, s__14628);
      var G__14630 = (h__14627 + cljs.core.hash.call(null, e__14629)) % 4503599627370496;
      var G__14631 = cljs.core.next.call(null, s__14628);
      h__14627 = G__14630;
      s__14628 = G__14631;
      continue
    }else {
      return h__14627
    }
    break
  }
};
cljs.core.extend_object_BANG_ = function extend_object_BANG_(obj, fn_map) {
  var G__14652__14653 = cljs.core.seq.call(null, fn_map);
  if(G__14652__14653) {
    var G__14655__14657 = cljs.core.first.call(null, G__14652__14653);
    var vec__14656__14658 = G__14655__14657;
    var key_name__14659 = cljs.core.nth.call(null, vec__14656__14658, 0, null);
    var f__14660 = cljs.core.nth.call(null, vec__14656__14658, 1, null);
    var G__14652__14661 = G__14652__14653;
    var G__14655__14662 = G__14655__14657;
    var G__14652__14663 = G__14652__14661;
    while(true) {
      var vec__14664__14665 = G__14655__14662;
      var key_name__14666 = cljs.core.nth.call(null, vec__14664__14665, 0, null);
      var f__14667 = cljs.core.nth.call(null, vec__14664__14665, 1, null);
      var G__14652__14668 = G__14652__14663;
      var str_name__14669 = cljs.core.name.call(null, key_name__14666);
      obj[str_name__14669] = f__14667;
      var temp__3974__auto____14670 = cljs.core.next.call(null, G__14652__14668);
      if(temp__3974__auto____14670) {
        var G__14652__14671 = temp__3974__auto____14670;
        var G__14672 = cljs.core.first.call(null, G__14652__14671);
        var G__14673 = G__14652__14671;
        G__14655__14662 = G__14672;
        G__14652__14663 = G__14673;
        continue
      }else {
      }
      break
    }
  }else {
  }
  return obj
};
cljs.core.List = function(meta, first, rest, count, __hash) {
  this.meta = meta;
  this.first = first;
  this.rest = rest;
  this.count = count;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 65413358
};
cljs.core.List.cljs$lang$type = true;
cljs.core.List.cljs$lang$ctorPrSeq = function(this__2309__auto__) {
  return cljs.core.list.call(null, "cljs.core/List")
};
cljs.core.List.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__14674 = this;
  var h__2192__auto____14675 = this__14674.__hash;
  if(!(h__2192__auto____14675 == null)) {
    return h__2192__auto____14675
  }else {
    var h__2192__auto____14676 = cljs.core.hash_coll.call(null, coll);
    this__14674.__hash = h__2192__auto____14676;
    return h__2192__auto____14676
  }
};
cljs.core.List.prototype.cljs$core$INext$_next$arity$1 = function(coll) {
  var this__14677 = this;
  if(this__14677.count === 1) {
    return null
  }else {
    return this__14677.rest
  }
};
cljs.core.List.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__14678 = this;
  return new cljs.core.List(this__14678.meta, o, coll, this__14678.count + 1, null)
};
cljs.core.List.prototype.toString = function() {
  var this__14679 = this;
  var this__14680 = this;
  return cljs.core.pr_str.call(null, this__14680)
};
cljs.core.List.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__14681 = this;
  return coll
};
cljs.core.List.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__14682 = this;
  return this__14682.count
};
cljs.core.List.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__14683 = this;
  return this__14683.first
};
cljs.core.List.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__14684 = this;
  return coll.cljs$core$ISeq$_rest$arity$1(coll)
};
cljs.core.List.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__14685 = this;
  return this__14685.first
};
cljs.core.List.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__14686 = this;
  if(this__14686.count === 1) {
    return cljs.core.List.EMPTY
  }else {
    return this__14686.rest
  }
};
cljs.core.List.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__14687 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.List.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__14688 = this;
  return new cljs.core.List(meta, this__14688.first, this__14688.rest, this__14688.count, this__14688.__hash)
};
cljs.core.List.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__14689 = this;
  return this__14689.meta
};
cljs.core.List.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__14690 = this;
  return cljs.core.List.EMPTY
};
cljs.core.List;
cljs.core.EmptyList = function(meta) {
  this.meta = meta;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 65413326
};
cljs.core.EmptyList.cljs$lang$type = true;
cljs.core.EmptyList.cljs$lang$ctorPrSeq = function(this__2309__auto__) {
  return cljs.core.list.call(null, "cljs.core/EmptyList")
};
cljs.core.EmptyList.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__14691 = this;
  return 0
};
cljs.core.EmptyList.prototype.cljs$core$INext$_next$arity$1 = function(coll) {
  var this__14692 = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__14693 = this;
  return new cljs.core.List(this__14693.meta, o, null, 1, null)
};
cljs.core.EmptyList.prototype.toString = function() {
  var this__14694 = this;
  var this__14695 = this;
  return cljs.core.pr_str.call(null, this__14695)
};
cljs.core.EmptyList.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__14696 = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__14697 = this;
  return 0
};
cljs.core.EmptyList.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__14698 = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__14699 = this;
  throw new Error("Can't pop empty list");
};
cljs.core.EmptyList.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__14700 = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__14701 = this;
  return cljs.core.List.EMPTY
};
cljs.core.EmptyList.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__14702 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.EmptyList.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__14703 = this;
  return new cljs.core.EmptyList(meta)
};
cljs.core.EmptyList.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__14704 = this;
  return this__14704.meta
};
cljs.core.EmptyList.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__14705 = this;
  return coll
};
cljs.core.EmptyList;
cljs.core.List.EMPTY = new cljs.core.EmptyList(null);
cljs.core.reversible_QMARK_ = function reversible_QMARK_(coll) {
  var G__14709__14710 = coll;
  if(G__14709__14710) {
    if(function() {
      var or__3824__auto____14711 = G__14709__14710.cljs$lang$protocol_mask$partition0$ & 134217728;
      if(or__3824__auto____14711) {
        return or__3824__auto____14711
      }else {
        return G__14709__14710.cljs$core$IReversible$
      }
    }()) {
      return true
    }else {
      if(!G__14709__14710.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IReversible, G__14709__14710)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IReversible, G__14709__14710)
  }
};
cljs.core.rseq = function rseq(coll) {
  return cljs.core._rseq.call(null, coll)
};
cljs.core.reverse = function reverse(coll) {
  if(cljs.core.reversible_QMARK_.call(null, coll)) {
    return cljs.core.rseq.call(null, coll)
  }else {
    return cljs.core.reduce.call(null, cljs.core.conj, cljs.core.List.EMPTY, coll)
  }
};
cljs.core.list = function() {
  var list = null;
  var list__0 = function() {
    return cljs.core.List.EMPTY
  };
  var list__1 = function(x) {
    return cljs.core.conj.call(null, cljs.core.List.EMPTY, x)
  };
  var list__2 = function(x, y) {
    return cljs.core.conj.call(null, list.call(null, y), x)
  };
  var list__3 = function(x, y, z) {
    return cljs.core.conj.call(null, list.call(null, y, z), x)
  };
  var list__4 = function() {
    var G__14712__delegate = function(x, y, z, items) {
      return cljs.core.conj.call(null, cljs.core.conj.call(null, cljs.core.conj.call(null, cljs.core.reduce.call(null, cljs.core.conj, cljs.core.List.EMPTY, cljs.core.reverse.call(null, items)), z), y), x)
    };
    var G__14712 = function(x, y, z, var_args) {
      var items = null;
      if(goog.isDef(var_args)) {
        items = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__14712__delegate.call(this, x, y, z, items)
    };
    G__14712.cljs$lang$maxFixedArity = 3;
    G__14712.cljs$lang$applyTo = function(arglist__14713) {
      var x = cljs.core.first(arglist__14713);
      var y = cljs.core.first(cljs.core.next(arglist__14713));
      var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__14713)));
      var items = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__14713)));
      return G__14712__delegate(x, y, z, items)
    };
    G__14712.cljs$lang$arity$variadic = G__14712__delegate;
    return G__14712
  }();
  list = function(x, y, z, var_args) {
    var items = var_args;
    switch(arguments.length) {
      case 0:
        return list__0.call(this);
      case 1:
        return list__1.call(this, x);
      case 2:
        return list__2.call(this, x, y);
      case 3:
        return list__3.call(this, x, y, z);
      default:
        return list__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
    }
    throw"Invalid arity: " + arguments.length;
  };
  list.cljs$lang$maxFixedArity = 3;
  list.cljs$lang$applyTo = list__4.cljs$lang$applyTo;
  list.cljs$lang$arity$0 = list__0;
  list.cljs$lang$arity$1 = list__1;
  list.cljs$lang$arity$2 = list__2;
  list.cljs$lang$arity$3 = list__3;
  list.cljs$lang$arity$variadic = list__4.cljs$lang$arity$variadic;
  return list
}();
cljs.core.Cons = function(meta, first, rest, __hash) {
  this.meta = meta;
  this.first = first;
  this.rest = rest;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 65405164
};
cljs.core.Cons.cljs$lang$type = true;
cljs.core.Cons.cljs$lang$ctorPrSeq = function(this__2309__auto__) {
  return cljs.core.list.call(null, "cljs.core/Cons")
};
cljs.core.Cons.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__14714 = this;
  var h__2192__auto____14715 = this__14714.__hash;
  if(!(h__2192__auto____14715 == null)) {
    return h__2192__auto____14715
  }else {
    var h__2192__auto____14716 = cljs.core.hash_coll.call(null, coll);
    this__14714.__hash = h__2192__auto____14716;
    return h__2192__auto____14716
  }
};
cljs.core.Cons.prototype.cljs$core$INext$_next$arity$1 = function(coll) {
  var this__14717 = this;
  if(this__14717.rest == null) {
    return null
  }else {
    return cljs.core._seq.call(null, this__14717.rest)
  }
};
cljs.core.Cons.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__14718 = this;
  return new cljs.core.Cons(null, o, coll, this__14718.__hash)
};
cljs.core.Cons.prototype.toString = function() {
  var this__14719 = this;
  var this__14720 = this;
  return cljs.core.pr_str.call(null, this__14720)
};
cljs.core.Cons.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__14721 = this;
  return coll
};
cljs.core.Cons.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__14722 = this;
  return this__14722.first
};
cljs.core.Cons.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__14723 = this;
  if(this__14723.rest == null) {
    return cljs.core.List.EMPTY
  }else {
    return this__14723.rest
  }
};
cljs.core.Cons.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__14724 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.Cons.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__14725 = this;
  return new cljs.core.Cons(meta, this__14725.first, this__14725.rest, this__14725.__hash)
};
cljs.core.Cons.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__14726 = this;
  return this__14726.meta
};
cljs.core.Cons.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__14727 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__14727.meta)
};
cljs.core.Cons;
cljs.core.cons = function cons(x, coll) {
  if(function() {
    var or__3824__auto____14732 = coll == null;
    if(or__3824__auto____14732) {
      return or__3824__auto____14732
    }else {
      var G__14733__14734 = coll;
      if(G__14733__14734) {
        if(function() {
          var or__3824__auto____14735 = G__14733__14734.cljs$lang$protocol_mask$partition0$ & 64;
          if(or__3824__auto____14735) {
            return or__3824__auto____14735
          }else {
            return G__14733__14734.cljs$core$ISeq$
          }
        }()) {
          return true
        }else {
          if(!G__14733__14734.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__14733__14734)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__14733__14734)
      }
    }
  }()) {
    return new cljs.core.Cons(null, x, coll, null)
  }else {
    return new cljs.core.Cons(null, x, cljs.core.seq.call(null, coll), null)
  }
};
cljs.core.list_QMARK_ = function list_QMARK_(x) {
  var G__14739__14740 = x;
  if(G__14739__14740) {
    if(function() {
      var or__3824__auto____14741 = G__14739__14740.cljs$lang$protocol_mask$partition0$ & 33554432;
      if(or__3824__auto____14741) {
        return or__3824__auto____14741
      }else {
        return G__14739__14740.cljs$core$IList$
      }
    }()) {
      return true
    }else {
      if(!G__14739__14740.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IList, G__14739__14740)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IList, G__14739__14740)
  }
};
cljs.core.IReduce["string"] = true;
cljs.core._reduce["string"] = function() {
  var G__14742 = null;
  var G__14742__2 = function(string, f) {
    return cljs.core.ci_reduce.call(null, string, f)
  };
  var G__14742__3 = function(string, f, start) {
    return cljs.core.ci_reduce.call(null, string, f, start)
  };
  G__14742 = function(string, f, start) {
    switch(arguments.length) {
      case 2:
        return G__14742__2.call(this, string, f);
      case 3:
        return G__14742__3.call(this, string, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__14742
}();
cljs.core.ILookup["string"] = true;
cljs.core._lookup["string"] = function() {
  var G__14743 = null;
  var G__14743__2 = function(string, k) {
    return cljs.core._nth.call(null, string, k)
  };
  var G__14743__3 = function(string, k, not_found) {
    return cljs.core._nth.call(null, string, k, not_found)
  };
  G__14743 = function(string, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__14743__2.call(this, string, k);
      case 3:
        return G__14743__3.call(this, string, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__14743
}();
cljs.core.IIndexed["string"] = true;
cljs.core._nth["string"] = function() {
  var G__14744 = null;
  var G__14744__2 = function(string, n) {
    if(n < cljs.core._count.call(null, string)) {
      return string.charAt(n)
    }else {
      return null
    }
  };
  var G__14744__3 = function(string, n, not_found) {
    if(n < cljs.core._count.call(null, string)) {
      return string.charAt(n)
    }else {
      return not_found
    }
  };
  G__14744 = function(string, n, not_found) {
    switch(arguments.length) {
      case 2:
        return G__14744__2.call(this, string, n);
      case 3:
        return G__14744__3.call(this, string, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__14744
}();
cljs.core.ICounted["string"] = true;
cljs.core._count["string"] = function(s) {
  return s.length
};
cljs.core.ISeqable["string"] = true;
cljs.core._seq["string"] = function(string) {
  return cljs.core.prim_seq.call(null, string, 0)
};
cljs.core.IHash["string"] = true;
cljs.core._hash["string"] = function(o) {
  return goog.string.hashCode(o)
};
cljs.core.Keyword = function(k) {
  this.k = k;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 1
};
cljs.core.Keyword.cljs$lang$type = true;
cljs.core.Keyword.cljs$lang$ctorPrSeq = function(this__2309__auto__) {
  return cljs.core.list.call(null, "cljs.core/Keyword")
};
cljs.core.Keyword.prototype.call = function() {
  var G__14756 = null;
  var G__14756__2 = function(this_sym14747, coll) {
    var this__14749 = this;
    var this_sym14747__14750 = this;
    var ___14751 = this_sym14747__14750;
    if(coll == null) {
      return null
    }else {
      var strobj__14752 = coll.strobj;
      if(strobj__14752 == null) {
        return cljs.core._lookup.call(null, coll, this__14749.k, null)
      }else {
        return strobj__14752[this__14749.k]
      }
    }
  };
  var G__14756__3 = function(this_sym14748, coll, not_found) {
    var this__14749 = this;
    var this_sym14748__14753 = this;
    var ___14754 = this_sym14748__14753;
    if(coll == null) {
      return not_found
    }else {
      return cljs.core._lookup.call(null, coll, this__14749.k, not_found)
    }
  };
  G__14756 = function(this_sym14748, coll, not_found) {
    switch(arguments.length) {
      case 2:
        return G__14756__2.call(this, this_sym14748, coll);
      case 3:
        return G__14756__3.call(this, this_sym14748, coll, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__14756
}();
cljs.core.Keyword.prototype.apply = function(this_sym14745, args14746) {
  var this__14755 = this;
  return this_sym14745.call.apply(this_sym14745, [this_sym14745].concat(args14746.slice()))
};
cljs.core.Keyword;
String.prototype.cljs$core$IFn$ = true;
String.prototype.call = function() {
  var G__14765 = null;
  var G__14765__2 = function(this_sym14759, coll) {
    var this_sym14759__14761 = this;
    var this__14762 = this_sym14759__14761;
    return cljs.core._lookup.call(null, coll, this__14762.toString(), null)
  };
  var G__14765__3 = function(this_sym14760, coll, not_found) {
    var this_sym14760__14763 = this;
    var this__14764 = this_sym14760__14763;
    return cljs.core._lookup.call(null, coll, this__14764.toString(), not_found)
  };
  G__14765 = function(this_sym14760, coll, not_found) {
    switch(arguments.length) {
      case 2:
        return G__14765__2.call(this, this_sym14760, coll);
      case 3:
        return G__14765__3.call(this, this_sym14760, coll, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__14765
}();
String.prototype.apply = function(this_sym14757, args14758) {
  return this_sym14757.call.apply(this_sym14757, [this_sym14757].concat(args14758.slice()))
};
String.prototype.apply = function(s, args) {
  if(cljs.core.count.call(null, args) < 2) {
    return cljs.core._lookup.call(null, args[0], s, null)
  }else {
    return cljs.core._lookup.call(null, args[0], s, args[1])
  }
};
cljs.core.lazy_seq_value = function lazy_seq_value(lazy_seq) {
  var x__14767 = lazy_seq.x;
  if(lazy_seq.realized) {
    return x__14767
  }else {
    lazy_seq.x = x__14767.call(null);
    lazy_seq.realized = true;
    return lazy_seq.x
  }
};
cljs.core.LazySeq = function(meta, realized, x, __hash) {
  this.meta = meta;
  this.realized = realized;
  this.x = x;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 31850700
};
cljs.core.LazySeq.cljs$lang$type = true;
cljs.core.LazySeq.cljs$lang$ctorPrSeq = function(this__2309__auto__) {
  return cljs.core.list.call(null, "cljs.core/LazySeq")
};
cljs.core.LazySeq.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__14768 = this;
  var h__2192__auto____14769 = this__14768.__hash;
  if(!(h__2192__auto____14769 == null)) {
    return h__2192__auto____14769
  }else {
    var h__2192__auto____14770 = cljs.core.hash_coll.call(null, coll);
    this__14768.__hash = h__2192__auto____14770;
    return h__2192__auto____14770
  }
};
cljs.core.LazySeq.prototype.cljs$core$INext$_next$arity$1 = function(coll) {
  var this__14771 = this;
  return cljs.core._seq.call(null, coll.cljs$core$ISeq$_rest$arity$1(coll))
};
cljs.core.LazySeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__14772 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.LazySeq.prototype.toString = function() {
  var this__14773 = this;
  var this__14774 = this;
  return cljs.core.pr_str.call(null, this__14774)
};
cljs.core.LazySeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__14775 = this;
  return cljs.core.seq.call(null, cljs.core.lazy_seq_value.call(null, coll))
};
cljs.core.LazySeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__14776 = this;
  return cljs.core.first.call(null, cljs.core.lazy_seq_value.call(null, coll))
};
cljs.core.LazySeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__14777 = this;
  return cljs.core.rest.call(null, cljs.core.lazy_seq_value.call(null, coll))
};
cljs.core.LazySeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__14778 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.LazySeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__14779 = this;
  return new cljs.core.LazySeq(meta, this__14779.realized, this__14779.x, this__14779.__hash)
};
cljs.core.LazySeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__14780 = this;
  return this__14780.meta
};
cljs.core.LazySeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__14781 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__14781.meta)
};
cljs.core.LazySeq;
cljs.core.ChunkBuffer = function(buf, end) {
  this.buf = buf;
  this.end = end;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 2
};
cljs.core.ChunkBuffer.cljs$lang$type = true;
cljs.core.ChunkBuffer.cljs$lang$ctorPrSeq = function(this__2309__auto__) {
  return cljs.core.list.call(null, "cljs.core/ChunkBuffer")
};
cljs.core.ChunkBuffer.prototype.cljs$core$ICounted$_count$arity$1 = function(_) {
  var this__14782 = this;
  return this__14782.end
};
cljs.core.ChunkBuffer.prototype.add = function(o) {
  var this__14783 = this;
  var ___14784 = this;
  this__14783.buf[this__14783.end] = o;
  return this__14783.end = this__14783.end + 1
};
cljs.core.ChunkBuffer.prototype.chunk = function(o) {
  var this__14785 = this;
  var ___14786 = this;
  var ret__14787 = new cljs.core.ArrayChunk(this__14785.buf, 0, this__14785.end);
  this__14785.buf = null;
  return ret__14787
};
cljs.core.ChunkBuffer;
cljs.core.chunk_buffer = function chunk_buffer(capacity) {
  return new cljs.core.ChunkBuffer(cljs.core.make_array.call(null, capacity), 0)
};
cljs.core.ArrayChunk = function(arr, off, end) {
  this.arr = arr;
  this.off = off;
  this.end = end;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 524306
};
cljs.core.ArrayChunk.cljs$lang$type = true;
cljs.core.ArrayChunk.cljs$lang$ctorPrSeq = function(this__2309__auto__) {
  return cljs.core.list.call(null, "cljs.core/ArrayChunk")
};
cljs.core.ArrayChunk.prototype.cljs$core$IReduce$_reduce$arity$2 = function(coll, f) {
  var this__14788 = this;
  return cljs.core.ci_reduce.call(null, coll, f, this__14788.arr[this__14788.off], this__14788.off + 1)
};
cljs.core.ArrayChunk.prototype.cljs$core$IReduce$_reduce$arity$3 = function(coll, f, start) {
  var this__14789 = this;
  return cljs.core.ci_reduce.call(null, coll, f, start, this__14789.off)
};
cljs.core.ArrayChunk.prototype.cljs$core$IChunk$ = true;
cljs.core.ArrayChunk.prototype.cljs$core$IChunk$_drop_first$arity$1 = function(coll) {
  var this__14790 = this;
  if(this__14790.off === this__14790.end) {
    throw new Error("-drop-first of empty chunk");
  }else {
    return new cljs.core.ArrayChunk(this__14790.arr, this__14790.off + 1, this__14790.end)
  }
};
cljs.core.ArrayChunk.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, i) {
  var this__14791 = this;
  return this__14791.arr[this__14791.off + i]
};
cljs.core.ArrayChunk.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, i, not_found) {
  var this__14792 = this;
  if(function() {
    var and__3822__auto____14793 = i >= 0;
    if(and__3822__auto____14793) {
      return i < this__14792.end - this__14792.off
    }else {
      return and__3822__auto____14793
    }
  }()) {
    return this__14792.arr[this__14792.off + i]
  }else {
    return not_found
  }
};
cljs.core.ArrayChunk.prototype.cljs$core$ICounted$_count$arity$1 = function(_) {
  var this__14794 = this;
  return this__14794.end - this__14794.off
};
cljs.core.ArrayChunk;
cljs.core.array_chunk = function() {
  var array_chunk = null;
  var array_chunk__1 = function(arr) {
    return array_chunk.call(null, arr, 0, arr.length)
  };
  var array_chunk__2 = function(arr, off) {
    return array_chunk.call(null, arr, off, arr.length)
  };
  var array_chunk__3 = function(arr, off, end) {
    return new cljs.core.ArrayChunk(arr, off, end)
  };
  array_chunk = function(arr, off, end) {
    switch(arguments.length) {
      case 1:
        return array_chunk__1.call(this, arr);
      case 2:
        return array_chunk__2.call(this, arr, off);
      case 3:
        return array_chunk__3.call(this, arr, off, end)
    }
    throw"Invalid arity: " + arguments.length;
  };
  array_chunk.cljs$lang$arity$1 = array_chunk__1;
  array_chunk.cljs$lang$arity$2 = array_chunk__2;
  array_chunk.cljs$lang$arity$3 = array_chunk__3;
  return array_chunk
}();
cljs.core.ChunkedCons = function(chunk, more, meta) {
  this.chunk = chunk;
  this.more = more;
  this.meta = meta;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 27656296
};
cljs.core.ChunkedCons.cljs$lang$type = true;
cljs.core.ChunkedCons.cljs$lang$ctorPrSeq = function(this__2309__auto__) {
  return cljs.core.list.call(null, "cljs.core/ChunkedCons")
};
cljs.core.ChunkedCons.prototype.cljs$core$ICollection$_conj$arity$2 = function(this$, o) {
  var this__14795 = this;
  return cljs.core.cons.call(null, o, this$)
};
cljs.core.ChunkedCons.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__14796 = this;
  return coll
};
cljs.core.ChunkedCons.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__14797 = this;
  return cljs.core._nth.call(null, this__14797.chunk, 0)
};
cljs.core.ChunkedCons.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__14798 = this;
  if(cljs.core._count.call(null, this__14798.chunk) > 1) {
    return new cljs.core.ChunkedCons(cljs.core._drop_first.call(null, this__14798.chunk), this__14798.more, this__14798.meta)
  }else {
    if(this__14798.more == null) {
      return cljs.core.List.EMPTY
    }else {
      return this__14798.more
    }
  }
};
cljs.core.ChunkedCons.prototype.cljs$core$IChunkedNext$ = true;
cljs.core.ChunkedCons.prototype.cljs$core$IChunkedNext$_chunked_next$arity$1 = function(coll) {
  var this__14799 = this;
  if(this__14799.more == null) {
    return null
  }else {
    return this__14799.more
  }
};
cljs.core.ChunkedCons.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__14800 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.ChunkedCons.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, m) {
  var this__14801 = this;
  return new cljs.core.ChunkedCons(this__14801.chunk, this__14801.more, m)
};
cljs.core.ChunkedCons.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__14802 = this;
  return this__14802.meta
};
cljs.core.ChunkedCons.prototype.cljs$core$IChunkedSeq$ = true;
cljs.core.ChunkedCons.prototype.cljs$core$IChunkedSeq$_chunked_first$arity$1 = function(coll) {
  var this__14803 = this;
  return this__14803.chunk
};
cljs.core.ChunkedCons.prototype.cljs$core$IChunkedSeq$_chunked_rest$arity$1 = function(coll) {
  var this__14804 = this;
  if(this__14804.more == null) {
    return cljs.core.List.EMPTY
  }else {
    return this__14804.more
  }
};
cljs.core.ChunkedCons;
cljs.core.chunk_cons = function chunk_cons(chunk, rest) {
  if(cljs.core._count.call(null, chunk) === 0) {
    return rest
  }else {
    return new cljs.core.ChunkedCons(chunk, rest, null)
  }
};
cljs.core.chunk_append = function chunk_append(b, x) {
  return b.add(x)
};
cljs.core.chunk = function chunk(b) {
  return b.chunk()
};
cljs.core.chunk_first = function chunk_first(s) {
  return cljs.core._chunked_first.call(null, s)
};
cljs.core.chunk_rest = function chunk_rest(s) {
  return cljs.core._chunked_rest.call(null, s)
};
cljs.core.chunk_next = function chunk_next(s) {
  if(function() {
    var G__14808__14809 = s;
    if(G__14808__14809) {
      if(cljs.core.truth_(function() {
        var or__3824__auto____14810 = null;
        if(cljs.core.truth_(or__3824__auto____14810)) {
          return or__3824__auto____14810
        }else {
          return G__14808__14809.cljs$core$IChunkedNext$
        }
      }())) {
        return true
      }else {
        if(!G__14808__14809.cljs$lang$protocol_mask$partition$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.IChunkedNext, G__14808__14809)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.IChunkedNext, G__14808__14809)
    }
  }()) {
    return cljs.core._chunked_next.call(null, s)
  }else {
    return cljs.core.seq.call(null, cljs.core._chunked_rest.call(null, s))
  }
};
cljs.core.to_array = function to_array(s) {
  var ary__14813 = [];
  var s__14814 = s;
  while(true) {
    if(cljs.core.seq.call(null, s__14814)) {
      ary__14813.push(cljs.core.first.call(null, s__14814));
      var G__14815 = cljs.core.next.call(null, s__14814);
      s__14814 = G__14815;
      continue
    }else {
      return ary__14813
    }
    break
  }
};
cljs.core.to_array_2d = function to_array_2d(coll) {
  var ret__14819 = cljs.core.make_array.call(null, cljs.core.count.call(null, coll));
  var i__14820 = 0;
  var xs__14821 = cljs.core.seq.call(null, coll);
  while(true) {
    if(xs__14821) {
      ret__14819[i__14820] = cljs.core.to_array.call(null, cljs.core.first.call(null, xs__14821));
      var G__14822 = i__14820 + 1;
      var G__14823 = cljs.core.next.call(null, xs__14821);
      i__14820 = G__14822;
      xs__14821 = G__14823;
      continue
    }else {
    }
    break
  }
  return ret__14819
};
cljs.core.long_array = function() {
  var long_array = null;
  var long_array__1 = function(size_or_seq) {
    if(cljs.core.number_QMARK_.call(null, size_or_seq)) {
      return long_array.call(null, size_or_seq, null)
    }else {
      if(cljs.core.seq_QMARK_.call(null, size_or_seq)) {
        return cljs.core.into_array.call(null, size_or_seq)
      }else {
        if("\ufdd0'else") {
          throw new Error("long-array called with something other than size or ISeq");
        }else {
          return null
        }
      }
    }
  };
  var long_array__2 = function(size, init_val_or_seq) {
    var a__14831 = cljs.core.make_array.call(null, size);
    if(cljs.core.seq_QMARK_.call(null, init_val_or_seq)) {
      var s__14832 = cljs.core.seq.call(null, init_val_or_seq);
      var i__14833 = 0;
      var s__14834 = s__14832;
      while(true) {
        if(cljs.core.truth_(function() {
          var and__3822__auto____14835 = s__14834;
          if(and__3822__auto____14835) {
            return i__14833 < size
          }else {
            return and__3822__auto____14835
          }
        }())) {
          a__14831[i__14833] = cljs.core.first.call(null, s__14834);
          var G__14838 = i__14833 + 1;
          var G__14839 = cljs.core.next.call(null, s__14834);
          i__14833 = G__14838;
          s__14834 = G__14839;
          continue
        }else {
          return a__14831
        }
        break
      }
    }else {
      var n__2527__auto____14836 = size;
      var i__14837 = 0;
      while(true) {
        if(i__14837 < n__2527__auto____14836) {
          a__14831[i__14837] = init_val_or_seq;
          var G__14840 = i__14837 + 1;
          i__14837 = G__14840;
          continue
        }else {
        }
        break
      }
      return a__14831
    }
  };
  long_array = function(size, init_val_or_seq) {
    switch(arguments.length) {
      case 1:
        return long_array__1.call(this, size);
      case 2:
        return long_array__2.call(this, size, init_val_or_seq)
    }
    throw"Invalid arity: " + arguments.length;
  };
  long_array.cljs$lang$arity$1 = long_array__1;
  long_array.cljs$lang$arity$2 = long_array__2;
  return long_array
}();
cljs.core.double_array = function() {
  var double_array = null;
  var double_array__1 = function(size_or_seq) {
    if(cljs.core.number_QMARK_.call(null, size_or_seq)) {
      return double_array.call(null, size_or_seq, null)
    }else {
      if(cljs.core.seq_QMARK_.call(null, size_or_seq)) {
        return cljs.core.into_array.call(null, size_or_seq)
      }else {
        if("\ufdd0'else") {
          throw new Error("double-array called with something other than size or ISeq");
        }else {
          return null
        }
      }
    }
  };
  var double_array__2 = function(size, init_val_or_seq) {
    var a__14848 = cljs.core.make_array.call(null, size);
    if(cljs.core.seq_QMARK_.call(null, init_val_or_seq)) {
      var s__14849 = cljs.core.seq.call(null, init_val_or_seq);
      var i__14850 = 0;
      var s__14851 = s__14849;
      while(true) {
        if(cljs.core.truth_(function() {
          var and__3822__auto____14852 = s__14851;
          if(and__3822__auto____14852) {
            return i__14850 < size
          }else {
            return and__3822__auto____14852
          }
        }())) {
          a__14848[i__14850] = cljs.core.first.call(null, s__14851);
          var G__14855 = i__14850 + 1;
          var G__14856 = cljs.core.next.call(null, s__14851);
          i__14850 = G__14855;
          s__14851 = G__14856;
          continue
        }else {
          return a__14848
        }
        break
      }
    }else {
      var n__2527__auto____14853 = size;
      var i__14854 = 0;
      while(true) {
        if(i__14854 < n__2527__auto____14853) {
          a__14848[i__14854] = init_val_or_seq;
          var G__14857 = i__14854 + 1;
          i__14854 = G__14857;
          continue
        }else {
        }
        break
      }
      return a__14848
    }
  };
  double_array = function(size, init_val_or_seq) {
    switch(arguments.length) {
      case 1:
        return double_array__1.call(this, size);
      case 2:
        return double_array__2.call(this, size, init_val_or_seq)
    }
    throw"Invalid arity: " + arguments.length;
  };
  double_array.cljs$lang$arity$1 = double_array__1;
  double_array.cljs$lang$arity$2 = double_array__2;
  return double_array
}();
cljs.core.object_array = function() {
  var object_array = null;
  var object_array__1 = function(size_or_seq) {
    if(cljs.core.number_QMARK_.call(null, size_or_seq)) {
      return object_array.call(null, size_or_seq, null)
    }else {
      if(cljs.core.seq_QMARK_.call(null, size_or_seq)) {
        return cljs.core.into_array.call(null, size_or_seq)
      }else {
        if("\ufdd0'else") {
          throw new Error("object-array called with something other than size or ISeq");
        }else {
          return null
        }
      }
    }
  };
  var object_array__2 = function(size, init_val_or_seq) {
    var a__14865 = cljs.core.make_array.call(null, size);
    if(cljs.core.seq_QMARK_.call(null, init_val_or_seq)) {
      var s__14866 = cljs.core.seq.call(null, init_val_or_seq);
      var i__14867 = 0;
      var s__14868 = s__14866;
      while(true) {
        if(cljs.core.truth_(function() {
          var and__3822__auto____14869 = s__14868;
          if(and__3822__auto____14869) {
            return i__14867 < size
          }else {
            return and__3822__auto____14869
          }
        }())) {
          a__14865[i__14867] = cljs.core.first.call(null, s__14868);
          var G__14872 = i__14867 + 1;
          var G__14873 = cljs.core.next.call(null, s__14868);
          i__14867 = G__14872;
          s__14868 = G__14873;
          continue
        }else {
          return a__14865
        }
        break
      }
    }else {
      var n__2527__auto____14870 = size;
      var i__14871 = 0;
      while(true) {
        if(i__14871 < n__2527__auto____14870) {
          a__14865[i__14871] = init_val_or_seq;
          var G__14874 = i__14871 + 1;
          i__14871 = G__14874;
          continue
        }else {
        }
        break
      }
      return a__14865
    }
  };
  object_array = function(size, init_val_or_seq) {
    switch(arguments.length) {
      case 1:
        return object_array__1.call(this, size);
      case 2:
        return object_array__2.call(this, size, init_val_or_seq)
    }
    throw"Invalid arity: " + arguments.length;
  };
  object_array.cljs$lang$arity$1 = object_array__1;
  object_array.cljs$lang$arity$2 = object_array__2;
  return object_array
}();
cljs.core.bounded_count = function bounded_count(s, n) {
  if(cljs.core.counted_QMARK_.call(null, s)) {
    return cljs.core.count.call(null, s)
  }else {
    var s__14879 = s;
    var i__14880 = n;
    var sum__14881 = 0;
    while(true) {
      if(cljs.core.truth_(function() {
        var and__3822__auto____14882 = i__14880 > 0;
        if(and__3822__auto____14882) {
          return cljs.core.seq.call(null, s__14879)
        }else {
          return and__3822__auto____14882
        }
      }())) {
        var G__14883 = cljs.core.next.call(null, s__14879);
        var G__14884 = i__14880 - 1;
        var G__14885 = sum__14881 + 1;
        s__14879 = G__14883;
        i__14880 = G__14884;
        sum__14881 = G__14885;
        continue
      }else {
        return sum__14881
      }
      break
    }
  }
};
cljs.core.spread = function spread(arglist) {
  if(arglist == null) {
    return null
  }else {
    if(cljs.core.next.call(null, arglist) == null) {
      return cljs.core.seq.call(null, cljs.core.first.call(null, arglist))
    }else {
      if("\ufdd0'else") {
        return cljs.core.cons.call(null, cljs.core.first.call(null, arglist), spread.call(null, cljs.core.next.call(null, arglist)))
      }else {
        return null
      }
    }
  }
};
cljs.core.concat = function() {
  var concat = null;
  var concat__0 = function() {
    return new cljs.core.LazySeq(null, false, function() {
      return null
    }, null)
  };
  var concat__1 = function(x) {
    return new cljs.core.LazySeq(null, false, function() {
      return x
    }, null)
  };
  var concat__2 = function(x, y) {
    return new cljs.core.LazySeq(null, false, function() {
      var s__14890 = cljs.core.seq.call(null, x);
      if(s__14890) {
        if(cljs.core.chunked_seq_QMARK_.call(null, s__14890)) {
          return cljs.core.chunk_cons.call(null, cljs.core.chunk_first.call(null, s__14890), concat.call(null, cljs.core.chunk_rest.call(null, s__14890), y))
        }else {
          return cljs.core.cons.call(null, cljs.core.first.call(null, s__14890), concat.call(null, cljs.core.rest.call(null, s__14890), y))
        }
      }else {
        return y
      }
    }, null)
  };
  var concat__3 = function() {
    var G__14894__delegate = function(x, y, zs) {
      var cat__14893 = function cat(xys, zs) {
        return new cljs.core.LazySeq(null, false, function() {
          var xys__14892 = cljs.core.seq.call(null, xys);
          if(xys__14892) {
            if(cljs.core.chunked_seq_QMARK_.call(null, xys__14892)) {
              return cljs.core.chunk_cons.call(null, cljs.core.chunk_first.call(null, xys__14892), cat.call(null, cljs.core.chunk_rest.call(null, xys__14892), zs))
            }else {
              return cljs.core.cons.call(null, cljs.core.first.call(null, xys__14892), cat.call(null, cljs.core.rest.call(null, xys__14892), zs))
            }
          }else {
            if(cljs.core.truth_(zs)) {
              return cat.call(null, cljs.core.first.call(null, zs), cljs.core.next.call(null, zs))
            }else {
              return null
            }
          }
        }, null)
      };
      return cat__14893.call(null, concat.call(null, x, y), zs)
    };
    var G__14894 = function(x, y, var_args) {
      var zs = null;
      if(goog.isDef(var_args)) {
        zs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__14894__delegate.call(this, x, y, zs)
    };
    G__14894.cljs$lang$maxFixedArity = 2;
    G__14894.cljs$lang$applyTo = function(arglist__14895) {
      var x = cljs.core.first(arglist__14895);
      var y = cljs.core.first(cljs.core.next(arglist__14895));
      var zs = cljs.core.rest(cljs.core.next(arglist__14895));
      return G__14894__delegate(x, y, zs)
    };
    G__14894.cljs$lang$arity$variadic = G__14894__delegate;
    return G__14894
  }();
  concat = function(x, y, var_args) {
    var zs = var_args;
    switch(arguments.length) {
      case 0:
        return concat__0.call(this);
      case 1:
        return concat__1.call(this, x);
      case 2:
        return concat__2.call(this, x, y);
      default:
        return concat__3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  concat.cljs$lang$maxFixedArity = 2;
  concat.cljs$lang$applyTo = concat__3.cljs$lang$applyTo;
  concat.cljs$lang$arity$0 = concat__0;
  concat.cljs$lang$arity$1 = concat__1;
  concat.cljs$lang$arity$2 = concat__2;
  concat.cljs$lang$arity$variadic = concat__3.cljs$lang$arity$variadic;
  return concat
}();
cljs.core.list_STAR_ = function() {
  var list_STAR_ = null;
  var list_STAR___1 = function(args) {
    return cljs.core.seq.call(null, args)
  };
  var list_STAR___2 = function(a, args) {
    return cljs.core.cons.call(null, a, args)
  };
  var list_STAR___3 = function(a, b, args) {
    return cljs.core.cons.call(null, a, cljs.core.cons.call(null, b, args))
  };
  var list_STAR___4 = function(a, b, c, args) {
    return cljs.core.cons.call(null, a, cljs.core.cons.call(null, b, cljs.core.cons.call(null, c, args)))
  };
  var list_STAR___5 = function() {
    var G__14896__delegate = function(a, b, c, d, more) {
      return cljs.core.cons.call(null, a, cljs.core.cons.call(null, b, cljs.core.cons.call(null, c, cljs.core.cons.call(null, d, cljs.core.spread.call(null, more)))))
    };
    var G__14896 = function(a, b, c, d, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 4), 0)
      }
      return G__14896__delegate.call(this, a, b, c, d, more)
    };
    G__14896.cljs$lang$maxFixedArity = 4;
    G__14896.cljs$lang$applyTo = function(arglist__14897) {
      var a = cljs.core.first(arglist__14897);
      var b = cljs.core.first(cljs.core.next(arglist__14897));
      var c = cljs.core.first(cljs.core.next(cljs.core.next(arglist__14897)));
      var d = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__14897))));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(arglist__14897))));
      return G__14896__delegate(a, b, c, d, more)
    };
    G__14896.cljs$lang$arity$variadic = G__14896__delegate;
    return G__14896
  }();
  list_STAR_ = function(a, b, c, d, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return list_STAR___1.call(this, a);
      case 2:
        return list_STAR___2.call(this, a, b);
      case 3:
        return list_STAR___3.call(this, a, b, c);
      case 4:
        return list_STAR___4.call(this, a, b, c, d);
      default:
        return list_STAR___5.cljs$lang$arity$variadic(a, b, c, d, cljs.core.array_seq(arguments, 4))
    }
    throw"Invalid arity: " + arguments.length;
  };
  list_STAR_.cljs$lang$maxFixedArity = 4;
  list_STAR_.cljs$lang$applyTo = list_STAR___5.cljs$lang$applyTo;
  list_STAR_.cljs$lang$arity$1 = list_STAR___1;
  list_STAR_.cljs$lang$arity$2 = list_STAR___2;
  list_STAR_.cljs$lang$arity$3 = list_STAR___3;
  list_STAR_.cljs$lang$arity$4 = list_STAR___4;
  list_STAR_.cljs$lang$arity$variadic = list_STAR___5.cljs$lang$arity$variadic;
  return list_STAR_
}();
cljs.core.transient$ = function transient$(coll) {
  return cljs.core._as_transient.call(null, coll)
};
cljs.core.persistent_BANG_ = function persistent_BANG_(tcoll) {
  return cljs.core._persistent_BANG_.call(null, tcoll)
};
cljs.core.conj_BANG_ = function conj_BANG_(tcoll, val) {
  return cljs.core._conj_BANG_.call(null, tcoll, val)
};
cljs.core.assoc_BANG_ = function assoc_BANG_(tcoll, key, val) {
  return cljs.core._assoc_BANG_.call(null, tcoll, key, val)
};
cljs.core.dissoc_BANG_ = function dissoc_BANG_(tcoll, key) {
  return cljs.core._dissoc_BANG_.call(null, tcoll, key)
};
cljs.core.pop_BANG_ = function pop_BANG_(tcoll) {
  return cljs.core._pop_BANG_.call(null, tcoll)
};
cljs.core.disj_BANG_ = function disj_BANG_(tcoll, val) {
  return cljs.core._disjoin_BANG_.call(null, tcoll, val)
};
cljs.core.apply_to = function apply_to(f, argc, args) {
  var args__14939 = cljs.core.seq.call(null, args);
  if(argc === 0) {
    return f.call(null)
  }else {
    var a__14940 = cljs.core._first.call(null, args__14939);
    var args__14941 = cljs.core._rest.call(null, args__14939);
    if(argc === 1) {
      if(f.cljs$lang$arity$1) {
        return f.cljs$lang$arity$1(a__14940)
      }else {
        return f.call(null, a__14940)
      }
    }else {
      var b__14942 = cljs.core._first.call(null, args__14941);
      var args__14943 = cljs.core._rest.call(null, args__14941);
      if(argc === 2) {
        if(f.cljs$lang$arity$2) {
          return f.cljs$lang$arity$2(a__14940, b__14942)
        }else {
          return f.call(null, a__14940, b__14942)
        }
      }else {
        var c__14944 = cljs.core._first.call(null, args__14943);
        var args__14945 = cljs.core._rest.call(null, args__14943);
        if(argc === 3) {
          if(f.cljs$lang$arity$3) {
            return f.cljs$lang$arity$3(a__14940, b__14942, c__14944)
          }else {
            return f.call(null, a__14940, b__14942, c__14944)
          }
        }else {
          var d__14946 = cljs.core._first.call(null, args__14945);
          var args__14947 = cljs.core._rest.call(null, args__14945);
          if(argc === 4) {
            if(f.cljs$lang$arity$4) {
              return f.cljs$lang$arity$4(a__14940, b__14942, c__14944, d__14946)
            }else {
              return f.call(null, a__14940, b__14942, c__14944, d__14946)
            }
          }else {
            var e__14948 = cljs.core._first.call(null, args__14947);
            var args__14949 = cljs.core._rest.call(null, args__14947);
            if(argc === 5) {
              if(f.cljs$lang$arity$5) {
                return f.cljs$lang$arity$5(a__14940, b__14942, c__14944, d__14946, e__14948)
              }else {
                return f.call(null, a__14940, b__14942, c__14944, d__14946, e__14948)
              }
            }else {
              var f__14950 = cljs.core._first.call(null, args__14949);
              var args__14951 = cljs.core._rest.call(null, args__14949);
              if(argc === 6) {
                if(f__14950.cljs$lang$arity$6) {
                  return f__14950.cljs$lang$arity$6(a__14940, b__14942, c__14944, d__14946, e__14948, f__14950)
                }else {
                  return f__14950.call(null, a__14940, b__14942, c__14944, d__14946, e__14948, f__14950)
                }
              }else {
                var g__14952 = cljs.core._first.call(null, args__14951);
                var args__14953 = cljs.core._rest.call(null, args__14951);
                if(argc === 7) {
                  if(f__14950.cljs$lang$arity$7) {
                    return f__14950.cljs$lang$arity$7(a__14940, b__14942, c__14944, d__14946, e__14948, f__14950, g__14952)
                  }else {
                    return f__14950.call(null, a__14940, b__14942, c__14944, d__14946, e__14948, f__14950, g__14952)
                  }
                }else {
                  var h__14954 = cljs.core._first.call(null, args__14953);
                  var args__14955 = cljs.core._rest.call(null, args__14953);
                  if(argc === 8) {
                    if(f__14950.cljs$lang$arity$8) {
                      return f__14950.cljs$lang$arity$8(a__14940, b__14942, c__14944, d__14946, e__14948, f__14950, g__14952, h__14954)
                    }else {
                      return f__14950.call(null, a__14940, b__14942, c__14944, d__14946, e__14948, f__14950, g__14952, h__14954)
                    }
                  }else {
                    var i__14956 = cljs.core._first.call(null, args__14955);
                    var args__14957 = cljs.core._rest.call(null, args__14955);
                    if(argc === 9) {
                      if(f__14950.cljs$lang$arity$9) {
                        return f__14950.cljs$lang$arity$9(a__14940, b__14942, c__14944, d__14946, e__14948, f__14950, g__14952, h__14954, i__14956)
                      }else {
                        return f__14950.call(null, a__14940, b__14942, c__14944, d__14946, e__14948, f__14950, g__14952, h__14954, i__14956)
                      }
                    }else {
                      var j__14958 = cljs.core._first.call(null, args__14957);
                      var args__14959 = cljs.core._rest.call(null, args__14957);
                      if(argc === 10) {
                        if(f__14950.cljs$lang$arity$10) {
                          return f__14950.cljs$lang$arity$10(a__14940, b__14942, c__14944, d__14946, e__14948, f__14950, g__14952, h__14954, i__14956, j__14958)
                        }else {
                          return f__14950.call(null, a__14940, b__14942, c__14944, d__14946, e__14948, f__14950, g__14952, h__14954, i__14956, j__14958)
                        }
                      }else {
                        var k__14960 = cljs.core._first.call(null, args__14959);
                        var args__14961 = cljs.core._rest.call(null, args__14959);
                        if(argc === 11) {
                          if(f__14950.cljs$lang$arity$11) {
                            return f__14950.cljs$lang$arity$11(a__14940, b__14942, c__14944, d__14946, e__14948, f__14950, g__14952, h__14954, i__14956, j__14958, k__14960)
                          }else {
                            return f__14950.call(null, a__14940, b__14942, c__14944, d__14946, e__14948, f__14950, g__14952, h__14954, i__14956, j__14958, k__14960)
                          }
                        }else {
                          var l__14962 = cljs.core._first.call(null, args__14961);
                          var args__14963 = cljs.core._rest.call(null, args__14961);
                          if(argc === 12) {
                            if(f__14950.cljs$lang$arity$12) {
                              return f__14950.cljs$lang$arity$12(a__14940, b__14942, c__14944, d__14946, e__14948, f__14950, g__14952, h__14954, i__14956, j__14958, k__14960, l__14962)
                            }else {
                              return f__14950.call(null, a__14940, b__14942, c__14944, d__14946, e__14948, f__14950, g__14952, h__14954, i__14956, j__14958, k__14960, l__14962)
                            }
                          }else {
                            var m__14964 = cljs.core._first.call(null, args__14963);
                            var args__14965 = cljs.core._rest.call(null, args__14963);
                            if(argc === 13) {
                              if(f__14950.cljs$lang$arity$13) {
                                return f__14950.cljs$lang$arity$13(a__14940, b__14942, c__14944, d__14946, e__14948, f__14950, g__14952, h__14954, i__14956, j__14958, k__14960, l__14962, m__14964)
                              }else {
                                return f__14950.call(null, a__14940, b__14942, c__14944, d__14946, e__14948, f__14950, g__14952, h__14954, i__14956, j__14958, k__14960, l__14962, m__14964)
                              }
                            }else {
                              var n__14966 = cljs.core._first.call(null, args__14965);
                              var args__14967 = cljs.core._rest.call(null, args__14965);
                              if(argc === 14) {
                                if(f__14950.cljs$lang$arity$14) {
                                  return f__14950.cljs$lang$arity$14(a__14940, b__14942, c__14944, d__14946, e__14948, f__14950, g__14952, h__14954, i__14956, j__14958, k__14960, l__14962, m__14964, n__14966)
                                }else {
                                  return f__14950.call(null, a__14940, b__14942, c__14944, d__14946, e__14948, f__14950, g__14952, h__14954, i__14956, j__14958, k__14960, l__14962, m__14964, n__14966)
                                }
                              }else {
                                var o__14968 = cljs.core._first.call(null, args__14967);
                                var args__14969 = cljs.core._rest.call(null, args__14967);
                                if(argc === 15) {
                                  if(f__14950.cljs$lang$arity$15) {
                                    return f__14950.cljs$lang$arity$15(a__14940, b__14942, c__14944, d__14946, e__14948, f__14950, g__14952, h__14954, i__14956, j__14958, k__14960, l__14962, m__14964, n__14966, o__14968)
                                  }else {
                                    return f__14950.call(null, a__14940, b__14942, c__14944, d__14946, e__14948, f__14950, g__14952, h__14954, i__14956, j__14958, k__14960, l__14962, m__14964, n__14966, o__14968)
                                  }
                                }else {
                                  var p__14970 = cljs.core._first.call(null, args__14969);
                                  var args__14971 = cljs.core._rest.call(null, args__14969);
                                  if(argc === 16) {
                                    if(f__14950.cljs$lang$arity$16) {
                                      return f__14950.cljs$lang$arity$16(a__14940, b__14942, c__14944, d__14946, e__14948, f__14950, g__14952, h__14954, i__14956, j__14958, k__14960, l__14962, m__14964, n__14966, o__14968, p__14970)
                                    }else {
                                      return f__14950.call(null, a__14940, b__14942, c__14944, d__14946, e__14948, f__14950, g__14952, h__14954, i__14956, j__14958, k__14960, l__14962, m__14964, n__14966, o__14968, p__14970)
                                    }
                                  }else {
                                    var q__14972 = cljs.core._first.call(null, args__14971);
                                    var args__14973 = cljs.core._rest.call(null, args__14971);
                                    if(argc === 17) {
                                      if(f__14950.cljs$lang$arity$17) {
                                        return f__14950.cljs$lang$arity$17(a__14940, b__14942, c__14944, d__14946, e__14948, f__14950, g__14952, h__14954, i__14956, j__14958, k__14960, l__14962, m__14964, n__14966, o__14968, p__14970, q__14972)
                                      }else {
                                        return f__14950.call(null, a__14940, b__14942, c__14944, d__14946, e__14948, f__14950, g__14952, h__14954, i__14956, j__14958, k__14960, l__14962, m__14964, n__14966, o__14968, p__14970, q__14972)
                                      }
                                    }else {
                                      var r__14974 = cljs.core._first.call(null, args__14973);
                                      var args__14975 = cljs.core._rest.call(null, args__14973);
                                      if(argc === 18) {
                                        if(f__14950.cljs$lang$arity$18) {
                                          return f__14950.cljs$lang$arity$18(a__14940, b__14942, c__14944, d__14946, e__14948, f__14950, g__14952, h__14954, i__14956, j__14958, k__14960, l__14962, m__14964, n__14966, o__14968, p__14970, q__14972, r__14974)
                                        }else {
                                          return f__14950.call(null, a__14940, b__14942, c__14944, d__14946, e__14948, f__14950, g__14952, h__14954, i__14956, j__14958, k__14960, l__14962, m__14964, n__14966, o__14968, p__14970, q__14972, r__14974)
                                        }
                                      }else {
                                        var s__14976 = cljs.core._first.call(null, args__14975);
                                        var args__14977 = cljs.core._rest.call(null, args__14975);
                                        if(argc === 19) {
                                          if(f__14950.cljs$lang$arity$19) {
                                            return f__14950.cljs$lang$arity$19(a__14940, b__14942, c__14944, d__14946, e__14948, f__14950, g__14952, h__14954, i__14956, j__14958, k__14960, l__14962, m__14964, n__14966, o__14968, p__14970, q__14972, r__14974, s__14976)
                                          }else {
                                            return f__14950.call(null, a__14940, b__14942, c__14944, d__14946, e__14948, f__14950, g__14952, h__14954, i__14956, j__14958, k__14960, l__14962, m__14964, n__14966, o__14968, p__14970, q__14972, r__14974, s__14976)
                                          }
                                        }else {
                                          var t__14978 = cljs.core._first.call(null, args__14977);
                                          var args__14979 = cljs.core._rest.call(null, args__14977);
                                          if(argc === 20) {
                                            if(f__14950.cljs$lang$arity$20) {
                                              return f__14950.cljs$lang$arity$20(a__14940, b__14942, c__14944, d__14946, e__14948, f__14950, g__14952, h__14954, i__14956, j__14958, k__14960, l__14962, m__14964, n__14966, o__14968, p__14970, q__14972, r__14974, s__14976, t__14978)
                                            }else {
                                              return f__14950.call(null, a__14940, b__14942, c__14944, d__14946, e__14948, f__14950, g__14952, h__14954, i__14956, j__14958, k__14960, l__14962, m__14964, n__14966, o__14968, p__14970, q__14972, r__14974, s__14976, t__14978)
                                            }
                                          }else {
                                            throw new Error("Only up to 20 arguments supported on functions");
                                          }
                                        }
                                      }
                                    }
                                  }
                                }
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
};
cljs.core.apply = function() {
  var apply = null;
  var apply__2 = function(f, args) {
    var fixed_arity__14994 = f.cljs$lang$maxFixedArity;
    if(cljs.core.truth_(f.cljs$lang$applyTo)) {
      var bc__14995 = cljs.core.bounded_count.call(null, args, fixed_arity__14994 + 1);
      if(bc__14995 <= fixed_arity__14994) {
        return cljs.core.apply_to.call(null, f, bc__14995, args)
      }else {
        return f.cljs$lang$applyTo(args)
      }
    }else {
      return f.apply(f, cljs.core.to_array.call(null, args))
    }
  };
  var apply__3 = function(f, x, args) {
    var arglist__14996 = cljs.core.list_STAR_.call(null, x, args);
    var fixed_arity__14997 = f.cljs$lang$maxFixedArity;
    if(cljs.core.truth_(f.cljs$lang$applyTo)) {
      var bc__14998 = cljs.core.bounded_count.call(null, arglist__14996, fixed_arity__14997 + 1);
      if(bc__14998 <= fixed_arity__14997) {
        return cljs.core.apply_to.call(null, f, bc__14998, arglist__14996)
      }else {
        return f.cljs$lang$applyTo(arglist__14996)
      }
    }else {
      return f.apply(f, cljs.core.to_array.call(null, arglist__14996))
    }
  };
  var apply__4 = function(f, x, y, args) {
    var arglist__14999 = cljs.core.list_STAR_.call(null, x, y, args);
    var fixed_arity__15000 = f.cljs$lang$maxFixedArity;
    if(cljs.core.truth_(f.cljs$lang$applyTo)) {
      var bc__15001 = cljs.core.bounded_count.call(null, arglist__14999, fixed_arity__15000 + 1);
      if(bc__15001 <= fixed_arity__15000) {
        return cljs.core.apply_to.call(null, f, bc__15001, arglist__14999)
      }else {
        return f.cljs$lang$applyTo(arglist__14999)
      }
    }else {
      return f.apply(f, cljs.core.to_array.call(null, arglist__14999))
    }
  };
  var apply__5 = function(f, x, y, z, args) {
    var arglist__15002 = cljs.core.list_STAR_.call(null, x, y, z, args);
    var fixed_arity__15003 = f.cljs$lang$maxFixedArity;
    if(cljs.core.truth_(f.cljs$lang$applyTo)) {
      var bc__15004 = cljs.core.bounded_count.call(null, arglist__15002, fixed_arity__15003 + 1);
      if(bc__15004 <= fixed_arity__15003) {
        return cljs.core.apply_to.call(null, f, bc__15004, arglist__15002)
      }else {
        return f.cljs$lang$applyTo(arglist__15002)
      }
    }else {
      return f.apply(f, cljs.core.to_array.call(null, arglist__15002))
    }
  };
  var apply__6 = function() {
    var G__15008__delegate = function(f, a, b, c, d, args) {
      var arglist__15005 = cljs.core.cons.call(null, a, cljs.core.cons.call(null, b, cljs.core.cons.call(null, c, cljs.core.cons.call(null, d, cljs.core.spread.call(null, args)))));
      var fixed_arity__15006 = f.cljs$lang$maxFixedArity;
      if(cljs.core.truth_(f.cljs$lang$applyTo)) {
        var bc__15007 = cljs.core.bounded_count.call(null, arglist__15005, fixed_arity__15006 + 1);
        if(bc__15007 <= fixed_arity__15006) {
          return cljs.core.apply_to.call(null, f, bc__15007, arglist__15005)
        }else {
          return f.cljs$lang$applyTo(arglist__15005)
        }
      }else {
        return f.apply(f, cljs.core.to_array.call(null, arglist__15005))
      }
    };
    var G__15008 = function(f, a, b, c, d, var_args) {
      var args = null;
      if(goog.isDef(var_args)) {
        args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 5), 0)
      }
      return G__15008__delegate.call(this, f, a, b, c, d, args)
    };
    G__15008.cljs$lang$maxFixedArity = 5;
    G__15008.cljs$lang$applyTo = function(arglist__15009) {
      var f = cljs.core.first(arglist__15009);
      var a = cljs.core.first(cljs.core.next(arglist__15009));
      var b = cljs.core.first(cljs.core.next(cljs.core.next(arglist__15009)));
      var c = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__15009))));
      var d = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(cljs.core.next(arglist__15009)))));
      var args = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(cljs.core.next(arglist__15009)))));
      return G__15008__delegate(f, a, b, c, d, args)
    };
    G__15008.cljs$lang$arity$variadic = G__15008__delegate;
    return G__15008
  }();
  apply = function(f, a, b, c, d, var_args) {
    var args = var_args;
    switch(arguments.length) {
      case 2:
        return apply__2.call(this, f, a);
      case 3:
        return apply__3.call(this, f, a, b);
      case 4:
        return apply__4.call(this, f, a, b, c);
      case 5:
        return apply__5.call(this, f, a, b, c, d);
      default:
        return apply__6.cljs$lang$arity$variadic(f, a, b, c, d, cljs.core.array_seq(arguments, 5))
    }
    throw"Invalid arity: " + arguments.length;
  };
  apply.cljs$lang$maxFixedArity = 5;
  apply.cljs$lang$applyTo = apply__6.cljs$lang$applyTo;
  apply.cljs$lang$arity$2 = apply__2;
  apply.cljs$lang$arity$3 = apply__3;
  apply.cljs$lang$arity$4 = apply__4;
  apply.cljs$lang$arity$5 = apply__5;
  apply.cljs$lang$arity$variadic = apply__6.cljs$lang$arity$variadic;
  return apply
}();
cljs.core.vary_meta = function() {
  var vary_meta__delegate = function(obj, f, args) {
    return cljs.core.with_meta.call(null, obj, cljs.core.apply.call(null, f, cljs.core.meta.call(null, obj), args))
  };
  var vary_meta = function(obj, f, var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
    }
    return vary_meta__delegate.call(this, obj, f, args)
  };
  vary_meta.cljs$lang$maxFixedArity = 2;
  vary_meta.cljs$lang$applyTo = function(arglist__15010) {
    var obj = cljs.core.first(arglist__15010);
    var f = cljs.core.first(cljs.core.next(arglist__15010));
    var args = cljs.core.rest(cljs.core.next(arglist__15010));
    return vary_meta__delegate(obj, f, args)
  };
  vary_meta.cljs$lang$arity$variadic = vary_meta__delegate;
  return vary_meta
}();
cljs.core.not_EQ_ = function() {
  var not_EQ_ = null;
  var not_EQ___1 = function(x) {
    return false
  };
  var not_EQ___2 = function(x, y) {
    return!cljs.core._EQ_.call(null, x, y)
  };
  var not_EQ___3 = function() {
    var G__15011__delegate = function(x, y, more) {
      return cljs.core.not.call(null, cljs.core.apply.call(null, cljs.core._EQ_, x, y, more))
    };
    var G__15011 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__15011__delegate.call(this, x, y, more)
    };
    G__15011.cljs$lang$maxFixedArity = 2;
    G__15011.cljs$lang$applyTo = function(arglist__15012) {
      var x = cljs.core.first(arglist__15012);
      var y = cljs.core.first(cljs.core.next(arglist__15012));
      var more = cljs.core.rest(cljs.core.next(arglist__15012));
      return G__15011__delegate(x, y, more)
    };
    G__15011.cljs$lang$arity$variadic = G__15011__delegate;
    return G__15011
  }();
  not_EQ_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return not_EQ___1.call(this, x);
      case 2:
        return not_EQ___2.call(this, x, y);
      default:
        return not_EQ___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  not_EQ_.cljs$lang$maxFixedArity = 2;
  not_EQ_.cljs$lang$applyTo = not_EQ___3.cljs$lang$applyTo;
  not_EQ_.cljs$lang$arity$1 = not_EQ___1;
  not_EQ_.cljs$lang$arity$2 = not_EQ___2;
  not_EQ_.cljs$lang$arity$variadic = not_EQ___3.cljs$lang$arity$variadic;
  return not_EQ_
}();
cljs.core.not_empty = function not_empty(coll) {
  if(cljs.core.seq.call(null, coll)) {
    return coll
  }else {
    return null
  }
};
cljs.core.every_QMARK_ = function every_QMARK_(pred, coll) {
  while(true) {
    if(cljs.core.seq.call(null, coll) == null) {
      return true
    }else {
      if(cljs.core.truth_(pred.call(null, cljs.core.first.call(null, coll)))) {
        var G__15013 = pred;
        var G__15014 = cljs.core.next.call(null, coll);
        pred = G__15013;
        coll = G__15014;
        continue
      }else {
        if("\ufdd0'else") {
          return false
        }else {
          return null
        }
      }
    }
    break
  }
};
cljs.core.not_every_QMARK_ = function not_every_QMARK_(pred, coll) {
  return!cljs.core.every_QMARK_.call(null, pred, coll)
};
cljs.core.some = function some(pred, coll) {
  while(true) {
    if(cljs.core.seq.call(null, coll)) {
      var or__3824__auto____15016 = pred.call(null, cljs.core.first.call(null, coll));
      if(cljs.core.truth_(or__3824__auto____15016)) {
        return or__3824__auto____15016
      }else {
        var G__15017 = pred;
        var G__15018 = cljs.core.next.call(null, coll);
        pred = G__15017;
        coll = G__15018;
        continue
      }
    }else {
      return null
    }
    break
  }
};
cljs.core.not_any_QMARK_ = function not_any_QMARK_(pred, coll) {
  return cljs.core.not.call(null, cljs.core.some.call(null, pred, coll))
};
cljs.core.even_QMARK_ = function even_QMARK_(n) {
  if(cljs.core.integer_QMARK_.call(null, n)) {
    return(n & 1) === 0
  }else {
    throw new Error([cljs.core.str("Argument must be an integer: "), cljs.core.str(n)].join(""));
  }
};
cljs.core.odd_QMARK_ = function odd_QMARK_(n) {
  return!cljs.core.even_QMARK_.call(null, n)
};
cljs.core.identity = function identity(x) {
  return x
};
cljs.core.complement = function complement(f) {
  return function() {
    var G__15019 = null;
    var G__15019__0 = function() {
      return cljs.core.not.call(null, f.call(null))
    };
    var G__15019__1 = function(x) {
      return cljs.core.not.call(null, f.call(null, x))
    };
    var G__15019__2 = function(x, y) {
      return cljs.core.not.call(null, f.call(null, x, y))
    };
    var G__15019__3 = function() {
      var G__15020__delegate = function(x, y, zs) {
        return cljs.core.not.call(null, cljs.core.apply.call(null, f, x, y, zs))
      };
      var G__15020 = function(x, y, var_args) {
        var zs = null;
        if(goog.isDef(var_args)) {
          zs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
        }
        return G__15020__delegate.call(this, x, y, zs)
      };
      G__15020.cljs$lang$maxFixedArity = 2;
      G__15020.cljs$lang$applyTo = function(arglist__15021) {
        var x = cljs.core.first(arglist__15021);
        var y = cljs.core.first(cljs.core.next(arglist__15021));
        var zs = cljs.core.rest(cljs.core.next(arglist__15021));
        return G__15020__delegate(x, y, zs)
      };
      G__15020.cljs$lang$arity$variadic = G__15020__delegate;
      return G__15020
    }();
    G__15019 = function(x, y, var_args) {
      var zs = var_args;
      switch(arguments.length) {
        case 0:
          return G__15019__0.call(this);
        case 1:
          return G__15019__1.call(this, x);
        case 2:
          return G__15019__2.call(this, x, y);
        default:
          return G__15019__3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
      }
      throw"Invalid arity: " + arguments.length;
    };
    G__15019.cljs$lang$maxFixedArity = 2;
    G__15019.cljs$lang$applyTo = G__15019__3.cljs$lang$applyTo;
    return G__15019
  }()
};
cljs.core.constantly = function constantly(x) {
  return function() {
    var G__15022__delegate = function(args) {
      return x
    };
    var G__15022 = function(var_args) {
      var args = null;
      if(goog.isDef(var_args)) {
        args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
      }
      return G__15022__delegate.call(this, args)
    };
    G__15022.cljs$lang$maxFixedArity = 0;
    G__15022.cljs$lang$applyTo = function(arglist__15023) {
      var args = cljs.core.seq(arglist__15023);
      return G__15022__delegate(args)
    };
    G__15022.cljs$lang$arity$variadic = G__15022__delegate;
    return G__15022
  }()
};
cljs.core.comp = function() {
  var comp = null;
  var comp__0 = function() {
    return cljs.core.identity
  };
  var comp__1 = function(f) {
    return f
  };
  var comp__2 = function(f, g) {
    return function() {
      var G__15030 = null;
      var G__15030__0 = function() {
        return f.call(null, g.call(null))
      };
      var G__15030__1 = function(x) {
        return f.call(null, g.call(null, x))
      };
      var G__15030__2 = function(x, y) {
        return f.call(null, g.call(null, x, y))
      };
      var G__15030__3 = function(x, y, z) {
        return f.call(null, g.call(null, x, y, z))
      };
      var G__15030__4 = function() {
        var G__15031__delegate = function(x, y, z, args) {
          return f.call(null, cljs.core.apply.call(null, g, x, y, z, args))
        };
        var G__15031 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__15031__delegate.call(this, x, y, z, args)
        };
        G__15031.cljs$lang$maxFixedArity = 3;
        G__15031.cljs$lang$applyTo = function(arglist__15032) {
          var x = cljs.core.first(arglist__15032);
          var y = cljs.core.first(cljs.core.next(arglist__15032));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__15032)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__15032)));
          return G__15031__delegate(x, y, z, args)
        };
        G__15031.cljs$lang$arity$variadic = G__15031__delegate;
        return G__15031
      }();
      G__15030 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__15030__0.call(this);
          case 1:
            return G__15030__1.call(this, x);
          case 2:
            return G__15030__2.call(this, x, y);
          case 3:
            return G__15030__3.call(this, x, y, z);
          default:
            return G__15030__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__15030.cljs$lang$maxFixedArity = 3;
      G__15030.cljs$lang$applyTo = G__15030__4.cljs$lang$applyTo;
      return G__15030
    }()
  };
  var comp__3 = function(f, g, h) {
    return function() {
      var G__15033 = null;
      var G__15033__0 = function() {
        return f.call(null, g.call(null, h.call(null)))
      };
      var G__15033__1 = function(x) {
        return f.call(null, g.call(null, h.call(null, x)))
      };
      var G__15033__2 = function(x, y) {
        return f.call(null, g.call(null, h.call(null, x, y)))
      };
      var G__15033__3 = function(x, y, z) {
        return f.call(null, g.call(null, h.call(null, x, y, z)))
      };
      var G__15033__4 = function() {
        var G__15034__delegate = function(x, y, z, args) {
          return f.call(null, g.call(null, cljs.core.apply.call(null, h, x, y, z, args)))
        };
        var G__15034 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__15034__delegate.call(this, x, y, z, args)
        };
        G__15034.cljs$lang$maxFixedArity = 3;
        G__15034.cljs$lang$applyTo = function(arglist__15035) {
          var x = cljs.core.first(arglist__15035);
          var y = cljs.core.first(cljs.core.next(arglist__15035));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__15035)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__15035)));
          return G__15034__delegate(x, y, z, args)
        };
        G__15034.cljs$lang$arity$variadic = G__15034__delegate;
        return G__15034
      }();
      G__15033 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__15033__0.call(this);
          case 1:
            return G__15033__1.call(this, x);
          case 2:
            return G__15033__2.call(this, x, y);
          case 3:
            return G__15033__3.call(this, x, y, z);
          default:
            return G__15033__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__15033.cljs$lang$maxFixedArity = 3;
      G__15033.cljs$lang$applyTo = G__15033__4.cljs$lang$applyTo;
      return G__15033
    }()
  };
  var comp__4 = function() {
    var G__15036__delegate = function(f1, f2, f3, fs) {
      var fs__15027 = cljs.core.reverse.call(null, cljs.core.list_STAR_.call(null, f1, f2, f3, fs));
      return function() {
        var G__15037__delegate = function(args) {
          var ret__15028 = cljs.core.apply.call(null, cljs.core.first.call(null, fs__15027), args);
          var fs__15029 = cljs.core.next.call(null, fs__15027);
          while(true) {
            if(fs__15029) {
              var G__15038 = cljs.core.first.call(null, fs__15029).call(null, ret__15028);
              var G__15039 = cljs.core.next.call(null, fs__15029);
              ret__15028 = G__15038;
              fs__15029 = G__15039;
              continue
            }else {
              return ret__15028
            }
            break
          }
        };
        var G__15037 = function(var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
          }
          return G__15037__delegate.call(this, args)
        };
        G__15037.cljs$lang$maxFixedArity = 0;
        G__15037.cljs$lang$applyTo = function(arglist__15040) {
          var args = cljs.core.seq(arglist__15040);
          return G__15037__delegate(args)
        };
        G__15037.cljs$lang$arity$variadic = G__15037__delegate;
        return G__15037
      }()
    };
    var G__15036 = function(f1, f2, f3, var_args) {
      var fs = null;
      if(goog.isDef(var_args)) {
        fs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__15036__delegate.call(this, f1, f2, f3, fs)
    };
    G__15036.cljs$lang$maxFixedArity = 3;
    G__15036.cljs$lang$applyTo = function(arglist__15041) {
      var f1 = cljs.core.first(arglist__15041);
      var f2 = cljs.core.first(cljs.core.next(arglist__15041));
      var f3 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__15041)));
      var fs = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__15041)));
      return G__15036__delegate(f1, f2, f3, fs)
    };
    G__15036.cljs$lang$arity$variadic = G__15036__delegate;
    return G__15036
  }();
  comp = function(f1, f2, f3, var_args) {
    var fs = var_args;
    switch(arguments.length) {
      case 0:
        return comp__0.call(this);
      case 1:
        return comp__1.call(this, f1);
      case 2:
        return comp__2.call(this, f1, f2);
      case 3:
        return comp__3.call(this, f1, f2, f3);
      default:
        return comp__4.cljs$lang$arity$variadic(f1, f2, f3, cljs.core.array_seq(arguments, 3))
    }
    throw"Invalid arity: " + arguments.length;
  };
  comp.cljs$lang$maxFixedArity = 3;
  comp.cljs$lang$applyTo = comp__4.cljs$lang$applyTo;
  comp.cljs$lang$arity$0 = comp__0;
  comp.cljs$lang$arity$1 = comp__1;
  comp.cljs$lang$arity$2 = comp__2;
  comp.cljs$lang$arity$3 = comp__3;
  comp.cljs$lang$arity$variadic = comp__4.cljs$lang$arity$variadic;
  return comp
}();
cljs.core.partial = function() {
  var partial = null;
  var partial__2 = function(f, arg1) {
    return function() {
      var G__15042__delegate = function(args) {
        return cljs.core.apply.call(null, f, arg1, args)
      };
      var G__15042 = function(var_args) {
        var args = null;
        if(goog.isDef(var_args)) {
          args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
        }
        return G__15042__delegate.call(this, args)
      };
      G__15042.cljs$lang$maxFixedArity = 0;
      G__15042.cljs$lang$applyTo = function(arglist__15043) {
        var args = cljs.core.seq(arglist__15043);
        return G__15042__delegate(args)
      };
      G__15042.cljs$lang$arity$variadic = G__15042__delegate;
      return G__15042
    }()
  };
  var partial__3 = function(f, arg1, arg2) {
    return function() {
      var G__15044__delegate = function(args) {
        return cljs.core.apply.call(null, f, arg1, arg2, args)
      };
      var G__15044 = function(var_args) {
        var args = null;
        if(goog.isDef(var_args)) {
          args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
        }
        return G__15044__delegate.call(this, args)
      };
      G__15044.cljs$lang$maxFixedArity = 0;
      G__15044.cljs$lang$applyTo = function(arglist__15045) {
        var args = cljs.core.seq(arglist__15045);
        return G__15044__delegate(args)
      };
      G__15044.cljs$lang$arity$variadic = G__15044__delegate;
      return G__15044
    }()
  };
  var partial__4 = function(f, arg1, arg2, arg3) {
    return function() {
      var G__15046__delegate = function(args) {
        return cljs.core.apply.call(null, f, arg1, arg2, arg3, args)
      };
      var G__15046 = function(var_args) {
        var args = null;
        if(goog.isDef(var_args)) {
          args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
        }
        return G__15046__delegate.call(this, args)
      };
      G__15046.cljs$lang$maxFixedArity = 0;
      G__15046.cljs$lang$applyTo = function(arglist__15047) {
        var args = cljs.core.seq(arglist__15047);
        return G__15046__delegate(args)
      };
      G__15046.cljs$lang$arity$variadic = G__15046__delegate;
      return G__15046
    }()
  };
  var partial__5 = function() {
    var G__15048__delegate = function(f, arg1, arg2, arg3, more) {
      return function() {
        var G__15049__delegate = function(args) {
          return cljs.core.apply.call(null, f, arg1, arg2, arg3, cljs.core.concat.call(null, more, args))
        };
        var G__15049 = function(var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
          }
          return G__15049__delegate.call(this, args)
        };
        G__15049.cljs$lang$maxFixedArity = 0;
        G__15049.cljs$lang$applyTo = function(arglist__15050) {
          var args = cljs.core.seq(arglist__15050);
          return G__15049__delegate(args)
        };
        G__15049.cljs$lang$arity$variadic = G__15049__delegate;
        return G__15049
      }()
    };
    var G__15048 = function(f, arg1, arg2, arg3, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 4), 0)
      }
      return G__15048__delegate.call(this, f, arg1, arg2, arg3, more)
    };
    G__15048.cljs$lang$maxFixedArity = 4;
    G__15048.cljs$lang$applyTo = function(arglist__15051) {
      var f = cljs.core.first(arglist__15051);
      var arg1 = cljs.core.first(cljs.core.next(arglist__15051));
      var arg2 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__15051)));
      var arg3 = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__15051))));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(arglist__15051))));
      return G__15048__delegate(f, arg1, arg2, arg3, more)
    };
    G__15048.cljs$lang$arity$variadic = G__15048__delegate;
    return G__15048
  }();
  partial = function(f, arg1, arg2, arg3, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 2:
        return partial__2.call(this, f, arg1);
      case 3:
        return partial__3.call(this, f, arg1, arg2);
      case 4:
        return partial__4.call(this, f, arg1, arg2, arg3);
      default:
        return partial__5.cljs$lang$arity$variadic(f, arg1, arg2, arg3, cljs.core.array_seq(arguments, 4))
    }
    throw"Invalid arity: " + arguments.length;
  };
  partial.cljs$lang$maxFixedArity = 4;
  partial.cljs$lang$applyTo = partial__5.cljs$lang$applyTo;
  partial.cljs$lang$arity$2 = partial__2;
  partial.cljs$lang$arity$3 = partial__3;
  partial.cljs$lang$arity$4 = partial__4;
  partial.cljs$lang$arity$variadic = partial__5.cljs$lang$arity$variadic;
  return partial
}();
cljs.core.fnil = function() {
  var fnil = null;
  var fnil__2 = function(f, x) {
    return function() {
      var G__15052 = null;
      var G__15052__1 = function(a) {
        return f.call(null, a == null ? x : a)
      };
      var G__15052__2 = function(a, b) {
        return f.call(null, a == null ? x : a, b)
      };
      var G__15052__3 = function(a, b, c) {
        return f.call(null, a == null ? x : a, b, c)
      };
      var G__15052__4 = function() {
        var G__15053__delegate = function(a, b, c, ds) {
          return cljs.core.apply.call(null, f, a == null ? x : a, b, c, ds)
        };
        var G__15053 = function(a, b, c, var_args) {
          var ds = null;
          if(goog.isDef(var_args)) {
            ds = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__15053__delegate.call(this, a, b, c, ds)
        };
        G__15053.cljs$lang$maxFixedArity = 3;
        G__15053.cljs$lang$applyTo = function(arglist__15054) {
          var a = cljs.core.first(arglist__15054);
          var b = cljs.core.first(cljs.core.next(arglist__15054));
          var c = cljs.core.first(cljs.core.next(cljs.core.next(arglist__15054)));
          var ds = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__15054)));
          return G__15053__delegate(a, b, c, ds)
        };
        G__15053.cljs$lang$arity$variadic = G__15053__delegate;
        return G__15053
      }();
      G__15052 = function(a, b, c, var_args) {
        var ds = var_args;
        switch(arguments.length) {
          case 1:
            return G__15052__1.call(this, a);
          case 2:
            return G__15052__2.call(this, a, b);
          case 3:
            return G__15052__3.call(this, a, b, c);
          default:
            return G__15052__4.cljs$lang$arity$variadic(a, b, c, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__15052.cljs$lang$maxFixedArity = 3;
      G__15052.cljs$lang$applyTo = G__15052__4.cljs$lang$applyTo;
      return G__15052
    }()
  };
  var fnil__3 = function(f, x, y) {
    return function() {
      var G__15055 = null;
      var G__15055__2 = function(a, b) {
        return f.call(null, a == null ? x : a, b == null ? y : b)
      };
      var G__15055__3 = function(a, b, c) {
        return f.call(null, a == null ? x : a, b == null ? y : b, c)
      };
      var G__15055__4 = function() {
        var G__15056__delegate = function(a, b, c, ds) {
          return cljs.core.apply.call(null, f, a == null ? x : a, b == null ? y : b, c, ds)
        };
        var G__15056 = function(a, b, c, var_args) {
          var ds = null;
          if(goog.isDef(var_args)) {
            ds = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__15056__delegate.call(this, a, b, c, ds)
        };
        G__15056.cljs$lang$maxFixedArity = 3;
        G__15056.cljs$lang$applyTo = function(arglist__15057) {
          var a = cljs.core.first(arglist__15057);
          var b = cljs.core.first(cljs.core.next(arglist__15057));
          var c = cljs.core.first(cljs.core.next(cljs.core.next(arglist__15057)));
          var ds = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__15057)));
          return G__15056__delegate(a, b, c, ds)
        };
        G__15056.cljs$lang$arity$variadic = G__15056__delegate;
        return G__15056
      }();
      G__15055 = function(a, b, c, var_args) {
        var ds = var_args;
        switch(arguments.length) {
          case 2:
            return G__15055__2.call(this, a, b);
          case 3:
            return G__15055__3.call(this, a, b, c);
          default:
            return G__15055__4.cljs$lang$arity$variadic(a, b, c, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__15055.cljs$lang$maxFixedArity = 3;
      G__15055.cljs$lang$applyTo = G__15055__4.cljs$lang$applyTo;
      return G__15055
    }()
  };
  var fnil__4 = function(f, x, y, z) {
    return function() {
      var G__15058 = null;
      var G__15058__2 = function(a, b) {
        return f.call(null, a == null ? x : a, b == null ? y : b)
      };
      var G__15058__3 = function(a, b, c) {
        return f.call(null, a == null ? x : a, b == null ? y : b, c == null ? z : c)
      };
      var G__15058__4 = function() {
        var G__15059__delegate = function(a, b, c, ds) {
          return cljs.core.apply.call(null, f, a == null ? x : a, b == null ? y : b, c == null ? z : c, ds)
        };
        var G__15059 = function(a, b, c, var_args) {
          var ds = null;
          if(goog.isDef(var_args)) {
            ds = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__15059__delegate.call(this, a, b, c, ds)
        };
        G__15059.cljs$lang$maxFixedArity = 3;
        G__15059.cljs$lang$applyTo = function(arglist__15060) {
          var a = cljs.core.first(arglist__15060);
          var b = cljs.core.first(cljs.core.next(arglist__15060));
          var c = cljs.core.first(cljs.core.next(cljs.core.next(arglist__15060)));
          var ds = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__15060)));
          return G__15059__delegate(a, b, c, ds)
        };
        G__15059.cljs$lang$arity$variadic = G__15059__delegate;
        return G__15059
      }();
      G__15058 = function(a, b, c, var_args) {
        var ds = var_args;
        switch(arguments.length) {
          case 2:
            return G__15058__2.call(this, a, b);
          case 3:
            return G__15058__3.call(this, a, b, c);
          default:
            return G__15058__4.cljs$lang$arity$variadic(a, b, c, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__15058.cljs$lang$maxFixedArity = 3;
      G__15058.cljs$lang$applyTo = G__15058__4.cljs$lang$applyTo;
      return G__15058
    }()
  };
  fnil = function(f, x, y, z) {
    switch(arguments.length) {
      case 2:
        return fnil__2.call(this, f, x);
      case 3:
        return fnil__3.call(this, f, x, y);
      case 4:
        return fnil__4.call(this, f, x, y, z)
    }
    throw"Invalid arity: " + arguments.length;
  };
  fnil.cljs$lang$arity$2 = fnil__2;
  fnil.cljs$lang$arity$3 = fnil__3;
  fnil.cljs$lang$arity$4 = fnil__4;
  return fnil
}();
cljs.core.map_indexed = function map_indexed(f, coll) {
  var mapi__15076 = function mapi(idx, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3974__auto____15084 = cljs.core.seq.call(null, coll);
      if(temp__3974__auto____15084) {
        var s__15085 = temp__3974__auto____15084;
        if(cljs.core.chunked_seq_QMARK_.call(null, s__15085)) {
          var c__15086 = cljs.core.chunk_first.call(null, s__15085);
          var size__15087 = cljs.core.count.call(null, c__15086);
          var b__15088 = cljs.core.chunk_buffer.call(null, size__15087);
          var n__2527__auto____15089 = size__15087;
          var i__15090 = 0;
          while(true) {
            if(i__15090 < n__2527__auto____15089) {
              cljs.core.chunk_append.call(null, b__15088, f.call(null, idx + i__15090, cljs.core._nth.call(null, c__15086, i__15090)));
              var G__15091 = i__15090 + 1;
              i__15090 = G__15091;
              continue
            }else {
            }
            break
          }
          return cljs.core.chunk_cons.call(null, cljs.core.chunk.call(null, b__15088), mapi.call(null, idx + size__15087, cljs.core.chunk_rest.call(null, s__15085)))
        }else {
          return cljs.core.cons.call(null, f.call(null, idx, cljs.core.first.call(null, s__15085)), mapi.call(null, idx + 1, cljs.core.rest.call(null, s__15085)))
        }
      }else {
        return null
      }
    }, null)
  };
  return mapi__15076.call(null, 0, coll)
};
cljs.core.keep = function keep(f, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__3974__auto____15101 = cljs.core.seq.call(null, coll);
    if(temp__3974__auto____15101) {
      var s__15102 = temp__3974__auto____15101;
      if(cljs.core.chunked_seq_QMARK_.call(null, s__15102)) {
        var c__15103 = cljs.core.chunk_first.call(null, s__15102);
        var size__15104 = cljs.core.count.call(null, c__15103);
        var b__15105 = cljs.core.chunk_buffer.call(null, size__15104);
        var n__2527__auto____15106 = size__15104;
        var i__15107 = 0;
        while(true) {
          if(i__15107 < n__2527__auto____15106) {
            var x__15108 = f.call(null, cljs.core._nth.call(null, c__15103, i__15107));
            if(x__15108 == null) {
            }else {
              cljs.core.chunk_append.call(null, b__15105, x__15108)
            }
            var G__15110 = i__15107 + 1;
            i__15107 = G__15110;
            continue
          }else {
          }
          break
        }
        return cljs.core.chunk_cons.call(null, cljs.core.chunk.call(null, b__15105), keep.call(null, f, cljs.core.chunk_rest.call(null, s__15102)))
      }else {
        var x__15109 = f.call(null, cljs.core.first.call(null, s__15102));
        if(x__15109 == null) {
          return keep.call(null, f, cljs.core.rest.call(null, s__15102))
        }else {
          return cljs.core.cons.call(null, x__15109, keep.call(null, f, cljs.core.rest.call(null, s__15102)))
        }
      }
    }else {
      return null
    }
  }, null)
};
cljs.core.keep_indexed = function keep_indexed(f, coll) {
  var keepi__15136 = function keepi(idx, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3974__auto____15146 = cljs.core.seq.call(null, coll);
      if(temp__3974__auto____15146) {
        var s__15147 = temp__3974__auto____15146;
        if(cljs.core.chunked_seq_QMARK_.call(null, s__15147)) {
          var c__15148 = cljs.core.chunk_first.call(null, s__15147);
          var size__15149 = cljs.core.count.call(null, c__15148);
          var b__15150 = cljs.core.chunk_buffer.call(null, size__15149);
          var n__2527__auto____15151 = size__15149;
          var i__15152 = 0;
          while(true) {
            if(i__15152 < n__2527__auto____15151) {
              var x__15153 = f.call(null, idx + i__15152, cljs.core._nth.call(null, c__15148, i__15152));
              if(x__15153 == null) {
              }else {
                cljs.core.chunk_append.call(null, b__15150, x__15153)
              }
              var G__15155 = i__15152 + 1;
              i__15152 = G__15155;
              continue
            }else {
            }
            break
          }
          return cljs.core.chunk_cons.call(null, cljs.core.chunk.call(null, b__15150), keepi.call(null, idx + size__15149, cljs.core.chunk_rest.call(null, s__15147)))
        }else {
          var x__15154 = f.call(null, idx, cljs.core.first.call(null, s__15147));
          if(x__15154 == null) {
            return keepi.call(null, idx + 1, cljs.core.rest.call(null, s__15147))
          }else {
            return cljs.core.cons.call(null, x__15154, keepi.call(null, idx + 1, cljs.core.rest.call(null, s__15147)))
          }
        }
      }else {
        return null
      }
    }, null)
  };
  return keepi__15136.call(null, 0, coll)
};
cljs.core.every_pred = function() {
  var every_pred = null;
  var every_pred__1 = function(p) {
    return function() {
      var ep1 = null;
      var ep1__0 = function() {
        return true
      };
      var ep1__1 = function(x) {
        return cljs.core.boolean$.call(null, p.call(null, x))
      };
      var ep1__2 = function(x, y) {
        return cljs.core.boolean$.call(null, function() {
          var and__3822__auto____15241 = p.call(null, x);
          if(cljs.core.truth_(and__3822__auto____15241)) {
            return p.call(null, y)
          }else {
            return and__3822__auto____15241
          }
        }())
      };
      var ep1__3 = function(x, y, z) {
        return cljs.core.boolean$.call(null, function() {
          var and__3822__auto____15242 = p.call(null, x);
          if(cljs.core.truth_(and__3822__auto____15242)) {
            var and__3822__auto____15243 = p.call(null, y);
            if(cljs.core.truth_(and__3822__auto____15243)) {
              return p.call(null, z)
            }else {
              return and__3822__auto____15243
            }
          }else {
            return and__3822__auto____15242
          }
        }())
      };
      var ep1__4 = function() {
        var G__15312__delegate = function(x, y, z, args) {
          return cljs.core.boolean$.call(null, function() {
            var and__3822__auto____15244 = ep1.call(null, x, y, z);
            if(cljs.core.truth_(and__3822__auto____15244)) {
              return cljs.core.every_QMARK_.call(null, p, args)
            }else {
              return and__3822__auto____15244
            }
          }())
        };
        var G__15312 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__15312__delegate.call(this, x, y, z, args)
        };
        G__15312.cljs$lang$maxFixedArity = 3;
        G__15312.cljs$lang$applyTo = function(arglist__15313) {
          var x = cljs.core.first(arglist__15313);
          var y = cljs.core.first(cljs.core.next(arglist__15313));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__15313)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__15313)));
          return G__15312__delegate(x, y, z, args)
        };
        G__15312.cljs$lang$arity$variadic = G__15312__delegate;
        return G__15312
      }();
      ep1 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return ep1__0.call(this);
          case 1:
            return ep1__1.call(this, x);
          case 2:
            return ep1__2.call(this, x, y);
          case 3:
            return ep1__3.call(this, x, y, z);
          default:
            return ep1__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      ep1.cljs$lang$maxFixedArity = 3;
      ep1.cljs$lang$applyTo = ep1__4.cljs$lang$applyTo;
      ep1.cljs$lang$arity$0 = ep1__0;
      ep1.cljs$lang$arity$1 = ep1__1;
      ep1.cljs$lang$arity$2 = ep1__2;
      ep1.cljs$lang$arity$3 = ep1__3;
      ep1.cljs$lang$arity$variadic = ep1__4.cljs$lang$arity$variadic;
      return ep1
    }()
  };
  var every_pred__2 = function(p1, p2) {
    return function() {
      var ep2 = null;
      var ep2__0 = function() {
        return true
      };
      var ep2__1 = function(x) {
        return cljs.core.boolean$.call(null, function() {
          var and__3822__auto____15256 = p1.call(null, x);
          if(cljs.core.truth_(and__3822__auto____15256)) {
            return p2.call(null, x)
          }else {
            return and__3822__auto____15256
          }
        }())
      };
      var ep2__2 = function(x, y) {
        return cljs.core.boolean$.call(null, function() {
          var and__3822__auto____15257 = p1.call(null, x);
          if(cljs.core.truth_(and__3822__auto____15257)) {
            var and__3822__auto____15258 = p1.call(null, y);
            if(cljs.core.truth_(and__3822__auto____15258)) {
              var and__3822__auto____15259 = p2.call(null, x);
              if(cljs.core.truth_(and__3822__auto____15259)) {
                return p2.call(null, y)
              }else {
                return and__3822__auto____15259
              }
            }else {
              return and__3822__auto____15258
            }
          }else {
            return and__3822__auto____15257
          }
        }())
      };
      var ep2__3 = function(x, y, z) {
        return cljs.core.boolean$.call(null, function() {
          var and__3822__auto____15260 = p1.call(null, x);
          if(cljs.core.truth_(and__3822__auto____15260)) {
            var and__3822__auto____15261 = p1.call(null, y);
            if(cljs.core.truth_(and__3822__auto____15261)) {
              var and__3822__auto____15262 = p1.call(null, z);
              if(cljs.core.truth_(and__3822__auto____15262)) {
                var and__3822__auto____15263 = p2.call(null, x);
                if(cljs.core.truth_(and__3822__auto____15263)) {
                  var and__3822__auto____15264 = p2.call(null, y);
                  if(cljs.core.truth_(and__3822__auto____15264)) {
                    return p2.call(null, z)
                  }else {
                    return and__3822__auto____15264
                  }
                }else {
                  return and__3822__auto____15263
                }
              }else {
                return and__3822__auto____15262
              }
            }else {
              return and__3822__auto____15261
            }
          }else {
            return and__3822__auto____15260
          }
        }())
      };
      var ep2__4 = function() {
        var G__15314__delegate = function(x, y, z, args) {
          return cljs.core.boolean$.call(null, function() {
            var and__3822__auto____15265 = ep2.call(null, x, y, z);
            if(cljs.core.truth_(and__3822__auto____15265)) {
              return cljs.core.every_QMARK_.call(null, function(p1__15111_SHARP_) {
                var and__3822__auto____15266 = p1.call(null, p1__15111_SHARP_);
                if(cljs.core.truth_(and__3822__auto____15266)) {
                  return p2.call(null, p1__15111_SHARP_)
                }else {
                  return and__3822__auto____15266
                }
              }, args)
            }else {
              return and__3822__auto____15265
            }
          }())
        };
        var G__15314 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__15314__delegate.call(this, x, y, z, args)
        };
        G__15314.cljs$lang$maxFixedArity = 3;
        G__15314.cljs$lang$applyTo = function(arglist__15315) {
          var x = cljs.core.first(arglist__15315);
          var y = cljs.core.first(cljs.core.next(arglist__15315));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__15315)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__15315)));
          return G__15314__delegate(x, y, z, args)
        };
        G__15314.cljs$lang$arity$variadic = G__15314__delegate;
        return G__15314
      }();
      ep2 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return ep2__0.call(this);
          case 1:
            return ep2__1.call(this, x);
          case 2:
            return ep2__2.call(this, x, y);
          case 3:
            return ep2__3.call(this, x, y, z);
          default:
            return ep2__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      ep2.cljs$lang$maxFixedArity = 3;
      ep2.cljs$lang$applyTo = ep2__4.cljs$lang$applyTo;
      ep2.cljs$lang$arity$0 = ep2__0;
      ep2.cljs$lang$arity$1 = ep2__1;
      ep2.cljs$lang$arity$2 = ep2__2;
      ep2.cljs$lang$arity$3 = ep2__3;
      ep2.cljs$lang$arity$variadic = ep2__4.cljs$lang$arity$variadic;
      return ep2
    }()
  };
  var every_pred__3 = function(p1, p2, p3) {
    return function() {
      var ep3 = null;
      var ep3__0 = function() {
        return true
      };
      var ep3__1 = function(x) {
        return cljs.core.boolean$.call(null, function() {
          var and__3822__auto____15285 = p1.call(null, x);
          if(cljs.core.truth_(and__3822__auto____15285)) {
            var and__3822__auto____15286 = p2.call(null, x);
            if(cljs.core.truth_(and__3822__auto____15286)) {
              return p3.call(null, x)
            }else {
              return and__3822__auto____15286
            }
          }else {
            return and__3822__auto____15285
          }
        }())
      };
      var ep3__2 = function(x, y) {
        return cljs.core.boolean$.call(null, function() {
          var and__3822__auto____15287 = p1.call(null, x);
          if(cljs.core.truth_(and__3822__auto____15287)) {
            var and__3822__auto____15288 = p2.call(null, x);
            if(cljs.core.truth_(and__3822__auto____15288)) {
              var and__3822__auto____15289 = p3.call(null, x);
              if(cljs.core.truth_(and__3822__auto____15289)) {
                var and__3822__auto____15290 = p1.call(null, y);
                if(cljs.core.truth_(and__3822__auto____15290)) {
                  var and__3822__auto____15291 = p2.call(null, y);
                  if(cljs.core.truth_(and__3822__auto____15291)) {
                    return p3.call(null, y)
                  }else {
                    return and__3822__auto____15291
                  }
                }else {
                  return and__3822__auto____15290
                }
              }else {
                return and__3822__auto____15289
              }
            }else {
              return and__3822__auto____15288
            }
          }else {
            return and__3822__auto____15287
          }
        }())
      };
      var ep3__3 = function(x, y, z) {
        return cljs.core.boolean$.call(null, function() {
          var and__3822__auto____15292 = p1.call(null, x);
          if(cljs.core.truth_(and__3822__auto____15292)) {
            var and__3822__auto____15293 = p2.call(null, x);
            if(cljs.core.truth_(and__3822__auto____15293)) {
              var and__3822__auto____15294 = p3.call(null, x);
              if(cljs.core.truth_(and__3822__auto____15294)) {
                var and__3822__auto____15295 = p1.call(null, y);
                if(cljs.core.truth_(and__3822__auto____15295)) {
                  var and__3822__auto____15296 = p2.call(null, y);
                  if(cljs.core.truth_(and__3822__auto____15296)) {
                    var and__3822__auto____15297 = p3.call(null, y);
                    if(cljs.core.truth_(and__3822__auto____15297)) {
                      var and__3822__auto____15298 = p1.call(null, z);
                      if(cljs.core.truth_(and__3822__auto____15298)) {
                        var and__3822__auto____15299 = p2.call(null, z);
                        if(cljs.core.truth_(and__3822__auto____15299)) {
                          return p3.call(null, z)
                        }else {
                          return and__3822__auto____15299
                        }
                      }else {
                        return and__3822__auto____15298
                      }
                    }else {
                      return and__3822__auto____15297
                    }
                  }else {
                    return and__3822__auto____15296
                  }
                }else {
                  return and__3822__auto____15295
                }
              }else {
                return and__3822__auto____15294
              }
            }else {
              return and__3822__auto____15293
            }
          }else {
            return and__3822__auto____15292
          }
        }())
      };
      var ep3__4 = function() {
        var G__15316__delegate = function(x, y, z, args) {
          return cljs.core.boolean$.call(null, function() {
            var and__3822__auto____15300 = ep3.call(null, x, y, z);
            if(cljs.core.truth_(and__3822__auto____15300)) {
              return cljs.core.every_QMARK_.call(null, function(p1__15112_SHARP_) {
                var and__3822__auto____15301 = p1.call(null, p1__15112_SHARP_);
                if(cljs.core.truth_(and__3822__auto____15301)) {
                  var and__3822__auto____15302 = p2.call(null, p1__15112_SHARP_);
                  if(cljs.core.truth_(and__3822__auto____15302)) {
                    return p3.call(null, p1__15112_SHARP_)
                  }else {
                    return and__3822__auto____15302
                  }
                }else {
                  return and__3822__auto____15301
                }
              }, args)
            }else {
              return and__3822__auto____15300
            }
          }())
        };
        var G__15316 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__15316__delegate.call(this, x, y, z, args)
        };
        G__15316.cljs$lang$maxFixedArity = 3;
        G__15316.cljs$lang$applyTo = function(arglist__15317) {
          var x = cljs.core.first(arglist__15317);
          var y = cljs.core.first(cljs.core.next(arglist__15317));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__15317)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__15317)));
          return G__15316__delegate(x, y, z, args)
        };
        G__15316.cljs$lang$arity$variadic = G__15316__delegate;
        return G__15316
      }();
      ep3 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return ep3__0.call(this);
          case 1:
            return ep3__1.call(this, x);
          case 2:
            return ep3__2.call(this, x, y);
          case 3:
            return ep3__3.call(this, x, y, z);
          default:
            return ep3__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      ep3.cljs$lang$maxFixedArity = 3;
      ep3.cljs$lang$applyTo = ep3__4.cljs$lang$applyTo;
      ep3.cljs$lang$arity$0 = ep3__0;
      ep3.cljs$lang$arity$1 = ep3__1;
      ep3.cljs$lang$arity$2 = ep3__2;
      ep3.cljs$lang$arity$3 = ep3__3;
      ep3.cljs$lang$arity$variadic = ep3__4.cljs$lang$arity$variadic;
      return ep3
    }()
  };
  var every_pred__4 = function() {
    var G__15318__delegate = function(p1, p2, p3, ps) {
      var ps__15303 = cljs.core.list_STAR_.call(null, p1, p2, p3, ps);
      return function() {
        var epn = null;
        var epn__0 = function() {
          return true
        };
        var epn__1 = function(x) {
          return cljs.core.every_QMARK_.call(null, function(p1__15113_SHARP_) {
            return p1__15113_SHARP_.call(null, x)
          }, ps__15303)
        };
        var epn__2 = function(x, y) {
          return cljs.core.every_QMARK_.call(null, function(p1__15114_SHARP_) {
            var and__3822__auto____15308 = p1__15114_SHARP_.call(null, x);
            if(cljs.core.truth_(and__3822__auto____15308)) {
              return p1__15114_SHARP_.call(null, y)
            }else {
              return and__3822__auto____15308
            }
          }, ps__15303)
        };
        var epn__3 = function(x, y, z) {
          return cljs.core.every_QMARK_.call(null, function(p1__15115_SHARP_) {
            var and__3822__auto____15309 = p1__15115_SHARP_.call(null, x);
            if(cljs.core.truth_(and__3822__auto____15309)) {
              var and__3822__auto____15310 = p1__15115_SHARP_.call(null, y);
              if(cljs.core.truth_(and__3822__auto____15310)) {
                return p1__15115_SHARP_.call(null, z)
              }else {
                return and__3822__auto____15310
              }
            }else {
              return and__3822__auto____15309
            }
          }, ps__15303)
        };
        var epn__4 = function() {
          var G__15319__delegate = function(x, y, z, args) {
            return cljs.core.boolean$.call(null, function() {
              var and__3822__auto____15311 = epn.call(null, x, y, z);
              if(cljs.core.truth_(and__3822__auto____15311)) {
                return cljs.core.every_QMARK_.call(null, function(p1__15116_SHARP_) {
                  return cljs.core.every_QMARK_.call(null, p1__15116_SHARP_, args)
                }, ps__15303)
              }else {
                return and__3822__auto____15311
              }
            }())
          };
          var G__15319 = function(x, y, z, var_args) {
            var args = null;
            if(goog.isDef(var_args)) {
              args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
            }
            return G__15319__delegate.call(this, x, y, z, args)
          };
          G__15319.cljs$lang$maxFixedArity = 3;
          G__15319.cljs$lang$applyTo = function(arglist__15320) {
            var x = cljs.core.first(arglist__15320);
            var y = cljs.core.first(cljs.core.next(arglist__15320));
            var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__15320)));
            var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__15320)));
            return G__15319__delegate(x, y, z, args)
          };
          G__15319.cljs$lang$arity$variadic = G__15319__delegate;
          return G__15319
        }();
        epn = function(x, y, z, var_args) {
          var args = var_args;
          switch(arguments.length) {
            case 0:
              return epn__0.call(this);
            case 1:
              return epn__1.call(this, x);
            case 2:
              return epn__2.call(this, x, y);
            case 3:
              return epn__3.call(this, x, y, z);
            default:
              return epn__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
          }
          throw"Invalid arity: " + arguments.length;
        };
        epn.cljs$lang$maxFixedArity = 3;
        epn.cljs$lang$applyTo = epn__4.cljs$lang$applyTo;
        epn.cljs$lang$arity$0 = epn__0;
        epn.cljs$lang$arity$1 = epn__1;
        epn.cljs$lang$arity$2 = epn__2;
        epn.cljs$lang$arity$3 = epn__3;
        epn.cljs$lang$arity$variadic = epn__4.cljs$lang$arity$variadic;
        return epn
      }()
    };
    var G__15318 = function(p1, p2, p3, var_args) {
      var ps = null;
      if(goog.isDef(var_args)) {
        ps = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__15318__delegate.call(this, p1, p2, p3, ps)
    };
    G__15318.cljs$lang$maxFixedArity = 3;
    G__15318.cljs$lang$applyTo = function(arglist__15321) {
      var p1 = cljs.core.first(arglist__15321);
      var p2 = cljs.core.first(cljs.core.next(arglist__15321));
      var p3 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__15321)));
      var ps = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__15321)));
      return G__15318__delegate(p1, p2, p3, ps)
    };
    G__15318.cljs$lang$arity$variadic = G__15318__delegate;
    return G__15318
  }();
  every_pred = function(p1, p2, p3, var_args) {
    var ps = var_args;
    switch(arguments.length) {
      case 1:
        return every_pred__1.call(this, p1);
      case 2:
        return every_pred__2.call(this, p1, p2);
      case 3:
        return every_pred__3.call(this, p1, p2, p3);
      default:
        return every_pred__4.cljs$lang$arity$variadic(p1, p2, p3, cljs.core.array_seq(arguments, 3))
    }
    throw"Invalid arity: " + arguments.length;
  };
  every_pred.cljs$lang$maxFixedArity = 3;
  every_pred.cljs$lang$applyTo = every_pred__4.cljs$lang$applyTo;
  every_pred.cljs$lang$arity$1 = every_pred__1;
  every_pred.cljs$lang$arity$2 = every_pred__2;
  every_pred.cljs$lang$arity$3 = every_pred__3;
  every_pred.cljs$lang$arity$variadic = every_pred__4.cljs$lang$arity$variadic;
  return every_pred
}();
cljs.core.some_fn = function() {
  var some_fn = null;
  var some_fn__1 = function(p) {
    return function() {
      var sp1 = null;
      var sp1__0 = function() {
        return null
      };
      var sp1__1 = function(x) {
        return p.call(null, x)
      };
      var sp1__2 = function(x, y) {
        var or__3824__auto____15402 = p.call(null, x);
        if(cljs.core.truth_(or__3824__auto____15402)) {
          return or__3824__auto____15402
        }else {
          return p.call(null, y)
        }
      };
      var sp1__3 = function(x, y, z) {
        var or__3824__auto____15403 = p.call(null, x);
        if(cljs.core.truth_(or__3824__auto____15403)) {
          return or__3824__auto____15403
        }else {
          var or__3824__auto____15404 = p.call(null, y);
          if(cljs.core.truth_(or__3824__auto____15404)) {
            return or__3824__auto____15404
          }else {
            return p.call(null, z)
          }
        }
      };
      var sp1__4 = function() {
        var G__15473__delegate = function(x, y, z, args) {
          var or__3824__auto____15405 = sp1.call(null, x, y, z);
          if(cljs.core.truth_(or__3824__auto____15405)) {
            return or__3824__auto____15405
          }else {
            return cljs.core.some.call(null, p, args)
          }
        };
        var G__15473 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__15473__delegate.call(this, x, y, z, args)
        };
        G__15473.cljs$lang$maxFixedArity = 3;
        G__15473.cljs$lang$applyTo = function(arglist__15474) {
          var x = cljs.core.first(arglist__15474);
          var y = cljs.core.first(cljs.core.next(arglist__15474));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__15474)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__15474)));
          return G__15473__delegate(x, y, z, args)
        };
        G__15473.cljs$lang$arity$variadic = G__15473__delegate;
        return G__15473
      }();
      sp1 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return sp1__0.call(this);
          case 1:
            return sp1__1.call(this, x);
          case 2:
            return sp1__2.call(this, x, y);
          case 3:
            return sp1__3.call(this, x, y, z);
          default:
            return sp1__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      sp1.cljs$lang$maxFixedArity = 3;
      sp1.cljs$lang$applyTo = sp1__4.cljs$lang$applyTo;
      sp1.cljs$lang$arity$0 = sp1__0;
      sp1.cljs$lang$arity$1 = sp1__1;
      sp1.cljs$lang$arity$2 = sp1__2;
      sp1.cljs$lang$arity$3 = sp1__3;
      sp1.cljs$lang$arity$variadic = sp1__4.cljs$lang$arity$variadic;
      return sp1
    }()
  };
  var some_fn__2 = function(p1, p2) {
    return function() {
      var sp2 = null;
      var sp2__0 = function() {
        return null
      };
      var sp2__1 = function(x) {
        var or__3824__auto____15417 = p1.call(null, x);
        if(cljs.core.truth_(or__3824__auto____15417)) {
          return or__3824__auto____15417
        }else {
          return p2.call(null, x)
        }
      };
      var sp2__2 = function(x, y) {
        var or__3824__auto____15418 = p1.call(null, x);
        if(cljs.core.truth_(or__3824__auto____15418)) {
          return or__3824__auto____15418
        }else {
          var or__3824__auto____15419 = p1.call(null, y);
          if(cljs.core.truth_(or__3824__auto____15419)) {
            return or__3824__auto____15419
          }else {
            var or__3824__auto____15420 = p2.call(null, x);
            if(cljs.core.truth_(or__3824__auto____15420)) {
              return or__3824__auto____15420
            }else {
              return p2.call(null, y)
            }
          }
        }
      };
      var sp2__3 = function(x, y, z) {
        var or__3824__auto____15421 = p1.call(null, x);
        if(cljs.core.truth_(or__3824__auto____15421)) {
          return or__3824__auto____15421
        }else {
          var or__3824__auto____15422 = p1.call(null, y);
          if(cljs.core.truth_(or__3824__auto____15422)) {
            return or__3824__auto____15422
          }else {
            var or__3824__auto____15423 = p1.call(null, z);
            if(cljs.core.truth_(or__3824__auto____15423)) {
              return or__3824__auto____15423
            }else {
              var or__3824__auto____15424 = p2.call(null, x);
              if(cljs.core.truth_(or__3824__auto____15424)) {
                return or__3824__auto____15424
              }else {
                var or__3824__auto____15425 = p2.call(null, y);
                if(cljs.core.truth_(or__3824__auto____15425)) {
                  return or__3824__auto____15425
                }else {
                  return p2.call(null, z)
                }
              }
            }
          }
        }
      };
      var sp2__4 = function() {
        var G__15475__delegate = function(x, y, z, args) {
          var or__3824__auto____15426 = sp2.call(null, x, y, z);
          if(cljs.core.truth_(or__3824__auto____15426)) {
            return or__3824__auto____15426
          }else {
            return cljs.core.some.call(null, function(p1__15156_SHARP_) {
              var or__3824__auto____15427 = p1.call(null, p1__15156_SHARP_);
              if(cljs.core.truth_(or__3824__auto____15427)) {
                return or__3824__auto____15427
              }else {
                return p2.call(null, p1__15156_SHARP_)
              }
            }, args)
          }
        };
        var G__15475 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__15475__delegate.call(this, x, y, z, args)
        };
        G__15475.cljs$lang$maxFixedArity = 3;
        G__15475.cljs$lang$applyTo = function(arglist__15476) {
          var x = cljs.core.first(arglist__15476);
          var y = cljs.core.first(cljs.core.next(arglist__15476));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__15476)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__15476)));
          return G__15475__delegate(x, y, z, args)
        };
        G__15475.cljs$lang$arity$variadic = G__15475__delegate;
        return G__15475
      }();
      sp2 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return sp2__0.call(this);
          case 1:
            return sp2__1.call(this, x);
          case 2:
            return sp2__2.call(this, x, y);
          case 3:
            return sp2__3.call(this, x, y, z);
          default:
            return sp2__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      sp2.cljs$lang$maxFixedArity = 3;
      sp2.cljs$lang$applyTo = sp2__4.cljs$lang$applyTo;
      sp2.cljs$lang$arity$0 = sp2__0;
      sp2.cljs$lang$arity$1 = sp2__1;
      sp2.cljs$lang$arity$2 = sp2__2;
      sp2.cljs$lang$arity$3 = sp2__3;
      sp2.cljs$lang$arity$variadic = sp2__4.cljs$lang$arity$variadic;
      return sp2
    }()
  };
  var some_fn__3 = function(p1, p2, p3) {
    return function() {
      var sp3 = null;
      var sp3__0 = function() {
        return null
      };
      var sp3__1 = function(x) {
        var or__3824__auto____15446 = p1.call(null, x);
        if(cljs.core.truth_(or__3824__auto____15446)) {
          return or__3824__auto____15446
        }else {
          var or__3824__auto____15447 = p2.call(null, x);
          if(cljs.core.truth_(or__3824__auto____15447)) {
            return or__3824__auto____15447
          }else {
            return p3.call(null, x)
          }
        }
      };
      var sp3__2 = function(x, y) {
        var or__3824__auto____15448 = p1.call(null, x);
        if(cljs.core.truth_(or__3824__auto____15448)) {
          return or__3824__auto____15448
        }else {
          var or__3824__auto____15449 = p2.call(null, x);
          if(cljs.core.truth_(or__3824__auto____15449)) {
            return or__3824__auto____15449
          }else {
            var or__3824__auto____15450 = p3.call(null, x);
            if(cljs.core.truth_(or__3824__auto____15450)) {
              return or__3824__auto____15450
            }else {
              var or__3824__auto____15451 = p1.call(null, y);
              if(cljs.core.truth_(or__3824__auto____15451)) {
                return or__3824__auto____15451
              }else {
                var or__3824__auto____15452 = p2.call(null, y);
                if(cljs.core.truth_(or__3824__auto____15452)) {
                  return or__3824__auto____15452
                }else {
                  return p3.call(null, y)
                }
              }
            }
          }
        }
      };
      var sp3__3 = function(x, y, z) {
        var or__3824__auto____15453 = p1.call(null, x);
        if(cljs.core.truth_(or__3824__auto____15453)) {
          return or__3824__auto____15453
        }else {
          var or__3824__auto____15454 = p2.call(null, x);
          if(cljs.core.truth_(or__3824__auto____15454)) {
            return or__3824__auto____15454
          }else {
            var or__3824__auto____15455 = p3.call(null, x);
            if(cljs.core.truth_(or__3824__auto____15455)) {
              return or__3824__auto____15455
            }else {
              var or__3824__auto____15456 = p1.call(null, y);
              if(cljs.core.truth_(or__3824__auto____15456)) {
                return or__3824__auto____15456
              }else {
                var or__3824__auto____15457 = p2.call(null, y);
                if(cljs.core.truth_(or__3824__auto____15457)) {
                  return or__3824__auto____15457
                }else {
                  var or__3824__auto____15458 = p3.call(null, y);
                  if(cljs.core.truth_(or__3824__auto____15458)) {
                    return or__3824__auto____15458
                  }else {
                    var or__3824__auto____15459 = p1.call(null, z);
                    if(cljs.core.truth_(or__3824__auto____15459)) {
                      return or__3824__auto____15459
                    }else {
                      var or__3824__auto____15460 = p2.call(null, z);
                      if(cljs.core.truth_(or__3824__auto____15460)) {
                        return or__3824__auto____15460
                      }else {
                        return p3.call(null, z)
                      }
                    }
                  }
                }
              }
            }
          }
        }
      };
      var sp3__4 = function() {
        var G__15477__delegate = function(x, y, z, args) {
          var or__3824__auto____15461 = sp3.call(null, x, y, z);
          if(cljs.core.truth_(or__3824__auto____15461)) {
            return or__3824__auto____15461
          }else {
            return cljs.core.some.call(null, function(p1__15157_SHARP_) {
              var or__3824__auto____15462 = p1.call(null, p1__15157_SHARP_);
              if(cljs.core.truth_(or__3824__auto____15462)) {
                return or__3824__auto____15462
              }else {
                var or__3824__auto____15463 = p2.call(null, p1__15157_SHARP_);
                if(cljs.core.truth_(or__3824__auto____15463)) {
                  return or__3824__auto____15463
                }else {
                  return p3.call(null, p1__15157_SHARP_)
                }
              }
            }, args)
          }
        };
        var G__15477 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__15477__delegate.call(this, x, y, z, args)
        };
        G__15477.cljs$lang$maxFixedArity = 3;
        G__15477.cljs$lang$applyTo = function(arglist__15478) {
          var x = cljs.core.first(arglist__15478);
          var y = cljs.core.first(cljs.core.next(arglist__15478));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__15478)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__15478)));
          return G__15477__delegate(x, y, z, args)
        };
        G__15477.cljs$lang$arity$variadic = G__15477__delegate;
        return G__15477
      }();
      sp3 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return sp3__0.call(this);
          case 1:
            return sp3__1.call(this, x);
          case 2:
            return sp3__2.call(this, x, y);
          case 3:
            return sp3__3.call(this, x, y, z);
          default:
            return sp3__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      sp3.cljs$lang$maxFixedArity = 3;
      sp3.cljs$lang$applyTo = sp3__4.cljs$lang$applyTo;
      sp3.cljs$lang$arity$0 = sp3__0;
      sp3.cljs$lang$arity$1 = sp3__1;
      sp3.cljs$lang$arity$2 = sp3__2;
      sp3.cljs$lang$arity$3 = sp3__3;
      sp3.cljs$lang$arity$variadic = sp3__4.cljs$lang$arity$variadic;
      return sp3
    }()
  };
  var some_fn__4 = function() {
    var G__15479__delegate = function(p1, p2, p3, ps) {
      var ps__15464 = cljs.core.list_STAR_.call(null, p1, p2, p3, ps);
      return function() {
        var spn = null;
        var spn__0 = function() {
          return null
        };
        var spn__1 = function(x) {
          return cljs.core.some.call(null, function(p1__15158_SHARP_) {
            return p1__15158_SHARP_.call(null, x)
          }, ps__15464)
        };
        var spn__2 = function(x, y) {
          return cljs.core.some.call(null, function(p1__15159_SHARP_) {
            var or__3824__auto____15469 = p1__15159_SHARP_.call(null, x);
            if(cljs.core.truth_(or__3824__auto____15469)) {
              return or__3824__auto____15469
            }else {
              return p1__15159_SHARP_.call(null, y)
            }
          }, ps__15464)
        };
        var spn__3 = function(x, y, z) {
          return cljs.core.some.call(null, function(p1__15160_SHARP_) {
            var or__3824__auto____15470 = p1__15160_SHARP_.call(null, x);
            if(cljs.core.truth_(or__3824__auto____15470)) {
              return or__3824__auto____15470
            }else {
              var or__3824__auto____15471 = p1__15160_SHARP_.call(null, y);
              if(cljs.core.truth_(or__3824__auto____15471)) {
                return or__3824__auto____15471
              }else {
                return p1__15160_SHARP_.call(null, z)
              }
            }
          }, ps__15464)
        };
        var spn__4 = function() {
          var G__15480__delegate = function(x, y, z, args) {
            var or__3824__auto____15472 = spn.call(null, x, y, z);
            if(cljs.core.truth_(or__3824__auto____15472)) {
              return or__3824__auto____15472
            }else {
              return cljs.core.some.call(null, function(p1__15161_SHARP_) {
                return cljs.core.some.call(null, p1__15161_SHARP_, args)
              }, ps__15464)
            }
          };
          var G__15480 = function(x, y, z, var_args) {
            var args = null;
            if(goog.isDef(var_args)) {
              args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
            }
            return G__15480__delegate.call(this, x, y, z, args)
          };
          G__15480.cljs$lang$maxFixedArity = 3;
          G__15480.cljs$lang$applyTo = function(arglist__15481) {
            var x = cljs.core.first(arglist__15481);
            var y = cljs.core.first(cljs.core.next(arglist__15481));
            var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__15481)));
            var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__15481)));
            return G__15480__delegate(x, y, z, args)
          };
          G__15480.cljs$lang$arity$variadic = G__15480__delegate;
          return G__15480
        }();
        spn = function(x, y, z, var_args) {
          var args = var_args;
          switch(arguments.length) {
            case 0:
              return spn__0.call(this);
            case 1:
              return spn__1.call(this, x);
            case 2:
              return spn__2.call(this, x, y);
            case 3:
              return spn__3.call(this, x, y, z);
            default:
              return spn__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
          }
          throw"Invalid arity: " + arguments.length;
        };
        spn.cljs$lang$maxFixedArity = 3;
        spn.cljs$lang$applyTo = spn__4.cljs$lang$applyTo;
        spn.cljs$lang$arity$0 = spn__0;
        spn.cljs$lang$arity$1 = spn__1;
        spn.cljs$lang$arity$2 = spn__2;
        spn.cljs$lang$arity$3 = spn__3;
        spn.cljs$lang$arity$variadic = spn__4.cljs$lang$arity$variadic;
        return spn
      }()
    };
    var G__15479 = function(p1, p2, p3, var_args) {
      var ps = null;
      if(goog.isDef(var_args)) {
        ps = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__15479__delegate.call(this, p1, p2, p3, ps)
    };
    G__15479.cljs$lang$maxFixedArity = 3;
    G__15479.cljs$lang$applyTo = function(arglist__15482) {
      var p1 = cljs.core.first(arglist__15482);
      var p2 = cljs.core.first(cljs.core.next(arglist__15482));
      var p3 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__15482)));
      var ps = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__15482)));
      return G__15479__delegate(p1, p2, p3, ps)
    };
    G__15479.cljs$lang$arity$variadic = G__15479__delegate;
    return G__15479
  }();
  some_fn = function(p1, p2, p3, var_args) {
    var ps = var_args;
    switch(arguments.length) {
      case 1:
        return some_fn__1.call(this, p1);
      case 2:
        return some_fn__2.call(this, p1, p2);
      case 3:
        return some_fn__3.call(this, p1, p2, p3);
      default:
        return some_fn__4.cljs$lang$arity$variadic(p1, p2, p3, cljs.core.array_seq(arguments, 3))
    }
    throw"Invalid arity: " + arguments.length;
  };
  some_fn.cljs$lang$maxFixedArity = 3;
  some_fn.cljs$lang$applyTo = some_fn__4.cljs$lang$applyTo;
  some_fn.cljs$lang$arity$1 = some_fn__1;
  some_fn.cljs$lang$arity$2 = some_fn__2;
  some_fn.cljs$lang$arity$3 = some_fn__3;
  some_fn.cljs$lang$arity$variadic = some_fn__4.cljs$lang$arity$variadic;
  return some_fn
}();
cljs.core.map = function() {
  var map = null;
  var map__2 = function(f, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3974__auto____15501 = cljs.core.seq.call(null, coll);
      if(temp__3974__auto____15501) {
        var s__15502 = temp__3974__auto____15501;
        if(cljs.core.chunked_seq_QMARK_.call(null, s__15502)) {
          var c__15503 = cljs.core.chunk_first.call(null, s__15502);
          var size__15504 = cljs.core.count.call(null, c__15503);
          var b__15505 = cljs.core.chunk_buffer.call(null, size__15504);
          var n__2527__auto____15506 = size__15504;
          var i__15507 = 0;
          while(true) {
            if(i__15507 < n__2527__auto____15506) {
              cljs.core.chunk_append.call(null, b__15505, f.call(null, cljs.core._nth.call(null, c__15503, i__15507)));
              var G__15519 = i__15507 + 1;
              i__15507 = G__15519;
              continue
            }else {
            }
            break
          }
          return cljs.core.chunk_cons.call(null, cljs.core.chunk.call(null, b__15505), map.call(null, f, cljs.core.chunk_rest.call(null, s__15502)))
        }else {
          return cljs.core.cons.call(null, f.call(null, cljs.core.first.call(null, s__15502)), map.call(null, f, cljs.core.rest.call(null, s__15502)))
        }
      }else {
        return null
      }
    }, null)
  };
  var map__3 = function(f, c1, c2) {
    return new cljs.core.LazySeq(null, false, function() {
      var s1__15508 = cljs.core.seq.call(null, c1);
      var s2__15509 = cljs.core.seq.call(null, c2);
      if(function() {
        var and__3822__auto____15510 = s1__15508;
        if(and__3822__auto____15510) {
          return s2__15509
        }else {
          return and__3822__auto____15510
        }
      }()) {
        return cljs.core.cons.call(null, f.call(null, cljs.core.first.call(null, s1__15508), cljs.core.first.call(null, s2__15509)), map.call(null, f, cljs.core.rest.call(null, s1__15508), cljs.core.rest.call(null, s2__15509)))
      }else {
        return null
      }
    }, null)
  };
  var map__4 = function(f, c1, c2, c3) {
    return new cljs.core.LazySeq(null, false, function() {
      var s1__15511 = cljs.core.seq.call(null, c1);
      var s2__15512 = cljs.core.seq.call(null, c2);
      var s3__15513 = cljs.core.seq.call(null, c3);
      if(function() {
        var and__3822__auto____15514 = s1__15511;
        if(and__3822__auto____15514) {
          var and__3822__auto____15515 = s2__15512;
          if(and__3822__auto____15515) {
            return s3__15513
          }else {
            return and__3822__auto____15515
          }
        }else {
          return and__3822__auto____15514
        }
      }()) {
        return cljs.core.cons.call(null, f.call(null, cljs.core.first.call(null, s1__15511), cljs.core.first.call(null, s2__15512), cljs.core.first.call(null, s3__15513)), map.call(null, f, cljs.core.rest.call(null, s1__15511), cljs.core.rest.call(null, s2__15512), cljs.core.rest.call(null, s3__15513)))
      }else {
        return null
      }
    }, null)
  };
  var map__5 = function() {
    var G__15520__delegate = function(f, c1, c2, c3, colls) {
      var step__15518 = function step(cs) {
        return new cljs.core.LazySeq(null, false, function() {
          var ss__15517 = map.call(null, cljs.core.seq, cs);
          if(cljs.core.every_QMARK_.call(null, cljs.core.identity, ss__15517)) {
            return cljs.core.cons.call(null, map.call(null, cljs.core.first, ss__15517), step.call(null, map.call(null, cljs.core.rest, ss__15517)))
          }else {
            return null
          }
        }, null)
      };
      return map.call(null, function(p1__15322_SHARP_) {
        return cljs.core.apply.call(null, f, p1__15322_SHARP_)
      }, step__15518.call(null, cljs.core.conj.call(null, colls, c3, c2, c1)))
    };
    var G__15520 = function(f, c1, c2, c3, var_args) {
      var colls = null;
      if(goog.isDef(var_args)) {
        colls = cljs.core.array_seq(Array.prototype.slice.call(arguments, 4), 0)
      }
      return G__15520__delegate.call(this, f, c1, c2, c3, colls)
    };
    G__15520.cljs$lang$maxFixedArity = 4;
    G__15520.cljs$lang$applyTo = function(arglist__15521) {
      var f = cljs.core.first(arglist__15521);
      var c1 = cljs.core.first(cljs.core.next(arglist__15521));
      var c2 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__15521)));
      var c3 = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__15521))));
      var colls = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(arglist__15521))));
      return G__15520__delegate(f, c1, c2, c3, colls)
    };
    G__15520.cljs$lang$arity$variadic = G__15520__delegate;
    return G__15520
  }();
  map = function(f, c1, c2, c3, var_args) {
    var colls = var_args;
    switch(arguments.length) {
      case 2:
        return map__2.call(this, f, c1);
      case 3:
        return map__3.call(this, f, c1, c2);
      case 4:
        return map__4.call(this, f, c1, c2, c3);
      default:
        return map__5.cljs$lang$arity$variadic(f, c1, c2, c3, cljs.core.array_seq(arguments, 4))
    }
    throw"Invalid arity: " + arguments.length;
  };
  map.cljs$lang$maxFixedArity = 4;
  map.cljs$lang$applyTo = map__5.cljs$lang$applyTo;
  map.cljs$lang$arity$2 = map__2;
  map.cljs$lang$arity$3 = map__3;
  map.cljs$lang$arity$4 = map__4;
  map.cljs$lang$arity$variadic = map__5.cljs$lang$arity$variadic;
  return map
}();
cljs.core.take = function take(n, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    if(n > 0) {
      var temp__3974__auto____15524 = cljs.core.seq.call(null, coll);
      if(temp__3974__auto____15524) {
        var s__15525 = temp__3974__auto____15524;
        return cljs.core.cons.call(null, cljs.core.first.call(null, s__15525), take.call(null, n - 1, cljs.core.rest.call(null, s__15525)))
      }else {
        return null
      }
    }else {
      return null
    }
  }, null)
};
cljs.core.drop = function drop(n, coll) {
  var step__15531 = function(n, coll) {
    while(true) {
      var s__15529 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(function() {
        var and__3822__auto____15530 = n > 0;
        if(and__3822__auto____15530) {
          return s__15529
        }else {
          return and__3822__auto____15530
        }
      }())) {
        var G__15532 = n - 1;
        var G__15533 = cljs.core.rest.call(null, s__15529);
        n = G__15532;
        coll = G__15533;
        continue
      }else {
        return s__15529
      }
      break
    }
  };
  return new cljs.core.LazySeq(null, false, function() {
    return step__15531.call(null, n, coll)
  }, null)
};
cljs.core.drop_last = function() {
  var drop_last = null;
  var drop_last__1 = function(s) {
    return drop_last.call(null, 1, s)
  };
  var drop_last__2 = function(n, s) {
    return cljs.core.map.call(null, function(x, _) {
      return x
    }, s, cljs.core.drop.call(null, n, s))
  };
  drop_last = function(n, s) {
    switch(arguments.length) {
      case 1:
        return drop_last__1.call(this, n);
      case 2:
        return drop_last__2.call(this, n, s)
    }
    throw"Invalid arity: " + arguments.length;
  };
  drop_last.cljs$lang$arity$1 = drop_last__1;
  drop_last.cljs$lang$arity$2 = drop_last__2;
  return drop_last
}();
cljs.core.take_last = function take_last(n, coll) {
  var s__15536 = cljs.core.seq.call(null, coll);
  var lead__15537 = cljs.core.seq.call(null, cljs.core.drop.call(null, n, coll));
  while(true) {
    if(lead__15537) {
      var G__15538 = cljs.core.next.call(null, s__15536);
      var G__15539 = cljs.core.next.call(null, lead__15537);
      s__15536 = G__15538;
      lead__15537 = G__15539;
      continue
    }else {
      return s__15536
    }
    break
  }
};
cljs.core.drop_while = function drop_while(pred, coll) {
  var step__15545 = function(pred, coll) {
    while(true) {
      var s__15543 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(function() {
        var and__3822__auto____15544 = s__15543;
        if(and__3822__auto____15544) {
          return pred.call(null, cljs.core.first.call(null, s__15543))
        }else {
          return and__3822__auto____15544
        }
      }())) {
        var G__15546 = pred;
        var G__15547 = cljs.core.rest.call(null, s__15543);
        pred = G__15546;
        coll = G__15547;
        continue
      }else {
        return s__15543
      }
      break
    }
  };
  return new cljs.core.LazySeq(null, false, function() {
    return step__15545.call(null, pred, coll)
  }, null)
};
cljs.core.cycle = function cycle(coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__3974__auto____15550 = cljs.core.seq.call(null, coll);
    if(temp__3974__auto____15550) {
      var s__15551 = temp__3974__auto____15550;
      return cljs.core.concat.call(null, s__15551, cycle.call(null, s__15551))
    }else {
      return null
    }
  }, null)
};
cljs.core.split_at = function split_at(n, coll) {
  return cljs.core.PersistentVector.fromArray([cljs.core.take.call(null, n, coll), cljs.core.drop.call(null, n, coll)], true)
};
cljs.core.repeat = function() {
  var repeat = null;
  var repeat__1 = function(x) {
    return new cljs.core.LazySeq(null, false, function() {
      return cljs.core.cons.call(null, x, repeat.call(null, x))
    }, null)
  };
  var repeat__2 = function(n, x) {
    return cljs.core.take.call(null, n, repeat.call(null, x))
  };
  repeat = function(n, x) {
    switch(arguments.length) {
      case 1:
        return repeat__1.call(this, n);
      case 2:
        return repeat__2.call(this, n, x)
    }
    throw"Invalid arity: " + arguments.length;
  };
  repeat.cljs$lang$arity$1 = repeat__1;
  repeat.cljs$lang$arity$2 = repeat__2;
  return repeat
}();
cljs.core.replicate = function replicate(n, x) {
  return cljs.core.take.call(null, n, cljs.core.repeat.call(null, x))
};
cljs.core.repeatedly = function() {
  var repeatedly = null;
  var repeatedly__1 = function(f) {
    return new cljs.core.LazySeq(null, false, function() {
      return cljs.core.cons.call(null, f.call(null), repeatedly.call(null, f))
    }, null)
  };
  var repeatedly__2 = function(n, f) {
    return cljs.core.take.call(null, n, repeatedly.call(null, f))
  };
  repeatedly = function(n, f) {
    switch(arguments.length) {
      case 1:
        return repeatedly__1.call(this, n);
      case 2:
        return repeatedly__2.call(this, n, f)
    }
    throw"Invalid arity: " + arguments.length;
  };
  repeatedly.cljs$lang$arity$1 = repeatedly__1;
  repeatedly.cljs$lang$arity$2 = repeatedly__2;
  return repeatedly
}();
cljs.core.iterate = function iterate(f, x) {
  return cljs.core.cons.call(null, x, new cljs.core.LazySeq(null, false, function() {
    return iterate.call(null, f, f.call(null, x))
  }, null))
};
cljs.core.interleave = function() {
  var interleave = null;
  var interleave__2 = function(c1, c2) {
    return new cljs.core.LazySeq(null, false, function() {
      var s1__15556 = cljs.core.seq.call(null, c1);
      var s2__15557 = cljs.core.seq.call(null, c2);
      if(function() {
        var and__3822__auto____15558 = s1__15556;
        if(and__3822__auto____15558) {
          return s2__15557
        }else {
          return and__3822__auto____15558
        }
      }()) {
        return cljs.core.cons.call(null, cljs.core.first.call(null, s1__15556), cljs.core.cons.call(null, cljs.core.first.call(null, s2__15557), interleave.call(null, cljs.core.rest.call(null, s1__15556), cljs.core.rest.call(null, s2__15557))))
      }else {
        return null
      }
    }, null)
  };
  var interleave__3 = function() {
    var G__15560__delegate = function(c1, c2, colls) {
      return new cljs.core.LazySeq(null, false, function() {
        var ss__15559 = cljs.core.map.call(null, cljs.core.seq, cljs.core.conj.call(null, colls, c2, c1));
        if(cljs.core.every_QMARK_.call(null, cljs.core.identity, ss__15559)) {
          return cljs.core.concat.call(null, cljs.core.map.call(null, cljs.core.first, ss__15559), cljs.core.apply.call(null, interleave, cljs.core.map.call(null, cljs.core.rest, ss__15559)))
        }else {
          return null
        }
      }, null)
    };
    var G__15560 = function(c1, c2, var_args) {
      var colls = null;
      if(goog.isDef(var_args)) {
        colls = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__15560__delegate.call(this, c1, c2, colls)
    };
    G__15560.cljs$lang$maxFixedArity = 2;
    G__15560.cljs$lang$applyTo = function(arglist__15561) {
      var c1 = cljs.core.first(arglist__15561);
      var c2 = cljs.core.first(cljs.core.next(arglist__15561));
      var colls = cljs.core.rest(cljs.core.next(arglist__15561));
      return G__15560__delegate(c1, c2, colls)
    };
    G__15560.cljs$lang$arity$variadic = G__15560__delegate;
    return G__15560
  }();
  interleave = function(c1, c2, var_args) {
    var colls = var_args;
    switch(arguments.length) {
      case 2:
        return interleave__2.call(this, c1, c2);
      default:
        return interleave__3.cljs$lang$arity$variadic(c1, c2, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  interleave.cljs$lang$maxFixedArity = 2;
  interleave.cljs$lang$applyTo = interleave__3.cljs$lang$applyTo;
  interleave.cljs$lang$arity$2 = interleave__2;
  interleave.cljs$lang$arity$variadic = interleave__3.cljs$lang$arity$variadic;
  return interleave
}();
cljs.core.interpose = function interpose(sep, coll) {
  return cljs.core.drop.call(null, 1, cljs.core.interleave.call(null, cljs.core.repeat.call(null, sep), coll))
};
cljs.core.flatten1 = function flatten1(colls) {
  var cat__15571 = function cat(coll, colls) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3971__auto____15569 = cljs.core.seq.call(null, coll);
      if(temp__3971__auto____15569) {
        var coll__15570 = temp__3971__auto____15569;
        return cljs.core.cons.call(null, cljs.core.first.call(null, coll__15570), cat.call(null, cljs.core.rest.call(null, coll__15570), colls))
      }else {
        if(cljs.core.seq.call(null, colls)) {
          return cat.call(null, cljs.core.first.call(null, colls), cljs.core.rest.call(null, colls))
        }else {
          return null
        }
      }
    }, null)
  };
  return cat__15571.call(null, null, colls)
};
cljs.core.mapcat = function() {
  var mapcat = null;
  var mapcat__2 = function(f, coll) {
    return cljs.core.flatten1.call(null, cljs.core.map.call(null, f, coll))
  };
  var mapcat__3 = function() {
    var G__15572__delegate = function(f, coll, colls) {
      return cljs.core.flatten1.call(null, cljs.core.apply.call(null, cljs.core.map, f, coll, colls))
    };
    var G__15572 = function(f, coll, var_args) {
      var colls = null;
      if(goog.isDef(var_args)) {
        colls = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__15572__delegate.call(this, f, coll, colls)
    };
    G__15572.cljs$lang$maxFixedArity = 2;
    G__15572.cljs$lang$applyTo = function(arglist__15573) {
      var f = cljs.core.first(arglist__15573);
      var coll = cljs.core.first(cljs.core.next(arglist__15573));
      var colls = cljs.core.rest(cljs.core.next(arglist__15573));
      return G__15572__delegate(f, coll, colls)
    };
    G__15572.cljs$lang$arity$variadic = G__15572__delegate;
    return G__15572
  }();
  mapcat = function(f, coll, var_args) {
    var colls = var_args;
    switch(arguments.length) {
      case 2:
        return mapcat__2.call(this, f, coll);
      default:
        return mapcat__3.cljs$lang$arity$variadic(f, coll, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  mapcat.cljs$lang$maxFixedArity = 2;
  mapcat.cljs$lang$applyTo = mapcat__3.cljs$lang$applyTo;
  mapcat.cljs$lang$arity$2 = mapcat__2;
  mapcat.cljs$lang$arity$variadic = mapcat__3.cljs$lang$arity$variadic;
  return mapcat
}();
cljs.core.filter = function filter(pred, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__3974__auto____15583 = cljs.core.seq.call(null, coll);
    if(temp__3974__auto____15583) {
      var s__15584 = temp__3974__auto____15583;
      if(cljs.core.chunked_seq_QMARK_.call(null, s__15584)) {
        var c__15585 = cljs.core.chunk_first.call(null, s__15584);
        var size__15586 = cljs.core.count.call(null, c__15585);
        var b__15587 = cljs.core.chunk_buffer.call(null, size__15586);
        var n__2527__auto____15588 = size__15586;
        var i__15589 = 0;
        while(true) {
          if(i__15589 < n__2527__auto____15588) {
            if(cljs.core.truth_(pred.call(null, cljs.core._nth.call(null, c__15585, i__15589)))) {
              cljs.core.chunk_append.call(null, b__15587, cljs.core._nth.call(null, c__15585, i__15589))
            }else {
            }
            var G__15592 = i__15589 + 1;
            i__15589 = G__15592;
            continue
          }else {
          }
          break
        }
        return cljs.core.chunk_cons.call(null, cljs.core.chunk.call(null, b__15587), filter.call(null, pred, cljs.core.chunk_rest.call(null, s__15584)))
      }else {
        var f__15590 = cljs.core.first.call(null, s__15584);
        var r__15591 = cljs.core.rest.call(null, s__15584);
        if(cljs.core.truth_(pred.call(null, f__15590))) {
          return cljs.core.cons.call(null, f__15590, filter.call(null, pred, r__15591))
        }else {
          return filter.call(null, pred, r__15591)
        }
      }
    }else {
      return null
    }
  }, null)
};
cljs.core.remove = function remove(pred, coll) {
  return cljs.core.filter.call(null, cljs.core.complement.call(null, pred), coll)
};
cljs.core.tree_seq = function tree_seq(branch_QMARK_, children, root) {
  var walk__15595 = function walk(node) {
    return new cljs.core.LazySeq(null, false, function() {
      return cljs.core.cons.call(null, node, cljs.core.truth_(branch_QMARK_.call(null, node)) ? cljs.core.mapcat.call(null, walk, children.call(null, node)) : null)
    }, null)
  };
  return walk__15595.call(null, root)
};
cljs.core.flatten = function flatten(x) {
  return cljs.core.filter.call(null, function(p1__15593_SHARP_) {
    return!cljs.core.sequential_QMARK_.call(null, p1__15593_SHARP_)
  }, cljs.core.rest.call(null, cljs.core.tree_seq.call(null, cljs.core.sequential_QMARK_, cljs.core.seq, x)))
};
cljs.core.into = function into(to, from) {
  if(function() {
    var G__15599__15600 = to;
    if(G__15599__15600) {
      if(function() {
        var or__3824__auto____15601 = G__15599__15600.cljs$lang$protocol_mask$partition1$ & 1;
        if(or__3824__auto____15601) {
          return or__3824__auto____15601
        }else {
          return G__15599__15600.cljs$core$IEditableCollection$
        }
      }()) {
        return true
      }else {
        if(!G__15599__15600.cljs$lang$protocol_mask$partition1$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.IEditableCollection, G__15599__15600)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.IEditableCollection, G__15599__15600)
    }
  }()) {
    return cljs.core.persistent_BANG_.call(null, cljs.core.reduce.call(null, cljs.core._conj_BANG_, cljs.core.transient$.call(null, to), from))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, to, from)
  }
};
cljs.core.mapv = function() {
  var mapv = null;
  var mapv__2 = function(f, coll) {
    return cljs.core.persistent_BANG_.call(null, cljs.core.reduce.call(null, function(v, o) {
      return cljs.core.conj_BANG_.call(null, v, f.call(null, o))
    }, cljs.core.transient$.call(null, cljs.core.PersistentVector.EMPTY), coll))
  };
  var mapv__3 = function(f, c1, c2) {
    return cljs.core.into.call(null, cljs.core.PersistentVector.EMPTY, cljs.core.map.call(null, f, c1, c2))
  };
  var mapv__4 = function(f, c1, c2, c3) {
    return cljs.core.into.call(null, cljs.core.PersistentVector.EMPTY, cljs.core.map.call(null, f, c1, c2, c3))
  };
  var mapv__5 = function() {
    var G__15602__delegate = function(f, c1, c2, c3, colls) {
      return cljs.core.into.call(null, cljs.core.PersistentVector.EMPTY, cljs.core.apply.call(null, cljs.core.map, f, c1, c2, c3, colls))
    };
    var G__15602 = function(f, c1, c2, c3, var_args) {
      var colls = null;
      if(goog.isDef(var_args)) {
        colls = cljs.core.array_seq(Array.prototype.slice.call(arguments, 4), 0)
      }
      return G__15602__delegate.call(this, f, c1, c2, c3, colls)
    };
    G__15602.cljs$lang$maxFixedArity = 4;
    G__15602.cljs$lang$applyTo = function(arglist__15603) {
      var f = cljs.core.first(arglist__15603);
      var c1 = cljs.core.first(cljs.core.next(arglist__15603));
      var c2 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__15603)));
      var c3 = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__15603))));
      var colls = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(arglist__15603))));
      return G__15602__delegate(f, c1, c2, c3, colls)
    };
    G__15602.cljs$lang$arity$variadic = G__15602__delegate;
    return G__15602
  }();
  mapv = function(f, c1, c2, c3, var_args) {
    var colls = var_args;
    switch(arguments.length) {
      case 2:
        return mapv__2.call(this, f, c1);
      case 3:
        return mapv__3.call(this, f, c1, c2);
      case 4:
        return mapv__4.call(this, f, c1, c2, c3);
      default:
        return mapv__5.cljs$lang$arity$variadic(f, c1, c2, c3, cljs.core.array_seq(arguments, 4))
    }
    throw"Invalid arity: " + arguments.length;
  };
  mapv.cljs$lang$maxFixedArity = 4;
  mapv.cljs$lang$applyTo = mapv__5.cljs$lang$applyTo;
  mapv.cljs$lang$arity$2 = mapv__2;
  mapv.cljs$lang$arity$3 = mapv__3;
  mapv.cljs$lang$arity$4 = mapv__4;
  mapv.cljs$lang$arity$variadic = mapv__5.cljs$lang$arity$variadic;
  return mapv
}();
cljs.core.filterv = function filterv(pred, coll) {
  return cljs.core.persistent_BANG_.call(null, cljs.core.reduce.call(null, function(v, o) {
    if(cljs.core.truth_(pred.call(null, o))) {
      return cljs.core.conj_BANG_.call(null, v, o)
    }else {
      return v
    }
  }, cljs.core.transient$.call(null, cljs.core.PersistentVector.EMPTY), coll))
};
cljs.core.partition = function() {
  var partition = null;
  var partition__2 = function(n, coll) {
    return partition.call(null, n, n, coll)
  };
  var partition__3 = function(n, step, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3974__auto____15610 = cljs.core.seq.call(null, coll);
      if(temp__3974__auto____15610) {
        var s__15611 = temp__3974__auto____15610;
        var p__15612 = cljs.core.take.call(null, n, s__15611);
        if(n === cljs.core.count.call(null, p__15612)) {
          return cljs.core.cons.call(null, p__15612, partition.call(null, n, step, cljs.core.drop.call(null, step, s__15611)))
        }else {
          return null
        }
      }else {
        return null
      }
    }, null)
  };
  var partition__4 = function(n, step, pad, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3974__auto____15613 = cljs.core.seq.call(null, coll);
      if(temp__3974__auto____15613) {
        var s__15614 = temp__3974__auto____15613;
        var p__15615 = cljs.core.take.call(null, n, s__15614);
        if(n === cljs.core.count.call(null, p__15615)) {
          return cljs.core.cons.call(null, p__15615, partition.call(null, n, step, pad, cljs.core.drop.call(null, step, s__15614)))
        }else {
          return cljs.core.list.call(null, cljs.core.take.call(null, n, cljs.core.concat.call(null, p__15615, pad)))
        }
      }else {
        return null
      }
    }, null)
  };
  partition = function(n, step, pad, coll) {
    switch(arguments.length) {
      case 2:
        return partition__2.call(this, n, step);
      case 3:
        return partition__3.call(this, n, step, pad);
      case 4:
        return partition__4.call(this, n, step, pad, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  partition.cljs$lang$arity$2 = partition__2;
  partition.cljs$lang$arity$3 = partition__3;
  partition.cljs$lang$arity$4 = partition__4;
  return partition
}();
cljs.core.get_in = function() {
  var get_in = null;
  var get_in__2 = function(m, ks) {
    return cljs.core.reduce.call(null, cljs.core.get, m, ks)
  };
  var get_in__3 = function(m, ks, not_found) {
    var sentinel__15620 = cljs.core.lookup_sentinel;
    var m__15621 = m;
    var ks__15622 = cljs.core.seq.call(null, ks);
    while(true) {
      if(ks__15622) {
        var m__15623 = cljs.core._lookup.call(null, m__15621, cljs.core.first.call(null, ks__15622), sentinel__15620);
        if(sentinel__15620 === m__15623) {
          return not_found
        }else {
          var G__15624 = sentinel__15620;
          var G__15625 = m__15623;
          var G__15626 = cljs.core.next.call(null, ks__15622);
          sentinel__15620 = G__15624;
          m__15621 = G__15625;
          ks__15622 = G__15626;
          continue
        }
      }else {
        return m__15621
      }
      break
    }
  };
  get_in = function(m, ks, not_found) {
    switch(arguments.length) {
      case 2:
        return get_in__2.call(this, m, ks);
      case 3:
        return get_in__3.call(this, m, ks, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  get_in.cljs$lang$arity$2 = get_in__2;
  get_in.cljs$lang$arity$3 = get_in__3;
  return get_in
}();
cljs.core.assoc_in = function assoc_in(m, p__15627, v) {
  var vec__15632__15633 = p__15627;
  var k__15634 = cljs.core.nth.call(null, vec__15632__15633, 0, null);
  var ks__15635 = cljs.core.nthnext.call(null, vec__15632__15633, 1);
  if(cljs.core.truth_(ks__15635)) {
    return cljs.core.assoc.call(null, m, k__15634, assoc_in.call(null, cljs.core._lookup.call(null, m, k__15634, null), ks__15635, v))
  }else {
    return cljs.core.assoc.call(null, m, k__15634, v)
  }
};
cljs.core.update_in = function() {
  var update_in__delegate = function(m, p__15636, f, args) {
    var vec__15641__15642 = p__15636;
    var k__15643 = cljs.core.nth.call(null, vec__15641__15642, 0, null);
    var ks__15644 = cljs.core.nthnext.call(null, vec__15641__15642, 1);
    if(cljs.core.truth_(ks__15644)) {
      return cljs.core.assoc.call(null, m, k__15643, cljs.core.apply.call(null, update_in, cljs.core._lookup.call(null, m, k__15643, null), ks__15644, f, args))
    }else {
      return cljs.core.assoc.call(null, m, k__15643, cljs.core.apply.call(null, f, cljs.core._lookup.call(null, m, k__15643, null), args))
    }
  };
  var update_in = function(m, p__15636, f, var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
    }
    return update_in__delegate.call(this, m, p__15636, f, args)
  };
  update_in.cljs$lang$maxFixedArity = 3;
  update_in.cljs$lang$applyTo = function(arglist__15645) {
    var m = cljs.core.first(arglist__15645);
    var p__15636 = cljs.core.first(cljs.core.next(arglist__15645));
    var f = cljs.core.first(cljs.core.next(cljs.core.next(arglist__15645)));
    var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__15645)));
    return update_in__delegate(m, p__15636, f, args)
  };
  update_in.cljs$lang$arity$variadic = update_in__delegate;
  return update_in
}();
cljs.core.Vector = function(meta, array, __hash) {
  this.meta = meta;
  this.array = array;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 32400159
};
cljs.core.Vector.cljs$lang$type = true;
cljs.core.Vector.cljs$lang$ctorPrSeq = function(this__2309__auto__) {
  return cljs.core.list.call(null, "cljs.core/Vector")
};
cljs.core.Vector.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__15648 = this;
  var h__2192__auto____15649 = this__15648.__hash;
  if(!(h__2192__auto____15649 == null)) {
    return h__2192__auto____15649
  }else {
    var h__2192__auto____15650 = cljs.core.hash_coll.call(null, coll);
    this__15648.__hash = h__2192__auto____15650;
    return h__2192__auto____15650
  }
};
cljs.core.Vector.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__15651 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, null)
};
cljs.core.Vector.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__15652 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, not_found)
};
cljs.core.Vector.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__15653 = this;
  var new_array__15654 = this__15653.array.slice();
  new_array__15654[k] = v;
  return new cljs.core.Vector(this__15653.meta, new_array__15654, null)
};
cljs.core.Vector.prototype.call = function() {
  var G__15685 = null;
  var G__15685__2 = function(this_sym15655, k) {
    var this__15657 = this;
    var this_sym15655__15658 = this;
    var coll__15659 = this_sym15655__15658;
    return coll__15659.cljs$core$ILookup$_lookup$arity$2(coll__15659, k)
  };
  var G__15685__3 = function(this_sym15656, k, not_found) {
    var this__15657 = this;
    var this_sym15656__15660 = this;
    var coll__15661 = this_sym15656__15660;
    return coll__15661.cljs$core$ILookup$_lookup$arity$3(coll__15661, k, not_found)
  };
  G__15685 = function(this_sym15656, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__15685__2.call(this, this_sym15656, k);
      case 3:
        return G__15685__3.call(this, this_sym15656, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__15685
}();
cljs.core.Vector.prototype.apply = function(this_sym15646, args15647) {
  var this__15662 = this;
  return this_sym15646.call.apply(this_sym15646, [this_sym15646].concat(args15647.slice()))
};
cljs.core.Vector.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__15663 = this;
  var new_array__15664 = this__15663.array.slice();
  new_array__15664.push(o);
  return new cljs.core.Vector(this__15663.meta, new_array__15664, null)
};
cljs.core.Vector.prototype.toString = function() {
  var this__15665 = this;
  var this__15666 = this;
  return cljs.core.pr_str.call(null, this__15666)
};
cljs.core.Vector.prototype.cljs$core$IReduce$_reduce$arity$2 = function(v, f) {
  var this__15667 = this;
  return cljs.core.ci_reduce.call(null, this__15667.array, f)
};
cljs.core.Vector.prototype.cljs$core$IReduce$_reduce$arity$3 = function(v, f, start) {
  var this__15668 = this;
  return cljs.core.ci_reduce.call(null, this__15668.array, f, start)
};
cljs.core.Vector.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__15669 = this;
  if(this__15669.array.length > 0) {
    var vector_seq__15670 = function vector_seq(i) {
      return new cljs.core.LazySeq(null, false, function() {
        if(i < this__15669.array.length) {
          return cljs.core.cons.call(null, this__15669.array[i], vector_seq.call(null, i + 1))
        }else {
          return null
        }
      }, null)
    };
    return vector_seq__15670.call(null, 0)
  }else {
    return null
  }
};
cljs.core.Vector.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__15671 = this;
  return this__15671.array.length
};
cljs.core.Vector.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__15672 = this;
  var count__15673 = this__15672.array.length;
  if(count__15673 > 0) {
    return this__15672.array[count__15673 - 1]
  }else {
    return null
  }
};
cljs.core.Vector.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__15674 = this;
  if(this__15674.array.length > 0) {
    var new_array__15675 = this__15674.array.slice();
    new_array__15675.pop();
    return new cljs.core.Vector(this__15674.meta, new_array__15675, null)
  }else {
    throw new Error("Can't pop empty vector");
  }
};
cljs.core.Vector.prototype.cljs$core$IVector$_assoc_n$arity$3 = function(coll, n, val) {
  var this__15676 = this;
  return coll.cljs$core$IAssociative$_assoc$arity$3(coll, n, val)
};
cljs.core.Vector.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__15677 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.Vector.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__15678 = this;
  return new cljs.core.Vector(meta, this__15678.array, this__15678.__hash)
};
cljs.core.Vector.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__15679 = this;
  return this__15679.meta
};
cljs.core.Vector.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, n) {
  var this__15680 = this;
  if(function() {
    var and__3822__auto____15681 = 0 <= n;
    if(and__3822__auto____15681) {
      return n < this__15680.array.length
    }else {
      return and__3822__auto____15681
    }
  }()) {
    return this__15680.array[n]
  }else {
    return null
  }
};
cljs.core.Vector.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, n, not_found) {
  var this__15682 = this;
  if(function() {
    var and__3822__auto____15683 = 0 <= n;
    if(and__3822__auto____15683) {
      return n < this__15682.array.length
    }else {
      return and__3822__auto____15683
    }
  }()) {
    return this__15682.array[n]
  }else {
    return not_found
  }
};
cljs.core.Vector.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__15684 = this;
  return cljs.core.with_meta.call(null, cljs.core.Vector.EMPTY, this__15684.meta)
};
cljs.core.Vector;
cljs.core.Vector.EMPTY = new cljs.core.Vector(null, [], 0);
cljs.core.Vector.fromArray = function(xs) {
  return new cljs.core.Vector(null, xs, null)
};
cljs.core.VectorNode = function(edit, arr) {
  this.edit = edit;
  this.arr = arr
};
cljs.core.VectorNode.cljs$lang$type = true;
cljs.core.VectorNode.cljs$lang$ctorPrSeq = function(this__2310__auto__) {
  return cljs.core.list.call(null, "cljs.core/VectorNode")
};
cljs.core.VectorNode;
cljs.core.pv_fresh_node = function pv_fresh_node(edit) {
  return new cljs.core.VectorNode(edit, cljs.core.make_array.call(null, 32))
};
cljs.core.pv_aget = function pv_aget(node, idx) {
  return node.arr[idx]
};
cljs.core.pv_aset = function pv_aset(node, idx, val) {
  return node.arr[idx] = val
};
cljs.core.pv_clone_node = function pv_clone_node(node) {
  return new cljs.core.VectorNode(node.edit, node.arr.slice())
};
cljs.core.tail_off = function tail_off(pv) {
  var cnt__15687 = pv.cnt;
  if(cnt__15687 < 32) {
    return 0
  }else {
    return cnt__15687 - 1 >>> 5 << 5
  }
};
cljs.core.new_path = function new_path(edit, level, node) {
  var ll__15693 = level;
  var ret__15694 = node;
  while(true) {
    if(ll__15693 === 0) {
      return ret__15694
    }else {
      var embed__15695 = ret__15694;
      var r__15696 = cljs.core.pv_fresh_node.call(null, edit);
      var ___15697 = cljs.core.pv_aset.call(null, r__15696, 0, embed__15695);
      var G__15698 = ll__15693 - 5;
      var G__15699 = r__15696;
      ll__15693 = G__15698;
      ret__15694 = G__15699;
      continue
    }
    break
  }
};
cljs.core.push_tail = function push_tail(pv, level, parent, tailnode) {
  var ret__15705 = cljs.core.pv_clone_node.call(null, parent);
  var subidx__15706 = pv.cnt - 1 >>> level & 31;
  if(5 === level) {
    cljs.core.pv_aset.call(null, ret__15705, subidx__15706, tailnode);
    return ret__15705
  }else {
    var child__15707 = cljs.core.pv_aget.call(null, parent, subidx__15706);
    if(!(child__15707 == null)) {
      var node_to_insert__15708 = push_tail.call(null, pv, level - 5, child__15707, tailnode);
      cljs.core.pv_aset.call(null, ret__15705, subidx__15706, node_to_insert__15708);
      return ret__15705
    }else {
      var node_to_insert__15709 = cljs.core.new_path.call(null, null, level - 5, tailnode);
      cljs.core.pv_aset.call(null, ret__15705, subidx__15706, node_to_insert__15709);
      return ret__15705
    }
  }
};
cljs.core.array_for = function array_for(pv, i) {
  if(function() {
    var and__3822__auto____15713 = 0 <= i;
    if(and__3822__auto____15713) {
      return i < pv.cnt
    }else {
      return and__3822__auto____15713
    }
  }()) {
    if(i >= cljs.core.tail_off.call(null, pv)) {
      return pv.tail
    }else {
      var node__15714 = pv.root;
      var level__15715 = pv.shift;
      while(true) {
        if(level__15715 > 0) {
          var G__15716 = cljs.core.pv_aget.call(null, node__15714, i >>> level__15715 & 31);
          var G__15717 = level__15715 - 5;
          node__15714 = G__15716;
          level__15715 = G__15717;
          continue
        }else {
          return node__15714.arr
        }
        break
      }
    }
  }else {
    throw new Error([cljs.core.str("No item "), cljs.core.str(i), cljs.core.str(" in vector of length "), cljs.core.str(pv.cnt)].join(""));
  }
};
cljs.core.do_assoc = function do_assoc(pv, level, node, i, val) {
  var ret__15720 = cljs.core.pv_clone_node.call(null, node);
  if(level === 0) {
    cljs.core.pv_aset.call(null, ret__15720, i & 31, val);
    return ret__15720
  }else {
    var subidx__15721 = i >>> level & 31;
    cljs.core.pv_aset.call(null, ret__15720, subidx__15721, do_assoc.call(null, pv, level - 5, cljs.core.pv_aget.call(null, node, subidx__15721), i, val));
    return ret__15720
  }
};
cljs.core.pop_tail = function pop_tail(pv, level, node) {
  var subidx__15727 = pv.cnt - 2 >>> level & 31;
  if(level > 5) {
    var new_child__15728 = pop_tail.call(null, pv, level - 5, cljs.core.pv_aget.call(null, node, subidx__15727));
    if(function() {
      var and__3822__auto____15729 = new_child__15728 == null;
      if(and__3822__auto____15729) {
        return subidx__15727 === 0
      }else {
        return and__3822__auto____15729
      }
    }()) {
      return null
    }else {
      var ret__15730 = cljs.core.pv_clone_node.call(null, node);
      cljs.core.pv_aset.call(null, ret__15730, subidx__15727, new_child__15728);
      return ret__15730
    }
  }else {
    if(subidx__15727 === 0) {
      return null
    }else {
      if("\ufdd0'else") {
        var ret__15731 = cljs.core.pv_clone_node.call(null, node);
        cljs.core.pv_aset.call(null, ret__15731, subidx__15727, null);
        return ret__15731
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentVector = function(meta, cnt, shift, root, tail, __hash) {
  this.meta = meta;
  this.cnt = cnt;
  this.shift = shift;
  this.root = root;
  this.tail = tail;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 1;
  this.cljs$lang$protocol_mask$partition0$ = 167668511
};
cljs.core.PersistentVector.cljs$lang$type = true;
cljs.core.PersistentVector.cljs$lang$ctorPrSeq = function(this__2309__auto__) {
  return cljs.core.list.call(null, "cljs.core/PersistentVector")
};
cljs.core.PersistentVector.prototype.cljs$core$IEditableCollection$_as_transient$arity$1 = function(coll) {
  var this__15734 = this;
  return new cljs.core.TransientVector(this__15734.cnt, this__15734.shift, cljs.core.tv_editable_root.call(null, this__15734.root), cljs.core.tv_editable_tail.call(null, this__15734.tail))
};
cljs.core.PersistentVector.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__15735 = this;
  var h__2192__auto____15736 = this__15735.__hash;
  if(!(h__2192__auto____15736 == null)) {
    return h__2192__auto____15736
  }else {
    var h__2192__auto____15737 = cljs.core.hash_coll.call(null, coll);
    this__15735.__hash = h__2192__auto____15737;
    return h__2192__auto____15737
  }
};
cljs.core.PersistentVector.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__15738 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, null)
};
cljs.core.PersistentVector.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__15739 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, not_found)
};
cljs.core.PersistentVector.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__15740 = this;
  if(function() {
    var and__3822__auto____15741 = 0 <= k;
    if(and__3822__auto____15741) {
      return k < this__15740.cnt
    }else {
      return and__3822__auto____15741
    }
  }()) {
    if(cljs.core.tail_off.call(null, coll) <= k) {
      var new_tail__15742 = this__15740.tail.slice();
      new_tail__15742[k & 31] = v;
      return new cljs.core.PersistentVector(this__15740.meta, this__15740.cnt, this__15740.shift, this__15740.root, new_tail__15742, null)
    }else {
      return new cljs.core.PersistentVector(this__15740.meta, this__15740.cnt, this__15740.shift, cljs.core.do_assoc.call(null, coll, this__15740.shift, this__15740.root, k, v), this__15740.tail, null)
    }
  }else {
    if(k === this__15740.cnt) {
      return coll.cljs$core$ICollection$_conj$arity$2(coll, v)
    }else {
      if("\ufdd0'else") {
        throw new Error([cljs.core.str("Index "), cljs.core.str(k), cljs.core.str(" out of bounds  [0,"), cljs.core.str(this__15740.cnt), cljs.core.str("]")].join(""));
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentVector.prototype.call = function() {
  var G__15790 = null;
  var G__15790__2 = function(this_sym15743, k) {
    var this__15745 = this;
    var this_sym15743__15746 = this;
    var coll__15747 = this_sym15743__15746;
    return coll__15747.cljs$core$ILookup$_lookup$arity$2(coll__15747, k)
  };
  var G__15790__3 = function(this_sym15744, k, not_found) {
    var this__15745 = this;
    var this_sym15744__15748 = this;
    var coll__15749 = this_sym15744__15748;
    return coll__15749.cljs$core$ILookup$_lookup$arity$3(coll__15749, k, not_found)
  };
  G__15790 = function(this_sym15744, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__15790__2.call(this, this_sym15744, k);
      case 3:
        return G__15790__3.call(this, this_sym15744, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__15790
}();
cljs.core.PersistentVector.prototype.apply = function(this_sym15732, args15733) {
  var this__15750 = this;
  return this_sym15732.call.apply(this_sym15732, [this_sym15732].concat(args15733.slice()))
};
cljs.core.PersistentVector.prototype.cljs$core$IKVReduce$_kv_reduce$arity$3 = function(v, f, init) {
  var this__15751 = this;
  var step_init__15752 = [0, init];
  var i__15753 = 0;
  while(true) {
    if(i__15753 < this__15751.cnt) {
      var arr__15754 = cljs.core.array_for.call(null, v, i__15753);
      var len__15755 = arr__15754.length;
      var init__15759 = function() {
        var j__15756 = 0;
        var init__15757 = step_init__15752[1];
        while(true) {
          if(j__15756 < len__15755) {
            var init__15758 = f.call(null, init__15757, j__15756 + i__15753, arr__15754[j__15756]);
            if(cljs.core.reduced_QMARK_.call(null, init__15758)) {
              return init__15758
            }else {
              var G__15791 = j__15756 + 1;
              var G__15792 = init__15758;
              j__15756 = G__15791;
              init__15757 = G__15792;
              continue
            }
          }else {
            step_init__15752[0] = len__15755;
            step_init__15752[1] = init__15757;
            return init__15757
          }
          break
        }
      }();
      if(cljs.core.reduced_QMARK_.call(null, init__15759)) {
        return cljs.core.deref.call(null, init__15759)
      }else {
        var G__15793 = i__15753 + step_init__15752[0];
        i__15753 = G__15793;
        continue
      }
    }else {
      return step_init__15752[1]
    }
    break
  }
};
cljs.core.PersistentVector.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__15760 = this;
  if(this__15760.cnt - cljs.core.tail_off.call(null, coll) < 32) {
    var new_tail__15761 = this__15760.tail.slice();
    new_tail__15761.push(o);
    return new cljs.core.PersistentVector(this__15760.meta, this__15760.cnt + 1, this__15760.shift, this__15760.root, new_tail__15761, null)
  }else {
    var root_overflow_QMARK___15762 = this__15760.cnt >>> 5 > 1 << this__15760.shift;
    var new_shift__15763 = root_overflow_QMARK___15762 ? this__15760.shift + 5 : this__15760.shift;
    var new_root__15765 = root_overflow_QMARK___15762 ? function() {
      var n_r__15764 = cljs.core.pv_fresh_node.call(null, null);
      cljs.core.pv_aset.call(null, n_r__15764, 0, this__15760.root);
      cljs.core.pv_aset.call(null, n_r__15764, 1, cljs.core.new_path.call(null, null, this__15760.shift, new cljs.core.VectorNode(null, this__15760.tail)));
      return n_r__15764
    }() : cljs.core.push_tail.call(null, coll, this__15760.shift, this__15760.root, new cljs.core.VectorNode(null, this__15760.tail));
    return new cljs.core.PersistentVector(this__15760.meta, this__15760.cnt + 1, new_shift__15763, new_root__15765, [o], null)
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IReversible$_rseq$arity$1 = function(coll) {
  var this__15766 = this;
  if(this__15766.cnt > 0) {
    return new cljs.core.RSeq(coll, this__15766.cnt - 1, null)
  }else {
    return cljs.core.List.EMPTY
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IMapEntry$_key$arity$1 = function(coll) {
  var this__15767 = this;
  return coll.cljs$core$IIndexed$_nth$arity$2(coll, 0)
};
cljs.core.PersistentVector.prototype.cljs$core$IMapEntry$_val$arity$1 = function(coll) {
  var this__15768 = this;
  return coll.cljs$core$IIndexed$_nth$arity$2(coll, 1)
};
cljs.core.PersistentVector.prototype.toString = function() {
  var this__15769 = this;
  var this__15770 = this;
  return cljs.core.pr_str.call(null, this__15770)
};
cljs.core.PersistentVector.prototype.cljs$core$IReduce$_reduce$arity$2 = function(v, f) {
  var this__15771 = this;
  return cljs.core.ci_reduce.call(null, v, f)
};
cljs.core.PersistentVector.prototype.cljs$core$IReduce$_reduce$arity$3 = function(v, f, start) {
  var this__15772 = this;
  return cljs.core.ci_reduce.call(null, v, f, start)
};
cljs.core.PersistentVector.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__15773 = this;
  if(this__15773.cnt === 0) {
    return null
  }else {
    return cljs.core.chunked_seq.call(null, coll, 0, 0)
  }
};
cljs.core.PersistentVector.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__15774 = this;
  return this__15774.cnt
};
cljs.core.PersistentVector.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__15775 = this;
  if(this__15775.cnt > 0) {
    return coll.cljs$core$IIndexed$_nth$arity$2(coll, this__15775.cnt - 1)
  }else {
    return null
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__15776 = this;
  if(this__15776.cnt === 0) {
    throw new Error("Can't pop empty vector");
  }else {
    if(1 === this__15776.cnt) {
      return cljs.core._with_meta.call(null, cljs.core.PersistentVector.EMPTY, this__15776.meta)
    }else {
      if(1 < this__15776.cnt - cljs.core.tail_off.call(null, coll)) {
        return new cljs.core.PersistentVector(this__15776.meta, this__15776.cnt - 1, this__15776.shift, this__15776.root, this__15776.tail.slice(0, -1), null)
      }else {
        if("\ufdd0'else") {
          var new_tail__15777 = cljs.core.array_for.call(null, coll, this__15776.cnt - 2);
          var nr__15778 = cljs.core.pop_tail.call(null, coll, this__15776.shift, this__15776.root);
          var new_root__15779 = nr__15778 == null ? cljs.core.PersistentVector.EMPTY_NODE : nr__15778;
          var cnt_1__15780 = this__15776.cnt - 1;
          if(function() {
            var and__3822__auto____15781 = 5 < this__15776.shift;
            if(and__3822__auto____15781) {
              return cljs.core.pv_aget.call(null, new_root__15779, 1) == null
            }else {
              return and__3822__auto____15781
            }
          }()) {
            return new cljs.core.PersistentVector(this__15776.meta, cnt_1__15780, this__15776.shift - 5, cljs.core.pv_aget.call(null, new_root__15779, 0), new_tail__15777, null)
          }else {
            return new cljs.core.PersistentVector(this__15776.meta, cnt_1__15780, this__15776.shift, new_root__15779, new_tail__15777, null)
          }
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IVector$_assoc_n$arity$3 = function(coll, n, val) {
  var this__15782 = this;
  return coll.cljs$core$IAssociative$_assoc$arity$3(coll, n, val)
};
cljs.core.PersistentVector.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__15783 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.PersistentVector.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__15784 = this;
  return new cljs.core.PersistentVector(meta, this__15784.cnt, this__15784.shift, this__15784.root, this__15784.tail, this__15784.__hash)
};
cljs.core.PersistentVector.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__15785 = this;
  return this__15785.meta
};
cljs.core.PersistentVector.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, n) {
  var this__15786 = this;
  return cljs.core.array_for.call(null, coll, n)[n & 31]
};
cljs.core.PersistentVector.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, n, not_found) {
  var this__15787 = this;
  if(function() {
    var and__3822__auto____15788 = 0 <= n;
    if(and__3822__auto____15788) {
      return n < this__15787.cnt
    }else {
      return and__3822__auto____15788
    }
  }()) {
    return coll.cljs$core$IIndexed$_nth$arity$2(coll, n)
  }else {
    return not_found
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__15789 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentVector.EMPTY, this__15789.meta)
};
cljs.core.PersistentVector;
cljs.core.PersistentVector.EMPTY_NODE = cljs.core.pv_fresh_node.call(null, null);
cljs.core.PersistentVector.EMPTY = new cljs.core.PersistentVector(null, 0, 5, cljs.core.PersistentVector.EMPTY_NODE, [], 0);
cljs.core.PersistentVector.fromArray = function(xs, no_clone) {
  var l__15794 = xs.length;
  var xs__15795 = no_clone === true ? xs : xs.slice();
  if(l__15794 < 32) {
    return new cljs.core.PersistentVector(null, l__15794, 5, cljs.core.PersistentVector.EMPTY_NODE, xs__15795, null)
  }else {
    var node__15796 = xs__15795.slice(0, 32);
    var v__15797 = new cljs.core.PersistentVector(null, 32, 5, cljs.core.PersistentVector.EMPTY_NODE, node__15796, null);
    var i__15798 = 32;
    var out__15799 = cljs.core._as_transient.call(null, v__15797);
    while(true) {
      if(i__15798 < l__15794) {
        var G__15800 = i__15798 + 1;
        var G__15801 = cljs.core.conj_BANG_.call(null, out__15799, xs__15795[i__15798]);
        i__15798 = G__15800;
        out__15799 = G__15801;
        continue
      }else {
        return cljs.core.persistent_BANG_.call(null, out__15799)
      }
      break
    }
  }
};
cljs.core.vec = function vec(coll) {
  return cljs.core._persistent_BANG_.call(null, cljs.core.reduce.call(null, cljs.core._conj_BANG_, cljs.core._as_transient.call(null, cljs.core.PersistentVector.EMPTY), coll))
};
cljs.core.vector = function() {
  var vector__delegate = function(args) {
    return cljs.core.vec.call(null, args)
  };
  var vector = function(var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return vector__delegate.call(this, args)
  };
  vector.cljs$lang$maxFixedArity = 0;
  vector.cljs$lang$applyTo = function(arglist__15802) {
    var args = cljs.core.seq(arglist__15802);
    return vector__delegate(args)
  };
  vector.cljs$lang$arity$variadic = vector__delegate;
  return vector
}();
cljs.core.ChunkedSeq = function(vec, node, i, off, meta) {
  this.vec = vec;
  this.node = node;
  this.i = i;
  this.off = off;
  this.meta = meta;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 27525356
};
cljs.core.ChunkedSeq.cljs$lang$type = true;
cljs.core.ChunkedSeq.cljs$lang$ctorPrSeq = function(this__2309__auto__) {
  return cljs.core.list.call(null, "cljs.core/ChunkedSeq")
};
cljs.core.ChunkedSeq.prototype.cljs$core$INext$_next$arity$1 = function(coll) {
  var this__15803 = this;
  if(this__15803.off + 1 < this__15803.node.length) {
    var s__15804 = cljs.core.chunked_seq.call(null, this__15803.vec, this__15803.node, this__15803.i, this__15803.off + 1);
    if(s__15804 == null) {
      return null
    }else {
      return s__15804
    }
  }else {
    return coll.cljs$core$IChunkedNext$_chunked_next$arity$1(coll)
  }
};
cljs.core.ChunkedSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__15805 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.ChunkedSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__15806 = this;
  return coll
};
cljs.core.ChunkedSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__15807 = this;
  return this__15807.node[this__15807.off]
};
cljs.core.ChunkedSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__15808 = this;
  if(this__15808.off + 1 < this__15808.node.length) {
    var s__15809 = cljs.core.chunked_seq.call(null, this__15808.vec, this__15808.node, this__15808.i, this__15808.off + 1);
    if(s__15809 == null) {
      return cljs.core.List.EMPTY
    }else {
      return s__15809
    }
  }else {
    return coll.cljs$core$IChunkedSeq$_chunked_rest$arity$1(coll)
  }
};
cljs.core.ChunkedSeq.prototype.cljs$core$IChunkedNext$ = true;
cljs.core.ChunkedSeq.prototype.cljs$core$IChunkedNext$_chunked_next$arity$1 = function(coll) {
  var this__15810 = this;
  var l__15811 = this__15810.node.length;
  var s__15812 = this__15810.i + l__15811 < cljs.core._count.call(null, this__15810.vec) ? cljs.core.chunked_seq.call(null, this__15810.vec, this__15810.i + l__15811, 0) : null;
  if(s__15812 == null) {
    return null
  }else {
    return s__15812
  }
};
cljs.core.ChunkedSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__15813 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.ChunkedSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, m) {
  var this__15814 = this;
  return cljs.core.chunked_seq.call(null, this__15814.vec, this__15814.node, this__15814.i, this__15814.off, m)
};
cljs.core.ChunkedSeq.prototype.cljs$core$IWithMeta$_meta$arity$1 = function(coll) {
  var this__15815 = this;
  return this__15815.meta
};
cljs.core.ChunkedSeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__15816 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentVector.EMPTY, this__15816.meta)
};
cljs.core.ChunkedSeq.prototype.cljs$core$IChunkedSeq$ = true;
cljs.core.ChunkedSeq.prototype.cljs$core$IChunkedSeq$_chunked_first$arity$1 = function(coll) {
  var this__15817 = this;
  return cljs.core.array_chunk.call(null, this__15817.node, this__15817.off)
};
cljs.core.ChunkedSeq.prototype.cljs$core$IChunkedSeq$_chunked_rest$arity$1 = function(coll) {
  var this__15818 = this;
  var l__15819 = this__15818.node.length;
  var s__15820 = this__15818.i + l__15819 < cljs.core._count.call(null, this__15818.vec) ? cljs.core.chunked_seq.call(null, this__15818.vec, this__15818.i + l__15819, 0) : null;
  if(s__15820 == null) {
    return cljs.core.List.EMPTY
  }else {
    return s__15820
  }
};
cljs.core.ChunkedSeq;
cljs.core.chunked_seq = function() {
  var chunked_seq = null;
  var chunked_seq__3 = function(vec, i, off) {
    return chunked_seq.call(null, vec, cljs.core.array_for.call(null, vec, i), i, off, null)
  };
  var chunked_seq__4 = function(vec, node, i, off) {
    return chunked_seq.call(null, vec, node, i, off, null)
  };
  var chunked_seq__5 = function(vec, node, i, off, meta) {
    return new cljs.core.ChunkedSeq(vec, node, i, off, meta)
  };
  chunked_seq = function(vec, node, i, off, meta) {
    switch(arguments.length) {
      case 3:
        return chunked_seq__3.call(this, vec, node, i);
      case 4:
        return chunked_seq__4.call(this, vec, node, i, off);
      case 5:
        return chunked_seq__5.call(this, vec, node, i, off, meta)
    }
    throw"Invalid arity: " + arguments.length;
  };
  chunked_seq.cljs$lang$arity$3 = chunked_seq__3;
  chunked_seq.cljs$lang$arity$4 = chunked_seq__4;
  chunked_seq.cljs$lang$arity$5 = chunked_seq__5;
  return chunked_seq
}();
cljs.core.Subvec = function(meta, v, start, end, __hash) {
  this.meta = meta;
  this.v = v;
  this.start = start;
  this.end = end;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 32400159
};
cljs.core.Subvec.cljs$lang$type = true;
cljs.core.Subvec.cljs$lang$ctorPrSeq = function(this__2309__auto__) {
  return cljs.core.list.call(null, "cljs.core/Subvec")
};
cljs.core.Subvec.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__15823 = this;
  var h__2192__auto____15824 = this__15823.__hash;
  if(!(h__2192__auto____15824 == null)) {
    return h__2192__auto____15824
  }else {
    var h__2192__auto____15825 = cljs.core.hash_coll.call(null, coll);
    this__15823.__hash = h__2192__auto____15825;
    return h__2192__auto____15825
  }
};
cljs.core.Subvec.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__15826 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, null)
};
cljs.core.Subvec.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__15827 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, not_found)
};
cljs.core.Subvec.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, key, val) {
  var this__15828 = this;
  var v_pos__15829 = this__15828.start + key;
  return new cljs.core.Subvec(this__15828.meta, cljs.core._assoc.call(null, this__15828.v, v_pos__15829, val), this__15828.start, this__15828.end > v_pos__15829 + 1 ? this__15828.end : v_pos__15829 + 1, null)
};
cljs.core.Subvec.prototype.call = function() {
  var G__15855 = null;
  var G__15855__2 = function(this_sym15830, k) {
    var this__15832 = this;
    var this_sym15830__15833 = this;
    var coll__15834 = this_sym15830__15833;
    return coll__15834.cljs$core$ILookup$_lookup$arity$2(coll__15834, k)
  };
  var G__15855__3 = function(this_sym15831, k, not_found) {
    var this__15832 = this;
    var this_sym15831__15835 = this;
    var coll__15836 = this_sym15831__15835;
    return coll__15836.cljs$core$ILookup$_lookup$arity$3(coll__15836, k, not_found)
  };
  G__15855 = function(this_sym15831, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__15855__2.call(this, this_sym15831, k);
      case 3:
        return G__15855__3.call(this, this_sym15831, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__15855
}();
cljs.core.Subvec.prototype.apply = function(this_sym15821, args15822) {
  var this__15837 = this;
  return this_sym15821.call.apply(this_sym15821, [this_sym15821].concat(args15822.slice()))
};
cljs.core.Subvec.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__15838 = this;
  return new cljs.core.Subvec(this__15838.meta, cljs.core._assoc_n.call(null, this__15838.v, this__15838.end, o), this__15838.start, this__15838.end + 1, null)
};
cljs.core.Subvec.prototype.toString = function() {
  var this__15839 = this;
  var this__15840 = this;
  return cljs.core.pr_str.call(null, this__15840)
};
cljs.core.Subvec.prototype.cljs$core$IReduce$_reduce$arity$2 = function(coll, f) {
  var this__15841 = this;
  return cljs.core.ci_reduce.call(null, coll, f)
};
cljs.core.Subvec.prototype.cljs$core$IReduce$_reduce$arity$3 = function(coll, f, start) {
  var this__15842 = this;
  return cljs.core.ci_reduce.call(null, coll, f, start)
};
cljs.core.Subvec.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__15843 = this;
  var subvec_seq__15844 = function subvec_seq(i) {
    if(i === this__15843.end) {
      return null
    }else {
      return cljs.core.cons.call(null, cljs.core._nth.call(null, this__15843.v, i), new cljs.core.LazySeq(null, false, function() {
        return subvec_seq.call(null, i + 1)
      }, null))
    }
  };
  return subvec_seq__15844.call(null, this__15843.start)
};
cljs.core.Subvec.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__15845 = this;
  return this__15845.end - this__15845.start
};
cljs.core.Subvec.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__15846 = this;
  return cljs.core._nth.call(null, this__15846.v, this__15846.end - 1)
};
cljs.core.Subvec.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__15847 = this;
  if(this__15847.start === this__15847.end) {
    throw new Error("Can't pop empty vector");
  }else {
    return new cljs.core.Subvec(this__15847.meta, this__15847.v, this__15847.start, this__15847.end - 1, null)
  }
};
cljs.core.Subvec.prototype.cljs$core$IVector$_assoc_n$arity$3 = function(coll, n, val) {
  var this__15848 = this;
  return coll.cljs$core$IAssociative$_assoc$arity$3(coll, n, val)
};
cljs.core.Subvec.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__15849 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.Subvec.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__15850 = this;
  return new cljs.core.Subvec(meta, this__15850.v, this__15850.start, this__15850.end, this__15850.__hash)
};
cljs.core.Subvec.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__15851 = this;
  return this__15851.meta
};
cljs.core.Subvec.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, n) {
  var this__15852 = this;
  return cljs.core._nth.call(null, this__15852.v, this__15852.start + n)
};
cljs.core.Subvec.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, n, not_found) {
  var this__15853 = this;
  return cljs.core._nth.call(null, this__15853.v, this__15853.start + n, not_found)
};
cljs.core.Subvec.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__15854 = this;
  return cljs.core.with_meta.call(null, cljs.core.Vector.EMPTY, this__15854.meta)
};
cljs.core.Subvec;
cljs.core.subvec = function() {
  var subvec = null;
  var subvec__2 = function(v, start) {
    return subvec.call(null, v, start, cljs.core.count.call(null, v))
  };
  var subvec__3 = function(v, start, end) {
    return new cljs.core.Subvec(null, v, start, end, null)
  };
  subvec = function(v, start, end) {
    switch(arguments.length) {
      case 2:
        return subvec__2.call(this, v, start);
      case 3:
        return subvec__3.call(this, v, start, end)
    }
    throw"Invalid arity: " + arguments.length;
  };
  subvec.cljs$lang$arity$2 = subvec__2;
  subvec.cljs$lang$arity$3 = subvec__3;
  return subvec
}();
cljs.core.tv_ensure_editable = function tv_ensure_editable(edit, node) {
  if(edit === node.edit) {
    return node
  }else {
    return new cljs.core.VectorNode(edit, node.arr.slice())
  }
};
cljs.core.tv_editable_root = function tv_editable_root(node) {
  return new cljs.core.VectorNode({}, node.arr.slice())
};
cljs.core.tv_editable_tail = function tv_editable_tail(tl) {
  var ret__15857 = cljs.core.make_array.call(null, 32);
  cljs.core.array_copy.call(null, tl, 0, ret__15857, 0, tl.length);
  return ret__15857
};
cljs.core.tv_push_tail = function tv_push_tail(tv, level, parent, tail_node) {
  var ret__15861 = cljs.core.tv_ensure_editable.call(null, tv.root.edit, parent);
  var subidx__15862 = tv.cnt - 1 >>> level & 31;
  cljs.core.pv_aset.call(null, ret__15861, subidx__15862, level === 5 ? tail_node : function() {
    var child__15863 = cljs.core.pv_aget.call(null, ret__15861, subidx__15862);
    if(!(child__15863 == null)) {
      return tv_push_tail.call(null, tv, level - 5, child__15863, tail_node)
    }else {
      return cljs.core.new_path.call(null, tv.root.edit, level - 5, tail_node)
    }
  }());
  return ret__15861
};
cljs.core.tv_pop_tail = function tv_pop_tail(tv, level, node) {
  var node__15868 = cljs.core.tv_ensure_editable.call(null, tv.root.edit, node);
  var subidx__15869 = tv.cnt - 2 >>> level & 31;
  if(level > 5) {
    var new_child__15870 = tv_pop_tail.call(null, tv, level - 5, cljs.core.pv_aget.call(null, node__15868, subidx__15869));
    if(function() {
      var and__3822__auto____15871 = new_child__15870 == null;
      if(and__3822__auto____15871) {
        return subidx__15869 === 0
      }else {
        return and__3822__auto____15871
      }
    }()) {
      return null
    }else {
      cljs.core.pv_aset.call(null, node__15868, subidx__15869, new_child__15870);
      return node__15868
    }
  }else {
    if(subidx__15869 === 0) {
      return null
    }else {
      if("\ufdd0'else") {
        cljs.core.pv_aset.call(null, node__15868, subidx__15869, null);
        return node__15868
      }else {
        return null
      }
    }
  }
};
cljs.core.editable_array_for = function editable_array_for(tv, i) {
  if(function() {
    var and__3822__auto____15876 = 0 <= i;
    if(and__3822__auto____15876) {
      return i < tv.cnt
    }else {
      return and__3822__auto____15876
    }
  }()) {
    if(i >= cljs.core.tail_off.call(null, tv)) {
      return tv.tail
    }else {
      var root__15877 = tv.root;
      var node__15878 = root__15877;
      var level__15879 = tv.shift;
      while(true) {
        if(level__15879 > 0) {
          var G__15880 = cljs.core.tv_ensure_editable.call(null, root__15877.edit, cljs.core.pv_aget.call(null, node__15878, i >>> level__15879 & 31));
          var G__15881 = level__15879 - 5;
          node__15878 = G__15880;
          level__15879 = G__15881;
          continue
        }else {
          return node__15878.arr
        }
        break
      }
    }
  }else {
    throw new Error([cljs.core.str("No item "), cljs.core.str(i), cljs.core.str(" in transient vector of length "), cljs.core.str(tv.cnt)].join(""));
  }
};
cljs.core.TransientVector = function(cnt, shift, root, tail) {
  this.cnt = cnt;
  this.shift = shift;
  this.root = root;
  this.tail = tail;
  this.cljs$lang$protocol_mask$partition0$ = 275;
  this.cljs$lang$protocol_mask$partition1$ = 22
};
cljs.core.TransientVector.cljs$lang$type = true;
cljs.core.TransientVector.cljs$lang$ctorPrSeq = function(this__2309__auto__) {
  return cljs.core.list.call(null, "cljs.core/TransientVector")
};
cljs.core.TransientVector.prototype.call = function() {
  var G__15921 = null;
  var G__15921__2 = function(this_sym15884, k) {
    var this__15886 = this;
    var this_sym15884__15887 = this;
    var coll__15888 = this_sym15884__15887;
    return coll__15888.cljs$core$ILookup$_lookup$arity$2(coll__15888, k)
  };
  var G__15921__3 = function(this_sym15885, k, not_found) {
    var this__15886 = this;
    var this_sym15885__15889 = this;
    var coll__15890 = this_sym15885__15889;
    return coll__15890.cljs$core$ILookup$_lookup$arity$3(coll__15890, k, not_found)
  };
  G__15921 = function(this_sym15885, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__15921__2.call(this, this_sym15885, k);
      case 3:
        return G__15921__3.call(this, this_sym15885, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__15921
}();
cljs.core.TransientVector.prototype.apply = function(this_sym15882, args15883) {
  var this__15891 = this;
  return this_sym15882.call.apply(this_sym15882, [this_sym15882].concat(args15883.slice()))
};
cljs.core.TransientVector.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__15892 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, null)
};
cljs.core.TransientVector.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__15893 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, not_found)
};
cljs.core.TransientVector.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, n) {
  var this__15894 = this;
  if(this__15894.root.edit) {
    return cljs.core.array_for.call(null, coll, n)[n & 31]
  }else {
    throw new Error("nth after persistent!");
  }
};
cljs.core.TransientVector.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, n, not_found) {
  var this__15895 = this;
  if(function() {
    var and__3822__auto____15896 = 0 <= n;
    if(and__3822__auto____15896) {
      return n < this__15895.cnt
    }else {
      return and__3822__auto____15896
    }
  }()) {
    return coll.cljs$core$IIndexed$_nth$arity$2(coll, n)
  }else {
    return not_found
  }
};
cljs.core.TransientVector.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__15897 = this;
  if(this__15897.root.edit) {
    return this__15897.cnt
  }else {
    throw new Error("count after persistent!");
  }
};
cljs.core.TransientVector.prototype.cljs$core$ITransientVector$_assoc_n_BANG_$arity$3 = function(tcoll, n, val) {
  var this__15898 = this;
  if(this__15898.root.edit) {
    if(function() {
      var and__3822__auto____15899 = 0 <= n;
      if(and__3822__auto____15899) {
        return n < this__15898.cnt
      }else {
        return and__3822__auto____15899
      }
    }()) {
      if(cljs.core.tail_off.call(null, tcoll) <= n) {
        this__15898.tail[n & 31] = val;
        return tcoll
      }else {
        var new_root__15904 = function go(level, node) {
          var node__15902 = cljs.core.tv_ensure_editable.call(null, this__15898.root.edit, node);
          if(level === 0) {
            cljs.core.pv_aset.call(null, node__15902, n & 31, val);
            return node__15902
          }else {
            var subidx__15903 = n >>> level & 31;
            cljs.core.pv_aset.call(null, node__15902, subidx__15903, go.call(null, level - 5, cljs.core.pv_aget.call(null, node__15902, subidx__15903)));
            return node__15902
          }
        }.call(null, this__15898.shift, this__15898.root);
        this__15898.root = new_root__15904;
        return tcoll
      }
    }else {
      if(n === this__15898.cnt) {
        return tcoll.cljs$core$ITransientCollection$_conj_BANG_$arity$2(tcoll, val)
      }else {
        if("\ufdd0'else") {
          throw new Error([cljs.core.str("Index "), cljs.core.str(n), cljs.core.str(" out of bounds for TransientVector of length"), cljs.core.str(this__15898.cnt)].join(""));
        }else {
          return null
        }
      }
    }
  }else {
    throw new Error("assoc! after persistent!");
  }
};
cljs.core.TransientVector.prototype.cljs$core$ITransientVector$_pop_BANG_$arity$1 = function(tcoll) {
  var this__15905 = this;
  if(this__15905.root.edit) {
    if(this__15905.cnt === 0) {
      throw new Error("Can't pop empty vector");
    }else {
      if(1 === this__15905.cnt) {
        this__15905.cnt = 0;
        return tcoll
      }else {
        if((this__15905.cnt - 1 & 31) > 0) {
          this__15905.cnt = this__15905.cnt - 1;
          return tcoll
        }else {
          if("\ufdd0'else") {
            var new_tail__15906 = cljs.core.editable_array_for.call(null, tcoll, this__15905.cnt - 2);
            var new_root__15908 = function() {
              var nr__15907 = cljs.core.tv_pop_tail.call(null, tcoll, this__15905.shift, this__15905.root);
              if(!(nr__15907 == null)) {
                return nr__15907
              }else {
                return new cljs.core.VectorNode(this__15905.root.edit, cljs.core.make_array.call(null, 32))
              }
            }();
            if(function() {
              var and__3822__auto____15909 = 5 < this__15905.shift;
              if(and__3822__auto____15909) {
                return cljs.core.pv_aget.call(null, new_root__15908, 1) == null
              }else {
                return and__3822__auto____15909
              }
            }()) {
              var new_root__15910 = cljs.core.tv_ensure_editable.call(null, this__15905.root.edit, cljs.core.pv_aget.call(null, new_root__15908, 0));
              this__15905.root = new_root__15910;
              this__15905.shift = this__15905.shift - 5;
              this__15905.cnt = this__15905.cnt - 1;
              this__15905.tail = new_tail__15906;
              return tcoll
            }else {
              this__15905.root = new_root__15908;
              this__15905.cnt = this__15905.cnt - 1;
              this__15905.tail = new_tail__15906;
              return tcoll
            }
          }else {
            return null
          }
        }
      }
    }
  }else {
    throw new Error("pop! after persistent!");
  }
};
cljs.core.TransientVector.prototype.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3 = function(tcoll, key, val) {
  var this__15911 = this;
  return tcoll.cljs$core$ITransientVector$_assoc_n_BANG_$arity$3(tcoll, key, val)
};
cljs.core.TransientVector.prototype.cljs$core$ITransientCollection$_conj_BANG_$arity$2 = function(tcoll, o) {
  var this__15912 = this;
  if(this__15912.root.edit) {
    if(this__15912.cnt - cljs.core.tail_off.call(null, tcoll) < 32) {
      this__15912.tail[this__15912.cnt & 31] = o;
      this__15912.cnt = this__15912.cnt + 1;
      return tcoll
    }else {
      var tail_node__15913 = new cljs.core.VectorNode(this__15912.root.edit, this__15912.tail);
      var new_tail__15914 = cljs.core.make_array.call(null, 32);
      new_tail__15914[0] = o;
      this__15912.tail = new_tail__15914;
      if(this__15912.cnt >>> 5 > 1 << this__15912.shift) {
        var new_root_array__15915 = cljs.core.make_array.call(null, 32);
        var new_shift__15916 = this__15912.shift + 5;
        new_root_array__15915[0] = this__15912.root;
        new_root_array__15915[1] = cljs.core.new_path.call(null, this__15912.root.edit, this__15912.shift, tail_node__15913);
        this__15912.root = new cljs.core.VectorNode(this__15912.root.edit, new_root_array__15915);
        this__15912.shift = new_shift__15916;
        this__15912.cnt = this__15912.cnt + 1;
        return tcoll
      }else {
        var new_root__15917 = cljs.core.tv_push_tail.call(null, tcoll, this__15912.shift, this__15912.root, tail_node__15913);
        this__15912.root = new_root__15917;
        this__15912.cnt = this__15912.cnt + 1;
        return tcoll
      }
    }
  }else {
    throw new Error("conj! after persistent!");
  }
};
cljs.core.TransientVector.prototype.cljs$core$ITransientCollection$_persistent_BANG_$arity$1 = function(tcoll) {
  var this__15918 = this;
  if(this__15918.root.edit) {
    this__15918.root.edit = null;
    var len__15919 = this__15918.cnt - cljs.core.tail_off.call(null, tcoll);
    var trimmed_tail__15920 = cljs.core.make_array.call(null, len__15919);
    cljs.core.array_copy.call(null, this__15918.tail, 0, trimmed_tail__15920, 0, len__15919);
    return new cljs.core.PersistentVector(null, this__15918.cnt, this__15918.shift, this__15918.root, trimmed_tail__15920, null)
  }else {
    throw new Error("persistent! called twice");
  }
};
cljs.core.TransientVector;
cljs.core.PersistentQueueSeq = function(meta, front, rear, __hash) {
  this.meta = meta;
  this.front = front;
  this.rear = rear;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 31850572
};
cljs.core.PersistentQueueSeq.cljs$lang$type = true;
cljs.core.PersistentQueueSeq.cljs$lang$ctorPrSeq = function(this__2309__auto__) {
  return cljs.core.list.call(null, "cljs.core/PersistentQueueSeq")
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__15922 = this;
  var h__2192__auto____15923 = this__15922.__hash;
  if(!(h__2192__auto____15923 == null)) {
    return h__2192__auto____15923
  }else {
    var h__2192__auto____15924 = cljs.core.hash_coll.call(null, coll);
    this__15922.__hash = h__2192__auto____15924;
    return h__2192__auto____15924
  }
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__15925 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.PersistentQueueSeq.prototype.toString = function() {
  var this__15926 = this;
  var this__15927 = this;
  return cljs.core.pr_str.call(null, this__15927)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__15928 = this;
  return coll
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__15929 = this;
  return cljs.core._first.call(null, this__15929.front)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__15930 = this;
  var temp__3971__auto____15931 = cljs.core.next.call(null, this__15930.front);
  if(temp__3971__auto____15931) {
    var f1__15932 = temp__3971__auto____15931;
    return new cljs.core.PersistentQueueSeq(this__15930.meta, f1__15932, this__15930.rear, null)
  }else {
    if(this__15930.rear == null) {
      return coll.cljs$core$IEmptyableCollection$_empty$arity$1(coll)
    }else {
      return new cljs.core.PersistentQueueSeq(this__15930.meta, this__15930.rear, null, null)
    }
  }
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__15933 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__15934 = this;
  return new cljs.core.PersistentQueueSeq(meta, this__15934.front, this__15934.rear, this__15934.__hash)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__15935 = this;
  return this__15935.meta
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__15936 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__15936.meta)
};
cljs.core.PersistentQueueSeq;
cljs.core.PersistentQueue = function(meta, count, front, rear, __hash) {
  this.meta = meta;
  this.count = count;
  this.front = front;
  this.rear = rear;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 31858766
};
cljs.core.PersistentQueue.cljs$lang$type = true;
cljs.core.PersistentQueue.cljs$lang$ctorPrSeq = function(this__2309__auto__) {
  return cljs.core.list.call(null, "cljs.core/PersistentQueue")
};
cljs.core.PersistentQueue.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__15937 = this;
  var h__2192__auto____15938 = this__15937.__hash;
  if(!(h__2192__auto____15938 == null)) {
    return h__2192__auto____15938
  }else {
    var h__2192__auto____15939 = cljs.core.hash_coll.call(null, coll);
    this__15937.__hash = h__2192__auto____15939;
    return h__2192__auto____15939
  }
};
cljs.core.PersistentQueue.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__15940 = this;
  if(cljs.core.truth_(this__15940.front)) {
    return new cljs.core.PersistentQueue(this__15940.meta, this__15940.count + 1, this__15940.front, cljs.core.conj.call(null, function() {
      var or__3824__auto____15941 = this__15940.rear;
      if(cljs.core.truth_(or__3824__auto____15941)) {
        return or__3824__auto____15941
      }else {
        return cljs.core.PersistentVector.EMPTY
      }
    }(), o), null)
  }else {
    return new cljs.core.PersistentQueue(this__15940.meta, this__15940.count + 1, cljs.core.conj.call(null, this__15940.front, o), cljs.core.PersistentVector.EMPTY, null)
  }
};
cljs.core.PersistentQueue.prototype.toString = function() {
  var this__15942 = this;
  var this__15943 = this;
  return cljs.core.pr_str.call(null, this__15943)
};
cljs.core.PersistentQueue.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__15944 = this;
  var rear__15945 = cljs.core.seq.call(null, this__15944.rear);
  if(cljs.core.truth_(function() {
    var or__3824__auto____15946 = this__15944.front;
    if(cljs.core.truth_(or__3824__auto____15946)) {
      return or__3824__auto____15946
    }else {
      return rear__15945
    }
  }())) {
    return new cljs.core.PersistentQueueSeq(null, this__15944.front, cljs.core.seq.call(null, rear__15945), null)
  }else {
    return null
  }
};
cljs.core.PersistentQueue.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__15947 = this;
  return this__15947.count
};
cljs.core.PersistentQueue.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__15948 = this;
  return cljs.core._first.call(null, this__15948.front)
};
cljs.core.PersistentQueue.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__15949 = this;
  if(cljs.core.truth_(this__15949.front)) {
    var temp__3971__auto____15950 = cljs.core.next.call(null, this__15949.front);
    if(temp__3971__auto____15950) {
      var f1__15951 = temp__3971__auto____15950;
      return new cljs.core.PersistentQueue(this__15949.meta, this__15949.count - 1, f1__15951, this__15949.rear, null)
    }else {
      return new cljs.core.PersistentQueue(this__15949.meta, this__15949.count - 1, cljs.core.seq.call(null, this__15949.rear), cljs.core.PersistentVector.EMPTY, null)
    }
  }else {
    return coll
  }
};
cljs.core.PersistentQueue.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__15952 = this;
  return cljs.core.first.call(null, this__15952.front)
};
cljs.core.PersistentQueue.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__15953 = this;
  return cljs.core.rest.call(null, cljs.core.seq.call(null, coll))
};
cljs.core.PersistentQueue.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__15954 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.PersistentQueue.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__15955 = this;
  return new cljs.core.PersistentQueue(meta, this__15955.count, this__15955.front, this__15955.rear, this__15955.__hash)
};
cljs.core.PersistentQueue.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__15956 = this;
  return this__15956.meta
};
cljs.core.PersistentQueue.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__15957 = this;
  return cljs.core.PersistentQueue.EMPTY
};
cljs.core.PersistentQueue;
cljs.core.PersistentQueue.EMPTY = new cljs.core.PersistentQueue(null, 0, null, cljs.core.PersistentVector.EMPTY, 0);
cljs.core.NeverEquiv = function() {
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 2097152
};
cljs.core.NeverEquiv.cljs$lang$type = true;
cljs.core.NeverEquiv.cljs$lang$ctorPrSeq = function(this__2309__auto__) {
  return cljs.core.list.call(null, "cljs.core/NeverEquiv")
};
cljs.core.NeverEquiv.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(o, other) {
  var this__15958 = this;
  return false
};
cljs.core.NeverEquiv;
cljs.core.never_equiv = new cljs.core.NeverEquiv;
cljs.core.equiv_map = function equiv_map(x, y) {
  return cljs.core.boolean$.call(null, cljs.core.map_QMARK_.call(null, y) ? cljs.core.count.call(null, x) === cljs.core.count.call(null, y) ? cljs.core.every_QMARK_.call(null, cljs.core.identity, cljs.core.map.call(null, function(xkv) {
    return cljs.core._EQ_.call(null, cljs.core._lookup.call(null, y, cljs.core.first.call(null, xkv), cljs.core.never_equiv), cljs.core.second.call(null, xkv))
  }, x)) : null : null)
};
cljs.core.scan_array = function scan_array(incr, k, array) {
  var len__15961 = array.length;
  var i__15962 = 0;
  while(true) {
    if(i__15962 < len__15961) {
      if(k === array[i__15962]) {
        return i__15962
      }else {
        var G__15963 = i__15962 + incr;
        i__15962 = G__15963;
        continue
      }
    }else {
      return null
    }
    break
  }
};
cljs.core.obj_map_compare_keys = function obj_map_compare_keys(a, b) {
  var a__15966 = cljs.core.hash.call(null, a);
  var b__15967 = cljs.core.hash.call(null, b);
  if(a__15966 < b__15967) {
    return-1
  }else {
    if(a__15966 > b__15967) {
      return 1
    }else {
      if("\ufdd0'else") {
        return 0
      }else {
        return null
      }
    }
  }
};
cljs.core.obj_map__GT_hash_map = function obj_map__GT_hash_map(m, k, v) {
  var ks__15975 = m.keys;
  var len__15976 = ks__15975.length;
  var so__15977 = m.strobj;
  var out__15978 = cljs.core.with_meta.call(null, cljs.core.PersistentHashMap.EMPTY, cljs.core.meta.call(null, m));
  var i__15979 = 0;
  var out__15980 = cljs.core.transient$.call(null, out__15978);
  while(true) {
    if(i__15979 < len__15976) {
      var k__15981 = ks__15975[i__15979];
      var G__15982 = i__15979 + 1;
      var G__15983 = cljs.core.assoc_BANG_.call(null, out__15980, k__15981, so__15977[k__15981]);
      i__15979 = G__15982;
      out__15980 = G__15983;
      continue
    }else {
      return cljs.core.persistent_BANG_.call(null, cljs.core.assoc_BANG_.call(null, out__15980, k, v))
    }
    break
  }
};
cljs.core.obj_clone = function obj_clone(obj, ks) {
  var new_obj__15989 = {};
  var l__15990 = ks.length;
  var i__15991 = 0;
  while(true) {
    if(i__15991 < l__15990) {
      var k__15992 = ks[i__15991];
      new_obj__15989[k__15992] = obj[k__15992];
      var G__15993 = i__15991 + 1;
      i__15991 = G__15993;
      continue
    }else {
    }
    break
  }
  return new_obj__15989
};
cljs.core.ObjMap = function(meta, keys, strobj, update_count, __hash) {
  this.meta = meta;
  this.keys = keys;
  this.strobj = strobj;
  this.update_count = update_count;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 1;
  this.cljs$lang$protocol_mask$partition0$ = 15075087
};
cljs.core.ObjMap.cljs$lang$type = true;
cljs.core.ObjMap.cljs$lang$ctorPrSeq = function(this__2309__auto__) {
  return cljs.core.list.call(null, "cljs.core/ObjMap")
};
cljs.core.ObjMap.prototype.cljs$core$IEditableCollection$_as_transient$arity$1 = function(coll) {
  var this__15996 = this;
  return cljs.core.transient$.call(null, cljs.core.into.call(null, cljs.core.hash_map.call(null), coll))
};
cljs.core.ObjMap.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__15997 = this;
  var h__2192__auto____15998 = this__15997.__hash;
  if(!(h__2192__auto____15998 == null)) {
    return h__2192__auto____15998
  }else {
    var h__2192__auto____15999 = cljs.core.hash_imap.call(null, coll);
    this__15997.__hash = h__2192__auto____15999;
    return h__2192__auto____15999
  }
};
cljs.core.ObjMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__16000 = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(coll, k, null)
};
cljs.core.ObjMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__16001 = this;
  if(function() {
    var and__3822__auto____16002 = goog.isString(k);
    if(and__3822__auto____16002) {
      return!(cljs.core.scan_array.call(null, 1, k, this__16001.keys) == null)
    }else {
      return and__3822__auto____16002
    }
  }()) {
    return this__16001.strobj[k]
  }else {
    return not_found
  }
};
cljs.core.ObjMap.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__16003 = this;
  if(goog.isString(k)) {
    if(function() {
      var or__3824__auto____16004 = this__16003.update_count > cljs.core.ObjMap.HASHMAP_THRESHOLD;
      if(or__3824__auto____16004) {
        return or__3824__auto____16004
      }else {
        return this__16003.keys.length >= cljs.core.ObjMap.HASHMAP_THRESHOLD
      }
    }()) {
      return cljs.core.obj_map__GT_hash_map.call(null, coll, k, v)
    }else {
      if(!(cljs.core.scan_array.call(null, 1, k, this__16003.keys) == null)) {
        var new_strobj__16005 = cljs.core.obj_clone.call(null, this__16003.strobj, this__16003.keys);
        new_strobj__16005[k] = v;
        return new cljs.core.ObjMap(this__16003.meta, this__16003.keys, new_strobj__16005, this__16003.update_count + 1, null)
      }else {
        var new_strobj__16006 = cljs.core.obj_clone.call(null, this__16003.strobj, this__16003.keys);
        var new_keys__16007 = this__16003.keys.slice();
        new_strobj__16006[k] = v;
        new_keys__16007.push(k);
        return new cljs.core.ObjMap(this__16003.meta, new_keys__16007, new_strobj__16006, this__16003.update_count + 1, null)
      }
    }
  }else {
    return cljs.core.obj_map__GT_hash_map.call(null, coll, k, v)
  }
};
cljs.core.ObjMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = function(coll, k) {
  var this__16008 = this;
  if(function() {
    var and__3822__auto____16009 = goog.isString(k);
    if(and__3822__auto____16009) {
      return!(cljs.core.scan_array.call(null, 1, k, this__16008.keys) == null)
    }else {
      return and__3822__auto____16009
    }
  }()) {
    return true
  }else {
    return false
  }
};
cljs.core.ObjMap.prototype.call = function() {
  var G__16031 = null;
  var G__16031__2 = function(this_sym16010, k) {
    var this__16012 = this;
    var this_sym16010__16013 = this;
    var coll__16014 = this_sym16010__16013;
    return coll__16014.cljs$core$ILookup$_lookup$arity$2(coll__16014, k)
  };
  var G__16031__3 = function(this_sym16011, k, not_found) {
    var this__16012 = this;
    var this_sym16011__16015 = this;
    var coll__16016 = this_sym16011__16015;
    return coll__16016.cljs$core$ILookup$_lookup$arity$3(coll__16016, k, not_found)
  };
  G__16031 = function(this_sym16011, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__16031__2.call(this, this_sym16011, k);
      case 3:
        return G__16031__3.call(this, this_sym16011, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__16031
}();
cljs.core.ObjMap.prototype.apply = function(this_sym15994, args15995) {
  var this__16017 = this;
  return this_sym15994.call.apply(this_sym15994, [this_sym15994].concat(args15995.slice()))
};
cljs.core.ObjMap.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, entry) {
  var this__16018 = this;
  if(cljs.core.vector_QMARK_.call(null, entry)) {
    return coll.cljs$core$IAssociative$_assoc$arity$3(coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.ObjMap.prototype.toString = function() {
  var this__16019 = this;
  var this__16020 = this;
  return cljs.core.pr_str.call(null, this__16020)
};
cljs.core.ObjMap.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__16021 = this;
  if(this__16021.keys.length > 0) {
    return cljs.core.map.call(null, function(p1__15984_SHARP_) {
      return cljs.core.vector.call(null, p1__15984_SHARP_, this__16021.strobj[p1__15984_SHARP_])
    }, this__16021.keys.sort(cljs.core.obj_map_compare_keys))
  }else {
    return null
  }
};
cljs.core.ObjMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__16022 = this;
  return this__16022.keys.length
};
cljs.core.ObjMap.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__16023 = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.ObjMap.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__16024 = this;
  return new cljs.core.ObjMap(meta, this__16024.keys, this__16024.strobj, this__16024.update_count, this__16024.__hash)
};
cljs.core.ObjMap.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__16025 = this;
  return this__16025.meta
};
cljs.core.ObjMap.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__16026 = this;
  return cljs.core.with_meta.call(null, cljs.core.ObjMap.EMPTY, this__16026.meta)
};
cljs.core.ObjMap.prototype.cljs$core$IMap$_dissoc$arity$2 = function(coll, k) {
  var this__16027 = this;
  if(function() {
    var and__3822__auto____16028 = goog.isString(k);
    if(and__3822__auto____16028) {
      return!(cljs.core.scan_array.call(null, 1, k, this__16027.keys) == null)
    }else {
      return and__3822__auto____16028
    }
  }()) {
    var new_keys__16029 = this__16027.keys.slice();
    var new_strobj__16030 = cljs.core.obj_clone.call(null, this__16027.strobj, this__16027.keys);
    new_keys__16029.splice(cljs.core.scan_array.call(null, 1, k, new_keys__16029), 1);
    cljs.core.js_delete.call(null, new_strobj__16030, k);
    return new cljs.core.ObjMap(this__16027.meta, new_keys__16029, new_strobj__16030, this__16027.update_count + 1, null)
  }else {
    return coll
  }
};
cljs.core.ObjMap;
cljs.core.ObjMap.EMPTY = new cljs.core.ObjMap(null, [], {}, 0, 0);
cljs.core.ObjMap.HASHMAP_THRESHOLD = 32;
cljs.core.ObjMap.fromObject = function(ks, obj) {
  return new cljs.core.ObjMap(null, ks, obj, 0, null)
};
cljs.core.HashMap = function(meta, count, hashobj, __hash) {
  this.meta = meta;
  this.count = count;
  this.hashobj = hashobj;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 15075087
};
cljs.core.HashMap.cljs$lang$type = true;
cljs.core.HashMap.cljs$lang$ctorPrSeq = function(this__2309__auto__) {
  return cljs.core.list.call(null, "cljs.core/HashMap")
};
cljs.core.HashMap.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__16035 = this;
  var h__2192__auto____16036 = this__16035.__hash;
  if(!(h__2192__auto____16036 == null)) {
    return h__2192__auto____16036
  }else {
    var h__2192__auto____16037 = cljs.core.hash_imap.call(null, coll);
    this__16035.__hash = h__2192__auto____16037;
    return h__2192__auto____16037
  }
};
cljs.core.HashMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__16038 = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(coll, k, null)
};
cljs.core.HashMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__16039 = this;
  var bucket__16040 = this__16039.hashobj[cljs.core.hash.call(null, k)];
  var i__16041 = cljs.core.truth_(bucket__16040) ? cljs.core.scan_array.call(null, 2, k, bucket__16040) : null;
  if(cljs.core.truth_(i__16041)) {
    return bucket__16040[i__16041 + 1]
  }else {
    return not_found
  }
};
cljs.core.HashMap.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__16042 = this;
  var h__16043 = cljs.core.hash.call(null, k);
  var bucket__16044 = this__16042.hashobj[h__16043];
  if(cljs.core.truth_(bucket__16044)) {
    var new_bucket__16045 = bucket__16044.slice();
    var new_hashobj__16046 = goog.object.clone(this__16042.hashobj);
    new_hashobj__16046[h__16043] = new_bucket__16045;
    var temp__3971__auto____16047 = cljs.core.scan_array.call(null, 2, k, new_bucket__16045);
    if(cljs.core.truth_(temp__3971__auto____16047)) {
      var i__16048 = temp__3971__auto____16047;
      new_bucket__16045[i__16048 + 1] = v;
      return new cljs.core.HashMap(this__16042.meta, this__16042.count, new_hashobj__16046, null)
    }else {
      new_bucket__16045.push(k, v);
      return new cljs.core.HashMap(this__16042.meta, this__16042.count + 1, new_hashobj__16046, null)
    }
  }else {
    var new_hashobj__16049 = goog.object.clone(this__16042.hashobj);
    new_hashobj__16049[h__16043] = [k, v];
    return new cljs.core.HashMap(this__16042.meta, this__16042.count + 1, new_hashobj__16049, null)
  }
};
cljs.core.HashMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = function(coll, k) {
  var this__16050 = this;
  var bucket__16051 = this__16050.hashobj[cljs.core.hash.call(null, k)];
  var i__16052 = cljs.core.truth_(bucket__16051) ? cljs.core.scan_array.call(null, 2, k, bucket__16051) : null;
  if(cljs.core.truth_(i__16052)) {
    return true
  }else {
    return false
  }
};
cljs.core.HashMap.prototype.call = function() {
  var G__16077 = null;
  var G__16077__2 = function(this_sym16053, k) {
    var this__16055 = this;
    var this_sym16053__16056 = this;
    var coll__16057 = this_sym16053__16056;
    return coll__16057.cljs$core$ILookup$_lookup$arity$2(coll__16057, k)
  };
  var G__16077__3 = function(this_sym16054, k, not_found) {
    var this__16055 = this;
    var this_sym16054__16058 = this;
    var coll__16059 = this_sym16054__16058;
    return coll__16059.cljs$core$ILookup$_lookup$arity$3(coll__16059, k, not_found)
  };
  G__16077 = function(this_sym16054, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__16077__2.call(this, this_sym16054, k);
      case 3:
        return G__16077__3.call(this, this_sym16054, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__16077
}();
cljs.core.HashMap.prototype.apply = function(this_sym16033, args16034) {
  var this__16060 = this;
  return this_sym16033.call.apply(this_sym16033, [this_sym16033].concat(args16034.slice()))
};
cljs.core.HashMap.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, entry) {
  var this__16061 = this;
  if(cljs.core.vector_QMARK_.call(null, entry)) {
    return coll.cljs$core$IAssociative$_assoc$arity$3(coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.HashMap.prototype.toString = function() {
  var this__16062 = this;
  var this__16063 = this;
  return cljs.core.pr_str.call(null, this__16063)
};
cljs.core.HashMap.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__16064 = this;
  if(this__16064.count > 0) {
    var hashes__16065 = cljs.core.js_keys.call(null, this__16064.hashobj).sort();
    return cljs.core.mapcat.call(null, function(p1__16032_SHARP_) {
      return cljs.core.map.call(null, cljs.core.vec, cljs.core.partition.call(null, 2, this__16064.hashobj[p1__16032_SHARP_]))
    }, hashes__16065)
  }else {
    return null
  }
};
cljs.core.HashMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__16066 = this;
  return this__16066.count
};
cljs.core.HashMap.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__16067 = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.HashMap.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__16068 = this;
  return new cljs.core.HashMap(meta, this__16068.count, this__16068.hashobj, this__16068.__hash)
};
cljs.core.HashMap.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__16069 = this;
  return this__16069.meta
};
cljs.core.HashMap.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__16070 = this;
  return cljs.core.with_meta.call(null, cljs.core.HashMap.EMPTY, this__16070.meta)
};
cljs.core.HashMap.prototype.cljs$core$IMap$_dissoc$arity$2 = function(coll, k) {
  var this__16071 = this;
  var h__16072 = cljs.core.hash.call(null, k);
  var bucket__16073 = this__16071.hashobj[h__16072];
  var i__16074 = cljs.core.truth_(bucket__16073) ? cljs.core.scan_array.call(null, 2, k, bucket__16073) : null;
  if(cljs.core.not.call(null, i__16074)) {
    return coll
  }else {
    var new_hashobj__16075 = goog.object.clone(this__16071.hashobj);
    if(3 > bucket__16073.length) {
      cljs.core.js_delete.call(null, new_hashobj__16075, h__16072)
    }else {
      var new_bucket__16076 = bucket__16073.slice();
      new_bucket__16076.splice(i__16074, 2);
      new_hashobj__16075[h__16072] = new_bucket__16076
    }
    return new cljs.core.HashMap(this__16071.meta, this__16071.count - 1, new_hashobj__16075, null)
  }
};
cljs.core.HashMap;
cljs.core.HashMap.EMPTY = new cljs.core.HashMap(null, 0, {}, 0);
cljs.core.HashMap.fromArrays = function(ks, vs) {
  var len__16078 = ks.length;
  var i__16079 = 0;
  var out__16080 = cljs.core.HashMap.EMPTY;
  while(true) {
    if(i__16079 < len__16078) {
      var G__16081 = i__16079 + 1;
      var G__16082 = cljs.core.assoc.call(null, out__16080, ks[i__16079], vs[i__16079]);
      i__16079 = G__16081;
      out__16080 = G__16082;
      continue
    }else {
      return out__16080
    }
    break
  }
};
cljs.core.array_map_index_of = function array_map_index_of(m, k) {
  var arr__16086 = m.arr;
  var len__16087 = arr__16086.length;
  var i__16088 = 0;
  while(true) {
    if(len__16087 <= i__16088) {
      return-1
    }else {
      if(cljs.core._EQ_.call(null, arr__16086[i__16088], k)) {
        return i__16088
      }else {
        if("\ufdd0'else") {
          var G__16089 = i__16088 + 2;
          i__16088 = G__16089;
          continue
        }else {
          return null
        }
      }
    }
    break
  }
};
cljs.core.PersistentArrayMap = function(meta, cnt, arr, __hash) {
  this.meta = meta;
  this.cnt = cnt;
  this.arr = arr;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 1;
  this.cljs$lang$protocol_mask$partition0$ = 16123663
};
cljs.core.PersistentArrayMap.cljs$lang$type = true;
cljs.core.PersistentArrayMap.cljs$lang$ctorPrSeq = function(this__2309__auto__) {
  return cljs.core.list.call(null, "cljs.core/PersistentArrayMap")
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IEditableCollection$_as_transient$arity$1 = function(coll) {
  var this__16092 = this;
  return new cljs.core.TransientArrayMap({}, this__16092.arr.length, this__16092.arr.slice())
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__16093 = this;
  var h__2192__auto____16094 = this__16093.__hash;
  if(!(h__2192__auto____16094 == null)) {
    return h__2192__auto____16094
  }else {
    var h__2192__auto____16095 = cljs.core.hash_imap.call(null, coll);
    this__16093.__hash = h__2192__auto____16095;
    return h__2192__auto____16095
  }
};
cljs.core.PersistentArrayMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__16096 = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(coll, k, null)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__16097 = this;
  var idx__16098 = cljs.core.array_map_index_of.call(null, coll, k);
  if(idx__16098 === -1) {
    return not_found
  }else {
    return this__16097.arr[idx__16098 + 1]
  }
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__16099 = this;
  var idx__16100 = cljs.core.array_map_index_of.call(null, coll, k);
  if(idx__16100 === -1) {
    if(this__16099.cnt < cljs.core.PersistentArrayMap.HASHMAP_THRESHOLD) {
      return new cljs.core.PersistentArrayMap(this__16099.meta, this__16099.cnt + 1, function() {
        var G__16101__16102 = this__16099.arr.slice();
        G__16101__16102.push(k);
        G__16101__16102.push(v);
        return G__16101__16102
      }(), null)
    }else {
      return cljs.core.persistent_BANG_.call(null, cljs.core.assoc_BANG_.call(null, cljs.core.transient$.call(null, cljs.core.into.call(null, cljs.core.PersistentHashMap.EMPTY, coll)), k, v))
    }
  }else {
    if(v === this__16099.arr[idx__16100 + 1]) {
      return coll
    }else {
      if("\ufdd0'else") {
        return new cljs.core.PersistentArrayMap(this__16099.meta, this__16099.cnt, function() {
          var G__16103__16104 = this__16099.arr.slice();
          G__16103__16104[idx__16100 + 1] = v;
          return G__16103__16104
        }(), null)
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = function(coll, k) {
  var this__16105 = this;
  return!(cljs.core.array_map_index_of.call(null, coll, k) === -1)
};
cljs.core.PersistentArrayMap.prototype.call = function() {
  var G__16137 = null;
  var G__16137__2 = function(this_sym16106, k) {
    var this__16108 = this;
    var this_sym16106__16109 = this;
    var coll__16110 = this_sym16106__16109;
    return coll__16110.cljs$core$ILookup$_lookup$arity$2(coll__16110, k)
  };
  var G__16137__3 = function(this_sym16107, k, not_found) {
    var this__16108 = this;
    var this_sym16107__16111 = this;
    var coll__16112 = this_sym16107__16111;
    return coll__16112.cljs$core$ILookup$_lookup$arity$3(coll__16112, k, not_found)
  };
  G__16137 = function(this_sym16107, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__16137__2.call(this, this_sym16107, k);
      case 3:
        return G__16137__3.call(this, this_sym16107, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__16137
}();
cljs.core.PersistentArrayMap.prototype.apply = function(this_sym16090, args16091) {
  var this__16113 = this;
  return this_sym16090.call.apply(this_sym16090, [this_sym16090].concat(args16091.slice()))
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IKVReduce$_kv_reduce$arity$3 = function(coll, f, init) {
  var this__16114 = this;
  var len__16115 = this__16114.arr.length;
  var i__16116 = 0;
  var init__16117 = init;
  while(true) {
    if(i__16116 < len__16115) {
      var init__16118 = f.call(null, init__16117, this__16114.arr[i__16116], this__16114.arr[i__16116 + 1]);
      if(cljs.core.reduced_QMARK_.call(null, init__16118)) {
        return cljs.core.deref.call(null, init__16118)
      }else {
        var G__16138 = i__16116 + 2;
        var G__16139 = init__16118;
        i__16116 = G__16138;
        init__16117 = G__16139;
        continue
      }
    }else {
      return null
    }
    break
  }
};
cljs.core.PersistentArrayMap.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, entry) {
  var this__16119 = this;
  if(cljs.core.vector_QMARK_.call(null, entry)) {
    return coll.cljs$core$IAssociative$_assoc$arity$3(coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.PersistentArrayMap.prototype.toString = function() {
  var this__16120 = this;
  var this__16121 = this;
  return cljs.core.pr_str.call(null, this__16121)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__16122 = this;
  if(this__16122.cnt > 0) {
    var len__16123 = this__16122.arr.length;
    var array_map_seq__16124 = function array_map_seq(i) {
      return new cljs.core.LazySeq(null, false, function() {
        if(i < len__16123) {
          return cljs.core.cons.call(null, cljs.core.PersistentVector.fromArray([this__16122.arr[i], this__16122.arr[i + 1]], true), array_map_seq.call(null, i + 2))
        }else {
          return null
        }
      }, null)
    };
    return array_map_seq__16124.call(null, 0)
  }else {
    return null
  }
};
cljs.core.PersistentArrayMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__16125 = this;
  return this__16125.cnt
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__16126 = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__16127 = this;
  return new cljs.core.PersistentArrayMap(meta, this__16127.cnt, this__16127.arr, this__16127.__hash)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__16128 = this;
  return this__16128.meta
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__16129 = this;
  return cljs.core._with_meta.call(null, cljs.core.PersistentArrayMap.EMPTY, this__16129.meta)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IMap$_dissoc$arity$2 = function(coll, k) {
  var this__16130 = this;
  var idx__16131 = cljs.core.array_map_index_of.call(null, coll, k);
  if(idx__16131 >= 0) {
    var len__16132 = this__16130.arr.length;
    var new_len__16133 = len__16132 - 2;
    if(new_len__16133 === 0) {
      return coll.cljs$core$IEmptyableCollection$_empty$arity$1(coll)
    }else {
      var new_arr__16134 = cljs.core.make_array.call(null, new_len__16133);
      var s__16135 = 0;
      var d__16136 = 0;
      while(true) {
        if(s__16135 >= len__16132) {
          return new cljs.core.PersistentArrayMap(this__16130.meta, this__16130.cnt - 1, new_arr__16134, null)
        }else {
          if(cljs.core._EQ_.call(null, k, this__16130.arr[s__16135])) {
            var G__16140 = s__16135 + 2;
            var G__16141 = d__16136;
            s__16135 = G__16140;
            d__16136 = G__16141;
            continue
          }else {
            if("\ufdd0'else") {
              new_arr__16134[d__16136] = this__16130.arr[s__16135];
              new_arr__16134[d__16136 + 1] = this__16130.arr[s__16135 + 1];
              var G__16142 = s__16135 + 2;
              var G__16143 = d__16136 + 2;
              s__16135 = G__16142;
              d__16136 = G__16143;
              continue
            }else {
              return null
            }
          }
        }
        break
      }
    }
  }else {
    return coll
  }
};
cljs.core.PersistentArrayMap;
cljs.core.PersistentArrayMap.EMPTY = new cljs.core.PersistentArrayMap(null, 0, [], null);
cljs.core.PersistentArrayMap.HASHMAP_THRESHOLD = 16;
cljs.core.PersistentArrayMap.fromArrays = function(ks, vs) {
  var len__16144 = cljs.core.count.call(null, ks);
  var i__16145 = 0;
  var out__16146 = cljs.core.transient$.call(null, cljs.core.PersistentArrayMap.EMPTY);
  while(true) {
    if(i__16145 < len__16144) {
      var G__16147 = i__16145 + 1;
      var G__16148 = cljs.core.assoc_BANG_.call(null, out__16146, ks[i__16145], vs[i__16145]);
      i__16145 = G__16147;
      out__16146 = G__16148;
      continue
    }else {
      return cljs.core.persistent_BANG_.call(null, out__16146)
    }
    break
  }
};
cljs.core.TransientArrayMap = function(editable_QMARK_, len, arr) {
  this.editable_QMARK_ = editable_QMARK_;
  this.len = len;
  this.arr = arr;
  this.cljs$lang$protocol_mask$partition1$ = 14;
  this.cljs$lang$protocol_mask$partition0$ = 258
};
cljs.core.TransientArrayMap.cljs$lang$type = true;
cljs.core.TransientArrayMap.cljs$lang$ctorPrSeq = function(this__2309__auto__) {
  return cljs.core.list.call(null, "cljs.core/TransientArrayMap")
};
cljs.core.TransientArrayMap.prototype.cljs$core$ITransientMap$_dissoc_BANG_$arity$2 = function(tcoll, key) {
  var this__16149 = this;
  if(cljs.core.truth_(this__16149.editable_QMARK_)) {
    var idx__16150 = cljs.core.array_map_index_of.call(null, tcoll, key);
    if(idx__16150 >= 0) {
      this__16149.arr[idx__16150] = this__16149.arr[this__16149.len - 2];
      this__16149.arr[idx__16150 + 1] = this__16149.arr[this__16149.len - 1];
      var G__16151__16152 = this__16149.arr;
      G__16151__16152.pop();
      G__16151__16152.pop();
      G__16151__16152;
      this__16149.len = this__16149.len - 2
    }else {
    }
    return tcoll
  }else {
    throw new Error("dissoc! after persistent!");
  }
};
cljs.core.TransientArrayMap.prototype.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3 = function(tcoll, key, val) {
  var this__16153 = this;
  if(cljs.core.truth_(this__16153.editable_QMARK_)) {
    var idx__16154 = cljs.core.array_map_index_of.call(null, tcoll, key);
    if(idx__16154 === -1) {
      if(this__16153.len + 2 <= 2 * cljs.core.PersistentArrayMap.HASHMAP_THRESHOLD) {
        this__16153.len = this__16153.len + 2;
        this__16153.arr.push(key);
        this__16153.arr.push(val);
        return tcoll
      }else {
        return cljs.core.assoc_BANG_.call(null, cljs.core.array__GT_transient_hash_map.call(null, this__16153.len, this__16153.arr), key, val)
      }
    }else {
      if(val === this__16153.arr[idx__16154 + 1]) {
        return tcoll
      }else {
        this__16153.arr[idx__16154 + 1] = val;
        return tcoll
      }
    }
  }else {
    throw new Error("assoc! after persistent!");
  }
};
cljs.core.TransientArrayMap.prototype.cljs$core$ITransientCollection$_conj_BANG_$arity$2 = function(tcoll, o) {
  var this__16155 = this;
  if(cljs.core.truth_(this__16155.editable_QMARK_)) {
    if(function() {
      var G__16156__16157 = o;
      if(G__16156__16157) {
        if(function() {
          var or__3824__auto____16158 = G__16156__16157.cljs$lang$protocol_mask$partition0$ & 2048;
          if(or__3824__auto____16158) {
            return or__3824__auto____16158
          }else {
            return G__16156__16157.cljs$core$IMapEntry$
          }
        }()) {
          return true
        }else {
          if(!G__16156__16157.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.IMapEntry, G__16156__16157)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.IMapEntry, G__16156__16157)
      }
    }()) {
      return tcoll.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3(tcoll, cljs.core.key.call(null, o), cljs.core.val.call(null, o))
    }else {
      var es__16159 = cljs.core.seq.call(null, o);
      var tcoll__16160 = tcoll;
      while(true) {
        var temp__3971__auto____16161 = cljs.core.first.call(null, es__16159);
        if(cljs.core.truth_(temp__3971__auto____16161)) {
          var e__16162 = temp__3971__auto____16161;
          var G__16168 = cljs.core.next.call(null, es__16159);
          var G__16169 = tcoll__16160.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3(tcoll__16160, cljs.core.key.call(null, e__16162), cljs.core.val.call(null, e__16162));
          es__16159 = G__16168;
          tcoll__16160 = G__16169;
          continue
        }else {
          return tcoll__16160
        }
        break
      }
    }
  }else {
    throw new Error("conj! after persistent!");
  }
};
cljs.core.TransientArrayMap.prototype.cljs$core$ITransientCollection$_persistent_BANG_$arity$1 = function(tcoll) {
  var this__16163 = this;
  if(cljs.core.truth_(this__16163.editable_QMARK_)) {
    this__16163.editable_QMARK_ = false;
    return new cljs.core.PersistentArrayMap(null, cljs.core.quot.call(null, this__16163.len, 2), this__16163.arr, null)
  }else {
    throw new Error("persistent! called twice");
  }
};
cljs.core.TransientArrayMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(tcoll, k) {
  var this__16164 = this;
  return tcoll.cljs$core$ILookup$_lookup$arity$3(tcoll, k, null)
};
cljs.core.TransientArrayMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(tcoll, k, not_found) {
  var this__16165 = this;
  if(cljs.core.truth_(this__16165.editable_QMARK_)) {
    var idx__16166 = cljs.core.array_map_index_of.call(null, tcoll, k);
    if(idx__16166 === -1) {
      return not_found
    }else {
      return this__16165.arr[idx__16166 + 1]
    }
  }else {
    throw new Error("lookup after persistent!");
  }
};
cljs.core.TransientArrayMap.prototype.cljs$core$ICounted$_count$arity$1 = function(tcoll) {
  var this__16167 = this;
  if(cljs.core.truth_(this__16167.editable_QMARK_)) {
    return cljs.core.quot.call(null, this__16167.len, 2)
  }else {
    throw new Error("count after persistent!");
  }
};
cljs.core.TransientArrayMap;
cljs.core.array__GT_transient_hash_map = function array__GT_transient_hash_map(len, arr) {
  var out__16172 = cljs.core.transient$.call(null, cljs.core.ObjMap.EMPTY);
  var i__16173 = 0;
  while(true) {
    if(i__16173 < len) {
      var G__16174 = cljs.core.assoc_BANG_.call(null, out__16172, arr[i__16173], arr[i__16173 + 1]);
      var G__16175 = i__16173 + 2;
      out__16172 = G__16174;
      i__16173 = G__16175;
      continue
    }else {
      return out__16172
    }
    break
  }
};
cljs.core.Box = function(val) {
  this.val = val
};
cljs.core.Box.cljs$lang$type = true;
cljs.core.Box.cljs$lang$ctorPrSeq = function(this__2310__auto__) {
  return cljs.core.list.call(null, "cljs.core/Box")
};
cljs.core.Box;
cljs.core.key_test = function key_test(key, other) {
  if(goog.isString(key)) {
    return key === other
  }else {
    return cljs.core._EQ_.call(null, key, other)
  }
};
cljs.core.mask = function mask(hash, shift) {
  return hash >>> shift & 31
};
cljs.core.clone_and_set = function() {
  var clone_and_set = null;
  var clone_and_set__3 = function(arr, i, a) {
    var G__16180__16181 = arr.slice();
    G__16180__16181[i] = a;
    return G__16180__16181
  };
  var clone_and_set__5 = function(arr, i, a, j, b) {
    var G__16182__16183 = arr.slice();
    G__16182__16183[i] = a;
    G__16182__16183[j] = b;
    return G__16182__16183
  };
  clone_and_set = function(arr, i, a, j, b) {
    switch(arguments.length) {
      case 3:
        return clone_and_set__3.call(this, arr, i, a);
      case 5:
        return clone_and_set__5.call(this, arr, i, a, j, b)
    }
    throw"Invalid arity: " + arguments.length;
  };
  clone_and_set.cljs$lang$arity$3 = clone_and_set__3;
  clone_and_set.cljs$lang$arity$5 = clone_and_set__5;
  return clone_and_set
}();
cljs.core.remove_pair = function remove_pair(arr, i) {
  var new_arr__16185 = cljs.core.make_array.call(null, arr.length - 2);
  cljs.core.array_copy.call(null, arr, 0, new_arr__16185, 0, 2 * i);
  cljs.core.array_copy.call(null, arr, 2 * (i + 1), new_arr__16185, 2 * i, new_arr__16185.length - 2 * i);
  return new_arr__16185
};
cljs.core.bitmap_indexed_node_index = function bitmap_indexed_node_index(bitmap, bit) {
  return cljs.core.bit_count.call(null, bitmap & bit - 1)
};
cljs.core.bitpos = function bitpos(hash, shift) {
  return 1 << (hash >>> shift & 31)
};
cljs.core.edit_and_set = function() {
  var edit_and_set = null;
  var edit_and_set__4 = function(inode, edit, i, a) {
    var editable__16188 = inode.ensure_editable(edit);
    editable__16188.arr[i] = a;
    return editable__16188
  };
  var edit_and_set__6 = function(inode, edit, i, a, j, b) {
    var editable__16189 = inode.ensure_editable(edit);
    editable__16189.arr[i] = a;
    editable__16189.arr[j] = b;
    return editable__16189
  };
  edit_and_set = function(inode, edit, i, a, j, b) {
    switch(arguments.length) {
      case 4:
        return edit_and_set__4.call(this, inode, edit, i, a);
      case 6:
        return edit_and_set__6.call(this, inode, edit, i, a, j, b)
    }
    throw"Invalid arity: " + arguments.length;
  };
  edit_and_set.cljs$lang$arity$4 = edit_and_set__4;
  edit_and_set.cljs$lang$arity$6 = edit_and_set__6;
  return edit_and_set
}();
cljs.core.inode_kv_reduce = function inode_kv_reduce(arr, f, init) {
  var len__16196 = arr.length;
  var i__16197 = 0;
  var init__16198 = init;
  while(true) {
    if(i__16197 < len__16196) {
      var init__16201 = function() {
        var k__16199 = arr[i__16197];
        if(!(k__16199 == null)) {
          return f.call(null, init__16198, k__16199, arr[i__16197 + 1])
        }else {
          var node__16200 = arr[i__16197 + 1];
          if(!(node__16200 == null)) {
            return node__16200.kv_reduce(f, init__16198)
          }else {
            return init__16198
          }
        }
      }();
      if(cljs.core.reduced_QMARK_.call(null, init__16201)) {
        return cljs.core.deref.call(null, init__16201)
      }else {
        var G__16202 = i__16197 + 2;
        var G__16203 = init__16201;
        i__16197 = G__16202;
        init__16198 = G__16203;
        continue
      }
    }else {
      return init__16198
    }
    break
  }
};
cljs.core.BitmapIndexedNode = function(edit, bitmap, arr) {
  this.edit = edit;
  this.bitmap = bitmap;
  this.arr = arr
};
cljs.core.BitmapIndexedNode.cljs$lang$type = true;
cljs.core.BitmapIndexedNode.cljs$lang$ctorPrSeq = function(this__2309__auto__) {
  return cljs.core.list.call(null, "cljs.core/BitmapIndexedNode")
};
cljs.core.BitmapIndexedNode.prototype.edit_and_remove_pair = function(e, bit, i) {
  var this__16204 = this;
  var inode__16205 = this;
  if(this__16204.bitmap === bit) {
    return null
  }else {
    var editable__16206 = inode__16205.ensure_editable(e);
    var earr__16207 = editable__16206.arr;
    var len__16208 = earr__16207.length;
    editable__16206.bitmap = bit ^ editable__16206.bitmap;
    cljs.core.array_copy.call(null, earr__16207, 2 * (i + 1), earr__16207, 2 * i, len__16208 - 2 * (i + 1));
    earr__16207[len__16208 - 2] = null;
    earr__16207[len__16208 - 1] = null;
    return editable__16206
  }
};
cljs.core.BitmapIndexedNode.prototype.inode_assoc_BANG_ = function(edit, shift, hash, key, val, added_leaf_QMARK_) {
  var this__16209 = this;
  var inode__16210 = this;
  var bit__16211 = 1 << (hash >>> shift & 31);
  var idx__16212 = cljs.core.bitmap_indexed_node_index.call(null, this__16209.bitmap, bit__16211);
  if((this__16209.bitmap & bit__16211) === 0) {
    var n__16213 = cljs.core.bit_count.call(null, this__16209.bitmap);
    if(2 * n__16213 < this__16209.arr.length) {
      var editable__16214 = inode__16210.ensure_editable(edit);
      var earr__16215 = editable__16214.arr;
      added_leaf_QMARK_.val = true;
      cljs.core.array_copy_downward.call(null, earr__16215, 2 * idx__16212, earr__16215, 2 * (idx__16212 + 1), 2 * (n__16213 - idx__16212));
      earr__16215[2 * idx__16212] = key;
      earr__16215[2 * idx__16212 + 1] = val;
      editable__16214.bitmap = editable__16214.bitmap | bit__16211;
      return editable__16214
    }else {
      if(n__16213 >= 16) {
        var nodes__16216 = cljs.core.make_array.call(null, 32);
        var jdx__16217 = hash >>> shift & 31;
        nodes__16216[jdx__16217] = cljs.core.BitmapIndexedNode.EMPTY.inode_assoc_BANG_(edit, shift + 5, hash, key, val, added_leaf_QMARK_);
        var i__16218 = 0;
        var j__16219 = 0;
        while(true) {
          if(i__16218 < 32) {
            if((this__16209.bitmap >>> i__16218 & 1) === 0) {
              var G__16272 = i__16218 + 1;
              var G__16273 = j__16219;
              i__16218 = G__16272;
              j__16219 = G__16273;
              continue
            }else {
              nodes__16216[i__16218] = !(this__16209.arr[j__16219] == null) ? cljs.core.BitmapIndexedNode.EMPTY.inode_assoc_BANG_(edit, shift + 5, cljs.core.hash.call(null, this__16209.arr[j__16219]), this__16209.arr[j__16219], this__16209.arr[j__16219 + 1], added_leaf_QMARK_) : this__16209.arr[j__16219 + 1];
              var G__16274 = i__16218 + 1;
              var G__16275 = j__16219 + 2;
              i__16218 = G__16274;
              j__16219 = G__16275;
              continue
            }
          }else {
          }
          break
        }
        return new cljs.core.ArrayNode(edit, n__16213 + 1, nodes__16216)
      }else {
        if("\ufdd0'else") {
          var new_arr__16220 = cljs.core.make_array.call(null, 2 * (n__16213 + 4));
          cljs.core.array_copy.call(null, this__16209.arr, 0, new_arr__16220, 0, 2 * idx__16212);
          new_arr__16220[2 * idx__16212] = key;
          new_arr__16220[2 * idx__16212 + 1] = val;
          cljs.core.array_copy.call(null, this__16209.arr, 2 * idx__16212, new_arr__16220, 2 * (idx__16212 + 1), 2 * (n__16213 - idx__16212));
          added_leaf_QMARK_.val = true;
          var editable__16221 = inode__16210.ensure_editable(edit);
          editable__16221.arr = new_arr__16220;
          editable__16221.bitmap = editable__16221.bitmap | bit__16211;
          return editable__16221
        }else {
          return null
        }
      }
    }
  }else {
    var key_or_nil__16222 = this__16209.arr[2 * idx__16212];
    var val_or_node__16223 = this__16209.arr[2 * idx__16212 + 1];
    if(key_or_nil__16222 == null) {
      var n__16224 = val_or_node__16223.inode_assoc_BANG_(edit, shift + 5, hash, key, val, added_leaf_QMARK_);
      if(n__16224 === val_or_node__16223) {
        return inode__16210
      }else {
        return cljs.core.edit_and_set.call(null, inode__16210, edit, 2 * idx__16212 + 1, n__16224)
      }
    }else {
      if(cljs.core.key_test.call(null, key, key_or_nil__16222)) {
        if(val === val_or_node__16223) {
          return inode__16210
        }else {
          return cljs.core.edit_and_set.call(null, inode__16210, edit, 2 * idx__16212 + 1, val)
        }
      }else {
        if("\ufdd0'else") {
          added_leaf_QMARK_.val = true;
          return cljs.core.edit_and_set.call(null, inode__16210, edit, 2 * idx__16212, null, 2 * idx__16212 + 1, cljs.core.create_node.call(null, edit, shift + 5, key_or_nil__16222, val_or_node__16223, hash, key, val))
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.BitmapIndexedNode.prototype.inode_seq = function() {
  var this__16225 = this;
  var inode__16226 = this;
  return cljs.core.create_inode_seq.call(null, this__16225.arr)
};
cljs.core.BitmapIndexedNode.prototype.inode_without_BANG_ = function(edit, shift, hash, key, removed_leaf_QMARK_) {
  var this__16227 = this;
  var inode__16228 = this;
  var bit__16229 = 1 << (hash >>> shift & 31);
  if((this__16227.bitmap & bit__16229) === 0) {
    return inode__16228
  }else {
    var idx__16230 = cljs.core.bitmap_indexed_node_index.call(null, this__16227.bitmap, bit__16229);
    var key_or_nil__16231 = this__16227.arr[2 * idx__16230];
    var val_or_node__16232 = this__16227.arr[2 * idx__16230 + 1];
    if(key_or_nil__16231 == null) {
      var n__16233 = val_or_node__16232.inode_without_BANG_(edit, shift + 5, hash, key, removed_leaf_QMARK_);
      if(n__16233 === val_or_node__16232) {
        return inode__16228
      }else {
        if(!(n__16233 == null)) {
          return cljs.core.edit_and_set.call(null, inode__16228, edit, 2 * idx__16230 + 1, n__16233)
        }else {
          if(this__16227.bitmap === bit__16229) {
            return null
          }else {
            if("\ufdd0'else") {
              return inode__16228.edit_and_remove_pair(edit, bit__16229, idx__16230)
            }else {
              return null
            }
          }
        }
      }
    }else {
      if(cljs.core.key_test.call(null, key, key_or_nil__16231)) {
        removed_leaf_QMARK_[0] = true;
        return inode__16228.edit_and_remove_pair(edit, bit__16229, idx__16230)
      }else {
        if("\ufdd0'else") {
          return inode__16228
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.BitmapIndexedNode.prototype.ensure_editable = function(e) {
  var this__16234 = this;
  var inode__16235 = this;
  if(e === this__16234.edit) {
    return inode__16235
  }else {
    var n__16236 = cljs.core.bit_count.call(null, this__16234.bitmap);
    var new_arr__16237 = cljs.core.make_array.call(null, n__16236 < 0 ? 4 : 2 * (n__16236 + 1));
    cljs.core.array_copy.call(null, this__16234.arr, 0, new_arr__16237, 0, 2 * n__16236);
    return new cljs.core.BitmapIndexedNode(e, this__16234.bitmap, new_arr__16237)
  }
};
cljs.core.BitmapIndexedNode.prototype.kv_reduce = function(f, init) {
  var this__16238 = this;
  var inode__16239 = this;
  return cljs.core.inode_kv_reduce.call(null, this__16238.arr, f, init)
};
cljs.core.BitmapIndexedNode.prototype.inode_find = function(shift, hash, key, not_found) {
  var this__16240 = this;
  var inode__16241 = this;
  var bit__16242 = 1 << (hash >>> shift & 31);
  if((this__16240.bitmap & bit__16242) === 0) {
    return not_found
  }else {
    var idx__16243 = cljs.core.bitmap_indexed_node_index.call(null, this__16240.bitmap, bit__16242);
    var key_or_nil__16244 = this__16240.arr[2 * idx__16243];
    var val_or_node__16245 = this__16240.arr[2 * idx__16243 + 1];
    if(key_or_nil__16244 == null) {
      return val_or_node__16245.inode_find(shift + 5, hash, key, not_found)
    }else {
      if(cljs.core.key_test.call(null, key, key_or_nil__16244)) {
        return cljs.core.PersistentVector.fromArray([key_or_nil__16244, val_or_node__16245], true)
      }else {
        if("\ufdd0'else") {
          return not_found
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.BitmapIndexedNode.prototype.inode_without = function(shift, hash, key) {
  var this__16246 = this;
  var inode__16247 = this;
  var bit__16248 = 1 << (hash >>> shift & 31);
  if((this__16246.bitmap & bit__16248) === 0) {
    return inode__16247
  }else {
    var idx__16249 = cljs.core.bitmap_indexed_node_index.call(null, this__16246.bitmap, bit__16248);
    var key_or_nil__16250 = this__16246.arr[2 * idx__16249];
    var val_or_node__16251 = this__16246.arr[2 * idx__16249 + 1];
    if(key_or_nil__16250 == null) {
      var n__16252 = val_or_node__16251.inode_without(shift + 5, hash, key);
      if(n__16252 === val_or_node__16251) {
        return inode__16247
      }else {
        if(!(n__16252 == null)) {
          return new cljs.core.BitmapIndexedNode(null, this__16246.bitmap, cljs.core.clone_and_set.call(null, this__16246.arr, 2 * idx__16249 + 1, n__16252))
        }else {
          if(this__16246.bitmap === bit__16248) {
            return null
          }else {
            if("\ufdd0'else") {
              return new cljs.core.BitmapIndexedNode(null, this__16246.bitmap ^ bit__16248, cljs.core.remove_pair.call(null, this__16246.arr, idx__16249))
            }else {
              return null
            }
          }
        }
      }
    }else {
      if(cljs.core.key_test.call(null, key, key_or_nil__16250)) {
        return new cljs.core.BitmapIndexedNode(null, this__16246.bitmap ^ bit__16248, cljs.core.remove_pair.call(null, this__16246.arr, idx__16249))
      }else {
        if("\ufdd0'else") {
          return inode__16247
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.BitmapIndexedNode.prototype.inode_assoc = function(shift, hash, key, val, added_leaf_QMARK_) {
  var this__16253 = this;
  var inode__16254 = this;
  var bit__16255 = 1 << (hash >>> shift & 31);
  var idx__16256 = cljs.core.bitmap_indexed_node_index.call(null, this__16253.bitmap, bit__16255);
  if((this__16253.bitmap & bit__16255) === 0) {
    var n__16257 = cljs.core.bit_count.call(null, this__16253.bitmap);
    if(n__16257 >= 16) {
      var nodes__16258 = cljs.core.make_array.call(null, 32);
      var jdx__16259 = hash >>> shift & 31;
      nodes__16258[jdx__16259] = cljs.core.BitmapIndexedNode.EMPTY.inode_assoc(shift + 5, hash, key, val, added_leaf_QMARK_);
      var i__16260 = 0;
      var j__16261 = 0;
      while(true) {
        if(i__16260 < 32) {
          if((this__16253.bitmap >>> i__16260 & 1) === 0) {
            var G__16276 = i__16260 + 1;
            var G__16277 = j__16261;
            i__16260 = G__16276;
            j__16261 = G__16277;
            continue
          }else {
            nodes__16258[i__16260] = !(this__16253.arr[j__16261] == null) ? cljs.core.BitmapIndexedNode.EMPTY.inode_assoc(shift + 5, cljs.core.hash.call(null, this__16253.arr[j__16261]), this__16253.arr[j__16261], this__16253.arr[j__16261 + 1], added_leaf_QMARK_) : this__16253.arr[j__16261 + 1];
            var G__16278 = i__16260 + 1;
            var G__16279 = j__16261 + 2;
            i__16260 = G__16278;
            j__16261 = G__16279;
            continue
          }
        }else {
        }
        break
      }
      return new cljs.core.ArrayNode(null, n__16257 + 1, nodes__16258)
    }else {
      var new_arr__16262 = cljs.core.make_array.call(null, 2 * (n__16257 + 1));
      cljs.core.array_copy.call(null, this__16253.arr, 0, new_arr__16262, 0, 2 * idx__16256);
      new_arr__16262[2 * idx__16256] = key;
      new_arr__16262[2 * idx__16256 + 1] = val;
      cljs.core.array_copy.call(null, this__16253.arr, 2 * idx__16256, new_arr__16262, 2 * (idx__16256 + 1), 2 * (n__16257 - idx__16256));
      added_leaf_QMARK_.val = true;
      return new cljs.core.BitmapIndexedNode(null, this__16253.bitmap | bit__16255, new_arr__16262)
    }
  }else {
    var key_or_nil__16263 = this__16253.arr[2 * idx__16256];
    var val_or_node__16264 = this__16253.arr[2 * idx__16256 + 1];
    if(key_or_nil__16263 == null) {
      var n__16265 = val_or_node__16264.inode_assoc(shift + 5, hash, key, val, added_leaf_QMARK_);
      if(n__16265 === val_or_node__16264) {
        return inode__16254
      }else {
        return new cljs.core.BitmapIndexedNode(null, this__16253.bitmap, cljs.core.clone_and_set.call(null, this__16253.arr, 2 * idx__16256 + 1, n__16265))
      }
    }else {
      if(cljs.core.key_test.call(null, key, key_or_nil__16263)) {
        if(val === val_or_node__16264) {
          return inode__16254
        }else {
          return new cljs.core.BitmapIndexedNode(null, this__16253.bitmap, cljs.core.clone_and_set.call(null, this__16253.arr, 2 * idx__16256 + 1, val))
        }
      }else {
        if("\ufdd0'else") {
          added_leaf_QMARK_.val = true;
          return new cljs.core.BitmapIndexedNode(null, this__16253.bitmap, cljs.core.clone_and_set.call(null, this__16253.arr, 2 * idx__16256, null, 2 * idx__16256 + 1, cljs.core.create_node.call(null, shift + 5, key_or_nil__16263, val_or_node__16264, hash, key, val)))
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.BitmapIndexedNode.prototype.inode_lookup = function(shift, hash, key, not_found) {
  var this__16266 = this;
  var inode__16267 = this;
  var bit__16268 = 1 << (hash >>> shift & 31);
  if((this__16266.bitmap & bit__16268) === 0) {
    return not_found
  }else {
    var idx__16269 = cljs.core.bitmap_indexed_node_index.call(null, this__16266.bitmap, bit__16268);
    var key_or_nil__16270 = this__16266.arr[2 * idx__16269];
    var val_or_node__16271 = this__16266.arr[2 * idx__16269 + 1];
    if(key_or_nil__16270 == null) {
      return val_or_node__16271.inode_lookup(shift + 5, hash, key, not_found)
    }else {
      if(cljs.core.key_test.call(null, key, key_or_nil__16270)) {
        return val_or_node__16271
      }else {
        if("\ufdd0'else") {
          return not_found
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.BitmapIndexedNode;
cljs.core.BitmapIndexedNode.EMPTY = new cljs.core.BitmapIndexedNode(null, 0, cljs.core.make_array.call(null, 0));
cljs.core.pack_array_node = function pack_array_node(array_node, edit, idx) {
  var arr__16287 = array_node.arr;
  var len__16288 = 2 * (array_node.cnt - 1);
  var new_arr__16289 = cljs.core.make_array.call(null, len__16288);
  var i__16290 = 0;
  var j__16291 = 1;
  var bitmap__16292 = 0;
  while(true) {
    if(i__16290 < len__16288) {
      if(function() {
        var and__3822__auto____16293 = !(i__16290 === idx);
        if(and__3822__auto____16293) {
          return!(arr__16287[i__16290] == null)
        }else {
          return and__3822__auto____16293
        }
      }()) {
        new_arr__16289[j__16291] = arr__16287[i__16290];
        var G__16294 = i__16290 + 1;
        var G__16295 = j__16291 + 2;
        var G__16296 = bitmap__16292 | 1 << i__16290;
        i__16290 = G__16294;
        j__16291 = G__16295;
        bitmap__16292 = G__16296;
        continue
      }else {
        var G__16297 = i__16290 + 1;
        var G__16298 = j__16291;
        var G__16299 = bitmap__16292;
        i__16290 = G__16297;
        j__16291 = G__16298;
        bitmap__16292 = G__16299;
        continue
      }
    }else {
      return new cljs.core.BitmapIndexedNode(edit, bitmap__16292, new_arr__16289)
    }
    break
  }
};
cljs.core.ArrayNode = function(edit, cnt, arr) {
  this.edit = edit;
  this.cnt = cnt;
  this.arr = arr
};
cljs.core.ArrayNode.cljs$lang$type = true;
cljs.core.ArrayNode.cljs$lang$ctorPrSeq = function(this__2309__auto__) {
  return cljs.core.list.call(null, "cljs.core/ArrayNode")
};
cljs.core.ArrayNode.prototype.inode_assoc_BANG_ = function(edit, shift, hash, key, val, added_leaf_QMARK_) {
  var this__16300 = this;
  var inode__16301 = this;
  var idx__16302 = hash >>> shift & 31;
  var node__16303 = this__16300.arr[idx__16302];
  if(node__16303 == null) {
    var editable__16304 = cljs.core.edit_and_set.call(null, inode__16301, edit, idx__16302, cljs.core.BitmapIndexedNode.EMPTY.inode_assoc_BANG_(edit, shift + 5, hash, key, val, added_leaf_QMARK_));
    editable__16304.cnt = editable__16304.cnt + 1;
    return editable__16304
  }else {
    var n__16305 = node__16303.inode_assoc_BANG_(edit, shift + 5, hash, key, val, added_leaf_QMARK_);
    if(n__16305 === node__16303) {
      return inode__16301
    }else {
      return cljs.core.edit_and_set.call(null, inode__16301, edit, idx__16302, n__16305)
    }
  }
};
cljs.core.ArrayNode.prototype.inode_seq = function() {
  var this__16306 = this;
  var inode__16307 = this;
  return cljs.core.create_array_node_seq.call(null, this__16306.arr)
};
cljs.core.ArrayNode.prototype.inode_without_BANG_ = function(edit, shift, hash, key, removed_leaf_QMARK_) {
  var this__16308 = this;
  var inode__16309 = this;
  var idx__16310 = hash >>> shift & 31;
  var node__16311 = this__16308.arr[idx__16310];
  if(node__16311 == null) {
    return inode__16309
  }else {
    var n__16312 = node__16311.inode_without_BANG_(edit, shift + 5, hash, key, removed_leaf_QMARK_);
    if(n__16312 === node__16311) {
      return inode__16309
    }else {
      if(n__16312 == null) {
        if(this__16308.cnt <= 8) {
          return cljs.core.pack_array_node.call(null, inode__16309, edit, idx__16310)
        }else {
          var editable__16313 = cljs.core.edit_and_set.call(null, inode__16309, edit, idx__16310, n__16312);
          editable__16313.cnt = editable__16313.cnt - 1;
          return editable__16313
        }
      }else {
        if("\ufdd0'else") {
          return cljs.core.edit_and_set.call(null, inode__16309, edit, idx__16310, n__16312)
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.ArrayNode.prototype.ensure_editable = function(e) {
  var this__16314 = this;
  var inode__16315 = this;
  if(e === this__16314.edit) {
    return inode__16315
  }else {
    return new cljs.core.ArrayNode(e, this__16314.cnt, this__16314.arr.slice())
  }
};
cljs.core.ArrayNode.prototype.kv_reduce = function(f, init) {
  var this__16316 = this;
  var inode__16317 = this;
  var len__16318 = this__16316.arr.length;
  var i__16319 = 0;
  var init__16320 = init;
  while(true) {
    if(i__16319 < len__16318) {
      var node__16321 = this__16316.arr[i__16319];
      if(!(node__16321 == null)) {
        var init__16322 = node__16321.kv_reduce(f, init__16320);
        if(cljs.core.reduced_QMARK_.call(null, init__16322)) {
          return cljs.core.deref.call(null, init__16322)
        }else {
          var G__16341 = i__16319 + 1;
          var G__16342 = init__16322;
          i__16319 = G__16341;
          init__16320 = G__16342;
          continue
        }
      }else {
        return null
      }
    }else {
      return init__16320
    }
    break
  }
};
cljs.core.ArrayNode.prototype.inode_find = function(shift, hash, key, not_found) {
  var this__16323 = this;
  var inode__16324 = this;
  var idx__16325 = hash >>> shift & 31;
  var node__16326 = this__16323.arr[idx__16325];
  if(!(node__16326 == null)) {
    return node__16326.inode_find(shift + 5, hash, key, not_found)
  }else {
    return not_found
  }
};
cljs.core.ArrayNode.prototype.inode_without = function(shift, hash, key) {
  var this__16327 = this;
  var inode__16328 = this;
  var idx__16329 = hash >>> shift & 31;
  var node__16330 = this__16327.arr[idx__16329];
  if(!(node__16330 == null)) {
    var n__16331 = node__16330.inode_without(shift + 5, hash, key);
    if(n__16331 === node__16330) {
      return inode__16328
    }else {
      if(n__16331 == null) {
        if(this__16327.cnt <= 8) {
          return cljs.core.pack_array_node.call(null, inode__16328, null, idx__16329)
        }else {
          return new cljs.core.ArrayNode(null, this__16327.cnt - 1, cljs.core.clone_and_set.call(null, this__16327.arr, idx__16329, n__16331))
        }
      }else {
        if("\ufdd0'else") {
          return new cljs.core.ArrayNode(null, this__16327.cnt, cljs.core.clone_and_set.call(null, this__16327.arr, idx__16329, n__16331))
        }else {
          return null
        }
      }
    }
  }else {
    return inode__16328
  }
};
cljs.core.ArrayNode.prototype.inode_assoc = function(shift, hash, key, val, added_leaf_QMARK_) {
  var this__16332 = this;
  var inode__16333 = this;
  var idx__16334 = hash >>> shift & 31;
  var node__16335 = this__16332.arr[idx__16334];
  if(node__16335 == null) {
    return new cljs.core.ArrayNode(null, this__16332.cnt + 1, cljs.core.clone_and_set.call(null, this__16332.arr, idx__16334, cljs.core.BitmapIndexedNode.EMPTY.inode_assoc(shift + 5, hash, key, val, added_leaf_QMARK_)))
  }else {
    var n__16336 = node__16335.inode_assoc(shift + 5, hash, key, val, added_leaf_QMARK_);
    if(n__16336 === node__16335) {
      return inode__16333
    }else {
      return new cljs.core.ArrayNode(null, this__16332.cnt, cljs.core.clone_and_set.call(null, this__16332.arr, idx__16334, n__16336))
    }
  }
};
cljs.core.ArrayNode.prototype.inode_lookup = function(shift, hash, key, not_found) {
  var this__16337 = this;
  var inode__16338 = this;
  var idx__16339 = hash >>> shift & 31;
  var node__16340 = this__16337.arr[idx__16339];
  if(!(node__16340 == null)) {
    return node__16340.inode_lookup(shift + 5, hash, key, not_found)
  }else {
    return not_found
  }
};
cljs.core.ArrayNode;
cljs.core.hash_collision_node_find_index = function hash_collision_node_find_index(arr, cnt, key) {
  var lim__16345 = 2 * cnt;
  var i__16346 = 0;
  while(true) {
    if(i__16346 < lim__16345) {
      if(cljs.core.key_test.call(null, key, arr[i__16346])) {
        return i__16346
      }else {
        var G__16347 = i__16346 + 2;
        i__16346 = G__16347;
        continue
      }
    }else {
      return-1
    }
    break
  }
};
cljs.core.HashCollisionNode = function(edit, collision_hash, cnt, arr) {
  this.edit = edit;
  this.collision_hash = collision_hash;
  this.cnt = cnt;
  this.arr = arr
};
cljs.core.HashCollisionNode.cljs$lang$type = true;
cljs.core.HashCollisionNode.cljs$lang$ctorPrSeq = function(this__2309__auto__) {
  return cljs.core.list.call(null, "cljs.core/HashCollisionNode")
};
cljs.core.HashCollisionNode.prototype.inode_assoc_BANG_ = function(edit, shift, hash, key, val, added_leaf_QMARK_) {
  var this__16348 = this;
  var inode__16349 = this;
  if(hash === this__16348.collision_hash) {
    var idx__16350 = cljs.core.hash_collision_node_find_index.call(null, this__16348.arr, this__16348.cnt, key);
    if(idx__16350 === -1) {
      if(this__16348.arr.length > 2 * this__16348.cnt) {
        var editable__16351 = cljs.core.edit_and_set.call(null, inode__16349, edit, 2 * this__16348.cnt, key, 2 * this__16348.cnt + 1, val);
        added_leaf_QMARK_.val = true;
        editable__16351.cnt = editable__16351.cnt + 1;
        return editable__16351
      }else {
        var len__16352 = this__16348.arr.length;
        var new_arr__16353 = cljs.core.make_array.call(null, len__16352 + 2);
        cljs.core.array_copy.call(null, this__16348.arr, 0, new_arr__16353, 0, len__16352);
        new_arr__16353[len__16352] = key;
        new_arr__16353[len__16352 + 1] = val;
        added_leaf_QMARK_.val = true;
        return inode__16349.ensure_editable_array(edit, this__16348.cnt + 1, new_arr__16353)
      }
    }else {
      if(this__16348.arr[idx__16350 + 1] === val) {
        return inode__16349
      }else {
        return cljs.core.edit_and_set.call(null, inode__16349, edit, idx__16350 + 1, val)
      }
    }
  }else {
    return(new cljs.core.BitmapIndexedNode(edit, 1 << (this__16348.collision_hash >>> shift & 31), [null, inode__16349, null, null])).inode_assoc_BANG_(edit, shift, hash, key, val, added_leaf_QMARK_)
  }
};
cljs.core.HashCollisionNode.prototype.inode_seq = function() {
  var this__16354 = this;
  var inode__16355 = this;
  return cljs.core.create_inode_seq.call(null, this__16354.arr)
};
cljs.core.HashCollisionNode.prototype.inode_without_BANG_ = function(edit, shift, hash, key, removed_leaf_QMARK_) {
  var this__16356 = this;
  var inode__16357 = this;
  var idx__16358 = cljs.core.hash_collision_node_find_index.call(null, this__16356.arr, this__16356.cnt, key);
  if(idx__16358 === -1) {
    return inode__16357
  }else {
    removed_leaf_QMARK_[0] = true;
    if(this__16356.cnt === 1) {
      return null
    }else {
      var editable__16359 = inode__16357.ensure_editable(edit);
      var earr__16360 = editable__16359.arr;
      earr__16360[idx__16358] = earr__16360[2 * this__16356.cnt - 2];
      earr__16360[idx__16358 + 1] = earr__16360[2 * this__16356.cnt - 1];
      earr__16360[2 * this__16356.cnt - 1] = null;
      earr__16360[2 * this__16356.cnt - 2] = null;
      editable__16359.cnt = editable__16359.cnt - 1;
      return editable__16359
    }
  }
};
cljs.core.HashCollisionNode.prototype.ensure_editable = function(e) {
  var this__16361 = this;
  var inode__16362 = this;
  if(e === this__16361.edit) {
    return inode__16362
  }else {
    var new_arr__16363 = cljs.core.make_array.call(null, 2 * (this__16361.cnt + 1));
    cljs.core.array_copy.call(null, this__16361.arr, 0, new_arr__16363, 0, 2 * this__16361.cnt);
    return new cljs.core.HashCollisionNode(e, this__16361.collision_hash, this__16361.cnt, new_arr__16363)
  }
};
cljs.core.HashCollisionNode.prototype.kv_reduce = function(f, init) {
  var this__16364 = this;
  var inode__16365 = this;
  return cljs.core.inode_kv_reduce.call(null, this__16364.arr, f, init)
};
cljs.core.HashCollisionNode.prototype.inode_find = function(shift, hash, key, not_found) {
  var this__16366 = this;
  var inode__16367 = this;
  var idx__16368 = cljs.core.hash_collision_node_find_index.call(null, this__16366.arr, this__16366.cnt, key);
  if(idx__16368 < 0) {
    return not_found
  }else {
    if(cljs.core.key_test.call(null, key, this__16366.arr[idx__16368])) {
      return cljs.core.PersistentVector.fromArray([this__16366.arr[idx__16368], this__16366.arr[idx__16368 + 1]], true)
    }else {
      if("\ufdd0'else") {
        return not_found
      }else {
        return null
      }
    }
  }
};
cljs.core.HashCollisionNode.prototype.inode_without = function(shift, hash, key) {
  var this__16369 = this;
  var inode__16370 = this;
  var idx__16371 = cljs.core.hash_collision_node_find_index.call(null, this__16369.arr, this__16369.cnt, key);
  if(idx__16371 === -1) {
    return inode__16370
  }else {
    if(this__16369.cnt === 1) {
      return null
    }else {
      if("\ufdd0'else") {
        return new cljs.core.HashCollisionNode(null, this__16369.collision_hash, this__16369.cnt - 1, cljs.core.remove_pair.call(null, this__16369.arr, cljs.core.quot.call(null, idx__16371, 2)))
      }else {
        return null
      }
    }
  }
};
cljs.core.HashCollisionNode.prototype.inode_assoc = function(shift, hash, key, val, added_leaf_QMARK_) {
  var this__16372 = this;
  var inode__16373 = this;
  if(hash === this__16372.collision_hash) {
    var idx__16374 = cljs.core.hash_collision_node_find_index.call(null, this__16372.arr, this__16372.cnt, key);
    if(idx__16374 === -1) {
      var len__16375 = this__16372.arr.length;
      var new_arr__16376 = cljs.core.make_array.call(null, len__16375 + 2);
      cljs.core.array_copy.call(null, this__16372.arr, 0, new_arr__16376, 0, len__16375);
      new_arr__16376[len__16375] = key;
      new_arr__16376[len__16375 + 1] = val;
      added_leaf_QMARK_.val = true;
      return new cljs.core.HashCollisionNode(null, this__16372.collision_hash, this__16372.cnt + 1, new_arr__16376)
    }else {
      if(cljs.core._EQ_.call(null, this__16372.arr[idx__16374], val)) {
        return inode__16373
      }else {
        return new cljs.core.HashCollisionNode(null, this__16372.collision_hash, this__16372.cnt, cljs.core.clone_and_set.call(null, this__16372.arr, idx__16374 + 1, val))
      }
    }
  }else {
    return(new cljs.core.BitmapIndexedNode(null, 1 << (this__16372.collision_hash >>> shift & 31), [null, inode__16373])).inode_assoc(shift, hash, key, val, added_leaf_QMARK_)
  }
};
cljs.core.HashCollisionNode.prototype.inode_lookup = function(shift, hash, key, not_found) {
  var this__16377 = this;
  var inode__16378 = this;
  var idx__16379 = cljs.core.hash_collision_node_find_index.call(null, this__16377.arr, this__16377.cnt, key);
  if(idx__16379 < 0) {
    return not_found
  }else {
    if(cljs.core.key_test.call(null, key, this__16377.arr[idx__16379])) {
      return this__16377.arr[idx__16379 + 1]
    }else {
      if("\ufdd0'else") {
        return not_found
      }else {
        return null
      }
    }
  }
};
cljs.core.HashCollisionNode.prototype.ensure_editable_array = function(e, count, array) {
  var this__16380 = this;
  var inode__16381 = this;
  if(e === this__16380.edit) {
    this__16380.arr = array;
    this__16380.cnt = count;
    return inode__16381
  }else {
    return new cljs.core.HashCollisionNode(this__16380.edit, this__16380.collision_hash, count, array)
  }
};
cljs.core.HashCollisionNode;
cljs.core.create_node = function() {
  var create_node = null;
  var create_node__6 = function(shift, key1, val1, key2hash, key2, val2) {
    var key1hash__16386 = cljs.core.hash.call(null, key1);
    if(key1hash__16386 === key2hash) {
      return new cljs.core.HashCollisionNode(null, key1hash__16386, 2, [key1, val1, key2, val2])
    }else {
      var added_leaf_QMARK___16387 = new cljs.core.Box(false);
      return cljs.core.BitmapIndexedNode.EMPTY.inode_assoc(shift, key1hash__16386, key1, val1, added_leaf_QMARK___16387).inode_assoc(shift, key2hash, key2, val2, added_leaf_QMARK___16387)
    }
  };
  var create_node__7 = function(edit, shift, key1, val1, key2hash, key2, val2) {
    var key1hash__16388 = cljs.core.hash.call(null, key1);
    if(key1hash__16388 === key2hash) {
      return new cljs.core.HashCollisionNode(null, key1hash__16388, 2, [key1, val1, key2, val2])
    }else {
      var added_leaf_QMARK___16389 = new cljs.core.Box(false);
      return cljs.core.BitmapIndexedNode.EMPTY.inode_assoc_BANG_(edit, shift, key1hash__16388, key1, val1, added_leaf_QMARK___16389).inode_assoc_BANG_(edit, shift, key2hash, key2, val2, added_leaf_QMARK___16389)
    }
  };
  create_node = function(edit, shift, key1, val1, key2hash, key2, val2) {
    switch(arguments.length) {
      case 6:
        return create_node__6.call(this, edit, shift, key1, val1, key2hash, key2);
      case 7:
        return create_node__7.call(this, edit, shift, key1, val1, key2hash, key2, val2)
    }
    throw"Invalid arity: " + arguments.length;
  };
  create_node.cljs$lang$arity$6 = create_node__6;
  create_node.cljs$lang$arity$7 = create_node__7;
  return create_node
}();
cljs.core.NodeSeq = function(meta, nodes, i, s, __hash) {
  this.meta = meta;
  this.nodes = nodes;
  this.i = i;
  this.s = s;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 31850572
};
cljs.core.NodeSeq.cljs$lang$type = true;
cljs.core.NodeSeq.cljs$lang$ctorPrSeq = function(this__2309__auto__) {
  return cljs.core.list.call(null, "cljs.core/NodeSeq")
};
cljs.core.NodeSeq.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__16390 = this;
  var h__2192__auto____16391 = this__16390.__hash;
  if(!(h__2192__auto____16391 == null)) {
    return h__2192__auto____16391
  }else {
    var h__2192__auto____16392 = cljs.core.hash_coll.call(null, coll);
    this__16390.__hash = h__2192__auto____16392;
    return h__2192__auto____16392
  }
};
cljs.core.NodeSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__16393 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.NodeSeq.prototype.toString = function() {
  var this__16394 = this;
  var this__16395 = this;
  return cljs.core.pr_str.call(null, this__16395)
};
cljs.core.NodeSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(this$) {
  var this__16396 = this;
  return this$
};
cljs.core.NodeSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__16397 = this;
  if(this__16397.s == null) {
    return cljs.core.PersistentVector.fromArray([this__16397.nodes[this__16397.i], this__16397.nodes[this__16397.i + 1]], true)
  }else {
    return cljs.core.first.call(null, this__16397.s)
  }
};
cljs.core.NodeSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__16398 = this;
  if(this__16398.s == null) {
    return cljs.core.create_inode_seq.call(null, this__16398.nodes, this__16398.i + 2, null)
  }else {
    return cljs.core.create_inode_seq.call(null, this__16398.nodes, this__16398.i, cljs.core.next.call(null, this__16398.s))
  }
};
cljs.core.NodeSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__16399 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.NodeSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__16400 = this;
  return new cljs.core.NodeSeq(meta, this__16400.nodes, this__16400.i, this__16400.s, this__16400.__hash)
};
cljs.core.NodeSeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__16401 = this;
  return this__16401.meta
};
cljs.core.NodeSeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__16402 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__16402.meta)
};
cljs.core.NodeSeq;
cljs.core.create_inode_seq = function() {
  var create_inode_seq = null;
  var create_inode_seq__1 = function(nodes) {
    return create_inode_seq.call(null, nodes, 0, null)
  };
  var create_inode_seq__3 = function(nodes, i, s) {
    if(s == null) {
      var len__16409 = nodes.length;
      var j__16410 = i;
      while(true) {
        if(j__16410 < len__16409) {
          if(!(nodes[j__16410] == null)) {
            return new cljs.core.NodeSeq(null, nodes, j__16410, null, null)
          }else {
            var temp__3971__auto____16411 = nodes[j__16410 + 1];
            if(cljs.core.truth_(temp__3971__auto____16411)) {
              var node__16412 = temp__3971__auto____16411;
              var temp__3971__auto____16413 = node__16412.inode_seq();
              if(cljs.core.truth_(temp__3971__auto____16413)) {
                var node_seq__16414 = temp__3971__auto____16413;
                return new cljs.core.NodeSeq(null, nodes, j__16410 + 2, node_seq__16414, null)
              }else {
                var G__16415 = j__16410 + 2;
                j__16410 = G__16415;
                continue
              }
            }else {
              var G__16416 = j__16410 + 2;
              j__16410 = G__16416;
              continue
            }
          }
        }else {
          return null
        }
        break
      }
    }else {
      return new cljs.core.NodeSeq(null, nodes, i, s, null)
    }
  };
  create_inode_seq = function(nodes, i, s) {
    switch(arguments.length) {
      case 1:
        return create_inode_seq__1.call(this, nodes);
      case 3:
        return create_inode_seq__3.call(this, nodes, i, s)
    }
    throw"Invalid arity: " + arguments.length;
  };
  create_inode_seq.cljs$lang$arity$1 = create_inode_seq__1;
  create_inode_seq.cljs$lang$arity$3 = create_inode_seq__3;
  return create_inode_seq
}();
cljs.core.ArrayNodeSeq = function(meta, nodes, i, s, __hash) {
  this.meta = meta;
  this.nodes = nodes;
  this.i = i;
  this.s = s;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 31850572
};
cljs.core.ArrayNodeSeq.cljs$lang$type = true;
cljs.core.ArrayNodeSeq.cljs$lang$ctorPrSeq = function(this__2309__auto__) {
  return cljs.core.list.call(null, "cljs.core/ArrayNodeSeq")
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__16417 = this;
  var h__2192__auto____16418 = this__16417.__hash;
  if(!(h__2192__auto____16418 == null)) {
    return h__2192__auto____16418
  }else {
    var h__2192__auto____16419 = cljs.core.hash_coll.call(null, coll);
    this__16417.__hash = h__2192__auto____16419;
    return h__2192__auto____16419
  }
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__16420 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.ArrayNodeSeq.prototype.toString = function() {
  var this__16421 = this;
  var this__16422 = this;
  return cljs.core.pr_str.call(null, this__16422)
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(this$) {
  var this__16423 = this;
  return this$
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__16424 = this;
  return cljs.core.first.call(null, this__16424.s)
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__16425 = this;
  return cljs.core.create_array_node_seq.call(null, null, this__16425.nodes, this__16425.i, cljs.core.next.call(null, this__16425.s))
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__16426 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__16427 = this;
  return new cljs.core.ArrayNodeSeq(meta, this__16427.nodes, this__16427.i, this__16427.s, this__16427.__hash)
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__16428 = this;
  return this__16428.meta
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__16429 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__16429.meta)
};
cljs.core.ArrayNodeSeq;
cljs.core.create_array_node_seq = function() {
  var create_array_node_seq = null;
  var create_array_node_seq__1 = function(nodes) {
    return create_array_node_seq.call(null, null, nodes, 0, null)
  };
  var create_array_node_seq__4 = function(meta, nodes, i, s) {
    if(s == null) {
      var len__16436 = nodes.length;
      var j__16437 = i;
      while(true) {
        if(j__16437 < len__16436) {
          var temp__3971__auto____16438 = nodes[j__16437];
          if(cljs.core.truth_(temp__3971__auto____16438)) {
            var nj__16439 = temp__3971__auto____16438;
            var temp__3971__auto____16440 = nj__16439.inode_seq();
            if(cljs.core.truth_(temp__3971__auto____16440)) {
              var ns__16441 = temp__3971__auto____16440;
              return new cljs.core.ArrayNodeSeq(meta, nodes, j__16437 + 1, ns__16441, null)
            }else {
              var G__16442 = j__16437 + 1;
              j__16437 = G__16442;
              continue
            }
          }else {
            var G__16443 = j__16437 + 1;
            j__16437 = G__16443;
            continue
          }
        }else {
          return null
        }
        break
      }
    }else {
      return new cljs.core.ArrayNodeSeq(meta, nodes, i, s, null)
    }
  };
  create_array_node_seq = function(meta, nodes, i, s) {
    switch(arguments.length) {
      case 1:
        return create_array_node_seq__1.call(this, meta);
      case 4:
        return create_array_node_seq__4.call(this, meta, nodes, i, s)
    }
    throw"Invalid arity: " + arguments.length;
  };
  create_array_node_seq.cljs$lang$arity$1 = create_array_node_seq__1;
  create_array_node_seq.cljs$lang$arity$4 = create_array_node_seq__4;
  return create_array_node_seq
}();
cljs.core.PersistentHashMap = function(meta, cnt, root, has_nil_QMARK_, nil_val, __hash) {
  this.meta = meta;
  this.cnt = cnt;
  this.root = root;
  this.has_nil_QMARK_ = has_nil_QMARK_;
  this.nil_val = nil_val;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 1;
  this.cljs$lang$protocol_mask$partition0$ = 16123663
};
cljs.core.PersistentHashMap.cljs$lang$type = true;
cljs.core.PersistentHashMap.cljs$lang$ctorPrSeq = function(this__2309__auto__) {
  return cljs.core.list.call(null, "cljs.core/PersistentHashMap")
};
cljs.core.PersistentHashMap.prototype.cljs$core$IEditableCollection$_as_transient$arity$1 = function(coll) {
  var this__16446 = this;
  return new cljs.core.TransientHashMap({}, this__16446.root, this__16446.cnt, this__16446.has_nil_QMARK_, this__16446.nil_val)
};
cljs.core.PersistentHashMap.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__16447 = this;
  var h__2192__auto____16448 = this__16447.__hash;
  if(!(h__2192__auto____16448 == null)) {
    return h__2192__auto____16448
  }else {
    var h__2192__auto____16449 = cljs.core.hash_imap.call(null, coll);
    this__16447.__hash = h__2192__auto____16449;
    return h__2192__auto____16449
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__16450 = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(coll, k, null)
};
cljs.core.PersistentHashMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__16451 = this;
  if(k == null) {
    if(this__16451.has_nil_QMARK_) {
      return this__16451.nil_val
    }else {
      return not_found
    }
  }else {
    if(this__16451.root == null) {
      return not_found
    }else {
      if("\ufdd0'else") {
        return this__16451.root.inode_lookup(0, cljs.core.hash.call(null, k), k, not_found)
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__16452 = this;
  if(k == null) {
    if(function() {
      var and__3822__auto____16453 = this__16452.has_nil_QMARK_;
      if(and__3822__auto____16453) {
        return v === this__16452.nil_val
      }else {
        return and__3822__auto____16453
      }
    }()) {
      return coll
    }else {
      return new cljs.core.PersistentHashMap(this__16452.meta, this__16452.has_nil_QMARK_ ? this__16452.cnt : this__16452.cnt + 1, this__16452.root, true, v, null)
    }
  }else {
    var added_leaf_QMARK___16454 = new cljs.core.Box(false);
    var new_root__16455 = (this__16452.root == null ? cljs.core.BitmapIndexedNode.EMPTY : this__16452.root).inode_assoc(0, cljs.core.hash.call(null, k), k, v, added_leaf_QMARK___16454);
    if(new_root__16455 === this__16452.root) {
      return coll
    }else {
      return new cljs.core.PersistentHashMap(this__16452.meta, added_leaf_QMARK___16454.val ? this__16452.cnt + 1 : this__16452.cnt, new_root__16455, this__16452.has_nil_QMARK_, this__16452.nil_val, null)
    }
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = function(coll, k) {
  var this__16456 = this;
  if(k == null) {
    return this__16456.has_nil_QMARK_
  }else {
    if(this__16456.root == null) {
      return false
    }else {
      if("\ufdd0'else") {
        return!(this__16456.root.inode_lookup(0, cljs.core.hash.call(null, k), k, cljs.core.lookup_sentinel) === cljs.core.lookup_sentinel)
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentHashMap.prototype.call = function() {
  var G__16479 = null;
  var G__16479__2 = function(this_sym16457, k) {
    var this__16459 = this;
    var this_sym16457__16460 = this;
    var coll__16461 = this_sym16457__16460;
    return coll__16461.cljs$core$ILookup$_lookup$arity$2(coll__16461, k)
  };
  var G__16479__3 = function(this_sym16458, k, not_found) {
    var this__16459 = this;
    var this_sym16458__16462 = this;
    var coll__16463 = this_sym16458__16462;
    return coll__16463.cljs$core$ILookup$_lookup$arity$3(coll__16463, k, not_found)
  };
  G__16479 = function(this_sym16458, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__16479__2.call(this, this_sym16458, k);
      case 3:
        return G__16479__3.call(this, this_sym16458, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__16479
}();
cljs.core.PersistentHashMap.prototype.apply = function(this_sym16444, args16445) {
  var this__16464 = this;
  return this_sym16444.call.apply(this_sym16444, [this_sym16444].concat(args16445.slice()))
};
cljs.core.PersistentHashMap.prototype.cljs$core$IKVReduce$_kv_reduce$arity$3 = function(coll, f, init) {
  var this__16465 = this;
  var init__16466 = this__16465.has_nil_QMARK_ ? f.call(null, init, null, this__16465.nil_val) : init;
  if(cljs.core.reduced_QMARK_.call(null, init__16466)) {
    return cljs.core.deref.call(null, init__16466)
  }else {
    if(!(this__16465.root == null)) {
      return this__16465.root.kv_reduce(f, init__16466)
    }else {
      if("\ufdd0'else") {
        return init__16466
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, entry) {
  var this__16467 = this;
  if(cljs.core.vector_QMARK_.call(null, entry)) {
    return coll.cljs$core$IAssociative$_assoc$arity$3(coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.PersistentHashMap.prototype.toString = function() {
  var this__16468 = this;
  var this__16469 = this;
  return cljs.core.pr_str.call(null, this__16469)
};
cljs.core.PersistentHashMap.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__16470 = this;
  if(this__16470.cnt > 0) {
    var s__16471 = !(this__16470.root == null) ? this__16470.root.inode_seq() : null;
    if(this__16470.has_nil_QMARK_) {
      return cljs.core.cons.call(null, cljs.core.PersistentVector.fromArray([null, this__16470.nil_val], true), s__16471)
    }else {
      return s__16471
    }
  }else {
    return null
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__16472 = this;
  return this__16472.cnt
};
cljs.core.PersistentHashMap.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__16473 = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.PersistentHashMap.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__16474 = this;
  return new cljs.core.PersistentHashMap(meta, this__16474.cnt, this__16474.root, this__16474.has_nil_QMARK_, this__16474.nil_val, this__16474.__hash)
};
cljs.core.PersistentHashMap.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__16475 = this;
  return this__16475.meta
};
cljs.core.PersistentHashMap.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__16476 = this;
  return cljs.core._with_meta.call(null, cljs.core.PersistentHashMap.EMPTY, this__16476.meta)
};
cljs.core.PersistentHashMap.prototype.cljs$core$IMap$_dissoc$arity$2 = function(coll, k) {
  var this__16477 = this;
  if(k == null) {
    if(this__16477.has_nil_QMARK_) {
      return new cljs.core.PersistentHashMap(this__16477.meta, this__16477.cnt - 1, this__16477.root, false, null, null)
    }else {
      return coll
    }
  }else {
    if(this__16477.root == null) {
      return coll
    }else {
      if("\ufdd0'else") {
        var new_root__16478 = this__16477.root.inode_without(0, cljs.core.hash.call(null, k), k);
        if(new_root__16478 === this__16477.root) {
          return coll
        }else {
          return new cljs.core.PersistentHashMap(this__16477.meta, this__16477.cnt - 1, new_root__16478, this__16477.has_nil_QMARK_, this__16477.nil_val, null)
        }
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentHashMap;
cljs.core.PersistentHashMap.EMPTY = new cljs.core.PersistentHashMap(null, 0, null, false, null, 0);
cljs.core.PersistentHashMap.fromArrays = function(ks, vs) {
  var len__16480 = ks.length;
  var i__16481 = 0;
  var out__16482 = cljs.core.transient$.call(null, cljs.core.PersistentHashMap.EMPTY);
  while(true) {
    if(i__16481 < len__16480) {
      var G__16483 = i__16481 + 1;
      var G__16484 = cljs.core.assoc_BANG_.call(null, out__16482, ks[i__16481], vs[i__16481]);
      i__16481 = G__16483;
      out__16482 = G__16484;
      continue
    }else {
      return cljs.core.persistent_BANG_.call(null, out__16482)
    }
    break
  }
};
cljs.core.TransientHashMap = function(edit, root, count, has_nil_QMARK_, nil_val) {
  this.edit = edit;
  this.root = root;
  this.count = count;
  this.has_nil_QMARK_ = has_nil_QMARK_;
  this.nil_val = nil_val;
  this.cljs$lang$protocol_mask$partition1$ = 14;
  this.cljs$lang$protocol_mask$partition0$ = 258
};
cljs.core.TransientHashMap.cljs$lang$type = true;
cljs.core.TransientHashMap.cljs$lang$ctorPrSeq = function(this__2309__auto__) {
  return cljs.core.list.call(null, "cljs.core/TransientHashMap")
};
cljs.core.TransientHashMap.prototype.cljs$core$ITransientMap$_dissoc_BANG_$arity$2 = function(tcoll, key) {
  var this__16485 = this;
  return tcoll.without_BANG_(key)
};
cljs.core.TransientHashMap.prototype.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3 = function(tcoll, key, val) {
  var this__16486 = this;
  return tcoll.assoc_BANG_(key, val)
};
cljs.core.TransientHashMap.prototype.cljs$core$ITransientCollection$_conj_BANG_$arity$2 = function(tcoll, val) {
  var this__16487 = this;
  return tcoll.conj_BANG_(val)
};
cljs.core.TransientHashMap.prototype.cljs$core$ITransientCollection$_persistent_BANG_$arity$1 = function(tcoll) {
  var this__16488 = this;
  return tcoll.persistent_BANG_()
};
cljs.core.TransientHashMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(tcoll, k) {
  var this__16489 = this;
  if(k == null) {
    if(this__16489.has_nil_QMARK_) {
      return this__16489.nil_val
    }else {
      return null
    }
  }else {
    if(this__16489.root == null) {
      return null
    }else {
      return this__16489.root.inode_lookup(0, cljs.core.hash.call(null, k), k)
    }
  }
};
cljs.core.TransientHashMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(tcoll, k, not_found) {
  var this__16490 = this;
  if(k == null) {
    if(this__16490.has_nil_QMARK_) {
      return this__16490.nil_val
    }else {
      return not_found
    }
  }else {
    if(this__16490.root == null) {
      return not_found
    }else {
      return this__16490.root.inode_lookup(0, cljs.core.hash.call(null, k), k, not_found)
    }
  }
};
cljs.core.TransientHashMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__16491 = this;
  if(this__16491.edit) {
    return this__16491.count
  }else {
    throw new Error("count after persistent!");
  }
};
cljs.core.TransientHashMap.prototype.conj_BANG_ = function(o) {
  var this__16492 = this;
  var tcoll__16493 = this;
  if(this__16492.edit) {
    if(function() {
      var G__16494__16495 = o;
      if(G__16494__16495) {
        if(function() {
          var or__3824__auto____16496 = G__16494__16495.cljs$lang$protocol_mask$partition0$ & 2048;
          if(or__3824__auto____16496) {
            return or__3824__auto____16496
          }else {
            return G__16494__16495.cljs$core$IMapEntry$
          }
        }()) {
          return true
        }else {
          if(!G__16494__16495.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.IMapEntry, G__16494__16495)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.IMapEntry, G__16494__16495)
      }
    }()) {
      return tcoll__16493.assoc_BANG_(cljs.core.key.call(null, o), cljs.core.val.call(null, o))
    }else {
      var es__16497 = cljs.core.seq.call(null, o);
      var tcoll__16498 = tcoll__16493;
      while(true) {
        var temp__3971__auto____16499 = cljs.core.first.call(null, es__16497);
        if(cljs.core.truth_(temp__3971__auto____16499)) {
          var e__16500 = temp__3971__auto____16499;
          var G__16511 = cljs.core.next.call(null, es__16497);
          var G__16512 = tcoll__16498.assoc_BANG_(cljs.core.key.call(null, e__16500), cljs.core.val.call(null, e__16500));
          es__16497 = G__16511;
          tcoll__16498 = G__16512;
          continue
        }else {
          return tcoll__16498
        }
        break
      }
    }
  }else {
    throw new Error("conj! after persistent");
  }
};
cljs.core.TransientHashMap.prototype.assoc_BANG_ = function(k, v) {
  var this__16501 = this;
  var tcoll__16502 = this;
  if(this__16501.edit) {
    if(k == null) {
      if(this__16501.nil_val === v) {
      }else {
        this__16501.nil_val = v
      }
      if(this__16501.has_nil_QMARK_) {
      }else {
        this__16501.count = this__16501.count + 1;
        this__16501.has_nil_QMARK_ = true
      }
      return tcoll__16502
    }else {
      var added_leaf_QMARK___16503 = new cljs.core.Box(false);
      var node__16504 = (this__16501.root == null ? cljs.core.BitmapIndexedNode.EMPTY : this__16501.root).inode_assoc_BANG_(this__16501.edit, 0, cljs.core.hash.call(null, k), k, v, added_leaf_QMARK___16503);
      if(node__16504 === this__16501.root) {
      }else {
        this__16501.root = node__16504
      }
      if(added_leaf_QMARK___16503.val) {
        this__16501.count = this__16501.count + 1
      }else {
      }
      return tcoll__16502
    }
  }else {
    throw new Error("assoc! after persistent!");
  }
};
cljs.core.TransientHashMap.prototype.without_BANG_ = function(k) {
  var this__16505 = this;
  var tcoll__16506 = this;
  if(this__16505.edit) {
    if(k == null) {
      if(this__16505.has_nil_QMARK_) {
        this__16505.has_nil_QMARK_ = false;
        this__16505.nil_val = null;
        this__16505.count = this__16505.count - 1;
        return tcoll__16506
      }else {
        return tcoll__16506
      }
    }else {
      if(this__16505.root == null) {
        return tcoll__16506
      }else {
        var removed_leaf_QMARK___16507 = new cljs.core.Box(false);
        var node__16508 = this__16505.root.inode_without_BANG_(this__16505.edit, 0, cljs.core.hash.call(null, k), k, removed_leaf_QMARK___16507);
        if(node__16508 === this__16505.root) {
        }else {
          this__16505.root = node__16508
        }
        if(cljs.core.truth_(removed_leaf_QMARK___16507[0])) {
          this__16505.count = this__16505.count - 1
        }else {
        }
        return tcoll__16506
      }
    }
  }else {
    throw new Error("dissoc! after persistent!");
  }
};
cljs.core.TransientHashMap.prototype.persistent_BANG_ = function() {
  var this__16509 = this;
  var tcoll__16510 = this;
  if(this__16509.edit) {
    this__16509.edit = null;
    return new cljs.core.PersistentHashMap(null, this__16509.count, this__16509.root, this__16509.has_nil_QMARK_, this__16509.nil_val, null)
  }else {
    throw new Error("persistent! called twice");
  }
};
cljs.core.TransientHashMap;
cljs.core.tree_map_seq_push = function tree_map_seq_push(node, stack, ascending_QMARK_) {
  var t__16515 = node;
  var stack__16516 = stack;
  while(true) {
    if(!(t__16515 == null)) {
      var G__16517 = ascending_QMARK_ ? t__16515.left : t__16515.right;
      var G__16518 = cljs.core.conj.call(null, stack__16516, t__16515);
      t__16515 = G__16517;
      stack__16516 = G__16518;
      continue
    }else {
      return stack__16516
    }
    break
  }
};
cljs.core.PersistentTreeMapSeq = function(meta, stack, ascending_QMARK_, cnt, __hash) {
  this.meta = meta;
  this.stack = stack;
  this.ascending_QMARK_ = ascending_QMARK_;
  this.cnt = cnt;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 31850570
};
cljs.core.PersistentTreeMapSeq.cljs$lang$type = true;
cljs.core.PersistentTreeMapSeq.cljs$lang$ctorPrSeq = function(this__2309__auto__) {
  return cljs.core.list.call(null, "cljs.core/PersistentTreeMapSeq")
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__16519 = this;
  var h__2192__auto____16520 = this__16519.__hash;
  if(!(h__2192__auto____16520 == null)) {
    return h__2192__auto____16520
  }else {
    var h__2192__auto____16521 = cljs.core.hash_coll.call(null, coll);
    this__16519.__hash = h__2192__auto____16521;
    return h__2192__auto____16521
  }
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__16522 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.PersistentTreeMapSeq.prototype.toString = function() {
  var this__16523 = this;
  var this__16524 = this;
  return cljs.core.pr_str.call(null, this__16524)
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(this$) {
  var this__16525 = this;
  return this$
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__16526 = this;
  if(this__16526.cnt < 0) {
    return cljs.core.count.call(null, cljs.core.next.call(null, coll)) + 1
  }else {
    return this__16526.cnt
  }
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(this$) {
  var this__16527 = this;
  return cljs.core.peek.call(null, this__16527.stack)
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(this$) {
  var this__16528 = this;
  var t__16529 = cljs.core.first.call(null, this__16528.stack);
  var next_stack__16530 = cljs.core.tree_map_seq_push.call(null, this__16528.ascending_QMARK_ ? t__16529.right : t__16529.left, cljs.core.next.call(null, this__16528.stack), this__16528.ascending_QMARK_);
  if(!(next_stack__16530 == null)) {
    return new cljs.core.PersistentTreeMapSeq(null, next_stack__16530, this__16528.ascending_QMARK_, this__16528.cnt - 1, null)
  }else {
    return cljs.core.List.EMPTY
  }
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__16531 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__16532 = this;
  return new cljs.core.PersistentTreeMapSeq(meta, this__16532.stack, this__16532.ascending_QMARK_, this__16532.cnt, this__16532.__hash)
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__16533 = this;
  return this__16533.meta
};
cljs.core.PersistentTreeMapSeq;
cljs.core.create_tree_map_seq = function create_tree_map_seq(tree, ascending_QMARK_, cnt) {
  return new cljs.core.PersistentTreeMapSeq(null, cljs.core.tree_map_seq_push.call(null, tree, null, ascending_QMARK_), ascending_QMARK_, cnt, null)
};
cljs.core.balance_left = function balance_left(key, val, ins, right) {
  if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, ins)) {
    if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, ins.left)) {
      return new cljs.core.RedNode(ins.key, ins.val, ins.left.blacken(), new cljs.core.BlackNode(key, val, ins.right, right, null), null)
    }else {
      if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, ins.right)) {
        return new cljs.core.RedNode(ins.right.key, ins.right.val, new cljs.core.BlackNode(ins.key, ins.val, ins.left, ins.right.left, null), new cljs.core.BlackNode(key, val, ins.right.right, right, null), null)
      }else {
        if("\ufdd0'else") {
          return new cljs.core.BlackNode(key, val, ins, right, null)
        }else {
          return null
        }
      }
    }
  }else {
    return new cljs.core.BlackNode(key, val, ins, right, null)
  }
};
cljs.core.balance_right = function balance_right(key, val, left, ins) {
  if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, ins)) {
    if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, ins.right)) {
      return new cljs.core.RedNode(ins.key, ins.val, new cljs.core.BlackNode(key, val, left, ins.left, null), ins.right.blacken(), null)
    }else {
      if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, ins.left)) {
        return new cljs.core.RedNode(ins.left.key, ins.left.val, new cljs.core.BlackNode(key, val, left, ins.left.left, null), new cljs.core.BlackNode(ins.key, ins.val, ins.left.right, ins.right, null), null)
      }else {
        if("\ufdd0'else") {
          return new cljs.core.BlackNode(key, val, left, ins, null)
        }else {
          return null
        }
      }
    }
  }else {
    return new cljs.core.BlackNode(key, val, left, ins, null)
  }
};
cljs.core.balance_left_del = function balance_left_del(key, val, del, right) {
  if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, del)) {
    return new cljs.core.RedNode(key, val, del.blacken(), right, null)
  }else {
    if(cljs.core.instance_QMARK_.call(null, cljs.core.BlackNode, right)) {
      return cljs.core.balance_right.call(null, key, val, del, right.redden())
    }else {
      if(function() {
        var and__3822__auto____16535 = cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, right);
        if(and__3822__auto____16535) {
          return cljs.core.instance_QMARK_.call(null, cljs.core.BlackNode, right.left)
        }else {
          return and__3822__auto____16535
        }
      }()) {
        return new cljs.core.RedNode(right.left.key, right.left.val, new cljs.core.BlackNode(key, val, del, right.left.left, null), cljs.core.balance_right.call(null, right.key, right.val, right.left.right, right.right.redden()), null)
      }else {
        if("\ufdd0'else") {
          throw new Error("red-black tree invariant violation");
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.balance_right_del = function balance_right_del(key, val, left, del) {
  if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, del)) {
    return new cljs.core.RedNode(key, val, left, del.blacken(), null)
  }else {
    if(cljs.core.instance_QMARK_.call(null, cljs.core.BlackNode, left)) {
      return cljs.core.balance_left.call(null, key, val, left.redden(), del)
    }else {
      if(function() {
        var and__3822__auto____16537 = cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, left);
        if(and__3822__auto____16537) {
          return cljs.core.instance_QMARK_.call(null, cljs.core.BlackNode, left.right)
        }else {
          return and__3822__auto____16537
        }
      }()) {
        return new cljs.core.RedNode(left.right.key, left.right.val, cljs.core.balance_left.call(null, left.key, left.val, left.left.redden(), left.right.left), new cljs.core.BlackNode(key, val, left.right.right, del, null), null)
      }else {
        if("\ufdd0'else") {
          throw new Error("red-black tree invariant violation");
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.tree_map_kv_reduce = function tree_map_kv_reduce(node, f, init) {
  var init__16541 = f.call(null, init, node.key, node.val);
  if(cljs.core.reduced_QMARK_.call(null, init__16541)) {
    return cljs.core.deref.call(null, init__16541)
  }else {
    var init__16542 = !(node.left == null) ? tree_map_kv_reduce.call(null, node.left, f, init__16541) : init__16541;
    if(cljs.core.reduced_QMARK_.call(null, init__16542)) {
      return cljs.core.deref.call(null, init__16542)
    }else {
      var init__16543 = !(node.right == null) ? tree_map_kv_reduce.call(null, node.right, f, init__16542) : init__16542;
      if(cljs.core.reduced_QMARK_.call(null, init__16543)) {
        return cljs.core.deref.call(null, init__16543)
      }else {
        return init__16543
      }
    }
  }
};
cljs.core.BlackNode = function(key, val, left, right, __hash) {
  this.key = key;
  this.val = val;
  this.left = left;
  this.right = right;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 32402207
};
cljs.core.BlackNode.cljs$lang$type = true;
cljs.core.BlackNode.cljs$lang$ctorPrSeq = function(this__2309__auto__) {
  return cljs.core.list.call(null, "cljs.core/BlackNode")
};
cljs.core.BlackNode.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__16546 = this;
  var h__2192__auto____16547 = this__16546.__hash;
  if(!(h__2192__auto____16547 == null)) {
    return h__2192__auto____16547
  }else {
    var h__2192__auto____16548 = cljs.core.hash_coll.call(null, coll);
    this__16546.__hash = h__2192__auto____16548;
    return h__2192__auto____16548
  }
};
cljs.core.BlackNode.prototype.cljs$core$ILookup$_lookup$arity$2 = function(node, k) {
  var this__16549 = this;
  return node.cljs$core$IIndexed$_nth$arity$3(node, k, null)
};
cljs.core.BlackNode.prototype.cljs$core$ILookup$_lookup$arity$3 = function(node, k, not_found) {
  var this__16550 = this;
  return node.cljs$core$IIndexed$_nth$arity$3(node, k, not_found)
};
cljs.core.BlackNode.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(node, k, v) {
  var this__16551 = this;
  return cljs.core.assoc.call(null, cljs.core.PersistentVector.fromArray([this__16551.key, this__16551.val], true), k, v)
};
cljs.core.BlackNode.prototype.call = function() {
  var G__16599 = null;
  var G__16599__2 = function(this_sym16552, k) {
    var this__16554 = this;
    var this_sym16552__16555 = this;
    var node__16556 = this_sym16552__16555;
    return node__16556.cljs$core$ILookup$_lookup$arity$2(node__16556, k)
  };
  var G__16599__3 = function(this_sym16553, k, not_found) {
    var this__16554 = this;
    var this_sym16553__16557 = this;
    var node__16558 = this_sym16553__16557;
    return node__16558.cljs$core$ILookup$_lookup$arity$3(node__16558, k, not_found)
  };
  G__16599 = function(this_sym16553, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__16599__2.call(this, this_sym16553, k);
      case 3:
        return G__16599__3.call(this, this_sym16553, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__16599
}();
cljs.core.BlackNode.prototype.apply = function(this_sym16544, args16545) {
  var this__16559 = this;
  return this_sym16544.call.apply(this_sym16544, [this_sym16544].concat(args16545.slice()))
};
cljs.core.BlackNode.prototype.cljs$core$ICollection$_conj$arity$2 = function(node, o) {
  var this__16560 = this;
  return cljs.core.PersistentVector.fromArray([this__16560.key, this__16560.val, o], true)
};
cljs.core.BlackNode.prototype.cljs$core$IMapEntry$_key$arity$1 = function(node) {
  var this__16561 = this;
  return this__16561.key
};
cljs.core.BlackNode.prototype.cljs$core$IMapEntry$_val$arity$1 = function(node) {
  var this__16562 = this;
  return this__16562.val
};
cljs.core.BlackNode.prototype.add_right = function(ins) {
  var this__16563 = this;
  var node__16564 = this;
  return ins.balance_right(node__16564)
};
cljs.core.BlackNode.prototype.redden = function() {
  var this__16565 = this;
  var node__16566 = this;
  return new cljs.core.RedNode(this__16565.key, this__16565.val, this__16565.left, this__16565.right, null)
};
cljs.core.BlackNode.prototype.remove_right = function(del) {
  var this__16567 = this;
  var node__16568 = this;
  return cljs.core.balance_right_del.call(null, this__16567.key, this__16567.val, this__16567.left, del)
};
cljs.core.BlackNode.prototype.replace = function(key, val, left, right) {
  var this__16569 = this;
  var node__16570 = this;
  return new cljs.core.BlackNode(key, val, left, right, null)
};
cljs.core.BlackNode.prototype.kv_reduce = function(f, init) {
  var this__16571 = this;
  var node__16572 = this;
  return cljs.core.tree_map_kv_reduce.call(null, node__16572, f, init)
};
cljs.core.BlackNode.prototype.remove_left = function(del) {
  var this__16573 = this;
  var node__16574 = this;
  return cljs.core.balance_left_del.call(null, this__16573.key, this__16573.val, del, this__16573.right)
};
cljs.core.BlackNode.prototype.add_left = function(ins) {
  var this__16575 = this;
  var node__16576 = this;
  return ins.balance_left(node__16576)
};
cljs.core.BlackNode.prototype.balance_left = function(parent) {
  var this__16577 = this;
  var node__16578 = this;
  return new cljs.core.BlackNode(parent.key, parent.val, node__16578, parent.right, null)
};
cljs.core.BlackNode.prototype.toString = function() {
  var G__16600 = null;
  var G__16600__0 = function() {
    var this__16579 = this;
    var this__16581 = this;
    return cljs.core.pr_str.call(null, this__16581)
  };
  G__16600 = function() {
    switch(arguments.length) {
      case 0:
        return G__16600__0.call(this)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__16600
}();
cljs.core.BlackNode.prototype.balance_right = function(parent) {
  var this__16582 = this;
  var node__16583 = this;
  return new cljs.core.BlackNode(parent.key, parent.val, parent.left, node__16583, null)
};
cljs.core.BlackNode.prototype.blacken = function() {
  var this__16584 = this;
  var node__16585 = this;
  return node__16585
};
cljs.core.BlackNode.prototype.cljs$core$IReduce$_reduce$arity$2 = function(node, f) {
  var this__16586 = this;
  return cljs.core.ci_reduce.call(null, node, f)
};
cljs.core.BlackNode.prototype.cljs$core$IReduce$_reduce$arity$3 = function(node, f, start) {
  var this__16587 = this;
  return cljs.core.ci_reduce.call(null, node, f, start)
};
cljs.core.BlackNode.prototype.cljs$core$ISeqable$_seq$arity$1 = function(node) {
  var this__16588 = this;
  return cljs.core.list.call(null, this__16588.key, this__16588.val)
};
cljs.core.BlackNode.prototype.cljs$core$ICounted$_count$arity$1 = function(node) {
  var this__16589 = this;
  return 2
};
cljs.core.BlackNode.prototype.cljs$core$IStack$_peek$arity$1 = function(node) {
  var this__16590 = this;
  return this__16590.val
};
cljs.core.BlackNode.prototype.cljs$core$IStack$_pop$arity$1 = function(node) {
  var this__16591 = this;
  return cljs.core.PersistentVector.fromArray([this__16591.key], true)
};
cljs.core.BlackNode.prototype.cljs$core$IVector$_assoc_n$arity$3 = function(node, n, v) {
  var this__16592 = this;
  return cljs.core._assoc_n.call(null, cljs.core.PersistentVector.fromArray([this__16592.key, this__16592.val], true), n, v)
};
cljs.core.BlackNode.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__16593 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.BlackNode.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(node, meta) {
  var this__16594 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentVector.fromArray([this__16594.key, this__16594.val], true), meta)
};
cljs.core.BlackNode.prototype.cljs$core$IMeta$_meta$arity$1 = function(node) {
  var this__16595 = this;
  return null
};
cljs.core.BlackNode.prototype.cljs$core$IIndexed$_nth$arity$2 = function(node, n) {
  var this__16596 = this;
  if(n === 0) {
    return this__16596.key
  }else {
    if(n === 1) {
      return this__16596.val
    }else {
      if("\ufdd0'else") {
        return null
      }else {
        return null
      }
    }
  }
};
cljs.core.BlackNode.prototype.cljs$core$IIndexed$_nth$arity$3 = function(node, n, not_found) {
  var this__16597 = this;
  if(n === 0) {
    return this__16597.key
  }else {
    if(n === 1) {
      return this__16597.val
    }else {
      if("\ufdd0'else") {
        return not_found
      }else {
        return null
      }
    }
  }
};
cljs.core.BlackNode.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(node) {
  var this__16598 = this;
  return cljs.core.PersistentVector.EMPTY
};
cljs.core.BlackNode;
cljs.core.RedNode = function(key, val, left, right, __hash) {
  this.key = key;
  this.val = val;
  this.left = left;
  this.right = right;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 32402207
};
cljs.core.RedNode.cljs$lang$type = true;
cljs.core.RedNode.cljs$lang$ctorPrSeq = function(this__2309__auto__) {
  return cljs.core.list.call(null, "cljs.core/RedNode")
};
cljs.core.RedNode.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__16603 = this;
  var h__2192__auto____16604 = this__16603.__hash;
  if(!(h__2192__auto____16604 == null)) {
    return h__2192__auto____16604
  }else {
    var h__2192__auto____16605 = cljs.core.hash_coll.call(null, coll);
    this__16603.__hash = h__2192__auto____16605;
    return h__2192__auto____16605
  }
};
cljs.core.RedNode.prototype.cljs$core$ILookup$_lookup$arity$2 = function(node, k) {
  var this__16606 = this;
  return node.cljs$core$IIndexed$_nth$arity$3(node, k, null)
};
cljs.core.RedNode.prototype.cljs$core$ILookup$_lookup$arity$3 = function(node, k, not_found) {
  var this__16607 = this;
  return node.cljs$core$IIndexed$_nth$arity$3(node, k, not_found)
};
cljs.core.RedNode.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(node, k, v) {
  var this__16608 = this;
  return cljs.core.assoc.call(null, cljs.core.PersistentVector.fromArray([this__16608.key, this__16608.val], true), k, v)
};
cljs.core.RedNode.prototype.call = function() {
  var G__16656 = null;
  var G__16656__2 = function(this_sym16609, k) {
    var this__16611 = this;
    var this_sym16609__16612 = this;
    var node__16613 = this_sym16609__16612;
    return node__16613.cljs$core$ILookup$_lookup$arity$2(node__16613, k)
  };
  var G__16656__3 = function(this_sym16610, k, not_found) {
    var this__16611 = this;
    var this_sym16610__16614 = this;
    var node__16615 = this_sym16610__16614;
    return node__16615.cljs$core$ILookup$_lookup$arity$3(node__16615, k, not_found)
  };
  G__16656 = function(this_sym16610, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__16656__2.call(this, this_sym16610, k);
      case 3:
        return G__16656__3.call(this, this_sym16610, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__16656
}();
cljs.core.RedNode.prototype.apply = function(this_sym16601, args16602) {
  var this__16616 = this;
  return this_sym16601.call.apply(this_sym16601, [this_sym16601].concat(args16602.slice()))
};
cljs.core.RedNode.prototype.cljs$core$ICollection$_conj$arity$2 = function(node, o) {
  var this__16617 = this;
  return cljs.core.PersistentVector.fromArray([this__16617.key, this__16617.val, o], true)
};
cljs.core.RedNode.prototype.cljs$core$IMapEntry$_key$arity$1 = function(node) {
  var this__16618 = this;
  return this__16618.key
};
cljs.core.RedNode.prototype.cljs$core$IMapEntry$_val$arity$1 = function(node) {
  var this__16619 = this;
  return this__16619.val
};
cljs.core.RedNode.prototype.add_right = function(ins) {
  var this__16620 = this;
  var node__16621 = this;
  return new cljs.core.RedNode(this__16620.key, this__16620.val, this__16620.left, ins, null)
};
cljs.core.RedNode.prototype.redden = function() {
  var this__16622 = this;
  var node__16623 = this;
  throw new Error("red-black tree invariant violation");
};
cljs.core.RedNode.prototype.remove_right = function(del) {
  var this__16624 = this;
  var node__16625 = this;
  return new cljs.core.RedNode(this__16624.key, this__16624.val, this__16624.left, del, null)
};
cljs.core.RedNode.prototype.replace = function(key, val, left, right) {
  var this__16626 = this;
  var node__16627 = this;
  return new cljs.core.RedNode(key, val, left, right, null)
};
cljs.core.RedNode.prototype.kv_reduce = function(f, init) {
  var this__16628 = this;
  var node__16629 = this;
  return cljs.core.tree_map_kv_reduce.call(null, node__16629, f, init)
};
cljs.core.RedNode.prototype.remove_left = function(del) {
  var this__16630 = this;
  var node__16631 = this;
  return new cljs.core.RedNode(this__16630.key, this__16630.val, del, this__16630.right, null)
};
cljs.core.RedNode.prototype.add_left = function(ins) {
  var this__16632 = this;
  var node__16633 = this;
  return new cljs.core.RedNode(this__16632.key, this__16632.val, ins, this__16632.right, null)
};
cljs.core.RedNode.prototype.balance_left = function(parent) {
  var this__16634 = this;
  var node__16635 = this;
  if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, this__16634.left)) {
    return new cljs.core.RedNode(this__16634.key, this__16634.val, this__16634.left.blacken(), new cljs.core.BlackNode(parent.key, parent.val, this__16634.right, parent.right, null), null)
  }else {
    if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, this__16634.right)) {
      return new cljs.core.RedNode(this__16634.right.key, this__16634.right.val, new cljs.core.BlackNode(this__16634.key, this__16634.val, this__16634.left, this__16634.right.left, null), new cljs.core.BlackNode(parent.key, parent.val, this__16634.right.right, parent.right, null), null)
    }else {
      if("\ufdd0'else") {
        return new cljs.core.BlackNode(parent.key, parent.val, node__16635, parent.right, null)
      }else {
        return null
      }
    }
  }
};
cljs.core.RedNode.prototype.toString = function() {
  var G__16657 = null;
  var G__16657__0 = function() {
    var this__16636 = this;
    var this__16638 = this;
    return cljs.core.pr_str.call(null, this__16638)
  };
  G__16657 = function() {
    switch(arguments.length) {
      case 0:
        return G__16657__0.call(this)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__16657
}();
cljs.core.RedNode.prototype.balance_right = function(parent) {
  var this__16639 = this;
  var node__16640 = this;
  if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, this__16639.right)) {
    return new cljs.core.RedNode(this__16639.key, this__16639.val, new cljs.core.BlackNode(parent.key, parent.val, parent.left, this__16639.left, null), this__16639.right.blacken(), null)
  }else {
    if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, this__16639.left)) {
      return new cljs.core.RedNode(this__16639.left.key, this__16639.left.val, new cljs.core.BlackNode(parent.key, parent.val, parent.left, this__16639.left.left, null), new cljs.core.BlackNode(this__16639.key, this__16639.val, this__16639.left.right, this__16639.right, null), null)
    }else {
      if("\ufdd0'else") {
        return new cljs.core.BlackNode(parent.key, parent.val, parent.left, node__16640, null)
      }else {
        return null
      }
    }
  }
};
cljs.core.RedNode.prototype.blacken = function() {
  var this__16641 = this;
  var node__16642 = this;
  return new cljs.core.BlackNode(this__16641.key, this__16641.val, this__16641.left, this__16641.right, null)
};
cljs.core.RedNode.prototype.cljs$core$IReduce$_reduce$arity$2 = function(node, f) {
  var this__16643 = this;
  return cljs.core.ci_reduce.call(null, node, f)
};
cljs.core.RedNode.prototype.cljs$core$IReduce$_reduce$arity$3 = function(node, f, start) {
  var this__16644 = this;
  return cljs.core.ci_reduce.call(null, node, f, start)
};
cljs.core.RedNode.prototype.cljs$core$ISeqable$_seq$arity$1 = function(node) {
  var this__16645 = this;
  return cljs.core.list.call(null, this__16645.key, this__16645.val)
};
cljs.core.RedNode.prototype.cljs$core$ICounted$_count$arity$1 = function(node) {
  var this__16646 = this;
  return 2
};
cljs.core.RedNode.prototype.cljs$core$IStack$_peek$arity$1 = function(node) {
  var this__16647 = this;
  return this__16647.val
};
cljs.core.RedNode.prototype.cljs$core$IStack$_pop$arity$1 = function(node) {
  var this__16648 = this;
  return cljs.core.PersistentVector.fromArray([this__16648.key], true)
};
cljs.core.RedNode.prototype.cljs$core$IVector$_assoc_n$arity$3 = function(node, n, v) {
  var this__16649 = this;
  return cljs.core._assoc_n.call(null, cljs.core.PersistentVector.fromArray([this__16649.key, this__16649.val], true), n, v)
};
cljs.core.RedNode.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__16650 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.RedNode.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(node, meta) {
  var this__16651 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentVector.fromArray([this__16651.key, this__16651.val], true), meta)
};
cljs.core.RedNode.prototype.cljs$core$IMeta$_meta$arity$1 = function(node) {
  var this__16652 = this;
  return null
};
cljs.core.RedNode.prototype.cljs$core$IIndexed$_nth$arity$2 = function(node, n) {
  var this__16653 = this;
  if(n === 0) {
    return this__16653.key
  }else {
    if(n === 1) {
      return this__16653.val
    }else {
      if("\ufdd0'else") {
        return null
      }else {
        return null
      }
    }
  }
};
cljs.core.RedNode.prototype.cljs$core$IIndexed$_nth$arity$3 = function(node, n, not_found) {
  var this__16654 = this;
  if(n === 0) {
    return this__16654.key
  }else {
    if(n === 1) {
      return this__16654.val
    }else {
      if("\ufdd0'else") {
        return not_found
      }else {
        return null
      }
    }
  }
};
cljs.core.RedNode.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(node) {
  var this__16655 = this;
  return cljs.core.PersistentVector.EMPTY
};
cljs.core.RedNode;
cljs.core.tree_map_add = function tree_map_add(comp, tree, k, v, found) {
  if(tree == null) {
    return new cljs.core.RedNode(k, v, null, null, null)
  }else {
    var c__16661 = comp.call(null, k, tree.key);
    if(c__16661 === 0) {
      found[0] = tree;
      return null
    }else {
      if(c__16661 < 0) {
        var ins__16662 = tree_map_add.call(null, comp, tree.left, k, v, found);
        if(!(ins__16662 == null)) {
          return tree.add_left(ins__16662)
        }else {
          return null
        }
      }else {
        if("\ufdd0'else") {
          var ins__16663 = tree_map_add.call(null, comp, tree.right, k, v, found);
          if(!(ins__16663 == null)) {
            return tree.add_right(ins__16663)
          }else {
            return null
          }
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.tree_map_append = function tree_map_append(left, right) {
  if(left == null) {
    return right
  }else {
    if(right == null) {
      return left
    }else {
      if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, left)) {
        if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, right)) {
          var app__16666 = tree_map_append.call(null, left.right, right.left);
          if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, app__16666)) {
            return new cljs.core.RedNode(app__16666.key, app__16666.val, new cljs.core.RedNode(left.key, left.val, left.left, app__16666.left, null), new cljs.core.RedNode(right.key, right.val, app__16666.right, right.right, null), null)
          }else {
            return new cljs.core.RedNode(left.key, left.val, left.left, new cljs.core.RedNode(right.key, right.val, app__16666, right.right, null), null)
          }
        }else {
          return new cljs.core.RedNode(left.key, left.val, left.left, tree_map_append.call(null, left.right, right), null)
        }
      }else {
        if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, right)) {
          return new cljs.core.RedNode(right.key, right.val, tree_map_append.call(null, left, right.left), right.right, null)
        }else {
          if("\ufdd0'else") {
            var app__16667 = tree_map_append.call(null, left.right, right.left);
            if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, app__16667)) {
              return new cljs.core.RedNode(app__16667.key, app__16667.val, new cljs.core.BlackNode(left.key, left.val, left.left, app__16667.left, null), new cljs.core.BlackNode(right.key, right.val, app__16667.right, right.right, null), null)
            }else {
              return cljs.core.balance_left_del.call(null, left.key, left.val, left.left, new cljs.core.BlackNode(right.key, right.val, app__16667, right.right, null))
            }
          }else {
            return null
          }
        }
      }
    }
  }
};
cljs.core.tree_map_remove = function tree_map_remove(comp, tree, k, found) {
  if(!(tree == null)) {
    var c__16673 = comp.call(null, k, tree.key);
    if(c__16673 === 0) {
      found[0] = tree;
      return cljs.core.tree_map_append.call(null, tree.left, tree.right)
    }else {
      if(c__16673 < 0) {
        var del__16674 = tree_map_remove.call(null, comp, tree.left, k, found);
        if(function() {
          var or__3824__auto____16675 = !(del__16674 == null);
          if(or__3824__auto____16675) {
            return or__3824__auto____16675
          }else {
            return!(found[0] == null)
          }
        }()) {
          if(cljs.core.instance_QMARK_.call(null, cljs.core.BlackNode, tree.left)) {
            return cljs.core.balance_left_del.call(null, tree.key, tree.val, del__16674, tree.right)
          }else {
            return new cljs.core.RedNode(tree.key, tree.val, del__16674, tree.right, null)
          }
        }else {
          return null
        }
      }else {
        if("\ufdd0'else") {
          var del__16676 = tree_map_remove.call(null, comp, tree.right, k, found);
          if(function() {
            var or__3824__auto____16677 = !(del__16676 == null);
            if(or__3824__auto____16677) {
              return or__3824__auto____16677
            }else {
              return!(found[0] == null)
            }
          }()) {
            if(cljs.core.instance_QMARK_.call(null, cljs.core.BlackNode, tree.right)) {
              return cljs.core.balance_right_del.call(null, tree.key, tree.val, tree.left, del__16676)
            }else {
              return new cljs.core.RedNode(tree.key, tree.val, tree.left, del__16676, null)
            }
          }else {
            return null
          }
        }else {
          return null
        }
      }
    }
  }else {
    return null
  }
};
cljs.core.tree_map_replace = function tree_map_replace(comp, tree, k, v) {
  var tk__16680 = tree.key;
  var c__16681 = comp.call(null, k, tk__16680);
  if(c__16681 === 0) {
    return tree.replace(tk__16680, v, tree.left, tree.right)
  }else {
    if(c__16681 < 0) {
      return tree.replace(tk__16680, tree.val, tree_map_replace.call(null, comp, tree.left, k, v), tree.right)
    }else {
      if("\ufdd0'else") {
        return tree.replace(tk__16680, tree.val, tree.left, tree_map_replace.call(null, comp, tree.right, k, v))
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentTreeMap = function(comp, tree, cnt, meta, __hash) {
  this.comp = comp;
  this.tree = tree;
  this.cnt = cnt;
  this.meta = meta;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 418776847
};
cljs.core.PersistentTreeMap.cljs$lang$type = true;
cljs.core.PersistentTreeMap.cljs$lang$ctorPrSeq = function(this__2309__auto__) {
  return cljs.core.list.call(null, "cljs.core/PersistentTreeMap")
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__16684 = this;
  var h__2192__auto____16685 = this__16684.__hash;
  if(!(h__2192__auto____16685 == null)) {
    return h__2192__auto____16685
  }else {
    var h__2192__auto____16686 = cljs.core.hash_imap.call(null, coll);
    this__16684.__hash = h__2192__auto____16686;
    return h__2192__auto____16686
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__16687 = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(coll, k, null)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__16688 = this;
  var n__16689 = coll.entry_at(k);
  if(!(n__16689 == null)) {
    return n__16689.val
  }else {
    return not_found
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__16690 = this;
  var found__16691 = [null];
  var t__16692 = cljs.core.tree_map_add.call(null, this__16690.comp, this__16690.tree, k, v, found__16691);
  if(t__16692 == null) {
    var found_node__16693 = cljs.core.nth.call(null, found__16691, 0);
    if(cljs.core._EQ_.call(null, v, found_node__16693.val)) {
      return coll
    }else {
      return new cljs.core.PersistentTreeMap(this__16690.comp, cljs.core.tree_map_replace.call(null, this__16690.comp, this__16690.tree, k, v), this__16690.cnt, this__16690.meta, null)
    }
  }else {
    return new cljs.core.PersistentTreeMap(this__16690.comp, t__16692.blacken(), this__16690.cnt + 1, this__16690.meta, null)
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = function(coll, k) {
  var this__16694 = this;
  return!(coll.entry_at(k) == null)
};
cljs.core.PersistentTreeMap.prototype.call = function() {
  var G__16728 = null;
  var G__16728__2 = function(this_sym16695, k) {
    var this__16697 = this;
    var this_sym16695__16698 = this;
    var coll__16699 = this_sym16695__16698;
    return coll__16699.cljs$core$ILookup$_lookup$arity$2(coll__16699, k)
  };
  var G__16728__3 = function(this_sym16696, k, not_found) {
    var this__16697 = this;
    var this_sym16696__16700 = this;
    var coll__16701 = this_sym16696__16700;
    return coll__16701.cljs$core$ILookup$_lookup$arity$3(coll__16701, k, not_found)
  };
  G__16728 = function(this_sym16696, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__16728__2.call(this, this_sym16696, k);
      case 3:
        return G__16728__3.call(this, this_sym16696, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__16728
}();
cljs.core.PersistentTreeMap.prototype.apply = function(this_sym16682, args16683) {
  var this__16702 = this;
  return this_sym16682.call.apply(this_sym16682, [this_sym16682].concat(args16683.slice()))
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IKVReduce$_kv_reduce$arity$3 = function(coll, f, init) {
  var this__16703 = this;
  if(!(this__16703.tree == null)) {
    return cljs.core.tree_map_kv_reduce.call(null, this__16703.tree, f, init)
  }else {
    return init
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, entry) {
  var this__16704 = this;
  if(cljs.core.vector_QMARK_.call(null, entry)) {
    return coll.cljs$core$IAssociative$_assoc$arity$3(coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IReversible$_rseq$arity$1 = function(coll) {
  var this__16705 = this;
  if(this__16705.cnt > 0) {
    return cljs.core.create_tree_map_seq.call(null, this__16705.tree, false, this__16705.cnt)
  }else {
    return null
  }
};
cljs.core.PersistentTreeMap.prototype.toString = function() {
  var this__16706 = this;
  var this__16707 = this;
  return cljs.core.pr_str.call(null, this__16707)
};
cljs.core.PersistentTreeMap.prototype.entry_at = function(k) {
  var this__16708 = this;
  var coll__16709 = this;
  var t__16710 = this__16708.tree;
  while(true) {
    if(!(t__16710 == null)) {
      var c__16711 = this__16708.comp.call(null, k, t__16710.key);
      if(c__16711 === 0) {
        return t__16710
      }else {
        if(c__16711 < 0) {
          var G__16729 = t__16710.left;
          t__16710 = G__16729;
          continue
        }else {
          if("\ufdd0'else") {
            var G__16730 = t__16710.right;
            t__16710 = G__16730;
            continue
          }else {
            return null
          }
        }
      }
    }else {
      return null
    }
    break
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ISorted$_sorted_seq$arity$2 = function(coll, ascending_QMARK_) {
  var this__16712 = this;
  if(this__16712.cnt > 0) {
    return cljs.core.create_tree_map_seq.call(null, this__16712.tree, ascending_QMARK_, this__16712.cnt)
  }else {
    return null
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ISorted$_sorted_seq_from$arity$3 = function(coll, k, ascending_QMARK_) {
  var this__16713 = this;
  if(this__16713.cnt > 0) {
    var stack__16714 = null;
    var t__16715 = this__16713.tree;
    while(true) {
      if(!(t__16715 == null)) {
        var c__16716 = this__16713.comp.call(null, k, t__16715.key);
        if(c__16716 === 0) {
          return new cljs.core.PersistentTreeMapSeq(null, cljs.core.conj.call(null, stack__16714, t__16715), ascending_QMARK_, -1, null)
        }else {
          if(cljs.core.truth_(ascending_QMARK_)) {
            if(c__16716 < 0) {
              var G__16731 = cljs.core.conj.call(null, stack__16714, t__16715);
              var G__16732 = t__16715.left;
              stack__16714 = G__16731;
              t__16715 = G__16732;
              continue
            }else {
              var G__16733 = stack__16714;
              var G__16734 = t__16715.right;
              stack__16714 = G__16733;
              t__16715 = G__16734;
              continue
            }
          }else {
            if("\ufdd0'else") {
              if(c__16716 > 0) {
                var G__16735 = cljs.core.conj.call(null, stack__16714, t__16715);
                var G__16736 = t__16715.right;
                stack__16714 = G__16735;
                t__16715 = G__16736;
                continue
              }else {
                var G__16737 = stack__16714;
                var G__16738 = t__16715.left;
                stack__16714 = G__16737;
                t__16715 = G__16738;
                continue
              }
            }else {
              return null
            }
          }
        }
      }else {
        if(stack__16714 == null) {
          return new cljs.core.PersistentTreeMapSeq(null, stack__16714, ascending_QMARK_, -1, null)
        }else {
          return null
        }
      }
      break
    }
  }else {
    return null
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ISorted$_entry_key$arity$2 = function(coll, entry) {
  var this__16717 = this;
  return cljs.core.key.call(null, entry)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ISorted$_comparator$arity$1 = function(coll) {
  var this__16718 = this;
  return this__16718.comp
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__16719 = this;
  if(this__16719.cnt > 0) {
    return cljs.core.create_tree_map_seq.call(null, this__16719.tree, true, this__16719.cnt)
  }else {
    return null
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__16720 = this;
  return this__16720.cnt
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__16721 = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__16722 = this;
  return new cljs.core.PersistentTreeMap(this__16722.comp, this__16722.tree, this__16722.cnt, meta, this__16722.__hash)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__16723 = this;
  return this__16723.meta
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__16724 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentTreeMap.EMPTY, this__16724.meta)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IMap$_dissoc$arity$2 = function(coll, k) {
  var this__16725 = this;
  var found__16726 = [null];
  var t__16727 = cljs.core.tree_map_remove.call(null, this__16725.comp, this__16725.tree, k, found__16726);
  if(t__16727 == null) {
    if(cljs.core.nth.call(null, found__16726, 0) == null) {
      return coll
    }else {
      return new cljs.core.PersistentTreeMap(this__16725.comp, null, 0, this__16725.meta, null)
    }
  }else {
    return new cljs.core.PersistentTreeMap(this__16725.comp, t__16727.blacken(), this__16725.cnt - 1, this__16725.meta, null)
  }
};
cljs.core.PersistentTreeMap;
cljs.core.PersistentTreeMap.EMPTY = new cljs.core.PersistentTreeMap(cljs.core.compare, null, 0, null, 0);
cljs.core.hash_map = function() {
  var hash_map__delegate = function(keyvals) {
    var in__16741 = cljs.core.seq.call(null, keyvals);
    var out__16742 = cljs.core.transient$.call(null, cljs.core.PersistentHashMap.EMPTY);
    while(true) {
      if(in__16741) {
        var G__16743 = cljs.core.nnext.call(null, in__16741);
        var G__16744 = cljs.core.assoc_BANG_.call(null, out__16742, cljs.core.first.call(null, in__16741), cljs.core.second.call(null, in__16741));
        in__16741 = G__16743;
        out__16742 = G__16744;
        continue
      }else {
        return cljs.core.persistent_BANG_.call(null, out__16742)
      }
      break
    }
  };
  var hash_map = function(var_args) {
    var keyvals = null;
    if(goog.isDef(var_args)) {
      keyvals = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return hash_map__delegate.call(this, keyvals)
  };
  hash_map.cljs$lang$maxFixedArity = 0;
  hash_map.cljs$lang$applyTo = function(arglist__16745) {
    var keyvals = cljs.core.seq(arglist__16745);
    return hash_map__delegate(keyvals)
  };
  hash_map.cljs$lang$arity$variadic = hash_map__delegate;
  return hash_map
}();
cljs.core.array_map = function() {
  var array_map__delegate = function(keyvals) {
    return new cljs.core.PersistentArrayMap(null, cljs.core.quot.call(null, cljs.core.count.call(null, keyvals), 2), cljs.core.apply.call(null, cljs.core.array, keyvals), null)
  };
  var array_map = function(var_args) {
    var keyvals = null;
    if(goog.isDef(var_args)) {
      keyvals = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return array_map__delegate.call(this, keyvals)
  };
  array_map.cljs$lang$maxFixedArity = 0;
  array_map.cljs$lang$applyTo = function(arglist__16746) {
    var keyvals = cljs.core.seq(arglist__16746);
    return array_map__delegate(keyvals)
  };
  array_map.cljs$lang$arity$variadic = array_map__delegate;
  return array_map
}();
cljs.core.obj_map = function() {
  var obj_map__delegate = function(keyvals) {
    var ks__16750 = [];
    var obj__16751 = {};
    var kvs__16752 = cljs.core.seq.call(null, keyvals);
    while(true) {
      if(kvs__16752) {
        ks__16750.push(cljs.core.first.call(null, kvs__16752));
        obj__16751[cljs.core.first.call(null, kvs__16752)] = cljs.core.second.call(null, kvs__16752);
        var G__16753 = cljs.core.nnext.call(null, kvs__16752);
        kvs__16752 = G__16753;
        continue
      }else {
        return cljs.core.ObjMap.fromObject.call(null, ks__16750, obj__16751)
      }
      break
    }
  };
  var obj_map = function(var_args) {
    var keyvals = null;
    if(goog.isDef(var_args)) {
      keyvals = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return obj_map__delegate.call(this, keyvals)
  };
  obj_map.cljs$lang$maxFixedArity = 0;
  obj_map.cljs$lang$applyTo = function(arglist__16754) {
    var keyvals = cljs.core.seq(arglist__16754);
    return obj_map__delegate(keyvals)
  };
  obj_map.cljs$lang$arity$variadic = obj_map__delegate;
  return obj_map
}();
cljs.core.sorted_map = function() {
  var sorted_map__delegate = function(keyvals) {
    var in__16757 = cljs.core.seq.call(null, keyvals);
    var out__16758 = cljs.core.PersistentTreeMap.EMPTY;
    while(true) {
      if(in__16757) {
        var G__16759 = cljs.core.nnext.call(null, in__16757);
        var G__16760 = cljs.core.assoc.call(null, out__16758, cljs.core.first.call(null, in__16757), cljs.core.second.call(null, in__16757));
        in__16757 = G__16759;
        out__16758 = G__16760;
        continue
      }else {
        return out__16758
      }
      break
    }
  };
  var sorted_map = function(var_args) {
    var keyvals = null;
    if(goog.isDef(var_args)) {
      keyvals = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return sorted_map__delegate.call(this, keyvals)
  };
  sorted_map.cljs$lang$maxFixedArity = 0;
  sorted_map.cljs$lang$applyTo = function(arglist__16761) {
    var keyvals = cljs.core.seq(arglist__16761);
    return sorted_map__delegate(keyvals)
  };
  sorted_map.cljs$lang$arity$variadic = sorted_map__delegate;
  return sorted_map
}();
cljs.core.sorted_map_by = function() {
  var sorted_map_by__delegate = function(comparator, keyvals) {
    var in__16764 = cljs.core.seq.call(null, keyvals);
    var out__16765 = new cljs.core.PersistentTreeMap(comparator, null, 0, null, 0);
    while(true) {
      if(in__16764) {
        var G__16766 = cljs.core.nnext.call(null, in__16764);
        var G__16767 = cljs.core.assoc.call(null, out__16765, cljs.core.first.call(null, in__16764), cljs.core.second.call(null, in__16764));
        in__16764 = G__16766;
        out__16765 = G__16767;
        continue
      }else {
        return out__16765
      }
      break
    }
  };
  var sorted_map_by = function(comparator, var_args) {
    var keyvals = null;
    if(goog.isDef(var_args)) {
      keyvals = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return sorted_map_by__delegate.call(this, comparator, keyvals)
  };
  sorted_map_by.cljs$lang$maxFixedArity = 1;
  sorted_map_by.cljs$lang$applyTo = function(arglist__16768) {
    var comparator = cljs.core.first(arglist__16768);
    var keyvals = cljs.core.rest(arglist__16768);
    return sorted_map_by__delegate(comparator, keyvals)
  };
  sorted_map_by.cljs$lang$arity$variadic = sorted_map_by__delegate;
  return sorted_map_by
}();
cljs.core.keys = function keys(hash_map) {
  return cljs.core.seq.call(null, cljs.core.map.call(null, cljs.core.first, hash_map))
};
cljs.core.key = function key(map_entry) {
  return cljs.core._key.call(null, map_entry)
};
cljs.core.vals = function vals(hash_map) {
  return cljs.core.seq.call(null, cljs.core.map.call(null, cljs.core.second, hash_map))
};
cljs.core.val = function val(map_entry) {
  return cljs.core._val.call(null, map_entry)
};
cljs.core.merge = function() {
  var merge__delegate = function(maps) {
    if(cljs.core.truth_(cljs.core.some.call(null, cljs.core.identity, maps))) {
      return cljs.core.reduce.call(null, function(p1__16769_SHARP_, p2__16770_SHARP_) {
        return cljs.core.conj.call(null, function() {
          var or__3824__auto____16772 = p1__16769_SHARP_;
          if(cljs.core.truth_(or__3824__auto____16772)) {
            return or__3824__auto____16772
          }else {
            return cljs.core.ObjMap.EMPTY
          }
        }(), p2__16770_SHARP_)
      }, maps)
    }else {
      return null
    }
  };
  var merge = function(var_args) {
    var maps = null;
    if(goog.isDef(var_args)) {
      maps = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return merge__delegate.call(this, maps)
  };
  merge.cljs$lang$maxFixedArity = 0;
  merge.cljs$lang$applyTo = function(arglist__16773) {
    var maps = cljs.core.seq(arglist__16773);
    return merge__delegate(maps)
  };
  merge.cljs$lang$arity$variadic = merge__delegate;
  return merge
}();
cljs.core.merge_with = function() {
  var merge_with__delegate = function(f, maps) {
    if(cljs.core.truth_(cljs.core.some.call(null, cljs.core.identity, maps))) {
      var merge_entry__16781 = function(m, e) {
        var k__16779 = cljs.core.first.call(null, e);
        var v__16780 = cljs.core.second.call(null, e);
        if(cljs.core.contains_QMARK_.call(null, m, k__16779)) {
          return cljs.core.assoc.call(null, m, k__16779, f.call(null, cljs.core._lookup.call(null, m, k__16779, null), v__16780))
        }else {
          return cljs.core.assoc.call(null, m, k__16779, v__16780)
        }
      };
      var merge2__16783 = function(m1, m2) {
        return cljs.core.reduce.call(null, merge_entry__16781, function() {
          var or__3824__auto____16782 = m1;
          if(cljs.core.truth_(or__3824__auto____16782)) {
            return or__3824__auto____16782
          }else {
            return cljs.core.ObjMap.EMPTY
          }
        }(), cljs.core.seq.call(null, m2))
      };
      return cljs.core.reduce.call(null, merge2__16783, maps)
    }else {
      return null
    }
  };
  var merge_with = function(f, var_args) {
    var maps = null;
    if(goog.isDef(var_args)) {
      maps = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return merge_with__delegate.call(this, f, maps)
  };
  merge_with.cljs$lang$maxFixedArity = 1;
  merge_with.cljs$lang$applyTo = function(arglist__16784) {
    var f = cljs.core.first(arglist__16784);
    var maps = cljs.core.rest(arglist__16784);
    return merge_with__delegate(f, maps)
  };
  merge_with.cljs$lang$arity$variadic = merge_with__delegate;
  return merge_with
}();
cljs.core.select_keys = function select_keys(map, keyseq) {
  var ret__16789 = cljs.core.ObjMap.EMPTY;
  var keys__16790 = cljs.core.seq.call(null, keyseq);
  while(true) {
    if(keys__16790) {
      var key__16791 = cljs.core.first.call(null, keys__16790);
      var entry__16792 = cljs.core._lookup.call(null, map, key__16791, "\ufdd0'cljs.core/not-found");
      var G__16793 = cljs.core.not_EQ_.call(null, entry__16792, "\ufdd0'cljs.core/not-found") ? cljs.core.assoc.call(null, ret__16789, key__16791, entry__16792) : ret__16789;
      var G__16794 = cljs.core.next.call(null, keys__16790);
      ret__16789 = G__16793;
      keys__16790 = G__16794;
      continue
    }else {
      return ret__16789
    }
    break
  }
};
cljs.core.PersistentHashSet = function(meta, hash_map, __hash) {
  this.meta = meta;
  this.hash_map = hash_map;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 1;
  this.cljs$lang$protocol_mask$partition0$ = 15077647
};
cljs.core.PersistentHashSet.cljs$lang$type = true;
cljs.core.PersistentHashSet.cljs$lang$ctorPrSeq = function(this__2309__auto__) {
  return cljs.core.list.call(null, "cljs.core/PersistentHashSet")
};
cljs.core.PersistentHashSet.prototype.cljs$core$IEditableCollection$_as_transient$arity$1 = function(coll) {
  var this__16798 = this;
  return new cljs.core.TransientHashSet(cljs.core.transient$.call(null, this__16798.hash_map))
};
cljs.core.PersistentHashSet.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__16799 = this;
  var h__2192__auto____16800 = this__16799.__hash;
  if(!(h__2192__auto____16800 == null)) {
    return h__2192__auto____16800
  }else {
    var h__2192__auto____16801 = cljs.core.hash_iset.call(null, coll);
    this__16799.__hash = h__2192__auto____16801;
    return h__2192__auto____16801
  }
};
cljs.core.PersistentHashSet.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, v) {
  var this__16802 = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(coll, v, null)
};
cljs.core.PersistentHashSet.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, v, not_found) {
  var this__16803 = this;
  if(cljs.core.truth_(cljs.core._contains_key_QMARK_.call(null, this__16803.hash_map, v))) {
    return v
  }else {
    return not_found
  }
};
cljs.core.PersistentHashSet.prototype.call = function() {
  var G__16824 = null;
  var G__16824__2 = function(this_sym16804, k) {
    var this__16806 = this;
    var this_sym16804__16807 = this;
    var coll__16808 = this_sym16804__16807;
    return coll__16808.cljs$core$ILookup$_lookup$arity$2(coll__16808, k)
  };
  var G__16824__3 = function(this_sym16805, k, not_found) {
    var this__16806 = this;
    var this_sym16805__16809 = this;
    var coll__16810 = this_sym16805__16809;
    return coll__16810.cljs$core$ILookup$_lookup$arity$3(coll__16810, k, not_found)
  };
  G__16824 = function(this_sym16805, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__16824__2.call(this, this_sym16805, k);
      case 3:
        return G__16824__3.call(this, this_sym16805, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__16824
}();
cljs.core.PersistentHashSet.prototype.apply = function(this_sym16796, args16797) {
  var this__16811 = this;
  return this_sym16796.call.apply(this_sym16796, [this_sym16796].concat(args16797.slice()))
};
cljs.core.PersistentHashSet.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__16812 = this;
  return new cljs.core.PersistentHashSet(this__16812.meta, cljs.core.assoc.call(null, this__16812.hash_map, o, null), null)
};
cljs.core.PersistentHashSet.prototype.toString = function() {
  var this__16813 = this;
  var this__16814 = this;
  return cljs.core.pr_str.call(null, this__16814)
};
cljs.core.PersistentHashSet.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__16815 = this;
  return cljs.core.keys.call(null, this__16815.hash_map)
};
cljs.core.PersistentHashSet.prototype.cljs$core$ISet$_disjoin$arity$2 = function(coll, v) {
  var this__16816 = this;
  return new cljs.core.PersistentHashSet(this__16816.meta, cljs.core.dissoc.call(null, this__16816.hash_map, v), null)
};
cljs.core.PersistentHashSet.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__16817 = this;
  return cljs.core.count.call(null, cljs.core.seq.call(null, coll))
};
cljs.core.PersistentHashSet.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__16818 = this;
  var and__3822__auto____16819 = cljs.core.set_QMARK_.call(null, other);
  if(and__3822__auto____16819) {
    var and__3822__auto____16820 = cljs.core.count.call(null, coll) === cljs.core.count.call(null, other);
    if(and__3822__auto____16820) {
      return cljs.core.every_QMARK_.call(null, function(p1__16795_SHARP_) {
        return cljs.core.contains_QMARK_.call(null, coll, p1__16795_SHARP_)
      }, other)
    }else {
      return and__3822__auto____16820
    }
  }else {
    return and__3822__auto____16819
  }
};
cljs.core.PersistentHashSet.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__16821 = this;
  return new cljs.core.PersistentHashSet(meta, this__16821.hash_map, this__16821.__hash)
};
cljs.core.PersistentHashSet.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__16822 = this;
  return this__16822.meta
};
cljs.core.PersistentHashSet.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__16823 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentHashSet.EMPTY, this__16823.meta)
};
cljs.core.PersistentHashSet;
cljs.core.PersistentHashSet.EMPTY = new cljs.core.PersistentHashSet(null, cljs.core.hash_map.call(null), 0);
cljs.core.PersistentHashSet.fromArray = function(items) {
  var len__16825 = cljs.core.count.call(null, items);
  var i__16826 = 0;
  var out__16827 = cljs.core.transient$.call(null, cljs.core.PersistentHashSet.EMPTY);
  while(true) {
    if(i__16826 < len__16825) {
      var G__16828 = i__16826 + 1;
      var G__16829 = cljs.core.conj_BANG_.call(null, out__16827, items[i__16826]);
      i__16826 = G__16828;
      out__16827 = G__16829;
      continue
    }else {
      return cljs.core.persistent_BANG_.call(null, out__16827)
    }
    break
  }
};
cljs.core.TransientHashSet = function(transient_map) {
  this.transient_map = transient_map;
  this.cljs$lang$protocol_mask$partition0$ = 259;
  this.cljs$lang$protocol_mask$partition1$ = 34
};
cljs.core.TransientHashSet.cljs$lang$type = true;
cljs.core.TransientHashSet.cljs$lang$ctorPrSeq = function(this__2309__auto__) {
  return cljs.core.list.call(null, "cljs.core/TransientHashSet")
};
cljs.core.TransientHashSet.prototype.call = function() {
  var G__16847 = null;
  var G__16847__2 = function(this_sym16833, k) {
    var this__16835 = this;
    var this_sym16833__16836 = this;
    var tcoll__16837 = this_sym16833__16836;
    if(cljs.core._lookup.call(null, this__16835.transient_map, k, cljs.core.lookup_sentinel) === cljs.core.lookup_sentinel) {
      return null
    }else {
      return k
    }
  };
  var G__16847__3 = function(this_sym16834, k, not_found) {
    var this__16835 = this;
    var this_sym16834__16838 = this;
    var tcoll__16839 = this_sym16834__16838;
    if(cljs.core._lookup.call(null, this__16835.transient_map, k, cljs.core.lookup_sentinel) === cljs.core.lookup_sentinel) {
      return not_found
    }else {
      return k
    }
  };
  G__16847 = function(this_sym16834, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__16847__2.call(this, this_sym16834, k);
      case 3:
        return G__16847__3.call(this, this_sym16834, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__16847
}();
cljs.core.TransientHashSet.prototype.apply = function(this_sym16831, args16832) {
  var this__16840 = this;
  return this_sym16831.call.apply(this_sym16831, [this_sym16831].concat(args16832.slice()))
};
cljs.core.TransientHashSet.prototype.cljs$core$ILookup$_lookup$arity$2 = function(tcoll, v) {
  var this__16841 = this;
  return tcoll.cljs$core$ILookup$_lookup$arity$3(tcoll, v, null)
};
cljs.core.TransientHashSet.prototype.cljs$core$ILookup$_lookup$arity$3 = function(tcoll, v, not_found) {
  var this__16842 = this;
  if(cljs.core._lookup.call(null, this__16842.transient_map, v, cljs.core.lookup_sentinel) === cljs.core.lookup_sentinel) {
    return not_found
  }else {
    return v
  }
};
cljs.core.TransientHashSet.prototype.cljs$core$ICounted$_count$arity$1 = function(tcoll) {
  var this__16843 = this;
  return cljs.core.count.call(null, this__16843.transient_map)
};
cljs.core.TransientHashSet.prototype.cljs$core$ITransientSet$_disjoin_BANG_$arity$2 = function(tcoll, v) {
  var this__16844 = this;
  this__16844.transient_map = cljs.core.dissoc_BANG_.call(null, this__16844.transient_map, v);
  return tcoll
};
cljs.core.TransientHashSet.prototype.cljs$core$ITransientCollection$_conj_BANG_$arity$2 = function(tcoll, o) {
  var this__16845 = this;
  this__16845.transient_map = cljs.core.assoc_BANG_.call(null, this__16845.transient_map, o, null);
  return tcoll
};
cljs.core.TransientHashSet.prototype.cljs$core$ITransientCollection$_persistent_BANG_$arity$1 = function(tcoll) {
  var this__16846 = this;
  return new cljs.core.PersistentHashSet(null, cljs.core.persistent_BANG_.call(null, this__16846.transient_map), null)
};
cljs.core.TransientHashSet;
cljs.core.PersistentTreeSet = function(meta, tree_map, __hash) {
  this.meta = meta;
  this.tree_map = tree_map;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 417730831
};
cljs.core.PersistentTreeSet.cljs$lang$type = true;
cljs.core.PersistentTreeSet.cljs$lang$ctorPrSeq = function(this__2309__auto__) {
  return cljs.core.list.call(null, "cljs.core/PersistentTreeSet")
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__16850 = this;
  var h__2192__auto____16851 = this__16850.__hash;
  if(!(h__2192__auto____16851 == null)) {
    return h__2192__auto____16851
  }else {
    var h__2192__auto____16852 = cljs.core.hash_iset.call(null, coll);
    this__16850.__hash = h__2192__auto____16852;
    return h__2192__auto____16852
  }
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, v) {
  var this__16853 = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(coll, v, null)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, v, not_found) {
  var this__16854 = this;
  if(cljs.core.truth_(cljs.core._contains_key_QMARK_.call(null, this__16854.tree_map, v))) {
    return v
  }else {
    return not_found
  }
};
cljs.core.PersistentTreeSet.prototype.call = function() {
  var G__16880 = null;
  var G__16880__2 = function(this_sym16855, k) {
    var this__16857 = this;
    var this_sym16855__16858 = this;
    var coll__16859 = this_sym16855__16858;
    return coll__16859.cljs$core$ILookup$_lookup$arity$2(coll__16859, k)
  };
  var G__16880__3 = function(this_sym16856, k, not_found) {
    var this__16857 = this;
    var this_sym16856__16860 = this;
    var coll__16861 = this_sym16856__16860;
    return coll__16861.cljs$core$ILookup$_lookup$arity$3(coll__16861, k, not_found)
  };
  G__16880 = function(this_sym16856, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__16880__2.call(this, this_sym16856, k);
      case 3:
        return G__16880__3.call(this, this_sym16856, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__16880
}();
cljs.core.PersistentTreeSet.prototype.apply = function(this_sym16848, args16849) {
  var this__16862 = this;
  return this_sym16848.call.apply(this_sym16848, [this_sym16848].concat(args16849.slice()))
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__16863 = this;
  return new cljs.core.PersistentTreeSet(this__16863.meta, cljs.core.assoc.call(null, this__16863.tree_map, o, null), null)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IReversible$_rseq$arity$1 = function(coll) {
  var this__16864 = this;
  return cljs.core.map.call(null, cljs.core.key, cljs.core.rseq.call(null, this__16864.tree_map))
};
cljs.core.PersistentTreeSet.prototype.toString = function() {
  var this__16865 = this;
  var this__16866 = this;
  return cljs.core.pr_str.call(null, this__16866)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISorted$_sorted_seq$arity$2 = function(coll, ascending_QMARK_) {
  var this__16867 = this;
  return cljs.core.map.call(null, cljs.core.key, cljs.core._sorted_seq.call(null, this__16867.tree_map, ascending_QMARK_))
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISorted$_sorted_seq_from$arity$3 = function(coll, k, ascending_QMARK_) {
  var this__16868 = this;
  return cljs.core.map.call(null, cljs.core.key, cljs.core._sorted_seq_from.call(null, this__16868.tree_map, k, ascending_QMARK_))
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISorted$_entry_key$arity$2 = function(coll, entry) {
  var this__16869 = this;
  return entry
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISorted$_comparator$arity$1 = function(coll) {
  var this__16870 = this;
  return cljs.core._comparator.call(null, this__16870.tree_map)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__16871 = this;
  return cljs.core.keys.call(null, this__16871.tree_map)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISet$_disjoin$arity$2 = function(coll, v) {
  var this__16872 = this;
  return new cljs.core.PersistentTreeSet(this__16872.meta, cljs.core.dissoc.call(null, this__16872.tree_map, v), null)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__16873 = this;
  return cljs.core.count.call(null, this__16873.tree_map)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__16874 = this;
  var and__3822__auto____16875 = cljs.core.set_QMARK_.call(null, other);
  if(and__3822__auto____16875) {
    var and__3822__auto____16876 = cljs.core.count.call(null, coll) === cljs.core.count.call(null, other);
    if(and__3822__auto____16876) {
      return cljs.core.every_QMARK_.call(null, function(p1__16830_SHARP_) {
        return cljs.core.contains_QMARK_.call(null, coll, p1__16830_SHARP_)
      }, other)
    }else {
      return and__3822__auto____16876
    }
  }else {
    return and__3822__auto____16875
  }
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__16877 = this;
  return new cljs.core.PersistentTreeSet(meta, this__16877.tree_map, this__16877.__hash)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__16878 = this;
  return this__16878.meta
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__16879 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentTreeSet.EMPTY, this__16879.meta)
};
cljs.core.PersistentTreeSet;
cljs.core.PersistentTreeSet.EMPTY = new cljs.core.PersistentTreeSet(null, cljs.core.sorted_map.call(null), 0);
cljs.core.hash_set = function() {
  var hash_set = null;
  var hash_set__0 = function() {
    return cljs.core.PersistentHashSet.EMPTY
  };
  var hash_set__1 = function() {
    var G__16885__delegate = function(keys) {
      var in__16883 = cljs.core.seq.call(null, keys);
      var out__16884 = cljs.core.transient$.call(null, cljs.core.PersistentHashSet.EMPTY);
      while(true) {
        if(cljs.core.seq.call(null, in__16883)) {
          var G__16886 = cljs.core.next.call(null, in__16883);
          var G__16887 = cljs.core.conj_BANG_.call(null, out__16884, cljs.core.first.call(null, in__16883));
          in__16883 = G__16886;
          out__16884 = G__16887;
          continue
        }else {
          return cljs.core.persistent_BANG_.call(null, out__16884)
        }
        break
      }
    };
    var G__16885 = function(var_args) {
      var keys = null;
      if(goog.isDef(var_args)) {
        keys = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
      }
      return G__16885__delegate.call(this, keys)
    };
    G__16885.cljs$lang$maxFixedArity = 0;
    G__16885.cljs$lang$applyTo = function(arglist__16888) {
      var keys = cljs.core.seq(arglist__16888);
      return G__16885__delegate(keys)
    };
    G__16885.cljs$lang$arity$variadic = G__16885__delegate;
    return G__16885
  }();
  hash_set = function(var_args) {
    var keys = var_args;
    switch(arguments.length) {
      case 0:
        return hash_set__0.call(this);
      default:
        return hash_set__1.cljs$lang$arity$variadic(cljs.core.array_seq(arguments, 0))
    }
    throw"Invalid arity: " + arguments.length;
  };
  hash_set.cljs$lang$maxFixedArity = 0;
  hash_set.cljs$lang$applyTo = hash_set__1.cljs$lang$applyTo;
  hash_set.cljs$lang$arity$0 = hash_set__0;
  hash_set.cljs$lang$arity$variadic = hash_set__1.cljs$lang$arity$variadic;
  return hash_set
}();
cljs.core.set = function set(coll) {
  return cljs.core.apply.call(null, cljs.core.hash_set, coll)
};
cljs.core.sorted_set = function() {
  var sorted_set__delegate = function(keys) {
    return cljs.core.reduce.call(null, cljs.core._conj, cljs.core.PersistentTreeSet.EMPTY, keys)
  };
  var sorted_set = function(var_args) {
    var keys = null;
    if(goog.isDef(var_args)) {
      keys = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return sorted_set__delegate.call(this, keys)
  };
  sorted_set.cljs$lang$maxFixedArity = 0;
  sorted_set.cljs$lang$applyTo = function(arglist__16889) {
    var keys = cljs.core.seq(arglist__16889);
    return sorted_set__delegate(keys)
  };
  sorted_set.cljs$lang$arity$variadic = sorted_set__delegate;
  return sorted_set
}();
cljs.core.sorted_set_by = function() {
  var sorted_set_by__delegate = function(comparator, keys) {
    return cljs.core.reduce.call(null, cljs.core._conj, new cljs.core.PersistentTreeSet(null, cljs.core.sorted_map_by.call(null, comparator), 0), keys)
  };
  var sorted_set_by = function(comparator, var_args) {
    var keys = null;
    if(goog.isDef(var_args)) {
      keys = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return sorted_set_by__delegate.call(this, comparator, keys)
  };
  sorted_set_by.cljs$lang$maxFixedArity = 1;
  sorted_set_by.cljs$lang$applyTo = function(arglist__16891) {
    var comparator = cljs.core.first(arglist__16891);
    var keys = cljs.core.rest(arglist__16891);
    return sorted_set_by__delegate(comparator, keys)
  };
  sorted_set_by.cljs$lang$arity$variadic = sorted_set_by__delegate;
  return sorted_set_by
}();
cljs.core.replace = function replace(smap, coll) {
  if(cljs.core.vector_QMARK_.call(null, coll)) {
    var n__16897 = cljs.core.count.call(null, coll);
    return cljs.core.reduce.call(null, function(v, i) {
      var temp__3971__auto____16898 = cljs.core.find.call(null, smap, cljs.core.nth.call(null, v, i));
      if(cljs.core.truth_(temp__3971__auto____16898)) {
        var e__16899 = temp__3971__auto____16898;
        return cljs.core.assoc.call(null, v, i, cljs.core.second.call(null, e__16899))
      }else {
        return v
      }
    }, coll, cljs.core.take.call(null, n__16897, cljs.core.iterate.call(null, cljs.core.inc, 0)))
  }else {
    return cljs.core.map.call(null, function(p1__16890_SHARP_) {
      var temp__3971__auto____16900 = cljs.core.find.call(null, smap, p1__16890_SHARP_);
      if(cljs.core.truth_(temp__3971__auto____16900)) {
        var e__16901 = temp__3971__auto____16900;
        return cljs.core.second.call(null, e__16901)
      }else {
        return p1__16890_SHARP_
      }
    }, coll)
  }
};
cljs.core.distinct = function distinct(coll) {
  var step__16931 = function step(xs, seen) {
    return new cljs.core.LazySeq(null, false, function() {
      return function(p__16924, seen) {
        while(true) {
          var vec__16925__16926 = p__16924;
          var f__16927 = cljs.core.nth.call(null, vec__16925__16926, 0, null);
          var xs__16928 = vec__16925__16926;
          var temp__3974__auto____16929 = cljs.core.seq.call(null, xs__16928);
          if(temp__3974__auto____16929) {
            var s__16930 = temp__3974__auto____16929;
            if(cljs.core.contains_QMARK_.call(null, seen, f__16927)) {
              var G__16932 = cljs.core.rest.call(null, s__16930);
              var G__16933 = seen;
              p__16924 = G__16932;
              seen = G__16933;
              continue
            }else {
              return cljs.core.cons.call(null, f__16927, step.call(null, cljs.core.rest.call(null, s__16930), cljs.core.conj.call(null, seen, f__16927)))
            }
          }else {
            return null
          }
          break
        }
      }.call(null, xs, seen)
    }, null)
  };
  return step__16931.call(null, coll, cljs.core.PersistentHashSet.EMPTY)
};
cljs.core.butlast = function butlast(s) {
  var ret__16936 = cljs.core.PersistentVector.EMPTY;
  var s__16937 = s;
  while(true) {
    if(cljs.core.next.call(null, s__16937)) {
      var G__16938 = cljs.core.conj.call(null, ret__16936, cljs.core.first.call(null, s__16937));
      var G__16939 = cljs.core.next.call(null, s__16937);
      ret__16936 = G__16938;
      s__16937 = G__16939;
      continue
    }else {
      return cljs.core.seq.call(null, ret__16936)
    }
    break
  }
};
cljs.core.name = function name(x) {
  if(cljs.core.string_QMARK_.call(null, x)) {
    return x
  }else {
    if(function() {
      var or__3824__auto____16942 = cljs.core.keyword_QMARK_.call(null, x);
      if(or__3824__auto____16942) {
        return or__3824__auto____16942
      }else {
        return cljs.core.symbol_QMARK_.call(null, x)
      }
    }()) {
      var i__16943 = x.lastIndexOf("/");
      if(i__16943 < 0) {
        return cljs.core.subs.call(null, x, 2)
      }else {
        return cljs.core.subs.call(null, x, i__16943 + 1)
      }
    }else {
      if("\ufdd0'else") {
        throw new Error([cljs.core.str("Doesn't support name: "), cljs.core.str(x)].join(""));
      }else {
        return null
      }
    }
  }
};
cljs.core.namespace = function namespace(x) {
  if(function() {
    var or__3824__auto____16946 = cljs.core.keyword_QMARK_.call(null, x);
    if(or__3824__auto____16946) {
      return or__3824__auto____16946
    }else {
      return cljs.core.symbol_QMARK_.call(null, x)
    }
  }()) {
    var i__16947 = x.lastIndexOf("/");
    if(i__16947 > -1) {
      return cljs.core.subs.call(null, x, 2, i__16947)
    }else {
      return null
    }
  }else {
    throw new Error([cljs.core.str("Doesn't support namespace: "), cljs.core.str(x)].join(""));
  }
};
cljs.core.zipmap = function zipmap(keys, vals) {
  var map__16954 = cljs.core.ObjMap.EMPTY;
  var ks__16955 = cljs.core.seq.call(null, keys);
  var vs__16956 = cljs.core.seq.call(null, vals);
  while(true) {
    if(function() {
      var and__3822__auto____16957 = ks__16955;
      if(and__3822__auto____16957) {
        return vs__16956
      }else {
        return and__3822__auto____16957
      }
    }()) {
      var G__16958 = cljs.core.assoc.call(null, map__16954, cljs.core.first.call(null, ks__16955), cljs.core.first.call(null, vs__16956));
      var G__16959 = cljs.core.next.call(null, ks__16955);
      var G__16960 = cljs.core.next.call(null, vs__16956);
      map__16954 = G__16958;
      ks__16955 = G__16959;
      vs__16956 = G__16960;
      continue
    }else {
      return map__16954
    }
    break
  }
};
cljs.core.max_key = function() {
  var max_key = null;
  var max_key__2 = function(k, x) {
    return x
  };
  var max_key__3 = function(k, x, y) {
    if(k.call(null, x) > k.call(null, y)) {
      return x
    }else {
      return y
    }
  };
  var max_key__4 = function() {
    var G__16963__delegate = function(k, x, y, more) {
      return cljs.core.reduce.call(null, function(p1__16948_SHARP_, p2__16949_SHARP_) {
        return max_key.call(null, k, p1__16948_SHARP_, p2__16949_SHARP_)
      }, max_key.call(null, k, x, y), more)
    };
    var G__16963 = function(k, x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__16963__delegate.call(this, k, x, y, more)
    };
    G__16963.cljs$lang$maxFixedArity = 3;
    G__16963.cljs$lang$applyTo = function(arglist__16964) {
      var k = cljs.core.first(arglist__16964);
      var x = cljs.core.first(cljs.core.next(arglist__16964));
      var y = cljs.core.first(cljs.core.next(cljs.core.next(arglist__16964)));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__16964)));
      return G__16963__delegate(k, x, y, more)
    };
    G__16963.cljs$lang$arity$variadic = G__16963__delegate;
    return G__16963
  }();
  max_key = function(k, x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 2:
        return max_key__2.call(this, k, x);
      case 3:
        return max_key__3.call(this, k, x, y);
      default:
        return max_key__4.cljs$lang$arity$variadic(k, x, y, cljs.core.array_seq(arguments, 3))
    }
    throw"Invalid arity: " + arguments.length;
  };
  max_key.cljs$lang$maxFixedArity = 3;
  max_key.cljs$lang$applyTo = max_key__4.cljs$lang$applyTo;
  max_key.cljs$lang$arity$2 = max_key__2;
  max_key.cljs$lang$arity$3 = max_key__3;
  max_key.cljs$lang$arity$variadic = max_key__4.cljs$lang$arity$variadic;
  return max_key
}();
cljs.core.min_key = function() {
  var min_key = null;
  var min_key__2 = function(k, x) {
    return x
  };
  var min_key__3 = function(k, x, y) {
    if(k.call(null, x) < k.call(null, y)) {
      return x
    }else {
      return y
    }
  };
  var min_key__4 = function() {
    var G__16965__delegate = function(k, x, y, more) {
      return cljs.core.reduce.call(null, function(p1__16961_SHARP_, p2__16962_SHARP_) {
        return min_key.call(null, k, p1__16961_SHARP_, p2__16962_SHARP_)
      }, min_key.call(null, k, x, y), more)
    };
    var G__16965 = function(k, x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__16965__delegate.call(this, k, x, y, more)
    };
    G__16965.cljs$lang$maxFixedArity = 3;
    G__16965.cljs$lang$applyTo = function(arglist__16966) {
      var k = cljs.core.first(arglist__16966);
      var x = cljs.core.first(cljs.core.next(arglist__16966));
      var y = cljs.core.first(cljs.core.next(cljs.core.next(arglist__16966)));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__16966)));
      return G__16965__delegate(k, x, y, more)
    };
    G__16965.cljs$lang$arity$variadic = G__16965__delegate;
    return G__16965
  }();
  min_key = function(k, x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 2:
        return min_key__2.call(this, k, x);
      case 3:
        return min_key__3.call(this, k, x, y);
      default:
        return min_key__4.cljs$lang$arity$variadic(k, x, y, cljs.core.array_seq(arguments, 3))
    }
    throw"Invalid arity: " + arguments.length;
  };
  min_key.cljs$lang$maxFixedArity = 3;
  min_key.cljs$lang$applyTo = min_key__4.cljs$lang$applyTo;
  min_key.cljs$lang$arity$2 = min_key__2;
  min_key.cljs$lang$arity$3 = min_key__3;
  min_key.cljs$lang$arity$variadic = min_key__4.cljs$lang$arity$variadic;
  return min_key
}();
cljs.core.partition_all = function() {
  var partition_all = null;
  var partition_all__2 = function(n, coll) {
    return partition_all.call(null, n, n, coll)
  };
  var partition_all__3 = function(n, step, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3974__auto____16969 = cljs.core.seq.call(null, coll);
      if(temp__3974__auto____16969) {
        var s__16970 = temp__3974__auto____16969;
        return cljs.core.cons.call(null, cljs.core.take.call(null, n, s__16970), partition_all.call(null, n, step, cljs.core.drop.call(null, step, s__16970)))
      }else {
        return null
      }
    }, null)
  };
  partition_all = function(n, step, coll) {
    switch(arguments.length) {
      case 2:
        return partition_all__2.call(this, n, step);
      case 3:
        return partition_all__3.call(this, n, step, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  partition_all.cljs$lang$arity$2 = partition_all__2;
  partition_all.cljs$lang$arity$3 = partition_all__3;
  return partition_all
}();
cljs.core.take_while = function take_while(pred, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__3974__auto____16973 = cljs.core.seq.call(null, coll);
    if(temp__3974__auto____16973) {
      var s__16974 = temp__3974__auto____16973;
      if(cljs.core.truth_(pred.call(null, cljs.core.first.call(null, s__16974)))) {
        return cljs.core.cons.call(null, cljs.core.first.call(null, s__16974), take_while.call(null, pred, cljs.core.rest.call(null, s__16974)))
      }else {
        return null
      }
    }else {
      return null
    }
  }, null)
};
cljs.core.mk_bound_fn = function mk_bound_fn(sc, test, key) {
  return function(e) {
    var comp__16976 = cljs.core._comparator.call(null, sc);
    return test.call(null, comp__16976.call(null, cljs.core._entry_key.call(null, sc, e), key), 0)
  }
};
cljs.core.subseq = function() {
  var subseq = null;
  var subseq__3 = function(sc, test, key) {
    var include__16988 = cljs.core.mk_bound_fn.call(null, sc, test, key);
    if(cljs.core.truth_(cljs.core.PersistentHashSet.fromArray([cljs.core._GT_, cljs.core._GT__EQ_]).call(null, test))) {
      var temp__3974__auto____16989 = cljs.core._sorted_seq_from.call(null, sc, key, true);
      if(cljs.core.truth_(temp__3974__auto____16989)) {
        var vec__16990__16991 = temp__3974__auto____16989;
        var e__16992 = cljs.core.nth.call(null, vec__16990__16991, 0, null);
        var s__16993 = vec__16990__16991;
        if(cljs.core.truth_(include__16988.call(null, e__16992))) {
          return s__16993
        }else {
          return cljs.core.next.call(null, s__16993)
        }
      }else {
        return null
      }
    }else {
      return cljs.core.take_while.call(null, include__16988, cljs.core._sorted_seq.call(null, sc, true))
    }
  };
  var subseq__5 = function(sc, start_test, start_key, end_test, end_key) {
    var temp__3974__auto____16994 = cljs.core._sorted_seq_from.call(null, sc, start_key, true);
    if(cljs.core.truth_(temp__3974__auto____16994)) {
      var vec__16995__16996 = temp__3974__auto____16994;
      var e__16997 = cljs.core.nth.call(null, vec__16995__16996, 0, null);
      var s__16998 = vec__16995__16996;
      return cljs.core.take_while.call(null, cljs.core.mk_bound_fn.call(null, sc, end_test, end_key), cljs.core.truth_(cljs.core.mk_bound_fn.call(null, sc, start_test, start_key).call(null, e__16997)) ? s__16998 : cljs.core.next.call(null, s__16998))
    }else {
      return null
    }
  };
  subseq = function(sc, start_test, start_key, end_test, end_key) {
    switch(arguments.length) {
      case 3:
        return subseq__3.call(this, sc, start_test, start_key);
      case 5:
        return subseq__5.call(this, sc, start_test, start_key, end_test, end_key)
    }
    throw"Invalid arity: " + arguments.length;
  };
  subseq.cljs$lang$arity$3 = subseq__3;
  subseq.cljs$lang$arity$5 = subseq__5;
  return subseq
}();
cljs.core.rsubseq = function() {
  var rsubseq = null;
  var rsubseq__3 = function(sc, test, key) {
    var include__17010 = cljs.core.mk_bound_fn.call(null, sc, test, key);
    if(cljs.core.truth_(cljs.core.PersistentHashSet.fromArray([cljs.core._LT_, cljs.core._LT__EQ_]).call(null, test))) {
      var temp__3974__auto____17011 = cljs.core._sorted_seq_from.call(null, sc, key, false);
      if(cljs.core.truth_(temp__3974__auto____17011)) {
        var vec__17012__17013 = temp__3974__auto____17011;
        var e__17014 = cljs.core.nth.call(null, vec__17012__17013, 0, null);
        var s__17015 = vec__17012__17013;
        if(cljs.core.truth_(include__17010.call(null, e__17014))) {
          return s__17015
        }else {
          return cljs.core.next.call(null, s__17015)
        }
      }else {
        return null
      }
    }else {
      return cljs.core.take_while.call(null, include__17010, cljs.core._sorted_seq.call(null, sc, false))
    }
  };
  var rsubseq__5 = function(sc, start_test, start_key, end_test, end_key) {
    var temp__3974__auto____17016 = cljs.core._sorted_seq_from.call(null, sc, end_key, false);
    if(cljs.core.truth_(temp__3974__auto____17016)) {
      var vec__17017__17018 = temp__3974__auto____17016;
      var e__17019 = cljs.core.nth.call(null, vec__17017__17018, 0, null);
      var s__17020 = vec__17017__17018;
      return cljs.core.take_while.call(null, cljs.core.mk_bound_fn.call(null, sc, start_test, start_key), cljs.core.truth_(cljs.core.mk_bound_fn.call(null, sc, end_test, end_key).call(null, e__17019)) ? s__17020 : cljs.core.next.call(null, s__17020))
    }else {
      return null
    }
  };
  rsubseq = function(sc, start_test, start_key, end_test, end_key) {
    switch(arguments.length) {
      case 3:
        return rsubseq__3.call(this, sc, start_test, start_key);
      case 5:
        return rsubseq__5.call(this, sc, start_test, start_key, end_test, end_key)
    }
    throw"Invalid arity: " + arguments.length;
  };
  rsubseq.cljs$lang$arity$3 = rsubseq__3;
  rsubseq.cljs$lang$arity$5 = rsubseq__5;
  return rsubseq
}();
cljs.core.Range = function(meta, start, end, step, __hash) {
  this.meta = meta;
  this.start = start;
  this.end = end;
  this.step = step;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 32375006
};
cljs.core.Range.cljs$lang$type = true;
cljs.core.Range.cljs$lang$ctorPrSeq = function(this__2309__auto__) {
  return cljs.core.list.call(null, "cljs.core/Range")
};
cljs.core.Range.prototype.cljs$core$IHash$_hash$arity$1 = function(rng) {
  var this__17021 = this;
  var h__2192__auto____17022 = this__17021.__hash;
  if(!(h__2192__auto____17022 == null)) {
    return h__2192__auto____17022
  }else {
    var h__2192__auto____17023 = cljs.core.hash_coll.call(null, rng);
    this__17021.__hash = h__2192__auto____17023;
    return h__2192__auto____17023
  }
};
cljs.core.Range.prototype.cljs$core$INext$_next$arity$1 = function(rng) {
  var this__17024 = this;
  if(this__17024.step > 0) {
    if(this__17024.start + this__17024.step < this__17024.end) {
      return new cljs.core.Range(this__17024.meta, this__17024.start + this__17024.step, this__17024.end, this__17024.step, null)
    }else {
      return null
    }
  }else {
    if(this__17024.start + this__17024.step > this__17024.end) {
      return new cljs.core.Range(this__17024.meta, this__17024.start + this__17024.step, this__17024.end, this__17024.step, null)
    }else {
      return null
    }
  }
};
cljs.core.Range.prototype.cljs$core$ICollection$_conj$arity$2 = function(rng, o) {
  var this__17025 = this;
  return cljs.core.cons.call(null, o, rng)
};
cljs.core.Range.prototype.toString = function() {
  var this__17026 = this;
  var this__17027 = this;
  return cljs.core.pr_str.call(null, this__17027)
};
cljs.core.Range.prototype.cljs$core$IReduce$_reduce$arity$2 = function(rng, f) {
  var this__17028 = this;
  return cljs.core.ci_reduce.call(null, rng, f)
};
cljs.core.Range.prototype.cljs$core$IReduce$_reduce$arity$3 = function(rng, f, s) {
  var this__17029 = this;
  return cljs.core.ci_reduce.call(null, rng, f, s)
};
cljs.core.Range.prototype.cljs$core$ISeqable$_seq$arity$1 = function(rng) {
  var this__17030 = this;
  if(this__17030.step > 0) {
    if(this__17030.start < this__17030.end) {
      return rng
    }else {
      return null
    }
  }else {
    if(this__17030.start > this__17030.end) {
      return rng
    }else {
      return null
    }
  }
};
cljs.core.Range.prototype.cljs$core$ICounted$_count$arity$1 = function(rng) {
  var this__17031 = this;
  if(cljs.core.not.call(null, rng.cljs$core$ISeqable$_seq$arity$1(rng))) {
    return 0
  }else {
    return Math.ceil((this__17031.end - this__17031.start) / this__17031.step)
  }
};
cljs.core.Range.prototype.cljs$core$ISeq$_first$arity$1 = function(rng) {
  var this__17032 = this;
  return this__17032.start
};
cljs.core.Range.prototype.cljs$core$ISeq$_rest$arity$1 = function(rng) {
  var this__17033 = this;
  if(!(rng.cljs$core$ISeqable$_seq$arity$1(rng) == null)) {
    return new cljs.core.Range(this__17033.meta, this__17033.start + this__17033.step, this__17033.end, this__17033.step, null)
  }else {
    return cljs.core.List.EMPTY
  }
};
cljs.core.Range.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(rng, other) {
  var this__17034 = this;
  return cljs.core.equiv_sequential.call(null, rng, other)
};
cljs.core.Range.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(rng, meta) {
  var this__17035 = this;
  return new cljs.core.Range(meta, this__17035.start, this__17035.end, this__17035.step, this__17035.__hash)
};
cljs.core.Range.prototype.cljs$core$IMeta$_meta$arity$1 = function(rng) {
  var this__17036 = this;
  return this__17036.meta
};
cljs.core.Range.prototype.cljs$core$IIndexed$_nth$arity$2 = function(rng, n) {
  var this__17037 = this;
  if(n < rng.cljs$core$ICounted$_count$arity$1(rng)) {
    return this__17037.start + n * this__17037.step
  }else {
    if(function() {
      var and__3822__auto____17038 = this__17037.start > this__17037.end;
      if(and__3822__auto____17038) {
        return this__17037.step === 0
      }else {
        return and__3822__auto____17038
      }
    }()) {
      return this__17037.start
    }else {
      throw new Error("Index out of bounds");
    }
  }
};
cljs.core.Range.prototype.cljs$core$IIndexed$_nth$arity$3 = function(rng, n, not_found) {
  var this__17039 = this;
  if(n < rng.cljs$core$ICounted$_count$arity$1(rng)) {
    return this__17039.start + n * this__17039.step
  }else {
    if(function() {
      var and__3822__auto____17040 = this__17039.start > this__17039.end;
      if(and__3822__auto____17040) {
        return this__17039.step === 0
      }else {
        return and__3822__auto____17040
      }
    }()) {
      return this__17039.start
    }else {
      return not_found
    }
  }
};
cljs.core.Range.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(rng) {
  var this__17041 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__17041.meta)
};
cljs.core.Range;
cljs.core.range = function() {
  var range = null;
  var range__0 = function() {
    return range.call(null, 0, Number.MAX_VALUE, 1)
  };
  var range__1 = function(end) {
    return range.call(null, 0, end, 1)
  };
  var range__2 = function(start, end) {
    return range.call(null, start, end, 1)
  };
  var range__3 = function(start, end, step) {
    return new cljs.core.Range(null, start, end, step, null)
  };
  range = function(start, end, step) {
    switch(arguments.length) {
      case 0:
        return range__0.call(this);
      case 1:
        return range__1.call(this, start);
      case 2:
        return range__2.call(this, start, end);
      case 3:
        return range__3.call(this, start, end, step)
    }
    throw"Invalid arity: " + arguments.length;
  };
  range.cljs$lang$arity$0 = range__0;
  range.cljs$lang$arity$1 = range__1;
  range.cljs$lang$arity$2 = range__2;
  range.cljs$lang$arity$3 = range__3;
  return range
}();
cljs.core.take_nth = function take_nth(n, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__3974__auto____17044 = cljs.core.seq.call(null, coll);
    if(temp__3974__auto____17044) {
      var s__17045 = temp__3974__auto____17044;
      return cljs.core.cons.call(null, cljs.core.first.call(null, s__17045), take_nth.call(null, n, cljs.core.drop.call(null, n, s__17045)))
    }else {
      return null
    }
  }, null)
};
cljs.core.split_with = function split_with(pred, coll) {
  return cljs.core.PersistentVector.fromArray([cljs.core.take_while.call(null, pred, coll), cljs.core.drop_while.call(null, pred, coll)], true)
};
cljs.core.partition_by = function partition_by(f, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__3974__auto____17052 = cljs.core.seq.call(null, coll);
    if(temp__3974__auto____17052) {
      var s__17053 = temp__3974__auto____17052;
      var fst__17054 = cljs.core.first.call(null, s__17053);
      var fv__17055 = f.call(null, fst__17054);
      var run__17056 = cljs.core.cons.call(null, fst__17054, cljs.core.take_while.call(null, function(p1__17046_SHARP_) {
        return cljs.core._EQ_.call(null, fv__17055, f.call(null, p1__17046_SHARP_))
      }, cljs.core.next.call(null, s__17053)));
      return cljs.core.cons.call(null, run__17056, partition_by.call(null, f, cljs.core.seq.call(null, cljs.core.drop.call(null, cljs.core.count.call(null, run__17056), s__17053))))
    }else {
      return null
    }
  }, null)
};
cljs.core.frequencies = function frequencies(coll) {
  return cljs.core.persistent_BANG_.call(null, cljs.core.reduce.call(null, function(counts, x) {
    return cljs.core.assoc_BANG_.call(null, counts, x, cljs.core._lookup.call(null, counts, x, 0) + 1)
  }, cljs.core.transient$.call(null, cljs.core.ObjMap.EMPTY), coll))
};
cljs.core.reductions = function() {
  var reductions = null;
  var reductions__2 = function(f, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3971__auto____17071 = cljs.core.seq.call(null, coll);
      if(temp__3971__auto____17071) {
        var s__17072 = temp__3971__auto____17071;
        return reductions.call(null, f, cljs.core.first.call(null, s__17072), cljs.core.rest.call(null, s__17072))
      }else {
        return cljs.core.list.call(null, f.call(null))
      }
    }, null)
  };
  var reductions__3 = function(f, init, coll) {
    return cljs.core.cons.call(null, init, new cljs.core.LazySeq(null, false, function() {
      var temp__3974__auto____17073 = cljs.core.seq.call(null, coll);
      if(temp__3974__auto____17073) {
        var s__17074 = temp__3974__auto____17073;
        return reductions.call(null, f, f.call(null, init, cljs.core.first.call(null, s__17074)), cljs.core.rest.call(null, s__17074))
      }else {
        return null
      }
    }, null))
  };
  reductions = function(f, init, coll) {
    switch(arguments.length) {
      case 2:
        return reductions__2.call(this, f, init);
      case 3:
        return reductions__3.call(this, f, init, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  reductions.cljs$lang$arity$2 = reductions__2;
  reductions.cljs$lang$arity$3 = reductions__3;
  return reductions
}();
cljs.core.juxt = function() {
  var juxt = null;
  var juxt__1 = function(f) {
    return function() {
      var G__17077 = null;
      var G__17077__0 = function() {
        return cljs.core.vector.call(null, f.call(null))
      };
      var G__17077__1 = function(x) {
        return cljs.core.vector.call(null, f.call(null, x))
      };
      var G__17077__2 = function(x, y) {
        return cljs.core.vector.call(null, f.call(null, x, y))
      };
      var G__17077__3 = function(x, y, z) {
        return cljs.core.vector.call(null, f.call(null, x, y, z))
      };
      var G__17077__4 = function() {
        var G__17078__delegate = function(x, y, z, args) {
          return cljs.core.vector.call(null, cljs.core.apply.call(null, f, x, y, z, args))
        };
        var G__17078 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__17078__delegate.call(this, x, y, z, args)
        };
        G__17078.cljs$lang$maxFixedArity = 3;
        G__17078.cljs$lang$applyTo = function(arglist__17079) {
          var x = cljs.core.first(arglist__17079);
          var y = cljs.core.first(cljs.core.next(arglist__17079));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__17079)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__17079)));
          return G__17078__delegate(x, y, z, args)
        };
        G__17078.cljs$lang$arity$variadic = G__17078__delegate;
        return G__17078
      }();
      G__17077 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__17077__0.call(this);
          case 1:
            return G__17077__1.call(this, x);
          case 2:
            return G__17077__2.call(this, x, y);
          case 3:
            return G__17077__3.call(this, x, y, z);
          default:
            return G__17077__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__17077.cljs$lang$maxFixedArity = 3;
      G__17077.cljs$lang$applyTo = G__17077__4.cljs$lang$applyTo;
      return G__17077
    }()
  };
  var juxt__2 = function(f, g) {
    return function() {
      var G__17080 = null;
      var G__17080__0 = function() {
        return cljs.core.vector.call(null, f.call(null), g.call(null))
      };
      var G__17080__1 = function(x) {
        return cljs.core.vector.call(null, f.call(null, x), g.call(null, x))
      };
      var G__17080__2 = function(x, y) {
        return cljs.core.vector.call(null, f.call(null, x, y), g.call(null, x, y))
      };
      var G__17080__3 = function(x, y, z) {
        return cljs.core.vector.call(null, f.call(null, x, y, z), g.call(null, x, y, z))
      };
      var G__17080__4 = function() {
        var G__17081__delegate = function(x, y, z, args) {
          return cljs.core.vector.call(null, cljs.core.apply.call(null, f, x, y, z, args), cljs.core.apply.call(null, g, x, y, z, args))
        };
        var G__17081 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__17081__delegate.call(this, x, y, z, args)
        };
        G__17081.cljs$lang$maxFixedArity = 3;
        G__17081.cljs$lang$applyTo = function(arglist__17082) {
          var x = cljs.core.first(arglist__17082);
          var y = cljs.core.first(cljs.core.next(arglist__17082));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__17082)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__17082)));
          return G__17081__delegate(x, y, z, args)
        };
        G__17081.cljs$lang$arity$variadic = G__17081__delegate;
        return G__17081
      }();
      G__17080 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__17080__0.call(this);
          case 1:
            return G__17080__1.call(this, x);
          case 2:
            return G__17080__2.call(this, x, y);
          case 3:
            return G__17080__3.call(this, x, y, z);
          default:
            return G__17080__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__17080.cljs$lang$maxFixedArity = 3;
      G__17080.cljs$lang$applyTo = G__17080__4.cljs$lang$applyTo;
      return G__17080
    }()
  };
  var juxt__3 = function(f, g, h) {
    return function() {
      var G__17083 = null;
      var G__17083__0 = function() {
        return cljs.core.vector.call(null, f.call(null), g.call(null), h.call(null))
      };
      var G__17083__1 = function(x) {
        return cljs.core.vector.call(null, f.call(null, x), g.call(null, x), h.call(null, x))
      };
      var G__17083__2 = function(x, y) {
        return cljs.core.vector.call(null, f.call(null, x, y), g.call(null, x, y), h.call(null, x, y))
      };
      var G__17083__3 = function(x, y, z) {
        return cljs.core.vector.call(null, f.call(null, x, y, z), g.call(null, x, y, z), h.call(null, x, y, z))
      };
      var G__17083__4 = function() {
        var G__17084__delegate = function(x, y, z, args) {
          return cljs.core.vector.call(null, cljs.core.apply.call(null, f, x, y, z, args), cljs.core.apply.call(null, g, x, y, z, args), cljs.core.apply.call(null, h, x, y, z, args))
        };
        var G__17084 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__17084__delegate.call(this, x, y, z, args)
        };
        G__17084.cljs$lang$maxFixedArity = 3;
        G__17084.cljs$lang$applyTo = function(arglist__17085) {
          var x = cljs.core.first(arglist__17085);
          var y = cljs.core.first(cljs.core.next(arglist__17085));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__17085)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__17085)));
          return G__17084__delegate(x, y, z, args)
        };
        G__17084.cljs$lang$arity$variadic = G__17084__delegate;
        return G__17084
      }();
      G__17083 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__17083__0.call(this);
          case 1:
            return G__17083__1.call(this, x);
          case 2:
            return G__17083__2.call(this, x, y);
          case 3:
            return G__17083__3.call(this, x, y, z);
          default:
            return G__17083__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__17083.cljs$lang$maxFixedArity = 3;
      G__17083.cljs$lang$applyTo = G__17083__4.cljs$lang$applyTo;
      return G__17083
    }()
  };
  var juxt__4 = function() {
    var G__17086__delegate = function(f, g, h, fs) {
      var fs__17076 = cljs.core.list_STAR_.call(null, f, g, h, fs);
      return function() {
        var G__17087 = null;
        var G__17087__0 = function() {
          return cljs.core.reduce.call(null, function(p1__17057_SHARP_, p2__17058_SHARP_) {
            return cljs.core.conj.call(null, p1__17057_SHARP_, p2__17058_SHARP_.call(null))
          }, cljs.core.PersistentVector.EMPTY, fs__17076)
        };
        var G__17087__1 = function(x) {
          return cljs.core.reduce.call(null, function(p1__17059_SHARP_, p2__17060_SHARP_) {
            return cljs.core.conj.call(null, p1__17059_SHARP_, p2__17060_SHARP_.call(null, x))
          }, cljs.core.PersistentVector.EMPTY, fs__17076)
        };
        var G__17087__2 = function(x, y) {
          return cljs.core.reduce.call(null, function(p1__17061_SHARP_, p2__17062_SHARP_) {
            return cljs.core.conj.call(null, p1__17061_SHARP_, p2__17062_SHARP_.call(null, x, y))
          }, cljs.core.PersistentVector.EMPTY, fs__17076)
        };
        var G__17087__3 = function(x, y, z) {
          return cljs.core.reduce.call(null, function(p1__17063_SHARP_, p2__17064_SHARP_) {
            return cljs.core.conj.call(null, p1__17063_SHARP_, p2__17064_SHARP_.call(null, x, y, z))
          }, cljs.core.PersistentVector.EMPTY, fs__17076)
        };
        var G__17087__4 = function() {
          var G__17088__delegate = function(x, y, z, args) {
            return cljs.core.reduce.call(null, function(p1__17065_SHARP_, p2__17066_SHARP_) {
              return cljs.core.conj.call(null, p1__17065_SHARP_, cljs.core.apply.call(null, p2__17066_SHARP_, x, y, z, args))
            }, cljs.core.PersistentVector.EMPTY, fs__17076)
          };
          var G__17088 = function(x, y, z, var_args) {
            var args = null;
            if(goog.isDef(var_args)) {
              args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
            }
            return G__17088__delegate.call(this, x, y, z, args)
          };
          G__17088.cljs$lang$maxFixedArity = 3;
          G__17088.cljs$lang$applyTo = function(arglist__17089) {
            var x = cljs.core.first(arglist__17089);
            var y = cljs.core.first(cljs.core.next(arglist__17089));
            var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__17089)));
            var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__17089)));
            return G__17088__delegate(x, y, z, args)
          };
          G__17088.cljs$lang$arity$variadic = G__17088__delegate;
          return G__17088
        }();
        G__17087 = function(x, y, z, var_args) {
          var args = var_args;
          switch(arguments.length) {
            case 0:
              return G__17087__0.call(this);
            case 1:
              return G__17087__1.call(this, x);
            case 2:
              return G__17087__2.call(this, x, y);
            case 3:
              return G__17087__3.call(this, x, y, z);
            default:
              return G__17087__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
          }
          throw"Invalid arity: " + arguments.length;
        };
        G__17087.cljs$lang$maxFixedArity = 3;
        G__17087.cljs$lang$applyTo = G__17087__4.cljs$lang$applyTo;
        return G__17087
      }()
    };
    var G__17086 = function(f, g, h, var_args) {
      var fs = null;
      if(goog.isDef(var_args)) {
        fs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__17086__delegate.call(this, f, g, h, fs)
    };
    G__17086.cljs$lang$maxFixedArity = 3;
    G__17086.cljs$lang$applyTo = function(arglist__17090) {
      var f = cljs.core.first(arglist__17090);
      var g = cljs.core.first(cljs.core.next(arglist__17090));
      var h = cljs.core.first(cljs.core.next(cljs.core.next(arglist__17090)));
      var fs = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__17090)));
      return G__17086__delegate(f, g, h, fs)
    };
    G__17086.cljs$lang$arity$variadic = G__17086__delegate;
    return G__17086
  }();
  juxt = function(f, g, h, var_args) {
    var fs = var_args;
    switch(arguments.length) {
      case 1:
        return juxt__1.call(this, f);
      case 2:
        return juxt__2.call(this, f, g);
      case 3:
        return juxt__3.call(this, f, g, h);
      default:
        return juxt__4.cljs$lang$arity$variadic(f, g, h, cljs.core.array_seq(arguments, 3))
    }
    throw"Invalid arity: " + arguments.length;
  };
  juxt.cljs$lang$maxFixedArity = 3;
  juxt.cljs$lang$applyTo = juxt__4.cljs$lang$applyTo;
  juxt.cljs$lang$arity$1 = juxt__1;
  juxt.cljs$lang$arity$2 = juxt__2;
  juxt.cljs$lang$arity$3 = juxt__3;
  juxt.cljs$lang$arity$variadic = juxt__4.cljs$lang$arity$variadic;
  return juxt
}();
cljs.core.dorun = function() {
  var dorun = null;
  var dorun__1 = function(coll) {
    while(true) {
      if(cljs.core.seq.call(null, coll)) {
        var G__17093 = cljs.core.next.call(null, coll);
        coll = G__17093;
        continue
      }else {
        return null
      }
      break
    }
  };
  var dorun__2 = function(n, coll) {
    while(true) {
      if(cljs.core.truth_(function() {
        var and__3822__auto____17092 = cljs.core.seq.call(null, coll);
        if(and__3822__auto____17092) {
          return n > 0
        }else {
          return and__3822__auto____17092
        }
      }())) {
        var G__17094 = n - 1;
        var G__17095 = cljs.core.next.call(null, coll);
        n = G__17094;
        coll = G__17095;
        continue
      }else {
        return null
      }
      break
    }
  };
  dorun = function(n, coll) {
    switch(arguments.length) {
      case 1:
        return dorun__1.call(this, n);
      case 2:
        return dorun__2.call(this, n, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  dorun.cljs$lang$arity$1 = dorun__1;
  dorun.cljs$lang$arity$2 = dorun__2;
  return dorun
}();
cljs.core.doall = function() {
  var doall = null;
  var doall__1 = function(coll) {
    cljs.core.dorun.call(null, coll);
    return coll
  };
  var doall__2 = function(n, coll) {
    cljs.core.dorun.call(null, n, coll);
    return coll
  };
  doall = function(n, coll) {
    switch(arguments.length) {
      case 1:
        return doall__1.call(this, n);
      case 2:
        return doall__2.call(this, n, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  doall.cljs$lang$arity$1 = doall__1;
  doall.cljs$lang$arity$2 = doall__2;
  return doall
}();
cljs.core.regexp_QMARK_ = function regexp_QMARK_(o) {
  return o instanceof RegExp
};
cljs.core.re_matches = function re_matches(re, s) {
  var matches__17097 = re.exec(s);
  if(cljs.core._EQ_.call(null, cljs.core.first.call(null, matches__17097), s)) {
    if(cljs.core.count.call(null, matches__17097) === 1) {
      return cljs.core.first.call(null, matches__17097)
    }else {
      return cljs.core.vec.call(null, matches__17097)
    }
  }else {
    return null
  }
};
cljs.core.re_find = function re_find(re, s) {
  var matches__17099 = re.exec(s);
  if(matches__17099 == null) {
    return null
  }else {
    if(cljs.core.count.call(null, matches__17099) === 1) {
      return cljs.core.first.call(null, matches__17099)
    }else {
      return cljs.core.vec.call(null, matches__17099)
    }
  }
};
cljs.core.re_seq = function re_seq(re, s) {
  var match_data__17104 = cljs.core.re_find.call(null, re, s);
  var match_idx__17105 = s.search(re);
  var match_str__17106 = cljs.core.coll_QMARK_.call(null, match_data__17104) ? cljs.core.first.call(null, match_data__17104) : match_data__17104;
  var post_match__17107 = cljs.core.subs.call(null, s, match_idx__17105 + cljs.core.count.call(null, match_str__17106));
  if(cljs.core.truth_(match_data__17104)) {
    return new cljs.core.LazySeq(null, false, function() {
      return cljs.core.cons.call(null, match_data__17104, re_seq.call(null, re, post_match__17107))
    }, null)
  }else {
    return null
  }
};
cljs.core.re_pattern = function re_pattern(s) {
  var vec__17114__17115 = cljs.core.re_find.call(null, /^(?:\(\?([idmsux]*)\))?(.*)/, s);
  var ___17116 = cljs.core.nth.call(null, vec__17114__17115, 0, null);
  var flags__17117 = cljs.core.nth.call(null, vec__17114__17115, 1, null);
  var pattern__17118 = cljs.core.nth.call(null, vec__17114__17115, 2, null);
  return new RegExp(pattern__17118, flags__17117)
};
cljs.core.pr_sequential = function pr_sequential(print_one, begin, sep, end, opts, coll) {
  return cljs.core.concat.call(null, cljs.core.PersistentVector.fromArray([begin], true), cljs.core.flatten1.call(null, cljs.core.interpose.call(null, cljs.core.PersistentVector.fromArray([sep], true), cljs.core.map.call(null, function(p1__17108_SHARP_) {
    return print_one.call(null, p1__17108_SHARP_, opts)
  }, coll))), cljs.core.PersistentVector.fromArray([end], true))
};
cljs.core.string_print = function string_print(x) {
  cljs.core._STAR_print_fn_STAR_.call(null, x);
  return null
};
cljs.core.flush = function flush() {
  return null
};
cljs.core.pr_seq = function pr_seq(obj, opts) {
  if(obj == null) {
    return cljs.core.list.call(null, "nil")
  }else {
    if(void 0 === obj) {
      return cljs.core.list.call(null, "#<undefined>")
    }else {
      if("\ufdd0'else") {
        return cljs.core.concat.call(null, cljs.core.truth_(function() {
          var and__3822__auto____17128 = cljs.core._lookup.call(null, opts, "\ufdd0'meta", null);
          if(cljs.core.truth_(and__3822__auto____17128)) {
            var and__3822__auto____17132 = function() {
              var G__17129__17130 = obj;
              if(G__17129__17130) {
                if(function() {
                  var or__3824__auto____17131 = G__17129__17130.cljs$lang$protocol_mask$partition0$ & 131072;
                  if(or__3824__auto____17131) {
                    return or__3824__auto____17131
                  }else {
                    return G__17129__17130.cljs$core$IMeta$
                  }
                }()) {
                  return true
                }else {
                  if(!G__17129__17130.cljs$lang$protocol_mask$partition0$) {
                    return cljs.core.type_satisfies_.call(null, cljs.core.IMeta, G__17129__17130)
                  }else {
                    return false
                  }
                }
              }else {
                return cljs.core.type_satisfies_.call(null, cljs.core.IMeta, G__17129__17130)
              }
            }();
            if(cljs.core.truth_(and__3822__auto____17132)) {
              return cljs.core.meta.call(null, obj)
            }else {
              return and__3822__auto____17132
            }
          }else {
            return and__3822__auto____17128
          }
        }()) ? cljs.core.concat.call(null, cljs.core.PersistentVector.fromArray(["^"], true), pr_seq.call(null, cljs.core.meta.call(null, obj), opts), cljs.core.PersistentVector.fromArray([" "], true)) : null, function() {
          var and__3822__auto____17133 = !(obj == null);
          if(and__3822__auto____17133) {
            return obj.cljs$lang$type
          }else {
            return and__3822__auto____17133
          }
        }() ? obj.cljs$lang$ctorPrSeq(obj) : function() {
          var G__17134__17135 = obj;
          if(G__17134__17135) {
            if(function() {
              var or__3824__auto____17136 = G__17134__17135.cljs$lang$protocol_mask$partition0$ & 536870912;
              if(or__3824__auto____17136) {
                return or__3824__auto____17136
              }else {
                return G__17134__17135.cljs$core$IPrintable$
              }
            }()) {
              return true
            }else {
              if(!G__17134__17135.cljs$lang$protocol_mask$partition0$) {
                return cljs.core.type_satisfies_.call(null, cljs.core.IPrintable, G__17134__17135)
              }else {
                return false
              }
            }
          }else {
            return cljs.core.type_satisfies_.call(null, cljs.core.IPrintable, G__17134__17135)
          }
        }() ? cljs.core._pr_seq.call(null, obj, opts) : cljs.core.truth_(cljs.core.regexp_QMARK_.call(null, obj)) ? cljs.core.list.call(null, '#"', obj.source, '"') : "\ufdd0'else" ? cljs.core.list.call(null, "#<", [cljs.core.str(obj)].join(""), ">") : null)
      }else {
        return null
      }
    }
  }
};
cljs.core.pr_sb = function pr_sb(objs, opts) {
  var sb__17156 = new goog.string.StringBuffer;
  var G__17157__17158 = cljs.core.seq.call(null, cljs.core.pr_seq.call(null, cljs.core.first.call(null, objs), opts));
  if(G__17157__17158) {
    var string__17159 = cljs.core.first.call(null, G__17157__17158);
    var G__17157__17160 = G__17157__17158;
    while(true) {
      sb__17156.append(string__17159);
      var temp__3974__auto____17161 = cljs.core.next.call(null, G__17157__17160);
      if(temp__3974__auto____17161) {
        var G__17157__17162 = temp__3974__auto____17161;
        var G__17175 = cljs.core.first.call(null, G__17157__17162);
        var G__17176 = G__17157__17162;
        string__17159 = G__17175;
        G__17157__17160 = G__17176;
        continue
      }else {
      }
      break
    }
  }else {
  }
  var G__17163__17164 = cljs.core.seq.call(null, cljs.core.next.call(null, objs));
  if(G__17163__17164) {
    var obj__17165 = cljs.core.first.call(null, G__17163__17164);
    var G__17163__17166 = G__17163__17164;
    while(true) {
      sb__17156.append(" ");
      var G__17167__17168 = cljs.core.seq.call(null, cljs.core.pr_seq.call(null, obj__17165, opts));
      if(G__17167__17168) {
        var string__17169 = cljs.core.first.call(null, G__17167__17168);
        var G__17167__17170 = G__17167__17168;
        while(true) {
          sb__17156.append(string__17169);
          var temp__3974__auto____17171 = cljs.core.next.call(null, G__17167__17170);
          if(temp__3974__auto____17171) {
            var G__17167__17172 = temp__3974__auto____17171;
            var G__17177 = cljs.core.first.call(null, G__17167__17172);
            var G__17178 = G__17167__17172;
            string__17169 = G__17177;
            G__17167__17170 = G__17178;
            continue
          }else {
          }
          break
        }
      }else {
      }
      var temp__3974__auto____17173 = cljs.core.next.call(null, G__17163__17166);
      if(temp__3974__auto____17173) {
        var G__17163__17174 = temp__3974__auto____17173;
        var G__17179 = cljs.core.first.call(null, G__17163__17174);
        var G__17180 = G__17163__17174;
        obj__17165 = G__17179;
        G__17163__17166 = G__17180;
        continue
      }else {
      }
      break
    }
  }else {
  }
  return sb__17156
};
cljs.core.pr_str_with_opts = function pr_str_with_opts(objs, opts) {
  return[cljs.core.str(cljs.core.pr_sb.call(null, objs, opts))].join("")
};
cljs.core.prn_str_with_opts = function prn_str_with_opts(objs, opts) {
  var sb__17182 = cljs.core.pr_sb.call(null, objs, opts);
  sb__17182.append("\n");
  return[cljs.core.str(sb__17182)].join("")
};
cljs.core.pr_with_opts = function pr_with_opts(objs, opts) {
  var G__17201__17202 = cljs.core.seq.call(null, cljs.core.pr_seq.call(null, cljs.core.first.call(null, objs), opts));
  if(G__17201__17202) {
    var string__17203 = cljs.core.first.call(null, G__17201__17202);
    var G__17201__17204 = G__17201__17202;
    while(true) {
      cljs.core.string_print.call(null, string__17203);
      var temp__3974__auto____17205 = cljs.core.next.call(null, G__17201__17204);
      if(temp__3974__auto____17205) {
        var G__17201__17206 = temp__3974__auto____17205;
        var G__17219 = cljs.core.first.call(null, G__17201__17206);
        var G__17220 = G__17201__17206;
        string__17203 = G__17219;
        G__17201__17204 = G__17220;
        continue
      }else {
      }
      break
    }
  }else {
  }
  var G__17207__17208 = cljs.core.seq.call(null, cljs.core.next.call(null, objs));
  if(G__17207__17208) {
    var obj__17209 = cljs.core.first.call(null, G__17207__17208);
    var G__17207__17210 = G__17207__17208;
    while(true) {
      cljs.core.string_print.call(null, " ");
      var G__17211__17212 = cljs.core.seq.call(null, cljs.core.pr_seq.call(null, obj__17209, opts));
      if(G__17211__17212) {
        var string__17213 = cljs.core.first.call(null, G__17211__17212);
        var G__17211__17214 = G__17211__17212;
        while(true) {
          cljs.core.string_print.call(null, string__17213);
          var temp__3974__auto____17215 = cljs.core.next.call(null, G__17211__17214);
          if(temp__3974__auto____17215) {
            var G__17211__17216 = temp__3974__auto____17215;
            var G__17221 = cljs.core.first.call(null, G__17211__17216);
            var G__17222 = G__17211__17216;
            string__17213 = G__17221;
            G__17211__17214 = G__17222;
            continue
          }else {
          }
          break
        }
      }else {
      }
      var temp__3974__auto____17217 = cljs.core.next.call(null, G__17207__17210);
      if(temp__3974__auto____17217) {
        var G__17207__17218 = temp__3974__auto____17217;
        var G__17223 = cljs.core.first.call(null, G__17207__17218);
        var G__17224 = G__17207__17218;
        obj__17209 = G__17223;
        G__17207__17210 = G__17224;
        continue
      }else {
        return null
      }
      break
    }
  }else {
    return null
  }
};
cljs.core.newline = function newline(opts) {
  cljs.core.string_print.call(null, "\n");
  if(cljs.core.truth_(cljs.core._lookup.call(null, opts, "\ufdd0'flush-on-newline", null))) {
    return cljs.core.flush.call(null)
  }else {
    return null
  }
};
cljs.core._STAR_flush_on_newline_STAR_ = true;
cljs.core._STAR_print_readably_STAR_ = true;
cljs.core._STAR_print_meta_STAR_ = false;
cljs.core._STAR_print_dup_STAR_ = false;
cljs.core.pr_opts = function pr_opts() {
  return cljs.core.ObjMap.fromObject(["\ufdd0'flush-on-newline", "\ufdd0'readably", "\ufdd0'meta", "\ufdd0'dup"], {"\ufdd0'flush-on-newline":cljs.core._STAR_flush_on_newline_STAR_, "\ufdd0'readably":cljs.core._STAR_print_readably_STAR_, "\ufdd0'meta":cljs.core._STAR_print_meta_STAR_, "\ufdd0'dup":cljs.core._STAR_print_dup_STAR_})
};
cljs.core.pr_str = function() {
  var pr_str__delegate = function(objs) {
    return cljs.core.pr_str_with_opts.call(null, objs, cljs.core.pr_opts.call(null))
  };
  var pr_str = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return pr_str__delegate.call(this, objs)
  };
  pr_str.cljs$lang$maxFixedArity = 0;
  pr_str.cljs$lang$applyTo = function(arglist__17225) {
    var objs = cljs.core.seq(arglist__17225);
    return pr_str__delegate(objs)
  };
  pr_str.cljs$lang$arity$variadic = pr_str__delegate;
  return pr_str
}();
cljs.core.prn_str = function() {
  var prn_str__delegate = function(objs) {
    return cljs.core.prn_str_with_opts.call(null, objs, cljs.core.pr_opts.call(null))
  };
  var prn_str = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return prn_str__delegate.call(this, objs)
  };
  prn_str.cljs$lang$maxFixedArity = 0;
  prn_str.cljs$lang$applyTo = function(arglist__17226) {
    var objs = cljs.core.seq(arglist__17226);
    return prn_str__delegate(objs)
  };
  prn_str.cljs$lang$arity$variadic = prn_str__delegate;
  return prn_str
}();
cljs.core.pr = function() {
  var pr__delegate = function(objs) {
    return cljs.core.pr_with_opts.call(null, objs, cljs.core.pr_opts.call(null))
  };
  var pr = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return pr__delegate.call(this, objs)
  };
  pr.cljs$lang$maxFixedArity = 0;
  pr.cljs$lang$applyTo = function(arglist__17227) {
    var objs = cljs.core.seq(arglist__17227);
    return pr__delegate(objs)
  };
  pr.cljs$lang$arity$variadic = pr__delegate;
  return pr
}();
cljs.core.print = function() {
  var cljs_core_print__delegate = function(objs) {
    return cljs.core.pr_with_opts.call(null, objs, cljs.core.assoc.call(null, cljs.core.pr_opts.call(null), "\ufdd0'readably", false))
  };
  var cljs_core_print = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return cljs_core_print__delegate.call(this, objs)
  };
  cljs_core_print.cljs$lang$maxFixedArity = 0;
  cljs_core_print.cljs$lang$applyTo = function(arglist__17228) {
    var objs = cljs.core.seq(arglist__17228);
    return cljs_core_print__delegate(objs)
  };
  cljs_core_print.cljs$lang$arity$variadic = cljs_core_print__delegate;
  return cljs_core_print
}();
cljs.core.print_str = function() {
  var print_str__delegate = function(objs) {
    return cljs.core.pr_str_with_opts.call(null, objs, cljs.core.assoc.call(null, cljs.core.pr_opts.call(null), "\ufdd0'readably", false))
  };
  var print_str = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return print_str__delegate.call(this, objs)
  };
  print_str.cljs$lang$maxFixedArity = 0;
  print_str.cljs$lang$applyTo = function(arglist__17229) {
    var objs = cljs.core.seq(arglist__17229);
    return print_str__delegate(objs)
  };
  print_str.cljs$lang$arity$variadic = print_str__delegate;
  return print_str
}();
cljs.core.println = function() {
  var println__delegate = function(objs) {
    cljs.core.pr_with_opts.call(null, objs, cljs.core.assoc.call(null, cljs.core.pr_opts.call(null), "\ufdd0'readably", false));
    return cljs.core.newline.call(null, cljs.core.pr_opts.call(null))
  };
  var println = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return println__delegate.call(this, objs)
  };
  println.cljs$lang$maxFixedArity = 0;
  println.cljs$lang$applyTo = function(arglist__17230) {
    var objs = cljs.core.seq(arglist__17230);
    return println__delegate(objs)
  };
  println.cljs$lang$arity$variadic = println__delegate;
  return println
}();
cljs.core.println_str = function() {
  var println_str__delegate = function(objs) {
    return cljs.core.prn_str_with_opts.call(null, objs, cljs.core.assoc.call(null, cljs.core.pr_opts.call(null), "\ufdd0'readably", false))
  };
  var println_str = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return println_str__delegate.call(this, objs)
  };
  println_str.cljs$lang$maxFixedArity = 0;
  println_str.cljs$lang$applyTo = function(arglist__17231) {
    var objs = cljs.core.seq(arglist__17231);
    return println_str__delegate(objs)
  };
  println_str.cljs$lang$arity$variadic = println_str__delegate;
  return println_str
}();
cljs.core.prn = function() {
  var prn__delegate = function(objs) {
    cljs.core.pr_with_opts.call(null, objs, cljs.core.pr_opts.call(null));
    return cljs.core.newline.call(null, cljs.core.pr_opts.call(null))
  };
  var prn = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return prn__delegate.call(this, objs)
  };
  prn.cljs$lang$maxFixedArity = 0;
  prn.cljs$lang$applyTo = function(arglist__17232) {
    var objs = cljs.core.seq(arglist__17232);
    return prn__delegate(objs)
  };
  prn.cljs$lang$arity$variadic = prn__delegate;
  return prn
}();
cljs.core.printf = function() {
  var printf__delegate = function(fmt, args) {
    return cljs.core.print.call(null, cljs.core.apply.call(null, cljs.core.format, fmt, args))
  };
  var printf = function(fmt, var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return printf__delegate.call(this, fmt, args)
  };
  printf.cljs$lang$maxFixedArity = 1;
  printf.cljs$lang$applyTo = function(arglist__17233) {
    var fmt = cljs.core.first(arglist__17233);
    var args = cljs.core.rest(arglist__17233);
    return printf__delegate(fmt, args)
  };
  printf.cljs$lang$arity$variadic = printf__delegate;
  return printf
}();
cljs.core.HashMap.prototype.cljs$core$IPrintable$ = true;
cljs.core.HashMap.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  var pr_pair__17234 = function(keyval) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential.call(null, pr_pair__17234, "{", ", ", "}", opts, coll)
};
cljs.core.IPrintable["number"] = true;
cljs.core._pr_seq["number"] = function(n, opts) {
  return cljs.core.list.call(null, [cljs.core.str(n)].join(""))
};
cljs.core.IndexedSeq.prototype.cljs$core$IPrintable$ = true;
cljs.core.IndexedSeq.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.Subvec.prototype.cljs$core$IPrintable$ = true;
cljs.core.Subvec.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "[", " ", "]", opts, coll)
};
cljs.core.ChunkedCons.prototype.cljs$core$IPrintable$ = true;
cljs.core.ChunkedCons.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentTreeMap.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  var pr_pair__17235 = function(keyval) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential.call(null, pr_pair__17235, "{", ", ", "}", opts, coll)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentArrayMap.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  var pr_pair__17236 = function(keyval) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential.call(null, pr_pair__17236, "{", ", ", "}", opts, coll)
};
cljs.core.PersistentQueue.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "#queue [", " ", "]", opts, cljs.core.seq.call(null, coll))
};
cljs.core.LazySeq.prototype.cljs$core$IPrintable$ = true;
cljs.core.LazySeq.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.RSeq.prototype.cljs$core$IPrintable$ = true;
cljs.core.RSeq.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentTreeSet.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "#{", " ", "}", opts, coll)
};
cljs.core.IPrintable["boolean"] = true;
cljs.core._pr_seq["boolean"] = function(bool, opts) {
  return cljs.core.list.call(null, [cljs.core.str(bool)].join(""))
};
cljs.core.IPrintable["string"] = true;
cljs.core._pr_seq["string"] = function(obj, opts) {
  if(cljs.core.keyword_QMARK_.call(null, obj)) {
    return cljs.core.list.call(null, [cljs.core.str(":"), cljs.core.str(function() {
      var temp__3974__auto____17237 = cljs.core.namespace.call(null, obj);
      if(cljs.core.truth_(temp__3974__auto____17237)) {
        var nspc__17238 = temp__3974__auto____17237;
        return[cljs.core.str(nspc__17238), cljs.core.str("/")].join("")
      }else {
        return null
      }
    }()), cljs.core.str(cljs.core.name.call(null, obj))].join(""))
  }else {
    if(cljs.core.symbol_QMARK_.call(null, obj)) {
      return cljs.core.list.call(null, [cljs.core.str(function() {
        var temp__3974__auto____17239 = cljs.core.namespace.call(null, obj);
        if(cljs.core.truth_(temp__3974__auto____17239)) {
          var nspc__17240 = temp__3974__auto____17239;
          return[cljs.core.str(nspc__17240), cljs.core.str("/")].join("")
        }else {
          return null
        }
      }()), cljs.core.str(cljs.core.name.call(null, obj))].join(""))
    }else {
      if("\ufdd0'else") {
        return cljs.core.list.call(null, cljs.core.truth_((new cljs.core.Keyword("\ufdd0'readably")).call(null, opts)) ? goog.string.quote(obj) : obj)
      }else {
        return null
      }
    }
  }
};
cljs.core.NodeSeq.prototype.cljs$core$IPrintable$ = true;
cljs.core.NodeSeq.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.RedNode.prototype.cljs$core$IPrintable$ = true;
cljs.core.RedNode.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "[", " ", "]", opts, coll)
};
cljs.core.ChunkedSeq.prototype.cljs$core$IPrintable$ = true;
cljs.core.ChunkedSeq.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.PersistentHashMap.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentHashMap.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  var pr_pair__17241 = function(keyval) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential.call(null, pr_pair__17241, "{", ", ", "}", opts, coll)
};
cljs.core.Vector.prototype.cljs$core$IPrintable$ = true;
cljs.core.Vector.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "[", " ", "]", opts, coll)
};
cljs.core.PersistentHashSet.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentHashSet.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "#{", " ", "}", opts, coll)
};
cljs.core.PersistentVector.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "[", " ", "]", opts, coll)
};
cljs.core.List.prototype.cljs$core$IPrintable$ = true;
cljs.core.List.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.IPrintable["array"] = true;
cljs.core._pr_seq["array"] = function(a, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "#<Array [", ", ", "]>", opts, a)
};
cljs.core.IPrintable["function"] = true;
cljs.core._pr_seq["function"] = function(this$) {
  return cljs.core.list.call(null, "#<", [cljs.core.str(this$)].join(""), ">")
};
cljs.core.EmptyList.prototype.cljs$core$IPrintable$ = true;
cljs.core.EmptyList.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.list.call(null, "()")
};
cljs.core.BlackNode.prototype.cljs$core$IPrintable$ = true;
cljs.core.BlackNode.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "[", " ", "]", opts, coll)
};
Date.prototype.cljs$core$IPrintable$ = true;
Date.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(d, _) {
  var normalize__17243 = function(n, len) {
    var ns__17242 = [cljs.core.str(n)].join("");
    while(true) {
      if(cljs.core.count.call(null, ns__17242) < len) {
        var G__17245 = [cljs.core.str("0"), cljs.core.str(ns__17242)].join("");
        ns__17242 = G__17245;
        continue
      }else {
        return ns__17242
      }
      break
    }
  };
  return cljs.core.list.call(null, [cljs.core.str('#inst "'), cljs.core.str(d.getUTCFullYear()), cljs.core.str("-"), cljs.core.str(normalize__17243.call(null, d.getUTCMonth() + 1, 2)), cljs.core.str("-"), cljs.core.str(normalize__17243.call(null, d.getUTCDate(), 2)), cljs.core.str("T"), cljs.core.str(normalize__17243.call(null, d.getUTCHours(), 2)), cljs.core.str(":"), cljs.core.str(normalize__17243.call(null, d.getUTCMinutes(), 2)), cljs.core.str(":"), cljs.core.str(normalize__17243.call(null, d.getUTCSeconds(), 
  2)), cljs.core.str("."), cljs.core.str(normalize__17243.call(null, d.getUTCMilliseconds(), 3)), cljs.core.str("-"), cljs.core.str('00:00"')].join(""))
};
cljs.core.Cons.prototype.cljs$core$IPrintable$ = true;
cljs.core.Cons.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.Range.prototype.cljs$core$IPrintable$ = true;
cljs.core.Range.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IPrintable$ = true;
cljs.core.ArrayNodeSeq.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.ObjMap.prototype.cljs$core$IPrintable$ = true;
cljs.core.ObjMap.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  var pr_pair__17244 = function(keyval) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential.call(null, pr_pair__17244, "{", ", ", "}", opts, coll)
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.PersistentVector.prototype.cljs$core$IComparable$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IComparable$_compare$arity$2 = function(x, y) {
  return cljs.core.compare_indexed.call(null, x, y)
};
cljs.core.Atom = function(state, meta, validator, watches) {
  this.state = state;
  this.meta = meta;
  this.validator = validator;
  this.watches = watches;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 2690809856
};
cljs.core.Atom.cljs$lang$type = true;
cljs.core.Atom.cljs$lang$ctorPrSeq = function(this__2309__auto__) {
  return cljs.core.list.call(null, "cljs.core/Atom")
};
cljs.core.Atom.prototype.cljs$core$IHash$_hash$arity$1 = function(this$) {
  var this__17246 = this;
  return goog.getUid(this$)
};
cljs.core.Atom.prototype.cljs$core$IWatchable$_notify_watches$arity$3 = function(this$, oldval, newval) {
  var this__17247 = this;
  var G__17248__17249 = cljs.core.seq.call(null, this__17247.watches);
  if(G__17248__17249) {
    var G__17251__17253 = cljs.core.first.call(null, G__17248__17249);
    var vec__17252__17254 = G__17251__17253;
    var key__17255 = cljs.core.nth.call(null, vec__17252__17254, 0, null);
    var f__17256 = cljs.core.nth.call(null, vec__17252__17254, 1, null);
    var G__17248__17257 = G__17248__17249;
    var G__17251__17258 = G__17251__17253;
    var G__17248__17259 = G__17248__17257;
    while(true) {
      var vec__17260__17261 = G__17251__17258;
      var key__17262 = cljs.core.nth.call(null, vec__17260__17261, 0, null);
      var f__17263 = cljs.core.nth.call(null, vec__17260__17261, 1, null);
      var G__17248__17264 = G__17248__17259;
      f__17263.call(null, key__17262, this$, oldval, newval);
      var temp__3974__auto____17265 = cljs.core.next.call(null, G__17248__17264);
      if(temp__3974__auto____17265) {
        var G__17248__17266 = temp__3974__auto____17265;
        var G__17273 = cljs.core.first.call(null, G__17248__17266);
        var G__17274 = G__17248__17266;
        G__17251__17258 = G__17273;
        G__17248__17259 = G__17274;
        continue
      }else {
        return null
      }
      break
    }
  }else {
    return null
  }
};
cljs.core.Atom.prototype.cljs$core$IWatchable$_add_watch$arity$3 = function(this$, key, f) {
  var this__17267 = this;
  return this$.watches = cljs.core.assoc.call(null, this__17267.watches, key, f)
};
cljs.core.Atom.prototype.cljs$core$IWatchable$_remove_watch$arity$2 = function(this$, key) {
  var this__17268 = this;
  return this$.watches = cljs.core.dissoc.call(null, this__17268.watches, key)
};
cljs.core.Atom.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(a, opts) {
  var this__17269 = this;
  return cljs.core.concat.call(null, cljs.core.PersistentVector.fromArray(["#<Atom: "], true), cljs.core._pr_seq.call(null, this__17269.state, opts), ">")
};
cljs.core.Atom.prototype.cljs$core$IMeta$_meta$arity$1 = function(_) {
  var this__17270 = this;
  return this__17270.meta
};
cljs.core.Atom.prototype.cljs$core$IDeref$_deref$arity$1 = function(_) {
  var this__17271 = this;
  return this__17271.state
};
cljs.core.Atom.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(o, other) {
  var this__17272 = this;
  return o === other
};
cljs.core.Atom;
cljs.core.atom = function() {
  var atom = null;
  var atom__1 = function(x) {
    return new cljs.core.Atom(x, null, null, null)
  };
  var atom__2 = function() {
    var G__17286__delegate = function(x, p__17275) {
      var map__17281__17282 = p__17275;
      var map__17281__17283 = cljs.core.seq_QMARK_.call(null, map__17281__17282) ? cljs.core.apply.call(null, cljs.core.hash_map, map__17281__17282) : map__17281__17282;
      var validator__17284 = cljs.core._lookup.call(null, map__17281__17283, "\ufdd0'validator", null);
      var meta__17285 = cljs.core._lookup.call(null, map__17281__17283, "\ufdd0'meta", null);
      return new cljs.core.Atom(x, meta__17285, validator__17284, null)
    };
    var G__17286 = function(x, var_args) {
      var p__17275 = null;
      if(goog.isDef(var_args)) {
        p__17275 = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__17286__delegate.call(this, x, p__17275)
    };
    G__17286.cljs$lang$maxFixedArity = 1;
    G__17286.cljs$lang$applyTo = function(arglist__17287) {
      var x = cljs.core.first(arglist__17287);
      var p__17275 = cljs.core.rest(arglist__17287);
      return G__17286__delegate(x, p__17275)
    };
    G__17286.cljs$lang$arity$variadic = G__17286__delegate;
    return G__17286
  }();
  atom = function(x, var_args) {
    var p__17275 = var_args;
    switch(arguments.length) {
      case 1:
        return atom__1.call(this, x);
      default:
        return atom__2.cljs$lang$arity$variadic(x, cljs.core.array_seq(arguments, 1))
    }
    throw"Invalid arity: " + arguments.length;
  };
  atom.cljs$lang$maxFixedArity = 1;
  atom.cljs$lang$applyTo = atom__2.cljs$lang$applyTo;
  atom.cljs$lang$arity$1 = atom__1;
  atom.cljs$lang$arity$variadic = atom__2.cljs$lang$arity$variadic;
  return atom
}();
cljs.core.reset_BANG_ = function reset_BANG_(a, new_value) {
  var temp__3974__auto____17291 = a.validator;
  if(cljs.core.truth_(temp__3974__auto____17291)) {
    var validate__17292 = temp__3974__auto____17291;
    if(cljs.core.truth_(validate__17292.call(null, new_value))) {
    }else {
      throw new Error([cljs.core.str("Assert failed: "), cljs.core.str("Validator rejected reference state"), cljs.core.str("\n"), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'validate", "\ufdd1'new-value"), cljs.core.hash_map("\ufdd0'line", 6440))))].join(""));
    }
  }else {
  }
  var old_value__17293 = a.state;
  a.state = new_value;
  cljs.core._notify_watches.call(null, a, old_value__17293, new_value);
  return new_value
};
cljs.core.swap_BANG_ = function() {
  var swap_BANG_ = null;
  var swap_BANG___2 = function(a, f) {
    return cljs.core.reset_BANG_.call(null, a, f.call(null, a.state))
  };
  var swap_BANG___3 = function(a, f, x) {
    return cljs.core.reset_BANG_.call(null, a, f.call(null, a.state, x))
  };
  var swap_BANG___4 = function(a, f, x, y) {
    return cljs.core.reset_BANG_.call(null, a, f.call(null, a.state, x, y))
  };
  var swap_BANG___5 = function(a, f, x, y, z) {
    return cljs.core.reset_BANG_.call(null, a, f.call(null, a.state, x, y, z))
  };
  var swap_BANG___6 = function() {
    var G__17294__delegate = function(a, f, x, y, z, more) {
      return cljs.core.reset_BANG_.call(null, a, cljs.core.apply.call(null, f, a.state, x, y, z, more))
    };
    var G__17294 = function(a, f, x, y, z, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 5), 0)
      }
      return G__17294__delegate.call(this, a, f, x, y, z, more)
    };
    G__17294.cljs$lang$maxFixedArity = 5;
    G__17294.cljs$lang$applyTo = function(arglist__17295) {
      var a = cljs.core.first(arglist__17295);
      var f = cljs.core.first(cljs.core.next(arglist__17295));
      var x = cljs.core.first(cljs.core.next(cljs.core.next(arglist__17295)));
      var y = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__17295))));
      var z = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(cljs.core.next(arglist__17295)))));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(cljs.core.next(arglist__17295)))));
      return G__17294__delegate(a, f, x, y, z, more)
    };
    G__17294.cljs$lang$arity$variadic = G__17294__delegate;
    return G__17294
  }();
  swap_BANG_ = function(a, f, x, y, z, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 2:
        return swap_BANG___2.call(this, a, f);
      case 3:
        return swap_BANG___3.call(this, a, f, x);
      case 4:
        return swap_BANG___4.call(this, a, f, x, y);
      case 5:
        return swap_BANG___5.call(this, a, f, x, y, z);
      default:
        return swap_BANG___6.cljs$lang$arity$variadic(a, f, x, y, z, cljs.core.array_seq(arguments, 5))
    }
    throw"Invalid arity: " + arguments.length;
  };
  swap_BANG_.cljs$lang$maxFixedArity = 5;
  swap_BANG_.cljs$lang$applyTo = swap_BANG___6.cljs$lang$applyTo;
  swap_BANG_.cljs$lang$arity$2 = swap_BANG___2;
  swap_BANG_.cljs$lang$arity$3 = swap_BANG___3;
  swap_BANG_.cljs$lang$arity$4 = swap_BANG___4;
  swap_BANG_.cljs$lang$arity$5 = swap_BANG___5;
  swap_BANG_.cljs$lang$arity$variadic = swap_BANG___6.cljs$lang$arity$variadic;
  return swap_BANG_
}();
cljs.core.compare_and_set_BANG_ = function compare_and_set_BANG_(a, oldval, newval) {
  if(cljs.core._EQ_.call(null, a.state, oldval)) {
    cljs.core.reset_BANG_.call(null, a, newval);
    return true
  }else {
    return false
  }
};
cljs.core.deref = function deref(o) {
  return cljs.core._deref.call(null, o)
};
cljs.core.set_validator_BANG_ = function set_validator_BANG_(iref, val) {
  return iref.validator = val
};
cljs.core.get_validator = function get_validator(iref) {
  return iref.validator
};
cljs.core.alter_meta_BANG_ = function() {
  var alter_meta_BANG___delegate = function(iref, f, args) {
    return iref.meta = cljs.core.apply.call(null, f, iref.meta, args)
  };
  var alter_meta_BANG_ = function(iref, f, var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
    }
    return alter_meta_BANG___delegate.call(this, iref, f, args)
  };
  alter_meta_BANG_.cljs$lang$maxFixedArity = 2;
  alter_meta_BANG_.cljs$lang$applyTo = function(arglist__17296) {
    var iref = cljs.core.first(arglist__17296);
    var f = cljs.core.first(cljs.core.next(arglist__17296));
    var args = cljs.core.rest(cljs.core.next(arglist__17296));
    return alter_meta_BANG___delegate(iref, f, args)
  };
  alter_meta_BANG_.cljs$lang$arity$variadic = alter_meta_BANG___delegate;
  return alter_meta_BANG_
}();
cljs.core.reset_meta_BANG_ = function reset_meta_BANG_(iref, m) {
  return iref.meta = m
};
cljs.core.add_watch = function add_watch(iref, key, f) {
  return cljs.core._add_watch.call(null, iref, key, f)
};
cljs.core.remove_watch = function remove_watch(iref, key) {
  return cljs.core._remove_watch.call(null, iref, key)
};
cljs.core.gensym_counter = null;
cljs.core.gensym = function() {
  var gensym = null;
  var gensym__0 = function() {
    return gensym.call(null, "G__")
  };
  var gensym__1 = function(prefix_string) {
    if(cljs.core.gensym_counter == null) {
      cljs.core.gensym_counter = cljs.core.atom.call(null, 0)
    }else {
    }
    return cljs.core.symbol.call(null, [cljs.core.str(prefix_string), cljs.core.str(cljs.core.swap_BANG_.call(null, cljs.core.gensym_counter, cljs.core.inc))].join(""))
  };
  gensym = function(prefix_string) {
    switch(arguments.length) {
      case 0:
        return gensym__0.call(this);
      case 1:
        return gensym__1.call(this, prefix_string)
    }
    throw"Invalid arity: " + arguments.length;
  };
  gensym.cljs$lang$arity$0 = gensym__0;
  gensym.cljs$lang$arity$1 = gensym__1;
  return gensym
}();
cljs.core.fixture1 = 1;
cljs.core.fixture2 = 2;
cljs.core.Delay = function(state, f) {
  this.state = state;
  this.f = f;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 1073774592
};
cljs.core.Delay.cljs$lang$type = true;
cljs.core.Delay.cljs$lang$ctorPrSeq = function(this__2309__auto__) {
  return cljs.core.list.call(null, "cljs.core/Delay")
};
cljs.core.Delay.prototype.cljs$core$IPending$_realized_QMARK_$arity$1 = function(d) {
  var this__17297 = this;
  return(new cljs.core.Keyword("\ufdd0'done")).call(null, cljs.core.deref.call(null, this__17297.state))
};
cljs.core.Delay.prototype.cljs$core$IDeref$_deref$arity$1 = function(_) {
  var this__17298 = this;
  return(new cljs.core.Keyword("\ufdd0'value")).call(null, cljs.core.swap_BANG_.call(null, this__17298.state, function(p__17299) {
    var map__17300__17301 = p__17299;
    var map__17300__17302 = cljs.core.seq_QMARK_.call(null, map__17300__17301) ? cljs.core.apply.call(null, cljs.core.hash_map, map__17300__17301) : map__17300__17301;
    var curr_state__17303 = map__17300__17302;
    var done__17304 = cljs.core._lookup.call(null, map__17300__17302, "\ufdd0'done", null);
    if(cljs.core.truth_(done__17304)) {
      return curr_state__17303
    }else {
      return cljs.core.ObjMap.fromObject(["\ufdd0'done", "\ufdd0'value"], {"\ufdd0'done":true, "\ufdd0'value":this__17298.f.call(null)})
    }
  }))
};
cljs.core.Delay;
cljs.core.delay_QMARK_ = function delay_QMARK_(x) {
  return cljs.core.instance_QMARK_.call(null, cljs.core.Delay, x)
};
cljs.core.force = function force(x) {
  if(cljs.core.delay_QMARK_.call(null, x)) {
    return cljs.core.deref.call(null, x)
  }else {
    return x
  }
};
cljs.core.realized_QMARK_ = function realized_QMARK_(d) {
  return cljs.core._realized_QMARK_.call(null, d)
};
cljs.core.js__GT_clj = function() {
  var js__GT_clj__delegate = function(x, options) {
    var map__17325__17326 = options;
    var map__17325__17327 = cljs.core.seq_QMARK_.call(null, map__17325__17326) ? cljs.core.apply.call(null, cljs.core.hash_map, map__17325__17326) : map__17325__17326;
    var keywordize_keys__17328 = cljs.core._lookup.call(null, map__17325__17327, "\ufdd0'keywordize-keys", null);
    var keyfn__17329 = cljs.core.truth_(keywordize_keys__17328) ? cljs.core.keyword : cljs.core.str;
    var f__17344 = function thisfn(x) {
      if(cljs.core.seq_QMARK_.call(null, x)) {
        return cljs.core.doall.call(null, cljs.core.map.call(null, thisfn, x))
      }else {
        if(cljs.core.coll_QMARK_.call(null, x)) {
          return cljs.core.into.call(null, cljs.core.empty.call(null, x), cljs.core.map.call(null, thisfn, x))
        }else {
          if(cljs.core.truth_(goog.isArray(x))) {
            return cljs.core.vec.call(null, cljs.core.map.call(null, thisfn, x))
          }else {
            if(cljs.core.type.call(null, x) === Object) {
              return cljs.core.into.call(null, cljs.core.ObjMap.EMPTY, function() {
                var iter__2462__auto____17343 = function iter__17337(s__17338) {
                  return new cljs.core.LazySeq(null, false, function() {
                    var s__17338__17341 = s__17338;
                    while(true) {
                      if(cljs.core.seq.call(null, s__17338__17341)) {
                        var k__17342 = cljs.core.first.call(null, s__17338__17341);
                        return cljs.core.cons.call(null, cljs.core.PersistentVector.fromArray([keyfn__17329.call(null, k__17342), thisfn.call(null, x[k__17342])], true), iter__17337.call(null, cljs.core.rest.call(null, s__17338__17341)))
                      }else {
                        return null
                      }
                      break
                    }
                  }, null)
                };
                return iter__2462__auto____17343.call(null, cljs.core.js_keys.call(null, x))
              }())
            }else {
              if("\ufdd0'else") {
                return x
              }else {
                return null
              }
            }
          }
        }
      }
    };
    return f__17344.call(null, x)
  };
  var js__GT_clj = function(x, var_args) {
    var options = null;
    if(goog.isDef(var_args)) {
      options = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return js__GT_clj__delegate.call(this, x, options)
  };
  js__GT_clj.cljs$lang$maxFixedArity = 1;
  js__GT_clj.cljs$lang$applyTo = function(arglist__17345) {
    var x = cljs.core.first(arglist__17345);
    var options = cljs.core.rest(arglist__17345);
    return js__GT_clj__delegate(x, options)
  };
  js__GT_clj.cljs$lang$arity$variadic = js__GT_clj__delegate;
  return js__GT_clj
}();
cljs.core.memoize = function memoize(f) {
  var mem__17350 = cljs.core.atom.call(null, cljs.core.ObjMap.EMPTY);
  return function() {
    var G__17354__delegate = function(args) {
      var temp__3971__auto____17351 = cljs.core._lookup.call(null, cljs.core.deref.call(null, mem__17350), args, null);
      if(cljs.core.truth_(temp__3971__auto____17351)) {
        var v__17352 = temp__3971__auto____17351;
        return v__17352
      }else {
        var ret__17353 = cljs.core.apply.call(null, f, args);
        cljs.core.swap_BANG_.call(null, mem__17350, cljs.core.assoc, args, ret__17353);
        return ret__17353
      }
    };
    var G__17354 = function(var_args) {
      var args = null;
      if(goog.isDef(var_args)) {
        args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
      }
      return G__17354__delegate.call(this, args)
    };
    G__17354.cljs$lang$maxFixedArity = 0;
    G__17354.cljs$lang$applyTo = function(arglist__17355) {
      var args = cljs.core.seq(arglist__17355);
      return G__17354__delegate(args)
    };
    G__17354.cljs$lang$arity$variadic = G__17354__delegate;
    return G__17354
  }()
};
cljs.core.trampoline = function() {
  var trampoline = null;
  var trampoline__1 = function(f) {
    while(true) {
      var ret__17357 = f.call(null);
      if(cljs.core.fn_QMARK_.call(null, ret__17357)) {
        var G__17358 = ret__17357;
        f = G__17358;
        continue
      }else {
        return ret__17357
      }
      break
    }
  };
  var trampoline__2 = function() {
    var G__17359__delegate = function(f, args) {
      return trampoline.call(null, function() {
        return cljs.core.apply.call(null, f, args)
      })
    };
    var G__17359 = function(f, var_args) {
      var args = null;
      if(goog.isDef(var_args)) {
        args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__17359__delegate.call(this, f, args)
    };
    G__17359.cljs$lang$maxFixedArity = 1;
    G__17359.cljs$lang$applyTo = function(arglist__17360) {
      var f = cljs.core.first(arglist__17360);
      var args = cljs.core.rest(arglist__17360);
      return G__17359__delegate(f, args)
    };
    G__17359.cljs$lang$arity$variadic = G__17359__delegate;
    return G__17359
  }();
  trampoline = function(f, var_args) {
    var args = var_args;
    switch(arguments.length) {
      case 1:
        return trampoline__1.call(this, f);
      default:
        return trampoline__2.cljs$lang$arity$variadic(f, cljs.core.array_seq(arguments, 1))
    }
    throw"Invalid arity: " + arguments.length;
  };
  trampoline.cljs$lang$maxFixedArity = 1;
  trampoline.cljs$lang$applyTo = trampoline__2.cljs$lang$applyTo;
  trampoline.cljs$lang$arity$1 = trampoline__1;
  trampoline.cljs$lang$arity$variadic = trampoline__2.cljs$lang$arity$variadic;
  return trampoline
}();
cljs.core.rand = function() {
  var rand = null;
  var rand__0 = function() {
    return rand.call(null, 1)
  };
  var rand__1 = function(n) {
    return Math.random.call(null) * n
  };
  rand = function(n) {
    switch(arguments.length) {
      case 0:
        return rand__0.call(this);
      case 1:
        return rand__1.call(this, n)
    }
    throw"Invalid arity: " + arguments.length;
  };
  rand.cljs$lang$arity$0 = rand__0;
  rand.cljs$lang$arity$1 = rand__1;
  return rand
}();
cljs.core.rand_int = function rand_int(n) {
  return Math.floor.call(null, Math.random.call(null) * n)
};
cljs.core.rand_nth = function rand_nth(coll) {
  return cljs.core.nth.call(null, coll, cljs.core.rand_int.call(null, cljs.core.count.call(null, coll)))
};
cljs.core.group_by = function group_by(f, coll) {
  return cljs.core.reduce.call(null, function(ret, x) {
    var k__17362 = f.call(null, x);
    return cljs.core.assoc.call(null, ret, k__17362, cljs.core.conj.call(null, cljs.core._lookup.call(null, ret, k__17362, cljs.core.PersistentVector.EMPTY), x))
  }, cljs.core.ObjMap.EMPTY, coll)
};
cljs.core.make_hierarchy = function make_hierarchy() {
  return cljs.core.ObjMap.fromObject(["\ufdd0'parents", "\ufdd0'descendants", "\ufdd0'ancestors"], {"\ufdd0'parents":cljs.core.ObjMap.EMPTY, "\ufdd0'descendants":cljs.core.ObjMap.EMPTY, "\ufdd0'ancestors":cljs.core.ObjMap.EMPTY})
};
cljs.core.global_hierarchy = cljs.core.atom.call(null, cljs.core.make_hierarchy.call(null));
cljs.core.isa_QMARK_ = function() {
  var isa_QMARK_ = null;
  var isa_QMARK___2 = function(child, parent) {
    return isa_QMARK_.call(null, cljs.core.deref.call(null, cljs.core.global_hierarchy), child, parent)
  };
  var isa_QMARK___3 = function(h, child, parent) {
    var or__3824__auto____17371 = cljs.core._EQ_.call(null, child, parent);
    if(or__3824__auto____17371) {
      return or__3824__auto____17371
    }else {
      var or__3824__auto____17372 = cljs.core.contains_QMARK_.call(null, (new cljs.core.Keyword("\ufdd0'ancestors")).call(null, h).call(null, child), parent);
      if(or__3824__auto____17372) {
        return or__3824__auto____17372
      }else {
        var and__3822__auto____17373 = cljs.core.vector_QMARK_.call(null, parent);
        if(and__3822__auto____17373) {
          var and__3822__auto____17374 = cljs.core.vector_QMARK_.call(null, child);
          if(and__3822__auto____17374) {
            var and__3822__auto____17375 = cljs.core.count.call(null, parent) === cljs.core.count.call(null, child);
            if(and__3822__auto____17375) {
              var ret__17376 = true;
              var i__17377 = 0;
              while(true) {
                if(function() {
                  var or__3824__auto____17378 = cljs.core.not.call(null, ret__17376);
                  if(or__3824__auto____17378) {
                    return or__3824__auto____17378
                  }else {
                    return i__17377 === cljs.core.count.call(null, parent)
                  }
                }()) {
                  return ret__17376
                }else {
                  var G__17379 = isa_QMARK_.call(null, h, child.call(null, i__17377), parent.call(null, i__17377));
                  var G__17380 = i__17377 + 1;
                  ret__17376 = G__17379;
                  i__17377 = G__17380;
                  continue
                }
                break
              }
            }else {
              return and__3822__auto____17375
            }
          }else {
            return and__3822__auto____17374
          }
        }else {
          return and__3822__auto____17373
        }
      }
    }
  };
  isa_QMARK_ = function(h, child, parent) {
    switch(arguments.length) {
      case 2:
        return isa_QMARK___2.call(this, h, child);
      case 3:
        return isa_QMARK___3.call(this, h, child, parent)
    }
    throw"Invalid arity: " + arguments.length;
  };
  isa_QMARK_.cljs$lang$arity$2 = isa_QMARK___2;
  isa_QMARK_.cljs$lang$arity$3 = isa_QMARK___3;
  return isa_QMARK_
}();
cljs.core.parents = function() {
  var parents = null;
  var parents__1 = function(tag) {
    return parents.call(null, cljs.core.deref.call(null, cljs.core.global_hierarchy), tag)
  };
  var parents__2 = function(h, tag) {
    return cljs.core.not_empty.call(null, cljs.core._lookup.call(null, (new cljs.core.Keyword("\ufdd0'parents")).call(null, h), tag, null))
  };
  parents = function(h, tag) {
    switch(arguments.length) {
      case 1:
        return parents__1.call(this, h);
      case 2:
        return parents__2.call(this, h, tag)
    }
    throw"Invalid arity: " + arguments.length;
  };
  parents.cljs$lang$arity$1 = parents__1;
  parents.cljs$lang$arity$2 = parents__2;
  return parents
}();
cljs.core.ancestors = function() {
  var ancestors = null;
  var ancestors__1 = function(tag) {
    return ancestors.call(null, cljs.core.deref.call(null, cljs.core.global_hierarchy), tag)
  };
  var ancestors__2 = function(h, tag) {
    return cljs.core.not_empty.call(null, cljs.core._lookup.call(null, (new cljs.core.Keyword("\ufdd0'ancestors")).call(null, h), tag, null))
  };
  ancestors = function(h, tag) {
    switch(arguments.length) {
      case 1:
        return ancestors__1.call(this, h);
      case 2:
        return ancestors__2.call(this, h, tag)
    }
    throw"Invalid arity: " + arguments.length;
  };
  ancestors.cljs$lang$arity$1 = ancestors__1;
  ancestors.cljs$lang$arity$2 = ancestors__2;
  return ancestors
}();
cljs.core.descendants = function() {
  var descendants = null;
  var descendants__1 = function(tag) {
    return descendants.call(null, cljs.core.deref.call(null, cljs.core.global_hierarchy), tag)
  };
  var descendants__2 = function(h, tag) {
    return cljs.core.not_empty.call(null, cljs.core._lookup.call(null, (new cljs.core.Keyword("\ufdd0'descendants")).call(null, h), tag, null))
  };
  descendants = function(h, tag) {
    switch(arguments.length) {
      case 1:
        return descendants__1.call(this, h);
      case 2:
        return descendants__2.call(this, h, tag)
    }
    throw"Invalid arity: " + arguments.length;
  };
  descendants.cljs$lang$arity$1 = descendants__1;
  descendants.cljs$lang$arity$2 = descendants__2;
  return descendants
}();
cljs.core.derive = function() {
  var derive = null;
  var derive__2 = function(tag, parent) {
    if(cljs.core.truth_(cljs.core.namespace.call(null, parent))) {
    }else {
      throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'namespace", "\ufdd1'parent"), cljs.core.hash_map("\ufdd0'line", 6724))))].join(""));
    }
    cljs.core.swap_BANG_.call(null, cljs.core.global_hierarchy, derive, tag, parent);
    return null
  };
  var derive__3 = function(h, tag, parent) {
    if(cljs.core.not_EQ_.call(null, tag, parent)) {
    }else {
      throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'not=", "\ufdd1'tag", "\ufdd1'parent"), cljs.core.hash_map("\ufdd0'line", 6728))))].join(""));
    }
    var tp__17389 = (new cljs.core.Keyword("\ufdd0'parents")).call(null, h);
    var td__17390 = (new cljs.core.Keyword("\ufdd0'descendants")).call(null, h);
    var ta__17391 = (new cljs.core.Keyword("\ufdd0'ancestors")).call(null, h);
    var tf__17392 = function(m, source, sources, target, targets) {
      return cljs.core.reduce.call(null, function(ret, k) {
        return cljs.core.assoc.call(null, ret, k, cljs.core.reduce.call(null, cljs.core.conj, cljs.core._lookup.call(null, targets, k, cljs.core.PersistentHashSet.EMPTY), cljs.core.cons.call(null, target, targets.call(null, target))))
      }, m, cljs.core.cons.call(null, source, sources.call(null, source)))
    };
    var or__3824__auto____17393 = cljs.core.contains_QMARK_.call(null, tp__17389.call(null, tag), parent) ? null : function() {
      if(cljs.core.contains_QMARK_.call(null, ta__17391.call(null, tag), parent)) {
        throw new Error([cljs.core.str(tag), cljs.core.str("already has"), cljs.core.str(parent), cljs.core.str("as ancestor")].join(""));
      }else {
      }
      if(cljs.core.contains_QMARK_.call(null, ta__17391.call(null, parent), tag)) {
        throw new Error([cljs.core.str("Cyclic derivation:"), cljs.core.str(parent), cljs.core.str("has"), cljs.core.str(tag), cljs.core.str("as ancestor")].join(""));
      }else {
      }
      return cljs.core.ObjMap.fromObject(["\ufdd0'parents", "\ufdd0'ancestors", "\ufdd0'descendants"], {"\ufdd0'parents":cljs.core.assoc.call(null, (new cljs.core.Keyword("\ufdd0'parents")).call(null, h), tag, cljs.core.conj.call(null, cljs.core._lookup.call(null, tp__17389, tag, cljs.core.PersistentHashSet.EMPTY), parent)), "\ufdd0'ancestors":tf__17392.call(null, (new cljs.core.Keyword("\ufdd0'ancestors")).call(null, h), tag, td__17390, parent, ta__17391), "\ufdd0'descendants":tf__17392.call(null, 
      (new cljs.core.Keyword("\ufdd0'descendants")).call(null, h), parent, ta__17391, tag, td__17390)})
    }();
    if(cljs.core.truth_(or__3824__auto____17393)) {
      return or__3824__auto____17393
    }else {
      return h
    }
  };
  derive = function(h, tag, parent) {
    switch(arguments.length) {
      case 2:
        return derive__2.call(this, h, tag);
      case 3:
        return derive__3.call(this, h, tag, parent)
    }
    throw"Invalid arity: " + arguments.length;
  };
  derive.cljs$lang$arity$2 = derive__2;
  derive.cljs$lang$arity$3 = derive__3;
  return derive
}();
cljs.core.underive = function() {
  var underive = null;
  var underive__2 = function(tag, parent) {
    cljs.core.swap_BANG_.call(null, cljs.core.global_hierarchy, underive, tag, parent);
    return null
  };
  var underive__3 = function(h, tag, parent) {
    var parentMap__17398 = (new cljs.core.Keyword("\ufdd0'parents")).call(null, h);
    var childsParents__17399 = cljs.core.truth_(parentMap__17398.call(null, tag)) ? cljs.core.disj.call(null, parentMap__17398.call(null, tag), parent) : cljs.core.PersistentHashSet.EMPTY;
    var newParents__17400 = cljs.core.truth_(cljs.core.not_empty.call(null, childsParents__17399)) ? cljs.core.assoc.call(null, parentMap__17398, tag, childsParents__17399) : cljs.core.dissoc.call(null, parentMap__17398, tag);
    var deriv_seq__17401 = cljs.core.flatten.call(null, cljs.core.map.call(null, function(p1__17381_SHARP_) {
      return cljs.core.cons.call(null, cljs.core.first.call(null, p1__17381_SHARP_), cljs.core.interpose.call(null, cljs.core.first.call(null, p1__17381_SHARP_), cljs.core.second.call(null, p1__17381_SHARP_)))
    }, cljs.core.seq.call(null, newParents__17400)));
    if(cljs.core.contains_QMARK_.call(null, parentMap__17398.call(null, tag), parent)) {
      return cljs.core.reduce.call(null, function(p1__17382_SHARP_, p2__17383_SHARP_) {
        return cljs.core.apply.call(null, cljs.core.derive, p1__17382_SHARP_, p2__17383_SHARP_)
      }, cljs.core.make_hierarchy.call(null), cljs.core.partition.call(null, 2, deriv_seq__17401))
    }else {
      return h
    }
  };
  underive = function(h, tag, parent) {
    switch(arguments.length) {
      case 2:
        return underive__2.call(this, h, tag);
      case 3:
        return underive__3.call(this, h, tag, parent)
    }
    throw"Invalid arity: " + arguments.length;
  };
  underive.cljs$lang$arity$2 = underive__2;
  underive.cljs$lang$arity$3 = underive__3;
  return underive
}();
cljs.core.reset_cache = function reset_cache(method_cache, method_table, cached_hierarchy, hierarchy) {
  cljs.core.swap_BANG_.call(null, method_cache, function(_) {
    return cljs.core.deref.call(null, method_table)
  });
  return cljs.core.swap_BANG_.call(null, cached_hierarchy, function(_) {
    return cljs.core.deref.call(null, hierarchy)
  })
};
cljs.core.prefers_STAR_ = function prefers_STAR_(x, y, prefer_table) {
  var xprefs__17409 = cljs.core.deref.call(null, prefer_table).call(null, x);
  var or__3824__auto____17411 = cljs.core.truth_(function() {
    var and__3822__auto____17410 = xprefs__17409;
    if(cljs.core.truth_(and__3822__auto____17410)) {
      return xprefs__17409.call(null, y)
    }else {
      return and__3822__auto____17410
    }
  }()) ? true : null;
  if(cljs.core.truth_(or__3824__auto____17411)) {
    return or__3824__auto____17411
  }else {
    var or__3824__auto____17413 = function() {
      var ps__17412 = cljs.core.parents.call(null, y);
      while(true) {
        if(cljs.core.count.call(null, ps__17412) > 0) {
          if(cljs.core.truth_(prefers_STAR_.call(null, x, cljs.core.first.call(null, ps__17412), prefer_table))) {
          }else {
          }
          var G__17416 = cljs.core.rest.call(null, ps__17412);
          ps__17412 = G__17416;
          continue
        }else {
          return null
        }
        break
      }
    }();
    if(cljs.core.truth_(or__3824__auto____17413)) {
      return or__3824__auto____17413
    }else {
      var or__3824__auto____17415 = function() {
        var ps__17414 = cljs.core.parents.call(null, x);
        while(true) {
          if(cljs.core.count.call(null, ps__17414) > 0) {
            if(cljs.core.truth_(prefers_STAR_.call(null, cljs.core.first.call(null, ps__17414), y, prefer_table))) {
            }else {
            }
            var G__17417 = cljs.core.rest.call(null, ps__17414);
            ps__17414 = G__17417;
            continue
          }else {
            return null
          }
          break
        }
      }();
      if(cljs.core.truth_(or__3824__auto____17415)) {
        return or__3824__auto____17415
      }else {
        return false
      }
    }
  }
};
cljs.core.dominates = function dominates(x, y, prefer_table) {
  var or__3824__auto____17419 = cljs.core.prefers_STAR_.call(null, x, y, prefer_table);
  if(cljs.core.truth_(or__3824__auto____17419)) {
    return or__3824__auto____17419
  }else {
    return cljs.core.isa_QMARK_.call(null, x, y)
  }
};
cljs.core.find_and_cache_best_method = function find_and_cache_best_method(name, dispatch_val, hierarchy, method_table, prefer_table, method_cache, cached_hierarchy) {
  var best_entry__17437 = cljs.core.reduce.call(null, function(be, p__17429) {
    var vec__17430__17431 = p__17429;
    var k__17432 = cljs.core.nth.call(null, vec__17430__17431, 0, null);
    var ___17433 = cljs.core.nth.call(null, vec__17430__17431, 1, null);
    var e__17434 = vec__17430__17431;
    if(cljs.core.isa_QMARK_.call(null, dispatch_val, k__17432)) {
      var be2__17436 = cljs.core.truth_(function() {
        var or__3824__auto____17435 = be == null;
        if(or__3824__auto____17435) {
          return or__3824__auto____17435
        }else {
          return cljs.core.dominates.call(null, k__17432, cljs.core.first.call(null, be), prefer_table)
        }
      }()) ? e__17434 : be;
      if(cljs.core.truth_(cljs.core.dominates.call(null, cljs.core.first.call(null, be2__17436), k__17432, prefer_table))) {
      }else {
        throw new Error([cljs.core.str("Multiple methods in multimethod '"), cljs.core.str(name), cljs.core.str("' match dispatch value: "), cljs.core.str(dispatch_val), cljs.core.str(" -> "), cljs.core.str(k__17432), cljs.core.str(" and "), cljs.core.str(cljs.core.first.call(null, be2__17436)), cljs.core.str(", and neither is preferred")].join(""));
      }
      return be2__17436
    }else {
      return be
    }
  }, null, cljs.core.deref.call(null, method_table));
  if(cljs.core.truth_(best_entry__17437)) {
    if(cljs.core._EQ_.call(null, cljs.core.deref.call(null, cached_hierarchy), cljs.core.deref.call(null, hierarchy))) {
      cljs.core.swap_BANG_.call(null, method_cache, cljs.core.assoc, dispatch_val, cljs.core.second.call(null, best_entry__17437));
      return cljs.core.second.call(null, best_entry__17437)
    }else {
      cljs.core.reset_cache.call(null, method_cache, method_table, cached_hierarchy, hierarchy);
      return find_and_cache_best_method.call(null, name, dispatch_val, hierarchy, method_table, prefer_table, method_cache, cached_hierarchy)
    }
  }else {
    return null
  }
};
cljs.core.IMultiFn = {};
cljs.core._reset = function _reset(mf) {
  if(function() {
    var and__3822__auto____17442 = mf;
    if(and__3822__auto____17442) {
      return mf.cljs$core$IMultiFn$_reset$arity$1
    }else {
      return and__3822__auto____17442
    }
  }()) {
    return mf.cljs$core$IMultiFn$_reset$arity$1(mf)
  }else {
    var x__2363__auto____17443 = mf == null ? null : mf;
    return function() {
      var or__3824__auto____17444 = cljs.core._reset[goog.typeOf(x__2363__auto____17443)];
      if(or__3824__auto____17444) {
        return or__3824__auto____17444
      }else {
        var or__3824__auto____17445 = cljs.core._reset["_"];
        if(or__3824__auto____17445) {
          return or__3824__auto____17445
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-reset", mf);
        }
      }
    }().call(null, mf)
  }
};
cljs.core._add_method = function _add_method(mf, dispatch_val, method) {
  if(function() {
    var and__3822__auto____17450 = mf;
    if(and__3822__auto____17450) {
      return mf.cljs$core$IMultiFn$_add_method$arity$3
    }else {
      return and__3822__auto____17450
    }
  }()) {
    return mf.cljs$core$IMultiFn$_add_method$arity$3(mf, dispatch_val, method)
  }else {
    var x__2363__auto____17451 = mf == null ? null : mf;
    return function() {
      var or__3824__auto____17452 = cljs.core._add_method[goog.typeOf(x__2363__auto____17451)];
      if(or__3824__auto____17452) {
        return or__3824__auto____17452
      }else {
        var or__3824__auto____17453 = cljs.core._add_method["_"];
        if(or__3824__auto____17453) {
          return or__3824__auto____17453
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-add-method", mf);
        }
      }
    }().call(null, mf, dispatch_val, method)
  }
};
cljs.core._remove_method = function _remove_method(mf, dispatch_val) {
  if(function() {
    var and__3822__auto____17458 = mf;
    if(and__3822__auto____17458) {
      return mf.cljs$core$IMultiFn$_remove_method$arity$2
    }else {
      return and__3822__auto____17458
    }
  }()) {
    return mf.cljs$core$IMultiFn$_remove_method$arity$2(mf, dispatch_val)
  }else {
    var x__2363__auto____17459 = mf == null ? null : mf;
    return function() {
      var or__3824__auto____17460 = cljs.core._remove_method[goog.typeOf(x__2363__auto____17459)];
      if(or__3824__auto____17460) {
        return or__3824__auto____17460
      }else {
        var or__3824__auto____17461 = cljs.core._remove_method["_"];
        if(or__3824__auto____17461) {
          return or__3824__auto____17461
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-remove-method", mf);
        }
      }
    }().call(null, mf, dispatch_val)
  }
};
cljs.core._prefer_method = function _prefer_method(mf, dispatch_val, dispatch_val_y) {
  if(function() {
    var and__3822__auto____17466 = mf;
    if(and__3822__auto____17466) {
      return mf.cljs$core$IMultiFn$_prefer_method$arity$3
    }else {
      return and__3822__auto____17466
    }
  }()) {
    return mf.cljs$core$IMultiFn$_prefer_method$arity$3(mf, dispatch_val, dispatch_val_y)
  }else {
    var x__2363__auto____17467 = mf == null ? null : mf;
    return function() {
      var or__3824__auto____17468 = cljs.core._prefer_method[goog.typeOf(x__2363__auto____17467)];
      if(or__3824__auto____17468) {
        return or__3824__auto____17468
      }else {
        var or__3824__auto____17469 = cljs.core._prefer_method["_"];
        if(or__3824__auto____17469) {
          return or__3824__auto____17469
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-prefer-method", mf);
        }
      }
    }().call(null, mf, dispatch_val, dispatch_val_y)
  }
};
cljs.core._get_method = function _get_method(mf, dispatch_val) {
  if(function() {
    var and__3822__auto____17474 = mf;
    if(and__3822__auto____17474) {
      return mf.cljs$core$IMultiFn$_get_method$arity$2
    }else {
      return and__3822__auto____17474
    }
  }()) {
    return mf.cljs$core$IMultiFn$_get_method$arity$2(mf, dispatch_val)
  }else {
    var x__2363__auto____17475 = mf == null ? null : mf;
    return function() {
      var or__3824__auto____17476 = cljs.core._get_method[goog.typeOf(x__2363__auto____17475)];
      if(or__3824__auto____17476) {
        return or__3824__auto____17476
      }else {
        var or__3824__auto____17477 = cljs.core._get_method["_"];
        if(or__3824__auto____17477) {
          return or__3824__auto____17477
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-get-method", mf);
        }
      }
    }().call(null, mf, dispatch_val)
  }
};
cljs.core._methods = function _methods(mf) {
  if(function() {
    var and__3822__auto____17482 = mf;
    if(and__3822__auto____17482) {
      return mf.cljs$core$IMultiFn$_methods$arity$1
    }else {
      return and__3822__auto____17482
    }
  }()) {
    return mf.cljs$core$IMultiFn$_methods$arity$1(mf)
  }else {
    var x__2363__auto____17483 = mf == null ? null : mf;
    return function() {
      var or__3824__auto____17484 = cljs.core._methods[goog.typeOf(x__2363__auto____17483)];
      if(or__3824__auto____17484) {
        return or__3824__auto____17484
      }else {
        var or__3824__auto____17485 = cljs.core._methods["_"];
        if(or__3824__auto____17485) {
          return or__3824__auto____17485
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-methods", mf);
        }
      }
    }().call(null, mf)
  }
};
cljs.core._prefers = function _prefers(mf) {
  if(function() {
    var and__3822__auto____17490 = mf;
    if(and__3822__auto____17490) {
      return mf.cljs$core$IMultiFn$_prefers$arity$1
    }else {
      return and__3822__auto____17490
    }
  }()) {
    return mf.cljs$core$IMultiFn$_prefers$arity$1(mf)
  }else {
    var x__2363__auto____17491 = mf == null ? null : mf;
    return function() {
      var or__3824__auto____17492 = cljs.core._prefers[goog.typeOf(x__2363__auto____17491)];
      if(or__3824__auto____17492) {
        return or__3824__auto____17492
      }else {
        var or__3824__auto____17493 = cljs.core._prefers["_"];
        if(or__3824__auto____17493) {
          return or__3824__auto____17493
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-prefers", mf);
        }
      }
    }().call(null, mf)
  }
};
cljs.core._dispatch = function _dispatch(mf, args) {
  if(function() {
    var and__3822__auto____17498 = mf;
    if(and__3822__auto____17498) {
      return mf.cljs$core$IMultiFn$_dispatch$arity$2
    }else {
      return and__3822__auto____17498
    }
  }()) {
    return mf.cljs$core$IMultiFn$_dispatch$arity$2(mf, args)
  }else {
    var x__2363__auto____17499 = mf == null ? null : mf;
    return function() {
      var or__3824__auto____17500 = cljs.core._dispatch[goog.typeOf(x__2363__auto____17499)];
      if(or__3824__auto____17500) {
        return or__3824__auto____17500
      }else {
        var or__3824__auto____17501 = cljs.core._dispatch["_"];
        if(or__3824__auto____17501) {
          return or__3824__auto____17501
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-dispatch", mf);
        }
      }
    }().call(null, mf, args)
  }
};
cljs.core.do_dispatch = function do_dispatch(mf, dispatch_fn, args) {
  var dispatch_val__17504 = cljs.core.apply.call(null, dispatch_fn, args);
  var target_fn__17505 = cljs.core._get_method.call(null, mf, dispatch_val__17504);
  if(cljs.core.truth_(target_fn__17505)) {
  }else {
    throw new Error([cljs.core.str("No method in multimethod '"), cljs.core.str(cljs.core.name), cljs.core.str("' for dispatch value: "), cljs.core.str(dispatch_val__17504)].join(""));
  }
  return cljs.core.apply.call(null, target_fn__17505, args)
};
cljs.core.MultiFn = function(name, dispatch_fn, default_dispatch_val, hierarchy, method_table, prefer_table, method_cache, cached_hierarchy) {
  this.name = name;
  this.dispatch_fn = dispatch_fn;
  this.default_dispatch_val = default_dispatch_val;
  this.hierarchy = hierarchy;
  this.method_table = method_table;
  this.prefer_table = prefer_table;
  this.method_cache = method_cache;
  this.cached_hierarchy = cached_hierarchy;
  this.cljs$lang$protocol_mask$partition0$ = 4194304;
  this.cljs$lang$protocol_mask$partition1$ = 64
};
cljs.core.MultiFn.cljs$lang$type = true;
cljs.core.MultiFn.cljs$lang$ctorPrSeq = function(this__2309__auto__) {
  return cljs.core.list.call(null, "cljs.core/MultiFn")
};
cljs.core.MultiFn.prototype.cljs$core$IHash$_hash$arity$1 = function(this$) {
  var this__17506 = this;
  return goog.getUid(this$)
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_reset$arity$1 = function(mf) {
  var this__17507 = this;
  cljs.core.swap_BANG_.call(null, this__17507.method_table, function(mf) {
    return cljs.core.ObjMap.EMPTY
  });
  cljs.core.swap_BANG_.call(null, this__17507.method_cache, function(mf) {
    return cljs.core.ObjMap.EMPTY
  });
  cljs.core.swap_BANG_.call(null, this__17507.prefer_table, function(mf) {
    return cljs.core.ObjMap.EMPTY
  });
  cljs.core.swap_BANG_.call(null, this__17507.cached_hierarchy, function(mf) {
    return null
  });
  return mf
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_add_method$arity$3 = function(mf, dispatch_val, method) {
  var this__17508 = this;
  cljs.core.swap_BANG_.call(null, this__17508.method_table, cljs.core.assoc, dispatch_val, method);
  cljs.core.reset_cache.call(null, this__17508.method_cache, this__17508.method_table, this__17508.cached_hierarchy, this__17508.hierarchy);
  return mf
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_remove_method$arity$2 = function(mf, dispatch_val) {
  var this__17509 = this;
  cljs.core.swap_BANG_.call(null, this__17509.method_table, cljs.core.dissoc, dispatch_val);
  cljs.core.reset_cache.call(null, this__17509.method_cache, this__17509.method_table, this__17509.cached_hierarchy, this__17509.hierarchy);
  return mf
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_get_method$arity$2 = function(mf, dispatch_val) {
  var this__17510 = this;
  if(cljs.core._EQ_.call(null, cljs.core.deref.call(null, this__17510.cached_hierarchy), cljs.core.deref.call(null, this__17510.hierarchy))) {
  }else {
    cljs.core.reset_cache.call(null, this__17510.method_cache, this__17510.method_table, this__17510.cached_hierarchy, this__17510.hierarchy)
  }
  var temp__3971__auto____17511 = cljs.core.deref.call(null, this__17510.method_cache).call(null, dispatch_val);
  if(cljs.core.truth_(temp__3971__auto____17511)) {
    var target_fn__17512 = temp__3971__auto____17511;
    return target_fn__17512
  }else {
    var temp__3971__auto____17513 = cljs.core.find_and_cache_best_method.call(null, this__17510.name, dispatch_val, this__17510.hierarchy, this__17510.method_table, this__17510.prefer_table, this__17510.method_cache, this__17510.cached_hierarchy);
    if(cljs.core.truth_(temp__3971__auto____17513)) {
      var target_fn__17514 = temp__3971__auto____17513;
      return target_fn__17514
    }else {
      return cljs.core.deref.call(null, this__17510.method_table).call(null, this__17510.default_dispatch_val)
    }
  }
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_prefer_method$arity$3 = function(mf, dispatch_val_x, dispatch_val_y) {
  var this__17515 = this;
  if(cljs.core.truth_(cljs.core.prefers_STAR_.call(null, dispatch_val_x, dispatch_val_y, this__17515.prefer_table))) {
    throw new Error([cljs.core.str("Preference conflict in multimethod '"), cljs.core.str(this__17515.name), cljs.core.str("': "), cljs.core.str(dispatch_val_y), cljs.core.str(" is already preferred to "), cljs.core.str(dispatch_val_x)].join(""));
  }else {
  }
  cljs.core.swap_BANG_.call(null, this__17515.prefer_table, function(old) {
    return cljs.core.assoc.call(null, old, dispatch_val_x, cljs.core.conj.call(null, cljs.core._lookup.call(null, old, dispatch_val_x, cljs.core.PersistentHashSet.EMPTY), dispatch_val_y))
  });
  return cljs.core.reset_cache.call(null, this__17515.method_cache, this__17515.method_table, this__17515.cached_hierarchy, this__17515.hierarchy)
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_methods$arity$1 = function(mf) {
  var this__17516 = this;
  return cljs.core.deref.call(null, this__17516.method_table)
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_prefers$arity$1 = function(mf) {
  var this__17517 = this;
  return cljs.core.deref.call(null, this__17517.prefer_table)
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_dispatch$arity$2 = function(mf, args) {
  var this__17518 = this;
  return cljs.core.do_dispatch.call(null, mf, this__17518.dispatch_fn, args)
};
cljs.core.MultiFn;
cljs.core.MultiFn.prototype.call = function() {
  var G__17520__delegate = function(_, args) {
    var self__17519 = this;
    return cljs.core._dispatch.call(null, self__17519, args)
  };
  var G__17520 = function(_, var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return G__17520__delegate.call(this, _, args)
  };
  G__17520.cljs$lang$maxFixedArity = 1;
  G__17520.cljs$lang$applyTo = function(arglist__17521) {
    var _ = cljs.core.first(arglist__17521);
    var args = cljs.core.rest(arglist__17521);
    return G__17520__delegate(_, args)
  };
  G__17520.cljs$lang$arity$variadic = G__17520__delegate;
  return G__17520
}();
cljs.core.MultiFn.prototype.apply = function(_, args) {
  var self__17522 = this;
  return cljs.core._dispatch.call(null, self__17522, args)
};
cljs.core.remove_all_methods = function remove_all_methods(multifn) {
  return cljs.core._reset.call(null, multifn)
};
cljs.core.remove_method = function remove_method(multifn, dispatch_val) {
  return cljs.core._remove_method.call(null, multifn, dispatch_val)
};
cljs.core.prefer_method = function prefer_method(multifn, dispatch_val_x, dispatch_val_y) {
  return cljs.core._prefer_method.call(null, multifn, dispatch_val_x, dispatch_val_y)
};
cljs.core.methods$ = function methods$(multifn) {
  return cljs.core._methods.call(null, multifn)
};
cljs.core.get_method = function get_method(multifn, dispatch_val) {
  return cljs.core._get_method.call(null, multifn, dispatch_val)
};
cljs.core.prefers = function prefers(multifn) {
  return cljs.core._prefers.call(null, multifn)
};
cljs.core.UUID = function(uuid) {
  this.uuid = uuid;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 543162368
};
cljs.core.UUID.cljs$lang$type = true;
cljs.core.UUID.cljs$lang$ctorPrSeq = function(this__2309__auto__) {
  return cljs.core.list.call(null, "cljs.core/UUID")
};
cljs.core.UUID.prototype.cljs$core$IHash$_hash$arity$1 = function(this$) {
  var this__17523 = this;
  return goog.string.hashCode(cljs.core.pr_str.call(null, this$))
};
cljs.core.UUID.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(_17525, _) {
  var this__17524 = this;
  return cljs.core.list.call(null, [cljs.core.str('#uuid "'), cljs.core.str(this__17524.uuid), cljs.core.str('"')].join(""))
};
cljs.core.UUID.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(_, other) {
  var this__17526 = this;
  var and__3822__auto____17527 = cljs.core.instance_QMARK_.call(null, cljs.core.UUID, other);
  if(and__3822__auto____17527) {
    return this__17526.uuid === other.uuid
  }else {
    return and__3822__auto____17527
  }
};
cljs.core.UUID.prototype.toString = function() {
  var this__17528 = this;
  var this__17529 = this;
  return cljs.core.pr_str.call(null, this__17529)
};
cljs.core.UUID;
goog.provide("goog.userAgent");
goog.require("goog.string");
goog.userAgent.ASSUME_IE = false;
goog.userAgent.ASSUME_GECKO = false;
goog.userAgent.ASSUME_WEBKIT = false;
goog.userAgent.ASSUME_MOBILE_WEBKIT = false;
goog.userAgent.ASSUME_OPERA = false;
goog.userAgent.BROWSER_KNOWN_ = goog.userAgent.ASSUME_IE || goog.userAgent.ASSUME_GECKO || goog.userAgent.ASSUME_MOBILE_WEBKIT || goog.userAgent.ASSUME_WEBKIT || goog.userAgent.ASSUME_OPERA;
goog.userAgent.getUserAgentString = function() {
  return goog.global["navigator"] ? goog.global["navigator"].userAgent : null
};
goog.userAgent.getNavigator = function() {
  return goog.global["navigator"]
};
goog.userAgent.init_ = function() {
  goog.userAgent.detectedOpera_ = false;
  goog.userAgent.detectedIe_ = false;
  goog.userAgent.detectedWebkit_ = false;
  goog.userAgent.detectedMobile_ = false;
  goog.userAgent.detectedGecko_ = false;
  var ua;
  if(!goog.userAgent.BROWSER_KNOWN_ && (ua = goog.userAgent.getUserAgentString())) {
    var navigator = goog.userAgent.getNavigator();
    goog.userAgent.detectedOpera_ = ua.indexOf("Opera") == 0;
    goog.userAgent.detectedIe_ = !goog.userAgent.detectedOpera_ && ua.indexOf("MSIE") != -1;
    goog.userAgent.detectedWebkit_ = !goog.userAgent.detectedOpera_ && ua.indexOf("WebKit") != -1;
    goog.userAgent.detectedMobile_ = goog.userAgent.detectedWebkit_ && ua.indexOf("Mobile") != -1;
    goog.userAgent.detectedGecko_ = !goog.userAgent.detectedOpera_ && !goog.userAgent.detectedWebkit_ && navigator.product == "Gecko"
  }
};
if(!goog.userAgent.BROWSER_KNOWN_) {
  goog.userAgent.init_()
}
goog.userAgent.OPERA = goog.userAgent.BROWSER_KNOWN_ ? goog.userAgent.ASSUME_OPERA : goog.userAgent.detectedOpera_;
goog.userAgent.IE = goog.userAgent.BROWSER_KNOWN_ ? goog.userAgent.ASSUME_IE : goog.userAgent.detectedIe_;
goog.userAgent.GECKO = goog.userAgent.BROWSER_KNOWN_ ? goog.userAgent.ASSUME_GECKO : goog.userAgent.detectedGecko_;
goog.userAgent.WEBKIT = goog.userAgent.BROWSER_KNOWN_ ? goog.userAgent.ASSUME_WEBKIT || goog.userAgent.ASSUME_MOBILE_WEBKIT : goog.userAgent.detectedWebkit_;
goog.userAgent.MOBILE = goog.userAgent.ASSUME_MOBILE_WEBKIT || goog.userAgent.detectedMobile_;
goog.userAgent.SAFARI = goog.userAgent.WEBKIT;
goog.userAgent.determinePlatform_ = function() {
  var navigator = goog.userAgent.getNavigator();
  return navigator && navigator.platform || ""
};
goog.userAgent.PLATFORM = goog.userAgent.determinePlatform_();
goog.userAgent.ASSUME_MAC = false;
goog.userAgent.ASSUME_WINDOWS = false;
goog.userAgent.ASSUME_LINUX = false;
goog.userAgent.ASSUME_X11 = false;
goog.userAgent.PLATFORM_KNOWN_ = goog.userAgent.ASSUME_MAC || goog.userAgent.ASSUME_WINDOWS || goog.userAgent.ASSUME_LINUX || goog.userAgent.ASSUME_X11;
goog.userAgent.initPlatform_ = function() {
  goog.userAgent.detectedMac_ = goog.string.contains(goog.userAgent.PLATFORM, "Mac");
  goog.userAgent.detectedWindows_ = goog.string.contains(goog.userAgent.PLATFORM, "Win");
  goog.userAgent.detectedLinux_ = goog.string.contains(goog.userAgent.PLATFORM, "Linux");
  goog.userAgent.detectedX11_ = !!goog.userAgent.getNavigator() && goog.string.contains(goog.userAgent.getNavigator()["appVersion"] || "", "X11")
};
if(!goog.userAgent.PLATFORM_KNOWN_) {
  goog.userAgent.initPlatform_()
}
goog.userAgent.MAC = goog.userAgent.PLATFORM_KNOWN_ ? goog.userAgent.ASSUME_MAC : goog.userAgent.detectedMac_;
goog.userAgent.WINDOWS = goog.userAgent.PLATFORM_KNOWN_ ? goog.userAgent.ASSUME_WINDOWS : goog.userAgent.detectedWindows_;
goog.userAgent.LINUX = goog.userAgent.PLATFORM_KNOWN_ ? goog.userAgent.ASSUME_LINUX : goog.userAgent.detectedLinux_;
goog.userAgent.X11 = goog.userAgent.PLATFORM_KNOWN_ ? goog.userAgent.ASSUME_X11 : goog.userAgent.detectedX11_;
goog.userAgent.determineVersion_ = function() {
  var version = "", re;
  if(goog.userAgent.OPERA && goog.global["opera"]) {
    var operaVersion = goog.global["opera"].version;
    version = typeof operaVersion == "function" ? operaVersion() : operaVersion
  }else {
    if(goog.userAgent.GECKO) {
      re = /rv\:([^\);]+)(\)|;)/
    }else {
      if(goog.userAgent.IE) {
        re = /MSIE\s+([^\);]+)(\)|;)/
      }else {
        if(goog.userAgent.WEBKIT) {
          re = /WebKit\/(\S+)/
        }
      }
    }
    if(re) {
      var arr = re.exec(goog.userAgent.getUserAgentString());
      version = arr ? arr[1] : ""
    }
  }
  if(goog.userAgent.IE) {
    var docMode = goog.userAgent.getDocumentMode_();
    if(docMode > parseFloat(version)) {
      return String(docMode)
    }
  }
  return version
};
goog.userAgent.getDocumentMode_ = function() {
  var doc = goog.global["document"];
  return doc ? doc["documentMode"] : undefined
};
goog.userAgent.VERSION = goog.userAgent.determineVersion_();
goog.userAgent.compare = function(v1, v2) {
  return goog.string.compareVersions(v1, v2)
};
goog.userAgent.isVersionCache_ = {};
goog.userAgent.isVersion = function(version) {
  return goog.userAgent.isVersionCache_[version] || (goog.userAgent.isVersionCache_[version] = goog.string.compareVersions(goog.userAgent.VERSION, version) >= 0)
};
goog.userAgent.isDocumentModeCache_ = {};
goog.userAgent.isDocumentMode = function(documentMode) {
  return goog.userAgent.isDocumentModeCache_[documentMode] || (goog.userAgent.isDocumentModeCache_[documentMode] = goog.userAgent.IE && document.documentMode && document.documentMode >= documentMode)
};
goog.provide("goog.events.EventType");
goog.require("goog.userAgent");
goog.events.EventType = {CLICK:"click", DBLCLICK:"dblclick", MOUSEDOWN:"mousedown", MOUSEUP:"mouseup", MOUSEOVER:"mouseover", MOUSEOUT:"mouseout", MOUSEMOVE:"mousemove", SELECTSTART:"selectstart", KEYPRESS:"keypress", KEYDOWN:"keydown", KEYUP:"keyup", BLUR:"blur", FOCUS:"focus", DEACTIVATE:"deactivate", FOCUSIN:goog.userAgent.IE ? "focusin" : "DOMFocusIn", FOCUSOUT:goog.userAgent.IE ? "focusout" : "DOMFocusOut", CHANGE:"change", SELECT:"select", SUBMIT:"submit", INPUT:"input", PROPERTYCHANGE:"propertychange", 
DRAGSTART:"dragstart", DRAGENTER:"dragenter", DRAGOVER:"dragover", DRAGLEAVE:"dragleave", DROP:"drop", TOUCHSTART:"touchstart", TOUCHMOVE:"touchmove", TOUCHEND:"touchend", TOUCHCANCEL:"touchcancel", CONTEXTMENU:"contextmenu", ERROR:"error", HELP:"help", LOAD:"load", LOSECAPTURE:"losecapture", READYSTATECHANGE:"readystatechange", RESIZE:"resize", SCROLL:"scroll", UNLOAD:"unload", HASHCHANGE:"hashchange", PAGEHIDE:"pagehide", PAGESHOW:"pageshow", POPSTATE:"popstate", COPY:"copy", PASTE:"paste", CUT:"cut", 
BEFORECOPY:"beforecopy", BEFORECUT:"beforecut", BEFOREPASTE:"beforepaste", MESSAGE:"message", CONNECT:"connect", TRANSITIONEND:goog.userAgent.WEBKIT ? "webkitTransitionEnd" : goog.userAgent.OPERA ? "oTransitionEnd" : "transitionend"};
goog.provide("goog.disposable.IDisposable");
goog.disposable.IDisposable = function() {
};
goog.disposable.IDisposable.prototype.dispose;
goog.disposable.IDisposable.prototype.isDisposed;
goog.provide("goog.Disposable");
goog.provide("goog.dispose");
goog.require("goog.disposable.IDisposable");
goog.Disposable = function() {
  if(goog.Disposable.ENABLE_MONITORING) {
    goog.Disposable.instances_[goog.getUid(this)] = this
  }
};
goog.Disposable.ENABLE_MONITORING = false;
goog.Disposable.instances_ = {};
goog.Disposable.getUndisposedObjects = function() {
  var ret = [];
  for(var id in goog.Disposable.instances_) {
    if(goog.Disposable.instances_.hasOwnProperty(id)) {
      ret.push(goog.Disposable.instances_[Number(id)])
    }
  }
  return ret
};
goog.Disposable.clearUndisposedObjects = function() {
  goog.Disposable.instances_ = {}
};
goog.Disposable.prototype.disposed_ = false;
goog.Disposable.prototype.dependentDisposables_;
goog.Disposable.prototype.isDisposed = function() {
  return this.disposed_
};
goog.Disposable.prototype.getDisposed = goog.Disposable.prototype.isDisposed;
goog.Disposable.prototype.dispose = function() {
  if(!this.disposed_) {
    this.disposed_ = true;
    this.disposeInternal();
    if(goog.Disposable.ENABLE_MONITORING) {
      var uid = goog.getUid(this);
      if(!goog.Disposable.instances_.hasOwnProperty(uid)) {
        throw Error(this + " did not call the goog.Disposable base " + "constructor or was disposed of after a clearUndisposedObjects " + "call");
      }
      delete goog.Disposable.instances_[uid]
    }
  }
};
goog.Disposable.prototype.registerDisposable = function(disposable) {
  if(!this.dependentDisposables_) {
    this.dependentDisposables_ = []
  }
  this.dependentDisposables_.push(disposable)
};
goog.Disposable.prototype.disposeInternal = function() {
  if(this.dependentDisposables_) {
    goog.disposeAll.apply(null, this.dependentDisposables_)
  }
};
goog.dispose = function(obj) {
  if(obj && typeof obj.dispose == "function") {
    obj.dispose()
  }
};
goog.disposeAll = function(var_args) {
  for(var i = 0, len = arguments.length;i < len;++i) {
    var disposable = arguments[i];
    if(goog.isArrayLike(disposable)) {
      goog.disposeAll.apply(null, disposable)
    }else {
      goog.dispose(disposable)
    }
  }
};
goog.provide("goog.debug.EntryPointMonitor");
goog.provide("goog.debug.entryPointRegistry");
goog.require("goog.asserts");
goog.debug.EntryPointMonitor = function() {
};
goog.debug.EntryPointMonitor.prototype.wrap;
goog.debug.EntryPointMonitor.prototype.unwrap;
goog.debug.entryPointRegistry.refList_ = [];
goog.debug.entryPointRegistry.monitors_ = [];
goog.debug.entryPointRegistry.monitorsMayExist_ = false;
goog.debug.entryPointRegistry.register = function(callback) {
  goog.debug.entryPointRegistry.refList_[goog.debug.entryPointRegistry.refList_.length] = callback;
  if(goog.debug.entryPointRegistry.monitorsMayExist_) {
    var monitors = goog.debug.entryPointRegistry.monitors_;
    for(var i = 0;i < monitors.length;i++) {
      callback(goog.bind(monitors[i].wrap, monitors[i]))
    }
  }
};
goog.debug.entryPointRegistry.monitorAll = function(monitor) {
  goog.debug.entryPointRegistry.monitorsMayExist_ = true;
  var transformer = goog.bind(monitor.wrap, monitor);
  for(var i = 0;i < goog.debug.entryPointRegistry.refList_.length;i++) {
    goog.debug.entryPointRegistry.refList_[i](transformer)
  }
  goog.debug.entryPointRegistry.monitors_.push(monitor)
};
goog.debug.entryPointRegistry.unmonitorAllIfPossible = function(monitor) {
  var monitors = goog.debug.entryPointRegistry.monitors_;
  goog.asserts.assert(monitor == monitors[monitors.length - 1], "Only the most recent monitor can be unwrapped.");
  var transformer = goog.bind(monitor.unwrap, monitor);
  for(var i = 0;i < goog.debug.entryPointRegistry.refList_.length;i++) {
    goog.debug.entryPointRegistry.refList_[i](transformer)
  }
  monitors.length--
};
goog.provide("goog.debug.errorHandlerWeakDep");
goog.debug.errorHandlerWeakDep = {protectEntryPoint:function(fn, opt_tracers) {
  return fn
}};
goog.provide("goog.events.BrowserFeature");
goog.require("goog.userAgent");
goog.events.BrowserFeature = {HAS_W3C_BUTTON:!goog.userAgent.IE || goog.userAgent.isDocumentMode(9), HAS_W3C_EVENT_SUPPORT:!goog.userAgent.IE || goog.userAgent.isDocumentMode(9), SET_KEY_CODE_TO_PREVENT_DEFAULT:goog.userAgent.IE && !goog.userAgent.isVersion("8")};
goog.provide("goog.events.Event");
goog.require("goog.Disposable");
goog.events.Event = function(type, opt_target) {
  goog.Disposable.call(this);
  this.type = type;
  this.target = opt_target;
  this.currentTarget = this.target
};
goog.inherits(goog.events.Event, goog.Disposable);
goog.events.Event.prototype.disposeInternal = function() {
  delete this.type;
  delete this.target;
  delete this.currentTarget
};
goog.events.Event.prototype.propagationStopped_ = false;
goog.events.Event.prototype.returnValue_ = true;
goog.events.Event.prototype.stopPropagation = function() {
  this.propagationStopped_ = true
};
goog.events.Event.prototype.preventDefault = function() {
  this.returnValue_ = false
};
goog.events.Event.stopPropagation = function(e) {
  e.stopPropagation()
};
goog.events.Event.preventDefault = function(e) {
  e.preventDefault()
};
goog.provide("goog.reflect");
goog.reflect.object = function(type, object) {
  return object
};
goog.reflect.sinkValue = function(x) {
  goog.reflect.sinkValue[" "](x);
  return x
};
goog.reflect.sinkValue[" "] = goog.nullFunction;
goog.reflect.canAccessProperty = function(obj, prop) {
  try {
    goog.reflect.sinkValue(obj[prop]);
    return true
  }catch(e) {
  }
  return false
};
goog.provide("goog.events.BrowserEvent");
goog.provide("goog.events.BrowserEvent.MouseButton");
goog.require("goog.events.BrowserFeature");
goog.require("goog.events.Event");
goog.require("goog.events.EventType");
goog.require("goog.reflect");
goog.require("goog.userAgent");
goog.events.BrowserEvent = function(opt_e, opt_currentTarget) {
  if(opt_e) {
    this.init(opt_e, opt_currentTarget)
  }
};
goog.inherits(goog.events.BrowserEvent, goog.events.Event);
goog.events.BrowserEvent.MouseButton = {LEFT:0, MIDDLE:1, RIGHT:2};
goog.events.BrowserEvent.IEButtonMap = [1, 4, 2];
goog.events.BrowserEvent.prototype.target = null;
goog.events.BrowserEvent.prototype.currentTarget;
goog.events.BrowserEvent.prototype.relatedTarget = null;
goog.events.BrowserEvent.prototype.offsetX = 0;
goog.events.BrowserEvent.prototype.offsetY = 0;
goog.events.BrowserEvent.prototype.clientX = 0;
goog.events.BrowserEvent.prototype.clientY = 0;
goog.events.BrowserEvent.prototype.screenX = 0;
goog.events.BrowserEvent.prototype.screenY = 0;
goog.events.BrowserEvent.prototype.button = 0;
goog.events.BrowserEvent.prototype.keyCode = 0;
goog.events.BrowserEvent.prototype.charCode = 0;
goog.events.BrowserEvent.prototype.ctrlKey = false;
goog.events.BrowserEvent.prototype.altKey = false;
goog.events.BrowserEvent.prototype.shiftKey = false;
goog.events.BrowserEvent.prototype.metaKey = false;
goog.events.BrowserEvent.prototype.state;
goog.events.BrowserEvent.prototype.platformModifierKey = false;
goog.events.BrowserEvent.prototype.event_ = null;
goog.events.BrowserEvent.prototype.init = function(e, opt_currentTarget) {
  var type = this.type = e.type;
  goog.events.Event.call(this, type);
  this.target = e.target || e.srcElement;
  this.currentTarget = opt_currentTarget;
  var relatedTarget = e.relatedTarget;
  if(relatedTarget) {
    if(goog.userAgent.GECKO) {
      if(!goog.reflect.canAccessProperty(relatedTarget, "nodeName")) {
        relatedTarget = null
      }
    }
  }else {
    if(type == goog.events.EventType.MOUSEOVER) {
      relatedTarget = e.fromElement
    }else {
      if(type == goog.events.EventType.MOUSEOUT) {
        relatedTarget = e.toElement
      }
    }
  }
  this.relatedTarget = relatedTarget;
  this.offsetX = e.offsetX !== undefined ? e.offsetX : e.layerX;
  this.offsetY = e.offsetY !== undefined ? e.offsetY : e.layerY;
  this.clientX = e.clientX !== undefined ? e.clientX : e.pageX;
  this.clientY = e.clientY !== undefined ? e.clientY : e.pageY;
  this.screenX = e.screenX || 0;
  this.screenY = e.screenY || 0;
  this.button = e.button;
  this.keyCode = e.keyCode || 0;
  this.charCode = e.charCode || (type == "keypress" ? e.keyCode : 0);
  this.ctrlKey = e.ctrlKey;
  this.altKey = e.altKey;
  this.shiftKey = e.shiftKey;
  this.metaKey = e.metaKey;
  this.platformModifierKey = goog.userAgent.MAC ? e.metaKey : e.ctrlKey;
  this.state = e.state;
  this.event_ = e;
  delete this.returnValue_;
  delete this.propagationStopped_
};
goog.events.BrowserEvent.prototype.isButton = function(button) {
  if(!goog.events.BrowserFeature.HAS_W3C_BUTTON) {
    if(this.type == "click") {
      return button == goog.events.BrowserEvent.MouseButton.LEFT
    }else {
      return!!(this.event_.button & goog.events.BrowserEvent.IEButtonMap[button])
    }
  }else {
    return this.event_.button == button
  }
};
goog.events.BrowserEvent.prototype.isMouseActionButton = function() {
  return this.isButton(goog.events.BrowserEvent.MouseButton.LEFT) && !(goog.userAgent.WEBKIT && goog.userAgent.MAC && this.ctrlKey)
};
goog.events.BrowserEvent.prototype.stopPropagation = function() {
  goog.events.BrowserEvent.superClass_.stopPropagation.call(this);
  if(this.event_.stopPropagation) {
    this.event_.stopPropagation()
  }else {
    this.event_.cancelBubble = true
  }
};
goog.events.BrowserEvent.prototype.preventDefault = function() {
  goog.events.BrowserEvent.superClass_.preventDefault.call(this);
  var be = this.event_;
  if(!be.preventDefault) {
    be.returnValue = false;
    if(goog.events.BrowserFeature.SET_KEY_CODE_TO_PREVENT_DEFAULT) {
      try {
        var VK_F1 = 112;
        var VK_F12 = 123;
        if(be.ctrlKey || be.keyCode >= VK_F1 && be.keyCode <= VK_F12) {
          be.keyCode = -1
        }
      }catch(ex) {
      }
    }
  }else {
    be.preventDefault()
  }
};
goog.events.BrowserEvent.prototype.getBrowserEvent = function() {
  return this.event_
};
goog.events.BrowserEvent.prototype.disposeInternal = function() {
  goog.events.BrowserEvent.superClass_.disposeInternal.call(this);
  this.event_ = null;
  this.target = null;
  this.currentTarget = null;
  this.relatedTarget = null
};
goog.provide("goog.events.EventWrapper");
goog.events.EventWrapper = function() {
};
goog.events.EventWrapper.prototype.listen = function(src, listener, opt_capt, opt_scope, opt_eventHandler) {
};
goog.events.EventWrapper.prototype.unlisten = function(src, listener, opt_capt, opt_scope, opt_eventHandler) {
};
goog.provide("goog.events.Listener");
goog.events.Listener = function() {
};
goog.events.Listener.counter_ = 0;
goog.events.Listener.prototype.isFunctionListener_;
goog.events.Listener.prototype.listener;
goog.events.Listener.prototype.proxy;
goog.events.Listener.prototype.src;
goog.events.Listener.prototype.type;
goog.events.Listener.prototype.capture;
goog.events.Listener.prototype.handler;
goog.events.Listener.prototype.key = 0;
goog.events.Listener.prototype.removed = false;
goog.events.Listener.prototype.callOnce = false;
goog.events.Listener.prototype.init = function(listener, proxy, src, type, capture, opt_handler) {
  if(goog.isFunction(listener)) {
    this.isFunctionListener_ = true
  }else {
    if(listener && listener.handleEvent && goog.isFunction(listener.handleEvent)) {
      this.isFunctionListener_ = false
    }else {
      throw Error("Invalid listener argument");
    }
  }
  this.listener = listener;
  this.proxy = proxy;
  this.src = src;
  this.type = type;
  this.capture = !!capture;
  this.handler = opt_handler;
  this.callOnce = false;
  this.key = ++goog.events.Listener.counter_;
  this.removed = false
};
goog.events.Listener.prototype.handleEvent = function(eventObject) {
  if(this.isFunctionListener_) {
    return this.listener.call(this.handler || this.src, eventObject)
  }
  return this.listener.handleEvent.call(this.listener, eventObject)
};
goog.provide("goog.events");
goog.require("goog.array");
goog.require("goog.debug.entryPointRegistry");
goog.require("goog.debug.errorHandlerWeakDep");
goog.require("goog.events.BrowserEvent");
goog.require("goog.events.BrowserFeature");
goog.require("goog.events.Event");
goog.require("goog.events.EventWrapper");
goog.require("goog.events.Listener");
goog.require("goog.object");
goog.require("goog.userAgent");
goog.events.ASSUME_GOOD_GC = false;
goog.events.listeners_ = {};
goog.events.listenerTree_ = {};
goog.events.sources_ = {};
goog.events.onString_ = "on";
goog.events.onStringMap_ = {};
goog.events.keySeparator_ = "_";
goog.events.listen = function(src, type, listener, opt_capt, opt_handler) {
  if(!type) {
    throw Error("Invalid event type");
  }else {
    if(goog.isArray(type)) {
      for(var i = 0;i < type.length;i++) {
        goog.events.listen(src, type[i], listener, opt_capt, opt_handler)
      }
      return null
    }else {
      var capture = !!opt_capt;
      var map = goog.events.listenerTree_;
      if(!(type in map)) {
        map[type] = {count_:0, remaining_:0}
      }
      map = map[type];
      if(!(capture in map)) {
        map[capture] = {count_:0, remaining_:0};
        map.count_++
      }
      map = map[capture];
      var srcUid = goog.getUid(src);
      var listenerArray, listenerObj;
      map.remaining_++;
      if(!map[srcUid]) {
        listenerArray = map[srcUid] = [];
        map.count_++
      }else {
        listenerArray = map[srcUid];
        for(var i = 0;i < listenerArray.length;i++) {
          listenerObj = listenerArray[i];
          if(listenerObj.listener == listener && listenerObj.handler == opt_handler) {
            if(listenerObj.removed) {
              break
            }
            return listenerArray[i].key
          }
        }
      }
      var proxy = goog.events.getProxy();
      proxy.src = src;
      listenerObj = new goog.events.Listener;
      listenerObj.init(listener, proxy, src, type, capture, opt_handler);
      var key = listenerObj.key;
      proxy.key = key;
      listenerArray.push(listenerObj);
      goog.events.listeners_[key] = listenerObj;
      if(!goog.events.sources_[srcUid]) {
        goog.events.sources_[srcUid] = []
      }
      goog.events.sources_[srcUid].push(listenerObj);
      if(src.addEventListener) {
        if(src == goog.global || !src.customEvent_) {
          src.addEventListener(type, proxy, capture)
        }
      }else {
        src.attachEvent(goog.events.getOnString_(type), proxy)
      }
      return key
    }
  }
};
goog.events.getProxy = function() {
  var proxyCallbackFunction = goog.events.handleBrowserEvent_;
  var f = goog.events.BrowserFeature.HAS_W3C_EVENT_SUPPORT ? function(eventObject) {
    return proxyCallbackFunction.call(f.src, f.key, eventObject)
  } : function(eventObject) {
    var v = proxyCallbackFunction.call(f.src, f.key, eventObject);
    if(!v) {
      return v
    }
  };
  return f
};
goog.events.listenOnce = function(src, type, listener, opt_capt, opt_handler) {
  if(goog.isArray(type)) {
    for(var i = 0;i < type.length;i++) {
      goog.events.listenOnce(src, type[i], listener, opt_capt, opt_handler)
    }
    return null
  }
  var key = goog.events.listen(src, type, listener, opt_capt, opt_handler);
  var listenerObj = goog.events.listeners_[key];
  listenerObj.callOnce = true;
  return key
};
goog.events.listenWithWrapper = function(src, wrapper, listener, opt_capt, opt_handler) {
  wrapper.listen(src, listener, opt_capt, opt_handler)
};
goog.events.unlisten = function(src, type, listener, opt_capt, opt_handler) {
  if(goog.isArray(type)) {
    for(var i = 0;i < type.length;i++) {
      goog.events.unlisten(src, type[i], listener, opt_capt, opt_handler)
    }
    return null
  }
  var capture = !!opt_capt;
  var listenerArray = goog.events.getListeners_(src, type, capture);
  if(!listenerArray) {
    return false
  }
  for(var i = 0;i < listenerArray.length;i++) {
    if(listenerArray[i].listener == listener && listenerArray[i].capture == capture && listenerArray[i].handler == opt_handler) {
      return goog.events.unlistenByKey(listenerArray[i].key)
    }
  }
  return false
};
goog.events.unlistenByKey = function(key) {
  if(!goog.events.listeners_[key]) {
    return false
  }
  var listener = goog.events.listeners_[key];
  if(listener.removed) {
    return false
  }
  var src = listener.src;
  var type = listener.type;
  var proxy = listener.proxy;
  var capture = listener.capture;
  if(src.removeEventListener) {
    if(src == goog.global || !src.customEvent_) {
      src.removeEventListener(type, proxy, capture)
    }
  }else {
    if(src.detachEvent) {
      src.detachEvent(goog.events.getOnString_(type), proxy)
    }
  }
  var srcUid = goog.getUid(src);
  var listenerArray = goog.events.listenerTree_[type][capture][srcUid];
  if(goog.events.sources_[srcUid]) {
    var sourcesArray = goog.events.sources_[srcUid];
    goog.array.remove(sourcesArray, listener);
    if(sourcesArray.length == 0) {
      delete goog.events.sources_[srcUid]
    }
  }
  listener.removed = true;
  listenerArray.needsCleanup_ = true;
  goog.events.cleanUp_(type, capture, srcUid, listenerArray);
  delete goog.events.listeners_[key];
  return true
};
goog.events.unlistenWithWrapper = function(src, wrapper, listener, opt_capt, opt_handler) {
  wrapper.unlisten(src, listener, opt_capt, opt_handler)
};
goog.events.cleanUp_ = function(type, capture, srcUid, listenerArray) {
  if(!listenerArray.locked_) {
    if(listenerArray.needsCleanup_) {
      for(var oldIndex = 0, newIndex = 0;oldIndex < listenerArray.length;oldIndex++) {
        if(listenerArray[oldIndex].removed) {
          var proxy = listenerArray[oldIndex].proxy;
          proxy.src = null;
          continue
        }
        if(oldIndex != newIndex) {
          listenerArray[newIndex] = listenerArray[oldIndex]
        }
        newIndex++
      }
      listenerArray.length = newIndex;
      listenerArray.needsCleanup_ = false;
      if(newIndex == 0) {
        delete goog.events.listenerTree_[type][capture][srcUid];
        goog.events.listenerTree_[type][capture].count_--;
        if(goog.events.listenerTree_[type][capture].count_ == 0) {
          delete goog.events.listenerTree_[type][capture];
          goog.events.listenerTree_[type].count_--
        }
        if(goog.events.listenerTree_[type].count_ == 0) {
          delete goog.events.listenerTree_[type]
        }
      }
    }
  }
};
goog.events.removeAll = function(opt_obj, opt_type, opt_capt) {
  var count = 0;
  var noObj = opt_obj == null;
  var noType = opt_type == null;
  var noCapt = opt_capt == null;
  opt_capt = !!opt_capt;
  if(!noObj) {
    var srcUid = goog.getUid(opt_obj);
    if(goog.events.sources_[srcUid]) {
      var sourcesArray = goog.events.sources_[srcUid];
      for(var i = sourcesArray.length - 1;i >= 0;i--) {
        var listener = sourcesArray[i];
        if((noType || opt_type == listener.type) && (noCapt || opt_capt == listener.capture)) {
          goog.events.unlistenByKey(listener.key);
          count++
        }
      }
    }
  }else {
    goog.object.forEach(goog.events.sources_, function(listeners) {
      for(var i = listeners.length - 1;i >= 0;i--) {
        var listener = listeners[i];
        if((noType || opt_type == listener.type) && (noCapt || opt_capt == listener.capture)) {
          goog.events.unlistenByKey(listener.key);
          count++
        }
      }
    })
  }
  return count
};
goog.events.getListeners = function(obj, type, capture) {
  return goog.events.getListeners_(obj, type, capture) || []
};
goog.events.getListeners_ = function(obj, type, capture) {
  var map = goog.events.listenerTree_;
  if(type in map) {
    map = map[type];
    if(capture in map) {
      map = map[capture];
      var objUid = goog.getUid(obj);
      if(map[objUid]) {
        return map[objUid]
      }
    }
  }
  return null
};
goog.events.getListener = function(src, type, listener, opt_capt, opt_handler) {
  var capture = !!opt_capt;
  var listenerArray = goog.events.getListeners_(src, type, capture);
  if(listenerArray) {
    for(var i = 0;i < listenerArray.length;i++) {
      if(!listenerArray[i].removed && listenerArray[i].listener == listener && listenerArray[i].capture == capture && listenerArray[i].handler == opt_handler) {
        return listenerArray[i]
      }
    }
  }
  return null
};
goog.events.hasListener = function(obj, opt_type, opt_capture) {
  var objUid = goog.getUid(obj);
  var listeners = goog.events.sources_[objUid];
  if(listeners) {
    var hasType = goog.isDef(opt_type);
    var hasCapture = goog.isDef(opt_capture);
    if(hasType && hasCapture) {
      var map = goog.events.listenerTree_[opt_type];
      return!!map && !!map[opt_capture] && objUid in map[opt_capture]
    }else {
      if(!(hasType || hasCapture)) {
        return true
      }else {
        return goog.array.some(listeners, function(listener) {
          return hasType && listener.type == opt_type || hasCapture && listener.capture == opt_capture
        })
      }
    }
  }
  return false
};
goog.events.expose = function(e) {
  var str = [];
  for(var key in e) {
    if(e[key] && e[key].id) {
      str.push(key + " = " + e[key] + " (" + e[key].id + ")")
    }else {
      str.push(key + " = " + e[key])
    }
  }
  return str.join("\n")
};
goog.events.getOnString_ = function(type) {
  if(type in goog.events.onStringMap_) {
    return goog.events.onStringMap_[type]
  }
  return goog.events.onStringMap_[type] = goog.events.onString_ + type
};
goog.events.fireListeners = function(obj, type, capture, eventObject) {
  var map = goog.events.listenerTree_;
  if(type in map) {
    map = map[type];
    if(capture in map) {
      return goog.events.fireListeners_(map[capture], obj, type, capture, eventObject)
    }
  }
  return true
};
goog.events.fireListeners_ = function(map, obj, type, capture, eventObject) {
  var retval = 1;
  var objUid = goog.getUid(obj);
  if(map[objUid]) {
    map.remaining_--;
    var listenerArray = map[objUid];
    if(!listenerArray.locked_) {
      listenerArray.locked_ = 1
    }else {
      listenerArray.locked_++
    }
    try {
      var length = listenerArray.length;
      for(var i = 0;i < length;i++) {
        var listener = listenerArray[i];
        if(listener && !listener.removed) {
          retval &= goog.events.fireListener(listener, eventObject) !== false
        }
      }
    }finally {
      listenerArray.locked_--;
      goog.events.cleanUp_(type, capture, objUid, listenerArray)
    }
  }
  return Boolean(retval)
};
goog.events.fireListener = function(listener, eventObject) {
  var rv = listener.handleEvent(eventObject);
  if(listener.callOnce) {
    goog.events.unlistenByKey(listener.key)
  }
  return rv
};
goog.events.getTotalListenerCount = function() {
  return goog.object.getCount(goog.events.listeners_)
};
goog.events.dispatchEvent = function(src, e) {
  var type = e.type || e;
  var map = goog.events.listenerTree_;
  if(!(type in map)) {
    return true
  }
  if(goog.isString(e)) {
    e = new goog.events.Event(e, src)
  }else {
    if(!(e instanceof goog.events.Event)) {
      var oldEvent = e;
      e = new goog.events.Event(type, src);
      goog.object.extend(e, oldEvent)
    }else {
      e.target = e.target || src
    }
  }
  var rv = 1, ancestors;
  map = map[type];
  var hasCapture = true in map;
  var targetsMap;
  if(hasCapture) {
    ancestors = [];
    for(var parent = src;parent;parent = parent.getParentEventTarget()) {
      ancestors.push(parent)
    }
    targetsMap = map[true];
    targetsMap.remaining_ = targetsMap.count_;
    for(var i = ancestors.length - 1;!e.propagationStopped_ && i >= 0 && targetsMap.remaining_;i--) {
      e.currentTarget = ancestors[i];
      rv &= goog.events.fireListeners_(targetsMap, ancestors[i], e.type, true, e) && e.returnValue_ != false
    }
  }
  var hasBubble = false in map;
  if(hasBubble) {
    targetsMap = map[false];
    targetsMap.remaining_ = targetsMap.count_;
    if(hasCapture) {
      for(var i = 0;!e.propagationStopped_ && i < ancestors.length && targetsMap.remaining_;i++) {
        e.currentTarget = ancestors[i];
        rv &= goog.events.fireListeners_(targetsMap, ancestors[i], e.type, false, e) && e.returnValue_ != false
      }
    }else {
      for(var current = src;!e.propagationStopped_ && current && targetsMap.remaining_;current = current.getParentEventTarget()) {
        e.currentTarget = current;
        rv &= goog.events.fireListeners_(targetsMap, current, e.type, false, e) && e.returnValue_ != false
      }
    }
  }
  return Boolean(rv)
};
goog.events.protectBrowserEventEntryPoint = function(errorHandler) {
  goog.events.handleBrowserEvent_ = errorHandler.protectEntryPoint(goog.events.handleBrowserEvent_)
};
goog.events.handleBrowserEvent_ = function(key, opt_evt) {
  if(!goog.events.listeners_[key]) {
    return true
  }
  var listener = goog.events.listeners_[key];
  var type = listener.type;
  var map = goog.events.listenerTree_;
  if(!(type in map)) {
    return true
  }
  map = map[type];
  var retval, targetsMap;
  if(!goog.events.BrowserFeature.HAS_W3C_EVENT_SUPPORT) {
    var ieEvent = opt_evt || goog.getObjectByName("window.event");
    var hasCapture = true in map;
    var hasBubble = false in map;
    if(hasCapture) {
      if(goog.events.isMarkedIeEvent_(ieEvent)) {
        return true
      }
      goog.events.markIeEvent_(ieEvent)
    }
    var evt = new goog.events.BrowserEvent;
    evt.init(ieEvent, this);
    retval = true;
    try {
      if(hasCapture) {
        var ancestors = [];
        for(var parent = evt.currentTarget;parent;parent = parent.parentNode) {
          ancestors.push(parent)
        }
        targetsMap = map[true];
        targetsMap.remaining_ = targetsMap.count_;
        for(var i = ancestors.length - 1;!evt.propagationStopped_ && i >= 0 && targetsMap.remaining_;i--) {
          evt.currentTarget = ancestors[i];
          retval &= goog.events.fireListeners_(targetsMap, ancestors[i], type, true, evt)
        }
        if(hasBubble) {
          targetsMap = map[false];
          targetsMap.remaining_ = targetsMap.count_;
          for(var i = 0;!evt.propagationStopped_ && i < ancestors.length && targetsMap.remaining_;i++) {
            evt.currentTarget = ancestors[i];
            retval &= goog.events.fireListeners_(targetsMap, ancestors[i], type, false, evt)
          }
        }
      }else {
        retval = goog.events.fireListener(listener, evt)
      }
    }finally {
      if(ancestors) {
        ancestors.length = 0
      }
      evt.dispose()
    }
    return retval
  }
  var be = new goog.events.BrowserEvent(opt_evt, this);
  try {
    retval = goog.events.fireListener(listener, be)
  }finally {
    be.dispose()
  }
  return retval
};
goog.events.markIeEvent_ = function(e) {
  var useReturnValue = false;
  if(e.keyCode == 0) {
    try {
      e.keyCode = -1;
      return
    }catch(ex) {
      useReturnValue = true
    }
  }
  if(useReturnValue || e.returnValue == undefined) {
    e.returnValue = true
  }
};
goog.events.isMarkedIeEvent_ = function(e) {
  return e.keyCode < 0 || e.returnValue != undefined
};
goog.events.uniqueIdCounter_ = 0;
goog.events.getUniqueId = function(identifier) {
  return identifier + "_" + goog.events.uniqueIdCounter_++
};
goog.debug.entryPointRegistry.register(function(transformer) {
  goog.events.handleBrowserEvent_ = transformer(goog.events.handleBrowserEvent_)
});
goog.provide("goog.events.EventTarget");
goog.require("goog.Disposable");
goog.require("goog.events");
goog.events.EventTarget = function() {
  goog.Disposable.call(this)
};
goog.inherits(goog.events.EventTarget, goog.Disposable);
goog.events.EventTarget.prototype.customEvent_ = true;
goog.events.EventTarget.prototype.parentEventTarget_ = null;
goog.events.EventTarget.prototype.getParentEventTarget = function() {
  return this.parentEventTarget_
};
goog.events.EventTarget.prototype.setParentEventTarget = function(parent) {
  this.parentEventTarget_ = parent
};
goog.events.EventTarget.prototype.addEventListener = function(type, handler, opt_capture, opt_handlerScope) {
  goog.events.listen(this, type, handler, opt_capture, opt_handlerScope)
};
goog.events.EventTarget.prototype.removeEventListener = function(type, handler, opt_capture, opt_handlerScope) {
  goog.events.unlisten(this, type, handler, opt_capture, opt_handlerScope)
};
goog.events.EventTarget.prototype.dispatchEvent = function(e) {
  return goog.events.dispatchEvent(this, e)
};
goog.events.EventTarget.prototype.disposeInternal = function() {
  goog.events.EventTarget.superClass_.disposeInternal.call(this);
  goog.events.removeAll(this);
  this.parentEventTarget_ = null
};
goog.provide("clojure.browser.event");
goog.require("cljs.core");
goog.require("goog.events.EventType");
goog.require("goog.events.EventTarget");
goog.require("goog.events");
clojure.browser.event.EventType = {};
clojure.browser.event.event_types = function event_types(this$) {
  if(function() {
    var and__3822__auto____163071 = this$;
    if(and__3822__auto____163071) {
      return this$.clojure$browser$event$EventType$event_types$arity$1
    }else {
      return and__3822__auto____163071
    }
  }()) {
    return this$.clojure$browser$event$EventType$event_types$arity$1(this$)
  }else {
    var x__2363__auto____163072 = this$ == null ? null : this$;
    return function() {
      var or__3824__auto____163073 = clojure.browser.event.event_types[goog.typeOf(x__2363__auto____163072)];
      if(or__3824__auto____163073) {
        return or__3824__auto____163073
      }else {
        var or__3824__auto____163074 = clojure.browser.event.event_types["_"];
        if(or__3824__auto____163074) {
          return or__3824__auto____163074
        }else {
          throw cljs.core.missing_protocol.call(null, "EventType.event-types", this$);
        }
      }
    }().call(null, this$)
  }
};
Element.prototype.clojure$browser$event$EventType$ = true;
Element.prototype.clojure$browser$event$EventType$event_types$arity$1 = function(this$) {
  return cljs.core.into.call(null, cljs.core.ObjMap.EMPTY, cljs.core.map.call(null, function(p__163075) {
    var vec__163076__163077 = p__163075;
    var k__163078 = cljs.core.nth.call(null, vec__163076__163077, 0, null);
    var v__163079 = cljs.core.nth.call(null, vec__163076__163077, 1, null);
    return cljs.core.PersistentVector.fromArray([cljs.core.keyword.call(null, k__163078.toLowerCase()), v__163079], true)
  }, cljs.core.merge.call(null, cljs.core.js__GT_clj.call(null, goog.events.EventType))))
};
goog.events.EventTarget.prototype.clojure$browser$event$EventType$ = true;
goog.events.EventTarget.prototype.clojure$browser$event$EventType$event_types$arity$1 = function(this$) {
  return cljs.core.into.call(null, cljs.core.ObjMap.EMPTY, cljs.core.map.call(null, function(p__163080) {
    var vec__163081__163082 = p__163080;
    var k__163083 = cljs.core.nth.call(null, vec__163081__163082, 0, null);
    var v__163084 = cljs.core.nth.call(null, vec__163081__163082, 1, null);
    return cljs.core.PersistentVector.fromArray([cljs.core.keyword.call(null, k__163083.toLowerCase()), v__163084], true)
  }, cljs.core.merge.call(null, cljs.core.js__GT_clj.call(null, goog.events.EventType))))
};
clojure.browser.event.listen = function() {
  var listen = null;
  var listen__3 = function(src, type, fn) {
    return listen.call(null, src, type, fn, false)
  };
  var listen__4 = function(src, type, fn, capture_QMARK_) {
    return goog.events.listen(src, cljs.core._lookup.call(null, clojure.browser.event.event_types.call(null, src), type, type), fn, capture_QMARK_)
  };
  listen = function(src, type, fn, capture_QMARK_) {
    switch(arguments.length) {
      case 3:
        return listen__3.call(this, src, type, fn);
      case 4:
        return listen__4.call(this, src, type, fn, capture_QMARK_)
    }
    throw"Invalid arity: " + arguments.length;
  };
  listen.cljs$lang$arity$3 = listen__3;
  listen.cljs$lang$arity$4 = listen__4;
  return listen
}();
clojure.browser.event.listen_once = function() {
  var listen_once = null;
  var listen_once__3 = function(src, type, fn) {
    return listen_once.call(null, src, type, fn, false)
  };
  var listen_once__4 = function(src, type, fn, capture_QMARK_) {
    return goog.events.listenOnce(src, cljs.core._lookup.call(null, clojure.browser.event.event_types.call(null, src), type, type), fn, capture_QMARK_)
  };
  listen_once = function(src, type, fn, capture_QMARK_) {
    switch(arguments.length) {
      case 3:
        return listen_once__3.call(this, src, type, fn);
      case 4:
        return listen_once__4.call(this, src, type, fn, capture_QMARK_)
    }
    throw"Invalid arity: " + arguments.length;
  };
  listen_once.cljs$lang$arity$3 = listen_once__3;
  listen_once.cljs$lang$arity$4 = listen_once__4;
  return listen_once
}();
clojure.browser.event.unlisten = function() {
  var unlisten = null;
  var unlisten__3 = function(src, type, fn) {
    return unlisten.call(null, src, type, fn, false)
  };
  var unlisten__4 = function(src, type, fn, capture_QMARK_) {
    return goog.events.unlisten(src, cljs.core._lookup.call(null, clojure.browser.event.event_types.call(null, src), type, type), fn, capture_QMARK_)
  };
  unlisten = function(src, type, fn, capture_QMARK_) {
    switch(arguments.length) {
      case 3:
        return unlisten__3.call(this, src, type, fn);
      case 4:
        return unlisten__4.call(this, src, type, fn, capture_QMARK_)
    }
    throw"Invalid arity: " + arguments.length;
  };
  unlisten.cljs$lang$arity$3 = unlisten__3;
  unlisten.cljs$lang$arity$4 = unlisten__4;
  return unlisten
}();
clojure.browser.event.unlisten_by_key = function unlisten_by_key(key) {
  return goog.events.unlistenByKey(key)
};
clojure.browser.event.dispatch_event = function dispatch_event(src, event) {
  return goog.events.dispatchEvent(src, event)
};
clojure.browser.event.expose = function expose(e) {
  return goog.events.expose(e)
};
clojure.browser.event.fire_listeners = function fire_listeners(obj, type, capture, event) {
  return null
};
clojure.browser.event.total_listener_count = function total_listener_count() {
  return goog.events.getTotalListenerCount()
};
clojure.browser.event.get_listener = function get_listener(src, type, listener, opt_capt, opt_handler) {
  return null
};
clojure.browser.event.all_listeners = function all_listeners(obj, type, capture) {
  return null
};
clojure.browser.event.unique_event_id = function unique_event_id(event_type) {
  return null
};
clojure.browser.event.has_listener = function has_listener(obj, opt_type, opt_capture) {
  return null
};
clojure.browser.event.remove_all = function remove_all(opt_obj, opt_type, opt_capt) {
  return null
};
goog.provide("yapin.bar");
goog.require("cljs.core");
goog.require("clojure.browser.event");
goog.require("clojure.browser.event");
yapin.bar.clj__GT_js = function clj__GT_js(x) {
  if(cljs.core.string_QMARK_.call(null, x)) {
    return x
  }else {
    if(cljs.core.keyword_QMARK_.call(null, x)) {
      return cljs.core.name.call(null, x)
    }else {
      if(cljs.core.map_QMARK_.call(null, x)) {
        var obj = {};
        var G__6262_6264 = cljs.core.seq.call(null, x);
        while(true) {
          if(G__6262_6264) {
            var vec__6263_6265 = cljs.core.first.call(null, G__6262_6264);
            var k_6266 = cljs.core.nth.call(null, vec__6263_6265, 0, null);
            var v_6267 = cljs.core.nth.call(null, vec__6263_6265, 1, null);
            obj[clj__GT_js.call(null, k_6266)] = clj__GT_js.call(null, v_6267);
            var G__6268 = cljs.core.next.call(null, G__6262_6264);
            G__6262_6264 = G__6268;
            continue
          }else {
          }
          break
        }
        return obj
      }else {
        if(cljs.core.coll_QMARK_.call(null, x)) {
          return cljs.core.apply.call(null, cljs.core.array, cljs.core.map.call(null, clj__GT_js, x))
        }else {
          if("\ufdd0'else") {
            return x
          }else {
            return null
          }
        }
      }
    }
  }
};
yapin.bar.active_browser_window = function active_browser_window() {
  return safari.application.activeBrowserWindow
};
yapin.bar.global_ns = safari.extension.globalPage.contentWindow.yapin.global;
yapin.bar.find_element = function find_element(window, id) {
  var document = window.document;
  return document.getElementById(id)
};
yapin.bar.find_extension_bar = function find_extension_bar(identifier) {
  return cljs.core.first.call(null, cljs.core.filter.call(null, function(p1__6269_SHARP_) {
    return cljs.core._EQ_.call(null, identifier, p1__6269_SHARP_.identifier)
  }, safari.extension.bars))
};
yapin.bar.dispatch_page_message = function dispatch_page_message(name, message) {
  var page = safari.application.activeBrowserWindow.activeTab.page;
  return page.dispatchMessage(name, message)
};
yapin.bar.find_bookmarks = function find_bookmarks(text) {
  return yapin.bar.global_ns.find_bookmarks(text)
};
yapin.bar.form_field_search_handle_key_press = function form_field_search_handle_key_press(event) {
  var key_code = event.keyCode;
  if(cljs.core._EQ_.call(null, key_code, 13)) {
    var this$ = this;
    var value = this$.value;
    var result = yapin.bar.find_bookmarks.call(null, value);
    return yapin.bar.dispatch_page_message.call(null, "slide-page-in", yapin.bar.clj__GT_js.call(null, result))
  }else {
    return null
  }
};
yapin.bar.register_event_handlers = function register_event_handlers() {
  var bar = yapin.bar.find_extension_bar.call(null, "bar");
  var content_window = bar.contentWindow;
  var form_field_search = yapin.bar.find_element.call(null, content_window, "form-field-search");
  return clojure.browser.event.listen.call(null, form_field_search, "\ufdd0'keypress", yapin.bar.form_field_search_handle_key_press)
};
yapin.bar.register_event_handlers.call(null);
