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
goog.provide("goog.debug.Error");
goog.debug.Error = function(opt_msg) {
  this.stack = (new Error).stack || "";
  if(opt_msg) {
    this.message = String(opt_msg)
  }
};
goog.inherits(goog.debug.Error, Error);
goog.debug.Error.prototype.name = "CustomError";
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
  var x__13570 = x == null ? null : x;
  if(p[goog.typeOf(x__13570)]) {
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
    var G__13571__delegate = function(array, i, idxs) {
      return cljs.core.apply.call(null, aget, aget.call(null, array, i), idxs)
    };
    var G__13571 = function(array, i, var_args) {
      var idxs = null;
      if(goog.isDef(var_args)) {
        idxs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__13571__delegate.call(this, array, i, idxs)
    };
    G__13571.cljs$lang$maxFixedArity = 2;
    G__13571.cljs$lang$applyTo = function(arglist__13572) {
      var array = cljs.core.first(arglist__13572);
      var i = cljs.core.first(cljs.core.next(arglist__13572));
      var idxs = cljs.core.rest(cljs.core.next(arglist__13572));
      return G__13571__delegate(array, i, idxs)
    };
    G__13571.cljs$lang$arity$variadic = G__13571__delegate;
    return G__13571
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
      var and__3822__auto____13657 = this$;
      if(and__3822__auto____13657) {
        return this$.cljs$core$IFn$_invoke$arity$1
      }else {
        return and__3822__auto____13657
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$1(this$)
    }else {
      var x__2363__auto____13658 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____13659 = cljs.core._invoke[goog.typeOf(x__2363__auto____13658)];
        if(or__3824__auto____13659) {
          return or__3824__auto____13659
        }else {
          var or__3824__auto____13660 = cljs.core._invoke["_"];
          if(or__3824__auto____13660) {
            return or__3824__auto____13660
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$)
    }
  };
  var _invoke__2 = function(this$, a) {
    if(function() {
      var and__3822__auto____13661 = this$;
      if(and__3822__auto____13661) {
        return this$.cljs$core$IFn$_invoke$arity$2
      }else {
        return and__3822__auto____13661
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$2(this$, a)
    }else {
      var x__2363__auto____13662 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____13663 = cljs.core._invoke[goog.typeOf(x__2363__auto____13662)];
        if(or__3824__auto____13663) {
          return or__3824__auto____13663
        }else {
          var or__3824__auto____13664 = cljs.core._invoke["_"];
          if(or__3824__auto____13664) {
            return or__3824__auto____13664
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a)
    }
  };
  var _invoke__3 = function(this$, a, b) {
    if(function() {
      var and__3822__auto____13665 = this$;
      if(and__3822__auto____13665) {
        return this$.cljs$core$IFn$_invoke$arity$3
      }else {
        return and__3822__auto____13665
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$3(this$, a, b)
    }else {
      var x__2363__auto____13666 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____13667 = cljs.core._invoke[goog.typeOf(x__2363__auto____13666)];
        if(or__3824__auto____13667) {
          return or__3824__auto____13667
        }else {
          var or__3824__auto____13668 = cljs.core._invoke["_"];
          if(or__3824__auto____13668) {
            return or__3824__auto____13668
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b)
    }
  };
  var _invoke__4 = function(this$, a, b, c) {
    if(function() {
      var and__3822__auto____13669 = this$;
      if(and__3822__auto____13669) {
        return this$.cljs$core$IFn$_invoke$arity$4
      }else {
        return and__3822__auto____13669
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$4(this$, a, b, c)
    }else {
      var x__2363__auto____13670 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____13671 = cljs.core._invoke[goog.typeOf(x__2363__auto____13670)];
        if(or__3824__auto____13671) {
          return or__3824__auto____13671
        }else {
          var or__3824__auto____13672 = cljs.core._invoke["_"];
          if(or__3824__auto____13672) {
            return or__3824__auto____13672
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c)
    }
  };
  var _invoke__5 = function(this$, a, b, c, d) {
    if(function() {
      var and__3822__auto____13673 = this$;
      if(and__3822__auto____13673) {
        return this$.cljs$core$IFn$_invoke$arity$5
      }else {
        return and__3822__auto____13673
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$5(this$, a, b, c, d)
    }else {
      var x__2363__auto____13674 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____13675 = cljs.core._invoke[goog.typeOf(x__2363__auto____13674)];
        if(or__3824__auto____13675) {
          return or__3824__auto____13675
        }else {
          var or__3824__auto____13676 = cljs.core._invoke["_"];
          if(or__3824__auto____13676) {
            return or__3824__auto____13676
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d)
    }
  };
  var _invoke__6 = function(this$, a, b, c, d, e) {
    if(function() {
      var and__3822__auto____13677 = this$;
      if(and__3822__auto____13677) {
        return this$.cljs$core$IFn$_invoke$arity$6
      }else {
        return and__3822__auto____13677
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$6(this$, a, b, c, d, e)
    }else {
      var x__2363__auto____13678 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____13679 = cljs.core._invoke[goog.typeOf(x__2363__auto____13678)];
        if(or__3824__auto____13679) {
          return or__3824__auto____13679
        }else {
          var or__3824__auto____13680 = cljs.core._invoke["_"];
          if(or__3824__auto____13680) {
            return or__3824__auto____13680
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e)
    }
  };
  var _invoke__7 = function(this$, a, b, c, d, e, f) {
    if(function() {
      var and__3822__auto____13681 = this$;
      if(and__3822__auto____13681) {
        return this$.cljs$core$IFn$_invoke$arity$7
      }else {
        return and__3822__auto____13681
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$7(this$, a, b, c, d, e, f)
    }else {
      var x__2363__auto____13682 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____13683 = cljs.core._invoke[goog.typeOf(x__2363__auto____13682)];
        if(or__3824__auto____13683) {
          return or__3824__auto____13683
        }else {
          var or__3824__auto____13684 = cljs.core._invoke["_"];
          if(or__3824__auto____13684) {
            return or__3824__auto____13684
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f)
    }
  };
  var _invoke__8 = function(this$, a, b, c, d, e, f, g) {
    if(function() {
      var and__3822__auto____13685 = this$;
      if(and__3822__auto____13685) {
        return this$.cljs$core$IFn$_invoke$arity$8
      }else {
        return and__3822__auto____13685
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$8(this$, a, b, c, d, e, f, g)
    }else {
      var x__2363__auto____13686 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____13687 = cljs.core._invoke[goog.typeOf(x__2363__auto____13686)];
        if(or__3824__auto____13687) {
          return or__3824__auto____13687
        }else {
          var or__3824__auto____13688 = cljs.core._invoke["_"];
          if(or__3824__auto____13688) {
            return or__3824__auto____13688
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g)
    }
  };
  var _invoke__9 = function(this$, a, b, c, d, e, f, g, h) {
    if(function() {
      var and__3822__auto____13689 = this$;
      if(and__3822__auto____13689) {
        return this$.cljs$core$IFn$_invoke$arity$9
      }else {
        return and__3822__auto____13689
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$9(this$, a, b, c, d, e, f, g, h)
    }else {
      var x__2363__auto____13690 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____13691 = cljs.core._invoke[goog.typeOf(x__2363__auto____13690)];
        if(or__3824__auto____13691) {
          return or__3824__auto____13691
        }else {
          var or__3824__auto____13692 = cljs.core._invoke["_"];
          if(or__3824__auto____13692) {
            return or__3824__auto____13692
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h)
    }
  };
  var _invoke__10 = function(this$, a, b, c, d, e, f, g, h, i) {
    if(function() {
      var and__3822__auto____13693 = this$;
      if(and__3822__auto____13693) {
        return this$.cljs$core$IFn$_invoke$arity$10
      }else {
        return and__3822__auto____13693
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$10(this$, a, b, c, d, e, f, g, h, i)
    }else {
      var x__2363__auto____13694 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____13695 = cljs.core._invoke[goog.typeOf(x__2363__auto____13694)];
        if(or__3824__auto____13695) {
          return or__3824__auto____13695
        }else {
          var or__3824__auto____13696 = cljs.core._invoke["_"];
          if(or__3824__auto____13696) {
            return or__3824__auto____13696
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i)
    }
  };
  var _invoke__11 = function(this$, a, b, c, d, e, f, g, h, i, j) {
    if(function() {
      var and__3822__auto____13697 = this$;
      if(and__3822__auto____13697) {
        return this$.cljs$core$IFn$_invoke$arity$11
      }else {
        return and__3822__auto____13697
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$11(this$, a, b, c, d, e, f, g, h, i, j)
    }else {
      var x__2363__auto____13698 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____13699 = cljs.core._invoke[goog.typeOf(x__2363__auto____13698)];
        if(or__3824__auto____13699) {
          return or__3824__auto____13699
        }else {
          var or__3824__auto____13700 = cljs.core._invoke["_"];
          if(or__3824__auto____13700) {
            return or__3824__auto____13700
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j)
    }
  };
  var _invoke__12 = function(this$, a, b, c, d, e, f, g, h, i, j, k) {
    if(function() {
      var and__3822__auto____13701 = this$;
      if(and__3822__auto____13701) {
        return this$.cljs$core$IFn$_invoke$arity$12
      }else {
        return and__3822__auto____13701
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$12(this$, a, b, c, d, e, f, g, h, i, j, k)
    }else {
      var x__2363__auto____13702 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____13703 = cljs.core._invoke[goog.typeOf(x__2363__auto____13702)];
        if(or__3824__auto____13703) {
          return or__3824__auto____13703
        }else {
          var or__3824__auto____13704 = cljs.core._invoke["_"];
          if(or__3824__auto____13704) {
            return or__3824__auto____13704
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k)
    }
  };
  var _invoke__13 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l) {
    if(function() {
      var and__3822__auto____13705 = this$;
      if(and__3822__auto____13705) {
        return this$.cljs$core$IFn$_invoke$arity$13
      }else {
        return and__3822__auto____13705
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$13(this$, a, b, c, d, e, f, g, h, i, j, k, l)
    }else {
      var x__2363__auto____13706 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____13707 = cljs.core._invoke[goog.typeOf(x__2363__auto____13706)];
        if(or__3824__auto____13707) {
          return or__3824__auto____13707
        }else {
          var or__3824__auto____13708 = cljs.core._invoke["_"];
          if(or__3824__auto____13708) {
            return or__3824__auto____13708
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l)
    }
  };
  var _invoke__14 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m) {
    if(function() {
      var and__3822__auto____13709 = this$;
      if(and__3822__auto____13709) {
        return this$.cljs$core$IFn$_invoke$arity$14
      }else {
        return and__3822__auto____13709
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$14(this$, a, b, c, d, e, f, g, h, i, j, k, l, m)
    }else {
      var x__2363__auto____13710 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____13711 = cljs.core._invoke[goog.typeOf(x__2363__auto____13710)];
        if(or__3824__auto____13711) {
          return or__3824__auto____13711
        }else {
          var or__3824__auto____13712 = cljs.core._invoke["_"];
          if(or__3824__auto____13712) {
            return or__3824__auto____13712
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m)
    }
  };
  var _invoke__15 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n) {
    if(function() {
      var and__3822__auto____13713 = this$;
      if(and__3822__auto____13713) {
        return this$.cljs$core$IFn$_invoke$arity$15
      }else {
        return and__3822__auto____13713
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$15(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n)
    }else {
      var x__2363__auto____13714 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____13715 = cljs.core._invoke[goog.typeOf(x__2363__auto____13714)];
        if(or__3824__auto____13715) {
          return or__3824__auto____13715
        }else {
          var or__3824__auto____13716 = cljs.core._invoke["_"];
          if(or__3824__auto____13716) {
            return or__3824__auto____13716
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n)
    }
  };
  var _invoke__16 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o) {
    if(function() {
      var and__3822__auto____13717 = this$;
      if(and__3822__auto____13717) {
        return this$.cljs$core$IFn$_invoke$arity$16
      }else {
        return and__3822__auto____13717
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$16(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o)
    }else {
      var x__2363__auto____13718 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____13719 = cljs.core._invoke[goog.typeOf(x__2363__auto____13718)];
        if(or__3824__auto____13719) {
          return or__3824__auto____13719
        }else {
          var or__3824__auto____13720 = cljs.core._invoke["_"];
          if(or__3824__auto____13720) {
            return or__3824__auto____13720
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o)
    }
  };
  var _invoke__17 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p) {
    if(function() {
      var and__3822__auto____13721 = this$;
      if(and__3822__auto____13721) {
        return this$.cljs$core$IFn$_invoke$arity$17
      }else {
        return and__3822__auto____13721
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$17(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p)
    }else {
      var x__2363__auto____13722 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____13723 = cljs.core._invoke[goog.typeOf(x__2363__auto____13722)];
        if(or__3824__auto____13723) {
          return or__3824__auto____13723
        }else {
          var or__3824__auto____13724 = cljs.core._invoke["_"];
          if(or__3824__auto____13724) {
            return or__3824__auto____13724
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p)
    }
  };
  var _invoke__18 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q) {
    if(function() {
      var and__3822__auto____13725 = this$;
      if(and__3822__auto____13725) {
        return this$.cljs$core$IFn$_invoke$arity$18
      }else {
        return and__3822__auto____13725
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$18(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q)
    }else {
      var x__2363__auto____13726 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____13727 = cljs.core._invoke[goog.typeOf(x__2363__auto____13726)];
        if(or__3824__auto____13727) {
          return or__3824__auto____13727
        }else {
          var or__3824__auto____13728 = cljs.core._invoke["_"];
          if(or__3824__auto____13728) {
            return or__3824__auto____13728
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q)
    }
  };
  var _invoke__19 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s) {
    if(function() {
      var and__3822__auto____13729 = this$;
      if(and__3822__auto____13729) {
        return this$.cljs$core$IFn$_invoke$arity$19
      }else {
        return and__3822__auto____13729
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$19(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s)
    }else {
      var x__2363__auto____13730 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____13731 = cljs.core._invoke[goog.typeOf(x__2363__auto____13730)];
        if(or__3824__auto____13731) {
          return or__3824__auto____13731
        }else {
          var or__3824__auto____13732 = cljs.core._invoke["_"];
          if(or__3824__auto____13732) {
            return or__3824__auto____13732
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s)
    }
  };
  var _invoke__20 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t) {
    if(function() {
      var and__3822__auto____13733 = this$;
      if(and__3822__auto____13733) {
        return this$.cljs$core$IFn$_invoke$arity$20
      }else {
        return and__3822__auto____13733
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$20(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t)
    }else {
      var x__2363__auto____13734 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____13735 = cljs.core._invoke[goog.typeOf(x__2363__auto____13734)];
        if(or__3824__auto____13735) {
          return or__3824__auto____13735
        }else {
          var or__3824__auto____13736 = cljs.core._invoke["_"];
          if(or__3824__auto____13736) {
            return or__3824__auto____13736
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t)
    }
  };
  var _invoke__21 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t, rest) {
    if(function() {
      var and__3822__auto____13737 = this$;
      if(and__3822__auto____13737) {
        return this$.cljs$core$IFn$_invoke$arity$21
      }else {
        return and__3822__auto____13737
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$21(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t, rest)
    }else {
      var x__2363__auto____13738 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____13739 = cljs.core._invoke[goog.typeOf(x__2363__auto____13738)];
        if(or__3824__auto____13739) {
          return or__3824__auto____13739
        }else {
          var or__3824__auto____13740 = cljs.core._invoke["_"];
          if(or__3824__auto____13740) {
            return or__3824__auto____13740
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
    var and__3822__auto____13745 = coll;
    if(and__3822__auto____13745) {
      return coll.cljs$core$ICounted$_count$arity$1
    }else {
      return and__3822__auto____13745
    }
  }()) {
    return coll.cljs$core$ICounted$_count$arity$1(coll)
  }else {
    var x__2363__auto____13746 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____13747 = cljs.core._count[goog.typeOf(x__2363__auto____13746)];
      if(or__3824__auto____13747) {
        return or__3824__auto____13747
      }else {
        var or__3824__auto____13748 = cljs.core._count["_"];
        if(or__3824__auto____13748) {
          return or__3824__auto____13748
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
    var and__3822__auto____13753 = coll;
    if(and__3822__auto____13753) {
      return coll.cljs$core$IEmptyableCollection$_empty$arity$1
    }else {
      return and__3822__auto____13753
    }
  }()) {
    return coll.cljs$core$IEmptyableCollection$_empty$arity$1(coll)
  }else {
    var x__2363__auto____13754 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____13755 = cljs.core._empty[goog.typeOf(x__2363__auto____13754)];
      if(or__3824__auto____13755) {
        return or__3824__auto____13755
      }else {
        var or__3824__auto____13756 = cljs.core._empty["_"];
        if(or__3824__auto____13756) {
          return or__3824__auto____13756
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
    var and__3822__auto____13761 = coll;
    if(and__3822__auto____13761) {
      return coll.cljs$core$ICollection$_conj$arity$2
    }else {
      return and__3822__auto____13761
    }
  }()) {
    return coll.cljs$core$ICollection$_conj$arity$2(coll, o)
  }else {
    var x__2363__auto____13762 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____13763 = cljs.core._conj[goog.typeOf(x__2363__auto____13762)];
      if(or__3824__auto____13763) {
        return or__3824__auto____13763
      }else {
        var or__3824__auto____13764 = cljs.core._conj["_"];
        if(or__3824__auto____13764) {
          return or__3824__auto____13764
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
      var and__3822__auto____13773 = coll;
      if(and__3822__auto____13773) {
        return coll.cljs$core$IIndexed$_nth$arity$2
      }else {
        return and__3822__auto____13773
      }
    }()) {
      return coll.cljs$core$IIndexed$_nth$arity$2(coll, n)
    }else {
      var x__2363__auto____13774 = coll == null ? null : coll;
      return function() {
        var or__3824__auto____13775 = cljs.core._nth[goog.typeOf(x__2363__auto____13774)];
        if(or__3824__auto____13775) {
          return or__3824__auto____13775
        }else {
          var or__3824__auto____13776 = cljs.core._nth["_"];
          if(or__3824__auto____13776) {
            return or__3824__auto____13776
          }else {
            throw cljs.core.missing_protocol.call(null, "IIndexed.-nth", coll);
          }
        }
      }().call(null, coll, n)
    }
  };
  var _nth__3 = function(coll, n, not_found) {
    if(function() {
      var and__3822__auto____13777 = coll;
      if(and__3822__auto____13777) {
        return coll.cljs$core$IIndexed$_nth$arity$3
      }else {
        return and__3822__auto____13777
      }
    }()) {
      return coll.cljs$core$IIndexed$_nth$arity$3(coll, n, not_found)
    }else {
      var x__2363__auto____13778 = coll == null ? null : coll;
      return function() {
        var or__3824__auto____13779 = cljs.core._nth[goog.typeOf(x__2363__auto____13778)];
        if(or__3824__auto____13779) {
          return or__3824__auto____13779
        }else {
          var or__3824__auto____13780 = cljs.core._nth["_"];
          if(or__3824__auto____13780) {
            return or__3824__auto____13780
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
    var and__3822__auto____13785 = coll;
    if(and__3822__auto____13785) {
      return coll.cljs$core$ISeq$_first$arity$1
    }else {
      return and__3822__auto____13785
    }
  }()) {
    return coll.cljs$core$ISeq$_first$arity$1(coll)
  }else {
    var x__2363__auto____13786 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____13787 = cljs.core._first[goog.typeOf(x__2363__auto____13786)];
      if(or__3824__auto____13787) {
        return or__3824__auto____13787
      }else {
        var or__3824__auto____13788 = cljs.core._first["_"];
        if(or__3824__auto____13788) {
          return or__3824__auto____13788
        }else {
          throw cljs.core.missing_protocol.call(null, "ISeq.-first", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core._rest = function _rest(coll) {
  if(function() {
    var and__3822__auto____13793 = coll;
    if(and__3822__auto____13793) {
      return coll.cljs$core$ISeq$_rest$arity$1
    }else {
      return and__3822__auto____13793
    }
  }()) {
    return coll.cljs$core$ISeq$_rest$arity$1(coll)
  }else {
    var x__2363__auto____13794 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____13795 = cljs.core._rest[goog.typeOf(x__2363__auto____13794)];
      if(or__3824__auto____13795) {
        return or__3824__auto____13795
      }else {
        var or__3824__auto____13796 = cljs.core._rest["_"];
        if(or__3824__auto____13796) {
          return or__3824__auto____13796
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
    var and__3822__auto____13801 = coll;
    if(and__3822__auto____13801) {
      return coll.cljs$core$INext$_next$arity$1
    }else {
      return and__3822__auto____13801
    }
  }()) {
    return coll.cljs$core$INext$_next$arity$1(coll)
  }else {
    var x__2363__auto____13802 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____13803 = cljs.core._next[goog.typeOf(x__2363__auto____13802)];
      if(or__3824__auto____13803) {
        return or__3824__auto____13803
      }else {
        var or__3824__auto____13804 = cljs.core._next["_"];
        if(or__3824__auto____13804) {
          return or__3824__auto____13804
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
      var and__3822__auto____13813 = o;
      if(and__3822__auto____13813) {
        return o.cljs$core$ILookup$_lookup$arity$2
      }else {
        return and__3822__auto____13813
      }
    }()) {
      return o.cljs$core$ILookup$_lookup$arity$2(o, k)
    }else {
      var x__2363__auto____13814 = o == null ? null : o;
      return function() {
        var or__3824__auto____13815 = cljs.core._lookup[goog.typeOf(x__2363__auto____13814)];
        if(or__3824__auto____13815) {
          return or__3824__auto____13815
        }else {
          var or__3824__auto____13816 = cljs.core._lookup["_"];
          if(or__3824__auto____13816) {
            return or__3824__auto____13816
          }else {
            throw cljs.core.missing_protocol.call(null, "ILookup.-lookup", o);
          }
        }
      }().call(null, o, k)
    }
  };
  var _lookup__3 = function(o, k, not_found) {
    if(function() {
      var and__3822__auto____13817 = o;
      if(and__3822__auto____13817) {
        return o.cljs$core$ILookup$_lookup$arity$3
      }else {
        return and__3822__auto____13817
      }
    }()) {
      return o.cljs$core$ILookup$_lookup$arity$3(o, k, not_found)
    }else {
      var x__2363__auto____13818 = o == null ? null : o;
      return function() {
        var or__3824__auto____13819 = cljs.core._lookup[goog.typeOf(x__2363__auto____13818)];
        if(or__3824__auto____13819) {
          return or__3824__auto____13819
        }else {
          var or__3824__auto____13820 = cljs.core._lookup["_"];
          if(or__3824__auto____13820) {
            return or__3824__auto____13820
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
    var and__3822__auto____13825 = coll;
    if(and__3822__auto____13825) {
      return coll.cljs$core$IAssociative$_contains_key_QMARK_$arity$2
    }else {
      return and__3822__auto____13825
    }
  }()) {
    return coll.cljs$core$IAssociative$_contains_key_QMARK_$arity$2(coll, k)
  }else {
    var x__2363__auto____13826 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____13827 = cljs.core._contains_key_QMARK_[goog.typeOf(x__2363__auto____13826)];
      if(or__3824__auto____13827) {
        return or__3824__auto____13827
      }else {
        var or__3824__auto____13828 = cljs.core._contains_key_QMARK_["_"];
        if(or__3824__auto____13828) {
          return or__3824__auto____13828
        }else {
          throw cljs.core.missing_protocol.call(null, "IAssociative.-contains-key?", coll);
        }
      }
    }().call(null, coll, k)
  }
};
cljs.core._assoc = function _assoc(coll, k, v) {
  if(function() {
    var and__3822__auto____13833 = coll;
    if(and__3822__auto____13833) {
      return coll.cljs$core$IAssociative$_assoc$arity$3
    }else {
      return and__3822__auto____13833
    }
  }()) {
    return coll.cljs$core$IAssociative$_assoc$arity$3(coll, k, v)
  }else {
    var x__2363__auto____13834 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____13835 = cljs.core._assoc[goog.typeOf(x__2363__auto____13834)];
      if(or__3824__auto____13835) {
        return or__3824__auto____13835
      }else {
        var or__3824__auto____13836 = cljs.core._assoc["_"];
        if(or__3824__auto____13836) {
          return or__3824__auto____13836
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
    var and__3822__auto____13841 = coll;
    if(and__3822__auto____13841) {
      return coll.cljs$core$IMap$_dissoc$arity$2
    }else {
      return and__3822__auto____13841
    }
  }()) {
    return coll.cljs$core$IMap$_dissoc$arity$2(coll, k)
  }else {
    var x__2363__auto____13842 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____13843 = cljs.core._dissoc[goog.typeOf(x__2363__auto____13842)];
      if(or__3824__auto____13843) {
        return or__3824__auto____13843
      }else {
        var or__3824__auto____13844 = cljs.core._dissoc["_"];
        if(or__3824__auto____13844) {
          return or__3824__auto____13844
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
    var and__3822__auto____13849 = coll;
    if(and__3822__auto____13849) {
      return coll.cljs$core$IMapEntry$_key$arity$1
    }else {
      return and__3822__auto____13849
    }
  }()) {
    return coll.cljs$core$IMapEntry$_key$arity$1(coll)
  }else {
    var x__2363__auto____13850 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____13851 = cljs.core._key[goog.typeOf(x__2363__auto____13850)];
      if(or__3824__auto____13851) {
        return or__3824__auto____13851
      }else {
        var or__3824__auto____13852 = cljs.core._key["_"];
        if(or__3824__auto____13852) {
          return or__3824__auto____13852
        }else {
          throw cljs.core.missing_protocol.call(null, "IMapEntry.-key", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core._val = function _val(coll) {
  if(function() {
    var and__3822__auto____13857 = coll;
    if(and__3822__auto____13857) {
      return coll.cljs$core$IMapEntry$_val$arity$1
    }else {
      return and__3822__auto____13857
    }
  }()) {
    return coll.cljs$core$IMapEntry$_val$arity$1(coll)
  }else {
    var x__2363__auto____13858 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____13859 = cljs.core._val[goog.typeOf(x__2363__auto____13858)];
      if(or__3824__auto____13859) {
        return or__3824__auto____13859
      }else {
        var or__3824__auto____13860 = cljs.core._val["_"];
        if(or__3824__auto____13860) {
          return or__3824__auto____13860
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
    var and__3822__auto____13865 = coll;
    if(and__3822__auto____13865) {
      return coll.cljs$core$ISet$_disjoin$arity$2
    }else {
      return and__3822__auto____13865
    }
  }()) {
    return coll.cljs$core$ISet$_disjoin$arity$2(coll, v)
  }else {
    var x__2363__auto____13866 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____13867 = cljs.core._disjoin[goog.typeOf(x__2363__auto____13866)];
      if(or__3824__auto____13867) {
        return or__3824__auto____13867
      }else {
        var or__3824__auto____13868 = cljs.core._disjoin["_"];
        if(or__3824__auto____13868) {
          return or__3824__auto____13868
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
    var and__3822__auto____13873 = coll;
    if(and__3822__auto____13873) {
      return coll.cljs$core$IStack$_peek$arity$1
    }else {
      return and__3822__auto____13873
    }
  }()) {
    return coll.cljs$core$IStack$_peek$arity$1(coll)
  }else {
    var x__2363__auto____13874 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____13875 = cljs.core._peek[goog.typeOf(x__2363__auto____13874)];
      if(or__3824__auto____13875) {
        return or__3824__auto____13875
      }else {
        var or__3824__auto____13876 = cljs.core._peek["_"];
        if(or__3824__auto____13876) {
          return or__3824__auto____13876
        }else {
          throw cljs.core.missing_protocol.call(null, "IStack.-peek", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core._pop = function _pop(coll) {
  if(function() {
    var and__3822__auto____13881 = coll;
    if(and__3822__auto____13881) {
      return coll.cljs$core$IStack$_pop$arity$1
    }else {
      return and__3822__auto____13881
    }
  }()) {
    return coll.cljs$core$IStack$_pop$arity$1(coll)
  }else {
    var x__2363__auto____13882 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____13883 = cljs.core._pop[goog.typeOf(x__2363__auto____13882)];
      if(or__3824__auto____13883) {
        return or__3824__auto____13883
      }else {
        var or__3824__auto____13884 = cljs.core._pop["_"];
        if(or__3824__auto____13884) {
          return or__3824__auto____13884
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
    var and__3822__auto____13889 = coll;
    if(and__3822__auto____13889) {
      return coll.cljs$core$IVector$_assoc_n$arity$3
    }else {
      return and__3822__auto____13889
    }
  }()) {
    return coll.cljs$core$IVector$_assoc_n$arity$3(coll, n, val)
  }else {
    var x__2363__auto____13890 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____13891 = cljs.core._assoc_n[goog.typeOf(x__2363__auto____13890)];
      if(or__3824__auto____13891) {
        return or__3824__auto____13891
      }else {
        var or__3824__auto____13892 = cljs.core._assoc_n["_"];
        if(or__3824__auto____13892) {
          return or__3824__auto____13892
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
    var and__3822__auto____13897 = o;
    if(and__3822__auto____13897) {
      return o.cljs$core$IDeref$_deref$arity$1
    }else {
      return and__3822__auto____13897
    }
  }()) {
    return o.cljs$core$IDeref$_deref$arity$1(o)
  }else {
    var x__2363__auto____13898 = o == null ? null : o;
    return function() {
      var or__3824__auto____13899 = cljs.core._deref[goog.typeOf(x__2363__auto____13898)];
      if(or__3824__auto____13899) {
        return or__3824__auto____13899
      }else {
        var or__3824__auto____13900 = cljs.core._deref["_"];
        if(or__3824__auto____13900) {
          return or__3824__auto____13900
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
    var and__3822__auto____13905 = o;
    if(and__3822__auto____13905) {
      return o.cljs$core$IDerefWithTimeout$_deref_with_timeout$arity$3
    }else {
      return and__3822__auto____13905
    }
  }()) {
    return o.cljs$core$IDerefWithTimeout$_deref_with_timeout$arity$3(o, msec, timeout_val)
  }else {
    var x__2363__auto____13906 = o == null ? null : o;
    return function() {
      var or__3824__auto____13907 = cljs.core._deref_with_timeout[goog.typeOf(x__2363__auto____13906)];
      if(or__3824__auto____13907) {
        return or__3824__auto____13907
      }else {
        var or__3824__auto____13908 = cljs.core._deref_with_timeout["_"];
        if(or__3824__auto____13908) {
          return or__3824__auto____13908
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
    var and__3822__auto____13913 = o;
    if(and__3822__auto____13913) {
      return o.cljs$core$IMeta$_meta$arity$1
    }else {
      return and__3822__auto____13913
    }
  }()) {
    return o.cljs$core$IMeta$_meta$arity$1(o)
  }else {
    var x__2363__auto____13914 = o == null ? null : o;
    return function() {
      var or__3824__auto____13915 = cljs.core._meta[goog.typeOf(x__2363__auto____13914)];
      if(or__3824__auto____13915) {
        return or__3824__auto____13915
      }else {
        var or__3824__auto____13916 = cljs.core._meta["_"];
        if(or__3824__auto____13916) {
          return or__3824__auto____13916
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
    var and__3822__auto____13921 = o;
    if(and__3822__auto____13921) {
      return o.cljs$core$IWithMeta$_with_meta$arity$2
    }else {
      return and__3822__auto____13921
    }
  }()) {
    return o.cljs$core$IWithMeta$_with_meta$arity$2(o, meta)
  }else {
    var x__2363__auto____13922 = o == null ? null : o;
    return function() {
      var or__3824__auto____13923 = cljs.core._with_meta[goog.typeOf(x__2363__auto____13922)];
      if(or__3824__auto____13923) {
        return or__3824__auto____13923
      }else {
        var or__3824__auto____13924 = cljs.core._with_meta["_"];
        if(or__3824__auto____13924) {
          return or__3824__auto____13924
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
      var and__3822__auto____13933 = coll;
      if(and__3822__auto____13933) {
        return coll.cljs$core$IReduce$_reduce$arity$2
      }else {
        return and__3822__auto____13933
      }
    }()) {
      return coll.cljs$core$IReduce$_reduce$arity$2(coll, f)
    }else {
      var x__2363__auto____13934 = coll == null ? null : coll;
      return function() {
        var or__3824__auto____13935 = cljs.core._reduce[goog.typeOf(x__2363__auto____13934)];
        if(or__3824__auto____13935) {
          return or__3824__auto____13935
        }else {
          var or__3824__auto____13936 = cljs.core._reduce["_"];
          if(or__3824__auto____13936) {
            return or__3824__auto____13936
          }else {
            throw cljs.core.missing_protocol.call(null, "IReduce.-reduce", coll);
          }
        }
      }().call(null, coll, f)
    }
  };
  var _reduce__3 = function(coll, f, start) {
    if(function() {
      var and__3822__auto____13937 = coll;
      if(and__3822__auto____13937) {
        return coll.cljs$core$IReduce$_reduce$arity$3
      }else {
        return and__3822__auto____13937
      }
    }()) {
      return coll.cljs$core$IReduce$_reduce$arity$3(coll, f, start)
    }else {
      var x__2363__auto____13938 = coll == null ? null : coll;
      return function() {
        var or__3824__auto____13939 = cljs.core._reduce[goog.typeOf(x__2363__auto____13938)];
        if(or__3824__auto____13939) {
          return or__3824__auto____13939
        }else {
          var or__3824__auto____13940 = cljs.core._reduce["_"];
          if(or__3824__auto____13940) {
            return or__3824__auto____13940
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
    var and__3822__auto____13945 = coll;
    if(and__3822__auto____13945) {
      return coll.cljs$core$IKVReduce$_kv_reduce$arity$3
    }else {
      return and__3822__auto____13945
    }
  }()) {
    return coll.cljs$core$IKVReduce$_kv_reduce$arity$3(coll, f, init)
  }else {
    var x__2363__auto____13946 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____13947 = cljs.core._kv_reduce[goog.typeOf(x__2363__auto____13946)];
      if(or__3824__auto____13947) {
        return or__3824__auto____13947
      }else {
        var or__3824__auto____13948 = cljs.core._kv_reduce["_"];
        if(or__3824__auto____13948) {
          return or__3824__auto____13948
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
    var and__3822__auto____13953 = o;
    if(and__3822__auto____13953) {
      return o.cljs$core$IEquiv$_equiv$arity$2
    }else {
      return and__3822__auto____13953
    }
  }()) {
    return o.cljs$core$IEquiv$_equiv$arity$2(o, other)
  }else {
    var x__2363__auto____13954 = o == null ? null : o;
    return function() {
      var or__3824__auto____13955 = cljs.core._equiv[goog.typeOf(x__2363__auto____13954)];
      if(or__3824__auto____13955) {
        return or__3824__auto____13955
      }else {
        var or__3824__auto____13956 = cljs.core._equiv["_"];
        if(or__3824__auto____13956) {
          return or__3824__auto____13956
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
    var and__3822__auto____13961 = o;
    if(and__3822__auto____13961) {
      return o.cljs$core$IHash$_hash$arity$1
    }else {
      return and__3822__auto____13961
    }
  }()) {
    return o.cljs$core$IHash$_hash$arity$1(o)
  }else {
    var x__2363__auto____13962 = o == null ? null : o;
    return function() {
      var or__3824__auto____13963 = cljs.core._hash[goog.typeOf(x__2363__auto____13962)];
      if(or__3824__auto____13963) {
        return or__3824__auto____13963
      }else {
        var or__3824__auto____13964 = cljs.core._hash["_"];
        if(or__3824__auto____13964) {
          return or__3824__auto____13964
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
    var and__3822__auto____13969 = o;
    if(and__3822__auto____13969) {
      return o.cljs$core$ISeqable$_seq$arity$1
    }else {
      return and__3822__auto____13969
    }
  }()) {
    return o.cljs$core$ISeqable$_seq$arity$1(o)
  }else {
    var x__2363__auto____13970 = o == null ? null : o;
    return function() {
      var or__3824__auto____13971 = cljs.core._seq[goog.typeOf(x__2363__auto____13970)];
      if(or__3824__auto____13971) {
        return or__3824__auto____13971
      }else {
        var or__3824__auto____13972 = cljs.core._seq["_"];
        if(or__3824__auto____13972) {
          return or__3824__auto____13972
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
    var and__3822__auto____13977 = coll;
    if(and__3822__auto____13977) {
      return coll.cljs$core$IReversible$_rseq$arity$1
    }else {
      return and__3822__auto____13977
    }
  }()) {
    return coll.cljs$core$IReversible$_rseq$arity$1(coll)
  }else {
    var x__2363__auto____13978 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____13979 = cljs.core._rseq[goog.typeOf(x__2363__auto____13978)];
      if(or__3824__auto____13979) {
        return or__3824__auto____13979
      }else {
        var or__3824__auto____13980 = cljs.core._rseq["_"];
        if(or__3824__auto____13980) {
          return or__3824__auto____13980
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
    var and__3822__auto____13985 = coll;
    if(and__3822__auto____13985) {
      return coll.cljs$core$ISorted$_sorted_seq$arity$2
    }else {
      return and__3822__auto____13985
    }
  }()) {
    return coll.cljs$core$ISorted$_sorted_seq$arity$2(coll, ascending_QMARK_)
  }else {
    var x__2363__auto____13986 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____13987 = cljs.core._sorted_seq[goog.typeOf(x__2363__auto____13986)];
      if(or__3824__auto____13987) {
        return or__3824__auto____13987
      }else {
        var or__3824__auto____13988 = cljs.core._sorted_seq["_"];
        if(or__3824__auto____13988) {
          return or__3824__auto____13988
        }else {
          throw cljs.core.missing_protocol.call(null, "ISorted.-sorted-seq", coll);
        }
      }
    }().call(null, coll, ascending_QMARK_)
  }
};
cljs.core._sorted_seq_from = function _sorted_seq_from(coll, k, ascending_QMARK_) {
  if(function() {
    var and__3822__auto____13993 = coll;
    if(and__3822__auto____13993) {
      return coll.cljs$core$ISorted$_sorted_seq_from$arity$3
    }else {
      return and__3822__auto____13993
    }
  }()) {
    return coll.cljs$core$ISorted$_sorted_seq_from$arity$3(coll, k, ascending_QMARK_)
  }else {
    var x__2363__auto____13994 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____13995 = cljs.core._sorted_seq_from[goog.typeOf(x__2363__auto____13994)];
      if(or__3824__auto____13995) {
        return or__3824__auto____13995
      }else {
        var or__3824__auto____13996 = cljs.core._sorted_seq_from["_"];
        if(or__3824__auto____13996) {
          return or__3824__auto____13996
        }else {
          throw cljs.core.missing_protocol.call(null, "ISorted.-sorted-seq-from", coll);
        }
      }
    }().call(null, coll, k, ascending_QMARK_)
  }
};
cljs.core._entry_key = function _entry_key(coll, entry) {
  if(function() {
    var and__3822__auto____14001 = coll;
    if(and__3822__auto____14001) {
      return coll.cljs$core$ISorted$_entry_key$arity$2
    }else {
      return and__3822__auto____14001
    }
  }()) {
    return coll.cljs$core$ISorted$_entry_key$arity$2(coll, entry)
  }else {
    var x__2363__auto____14002 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____14003 = cljs.core._entry_key[goog.typeOf(x__2363__auto____14002)];
      if(or__3824__auto____14003) {
        return or__3824__auto____14003
      }else {
        var or__3824__auto____14004 = cljs.core._entry_key["_"];
        if(or__3824__auto____14004) {
          return or__3824__auto____14004
        }else {
          throw cljs.core.missing_protocol.call(null, "ISorted.-entry-key", coll);
        }
      }
    }().call(null, coll, entry)
  }
};
cljs.core._comparator = function _comparator(coll) {
  if(function() {
    var and__3822__auto____14009 = coll;
    if(and__3822__auto____14009) {
      return coll.cljs$core$ISorted$_comparator$arity$1
    }else {
      return and__3822__auto____14009
    }
  }()) {
    return coll.cljs$core$ISorted$_comparator$arity$1(coll)
  }else {
    var x__2363__auto____14010 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____14011 = cljs.core._comparator[goog.typeOf(x__2363__auto____14010)];
      if(or__3824__auto____14011) {
        return or__3824__auto____14011
      }else {
        var or__3824__auto____14012 = cljs.core._comparator["_"];
        if(or__3824__auto____14012) {
          return or__3824__auto____14012
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
    var and__3822__auto____14017 = o;
    if(and__3822__auto____14017) {
      return o.cljs$core$IPrintable$_pr_seq$arity$2
    }else {
      return and__3822__auto____14017
    }
  }()) {
    return o.cljs$core$IPrintable$_pr_seq$arity$2(o, opts)
  }else {
    var x__2363__auto____14018 = o == null ? null : o;
    return function() {
      var or__3824__auto____14019 = cljs.core._pr_seq[goog.typeOf(x__2363__auto____14018)];
      if(or__3824__auto____14019) {
        return or__3824__auto____14019
      }else {
        var or__3824__auto____14020 = cljs.core._pr_seq["_"];
        if(or__3824__auto____14020) {
          return or__3824__auto____14020
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
    var and__3822__auto____14025 = d;
    if(and__3822__auto____14025) {
      return d.cljs$core$IPending$_realized_QMARK_$arity$1
    }else {
      return and__3822__auto____14025
    }
  }()) {
    return d.cljs$core$IPending$_realized_QMARK_$arity$1(d)
  }else {
    var x__2363__auto____14026 = d == null ? null : d;
    return function() {
      var or__3824__auto____14027 = cljs.core._realized_QMARK_[goog.typeOf(x__2363__auto____14026)];
      if(or__3824__auto____14027) {
        return or__3824__auto____14027
      }else {
        var or__3824__auto____14028 = cljs.core._realized_QMARK_["_"];
        if(or__3824__auto____14028) {
          return or__3824__auto____14028
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
    var and__3822__auto____14033 = this$;
    if(and__3822__auto____14033) {
      return this$.cljs$core$IWatchable$_notify_watches$arity$3
    }else {
      return and__3822__auto____14033
    }
  }()) {
    return this$.cljs$core$IWatchable$_notify_watches$arity$3(this$, oldval, newval)
  }else {
    var x__2363__auto____14034 = this$ == null ? null : this$;
    return function() {
      var or__3824__auto____14035 = cljs.core._notify_watches[goog.typeOf(x__2363__auto____14034)];
      if(or__3824__auto____14035) {
        return or__3824__auto____14035
      }else {
        var or__3824__auto____14036 = cljs.core._notify_watches["_"];
        if(or__3824__auto____14036) {
          return or__3824__auto____14036
        }else {
          throw cljs.core.missing_protocol.call(null, "IWatchable.-notify-watches", this$);
        }
      }
    }().call(null, this$, oldval, newval)
  }
};
cljs.core._add_watch = function _add_watch(this$, key, f) {
  if(function() {
    var and__3822__auto____14041 = this$;
    if(and__3822__auto____14041) {
      return this$.cljs$core$IWatchable$_add_watch$arity$3
    }else {
      return and__3822__auto____14041
    }
  }()) {
    return this$.cljs$core$IWatchable$_add_watch$arity$3(this$, key, f)
  }else {
    var x__2363__auto____14042 = this$ == null ? null : this$;
    return function() {
      var or__3824__auto____14043 = cljs.core._add_watch[goog.typeOf(x__2363__auto____14042)];
      if(or__3824__auto____14043) {
        return or__3824__auto____14043
      }else {
        var or__3824__auto____14044 = cljs.core._add_watch["_"];
        if(or__3824__auto____14044) {
          return or__3824__auto____14044
        }else {
          throw cljs.core.missing_protocol.call(null, "IWatchable.-add-watch", this$);
        }
      }
    }().call(null, this$, key, f)
  }
};
cljs.core._remove_watch = function _remove_watch(this$, key) {
  if(function() {
    var and__3822__auto____14049 = this$;
    if(and__3822__auto____14049) {
      return this$.cljs$core$IWatchable$_remove_watch$arity$2
    }else {
      return and__3822__auto____14049
    }
  }()) {
    return this$.cljs$core$IWatchable$_remove_watch$arity$2(this$, key)
  }else {
    var x__2363__auto____14050 = this$ == null ? null : this$;
    return function() {
      var or__3824__auto____14051 = cljs.core._remove_watch[goog.typeOf(x__2363__auto____14050)];
      if(or__3824__auto____14051) {
        return or__3824__auto____14051
      }else {
        var or__3824__auto____14052 = cljs.core._remove_watch["_"];
        if(or__3824__auto____14052) {
          return or__3824__auto____14052
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
    var and__3822__auto____14057 = coll;
    if(and__3822__auto____14057) {
      return coll.cljs$core$IEditableCollection$_as_transient$arity$1
    }else {
      return and__3822__auto____14057
    }
  }()) {
    return coll.cljs$core$IEditableCollection$_as_transient$arity$1(coll)
  }else {
    var x__2363__auto____14058 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____14059 = cljs.core._as_transient[goog.typeOf(x__2363__auto____14058)];
      if(or__3824__auto____14059) {
        return or__3824__auto____14059
      }else {
        var or__3824__auto____14060 = cljs.core._as_transient["_"];
        if(or__3824__auto____14060) {
          return or__3824__auto____14060
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
    var and__3822__auto____14065 = tcoll;
    if(and__3822__auto____14065) {
      return tcoll.cljs$core$ITransientCollection$_conj_BANG_$arity$2
    }else {
      return and__3822__auto____14065
    }
  }()) {
    return tcoll.cljs$core$ITransientCollection$_conj_BANG_$arity$2(tcoll, val)
  }else {
    var x__2363__auto____14066 = tcoll == null ? null : tcoll;
    return function() {
      var or__3824__auto____14067 = cljs.core._conj_BANG_[goog.typeOf(x__2363__auto____14066)];
      if(or__3824__auto____14067) {
        return or__3824__auto____14067
      }else {
        var or__3824__auto____14068 = cljs.core._conj_BANG_["_"];
        if(or__3824__auto____14068) {
          return or__3824__auto____14068
        }else {
          throw cljs.core.missing_protocol.call(null, "ITransientCollection.-conj!", tcoll);
        }
      }
    }().call(null, tcoll, val)
  }
};
cljs.core._persistent_BANG_ = function _persistent_BANG_(tcoll) {
  if(function() {
    var and__3822__auto____14073 = tcoll;
    if(and__3822__auto____14073) {
      return tcoll.cljs$core$ITransientCollection$_persistent_BANG_$arity$1
    }else {
      return and__3822__auto____14073
    }
  }()) {
    return tcoll.cljs$core$ITransientCollection$_persistent_BANG_$arity$1(tcoll)
  }else {
    var x__2363__auto____14074 = tcoll == null ? null : tcoll;
    return function() {
      var or__3824__auto____14075 = cljs.core._persistent_BANG_[goog.typeOf(x__2363__auto____14074)];
      if(or__3824__auto____14075) {
        return or__3824__auto____14075
      }else {
        var or__3824__auto____14076 = cljs.core._persistent_BANG_["_"];
        if(or__3824__auto____14076) {
          return or__3824__auto____14076
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
    var and__3822__auto____14081 = tcoll;
    if(and__3822__auto____14081) {
      return tcoll.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3
    }else {
      return and__3822__auto____14081
    }
  }()) {
    return tcoll.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3(tcoll, key, val)
  }else {
    var x__2363__auto____14082 = tcoll == null ? null : tcoll;
    return function() {
      var or__3824__auto____14083 = cljs.core._assoc_BANG_[goog.typeOf(x__2363__auto____14082)];
      if(or__3824__auto____14083) {
        return or__3824__auto____14083
      }else {
        var or__3824__auto____14084 = cljs.core._assoc_BANG_["_"];
        if(or__3824__auto____14084) {
          return or__3824__auto____14084
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
    var and__3822__auto____14089 = tcoll;
    if(and__3822__auto____14089) {
      return tcoll.cljs$core$ITransientMap$_dissoc_BANG_$arity$2
    }else {
      return and__3822__auto____14089
    }
  }()) {
    return tcoll.cljs$core$ITransientMap$_dissoc_BANG_$arity$2(tcoll, key)
  }else {
    var x__2363__auto____14090 = tcoll == null ? null : tcoll;
    return function() {
      var or__3824__auto____14091 = cljs.core._dissoc_BANG_[goog.typeOf(x__2363__auto____14090)];
      if(or__3824__auto____14091) {
        return or__3824__auto____14091
      }else {
        var or__3824__auto____14092 = cljs.core._dissoc_BANG_["_"];
        if(or__3824__auto____14092) {
          return or__3824__auto____14092
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
    var and__3822__auto____14097 = tcoll;
    if(and__3822__auto____14097) {
      return tcoll.cljs$core$ITransientVector$_assoc_n_BANG_$arity$3
    }else {
      return and__3822__auto____14097
    }
  }()) {
    return tcoll.cljs$core$ITransientVector$_assoc_n_BANG_$arity$3(tcoll, n, val)
  }else {
    var x__2363__auto____14098 = tcoll == null ? null : tcoll;
    return function() {
      var or__3824__auto____14099 = cljs.core._assoc_n_BANG_[goog.typeOf(x__2363__auto____14098)];
      if(or__3824__auto____14099) {
        return or__3824__auto____14099
      }else {
        var or__3824__auto____14100 = cljs.core._assoc_n_BANG_["_"];
        if(or__3824__auto____14100) {
          return or__3824__auto____14100
        }else {
          throw cljs.core.missing_protocol.call(null, "ITransientVector.-assoc-n!", tcoll);
        }
      }
    }().call(null, tcoll, n, val)
  }
};
cljs.core._pop_BANG_ = function _pop_BANG_(tcoll) {
  if(function() {
    var and__3822__auto____14105 = tcoll;
    if(and__3822__auto____14105) {
      return tcoll.cljs$core$ITransientVector$_pop_BANG_$arity$1
    }else {
      return and__3822__auto____14105
    }
  }()) {
    return tcoll.cljs$core$ITransientVector$_pop_BANG_$arity$1(tcoll)
  }else {
    var x__2363__auto____14106 = tcoll == null ? null : tcoll;
    return function() {
      var or__3824__auto____14107 = cljs.core._pop_BANG_[goog.typeOf(x__2363__auto____14106)];
      if(or__3824__auto____14107) {
        return or__3824__auto____14107
      }else {
        var or__3824__auto____14108 = cljs.core._pop_BANG_["_"];
        if(or__3824__auto____14108) {
          return or__3824__auto____14108
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
    var and__3822__auto____14113 = tcoll;
    if(and__3822__auto____14113) {
      return tcoll.cljs$core$ITransientSet$_disjoin_BANG_$arity$2
    }else {
      return and__3822__auto____14113
    }
  }()) {
    return tcoll.cljs$core$ITransientSet$_disjoin_BANG_$arity$2(tcoll, v)
  }else {
    var x__2363__auto____14114 = tcoll == null ? null : tcoll;
    return function() {
      var or__3824__auto____14115 = cljs.core._disjoin_BANG_[goog.typeOf(x__2363__auto____14114)];
      if(or__3824__auto____14115) {
        return or__3824__auto____14115
      }else {
        var or__3824__auto____14116 = cljs.core._disjoin_BANG_["_"];
        if(or__3824__auto____14116) {
          return or__3824__auto____14116
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
    var and__3822__auto____14121 = x;
    if(and__3822__auto____14121) {
      return x.cljs$core$IComparable$_compare$arity$2
    }else {
      return and__3822__auto____14121
    }
  }()) {
    return x.cljs$core$IComparable$_compare$arity$2(x, y)
  }else {
    var x__2363__auto____14122 = x == null ? null : x;
    return function() {
      var or__3824__auto____14123 = cljs.core._compare[goog.typeOf(x__2363__auto____14122)];
      if(or__3824__auto____14123) {
        return or__3824__auto____14123
      }else {
        var or__3824__auto____14124 = cljs.core._compare["_"];
        if(or__3824__auto____14124) {
          return or__3824__auto____14124
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
    var and__3822__auto____14129 = coll;
    if(and__3822__auto____14129) {
      return coll.cljs$core$IChunk$_drop_first$arity$1
    }else {
      return and__3822__auto____14129
    }
  }()) {
    return coll.cljs$core$IChunk$_drop_first$arity$1(coll)
  }else {
    var x__2363__auto____14130 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____14131 = cljs.core._drop_first[goog.typeOf(x__2363__auto____14130)];
      if(or__3824__auto____14131) {
        return or__3824__auto____14131
      }else {
        var or__3824__auto____14132 = cljs.core._drop_first["_"];
        if(or__3824__auto____14132) {
          return or__3824__auto____14132
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
    var and__3822__auto____14137 = coll;
    if(and__3822__auto____14137) {
      return coll.cljs$core$IChunkedSeq$_chunked_first$arity$1
    }else {
      return and__3822__auto____14137
    }
  }()) {
    return coll.cljs$core$IChunkedSeq$_chunked_first$arity$1(coll)
  }else {
    var x__2363__auto____14138 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____14139 = cljs.core._chunked_first[goog.typeOf(x__2363__auto____14138)];
      if(or__3824__auto____14139) {
        return or__3824__auto____14139
      }else {
        var or__3824__auto____14140 = cljs.core._chunked_first["_"];
        if(or__3824__auto____14140) {
          return or__3824__auto____14140
        }else {
          throw cljs.core.missing_protocol.call(null, "IChunkedSeq.-chunked-first", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core._chunked_rest = function _chunked_rest(coll) {
  if(function() {
    var and__3822__auto____14145 = coll;
    if(and__3822__auto____14145) {
      return coll.cljs$core$IChunkedSeq$_chunked_rest$arity$1
    }else {
      return and__3822__auto____14145
    }
  }()) {
    return coll.cljs$core$IChunkedSeq$_chunked_rest$arity$1(coll)
  }else {
    var x__2363__auto____14146 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____14147 = cljs.core._chunked_rest[goog.typeOf(x__2363__auto____14146)];
      if(or__3824__auto____14147) {
        return or__3824__auto____14147
      }else {
        var or__3824__auto____14148 = cljs.core._chunked_rest["_"];
        if(or__3824__auto____14148) {
          return or__3824__auto____14148
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
    var and__3822__auto____14153 = coll;
    if(and__3822__auto____14153) {
      return coll.cljs$core$IChunkedNext$_chunked_next$arity$1
    }else {
      return and__3822__auto____14153
    }
  }()) {
    return coll.cljs$core$IChunkedNext$_chunked_next$arity$1(coll)
  }else {
    var x__2363__auto____14154 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____14155 = cljs.core._chunked_next[goog.typeOf(x__2363__auto____14154)];
      if(or__3824__auto____14155) {
        return or__3824__auto____14155
      }else {
        var or__3824__auto____14156 = cljs.core._chunked_next["_"];
        if(or__3824__auto____14156) {
          return or__3824__auto____14156
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
    var or__3824__auto____14158 = x === y;
    if(or__3824__auto____14158) {
      return or__3824__auto____14158
    }else {
      return cljs.core._equiv.call(null, x, y)
    }
  };
  var _EQ___3 = function() {
    var G__14159__delegate = function(x, y, more) {
      while(true) {
        if(cljs.core.truth_(_EQ_.call(null, x, y))) {
          if(cljs.core.next.call(null, more)) {
            var G__14160 = y;
            var G__14161 = cljs.core.first.call(null, more);
            var G__14162 = cljs.core.next.call(null, more);
            x = G__14160;
            y = G__14161;
            more = G__14162;
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
    var G__14159 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__14159__delegate.call(this, x, y, more)
    };
    G__14159.cljs$lang$maxFixedArity = 2;
    G__14159.cljs$lang$applyTo = function(arglist__14163) {
      var x = cljs.core.first(arglist__14163);
      var y = cljs.core.first(cljs.core.next(arglist__14163));
      var more = cljs.core.rest(cljs.core.next(arglist__14163));
      return G__14159__delegate(x, y, more)
    };
    G__14159.cljs$lang$arity$variadic = G__14159__delegate;
    return G__14159
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
  var G__14164 = null;
  var G__14164__2 = function(o, k) {
    return null
  };
  var G__14164__3 = function(o, k, not_found) {
    return not_found
  };
  G__14164 = function(o, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__14164__2.call(this, o, k);
      case 3:
        return G__14164__3.call(this, o, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__14164
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
  var G__14165 = null;
  var G__14165__2 = function(_, f) {
    return f.call(null)
  };
  var G__14165__3 = function(_, f, start) {
    return start
  };
  G__14165 = function(_, f, start) {
    switch(arguments.length) {
      case 2:
        return G__14165__2.call(this, _, f);
      case 3:
        return G__14165__3.call(this, _, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__14165
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
  var G__14166 = null;
  var G__14166__2 = function(_, n) {
    return null
  };
  var G__14166__3 = function(_, n, not_found) {
    return not_found
  };
  G__14166 = function(_, n, not_found) {
    switch(arguments.length) {
      case 2:
        return G__14166__2.call(this, _, n);
      case 3:
        return G__14166__3.call(this, _, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__14166
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
  var and__3822__auto____14167 = cljs.core.instance_QMARK_.call(null, Date, other);
  if(and__3822__auto____14167) {
    return o.toString() === other.toString()
  }else {
    return and__3822__auto____14167
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
    var cnt__14180 = cljs.core._count.call(null, cicoll);
    if(cnt__14180 === 0) {
      return f.call(null)
    }else {
      var val__14181 = cljs.core._nth.call(null, cicoll, 0);
      var n__14182 = 1;
      while(true) {
        if(n__14182 < cnt__14180) {
          var nval__14183 = f.call(null, val__14181, cljs.core._nth.call(null, cicoll, n__14182));
          if(cljs.core.reduced_QMARK_.call(null, nval__14183)) {
            return cljs.core.deref.call(null, nval__14183)
          }else {
            var G__14192 = nval__14183;
            var G__14193 = n__14182 + 1;
            val__14181 = G__14192;
            n__14182 = G__14193;
            continue
          }
        }else {
          return val__14181
        }
        break
      }
    }
  };
  var ci_reduce__3 = function(cicoll, f, val) {
    var cnt__14184 = cljs.core._count.call(null, cicoll);
    var val__14185 = val;
    var n__14186 = 0;
    while(true) {
      if(n__14186 < cnt__14184) {
        var nval__14187 = f.call(null, val__14185, cljs.core._nth.call(null, cicoll, n__14186));
        if(cljs.core.reduced_QMARK_.call(null, nval__14187)) {
          return cljs.core.deref.call(null, nval__14187)
        }else {
          var G__14194 = nval__14187;
          var G__14195 = n__14186 + 1;
          val__14185 = G__14194;
          n__14186 = G__14195;
          continue
        }
      }else {
        return val__14185
      }
      break
    }
  };
  var ci_reduce__4 = function(cicoll, f, val, idx) {
    var cnt__14188 = cljs.core._count.call(null, cicoll);
    var val__14189 = val;
    var n__14190 = idx;
    while(true) {
      if(n__14190 < cnt__14188) {
        var nval__14191 = f.call(null, val__14189, cljs.core._nth.call(null, cicoll, n__14190));
        if(cljs.core.reduced_QMARK_.call(null, nval__14191)) {
          return cljs.core.deref.call(null, nval__14191)
        }else {
          var G__14196 = nval__14191;
          var G__14197 = n__14190 + 1;
          val__14189 = G__14196;
          n__14190 = G__14197;
          continue
        }
      }else {
        return val__14189
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
    var cnt__14210 = arr.length;
    if(arr.length === 0) {
      return f.call(null)
    }else {
      var val__14211 = arr[0];
      var n__14212 = 1;
      while(true) {
        if(n__14212 < cnt__14210) {
          var nval__14213 = f.call(null, val__14211, arr[n__14212]);
          if(cljs.core.reduced_QMARK_.call(null, nval__14213)) {
            return cljs.core.deref.call(null, nval__14213)
          }else {
            var G__14222 = nval__14213;
            var G__14223 = n__14212 + 1;
            val__14211 = G__14222;
            n__14212 = G__14223;
            continue
          }
        }else {
          return val__14211
        }
        break
      }
    }
  };
  var array_reduce__3 = function(arr, f, val) {
    var cnt__14214 = arr.length;
    var val__14215 = val;
    var n__14216 = 0;
    while(true) {
      if(n__14216 < cnt__14214) {
        var nval__14217 = f.call(null, val__14215, arr[n__14216]);
        if(cljs.core.reduced_QMARK_.call(null, nval__14217)) {
          return cljs.core.deref.call(null, nval__14217)
        }else {
          var G__14224 = nval__14217;
          var G__14225 = n__14216 + 1;
          val__14215 = G__14224;
          n__14216 = G__14225;
          continue
        }
      }else {
        return val__14215
      }
      break
    }
  };
  var array_reduce__4 = function(arr, f, val, idx) {
    var cnt__14218 = arr.length;
    var val__14219 = val;
    var n__14220 = idx;
    while(true) {
      if(n__14220 < cnt__14218) {
        var nval__14221 = f.call(null, val__14219, arr[n__14220]);
        if(cljs.core.reduced_QMARK_.call(null, nval__14221)) {
          return cljs.core.deref.call(null, nval__14221)
        }else {
          var G__14226 = nval__14221;
          var G__14227 = n__14220 + 1;
          val__14219 = G__14226;
          n__14220 = G__14227;
          continue
        }
      }else {
        return val__14219
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
  var this__14228 = this;
  return cljs.core.hash_coll.call(null, coll)
};
cljs.core.IndexedSeq.prototype.cljs$core$INext$_next$arity$1 = function(_) {
  var this__14229 = this;
  if(this__14229.i + 1 < this__14229.a.length) {
    return new cljs.core.IndexedSeq(this__14229.a, this__14229.i + 1)
  }else {
    return null
  }
};
cljs.core.IndexedSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__14230 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.IndexedSeq.prototype.cljs$core$IReversible$_rseq$arity$1 = function(coll) {
  var this__14231 = this;
  var c__14232 = coll.cljs$core$ICounted$_count$arity$1(coll);
  if(c__14232 > 0) {
    return new cljs.core.RSeq(coll, c__14232 - 1, null)
  }else {
    return cljs.core.List.EMPTY
  }
};
cljs.core.IndexedSeq.prototype.toString = function() {
  var this__14233 = this;
  var this__14234 = this;
  return cljs.core.pr_str.call(null, this__14234)
};
cljs.core.IndexedSeq.prototype.cljs$core$IReduce$_reduce$arity$2 = function(coll, f) {
  var this__14235 = this;
  if(cljs.core.counted_QMARK_.call(null, this__14235.a)) {
    return cljs.core.ci_reduce.call(null, this__14235.a, f, this__14235.a[this__14235.i], this__14235.i + 1)
  }else {
    return cljs.core.ci_reduce.call(null, coll, f, this__14235.a[this__14235.i], 0)
  }
};
cljs.core.IndexedSeq.prototype.cljs$core$IReduce$_reduce$arity$3 = function(coll, f, start) {
  var this__14236 = this;
  if(cljs.core.counted_QMARK_.call(null, this__14236.a)) {
    return cljs.core.ci_reduce.call(null, this__14236.a, f, start, this__14236.i)
  }else {
    return cljs.core.ci_reduce.call(null, coll, f, start, 0)
  }
};
cljs.core.IndexedSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(this$) {
  var this__14237 = this;
  return this$
};
cljs.core.IndexedSeq.prototype.cljs$core$ICounted$_count$arity$1 = function(_) {
  var this__14238 = this;
  return this__14238.a.length - this__14238.i
};
cljs.core.IndexedSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(_) {
  var this__14239 = this;
  return this__14239.a[this__14239.i]
};
cljs.core.IndexedSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(_) {
  var this__14240 = this;
  if(this__14240.i + 1 < this__14240.a.length) {
    return new cljs.core.IndexedSeq(this__14240.a, this__14240.i + 1)
  }else {
    return cljs.core.list.call(null)
  }
};
cljs.core.IndexedSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__14241 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.IndexedSeq.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, n) {
  var this__14242 = this;
  var i__14243 = n + this__14242.i;
  if(i__14243 < this__14242.a.length) {
    return this__14242.a[i__14243]
  }else {
    return null
  }
};
cljs.core.IndexedSeq.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, n, not_found) {
  var this__14244 = this;
  var i__14245 = n + this__14244.i;
  if(i__14245 < this__14244.a.length) {
    return this__14244.a[i__14245]
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
  var G__14246 = null;
  var G__14246__2 = function(array, f) {
    return cljs.core.ci_reduce.call(null, array, f)
  };
  var G__14246__3 = function(array, f, start) {
    return cljs.core.ci_reduce.call(null, array, f, start)
  };
  G__14246 = function(array, f, start) {
    switch(arguments.length) {
      case 2:
        return G__14246__2.call(this, array, f);
      case 3:
        return G__14246__3.call(this, array, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__14246
}();
cljs.core.ILookup["array"] = true;
cljs.core._lookup["array"] = function() {
  var G__14247 = null;
  var G__14247__2 = function(array, k) {
    return array[k]
  };
  var G__14247__3 = function(array, k, not_found) {
    return cljs.core._nth.call(null, array, k, not_found)
  };
  G__14247 = function(array, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__14247__2.call(this, array, k);
      case 3:
        return G__14247__3.call(this, array, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__14247
}();
cljs.core.IIndexed["array"] = true;
cljs.core._nth["array"] = function() {
  var G__14248 = null;
  var G__14248__2 = function(array, n) {
    if(n < array.length) {
      return array[n]
    }else {
      return null
    }
  };
  var G__14248__3 = function(array, n, not_found) {
    if(n < array.length) {
      return array[n]
    }else {
      return not_found
    }
  };
  G__14248 = function(array, n, not_found) {
    switch(arguments.length) {
      case 2:
        return G__14248__2.call(this, array, n);
      case 3:
        return G__14248__3.call(this, array, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__14248
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
  var this__14249 = this;
  return cljs.core.hash_coll.call(null, coll)
};
cljs.core.RSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__14250 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.RSeq.prototype.toString = function() {
  var this__14251 = this;
  var this__14252 = this;
  return cljs.core.pr_str.call(null, this__14252)
};
cljs.core.RSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__14253 = this;
  return coll
};
cljs.core.RSeq.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__14254 = this;
  return this__14254.i + 1
};
cljs.core.RSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__14255 = this;
  return cljs.core._nth.call(null, this__14255.ci, this__14255.i)
};
cljs.core.RSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__14256 = this;
  if(this__14256.i > 0) {
    return new cljs.core.RSeq(this__14256.ci, this__14256.i - 1, null)
  }else {
    return cljs.core.List.EMPTY
  }
};
cljs.core.RSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__14257 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.RSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, new_meta) {
  var this__14258 = this;
  return new cljs.core.RSeq(this__14258.ci, this__14258.i, new_meta)
};
cljs.core.RSeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__14259 = this;
  return this__14259.meta
};
cljs.core.RSeq;
cljs.core.seq = function seq(coll) {
  if(coll == null) {
    return null
  }else {
    if(function() {
      var G__14263__14264 = coll;
      if(G__14263__14264) {
        if(function() {
          var or__3824__auto____14265 = G__14263__14264.cljs$lang$protocol_mask$partition0$ & 32;
          if(or__3824__auto____14265) {
            return or__3824__auto____14265
          }else {
            return G__14263__14264.cljs$core$ASeq$
          }
        }()) {
          return true
        }else {
          if(!G__14263__14264.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.ASeq, G__14263__14264)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.ASeq, G__14263__14264)
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
      var G__14270__14271 = coll;
      if(G__14270__14271) {
        if(function() {
          var or__3824__auto____14272 = G__14270__14271.cljs$lang$protocol_mask$partition0$ & 64;
          if(or__3824__auto____14272) {
            return or__3824__auto____14272
          }else {
            return G__14270__14271.cljs$core$ISeq$
          }
        }()) {
          return true
        }else {
          if(!G__14270__14271.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__14270__14271)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__14270__14271)
      }
    }()) {
      return cljs.core._first.call(null, coll)
    }else {
      var s__14273 = cljs.core.seq.call(null, coll);
      if(s__14273 == null) {
        return null
      }else {
        return cljs.core._first.call(null, s__14273)
      }
    }
  }
};
cljs.core.rest = function rest(coll) {
  if(!(coll == null)) {
    if(function() {
      var G__14278__14279 = coll;
      if(G__14278__14279) {
        if(function() {
          var or__3824__auto____14280 = G__14278__14279.cljs$lang$protocol_mask$partition0$ & 64;
          if(or__3824__auto____14280) {
            return or__3824__auto____14280
          }else {
            return G__14278__14279.cljs$core$ISeq$
          }
        }()) {
          return true
        }else {
          if(!G__14278__14279.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__14278__14279)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__14278__14279)
      }
    }()) {
      return cljs.core._rest.call(null, coll)
    }else {
      var s__14281 = cljs.core.seq.call(null, coll);
      if(!(s__14281 == null)) {
        return cljs.core._rest.call(null, s__14281)
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
      var G__14285__14286 = coll;
      if(G__14285__14286) {
        if(function() {
          var or__3824__auto____14287 = G__14285__14286.cljs$lang$protocol_mask$partition0$ & 128;
          if(or__3824__auto____14287) {
            return or__3824__auto____14287
          }else {
            return G__14285__14286.cljs$core$INext$
          }
        }()) {
          return true
        }else {
          if(!G__14285__14286.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.INext, G__14285__14286)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.INext, G__14285__14286)
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
    var sn__14289 = cljs.core.next.call(null, s);
    if(!(sn__14289 == null)) {
      var G__14290 = sn__14289;
      s = G__14290;
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
    var G__14291__delegate = function(coll, x, xs) {
      while(true) {
        if(cljs.core.truth_(xs)) {
          var G__14292 = conj.call(null, coll, x);
          var G__14293 = cljs.core.first.call(null, xs);
          var G__14294 = cljs.core.next.call(null, xs);
          coll = G__14292;
          x = G__14293;
          xs = G__14294;
          continue
        }else {
          return conj.call(null, coll, x)
        }
        break
      }
    };
    var G__14291 = function(coll, x, var_args) {
      var xs = null;
      if(goog.isDef(var_args)) {
        xs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__14291__delegate.call(this, coll, x, xs)
    };
    G__14291.cljs$lang$maxFixedArity = 2;
    G__14291.cljs$lang$applyTo = function(arglist__14295) {
      var coll = cljs.core.first(arglist__14295);
      var x = cljs.core.first(cljs.core.next(arglist__14295));
      var xs = cljs.core.rest(cljs.core.next(arglist__14295));
      return G__14291__delegate(coll, x, xs)
    };
    G__14291.cljs$lang$arity$variadic = G__14291__delegate;
    return G__14291
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
  var s__14298 = cljs.core.seq.call(null, coll);
  var acc__14299 = 0;
  while(true) {
    if(cljs.core.counted_QMARK_.call(null, s__14298)) {
      return acc__14299 + cljs.core._count.call(null, s__14298)
    }else {
      var G__14300 = cljs.core.next.call(null, s__14298);
      var G__14301 = acc__14299 + 1;
      s__14298 = G__14300;
      acc__14299 = G__14301;
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
        var G__14308__14309 = coll;
        if(G__14308__14309) {
          if(function() {
            var or__3824__auto____14310 = G__14308__14309.cljs$lang$protocol_mask$partition0$ & 16;
            if(or__3824__auto____14310) {
              return or__3824__auto____14310
            }else {
              return G__14308__14309.cljs$core$IIndexed$
            }
          }()) {
            return true
          }else {
            if(!G__14308__14309.cljs$lang$protocol_mask$partition0$) {
              return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__14308__14309)
            }else {
              return false
            }
          }
        }else {
          return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__14308__14309)
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
        var G__14311__14312 = coll;
        if(G__14311__14312) {
          if(function() {
            var or__3824__auto____14313 = G__14311__14312.cljs$lang$protocol_mask$partition0$ & 16;
            if(or__3824__auto____14313) {
              return or__3824__auto____14313
            }else {
              return G__14311__14312.cljs$core$IIndexed$
            }
          }()) {
            return true
          }else {
            if(!G__14311__14312.cljs$lang$protocol_mask$partition0$) {
              return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__14311__14312)
            }else {
              return false
            }
          }
        }else {
          return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__14311__14312)
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
    var G__14316__delegate = function(coll, k, v, kvs) {
      while(true) {
        var ret__14315 = assoc.call(null, coll, k, v);
        if(cljs.core.truth_(kvs)) {
          var G__14317 = ret__14315;
          var G__14318 = cljs.core.first.call(null, kvs);
          var G__14319 = cljs.core.second.call(null, kvs);
          var G__14320 = cljs.core.nnext.call(null, kvs);
          coll = G__14317;
          k = G__14318;
          v = G__14319;
          kvs = G__14320;
          continue
        }else {
          return ret__14315
        }
        break
      }
    };
    var G__14316 = function(coll, k, v, var_args) {
      var kvs = null;
      if(goog.isDef(var_args)) {
        kvs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__14316__delegate.call(this, coll, k, v, kvs)
    };
    G__14316.cljs$lang$maxFixedArity = 3;
    G__14316.cljs$lang$applyTo = function(arglist__14321) {
      var coll = cljs.core.first(arglist__14321);
      var k = cljs.core.first(cljs.core.next(arglist__14321));
      var v = cljs.core.first(cljs.core.next(cljs.core.next(arglist__14321)));
      var kvs = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__14321)));
      return G__14316__delegate(coll, k, v, kvs)
    };
    G__14316.cljs$lang$arity$variadic = G__14316__delegate;
    return G__14316
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
    var G__14324__delegate = function(coll, k, ks) {
      while(true) {
        var ret__14323 = dissoc.call(null, coll, k);
        if(cljs.core.truth_(ks)) {
          var G__14325 = ret__14323;
          var G__14326 = cljs.core.first.call(null, ks);
          var G__14327 = cljs.core.next.call(null, ks);
          coll = G__14325;
          k = G__14326;
          ks = G__14327;
          continue
        }else {
          return ret__14323
        }
        break
      }
    };
    var G__14324 = function(coll, k, var_args) {
      var ks = null;
      if(goog.isDef(var_args)) {
        ks = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__14324__delegate.call(this, coll, k, ks)
    };
    G__14324.cljs$lang$maxFixedArity = 2;
    G__14324.cljs$lang$applyTo = function(arglist__14328) {
      var coll = cljs.core.first(arglist__14328);
      var k = cljs.core.first(cljs.core.next(arglist__14328));
      var ks = cljs.core.rest(cljs.core.next(arglist__14328));
      return G__14324__delegate(coll, k, ks)
    };
    G__14324.cljs$lang$arity$variadic = G__14324__delegate;
    return G__14324
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
    var G__14332__14333 = o;
    if(G__14332__14333) {
      if(function() {
        var or__3824__auto____14334 = G__14332__14333.cljs$lang$protocol_mask$partition0$ & 131072;
        if(or__3824__auto____14334) {
          return or__3824__auto____14334
        }else {
          return G__14332__14333.cljs$core$IMeta$
        }
      }()) {
        return true
      }else {
        if(!G__14332__14333.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.IMeta, G__14332__14333)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.IMeta, G__14332__14333)
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
    var G__14337__delegate = function(coll, k, ks) {
      while(true) {
        var ret__14336 = disj.call(null, coll, k);
        if(cljs.core.truth_(ks)) {
          var G__14338 = ret__14336;
          var G__14339 = cljs.core.first.call(null, ks);
          var G__14340 = cljs.core.next.call(null, ks);
          coll = G__14338;
          k = G__14339;
          ks = G__14340;
          continue
        }else {
          return ret__14336
        }
        break
      }
    };
    var G__14337 = function(coll, k, var_args) {
      var ks = null;
      if(goog.isDef(var_args)) {
        ks = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__14337__delegate.call(this, coll, k, ks)
    };
    G__14337.cljs$lang$maxFixedArity = 2;
    G__14337.cljs$lang$applyTo = function(arglist__14341) {
      var coll = cljs.core.first(arglist__14341);
      var k = cljs.core.first(cljs.core.next(arglist__14341));
      var ks = cljs.core.rest(cljs.core.next(arglist__14341));
      return G__14337__delegate(coll, k, ks)
    };
    G__14337.cljs$lang$arity$variadic = G__14337__delegate;
    return G__14337
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
  var h__14343 = goog.string.hashCode(k);
  cljs.core.string_hash_cache[k] = h__14343;
  cljs.core.string_hash_cache_count = cljs.core.string_hash_cache_count + 1;
  return h__14343
};
cljs.core.check_string_hash_cache = function check_string_hash_cache(k) {
  if(cljs.core.string_hash_cache_count > 255) {
    cljs.core.string_hash_cache = {};
    cljs.core.string_hash_cache_count = 0
  }else {
  }
  var h__14345 = cljs.core.string_hash_cache[k];
  if(!(h__14345 == null)) {
    return h__14345
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
      var and__3822__auto____14347 = goog.isString(o);
      if(and__3822__auto____14347) {
        return check_cache
      }else {
        return and__3822__auto____14347
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
    var G__14351__14352 = x;
    if(G__14351__14352) {
      if(function() {
        var or__3824__auto____14353 = G__14351__14352.cljs$lang$protocol_mask$partition0$ & 8;
        if(or__3824__auto____14353) {
          return or__3824__auto____14353
        }else {
          return G__14351__14352.cljs$core$ICollection$
        }
      }()) {
        return true
      }else {
        if(!G__14351__14352.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.ICollection, G__14351__14352)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.ICollection, G__14351__14352)
    }
  }
};
cljs.core.set_QMARK_ = function set_QMARK_(x) {
  if(x == null) {
    return false
  }else {
    var G__14357__14358 = x;
    if(G__14357__14358) {
      if(function() {
        var or__3824__auto____14359 = G__14357__14358.cljs$lang$protocol_mask$partition0$ & 4096;
        if(or__3824__auto____14359) {
          return or__3824__auto____14359
        }else {
          return G__14357__14358.cljs$core$ISet$
        }
      }()) {
        return true
      }else {
        if(!G__14357__14358.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.ISet, G__14357__14358)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.ISet, G__14357__14358)
    }
  }
};
cljs.core.associative_QMARK_ = function associative_QMARK_(x) {
  var G__14363__14364 = x;
  if(G__14363__14364) {
    if(function() {
      var or__3824__auto____14365 = G__14363__14364.cljs$lang$protocol_mask$partition0$ & 512;
      if(or__3824__auto____14365) {
        return or__3824__auto____14365
      }else {
        return G__14363__14364.cljs$core$IAssociative$
      }
    }()) {
      return true
    }else {
      if(!G__14363__14364.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IAssociative, G__14363__14364)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IAssociative, G__14363__14364)
  }
};
cljs.core.sequential_QMARK_ = function sequential_QMARK_(x) {
  var G__14369__14370 = x;
  if(G__14369__14370) {
    if(function() {
      var or__3824__auto____14371 = G__14369__14370.cljs$lang$protocol_mask$partition0$ & 16777216;
      if(or__3824__auto____14371) {
        return or__3824__auto____14371
      }else {
        return G__14369__14370.cljs$core$ISequential$
      }
    }()) {
      return true
    }else {
      if(!G__14369__14370.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.ISequential, G__14369__14370)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.ISequential, G__14369__14370)
  }
};
cljs.core.counted_QMARK_ = function counted_QMARK_(x) {
  var G__14375__14376 = x;
  if(G__14375__14376) {
    if(function() {
      var or__3824__auto____14377 = G__14375__14376.cljs$lang$protocol_mask$partition0$ & 2;
      if(or__3824__auto____14377) {
        return or__3824__auto____14377
      }else {
        return G__14375__14376.cljs$core$ICounted$
      }
    }()) {
      return true
    }else {
      if(!G__14375__14376.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.ICounted, G__14375__14376)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.ICounted, G__14375__14376)
  }
};
cljs.core.indexed_QMARK_ = function indexed_QMARK_(x) {
  var G__14381__14382 = x;
  if(G__14381__14382) {
    if(function() {
      var or__3824__auto____14383 = G__14381__14382.cljs$lang$protocol_mask$partition0$ & 16;
      if(or__3824__auto____14383) {
        return or__3824__auto____14383
      }else {
        return G__14381__14382.cljs$core$IIndexed$
      }
    }()) {
      return true
    }else {
      if(!G__14381__14382.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__14381__14382)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__14381__14382)
  }
};
cljs.core.reduceable_QMARK_ = function reduceable_QMARK_(x) {
  var G__14387__14388 = x;
  if(G__14387__14388) {
    if(function() {
      var or__3824__auto____14389 = G__14387__14388.cljs$lang$protocol_mask$partition0$ & 524288;
      if(or__3824__auto____14389) {
        return or__3824__auto____14389
      }else {
        return G__14387__14388.cljs$core$IReduce$
      }
    }()) {
      return true
    }else {
      if(!G__14387__14388.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__14387__14388)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__14387__14388)
  }
};
cljs.core.map_QMARK_ = function map_QMARK_(x) {
  if(x == null) {
    return false
  }else {
    var G__14393__14394 = x;
    if(G__14393__14394) {
      if(function() {
        var or__3824__auto____14395 = G__14393__14394.cljs$lang$protocol_mask$partition0$ & 1024;
        if(or__3824__auto____14395) {
          return or__3824__auto____14395
        }else {
          return G__14393__14394.cljs$core$IMap$
        }
      }()) {
        return true
      }else {
        if(!G__14393__14394.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.IMap, G__14393__14394)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.IMap, G__14393__14394)
    }
  }
};
cljs.core.vector_QMARK_ = function vector_QMARK_(x) {
  var G__14399__14400 = x;
  if(G__14399__14400) {
    if(function() {
      var or__3824__auto____14401 = G__14399__14400.cljs$lang$protocol_mask$partition0$ & 16384;
      if(or__3824__auto____14401) {
        return or__3824__auto____14401
      }else {
        return G__14399__14400.cljs$core$IVector$
      }
    }()) {
      return true
    }else {
      if(!G__14399__14400.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IVector, G__14399__14400)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IVector, G__14399__14400)
  }
};
cljs.core.chunked_seq_QMARK_ = function chunked_seq_QMARK_(x) {
  var G__14405__14406 = x;
  if(G__14405__14406) {
    if(cljs.core.truth_(function() {
      var or__3824__auto____14407 = null;
      if(cljs.core.truth_(or__3824__auto____14407)) {
        return or__3824__auto____14407
      }else {
        return G__14405__14406.cljs$core$IChunkedSeq$
      }
    }())) {
      return true
    }else {
      if(!G__14405__14406.cljs$lang$protocol_mask$partition$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IChunkedSeq, G__14405__14406)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IChunkedSeq, G__14405__14406)
  }
};
cljs.core.js_obj = function() {
  var js_obj = null;
  var js_obj__0 = function() {
    return{}
  };
  var js_obj__1 = function() {
    var G__14408__delegate = function(keyvals) {
      return cljs.core.apply.call(null, goog.object.create, keyvals)
    };
    var G__14408 = function(var_args) {
      var keyvals = null;
      if(goog.isDef(var_args)) {
        keyvals = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
      }
      return G__14408__delegate.call(this, keyvals)
    };
    G__14408.cljs$lang$maxFixedArity = 0;
    G__14408.cljs$lang$applyTo = function(arglist__14409) {
      var keyvals = cljs.core.seq(arglist__14409);
      return G__14408__delegate(keyvals)
    };
    G__14408.cljs$lang$arity$variadic = G__14408__delegate;
    return G__14408
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
  var keys__14411 = [];
  goog.object.forEach(obj, function(val, key, obj) {
    return keys__14411.push(key)
  });
  return keys__14411
};
cljs.core.js_delete = function js_delete(obj, key) {
  return delete obj[key]
};
cljs.core.array_copy = function array_copy(from, i, to, j, len) {
  var i__14415 = i;
  var j__14416 = j;
  var len__14417 = len;
  while(true) {
    if(len__14417 === 0) {
      return to
    }else {
      to[j__14416] = from[i__14415];
      var G__14418 = i__14415 + 1;
      var G__14419 = j__14416 + 1;
      var G__14420 = len__14417 - 1;
      i__14415 = G__14418;
      j__14416 = G__14419;
      len__14417 = G__14420;
      continue
    }
    break
  }
};
cljs.core.array_copy_downward = function array_copy_downward(from, i, to, j, len) {
  var i__14424 = i + (len - 1);
  var j__14425 = j + (len - 1);
  var len__14426 = len;
  while(true) {
    if(len__14426 === 0) {
      return to
    }else {
      to[j__14425] = from[i__14424];
      var G__14427 = i__14424 - 1;
      var G__14428 = j__14425 - 1;
      var G__14429 = len__14426 - 1;
      i__14424 = G__14427;
      j__14425 = G__14428;
      len__14426 = G__14429;
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
    var G__14433__14434 = s;
    if(G__14433__14434) {
      if(function() {
        var or__3824__auto____14435 = G__14433__14434.cljs$lang$protocol_mask$partition0$ & 64;
        if(or__3824__auto____14435) {
          return or__3824__auto____14435
        }else {
          return G__14433__14434.cljs$core$ISeq$
        }
      }()) {
        return true
      }else {
        if(!G__14433__14434.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__14433__14434)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__14433__14434)
    }
  }
};
cljs.core.seqable_QMARK_ = function seqable_QMARK_(s) {
  var G__14439__14440 = s;
  if(G__14439__14440) {
    if(function() {
      var or__3824__auto____14441 = G__14439__14440.cljs$lang$protocol_mask$partition0$ & 8388608;
      if(or__3824__auto____14441) {
        return or__3824__auto____14441
      }else {
        return G__14439__14440.cljs$core$ISeqable$
      }
    }()) {
      return true
    }else {
      if(!G__14439__14440.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.ISeqable, G__14439__14440)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.ISeqable, G__14439__14440)
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
  var and__3822__auto____14444 = goog.isString(x);
  if(and__3822__auto____14444) {
    return!function() {
      var or__3824__auto____14445 = x.charAt(0) === "\ufdd0";
      if(or__3824__auto____14445) {
        return or__3824__auto____14445
      }else {
        return x.charAt(0) === "\ufdd1"
      }
    }()
  }else {
    return and__3822__auto____14444
  }
};
cljs.core.keyword_QMARK_ = function keyword_QMARK_(x) {
  var and__3822__auto____14447 = goog.isString(x);
  if(and__3822__auto____14447) {
    return x.charAt(0) === "\ufdd0"
  }else {
    return and__3822__auto____14447
  }
};
cljs.core.symbol_QMARK_ = function symbol_QMARK_(x) {
  var and__3822__auto____14449 = goog.isString(x);
  if(and__3822__auto____14449) {
    return x.charAt(0) === "\ufdd1"
  }else {
    return and__3822__auto____14449
  }
};
cljs.core.number_QMARK_ = function number_QMARK_(n) {
  return goog.isNumber(n)
};
cljs.core.fn_QMARK_ = function fn_QMARK_(f) {
  return goog.isFunction(f)
};
cljs.core.ifn_QMARK_ = function ifn_QMARK_(f) {
  var or__3824__auto____14454 = cljs.core.fn_QMARK_.call(null, f);
  if(or__3824__auto____14454) {
    return or__3824__auto____14454
  }else {
    var G__14455__14456 = f;
    if(G__14455__14456) {
      if(function() {
        var or__3824__auto____14457 = G__14455__14456.cljs$lang$protocol_mask$partition0$ & 1;
        if(or__3824__auto____14457) {
          return or__3824__auto____14457
        }else {
          return G__14455__14456.cljs$core$IFn$
        }
      }()) {
        return true
      }else {
        if(!G__14455__14456.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.IFn, G__14455__14456)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.IFn, G__14455__14456)
    }
  }
};
cljs.core.integer_QMARK_ = function integer_QMARK_(n) {
  var and__3822__auto____14459 = cljs.core.number_QMARK_.call(null, n);
  if(and__3822__auto____14459) {
    return n == n.toFixed()
  }else {
    return and__3822__auto____14459
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
    var and__3822__auto____14462 = coll;
    if(cljs.core.truth_(and__3822__auto____14462)) {
      var and__3822__auto____14463 = cljs.core.associative_QMARK_.call(null, coll);
      if(and__3822__auto____14463) {
        return cljs.core.contains_QMARK_.call(null, coll, k)
      }else {
        return and__3822__auto____14463
      }
    }else {
      return and__3822__auto____14462
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
    var G__14472__delegate = function(x, y, more) {
      if(!cljs.core._EQ_.call(null, x, y)) {
        var s__14468 = cljs.core.PersistentHashSet.fromArray([y, x]);
        var xs__14469 = more;
        while(true) {
          var x__14470 = cljs.core.first.call(null, xs__14469);
          var etc__14471 = cljs.core.next.call(null, xs__14469);
          if(cljs.core.truth_(xs__14469)) {
            if(cljs.core.contains_QMARK_.call(null, s__14468, x__14470)) {
              return false
            }else {
              var G__14473 = cljs.core.conj.call(null, s__14468, x__14470);
              var G__14474 = etc__14471;
              s__14468 = G__14473;
              xs__14469 = G__14474;
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
    var G__14472 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__14472__delegate.call(this, x, y, more)
    };
    G__14472.cljs$lang$maxFixedArity = 2;
    G__14472.cljs$lang$applyTo = function(arglist__14475) {
      var x = cljs.core.first(arglist__14475);
      var y = cljs.core.first(cljs.core.next(arglist__14475));
      var more = cljs.core.rest(cljs.core.next(arglist__14475));
      return G__14472__delegate(x, y, more)
    };
    G__14472.cljs$lang$arity$variadic = G__14472__delegate;
    return G__14472
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
            var G__14479__14480 = x;
            if(G__14479__14480) {
              if(cljs.core.truth_(function() {
                var or__3824__auto____14481 = null;
                if(cljs.core.truth_(or__3824__auto____14481)) {
                  return or__3824__auto____14481
                }else {
                  return G__14479__14480.cljs$core$IComparable$
                }
              }())) {
                return true
              }else {
                if(!G__14479__14480.cljs$lang$protocol_mask$partition$) {
                  return cljs.core.type_satisfies_.call(null, cljs.core.IComparable, G__14479__14480)
                }else {
                  return false
                }
              }
            }else {
              return cljs.core.type_satisfies_.call(null, cljs.core.IComparable, G__14479__14480)
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
    var xl__14486 = cljs.core.count.call(null, xs);
    var yl__14487 = cljs.core.count.call(null, ys);
    if(xl__14486 < yl__14487) {
      return-1
    }else {
      if(xl__14486 > yl__14487) {
        return 1
      }else {
        if("\ufdd0'else") {
          return compare_indexed.call(null, xs, ys, xl__14486, 0)
        }else {
          return null
        }
      }
    }
  };
  var compare_indexed__4 = function(xs, ys, len, n) {
    while(true) {
      var d__14488 = cljs.core.compare.call(null, cljs.core.nth.call(null, xs, n), cljs.core.nth.call(null, ys, n));
      if(function() {
        var and__3822__auto____14489 = d__14488 === 0;
        if(and__3822__auto____14489) {
          return n + 1 < len
        }else {
          return and__3822__auto____14489
        }
      }()) {
        var G__14490 = xs;
        var G__14491 = ys;
        var G__14492 = len;
        var G__14493 = n + 1;
        xs = G__14490;
        ys = G__14491;
        len = G__14492;
        n = G__14493;
        continue
      }else {
        return d__14488
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
      var r__14495 = f.call(null, x, y);
      if(cljs.core.number_QMARK_.call(null, r__14495)) {
        return r__14495
      }else {
        if(cljs.core.truth_(r__14495)) {
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
      var a__14497 = cljs.core.to_array.call(null, coll);
      goog.array.stableSort(a__14497, cljs.core.fn__GT_comparator.call(null, comp));
      return cljs.core.seq.call(null, a__14497)
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
    var temp__3971__auto____14503 = cljs.core.seq.call(null, coll);
    if(temp__3971__auto____14503) {
      var s__14504 = temp__3971__auto____14503;
      return cljs.core.reduce.call(null, f, cljs.core.first.call(null, s__14504), cljs.core.next.call(null, s__14504))
    }else {
      return f.call(null)
    }
  };
  var seq_reduce__3 = function(f, val, coll) {
    var val__14505 = val;
    var coll__14506 = cljs.core.seq.call(null, coll);
    while(true) {
      if(coll__14506) {
        var nval__14507 = f.call(null, val__14505, cljs.core.first.call(null, coll__14506));
        if(cljs.core.reduced_QMARK_.call(null, nval__14507)) {
          return cljs.core.deref.call(null, nval__14507)
        }else {
          var G__14508 = nval__14507;
          var G__14509 = cljs.core.next.call(null, coll__14506);
          val__14505 = G__14508;
          coll__14506 = G__14509;
          continue
        }
      }else {
        return val__14505
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
  var a__14511 = cljs.core.to_array.call(null, coll);
  goog.array.shuffle(a__14511);
  return cljs.core.vec.call(null, a__14511)
};
cljs.core.reduce = function() {
  var reduce = null;
  var reduce__2 = function(f, coll) {
    if(function() {
      var G__14518__14519 = coll;
      if(G__14518__14519) {
        if(function() {
          var or__3824__auto____14520 = G__14518__14519.cljs$lang$protocol_mask$partition0$ & 524288;
          if(or__3824__auto____14520) {
            return or__3824__auto____14520
          }else {
            return G__14518__14519.cljs$core$IReduce$
          }
        }()) {
          return true
        }else {
          if(!G__14518__14519.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__14518__14519)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__14518__14519)
      }
    }()) {
      return cljs.core._reduce.call(null, coll, f)
    }else {
      return cljs.core.seq_reduce.call(null, f, coll)
    }
  };
  var reduce__3 = function(f, val, coll) {
    if(function() {
      var G__14521__14522 = coll;
      if(G__14521__14522) {
        if(function() {
          var or__3824__auto____14523 = G__14521__14522.cljs$lang$protocol_mask$partition0$ & 524288;
          if(or__3824__auto____14523) {
            return or__3824__auto____14523
          }else {
            return G__14521__14522.cljs$core$IReduce$
          }
        }()) {
          return true
        }else {
          if(!G__14521__14522.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__14521__14522)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__14521__14522)
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
  var this__14524 = this;
  return this__14524.val
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
    var G__14525__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, _PLUS_, x + y, more)
    };
    var G__14525 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__14525__delegate.call(this, x, y, more)
    };
    G__14525.cljs$lang$maxFixedArity = 2;
    G__14525.cljs$lang$applyTo = function(arglist__14526) {
      var x = cljs.core.first(arglist__14526);
      var y = cljs.core.first(cljs.core.next(arglist__14526));
      var more = cljs.core.rest(cljs.core.next(arglist__14526));
      return G__14525__delegate(x, y, more)
    };
    G__14525.cljs$lang$arity$variadic = G__14525__delegate;
    return G__14525
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
    var G__14527__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, _, x - y, more)
    };
    var G__14527 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__14527__delegate.call(this, x, y, more)
    };
    G__14527.cljs$lang$maxFixedArity = 2;
    G__14527.cljs$lang$applyTo = function(arglist__14528) {
      var x = cljs.core.first(arglist__14528);
      var y = cljs.core.first(cljs.core.next(arglist__14528));
      var more = cljs.core.rest(cljs.core.next(arglist__14528));
      return G__14527__delegate(x, y, more)
    };
    G__14527.cljs$lang$arity$variadic = G__14527__delegate;
    return G__14527
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
    var G__14529__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, _STAR_, x * y, more)
    };
    var G__14529 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__14529__delegate.call(this, x, y, more)
    };
    G__14529.cljs$lang$maxFixedArity = 2;
    G__14529.cljs$lang$applyTo = function(arglist__14530) {
      var x = cljs.core.first(arglist__14530);
      var y = cljs.core.first(cljs.core.next(arglist__14530));
      var more = cljs.core.rest(cljs.core.next(arglist__14530));
      return G__14529__delegate(x, y, more)
    };
    G__14529.cljs$lang$arity$variadic = G__14529__delegate;
    return G__14529
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
    var G__14531__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, _SLASH_, _SLASH_.call(null, x, y), more)
    };
    var G__14531 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__14531__delegate.call(this, x, y, more)
    };
    G__14531.cljs$lang$maxFixedArity = 2;
    G__14531.cljs$lang$applyTo = function(arglist__14532) {
      var x = cljs.core.first(arglist__14532);
      var y = cljs.core.first(cljs.core.next(arglist__14532));
      var more = cljs.core.rest(cljs.core.next(arglist__14532));
      return G__14531__delegate(x, y, more)
    };
    G__14531.cljs$lang$arity$variadic = G__14531__delegate;
    return G__14531
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
    var G__14533__delegate = function(x, y, more) {
      while(true) {
        if(x < y) {
          if(cljs.core.next.call(null, more)) {
            var G__14534 = y;
            var G__14535 = cljs.core.first.call(null, more);
            var G__14536 = cljs.core.next.call(null, more);
            x = G__14534;
            y = G__14535;
            more = G__14536;
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
    var G__14533 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__14533__delegate.call(this, x, y, more)
    };
    G__14533.cljs$lang$maxFixedArity = 2;
    G__14533.cljs$lang$applyTo = function(arglist__14537) {
      var x = cljs.core.first(arglist__14537);
      var y = cljs.core.first(cljs.core.next(arglist__14537));
      var more = cljs.core.rest(cljs.core.next(arglist__14537));
      return G__14533__delegate(x, y, more)
    };
    G__14533.cljs$lang$arity$variadic = G__14533__delegate;
    return G__14533
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
    var G__14538__delegate = function(x, y, more) {
      while(true) {
        if(x <= y) {
          if(cljs.core.next.call(null, more)) {
            var G__14539 = y;
            var G__14540 = cljs.core.first.call(null, more);
            var G__14541 = cljs.core.next.call(null, more);
            x = G__14539;
            y = G__14540;
            more = G__14541;
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
    var G__14538 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__14538__delegate.call(this, x, y, more)
    };
    G__14538.cljs$lang$maxFixedArity = 2;
    G__14538.cljs$lang$applyTo = function(arglist__14542) {
      var x = cljs.core.first(arglist__14542);
      var y = cljs.core.first(cljs.core.next(arglist__14542));
      var more = cljs.core.rest(cljs.core.next(arglist__14542));
      return G__14538__delegate(x, y, more)
    };
    G__14538.cljs$lang$arity$variadic = G__14538__delegate;
    return G__14538
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
    var G__14543__delegate = function(x, y, more) {
      while(true) {
        if(x > y) {
          if(cljs.core.next.call(null, more)) {
            var G__14544 = y;
            var G__14545 = cljs.core.first.call(null, more);
            var G__14546 = cljs.core.next.call(null, more);
            x = G__14544;
            y = G__14545;
            more = G__14546;
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
    var G__14543 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__14543__delegate.call(this, x, y, more)
    };
    G__14543.cljs$lang$maxFixedArity = 2;
    G__14543.cljs$lang$applyTo = function(arglist__14547) {
      var x = cljs.core.first(arglist__14547);
      var y = cljs.core.first(cljs.core.next(arglist__14547));
      var more = cljs.core.rest(cljs.core.next(arglist__14547));
      return G__14543__delegate(x, y, more)
    };
    G__14543.cljs$lang$arity$variadic = G__14543__delegate;
    return G__14543
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
    var G__14548__delegate = function(x, y, more) {
      while(true) {
        if(x >= y) {
          if(cljs.core.next.call(null, more)) {
            var G__14549 = y;
            var G__14550 = cljs.core.first.call(null, more);
            var G__14551 = cljs.core.next.call(null, more);
            x = G__14549;
            y = G__14550;
            more = G__14551;
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
    var G__14548 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__14548__delegate.call(this, x, y, more)
    };
    G__14548.cljs$lang$maxFixedArity = 2;
    G__14548.cljs$lang$applyTo = function(arglist__14552) {
      var x = cljs.core.first(arglist__14552);
      var y = cljs.core.first(cljs.core.next(arglist__14552));
      var more = cljs.core.rest(cljs.core.next(arglist__14552));
      return G__14548__delegate(x, y, more)
    };
    G__14548.cljs$lang$arity$variadic = G__14548__delegate;
    return G__14548
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
    var G__14553__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, max, x > y ? x : y, more)
    };
    var G__14553 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__14553__delegate.call(this, x, y, more)
    };
    G__14553.cljs$lang$maxFixedArity = 2;
    G__14553.cljs$lang$applyTo = function(arglist__14554) {
      var x = cljs.core.first(arglist__14554);
      var y = cljs.core.first(cljs.core.next(arglist__14554));
      var more = cljs.core.rest(cljs.core.next(arglist__14554));
      return G__14553__delegate(x, y, more)
    };
    G__14553.cljs$lang$arity$variadic = G__14553__delegate;
    return G__14553
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
    var G__14555__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, min, x < y ? x : y, more)
    };
    var G__14555 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__14555__delegate.call(this, x, y, more)
    };
    G__14555.cljs$lang$maxFixedArity = 2;
    G__14555.cljs$lang$applyTo = function(arglist__14556) {
      var x = cljs.core.first(arglist__14556);
      var y = cljs.core.first(cljs.core.next(arglist__14556));
      var more = cljs.core.rest(cljs.core.next(arglist__14556));
      return G__14555__delegate(x, y, more)
    };
    G__14555.cljs$lang$arity$variadic = G__14555__delegate;
    return G__14555
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
  var rem__14558 = n % d;
  return cljs.core.fix.call(null, (n - rem__14558) / d)
};
cljs.core.rem = function rem(n, d) {
  var q__14560 = cljs.core.quot.call(null, n, d);
  return n - d * q__14560
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
  var v__14563 = v - (v >> 1 & 1431655765);
  var v__14564 = (v__14563 & 858993459) + (v__14563 >> 2 & 858993459);
  return(v__14564 + (v__14564 >> 4) & 252645135) * 16843009 >> 24
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
    var G__14565__delegate = function(x, y, more) {
      while(true) {
        if(cljs.core.truth_(_EQ__EQ_.call(null, x, y))) {
          if(cljs.core.next.call(null, more)) {
            var G__14566 = y;
            var G__14567 = cljs.core.first.call(null, more);
            var G__14568 = cljs.core.next.call(null, more);
            x = G__14566;
            y = G__14567;
            more = G__14568;
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
    var G__14565 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__14565__delegate.call(this, x, y, more)
    };
    G__14565.cljs$lang$maxFixedArity = 2;
    G__14565.cljs$lang$applyTo = function(arglist__14569) {
      var x = cljs.core.first(arglist__14569);
      var y = cljs.core.first(cljs.core.next(arglist__14569));
      var more = cljs.core.rest(cljs.core.next(arglist__14569));
      return G__14565__delegate(x, y, more)
    };
    G__14565.cljs$lang$arity$variadic = G__14565__delegate;
    return G__14565
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
  var n__14573 = n;
  var xs__14574 = cljs.core.seq.call(null, coll);
  while(true) {
    if(cljs.core.truth_(function() {
      var and__3822__auto____14575 = xs__14574;
      if(and__3822__auto____14575) {
        return n__14573 > 0
      }else {
        return and__3822__auto____14575
      }
    }())) {
      var G__14576 = n__14573 - 1;
      var G__14577 = cljs.core.next.call(null, xs__14574);
      n__14573 = G__14576;
      xs__14574 = G__14577;
      continue
    }else {
      return xs__14574
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
    var G__14578__delegate = function(x, ys) {
      return function(sb, more) {
        while(true) {
          if(cljs.core.truth_(more)) {
            var G__14579 = sb.append(str_STAR_.call(null, cljs.core.first.call(null, more)));
            var G__14580 = cljs.core.next.call(null, more);
            sb = G__14579;
            more = G__14580;
            continue
          }else {
            return str_STAR_.call(null, sb)
          }
          break
        }
      }.call(null, new goog.string.StringBuffer(str_STAR_.call(null, x)), ys)
    };
    var G__14578 = function(x, var_args) {
      var ys = null;
      if(goog.isDef(var_args)) {
        ys = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__14578__delegate.call(this, x, ys)
    };
    G__14578.cljs$lang$maxFixedArity = 1;
    G__14578.cljs$lang$applyTo = function(arglist__14581) {
      var x = cljs.core.first(arglist__14581);
      var ys = cljs.core.rest(arglist__14581);
      return G__14578__delegate(x, ys)
    };
    G__14578.cljs$lang$arity$variadic = G__14578__delegate;
    return G__14578
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
    var G__14582__delegate = function(x, ys) {
      return function(sb, more) {
        while(true) {
          if(cljs.core.truth_(more)) {
            var G__14583 = sb.append(str.call(null, cljs.core.first.call(null, more)));
            var G__14584 = cljs.core.next.call(null, more);
            sb = G__14583;
            more = G__14584;
            continue
          }else {
            return cljs.core.str_STAR_.call(null, sb)
          }
          break
        }
      }.call(null, new goog.string.StringBuffer(str.call(null, x)), ys)
    };
    var G__14582 = function(x, var_args) {
      var ys = null;
      if(goog.isDef(var_args)) {
        ys = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__14582__delegate.call(this, x, ys)
    };
    G__14582.cljs$lang$maxFixedArity = 1;
    G__14582.cljs$lang$applyTo = function(arglist__14585) {
      var x = cljs.core.first(arglist__14585);
      var ys = cljs.core.rest(arglist__14585);
      return G__14582__delegate(x, ys)
    };
    G__14582.cljs$lang$arity$variadic = G__14582__delegate;
    return G__14582
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
  format.cljs$lang$applyTo = function(arglist__14586) {
    var fmt = cljs.core.first(arglist__14586);
    var args = cljs.core.rest(arglist__14586);
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
    var xs__14589 = cljs.core.seq.call(null, x);
    var ys__14590 = cljs.core.seq.call(null, y);
    while(true) {
      if(xs__14589 == null) {
        return ys__14590 == null
      }else {
        if(ys__14590 == null) {
          return false
        }else {
          if(cljs.core._EQ_.call(null, cljs.core.first.call(null, xs__14589), cljs.core.first.call(null, ys__14590))) {
            var G__14591 = cljs.core.next.call(null, xs__14589);
            var G__14592 = cljs.core.next.call(null, ys__14590);
            xs__14589 = G__14591;
            ys__14590 = G__14592;
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
  return cljs.core.reduce.call(null, function(p1__14593_SHARP_, p2__14594_SHARP_) {
    return cljs.core.hash_combine.call(null, p1__14593_SHARP_, cljs.core.hash.call(null, p2__14594_SHARP_, false))
  }, cljs.core.hash.call(null, cljs.core.first.call(null, coll), false), cljs.core.next.call(null, coll))
};
cljs.core.hash_imap = function hash_imap(m) {
  var h__14598 = 0;
  var s__14599 = cljs.core.seq.call(null, m);
  while(true) {
    if(s__14599) {
      var e__14600 = cljs.core.first.call(null, s__14599);
      var G__14601 = (h__14598 + (cljs.core.hash.call(null, cljs.core.key.call(null, e__14600)) ^ cljs.core.hash.call(null, cljs.core.val.call(null, e__14600)))) % 4503599627370496;
      var G__14602 = cljs.core.next.call(null, s__14599);
      h__14598 = G__14601;
      s__14599 = G__14602;
      continue
    }else {
      return h__14598
    }
    break
  }
};
cljs.core.hash_iset = function hash_iset(s) {
  var h__14606 = 0;
  var s__14607 = cljs.core.seq.call(null, s);
  while(true) {
    if(s__14607) {
      var e__14608 = cljs.core.first.call(null, s__14607);
      var G__14609 = (h__14606 + cljs.core.hash.call(null, e__14608)) % 4503599627370496;
      var G__14610 = cljs.core.next.call(null, s__14607);
      h__14606 = G__14609;
      s__14607 = G__14610;
      continue
    }else {
      return h__14606
    }
    break
  }
};
cljs.core.extend_object_BANG_ = function extend_object_BANG_(obj, fn_map) {
  var G__14631__14632 = cljs.core.seq.call(null, fn_map);
  if(G__14631__14632) {
    var G__14634__14636 = cljs.core.first.call(null, G__14631__14632);
    var vec__14635__14637 = G__14634__14636;
    var key_name__14638 = cljs.core.nth.call(null, vec__14635__14637, 0, null);
    var f__14639 = cljs.core.nth.call(null, vec__14635__14637, 1, null);
    var G__14631__14640 = G__14631__14632;
    var G__14634__14641 = G__14634__14636;
    var G__14631__14642 = G__14631__14640;
    while(true) {
      var vec__14643__14644 = G__14634__14641;
      var key_name__14645 = cljs.core.nth.call(null, vec__14643__14644, 0, null);
      var f__14646 = cljs.core.nth.call(null, vec__14643__14644, 1, null);
      var G__14631__14647 = G__14631__14642;
      var str_name__14648 = cljs.core.name.call(null, key_name__14645);
      obj[str_name__14648] = f__14646;
      var temp__3974__auto____14649 = cljs.core.next.call(null, G__14631__14647);
      if(temp__3974__auto____14649) {
        var G__14631__14650 = temp__3974__auto____14649;
        var G__14651 = cljs.core.first.call(null, G__14631__14650);
        var G__14652 = G__14631__14650;
        G__14634__14641 = G__14651;
        G__14631__14642 = G__14652;
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
  var this__14653 = this;
  var h__2192__auto____14654 = this__14653.__hash;
  if(!(h__2192__auto____14654 == null)) {
    return h__2192__auto____14654
  }else {
    var h__2192__auto____14655 = cljs.core.hash_coll.call(null, coll);
    this__14653.__hash = h__2192__auto____14655;
    return h__2192__auto____14655
  }
};
cljs.core.List.prototype.cljs$core$INext$_next$arity$1 = function(coll) {
  var this__14656 = this;
  if(this__14656.count === 1) {
    return null
  }else {
    return this__14656.rest
  }
};
cljs.core.List.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__14657 = this;
  return new cljs.core.List(this__14657.meta, o, coll, this__14657.count + 1, null)
};
cljs.core.List.prototype.toString = function() {
  var this__14658 = this;
  var this__14659 = this;
  return cljs.core.pr_str.call(null, this__14659)
};
cljs.core.List.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__14660 = this;
  return coll
};
cljs.core.List.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__14661 = this;
  return this__14661.count
};
cljs.core.List.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__14662 = this;
  return this__14662.first
};
cljs.core.List.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__14663 = this;
  return coll.cljs$core$ISeq$_rest$arity$1(coll)
};
cljs.core.List.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__14664 = this;
  return this__14664.first
};
cljs.core.List.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__14665 = this;
  if(this__14665.count === 1) {
    return cljs.core.List.EMPTY
  }else {
    return this__14665.rest
  }
};
cljs.core.List.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__14666 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.List.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__14667 = this;
  return new cljs.core.List(meta, this__14667.first, this__14667.rest, this__14667.count, this__14667.__hash)
};
cljs.core.List.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__14668 = this;
  return this__14668.meta
};
cljs.core.List.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__14669 = this;
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
  var this__14670 = this;
  return 0
};
cljs.core.EmptyList.prototype.cljs$core$INext$_next$arity$1 = function(coll) {
  var this__14671 = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__14672 = this;
  return new cljs.core.List(this__14672.meta, o, null, 1, null)
};
cljs.core.EmptyList.prototype.toString = function() {
  var this__14673 = this;
  var this__14674 = this;
  return cljs.core.pr_str.call(null, this__14674)
};
cljs.core.EmptyList.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__14675 = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__14676 = this;
  return 0
};
cljs.core.EmptyList.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__14677 = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__14678 = this;
  throw new Error("Can't pop empty list");
};
cljs.core.EmptyList.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__14679 = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__14680 = this;
  return cljs.core.List.EMPTY
};
cljs.core.EmptyList.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__14681 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.EmptyList.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__14682 = this;
  return new cljs.core.EmptyList(meta)
};
cljs.core.EmptyList.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__14683 = this;
  return this__14683.meta
};
cljs.core.EmptyList.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__14684 = this;
  return coll
};
cljs.core.EmptyList;
cljs.core.List.EMPTY = new cljs.core.EmptyList(null);
cljs.core.reversible_QMARK_ = function reversible_QMARK_(coll) {
  var G__14688__14689 = coll;
  if(G__14688__14689) {
    if(function() {
      var or__3824__auto____14690 = G__14688__14689.cljs$lang$protocol_mask$partition0$ & 134217728;
      if(or__3824__auto____14690) {
        return or__3824__auto____14690
      }else {
        return G__14688__14689.cljs$core$IReversible$
      }
    }()) {
      return true
    }else {
      if(!G__14688__14689.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IReversible, G__14688__14689)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IReversible, G__14688__14689)
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
    var G__14691__delegate = function(x, y, z, items) {
      return cljs.core.conj.call(null, cljs.core.conj.call(null, cljs.core.conj.call(null, cljs.core.reduce.call(null, cljs.core.conj, cljs.core.List.EMPTY, cljs.core.reverse.call(null, items)), z), y), x)
    };
    var G__14691 = function(x, y, z, var_args) {
      var items = null;
      if(goog.isDef(var_args)) {
        items = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__14691__delegate.call(this, x, y, z, items)
    };
    G__14691.cljs$lang$maxFixedArity = 3;
    G__14691.cljs$lang$applyTo = function(arglist__14692) {
      var x = cljs.core.first(arglist__14692);
      var y = cljs.core.first(cljs.core.next(arglist__14692));
      var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__14692)));
      var items = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__14692)));
      return G__14691__delegate(x, y, z, items)
    };
    G__14691.cljs$lang$arity$variadic = G__14691__delegate;
    return G__14691
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
  var this__14693 = this;
  var h__2192__auto____14694 = this__14693.__hash;
  if(!(h__2192__auto____14694 == null)) {
    return h__2192__auto____14694
  }else {
    var h__2192__auto____14695 = cljs.core.hash_coll.call(null, coll);
    this__14693.__hash = h__2192__auto____14695;
    return h__2192__auto____14695
  }
};
cljs.core.Cons.prototype.cljs$core$INext$_next$arity$1 = function(coll) {
  var this__14696 = this;
  if(this__14696.rest == null) {
    return null
  }else {
    return cljs.core._seq.call(null, this__14696.rest)
  }
};
cljs.core.Cons.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__14697 = this;
  return new cljs.core.Cons(null, o, coll, this__14697.__hash)
};
cljs.core.Cons.prototype.toString = function() {
  var this__14698 = this;
  var this__14699 = this;
  return cljs.core.pr_str.call(null, this__14699)
};
cljs.core.Cons.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__14700 = this;
  return coll
};
cljs.core.Cons.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__14701 = this;
  return this__14701.first
};
cljs.core.Cons.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__14702 = this;
  if(this__14702.rest == null) {
    return cljs.core.List.EMPTY
  }else {
    return this__14702.rest
  }
};
cljs.core.Cons.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__14703 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.Cons.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__14704 = this;
  return new cljs.core.Cons(meta, this__14704.first, this__14704.rest, this__14704.__hash)
};
cljs.core.Cons.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__14705 = this;
  return this__14705.meta
};
cljs.core.Cons.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__14706 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__14706.meta)
};
cljs.core.Cons;
cljs.core.cons = function cons(x, coll) {
  if(function() {
    var or__3824__auto____14711 = coll == null;
    if(or__3824__auto____14711) {
      return or__3824__auto____14711
    }else {
      var G__14712__14713 = coll;
      if(G__14712__14713) {
        if(function() {
          var or__3824__auto____14714 = G__14712__14713.cljs$lang$protocol_mask$partition0$ & 64;
          if(or__3824__auto____14714) {
            return or__3824__auto____14714
          }else {
            return G__14712__14713.cljs$core$ISeq$
          }
        }()) {
          return true
        }else {
          if(!G__14712__14713.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__14712__14713)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__14712__14713)
      }
    }
  }()) {
    return new cljs.core.Cons(null, x, coll, null)
  }else {
    return new cljs.core.Cons(null, x, cljs.core.seq.call(null, coll), null)
  }
};
cljs.core.list_QMARK_ = function list_QMARK_(x) {
  var G__14718__14719 = x;
  if(G__14718__14719) {
    if(function() {
      var or__3824__auto____14720 = G__14718__14719.cljs$lang$protocol_mask$partition0$ & 33554432;
      if(or__3824__auto____14720) {
        return or__3824__auto____14720
      }else {
        return G__14718__14719.cljs$core$IList$
      }
    }()) {
      return true
    }else {
      if(!G__14718__14719.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IList, G__14718__14719)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IList, G__14718__14719)
  }
};
cljs.core.IReduce["string"] = true;
cljs.core._reduce["string"] = function() {
  var G__14721 = null;
  var G__14721__2 = function(string, f) {
    return cljs.core.ci_reduce.call(null, string, f)
  };
  var G__14721__3 = function(string, f, start) {
    return cljs.core.ci_reduce.call(null, string, f, start)
  };
  G__14721 = function(string, f, start) {
    switch(arguments.length) {
      case 2:
        return G__14721__2.call(this, string, f);
      case 3:
        return G__14721__3.call(this, string, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__14721
}();
cljs.core.ILookup["string"] = true;
cljs.core._lookup["string"] = function() {
  var G__14722 = null;
  var G__14722__2 = function(string, k) {
    return cljs.core._nth.call(null, string, k)
  };
  var G__14722__3 = function(string, k, not_found) {
    return cljs.core._nth.call(null, string, k, not_found)
  };
  G__14722 = function(string, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__14722__2.call(this, string, k);
      case 3:
        return G__14722__3.call(this, string, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__14722
}();
cljs.core.IIndexed["string"] = true;
cljs.core._nth["string"] = function() {
  var G__14723 = null;
  var G__14723__2 = function(string, n) {
    if(n < cljs.core._count.call(null, string)) {
      return string.charAt(n)
    }else {
      return null
    }
  };
  var G__14723__3 = function(string, n, not_found) {
    if(n < cljs.core._count.call(null, string)) {
      return string.charAt(n)
    }else {
      return not_found
    }
  };
  G__14723 = function(string, n, not_found) {
    switch(arguments.length) {
      case 2:
        return G__14723__2.call(this, string, n);
      case 3:
        return G__14723__3.call(this, string, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__14723
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
  var G__14735 = null;
  var G__14735__2 = function(this_sym14726, coll) {
    var this__14728 = this;
    var this_sym14726__14729 = this;
    var ___14730 = this_sym14726__14729;
    if(coll == null) {
      return null
    }else {
      var strobj__14731 = coll.strobj;
      if(strobj__14731 == null) {
        return cljs.core._lookup.call(null, coll, this__14728.k, null)
      }else {
        return strobj__14731[this__14728.k]
      }
    }
  };
  var G__14735__3 = function(this_sym14727, coll, not_found) {
    var this__14728 = this;
    var this_sym14727__14732 = this;
    var ___14733 = this_sym14727__14732;
    if(coll == null) {
      return not_found
    }else {
      return cljs.core._lookup.call(null, coll, this__14728.k, not_found)
    }
  };
  G__14735 = function(this_sym14727, coll, not_found) {
    switch(arguments.length) {
      case 2:
        return G__14735__2.call(this, this_sym14727, coll);
      case 3:
        return G__14735__3.call(this, this_sym14727, coll, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__14735
}();
cljs.core.Keyword.prototype.apply = function(this_sym14724, args14725) {
  var this__14734 = this;
  return this_sym14724.call.apply(this_sym14724, [this_sym14724].concat(args14725.slice()))
};
cljs.core.Keyword;
String.prototype.cljs$core$IFn$ = true;
String.prototype.call = function() {
  var G__14744 = null;
  var G__14744__2 = function(this_sym14738, coll) {
    var this_sym14738__14740 = this;
    var this__14741 = this_sym14738__14740;
    return cljs.core._lookup.call(null, coll, this__14741.toString(), null)
  };
  var G__14744__3 = function(this_sym14739, coll, not_found) {
    var this_sym14739__14742 = this;
    var this__14743 = this_sym14739__14742;
    return cljs.core._lookup.call(null, coll, this__14743.toString(), not_found)
  };
  G__14744 = function(this_sym14739, coll, not_found) {
    switch(arguments.length) {
      case 2:
        return G__14744__2.call(this, this_sym14739, coll);
      case 3:
        return G__14744__3.call(this, this_sym14739, coll, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__14744
}();
String.prototype.apply = function(this_sym14736, args14737) {
  return this_sym14736.call.apply(this_sym14736, [this_sym14736].concat(args14737.slice()))
};
String.prototype.apply = function(s, args) {
  if(cljs.core.count.call(null, args) < 2) {
    return cljs.core._lookup.call(null, args[0], s, null)
  }else {
    return cljs.core._lookup.call(null, args[0], s, args[1])
  }
};
cljs.core.lazy_seq_value = function lazy_seq_value(lazy_seq) {
  var x__14746 = lazy_seq.x;
  if(lazy_seq.realized) {
    return x__14746
  }else {
    lazy_seq.x = x__14746.call(null);
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
  var this__14747 = this;
  var h__2192__auto____14748 = this__14747.__hash;
  if(!(h__2192__auto____14748 == null)) {
    return h__2192__auto____14748
  }else {
    var h__2192__auto____14749 = cljs.core.hash_coll.call(null, coll);
    this__14747.__hash = h__2192__auto____14749;
    return h__2192__auto____14749
  }
};
cljs.core.LazySeq.prototype.cljs$core$INext$_next$arity$1 = function(coll) {
  var this__14750 = this;
  return cljs.core._seq.call(null, coll.cljs$core$ISeq$_rest$arity$1(coll))
};
cljs.core.LazySeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__14751 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.LazySeq.prototype.toString = function() {
  var this__14752 = this;
  var this__14753 = this;
  return cljs.core.pr_str.call(null, this__14753)
};
cljs.core.LazySeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__14754 = this;
  return cljs.core.seq.call(null, cljs.core.lazy_seq_value.call(null, coll))
};
cljs.core.LazySeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__14755 = this;
  return cljs.core.first.call(null, cljs.core.lazy_seq_value.call(null, coll))
};
cljs.core.LazySeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__14756 = this;
  return cljs.core.rest.call(null, cljs.core.lazy_seq_value.call(null, coll))
};
cljs.core.LazySeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__14757 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.LazySeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__14758 = this;
  return new cljs.core.LazySeq(meta, this__14758.realized, this__14758.x, this__14758.__hash)
};
cljs.core.LazySeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__14759 = this;
  return this__14759.meta
};
cljs.core.LazySeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__14760 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__14760.meta)
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
  var this__14761 = this;
  return this__14761.end
};
cljs.core.ChunkBuffer.prototype.add = function(o) {
  var this__14762 = this;
  var ___14763 = this;
  this__14762.buf[this__14762.end] = o;
  return this__14762.end = this__14762.end + 1
};
cljs.core.ChunkBuffer.prototype.chunk = function(o) {
  var this__14764 = this;
  var ___14765 = this;
  var ret__14766 = new cljs.core.ArrayChunk(this__14764.buf, 0, this__14764.end);
  this__14764.buf = null;
  return ret__14766
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
  var this__14767 = this;
  return cljs.core.ci_reduce.call(null, coll, f, this__14767.arr[this__14767.off], this__14767.off + 1)
};
cljs.core.ArrayChunk.prototype.cljs$core$IReduce$_reduce$arity$3 = function(coll, f, start) {
  var this__14768 = this;
  return cljs.core.ci_reduce.call(null, coll, f, start, this__14768.off)
};
cljs.core.ArrayChunk.prototype.cljs$core$IChunk$ = true;
cljs.core.ArrayChunk.prototype.cljs$core$IChunk$_drop_first$arity$1 = function(coll) {
  var this__14769 = this;
  if(this__14769.off === this__14769.end) {
    throw new Error("-drop-first of empty chunk");
  }else {
    return new cljs.core.ArrayChunk(this__14769.arr, this__14769.off + 1, this__14769.end)
  }
};
cljs.core.ArrayChunk.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, i) {
  var this__14770 = this;
  return this__14770.arr[this__14770.off + i]
};
cljs.core.ArrayChunk.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, i, not_found) {
  var this__14771 = this;
  if(function() {
    var and__3822__auto____14772 = i >= 0;
    if(and__3822__auto____14772) {
      return i < this__14771.end - this__14771.off
    }else {
      return and__3822__auto____14772
    }
  }()) {
    return this__14771.arr[this__14771.off + i]
  }else {
    return not_found
  }
};
cljs.core.ArrayChunk.prototype.cljs$core$ICounted$_count$arity$1 = function(_) {
  var this__14773 = this;
  return this__14773.end - this__14773.off
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
  var this__14774 = this;
  return cljs.core.cons.call(null, o, this$)
};
cljs.core.ChunkedCons.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__14775 = this;
  return coll
};
cljs.core.ChunkedCons.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__14776 = this;
  return cljs.core._nth.call(null, this__14776.chunk, 0)
};
cljs.core.ChunkedCons.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__14777 = this;
  if(cljs.core._count.call(null, this__14777.chunk) > 1) {
    return new cljs.core.ChunkedCons(cljs.core._drop_first.call(null, this__14777.chunk), this__14777.more, this__14777.meta)
  }else {
    if(this__14777.more == null) {
      return cljs.core.List.EMPTY
    }else {
      return this__14777.more
    }
  }
};
cljs.core.ChunkedCons.prototype.cljs$core$IChunkedNext$ = true;
cljs.core.ChunkedCons.prototype.cljs$core$IChunkedNext$_chunked_next$arity$1 = function(coll) {
  var this__14778 = this;
  if(this__14778.more == null) {
    return null
  }else {
    return this__14778.more
  }
};
cljs.core.ChunkedCons.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__14779 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.ChunkedCons.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, m) {
  var this__14780 = this;
  return new cljs.core.ChunkedCons(this__14780.chunk, this__14780.more, m)
};
cljs.core.ChunkedCons.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__14781 = this;
  return this__14781.meta
};
cljs.core.ChunkedCons.prototype.cljs$core$IChunkedSeq$ = true;
cljs.core.ChunkedCons.prototype.cljs$core$IChunkedSeq$_chunked_first$arity$1 = function(coll) {
  var this__14782 = this;
  return this__14782.chunk
};
cljs.core.ChunkedCons.prototype.cljs$core$IChunkedSeq$_chunked_rest$arity$1 = function(coll) {
  var this__14783 = this;
  if(this__14783.more == null) {
    return cljs.core.List.EMPTY
  }else {
    return this__14783.more
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
    var G__14787__14788 = s;
    if(G__14787__14788) {
      if(cljs.core.truth_(function() {
        var or__3824__auto____14789 = null;
        if(cljs.core.truth_(or__3824__auto____14789)) {
          return or__3824__auto____14789
        }else {
          return G__14787__14788.cljs$core$IChunkedNext$
        }
      }())) {
        return true
      }else {
        if(!G__14787__14788.cljs$lang$protocol_mask$partition$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.IChunkedNext, G__14787__14788)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.IChunkedNext, G__14787__14788)
    }
  }()) {
    return cljs.core._chunked_next.call(null, s)
  }else {
    return cljs.core.seq.call(null, cljs.core._chunked_rest.call(null, s))
  }
};
cljs.core.to_array = function to_array(s) {
  var ary__14792 = [];
  var s__14793 = s;
  while(true) {
    if(cljs.core.seq.call(null, s__14793)) {
      ary__14792.push(cljs.core.first.call(null, s__14793));
      var G__14794 = cljs.core.next.call(null, s__14793);
      s__14793 = G__14794;
      continue
    }else {
      return ary__14792
    }
    break
  }
};
cljs.core.to_array_2d = function to_array_2d(coll) {
  var ret__14798 = cljs.core.make_array.call(null, cljs.core.count.call(null, coll));
  var i__14799 = 0;
  var xs__14800 = cljs.core.seq.call(null, coll);
  while(true) {
    if(xs__14800) {
      ret__14798[i__14799] = cljs.core.to_array.call(null, cljs.core.first.call(null, xs__14800));
      var G__14801 = i__14799 + 1;
      var G__14802 = cljs.core.next.call(null, xs__14800);
      i__14799 = G__14801;
      xs__14800 = G__14802;
      continue
    }else {
    }
    break
  }
  return ret__14798
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
    var a__14810 = cljs.core.make_array.call(null, size);
    if(cljs.core.seq_QMARK_.call(null, init_val_or_seq)) {
      var s__14811 = cljs.core.seq.call(null, init_val_or_seq);
      var i__14812 = 0;
      var s__14813 = s__14811;
      while(true) {
        if(cljs.core.truth_(function() {
          var and__3822__auto____14814 = s__14813;
          if(and__3822__auto____14814) {
            return i__14812 < size
          }else {
            return and__3822__auto____14814
          }
        }())) {
          a__14810[i__14812] = cljs.core.first.call(null, s__14813);
          var G__14817 = i__14812 + 1;
          var G__14818 = cljs.core.next.call(null, s__14813);
          i__14812 = G__14817;
          s__14813 = G__14818;
          continue
        }else {
          return a__14810
        }
        break
      }
    }else {
      var n__2527__auto____14815 = size;
      var i__14816 = 0;
      while(true) {
        if(i__14816 < n__2527__auto____14815) {
          a__14810[i__14816] = init_val_or_seq;
          var G__14819 = i__14816 + 1;
          i__14816 = G__14819;
          continue
        }else {
        }
        break
      }
      return a__14810
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
    var a__14827 = cljs.core.make_array.call(null, size);
    if(cljs.core.seq_QMARK_.call(null, init_val_or_seq)) {
      var s__14828 = cljs.core.seq.call(null, init_val_or_seq);
      var i__14829 = 0;
      var s__14830 = s__14828;
      while(true) {
        if(cljs.core.truth_(function() {
          var and__3822__auto____14831 = s__14830;
          if(and__3822__auto____14831) {
            return i__14829 < size
          }else {
            return and__3822__auto____14831
          }
        }())) {
          a__14827[i__14829] = cljs.core.first.call(null, s__14830);
          var G__14834 = i__14829 + 1;
          var G__14835 = cljs.core.next.call(null, s__14830);
          i__14829 = G__14834;
          s__14830 = G__14835;
          continue
        }else {
          return a__14827
        }
        break
      }
    }else {
      var n__2527__auto____14832 = size;
      var i__14833 = 0;
      while(true) {
        if(i__14833 < n__2527__auto____14832) {
          a__14827[i__14833] = init_val_or_seq;
          var G__14836 = i__14833 + 1;
          i__14833 = G__14836;
          continue
        }else {
        }
        break
      }
      return a__14827
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
    var a__14844 = cljs.core.make_array.call(null, size);
    if(cljs.core.seq_QMARK_.call(null, init_val_or_seq)) {
      var s__14845 = cljs.core.seq.call(null, init_val_or_seq);
      var i__14846 = 0;
      var s__14847 = s__14845;
      while(true) {
        if(cljs.core.truth_(function() {
          var and__3822__auto____14848 = s__14847;
          if(and__3822__auto____14848) {
            return i__14846 < size
          }else {
            return and__3822__auto____14848
          }
        }())) {
          a__14844[i__14846] = cljs.core.first.call(null, s__14847);
          var G__14851 = i__14846 + 1;
          var G__14852 = cljs.core.next.call(null, s__14847);
          i__14846 = G__14851;
          s__14847 = G__14852;
          continue
        }else {
          return a__14844
        }
        break
      }
    }else {
      var n__2527__auto____14849 = size;
      var i__14850 = 0;
      while(true) {
        if(i__14850 < n__2527__auto____14849) {
          a__14844[i__14850] = init_val_or_seq;
          var G__14853 = i__14850 + 1;
          i__14850 = G__14853;
          continue
        }else {
        }
        break
      }
      return a__14844
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
    var s__14858 = s;
    var i__14859 = n;
    var sum__14860 = 0;
    while(true) {
      if(cljs.core.truth_(function() {
        var and__3822__auto____14861 = i__14859 > 0;
        if(and__3822__auto____14861) {
          return cljs.core.seq.call(null, s__14858)
        }else {
          return and__3822__auto____14861
        }
      }())) {
        var G__14862 = cljs.core.next.call(null, s__14858);
        var G__14863 = i__14859 - 1;
        var G__14864 = sum__14860 + 1;
        s__14858 = G__14862;
        i__14859 = G__14863;
        sum__14860 = G__14864;
        continue
      }else {
        return sum__14860
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
      var s__14869 = cljs.core.seq.call(null, x);
      if(s__14869) {
        if(cljs.core.chunked_seq_QMARK_.call(null, s__14869)) {
          return cljs.core.chunk_cons.call(null, cljs.core.chunk_first.call(null, s__14869), concat.call(null, cljs.core.chunk_rest.call(null, s__14869), y))
        }else {
          return cljs.core.cons.call(null, cljs.core.first.call(null, s__14869), concat.call(null, cljs.core.rest.call(null, s__14869), y))
        }
      }else {
        return y
      }
    }, null)
  };
  var concat__3 = function() {
    var G__14873__delegate = function(x, y, zs) {
      var cat__14872 = function cat(xys, zs) {
        return new cljs.core.LazySeq(null, false, function() {
          var xys__14871 = cljs.core.seq.call(null, xys);
          if(xys__14871) {
            if(cljs.core.chunked_seq_QMARK_.call(null, xys__14871)) {
              return cljs.core.chunk_cons.call(null, cljs.core.chunk_first.call(null, xys__14871), cat.call(null, cljs.core.chunk_rest.call(null, xys__14871), zs))
            }else {
              return cljs.core.cons.call(null, cljs.core.first.call(null, xys__14871), cat.call(null, cljs.core.rest.call(null, xys__14871), zs))
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
      return cat__14872.call(null, concat.call(null, x, y), zs)
    };
    var G__14873 = function(x, y, var_args) {
      var zs = null;
      if(goog.isDef(var_args)) {
        zs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__14873__delegate.call(this, x, y, zs)
    };
    G__14873.cljs$lang$maxFixedArity = 2;
    G__14873.cljs$lang$applyTo = function(arglist__14874) {
      var x = cljs.core.first(arglist__14874);
      var y = cljs.core.first(cljs.core.next(arglist__14874));
      var zs = cljs.core.rest(cljs.core.next(arglist__14874));
      return G__14873__delegate(x, y, zs)
    };
    G__14873.cljs$lang$arity$variadic = G__14873__delegate;
    return G__14873
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
    var G__14875__delegate = function(a, b, c, d, more) {
      return cljs.core.cons.call(null, a, cljs.core.cons.call(null, b, cljs.core.cons.call(null, c, cljs.core.cons.call(null, d, cljs.core.spread.call(null, more)))))
    };
    var G__14875 = function(a, b, c, d, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 4), 0)
      }
      return G__14875__delegate.call(this, a, b, c, d, more)
    };
    G__14875.cljs$lang$maxFixedArity = 4;
    G__14875.cljs$lang$applyTo = function(arglist__14876) {
      var a = cljs.core.first(arglist__14876);
      var b = cljs.core.first(cljs.core.next(arglist__14876));
      var c = cljs.core.first(cljs.core.next(cljs.core.next(arglist__14876)));
      var d = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__14876))));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(arglist__14876))));
      return G__14875__delegate(a, b, c, d, more)
    };
    G__14875.cljs$lang$arity$variadic = G__14875__delegate;
    return G__14875
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
  var args__14918 = cljs.core.seq.call(null, args);
  if(argc === 0) {
    return f.call(null)
  }else {
    var a__14919 = cljs.core._first.call(null, args__14918);
    var args__14920 = cljs.core._rest.call(null, args__14918);
    if(argc === 1) {
      if(f.cljs$lang$arity$1) {
        return f.cljs$lang$arity$1(a__14919)
      }else {
        return f.call(null, a__14919)
      }
    }else {
      var b__14921 = cljs.core._first.call(null, args__14920);
      var args__14922 = cljs.core._rest.call(null, args__14920);
      if(argc === 2) {
        if(f.cljs$lang$arity$2) {
          return f.cljs$lang$arity$2(a__14919, b__14921)
        }else {
          return f.call(null, a__14919, b__14921)
        }
      }else {
        var c__14923 = cljs.core._first.call(null, args__14922);
        var args__14924 = cljs.core._rest.call(null, args__14922);
        if(argc === 3) {
          if(f.cljs$lang$arity$3) {
            return f.cljs$lang$arity$3(a__14919, b__14921, c__14923)
          }else {
            return f.call(null, a__14919, b__14921, c__14923)
          }
        }else {
          var d__14925 = cljs.core._first.call(null, args__14924);
          var args__14926 = cljs.core._rest.call(null, args__14924);
          if(argc === 4) {
            if(f.cljs$lang$arity$4) {
              return f.cljs$lang$arity$4(a__14919, b__14921, c__14923, d__14925)
            }else {
              return f.call(null, a__14919, b__14921, c__14923, d__14925)
            }
          }else {
            var e__14927 = cljs.core._first.call(null, args__14926);
            var args__14928 = cljs.core._rest.call(null, args__14926);
            if(argc === 5) {
              if(f.cljs$lang$arity$5) {
                return f.cljs$lang$arity$5(a__14919, b__14921, c__14923, d__14925, e__14927)
              }else {
                return f.call(null, a__14919, b__14921, c__14923, d__14925, e__14927)
              }
            }else {
              var f__14929 = cljs.core._first.call(null, args__14928);
              var args__14930 = cljs.core._rest.call(null, args__14928);
              if(argc === 6) {
                if(f__14929.cljs$lang$arity$6) {
                  return f__14929.cljs$lang$arity$6(a__14919, b__14921, c__14923, d__14925, e__14927, f__14929)
                }else {
                  return f__14929.call(null, a__14919, b__14921, c__14923, d__14925, e__14927, f__14929)
                }
              }else {
                var g__14931 = cljs.core._first.call(null, args__14930);
                var args__14932 = cljs.core._rest.call(null, args__14930);
                if(argc === 7) {
                  if(f__14929.cljs$lang$arity$7) {
                    return f__14929.cljs$lang$arity$7(a__14919, b__14921, c__14923, d__14925, e__14927, f__14929, g__14931)
                  }else {
                    return f__14929.call(null, a__14919, b__14921, c__14923, d__14925, e__14927, f__14929, g__14931)
                  }
                }else {
                  var h__14933 = cljs.core._first.call(null, args__14932);
                  var args__14934 = cljs.core._rest.call(null, args__14932);
                  if(argc === 8) {
                    if(f__14929.cljs$lang$arity$8) {
                      return f__14929.cljs$lang$arity$8(a__14919, b__14921, c__14923, d__14925, e__14927, f__14929, g__14931, h__14933)
                    }else {
                      return f__14929.call(null, a__14919, b__14921, c__14923, d__14925, e__14927, f__14929, g__14931, h__14933)
                    }
                  }else {
                    var i__14935 = cljs.core._first.call(null, args__14934);
                    var args__14936 = cljs.core._rest.call(null, args__14934);
                    if(argc === 9) {
                      if(f__14929.cljs$lang$arity$9) {
                        return f__14929.cljs$lang$arity$9(a__14919, b__14921, c__14923, d__14925, e__14927, f__14929, g__14931, h__14933, i__14935)
                      }else {
                        return f__14929.call(null, a__14919, b__14921, c__14923, d__14925, e__14927, f__14929, g__14931, h__14933, i__14935)
                      }
                    }else {
                      var j__14937 = cljs.core._first.call(null, args__14936);
                      var args__14938 = cljs.core._rest.call(null, args__14936);
                      if(argc === 10) {
                        if(f__14929.cljs$lang$arity$10) {
                          return f__14929.cljs$lang$arity$10(a__14919, b__14921, c__14923, d__14925, e__14927, f__14929, g__14931, h__14933, i__14935, j__14937)
                        }else {
                          return f__14929.call(null, a__14919, b__14921, c__14923, d__14925, e__14927, f__14929, g__14931, h__14933, i__14935, j__14937)
                        }
                      }else {
                        var k__14939 = cljs.core._first.call(null, args__14938);
                        var args__14940 = cljs.core._rest.call(null, args__14938);
                        if(argc === 11) {
                          if(f__14929.cljs$lang$arity$11) {
                            return f__14929.cljs$lang$arity$11(a__14919, b__14921, c__14923, d__14925, e__14927, f__14929, g__14931, h__14933, i__14935, j__14937, k__14939)
                          }else {
                            return f__14929.call(null, a__14919, b__14921, c__14923, d__14925, e__14927, f__14929, g__14931, h__14933, i__14935, j__14937, k__14939)
                          }
                        }else {
                          var l__14941 = cljs.core._first.call(null, args__14940);
                          var args__14942 = cljs.core._rest.call(null, args__14940);
                          if(argc === 12) {
                            if(f__14929.cljs$lang$arity$12) {
                              return f__14929.cljs$lang$arity$12(a__14919, b__14921, c__14923, d__14925, e__14927, f__14929, g__14931, h__14933, i__14935, j__14937, k__14939, l__14941)
                            }else {
                              return f__14929.call(null, a__14919, b__14921, c__14923, d__14925, e__14927, f__14929, g__14931, h__14933, i__14935, j__14937, k__14939, l__14941)
                            }
                          }else {
                            var m__14943 = cljs.core._first.call(null, args__14942);
                            var args__14944 = cljs.core._rest.call(null, args__14942);
                            if(argc === 13) {
                              if(f__14929.cljs$lang$arity$13) {
                                return f__14929.cljs$lang$arity$13(a__14919, b__14921, c__14923, d__14925, e__14927, f__14929, g__14931, h__14933, i__14935, j__14937, k__14939, l__14941, m__14943)
                              }else {
                                return f__14929.call(null, a__14919, b__14921, c__14923, d__14925, e__14927, f__14929, g__14931, h__14933, i__14935, j__14937, k__14939, l__14941, m__14943)
                              }
                            }else {
                              var n__14945 = cljs.core._first.call(null, args__14944);
                              var args__14946 = cljs.core._rest.call(null, args__14944);
                              if(argc === 14) {
                                if(f__14929.cljs$lang$arity$14) {
                                  return f__14929.cljs$lang$arity$14(a__14919, b__14921, c__14923, d__14925, e__14927, f__14929, g__14931, h__14933, i__14935, j__14937, k__14939, l__14941, m__14943, n__14945)
                                }else {
                                  return f__14929.call(null, a__14919, b__14921, c__14923, d__14925, e__14927, f__14929, g__14931, h__14933, i__14935, j__14937, k__14939, l__14941, m__14943, n__14945)
                                }
                              }else {
                                var o__14947 = cljs.core._first.call(null, args__14946);
                                var args__14948 = cljs.core._rest.call(null, args__14946);
                                if(argc === 15) {
                                  if(f__14929.cljs$lang$arity$15) {
                                    return f__14929.cljs$lang$arity$15(a__14919, b__14921, c__14923, d__14925, e__14927, f__14929, g__14931, h__14933, i__14935, j__14937, k__14939, l__14941, m__14943, n__14945, o__14947)
                                  }else {
                                    return f__14929.call(null, a__14919, b__14921, c__14923, d__14925, e__14927, f__14929, g__14931, h__14933, i__14935, j__14937, k__14939, l__14941, m__14943, n__14945, o__14947)
                                  }
                                }else {
                                  var p__14949 = cljs.core._first.call(null, args__14948);
                                  var args__14950 = cljs.core._rest.call(null, args__14948);
                                  if(argc === 16) {
                                    if(f__14929.cljs$lang$arity$16) {
                                      return f__14929.cljs$lang$arity$16(a__14919, b__14921, c__14923, d__14925, e__14927, f__14929, g__14931, h__14933, i__14935, j__14937, k__14939, l__14941, m__14943, n__14945, o__14947, p__14949)
                                    }else {
                                      return f__14929.call(null, a__14919, b__14921, c__14923, d__14925, e__14927, f__14929, g__14931, h__14933, i__14935, j__14937, k__14939, l__14941, m__14943, n__14945, o__14947, p__14949)
                                    }
                                  }else {
                                    var q__14951 = cljs.core._first.call(null, args__14950);
                                    var args__14952 = cljs.core._rest.call(null, args__14950);
                                    if(argc === 17) {
                                      if(f__14929.cljs$lang$arity$17) {
                                        return f__14929.cljs$lang$arity$17(a__14919, b__14921, c__14923, d__14925, e__14927, f__14929, g__14931, h__14933, i__14935, j__14937, k__14939, l__14941, m__14943, n__14945, o__14947, p__14949, q__14951)
                                      }else {
                                        return f__14929.call(null, a__14919, b__14921, c__14923, d__14925, e__14927, f__14929, g__14931, h__14933, i__14935, j__14937, k__14939, l__14941, m__14943, n__14945, o__14947, p__14949, q__14951)
                                      }
                                    }else {
                                      var r__14953 = cljs.core._first.call(null, args__14952);
                                      var args__14954 = cljs.core._rest.call(null, args__14952);
                                      if(argc === 18) {
                                        if(f__14929.cljs$lang$arity$18) {
                                          return f__14929.cljs$lang$arity$18(a__14919, b__14921, c__14923, d__14925, e__14927, f__14929, g__14931, h__14933, i__14935, j__14937, k__14939, l__14941, m__14943, n__14945, o__14947, p__14949, q__14951, r__14953)
                                        }else {
                                          return f__14929.call(null, a__14919, b__14921, c__14923, d__14925, e__14927, f__14929, g__14931, h__14933, i__14935, j__14937, k__14939, l__14941, m__14943, n__14945, o__14947, p__14949, q__14951, r__14953)
                                        }
                                      }else {
                                        var s__14955 = cljs.core._first.call(null, args__14954);
                                        var args__14956 = cljs.core._rest.call(null, args__14954);
                                        if(argc === 19) {
                                          if(f__14929.cljs$lang$arity$19) {
                                            return f__14929.cljs$lang$arity$19(a__14919, b__14921, c__14923, d__14925, e__14927, f__14929, g__14931, h__14933, i__14935, j__14937, k__14939, l__14941, m__14943, n__14945, o__14947, p__14949, q__14951, r__14953, s__14955)
                                          }else {
                                            return f__14929.call(null, a__14919, b__14921, c__14923, d__14925, e__14927, f__14929, g__14931, h__14933, i__14935, j__14937, k__14939, l__14941, m__14943, n__14945, o__14947, p__14949, q__14951, r__14953, s__14955)
                                          }
                                        }else {
                                          var t__14957 = cljs.core._first.call(null, args__14956);
                                          var args__14958 = cljs.core._rest.call(null, args__14956);
                                          if(argc === 20) {
                                            if(f__14929.cljs$lang$arity$20) {
                                              return f__14929.cljs$lang$arity$20(a__14919, b__14921, c__14923, d__14925, e__14927, f__14929, g__14931, h__14933, i__14935, j__14937, k__14939, l__14941, m__14943, n__14945, o__14947, p__14949, q__14951, r__14953, s__14955, t__14957)
                                            }else {
                                              return f__14929.call(null, a__14919, b__14921, c__14923, d__14925, e__14927, f__14929, g__14931, h__14933, i__14935, j__14937, k__14939, l__14941, m__14943, n__14945, o__14947, p__14949, q__14951, r__14953, s__14955, t__14957)
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
    var fixed_arity__14973 = f.cljs$lang$maxFixedArity;
    if(cljs.core.truth_(f.cljs$lang$applyTo)) {
      var bc__14974 = cljs.core.bounded_count.call(null, args, fixed_arity__14973 + 1);
      if(bc__14974 <= fixed_arity__14973) {
        return cljs.core.apply_to.call(null, f, bc__14974, args)
      }else {
        return f.cljs$lang$applyTo(args)
      }
    }else {
      return f.apply(f, cljs.core.to_array.call(null, args))
    }
  };
  var apply__3 = function(f, x, args) {
    var arglist__14975 = cljs.core.list_STAR_.call(null, x, args);
    var fixed_arity__14976 = f.cljs$lang$maxFixedArity;
    if(cljs.core.truth_(f.cljs$lang$applyTo)) {
      var bc__14977 = cljs.core.bounded_count.call(null, arglist__14975, fixed_arity__14976 + 1);
      if(bc__14977 <= fixed_arity__14976) {
        return cljs.core.apply_to.call(null, f, bc__14977, arglist__14975)
      }else {
        return f.cljs$lang$applyTo(arglist__14975)
      }
    }else {
      return f.apply(f, cljs.core.to_array.call(null, arglist__14975))
    }
  };
  var apply__4 = function(f, x, y, args) {
    var arglist__14978 = cljs.core.list_STAR_.call(null, x, y, args);
    var fixed_arity__14979 = f.cljs$lang$maxFixedArity;
    if(cljs.core.truth_(f.cljs$lang$applyTo)) {
      var bc__14980 = cljs.core.bounded_count.call(null, arglist__14978, fixed_arity__14979 + 1);
      if(bc__14980 <= fixed_arity__14979) {
        return cljs.core.apply_to.call(null, f, bc__14980, arglist__14978)
      }else {
        return f.cljs$lang$applyTo(arglist__14978)
      }
    }else {
      return f.apply(f, cljs.core.to_array.call(null, arglist__14978))
    }
  };
  var apply__5 = function(f, x, y, z, args) {
    var arglist__14981 = cljs.core.list_STAR_.call(null, x, y, z, args);
    var fixed_arity__14982 = f.cljs$lang$maxFixedArity;
    if(cljs.core.truth_(f.cljs$lang$applyTo)) {
      var bc__14983 = cljs.core.bounded_count.call(null, arglist__14981, fixed_arity__14982 + 1);
      if(bc__14983 <= fixed_arity__14982) {
        return cljs.core.apply_to.call(null, f, bc__14983, arglist__14981)
      }else {
        return f.cljs$lang$applyTo(arglist__14981)
      }
    }else {
      return f.apply(f, cljs.core.to_array.call(null, arglist__14981))
    }
  };
  var apply__6 = function() {
    var G__14987__delegate = function(f, a, b, c, d, args) {
      var arglist__14984 = cljs.core.cons.call(null, a, cljs.core.cons.call(null, b, cljs.core.cons.call(null, c, cljs.core.cons.call(null, d, cljs.core.spread.call(null, args)))));
      var fixed_arity__14985 = f.cljs$lang$maxFixedArity;
      if(cljs.core.truth_(f.cljs$lang$applyTo)) {
        var bc__14986 = cljs.core.bounded_count.call(null, arglist__14984, fixed_arity__14985 + 1);
        if(bc__14986 <= fixed_arity__14985) {
          return cljs.core.apply_to.call(null, f, bc__14986, arglist__14984)
        }else {
          return f.cljs$lang$applyTo(arglist__14984)
        }
      }else {
        return f.apply(f, cljs.core.to_array.call(null, arglist__14984))
      }
    };
    var G__14987 = function(f, a, b, c, d, var_args) {
      var args = null;
      if(goog.isDef(var_args)) {
        args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 5), 0)
      }
      return G__14987__delegate.call(this, f, a, b, c, d, args)
    };
    G__14987.cljs$lang$maxFixedArity = 5;
    G__14987.cljs$lang$applyTo = function(arglist__14988) {
      var f = cljs.core.first(arglist__14988);
      var a = cljs.core.first(cljs.core.next(arglist__14988));
      var b = cljs.core.first(cljs.core.next(cljs.core.next(arglist__14988)));
      var c = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__14988))));
      var d = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(cljs.core.next(arglist__14988)))));
      var args = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(cljs.core.next(arglist__14988)))));
      return G__14987__delegate(f, a, b, c, d, args)
    };
    G__14987.cljs$lang$arity$variadic = G__14987__delegate;
    return G__14987
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
  vary_meta.cljs$lang$applyTo = function(arglist__14989) {
    var obj = cljs.core.first(arglist__14989);
    var f = cljs.core.first(cljs.core.next(arglist__14989));
    var args = cljs.core.rest(cljs.core.next(arglist__14989));
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
    var G__14990__delegate = function(x, y, more) {
      return cljs.core.not.call(null, cljs.core.apply.call(null, cljs.core._EQ_, x, y, more))
    };
    var G__14990 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__14990__delegate.call(this, x, y, more)
    };
    G__14990.cljs$lang$maxFixedArity = 2;
    G__14990.cljs$lang$applyTo = function(arglist__14991) {
      var x = cljs.core.first(arglist__14991);
      var y = cljs.core.first(cljs.core.next(arglist__14991));
      var more = cljs.core.rest(cljs.core.next(arglist__14991));
      return G__14990__delegate(x, y, more)
    };
    G__14990.cljs$lang$arity$variadic = G__14990__delegate;
    return G__14990
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
        var G__14992 = pred;
        var G__14993 = cljs.core.next.call(null, coll);
        pred = G__14992;
        coll = G__14993;
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
      var or__3824__auto____14995 = pred.call(null, cljs.core.first.call(null, coll));
      if(cljs.core.truth_(or__3824__auto____14995)) {
        return or__3824__auto____14995
      }else {
        var G__14996 = pred;
        var G__14997 = cljs.core.next.call(null, coll);
        pred = G__14996;
        coll = G__14997;
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
    var G__14998 = null;
    var G__14998__0 = function() {
      return cljs.core.not.call(null, f.call(null))
    };
    var G__14998__1 = function(x) {
      return cljs.core.not.call(null, f.call(null, x))
    };
    var G__14998__2 = function(x, y) {
      return cljs.core.not.call(null, f.call(null, x, y))
    };
    var G__14998__3 = function() {
      var G__14999__delegate = function(x, y, zs) {
        return cljs.core.not.call(null, cljs.core.apply.call(null, f, x, y, zs))
      };
      var G__14999 = function(x, y, var_args) {
        var zs = null;
        if(goog.isDef(var_args)) {
          zs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
        }
        return G__14999__delegate.call(this, x, y, zs)
      };
      G__14999.cljs$lang$maxFixedArity = 2;
      G__14999.cljs$lang$applyTo = function(arglist__15000) {
        var x = cljs.core.first(arglist__15000);
        var y = cljs.core.first(cljs.core.next(arglist__15000));
        var zs = cljs.core.rest(cljs.core.next(arglist__15000));
        return G__14999__delegate(x, y, zs)
      };
      G__14999.cljs$lang$arity$variadic = G__14999__delegate;
      return G__14999
    }();
    G__14998 = function(x, y, var_args) {
      var zs = var_args;
      switch(arguments.length) {
        case 0:
          return G__14998__0.call(this);
        case 1:
          return G__14998__1.call(this, x);
        case 2:
          return G__14998__2.call(this, x, y);
        default:
          return G__14998__3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
      }
      throw"Invalid arity: " + arguments.length;
    };
    G__14998.cljs$lang$maxFixedArity = 2;
    G__14998.cljs$lang$applyTo = G__14998__3.cljs$lang$applyTo;
    return G__14998
  }()
};
cljs.core.constantly = function constantly(x) {
  return function() {
    var G__15001__delegate = function(args) {
      return x
    };
    var G__15001 = function(var_args) {
      var args = null;
      if(goog.isDef(var_args)) {
        args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
      }
      return G__15001__delegate.call(this, args)
    };
    G__15001.cljs$lang$maxFixedArity = 0;
    G__15001.cljs$lang$applyTo = function(arglist__15002) {
      var args = cljs.core.seq(arglist__15002);
      return G__15001__delegate(args)
    };
    G__15001.cljs$lang$arity$variadic = G__15001__delegate;
    return G__15001
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
      var G__15009 = null;
      var G__15009__0 = function() {
        return f.call(null, g.call(null))
      };
      var G__15009__1 = function(x) {
        return f.call(null, g.call(null, x))
      };
      var G__15009__2 = function(x, y) {
        return f.call(null, g.call(null, x, y))
      };
      var G__15009__3 = function(x, y, z) {
        return f.call(null, g.call(null, x, y, z))
      };
      var G__15009__4 = function() {
        var G__15010__delegate = function(x, y, z, args) {
          return f.call(null, cljs.core.apply.call(null, g, x, y, z, args))
        };
        var G__15010 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__15010__delegate.call(this, x, y, z, args)
        };
        G__15010.cljs$lang$maxFixedArity = 3;
        G__15010.cljs$lang$applyTo = function(arglist__15011) {
          var x = cljs.core.first(arglist__15011);
          var y = cljs.core.first(cljs.core.next(arglist__15011));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__15011)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__15011)));
          return G__15010__delegate(x, y, z, args)
        };
        G__15010.cljs$lang$arity$variadic = G__15010__delegate;
        return G__15010
      }();
      G__15009 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__15009__0.call(this);
          case 1:
            return G__15009__1.call(this, x);
          case 2:
            return G__15009__2.call(this, x, y);
          case 3:
            return G__15009__3.call(this, x, y, z);
          default:
            return G__15009__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__15009.cljs$lang$maxFixedArity = 3;
      G__15009.cljs$lang$applyTo = G__15009__4.cljs$lang$applyTo;
      return G__15009
    }()
  };
  var comp__3 = function(f, g, h) {
    return function() {
      var G__15012 = null;
      var G__15012__0 = function() {
        return f.call(null, g.call(null, h.call(null)))
      };
      var G__15012__1 = function(x) {
        return f.call(null, g.call(null, h.call(null, x)))
      };
      var G__15012__2 = function(x, y) {
        return f.call(null, g.call(null, h.call(null, x, y)))
      };
      var G__15012__3 = function(x, y, z) {
        return f.call(null, g.call(null, h.call(null, x, y, z)))
      };
      var G__15012__4 = function() {
        var G__15013__delegate = function(x, y, z, args) {
          return f.call(null, g.call(null, cljs.core.apply.call(null, h, x, y, z, args)))
        };
        var G__15013 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__15013__delegate.call(this, x, y, z, args)
        };
        G__15013.cljs$lang$maxFixedArity = 3;
        G__15013.cljs$lang$applyTo = function(arglist__15014) {
          var x = cljs.core.first(arglist__15014);
          var y = cljs.core.first(cljs.core.next(arglist__15014));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__15014)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__15014)));
          return G__15013__delegate(x, y, z, args)
        };
        G__15013.cljs$lang$arity$variadic = G__15013__delegate;
        return G__15013
      }();
      G__15012 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__15012__0.call(this);
          case 1:
            return G__15012__1.call(this, x);
          case 2:
            return G__15012__2.call(this, x, y);
          case 3:
            return G__15012__3.call(this, x, y, z);
          default:
            return G__15012__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__15012.cljs$lang$maxFixedArity = 3;
      G__15012.cljs$lang$applyTo = G__15012__4.cljs$lang$applyTo;
      return G__15012
    }()
  };
  var comp__4 = function() {
    var G__15015__delegate = function(f1, f2, f3, fs) {
      var fs__15006 = cljs.core.reverse.call(null, cljs.core.list_STAR_.call(null, f1, f2, f3, fs));
      return function() {
        var G__15016__delegate = function(args) {
          var ret__15007 = cljs.core.apply.call(null, cljs.core.first.call(null, fs__15006), args);
          var fs__15008 = cljs.core.next.call(null, fs__15006);
          while(true) {
            if(fs__15008) {
              var G__15017 = cljs.core.first.call(null, fs__15008).call(null, ret__15007);
              var G__15018 = cljs.core.next.call(null, fs__15008);
              ret__15007 = G__15017;
              fs__15008 = G__15018;
              continue
            }else {
              return ret__15007
            }
            break
          }
        };
        var G__15016 = function(var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
          }
          return G__15016__delegate.call(this, args)
        };
        G__15016.cljs$lang$maxFixedArity = 0;
        G__15016.cljs$lang$applyTo = function(arglist__15019) {
          var args = cljs.core.seq(arglist__15019);
          return G__15016__delegate(args)
        };
        G__15016.cljs$lang$arity$variadic = G__15016__delegate;
        return G__15016
      }()
    };
    var G__15015 = function(f1, f2, f3, var_args) {
      var fs = null;
      if(goog.isDef(var_args)) {
        fs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__15015__delegate.call(this, f1, f2, f3, fs)
    };
    G__15015.cljs$lang$maxFixedArity = 3;
    G__15015.cljs$lang$applyTo = function(arglist__15020) {
      var f1 = cljs.core.first(arglist__15020);
      var f2 = cljs.core.first(cljs.core.next(arglist__15020));
      var f3 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__15020)));
      var fs = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__15020)));
      return G__15015__delegate(f1, f2, f3, fs)
    };
    G__15015.cljs$lang$arity$variadic = G__15015__delegate;
    return G__15015
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
      var G__15021__delegate = function(args) {
        return cljs.core.apply.call(null, f, arg1, args)
      };
      var G__15021 = function(var_args) {
        var args = null;
        if(goog.isDef(var_args)) {
          args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
        }
        return G__15021__delegate.call(this, args)
      };
      G__15021.cljs$lang$maxFixedArity = 0;
      G__15021.cljs$lang$applyTo = function(arglist__15022) {
        var args = cljs.core.seq(arglist__15022);
        return G__15021__delegate(args)
      };
      G__15021.cljs$lang$arity$variadic = G__15021__delegate;
      return G__15021
    }()
  };
  var partial__3 = function(f, arg1, arg2) {
    return function() {
      var G__15023__delegate = function(args) {
        return cljs.core.apply.call(null, f, arg1, arg2, args)
      };
      var G__15023 = function(var_args) {
        var args = null;
        if(goog.isDef(var_args)) {
          args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
        }
        return G__15023__delegate.call(this, args)
      };
      G__15023.cljs$lang$maxFixedArity = 0;
      G__15023.cljs$lang$applyTo = function(arglist__15024) {
        var args = cljs.core.seq(arglist__15024);
        return G__15023__delegate(args)
      };
      G__15023.cljs$lang$arity$variadic = G__15023__delegate;
      return G__15023
    }()
  };
  var partial__4 = function(f, arg1, arg2, arg3) {
    return function() {
      var G__15025__delegate = function(args) {
        return cljs.core.apply.call(null, f, arg1, arg2, arg3, args)
      };
      var G__15025 = function(var_args) {
        var args = null;
        if(goog.isDef(var_args)) {
          args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
        }
        return G__15025__delegate.call(this, args)
      };
      G__15025.cljs$lang$maxFixedArity = 0;
      G__15025.cljs$lang$applyTo = function(arglist__15026) {
        var args = cljs.core.seq(arglist__15026);
        return G__15025__delegate(args)
      };
      G__15025.cljs$lang$arity$variadic = G__15025__delegate;
      return G__15025
    }()
  };
  var partial__5 = function() {
    var G__15027__delegate = function(f, arg1, arg2, arg3, more) {
      return function() {
        var G__15028__delegate = function(args) {
          return cljs.core.apply.call(null, f, arg1, arg2, arg3, cljs.core.concat.call(null, more, args))
        };
        var G__15028 = function(var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
          }
          return G__15028__delegate.call(this, args)
        };
        G__15028.cljs$lang$maxFixedArity = 0;
        G__15028.cljs$lang$applyTo = function(arglist__15029) {
          var args = cljs.core.seq(arglist__15029);
          return G__15028__delegate(args)
        };
        G__15028.cljs$lang$arity$variadic = G__15028__delegate;
        return G__15028
      }()
    };
    var G__15027 = function(f, arg1, arg2, arg3, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 4), 0)
      }
      return G__15027__delegate.call(this, f, arg1, arg2, arg3, more)
    };
    G__15027.cljs$lang$maxFixedArity = 4;
    G__15027.cljs$lang$applyTo = function(arglist__15030) {
      var f = cljs.core.first(arglist__15030);
      var arg1 = cljs.core.first(cljs.core.next(arglist__15030));
      var arg2 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__15030)));
      var arg3 = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__15030))));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(arglist__15030))));
      return G__15027__delegate(f, arg1, arg2, arg3, more)
    };
    G__15027.cljs$lang$arity$variadic = G__15027__delegate;
    return G__15027
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
      var G__15031 = null;
      var G__15031__1 = function(a) {
        return f.call(null, a == null ? x : a)
      };
      var G__15031__2 = function(a, b) {
        return f.call(null, a == null ? x : a, b)
      };
      var G__15031__3 = function(a, b, c) {
        return f.call(null, a == null ? x : a, b, c)
      };
      var G__15031__4 = function() {
        var G__15032__delegate = function(a, b, c, ds) {
          return cljs.core.apply.call(null, f, a == null ? x : a, b, c, ds)
        };
        var G__15032 = function(a, b, c, var_args) {
          var ds = null;
          if(goog.isDef(var_args)) {
            ds = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__15032__delegate.call(this, a, b, c, ds)
        };
        G__15032.cljs$lang$maxFixedArity = 3;
        G__15032.cljs$lang$applyTo = function(arglist__15033) {
          var a = cljs.core.first(arglist__15033);
          var b = cljs.core.first(cljs.core.next(arglist__15033));
          var c = cljs.core.first(cljs.core.next(cljs.core.next(arglist__15033)));
          var ds = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__15033)));
          return G__15032__delegate(a, b, c, ds)
        };
        G__15032.cljs$lang$arity$variadic = G__15032__delegate;
        return G__15032
      }();
      G__15031 = function(a, b, c, var_args) {
        var ds = var_args;
        switch(arguments.length) {
          case 1:
            return G__15031__1.call(this, a);
          case 2:
            return G__15031__2.call(this, a, b);
          case 3:
            return G__15031__3.call(this, a, b, c);
          default:
            return G__15031__4.cljs$lang$arity$variadic(a, b, c, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__15031.cljs$lang$maxFixedArity = 3;
      G__15031.cljs$lang$applyTo = G__15031__4.cljs$lang$applyTo;
      return G__15031
    }()
  };
  var fnil__3 = function(f, x, y) {
    return function() {
      var G__15034 = null;
      var G__15034__2 = function(a, b) {
        return f.call(null, a == null ? x : a, b == null ? y : b)
      };
      var G__15034__3 = function(a, b, c) {
        return f.call(null, a == null ? x : a, b == null ? y : b, c)
      };
      var G__15034__4 = function() {
        var G__15035__delegate = function(a, b, c, ds) {
          return cljs.core.apply.call(null, f, a == null ? x : a, b == null ? y : b, c, ds)
        };
        var G__15035 = function(a, b, c, var_args) {
          var ds = null;
          if(goog.isDef(var_args)) {
            ds = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__15035__delegate.call(this, a, b, c, ds)
        };
        G__15035.cljs$lang$maxFixedArity = 3;
        G__15035.cljs$lang$applyTo = function(arglist__15036) {
          var a = cljs.core.first(arglist__15036);
          var b = cljs.core.first(cljs.core.next(arglist__15036));
          var c = cljs.core.first(cljs.core.next(cljs.core.next(arglist__15036)));
          var ds = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__15036)));
          return G__15035__delegate(a, b, c, ds)
        };
        G__15035.cljs$lang$arity$variadic = G__15035__delegate;
        return G__15035
      }();
      G__15034 = function(a, b, c, var_args) {
        var ds = var_args;
        switch(arguments.length) {
          case 2:
            return G__15034__2.call(this, a, b);
          case 3:
            return G__15034__3.call(this, a, b, c);
          default:
            return G__15034__4.cljs$lang$arity$variadic(a, b, c, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__15034.cljs$lang$maxFixedArity = 3;
      G__15034.cljs$lang$applyTo = G__15034__4.cljs$lang$applyTo;
      return G__15034
    }()
  };
  var fnil__4 = function(f, x, y, z) {
    return function() {
      var G__15037 = null;
      var G__15037__2 = function(a, b) {
        return f.call(null, a == null ? x : a, b == null ? y : b)
      };
      var G__15037__3 = function(a, b, c) {
        return f.call(null, a == null ? x : a, b == null ? y : b, c == null ? z : c)
      };
      var G__15037__4 = function() {
        var G__15038__delegate = function(a, b, c, ds) {
          return cljs.core.apply.call(null, f, a == null ? x : a, b == null ? y : b, c == null ? z : c, ds)
        };
        var G__15038 = function(a, b, c, var_args) {
          var ds = null;
          if(goog.isDef(var_args)) {
            ds = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__15038__delegate.call(this, a, b, c, ds)
        };
        G__15038.cljs$lang$maxFixedArity = 3;
        G__15038.cljs$lang$applyTo = function(arglist__15039) {
          var a = cljs.core.first(arglist__15039);
          var b = cljs.core.first(cljs.core.next(arglist__15039));
          var c = cljs.core.first(cljs.core.next(cljs.core.next(arglist__15039)));
          var ds = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__15039)));
          return G__15038__delegate(a, b, c, ds)
        };
        G__15038.cljs$lang$arity$variadic = G__15038__delegate;
        return G__15038
      }();
      G__15037 = function(a, b, c, var_args) {
        var ds = var_args;
        switch(arguments.length) {
          case 2:
            return G__15037__2.call(this, a, b);
          case 3:
            return G__15037__3.call(this, a, b, c);
          default:
            return G__15037__4.cljs$lang$arity$variadic(a, b, c, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__15037.cljs$lang$maxFixedArity = 3;
      G__15037.cljs$lang$applyTo = G__15037__4.cljs$lang$applyTo;
      return G__15037
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
  var mapi__15055 = function mapi(idx, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3974__auto____15063 = cljs.core.seq.call(null, coll);
      if(temp__3974__auto____15063) {
        var s__15064 = temp__3974__auto____15063;
        if(cljs.core.chunked_seq_QMARK_.call(null, s__15064)) {
          var c__15065 = cljs.core.chunk_first.call(null, s__15064);
          var size__15066 = cljs.core.count.call(null, c__15065);
          var b__15067 = cljs.core.chunk_buffer.call(null, size__15066);
          var n__2527__auto____15068 = size__15066;
          var i__15069 = 0;
          while(true) {
            if(i__15069 < n__2527__auto____15068) {
              cljs.core.chunk_append.call(null, b__15067, f.call(null, idx + i__15069, cljs.core._nth.call(null, c__15065, i__15069)));
              var G__15070 = i__15069 + 1;
              i__15069 = G__15070;
              continue
            }else {
            }
            break
          }
          return cljs.core.chunk_cons.call(null, cljs.core.chunk.call(null, b__15067), mapi.call(null, idx + size__15066, cljs.core.chunk_rest.call(null, s__15064)))
        }else {
          return cljs.core.cons.call(null, f.call(null, idx, cljs.core.first.call(null, s__15064)), mapi.call(null, idx + 1, cljs.core.rest.call(null, s__15064)))
        }
      }else {
        return null
      }
    }, null)
  };
  return mapi__15055.call(null, 0, coll)
};
cljs.core.keep = function keep(f, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__3974__auto____15080 = cljs.core.seq.call(null, coll);
    if(temp__3974__auto____15080) {
      var s__15081 = temp__3974__auto____15080;
      if(cljs.core.chunked_seq_QMARK_.call(null, s__15081)) {
        var c__15082 = cljs.core.chunk_first.call(null, s__15081);
        var size__15083 = cljs.core.count.call(null, c__15082);
        var b__15084 = cljs.core.chunk_buffer.call(null, size__15083);
        var n__2527__auto____15085 = size__15083;
        var i__15086 = 0;
        while(true) {
          if(i__15086 < n__2527__auto____15085) {
            var x__15087 = f.call(null, cljs.core._nth.call(null, c__15082, i__15086));
            if(x__15087 == null) {
            }else {
              cljs.core.chunk_append.call(null, b__15084, x__15087)
            }
            var G__15089 = i__15086 + 1;
            i__15086 = G__15089;
            continue
          }else {
          }
          break
        }
        return cljs.core.chunk_cons.call(null, cljs.core.chunk.call(null, b__15084), keep.call(null, f, cljs.core.chunk_rest.call(null, s__15081)))
      }else {
        var x__15088 = f.call(null, cljs.core.first.call(null, s__15081));
        if(x__15088 == null) {
          return keep.call(null, f, cljs.core.rest.call(null, s__15081))
        }else {
          return cljs.core.cons.call(null, x__15088, keep.call(null, f, cljs.core.rest.call(null, s__15081)))
        }
      }
    }else {
      return null
    }
  }, null)
};
cljs.core.keep_indexed = function keep_indexed(f, coll) {
  var keepi__15115 = function keepi(idx, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3974__auto____15125 = cljs.core.seq.call(null, coll);
      if(temp__3974__auto____15125) {
        var s__15126 = temp__3974__auto____15125;
        if(cljs.core.chunked_seq_QMARK_.call(null, s__15126)) {
          var c__15127 = cljs.core.chunk_first.call(null, s__15126);
          var size__15128 = cljs.core.count.call(null, c__15127);
          var b__15129 = cljs.core.chunk_buffer.call(null, size__15128);
          var n__2527__auto____15130 = size__15128;
          var i__15131 = 0;
          while(true) {
            if(i__15131 < n__2527__auto____15130) {
              var x__15132 = f.call(null, idx + i__15131, cljs.core._nth.call(null, c__15127, i__15131));
              if(x__15132 == null) {
              }else {
                cljs.core.chunk_append.call(null, b__15129, x__15132)
              }
              var G__15134 = i__15131 + 1;
              i__15131 = G__15134;
              continue
            }else {
            }
            break
          }
          return cljs.core.chunk_cons.call(null, cljs.core.chunk.call(null, b__15129), keepi.call(null, idx + size__15128, cljs.core.chunk_rest.call(null, s__15126)))
        }else {
          var x__15133 = f.call(null, idx, cljs.core.first.call(null, s__15126));
          if(x__15133 == null) {
            return keepi.call(null, idx + 1, cljs.core.rest.call(null, s__15126))
          }else {
            return cljs.core.cons.call(null, x__15133, keepi.call(null, idx + 1, cljs.core.rest.call(null, s__15126)))
          }
        }
      }else {
        return null
      }
    }, null)
  };
  return keepi__15115.call(null, 0, coll)
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
          var and__3822__auto____15220 = p.call(null, x);
          if(cljs.core.truth_(and__3822__auto____15220)) {
            return p.call(null, y)
          }else {
            return and__3822__auto____15220
          }
        }())
      };
      var ep1__3 = function(x, y, z) {
        return cljs.core.boolean$.call(null, function() {
          var and__3822__auto____15221 = p.call(null, x);
          if(cljs.core.truth_(and__3822__auto____15221)) {
            var and__3822__auto____15222 = p.call(null, y);
            if(cljs.core.truth_(and__3822__auto____15222)) {
              return p.call(null, z)
            }else {
              return and__3822__auto____15222
            }
          }else {
            return and__3822__auto____15221
          }
        }())
      };
      var ep1__4 = function() {
        var G__15291__delegate = function(x, y, z, args) {
          return cljs.core.boolean$.call(null, function() {
            var and__3822__auto____15223 = ep1.call(null, x, y, z);
            if(cljs.core.truth_(and__3822__auto____15223)) {
              return cljs.core.every_QMARK_.call(null, p, args)
            }else {
              return and__3822__auto____15223
            }
          }())
        };
        var G__15291 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__15291__delegate.call(this, x, y, z, args)
        };
        G__15291.cljs$lang$maxFixedArity = 3;
        G__15291.cljs$lang$applyTo = function(arglist__15292) {
          var x = cljs.core.first(arglist__15292);
          var y = cljs.core.first(cljs.core.next(arglist__15292));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__15292)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__15292)));
          return G__15291__delegate(x, y, z, args)
        };
        G__15291.cljs$lang$arity$variadic = G__15291__delegate;
        return G__15291
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
          var and__3822__auto____15235 = p1.call(null, x);
          if(cljs.core.truth_(and__3822__auto____15235)) {
            return p2.call(null, x)
          }else {
            return and__3822__auto____15235
          }
        }())
      };
      var ep2__2 = function(x, y) {
        return cljs.core.boolean$.call(null, function() {
          var and__3822__auto____15236 = p1.call(null, x);
          if(cljs.core.truth_(and__3822__auto____15236)) {
            var and__3822__auto____15237 = p1.call(null, y);
            if(cljs.core.truth_(and__3822__auto____15237)) {
              var and__3822__auto____15238 = p2.call(null, x);
              if(cljs.core.truth_(and__3822__auto____15238)) {
                return p2.call(null, y)
              }else {
                return and__3822__auto____15238
              }
            }else {
              return and__3822__auto____15237
            }
          }else {
            return and__3822__auto____15236
          }
        }())
      };
      var ep2__3 = function(x, y, z) {
        return cljs.core.boolean$.call(null, function() {
          var and__3822__auto____15239 = p1.call(null, x);
          if(cljs.core.truth_(and__3822__auto____15239)) {
            var and__3822__auto____15240 = p1.call(null, y);
            if(cljs.core.truth_(and__3822__auto____15240)) {
              var and__3822__auto____15241 = p1.call(null, z);
              if(cljs.core.truth_(and__3822__auto____15241)) {
                var and__3822__auto____15242 = p2.call(null, x);
                if(cljs.core.truth_(and__3822__auto____15242)) {
                  var and__3822__auto____15243 = p2.call(null, y);
                  if(cljs.core.truth_(and__3822__auto____15243)) {
                    return p2.call(null, z)
                  }else {
                    return and__3822__auto____15243
                  }
                }else {
                  return and__3822__auto____15242
                }
              }else {
                return and__3822__auto____15241
              }
            }else {
              return and__3822__auto____15240
            }
          }else {
            return and__3822__auto____15239
          }
        }())
      };
      var ep2__4 = function() {
        var G__15293__delegate = function(x, y, z, args) {
          return cljs.core.boolean$.call(null, function() {
            var and__3822__auto____15244 = ep2.call(null, x, y, z);
            if(cljs.core.truth_(and__3822__auto____15244)) {
              return cljs.core.every_QMARK_.call(null, function(p1__15090_SHARP_) {
                var and__3822__auto____15245 = p1.call(null, p1__15090_SHARP_);
                if(cljs.core.truth_(and__3822__auto____15245)) {
                  return p2.call(null, p1__15090_SHARP_)
                }else {
                  return and__3822__auto____15245
                }
              }, args)
            }else {
              return and__3822__auto____15244
            }
          }())
        };
        var G__15293 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__15293__delegate.call(this, x, y, z, args)
        };
        G__15293.cljs$lang$maxFixedArity = 3;
        G__15293.cljs$lang$applyTo = function(arglist__15294) {
          var x = cljs.core.first(arglist__15294);
          var y = cljs.core.first(cljs.core.next(arglist__15294));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__15294)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__15294)));
          return G__15293__delegate(x, y, z, args)
        };
        G__15293.cljs$lang$arity$variadic = G__15293__delegate;
        return G__15293
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
          var and__3822__auto____15264 = p1.call(null, x);
          if(cljs.core.truth_(and__3822__auto____15264)) {
            var and__3822__auto____15265 = p2.call(null, x);
            if(cljs.core.truth_(and__3822__auto____15265)) {
              return p3.call(null, x)
            }else {
              return and__3822__auto____15265
            }
          }else {
            return and__3822__auto____15264
          }
        }())
      };
      var ep3__2 = function(x, y) {
        return cljs.core.boolean$.call(null, function() {
          var and__3822__auto____15266 = p1.call(null, x);
          if(cljs.core.truth_(and__3822__auto____15266)) {
            var and__3822__auto____15267 = p2.call(null, x);
            if(cljs.core.truth_(and__3822__auto____15267)) {
              var and__3822__auto____15268 = p3.call(null, x);
              if(cljs.core.truth_(and__3822__auto____15268)) {
                var and__3822__auto____15269 = p1.call(null, y);
                if(cljs.core.truth_(and__3822__auto____15269)) {
                  var and__3822__auto____15270 = p2.call(null, y);
                  if(cljs.core.truth_(and__3822__auto____15270)) {
                    return p3.call(null, y)
                  }else {
                    return and__3822__auto____15270
                  }
                }else {
                  return and__3822__auto____15269
                }
              }else {
                return and__3822__auto____15268
              }
            }else {
              return and__3822__auto____15267
            }
          }else {
            return and__3822__auto____15266
          }
        }())
      };
      var ep3__3 = function(x, y, z) {
        return cljs.core.boolean$.call(null, function() {
          var and__3822__auto____15271 = p1.call(null, x);
          if(cljs.core.truth_(and__3822__auto____15271)) {
            var and__3822__auto____15272 = p2.call(null, x);
            if(cljs.core.truth_(and__3822__auto____15272)) {
              var and__3822__auto____15273 = p3.call(null, x);
              if(cljs.core.truth_(and__3822__auto____15273)) {
                var and__3822__auto____15274 = p1.call(null, y);
                if(cljs.core.truth_(and__3822__auto____15274)) {
                  var and__3822__auto____15275 = p2.call(null, y);
                  if(cljs.core.truth_(and__3822__auto____15275)) {
                    var and__3822__auto____15276 = p3.call(null, y);
                    if(cljs.core.truth_(and__3822__auto____15276)) {
                      var and__3822__auto____15277 = p1.call(null, z);
                      if(cljs.core.truth_(and__3822__auto____15277)) {
                        var and__3822__auto____15278 = p2.call(null, z);
                        if(cljs.core.truth_(and__3822__auto____15278)) {
                          return p3.call(null, z)
                        }else {
                          return and__3822__auto____15278
                        }
                      }else {
                        return and__3822__auto____15277
                      }
                    }else {
                      return and__3822__auto____15276
                    }
                  }else {
                    return and__3822__auto____15275
                  }
                }else {
                  return and__3822__auto____15274
                }
              }else {
                return and__3822__auto____15273
              }
            }else {
              return and__3822__auto____15272
            }
          }else {
            return and__3822__auto____15271
          }
        }())
      };
      var ep3__4 = function() {
        var G__15295__delegate = function(x, y, z, args) {
          return cljs.core.boolean$.call(null, function() {
            var and__3822__auto____15279 = ep3.call(null, x, y, z);
            if(cljs.core.truth_(and__3822__auto____15279)) {
              return cljs.core.every_QMARK_.call(null, function(p1__15091_SHARP_) {
                var and__3822__auto____15280 = p1.call(null, p1__15091_SHARP_);
                if(cljs.core.truth_(and__3822__auto____15280)) {
                  var and__3822__auto____15281 = p2.call(null, p1__15091_SHARP_);
                  if(cljs.core.truth_(and__3822__auto____15281)) {
                    return p3.call(null, p1__15091_SHARP_)
                  }else {
                    return and__3822__auto____15281
                  }
                }else {
                  return and__3822__auto____15280
                }
              }, args)
            }else {
              return and__3822__auto____15279
            }
          }())
        };
        var G__15295 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__15295__delegate.call(this, x, y, z, args)
        };
        G__15295.cljs$lang$maxFixedArity = 3;
        G__15295.cljs$lang$applyTo = function(arglist__15296) {
          var x = cljs.core.first(arglist__15296);
          var y = cljs.core.first(cljs.core.next(arglist__15296));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__15296)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__15296)));
          return G__15295__delegate(x, y, z, args)
        };
        G__15295.cljs$lang$arity$variadic = G__15295__delegate;
        return G__15295
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
    var G__15297__delegate = function(p1, p2, p3, ps) {
      var ps__15282 = cljs.core.list_STAR_.call(null, p1, p2, p3, ps);
      return function() {
        var epn = null;
        var epn__0 = function() {
          return true
        };
        var epn__1 = function(x) {
          return cljs.core.every_QMARK_.call(null, function(p1__15092_SHARP_) {
            return p1__15092_SHARP_.call(null, x)
          }, ps__15282)
        };
        var epn__2 = function(x, y) {
          return cljs.core.every_QMARK_.call(null, function(p1__15093_SHARP_) {
            var and__3822__auto____15287 = p1__15093_SHARP_.call(null, x);
            if(cljs.core.truth_(and__3822__auto____15287)) {
              return p1__15093_SHARP_.call(null, y)
            }else {
              return and__3822__auto____15287
            }
          }, ps__15282)
        };
        var epn__3 = function(x, y, z) {
          return cljs.core.every_QMARK_.call(null, function(p1__15094_SHARP_) {
            var and__3822__auto____15288 = p1__15094_SHARP_.call(null, x);
            if(cljs.core.truth_(and__3822__auto____15288)) {
              var and__3822__auto____15289 = p1__15094_SHARP_.call(null, y);
              if(cljs.core.truth_(and__3822__auto____15289)) {
                return p1__15094_SHARP_.call(null, z)
              }else {
                return and__3822__auto____15289
              }
            }else {
              return and__3822__auto____15288
            }
          }, ps__15282)
        };
        var epn__4 = function() {
          var G__15298__delegate = function(x, y, z, args) {
            return cljs.core.boolean$.call(null, function() {
              var and__3822__auto____15290 = epn.call(null, x, y, z);
              if(cljs.core.truth_(and__3822__auto____15290)) {
                return cljs.core.every_QMARK_.call(null, function(p1__15095_SHARP_) {
                  return cljs.core.every_QMARK_.call(null, p1__15095_SHARP_, args)
                }, ps__15282)
              }else {
                return and__3822__auto____15290
              }
            }())
          };
          var G__15298 = function(x, y, z, var_args) {
            var args = null;
            if(goog.isDef(var_args)) {
              args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
            }
            return G__15298__delegate.call(this, x, y, z, args)
          };
          G__15298.cljs$lang$maxFixedArity = 3;
          G__15298.cljs$lang$applyTo = function(arglist__15299) {
            var x = cljs.core.first(arglist__15299);
            var y = cljs.core.first(cljs.core.next(arglist__15299));
            var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__15299)));
            var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__15299)));
            return G__15298__delegate(x, y, z, args)
          };
          G__15298.cljs$lang$arity$variadic = G__15298__delegate;
          return G__15298
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
    var G__15297 = function(p1, p2, p3, var_args) {
      var ps = null;
      if(goog.isDef(var_args)) {
        ps = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__15297__delegate.call(this, p1, p2, p3, ps)
    };
    G__15297.cljs$lang$maxFixedArity = 3;
    G__15297.cljs$lang$applyTo = function(arglist__15300) {
      var p1 = cljs.core.first(arglist__15300);
      var p2 = cljs.core.first(cljs.core.next(arglist__15300));
      var p3 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__15300)));
      var ps = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__15300)));
      return G__15297__delegate(p1, p2, p3, ps)
    };
    G__15297.cljs$lang$arity$variadic = G__15297__delegate;
    return G__15297
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
        var or__3824__auto____15381 = p.call(null, x);
        if(cljs.core.truth_(or__3824__auto____15381)) {
          return or__3824__auto____15381
        }else {
          return p.call(null, y)
        }
      };
      var sp1__3 = function(x, y, z) {
        var or__3824__auto____15382 = p.call(null, x);
        if(cljs.core.truth_(or__3824__auto____15382)) {
          return or__3824__auto____15382
        }else {
          var or__3824__auto____15383 = p.call(null, y);
          if(cljs.core.truth_(or__3824__auto____15383)) {
            return or__3824__auto____15383
          }else {
            return p.call(null, z)
          }
        }
      };
      var sp1__4 = function() {
        var G__15452__delegate = function(x, y, z, args) {
          var or__3824__auto____15384 = sp1.call(null, x, y, z);
          if(cljs.core.truth_(or__3824__auto____15384)) {
            return or__3824__auto____15384
          }else {
            return cljs.core.some.call(null, p, args)
          }
        };
        var G__15452 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__15452__delegate.call(this, x, y, z, args)
        };
        G__15452.cljs$lang$maxFixedArity = 3;
        G__15452.cljs$lang$applyTo = function(arglist__15453) {
          var x = cljs.core.first(arglist__15453);
          var y = cljs.core.first(cljs.core.next(arglist__15453));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__15453)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__15453)));
          return G__15452__delegate(x, y, z, args)
        };
        G__15452.cljs$lang$arity$variadic = G__15452__delegate;
        return G__15452
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
        var or__3824__auto____15396 = p1.call(null, x);
        if(cljs.core.truth_(or__3824__auto____15396)) {
          return or__3824__auto____15396
        }else {
          return p2.call(null, x)
        }
      };
      var sp2__2 = function(x, y) {
        var or__3824__auto____15397 = p1.call(null, x);
        if(cljs.core.truth_(or__3824__auto____15397)) {
          return or__3824__auto____15397
        }else {
          var or__3824__auto____15398 = p1.call(null, y);
          if(cljs.core.truth_(or__3824__auto____15398)) {
            return or__3824__auto____15398
          }else {
            var or__3824__auto____15399 = p2.call(null, x);
            if(cljs.core.truth_(or__3824__auto____15399)) {
              return or__3824__auto____15399
            }else {
              return p2.call(null, y)
            }
          }
        }
      };
      var sp2__3 = function(x, y, z) {
        var or__3824__auto____15400 = p1.call(null, x);
        if(cljs.core.truth_(or__3824__auto____15400)) {
          return or__3824__auto____15400
        }else {
          var or__3824__auto____15401 = p1.call(null, y);
          if(cljs.core.truth_(or__3824__auto____15401)) {
            return or__3824__auto____15401
          }else {
            var or__3824__auto____15402 = p1.call(null, z);
            if(cljs.core.truth_(or__3824__auto____15402)) {
              return or__3824__auto____15402
            }else {
              var or__3824__auto____15403 = p2.call(null, x);
              if(cljs.core.truth_(or__3824__auto____15403)) {
                return or__3824__auto____15403
              }else {
                var or__3824__auto____15404 = p2.call(null, y);
                if(cljs.core.truth_(or__3824__auto____15404)) {
                  return or__3824__auto____15404
                }else {
                  return p2.call(null, z)
                }
              }
            }
          }
        }
      };
      var sp2__4 = function() {
        var G__15454__delegate = function(x, y, z, args) {
          var or__3824__auto____15405 = sp2.call(null, x, y, z);
          if(cljs.core.truth_(or__3824__auto____15405)) {
            return or__3824__auto____15405
          }else {
            return cljs.core.some.call(null, function(p1__15135_SHARP_) {
              var or__3824__auto____15406 = p1.call(null, p1__15135_SHARP_);
              if(cljs.core.truth_(or__3824__auto____15406)) {
                return or__3824__auto____15406
              }else {
                return p2.call(null, p1__15135_SHARP_)
              }
            }, args)
          }
        };
        var G__15454 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__15454__delegate.call(this, x, y, z, args)
        };
        G__15454.cljs$lang$maxFixedArity = 3;
        G__15454.cljs$lang$applyTo = function(arglist__15455) {
          var x = cljs.core.first(arglist__15455);
          var y = cljs.core.first(cljs.core.next(arglist__15455));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__15455)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__15455)));
          return G__15454__delegate(x, y, z, args)
        };
        G__15454.cljs$lang$arity$variadic = G__15454__delegate;
        return G__15454
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
        var or__3824__auto____15425 = p1.call(null, x);
        if(cljs.core.truth_(or__3824__auto____15425)) {
          return or__3824__auto____15425
        }else {
          var or__3824__auto____15426 = p2.call(null, x);
          if(cljs.core.truth_(or__3824__auto____15426)) {
            return or__3824__auto____15426
          }else {
            return p3.call(null, x)
          }
        }
      };
      var sp3__2 = function(x, y) {
        var or__3824__auto____15427 = p1.call(null, x);
        if(cljs.core.truth_(or__3824__auto____15427)) {
          return or__3824__auto____15427
        }else {
          var or__3824__auto____15428 = p2.call(null, x);
          if(cljs.core.truth_(or__3824__auto____15428)) {
            return or__3824__auto____15428
          }else {
            var or__3824__auto____15429 = p3.call(null, x);
            if(cljs.core.truth_(or__3824__auto____15429)) {
              return or__3824__auto____15429
            }else {
              var or__3824__auto____15430 = p1.call(null, y);
              if(cljs.core.truth_(or__3824__auto____15430)) {
                return or__3824__auto____15430
              }else {
                var or__3824__auto____15431 = p2.call(null, y);
                if(cljs.core.truth_(or__3824__auto____15431)) {
                  return or__3824__auto____15431
                }else {
                  return p3.call(null, y)
                }
              }
            }
          }
        }
      };
      var sp3__3 = function(x, y, z) {
        var or__3824__auto____15432 = p1.call(null, x);
        if(cljs.core.truth_(or__3824__auto____15432)) {
          return or__3824__auto____15432
        }else {
          var or__3824__auto____15433 = p2.call(null, x);
          if(cljs.core.truth_(or__3824__auto____15433)) {
            return or__3824__auto____15433
          }else {
            var or__3824__auto____15434 = p3.call(null, x);
            if(cljs.core.truth_(or__3824__auto____15434)) {
              return or__3824__auto____15434
            }else {
              var or__3824__auto____15435 = p1.call(null, y);
              if(cljs.core.truth_(or__3824__auto____15435)) {
                return or__3824__auto____15435
              }else {
                var or__3824__auto____15436 = p2.call(null, y);
                if(cljs.core.truth_(or__3824__auto____15436)) {
                  return or__3824__auto____15436
                }else {
                  var or__3824__auto____15437 = p3.call(null, y);
                  if(cljs.core.truth_(or__3824__auto____15437)) {
                    return or__3824__auto____15437
                  }else {
                    var or__3824__auto____15438 = p1.call(null, z);
                    if(cljs.core.truth_(or__3824__auto____15438)) {
                      return or__3824__auto____15438
                    }else {
                      var or__3824__auto____15439 = p2.call(null, z);
                      if(cljs.core.truth_(or__3824__auto____15439)) {
                        return or__3824__auto____15439
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
        var G__15456__delegate = function(x, y, z, args) {
          var or__3824__auto____15440 = sp3.call(null, x, y, z);
          if(cljs.core.truth_(or__3824__auto____15440)) {
            return or__3824__auto____15440
          }else {
            return cljs.core.some.call(null, function(p1__15136_SHARP_) {
              var or__3824__auto____15441 = p1.call(null, p1__15136_SHARP_);
              if(cljs.core.truth_(or__3824__auto____15441)) {
                return or__3824__auto____15441
              }else {
                var or__3824__auto____15442 = p2.call(null, p1__15136_SHARP_);
                if(cljs.core.truth_(or__3824__auto____15442)) {
                  return or__3824__auto____15442
                }else {
                  return p3.call(null, p1__15136_SHARP_)
                }
              }
            }, args)
          }
        };
        var G__15456 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__15456__delegate.call(this, x, y, z, args)
        };
        G__15456.cljs$lang$maxFixedArity = 3;
        G__15456.cljs$lang$applyTo = function(arglist__15457) {
          var x = cljs.core.first(arglist__15457);
          var y = cljs.core.first(cljs.core.next(arglist__15457));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__15457)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__15457)));
          return G__15456__delegate(x, y, z, args)
        };
        G__15456.cljs$lang$arity$variadic = G__15456__delegate;
        return G__15456
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
    var G__15458__delegate = function(p1, p2, p3, ps) {
      var ps__15443 = cljs.core.list_STAR_.call(null, p1, p2, p3, ps);
      return function() {
        var spn = null;
        var spn__0 = function() {
          return null
        };
        var spn__1 = function(x) {
          return cljs.core.some.call(null, function(p1__15137_SHARP_) {
            return p1__15137_SHARP_.call(null, x)
          }, ps__15443)
        };
        var spn__2 = function(x, y) {
          return cljs.core.some.call(null, function(p1__15138_SHARP_) {
            var or__3824__auto____15448 = p1__15138_SHARP_.call(null, x);
            if(cljs.core.truth_(or__3824__auto____15448)) {
              return or__3824__auto____15448
            }else {
              return p1__15138_SHARP_.call(null, y)
            }
          }, ps__15443)
        };
        var spn__3 = function(x, y, z) {
          return cljs.core.some.call(null, function(p1__15139_SHARP_) {
            var or__3824__auto____15449 = p1__15139_SHARP_.call(null, x);
            if(cljs.core.truth_(or__3824__auto____15449)) {
              return or__3824__auto____15449
            }else {
              var or__3824__auto____15450 = p1__15139_SHARP_.call(null, y);
              if(cljs.core.truth_(or__3824__auto____15450)) {
                return or__3824__auto____15450
              }else {
                return p1__15139_SHARP_.call(null, z)
              }
            }
          }, ps__15443)
        };
        var spn__4 = function() {
          var G__15459__delegate = function(x, y, z, args) {
            var or__3824__auto____15451 = spn.call(null, x, y, z);
            if(cljs.core.truth_(or__3824__auto____15451)) {
              return or__3824__auto____15451
            }else {
              return cljs.core.some.call(null, function(p1__15140_SHARP_) {
                return cljs.core.some.call(null, p1__15140_SHARP_, args)
              }, ps__15443)
            }
          };
          var G__15459 = function(x, y, z, var_args) {
            var args = null;
            if(goog.isDef(var_args)) {
              args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
            }
            return G__15459__delegate.call(this, x, y, z, args)
          };
          G__15459.cljs$lang$maxFixedArity = 3;
          G__15459.cljs$lang$applyTo = function(arglist__15460) {
            var x = cljs.core.first(arglist__15460);
            var y = cljs.core.first(cljs.core.next(arglist__15460));
            var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__15460)));
            var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__15460)));
            return G__15459__delegate(x, y, z, args)
          };
          G__15459.cljs$lang$arity$variadic = G__15459__delegate;
          return G__15459
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
    var G__15458 = function(p1, p2, p3, var_args) {
      var ps = null;
      if(goog.isDef(var_args)) {
        ps = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__15458__delegate.call(this, p1, p2, p3, ps)
    };
    G__15458.cljs$lang$maxFixedArity = 3;
    G__15458.cljs$lang$applyTo = function(arglist__15461) {
      var p1 = cljs.core.first(arglist__15461);
      var p2 = cljs.core.first(cljs.core.next(arglist__15461));
      var p3 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__15461)));
      var ps = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__15461)));
      return G__15458__delegate(p1, p2, p3, ps)
    };
    G__15458.cljs$lang$arity$variadic = G__15458__delegate;
    return G__15458
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
      var temp__3974__auto____15480 = cljs.core.seq.call(null, coll);
      if(temp__3974__auto____15480) {
        var s__15481 = temp__3974__auto____15480;
        if(cljs.core.chunked_seq_QMARK_.call(null, s__15481)) {
          var c__15482 = cljs.core.chunk_first.call(null, s__15481);
          var size__15483 = cljs.core.count.call(null, c__15482);
          var b__15484 = cljs.core.chunk_buffer.call(null, size__15483);
          var n__2527__auto____15485 = size__15483;
          var i__15486 = 0;
          while(true) {
            if(i__15486 < n__2527__auto____15485) {
              cljs.core.chunk_append.call(null, b__15484, f.call(null, cljs.core._nth.call(null, c__15482, i__15486)));
              var G__15498 = i__15486 + 1;
              i__15486 = G__15498;
              continue
            }else {
            }
            break
          }
          return cljs.core.chunk_cons.call(null, cljs.core.chunk.call(null, b__15484), map.call(null, f, cljs.core.chunk_rest.call(null, s__15481)))
        }else {
          return cljs.core.cons.call(null, f.call(null, cljs.core.first.call(null, s__15481)), map.call(null, f, cljs.core.rest.call(null, s__15481)))
        }
      }else {
        return null
      }
    }, null)
  };
  var map__3 = function(f, c1, c2) {
    return new cljs.core.LazySeq(null, false, function() {
      var s1__15487 = cljs.core.seq.call(null, c1);
      var s2__15488 = cljs.core.seq.call(null, c2);
      if(function() {
        var and__3822__auto____15489 = s1__15487;
        if(and__3822__auto____15489) {
          return s2__15488
        }else {
          return and__3822__auto____15489
        }
      }()) {
        return cljs.core.cons.call(null, f.call(null, cljs.core.first.call(null, s1__15487), cljs.core.first.call(null, s2__15488)), map.call(null, f, cljs.core.rest.call(null, s1__15487), cljs.core.rest.call(null, s2__15488)))
      }else {
        return null
      }
    }, null)
  };
  var map__4 = function(f, c1, c2, c3) {
    return new cljs.core.LazySeq(null, false, function() {
      var s1__15490 = cljs.core.seq.call(null, c1);
      var s2__15491 = cljs.core.seq.call(null, c2);
      var s3__15492 = cljs.core.seq.call(null, c3);
      if(function() {
        var and__3822__auto____15493 = s1__15490;
        if(and__3822__auto____15493) {
          var and__3822__auto____15494 = s2__15491;
          if(and__3822__auto____15494) {
            return s3__15492
          }else {
            return and__3822__auto____15494
          }
        }else {
          return and__3822__auto____15493
        }
      }()) {
        return cljs.core.cons.call(null, f.call(null, cljs.core.first.call(null, s1__15490), cljs.core.first.call(null, s2__15491), cljs.core.first.call(null, s3__15492)), map.call(null, f, cljs.core.rest.call(null, s1__15490), cljs.core.rest.call(null, s2__15491), cljs.core.rest.call(null, s3__15492)))
      }else {
        return null
      }
    }, null)
  };
  var map__5 = function() {
    var G__15499__delegate = function(f, c1, c2, c3, colls) {
      var step__15497 = function step(cs) {
        return new cljs.core.LazySeq(null, false, function() {
          var ss__15496 = map.call(null, cljs.core.seq, cs);
          if(cljs.core.every_QMARK_.call(null, cljs.core.identity, ss__15496)) {
            return cljs.core.cons.call(null, map.call(null, cljs.core.first, ss__15496), step.call(null, map.call(null, cljs.core.rest, ss__15496)))
          }else {
            return null
          }
        }, null)
      };
      return map.call(null, function(p1__15301_SHARP_) {
        return cljs.core.apply.call(null, f, p1__15301_SHARP_)
      }, step__15497.call(null, cljs.core.conj.call(null, colls, c3, c2, c1)))
    };
    var G__15499 = function(f, c1, c2, c3, var_args) {
      var colls = null;
      if(goog.isDef(var_args)) {
        colls = cljs.core.array_seq(Array.prototype.slice.call(arguments, 4), 0)
      }
      return G__15499__delegate.call(this, f, c1, c2, c3, colls)
    };
    G__15499.cljs$lang$maxFixedArity = 4;
    G__15499.cljs$lang$applyTo = function(arglist__15500) {
      var f = cljs.core.first(arglist__15500);
      var c1 = cljs.core.first(cljs.core.next(arglist__15500));
      var c2 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__15500)));
      var c3 = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__15500))));
      var colls = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(arglist__15500))));
      return G__15499__delegate(f, c1, c2, c3, colls)
    };
    G__15499.cljs$lang$arity$variadic = G__15499__delegate;
    return G__15499
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
      var temp__3974__auto____15503 = cljs.core.seq.call(null, coll);
      if(temp__3974__auto____15503) {
        var s__15504 = temp__3974__auto____15503;
        return cljs.core.cons.call(null, cljs.core.first.call(null, s__15504), take.call(null, n - 1, cljs.core.rest.call(null, s__15504)))
      }else {
        return null
      }
    }else {
      return null
    }
  }, null)
};
cljs.core.drop = function drop(n, coll) {
  var step__15510 = function(n, coll) {
    while(true) {
      var s__15508 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(function() {
        var and__3822__auto____15509 = n > 0;
        if(and__3822__auto____15509) {
          return s__15508
        }else {
          return and__3822__auto____15509
        }
      }())) {
        var G__15511 = n - 1;
        var G__15512 = cljs.core.rest.call(null, s__15508);
        n = G__15511;
        coll = G__15512;
        continue
      }else {
        return s__15508
      }
      break
    }
  };
  return new cljs.core.LazySeq(null, false, function() {
    return step__15510.call(null, n, coll)
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
  var s__15515 = cljs.core.seq.call(null, coll);
  var lead__15516 = cljs.core.seq.call(null, cljs.core.drop.call(null, n, coll));
  while(true) {
    if(lead__15516) {
      var G__15517 = cljs.core.next.call(null, s__15515);
      var G__15518 = cljs.core.next.call(null, lead__15516);
      s__15515 = G__15517;
      lead__15516 = G__15518;
      continue
    }else {
      return s__15515
    }
    break
  }
};
cljs.core.drop_while = function drop_while(pred, coll) {
  var step__15524 = function(pred, coll) {
    while(true) {
      var s__15522 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(function() {
        var and__3822__auto____15523 = s__15522;
        if(and__3822__auto____15523) {
          return pred.call(null, cljs.core.first.call(null, s__15522))
        }else {
          return and__3822__auto____15523
        }
      }())) {
        var G__15525 = pred;
        var G__15526 = cljs.core.rest.call(null, s__15522);
        pred = G__15525;
        coll = G__15526;
        continue
      }else {
        return s__15522
      }
      break
    }
  };
  return new cljs.core.LazySeq(null, false, function() {
    return step__15524.call(null, pred, coll)
  }, null)
};
cljs.core.cycle = function cycle(coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__3974__auto____15529 = cljs.core.seq.call(null, coll);
    if(temp__3974__auto____15529) {
      var s__15530 = temp__3974__auto____15529;
      return cljs.core.concat.call(null, s__15530, cycle.call(null, s__15530))
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
      var s1__15535 = cljs.core.seq.call(null, c1);
      var s2__15536 = cljs.core.seq.call(null, c2);
      if(function() {
        var and__3822__auto____15537 = s1__15535;
        if(and__3822__auto____15537) {
          return s2__15536
        }else {
          return and__3822__auto____15537
        }
      }()) {
        return cljs.core.cons.call(null, cljs.core.first.call(null, s1__15535), cljs.core.cons.call(null, cljs.core.first.call(null, s2__15536), interleave.call(null, cljs.core.rest.call(null, s1__15535), cljs.core.rest.call(null, s2__15536))))
      }else {
        return null
      }
    }, null)
  };
  var interleave__3 = function() {
    var G__15539__delegate = function(c1, c2, colls) {
      return new cljs.core.LazySeq(null, false, function() {
        var ss__15538 = cljs.core.map.call(null, cljs.core.seq, cljs.core.conj.call(null, colls, c2, c1));
        if(cljs.core.every_QMARK_.call(null, cljs.core.identity, ss__15538)) {
          return cljs.core.concat.call(null, cljs.core.map.call(null, cljs.core.first, ss__15538), cljs.core.apply.call(null, interleave, cljs.core.map.call(null, cljs.core.rest, ss__15538)))
        }else {
          return null
        }
      }, null)
    };
    var G__15539 = function(c1, c2, var_args) {
      var colls = null;
      if(goog.isDef(var_args)) {
        colls = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__15539__delegate.call(this, c1, c2, colls)
    };
    G__15539.cljs$lang$maxFixedArity = 2;
    G__15539.cljs$lang$applyTo = function(arglist__15540) {
      var c1 = cljs.core.first(arglist__15540);
      var c2 = cljs.core.first(cljs.core.next(arglist__15540));
      var colls = cljs.core.rest(cljs.core.next(arglist__15540));
      return G__15539__delegate(c1, c2, colls)
    };
    G__15539.cljs$lang$arity$variadic = G__15539__delegate;
    return G__15539
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
  var cat__15550 = function cat(coll, colls) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3971__auto____15548 = cljs.core.seq.call(null, coll);
      if(temp__3971__auto____15548) {
        var coll__15549 = temp__3971__auto____15548;
        return cljs.core.cons.call(null, cljs.core.first.call(null, coll__15549), cat.call(null, cljs.core.rest.call(null, coll__15549), colls))
      }else {
        if(cljs.core.seq.call(null, colls)) {
          return cat.call(null, cljs.core.first.call(null, colls), cljs.core.rest.call(null, colls))
        }else {
          return null
        }
      }
    }, null)
  };
  return cat__15550.call(null, null, colls)
};
cljs.core.mapcat = function() {
  var mapcat = null;
  var mapcat__2 = function(f, coll) {
    return cljs.core.flatten1.call(null, cljs.core.map.call(null, f, coll))
  };
  var mapcat__3 = function() {
    var G__15551__delegate = function(f, coll, colls) {
      return cljs.core.flatten1.call(null, cljs.core.apply.call(null, cljs.core.map, f, coll, colls))
    };
    var G__15551 = function(f, coll, var_args) {
      var colls = null;
      if(goog.isDef(var_args)) {
        colls = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__15551__delegate.call(this, f, coll, colls)
    };
    G__15551.cljs$lang$maxFixedArity = 2;
    G__15551.cljs$lang$applyTo = function(arglist__15552) {
      var f = cljs.core.first(arglist__15552);
      var coll = cljs.core.first(cljs.core.next(arglist__15552));
      var colls = cljs.core.rest(cljs.core.next(arglist__15552));
      return G__15551__delegate(f, coll, colls)
    };
    G__15551.cljs$lang$arity$variadic = G__15551__delegate;
    return G__15551
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
    var temp__3974__auto____15562 = cljs.core.seq.call(null, coll);
    if(temp__3974__auto____15562) {
      var s__15563 = temp__3974__auto____15562;
      if(cljs.core.chunked_seq_QMARK_.call(null, s__15563)) {
        var c__15564 = cljs.core.chunk_first.call(null, s__15563);
        var size__15565 = cljs.core.count.call(null, c__15564);
        var b__15566 = cljs.core.chunk_buffer.call(null, size__15565);
        var n__2527__auto____15567 = size__15565;
        var i__15568 = 0;
        while(true) {
          if(i__15568 < n__2527__auto____15567) {
            if(cljs.core.truth_(pred.call(null, cljs.core._nth.call(null, c__15564, i__15568)))) {
              cljs.core.chunk_append.call(null, b__15566, cljs.core._nth.call(null, c__15564, i__15568))
            }else {
            }
            var G__15571 = i__15568 + 1;
            i__15568 = G__15571;
            continue
          }else {
          }
          break
        }
        return cljs.core.chunk_cons.call(null, cljs.core.chunk.call(null, b__15566), filter.call(null, pred, cljs.core.chunk_rest.call(null, s__15563)))
      }else {
        var f__15569 = cljs.core.first.call(null, s__15563);
        var r__15570 = cljs.core.rest.call(null, s__15563);
        if(cljs.core.truth_(pred.call(null, f__15569))) {
          return cljs.core.cons.call(null, f__15569, filter.call(null, pred, r__15570))
        }else {
          return filter.call(null, pred, r__15570)
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
  var walk__15574 = function walk(node) {
    return new cljs.core.LazySeq(null, false, function() {
      return cljs.core.cons.call(null, node, cljs.core.truth_(branch_QMARK_.call(null, node)) ? cljs.core.mapcat.call(null, walk, children.call(null, node)) : null)
    }, null)
  };
  return walk__15574.call(null, root)
};
cljs.core.flatten = function flatten(x) {
  return cljs.core.filter.call(null, function(p1__15572_SHARP_) {
    return!cljs.core.sequential_QMARK_.call(null, p1__15572_SHARP_)
  }, cljs.core.rest.call(null, cljs.core.tree_seq.call(null, cljs.core.sequential_QMARK_, cljs.core.seq, x)))
};
cljs.core.into = function into(to, from) {
  if(function() {
    var G__15578__15579 = to;
    if(G__15578__15579) {
      if(function() {
        var or__3824__auto____15580 = G__15578__15579.cljs$lang$protocol_mask$partition1$ & 1;
        if(or__3824__auto____15580) {
          return or__3824__auto____15580
        }else {
          return G__15578__15579.cljs$core$IEditableCollection$
        }
      }()) {
        return true
      }else {
        if(!G__15578__15579.cljs$lang$protocol_mask$partition1$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.IEditableCollection, G__15578__15579)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.IEditableCollection, G__15578__15579)
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
    var G__15581__delegate = function(f, c1, c2, c3, colls) {
      return cljs.core.into.call(null, cljs.core.PersistentVector.EMPTY, cljs.core.apply.call(null, cljs.core.map, f, c1, c2, c3, colls))
    };
    var G__15581 = function(f, c1, c2, c3, var_args) {
      var colls = null;
      if(goog.isDef(var_args)) {
        colls = cljs.core.array_seq(Array.prototype.slice.call(arguments, 4), 0)
      }
      return G__15581__delegate.call(this, f, c1, c2, c3, colls)
    };
    G__15581.cljs$lang$maxFixedArity = 4;
    G__15581.cljs$lang$applyTo = function(arglist__15582) {
      var f = cljs.core.first(arglist__15582);
      var c1 = cljs.core.first(cljs.core.next(arglist__15582));
      var c2 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__15582)));
      var c3 = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__15582))));
      var colls = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(arglist__15582))));
      return G__15581__delegate(f, c1, c2, c3, colls)
    };
    G__15581.cljs$lang$arity$variadic = G__15581__delegate;
    return G__15581
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
      var temp__3974__auto____15589 = cljs.core.seq.call(null, coll);
      if(temp__3974__auto____15589) {
        var s__15590 = temp__3974__auto____15589;
        var p__15591 = cljs.core.take.call(null, n, s__15590);
        if(n === cljs.core.count.call(null, p__15591)) {
          return cljs.core.cons.call(null, p__15591, partition.call(null, n, step, cljs.core.drop.call(null, step, s__15590)))
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
      var temp__3974__auto____15592 = cljs.core.seq.call(null, coll);
      if(temp__3974__auto____15592) {
        var s__15593 = temp__3974__auto____15592;
        var p__15594 = cljs.core.take.call(null, n, s__15593);
        if(n === cljs.core.count.call(null, p__15594)) {
          return cljs.core.cons.call(null, p__15594, partition.call(null, n, step, pad, cljs.core.drop.call(null, step, s__15593)))
        }else {
          return cljs.core.list.call(null, cljs.core.take.call(null, n, cljs.core.concat.call(null, p__15594, pad)))
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
    var sentinel__15599 = cljs.core.lookup_sentinel;
    var m__15600 = m;
    var ks__15601 = cljs.core.seq.call(null, ks);
    while(true) {
      if(ks__15601) {
        var m__15602 = cljs.core._lookup.call(null, m__15600, cljs.core.first.call(null, ks__15601), sentinel__15599);
        if(sentinel__15599 === m__15602) {
          return not_found
        }else {
          var G__15603 = sentinel__15599;
          var G__15604 = m__15602;
          var G__15605 = cljs.core.next.call(null, ks__15601);
          sentinel__15599 = G__15603;
          m__15600 = G__15604;
          ks__15601 = G__15605;
          continue
        }
      }else {
        return m__15600
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
cljs.core.assoc_in = function assoc_in(m, p__15606, v) {
  var vec__15611__15612 = p__15606;
  var k__15613 = cljs.core.nth.call(null, vec__15611__15612, 0, null);
  var ks__15614 = cljs.core.nthnext.call(null, vec__15611__15612, 1);
  if(cljs.core.truth_(ks__15614)) {
    return cljs.core.assoc.call(null, m, k__15613, assoc_in.call(null, cljs.core._lookup.call(null, m, k__15613, null), ks__15614, v))
  }else {
    return cljs.core.assoc.call(null, m, k__15613, v)
  }
};
cljs.core.update_in = function() {
  var update_in__delegate = function(m, p__15615, f, args) {
    var vec__15620__15621 = p__15615;
    var k__15622 = cljs.core.nth.call(null, vec__15620__15621, 0, null);
    var ks__15623 = cljs.core.nthnext.call(null, vec__15620__15621, 1);
    if(cljs.core.truth_(ks__15623)) {
      return cljs.core.assoc.call(null, m, k__15622, cljs.core.apply.call(null, update_in, cljs.core._lookup.call(null, m, k__15622, null), ks__15623, f, args))
    }else {
      return cljs.core.assoc.call(null, m, k__15622, cljs.core.apply.call(null, f, cljs.core._lookup.call(null, m, k__15622, null), args))
    }
  };
  var update_in = function(m, p__15615, f, var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
    }
    return update_in__delegate.call(this, m, p__15615, f, args)
  };
  update_in.cljs$lang$maxFixedArity = 3;
  update_in.cljs$lang$applyTo = function(arglist__15624) {
    var m = cljs.core.first(arglist__15624);
    var p__15615 = cljs.core.first(cljs.core.next(arglist__15624));
    var f = cljs.core.first(cljs.core.next(cljs.core.next(arglist__15624)));
    var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__15624)));
    return update_in__delegate(m, p__15615, f, args)
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
  var this__15627 = this;
  var h__2192__auto____15628 = this__15627.__hash;
  if(!(h__2192__auto____15628 == null)) {
    return h__2192__auto____15628
  }else {
    var h__2192__auto____15629 = cljs.core.hash_coll.call(null, coll);
    this__15627.__hash = h__2192__auto____15629;
    return h__2192__auto____15629
  }
};
cljs.core.Vector.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__15630 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, null)
};
cljs.core.Vector.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__15631 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, not_found)
};
cljs.core.Vector.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__15632 = this;
  var new_array__15633 = this__15632.array.slice();
  new_array__15633[k] = v;
  return new cljs.core.Vector(this__15632.meta, new_array__15633, null)
};
cljs.core.Vector.prototype.call = function() {
  var G__15664 = null;
  var G__15664__2 = function(this_sym15634, k) {
    var this__15636 = this;
    var this_sym15634__15637 = this;
    var coll__15638 = this_sym15634__15637;
    return coll__15638.cljs$core$ILookup$_lookup$arity$2(coll__15638, k)
  };
  var G__15664__3 = function(this_sym15635, k, not_found) {
    var this__15636 = this;
    var this_sym15635__15639 = this;
    var coll__15640 = this_sym15635__15639;
    return coll__15640.cljs$core$ILookup$_lookup$arity$3(coll__15640, k, not_found)
  };
  G__15664 = function(this_sym15635, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__15664__2.call(this, this_sym15635, k);
      case 3:
        return G__15664__3.call(this, this_sym15635, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__15664
}();
cljs.core.Vector.prototype.apply = function(this_sym15625, args15626) {
  var this__15641 = this;
  return this_sym15625.call.apply(this_sym15625, [this_sym15625].concat(args15626.slice()))
};
cljs.core.Vector.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__15642 = this;
  var new_array__15643 = this__15642.array.slice();
  new_array__15643.push(o);
  return new cljs.core.Vector(this__15642.meta, new_array__15643, null)
};
cljs.core.Vector.prototype.toString = function() {
  var this__15644 = this;
  var this__15645 = this;
  return cljs.core.pr_str.call(null, this__15645)
};
cljs.core.Vector.prototype.cljs$core$IReduce$_reduce$arity$2 = function(v, f) {
  var this__15646 = this;
  return cljs.core.ci_reduce.call(null, this__15646.array, f)
};
cljs.core.Vector.prototype.cljs$core$IReduce$_reduce$arity$3 = function(v, f, start) {
  var this__15647 = this;
  return cljs.core.ci_reduce.call(null, this__15647.array, f, start)
};
cljs.core.Vector.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__15648 = this;
  if(this__15648.array.length > 0) {
    var vector_seq__15649 = function vector_seq(i) {
      return new cljs.core.LazySeq(null, false, function() {
        if(i < this__15648.array.length) {
          return cljs.core.cons.call(null, this__15648.array[i], vector_seq.call(null, i + 1))
        }else {
          return null
        }
      }, null)
    };
    return vector_seq__15649.call(null, 0)
  }else {
    return null
  }
};
cljs.core.Vector.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__15650 = this;
  return this__15650.array.length
};
cljs.core.Vector.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__15651 = this;
  var count__15652 = this__15651.array.length;
  if(count__15652 > 0) {
    return this__15651.array[count__15652 - 1]
  }else {
    return null
  }
};
cljs.core.Vector.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__15653 = this;
  if(this__15653.array.length > 0) {
    var new_array__15654 = this__15653.array.slice();
    new_array__15654.pop();
    return new cljs.core.Vector(this__15653.meta, new_array__15654, null)
  }else {
    throw new Error("Can't pop empty vector");
  }
};
cljs.core.Vector.prototype.cljs$core$IVector$_assoc_n$arity$3 = function(coll, n, val) {
  var this__15655 = this;
  return coll.cljs$core$IAssociative$_assoc$arity$3(coll, n, val)
};
cljs.core.Vector.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__15656 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.Vector.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__15657 = this;
  return new cljs.core.Vector(meta, this__15657.array, this__15657.__hash)
};
cljs.core.Vector.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__15658 = this;
  return this__15658.meta
};
cljs.core.Vector.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, n) {
  var this__15659 = this;
  if(function() {
    var and__3822__auto____15660 = 0 <= n;
    if(and__3822__auto____15660) {
      return n < this__15659.array.length
    }else {
      return and__3822__auto____15660
    }
  }()) {
    return this__15659.array[n]
  }else {
    return null
  }
};
cljs.core.Vector.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, n, not_found) {
  var this__15661 = this;
  if(function() {
    var and__3822__auto____15662 = 0 <= n;
    if(and__3822__auto____15662) {
      return n < this__15661.array.length
    }else {
      return and__3822__auto____15662
    }
  }()) {
    return this__15661.array[n]
  }else {
    return not_found
  }
};
cljs.core.Vector.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__15663 = this;
  return cljs.core.with_meta.call(null, cljs.core.Vector.EMPTY, this__15663.meta)
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
  var cnt__15666 = pv.cnt;
  if(cnt__15666 < 32) {
    return 0
  }else {
    return cnt__15666 - 1 >>> 5 << 5
  }
};
cljs.core.new_path = function new_path(edit, level, node) {
  var ll__15672 = level;
  var ret__15673 = node;
  while(true) {
    if(ll__15672 === 0) {
      return ret__15673
    }else {
      var embed__15674 = ret__15673;
      var r__15675 = cljs.core.pv_fresh_node.call(null, edit);
      var ___15676 = cljs.core.pv_aset.call(null, r__15675, 0, embed__15674);
      var G__15677 = ll__15672 - 5;
      var G__15678 = r__15675;
      ll__15672 = G__15677;
      ret__15673 = G__15678;
      continue
    }
    break
  }
};
cljs.core.push_tail = function push_tail(pv, level, parent, tailnode) {
  var ret__15684 = cljs.core.pv_clone_node.call(null, parent);
  var subidx__15685 = pv.cnt - 1 >>> level & 31;
  if(5 === level) {
    cljs.core.pv_aset.call(null, ret__15684, subidx__15685, tailnode);
    return ret__15684
  }else {
    var child__15686 = cljs.core.pv_aget.call(null, parent, subidx__15685);
    if(!(child__15686 == null)) {
      var node_to_insert__15687 = push_tail.call(null, pv, level - 5, child__15686, tailnode);
      cljs.core.pv_aset.call(null, ret__15684, subidx__15685, node_to_insert__15687);
      return ret__15684
    }else {
      var node_to_insert__15688 = cljs.core.new_path.call(null, null, level - 5, tailnode);
      cljs.core.pv_aset.call(null, ret__15684, subidx__15685, node_to_insert__15688);
      return ret__15684
    }
  }
};
cljs.core.array_for = function array_for(pv, i) {
  if(function() {
    var and__3822__auto____15692 = 0 <= i;
    if(and__3822__auto____15692) {
      return i < pv.cnt
    }else {
      return and__3822__auto____15692
    }
  }()) {
    if(i >= cljs.core.tail_off.call(null, pv)) {
      return pv.tail
    }else {
      var node__15693 = pv.root;
      var level__15694 = pv.shift;
      while(true) {
        if(level__15694 > 0) {
          var G__15695 = cljs.core.pv_aget.call(null, node__15693, i >>> level__15694 & 31);
          var G__15696 = level__15694 - 5;
          node__15693 = G__15695;
          level__15694 = G__15696;
          continue
        }else {
          return node__15693.arr
        }
        break
      }
    }
  }else {
    throw new Error([cljs.core.str("No item "), cljs.core.str(i), cljs.core.str(" in vector of length "), cljs.core.str(pv.cnt)].join(""));
  }
};
cljs.core.do_assoc = function do_assoc(pv, level, node, i, val) {
  var ret__15699 = cljs.core.pv_clone_node.call(null, node);
  if(level === 0) {
    cljs.core.pv_aset.call(null, ret__15699, i & 31, val);
    return ret__15699
  }else {
    var subidx__15700 = i >>> level & 31;
    cljs.core.pv_aset.call(null, ret__15699, subidx__15700, do_assoc.call(null, pv, level - 5, cljs.core.pv_aget.call(null, node, subidx__15700), i, val));
    return ret__15699
  }
};
cljs.core.pop_tail = function pop_tail(pv, level, node) {
  var subidx__15706 = pv.cnt - 2 >>> level & 31;
  if(level > 5) {
    var new_child__15707 = pop_tail.call(null, pv, level - 5, cljs.core.pv_aget.call(null, node, subidx__15706));
    if(function() {
      var and__3822__auto____15708 = new_child__15707 == null;
      if(and__3822__auto____15708) {
        return subidx__15706 === 0
      }else {
        return and__3822__auto____15708
      }
    }()) {
      return null
    }else {
      var ret__15709 = cljs.core.pv_clone_node.call(null, node);
      cljs.core.pv_aset.call(null, ret__15709, subidx__15706, new_child__15707);
      return ret__15709
    }
  }else {
    if(subidx__15706 === 0) {
      return null
    }else {
      if("\ufdd0'else") {
        var ret__15710 = cljs.core.pv_clone_node.call(null, node);
        cljs.core.pv_aset.call(null, ret__15710, subidx__15706, null);
        return ret__15710
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
  var this__15713 = this;
  return new cljs.core.TransientVector(this__15713.cnt, this__15713.shift, cljs.core.tv_editable_root.call(null, this__15713.root), cljs.core.tv_editable_tail.call(null, this__15713.tail))
};
cljs.core.PersistentVector.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__15714 = this;
  var h__2192__auto____15715 = this__15714.__hash;
  if(!(h__2192__auto____15715 == null)) {
    return h__2192__auto____15715
  }else {
    var h__2192__auto____15716 = cljs.core.hash_coll.call(null, coll);
    this__15714.__hash = h__2192__auto____15716;
    return h__2192__auto____15716
  }
};
cljs.core.PersistentVector.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__15717 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, null)
};
cljs.core.PersistentVector.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__15718 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, not_found)
};
cljs.core.PersistentVector.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__15719 = this;
  if(function() {
    var and__3822__auto____15720 = 0 <= k;
    if(and__3822__auto____15720) {
      return k < this__15719.cnt
    }else {
      return and__3822__auto____15720
    }
  }()) {
    if(cljs.core.tail_off.call(null, coll) <= k) {
      var new_tail__15721 = this__15719.tail.slice();
      new_tail__15721[k & 31] = v;
      return new cljs.core.PersistentVector(this__15719.meta, this__15719.cnt, this__15719.shift, this__15719.root, new_tail__15721, null)
    }else {
      return new cljs.core.PersistentVector(this__15719.meta, this__15719.cnt, this__15719.shift, cljs.core.do_assoc.call(null, coll, this__15719.shift, this__15719.root, k, v), this__15719.tail, null)
    }
  }else {
    if(k === this__15719.cnt) {
      return coll.cljs$core$ICollection$_conj$arity$2(coll, v)
    }else {
      if("\ufdd0'else") {
        throw new Error([cljs.core.str("Index "), cljs.core.str(k), cljs.core.str(" out of bounds  [0,"), cljs.core.str(this__15719.cnt), cljs.core.str("]")].join(""));
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentVector.prototype.call = function() {
  var G__15769 = null;
  var G__15769__2 = function(this_sym15722, k) {
    var this__15724 = this;
    var this_sym15722__15725 = this;
    var coll__15726 = this_sym15722__15725;
    return coll__15726.cljs$core$ILookup$_lookup$arity$2(coll__15726, k)
  };
  var G__15769__3 = function(this_sym15723, k, not_found) {
    var this__15724 = this;
    var this_sym15723__15727 = this;
    var coll__15728 = this_sym15723__15727;
    return coll__15728.cljs$core$ILookup$_lookup$arity$3(coll__15728, k, not_found)
  };
  G__15769 = function(this_sym15723, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__15769__2.call(this, this_sym15723, k);
      case 3:
        return G__15769__3.call(this, this_sym15723, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__15769
}();
cljs.core.PersistentVector.prototype.apply = function(this_sym15711, args15712) {
  var this__15729 = this;
  return this_sym15711.call.apply(this_sym15711, [this_sym15711].concat(args15712.slice()))
};
cljs.core.PersistentVector.prototype.cljs$core$IKVReduce$_kv_reduce$arity$3 = function(v, f, init) {
  var this__15730 = this;
  var step_init__15731 = [0, init];
  var i__15732 = 0;
  while(true) {
    if(i__15732 < this__15730.cnt) {
      var arr__15733 = cljs.core.array_for.call(null, v, i__15732);
      var len__15734 = arr__15733.length;
      var init__15738 = function() {
        var j__15735 = 0;
        var init__15736 = step_init__15731[1];
        while(true) {
          if(j__15735 < len__15734) {
            var init__15737 = f.call(null, init__15736, j__15735 + i__15732, arr__15733[j__15735]);
            if(cljs.core.reduced_QMARK_.call(null, init__15737)) {
              return init__15737
            }else {
              var G__15770 = j__15735 + 1;
              var G__15771 = init__15737;
              j__15735 = G__15770;
              init__15736 = G__15771;
              continue
            }
          }else {
            step_init__15731[0] = len__15734;
            step_init__15731[1] = init__15736;
            return init__15736
          }
          break
        }
      }();
      if(cljs.core.reduced_QMARK_.call(null, init__15738)) {
        return cljs.core.deref.call(null, init__15738)
      }else {
        var G__15772 = i__15732 + step_init__15731[0];
        i__15732 = G__15772;
        continue
      }
    }else {
      return step_init__15731[1]
    }
    break
  }
};
cljs.core.PersistentVector.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__15739 = this;
  if(this__15739.cnt - cljs.core.tail_off.call(null, coll) < 32) {
    var new_tail__15740 = this__15739.tail.slice();
    new_tail__15740.push(o);
    return new cljs.core.PersistentVector(this__15739.meta, this__15739.cnt + 1, this__15739.shift, this__15739.root, new_tail__15740, null)
  }else {
    var root_overflow_QMARK___15741 = this__15739.cnt >>> 5 > 1 << this__15739.shift;
    var new_shift__15742 = root_overflow_QMARK___15741 ? this__15739.shift + 5 : this__15739.shift;
    var new_root__15744 = root_overflow_QMARK___15741 ? function() {
      var n_r__15743 = cljs.core.pv_fresh_node.call(null, null);
      cljs.core.pv_aset.call(null, n_r__15743, 0, this__15739.root);
      cljs.core.pv_aset.call(null, n_r__15743, 1, cljs.core.new_path.call(null, null, this__15739.shift, new cljs.core.VectorNode(null, this__15739.tail)));
      return n_r__15743
    }() : cljs.core.push_tail.call(null, coll, this__15739.shift, this__15739.root, new cljs.core.VectorNode(null, this__15739.tail));
    return new cljs.core.PersistentVector(this__15739.meta, this__15739.cnt + 1, new_shift__15742, new_root__15744, [o], null)
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IReversible$_rseq$arity$1 = function(coll) {
  var this__15745 = this;
  if(this__15745.cnt > 0) {
    return new cljs.core.RSeq(coll, this__15745.cnt - 1, null)
  }else {
    return cljs.core.List.EMPTY
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IMapEntry$_key$arity$1 = function(coll) {
  var this__15746 = this;
  return coll.cljs$core$IIndexed$_nth$arity$2(coll, 0)
};
cljs.core.PersistentVector.prototype.cljs$core$IMapEntry$_val$arity$1 = function(coll) {
  var this__15747 = this;
  return coll.cljs$core$IIndexed$_nth$arity$2(coll, 1)
};
cljs.core.PersistentVector.prototype.toString = function() {
  var this__15748 = this;
  var this__15749 = this;
  return cljs.core.pr_str.call(null, this__15749)
};
cljs.core.PersistentVector.prototype.cljs$core$IReduce$_reduce$arity$2 = function(v, f) {
  var this__15750 = this;
  return cljs.core.ci_reduce.call(null, v, f)
};
cljs.core.PersistentVector.prototype.cljs$core$IReduce$_reduce$arity$3 = function(v, f, start) {
  var this__15751 = this;
  return cljs.core.ci_reduce.call(null, v, f, start)
};
cljs.core.PersistentVector.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__15752 = this;
  if(this__15752.cnt === 0) {
    return null
  }else {
    return cljs.core.chunked_seq.call(null, coll, 0, 0)
  }
};
cljs.core.PersistentVector.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__15753 = this;
  return this__15753.cnt
};
cljs.core.PersistentVector.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__15754 = this;
  if(this__15754.cnt > 0) {
    return coll.cljs$core$IIndexed$_nth$arity$2(coll, this__15754.cnt - 1)
  }else {
    return null
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__15755 = this;
  if(this__15755.cnt === 0) {
    throw new Error("Can't pop empty vector");
  }else {
    if(1 === this__15755.cnt) {
      return cljs.core._with_meta.call(null, cljs.core.PersistentVector.EMPTY, this__15755.meta)
    }else {
      if(1 < this__15755.cnt - cljs.core.tail_off.call(null, coll)) {
        return new cljs.core.PersistentVector(this__15755.meta, this__15755.cnt - 1, this__15755.shift, this__15755.root, this__15755.tail.slice(0, -1), null)
      }else {
        if("\ufdd0'else") {
          var new_tail__15756 = cljs.core.array_for.call(null, coll, this__15755.cnt - 2);
          var nr__15757 = cljs.core.pop_tail.call(null, coll, this__15755.shift, this__15755.root);
          var new_root__15758 = nr__15757 == null ? cljs.core.PersistentVector.EMPTY_NODE : nr__15757;
          var cnt_1__15759 = this__15755.cnt - 1;
          if(function() {
            var and__3822__auto____15760 = 5 < this__15755.shift;
            if(and__3822__auto____15760) {
              return cljs.core.pv_aget.call(null, new_root__15758, 1) == null
            }else {
              return and__3822__auto____15760
            }
          }()) {
            return new cljs.core.PersistentVector(this__15755.meta, cnt_1__15759, this__15755.shift - 5, cljs.core.pv_aget.call(null, new_root__15758, 0), new_tail__15756, null)
          }else {
            return new cljs.core.PersistentVector(this__15755.meta, cnt_1__15759, this__15755.shift, new_root__15758, new_tail__15756, null)
          }
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IVector$_assoc_n$arity$3 = function(coll, n, val) {
  var this__15761 = this;
  return coll.cljs$core$IAssociative$_assoc$arity$3(coll, n, val)
};
cljs.core.PersistentVector.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__15762 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.PersistentVector.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__15763 = this;
  return new cljs.core.PersistentVector(meta, this__15763.cnt, this__15763.shift, this__15763.root, this__15763.tail, this__15763.__hash)
};
cljs.core.PersistentVector.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__15764 = this;
  return this__15764.meta
};
cljs.core.PersistentVector.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, n) {
  var this__15765 = this;
  return cljs.core.array_for.call(null, coll, n)[n & 31]
};
cljs.core.PersistentVector.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, n, not_found) {
  var this__15766 = this;
  if(function() {
    var and__3822__auto____15767 = 0 <= n;
    if(and__3822__auto____15767) {
      return n < this__15766.cnt
    }else {
      return and__3822__auto____15767
    }
  }()) {
    return coll.cljs$core$IIndexed$_nth$arity$2(coll, n)
  }else {
    return not_found
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__15768 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentVector.EMPTY, this__15768.meta)
};
cljs.core.PersistentVector;
cljs.core.PersistentVector.EMPTY_NODE = cljs.core.pv_fresh_node.call(null, null);
cljs.core.PersistentVector.EMPTY = new cljs.core.PersistentVector(null, 0, 5, cljs.core.PersistentVector.EMPTY_NODE, [], 0);
cljs.core.PersistentVector.fromArray = function(xs, no_clone) {
  var l__15773 = xs.length;
  var xs__15774 = no_clone === true ? xs : xs.slice();
  if(l__15773 < 32) {
    return new cljs.core.PersistentVector(null, l__15773, 5, cljs.core.PersistentVector.EMPTY_NODE, xs__15774, null)
  }else {
    var node__15775 = xs__15774.slice(0, 32);
    var v__15776 = new cljs.core.PersistentVector(null, 32, 5, cljs.core.PersistentVector.EMPTY_NODE, node__15775, null);
    var i__15777 = 32;
    var out__15778 = cljs.core._as_transient.call(null, v__15776);
    while(true) {
      if(i__15777 < l__15773) {
        var G__15779 = i__15777 + 1;
        var G__15780 = cljs.core.conj_BANG_.call(null, out__15778, xs__15774[i__15777]);
        i__15777 = G__15779;
        out__15778 = G__15780;
        continue
      }else {
        return cljs.core.persistent_BANG_.call(null, out__15778)
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
  vector.cljs$lang$applyTo = function(arglist__15781) {
    var args = cljs.core.seq(arglist__15781);
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
  var this__15782 = this;
  if(this__15782.off + 1 < this__15782.node.length) {
    var s__15783 = cljs.core.chunked_seq.call(null, this__15782.vec, this__15782.node, this__15782.i, this__15782.off + 1);
    if(s__15783 == null) {
      return null
    }else {
      return s__15783
    }
  }else {
    return coll.cljs$core$IChunkedNext$_chunked_next$arity$1(coll)
  }
};
cljs.core.ChunkedSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__15784 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.ChunkedSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__15785 = this;
  return coll
};
cljs.core.ChunkedSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__15786 = this;
  return this__15786.node[this__15786.off]
};
cljs.core.ChunkedSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__15787 = this;
  if(this__15787.off + 1 < this__15787.node.length) {
    var s__15788 = cljs.core.chunked_seq.call(null, this__15787.vec, this__15787.node, this__15787.i, this__15787.off + 1);
    if(s__15788 == null) {
      return cljs.core.List.EMPTY
    }else {
      return s__15788
    }
  }else {
    return coll.cljs$core$IChunkedSeq$_chunked_rest$arity$1(coll)
  }
};
cljs.core.ChunkedSeq.prototype.cljs$core$IChunkedNext$ = true;
cljs.core.ChunkedSeq.prototype.cljs$core$IChunkedNext$_chunked_next$arity$1 = function(coll) {
  var this__15789 = this;
  var l__15790 = this__15789.node.length;
  var s__15791 = this__15789.i + l__15790 < cljs.core._count.call(null, this__15789.vec) ? cljs.core.chunked_seq.call(null, this__15789.vec, this__15789.i + l__15790, 0) : null;
  if(s__15791 == null) {
    return null
  }else {
    return s__15791
  }
};
cljs.core.ChunkedSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__15792 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.ChunkedSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, m) {
  var this__15793 = this;
  return cljs.core.chunked_seq.call(null, this__15793.vec, this__15793.node, this__15793.i, this__15793.off, m)
};
cljs.core.ChunkedSeq.prototype.cljs$core$IWithMeta$_meta$arity$1 = function(coll) {
  var this__15794 = this;
  return this__15794.meta
};
cljs.core.ChunkedSeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__15795 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentVector.EMPTY, this__15795.meta)
};
cljs.core.ChunkedSeq.prototype.cljs$core$IChunkedSeq$ = true;
cljs.core.ChunkedSeq.prototype.cljs$core$IChunkedSeq$_chunked_first$arity$1 = function(coll) {
  var this__15796 = this;
  return cljs.core.array_chunk.call(null, this__15796.node, this__15796.off)
};
cljs.core.ChunkedSeq.prototype.cljs$core$IChunkedSeq$_chunked_rest$arity$1 = function(coll) {
  var this__15797 = this;
  var l__15798 = this__15797.node.length;
  var s__15799 = this__15797.i + l__15798 < cljs.core._count.call(null, this__15797.vec) ? cljs.core.chunked_seq.call(null, this__15797.vec, this__15797.i + l__15798, 0) : null;
  if(s__15799 == null) {
    return cljs.core.List.EMPTY
  }else {
    return s__15799
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
  var this__15802 = this;
  var h__2192__auto____15803 = this__15802.__hash;
  if(!(h__2192__auto____15803 == null)) {
    return h__2192__auto____15803
  }else {
    var h__2192__auto____15804 = cljs.core.hash_coll.call(null, coll);
    this__15802.__hash = h__2192__auto____15804;
    return h__2192__auto____15804
  }
};
cljs.core.Subvec.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__15805 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, null)
};
cljs.core.Subvec.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__15806 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, not_found)
};
cljs.core.Subvec.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, key, val) {
  var this__15807 = this;
  var v_pos__15808 = this__15807.start + key;
  return new cljs.core.Subvec(this__15807.meta, cljs.core._assoc.call(null, this__15807.v, v_pos__15808, val), this__15807.start, this__15807.end > v_pos__15808 + 1 ? this__15807.end : v_pos__15808 + 1, null)
};
cljs.core.Subvec.prototype.call = function() {
  var G__15834 = null;
  var G__15834__2 = function(this_sym15809, k) {
    var this__15811 = this;
    var this_sym15809__15812 = this;
    var coll__15813 = this_sym15809__15812;
    return coll__15813.cljs$core$ILookup$_lookup$arity$2(coll__15813, k)
  };
  var G__15834__3 = function(this_sym15810, k, not_found) {
    var this__15811 = this;
    var this_sym15810__15814 = this;
    var coll__15815 = this_sym15810__15814;
    return coll__15815.cljs$core$ILookup$_lookup$arity$3(coll__15815, k, not_found)
  };
  G__15834 = function(this_sym15810, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__15834__2.call(this, this_sym15810, k);
      case 3:
        return G__15834__3.call(this, this_sym15810, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__15834
}();
cljs.core.Subvec.prototype.apply = function(this_sym15800, args15801) {
  var this__15816 = this;
  return this_sym15800.call.apply(this_sym15800, [this_sym15800].concat(args15801.slice()))
};
cljs.core.Subvec.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__15817 = this;
  return new cljs.core.Subvec(this__15817.meta, cljs.core._assoc_n.call(null, this__15817.v, this__15817.end, o), this__15817.start, this__15817.end + 1, null)
};
cljs.core.Subvec.prototype.toString = function() {
  var this__15818 = this;
  var this__15819 = this;
  return cljs.core.pr_str.call(null, this__15819)
};
cljs.core.Subvec.prototype.cljs$core$IReduce$_reduce$arity$2 = function(coll, f) {
  var this__15820 = this;
  return cljs.core.ci_reduce.call(null, coll, f)
};
cljs.core.Subvec.prototype.cljs$core$IReduce$_reduce$arity$3 = function(coll, f, start) {
  var this__15821 = this;
  return cljs.core.ci_reduce.call(null, coll, f, start)
};
cljs.core.Subvec.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__15822 = this;
  var subvec_seq__15823 = function subvec_seq(i) {
    if(i === this__15822.end) {
      return null
    }else {
      return cljs.core.cons.call(null, cljs.core._nth.call(null, this__15822.v, i), new cljs.core.LazySeq(null, false, function() {
        return subvec_seq.call(null, i + 1)
      }, null))
    }
  };
  return subvec_seq__15823.call(null, this__15822.start)
};
cljs.core.Subvec.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__15824 = this;
  return this__15824.end - this__15824.start
};
cljs.core.Subvec.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__15825 = this;
  return cljs.core._nth.call(null, this__15825.v, this__15825.end - 1)
};
cljs.core.Subvec.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__15826 = this;
  if(this__15826.start === this__15826.end) {
    throw new Error("Can't pop empty vector");
  }else {
    return new cljs.core.Subvec(this__15826.meta, this__15826.v, this__15826.start, this__15826.end - 1, null)
  }
};
cljs.core.Subvec.prototype.cljs$core$IVector$_assoc_n$arity$3 = function(coll, n, val) {
  var this__15827 = this;
  return coll.cljs$core$IAssociative$_assoc$arity$3(coll, n, val)
};
cljs.core.Subvec.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__15828 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.Subvec.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__15829 = this;
  return new cljs.core.Subvec(meta, this__15829.v, this__15829.start, this__15829.end, this__15829.__hash)
};
cljs.core.Subvec.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__15830 = this;
  return this__15830.meta
};
cljs.core.Subvec.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, n) {
  var this__15831 = this;
  return cljs.core._nth.call(null, this__15831.v, this__15831.start + n)
};
cljs.core.Subvec.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, n, not_found) {
  var this__15832 = this;
  return cljs.core._nth.call(null, this__15832.v, this__15832.start + n, not_found)
};
cljs.core.Subvec.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__15833 = this;
  return cljs.core.with_meta.call(null, cljs.core.Vector.EMPTY, this__15833.meta)
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
  var ret__15836 = cljs.core.make_array.call(null, 32);
  cljs.core.array_copy.call(null, tl, 0, ret__15836, 0, tl.length);
  return ret__15836
};
cljs.core.tv_push_tail = function tv_push_tail(tv, level, parent, tail_node) {
  var ret__15840 = cljs.core.tv_ensure_editable.call(null, tv.root.edit, parent);
  var subidx__15841 = tv.cnt - 1 >>> level & 31;
  cljs.core.pv_aset.call(null, ret__15840, subidx__15841, level === 5 ? tail_node : function() {
    var child__15842 = cljs.core.pv_aget.call(null, ret__15840, subidx__15841);
    if(!(child__15842 == null)) {
      return tv_push_tail.call(null, tv, level - 5, child__15842, tail_node)
    }else {
      return cljs.core.new_path.call(null, tv.root.edit, level - 5, tail_node)
    }
  }());
  return ret__15840
};
cljs.core.tv_pop_tail = function tv_pop_tail(tv, level, node) {
  var node__15847 = cljs.core.tv_ensure_editable.call(null, tv.root.edit, node);
  var subidx__15848 = tv.cnt - 2 >>> level & 31;
  if(level > 5) {
    var new_child__15849 = tv_pop_tail.call(null, tv, level - 5, cljs.core.pv_aget.call(null, node__15847, subidx__15848));
    if(function() {
      var and__3822__auto____15850 = new_child__15849 == null;
      if(and__3822__auto____15850) {
        return subidx__15848 === 0
      }else {
        return and__3822__auto____15850
      }
    }()) {
      return null
    }else {
      cljs.core.pv_aset.call(null, node__15847, subidx__15848, new_child__15849);
      return node__15847
    }
  }else {
    if(subidx__15848 === 0) {
      return null
    }else {
      if("\ufdd0'else") {
        cljs.core.pv_aset.call(null, node__15847, subidx__15848, null);
        return node__15847
      }else {
        return null
      }
    }
  }
};
cljs.core.editable_array_for = function editable_array_for(tv, i) {
  if(function() {
    var and__3822__auto____15855 = 0 <= i;
    if(and__3822__auto____15855) {
      return i < tv.cnt
    }else {
      return and__3822__auto____15855
    }
  }()) {
    if(i >= cljs.core.tail_off.call(null, tv)) {
      return tv.tail
    }else {
      var root__15856 = tv.root;
      var node__15857 = root__15856;
      var level__15858 = tv.shift;
      while(true) {
        if(level__15858 > 0) {
          var G__15859 = cljs.core.tv_ensure_editable.call(null, root__15856.edit, cljs.core.pv_aget.call(null, node__15857, i >>> level__15858 & 31));
          var G__15860 = level__15858 - 5;
          node__15857 = G__15859;
          level__15858 = G__15860;
          continue
        }else {
          return node__15857.arr
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
  var G__15900 = null;
  var G__15900__2 = function(this_sym15863, k) {
    var this__15865 = this;
    var this_sym15863__15866 = this;
    var coll__15867 = this_sym15863__15866;
    return coll__15867.cljs$core$ILookup$_lookup$arity$2(coll__15867, k)
  };
  var G__15900__3 = function(this_sym15864, k, not_found) {
    var this__15865 = this;
    var this_sym15864__15868 = this;
    var coll__15869 = this_sym15864__15868;
    return coll__15869.cljs$core$ILookup$_lookup$arity$3(coll__15869, k, not_found)
  };
  G__15900 = function(this_sym15864, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__15900__2.call(this, this_sym15864, k);
      case 3:
        return G__15900__3.call(this, this_sym15864, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__15900
}();
cljs.core.TransientVector.prototype.apply = function(this_sym15861, args15862) {
  var this__15870 = this;
  return this_sym15861.call.apply(this_sym15861, [this_sym15861].concat(args15862.slice()))
};
cljs.core.TransientVector.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__15871 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, null)
};
cljs.core.TransientVector.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__15872 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, not_found)
};
cljs.core.TransientVector.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, n) {
  var this__15873 = this;
  if(this__15873.root.edit) {
    return cljs.core.array_for.call(null, coll, n)[n & 31]
  }else {
    throw new Error("nth after persistent!");
  }
};
cljs.core.TransientVector.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, n, not_found) {
  var this__15874 = this;
  if(function() {
    var and__3822__auto____15875 = 0 <= n;
    if(and__3822__auto____15875) {
      return n < this__15874.cnt
    }else {
      return and__3822__auto____15875
    }
  }()) {
    return coll.cljs$core$IIndexed$_nth$arity$2(coll, n)
  }else {
    return not_found
  }
};
cljs.core.TransientVector.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__15876 = this;
  if(this__15876.root.edit) {
    return this__15876.cnt
  }else {
    throw new Error("count after persistent!");
  }
};
cljs.core.TransientVector.prototype.cljs$core$ITransientVector$_assoc_n_BANG_$arity$3 = function(tcoll, n, val) {
  var this__15877 = this;
  if(this__15877.root.edit) {
    if(function() {
      var and__3822__auto____15878 = 0 <= n;
      if(and__3822__auto____15878) {
        return n < this__15877.cnt
      }else {
        return and__3822__auto____15878
      }
    }()) {
      if(cljs.core.tail_off.call(null, tcoll) <= n) {
        this__15877.tail[n & 31] = val;
        return tcoll
      }else {
        var new_root__15883 = function go(level, node) {
          var node__15881 = cljs.core.tv_ensure_editable.call(null, this__15877.root.edit, node);
          if(level === 0) {
            cljs.core.pv_aset.call(null, node__15881, n & 31, val);
            return node__15881
          }else {
            var subidx__15882 = n >>> level & 31;
            cljs.core.pv_aset.call(null, node__15881, subidx__15882, go.call(null, level - 5, cljs.core.pv_aget.call(null, node__15881, subidx__15882)));
            return node__15881
          }
        }.call(null, this__15877.shift, this__15877.root);
        this__15877.root = new_root__15883;
        return tcoll
      }
    }else {
      if(n === this__15877.cnt) {
        return tcoll.cljs$core$ITransientCollection$_conj_BANG_$arity$2(tcoll, val)
      }else {
        if("\ufdd0'else") {
          throw new Error([cljs.core.str("Index "), cljs.core.str(n), cljs.core.str(" out of bounds for TransientVector of length"), cljs.core.str(this__15877.cnt)].join(""));
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
  var this__15884 = this;
  if(this__15884.root.edit) {
    if(this__15884.cnt === 0) {
      throw new Error("Can't pop empty vector");
    }else {
      if(1 === this__15884.cnt) {
        this__15884.cnt = 0;
        return tcoll
      }else {
        if((this__15884.cnt - 1 & 31) > 0) {
          this__15884.cnt = this__15884.cnt - 1;
          return tcoll
        }else {
          if("\ufdd0'else") {
            var new_tail__15885 = cljs.core.editable_array_for.call(null, tcoll, this__15884.cnt - 2);
            var new_root__15887 = function() {
              var nr__15886 = cljs.core.tv_pop_tail.call(null, tcoll, this__15884.shift, this__15884.root);
              if(!(nr__15886 == null)) {
                return nr__15886
              }else {
                return new cljs.core.VectorNode(this__15884.root.edit, cljs.core.make_array.call(null, 32))
              }
            }();
            if(function() {
              var and__3822__auto____15888 = 5 < this__15884.shift;
              if(and__3822__auto____15888) {
                return cljs.core.pv_aget.call(null, new_root__15887, 1) == null
              }else {
                return and__3822__auto____15888
              }
            }()) {
              var new_root__15889 = cljs.core.tv_ensure_editable.call(null, this__15884.root.edit, cljs.core.pv_aget.call(null, new_root__15887, 0));
              this__15884.root = new_root__15889;
              this__15884.shift = this__15884.shift - 5;
              this__15884.cnt = this__15884.cnt - 1;
              this__15884.tail = new_tail__15885;
              return tcoll
            }else {
              this__15884.root = new_root__15887;
              this__15884.cnt = this__15884.cnt - 1;
              this__15884.tail = new_tail__15885;
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
  var this__15890 = this;
  return tcoll.cljs$core$ITransientVector$_assoc_n_BANG_$arity$3(tcoll, key, val)
};
cljs.core.TransientVector.prototype.cljs$core$ITransientCollection$_conj_BANG_$arity$2 = function(tcoll, o) {
  var this__15891 = this;
  if(this__15891.root.edit) {
    if(this__15891.cnt - cljs.core.tail_off.call(null, tcoll) < 32) {
      this__15891.tail[this__15891.cnt & 31] = o;
      this__15891.cnt = this__15891.cnt + 1;
      return tcoll
    }else {
      var tail_node__15892 = new cljs.core.VectorNode(this__15891.root.edit, this__15891.tail);
      var new_tail__15893 = cljs.core.make_array.call(null, 32);
      new_tail__15893[0] = o;
      this__15891.tail = new_tail__15893;
      if(this__15891.cnt >>> 5 > 1 << this__15891.shift) {
        var new_root_array__15894 = cljs.core.make_array.call(null, 32);
        var new_shift__15895 = this__15891.shift + 5;
        new_root_array__15894[0] = this__15891.root;
        new_root_array__15894[1] = cljs.core.new_path.call(null, this__15891.root.edit, this__15891.shift, tail_node__15892);
        this__15891.root = new cljs.core.VectorNode(this__15891.root.edit, new_root_array__15894);
        this__15891.shift = new_shift__15895;
        this__15891.cnt = this__15891.cnt + 1;
        return tcoll
      }else {
        var new_root__15896 = cljs.core.tv_push_tail.call(null, tcoll, this__15891.shift, this__15891.root, tail_node__15892);
        this__15891.root = new_root__15896;
        this__15891.cnt = this__15891.cnt + 1;
        return tcoll
      }
    }
  }else {
    throw new Error("conj! after persistent!");
  }
};
cljs.core.TransientVector.prototype.cljs$core$ITransientCollection$_persistent_BANG_$arity$1 = function(tcoll) {
  var this__15897 = this;
  if(this__15897.root.edit) {
    this__15897.root.edit = null;
    var len__15898 = this__15897.cnt - cljs.core.tail_off.call(null, tcoll);
    var trimmed_tail__15899 = cljs.core.make_array.call(null, len__15898);
    cljs.core.array_copy.call(null, this__15897.tail, 0, trimmed_tail__15899, 0, len__15898);
    return new cljs.core.PersistentVector(null, this__15897.cnt, this__15897.shift, this__15897.root, trimmed_tail__15899, null)
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
  var this__15901 = this;
  var h__2192__auto____15902 = this__15901.__hash;
  if(!(h__2192__auto____15902 == null)) {
    return h__2192__auto____15902
  }else {
    var h__2192__auto____15903 = cljs.core.hash_coll.call(null, coll);
    this__15901.__hash = h__2192__auto____15903;
    return h__2192__auto____15903
  }
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__15904 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.PersistentQueueSeq.prototype.toString = function() {
  var this__15905 = this;
  var this__15906 = this;
  return cljs.core.pr_str.call(null, this__15906)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__15907 = this;
  return coll
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__15908 = this;
  return cljs.core._first.call(null, this__15908.front)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__15909 = this;
  var temp__3971__auto____15910 = cljs.core.next.call(null, this__15909.front);
  if(temp__3971__auto____15910) {
    var f1__15911 = temp__3971__auto____15910;
    return new cljs.core.PersistentQueueSeq(this__15909.meta, f1__15911, this__15909.rear, null)
  }else {
    if(this__15909.rear == null) {
      return coll.cljs$core$IEmptyableCollection$_empty$arity$1(coll)
    }else {
      return new cljs.core.PersistentQueueSeq(this__15909.meta, this__15909.rear, null, null)
    }
  }
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__15912 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__15913 = this;
  return new cljs.core.PersistentQueueSeq(meta, this__15913.front, this__15913.rear, this__15913.__hash)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__15914 = this;
  return this__15914.meta
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__15915 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__15915.meta)
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
  var this__15916 = this;
  var h__2192__auto____15917 = this__15916.__hash;
  if(!(h__2192__auto____15917 == null)) {
    return h__2192__auto____15917
  }else {
    var h__2192__auto____15918 = cljs.core.hash_coll.call(null, coll);
    this__15916.__hash = h__2192__auto____15918;
    return h__2192__auto____15918
  }
};
cljs.core.PersistentQueue.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__15919 = this;
  if(cljs.core.truth_(this__15919.front)) {
    return new cljs.core.PersistentQueue(this__15919.meta, this__15919.count + 1, this__15919.front, cljs.core.conj.call(null, function() {
      var or__3824__auto____15920 = this__15919.rear;
      if(cljs.core.truth_(or__3824__auto____15920)) {
        return or__3824__auto____15920
      }else {
        return cljs.core.PersistentVector.EMPTY
      }
    }(), o), null)
  }else {
    return new cljs.core.PersistentQueue(this__15919.meta, this__15919.count + 1, cljs.core.conj.call(null, this__15919.front, o), cljs.core.PersistentVector.EMPTY, null)
  }
};
cljs.core.PersistentQueue.prototype.toString = function() {
  var this__15921 = this;
  var this__15922 = this;
  return cljs.core.pr_str.call(null, this__15922)
};
cljs.core.PersistentQueue.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__15923 = this;
  var rear__15924 = cljs.core.seq.call(null, this__15923.rear);
  if(cljs.core.truth_(function() {
    var or__3824__auto____15925 = this__15923.front;
    if(cljs.core.truth_(or__3824__auto____15925)) {
      return or__3824__auto____15925
    }else {
      return rear__15924
    }
  }())) {
    return new cljs.core.PersistentQueueSeq(null, this__15923.front, cljs.core.seq.call(null, rear__15924), null)
  }else {
    return null
  }
};
cljs.core.PersistentQueue.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__15926 = this;
  return this__15926.count
};
cljs.core.PersistentQueue.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__15927 = this;
  return cljs.core._first.call(null, this__15927.front)
};
cljs.core.PersistentQueue.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__15928 = this;
  if(cljs.core.truth_(this__15928.front)) {
    var temp__3971__auto____15929 = cljs.core.next.call(null, this__15928.front);
    if(temp__3971__auto____15929) {
      var f1__15930 = temp__3971__auto____15929;
      return new cljs.core.PersistentQueue(this__15928.meta, this__15928.count - 1, f1__15930, this__15928.rear, null)
    }else {
      return new cljs.core.PersistentQueue(this__15928.meta, this__15928.count - 1, cljs.core.seq.call(null, this__15928.rear), cljs.core.PersistentVector.EMPTY, null)
    }
  }else {
    return coll
  }
};
cljs.core.PersistentQueue.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__15931 = this;
  return cljs.core.first.call(null, this__15931.front)
};
cljs.core.PersistentQueue.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__15932 = this;
  return cljs.core.rest.call(null, cljs.core.seq.call(null, coll))
};
cljs.core.PersistentQueue.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__15933 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.PersistentQueue.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__15934 = this;
  return new cljs.core.PersistentQueue(meta, this__15934.count, this__15934.front, this__15934.rear, this__15934.__hash)
};
cljs.core.PersistentQueue.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__15935 = this;
  return this__15935.meta
};
cljs.core.PersistentQueue.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__15936 = this;
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
  var this__15937 = this;
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
  var len__15940 = array.length;
  var i__15941 = 0;
  while(true) {
    if(i__15941 < len__15940) {
      if(k === array[i__15941]) {
        return i__15941
      }else {
        var G__15942 = i__15941 + incr;
        i__15941 = G__15942;
        continue
      }
    }else {
      return null
    }
    break
  }
};
cljs.core.obj_map_compare_keys = function obj_map_compare_keys(a, b) {
  var a__15945 = cljs.core.hash.call(null, a);
  var b__15946 = cljs.core.hash.call(null, b);
  if(a__15945 < b__15946) {
    return-1
  }else {
    if(a__15945 > b__15946) {
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
  var ks__15954 = m.keys;
  var len__15955 = ks__15954.length;
  var so__15956 = m.strobj;
  var out__15957 = cljs.core.with_meta.call(null, cljs.core.PersistentHashMap.EMPTY, cljs.core.meta.call(null, m));
  var i__15958 = 0;
  var out__15959 = cljs.core.transient$.call(null, out__15957);
  while(true) {
    if(i__15958 < len__15955) {
      var k__15960 = ks__15954[i__15958];
      var G__15961 = i__15958 + 1;
      var G__15962 = cljs.core.assoc_BANG_.call(null, out__15959, k__15960, so__15956[k__15960]);
      i__15958 = G__15961;
      out__15959 = G__15962;
      continue
    }else {
      return cljs.core.persistent_BANG_.call(null, cljs.core.assoc_BANG_.call(null, out__15959, k, v))
    }
    break
  }
};
cljs.core.obj_clone = function obj_clone(obj, ks) {
  var new_obj__15968 = {};
  var l__15969 = ks.length;
  var i__15970 = 0;
  while(true) {
    if(i__15970 < l__15969) {
      var k__15971 = ks[i__15970];
      new_obj__15968[k__15971] = obj[k__15971];
      var G__15972 = i__15970 + 1;
      i__15970 = G__15972;
      continue
    }else {
    }
    break
  }
  return new_obj__15968
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
  var this__15975 = this;
  return cljs.core.transient$.call(null, cljs.core.into.call(null, cljs.core.hash_map.call(null), coll))
};
cljs.core.ObjMap.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__15976 = this;
  var h__2192__auto____15977 = this__15976.__hash;
  if(!(h__2192__auto____15977 == null)) {
    return h__2192__auto____15977
  }else {
    var h__2192__auto____15978 = cljs.core.hash_imap.call(null, coll);
    this__15976.__hash = h__2192__auto____15978;
    return h__2192__auto____15978
  }
};
cljs.core.ObjMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__15979 = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(coll, k, null)
};
cljs.core.ObjMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__15980 = this;
  if(function() {
    var and__3822__auto____15981 = goog.isString(k);
    if(and__3822__auto____15981) {
      return!(cljs.core.scan_array.call(null, 1, k, this__15980.keys) == null)
    }else {
      return and__3822__auto____15981
    }
  }()) {
    return this__15980.strobj[k]
  }else {
    return not_found
  }
};
cljs.core.ObjMap.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__15982 = this;
  if(goog.isString(k)) {
    if(function() {
      var or__3824__auto____15983 = this__15982.update_count > cljs.core.ObjMap.HASHMAP_THRESHOLD;
      if(or__3824__auto____15983) {
        return or__3824__auto____15983
      }else {
        return this__15982.keys.length >= cljs.core.ObjMap.HASHMAP_THRESHOLD
      }
    }()) {
      return cljs.core.obj_map__GT_hash_map.call(null, coll, k, v)
    }else {
      if(!(cljs.core.scan_array.call(null, 1, k, this__15982.keys) == null)) {
        var new_strobj__15984 = cljs.core.obj_clone.call(null, this__15982.strobj, this__15982.keys);
        new_strobj__15984[k] = v;
        return new cljs.core.ObjMap(this__15982.meta, this__15982.keys, new_strobj__15984, this__15982.update_count + 1, null)
      }else {
        var new_strobj__15985 = cljs.core.obj_clone.call(null, this__15982.strobj, this__15982.keys);
        var new_keys__15986 = this__15982.keys.slice();
        new_strobj__15985[k] = v;
        new_keys__15986.push(k);
        return new cljs.core.ObjMap(this__15982.meta, new_keys__15986, new_strobj__15985, this__15982.update_count + 1, null)
      }
    }
  }else {
    return cljs.core.obj_map__GT_hash_map.call(null, coll, k, v)
  }
};
cljs.core.ObjMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = function(coll, k) {
  var this__15987 = this;
  if(function() {
    var and__3822__auto____15988 = goog.isString(k);
    if(and__3822__auto____15988) {
      return!(cljs.core.scan_array.call(null, 1, k, this__15987.keys) == null)
    }else {
      return and__3822__auto____15988
    }
  }()) {
    return true
  }else {
    return false
  }
};
cljs.core.ObjMap.prototype.call = function() {
  var G__16010 = null;
  var G__16010__2 = function(this_sym15989, k) {
    var this__15991 = this;
    var this_sym15989__15992 = this;
    var coll__15993 = this_sym15989__15992;
    return coll__15993.cljs$core$ILookup$_lookup$arity$2(coll__15993, k)
  };
  var G__16010__3 = function(this_sym15990, k, not_found) {
    var this__15991 = this;
    var this_sym15990__15994 = this;
    var coll__15995 = this_sym15990__15994;
    return coll__15995.cljs$core$ILookup$_lookup$arity$3(coll__15995, k, not_found)
  };
  G__16010 = function(this_sym15990, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__16010__2.call(this, this_sym15990, k);
      case 3:
        return G__16010__3.call(this, this_sym15990, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__16010
}();
cljs.core.ObjMap.prototype.apply = function(this_sym15973, args15974) {
  var this__15996 = this;
  return this_sym15973.call.apply(this_sym15973, [this_sym15973].concat(args15974.slice()))
};
cljs.core.ObjMap.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, entry) {
  var this__15997 = this;
  if(cljs.core.vector_QMARK_.call(null, entry)) {
    return coll.cljs$core$IAssociative$_assoc$arity$3(coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.ObjMap.prototype.toString = function() {
  var this__15998 = this;
  var this__15999 = this;
  return cljs.core.pr_str.call(null, this__15999)
};
cljs.core.ObjMap.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__16000 = this;
  if(this__16000.keys.length > 0) {
    return cljs.core.map.call(null, function(p1__15963_SHARP_) {
      return cljs.core.vector.call(null, p1__15963_SHARP_, this__16000.strobj[p1__15963_SHARP_])
    }, this__16000.keys.sort(cljs.core.obj_map_compare_keys))
  }else {
    return null
  }
};
cljs.core.ObjMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__16001 = this;
  return this__16001.keys.length
};
cljs.core.ObjMap.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__16002 = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.ObjMap.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__16003 = this;
  return new cljs.core.ObjMap(meta, this__16003.keys, this__16003.strobj, this__16003.update_count, this__16003.__hash)
};
cljs.core.ObjMap.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__16004 = this;
  return this__16004.meta
};
cljs.core.ObjMap.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__16005 = this;
  return cljs.core.with_meta.call(null, cljs.core.ObjMap.EMPTY, this__16005.meta)
};
cljs.core.ObjMap.prototype.cljs$core$IMap$_dissoc$arity$2 = function(coll, k) {
  var this__16006 = this;
  if(function() {
    var and__3822__auto____16007 = goog.isString(k);
    if(and__3822__auto____16007) {
      return!(cljs.core.scan_array.call(null, 1, k, this__16006.keys) == null)
    }else {
      return and__3822__auto____16007
    }
  }()) {
    var new_keys__16008 = this__16006.keys.slice();
    var new_strobj__16009 = cljs.core.obj_clone.call(null, this__16006.strobj, this__16006.keys);
    new_keys__16008.splice(cljs.core.scan_array.call(null, 1, k, new_keys__16008), 1);
    cljs.core.js_delete.call(null, new_strobj__16009, k);
    return new cljs.core.ObjMap(this__16006.meta, new_keys__16008, new_strobj__16009, this__16006.update_count + 1, null)
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
  var this__16014 = this;
  var h__2192__auto____16015 = this__16014.__hash;
  if(!(h__2192__auto____16015 == null)) {
    return h__2192__auto____16015
  }else {
    var h__2192__auto____16016 = cljs.core.hash_imap.call(null, coll);
    this__16014.__hash = h__2192__auto____16016;
    return h__2192__auto____16016
  }
};
cljs.core.HashMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__16017 = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(coll, k, null)
};
cljs.core.HashMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__16018 = this;
  var bucket__16019 = this__16018.hashobj[cljs.core.hash.call(null, k)];
  var i__16020 = cljs.core.truth_(bucket__16019) ? cljs.core.scan_array.call(null, 2, k, bucket__16019) : null;
  if(cljs.core.truth_(i__16020)) {
    return bucket__16019[i__16020 + 1]
  }else {
    return not_found
  }
};
cljs.core.HashMap.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__16021 = this;
  var h__16022 = cljs.core.hash.call(null, k);
  var bucket__16023 = this__16021.hashobj[h__16022];
  if(cljs.core.truth_(bucket__16023)) {
    var new_bucket__16024 = bucket__16023.slice();
    var new_hashobj__16025 = goog.object.clone(this__16021.hashobj);
    new_hashobj__16025[h__16022] = new_bucket__16024;
    var temp__3971__auto____16026 = cljs.core.scan_array.call(null, 2, k, new_bucket__16024);
    if(cljs.core.truth_(temp__3971__auto____16026)) {
      var i__16027 = temp__3971__auto____16026;
      new_bucket__16024[i__16027 + 1] = v;
      return new cljs.core.HashMap(this__16021.meta, this__16021.count, new_hashobj__16025, null)
    }else {
      new_bucket__16024.push(k, v);
      return new cljs.core.HashMap(this__16021.meta, this__16021.count + 1, new_hashobj__16025, null)
    }
  }else {
    var new_hashobj__16028 = goog.object.clone(this__16021.hashobj);
    new_hashobj__16028[h__16022] = [k, v];
    return new cljs.core.HashMap(this__16021.meta, this__16021.count + 1, new_hashobj__16028, null)
  }
};
cljs.core.HashMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = function(coll, k) {
  var this__16029 = this;
  var bucket__16030 = this__16029.hashobj[cljs.core.hash.call(null, k)];
  var i__16031 = cljs.core.truth_(bucket__16030) ? cljs.core.scan_array.call(null, 2, k, bucket__16030) : null;
  if(cljs.core.truth_(i__16031)) {
    return true
  }else {
    return false
  }
};
cljs.core.HashMap.prototype.call = function() {
  var G__16056 = null;
  var G__16056__2 = function(this_sym16032, k) {
    var this__16034 = this;
    var this_sym16032__16035 = this;
    var coll__16036 = this_sym16032__16035;
    return coll__16036.cljs$core$ILookup$_lookup$arity$2(coll__16036, k)
  };
  var G__16056__3 = function(this_sym16033, k, not_found) {
    var this__16034 = this;
    var this_sym16033__16037 = this;
    var coll__16038 = this_sym16033__16037;
    return coll__16038.cljs$core$ILookup$_lookup$arity$3(coll__16038, k, not_found)
  };
  G__16056 = function(this_sym16033, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__16056__2.call(this, this_sym16033, k);
      case 3:
        return G__16056__3.call(this, this_sym16033, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__16056
}();
cljs.core.HashMap.prototype.apply = function(this_sym16012, args16013) {
  var this__16039 = this;
  return this_sym16012.call.apply(this_sym16012, [this_sym16012].concat(args16013.slice()))
};
cljs.core.HashMap.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, entry) {
  var this__16040 = this;
  if(cljs.core.vector_QMARK_.call(null, entry)) {
    return coll.cljs$core$IAssociative$_assoc$arity$3(coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.HashMap.prototype.toString = function() {
  var this__16041 = this;
  var this__16042 = this;
  return cljs.core.pr_str.call(null, this__16042)
};
cljs.core.HashMap.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__16043 = this;
  if(this__16043.count > 0) {
    var hashes__16044 = cljs.core.js_keys.call(null, this__16043.hashobj).sort();
    return cljs.core.mapcat.call(null, function(p1__16011_SHARP_) {
      return cljs.core.map.call(null, cljs.core.vec, cljs.core.partition.call(null, 2, this__16043.hashobj[p1__16011_SHARP_]))
    }, hashes__16044)
  }else {
    return null
  }
};
cljs.core.HashMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__16045 = this;
  return this__16045.count
};
cljs.core.HashMap.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__16046 = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.HashMap.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__16047 = this;
  return new cljs.core.HashMap(meta, this__16047.count, this__16047.hashobj, this__16047.__hash)
};
cljs.core.HashMap.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__16048 = this;
  return this__16048.meta
};
cljs.core.HashMap.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__16049 = this;
  return cljs.core.with_meta.call(null, cljs.core.HashMap.EMPTY, this__16049.meta)
};
cljs.core.HashMap.prototype.cljs$core$IMap$_dissoc$arity$2 = function(coll, k) {
  var this__16050 = this;
  var h__16051 = cljs.core.hash.call(null, k);
  var bucket__16052 = this__16050.hashobj[h__16051];
  var i__16053 = cljs.core.truth_(bucket__16052) ? cljs.core.scan_array.call(null, 2, k, bucket__16052) : null;
  if(cljs.core.not.call(null, i__16053)) {
    return coll
  }else {
    var new_hashobj__16054 = goog.object.clone(this__16050.hashobj);
    if(3 > bucket__16052.length) {
      cljs.core.js_delete.call(null, new_hashobj__16054, h__16051)
    }else {
      var new_bucket__16055 = bucket__16052.slice();
      new_bucket__16055.splice(i__16053, 2);
      new_hashobj__16054[h__16051] = new_bucket__16055
    }
    return new cljs.core.HashMap(this__16050.meta, this__16050.count - 1, new_hashobj__16054, null)
  }
};
cljs.core.HashMap;
cljs.core.HashMap.EMPTY = new cljs.core.HashMap(null, 0, {}, 0);
cljs.core.HashMap.fromArrays = function(ks, vs) {
  var len__16057 = ks.length;
  var i__16058 = 0;
  var out__16059 = cljs.core.HashMap.EMPTY;
  while(true) {
    if(i__16058 < len__16057) {
      var G__16060 = i__16058 + 1;
      var G__16061 = cljs.core.assoc.call(null, out__16059, ks[i__16058], vs[i__16058]);
      i__16058 = G__16060;
      out__16059 = G__16061;
      continue
    }else {
      return out__16059
    }
    break
  }
};
cljs.core.array_map_index_of = function array_map_index_of(m, k) {
  var arr__16065 = m.arr;
  var len__16066 = arr__16065.length;
  var i__16067 = 0;
  while(true) {
    if(len__16066 <= i__16067) {
      return-1
    }else {
      if(cljs.core._EQ_.call(null, arr__16065[i__16067], k)) {
        return i__16067
      }else {
        if("\ufdd0'else") {
          var G__16068 = i__16067 + 2;
          i__16067 = G__16068;
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
  var this__16071 = this;
  return new cljs.core.TransientArrayMap({}, this__16071.arr.length, this__16071.arr.slice())
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__16072 = this;
  var h__2192__auto____16073 = this__16072.__hash;
  if(!(h__2192__auto____16073 == null)) {
    return h__2192__auto____16073
  }else {
    var h__2192__auto____16074 = cljs.core.hash_imap.call(null, coll);
    this__16072.__hash = h__2192__auto____16074;
    return h__2192__auto____16074
  }
};
cljs.core.PersistentArrayMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__16075 = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(coll, k, null)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__16076 = this;
  var idx__16077 = cljs.core.array_map_index_of.call(null, coll, k);
  if(idx__16077 === -1) {
    return not_found
  }else {
    return this__16076.arr[idx__16077 + 1]
  }
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__16078 = this;
  var idx__16079 = cljs.core.array_map_index_of.call(null, coll, k);
  if(idx__16079 === -1) {
    if(this__16078.cnt < cljs.core.PersistentArrayMap.HASHMAP_THRESHOLD) {
      return new cljs.core.PersistentArrayMap(this__16078.meta, this__16078.cnt + 1, function() {
        var G__16080__16081 = this__16078.arr.slice();
        G__16080__16081.push(k);
        G__16080__16081.push(v);
        return G__16080__16081
      }(), null)
    }else {
      return cljs.core.persistent_BANG_.call(null, cljs.core.assoc_BANG_.call(null, cljs.core.transient$.call(null, cljs.core.into.call(null, cljs.core.PersistentHashMap.EMPTY, coll)), k, v))
    }
  }else {
    if(v === this__16078.arr[idx__16079 + 1]) {
      return coll
    }else {
      if("\ufdd0'else") {
        return new cljs.core.PersistentArrayMap(this__16078.meta, this__16078.cnt, function() {
          var G__16082__16083 = this__16078.arr.slice();
          G__16082__16083[idx__16079 + 1] = v;
          return G__16082__16083
        }(), null)
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = function(coll, k) {
  var this__16084 = this;
  return!(cljs.core.array_map_index_of.call(null, coll, k) === -1)
};
cljs.core.PersistentArrayMap.prototype.call = function() {
  var G__16116 = null;
  var G__16116__2 = function(this_sym16085, k) {
    var this__16087 = this;
    var this_sym16085__16088 = this;
    var coll__16089 = this_sym16085__16088;
    return coll__16089.cljs$core$ILookup$_lookup$arity$2(coll__16089, k)
  };
  var G__16116__3 = function(this_sym16086, k, not_found) {
    var this__16087 = this;
    var this_sym16086__16090 = this;
    var coll__16091 = this_sym16086__16090;
    return coll__16091.cljs$core$ILookup$_lookup$arity$3(coll__16091, k, not_found)
  };
  G__16116 = function(this_sym16086, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__16116__2.call(this, this_sym16086, k);
      case 3:
        return G__16116__3.call(this, this_sym16086, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__16116
}();
cljs.core.PersistentArrayMap.prototype.apply = function(this_sym16069, args16070) {
  var this__16092 = this;
  return this_sym16069.call.apply(this_sym16069, [this_sym16069].concat(args16070.slice()))
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IKVReduce$_kv_reduce$arity$3 = function(coll, f, init) {
  var this__16093 = this;
  var len__16094 = this__16093.arr.length;
  var i__16095 = 0;
  var init__16096 = init;
  while(true) {
    if(i__16095 < len__16094) {
      var init__16097 = f.call(null, init__16096, this__16093.arr[i__16095], this__16093.arr[i__16095 + 1]);
      if(cljs.core.reduced_QMARK_.call(null, init__16097)) {
        return cljs.core.deref.call(null, init__16097)
      }else {
        var G__16117 = i__16095 + 2;
        var G__16118 = init__16097;
        i__16095 = G__16117;
        init__16096 = G__16118;
        continue
      }
    }else {
      return null
    }
    break
  }
};
cljs.core.PersistentArrayMap.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, entry) {
  var this__16098 = this;
  if(cljs.core.vector_QMARK_.call(null, entry)) {
    return coll.cljs$core$IAssociative$_assoc$arity$3(coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.PersistentArrayMap.prototype.toString = function() {
  var this__16099 = this;
  var this__16100 = this;
  return cljs.core.pr_str.call(null, this__16100)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__16101 = this;
  if(this__16101.cnt > 0) {
    var len__16102 = this__16101.arr.length;
    var array_map_seq__16103 = function array_map_seq(i) {
      return new cljs.core.LazySeq(null, false, function() {
        if(i < len__16102) {
          return cljs.core.cons.call(null, cljs.core.PersistentVector.fromArray([this__16101.arr[i], this__16101.arr[i + 1]], true), array_map_seq.call(null, i + 2))
        }else {
          return null
        }
      }, null)
    };
    return array_map_seq__16103.call(null, 0)
  }else {
    return null
  }
};
cljs.core.PersistentArrayMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__16104 = this;
  return this__16104.cnt
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__16105 = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__16106 = this;
  return new cljs.core.PersistentArrayMap(meta, this__16106.cnt, this__16106.arr, this__16106.__hash)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__16107 = this;
  return this__16107.meta
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__16108 = this;
  return cljs.core._with_meta.call(null, cljs.core.PersistentArrayMap.EMPTY, this__16108.meta)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IMap$_dissoc$arity$2 = function(coll, k) {
  var this__16109 = this;
  var idx__16110 = cljs.core.array_map_index_of.call(null, coll, k);
  if(idx__16110 >= 0) {
    var len__16111 = this__16109.arr.length;
    var new_len__16112 = len__16111 - 2;
    if(new_len__16112 === 0) {
      return coll.cljs$core$IEmptyableCollection$_empty$arity$1(coll)
    }else {
      var new_arr__16113 = cljs.core.make_array.call(null, new_len__16112);
      var s__16114 = 0;
      var d__16115 = 0;
      while(true) {
        if(s__16114 >= len__16111) {
          return new cljs.core.PersistentArrayMap(this__16109.meta, this__16109.cnt - 1, new_arr__16113, null)
        }else {
          if(cljs.core._EQ_.call(null, k, this__16109.arr[s__16114])) {
            var G__16119 = s__16114 + 2;
            var G__16120 = d__16115;
            s__16114 = G__16119;
            d__16115 = G__16120;
            continue
          }else {
            if("\ufdd0'else") {
              new_arr__16113[d__16115] = this__16109.arr[s__16114];
              new_arr__16113[d__16115 + 1] = this__16109.arr[s__16114 + 1];
              var G__16121 = s__16114 + 2;
              var G__16122 = d__16115 + 2;
              s__16114 = G__16121;
              d__16115 = G__16122;
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
  var len__16123 = cljs.core.count.call(null, ks);
  var i__16124 = 0;
  var out__16125 = cljs.core.transient$.call(null, cljs.core.PersistentArrayMap.EMPTY);
  while(true) {
    if(i__16124 < len__16123) {
      var G__16126 = i__16124 + 1;
      var G__16127 = cljs.core.assoc_BANG_.call(null, out__16125, ks[i__16124], vs[i__16124]);
      i__16124 = G__16126;
      out__16125 = G__16127;
      continue
    }else {
      return cljs.core.persistent_BANG_.call(null, out__16125)
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
  var this__16128 = this;
  if(cljs.core.truth_(this__16128.editable_QMARK_)) {
    var idx__16129 = cljs.core.array_map_index_of.call(null, tcoll, key);
    if(idx__16129 >= 0) {
      this__16128.arr[idx__16129] = this__16128.arr[this__16128.len - 2];
      this__16128.arr[idx__16129 + 1] = this__16128.arr[this__16128.len - 1];
      var G__16130__16131 = this__16128.arr;
      G__16130__16131.pop();
      G__16130__16131.pop();
      G__16130__16131;
      this__16128.len = this__16128.len - 2
    }else {
    }
    return tcoll
  }else {
    throw new Error("dissoc! after persistent!");
  }
};
cljs.core.TransientArrayMap.prototype.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3 = function(tcoll, key, val) {
  var this__16132 = this;
  if(cljs.core.truth_(this__16132.editable_QMARK_)) {
    var idx__16133 = cljs.core.array_map_index_of.call(null, tcoll, key);
    if(idx__16133 === -1) {
      if(this__16132.len + 2 <= 2 * cljs.core.PersistentArrayMap.HASHMAP_THRESHOLD) {
        this__16132.len = this__16132.len + 2;
        this__16132.arr.push(key);
        this__16132.arr.push(val);
        return tcoll
      }else {
        return cljs.core.assoc_BANG_.call(null, cljs.core.array__GT_transient_hash_map.call(null, this__16132.len, this__16132.arr), key, val)
      }
    }else {
      if(val === this__16132.arr[idx__16133 + 1]) {
        return tcoll
      }else {
        this__16132.arr[idx__16133 + 1] = val;
        return tcoll
      }
    }
  }else {
    throw new Error("assoc! after persistent!");
  }
};
cljs.core.TransientArrayMap.prototype.cljs$core$ITransientCollection$_conj_BANG_$arity$2 = function(tcoll, o) {
  var this__16134 = this;
  if(cljs.core.truth_(this__16134.editable_QMARK_)) {
    if(function() {
      var G__16135__16136 = o;
      if(G__16135__16136) {
        if(function() {
          var or__3824__auto____16137 = G__16135__16136.cljs$lang$protocol_mask$partition0$ & 2048;
          if(or__3824__auto____16137) {
            return or__3824__auto____16137
          }else {
            return G__16135__16136.cljs$core$IMapEntry$
          }
        }()) {
          return true
        }else {
          if(!G__16135__16136.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.IMapEntry, G__16135__16136)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.IMapEntry, G__16135__16136)
      }
    }()) {
      return tcoll.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3(tcoll, cljs.core.key.call(null, o), cljs.core.val.call(null, o))
    }else {
      var es__16138 = cljs.core.seq.call(null, o);
      var tcoll__16139 = tcoll;
      while(true) {
        var temp__3971__auto____16140 = cljs.core.first.call(null, es__16138);
        if(cljs.core.truth_(temp__3971__auto____16140)) {
          var e__16141 = temp__3971__auto____16140;
          var G__16147 = cljs.core.next.call(null, es__16138);
          var G__16148 = tcoll__16139.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3(tcoll__16139, cljs.core.key.call(null, e__16141), cljs.core.val.call(null, e__16141));
          es__16138 = G__16147;
          tcoll__16139 = G__16148;
          continue
        }else {
          return tcoll__16139
        }
        break
      }
    }
  }else {
    throw new Error("conj! after persistent!");
  }
};
cljs.core.TransientArrayMap.prototype.cljs$core$ITransientCollection$_persistent_BANG_$arity$1 = function(tcoll) {
  var this__16142 = this;
  if(cljs.core.truth_(this__16142.editable_QMARK_)) {
    this__16142.editable_QMARK_ = false;
    return new cljs.core.PersistentArrayMap(null, cljs.core.quot.call(null, this__16142.len, 2), this__16142.arr, null)
  }else {
    throw new Error("persistent! called twice");
  }
};
cljs.core.TransientArrayMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(tcoll, k) {
  var this__16143 = this;
  return tcoll.cljs$core$ILookup$_lookup$arity$3(tcoll, k, null)
};
cljs.core.TransientArrayMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(tcoll, k, not_found) {
  var this__16144 = this;
  if(cljs.core.truth_(this__16144.editable_QMARK_)) {
    var idx__16145 = cljs.core.array_map_index_of.call(null, tcoll, k);
    if(idx__16145 === -1) {
      return not_found
    }else {
      return this__16144.arr[idx__16145 + 1]
    }
  }else {
    throw new Error("lookup after persistent!");
  }
};
cljs.core.TransientArrayMap.prototype.cljs$core$ICounted$_count$arity$1 = function(tcoll) {
  var this__16146 = this;
  if(cljs.core.truth_(this__16146.editable_QMARK_)) {
    return cljs.core.quot.call(null, this__16146.len, 2)
  }else {
    throw new Error("count after persistent!");
  }
};
cljs.core.TransientArrayMap;
cljs.core.array__GT_transient_hash_map = function array__GT_transient_hash_map(len, arr) {
  var out__16151 = cljs.core.transient$.call(null, cljs.core.ObjMap.EMPTY);
  var i__16152 = 0;
  while(true) {
    if(i__16152 < len) {
      var G__16153 = cljs.core.assoc_BANG_.call(null, out__16151, arr[i__16152], arr[i__16152 + 1]);
      var G__16154 = i__16152 + 2;
      out__16151 = G__16153;
      i__16152 = G__16154;
      continue
    }else {
      return out__16151
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
    var G__16159__16160 = arr.slice();
    G__16159__16160[i] = a;
    return G__16159__16160
  };
  var clone_and_set__5 = function(arr, i, a, j, b) {
    var G__16161__16162 = arr.slice();
    G__16161__16162[i] = a;
    G__16161__16162[j] = b;
    return G__16161__16162
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
  var new_arr__16164 = cljs.core.make_array.call(null, arr.length - 2);
  cljs.core.array_copy.call(null, arr, 0, new_arr__16164, 0, 2 * i);
  cljs.core.array_copy.call(null, arr, 2 * (i + 1), new_arr__16164, 2 * i, new_arr__16164.length - 2 * i);
  return new_arr__16164
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
    var editable__16167 = inode.ensure_editable(edit);
    editable__16167.arr[i] = a;
    return editable__16167
  };
  var edit_and_set__6 = function(inode, edit, i, a, j, b) {
    var editable__16168 = inode.ensure_editable(edit);
    editable__16168.arr[i] = a;
    editable__16168.arr[j] = b;
    return editable__16168
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
  var len__16175 = arr.length;
  var i__16176 = 0;
  var init__16177 = init;
  while(true) {
    if(i__16176 < len__16175) {
      var init__16180 = function() {
        var k__16178 = arr[i__16176];
        if(!(k__16178 == null)) {
          return f.call(null, init__16177, k__16178, arr[i__16176 + 1])
        }else {
          var node__16179 = arr[i__16176 + 1];
          if(!(node__16179 == null)) {
            return node__16179.kv_reduce(f, init__16177)
          }else {
            return init__16177
          }
        }
      }();
      if(cljs.core.reduced_QMARK_.call(null, init__16180)) {
        return cljs.core.deref.call(null, init__16180)
      }else {
        var G__16181 = i__16176 + 2;
        var G__16182 = init__16180;
        i__16176 = G__16181;
        init__16177 = G__16182;
        continue
      }
    }else {
      return init__16177
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
  var this__16183 = this;
  var inode__16184 = this;
  if(this__16183.bitmap === bit) {
    return null
  }else {
    var editable__16185 = inode__16184.ensure_editable(e);
    var earr__16186 = editable__16185.arr;
    var len__16187 = earr__16186.length;
    editable__16185.bitmap = bit ^ editable__16185.bitmap;
    cljs.core.array_copy.call(null, earr__16186, 2 * (i + 1), earr__16186, 2 * i, len__16187 - 2 * (i + 1));
    earr__16186[len__16187 - 2] = null;
    earr__16186[len__16187 - 1] = null;
    return editable__16185
  }
};
cljs.core.BitmapIndexedNode.prototype.inode_assoc_BANG_ = function(edit, shift, hash, key, val, added_leaf_QMARK_) {
  var this__16188 = this;
  var inode__16189 = this;
  var bit__16190 = 1 << (hash >>> shift & 31);
  var idx__16191 = cljs.core.bitmap_indexed_node_index.call(null, this__16188.bitmap, bit__16190);
  if((this__16188.bitmap & bit__16190) === 0) {
    var n__16192 = cljs.core.bit_count.call(null, this__16188.bitmap);
    if(2 * n__16192 < this__16188.arr.length) {
      var editable__16193 = inode__16189.ensure_editable(edit);
      var earr__16194 = editable__16193.arr;
      added_leaf_QMARK_.val = true;
      cljs.core.array_copy_downward.call(null, earr__16194, 2 * idx__16191, earr__16194, 2 * (idx__16191 + 1), 2 * (n__16192 - idx__16191));
      earr__16194[2 * idx__16191] = key;
      earr__16194[2 * idx__16191 + 1] = val;
      editable__16193.bitmap = editable__16193.bitmap | bit__16190;
      return editable__16193
    }else {
      if(n__16192 >= 16) {
        var nodes__16195 = cljs.core.make_array.call(null, 32);
        var jdx__16196 = hash >>> shift & 31;
        nodes__16195[jdx__16196] = cljs.core.BitmapIndexedNode.EMPTY.inode_assoc_BANG_(edit, shift + 5, hash, key, val, added_leaf_QMARK_);
        var i__16197 = 0;
        var j__16198 = 0;
        while(true) {
          if(i__16197 < 32) {
            if((this__16188.bitmap >>> i__16197 & 1) === 0) {
              var G__16251 = i__16197 + 1;
              var G__16252 = j__16198;
              i__16197 = G__16251;
              j__16198 = G__16252;
              continue
            }else {
              nodes__16195[i__16197] = !(this__16188.arr[j__16198] == null) ? cljs.core.BitmapIndexedNode.EMPTY.inode_assoc_BANG_(edit, shift + 5, cljs.core.hash.call(null, this__16188.arr[j__16198]), this__16188.arr[j__16198], this__16188.arr[j__16198 + 1], added_leaf_QMARK_) : this__16188.arr[j__16198 + 1];
              var G__16253 = i__16197 + 1;
              var G__16254 = j__16198 + 2;
              i__16197 = G__16253;
              j__16198 = G__16254;
              continue
            }
          }else {
          }
          break
        }
        return new cljs.core.ArrayNode(edit, n__16192 + 1, nodes__16195)
      }else {
        if("\ufdd0'else") {
          var new_arr__16199 = cljs.core.make_array.call(null, 2 * (n__16192 + 4));
          cljs.core.array_copy.call(null, this__16188.arr, 0, new_arr__16199, 0, 2 * idx__16191);
          new_arr__16199[2 * idx__16191] = key;
          new_arr__16199[2 * idx__16191 + 1] = val;
          cljs.core.array_copy.call(null, this__16188.arr, 2 * idx__16191, new_arr__16199, 2 * (idx__16191 + 1), 2 * (n__16192 - idx__16191));
          added_leaf_QMARK_.val = true;
          var editable__16200 = inode__16189.ensure_editable(edit);
          editable__16200.arr = new_arr__16199;
          editable__16200.bitmap = editable__16200.bitmap | bit__16190;
          return editable__16200
        }else {
          return null
        }
      }
    }
  }else {
    var key_or_nil__16201 = this__16188.arr[2 * idx__16191];
    var val_or_node__16202 = this__16188.arr[2 * idx__16191 + 1];
    if(key_or_nil__16201 == null) {
      var n__16203 = val_or_node__16202.inode_assoc_BANG_(edit, shift + 5, hash, key, val, added_leaf_QMARK_);
      if(n__16203 === val_or_node__16202) {
        return inode__16189
      }else {
        return cljs.core.edit_and_set.call(null, inode__16189, edit, 2 * idx__16191 + 1, n__16203)
      }
    }else {
      if(cljs.core.key_test.call(null, key, key_or_nil__16201)) {
        if(val === val_or_node__16202) {
          return inode__16189
        }else {
          return cljs.core.edit_and_set.call(null, inode__16189, edit, 2 * idx__16191 + 1, val)
        }
      }else {
        if("\ufdd0'else") {
          added_leaf_QMARK_.val = true;
          return cljs.core.edit_and_set.call(null, inode__16189, edit, 2 * idx__16191, null, 2 * idx__16191 + 1, cljs.core.create_node.call(null, edit, shift + 5, key_or_nil__16201, val_or_node__16202, hash, key, val))
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.BitmapIndexedNode.prototype.inode_seq = function() {
  var this__16204 = this;
  var inode__16205 = this;
  return cljs.core.create_inode_seq.call(null, this__16204.arr)
};
cljs.core.BitmapIndexedNode.prototype.inode_without_BANG_ = function(edit, shift, hash, key, removed_leaf_QMARK_) {
  var this__16206 = this;
  var inode__16207 = this;
  var bit__16208 = 1 << (hash >>> shift & 31);
  if((this__16206.bitmap & bit__16208) === 0) {
    return inode__16207
  }else {
    var idx__16209 = cljs.core.bitmap_indexed_node_index.call(null, this__16206.bitmap, bit__16208);
    var key_or_nil__16210 = this__16206.arr[2 * idx__16209];
    var val_or_node__16211 = this__16206.arr[2 * idx__16209 + 1];
    if(key_or_nil__16210 == null) {
      var n__16212 = val_or_node__16211.inode_without_BANG_(edit, shift + 5, hash, key, removed_leaf_QMARK_);
      if(n__16212 === val_or_node__16211) {
        return inode__16207
      }else {
        if(!(n__16212 == null)) {
          return cljs.core.edit_and_set.call(null, inode__16207, edit, 2 * idx__16209 + 1, n__16212)
        }else {
          if(this__16206.bitmap === bit__16208) {
            return null
          }else {
            if("\ufdd0'else") {
              return inode__16207.edit_and_remove_pair(edit, bit__16208, idx__16209)
            }else {
              return null
            }
          }
        }
      }
    }else {
      if(cljs.core.key_test.call(null, key, key_or_nil__16210)) {
        removed_leaf_QMARK_[0] = true;
        return inode__16207.edit_and_remove_pair(edit, bit__16208, idx__16209)
      }else {
        if("\ufdd0'else") {
          return inode__16207
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.BitmapIndexedNode.prototype.ensure_editable = function(e) {
  var this__16213 = this;
  var inode__16214 = this;
  if(e === this__16213.edit) {
    return inode__16214
  }else {
    var n__16215 = cljs.core.bit_count.call(null, this__16213.bitmap);
    var new_arr__16216 = cljs.core.make_array.call(null, n__16215 < 0 ? 4 : 2 * (n__16215 + 1));
    cljs.core.array_copy.call(null, this__16213.arr, 0, new_arr__16216, 0, 2 * n__16215);
    return new cljs.core.BitmapIndexedNode(e, this__16213.bitmap, new_arr__16216)
  }
};
cljs.core.BitmapIndexedNode.prototype.kv_reduce = function(f, init) {
  var this__16217 = this;
  var inode__16218 = this;
  return cljs.core.inode_kv_reduce.call(null, this__16217.arr, f, init)
};
cljs.core.BitmapIndexedNode.prototype.inode_find = function(shift, hash, key, not_found) {
  var this__16219 = this;
  var inode__16220 = this;
  var bit__16221 = 1 << (hash >>> shift & 31);
  if((this__16219.bitmap & bit__16221) === 0) {
    return not_found
  }else {
    var idx__16222 = cljs.core.bitmap_indexed_node_index.call(null, this__16219.bitmap, bit__16221);
    var key_or_nil__16223 = this__16219.arr[2 * idx__16222];
    var val_or_node__16224 = this__16219.arr[2 * idx__16222 + 1];
    if(key_or_nil__16223 == null) {
      return val_or_node__16224.inode_find(shift + 5, hash, key, not_found)
    }else {
      if(cljs.core.key_test.call(null, key, key_or_nil__16223)) {
        return cljs.core.PersistentVector.fromArray([key_or_nil__16223, val_or_node__16224], true)
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
  var this__16225 = this;
  var inode__16226 = this;
  var bit__16227 = 1 << (hash >>> shift & 31);
  if((this__16225.bitmap & bit__16227) === 0) {
    return inode__16226
  }else {
    var idx__16228 = cljs.core.bitmap_indexed_node_index.call(null, this__16225.bitmap, bit__16227);
    var key_or_nil__16229 = this__16225.arr[2 * idx__16228];
    var val_or_node__16230 = this__16225.arr[2 * idx__16228 + 1];
    if(key_or_nil__16229 == null) {
      var n__16231 = val_or_node__16230.inode_without(shift + 5, hash, key);
      if(n__16231 === val_or_node__16230) {
        return inode__16226
      }else {
        if(!(n__16231 == null)) {
          return new cljs.core.BitmapIndexedNode(null, this__16225.bitmap, cljs.core.clone_and_set.call(null, this__16225.arr, 2 * idx__16228 + 1, n__16231))
        }else {
          if(this__16225.bitmap === bit__16227) {
            return null
          }else {
            if("\ufdd0'else") {
              return new cljs.core.BitmapIndexedNode(null, this__16225.bitmap ^ bit__16227, cljs.core.remove_pair.call(null, this__16225.arr, idx__16228))
            }else {
              return null
            }
          }
        }
      }
    }else {
      if(cljs.core.key_test.call(null, key, key_or_nil__16229)) {
        return new cljs.core.BitmapIndexedNode(null, this__16225.bitmap ^ bit__16227, cljs.core.remove_pair.call(null, this__16225.arr, idx__16228))
      }else {
        if("\ufdd0'else") {
          return inode__16226
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.BitmapIndexedNode.prototype.inode_assoc = function(shift, hash, key, val, added_leaf_QMARK_) {
  var this__16232 = this;
  var inode__16233 = this;
  var bit__16234 = 1 << (hash >>> shift & 31);
  var idx__16235 = cljs.core.bitmap_indexed_node_index.call(null, this__16232.bitmap, bit__16234);
  if((this__16232.bitmap & bit__16234) === 0) {
    var n__16236 = cljs.core.bit_count.call(null, this__16232.bitmap);
    if(n__16236 >= 16) {
      var nodes__16237 = cljs.core.make_array.call(null, 32);
      var jdx__16238 = hash >>> shift & 31;
      nodes__16237[jdx__16238] = cljs.core.BitmapIndexedNode.EMPTY.inode_assoc(shift + 5, hash, key, val, added_leaf_QMARK_);
      var i__16239 = 0;
      var j__16240 = 0;
      while(true) {
        if(i__16239 < 32) {
          if((this__16232.bitmap >>> i__16239 & 1) === 0) {
            var G__16255 = i__16239 + 1;
            var G__16256 = j__16240;
            i__16239 = G__16255;
            j__16240 = G__16256;
            continue
          }else {
            nodes__16237[i__16239] = !(this__16232.arr[j__16240] == null) ? cljs.core.BitmapIndexedNode.EMPTY.inode_assoc(shift + 5, cljs.core.hash.call(null, this__16232.arr[j__16240]), this__16232.arr[j__16240], this__16232.arr[j__16240 + 1], added_leaf_QMARK_) : this__16232.arr[j__16240 + 1];
            var G__16257 = i__16239 + 1;
            var G__16258 = j__16240 + 2;
            i__16239 = G__16257;
            j__16240 = G__16258;
            continue
          }
        }else {
        }
        break
      }
      return new cljs.core.ArrayNode(null, n__16236 + 1, nodes__16237)
    }else {
      var new_arr__16241 = cljs.core.make_array.call(null, 2 * (n__16236 + 1));
      cljs.core.array_copy.call(null, this__16232.arr, 0, new_arr__16241, 0, 2 * idx__16235);
      new_arr__16241[2 * idx__16235] = key;
      new_arr__16241[2 * idx__16235 + 1] = val;
      cljs.core.array_copy.call(null, this__16232.arr, 2 * idx__16235, new_arr__16241, 2 * (idx__16235 + 1), 2 * (n__16236 - idx__16235));
      added_leaf_QMARK_.val = true;
      return new cljs.core.BitmapIndexedNode(null, this__16232.bitmap | bit__16234, new_arr__16241)
    }
  }else {
    var key_or_nil__16242 = this__16232.arr[2 * idx__16235];
    var val_or_node__16243 = this__16232.arr[2 * idx__16235 + 1];
    if(key_or_nil__16242 == null) {
      var n__16244 = val_or_node__16243.inode_assoc(shift + 5, hash, key, val, added_leaf_QMARK_);
      if(n__16244 === val_or_node__16243) {
        return inode__16233
      }else {
        return new cljs.core.BitmapIndexedNode(null, this__16232.bitmap, cljs.core.clone_and_set.call(null, this__16232.arr, 2 * idx__16235 + 1, n__16244))
      }
    }else {
      if(cljs.core.key_test.call(null, key, key_or_nil__16242)) {
        if(val === val_or_node__16243) {
          return inode__16233
        }else {
          return new cljs.core.BitmapIndexedNode(null, this__16232.bitmap, cljs.core.clone_and_set.call(null, this__16232.arr, 2 * idx__16235 + 1, val))
        }
      }else {
        if("\ufdd0'else") {
          added_leaf_QMARK_.val = true;
          return new cljs.core.BitmapIndexedNode(null, this__16232.bitmap, cljs.core.clone_and_set.call(null, this__16232.arr, 2 * idx__16235, null, 2 * idx__16235 + 1, cljs.core.create_node.call(null, shift + 5, key_or_nil__16242, val_or_node__16243, hash, key, val)))
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.BitmapIndexedNode.prototype.inode_lookup = function(shift, hash, key, not_found) {
  var this__16245 = this;
  var inode__16246 = this;
  var bit__16247 = 1 << (hash >>> shift & 31);
  if((this__16245.bitmap & bit__16247) === 0) {
    return not_found
  }else {
    var idx__16248 = cljs.core.bitmap_indexed_node_index.call(null, this__16245.bitmap, bit__16247);
    var key_or_nil__16249 = this__16245.arr[2 * idx__16248];
    var val_or_node__16250 = this__16245.arr[2 * idx__16248 + 1];
    if(key_or_nil__16249 == null) {
      return val_or_node__16250.inode_lookup(shift + 5, hash, key, not_found)
    }else {
      if(cljs.core.key_test.call(null, key, key_or_nil__16249)) {
        return val_or_node__16250
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
  var arr__16266 = array_node.arr;
  var len__16267 = 2 * (array_node.cnt - 1);
  var new_arr__16268 = cljs.core.make_array.call(null, len__16267);
  var i__16269 = 0;
  var j__16270 = 1;
  var bitmap__16271 = 0;
  while(true) {
    if(i__16269 < len__16267) {
      if(function() {
        var and__3822__auto____16272 = !(i__16269 === idx);
        if(and__3822__auto____16272) {
          return!(arr__16266[i__16269] == null)
        }else {
          return and__3822__auto____16272
        }
      }()) {
        new_arr__16268[j__16270] = arr__16266[i__16269];
        var G__16273 = i__16269 + 1;
        var G__16274 = j__16270 + 2;
        var G__16275 = bitmap__16271 | 1 << i__16269;
        i__16269 = G__16273;
        j__16270 = G__16274;
        bitmap__16271 = G__16275;
        continue
      }else {
        var G__16276 = i__16269 + 1;
        var G__16277 = j__16270;
        var G__16278 = bitmap__16271;
        i__16269 = G__16276;
        j__16270 = G__16277;
        bitmap__16271 = G__16278;
        continue
      }
    }else {
      return new cljs.core.BitmapIndexedNode(edit, bitmap__16271, new_arr__16268)
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
  var this__16279 = this;
  var inode__16280 = this;
  var idx__16281 = hash >>> shift & 31;
  var node__16282 = this__16279.arr[idx__16281];
  if(node__16282 == null) {
    var editable__16283 = cljs.core.edit_and_set.call(null, inode__16280, edit, idx__16281, cljs.core.BitmapIndexedNode.EMPTY.inode_assoc_BANG_(edit, shift + 5, hash, key, val, added_leaf_QMARK_));
    editable__16283.cnt = editable__16283.cnt + 1;
    return editable__16283
  }else {
    var n__16284 = node__16282.inode_assoc_BANG_(edit, shift + 5, hash, key, val, added_leaf_QMARK_);
    if(n__16284 === node__16282) {
      return inode__16280
    }else {
      return cljs.core.edit_and_set.call(null, inode__16280, edit, idx__16281, n__16284)
    }
  }
};
cljs.core.ArrayNode.prototype.inode_seq = function() {
  var this__16285 = this;
  var inode__16286 = this;
  return cljs.core.create_array_node_seq.call(null, this__16285.arr)
};
cljs.core.ArrayNode.prototype.inode_without_BANG_ = function(edit, shift, hash, key, removed_leaf_QMARK_) {
  var this__16287 = this;
  var inode__16288 = this;
  var idx__16289 = hash >>> shift & 31;
  var node__16290 = this__16287.arr[idx__16289];
  if(node__16290 == null) {
    return inode__16288
  }else {
    var n__16291 = node__16290.inode_without_BANG_(edit, shift + 5, hash, key, removed_leaf_QMARK_);
    if(n__16291 === node__16290) {
      return inode__16288
    }else {
      if(n__16291 == null) {
        if(this__16287.cnt <= 8) {
          return cljs.core.pack_array_node.call(null, inode__16288, edit, idx__16289)
        }else {
          var editable__16292 = cljs.core.edit_and_set.call(null, inode__16288, edit, idx__16289, n__16291);
          editable__16292.cnt = editable__16292.cnt - 1;
          return editable__16292
        }
      }else {
        if("\ufdd0'else") {
          return cljs.core.edit_and_set.call(null, inode__16288, edit, idx__16289, n__16291)
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.ArrayNode.prototype.ensure_editable = function(e) {
  var this__16293 = this;
  var inode__16294 = this;
  if(e === this__16293.edit) {
    return inode__16294
  }else {
    return new cljs.core.ArrayNode(e, this__16293.cnt, this__16293.arr.slice())
  }
};
cljs.core.ArrayNode.prototype.kv_reduce = function(f, init) {
  var this__16295 = this;
  var inode__16296 = this;
  var len__16297 = this__16295.arr.length;
  var i__16298 = 0;
  var init__16299 = init;
  while(true) {
    if(i__16298 < len__16297) {
      var node__16300 = this__16295.arr[i__16298];
      if(!(node__16300 == null)) {
        var init__16301 = node__16300.kv_reduce(f, init__16299);
        if(cljs.core.reduced_QMARK_.call(null, init__16301)) {
          return cljs.core.deref.call(null, init__16301)
        }else {
          var G__16320 = i__16298 + 1;
          var G__16321 = init__16301;
          i__16298 = G__16320;
          init__16299 = G__16321;
          continue
        }
      }else {
        return null
      }
    }else {
      return init__16299
    }
    break
  }
};
cljs.core.ArrayNode.prototype.inode_find = function(shift, hash, key, not_found) {
  var this__16302 = this;
  var inode__16303 = this;
  var idx__16304 = hash >>> shift & 31;
  var node__16305 = this__16302.arr[idx__16304];
  if(!(node__16305 == null)) {
    return node__16305.inode_find(shift + 5, hash, key, not_found)
  }else {
    return not_found
  }
};
cljs.core.ArrayNode.prototype.inode_without = function(shift, hash, key) {
  var this__16306 = this;
  var inode__16307 = this;
  var idx__16308 = hash >>> shift & 31;
  var node__16309 = this__16306.arr[idx__16308];
  if(!(node__16309 == null)) {
    var n__16310 = node__16309.inode_without(shift + 5, hash, key);
    if(n__16310 === node__16309) {
      return inode__16307
    }else {
      if(n__16310 == null) {
        if(this__16306.cnt <= 8) {
          return cljs.core.pack_array_node.call(null, inode__16307, null, idx__16308)
        }else {
          return new cljs.core.ArrayNode(null, this__16306.cnt - 1, cljs.core.clone_and_set.call(null, this__16306.arr, idx__16308, n__16310))
        }
      }else {
        if("\ufdd0'else") {
          return new cljs.core.ArrayNode(null, this__16306.cnt, cljs.core.clone_and_set.call(null, this__16306.arr, idx__16308, n__16310))
        }else {
          return null
        }
      }
    }
  }else {
    return inode__16307
  }
};
cljs.core.ArrayNode.prototype.inode_assoc = function(shift, hash, key, val, added_leaf_QMARK_) {
  var this__16311 = this;
  var inode__16312 = this;
  var idx__16313 = hash >>> shift & 31;
  var node__16314 = this__16311.arr[idx__16313];
  if(node__16314 == null) {
    return new cljs.core.ArrayNode(null, this__16311.cnt + 1, cljs.core.clone_and_set.call(null, this__16311.arr, idx__16313, cljs.core.BitmapIndexedNode.EMPTY.inode_assoc(shift + 5, hash, key, val, added_leaf_QMARK_)))
  }else {
    var n__16315 = node__16314.inode_assoc(shift + 5, hash, key, val, added_leaf_QMARK_);
    if(n__16315 === node__16314) {
      return inode__16312
    }else {
      return new cljs.core.ArrayNode(null, this__16311.cnt, cljs.core.clone_and_set.call(null, this__16311.arr, idx__16313, n__16315))
    }
  }
};
cljs.core.ArrayNode.prototype.inode_lookup = function(shift, hash, key, not_found) {
  var this__16316 = this;
  var inode__16317 = this;
  var idx__16318 = hash >>> shift & 31;
  var node__16319 = this__16316.arr[idx__16318];
  if(!(node__16319 == null)) {
    return node__16319.inode_lookup(shift + 5, hash, key, not_found)
  }else {
    return not_found
  }
};
cljs.core.ArrayNode;
cljs.core.hash_collision_node_find_index = function hash_collision_node_find_index(arr, cnt, key) {
  var lim__16324 = 2 * cnt;
  var i__16325 = 0;
  while(true) {
    if(i__16325 < lim__16324) {
      if(cljs.core.key_test.call(null, key, arr[i__16325])) {
        return i__16325
      }else {
        var G__16326 = i__16325 + 2;
        i__16325 = G__16326;
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
  var this__16327 = this;
  var inode__16328 = this;
  if(hash === this__16327.collision_hash) {
    var idx__16329 = cljs.core.hash_collision_node_find_index.call(null, this__16327.arr, this__16327.cnt, key);
    if(idx__16329 === -1) {
      if(this__16327.arr.length > 2 * this__16327.cnt) {
        var editable__16330 = cljs.core.edit_and_set.call(null, inode__16328, edit, 2 * this__16327.cnt, key, 2 * this__16327.cnt + 1, val);
        added_leaf_QMARK_.val = true;
        editable__16330.cnt = editable__16330.cnt + 1;
        return editable__16330
      }else {
        var len__16331 = this__16327.arr.length;
        var new_arr__16332 = cljs.core.make_array.call(null, len__16331 + 2);
        cljs.core.array_copy.call(null, this__16327.arr, 0, new_arr__16332, 0, len__16331);
        new_arr__16332[len__16331] = key;
        new_arr__16332[len__16331 + 1] = val;
        added_leaf_QMARK_.val = true;
        return inode__16328.ensure_editable_array(edit, this__16327.cnt + 1, new_arr__16332)
      }
    }else {
      if(this__16327.arr[idx__16329 + 1] === val) {
        return inode__16328
      }else {
        return cljs.core.edit_and_set.call(null, inode__16328, edit, idx__16329 + 1, val)
      }
    }
  }else {
    return(new cljs.core.BitmapIndexedNode(edit, 1 << (this__16327.collision_hash >>> shift & 31), [null, inode__16328, null, null])).inode_assoc_BANG_(edit, shift, hash, key, val, added_leaf_QMARK_)
  }
};
cljs.core.HashCollisionNode.prototype.inode_seq = function() {
  var this__16333 = this;
  var inode__16334 = this;
  return cljs.core.create_inode_seq.call(null, this__16333.arr)
};
cljs.core.HashCollisionNode.prototype.inode_without_BANG_ = function(edit, shift, hash, key, removed_leaf_QMARK_) {
  var this__16335 = this;
  var inode__16336 = this;
  var idx__16337 = cljs.core.hash_collision_node_find_index.call(null, this__16335.arr, this__16335.cnt, key);
  if(idx__16337 === -1) {
    return inode__16336
  }else {
    removed_leaf_QMARK_[0] = true;
    if(this__16335.cnt === 1) {
      return null
    }else {
      var editable__16338 = inode__16336.ensure_editable(edit);
      var earr__16339 = editable__16338.arr;
      earr__16339[idx__16337] = earr__16339[2 * this__16335.cnt - 2];
      earr__16339[idx__16337 + 1] = earr__16339[2 * this__16335.cnt - 1];
      earr__16339[2 * this__16335.cnt - 1] = null;
      earr__16339[2 * this__16335.cnt - 2] = null;
      editable__16338.cnt = editable__16338.cnt - 1;
      return editable__16338
    }
  }
};
cljs.core.HashCollisionNode.prototype.ensure_editable = function(e) {
  var this__16340 = this;
  var inode__16341 = this;
  if(e === this__16340.edit) {
    return inode__16341
  }else {
    var new_arr__16342 = cljs.core.make_array.call(null, 2 * (this__16340.cnt + 1));
    cljs.core.array_copy.call(null, this__16340.arr, 0, new_arr__16342, 0, 2 * this__16340.cnt);
    return new cljs.core.HashCollisionNode(e, this__16340.collision_hash, this__16340.cnt, new_arr__16342)
  }
};
cljs.core.HashCollisionNode.prototype.kv_reduce = function(f, init) {
  var this__16343 = this;
  var inode__16344 = this;
  return cljs.core.inode_kv_reduce.call(null, this__16343.arr, f, init)
};
cljs.core.HashCollisionNode.prototype.inode_find = function(shift, hash, key, not_found) {
  var this__16345 = this;
  var inode__16346 = this;
  var idx__16347 = cljs.core.hash_collision_node_find_index.call(null, this__16345.arr, this__16345.cnt, key);
  if(idx__16347 < 0) {
    return not_found
  }else {
    if(cljs.core.key_test.call(null, key, this__16345.arr[idx__16347])) {
      return cljs.core.PersistentVector.fromArray([this__16345.arr[idx__16347], this__16345.arr[idx__16347 + 1]], true)
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
  var this__16348 = this;
  var inode__16349 = this;
  var idx__16350 = cljs.core.hash_collision_node_find_index.call(null, this__16348.arr, this__16348.cnt, key);
  if(idx__16350 === -1) {
    return inode__16349
  }else {
    if(this__16348.cnt === 1) {
      return null
    }else {
      if("\ufdd0'else") {
        return new cljs.core.HashCollisionNode(null, this__16348.collision_hash, this__16348.cnt - 1, cljs.core.remove_pair.call(null, this__16348.arr, cljs.core.quot.call(null, idx__16350, 2)))
      }else {
        return null
      }
    }
  }
};
cljs.core.HashCollisionNode.prototype.inode_assoc = function(shift, hash, key, val, added_leaf_QMARK_) {
  var this__16351 = this;
  var inode__16352 = this;
  if(hash === this__16351.collision_hash) {
    var idx__16353 = cljs.core.hash_collision_node_find_index.call(null, this__16351.arr, this__16351.cnt, key);
    if(idx__16353 === -1) {
      var len__16354 = this__16351.arr.length;
      var new_arr__16355 = cljs.core.make_array.call(null, len__16354 + 2);
      cljs.core.array_copy.call(null, this__16351.arr, 0, new_arr__16355, 0, len__16354);
      new_arr__16355[len__16354] = key;
      new_arr__16355[len__16354 + 1] = val;
      added_leaf_QMARK_.val = true;
      return new cljs.core.HashCollisionNode(null, this__16351.collision_hash, this__16351.cnt + 1, new_arr__16355)
    }else {
      if(cljs.core._EQ_.call(null, this__16351.arr[idx__16353], val)) {
        return inode__16352
      }else {
        return new cljs.core.HashCollisionNode(null, this__16351.collision_hash, this__16351.cnt, cljs.core.clone_and_set.call(null, this__16351.arr, idx__16353 + 1, val))
      }
    }
  }else {
    return(new cljs.core.BitmapIndexedNode(null, 1 << (this__16351.collision_hash >>> shift & 31), [null, inode__16352])).inode_assoc(shift, hash, key, val, added_leaf_QMARK_)
  }
};
cljs.core.HashCollisionNode.prototype.inode_lookup = function(shift, hash, key, not_found) {
  var this__16356 = this;
  var inode__16357 = this;
  var idx__16358 = cljs.core.hash_collision_node_find_index.call(null, this__16356.arr, this__16356.cnt, key);
  if(idx__16358 < 0) {
    return not_found
  }else {
    if(cljs.core.key_test.call(null, key, this__16356.arr[idx__16358])) {
      return this__16356.arr[idx__16358 + 1]
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
  var this__16359 = this;
  var inode__16360 = this;
  if(e === this__16359.edit) {
    this__16359.arr = array;
    this__16359.cnt = count;
    return inode__16360
  }else {
    return new cljs.core.HashCollisionNode(this__16359.edit, this__16359.collision_hash, count, array)
  }
};
cljs.core.HashCollisionNode;
cljs.core.create_node = function() {
  var create_node = null;
  var create_node__6 = function(shift, key1, val1, key2hash, key2, val2) {
    var key1hash__16365 = cljs.core.hash.call(null, key1);
    if(key1hash__16365 === key2hash) {
      return new cljs.core.HashCollisionNode(null, key1hash__16365, 2, [key1, val1, key2, val2])
    }else {
      var added_leaf_QMARK___16366 = new cljs.core.Box(false);
      return cljs.core.BitmapIndexedNode.EMPTY.inode_assoc(shift, key1hash__16365, key1, val1, added_leaf_QMARK___16366).inode_assoc(shift, key2hash, key2, val2, added_leaf_QMARK___16366)
    }
  };
  var create_node__7 = function(edit, shift, key1, val1, key2hash, key2, val2) {
    var key1hash__16367 = cljs.core.hash.call(null, key1);
    if(key1hash__16367 === key2hash) {
      return new cljs.core.HashCollisionNode(null, key1hash__16367, 2, [key1, val1, key2, val2])
    }else {
      var added_leaf_QMARK___16368 = new cljs.core.Box(false);
      return cljs.core.BitmapIndexedNode.EMPTY.inode_assoc_BANG_(edit, shift, key1hash__16367, key1, val1, added_leaf_QMARK___16368).inode_assoc_BANG_(edit, shift, key2hash, key2, val2, added_leaf_QMARK___16368)
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
  var this__16369 = this;
  var h__2192__auto____16370 = this__16369.__hash;
  if(!(h__2192__auto____16370 == null)) {
    return h__2192__auto____16370
  }else {
    var h__2192__auto____16371 = cljs.core.hash_coll.call(null, coll);
    this__16369.__hash = h__2192__auto____16371;
    return h__2192__auto____16371
  }
};
cljs.core.NodeSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__16372 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.NodeSeq.prototype.toString = function() {
  var this__16373 = this;
  var this__16374 = this;
  return cljs.core.pr_str.call(null, this__16374)
};
cljs.core.NodeSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(this$) {
  var this__16375 = this;
  return this$
};
cljs.core.NodeSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__16376 = this;
  if(this__16376.s == null) {
    return cljs.core.PersistentVector.fromArray([this__16376.nodes[this__16376.i], this__16376.nodes[this__16376.i + 1]], true)
  }else {
    return cljs.core.first.call(null, this__16376.s)
  }
};
cljs.core.NodeSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__16377 = this;
  if(this__16377.s == null) {
    return cljs.core.create_inode_seq.call(null, this__16377.nodes, this__16377.i + 2, null)
  }else {
    return cljs.core.create_inode_seq.call(null, this__16377.nodes, this__16377.i, cljs.core.next.call(null, this__16377.s))
  }
};
cljs.core.NodeSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__16378 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.NodeSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__16379 = this;
  return new cljs.core.NodeSeq(meta, this__16379.nodes, this__16379.i, this__16379.s, this__16379.__hash)
};
cljs.core.NodeSeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__16380 = this;
  return this__16380.meta
};
cljs.core.NodeSeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__16381 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__16381.meta)
};
cljs.core.NodeSeq;
cljs.core.create_inode_seq = function() {
  var create_inode_seq = null;
  var create_inode_seq__1 = function(nodes) {
    return create_inode_seq.call(null, nodes, 0, null)
  };
  var create_inode_seq__3 = function(nodes, i, s) {
    if(s == null) {
      var len__16388 = nodes.length;
      var j__16389 = i;
      while(true) {
        if(j__16389 < len__16388) {
          if(!(nodes[j__16389] == null)) {
            return new cljs.core.NodeSeq(null, nodes, j__16389, null, null)
          }else {
            var temp__3971__auto____16390 = nodes[j__16389 + 1];
            if(cljs.core.truth_(temp__3971__auto____16390)) {
              var node__16391 = temp__3971__auto____16390;
              var temp__3971__auto____16392 = node__16391.inode_seq();
              if(cljs.core.truth_(temp__3971__auto____16392)) {
                var node_seq__16393 = temp__3971__auto____16392;
                return new cljs.core.NodeSeq(null, nodes, j__16389 + 2, node_seq__16393, null)
              }else {
                var G__16394 = j__16389 + 2;
                j__16389 = G__16394;
                continue
              }
            }else {
              var G__16395 = j__16389 + 2;
              j__16389 = G__16395;
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
  var this__16396 = this;
  var h__2192__auto____16397 = this__16396.__hash;
  if(!(h__2192__auto____16397 == null)) {
    return h__2192__auto____16397
  }else {
    var h__2192__auto____16398 = cljs.core.hash_coll.call(null, coll);
    this__16396.__hash = h__2192__auto____16398;
    return h__2192__auto____16398
  }
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__16399 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.ArrayNodeSeq.prototype.toString = function() {
  var this__16400 = this;
  var this__16401 = this;
  return cljs.core.pr_str.call(null, this__16401)
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(this$) {
  var this__16402 = this;
  return this$
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__16403 = this;
  return cljs.core.first.call(null, this__16403.s)
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__16404 = this;
  return cljs.core.create_array_node_seq.call(null, null, this__16404.nodes, this__16404.i, cljs.core.next.call(null, this__16404.s))
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__16405 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__16406 = this;
  return new cljs.core.ArrayNodeSeq(meta, this__16406.nodes, this__16406.i, this__16406.s, this__16406.__hash)
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__16407 = this;
  return this__16407.meta
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__16408 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__16408.meta)
};
cljs.core.ArrayNodeSeq;
cljs.core.create_array_node_seq = function() {
  var create_array_node_seq = null;
  var create_array_node_seq__1 = function(nodes) {
    return create_array_node_seq.call(null, null, nodes, 0, null)
  };
  var create_array_node_seq__4 = function(meta, nodes, i, s) {
    if(s == null) {
      var len__16415 = nodes.length;
      var j__16416 = i;
      while(true) {
        if(j__16416 < len__16415) {
          var temp__3971__auto____16417 = nodes[j__16416];
          if(cljs.core.truth_(temp__3971__auto____16417)) {
            var nj__16418 = temp__3971__auto____16417;
            var temp__3971__auto____16419 = nj__16418.inode_seq();
            if(cljs.core.truth_(temp__3971__auto____16419)) {
              var ns__16420 = temp__3971__auto____16419;
              return new cljs.core.ArrayNodeSeq(meta, nodes, j__16416 + 1, ns__16420, null)
            }else {
              var G__16421 = j__16416 + 1;
              j__16416 = G__16421;
              continue
            }
          }else {
            var G__16422 = j__16416 + 1;
            j__16416 = G__16422;
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
  var this__16425 = this;
  return new cljs.core.TransientHashMap({}, this__16425.root, this__16425.cnt, this__16425.has_nil_QMARK_, this__16425.nil_val)
};
cljs.core.PersistentHashMap.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__16426 = this;
  var h__2192__auto____16427 = this__16426.__hash;
  if(!(h__2192__auto____16427 == null)) {
    return h__2192__auto____16427
  }else {
    var h__2192__auto____16428 = cljs.core.hash_imap.call(null, coll);
    this__16426.__hash = h__2192__auto____16428;
    return h__2192__auto____16428
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__16429 = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(coll, k, null)
};
cljs.core.PersistentHashMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__16430 = this;
  if(k == null) {
    if(this__16430.has_nil_QMARK_) {
      return this__16430.nil_val
    }else {
      return not_found
    }
  }else {
    if(this__16430.root == null) {
      return not_found
    }else {
      if("\ufdd0'else") {
        return this__16430.root.inode_lookup(0, cljs.core.hash.call(null, k), k, not_found)
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__16431 = this;
  if(k == null) {
    if(function() {
      var and__3822__auto____16432 = this__16431.has_nil_QMARK_;
      if(and__3822__auto____16432) {
        return v === this__16431.nil_val
      }else {
        return and__3822__auto____16432
      }
    }()) {
      return coll
    }else {
      return new cljs.core.PersistentHashMap(this__16431.meta, this__16431.has_nil_QMARK_ ? this__16431.cnt : this__16431.cnt + 1, this__16431.root, true, v, null)
    }
  }else {
    var added_leaf_QMARK___16433 = new cljs.core.Box(false);
    var new_root__16434 = (this__16431.root == null ? cljs.core.BitmapIndexedNode.EMPTY : this__16431.root).inode_assoc(0, cljs.core.hash.call(null, k), k, v, added_leaf_QMARK___16433);
    if(new_root__16434 === this__16431.root) {
      return coll
    }else {
      return new cljs.core.PersistentHashMap(this__16431.meta, added_leaf_QMARK___16433.val ? this__16431.cnt + 1 : this__16431.cnt, new_root__16434, this__16431.has_nil_QMARK_, this__16431.nil_val, null)
    }
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = function(coll, k) {
  var this__16435 = this;
  if(k == null) {
    return this__16435.has_nil_QMARK_
  }else {
    if(this__16435.root == null) {
      return false
    }else {
      if("\ufdd0'else") {
        return!(this__16435.root.inode_lookup(0, cljs.core.hash.call(null, k), k, cljs.core.lookup_sentinel) === cljs.core.lookup_sentinel)
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentHashMap.prototype.call = function() {
  var G__16458 = null;
  var G__16458__2 = function(this_sym16436, k) {
    var this__16438 = this;
    var this_sym16436__16439 = this;
    var coll__16440 = this_sym16436__16439;
    return coll__16440.cljs$core$ILookup$_lookup$arity$2(coll__16440, k)
  };
  var G__16458__3 = function(this_sym16437, k, not_found) {
    var this__16438 = this;
    var this_sym16437__16441 = this;
    var coll__16442 = this_sym16437__16441;
    return coll__16442.cljs$core$ILookup$_lookup$arity$3(coll__16442, k, not_found)
  };
  G__16458 = function(this_sym16437, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__16458__2.call(this, this_sym16437, k);
      case 3:
        return G__16458__3.call(this, this_sym16437, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__16458
}();
cljs.core.PersistentHashMap.prototype.apply = function(this_sym16423, args16424) {
  var this__16443 = this;
  return this_sym16423.call.apply(this_sym16423, [this_sym16423].concat(args16424.slice()))
};
cljs.core.PersistentHashMap.prototype.cljs$core$IKVReduce$_kv_reduce$arity$3 = function(coll, f, init) {
  var this__16444 = this;
  var init__16445 = this__16444.has_nil_QMARK_ ? f.call(null, init, null, this__16444.nil_val) : init;
  if(cljs.core.reduced_QMARK_.call(null, init__16445)) {
    return cljs.core.deref.call(null, init__16445)
  }else {
    if(!(this__16444.root == null)) {
      return this__16444.root.kv_reduce(f, init__16445)
    }else {
      if("\ufdd0'else") {
        return init__16445
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, entry) {
  var this__16446 = this;
  if(cljs.core.vector_QMARK_.call(null, entry)) {
    return coll.cljs$core$IAssociative$_assoc$arity$3(coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.PersistentHashMap.prototype.toString = function() {
  var this__16447 = this;
  var this__16448 = this;
  return cljs.core.pr_str.call(null, this__16448)
};
cljs.core.PersistentHashMap.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__16449 = this;
  if(this__16449.cnt > 0) {
    var s__16450 = !(this__16449.root == null) ? this__16449.root.inode_seq() : null;
    if(this__16449.has_nil_QMARK_) {
      return cljs.core.cons.call(null, cljs.core.PersistentVector.fromArray([null, this__16449.nil_val], true), s__16450)
    }else {
      return s__16450
    }
  }else {
    return null
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__16451 = this;
  return this__16451.cnt
};
cljs.core.PersistentHashMap.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__16452 = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.PersistentHashMap.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__16453 = this;
  return new cljs.core.PersistentHashMap(meta, this__16453.cnt, this__16453.root, this__16453.has_nil_QMARK_, this__16453.nil_val, this__16453.__hash)
};
cljs.core.PersistentHashMap.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__16454 = this;
  return this__16454.meta
};
cljs.core.PersistentHashMap.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__16455 = this;
  return cljs.core._with_meta.call(null, cljs.core.PersistentHashMap.EMPTY, this__16455.meta)
};
cljs.core.PersistentHashMap.prototype.cljs$core$IMap$_dissoc$arity$2 = function(coll, k) {
  var this__16456 = this;
  if(k == null) {
    if(this__16456.has_nil_QMARK_) {
      return new cljs.core.PersistentHashMap(this__16456.meta, this__16456.cnt - 1, this__16456.root, false, null, null)
    }else {
      return coll
    }
  }else {
    if(this__16456.root == null) {
      return coll
    }else {
      if("\ufdd0'else") {
        var new_root__16457 = this__16456.root.inode_without(0, cljs.core.hash.call(null, k), k);
        if(new_root__16457 === this__16456.root) {
          return coll
        }else {
          return new cljs.core.PersistentHashMap(this__16456.meta, this__16456.cnt - 1, new_root__16457, this__16456.has_nil_QMARK_, this__16456.nil_val, null)
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
  var len__16459 = ks.length;
  var i__16460 = 0;
  var out__16461 = cljs.core.transient$.call(null, cljs.core.PersistentHashMap.EMPTY);
  while(true) {
    if(i__16460 < len__16459) {
      var G__16462 = i__16460 + 1;
      var G__16463 = cljs.core.assoc_BANG_.call(null, out__16461, ks[i__16460], vs[i__16460]);
      i__16460 = G__16462;
      out__16461 = G__16463;
      continue
    }else {
      return cljs.core.persistent_BANG_.call(null, out__16461)
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
  var this__16464 = this;
  return tcoll.without_BANG_(key)
};
cljs.core.TransientHashMap.prototype.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3 = function(tcoll, key, val) {
  var this__16465 = this;
  return tcoll.assoc_BANG_(key, val)
};
cljs.core.TransientHashMap.prototype.cljs$core$ITransientCollection$_conj_BANG_$arity$2 = function(tcoll, val) {
  var this__16466 = this;
  return tcoll.conj_BANG_(val)
};
cljs.core.TransientHashMap.prototype.cljs$core$ITransientCollection$_persistent_BANG_$arity$1 = function(tcoll) {
  var this__16467 = this;
  return tcoll.persistent_BANG_()
};
cljs.core.TransientHashMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(tcoll, k) {
  var this__16468 = this;
  if(k == null) {
    if(this__16468.has_nil_QMARK_) {
      return this__16468.nil_val
    }else {
      return null
    }
  }else {
    if(this__16468.root == null) {
      return null
    }else {
      return this__16468.root.inode_lookup(0, cljs.core.hash.call(null, k), k)
    }
  }
};
cljs.core.TransientHashMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(tcoll, k, not_found) {
  var this__16469 = this;
  if(k == null) {
    if(this__16469.has_nil_QMARK_) {
      return this__16469.nil_val
    }else {
      return not_found
    }
  }else {
    if(this__16469.root == null) {
      return not_found
    }else {
      return this__16469.root.inode_lookup(0, cljs.core.hash.call(null, k), k, not_found)
    }
  }
};
cljs.core.TransientHashMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__16470 = this;
  if(this__16470.edit) {
    return this__16470.count
  }else {
    throw new Error("count after persistent!");
  }
};
cljs.core.TransientHashMap.prototype.conj_BANG_ = function(o) {
  var this__16471 = this;
  var tcoll__16472 = this;
  if(this__16471.edit) {
    if(function() {
      var G__16473__16474 = o;
      if(G__16473__16474) {
        if(function() {
          var or__3824__auto____16475 = G__16473__16474.cljs$lang$protocol_mask$partition0$ & 2048;
          if(or__3824__auto____16475) {
            return or__3824__auto____16475
          }else {
            return G__16473__16474.cljs$core$IMapEntry$
          }
        }()) {
          return true
        }else {
          if(!G__16473__16474.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.IMapEntry, G__16473__16474)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.IMapEntry, G__16473__16474)
      }
    }()) {
      return tcoll__16472.assoc_BANG_(cljs.core.key.call(null, o), cljs.core.val.call(null, o))
    }else {
      var es__16476 = cljs.core.seq.call(null, o);
      var tcoll__16477 = tcoll__16472;
      while(true) {
        var temp__3971__auto____16478 = cljs.core.first.call(null, es__16476);
        if(cljs.core.truth_(temp__3971__auto____16478)) {
          var e__16479 = temp__3971__auto____16478;
          var G__16490 = cljs.core.next.call(null, es__16476);
          var G__16491 = tcoll__16477.assoc_BANG_(cljs.core.key.call(null, e__16479), cljs.core.val.call(null, e__16479));
          es__16476 = G__16490;
          tcoll__16477 = G__16491;
          continue
        }else {
          return tcoll__16477
        }
        break
      }
    }
  }else {
    throw new Error("conj! after persistent");
  }
};
cljs.core.TransientHashMap.prototype.assoc_BANG_ = function(k, v) {
  var this__16480 = this;
  var tcoll__16481 = this;
  if(this__16480.edit) {
    if(k == null) {
      if(this__16480.nil_val === v) {
      }else {
        this__16480.nil_val = v
      }
      if(this__16480.has_nil_QMARK_) {
      }else {
        this__16480.count = this__16480.count + 1;
        this__16480.has_nil_QMARK_ = true
      }
      return tcoll__16481
    }else {
      var added_leaf_QMARK___16482 = new cljs.core.Box(false);
      var node__16483 = (this__16480.root == null ? cljs.core.BitmapIndexedNode.EMPTY : this__16480.root).inode_assoc_BANG_(this__16480.edit, 0, cljs.core.hash.call(null, k), k, v, added_leaf_QMARK___16482);
      if(node__16483 === this__16480.root) {
      }else {
        this__16480.root = node__16483
      }
      if(added_leaf_QMARK___16482.val) {
        this__16480.count = this__16480.count + 1
      }else {
      }
      return tcoll__16481
    }
  }else {
    throw new Error("assoc! after persistent!");
  }
};
cljs.core.TransientHashMap.prototype.without_BANG_ = function(k) {
  var this__16484 = this;
  var tcoll__16485 = this;
  if(this__16484.edit) {
    if(k == null) {
      if(this__16484.has_nil_QMARK_) {
        this__16484.has_nil_QMARK_ = false;
        this__16484.nil_val = null;
        this__16484.count = this__16484.count - 1;
        return tcoll__16485
      }else {
        return tcoll__16485
      }
    }else {
      if(this__16484.root == null) {
        return tcoll__16485
      }else {
        var removed_leaf_QMARK___16486 = new cljs.core.Box(false);
        var node__16487 = this__16484.root.inode_without_BANG_(this__16484.edit, 0, cljs.core.hash.call(null, k), k, removed_leaf_QMARK___16486);
        if(node__16487 === this__16484.root) {
        }else {
          this__16484.root = node__16487
        }
        if(cljs.core.truth_(removed_leaf_QMARK___16486[0])) {
          this__16484.count = this__16484.count - 1
        }else {
        }
        return tcoll__16485
      }
    }
  }else {
    throw new Error("dissoc! after persistent!");
  }
};
cljs.core.TransientHashMap.prototype.persistent_BANG_ = function() {
  var this__16488 = this;
  var tcoll__16489 = this;
  if(this__16488.edit) {
    this__16488.edit = null;
    return new cljs.core.PersistentHashMap(null, this__16488.count, this__16488.root, this__16488.has_nil_QMARK_, this__16488.nil_val, null)
  }else {
    throw new Error("persistent! called twice");
  }
};
cljs.core.TransientHashMap;
cljs.core.tree_map_seq_push = function tree_map_seq_push(node, stack, ascending_QMARK_) {
  var t__16494 = node;
  var stack__16495 = stack;
  while(true) {
    if(!(t__16494 == null)) {
      var G__16496 = ascending_QMARK_ ? t__16494.left : t__16494.right;
      var G__16497 = cljs.core.conj.call(null, stack__16495, t__16494);
      t__16494 = G__16496;
      stack__16495 = G__16497;
      continue
    }else {
      return stack__16495
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
  var this__16498 = this;
  var h__2192__auto____16499 = this__16498.__hash;
  if(!(h__2192__auto____16499 == null)) {
    return h__2192__auto____16499
  }else {
    var h__2192__auto____16500 = cljs.core.hash_coll.call(null, coll);
    this__16498.__hash = h__2192__auto____16500;
    return h__2192__auto____16500
  }
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__16501 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.PersistentTreeMapSeq.prototype.toString = function() {
  var this__16502 = this;
  var this__16503 = this;
  return cljs.core.pr_str.call(null, this__16503)
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(this$) {
  var this__16504 = this;
  return this$
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__16505 = this;
  if(this__16505.cnt < 0) {
    return cljs.core.count.call(null, cljs.core.next.call(null, coll)) + 1
  }else {
    return this__16505.cnt
  }
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(this$) {
  var this__16506 = this;
  return cljs.core.peek.call(null, this__16506.stack)
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(this$) {
  var this__16507 = this;
  var t__16508 = cljs.core.first.call(null, this__16507.stack);
  var next_stack__16509 = cljs.core.tree_map_seq_push.call(null, this__16507.ascending_QMARK_ ? t__16508.right : t__16508.left, cljs.core.next.call(null, this__16507.stack), this__16507.ascending_QMARK_);
  if(!(next_stack__16509 == null)) {
    return new cljs.core.PersistentTreeMapSeq(null, next_stack__16509, this__16507.ascending_QMARK_, this__16507.cnt - 1, null)
  }else {
    return cljs.core.List.EMPTY
  }
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__16510 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__16511 = this;
  return new cljs.core.PersistentTreeMapSeq(meta, this__16511.stack, this__16511.ascending_QMARK_, this__16511.cnt, this__16511.__hash)
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__16512 = this;
  return this__16512.meta
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
        var and__3822__auto____16514 = cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, right);
        if(and__3822__auto____16514) {
          return cljs.core.instance_QMARK_.call(null, cljs.core.BlackNode, right.left)
        }else {
          return and__3822__auto____16514
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
        var and__3822__auto____16516 = cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, left);
        if(and__3822__auto____16516) {
          return cljs.core.instance_QMARK_.call(null, cljs.core.BlackNode, left.right)
        }else {
          return and__3822__auto____16516
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
  var init__16520 = f.call(null, init, node.key, node.val);
  if(cljs.core.reduced_QMARK_.call(null, init__16520)) {
    return cljs.core.deref.call(null, init__16520)
  }else {
    var init__16521 = !(node.left == null) ? tree_map_kv_reduce.call(null, node.left, f, init__16520) : init__16520;
    if(cljs.core.reduced_QMARK_.call(null, init__16521)) {
      return cljs.core.deref.call(null, init__16521)
    }else {
      var init__16522 = !(node.right == null) ? tree_map_kv_reduce.call(null, node.right, f, init__16521) : init__16521;
      if(cljs.core.reduced_QMARK_.call(null, init__16522)) {
        return cljs.core.deref.call(null, init__16522)
      }else {
        return init__16522
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
  var this__16525 = this;
  var h__2192__auto____16526 = this__16525.__hash;
  if(!(h__2192__auto____16526 == null)) {
    return h__2192__auto____16526
  }else {
    var h__2192__auto____16527 = cljs.core.hash_coll.call(null, coll);
    this__16525.__hash = h__2192__auto____16527;
    return h__2192__auto____16527
  }
};
cljs.core.BlackNode.prototype.cljs$core$ILookup$_lookup$arity$2 = function(node, k) {
  var this__16528 = this;
  return node.cljs$core$IIndexed$_nth$arity$3(node, k, null)
};
cljs.core.BlackNode.prototype.cljs$core$ILookup$_lookup$arity$3 = function(node, k, not_found) {
  var this__16529 = this;
  return node.cljs$core$IIndexed$_nth$arity$3(node, k, not_found)
};
cljs.core.BlackNode.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(node, k, v) {
  var this__16530 = this;
  return cljs.core.assoc.call(null, cljs.core.PersistentVector.fromArray([this__16530.key, this__16530.val], true), k, v)
};
cljs.core.BlackNode.prototype.call = function() {
  var G__16578 = null;
  var G__16578__2 = function(this_sym16531, k) {
    var this__16533 = this;
    var this_sym16531__16534 = this;
    var node__16535 = this_sym16531__16534;
    return node__16535.cljs$core$ILookup$_lookup$arity$2(node__16535, k)
  };
  var G__16578__3 = function(this_sym16532, k, not_found) {
    var this__16533 = this;
    var this_sym16532__16536 = this;
    var node__16537 = this_sym16532__16536;
    return node__16537.cljs$core$ILookup$_lookup$arity$3(node__16537, k, not_found)
  };
  G__16578 = function(this_sym16532, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__16578__2.call(this, this_sym16532, k);
      case 3:
        return G__16578__3.call(this, this_sym16532, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__16578
}();
cljs.core.BlackNode.prototype.apply = function(this_sym16523, args16524) {
  var this__16538 = this;
  return this_sym16523.call.apply(this_sym16523, [this_sym16523].concat(args16524.slice()))
};
cljs.core.BlackNode.prototype.cljs$core$ICollection$_conj$arity$2 = function(node, o) {
  var this__16539 = this;
  return cljs.core.PersistentVector.fromArray([this__16539.key, this__16539.val, o], true)
};
cljs.core.BlackNode.prototype.cljs$core$IMapEntry$_key$arity$1 = function(node) {
  var this__16540 = this;
  return this__16540.key
};
cljs.core.BlackNode.prototype.cljs$core$IMapEntry$_val$arity$1 = function(node) {
  var this__16541 = this;
  return this__16541.val
};
cljs.core.BlackNode.prototype.add_right = function(ins) {
  var this__16542 = this;
  var node__16543 = this;
  return ins.balance_right(node__16543)
};
cljs.core.BlackNode.prototype.redden = function() {
  var this__16544 = this;
  var node__16545 = this;
  return new cljs.core.RedNode(this__16544.key, this__16544.val, this__16544.left, this__16544.right, null)
};
cljs.core.BlackNode.prototype.remove_right = function(del) {
  var this__16546 = this;
  var node__16547 = this;
  return cljs.core.balance_right_del.call(null, this__16546.key, this__16546.val, this__16546.left, del)
};
cljs.core.BlackNode.prototype.replace = function(key, val, left, right) {
  var this__16548 = this;
  var node__16549 = this;
  return new cljs.core.BlackNode(key, val, left, right, null)
};
cljs.core.BlackNode.prototype.kv_reduce = function(f, init) {
  var this__16550 = this;
  var node__16551 = this;
  return cljs.core.tree_map_kv_reduce.call(null, node__16551, f, init)
};
cljs.core.BlackNode.prototype.remove_left = function(del) {
  var this__16552 = this;
  var node__16553 = this;
  return cljs.core.balance_left_del.call(null, this__16552.key, this__16552.val, del, this__16552.right)
};
cljs.core.BlackNode.prototype.add_left = function(ins) {
  var this__16554 = this;
  var node__16555 = this;
  return ins.balance_left(node__16555)
};
cljs.core.BlackNode.prototype.balance_left = function(parent) {
  var this__16556 = this;
  var node__16557 = this;
  return new cljs.core.BlackNode(parent.key, parent.val, node__16557, parent.right, null)
};
cljs.core.BlackNode.prototype.toString = function() {
  var G__16579 = null;
  var G__16579__0 = function() {
    var this__16558 = this;
    var this__16560 = this;
    return cljs.core.pr_str.call(null, this__16560)
  };
  G__16579 = function() {
    switch(arguments.length) {
      case 0:
        return G__16579__0.call(this)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__16579
}();
cljs.core.BlackNode.prototype.balance_right = function(parent) {
  var this__16561 = this;
  var node__16562 = this;
  return new cljs.core.BlackNode(parent.key, parent.val, parent.left, node__16562, null)
};
cljs.core.BlackNode.prototype.blacken = function() {
  var this__16563 = this;
  var node__16564 = this;
  return node__16564
};
cljs.core.BlackNode.prototype.cljs$core$IReduce$_reduce$arity$2 = function(node, f) {
  var this__16565 = this;
  return cljs.core.ci_reduce.call(null, node, f)
};
cljs.core.BlackNode.prototype.cljs$core$IReduce$_reduce$arity$3 = function(node, f, start) {
  var this__16566 = this;
  return cljs.core.ci_reduce.call(null, node, f, start)
};
cljs.core.BlackNode.prototype.cljs$core$ISeqable$_seq$arity$1 = function(node) {
  var this__16567 = this;
  return cljs.core.list.call(null, this__16567.key, this__16567.val)
};
cljs.core.BlackNode.prototype.cljs$core$ICounted$_count$arity$1 = function(node) {
  var this__16568 = this;
  return 2
};
cljs.core.BlackNode.prototype.cljs$core$IStack$_peek$arity$1 = function(node) {
  var this__16569 = this;
  return this__16569.val
};
cljs.core.BlackNode.prototype.cljs$core$IStack$_pop$arity$1 = function(node) {
  var this__16570 = this;
  return cljs.core.PersistentVector.fromArray([this__16570.key], true)
};
cljs.core.BlackNode.prototype.cljs$core$IVector$_assoc_n$arity$3 = function(node, n, v) {
  var this__16571 = this;
  return cljs.core._assoc_n.call(null, cljs.core.PersistentVector.fromArray([this__16571.key, this__16571.val], true), n, v)
};
cljs.core.BlackNode.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__16572 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.BlackNode.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(node, meta) {
  var this__16573 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentVector.fromArray([this__16573.key, this__16573.val], true), meta)
};
cljs.core.BlackNode.prototype.cljs$core$IMeta$_meta$arity$1 = function(node) {
  var this__16574 = this;
  return null
};
cljs.core.BlackNode.prototype.cljs$core$IIndexed$_nth$arity$2 = function(node, n) {
  var this__16575 = this;
  if(n === 0) {
    return this__16575.key
  }else {
    if(n === 1) {
      return this__16575.val
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
  var this__16576 = this;
  if(n === 0) {
    return this__16576.key
  }else {
    if(n === 1) {
      return this__16576.val
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
  var this__16577 = this;
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
  var this__16582 = this;
  var h__2192__auto____16583 = this__16582.__hash;
  if(!(h__2192__auto____16583 == null)) {
    return h__2192__auto____16583
  }else {
    var h__2192__auto____16584 = cljs.core.hash_coll.call(null, coll);
    this__16582.__hash = h__2192__auto____16584;
    return h__2192__auto____16584
  }
};
cljs.core.RedNode.prototype.cljs$core$ILookup$_lookup$arity$2 = function(node, k) {
  var this__16585 = this;
  return node.cljs$core$IIndexed$_nth$arity$3(node, k, null)
};
cljs.core.RedNode.prototype.cljs$core$ILookup$_lookup$arity$3 = function(node, k, not_found) {
  var this__16586 = this;
  return node.cljs$core$IIndexed$_nth$arity$3(node, k, not_found)
};
cljs.core.RedNode.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(node, k, v) {
  var this__16587 = this;
  return cljs.core.assoc.call(null, cljs.core.PersistentVector.fromArray([this__16587.key, this__16587.val], true), k, v)
};
cljs.core.RedNode.prototype.call = function() {
  var G__16635 = null;
  var G__16635__2 = function(this_sym16588, k) {
    var this__16590 = this;
    var this_sym16588__16591 = this;
    var node__16592 = this_sym16588__16591;
    return node__16592.cljs$core$ILookup$_lookup$arity$2(node__16592, k)
  };
  var G__16635__3 = function(this_sym16589, k, not_found) {
    var this__16590 = this;
    var this_sym16589__16593 = this;
    var node__16594 = this_sym16589__16593;
    return node__16594.cljs$core$ILookup$_lookup$arity$3(node__16594, k, not_found)
  };
  G__16635 = function(this_sym16589, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__16635__2.call(this, this_sym16589, k);
      case 3:
        return G__16635__3.call(this, this_sym16589, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__16635
}();
cljs.core.RedNode.prototype.apply = function(this_sym16580, args16581) {
  var this__16595 = this;
  return this_sym16580.call.apply(this_sym16580, [this_sym16580].concat(args16581.slice()))
};
cljs.core.RedNode.prototype.cljs$core$ICollection$_conj$arity$2 = function(node, o) {
  var this__16596 = this;
  return cljs.core.PersistentVector.fromArray([this__16596.key, this__16596.val, o], true)
};
cljs.core.RedNode.prototype.cljs$core$IMapEntry$_key$arity$1 = function(node) {
  var this__16597 = this;
  return this__16597.key
};
cljs.core.RedNode.prototype.cljs$core$IMapEntry$_val$arity$1 = function(node) {
  var this__16598 = this;
  return this__16598.val
};
cljs.core.RedNode.prototype.add_right = function(ins) {
  var this__16599 = this;
  var node__16600 = this;
  return new cljs.core.RedNode(this__16599.key, this__16599.val, this__16599.left, ins, null)
};
cljs.core.RedNode.prototype.redden = function() {
  var this__16601 = this;
  var node__16602 = this;
  throw new Error("red-black tree invariant violation");
};
cljs.core.RedNode.prototype.remove_right = function(del) {
  var this__16603 = this;
  var node__16604 = this;
  return new cljs.core.RedNode(this__16603.key, this__16603.val, this__16603.left, del, null)
};
cljs.core.RedNode.prototype.replace = function(key, val, left, right) {
  var this__16605 = this;
  var node__16606 = this;
  return new cljs.core.RedNode(key, val, left, right, null)
};
cljs.core.RedNode.prototype.kv_reduce = function(f, init) {
  var this__16607 = this;
  var node__16608 = this;
  return cljs.core.tree_map_kv_reduce.call(null, node__16608, f, init)
};
cljs.core.RedNode.prototype.remove_left = function(del) {
  var this__16609 = this;
  var node__16610 = this;
  return new cljs.core.RedNode(this__16609.key, this__16609.val, del, this__16609.right, null)
};
cljs.core.RedNode.prototype.add_left = function(ins) {
  var this__16611 = this;
  var node__16612 = this;
  return new cljs.core.RedNode(this__16611.key, this__16611.val, ins, this__16611.right, null)
};
cljs.core.RedNode.prototype.balance_left = function(parent) {
  var this__16613 = this;
  var node__16614 = this;
  if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, this__16613.left)) {
    return new cljs.core.RedNode(this__16613.key, this__16613.val, this__16613.left.blacken(), new cljs.core.BlackNode(parent.key, parent.val, this__16613.right, parent.right, null), null)
  }else {
    if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, this__16613.right)) {
      return new cljs.core.RedNode(this__16613.right.key, this__16613.right.val, new cljs.core.BlackNode(this__16613.key, this__16613.val, this__16613.left, this__16613.right.left, null), new cljs.core.BlackNode(parent.key, parent.val, this__16613.right.right, parent.right, null), null)
    }else {
      if("\ufdd0'else") {
        return new cljs.core.BlackNode(parent.key, parent.val, node__16614, parent.right, null)
      }else {
        return null
      }
    }
  }
};
cljs.core.RedNode.prototype.toString = function() {
  var G__16636 = null;
  var G__16636__0 = function() {
    var this__16615 = this;
    var this__16617 = this;
    return cljs.core.pr_str.call(null, this__16617)
  };
  G__16636 = function() {
    switch(arguments.length) {
      case 0:
        return G__16636__0.call(this)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__16636
}();
cljs.core.RedNode.prototype.balance_right = function(parent) {
  var this__16618 = this;
  var node__16619 = this;
  if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, this__16618.right)) {
    return new cljs.core.RedNode(this__16618.key, this__16618.val, new cljs.core.BlackNode(parent.key, parent.val, parent.left, this__16618.left, null), this__16618.right.blacken(), null)
  }else {
    if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, this__16618.left)) {
      return new cljs.core.RedNode(this__16618.left.key, this__16618.left.val, new cljs.core.BlackNode(parent.key, parent.val, parent.left, this__16618.left.left, null), new cljs.core.BlackNode(this__16618.key, this__16618.val, this__16618.left.right, this__16618.right, null), null)
    }else {
      if("\ufdd0'else") {
        return new cljs.core.BlackNode(parent.key, parent.val, parent.left, node__16619, null)
      }else {
        return null
      }
    }
  }
};
cljs.core.RedNode.prototype.blacken = function() {
  var this__16620 = this;
  var node__16621 = this;
  return new cljs.core.BlackNode(this__16620.key, this__16620.val, this__16620.left, this__16620.right, null)
};
cljs.core.RedNode.prototype.cljs$core$IReduce$_reduce$arity$2 = function(node, f) {
  var this__16622 = this;
  return cljs.core.ci_reduce.call(null, node, f)
};
cljs.core.RedNode.prototype.cljs$core$IReduce$_reduce$arity$3 = function(node, f, start) {
  var this__16623 = this;
  return cljs.core.ci_reduce.call(null, node, f, start)
};
cljs.core.RedNode.prototype.cljs$core$ISeqable$_seq$arity$1 = function(node) {
  var this__16624 = this;
  return cljs.core.list.call(null, this__16624.key, this__16624.val)
};
cljs.core.RedNode.prototype.cljs$core$ICounted$_count$arity$1 = function(node) {
  var this__16625 = this;
  return 2
};
cljs.core.RedNode.prototype.cljs$core$IStack$_peek$arity$1 = function(node) {
  var this__16626 = this;
  return this__16626.val
};
cljs.core.RedNode.prototype.cljs$core$IStack$_pop$arity$1 = function(node) {
  var this__16627 = this;
  return cljs.core.PersistentVector.fromArray([this__16627.key], true)
};
cljs.core.RedNode.prototype.cljs$core$IVector$_assoc_n$arity$3 = function(node, n, v) {
  var this__16628 = this;
  return cljs.core._assoc_n.call(null, cljs.core.PersistentVector.fromArray([this__16628.key, this__16628.val], true), n, v)
};
cljs.core.RedNode.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__16629 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.RedNode.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(node, meta) {
  var this__16630 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentVector.fromArray([this__16630.key, this__16630.val], true), meta)
};
cljs.core.RedNode.prototype.cljs$core$IMeta$_meta$arity$1 = function(node) {
  var this__16631 = this;
  return null
};
cljs.core.RedNode.prototype.cljs$core$IIndexed$_nth$arity$2 = function(node, n) {
  var this__16632 = this;
  if(n === 0) {
    return this__16632.key
  }else {
    if(n === 1) {
      return this__16632.val
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
  var this__16633 = this;
  if(n === 0) {
    return this__16633.key
  }else {
    if(n === 1) {
      return this__16633.val
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
  var this__16634 = this;
  return cljs.core.PersistentVector.EMPTY
};
cljs.core.RedNode;
cljs.core.tree_map_add = function tree_map_add(comp, tree, k, v, found) {
  if(tree == null) {
    return new cljs.core.RedNode(k, v, null, null, null)
  }else {
    var c__16640 = comp.call(null, k, tree.key);
    if(c__16640 === 0) {
      found[0] = tree;
      return null
    }else {
      if(c__16640 < 0) {
        var ins__16641 = tree_map_add.call(null, comp, tree.left, k, v, found);
        if(!(ins__16641 == null)) {
          return tree.add_left(ins__16641)
        }else {
          return null
        }
      }else {
        if("\ufdd0'else") {
          var ins__16642 = tree_map_add.call(null, comp, tree.right, k, v, found);
          if(!(ins__16642 == null)) {
            return tree.add_right(ins__16642)
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
          var app__16645 = tree_map_append.call(null, left.right, right.left);
          if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, app__16645)) {
            return new cljs.core.RedNode(app__16645.key, app__16645.val, new cljs.core.RedNode(left.key, left.val, left.left, app__16645.left, null), new cljs.core.RedNode(right.key, right.val, app__16645.right, right.right, null), null)
          }else {
            return new cljs.core.RedNode(left.key, left.val, left.left, new cljs.core.RedNode(right.key, right.val, app__16645, right.right, null), null)
          }
        }else {
          return new cljs.core.RedNode(left.key, left.val, left.left, tree_map_append.call(null, left.right, right), null)
        }
      }else {
        if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, right)) {
          return new cljs.core.RedNode(right.key, right.val, tree_map_append.call(null, left, right.left), right.right, null)
        }else {
          if("\ufdd0'else") {
            var app__16646 = tree_map_append.call(null, left.right, right.left);
            if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, app__16646)) {
              return new cljs.core.RedNode(app__16646.key, app__16646.val, new cljs.core.BlackNode(left.key, left.val, left.left, app__16646.left, null), new cljs.core.BlackNode(right.key, right.val, app__16646.right, right.right, null), null)
            }else {
              return cljs.core.balance_left_del.call(null, left.key, left.val, left.left, new cljs.core.BlackNode(right.key, right.val, app__16646, right.right, null))
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
    var c__16652 = comp.call(null, k, tree.key);
    if(c__16652 === 0) {
      found[0] = tree;
      return cljs.core.tree_map_append.call(null, tree.left, tree.right)
    }else {
      if(c__16652 < 0) {
        var del__16653 = tree_map_remove.call(null, comp, tree.left, k, found);
        if(function() {
          var or__3824__auto____16654 = !(del__16653 == null);
          if(or__3824__auto____16654) {
            return or__3824__auto____16654
          }else {
            return!(found[0] == null)
          }
        }()) {
          if(cljs.core.instance_QMARK_.call(null, cljs.core.BlackNode, tree.left)) {
            return cljs.core.balance_left_del.call(null, tree.key, tree.val, del__16653, tree.right)
          }else {
            return new cljs.core.RedNode(tree.key, tree.val, del__16653, tree.right, null)
          }
        }else {
          return null
        }
      }else {
        if("\ufdd0'else") {
          var del__16655 = tree_map_remove.call(null, comp, tree.right, k, found);
          if(function() {
            var or__3824__auto____16656 = !(del__16655 == null);
            if(or__3824__auto____16656) {
              return or__3824__auto____16656
            }else {
              return!(found[0] == null)
            }
          }()) {
            if(cljs.core.instance_QMARK_.call(null, cljs.core.BlackNode, tree.right)) {
              return cljs.core.balance_right_del.call(null, tree.key, tree.val, tree.left, del__16655)
            }else {
              return new cljs.core.RedNode(tree.key, tree.val, tree.left, del__16655, null)
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
  var tk__16659 = tree.key;
  var c__16660 = comp.call(null, k, tk__16659);
  if(c__16660 === 0) {
    return tree.replace(tk__16659, v, tree.left, tree.right)
  }else {
    if(c__16660 < 0) {
      return tree.replace(tk__16659, tree.val, tree_map_replace.call(null, comp, tree.left, k, v), tree.right)
    }else {
      if("\ufdd0'else") {
        return tree.replace(tk__16659, tree.val, tree.left, tree_map_replace.call(null, comp, tree.right, k, v))
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
  var this__16663 = this;
  var h__2192__auto____16664 = this__16663.__hash;
  if(!(h__2192__auto____16664 == null)) {
    return h__2192__auto____16664
  }else {
    var h__2192__auto____16665 = cljs.core.hash_imap.call(null, coll);
    this__16663.__hash = h__2192__auto____16665;
    return h__2192__auto____16665
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__16666 = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(coll, k, null)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__16667 = this;
  var n__16668 = coll.entry_at(k);
  if(!(n__16668 == null)) {
    return n__16668.val
  }else {
    return not_found
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__16669 = this;
  var found__16670 = [null];
  var t__16671 = cljs.core.tree_map_add.call(null, this__16669.comp, this__16669.tree, k, v, found__16670);
  if(t__16671 == null) {
    var found_node__16672 = cljs.core.nth.call(null, found__16670, 0);
    if(cljs.core._EQ_.call(null, v, found_node__16672.val)) {
      return coll
    }else {
      return new cljs.core.PersistentTreeMap(this__16669.comp, cljs.core.tree_map_replace.call(null, this__16669.comp, this__16669.tree, k, v), this__16669.cnt, this__16669.meta, null)
    }
  }else {
    return new cljs.core.PersistentTreeMap(this__16669.comp, t__16671.blacken(), this__16669.cnt + 1, this__16669.meta, null)
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = function(coll, k) {
  var this__16673 = this;
  return!(coll.entry_at(k) == null)
};
cljs.core.PersistentTreeMap.prototype.call = function() {
  var G__16707 = null;
  var G__16707__2 = function(this_sym16674, k) {
    var this__16676 = this;
    var this_sym16674__16677 = this;
    var coll__16678 = this_sym16674__16677;
    return coll__16678.cljs$core$ILookup$_lookup$arity$2(coll__16678, k)
  };
  var G__16707__3 = function(this_sym16675, k, not_found) {
    var this__16676 = this;
    var this_sym16675__16679 = this;
    var coll__16680 = this_sym16675__16679;
    return coll__16680.cljs$core$ILookup$_lookup$arity$3(coll__16680, k, not_found)
  };
  G__16707 = function(this_sym16675, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__16707__2.call(this, this_sym16675, k);
      case 3:
        return G__16707__3.call(this, this_sym16675, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__16707
}();
cljs.core.PersistentTreeMap.prototype.apply = function(this_sym16661, args16662) {
  var this__16681 = this;
  return this_sym16661.call.apply(this_sym16661, [this_sym16661].concat(args16662.slice()))
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IKVReduce$_kv_reduce$arity$3 = function(coll, f, init) {
  var this__16682 = this;
  if(!(this__16682.tree == null)) {
    return cljs.core.tree_map_kv_reduce.call(null, this__16682.tree, f, init)
  }else {
    return init
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, entry) {
  var this__16683 = this;
  if(cljs.core.vector_QMARK_.call(null, entry)) {
    return coll.cljs$core$IAssociative$_assoc$arity$3(coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IReversible$_rseq$arity$1 = function(coll) {
  var this__16684 = this;
  if(this__16684.cnt > 0) {
    return cljs.core.create_tree_map_seq.call(null, this__16684.tree, false, this__16684.cnt)
  }else {
    return null
  }
};
cljs.core.PersistentTreeMap.prototype.toString = function() {
  var this__16685 = this;
  var this__16686 = this;
  return cljs.core.pr_str.call(null, this__16686)
};
cljs.core.PersistentTreeMap.prototype.entry_at = function(k) {
  var this__16687 = this;
  var coll__16688 = this;
  var t__16689 = this__16687.tree;
  while(true) {
    if(!(t__16689 == null)) {
      var c__16690 = this__16687.comp.call(null, k, t__16689.key);
      if(c__16690 === 0) {
        return t__16689
      }else {
        if(c__16690 < 0) {
          var G__16708 = t__16689.left;
          t__16689 = G__16708;
          continue
        }else {
          if("\ufdd0'else") {
            var G__16709 = t__16689.right;
            t__16689 = G__16709;
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
  var this__16691 = this;
  if(this__16691.cnt > 0) {
    return cljs.core.create_tree_map_seq.call(null, this__16691.tree, ascending_QMARK_, this__16691.cnt)
  }else {
    return null
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ISorted$_sorted_seq_from$arity$3 = function(coll, k, ascending_QMARK_) {
  var this__16692 = this;
  if(this__16692.cnt > 0) {
    var stack__16693 = null;
    var t__16694 = this__16692.tree;
    while(true) {
      if(!(t__16694 == null)) {
        var c__16695 = this__16692.comp.call(null, k, t__16694.key);
        if(c__16695 === 0) {
          return new cljs.core.PersistentTreeMapSeq(null, cljs.core.conj.call(null, stack__16693, t__16694), ascending_QMARK_, -1, null)
        }else {
          if(cljs.core.truth_(ascending_QMARK_)) {
            if(c__16695 < 0) {
              var G__16710 = cljs.core.conj.call(null, stack__16693, t__16694);
              var G__16711 = t__16694.left;
              stack__16693 = G__16710;
              t__16694 = G__16711;
              continue
            }else {
              var G__16712 = stack__16693;
              var G__16713 = t__16694.right;
              stack__16693 = G__16712;
              t__16694 = G__16713;
              continue
            }
          }else {
            if("\ufdd0'else") {
              if(c__16695 > 0) {
                var G__16714 = cljs.core.conj.call(null, stack__16693, t__16694);
                var G__16715 = t__16694.right;
                stack__16693 = G__16714;
                t__16694 = G__16715;
                continue
              }else {
                var G__16716 = stack__16693;
                var G__16717 = t__16694.left;
                stack__16693 = G__16716;
                t__16694 = G__16717;
                continue
              }
            }else {
              return null
            }
          }
        }
      }else {
        if(stack__16693 == null) {
          return new cljs.core.PersistentTreeMapSeq(null, stack__16693, ascending_QMARK_, -1, null)
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
  var this__16696 = this;
  return cljs.core.key.call(null, entry)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ISorted$_comparator$arity$1 = function(coll) {
  var this__16697 = this;
  return this__16697.comp
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__16698 = this;
  if(this__16698.cnt > 0) {
    return cljs.core.create_tree_map_seq.call(null, this__16698.tree, true, this__16698.cnt)
  }else {
    return null
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__16699 = this;
  return this__16699.cnt
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__16700 = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__16701 = this;
  return new cljs.core.PersistentTreeMap(this__16701.comp, this__16701.tree, this__16701.cnt, meta, this__16701.__hash)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__16702 = this;
  return this__16702.meta
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__16703 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentTreeMap.EMPTY, this__16703.meta)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IMap$_dissoc$arity$2 = function(coll, k) {
  var this__16704 = this;
  var found__16705 = [null];
  var t__16706 = cljs.core.tree_map_remove.call(null, this__16704.comp, this__16704.tree, k, found__16705);
  if(t__16706 == null) {
    if(cljs.core.nth.call(null, found__16705, 0) == null) {
      return coll
    }else {
      return new cljs.core.PersistentTreeMap(this__16704.comp, null, 0, this__16704.meta, null)
    }
  }else {
    return new cljs.core.PersistentTreeMap(this__16704.comp, t__16706.blacken(), this__16704.cnt - 1, this__16704.meta, null)
  }
};
cljs.core.PersistentTreeMap;
cljs.core.PersistentTreeMap.EMPTY = new cljs.core.PersistentTreeMap(cljs.core.compare, null, 0, null, 0);
cljs.core.hash_map = function() {
  var hash_map__delegate = function(keyvals) {
    var in__16720 = cljs.core.seq.call(null, keyvals);
    var out__16721 = cljs.core.transient$.call(null, cljs.core.PersistentHashMap.EMPTY);
    while(true) {
      if(in__16720) {
        var G__16722 = cljs.core.nnext.call(null, in__16720);
        var G__16723 = cljs.core.assoc_BANG_.call(null, out__16721, cljs.core.first.call(null, in__16720), cljs.core.second.call(null, in__16720));
        in__16720 = G__16722;
        out__16721 = G__16723;
        continue
      }else {
        return cljs.core.persistent_BANG_.call(null, out__16721)
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
  hash_map.cljs$lang$applyTo = function(arglist__16724) {
    var keyvals = cljs.core.seq(arglist__16724);
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
  array_map.cljs$lang$applyTo = function(arglist__16725) {
    var keyvals = cljs.core.seq(arglist__16725);
    return array_map__delegate(keyvals)
  };
  array_map.cljs$lang$arity$variadic = array_map__delegate;
  return array_map
}();
cljs.core.obj_map = function() {
  var obj_map__delegate = function(keyvals) {
    var ks__16729 = [];
    var obj__16730 = {};
    var kvs__16731 = cljs.core.seq.call(null, keyvals);
    while(true) {
      if(kvs__16731) {
        ks__16729.push(cljs.core.first.call(null, kvs__16731));
        obj__16730[cljs.core.first.call(null, kvs__16731)] = cljs.core.second.call(null, kvs__16731);
        var G__16732 = cljs.core.nnext.call(null, kvs__16731);
        kvs__16731 = G__16732;
        continue
      }else {
        return cljs.core.ObjMap.fromObject.call(null, ks__16729, obj__16730)
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
  obj_map.cljs$lang$applyTo = function(arglist__16733) {
    var keyvals = cljs.core.seq(arglist__16733);
    return obj_map__delegate(keyvals)
  };
  obj_map.cljs$lang$arity$variadic = obj_map__delegate;
  return obj_map
}();
cljs.core.sorted_map = function() {
  var sorted_map__delegate = function(keyvals) {
    var in__16736 = cljs.core.seq.call(null, keyvals);
    var out__16737 = cljs.core.PersistentTreeMap.EMPTY;
    while(true) {
      if(in__16736) {
        var G__16738 = cljs.core.nnext.call(null, in__16736);
        var G__16739 = cljs.core.assoc.call(null, out__16737, cljs.core.first.call(null, in__16736), cljs.core.second.call(null, in__16736));
        in__16736 = G__16738;
        out__16737 = G__16739;
        continue
      }else {
        return out__16737
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
  sorted_map.cljs$lang$applyTo = function(arglist__16740) {
    var keyvals = cljs.core.seq(arglist__16740);
    return sorted_map__delegate(keyvals)
  };
  sorted_map.cljs$lang$arity$variadic = sorted_map__delegate;
  return sorted_map
}();
cljs.core.sorted_map_by = function() {
  var sorted_map_by__delegate = function(comparator, keyvals) {
    var in__16743 = cljs.core.seq.call(null, keyvals);
    var out__16744 = new cljs.core.PersistentTreeMap(comparator, null, 0, null, 0);
    while(true) {
      if(in__16743) {
        var G__16745 = cljs.core.nnext.call(null, in__16743);
        var G__16746 = cljs.core.assoc.call(null, out__16744, cljs.core.first.call(null, in__16743), cljs.core.second.call(null, in__16743));
        in__16743 = G__16745;
        out__16744 = G__16746;
        continue
      }else {
        return out__16744
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
  sorted_map_by.cljs$lang$applyTo = function(arglist__16747) {
    var comparator = cljs.core.first(arglist__16747);
    var keyvals = cljs.core.rest(arglist__16747);
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
      return cljs.core.reduce.call(null, function(p1__16748_SHARP_, p2__16749_SHARP_) {
        return cljs.core.conj.call(null, function() {
          var or__3824__auto____16751 = p1__16748_SHARP_;
          if(cljs.core.truth_(or__3824__auto____16751)) {
            return or__3824__auto____16751
          }else {
            return cljs.core.ObjMap.EMPTY
          }
        }(), p2__16749_SHARP_)
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
  merge.cljs$lang$applyTo = function(arglist__16752) {
    var maps = cljs.core.seq(arglist__16752);
    return merge__delegate(maps)
  };
  merge.cljs$lang$arity$variadic = merge__delegate;
  return merge
}();
cljs.core.merge_with = function() {
  var merge_with__delegate = function(f, maps) {
    if(cljs.core.truth_(cljs.core.some.call(null, cljs.core.identity, maps))) {
      var merge_entry__16760 = function(m, e) {
        var k__16758 = cljs.core.first.call(null, e);
        var v__16759 = cljs.core.second.call(null, e);
        if(cljs.core.contains_QMARK_.call(null, m, k__16758)) {
          return cljs.core.assoc.call(null, m, k__16758, f.call(null, cljs.core._lookup.call(null, m, k__16758, null), v__16759))
        }else {
          return cljs.core.assoc.call(null, m, k__16758, v__16759)
        }
      };
      var merge2__16762 = function(m1, m2) {
        return cljs.core.reduce.call(null, merge_entry__16760, function() {
          var or__3824__auto____16761 = m1;
          if(cljs.core.truth_(or__3824__auto____16761)) {
            return or__3824__auto____16761
          }else {
            return cljs.core.ObjMap.EMPTY
          }
        }(), cljs.core.seq.call(null, m2))
      };
      return cljs.core.reduce.call(null, merge2__16762, maps)
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
  merge_with.cljs$lang$applyTo = function(arglist__16763) {
    var f = cljs.core.first(arglist__16763);
    var maps = cljs.core.rest(arglist__16763);
    return merge_with__delegate(f, maps)
  };
  merge_with.cljs$lang$arity$variadic = merge_with__delegate;
  return merge_with
}();
cljs.core.select_keys = function select_keys(map, keyseq) {
  var ret__16768 = cljs.core.ObjMap.EMPTY;
  var keys__16769 = cljs.core.seq.call(null, keyseq);
  while(true) {
    if(keys__16769) {
      var key__16770 = cljs.core.first.call(null, keys__16769);
      var entry__16771 = cljs.core._lookup.call(null, map, key__16770, "\ufdd0'cljs.core/not-found");
      var G__16772 = cljs.core.not_EQ_.call(null, entry__16771, "\ufdd0'cljs.core/not-found") ? cljs.core.assoc.call(null, ret__16768, key__16770, entry__16771) : ret__16768;
      var G__16773 = cljs.core.next.call(null, keys__16769);
      ret__16768 = G__16772;
      keys__16769 = G__16773;
      continue
    }else {
      return ret__16768
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
  var this__16777 = this;
  return new cljs.core.TransientHashSet(cljs.core.transient$.call(null, this__16777.hash_map))
};
cljs.core.PersistentHashSet.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__16778 = this;
  var h__2192__auto____16779 = this__16778.__hash;
  if(!(h__2192__auto____16779 == null)) {
    return h__2192__auto____16779
  }else {
    var h__2192__auto____16780 = cljs.core.hash_iset.call(null, coll);
    this__16778.__hash = h__2192__auto____16780;
    return h__2192__auto____16780
  }
};
cljs.core.PersistentHashSet.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, v) {
  var this__16781 = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(coll, v, null)
};
cljs.core.PersistentHashSet.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, v, not_found) {
  var this__16782 = this;
  if(cljs.core.truth_(cljs.core._contains_key_QMARK_.call(null, this__16782.hash_map, v))) {
    return v
  }else {
    return not_found
  }
};
cljs.core.PersistentHashSet.prototype.call = function() {
  var G__16803 = null;
  var G__16803__2 = function(this_sym16783, k) {
    var this__16785 = this;
    var this_sym16783__16786 = this;
    var coll__16787 = this_sym16783__16786;
    return coll__16787.cljs$core$ILookup$_lookup$arity$2(coll__16787, k)
  };
  var G__16803__3 = function(this_sym16784, k, not_found) {
    var this__16785 = this;
    var this_sym16784__16788 = this;
    var coll__16789 = this_sym16784__16788;
    return coll__16789.cljs$core$ILookup$_lookup$arity$3(coll__16789, k, not_found)
  };
  G__16803 = function(this_sym16784, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__16803__2.call(this, this_sym16784, k);
      case 3:
        return G__16803__3.call(this, this_sym16784, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__16803
}();
cljs.core.PersistentHashSet.prototype.apply = function(this_sym16775, args16776) {
  var this__16790 = this;
  return this_sym16775.call.apply(this_sym16775, [this_sym16775].concat(args16776.slice()))
};
cljs.core.PersistentHashSet.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__16791 = this;
  return new cljs.core.PersistentHashSet(this__16791.meta, cljs.core.assoc.call(null, this__16791.hash_map, o, null), null)
};
cljs.core.PersistentHashSet.prototype.toString = function() {
  var this__16792 = this;
  var this__16793 = this;
  return cljs.core.pr_str.call(null, this__16793)
};
cljs.core.PersistentHashSet.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__16794 = this;
  return cljs.core.keys.call(null, this__16794.hash_map)
};
cljs.core.PersistentHashSet.prototype.cljs$core$ISet$_disjoin$arity$2 = function(coll, v) {
  var this__16795 = this;
  return new cljs.core.PersistentHashSet(this__16795.meta, cljs.core.dissoc.call(null, this__16795.hash_map, v), null)
};
cljs.core.PersistentHashSet.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__16796 = this;
  return cljs.core.count.call(null, cljs.core.seq.call(null, coll))
};
cljs.core.PersistentHashSet.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__16797 = this;
  var and__3822__auto____16798 = cljs.core.set_QMARK_.call(null, other);
  if(and__3822__auto____16798) {
    var and__3822__auto____16799 = cljs.core.count.call(null, coll) === cljs.core.count.call(null, other);
    if(and__3822__auto____16799) {
      return cljs.core.every_QMARK_.call(null, function(p1__16774_SHARP_) {
        return cljs.core.contains_QMARK_.call(null, coll, p1__16774_SHARP_)
      }, other)
    }else {
      return and__3822__auto____16799
    }
  }else {
    return and__3822__auto____16798
  }
};
cljs.core.PersistentHashSet.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__16800 = this;
  return new cljs.core.PersistentHashSet(meta, this__16800.hash_map, this__16800.__hash)
};
cljs.core.PersistentHashSet.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__16801 = this;
  return this__16801.meta
};
cljs.core.PersistentHashSet.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__16802 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentHashSet.EMPTY, this__16802.meta)
};
cljs.core.PersistentHashSet;
cljs.core.PersistentHashSet.EMPTY = new cljs.core.PersistentHashSet(null, cljs.core.hash_map.call(null), 0);
cljs.core.PersistentHashSet.fromArray = function(items) {
  var len__16804 = cljs.core.count.call(null, items);
  var i__16805 = 0;
  var out__16806 = cljs.core.transient$.call(null, cljs.core.PersistentHashSet.EMPTY);
  while(true) {
    if(i__16805 < len__16804) {
      var G__16807 = i__16805 + 1;
      var G__16808 = cljs.core.conj_BANG_.call(null, out__16806, items[i__16805]);
      i__16805 = G__16807;
      out__16806 = G__16808;
      continue
    }else {
      return cljs.core.persistent_BANG_.call(null, out__16806)
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
  var G__16826 = null;
  var G__16826__2 = function(this_sym16812, k) {
    var this__16814 = this;
    var this_sym16812__16815 = this;
    var tcoll__16816 = this_sym16812__16815;
    if(cljs.core._lookup.call(null, this__16814.transient_map, k, cljs.core.lookup_sentinel) === cljs.core.lookup_sentinel) {
      return null
    }else {
      return k
    }
  };
  var G__16826__3 = function(this_sym16813, k, not_found) {
    var this__16814 = this;
    var this_sym16813__16817 = this;
    var tcoll__16818 = this_sym16813__16817;
    if(cljs.core._lookup.call(null, this__16814.transient_map, k, cljs.core.lookup_sentinel) === cljs.core.lookup_sentinel) {
      return not_found
    }else {
      return k
    }
  };
  G__16826 = function(this_sym16813, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__16826__2.call(this, this_sym16813, k);
      case 3:
        return G__16826__3.call(this, this_sym16813, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__16826
}();
cljs.core.TransientHashSet.prototype.apply = function(this_sym16810, args16811) {
  var this__16819 = this;
  return this_sym16810.call.apply(this_sym16810, [this_sym16810].concat(args16811.slice()))
};
cljs.core.TransientHashSet.prototype.cljs$core$ILookup$_lookup$arity$2 = function(tcoll, v) {
  var this__16820 = this;
  return tcoll.cljs$core$ILookup$_lookup$arity$3(tcoll, v, null)
};
cljs.core.TransientHashSet.prototype.cljs$core$ILookup$_lookup$arity$3 = function(tcoll, v, not_found) {
  var this__16821 = this;
  if(cljs.core._lookup.call(null, this__16821.transient_map, v, cljs.core.lookup_sentinel) === cljs.core.lookup_sentinel) {
    return not_found
  }else {
    return v
  }
};
cljs.core.TransientHashSet.prototype.cljs$core$ICounted$_count$arity$1 = function(tcoll) {
  var this__16822 = this;
  return cljs.core.count.call(null, this__16822.transient_map)
};
cljs.core.TransientHashSet.prototype.cljs$core$ITransientSet$_disjoin_BANG_$arity$2 = function(tcoll, v) {
  var this__16823 = this;
  this__16823.transient_map = cljs.core.dissoc_BANG_.call(null, this__16823.transient_map, v);
  return tcoll
};
cljs.core.TransientHashSet.prototype.cljs$core$ITransientCollection$_conj_BANG_$arity$2 = function(tcoll, o) {
  var this__16824 = this;
  this__16824.transient_map = cljs.core.assoc_BANG_.call(null, this__16824.transient_map, o, null);
  return tcoll
};
cljs.core.TransientHashSet.prototype.cljs$core$ITransientCollection$_persistent_BANG_$arity$1 = function(tcoll) {
  var this__16825 = this;
  return new cljs.core.PersistentHashSet(null, cljs.core.persistent_BANG_.call(null, this__16825.transient_map), null)
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
  var this__16829 = this;
  var h__2192__auto____16830 = this__16829.__hash;
  if(!(h__2192__auto____16830 == null)) {
    return h__2192__auto____16830
  }else {
    var h__2192__auto____16831 = cljs.core.hash_iset.call(null, coll);
    this__16829.__hash = h__2192__auto____16831;
    return h__2192__auto____16831
  }
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, v) {
  var this__16832 = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(coll, v, null)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, v, not_found) {
  var this__16833 = this;
  if(cljs.core.truth_(cljs.core._contains_key_QMARK_.call(null, this__16833.tree_map, v))) {
    return v
  }else {
    return not_found
  }
};
cljs.core.PersistentTreeSet.prototype.call = function() {
  var G__16859 = null;
  var G__16859__2 = function(this_sym16834, k) {
    var this__16836 = this;
    var this_sym16834__16837 = this;
    var coll__16838 = this_sym16834__16837;
    return coll__16838.cljs$core$ILookup$_lookup$arity$2(coll__16838, k)
  };
  var G__16859__3 = function(this_sym16835, k, not_found) {
    var this__16836 = this;
    var this_sym16835__16839 = this;
    var coll__16840 = this_sym16835__16839;
    return coll__16840.cljs$core$ILookup$_lookup$arity$3(coll__16840, k, not_found)
  };
  G__16859 = function(this_sym16835, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__16859__2.call(this, this_sym16835, k);
      case 3:
        return G__16859__3.call(this, this_sym16835, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__16859
}();
cljs.core.PersistentTreeSet.prototype.apply = function(this_sym16827, args16828) {
  var this__16841 = this;
  return this_sym16827.call.apply(this_sym16827, [this_sym16827].concat(args16828.slice()))
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__16842 = this;
  return new cljs.core.PersistentTreeSet(this__16842.meta, cljs.core.assoc.call(null, this__16842.tree_map, o, null), null)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IReversible$_rseq$arity$1 = function(coll) {
  var this__16843 = this;
  return cljs.core.map.call(null, cljs.core.key, cljs.core.rseq.call(null, this__16843.tree_map))
};
cljs.core.PersistentTreeSet.prototype.toString = function() {
  var this__16844 = this;
  var this__16845 = this;
  return cljs.core.pr_str.call(null, this__16845)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISorted$_sorted_seq$arity$2 = function(coll, ascending_QMARK_) {
  var this__16846 = this;
  return cljs.core.map.call(null, cljs.core.key, cljs.core._sorted_seq.call(null, this__16846.tree_map, ascending_QMARK_))
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISorted$_sorted_seq_from$arity$3 = function(coll, k, ascending_QMARK_) {
  var this__16847 = this;
  return cljs.core.map.call(null, cljs.core.key, cljs.core._sorted_seq_from.call(null, this__16847.tree_map, k, ascending_QMARK_))
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISorted$_entry_key$arity$2 = function(coll, entry) {
  var this__16848 = this;
  return entry
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISorted$_comparator$arity$1 = function(coll) {
  var this__16849 = this;
  return cljs.core._comparator.call(null, this__16849.tree_map)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__16850 = this;
  return cljs.core.keys.call(null, this__16850.tree_map)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISet$_disjoin$arity$2 = function(coll, v) {
  var this__16851 = this;
  return new cljs.core.PersistentTreeSet(this__16851.meta, cljs.core.dissoc.call(null, this__16851.tree_map, v), null)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__16852 = this;
  return cljs.core.count.call(null, this__16852.tree_map)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__16853 = this;
  var and__3822__auto____16854 = cljs.core.set_QMARK_.call(null, other);
  if(and__3822__auto____16854) {
    var and__3822__auto____16855 = cljs.core.count.call(null, coll) === cljs.core.count.call(null, other);
    if(and__3822__auto____16855) {
      return cljs.core.every_QMARK_.call(null, function(p1__16809_SHARP_) {
        return cljs.core.contains_QMARK_.call(null, coll, p1__16809_SHARP_)
      }, other)
    }else {
      return and__3822__auto____16855
    }
  }else {
    return and__3822__auto____16854
  }
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__16856 = this;
  return new cljs.core.PersistentTreeSet(meta, this__16856.tree_map, this__16856.__hash)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__16857 = this;
  return this__16857.meta
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__16858 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentTreeSet.EMPTY, this__16858.meta)
};
cljs.core.PersistentTreeSet;
cljs.core.PersistentTreeSet.EMPTY = new cljs.core.PersistentTreeSet(null, cljs.core.sorted_map.call(null), 0);
cljs.core.hash_set = function() {
  var hash_set = null;
  var hash_set__0 = function() {
    return cljs.core.PersistentHashSet.EMPTY
  };
  var hash_set__1 = function() {
    var G__16864__delegate = function(keys) {
      var in__16862 = cljs.core.seq.call(null, keys);
      var out__16863 = cljs.core.transient$.call(null, cljs.core.PersistentHashSet.EMPTY);
      while(true) {
        if(cljs.core.seq.call(null, in__16862)) {
          var G__16865 = cljs.core.next.call(null, in__16862);
          var G__16866 = cljs.core.conj_BANG_.call(null, out__16863, cljs.core.first.call(null, in__16862));
          in__16862 = G__16865;
          out__16863 = G__16866;
          continue
        }else {
          return cljs.core.persistent_BANG_.call(null, out__16863)
        }
        break
      }
    };
    var G__16864 = function(var_args) {
      var keys = null;
      if(goog.isDef(var_args)) {
        keys = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
      }
      return G__16864__delegate.call(this, keys)
    };
    G__16864.cljs$lang$maxFixedArity = 0;
    G__16864.cljs$lang$applyTo = function(arglist__16867) {
      var keys = cljs.core.seq(arglist__16867);
      return G__16864__delegate(keys)
    };
    G__16864.cljs$lang$arity$variadic = G__16864__delegate;
    return G__16864
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
  sorted_set.cljs$lang$applyTo = function(arglist__16868) {
    var keys = cljs.core.seq(arglist__16868);
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
  sorted_set_by.cljs$lang$applyTo = function(arglist__16870) {
    var comparator = cljs.core.first(arglist__16870);
    var keys = cljs.core.rest(arglist__16870);
    return sorted_set_by__delegate(comparator, keys)
  };
  sorted_set_by.cljs$lang$arity$variadic = sorted_set_by__delegate;
  return sorted_set_by
}();
cljs.core.replace = function replace(smap, coll) {
  if(cljs.core.vector_QMARK_.call(null, coll)) {
    var n__16876 = cljs.core.count.call(null, coll);
    return cljs.core.reduce.call(null, function(v, i) {
      var temp__3971__auto____16877 = cljs.core.find.call(null, smap, cljs.core.nth.call(null, v, i));
      if(cljs.core.truth_(temp__3971__auto____16877)) {
        var e__16878 = temp__3971__auto____16877;
        return cljs.core.assoc.call(null, v, i, cljs.core.second.call(null, e__16878))
      }else {
        return v
      }
    }, coll, cljs.core.take.call(null, n__16876, cljs.core.iterate.call(null, cljs.core.inc, 0)))
  }else {
    return cljs.core.map.call(null, function(p1__16869_SHARP_) {
      var temp__3971__auto____16879 = cljs.core.find.call(null, smap, p1__16869_SHARP_);
      if(cljs.core.truth_(temp__3971__auto____16879)) {
        var e__16880 = temp__3971__auto____16879;
        return cljs.core.second.call(null, e__16880)
      }else {
        return p1__16869_SHARP_
      }
    }, coll)
  }
};
cljs.core.distinct = function distinct(coll) {
  var step__16910 = function step(xs, seen) {
    return new cljs.core.LazySeq(null, false, function() {
      return function(p__16903, seen) {
        while(true) {
          var vec__16904__16905 = p__16903;
          var f__16906 = cljs.core.nth.call(null, vec__16904__16905, 0, null);
          var xs__16907 = vec__16904__16905;
          var temp__3974__auto____16908 = cljs.core.seq.call(null, xs__16907);
          if(temp__3974__auto____16908) {
            var s__16909 = temp__3974__auto____16908;
            if(cljs.core.contains_QMARK_.call(null, seen, f__16906)) {
              var G__16911 = cljs.core.rest.call(null, s__16909);
              var G__16912 = seen;
              p__16903 = G__16911;
              seen = G__16912;
              continue
            }else {
              return cljs.core.cons.call(null, f__16906, step.call(null, cljs.core.rest.call(null, s__16909), cljs.core.conj.call(null, seen, f__16906)))
            }
          }else {
            return null
          }
          break
        }
      }.call(null, xs, seen)
    }, null)
  };
  return step__16910.call(null, coll, cljs.core.PersistentHashSet.EMPTY)
};
cljs.core.butlast = function butlast(s) {
  var ret__16915 = cljs.core.PersistentVector.EMPTY;
  var s__16916 = s;
  while(true) {
    if(cljs.core.next.call(null, s__16916)) {
      var G__16917 = cljs.core.conj.call(null, ret__16915, cljs.core.first.call(null, s__16916));
      var G__16918 = cljs.core.next.call(null, s__16916);
      ret__16915 = G__16917;
      s__16916 = G__16918;
      continue
    }else {
      return cljs.core.seq.call(null, ret__16915)
    }
    break
  }
};
cljs.core.name = function name(x) {
  if(cljs.core.string_QMARK_.call(null, x)) {
    return x
  }else {
    if(function() {
      var or__3824__auto____16921 = cljs.core.keyword_QMARK_.call(null, x);
      if(or__3824__auto____16921) {
        return or__3824__auto____16921
      }else {
        return cljs.core.symbol_QMARK_.call(null, x)
      }
    }()) {
      var i__16922 = x.lastIndexOf("/");
      if(i__16922 < 0) {
        return cljs.core.subs.call(null, x, 2)
      }else {
        return cljs.core.subs.call(null, x, i__16922 + 1)
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
    var or__3824__auto____16925 = cljs.core.keyword_QMARK_.call(null, x);
    if(or__3824__auto____16925) {
      return or__3824__auto____16925
    }else {
      return cljs.core.symbol_QMARK_.call(null, x)
    }
  }()) {
    var i__16926 = x.lastIndexOf("/");
    if(i__16926 > -1) {
      return cljs.core.subs.call(null, x, 2, i__16926)
    }else {
      return null
    }
  }else {
    throw new Error([cljs.core.str("Doesn't support namespace: "), cljs.core.str(x)].join(""));
  }
};
cljs.core.zipmap = function zipmap(keys, vals) {
  var map__16933 = cljs.core.ObjMap.EMPTY;
  var ks__16934 = cljs.core.seq.call(null, keys);
  var vs__16935 = cljs.core.seq.call(null, vals);
  while(true) {
    if(function() {
      var and__3822__auto____16936 = ks__16934;
      if(and__3822__auto____16936) {
        return vs__16935
      }else {
        return and__3822__auto____16936
      }
    }()) {
      var G__16937 = cljs.core.assoc.call(null, map__16933, cljs.core.first.call(null, ks__16934), cljs.core.first.call(null, vs__16935));
      var G__16938 = cljs.core.next.call(null, ks__16934);
      var G__16939 = cljs.core.next.call(null, vs__16935);
      map__16933 = G__16937;
      ks__16934 = G__16938;
      vs__16935 = G__16939;
      continue
    }else {
      return map__16933
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
    var G__16942__delegate = function(k, x, y, more) {
      return cljs.core.reduce.call(null, function(p1__16927_SHARP_, p2__16928_SHARP_) {
        return max_key.call(null, k, p1__16927_SHARP_, p2__16928_SHARP_)
      }, max_key.call(null, k, x, y), more)
    };
    var G__16942 = function(k, x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__16942__delegate.call(this, k, x, y, more)
    };
    G__16942.cljs$lang$maxFixedArity = 3;
    G__16942.cljs$lang$applyTo = function(arglist__16943) {
      var k = cljs.core.first(arglist__16943);
      var x = cljs.core.first(cljs.core.next(arglist__16943));
      var y = cljs.core.first(cljs.core.next(cljs.core.next(arglist__16943)));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__16943)));
      return G__16942__delegate(k, x, y, more)
    };
    G__16942.cljs$lang$arity$variadic = G__16942__delegate;
    return G__16942
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
    var G__16944__delegate = function(k, x, y, more) {
      return cljs.core.reduce.call(null, function(p1__16940_SHARP_, p2__16941_SHARP_) {
        return min_key.call(null, k, p1__16940_SHARP_, p2__16941_SHARP_)
      }, min_key.call(null, k, x, y), more)
    };
    var G__16944 = function(k, x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__16944__delegate.call(this, k, x, y, more)
    };
    G__16944.cljs$lang$maxFixedArity = 3;
    G__16944.cljs$lang$applyTo = function(arglist__16945) {
      var k = cljs.core.first(arglist__16945);
      var x = cljs.core.first(cljs.core.next(arglist__16945));
      var y = cljs.core.first(cljs.core.next(cljs.core.next(arglist__16945)));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__16945)));
      return G__16944__delegate(k, x, y, more)
    };
    G__16944.cljs$lang$arity$variadic = G__16944__delegate;
    return G__16944
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
      var temp__3974__auto____16948 = cljs.core.seq.call(null, coll);
      if(temp__3974__auto____16948) {
        var s__16949 = temp__3974__auto____16948;
        return cljs.core.cons.call(null, cljs.core.take.call(null, n, s__16949), partition_all.call(null, n, step, cljs.core.drop.call(null, step, s__16949)))
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
    var temp__3974__auto____16952 = cljs.core.seq.call(null, coll);
    if(temp__3974__auto____16952) {
      var s__16953 = temp__3974__auto____16952;
      if(cljs.core.truth_(pred.call(null, cljs.core.first.call(null, s__16953)))) {
        return cljs.core.cons.call(null, cljs.core.first.call(null, s__16953), take_while.call(null, pred, cljs.core.rest.call(null, s__16953)))
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
    var comp__16955 = cljs.core._comparator.call(null, sc);
    return test.call(null, comp__16955.call(null, cljs.core._entry_key.call(null, sc, e), key), 0)
  }
};
cljs.core.subseq = function() {
  var subseq = null;
  var subseq__3 = function(sc, test, key) {
    var include__16967 = cljs.core.mk_bound_fn.call(null, sc, test, key);
    if(cljs.core.truth_(cljs.core.PersistentHashSet.fromArray([cljs.core._GT_, cljs.core._GT__EQ_]).call(null, test))) {
      var temp__3974__auto____16968 = cljs.core._sorted_seq_from.call(null, sc, key, true);
      if(cljs.core.truth_(temp__3974__auto____16968)) {
        var vec__16969__16970 = temp__3974__auto____16968;
        var e__16971 = cljs.core.nth.call(null, vec__16969__16970, 0, null);
        var s__16972 = vec__16969__16970;
        if(cljs.core.truth_(include__16967.call(null, e__16971))) {
          return s__16972
        }else {
          return cljs.core.next.call(null, s__16972)
        }
      }else {
        return null
      }
    }else {
      return cljs.core.take_while.call(null, include__16967, cljs.core._sorted_seq.call(null, sc, true))
    }
  };
  var subseq__5 = function(sc, start_test, start_key, end_test, end_key) {
    var temp__3974__auto____16973 = cljs.core._sorted_seq_from.call(null, sc, start_key, true);
    if(cljs.core.truth_(temp__3974__auto____16973)) {
      var vec__16974__16975 = temp__3974__auto____16973;
      var e__16976 = cljs.core.nth.call(null, vec__16974__16975, 0, null);
      var s__16977 = vec__16974__16975;
      return cljs.core.take_while.call(null, cljs.core.mk_bound_fn.call(null, sc, end_test, end_key), cljs.core.truth_(cljs.core.mk_bound_fn.call(null, sc, start_test, start_key).call(null, e__16976)) ? s__16977 : cljs.core.next.call(null, s__16977))
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
    var include__16989 = cljs.core.mk_bound_fn.call(null, sc, test, key);
    if(cljs.core.truth_(cljs.core.PersistentHashSet.fromArray([cljs.core._LT_, cljs.core._LT__EQ_]).call(null, test))) {
      var temp__3974__auto____16990 = cljs.core._sorted_seq_from.call(null, sc, key, false);
      if(cljs.core.truth_(temp__3974__auto____16990)) {
        var vec__16991__16992 = temp__3974__auto____16990;
        var e__16993 = cljs.core.nth.call(null, vec__16991__16992, 0, null);
        var s__16994 = vec__16991__16992;
        if(cljs.core.truth_(include__16989.call(null, e__16993))) {
          return s__16994
        }else {
          return cljs.core.next.call(null, s__16994)
        }
      }else {
        return null
      }
    }else {
      return cljs.core.take_while.call(null, include__16989, cljs.core._sorted_seq.call(null, sc, false))
    }
  };
  var rsubseq__5 = function(sc, start_test, start_key, end_test, end_key) {
    var temp__3974__auto____16995 = cljs.core._sorted_seq_from.call(null, sc, end_key, false);
    if(cljs.core.truth_(temp__3974__auto____16995)) {
      var vec__16996__16997 = temp__3974__auto____16995;
      var e__16998 = cljs.core.nth.call(null, vec__16996__16997, 0, null);
      var s__16999 = vec__16996__16997;
      return cljs.core.take_while.call(null, cljs.core.mk_bound_fn.call(null, sc, start_test, start_key), cljs.core.truth_(cljs.core.mk_bound_fn.call(null, sc, end_test, end_key).call(null, e__16998)) ? s__16999 : cljs.core.next.call(null, s__16999))
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
  var this__17000 = this;
  var h__2192__auto____17001 = this__17000.__hash;
  if(!(h__2192__auto____17001 == null)) {
    return h__2192__auto____17001
  }else {
    var h__2192__auto____17002 = cljs.core.hash_coll.call(null, rng);
    this__17000.__hash = h__2192__auto____17002;
    return h__2192__auto____17002
  }
};
cljs.core.Range.prototype.cljs$core$INext$_next$arity$1 = function(rng) {
  var this__17003 = this;
  if(this__17003.step > 0) {
    if(this__17003.start + this__17003.step < this__17003.end) {
      return new cljs.core.Range(this__17003.meta, this__17003.start + this__17003.step, this__17003.end, this__17003.step, null)
    }else {
      return null
    }
  }else {
    if(this__17003.start + this__17003.step > this__17003.end) {
      return new cljs.core.Range(this__17003.meta, this__17003.start + this__17003.step, this__17003.end, this__17003.step, null)
    }else {
      return null
    }
  }
};
cljs.core.Range.prototype.cljs$core$ICollection$_conj$arity$2 = function(rng, o) {
  var this__17004 = this;
  return cljs.core.cons.call(null, o, rng)
};
cljs.core.Range.prototype.toString = function() {
  var this__17005 = this;
  var this__17006 = this;
  return cljs.core.pr_str.call(null, this__17006)
};
cljs.core.Range.prototype.cljs$core$IReduce$_reduce$arity$2 = function(rng, f) {
  var this__17007 = this;
  return cljs.core.ci_reduce.call(null, rng, f)
};
cljs.core.Range.prototype.cljs$core$IReduce$_reduce$arity$3 = function(rng, f, s) {
  var this__17008 = this;
  return cljs.core.ci_reduce.call(null, rng, f, s)
};
cljs.core.Range.prototype.cljs$core$ISeqable$_seq$arity$1 = function(rng) {
  var this__17009 = this;
  if(this__17009.step > 0) {
    if(this__17009.start < this__17009.end) {
      return rng
    }else {
      return null
    }
  }else {
    if(this__17009.start > this__17009.end) {
      return rng
    }else {
      return null
    }
  }
};
cljs.core.Range.prototype.cljs$core$ICounted$_count$arity$1 = function(rng) {
  var this__17010 = this;
  if(cljs.core.not.call(null, rng.cljs$core$ISeqable$_seq$arity$1(rng))) {
    return 0
  }else {
    return Math.ceil((this__17010.end - this__17010.start) / this__17010.step)
  }
};
cljs.core.Range.prototype.cljs$core$ISeq$_first$arity$1 = function(rng) {
  var this__17011 = this;
  return this__17011.start
};
cljs.core.Range.prototype.cljs$core$ISeq$_rest$arity$1 = function(rng) {
  var this__17012 = this;
  if(!(rng.cljs$core$ISeqable$_seq$arity$1(rng) == null)) {
    return new cljs.core.Range(this__17012.meta, this__17012.start + this__17012.step, this__17012.end, this__17012.step, null)
  }else {
    return cljs.core.List.EMPTY
  }
};
cljs.core.Range.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(rng, other) {
  var this__17013 = this;
  return cljs.core.equiv_sequential.call(null, rng, other)
};
cljs.core.Range.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(rng, meta) {
  var this__17014 = this;
  return new cljs.core.Range(meta, this__17014.start, this__17014.end, this__17014.step, this__17014.__hash)
};
cljs.core.Range.prototype.cljs$core$IMeta$_meta$arity$1 = function(rng) {
  var this__17015 = this;
  return this__17015.meta
};
cljs.core.Range.prototype.cljs$core$IIndexed$_nth$arity$2 = function(rng, n) {
  var this__17016 = this;
  if(n < rng.cljs$core$ICounted$_count$arity$1(rng)) {
    return this__17016.start + n * this__17016.step
  }else {
    if(function() {
      var and__3822__auto____17017 = this__17016.start > this__17016.end;
      if(and__3822__auto____17017) {
        return this__17016.step === 0
      }else {
        return and__3822__auto____17017
      }
    }()) {
      return this__17016.start
    }else {
      throw new Error("Index out of bounds");
    }
  }
};
cljs.core.Range.prototype.cljs$core$IIndexed$_nth$arity$3 = function(rng, n, not_found) {
  var this__17018 = this;
  if(n < rng.cljs$core$ICounted$_count$arity$1(rng)) {
    return this__17018.start + n * this__17018.step
  }else {
    if(function() {
      var and__3822__auto____17019 = this__17018.start > this__17018.end;
      if(and__3822__auto____17019) {
        return this__17018.step === 0
      }else {
        return and__3822__auto____17019
      }
    }()) {
      return this__17018.start
    }else {
      return not_found
    }
  }
};
cljs.core.Range.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(rng) {
  var this__17020 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__17020.meta)
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
    var temp__3974__auto____17023 = cljs.core.seq.call(null, coll);
    if(temp__3974__auto____17023) {
      var s__17024 = temp__3974__auto____17023;
      return cljs.core.cons.call(null, cljs.core.first.call(null, s__17024), take_nth.call(null, n, cljs.core.drop.call(null, n, s__17024)))
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
    var temp__3974__auto____17031 = cljs.core.seq.call(null, coll);
    if(temp__3974__auto____17031) {
      var s__17032 = temp__3974__auto____17031;
      var fst__17033 = cljs.core.first.call(null, s__17032);
      var fv__17034 = f.call(null, fst__17033);
      var run__17035 = cljs.core.cons.call(null, fst__17033, cljs.core.take_while.call(null, function(p1__17025_SHARP_) {
        return cljs.core._EQ_.call(null, fv__17034, f.call(null, p1__17025_SHARP_))
      }, cljs.core.next.call(null, s__17032)));
      return cljs.core.cons.call(null, run__17035, partition_by.call(null, f, cljs.core.seq.call(null, cljs.core.drop.call(null, cljs.core.count.call(null, run__17035), s__17032))))
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
      var temp__3971__auto____17050 = cljs.core.seq.call(null, coll);
      if(temp__3971__auto____17050) {
        var s__17051 = temp__3971__auto____17050;
        return reductions.call(null, f, cljs.core.first.call(null, s__17051), cljs.core.rest.call(null, s__17051))
      }else {
        return cljs.core.list.call(null, f.call(null))
      }
    }, null)
  };
  var reductions__3 = function(f, init, coll) {
    return cljs.core.cons.call(null, init, new cljs.core.LazySeq(null, false, function() {
      var temp__3974__auto____17052 = cljs.core.seq.call(null, coll);
      if(temp__3974__auto____17052) {
        var s__17053 = temp__3974__auto____17052;
        return reductions.call(null, f, f.call(null, init, cljs.core.first.call(null, s__17053)), cljs.core.rest.call(null, s__17053))
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
      var G__17056 = null;
      var G__17056__0 = function() {
        return cljs.core.vector.call(null, f.call(null))
      };
      var G__17056__1 = function(x) {
        return cljs.core.vector.call(null, f.call(null, x))
      };
      var G__17056__2 = function(x, y) {
        return cljs.core.vector.call(null, f.call(null, x, y))
      };
      var G__17056__3 = function(x, y, z) {
        return cljs.core.vector.call(null, f.call(null, x, y, z))
      };
      var G__17056__4 = function() {
        var G__17057__delegate = function(x, y, z, args) {
          return cljs.core.vector.call(null, cljs.core.apply.call(null, f, x, y, z, args))
        };
        var G__17057 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__17057__delegate.call(this, x, y, z, args)
        };
        G__17057.cljs$lang$maxFixedArity = 3;
        G__17057.cljs$lang$applyTo = function(arglist__17058) {
          var x = cljs.core.first(arglist__17058);
          var y = cljs.core.first(cljs.core.next(arglist__17058));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__17058)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__17058)));
          return G__17057__delegate(x, y, z, args)
        };
        G__17057.cljs$lang$arity$variadic = G__17057__delegate;
        return G__17057
      }();
      G__17056 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__17056__0.call(this);
          case 1:
            return G__17056__1.call(this, x);
          case 2:
            return G__17056__2.call(this, x, y);
          case 3:
            return G__17056__3.call(this, x, y, z);
          default:
            return G__17056__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__17056.cljs$lang$maxFixedArity = 3;
      G__17056.cljs$lang$applyTo = G__17056__4.cljs$lang$applyTo;
      return G__17056
    }()
  };
  var juxt__2 = function(f, g) {
    return function() {
      var G__17059 = null;
      var G__17059__0 = function() {
        return cljs.core.vector.call(null, f.call(null), g.call(null))
      };
      var G__17059__1 = function(x) {
        return cljs.core.vector.call(null, f.call(null, x), g.call(null, x))
      };
      var G__17059__2 = function(x, y) {
        return cljs.core.vector.call(null, f.call(null, x, y), g.call(null, x, y))
      };
      var G__17059__3 = function(x, y, z) {
        return cljs.core.vector.call(null, f.call(null, x, y, z), g.call(null, x, y, z))
      };
      var G__17059__4 = function() {
        var G__17060__delegate = function(x, y, z, args) {
          return cljs.core.vector.call(null, cljs.core.apply.call(null, f, x, y, z, args), cljs.core.apply.call(null, g, x, y, z, args))
        };
        var G__17060 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__17060__delegate.call(this, x, y, z, args)
        };
        G__17060.cljs$lang$maxFixedArity = 3;
        G__17060.cljs$lang$applyTo = function(arglist__17061) {
          var x = cljs.core.first(arglist__17061);
          var y = cljs.core.first(cljs.core.next(arglist__17061));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__17061)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__17061)));
          return G__17060__delegate(x, y, z, args)
        };
        G__17060.cljs$lang$arity$variadic = G__17060__delegate;
        return G__17060
      }();
      G__17059 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__17059__0.call(this);
          case 1:
            return G__17059__1.call(this, x);
          case 2:
            return G__17059__2.call(this, x, y);
          case 3:
            return G__17059__3.call(this, x, y, z);
          default:
            return G__17059__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__17059.cljs$lang$maxFixedArity = 3;
      G__17059.cljs$lang$applyTo = G__17059__4.cljs$lang$applyTo;
      return G__17059
    }()
  };
  var juxt__3 = function(f, g, h) {
    return function() {
      var G__17062 = null;
      var G__17062__0 = function() {
        return cljs.core.vector.call(null, f.call(null), g.call(null), h.call(null))
      };
      var G__17062__1 = function(x) {
        return cljs.core.vector.call(null, f.call(null, x), g.call(null, x), h.call(null, x))
      };
      var G__17062__2 = function(x, y) {
        return cljs.core.vector.call(null, f.call(null, x, y), g.call(null, x, y), h.call(null, x, y))
      };
      var G__17062__3 = function(x, y, z) {
        return cljs.core.vector.call(null, f.call(null, x, y, z), g.call(null, x, y, z), h.call(null, x, y, z))
      };
      var G__17062__4 = function() {
        var G__17063__delegate = function(x, y, z, args) {
          return cljs.core.vector.call(null, cljs.core.apply.call(null, f, x, y, z, args), cljs.core.apply.call(null, g, x, y, z, args), cljs.core.apply.call(null, h, x, y, z, args))
        };
        var G__17063 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__17063__delegate.call(this, x, y, z, args)
        };
        G__17063.cljs$lang$maxFixedArity = 3;
        G__17063.cljs$lang$applyTo = function(arglist__17064) {
          var x = cljs.core.first(arglist__17064);
          var y = cljs.core.first(cljs.core.next(arglist__17064));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__17064)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__17064)));
          return G__17063__delegate(x, y, z, args)
        };
        G__17063.cljs$lang$arity$variadic = G__17063__delegate;
        return G__17063
      }();
      G__17062 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__17062__0.call(this);
          case 1:
            return G__17062__1.call(this, x);
          case 2:
            return G__17062__2.call(this, x, y);
          case 3:
            return G__17062__3.call(this, x, y, z);
          default:
            return G__17062__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__17062.cljs$lang$maxFixedArity = 3;
      G__17062.cljs$lang$applyTo = G__17062__4.cljs$lang$applyTo;
      return G__17062
    }()
  };
  var juxt__4 = function() {
    var G__17065__delegate = function(f, g, h, fs) {
      var fs__17055 = cljs.core.list_STAR_.call(null, f, g, h, fs);
      return function() {
        var G__17066 = null;
        var G__17066__0 = function() {
          return cljs.core.reduce.call(null, function(p1__17036_SHARP_, p2__17037_SHARP_) {
            return cljs.core.conj.call(null, p1__17036_SHARP_, p2__17037_SHARP_.call(null))
          }, cljs.core.PersistentVector.EMPTY, fs__17055)
        };
        var G__17066__1 = function(x) {
          return cljs.core.reduce.call(null, function(p1__17038_SHARP_, p2__17039_SHARP_) {
            return cljs.core.conj.call(null, p1__17038_SHARP_, p2__17039_SHARP_.call(null, x))
          }, cljs.core.PersistentVector.EMPTY, fs__17055)
        };
        var G__17066__2 = function(x, y) {
          return cljs.core.reduce.call(null, function(p1__17040_SHARP_, p2__17041_SHARP_) {
            return cljs.core.conj.call(null, p1__17040_SHARP_, p2__17041_SHARP_.call(null, x, y))
          }, cljs.core.PersistentVector.EMPTY, fs__17055)
        };
        var G__17066__3 = function(x, y, z) {
          return cljs.core.reduce.call(null, function(p1__17042_SHARP_, p2__17043_SHARP_) {
            return cljs.core.conj.call(null, p1__17042_SHARP_, p2__17043_SHARP_.call(null, x, y, z))
          }, cljs.core.PersistentVector.EMPTY, fs__17055)
        };
        var G__17066__4 = function() {
          var G__17067__delegate = function(x, y, z, args) {
            return cljs.core.reduce.call(null, function(p1__17044_SHARP_, p2__17045_SHARP_) {
              return cljs.core.conj.call(null, p1__17044_SHARP_, cljs.core.apply.call(null, p2__17045_SHARP_, x, y, z, args))
            }, cljs.core.PersistentVector.EMPTY, fs__17055)
          };
          var G__17067 = function(x, y, z, var_args) {
            var args = null;
            if(goog.isDef(var_args)) {
              args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
            }
            return G__17067__delegate.call(this, x, y, z, args)
          };
          G__17067.cljs$lang$maxFixedArity = 3;
          G__17067.cljs$lang$applyTo = function(arglist__17068) {
            var x = cljs.core.first(arglist__17068);
            var y = cljs.core.first(cljs.core.next(arglist__17068));
            var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__17068)));
            var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__17068)));
            return G__17067__delegate(x, y, z, args)
          };
          G__17067.cljs$lang$arity$variadic = G__17067__delegate;
          return G__17067
        }();
        G__17066 = function(x, y, z, var_args) {
          var args = var_args;
          switch(arguments.length) {
            case 0:
              return G__17066__0.call(this);
            case 1:
              return G__17066__1.call(this, x);
            case 2:
              return G__17066__2.call(this, x, y);
            case 3:
              return G__17066__3.call(this, x, y, z);
            default:
              return G__17066__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
          }
          throw"Invalid arity: " + arguments.length;
        };
        G__17066.cljs$lang$maxFixedArity = 3;
        G__17066.cljs$lang$applyTo = G__17066__4.cljs$lang$applyTo;
        return G__17066
      }()
    };
    var G__17065 = function(f, g, h, var_args) {
      var fs = null;
      if(goog.isDef(var_args)) {
        fs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__17065__delegate.call(this, f, g, h, fs)
    };
    G__17065.cljs$lang$maxFixedArity = 3;
    G__17065.cljs$lang$applyTo = function(arglist__17069) {
      var f = cljs.core.first(arglist__17069);
      var g = cljs.core.first(cljs.core.next(arglist__17069));
      var h = cljs.core.first(cljs.core.next(cljs.core.next(arglist__17069)));
      var fs = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__17069)));
      return G__17065__delegate(f, g, h, fs)
    };
    G__17065.cljs$lang$arity$variadic = G__17065__delegate;
    return G__17065
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
        var G__17072 = cljs.core.next.call(null, coll);
        coll = G__17072;
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
        var and__3822__auto____17071 = cljs.core.seq.call(null, coll);
        if(and__3822__auto____17071) {
          return n > 0
        }else {
          return and__3822__auto____17071
        }
      }())) {
        var G__17073 = n - 1;
        var G__17074 = cljs.core.next.call(null, coll);
        n = G__17073;
        coll = G__17074;
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
  var matches__17076 = re.exec(s);
  if(cljs.core._EQ_.call(null, cljs.core.first.call(null, matches__17076), s)) {
    if(cljs.core.count.call(null, matches__17076) === 1) {
      return cljs.core.first.call(null, matches__17076)
    }else {
      return cljs.core.vec.call(null, matches__17076)
    }
  }else {
    return null
  }
};
cljs.core.re_find = function re_find(re, s) {
  var matches__17078 = re.exec(s);
  if(matches__17078 == null) {
    return null
  }else {
    if(cljs.core.count.call(null, matches__17078) === 1) {
      return cljs.core.first.call(null, matches__17078)
    }else {
      return cljs.core.vec.call(null, matches__17078)
    }
  }
};
cljs.core.re_seq = function re_seq(re, s) {
  var match_data__17083 = cljs.core.re_find.call(null, re, s);
  var match_idx__17084 = s.search(re);
  var match_str__17085 = cljs.core.coll_QMARK_.call(null, match_data__17083) ? cljs.core.first.call(null, match_data__17083) : match_data__17083;
  var post_match__17086 = cljs.core.subs.call(null, s, match_idx__17084 + cljs.core.count.call(null, match_str__17085));
  if(cljs.core.truth_(match_data__17083)) {
    return new cljs.core.LazySeq(null, false, function() {
      return cljs.core.cons.call(null, match_data__17083, re_seq.call(null, re, post_match__17086))
    }, null)
  }else {
    return null
  }
};
cljs.core.re_pattern = function re_pattern(s) {
  var vec__17093__17094 = cljs.core.re_find.call(null, /^(?:\(\?([idmsux]*)\))?(.*)/, s);
  var ___17095 = cljs.core.nth.call(null, vec__17093__17094, 0, null);
  var flags__17096 = cljs.core.nth.call(null, vec__17093__17094, 1, null);
  var pattern__17097 = cljs.core.nth.call(null, vec__17093__17094, 2, null);
  return new RegExp(pattern__17097, flags__17096)
};
cljs.core.pr_sequential = function pr_sequential(print_one, begin, sep, end, opts, coll) {
  return cljs.core.concat.call(null, cljs.core.PersistentVector.fromArray([begin], true), cljs.core.flatten1.call(null, cljs.core.interpose.call(null, cljs.core.PersistentVector.fromArray([sep], true), cljs.core.map.call(null, function(p1__17087_SHARP_) {
    return print_one.call(null, p1__17087_SHARP_, opts)
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
          var and__3822__auto____17107 = cljs.core._lookup.call(null, opts, "\ufdd0'meta", null);
          if(cljs.core.truth_(and__3822__auto____17107)) {
            var and__3822__auto____17111 = function() {
              var G__17108__17109 = obj;
              if(G__17108__17109) {
                if(function() {
                  var or__3824__auto____17110 = G__17108__17109.cljs$lang$protocol_mask$partition0$ & 131072;
                  if(or__3824__auto____17110) {
                    return or__3824__auto____17110
                  }else {
                    return G__17108__17109.cljs$core$IMeta$
                  }
                }()) {
                  return true
                }else {
                  if(!G__17108__17109.cljs$lang$protocol_mask$partition0$) {
                    return cljs.core.type_satisfies_.call(null, cljs.core.IMeta, G__17108__17109)
                  }else {
                    return false
                  }
                }
              }else {
                return cljs.core.type_satisfies_.call(null, cljs.core.IMeta, G__17108__17109)
              }
            }();
            if(cljs.core.truth_(and__3822__auto____17111)) {
              return cljs.core.meta.call(null, obj)
            }else {
              return and__3822__auto____17111
            }
          }else {
            return and__3822__auto____17107
          }
        }()) ? cljs.core.concat.call(null, cljs.core.PersistentVector.fromArray(["^"], true), pr_seq.call(null, cljs.core.meta.call(null, obj), opts), cljs.core.PersistentVector.fromArray([" "], true)) : null, function() {
          var and__3822__auto____17112 = !(obj == null);
          if(and__3822__auto____17112) {
            return obj.cljs$lang$type
          }else {
            return and__3822__auto____17112
          }
        }() ? obj.cljs$lang$ctorPrSeq(obj) : function() {
          var G__17113__17114 = obj;
          if(G__17113__17114) {
            if(function() {
              var or__3824__auto____17115 = G__17113__17114.cljs$lang$protocol_mask$partition0$ & 536870912;
              if(or__3824__auto____17115) {
                return or__3824__auto____17115
              }else {
                return G__17113__17114.cljs$core$IPrintable$
              }
            }()) {
              return true
            }else {
              if(!G__17113__17114.cljs$lang$protocol_mask$partition0$) {
                return cljs.core.type_satisfies_.call(null, cljs.core.IPrintable, G__17113__17114)
              }else {
                return false
              }
            }
          }else {
            return cljs.core.type_satisfies_.call(null, cljs.core.IPrintable, G__17113__17114)
          }
        }() ? cljs.core._pr_seq.call(null, obj, opts) : cljs.core.truth_(cljs.core.regexp_QMARK_.call(null, obj)) ? cljs.core.list.call(null, '#"', obj.source, '"') : "\ufdd0'else" ? cljs.core.list.call(null, "#<", [cljs.core.str(obj)].join(""), ">") : null)
      }else {
        return null
      }
    }
  }
};
cljs.core.pr_sb = function pr_sb(objs, opts) {
  var sb__17135 = new goog.string.StringBuffer;
  var G__17136__17137 = cljs.core.seq.call(null, cljs.core.pr_seq.call(null, cljs.core.first.call(null, objs), opts));
  if(G__17136__17137) {
    var string__17138 = cljs.core.first.call(null, G__17136__17137);
    var G__17136__17139 = G__17136__17137;
    while(true) {
      sb__17135.append(string__17138);
      var temp__3974__auto____17140 = cljs.core.next.call(null, G__17136__17139);
      if(temp__3974__auto____17140) {
        var G__17136__17141 = temp__3974__auto____17140;
        var G__17154 = cljs.core.first.call(null, G__17136__17141);
        var G__17155 = G__17136__17141;
        string__17138 = G__17154;
        G__17136__17139 = G__17155;
        continue
      }else {
      }
      break
    }
  }else {
  }
  var G__17142__17143 = cljs.core.seq.call(null, cljs.core.next.call(null, objs));
  if(G__17142__17143) {
    var obj__17144 = cljs.core.first.call(null, G__17142__17143);
    var G__17142__17145 = G__17142__17143;
    while(true) {
      sb__17135.append(" ");
      var G__17146__17147 = cljs.core.seq.call(null, cljs.core.pr_seq.call(null, obj__17144, opts));
      if(G__17146__17147) {
        var string__17148 = cljs.core.first.call(null, G__17146__17147);
        var G__17146__17149 = G__17146__17147;
        while(true) {
          sb__17135.append(string__17148);
          var temp__3974__auto____17150 = cljs.core.next.call(null, G__17146__17149);
          if(temp__3974__auto____17150) {
            var G__17146__17151 = temp__3974__auto____17150;
            var G__17156 = cljs.core.first.call(null, G__17146__17151);
            var G__17157 = G__17146__17151;
            string__17148 = G__17156;
            G__17146__17149 = G__17157;
            continue
          }else {
          }
          break
        }
      }else {
      }
      var temp__3974__auto____17152 = cljs.core.next.call(null, G__17142__17145);
      if(temp__3974__auto____17152) {
        var G__17142__17153 = temp__3974__auto____17152;
        var G__17158 = cljs.core.first.call(null, G__17142__17153);
        var G__17159 = G__17142__17153;
        obj__17144 = G__17158;
        G__17142__17145 = G__17159;
        continue
      }else {
      }
      break
    }
  }else {
  }
  return sb__17135
};
cljs.core.pr_str_with_opts = function pr_str_with_opts(objs, opts) {
  return[cljs.core.str(cljs.core.pr_sb.call(null, objs, opts))].join("")
};
cljs.core.prn_str_with_opts = function prn_str_with_opts(objs, opts) {
  var sb__17161 = cljs.core.pr_sb.call(null, objs, opts);
  sb__17161.append("\n");
  return[cljs.core.str(sb__17161)].join("")
};
cljs.core.pr_with_opts = function pr_with_opts(objs, opts) {
  var G__17180__17181 = cljs.core.seq.call(null, cljs.core.pr_seq.call(null, cljs.core.first.call(null, objs), opts));
  if(G__17180__17181) {
    var string__17182 = cljs.core.first.call(null, G__17180__17181);
    var G__17180__17183 = G__17180__17181;
    while(true) {
      cljs.core.string_print.call(null, string__17182);
      var temp__3974__auto____17184 = cljs.core.next.call(null, G__17180__17183);
      if(temp__3974__auto____17184) {
        var G__17180__17185 = temp__3974__auto____17184;
        var G__17198 = cljs.core.first.call(null, G__17180__17185);
        var G__17199 = G__17180__17185;
        string__17182 = G__17198;
        G__17180__17183 = G__17199;
        continue
      }else {
      }
      break
    }
  }else {
  }
  var G__17186__17187 = cljs.core.seq.call(null, cljs.core.next.call(null, objs));
  if(G__17186__17187) {
    var obj__17188 = cljs.core.first.call(null, G__17186__17187);
    var G__17186__17189 = G__17186__17187;
    while(true) {
      cljs.core.string_print.call(null, " ");
      var G__17190__17191 = cljs.core.seq.call(null, cljs.core.pr_seq.call(null, obj__17188, opts));
      if(G__17190__17191) {
        var string__17192 = cljs.core.first.call(null, G__17190__17191);
        var G__17190__17193 = G__17190__17191;
        while(true) {
          cljs.core.string_print.call(null, string__17192);
          var temp__3974__auto____17194 = cljs.core.next.call(null, G__17190__17193);
          if(temp__3974__auto____17194) {
            var G__17190__17195 = temp__3974__auto____17194;
            var G__17200 = cljs.core.first.call(null, G__17190__17195);
            var G__17201 = G__17190__17195;
            string__17192 = G__17200;
            G__17190__17193 = G__17201;
            continue
          }else {
          }
          break
        }
      }else {
      }
      var temp__3974__auto____17196 = cljs.core.next.call(null, G__17186__17189);
      if(temp__3974__auto____17196) {
        var G__17186__17197 = temp__3974__auto____17196;
        var G__17202 = cljs.core.first.call(null, G__17186__17197);
        var G__17203 = G__17186__17197;
        obj__17188 = G__17202;
        G__17186__17189 = G__17203;
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
  pr_str.cljs$lang$applyTo = function(arglist__17204) {
    var objs = cljs.core.seq(arglist__17204);
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
  prn_str.cljs$lang$applyTo = function(arglist__17205) {
    var objs = cljs.core.seq(arglist__17205);
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
  pr.cljs$lang$applyTo = function(arglist__17206) {
    var objs = cljs.core.seq(arglist__17206);
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
  cljs_core_print.cljs$lang$applyTo = function(arglist__17207) {
    var objs = cljs.core.seq(arglist__17207);
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
  print_str.cljs$lang$applyTo = function(arglist__17208) {
    var objs = cljs.core.seq(arglist__17208);
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
  println.cljs$lang$applyTo = function(arglist__17209) {
    var objs = cljs.core.seq(arglist__17209);
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
  println_str.cljs$lang$applyTo = function(arglist__17210) {
    var objs = cljs.core.seq(arglist__17210);
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
  prn.cljs$lang$applyTo = function(arglist__17211) {
    var objs = cljs.core.seq(arglist__17211);
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
  printf.cljs$lang$applyTo = function(arglist__17212) {
    var fmt = cljs.core.first(arglist__17212);
    var args = cljs.core.rest(arglist__17212);
    return printf__delegate(fmt, args)
  };
  printf.cljs$lang$arity$variadic = printf__delegate;
  return printf
}();
cljs.core.HashMap.prototype.cljs$core$IPrintable$ = true;
cljs.core.HashMap.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  var pr_pair__17213 = function(keyval) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential.call(null, pr_pair__17213, "{", ", ", "}", opts, coll)
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
  var pr_pair__17214 = function(keyval) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential.call(null, pr_pair__17214, "{", ", ", "}", opts, coll)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentArrayMap.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  var pr_pair__17215 = function(keyval) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential.call(null, pr_pair__17215, "{", ", ", "}", opts, coll)
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
      var temp__3974__auto____17216 = cljs.core.namespace.call(null, obj);
      if(cljs.core.truth_(temp__3974__auto____17216)) {
        var nspc__17217 = temp__3974__auto____17216;
        return[cljs.core.str(nspc__17217), cljs.core.str("/")].join("")
      }else {
        return null
      }
    }()), cljs.core.str(cljs.core.name.call(null, obj))].join(""))
  }else {
    if(cljs.core.symbol_QMARK_.call(null, obj)) {
      return cljs.core.list.call(null, [cljs.core.str(function() {
        var temp__3974__auto____17218 = cljs.core.namespace.call(null, obj);
        if(cljs.core.truth_(temp__3974__auto____17218)) {
          var nspc__17219 = temp__3974__auto____17218;
          return[cljs.core.str(nspc__17219), cljs.core.str("/")].join("")
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
  var pr_pair__17220 = function(keyval) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential.call(null, pr_pair__17220, "{", ", ", "}", opts, coll)
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
  var normalize__17222 = function(n, len) {
    var ns__17221 = [cljs.core.str(n)].join("");
    while(true) {
      if(cljs.core.count.call(null, ns__17221) < len) {
        var G__17224 = [cljs.core.str("0"), cljs.core.str(ns__17221)].join("");
        ns__17221 = G__17224;
        continue
      }else {
        return ns__17221
      }
      break
    }
  };
  return cljs.core.list.call(null, [cljs.core.str('#inst "'), cljs.core.str(d.getUTCFullYear()), cljs.core.str("-"), cljs.core.str(normalize__17222.call(null, d.getUTCMonth() + 1, 2)), cljs.core.str("-"), cljs.core.str(normalize__17222.call(null, d.getUTCDate(), 2)), cljs.core.str("T"), cljs.core.str(normalize__17222.call(null, d.getUTCHours(), 2)), cljs.core.str(":"), cljs.core.str(normalize__17222.call(null, d.getUTCMinutes(), 2)), cljs.core.str(":"), cljs.core.str(normalize__17222.call(null, d.getUTCSeconds(), 
  2)), cljs.core.str("."), cljs.core.str(normalize__17222.call(null, d.getUTCMilliseconds(), 3)), cljs.core.str("-"), cljs.core.str('00:00"')].join(""))
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
  var pr_pair__17223 = function(keyval) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential.call(null, pr_pair__17223, "{", ", ", "}", opts, coll)
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
  var this__17225 = this;
  return goog.getUid(this$)
};
cljs.core.Atom.prototype.cljs$core$IWatchable$_notify_watches$arity$3 = function(this$, oldval, newval) {
  var this__17226 = this;
  var G__17227__17228 = cljs.core.seq.call(null, this__17226.watches);
  if(G__17227__17228) {
    var G__17230__17232 = cljs.core.first.call(null, G__17227__17228);
    var vec__17231__17233 = G__17230__17232;
    var key__17234 = cljs.core.nth.call(null, vec__17231__17233, 0, null);
    var f__17235 = cljs.core.nth.call(null, vec__17231__17233, 1, null);
    var G__17227__17236 = G__17227__17228;
    var G__17230__17237 = G__17230__17232;
    var G__17227__17238 = G__17227__17236;
    while(true) {
      var vec__17239__17240 = G__17230__17237;
      var key__17241 = cljs.core.nth.call(null, vec__17239__17240, 0, null);
      var f__17242 = cljs.core.nth.call(null, vec__17239__17240, 1, null);
      var G__17227__17243 = G__17227__17238;
      f__17242.call(null, key__17241, this$, oldval, newval);
      var temp__3974__auto____17244 = cljs.core.next.call(null, G__17227__17243);
      if(temp__3974__auto____17244) {
        var G__17227__17245 = temp__3974__auto____17244;
        var G__17252 = cljs.core.first.call(null, G__17227__17245);
        var G__17253 = G__17227__17245;
        G__17230__17237 = G__17252;
        G__17227__17238 = G__17253;
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
  var this__17246 = this;
  return this$.watches = cljs.core.assoc.call(null, this__17246.watches, key, f)
};
cljs.core.Atom.prototype.cljs$core$IWatchable$_remove_watch$arity$2 = function(this$, key) {
  var this__17247 = this;
  return this$.watches = cljs.core.dissoc.call(null, this__17247.watches, key)
};
cljs.core.Atom.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(a, opts) {
  var this__17248 = this;
  return cljs.core.concat.call(null, cljs.core.PersistentVector.fromArray(["#<Atom: "], true), cljs.core._pr_seq.call(null, this__17248.state, opts), ">")
};
cljs.core.Atom.prototype.cljs$core$IMeta$_meta$arity$1 = function(_) {
  var this__17249 = this;
  return this__17249.meta
};
cljs.core.Atom.prototype.cljs$core$IDeref$_deref$arity$1 = function(_) {
  var this__17250 = this;
  return this__17250.state
};
cljs.core.Atom.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(o, other) {
  var this__17251 = this;
  return o === other
};
cljs.core.Atom;
cljs.core.atom = function() {
  var atom = null;
  var atom__1 = function(x) {
    return new cljs.core.Atom(x, null, null, null)
  };
  var atom__2 = function() {
    var G__17265__delegate = function(x, p__17254) {
      var map__17260__17261 = p__17254;
      var map__17260__17262 = cljs.core.seq_QMARK_.call(null, map__17260__17261) ? cljs.core.apply.call(null, cljs.core.hash_map, map__17260__17261) : map__17260__17261;
      var validator__17263 = cljs.core._lookup.call(null, map__17260__17262, "\ufdd0'validator", null);
      var meta__17264 = cljs.core._lookup.call(null, map__17260__17262, "\ufdd0'meta", null);
      return new cljs.core.Atom(x, meta__17264, validator__17263, null)
    };
    var G__17265 = function(x, var_args) {
      var p__17254 = null;
      if(goog.isDef(var_args)) {
        p__17254 = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__17265__delegate.call(this, x, p__17254)
    };
    G__17265.cljs$lang$maxFixedArity = 1;
    G__17265.cljs$lang$applyTo = function(arglist__17266) {
      var x = cljs.core.first(arglist__17266);
      var p__17254 = cljs.core.rest(arglist__17266);
      return G__17265__delegate(x, p__17254)
    };
    G__17265.cljs$lang$arity$variadic = G__17265__delegate;
    return G__17265
  }();
  atom = function(x, var_args) {
    var p__17254 = var_args;
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
  var temp__3974__auto____17270 = a.validator;
  if(cljs.core.truth_(temp__3974__auto____17270)) {
    var validate__17271 = temp__3974__auto____17270;
    if(cljs.core.truth_(validate__17271.call(null, new_value))) {
    }else {
      throw new Error([cljs.core.str("Assert failed: "), cljs.core.str("Validator rejected reference state"), cljs.core.str("\n"), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'validate", "\ufdd1'new-value"), cljs.core.hash_map("\ufdd0'line", 6440))))].join(""));
    }
  }else {
  }
  var old_value__17272 = a.state;
  a.state = new_value;
  cljs.core._notify_watches.call(null, a, old_value__17272, new_value);
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
    var G__17273__delegate = function(a, f, x, y, z, more) {
      return cljs.core.reset_BANG_.call(null, a, cljs.core.apply.call(null, f, a.state, x, y, z, more))
    };
    var G__17273 = function(a, f, x, y, z, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 5), 0)
      }
      return G__17273__delegate.call(this, a, f, x, y, z, more)
    };
    G__17273.cljs$lang$maxFixedArity = 5;
    G__17273.cljs$lang$applyTo = function(arglist__17274) {
      var a = cljs.core.first(arglist__17274);
      var f = cljs.core.first(cljs.core.next(arglist__17274));
      var x = cljs.core.first(cljs.core.next(cljs.core.next(arglist__17274)));
      var y = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__17274))));
      var z = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(cljs.core.next(arglist__17274)))));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(cljs.core.next(arglist__17274)))));
      return G__17273__delegate(a, f, x, y, z, more)
    };
    G__17273.cljs$lang$arity$variadic = G__17273__delegate;
    return G__17273
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
  alter_meta_BANG_.cljs$lang$applyTo = function(arglist__17275) {
    var iref = cljs.core.first(arglist__17275);
    var f = cljs.core.first(cljs.core.next(arglist__17275));
    var args = cljs.core.rest(cljs.core.next(arglist__17275));
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
  var this__17276 = this;
  return(new cljs.core.Keyword("\ufdd0'done")).call(null, cljs.core.deref.call(null, this__17276.state))
};
cljs.core.Delay.prototype.cljs$core$IDeref$_deref$arity$1 = function(_) {
  var this__17277 = this;
  return(new cljs.core.Keyword("\ufdd0'value")).call(null, cljs.core.swap_BANG_.call(null, this__17277.state, function(p__17278) {
    var map__17279__17280 = p__17278;
    var map__17279__17281 = cljs.core.seq_QMARK_.call(null, map__17279__17280) ? cljs.core.apply.call(null, cljs.core.hash_map, map__17279__17280) : map__17279__17280;
    var curr_state__17282 = map__17279__17281;
    var done__17283 = cljs.core._lookup.call(null, map__17279__17281, "\ufdd0'done", null);
    if(cljs.core.truth_(done__17283)) {
      return curr_state__17282
    }else {
      return cljs.core.ObjMap.fromObject(["\ufdd0'done", "\ufdd0'value"], {"\ufdd0'done":true, "\ufdd0'value":this__17277.f.call(null)})
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
    var map__17304__17305 = options;
    var map__17304__17306 = cljs.core.seq_QMARK_.call(null, map__17304__17305) ? cljs.core.apply.call(null, cljs.core.hash_map, map__17304__17305) : map__17304__17305;
    var keywordize_keys__17307 = cljs.core._lookup.call(null, map__17304__17306, "\ufdd0'keywordize-keys", null);
    var keyfn__17308 = cljs.core.truth_(keywordize_keys__17307) ? cljs.core.keyword : cljs.core.str;
    var f__17323 = function thisfn(x) {
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
                var iter__2462__auto____17322 = function iter__17316(s__17317) {
                  return new cljs.core.LazySeq(null, false, function() {
                    var s__17317__17320 = s__17317;
                    while(true) {
                      if(cljs.core.seq.call(null, s__17317__17320)) {
                        var k__17321 = cljs.core.first.call(null, s__17317__17320);
                        return cljs.core.cons.call(null, cljs.core.PersistentVector.fromArray([keyfn__17308.call(null, k__17321), thisfn.call(null, x[k__17321])], true), iter__17316.call(null, cljs.core.rest.call(null, s__17317__17320)))
                      }else {
                        return null
                      }
                      break
                    }
                  }, null)
                };
                return iter__2462__auto____17322.call(null, cljs.core.js_keys.call(null, x))
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
    return f__17323.call(null, x)
  };
  var js__GT_clj = function(x, var_args) {
    var options = null;
    if(goog.isDef(var_args)) {
      options = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return js__GT_clj__delegate.call(this, x, options)
  };
  js__GT_clj.cljs$lang$maxFixedArity = 1;
  js__GT_clj.cljs$lang$applyTo = function(arglist__17324) {
    var x = cljs.core.first(arglist__17324);
    var options = cljs.core.rest(arglist__17324);
    return js__GT_clj__delegate(x, options)
  };
  js__GT_clj.cljs$lang$arity$variadic = js__GT_clj__delegate;
  return js__GT_clj
}();
cljs.core.memoize = function memoize(f) {
  var mem__17329 = cljs.core.atom.call(null, cljs.core.ObjMap.EMPTY);
  return function() {
    var G__17333__delegate = function(args) {
      var temp__3971__auto____17330 = cljs.core._lookup.call(null, cljs.core.deref.call(null, mem__17329), args, null);
      if(cljs.core.truth_(temp__3971__auto____17330)) {
        var v__17331 = temp__3971__auto____17330;
        return v__17331
      }else {
        var ret__17332 = cljs.core.apply.call(null, f, args);
        cljs.core.swap_BANG_.call(null, mem__17329, cljs.core.assoc, args, ret__17332);
        return ret__17332
      }
    };
    var G__17333 = function(var_args) {
      var args = null;
      if(goog.isDef(var_args)) {
        args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
      }
      return G__17333__delegate.call(this, args)
    };
    G__17333.cljs$lang$maxFixedArity = 0;
    G__17333.cljs$lang$applyTo = function(arglist__17334) {
      var args = cljs.core.seq(arglist__17334);
      return G__17333__delegate(args)
    };
    G__17333.cljs$lang$arity$variadic = G__17333__delegate;
    return G__17333
  }()
};
cljs.core.trampoline = function() {
  var trampoline = null;
  var trampoline__1 = function(f) {
    while(true) {
      var ret__17336 = f.call(null);
      if(cljs.core.fn_QMARK_.call(null, ret__17336)) {
        var G__17337 = ret__17336;
        f = G__17337;
        continue
      }else {
        return ret__17336
      }
      break
    }
  };
  var trampoline__2 = function() {
    var G__17338__delegate = function(f, args) {
      return trampoline.call(null, function() {
        return cljs.core.apply.call(null, f, args)
      })
    };
    var G__17338 = function(f, var_args) {
      var args = null;
      if(goog.isDef(var_args)) {
        args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__17338__delegate.call(this, f, args)
    };
    G__17338.cljs$lang$maxFixedArity = 1;
    G__17338.cljs$lang$applyTo = function(arglist__17339) {
      var f = cljs.core.first(arglist__17339);
      var args = cljs.core.rest(arglist__17339);
      return G__17338__delegate(f, args)
    };
    G__17338.cljs$lang$arity$variadic = G__17338__delegate;
    return G__17338
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
    var k__17341 = f.call(null, x);
    return cljs.core.assoc.call(null, ret, k__17341, cljs.core.conj.call(null, cljs.core._lookup.call(null, ret, k__17341, cljs.core.PersistentVector.EMPTY), x))
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
    var or__3824__auto____17350 = cljs.core._EQ_.call(null, child, parent);
    if(or__3824__auto____17350) {
      return or__3824__auto____17350
    }else {
      var or__3824__auto____17351 = cljs.core.contains_QMARK_.call(null, (new cljs.core.Keyword("\ufdd0'ancestors")).call(null, h).call(null, child), parent);
      if(or__3824__auto____17351) {
        return or__3824__auto____17351
      }else {
        var and__3822__auto____17352 = cljs.core.vector_QMARK_.call(null, parent);
        if(and__3822__auto____17352) {
          var and__3822__auto____17353 = cljs.core.vector_QMARK_.call(null, child);
          if(and__3822__auto____17353) {
            var and__3822__auto____17354 = cljs.core.count.call(null, parent) === cljs.core.count.call(null, child);
            if(and__3822__auto____17354) {
              var ret__17355 = true;
              var i__17356 = 0;
              while(true) {
                if(function() {
                  var or__3824__auto____17357 = cljs.core.not.call(null, ret__17355);
                  if(or__3824__auto____17357) {
                    return or__3824__auto____17357
                  }else {
                    return i__17356 === cljs.core.count.call(null, parent)
                  }
                }()) {
                  return ret__17355
                }else {
                  var G__17358 = isa_QMARK_.call(null, h, child.call(null, i__17356), parent.call(null, i__17356));
                  var G__17359 = i__17356 + 1;
                  ret__17355 = G__17358;
                  i__17356 = G__17359;
                  continue
                }
                break
              }
            }else {
              return and__3822__auto____17354
            }
          }else {
            return and__3822__auto____17353
          }
        }else {
          return and__3822__auto____17352
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
    var tp__17368 = (new cljs.core.Keyword("\ufdd0'parents")).call(null, h);
    var td__17369 = (new cljs.core.Keyword("\ufdd0'descendants")).call(null, h);
    var ta__17370 = (new cljs.core.Keyword("\ufdd0'ancestors")).call(null, h);
    var tf__17371 = function(m, source, sources, target, targets) {
      return cljs.core.reduce.call(null, function(ret, k) {
        return cljs.core.assoc.call(null, ret, k, cljs.core.reduce.call(null, cljs.core.conj, cljs.core._lookup.call(null, targets, k, cljs.core.PersistentHashSet.EMPTY), cljs.core.cons.call(null, target, targets.call(null, target))))
      }, m, cljs.core.cons.call(null, source, sources.call(null, source)))
    };
    var or__3824__auto____17372 = cljs.core.contains_QMARK_.call(null, tp__17368.call(null, tag), parent) ? null : function() {
      if(cljs.core.contains_QMARK_.call(null, ta__17370.call(null, tag), parent)) {
        throw new Error([cljs.core.str(tag), cljs.core.str("already has"), cljs.core.str(parent), cljs.core.str("as ancestor")].join(""));
      }else {
      }
      if(cljs.core.contains_QMARK_.call(null, ta__17370.call(null, parent), tag)) {
        throw new Error([cljs.core.str("Cyclic derivation:"), cljs.core.str(parent), cljs.core.str("has"), cljs.core.str(tag), cljs.core.str("as ancestor")].join(""));
      }else {
      }
      return cljs.core.ObjMap.fromObject(["\ufdd0'parents", "\ufdd0'ancestors", "\ufdd0'descendants"], {"\ufdd0'parents":cljs.core.assoc.call(null, (new cljs.core.Keyword("\ufdd0'parents")).call(null, h), tag, cljs.core.conj.call(null, cljs.core._lookup.call(null, tp__17368, tag, cljs.core.PersistentHashSet.EMPTY), parent)), "\ufdd0'ancestors":tf__17371.call(null, (new cljs.core.Keyword("\ufdd0'ancestors")).call(null, h), tag, td__17369, parent, ta__17370), "\ufdd0'descendants":tf__17371.call(null, 
      (new cljs.core.Keyword("\ufdd0'descendants")).call(null, h), parent, ta__17370, tag, td__17369)})
    }();
    if(cljs.core.truth_(or__3824__auto____17372)) {
      return or__3824__auto____17372
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
    var parentMap__17377 = (new cljs.core.Keyword("\ufdd0'parents")).call(null, h);
    var childsParents__17378 = cljs.core.truth_(parentMap__17377.call(null, tag)) ? cljs.core.disj.call(null, parentMap__17377.call(null, tag), parent) : cljs.core.PersistentHashSet.EMPTY;
    var newParents__17379 = cljs.core.truth_(cljs.core.not_empty.call(null, childsParents__17378)) ? cljs.core.assoc.call(null, parentMap__17377, tag, childsParents__17378) : cljs.core.dissoc.call(null, parentMap__17377, tag);
    var deriv_seq__17380 = cljs.core.flatten.call(null, cljs.core.map.call(null, function(p1__17360_SHARP_) {
      return cljs.core.cons.call(null, cljs.core.first.call(null, p1__17360_SHARP_), cljs.core.interpose.call(null, cljs.core.first.call(null, p1__17360_SHARP_), cljs.core.second.call(null, p1__17360_SHARP_)))
    }, cljs.core.seq.call(null, newParents__17379)));
    if(cljs.core.contains_QMARK_.call(null, parentMap__17377.call(null, tag), parent)) {
      return cljs.core.reduce.call(null, function(p1__17361_SHARP_, p2__17362_SHARP_) {
        return cljs.core.apply.call(null, cljs.core.derive, p1__17361_SHARP_, p2__17362_SHARP_)
      }, cljs.core.make_hierarchy.call(null), cljs.core.partition.call(null, 2, deriv_seq__17380))
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
  var xprefs__17388 = cljs.core.deref.call(null, prefer_table).call(null, x);
  var or__3824__auto____17390 = cljs.core.truth_(function() {
    var and__3822__auto____17389 = xprefs__17388;
    if(cljs.core.truth_(and__3822__auto____17389)) {
      return xprefs__17388.call(null, y)
    }else {
      return and__3822__auto____17389
    }
  }()) ? true : null;
  if(cljs.core.truth_(or__3824__auto____17390)) {
    return or__3824__auto____17390
  }else {
    var or__3824__auto____17392 = function() {
      var ps__17391 = cljs.core.parents.call(null, y);
      while(true) {
        if(cljs.core.count.call(null, ps__17391) > 0) {
          if(cljs.core.truth_(prefers_STAR_.call(null, x, cljs.core.first.call(null, ps__17391), prefer_table))) {
          }else {
          }
          var G__17395 = cljs.core.rest.call(null, ps__17391);
          ps__17391 = G__17395;
          continue
        }else {
          return null
        }
        break
      }
    }();
    if(cljs.core.truth_(or__3824__auto____17392)) {
      return or__3824__auto____17392
    }else {
      var or__3824__auto____17394 = function() {
        var ps__17393 = cljs.core.parents.call(null, x);
        while(true) {
          if(cljs.core.count.call(null, ps__17393) > 0) {
            if(cljs.core.truth_(prefers_STAR_.call(null, cljs.core.first.call(null, ps__17393), y, prefer_table))) {
            }else {
            }
            var G__17396 = cljs.core.rest.call(null, ps__17393);
            ps__17393 = G__17396;
            continue
          }else {
            return null
          }
          break
        }
      }();
      if(cljs.core.truth_(or__3824__auto____17394)) {
        return or__3824__auto____17394
      }else {
        return false
      }
    }
  }
};
cljs.core.dominates = function dominates(x, y, prefer_table) {
  var or__3824__auto____17398 = cljs.core.prefers_STAR_.call(null, x, y, prefer_table);
  if(cljs.core.truth_(or__3824__auto____17398)) {
    return or__3824__auto____17398
  }else {
    return cljs.core.isa_QMARK_.call(null, x, y)
  }
};
cljs.core.find_and_cache_best_method = function find_and_cache_best_method(name, dispatch_val, hierarchy, method_table, prefer_table, method_cache, cached_hierarchy) {
  var best_entry__17416 = cljs.core.reduce.call(null, function(be, p__17408) {
    var vec__17409__17410 = p__17408;
    var k__17411 = cljs.core.nth.call(null, vec__17409__17410, 0, null);
    var ___17412 = cljs.core.nth.call(null, vec__17409__17410, 1, null);
    var e__17413 = vec__17409__17410;
    if(cljs.core.isa_QMARK_.call(null, dispatch_val, k__17411)) {
      var be2__17415 = cljs.core.truth_(function() {
        var or__3824__auto____17414 = be == null;
        if(or__3824__auto____17414) {
          return or__3824__auto____17414
        }else {
          return cljs.core.dominates.call(null, k__17411, cljs.core.first.call(null, be), prefer_table)
        }
      }()) ? e__17413 : be;
      if(cljs.core.truth_(cljs.core.dominates.call(null, cljs.core.first.call(null, be2__17415), k__17411, prefer_table))) {
      }else {
        throw new Error([cljs.core.str("Multiple methods in multimethod '"), cljs.core.str(name), cljs.core.str("' match dispatch value: "), cljs.core.str(dispatch_val), cljs.core.str(" -> "), cljs.core.str(k__17411), cljs.core.str(" and "), cljs.core.str(cljs.core.first.call(null, be2__17415)), cljs.core.str(", and neither is preferred")].join(""));
      }
      return be2__17415
    }else {
      return be
    }
  }, null, cljs.core.deref.call(null, method_table));
  if(cljs.core.truth_(best_entry__17416)) {
    if(cljs.core._EQ_.call(null, cljs.core.deref.call(null, cached_hierarchy), cljs.core.deref.call(null, hierarchy))) {
      cljs.core.swap_BANG_.call(null, method_cache, cljs.core.assoc, dispatch_val, cljs.core.second.call(null, best_entry__17416));
      return cljs.core.second.call(null, best_entry__17416)
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
    var and__3822__auto____17421 = mf;
    if(and__3822__auto____17421) {
      return mf.cljs$core$IMultiFn$_reset$arity$1
    }else {
      return and__3822__auto____17421
    }
  }()) {
    return mf.cljs$core$IMultiFn$_reset$arity$1(mf)
  }else {
    var x__2363__auto____17422 = mf == null ? null : mf;
    return function() {
      var or__3824__auto____17423 = cljs.core._reset[goog.typeOf(x__2363__auto____17422)];
      if(or__3824__auto____17423) {
        return or__3824__auto____17423
      }else {
        var or__3824__auto____17424 = cljs.core._reset["_"];
        if(or__3824__auto____17424) {
          return or__3824__auto____17424
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-reset", mf);
        }
      }
    }().call(null, mf)
  }
};
cljs.core._add_method = function _add_method(mf, dispatch_val, method) {
  if(function() {
    var and__3822__auto____17429 = mf;
    if(and__3822__auto____17429) {
      return mf.cljs$core$IMultiFn$_add_method$arity$3
    }else {
      return and__3822__auto____17429
    }
  }()) {
    return mf.cljs$core$IMultiFn$_add_method$arity$3(mf, dispatch_val, method)
  }else {
    var x__2363__auto____17430 = mf == null ? null : mf;
    return function() {
      var or__3824__auto____17431 = cljs.core._add_method[goog.typeOf(x__2363__auto____17430)];
      if(or__3824__auto____17431) {
        return or__3824__auto____17431
      }else {
        var or__3824__auto____17432 = cljs.core._add_method["_"];
        if(or__3824__auto____17432) {
          return or__3824__auto____17432
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-add-method", mf);
        }
      }
    }().call(null, mf, dispatch_val, method)
  }
};
cljs.core._remove_method = function _remove_method(mf, dispatch_val) {
  if(function() {
    var and__3822__auto____17437 = mf;
    if(and__3822__auto____17437) {
      return mf.cljs$core$IMultiFn$_remove_method$arity$2
    }else {
      return and__3822__auto____17437
    }
  }()) {
    return mf.cljs$core$IMultiFn$_remove_method$arity$2(mf, dispatch_val)
  }else {
    var x__2363__auto____17438 = mf == null ? null : mf;
    return function() {
      var or__3824__auto____17439 = cljs.core._remove_method[goog.typeOf(x__2363__auto____17438)];
      if(or__3824__auto____17439) {
        return or__3824__auto____17439
      }else {
        var or__3824__auto____17440 = cljs.core._remove_method["_"];
        if(or__3824__auto____17440) {
          return or__3824__auto____17440
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-remove-method", mf);
        }
      }
    }().call(null, mf, dispatch_val)
  }
};
cljs.core._prefer_method = function _prefer_method(mf, dispatch_val, dispatch_val_y) {
  if(function() {
    var and__3822__auto____17445 = mf;
    if(and__3822__auto____17445) {
      return mf.cljs$core$IMultiFn$_prefer_method$arity$3
    }else {
      return and__3822__auto____17445
    }
  }()) {
    return mf.cljs$core$IMultiFn$_prefer_method$arity$3(mf, dispatch_val, dispatch_val_y)
  }else {
    var x__2363__auto____17446 = mf == null ? null : mf;
    return function() {
      var or__3824__auto____17447 = cljs.core._prefer_method[goog.typeOf(x__2363__auto____17446)];
      if(or__3824__auto____17447) {
        return or__3824__auto____17447
      }else {
        var or__3824__auto____17448 = cljs.core._prefer_method["_"];
        if(or__3824__auto____17448) {
          return or__3824__auto____17448
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-prefer-method", mf);
        }
      }
    }().call(null, mf, dispatch_val, dispatch_val_y)
  }
};
cljs.core._get_method = function _get_method(mf, dispatch_val) {
  if(function() {
    var and__3822__auto____17453 = mf;
    if(and__3822__auto____17453) {
      return mf.cljs$core$IMultiFn$_get_method$arity$2
    }else {
      return and__3822__auto____17453
    }
  }()) {
    return mf.cljs$core$IMultiFn$_get_method$arity$2(mf, dispatch_val)
  }else {
    var x__2363__auto____17454 = mf == null ? null : mf;
    return function() {
      var or__3824__auto____17455 = cljs.core._get_method[goog.typeOf(x__2363__auto____17454)];
      if(or__3824__auto____17455) {
        return or__3824__auto____17455
      }else {
        var or__3824__auto____17456 = cljs.core._get_method["_"];
        if(or__3824__auto____17456) {
          return or__3824__auto____17456
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-get-method", mf);
        }
      }
    }().call(null, mf, dispatch_val)
  }
};
cljs.core._methods = function _methods(mf) {
  if(function() {
    var and__3822__auto____17461 = mf;
    if(and__3822__auto____17461) {
      return mf.cljs$core$IMultiFn$_methods$arity$1
    }else {
      return and__3822__auto____17461
    }
  }()) {
    return mf.cljs$core$IMultiFn$_methods$arity$1(mf)
  }else {
    var x__2363__auto____17462 = mf == null ? null : mf;
    return function() {
      var or__3824__auto____17463 = cljs.core._methods[goog.typeOf(x__2363__auto____17462)];
      if(or__3824__auto____17463) {
        return or__3824__auto____17463
      }else {
        var or__3824__auto____17464 = cljs.core._methods["_"];
        if(or__3824__auto____17464) {
          return or__3824__auto____17464
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-methods", mf);
        }
      }
    }().call(null, mf)
  }
};
cljs.core._prefers = function _prefers(mf) {
  if(function() {
    var and__3822__auto____17469 = mf;
    if(and__3822__auto____17469) {
      return mf.cljs$core$IMultiFn$_prefers$arity$1
    }else {
      return and__3822__auto____17469
    }
  }()) {
    return mf.cljs$core$IMultiFn$_prefers$arity$1(mf)
  }else {
    var x__2363__auto____17470 = mf == null ? null : mf;
    return function() {
      var or__3824__auto____17471 = cljs.core._prefers[goog.typeOf(x__2363__auto____17470)];
      if(or__3824__auto____17471) {
        return or__3824__auto____17471
      }else {
        var or__3824__auto____17472 = cljs.core._prefers["_"];
        if(or__3824__auto____17472) {
          return or__3824__auto____17472
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-prefers", mf);
        }
      }
    }().call(null, mf)
  }
};
cljs.core._dispatch = function _dispatch(mf, args) {
  if(function() {
    var and__3822__auto____17477 = mf;
    if(and__3822__auto____17477) {
      return mf.cljs$core$IMultiFn$_dispatch$arity$2
    }else {
      return and__3822__auto____17477
    }
  }()) {
    return mf.cljs$core$IMultiFn$_dispatch$arity$2(mf, args)
  }else {
    var x__2363__auto____17478 = mf == null ? null : mf;
    return function() {
      var or__3824__auto____17479 = cljs.core._dispatch[goog.typeOf(x__2363__auto____17478)];
      if(or__3824__auto____17479) {
        return or__3824__auto____17479
      }else {
        var or__3824__auto____17480 = cljs.core._dispatch["_"];
        if(or__3824__auto____17480) {
          return or__3824__auto____17480
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-dispatch", mf);
        }
      }
    }().call(null, mf, args)
  }
};
cljs.core.do_dispatch = function do_dispatch(mf, dispatch_fn, args) {
  var dispatch_val__17483 = cljs.core.apply.call(null, dispatch_fn, args);
  var target_fn__17484 = cljs.core._get_method.call(null, mf, dispatch_val__17483);
  if(cljs.core.truth_(target_fn__17484)) {
  }else {
    throw new Error([cljs.core.str("No method in multimethod '"), cljs.core.str(cljs.core.name), cljs.core.str("' for dispatch value: "), cljs.core.str(dispatch_val__17483)].join(""));
  }
  return cljs.core.apply.call(null, target_fn__17484, args)
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
  var this__17485 = this;
  return goog.getUid(this$)
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_reset$arity$1 = function(mf) {
  var this__17486 = this;
  cljs.core.swap_BANG_.call(null, this__17486.method_table, function(mf) {
    return cljs.core.ObjMap.EMPTY
  });
  cljs.core.swap_BANG_.call(null, this__17486.method_cache, function(mf) {
    return cljs.core.ObjMap.EMPTY
  });
  cljs.core.swap_BANG_.call(null, this__17486.prefer_table, function(mf) {
    return cljs.core.ObjMap.EMPTY
  });
  cljs.core.swap_BANG_.call(null, this__17486.cached_hierarchy, function(mf) {
    return null
  });
  return mf
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_add_method$arity$3 = function(mf, dispatch_val, method) {
  var this__17487 = this;
  cljs.core.swap_BANG_.call(null, this__17487.method_table, cljs.core.assoc, dispatch_val, method);
  cljs.core.reset_cache.call(null, this__17487.method_cache, this__17487.method_table, this__17487.cached_hierarchy, this__17487.hierarchy);
  return mf
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_remove_method$arity$2 = function(mf, dispatch_val) {
  var this__17488 = this;
  cljs.core.swap_BANG_.call(null, this__17488.method_table, cljs.core.dissoc, dispatch_val);
  cljs.core.reset_cache.call(null, this__17488.method_cache, this__17488.method_table, this__17488.cached_hierarchy, this__17488.hierarchy);
  return mf
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_get_method$arity$2 = function(mf, dispatch_val) {
  var this__17489 = this;
  if(cljs.core._EQ_.call(null, cljs.core.deref.call(null, this__17489.cached_hierarchy), cljs.core.deref.call(null, this__17489.hierarchy))) {
  }else {
    cljs.core.reset_cache.call(null, this__17489.method_cache, this__17489.method_table, this__17489.cached_hierarchy, this__17489.hierarchy)
  }
  var temp__3971__auto____17490 = cljs.core.deref.call(null, this__17489.method_cache).call(null, dispatch_val);
  if(cljs.core.truth_(temp__3971__auto____17490)) {
    var target_fn__17491 = temp__3971__auto____17490;
    return target_fn__17491
  }else {
    var temp__3971__auto____17492 = cljs.core.find_and_cache_best_method.call(null, this__17489.name, dispatch_val, this__17489.hierarchy, this__17489.method_table, this__17489.prefer_table, this__17489.method_cache, this__17489.cached_hierarchy);
    if(cljs.core.truth_(temp__3971__auto____17492)) {
      var target_fn__17493 = temp__3971__auto____17492;
      return target_fn__17493
    }else {
      return cljs.core.deref.call(null, this__17489.method_table).call(null, this__17489.default_dispatch_val)
    }
  }
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_prefer_method$arity$3 = function(mf, dispatch_val_x, dispatch_val_y) {
  var this__17494 = this;
  if(cljs.core.truth_(cljs.core.prefers_STAR_.call(null, dispatch_val_x, dispatch_val_y, this__17494.prefer_table))) {
    throw new Error([cljs.core.str("Preference conflict in multimethod '"), cljs.core.str(this__17494.name), cljs.core.str("': "), cljs.core.str(dispatch_val_y), cljs.core.str(" is already preferred to "), cljs.core.str(dispatch_val_x)].join(""));
  }else {
  }
  cljs.core.swap_BANG_.call(null, this__17494.prefer_table, function(old) {
    return cljs.core.assoc.call(null, old, dispatch_val_x, cljs.core.conj.call(null, cljs.core._lookup.call(null, old, dispatch_val_x, cljs.core.PersistentHashSet.EMPTY), dispatch_val_y))
  });
  return cljs.core.reset_cache.call(null, this__17494.method_cache, this__17494.method_table, this__17494.cached_hierarchy, this__17494.hierarchy)
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_methods$arity$1 = function(mf) {
  var this__17495 = this;
  return cljs.core.deref.call(null, this__17495.method_table)
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_prefers$arity$1 = function(mf) {
  var this__17496 = this;
  return cljs.core.deref.call(null, this__17496.prefer_table)
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_dispatch$arity$2 = function(mf, args) {
  var this__17497 = this;
  return cljs.core.do_dispatch.call(null, mf, this__17497.dispatch_fn, args)
};
cljs.core.MultiFn;
cljs.core.MultiFn.prototype.call = function() {
  var G__17499__delegate = function(_, args) {
    var self__17498 = this;
    return cljs.core._dispatch.call(null, self__17498, args)
  };
  var G__17499 = function(_, var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return G__17499__delegate.call(this, _, args)
  };
  G__17499.cljs$lang$maxFixedArity = 1;
  G__17499.cljs$lang$applyTo = function(arglist__17500) {
    var _ = cljs.core.first(arglist__17500);
    var args = cljs.core.rest(arglist__17500);
    return G__17499__delegate(_, args)
  };
  G__17499.cljs$lang$arity$variadic = G__17499__delegate;
  return G__17499
}();
cljs.core.MultiFn.prototype.apply = function(_, args) {
  var self__17501 = this;
  return cljs.core._dispatch.call(null, self__17501, args)
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
  var this__17502 = this;
  return goog.string.hashCode(cljs.core.pr_str.call(null, this$))
};
cljs.core.UUID.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(_17504, _) {
  var this__17503 = this;
  return cljs.core.list.call(null, [cljs.core.str('#uuid "'), cljs.core.str(this__17503.uuid), cljs.core.str('"')].join(""))
};
cljs.core.UUID.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(_, other) {
  var this__17505 = this;
  var and__3822__auto____17506 = cljs.core.instance_QMARK_.call(null, cljs.core.UUID, other);
  if(and__3822__auto____17506) {
    return this__17505.uuid === other.uuid
  }else {
    return and__3822__auto____17506
  }
};
cljs.core.UUID.prototype.toString = function() {
  var this__17507 = this;
  var this__17508 = this;
  return cljs.core.pr_str.call(null, this__17508)
};
cljs.core.UUID;
goog.provide("yapin.bar");
goog.require("cljs.core");
yapin.bar.form_field_search = cljs.core.atom.call(null, cljs.core.ObjMap.EMPTY);
yapin.bar.declare_page_function.call(null, yapin.bar.slide_page_in, cljs.core.PersistentVector.fromArray([cljs.core.name], true));
yapin.bar.form_field_search_handle_key_down = function form_field_search_handle_key_down(event) {
  return yapin.bar.slide_page_in.call(null, "test")
};
yapin.bar.full_screen = function full_screen() {
  window.self.moveTo(0, 0);
  return window.self.resizeTo(screen.availWidth, screen.availHeight)
};
goog.exportSymbol("yapin.bar.full_screen", yapin.bar.full_screen);
yapin.bar.open_window = function open_window() {
  return window.self.open("http://www.google.com", "_blank", "titlebar=0")
};
goog.exportSymbol("yapin.bar.open_window", yapin.bar.open_window);
