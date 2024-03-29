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
  var x__13710 = x == null ? null : x;
  if(p[goog.typeOf(x__13710)]) {
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
    var G__13711__delegate = function(array, i, idxs) {
      return cljs.core.apply.call(null, aget, aget.call(null, array, i), idxs)
    };
    var G__13711 = function(array, i, var_args) {
      var idxs = null;
      if(goog.isDef(var_args)) {
        idxs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__13711__delegate.call(this, array, i, idxs)
    };
    G__13711.cljs$lang$maxFixedArity = 2;
    G__13711.cljs$lang$applyTo = function(arglist__13712) {
      var array = cljs.core.first(arglist__13712);
      var i = cljs.core.first(cljs.core.next(arglist__13712));
      var idxs = cljs.core.rest(cljs.core.next(arglist__13712));
      return G__13711__delegate(array, i, idxs)
    };
    G__13711.cljs$lang$arity$variadic = G__13711__delegate;
    return G__13711
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
      var and__3822__auto____13797 = this$;
      if(and__3822__auto____13797) {
        return this$.cljs$core$IFn$_invoke$arity$1
      }else {
        return and__3822__auto____13797
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$1(this$)
    }else {
      var x__2365__auto____13798 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____13799 = cljs.core._invoke[goog.typeOf(x__2365__auto____13798)];
        if(or__3824__auto____13799) {
          return or__3824__auto____13799
        }else {
          var or__3824__auto____13800 = cljs.core._invoke["_"];
          if(or__3824__auto____13800) {
            return or__3824__auto____13800
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$)
    }
  };
  var _invoke__2 = function(this$, a) {
    if(function() {
      var and__3822__auto____13801 = this$;
      if(and__3822__auto____13801) {
        return this$.cljs$core$IFn$_invoke$arity$2
      }else {
        return and__3822__auto____13801
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$2(this$, a)
    }else {
      var x__2365__auto____13802 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____13803 = cljs.core._invoke[goog.typeOf(x__2365__auto____13802)];
        if(or__3824__auto____13803) {
          return or__3824__auto____13803
        }else {
          var or__3824__auto____13804 = cljs.core._invoke["_"];
          if(or__3824__auto____13804) {
            return or__3824__auto____13804
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a)
    }
  };
  var _invoke__3 = function(this$, a, b) {
    if(function() {
      var and__3822__auto____13805 = this$;
      if(and__3822__auto____13805) {
        return this$.cljs$core$IFn$_invoke$arity$3
      }else {
        return and__3822__auto____13805
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$3(this$, a, b)
    }else {
      var x__2365__auto____13806 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____13807 = cljs.core._invoke[goog.typeOf(x__2365__auto____13806)];
        if(or__3824__auto____13807) {
          return or__3824__auto____13807
        }else {
          var or__3824__auto____13808 = cljs.core._invoke["_"];
          if(or__3824__auto____13808) {
            return or__3824__auto____13808
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b)
    }
  };
  var _invoke__4 = function(this$, a, b, c) {
    if(function() {
      var and__3822__auto____13809 = this$;
      if(and__3822__auto____13809) {
        return this$.cljs$core$IFn$_invoke$arity$4
      }else {
        return and__3822__auto____13809
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$4(this$, a, b, c)
    }else {
      var x__2365__auto____13810 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____13811 = cljs.core._invoke[goog.typeOf(x__2365__auto____13810)];
        if(or__3824__auto____13811) {
          return or__3824__auto____13811
        }else {
          var or__3824__auto____13812 = cljs.core._invoke["_"];
          if(or__3824__auto____13812) {
            return or__3824__auto____13812
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c)
    }
  };
  var _invoke__5 = function(this$, a, b, c, d) {
    if(function() {
      var and__3822__auto____13813 = this$;
      if(and__3822__auto____13813) {
        return this$.cljs$core$IFn$_invoke$arity$5
      }else {
        return and__3822__auto____13813
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$5(this$, a, b, c, d)
    }else {
      var x__2365__auto____13814 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____13815 = cljs.core._invoke[goog.typeOf(x__2365__auto____13814)];
        if(or__3824__auto____13815) {
          return or__3824__auto____13815
        }else {
          var or__3824__auto____13816 = cljs.core._invoke["_"];
          if(or__3824__auto____13816) {
            return or__3824__auto____13816
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d)
    }
  };
  var _invoke__6 = function(this$, a, b, c, d, e) {
    if(function() {
      var and__3822__auto____13817 = this$;
      if(and__3822__auto____13817) {
        return this$.cljs$core$IFn$_invoke$arity$6
      }else {
        return and__3822__auto____13817
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$6(this$, a, b, c, d, e)
    }else {
      var x__2365__auto____13818 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____13819 = cljs.core._invoke[goog.typeOf(x__2365__auto____13818)];
        if(or__3824__auto____13819) {
          return or__3824__auto____13819
        }else {
          var or__3824__auto____13820 = cljs.core._invoke["_"];
          if(or__3824__auto____13820) {
            return or__3824__auto____13820
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e)
    }
  };
  var _invoke__7 = function(this$, a, b, c, d, e, f) {
    if(function() {
      var and__3822__auto____13821 = this$;
      if(and__3822__auto____13821) {
        return this$.cljs$core$IFn$_invoke$arity$7
      }else {
        return and__3822__auto____13821
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$7(this$, a, b, c, d, e, f)
    }else {
      var x__2365__auto____13822 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____13823 = cljs.core._invoke[goog.typeOf(x__2365__auto____13822)];
        if(or__3824__auto____13823) {
          return or__3824__auto____13823
        }else {
          var or__3824__auto____13824 = cljs.core._invoke["_"];
          if(or__3824__auto____13824) {
            return or__3824__auto____13824
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f)
    }
  };
  var _invoke__8 = function(this$, a, b, c, d, e, f, g) {
    if(function() {
      var and__3822__auto____13825 = this$;
      if(and__3822__auto____13825) {
        return this$.cljs$core$IFn$_invoke$arity$8
      }else {
        return and__3822__auto____13825
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$8(this$, a, b, c, d, e, f, g)
    }else {
      var x__2365__auto____13826 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____13827 = cljs.core._invoke[goog.typeOf(x__2365__auto____13826)];
        if(or__3824__auto____13827) {
          return or__3824__auto____13827
        }else {
          var or__3824__auto____13828 = cljs.core._invoke["_"];
          if(or__3824__auto____13828) {
            return or__3824__auto____13828
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g)
    }
  };
  var _invoke__9 = function(this$, a, b, c, d, e, f, g, h) {
    if(function() {
      var and__3822__auto____13829 = this$;
      if(and__3822__auto____13829) {
        return this$.cljs$core$IFn$_invoke$arity$9
      }else {
        return and__3822__auto____13829
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$9(this$, a, b, c, d, e, f, g, h)
    }else {
      var x__2365__auto____13830 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____13831 = cljs.core._invoke[goog.typeOf(x__2365__auto____13830)];
        if(or__3824__auto____13831) {
          return or__3824__auto____13831
        }else {
          var or__3824__auto____13832 = cljs.core._invoke["_"];
          if(or__3824__auto____13832) {
            return or__3824__auto____13832
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h)
    }
  };
  var _invoke__10 = function(this$, a, b, c, d, e, f, g, h, i) {
    if(function() {
      var and__3822__auto____13833 = this$;
      if(and__3822__auto____13833) {
        return this$.cljs$core$IFn$_invoke$arity$10
      }else {
        return and__3822__auto____13833
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$10(this$, a, b, c, d, e, f, g, h, i)
    }else {
      var x__2365__auto____13834 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____13835 = cljs.core._invoke[goog.typeOf(x__2365__auto____13834)];
        if(or__3824__auto____13835) {
          return or__3824__auto____13835
        }else {
          var or__3824__auto____13836 = cljs.core._invoke["_"];
          if(or__3824__auto____13836) {
            return or__3824__auto____13836
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i)
    }
  };
  var _invoke__11 = function(this$, a, b, c, d, e, f, g, h, i, j) {
    if(function() {
      var and__3822__auto____13837 = this$;
      if(and__3822__auto____13837) {
        return this$.cljs$core$IFn$_invoke$arity$11
      }else {
        return and__3822__auto____13837
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$11(this$, a, b, c, d, e, f, g, h, i, j)
    }else {
      var x__2365__auto____13838 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____13839 = cljs.core._invoke[goog.typeOf(x__2365__auto____13838)];
        if(or__3824__auto____13839) {
          return or__3824__auto____13839
        }else {
          var or__3824__auto____13840 = cljs.core._invoke["_"];
          if(or__3824__auto____13840) {
            return or__3824__auto____13840
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j)
    }
  };
  var _invoke__12 = function(this$, a, b, c, d, e, f, g, h, i, j, k) {
    if(function() {
      var and__3822__auto____13841 = this$;
      if(and__3822__auto____13841) {
        return this$.cljs$core$IFn$_invoke$arity$12
      }else {
        return and__3822__auto____13841
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$12(this$, a, b, c, d, e, f, g, h, i, j, k)
    }else {
      var x__2365__auto____13842 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____13843 = cljs.core._invoke[goog.typeOf(x__2365__auto____13842)];
        if(or__3824__auto____13843) {
          return or__3824__auto____13843
        }else {
          var or__3824__auto____13844 = cljs.core._invoke["_"];
          if(or__3824__auto____13844) {
            return or__3824__auto____13844
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k)
    }
  };
  var _invoke__13 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l) {
    if(function() {
      var and__3822__auto____13845 = this$;
      if(and__3822__auto____13845) {
        return this$.cljs$core$IFn$_invoke$arity$13
      }else {
        return and__3822__auto____13845
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$13(this$, a, b, c, d, e, f, g, h, i, j, k, l)
    }else {
      var x__2365__auto____13846 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____13847 = cljs.core._invoke[goog.typeOf(x__2365__auto____13846)];
        if(or__3824__auto____13847) {
          return or__3824__auto____13847
        }else {
          var or__3824__auto____13848 = cljs.core._invoke["_"];
          if(or__3824__auto____13848) {
            return or__3824__auto____13848
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l)
    }
  };
  var _invoke__14 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m) {
    if(function() {
      var and__3822__auto____13849 = this$;
      if(and__3822__auto____13849) {
        return this$.cljs$core$IFn$_invoke$arity$14
      }else {
        return and__3822__auto____13849
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$14(this$, a, b, c, d, e, f, g, h, i, j, k, l, m)
    }else {
      var x__2365__auto____13850 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____13851 = cljs.core._invoke[goog.typeOf(x__2365__auto____13850)];
        if(or__3824__auto____13851) {
          return or__3824__auto____13851
        }else {
          var or__3824__auto____13852 = cljs.core._invoke["_"];
          if(or__3824__auto____13852) {
            return or__3824__auto____13852
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m)
    }
  };
  var _invoke__15 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n) {
    if(function() {
      var and__3822__auto____13853 = this$;
      if(and__3822__auto____13853) {
        return this$.cljs$core$IFn$_invoke$arity$15
      }else {
        return and__3822__auto____13853
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$15(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n)
    }else {
      var x__2365__auto____13854 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____13855 = cljs.core._invoke[goog.typeOf(x__2365__auto____13854)];
        if(or__3824__auto____13855) {
          return or__3824__auto____13855
        }else {
          var or__3824__auto____13856 = cljs.core._invoke["_"];
          if(or__3824__auto____13856) {
            return or__3824__auto____13856
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n)
    }
  };
  var _invoke__16 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o) {
    if(function() {
      var and__3822__auto____13857 = this$;
      if(and__3822__auto____13857) {
        return this$.cljs$core$IFn$_invoke$arity$16
      }else {
        return and__3822__auto____13857
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$16(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o)
    }else {
      var x__2365__auto____13858 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____13859 = cljs.core._invoke[goog.typeOf(x__2365__auto____13858)];
        if(or__3824__auto____13859) {
          return or__3824__auto____13859
        }else {
          var or__3824__auto____13860 = cljs.core._invoke["_"];
          if(or__3824__auto____13860) {
            return or__3824__auto____13860
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o)
    }
  };
  var _invoke__17 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p) {
    if(function() {
      var and__3822__auto____13861 = this$;
      if(and__3822__auto____13861) {
        return this$.cljs$core$IFn$_invoke$arity$17
      }else {
        return and__3822__auto____13861
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$17(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p)
    }else {
      var x__2365__auto____13862 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____13863 = cljs.core._invoke[goog.typeOf(x__2365__auto____13862)];
        if(or__3824__auto____13863) {
          return or__3824__auto____13863
        }else {
          var or__3824__auto____13864 = cljs.core._invoke["_"];
          if(or__3824__auto____13864) {
            return or__3824__auto____13864
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p)
    }
  };
  var _invoke__18 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q) {
    if(function() {
      var and__3822__auto____13865 = this$;
      if(and__3822__auto____13865) {
        return this$.cljs$core$IFn$_invoke$arity$18
      }else {
        return and__3822__auto____13865
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$18(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q)
    }else {
      var x__2365__auto____13866 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____13867 = cljs.core._invoke[goog.typeOf(x__2365__auto____13866)];
        if(or__3824__auto____13867) {
          return or__3824__auto____13867
        }else {
          var or__3824__auto____13868 = cljs.core._invoke["_"];
          if(or__3824__auto____13868) {
            return or__3824__auto____13868
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q)
    }
  };
  var _invoke__19 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s) {
    if(function() {
      var and__3822__auto____13869 = this$;
      if(and__3822__auto____13869) {
        return this$.cljs$core$IFn$_invoke$arity$19
      }else {
        return and__3822__auto____13869
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$19(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s)
    }else {
      var x__2365__auto____13870 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____13871 = cljs.core._invoke[goog.typeOf(x__2365__auto____13870)];
        if(or__3824__auto____13871) {
          return or__3824__auto____13871
        }else {
          var or__3824__auto____13872 = cljs.core._invoke["_"];
          if(or__3824__auto____13872) {
            return or__3824__auto____13872
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s)
    }
  };
  var _invoke__20 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t) {
    if(function() {
      var and__3822__auto____13873 = this$;
      if(and__3822__auto____13873) {
        return this$.cljs$core$IFn$_invoke$arity$20
      }else {
        return and__3822__auto____13873
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$20(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t)
    }else {
      var x__2365__auto____13874 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____13875 = cljs.core._invoke[goog.typeOf(x__2365__auto____13874)];
        if(or__3824__auto____13875) {
          return or__3824__auto____13875
        }else {
          var or__3824__auto____13876 = cljs.core._invoke["_"];
          if(or__3824__auto____13876) {
            return or__3824__auto____13876
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t)
    }
  };
  var _invoke__21 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t, rest) {
    if(function() {
      var and__3822__auto____13877 = this$;
      if(and__3822__auto____13877) {
        return this$.cljs$core$IFn$_invoke$arity$21
      }else {
        return and__3822__auto____13877
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$21(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t, rest)
    }else {
      var x__2365__auto____13878 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____13879 = cljs.core._invoke[goog.typeOf(x__2365__auto____13878)];
        if(or__3824__auto____13879) {
          return or__3824__auto____13879
        }else {
          var or__3824__auto____13880 = cljs.core._invoke["_"];
          if(or__3824__auto____13880) {
            return or__3824__auto____13880
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
    var and__3822__auto____13885 = coll;
    if(and__3822__auto____13885) {
      return coll.cljs$core$ICounted$_count$arity$1
    }else {
      return and__3822__auto____13885
    }
  }()) {
    return coll.cljs$core$ICounted$_count$arity$1(coll)
  }else {
    var x__2365__auto____13886 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____13887 = cljs.core._count[goog.typeOf(x__2365__auto____13886)];
      if(or__3824__auto____13887) {
        return or__3824__auto____13887
      }else {
        var or__3824__auto____13888 = cljs.core._count["_"];
        if(or__3824__auto____13888) {
          return or__3824__auto____13888
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
    var and__3822__auto____13893 = coll;
    if(and__3822__auto____13893) {
      return coll.cljs$core$IEmptyableCollection$_empty$arity$1
    }else {
      return and__3822__auto____13893
    }
  }()) {
    return coll.cljs$core$IEmptyableCollection$_empty$arity$1(coll)
  }else {
    var x__2365__auto____13894 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____13895 = cljs.core._empty[goog.typeOf(x__2365__auto____13894)];
      if(or__3824__auto____13895) {
        return or__3824__auto____13895
      }else {
        var or__3824__auto____13896 = cljs.core._empty["_"];
        if(or__3824__auto____13896) {
          return or__3824__auto____13896
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
    var and__3822__auto____13901 = coll;
    if(and__3822__auto____13901) {
      return coll.cljs$core$ICollection$_conj$arity$2
    }else {
      return and__3822__auto____13901
    }
  }()) {
    return coll.cljs$core$ICollection$_conj$arity$2(coll, o)
  }else {
    var x__2365__auto____13902 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____13903 = cljs.core._conj[goog.typeOf(x__2365__auto____13902)];
      if(or__3824__auto____13903) {
        return or__3824__auto____13903
      }else {
        var or__3824__auto____13904 = cljs.core._conj["_"];
        if(or__3824__auto____13904) {
          return or__3824__auto____13904
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
      var and__3822__auto____13913 = coll;
      if(and__3822__auto____13913) {
        return coll.cljs$core$IIndexed$_nth$arity$2
      }else {
        return and__3822__auto____13913
      }
    }()) {
      return coll.cljs$core$IIndexed$_nth$arity$2(coll, n)
    }else {
      var x__2365__auto____13914 = coll == null ? null : coll;
      return function() {
        var or__3824__auto____13915 = cljs.core._nth[goog.typeOf(x__2365__auto____13914)];
        if(or__3824__auto____13915) {
          return or__3824__auto____13915
        }else {
          var or__3824__auto____13916 = cljs.core._nth["_"];
          if(or__3824__auto____13916) {
            return or__3824__auto____13916
          }else {
            throw cljs.core.missing_protocol.call(null, "IIndexed.-nth", coll);
          }
        }
      }().call(null, coll, n)
    }
  };
  var _nth__3 = function(coll, n, not_found) {
    if(function() {
      var and__3822__auto____13917 = coll;
      if(and__3822__auto____13917) {
        return coll.cljs$core$IIndexed$_nth$arity$3
      }else {
        return and__3822__auto____13917
      }
    }()) {
      return coll.cljs$core$IIndexed$_nth$arity$3(coll, n, not_found)
    }else {
      var x__2365__auto____13918 = coll == null ? null : coll;
      return function() {
        var or__3824__auto____13919 = cljs.core._nth[goog.typeOf(x__2365__auto____13918)];
        if(or__3824__auto____13919) {
          return or__3824__auto____13919
        }else {
          var or__3824__auto____13920 = cljs.core._nth["_"];
          if(or__3824__auto____13920) {
            return or__3824__auto____13920
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
    var and__3822__auto____13925 = coll;
    if(and__3822__auto____13925) {
      return coll.cljs$core$ISeq$_first$arity$1
    }else {
      return and__3822__auto____13925
    }
  }()) {
    return coll.cljs$core$ISeq$_first$arity$1(coll)
  }else {
    var x__2365__auto____13926 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____13927 = cljs.core._first[goog.typeOf(x__2365__auto____13926)];
      if(or__3824__auto____13927) {
        return or__3824__auto____13927
      }else {
        var or__3824__auto____13928 = cljs.core._first["_"];
        if(or__3824__auto____13928) {
          return or__3824__auto____13928
        }else {
          throw cljs.core.missing_protocol.call(null, "ISeq.-first", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core._rest = function _rest(coll) {
  if(function() {
    var and__3822__auto____13933 = coll;
    if(and__3822__auto____13933) {
      return coll.cljs$core$ISeq$_rest$arity$1
    }else {
      return and__3822__auto____13933
    }
  }()) {
    return coll.cljs$core$ISeq$_rest$arity$1(coll)
  }else {
    var x__2365__auto____13934 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____13935 = cljs.core._rest[goog.typeOf(x__2365__auto____13934)];
      if(or__3824__auto____13935) {
        return or__3824__auto____13935
      }else {
        var or__3824__auto____13936 = cljs.core._rest["_"];
        if(or__3824__auto____13936) {
          return or__3824__auto____13936
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
    var and__3822__auto____13941 = coll;
    if(and__3822__auto____13941) {
      return coll.cljs$core$INext$_next$arity$1
    }else {
      return and__3822__auto____13941
    }
  }()) {
    return coll.cljs$core$INext$_next$arity$1(coll)
  }else {
    var x__2365__auto____13942 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____13943 = cljs.core._next[goog.typeOf(x__2365__auto____13942)];
      if(or__3824__auto____13943) {
        return or__3824__auto____13943
      }else {
        var or__3824__auto____13944 = cljs.core._next["_"];
        if(or__3824__auto____13944) {
          return or__3824__auto____13944
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
      var and__3822__auto____13953 = o;
      if(and__3822__auto____13953) {
        return o.cljs$core$ILookup$_lookup$arity$2
      }else {
        return and__3822__auto____13953
      }
    }()) {
      return o.cljs$core$ILookup$_lookup$arity$2(o, k)
    }else {
      var x__2365__auto____13954 = o == null ? null : o;
      return function() {
        var or__3824__auto____13955 = cljs.core._lookup[goog.typeOf(x__2365__auto____13954)];
        if(or__3824__auto____13955) {
          return or__3824__auto____13955
        }else {
          var or__3824__auto____13956 = cljs.core._lookup["_"];
          if(or__3824__auto____13956) {
            return or__3824__auto____13956
          }else {
            throw cljs.core.missing_protocol.call(null, "ILookup.-lookup", o);
          }
        }
      }().call(null, o, k)
    }
  };
  var _lookup__3 = function(o, k, not_found) {
    if(function() {
      var and__3822__auto____13957 = o;
      if(and__3822__auto____13957) {
        return o.cljs$core$ILookup$_lookup$arity$3
      }else {
        return and__3822__auto____13957
      }
    }()) {
      return o.cljs$core$ILookup$_lookup$arity$3(o, k, not_found)
    }else {
      var x__2365__auto____13958 = o == null ? null : o;
      return function() {
        var or__3824__auto____13959 = cljs.core._lookup[goog.typeOf(x__2365__auto____13958)];
        if(or__3824__auto____13959) {
          return or__3824__auto____13959
        }else {
          var or__3824__auto____13960 = cljs.core._lookup["_"];
          if(or__3824__auto____13960) {
            return or__3824__auto____13960
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
    var and__3822__auto____13965 = coll;
    if(and__3822__auto____13965) {
      return coll.cljs$core$IAssociative$_contains_key_QMARK_$arity$2
    }else {
      return and__3822__auto____13965
    }
  }()) {
    return coll.cljs$core$IAssociative$_contains_key_QMARK_$arity$2(coll, k)
  }else {
    var x__2365__auto____13966 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____13967 = cljs.core._contains_key_QMARK_[goog.typeOf(x__2365__auto____13966)];
      if(or__3824__auto____13967) {
        return or__3824__auto____13967
      }else {
        var or__3824__auto____13968 = cljs.core._contains_key_QMARK_["_"];
        if(or__3824__auto____13968) {
          return or__3824__auto____13968
        }else {
          throw cljs.core.missing_protocol.call(null, "IAssociative.-contains-key?", coll);
        }
      }
    }().call(null, coll, k)
  }
};
cljs.core._assoc = function _assoc(coll, k, v) {
  if(function() {
    var and__3822__auto____13973 = coll;
    if(and__3822__auto____13973) {
      return coll.cljs$core$IAssociative$_assoc$arity$3
    }else {
      return and__3822__auto____13973
    }
  }()) {
    return coll.cljs$core$IAssociative$_assoc$arity$3(coll, k, v)
  }else {
    var x__2365__auto____13974 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____13975 = cljs.core._assoc[goog.typeOf(x__2365__auto____13974)];
      if(or__3824__auto____13975) {
        return or__3824__auto____13975
      }else {
        var or__3824__auto____13976 = cljs.core._assoc["_"];
        if(or__3824__auto____13976) {
          return or__3824__auto____13976
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
    var and__3822__auto____13981 = coll;
    if(and__3822__auto____13981) {
      return coll.cljs$core$IMap$_dissoc$arity$2
    }else {
      return and__3822__auto____13981
    }
  }()) {
    return coll.cljs$core$IMap$_dissoc$arity$2(coll, k)
  }else {
    var x__2365__auto____13982 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____13983 = cljs.core._dissoc[goog.typeOf(x__2365__auto____13982)];
      if(or__3824__auto____13983) {
        return or__3824__auto____13983
      }else {
        var or__3824__auto____13984 = cljs.core._dissoc["_"];
        if(or__3824__auto____13984) {
          return or__3824__auto____13984
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
    var and__3822__auto____13989 = coll;
    if(and__3822__auto____13989) {
      return coll.cljs$core$IMapEntry$_key$arity$1
    }else {
      return and__3822__auto____13989
    }
  }()) {
    return coll.cljs$core$IMapEntry$_key$arity$1(coll)
  }else {
    var x__2365__auto____13990 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____13991 = cljs.core._key[goog.typeOf(x__2365__auto____13990)];
      if(or__3824__auto____13991) {
        return or__3824__auto____13991
      }else {
        var or__3824__auto____13992 = cljs.core._key["_"];
        if(or__3824__auto____13992) {
          return or__3824__auto____13992
        }else {
          throw cljs.core.missing_protocol.call(null, "IMapEntry.-key", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core._val = function _val(coll) {
  if(function() {
    var and__3822__auto____13997 = coll;
    if(and__3822__auto____13997) {
      return coll.cljs$core$IMapEntry$_val$arity$1
    }else {
      return and__3822__auto____13997
    }
  }()) {
    return coll.cljs$core$IMapEntry$_val$arity$1(coll)
  }else {
    var x__2365__auto____13998 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____13999 = cljs.core._val[goog.typeOf(x__2365__auto____13998)];
      if(or__3824__auto____13999) {
        return or__3824__auto____13999
      }else {
        var or__3824__auto____14000 = cljs.core._val["_"];
        if(or__3824__auto____14000) {
          return or__3824__auto____14000
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
    var and__3822__auto____14005 = coll;
    if(and__3822__auto____14005) {
      return coll.cljs$core$ISet$_disjoin$arity$2
    }else {
      return and__3822__auto____14005
    }
  }()) {
    return coll.cljs$core$ISet$_disjoin$arity$2(coll, v)
  }else {
    var x__2365__auto____14006 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____14007 = cljs.core._disjoin[goog.typeOf(x__2365__auto____14006)];
      if(or__3824__auto____14007) {
        return or__3824__auto____14007
      }else {
        var or__3824__auto____14008 = cljs.core._disjoin["_"];
        if(or__3824__auto____14008) {
          return or__3824__auto____14008
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
    var and__3822__auto____14013 = coll;
    if(and__3822__auto____14013) {
      return coll.cljs$core$IStack$_peek$arity$1
    }else {
      return and__3822__auto____14013
    }
  }()) {
    return coll.cljs$core$IStack$_peek$arity$1(coll)
  }else {
    var x__2365__auto____14014 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____14015 = cljs.core._peek[goog.typeOf(x__2365__auto____14014)];
      if(or__3824__auto____14015) {
        return or__3824__auto____14015
      }else {
        var or__3824__auto____14016 = cljs.core._peek["_"];
        if(or__3824__auto____14016) {
          return or__3824__auto____14016
        }else {
          throw cljs.core.missing_protocol.call(null, "IStack.-peek", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core._pop = function _pop(coll) {
  if(function() {
    var and__3822__auto____14021 = coll;
    if(and__3822__auto____14021) {
      return coll.cljs$core$IStack$_pop$arity$1
    }else {
      return and__3822__auto____14021
    }
  }()) {
    return coll.cljs$core$IStack$_pop$arity$1(coll)
  }else {
    var x__2365__auto____14022 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____14023 = cljs.core._pop[goog.typeOf(x__2365__auto____14022)];
      if(or__3824__auto____14023) {
        return or__3824__auto____14023
      }else {
        var or__3824__auto____14024 = cljs.core._pop["_"];
        if(or__3824__auto____14024) {
          return or__3824__auto____14024
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
    var and__3822__auto____14029 = coll;
    if(and__3822__auto____14029) {
      return coll.cljs$core$IVector$_assoc_n$arity$3
    }else {
      return and__3822__auto____14029
    }
  }()) {
    return coll.cljs$core$IVector$_assoc_n$arity$3(coll, n, val)
  }else {
    var x__2365__auto____14030 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____14031 = cljs.core._assoc_n[goog.typeOf(x__2365__auto____14030)];
      if(or__3824__auto____14031) {
        return or__3824__auto____14031
      }else {
        var or__3824__auto____14032 = cljs.core._assoc_n["_"];
        if(or__3824__auto____14032) {
          return or__3824__auto____14032
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
    var and__3822__auto____14037 = o;
    if(and__3822__auto____14037) {
      return o.cljs$core$IDeref$_deref$arity$1
    }else {
      return and__3822__auto____14037
    }
  }()) {
    return o.cljs$core$IDeref$_deref$arity$1(o)
  }else {
    var x__2365__auto____14038 = o == null ? null : o;
    return function() {
      var or__3824__auto____14039 = cljs.core._deref[goog.typeOf(x__2365__auto____14038)];
      if(or__3824__auto____14039) {
        return or__3824__auto____14039
      }else {
        var or__3824__auto____14040 = cljs.core._deref["_"];
        if(or__3824__auto____14040) {
          return or__3824__auto____14040
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
    var and__3822__auto____14045 = o;
    if(and__3822__auto____14045) {
      return o.cljs$core$IDerefWithTimeout$_deref_with_timeout$arity$3
    }else {
      return and__3822__auto____14045
    }
  }()) {
    return o.cljs$core$IDerefWithTimeout$_deref_with_timeout$arity$3(o, msec, timeout_val)
  }else {
    var x__2365__auto____14046 = o == null ? null : o;
    return function() {
      var or__3824__auto____14047 = cljs.core._deref_with_timeout[goog.typeOf(x__2365__auto____14046)];
      if(or__3824__auto____14047) {
        return or__3824__auto____14047
      }else {
        var or__3824__auto____14048 = cljs.core._deref_with_timeout["_"];
        if(or__3824__auto____14048) {
          return or__3824__auto____14048
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
    var and__3822__auto____14053 = o;
    if(and__3822__auto____14053) {
      return o.cljs$core$IMeta$_meta$arity$1
    }else {
      return and__3822__auto____14053
    }
  }()) {
    return o.cljs$core$IMeta$_meta$arity$1(o)
  }else {
    var x__2365__auto____14054 = o == null ? null : o;
    return function() {
      var or__3824__auto____14055 = cljs.core._meta[goog.typeOf(x__2365__auto____14054)];
      if(or__3824__auto____14055) {
        return or__3824__auto____14055
      }else {
        var or__3824__auto____14056 = cljs.core._meta["_"];
        if(or__3824__auto____14056) {
          return or__3824__auto____14056
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
    var and__3822__auto____14061 = o;
    if(and__3822__auto____14061) {
      return o.cljs$core$IWithMeta$_with_meta$arity$2
    }else {
      return and__3822__auto____14061
    }
  }()) {
    return o.cljs$core$IWithMeta$_with_meta$arity$2(o, meta)
  }else {
    var x__2365__auto____14062 = o == null ? null : o;
    return function() {
      var or__3824__auto____14063 = cljs.core._with_meta[goog.typeOf(x__2365__auto____14062)];
      if(or__3824__auto____14063) {
        return or__3824__auto____14063
      }else {
        var or__3824__auto____14064 = cljs.core._with_meta["_"];
        if(or__3824__auto____14064) {
          return or__3824__auto____14064
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
      var and__3822__auto____14073 = coll;
      if(and__3822__auto____14073) {
        return coll.cljs$core$IReduce$_reduce$arity$2
      }else {
        return and__3822__auto____14073
      }
    }()) {
      return coll.cljs$core$IReduce$_reduce$arity$2(coll, f)
    }else {
      var x__2365__auto____14074 = coll == null ? null : coll;
      return function() {
        var or__3824__auto____14075 = cljs.core._reduce[goog.typeOf(x__2365__auto____14074)];
        if(or__3824__auto____14075) {
          return or__3824__auto____14075
        }else {
          var or__3824__auto____14076 = cljs.core._reduce["_"];
          if(or__3824__auto____14076) {
            return or__3824__auto____14076
          }else {
            throw cljs.core.missing_protocol.call(null, "IReduce.-reduce", coll);
          }
        }
      }().call(null, coll, f)
    }
  };
  var _reduce__3 = function(coll, f, start) {
    if(function() {
      var and__3822__auto____14077 = coll;
      if(and__3822__auto____14077) {
        return coll.cljs$core$IReduce$_reduce$arity$3
      }else {
        return and__3822__auto____14077
      }
    }()) {
      return coll.cljs$core$IReduce$_reduce$arity$3(coll, f, start)
    }else {
      var x__2365__auto____14078 = coll == null ? null : coll;
      return function() {
        var or__3824__auto____14079 = cljs.core._reduce[goog.typeOf(x__2365__auto____14078)];
        if(or__3824__auto____14079) {
          return or__3824__auto____14079
        }else {
          var or__3824__auto____14080 = cljs.core._reduce["_"];
          if(or__3824__auto____14080) {
            return or__3824__auto____14080
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
    var and__3822__auto____14085 = coll;
    if(and__3822__auto____14085) {
      return coll.cljs$core$IKVReduce$_kv_reduce$arity$3
    }else {
      return and__3822__auto____14085
    }
  }()) {
    return coll.cljs$core$IKVReduce$_kv_reduce$arity$3(coll, f, init)
  }else {
    var x__2365__auto____14086 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____14087 = cljs.core._kv_reduce[goog.typeOf(x__2365__auto____14086)];
      if(or__3824__auto____14087) {
        return or__3824__auto____14087
      }else {
        var or__3824__auto____14088 = cljs.core._kv_reduce["_"];
        if(or__3824__auto____14088) {
          return or__3824__auto____14088
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
    var and__3822__auto____14093 = o;
    if(and__3822__auto____14093) {
      return o.cljs$core$IEquiv$_equiv$arity$2
    }else {
      return and__3822__auto____14093
    }
  }()) {
    return o.cljs$core$IEquiv$_equiv$arity$2(o, other)
  }else {
    var x__2365__auto____14094 = o == null ? null : o;
    return function() {
      var or__3824__auto____14095 = cljs.core._equiv[goog.typeOf(x__2365__auto____14094)];
      if(or__3824__auto____14095) {
        return or__3824__auto____14095
      }else {
        var or__3824__auto____14096 = cljs.core._equiv["_"];
        if(or__3824__auto____14096) {
          return or__3824__auto____14096
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
    var and__3822__auto____14101 = o;
    if(and__3822__auto____14101) {
      return o.cljs$core$IHash$_hash$arity$1
    }else {
      return and__3822__auto____14101
    }
  }()) {
    return o.cljs$core$IHash$_hash$arity$1(o)
  }else {
    var x__2365__auto____14102 = o == null ? null : o;
    return function() {
      var or__3824__auto____14103 = cljs.core._hash[goog.typeOf(x__2365__auto____14102)];
      if(or__3824__auto____14103) {
        return or__3824__auto____14103
      }else {
        var or__3824__auto____14104 = cljs.core._hash["_"];
        if(or__3824__auto____14104) {
          return or__3824__auto____14104
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
    var and__3822__auto____14109 = o;
    if(and__3822__auto____14109) {
      return o.cljs$core$ISeqable$_seq$arity$1
    }else {
      return and__3822__auto____14109
    }
  }()) {
    return o.cljs$core$ISeqable$_seq$arity$1(o)
  }else {
    var x__2365__auto____14110 = o == null ? null : o;
    return function() {
      var or__3824__auto____14111 = cljs.core._seq[goog.typeOf(x__2365__auto____14110)];
      if(or__3824__auto____14111) {
        return or__3824__auto____14111
      }else {
        var or__3824__auto____14112 = cljs.core._seq["_"];
        if(or__3824__auto____14112) {
          return or__3824__auto____14112
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
    var and__3822__auto____14117 = coll;
    if(and__3822__auto____14117) {
      return coll.cljs$core$IReversible$_rseq$arity$1
    }else {
      return and__3822__auto____14117
    }
  }()) {
    return coll.cljs$core$IReversible$_rseq$arity$1(coll)
  }else {
    var x__2365__auto____14118 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____14119 = cljs.core._rseq[goog.typeOf(x__2365__auto____14118)];
      if(or__3824__auto____14119) {
        return or__3824__auto____14119
      }else {
        var or__3824__auto____14120 = cljs.core._rseq["_"];
        if(or__3824__auto____14120) {
          return or__3824__auto____14120
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
    var and__3822__auto____14125 = coll;
    if(and__3822__auto____14125) {
      return coll.cljs$core$ISorted$_sorted_seq$arity$2
    }else {
      return and__3822__auto____14125
    }
  }()) {
    return coll.cljs$core$ISorted$_sorted_seq$arity$2(coll, ascending_QMARK_)
  }else {
    var x__2365__auto____14126 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____14127 = cljs.core._sorted_seq[goog.typeOf(x__2365__auto____14126)];
      if(or__3824__auto____14127) {
        return or__3824__auto____14127
      }else {
        var or__3824__auto____14128 = cljs.core._sorted_seq["_"];
        if(or__3824__auto____14128) {
          return or__3824__auto____14128
        }else {
          throw cljs.core.missing_protocol.call(null, "ISorted.-sorted-seq", coll);
        }
      }
    }().call(null, coll, ascending_QMARK_)
  }
};
cljs.core._sorted_seq_from = function _sorted_seq_from(coll, k, ascending_QMARK_) {
  if(function() {
    var and__3822__auto____14133 = coll;
    if(and__3822__auto____14133) {
      return coll.cljs$core$ISorted$_sorted_seq_from$arity$3
    }else {
      return and__3822__auto____14133
    }
  }()) {
    return coll.cljs$core$ISorted$_sorted_seq_from$arity$3(coll, k, ascending_QMARK_)
  }else {
    var x__2365__auto____14134 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____14135 = cljs.core._sorted_seq_from[goog.typeOf(x__2365__auto____14134)];
      if(or__3824__auto____14135) {
        return or__3824__auto____14135
      }else {
        var or__3824__auto____14136 = cljs.core._sorted_seq_from["_"];
        if(or__3824__auto____14136) {
          return or__3824__auto____14136
        }else {
          throw cljs.core.missing_protocol.call(null, "ISorted.-sorted-seq-from", coll);
        }
      }
    }().call(null, coll, k, ascending_QMARK_)
  }
};
cljs.core._entry_key = function _entry_key(coll, entry) {
  if(function() {
    var and__3822__auto____14141 = coll;
    if(and__3822__auto____14141) {
      return coll.cljs$core$ISorted$_entry_key$arity$2
    }else {
      return and__3822__auto____14141
    }
  }()) {
    return coll.cljs$core$ISorted$_entry_key$arity$2(coll, entry)
  }else {
    var x__2365__auto____14142 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____14143 = cljs.core._entry_key[goog.typeOf(x__2365__auto____14142)];
      if(or__3824__auto____14143) {
        return or__3824__auto____14143
      }else {
        var or__3824__auto____14144 = cljs.core._entry_key["_"];
        if(or__3824__auto____14144) {
          return or__3824__auto____14144
        }else {
          throw cljs.core.missing_protocol.call(null, "ISorted.-entry-key", coll);
        }
      }
    }().call(null, coll, entry)
  }
};
cljs.core._comparator = function _comparator(coll) {
  if(function() {
    var and__3822__auto____14149 = coll;
    if(and__3822__auto____14149) {
      return coll.cljs$core$ISorted$_comparator$arity$1
    }else {
      return and__3822__auto____14149
    }
  }()) {
    return coll.cljs$core$ISorted$_comparator$arity$1(coll)
  }else {
    var x__2365__auto____14150 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____14151 = cljs.core._comparator[goog.typeOf(x__2365__auto____14150)];
      if(or__3824__auto____14151) {
        return or__3824__auto____14151
      }else {
        var or__3824__auto____14152 = cljs.core._comparator["_"];
        if(or__3824__auto____14152) {
          return or__3824__auto____14152
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
    var and__3822__auto____14157 = o;
    if(and__3822__auto____14157) {
      return o.cljs$core$IPrintable$_pr_seq$arity$2
    }else {
      return and__3822__auto____14157
    }
  }()) {
    return o.cljs$core$IPrintable$_pr_seq$arity$2(o, opts)
  }else {
    var x__2365__auto____14158 = o == null ? null : o;
    return function() {
      var or__3824__auto____14159 = cljs.core._pr_seq[goog.typeOf(x__2365__auto____14158)];
      if(or__3824__auto____14159) {
        return or__3824__auto____14159
      }else {
        var or__3824__auto____14160 = cljs.core._pr_seq["_"];
        if(or__3824__auto____14160) {
          return or__3824__auto____14160
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
    var and__3822__auto____14165 = d;
    if(and__3822__auto____14165) {
      return d.cljs$core$IPending$_realized_QMARK_$arity$1
    }else {
      return and__3822__auto____14165
    }
  }()) {
    return d.cljs$core$IPending$_realized_QMARK_$arity$1(d)
  }else {
    var x__2365__auto____14166 = d == null ? null : d;
    return function() {
      var or__3824__auto____14167 = cljs.core._realized_QMARK_[goog.typeOf(x__2365__auto____14166)];
      if(or__3824__auto____14167) {
        return or__3824__auto____14167
      }else {
        var or__3824__auto____14168 = cljs.core._realized_QMARK_["_"];
        if(or__3824__auto____14168) {
          return or__3824__auto____14168
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
    var and__3822__auto____14173 = this$;
    if(and__3822__auto____14173) {
      return this$.cljs$core$IWatchable$_notify_watches$arity$3
    }else {
      return and__3822__auto____14173
    }
  }()) {
    return this$.cljs$core$IWatchable$_notify_watches$arity$3(this$, oldval, newval)
  }else {
    var x__2365__auto____14174 = this$ == null ? null : this$;
    return function() {
      var or__3824__auto____14175 = cljs.core._notify_watches[goog.typeOf(x__2365__auto____14174)];
      if(or__3824__auto____14175) {
        return or__3824__auto____14175
      }else {
        var or__3824__auto____14176 = cljs.core._notify_watches["_"];
        if(or__3824__auto____14176) {
          return or__3824__auto____14176
        }else {
          throw cljs.core.missing_protocol.call(null, "IWatchable.-notify-watches", this$);
        }
      }
    }().call(null, this$, oldval, newval)
  }
};
cljs.core._add_watch = function _add_watch(this$, key, f) {
  if(function() {
    var and__3822__auto____14181 = this$;
    if(and__3822__auto____14181) {
      return this$.cljs$core$IWatchable$_add_watch$arity$3
    }else {
      return and__3822__auto____14181
    }
  }()) {
    return this$.cljs$core$IWatchable$_add_watch$arity$3(this$, key, f)
  }else {
    var x__2365__auto____14182 = this$ == null ? null : this$;
    return function() {
      var or__3824__auto____14183 = cljs.core._add_watch[goog.typeOf(x__2365__auto____14182)];
      if(or__3824__auto____14183) {
        return or__3824__auto____14183
      }else {
        var or__3824__auto____14184 = cljs.core._add_watch["_"];
        if(or__3824__auto____14184) {
          return or__3824__auto____14184
        }else {
          throw cljs.core.missing_protocol.call(null, "IWatchable.-add-watch", this$);
        }
      }
    }().call(null, this$, key, f)
  }
};
cljs.core._remove_watch = function _remove_watch(this$, key) {
  if(function() {
    var and__3822__auto____14189 = this$;
    if(and__3822__auto____14189) {
      return this$.cljs$core$IWatchable$_remove_watch$arity$2
    }else {
      return and__3822__auto____14189
    }
  }()) {
    return this$.cljs$core$IWatchable$_remove_watch$arity$2(this$, key)
  }else {
    var x__2365__auto____14190 = this$ == null ? null : this$;
    return function() {
      var or__3824__auto____14191 = cljs.core._remove_watch[goog.typeOf(x__2365__auto____14190)];
      if(or__3824__auto____14191) {
        return or__3824__auto____14191
      }else {
        var or__3824__auto____14192 = cljs.core._remove_watch["_"];
        if(or__3824__auto____14192) {
          return or__3824__auto____14192
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
    var and__3822__auto____14197 = coll;
    if(and__3822__auto____14197) {
      return coll.cljs$core$IEditableCollection$_as_transient$arity$1
    }else {
      return and__3822__auto____14197
    }
  }()) {
    return coll.cljs$core$IEditableCollection$_as_transient$arity$1(coll)
  }else {
    var x__2365__auto____14198 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____14199 = cljs.core._as_transient[goog.typeOf(x__2365__auto____14198)];
      if(or__3824__auto____14199) {
        return or__3824__auto____14199
      }else {
        var or__3824__auto____14200 = cljs.core._as_transient["_"];
        if(or__3824__auto____14200) {
          return or__3824__auto____14200
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
    var and__3822__auto____14205 = tcoll;
    if(and__3822__auto____14205) {
      return tcoll.cljs$core$ITransientCollection$_conj_BANG_$arity$2
    }else {
      return and__3822__auto____14205
    }
  }()) {
    return tcoll.cljs$core$ITransientCollection$_conj_BANG_$arity$2(tcoll, val)
  }else {
    var x__2365__auto____14206 = tcoll == null ? null : tcoll;
    return function() {
      var or__3824__auto____14207 = cljs.core._conj_BANG_[goog.typeOf(x__2365__auto____14206)];
      if(or__3824__auto____14207) {
        return or__3824__auto____14207
      }else {
        var or__3824__auto____14208 = cljs.core._conj_BANG_["_"];
        if(or__3824__auto____14208) {
          return or__3824__auto____14208
        }else {
          throw cljs.core.missing_protocol.call(null, "ITransientCollection.-conj!", tcoll);
        }
      }
    }().call(null, tcoll, val)
  }
};
cljs.core._persistent_BANG_ = function _persistent_BANG_(tcoll) {
  if(function() {
    var and__3822__auto____14213 = tcoll;
    if(and__3822__auto____14213) {
      return tcoll.cljs$core$ITransientCollection$_persistent_BANG_$arity$1
    }else {
      return and__3822__auto____14213
    }
  }()) {
    return tcoll.cljs$core$ITransientCollection$_persistent_BANG_$arity$1(tcoll)
  }else {
    var x__2365__auto____14214 = tcoll == null ? null : tcoll;
    return function() {
      var or__3824__auto____14215 = cljs.core._persistent_BANG_[goog.typeOf(x__2365__auto____14214)];
      if(or__3824__auto____14215) {
        return or__3824__auto____14215
      }else {
        var or__3824__auto____14216 = cljs.core._persistent_BANG_["_"];
        if(or__3824__auto____14216) {
          return or__3824__auto____14216
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
    var and__3822__auto____14221 = tcoll;
    if(and__3822__auto____14221) {
      return tcoll.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3
    }else {
      return and__3822__auto____14221
    }
  }()) {
    return tcoll.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3(tcoll, key, val)
  }else {
    var x__2365__auto____14222 = tcoll == null ? null : tcoll;
    return function() {
      var or__3824__auto____14223 = cljs.core._assoc_BANG_[goog.typeOf(x__2365__auto____14222)];
      if(or__3824__auto____14223) {
        return or__3824__auto____14223
      }else {
        var or__3824__auto____14224 = cljs.core._assoc_BANG_["_"];
        if(or__3824__auto____14224) {
          return or__3824__auto____14224
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
    var and__3822__auto____14229 = tcoll;
    if(and__3822__auto____14229) {
      return tcoll.cljs$core$ITransientMap$_dissoc_BANG_$arity$2
    }else {
      return and__3822__auto____14229
    }
  }()) {
    return tcoll.cljs$core$ITransientMap$_dissoc_BANG_$arity$2(tcoll, key)
  }else {
    var x__2365__auto____14230 = tcoll == null ? null : tcoll;
    return function() {
      var or__3824__auto____14231 = cljs.core._dissoc_BANG_[goog.typeOf(x__2365__auto____14230)];
      if(or__3824__auto____14231) {
        return or__3824__auto____14231
      }else {
        var or__3824__auto____14232 = cljs.core._dissoc_BANG_["_"];
        if(or__3824__auto____14232) {
          return or__3824__auto____14232
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
    var and__3822__auto____14237 = tcoll;
    if(and__3822__auto____14237) {
      return tcoll.cljs$core$ITransientVector$_assoc_n_BANG_$arity$3
    }else {
      return and__3822__auto____14237
    }
  }()) {
    return tcoll.cljs$core$ITransientVector$_assoc_n_BANG_$arity$3(tcoll, n, val)
  }else {
    var x__2365__auto____14238 = tcoll == null ? null : tcoll;
    return function() {
      var or__3824__auto____14239 = cljs.core._assoc_n_BANG_[goog.typeOf(x__2365__auto____14238)];
      if(or__3824__auto____14239) {
        return or__3824__auto____14239
      }else {
        var or__3824__auto____14240 = cljs.core._assoc_n_BANG_["_"];
        if(or__3824__auto____14240) {
          return or__3824__auto____14240
        }else {
          throw cljs.core.missing_protocol.call(null, "ITransientVector.-assoc-n!", tcoll);
        }
      }
    }().call(null, tcoll, n, val)
  }
};
cljs.core._pop_BANG_ = function _pop_BANG_(tcoll) {
  if(function() {
    var and__3822__auto____14245 = tcoll;
    if(and__3822__auto____14245) {
      return tcoll.cljs$core$ITransientVector$_pop_BANG_$arity$1
    }else {
      return and__3822__auto____14245
    }
  }()) {
    return tcoll.cljs$core$ITransientVector$_pop_BANG_$arity$1(tcoll)
  }else {
    var x__2365__auto____14246 = tcoll == null ? null : tcoll;
    return function() {
      var or__3824__auto____14247 = cljs.core._pop_BANG_[goog.typeOf(x__2365__auto____14246)];
      if(or__3824__auto____14247) {
        return or__3824__auto____14247
      }else {
        var or__3824__auto____14248 = cljs.core._pop_BANG_["_"];
        if(or__3824__auto____14248) {
          return or__3824__auto____14248
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
    var and__3822__auto____14253 = tcoll;
    if(and__3822__auto____14253) {
      return tcoll.cljs$core$ITransientSet$_disjoin_BANG_$arity$2
    }else {
      return and__3822__auto____14253
    }
  }()) {
    return tcoll.cljs$core$ITransientSet$_disjoin_BANG_$arity$2(tcoll, v)
  }else {
    var x__2365__auto____14254 = tcoll == null ? null : tcoll;
    return function() {
      var or__3824__auto____14255 = cljs.core._disjoin_BANG_[goog.typeOf(x__2365__auto____14254)];
      if(or__3824__auto____14255) {
        return or__3824__auto____14255
      }else {
        var or__3824__auto____14256 = cljs.core._disjoin_BANG_["_"];
        if(or__3824__auto____14256) {
          return or__3824__auto____14256
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
    var and__3822__auto____14261 = x;
    if(and__3822__auto____14261) {
      return x.cljs$core$IComparable$_compare$arity$2
    }else {
      return and__3822__auto____14261
    }
  }()) {
    return x.cljs$core$IComparable$_compare$arity$2(x, y)
  }else {
    var x__2365__auto____14262 = x == null ? null : x;
    return function() {
      var or__3824__auto____14263 = cljs.core._compare[goog.typeOf(x__2365__auto____14262)];
      if(or__3824__auto____14263) {
        return or__3824__auto____14263
      }else {
        var or__3824__auto____14264 = cljs.core._compare["_"];
        if(or__3824__auto____14264) {
          return or__3824__auto____14264
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
    var and__3822__auto____14269 = coll;
    if(and__3822__auto____14269) {
      return coll.cljs$core$IChunk$_drop_first$arity$1
    }else {
      return and__3822__auto____14269
    }
  }()) {
    return coll.cljs$core$IChunk$_drop_first$arity$1(coll)
  }else {
    var x__2365__auto____14270 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____14271 = cljs.core._drop_first[goog.typeOf(x__2365__auto____14270)];
      if(or__3824__auto____14271) {
        return or__3824__auto____14271
      }else {
        var or__3824__auto____14272 = cljs.core._drop_first["_"];
        if(or__3824__auto____14272) {
          return or__3824__auto____14272
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
    var and__3822__auto____14277 = coll;
    if(and__3822__auto____14277) {
      return coll.cljs$core$IChunkedSeq$_chunked_first$arity$1
    }else {
      return and__3822__auto____14277
    }
  }()) {
    return coll.cljs$core$IChunkedSeq$_chunked_first$arity$1(coll)
  }else {
    var x__2365__auto____14278 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____14279 = cljs.core._chunked_first[goog.typeOf(x__2365__auto____14278)];
      if(or__3824__auto____14279) {
        return or__3824__auto____14279
      }else {
        var or__3824__auto____14280 = cljs.core._chunked_first["_"];
        if(or__3824__auto____14280) {
          return or__3824__auto____14280
        }else {
          throw cljs.core.missing_protocol.call(null, "IChunkedSeq.-chunked-first", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core._chunked_rest = function _chunked_rest(coll) {
  if(function() {
    var and__3822__auto____14285 = coll;
    if(and__3822__auto____14285) {
      return coll.cljs$core$IChunkedSeq$_chunked_rest$arity$1
    }else {
      return and__3822__auto____14285
    }
  }()) {
    return coll.cljs$core$IChunkedSeq$_chunked_rest$arity$1(coll)
  }else {
    var x__2365__auto____14286 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____14287 = cljs.core._chunked_rest[goog.typeOf(x__2365__auto____14286)];
      if(or__3824__auto____14287) {
        return or__3824__auto____14287
      }else {
        var or__3824__auto____14288 = cljs.core._chunked_rest["_"];
        if(or__3824__auto____14288) {
          return or__3824__auto____14288
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
    var and__3822__auto____14293 = coll;
    if(and__3822__auto____14293) {
      return coll.cljs$core$IChunkedNext$_chunked_next$arity$1
    }else {
      return and__3822__auto____14293
    }
  }()) {
    return coll.cljs$core$IChunkedNext$_chunked_next$arity$1(coll)
  }else {
    var x__2365__auto____14294 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____14295 = cljs.core._chunked_next[goog.typeOf(x__2365__auto____14294)];
      if(or__3824__auto____14295) {
        return or__3824__auto____14295
      }else {
        var or__3824__auto____14296 = cljs.core._chunked_next["_"];
        if(or__3824__auto____14296) {
          return or__3824__auto____14296
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
    var or__3824__auto____14298 = x === y;
    if(or__3824__auto____14298) {
      return or__3824__auto____14298
    }else {
      return cljs.core._equiv.call(null, x, y)
    }
  };
  var _EQ___3 = function() {
    var G__14299__delegate = function(x, y, more) {
      while(true) {
        if(cljs.core.truth_(_EQ_.call(null, x, y))) {
          if(cljs.core.next.call(null, more)) {
            var G__14300 = y;
            var G__14301 = cljs.core.first.call(null, more);
            var G__14302 = cljs.core.next.call(null, more);
            x = G__14300;
            y = G__14301;
            more = G__14302;
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
    var G__14299 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__14299__delegate.call(this, x, y, more)
    };
    G__14299.cljs$lang$maxFixedArity = 2;
    G__14299.cljs$lang$applyTo = function(arglist__14303) {
      var x = cljs.core.first(arglist__14303);
      var y = cljs.core.first(cljs.core.next(arglist__14303));
      var more = cljs.core.rest(cljs.core.next(arglist__14303));
      return G__14299__delegate(x, y, more)
    };
    G__14299.cljs$lang$arity$variadic = G__14299__delegate;
    return G__14299
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
  var G__14304 = null;
  var G__14304__2 = function(o, k) {
    return null
  };
  var G__14304__3 = function(o, k, not_found) {
    return not_found
  };
  G__14304 = function(o, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__14304__2.call(this, o, k);
      case 3:
        return G__14304__3.call(this, o, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__14304
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
  var G__14305 = null;
  var G__14305__2 = function(_, f) {
    return f.call(null)
  };
  var G__14305__3 = function(_, f, start) {
    return start
  };
  G__14305 = function(_, f, start) {
    switch(arguments.length) {
      case 2:
        return G__14305__2.call(this, _, f);
      case 3:
        return G__14305__3.call(this, _, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__14305
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
  var G__14306 = null;
  var G__14306__2 = function(_, n) {
    return null
  };
  var G__14306__3 = function(_, n, not_found) {
    return not_found
  };
  G__14306 = function(_, n, not_found) {
    switch(arguments.length) {
      case 2:
        return G__14306__2.call(this, _, n);
      case 3:
        return G__14306__3.call(this, _, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__14306
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
  var and__3822__auto____14307 = cljs.core.instance_QMARK_.call(null, Date, other);
  if(and__3822__auto____14307) {
    return o.toString() === other.toString()
  }else {
    return and__3822__auto____14307
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
    var cnt__14320 = cljs.core._count.call(null, cicoll);
    if(cnt__14320 === 0) {
      return f.call(null)
    }else {
      var val__14321 = cljs.core._nth.call(null, cicoll, 0);
      var n__14322 = 1;
      while(true) {
        if(n__14322 < cnt__14320) {
          var nval__14323 = f.call(null, val__14321, cljs.core._nth.call(null, cicoll, n__14322));
          if(cljs.core.reduced_QMARK_.call(null, nval__14323)) {
            return cljs.core.deref.call(null, nval__14323)
          }else {
            var G__14332 = nval__14323;
            var G__14333 = n__14322 + 1;
            val__14321 = G__14332;
            n__14322 = G__14333;
            continue
          }
        }else {
          return val__14321
        }
        break
      }
    }
  };
  var ci_reduce__3 = function(cicoll, f, val) {
    var cnt__14324 = cljs.core._count.call(null, cicoll);
    var val__14325 = val;
    var n__14326 = 0;
    while(true) {
      if(n__14326 < cnt__14324) {
        var nval__14327 = f.call(null, val__14325, cljs.core._nth.call(null, cicoll, n__14326));
        if(cljs.core.reduced_QMARK_.call(null, nval__14327)) {
          return cljs.core.deref.call(null, nval__14327)
        }else {
          var G__14334 = nval__14327;
          var G__14335 = n__14326 + 1;
          val__14325 = G__14334;
          n__14326 = G__14335;
          continue
        }
      }else {
        return val__14325
      }
      break
    }
  };
  var ci_reduce__4 = function(cicoll, f, val, idx) {
    var cnt__14328 = cljs.core._count.call(null, cicoll);
    var val__14329 = val;
    var n__14330 = idx;
    while(true) {
      if(n__14330 < cnt__14328) {
        var nval__14331 = f.call(null, val__14329, cljs.core._nth.call(null, cicoll, n__14330));
        if(cljs.core.reduced_QMARK_.call(null, nval__14331)) {
          return cljs.core.deref.call(null, nval__14331)
        }else {
          var G__14336 = nval__14331;
          var G__14337 = n__14330 + 1;
          val__14329 = G__14336;
          n__14330 = G__14337;
          continue
        }
      }else {
        return val__14329
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
    var cnt__14350 = arr.length;
    if(arr.length === 0) {
      return f.call(null)
    }else {
      var val__14351 = arr[0];
      var n__14352 = 1;
      while(true) {
        if(n__14352 < cnt__14350) {
          var nval__14353 = f.call(null, val__14351, arr[n__14352]);
          if(cljs.core.reduced_QMARK_.call(null, nval__14353)) {
            return cljs.core.deref.call(null, nval__14353)
          }else {
            var G__14362 = nval__14353;
            var G__14363 = n__14352 + 1;
            val__14351 = G__14362;
            n__14352 = G__14363;
            continue
          }
        }else {
          return val__14351
        }
        break
      }
    }
  };
  var array_reduce__3 = function(arr, f, val) {
    var cnt__14354 = arr.length;
    var val__14355 = val;
    var n__14356 = 0;
    while(true) {
      if(n__14356 < cnt__14354) {
        var nval__14357 = f.call(null, val__14355, arr[n__14356]);
        if(cljs.core.reduced_QMARK_.call(null, nval__14357)) {
          return cljs.core.deref.call(null, nval__14357)
        }else {
          var G__14364 = nval__14357;
          var G__14365 = n__14356 + 1;
          val__14355 = G__14364;
          n__14356 = G__14365;
          continue
        }
      }else {
        return val__14355
      }
      break
    }
  };
  var array_reduce__4 = function(arr, f, val, idx) {
    var cnt__14358 = arr.length;
    var val__14359 = val;
    var n__14360 = idx;
    while(true) {
      if(n__14360 < cnt__14358) {
        var nval__14361 = f.call(null, val__14359, arr[n__14360]);
        if(cljs.core.reduced_QMARK_.call(null, nval__14361)) {
          return cljs.core.deref.call(null, nval__14361)
        }else {
          var G__14366 = nval__14361;
          var G__14367 = n__14360 + 1;
          val__14359 = G__14366;
          n__14360 = G__14367;
          continue
        }
      }else {
        return val__14359
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
cljs.core.IndexedSeq.cljs$lang$ctorPrSeq = function(this__2311__auto__) {
  return cljs.core.list.call(null, "cljs.core/IndexedSeq")
};
cljs.core.IndexedSeq.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__14368 = this;
  return cljs.core.hash_coll.call(null, coll)
};
cljs.core.IndexedSeq.prototype.cljs$core$INext$_next$arity$1 = function(_) {
  var this__14369 = this;
  if(this__14369.i + 1 < this__14369.a.length) {
    return new cljs.core.IndexedSeq(this__14369.a, this__14369.i + 1)
  }else {
    return null
  }
};
cljs.core.IndexedSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__14370 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.IndexedSeq.prototype.cljs$core$IReversible$_rseq$arity$1 = function(coll) {
  var this__14371 = this;
  var c__14372 = coll.cljs$core$ICounted$_count$arity$1(coll);
  if(c__14372 > 0) {
    return new cljs.core.RSeq(coll, c__14372 - 1, null)
  }else {
    return cljs.core.List.EMPTY
  }
};
cljs.core.IndexedSeq.prototype.toString = function() {
  var this__14373 = this;
  var this__14374 = this;
  return cljs.core.pr_str.call(null, this__14374)
};
cljs.core.IndexedSeq.prototype.cljs$core$IReduce$_reduce$arity$2 = function(coll, f) {
  var this__14375 = this;
  if(cljs.core.counted_QMARK_.call(null, this__14375.a)) {
    return cljs.core.ci_reduce.call(null, this__14375.a, f, this__14375.a[this__14375.i], this__14375.i + 1)
  }else {
    return cljs.core.ci_reduce.call(null, coll, f, this__14375.a[this__14375.i], 0)
  }
};
cljs.core.IndexedSeq.prototype.cljs$core$IReduce$_reduce$arity$3 = function(coll, f, start) {
  var this__14376 = this;
  if(cljs.core.counted_QMARK_.call(null, this__14376.a)) {
    return cljs.core.ci_reduce.call(null, this__14376.a, f, start, this__14376.i)
  }else {
    return cljs.core.ci_reduce.call(null, coll, f, start, 0)
  }
};
cljs.core.IndexedSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(this$) {
  var this__14377 = this;
  return this$
};
cljs.core.IndexedSeq.prototype.cljs$core$ICounted$_count$arity$1 = function(_) {
  var this__14378 = this;
  return this__14378.a.length - this__14378.i
};
cljs.core.IndexedSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(_) {
  var this__14379 = this;
  return this__14379.a[this__14379.i]
};
cljs.core.IndexedSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(_) {
  var this__14380 = this;
  if(this__14380.i + 1 < this__14380.a.length) {
    return new cljs.core.IndexedSeq(this__14380.a, this__14380.i + 1)
  }else {
    return cljs.core.list.call(null)
  }
};
cljs.core.IndexedSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__14381 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.IndexedSeq.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, n) {
  var this__14382 = this;
  var i__14383 = n + this__14382.i;
  if(i__14383 < this__14382.a.length) {
    return this__14382.a[i__14383]
  }else {
    return null
  }
};
cljs.core.IndexedSeq.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, n, not_found) {
  var this__14384 = this;
  var i__14385 = n + this__14384.i;
  if(i__14385 < this__14384.a.length) {
    return this__14384.a[i__14385]
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
  var G__14386 = null;
  var G__14386__2 = function(array, f) {
    return cljs.core.ci_reduce.call(null, array, f)
  };
  var G__14386__3 = function(array, f, start) {
    return cljs.core.ci_reduce.call(null, array, f, start)
  };
  G__14386 = function(array, f, start) {
    switch(arguments.length) {
      case 2:
        return G__14386__2.call(this, array, f);
      case 3:
        return G__14386__3.call(this, array, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__14386
}();
cljs.core.ILookup["array"] = true;
cljs.core._lookup["array"] = function() {
  var G__14387 = null;
  var G__14387__2 = function(array, k) {
    return array[k]
  };
  var G__14387__3 = function(array, k, not_found) {
    return cljs.core._nth.call(null, array, k, not_found)
  };
  G__14387 = function(array, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__14387__2.call(this, array, k);
      case 3:
        return G__14387__3.call(this, array, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__14387
}();
cljs.core.IIndexed["array"] = true;
cljs.core._nth["array"] = function() {
  var G__14388 = null;
  var G__14388__2 = function(array, n) {
    if(n < array.length) {
      return array[n]
    }else {
      return null
    }
  };
  var G__14388__3 = function(array, n, not_found) {
    if(n < array.length) {
      return array[n]
    }else {
      return not_found
    }
  };
  G__14388 = function(array, n, not_found) {
    switch(arguments.length) {
      case 2:
        return G__14388__2.call(this, array, n);
      case 3:
        return G__14388__3.call(this, array, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__14388
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
cljs.core.RSeq.cljs$lang$ctorPrSeq = function(this__2311__auto__) {
  return cljs.core.list.call(null, "cljs.core/RSeq")
};
cljs.core.RSeq.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__14389 = this;
  return cljs.core.hash_coll.call(null, coll)
};
cljs.core.RSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__14390 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.RSeq.prototype.toString = function() {
  var this__14391 = this;
  var this__14392 = this;
  return cljs.core.pr_str.call(null, this__14392)
};
cljs.core.RSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__14393 = this;
  return coll
};
cljs.core.RSeq.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__14394 = this;
  return this__14394.i + 1
};
cljs.core.RSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__14395 = this;
  return cljs.core._nth.call(null, this__14395.ci, this__14395.i)
};
cljs.core.RSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__14396 = this;
  if(this__14396.i > 0) {
    return new cljs.core.RSeq(this__14396.ci, this__14396.i - 1, null)
  }else {
    return cljs.core.List.EMPTY
  }
};
cljs.core.RSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__14397 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.RSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, new_meta) {
  var this__14398 = this;
  return new cljs.core.RSeq(this__14398.ci, this__14398.i, new_meta)
};
cljs.core.RSeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__14399 = this;
  return this__14399.meta
};
cljs.core.RSeq;
cljs.core.seq = function seq(coll) {
  if(coll == null) {
    return null
  }else {
    if(function() {
      var G__14403__14404 = coll;
      if(G__14403__14404) {
        if(function() {
          var or__3824__auto____14405 = G__14403__14404.cljs$lang$protocol_mask$partition0$ & 32;
          if(or__3824__auto____14405) {
            return or__3824__auto____14405
          }else {
            return G__14403__14404.cljs$core$ASeq$
          }
        }()) {
          return true
        }else {
          if(!G__14403__14404.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.ASeq, G__14403__14404)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.ASeq, G__14403__14404)
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
      var G__14410__14411 = coll;
      if(G__14410__14411) {
        if(function() {
          var or__3824__auto____14412 = G__14410__14411.cljs$lang$protocol_mask$partition0$ & 64;
          if(or__3824__auto____14412) {
            return or__3824__auto____14412
          }else {
            return G__14410__14411.cljs$core$ISeq$
          }
        }()) {
          return true
        }else {
          if(!G__14410__14411.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__14410__14411)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__14410__14411)
      }
    }()) {
      return cljs.core._first.call(null, coll)
    }else {
      var s__14413 = cljs.core.seq.call(null, coll);
      if(s__14413 == null) {
        return null
      }else {
        return cljs.core._first.call(null, s__14413)
      }
    }
  }
};
cljs.core.rest = function rest(coll) {
  if(!(coll == null)) {
    if(function() {
      var G__14418__14419 = coll;
      if(G__14418__14419) {
        if(function() {
          var or__3824__auto____14420 = G__14418__14419.cljs$lang$protocol_mask$partition0$ & 64;
          if(or__3824__auto____14420) {
            return or__3824__auto____14420
          }else {
            return G__14418__14419.cljs$core$ISeq$
          }
        }()) {
          return true
        }else {
          if(!G__14418__14419.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__14418__14419)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__14418__14419)
      }
    }()) {
      return cljs.core._rest.call(null, coll)
    }else {
      var s__14421 = cljs.core.seq.call(null, coll);
      if(!(s__14421 == null)) {
        return cljs.core._rest.call(null, s__14421)
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
      var G__14425__14426 = coll;
      if(G__14425__14426) {
        if(function() {
          var or__3824__auto____14427 = G__14425__14426.cljs$lang$protocol_mask$partition0$ & 128;
          if(or__3824__auto____14427) {
            return or__3824__auto____14427
          }else {
            return G__14425__14426.cljs$core$INext$
          }
        }()) {
          return true
        }else {
          if(!G__14425__14426.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.INext, G__14425__14426)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.INext, G__14425__14426)
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
    var sn__14429 = cljs.core.next.call(null, s);
    if(!(sn__14429 == null)) {
      var G__14430 = sn__14429;
      s = G__14430;
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
    var G__14431__delegate = function(coll, x, xs) {
      while(true) {
        if(cljs.core.truth_(xs)) {
          var G__14432 = conj.call(null, coll, x);
          var G__14433 = cljs.core.first.call(null, xs);
          var G__14434 = cljs.core.next.call(null, xs);
          coll = G__14432;
          x = G__14433;
          xs = G__14434;
          continue
        }else {
          return conj.call(null, coll, x)
        }
        break
      }
    };
    var G__14431 = function(coll, x, var_args) {
      var xs = null;
      if(goog.isDef(var_args)) {
        xs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__14431__delegate.call(this, coll, x, xs)
    };
    G__14431.cljs$lang$maxFixedArity = 2;
    G__14431.cljs$lang$applyTo = function(arglist__14435) {
      var coll = cljs.core.first(arglist__14435);
      var x = cljs.core.first(cljs.core.next(arglist__14435));
      var xs = cljs.core.rest(cljs.core.next(arglist__14435));
      return G__14431__delegate(coll, x, xs)
    };
    G__14431.cljs$lang$arity$variadic = G__14431__delegate;
    return G__14431
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
  var s__14438 = cljs.core.seq.call(null, coll);
  var acc__14439 = 0;
  while(true) {
    if(cljs.core.counted_QMARK_.call(null, s__14438)) {
      return acc__14439 + cljs.core._count.call(null, s__14438)
    }else {
      var G__14440 = cljs.core.next.call(null, s__14438);
      var G__14441 = acc__14439 + 1;
      s__14438 = G__14440;
      acc__14439 = G__14441;
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
        var G__14448__14449 = coll;
        if(G__14448__14449) {
          if(function() {
            var or__3824__auto____14450 = G__14448__14449.cljs$lang$protocol_mask$partition0$ & 16;
            if(or__3824__auto____14450) {
              return or__3824__auto____14450
            }else {
              return G__14448__14449.cljs$core$IIndexed$
            }
          }()) {
            return true
          }else {
            if(!G__14448__14449.cljs$lang$protocol_mask$partition0$) {
              return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__14448__14449)
            }else {
              return false
            }
          }
        }else {
          return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__14448__14449)
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
        var G__14451__14452 = coll;
        if(G__14451__14452) {
          if(function() {
            var or__3824__auto____14453 = G__14451__14452.cljs$lang$protocol_mask$partition0$ & 16;
            if(or__3824__auto____14453) {
              return or__3824__auto____14453
            }else {
              return G__14451__14452.cljs$core$IIndexed$
            }
          }()) {
            return true
          }else {
            if(!G__14451__14452.cljs$lang$protocol_mask$partition0$) {
              return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__14451__14452)
            }else {
              return false
            }
          }
        }else {
          return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__14451__14452)
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
    var G__14456__delegate = function(coll, k, v, kvs) {
      while(true) {
        var ret__14455 = assoc.call(null, coll, k, v);
        if(cljs.core.truth_(kvs)) {
          var G__14457 = ret__14455;
          var G__14458 = cljs.core.first.call(null, kvs);
          var G__14459 = cljs.core.second.call(null, kvs);
          var G__14460 = cljs.core.nnext.call(null, kvs);
          coll = G__14457;
          k = G__14458;
          v = G__14459;
          kvs = G__14460;
          continue
        }else {
          return ret__14455
        }
        break
      }
    };
    var G__14456 = function(coll, k, v, var_args) {
      var kvs = null;
      if(goog.isDef(var_args)) {
        kvs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__14456__delegate.call(this, coll, k, v, kvs)
    };
    G__14456.cljs$lang$maxFixedArity = 3;
    G__14456.cljs$lang$applyTo = function(arglist__14461) {
      var coll = cljs.core.first(arglist__14461);
      var k = cljs.core.first(cljs.core.next(arglist__14461));
      var v = cljs.core.first(cljs.core.next(cljs.core.next(arglist__14461)));
      var kvs = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__14461)));
      return G__14456__delegate(coll, k, v, kvs)
    };
    G__14456.cljs$lang$arity$variadic = G__14456__delegate;
    return G__14456
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
    var G__14464__delegate = function(coll, k, ks) {
      while(true) {
        var ret__14463 = dissoc.call(null, coll, k);
        if(cljs.core.truth_(ks)) {
          var G__14465 = ret__14463;
          var G__14466 = cljs.core.first.call(null, ks);
          var G__14467 = cljs.core.next.call(null, ks);
          coll = G__14465;
          k = G__14466;
          ks = G__14467;
          continue
        }else {
          return ret__14463
        }
        break
      }
    };
    var G__14464 = function(coll, k, var_args) {
      var ks = null;
      if(goog.isDef(var_args)) {
        ks = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__14464__delegate.call(this, coll, k, ks)
    };
    G__14464.cljs$lang$maxFixedArity = 2;
    G__14464.cljs$lang$applyTo = function(arglist__14468) {
      var coll = cljs.core.first(arglist__14468);
      var k = cljs.core.first(cljs.core.next(arglist__14468));
      var ks = cljs.core.rest(cljs.core.next(arglist__14468));
      return G__14464__delegate(coll, k, ks)
    };
    G__14464.cljs$lang$arity$variadic = G__14464__delegate;
    return G__14464
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
    var G__14472__14473 = o;
    if(G__14472__14473) {
      if(function() {
        var or__3824__auto____14474 = G__14472__14473.cljs$lang$protocol_mask$partition0$ & 131072;
        if(or__3824__auto____14474) {
          return or__3824__auto____14474
        }else {
          return G__14472__14473.cljs$core$IMeta$
        }
      }()) {
        return true
      }else {
        if(!G__14472__14473.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.IMeta, G__14472__14473)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.IMeta, G__14472__14473)
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
    var G__14477__delegate = function(coll, k, ks) {
      while(true) {
        var ret__14476 = disj.call(null, coll, k);
        if(cljs.core.truth_(ks)) {
          var G__14478 = ret__14476;
          var G__14479 = cljs.core.first.call(null, ks);
          var G__14480 = cljs.core.next.call(null, ks);
          coll = G__14478;
          k = G__14479;
          ks = G__14480;
          continue
        }else {
          return ret__14476
        }
        break
      }
    };
    var G__14477 = function(coll, k, var_args) {
      var ks = null;
      if(goog.isDef(var_args)) {
        ks = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__14477__delegate.call(this, coll, k, ks)
    };
    G__14477.cljs$lang$maxFixedArity = 2;
    G__14477.cljs$lang$applyTo = function(arglist__14481) {
      var coll = cljs.core.first(arglist__14481);
      var k = cljs.core.first(cljs.core.next(arglist__14481));
      var ks = cljs.core.rest(cljs.core.next(arglist__14481));
      return G__14477__delegate(coll, k, ks)
    };
    G__14477.cljs$lang$arity$variadic = G__14477__delegate;
    return G__14477
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
  var h__14483 = goog.string.hashCode(k);
  cljs.core.string_hash_cache[k] = h__14483;
  cljs.core.string_hash_cache_count = cljs.core.string_hash_cache_count + 1;
  return h__14483
};
cljs.core.check_string_hash_cache = function check_string_hash_cache(k) {
  if(cljs.core.string_hash_cache_count > 255) {
    cljs.core.string_hash_cache = {};
    cljs.core.string_hash_cache_count = 0
  }else {
  }
  var h__14485 = cljs.core.string_hash_cache[k];
  if(!(h__14485 == null)) {
    return h__14485
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
      var and__3822__auto____14487 = goog.isString(o);
      if(and__3822__auto____14487) {
        return check_cache
      }else {
        return and__3822__auto____14487
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
    var G__14491__14492 = x;
    if(G__14491__14492) {
      if(function() {
        var or__3824__auto____14493 = G__14491__14492.cljs$lang$protocol_mask$partition0$ & 8;
        if(or__3824__auto____14493) {
          return or__3824__auto____14493
        }else {
          return G__14491__14492.cljs$core$ICollection$
        }
      }()) {
        return true
      }else {
        if(!G__14491__14492.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.ICollection, G__14491__14492)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.ICollection, G__14491__14492)
    }
  }
};
cljs.core.set_QMARK_ = function set_QMARK_(x) {
  if(x == null) {
    return false
  }else {
    var G__14497__14498 = x;
    if(G__14497__14498) {
      if(function() {
        var or__3824__auto____14499 = G__14497__14498.cljs$lang$protocol_mask$partition0$ & 4096;
        if(or__3824__auto____14499) {
          return or__3824__auto____14499
        }else {
          return G__14497__14498.cljs$core$ISet$
        }
      }()) {
        return true
      }else {
        if(!G__14497__14498.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.ISet, G__14497__14498)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.ISet, G__14497__14498)
    }
  }
};
cljs.core.associative_QMARK_ = function associative_QMARK_(x) {
  var G__14503__14504 = x;
  if(G__14503__14504) {
    if(function() {
      var or__3824__auto____14505 = G__14503__14504.cljs$lang$protocol_mask$partition0$ & 512;
      if(or__3824__auto____14505) {
        return or__3824__auto____14505
      }else {
        return G__14503__14504.cljs$core$IAssociative$
      }
    }()) {
      return true
    }else {
      if(!G__14503__14504.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IAssociative, G__14503__14504)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IAssociative, G__14503__14504)
  }
};
cljs.core.sequential_QMARK_ = function sequential_QMARK_(x) {
  var G__14509__14510 = x;
  if(G__14509__14510) {
    if(function() {
      var or__3824__auto____14511 = G__14509__14510.cljs$lang$protocol_mask$partition0$ & 16777216;
      if(or__3824__auto____14511) {
        return or__3824__auto____14511
      }else {
        return G__14509__14510.cljs$core$ISequential$
      }
    }()) {
      return true
    }else {
      if(!G__14509__14510.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.ISequential, G__14509__14510)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.ISequential, G__14509__14510)
  }
};
cljs.core.counted_QMARK_ = function counted_QMARK_(x) {
  var G__14515__14516 = x;
  if(G__14515__14516) {
    if(function() {
      var or__3824__auto____14517 = G__14515__14516.cljs$lang$protocol_mask$partition0$ & 2;
      if(or__3824__auto____14517) {
        return or__3824__auto____14517
      }else {
        return G__14515__14516.cljs$core$ICounted$
      }
    }()) {
      return true
    }else {
      if(!G__14515__14516.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.ICounted, G__14515__14516)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.ICounted, G__14515__14516)
  }
};
cljs.core.indexed_QMARK_ = function indexed_QMARK_(x) {
  var G__14521__14522 = x;
  if(G__14521__14522) {
    if(function() {
      var or__3824__auto____14523 = G__14521__14522.cljs$lang$protocol_mask$partition0$ & 16;
      if(or__3824__auto____14523) {
        return or__3824__auto____14523
      }else {
        return G__14521__14522.cljs$core$IIndexed$
      }
    }()) {
      return true
    }else {
      if(!G__14521__14522.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__14521__14522)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__14521__14522)
  }
};
cljs.core.reduceable_QMARK_ = function reduceable_QMARK_(x) {
  var G__14527__14528 = x;
  if(G__14527__14528) {
    if(function() {
      var or__3824__auto____14529 = G__14527__14528.cljs$lang$protocol_mask$partition0$ & 524288;
      if(or__3824__auto____14529) {
        return or__3824__auto____14529
      }else {
        return G__14527__14528.cljs$core$IReduce$
      }
    }()) {
      return true
    }else {
      if(!G__14527__14528.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__14527__14528)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__14527__14528)
  }
};
cljs.core.map_QMARK_ = function map_QMARK_(x) {
  if(x == null) {
    return false
  }else {
    var G__14533__14534 = x;
    if(G__14533__14534) {
      if(function() {
        var or__3824__auto____14535 = G__14533__14534.cljs$lang$protocol_mask$partition0$ & 1024;
        if(or__3824__auto____14535) {
          return or__3824__auto____14535
        }else {
          return G__14533__14534.cljs$core$IMap$
        }
      }()) {
        return true
      }else {
        if(!G__14533__14534.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.IMap, G__14533__14534)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.IMap, G__14533__14534)
    }
  }
};
cljs.core.vector_QMARK_ = function vector_QMARK_(x) {
  var G__14539__14540 = x;
  if(G__14539__14540) {
    if(function() {
      var or__3824__auto____14541 = G__14539__14540.cljs$lang$protocol_mask$partition0$ & 16384;
      if(or__3824__auto____14541) {
        return or__3824__auto____14541
      }else {
        return G__14539__14540.cljs$core$IVector$
      }
    }()) {
      return true
    }else {
      if(!G__14539__14540.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IVector, G__14539__14540)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IVector, G__14539__14540)
  }
};
cljs.core.chunked_seq_QMARK_ = function chunked_seq_QMARK_(x) {
  var G__14545__14546 = x;
  if(G__14545__14546) {
    if(cljs.core.truth_(function() {
      var or__3824__auto____14547 = null;
      if(cljs.core.truth_(or__3824__auto____14547)) {
        return or__3824__auto____14547
      }else {
        return G__14545__14546.cljs$core$IChunkedSeq$
      }
    }())) {
      return true
    }else {
      if(!G__14545__14546.cljs$lang$protocol_mask$partition$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IChunkedSeq, G__14545__14546)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IChunkedSeq, G__14545__14546)
  }
};
cljs.core.js_obj = function() {
  var js_obj = null;
  var js_obj__0 = function() {
    return{}
  };
  var js_obj__1 = function() {
    var G__14548__delegate = function(keyvals) {
      return cljs.core.apply.call(null, goog.object.create, keyvals)
    };
    var G__14548 = function(var_args) {
      var keyvals = null;
      if(goog.isDef(var_args)) {
        keyvals = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
      }
      return G__14548__delegate.call(this, keyvals)
    };
    G__14548.cljs$lang$maxFixedArity = 0;
    G__14548.cljs$lang$applyTo = function(arglist__14549) {
      var keyvals = cljs.core.seq(arglist__14549);
      return G__14548__delegate(keyvals)
    };
    G__14548.cljs$lang$arity$variadic = G__14548__delegate;
    return G__14548
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
  var keys__14551 = [];
  goog.object.forEach(obj, function(val, key, obj) {
    return keys__14551.push(key)
  });
  return keys__14551
};
cljs.core.js_delete = function js_delete(obj, key) {
  return delete obj[key]
};
cljs.core.array_copy = function array_copy(from, i, to, j, len) {
  var i__14555 = i;
  var j__14556 = j;
  var len__14557 = len;
  while(true) {
    if(len__14557 === 0) {
      return to
    }else {
      to[j__14556] = from[i__14555];
      var G__14558 = i__14555 + 1;
      var G__14559 = j__14556 + 1;
      var G__14560 = len__14557 - 1;
      i__14555 = G__14558;
      j__14556 = G__14559;
      len__14557 = G__14560;
      continue
    }
    break
  }
};
cljs.core.array_copy_downward = function array_copy_downward(from, i, to, j, len) {
  var i__14564 = i + (len - 1);
  var j__14565 = j + (len - 1);
  var len__14566 = len;
  while(true) {
    if(len__14566 === 0) {
      return to
    }else {
      to[j__14565] = from[i__14564];
      var G__14567 = i__14564 - 1;
      var G__14568 = j__14565 - 1;
      var G__14569 = len__14566 - 1;
      i__14564 = G__14567;
      j__14565 = G__14568;
      len__14566 = G__14569;
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
    var G__14573__14574 = s;
    if(G__14573__14574) {
      if(function() {
        var or__3824__auto____14575 = G__14573__14574.cljs$lang$protocol_mask$partition0$ & 64;
        if(or__3824__auto____14575) {
          return or__3824__auto____14575
        }else {
          return G__14573__14574.cljs$core$ISeq$
        }
      }()) {
        return true
      }else {
        if(!G__14573__14574.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__14573__14574)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__14573__14574)
    }
  }
};
cljs.core.seqable_QMARK_ = function seqable_QMARK_(s) {
  var G__14579__14580 = s;
  if(G__14579__14580) {
    if(function() {
      var or__3824__auto____14581 = G__14579__14580.cljs$lang$protocol_mask$partition0$ & 8388608;
      if(or__3824__auto____14581) {
        return or__3824__auto____14581
      }else {
        return G__14579__14580.cljs$core$ISeqable$
      }
    }()) {
      return true
    }else {
      if(!G__14579__14580.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.ISeqable, G__14579__14580)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.ISeqable, G__14579__14580)
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
  var and__3822__auto____14584 = goog.isString(x);
  if(and__3822__auto____14584) {
    return!function() {
      var or__3824__auto____14585 = x.charAt(0) === "\ufdd0";
      if(or__3824__auto____14585) {
        return or__3824__auto____14585
      }else {
        return x.charAt(0) === "\ufdd1"
      }
    }()
  }else {
    return and__3822__auto____14584
  }
};
cljs.core.keyword_QMARK_ = function keyword_QMARK_(x) {
  var and__3822__auto____14587 = goog.isString(x);
  if(and__3822__auto____14587) {
    return x.charAt(0) === "\ufdd0"
  }else {
    return and__3822__auto____14587
  }
};
cljs.core.symbol_QMARK_ = function symbol_QMARK_(x) {
  var and__3822__auto____14589 = goog.isString(x);
  if(and__3822__auto____14589) {
    return x.charAt(0) === "\ufdd1"
  }else {
    return and__3822__auto____14589
  }
};
cljs.core.number_QMARK_ = function number_QMARK_(n) {
  return goog.isNumber(n)
};
cljs.core.fn_QMARK_ = function fn_QMARK_(f) {
  return goog.isFunction(f)
};
cljs.core.ifn_QMARK_ = function ifn_QMARK_(f) {
  var or__3824__auto____14594 = cljs.core.fn_QMARK_.call(null, f);
  if(or__3824__auto____14594) {
    return or__3824__auto____14594
  }else {
    var G__14595__14596 = f;
    if(G__14595__14596) {
      if(function() {
        var or__3824__auto____14597 = G__14595__14596.cljs$lang$protocol_mask$partition0$ & 1;
        if(or__3824__auto____14597) {
          return or__3824__auto____14597
        }else {
          return G__14595__14596.cljs$core$IFn$
        }
      }()) {
        return true
      }else {
        if(!G__14595__14596.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.IFn, G__14595__14596)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.IFn, G__14595__14596)
    }
  }
};
cljs.core.integer_QMARK_ = function integer_QMARK_(n) {
  var and__3822__auto____14599 = cljs.core.number_QMARK_.call(null, n);
  if(and__3822__auto____14599) {
    return n == n.toFixed()
  }else {
    return and__3822__auto____14599
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
    var and__3822__auto____14602 = coll;
    if(cljs.core.truth_(and__3822__auto____14602)) {
      var and__3822__auto____14603 = cljs.core.associative_QMARK_.call(null, coll);
      if(and__3822__auto____14603) {
        return cljs.core.contains_QMARK_.call(null, coll, k)
      }else {
        return and__3822__auto____14603
      }
    }else {
      return and__3822__auto____14602
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
    var G__14612__delegate = function(x, y, more) {
      if(!cljs.core._EQ_.call(null, x, y)) {
        var s__14608 = cljs.core.PersistentHashSet.fromArray([y, x]);
        var xs__14609 = more;
        while(true) {
          var x__14610 = cljs.core.first.call(null, xs__14609);
          var etc__14611 = cljs.core.next.call(null, xs__14609);
          if(cljs.core.truth_(xs__14609)) {
            if(cljs.core.contains_QMARK_.call(null, s__14608, x__14610)) {
              return false
            }else {
              var G__14613 = cljs.core.conj.call(null, s__14608, x__14610);
              var G__14614 = etc__14611;
              s__14608 = G__14613;
              xs__14609 = G__14614;
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
    var G__14612 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__14612__delegate.call(this, x, y, more)
    };
    G__14612.cljs$lang$maxFixedArity = 2;
    G__14612.cljs$lang$applyTo = function(arglist__14615) {
      var x = cljs.core.first(arglist__14615);
      var y = cljs.core.first(cljs.core.next(arglist__14615));
      var more = cljs.core.rest(cljs.core.next(arglist__14615));
      return G__14612__delegate(x, y, more)
    };
    G__14612.cljs$lang$arity$variadic = G__14612__delegate;
    return G__14612
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
            var G__14619__14620 = x;
            if(G__14619__14620) {
              if(cljs.core.truth_(function() {
                var or__3824__auto____14621 = null;
                if(cljs.core.truth_(or__3824__auto____14621)) {
                  return or__3824__auto____14621
                }else {
                  return G__14619__14620.cljs$core$IComparable$
                }
              }())) {
                return true
              }else {
                if(!G__14619__14620.cljs$lang$protocol_mask$partition$) {
                  return cljs.core.type_satisfies_.call(null, cljs.core.IComparable, G__14619__14620)
                }else {
                  return false
                }
              }
            }else {
              return cljs.core.type_satisfies_.call(null, cljs.core.IComparable, G__14619__14620)
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
    var xl__14626 = cljs.core.count.call(null, xs);
    var yl__14627 = cljs.core.count.call(null, ys);
    if(xl__14626 < yl__14627) {
      return-1
    }else {
      if(xl__14626 > yl__14627) {
        return 1
      }else {
        if("\ufdd0'else") {
          return compare_indexed.call(null, xs, ys, xl__14626, 0)
        }else {
          return null
        }
      }
    }
  };
  var compare_indexed__4 = function(xs, ys, len, n) {
    while(true) {
      var d__14628 = cljs.core.compare.call(null, cljs.core.nth.call(null, xs, n), cljs.core.nth.call(null, ys, n));
      if(function() {
        var and__3822__auto____14629 = d__14628 === 0;
        if(and__3822__auto____14629) {
          return n + 1 < len
        }else {
          return and__3822__auto____14629
        }
      }()) {
        var G__14630 = xs;
        var G__14631 = ys;
        var G__14632 = len;
        var G__14633 = n + 1;
        xs = G__14630;
        ys = G__14631;
        len = G__14632;
        n = G__14633;
        continue
      }else {
        return d__14628
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
      var r__14635 = f.call(null, x, y);
      if(cljs.core.number_QMARK_.call(null, r__14635)) {
        return r__14635
      }else {
        if(cljs.core.truth_(r__14635)) {
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
      var a__14637 = cljs.core.to_array.call(null, coll);
      goog.array.stableSort(a__14637, cljs.core.fn__GT_comparator.call(null, comp));
      return cljs.core.seq.call(null, a__14637)
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
    var temp__3971__auto____14643 = cljs.core.seq.call(null, coll);
    if(temp__3971__auto____14643) {
      var s__14644 = temp__3971__auto____14643;
      return cljs.core.reduce.call(null, f, cljs.core.first.call(null, s__14644), cljs.core.next.call(null, s__14644))
    }else {
      return f.call(null)
    }
  };
  var seq_reduce__3 = function(f, val, coll) {
    var val__14645 = val;
    var coll__14646 = cljs.core.seq.call(null, coll);
    while(true) {
      if(coll__14646) {
        var nval__14647 = f.call(null, val__14645, cljs.core.first.call(null, coll__14646));
        if(cljs.core.reduced_QMARK_.call(null, nval__14647)) {
          return cljs.core.deref.call(null, nval__14647)
        }else {
          var G__14648 = nval__14647;
          var G__14649 = cljs.core.next.call(null, coll__14646);
          val__14645 = G__14648;
          coll__14646 = G__14649;
          continue
        }
      }else {
        return val__14645
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
  var a__14651 = cljs.core.to_array.call(null, coll);
  goog.array.shuffle(a__14651);
  return cljs.core.vec.call(null, a__14651)
};
cljs.core.reduce = function() {
  var reduce = null;
  var reduce__2 = function(f, coll) {
    if(function() {
      var G__14658__14659 = coll;
      if(G__14658__14659) {
        if(function() {
          var or__3824__auto____14660 = G__14658__14659.cljs$lang$protocol_mask$partition0$ & 524288;
          if(or__3824__auto____14660) {
            return or__3824__auto____14660
          }else {
            return G__14658__14659.cljs$core$IReduce$
          }
        }()) {
          return true
        }else {
          if(!G__14658__14659.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__14658__14659)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__14658__14659)
      }
    }()) {
      return cljs.core._reduce.call(null, coll, f)
    }else {
      return cljs.core.seq_reduce.call(null, f, coll)
    }
  };
  var reduce__3 = function(f, val, coll) {
    if(function() {
      var G__14661__14662 = coll;
      if(G__14661__14662) {
        if(function() {
          var or__3824__auto____14663 = G__14661__14662.cljs$lang$protocol_mask$partition0$ & 524288;
          if(or__3824__auto____14663) {
            return or__3824__auto____14663
          }else {
            return G__14661__14662.cljs$core$IReduce$
          }
        }()) {
          return true
        }else {
          if(!G__14661__14662.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__14661__14662)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__14661__14662)
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
cljs.core.Reduced.cljs$lang$ctorPrSeq = function(this__2311__auto__) {
  return cljs.core.list.call(null, "cljs.core/Reduced")
};
cljs.core.Reduced.prototype.cljs$core$IDeref$_deref$arity$1 = function(o) {
  var this__14664 = this;
  return this__14664.val
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
    var G__14665__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, _PLUS_, x + y, more)
    };
    var G__14665 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__14665__delegate.call(this, x, y, more)
    };
    G__14665.cljs$lang$maxFixedArity = 2;
    G__14665.cljs$lang$applyTo = function(arglist__14666) {
      var x = cljs.core.first(arglist__14666);
      var y = cljs.core.first(cljs.core.next(arglist__14666));
      var more = cljs.core.rest(cljs.core.next(arglist__14666));
      return G__14665__delegate(x, y, more)
    };
    G__14665.cljs$lang$arity$variadic = G__14665__delegate;
    return G__14665
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
    var G__14667__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, _, x - y, more)
    };
    var G__14667 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__14667__delegate.call(this, x, y, more)
    };
    G__14667.cljs$lang$maxFixedArity = 2;
    G__14667.cljs$lang$applyTo = function(arglist__14668) {
      var x = cljs.core.first(arglist__14668);
      var y = cljs.core.first(cljs.core.next(arglist__14668));
      var more = cljs.core.rest(cljs.core.next(arglist__14668));
      return G__14667__delegate(x, y, more)
    };
    G__14667.cljs$lang$arity$variadic = G__14667__delegate;
    return G__14667
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
    var G__14669__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, _STAR_, x * y, more)
    };
    var G__14669 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__14669__delegate.call(this, x, y, more)
    };
    G__14669.cljs$lang$maxFixedArity = 2;
    G__14669.cljs$lang$applyTo = function(arglist__14670) {
      var x = cljs.core.first(arglist__14670);
      var y = cljs.core.first(cljs.core.next(arglist__14670));
      var more = cljs.core.rest(cljs.core.next(arglist__14670));
      return G__14669__delegate(x, y, more)
    };
    G__14669.cljs$lang$arity$variadic = G__14669__delegate;
    return G__14669
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
    var G__14671__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, _SLASH_, _SLASH_.call(null, x, y), more)
    };
    var G__14671 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__14671__delegate.call(this, x, y, more)
    };
    G__14671.cljs$lang$maxFixedArity = 2;
    G__14671.cljs$lang$applyTo = function(arglist__14672) {
      var x = cljs.core.first(arglist__14672);
      var y = cljs.core.first(cljs.core.next(arglist__14672));
      var more = cljs.core.rest(cljs.core.next(arglist__14672));
      return G__14671__delegate(x, y, more)
    };
    G__14671.cljs$lang$arity$variadic = G__14671__delegate;
    return G__14671
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
    var G__14673__delegate = function(x, y, more) {
      while(true) {
        if(x < y) {
          if(cljs.core.next.call(null, more)) {
            var G__14674 = y;
            var G__14675 = cljs.core.first.call(null, more);
            var G__14676 = cljs.core.next.call(null, more);
            x = G__14674;
            y = G__14675;
            more = G__14676;
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
    var G__14673 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__14673__delegate.call(this, x, y, more)
    };
    G__14673.cljs$lang$maxFixedArity = 2;
    G__14673.cljs$lang$applyTo = function(arglist__14677) {
      var x = cljs.core.first(arglist__14677);
      var y = cljs.core.first(cljs.core.next(arglist__14677));
      var more = cljs.core.rest(cljs.core.next(arglist__14677));
      return G__14673__delegate(x, y, more)
    };
    G__14673.cljs$lang$arity$variadic = G__14673__delegate;
    return G__14673
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
    var G__14678__delegate = function(x, y, more) {
      while(true) {
        if(x <= y) {
          if(cljs.core.next.call(null, more)) {
            var G__14679 = y;
            var G__14680 = cljs.core.first.call(null, more);
            var G__14681 = cljs.core.next.call(null, more);
            x = G__14679;
            y = G__14680;
            more = G__14681;
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
    var G__14678 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__14678__delegate.call(this, x, y, more)
    };
    G__14678.cljs$lang$maxFixedArity = 2;
    G__14678.cljs$lang$applyTo = function(arglist__14682) {
      var x = cljs.core.first(arglist__14682);
      var y = cljs.core.first(cljs.core.next(arglist__14682));
      var more = cljs.core.rest(cljs.core.next(arglist__14682));
      return G__14678__delegate(x, y, more)
    };
    G__14678.cljs$lang$arity$variadic = G__14678__delegate;
    return G__14678
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
    var G__14683__delegate = function(x, y, more) {
      while(true) {
        if(x > y) {
          if(cljs.core.next.call(null, more)) {
            var G__14684 = y;
            var G__14685 = cljs.core.first.call(null, more);
            var G__14686 = cljs.core.next.call(null, more);
            x = G__14684;
            y = G__14685;
            more = G__14686;
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
    var G__14683 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__14683__delegate.call(this, x, y, more)
    };
    G__14683.cljs$lang$maxFixedArity = 2;
    G__14683.cljs$lang$applyTo = function(arglist__14687) {
      var x = cljs.core.first(arglist__14687);
      var y = cljs.core.first(cljs.core.next(arglist__14687));
      var more = cljs.core.rest(cljs.core.next(arglist__14687));
      return G__14683__delegate(x, y, more)
    };
    G__14683.cljs$lang$arity$variadic = G__14683__delegate;
    return G__14683
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
    var G__14688__delegate = function(x, y, more) {
      while(true) {
        if(x >= y) {
          if(cljs.core.next.call(null, more)) {
            var G__14689 = y;
            var G__14690 = cljs.core.first.call(null, more);
            var G__14691 = cljs.core.next.call(null, more);
            x = G__14689;
            y = G__14690;
            more = G__14691;
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
    var G__14688 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__14688__delegate.call(this, x, y, more)
    };
    G__14688.cljs$lang$maxFixedArity = 2;
    G__14688.cljs$lang$applyTo = function(arglist__14692) {
      var x = cljs.core.first(arglist__14692);
      var y = cljs.core.first(cljs.core.next(arglist__14692));
      var more = cljs.core.rest(cljs.core.next(arglist__14692));
      return G__14688__delegate(x, y, more)
    };
    G__14688.cljs$lang$arity$variadic = G__14688__delegate;
    return G__14688
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
    var G__14693__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, max, x > y ? x : y, more)
    };
    var G__14693 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__14693__delegate.call(this, x, y, more)
    };
    G__14693.cljs$lang$maxFixedArity = 2;
    G__14693.cljs$lang$applyTo = function(arglist__14694) {
      var x = cljs.core.first(arglist__14694);
      var y = cljs.core.first(cljs.core.next(arglist__14694));
      var more = cljs.core.rest(cljs.core.next(arglist__14694));
      return G__14693__delegate(x, y, more)
    };
    G__14693.cljs$lang$arity$variadic = G__14693__delegate;
    return G__14693
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
    var G__14695__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, min, x < y ? x : y, more)
    };
    var G__14695 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__14695__delegate.call(this, x, y, more)
    };
    G__14695.cljs$lang$maxFixedArity = 2;
    G__14695.cljs$lang$applyTo = function(arglist__14696) {
      var x = cljs.core.first(arglist__14696);
      var y = cljs.core.first(cljs.core.next(arglist__14696));
      var more = cljs.core.rest(cljs.core.next(arglist__14696));
      return G__14695__delegate(x, y, more)
    };
    G__14695.cljs$lang$arity$variadic = G__14695__delegate;
    return G__14695
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
  var rem__14698 = n % d;
  return cljs.core.fix.call(null, (n - rem__14698) / d)
};
cljs.core.rem = function rem(n, d) {
  var q__14700 = cljs.core.quot.call(null, n, d);
  return n - d * q__14700
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
  var v__14703 = v - (v >> 1 & 1431655765);
  var v__14704 = (v__14703 & 858993459) + (v__14703 >> 2 & 858993459);
  return(v__14704 + (v__14704 >> 4) & 252645135) * 16843009 >> 24
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
    var G__14705__delegate = function(x, y, more) {
      while(true) {
        if(cljs.core.truth_(_EQ__EQ_.call(null, x, y))) {
          if(cljs.core.next.call(null, more)) {
            var G__14706 = y;
            var G__14707 = cljs.core.first.call(null, more);
            var G__14708 = cljs.core.next.call(null, more);
            x = G__14706;
            y = G__14707;
            more = G__14708;
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
    var G__14705 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__14705__delegate.call(this, x, y, more)
    };
    G__14705.cljs$lang$maxFixedArity = 2;
    G__14705.cljs$lang$applyTo = function(arglist__14709) {
      var x = cljs.core.first(arglist__14709);
      var y = cljs.core.first(cljs.core.next(arglist__14709));
      var more = cljs.core.rest(cljs.core.next(arglist__14709));
      return G__14705__delegate(x, y, more)
    };
    G__14705.cljs$lang$arity$variadic = G__14705__delegate;
    return G__14705
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
  var n__14713 = n;
  var xs__14714 = cljs.core.seq.call(null, coll);
  while(true) {
    if(cljs.core.truth_(function() {
      var and__3822__auto____14715 = xs__14714;
      if(and__3822__auto____14715) {
        return n__14713 > 0
      }else {
        return and__3822__auto____14715
      }
    }())) {
      var G__14716 = n__14713 - 1;
      var G__14717 = cljs.core.next.call(null, xs__14714);
      n__14713 = G__14716;
      xs__14714 = G__14717;
      continue
    }else {
      return xs__14714
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
    var G__14718__delegate = function(x, ys) {
      return function(sb, more) {
        while(true) {
          if(cljs.core.truth_(more)) {
            var G__14719 = sb.append(str_STAR_.call(null, cljs.core.first.call(null, more)));
            var G__14720 = cljs.core.next.call(null, more);
            sb = G__14719;
            more = G__14720;
            continue
          }else {
            return str_STAR_.call(null, sb)
          }
          break
        }
      }.call(null, new goog.string.StringBuffer(str_STAR_.call(null, x)), ys)
    };
    var G__14718 = function(x, var_args) {
      var ys = null;
      if(goog.isDef(var_args)) {
        ys = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__14718__delegate.call(this, x, ys)
    };
    G__14718.cljs$lang$maxFixedArity = 1;
    G__14718.cljs$lang$applyTo = function(arglist__14721) {
      var x = cljs.core.first(arglist__14721);
      var ys = cljs.core.rest(arglist__14721);
      return G__14718__delegate(x, ys)
    };
    G__14718.cljs$lang$arity$variadic = G__14718__delegate;
    return G__14718
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
    var G__14722__delegate = function(x, ys) {
      return function(sb, more) {
        while(true) {
          if(cljs.core.truth_(more)) {
            var G__14723 = sb.append(str.call(null, cljs.core.first.call(null, more)));
            var G__14724 = cljs.core.next.call(null, more);
            sb = G__14723;
            more = G__14724;
            continue
          }else {
            return cljs.core.str_STAR_.call(null, sb)
          }
          break
        }
      }.call(null, new goog.string.StringBuffer(str.call(null, x)), ys)
    };
    var G__14722 = function(x, var_args) {
      var ys = null;
      if(goog.isDef(var_args)) {
        ys = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__14722__delegate.call(this, x, ys)
    };
    G__14722.cljs$lang$maxFixedArity = 1;
    G__14722.cljs$lang$applyTo = function(arglist__14725) {
      var x = cljs.core.first(arglist__14725);
      var ys = cljs.core.rest(arglist__14725);
      return G__14722__delegate(x, ys)
    };
    G__14722.cljs$lang$arity$variadic = G__14722__delegate;
    return G__14722
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
  format.cljs$lang$applyTo = function(arglist__14726) {
    var fmt = cljs.core.first(arglist__14726);
    var args = cljs.core.rest(arglist__14726);
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
    var xs__14729 = cljs.core.seq.call(null, x);
    var ys__14730 = cljs.core.seq.call(null, y);
    while(true) {
      if(xs__14729 == null) {
        return ys__14730 == null
      }else {
        if(ys__14730 == null) {
          return false
        }else {
          if(cljs.core._EQ_.call(null, cljs.core.first.call(null, xs__14729), cljs.core.first.call(null, ys__14730))) {
            var G__14731 = cljs.core.next.call(null, xs__14729);
            var G__14732 = cljs.core.next.call(null, ys__14730);
            xs__14729 = G__14731;
            ys__14730 = G__14732;
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
  return cljs.core.reduce.call(null, function(p1__14733_SHARP_, p2__14734_SHARP_) {
    return cljs.core.hash_combine.call(null, p1__14733_SHARP_, cljs.core.hash.call(null, p2__14734_SHARP_, false))
  }, cljs.core.hash.call(null, cljs.core.first.call(null, coll), false), cljs.core.next.call(null, coll))
};
cljs.core.hash_imap = function hash_imap(m) {
  var h__14738 = 0;
  var s__14739 = cljs.core.seq.call(null, m);
  while(true) {
    if(s__14739) {
      var e__14740 = cljs.core.first.call(null, s__14739);
      var G__14741 = (h__14738 + (cljs.core.hash.call(null, cljs.core.key.call(null, e__14740)) ^ cljs.core.hash.call(null, cljs.core.val.call(null, e__14740)))) % 4503599627370496;
      var G__14742 = cljs.core.next.call(null, s__14739);
      h__14738 = G__14741;
      s__14739 = G__14742;
      continue
    }else {
      return h__14738
    }
    break
  }
};
cljs.core.hash_iset = function hash_iset(s) {
  var h__14746 = 0;
  var s__14747 = cljs.core.seq.call(null, s);
  while(true) {
    if(s__14747) {
      var e__14748 = cljs.core.first.call(null, s__14747);
      var G__14749 = (h__14746 + cljs.core.hash.call(null, e__14748)) % 4503599627370496;
      var G__14750 = cljs.core.next.call(null, s__14747);
      h__14746 = G__14749;
      s__14747 = G__14750;
      continue
    }else {
      return h__14746
    }
    break
  }
};
cljs.core.extend_object_BANG_ = function extend_object_BANG_(obj, fn_map) {
  var G__14771__14772 = cljs.core.seq.call(null, fn_map);
  if(G__14771__14772) {
    var G__14774__14776 = cljs.core.first.call(null, G__14771__14772);
    var vec__14775__14777 = G__14774__14776;
    var key_name__14778 = cljs.core.nth.call(null, vec__14775__14777, 0, null);
    var f__14779 = cljs.core.nth.call(null, vec__14775__14777, 1, null);
    var G__14771__14780 = G__14771__14772;
    var G__14774__14781 = G__14774__14776;
    var G__14771__14782 = G__14771__14780;
    while(true) {
      var vec__14783__14784 = G__14774__14781;
      var key_name__14785 = cljs.core.nth.call(null, vec__14783__14784, 0, null);
      var f__14786 = cljs.core.nth.call(null, vec__14783__14784, 1, null);
      var G__14771__14787 = G__14771__14782;
      var str_name__14788 = cljs.core.name.call(null, key_name__14785);
      obj[str_name__14788] = f__14786;
      var temp__3974__auto____14789 = cljs.core.next.call(null, G__14771__14787);
      if(temp__3974__auto____14789) {
        var G__14771__14790 = temp__3974__auto____14789;
        var G__14791 = cljs.core.first.call(null, G__14771__14790);
        var G__14792 = G__14771__14790;
        G__14774__14781 = G__14791;
        G__14771__14782 = G__14792;
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
cljs.core.List.cljs$lang$ctorPrSeq = function(this__2311__auto__) {
  return cljs.core.list.call(null, "cljs.core/List")
};
cljs.core.List.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__14793 = this;
  var h__2194__auto____14794 = this__14793.__hash;
  if(!(h__2194__auto____14794 == null)) {
    return h__2194__auto____14794
  }else {
    var h__2194__auto____14795 = cljs.core.hash_coll.call(null, coll);
    this__14793.__hash = h__2194__auto____14795;
    return h__2194__auto____14795
  }
};
cljs.core.List.prototype.cljs$core$INext$_next$arity$1 = function(coll) {
  var this__14796 = this;
  if(this__14796.count === 1) {
    return null
  }else {
    return this__14796.rest
  }
};
cljs.core.List.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__14797 = this;
  return new cljs.core.List(this__14797.meta, o, coll, this__14797.count + 1, null)
};
cljs.core.List.prototype.toString = function() {
  var this__14798 = this;
  var this__14799 = this;
  return cljs.core.pr_str.call(null, this__14799)
};
cljs.core.List.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__14800 = this;
  return coll
};
cljs.core.List.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__14801 = this;
  return this__14801.count
};
cljs.core.List.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__14802 = this;
  return this__14802.first
};
cljs.core.List.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__14803 = this;
  return coll.cljs$core$ISeq$_rest$arity$1(coll)
};
cljs.core.List.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__14804 = this;
  return this__14804.first
};
cljs.core.List.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__14805 = this;
  if(this__14805.count === 1) {
    return cljs.core.List.EMPTY
  }else {
    return this__14805.rest
  }
};
cljs.core.List.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__14806 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.List.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__14807 = this;
  return new cljs.core.List(meta, this__14807.first, this__14807.rest, this__14807.count, this__14807.__hash)
};
cljs.core.List.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__14808 = this;
  return this__14808.meta
};
cljs.core.List.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__14809 = this;
  return cljs.core.List.EMPTY
};
cljs.core.List;
cljs.core.EmptyList = function(meta) {
  this.meta = meta;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 65413326
};
cljs.core.EmptyList.cljs$lang$type = true;
cljs.core.EmptyList.cljs$lang$ctorPrSeq = function(this__2311__auto__) {
  return cljs.core.list.call(null, "cljs.core/EmptyList")
};
cljs.core.EmptyList.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__14810 = this;
  return 0
};
cljs.core.EmptyList.prototype.cljs$core$INext$_next$arity$1 = function(coll) {
  var this__14811 = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__14812 = this;
  return new cljs.core.List(this__14812.meta, o, null, 1, null)
};
cljs.core.EmptyList.prototype.toString = function() {
  var this__14813 = this;
  var this__14814 = this;
  return cljs.core.pr_str.call(null, this__14814)
};
cljs.core.EmptyList.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__14815 = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__14816 = this;
  return 0
};
cljs.core.EmptyList.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__14817 = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__14818 = this;
  throw new Error("Can't pop empty list");
};
cljs.core.EmptyList.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__14819 = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__14820 = this;
  return cljs.core.List.EMPTY
};
cljs.core.EmptyList.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__14821 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.EmptyList.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__14822 = this;
  return new cljs.core.EmptyList(meta)
};
cljs.core.EmptyList.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__14823 = this;
  return this__14823.meta
};
cljs.core.EmptyList.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__14824 = this;
  return coll
};
cljs.core.EmptyList;
cljs.core.List.EMPTY = new cljs.core.EmptyList(null);
cljs.core.reversible_QMARK_ = function reversible_QMARK_(coll) {
  var G__14828__14829 = coll;
  if(G__14828__14829) {
    if(function() {
      var or__3824__auto____14830 = G__14828__14829.cljs$lang$protocol_mask$partition0$ & 134217728;
      if(or__3824__auto____14830) {
        return or__3824__auto____14830
      }else {
        return G__14828__14829.cljs$core$IReversible$
      }
    }()) {
      return true
    }else {
      if(!G__14828__14829.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IReversible, G__14828__14829)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IReversible, G__14828__14829)
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
    var G__14831__delegate = function(x, y, z, items) {
      return cljs.core.conj.call(null, cljs.core.conj.call(null, cljs.core.conj.call(null, cljs.core.reduce.call(null, cljs.core.conj, cljs.core.List.EMPTY, cljs.core.reverse.call(null, items)), z), y), x)
    };
    var G__14831 = function(x, y, z, var_args) {
      var items = null;
      if(goog.isDef(var_args)) {
        items = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__14831__delegate.call(this, x, y, z, items)
    };
    G__14831.cljs$lang$maxFixedArity = 3;
    G__14831.cljs$lang$applyTo = function(arglist__14832) {
      var x = cljs.core.first(arglist__14832);
      var y = cljs.core.first(cljs.core.next(arglist__14832));
      var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__14832)));
      var items = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__14832)));
      return G__14831__delegate(x, y, z, items)
    };
    G__14831.cljs$lang$arity$variadic = G__14831__delegate;
    return G__14831
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
cljs.core.Cons.cljs$lang$ctorPrSeq = function(this__2311__auto__) {
  return cljs.core.list.call(null, "cljs.core/Cons")
};
cljs.core.Cons.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__14833 = this;
  var h__2194__auto____14834 = this__14833.__hash;
  if(!(h__2194__auto____14834 == null)) {
    return h__2194__auto____14834
  }else {
    var h__2194__auto____14835 = cljs.core.hash_coll.call(null, coll);
    this__14833.__hash = h__2194__auto____14835;
    return h__2194__auto____14835
  }
};
cljs.core.Cons.prototype.cljs$core$INext$_next$arity$1 = function(coll) {
  var this__14836 = this;
  if(this__14836.rest == null) {
    return null
  }else {
    return cljs.core._seq.call(null, this__14836.rest)
  }
};
cljs.core.Cons.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__14837 = this;
  return new cljs.core.Cons(null, o, coll, this__14837.__hash)
};
cljs.core.Cons.prototype.toString = function() {
  var this__14838 = this;
  var this__14839 = this;
  return cljs.core.pr_str.call(null, this__14839)
};
cljs.core.Cons.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__14840 = this;
  return coll
};
cljs.core.Cons.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__14841 = this;
  return this__14841.first
};
cljs.core.Cons.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__14842 = this;
  if(this__14842.rest == null) {
    return cljs.core.List.EMPTY
  }else {
    return this__14842.rest
  }
};
cljs.core.Cons.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__14843 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.Cons.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__14844 = this;
  return new cljs.core.Cons(meta, this__14844.first, this__14844.rest, this__14844.__hash)
};
cljs.core.Cons.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__14845 = this;
  return this__14845.meta
};
cljs.core.Cons.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__14846 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__14846.meta)
};
cljs.core.Cons;
cljs.core.cons = function cons(x, coll) {
  if(function() {
    var or__3824__auto____14851 = coll == null;
    if(or__3824__auto____14851) {
      return or__3824__auto____14851
    }else {
      var G__14852__14853 = coll;
      if(G__14852__14853) {
        if(function() {
          var or__3824__auto____14854 = G__14852__14853.cljs$lang$protocol_mask$partition0$ & 64;
          if(or__3824__auto____14854) {
            return or__3824__auto____14854
          }else {
            return G__14852__14853.cljs$core$ISeq$
          }
        }()) {
          return true
        }else {
          if(!G__14852__14853.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__14852__14853)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__14852__14853)
      }
    }
  }()) {
    return new cljs.core.Cons(null, x, coll, null)
  }else {
    return new cljs.core.Cons(null, x, cljs.core.seq.call(null, coll), null)
  }
};
cljs.core.list_QMARK_ = function list_QMARK_(x) {
  var G__14858__14859 = x;
  if(G__14858__14859) {
    if(function() {
      var or__3824__auto____14860 = G__14858__14859.cljs$lang$protocol_mask$partition0$ & 33554432;
      if(or__3824__auto____14860) {
        return or__3824__auto____14860
      }else {
        return G__14858__14859.cljs$core$IList$
      }
    }()) {
      return true
    }else {
      if(!G__14858__14859.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IList, G__14858__14859)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IList, G__14858__14859)
  }
};
cljs.core.IReduce["string"] = true;
cljs.core._reduce["string"] = function() {
  var G__14861 = null;
  var G__14861__2 = function(string, f) {
    return cljs.core.ci_reduce.call(null, string, f)
  };
  var G__14861__3 = function(string, f, start) {
    return cljs.core.ci_reduce.call(null, string, f, start)
  };
  G__14861 = function(string, f, start) {
    switch(arguments.length) {
      case 2:
        return G__14861__2.call(this, string, f);
      case 3:
        return G__14861__3.call(this, string, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__14861
}();
cljs.core.ILookup["string"] = true;
cljs.core._lookup["string"] = function() {
  var G__14862 = null;
  var G__14862__2 = function(string, k) {
    return cljs.core._nth.call(null, string, k)
  };
  var G__14862__3 = function(string, k, not_found) {
    return cljs.core._nth.call(null, string, k, not_found)
  };
  G__14862 = function(string, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__14862__2.call(this, string, k);
      case 3:
        return G__14862__3.call(this, string, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__14862
}();
cljs.core.IIndexed["string"] = true;
cljs.core._nth["string"] = function() {
  var G__14863 = null;
  var G__14863__2 = function(string, n) {
    if(n < cljs.core._count.call(null, string)) {
      return string.charAt(n)
    }else {
      return null
    }
  };
  var G__14863__3 = function(string, n, not_found) {
    if(n < cljs.core._count.call(null, string)) {
      return string.charAt(n)
    }else {
      return not_found
    }
  };
  G__14863 = function(string, n, not_found) {
    switch(arguments.length) {
      case 2:
        return G__14863__2.call(this, string, n);
      case 3:
        return G__14863__3.call(this, string, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__14863
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
cljs.core.Keyword.cljs$lang$ctorPrSeq = function(this__2311__auto__) {
  return cljs.core.list.call(null, "cljs.core/Keyword")
};
cljs.core.Keyword.prototype.call = function() {
  var G__14875 = null;
  var G__14875__2 = function(this_sym14866, coll) {
    var this__14868 = this;
    var this_sym14866__14869 = this;
    var ___14870 = this_sym14866__14869;
    if(coll == null) {
      return null
    }else {
      var strobj__14871 = coll.strobj;
      if(strobj__14871 == null) {
        return cljs.core._lookup.call(null, coll, this__14868.k, null)
      }else {
        return strobj__14871[this__14868.k]
      }
    }
  };
  var G__14875__3 = function(this_sym14867, coll, not_found) {
    var this__14868 = this;
    var this_sym14867__14872 = this;
    var ___14873 = this_sym14867__14872;
    if(coll == null) {
      return not_found
    }else {
      return cljs.core._lookup.call(null, coll, this__14868.k, not_found)
    }
  };
  G__14875 = function(this_sym14867, coll, not_found) {
    switch(arguments.length) {
      case 2:
        return G__14875__2.call(this, this_sym14867, coll);
      case 3:
        return G__14875__3.call(this, this_sym14867, coll, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__14875
}();
cljs.core.Keyword.prototype.apply = function(this_sym14864, args14865) {
  var this__14874 = this;
  return this_sym14864.call.apply(this_sym14864, [this_sym14864].concat(args14865.slice()))
};
cljs.core.Keyword;
String.prototype.cljs$core$IFn$ = true;
String.prototype.call = function() {
  var G__14884 = null;
  var G__14884__2 = function(this_sym14878, coll) {
    var this_sym14878__14880 = this;
    var this__14881 = this_sym14878__14880;
    return cljs.core._lookup.call(null, coll, this__14881.toString(), null)
  };
  var G__14884__3 = function(this_sym14879, coll, not_found) {
    var this_sym14879__14882 = this;
    var this__14883 = this_sym14879__14882;
    return cljs.core._lookup.call(null, coll, this__14883.toString(), not_found)
  };
  G__14884 = function(this_sym14879, coll, not_found) {
    switch(arguments.length) {
      case 2:
        return G__14884__2.call(this, this_sym14879, coll);
      case 3:
        return G__14884__3.call(this, this_sym14879, coll, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__14884
}();
String.prototype.apply = function(this_sym14876, args14877) {
  return this_sym14876.call.apply(this_sym14876, [this_sym14876].concat(args14877.slice()))
};
String.prototype.apply = function(s, args) {
  if(cljs.core.count.call(null, args) < 2) {
    return cljs.core._lookup.call(null, args[0], s, null)
  }else {
    return cljs.core._lookup.call(null, args[0], s, args[1])
  }
};
cljs.core.lazy_seq_value = function lazy_seq_value(lazy_seq) {
  var x__14886 = lazy_seq.x;
  if(lazy_seq.realized) {
    return x__14886
  }else {
    lazy_seq.x = x__14886.call(null);
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
cljs.core.LazySeq.cljs$lang$ctorPrSeq = function(this__2311__auto__) {
  return cljs.core.list.call(null, "cljs.core/LazySeq")
};
cljs.core.LazySeq.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__14887 = this;
  var h__2194__auto____14888 = this__14887.__hash;
  if(!(h__2194__auto____14888 == null)) {
    return h__2194__auto____14888
  }else {
    var h__2194__auto____14889 = cljs.core.hash_coll.call(null, coll);
    this__14887.__hash = h__2194__auto____14889;
    return h__2194__auto____14889
  }
};
cljs.core.LazySeq.prototype.cljs$core$INext$_next$arity$1 = function(coll) {
  var this__14890 = this;
  return cljs.core._seq.call(null, coll.cljs$core$ISeq$_rest$arity$1(coll))
};
cljs.core.LazySeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__14891 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.LazySeq.prototype.toString = function() {
  var this__14892 = this;
  var this__14893 = this;
  return cljs.core.pr_str.call(null, this__14893)
};
cljs.core.LazySeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__14894 = this;
  return cljs.core.seq.call(null, cljs.core.lazy_seq_value.call(null, coll))
};
cljs.core.LazySeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__14895 = this;
  return cljs.core.first.call(null, cljs.core.lazy_seq_value.call(null, coll))
};
cljs.core.LazySeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__14896 = this;
  return cljs.core.rest.call(null, cljs.core.lazy_seq_value.call(null, coll))
};
cljs.core.LazySeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__14897 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.LazySeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__14898 = this;
  return new cljs.core.LazySeq(meta, this__14898.realized, this__14898.x, this__14898.__hash)
};
cljs.core.LazySeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__14899 = this;
  return this__14899.meta
};
cljs.core.LazySeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__14900 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__14900.meta)
};
cljs.core.LazySeq;
cljs.core.ChunkBuffer = function(buf, end) {
  this.buf = buf;
  this.end = end;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 2
};
cljs.core.ChunkBuffer.cljs$lang$type = true;
cljs.core.ChunkBuffer.cljs$lang$ctorPrSeq = function(this__2311__auto__) {
  return cljs.core.list.call(null, "cljs.core/ChunkBuffer")
};
cljs.core.ChunkBuffer.prototype.cljs$core$ICounted$_count$arity$1 = function(_) {
  var this__14901 = this;
  return this__14901.end
};
cljs.core.ChunkBuffer.prototype.add = function(o) {
  var this__14902 = this;
  var ___14903 = this;
  this__14902.buf[this__14902.end] = o;
  return this__14902.end = this__14902.end + 1
};
cljs.core.ChunkBuffer.prototype.chunk = function(o) {
  var this__14904 = this;
  var ___14905 = this;
  var ret__14906 = new cljs.core.ArrayChunk(this__14904.buf, 0, this__14904.end);
  this__14904.buf = null;
  return ret__14906
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
cljs.core.ArrayChunk.cljs$lang$ctorPrSeq = function(this__2311__auto__) {
  return cljs.core.list.call(null, "cljs.core/ArrayChunk")
};
cljs.core.ArrayChunk.prototype.cljs$core$IReduce$_reduce$arity$2 = function(coll, f) {
  var this__14907 = this;
  return cljs.core.ci_reduce.call(null, coll, f, this__14907.arr[this__14907.off], this__14907.off + 1)
};
cljs.core.ArrayChunk.prototype.cljs$core$IReduce$_reduce$arity$3 = function(coll, f, start) {
  var this__14908 = this;
  return cljs.core.ci_reduce.call(null, coll, f, start, this__14908.off)
};
cljs.core.ArrayChunk.prototype.cljs$core$IChunk$ = true;
cljs.core.ArrayChunk.prototype.cljs$core$IChunk$_drop_first$arity$1 = function(coll) {
  var this__14909 = this;
  if(this__14909.off === this__14909.end) {
    throw new Error("-drop-first of empty chunk");
  }else {
    return new cljs.core.ArrayChunk(this__14909.arr, this__14909.off + 1, this__14909.end)
  }
};
cljs.core.ArrayChunk.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, i) {
  var this__14910 = this;
  return this__14910.arr[this__14910.off + i]
};
cljs.core.ArrayChunk.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, i, not_found) {
  var this__14911 = this;
  if(function() {
    var and__3822__auto____14912 = i >= 0;
    if(and__3822__auto____14912) {
      return i < this__14911.end - this__14911.off
    }else {
      return and__3822__auto____14912
    }
  }()) {
    return this__14911.arr[this__14911.off + i]
  }else {
    return not_found
  }
};
cljs.core.ArrayChunk.prototype.cljs$core$ICounted$_count$arity$1 = function(_) {
  var this__14913 = this;
  return this__14913.end - this__14913.off
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
cljs.core.ChunkedCons.cljs$lang$ctorPrSeq = function(this__2311__auto__) {
  return cljs.core.list.call(null, "cljs.core/ChunkedCons")
};
cljs.core.ChunkedCons.prototype.cljs$core$ICollection$_conj$arity$2 = function(this$, o) {
  var this__14914 = this;
  return cljs.core.cons.call(null, o, this$)
};
cljs.core.ChunkedCons.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__14915 = this;
  return coll
};
cljs.core.ChunkedCons.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__14916 = this;
  return cljs.core._nth.call(null, this__14916.chunk, 0)
};
cljs.core.ChunkedCons.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__14917 = this;
  if(cljs.core._count.call(null, this__14917.chunk) > 1) {
    return new cljs.core.ChunkedCons(cljs.core._drop_first.call(null, this__14917.chunk), this__14917.more, this__14917.meta)
  }else {
    if(this__14917.more == null) {
      return cljs.core.List.EMPTY
    }else {
      return this__14917.more
    }
  }
};
cljs.core.ChunkedCons.prototype.cljs$core$IChunkedNext$ = true;
cljs.core.ChunkedCons.prototype.cljs$core$IChunkedNext$_chunked_next$arity$1 = function(coll) {
  var this__14918 = this;
  if(this__14918.more == null) {
    return null
  }else {
    return this__14918.more
  }
};
cljs.core.ChunkedCons.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__14919 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.ChunkedCons.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, m) {
  var this__14920 = this;
  return new cljs.core.ChunkedCons(this__14920.chunk, this__14920.more, m)
};
cljs.core.ChunkedCons.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__14921 = this;
  return this__14921.meta
};
cljs.core.ChunkedCons.prototype.cljs$core$IChunkedSeq$ = true;
cljs.core.ChunkedCons.prototype.cljs$core$IChunkedSeq$_chunked_first$arity$1 = function(coll) {
  var this__14922 = this;
  return this__14922.chunk
};
cljs.core.ChunkedCons.prototype.cljs$core$IChunkedSeq$_chunked_rest$arity$1 = function(coll) {
  var this__14923 = this;
  if(this__14923.more == null) {
    return cljs.core.List.EMPTY
  }else {
    return this__14923.more
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
    var G__14927__14928 = s;
    if(G__14927__14928) {
      if(cljs.core.truth_(function() {
        var or__3824__auto____14929 = null;
        if(cljs.core.truth_(or__3824__auto____14929)) {
          return or__3824__auto____14929
        }else {
          return G__14927__14928.cljs$core$IChunkedNext$
        }
      }())) {
        return true
      }else {
        if(!G__14927__14928.cljs$lang$protocol_mask$partition$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.IChunkedNext, G__14927__14928)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.IChunkedNext, G__14927__14928)
    }
  }()) {
    return cljs.core._chunked_next.call(null, s)
  }else {
    return cljs.core.seq.call(null, cljs.core._chunked_rest.call(null, s))
  }
};
cljs.core.to_array = function to_array(s) {
  var ary__14932 = [];
  var s__14933 = s;
  while(true) {
    if(cljs.core.seq.call(null, s__14933)) {
      ary__14932.push(cljs.core.first.call(null, s__14933));
      var G__14934 = cljs.core.next.call(null, s__14933);
      s__14933 = G__14934;
      continue
    }else {
      return ary__14932
    }
    break
  }
};
cljs.core.to_array_2d = function to_array_2d(coll) {
  var ret__14938 = cljs.core.make_array.call(null, cljs.core.count.call(null, coll));
  var i__14939 = 0;
  var xs__14940 = cljs.core.seq.call(null, coll);
  while(true) {
    if(xs__14940) {
      ret__14938[i__14939] = cljs.core.to_array.call(null, cljs.core.first.call(null, xs__14940));
      var G__14941 = i__14939 + 1;
      var G__14942 = cljs.core.next.call(null, xs__14940);
      i__14939 = G__14941;
      xs__14940 = G__14942;
      continue
    }else {
    }
    break
  }
  return ret__14938
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
    var a__14950 = cljs.core.make_array.call(null, size);
    if(cljs.core.seq_QMARK_.call(null, init_val_or_seq)) {
      var s__14951 = cljs.core.seq.call(null, init_val_or_seq);
      var i__14952 = 0;
      var s__14953 = s__14951;
      while(true) {
        if(cljs.core.truth_(function() {
          var and__3822__auto____14954 = s__14953;
          if(and__3822__auto____14954) {
            return i__14952 < size
          }else {
            return and__3822__auto____14954
          }
        }())) {
          a__14950[i__14952] = cljs.core.first.call(null, s__14953);
          var G__14957 = i__14952 + 1;
          var G__14958 = cljs.core.next.call(null, s__14953);
          i__14952 = G__14957;
          s__14953 = G__14958;
          continue
        }else {
          return a__14950
        }
        break
      }
    }else {
      var n__2529__auto____14955 = size;
      var i__14956 = 0;
      while(true) {
        if(i__14956 < n__2529__auto____14955) {
          a__14950[i__14956] = init_val_or_seq;
          var G__14959 = i__14956 + 1;
          i__14956 = G__14959;
          continue
        }else {
        }
        break
      }
      return a__14950
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
    var a__14967 = cljs.core.make_array.call(null, size);
    if(cljs.core.seq_QMARK_.call(null, init_val_or_seq)) {
      var s__14968 = cljs.core.seq.call(null, init_val_or_seq);
      var i__14969 = 0;
      var s__14970 = s__14968;
      while(true) {
        if(cljs.core.truth_(function() {
          var and__3822__auto____14971 = s__14970;
          if(and__3822__auto____14971) {
            return i__14969 < size
          }else {
            return and__3822__auto____14971
          }
        }())) {
          a__14967[i__14969] = cljs.core.first.call(null, s__14970);
          var G__14974 = i__14969 + 1;
          var G__14975 = cljs.core.next.call(null, s__14970);
          i__14969 = G__14974;
          s__14970 = G__14975;
          continue
        }else {
          return a__14967
        }
        break
      }
    }else {
      var n__2529__auto____14972 = size;
      var i__14973 = 0;
      while(true) {
        if(i__14973 < n__2529__auto____14972) {
          a__14967[i__14973] = init_val_or_seq;
          var G__14976 = i__14973 + 1;
          i__14973 = G__14976;
          continue
        }else {
        }
        break
      }
      return a__14967
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
    var a__14984 = cljs.core.make_array.call(null, size);
    if(cljs.core.seq_QMARK_.call(null, init_val_or_seq)) {
      var s__14985 = cljs.core.seq.call(null, init_val_or_seq);
      var i__14986 = 0;
      var s__14987 = s__14985;
      while(true) {
        if(cljs.core.truth_(function() {
          var and__3822__auto____14988 = s__14987;
          if(and__3822__auto____14988) {
            return i__14986 < size
          }else {
            return and__3822__auto____14988
          }
        }())) {
          a__14984[i__14986] = cljs.core.first.call(null, s__14987);
          var G__14991 = i__14986 + 1;
          var G__14992 = cljs.core.next.call(null, s__14987);
          i__14986 = G__14991;
          s__14987 = G__14992;
          continue
        }else {
          return a__14984
        }
        break
      }
    }else {
      var n__2529__auto____14989 = size;
      var i__14990 = 0;
      while(true) {
        if(i__14990 < n__2529__auto____14989) {
          a__14984[i__14990] = init_val_or_seq;
          var G__14993 = i__14990 + 1;
          i__14990 = G__14993;
          continue
        }else {
        }
        break
      }
      return a__14984
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
    var s__14998 = s;
    var i__14999 = n;
    var sum__15000 = 0;
    while(true) {
      if(cljs.core.truth_(function() {
        var and__3822__auto____15001 = i__14999 > 0;
        if(and__3822__auto____15001) {
          return cljs.core.seq.call(null, s__14998)
        }else {
          return and__3822__auto____15001
        }
      }())) {
        var G__15002 = cljs.core.next.call(null, s__14998);
        var G__15003 = i__14999 - 1;
        var G__15004 = sum__15000 + 1;
        s__14998 = G__15002;
        i__14999 = G__15003;
        sum__15000 = G__15004;
        continue
      }else {
        return sum__15000
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
      var s__15009 = cljs.core.seq.call(null, x);
      if(s__15009) {
        if(cljs.core.chunked_seq_QMARK_.call(null, s__15009)) {
          return cljs.core.chunk_cons.call(null, cljs.core.chunk_first.call(null, s__15009), concat.call(null, cljs.core.chunk_rest.call(null, s__15009), y))
        }else {
          return cljs.core.cons.call(null, cljs.core.first.call(null, s__15009), concat.call(null, cljs.core.rest.call(null, s__15009), y))
        }
      }else {
        return y
      }
    }, null)
  };
  var concat__3 = function() {
    var G__15013__delegate = function(x, y, zs) {
      var cat__15012 = function cat(xys, zs) {
        return new cljs.core.LazySeq(null, false, function() {
          var xys__15011 = cljs.core.seq.call(null, xys);
          if(xys__15011) {
            if(cljs.core.chunked_seq_QMARK_.call(null, xys__15011)) {
              return cljs.core.chunk_cons.call(null, cljs.core.chunk_first.call(null, xys__15011), cat.call(null, cljs.core.chunk_rest.call(null, xys__15011), zs))
            }else {
              return cljs.core.cons.call(null, cljs.core.first.call(null, xys__15011), cat.call(null, cljs.core.rest.call(null, xys__15011), zs))
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
      return cat__15012.call(null, concat.call(null, x, y), zs)
    };
    var G__15013 = function(x, y, var_args) {
      var zs = null;
      if(goog.isDef(var_args)) {
        zs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__15013__delegate.call(this, x, y, zs)
    };
    G__15013.cljs$lang$maxFixedArity = 2;
    G__15013.cljs$lang$applyTo = function(arglist__15014) {
      var x = cljs.core.first(arglist__15014);
      var y = cljs.core.first(cljs.core.next(arglist__15014));
      var zs = cljs.core.rest(cljs.core.next(arglist__15014));
      return G__15013__delegate(x, y, zs)
    };
    G__15013.cljs$lang$arity$variadic = G__15013__delegate;
    return G__15013
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
    var G__15015__delegate = function(a, b, c, d, more) {
      return cljs.core.cons.call(null, a, cljs.core.cons.call(null, b, cljs.core.cons.call(null, c, cljs.core.cons.call(null, d, cljs.core.spread.call(null, more)))))
    };
    var G__15015 = function(a, b, c, d, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 4), 0)
      }
      return G__15015__delegate.call(this, a, b, c, d, more)
    };
    G__15015.cljs$lang$maxFixedArity = 4;
    G__15015.cljs$lang$applyTo = function(arglist__15016) {
      var a = cljs.core.first(arglist__15016);
      var b = cljs.core.first(cljs.core.next(arglist__15016));
      var c = cljs.core.first(cljs.core.next(cljs.core.next(arglist__15016)));
      var d = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__15016))));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(arglist__15016))));
      return G__15015__delegate(a, b, c, d, more)
    };
    G__15015.cljs$lang$arity$variadic = G__15015__delegate;
    return G__15015
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
  var args__15058 = cljs.core.seq.call(null, args);
  if(argc === 0) {
    return f.call(null)
  }else {
    var a__15059 = cljs.core._first.call(null, args__15058);
    var args__15060 = cljs.core._rest.call(null, args__15058);
    if(argc === 1) {
      if(f.cljs$lang$arity$1) {
        return f.cljs$lang$arity$1(a__15059)
      }else {
        return f.call(null, a__15059)
      }
    }else {
      var b__15061 = cljs.core._first.call(null, args__15060);
      var args__15062 = cljs.core._rest.call(null, args__15060);
      if(argc === 2) {
        if(f.cljs$lang$arity$2) {
          return f.cljs$lang$arity$2(a__15059, b__15061)
        }else {
          return f.call(null, a__15059, b__15061)
        }
      }else {
        var c__15063 = cljs.core._first.call(null, args__15062);
        var args__15064 = cljs.core._rest.call(null, args__15062);
        if(argc === 3) {
          if(f.cljs$lang$arity$3) {
            return f.cljs$lang$arity$3(a__15059, b__15061, c__15063)
          }else {
            return f.call(null, a__15059, b__15061, c__15063)
          }
        }else {
          var d__15065 = cljs.core._first.call(null, args__15064);
          var args__15066 = cljs.core._rest.call(null, args__15064);
          if(argc === 4) {
            if(f.cljs$lang$arity$4) {
              return f.cljs$lang$arity$4(a__15059, b__15061, c__15063, d__15065)
            }else {
              return f.call(null, a__15059, b__15061, c__15063, d__15065)
            }
          }else {
            var e__15067 = cljs.core._first.call(null, args__15066);
            var args__15068 = cljs.core._rest.call(null, args__15066);
            if(argc === 5) {
              if(f.cljs$lang$arity$5) {
                return f.cljs$lang$arity$5(a__15059, b__15061, c__15063, d__15065, e__15067)
              }else {
                return f.call(null, a__15059, b__15061, c__15063, d__15065, e__15067)
              }
            }else {
              var f__15069 = cljs.core._first.call(null, args__15068);
              var args__15070 = cljs.core._rest.call(null, args__15068);
              if(argc === 6) {
                if(f__15069.cljs$lang$arity$6) {
                  return f__15069.cljs$lang$arity$6(a__15059, b__15061, c__15063, d__15065, e__15067, f__15069)
                }else {
                  return f__15069.call(null, a__15059, b__15061, c__15063, d__15065, e__15067, f__15069)
                }
              }else {
                var g__15071 = cljs.core._first.call(null, args__15070);
                var args__15072 = cljs.core._rest.call(null, args__15070);
                if(argc === 7) {
                  if(f__15069.cljs$lang$arity$7) {
                    return f__15069.cljs$lang$arity$7(a__15059, b__15061, c__15063, d__15065, e__15067, f__15069, g__15071)
                  }else {
                    return f__15069.call(null, a__15059, b__15061, c__15063, d__15065, e__15067, f__15069, g__15071)
                  }
                }else {
                  var h__15073 = cljs.core._first.call(null, args__15072);
                  var args__15074 = cljs.core._rest.call(null, args__15072);
                  if(argc === 8) {
                    if(f__15069.cljs$lang$arity$8) {
                      return f__15069.cljs$lang$arity$8(a__15059, b__15061, c__15063, d__15065, e__15067, f__15069, g__15071, h__15073)
                    }else {
                      return f__15069.call(null, a__15059, b__15061, c__15063, d__15065, e__15067, f__15069, g__15071, h__15073)
                    }
                  }else {
                    var i__15075 = cljs.core._first.call(null, args__15074);
                    var args__15076 = cljs.core._rest.call(null, args__15074);
                    if(argc === 9) {
                      if(f__15069.cljs$lang$arity$9) {
                        return f__15069.cljs$lang$arity$9(a__15059, b__15061, c__15063, d__15065, e__15067, f__15069, g__15071, h__15073, i__15075)
                      }else {
                        return f__15069.call(null, a__15059, b__15061, c__15063, d__15065, e__15067, f__15069, g__15071, h__15073, i__15075)
                      }
                    }else {
                      var j__15077 = cljs.core._first.call(null, args__15076);
                      var args__15078 = cljs.core._rest.call(null, args__15076);
                      if(argc === 10) {
                        if(f__15069.cljs$lang$arity$10) {
                          return f__15069.cljs$lang$arity$10(a__15059, b__15061, c__15063, d__15065, e__15067, f__15069, g__15071, h__15073, i__15075, j__15077)
                        }else {
                          return f__15069.call(null, a__15059, b__15061, c__15063, d__15065, e__15067, f__15069, g__15071, h__15073, i__15075, j__15077)
                        }
                      }else {
                        var k__15079 = cljs.core._first.call(null, args__15078);
                        var args__15080 = cljs.core._rest.call(null, args__15078);
                        if(argc === 11) {
                          if(f__15069.cljs$lang$arity$11) {
                            return f__15069.cljs$lang$arity$11(a__15059, b__15061, c__15063, d__15065, e__15067, f__15069, g__15071, h__15073, i__15075, j__15077, k__15079)
                          }else {
                            return f__15069.call(null, a__15059, b__15061, c__15063, d__15065, e__15067, f__15069, g__15071, h__15073, i__15075, j__15077, k__15079)
                          }
                        }else {
                          var l__15081 = cljs.core._first.call(null, args__15080);
                          var args__15082 = cljs.core._rest.call(null, args__15080);
                          if(argc === 12) {
                            if(f__15069.cljs$lang$arity$12) {
                              return f__15069.cljs$lang$arity$12(a__15059, b__15061, c__15063, d__15065, e__15067, f__15069, g__15071, h__15073, i__15075, j__15077, k__15079, l__15081)
                            }else {
                              return f__15069.call(null, a__15059, b__15061, c__15063, d__15065, e__15067, f__15069, g__15071, h__15073, i__15075, j__15077, k__15079, l__15081)
                            }
                          }else {
                            var m__15083 = cljs.core._first.call(null, args__15082);
                            var args__15084 = cljs.core._rest.call(null, args__15082);
                            if(argc === 13) {
                              if(f__15069.cljs$lang$arity$13) {
                                return f__15069.cljs$lang$arity$13(a__15059, b__15061, c__15063, d__15065, e__15067, f__15069, g__15071, h__15073, i__15075, j__15077, k__15079, l__15081, m__15083)
                              }else {
                                return f__15069.call(null, a__15059, b__15061, c__15063, d__15065, e__15067, f__15069, g__15071, h__15073, i__15075, j__15077, k__15079, l__15081, m__15083)
                              }
                            }else {
                              var n__15085 = cljs.core._first.call(null, args__15084);
                              var args__15086 = cljs.core._rest.call(null, args__15084);
                              if(argc === 14) {
                                if(f__15069.cljs$lang$arity$14) {
                                  return f__15069.cljs$lang$arity$14(a__15059, b__15061, c__15063, d__15065, e__15067, f__15069, g__15071, h__15073, i__15075, j__15077, k__15079, l__15081, m__15083, n__15085)
                                }else {
                                  return f__15069.call(null, a__15059, b__15061, c__15063, d__15065, e__15067, f__15069, g__15071, h__15073, i__15075, j__15077, k__15079, l__15081, m__15083, n__15085)
                                }
                              }else {
                                var o__15087 = cljs.core._first.call(null, args__15086);
                                var args__15088 = cljs.core._rest.call(null, args__15086);
                                if(argc === 15) {
                                  if(f__15069.cljs$lang$arity$15) {
                                    return f__15069.cljs$lang$arity$15(a__15059, b__15061, c__15063, d__15065, e__15067, f__15069, g__15071, h__15073, i__15075, j__15077, k__15079, l__15081, m__15083, n__15085, o__15087)
                                  }else {
                                    return f__15069.call(null, a__15059, b__15061, c__15063, d__15065, e__15067, f__15069, g__15071, h__15073, i__15075, j__15077, k__15079, l__15081, m__15083, n__15085, o__15087)
                                  }
                                }else {
                                  var p__15089 = cljs.core._first.call(null, args__15088);
                                  var args__15090 = cljs.core._rest.call(null, args__15088);
                                  if(argc === 16) {
                                    if(f__15069.cljs$lang$arity$16) {
                                      return f__15069.cljs$lang$arity$16(a__15059, b__15061, c__15063, d__15065, e__15067, f__15069, g__15071, h__15073, i__15075, j__15077, k__15079, l__15081, m__15083, n__15085, o__15087, p__15089)
                                    }else {
                                      return f__15069.call(null, a__15059, b__15061, c__15063, d__15065, e__15067, f__15069, g__15071, h__15073, i__15075, j__15077, k__15079, l__15081, m__15083, n__15085, o__15087, p__15089)
                                    }
                                  }else {
                                    var q__15091 = cljs.core._first.call(null, args__15090);
                                    var args__15092 = cljs.core._rest.call(null, args__15090);
                                    if(argc === 17) {
                                      if(f__15069.cljs$lang$arity$17) {
                                        return f__15069.cljs$lang$arity$17(a__15059, b__15061, c__15063, d__15065, e__15067, f__15069, g__15071, h__15073, i__15075, j__15077, k__15079, l__15081, m__15083, n__15085, o__15087, p__15089, q__15091)
                                      }else {
                                        return f__15069.call(null, a__15059, b__15061, c__15063, d__15065, e__15067, f__15069, g__15071, h__15073, i__15075, j__15077, k__15079, l__15081, m__15083, n__15085, o__15087, p__15089, q__15091)
                                      }
                                    }else {
                                      var r__15093 = cljs.core._first.call(null, args__15092);
                                      var args__15094 = cljs.core._rest.call(null, args__15092);
                                      if(argc === 18) {
                                        if(f__15069.cljs$lang$arity$18) {
                                          return f__15069.cljs$lang$arity$18(a__15059, b__15061, c__15063, d__15065, e__15067, f__15069, g__15071, h__15073, i__15075, j__15077, k__15079, l__15081, m__15083, n__15085, o__15087, p__15089, q__15091, r__15093)
                                        }else {
                                          return f__15069.call(null, a__15059, b__15061, c__15063, d__15065, e__15067, f__15069, g__15071, h__15073, i__15075, j__15077, k__15079, l__15081, m__15083, n__15085, o__15087, p__15089, q__15091, r__15093)
                                        }
                                      }else {
                                        var s__15095 = cljs.core._first.call(null, args__15094);
                                        var args__15096 = cljs.core._rest.call(null, args__15094);
                                        if(argc === 19) {
                                          if(f__15069.cljs$lang$arity$19) {
                                            return f__15069.cljs$lang$arity$19(a__15059, b__15061, c__15063, d__15065, e__15067, f__15069, g__15071, h__15073, i__15075, j__15077, k__15079, l__15081, m__15083, n__15085, o__15087, p__15089, q__15091, r__15093, s__15095)
                                          }else {
                                            return f__15069.call(null, a__15059, b__15061, c__15063, d__15065, e__15067, f__15069, g__15071, h__15073, i__15075, j__15077, k__15079, l__15081, m__15083, n__15085, o__15087, p__15089, q__15091, r__15093, s__15095)
                                          }
                                        }else {
                                          var t__15097 = cljs.core._first.call(null, args__15096);
                                          var args__15098 = cljs.core._rest.call(null, args__15096);
                                          if(argc === 20) {
                                            if(f__15069.cljs$lang$arity$20) {
                                              return f__15069.cljs$lang$arity$20(a__15059, b__15061, c__15063, d__15065, e__15067, f__15069, g__15071, h__15073, i__15075, j__15077, k__15079, l__15081, m__15083, n__15085, o__15087, p__15089, q__15091, r__15093, s__15095, t__15097)
                                            }else {
                                              return f__15069.call(null, a__15059, b__15061, c__15063, d__15065, e__15067, f__15069, g__15071, h__15073, i__15075, j__15077, k__15079, l__15081, m__15083, n__15085, o__15087, p__15089, q__15091, r__15093, s__15095, t__15097)
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
    var fixed_arity__15113 = f.cljs$lang$maxFixedArity;
    if(cljs.core.truth_(f.cljs$lang$applyTo)) {
      var bc__15114 = cljs.core.bounded_count.call(null, args, fixed_arity__15113 + 1);
      if(bc__15114 <= fixed_arity__15113) {
        return cljs.core.apply_to.call(null, f, bc__15114, args)
      }else {
        return f.cljs$lang$applyTo(args)
      }
    }else {
      return f.apply(f, cljs.core.to_array.call(null, args))
    }
  };
  var apply__3 = function(f, x, args) {
    var arglist__15115 = cljs.core.list_STAR_.call(null, x, args);
    var fixed_arity__15116 = f.cljs$lang$maxFixedArity;
    if(cljs.core.truth_(f.cljs$lang$applyTo)) {
      var bc__15117 = cljs.core.bounded_count.call(null, arglist__15115, fixed_arity__15116 + 1);
      if(bc__15117 <= fixed_arity__15116) {
        return cljs.core.apply_to.call(null, f, bc__15117, arglist__15115)
      }else {
        return f.cljs$lang$applyTo(arglist__15115)
      }
    }else {
      return f.apply(f, cljs.core.to_array.call(null, arglist__15115))
    }
  };
  var apply__4 = function(f, x, y, args) {
    var arglist__15118 = cljs.core.list_STAR_.call(null, x, y, args);
    var fixed_arity__15119 = f.cljs$lang$maxFixedArity;
    if(cljs.core.truth_(f.cljs$lang$applyTo)) {
      var bc__15120 = cljs.core.bounded_count.call(null, arglist__15118, fixed_arity__15119 + 1);
      if(bc__15120 <= fixed_arity__15119) {
        return cljs.core.apply_to.call(null, f, bc__15120, arglist__15118)
      }else {
        return f.cljs$lang$applyTo(arglist__15118)
      }
    }else {
      return f.apply(f, cljs.core.to_array.call(null, arglist__15118))
    }
  };
  var apply__5 = function(f, x, y, z, args) {
    var arglist__15121 = cljs.core.list_STAR_.call(null, x, y, z, args);
    var fixed_arity__15122 = f.cljs$lang$maxFixedArity;
    if(cljs.core.truth_(f.cljs$lang$applyTo)) {
      var bc__15123 = cljs.core.bounded_count.call(null, arglist__15121, fixed_arity__15122 + 1);
      if(bc__15123 <= fixed_arity__15122) {
        return cljs.core.apply_to.call(null, f, bc__15123, arglist__15121)
      }else {
        return f.cljs$lang$applyTo(arglist__15121)
      }
    }else {
      return f.apply(f, cljs.core.to_array.call(null, arglist__15121))
    }
  };
  var apply__6 = function() {
    var G__15127__delegate = function(f, a, b, c, d, args) {
      var arglist__15124 = cljs.core.cons.call(null, a, cljs.core.cons.call(null, b, cljs.core.cons.call(null, c, cljs.core.cons.call(null, d, cljs.core.spread.call(null, args)))));
      var fixed_arity__15125 = f.cljs$lang$maxFixedArity;
      if(cljs.core.truth_(f.cljs$lang$applyTo)) {
        var bc__15126 = cljs.core.bounded_count.call(null, arglist__15124, fixed_arity__15125 + 1);
        if(bc__15126 <= fixed_arity__15125) {
          return cljs.core.apply_to.call(null, f, bc__15126, arglist__15124)
        }else {
          return f.cljs$lang$applyTo(arglist__15124)
        }
      }else {
        return f.apply(f, cljs.core.to_array.call(null, arglist__15124))
      }
    };
    var G__15127 = function(f, a, b, c, d, var_args) {
      var args = null;
      if(goog.isDef(var_args)) {
        args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 5), 0)
      }
      return G__15127__delegate.call(this, f, a, b, c, d, args)
    };
    G__15127.cljs$lang$maxFixedArity = 5;
    G__15127.cljs$lang$applyTo = function(arglist__15128) {
      var f = cljs.core.first(arglist__15128);
      var a = cljs.core.first(cljs.core.next(arglist__15128));
      var b = cljs.core.first(cljs.core.next(cljs.core.next(arglist__15128)));
      var c = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__15128))));
      var d = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(cljs.core.next(arglist__15128)))));
      var args = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(cljs.core.next(arglist__15128)))));
      return G__15127__delegate(f, a, b, c, d, args)
    };
    G__15127.cljs$lang$arity$variadic = G__15127__delegate;
    return G__15127
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
  vary_meta.cljs$lang$applyTo = function(arglist__15129) {
    var obj = cljs.core.first(arglist__15129);
    var f = cljs.core.first(cljs.core.next(arglist__15129));
    var args = cljs.core.rest(cljs.core.next(arglist__15129));
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
    var G__15130__delegate = function(x, y, more) {
      return cljs.core.not.call(null, cljs.core.apply.call(null, cljs.core._EQ_, x, y, more))
    };
    var G__15130 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__15130__delegate.call(this, x, y, more)
    };
    G__15130.cljs$lang$maxFixedArity = 2;
    G__15130.cljs$lang$applyTo = function(arglist__15131) {
      var x = cljs.core.first(arglist__15131);
      var y = cljs.core.first(cljs.core.next(arglist__15131));
      var more = cljs.core.rest(cljs.core.next(arglist__15131));
      return G__15130__delegate(x, y, more)
    };
    G__15130.cljs$lang$arity$variadic = G__15130__delegate;
    return G__15130
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
        var G__15132 = pred;
        var G__15133 = cljs.core.next.call(null, coll);
        pred = G__15132;
        coll = G__15133;
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
      var or__3824__auto____15135 = pred.call(null, cljs.core.first.call(null, coll));
      if(cljs.core.truth_(or__3824__auto____15135)) {
        return or__3824__auto____15135
      }else {
        var G__15136 = pred;
        var G__15137 = cljs.core.next.call(null, coll);
        pred = G__15136;
        coll = G__15137;
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
    var G__15138 = null;
    var G__15138__0 = function() {
      return cljs.core.not.call(null, f.call(null))
    };
    var G__15138__1 = function(x) {
      return cljs.core.not.call(null, f.call(null, x))
    };
    var G__15138__2 = function(x, y) {
      return cljs.core.not.call(null, f.call(null, x, y))
    };
    var G__15138__3 = function() {
      var G__15139__delegate = function(x, y, zs) {
        return cljs.core.not.call(null, cljs.core.apply.call(null, f, x, y, zs))
      };
      var G__15139 = function(x, y, var_args) {
        var zs = null;
        if(goog.isDef(var_args)) {
          zs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
        }
        return G__15139__delegate.call(this, x, y, zs)
      };
      G__15139.cljs$lang$maxFixedArity = 2;
      G__15139.cljs$lang$applyTo = function(arglist__15140) {
        var x = cljs.core.first(arglist__15140);
        var y = cljs.core.first(cljs.core.next(arglist__15140));
        var zs = cljs.core.rest(cljs.core.next(arglist__15140));
        return G__15139__delegate(x, y, zs)
      };
      G__15139.cljs$lang$arity$variadic = G__15139__delegate;
      return G__15139
    }();
    G__15138 = function(x, y, var_args) {
      var zs = var_args;
      switch(arguments.length) {
        case 0:
          return G__15138__0.call(this);
        case 1:
          return G__15138__1.call(this, x);
        case 2:
          return G__15138__2.call(this, x, y);
        default:
          return G__15138__3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
      }
      throw"Invalid arity: " + arguments.length;
    };
    G__15138.cljs$lang$maxFixedArity = 2;
    G__15138.cljs$lang$applyTo = G__15138__3.cljs$lang$applyTo;
    return G__15138
  }()
};
cljs.core.constantly = function constantly(x) {
  return function() {
    var G__15141__delegate = function(args) {
      return x
    };
    var G__15141 = function(var_args) {
      var args = null;
      if(goog.isDef(var_args)) {
        args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
      }
      return G__15141__delegate.call(this, args)
    };
    G__15141.cljs$lang$maxFixedArity = 0;
    G__15141.cljs$lang$applyTo = function(arglist__15142) {
      var args = cljs.core.seq(arglist__15142);
      return G__15141__delegate(args)
    };
    G__15141.cljs$lang$arity$variadic = G__15141__delegate;
    return G__15141
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
      var G__15149 = null;
      var G__15149__0 = function() {
        return f.call(null, g.call(null))
      };
      var G__15149__1 = function(x) {
        return f.call(null, g.call(null, x))
      };
      var G__15149__2 = function(x, y) {
        return f.call(null, g.call(null, x, y))
      };
      var G__15149__3 = function(x, y, z) {
        return f.call(null, g.call(null, x, y, z))
      };
      var G__15149__4 = function() {
        var G__15150__delegate = function(x, y, z, args) {
          return f.call(null, cljs.core.apply.call(null, g, x, y, z, args))
        };
        var G__15150 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__15150__delegate.call(this, x, y, z, args)
        };
        G__15150.cljs$lang$maxFixedArity = 3;
        G__15150.cljs$lang$applyTo = function(arglist__15151) {
          var x = cljs.core.first(arglist__15151);
          var y = cljs.core.first(cljs.core.next(arglist__15151));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__15151)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__15151)));
          return G__15150__delegate(x, y, z, args)
        };
        G__15150.cljs$lang$arity$variadic = G__15150__delegate;
        return G__15150
      }();
      G__15149 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__15149__0.call(this);
          case 1:
            return G__15149__1.call(this, x);
          case 2:
            return G__15149__2.call(this, x, y);
          case 3:
            return G__15149__3.call(this, x, y, z);
          default:
            return G__15149__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__15149.cljs$lang$maxFixedArity = 3;
      G__15149.cljs$lang$applyTo = G__15149__4.cljs$lang$applyTo;
      return G__15149
    }()
  };
  var comp__3 = function(f, g, h) {
    return function() {
      var G__15152 = null;
      var G__15152__0 = function() {
        return f.call(null, g.call(null, h.call(null)))
      };
      var G__15152__1 = function(x) {
        return f.call(null, g.call(null, h.call(null, x)))
      };
      var G__15152__2 = function(x, y) {
        return f.call(null, g.call(null, h.call(null, x, y)))
      };
      var G__15152__3 = function(x, y, z) {
        return f.call(null, g.call(null, h.call(null, x, y, z)))
      };
      var G__15152__4 = function() {
        var G__15153__delegate = function(x, y, z, args) {
          return f.call(null, g.call(null, cljs.core.apply.call(null, h, x, y, z, args)))
        };
        var G__15153 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__15153__delegate.call(this, x, y, z, args)
        };
        G__15153.cljs$lang$maxFixedArity = 3;
        G__15153.cljs$lang$applyTo = function(arglist__15154) {
          var x = cljs.core.first(arglist__15154);
          var y = cljs.core.first(cljs.core.next(arglist__15154));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__15154)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__15154)));
          return G__15153__delegate(x, y, z, args)
        };
        G__15153.cljs$lang$arity$variadic = G__15153__delegate;
        return G__15153
      }();
      G__15152 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__15152__0.call(this);
          case 1:
            return G__15152__1.call(this, x);
          case 2:
            return G__15152__2.call(this, x, y);
          case 3:
            return G__15152__3.call(this, x, y, z);
          default:
            return G__15152__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__15152.cljs$lang$maxFixedArity = 3;
      G__15152.cljs$lang$applyTo = G__15152__4.cljs$lang$applyTo;
      return G__15152
    }()
  };
  var comp__4 = function() {
    var G__15155__delegate = function(f1, f2, f3, fs) {
      var fs__15146 = cljs.core.reverse.call(null, cljs.core.list_STAR_.call(null, f1, f2, f3, fs));
      return function() {
        var G__15156__delegate = function(args) {
          var ret__15147 = cljs.core.apply.call(null, cljs.core.first.call(null, fs__15146), args);
          var fs__15148 = cljs.core.next.call(null, fs__15146);
          while(true) {
            if(fs__15148) {
              var G__15157 = cljs.core.first.call(null, fs__15148).call(null, ret__15147);
              var G__15158 = cljs.core.next.call(null, fs__15148);
              ret__15147 = G__15157;
              fs__15148 = G__15158;
              continue
            }else {
              return ret__15147
            }
            break
          }
        };
        var G__15156 = function(var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
          }
          return G__15156__delegate.call(this, args)
        };
        G__15156.cljs$lang$maxFixedArity = 0;
        G__15156.cljs$lang$applyTo = function(arglist__15159) {
          var args = cljs.core.seq(arglist__15159);
          return G__15156__delegate(args)
        };
        G__15156.cljs$lang$arity$variadic = G__15156__delegate;
        return G__15156
      }()
    };
    var G__15155 = function(f1, f2, f3, var_args) {
      var fs = null;
      if(goog.isDef(var_args)) {
        fs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__15155__delegate.call(this, f1, f2, f3, fs)
    };
    G__15155.cljs$lang$maxFixedArity = 3;
    G__15155.cljs$lang$applyTo = function(arglist__15160) {
      var f1 = cljs.core.first(arglist__15160);
      var f2 = cljs.core.first(cljs.core.next(arglist__15160));
      var f3 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__15160)));
      var fs = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__15160)));
      return G__15155__delegate(f1, f2, f3, fs)
    };
    G__15155.cljs$lang$arity$variadic = G__15155__delegate;
    return G__15155
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
      var G__15161__delegate = function(args) {
        return cljs.core.apply.call(null, f, arg1, args)
      };
      var G__15161 = function(var_args) {
        var args = null;
        if(goog.isDef(var_args)) {
          args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
        }
        return G__15161__delegate.call(this, args)
      };
      G__15161.cljs$lang$maxFixedArity = 0;
      G__15161.cljs$lang$applyTo = function(arglist__15162) {
        var args = cljs.core.seq(arglist__15162);
        return G__15161__delegate(args)
      };
      G__15161.cljs$lang$arity$variadic = G__15161__delegate;
      return G__15161
    }()
  };
  var partial__3 = function(f, arg1, arg2) {
    return function() {
      var G__15163__delegate = function(args) {
        return cljs.core.apply.call(null, f, arg1, arg2, args)
      };
      var G__15163 = function(var_args) {
        var args = null;
        if(goog.isDef(var_args)) {
          args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
        }
        return G__15163__delegate.call(this, args)
      };
      G__15163.cljs$lang$maxFixedArity = 0;
      G__15163.cljs$lang$applyTo = function(arglist__15164) {
        var args = cljs.core.seq(arglist__15164);
        return G__15163__delegate(args)
      };
      G__15163.cljs$lang$arity$variadic = G__15163__delegate;
      return G__15163
    }()
  };
  var partial__4 = function(f, arg1, arg2, arg3) {
    return function() {
      var G__15165__delegate = function(args) {
        return cljs.core.apply.call(null, f, arg1, arg2, arg3, args)
      };
      var G__15165 = function(var_args) {
        var args = null;
        if(goog.isDef(var_args)) {
          args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
        }
        return G__15165__delegate.call(this, args)
      };
      G__15165.cljs$lang$maxFixedArity = 0;
      G__15165.cljs$lang$applyTo = function(arglist__15166) {
        var args = cljs.core.seq(arglist__15166);
        return G__15165__delegate(args)
      };
      G__15165.cljs$lang$arity$variadic = G__15165__delegate;
      return G__15165
    }()
  };
  var partial__5 = function() {
    var G__15167__delegate = function(f, arg1, arg2, arg3, more) {
      return function() {
        var G__15168__delegate = function(args) {
          return cljs.core.apply.call(null, f, arg1, arg2, arg3, cljs.core.concat.call(null, more, args))
        };
        var G__15168 = function(var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
          }
          return G__15168__delegate.call(this, args)
        };
        G__15168.cljs$lang$maxFixedArity = 0;
        G__15168.cljs$lang$applyTo = function(arglist__15169) {
          var args = cljs.core.seq(arglist__15169);
          return G__15168__delegate(args)
        };
        G__15168.cljs$lang$arity$variadic = G__15168__delegate;
        return G__15168
      }()
    };
    var G__15167 = function(f, arg1, arg2, arg3, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 4), 0)
      }
      return G__15167__delegate.call(this, f, arg1, arg2, arg3, more)
    };
    G__15167.cljs$lang$maxFixedArity = 4;
    G__15167.cljs$lang$applyTo = function(arglist__15170) {
      var f = cljs.core.first(arglist__15170);
      var arg1 = cljs.core.first(cljs.core.next(arglist__15170));
      var arg2 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__15170)));
      var arg3 = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__15170))));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(arglist__15170))));
      return G__15167__delegate(f, arg1, arg2, arg3, more)
    };
    G__15167.cljs$lang$arity$variadic = G__15167__delegate;
    return G__15167
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
      var G__15171 = null;
      var G__15171__1 = function(a) {
        return f.call(null, a == null ? x : a)
      };
      var G__15171__2 = function(a, b) {
        return f.call(null, a == null ? x : a, b)
      };
      var G__15171__3 = function(a, b, c) {
        return f.call(null, a == null ? x : a, b, c)
      };
      var G__15171__4 = function() {
        var G__15172__delegate = function(a, b, c, ds) {
          return cljs.core.apply.call(null, f, a == null ? x : a, b, c, ds)
        };
        var G__15172 = function(a, b, c, var_args) {
          var ds = null;
          if(goog.isDef(var_args)) {
            ds = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__15172__delegate.call(this, a, b, c, ds)
        };
        G__15172.cljs$lang$maxFixedArity = 3;
        G__15172.cljs$lang$applyTo = function(arglist__15173) {
          var a = cljs.core.first(arglist__15173);
          var b = cljs.core.first(cljs.core.next(arglist__15173));
          var c = cljs.core.first(cljs.core.next(cljs.core.next(arglist__15173)));
          var ds = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__15173)));
          return G__15172__delegate(a, b, c, ds)
        };
        G__15172.cljs$lang$arity$variadic = G__15172__delegate;
        return G__15172
      }();
      G__15171 = function(a, b, c, var_args) {
        var ds = var_args;
        switch(arguments.length) {
          case 1:
            return G__15171__1.call(this, a);
          case 2:
            return G__15171__2.call(this, a, b);
          case 3:
            return G__15171__3.call(this, a, b, c);
          default:
            return G__15171__4.cljs$lang$arity$variadic(a, b, c, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__15171.cljs$lang$maxFixedArity = 3;
      G__15171.cljs$lang$applyTo = G__15171__4.cljs$lang$applyTo;
      return G__15171
    }()
  };
  var fnil__3 = function(f, x, y) {
    return function() {
      var G__15174 = null;
      var G__15174__2 = function(a, b) {
        return f.call(null, a == null ? x : a, b == null ? y : b)
      };
      var G__15174__3 = function(a, b, c) {
        return f.call(null, a == null ? x : a, b == null ? y : b, c)
      };
      var G__15174__4 = function() {
        var G__15175__delegate = function(a, b, c, ds) {
          return cljs.core.apply.call(null, f, a == null ? x : a, b == null ? y : b, c, ds)
        };
        var G__15175 = function(a, b, c, var_args) {
          var ds = null;
          if(goog.isDef(var_args)) {
            ds = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__15175__delegate.call(this, a, b, c, ds)
        };
        G__15175.cljs$lang$maxFixedArity = 3;
        G__15175.cljs$lang$applyTo = function(arglist__15176) {
          var a = cljs.core.first(arglist__15176);
          var b = cljs.core.first(cljs.core.next(arglist__15176));
          var c = cljs.core.first(cljs.core.next(cljs.core.next(arglist__15176)));
          var ds = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__15176)));
          return G__15175__delegate(a, b, c, ds)
        };
        G__15175.cljs$lang$arity$variadic = G__15175__delegate;
        return G__15175
      }();
      G__15174 = function(a, b, c, var_args) {
        var ds = var_args;
        switch(arguments.length) {
          case 2:
            return G__15174__2.call(this, a, b);
          case 3:
            return G__15174__3.call(this, a, b, c);
          default:
            return G__15174__4.cljs$lang$arity$variadic(a, b, c, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__15174.cljs$lang$maxFixedArity = 3;
      G__15174.cljs$lang$applyTo = G__15174__4.cljs$lang$applyTo;
      return G__15174
    }()
  };
  var fnil__4 = function(f, x, y, z) {
    return function() {
      var G__15177 = null;
      var G__15177__2 = function(a, b) {
        return f.call(null, a == null ? x : a, b == null ? y : b)
      };
      var G__15177__3 = function(a, b, c) {
        return f.call(null, a == null ? x : a, b == null ? y : b, c == null ? z : c)
      };
      var G__15177__4 = function() {
        var G__15178__delegate = function(a, b, c, ds) {
          return cljs.core.apply.call(null, f, a == null ? x : a, b == null ? y : b, c == null ? z : c, ds)
        };
        var G__15178 = function(a, b, c, var_args) {
          var ds = null;
          if(goog.isDef(var_args)) {
            ds = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__15178__delegate.call(this, a, b, c, ds)
        };
        G__15178.cljs$lang$maxFixedArity = 3;
        G__15178.cljs$lang$applyTo = function(arglist__15179) {
          var a = cljs.core.first(arglist__15179);
          var b = cljs.core.first(cljs.core.next(arglist__15179));
          var c = cljs.core.first(cljs.core.next(cljs.core.next(arglist__15179)));
          var ds = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__15179)));
          return G__15178__delegate(a, b, c, ds)
        };
        G__15178.cljs$lang$arity$variadic = G__15178__delegate;
        return G__15178
      }();
      G__15177 = function(a, b, c, var_args) {
        var ds = var_args;
        switch(arguments.length) {
          case 2:
            return G__15177__2.call(this, a, b);
          case 3:
            return G__15177__3.call(this, a, b, c);
          default:
            return G__15177__4.cljs$lang$arity$variadic(a, b, c, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__15177.cljs$lang$maxFixedArity = 3;
      G__15177.cljs$lang$applyTo = G__15177__4.cljs$lang$applyTo;
      return G__15177
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
  var mapi__15195 = function mapi(idx, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3974__auto____15203 = cljs.core.seq.call(null, coll);
      if(temp__3974__auto____15203) {
        var s__15204 = temp__3974__auto____15203;
        if(cljs.core.chunked_seq_QMARK_.call(null, s__15204)) {
          var c__15205 = cljs.core.chunk_first.call(null, s__15204);
          var size__15206 = cljs.core.count.call(null, c__15205);
          var b__15207 = cljs.core.chunk_buffer.call(null, size__15206);
          var n__2529__auto____15208 = size__15206;
          var i__15209 = 0;
          while(true) {
            if(i__15209 < n__2529__auto____15208) {
              cljs.core.chunk_append.call(null, b__15207, f.call(null, idx + i__15209, cljs.core._nth.call(null, c__15205, i__15209)));
              var G__15210 = i__15209 + 1;
              i__15209 = G__15210;
              continue
            }else {
            }
            break
          }
          return cljs.core.chunk_cons.call(null, cljs.core.chunk.call(null, b__15207), mapi.call(null, idx + size__15206, cljs.core.chunk_rest.call(null, s__15204)))
        }else {
          return cljs.core.cons.call(null, f.call(null, idx, cljs.core.first.call(null, s__15204)), mapi.call(null, idx + 1, cljs.core.rest.call(null, s__15204)))
        }
      }else {
        return null
      }
    }, null)
  };
  return mapi__15195.call(null, 0, coll)
};
cljs.core.keep = function keep(f, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__3974__auto____15220 = cljs.core.seq.call(null, coll);
    if(temp__3974__auto____15220) {
      var s__15221 = temp__3974__auto____15220;
      if(cljs.core.chunked_seq_QMARK_.call(null, s__15221)) {
        var c__15222 = cljs.core.chunk_first.call(null, s__15221);
        var size__15223 = cljs.core.count.call(null, c__15222);
        var b__15224 = cljs.core.chunk_buffer.call(null, size__15223);
        var n__2529__auto____15225 = size__15223;
        var i__15226 = 0;
        while(true) {
          if(i__15226 < n__2529__auto____15225) {
            var x__15227 = f.call(null, cljs.core._nth.call(null, c__15222, i__15226));
            if(x__15227 == null) {
            }else {
              cljs.core.chunk_append.call(null, b__15224, x__15227)
            }
            var G__15229 = i__15226 + 1;
            i__15226 = G__15229;
            continue
          }else {
          }
          break
        }
        return cljs.core.chunk_cons.call(null, cljs.core.chunk.call(null, b__15224), keep.call(null, f, cljs.core.chunk_rest.call(null, s__15221)))
      }else {
        var x__15228 = f.call(null, cljs.core.first.call(null, s__15221));
        if(x__15228 == null) {
          return keep.call(null, f, cljs.core.rest.call(null, s__15221))
        }else {
          return cljs.core.cons.call(null, x__15228, keep.call(null, f, cljs.core.rest.call(null, s__15221)))
        }
      }
    }else {
      return null
    }
  }, null)
};
cljs.core.keep_indexed = function keep_indexed(f, coll) {
  var keepi__15255 = function keepi(idx, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3974__auto____15265 = cljs.core.seq.call(null, coll);
      if(temp__3974__auto____15265) {
        var s__15266 = temp__3974__auto____15265;
        if(cljs.core.chunked_seq_QMARK_.call(null, s__15266)) {
          var c__15267 = cljs.core.chunk_first.call(null, s__15266);
          var size__15268 = cljs.core.count.call(null, c__15267);
          var b__15269 = cljs.core.chunk_buffer.call(null, size__15268);
          var n__2529__auto____15270 = size__15268;
          var i__15271 = 0;
          while(true) {
            if(i__15271 < n__2529__auto____15270) {
              var x__15272 = f.call(null, idx + i__15271, cljs.core._nth.call(null, c__15267, i__15271));
              if(x__15272 == null) {
              }else {
                cljs.core.chunk_append.call(null, b__15269, x__15272)
              }
              var G__15274 = i__15271 + 1;
              i__15271 = G__15274;
              continue
            }else {
            }
            break
          }
          return cljs.core.chunk_cons.call(null, cljs.core.chunk.call(null, b__15269), keepi.call(null, idx + size__15268, cljs.core.chunk_rest.call(null, s__15266)))
        }else {
          var x__15273 = f.call(null, idx, cljs.core.first.call(null, s__15266));
          if(x__15273 == null) {
            return keepi.call(null, idx + 1, cljs.core.rest.call(null, s__15266))
          }else {
            return cljs.core.cons.call(null, x__15273, keepi.call(null, idx + 1, cljs.core.rest.call(null, s__15266)))
          }
        }
      }else {
        return null
      }
    }, null)
  };
  return keepi__15255.call(null, 0, coll)
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
          var and__3822__auto____15360 = p.call(null, x);
          if(cljs.core.truth_(and__3822__auto____15360)) {
            return p.call(null, y)
          }else {
            return and__3822__auto____15360
          }
        }())
      };
      var ep1__3 = function(x, y, z) {
        return cljs.core.boolean$.call(null, function() {
          var and__3822__auto____15361 = p.call(null, x);
          if(cljs.core.truth_(and__3822__auto____15361)) {
            var and__3822__auto____15362 = p.call(null, y);
            if(cljs.core.truth_(and__3822__auto____15362)) {
              return p.call(null, z)
            }else {
              return and__3822__auto____15362
            }
          }else {
            return and__3822__auto____15361
          }
        }())
      };
      var ep1__4 = function() {
        var G__15431__delegate = function(x, y, z, args) {
          return cljs.core.boolean$.call(null, function() {
            var and__3822__auto____15363 = ep1.call(null, x, y, z);
            if(cljs.core.truth_(and__3822__auto____15363)) {
              return cljs.core.every_QMARK_.call(null, p, args)
            }else {
              return and__3822__auto____15363
            }
          }())
        };
        var G__15431 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__15431__delegate.call(this, x, y, z, args)
        };
        G__15431.cljs$lang$maxFixedArity = 3;
        G__15431.cljs$lang$applyTo = function(arglist__15432) {
          var x = cljs.core.first(arglist__15432);
          var y = cljs.core.first(cljs.core.next(arglist__15432));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__15432)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__15432)));
          return G__15431__delegate(x, y, z, args)
        };
        G__15431.cljs$lang$arity$variadic = G__15431__delegate;
        return G__15431
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
          var and__3822__auto____15375 = p1.call(null, x);
          if(cljs.core.truth_(and__3822__auto____15375)) {
            return p2.call(null, x)
          }else {
            return and__3822__auto____15375
          }
        }())
      };
      var ep2__2 = function(x, y) {
        return cljs.core.boolean$.call(null, function() {
          var and__3822__auto____15376 = p1.call(null, x);
          if(cljs.core.truth_(and__3822__auto____15376)) {
            var and__3822__auto____15377 = p1.call(null, y);
            if(cljs.core.truth_(and__3822__auto____15377)) {
              var and__3822__auto____15378 = p2.call(null, x);
              if(cljs.core.truth_(and__3822__auto____15378)) {
                return p2.call(null, y)
              }else {
                return and__3822__auto____15378
              }
            }else {
              return and__3822__auto____15377
            }
          }else {
            return and__3822__auto____15376
          }
        }())
      };
      var ep2__3 = function(x, y, z) {
        return cljs.core.boolean$.call(null, function() {
          var and__3822__auto____15379 = p1.call(null, x);
          if(cljs.core.truth_(and__3822__auto____15379)) {
            var and__3822__auto____15380 = p1.call(null, y);
            if(cljs.core.truth_(and__3822__auto____15380)) {
              var and__3822__auto____15381 = p1.call(null, z);
              if(cljs.core.truth_(and__3822__auto____15381)) {
                var and__3822__auto____15382 = p2.call(null, x);
                if(cljs.core.truth_(and__3822__auto____15382)) {
                  var and__3822__auto____15383 = p2.call(null, y);
                  if(cljs.core.truth_(and__3822__auto____15383)) {
                    return p2.call(null, z)
                  }else {
                    return and__3822__auto____15383
                  }
                }else {
                  return and__3822__auto____15382
                }
              }else {
                return and__3822__auto____15381
              }
            }else {
              return and__3822__auto____15380
            }
          }else {
            return and__3822__auto____15379
          }
        }())
      };
      var ep2__4 = function() {
        var G__15433__delegate = function(x, y, z, args) {
          return cljs.core.boolean$.call(null, function() {
            var and__3822__auto____15384 = ep2.call(null, x, y, z);
            if(cljs.core.truth_(and__3822__auto____15384)) {
              return cljs.core.every_QMARK_.call(null, function(p1__15230_SHARP_) {
                var and__3822__auto____15385 = p1.call(null, p1__15230_SHARP_);
                if(cljs.core.truth_(and__3822__auto____15385)) {
                  return p2.call(null, p1__15230_SHARP_)
                }else {
                  return and__3822__auto____15385
                }
              }, args)
            }else {
              return and__3822__auto____15384
            }
          }())
        };
        var G__15433 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__15433__delegate.call(this, x, y, z, args)
        };
        G__15433.cljs$lang$maxFixedArity = 3;
        G__15433.cljs$lang$applyTo = function(arglist__15434) {
          var x = cljs.core.first(arglist__15434);
          var y = cljs.core.first(cljs.core.next(arglist__15434));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__15434)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__15434)));
          return G__15433__delegate(x, y, z, args)
        };
        G__15433.cljs$lang$arity$variadic = G__15433__delegate;
        return G__15433
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
          var and__3822__auto____15404 = p1.call(null, x);
          if(cljs.core.truth_(and__3822__auto____15404)) {
            var and__3822__auto____15405 = p2.call(null, x);
            if(cljs.core.truth_(and__3822__auto____15405)) {
              return p3.call(null, x)
            }else {
              return and__3822__auto____15405
            }
          }else {
            return and__3822__auto____15404
          }
        }())
      };
      var ep3__2 = function(x, y) {
        return cljs.core.boolean$.call(null, function() {
          var and__3822__auto____15406 = p1.call(null, x);
          if(cljs.core.truth_(and__3822__auto____15406)) {
            var and__3822__auto____15407 = p2.call(null, x);
            if(cljs.core.truth_(and__3822__auto____15407)) {
              var and__3822__auto____15408 = p3.call(null, x);
              if(cljs.core.truth_(and__3822__auto____15408)) {
                var and__3822__auto____15409 = p1.call(null, y);
                if(cljs.core.truth_(and__3822__auto____15409)) {
                  var and__3822__auto____15410 = p2.call(null, y);
                  if(cljs.core.truth_(and__3822__auto____15410)) {
                    return p3.call(null, y)
                  }else {
                    return and__3822__auto____15410
                  }
                }else {
                  return and__3822__auto____15409
                }
              }else {
                return and__3822__auto____15408
              }
            }else {
              return and__3822__auto____15407
            }
          }else {
            return and__3822__auto____15406
          }
        }())
      };
      var ep3__3 = function(x, y, z) {
        return cljs.core.boolean$.call(null, function() {
          var and__3822__auto____15411 = p1.call(null, x);
          if(cljs.core.truth_(and__3822__auto____15411)) {
            var and__3822__auto____15412 = p2.call(null, x);
            if(cljs.core.truth_(and__3822__auto____15412)) {
              var and__3822__auto____15413 = p3.call(null, x);
              if(cljs.core.truth_(and__3822__auto____15413)) {
                var and__3822__auto____15414 = p1.call(null, y);
                if(cljs.core.truth_(and__3822__auto____15414)) {
                  var and__3822__auto____15415 = p2.call(null, y);
                  if(cljs.core.truth_(and__3822__auto____15415)) {
                    var and__3822__auto____15416 = p3.call(null, y);
                    if(cljs.core.truth_(and__3822__auto____15416)) {
                      var and__3822__auto____15417 = p1.call(null, z);
                      if(cljs.core.truth_(and__3822__auto____15417)) {
                        var and__3822__auto____15418 = p2.call(null, z);
                        if(cljs.core.truth_(and__3822__auto____15418)) {
                          return p3.call(null, z)
                        }else {
                          return and__3822__auto____15418
                        }
                      }else {
                        return and__3822__auto____15417
                      }
                    }else {
                      return and__3822__auto____15416
                    }
                  }else {
                    return and__3822__auto____15415
                  }
                }else {
                  return and__3822__auto____15414
                }
              }else {
                return and__3822__auto____15413
              }
            }else {
              return and__3822__auto____15412
            }
          }else {
            return and__3822__auto____15411
          }
        }())
      };
      var ep3__4 = function() {
        var G__15435__delegate = function(x, y, z, args) {
          return cljs.core.boolean$.call(null, function() {
            var and__3822__auto____15419 = ep3.call(null, x, y, z);
            if(cljs.core.truth_(and__3822__auto____15419)) {
              return cljs.core.every_QMARK_.call(null, function(p1__15231_SHARP_) {
                var and__3822__auto____15420 = p1.call(null, p1__15231_SHARP_);
                if(cljs.core.truth_(and__3822__auto____15420)) {
                  var and__3822__auto____15421 = p2.call(null, p1__15231_SHARP_);
                  if(cljs.core.truth_(and__3822__auto____15421)) {
                    return p3.call(null, p1__15231_SHARP_)
                  }else {
                    return and__3822__auto____15421
                  }
                }else {
                  return and__3822__auto____15420
                }
              }, args)
            }else {
              return and__3822__auto____15419
            }
          }())
        };
        var G__15435 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__15435__delegate.call(this, x, y, z, args)
        };
        G__15435.cljs$lang$maxFixedArity = 3;
        G__15435.cljs$lang$applyTo = function(arglist__15436) {
          var x = cljs.core.first(arglist__15436);
          var y = cljs.core.first(cljs.core.next(arglist__15436));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__15436)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__15436)));
          return G__15435__delegate(x, y, z, args)
        };
        G__15435.cljs$lang$arity$variadic = G__15435__delegate;
        return G__15435
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
    var G__15437__delegate = function(p1, p2, p3, ps) {
      var ps__15422 = cljs.core.list_STAR_.call(null, p1, p2, p3, ps);
      return function() {
        var epn = null;
        var epn__0 = function() {
          return true
        };
        var epn__1 = function(x) {
          return cljs.core.every_QMARK_.call(null, function(p1__15232_SHARP_) {
            return p1__15232_SHARP_.call(null, x)
          }, ps__15422)
        };
        var epn__2 = function(x, y) {
          return cljs.core.every_QMARK_.call(null, function(p1__15233_SHARP_) {
            var and__3822__auto____15427 = p1__15233_SHARP_.call(null, x);
            if(cljs.core.truth_(and__3822__auto____15427)) {
              return p1__15233_SHARP_.call(null, y)
            }else {
              return and__3822__auto____15427
            }
          }, ps__15422)
        };
        var epn__3 = function(x, y, z) {
          return cljs.core.every_QMARK_.call(null, function(p1__15234_SHARP_) {
            var and__3822__auto____15428 = p1__15234_SHARP_.call(null, x);
            if(cljs.core.truth_(and__3822__auto____15428)) {
              var and__3822__auto____15429 = p1__15234_SHARP_.call(null, y);
              if(cljs.core.truth_(and__3822__auto____15429)) {
                return p1__15234_SHARP_.call(null, z)
              }else {
                return and__3822__auto____15429
              }
            }else {
              return and__3822__auto____15428
            }
          }, ps__15422)
        };
        var epn__4 = function() {
          var G__15438__delegate = function(x, y, z, args) {
            return cljs.core.boolean$.call(null, function() {
              var and__3822__auto____15430 = epn.call(null, x, y, z);
              if(cljs.core.truth_(and__3822__auto____15430)) {
                return cljs.core.every_QMARK_.call(null, function(p1__15235_SHARP_) {
                  return cljs.core.every_QMARK_.call(null, p1__15235_SHARP_, args)
                }, ps__15422)
              }else {
                return and__3822__auto____15430
              }
            }())
          };
          var G__15438 = function(x, y, z, var_args) {
            var args = null;
            if(goog.isDef(var_args)) {
              args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
            }
            return G__15438__delegate.call(this, x, y, z, args)
          };
          G__15438.cljs$lang$maxFixedArity = 3;
          G__15438.cljs$lang$applyTo = function(arglist__15439) {
            var x = cljs.core.first(arglist__15439);
            var y = cljs.core.first(cljs.core.next(arglist__15439));
            var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__15439)));
            var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__15439)));
            return G__15438__delegate(x, y, z, args)
          };
          G__15438.cljs$lang$arity$variadic = G__15438__delegate;
          return G__15438
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
    var G__15437 = function(p1, p2, p3, var_args) {
      var ps = null;
      if(goog.isDef(var_args)) {
        ps = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__15437__delegate.call(this, p1, p2, p3, ps)
    };
    G__15437.cljs$lang$maxFixedArity = 3;
    G__15437.cljs$lang$applyTo = function(arglist__15440) {
      var p1 = cljs.core.first(arglist__15440);
      var p2 = cljs.core.first(cljs.core.next(arglist__15440));
      var p3 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__15440)));
      var ps = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__15440)));
      return G__15437__delegate(p1, p2, p3, ps)
    };
    G__15437.cljs$lang$arity$variadic = G__15437__delegate;
    return G__15437
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
        var or__3824__auto____15521 = p.call(null, x);
        if(cljs.core.truth_(or__3824__auto____15521)) {
          return or__3824__auto____15521
        }else {
          return p.call(null, y)
        }
      };
      var sp1__3 = function(x, y, z) {
        var or__3824__auto____15522 = p.call(null, x);
        if(cljs.core.truth_(or__3824__auto____15522)) {
          return or__3824__auto____15522
        }else {
          var or__3824__auto____15523 = p.call(null, y);
          if(cljs.core.truth_(or__3824__auto____15523)) {
            return or__3824__auto____15523
          }else {
            return p.call(null, z)
          }
        }
      };
      var sp1__4 = function() {
        var G__15592__delegate = function(x, y, z, args) {
          var or__3824__auto____15524 = sp1.call(null, x, y, z);
          if(cljs.core.truth_(or__3824__auto____15524)) {
            return or__3824__auto____15524
          }else {
            return cljs.core.some.call(null, p, args)
          }
        };
        var G__15592 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__15592__delegate.call(this, x, y, z, args)
        };
        G__15592.cljs$lang$maxFixedArity = 3;
        G__15592.cljs$lang$applyTo = function(arglist__15593) {
          var x = cljs.core.first(arglist__15593);
          var y = cljs.core.first(cljs.core.next(arglist__15593));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__15593)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__15593)));
          return G__15592__delegate(x, y, z, args)
        };
        G__15592.cljs$lang$arity$variadic = G__15592__delegate;
        return G__15592
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
        var or__3824__auto____15536 = p1.call(null, x);
        if(cljs.core.truth_(or__3824__auto____15536)) {
          return or__3824__auto____15536
        }else {
          return p2.call(null, x)
        }
      };
      var sp2__2 = function(x, y) {
        var or__3824__auto____15537 = p1.call(null, x);
        if(cljs.core.truth_(or__3824__auto____15537)) {
          return or__3824__auto____15537
        }else {
          var or__3824__auto____15538 = p1.call(null, y);
          if(cljs.core.truth_(or__3824__auto____15538)) {
            return or__3824__auto____15538
          }else {
            var or__3824__auto____15539 = p2.call(null, x);
            if(cljs.core.truth_(or__3824__auto____15539)) {
              return or__3824__auto____15539
            }else {
              return p2.call(null, y)
            }
          }
        }
      };
      var sp2__3 = function(x, y, z) {
        var or__3824__auto____15540 = p1.call(null, x);
        if(cljs.core.truth_(or__3824__auto____15540)) {
          return or__3824__auto____15540
        }else {
          var or__3824__auto____15541 = p1.call(null, y);
          if(cljs.core.truth_(or__3824__auto____15541)) {
            return or__3824__auto____15541
          }else {
            var or__3824__auto____15542 = p1.call(null, z);
            if(cljs.core.truth_(or__3824__auto____15542)) {
              return or__3824__auto____15542
            }else {
              var or__3824__auto____15543 = p2.call(null, x);
              if(cljs.core.truth_(or__3824__auto____15543)) {
                return or__3824__auto____15543
              }else {
                var or__3824__auto____15544 = p2.call(null, y);
                if(cljs.core.truth_(or__3824__auto____15544)) {
                  return or__3824__auto____15544
                }else {
                  return p2.call(null, z)
                }
              }
            }
          }
        }
      };
      var sp2__4 = function() {
        var G__15594__delegate = function(x, y, z, args) {
          var or__3824__auto____15545 = sp2.call(null, x, y, z);
          if(cljs.core.truth_(or__3824__auto____15545)) {
            return or__3824__auto____15545
          }else {
            return cljs.core.some.call(null, function(p1__15275_SHARP_) {
              var or__3824__auto____15546 = p1.call(null, p1__15275_SHARP_);
              if(cljs.core.truth_(or__3824__auto____15546)) {
                return or__3824__auto____15546
              }else {
                return p2.call(null, p1__15275_SHARP_)
              }
            }, args)
          }
        };
        var G__15594 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__15594__delegate.call(this, x, y, z, args)
        };
        G__15594.cljs$lang$maxFixedArity = 3;
        G__15594.cljs$lang$applyTo = function(arglist__15595) {
          var x = cljs.core.first(arglist__15595);
          var y = cljs.core.first(cljs.core.next(arglist__15595));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__15595)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__15595)));
          return G__15594__delegate(x, y, z, args)
        };
        G__15594.cljs$lang$arity$variadic = G__15594__delegate;
        return G__15594
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
        var or__3824__auto____15565 = p1.call(null, x);
        if(cljs.core.truth_(or__3824__auto____15565)) {
          return or__3824__auto____15565
        }else {
          var or__3824__auto____15566 = p2.call(null, x);
          if(cljs.core.truth_(or__3824__auto____15566)) {
            return or__3824__auto____15566
          }else {
            return p3.call(null, x)
          }
        }
      };
      var sp3__2 = function(x, y) {
        var or__3824__auto____15567 = p1.call(null, x);
        if(cljs.core.truth_(or__3824__auto____15567)) {
          return or__3824__auto____15567
        }else {
          var or__3824__auto____15568 = p2.call(null, x);
          if(cljs.core.truth_(or__3824__auto____15568)) {
            return or__3824__auto____15568
          }else {
            var or__3824__auto____15569 = p3.call(null, x);
            if(cljs.core.truth_(or__3824__auto____15569)) {
              return or__3824__auto____15569
            }else {
              var or__3824__auto____15570 = p1.call(null, y);
              if(cljs.core.truth_(or__3824__auto____15570)) {
                return or__3824__auto____15570
              }else {
                var or__3824__auto____15571 = p2.call(null, y);
                if(cljs.core.truth_(or__3824__auto____15571)) {
                  return or__3824__auto____15571
                }else {
                  return p3.call(null, y)
                }
              }
            }
          }
        }
      };
      var sp3__3 = function(x, y, z) {
        var or__3824__auto____15572 = p1.call(null, x);
        if(cljs.core.truth_(or__3824__auto____15572)) {
          return or__3824__auto____15572
        }else {
          var or__3824__auto____15573 = p2.call(null, x);
          if(cljs.core.truth_(or__3824__auto____15573)) {
            return or__3824__auto____15573
          }else {
            var or__3824__auto____15574 = p3.call(null, x);
            if(cljs.core.truth_(or__3824__auto____15574)) {
              return or__3824__auto____15574
            }else {
              var or__3824__auto____15575 = p1.call(null, y);
              if(cljs.core.truth_(or__3824__auto____15575)) {
                return or__3824__auto____15575
              }else {
                var or__3824__auto____15576 = p2.call(null, y);
                if(cljs.core.truth_(or__3824__auto____15576)) {
                  return or__3824__auto____15576
                }else {
                  var or__3824__auto____15577 = p3.call(null, y);
                  if(cljs.core.truth_(or__3824__auto____15577)) {
                    return or__3824__auto____15577
                  }else {
                    var or__3824__auto____15578 = p1.call(null, z);
                    if(cljs.core.truth_(or__3824__auto____15578)) {
                      return or__3824__auto____15578
                    }else {
                      var or__3824__auto____15579 = p2.call(null, z);
                      if(cljs.core.truth_(or__3824__auto____15579)) {
                        return or__3824__auto____15579
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
        var G__15596__delegate = function(x, y, z, args) {
          var or__3824__auto____15580 = sp3.call(null, x, y, z);
          if(cljs.core.truth_(or__3824__auto____15580)) {
            return or__3824__auto____15580
          }else {
            return cljs.core.some.call(null, function(p1__15276_SHARP_) {
              var or__3824__auto____15581 = p1.call(null, p1__15276_SHARP_);
              if(cljs.core.truth_(or__3824__auto____15581)) {
                return or__3824__auto____15581
              }else {
                var or__3824__auto____15582 = p2.call(null, p1__15276_SHARP_);
                if(cljs.core.truth_(or__3824__auto____15582)) {
                  return or__3824__auto____15582
                }else {
                  return p3.call(null, p1__15276_SHARP_)
                }
              }
            }, args)
          }
        };
        var G__15596 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__15596__delegate.call(this, x, y, z, args)
        };
        G__15596.cljs$lang$maxFixedArity = 3;
        G__15596.cljs$lang$applyTo = function(arglist__15597) {
          var x = cljs.core.first(arglist__15597);
          var y = cljs.core.first(cljs.core.next(arglist__15597));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__15597)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__15597)));
          return G__15596__delegate(x, y, z, args)
        };
        G__15596.cljs$lang$arity$variadic = G__15596__delegate;
        return G__15596
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
    var G__15598__delegate = function(p1, p2, p3, ps) {
      var ps__15583 = cljs.core.list_STAR_.call(null, p1, p2, p3, ps);
      return function() {
        var spn = null;
        var spn__0 = function() {
          return null
        };
        var spn__1 = function(x) {
          return cljs.core.some.call(null, function(p1__15277_SHARP_) {
            return p1__15277_SHARP_.call(null, x)
          }, ps__15583)
        };
        var spn__2 = function(x, y) {
          return cljs.core.some.call(null, function(p1__15278_SHARP_) {
            var or__3824__auto____15588 = p1__15278_SHARP_.call(null, x);
            if(cljs.core.truth_(or__3824__auto____15588)) {
              return or__3824__auto____15588
            }else {
              return p1__15278_SHARP_.call(null, y)
            }
          }, ps__15583)
        };
        var spn__3 = function(x, y, z) {
          return cljs.core.some.call(null, function(p1__15279_SHARP_) {
            var or__3824__auto____15589 = p1__15279_SHARP_.call(null, x);
            if(cljs.core.truth_(or__3824__auto____15589)) {
              return or__3824__auto____15589
            }else {
              var or__3824__auto____15590 = p1__15279_SHARP_.call(null, y);
              if(cljs.core.truth_(or__3824__auto____15590)) {
                return or__3824__auto____15590
              }else {
                return p1__15279_SHARP_.call(null, z)
              }
            }
          }, ps__15583)
        };
        var spn__4 = function() {
          var G__15599__delegate = function(x, y, z, args) {
            var or__3824__auto____15591 = spn.call(null, x, y, z);
            if(cljs.core.truth_(or__3824__auto____15591)) {
              return or__3824__auto____15591
            }else {
              return cljs.core.some.call(null, function(p1__15280_SHARP_) {
                return cljs.core.some.call(null, p1__15280_SHARP_, args)
              }, ps__15583)
            }
          };
          var G__15599 = function(x, y, z, var_args) {
            var args = null;
            if(goog.isDef(var_args)) {
              args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
            }
            return G__15599__delegate.call(this, x, y, z, args)
          };
          G__15599.cljs$lang$maxFixedArity = 3;
          G__15599.cljs$lang$applyTo = function(arglist__15600) {
            var x = cljs.core.first(arglist__15600);
            var y = cljs.core.first(cljs.core.next(arglist__15600));
            var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__15600)));
            var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__15600)));
            return G__15599__delegate(x, y, z, args)
          };
          G__15599.cljs$lang$arity$variadic = G__15599__delegate;
          return G__15599
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
    var G__15598 = function(p1, p2, p3, var_args) {
      var ps = null;
      if(goog.isDef(var_args)) {
        ps = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__15598__delegate.call(this, p1, p2, p3, ps)
    };
    G__15598.cljs$lang$maxFixedArity = 3;
    G__15598.cljs$lang$applyTo = function(arglist__15601) {
      var p1 = cljs.core.first(arglist__15601);
      var p2 = cljs.core.first(cljs.core.next(arglist__15601));
      var p3 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__15601)));
      var ps = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__15601)));
      return G__15598__delegate(p1, p2, p3, ps)
    };
    G__15598.cljs$lang$arity$variadic = G__15598__delegate;
    return G__15598
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
      var temp__3974__auto____15620 = cljs.core.seq.call(null, coll);
      if(temp__3974__auto____15620) {
        var s__15621 = temp__3974__auto____15620;
        if(cljs.core.chunked_seq_QMARK_.call(null, s__15621)) {
          var c__15622 = cljs.core.chunk_first.call(null, s__15621);
          var size__15623 = cljs.core.count.call(null, c__15622);
          var b__15624 = cljs.core.chunk_buffer.call(null, size__15623);
          var n__2529__auto____15625 = size__15623;
          var i__15626 = 0;
          while(true) {
            if(i__15626 < n__2529__auto____15625) {
              cljs.core.chunk_append.call(null, b__15624, f.call(null, cljs.core._nth.call(null, c__15622, i__15626)));
              var G__15638 = i__15626 + 1;
              i__15626 = G__15638;
              continue
            }else {
            }
            break
          }
          return cljs.core.chunk_cons.call(null, cljs.core.chunk.call(null, b__15624), map.call(null, f, cljs.core.chunk_rest.call(null, s__15621)))
        }else {
          return cljs.core.cons.call(null, f.call(null, cljs.core.first.call(null, s__15621)), map.call(null, f, cljs.core.rest.call(null, s__15621)))
        }
      }else {
        return null
      }
    }, null)
  };
  var map__3 = function(f, c1, c2) {
    return new cljs.core.LazySeq(null, false, function() {
      var s1__15627 = cljs.core.seq.call(null, c1);
      var s2__15628 = cljs.core.seq.call(null, c2);
      if(function() {
        var and__3822__auto____15629 = s1__15627;
        if(and__3822__auto____15629) {
          return s2__15628
        }else {
          return and__3822__auto____15629
        }
      }()) {
        return cljs.core.cons.call(null, f.call(null, cljs.core.first.call(null, s1__15627), cljs.core.first.call(null, s2__15628)), map.call(null, f, cljs.core.rest.call(null, s1__15627), cljs.core.rest.call(null, s2__15628)))
      }else {
        return null
      }
    }, null)
  };
  var map__4 = function(f, c1, c2, c3) {
    return new cljs.core.LazySeq(null, false, function() {
      var s1__15630 = cljs.core.seq.call(null, c1);
      var s2__15631 = cljs.core.seq.call(null, c2);
      var s3__15632 = cljs.core.seq.call(null, c3);
      if(function() {
        var and__3822__auto____15633 = s1__15630;
        if(and__3822__auto____15633) {
          var and__3822__auto____15634 = s2__15631;
          if(and__3822__auto____15634) {
            return s3__15632
          }else {
            return and__3822__auto____15634
          }
        }else {
          return and__3822__auto____15633
        }
      }()) {
        return cljs.core.cons.call(null, f.call(null, cljs.core.first.call(null, s1__15630), cljs.core.first.call(null, s2__15631), cljs.core.first.call(null, s3__15632)), map.call(null, f, cljs.core.rest.call(null, s1__15630), cljs.core.rest.call(null, s2__15631), cljs.core.rest.call(null, s3__15632)))
      }else {
        return null
      }
    }, null)
  };
  var map__5 = function() {
    var G__15639__delegate = function(f, c1, c2, c3, colls) {
      var step__15637 = function step(cs) {
        return new cljs.core.LazySeq(null, false, function() {
          var ss__15636 = map.call(null, cljs.core.seq, cs);
          if(cljs.core.every_QMARK_.call(null, cljs.core.identity, ss__15636)) {
            return cljs.core.cons.call(null, map.call(null, cljs.core.first, ss__15636), step.call(null, map.call(null, cljs.core.rest, ss__15636)))
          }else {
            return null
          }
        }, null)
      };
      return map.call(null, function(p1__15441_SHARP_) {
        return cljs.core.apply.call(null, f, p1__15441_SHARP_)
      }, step__15637.call(null, cljs.core.conj.call(null, colls, c3, c2, c1)))
    };
    var G__15639 = function(f, c1, c2, c3, var_args) {
      var colls = null;
      if(goog.isDef(var_args)) {
        colls = cljs.core.array_seq(Array.prototype.slice.call(arguments, 4), 0)
      }
      return G__15639__delegate.call(this, f, c1, c2, c3, colls)
    };
    G__15639.cljs$lang$maxFixedArity = 4;
    G__15639.cljs$lang$applyTo = function(arglist__15640) {
      var f = cljs.core.first(arglist__15640);
      var c1 = cljs.core.first(cljs.core.next(arglist__15640));
      var c2 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__15640)));
      var c3 = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__15640))));
      var colls = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(arglist__15640))));
      return G__15639__delegate(f, c1, c2, c3, colls)
    };
    G__15639.cljs$lang$arity$variadic = G__15639__delegate;
    return G__15639
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
      var temp__3974__auto____15643 = cljs.core.seq.call(null, coll);
      if(temp__3974__auto____15643) {
        var s__15644 = temp__3974__auto____15643;
        return cljs.core.cons.call(null, cljs.core.first.call(null, s__15644), take.call(null, n - 1, cljs.core.rest.call(null, s__15644)))
      }else {
        return null
      }
    }else {
      return null
    }
  }, null)
};
cljs.core.drop = function drop(n, coll) {
  var step__15650 = function(n, coll) {
    while(true) {
      var s__15648 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(function() {
        var and__3822__auto____15649 = n > 0;
        if(and__3822__auto____15649) {
          return s__15648
        }else {
          return and__3822__auto____15649
        }
      }())) {
        var G__15651 = n - 1;
        var G__15652 = cljs.core.rest.call(null, s__15648);
        n = G__15651;
        coll = G__15652;
        continue
      }else {
        return s__15648
      }
      break
    }
  };
  return new cljs.core.LazySeq(null, false, function() {
    return step__15650.call(null, n, coll)
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
  var s__15655 = cljs.core.seq.call(null, coll);
  var lead__15656 = cljs.core.seq.call(null, cljs.core.drop.call(null, n, coll));
  while(true) {
    if(lead__15656) {
      var G__15657 = cljs.core.next.call(null, s__15655);
      var G__15658 = cljs.core.next.call(null, lead__15656);
      s__15655 = G__15657;
      lead__15656 = G__15658;
      continue
    }else {
      return s__15655
    }
    break
  }
};
cljs.core.drop_while = function drop_while(pred, coll) {
  var step__15664 = function(pred, coll) {
    while(true) {
      var s__15662 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(function() {
        var and__3822__auto____15663 = s__15662;
        if(and__3822__auto____15663) {
          return pred.call(null, cljs.core.first.call(null, s__15662))
        }else {
          return and__3822__auto____15663
        }
      }())) {
        var G__15665 = pred;
        var G__15666 = cljs.core.rest.call(null, s__15662);
        pred = G__15665;
        coll = G__15666;
        continue
      }else {
        return s__15662
      }
      break
    }
  };
  return new cljs.core.LazySeq(null, false, function() {
    return step__15664.call(null, pred, coll)
  }, null)
};
cljs.core.cycle = function cycle(coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__3974__auto____15669 = cljs.core.seq.call(null, coll);
    if(temp__3974__auto____15669) {
      var s__15670 = temp__3974__auto____15669;
      return cljs.core.concat.call(null, s__15670, cycle.call(null, s__15670))
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
      var s1__15675 = cljs.core.seq.call(null, c1);
      var s2__15676 = cljs.core.seq.call(null, c2);
      if(function() {
        var and__3822__auto____15677 = s1__15675;
        if(and__3822__auto____15677) {
          return s2__15676
        }else {
          return and__3822__auto____15677
        }
      }()) {
        return cljs.core.cons.call(null, cljs.core.first.call(null, s1__15675), cljs.core.cons.call(null, cljs.core.first.call(null, s2__15676), interleave.call(null, cljs.core.rest.call(null, s1__15675), cljs.core.rest.call(null, s2__15676))))
      }else {
        return null
      }
    }, null)
  };
  var interleave__3 = function() {
    var G__15679__delegate = function(c1, c2, colls) {
      return new cljs.core.LazySeq(null, false, function() {
        var ss__15678 = cljs.core.map.call(null, cljs.core.seq, cljs.core.conj.call(null, colls, c2, c1));
        if(cljs.core.every_QMARK_.call(null, cljs.core.identity, ss__15678)) {
          return cljs.core.concat.call(null, cljs.core.map.call(null, cljs.core.first, ss__15678), cljs.core.apply.call(null, interleave, cljs.core.map.call(null, cljs.core.rest, ss__15678)))
        }else {
          return null
        }
      }, null)
    };
    var G__15679 = function(c1, c2, var_args) {
      var colls = null;
      if(goog.isDef(var_args)) {
        colls = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__15679__delegate.call(this, c1, c2, colls)
    };
    G__15679.cljs$lang$maxFixedArity = 2;
    G__15679.cljs$lang$applyTo = function(arglist__15680) {
      var c1 = cljs.core.first(arglist__15680);
      var c2 = cljs.core.first(cljs.core.next(arglist__15680));
      var colls = cljs.core.rest(cljs.core.next(arglist__15680));
      return G__15679__delegate(c1, c2, colls)
    };
    G__15679.cljs$lang$arity$variadic = G__15679__delegate;
    return G__15679
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
  var cat__15690 = function cat(coll, colls) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3971__auto____15688 = cljs.core.seq.call(null, coll);
      if(temp__3971__auto____15688) {
        var coll__15689 = temp__3971__auto____15688;
        return cljs.core.cons.call(null, cljs.core.first.call(null, coll__15689), cat.call(null, cljs.core.rest.call(null, coll__15689), colls))
      }else {
        if(cljs.core.seq.call(null, colls)) {
          return cat.call(null, cljs.core.first.call(null, colls), cljs.core.rest.call(null, colls))
        }else {
          return null
        }
      }
    }, null)
  };
  return cat__15690.call(null, null, colls)
};
cljs.core.mapcat = function() {
  var mapcat = null;
  var mapcat__2 = function(f, coll) {
    return cljs.core.flatten1.call(null, cljs.core.map.call(null, f, coll))
  };
  var mapcat__3 = function() {
    var G__15691__delegate = function(f, coll, colls) {
      return cljs.core.flatten1.call(null, cljs.core.apply.call(null, cljs.core.map, f, coll, colls))
    };
    var G__15691 = function(f, coll, var_args) {
      var colls = null;
      if(goog.isDef(var_args)) {
        colls = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__15691__delegate.call(this, f, coll, colls)
    };
    G__15691.cljs$lang$maxFixedArity = 2;
    G__15691.cljs$lang$applyTo = function(arglist__15692) {
      var f = cljs.core.first(arglist__15692);
      var coll = cljs.core.first(cljs.core.next(arglist__15692));
      var colls = cljs.core.rest(cljs.core.next(arglist__15692));
      return G__15691__delegate(f, coll, colls)
    };
    G__15691.cljs$lang$arity$variadic = G__15691__delegate;
    return G__15691
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
    var temp__3974__auto____15702 = cljs.core.seq.call(null, coll);
    if(temp__3974__auto____15702) {
      var s__15703 = temp__3974__auto____15702;
      if(cljs.core.chunked_seq_QMARK_.call(null, s__15703)) {
        var c__15704 = cljs.core.chunk_first.call(null, s__15703);
        var size__15705 = cljs.core.count.call(null, c__15704);
        var b__15706 = cljs.core.chunk_buffer.call(null, size__15705);
        var n__2529__auto____15707 = size__15705;
        var i__15708 = 0;
        while(true) {
          if(i__15708 < n__2529__auto____15707) {
            if(cljs.core.truth_(pred.call(null, cljs.core._nth.call(null, c__15704, i__15708)))) {
              cljs.core.chunk_append.call(null, b__15706, cljs.core._nth.call(null, c__15704, i__15708))
            }else {
            }
            var G__15711 = i__15708 + 1;
            i__15708 = G__15711;
            continue
          }else {
          }
          break
        }
        return cljs.core.chunk_cons.call(null, cljs.core.chunk.call(null, b__15706), filter.call(null, pred, cljs.core.chunk_rest.call(null, s__15703)))
      }else {
        var f__15709 = cljs.core.first.call(null, s__15703);
        var r__15710 = cljs.core.rest.call(null, s__15703);
        if(cljs.core.truth_(pred.call(null, f__15709))) {
          return cljs.core.cons.call(null, f__15709, filter.call(null, pred, r__15710))
        }else {
          return filter.call(null, pred, r__15710)
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
  var walk__15714 = function walk(node) {
    return new cljs.core.LazySeq(null, false, function() {
      return cljs.core.cons.call(null, node, cljs.core.truth_(branch_QMARK_.call(null, node)) ? cljs.core.mapcat.call(null, walk, children.call(null, node)) : null)
    }, null)
  };
  return walk__15714.call(null, root)
};
cljs.core.flatten = function flatten(x) {
  return cljs.core.filter.call(null, function(p1__15712_SHARP_) {
    return!cljs.core.sequential_QMARK_.call(null, p1__15712_SHARP_)
  }, cljs.core.rest.call(null, cljs.core.tree_seq.call(null, cljs.core.sequential_QMARK_, cljs.core.seq, x)))
};
cljs.core.into = function into(to, from) {
  if(function() {
    var G__15718__15719 = to;
    if(G__15718__15719) {
      if(function() {
        var or__3824__auto____15720 = G__15718__15719.cljs$lang$protocol_mask$partition1$ & 1;
        if(or__3824__auto____15720) {
          return or__3824__auto____15720
        }else {
          return G__15718__15719.cljs$core$IEditableCollection$
        }
      }()) {
        return true
      }else {
        if(!G__15718__15719.cljs$lang$protocol_mask$partition1$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.IEditableCollection, G__15718__15719)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.IEditableCollection, G__15718__15719)
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
    var G__15721__delegate = function(f, c1, c2, c3, colls) {
      return cljs.core.into.call(null, cljs.core.PersistentVector.EMPTY, cljs.core.apply.call(null, cljs.core.map, f, c1, c2, c3, colls))
    };
    var G__15721 = function(f, c1, c2, c3, var_args) {
      var colls = null;
      if(goog.isDef(var_args)) {
        colls = cljs.core.array_seq(Array.prototype.slice.call(arguments, 4), 0)
      }
      return G__15721__delegate.call(this, f, c1, c2, c3, colls)
    };
    G__15721.cljs$lang$maxFixedArity = 4;
    G__15721.cljs$lang$applyTo = function(arglist__15722) {
      var f = cljs.core.first(arglist__15722);
      var c1 = cljs.core.first(cljs.core.next(arglist__15722));
      var c2 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__15722)));
      var c3 = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__15722))));
      var colls = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(arglist__15722))));
      return G__15721__delegate(f, c1, c2, c3, colls)
    };
    G__15721.cljs$lang$arity$variadic = G__15721__delegate;
    return G__15721
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
      var temp__3974__auto____15729 = cljs.core.seq.call(null, coll);
      if(temp__3974__auto____15729) {
        var s__15730 = temp__3974__auto____15729;
        var p__15731 = cljs.core.take.call(null, n, s__15730);
        if(n === cljs.core.count.call(null, p__15731)) {
          return cljs.core.cons.call(null, p__15731, partition.call(null, n, step, cljs.core.drop.call(null, step, s__15730)))
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
      var temp__3974__auto____15732 = cljs.core.seq.call(null, coll);
      if(temp__3974__auto____15732) {
        var s__15733 = temp__3974__auto____15732;
        var p__15734 = cljs.core.take.call(null, n, s__15733);
        if(n === cljs.core.count.call(null, p__15734)) {
          return cljs.core.cons.call(null, p__15734, partition.call(null, n, step, pad, cljs.core.drop.call(null, step, s__15733)))
        }else {
          return cljs.core.list.call(null, cljs.core.take.call(null, n, cljs.core.concat.call(null, p__15734, pad)))
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
    var sentinel__15739 = cljs.core.lookup_sentinel;
    var m__15740 = m;
    var ks__15741 = cljs.core.seq.call(null, ks);
    while(true) {
      if(ks__15741) {
        var m__15742 = cljs.core._lookup.call(null, m__15740, cljs.core.first.call(null, ks__15741), sentinel__15739);
        if(sentinel__15739 === m__15742) {
          return not_found
        }else {
          var G__15743 = sentinel__15739;
          var G__15744 = m__15742;
          var G__15745 = cljs.core.next.call(null, ks__15741);
          sentinel__15739 = G__15743;
          m__15740 = G__15744;
          ks__15741 = G__15745;
          continue
        }
      }else {
        return m__15740
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
cljs.core.assoc_in = function assoc_in(m, p__15746, v) {
  var vec__15751__15752 = p__15746;
  var k__15753 = cljs.core.nth.call(null, vec__15751__15752, 0, null);
  var ks__15754 = cljs.core.nthnext.call(null, vec__15751__15752, 1);
  if(cljs.core.truth_(ks__15754)) {
    return cljs.core.assoc.call(null, m, k__15753, assoc_in.call(null, cljs.core._lookup.call(null, m, k__15753, null), ks__15754, v))
  }else {
    return cljs.core.assoc.call(null, m, k__15753, v)
  }
};
cljs.core.update_in = function() {
  var update_in__delegate = function(m, p__15755, f, args) {
    var vec__15760__15761 = p__15755;
    var k__15762 = cljs.core.nth.call(null, vec__15760__15761, 0, null);
    var ks__15763 = cljs.core.nthnext.call(null, vec__15760__15761, 1);
    if(cljs.core.truth_(ks__15763)) {
      return cljs.core.assoc.call(null, m, k__15762, cljs.core.apply.call(null, update_in, cljs.core._lookup.call(null, m, k__15762, null), ks__15763, f, args))
    }else {
      return cljs.core.assoc.call(null, m, k__15762, cljs.core.apply.call(null, f, cljs.core._lookup.call(null, m, k__15762, null), args))
    }
  };
  var update_in = function(m, p__15755, f, var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
    }
    return update_in__delegate.call(this, m, p__15755, f, args)
  };
  update_in.cljs$lang$maxFixedArity = 3;
  update_in.cljs$lang$applyTo = function(arglist__15764) {
    var m = cljs.core.first(arglist__15764);
    var p__15755 = cljs.core.first(cljs.core.next(arglist__15764));
    var f = cljs.core.first(cljs.core.next(cljs.core.next(arglist__15764)));
    var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__15764)));
    return update_in__delegate(m, p__15755, f, args)
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
cljs.core.Vector.cljs$lang$ctorPrSeq = function(this__2311__auto__) {
  return cljs.core.list.call(null, "cljs.core/Vector")
};
cljs.core.Vector.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__15767 = this;
  var h__2194__auto____15768 = this__15767.__hash;
  if(!(h__2194__auto____15768 == null)) {
    return h__2194__auto____15768
  }else {
    var h__2194__auto____15769 = cljs.core.hash_coll.call(null, coll);
    this__15767.__hash = h__2194__auto____15769;
    return h__2194__auto____15769
  }
};
cljs.core.Vector.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__15770 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, null)
};
cljs.core.Vector.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__15771 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, not_found)
};
cljs.core.Vector.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__15772 = this;
  var new_array__15773 = this__15772.array.slice();
  new_array__15773[k] = v;
  return new cljs.core.Vector(this__15772.meta, new_array__15773, null)
};
cljs.core.Vector.prototype.call = function() {
  var G__15804 = null;
  var G__15804__2 = function(this_sym15774, k) {
    var this__15776 = this;
    var this_sym15774__15777 = this;
    var coll__15778 = this_sym15774__15777;
    return coll__15778.cljs$core$ILookup$_lookup$arity$2(coll__15778, k)
  };
  var G__15804__3 = function(this_sym15775, k, not_found) {
    var this__15776 = this;
    var this_sym15775__15779 = this;
    var coll__15780 = this_sym15775__15779;
    return coll__15780.cljs$core$ILookup$_lookup$arity$3(coll__15780, k, not_found)
  };
  G__15804 = function(this_sym15775, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__15804__2.call(this, this_sym15775, k);
      case 3:
        return G__15804__3.call(this, this_sym15775, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__15804
}();
cljs.core.Vector.prototype.apply = function(this_sym15765, args15766) {
  var this__15781 = this;
  return this_sym15765.call.apply(this_sym15765, [this_sym15765].concat(args15766.slice()))
};
cljs.core.Vector.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__15782 = this;
  var new_array__15783 = this__15782.array.slice();
  new_array__15783.push(o);
  return new cljs.core.Vector(this__15782.meta, new_array__15783, null)
};
cljs.core.Vector.prototype.toString = function() {
  var this__15784 = this;
  var this__15785 = this;
  return cljs.core.pr_str.call(null, this__15785)
};
cljs.core.Vector.prototype.cljs$core$IReduce$_reduce$arity$2 = function(v, f) {
  var this__15786 = this;
  return cljs.core.ci_reduce.call(null, this__15786.array, f)
};
cljs.core.Vector.prototype.cljs$core$IReduce$_reduce$arity$3 = function(v, f, start) {
  var this__15787 = this;
  return cljs.core.ci_reduce.call(null, this__15787.array, f, start)
};
cljs.core.Vector.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__15788 = this;
  if(this__15788.array.length > 0) {
    var vector_seq__15789 = function vector_seq(i) {
      return new cljs.core.LazySeq(null, false, function() {
        if(i < this__15788.array.length) {
          return cljs.core.cons.call(null, this__15788.array[i], vector_seq.call(null, i + 1))
        }else {
          return null
        }
      }, null)
    };
    return vector_seq__15789.call(null, 0)
  }else {
    return null
  }
};
cljs.core.Vector.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__15790 = this;
  return this__15790.array.length
};
cljs.core.Vector.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__15791 = this;
  var count__15792 = this__15791.array.length;
  if(count__15792 > 0) {
    return this__15791.array[count__15792 - 1]
  }else {
    return null
  }
};
cljs.core.Vector.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__15793 = this;
  if(this__15793.array.length > 0) {
    var new_array__15794 = this__15793.array.slice();
    new_array__15794.pop();
    return new cljs.core.Vector(this__15793.meta, new_array__15794, null)
  }else {
    throw new Error("Can't pop empty vector");
  }
};
cljs.core.Vector.prototype.cljs$core$IVector$_assoc_n$arity$3 = function(coll, n, val) {
  var this__15795 = this;
  return coll.cljs$core$IAssociative$_assoc$arity$3(coll, n, val)
};
cljs.core.Vector.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__15796 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.Vector.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__15797 = this;
  return new cljs.core.Vector(meta, this__15797.array, this__15797.__hash)
};
cljs.core.Vector.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__15798 = this;
  return this__15798.meta
};
cljs.core.Vector.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, n) {
  var this__15799 = this;
  if(function() {
    var and__3822__auto____15800 = 0 <= n;
    if(and__3822__auto____15800) {
      return n < this__15799.array.length
    }else {
      return and__3822__auto____15800
    }
  }()) {
    return this__15799.array[n]
  }else {
    return null
  }
};
cljs.core.Vector.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, n, not_found) {
  var this__15801 = this;
  if(function() {
    var and__3822__auto____15802 = 0 <= n;
    if(and__3822__auto____15802) {
      return n < this__15801.array.length
    }else {
      return and__3822__auto____15802
    }
  }()) {
    return this__15801.array[n]
  }else {
    return not_found
  }
};
cljs.core.Vector.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__15803 = this;
  return cljs.core.with_meta.call(null, cljs.core.Vector.EMPTY, this__15803.meta)
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
cljs.core.VectorNode.cljs$lang$ctorPrSeq = function(this__2312__auto__) {
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
  var cnt__15806 = pv.cnt;
  if(cnt__15806 < 32) {
    return 0
  }else {
    return cnt__15806 - 1 >>> 5 << 5
  }
};
cljs.core.new_path = function new_path(edit, level, node) {
  var ll__15812 = level;
  var ret__15813 = node;
  while(true) {
    if(ll__15812 === 0) {
      return ret__15813
    }else {
      var embed__15814 = ret__15813;
      var r__15815 = cljs.core.pv_fresh_node.call(null, edit);
      var ___15816 = cljs.core.pv_aset.call(null, r__15815, 0, embed__15814);
      var G__15817 = ll__15812 - 5;
      var G__15818 = r__15815;
      ll__15812 = G__15817;
      ret__15813 = G__15818;
      continue
    }
    break
  }
};
cljs.core.push_tail = function push_tail(pv, level, parent, tailnode) {
  var ret__15824 = cljs.core.pv_clone_node.call(null, parent);
  var subidx__15825 = pv.cnt - 1 >>> level & 31;
  if(5 === level) {
    cljs.core.pv_aset.call(null, ret__15824, subidx__15825, tailnode);
    return ret__15824
  }else {
    var child__15826 = cljs.core.pv_aget.call(null, parent, subidx__15825);
    if(!(child__15826 == null)) {
      var node_to_insert__15827 = push_tail.call(null, pv, level - 5, child__15826, tailnode);
      cljs.core.pv_aset.call(null, ret__15824, subidx__15825, node_to_insert__15827);
      return ret__15824
    }else {
      var node_to_insert__15828 = cljs.core.new_path.call(null, null, level - 5, tailnode);
      cljs.core.pv_aset.call(null, ret__15824, subidx__15825, node_to_insert__15828);
      return ret__15824
    }
  }
};
cljs.core.array_for = function array_for(pv, i) {
  if(function() {
    var and__3822__auto____15832 = 0 <= i;
    if(and__3822__auto____15832) {
      return i < pv.cnt
    }else {
      return and__3822__auto____15832
    }
  }()) {
    if(i >= cljs.core.tail_off.call(null, pv)) {
      return pv.tail
    }else {
      var node__15833 = pv.root;
      var level__15834 = pv.shift;
      while(true) {
        if(level__15834 > 0) {
          var G__15835 = cljs.core.pv_aget.call(null, node__15833, i >>> level__15834 & 31);
          var G__15836 = level__15834 - 5;
          node__15833 = G__15835;
          level__15834 = G__15836;
          continue
        }else {
          return node__15833.arr
        }
        break
      }
    }
  }else {
    throw new Error([cljs.core.str("No item "), cljs.core.str(i), cljs.core.str(" in vector of length "), cljs.core.str(pv.cnt)].join(""));
  }
};
cljs.core.do_assoc = function do_assoc(pv, level, node, i, val) {
  var ret__15839 = cljs.core.pv_clone_node.call(null, node);
  if(level === 0) {
    cljs.core.pv_aset.call(null, ret__15839, i & 31, val);
    return ret__15839
  }else {
    var subidx__15840 = i >>> level & 31;
    cljs.core.pv_aset.call(null, ret__15839, subidx__15840, do_assoc.call(null, pv, level - 5, cljs.core.pv_aget.call(null, node, subidx__15840), i, val));
    return ret__15839
  }
};
cljs.core.pop_tail = function pop_tail(pv, level, node) {
  var subidx__15846 = pv.cnt - 2 >>> level & 31;
  if(level > 5) {
    var new_child__15847 = pop_tail.call(null, pv, level - 5, cljs.core.pv_aget.call(null, node, subidx__15846));
    if(function() {
      var and__3822__auto____15848 = new_child__15847 == null;
      if(and__3822__auto____15848) {
        return subidx__15846 === 0
      }else {
        return and__3822__auto____15848
      }
    }()) {
      return null
    }else {
      var ret__15849 = cljs.core.pv_clone_node.call(null, node);
      cljs.core.pv_aset.call(null, ret__15849, subidx__15846, new_child__15847);
      return ret__15849
    }
  }else {
    if(subidx__15846 === 0) {
      return null
    }else {
      if("\ufdd0'else") {
        var ret__15850 = cljs.core.pv_clone_node.call(null, node);
        cljs.core.pv_aset.call(null, ret__15850, subidx__15846, null);
        return ret__15850
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
cljs.core.PersistentVector.cljs$lang$ctorPrSeq = function(this__2311__auto__) {
  return cljs.core.list.call(null, "cljs.core/PersistentVector")
};
cljs.core.PersistentVector.prototype.cljs$core$IEditableCollection$_as_transient$arity$1 = function(coll) {
  var this__15853 = this;
  return new cljs.core.TransientVector(this__15853.cnt, this__15853.shift, cljs.core.tv_editable_root.call(null, this__15853.root), cljs.core.tv_editable_tail.call(null, this__15853.tail))
};
cljs.core.PersistentVector.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__15854 = this;
  var h__2194__auto____15855 = this__15854.__hash;
  if(!(h__2194__auto____15855 == null)) {
    return h__2194__auto____15855
  }else {
    var h__2194__auto____15856 = cljs.core.hash_coll.call(null, coll);
    this__15854.__hash = h__2194__auto____15856;
    return h__2194__auto____15856
  }
};
cljs.core.PersistentVector.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__15857 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, null)
};
cljs.core.PersistentVector.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__15858 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, not_found)
};
cljs.core.PersistentVector.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__15859 = this;
  if(function() {
    var and__3822__auto____15860 = 0 <= k;
    if(and__3822__auto____15860) {
      return k < this__15859.cnt
    }else {
      return and__3822__auto____15860
    }
  }()) {
    if(cljs.core.tail_off.call(null, coll) <= k) {
      var new_tail__15861 = this__15859.tail.slice();
      new_tail__15861[k & 31] = v;
      return new cljs.core.PersistentVector(this__15859.meta, this__15859.cnt, this__15859.shift, this__15859.root, new_tail__15861, null)
    }else {
      return new cljs.core.PersistentVector(this__15859.meta, this__15859.cnt, this__15859.shift, cljs.core.do_assoc.call(null, coll, this__15859.shift, this__15859.root, k, v), this__15859.tail, null)
    }
  }else {
    if(k === this__15859.cnt) {
      return coll.cljs$core$ICollection$_conj$arity$2(coll, v)
    }else {
      if("\ufdd0'else") {
        throw new Error([cljs.core.str("Index "), cljs.core.str(k), cljs.core.str(" out of bounds  [0,"), cljs.core.str(this__15859.cnt), cljs.core.str("]")].join(""));
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentVector.prototype.call = function() {
  var G__15909 = null;
  var G__15909__2 = function(this_sym15862, k) {
    var this__15864 = this;
    var this_sym15862__15865 = this;
    var coll__15866 = this_sym15862__15865;
    return coll__15866.cljs$core$ILookup$_lookup$arity$2(coll__15866, k)
  };
  var G__15909__3 = function(this_sym15863, k, not_found) {
    var this__15864 = this;
    var this_sym15863__15867 = this;
    var coll__15868 = this_sym15863__15867;
    return coll__15868.cljs$core$ILookup$_lookup$arity$3(coll__15868, k, not_found)
  };
  G__15909 = function(this_sym15863, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__15909__2.call(this, this_sym15863, k);
      case 3:
        return G__15909__3.call(this, this_sym15863, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__15909
}();
cljs.core.PersistentVector.prototype.apply = function(this_sym15851, args15852) {
  var this__15869 = this;
  return this_sym15851.call.apply(this_sym15851, [this_sym15851].concat(args15852.slice()))
};
cljs.core.PersistentVector.prototype.cljs$core$IKVReduce$_kv_reduce$arity$3 = function(v, f, init) {
  var this__15870 = this;
  var step_init__15871 = [0, init];
  var i__15872 = 0;
  while(true) {
    if(i__15872 < this__15870.cnt) {
      var arr__15873 = cljs.core.array_for.call(null, v, i__15872);
      var len__15874 = arr__15873.length;
      var init__15878 = function() {
        var j__15875 = 0;
        var init__15876 = step_init__15871[1];
        while(true) {
          if(j__15875 < len__15874) {
            var init__15877 = f.call(null, init__15876, j__15875 + i__15872, arr__15873[j__15875]);
            if(cljs.core.reduced_QMARK_.call(null, init__15877)) {
              return init__15877
            }else {
              var G__15910 = j__15875 + 1;
              var G__15911 = init__15877;
              j__15875 = G__15910;
              init__15876 = G__15911;
              continue
            }
          }else {
            step_init__15871[0] = len__15874;
            step_init__15871[1] = init__15876;
            return init__15876
          }
          break
        }
      }();
      if(cljs.core.reduced_QMARK_.call(null, init__15878)) {
        return cljs.core.deref.call(null, init__15878)
      }else {
        var G__15912 = i__15872 + step_init__15871[0];
        i__15872 = G__15912;
        continue
      }
    }else {
      return step_init__15871[1]
    }
    break
  }
};
cljs.core.PersistentVector.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__15879 = this;
  if(this__15879.cnt - cljs.core.tail_off.call(null, coll) < 32) {
    var new_tail__15880 = this__15879.tail.slice();
    new_tail__15880.push(o);
    return new cljs.core.PersistentVector(this__15879.meta, this__15879.cnt + 1, this__15879.shift, this__15879.root, new_tail__15880, null)
  }else {
    var root_overflow_QMARK___15881 = this__15879.cnt >>> 5 > 1 << this__15879.shift;
    var new_shift__15882 = root_overflow_QMARK___15881 ? this__15879.shift + 5 : this__15879.shift;
    var new_root__15884 = root_overflow_QMARK___15881 ? function() {
      var n_r__15883 = cljs.core.pv_fresh_node.call(null, null);
      cljs.core.pv_aset.call(null, n_r__15883, 0, this__15879.root);
      cljs.core.pv_aset.call(null, n_r__15883, 1, cljs.core.new_path.call(null, null, this__15879.shift, new cljs.core.VectorNode(null, this__15879.tail)));
      return n_r__15883
    }() : cljs.core.push_tail.call(null, coll, this__15879.shift, this__15879.root, new cljs.core.VectorNode(null, this__15879.tail));
    return new cljs.core.PersistentVector(this__15879.meta, this__15879.cnt + 1, new_shift__15882, new_root__15884, [o], null)
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IReversible$_rseq$arity$1 = function(coll) {
  var this__15885 = this;
  if(this__15885.cnt > 0) {
    return new cljs.core.RSeq(coll, this__15885.cnt - 1, null)
  }else {
    return cljs.core.List.EMPTY
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IMapEntry$_key$arity$1 = function(coll) {
  var this__15886 = this;
  return coll.cljs$core$IIndexed$_nth$arity$2(coll, 0)
};
cljs.core.PersistentVector.prototype.cljs$core$IMapEntry$_val$arity$1 = function(coll) {
  var this__15887 = this;
  return coll.cljs$core$IIndexed$_nth$arity$2(coll, 1)
};
cljs.core.PersistentVector.prototype.toString = function() {
  var this__15888 = this;
  var this__15889 = this;
  return cljs.core.pr_str.call(null, this__15889)
};
cljs.core.PersistentVector.prototype.cljs$core$IReduce$_reduce$arity$2 = function(v, f) {
  var this__15890 = this;
  return cljs.core.ci_reduce.call(null, v, f)
};
cljs.core.PersistentVector.prototype.cljs$core$IReduce$_reduce$arity$3 = function(v, f, start) {
  var this__15891 = this;
  return cljs.core.ci_reduce.call(null, v, f, start)
};
cljs.core.PersistentVector.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__15892 = this;
  if(this__15892.cnt === 0) {
    return null
  }else {
    return cljs.core.chunked_seq.call(null, coll, 0, 0)
  }
};
cljs.core.PersistentVector.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__15893 = this;
  return this__15893.cnt
};
cljs.core.PersistentVector.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__15894 = this;
  if(this__15894.cnt > 0) {
    return coll.cljs$core$IIndexed$_nth$arity$2(coll, this__15894.cnt - 1)
  }else {
    return null
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__15895 = this;
  if(this__15895.cnt === 0) {
    throw new Error("Can't pop empty vector");
  }else {
    if(1 === this__15895.cnt) {
      return cljs.core._with_meta.call(null, cljs.core.PersistentVector.EMPTY, this__15895.meta)
    }else {
      if(1 < this__15895.cnt - cljs.core.tail_off.call(null, coll)) {
        return new cljs.core.PersistentVector(this__15895.meta, this__15895.cnt - 1, this__15895.shift, this__15895.root, this__15895.tail.slice(0, -1), null)
      }else {
        if("\ufdd0'else") {
          var new_tail__15896 = cljs.core.array_for.call(null, coll, this__15895.cnt - 2);
          var nr__15897 = cljs.core.pop_tail.call(null, coll, this__15895.shift, this__15895.root);
          var new_root__15898 = nr__15897 == null ? cljs.core.PersistentVector.EMPTY_NODE : nr__15897;
          var cnt_1__15899 = this__15895.cnt - 1;
          if(function() {
            var and__3822__auto____15900 = 5 < this__15895.shift;
            if(and__3822__auto____15900) {
              return cljs.core.pv_aget.call(null, new_root__15898, 1) == null
            }else {
              return and__3822__auto____15900
            }
          }()) {
            return new cljs.core.PersistentVector(this__15895.meta, cnt_1__15899, this__15895.shift - 5, cljs.core.pv_aget.call(null, new_root__15898, 0), new_tail__15896, null)
          }else {
            return new cljs.core.PersistentVector(this__15895.meta, cnt_1__15899, this__15895.shift, new_root__15898, new_tail__15896, null)
          }
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IVector$_assoc_n$arity$3 = function(coll, n, val) {
  var this__15901 = this;
  return coll.cljs$core$IAssociative$_assoc$arity$3(coll, n, val)
};
cljs.core.PersistentVector.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__15902 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.PersistentVector.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__15903 = this;
  return new cljs.core.PersistentVector(meta, this__15903.cnt, this__15903.shift, this__15903.root, this__15903.tail, this__15903.__hash)
};
cljs.core.PersistentVector.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__15904 = this;
  return this__15904.meta
};
cljs.core.PersistentVector.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, n) {
  var this__15905 = this;
  return cljs.core.array_for.call(null, coll, n)[n & 31]
};
cljs.core.PersistentVector.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, n, not_found) {
  var this__15906 = this;
  if(function() {
    var and__3822__auto____15907 = 0 <= n;
    if(and__3822__auto____15907) {
      return n < this__15906.cnt
    }else {
      return and__3822__auto____15907
    }
  }()) {
    return coll.cljs$core$IIndexed$_nth$arity$2(coll, n)
  }else {
    return not_found
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__15908 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentVector.EMPTY, this__15908.meta)
};
cljs.core.PersistentVector;
cljs.core.PersistentVector.EMPTY_NODE = cljs.core.pv_fresh_node.call(null, null);
cljs.core.PersistentVector.EMPTY = new cljs.core.PersistentVector(null, 0, 5, cljs.core.PersistentVector.EMPTY_NODE, [], 0);
cljs.core.PersistentVector.fromArray = function(xs, no_clone) {
  var l__15913 = xs.length;
  var xs__15914 = no_clone === true ? xs : xs.slice();
  if(l__15913 < 32) {
    return new cljs.core.PersistentVector(null, l__15913, 5, cljs.core.PersistentVector.EMPTY_NODE, xs__15914, null)
  }else {
    var node__15915 = xs__15914.slice(0, 32);
    var v__15916 = new cljs.core.PersistentVector(null, 32, 5, cljs.core.PersistentVector.EMPTY_NODE, node__15915, null);
    var i__15917 = 32;
    var out__15918 = cljs.core._as_transient.call(null, v__15916);
    while(true) {
      if(i__15917 < l__15913) {
        var G__15919 = i__15917 + 1;
        var G__15920 = cljs.core.conj_BANG_.call(null, out__15918, xs__15914[i__15917]);
        i__15917 = G__15919;
        out__15918 = G__15920;
        continue
      }else {
        return cljs.core.persistent_BANG_.call(null, out__15918)
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
  vector.cljs$lang$applyTo = function(arglist__15921) {
    var args = cljs.core.seq(arglist__15921);
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
cljs.core.ChunkedSeq.cljs$lang$ctorPrSeq = function(this__2311__auto__) {
  return cljs.core.list.call(null, "cljs.core/ChunkedSeq")
};
cljs.core.ChunkedSeq.prototype.cljs$core$INext$_next$arity$1 = function(coll) {
  var this__15922 = this;
  if(this__15922.off + 1 < this__15922.node.length) {
    var s__15923 = cljs.core.chunked_seq.call(null, this__15922.vec, this__15922.node, this__15922.i, this__15922.off + 1);
    if(s__15923 == null) {
      return null
    }else {
      return s__15923
    }
  }else {
    return coll.cljs$core$IChunkedNext$_chunked_next$arity$1(coll)
  }
};
cljs.core.ChunkedSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__15924 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.ChunkedSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__15925 = this;
  return coll
};
cljs.core.ChunkedSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__15926 = this;
  return this__15926.node[this__15926.off]
};
cljs.core.ChunkedSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__15927 = this;
  if(this__15927.off + 1 < this__15927.node.length) {
    var s__15928 = cljs.core.chunked_seq.call(null, this__15927.vec, this__15927.node, this__15927.i, this__15927.off + 1);
    if(s__15928 == null) {
      return cljs.core.List.EMPTY
    }else {
      return s__15928
    }
  }else {
    return coll.cljs$core$IChunkedSeq$_chunked_rest$arity$1(coll)
  }
};
cljs.core.ChunkedSeq.prototype.cljs$core$IChunkedNext$ = true;
cljs.core.ChunkedSeq.prototype.cljs$core$IChunkedNext$_chunked_next$arity$1 = function(coll) {
  var this__15929 = this;
  var l__15930 = this__15929.node.length;
  var s__15931 = this__15929.i + l__15930 < cljs.core._count.call(null, this__15929.vec) ? cljs.core.chunked_seq.call(null, this__15929.vec, this__15929.i + l__15930, 0) : null;
  if(s__15931 == null) {
    return null
  }else {
    return s__15931
  }
};
cljs.core.ChunkedSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__15932 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.ChunkedSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, m) {
  var this__15933 = this;
  return cljs.core.chunked_seq.call(null, this__15933.vec, this__15933.node, this__15933.i, this__15933.off, m)
};
cljs.core.ChunkedSeq.prototype.cljs$core$IWithMeta$_meta$arity$1 = function(coll) {
  var this__15934 = this;
  return this__15934.meta
};
cljs.core.ChunkedSeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__15935 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentVector.EMPTY, this__15935.meta)
};
cljs.core.ChunkedSeq.prototype.cljs$core$IChunkedSeq$ = true;
cljs.core.ChunkedSeq.prototype.cljs$core$IChunkedSeq$_chunked_first$arity$1 = function(coll) {
  var this__15936 = this;
  return cljs.core.array_chunk.call(null, this__15936.node, this__15936.off)
};
cljs.core.ChunkedSeq.prototype.cljs$core$IChunkedSeq$_chunked_rest$arity$1 = function(coll) {
  var this__15937 = this;
  var l__15938 = this__15937.node.length;
  var s__15939 = this__15937.i + l__15938 < cljs.core._count.call(null, this__15937.vec) ? cljs.core.chunked_seq.call(null, this__15937.vec, this__15937.i + l__15938, 0) : null;
  if(s__15939 == null) {
    return cljs.core.List.EMPTY
  }else {
    return s__15939
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
cljs.core.Subvec.cljs$lang$ctorPrSeq = function(this__2311__auto__) {
  return cljs.core.list.call(null, "cljs.core/Subvec")
};
cljs.core.Subvec.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__15942 = this;
  var h__2194__auto____15943 = this__15942.__hash;
  if(!(h__2194__auto____15943 == null)) {
    return h__2194__auto____15943
  }else {
    var h__2194__auto____15944 = cljs.core.hash_coll.call(null, coll);
    this__15942.__hash = h__2194__auto____15944;
    return h__2194__auto____15944
  }
};
cljs.core.Subvec.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__15945 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, null)
};
cljs.core.Subvec.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__15946 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, not_found)
};
cljs.core.Subvec.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, key, val) {
  var this__15947 = this;
  var v_pos__15948 = this__15947.start + key;
  return new cljs.core.Subvec(this__15947.meta, cljs.core._assoc.call(null, this__15947.v, v_pos__15948, val), this__15947.start, this__15947.end > v_pos__15948 + 1 ? this__15947.end : v_pos__15948 + 1, null)
};
cljs.core.Subvec.prototype.call = function() {
  var G__15974 = null;
  var G__15974__2 = function(this_sym15949, k) {
    var this__15951 = this;
    var this_sym15949__15952 = this;
    var coll__15953 = this_sym15949__15952;
    return coll__15953.cljs$core$ILookup$_lookup$arity$2(coll__15953, k)
  };
  var G__15974__3 = function(this_sym15950, k, not_found) {
    var this__15951 = this;
    var this_sym15950__15954 = this;
    var coll__15955 = this_sym15950__15954;
    return coll__15955.cljs$core$ILookup$_lookup$arity$3(coll__15955, k, not_found)
  };
  G__15974 = function(this_sym15950, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__15974__2.call(this, this_sym15950, k);
      case 3:
        return G__15974__3.call(this, this_sym15950, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__15974
}();
cljs.core.Subvec.prototype.apply = function(this_sym15940, args15941) {
  var this__15956 = this;
  return this_sym15940.call.apply(this_sym15940, [this_sym15940].concat(args15941.slice()))
};
cljs.core.Subvec.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__15957 = this;
  return new cljs.core.Subvec(this__15957.meta, cljs.core._assoc_n.call(null, this__15957.v, this__15957.end, o), this__15957.start, this__15957.end + 1, null)
};
cljs.core.Subvec.prototype.toString = function() {
  var this__15958 = this;
  var this__15959 = this;
  return cljs.core.pr_str.call(null, this__15959)
};
cljs.core.Subvec.prototype.cljs$core$IReduce$_reduce$arity$2 = function(coll, f) {
  var this__15960 = this;
  return cljs.core.ci_reduce.call(null, coll, f)
};
cljs.core.Subvec.prototype.cljs$core$IReduce$_reduce$arity$3 = function(coll, f, start) {
  var this__15961 = this;
  return cljs.core.ci_reduce.call(null, coll, f, start)
};
cljs.core.Subvec.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__15962 = this;
  var subvec_seq__15963 = function subvec_seq(i) {
    if(i === this__15962.end) {
      return null
    }else {
      return cljs.core.cons.call(null, cljs.core._nth.call(null, this__15962.v, i), new cljs.core.LazySeq(null, false, function() {
        return subvec_seq.call(null, i + 1)
      }, null))
    }
  };
  return subvec_seq__15963.call(null, this__15962.start)
};
cljs.core.Subvec.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__15964 = this;
  return this__15964.end - this__15964.start
};
cljs.core.Subvec.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__15965 = this;
  return cljs.core._nth.call(null, this__15965.v, this__15965.end - 1)
};
cljs.core.Subvec.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__15966 = this;
  if(this__15966.start === this__15966.end) {
    throw new Error("Can't pop empty vector");
  }else {
    return new cljs.core.Subvec(this__15966.meta, this__15966.v, this__15966.start, this__15966.end - 1, null)
  }
};
cljs.core.Subvec.prototype.cljs$core$IVector$_assoc_n$arity$3 = function(coll, n, val) {
  var this__15967 = this;
  return coll.cljs$core$IAssociative$_assoc$arity$3(coll, n, val)
};
cljs.core.Subvec.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__15968 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.Subvec.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__15969 = this;
  return new cljs.core.Subvec(meta, this__15969.v, this__15969.start, this__15969.end, this__15969.__hash)
};
cljs.core.Subvec.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__15970 = this;
  return this__15970.meta
};
cljs.core.Subvec.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, n) {
  var this__15971 = this;
  return cljs.core._nth.call(null, this__15971.v, this__15971.start + n)
};
cljs.core.Subvec.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, n, not_found) {
  var this__15972 = this;
  return cljs.core._nth.call(null, this__15972.v, this__15972.start + n, not_found)
};
cljs.core.Subvec.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__15973 = this;
  return cljs.core.with_meta.call(null, cljs.core.Vector.EMPTY, this__15973.meta)
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
  var ret__15976 = cljs.core.make_array.call(null, 32);
  cljs.core.array_copy.call(null, tl, 0, ret__15976, 0, tl.length);
  return ret__15976
};
cljs.core.tv_push_tail = function tv_push_tail(tv, level, parent, tail_node) {
  var ret__15980 = cljs.core.tv_ensure_editable.call(null, tv.root.edit, parent);
  var subidx__15981 = tv.cnt - 1 >>> level & 31;
  cljs.core.pv_aset.call(null, ret__15980, subidx__15981, level === 5 ? tail_node : function() {
    var child__15982 = cljs.core.pv_aget.call(null, ret__15980, subidx__15981);
    if(!(child__15982 == null)) {
      return tv_push_tail.call(null, tv, level - 5, child__15982, tail_node)
    }else {
      return cljs.core.new_path.call(null, tv.root.edit, level - 5, tail_node)
    }
  }());
  return ret__15980
};
cljs.core.tv_pop_tail = function tv_pop_tail(tv, level, node) {
  var node__15987 = cljs.core.tv_ensure_editable.call(null, tv.root.edit, node);
  var subidx__15988 = tv.cnt - 2 >>> level & 31;
  if(level > 5) {
    var new_child__15989 = tv_pop_tail.call(null, tv, level - 5, cljs.core.pv_aget.call(null, node__15987, subidx__15988));
    if(function() {
      var and__3822__auto____15990 = new_child__15989 == null;
      if(and__3822__auto____15990) {
        return subidx__15988 === 0
      }else {
        return and__3822__auto____15990
      }
    }()) {
      return null
    }else {
      cljs.core.pv_aset.call(null, node__15987, subidx__15988, new_child__15989);
      return node__15987
    }
  }else {
    if(subidx__15988 === 0) {
      return null
    }else {
      if("\ufdd0'else") {
        cljs.core.pv_aset.call(null, node__15987, subidx__15988, null);
        return node__15987
      }else {
        return null
      }
    }
  }
};
cljs.core.editable_array_for = function editable_array_for(tv, i) {
  if(function() {
    var and__3822__auto____15995 = 0 <= i;
    if(and__3822__auto____15995) {
      return i < tv.cnt
    }else {
      return and__3822__auto____15995
    }
  }()) {
    if(i >= cljs.core.tail_off.call(null, tv)) {
      return tv.tail
    }else {
      var root__15996 = tv.root;
      var node__15997 = root__15996;
      var level__15998 = tv.shift;
      while(true) {
        if(level__15998 > 0) {
          var G__15999 = cljs.core.tv_ensure_editable.call(null, root__15996.edit, cljs.core.pv_aget.call(null, node__15997, i >>> level__15998 & 31));
          var G__16000 = level__15998 - 5;
          node__15997 = G__15999;
          level__15998 = G__16000;
          continue
        }else {
          return node__15997.arr
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
cljs.core.TransientVector.cljs$lang$ctorPrSeq = function(this__2311__auto__) {
  return cljs.core.list.call(null, "cljs.core/TransientVector")
};
cljs.core.TransientVector.prototype.call = function() {
  var G__16040 = null;
  var G__16040__2 = function(this_sym16003, k) {
    var this__16005 = this;
    var this_sym16003__16006 = this;
    var coll__16007 = this_sym16003__16006;
    return coll__16007.cljs$core$ILookup$_lookup$arity$2(coll__16007, k)
  };
  var G__16040__3 = function(this_sym16004, k, not_found) {
    var this__16005 = this;
    var this_sym16004__16008 = this;
    var coll__16009 = this_sym16004__16008;
    return coll__16009.cljs$core$ILookup$_lookup$arity$3(coll__16009, k, not_found)
  };
  G__16040 = function(this_sym16004, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__16040__2.call(this, this_sym16004, k);
      case 3:
        return G__16040__3.call(this, this_sym16004, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__16040
}();
cljs.core.TransientVector.prototype.apply = function(this_sym16001, args16002) {
  var this__16010 = this;
  return this_sym16001.call.apply(this_sym16001, [this_sym16001].concat(args16002.slice()))
};
cljs.core.TransientVector.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__16011 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, null)
};
cljs.core.TransientVector.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__16012 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, not_found)
};
cljs.core.TransientVector.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, n) {
  var this__16013 = this;
  if(this__16013.root.edit) {
    return cljs.core.array_for.call(null, coll, n)[n & 31]
  }else {
    throw new Error("nth after persistent!");
  }
};
cljs.core.TransientVector.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, n, not_found) {
  var this__16014 = this;
  if(function() {
    var and__3822__auto____16015 = 0 <= n;
    if(and__3822__auto____16015) {
      return n < this__16014.cnt
    }else {
      return and__3822__auto____16015
    }
  }()) {
    return coll.cljs$core$IIndexed$_nth$arity$2(coll, n)
  }else {
    return not_found
  }
};
cljs.core.TransientVector.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__16016 = this;
  if(this__16016.root.edit) {
    return this__16016.cnt
  }else {
    throw new Error("count after persistent!");
  }
};
cljs.core.TransientVector.prototype.cljs$core$ITransientVector$_assoc_n_BANG_$arity$3 = function(tcoll, n, val) {
  var this__16017 = this;
  if(this__16017.root.edit) {
    if(function() {
      var and__3822__auto____16018 = 0 <= n;
      if(and__3822__auto____16018) {
        return n < this__16017.cnt
      }else {
        return and__3822__auto____16018
      }
    }()) {
      if(cljs.core.tail_off.call(null, tcoll) <= n) {
        this__16017.tail[n & 31] = val;
        return tcoll
      }else {
        var new_root__16023 = function go(level, node) {
          var node__16021 = cljs.core.tv_ensure_editable.call(null, this__16017.root.edit, node);
          if(level === 0) {
            cljs.core.pv_aset.call(null, node__16021, n & 31, val);
            return node__16021
          }else {
            var subidx__16022 = n >>> level & 31;
            cljs.core.pv_aset.call(null, node__16021, subidx__16022, go.call(null, level - 5, cljs.core.pv_aget.call(null, node__16021, subidx__16022)));
            return node__16021
          }
        }.call(null, this__16017.shift, this__16017.root);
        this__16017.root = new_root__16023;
        return tcoll
      }
    }else {
      if(n === this__16017.cnt) {
        return tcoll.cljs$core$ITransientCollection$_conj_BANG_$arity$2(tcoll, val)
      }else {
        if("\ufdd0'else") {
          throw new Error([cljs.core.str("Index "), cljs.core.str(n), cljs.core.str(" out of bounds for TransientVector of length"), cljs.core.str(this__16017.cnt)].join(""));
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
  var this__16024 = this;
  if(this__16024.root.edit) {
    if(this__16024.cnt === 0) {
      throw new Error("Can't pop empty vector");
    }else {
      if(1 === this__16024.cnt) {
        this__16024.cnt = 0;
        return tcoll
      }else {
        if((this__16024.cnt - 1 & 31) > 0) {
          this__16024.cnt = this__16024.cnt - 1;
          return tcoll
        }else {
          if("\ufdd0'else") {
            var new_tail__16025 = cljs.core.editable_array_for.call(null, tcoll, this__16024.cnt - 2);
            var new_root__16027 = function() {
              var nr__16026 = cljs.core.tv_pop_tail.call(null, tcoll, this__16024.shift, this__16024.root);
              if(!(nr__16026 == null)) {
                return nr__16026
              }else {
                return new cljs.core.VectorNode(this__16024.root.edit, cljs.core.make_array.call(null, 32))
              }
            }();
            if(function() {
              var and__3822__auto____16028 = 5 < this__16024.shift;
              if(and__3822__auto____16028) {
                return cljs.core.pv_aget.call(null, new_root__16027, 1) == null
              }else {
                return and__3822__auto____16028
              }
            }()) {
              var new_root__16029 = cljs.core.tv_ensure_editable.call(null, this__16024.root.edit, cljs.core.pv_aget.call(null, new_root__16027, 0));
              this__16024.root = new_root__16029;
              this__16024.shift = this__16024.shift - 5;
              this__16024.cnt = this__16024.cnt - 1;
              this__16024.tail = new_tail__16025;
              return tcoll
            }else {
              this__16024.root = new_root__16027;
              this__16024.cnt = this__16024.cnt - 1;
              this__16024.tail = new_tail__16025;
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
  var this__16030 = this;
  return tcoll.cljs$core$ITransientVector$_assoc_n_BANG_$arity$3(tcoll, key, val)
};
cljs.core.TransientVector.prototype.cljs$core$ITransientCollection$_conj_BANG_$arity$2 = function(tcoll, o) {
  var this__16031 = this;
  if(this__16031.root.edit) {
    if(this__16031.cnt - cljs.core.tail_off.call(null, tcoll) < 32) {
      this__16031.tail[this__16031.cnt & 31] = o;
      this__16031.cnt = this__16031.cnt + 1;
      return tcoll
    }else {
      var tail_node__16032 = new cljs.core.VectorNode(this__16031.root.edit, this__16031.tail);
      var new_tail__16033 = cljs.core.make_array.call(null, 32);
      new_tail__16033[0] = o;
      this__16031.tail = new_tail__16033;
      if(this__16031.cnt >>> 5 > 1 << this__16031.shift) {
        var new_root_array__16034 = cljs.core.make_array.call(null, 32);
        var new_shift__16035 = this__16031.shift + 5;
        new_root_array__16034[0] = this__16031.root;
        new_root_array__16034[1] = cljs.core.new_path.call(null, this__16031.root.edit, this__16031.shift, tail_node__16032);
        this__16031.root = new cljs.core.VectorNode(this__16031.root.edit, new_root_array__16034);
        this__16031.shift = new_shift__16035;
        this__16031.cnt = this__16031.cnt + 1;
        return tcoll
      }else {
        var new_root__16036 = cljs.core.tv_push_tail.call(null, tcoll, this__16031.shift, this__16031.root, tail_node__16032);
        this__16031.root = new_root__16036;
        this__16031.cnt = this__16031.cnt + 1;
        return tcoll
      }
    }
  }else {
    throw new Error("conj! after persistent!");
  }
};
cljs.core.TransientVector.prototype.cljs$core$ITransientCollection$_persistent_BANG_$arity$1 = function(tcoll) {
  var this__16037 = this;
  if(this__16037.root.edit) {
    this__16037.root.edit = null;
    var len__16038 = this__16037.cnt - cljs.core.tail_off.call(null, tcoll);
    var trimmed_tail__16039 = cljs.core.make_array.call(null, len__16038);
    cljs.core.array_copy.call(null, this__16037.tail, 0, trimmed_tail__16039, 0, len__16038);
    return new cljs.core.PersistentVector(null, this__16037.cnt, this__16037.shift, this__16037.root, trimmed_tail__16039, null)
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
cljs.core.PersistentQueueSeq.cljs$lang$ctorPrSeq = function(this__2311__auto__) {
  return cljs.core.list.call(null, "cljs.core/PersistentQueueSeq")
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__16041 = this;
  var h__2194__auto____16042 = this__16041.__hash;
  if(!(h__2194__auto____16042 == null)) {
    return h__2194__auto____16042
  }else {
    var h__2194__auto____16043 = cljs.core.hash_coll.call(null, coll);
    this__16041.__hash = h__2194__auto____16043;
    return h__2194__auto____16043
  }
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__16044 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.PersistentQueueSeq.prototype.toString = function() {
  var this__16045 = this;
  var this__16046 = this;
  return cljs.core.pr_str.call(null, this__16046)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__16047 = this;
  return coll
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__16048 = this;
  return cljs.core._first.call(null, this__16048.front)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__16049 = this;
  var temp__3971__auto____16050 = cljs.core.next.call(null, this__16049.front);
  if(temp__3971__auto____16050) {
    var f1__16051 = temp__3971__auto____16050;
    return new cljs.core.PersistentQueueSeq(this__16049.meta, f1__16051, this__16049.rear, null)
  }else {
    if(this__16049.rear == null) {
      return coll.cljs$core$IEmptyableCollection$_empty$arity$1(coll)
    }else {
      return new cljs.core.PersistentQueueSeq(this__16049.meta, this__16049.rear, null, null)
    }
  }
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__16052 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__16053 = this;
  return new cljs.core.PersistentQueueSeq(meta, this__16053.front, this__16053.rear, this__16053.__hash)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__16054 = this;
  return this__16054.meta
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__16055 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__16055.meta)
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
cljs.core.PersistentQueue.cljs$lang$ctorPrSeq = function(this__2311__auto__) {
  return cljs.core.list.call(null, "cljs.core/PersistentQueue")
};
cljs.core.PersistentQueue.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__16056 = this;
  var h__2194__auto____16057 = this__16056.__hash;
  if(!(h__2194__auto____16057 == null)) {
    return h__2194__auto____16057
  }else {
    var h__2194__auto____16058 = cljs.core.hash_coll.call(null, coll);
    this__16056.__hash = h__2194__auto____16058;
    return h__2194__auto____16058
  }
};
cljs.core.PersistentQueue.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__16059 = this;
  if(cljs.core.truth_(this__16059.front)) {
    return new cljs.core.PersistentQueue(this__16059.meta, this__16059.count + 1, this__16059.front, cljs.core.conj.call(null, function() {
      var or__3824__auto____16060 = this__16059.rear;
      if(cljs.core.truth_(or__3824__auto____16060)) {
        return or__3824__auto____16060
      }else {
        return cljs.core.PersistentVector.EMPTY
      }
    }(), o), null)
  }else {
    return new cljs.core.PersistentQueue(this__16059.meta, this__16059.count + 1, cljs.core.conj.call(null, this__16059.front, o), cljs.core.PersistentVector.EMPTY, null)
  }
};
cljs.core.PersistentQueue.prototype.toString = function() {
  var this__16061 = this;
  var this__16062 = this;
  return cljs.core.pr_str.call(null, this__16062)
};
cljs.core.PersistentQueue.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__16063 = this;
  var rear__16064 = cljs.core.seq.call(null, this__16063.rear);
  if(cljs.core.truth_(function() {
    var or__3824__auto____16065 = this__16063.front;
    if(cljs.core.truth_(or__3824__auto____16065)) {
      return or__3824__auto____16065
    }else {
      return rear__16064
    }
  }())) {
    return new cljs.core.PersistentQueueSeq(null, this__16063.front, cljs.core.seq.call(null, rear__16064), null)
  }else {
    return null
  }
};
cljs.core.PersistentQueue.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__16066 = this;
  return this__16066.count
};
cljs.core.PersistentQueue.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__16067 = this;
  return cljs.core._first.call(null, this__16067.front)
};
cljs.core.PersistentQueue.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__16068 = this;
  if(cljs.core.truth_(this__16068.front)) {
    var temp__3971__auto____16069 = cljs.core.next.call(null, this__16068.front);
    if(temp__3971__auto____16069) {
      var f1__16070 = temp__3971__auto____16069;
      return new cljs.core.PersistentQueue(this__16068.meta, this__16068.count - 1, f1__16070, this__16068.rear, null)
    }else {
      return new cljs.core.PersistentQueue(this__16068.meta, this__16068.count - 1, cljs.core.seq.call(null, this__16068.rear), cljs.core.PersistentVector.EMPTY, null)
    }
  }else {
    return coll
  }
};
cljs.core.PersistentQueue.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__16071 = this;
  return cljs.core.first.call(null, this__16071.front)
};
cljs.core.PersistentQueue.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__16072 = this;
  return cljs.core.rest.call(null, cljs.core.seq.call(null, coll))
};
cljs.core.PersistentQueue.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__16073 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.PersistentQueue.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__16074 = this;
  return new cljs.core.PersistentQueue(meta, this__16074.count, this__16074.front, this__16074.rear, this__16074.__hash)
};
cljs.core.PersistentQueue.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__16075 = this;
  return this__16075.meta
};
cljs.core.PersistentQueue.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__16076 = this;
  return cljs.core.PersistentQueue.EMPTY
};
cljs.core.PersistentQueue;
cljs.core.PersistentQueue.EMPTY = new cljs.core.PersistentQueue(null, 0, null, cljs.core.PersistentVector.EMPTY, 0);
cljs.core.NeverEquiv = function() {
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 2097152
};
cljs.core.NeverEquiv.cljs$lang$type = true;
cljs.core.NeverEquiv.cljs$lang$ctorPrSeq = function(this__2311__auto__) {
  return cljs.core.list.call(null, "cljs.core/NeverEquiv")
};
cljs.core.NeverEquiv.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(o, other) {
  var this__16077 = this;
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
  var len__16080 = array.length;
  var i__16081 = 0;
  while(true) {
    if(i__16081 < len__16080) {
      if(k === array[i__16081]) {
        return i__16081
      }else {
        var G__16082 = i__16081 + incr;
        i__16081 = G__16082;
        continue
      }
    }else {
      return null
    }
    break
  }
};
cljs.core.obj_map_compare_keys = function obj_map_compare_keys(a, b) {
  var a__16085 = cljs.core.hash.call(null, a);
  var b__16086 = cljs.core.hash.call(null, b);
  if(a__16085 < b__16086) {
    return-1
  }else {
    if(a__16085 > b__16086) {
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
  var ks__16094 = m.keys;
  var len__16095 = ks__16094.length;
  var so__16096 = m.strobj;
  var out__16097 = cljs.core.with_meta.call(null, cljs.core.PersistentHashMap.EMPTY, cljs.core.meta.call(null, m));
  var i__16098 = 0;
  var out__16099 = cljs.core.transient$.call(null, out__16097);
  while(true) {
    if(i__16098 < len__16095) {
      var k__16100 = ks__16094[i__16098];
      var G__16101 = i__16098 + 1;
      var G__16102 = cljs.core.assoc_BANG_.call(null, out__16099, k__16100, so__16096[k__16100]);
      i__16098 = G__16101;
      out__16099 = G__16102;
      continue
    }else {
      return cljs.core.persistent_BANG_.call(null, cljs.core.assoc_BANG_.call(null, out__16099, k, v))
    }
    break
  }
};
cljs.core.obj_clone = function obj_clone(obj, ks) {
  var new_obj__16108 = {};
  var l__16109 = ks.length;
  var i__16110 = 0;
  while(true) {
    if(i__16110 < l__16109) {
      var k__16111 = ks[i__16110];
      new_obj__16108[k__16111] = obj[k__16111];
      var G__16112 = i__16110 + 1;
      i__16110 = G__16112;
      continue
    }else {
    }
    break
  }
  return new_obj__16108
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
cljs.core.ObjMap.cljs$lang$ctorPrSeq = function(this__2311__auto__) {
  return cljs.core.list.call(null, "cljs.core/ObjMap")
};
cljs.core.ObjMap.prototype.cljs$core$IEditableCollection$_as_transient$arity$1 = function(coll) {
  var this__16115 = this;
  return cljs.core.transient$.call(null, cljs.core.into.call(null, cljs.core.hash_map.call(null), coll))
};
cljs.core.ObjMap.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__16116 = this;
  var h__2194__auto____16117 = this__16116.__hash;
  if(!(h__2194__auto____16117 == null)) {
    return h__2194__auto____16117
  }else {
    var h__2194__auto____16118 = cljs.core.hash_imap.call(null, coll);
    this__16116.__hash = h__2194__auto____16118;
    return h__2194__auto____16118
  }
};
cljs.core.ObjMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__16119 = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(coll, k, null)
};
cljs.core.ObjMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__16120 = this;
  if(function() {
    var and__3822__auto____16121 = goog.isString(k);
    if(and__3822__auto____16121) {
      return!(cljs.core.scan_array.call(null, 1, k, this__16120.keys) == null)
    }else {
      return and__3822__auto____16121
    }
  }()) {
    return this__16120.strobj[k]
  }else {
    return not_found
  }
};
cljs.core.ObjMap.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__16122 = this;
  if(goog.isString(k)) {
    if(function() {
      var or__3824__auto____16123 = this__16122.update_count > cljs.core.ObjMap.HASHMAP_THRESHOLD;
      if(or__3824__auto____16123) {
        return or__3824__auto____16123
      }else {
        return this__16122.keys.length >= cljs.core.ObjMap.HASHMAP_THRESHOLD
      }
    }()) {
      return cljs.core.obj_map__GT_hash_map.call(null, coll, k, v)
    }else {
      if(!(cljs.core.scan_array.call(null, 1, k, this__16122.keys) == null)) {
        var new_strobj__16124 = cljs.core.obj_clone.call(null, this__16122.strobj, this__16122.keys);
        new_strobj__16124[k] = v;
        return new cljs.core.ObjMap(this__16122.meta, this__16122.keys, new_strobj__16124, this__16122.update_count + 1, null)
      }else {
        var new_strobj__16125 = cljs.core.obj_clone.call(null, this__16122.strobj, this__16122.keys);
        var new_keys__16126 = this__16122.keys.slice();
        new_strobj__16125[k] = v;
        new_keys__16126.push(k);
        return new cljs.core.ObjMap(this__16122.meta, new_keys__16126, new_strobj__16125, this__16122.update_count + 1, null)
      }
    }
  }else {
    return cljs.core.obj_map__GT_hash_map.call(null, coll, k, v)
  }
};
cljs.core.ObjMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = function(coll, k) {
  var this__16127 = this;
  if(function() {
    var and__3822__auto____16128 = goog.isString(k);
    if(and__3822__auto____16128) {
      return!(cljs.core.scan_array.call(null, 1, k, this__16127.keys) == null)
    }else {
      return and__3822__auto____16128
    }
  }()) {
    return true
  }else {
    return false
  }
};
cljs.core.ObjMap.prototype.call = function() {
  var G__16150 = null;
  var G__16150__2 = function(this_sym16129, k) {
    var this__16131 = this;
    var this_sym16129__16132 = this;
    var coll__16133 = this_sym16129__16132;
    return coll__16133.cljs$core$ILookup$_lookup$arity$2(coll__16133, k)
  };
  var G__16150__3 = function(this_sym16130, k, not_found) {
    var this__16131 = this;
    var this_sym16130__16134 = this;
    var coll__16135 = this_sym16130__16134;
    return coll__16135.cljs$core$ILookup$_lookup$arity$3(coll__16135, k, not_found)
  };
  G__16150 = function(this_sym16130, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__16150__2.call(this, this_sym16130, k);
      case 3:
        return G__16150__3.call(this, this_sym16130, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__16150
}();
cljs.core.ObjMap.prototype.apply = function(this_sym16113, args16114) {
  var this__16136 = this;
  return this_sym16113.call.apply(this_sym16113, [this_sym16113].concat(args16114.slice()))
};
cljs.core.ObjMap.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, entry) {
  var this__16137 = this;
  if(cljs.core.vector_QMARK_.call(null, entry)) {
    return coll.cljs$core$IAssociative$_assoc$arity$3(coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.ObjMap.prototype.toString = function() {
  var this__16138 = this;
  var this__16139 = this;
  return cljs.core.pr_str.call(null, this__16139)
};
cljs.core.ObjMap.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__16140 = this;
  if(this__16140.keys.length > 0) {
    return cljs.core.map.call(null, function(p1__16103_SHARP_) {
      return cljs.core.vector.call(null, p1__16103_SHARP_, this__16140.strobj[p1__16103_SHARP_])
    }, this__16140.keys.sort(cljs.core.obj_map_compare_keys))
  }else {
    return null
  }
};
cljs.core.ObjMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__16141 = this;
  return this__16141.keys.length
};
cljs.core.ObjMap.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__16142 = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.ObjMap.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__16143 = this;
  return new cljs.core.ObjMap(meta, this__16143.keys, this__16143.strobj, this__16143.update_count, this__16143.__hash)
};
cljs.core.ObjMap.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__16144 = this;
  return this__16144.meta
};
cljs.core.ObjMap.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__16145 = this;
  return cljs.core.with_meta.call(null, cljs.core.ObjMap.EMPTY, this__16145.meta)
};
cljs.core.ObjMap.prototype.cljs$core$IMap$_dissoc$arity$2 = function(coll, k) {
  var this__16146 = this;
  if(function() {
    var and__3822__auto____16147 = goog.isString(k);
    if(and__3822__auto____16147) {
      return!(cljs.core.scan_array.call(null, 1, k, this__16146.keys) == null)
    }else {
      return and__3822__auto____16147
    }
  }()) {
    var new_keys__16148 = this__16146.keys.slice();
    var new_strobj__16149 = cljs.core.obj_clone.call(null, this__16146.strobj, this__16146.keys);
    new_keys__16148.splice(cljs.core.scan_array.call(null, 1, k, new_keys__16148), 1);
    cljs.core.js_delete.call(null, new_strobj__16149, k);
    return new cljs.core.ObjMap(this__16146.meta, new_keys__16148, new_strobj__16149, this__16146.update_count + 1, null)
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
cljs.core.HashMap.cljs$lang$ctorPrSeq = function(this__2311__auto__) {
  return cljs.core.list.call(null, "cljs.core/HashMap")
};
cljs.core.HashMap.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__16154 = this;
  var h__2194__auto____16155 = this__16154.__hash;
  if(!(h__2194__auto____16155 == null)) {
    return h__2194__auto____16155
  }else {
    var h__2194__auto____16156 = cljs.core.hash_imap.call(null, coll);
    this__16154.__hash = h__2194__auto____16156;
    return h__2194__auto____16156
  }
};
cljs.core.HashMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__16157 = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(coll, k, null)
};
cljs.core.HashMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__16158 = this;
  var bucket__16159 = this__16158.hashobj[cljs.core.hash.call(null, k)];
  var i__16160 = cljs.core.truth_(bucket__16159) ? cljs.core.scan_array.call(null, 2, k, bucket__16159) : null;
  if(cljs.core.truth_(i__16160)) {
    return bucket__16159[i__16160 + 1]
  }else {
    return not_found
  }
};
cljs.core.HashMap.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__16161 = this;
  var h__16162 = cljs.core.hash.call(null, k);
  var bucket__16163 = this__16161.hashobj[h__16162];
  if(cljs.core.truth_(bucket__16163)) {
    var new_bucket__16164 = bucket__16163.slice();
    var new_hashobj__16165 = goog.object.clone(this__16161.hashobj);
    new_hashobj__16165[h__16162] = new_bucket__16164;
    var temp__3971__auto____16166 = cljs.core.scan_array.call(null, 2, k, new_bucket__16164);
    if(cljs.core.truth_(temp__3971__auto____16166)) {
      var i__16167 = temp__3971__auto____16166;
      new_bucket__16164[i__16167 + 1] = v;
      return new cljs.core.HashMap(this__16161.meta, this__16161.count, new_hashobj__16165, null)
    }else {
      new_bucket__16164.push(k, v);
      return new cljs.core.HashMap(this__16161.meta, this__16161.count + 1, new_hashobj__16165, null)
    }
  }else {
    var new_hashobj__16168 = goog.object.clone(this__16161.hashobj);
    new_hashobj__16168[h__16162] = [k, v];
    return new cljs.core.HashMap(this__16161.meta, this__16161.count + 1, new_hashobj__16168, null)
  }
};
cljs.core.HashMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = function(coll, k) {
  var this__16169 = this;
  var bucket__16170 = this__16169.hashobj[cljs.core.hash.call(null, k)];
  var i__16171 = cljs.core.truth_(bucket__16170) ? cljs.core.scan_array.call(null, 2, k, bucket__16170) : null;
  if(cljs.core.truth_(i__16171)) {
    return true
  }else {
    return false
  }
};
cljs.core.HashMap.prototype.call = function() {
  var G__16196 = null;
  var G__16196__2 = function(this_sym16172, k) {
    var this__16174 = this;
    var this_sym16172__16175 = this;
    var coll__16176 = this_sym16172__16175;
    return coll__16176.cljs$core$ILookup$_lookup$arity$2(coll__16176, k)
  };
  var G__16196__3 = function(this_sym16173, k, not_found) {
    var this__16174 = this;
    var this_sym16173__16177 = this;
    var coll__16178 = this_sym16173__16177;
    return coll__16178.cljs$core$ILookup$_lookup$arity$3(coll__16178, k, not_found)
  };
  G__16196 = function(this_sym16173, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__16196__2.call(this, this_sym16173, k);
      case 3:
        return G__16196__3.call(this, this_sym16173, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__16196
}();
cljs.core.HashMap.prototype.apply = function(this_sym16152, args16153) {
  var this__16179 = this;
  return this_sym16152.call.apply(this_sym16152, [this_sym16152].concat(args16153.slice()))
};
cljs.core.HashMap.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, entry) {
  var this__16180 = this;
  if(cljs.core.vector_QMARK_.call(null, entry)) {
    return coll.cljs$core$IAssociative$_assoc$arity$3(coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.HashMap.prototype.toString = function() {
  var this__16181 = this;
  var this__16182 = this;
  return cljs.core.pr_str.call(null, this__16182)
};
cljs.core.HashMap.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__16183 = this;
  if(this__16183.count > 0) {
    var hashes__16184 = cljs.core.js_keys.call(null, this__16183.hashobj).sort();
    return cljs.core.mapcat.call(null, function(p1__16151_SHARP_) {
      return cljs.core.map.call(null, cljs.core.vec, cljs.core.partition.call(null, 2, this__16183.hashobj[p1__16151_SHARP_]))
    }, hashes__16184)
  }else {
    return null
  }
};
cljs.core.HashMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__16185 = this;
  return this__16185.count
};
cljs.core.HashMap.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__16186 = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.HashMap.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__16187 = this;
  return new cljs.core.HashMap(meta, this__16187.count, this__16187.hashobj, this__16187.__hash)
};
cljs.core.HashMap.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__16188 = this;
  return this__16188.meta
};
cljs.core.HashMap.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__16189 = this;
  return cljs.core.with_meta.call(null, cljs.core.HashMap.EMPTY, this__16189.meta)
};
cljs.core.HashMap.prototype.cljs$core$IMap$_dissoc$arity$2 = function(coll, k) {
  var this__16190 = this;
  var h__16191 = cljs.core.hash.call(null, k);
  var bucket__16192 = this__16190.hashobj[h__16191];
  var i__16193 = cljs.core.truth_(bucket__16192) ? cljs.core.scan_array.call(null, 2, k, bucket__16192) : null;
  if(cljs.core.not.call(null, i__16193)) {
    return coll
  }else {
    var new_hashobj__16194 = goog.object.clone(this__16190.hashobj);
    if(3 > bucket__16192.length) {
      cljs.core.js_delete.call(null, new_hashobj__16194, h__16191)
    }else {
      var new_bucket__16195 = bucket__16192.slice();
      new_bucket__16195.splice(i__16193, 2);
      new_hashobj__16194[h__16191] = new_bucket__16195
    }
    return new cljs.core.HashMap(this__16190.meta, this__16190.count - 1, new_hashobj__16194, null)
  }
};
cljs.core.HashMap;
cljs.core.HashMap.EMPTY = new cljs.core.HashMap(null, 0, {}, 0);
cljs.core.HashMap.fromArrays = function(ks, vs) {
  var len__16197 = ks.length;
  var i__16198 = 0;
  var out__16199 = cljs.core.HashMap.EMPTY;
  while(true) {
    if(i__16198 < len__16197) {
      var G__16200 = i__16198 + 1;
      var G__16201 = cljs.core.assoc.call(null, out__16199, ks[i__16198], vs[i__16198]);
      i__16198 = G__16200;
      out__16199 = G__16201;
      continue
    }else {
      return out__16199
    }
    break
  }
};
cljs.core.array_map_index_of = function array_map_index_of(m, k) {
  var arr__16205 = m.arr;
  var len__16206 = arr__16205.length;
  var i__16207 = 0;
  while(true) {
    if(len__16206 <= i__16207) {
      return-1
    }else {
      if(cljs.core._EQ_.call(null, arr__16205[i__16207], k)) {
        return i__16207
      }else {
        if("\ufdd0'else") {
          var G__16208 = i__16207 + 2;
          i__16207 = G__16208;
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
cljs.core.PersistentArrayMap.cljs$lang$ctorPrSeq = function(this__2311__auto__) {
  return cljs.core.list.call(null, "cljs.core/PersistentArrayMap")
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IEditableCollection$_as_transient$arity$1 = function(coll) {
  var this__16211 = this;
  return new cljs.core.TransientArrayMap({}, this__16211.arr.length, this__16211.arr.slice())
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__16212 = this;
  var h__2194__auto____16213 = this__16212.__hash;
  if(!(h__2194__auto____16213 == null)) {
    return h__2194__auto____16213
  }else {
    var h__2194__auto____16214 = cljs.core.hash_imap.call(null, coll);
    this__16212.__hash = h__2194__auto____16214;
    return h__2194__auto____16214
  }
};
cljs.core.PersistentArrayMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__16215 = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(coll, k, null)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__16216 = this;
  var idx__16217 = cljs.core.array_map_index_of.call(null, coll, k);
  if(idx__16217 === -1) {
    return not_found
  }else {
    return this__16216.arr[idx__16217 + 1]
  }
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__16218 = this;
  var idx__16219 = cljs.core.array_map_index_of.call(null, coll, k);
  if(idx__16219 === -1) {
    if(this__16218.cnt < cljs.core.PersistentArrayMap.HASHMAP_THRESHOLD) {
      return new cljs.core.PersistentArrayMap(this__16218.meta, this__16218.cnt + 1, function() {
        var G__16220__16221 = this__16218.arr.slice();
        G__16220__16221.push(k);
        G__16220__16221.push(v);
        return G__16220__16221
      }(), null)
    }else {
      return cljs.core.persistent_BANG_.call(null, cljs.core.assoc_BANG_.call(null, cljs.core.transient$.call(null, cljs.core.into.call(null, cljs.core.PersistentHashMap.EMPTY, coll)), k, v))
    }
  }else {
    if(v === this__16218.arr[idx__16219 + 1]) {
      return coll
    }else {
      if("\ufdd0'else") {
        return new cljs.core.PersistentArrayMap(this__16218.meta, this__16218.cnt, function() {
          var G__16222__16223 = this__16218.arr.slice();
          G__16222__16223[idx__16219 + 1] = v;
          return G__16222__16223
        }(), null)
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = function(coll, k) {
  var this__16224 = this;
  return!(cljs.core.array_map_index_of.call(null, coll, k) === -1)
};
cljs.core.PersistentArrayMap.prototype.call = function() {
  var G__16256 = null;
  var G__16256__2 = function(this_sym16225, k) {
    var this__16227 = this;
    var this_sym16225__16228 = this;
    var coll__16229 = this_sym16225__16228;
    return coll__16229.cljs$core$ILookup$_lookup$arity$2(coll__16229, k)
  };
  var G__16256__3 = function(this_sym16226, k, not_found) {
    var this__16227 = this;
    var this_sym16226__16230 = this;
    var coll__16231 = this_sym16226__16230;
    return coll__16231.cljs$core$ILookup$_lookup$arity$3(coll__16231, k, not_found)
  };
  G__16256 = function(this_sym16226, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__16256__2.call(this, this_sym16226, k);
      case 3:
        return G__16256__3.call(this, this_sym16226, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__16256
}();
cljs.core.PersistentArrayMap.prototype.apply = function(this_sym16209, args16210) {
  var this__16232 = this;
  return this_sym16209.call.apply(this_sym16209, [this_sym16209].concat(args16210.slice()))
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IKVReduce$_kv_reduce$arity$3 = function(coll, f, init) {
  var this__16233 = this;
  var len__16234 = this__16233.arr.length;
  var i__16235 = 0;
  var init__16236 = init;
  while(true) {
    if(i__16235 < len__16234) {
      var init__16237 = f.call(null, init__16236, this__16233.arr[i__16235], this__16233.arr[i__16235 + 1]);
      if(cljs.core.reduced_QMARK_.call(null, init__16237)) {
        return cljs.core.deref.call(null, init__16237)
      }else {
        var G__16257 = i__16235 + 2;
        var G__16258 = init__16237;
        i__16235 = G__16257;
        init__16236 = G__16258;
        continue
      }
    }else {
      return null
    }
    break
  }
};
cljs.core.PersistentArrayMap.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, entry) {
  var this__16238 = this;
  if(cljs.core.vector_QMARK_.call(null, entry)) {
    return coll.cljs$core$IAssociative$_assoc$arity$3(coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.PersistentArrayMap.prototype.toString = function() {
  var this__16239 = this;
  var this__16240 = this;
  return cljs.core.pr_str.call(null, this__16240)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__16241 = this;
  if(this__16241.cnt > 0) {
    var len__16242 = this__16241.arr.length;
    var array_map_seq__16243 = function array_map_seq(i) {
      return new cljs.core.LazySeq(null, false, function() {
        if(i < len__16242) {
          return cljs.core.cons.call(null, cljs.core.PersistentVector.fromArray([this__16241.arr[i], this__16241.arr[i + 1]], true), array_map_seq.call(null, i + 2))
        }else {
          return null
        }
      }, null)
    };
    return array_map_seq__16243.call(null, 0)
  }else {
    return null
  }
};
cljs.core.PersistentArrayMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__16244 = this;
  return this__16244.cnt
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__16245 = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__16246 = this;
  return new cljs.core.PersistentArrayMap(meta, this__16246.cnt, this__16246.arr, this__16246.__hash)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__16247 = this;
  return this__16247.meta
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__16248 = this;
  return cljs.core._with_meta.call(null, cljs.core.PersistentArrayMap.EMPTY, this__16248.meta)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IMap$_dissoc$arity$2 = function(coll, k) {
  var this__16249 = this;
  var idx__16250 = cljs.core.array_map_index_of.call(null, coll, k);
  if(idx__16250 >= 0) {
    var len__16251 = this__16249.arr.length;
    var new_len__16252 = len__16251 - 2;
    if(new_len__16252 === 0) {
      return coll.cljs$core$IEmptyableCollection$_empty$arity$1(coll)
    }else {
      var new_arr__16253 = cljs.core.make_array.call(null, new_len__16252);
      var s__16254 = 0;
      var d__16255 = 0;
      while(true) {
        if(s__16254 >= len__16251) {
          return new cljs.core.PersistentArrayMap(this__16249.meta, this__16249.cnt - 1, new_arr__16253, null)
        }else {
          if(cljs.core._EQ_.call(null, k, this__16249.arr[s__16254])) {
            var G__16259 = s__16254 + 2;
            var G__16260 = d__16255;
            s__16254 = G__16259;
            d__16255 = G__16260;
            continue
          }else {
            if("\ufdd0'else") {
              new_arr__16253[d__16255] = this__16249.arr[s__16254];
              new_arr__16253[d__16255 + 1] = this__16249.arr[s__16254 + 1];
              var G__16261 = s__16254 + 2;
              var G__16262 = d__16255 + 2;
              s__16254 = G__16261;
              d__16255 = G__16262;
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
  var len__16263 = cljs.core.count.call(null, ks);
  var i__16264 = 0;
  var out__16265 = cljs.core.transient$.call(null, cljs.core.PersistentArrayMap.EMPTY);
  while(true) {
    if(i__16264 < len__16263) {
      var G__16266 = i__16264 + 1;
      var G__16267 = cljs.core.assoc_BANG_.call(null, out__16265, ks[i__16264], vs[i__16264]);
      i__16264 = G__16266;
      out__16265 = G__16267;
      continue
    }else {
      return cljs.core.persistent_BANG_.call(null, out__16265)
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
cljs.core.TransientArrayMap.cljs$lang$ctorPrSeq = function(this__2311__auto__) {
  return cljs.core.list.call(null, "cljs.core/TransientArrayMap")
};
cljs.core.TransientArrayMap.prototype.cljs$core$ITransientMap$_dissoc_BANG_$arity$2 = function(tcoll, key) {
  var this__16268 = this;
  if(cljs.core.truth_(this__16268.editable_QMARK_)) {
    var idx__16269 = cljs.core.array_map_index_of.call(null, tcoll, key);
    if(idx__16269 >= 0) {
      this__16268.arr[idx__16269] = this__16268.arr[this__16268.len - 2];
      this__16268.arr[idx__16269 + 1] = this__16268.arr[this__16268.len - 1];
      var G__16270__16271 = this__16268.arr;
      G__16270__16271.pop();
      G__16270__16271.pop();
      G__16270__16271;
      this__16268.len = this__16268.len - 2
    }else {
    }
    return tcoll
  }else {
    throw new Error("dissoc! after persistent!");
  }
};
cljs.core.TransientArrayMap.prototype.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3 = function(tcoll, key, val) {
  var this__16272 = this;
  if(cljs.core.truth_(this__16272.editable_QMARK_)) {
    var idx__16273 = cljs.core.array_map_index_of.call(null, tcoll, key);
    if(idx__16273 === -1) {
      if(this__16272.len + 2 <= 2 * cljs.core.PersistentArrayMap.HASHMAP_THRESHOLD) {
        this__16272.len = this__16272.len + 2;
        this__16272.arr.push(key);
        this__16272.arr.push(val);
        return tcoll
      }else {
        return cljs.core.assoc_BANG_.call(null, cljs.core.array__GT_transient_hash_map.call(null, this__16272.len, this__16272.arr), key, val)
      }
    }else {
      if(val === this__16272.arr[idx__16273 + 1]) {
        return tcoll
      }else {
        this__16272.arr[idx__16273 + 1] = val;
        return tcoll
      }
    }
  }else {
    throw new Error("assoc! after persistent!");
  }
};
cljs.core.TransientArrayMap.prototype.cljs$core$ITransientCollection$_conj_BANG_$arity$2 = function(tcoll, o) {
  var this__16274 = this;
  if(cljs.core.truth_(this__16274.editable_QMARK_)) {
    if(function() {
      var G__16275__16276 = o;
      if(G__16275__16276) {
        if(function() {
          var or__3824__auto____16277 = G__16275__16276.cljs$lang$protocol_mask$partition0$ & 2048;
          if(or__3824__auto____16277) {
            return or__3824__auto____16277
          }else {
            return G__16275__16276.cljs$core$IMapEntry$
          }
        }()) {
          return true
        }else {
          if(!G__16275__16276.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.IMapEntry, G__16275__16276)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.IMapEntry, G__16275__16276)
      }
    }()) {
      return tcoll.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3(tcoll, cljs.core.key.call(null, o), cljs.core.val.call(null, o))
    }else {
      var es__16278 = cljs.core.seq.call(null, o);
      var tcoll__16279 = tcoll;
      while(true) {
        var temp__3971__auto____16280 = cljs.core.first.call(null, es__16278);
        if(cljs.core.truth_(temp__3971__auto____16280)) {
          var e__16281 = temp__3971__auto____16280;
          var G__16287 = cljs.core.next.call(null, es__16278);
          var G__16288 = tcoll__16279.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3(tcoll__16279, cljs.core.key.call(null, e__16281), cljs.core.val.call(null, e__16281));
          es__16278 = G__16287;
          tcoll__16279 = G__16288;
          continue
        }else {
          return tcoll__16279
        }
        break
      }
    }
  }else {
    throw new Error("conj! after persistent!");
  }
};
cljs.core.TransientArrayMap.prototype.cljs$core$ITransientCollection$_persistent_BANG_$arity$1 = function(tcoll) {
  var this__16282 = this;
  if(cljs.core.truth_(this__16282.editable_QMARK_)) {
    this__16282.editable_QMARK_ = false;
    return new cljs.core.PersistentArrayMap(null, cljs.core.quot.call(null, this__16282.len, 2), this__16282.arr, null)
  }else {
    throw new Error("persistent! called twice");
  }
};
cljs.core.TransientArrayMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(tcoll, k) {
  var this__16283 = this;
  return tcoll.cljs$core$ILookup$_lookup$arity$3(tcoll, k, null)
};
cljs.core.TransientArrayMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(tcoll, k, not_found) {
  var this__16284 = this;
  if(cljs.core.truth_(this__16284.editable_QMARK_)) {
    var idx__16285 = cljs.core.array_map_index_of.call(null, tcoll, k);
    if(idx__16285 === -1) {
      return not_found
    }else {
      return this__16284.arr[idx__16285 + 1]
    }
  }else {
    throw new Error("lookup after persistent!");
  }
};
cljs.core.TransientArrayMap.prototype.cljs$core$ICounted$_count$arity$1 = function(tcoll) {
  var this__16286 = this;
  if(cljs.core.truth_(this__16286.editable_QMARK_)) {
    return cljs.core.quot.call(null, this__16286.len, 2)
  }else {
    throw new Error("count after persistent!");
  }
};
cljs.core.TransientArrayMap;
cljs.core.array__GT_transient_hash_map = function array__GT_transient_hash_map(len, arr) {
  var out__16291 = cljs.core.transient$.call(null, cljs.core.ObjMap.EMPTY);
  var i__16292 = 0;
  while(true) {
    if(i__16292 < len) {
      var G__16293 = cljs.core.assoc_BANG_.call(null, out__16291, arr[i__16292], arr[i__16292 + 1]);
      var G__16294 = i__16292 + 2;
      out__16291 = G__16293;
      i__16292 = G__16294;
      continue
    }else {
      return out__16291
    }
    break
  }
};
cljs.core.Box = function(val) {
  this.val = val
};
cljs.core.Box.cljs$lang$type = true;
cljs.core.Box.cljs$lang$ctorPrSeq = function(this__2312__auto__) {
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
    var G__16299__16300 = arr.slice();
    G__16299__16300[i] = a;
    return G__16299__16300
  };
  var clone_and_set__5 = function(arr, i, a, j, b) {
    var G__16301__16302 = arr.slice();
    G__16301__16302[i] = a;
    G__16301__16302[j] = b;
    return G__16301__16302
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
  var new_arr__16304 = cljs.core.make_array.call(null, arr.length - 2);
  cljs.core.array_copy.call(null, arr, 0, new_arr__16304, 0, 2 * i);
  cljs.core.array_copy.call(null, arr, 2 * (i + 1), new_arr__16304, 2 * i, new_arr__16304.length - 2 * i);
  return new_arr__16304
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
    var editable__16307 = inode.ensure_editable(edit);
    editable__16307.arr[i] = a;
    return editable__16307
  };
  var edit_and_set__6 = function(inode, edit, i, a, j, b) {
    var editable__16308 = inode.ensure_editable(edit);
    editable__16308.arr[i] = a;
    editable__16308.arr[j] = b;
    return editable__16308
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
  var len__16315 = arr.length;
  var i__16316 = 0;
  var init__16317 = init;
  while(true) {
    if(i__16316 < len__16315) {
      var init__16320 = function() {
        var k__16318 = arr[i__16316];
        if(!(k__16318 == null)) {
          return f.call(null, init__16317, k__16318, arr[i__16316 + 1])
        }else {
          var node__16319 = arr[i__16316 + 1];
          if(!(node__16319 == null)) {
            return node__16319.kv_reduce(f, init__16317)
          }else {
            return init__16317
          }
        }
      }();
      if(cljs.core.reduced_QMARK_.call(null, init__16320)) {
        return cljs.core.deref.call(null, init__16320)
      }else {
        var G__16321 = i__16316 + 2;
        var G__16322 = init__16320;
        i__16316 = G__16321;
        init__16317 = G__16322;
        continue
      }
    }else {
      return init__16317
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
cljs.core.BitmapIndexedNode.cljs$lang$ctorPrSeq = function(this__2311__auto__) {
  return cljs.core.list.call(null, "cljs.core/BitmapIndexedNode")
};
cljs.core.BitmapIndexedNode.prototype.edit_and_remove_pair = function(e, bit, i) {
  var this__16323 = this;
  var inode__16324 = this;
  if(this__16323.bitmap === bit) {
    return null
  }else {
    var editable__16325 = inode__16324.ensure_editable(e);
    var earr__16326 = editable__16325.arr;
    var len__16327 = earr__16326.length;
    editable__16325.bitmap = bit ^ editable__16325.bitmap;
    cljs.core.array_copy.call(null, earr__16326, 2 * (i + 1), earr__16326, 2 * i, len__16327 - 2 * (i + 1));
    earr__16326[len__16327 - 2] = null;
    earr__16326[len__16327 - 1] = null;
    return editable__16325
  }
};
cljs.core.BitmapIndexedNode.prototype.inode_assoc_BANG_ = function(edit, shift, hash, key, val, added_leaf_QMARK_) {
  var this__16328 = this;
  var inode__16329 = this;
  var bit__16330 = 1 << (hash >>> shift & 31);
  var idx__16331 = cljs.core.bitmap_indexed_node_index.call(null, this__16328.bitmap, bit__16330);
  if((this__16328.bitmap & bit__16330) === 0) {
    var n__16332 = cljs.core.bit_count.call(null, this__16328.bitmap);
    if(2 * n__16332 < this__16328.arr.length) {
      var editable__16333 = inode__16329.ensure_editable(edit);
      var earr__16334 = editable__16333.arr;
      added_leaf_QMARK_.val = true;
      cljs.core.array_copy_downward.call(null, earr__16334, 2 * idx__16331, earr__16334, 2 * (idx__16331 + 1), 2 * (n__16332 - idx__16331));
      earr__16334[2 * idx__16331] = key;
      earr__16334[2 * idx__16331 + 1] = val;
      editable__16333.bitmap = editable__16333.bitmap | bit__16330;
      return editable__16333
    }else {
      if(n__16332 >= 16) {
        var nodes__16335 = cljs.core.make_array.call(null, 32);
        var jdx__16336 = hash >>> shift & 31;
        nodes__16335[jdx__16336] = cljs.core.BitmapIndexedNode.EMPTY.inode_assoc_BANG_(edit, shift + 5, hash, key, val, added_leaf_QMARK_);
        var i__16337 = 0;
        var j__16338 = 0;
        while(true) {
          if(i__16337 < 32) {
            if((this__16328.bitmap >>> i__16337 & 1) === 0) {
              var G__16391 = i__16337 + 1;
              var G__16392 = j__16338;
              i__16337 = G__16391;
              j__16338 = G__16392;
              continue
            }else {
              nodes__16335[i__16337] = !(this__16328.arr[j__16338] == null) ? cljs.core.BitmapIndexedNode.EMPTY.inode_assoc_BANG_(edit, shift + 5, cljs.core.hash.call(null, this__16328.arr[j__16338]), this__16328.arr[j__16338], this__16328.arr[j__16338 + 1], added_leaf_QMARK_) : this__16328.arr[j__16338 + 1];
              var G__16393 = i__16337 + 1;
              var G__16394 = j__16338 + 2;
              i__16337 = G__16393;
              j__16338 = G__16394;
              continue
            }
          }else {
          }
          break
        }
        return new cljs.core.ArrayNode(edit, n__16332 + 1, nodes__16335)
      }else {
        if("\ufdd0'else") {
          var new_arr__16339 = cljs.core.make_array.call(null, 2 * (n__16332 + 4));
          cljs.core.array_copy.call(null, this__16328.arr, 0, new_arr__16339, 0, 2 * idx__16331);
          new_arr__16339[2 * idx__16331] = key;
          new_arr__16339[2 * idx__16331 + 1] = val;
          cljs.core.array_copy.call(null, this__16328.arr, 2 * idx__16331, new_arr__16339, 2 * (idx__16331 + 1), 2 * (n__16332 - idx__16331));
          added_leaf_QMARK_.val = true;
          var editable__16340 = inode__16329.ensure_editable(edit);
          editable__16340.arr = new_arr__16339;
          editable__16340.bitmap = editable__16340.bitmap | bit__16330;
          return editable__16340
        }else {
          return null
        }
      }
    }
  }else {
    var key_or_nil__16341 = this__16328.arr[2 * idx__16331];
    var val_or_node__16342 = this__16328.arr[2 * idx__16331 + 1];
    if(key_or_nil__16341 == null) {
      var n__16343 = val_or_node__16342.inode_assoc_BANG_(edit, shift + 5, hash, key, val, added_leaf_QMARK_);
      if(n__16343 === val_or_node__16342) {
        return inode__16329
      }else {
        return cljs.core.edit_and_set.call(null, inode__16329, edit, 2 * idx__16331 + 1, n__16343)
      }
    }else {
      if(cljs.core.key_test.call(null, key, key_or_nil__16341)) {
        if(val === val_or_node__16342) {
          return inode__16329
        }else {
          return cljs.core.edit_and_set.call(null, inode__16329, edit, 2 * idx__16331 + 1, val)
        }
      }else {
        if("\ufdd0'else") {
          added_leaf_QMARK_.val = true;
          return cljs.core.edit_and_set.call(null, inode__16329, edit, 2 * idx__16331, null, 2 * idx__16331 + 1, cljs.core.create_node.call(null, edit, shift + 5, key_or_nil__16341, val_or_node__16342, hash, key, val))
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.BitmapIndexedNode.prototype.inode_seq = function() {
  var this__16344 = this;
  var inode__16345 = this;
  return cljs.core.create_inode_seq.call(null, this__16344.arr)
};
cljs.core.BitmapIndexedNode.prototype.inode_without_BANG_ = function(edit, shift, hash, key, removed_leaf_QMARK_) {
  var this__16346 = this;
  var inode__16347 = this;
  var bit__16348 = 1 << (hash >>> shift & 31);
  if((this__16346.bitmap & bit__16348) === 0) {
    return inode__16347
  }else {
    var idx__16349 = cljs.core.bitmap_indexed_node_index.call(null, this__16346.bitmap, bit__16348);
    var key_or_nil__16350 = this__16346.arr[2 * idx__16349];
    var val_or_node__16351 = this__16346.arr[2 * idx__16349 + 1];
    if(key_or_nil__16350 == null) {
      var n__16352 = val_or_node__16351.inode_without_BANG_(edit, shift + 5, hash, key, removed_leaf_QMARK_);
      if(n__16352 === val_or_node__16351) {
        return inode__16347
      }else {
        if(!(n__16352 == null)) {
          return cljs.core.edit_and_set.call(null, inode__16347, edit, 2 * idx__16349 + 1, n__16352)
        }else {
          if(this__16346.bitmap === bit__16348) {
            return null
          }else {
            if("\ufdd0'else") {
              return inode__16347.edit_and_remove_pair(edit, bit__16348, idx__16349)
            }else {
              return null
            }
          }
        }
      }
    }else {
      if(cljs.core.key_test.call(null, key, key_or_nil__16350)) {
        removed_leaf_QMARK_[0] = true;
        return inode__16347.edit_and_remove_pair(edit, bit__16348, idx__16349)
      }else {
        if("\ufdd0'else") {
          return inode__16347
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.BitmapIndexedNode.prototype.ensure_editable = function(e) {
  var this__16353 = this;
  var inode__16354 = this;
  if(e === this__16353.edit) {
    return inode__16354
  }else {
    var n__16355 = cljs.core.bit_count.call(null, this__16353.bitmap);
    var new_arr__16356 = cljs.core.make_array.call(null, n__16355 < 0 ? 4 : 2 * (n__16355 + 1));
    cljs.core.array_copy.call(null, this__16353.arr, 0, new_arr__16356, 0, 2 * n__16355);
    return new cljs.core.BitmapIndexedNode(e, this__16353.bitmap, new_arr__16356)
  }
};
cljs.core.BitmapIndexedNode.prototype.kv_reduce = function(f, init) {
  var this__16357 = this;
  var inode__16358 = this;
  return cljs.core.inode_kv_reduce.call(null, this__16357.arr, f, init)
};
cljs.core.BitmapIndexedNode.prototype.inode_find = function(shift, hash, key, not_found) {
  var this__16359 = this;
  var inode__16360 = this;
  var bit__16361 = 1 << (hash >>> shift & 31);
  if((this__16359.bitmap & bit__16361) === 0) {
    return not_found
  }else {
    var idx__16362 = cljs.core.bitmap_indexed_node_index.call(null, this__16359.bitmap, bit__16361);
    var key_or_nil__16363 = this__16359.arr[2 * idx__16362];
    var val_or_node__16364 = this__16359.arr[2 * idx__16362 + 1];
    if(key_or_nil__16363 == null) {
      return val_or_node__16364.inode_find(shift + 5, hash, key, not_found)
    }else {
      if(cljs.core.key_test.call(null, key, key_or_nil__16363)) {
        return cljs.core.PersistentVector.fromArray([key_or_nil__16363, val_or_node__16364], true)
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
  var this__16365 = this;
  var inode__16366 = this;
  var bit__16367 = 1 << (hash >>> shift & 31);
  if((this__16365.bitmap & bit__16367) === 0) {
    return inode__16366
  }else {
    var idx__16368 = cljs.core.bitmap_indexed_node_index.call(null, this__16365.bitmap, bit__16367);
    var key_or_nil__16369 = this__16365.arr[2 * idx__16368];
    var val_or_node__16370 = this__16365.arr[2 * idx__16368 + 1];
    if(key_or_nil__16369 == null) {
      var n__16371 = val_or_node__16370.inode_without(shift + 5, hash, key);
      if(n__16371 === val_or_node__16370) {
        return inode__16366
      }else {
        if(!(n__16371 == null)) {
          return new cljs.core.BitmapIndexedNode(null, this__16365.bitmap, cljs.core.clone_and_set.call(null, this__16365.arr, 2 * idx__16368 + 1, n__16371))
        }else {
          if(this__16365.bitmap === bit__16367) {
            return null
          }else {
            if("\ufdd0'else") {
              return new cljs.core.BitmapIndexedNode(null, this__16365.bitmap ^ bit__16367, cljs.core.remove_pair.call(null, this__16365.arr, idx__16368))
            }else {
              return null
            }
          }
        }
      }
    }else {
      if(cljs.core.key_test.call(null, key, key_or_nil__16369)) {
        return new cljs.core.BitmapIndexedNode(null, this__16365.bitmap ^ bit__16367, cljs.core.remove_pair.call(null, this__16365.arr, idx__16368))
      }else {
        if("\ufdd0'else") {
          return inode__16366
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.BitmapIndexedNode.prototype.inode_assoc = function(shift, hash, key, val, added_leaf_QMARK_) {
  var this__16372 = this;
  var inode__16373 = this;
  var bit__16374 = 1 << (hash >>> shift & 31);
  var idx__16375 = cljs.core.bitmap_indexed_node_index.call(null, this__16372.bitmap, bit__16374);
  if((this__16372.bitmap & bit__16374) === 0) {
    var n__16376 = cljs.core.bit_count.call(null, this__16372.bitmap);
    if(n__16376 >= 16) {
      var nodes__16377 = cljs.core.make_array.call(null, 32);
      var jdx__16378 = hash >>> shift & 31;
      nodes__16377[jdx__16378] = cljs.core.BitmapIndexedNode.EMPTY.inode_assoc(shift + 5, hash, key, val, added_leaf_QMARK_);
      var i__16379 = 0;
      var j__16380 = 0;
      while(true) {
        if(i__16379 < 32) {
          if((this__16372.bitmap >>> i__16379 & 1) === 0) {
            var G__16395 = i__16379 + 1;
            var G__16396 = j__16380;
            i__16379 = G__16395;
            j__16380 = G__16396;
            continue
          }else {
            nodes__16377[i__16379] = !(this__16372.arr[j__16380] == null) ? cljs.core.BitmapIndexedNode.EMPTY.inode_assoc(shift + 5, cljs.core.hash.call(null, this__16372.arr[j__16380]), this__16372.arr[j__16380], this__16372.arr[j__16380 + 1], added_leaf_QMARK_) : this__16372.arr[j__16380 + 1];
            var G__16397 = i__16379 + 1;
            var G__16398 = j__16380 + 2;
            i__16379 = G__16397;
            j__16380 = G__16398;
            continue
          }
        }else {
        }
        break
      }
      return new cljs.core.ArrayNode(null, n__16376 + 1, nodes__16377)
    }else {
      var new_arr__16381 = cljs.core.make_array.call(null, 2 * (n__16376 + 1));
      cljs.core.array_copy.call(null, this__16372.arr, 0, new_arr__16381, 0, 2 * idx__16375);
      new_arr__16381[2 * idx__16375] = key;
      new_arr__16381[2 * idx__16375 + 1] = val;
      cljs.core.array_copy.call(null, this__16372.arr, 2 * idx__16375, new_arr__16381, 2 * (idx__16375 + 1), 2 * (n__16376 - idx__16375));
      added_leaf_QMARK_.val = true;
      return new cljs.core.BitmapIndexedNode(null, this__16372.bitmap | bit__16374, new_arr__16381)
    }
  }else {
    var key_or_nil__16382 = this__16372.arr[2 * idx__16375];
    var val_or_node__16383 = this__16372.arr[2 * idx__16375 + 1];
    if(key_or_nil__16382 == null) {
      var n__16384 = val_or_node__16383.inode_assoc(shift + 5, hash, key, val, added_leaf_QMARK_);
      if(n__16384 === val_or_node__16383) {
        return inode__16373
      }else {
        return new cljs.core.BitmapIndexedNode(null, this__16372.bitmap, cljs.core.clone_and_set.call(null, this__16372.arr, 2 * idx__16375 + 1, n__16384))
      }
    }else {
      if(cljs.core.key_test.call(null, key, key_or_nil__16382)) {
        if(val === val_or_node__16383) {
          return inode__16373
        }else {
          return new cljs.core.BitmapIndexedNode(null, this__16372.bitmap, cljs.core.clone_and_set.call(null, this__16372.arr, 2 * idx__16375 + 1, val))
        }
      }else {
        if("\ufdd0'else") {
          added_leaf_QMARK_.val = true;
          return new cljs.core.BitmapIndexedNode(null, this__16372.bitmap, cljs.core.clone_and_set.call(null, this__16372.arr, 2 * idx__16375, null, 2 * idx__16375 + 1, cljs.core.create_node.call(null, shift + 5, key_or_nil__16382, val_or_node__16383, hash, key, val)))
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.BitmapIndexedNode.prototype.inode_lookup = function(shift, hash, key, not_found) {
  var this__16385 = this;
  var inode__16386 = this;
  var bit__16387 = 1 << (hash >>> shift & 31);
  if((this__16385.bitmap & bit__16387) === 0) {
    return not_found
  }else {
    var idx__16388 = cljs.core.bitmap_indexed_node_index.call(null, this__16385.bitmap, bit__16387);
    var key_or_nil__16389 = this__16385.arr[2 * idx__16388];
    var val_or_node__16390 = this__16385.arr[2 * idx__16388 + 1];
    if(key_or_nil__16389 == null) {
      return val_or_node__16390.inode_lookup(shift + 5, hash, key, not_found)
    }else {
      if(cljs.core.key_test.call(null, key, key_or_nil__16389)) {
        return val_or_node__16390
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
  var arr__16406 = array_node.arr;
  var len__16407 = 2 * (array_node.cnt - 1);
  var new_arr__16408 = cljs.core.make_array.call(null, len__16407);
  var i__16409 = 0;
  var j__16410 = 1;
  var bitmap__16411 = 0;
  while(true) {
    if(i__16409 < len__16407) {
      if(function() {
        var and__3822__auto____16412 = !(i__16409 === idx);
        if(and__3822__auto____16412) {
          return!(arr__16406[i__16409] == null)
        }else {
          return and__3822__auto____16412
        }
      }()) {
        new_arr__16408[j__16410] = arr__16406[i__16409];
        var G__16413 = i__16409 + 1;
        var G__16414 = j__16410 + 2;
        var G__16415 = bitmap__16411 | 1 << i__16409;
        i__16409 = G__16413;
        j__16410 = G__16414;
        bitmap__16411 = G__16415;
        continue
      }else {
        var G__16416 = i__16409 + 1;
        var G__16417 = j__16410;
        var G__16418 = bitmap__16411;
        i__16409 = G__16416;
        j__16410 = G__16417;
        bitmap__16411 = G__16418;
        continue
      }
    }else {
      return new cljs.core.BitmapIndexedNode(edit, bitmap__16411, new_arr__16408)
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
cljs.core.ArrayNode.cljs$lang$ctorPrSeq = function(this__2311__auto__) {
  return cljs.core.list.call(null, "cljs.core/ArrayNode")
};
cljs.core.ArrayNode.prototype.inode_assoc_BANG_ = function(edit, shift, hash, key, val, added_leaf_QMARK_) {
  var this__16419 = this;
  var inode__16420 = this;
  var idx__16421 = hash >>> shift & 31;
  var node__16422 = this__16419.arr[idx__16421];
  if(node__16422 == null) {
    var editable__16423 = cljs.core.edit_and_set.call(null, inode__16420, edit, idx__16421, cljs.core.BitmapIndexedNode.EMPTY.inode_assoc_BANG_(edit, shift + 5, hash, key, val, added_leaf_QMARK_));
    editable__16423.cnt = editable__16423.cnt + 1;
    return editable__16423
  }else {
    var n__16424 = node__16422.inode_assoc_BANG_(edit, shift + 5, hash, key, val, added_leaf_QMARK_);
    if(n__16424 === node__16422) {
      return inode__16420
    }else {
      return cljs.core.edit_and_set.call(null, inode__16420, edit, idx__16421, n__16424)
    }
  }
};
cljs.core.ArrayNode.prototype.inode_seq = function() {
  var this__16425 = this;
  var inode__16426 = this;
  return cljs.core.create_array_node_seq.call(null, this__16425.arr)
};
cljs.core.ArrayNode.prototype.inode_without_BANG_ = function(edit, shift, hash, key, removed_leaf_QMARK_) {
  var this__16427 = this;
  var inode__16428 = this;
  var idx__16429 = hash >>> shift & 31;
  var node__16430 = this__16427.arr[idx__16429];
  if(node__16430 == null) {
    return inode__16428
  }else {
    var n__16431 = node__16430.inode_without_BANG_(edit, shift + 5, hash, key, removed_leaf_QMARK_);
    if(n__16431 === node__16430) {
      return inode__16428
    }else {
      if(n__16431 == null) {
        if(this__16427.cnt <= 8) {
          return cljs.core.pack_array_node.call(null, inode__16428, edit, idx__16429)
        }else {
          var editable__16432 = cljs.core.edit_and_set.call(null, inode__16428, edit, idx__16429, n__16431);
          editable__16432.cnt = editable__16432.cnt - 1;
          return editable__16432
        }
      }else {
        if("\ufdd0'else") {
          return cljs.core.edit_and_set.call(null, inode__16428, edit, idx__16429, n__16431)
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.ArrayNode.prototype.ensure_editable = function(e) {
  var this__16433 = this;
  var inode__16434 = this;
  if(e === this__16433.edit) {
    return inode__16434
  }else {
    return new cljs.core.ArrayNode(e, this__16433.cnt, this__16433.arr.slice())
  }
};
cljs.core.ArrayNode.prototype.kv_reduce = function(f, init) {
  var this__16435 = this;
  var inode__16436 = this;
  var len__16437 = this__16435.arr.length;
  var i__16438 = 0;
  var init__16439 = init;
  while(true) {
    if(i__16438 < len__16437) {
      var node__16440 = this__16435.arr[i__16438];
      if(!(node__16440 == null)) {
        var init__16441 = node__16440.kv_reduce(f, init__16439);
        if(cljs.core.reduced_QMARK_.call(null, init__16441)) {
          return cljs.core.deref.call(null, init__16441)
        }else {
          var G__16460 = i__16438 + 1;
          var G__16461 = init__16441;
          i__16438 = G__16460;
          init__16439 = G__16461;
          continue
        }
      }else {
        return null
      }
    }else {
      return init__16439
    }
    break
  }
};
cljs.core.ArrayNode.prototype.inode_find = function(shift, hash, key, not_found) {
  var this__16442 = this;
  var inode__16443 = this;
  var idx__16444 = hash >>> shift & 31;
  var node__16445 = this__16442.arr[idx__16444];
  if(!(node__16445 == null)) {
    return node__16445.inode_find(shift + 5, hash, key, not_found)
  }else {
    return not_found
  }
};
cljs.core.ArrayNode.prototype.inode_without = function(shift, hash, key) {
  var this__16446 = this;
  var inode__16447 = this;
  var idx__16448 = hash >>> shift & 31;
  var node__16449 = this__16446.arr[idx__16448];
  if(!(node__16449 == null)) {
    var n__16450 = node__16449.inode_without(shift + 5, hash, key);
    if(n__16450 === node__16449) {
      return inode__16447
    }else {
      if(n__16450 == null) {
        if(this__16446.cnt <= 8) {
          return cljs.core.pack_array_node.call(null, inode__16447, null, idx__16448)
        }else {
          return new cljs.core.ArrayNode(null, this__16446.cnt - 1, cljs.core.clone_and_set.call(null, this__16446.arr, idx__16448, n__16450))
        }
      }else {
        if("\ufdd0'else") {
          return new cljs.core.ArrayNode(null, this__16446.cnt, cljs.core.clone_and_set.call(null, this__16446.arr, idx__16448, n__16450))
        }else {
          return null
        }
      }
    }
  }else {
    return inode__16447
  }
};
cljs.core.ArrayNode.prototype.inode_assoc = function(shift, hash, key, val, added_leaf_QMARK_) {
  var this__16451 = this;
  var inode__16452 = this;
  var idx__16453 = hash >>> shift & 31;
  var node__16454 = this__16451.arr[idx__16453];
  if(node__16454 == null) {
    return new cljs.core.ArrayNode(null, this__16451.cnt + 1, cljs.core.clone_and_set.call(null, this__16451.arr, idx__16453, cljs.core.BitmapIndexedNode.EMPTY.inode_assoc(shift + 5, hash, key, val, added_leaf_QMARK_)))
  }else {
    var n__16455 = node__16454.inode_assoc(shift + 5, hash, key, val, added_leaf_QMARK_);
    if(n__16455 === node__16454) {
      return inode__16452
    }else {
      return new cljs.core.ArrayNode(null, this__16451.cnt, cljs.core.clone_and_set.call(null, this__16451.arr, idx__16453, n__16455))
    }
  }
};
cljs.core.ArrayNode.prototype.inode_lookup = function(shift, hash, key, not_found) {
  var this__16456 = this;
  var inode__16457 = this;
  var idx__16458 = hash >>> shift & 31;
  var node__16459 = this__16456.arr[idx__16458];
  if(!(node__16459 == null)) {
    return node__16459.inode_lookup(shift + 5, hash, key, not_found)
  }else {
    return not_found
  }
};
cljs.core.ArrayNode;
cljs.core.hash_collision_node_find_index = function hash_collision_node_find_index(arr, cnt, key) {
  var lim__16464 = 2 * cnt;
  var i__16465 = 0;
  while(true) {
    if(i__16465 < lim__16464) {
      if(cljs.core.key_test.call(null, key, arr[i__16465])) {
        return i__16465
      }else {
        var G__16466 = i__16465 + 2;
        i__16465 = G__16466;
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
cljs.core.HashCollisionNode.cljs$lang$ctorPrSeq = function(this__2311__auto__) {
  return cljs.core.list.call(null, "cljs.core/HashCollisionNode")
};
cljs.core.HashCollisionNode.prototype.inode_assoc_BANG_ = function(edit, shift, hash, key, val, added_leaf_QMARK_) {
  var this__16467 = this;
  var inode__16468 = this;
  if(hash === this__16467.collision_hash) {
    var idx__16469 = cljs.core.hash_collision_node_find_index.call(null, this__16467.arr, this__16467.cnt, key);
    if(idx__16469 === -1) {
      if(this__16467.arr.length > 2 * this__16467.cnt) {
        var editable__16470 = cljs.core.edit_and_set.call(null, inode__16468, edit, 2 * this__16467.cnt, key, 2 * this__16467.cnt + 1, val);
        added_leaf_QMARK_.val = true;
        editable__16470.cnt = editable__16470.cnt + 1;
        return editable__16470
      }else {
        var len__16471 = this__16467.arr.length;
        var new_arr__16472 = cljs.core.make_array.call(null, len__16471 + 2);
        cljs.core.array_copy.call(null, this__16467.arr, 0, new_arr__16472, 0, len__16471);
        new_arr__16472[len__16471] = key;
        new_arr__16472[len__16471 + 1] = val;
        added_leaf_QMARK_.val = true;
        return inode__16468.ensure_editable_array(edit, this__16467.cnt + 1, new_arr__16472)
      }
    }else {
      if(this__16467.arr[idx__16469 + 1] === val) {
        return inode__16468
      }else {
        return cljs.core.edit_and_set.call(null, inode__16468, edit, idx__16469 + 1, val)
      }
    }
  }else {
    return(new cljs.core.BitmapIndexedNode(edit, 1 << (this__16467.collision_hash >>> shift & 31), [null, inode__16468, null, null])).inode_assoc_BANG_(edit, shift, hash, key, val, added_leaf_QMARK_)
  }
};
cljs.core.HashCollisionNode.prototype.inode_seq = function() {
  var this__16473 = this;
  var inode__16474 = this;
  return cljs.core.create_inode_seq.call(null, this__16473.arr)
};
cljs.core.HashCollisionNode.prototype.inode_without_BANG_ = function(edit, shift, hash, key, removed_leaf_QMARK_) {
  var this__16475 = this;
  var inode__16476 = this;
  var idx__16477 = cljs.core.hash_collision_node_find_index.call(null, this__16475.arr, this__16475.cnt, key);
  if(idx__16477 === -1) {
    return inode__16476
  }else {
    removed_leaf_QMARK_[0] = true;
    if(this__16475.cnt === 1) {
      return null
    }else {
      var editable__16478 = inode__16476.ensure_editable(edit);
      var earr__16479 = editable__16478.arr;
      earr__16479[idx__16477] = earr__16479[2 * this__16475.cnt - 2];
      earr__16479[idx__16477 + 1] = earr__16479[2 * this__16475.cnt - 1];
      earr__16479[2 * this__16475.cnt - 1] = null;
      earr__16479[2 * this__16475.cnt - 2] = null;
      editable__16478.cnt = editable__16478.cnt - 1;
      return editable__16478
    }
  }
};
cljs.core.HashCollisionNode.prototype.ensure_editable = function(e) {
  var this__16480 = this;
  var inode__16481 = this;
  if(e === this__16480.edit) {
    return inode__16481
  }else {
    var new_arr__16482 = cljs.core.make_array.call(null, 2 * (this__16480.cnt + 1));
    cljs.core.array_copy.call(null, this__16480.arr, 0, new_arr__16482, 0, 2 * this__16480.cnt);
    return new cljs.core.HashCollisionNode(e, this__16480.collision_hash, this__16480.cnt, new_arr__16482)
  }
};
cljs.core.HashCollisionNode.prototype.kv_reduce = function(f, init) {
  var this__16483 = this;
  var inode__16484 = this;
  return cljs.core.inode_kv_reduce.call(null, this__16483.arr, f, init)
};
cljs.core.HashCollisionNode.prototype.inode_find = function(shift, hash, key, not_found) {
  var this__16485 = this;
  var inode__16486 = this;
  var idx__16487 = cljs.core.hash_collision_node_find_index.call(null, this__16485.arr, this__16485.cnt, key);
  if(idx__16487 < 0) {
    return not_found
  }else {
    if(cljs.core.key_test.call(null, key, this__16485.arr[idx__16487])) {
      return cljs.core.PersistentVector.fromArray([this__16485.arr[idx__16487], this__16485.arr[idx__16487 + 1]], true)
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
  var this__16488 = this;
  var inode__16489 = this;
  var idx__16490 = cljs.core.hash_collision_node_find_index.call(null, this__16488.arr, this__16488.cnt, key);
  if(idx__16490 === -1) {
    return inode__16489
  }else {
    if(this__16488.cnt === 1) {
      return null
    }else {
      if("\ufdd0'else") {
        return new cljs.core.HashCollisionNode(null, this__16488.collision_hash, this__16488.cnt - 1, cljs.core.remove_pair.call(null, this__16488.arr, cljs.core.quot.call(null, idx__16490, 2)))
      }else {
        return null
      }
    }
  }
};
cljs.core.HashCollisionNode.prototype.inode_assoc = function(shift, hash, key, val, added_leaf_QMARK_) {
  var this__16491 = this;
  var inode__16492 = this;
  if(hash === this__16491.collision_hash) {
    var idx__16493 = cljs.core.hash_collision_node_find_index.call(null, this__16491.arr, this__16491.cnt, key);
    if(idx__16493 === -1) {
      var len__16494 = this__16491.arr.length;
      var new_arr__16495 = cljs.core.make_array.call(null, len__16494 + 2);
      cljs.core.array_copy.call(null, this__16491.arr, 0, new_arr__16495, 0, len__16494);
      new_arr__16495[len__16494] = key;
      new_arr__16495[len__16494 + 1] = val;
      added_leaf_QMARK_.val = true;
      return new cljs.core.HashCollisionNode(null, this__16491.collision_hash, this__16491.cnt + 1, new_arr__16495)
    }else {
      if(cljs.core._EQ_.call(null, this__16491.arr[idx__16493], val)) {
        return inode__16492
      }else {
        return new cljs.core.HashCollisionNode(null, this__16491.collision_hash, this__16491.cnt, cljs.core.clone_and_set.call(null, this__16491.arr, idx__16493 + 1, val))
      }
    }
  }else {
    return(new cljs.core.BitmapIndexedNode(null, 1 << (this__16491.collision_hash >>> shift & 31), [null, inode__16492])).inode_assoc(shift, hash, key, val, added_leaf_QMARK_)
  }
};
cljs.core.HashCollisionNode.prototype.inode_lookup = function(shift, hash, key, not_found) {
  var this__16496 = this;
  var inode__16497 = this;
  var idx__16498 = cljs.core.hash_collision_node_find_index.call(null, this__16496.arr, this__16496.cnt, key);
  if(idx__16498 < 0) {
    return not_found
  }else {
    if(cljs.core.key_test.call(null, key, this__16496.arr[idx__16498])) {
      return this__16496.arr[idx__16498 + 1]
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
  var this__16499 = this;
  var inode__16500 = this;
  if(e === this__16499.edit) {
    this__16499.arr = array;
    this__16499.cnt = count;
    return inode__16500
  }else {
    return new cljs.core.HashCollisionNode(this__16499.edit, this__16499.collision_hash, count, array)
  }
};
cljs.core.HashCollisionNode;
cljs.core.create_node = function() {
  var create_node = null;
  var create_node__6 = function(shift, key1, val1, key2hash, key2, val2) {
    var key1hash__16505 = cljs.core.hash.call(null, key1);
    if(key1hash__16505 === key2hash) {
      return new cljs.core.HashCollisionNode(null, key1hash__16505, 2, [key1, val1, key2, val2])
    }else {
      var added_leaf_QMARK___16506 = new cljs.core.Box(false);
      return cljs.core.BitmapIndexedNode.EMPTY.inode_assoc(shift, key1hash__16505, key1, val1, added_leaf_QMARK___16506).inode_assoc(shift, key2hash, key2, val2, added_leaf_QMARK___16506)
    }
  };
  var create_node__7 = function(edit, shift, key1, val1, key2hash, key2, val2) {
    var key1hash__16507 = cljs.core.hash.call(null, key1);
    if(key1hash__16507 === key2hash) {
      return new cljs.core.HashCollisionNode(null, key1hash__16507, 2, [key1, val1, key2, val2])
    }else {
      var added_leaf_QMARK___16508 = new cljs.core.Box(false);
      return cljs.core.BitmapIndexedNode.EMPTY.inode_assoc_BANG_(edit, shift, key1hash__16507, key1, val1, added_leaf_QMARK___16508).inode_assoc_BANG_(edit, shift, key2hash, key2, val2, added_leaf_QMARK___16508)
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
cljs.core.NodeSeq.cljs$lang$ctorPrSeq = function(this__2311__auto__) {
  return cljs.core.list.call(null, "cljs.core/NodeSeq")
};
cljs.core.NodeSeq.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__16509 = this;
  var h__2194__auto____16510 = this__16509.__hash;
  if(!(h__2194__auto____16510 == null)) {
    return h__2194__auto____16510
  }else {
    var h__2194__auto____16511 = cljs.core.hash_coll.call(null, coll);
    this__16509.__hash = h__2194__auto____16511;
    return h__2194__auto____16511
  }
};
cljs.core.NodeSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__16512 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.NodeSeq.prototype.toString = function() {
  var this__16513 = this;
  var this__16514 = this;
  return cljs.core.pr_str.call(null, this__16514)
};
cljs.core.NodeSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(this$) {
  var this__16515 = this;
  return this$
};
cljs.core.NodeSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__16516 = this;
  if(this__16516.s == null) {
    return cljs.core.PersistentVector.fromArray([this__16516.nodes[this__16516.i], this__16516.nodes[this__16516.i + 1]], true)
  }else {
    return cljs.core.first.call(null, this__16516.s)
  }
};
cljs.core.NodeSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__16517 = this;
  if(this__16517.s == null) {
    return cljs.core.create_inode_seq.call(null, this__16517.nodes, this__16517.i + 2, null)
  }else {
    return cljs.core.create_inode_seq.call(null, this__16517.nodes, this__16517.i, cljs.core.next.call(null, this__16517.s))
  }
};
cljs.core.NodeSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__16518 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.NodeSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__16519 = this;
  return new cljs.core.NodeSeq(meta, this__16519.nodes, this__16519.i, this__16519.s, this__16519.__hash)
};
cljs.core.NodeSeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__16520 = this;
  return this__16520.meta
};
cljs.core.NodeSeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__16521 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__16521.meta)
};
cljs.core.NodeSeq;
cljs.core.create_inode_seq = function() {
  var create_inode_seq = null;
  var create_inode_seq__1 = function(nodes) {
    return create_inode_seq.call(null, nodes, 0, null)
  };
  var create_inode_seq__3 = function(nodes, i, s) {
    if(s == null) {
      var len__16528 = nodes.length;
      var j__16529 = i;
      while(true) {
        if(j__16529 < len__16528) {
          if(!(nodes[j__16529] == null)) {
            return new cljs.core.NodeSeq(null, nodes, j__16529, null, null)
          }else {
            var temp__3971__auto____16530 = nodes[j__16529 + 1];
            if(cljs.core.truth_(temp__3971__auto____16530)) {
              var node__16531 = temp__3971__auto____16530;
              var temp__3971__auto____16532 = node__16531.inode_seq();
              if(cljs.core.truth_(temp__3971__auto____16532)) {
                var node_seq__16533 = temp__3971__auto____16532;
                return new cljs.core.NodeSeq(null, nodes, j__16529 + 2, node_seq__16533, null)
              }else {
                var G__16534 = j__16529 + 2;
                j__16529 = G__16534;
                continue
              }
            }else {
              var G__16535 = j__16529 + 2;
              j__16529 = G__16535;
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
cljs.core.ArrayNodeSeq.cljs$lang$ctorPrSeq = function(this__2311__auto__) {
  return cljs.core.list.call(null, "cljs.core/ArrayNodeSeq")
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__16536 = this;
  var h__2194__auto____16537 = this__16536.__hash;
  if(!(h__2194__auto____16537 == null)) {
    return h__2194__auto____16537
  }else {
    var h__2194__auto____16538 = cljs.core.hash_coll.call(null, coll);
    this__16536.__hash = h__2194__auto____16538;
    return h__2194__auto____16538
  }
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__16539 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.ArrayNodeSeq.prototype.toString = function() {
  var this__16540 = this;
  var this__16541 = this;
  return cljs.core.pr_str.call(null, this__16541)
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(this$) {
  var this__16542 = this;
  return this$
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__16543 = this;
  return cljs.core.first.call(null, this__16543.s)
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__16544 = this;
  return cljs.core.create_array_node_seq.call(null, null, this__16544.nodes, this__16544.i, cljs.core.next.call(null, this__16544.s))
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__16545 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__16546 = this;
  return new cljs.core.ArrayNodeSeq(meta, this__16546.nodes, this__16546.i, this__16546.s, this__16546.__hash)
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__16547 = this;
  return this__16547.meta
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__16548 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__16548.meta)
};
cljs.core.ArrayNodeSeq;
cljs.core.create_array_node_seq = function() {
  var create_array_node_seq = null;
  var create_array_node_seq__1 = function(nodes) {
    return create_array_node_seq.call(null, null, nodes, 0, null)
  };
  var create_array_node_seq__4 = function(meta, nodes, i, s) {
    if(s == null) {
      var len__16555 = nodes.length;
      var j__16556 = i;
      while(true) {
        if(j__16556 < len__16555) {
          var temp__3971__auto____16557 = nodes[j__16556];
          if(cljs.core.truth_(temp__3971__auto____16557)) {
            var nj__16558 = temp__3971__auto____16557;
            var temp__3971__auto____16559 = nj__16558.inode_seq();
            if(cljs.core.truth_(temp__3971__auto____16559)) {
              var ns__16560 = temp__3971__auto____16559;
              return new cljs.core.ArrayNodeSeq(meta, nodes, j__16556 + 1, ns__16560, null)
            }else {
              var G__16561 = j__16556 + 1;
              j__16556 = G__16561;
              continue
            }
          }else {
            var G__16562 = j__16556 + 1;
            j__16556 = G__16562;
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
cljs.core.PersistentHashMap.cljs$lang$ctorPrSeq = function(this__2311__auto__) {
  return cljs.core.list.call(null, "cljs.core/PersistentHashMap")
};
cljs.core.PersistentHashMap.prototype.cljs$core$IEditableCollection$_as_transient$arity$1 = function(coll) {
  var this__16565 = this;
  return new cljs.core.TransientHashMap({}, this__16565.root, this__16565.cnt, this__16565.has_nil_QMARK_, this__16565.nil_val)
};
cljs.core.PersistentHashMap.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__16566 = this;
  var h__2194__auto____16567 = this__16566.__hash;
  if(!(h__2194__auto____16567 == null)) {
    return h__2194__auto____16567
  }else {
    var h__2194__auto____16568 = cljs.core.hash_imap.call(null, coll);
    this__16566.__hash = h__2194__auto____16568;
    return h__2194__auto____16568
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__16569 = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(coll, k, null)
};
cljs.core.PersistentHashMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__16570 = this;
  if(k == null) {
    if(this__16570.has_nil_QMARK_) {
      return this__16570.nil_val
    }else {
      return not_found
    }
  }else {
    if(this__16570.root == null) {
      return not_found
    }else {
      if("\ufdd0'else") {
        return this__16570.root.inode_lookup(0, cljs.core.hash.call(null, k), k, not_found)
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__16571 = this;
  if(k == null) {
    if(function() {
      var and__3822__auto____16572 = this__16571.has_nil_QMARK_;
      if(and__3822__auto____16572) {
        return v === this__16571.nil_val
      }else {
        return and__3822__auto____16572
      }
    }()) {
      return coll
    }else {
      return new cljs.core.PersistentHashMap(this__16571.meta, this__16571.has_nil_QMARK_ ? this__16571.cnt : this__16571.cnt + 1, this__16571.root, true, v, null)
    }
  }else {
    var added_leaf_QMARK___16573 = new cljs.core.Box(false);
    var new_root__16574 = (this__16571.root == null ? cljs.core.BitmapIndexedNode.EMPTY : this__16571.root).inode_assoc(0, cljs.core.hash.call(null, k), k, v, added_leaf_QMARK___16573);
    if(new_root__16574 === this__16571.root) {
      return coll
    }else {
      return new cljs.core.PersistentHashMap(this__16571.meta, added_leaf_QMARK___16573.val ? this__16571.cnt + 1 : this__16571.cnt, new_root__16574, this__16571.has_nil_QMARK_, this__16571.nil_val, null)
    }
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = function(coll, k) {
  var this__16575 = this;
  if(k == null) {
    return this__16575.has_nil_QMARK_
  }else {
    if(this__16575.root == null) {
      return false
    }else {
      if("\ufdd0'else") {
        return!(this__16575.root.inode_lookup(0, cljs.core.hash.call(null, k), k, cljs.core.lookup_sentinel) === cljs.core.lookup_sentinel)
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentHashMap.prototype.call = function() {
  var G__16598 = null;
  var G__16598__2 = function(this_sym16576, k) {
    var this__16578 = this;
    var this_sym16576__16579 = this;
    var coll__16580 = this_sym16576__16579;
    return coll__16580.cljs$core$ILookup$_lookup$arity$2(coll__16580, k)
  };
  var G__16598__3 = function(this_sym16577, k, not_found) {
    var this__16578 = this;
    var this_sym16577__16581 = this;
    var coll__16582 = this_sym16577__16581;
    return coll__16582.cljs$core$ILookup$_lookup$arity$3(coll__16582, k, not_found)
  };
  G__16598 = function(this_sym16577, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__16598__2.call(this, this_sym16577, k);
      case 3:
        return G__16598__3.call(this, this_sym16577, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__16598
}();
cljs.core.PersistentHashMap.prototype.apply = function(this_sym16563, args16564) {
  var this__16583 = this;
  return this_sym16563.call.apply(this_sym16563, [this_sym16563].concat(args16564.slice()))
};
cljs.core.PersistentHashMap.prototype.cljs$core$IKVReduce$_kv_reduce$arity$3 = function(coll, f, init) {
  var this__16584 = this;
  var init__16585 = this__16584.has_nil_QMARK_ ? f.call(null, init, null, this__16584.nil_val) : init;
  if(cljs.core.reduced_QMARK_.call(null, init__16585)) {
    return cljs.core.deref.call(null, init__16585)
  }else {
    if(!(this__16584.root == null)) {
      return this__16584.root.kv_reduce(f, init__16585)
    }else {
      if("\ufdd0'else") {
        return init__16585
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, entry) {
  var this__16586 = this;
  if(cljs.core.vector_QMARK_.call(null, entry)) {
    return coll.cljs$core$IAssociative$_assoc$arity$3(coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.PersistentHashMap.prototype.toString = function() {
  var this__16587 = this;
  var this__16588 = this;
  return cljs.core.pr_str.call(null, this__16588)
};
cljs.core.PersistentHashMap.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__16589 = this;
  if(this__16589.cnt > 0) {
    var s__16590 = !(this__16589.root == null) ? this__16589.root.inode_seq() : null;
    if(this__16589.has_nil_QMARK_) {
      return cljs.core.cons.call(null, cljs.core.PersistentVector.fromArray([null, this__16589.nil_val], true), s__16590)
    }else {
      return s__16590
    }
  }else {
    return null
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__16591 = this;
  return this__16591.cnt
};
cljs.core.PersistentHashMap.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__16592 = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.PersistentHashMap.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__16593 = this;
  return new cljs.core.PersistentHashMap(meta, this__16593.cnt, this__16593.root, this__16593.has_nil_QMARK_, this__16593.nil_val, this__16593.__hash)
};
cljs.core.PersistentHashMap.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__16594 = this;
  return this__16594.meta
};
cljs.core.PersistentHashMap.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__16595 = this;
  return cljs.core._with_meta.call(null, cljs.core.PersistentHashMap.EMPTY, this__16595.meta)
};
cljs.core.PersistentHashMap.prototype.cljs$core$IMap$_dissoc$arity$2 = function(coll, k) {
  var this__16596 = this;
  if(k == null) {
    if(this__16596.has_nil_QMARK_) {
      return new cljs.core.PersistentHashMap(this__16596.meta, this__16596.cnt - 1, this__16596.root, false, null, null)
    }else {
      return coll
    }
  }else {
    if(this__16596.root == null) {
      return coll
    }else {
      if("\ufdd0'else") {
        var new_root__16597 = this__16596.root.inode_without(0, cljs.core.hash.call(null, k), k);
        if(new_root__16597 === this__16596.root) {
          return coll
        }else {
          return new cljs.core.PersistentHashMap(this__16596.meta, this__16596.cnt - 1, new_root__16597, this__16596.has_nil_QMARK_, this__16596.nil_val, null)
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
  var len__16599 = ks.length;
  var i__16600 = 0;
  var out__16601 = cljs.core.transient$.call(null, cljs.core.PersistentHashMap.EMPTY);
  while(true) {
    if(i__16600 < len__16599) {
      var G__16602 = i__16600 + 1;
      var G__16603 = cljs.core.assoc_BANG_.call(null, out__16601, ks[i__16600], vs[i__16600]);
      i__16600 = G__16602;
      out__16601 = G__16603;
      continue
    }else {
      return cljs.core.persistent_BANG_.call(null, out__16601)
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
cljs.core.TransientHashMap.cljs$lang$ctorPrSeq = function(this__2311__auto__) {
  return cljs.core.list.call(null, "cljs.core/TransientHashMap")
};
cljs.core.TransientHashMap.prototype.cljs$core$ITransientMap$_dissoc_BANG_$arity$2 = function(tcoll, key) {
  var this__16604 = this;
  return tcoll.without_BANG_(key)
};
cljs.core.TransientHashMap.prototype.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3 = function(tcoll, key, val) {
  var this__16605 = this;
  return tcoll.assoc_BANG_(key, val)
};
cljs.core.TransientHashMap.prototype.cljs$core$ITransientCollection$_conj_BANG_$arity$2 = function(tcoll, val) {
  var this__16606 = this;
  return tcoll.conj_BANG_(val)
};
cljs.core.TransientHashMap.prototype.cljs$core$ITransientCollection$_persistent_BANG_$arity$1 = function(tcoll) {
  var this__16607 = this;
  return tcoll.persistent_BANG_()
};
cljs.core.TransientHashMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(tcoll, k) {
  var this__16608 = this;
  if(k == null) {
    if(this__16608.has_nil_QMARK_) {
      return this__16608.nil_val
    }else {
      return null
    }
  }else {
    if(this__16608.root == null) {
      return null
    }else {
      return this__16608.root.inode_lookup(0, cljs.core.hash.call(null, k), k)
    }
  }
};
cljs.core.TransientHashMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(tcoll, k, not_found) {
  var this__16609 = this;
  if(k == null) {
    if(this__16609.has_nil_QMARK_) {
      return this__16609.nil_val
    }else {
      return not_found
    }
  }else {
    if(this__16609.root == null) {
      return not_found
    }else {
      return this__16609.root.inode_lookup(0, cljs.core.hash.call(null, k), k, not_found)
    }
  }
};
cljs.core.TransientHashMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__16610 = this;
  if(this__16610.edit) {
    return this__16610.count
  }else {
    throw new Error("count after persistent!");
  }
};
cljs.core.TransientHashMap.prototype.conj_BANG_ = function(o) {
  var this__16611 = this;
  var tcoll__16612 = this;
  if(this__16611.edit) {
    if(function() {
      var G__16613__16614 = o;
      if(G__16613__16614) {
        if(function() {
          var or__3824__auto____16615 = G__16613__16614.cljs$lang$protocol_mask$partition0$ & 2048;
          if(or__3824__auto____16615) {
            return or__3824__auto____16615
          }else {
            return G__16613__16614.cljs$core$IMapEntry$
          }
        }()) {
          return true
        }else {
          if(!G__16613__16614.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.IMapEntry, G__16613__16614)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.IMapEntry, G__16613__16614)
      }
    }()) {
      return tcoll__16612.assoc_BANG_(cljs.core.key.call(null, o), cljs.core.val.call(null, o))
    }else {
      var es__16616 = cljs.core.seq.call(null, o);
      var tcoll__16617 = tcoll__16612;
      while(true) {
        var temp__3971__auto____16618 = cljs.core.first.call(null, es__16616);
        if(cljs.core.truth_(temp__3971__auto____16618)) {
          var e__16619 = temp__3971__auto____16618;
          var G__16630 = cljs.core.next.call(null, es__16616);
          var G__16631 = tcoll__16617.assoc_BANG_(cljs.core.key.call(null, e__16619), cljs.core.val.call(null, e__16619));
          es__16616 = G__16630;
          tcoll__16617 = G__16631;
          continue
        }else {
          return tcoll__16617
        }
        break
      }
    }
  }else {
    throw new Error("conj! after persistent");
  }
};
cljs.core.TransientHashMap.prototype.assoc_BANG_ = function(k, v) {
  var this__16620 = this;
  var tcoll__16621 = this;
  if(this__16620.edit) {
    if(k == null) {
      if(this__16620.nil_val === v) {
      }else {
        this__16620.nil_val = v
      }
      if(this__16620.has_nil_QMARK_) {
      }else {
        this__16620.count = this__16620.count + 1;
        this__16620.has_nil_QMARK_ = true
      }
      return tcoll__16621
    }else {
      var added_leaf_QMARK___16622 = new cljs.core.Box(false);
      var node__16623 = (this__16620.root == null ? cljs.core.BitmapIndexedNode.EMPTY : this__16620.root).inode_assoc_BANG_(this__16620.edit, 0, cljs.core.hash.call(null, k), k, v, added_leaf_QMARK___16622);
      if(node__16623 === this__16620.root) {
      }else {
        this__16620.root = node__16623
      }
      if(added_leaf_QMARK___16622.val) {
        this__16620.count = this__16620.count + 1
      }else {
      }
      return tcoll__16621
    }
  }else {
    throw new Error("assoc! after persistent!");
  }
};
cljs.core.TransientHashMap.prototype.without_BANG_ = function(k) {
  var this__16624 = this;
  var tcoll__16625 = this;
  if(this__16624.edit) {
    if(k == null) {
      if(this__16624.has_nil_QMARK_) {
        this__16624.has_nil_QMARK_ = false;
        this__16624.nil_val = null;
        this__16624.count = this__16624.count - 1;
        return tcoll__16625
      }else {
        return tcoll__16625
      }
    }else {
      if(this__16624.root == null) {
        return tcoll__16625
      }else {
        var removed_leaf_QMARK___16626 = new cljs.core.Box(false);
        var node__16627 = this__16624.root.inode_without_BANG_(this__16624.edit, 0, cljs.core.hash.call(null, k), k, removed_leaf_QMARK___16626);
        if(node__16627 === this__16624.root) {
        }else {
          this__16624.root = node__16627
        }
        if(cljs.core.truth_(removed_leaf_QMARK___16626[0])) {
          this__16624.count = this__16624.count - 1
        }else {
        }
        return tcoll__16625
      }
    }
  }else {
    throw new Error("dissoc! after persistent!");
  }
};
cljs.core.TransientHashMap.prototype.persistent_BANG_ = function() {
  var this__16628 = this;
  var tcoll__16629 = this;
  if(this__16628.edit) {
    this__16628.edit = null;
    return new cljs.core.PersistentHashMap(null, this__16628.count, this__16628.root, this__16628.has_nil_QMARK_, this__16628.nil_val, null)
  }else {
    throw new Error("persistent! called twice");
  }
};
cljs.core.TransientHashMap;
cljs.core.tree_map_seq_push = function tree_map_seq_push(node, stack, ascending_QMARK_) {
  var t__16634 = node;
  var stack__16635 = stack;
  while(true) {
    if(!(t__16634 == null)) {
      var G__16636 = ascending_QMARK_ ? t__16634.left : t__16634.right;
      var G__16637 = cljs.core.conj.call(null, stack__16635, t__16634);
      t__16634 = G__16636;
      stack__16635 = G__16637;
      continue
    }else {
      return stack__16635
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
cljs.core.PersistentTreeMapSeq.cljs$lang$ctorPrSeq = function(this__2311__auto__) {
  return cljs.core.list.call(null, "cljs.core/PersistentTreeMapSeq")
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__16638 = this;
  var h__2194__auto____16639 = this__16638.__hash;
  if(!(h__2194__auto____16639 == null)) {
    return h__2194__auto____16639
  }else {
    var h__2194__auto____16640 = cljs.core.hash_coll.call(null, coll);
    this__16638.__hash = h__2194__auto____16640;
    return h__2194__auto____16640
  }
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__16641 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.PersistentTreeMapSeq.prototype.toString = function() {
  var this__16642 = this;
  var this__16643 = this;
  return cljs.core.pr_str.call(null, this__16643)
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(this$) {
  var this__16644 = this;
  return this$
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__16645 = this;
  if(this__16645.cnt < 0) {
    return cljs.core.count.call(null, cljs.core.next.call(null, coll)) + 1
  }else {
    return this__16645.cnt
  }
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(this$) {
  var this__16646 = this;
  return cljs.core.peek.call(null, this__16646.stack)
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(this$) {
  var this__16647 = this;
  var t__16648 = cljs.core.first.call(null, this__16647.stack);
  var next_stack__16649 = cljs.core.tree_map_seq_push.call(null, this__16647.ascending_QMARK_ ? t__16648.right : t__16648.left, cljs.core.next.call(null, this__16647.stack), this__16647.ascending_QMARK_);
  if(!(next_stack__16649 == null)) {
    return new cljs.core.PersistentTreeMapSeq(null, next_stack__16649, this__16647.ascending_QMARK_, this__16647.cnt - 1, null)
  }else {
    return cljs.core.List.EMPTY
  }
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__16650 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__16651 = this;
  return new cljs.core.PersistentTreeMapSeq(meta, this__16651.stack, this__16651.ascending_QMARK_, this__16651.cnt, this__16651.__hash)
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__16652 = this;
  return this__16652.meta
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
        var and__3822__auto____16654 = cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, right);
        if(and__3822__auto____16654) {
          return cljs.core.instance_QMARK_.call(null, cljs.core.BlackNode, right.left)
        }else {
          return and__3822__auto____16654
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
        var and__3822__auto____16656 = cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, left);
        if(and__3822__auto____16656) {
          return cljs.core.instance_QMARK_.call(null, cljs.core.BlackNode, left.right)
        }else {
          return and__3822__auto____16656
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
  var init__16660 = f.call(null, init, node.key, node.val);
  if(cljs.core.reduced_QMARK_.call(null, init__16660)) {
    return cljs.core.deref.call(null, init__16660)
  }else {
    var init__16661 = !(node.left == null) ? tree_map_kv_reduce.call(null, node.left, f, init__16660) : init__16660;
    if(cljs.core.reduced_QMARK_.call(null, init__16661)) {
      return cljs.core.deref.call(null, init__16661)
    }else {
      var init__16662 = !(node.right == null) ? tree_map_kv_reduce.call(null, node.right, f, init__16661) : init__16661;
      if(cljs.core.reduced_QMARK_.call(null, init__16662)) {
        return cljs.core.deref.call(null, init__16662)
      }else {
        return init__16662
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
cljs.core.BlackNode.cljs$lang$ctorPrSeq = function(this__2311__auto__) {
  return cljs.core.list.call(null, "cljs.core/BlackNode")
};
cljs.core.BlackNode.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__16665 = this;
  var h__2194__auto____16666 = this__16665.__hash;
  if(!(h__2194__auto____16666 == null)) {
    return h__2194__auto____16666
  }else {
    var h__2194__auto____16667 = cljs.core.hash_coll.call(null, coll);
    this__16665.__hash = h__2194__auto____16667;
    return h__2194__auto____16667
  }
};
cljs.core.BlackNode.prototype.cljs$core$ILookup$_lookup$arity$2 = function(node, k) {
  var this__16668 = this;
  return node.cljs$core$IIndexed$_nth$arity$3(node, k, null)
};
cljs.core.BlackNode.prototype.cljs$core$ILookup$_lookup$arity$3 = function(node, k, not_found) {
  var this__16669 = this;
  return node.cljs$core$IIndexed$_nth$arity$3(node, k, not_found)
};
cljs.core.BlackNode.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(node, k, v) {
  var this__16670 = this;
  return cljs.core.assoc.call(null, cljs.core.PersistentVector.fromArray([this__16670.key, this__16670.val], true), k, v)
};
cljs.core.BlackNode.prototype.call = function() {
  var G__16718 = null;
  var G__16718__2 = function(this_sym16671, k) {
    var this__16673 = this;
    var this_sym16671__16674 = this;
    var node__16675 = this_sym16671__16674;
    return node__16675.cljs$core$ILookup$_lookup$arity$2(node__16675, k)
  };
  var G__16718__3 = function(this_sym16672, k, not_found) {
    var this__16673 = this;
    var this_sym16672__16676 = this;
    var node__16677 = this_sym16672__16676;
    return node__16677.cljs$core$ILookup$_lookup$arity$3(node__16677, k, not_found)
  };
  G__16718 = function(this_sym16672, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__16718__2.call(this, this_sym16672, k);
      case 3:
        return G__16718__3.call(this, this_sym16672, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__16718
}();
cljs.core.BlackNode.prototype.apply = function(this_sym16663, args16664) {
  var this__16678 = this;
  return this_sym16663.call.apply(this_sym16663, [this_sym16663].concat(args16664.slice()))
};
cljs.core.BlackNode.prototype.cljs$core$ICollection$_conj$arity$2 = function(node, o) {
  var this__16679 = this;
  return cljs.core.PersistentVector.fromArray([this__16679.key, this__16679.val, o], true)
};
cljs.core.BlackNode.prototype.cljs$core$IMapEntry$_key$arity$1 = function(node) {
  var this__16680 = this;
  return this__16680.key
};
cljs.core.BlackNode.prototype.cljs$core$IMapEntry$_val$arity$1 = function(node) {
  var this__16681 = this;
  return this__16681.val
};
cljs.core.BlackNode.prototype.add_right = function(ins) {
  var this__16682 = this;
  var node__16683 = this;
  return ins.balance_right(node__16683)
};
cljs.core.BlackNode.prototype.redden = function() {
  var this__16684 = this;
  var node__16685 = this;
  return new cljs.core.RedNode(this__16684.key, this__16684.val, this__16684.left, this__16684.right, null)
};
cljs.core.BlackNode.prototype.remove_right = function(del) {
  var this__16686 = this;
  var node__16687 = this;
  return cljs.core.balance_right_del.call(null, this__16686.key, this__16686.val, this__16686.left, del)
};
cljs.core.BlackNode.prototype.replace = function(key, val, left, right) {
  var this__16688 = this;
  var node__16689 = this;
  return new cljs.core.BlackNode(key, val, left, right, null)
};
cljs.core.BlackNode.prototype.kv_reduce = function(f, init) {
  var this__16690 = this;
  var node__16691 = this;
  return cljs.core.tree_map_kv_reduce.call(null, node__16691, f, init)
};
cljs.core.BlackNode.prototype.remove_left = function(del) {
  var this__16692 = this;
  var node__16693 = this;
  return cljs.core.balance_left_del.call(null, this__16692.key, this__16692.val, del, this__16692.right)
};
cljs.core.BlackNode.prototype.add_left = function(ins) {
  var this__16694 = this;
  var node__16695 = this;
  return ins.balance_left(node__16695)
};
cljs.core.BlackNode.prototype.balance_left = function(parent) {
  var this__16696 = this;
  var node__16697 = this;
  return new cljs.core.BlackNode(parent.key, parent.val, node__16697, parent.right, null)
};
cljs.core.BlackNode.prototype.toString = function() {
  var G__16719 = null;
  var G__16719__0 = function() {
    var this__16698 = this;
    var this__16700 = this;
    return cljs.core.pr_str.call(null, this__16700)
  };
  G__16719 = function() {
    switch(arguments.length) {
      case 0:
        return G__16719__0.call(this)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__16719
}();
cljs.core.BlackNode.prototype.balance_right = function(parent) {
  var this__16701 = this;
  var node__16702 = this;
  return new cljs.core.BlackNode(parent.key, parent.val, parent.left, node__16702, null)
};
cljs.core.BlackNode.prototype.blacken = function() {
  var this__16703 = this;
  var node__16704 = this;
  return node__16704
};
cljs.core.BlackNode.prototype.cljs$core$IReduce$_reduce$arity$2 = function(node, f) {
  var this__16705 = this;
  return cljs.core.ci_reduce.call(null, node, f)
};
cljs.core.BlackNode.prototype.cljs$core$IReduce$_reduce$arity$3 = function(node, f, start) {
  var this__16706 = this;
  return cljs.core.ci_reduce.call(null, node, f, start)
};
cljs.core.BlackNode.prototype.cljs$core$ISeqable$_seq$arity$1 = function(node) {
  var this__16707 = this;
  return cljs.core.list.call(null, this__16707.key, this__16707.val)
};
cljs.core.BlackNode.prototype.cljs$core$ICounted$_count$arity$1 = function(node) {
  var this__16708 = this;
  return 2
};
cljs.core.BlackNode.prototype.cljs$core$IStack$_peek$arity$1 = function(node) {
  var this__16709 = this;
  return this__16709.val
};
cljs.core.BlackNode.prototype.cljs$core$IStack$_pop$arity$1 = function(node) {
  var this__16710 = this;
  return cljs.core.PersistentVector.fromArray([this__16710.key], true)
};
cljs.core.BlackNode.prototype.cljs$core$IVector$_assoc_n$arity$3 = function(node, n, v) {
  var this__16711 = this;
  return cljs.core._assoc_n.call(null, cljs.core.PersistentVector.fromArray([this__16711.key, this__16711.val], true), n, v)
};
cljs.core.BlackNode.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__16712 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.BlackNode.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(node, meta) {
  var this__16713 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentVector.fromArray([this__16713.key, this__16713.val], true), meta)
};
cljs.core.BlackNode.prototype.cljs$core$IMeta$_meta$arity$1 = function(node) {
  var this__16714 = this;
  return null
};
cljs.core.BlackNode.prototype.cljs$core$IIndexed$_nth$arity$2 = function(node, n) {
  var this__16715 = this;
  if(n === 0) {
    return this__16715.key
  }else {
    if(n === 1) {
      return this__16715.val
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
  var this__16716 = this;
  if(n === 0) {
    return this__16716.key
  }else {
    if(n === 1) {
      return this__16716.val
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
  var this__16717 = this;
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
cljs.core.RedNode.cljs$lang$ctorPrSeq = function(this__2311__auto__) {
  return cljs.core.list.call(null, "cljs.core/RedNode")
};
cljs.core.RedNode.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__16722 = this;
  var h__2194__auto____16723 = this__16722.__hash;
  if(!(h__2194__auto____16723 == null)) {
    return h__2194__auto____16723
  }else {
    var h__2194__auto____16724 = cljs.core.hash_coll.call(null, coll);
    this__16722.__hash = h__2194__auto____16724;
    return h__2194__auto____16724
  }
};
cljs.core.RedNode.prototype.cljs$core$ILookup$_lookup$arity$2 = function(node, k) {
  var this__16725 = this;
  return node.cljs$core$IIndexed$_nth$arity$3(node, k, null)
};
cljs.core.RedNode.prototype.cljs$core$ILookup$_lookup$arity$3 = function(node, k, not_found) {
  var this__16726 = this;
  return node.cljs$core$IIndexed$_nth$arity$3(node, k, not_found)
};
cljs.core.RedNode.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(node, k, v) {
  var this__16727 = this;
  return cljs.core.assoc.call(null, cljs.core.PersistentVector.fromArray([this__16727.key, this__16727.val], true), k, v)
};
cljs.core.RedNode.prototype.call = function() {
  var G__16775 = null;
  var G__16775__2 = function(this_sym16728, k) {
    var this__16730 = this;
    var this_sym16728__16731 = this;
    var node__16732 = this_sym16728__16731;
    return node__16732.cljs$core$ILookup$_lookup$arity$2(node__16732, k)
  };
  var G__16775__3 = function(this_sym16729, k, not_found) {
    var this__16730 = this;
    var this_sym16729__16733 = this;
    var node__16734 = this_sym16729__16733;
    return node__16734.cljs$core$ILookup$_lookup$arity$3(node__16734, k, not_found)
  };
  G__16775 = function(this_sym16729, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__16775__2.call(this, this_sym16729, k);
      case 3:
        return G__16775__3.call(this, this_sym16729, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__16775
}();
cljs.core.RedNode.prototype.apply = function(this_sym16720, args16721) {
  var this__16735 = this;
  return this_sym16720.call.apply(this_sym16720, [this_sym16720].concat(args16721.slice()))
};
cljs.core.RedNode.prototype.cljs$core$ICollection$_conj$arity$2 = function(node, o) {
  var this__16736 = this;
  return cljs.core.PersistentVector.fromArray([this__16736.key, this__16736.val, o], true)
};
cljs.core.RedNode.prototype.cljs$core$IMapEntry$_key$arity$1 = function(node) {
  var this__16737 = this;
  return this__16737.key
};
cljs.core.RedNode.prototype.cljs$core$IMapEntry$_val$arity$1 = function(node) {
  var this__16738 = this;
  return this__16738.val
};
cljs.core.RedNode.prototype.add_right = function(ins) {
  var this__16739 = this;
  var node__16740 = this;
  return new cljs.core.RedNode(this__16739.key, this__16739.val, this__16739.left, ins, null)
};
cljs.core.RedNode.prototype.redden = function() {
  var this__16741 = this;
  var node__16742 = this;
  throw new Error("red-black tree invariant violation");
};
cljs.core.RedNode.prototype.remove_right = function(del) {
  var this__16743 = this;
  var node__16744 = this;
  return new cljs.core.RedNode(this__16743.key, this__16743.val, this__16743.left, del, null)
};
cljs.core.RedNode.prototype.replace = function(key, val, left, right) {
  var this__16745 = this;
  var node__16746 = this;
  return new cljs.core.RedNode(key, val, left, right, null)
};
cljs.core.RedNode.prototype.kv_reduce = function(f, init) {
  var this__16747 = this;
  var node__16748 = this;
  return cljs.core.tree_map_kv_reduce.call(null, node__16748, f, init)
};
cljs.core.RedNode.prototype.remove_left = function(del) {
  var this__16749 = this;
  var node__16750 = this;
  return new cljs.core.RedNode(this__16749.key, this__16749.val, del, this__16749.right, null)
};
cljs.core.RedNode.prototype.add_left = function(ins) {
  var this__16751 = this;
  var node__16752 = this;
  return new cljs.core.RedNode(this__16751.key, this__16751.val, ins, this__16751.right, null)
};
cljs.core.RedNode.prototype.balance_left = function(parent) {
  var this__16753 = this;
  var node__16754 = this;
  if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, this__16753.left)) {
    return new cljs.core.RedNode(this__16753.key, this__16753.val, this__16753.left.blacken(), new cljs.core.BlackNode(parent.key, parent.val, this__16753.right, parent.right, null), null)
  }else {
    if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, this__16753.right)) {
      return new cljs.core.RedNode(this__16753.right.key, this__16753.right.val, new cljs.core.BlackNode(this__16753.key, this__16753.val, this__16753.left, this__16753.right.left, null), new cljs.core.BlackNode(parent.key, parent.val, this__16753.right.right, parent.right, null), null)
    }else {
      if("\ufdd0'else") {
        return new cljs.core.BlackNode(parent.key, parent.val, node__16754, parent.right, null)
      }else {
        return null
      }
    }
  }
};
cljs.core.RedNode.prototype.toString = function() {
  var G__16776 = null;
  var G__16776__0 = function() {
    var this__16755 = this;
    var this__16757 = this;
    return cljs.core.pr_str.call(null, this__16757)
  };
  G__16776 = function() {
    switch(arguments.length) {
      case 0:
        return G__16776__0.call(this)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__16776
}();
cljs.core.RedNode.prototype.balance_right = function(parent) {
  var this__16758 = this;
  var node__16759 = this;
  if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, this__16758.right)) {
    return new cljs.core.RedNode(this__16758.key, this__16758.val, new cljs.core.BlackNode(parent.key, parent.val, parent.left, this__16758.left, null), this__16758.right.blacken(), null)
  }else {
    if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, this__16758.left)) {
      return new cljs.core.RedNode(this__16758.left.key, this__16758.left.val, new cljs.core.BlackNode(parent.key, parent.val, parent.left, this__16758.left.left, null), new cljs.core.BlackNode(this__16758.key, this__16758.val, this__16758.left.right, this__16758.right, null), null)
    }else {
      if("\ufdd0'else") {
        return new cljs.core.BlackNode(parent.key, parent.val, parent.left, node__16759, null)
      }else {
        return null
      }
    }
  }
};
cljs.core.RedNode.prototype.blacken = function() {
  var this__16760 = this;
  var node__16761 = this;
  return new cljs.core.BlackNode(this__16760.key, this__16760.val, this__16760.left, this__16760.right, null)
};
cljs.core.RedNode.prototype.cljs$core$IReduce$_reduce$arity$2 = function(node, f) {
  var this__16762 = this;
  return cljs.core.ci_reduce.call(null, node, f)
};
cljs.core.RedNode.prototype.cljs$core$IReduce$_reduce$arity$3 = function(node, f, start) {
  var this__16763 = this;
  return cljs.core.ci_reduce.call(null, node, f, start)
};
cljs.core.RedNode.prototype.cljs$core$ISeqable$_seq$arity$1 = function(node) {
  var this__16764 = this;
  return cljs.core.list.call(null, this__16764.key, this__16764.val)
};
cljs.core.RedNode.prototype.cljs$core$ICounted$_count$arity$1 = function(node) {
  var this__16765 = this;
  return 2
};
cljs.core.RedNode.prototype.cljs$core$IStack$_peek$arity$1 = function(node) {
  var this__16766 = this;
  return this__16766.val
};
cljs.core.RedNode.prototype.cljs$core$IStack$_pop$arity$1 = function(node) {
  var this__16767 = this;
  return cljs.core.PersistentVector.fromArray([this__16767.key], true)
};
cljs.core.RedNode.prototype.cljs$core$IVector$_assoc_n$arity$3 = function(node, n, v) {
  var this__16768 = this;
  return cljs.core._assoc_n.call(null, cljs.core.PersistentVector.fromArray([this__16768.key, this__16768.val], true), n, v)
};
cljs.core.RedNode.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__16769 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.RedNode.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(node, meta) {
  var this__16770 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentVector.fromArray([this__16770.key, this__16770.val], true), meta)
};
cljs.core.RedNode.prototype.cljs$core$IMeta$_meta$arity$1 = function(node) {
  var this__16771 = this;
  return null
};
cljs.core.RedNode.prototype.cljs$core$IIndexed$_nth$arity$2 = function(node, n) {
  var this__16772 = this;
  if(n === 0) {
    return this__16772.key
  }else {
    if(n === 1) {
      return this__16772.val
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
  var this__16773 = this;
  if(n === 0) {
    return this__16773.key
  }else {
    if(n === 1) {
      return this__16773.val
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
  var this__16774 = this;
  return cljs.core.PersistentVector.EMPTY
};
cljs.core.RedNode;
cljs.core.tree_map_add = function tree_map_add(comp, tree, k, v, found) {
  if(tree == null) {
    return new cljs.core.RedNode(k, v, null, null, null)
  }else {
    var c__16780 = comp.call(null, k, tree.key);
    if(c__16780 === 0) {
      found[0] = tree;
      return null
    }else {
      if(c__16780 < 0) {
        var ins__16781 = tree_map_add.call(null, comp, tree.left, k, v, found);
        if(!(ins__16781 == null)) {
          return tree.add_left(ins__16781)
        }else {
          return null
        }
      }else {
        if("\ufdd0'else") {
          var ins__16782 = tree_map_add.call(null, comp, tree.right, k, v, found);
          if(!(ins__16782 == null)) {
            return tree.add_right(ins__16782)
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
          var app__16785 = tree_map_append.call(null, left.right, right.left);
          if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, app__16785)) {
            return new cljs.core.RedNode(app__16785.key, app__16785.val, new cljs.core.RedNode(left.key, left.val, left.left, app__16785.left, null), new cljs.core.RedNode(right.key, right.val, app__16785.right, right.right, null), null)
          }else {
            return new cljs.core.RedNode(left.key, left.val, left.left, new cljs.core.RedNode(right.key, right.val, app__16785, right.right, null), null)
          }
        }else {
          return new cljs.core.RedNode(left.key, left.val, left.left, tree_map_append.call(null, left.right, right), null)
        }
      }else {
        if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, right)) {
          return new cljs.core.RedNode(right.key, right.val, tree_map_append.call(null, left, right.left), right.right, null)
        }else {
          if("\ufdd0'else") {
            var app__16786 = tree_map_append.call(null, left.right, right.left);
            if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, app__16786)) {
              return new cljs.core.RedNode(app__16786.key, app__16786.val, new cljs.core.BlackNode(left.key, left.val, left.left, app__16786.left, null), new cljs.core.BlackNode(right.key, right.val, app__16786.right, right.right, null), null)
            }else {
              return cljs.core.balance_left_del.call(null, left.key, left.val, left.left, new cljs.core.BlackNode(right.key, right.val, app__16786, right.right, null))
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
    var c__16792 = comp.call(null, k, tree.key);
    if(c__16792 === 0) {
      found[0] = tree;
      return cljs.core.tree_map_append.call(null, tree.left, tree.right)
    }else {
      if(c__16792 < 0) {
        var del__16793 = tree_map_remove.call(null, comp, tree.left, k, found);
        if(function() {
          var or__3824__auto____16794 = !(del__16793 == null);
          if(or__3824__auto____16794) {
            return or__3824__auto____16794
          }else {
            return!(found[0] == null)
          }
        }()) {
          if(cljs.core.instance_QMARK_.call(null, cljs.core.BlackNode, tree.left)) {
            return cljs.core.balance_left_del.call(null, tree.key, tree.val, del__16793, tree.right)
          }else {
            return new cljs.core.RedNode(tree.key, tree.val, del__16793, tree.right, null)
          }
        }else {
          return null
        }
      }else {
        if("\ufdd0'else") {
          var del__16795 = tree_map_remove.call(null, comp, tree.right, k, found);
          if(function() {
            var or__3824__auto____16796 = !(del__16795 == null);
            if(or__3824__auto____16796) {
              return or__3824__auto____16796
            }else {
              return!(found[0] == null)
            }
          }()) {
            if(cljs.core.instance_QMARK_.call(null, cljs.core.BlackNode, tree.right)) {
              return cljs.core.balance_right_del.call(null, tree.key, tree.val, tree.left, del__16795)
            }else {
              return new cljs.core.RedNode(tree.key, tree.val, tree.left, del__16795, null)
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
  var tk__16799 = tree.key;
  var c__16800 = comp.call(null, k, tk__16799);
  if(c__16800 === 0) {
    return tree.replace(tk__16799, v, tree.left, tree.right)
  }else {
    if(c__16800 < 0) {
      return tree.replace(tk__16799, tree.val, tree_map_replace.call(null, comp, tree.left, k, v), tree.right)
    }else {
      if("\ufdd0'else") {
        return tree.replace(tk__16799, tree.val, tree.left, tree_map_replace.call(null, comp, tree.right, k, v))
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
cljs.core.PersistentTreeMap.cljs$lang$ctorPrSeq = function(this__2311__auto__) {
  return cljs.core.list.call(null, "cljs.core/PersistentTreeMap")
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__16803 = this;
  var h__2194__auto____16804 = this__16803.__hash;
  if(!(h__2194__auto____16804 == null)) {
    return h__2194__auto____16804
  }else {
    var h__2194__auto____16805 = cljs.core.hash_imap.call(null, coll);
    this__16803.__hash = h__2194__auto____16805;
    return h__2194__auto____16805
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__16806 = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(coll, k, null)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__16807 = this;
  var n__16808 = coll.entry_at(k);
  if(!(n__16808 == null)) {
    return n__16808.val
  }else {
    return not_found
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__16809 = this;
  var found__16810 = [null];
  var t__16811 = cljs.core.tree_map_add.call(null, this__16809.comp, this__16809.tree, k, v, found__16810);
  if(t__16811 == null) {
    var found_node__16812 = cljs.core.nth.call(null, found__16810, 0);
    if(cljs.core._EQ_.call(null, v, found_node__16812.val)) {
      return coll
    }else {
      return new cljs.core.PersistentTreeMap(this__16809.comp, cljs.core.tree_map_replace.call(null, this__16809.comp, this__16809.tree, k, v), this__16809.cnt, this__16809.meta, null)
    }
  }else {
    return new cljs.core.PersistentTreeMap(this__16809.comp, t__16811.blacken(), this__16809.cnt + 1, this__16809.meta, null)
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = function(coll, k) {
  var this__16813 = this;
  return!(coll.entry_at(k) == null)
};
cljs.core.PersistentTreeMap.prototype.call = function() {
  var G__16847 = null;
  var G__16847__2 = function(this_sym16814, k) {
    var this__16816 = this;
    var this_sym16814__16817 = this;
    var coll__16818 = this_sym16814__16817;
    return coll__16818.cljs$core$ILookup$_lookup$arity$2(coll__16818, k)
  };
  var G__16847__3 = function(this_sym16815, k, not_found) {
    var this__16816 = this;
    var this_sym16815__16819 = this;
    var coll__16820 = this_sym16815__16819;
    return coll__16820.cljs$core$ILookup$_lookup$arity$3(coll__16820, k, not_found)
  };
  G__16847 = function(this_sym16815, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__16847__2.call(this, this_sym16815, k);
      case 3:
        return G__16847__3.call(this, this_sym16815, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__16847
}();
cljs.core.PersistentTreeMap.prototype.apply = function(this_sym16801, args16802) {
  var this__16821 = this;
  return this_sym16801.call.apply(this_sym16801, [this_sym16801].concat(args16802.slice()))
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IKVReduce$_kv_reduce$arity$3 = function(coll, f, init) {
  var this__16822 = this;
  if(!(this__16822.tree == null)) {
    return cljs.core.tree_map_kv_reduce.call(null, this__16822.tree, f, init)
  }else {
    return init
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, entry) {
  var this__16823 = this;
  if(cljs.core.vector_QMARK_.call(null, entry)) {
    return coll.cljs$core$IAssociative$_assoc$arity$3(coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IReversible$_rseq$arity$1 = function(coll) {
  var this__16824 = this;
  if(this__16824.cnt > 0) {
    return cljs.core.create_tree_map_seq.call(null, this__16824.tree, false, this__16824.cnt)
  }else {
    return null
  }
};
cljs.core.PersistentTreeMap.prototype.toString = function() {
  var this__16825 = this;
  var this__16826 = this;
  return cljs.core.pr_str.call(null, this__16826)
};
cljs.core.PersistentTreeMap.prototype.entry_at = function(k) {
  var this__16827 = this;
  var coll__16828 = this;
  var t__16829 = this__16827.tree;
  while(true) {
    if(!(t__16829 == null)) {
      var c__16830 = this__16827.comp.call(null, k, t__16829.key);
      if(c__16830 === 0) {
        return t__16829
      }else {
        if(c__16830 < 0) {
          var G__16848 = t__16829.left;
          t__16829 = G__16848;
          continue
        }else {
          if("\ufdd0'else") {
            var G__16849 = t__16829.right;
            t__16829 = G__16849;
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
  var this__16831 = this;
  if(this__16831.cnt > 0) {
    return cljs.core.create_tree_map_seq.call(null, this__16831.tree, ascending_QMARK_, this__16831.cnt)
  }else {
    return null
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ISorted$_sorted_seq_from$arity$3 = function(coll, k, ascending_QMARK_) {
  var this__16832 = this;
  if(this__16832.cnt > 0) {
    var stack__16833 = null;
    var t__16834 = this__16832.tree;
    while(true) {
      if(!(t__16834 == null)) {
        var c__16835 = this__16832.comp.call(null, k, t__16834.key);
        if(c__16835 === 0) {
          return new cljs.core.PersistentTreeMapSeq(null, cljs.core.conj.call(null, stack__16833, t__16834), ascending_QMARK_, -1, null)
        }else {
          if(cljs.core.truth_(ascending_QMARK_)) {
            if(c__16835 < 0) {
              var G__16850 = cljs.core.conj.call(null, stack__16833, t__16834);
              var G__16851 = t__16834.left;
              stack__16833 = G__16850;
              t__16834 = G__16851;
              continue
            }else {
              var G__16852 = stack__16833;
              var G__16853 = t__16834.right;
              stack__16833 = G__16852;
              t__16834 = G__16853;
              continue
            }
          }else {
            if("\ufdd0'else") {
              if(c__16835 > 0) {
                var G__16854 = cljs.core.conj.call(null, stack__16833, t__16834);
                var G__16855 = t__16834.right;
                stack__16833 = G__16854;
                t__16834 = G__16855;
                continue
              }else {
                var G__16856 = stack__16833;
                var G__16857 = t__16834.left;
                stack__16833 = G__16856;
                t__16834 = G__16857;
                continue
              }
            }else {
              return null
            }
          }
        }
      }else {
        if(stack__16833 == null) {
          return new cljs.core.PersistentTreeMapSeq(null, stack__16833, ascending_QMARK_, -1, null)
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
  var this__16836 = this;
  return cljs.core.key.call(null, entry)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ISorted$_comparator$arity$1 = function(coll) {
  var this__16837 = this;
  return this__16837.comp
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__16838 = this;
  if(this__16838.cnt > 0) {
    return cljs.core.create_tree_map_seq.call(null, this__16838.tree, true, this__16838.cnt)
  }else {
    return null
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__16839 = this;
  return this__16839.cnt
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__16840 = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__16841 = this;
  return new cljs.core.PersistentTreeMap(this__16841.comp, this__16841.tree, this__16841.cnt, meta, this__16841.__hash)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__16842 = this;
  return this__16842.meta
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__16843 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentTreeMap.EMPTY, this__16843.meta)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IMap$_dissoc$arity$2 = function(coll, k) {
  var this__16844 = this;
  var found__16845 = [null];
  var t__16846 = cljs.core.tree_map_remove.call(null, this__16844.comp, this__16844.tree, k, found__16845);
  if(t__16846 == null) {
    if(cljs.core.nth.call(null, found__16845, 0) == null) {
      return coll
    }else {
      return new cljs.core.PersistentTreeMap(this__16844.comp, null, 0, this__16844.meta, null)
    }
  }else {
    return new cljs.core.PersistentTreeMap(this__16844.comp, t__16846.blacken(), this__16844.cnt - 1, this__16844.meta, null)
  }
};
cljs.core.PersistentTreeMap;
cljs.core.PersistentTreeMap.EMPTY = new cljs.core.PersistentTreeMap(cljs.core.compare, null, 0, null, 0);
cljs.core.hash_map = function() {
  var hash_map__delegate = function(keyvals) {
    var in__16860 = cljs.core.seq.call(null, keyvals);
    var out__16861 = cljs.core.transient$.call(null, cljs.core.PersistentHashMap.EMPTY);
    while(true) {
      if(in__16860) {
        var G__16862 = cljs.core.nnext.call(null, in__16860);
        var G__16863 = cljs.core.assoc_BANG_.call(null, out__16861, cljs.core.first.call(null, in__16860), cljs.core.second.call(null, in__16860));
        in__16860 = G__16862;
        out__16861 = G__16863;
        continue
      }else {
        return cljs.core.persistent_BANG_.call(null, out__16861)
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
  hash_map.cljs$lang$applyTo = function(arglist__16864) {
    var keyvals = cljs.core.seq(arglist__16864);
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
  array_map.cljs$lang$applyTo = function(arglist__16865) {
    var keyvals = cljs.core.seq(arglist__16865);
    return array_map__delegate(keyvals)
  };
  array_map.cljs$lang$arity$variadic = array_map__delegate;
  return array_map
}();
cljs.core.obj_map = function() {
  var obj_map__delegate = function(keyvals) {
    var ks__16869 = [];
    var obj__16870 = {};
    var kvs__16871 = cljs.core.seq.call(null, keyvals);
    while(true) {
      if(kvs__16871) {
        ks__16869.push(cljs.core.first.call(null, kvs__16871));
        obj__16870[cljs.core.first.call(null, kvs__16871)] = cljs.core.second.call(null, kvs__16871);
        var G__16872 = cljs.core.nnext.call(null, kvs__16871);
        kvs__16871 = G__16872;
        continue
      }else {
        return cljs.core.ObjMap.fromObject.call(null, ks__16869, obj__16870)
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
  obj_map.cljs$lang$applyTo = function(arglist__16873) {
    var keyvals = cljs.core.seq(arglist__16873);
    return obj_map__delegate(keyvals)
  };
  obj_map.cljs$lang$arity$variadic = obj_map__delegate;
  return obj_map
}();
cljs.core.sorted_map = function() {
  var sorted_map__delegate = function(keyvals) {
    var in__16876 = cljs.core.seq.call(null, keyvals);
    var out__16877 = cljs.core.PersistentTreeMap.EMPTY;
    while(true) {
      if(in__16876) {
        var G__16878 = cljs.core.nnext.call(null, in__16876);
        var G__16879 = cljs.core.assoc.call(null, out__16877, cljs.core.first.call(null, in__16876), cljs.core.second.call(null, in__16876));
        in__16876 = G__16878;
        out__16877 = G__16879;
        continue
      }else {
        return out__16877
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
  sorted_map.cljs$lang$applyTo = function(arglist__16880) {
    var keyvals = cljs.core.seq(arglist__16880);
    return sorted_map__delegate(keyvals)
  };
  sorted_map.cljs$lang$arity$variadic = sorted_map__delegate;
  return sorted_map
}();
cljs.core.sorted_map_by = function() {
  var sorted_map_by__delegate = function(comparator, keyvals) {
    var in__16883 = cljs.core.seq.call(null, keyvals);
    var out__16884 = new cljs.core.PersistentTreeMap(comparator, null, 0, null, 0);
    while(true) {
      if(in__16883) {
        var G__16885 = cljs.core.nnext.call(null, in__16883);
        var G__16886 = cljs.core.assoc.call(null, out__16884, cljs.core.first.call(null, in__16883), cljs.core.second.call(null, in__16883));
        in__16883 = G__16885;
        out__16884 = G__16886;
        continue
      }else {
        return out__16884
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
  sorted_map_by.cljs$lang$applyTo = function(arglist__16887) {
    var comparator = cljs.core.first(arglist__16887);
    var keyvals = cljs.core.rest(arglist__16887);
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
      return cljs.core.reduce.call(null, function(p1__16888_SHARP_, p2__16889_SHARP_) {
        return cljs.core.conj.call(null, function() {
          var or__3824__auto____16891 = p1__16888_SHARP_;
          if(cljs.core.truth_(or__3824__auto____16891)) {
            return or__3824__auto____16891
          }else {
            return cljs.core.ObjMap.EMPTY
          }
        }(), p2__16889_SHARP_)
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
  merge.cljs$lang$applyTo = function(arglist__16892) {
    var maps = cljs.core.seq(arglist__16892);
    return merge__delegate(maps)
  };
  merge.cljs$lang$arity$variadic = merge__delegate;
  return merge
}();
cljs.core.merge_with = function() {
  var merge_with__delegate = function(f, maps) {
    if(cljs.core.truth_(cljs.core.some.call(null, cljs.core.identity, maps))) {
      var merge_entry__16900 = function(m, e) {
        var k__16898 = cljs.core.first.call(null, e);
        var v__16899 = cljs.core.second.call(null, e);
        if(cljs.core.contains_QMARK_.call(null, m, k__16898)) {
          return cljs.core.assoc.call(null, m, k__16898, f.call(null, cljs.core._lookup.call(null, m, k__16898, null), v__16899))
        }else {
          return cljs.core.assoc.call(null, m, k__16898, v__16899)
        }
      };
      var merge2__16902 = function(m1, m2) {
        return cljs.core.reduce.call(null, merge_entry__16900, function() {
          var or__3824__auto____16901 = m1;
          if(cljs.core.truth_(or__3824__auto____16901)) {
            return or__3824__auto____16901
          }else {
            return cljs.core.ObjMap.EMPTY
          }
        }(), cljs.core.seq.call(null, m2))
      };
      return cljs.core.reduce.call(null, merge2__16902, maps)
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
  merge_with.cljs$lang$applyTo = function(arglist__16903) {
    var f = cljs.core.first(arglist__16903);
    var maps = cljs.core.rest(arglist__16903);
    return merge_with__delegate(f, maps)
  };
  merge_with.cljs$lang$arity$variadic = merge_with__delegate;
  return merge_with
}();
cljs.core.select_keys = function select_keys(map, keyseq) {
  var ret__16908 = cljs.core.ObjMap.EMPTY;
  var keys__16909 = cljs.core.seq.call(null, keyseq);
  while(true) {
    if(keys__16909) {
      var key__16910 = cljs.core.first.call(null, keys__16909);
      var entry__16911 = cljs.core._lookup.call(null, map, key__16910, "\ufdd0'cljs.core/not-found");
      var G__16912 = cljs.core.not_EQ_.call(null, entry__16911, "\ufdd0'cljs.core/not-found") ? cljs.core.assoc.call(null, ret__16908, key__16910, entry__16911) : ret__16908;
      var G__16913 = cljs.core.next.call(null, keys__16909);
      ret__16908 = G__16912;
      keys__16909 = G__16913;
      continue
    }else {
      return ret__16908
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
cljs.core.PersistentHashSet.cljs$lang$ctorPrSeq = function(this__2311__auto__) {
  return cljs.core.list.call(null, "cljs.core/PersistentHashSet")
};
cljs.core.PersistentHashSet.prototype.cljs$core$IEditableCollection$_as_transient$arity$1 = function(coll) {
  var this__16917 = this;
  return new cljs.core.TransientHashSet(cljs.core.transient$.call(null, this__16917.hash_map))
};
cljs.core.PersistentHashSet.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__16918 = this;
  var h__2194__auto____16919 = this__16918.__hash;
  if(!(h__2194__auto____16919 == null)) {
    return h__2194__auto____16919
  }else {
    var h__2194__auto____16920 = cljs.core.hash_iset.call(null, coll);
    this__16918.__hash = h__2194__auto____16920;
    return h__2194__auto____16920
  }
};
cljs.core.PersistentHashSet.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, v) {
  var this__16921 = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(coll, v, null)
};
cljs.core.PersistentHashSet.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, v, not_found) {
  var this__16922 = this;
  if(cljs.core.truth_(cljs.core._contains_key_QMARK_.call(null, this__16922.hash_map, v))) {
    return v
  }else {
    return not_found
  }
};
cljs.core.PersistentHashSet.prototype.call = function() {
  var G__16943 = null;
  var G__16943__2 = function(this_sym16923, k) {
    var this__16925 = this;
    var this_sym16923__16926 = this;
    var coll__16927 = this_sym16923__16926;
    return coll__16927.cljs$core$ILookup$_lookup$arity$2(coll__16927, k)
  };
  var G__16943__3 = function(this_sym16924, k, not_found) {
    var this__16925 = this;
    var this_sym16924__16928 = this;
    var coll__16929 = this_sym16924__16928;
    return coll__16929.cljs$core$ILookup$_lookup$arity$3(coll__16929, k, not_found)
  };
  G__16943 = function(this_sym16924, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__16943__2.call(this, this_sym16924, k);
      case 3:
        return G__16943__3.call(this, this_sym16924, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__16943
}();
cljs.core.PersistentHashSet.prototype.apply = function(this_sym16915, args16916) {
  var this__16930 = this;
  return this_sym16915.call.apply(this_sym16915, [this_sym16915].concat(args16916.slice()))
};
cljs.core.PersistentHashSet.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__16931 = this;
  return new cljs.core.PersistentHashSet(this__16931.meta, cljs.core.assoc.call(null, this__16931.hash_map, o, null), null)
};
cljs.core.PersistentHashSet.prototype.toString = function() {
  var this__16932 = this;
  var this__16933 = this;
  return cljs.core.pr_str.call(null, this__16933)
};
cljs.core.PersistentHashSet.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__16934 = this;
  return cljs.core.keys.call(null, this__16934.hash_map)
};
cljs.core.PersistentHashSet.prototype.cljs$core$ISet$_disjoin$arity$2 = function(coll, v) {
  var this__16935 = this;
  return new cljs.core.PersistentHashSet(this__16935.meta, cljs.core.dissoc.call(null, this__16935.hash_map, v), null)
};
cljs.core.PersistentHashSet.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__16936 = this;
  return cljs.core.count.call(null, cljs.core.seq.call(null, coll))
};
cljs.core.PersistentHashSet.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__16937 = this;
  var and__3822__auto____16938 = cljs.core.set_QMARK_.call(null, other);
  if(and__3822__auto____16938) {
    var and__3822__auto____16939 = cljs.core.count.call(null, coll) === cljs.core.count.call(null, other);
    if(and__3822__auto____16939) {
      return cljs.core.every_QMARK_.call(null, function(p1__16914_SHARP_) {
        return cljs.core.contains_QMARK_.call(null, coll, p1__16914_SHARP_)
      }, other)
    }else {
      return and__3822__auto____16939
    }
  }else {
    return and__3822__auto____16938
  }
};
cljs.core.PersistentHashSet.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__16940 = this;
  return new cljs.core.PersistentHashSet(meta, this__16940.hash_map, this__16940.__hash)
};
cljs.core.PersistentHashSet.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__16941 = this;
  return this__16941.meta
};
cljs.core.PersistentHashSet.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__16942 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentHashSet.EMPTY, this__16942.meta)
};
cljs.core.PersistentHashSet;
cljs.core.PersistentHashSet.EMPTY = new cljs.core.PersistentHashSet(null, cljs.core.hash_map.call(null), 0);
cljs.core.PersistentHashSet.fromArray = function(items) {
  var len__16944 = cljs.core.count.call(null, items);
  var i__16945 = 0;
  var out__16946 = cljs.core.transient$.call(null, cljs.core.PersistentHashSet.EMPTY);
  while(true) {
    if(i__16945 < len__16944) {
      var G__16947 = i__16945 + 1;
      var G__16948 = cljs.core.conj_BANG_.call(null, out__16946, items[i__16945]);
      i__16945 = G__16947;
      out__16946 = G__16948;
      continue
    }else {
      return cljs.core.persistent_BANG_.call(null, out__16946)
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
cljs.core.TransientHashSet.cljs$lang$ctorPrSeq = function(this__2311__auto__) {
  return cljs.core.list.call(null, "cljs.core/TransientHashSet")
};
cljs.core.TransientHashSet.prototype.call = function() {
  var G__16966 = null;
  var G__16966__2 = function(this_sym16952, k) {
    var this__16954 = this;
    var this_sym16952__16955 = this;
    var tcoll__16956 = this_sym16952__16955;
    if(cljs.core._lookup.call(null, this__16954.transient_map, k, cljs.core.lookup_sentinel) === cljs.core.lookup_sentinel) {
      return null
    }else {
      return k
    }
  };
  var G__16966__3 = function(this_sym16953, k, not_found) {
    var this__16954 = this;
    var this_sym16953__16957 = this;
    var tcoll__16958 = this_sym16953__16957;
    if(cljs.core._lookup.call(null, this__16954.transient_map, k, cljs.core.lookup_sentinel) === cljs.core.lookup_sentinel) {
      return not_found
    }else {
      return k
    }
  };
  G__16966 = function(this_sym16953, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__16966__2.call(this, this_sym16953, k);
      case 3:
        return G__16966__3.call(this, this_sym16953, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__16966
}();
cljs.core.TransientHashSet.prototype.apply = function(this_sym16950, args16951) {
  var this__16959 = this;
  return this_sym16950.call.apply(this_sym16950, [this_sym16950].concat(args16951.slice()))
};
cljs.core.TransientHashSet.prototype.cljs$core$ILookup$_lookup$arity$2 = function(tcoll, v) {
  var this__16960 = this;
  return tcoll.cljs$core$ILookup$_lookup$arity$3(tcoll, v, null)
};
cljs.core.TransientHashSet.prototype.cljs$core$ILookup$_lookup$arity$3 = function(tcoll, v, not_found) {
  var this__16961 = this;
  if(cljs.core._lookup.call(null, this__16961.transient_map, v, cljs.core.lookup_sentinel) === cljs.core.lookup_sentinel) {
    return not_found
  }else {
    return v
  }
};
cljs.core.TransientHashSet.prototype.cljs$core$ICounted$_count$arity$1 = function(tcoll) {
  var this__16962 = this;
  return cljs.core.count.call(null, this__16962.transient_map)
};
cljs.core.TransientHashSet.prototype.cljs$core$ITransientSet$_disjoin_BANG_$arity$2 = function(tcoll, v) {
  var this__16963 = this;
  this__16963.transient_map = cljs.core.dissoc_BANG_.call(null, this__16963.transient_map, v);
  return tcoll
};
cljs.core.TransientHashSet.prototype.cljs$core$ITransientCollection$_conj_BANG_$arity$2 = function(tcoll, o) {
  var this__16964 = this;
  this__16964.transient_map = cljs.core.assoc_BANG_.call(null, this__16964.transient_map, o, null);
  return tcoll
};
cljs.core.TransientHashSet.prototype.cljs$core$ITransientCollection$_persistent_BANG_$arity$1 = function(tcoll) {
  var this__16965 = this;
  return new cljs.core.PersistentHashSet(null, cljs.core.persistent_BANG_.call(null, this__16965.transient_map), null)
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
cljs.core.PersistentTreeSet.cljs$lang$ctorPrSeq = function(this__2311__auto__) {
  return cljs.core.list.call(null, "cljs.core/PersistentTreeSet")
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__16969 = this;
  var h__2194__auto____16970 = this__16969.__hash;
  if(!(h__2194__auto____16970 == null)) {
    return h__2194__auto____16970
  }else {
    var h__2194__auto____16971 = cljs.core.hash_iset.call(null, coll);
    this__16969.__hash = h__2194__auto____16971;
    return h__2194__auto____16971
  }
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, v) {
  var this__16972 = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(coll, v, null)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, v, not_found) {
  var this__16973 = this;
  if(cljs.core.truth_(cljs.core._contains_key_QMARK_.call(null, this__16973.tree_map, v))) {
    return v
  }else {
    return not_found
  }
};
cljs.core.PersistentTreeSet.prototype.call = function() {
  var G__16999 = null;
  var G__16999__2 = function(this_sym16974, k) {
    var this__16976 = this;
    var this_sym16974__16977 = this;
    var coll__16978 = this_sym16974__16977;
    return coll__16978.cljs$core$ILookup$_lookup$arity$2(coll__16978, k)
  };
  var G__16999__3 = function(this_sym16975, k, not_found) {
    var this__16976 = this;
    var this_sym16975__16979 = this;
    var coll__16980 = this_sym16975__16979;
    return coll__16980.cljs$core$ILookup$_lookup$arity$3(coll__16980, k, not_found)
  };
  G__16999 = function(this_sym16975, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__16999__2.call(this, this_sym16975, k);
      case 3:
        return G__16999__3.call(this, this_sym16975, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__16999
}();
cljs.core.PersistentTreeSet.prototype.apply = function(this_sym16967, args16968) {
  var this__16981 = this;
  return this_sym16967.call.apply(this_sym16967, [this_sym16967].concat(args16968.slice()))
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__16982 = this;
  return new cljs.core.PersistentTreeSet(this__16982.meta, cljs.core.assoc.call(null, this__16982.tree_map, o, null), null)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IReversible$_rseq$arity$1 = function(coll) {
  var this__16983 = this;
  return cljs.core.map.call(null, cljs.core.key, cljs.core.rseq.call(null, this__16983.tree_map))
};
cljs.core.PersistentTreeSet.prototype.toString = function() {
  var this__16984 = this;
  var this__16985 = this;
  return cljs.core.pr_str.call(null, this__16985)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISorted$_sorted_seq$arity$2 = function(coll, ascending_QMARK_) {
  var this__16986 = this;
  return cljs.core.map.call(null, cljs.core.key, cljs.core._sorted_seq.call(null, this__16986.tree_map, ascending_QMARK_))
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISorted$_sorted_seq_from$arity$3 = function(coll, k, ascending_QMARK_) {
  var this__16987 = this;
  return cljs.core.map.call(null, cljs.core.key, cljs.core._sorted_seq_from.call(null, this__16987.tree_map, k, ascending_QMARK_))
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISorted$_entry_key$arity$2 = function(coll, entry) {
  var this__16988 = this;
  return entry
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISorted$_comparator$arity$1 = function(coll) {
  var this__16989 = this;
  return cljs.core._comparator.call(null, this__16989.tree_map)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__16990 = this;
  return cljs.core.keys.call(null, this__16990.tree_map)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISet$_disjoin$arity$2 = function(coll, v) {
  var this__16991 = this;
  return new cljs.core.PersistentTreeSet(this__16991.meta, cljs.core.dissoc.call(null, this__16991.tree_map, v), null)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__16992 = this;
  return cljs.core.count.call(null, this__16992.tree_map)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__16993 = this;
  var and__3822__auto____16994 = cljs.core.set_QMARK_.call(null, other);
  if(and__3822__auto____16994) {
    var and__3822__auto____16995 = cljs.core.count.call(null, coll) === cljs.core.count.call(null, other);
    if(and__3822__auto____16995) {
      return cljs.core.every_QMARK_.call(null, function(p1__16949_SHARP_) {
        return cljs.core.contains_QMARK_.call(null, coll, p1__16949_SHARP_)
      }, other)
    }else {
      return and__3822__auto____16995
    }
  }else {
    return and__3822__auto____16994
  }
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__16996 = this;
  return new cljs.core.PersistentTreeSet(meta, this__16996.tree_map, this__16996.__hash)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__16997 = this;
  return this__16997.meta
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__16998 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentTreeSet.EMPTY, this__16998.meta)
};
cljs.core.PersistentTreeSet;
cljs.core.PersistentTreeSet.EMPTY = new cljs.core.PersistentTreeSet(null, cljs.core.sorted_map.call(null), 0);
cljs.core.hash_set = function() {
  var hash_set = null;
  var hash_set__0 = function() {
    return cljs.core.PersistentHashSet.EMPTY
  };
  var hash_set__1 = function() {
    var G__17004__delegate = function(keys) {
      var in__17002 = cljs.core.seq.call(null, keys);
      var out__17003 = cljs.core.transient$.call(null, cljs.core.PersistentHashSet.EMPTY);
      while(true) {
        if(cljs.core.seq.call(null, in__17002)) {
          var G__17005 = cljs.core.next.call(null, in__17002);
          var G__17006 = cljs.core.conj_BANG_.call(null, out__17003, cljs.core.first.call(null, in__17002));
          in__17002 = G__17005;
          out__17003 = G__17006;
          continue
        }else {
          return cljs.core.persistent_BANG_.call(null, out__17003)
        }
        break
      }
    };
    var G__17004 = function(var_args) {
      var keys = null;
      if(goog.isDef(var_args)) {
        keys = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
      }
      return G__17004__delegate.call(this, keys)
    };
    G__17004.cljs$lang$maxFixedArity = 0;
    G__17004.cljs$lang$applyTo = function(arglist__17007) {
      var keys = cljs.core.seq(arglist__17007);
      return G__17004__delegate(keys)
    };
    G__17004.cljs$lang$arity$variadic = G__17004__delegate;
    return G__17004
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
  sorted_set.cljs$lang$applyTo = function(arglist__17008) {
    var keys = cljs.core.seq(arglist__17008);
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
  sorted_set_by.cljs$lang$applyTo = function(arglist__17010) {
    var comparator = cljs.core.first(arglist__17010);
    var keys = cljs.core.rest(arglist__17010);
    return sorted_set_by__delegate(comparator, keys)
  };
  sorted_set_by.cljs$lang$arity$variadic = sorted_set_by__delegate;
  return sorted_set_by
}();
cljs.core.replace = function replace(smap, coll) {
  if(cljs.core.vector_QMARK_.call(null, coll)) {
    var n__17016 = cljs.core.count.call(null, coll);
    return cljs.core.reduce.call(null, function(v, i) {
      var temp__3971__auto____17017 = cljs.core.find.call(null, smap, cljs.core.nth.call(null, v, i));
      if(cljs.core.truth_(temp__3971__auto____17017)) {
        var e__17018 = temp__3971__auto____17017;
        return cljs.core.assoc.call(null, v, i, cljs.core.second.call(null, e__17018))
      }else {
        return v
      }
    }, coll, cljs.core.take.call(null, n__17016, cljs.core.iterate.call(null, cljs.core.inc, 0)))
  }else {
    return cljs.core.map.call(null, function(p1__17009_SHARP_) {
      var temp__3971__auto____17019 = cljs.core.find.call(null, smap, p1__17009_SHARP_);
      if(cljs.core.truth_(temp__3971__auto____17019)) {
        var e__17020 = temp__3971__auto____17019;
        return cljs.core.second.call(null, e__17020)
      }else {
        return p1__17009_SHARP_
      }
    }, coll)
  }
};
cljs.core.distinct = function distinct(coll) {
  var step__17050 = function step(xs, seen) {
    return new cljs.core.LazySeq(null, false, function() {
      return function(p__17043, seen) {
        while(true) {
          var vec__17044__17045 = p__17043;
          var f__17046 = cljs.core.nth.call(null, vec__17044__17045, 0, null);
          var xs__17047 = vec__17044__17045;
          var temp__3974__auto____17048 = cljs.core.seq.call(null, xs__17047);
          if(temp__3974__auto____17048) {
            var s__17049 = temp__3974__auto____17048;
            if(cljs.core.contains_QMARK_.call(null, seen, f__17046)) {
              var G__17051 = cljs.core.rest.call(null, s__17049);
              var G__17052 = seen;
              p__17043 = G__17051;
              seen = G__17052;
              continue
            }else {
              return cljs.core.cons.call(null, f__17046, step.call(null, cljs.core.rest.call(null, s__17049), cljs.core.conj.call(null, seen, f__17046)))
            }
          }else {
            return null
          }
          break
        }
      }.call(null, xs, seen)
    }, null)
  };
  return step__17050.call(null, coll, cljs.core.PersistentHashSet.EMPTY)
};
cljs.core.butlast = function butlast(s) {
  var ret__17055 = cljs.core.PersistentVector.EMPTY;
  var s__17056 = s;
  while(true) {
    if(cljs.core.next.call(null, s__17056)) {
      var G__17057 = cljs.core.conj.call(null, ret__17055, cljs.core.first.call(null, s__17056));
      var G__17058 = cljs.core.next.call(null, s__17056);
      ret__17055 = G__17057;
      s__17056 = G__17058;
      continue
    }else {
      return cljs.core.seq.call(null, ret__17055)
    }
    break
  }
};
cljs.core.name = function name(x) {
  if(cljs.core.string_QMARK_.call(null, x)) {
    return x
  }else {
    if(function() {
      var or__3824__auto____17061 = cljs.core.keyword_QMARK_.call(null, x);
      if(or__3824__auto____17061) {
        return or__3824__auto____17061
      }else {
        return cljs.core.symbol_QMARK_.call(null, x)
      }
    }()) {
      var i__17062 = x.lastIndexOf("/");
      if(i__17062 < 0) {
        return cljs.core.subs.call(null, x, 2)
      }else {
        return cljs.core.subs.call(null, x, i__17062 + 1)
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
    var or__3824__auto____17065 = cljs.core.keyword_QMARK_.call(null, x);
    if(or__3824__auto____17065) {
      return or__3824__auto____17065
    }else {
      return cljs.core.symbol_QMARK_.call(null, x)
    }
  }()) {
    var i__17066 = x.lastIndexOf("/");
    if(i__17066 > -1) {
      return cljs.core.subs.call(null, x, 2, i__17066)
    }else {
      return null
    }
  }else {
    throw new Error([cljs.core.str("Doesn't support namespace: "), cljs.core.str(x)].join(""));
  }
};
cljs.core.zipmap = function zipmap(keys, vals) {
  var map__17073 = cljs.core.ObjMap.EMPTY;
  var ks__17074 = cljs.core.seq.call(null, keys);
  var vs__17075 = cljs.core.seq.call(null, vals);
  while(true) {
    if(function() {
      var and__3822__auto____17076 = ks__17074;
      if(and__3822__auto____17076) {
        return vs__17075
      }else {
        return and__3822__auto____17076
      }
    }()) {
      var G__17077 = cljs.core.assoc.call(null, map__17073, cljs.core.first.call(null, ks__17074), cljs.core.first.call(null, vs__17075));
      var G__17078 = cljs.core.next.call(null, ks__17074);
      var G__17079 = cljs.core.next.call(null, vs__17075);
      map__17073 = G__17077;
      ks__17074 = G__17078;
      vs__17075 = G__17079;
      continue
    }else {
      return map__17073
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
    var G__17082__delegate = function(k, x, y, more) {
      return cljs.core.reduce.call(null, function(p1__17067_SHARP_, p2__17068_SHARP_) {
        return max_key.call(null, k, p1__17067_SHARP_, p2__17068_SHARP_)
      }, max_key.call(null, k, x, y), more)
    };
    var G__17082 = function(k, x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__17082__delegate.call(this, k, x, y, more)
    };
    G__17082.cljs$lang$maxFixedArity = 3;
    G__17082.cljs$lang$applyTo = function(arglist__17083) {
      var k = cljs.core.first(arglist__17083);
      var x = cljs.core.first(cljs.core.next(arglist__17083));
      var y = cljs.core.first(cljs.core.next(cljs.core.next(arglist__17083)));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__17083)));
      return G__17082__delegate(k, x, y, more)
    };
    G__17082.cljs$lang$arity$variadic = G__17082__delegate;
    return G__17082
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
    var G__17084__delegate = function(k, x, y, more) {
      return cljs.core.reduce.call(null, function(p1__17080_SHARP_, p2__17081_SHARP_) {
        return min_key.call(null, k, p1__17080_SHARP_, p2__17081_SHARP_)
      }, min_key.call(null, k, x, y), more)
    };
    var G__17084 = function(k, x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__17084__delegate.call(this, k, x, y, more)
    };
    G__17084.cljs$lang$maxFixedArity = 3;
    G__17084.cljs$lang$applyTo = function(arglist__17085) {
      var k = cljs.core.first(arglist__17085);
      var x = cljs.core.first(cljs.core.next(arglist__17085));
      var y = cljs.core.first(cljs.core.next(cljs.core.next(arglist__17085)));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__17085)));
      return G__17084__delegate(k, x, y, more)
    };
    G__17084.cljs$lang$arity$variadic = G__17084__delegate;
    return G__17084
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
      var temp__3974__auto____17088 = cljs.core.seq.call(null, coll);
      if(temp__3974__auto____17088) {
        var s__17089 = temp__3974__auto____17088;
        return cljs.core.cons.call(null, cljs.core.take.call(null, n, s__17089), partition_all.call(null, n, step, cljs.core.drop.call(null, step, s__17089)))
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
    var temp__3974__auto____17092 = cljs.core.seq.call(null, coll);
    if(temp__3974__auto____17092) {
      var s__17093 = temp__3974__auto____17092;
      if(cljs.core.truth_(pred.call(null, cljs.core.first.call(null, s__17093)))) {
        return cljs.core.cons.call(null, cljs.core.first.call(null, s__17093), take_while.call(null, pred, cljs.core.rest.call(null, s__17093)))
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
    var comp__17095 = cljs.core._comparator.call(null, sc);
    return test.call(null, comp__17095.call(null, cljs.core._entry_key.call(null, sc, e), key), 0)
  }
};
cljs.core.subseq = function() {
  var subseq = null;
  var subseq__3 = function(sc, test, key) {
    var include__17107 = cljs.core.mk_bound_fn.call(null, sc, test, key);
    if(cljs.core.truth_(cljs.core.PersistentHashSet.fromArray([cljs.core._GT_, cljs.core._GT__EQ_]).call(null, test))) {
      var temp__3974__auto____17108 = cljs.core._sorted_seq_from.call(null, sc, key, true);
      if(cljs.core.truth_(temp__3974__auto____17108)) {
        var vec__17109__17110 = temp__3974__auto____17108;
        var e__17111 = cljs.core.nth.call(null, vec__17109__17110, 0, null);
        var s__17112 = vec__17109__17110;
        if(cljs.core.truth_(include__17107.call(null, e__17111))) {
          return s__17112
        }else {
          return cljs.core.next.call(null, s__17112)
        }
      }else {
        return null
      }
    }else {
      return cljs.core.take_while.call(null, include__17107, cljs.core._sorted_seq.call(null, sc, true))
    }
  };
  var subseq__5 = function(sc, start_test, start_key, end_test, end_key) {
    var temp__3974__auto____17113 = cljs.core._sorted_seq_from.call(null, sc, start_key, true);
    if(cljs.core.truth_(temp__3974__auto____17113)) {
      var vec__17114__17115 = temp__3974__auto____17113;
      var e__17116 = cljs.core.nth.call(null, vec__17114__17115, 0, null);
      var s__17117 = vec__17114__17115;
      return cljs.core.take_while.call(null, cljs.core.mk_bound_fn.call(null, sc, end_test, end_key), cljs.core.truth_(cljs.core.mk_bound_fn.call(null, sc, start_test, start_key).call(null, e__17116)) ? s__17117 : cljs.core.next.call(null, s__17117))
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
    var include__17129 = cljs.core.mk_bound_fn.call(null, sc, test, key);
    if(cljs.core.truth_(cljs.core.PersistentHashSet.fromArray([cljs.core._LT_, cljs.core._LT__EQ_]).call(null, test))) {
      var temp__3974__auto____17130 = cljs.core._sorted_seq_from.call(null, sc, key, false);
      if(cljs.core.truth_(temp__3974__auto____17130)) {
        var vec__17131__17132 = temp__3974__auto____17130;
        var e__17133 = cljs.core.nth.call(null, vec__17131__17132, 0, null);
        var s__17134 = vec__17131__17132;
        if(cljs.core.truth_(include__17129.call(null, e__17133))) {
          return s__17134
        }else {
          return cljs.core.next.call(null, s__17134)
        }
      }else {
        return null
      }
    }else {
      return cljs.core.take_while.call(null, include__17129, cljs.core._sorted_seq.call(null, sc, false))
    }
  };
  var rsubseq__5 = function(sc, start_test, start_key, end_test, end_key) {
    var temp__3974__auto____17135 = cljs.core._sorted_seq_from.call(null, sc, end_key, false);
    if(cljs.core.truth_(temp__3974__auto____17135)) {
      var vec__17136__17137 = temp__3974__auto____17135;
      var e__17138 = cljs.core.nth.call(null, vec__17136__17137, 0, null);
      var s__17139 = vec__17136__17137;
      return cljs.core.take_while.call(null, cljs.core.mk_bound_fn.call(null, sc, start_test, start_key), cljs.core.truth_(cljs.core.mk_bound_fn.call(null, sc, end_test, end_key).call(null, e__17138)) ? s__17139 : cljs.core.next.call(null, s__17139))
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
cljs.core.Range.cljs$lang$ctorPrSeq = function(this__2311__auto__) {
  return cljs.core.list.call(null, "cljs.core/Range")
};
cljs.core.Range.prototype.cljs$core$IHash$_hash$arity$1 = function(rng) {
  var this__17140 = this;
  var h__2194__auto____17141 = this__17140.__hash;
  if(!(h__2194__auto____17141 == null)) {
    return h__2194__auto____17141
  }else {
    var h__2194__auto____17142 = cljs.core.hash_coll.call(null, rng);
    this__17140.__hash = h__2194__auto____17142;
    return h__2194__auto____17142
  }
};
cljs.core.Range.prototype.cljs$core$INext$_next$arity$1 = function(rng) {
  var this__17143 = this;
  if(this__17143.step > 0) {
    if(this__17143.start + this__17143.step < this__17143.end) {
      return new cljs.core.Range(this__17143.meta, this__17143.start + this__17143.step, this__17143.end, this__17143.step, null)
    }else {
      return null
    }
  }else {
    if(this__17143.start + this__17143.step > this__17143.end) {
      return new cljs.core.Range(this__17143.meta, this__17143.start + this__17143.step, this__17143.end, this__17143.step, null)
    }else {
      return null
    }
  }
};
cljs.core.Range.prototype.cljs$core$ICollection$_conj$arity$2 = function(rng, o) {
  var this__17144 = this;
  return cljs.core.cons.call(null, o, rng)
};
cljs.core.Range.prototype.toString = function() {
  var this__17145 = this;
  var this__17146 = this;
  return cljs.core.pr_str.call(null, this__17146)
};
cljs.core.Range.prototype.cljs$core$IReduce$_reduce$arity$2 = function(rng, f) {
  var this__17147 = this;
  return cljs.core.ci_reduce.call(null, rng, f)
};
cljs.core.Range.prototype.cljs$core$IReduce$_reduce$arity$3 = function(rng, f, s) {
  var this__17148 = this;
  return cljs.core.ci_reduce.call(null, rng, f, s)
};
cljs.core.Range.prototype.cljs$core$ISeqable$_seq$arity$1 = function(rng) {
  var this__17149 = this;
  if(this__17149.step > 0) {
    if(this__17149.start < this__17149.end) {
      return rng
    }else {
      return null
    }
  }else {
    if(this__17149.start > this__17149.end) {
      return rng
    }else {
      return null
    }
  }
};
cljs.core.Range.prototype.cljs$core$ICounted$_count$arity$1 = function(rng) {
  var this__17150 = this;
  if(cljs.core.not.call(null, rng.cljs$core$ISeqable$_seq$arity$1(rng))) {
    return 0
  }else {
    return Math.ceil((this__17150.end - this__17150.start) / this__17150.step)
  }
};
cljs.core.Range.prototype.cljs$core$ISeq$_first$arity$1 = function(rng) {
  var this__17151 = this;
  return this__17151.start
};
cljs.core.Range.prototype.cljs$core$ISeq$_rest$arity$1 = function(rng) {
  var this__17152 = this;
  if(!(rng.cljs$core$ISeqable$_seq$arity$1(rng) == null)) {
    return new cljs.core.Range(this__17152.meta, this__17152.start + this__17152.step, this__17152.end, this__17152.step, null)
  }else {
    return cljs.core.List.EMPTY
  }
};
cljs.core.Range.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(rng, other) {
  var this__17153 = this;
  return cljs.core.equiv_sequential.call(null, rng, other)
};
cljs.core.Range.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(rng, meta) {
  var this__17154 = this;
  return new cljs.core.Range(meta, this__17154.start, this__17154.end, this__17154.step, this__17154.__hash)
};
cljs.core.Range.prototype.cljs$core$IMeta$_meta$arity$1 = function(rng) {
  var this__17155 = this;
  return this__17155.meta
};
cljs.core.Range.prototype.cljs$core$IIndexed$_nth$arity$2 = function(rng, n) {
  var this__17156 = this;
  if(n < rng.cljs$core$ICounted$_count$arity$1(rng)) {
    return this__17156.start + n * this__17156.step
  }else {
    if(function() {
      var and__3822__auto____17157 = this__17156.start > this__17156.end;
      if(and__3822__auto____17157) {
        return this__17156.step === 0
      }else {
        return and__3822__auto____17157
      }
    }()) {
      return this__17156.start
    }else {
      throw new Error("Index out of bounds");
    }
  }
};
cljs.core.Range.prototype.cljs$core$IIndexed$_nth$arity$3 = function(rng, n, not_found) {
  var this__17158 = this;
  if(n < rng.cljs$core$ICounted$_count$arity$1(rng)) {
    return this__17158.start + n * this__17158.step
  }else {
    if(function() {
      var and__3822__auto____17159 = this__17158.start > this__17158.end;
      if(and__3822__auto____17159) {
        return this__17158.step === 0
      }else {
        return and__3822__auto____17159
      }
    }()) {
      return this__17158.start
    }else {
      return not_found
    }
  }
};
cljs.core.Range.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(rng) {
  var this__17160 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__17160.meta)
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
    var temp__3974__auto____17163 = cljs.core.seq.call(null, coll);
    if(temp__3974__auto____17163) {
      var s__17164 = temp__3974__auto____17163;
      return cljs.core.cons.call(null, cljs.core.first.call(null, s__17164), take_nth.call(null, n, cljs.core.drop.call(null, n, s__17164)))
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
    var temp__3974__auto____17171 = cljs.core.seq.call(null, coll);
    if(temp__3974__auto____17171) {
      var s__17172 = temp__3974__auto____17171;
      var fst__17173 = cljs.core.first.call(null, s__17172);
      var fv__17174 = f.call(null, fst__17173);
      var run__17175 = cljs.core.cons.call(null, fst__17173, cljs.core.take_while.call(null, function(p1__17165_SHARP_) {
        return cljs.core._EQ_.call(null, fv__17174, f.call(null, p1__17165_SHARP_))
      }, cljs.core.next.call(null, s__17172)));
      return cljs.core.cons.call(null, run__17175, partition_by.call(null, f, cljs.core.seq.call(null, cljs.core.drop.call(null, cljs.core.count.call(null, run__17175), s__17172))))
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
      var temp__3971__auto____17190 = cljs.core.seq.call(null, coll);
      if(temp__3971__auto____17190) {
        var s__17191 = temp__3971__auto____17190;
        return reductions.call(null, f, cljs.core.first.call(null, s__17191), cljs.core.rest.call(null, s__17191))
      }else {
        return cljs.core.list.call(null, f.call(null))
      }
    }, null)
  };
  var reductions__3 = function(f, init, coll) {
    return cljs.core.cons.call(null, init, new cljs.core.LazySeq(null, false, function() {
      var temp__3974__auto____17192 = cljs.core.seq.call(null, coll);
      if(temp__3974__auto____17192) {
        var s__17193 = temp__3974__auto____17192;
        return reductions.call(null, f, f.call(null, init, cljs.core.first.call(null, s__17193)), cljs.core.rest.call(null, s__17193))
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
      var G__17196 = null;
      var G__17196__0 = function() {
        return cljs.core.vector.call(null, f.call(null))
      };
      var G__17196__1 = function(x) {
        return cljs.core.vector.call(null, f.call(null, x))
      };
      var G__17196__2 = function(x, y) {
        return cljs.core.vector.call(null, f.call(null, x, y))
      };
      var G__17196__3 = function(x, y, z) {
        return cljs.core.vector.call(null, f.call(null, x, y, z))
      };
      var G__17196__4 = function() {
        var G__17197__delegate = function(x, y, z, args) {
          return cljs.core.vector.call(null, cljs.core.apply.call(null, f, x, y, z, args))
        };
        var G__17197 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__17197__delegate.call(this, x, y, z, args)
        };
        G__17197.cljs$lang$maxFixedArity = 3;
        G__17197.cljs$lang$applyTo = function(arglist__17198) {
          var x = cljs.core.first(arglist__17198);
          var y = cljs.core.first(cljs.core.next(arglist__17198));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__17198)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__17198)));
          return G__17197__delegate(x, y, z, args)
        };
        G__17197.cljs$lang$arity$variadic = G__17197__delegate;
        return G__17197
      }();
      G__17196 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__17196__0.call(this);
          case 1:
            return G__17196__1.call(this, x);
          case 2:
            return G__17196__2.call(this, x, y);
          case 3:
            return G__17196__3.call(this, x, y, z);
          default:
            return G__17196__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__17196.cljs$lang$maxFixedArity = 3;
      G__17196.cljs$lang$applyTo = G__17196__4.cljs$lang$applyTo;
      return G__17196
    }()
  };
  var juxt__2 = function(f, g) {
    return function() {
      var G__17199 = null;
      var G__17199__0 = function() {
        return cljs.core.vector.call(null, f.call(null), g.call(null))
      };
      var G__17199__1 = function(x) {
        return cljs.core.vector.call(null, f.call(null, x), g.call(null, x))
      };
      var G__17199__2 = function(x, y) {
        return cljs.core.vector.call(null, f.call(null, x, y), g.call(null, x, y))
      };
      var G__17199__3 = function(x, y, z) {
        return cljs.core.vector.call(null, f.call(null, x, y, z), g.call(null, x, y, z))
      };
      var G__17199__4 = function() {
        var G__17200__delegate = function(x, y, z, args) {
          return cljs.core.vector.call(null, cljs.core.apply.call(null, f, x, y, z, args), cljs.core.apply.call(null, g, x, y, z, args))
        };
        var G__17200 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__17200__delegate.call(this, x, y, z, args)
        };
        G__17200.cljs$lang$maxFixedArity = 3;
        G__17200.cljs$lang$applyTo = function(arglist__17201) {
          var x = cljs.core.first(arglist__17201);
          var y = cljs.core.first(cljs.core.next(arglist__17201));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__17201)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__17201)));
          return G__17200__delegate(x, y, z, args)
        };
        G__17200.cljs$lang$arity$variadic = G__17200__delegate;
        return G__17200
      }();
      G__17199 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__17199__0.call(this);
          case 1:
            return G__17199__1.call(this, x);
          case 2:
            return G__17199__2.call(this, x, y);
          case 3:
            return G__17199__3.call(this, x, y, z);
          default:
            return G__17199__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__17199.cljs$lang$maxFixedArity = 3;
      G__17199.cljs$lang$applyTo = G__17199__4.cljs$lang$applyTo;
      return G__17199
    }()
  };
  var juxt__3 = function(f, g, h) {
    return function() {
      var G__17202 = null;
      var G__17202__0 = function() {
        return cljs.core.vector.call(null, f.call(null), g.call(null), h.call(null))
      };
      var G__17202__1 = function(x) {
        return cljs.core.vector.call(null, f.call(null, x), g.call(null, x), h.call(null, x))
      };
      var G__17202__2 = function(x, y) {
        return cljs.core.vector.call(null, f.call(null, x, y), g.call(null, x, y), h.call(null, x, y))
      };
      var G__17202__3 = function(x, y, z) {
        return cljs.core.vector.call(null, f.call(null, x, y, z), g.call(null, x, y, z), h.call(null, x, y, z))
      };
      var G__17202__4 = function() {
        var G__17203__delegate = function(x, y, z, args) {
          return cljs.core.vector.call(null, cljs.core.apply.call(null, f, x, y, z, args), cljs.core.apply.call(null, g, x, y, z, args), cljs.core.apply.call(null, h, x, y, z, args))
        };
        var G__17203 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__17203__delegate.call(this, x, y, z, args)
        };
        G__17203.cljs$lang$maxFixedArity = 3;
        G__17203.cljs$lang$applyTo = function(arglist__17204) {
          var x = cljs.core.first(arglist__17204);
          var y = cljs.core.first(cljs.core.next(arglist__17204));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__17204)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__17204)));
          return G__17203__delegate(x, y, z, args)
        };
        G__17203.cljs$lang$arity$variadic = G__17203__delegate;
        return G__17203
      }();
      G__17202 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__17202__0.call(this);
          case 1:
            return G__17202__1.call(this, x);
          case 2:
            return G__17202__2.call(this, x, y);
          case 3:
            return G__17202__3.call(this, x, y, z);
          default:
            return G__17202__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__17202.cljs$lang$maxFixedArity = 3;
      G__17202.cljs$lang$applyTo = G__17202__4.cljs$lang$applyTo;
      return G__17202
    }()
  };
  var juxt__4 = function() {
    var G__17205__delegate = function(f, g, h, fs) {
      var fs__17195 = cljs.core.list_STAR_.call(null, f, g, h, fs);
      return function() {
        var G__17206 = null;
        var G__17206__0 = function() {
          return cljs.core.reduce.call(null, function(p1__17176_SHARP_, p2__17177_SHARP_) {
            return cljs.core.conj.call(null, p1__17176_SHARP_, p2__17177_SHARP_.call(null))
          }, cljs.core.PersistentVector.EMPTY, fs__17195)
        };
        var G__17206__1 = function(x) {
          return cljs.core.reduce.call(null, function(p1__17178_SHARP_, p2__17179_SHARP_) {
            return cljs.core.conj.call(null, p1__17178_SHARP_, p2__17179_SHARP_.call(null, x))
          }, cljs.core.PersistentVector.EMPTY, fs__17195)
        };
        var G__17206__2 = function(x, y) {
          return cljs.core.reduce.call(null, function(p1__17180_SHARP_, p2__17181_SHARP_) {
            return cljs.core.conj.call(null, p1__17180_SHARP_, p2__17181_SHARP_.call(null, x, y))
          }, cljs.core.PersistentVector.EMPTY, fs__17195)
        };
        var G__17206__3 = function(x, y, z) {
          return cljs.core.reduce.call(null, function(p1__17182_SHARP_, p2__17183_SHARP_) {
            return cljs.core.conj.call(null, p1__17182_SHARP_, p2__17183_SHARP_.call(null, x, y, z))
          }, cljs.core.PersistentVector.EMPTY, fs__17195)
        };
        var G__17206__4 = function() {
          var G__17207__delegate = function(x, y, z, args) {
            return cljs.core.reduce.call(null, function(p1__17184_SHARP_, p2__17185_SHARP_) {
              return cljs.core.conj.call(null, p1__17184_SHARP_, cljs.core.apply.call(null, p2__17185_SHARP_, x, y, z, args))
            }, cljs.core.PersistentVector.EMPTY, fs__17195)
          };
          var G__17207 = function(x, y, z, var_args) {
            var args = null;
            if(goog.isDef(var_args)) {
              args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
            }
            return G__17207__delegate.call(this, x, y, z, args)
          };
          G__17207.cljs$lang$maxFixedArity = 3;
          G__17207.cljs$lang$applyTo = function(arglist__17208) {
            var x = cljs.core.first(arglist__17208);
            var y = cljs.core.first(cljs.core.next(arglist__17208));
            var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__17208)));
            var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__17208)));
            return G__17207__delegate(x, y, z, args)
          };
          G__17207.cljs$lang$arity$variadic = G__17207__delegate;
          return G__17207
        }();
        G__17206 = function(x, y, z, var_args) {
          var args = var_args;
          switch(arguments.length) {
            case 0:
              return G__17206__0.call(this);
            case 1:
              return G__17206__1.call(this, x);
            case 2:
              return G__17206__2.call(this, x, y);
            case 3:
              return G__17206__3.call(this, x, y, z);
            default:
              return G__17206__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
          }
          throw"Invalid arity: " + arguments.length;
        };
        G__17206.cljs$lang$maxFixedArity = 3;
        G__17206.cljs$lang$applyTo = G__17206__4.cljs$lang$applyTo;
        return G__17206
      }()
    };
    var G__17205 = function(f, g, h, var_args) {
      var fs = null;
      if(goog.isDef(var_args)) {
        fs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__17205__delegate.call(this, f, g, h, fs)
    };
    G__17205.cljs$lang$maxFixedArity = 3;
    G__17205.cljs$lang$applyTo = function(arglist__17209) {
      var f = cljs.core.first(arglist__17209);
      var g = cljs.core.first(cljs.core.next(arglist__17209));
      var h = cljs.core.first(cljs.core.next(cljs.core.next(arglist__17209)));
      var fs = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__17209)));
      return G__17205__delegate(f, g, h, fs)
    };
    G__17205.cljs$lang$arity$variadic = G__17205__delegate;
    return G__17205
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
        var G__17212 = cljs.core.next.call(null, coll);
        coll = G__17212;
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
        var and__3822__auto____17211 = cljs.core.seq.call(null, coll);
        if(and__3822__auto____17211) {
          return n > 0
        }else {
          return and__3822__auto____17211
        }
      }())) {
        var G__17213 = n - 1;
        var G__17214 = cljs.core.next.call(null, coll);
        n = G__17213;
        coll = G__17214;
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
  var matches__17216 = re.exec(s);
  if(cljs.core._EQ_.call(null, cljs.core.first.call(null, matches__17216), s)) {
    if(cljs.core.count.call(null, matches__17216) === 1) {
      return cljs.core.first.call(null, matches__17216)
    }else {
      return cljs.core.vec.call(null, matches__17216)
    }
  }else {
    return null
  }
};
cljs.core.re_find = function re_find(re, s) {
  var matches__17218 = re.exec(s);
  if(matches__17218 == null) {
    return null
  }else {
    if(cljs.core.count.call(null, matches__17218) === 1) {
      return cljs.core.first.call(null, matches__17218)
    }else {
      return cljs.core.vec.call(null, matches__17218)
    }
  }
};
cljs.core.re_seq = function re_seq(re, s) {
  var match_data__17223 = cljs.core.re_find.call(null, re, s);
  var match_idx__17224 = s.search(re);
  var match_str__17225 = cljs.core.coll_QMARK_.call(null, match_data__17223) ? cljs.core.first.call(null, match_data__17223) : match_data__17223;
  var post_match__17226 = cljs.core.subs.call(null, s, match_idx__17224 + cljs.core.count.call(null, match_str__17225));
  if(cljs.core.truth_(match_data__17223)) {
    return new cljs.core.LazySeq(null, false, function() {
      return cljs.core.cons.call(null, match_data__17223, re_seq.call(null, re, post_match__17226))
    }, null)
  }else {
    return null
  }
};
cljs.core.re_pattern = function re_pattern(s) {
  var vec__17233__17234 = cljs.core.re_find.call(null, /^(?:\(\?([idmsux]*)\))?(.*)/, s);
  var ___17235 = cljs.core.nth.call(null, vec__17233__17234, 0, null);
  var flags__17236 = cljs.core.nth.call(null, vec__17233__17234, 1, null);
  var pattern__17237 = cljs.core.nth.call(null, vec__17233__17234, 2, null);
  return new RegExp(pattern__17237, flags__17236)
};
cljs.core.pr_sequential = function pr_sequential(print_one, begin, sep, end, opts, coll) {
  return cljs.core.concat.call(null, cljs.core.PersistentVector.fromArray([begin], true), cljs.core.flatten1.call(null, cljs.core.interpose.call(null, cljs.core.PersistentVector.fromArray([sep], true), cljs.core.map.call(null, function(p1__17227_SHARP_) {
    return print_one.call(null, p1__17227_SHARP_, opts)
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
          var and__3822__auto____17247 = cljs.core._lookup.call(null, opts, "\ufdd0'meta", null);
          if(cljs.core.truth_(and__3822__auto____17247)) {
            var and__3822__auto____17251 = function() {
              var G__17248__17249 = obj;
              if(G__17248__17249) {
                if(function() {
                  var or__3824__auto____17250 = G__17248__17249.cljs$lang$protocol_mask$partition0$ & 131072;
                  if(or__3824__auto____17250) {
                    return or__3824__auto____17250
                  }else {
                    return G__17248__17249.cljs$core$IMeta$
                  }
                }()) {
                  return true
                }else {
                  if(!G__17248__17249.cljs$lang$protocol_mask$partition0$) {
                    return cljs.core.type_satisfies_.call(null, cljs.core.IMeta, G__17248__17249)
                  }else {
                    return false
                  }
                }
              }else {
                return cljs.core.type_satisfies_.call(null, cljs.core.IMeta, G__17248__17249)
              }
            }();
            if(cljs.core.truth_(and__3822__auto____17251)) {
              return cljs.core.meta.call(null, obj)
            }else {
              return and__3822__auto____17251
            }
          }else {
            return and__3822__auto____17247
          }
        }()) ? cljs.core.concat.call(null, cljs.core.PersistentVector.fromArray(["^"], true), pr_seq.call(null, cljs.core.meta.call(null, obj), opts), cljs.core.PersistentVector.fromArray([" "], true)) : null, function() {
          var and__3822__auto____17252 = !(obj == null);
          if(and__3822__auto____17252) {
            return obj.cljs$lang$type
          }else {
            return and__3822__auto____17252
          }
        }() ? obj.cljs$lang$ctorPrSeq(obj) : function() {
          var G__17253__17254 = obj;
          if(G__17253__17254) {
            if(function() {
              var or__3824__auto____17255 = G__17253__17254.cljs$lang$protocol_mask$partition0$ & 536870912;
              if(or__3824__auto____17255) {
                return or__3824__auto____17255
              }else {
                return G__17253__17254.cljs$core$IPrintable$
              }
            }()) {
              return true
            }else {
              if(!G__17253__17254.cljs$lang$protocol_mask$partition0$) {
                return cljs.core.type_satisfies_.call(null, cljs.core.IPrintable, G__17253__17254)
              }else {
                return false
              }
            }
          }else {
            return cljs.core.type_satisfies_.call(null, cljs.core.IPrintable, G__17253__17254)
          }
        }() ? cljs.core._pr_seq.call(null, obj, opts) : cljs.core.truth_(cljs.core.regexp_QMARK_.call(null, obj)) ? cljs.core.list.call(null, '#"', obj.source, '"') : "\ufdd0'else" ? cljs.core.list.call(null, "#<", [cljs.core.str(obj)].join(""), ">") : null)
      }else {
        return null
      }
    }
  }
};
cljs.core.pr_sb = function pr_sb(objs, opts) {
  var sb__17275 = new goog.string.StringBuffer;
  var G__17276__17277 = cljs.core.seq.call(null, cljs.core.pr_seq.call(null, cljs.core.first.call(null, objs), opts));
  if(G__17276__17277) {
    var string__17278 = cljs.core.first.call(null, G__17276__17277);
    var G__17276__17279 = G__17276__17277;
    while(true) {
      sb__17275.append(string__17278);
      var temp__3974__auto____17280 = cljs.core.next.call(null, G__17276__17279);
      if(temp__3974__auto____17280) {
        var G__17276__17281 = temp__3974__auto____17280;
        var G__17294 = cljs.core.first.call(null, G__17276__17281);
        var G__17295 = G__17276__17281;
        string__17278 = G__17294;
        G__17276__17279 = G__17295;
        continue
      }else {
      }
      break
    }
  }else {
  }
  var G__17282__17283 = cljs.core.seq.call(null, cljs.core.next.call(null, objs));
  if(G__17282__17283) {
    var obj__17284 = cljs.core.first.call(null, G__17282__17283);
    var G__17282__17285 = G__17282__17283;
    while(true) {
      sb__17275.append(" ");
      var G__17286__17287 = cljs.core.seq.call(null, cljs.core.pr_seq.call(null, obj__17284, opts));
      if(G__17286__17287) {
        var string__17288 = cljs.core.first.call(null, G__17286__17287);
        var G__17286__17289 = G__17286__17287;
        while(true) {
          sb__17275.append(string__17288);
          var temp__3974__auto____17290 = cljs.core.next.call(null, G__17286__17289);
          if(temp__3974__auto____17290) {
            var G__17286__17291 = temp__3974__auto____17290;
            var G__17296 = cljs.core.first.call(null, G__17286__17291);
            var G__17297 = G__17286__17291;
            string__17288 = G__17296;
            G__17286__17289 = G__17297;
            continue
          }else {
          }
          break
        }
      }else {
      }
      var temp__3974__auto____17292 = cljs.core.next.call(null, G__17282__17285);
      if(temp__3974__auto____17292) {
        var G__17282__17293 = temp__3974__auto____17292;
        var G__17298 = cljs.core.first.call(null, G__17282__17293);
        var G__17299 = G__17282__17293;
        obj__17284 = G__17298;
        G__17282__17285 = G__17299;
        continue
      }else {
      }
      break
    }
  }else {
  }
  return sb__17275
};
cljs.core.pr_str_with_opts = function pr_str_with_opts(objs, opts) {
  return[cljs.core.str(cljs.core.pr_sb.call(null, objs, opts))].join("")
};
cljs.core.prn_str_with_opts = function prn_str_with_opts(objs, opts) {
  var sb__17301 = cljs.core.pr_sb.call(null, objs, opts);
  sb__17301.append("\n");
  return[cljs.core.str(sb__17301)].join("")
};
cljs.core.pr_with_opts = function pr_with_opts(objs, opts) {
  var G__17320__17321 = cljs.core.seq.call(null, cljs.core.pr_seq.call(null, cljs.core.first.call(null, objs), opts));
  if(G__17320__17321) {
    var string__17322 = cljs.core.first.call(null, G__17320__17321);
    var G__17320__17323 = G__17320__17321;
    while(true) {
      cljs.core.string_print.call(null, string__17322);
      var temp__3974__auto____17324 = cljs.core.next.call(null, G__17320__17323);
      if(temp__3974__auto____17324) {
        var G__17320__17325 = temp__3974__auto____17324;
        var G__17338 = cljs.core.first.call(null, G__17320__17325);
        var G__17339 = G__17320__17325;
        string__17322 = G__17338;
        G__17320__17323 = G__17339;
        continue
      }else {
      }
      break
    }
  }else {
  }
  var G__17326__17327 = cljs.core.seq.call(null, cljs.core.next.call(null, objs));
  if(G__17326__17327) {
    var obj__17328 = cljs.core.first.call(null, G__17326__17327);
    var G__17326__17329 = G__17326__17327;
    while(true) {
      cljs.core.string_print.call(null, " ");
      var G__17330__17331 = cljs.core.seq.call(null, cljs.core.pr_seq.call(null, obj__17328, opts));
      if(G__17330__17331) {
        var string__17332 = cljs.core.first.call(null, G__17330__17331);
        var G__17330__17333 = G__17330__17331;
        while(true) {
          cljs.core.string_print.call(null, string__17332);
          var temp__3974__auto____17334 = cljs.core.next.call(null, G__17330__17333);
          if(temp__3974__auto____17334) {
            var G__17330__17335 = temp__3974__auto____17334;
            var G__17340 = cljs.core.first.call(null, G__17330__17335);
            var G__17341 = G__17330__17335;
            string__17332 = G__17340;
            G__17330__17333 = G__17341;
            continue
          }else {
          }
          break
        }
      }else {
      }
      var temp__3974__auto____17336 = cljs.core.next.call(null, G__17326__17329);
      if(temp__3974__auto____17336) {
        var G__17326__17337 = temp__3974__auto____17336;
        var G__17342 = cljs.core.first.call(null, G__17326__17337);
        var G__17343 = G__17326__17337;
        obj__17328 = G__17342;
        G__17326__17329 = G__17343;
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
  pr_str.cljs$lang$applyTo = function(arglist__17344) {
    var objs = cljs.core.seq(arglist__17344);
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
  prn_str.cljs$lang$applyTo = function(arglist__17345) {
    var objs = cljs.core.seq(arglist__17345);
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
  pr.cljs$lang$applyTo = function(arglist__17346) {
    var objs = cljs.core.seq(arglist__17346);
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
  cljs_core_print.cljs$lang$applyTo = function(arglist__17347) {
    var objs = cljs.core.seq(arglist__17347);
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
  print_str.cljs$lang$applyTo = function(arglist__17348) {
    var objs = cljs.core.seq(arglist__17348);
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
  println.cljs$lang$applyTo = function(arglist__17349) {
    var objs = cljs.core.seq(arglist__17349);
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
  println_str.cljs$lang$applyTo = function(arglist__17350) {
    var objs = cljs.core.seq(arglist__17350);
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
  prn.cljs$lang$applyTo = function(arglist__17351) {
    var objs = cljs.core.seq(arglist__17351);
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
  printf.cljs$lang$applyTo = function(arglist__17352) {
    var fmt = cljs.core.first(arglist__17352);
    var args = cljs.core.rest(arglist__17352);
    return printf__delegate(fmt, args)
  };
  printf.cljs$lang$arity$variadic = printf__delegate;
  return printf
}();
cljs.core.HashMap.prototype.cljs$core$IPrintable$ = true;
cljs.core.HashMap.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  var pr_pair__17353 = function(keyval) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential.call(null, pr_pair__17353, "{", ", ", "}", opts, coll)
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
  var pr_pair__17354 = function(keyval) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential.call(null, pr_pair__17354, "{", ", ", "}", opts, coll)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentArrayMap.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  var pr_pair__17355 = function(keyval) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential.call(null, pr_pair__17355, "{", ", ", "}", opts, coll)
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
      var temp__3974__auto____17356 = cljs.core.namespace.call(null, obj);
      if(cljs.core.truth_(temp__3974__auto____17356)) {
        var nspc__17357 = temp__3974__auto____17356;
        return[cljs.core.str(nspc__17357), cljs.core.str("/")].join("")
      }else {
        return null
      }
    }()), cljs.core.str(cljs.core.name.call(null, obj))].join(""))
  }else {
    if(cljs.core.symbol_QMARK_.call(null, obj)) {
      return cljs.core.list.call(null, [cljs.core.str(function() {
        var temp__3974__auto____17358 = cljs.core.namespace.call(null, obj);
        if(cljs.core.truth_(temp__3974__auto____17358)) {
          var nspc__17359 = temp__3974__auto____17358;
          return[cljs.core.str(nspc__17359), cljs.core.str("/")].join("")
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
  var pr_pair__17360 = function(keyval) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential.call(null, pr_pair__17360, "{", ", ", "}", opts, coll)
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
  var normalize__17362 = function(n, len) {
    var ns__17361 = [cljs.core.str(n)].join("");
    while(true) {
      if(cljs.core.count.call(null, ns__17361) < len) {
        var G__17364 = [cljs.core.str("0"), cljs.core.str(ns__17361)].join("");
        ns__17361 = G__17364;
        continue
      }else {
        return ns__17361
      }
      break
    }
  };
  return cljs.core.list.call(null, [cljs.core.str('#inst "'), cljs.core.str(d.getUTCFullYear()), cljs.core.str("-"), cljs.core.str(normalize__17362.call(null, d.getUTCMonth() + 1, 2)), cljs.core.str("-"), cljs.core.str(normalize__17362.call(null, d.getUTCDate(), 2)), cljs.core.str("T"), cljs.core.str(normalize__17362.call(null, d.getUTCHours(), 2)), cljs.core.str(":"), cljs.core.str(normalize__17362.call(null, d.getUTCMinutes(), 2)), cljs.core.str(":"), cljs.core.str(normalize__17362.call(null, d.getUTCSeconds(), 
  2)), cljs.core.str("."), cljs.core.str(normalize__17362.call(null, d.getUTCMilliseconds(), 3)), cljs.core.str("-"), cljs.core.str('00:00"')].join(""))
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
  var pr_pair__17363 = function(keyval) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential.call(null, pr_pair__17363, "{", ", ", "}", opts, coll)
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
cljs.core.Atom.cljs$lang$ctorPrSeq = function(this__2311__auto__) {
  return cljs.core.list.call(null, "cljs.core/Atom")
};
cljs.core.Atom.prototype.cljs$core$IHash$_hash$arity$1 = function(this$) {
  var this__17365 = this;
  return goog.getUid(this$)
};
cljs.core.Atom.prototype.cljs$core$IWatchable$_notify_watches$arity$3 = function(this$, oldval, newval) {
  var this__17366 = this;
  var G__17367__17368 = cljs.core.seq.call(null, this__17366.watches);
  if(G__17367__17368) {
    var G__17370__17372 = cljs.core.first.call(null, G__17367__17368);
    var vec__17371__17373 = G__17370__17372;
    var key__17374 = cljs.core.nth.call(null, vec__17371__17373, 0, null);
    var f__17375 = cljs.core.nth.call(null, vec__17371__17373, 1, null);
    var G__17367__17376 = G__17367__17368;
    var G__17370__17377 = G__17370__17372;
    var G__17367__17378 = G__17367__17376;
    while(true) {
      var vec__17379__17380 = G__17370__17377;
      var key__17381 = cljs.core.nth.call(null, vec__17379__17380, 0, null);
      var f__17382 = cljs.core.nth.call(null, vec__17379__17380, 1, null);
      var G__17367__17383 = G__17367__17378;
      f__17382.call(null, key__17381, this$, oldval, newval);
      var temp__3974__auto____17384 = cljs.core.next.call(null, G__17367__17383);
      if(temp__3974__auto____17384) {
        var G__17367__17385 = temp__3974__auto____17384;
        var G__17392 = cljs.core.first.call(null, G__17367__17385);
        var G__17393 = G__17367__17385;
        G__17370__17377 = G__17392;
        G__17367__17378 = G__17393;
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
  var this__17386 = this;
  return this$.watches = cljs.core.assoc.call(null, this__17386.watches, key, f)
};
cljs.core.Atom.prototype.cljs$core$IWatchable$_remove_watch$arity$2 = function(this$, key) {
  var this__17387 = this;
  return this$.watches = cljs.core.dissoc.call(null, this__17387.watches, key)
};
cljs.core.Atom.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(a, opts) {
  var this__17388 = this;
  return cljs.core.concat.call(null, cljs.core.PersistentVector.fromArray(["#<Atom: "], true), cljs.core._pr_seq.call(null, this__17388.state, opts), ">")
};
cljs.core.Atom.prototype.cljs$core$IMeta$_meta$arity$1 = function(_) {
  var this__17389 = this;
  return this__17389.meta
};
cljs.core.Atom.prototype.cljs$core$IDeref$_deref$arity$1 = function(_) {
  var this__17390 = this;
  return this__17390.state
};
cljs.core.Atom.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(o, other) {
  var this__17391 = this;
  return o === other
};
cljs.core.Atom;
cljs.core.atom = function() {
  var atom = null;
  var atom__1 = function(x) {
    return new cljs.core.Atom(x, null, null, null)
  };
  var atom__2 = function() {
    var G__17405__delegate = function(x, p__17394) {
      var map__17400__17401 = p__17394;
      var map__17400__17402 = cljs.core.seq_QMARK_.call(null, map__17400__17401) ? cljs.core.apply.call(null, cljs.core.hash_map, map__17400__17401) : map__17400__17401;
      var validator__17403 = cljs.core._lookup.call(null, map__17400__17402, "\ufdd0'validator", null);
      var meta__17404 = cljs.core._lookup.call(null, map__17400__17402, "\ufdd0'meta", null);
      return new cljs.core.Atom(x, meta__17404, validator__17403, null)
    };
    var G__17405 = function(x, var_args) {
      var p__17394 = null;
      if(goog.isDef(var_args)) {
        p__17394 = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__17405__delegate.call(this, x, p__17394)
    };
    G__17405.cljs$lang$maxFixedArity = 1;
    G__17405.cljs$lang$applyTo = function(arglist__17406) {
      var x = cljs.core.first(arglist__17406);
      var p__17394 = cljs.core.rest(arglist__17406);
      return G__17405__delegate(x, p__17394)
    };
    G__17405.cljs$lang$arity$variadic = G__17405__delegate;
    return G__17405
  }();
  atom = function(x, var_args) {
    var p__17394 = var_args;
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
  var temp__3974__auto____17410 = a.validator;
  if(cljs.core.truth_(temp__3974__auto____17410)) {
    var validate__17411 = temp__3974__auto____17410;
    if(cljs.core.truth_(validate__17411.call(null, new_value))) {
    }else {
      throw new Error([cljs.core.str("Assert failed: "), cljs.core.str("Validator rejected reference state"), cljs.core.str("\n"), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'validate", "\ufdd1'new-value"), cljs.core.hash_map("\ufdd0'line", 6440))))].join(""));
    }
  }else {
  }
  var old_value__17412 = a.state;
  a.state = new_value;
  cljs.core._notify_watches.call(null, a, old_value__17412, new_value);
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
    var G__17413__delegate = function(a, f, x, y, z, more) {
      return cljs.core.reset_BANG_.call(null, a, cljs.core.apply.call(null, f, a.state, x, y, z, more))
    };
    var G__17413 = function(a, f, x, y, z, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 5), 0)
      }
      return G__17413__delegate.call(this, a, f, x, y, z, more)
    };
    G__17413.cljs$lang$maxFixedArity = 5;
    G__17413.cljs$lang$applyTo = function(arglist__17414) {
      var a = cljs.core.first(arglist__17414);
      var f = cljs.core.first(cljs.core.next(arglist__17414));
      var x = cljs.core.first(cljs.core.next(cljs.core.next(arglist__17414)));
      var y = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__17414))));
      var z = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(cljs.core.next(arglist__17414)))));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(cljs.core.next(arglist__17414)))));
      return G__17413__delegate(a, f, x, y, z, more)
    };
    G__17413.cljs$lang$arity$variadic = G__17413__delegate;
    return G__17413
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
  alter_meta_BANG_.cljs$lang$applyTo = function(arglist__17415) {
    var iref = cljs.core.first(arglist__17415);
    var f = cljs.core.first(cljs.core.next(arglist__17415));
    var args = cljs.core.rest(cljs.core.next(arglist__17415));
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
cljs.core.Delay.cljs$lang$ctorPrSeq = function(this__2311__auto__) {
  return cljs.core.list.call(null, "cljs.core/Delay")
};
cljs.core.Delay.prototype.cljs$core$IPending$_realized_QMARK_$arity$1 = function(d) {
  var this__17416 = this;
  return(new cljs.core.Keyword("\ufdd0'done")).call(null, cljs.core.deref.call(null, this__17416.state))
};
cljs.core.Delay.prototype.cljs$core$IDeref$_deref$arity$1 = function(_) {
  var this__17417 = this;
  return(new cljs.core.Keyword("\ufdd0'value")).call(null, cljs.core.swap_BANG_.call(null, this__17417.state, function(p__17418) {
    var map__17419__17420 = p__17418;
    var map__17419__17421 = cljs.core.seq_QMARK_.call(null, map__17419__17420) ? cljs.core.apply.call(null, cljs.core.hash_map, map__17419__17420) : map__17419__17420;
    var curr_state__17422 = map__17419__17421;
    var done__17423 = cljs.core._lookup.call(null, map__17419__17421, "\ufdd0'done", null);
    if(cljs.core.truth_(done__17423)) {
      return curr_state__17422
    }else {
      return cljs.core.ObjMap.fromObject(["\ufdd0'done", "\ufdd0'value"], {"\ufdd0'done":true, "\ufdd0'value":this__17417.f.call(null)})
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
    var map__17444__17445 = options;
    var map__17444__17446 = cljs.core.seq_QMARK_.call(null, map__17444__17445) ? cljs.core.apply.call(null, cljs.core.hash_map, map__17444__17445) : map__17444__17445;
    var keywordize_keys__17447 = cljs.core._lookup.call(null, map__17444__17446, "\ufdd0'keywordize-keys", null);
    var keyfn__17448 = cljs.core.truth_(keywordize_keys__17447) ? cljs.core.keyword : cljs.core.str;
    var f__17463 = function thisfn(x) {
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
                var iter__2464__auto____17462 = function iter__17456(s__17457) {
                  return new cljs.core.LazySeq(null, false, function() {
                    var s__17457__17460 = s__17457;
                    while(true) {
                      if(cljs.core.seq.call(null, s__17457__17460)) {
                        var k__17461 = cljs.core.first.call(null, s__17457__17460);
                        return cljs.core.cons.call(null, cljs.core.PersistentVector.fromArray([keyfn__17448.call(null, k__17461), thisfn.call(null, x[k__17461])], true), iter__17456.call(null, cljs.core.rest.call(null, s__17457__17460)))
                      }else {
                        return null
                      }
                      break
                    }
                  }, null)
                };
                return iter__2464__auto____17462.call(null, cljs.core.js_keys.call(null, x))
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
    return f__17463.call(null, x)
  };
  var js__GT_clj = function(x, var_args) {
    var options = null;
    if(goog.isDef(var_args)) {
      options = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return js__GT_clj__delegate.call(this, x, options)
  };
  js__GT_clj.cljs$lang$maxFixedArity = 1;
  js__GT_clj.cljs$lang$applyTo = function(arglist__17464) {
    var x = cljs.core.first(arglist__17464);
    var options = cljs.core.rest(arglist__17464);
    return js__GT_clj__delegate(x, options)
  };
  js__GT_clj.cljs$lang$arity$variadic = js__GT_clj__delegate;
  return js__GT_clj
}();
cljs.core.memoize = function memoize(f) {
  var mem__17469 = cljs.core.atom.call(null, cljs.core.ObjMap.EMPTY);
  return function() {
    var G__17473__delegate = function(args) {
      var temp__3971__auto____17470 = cljs.core._lookup.call(null, cljs.core.deref.call(null, mem__17469), args, null);
      if(cljs.core.truth_(temp__3971__auto____17470)) {
        var v__17471 = temp__3971__auto____17470;
        return v__17471
      }else {
        var ret__17472 = cljs.core.apply.call(null, f, args);
        cljs.core.swap_BANG_.call(null, mem__17469, cljs.core.assoc, args, ret__17472);
        return ret__17472
      }
    };
    var G__17473 = function(var_args) {
      var args = null;
      if(goog.isDef(var_args)) {
        args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
      }
      return G__17473__delegate.call(this, args)
    };
    G__17473.cljs$lang$maxFixedArity = 0;
    G__17473.cljs$lang$applyTo = function(arglist__17474) {
      var args = cljs.core.seq(arglist__17474);
      return G__17473__delegate(args)
    };
    G__17473.cljs$lang$arity$variadic = G__17473__delegate;
    return G__17473
  }()
};
cljs.core.trampoline = function() {
  var trampoline = null;
  var trampoline__1 = function(f) {
    while(true) {
      var ret__17476 = f.call(null);
      if(cljs.core.fn_QMARK_.call(null, ret__17476)) {
        var G__17477 = ret__17476;
        f = G__17477;
        continue
      }else {
        return ret__17476
      }
      break
    }
  };
  var trampoline__2 = function() {
    var G__17478__delegate = function(f, args) {
      return trampoline.call(null, function() {
        return cljs.core.apply.call(null, f, args)
      })
    };
    var G__17478 = function(f, var_args) {
      var args = null;
      if(goog.isDef(var_args)) {
        args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__17478__delegate.call(this, f, args)
    };
    G__17478.cljs$lang$maxFixedArity = 1;
    G__17478.cljs$lang$applyTo = function(arglist__17479) {
      var f = cljs.core.first(arglist__17479);
      var args = cljs.core.rest(arglist__17479);
      return G__17478__delegate(f, args)
    };
    G__17478.cljs$lang$arity$variadic = G__17478__delegate;
    return G__17478
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
    var k__17481 = f.call(null, x);
    return cljs.core.assoc.call(null, ret, k__17481, cljs.core.conj.call(null, cljs.core._lookup.call(null, ret, k__17481, cljs.core.PersistentVector.EMPTY), x))
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
    var or__3824__auto____17490 = cljs.core._EQ_.call(null, child, parent);
    if(or__3824__auto____17490) {
      return or__3824__auto____17490
    }else {
      var or__3824__auto____17491 = cljs.core.contains_QMARK_.call(null, (new cljs.core.Keyword("\ufdd0'ancestors")).call(null, h).call(null, child), parent);
      if(or__3824__auto____17491) {
        return or__3824__auto____17491
      }else {
        var and__3822__auto____17492 = cljs.core.vector_QMARK_.call(null, parent);
        if(and__3822__auto____17492) {
          var and__3822__auto____17493 = cljs.core.vector_QMARK_.call(null, child);
          if(and__3822__auto____17493) {
            var and__3822__auto____17494 = cljs.core.count.call(null, parent) === cljs.core.count.call(null, child);
            if(and__3822__auto____17494) {
              var ret__17495 = true;
              var i__17496 = 0;
              while(true) {
                if(function() {
                  var or__3824__auto____17497 = cljs.core.not.call(null, ret__17495);
                  if(or__3824__auto____17497) {
                    return or__3824__auto____17497
                  }else {
                    return i__17496 === cljs.core.count.call(null, parent)
                  }
                }()) {
                  return ret__17495
                }else {
                  var G__17498 = isa_QMARK_.call(null, h, child.call(null, i__17496), parent.call(null, i__17496));
                  var G__17499 = i__17496 + 1;
                  ret__17495 = G__17498;
                  i__17496 = G__17499;
                  continue
                }
                break
              }
            }else {
              return and__3822__auto____17494
            }
          }else {
            return and__3822__auto____17493
          }
        }else {
          return and__3822__auto____17492
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
    var tp__17508 = (new cljs.core.Keyword("\ufdd0'parents")).call(null, h);
    var td__17509 = (new cljs.core.Keyword("\ufdd0'descendants")).call(null, h);
    var ta__17510 = (new cljs.core.Keyword("\ufdd0'ancestors")).call(null, h);
    var tf__17511 = function(m, source, sources, target, targets) {
      return cljs.core.reduce.call(null, function(ret, k) {
        return cljs.core.assoc.call(null, ret, k, cljs.core.reduce.call(null, cljs.core.conj, cljs.core._lookup.call(null, targets, k, cljs.core.PersistentHashSet.EMPTY), cljs.core.cons.call(null, target, targets.call(null, target))))
      }, m, cljs.core.cons.call(null, source, sources.call(null, source)))
    };
    var or__3824__auto____17512 = cljs.core.contains_QMARK_.call(null, tp__17508.call(null, tag), parent) ? null : function() {
      if(cljs.core.contains_QMARK_.call(null, ta__17510.call(null, tag), parent)) {
        throw new Error([cljs.core.str(tag), cljs.core.str("already has"), cljs.core.str(parent), cljs.core.str("as ancestor")].join(""));
      }else {
      }
      if(cljs.core.contains_QMARK_.call(null, ta__17510.call(null, parent), tag)) {
        throw new Error([cljs.core.str("Cyclic derivation:"), cljs.core.str(parent), cljs.core.str("has"), cljs.core.str(tag), cljs.core.str("as ancestor")].join(""));
      }else {
      }
      return cljs.core.ObjMap.fromObject(["\ufdd0'parents", "\ufdd0'ancestors", "\ufdd0'descendants"], {"\ufdd0'parents":cljs.core.assoc.call(null, (new cljs.core.Keyword("\ufdd0'parents")).call(null, h), tag, cljs.core.conj.call(null, cljs.core._lookup.call(null, tp__17508, tag, cljs.core.PersistentHashSet.EMPTY), parent)), "\ufdd0'ancestors":tf__17511.call(null, (new cljs.core.Keyword("\ufdd0'ancestors")).call(null, h), tag, td__17509, parent, ta__17510), "\ufdd0'descendants":tf__17511.call(null, 
      (new cljs.core.Keyword("\ufdd0'descendants")).call(null, h), parent, ta__17510, tag, td__17509)})
    }();
    if(cljs.core.truth_(or__3824__auto____17512)) {
      return or__3824__auto____17512
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
    var parentMap__17517 = (new cljs.core.Keyword("\ufdd0'parents")).call(null, h);
    var childsParents__17518 = cljs.core.truth_(parentMap__17517.call(null, tag)) ? cljs.core.disj.call(null, parentMap__17517.call(null, tag), parent) : cljs.core.PersistentHashSet.EMPTY;
    var newParents__17519 = cljs.core.truth_(cljs.core.not_empty.call(null, childsParents__17518)) ? cljs.core.assoc.call(null, parentMap__17517, tag, childsParents__17518) : cljs.core.dissoc.call(null, parentMap__17517, tag);
    var deriv_seq__17520 = cljs.core.flatten.call(null, cljs.core.map.call(null, function(p1__17500_SHARP_) {
      return cljs.core.cons.call(null, cljs.core.first.call(null, p1__17500_SHARP_), cljs.core.interpose.call(null, cljs.core.first.call(null, p1__17500_SHARP_), cljs.core.second.call(null, p1__17500_SHARP_)))
    }, cljs.core.seq.call(null, newParents__17519)));
    if(cljs.core.contains_QMARK_.call(null, parentMap__17517.call(null, tag), parent)) {
      return cljs.core.reduce.call(null, function(p1__17501_SHARP_, p2__17502_SHARP_) {
        return cljs.core.apply.call(null, cljs.core.derive, p1__17501_SHARP_, p2__17502_SHARP_)
      }, cljs.core.make_hierarchy.call(null), cljs.core.partition.call(null, 2, deriv_seq__17520))
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
  var xprefs__17528 = cljs.core.deref.call(null, prefer_table).call(null, x);
  var or__3824__auto____17530 = cljs.core.truth_(function() {
    var and__3822__auto____17529 = xprefs__17528;
    if(cljs.core.truth_(and__3822__auto____17529)) {
      return xprefs__17528.call(null, y)
    }else {
      return and__3822__auto____17529
    }
  }()) ? true : null;
  if(cljs.core.truth_(or__3824__auto____17530)) {
    return or__3824__auto____17530
  }else {
    var or__3824__auto____17532 = function() {
      var ps__17531 = cljs.core.parents.call(null, y);
      while(true) {
        if(cljs.core.count.call(null, ps__17531) > 0) {
          if(cljs.core.truth_(prefers_STAR_.call(null, x, cljs.core.first.call(null, ps__17531), prefer_table))) {
          }else {
          }
          var G__17535 = cljs.core.rest.call(null, ps__17531);
          ps__17531 = G__17535;
          continue
        }else {
          return null
        }
        break
      }
    }();
    if(cljs.core.truth_(or__3824__auto____17532)) {
      return or__3824__auto____17532
    }else {
      var or__3824__auto____17534 = function() {
        var ps__17533 = cljs.core.parents.call(null, x);
        while(true) {
          if(cljs.core.count.call(null, ps__17533) > 0) {
            if(cljs.core.truth_(prefers_STAR_.call(null, cljs.core.first.call(null, ps__17533), y, prefer_table))) {
            }else {
            }
            var G__17536 = cljs.core.rest.call(null, ps__17533);
            ps__17533 = G__17536;
            continue
          }else {
            return null
          }
          break
        }
      }();
      if(cljs.core.truth_(or__3824__auto____17534)) {
        return or__3824__auto____17534
      }else {
        return false
      }
    }
  }
};
cljs.core.dominates = function dominates(x, y, prefer_table) {
  var or__3824__auto____17538 = cljs.core.prefers_STAR_.call(null, x, y, prefer_table);
  if(cljs.core.truth_(or__3824__auto____17538)) {
    return or__3824__auto____17538
  }else {
    return cljs.core.isa_QMARK_.call(null, x, y)
  }
};
cljs.core.find_and_cache_best_method = function find_and_cache_best_method(name, dispatch_val, hierarchy, method_table, prefer_table, method_cache, cached_hierarchy) {
  var best_entry__17556 = cljs.core.reduce.call(null, function(be, p__17548) {
    var vec__17549__17550 = p__17548;
    var k__17551 = cljs.core.nth.call(null, vec__17549__17550, 0, null);
    var ___17552 = cljs.core.nth.call(null, vec__17549__17550, 1, null);
    var e__17553 = vec__17549__17550;
    if(cljs.core.isa_QMARK_.call(null, dispatch_val, k__17551)) {
      var be2__17555 = cljs.core.truth_(function() {
        var or__3824__auto____17554 = be == null;
        if(or__3824__auto____17554) {
          return or__3824__auto____17554
        }else {
          return cljs.core.dominates.call(null, k__17551, cljs.core.first.call(null, be), prefer_table)
        }
      }()) ? e__17553 : be;
      if(cljs.core.truth_(cljs.core.dominates.call(null, cljs.core.first.call(null, be2__17555), k__17551, prefer_table))) {
      }else {
        throw new Error([cljs.core.str("Multiple methods in multimethod '"), cljs.core.str(name), cljs.core.str("' match dispatch value: "), cljs.core.str(dispatch_val), cljs.core.str(" -> "), cljs.core.str(k__17551), cljs.core.str(" and "), cljs.core.str(cljs.core.first.call(null, be2__17555)), cljs.core.str(", and neither is preferred")].join(""));
      }
      return be2__17555
    }else {
      return be
    }
  }, null, cljs.core.deref.call(null, method_table));
  if(cljs.core.truth_(best_entry__17556)) {
    if(cljs.core._EQ_.call(null, cljs.core.deref.call(null, cached_hierarchy), cljs.core.deref.call(null, hierarchy))) {
      cljs.core.swap_BANG_.call(null, method_cache, cljs.core.assoc, dispatch_val, cljs.core.second.call(null, best_entry__17556));
      return cljs.core.second.call(null, best_entry__17556)
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
    var and__3822__auto____17561 = mf;
    if(and__3822__auto____17561) {
      return mf.cljs$core$IMultiFn$_reset$arity$1
    }else {
      return and__3822__auto____17561
    }
  }()) {
    return mf.cljs$core$IMultiFn$_reset$arity$1(mf)
  }else {
    var x__2365__auto____17562 = mf == null ? null : mf;
    return function() {
      var or__3824__auto____17563 = cljs.core._reset[goog.typeOf(x__2365__auto____17562)];
      if(or__3824__auto____17563) {
        return or__3824__auto____17563
      }else {
        var or__3824__auto____17564 = cljs.core._reset["_"];
        if(or__3824__auto____17564) {
          return or__3824__auto____17564
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-reset", mf);
        }
      }
    }().call(null, mf)
  }
};
cljs.core._add_method = function _add_method(mf, dispatch_val, method) {
  if(function() {
    var and__3822__auto____17569 = mf;
    if(and__3822__auto____17569) {
      return mf.cljs$core$IMultiFn$_add_method$arity$3
    }else {
      return and__3822__auto____17569
    }
  }()) {
    return mf.cljs$core$IMultiFn$_add_method$arity$3(mf, dispatch_val, method)
  }else {
    var x__2365__auto____17570 = mf == null ? null : mf;
    return function() {
      var or__3824__auto____17571 = cljs.core._add_method[goog.typeOf(x__2365__auto____17570)];
      if(or__3824__auto____17571) {
        return or__3824__auto____17571
      }else {
        var or__3824__auto____17572 = cljs.core._add_method["_"];
        if(or__3824__auto____17572) {
          return or__3824__auto____17572
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-add-method", mf);
        }
      }
    }().call(null, mf, dispatch_val, method)
  }
};
cljs.core._remove_method = function _remove_method(mf, dispatch_val) {
  if(function() {
    var and__3822__auto____17577 = mf;
    if(and__3822__auto____17577) {
      return mf.cljs$core$IMultiFn$_remove_method$arity$2
    }else {
      return and__3822__auto____17577
    }
  }()) {
    return mf.cljs$core$IMultiFn$_remove_method$arity$2(mf, dispatch_val)
  }else {
    var x__2365__auto____17578 = mf == null ? null : mf;
    return function() {
      var or__3824__auto____17579 = cljs.core._remove_method[goog.typeOf(x__2365__auto____17578)];
      if(or__3824__auto____17579) {
        return or__3824__auto____17579
      }else {
        var or__3824__auto____17580 = cljs.core._remove_method["_"];
        if(or__3824__auto____17580) {
          return or__3824__auto____17580
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-remove-method", mf);
        }
      }
    }().call(null, mf, dispatch_val)
  }
};
cljs.core._prefer_method = function _prefer_method(mf, dispatch_val, dispatch_val_y) {
  if(function() {
    var and__3822__auto____17585 = mf;
    if(and__3822__auto____17585) {
      return mf.cljs$core$IMultiFn$_prefer_method$arity$3
    }else {
      return and__3822__auto____17585
    }
  }()) {
    return mf.cljs$core$IMultiFn$_prefer_method$arity$3(mf, dispatch_val, dispatch_val_y)
  }else {
    var x__2365__auto____17586 = mf == null ? null : mf;
    return function() {
      var or__3824__auto____17587 = cljs.core._prefer_method[goog.typeOf(x__2365__auto____17586)];
      if(or__3824__auto____17587) {
        return or__3824__auto____17587
      }else {
        var or__3824__auto____17588 = cljs.core._prefer_method["_"];
        if(or__3824__auto____17588) {
          return or__3824__auto____17588
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-prefer-method", mf);
        }
      }
    }().call(null, mf, dispatch_val, dispatch_val_y)
  }
};
cljs.core._get_method = function _get_method(mf, dispatch_val) {
  if(function() {
    var and__3822__auto____17593 = mf;
    if(and__3822__auto____17593) {
      return mf.cljs$core$IMultiFn$_get_method$arity$2
    }else {
      return and__3822__auto____17593
    }
  }()) {
    return mf.cljs$core$IMultiFn$_get_method$arity$2(mf, dispatch_val)
  }else {
    var x__2365__auto____17594 = mf == null ? null : mf;
    return function() {
      var or__3824__auto____17595 = cljs.core._get_method[goog.typeOf(x__2365__auto____17594)];
      if(or__3824__auto____17595) {
        return or__3824__auto____17595
      }else {
        var or__3824__auto____17596 = cljs.core._get_method["_"];
        if(or__3824__auto____17596) {
          return or__3824__auto____17596
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-get-method", mf);
        }
      }
    }().call(null, mf, dispatch_val)
  }
};
cljs.core._methods = function _methods(mf) {
  if(function() {
    var and__3822__auto____17601 = mf;
    if(and__3822__auto____17601) {
      return mf.cljs$core$IMultiFn$_methods$arity$1
    }else {
      return and__3822__auto____17601
    }
  }()) {
    return mf.cljs$core$IMultiFn$_methods$arity$1(mf)
  }else {
    var x__2365__auto____17602 = mf == null ? null : mf;
    return function() {
      var or__3824__auto____17603 = cljs.core._methods[goog.typeOf(x__2365__auto____17602)];
      if(or__3824__auto____17603) {
        return or__3824__auto____17603
      }else {
        var or__3824__auto____17604 = cljs.core._methods["_"];
        if(or__3824__auto____17604) {
          return or__3824__auto____17604
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-methods", mf);
        }
      }
    }().call(null, mf)
  }
};
cljs.core._prefers = function _prefers(mf) {
  if(function() {
    var and__3822__auto____17609 = mf;
    if(and__3822__auto____17609) {
      return mf.cljs$core$IMultiFn$_prefers$arity$1
    }else {
      return and__3822__auto____17609
    }
  }()) {
    return mf.cljs$core$IMultiFn$_prefers$arity$1(mf)
  }else {
    var x__2365__auto____17610 = mf == null ? null : mf;
    return function() {
      var or__3824__auto____17611 = cljs.core._prefers[goog.typeOf(x__2365__auto____17610)];
      if(or__3824__auto____17611) {
        return or__3824__auto____17611
      }else {
        var or__3824__auto____17612 = cljs.core._prefers["_"];
        if(or__3824__auto____17612) {
          return or__3824__auto____17612
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-prefers", mf);
        }
      }
    }().call(null, mf)
  }
};
cljs.core._dispatch = function _dispatch(mf, args) {
  if(function() {
    var and__3822__auto____17617 = mf;
    if(and__3822__auto____17617) {
      return mf.cljs$core$IMultiFn$_dispatch$arity$2
    }else {
      return and__3822__auto____17617
    }
  }()) {
    return mf.cljs$core$IMultiFn$_dispatch$arity$2(mf, args)
  }else {
    var x__2365__auto____17618 = mf == null ? null : mf;
    return function() {
      var or__3824__auto____17619 = cljs.core._dispatch[goog.typeOf(x__2365__auto____17618)];
      if(or__3824__auto____17619) {
        return or__3824__auto____17619
      }else {
        var or__3824__auto____17620 = cljs.core._dispatch["_"];
        if(or__3824__auto____17620) {
          return or__3824__auto____17620
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-dispatch", mf);
        }
      }
    }().call(null, mf, args)
  }
};
cljs.core.do_dispatch = function do_dispatch(mf, dispatch_fn, args) {
  var dispatch_val__17623 = cljs.core.apply.call(null, dispatch_fn, args);
  var target_fn__17624 = cljs.core._get_method.call(null, mf, dispatch_val__17623);
  if(cljs.core.truth_(target_fn__17624)) {
  }else {
    throw new Error([cljs.core.str("No method in multimethod '"), cljs.core.str(cljs.core.name), cljs.core.str("' for dispatch value: "), cljs.core.str(dispatch_val__17623)].join(""));
  }
  return cljs.core.apply.call(null, target_fn__17624, args)
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
cljs.core.MultiFn.cljs$lang$ctorPrSeq = function(this__2311__auto__) {
  return cljs.core.list.call(null, "cljs.core/MultiFn")
};
cljs.core.MultiFn.prototype.cljs$core$IHash$_hash$arity$1 = function(this$) {
  var this__17625 = this;
  return goog.getUid(this$)
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_reset$arity$1 = function(mf) {
  var this__17626 = this;
  cljs.core.swap_BANG_.call(null, this__17626.method_table, function(mf) {
    return cljs.core.ObjMap.EMPTY
  });
  cljs.core.swap_BANG_.call(null, this__17626.method_cache, function(mf) {
    return cljs.core.ObjMap.EMPTY
  });
  cljs.core.swap_BANG_.call(null, this__17626.prefer_table, function(mf) {
    return cljs.core.ObjMap.EMPTY
  });
  cljs.core.swap_BANG_.call(null, this__17626.cached_hierarchy, function(mf) {
    return null
  });
  return mf
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_add_method$arity$3 = function(mf, dispatch_val, method) {
  var this__17627 = this;
  cljs.core.swap_BANG_.call(null, this__17627.method_table, cljs.core.assoc, dispatch_val, method);
  cljs.core.reset_cache.call(null, this__17627.method_cache, this__17627.method_table, this__17627.cached_hierarchy, this__17627.hierarchy);
  return mf
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_remove_method$arity$2 = function(mf, dispatch_val) {
  var this__17628 = this;
  cljs.core.swap_BANG_.call(null, this__17628.method_table, cljs.core.dissoc, dispatch_val);
  cljs.core.reset_cache.call(null, this__17628.method_cache, this__17628.method_table, this__17628.cached_hierarchy, this__17628.hierarchy);
  return mf
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_get_method$arity$2 = function(mf, dispatch_val) {
  var this__17629 = this;
  if(cljs.core._EQ_.call(null, cljs.core.deref.call(null, this__17629.cached_hierarchy), cljs.core.deref.call(null, this__17629.hierarchy))) {
  }else {
    cljs.core.reset_cache.call(null, this__17629.method_cache, this__17629.method_table, this__17629.cached_hierarchy, this__17629.hierarchy)
  }
  var temp__3971__auto____17630 = cljs.core.deref.call(null, this__17629.method_cache).call(null, dispatch_val);
  if(cljs.core.truth_(temp__3971__auto____17630)) {
    var target_fn__17631 = temp__3971__auto____17630;
    return target_fn__17631
  }else {
    var temp__3971__auto____17632 = cljs.core.find_and_cache_best_method.call(null, this__17629.name, dispatch_val, this__17629.hierarchy, this__17629.method_table, this__17629.prefer_table, this__17629.method_cache, this__17629.cached_hierarchy);
    if(cljs.core.truth_(temp__3971__auto____17632)) {
      var target_fn__17633 = temp__3971__auto____17632;
      return target_fn__17633
    }else {
      return cljs.core.deref.call(null, this__17629.method_table).call(null, this__17629.default_dispatch_val)
    }
  }
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_prefer_method$arity$3 = function(mf, dispatch_val_x, dispatch_val_y) {
  var this__17634 = this;
  if(cljs.core.truth_(cljs.core.prefers_STAR_.call(null, dispatch_val_x, dispatch_val_y, this__17634.prefer_table))) {
    throw new Error([cljs.core.str("Preference conflict in multimethod '"), cljs.core.str(this__17634.name), cljs.core.str("': "), cljs.core.str(dispatch_val_y), cljs.core.str(" is already preferred to "), cljs.core.str(dispatch_val_x)].join(""));
  }else {
  }
  cljs.core.swap_BANG_.call(null, this__17634.prefer_table, function(old) {
    return cljs.core.assoc.call(null, old, dispatch_val_x, cljs.core.conj.call(null, cljs.core._lookup.call(null, old, dispatch_val_x, cljs.core.PersistentHashSet.EMPTY), dispatch_val_y))
  });
  return cljs.core.reset_cache.call(null, this__17634.method_cache, this__17634.method_table, this__17634.cached_hierarchy, this__17634.hierarchy)
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_methods$arity$1 = function(mf) {
  var this__17635 = this;
  return cljs.core.deref.call(null, this__17635.method_table)
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_prefers$arity$1 = function(mf) {
  var this__17636 = this;
  return cljs.core.deref.call(null, this__17636.prefer_table)
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_dispatch$arity$2 = function(mf, args) {
  var this__17637 = this;
  return cljs.core.do_dispatch.call(null, mf, this__17637.dispatch_fn, args)
};
cljs.core.MultiFn;
cljs.core.MultiFn.prototype.call = function() {
  var G__17639__delegate = function(_, args) {
    var self__17638 = this;
    return cljs.core._dispatch.call(null, self__17638, args)
  };
  var G__17639 = function(_, var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return G__17639__delegate.call(this, _, args)
  };
  G__17639.cljs$lang$maxFixedArity = 1;
  G__17639.cljs$lang$applyTo = function(arglist__17640) {
    var _ = cljs.core.first(arglist__17640);
    var args = cljs.core.rest(arglist__17640);
    return G__17639__delegate(_, args)
  };
  G__17639.cljs$lang$arity$variadic = G__17639__delegate;
  return G__17639
}();
cljs.core.MultiFn.prototype.apply = function(_, args) {
  var self__17641 = this;
  return cljs.core._dispatch.call(null, self__17641, args)
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
cljs.core.UUID.cljs$lang$ctorPrSeq = function(this__2311__auto__) {
  return cljs.core.list.call(null, "cljs.core/UUID")
};
cljs.core.UUID.prototype.cljs$core$IHash$_hash$arity$1 = function(this$) {
  var this__17642 = this;
  return goog.string.hashCode(cljs.core.pr_str.call(null, this$))
};
cljs.core.UUID.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(_17644, _) {
  var this__17643 = this;
  return cljs.core.list.call(null, [cljs.core.str('#uuid "'), cljs.core.str(this__17643.uuid), cljs.core.str('"')].join(""))
};
cljs.core.UUID.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(_, other) {
  var this__17645 = this;
  var and__3822__auto____17646 = cljs.core.instance_QMARK_.call(null, cljs.core.UUID, other);
  if(and__3822__auto____17646) {
    return this__17645.uuid === other.uuid
  }else {
    return and__3822__auto____17646
  }
};
cljs.core.UUID.prototype.toString = function() {
  var this__17647 = this;
  var this__17648 = this;
  return cljs.core.pr_str.call(null, this__17648)
};
cljs.core.UUID;
goog.provide("yapin.util");
goog.require("cljs.core");
yapin.util.clj__GT_js = function clj__GT_js(x) {
  if(cljs.core.string_QMARK_.call(null, x)) {
    return x
  }else {
    if(cljs.core.keyword_QMARK_.call(null, x)) {
      return cljs.core.name.call(null, x)
    }else {
      if(cljs.core.map_QMARK_.call(null, x)) {
        var obj__13666 = {};
        var G__13667__13668 = cljs.core.seq.call(null, x);
        if(G__13667__13668) {
          var G__13670__13672 = cljs.core.first.call(null, G__13667__13668);
          var vec__13671__13673 = G__13670__13672;
          var k__13674 = cljs.core.nth.call(null, vec__13671__13673, 0, null);
          var v__13675 = cljs.core.nth.call(null, vec__13671__13673, 1, null);
          var G__13667__13676 = G__13667__13668;
          var G__13670__13677 = G__13670__13672;
          var G__13667__13678 = G__13667__13676;
          while(true) {
            var vec__13679__13680 = G__13670__13677;
            var k__13681 = cljs.core.nth.call(null, vec__13679__13680, 0, null);
            var v__13682 = cljs.core.nth.call(null, vec__13679__13680, 1, null);
            var G__13667__13683 = G__13667__13678;
            obj__13666[clj__GT_js.call(null, k__13681)] = clj__GT_js.call(null, v__13682);
            var temp__3974__auto____13684 = cljs.core.next.call(null, G__13667__13683);
            if(temp__3974__auto____13684) {
              var G__13667__13685 = temp__3974__auto____13684;
              var G__13686 = cljs.core.first.call(null, G__13667__13685);
              var G__13687 = G__13667__13685;
              G__13670__13677 = G__13686;
              G__13667__13678 = G__13687;
              continue
            }else {
            }
            break
          }
        }else {
        }
        return obj__13666
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
yapin.util.global_ns = safari.extension.globalPage.contentWindow.yapin.global;
yapin.util.active_browser_window = function active_browser_window() {
  return safari.application.activeBrowserWindow
};
yapin.util.find_extension_bar = function find_extension_bar(identifier) {
  return cljs.core.first.call(null, cljs.core.filter.call(null, function(p1__13688_SHARP_) {
    return cljs.core._EQ_.call(null, identifier, p1__13688_SHARP_.identifier)
  }, safari.extension.bars))
};
yapin.util.dispatch_page_message = function() {
  var dispatch_page_message = null;
  var dispatch_page_message__2 = function(name, message) {
    return dispatch_page_message.call(null, safari.application.activeBrowserWindow.activeTab.page, name, message)
  };
  var dispatch_page_message__3 = function(page, name, message) {
    return page.dispatchMessage(name, message)
  };
  dispatch_page_message = function(page, name, message) {
    switch(arguments.length) {
      case 2:
        return dispatch_page_message__2.call(this, page, name);
      case 3:
        return dispatch_page_message__3.call(this, page, name, message)
    }
    throw"Invalid arity: " + arguments.length;
  };
  dispatch_page_message.cljs$lang$arity$2 = dispatch_page_message__2;
  dispatch_page_message.cljs$lang$arity$3 = dispatch_page_message__3;
  return dispatch_page_message
}();
yapin.util.find_element = function find_element(window, id) {
  var document__13690 = window.document;
  return document__13690.getElementById(id)
};
goog.provide("goog.events.EventWrapper");
goog.events.EventWrapper = function() {
};
goog.events.EventWrapper.prototype.listen = function(src, listener, opt_capt, opt_scope, opt_eventHandler) {
};
goog.events.EventWrapper.prototype.unlisten = function(src, listener, opt_capt, opt_scope, opt_eventHandler) {
};
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
goog.provide("goog.events.BrowserFeature");
goog.require("goog.userAgent");
goog.events.BrowserFeature = {HAS_W3C_BUTTON:!goog.userAgent.IE || goog.userAgent.isDocumentMode(9), HAS_W3C_EVENT_SUPPORT:!goog.userAgent.IE || goog.userAgent.isDocumentMode(9), SET_KEY_CODE_TO_PREVENT_DEFAULT:goog.userAgent.IE && !goog.userAgent.isVersion("8")};
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
goog.provide("goog.events.EventType");
goog.require("goog.userAgent");
goog.events.EventType = {CLICK:"click", DBLCLICK:"dblclick", MOUSEDOWN:"mousedown", MOUSEUP:"mouseup", MOUSEOVER:"mouseover", MOUSEOUT:"mouseout", MOUSEMOVE:"mousemove", SELECTSTART:"selectstart", KEYPRESS:"keypress", KEYDOWN:"keydown", KEYUP:"keyup", BLUR:"blur", FOCUS:"focus", DEACTIVATE:"deactivate", FOCUSIN:goog.userAgent.IE ? "focusin" : "DOMFocusIn", FOCUSOUT:goog.userAgent.IE ? "focusout" : "DOMFocusOut", CHANGE:"change", SELECT:"select", SUBMIT:"submit", INPUT:"input", PROPERTYCHANGE:"propertychange", 
DRAGSTART:"dragstart", DRAGENTER:"dragenter", DRAGOVER:"dragover", DRAGLEAVE:"dragleave", DROP:"drop", TOUCHSTART:"touchstart", TOUCHMOVE:"touchmove", TOUCHEND:"touchend", TOUCHCANCEL:"touchcancel", CONTEXTMENU:"contextmenu", ERROR:"error", HELP:"help", LOAD:"load", LOSECAPTURE:"losecapture", READYSTATECHANGE:"readystatechange", RESIZE:"resize", SCROLL:"scroll", UNLOAD:"unload", HASHCHANGE:"hashchange", PAGEHIDE:"pagehide", PAGESHOW:"pageshow", POPSTATE:"popstate", COPY:"copy", PASTE:"paste", CUT:"cut", 
BEFORECOPY:"beforecopy", BEFORECUT:"beforecut", BEFOREPASTE:"beforepaste", MESSAGE:"message", CONNECT:"connect", TRANSITIONEND:goog.userAgent.WEBKIT ? "webkitTransitionEnd" : goog.userAgent.OPERA ? "oTransitionEnd" : "transitionend"};
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
    var and__3822__auto____13695 = this$;
    if(and__3822__auto____13695) {
      return this$.clojure$browser$event$EventType$event_types$arity$1
    }else {
      return and__3822__auto____13695
    }
  }()) {
    return this$.clojure$browser$event$EventType$event_types$arity$1(this$)
  }else {
    var x__2365__auto____13696 = this$ == null ? null : this$;
    return function() {
      var or__3824__auto____13697 = clojure.browser.event.event_types[goog.typeOf(x__2365__auto____13696)];
      if(or__3824__auto____13697) {
        return or__3824__auto____13697
      }else {
        var or__3824__auto____13698 = clojure.browser.event.event_types["_"];
        if(or__3824__auto____13698) {
          return or__3824__auto____13698
        }else {
          throw cljs.core.missing_protocol.call(null, "EventType.event-types", this$);
        }
      }
    }().call(null, this$)
  }
};
Element.prototype.clojure$browser$event$EventType$ = true;
Element.prototype.clojure$browser$event$EventType$event_types$arity$1 = function(this$) {
  return cljs.core.into.call(null, cljs.core.ObjMap.EMPTY, cljs.core.map.call(null, function(p__13699) {
    var vec__13700__13701 = p__13699;
    var k__13702 = cljs.core.nth.call(null, vec__13700__13701, 0, null);
    var v__13703 = cljs.core.nth.call(null, vec__13700__13701, 1, null);
    return cljs.core.PersistentVector.fromArray([cljs.core.keyword.call(null, k__13702.toLowerCase()), v__13703], true)
  }, cljs.core.merge.call(null, cljs.core.js__GT_clj.call(null, goog.events.EventType))))
};
goog.events.EventTarget.prototype.clojure$browser$event$EventType$ = true;
goog.events.EventTarget.prototype.clojure$browser$event$EventType$event_types$arity$1 = function(this$) {
  return cljs.core.into.call(null, cljs.core.ObjMap.EMPTY, cljs.core.map.call(null, function(p__13704) {
    var vec__13705__13706 = p__13704;
    var k__13707 = cljs.core.nth.call(null, vec__13705__13706, 0, null);
    var v__13708 = cljs.core.nth.call(null, vec__13705__13706, 1, null);
    return cljs.core.PersistentVector.fromArray([cljs.core.keyword.call(null, k__13707.toLowerCase()), v__13708], true)
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
goog.require("yapin.util");
goog.require("clojure.browser.event");
goog.require("yapin.util");
yapin.bar.find_bookmarks = function find_bookmarks(text) {
  return yapin.util.global_ns.find_bookmarks(text)
};
yapin.bar.form_field_search_handle_key_press = function form_field_search_handle_key_press(event) {
  var key_code__17156 = event.keyCode;
  if(cljs.core._EQ_.call(null, key_code__17156, 13)) {
    var this__17157 = this;
    var value__17158 = this__17157.value;
    var result__17159 = yapin.bar.find_bookmarks.call(null, value__17158);
    return yapin.util.dispatch_page_message.call(null, "slide-page-in", yapin.util.clj__GT_js.call(null, result__17159))
  }else {
    return null
  }
};
yapin.bar.register_event_handlers = function register_event_handlers() {
  var bar__17163 = yapin.util.find_extension_bar.call(null, "bar");
  var content_window__17164 = bar__17163.contentWindow;
  var form_field_search__17165 = yapin.util.find_element.call(null, content_window__17164, "form-field-search");
  return clojure.browser.event.listen.call(null, form_field_search__17165, "\ufdd0'keypress", yapin.bar.form_field_search_handle_key_press)
};
yapin.bar.register_event_handlers.call(null);
