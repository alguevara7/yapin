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
  var x__6108 = x == null ? null : x;
  if(p[goog.typeOf(x__6108)]) {
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
    var G__6109__delegate = function(array, i, idxs) {
      return cljs.core.apply.call(null, aget, aget.call(null, array, i), idxs)
    };
    var G__6109 = function(array, i, var_args) {
      var idxs = null;
      if(goog.isDef(var_args)) {
        idxs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__6109__delegate.call(this, array, i, idxs)
    };
    G__6109.cljs$lang$maxFixedArity = 2;
    G__6109.cljs$lang$applyTo = function(arglist__6110) {
      var array = cljs.core.first(arglist__6110);
      var i = cljs.core.first(cljs.core.next(arglist__6110));
      var idxs = cljs.core.rest(cljs.core.next(arglist__6110));
      return G__6109__delegate(array, i, idxs)
    };
    G__6109.cljs$lang$arity$variadic = G__6109__delegate;
    return G__6109
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
      var and__3822__auto____6195 = this$;
      if(and__3822__auto____6195) {
        return this$.cljs$core$IFn$_invoke$arity$1
      }else {
        return and__3822__auto____6195
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$1(this$)
    }else {
      var x__2365__auto____6196 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6197 = cljs.core._invoke[goog.typeOf(x__2365__auto____6196)];
        if(or__3824__auto____6197) {
          return or__3824__auto____6197
        }else {
          var or__3824__auto____6198 = cljs.core._invoke["_"];
          if(or__3824__auto____6198) {
            return or__3824__auto____6198
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$)
    }
  };
  var _invoke__2 = function(this$, a) {
    if(function() {
      var and__3822__auto____6199 = this$;
      if(and__3822__auto____6199) {
        return this$.cljs$core$IFn$_invoke$arity$2
      }else {
        return and__3822__auto____6199
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$2(this$, a)
    }else {
      var x__2365__auto____6200 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6201 = cljs.core._invoke[goog.typeOf(x__2365__auto____6200)];
        if(or__3824__auto____6201) {
          return or__3824__auto____6201
        }else {
          var or__3824__auto____6202 = cljs.core._invoke["_"];
          if(or__3824__auto____6202) {
            return or__3824__auto____6202
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a)
    }
  };
  var _invoke__3 = function(this$, a, b) {
    if(function() {
      var and__3822__auto____6203 = this$;
      if(and__3822__auto____6203) {
        return this$.cljs$core$IFn$_invoke$arity$3
      }else {
        return and__3822__auto____6203
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$3(this$, a, b)
    }else {
      var x__2365__auto____6204 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6205 = cljs.core._invoke[goog.typeOf(x__2365__auto____6204)];
        if(or__3824__auto____6205) {
          return or__3824__auto____6205
        }else {
          var or__3824__auto____6206 = cljs.core._invoke["_"];
          if(or__3824__auto____6206) {
            return or__3824__auto____6206
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b)
    }
  };
  var _invoke__4 = function(this$, a, b, c) {
    if(function() {
      var and__3822__auto____6207 = this$;
      if(and__3822__auto____6207) {
        return this$.cljs$core$IFn$_invoke$arity$4
      }else {
        return and__3822__auto____6207
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$4(this$, a, b, c)
    }else {
      var x__2365__auto____6208 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6209 = cljs.core._invoke[goog.typeOf(x__2365__auto____6208)];
        if(or__3824__auto____6209) {
          return or__3824__auto____6209
        }else {
          var or__3824__auto____6210 = cljs.core._invoke["_"];
          if(or__3824__auto____6210) {
            return or__3824__auto____6210
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c)
    }
  };
  var _invoke__5 = function(this$, a, b, c, d) {
    if(function() {
      var and__3822__auto____6211 = this$;
      if(and__3822__auto____6211) {
        return this$.cljs$core$IFn$_invoke$arity$5
      }else {
        return and__3822__auto____6211
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$5(this$, a, b, c, d)
    }else {
      var x__2365__auto____6212 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6213 = cljs.core._invoke[goog.typeOf(x__2365__auto____6212)];
        if(or__3824__auto____6213) {
          return or__3824__auto____6213
        }else {
          var or__3824__auto____6214 = cljs.core._invoke["_"];
          if(or__3824__auto____6214) {
            return or__3824__auto____6214
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d)
    }
  };
  var _invoke__6 = function(this$, a, b, c, d, e) {
    if(function() {
      var and__3822__auto____6215 = this$;
      if(and__3822__auto____6215) {
        return this$.cljs$core$IFn$_invoke$arity$6
      }else {
        return and__3822__auto____6215
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$6(this$, a, b, c, d, e)
    }else {
      var x__2365__auto____6216 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6217 = cljs.core._invoke[goog.typeOf(x__2365__auto____6216)];
        if(or__3824__auto____6217) {
          return or__3824__auto____6217
        }else {
          var or__3824__auto____6218 = cljs.core._invoke["_"];
          if(or__3824__auto____6218) {
            return or__3824__auto____6218
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e)
    }
  };
  var _invoke__7 = function(this$, a, b, c, d, e, f) {
    if(function() {
      var and__3822__auto____6219 = this$;
      if(and__3822__auto____6219) {
        return this$.cljs$core$IFn$_invoke$arity$7
      }else {
        return and__3822__auto____6219
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$7(this$, a, b, c, d, e, f)
    }else {
      var x__2365__auto____6220 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6221 = cljs.core._invoke[goog.typeOf(x__2365__auto____6220)];
        if(or__3824__auto____6221) {
          return or__3824__auto____6221
        }else {
          var or__3824__auto____6222 = cljs.core._invoke["_"];
          if(or__3824__auto____6222) {
            return or__3824__auto____6222
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f)
    }
  };
  var _invoke__8 = function(this$, a, b, c, d, e, f, g) {
    if(function() {
      var and__3822__auto____6223 = this$;
      if(and__3822__auto____6223) {
        return this$.cljs$core$IFn$_invoke$arity$8
      }else {
        return and__3822__auto____6223
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$8(this$, a, b, c, d, e, f, g)
    }else {
      var x__2365__auto____6224 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6225 = cljs.core._invoke[goog.typeOf(x__2365__auto____6224)];
        if(or__3824__auto____6225) {
          return or__3824__auto____6225
        }else {
          var or__3824__auto____6226 = cljs.core._invoke["_"];
          if(or__3824__auto____6226) {
            return or__3824__auto____6226
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g)
    }
  };
  var _invoke__9 = function(this$, a, b, c, d, e, f, g, h) {
    if(function() {
      var and__3822__auto____6227 = this$;
      if(and__3822__auto____6227) {
        return this$.cljs$core$IFn$_invoke$arity$9
      }else {
        return and__3822__auto____6227
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$9(this$, a, b, c, d, e, f, g, h)
    }else {
      var x__2365__auto____6228 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6229 = cljs.core._invoke[goog.typeOf(x__2365__auto____6228)];
        if(or__3824__auto____6229) {
          return or__3824__auto____6229
        }else {
          var or__3824__auto____6230 = cljs.core._invoke["_"];
          if(or__3824__auto____6230) {
            return or__3824__auto____6230
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h)
    }
  };
  var _invoke__10 = function(this$, a, b, c, d, e, f, g, h, i) {
    if(function() {
      var and__3822__auto____6231 = this$;
      if(and__3822__auto____6231) {
        return this$.cljs$core$IFn$_invoke$arity$10
      }else {
        return and__3822__auto____6231
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$10(this$, a, b, c, d, e, f, g, h, i)
    }else {
      var x__2365__auto____6232 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6233 = cljs.core._invoke[goog.typeOf(x__2365__auto____6232)];
        if(or__3824__auto____6233) {
          return or__3824__auto____6233
        }else {
          var or__3824__auto____6234 = cljs.core._invoke["_"];
          if(or__3824__auto____6234) {
            return or__3824__auto____6234
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i)
    }
  };
  var _invoke__11 = function(this$, a, b, c, d, e, f, g, h, i, j) {
    if(function() {
      var and__3822__auto____6235 = this$;
      if(and__3822__auto____6235) {
        return this$.cljs$core$IFn$_invoke$arity$11
      }else {
        return and__3822__auto____6235
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$11(this$, a, b, c, d, e, f, g, h, i, j)
    }else {
      var x__2365__auto____6236 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6237 = cljs.core._invoke[goog.typeOf(x__2365__auto____6236)];
        if(or__3824__auto____6237) {
          return or__3824__auto____6237
        }else {
          var or__3824__auto____6238 = cljs.core._invoke["_"];
          if(or__3824__auto____6238) {
            return or__3824__auto____6238
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j)
    }
  };
  var _invoke__12 = function(this$, a, b, c, d, e, f, g, h, i, j, k) {
    if(function() {
      var and__3822__auto____6239 = this$;
      if(and__3822__auto____6239) {
        return this$.cljs$core$IFn$_invoke$arity$12
      }else {
        return and__3822__auto____6239
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$12(this$, a, b, c, d, e, f, g, h, i, j, k)
    }else {
      var x__2365__auto____6240 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6241 = cljs.core._invoke[goog.typeOf(x__2365__auto____6240)];
        if(or__3824__auto____6241) {
          return or__3824__auto____6241
        }else {
          var or__3824__auto____6242 = cljs.core._invoke["_"];
          if(or__3824__auto____6242) {
            return or__3824__auto____6242
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k)
    }
  };
  var _invoke__13 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l) {
    if(function() {
      var and__3822__auto____6243 = this$;
      if(and__3822__auto____6243) {
        return this$.cljs$core$IFn$_invoke$arity$13
      }else {
        return and__3822__auto____6243
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$13(this$, a, b, c, d, e, f, g, h, i, j, k, l)
    }else {
      var x__2365__auto____6244 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6245 = cljs.core._invoke[goog.typeOf(x__2365__auto____6244)];
        if(or__3824__auto____6245) {
          return or__3824__auto____6245
        }else {
          var or__3824__auto____6246 = cljs.core._invoke["_"];
          if(or__3824__auto____6246) {
            return or__3824__auto____6246
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l)
    }
  };
  var _invoke__14 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m) {
    if(function() {
      var and__3822__auto____6247 = this$;
      if(and__3822__auto____6247) {
        return this$.cljs$core$IFn$_invoke$arity$14
      }else {
        return and__3822__auto____6247
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$14(this$, a, b, c, d, e, f, g, h, i, j, k, l, m)
    }else {
      var x__2365__auto____6248 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6249 = cljs.core._invoke[goog.typeOf(x__2365__auto____6248)];
        if(or__3824__auto____6249) {
          return or__3824__auto____6249
        }else {
          var or__3824__auto____6250 = cljs.core._invoke["_"];
          if(or__3824__auto____6250) {
            return or__3824__auto____6250
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m)
    }
  };
  var _invoke__15 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n) {
    if(function() {
      var and__3822__auto____6251 = this$;
      if(and__3822__auto____6251) {
        return this$.cljs$core$IFn$_invoke$arity$15
      }else {
        return and__3822__auto____6251
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$15(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n)
    }else {
      var x__2365__auto____6252 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6253 = cljs.core._invoke[goog.typeOf(x__2365__auto____6252)];
        if(or__3824__auto____6253) {
          return or__3824__auto____6253
        }else {
          var or__3824__auto____6254 = cljs.core._invoke["_"];
          if(or__3824__auto____6254) {
            return or__3824__auto____6254
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n)
    }
  };
  var _invoke__16 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o) {
    if(function() {
      var and__3822__auto____6255 = this$;
      if(and__3822__auto____6255) {
        return this$.cljs$core$IFn$_invoke$arity$16
      }else {
        return and__3822__auto____6255
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$16(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o)
    }else {
      var x__2365__auto____6256 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6257 = cljs.core._invoke[goog.typeOf(x__2365__auto____6256)];
        if(or__3824__auto____6257) {
          return or__3824__auto____6257
        }else {
          var or__3824__auto____6258 = cljs.core._invoke["_"];
          if(or__3824__auto____6258) {
            return or__3824__auto____6258
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o)
    }
  };
  var _invoke__17 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p) {
    if(function() {
      var and__3822__auto____6259 = this$;
      if(and__3822__auto____6259) {
        return this$.cljs$core$IFn$_invoke$arity$17
      }else {
        return and__3822__auto____6259
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$17(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p)
    }else {
      var x__2365__auto____6260 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6261 = cljs.core._invoke[goog.typeOf(x__2365__auto____6260)];
        if(or__3824__auto____6261) {
          return or__3824__auto____6261
        }else {
          var or__3824__auto____6262 = cljs.core._invoke["_"];
          if(or__3824__auto____6262) {
            return or__3824__auto____6262
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p)
    }
  };
  var _invoke__18 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q) {
    if(function() {
      var and__3822__auto____6263 = this$;
      if(and__3822__auto____6263) {
        return this$.cljs$core$IFn$_invoke$arity$18
      }else {
        return and__3822__auto____6263
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$18(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q)
    }else {
      var x__2365__auto____6264 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6265 = cljs.core._invoke[goog.typeOf(x__2365__auto____6264)];
        if(or__3824__auto____6265) {
          return or__3824__auto____6265
        }else {
          var or__3824__auto____6266 = cljs.core._invoke["_"];
          if(or__3824__auto____6266) {
            return or__3824__auto____6266
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q)
    }
  };
  var _invoke__19 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s) {
    if(function() {
      var and__3822__auto____6267 = this$;
      if(and__3822__auto____6267) {
        return this$.cljs$core$IFn$_invoke$arity$19
      }else {
        return and__3822__auto____6267
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$19(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s)
    }else {
      var x__2365__auto____6268 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6269 = cljs.core._invoke[goog.typeOf(x__2365__auto____6268)];
        if(or__3824__auto____6269) {
          return or__3824__auto____6269
        }else {
          var or__3824__auto____6270 = cljs.core._invoke["_"];
          if(or__3824__auto____6270) {
            return or__3824__auto____6270
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s)
    }
  };
  var _invoke__20 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t) {
    if(function() {
      var and__3822__auto____6271 = this$;
      if(and__3822__auto____6271) {
        return this$.cljs$core$IFn$_invoke$arity$20
      }else {
        return and__3822__auto____6271
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$20(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t)
    }else {
      var x__2365__auto____6272 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6273 = cljs.core._invoke[goog.typeOf(x__2365__auto____6272)];
        if(or__3824__auto____6273) {
          return or__3824__auto____6273
        }else {
          var or__3824__auto____6274 = cljs.core._invoke["_"];
          if(or__3824__auto____6274) {
            return or__3824__auto____6274
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t)
    }
  };
  var _invoke__21 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t, rest) {
    if(function() {
      var and__3822__auto____6275 = this$;
      if(and__3822__auto____6275) {
        return this$.cljs$core$IFn$_invoke$arity$21
      }else {
        return and__3822__auto____6275
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$21(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t, rest)
    }else {
      var x__2365__auto____6276 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6277 = cljs.core._invoke[goog.typeOf(x__2365__auto____6276)];
        if(or__3824__auto____6277) {
          return or__3824__auto____6277
        }else {
          var or__3824__auto____6278 = cljs.core._invoke["_"];
          if(or__3824__auto____6278) {
            return or__3824__auto____6278
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
    var and__3822__auto____6283 = coll;
    if(and__3822__auto____6283) {
      return coll.cljs$core$ICounted$_count$arity$1
    }else {
      return and__3822__auto____6283
    }
  }()) {
    return coll.cljs$core$ICounted$_count$arity$1(coll)
  }else {
    var x__2365__auto____6284 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6285 = cljs.core._count[goog.typeOf(x__2365__auto____6284)];
      if(or__3824__auto____6285) {
        return or__3824__auto____6285
      }else {
        var or__3824__auto____6286 = cljs.core._count["_"];
        if(or__3824__auto____6286) {
          return or__3824__auto____6286
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
    var and__3822__auto____6291 = coll;
    if(and__3822__auto____6291) {
      return coll.cljs$core$IEmptyableCollection$_empty$arity$1
    }else {
      return and__3822__auto____6291
    }
  }()) {
    return coll.cljs$core$IEmptyableCollection$_empty$arity$1(coll)
  }else {
    var x__2365__auto____6292 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6293 = cljs.core._empty[goog.typeOf(x__2365__auto____6292)];
      if(or__3824__auto____6293) {
        return or__3824__auto____6293
      }else {
        var or__3824__auto____6294 = cljs.core._empty["_"];
        if(or__3824__auto____6294) {
          return or__3824__auto____6294
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
    var and__3822__auto____6299 = coll;
    if(and__3822__auto____6299) {
      return coll.cljs$core$ICollection$_conj$arity$2
    }else {
      return and__3822__auto____6299
    }
  }()) {
    return coll.cljs$core$ICollection$_conj$arity$2(coll, o)
  }else {
    var x__2365__auto____6300 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6301 = cljs.core._conj[goog.typeOf(x__2365__auto____6300)];
      if(or__3824__auto____6301) {
        return or__3824__auto____6301
      }else {
        var or__3824__auto____6302 = cljs.core._conj["_"];
        if(or__3824__auto____6302) {
          return or__3824__auto____6302
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
      var and__3822__auto____6311 = coll;
      if(and__3822__auto____6311) {
        return coll.cljs$core$IIndexed$_nth$arity$2
      }else {
        return and__3822__auto____6311
      }
    }()) {
      return coll.cljs$core$IIndexed$_nth$arity$2(coll, n)
    }else {
      var x__2365__auto____6312 = coll == null ? null : coll;
      return function() {
        var or__3824__auto____6313 = cljs.core._nth[goog.typeOf(x__2365__auto____6312)];
        if(or__3824__auto____6313) {
          return or__3824__auto____6313
        }else {
          var or__3824__auto____6314 = cljs.core._nth["_"];
          if(or__3824__auto____6314) {
            return or__3824__auto____6314
          }else {
            throw cljs.core.missing_protocol.call(null, "IIndexed.-nth", coll);
          }
        }
      }().call(null, coll, n)
    }
  };
  var _nth__3 = function(coll, n, not_found) {
    if(function() {
      var and__3822__auto____6315 = coll;
      if(and__3822__auto____6315) {
        return coll.cljs$core$IIndexed$_nth$arity$3
      }else {
        return and__3822__auto____6315
      }
    }()) {
      return coll.cljs$core$IIndexed$_nth$arity$3(coll, n, not_found)
    }else {
      var x__2365__auto____6316 = coll == null ? null : coll;
      return function() {
        var or__3824__auto____6317 = cljs.core._nth[goog.typeOf(x__2365__auto____6316)];
        if(or__3824__auto____6317) {
          return or__3824__auto____6317
        }else {
          var or__3824__auto____6318 = cljs.core._nth["_"];
          if(or__3824__auto____6318) {
            return or__3824__auto____6318
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
    var and__3822__auto____6323 = coll;
    if(and__3822__auto____6323) {
      return coll.cljs$core$ISeq$_first$arity$1
    }else {
      return and__3822__auto____6323
    }
  }()) {
    return coll.cljs$core$ISeq$_first$arity$1(coll)
  }else {
    var x__2365__auto____6324 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6325 = cljs.core._first[goog.typeOf(x__2365__auto____6324)];
      if(or__3824__auto____6325) {
        return or__3824__auto____6325
      }else {
        var or__3824__auto____6326 = cljs.core._first["_"];
        if(or__3824__auto____6326) {
          return or__3824__auto____6326
        }else {
          throw cljs.core.missing_protocol.call(null, "ISeq.-first", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core._rest = function _rest(coll) {
  if(function() {
    var and__3822__auto____6331 = coll;
    if(and__3822__auto____6331) {
      return coll.cljs$core$ISeq$_rest$arity$1
    }else {
      return and__3822__auto____6331
    }
  }()) {
    return coll.cljs$core$ISeq$_rest$arity$1(coll)
  }else {
    var x__2365__auto____6332 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6333 = cljs.core._rest[goog.typeOf(x__2365__auto____6332)];
      if(or__3824__auto____6333) {
        return or__3824__auto____6333
      }else {
        var or__3824__auto____6334 = cljs.core._rest["_"];
        if(or__3824__auto____6334) {
          return or__3824__auto____6334
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
    var and__3822__auto____6339 = coll;
    if(and__3822__auto____6339) {
      return coll.cljs$core$INext$_next$arity$1
    }else {
      return and__3822__auto____6339
    }
  }()) {
    return coll.cljs$core$INext$_next$arity$1(coll)
  }else {
    var x__2365__auto____6340 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6341 = cljs.core._next[goog.typeOf(x__2365__auto____6340)];
      if(or__3824__auto____6341) {
        return or__3824__auto____6341
      }else {
        var or__3824__auto____6342 = cljs.core._next["_"];
        if(or__3824__auto____6342) {
          return or__3824__auto____6342
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
      var and__3822__auto____6351 = o;
      if(and__3822__auto____6351) {
        return o.cljs$core$ILookup$_lookup$arity$2
      }else {
        return and__3822__auto____6351
      }
    }()) {
      return o.cljs$core$ILookup$_lookup$arity$2(o, k)
    }else {
      var x__2365__auto____6352 = o == null ? null : o;
      return function() {
        var or__3824__auto____6353 = cljs.core._lookup[goog.typeOf(x__2365__auto____6352)];
        if(or__3824__auto____6353) {
          return or__3824__auto____6353
        }else {
          var or__3824__auto____6354 = cljs.core._lookup["_"];
          if(or__3824__auto____6354) {
            return or__3824__auto____6354
          }else {
            throw cljs.core.missing_protocol.call(null, "ILookup.-lookup", o);
          }
        }
      }().call(null, o, k)
    }
  };
  var _lookup__3 = function(o, k, not_found) {
    if(function() {
      var and__3822__auto____6355 = o;
      if(and__3822__auto____6355) {
        return o.cljs$core$ILookup$_lookup$arity$3
      }else {
        return and__3822__auto____6355
      }
    }()) {
      return o.cljs$core$ILookup$_lookup$arity$3(o, k, not_found)
    }else {
      var x__2365__auto____6356 = o == null ? null : o;
      return function() {
        var or__3824__auto____6357 = cljs.core._lookup[goog.typeOf(x__2365__auto____6356)];
        if(or__3824__auto____6357) {
          return or__3824__auto____6357
        }else {
          var or__3824__auto____6358 = cljs.core._lookup["_"];
          if(or__3824__auto____6358) {
            return or__3824__auto____6358
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
    var and__3822__auto____6363 = coll;
    if(and__3822__auto____6363) {
      return coll.cljs$core$IAssociative$_contains_key_QMARK_$arity$2
    }else {
      return and__3822__auto____6363
    }
  }()) {
    return coll.cljs$core$IAssociative$_contains_key_QMARK_$arity$2(coll, k)
  }else {
    var x__2365__auto____6364 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6365 = cljs.core._contains_key_QMARK_[goog.typeOf(x__2365__auto____6364)];
      if(or__3824__auto____6365) {
        return or__3824__auto____6365
      }else {
        var or__3824__auto____6366 = cljs.core._contains_key_QMARK_["_"];
        if(or__3824__auto____6366) {
          return or__3824__auto____6366
        }else {
          throw cljs.core.missing_protocol.call(null, "IAssociative.-contains-key?", coll);
        }
      }
    }().call(null, coll, k)
  }
};
cljs.core._assoc = function _assoc(coll, k, v) {
  if(function() {
    var and__3822__auto____6371 = coll;
    if(and__3822__auto____6371) {
      return coll.cljs$core$IAssociative$_assoc$arity$3
    }else {
      return and__3822__auto____6371
    }
  }()) {
    return coll.cljs$core$IAssociative$_assoc$arity$3(coll, k, v)
  }else {
    var x__2365__auto____6372 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6373 = cljs.core._assoc[goog.typeOf(x__2365__auto____6372)];
      if(or__3824__auto____6373) {
        return or__3824__auto____6373
      }else {
        var or__3824__auto____6374 = cljs.core._assoc["_"];
        if(or__3824__auto____6374) {
          return or__3824__auto____6374
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
    var and__3822__auto____6379 = coll;
    if(and__3822__auto____6379) {
      return coll.cljs$core$IMap$_dissoc$arity$2
    }else {
      return and__3822__auto____6379
    }
  }()) {
    return coll.cljs$core$IMap$_dissoc$arity$2(coll, k)
  }else {
    var x__2365__auto____6380 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6381 = cljs.core._dissoc[goog.typeOf(x__2365__auto____6380)];
      if(or__3824__auto____6381) {
        return or__3824__auto____6381
      }else {
        var or__3824__auto____6382 = cljs.core._dissoc["_"];
        if(or__3824__auto____6382) {
          return or__3824__auto____6382
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
    var and__3822__auto____6387 = coll;
    if(and__3822__auto____6387) {
      return coll.cljs$core$IMapEntry$_key$arity$1
    }else {
      return and__3822__auto____6387
    }
  }()) {
    return coll.cljs$core$IMapEntry$_key$arity$1(coll)
  }else {
    var x__2365__auto____6388 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6389 = cljs.core._key[goog.typeOf(x__2365__auto____6388)];
      if(or__3824__auto____6389) {
        return or__3824__auto____6389
      }else {
        var or__3824__auto____6390 = cljs.core._key["_"];
        if(or__3824__auto____6390) {
          return or__3824__auto____6390
        }else {
          throw cljs.core.missing_protocol.call(null, "IMapEntry.-key", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core._val = function _val(coll) {
  if(function() {
    var and__3822__auto____6395 = coll;
    if(and__3822__auto____6395) {
      return coll.cljs$core$IMapEntry$_val$arity$1
    }else {
      return and__3822__auto____6395
    }
  }()) {
    return coll.cljs$core$IMapEntry$_val$arity$1(coll)
  }else {
    var x__2365__auto____6396 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6397 = cljs.core._val[goog.typeOf(x__2365__auto____6396)];
      if(or__3824__auto____6397) {
        return or__3824__auto____6397
      }else {
        var or__3824__auto____6398 = cljs.core._val["_"];
        if(or__3824__auto____6398) {
          return or__3824__auto____6398
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
    var and__3822__auto____6403 = coll;
    if(and__3822__auto____6403) {
      return coll.cljs$core$ISet$_disjoin$arity$2
    }else {
      return and__3822__auto____6403
    }
  }()) {
    return coll.cljs$core$ISet$_disjoin$arity$2(coll, v)
  }else {
    var x__2365__auto____6404 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6405 = cljs.core._disjoin[goog.typeOf(x__2365__auto____6404)];
      if(or__3824__auto____6405) {
        return or__3824__auto____6405
      }else {
        var or__3824__auto____6406 = cljs.core._disjoin["_"];
        if(or__3824__auto____6406) {
          return or__3824__auto____6406
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
    var and__3822__auto____6411 = coll;
    if(and__3822__auto____6411) {
      return coll.cljs$core$IStack$_peek$arity$1
    }else {
      return and__3822__auto____6411
    }
  }()) {
    return coll.cljs$core$IStack$_peek$arity$1(coll)
  }else {
    var x__2365__auto____6412 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6413 = cljs.core._peek[goog.typeOf(x__2365__auto____6412)];
      if(or__3824__auto____6413) {
        return or__3824__auto____6413
      }else {
        var or__3824__auto____6414 = cljs.core._peek["_"];
        if(or__3824__auto____6414) {
          return or__3824__auto____6414
        }else {
          throw cljs.core.missing_protocol.call(null, "IStack.-peek", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core._pop = function _pop(coll) {
  if(function() {
    var and__3822__auto____6419 = coll;
    if(and__3822__auto____6419) {
      return coll.cljs$core$IStack$_pop$arity$1
    }else {
      return and__3822__auto____6419
    }
  }()) {
    return coll.cljs$core$IStack$_pop$arity$1(coll)
  }else {
    var x__2365__auto____6420 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6421 = cljs.core._pop[goog.typeOf(x__2365__auto____6420)];
      if(or__3824__auto____6421) {
        return or__3824__auto____6421
      }else {
        var or__3824__auto____6422 = cljs.core._pop["_"];
        if(or__3824__auto____6422) {
          return or__3824__auto____6422
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
    var and__3822__auto____6427 = coll;
    if(and__3822__auto____6427) {
      return coll.cljs$core$IVector$_assoc_n$arity$3
    }else {
      return and__3822__auto____6427
    }
  }()) {
    return coll.cljs$core$IVector$_assoc_n$arity$3(coll, n, val)
  }else {
    var x__2365__auto____6428 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6429 = cljs.core._assoc_n[goog.typeOf(x__2365__auto____6428)];
      if(or__3824__auto____6429) {
        return or__3824__auto____6429
      }else {
        var or__3824__auto____6430 = cljs.core._assoc_n["_"];
        if(or__3824__auto____6430) {
          return or__3824__auto____6430
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
    var and__3822__auto____6435 = o;
    if(and__3822__auto____6435) {
      return o.cljs$core$IDeref$_deref$arity$1
    }else {
      return and__3822__auto____6435
    }
  }()) {
    return o.cljs$core$IDeref$_deref$arity$1(o)
  }else {
    var x__2365__auto____6436 = o == null ? null : o;
    return function() {
      var or__3824__auto____6437 = cljs.core._deref[goog.typeOf(x__2365__auto____6436)];
      if(or__3824__auto____6437) {
        return or__3824__auto____6437
      }else {
        var or__3824__auto____6438 = cljs.core._deref["_"];
        if(or__3824__auto____6438) {
          return or__3824__auto____6438
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
    var and__3822__auto____6443 = o;
    if(and__3822__auto____6443) {
      return o.cljs$core$IDerefWithTimeout$_deref_with_timeout$arity$3
    }else {
      return and__3822__auto____6443
    }
  }()) {
    return o.cljs$core$IDerefWithTimeout$_deref_with_timeout$arity$3(o, msec, timeout_val)
  }else {
    var x__2365__auto____6444 = o == null ? null : o;
    return function() {
      var or__3824__auto____6445 = cljs.core._deref_with_timeout[goog.typeOf(x__2365__auto____6444)];
      if(or__3824__auto____6445) {
        return or__3824__auto____6445
      }else {
        var or__3824__auto____6446 = cljs.core._deref_with_timeout["_"];
        if(or__3824__auto____6446) {
          return or__3824__auto____6446
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
    var and__3822__auto____6451 = o;
    if(and__3822__auto____6451) {
      return o.cljs$core$IMeta$_meta$arity$1
    }else {
      return and__3822__auto____6451
    }
  }()) {
    return o.cljs$core$IMeta$_meta$arity$1(o)
  }else {
    var x__2365__auto____6452 = o == null ? null : o;
    return function() {
      var or__3824__auto____6453 = cljs.core._meta[goog.typeOf(x__2365__auto____6452)];
      if(or__3824__auto____6453) {
        return or__3824__auto____6453
      }else {
        var or__3824__auto____6454 = cljs.core._meta["_"];
        if(or__3824__auto____6454) {
          return or__3824__auto____6454
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
    var and__3822__auto____6459 = o;
    if(and__3822__auto____6459) {
      return o.cljs$core$IWithMeta$_with_meta$arity$2
    }else {
      return and__3822__auto____6459
    }
  }()) {
    return o.cljs$core$IWithMeta$_with_meta$arity$2(o, meta)
  }else {
    var x__2365__auto____6460 = o == null ? null : o;
    return function() {
      var or__3824__auto____6461 = cljs.core._with_meta[goog.typeOf(x__2365__auto____6460)];
      if(or__3824__auto____6461) {
        return or__3824__auto____6461
      }else {
        var or__3824__auto____6462 = cljs.core._with_meta["_"];
        if(or__3824__auto____6462) {
          return or__3824__auto____6462
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
      var and__3822__auto____6471 = coll;
      if(and__3822__auto____6471) {
        return coll.cljs$core$IReduce$_reduce$arity$2
      }else {
        return and__3822__auto____6471
      }
    }()) {
      return coll.cljs$core$IReduce$_reduce$arity$2(coll, f)
    }else {
      var x__2365__auto____6472 = coll == null ? null : coll;
      return function() {
        var or__3824__auto____6473 = cljs.core._reduce[goog.typeOf(x__2365__auto____6472)];
        if(or__3824__auto____6473) {
          return or__3824__auto____6473
        }else {
          var or__3824__auto____6474 = cljs.core._reduce["_"];
          if(or__3824__auto____6474) {
            return or__3824__auto____6474
          }else {
            throw cljs.core.missing_protocol.call(null, "IReduce.-reduce", coll);
          }
        }
      }().call(null, coll, f)
    }
  };
  var _reduce__3 = function(coll, f, start) {
    if(function() {
      var and__3822__auto____6475 = coll;
      if(and__3822__auto____6475) {
        return coll.cljs$core$IReduce$_reduce$arity$3
      }else {
        return and__3822__auto____6475
      }
    }()) {
      return coll.cljs$core$IReduce$_reduce$arity$3(coll, f, start)
    }else {
      var x__2365__auto____6476 = coll == null ? null : coll;
      return function() {
        var or__3824__auto____6477 = cljs.core._reduce[goog.typeOf(x__2365__auto____6476)];
        if(or__3824__auto____6477) {
          return or__3824__auto____6477
        }else {
          var or__3824__auto____6478 = cljs.core._reduce["_"];
          if(or__3824__auto____6478) {
            return or__3824__auto____6478
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
    var and__3822__auto____6483 = coll;
    if(and__3822__auto____6483) {
      return coll.cljs$core$IKVReduce$_kv_reduce$arity$3
    }else {
      return and__3822__auto____6483
    }
  }()) {
    return coll.cljs$core$IKVReduce$_kv_reduce$arity$3(coll, f, init)
  }else {
    var x__2365__auto____6484 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6485 = cljs.core._kv_reduce[goog.typeOf(x__2365__auto____6484)];
      if(or__3824__auto____6485) {
        return or__3824__auto____6485
      }else {
        var or__3824__auto____6486 = cljs.core._kv_reduce["_"];
        if(or__3824__auto____6486) {
          return or__3824__auto____6486
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
    var and__3822__auto____6491 = o;
    if(and__3822__auto____6491) {
      return o.cljs$core$IEquiv$_equiv$arity$2
    }else {
      return and__3822__auto____6491
    }
  }()) {
    return o.cljs$core$IEquiv$_equiv$arity$2(o, other)
  }else {
    var x__2365__auto____6492 = o == null ? null : o;
    return function() {
      var or__3824__auto____6493 = cljs.core._equiv[goog.typeOf(x__2365__auto____6492)];
      if(or__3824__auto____6493) {
        return or__3824__auto____6493
      }else {
        var or__3824__auto____6494 = cljs.core._equiv["_"];
        if(or__3824__auto____6494) {
          return or__3824__auto____6494
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
    var and__3822__auto____6499 = o;
    if(and__3822__auto____6499) {
      return o.cljs$core$IHash$_hash$arity$1
    }else {
      return and__3822__auto____6499
    }
  }()) {
    return o.cljs$core$IHash$_hash$arity$1(o)
  }else {
    var x__2365__auto____6500 = o == null ? null : o;
    return function() {
      var or__3824__auto____6501 = cljs.core._hash[goog.typeOf(x__2365__auto____6500)];
      if(or__3824__auto____6501) {
        return or__3824__auto____6501
      }else {
        var or__3824__auto____6502 = cljs.core._hash["_"];
        if(or__3824__auto____6502) {
          return or__3824__auto____6502
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
    var and__3822__auto____6507 = o;
    if(and__3822__auto____6507) {
      return o.cljs$core$ISeqable$_seq$arity$1
    }else {
      return and__3822__auto____6507
    }
  }()) {
    return o.cljs$core$ISeqable$_seq$arity$1(o)
  }else {
    var x__2365__auto____6508 = o == null ? null : o;
    return function() {
      var or__3824__auto____6509 = cljs.core._seq[goog.typeOf(x__2365__auto____6508)];
      if(or__3824__auto____6509) {
        return or__3824__auto____6509
      }else {
        var or__3824__auto____6510 = cljs.core._seq["_"];
        if(or__3824__auto____6510) {
          return or__3824__auto____6510
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
    var and__3822__auto____6515 = coll;
    if(and__3822__auto____6515) {
      return coll.cljs$core$IReversible$_rseq$arity$1
    }else {
      return and__3822__auto____6515
    }
  }()) {
    return coll.cljs$core$IReversible$_rseq$arity$1(coll)
  }else {
    var x__2365__auto____6516 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6517 = cljs.core._rseq[goog.typeOf(x__2365__auto____6516)];
      if(or__3824__auto____6517) {
        return or__3824__auto____6517
      }else {
        var or__3824__auto____6518 = cljs.core._rseq["_"];
        if(or__3824__auto____6518) {
          return or__3824__auto____6518
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
    var and__3822__auto____6523 = coll;
    if(and__3822__auto____6523) {
      return coll.cljs$core$ISorted$_sorted_seq$arity$2
    }else {
      return and__3822__auto____6523
    }
  }()) {
    return coll.cljs$core$ISorted$_sorted_seq$arity$2(coll, ascending_QMARK_)
  }else {
    var x__2365__auto____6524 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6525 = cljs.core._sorted_seq[goog.typeOf(x__2365__auto____6524)];
      if(or__3824__auto____6525) {
        return or__3824__auto____6525
      }else {
        var or__3824__auto____6526 = cljs.core._sorted_seq["_"];
        if(or__3824__auto____6526) {
          return or__3824__auto____6526
        }else {
          throw cljs.core.missing_protocol.call(null, "ISorted.-sorted-seq", coll);
        }
      }
    }().call(null, coll, ascending_QMARK_)
  }
};
cljs.core._sorted_seq_from = function _sorted_seq_from(coll, k, ascending_QMARK_) {
  if(function() {
    var and__3822__auto____6531 = coll;
    if(and__3822__auto____6531) {
      return coll.cljs$core$ISorted$_sorted_seq_from$arity$3
    }else {
      return and__3822__auto____6531
    }
  }()) {
    return coll.cljs$core$ISorted$_sorted_seq_from$arity$3(coll, k, ascending_QMARK_)
  }else {
    var x__2365__auto____6532 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6533 = cljs.core._sorted_seq_from[goog.typeOf(x__2365__auto____6532)];
      if(or__3824__auto____6533) {
        return or__3824__auto____6533
      }else {
        var or__3824__auto____6534 = cljs.core._sorted_seq_from["_"];
        if(or__3824__auto____6534) {
          return or__3824__auto____6534
        }else {
          throw cljs.core.missing_protocol.call(null, "ISorted.-sorted-seq-from", coll);
        }
      }
    }().call(null, coll, k, ascending_QMARK_)
  }
};
cljs.core._entry_key = function _entry_key(coll, entry) {
  if(function() {
    var and__3822__auto____6539 = coll;
    if(and__3822__auto____6539) {
      return coll.cljs$core$ISorted$_entry_key$arity$2
    }else {
      return and__3822__auto____6539
    }
  }()) {
    return coll.cljs$core$ISorted$_entry_key$arity$2(coll, entry)
  }else {
    var x__2365__auto____6540 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6541 = cljs.core._entry_key[goog.typeOf(x__2365__auto____6540)];
      if(or__3824__auto____6541) {
        return or__3824__auto____6541
      }else {
        var or__3824__auto____6542 = cljs.core._entry_key["_"];
        if(or__3824__auto____6542) {
          return or__3824__auto____6542
        }else {
          throw cljs.core.missing_protocol.call(null, "ISorted.-entry-key", coll);
        }
      }
    }().call(null, coll, entry)
  }
};
cljs.core._comparator = function _comparator(coll) {
  if(function() {
    var and__3822__auto____6547 = coll;
    if(and__3822__auto____6547) {
      return coll.cljs$core$ISorted$_comparator$arity$1
    }else {
      return and__3822__auto____6547
    }
  }()) {
    return coll.cljs$core$ISorted$_comparator$arity$1(coll)
  }else {
    var x__2365__auto____6548 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6549 = cljs.core._comparator[goog.typeOf(x__2365__auto____6548)];
      if(or__3824__auto____6549) {
        return or__3824__auto____6549
      }else {
        var or__3824__auto____6550 = cljs.core._comparator["_"];
        if(or__3824__auto____6550) {
          return or__3824__auto____6550
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
    var and__3822__auto____6555 = o;
    if(and__3822__auto____6555) {
      return o.cljs$core$IPrintable$_pr_seq$arity$2
    }else {
      return and__3822__auto____6555
    }
  }()) {
    return o.cljs$core$IPrintable$_pr_seq$arity$2(o, opts)
  }else {
    var x__2365__auto____6556 = o == null ? null : o;
    return function() {
      var or__3824__auto____6557 = cljs.core._pr_seq[goog.typeOf(x__2365__auto____6556)];
      if(or__3824__auto____6557) {
        return or__3824__auto____6557
      }else {
        var or__3824__auto____6558 = cljs.core._pr_seq["_"];
        if(or__3824__auto____6558) {
          return or__3824__auto____6558
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
    var and__3822__auto____6563 = d;
    if(and__3822__auto____6563) {
      return d.cljs$core$IPending$_realized_QMARK_$arity$1
    }else {
      return and__3822__auto____6563
    }
  }()) {
    return d.cljs$core$IPending$_realized_QMARK_$arity$1(d)
  }else {
    var x__2365__auto____6564 = d == null ? null : d;
    return function() {
      var or__3824__auto____6565 = cljs.core._realized_QMARK_[goog.typeOf(x__2365__auto____6564)];
      if(or__3824__auto____6565) {
        return or__3824__auto____6565
      }else {
        var or__3824__auto____6566 = cljs.core._realized_QMARK_["_"];
        if(or__3824__auto____6566) {
          return or__3824__auto____6566
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
    var and__3822__auto____6571 = this$;
    if(and__3822__auto____6571) {
      return this$.cljs$core$IWatchable$_notify_watches$arity$3
    }else {
      return and__3822__auto____6571
    }
  }()) {
    return this$.cljs$core$IWatchable$_notify_watches$arity$3(this$, oldval, newval)
  }else {
    var x__2365__auto____6572 = this$ == null ? null : this$;
    return function() {
      var or__3824__auto____6573 = cljs.core._notify_watches[goog.typeOf(x__2365__auto____6572)];
      if(or__3824__auto____6573) {
        return or__3824__auto____6573
      }else {
        var or__3824__auto____6574 = cljs.core._notify_watches["_"];
        if(or__3824__auto____6574) {
          return or__3824__auto____6574
        }else {
          throw cljs.core.missing_protocol.call(null, "IWatchable.-notify-watches", this$);
        }
      }
    }().call(null, this$, oldval, newval)
  }
};
cljs.core._add_watch = function _add_watch(this$, key, f) {
  if(function() {
    var and__3822__auto____6579 = this$;
    if(and__3822__auto____6579) {
      return this$.cljs$core$IWatchable$_add_watch$arity$3
    }else {
      return and__3822__auto____6579
    }
  }()) {
    return this$.cljs$core$IWatchable$_add_watch$arity$3(this$, key, f)
  }else {
    var x__2365__auto____6580 = this$ == null ? null : this$;
    return function() {
      var or__3824__auto____6581 = cljs.core._add_watch[goog.typeOf(x__2365__auto____6580)];
      if(or__3824__auto____6581) {
        return or__3824__auto____6581
      }else {
        var or__3824__auto____6582 = cljs.core._add_watch["_"];
        if(or__3824__auto____6582) {
          return or__3824__auto____6582
        }else {
          throw cljs.core.missing_protocol.call(null, "IWatchable.-add-watch", this$);
        }
      }
    }().call(null, this$, key, f)
  }
};
cljs.core._remove_watch = function _remove_watch(this$, key) {
  if(function() {
    var and__3822__auto____6587 = this$;
    if(and__3822__auto____6587) {
      return this$.cljs$core$IWatchable$_remove_watch$arity$2
    }else {
      return and__3822__auto____6587
    }
  }()) {
    return this$.cljs$core$IWatchable$_remove_watch$arity$2(this$, key)
  }else {
    var x__2365__auto____6588 = this$ == null ? null : this$;
    return function() {
      var or__3824__auto____6589 = cljs.core._remove_watch[goog.typeOf(x__2365__auto____6588)];
      if(or__3824__auto____6589) {
        return or__3824__auto____6589
      }else {
        var or__3824__auto____6590 = cljs.core._remove_watch["_"];
        if(or__3824__auto____6590) {
          return or__3824__auto____6590
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
    var and__3822__auto____6595 = coll;
    if(and__3822__auto____6595) {
      return coll.cljs$core$IEditableCollection$_as_transient$arity$1
    }else {
      return and__3822__auto____6595
    }
  }()) {
    return coll.cljs$core$IEditableCollection$_as_transient$arity$1(coll)
  }else {
    var x__2365__auto____6596 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6597 = cljs.core._as_transient[goog.typeOf(x__2365__auto____6596)];
      if(or__3824__auto____6597) {
        return or__3824__auto____6597
      }else {
        var or__3824__auto____6598 = cljs.core._as_transient["_"];
        if(or__3824__auto____6598) {
          return or__3824__auto____6598
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
    var and__3822__auto____6603 = tcoll;
    if(and__3822__auto____6603) {
      return tcoll.cljs$core$ITransientCollection$_conj_BANG_$arity$2
    }else {
      return and__3822__auto____6603
    }
  }()) {
    return tcoll.cljs$core$ITransientCollection$_conj_BANG_$arity$2(tcoll, val)
  }else {
    var x__2365__auto____6604 = tcoll == null ? null : tcoll;
    return function() {
      var or__3824__auto____6605 = cljs.core._conj_BANG_[goog.typeOf(x__2365__auto____6604)];
      if(or__3824__auto____6605) {
        return or__3824__auto____6605
      }else {
        var or__3824__auto____6606 = cljs.core._conj_BANG_["_"];
        if(or__3824__auto____6606) {
          return or__3824__auto____6606
        }else {
          throw cljs.core.missing_protocol.call(null, "ITransientCollection.-conj!", tcoll);
        }
      }
    }().call(null, tcoll, val)
  }
};
cljs.core._persistent_BANG_ = function _persistent_BANG_(tcoll) {
  if(function() {
    var and__3822__auto____6611 = tcoll;
    if(and__3822__auto____6611) {
      return tcoll.cljs$core$ITransientCollection$_persistent_BANG_$arity$1
    }else {
      return and__3822__auto____6611
    }
  }()) {
    return tcoll.cljs$core$ITransientCollection$_persistent_BANG_$arity$1(tcoll)
  }else {
    var x__2365__auto____6612 = tcoll == null ? null : tcoll;
    return function() {
      var or__3824__auto____6613 = cljs.core._persistent_BANG_[goog.typeOf(x__2365__auto____6612)];
      if(or__3824__auto____6613) {
        return or__3824__auto____6613
      }else {
        var or__3824__auto____6614 = cljs.core._persistent_BANG_["_"];
        if(or__3824__auto____6614) {
          return or__3824__auto____6614
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
    var and__3822__auto____6619 = tcoll;
    if(and__3822__auto____6619) {
      return tcoll.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3
    }else {
      return and__3822__auto____6619
    }
  }()) {
    return tcoll.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3(tcoll, key, val)
  }else {
    var x__2365__auto____6620 = tcoll == null ? null : tcoll;
    return function() {
      var or__3824__auto____6621 = cljs.core._assoc_BANG_[goog.typeOf(x__2365__auto____6620)];
      if(or__3824__auto____6621) {
        return or__3824__auto____6621
      }else {
        var or__3824__auto____6622 = cljs.core._assoc_BANG_["_"];
        if(or__3824__auto____6622) {
          return or__3824__auto____6622
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
    var and__3822__auto____6627 = tcoll;
    if(and__3822__auto____6627) {
      return tcoll.cljs$core$ITransientMap$_dissoc_BANG_$arity$2
    }else {
      return and__3822__auto____6627
    }
  }()) {
    return tcoll.cljs$core$ITransientMap$_dissoc_BANG_$arity$2(tcoll, key)
  }else {
    var x__2365__auto____6628 = tcoll == null ? null : tcoll;
    return function() {
      var or__3824__auto____6629 = cljs.core._dissoc_BANG_[goog.typeOf(x__2365__auto____6628)];
      if(or__3824__auto____6629) {
        return or__3824__auto____6629
      }else {
        var or__3824__auto____6630 = cljs.core._dissoc_BANG_["_"];
        if(or__3824__auto____6630) {
          return or__3824__auto____6630
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
    var and__3822__auto____6635 = tcoll;
    if(and__3822__auto____6635) {
      return tcoll.cljs$core$ITransientVector$_assoc_n_BANG_$arity$3
    }else {
      return and__3822__auto____6635
    }
  }()) {
    return tcoll.cljs$core$ITransientVector$_assoc_n_BANG_$arity$3(tcoll, n, val)
  }else {
    var x__2365__auto____6636 = tcoll == null ? null : tcoll;
    return function() {
      var or__3824__auto____6637 = cljs.core._assoc_n_BANG_[goog.typeOf(x__2365__auto____6636)];
      if(or__3824__auto____6637) {
        return or__3824__auto____6637
      }else {
        var or__3824__auto____6638 = cljs.core._assoc_n_BANG_["_"];
        if(or__3824__auto____6638) {
          return or__3824__auto____6638
        }else {
          throw cljs.core.missing_protocol.call(null, "ITransientVector.-assoc-n!", tcoll);
        }
      }
    }().call(null, tcoll, n, val)
  }
};
cljs.core._pop_BANG_ = function _pop_BANG_(tcoll) {
  if(function() {
    var and__3822__auto____6643 = tcoll;
    if(and__3822__auto____6643) {
      return tcoll.cljs$core$ITransientVector$_pop_BANG_$arity$1
    }else {
      return and__3822__auto____6643
    }
  }()) {
    return tcoll.cljs$core$ITransientVector$_pop_BANG_$arity$1(tcoll)
  }else {
    var x__2365__auto____6644 = tcoll == null ? null : tcoll;
    return function() {
      var or__3824__auto____6645 = cljs.core._pop_BANG_[goog.typeOf(x__2365__auto____6644)];
      if(or__3824__auto____6645) {
        return or__3824__auto____6645
      }else {
        var or__3824__auto____6646 = cljs.core._pop_BANG_["_"];
        if(or__3824__auto____6646) {
          return or__3824__auto____6646
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
    var and__3822__auto____6651 = tcoll;
    if(and__3822__auto____6651) {
      return tcoll.cljs$core$ITransientSet$_disjoin_BANG_$arity$2
    }else {
      return and__3822__auto____6651
    }
  }()) {
    return tcoll.cljs$core$ITransientSet$_disjoin_BANG_$arity$2(tcoll, v)
  }else {
    var x__2365__auto____6652 = tcoll == null ? null : tcoll;
    return function() {
      var or__3824__auto____6653 = cljs.core._disjoin_BANG_[goog.typeOf(x__2365__auto____6652)];
      if(or__3824__auto____6653) {
        return or__3824__auto____6653
      }else {
        var or__3824__auto____6654 = cljs.core._disjoin_BANG_["_"];
        if(or__3824__auto____6654) {
          return or__3824__auto____6654
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
    var and__3822__auto____6659 = x;
    if(and__3822__auto____6659) {
      return x.cljs$core$IComparable$_compare$arity$2
    }else {
      return and__3822__auto____6659
    }
  }()) {
    return x.cljs$core$IComparable$_compare$arity$2(x, y)
  }else {
    var x__2365__auto____6660 = x == null ? null : x;
    return function() {
      var or__3824__auto____6661 = cljs.core._compare[goog.typeOf(x__2365__auto____6660)];
      if(or__3824__auto____6661) {
        return or__3824__auto____6661
      }else {
        var or__3824__auto____6662 = cljs.core._compare["_"];
        if(or__3824__auto____6662) {
          return or__3824__auto____6662
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
    var and__3822__auto____6667 = coll;
    if(and__3822__auto____6667) {
      return coll.cljs$core$IChunk$_drop_first$arity$1
    }else {
      return and__3822__auto____6667
    }
  }()) {
    return coll.cljs$core$IChunk$_drop_first$arity$1(coll)
  }else {
    var x__2365__auto____6668 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6669 = cljs.core._drop_first[goog.typeOf(x__2365__auto____6668)];
      if(or__3824__auto____6669) {
        return or__3824__auto____6669
      }else {
        var or__3824__auto____6670 = cljs.core._drop_first["_"];
        if(or__3824__auto____6670) {
          return or__3824__auto____6670
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
    var and__3822__auto____6675 = coll;
    if(and__3822__auto____6675) {
      return coll.cljs$core$IChunkedSeq$_chunked_first$arity$1
    }else {
      return and__3822__auto____6675
    }
  }()) {
    return coll.cljs$core$IChunkedSeq$_chunked_first$arity$1(coll)
  }else {
    var x__2365__auto____6676 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6677 = cljs.core._chunked_first[goog.typeOf(x__2365__auto____6676)];
      if(or__3824__auto____6677) {
        return or__3824__auto____6677
      }else {
        var or__3824__auto____6678 = cljs.core._chunked_first["_"];
        if(or__3824__auto____6678) {
          return or__3824__auto____6678
        }else {
          throw cljs.core.missing_protocol.call(null, "IChunkedSeq.-chunked-first", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core._chunked_rest = function _chunked_rest(coll) {
  if(function() {
    var and__3822__auto____6683 = coll;
    if(and__3822__auto____6683) {
      return coll.cljs$core$IChunkedSeq$_chunked_rest$arity$1
    }else {
      return and__3822__auto____6683
    }
  }()) {
    return coll.cljs$core$IChunkedSeq$_chunked_rest$arity$1(coll)
  }else {
    var x__2365__auto____6684 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6685 = cljs.core._chunked_rest[goog.typeOf(x__2365__auto____6684)];
      if(or__3824__auto____6685) {
        return or__3824__auto____6685
      }else {
        var or__3824__auto____6686 = cljs.core._chunked_rest["_"];
        if(or__3824__auto____6686) {
          return or__3824__auto____6686
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
    var and__3822__auto____6691 = coll;
    if(and__3822__auto____6691) {
      return coll.cljs$core$IChunkedNext$_chunked_next$arity$1
    }else {
      return and__3822__auto____6691
    }
  }()) {
    return coll.cljs$core$IChunkedNext$_chunked_next$arity$1(coll)
  }else {
    var x__2365__auto____6692 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6693 = cljs.core._chunked_next[goog.typeOf(x__2365__auto____6692)];
      if(or__3824__auto____6693) {
        return or__3824__auto____6693
      }else {
        var or__3824__auto____6694 = cljs.core._chunked_next["_"];
        if(or__3824__auto____6694) {
          return or__3824__auto____6694
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
    var or__3824__auto____6696 = x === y;
    if(or__3824__auto____6696) {
      return or__3824__auto____6696
    }else {
      return cljs.core._equiv.call(null, x, y)
    }
  };
  var _EQ___3 = function() {
    var G__6697__delegate = function(x, y, more) {
      while(true) {
        if(cljs.core.truth_(_EQ_.call(null, x, y))) {
          if(cljs.core.next.call(null, more)) {
            var G__6698 = y;
            var G__6699 = cljs.core.first.call(null, more);
            var G__6700 = cljs.core.next.call(null, more);
            x = G__6698;
            y = G__6699;
            more = G__6700;
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
    var G__6697 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__6697__delegate.call(this, x, y, more)
    };
    G__6697.cljs$lang$maxFixedArity = 2;
    G__6697.cljs$lang$applyTo = function(arglist__6701) {
      var x = cljs.core.first(arglist__6701);
      var y = cljs.core.first(cljs.core.next(arglist__6701));
      var more = cljs.core.rest(cljs.core.next(arglist__6701));
      return G__6697__delegate(x, y, more)
    };
    G__6697.cljs$lang$arity$variadic = G__6697__delegate;
    return G__6697
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
  var G__6702 = null;
  var G__6702__2 = function(o, k) {
    return null
  };
  var G__6702__3 = function(o, k, not_found) {
    return not_found
  };
  G__6702 = function(o, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__6702__2.call(this, o, k);
      case 3:
        return G__6702__3.call(this, o, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__6702
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
  var G__6703 = null;
  var G__6703__2 = function(_, f) {
    return f.call(null)
  };
  var G__6703__3 = function(_, f, start) {
    return start
  };
  G__6703 = function(_, f, start) {
    switch(arguments.length) {
      case 2:
        return G__6703__2.call(this, _, f);
      case 3:
        return G__6703__3.call(this, _, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__6703
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
  var G__6704 = null;
  var G__6704__2 = function(_, n) {
    return null
  };
  var G__6704__3 = function(_, n, not_found) {
    return not_found
  };
  G__6704 = function(_, n, not_found) {
    switch(arguments.length) {
      case 2:
        return G__6704__2.call(this, _, n);
      case 3:
        return G__6704__3.call(this, _, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__6704
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
  var and__3822__auto____6705 = cljs.core.instance_QMARK_.call(null, Date, other);
  if(and__3822__auto____6705) {
    return o.toString() === other.toString()
  }else {
    return and__3822__auto____6705
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
    var cnt__6718 = cljs.core._count.call(null, cicoll);
    if(cnt__6718 === 0) {
      return f.call(null)
    }else {
      var val__6719 = cljs.core._nth.call(null, cicoll, 0);
      var n__6720 = 1;
      while(true) {
        if(n__6720 < cnt__6718) {
          var nval__6721 = f.call(null, val__6719, cljs.core._nth.call(null, cicoll, n__6720));
          if(cljs.core.reduced_QMARK_.call(null, nval__6721)) {
            return cljs.core.deref.call(null, nval__6721)
          }else {
            var G__6730 = nval__6721;
            var G__6731 = n__6720 + 1;
            val__6719 = G__6730;
            n__6720 = G__6731;
            continue
          }
        }else {
          return val__6719
        }
        break
      }
    }
  };
  var ci_reduce__3 = function(cicoll, f, val) {
    var cnt__6722 = cljs.core._count.call(null, cicoll);
    var val__6723 = val;
    var n__6724 = 0;
    while(true) {
      if(n__6724 < cnt__6722) {
        var nval__6725 = f.call(null, val__6723, cljs.core._nth.call(null, cicoll, n__6724));
        if(cljs.core.reduced_QMARK_.call(null, nval__6725)) {
          return cljs.core.deref.call(null, nval__6725)
        }else {
          var G__6732 = nval__6725;
          var G__6733 = n__6724 + 1;
          val__6723 = G__6732;
          n__6724 = G__6733;
          continue
        }
      }else {
        return val__6723
      }
      break
    }
  };
  var ci_reduce__4 = function(cicoll, f, val, idx) {
    var cnt__6726 = cljs.core._count.call(null, cicoll);
    var val__6727 = val;
    var n__6728 = idx;
    while(true) {
      if(n__6728 < cnt__6726) {
        var nval__6729 = f.call(null, val__6727, cljs.core._nth.call(null, cicoll, n__6728));
        if(cljs.core.reduced_QMARK_.call(null, nval__6729)) {
          return cljs.core.deref.call(null, nval__6729)
        }else {
          var G__6734 = nval__6729;
          var G__6735 = n__6728 + 1;
          val__6727 = G__6734;
          n__6728 = G__6735;
          continue
        }
      }else {
        return val__6727
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
    var cnt__6748 = arr.length;
    if(arr.length === 0) {
      return f.call(null)
    }else {
      var val__6749 = arr[0];
      var n__6750 = 1;
      while(true) {
        if(n__6750 < cnt__6748) {
          var nval__6751 = f.call(null, val__6749, arr[n__6750]);
          if(cljs.core.reduced_QMARK_.call(null, nval__6751)) {
            return cljs.core.deref.call(null, nval__6751)
          }else {
            var G__6760 = nval__6751;
            var G__6761 = n__6750 + 1;
            val__6749 = G__6760;
            n__6750 = G__6761;
            continue
          }
        }else {
          return val__6749
        }
        break
      }
    }
  };
  var array_reduce__3 = function(arr, f, val) {
    var cnt__6752 = arr.length;
    var val__6753 = val;
    var n__6754 = 0;
    while(true) {
      if(n__6754 < cnt__6752) {
        var nval__6755 = f.call(null, val__6753, arr[n__6754]);
        if(cljs.core.reduced_QMARK_.call(null, nval__6755)) {
          return cljs.core.deref.call(null, nval__6755)
        }else {
          var G__6762 = nval__6755;
          var G__6763 = n__6754 + 1;
          val__6753 = G__6762;
          n__6754 = G__6763;
          continue
        }
      }else {
        return val__6753
      }
      break
    }
  };
  var array_reduce__4 = function(arr, f, val, idx) {
    var cnt__6756 = arr.length;
    var val__6757 = val;
    var n__6758 = idx;
    while(true) {
      if(n__6758 < cnt__6756) {
        var nval__6759 = f.call(null, val__6757, arr[n__6758]);
        if(cljs.core.reduced_QMARK_.call(null, nval__6759)) {
          return cljs.core.deref.call(null, nval__6759)
        }else {
          var G__6764 = nval__6759;
          var G__6765 = n__6758 + 1;
          val__6757 = G__6764;
          n__6758 = G__6765;
          continue
        }
      }else {
        return val__6757
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
  var this__6766 = this;
  return cljs.core.hash_coll.call(null, coll)
};
cljs.core.IndexedSeq.prototype.cljs$core$INext$_next$arity$1 = function(_) {
  var this__6767 = this;
  if(this__6767.i + 1 < this__6767.a.length) {
    return new cljs.core.IndexedSeq(this__6767.a, this__6767.i + 1)
  }else {
    return null
  }
};
cljs.core.IndexedSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__6768 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.IndexedSeq.prototype.cljs$core$IReversible$_rseq$arity$1 = function(coll) {
  var this__6769 = this;
  var c__6770 = coll.cljs$core$ICounted$_count$arity$1(coll);
  if(c__6770 > 0) {
    return new cljs.core.RSeq(coll, c__6770 - 1, null)
  }else {
    return cljs.core.List.EMPTY
  }
};
cljs.core.IndexedSeq.prototype.toString = function() {
  var this__6771 = this;
  var this__6772 = this;
  return cljs.core.pr_str.call(null, this__6772)
};
cljs.core.IndexedSeq.prototype.cljs$core$IReduce$_reduce$arity$2 = function(coll, f) {
  var this__6773 = this;
  if(cljs.core.counted_QMARK_.call(null, this__6773.a)) {
    return cljs.core.ci_reduce.call(null, this__6773.a, f, this__6773.a[this__6773.i], this__6773.i + 1)
  }else {
    return cljs.core.ci_reduce.call(null, coll, f, this__6773.a[this__6773.i], 0)
  }
};
cljs.core.IndexedSeq.prototype.cljs$core$IReduce$_reduce$arity$3 = function(coll, f, start) {
  var this__6774 = this;
  if(cljs.core.counted_QMARK_.call(null, this__6774.a)) {
    return cljs.core.ci_reduce.call(null, this__6774.a, f, start, this__6774.i)
  }else {
    return cljs.core.ci_reduce.call(null, coll, f, start, 0)
  }
};
cljs.core.IndexedSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(this$) {
  var this__6775 = this;
  return this$
};
cljs.core.IndexedSeq.prototype.cljs$core$ICounted$_count$arity$1 = function(_) {
  var this__6776 = this;
  return this__6776.a.length - this__6776.i
};
cljs.core.IndexedSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(_) {
  var this__6777 = this;
  return this__6777.a[this__6777.i]
};
cljs.core.IndexedSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(_) {
  var this__6778 = this;
  if(this__6778.i + 1 < this__6778.a.length) {
    return new cljs.core.IndexedSeq(this__6778.a, this__6778.i + 1)
  }else {
    return cljs.core.list.call(null)
  }
};
cljs.core.IndexedSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__6779 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.IndexedSeq.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, n) {
  var this__6780 = this;
  var i__6781 = n + this__6780.i;
  if(i__6781 < this__6780.a.length) {
    return this__6780.a[i__6781]
  }else {
    return null
  }
};
cljs.core.IndexedSeq.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, n, not_found) {
  var this__6782 = this;
  var i__6783 = n + this__6782.i;
  if(i__6783 < this__6782.a.length) {
    return this__6782.a[i__6783]
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
  var G__6784 = null;
  var G__6784__2 = function(array, f) {
    return cljs.core.ci_reduce.call(null, array, f)
  };
  var G__6784__3 = function(array, f, start) {
    return cljs.core.ci_reduce.call(null, array, f, start)
  };
  G__6784 = function(array, f, start) {
    switch(arguments.length) {
      case 2:
        return G__6784__2.call(this, array, f);
      case 3:
        return G__6784__3.call(this, array, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__6784
}();
cljs.core.ILookup["array"] = true;
cljs.core._lookup["array"] = function() {
  var G__6785 = null;
  var G__6785__2 = function(array, k) {
    return array[k]
  };
  var G__6785__3 = function(array, k, not_found) {
    return cljs.core._nth.call(null, array, k, not_found)
  };
  G__6785 = function(array, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__6785__2.call(this, array, k);
      case 3:
        return G__6785__3.call(this, array, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__6785
}();
cljs.core.IIndexed["array"] = true;
cljs.core._nth["array"] = function() {
  var G__6786 = null;
  var G__6786__2 = function(array, n) {
    if(n < array.length) {
      return array[n]
    }else {
      return null
    }
  };
  var G__6786__3 = function(array, n, not_found) {
    if(n < array.length) {
      return array[n]
    }else {
      return not_found
    }
  };
  G__6786 = function(array, n, not_found) {
    switch(arguments.length) {
      case 2:
        return G__6786__2.call(this, array, n);
      case 3:
        return G__6786__3.call(this, array, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__6786
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
  var this__6787 = this;
  return cljs.core.hash_coll.call(null, coll)
};
cljs.core.RSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__6788 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.RSeq.prototype.toString = function() {
  var this__6789 = this;
  var this__6790 = this;
  return cljs.core.pr_str.call(null, this__6790)
};
cljs.core.RSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__6791 = this;
  return coll
};
cljs.core.RSeq.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__6792 = this;
  return this__6792.i + 1
};
cljs.core.RSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__6793 = this;
  return cljs.core._nth.call(null, this__6793.ci, this__6793.i)
};
cljs.core.RSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__6794 = this;
  if(this__6794.i > 0) {
    return new cljs.core.RSeq(this__6794.ci, this__6794.i - 1, null)
  }else {
    return cljs.core.List.EMPTY
  }
};
cljs.core.RSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__6795 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.RSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, new_meta) {
  var this__6796 = this;
  return new cljs.core.RSeq(this__6796.ci, this__6796.i, new_meta)
};
cljs.core.RSeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__6797 = this;
  return this__6797.meta
};
cljs.core.RSeq;
cljs.core.seq = function seq(coll) {
  if(coll == null) {
    return null
  }else {
    if(function() {
      var G__6801__6802 = coll;
      if(G__6801__6802) {
        if(function() {
          var or__3824__auto____6803 = G__6801__6802.cljs$lang$protocol_mask$partition0$ & 32;
          if(or__3824__auto____6803) {
            return or__3824__auto____6803
          }else {
            return G__6801__6802.cljs$core$ASeq$
          }
        }()) {
          return true
        }else {
          if(!G__6801__6802.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.ASeq, G__6801__6802)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.ASeq, G__6801__6802)
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
      var G__6808__6809 = coll;
      if(G__6808__6809) {
        if(function() {
          var or__3824__auto____6810 = G__6808__6809.cljs$lang$protocol_mask$partition0$ & 64;
          if(or__3824__auto____6810) {
            return or__3824__auto____6810
          }else {
            return G__6808__6809.cljs$core$ISeq$
          }
        }()) {
          return true
        }else {
          if(!G__6808__6809.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__6808__6809)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__6808__6809)
      }
    }()) {
      return cljs.core._first.call(null, coll)
    }else {
      var s__6811 = cljs.core.seq.call(null, coll);
      if(s__6811 == null) {
        return null
      }else {
        return cljs.core._first.call(null, s__6811)
      }
    }
  }
};
cljs.core.rest = function rest(coll) {
  if(!(coll == null)) {
    if(function() {
      var G__6816__6817 = coll;
      if(G__6816__6817) {
        if(function() {
          var or__3824__auto____6818 = G__6816__6817.cljs$lang$protocol_mask$partition0$ & 64;
          if(or__3824__auto____6818) {
            return or__3824__auto____6818
          }else {
            return G__6816__6817.cljs$core$ISeq$
          }
        }()) {
          return true
        }else {
          if(!G__6816__6817.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__6816__6817)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__6816__6817)
      }
    }()) {
      return cljs.core._rest.call(null, coll)
    }else {
      var s__6819 = cljs.core.seq.call(null, coll);
      if(!(s__6819 == null)) {
        return cljs.core._rest.call(null, s__6819)
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
      var G__6823__6824 = coll;
      if(G__6823__6824) {
        if(function() {
          var or__3824__auto____6825 = G__6823__6824.cljs$lang$protocol_mask$partition0$ & 128;
          if(or__3824__auto____6825) {
            return or__3824__auto____6825
          }else {
            return G__6823__6824.cljs$core$INext$
          }
        }()) {
          return true
        }else {
          if(!G__6823__6824.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.INext, G__6823__6824)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.INext, G__6823__6824)
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
    var sn__6827 = cljs.core.next.call(null, s);
    if(!(sn__6827 == null)) {
      var G__6828 = sn__6827;
      s = G__6828;
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
    var G__6829__delegate = function(coll, x, xs) {
      while(true) {
        if(cljs.core.truth_(xs)) {
          var G__6830 = conj.call(null, coll, x);
          var G__6831 = cljs.core.first.call(null, xs);
          var G__6832 = cljs.core.next.call(null, xs);
          coll = G__6830;
          x = G__6831;
          xs = G__6832;
          continue
        }else {
          return conj.call(null, coll, x)
        }
        break
      }
    };
    var G__6829 = function(coll, x, var_args) {
      var xs = null;
      if(goog.isDef(var_args)) {
        xs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__6829__delegate.call(this, coll, x, xs)
    };
    G__6829.cljs$lang$maxFixedArity = 2;
    G__6829.cljs$lang$applyTo = function(arglist__6833) {
      var coll = cljs.core.first(arglist__6833);
      var x = cljs.core.first(cljs.core.next(arglist__6833));
      var xs = cljs.core.rest(cljs.core.next(arglist__6833));
      return G__6829__delegate(coll, x, xs)
    };
    G__6829.cljs$lang$arity$variadic = G__6829__delegate;
    return G__6829
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
  var s__6836 = cljs.core.seq.call(null, coll);
  var acc__6837 = 0;
  while(true) {
    if(cljs.core.counted_QMARK_.call(null, s__6836)) {
      return acc__6837 + cljs.core._count.call(null, s__6836)
    }else {
      var G__6838 = cljs.core.next.call(null, s__6836);
      var G__6839 = acc__6837 + 1;
      s__6836 = G__6838;
      acc__6837 = G__6839;
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
        var G__6846__6847 = coll;
        if(G__6846__6847) {
          if(function() {
            var or__3824__auto____6848 = G__6846__6847.cljs$lang$protocol_mask$partition0$ & 16;
            if(or__3824__auto____6848) {
              return or__3824__auto____6848
            }else {
              return G__6846__6847.cljs$core$IIndexed$
            }
          }()) {
            return true
          }else {
            if(!G__6846__6847.cljs$lang$protocol_mask$partition0$) {
              return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__6846__6847)
            }else {
              return false
            }
          }
        }else {
          return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__6846__6847)
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
        var G__6849__6850 = coll;
        if(G__6849__6850) {
          if(function() {
            var or__3824__auto____6851 = G__6849__6850.cljs$lang$protocol_mask$partition0$ & 16;
            if(or__3824__auto____6851) {
              return or__3824__auto____6851
            }else {
              return G__6849__6850.cljs$core$IIndexed$
            }
          }()) {
            return true
          }else {
            if(!G__6849__6850.cljs$lang$protocol_mask$partition0$) {
              return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__6849__6850)
            }else {
              return false
            }
          }
        }else {
          return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__6849__6850)
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
    var G__6854__delegate = function(coll, k, v, kvs) {
      while(true) {
        var ret__6853 = assoc.call(null, coll, k, v);
        if(cljs.core.truth_(kvs)) {
          var G__6855 = ret__6853;
          var G__6856 = cljs.core.first.call(null, kvs);
          var G__6857 = cljs.core.second.call(null, kvs);
          var G__6858 = cljs.core.nnext.call(null, kvs);
          coll = G__6855;
          k = G__6856;
          v = G__6857;
          kvs = G__6858;
          continue
        }else {
          return ret__6853
        }
        break
      }
    };
    var G__6854 = function(coll, k, v, var_args) {
      var kvs = null;
      if(goog.isDef(var_args)) {
        kvs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__6854__delegate.call(this, coll, k, v, kvs)
    };
    G__6854.cljs$lang$maxFixedArity = 3;
    G__6854.cljs$lang$applyTo = function(arglist__6859) {
      var coll = cljs.core.first(arglist__6859);
      var k = cljs.core.first(cljs.core.next(arglist__6859));
      var v = cljs.core.first(cljs.core.next(cljs.core.next(arglist__6859)));
      var kvs = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__6859)));
      return G__6854__delegate(coll, k, v, kvs)
    };
    G__6854.cljs$lang$arity$variadic = G__6854__delegate;
    return G__6854
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
    var G__6862__delegate = function(coll, k, ks) {
      while(true) {
        var ret__6861 = dissoc.call(null, coll, k);
        if(cljs.core.truth_(ks)) {
          var G__6863 = ret__6861;
          var G__6864 = cljs.core.first.call(null, ks);
          var G__6865 = cljs.core.next.call(null, ks);
          coll = G__6863;
          k = G__6864;
          ks = G__6865;
          continue
        }else {
          return ret__6861
        }
        break
      }
    };
    var G__6862 = function(coll, k, var_args) {
      var ks = null;
      if(goog.isDef(var_args)) {
        ks = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__6862__delegate.call(this, coll, k, ks)
    };
    G__6862.cljs$lang$maxFixedArity = 2;
    G__6862.cljs$lang$applyTo = function(arglist__6866) {
      var coll = cljs.core.first(arglist__6866);
      var k = cljs.core.first(cljs.core.next(arglist__6866));
      var ks = cljs.core.rest(cljs.core.next(arglist__6866));
      return G__6862__delegate(coll, k, ks)
    };
    G__6862.cljs$lang$arity$variadic = G__6862__delegate;
    return G__6862
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
    var G__6870__6871 = o;
    if(G__6870__6871) {
      if(function() {
        var or__3824__auto____6872 = G__6870__6871.cljs$lang$protocol_mask$partition0$ & 131072;
        if(or__3824__auto____6872) {
          return or__3824__auto____6872
        }else {
          return G__6870__6871.cljs$core$IMeta$
        }
      }()) {
        return true
      }else {
        if(!G__6870__6871.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.IMeta, G__6870__6871)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.IMeta, G__6870__6871)
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
    var G__6875__delegate = function(coll, k, ks) {
      while(true) {
        var ret__6874 = disj.call(null, coll, k);
        if(cljs.core.truth_(ks)) {
          var G__6876 = ret__6874;
          var G__6877 = cljs.core.first.call(null, ks);
          var G__6878 = cljs.core.next.call(null, ks);
          coll = G__6876;
          k = G__6877;
          ks = G__6878;
          continue
        }else {
          return ret__6874
        }
        break
      }
    };
    var G__6875 = function(coll, k, var_args) {
      var ks = null;
      if(goog.isDef(var_args)) {
        ks = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__6875__delegate.call(this, coll, k, ks)
    };
    G__6875.cljs$lang$maxFixedArity = 2;
    G__6875.cljs$lang$applyTo = function(arglist__6879) {
      var coll = cljs.core.first(arglist__6879);
      var k = cljs.core.first(cljs.core.next(arglist__6879));
      var ks = cljs.core.rest(cljs.core.next(arglist__6879));
      return G__6875__delegate(coll, k, ks)
    };
    G__6875.cljs$lang$arity$variadic = G__6875__delegate;
    return G__6875
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
  var h__6881 = goog.string.hashCode(k);
  cljs.core.string_hash_cache[k] = h__6881;
  cljs.core.string_hash_cache_count = cljs.core.string_hash_cache_count + 1;
  return h__6881
};
cljs.core.check_string_hash_cache = function check_string_hash_cache(k) {
  if(cljs.core.string_hash_cache_count > 255) {
    cljs.core.string_hash_cache = {};
    cljs.core.string_hash_cache_count = 0
  }else {
  }
  var h__6883 = cljs.core.string_hash_cache[k];
  if(!(h__6883 == null)) {
    return h__6883
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
      var and__3822__auto____6885 = goog.isString(o);
      if(and__3822__auto____6885) {
        return check_cache
      }else {
        return and__3822__auto____6885
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
    var G__6889__6890 = x;
    if(G__6889__6890) {
      if(function() {
        var or__3824__auto____6891 = G__6889__6890.cljs$lang$protocol_mask$partition0$ & 8;
        if(or__3824__auto____6891) {
          return or__3824__auto____6891
        }else {
          return G__6889__6890.cljs$core$ICollection$
        }
      }()) {
        return true
      }else {
        if(!G__6889__6890.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.ICollection, G__6889__6890)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.ICollection, G__6889__6890)
    }
  }
};
cljs.core.set_QMARK_ = function set_QMARK_(x) {
  if(x == null) {
    return false
  }else {
    var G__6895__6896 = x;
    if(G__6895__6896) {
      if(function() {
        var or__3824__auto____6897 = G__6895__6896.cljs$lang$protocol_mask$partition0$ & 4096;
        if(or__3824__auto____6897) {
          return or__3824__auto____6897
        }else {
          return G__6895__6896.cljs$core$ISet$
        }
      }()) {
        return true
      }else {
        if(!G__6895__6896.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.ISet, G__6895__6896)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.ISet, G__6895__6896)
    }
  }
};
cljs.core.associative_QMARK_ = function associative_QMARK_(x) {
  var G__6901__6902 = x;
  if(G__6901__6902) {
    if(function() {
      var or__3824__auto____6903 = G__6901__6902.cljs$lang$protocol_mask$partition0$ & 512;
      if(or__3824__auto____6903) {
        return or__3824__auto____6903
      }else {
        return G__6901__6902.cljs$core$IAssociative$
      }
    }()) {
      return true
    }else {
      if(!G__6901__6902.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IAssociative, G__6901__6902)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IAssociative, G__6901__6902)
  }
};
cljs.core.sequential_QMARK_ = function sequential_QMARK_(x) {
  var G__6907__6908 = x;
  if(G__6907__6908) {
    if(function() {
      var or__3824__auto____6909 = G__6907__6908.cljs$lang$protocol_mask$partition0$ & 16777216;
      if(or__3824__auto____6909) {
        return or__3824__auto____6909
      }else {
        return G__6907__6908.cljs$core$ISequential$
      }
    }()) {
      return true
    }else {
      if(!G__6907__6908.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.ISequential, G__6907__6908)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.ISequential, G__6907__6908)
  }
};
cljs.core.counted_QMARK_ = function counted_QMARK_(x) {
  var G__6913__6914 = x;
  if(G__6913__6914) {
    if(function() {
      var or__3824__auto____6915 = G__6913__6914.cljs$lang$protocol_mask$partition0$ & 2;
      if(or__3824__auto____6915) {
        return or__3824__auto____6915
      }else {
        return G__6913__6914.cljs$core$ICounted$
      }
    }()) {
      return true
    }else {
      if(!G__6913__6914.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.ICounted, G__6913__6914)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.ICounted, G__6913__6914)
  }
};
cljs.core.indexed_QMARK_ = function indexed_QMARK_(x) {
  var G__6919__6920 = x;
  if(G__6919__6920) {
    if(function() {
      var or__3824__auto____6921 = G__6919__6920.cljs$lang$protocol_mask$partition0$ & 16;
      if(or__3824__auto____6921) {
        return or__3824__auto____6921
      }else {
        return G__6919__6920.cljs$core$IIndexed$
      }
    }()) {
      return true
    }else {
      if(!G__6919__6920.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__6919__6920)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__6919__6920)
  }
};
cljs.core.reduceable_QMARK_ = function reduceable_QMARK_(x) {
  var G__6925__6926 = x;
  if(G__6925__6926) {
    if(function() {
      var or__3824__auto____6927 = G__6925__6926.cljs$lang$protocol_mask$partition0$ & 524288;
      if(or__3824__auto____6927) {
        return or__3824__auto____6927
      }else {
        return G__6925__6926.cljs$core$IReduce$
      }
    }()) {
      return true
    }else {
      if(!G__6925__6926.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__6925__6926)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__6925__6926)
  }
};
cljs.core.map_QMARK_ = function map_QMARK_(x) {
  if(x == null) {
    return false
  }else {
    var G__6931__6932 = x;
    if(G__6931__6932) {
      if(function() {
        var or__3824__auto____6933 = G__6931__6932.cljs$lang$protocol_mask$partition0$ & 1024;
        if(or__3824__auto____6933) {
          return or__3824__auto____6933
        }else {
          return G__6931__6932.cljs$core$IMap$
        }
      }()) {
        return true
      }else {
        if(!G__6931__6932.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.IMap, G__6931__6932)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.IMap, G__6931__6932)
    }
  }
};
cljs.core.vector_QMARK_ = function vector_QMARK_(x) {
  var G__6937__6938 = x;
  if(G__6937__6938) {
    if(function() {
      var or__3824__auto____6939 = G__6937__6938.cljs$lang$protocol_mask$partition0$ & 16384;
      if(or__3824__auto____6939) {
        return or__3824__auto____6939
      }else {
        return G__6937__6938.cljs$core$IVector$
      }
    }()) {
      return true
    }else {
      if(!G__6937__6938.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IVector, G__6937__6938)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IVector, G__6937__6938)
  }
};
cljs.core.chunked_seq_QMARK_ = function chunked_seq_QMARK_(x) {
  var G__6943__6944 = x;
  if(G__6943__6944) {
    if(cljs.core.truth_(function() {
      var or__3824__auto____6945 = null;
      if(cljs.core.truth_(or__3824__auto____6945)) {
        return or__3824__auto____6945
      }else {
        return G__6943__6944.cljs$core$IChunkedSeq$
      }
    }())) {
      return true
    }else {
      if(!G__6943__6944.cljs$lang$protocol_mask$partition$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IChunkedSeq, G__6943__6944)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IChunkedSeq, G__6943__6944)
  }
};
cljs.core.js_obj = function() {
  var js_obj = null;
  var js_obj__0 = function() {
    return{}
  };
  var js_obj__1 = function() {
    var G__6946__delegate = function(keyvals) {
      return cljs.core.apply.call(null, goog.object.create, keyvals)
    };
    var G__6946 = function(var_args) {
      var keyvals = null;
      if(goog.isDef(var_args)) {
        keyvals = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
      }
      return G__6946__delegate.call(this, keyvals)
    };
    G__6946.cljs$lang$maxFixedArity = 0;
    G__6946.cljs$lang$applyTo = function(arglist__6947) {
      var keyvals = cljs.core.seq(arglist__6947);
      return G__6946__delegate(keyvals)
    };
    G__6946.cljs$lang$arity$variadic = G__6946__delegate;
    return G__6946
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
  var keys__6949 = [];
  goog.object.forEach(obj, function(val, key, obj) {
    return keys__6949.push(key)
  });
  return keys__6949
};
cljs.core.js_delete = function js_delete(obj, key) {
  return delete obj[key]
};
cljs.core.array_copy = function array_copy(from, i, to, j, len) {
  var i__6953 = i;
  var j__6954 = j;
  var len__6955 = len;
  while(true) {
    if(len__6955 === 0) {
      return to
    }else {
      to[j__6954] = from[i__6953];
      var G__6956 = i__6953 + 1;
      var G__6957 = j__6954 + 1;
      var G__6958 = len__6955 - 1;
      i__6953 = G__6956;
      j__6954 = G__6957;
      len__6955 = G__6958;
      continue
    }
    break
  }
};
cljs.core.array_copy_downward = function array_copy_downward(from, i, to, j, len) {
  var i__6962 = i + (len - 1);
  var j__6963 = j + (len - 1);
  var len__6964 = len;
  while(true) {
    if(len__6964 === 0) {
      return to
    }else {
      to[j__6963] = from[i__6962];
      var G__6965 = i__6962 - 1;
      var G__6966 = j__6963 - 1;
      var G__6967 = len__6964 - 1;
      i__6962 = G__6965;
      j__6963 = G__6966;
      len__6964 = G__6967;
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
    var G__6971__6972 = s;
    if(G__6971__6972) {
      if(function() {
        var or__3824__auto____6973 = G__6971__6972.cljs$lang$protocol_mask$partition0$ & 64;
        if(or__3824__auto____6973) {
          return or__3824__auto____6973
        }else {
          return G__6971__6972.cljs$core$ISeq$
        }
      }()) {
        return true
      }else {
        if(!G__6971__6972.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__6971__6972)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__6971__6972)
    }
  }
};
cljs.core.seqable_QMARK_ = function seqable_QMARK_(s) {
  var G__6977__6978 = s;
  if(G__6977__6978) {
    if(function() {
      var or__3824__auto____6979 = G__6977__6978.cljs$lang$protocol_mask$partition0$ & 8388608;
      if(or__3824__auto____6979) {
        return or__3824__auto____6979
      }else {
        return G__6977__6978.cljs$core$ISeqable$
      }
    }()) {
      return true
    }else {
      if(!G__6977__6978.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.ISeqable, G__6977__6978)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.ISeqable, G__6977__6978)
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
  var and__3822__auto____6982 = goog.isString(x);
  if(and__3822__auto____6982) {
    return!function() {
      var or__3824__auto____6983 = x.charAt(0) === "\ufdd0";
      if(or__3824__auto____6983) {
        return or__3824__auto____6983
      }else {
        return x.charAt(0) === "\ufdd1"
      }
    }()
  }else {
    return and__3822__auto____6982
  }
};
cljs.core.keyword_QMARK_ = function keyword_QMARK_(x) {
  var and__3822__auto____6985 = goog.isString(x);
  if(and__3822__auto____6985) {
    return x.charAt(0) === "\ufdd0"
  }else {
    return and__3822__auto____6985
  }
};
cljs.core.symbol_QMARK_ = function symbol_QMARK_(x) {
  var and__3822__auto____6987 = goog.isString(x);
  if(and__3822__auto____6987) {
    return x.charAt(0) === "\ufdd1"
  }else {
    return and__3822__auto____6987
  }
};
cljs.core.number_QMARK_ = function number_QMARK_(n) {
  return goog.isNumber(n)
};
cljs.core.fn_QMARK_ = function fn_QMARK_(f) {
  return goog.isFunction(f)
};
cljs.core.ifn_QMARK_ = function ifn_QMARK_(f) {
  var or__3824__auto____6992 = cljs.core.fn_QMARK_.call(null, f);
  if(or__3824__auto____6992) {
    return or__3824__auto____6992
  }else {
    var G__6993__6994 = f;
    if(G__6993__6994) {
      if(function() {
        var or__3824__auto____6995 = G__6993__6994.cljs$lang$protocol_mask$partition0$ & 1;
        if(or__3824__auto____6995) {
          return or__3824__auto____6995
        }else {
          return G__6993__6994.cljs$core$IFn$
        }
      }()) {
        return true
      }else {
        if(!G__6993__6994.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.IFn, G__6993__6994)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.IFn, G__6993__6994)
    }
  }
};
cljs.core.integer_QMARK_ = function integer_QMARK_(n) {
  var and__3822__auto____6997 = cljs.core.number_QMARK_.call(null, n);
  if(and__3822__auto____6997) {
    return n == n.toFixed()
  }else {
    return and__3822__auto____6997
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
    var and__3822__auto____7000 = coll;
    if(cljs.core.truth_(and__3822__auto____7000)) {
      var and__3822__auto____7001 = cljs.core.associative_QMARK_.call(null, coll);
      if(and__3822__auto____7001) {
        return cljs.core.contains_QMARK_.call(null, coll, k)
      }else {
        return and__3822__auto____7001
      }
    }else {
      return and__3822__auto____7000
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
    var G__7010__delegate = function(x, y, more) {
      if(!cljs.core._EQ_.call(null, x, y)) {
        var s__7006 = cljs.core.PersistentHashSet.fromArray([y, x]);
        var xs__7007 = more;
        while(true) {
          var x__7008 = cljs.core.first.call(null, xs__7007);
          var etc__7009 = cljs.core.next.call(null, xs__7007);
          if(cljs.core.truth_(xs__7007)) {
            if(cljs.core.contains_QMARK_.call(null, s__7006, x__7008)) {
              return false
            }else {
              var G__7011 = cljs.core.conj.call(null, s__7006, x__7008);
              var G__7012 = etc__7009;
              s__7006 = G__7011;
              xs__7007 = G__7012;
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
    var G__7010 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7010__delegate.call(this, x, y, more)
    };
    G__7010.cljs$lang$maxFixedArity = 2;
    G__7010.cljs$lang$applyTo = function(arglist__7013) {
      var x = cljs.core.first(arglist__7013);
      var y = cljs.core.first(cljs.core.next(arglist__7013));
      var more = cljs.core.rest(cljs.core.next(arglist__7013));
      return G__7010__delegate(x, y, more)
    };
    G__7010.cljs$lang$arity$variadic = G__7010__delegate;
    return G__7010
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
            var G__7017__7018 = x;
            if(G__7017__7018) {
              if(cljs.core.truth_(function() {
                var or__3824__auto____7019 = null;
                if(cljs.core.truth_(or__3824__auto____7019)) {
                  return or__3824__auto____7019
                }else {
                  return G__7017__7018.cljs$core$IComparable$
                }
              }())) {
                return true
              }else {
                if(!G__7017__7018.cljs$lang$protocol_mask$partition$) {
                  return cljs.core.type_satisfies_.call(null, cljs.core.IComparable, G__7017__7018)
                }else {
                  return false
                }
              }
            }else {
              return cljs.core.type_satisfies_.call(null, cljs.core.IComparable, G__7017__7018)
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
    var xl__7024 = cljs.core.count.call(null, xs);
    var yl__7025 = cljs.core.count.call(null, ys);
    if(xl__7024 < yl__7025) {
      return-1
    }else {
      if(xl__7024 > yl__7025) {
        return 1
      }else {
        if("\ufdd0'else") {
          return compare_indexed.call(null, xs, ys, xl__7024, 0)
        }else {
          return null
        }
      }
    }
  };
  var compare_indexed__4 = function(xs, ys, len, n) {
    while(true) {
      var d__7026 = cljs.core.compare.call(null, cljs.core.nth.call(null, xs, n), cljs.core.nth.call(null, ys, n));
      if(function() {
        var and__3822__auto____7027 = d__7026 === 0;
        if(and__3822__auto____7027) {
          return n + 1 < len
        }else {
          return and__3822__auto____7027
        }
      }()) {
        var G__7028 = xs;
        var G__7029 = ys;
        var G__7030 = len;
        var G__7031 = n + 1;
        xs = G__7028;
        ys = G__7029;
        len = G__7030;
        n = G__7031;
        continue
      }else {
        return d__7026
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
      var r__7033 = f.call(null, x, y);
      if(cljs.core.number_QMARK_.call(null, r__7033)) {
        return r__7033
      }else {
        if(cljs.core.truth_(r__7033)) {
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
      var a__7035 = cljs.core.to_array.call(null, coll);
      goog.array.stableSort(a__7035, cljs.core.fn__GT_comparator.call(null, comp));
      return cljs.core.seq.call(null, a__7035)
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
    var temp__3971__auto____7041 = cljs.core.seq.call(null, coll);
    if(temp__3971__auto____7041) {
      var s__7042 = temp__3971__auto____7041;
      return cljs.core.reduce.call(null, f, cljs.core.first.call(null, s__7042), cljs.core.next.call(null, s__7042))
    }else {
      return f.call(null)
    }
  };
  var seq_reduce__3 = function(f, val, coll) {
    var val__7043 = val;
    var coll__7044 = cljs.core.seq.call(null, coll);
    while(true) {
      if(coll__7044) {
        var nval__7045 = f.call(null, val__7043, cljs.core.first.call(null, coll__7044));
        if(cljs.core.reduced_QMARK_.call(null, nval__7045)) {
          return cljs.core.deref.call(null, nval__7045)
        }else {
          var G__7046 = nval__7045;
          var G__7047 = cljs.core.next.call(null, coll__7044);
          val__7043 = G__7046;
          coll__7044 = G__7047;
          continue
        }
      }else {
        return val__7043
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
  var a__7049 = cljs.core.to_array.call(null, coll);
  goog.array.shuffle(a__7049);
  return cljs.core.vec.call(null, a__7049)
};
cljs.core.reduce = function() {
  var reduce = null;
  var reduce__2 = function(f, coll) {
    if(function() {
      var G__7056__7057 = coll;
      if(G__7056__7057) {
        if(function() {
          var or__3824__auto____7058 = G__7056__7057.cljs$lang$protocol_mask$partition0$ & 524288;
          if(or__3824__auto____7058) {
            return or__3824__auto____7058
          }else {
            return G__7056__7057.cljs$core$IReduce$
          }
        }()) {
          return true
        }else {
          if(!G__7056__7057.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__7056__7057)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__7056__7057)
      }
    }()) {
      return cljs.core._reduce.call(null, coll, f)
    }else {
      return cljs.core.seq_reduce.call(null, f, coll)
    }
  };
  var reduce__3 = function(f, val, coll) {
    if(function() {
      var G__7059__7060 = coll;
      if(G__7059__7060) {
        if(function() {
          var or__3824__auto____7061 = G__7059__7060.cljs$lang$protocol_mask$partition0$ & 524288;
          if(or__3824__auto____7061) {
            return or__3824__auto____7061
          }else {
            return G__7059__7060.cljs$core$IReduce$
          }
        }()) {
          return true
        }else {
          if(!G__7059__7060.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__7059__7060)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__7059__7060)
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
  var this__7062 = this;
  return this__7062.val
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
    var G__7063__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, _PLUS_, x + y, more)
    };
    var G__7063 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7063__delegate.call(this, x, y, more)
    };
    G__7063.cljs$lang$maxFixedArity = 2;
    G__7063.cljs$lang$applyTo = function(arglist__7064) {
      var x = cljs.core.first(arglist__7064);
      var y = cljs.core.first(cljs.core.next(arglist__7064));
      var more = cljs.core.rest(cljs.core.next(arglist__7064));
      return G__7063__delegate(x, y, more)
    };
    G__7063.cljs$lang$arity$variadic = G__7063__delegate;
    return G__7063
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
    var G__7065__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, _, x - y, more)
    };
    var G__7065 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7065__delegate.call(this, x, y, more)
    };
    G__7065.cljs$lang$maxFixedArity = 2;
    G__7065.cljs$lang$applyTo = function(arglist__7066) {
      var x = cljs.core.first(arglist__7066);
      var y = cljs.core.first(cljs.core.next(arglist__7066));
      var more = cljs.core.rest(cljs.core.next(arglist__7066));
      return G__7065__delegate(x, y, more)
    };
    G__7065.cljs$lang$arity$variadic = G__7065__delegate;
    return G__7065
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
    var G__7067__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, _STAR_, x * y, more)
    };
    var G__7067 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7067__delegate.call(this, x, y, more)
    };
    G__7067.cljs$lang$maxFixedArity = 2;
    G__7067.cljs$lang$applyTo = function(arglist__7068) {
      var x = cljs.core.first(arglist__7068);
      var y = cljs.core.first(cljs.core.next(arglist__7068));
      var more = cljs.core.rest(cljs.core.next(arglist__7068));
      return G__7067__delegate(x, y, more)
    };
    G__7067.cljs$lang$arity$variadic = G__7067__delegate;
    return G__7067
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
    var G__7069__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, _SLASH_, _SLASH_.call(null, x, y), more)
    };
    var G__7069 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7069__delegate.call(this, x, y, more)
    };
    G__7069.cljs$lang$maxFixedArity = 2;
    G__7069.cljs$lang$applyTo = function(arglist__7070) {
      var x = cljs.core.first(arglist__7070);
      var y = cljs.core.first(cljs.core.next(arglist__7070));
      var more = cljs.core.rest(cljs.core.next(arglist__7070));
      return G__7069__delegate(x, y, more)
    };
    G__7069.cljs$lang$arity$variadic = G__7069__delegate;
    return G__7069
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
    var G__7071__delegate = function(x, y, more) {
      while(true) {
        if(x < y) {
          if(cljs.core.next.call(null, more)) {
            var G__7072 = y;
            var G__7073 = cljs.core.first.call(null, more);
            var G__7074 = cljs.core.next.call(null, more);
            x = G__7072;
            y = G__7073;
            more = G__7074;
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
    var G__7071 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7071__delegate.call(this, x, y, more)
    };
    G__7071.cljs$lang$maxFixedArity = 2;
    G__7071.cljs$lang$applyTo = function(arglist__7075) {
      var x = cljs.core.first(arglist__7075);
      var y = cljs.core.first(cljs.core.next(arglist__7075));
      var more = cljs.core.rest(cljs.core.next(arglist__7075));
      return G__7071__delegate(x, y, more)
    };
    G__7071.cljs$lang$arity$variadic = G__7071__delegate;
    return G__7071
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
    var G__7076__delegate = function(x, y, more) {
      while(true) {
        if(x <= y) {
          if(cljs.core.next.call(null, more)) {
            var G__7077 = y;
            var G__7078 = cljs.core.first.call(null, more);
            var G__7079 = cljs.core.next.call(null, more);
            x = G__7077;
            y = G__7078;
            more = G__7079;
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
    var G__7076 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7076__delegate.call(this, x, y, more)
    };
    G__7076.cljs$lang$maxFixedArity = 2;
    G__7076.cljs$lang$applyTo = function(arglist__7080) {
      var x = cljs.core.first(arglist__7080);
      var y = cljs.core.first(cljs.core.next(arglist__7080));
      var more = cljs.core.rest(cljs.core.next(arglist__7080));
      return G__7076__delegate(x, y, more)
    };
    G__7076.cljs$lang$arity$variadic = G__7076__delegate;
    return G__7076
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
    var G__7081__delegate = function(x, y, more) {
      while(true) {
        if(x > y) {
          if(cljs.core.next.call(null, more)) {
            var G__7082 = y;
            var G__7083 = cljs.core.first.call(null, more);
            var G__7084 = cljs.core.next.call(null, more);
            x = G__7082;
            y = G__7083;
            more = G__7084;
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
    var G__7081 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7081__delegate.call(this, x, y, more)
    };
    G__7081.cljs$lang$maxFixedArity = 2;
    G__7081.cljs$lang$applyTo = function(arglist__7085) {
      var x = cljs.core.first(arglist__7085);
      var y = cljs.core.first(cljs.core.next(arglist__7085));
      var more = cljs.core.rest(cljs.core.next(arglist__7085));
      return G__7081__delegate(x, y, more)
    };
    G__7081.cljs$lang$arity$variadic = G__7081__delegate;
    return G__7081
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
    var G__7086__delegate = function(x, y, more) {
      while(true) {
        if(x >= y) {
          if(cljs.core.next.call(null, more)) {
            var G__7087 = y;
            var G__7088 = cljs.core.first.call(null, more);
            var G__7089 = cljs.core.next.call(null, more);
            x = G__7087;
            y = G__7088;
            more = G__7089;
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
    var G__7086 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7086__delegate.call(this, x, y, more)
    };
    G__7086.cljs$lang$maxFixedArity = 2;
    G__7086.cljs$lang$applyTo = function(arglist__7090) {
      var x = cljs.core.first(arglist__7090);
      var y = cljs.core.first(cljs.core.next(arglist__7090));
      var more = cljs.core.rest(cljs.core.next(arglist__7090));
      return G__7086__delegate(x, y, more)
    };
    G__7086.cljs$lang$arity$variadic = G__7086__delegate;
    return G__7086
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
    var G__7091__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, max, x > y ? x : y, more)
    };
    var G__7091 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7091__delegate.call(this, x, y, more)
    };
    G__7091.cljs$lang$maxFixedArity = 2;
    G__7091.cljs$lang$applyTo = function(arglist__7092) {
      var x = cljs.core.first(arglist__7092);
      var y = cljs.core.first(cljs.core.next(arglist__7092));
      var more = cljs.core.rest(cljs.core.next(arglist__7092));
      return G__7091__delegate(x, y, more)
    };
    G__7091.cljs$lang$arity$variadic = G__7091__delegate;
    return G__7091
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
    var G__7093__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, min, x < y ? x : y, more)
    };
    var G__7093 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7093__delegate.call(this, x, y, more)
    };
    G__7093.cljs$lang$maxFixedArity = 2;
    G__7093.cljs$lang$applyTo = function(arglist__7094) {
      var x = cljs.core.first(arglist__7094);
      var y = cljs.core.first(cljs.core.next(arglist__7094));
      var more = cljs.core.rest(cljs.core.next(arglist__7094));
      return G__7093__delegate(x, y, more)
    };
    G__7093.cljs$lang$arity$variadic = G__7093__delegate;
    return G__7093
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
  var rem__7096 = n % d;
  return cljs.core.fix.call(null, (n - rem__7096) / d)
};
cljs.core.rem = function rem(n, d) {
  var q__7098 = cljs.core.quot.call(null, n, d);
  return n - d * q__7098
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
  var v__7101 = v - (v >> 1 & 1431655765);
  var v__7102 = (v__7101 & 858993459) + (v__7101 >> 2 & 858993459);
  return(v__7102 + (v__7102 >> 4) & 252645135) * 16843009 >> 24
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
    var G__7103__delegate = function(x, y, more) {
      while(true) {
        if(cljs.core.truth_(_EQ__EQ_.call(null, x, y))) {
          if(cljs.core.next.call(null, more)) {
            var G__7104 = y;
            var G__7105 = cljs.core.first.call(null, more);
            var G__7106 = cljs.core.next.call(null, more);
            x = G__7104;
            y = G__7105;
            more = G__7106;
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
    var G__7103 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7103__delegate.call(this, x, y, more)
    };
    G__7103.cljs$lang$maxFixedArity = 2;
    G__7103.cljs$lang$applyTo = function(arglist__7107) {
      var x = cljs.core.first(arglist__7107);
      var y = cljs.core.first(cljs.core.next(arglist__7107));
      var more = cljs.core.rest(cljs.core.next(arglist__7107));
      return G__7103__delegate(x, y, more)
    };
    G__7103.cljs$lang$arity$variadic = G__7103__delegate;
    return G__7103
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
  var n__7111 = n;
  var xs__7112 = cljs.core.seq.call(null, coll);
  while(true) {
    if(cljs.core.truth_(function() {
      var and__3822__auto____7113 = xs__7112;
      if(and__3822__auto____7113) {
        return n__7111 > 0
      }else {
        return and__3822__auto____7113
      }
    }())) {
      var G__7114 = n__7111 - 1;
      var G__7115 = cljs.core.next.call(null, xs__7112);
      n__7111 = G__7114;
      xs__7112 = G__7115;
      continue
    }else {
      return xs__7112
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
    var G__7116__delegate = function(x, ys) {
      return function(sb, more) {
        while(true) {
          if(cljs.core.truth_(more)) {
            var G__7117 = sb.append(str_STAR_.call(null, cljs.core.first.call(null, more)));
            var G__7118 = cljs.core.next.call(null, more);
            sb = G__7117;
            more = G__7118;
            continue
          }else {
            return str_STAR_.call(null, sb)
          }
          break
        }
      }.call(null, new goog.string.StringBuffer(str_STAR_.call(null, x)), ys)
    };
    var G__7116 = function(x, var_args) {
      var ys = null;
      if(goog.isDef(var_args)) {
        ys = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__7116__delegate.call(this, x, ys)
    };
    G__7116.cljs$lang$maxFixedArity = 1;
    G__7116.cljs$lang$applyTo = function(arglist__7119) {
      var x = cljs.core.first(arglist__7119);
      var ys = cljs.core.rest(arglist__7119);
      return G__7116__delegate(x, ys)
    };
    G__7116.cljs$lang$arity$variadic = G__7116__delegate;
    return G__7116
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
    var G__7120__delegate = function(x, ys) {
      return function(sb, more) {
        while(true) {
          if(cljs.core.truth_(more)) {
            var G__7121 = sb.append(str.call(null, cljs.core.first.call(null, more)));
            var G__7122 = cljs.core.next.call(null, more);
            sb = G__7121;
            more = G__7122;
            continue
          }else {
            return cljs.core.str_STAR_.call(null, sb)
          }
          break
        }
      }.call(null, new goog.string.StringBuffer(str.call(null, x)), ys)
    };
    var G__7120 = function(x, var_args) {
      var ys = null;
      if(goog.isDef(var_args)) {
        ys = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__7120__delegate.call(this, x, ys)
    };
    G__7120.cljs$lang$maxFixedArity = 1;
    G__7120.cljs$lang$applyTo = function(arglist__7123) {
      var x = cljs.core.first(arglist__7123);
      var ys = cljs.core.rest(arglist__7123);
      return G__7120__delegate(x, ys)
    };
    G__7120.cljs$lang$arity$variadic = G__7120__delegate;
    return G__7120
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
  format.cljs$lang$applyTo = function(arglist__7124) {
    var fmt = cljs.core.first(arglist__7124);
    var args = cljs.core.rest(arglist__7124);
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
    var xs__7127 = cljs.core.seq.call(null, x);
    var ys__7128 = cljs.core.seq.call(null, y);
    while(true) {
      if(xs__7127 == null) {
        return ys__7128 == null
      }else {
        if(ys__7128 == null) {
          return false
        }else {
          if(cljs.core._EQ_.call(null, cljs.core.first.call(null, xs__7127), cljs.core.first.call(null, ys__7128))) {
            var G__7129 = cljs.core.next.call(null, xs__7127);
            var G__7130 = cljs.core.next.call(null, ys__7128);
            xs__7127 = G__7129;
            ys__7128 = G__7130;
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
  return cljs.core.reduce.call(null, function(p1__7131_SHARP_, p2__7132_SHARP_) {
    return cljs.core.hash_combine.call(null, p1__7131_SHARP_, cljs.core.hash.call(null, p2__7132_SHARP_, false))
  }, cljs.core.hash.call(null, cljs.core.first.call(null, coll), false), cljs.core.next.call(null, coll))
};
cljs.core.hash_imap = function hash_imap(m) {
  var h__7136 = 0;
  var s__7137 = cljs.core.seq.call(null, m);
  while(true) {
    if(s__7137) {
      var e__7138 = cljs.core.first.call(null, s__7137);
      var G__7139 = (h__7136 + (cljs.core.hash.call(null, cljs.core.key.call(null, e__7138)) ^ cljs.core.hash.call(null, cljs.core.val.call(null, e__7138)))) % 4503599627370496;
      var G__7140 = cljs.core.next.call(null, s__7137);
      h__7136 = G__7139;
      s__7137 = G__7140;
      continue
    }else {
      return h__7136
    }
    break
  }
};
cljs.core.hash_iset = function hash_iset(s) {
  var h__7144 = 0;
  var s__7145 = cljs.core.seq.call(null, s);
  while(true) {
    if(s__7145) {
      var e__7146 = cljs.core.first.call(null, s__7145);
      var G__7147 = (h__7144 + cljs.core.hash.call(null, e__7146)) % 4503599627370496;
      var G__7148 = cljs.core.next.call(null, s__7145);
      h__7144 = G__7147;
      s__7145 = G__7148;
      continue
    }else {
      return h__7144
    }
    break
  }
};
cljs.core.extend_object_BANG_ = function extend_object_BANG_(obj, fn_map) {
  var G__7169__7170 = cljs.core.seq.call(null, fn_map);
  if(G__7169__7170) {
    var G__7172__7174 = cljs.core.first.call(null, G__7169__7170);
    var vec__7173__7175 = G__7172__7174;
    var key_name__7176 = cljs.core.nth.call(null, vec__7173__7175, 0, null);
    var f__7177 = cljs.core.nth.call(null, vec__7173__7175, 1, null);
    var G__7169__7178 = G__7169__7170;
    var G__7172__7179 = G__7172__7174;
    var G__7169__7180 = G__7169__7178;
    while(true) {
      var vec__7181__7182 = G__7172__7179;
      var key_name__7183 = cljs.core.nth.call(null, vec__7181__7182, 0, null);
      var f__7184 = cljs.core.nth.call(null, vec__7181__7182, 1, null);
      var G__7169__7185 = G__7169__7180;
      var str_name__7186 = cljs.core.name.call(null, key_name__7183);
      obj[str_name__7186] = f__7184;
      var temp__3974__auto____7187 = cljs.core.next.call(null, G__7169__7185);
      if(temp__3974__auto____7187) {
        var G__7169__7188 = temp__3974__auto____7187;
        var G__7189 = cljs.core.first.call(null, G__7169__7188);
        var G__7190 = G__7169__7188;
        G__7172__7179 = G__7189;
        G__7169__7180 = G__7190;
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
  var this__7191 = this;
  var h__2194__auto____7192 = this__7191.__hash;
  if(!(h__2194__auto____7192 == null)) {
    return h__2194__auto____7192
  }else {
    var h__2194__auto____7193 = cljs.core.hash_coll.call(null, coll);
    this__7191.__hash = h__2194__auto____7193;
    return h__2194__auto____7193
  }
};
cljs.core.List.prototype.cljs$core$INext$_next$arity$1 = function(coll) {
  var this__7194 = this;
  if(this__7194.count === 1) {
    return null
  }else {
    return this__7194.rest
  }
};
cljs.core.List.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__7195 = this;
  return new cljs.core.List(this__7195.meta, o, coll, this__7195.count + 1, null)
};
cljs.core.List.prototype.toString = function() {
  var this__7196 = this;
  var this__7197 = this;
  return cljs.core.pr_str.call(null, this__7197)
};
cljs.core.List.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__7198 = this;
  return coll
};
cljs.core.List.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__7199 = this;
  return this__7199.count
};
cljs.core.List.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__7200 = this;
  return this__7200.first
};
cljs.core.List.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__7201 = this;
  return coll.cljs$core$ISeq$_rest$arity$1(coll)
};
cljs.core.List.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__7202 = this;
  return this__7202.first
};
cljs.core.List.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__7203 = this;
  if(this__7203.count === 1) {
    return cljs.core.List.EMPTY
  }else {
    return this__7203.rest
  }
};
cljs.core.List.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__7204 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.List.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__7205 = this;
  return new cljs.core.List(meta, this__7205.first, this__7205.rest, this__7205.count, this__7205.__hash)
};
cljs.core.List.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__7206 = this;
  return this__7206.meta
};
cljs.core.List.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__7207 = this;
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
  var this__7208 = this;
  return 0
};
cljs.core.EmptyList.prototype.cljs$core$INext$_next$arity$1 = function(coll) {
  var this__7209 = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__7210 = this;
  return new cljs.core.List(this__7210.meta, o, null, 1, null)
};
cljs.core.EmptyList.prototype.toString = function() {
  var this__7211 = this;
  var this__7212 = this;
  return cljs.core.pr_str.call(null, this__7212)
};
cljs.core.EmptyList.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__7213 = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__7214 = this;
  return 0
};
cljs.core.EmptyList.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__7215 = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__7216 = this;
  throw new Error("Can't pop empty list");
};
cljs.core.EmptyList.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__7217 = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__7218 = this;
  return cljs.core.List.EMPTY
};
cljs.core.EmptyList.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__7219 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.EmptyList.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__7220 = this;
  return new cljs.core.EmptyList(meta)
};
cljs.core.EmptyList.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__7221 = this;
  return this__7221.meta
};
cljs.core.EmptyList.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__7222 = this;
  return coll
};
cljs.core.EmptyList;
cljs.core.List.EMPTY = new cljs.core.EmptyList(null);
cljs.core.reversible_QMARK_ = function reversible_QMARK_(coll) {
  var G__7226__7227 = coll;
  if(G__7226__7227) {
    if(function() {
      var or__3824__auto____7228 = G__7226__7227.cljs$lang$protocol_mask$partition0$ & 134217728;
      if(or__3824__auto____7228) {
        return or__3824__auto____7228
      }else {
        return G__7226__7227.cljs$core$IReversible$
      }
    }()) {
      return true
    }else {
      if(!G__7226__7227.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IReversible, G__7226__7227)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IReversible, G__7226__7227)
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
    var G__7229__delegate = function(x, y, z, items) {
      return cljs.core.conj.call(null, cljs.core.conj.call(null, cljs.core.conj.call(null, cljs.core.reduce.call(null, cljs.core.conj, cljs.core.List.EMPTY, cljs.core.reverse.call(null, items)), z), y), x)
    };
    var G__7229 = function(x, y, z, var_args) {
      var items = null;
      if(goog.isDef(var_args)) {
        items = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__7229__delegate.call(this, x, y, z, items)
    };
    G__7229.cljs$lang$maxFixedArity = 3;
    G__7229.cljs$lang$applyTo = function(arglist__7230) {
      var x = cljs.core.first(arglist__7230);
      var y = cljs.core.first(cljs.core.next(arglist__7230));
      var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7230)));
      var items = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__7230)));
      return G__7229__delegate(x, y, z, items)
    };
    G__7229.cljs$lang$arity$variadic = G__7229__delegate;
    return G__7229
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
  var this__7231 = this;
  var h__2194__auto____7232 = this__7231.__hash;
  if(!(h__2194__auto____7232 == null)) {
    return h__2194__auto____7232
  }else {
    var h__2194__auto____7233 = cljs.core.hash_coll.call(null, coll);
    this__7231.__hash = h__2194__auto____7233;
    return h__2194__auto____7233
  }
};
cljs.core.Cons.prototype.cljs$core$INext$_next$arity$1 = function(coll) {
  var this__7234 = this;
  if(this__7234.rest == null) {
    return null
  }else {
    return cljs.core._seq.call(null, this__7234.rest)
  }
};
cljs.core.Cons.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__7235 = this;
  return new cljs.core.Cons(null, o, coll, this__7235.__hash)
};
cljs.core.Cons.prototype.toString = function() {
  var this__7236 = this;
  var this__7237 = this;
  return cljs.core.pr_str.call(null, this__7237)
};
cljs.core.Cons.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__7238 = this;
  return coll
};
cljs.core.Cons.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__7239 = this;
  return this__7239.first
};
cljs.core.Cons.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__7240 = this;
  if(this__7240.rest == null) {
    return cljs.core.List.EMPTY
  }else {
    return this__7240.rest
  }
};
cljs.core.Cons.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__7241 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.Cons.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__7242 = this;
  return new cljs.core.Cons(meta, this__7242.first, this__7242.rest, this__7242.__hash)
};
cljs.core.Cons.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__7243 = this;
  return this__7243.meta
};
cljs.core.Cons.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__7244 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__7244.meta)
};
cljs.core.Cons;
cljs.core.cons = function cons(x, coll) {
  if(function() {
    var or__3824__auto____7249 = coll == null;
    if(or__3824__auto____7249) {
      return or__3824__auto____7249
    }else {
      var G__7250__7251 = coll;
      if(G__7250__7251) {
        if(function() {
          var or__3824__auto____7252 = G__7250__7251.cljs$lang$protocol_mask$partition0$ & 64;
          if(or__3824__auto____7252) {
            return or__3824__auto____7252
          }else {
            return G__7250__7251.cljs$core$ISeq$
          }
        }()) {
          return true
        }else {
          if(!G__7250__7251.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__7250__7251)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__7250__7251)
      }
    }
  }()) {
    return new cljs.core.Cons(null, x, coll, null)
  }else {
    return new cljs.core.Cons(null, x, cljs.core.seq.call(null, coll), null)
  }
};
cljs.core.list_QMARK_ = function list_QMARK_(x) {
  var G__7256__7257 = x;
  if(G__7256__7257) {
    if(function() {
      var or__3824__auto____7258 = G__7256__7257.cljs$lang$protocol_mask$partition0$ & 33554432;
      if(or__3824__auto____7258) {
        return or__3824__auto____7258
      }else {
        return G__7256__7257.cljs$core$IList$
      }
    }()) {
      return true
    }else {
      if(!G__7256__7257.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IList, G__7256__7257)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IList, G__7256__7257)
  }
};
cljs.core.IReduce["string"] = true;
cljs.core._reduce["string"] = function() {
  var G__7259 = null;
  var G__7259__2 = function(string, f) {
    return cljs.core.ci_reduce.call(null, string, f)
  };
  var G__7259__3 = function(string, f, start) {
    return cljs.core.ci_reduce.call(null, string, f, start)
  };
  G__7259 = function(string, f, start) {
    switch(arguments.length) {
      case 2:
        return G__7259__2.call(this, string, f);
      case 3:
        return G__7259__3.call(this, string, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__7259
}();
cljs.core.ILookup["string"] = true;
cljs.core._lookup["string"] = function() {
  var G__7260 = null;
  var G__7260__2 = function(string, k) {
    return cljs.core._nth.call(null, string, k)
  };
  var G__7260__3 = function(string, k, not_found) {
    return cljs.core._nth.call(null, string, k, not_found)
  };
  G__7260 = function(string, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__7260__2.call(this, string, k);
      case 3:
        return G__7260__3.call(this, string, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__7260
}();
cljs.core.IIndexed["string"] = true;
cljs.core._nth["string"] = function() {
  var G__7261 = null;
  var G__7261__2 = function(string, n) {
    if(n < cljs.core._count.call(null, string)) {
      return string.charAt(n)
    }else {
      return null
    }
  };
  var G__7261__3 = function(string, n, not_found) {
    if(n < cljs.core._count.call(null, string)) {
      return string.charAt(n)
    }else {
      return not_found
    }
  };
  G__7261 = function(string, n, not_found) {
    switch(arguments.length) {
      case 2:
        return G__7261__2.call(this, string, n);
      case 3:
        return G__7261__3.call(this, string, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__7261
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
  var G__7273 = null;
  var G__7273__2 = function(this_sym7264, coll) {
    var this__7266 = this;
    var this_sym7264__7267 = this;
    var ___7268 = this_sym7264__7267;
    if(coll == null) {
      return null
    }else {
      var strobj__7269 = coll.strobj;
      if(strobj__7269 == null) {
        return cljs.core._lookup.call(null, coll, this__7266.k, null)
      }else {
        return strobj__7269[this__7266.k]
      }
    }
  };
  var G__7273__3 = function(this_sym7265, coll, not_found) {
    var this__7266 = this;
    var this_sym7265__7270 = this;
    var ___7271 = this_sym7265__7270;
    if(coll == null) {
      return not_found
    }else {
      return cljs.core._lookup.call(null, coll, this__7266.k, not_found)
    }
  };
  G__7273 = function(this_sym7265, coll, not_found) {
    switch(arguments.length) {
      case 2:
        return G__7273__2.call(this, this_sym7265, coll);
      case 3:
        return G__7273__3.call(this, this_sym7265, coll, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__7273
}();
cljs.core.Keyword.prototype.apply = function(this_sym7262, args7263) {
  var this__7272 = this;
  return this_sym7262.call.apply(this_sym7262, [this_sym7262].concat(args7263.slice()))
};
cljs.core.Keyword;
String.prototype.cljs$core$IFn$ = true;
String.prototype.call = function() {
  var G__7282 = null;
  var G__7282__2 = function(this_sym7276, coll) {
    var this_sym7276__7278 = this;
    var this__7279 = this_sym7276__7278;
    return cljs.core._lookup.call(null, coll, this__7279.toString(), null)
  };
  var G__7282__3 = function(this_sym7277, coll, not_found) {
    var this_sym7277__7280 = this;
    var this__7281 = this_sym7277__7280;
    return cljs.core._lookup.call(null, coll, this__7281.toString(), not_found)
  };
  G__7282 = function(this_sym7277, coll, not_found) {
    switch(arguments.length) {
      case 2:
        return G__7282__2.call(this, this_sym7277, coll);
      case 3:
        return G__7282__3.call(this, this_sym7277, coll, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__7282
}();
String.prototype.apply = function(this_sym7274, args7275) {
  return this_sym7274.call.apply(this_sym7274, [this_sym7274].concat(args7275.slice()))
};
String.prototype.apply = function(s, args) {
  if(cljs.core.count.call(null, args) < 2) {
    return cljs.core._lookup.call(null, args[0], s, null)
  }else {
    return cljs.core._lookup.call(null, args[0], s, args[1])
  }
};
cljs.core.lazy_seq_value = function lazy_seq_value(lazy_seq) {
  var x__7284 = lazy_seq.x;
  if(lazy_seq.realized) {
    return x__7284
  }else {
    lazy_seq.x = x__7284.call(null);
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
  var this__7285 = this;
  var h__2194__auto____7286 = this__7285.__hash;
  if(!(h__2194__auto____7286 == null)) {
    return h__2194__auto____7286
  }else {
    var h__2194__auto____7287 = cljs.core.hash_coll.call(null, coll);
    this__7285.__hash = h__2194__auto____7287;
    return h__2194__auto____7287
  }
};
cljs.core.LazySeq.prototype.cljs$core$INext$_next$arity$1 = function(coll) {
  var this__7288 = this;
  return cljs.core._seq.call(null, coll.cljs$core$ISeq$_rest$arity$1(coll))
};
cljs.core.LazySeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__7289 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.LazySeq.prototype.toString = function() {
  var this__7290 = this;
  var this__7291 = this;
  return cljs.core.pr_str.call(null, this__7291)
};
cljs.core.LazySeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__7292 = this;
  return cljs.core.seq.call(null, cljs.core.lazy_seq_value.call(null, coll))
};
cljs.core.LazySeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__7293 = this;
  return cljs.core.first.call(null, cljs.core.lazy_seq_value.call(null, coll))
};
cljs.core.LazySeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__7294 = this;
  return cljs.core.rest.call(null, cljs.core.lazy_seq_value.call(null, coll))
};
cljs.core.LazySeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__7295 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.LazySeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__7296 = this;
  return new cljs.core.LazySeq(meta, this__7296.realized, this__7296.x, this__7296.__hash)
};
cljs.core.LazySeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__7297 = this;
  return this__7297.meta
};
cljs.core.LazySeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__7298 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__7298.meta)
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
  var this__7299 = this;
  return this__7299.end
};
cljs.core.ChunkBuffer.prototype.add = function(o) {
  var this__7300 = this;
  var ___7301 = this;
  this__7300.buf[this__7300.end] = o;
  return this__7300.end = this__7300.end + 1
};
cljs.core.ChunkBuffer.prototype.chunk = function(o) {
  var this__7302 = this;
  var ___7303 = this;
  var ret__7304 = new cljs.core.ArrayChunk(this__7302.buf, 0, this__7302.end);
  this__7302.buf = null;
  return ret__7304
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
  var this__7305 = this;
  return cljs.core.ci_reduce.call(null, coll, f, this__7305.arr[this__7305.off], this__7305.off + 1)
};
cljs.core.ArrayChunk.prototype.cljs$core$IReduce$_reduce$arity$3 = function(coll, f, start) {
  var this__7306 = this;
  return cljs.core.ci_reduce.call(null, coll, f, start, this__7306.off)
};
cljs.core.ArrayChunk.prototype.cljs$core$IChunk$ = true;
cljs.core.ArrayChunk.prototype.cljs$core$IChunk$_drop_first$arity$1 = function(coll) {
  var this__7307 = this;
  if(this__7307.off === this__7307.end) {
    throw new Error("-drop-first of empty chunk");
  }else {
    return new cljs.core.ArrayChunk(this__7307.arr, this__7307.off + 1, this__7307.end)
  }
};
cljs.core.ArrayChunk.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, i) {
  var this__7308 = this;
  return this__7308.arr[this__7308.off + i]
};
cljs.core.ArrayChunk.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, i, not_found) {
  var this__7309 = this;
  if(function() {
    var and__3822__auto____7310 = i >= 0;
    if(and__3822__auto____7310) {
      return i < this__7309.end - this__7309.off
    }else {
      return and__3822__auto____7310
    }
  }()) {
    return this__7309.arr[this__7309.off + i]
  }else {
    return not_found
  }
};
cljs.core.ArrayChunk.prototype.cljs$core$ICounted$_count$arity$1 = function(_) {
  var this__7311 = this;
  return this__7311.end - this__7311.off
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
  var this__7312 = this;
  return cljs.core.cons.call(null, o, this$)
};
cljs.core.ChunkedCons.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__7313 = this;
  return coll
};
cljs.core.ChunkedCons.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__7314 = this;
  return cljs.core._nth.call(null, this__7314.chunk, 0)
};
cljs.core.ChunkedCons.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__7315 = this;
  if(cljs.core._count.call(null, this__7315.chunk) > 1) {
    return new cljs.core.ChunkedCons(cljs.core._drop_first.call(null, this__7315.chunk), this__7315.more, this__7315.meta)
  }else {
    if(this__7315.more == null) {
      return cljs.core.List.EMPTY
    }else {
      return this__7315.more
    }
  }
};
cljs.core.ChunkedCons.prototype.cljs$core$IChunkedNext$ = true;
cljs.core.ChunkedCons.prototype.cljs$core$IChunkedNext$_chunked_next$arity$1 = function(coll) {
  var this__7316 = this;
  if(this__7316.more == null) {
    return null
  }else {
    return this__7316.more
  }
};
cljs.core.ChunkedCons.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__7317 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.ChunkedCons.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, m) {
  var this__7318 = this;
  return new cljs.core.ChunkedCons(this__7318.chunk, this__7318.more, m)
};
cljs.core.ChunkedCons.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__7319 = this;
  return this__7319.meta
};
cljs.core.ChunkedCons.prototype.cljs$core$IChunkedSeq$ = true;
cljs.core.ChunkedCons.prototype.cljs$core$IChunkedSeq$_chunked_first$arity$1 = function(coll) {
  var this__7320 = this;
  return this__7320.chunk
};
cljs.core.ChunkedCons.prototype.cljs$core$IChunkedSeq$_chunked_rest$arity$1 = function(coll) {
  var this__7321 = this;
  if(this__7321.more == null) {
    return cljs.core.List.EMPTY
  }else {
    return this__7321.more
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
    var G__7325__7326 = s;
    if(G__7325__7326) {
      if(cljs.core.truth_(function() {
        var or__3824__auto____7327 = null;
        if(cljs.core.truth_(or__3824__auto____7327)) {
          return or__3824__auto____7327
        }else {
          return G__7325__7326.cljs$core$IChunkedNext$
        }
      }())) {
        return true
      }else {
        if(!G__7325__7326.cljs$lang$protocol_mask$partition$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.IChunkedNext, G__7325__7326)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.IChunkedNext, G__7325__7326)
    }
  }()) {
    return cljs.core._chunked_next.call(null, s)
  }else {
    return cljs.core.seq.call(null, cljs.core._chunked_rest.call(null, s))
  }
};
cljs.core.to_array = function to_array(s) {
  var ary__7330 = [];
  var s__7331 = s;
  while(true) {
    if(cljs.core.seq.call(null, s__7331)) {
      ary__7330.push(cljs.core.first.call(null, s__7331));
      var G__7332 = cljs.core.next.call(null, s__7331);
      s__7331 = G__7332;
      continue
    }else {
      return ary__7330
    }
    break
  }
};
cljs.core.to_array_2d = function to_array_2d(coll) {
  var ret__7336 = cljs.core.make_array.call(null, cljs.core.count.call(null, coll));
  var i__7337 = 0;
  var xs__7338 = cljs.core.seq.call(null, coll);
  while(true) {
    if(xs__7338) {
      ret__7336[i__7337] = cljs.core.to_array.call(null, cljs.core.first.call(null, xs__7338));
      var G__7339 = i__7337 + 1;
      var G__7340 = cljs.core.next.call(null, xs__7338);
      i__7337 = G__7339;
      xs__7338 = G__7340;
      continue
    }else {
    }
    break
  }
  return ret__7336
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
    var a__7348 = cljs.core.make_array.call(null, size);
    if(cljs.core.seq_QMARK_.call(null, init_val_or_seq)) {
      var s__7349 = cljs.core.seq.call(null, init_val_or_seq);
      var i__7350 = 0;
      var s__7351 = s__7349;
      while(true) {
        if(cljs.core.truth_(function() {
          var and__3822__auto____7352 = s__7351;
          if(and__3822__auto____7352) {
            return i__7350 < size
          }else {
            return and__3822__auto____7352
          }
        }())) {
          a__7348[i__7350] = cljs.core.first.call(null, s__7351);
          var G__7355 = i__7350 + 1;
          var G__7356 = cljs.core.next.call(null, s__7351);
          i__7350 = G__7355;
          s__7351 = G__7356;
          continue
        }else {
          return a__7348
        }
        break
      }
    }else {
      var n__2529__auto____7353 = size;
      var i__7354 = 0;
      while(true) {
        if(i__7354 < n__2529__auto____7353) {
          a__7348[i__7354] = init_val_or_seq;
          var G__7357 = i__7354 + 1;
          i__7354 = G__7357;
          continue
        }else {
        }
        break
      }
      return a__7348
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
    var a__7365 = cljs.core.make_array.call(null, size);
    if(cljs.core.seq_QMARK_.call(null, init_val_or_seq)) {
      var s__7366 = cljs.core.seq.call(null, init_val_or_seq);
      var i__7367 = 0;
      var s__7368 = s__7366;
      while(true) {
        if(cljs.core.truth_(function() {
          var and__3822__auto____7369 = s__7368;
          if(and__3822__auto____7369) {
            return i__7367 < size
          }else {
            return and__3822__auto____7369
          }
        }())) {
          a__7365[i__7367] = cljs.core.first.call(null, s__7368);
          var G__7372 = i__7367 + 1;
          var G__7373 = cljs.core.next.call(null, s__7368);
          i__7367 = G__7372;
          s__7368 = G__7373;
          continue
        }else {
          return a__7365
        }
        break
      }
    }else {
      var n__2529__auto____7370 = size;
      var i__7371 = 0;
      while(true) {
        if(i__7371 < n__2529__auto____7370) {
          a__7365[i__7371] = init_val_or_seq;
          var G__7374 = i__7371 + 1;
          i__7371 = G__7374;
          continue
        }else {
        }
        break
      }
      return a__7365
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
    var a__7382 = cljs.core.make_array.call(null, size);
    if(cljs.core.seq_QMARK_.call(null, init_val_or_seq)) {
      var s__7383 = cljs.core.seq.call(null, init_val_or_seq);
      var i__7384 = 0;
      var s__7385 = s__7383;
      while(true) {
        if(cljs.core.truth_(function() {
          var and__3822__auto____7386 = s__7385;
          if(and__3822__auto____7386) {
            return i__7384 < size
          }else {
            return and__3822__auto____7386
          }
        }())) {
          a__7382[i__7384] = cljs.core.first.call(null, s__7385);
          var G__7389 = i__7384 + 1;
          var G__7390 = cljs.core.next.call(null, s__7385);
          i__7384 = G__7389;
          s__7385 = G__7390;
          continue
        }else {
          return a__7382
        }
        break
      }
    }else {
      var n__2529__auto____7387 = size;
      var i__7388 = 0;
      while(true) {
        if(i__7388 < n__2529__auto____7387) {
          a__7382[i__7388] = init_val_or_seq;
          var G__7391 = i__7388 + 1;
          i__7388 = G__7391;
          continue
        }else {
        }
        break
      }
      return a__7382
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
    var s__7396 = s;
    var i__7397 = n;
    var sum__7398 = 0;
    while(true) {
      if(cljs.core.truth_(function() {
        var and__3822__auto____7399 = i__7397 > 0;
        if(and__3822__auto____7399) {
          return cljs.core.seq.call(null, s__7396)
        }else {
          return and__3822__auto____7399
        }
      }())) {
        var G__7400 = cljs.core.next.call(null, s__7396);
        var G__7401 = i__7397 - 1;
        var G__7402 = sum__7398 + 1;
        s__7396 = G__7400;
        i__7397 = G__7401;
        sum__7398 = G__7402;
        continue
      }else {
        return sum__7398
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
      var s__7407 = cljs.core.seq.call(null, x);
      if(s__7407) {
        if(cljs.core.chunked_seq_QMARK_.call(null, s__7407)) {
          return cljs.core.chunk_cons.call(null, cljs.core.chunk_first.call(null, s__7407), concat.call(null, cljs.core.chunk_rest.call(null, s__7407), y))
        }else {
          return cljs.core.cons.call(null, cljs.core.first.call(null, s__7407), concat.call(null, cljs.core.rest.call(null, s__7407), y))
        }
      }else {
        return y
      }
    }, null)
  };
  var concat__3 = function() {
    var G__7411__delegate = function(x, y, zs) {
      var cat__7410 = function cat(xys, zs) {
        return new cljs.core.LazySeq(null, false, function() {
          var xys__7409 = cljs.core.seq.call(null, xys);
          if(xys__7409) {
            if(cljs.core.chunked_seq_QMARK_.call(null, xys__7409)) {
              return cljs.core.chunk_cons.call(null, cljs.core.chunk_first.call(null, xys__7409), cat.call(null, cljs.core.chunk_rest.call(null, xys__7409), zs))
            }else {
              return cljs.core.cons.call(null, cljs.core.first.call(null, xys__7409), cat.call(null, cljs.core.rest.call(null, xys__7409), zs))
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
      return cat__7410.call(null, concat.call(null, x, y), zs)
    };
    var G__7411 = function(x, y, var_args) {
      var zs = null;
      if(goog.isDef(var_args)) {
        zs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7411__delegate.call(this, x, y, zs)
    };
    G__7411.cljs$lang$maxFixedArity = 2;
    G__7411.cljs$lang$applyTo = function(arglist__7412) {
      var x = cljs.core.first(arglist__7412);
      var y = cljs.core.first(cljs.core.next(arglist__7412));
      var zs = cljs.core.rest(cljs.core.next(arglist__7412));
      return G__7411__delegate(x, y, zs)
    };
    G__7411.cljs$lang$arity$variadic = G__7411__delegate;
    return G__7411
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
    var G__7413__delegate = function(a, b, c, d, more) {
      return cljs.core.cons.call(null, a, cljs.core.cons.call(null, b, cljs.core.cons.call(null, c, cljs.core.cons.call(null, d, cljs.core.spread.call(null, more)))))
    };
    var G__7413 = function(a, b, c, d, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 4), 0)
      }
      return G__7413__delegate.call(this, a, b, c, d, more)
    };
    G__7413.cljs$lang$maxFixedArity = 4;
    G__7413.cljs$lang$applyTo = function(arglist__7414) {
      var a = cljs.core.first(arglist__7414);
      var b = cljs.core.first(cljs.core.next(arglist__7414));
      var c = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7414)));
      var d = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__7414))));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(arglist__7414))));
      return G__7413__delegate(a, b, c, d, more)
    };
    G__7413.cljs$lang$arity$variadic = G__7413__delegate;
    return G__7413
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
  var args__7456 = cljs.core.seq.call(null, args);
  if(argc === 0) {
    return f.call(null)
  }else {
    var a__7457 = cljs.core._first.call(null, args__7456);
    var args__7458 = cljs.core._rest.call(null, args__7456);
    if(argc === 1) {
      if(f.cljs$lang$arity$1) {
        return f.cljs$lang$arity$1(a__7457)
      }else {
        return f.call(null, a__7457)
      }
    }else {
      var b__7459 = cljs.core._first.call(null, args__7458);
      var args__7460 = cljs.core._rest.call(null, args__7458);
      if(argc === 2) {
        if(f.cljs$lang$arity$2) {
          return f.cljs$lang$arity$2(a__7457, b__7459)
        }else {
          return f.call(null, a__7457, b__7459)
        }
      }else {
        var c__7461 = cljs.core._first.call(null, args__7460);
        var args__7462 = cljs.core._rest.call(null, args__7460);
        if(argc === 3) {
          if(f.cljs$lang$arity$3) {
            return f.cljs$lang$arity$3(a__7457, b__7459, c__7461)
          }else {
            return f.call(null, a__7457, b__7459, c__7461)
          }
        }else {
          var d__7463 = cljs.core._first.call(null, args__7462);
          var args__7464 = cljs.core._rest.call(null, args__7462);
          if(argc === 4) {
            if(f.cljs$lang$arity$4) {
              return f.cljs$lang$arity$4(a__7457, b__7459, c__7461, d__7463)
            }else {
              return f.call(null, a__7457, b__7459, c__7461, d__7463)
            }
          }else {
            var e__7465 = cljs.core._first.call(null, args__7464);
            var args__7466 = cljs.core._rest.call(null, args__7464);
            if(argc === 5) {
              if(f.cljs$lang$arity$5) {
                return f.cljs$lang$arity$5(a__7457, b__7459, c__7461, d__7463, e__7465)
              }else {
                return f.call(null, a__7457, b__7459, c__7461, d__7463, e__7465)
              }
            }else {
              var f__7467 = cljs.core._first.call(null, args__7466);
              var args__7468 = cljs.core._rest.call(null, args__7466);
              if(argc === 6) {
                if(f__7467.cljs$lang$arity$6) {
                  return f__7467.cljs$lang$arity$6(a__7457, b__7459, c__7461, d__7463, e__7465, f__7467)
                }else {
                  return f__7467.call(null, a__7457, b__7459, c__7461, d__7463, e__7465, f__7467)
                }
              }else {
                var g__7469 = cljs.core._first.call(null, args__7468);
                var args__7470 = cljs.core._rest.call(null, args__7468);
                if(argc === 7) {
                  if(f__7467.cljs$lang$arity$7) {
                    return f__7467.cljs$lang$arity$7(a__7457, b__7459, c__7461, d__7463, e__7465, f__7467, g__7469)
                  }else {
                    return f__7467.call(null, a__7457, b__7459, c__7461, d__7463, e__7465, f__7467, g__7469)
                  }
                }else {
                  var h__7471 = cljs.core._first.call(null, args__7470);
                  var args__7472 = cljs.core._rest.call(null, args__7470);
                  if(argc === 8) {
                    if(f__7467.cljs$lang$arity$8) {
                      return f__7467.cljs$lang$arity$8(a__7457, b__7459, c__7461, d__7463, e__7465, f__7467, g__7469, h__7471)
                    }else {
                      return f__7467.call(null, a__7457, b__7459, c__7461, d__7463, e__7465, f__7467, g__7469, h__7471)
                    }
                  }else {
                    var i__7473 = cljs.core._first.call(null, args__7472);
                    var args__7474 = cljs.core._rest.call(null, args__7472);
                    if(argc === 9) {
                      if(f__7467.cljs$lang$arity$9) {
                        return f__7467.cljs$lang$arity$9(a__7457, b__7459, c__7461, d__7463, e__7465, f__7467, g__7469, h__7471, i__7473)
                      }else {
                        return f__7467.call(null, a__7457, b__7459, c__7461, d__7463, e__7465, f__7467, g__7469, h__7471, i__7473)
                      }
                    }else {
                      var j__7475 = cljs.core._first.call(null, args__7474);
                      var args__7476 = cljs.core._rest.call(null, args__7474);
                      if(argc === 10) {
                        if(f__7467.cljs$lang$arity$10) {
                          return f__7467.cljs$lang$arity$10(a__7457, b__7459, c__7461, d__7463, e__7465, f__7467, g__7469, h__7471, i__7473, j__7475)
                        }else {
                          return f__7467.call(null, a__7457, b__7459, c__7461, d__7463, e__7465, f__7467, g__7469, h__7471, i__7473, j__7475)
                        }
                      }else {
                        var k__7477 = cljs.core._first.call(null, args__7476);
                        var args__7478 = cljs.core._rest.call(null, args__7476);
                        if(argc === 11) {
                          if(f__7467.cljs$lang$arity$11) {
                            return f__7467.cljs$lang$arity$11(a__7457, b__7459, c__7461, d__7463, e__7465, f__7467, g__7469, h__7471, i__7473, j__7475, k__7477)
                          }else {
                            return f__7467.call(null, a__7457, b__7459, c__7461, d__7463, e__7465, f__7467, g__7469, h__7471, i__7473, j__7475, k__7477)
                          }
                        }else {
                          var l__7479 = cljs.core._first.call(null, args__7478);
                          var args__7480 = cljs.core._rest.call(null, args__7478);
                          if(argc === 12) {
                            if(f__7467.cljs$lang$arity$12) {
                              return f__7467.cljs$lang$arity$12(a__7457, b__7459, c__7461, d__7463, e__7465, f__7467, g__7469, h__7471, i__7473, j__7475, k__7477, l__7479)
                            }else {
                              return f__7467.call(null, a__7457, b__7459, c__7461, d__7463, e__7465, f__7467, g__7469, h__7471, i__7473, j__7475, k__7477, l__7479)
                            }
                          }else {
                            var m__7481 = cljs.core._first.call(null, args__7480);
                            var args__7482 = cljs.core._rest.call(null, args__7480);
                            if(argc === 13) {
                              if(f__7467.cljs$lang$arity$13) {
                                return f__7467.cljs$lang$arity$13(a__7457, b__7459, c__7461, d__7463, e__7465, f__7467, g__7469, h__7471, i__7473, j__7475, k__7477, l__7479, m__7481)
                              }else {
                                return f__7467.call(null, a__7457, b__7459, c__7461, d__7463, e__7465, f__7467, g__7469, h__7471, i__7473, j__7475, k__7477, l__7479, m__7481)
                              }
                            }else {
                              var n__7483 = cljs.core._first.call(null, args__7482);
                              var args__7484 = cljs.core._rest.call(null, args__7482);
                              if(argc === 14) {
                                if(f__7467.cljs$lang$arity$14) {
                                  return f__7467.cljs$lang$arity$14(a__7457, b__7459, c__7461, d__7463, e__7465, f__7467, g__7469, h__7471, i__7473, j__7475, k__7477, l__7479, m__7481, n__7483)
                                }else {
                                  return f__7467.call(null, a__7457, b__7459, c__7461, d__7463, e__7465, f__7467, g__7469, h__7471, i__7473, j__7475, k__7477, l__7479, m__7481, n__7483)
                                }
                              }else {
                                var o__7485 = cljs.core._first.call(null, args__7484);
                                var args__7486 = cljs.core._rest.call(null, args__7484);
                                if(argc === 15) {
                                  if(f__7467.cljs$lang$arity$15) {
                                    return f__7467.cljs$lang$arity$15(a__7457, b__7459, c__7461, d__7463, e__7465, f__7467, g__7469, h__7471, i__7473, j__7475, k__7477, l__7479, m__7481, n__7483, o__7485)
                                  }else {
                                    return f__7467.call(null, a__7457, b__7459, c__7461, d__7463, e__7465, f__7467, g__7469, h__7471, i__7473, j__7475, k__7477, l__7479, m__7481, n__7483, o__7485)
                                  }
                                }else {
                                  var p__7487 = cljs.core._first.call(null, args__7486);
                                  var args__7488 = cljs.core._rest.call(null, args__7486);
                                  if(argc === 16) {
                                    if(f__7467.cljs$lang$arity$16) {
                                      return f__7467.cljs$lang$arity$16(a__7457, b__7459, c__7461, d__7463, e__7465, f__7467, g__7469, h__7471, i__7473, j__7475, k__7477, l__7479, m__7481, n__7483, o__7485, p__7487)
                                    }else {
                                      return f__7467.call(null, a__7457, b__7459, c__7461, d__7463, e__7465, f__7467, g__7469, h__7471, i__7473, j__7475, k__7477, l__7479, m__7481, n__7483, o__7485, p__7487)
                                    }
                                  }else {
                                    var q__7489 = cljs.core._first.call(null, args__7488);
                                    var args__7490 = cljs.core._rest.call(null, args__7488);
                                    if(argc === 17) {
                                      if(f__7467.cljs$lang$arity$17) {
                                        return f__7467.cljs$lang$arity$17(a__7457, b__7459, c__7461, d__7463, e__7465, f__7467, g__7469, h__7471, i__7473, j__7475, k__7477, l__7479, m__7481, n__7483, o__7485, p__7487, q__7489)
                                      }else {
                                        return f__7467.call(null, a__7457, b__7459, c__7461, d__7463, e__7465, f__7467, g__7469, h__7471, i__7473, j__7475, k__7477, l__7479, m__7481, n__7483, o__7485, p__7487, q__7489)
                                      }
                                    }else {
                                      var r__7491 = cljs.core._first.call(null, args__7490);
                                      var args__7492 = cljs.core._rest.call(null, args__7490);
                                      if(argc === 18) {
                                        if(f__7467.cljs$lang$arity$18) {
                                          return f__7467.cljs$lang$arity$18(a__7457, b__7459, c__7461, d__7463, e__7465, f__7467, g__7469, h__7471, i__7473, j__7475, k__7477, l__7479, m__7481, n__7483, o__7485, p__7487, q__7489, r__7491)
                                        }else {
                                          return f__7467.call(null, a__7457, b__7459, c__7461, d__7463, e__7465, f__7467, g__7469, h__7471, i__7473, j__7475, k__7477, l__7479, m__7481, n__7483, o__7485, p__7487, q__7489, r__7491)
                                        }
                                      }else {
                                        var s__7493 = cljs.core._first.call(null, args__7492);
                                        var args__7494 = cljs.core._rest.call(null, args__7492);
                                        if(argc === 19) {
                                          if(f__7467.cljs$lang$arity$19) {
                                            return f__7467.cljs$lang$arity$19(a__7457, b__7459, c__7461, d__7463, e__7465, f__7467, g__7469, h__7471, i__7473, j__7475, k__7477, l__7479, m__7481, n__7483, o__7485, p__7487, q__7489, r__7491, s__7493)
                                          }else {
                                            return f__7467.call(null, a__7457, b__7459, c__7461, d__7463, e__7465, f__7467, g__7469, h__7471, i__7473, j__7475, k__7477, l__7479, m__7481, n__7483, o__7485, p__7487, q__7489, r__7491, s__7493)
                                          }
                                        }else {
                                          var t__7495 = cljs.core._first.call(null, args__7494);
                                          var args__7496 = cljs.core._rest.call(null, args__7494);
                                          if(argc === 20) {
                                            if(f__7467.cljs$lang$arity$20) {
                                              return f__7467.cljs$lang$arity$20(a__7457, b__7459, c__7461, d__7463, e__7465, f__7467, g__7469, h__7471, i__7473, j__7475, k__7477, l__7479, m__7481, n__7483, o__7485, p__7487, q__7489, r__7491, s__7493, t__7495)
                                            }else {
                                              return f__7467.call(null, a__7457, b__7459, c__7461, d__7463, e__7465, f__7467, g__7469, h__7471, i__7473, j__7475, k__7477, l__7479, m__7481, n__7483, o__7485, p__7487, q__7489, r__7491, s__7493, t__7495)
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
    var fixed_arity__7511 = f.cljs$lang$maxFixedArity;
    if(cljs.core.truth_(f.cljs$lang$applyTo)) {
      var bc__7512 = cljs.core.bounded_count.call(null, args, fixed_arity__7511 + 1);
      if(bc__7512 <= fixed_arity__7511) {
        return cljs.core.apply_to.call(null, f, bc__7512, args)
      }else {
        return f.cljs$lang$applyTo(args)
      }
    }else {
      return f.apply(f, cljs.core.to_array.call(null, args))
    }
  };
  var apply__3 = function(f, x, args) {
    var arglist__7513 = cljs.core.list_STAR_.call(null, x, args);
    var fixed_arity__7514 = f.cljs$lang$maxFixedArity;
    if(cljs.core.truth_(f.cljs$lang$applyTo)) {
      var bc__7515 = cljs.core.bounded_count.call(null, arglist__7513, fixed_arity__7514 + 1);
      if(bc__7515 <= fixed_arity__7514) {
        return cljs.core.apply_to.call(null, f, bc__7515, arglist__7513)
      }else {
        return f.cljs$lang$applyTo(arglist__7513)
      }
    }else {
      return f.apply(f, cljs.core.to_array.call(null, arglist__7513))
    }
  };
  var apply__4 = function(f, x, y, args) {
    var arglist__7516 = cljs.core.list_STAR_.call(null, x, y, args);
    var fixed_arity__7517 = f.cljs$lang$maxFixedArity;
    if(cljs.core.truth_(f.cljs$lang$applyTo)) {
      var bc__7518 = cljs.core.bounded_count.call(null, arglist__7516, fixed_arity__7517 + 1);
      if(bc__7518 <= fixed_arity__7517) {
        return cljs.core.apply_to.call(null, f, bc__7518, arglist__7516)
      }else {
        return f.cljs$lang$applyTo(arglist__7516)
      }
    }else {
      return f.apply(f, cljs.core.to_array.call(null, arglist__7516))
    }
  };
  var apply__5 = function(f, x, y, z, args) {
    var arglist__7519 = cljs.core.list_STAR_.call(null, x, y, z, args);
    var fixed_arity__7520 = f.cljs$lang$maxFixedArity;
    if(cljs.core.truth_(f.cljs$lang$applyTo)) {
      var bc__7521 = cljs.core.bounded_count.call(null, arglist__7519, fixed_arity__7520 + 1);
      if(bc__7521 <= fixed_arity__7520) {
        return cljs.core.apply_to.call(null, f, bc__7521, arglist__7519)
      }else {
        return f.cljs$lang$applyTo(arglist__7519)
      }
    }else {
      return f.apply(f, cljs.core.to_array.call(null, arglist__7519))
    }
  };
  var apply__6 = function() {
    var G__7525__delegate = function(f, a, b, c, d, args) {
      var arglist__7522 = cljs.core.cons.call(null, a, cljs.core.cons.call(null, b, cljs.core.cons.call(null, c, cljs.core.cons.call(null, d, cljs.core.spread.call(null, args)))));
      var fixed_arity__7523 = f.cljs$lang$maxFixedArity;
      if(cljs.core.truth_(f.cljs$lang$applyTo)) {
        var bc__7524 = cljs.core.bounded_count.call(null, arglist__7522, fixed_arity__7523 + 1);
        if(bc__7524 <= fixed_arity__7523) {
          return cljs.core.apply_to.call(null, f, bc__7524, arglist__7522)
        }else {
          return f.cljs$lang$applyTo(arglist__7522)
        }
      }else {
        return f.apply(f, cljs.core.to_array.call(null, arglist__7522))
      }
    };
    var G__7525 = function(f, a, b, c, d, var_args) {
      var args = null;
      if(goog.isDef(var_args)) {
        args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 5), 0)
      }
      return G__7525__delegate.call(this, f, a, b, c, d, args)
    };
    G__7525.cljs$lang$maxFixedArity = 5;
    G__7525.cljs$lang$applyTo = function(arglist__7526) {
      var f = cljs.core.first(arglist__7526);
      var a = cljs.core.first(cljs.core.next(arglist__7526));
      var b = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7526)));
      var c = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__7526))));
      var d = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(cljs.core.next(arglist__7526)))));
      var args = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(cljs.core.next(arglist__7526)))));
      return G__7525__delegate(f, a, b, c, d, args)
    };
    G__7525.cljs$lang$arity$variadic = G__7525__delegate;
    return G__7525
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
  vary_meta.cljs$lang$applyTo = function(arglist__7527) {
    var obj = cljs.core.first(arglist__7527);
    var f = cljs.core.first(cljs.core.next(arglist__7527));
    var args = cljs.core.rest(cljs.core.next(arglist__7527));
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
    var G__7528__delegate = function(x, y, more) {
      return cljs.core.not.call(null, cljs.core.apply.call(null, cljs.core._EQ_, x, y, more))
    };
    var G__7528 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7528__delegate.call(this, x, y, more)
    };
    G__7528.cljs$lang$maxFixedArity = 2;
    G__7528.cljs$lang$applyTo = function(arglist__7529) {
      var x = cljs.core.first(arglist__7529);
      var y = cljs.core.first(cljs.core.next(arglist__7529));
      var more = cljs.core.rest(cljs.core.next(arglist__7529));
      return G__7528__delegate(x, y, more)
    };
    G__7528.cljs$lang$arity$variadic = G__7528__delegate;
    return G__7528
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
        var G__7530 = pred;
        var G__7531 = cljs.core.next.call(null, coll);
        pred = G__7530;
        coll = G__7531;
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
      var or__3824__auto____7533 = pred.call(null, cljs.core.first.call(null, coll));
      if(cljs.core.truth_(or__3824__auto____7533)) {
        return or__3824__auto____7533
      }else {
        var G__7534 = pred;
        var G__7535 = cljs.core.next.call(null, coll);
        pred = G__7534;
        coll = G__7535;
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
    var G__7536 = null;
    var G__7536__0 = function() {
      return cljs.core.not.call(null, f.call(null))
    };
    var G__7536__1 = function(x) {
      return cljs.core.not.call(null, f.call(null, x))
    };
    var G__7536__2 = function(x, y) {
      return cljs.core.not.call(null, f.call(null, x, y))
    };
    var G__7536__3 = function() {
      var G__7537__delegate = function(x, y, zs) {
        return cljs.core.not.call(null, cljs.core.apply.call(null, f, x, y, zs))
      };
      var G__7537 = function(x, y, var_args) {
        var zs = null;
        if(goog.isDef(var_args)) {
          zs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
        }
        return G__7537__delegate.call(this, x, y, zs)
      };
      G__7537.cljs$lang$maxFixedArity = 2;
      G__7537.cljs$lang$applyTo = function(arglist__7538) {
        var x = cljs.core.first(arglist__7538);
        var y = cljs.core.first(cljs.core.next(arglist__7538));
        var zs = cljs.core.rest(cljs.core.next(arglist__7538));
        return G__7537__delegate(x, y, zs)
      };
      G__7537.cljs$lang$arity$variadic = G__7537__delegate;
      return G__7537
    }();
    G__7536 = function(x, y, var_args) {
      var zs = var_args;
      switch(arguments.length) {
        case 0:
          return G__7536__0.call(this);
        case 1:
          return G__7536__1.call(this, x);
        case 2:
          return G__7536__2.call(this, x, y);
        default:
          return G__7536__3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
      }
      throw"Invalid arity: " + arguments.length;
    };
    G__7536.cljs$lang$maxFixedArity = 2;
    G__7536.cljs$lang$applyTo = G__7536__3.cljs$lang$applyTo;
    return G__7536
  }()
};
cljs.core.constantly = function constantly(x) {
  return function() {
    var G__7539__delegate = function(args) {
      return x
    };
    var G__7539 = function(var_args) {
      var args = null;
      if(goog.isDef(var_args)) {
        args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
      }
      return G__7539__delegate.call(this, args)
    };
    G__7539.cljs$lang$maxFixedArity = 0;
    G__7539.cljs$lang$applyTo = function(arglist__7540) {
      var args = cljs.core.seq(arglist__7540);
      return G__7539__delegate(args)
    };
    G__7539.cljs$lang$arity$variadic = G__7539__delegate;
    return G__7539
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
      var G__7547 = null;
      var G__7547__0 = function() {
        return f.call(null, g.call(null))
      };
      var G__7547__1 = function(x) {
        return f.call(null, g.call(null, x))
      };
      var G__7547__2 = function(x, y) {
        return f.call(null, g.call(null, x, y))
      };
      var G__7547__3 = function(x, y, z) {
        return f.call(null, g.call(null, x, y, z))
      };
      var G__7547__4 = function() {
        var G__7548__delegate = function(x, y, z, args) {
          return f.call(null, cljs.core.apply.call(null, g, x, y, z, args))
        };
        var G__7548 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__7548__delegate.call(this, x, y, z, args)
        };
        G__7548.cljs$lang$maxFixedArity = 3;
        G__7548.cljs$lang$applyTo = function(arglist__7549) {
          var x = cljs.core.first(arglist__7549);
          var y = cljs.core.first(cljs.core.next(arglist__7549));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7549)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__7549)));
          return G__7548__delegate(x, y, z, args)
        };
        G__7548.cljs$lang$arity$variadic = G__7548__delegate;
        return G__7548
      }();
      G__7547 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__7547__0.call(this);
          case 1:
            return G__7547__1.call(this, x);
          case 2:
            return G__7547__2.call(this, x, y);
          case 3:
            return G__7547__3.call(this, x, y, z);
          default:
            return G__7547__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__7547.cljs$lang$maxFixedArity = 3;
      G__7547.cljs$lang$applyTo = G__7547__4.cljs$lang$applyTo;
      return G__7547
    }()
  };
  var comp__3 = function(f, g, h) {
    return function() {
      var G__7550 = null;
      var G__7550__0 = function() {
        return f.call(null, g.call(null, h.call(null)))
      };
      var G__7550__1 = function(x) {
        return f.call(null, g.call(null, h.call(null, x)))
      };
      var G__7550__2 = function(x, y) {
        return f.call(null, g.call(null, h.call(null, x, y)))
      };
      var G__7550__3 = function(x, y, z) {
        return f.call(null, g.call(null, h.call(null, x, y, z)))
      };
      var G__7550__4 = function() {
        var G__7551__delegate = function(x, y, z, args) {
          return f.call(null, g.call(null, cljs.core.apply.call(null, h, x, y, z, args)))
        };
        var G__7551 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__7551__delegate.call(this, x, y, z, args)
        };
        G__7551.cljs$lang$maxFixedArity = 3;
        G__7551.cljs$lang$applyTo = function(arglist__7552) {
          var x = cljs.core.first(arglist__7552);
          var y = cljs.core.first(cljs.core.next(arglist__7552));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7552)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__7552)));
          return G__7551__delegate(x, y, z, args)
        };
        G__7551.cljs$lang$arity$variadic = G__7551__delegate;
        return G__7551
      }();
      G__7550 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__7550__0.call(this);
          case 1:
            return G__7550__1.call(this, x);
          case 2:
            return G__7550__2.call(this, x, y);
          case 3:
            return G__7550__3.call(this, x, y, z);
          default:
            return G__7550__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__7550.cljs$lang$maxFixedArity = 3;
      G__7550.cljs$lang$applyTo = G__7550__4.cljs$lang$applyTo;
      return G__7550
    }()
  };
  var comp__4 = function() {
    var G__7553__delegate = function(f1, f2, f3, fs) {
      var fs__7544 = cljs.core.reverse.call(null, cljs.core.list_STAR_.call(null, f1, f2, f3, fs));
      return function() {
        var G__7554__delegate = function(args) {
          var ret__7545 = cljs.core.apply.call(null, cljs.core.first.call(null, fs__7544), args);
          var fs__7546 = cljs.core.next.call(null, fs__7544);
          while(true) {
            if(fs__7546) {
              var G__7555 = cljs.core.first.call(null, fs__7546).call(null, ret__7545);
              var G__7556 = cljs.core.next.call(null, fs__7546);
              ret__7545 = G__7555;
              fs__7546 = G__7556;
              continue
            }else {
              return ret__7545
            }
            break
          }
        };
        var G__7554 = function(var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
          }
          return G__7554__delegate.call(this, args)
        };
        G__7554.cljs$lang$maxFixedArity = 0;
        G__7554.cljs$lang$applyTo = function(arglist__7557) {
          var args = cljs.core.seq(arglist__7557);
          return G__7554__delegate(args)
        };
        G__7554.cljs$lang$arity$variadic = G__7554__delegate;
        return G__7554
      }()
    };
    var G__7553 = function(f1, f2, f3, var_args) {
      var fs = null;
      if(goog.isDef(var_args)) {
        fs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__7553__delegate.call(this, f1, f2, f3, fs)
    };
    G__7553.cljs$lang$maxFixedArity = 3;
    G__7553.cljs$lang$applyTo = function(arglist__7558) {
      var f1 = cljs.core.first(arglist__7558);
      var f2 = cljs.core.first(cljs.core.next(arglist__7558));
      var f3 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7558)));
      var fs = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__7558)));
      return G__7553__delegate(f1, f2, f3, fs)
    };
    G__7553.cljs$lang$arity$variadic = G__7553__delegate;
    return G__7553
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
      var G__7559__delegate = function(args) {
        return cljs.core.apply.call(null, f, arg1, args)
      };
      var G__7559 = function(var_args) {
        var args = null;
        if(goog.isDef(var_args)) {
          args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
        }
        return G__7559__delegate.call(this, args)
      };
      G__7559.cljs$lang$maxFixedArity = 0;
      G__7559.cljs$lang$applyTo = function(arglist__7560) {
        var args = cljs.core.seq(arglist__7560);
        return G__7559__delegate(args)
      };
      G__7559.cljs$lang$arity$variadic = G__7559__delegate;
      return G__7559
    }()
  };
  var partial__3 = function(f, arg1, arg2) {
    return function() {
      var G__7561__delegate = function(args) {
        return cljs.core.apply.call(null, f, arg1, arg2, args)
      };
      var G__7561 = function(var_args) {
        var args = null;
        if(goog.isDef(var_args)) {
          args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
        }
        return G__7561__delegate.call(this, args)
      };
      G__7561.cljs$lang$maxFixedArity = 0;
      G__7561.cljs$lang$applyTo = function(arglist__7562) {
        var args = cljs.core.seq(arglist__7562);
        return G__7561__delegate(args)
      };
      G__7561.cljs$lang$arity$variadic = G__7561__delegate;
      return G__7561
    }()
  };
  var partial__4 = function(f, arg1, arg2, arg3) {
    return function() {
      var G__7563__delegate = function(args) {
        return cljs.core.apply.call(null, f, arg1, arg2, arg3, args)
      };
      var G__7563 = function(var_args) {
        var args = null;
        if(goog.isDef(var_args)) {
          args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
        }
        return G__7563__delegate.call(this, args)
      };
      G__7563.cljs$lang$maxFixedArity = 0;
      G__7563.cljs$lang$applyTo = function(arglist__7564) {
        var args = cljs.core.seq(arglist__7564);
        return G__7563__delegate(args)
      };
      G__7563.cljs$lang$arity$variadic = G__7563__delegate;
      return G__7563
    }()
  };
  var partial__5 = function() {
    var G__7565__delegate = function(f, arg1, arg2, arg3, more) {
      return function() {
        var G__7566__delegate = function(args) {
          return cljs.core.apply.call(null, f, arg1, arg2, arg3, cljs.core.concat.call(null, more, args))
        };
        var G__7566 = function(var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
          }
          return G__7566__delegate.call(this, args)
        };
        G__7566.cljs$lang$maxFixedArity = 0;
        G__7566.cljs$lang$applyTo = function(arglist__7567) {
          var args = cljs.core.seq(arglist__7567);
          return G__7566__delegate(args)
        };
        G__7566.cljs$lang$arity$variadic = G__7566__delegate;
        return G__7566
      }()
    };
    var G__7565 = function(f, arg1, arg2, arg3, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 4), 0)
      }
      return G__7565__delegate.call(this, f, arg1, arg2, arg3, more)
    };
    G__7565.cljs$lang$maxFixedArity = 4;
    G__7565.cljs$lang$applyTo = function(arglist__7568) {
      var f = cljs.core.first(arglist__7568);
      var arg1 = cljs.core.first(cljs.core.next(arglist__7568));
      var arg2 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7568)));
      var arg3 = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__7568))));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(arglist__7568))));
      return G__7565__delegate(f, arg1, arg2, arg3, more)
    };
    G__7565.cljs$lang$arity$variadic = G__7565__delegate;
    return G__7565
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
      var G__7569 = null;
      var G__7569__1 = function(a) {
        return f.call(null, a == null ? x : a)
      };
      var G__7569__2 = function(a, b) {
        return f.call(null, a == null ? x : a, b)
      };
      var G__7569__3 = function(a, b, c) {
        return f.call(null, a == null ? x : a, b, c)
      };
      var G__7569__4 = function() {
        var G__7570__delegate = function(a, b, c, ds) {
          return cljs.core.apply.call(null, f, a == null ? x : a, b, c, ds)
        };
        var G__7570 = function(a, b, c, var_args) {
          var ds = null;
          if(goog.isDef(var_args)) {
            ds = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__7570__delegate.call(this, a, b, c, ds)
        };
        G__7570.cljs$lang$maxFixedArity = 3;
        G__7570.cljs$lang$applyTo = function(arglist__7571) {
          var a = cljs.core.first(arglist__7571);
          var b = cljs.core.first(cljs.core.next(arglist__7571));
          var c = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7571)));
          var ds = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__7571)));
          return G__7570__delegate(a, b, c, ds)
        };
        G__7570.cljs$lang$arity$variadic = G__7570__delegate;
        return G__7570
      }();
      G__7569 = function(a, b, c, var_args) {
        var ds = var_args;
        switch(arguments.length) {
          case 1:
            return G__7569__1.call(this, a);
          case 2:
            return G__7569__2.call(this, a, b);
          case 3:
            return G__7569__3.call(this, a, b, c);
          default:
            return G__7569__4.cljs$lang$arity$variadic(a, b, c, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__7569.cljs$lang$maxFixedArity = 3;
      G__7569.cljs$lang$applyTo = G__7569__4.cljs$lang$applyTo;
      return G__7569
    }()
  };
  var fnil__3 = function(f, x, y) {
    return function() {
      var G__7572 = null;
      var G__7572__2 = function(a, b) {
        return f.call(null, a == null ? x : a, b == null ? y : b)
      };
      var G__7572__3 = function(a, b, c) {
        return f.call(null, a == null ? x : a, b == null ? y : b, c)
      };
      var G__7572__4 = function() {
        var G__7573__delegate = function(a, b, c, ds) {
          return cljs.core.apply.call(null, f, a == null ? x : a, b == null ? y : b, c, ds)
        };
        var G__7573 = function(a, b, c, var_args) {
          var ds = null;
          if(goog.isDef(var_args)) {
            ds = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__7573__delegate.call(this, a, b, c, ds)
        };
        G__7573.cljs$lang$maxFixedArity = 3;
        G__7573.cljs$lang$applyTo = function(arglist__7574) {
          var a = cljs.core.first(arglist__7574);
          var b = cljs.core.first(cljs.core.next(arglist__7574));
          var c = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7574)));
          var ds = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__7574)));
          return G__7573__delegate(a, b, c, ds)
        };
        G__7573.cljs$lang$arity$variadic = G__7573__delegate;
        return G__7573
      }();
      G__7572 = function(a, b, c, var_args) {
        var ds = var_args;
        switch(arguments.length) {
          case 2:
            return G__7572__2.call(this, a, b);
          case 3:
            return G__7572__3.call(this, a, b, c);
          default:
            return G__7572__4.cljs$lang$arity$variadic(a, b, c, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__7572.cljs$lang$maxFixedArity = 3;
      G__7572.cljs$lang$applyTo = G__7572__4.cljs$lang$applyTo;
      return G__7572
    }()
  };
  var fnil__4 = function(f, x, y, z) {
    return function() {
      var G__7575 = null;
      var G__7575__2 = function(a, b) {
        return f.call(null, a == null ? x : a, b == null ? y : b)
      };
      var G__7575__3 = function(a, b, c) {
        return f.call(null, a == null ? x : a, b == null ? y : b, c == null ? z : c)
      };
      var G__7575__4 = function() {
        var G__7576__delegate = function(a, b, c, ds) {
          return cljs.core.apply.call(null, f, a == null ? x : a, b == null ? y : b, c == null ? z : c, ds)
        };
        var G__7576 = function(a, b, c, var_args) {
          var ds = null;
          if(goog.isDef(var_args)) {
            ds = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__7576__delegate.call(this, a, b, c, ds)
        };
        G__7576.cljs$lang$maxFixedArity = 3;
        G__7576.cljs$lang$applyTo = function(arglist__7577) {
          var a = cljs.core.first(arglist__7577);
          var b = cljs.core.first(cljs.core.next(arglist__7577));
          var c = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7577)));
          var ds = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__7577)));
          return G__7576__delegate(a, b, c, ds)
        };
        G__7576.cljs$lang$arity$variadic = G__7576__delegate;
        return G__7576
      }();
      G__7575 = function(a, b, c, var_args) {
        var ds = var_args;
        switch(arguments.length) {
          case 2:
            return G__7575__2.call(this, a, b);
          case 3:
            return G__7575__3.call(this, a, b, c);
          default:
            return G__7575__4.cljs$lang$arity$variadic(a, b, c, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__7575.cljs$lang$maxFixedArity = 3;
      G__7575.cljs$lang$applyTo = G__7575__4.cljs$lang$applyTo;
      return G__7575
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
  var mapi__7593 = function mapi(idx, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3974__auto____7601 = cljs.core.seq.call(null, coll);
      if(temp__3974__auto____7601) {
        var s__7602 = temp__3974__auto____7601;
        if(cljs.core.chunked_seq_QMARK_.call(null, s__7602)) {
          var c__7603 = cljs.core.chunk_first.call(null, s__7602);
          var size__7604 = cljs.core.count.call(null, c__7603);
          var b__7605 = cljs.core.chunk_buffer.call(null, size__7604);
          var n__2529__auto____7606 = size__7604;
          var i__7607 = 0;
          while(true) {
            if(i__7607 < n__2529__auto____7606) {
              cljs.core.chunk_append.call(null, b__7605, f.call(null, idx + i__7607, cljs.core._nth.call(null, c__7603, i__7607)));
              var G__7608 = i__7607 + 1;
              i__7607 = G__7608;
              continue
            }else {
            }
            break
          }
          return cljs.core.chunk_cons.call(null, cljs.core.chunk.call(null, b__7605), mapi.call(null, idx + size__7604, cljs.core.chunk_rest.call(null, s__7602)))
        }else {
          return cljs.core.cons.call(null, f.call(null, idx, cljs.core.first.call(null, s__7602)), mapi.call(null, idx + 1, cljs.core.rest.call(null, s__7602)))
        }
      }else {
        return null
      }
    }, null)
  };
  return mapi__7593.call(null, 0, coll)
};
cljs.core.keep = function keep(f, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__3974__auto____7618 = cljs.core.seq.call(null, coll);
    if(temp__3974__auto____7618) {
      var s__7619 = temp__3974__auto____7618;
      if(cljs.core.chunked_seq_QMARK_.call(null, s__7619)) {
        var c__7620 = cljs.core.chunk_first.call(null, s__7619);
        var size__7621 = cljs.core.count.call(null, c__7620);
        var b__7622 = cljs.core.chunk_buffer.call(null, size__7621);
        var n__2529__auto____7623 = size__7621;
        var i__7624 = 0;
        while(true) {
          if(i__7624 < n__2529__auto____7623) {
            var x__7625 = f.call(null, cljs.core._nth.call(null, c__7620, i__7624));
            if(x__7625 == null) {
            }else {
              cljs.core.chunk_append.call(null, b__7622, x__7625)
            }
            var G__7627 = i__7624 + 1;
            i__7624 = G__7627;
            continue
          }else {
          }
          break
        }
        return cljs.core.chunk_cons.call(null, cljs.core.chunk.call(null, b__7622), keep.call(null, f, cljs.core.chunk_rest.call(null, s__7619)))
      }else {
        var x__7626 = f.call(null, cljs.core.first.call(null, s__7619));
        if(x__7626 == null) {
          return keep.call(null, f, cljs.core.rest.call(null, s__7619))
        }else {
          return cljs.core.cons.call(null, x__7626, keep.call(null, f, cljs.core.rest.call(null, s__7619)))
        }
      }
    }else {
      return null
    }
  }, null)
};
cljs.core.keep_indexed = function keep_indexed(f, coll) {
  var keepi__7653 = function keepi(idx, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3974__auto____7663 = cljs.core.seq.call(null, coll);
      if(temp__3974__auto____7663) {
        var s__7664 = temp__3974__auto____7663;
        if(cljs.core.chunked_seq_QMARK_.call(null, s__7664)) {
          var c__7665 = cljs.core.chunk_first.call(null, s__7664);
          var size__7666 = cljs.core.count.call(null, c__7665);
          var b__7667 = cljs.core.chunk_buffer.call(null, size__7666);
          var n__2529__auto____7668 = size__7666;
          var i__7669 = 0;
          while(true) {
            if(i__7669 < n__2529__auto____7668) {
              var x__7670 = f.call(null, idx + i__7669, cljs.core._nth.call(null, c__7665, i__7669));
              if(x__7670 == null) {
              }else {
                cljs.core.chunk_append.call(null, b__7667, x__7670)
              }
              var G__7672 = i__7669 + 1;
              i__7669 = G__7672;
              continue
            }else {
            }
            break
          }
          return cljs.core.chunk_cons.call(null, cljs.core.chunk.call(null, b__7667), keepi.call(null, idx + size__7666, cljs.core.chunk_rest.call(null, s__7664)))
        }else {
          var x__7671 = f.call(null, idx, cljs.core.first.call(null, s__7664));
          if(x__7671 == null) {
            return keepi.call(null, idx + 1, cljs.core.rest.call(null, s__7664))
          }else {
            return cljs.core.cons.call(null, x__7671, keepi.call(null, idx + 1, cljs.core.rest.call(null, s__7664)))
          }
        }
      }else {
        return null
      }
    }, null)
  };
  return keepi__7653.call(null, 0, coll)
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
          var and__3822__auto____7758 = p.call(null, x);
          if(cljs.core.truth_(and__3822__auto____7758)) {
            return p.call(null, y)
          }else {
            return and__3822__auto____7758
          }
        }())
      };
      var ep1__3 = function(x, y, z) {
        return cljs.core.boolean$.call(null, function() {
          var and__3822__auto____7759 = p.call(null, x);
          if(cljs.core.truth_(and__3822__auto____7759)) {
            var and__3822__auto____7760 = p.call(null, y);
            if(cljs.core.truth_(and__3822__auto____7760)) {
              return p.call(null, z)
            }else {
              return and__3822__auto____7760
            }
          }else {
            return and__3822__auto____7759
          }
        }())
      };
      var ep1__4 = function() {
        var G__7829__delegate = function(x, y, z, args) {
          return cljs.core.boolean$.call(null, function() {
            var and__3822__auto____7761 = ep1.call(null, x, y, z);
            if(cljs.core.truth_(and__3822__auto____7761)) {
              return cljs.core.every_QMARK_.call(null, p, args)
            }else {
              return and__3822__auto____7761
            }
          }())
        };
        var G__7829 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__7829__delegate.call(this, x, y, z, args)
        };
        G__7829.cljs$lang$maxFixedArity = 3;
        G__7829.cljs$lang$applyTo = function(arglist__7830) {
          var x = cljs.core.first(arglist__7830);
          var y = cljs.core.first(cljs.core.next(arglist__7830));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7830)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__7830)));
          return G__7829__delegate(x, y, z, args)
        };
        G__7829.cljs$lang$arity$variadic = G__7829__delegate;
        return G__7829
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
          var and__3822__auto____7773 = p1.call(null, x);
          if(cljs.core.truth_(and__3822__auto____7773)) {
            return p2.call(null, x)
          }else {
            return and__3822__auto____7773
          }
        }())
      };
      var ep2__2 = function(x, y) {
        return cljs.core.boolean$.call(null, function() {
          var and__3822__auto____7774 = p1.call(null, x);
          if(cljs.core.truth_(and__3822__auto____7774)) {
            var and__3822__auto____7775 = p1.call(null, y);
            if(cljs.core.truth_(and__3822__auto____7775)) {
              var and__3822__auto____7776 = p2.call(null, x);
              if(cljs.core.truth_(and__3822__auto____7776)) {
                return p2.call(null, y)
              }else {
                return and__3822__auto____7776
              }
            }else {
              return and__3822__auto____7775
            }
          }else {
            return and__3822__auto____7774
          }
        }())
      };
      var ep2__3 = function(x, y, z) {
        return cljs.core.boolean$.call(null, function() {
          var and__3822__auto____7777 = p1.call(null, x);
          if(cljs.core.truth_(and__3822__auto____7777)) {
            var and__3822__auto____7778 = p1.call(null, y);
            if(cljs.core.truth_(and__3822__auto____7778)) {
              var and__3822__auto____7779 = p1.call(null, z);
              if(cljs.core.truth_(and__3822__auto____7779)) {
                var and__3822__auto____7780 = p2.call(null, x);
                if(cljs.core.truth_(and__3822__auto____7780)) {
                  var and__3822__auto____7781 = p2.call(null, y);
                  if(cljs.core.truth_(and__3822__auto____7781)) {
                    return p2.call(null, z)
                  }else {
                    return and__3822__auto____7781
                  }
                }else {
                  return and__3822__auto____7780
                }
              }else {
                return and__3822__auto____7779
              }
            }else {
              return and__3822__auto____7778
            }
          }else {
            return and__3822__auto____7777
          }
        }())
      };
      var ep2__4 = function() {
        var G__7831__delegate = function(x, y, z, args) {
          return cljs.core.boolean$.call(null, function() {
            var and__3822__auto____7782 = ep2.call(null, x, y, z);
            if(cljs.core.truth_(and__3822__auto____7782)) {
              return cljs.core.every_QMARK_.call(null, function(p1__7628_SHARP_) {
                var and__3822__auto____7783 = p1.call(null, p1__7628_SHARP_);
                if(cljs.core.truth_(and__3822__auto____7783)) {
                  return p2.call(null, p1__7628_SHARP_)
                }else {
                  return and__3822__auto____7783
                }
              }, args)
            }else {
              return and__3822__auto____7782
            }
          }())
        };
        var G__7831 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__7831__delegate.call(this, x, y, z, args)
        };
        G__7831.cljs$lang$maxFixedArity = 3;
        G__7831.cljs$lang$applyTo = function(arglist__7832) {
          var x = cljs.core.first(arglist__7832);
          var y = cljs.core.first(cljs.core.next(arglist__7832));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7832)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__7832)));
          return G__7831__delegate(x, y, z, args)
        };
        G__7831.cljs$lang$arity$variadic = G__7831__delegate;
        return G__7831
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
          var and__3822__auto____7802 = p1.call(null, x);
          if(cljs.core.truth_(and__3822__auto____7802)) {
            var and__3822__auto____7803 = p2.call(null, x);
            if(cljs.core.truth_(and__3822__auto____7803)) {
              return p3.call(null, x)
            }else {
              return and__3822__auto____7803
            }
          }else {
            return and__3822__auto____7802
          }
        }())
      };
      var ep3__2 = function(x, y) {
        return cljs.core.boolean$.call(null, function() {
          var and__3822__auto____7804 = p1.call(null, x);
          if(cljs.core.truth_(and__3822__auto____7804)) {
            var and__3822__auto____7805 = p2.call(null, x);
            if(cljs.core.truth_(and__3822__auto____7805)) {
              var and__3822__auto____7806 = p3.call(null, x);
              if(cljs.core.truth_(and__3822__auto____7806)) {
                var and__3822__auto____7807 = p1.call(null, y);
                if(cljs.core.truth_(and__3822__auto____7807)) {
                  var and__3822__auto____7808 = p2.call(null, y);
                  if(cljs.core.truth_(and__3822__auto____7808)) {
                    return p3.call(null, y)
                  }else {
                    return and__3822__auto____7808
                  }
                }else {
                  return and__3822__auto____7807
                }
              }else {
                return and__3822__auto____7806
              }
            }else {
              return and__3822__auto____7805
            }
          }else {
            return and__3822__auto____7804
          }
        }())
      };
      var ep3__3 = function(x, y, z) {
        return cljs.core.boolean$.call(null, function() {
          var and__3822__auto____7809 = p1.call(null, x);
          if(cljs.core.truth_(and__3822__auto____7809)) {
            var and__3822__auto____7810 = p2.call(null, x);
            if(cljs.core.truth_(and__3822__auto____7810)) {
              var and__3822__auto____7811 = p3.call(null, x);
              if(cljs.core.truth_(and__3822__auto____7811)) {
                var and__3822__auto____7812 = p1.call(null, y);
                if(cljs.core.truth_(and__3822__auto____7812)) {
                  var and__3822__auto____7813 = p2.call(null, y);
                  if(cljs.core.truth_(and__3822__auto____7813)) {
                    var and__3822__auto____7814 = p3.call(null, y);
                    if(cljs.core.truth_(and__3822__auto____7814)) {
                      var and__3822__auto____7815 = p1.call(null, z);
                      if(cljs.core.truth_(and__3822__auto____7815)) {
                        var and__3822__auto____7816 = p2.call(null, z);
                        if(cljs.core.truth_(and__3822__auto____7816)) {
                          return p3.call(null, z)
                        }else {
                          return and__3822__auto____7816
                        }
                      }else {
                        return and__3822__auto____7815
                      }
                    }else {
                      return and__3822__auto____7814
                    }
                  }else {
                    return and__3822__auto____7813
                  }
                }else {
                  return and__3822__auto____7812
                }
              }else {
                return and__3822__auto____7811
              }
            }else {
              return and__3822__auto____7810
            }
          }else {
            return and__3822__auto____7809
          }
        }())
      };
      var ep3__4 = function() {
        var G__7833__delegate = function(x, y, z, args) {
          return cljs.core.boolean$.call(null, function() {
            var and__3822__auto____7817 = ep3.call(null, x, y, z);
            if(cljs.core.truth_(and__3822__auto____7817)) {
              return cljs.core.every_QMARK_.call(null, function(p1__7629_SHARP_) {
                var and__3822__auto____7818 = p1.call(null, p1__7629_SHARP_);
                if(cljs.core.truth_(and__3822__auto____7818)) {
                  var and__3822__auto____7819 = p2.call(null, p1__7629_SHARP_);
                  if(cljs.core.truth_(and__3822__auto____7819)) {
                    return p3.call(null, p1__7629_SHARP_)
                  }else {
                    return and__3822__auto____7819
                  }
                }else {
                  return and__3822__auto____7818
                }
              }, args)
            }else {
              return and__3822__auto____7817
            }
          }())
        };
        var G__7833 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__7833__delegate.call(this, x, y, z, args)
        };
        G__7833.cljs$lang$maxFixedArity = 3;
        G__7833.cljs$lang$applyTo = function(arglist__7834) {
          var x = cljs.core.first(arglist__7834);
          var y = cljs.core.first(cljs.core.next(arglist__7834));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7834)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__7834)));
          return G__7833__delegate(x, y, z, args)
        };
        G__7833.cljs$lang$arity$variadic = G__7833__delegate;
        return G__7833
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
    var G__7835__delegate = function(p1, p2, p3, ps) {
      var ps__7820 = cljs.core.list_STAR_.call(null, p1, p2, p3, ps);
      return function() {
        var epn = null;
        var epn__0 = function() {
          return true
        };
        var epn__1 = function(x) {
          return cljs.core.every_QMARK_.call(null, function(p1__7630_SHARP_) {
            return p1__7630_SHARP_.call(null, x)
          }, ps__7820)
        };
        var epn__2 = function(x, y) {
          return cljs.core.every_QMARK_.call(null, function(p1__7631_SHARP_) {
            var and__3822__auto____7825 = p1__7631_SHARP_.call(null, x);
            if(cljs.core.truth_(and__3822__auto____7825)) {
              return p1__7631_SHARP_.call(null, y)
            }else {
              return and__3822__auto____7825
            }
          }, ps__7820)
        };
        var epn__3 = function(x, y, z) {
          return cljs.core.every_QMARK_.call(null, function(p1__7632_SHARP_) {
            var and__3822__auto____7826 = p1__7632_SHARP_.call(null, x);
            if(cljs.core.truth_(and__3822__auto____7826)) {
              var and__3822__auto____7827 = p1__7632_SHARP_.call(null, y);
              if(cljs.core.truth_(and__3822__auto____7827)) {
                return p1__7632_SHARP_.call(null, z)
              }else {
                return and__3822__auto____7827
              }
            }else {
              return and__3822__auto____7826
            }
          }, ps__7820)
        };
        var epn__4 = function() {
          var G__7836__delegate = function(x, y, z, args) {
            return cljs.core.boolean$.call(null, function() {
              var and__3822__auto____7828 = epn.call(null, x, y, z);
              if(cljs.core.truth_(and__3822__auto____7828)) {
                return cljs.core.every_QMARK_.call(null, function(p1__7633_SHARP_) {
                  return cljs.core.every_QMARK_.call(null, p1__7633_SHARP_, args)
                }, ps__7820)
              }else {
                return and__3822__auto____7828
              }
            }())
          };
          var G__7836 = function(x, y, z, var_args) {
            var args = null;
            if(goog.isDef(var_args)) {
              args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
            }
            return G__7836__delegate.call(this, x, y, z, args)
          };
          G__7836.cljs$lang$maxFixedArity = 3;
          G__7836.cljs$lang$applyTo = function(arglist__7837) {
            var x = cljs.core.first(arglist__7837);
            var y = cljs.core.first(cljs.core.next(arglist__7837));
            var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7837)));
            var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__7837)));
            return G__7836__delegate(x, y, z, args)
          };
          G__7836.cljs$lang$arity$variadic = G__7836__delegate;
          return G__7836
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
    var G__7835 = function(p1, p2, p3, var_args) {
      var ps = null;
      if(goog.isDef(var_args)) {
        ps = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__7835__delegate.call(this, p1, p2, p3, ps)
    };
    G__7835.cljs$lang$maxFixedArity = 3;
    G__7835.cljs$lang$applyTo = function(arglist__7838) {
      var p1 = cljs.core.first(arglist__7838);
      var p2 = cljs.core.first(cljs.core.next(arglist__7838));
      var p3 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7838)));
      var ps = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__7838)));
      return G__7835__delegate(p1, p2, p3, ps)
    };
    G__7835.cljs$lang$arity$variadic = G__7835__delegate;
    return G__7835
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
        var or__3824__auto____7919 = p.call(null, x);
        if(cljs.core.truth_(or__3824__auto____7919)) {
          return or__3824__auto____7919
        }else {
          return p.call(null, y)
        }
      };
      var sp1__3 = function(x, y, z) {
        var or__3824__auto____7920 = p.call(null, x);
        if(cljs.core.truth_(or__3824__auto____7920)) {
          return or__3824__auto____7920
        }else {
          var or__3824__auto____7921 = p.call(null, y);
          if(cljs.core.truth_(or__3824__auto____7921)) {
            return or__3824__auto____7921
          }else {
            return p.call(null, z)
          }
        }
      };
      var sp1__4 = function() {
        var G__7990__delegate = function(x, y, z, args) {
          var or__3824__auto____7922 = sp1.call(null, x, y, z);
          if(cljs.core.truth_(or__3824__auto____7922)) {
            return or__3824__auto____7922
          }else {
            return cljs.core.some.call(null, p, args)
          }
        };
        var G__7990 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__7990__delegate.call(this, x, y, z, args)
        };
        G__7990.cljs$lang$maxFixedArity = 3;
        G__7990.cljs$lang$applyTo = function(arglist__7991) {
          var x = cljs.core.first(arglist__7991);
          var y = cljs.core.first(cljs.core.next(arglist__7991));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7991)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__7991)));
          return G__7990__delegate(x, y, z, args)
        };
        G__7990.cljs$lang$arity$variadic = G__7990__delegate;
        return G__7990
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
        var or__3824__auto____7934 = p1.call(null, x);
        if(cljs.core.truth_(or__3824__auto____7934)) {
          return or__3824__auto____7934
        }else {
          return p2.call(null, x)
        }
      };
      var sp2__2 = function(x, y) {
        var or__3824__auto____7935 = p1.call(null, x);
        if(cljs.core.truth_(or__3824__auto____7935)) {
          return or__3824__auto____7935
        }else {
          var or__3824__auto____7936 = p1.call(null, y);
          if(cljs.core.truth_(or__3824__auto____7936)) {
            return or__3824__auto____7936
          }else {
            var or__3824__auto____7937 = p2.call(null, x);
            if(cljs.core.truth_(or__3824__auto____7937)) {
              return or__3824__auto____7937
            }else {
              return p2.call(null, y)
            }
          }
        }
      };
      var sp2__3 = function(x, y, z) {
        var or__3824__auto____7938 = p1.call(null, x);
        if(cljs.core.truth_(or__3824__auto____7938)) {
          return or__3824__auto____7938
        }else {
          var or__3824__auto____7939 = p1.call(null, y);
          if(cljs.core.truth_(or__3824__auto____7939)) {
            return or__3824__auto____7939
          }else {
            var or__3824__auto____7940 = p1.call(null, z);
            if(cljs.core.truth_(or__3824__auto____7940)) {
              return or__3824__auto____7940
            }else {
              var or__3824__auto____7941 = p2.call(null, x);
              if(cljs.core.truth_(or__3824__auto____7941)) {
                return or__3824__auto____7941
              }else {
                var or__3824__auto____7942 = p2.call(null, y);
                if(cljs.core.truth_(or__3824__auto____7942)) {
                  return or__3824__auto____7942
                }else {
                  return p2.call(null, z)
                }
              }
            }
          }
        }
      };
      var sp2__4 = function() {
        var G__7992__delegate = function(x, y, z, args) {
          var or__3824__auto____7943 = sp2.call(null, x, y, z);
          if(cljs.core.truth_(or__3824__auto____7943)) {
            return or__3824__auto____7943
          }else {
            return cljs.core.some.call(null, function(p1__7673_SHARP_) {
              var or__3824__auto____7944 = p1.call(null, p1__7673_SHARP_);
              if(cljs.core.truth_(or__3824__auto____7944)) {
                return or__3824__auto____7944
              }else {
                return p2.call(null, p1__7673_SHARP_)
              }
            }, args)
          }
        };
        var G__7992 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__7992__delegate.call(this, x, y, z, args)
        };
        G__7992.cljs$lang$maxFixedArity = 3;
        G__7992.cljs$lang$applyTo = function(arglist__7993) {
          var x = cljs.core.first(arglist__7993);
          var y = cljs.core.first(cljs.core.next(arglist__7993));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7993)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__7993)));
          return G__7992__delegate(x, y, z, args)
        };
        G__7992.cljs$lang$arity$variadic = G__7992__delegate;
        return G__7992
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
        var or__3824__auto____7963 = p1.call(null, x);
        if(cljs.core.truth_(or__3824__auto____7963)) {
          return or__3824__auto____7963
        }else {
          var or__3824__auto____7964 = p2.call(null, x);
          if(cljs.core.truth_(or__3824__auto____7964)) {
            return or__3824__auto____7964
          }else {
            return p3.call(null, x)
          }
        }
      };
      var sp3__2 = function(x, y) {
        var or__3824__auto____7965 = p1.call(null, x);
        if(cljs.core.truth_(or__3824__auto____7965)) {
          return or__3824__auto____7965
        }else {
          var or__3824__auto____7966 = p2.call(null, x);
          if(cljs.core.truth_(or__3824__auto____7966)) {
            return or__3824__auto____7966
          }else {
            var or__3824__auto____7967 = p3.call(null, x);
            if(cljs.core.truth_(or__3824__auto____7967)) {
              return or__3824__auto____7967
            }else {
              var or__3824__auto____7968 = p1.call(null, y);
              if(cljs.core.truth_(or__3824__auto____7968)) {
                return or__3824__auto____7968
              }else {
                var or__3824__auto____7969 = p2.call(null, y);
                if(cljs.core.truth_(or__3824__auto____7969)) {
                  return or__3824__auto____7969
                }else {
                  return p3.call(null, y)
                }
              }
            }
          }
        }
      };
      var sp3__3 = function(x, y, z) {
        var or__3824__auto____7970 = p1.call(null, x);
        if(cljs.core.truth_(or__3824__auto____7970)) {
          return or__3824__auto____7970
        }else {
          var or__3824__auto____7971 = p2.call(null, x);
          if(cljs.core.truth_(or__3824__auto____7971)) {
            return or__3824__auto____7971
          }else {
            var or__3824__auto____7972 = p3.call(null, x);
            if(cljs.core.truth_(or__3824__auto____7972)) {
              return or__3824__auto____7972
            }else {
              var or__3824__auto____7973 = p1.call(null, y);
              if(cljs.core.truth_(or__3824__auto____7973)) {
                return or__3824__auto____7973
              }else {
                var or__3824__auto____7974 = p2.call(null, y);
                if(cljs.core.truth_(or__3824__auto____7974)) {
                  return or__3824__auto____7974
                }else {
                  var or__3824__auto____7975 = p3.call(null, y);
                  if(cljs.core.truth_(or__3824__auto____7975)) {
                    return or__3824__auto____7975
                  }else {
                    var or__3824__auto____7976 = p1.call(null, z);
                    if(cljs.core.truth_(or__3824__auto____7976)) {
                      return or__3824__auto____7976
                    }else {
                      var or__3824__auto____7977 = p2.call(null, z);
                      if(cljs.core.truth_(or__3824__auto____7977)) {
                        return or__3824__auto____7977
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
        var G__7994__delegate = function(x, y, z, args) {
          var or__3824__auto____7978 = sp3.call(null, x, y, z);
          if(cljs.core.truth_(or__3824__auto____7978)) {
            return or__3824__auto____7978
          }else {
            return cljs.core.some.call(null, function(p1__7674_SHARP_) {
              var or__3824__auto____7979 = p1.call(null, p1__7674_SHARP_);
              if(cljs.core.truth_(or__3824__auto____7979)) {
                return or__3824__auto____7979
              }else {
                var or__3824__auto____7980 = p2.call(null, p1__7674_SHARP_);
                if(cljs.core.truth_(or__3824__auto____7980)) {
                  return or__3824__auto____7980
                }else {
                  return p3.call(null, p1__7674_SHARP_)
                }
              }
            }, args)
          }
        };
        var G__7994 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__7994__delegate.call(this, x, y, z, args)
        };
        G__7994.cljs$lang$maxFixedArity = 3;
        G__7994.cljs$lang$applyTo = function(arglist__7995) {
          var x = cljs.core.first(arglist__7995);
          var y = cljs.core.first(cljs.core.next(arglist__7995));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7995)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__7995)));
          return G__7994__delegate(x, y, z, args)
        };
        G__7994.cljs$lang$arity$variadic = G__7994__delegate;
        return G__7994
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
    var G__7996__delegate = function(p1, p2, p3, ps) {
      var ps__7981 = cljs.core.list_STAR_.call(null, p1, p2, p3, ps);
      return function() {
        var spn = null;
        var spn__0 = function() {
          return null
        };
        var spn__1 = function(x) {
          return cljs.core.some.call(null, function(p1__7675_SHARP_) {
            return p1__7675_SHARP_.call(null, x)
          }, ps__7981)
        };
        var spn__2 = function(x, y) {
          return cljs.core.some.call(null, function(p1__7676_SHARP_) {
            var or__3824__auto____7986 = p1__7676_SHARP_.call(null, x);
            if(cljs.core.truth_(or__3824__auto____7986)) {
              return or__3824__auto____7986
            }else {
              return p1__7676_SHARP_.call(null, y)
            }
          }, ps__7981)
        };
        var spn__3 = function(x, y, z) {
          return cljs.core.some.call(null, function(p1__7677_SHARP_) {
            var or__3824__auto____7987 = p1__7677_SHARP_.call(null, x);
            if(cljs.core.truth_(or__3824__auto____7987)) {
              return or__3824__auto____7987
            }else {
              var or__3824__auto____7988 = p1__7677_SHARP_.call(null, y);
              if(cljs.core.truth_(or__3824__auto____7988)) {
                return or__3824__auto____7988
              }else {
                return p1__7677_SHARP_.call(null, z)
              }
            }
          }, ps__7981)
        };
        var spn__4 = function() {
          var G__7997__delegate = function(x, y, z, args) {
            var or__3824__auto____7989 = spn.call(null, x, y, z);
            if(cljs.core.truth_(or__3824__auto____7989)) {
              return or__3824__auto____7989
            }else {
              return cljs.core.some.call(null, function(p1__7678_SHARP_) {
                return cljs.core.some.call(null, p1__7678_SHARP_, args)
              }, ps__7981)
            }
          };
          var G__7997 = function(x, y, z, var_args) {
            var args = null;
            if(goog.isDef(var_args)) {
              args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
            }
            return G__7997__delegate.call(this, x, y, z, args)
          };
          G__7997.cljs$lang$maxFixedArity = 3;
          G__7997.cljs$lang$applyTo = function(arglist__7998) {
            var x = cljs.core.first(arglist__7998);
            var y = cljs.core.first(cljs.core.next(arglist__7998));
            var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7998)));
            var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__7998)));
            return G__7997__delegate(x, y, z, args)
          };
          G__7997.cljs$lang$arity$variadic = G__7997__delegate;
          return G__7997
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
    var G__7996 = function(p1, p2, p3, var_args) {
      var ps = null;
      if(goog.isDef(var_args)) {
        ps = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__7996__delegate.call(this, p1, p2, p3, ps)
    };
    G__7996.cljs$lang$maxFixedArity = 3;
    G__7996.cljs$lang$applyTo = function(arglist__7999) {
      var p1 = cljs.core.first(arglist__7999);
      var p2 = cljs.core.first(cljs.core.next(arglist__7999));
      var p3 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7999)));
      var ps = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__7999)));
      return G__7996__delegate(p1, p2, p3, ps)
    };
    G__7996.cljs$lang$arity$variadic = G__7996__delegate;
    return G__7996
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
      var temp__3974__auto____8018 = cljs.core.seq.call(null, coll);
      if(temp__3974__auto____8018) {
        var s__8019 = temp__3974__auto____8018;
        if(cljs.core.chunked_seq_QMARK_.call(null, s__8019)) {
          var c__8020 = cljs.core.chunk_first.call(null, s__8019);
          var size__8021 = cljs.core.count.call(null, c__8020);
          var b__8022 = cljs.core.chunk_buffer.call(null, size__8021);
          var n__2529__auto____8023 = size__8021;
          var i__8024 = 0;
          while(true) {
            if(i__8024 < n__2529__auto____8023) {
              cljs.core.chunk_append.call(null, b__8022, f.call(null, cljs.core._nth.call(null, c__8020, i__8024)));
              var G__8036 = i__8024 + 1;
              i__8024 = G__8036;
              continue
            }else {
            }
            break
          }
          return cljs.core.chunk_cons.call(null, cljs.core.chunk.call(null, b__8022), map.call(null, f, cljs.core.chunk_rest.call(null, s__8019)))
        }else {
          return cljs.core.cons.call(null, f.call(null, cljs.core.first.call(null, s__8019)), map.call(null, f, cljs.core.rest.call(null, s__8019)))
        }
      }else {
        return null
      }
    }, null)
  };
  var map__3 = function(f, c1, c2) {
    return new cljs.core.LazySeq(null, false, function() {
      var s1__8025 = cljs.core.seq.call(null, c1);
      var s2__8026 = cljs.core.seq.call(null, c2);
      if(function() {
        var and__3822__auto____8027 = s1__8025;
        if(and__3822__auto____8027) {
          return s2__8026
        }else {
          return and__3822__auto____8027
        }
      }()) {
        return cljs.core.cons.call(null, f.call(null, cljs.core.first.call(null, s1__8025), cljs.core.first.call(null, s2__8026)), map.call(null, f, cljs.core.rest.call(null, s1__8025), cljs.core.rest.call(null, s2__8026)))
      }else {
        return null
      }
    }, null)
  };
  var map__4 = function(f, c1, c2, c3) {
    return new cljs.core.LazySeq(null, false, function() {
      var s1__8028 = cljs.core.seq.call(null, c1);
      var s2__8029 = cljs.core.seq.call(null, c2);
      var s3__8030 = cljs.core.seq.call(null, c3);
      if(function() {
        var and__3822__auto____8031 = s1__8028;
        if(and__3822__auto____8031) {
          var and__3822__auto____8032 = s2__8029;
          if(and__3822__auto____8032) {
            return s3__8030
          }else {
            return and__3822__auto____8032
          }
        }else {
          return and__3822__auto____8031
        }
      }()) {
        return cljs.core.cons.call(null, f.call(null, cljs.core.first.call(null, s1__8028), cljs.core.first.call(null, s2__8029), cljs.core.first.call(null, s3__8030)), map.call(null, f, cljs.core.rest.call(null, s1__8028), cljs.core.rest.call(null, s2__8029), cljs.core.rest.call(null, s3__8030)))
      }else {
        return null
      }
    }, null)
  };
  var map__5 = function() {
    var G__8037__delegate = function(f, c1, c2, c3, colls) {
      var step__8035 = function step(cs) {
        return new cljs.core.LazySeq(null, false, function() {
          var ss__8034 = map.call(null, cljs.core.seq, cs);
          if(cljs.core.every_QMARK_.call(null, cljs.core.identity, ss__8034)) {
            return cljs.core.cons.call(null, map.call(null, cljs.core.first, ss__8034), step.call(null, map.call(null, cljs.core.rest, ss__8034)))
          }else {
            return null
          }
        }, null)
      };
      return map.call(null, function(p1__7839_SHARP_) {
        return cljs.core.apply.call(null, f, p1__7839_SHARP_)
      }, step__8035.call(null, cljs.core.conj.call(null, colls, c3, c2, c1)))
    };
    var G__8037 = function(f, c1, c2, c3, var_args) {
      var colls = null;
      if(goog.isDef(var_args)) {
        colls = cljs.core.array_seq(Array.prototype.slice.call(arguments, 4), 0)
      }
      return G__8037__delegate.call(this, f, c1, c2, c3, colls)
    };
    G__8037.cljs$lang$maxFixedArity = 4;
    G__8037.cljs$lang$applyTo = function(arglist__8038) {
      var f = cljs.core.first(arglist__8038);
      var c1 = cljs.core.first(cljs.core.next(arglist__8038));
      var c2 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__8038)));
      var c3 = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__8038))));
      var colls = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(arglist__8038))));
      return G__8037__delegate(f, c1, c2, c3, colls)
    };
    G__8037.cljs$lang$arity$variadic = G__8037__delegate;
    return G__8037
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
      var temp__3974__auto____8041 = cljs.core.seq.call(null, coll);
      if(temp__3974__auto____8041) {
        var s__8042 = temp__3974__auto____8041;
        return cljs.core.cons.call(null, cljs.core.first.call(null, s__8042), take.call(null, n - 1, cljs.core.rest.call(null, s__8042)))
      }else {
        return null
      }
    }else {
      return null
    }
  }, null)
};
cljs.core.drop = function drop(n, coll) {
  var step__8048 = function(n, coll) {
    while(true) {
      var s__8046 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(function() {
        var and__3822__auto____8047 = n > 0;
        if(and__3822__auto____8047) {
          return s__8046
        }else {
          return and__3822__auto____8047
        }
      }())) {
        var G__8049 = n - 1;
        var G__8050 = cljs.core.rest.call(null, s__8046);
        n = G__8049;
        coll = G__8050;
        continue
      }else {
        return s__8046
      }
      break
    }
  };
  return new cljs.core.LazySeq(null, false, function() {
    return step__8048.call(null, n, coll)
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
  var s__8053 = cljs.core.seq.call(null, coll);
  var lead__8054 = cljs.core.seq.call(null, cljs.core.drop.call(null, n, coll));
  while(true) {
    if(lead__8054) {
      var G__8055 = cljs.core.next.call(null, s__8053);
      var G__8056 = cljs.core.next.call(null, lead__8054);
      s__8053 = G__8055;
      lead__8054 = G__8056;
      continue
    }else {
      return s__8053
    }
    break
  }
};
cljs.core.drop_while = function drop_while(pred, coll) {
  var step__8062 = function(pred, coll) {
    while(true) {
      var s__8060 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(function() {
        var and__3822__auto____8061 = s__8060;
        if(and__3822__auto____8061) {
          return pred.call(null, cljs.core.first.call(null, s__8060))
        }else {
          return and__3822__auto____8061
        }
      }())) {
        var G__8063 = pred;
        var G__8064 = cljs.core.rest.call(null, s__8060);
        pred = G__8063;
        coll = G__8064;
        continue
      }else {
        return s__8060
      }
      break
    }
  };
  return new cljs.core.LazySeq(null, false, function() {
    return step__8062.call(null, pred, coll)
  }, null)
};
cljs.core.cycle = function cycle(coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__3974__auto____8067 = cljs.core.seq.call(null, coll);
    if(temp__3974__auto____8067) {
      var s__8068 = temp__3974__auto____8067;
      return cljs.core.concat.call(null, s__8068, cycle.call(null, s__8068))
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
      var s1__8073 = cljs.core.seq.call(null, c1);
      var s2__8074 = cljs.core.seq.call(null, c2);
      if(function() {
        var and__3822__auto____8075 = s1__8073;
        if(and__3822__auto____8075) {
          return s2__8074
        }else {
          return and__3822__auto____8075
        }
      }()) {
        return cljs.core.cons.call(null, cljs.core.first.call(null, s1__8073), cljs.core.cons.call(null, cljs.core.first.call(null, s2__8074), interleave.call(null, cljs.core.rest.call(null, s1__8073), cljs.core.rest.call(null, s2__8074))))
      }else {
        return null
      }
    }, null)
  };
  var interleave__3 = function() {
    var G__8077__delegate = function(c1, c2, colls) {
      return new cljs.core.LazySeq(null, false, function() {
        var ss__8076 = cljs.core.map.call(null, cljs.core.seq, cljs.core.conj.call(null, colls, c2, c1));
        if(cljs.core.every_QMARK_.call(null, cljs.core.identity, ss__8076)) {
          return cljs.core.concat.call(null, cljs.core.map.call(null, cljs.core.first, ss__8076), cljs.core.apply.call(null, interleave, cljs.core.map.call(null, cljs.core.rest, ss__8076)))
        }else {
          return null
        }
      }, null)
    };
    var G__8077 = function(c1, c2, var_args) {
      var colls = null;
      if(goog.isDef(var_args)) {
        colls = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__8077__delegate.call(this, c1, c2, colls)
    };
    G__8077.cljs$lang$maxFixedArity = 2;
    G__8077.cljs$lang$applyTo = function(arglist__8078) {
      var c1 = cljs.core.first(arglist__8078);
      var c2 = cljs.core.first(cljs.core.next(arglist__8078));
      var colls = cljs.core.rest(cljs.core.next(arglist__8078));
      return G__8077__delegate(c1, c2, colls)
    };
    G__8077.cljs$lang$arity$variadic = G__8077__delegate;
    return G__8077
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
  var cat__8088 = function cat(coll, colls) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3971__auto____8086 = cljs.core.seq.call(null, coll);
      if(temp__3971__auto____8086) {
        var coll__8087 = temp__3971__auto____8086;
        return cljs.core.cons.call(null, cljs.core.first.call(null, coll__8087), cat.call(null, cljs.core.rest.call(null, coll__8087), colls))
      }else {
        if(cljs.core.seq.call(null, colls)) {
          return cat.call(null, cljs.core.first.call(null, colls), cljs.core.rest.call(null, colls))
        }else {
          return null
        }
      }
    }, null)
  };
  return cat__8088.call(null, null, colls)
};
cljs.core.mapcat = function() {
  var mapcat = null;
  var mapcat__2 = function(f, coll) {
    return cljs.core.flatten1.call(null, cljs.core.map.call(null, f, coll))
  };
  var mapcat__3 = function() {
    var G__8089__delegate = function(f, coll, colls) {
      return cljs.core.flatten1.call(null, cljs.core.apply.call(null, cljs.core.map, f, coll, colls))
    };
    var G__8089 = function(f, coll, var_args) {
      var colls = null;
      if(goog.isDef(var_args)) {
        colls = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__8089__delegate.call(this, f, coll, colls)
    };
    G__8089.cljs$lang$maxFixedArity = 2;
    G__8089.cljs$lang$applyTo = function(arglist__8090) {
      var f = cljs.core.first(arglist__8090);
      var coll = cljs.core.first(cljs.core.next(arglist__8090));
      var colls = cljs.core.rest(cljs.core.next(arglist__8090));
      return G__8089__delegate(f, coll, colls)
    };
    G__8089.cljs$lang$arity$variadic = G__8089__delegate;
    return G__8089
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
    var temp__3974__auto____8100 = cljs.core.seq.call(null, coll);
    if(temp__3974__auto____8100) {
      var s__8101 = temp__3974__auto____8100;
      if(cljs.core.chunked_seq_QMARK_.call(null, s__8101)) {
        var c__8102 = cljs.core.chunk_first.call(null, s__8101);
        var size__8103 = cljs.core.count.call(null, c__8102);
        var b__8104 = cljs.core.chunk_buffer.call(null, size__8103);
        var n__2529__auto____8105 = size__8103;
        var i__8106 = 0;
        while(true) {
          if(i__8106 < n__2529__auto____8105) {
            if(cljs.core.truth_(pred.call(null, cljs.core._nth.call(null, c__8102, i__8106)))) {
              cljs.core.chunk_append.call(null, b__8104, cljs.core._nth.call(null, c__8102, i__8106))
            }else {
            }
            var G__8109 = i__8106 + 1;
            i__8106 = G__8109;
            continue
          }else {
          }
          break
        }
        return cljs.core.chunk_cons.call(null, cljs.core.chunk.call(null, b__8104), filter.call(null, pred, cljs.core.chunk_rest.call(null, s__8101)))
      }else {
        var f__8107 = cljs.core.first.call(null, s__8101);
        var r__8108 = cljs.core.rest.call(null, s__8101);
        if(cljs.core.truth_(pred.call(null, f__8107))) {
          return cljs.core.cons.call(null, f__8107, filter.call(null, pred, r__8108))
        }else {
          return filter.call(null, pred, r__8108)
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
  var walk__8112 = function walk(node) {
    return new cljs.core.LazySeq(null, false, function() {
      return cljs.core.cons.call(null, node, cljs.core.truth_(branch_QMARK_.call(null, node)) ? cljs.core.mapcat.call(null, walk, children.call(null, node)) : null)
    }, null)
  };
  return walk__8112.call(null, root)
};
cljs.core.flatten = function flatten(x) {
  return cljs.core.filter.call(null, function(p1__8110_SHARP_) {
    return!cljs.core.sequential_QMARK_.call(null, p1__8110_SHARP_)
  }, cljs.core.rest.call(null, cljs.core.tree_seq.call(null, cljs.core.sequential_QMARK_, cljs.core.seq, x)))
};
cljs.core.into = function into(to, from) {
  if(function() {
    var G__8116__8117 = to;
    if(G__8116__8117) {
      if(function() {
        var or__3824__auto____8118 = G__8116__8117.cljs$lang$protocol_mask$partition1$ & 1;
        if(or__3824__auto____8118) {
          return or__3824__auto____8118
        }else {
          return G__8116__8117.cljs$core$IEditableCollection$
        }
      }()) {
        return true
      }else {
        if(!G__8116__8117.cljs$lang$protocol_mask$partition1$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.IEditableCollection, G__8116__8117)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.IEditableCollection, G__8116__8117)
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
    var G__8119__delegate = function(f, c1, c2, c3, colls) {
      return cljs.core.into.call(null, cljs.core.PersistentVector.EMPTY, cljs.core.apply.call(null, cljs.core.map, f, c1, c2, c3, colls))
    };
    var G__8119 = function(f, c1, c2, c3, var_args) {
      var colls = null;
      if(goog.isDef(var_args)) {
        colls = cljs.core.array_seq(Array.prototype.slice.call(arguments, 4), 0)
      }
      return G__8119__delegate.call(this, f, c1, c2, c3, colls)
    };
    G__8119.cljs$lang$maxFixedArity = 4;
    G__8119.cljs$lang$applyTo = function(arglist__8120) {
      var f = cljs.core.first(arglist__8120);
      var c1 = cljs.core.first(cljs.core.next(arglist__8120));
      var c2 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__8120)));
      var c3 = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__8120))));
      var colls = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(arglist__8120))));
      return G__8119__delegate(f, c1, c2, c3, colls)
    };
    G__8119.cljs$lang$arity$variadic = G__8119__delegate;
    return G__8119
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
      var temp__3974__auto____8127 = cljs.core.seq.call(null, coll);
      if(temp__3974__auto____8127) {
        var s__8128 = temp__3974__auto____8127;
        var p__8129 = cljs.core.take.call(null, n, s__8128);
        if(n === cljs.core.count.call(null, p__8129)) {
          return cljs.core.cons.call(null, p__8129, partition.call(null, n, step, cljs.core.drop.call(null, step, s__8128)))
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
      var temp__3974__auto____8130 = cljs.core.seq.call(null, coll);
      if(temp__3974__auto____8130) {
        var s__8131 = temp__3974__auto____8130;
        var p__8132 = cljs.core.take.call(null, n, s__8131);
        if(n === cljs.core.count.call(null, p__8132)) {
          return cljs.core.cons.call(null, p__8132, partition.call(null, n, step, pad, cljs.core.drop.call(null, step, s__8131)))
        }else {
          return cljs.core.list.call(null, cljs.core.take.call(null, n, cljs.core.concat.call(null, p__8132, pad)))
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
    var sentinel__8137 = cljs.core.lookup_sentinel;
    var m__8138 = m;
    var ks__8139 = cljs.core.seq.call(null, ks);
    while(true) {
      if(ks__8139) {
        var m__8140 = cljs.core._lookup.call(null, m__8138, cljs.core.first.call(null, ks__8139), sentinel__8137);
        if(sentinel__8137 === m__8140) {
          return not_found
        }else {
          var G__8141 = sentinel__8137;
          var G__8142 = m__8140;
          var G__8143 = cljs.core.next.call(null, ks__8139);
          sentinel__8137 = G__8141;
          m__8138 = G__8142;
          ks__8139 = G__8143;
          continue
        }
      }else {
        return m__8138
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
cljs.core.assoc_in = function assoc_in(m, p__8144, v) {
  var vec__8149__8150 = p__8144;
  var k__8151 = cljs.core.nth.call(null, vec__8149__8150, 0, null);
  var ks__8152 = cljs.core.nthnext.call(null, vec__8149__8150, 1);
  if(cljs.core.truth_(ks__8152)) {
    return cljs.core.assoc.call(null, m, k__8151, assoc_in.call(null, cljs.core._lookup.call(null, m, k__8151, null), ks__8152, v))
  }else {
    return cljs.core.assoc.call(null, m, k__8151, v)
  }
};
cljs.core.update_in = function() {
  var update_in__delegate = function(m, p__8153, f, args) {
    var vec__8158__8159 = p__8153;
    var k__8160 = cljs.core.nth.call(null, vec__8158__8159, 0, null);
    var ks__8161 = cljs.core.nthnext.call(null, vec__8158__8159, 1);
    if(cljs.core.truth_(ks__8161)) {
      return cljs.core.assoc.call(null, m, k__8160, cljs.core.apply.call(null, update_in, cljs.core._lookup.call(null, m, k__8160, null), ks__8161, f, args))
    }else {
      return cljs.core.assoc.call(null, m, k__8160, cljs.core.apply.call(null, f, cljs.core._lookup.call(null, m, k__8160, null), args))
    }
  };
  var update_in = function(m, p__8153, f, var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
    }
    return update_in__delegate.call(this, m, p__8153, f, args)
  };
  update_in.cljs$lang$maxFixedArity = 3;
  update_in.cljs$lang$applyTo = function(arglist__8162) {
    var m = cljs.core.first(arglist__8162);
    var p__8153 = cljs.core.first(cljs.core.next(arglist__8162));
    var f = cljs.core.first(cljs.core.next(cljs.core.next(arglist__8162)));
    var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__8162)));
    return update_in__delegate(m, p__8153, f, args)
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
  var this__8165 = this;
  var h__2194__auto____8166 = this__8165.__hash;
  if(!(h__2194__auto____8166 == null)) {
    return h__2194__auto____8166
  }else {
    var h__2194__auto____8167 = cljs.core.hash_coll.call(null, coll);
    this__8165.__hash = h__2194__auto____8167;
    return h__2194__auto____8167
  }
};
cljs.core.Vector.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__8168 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, null)
};
cljs.core.Vector.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__8169 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, not_found)
};
cljs.core.Vector.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__8170 = this;
  var new_array__8171 = this__8170.array.slice();
  new_array__8171[k] = v;
  return new cljs.core.Vector(this__8170.meta, new_array__8171, null)
};
cljs.core.Vector.prototype.call = function() {
  var G__8202 = null;
  var G__8202__2 = function(this_sym8172, k) {
    var this__8174 = this;
    var this_sym8172__8175 = this;
    var coll__8176 = this_sym8172__8175;
    return coll__8176.cljs$core$ILookup$_lookup$arity$2(coll__8176, k)
  };
  var G__8202__3 = function(this_sym8173, k, not_found) {
    var this__8174 = this;
    var this_sym8173__8177 = this;
    var coll__8178 = this_sym8173__8177;
    return coll__8178.cljs$core$ILookup$_lookup$arity$3(coll__8178, k, not_found)
  };
  G__8202 = function(this_sym8173, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__8202__2.call(this, this_sym8173, k);
      case 3:
        return G__8202__3.call(this, this_sym8173, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__8202
}();
cljs.core.Vector.prototype.apply = function(this_sym8163, args8164) {
  var this__8179 = this;
  return this_sym8163.call.apply(this_sym8163, [this_sym8163].concat(args8164.slice()))
};
cljs.core.Vector.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__8180 = this;
  var new_array__8181 = this__8180.array.slice();
  new_array__8181.push(o);
  return new cljs.core.Vector(this__8180.meta, new_array__8181, null)
};
cljs.core.Vector.prototype.toString = function() {
  var this__8182 = this;
  var this__8183 = this;
  return cljs.core.pr_str.call(null, this__8183)
};
cljs.core.Vector.prototype.cljs$core$IReduce$_reduce$arity$2 = function(v, f) {
  var this__8184 = this;
  return cljs.core.ci_reduce.call(null, this__8184.array, f)
};
cljs.core.Vector.prototype.cljs$core$IReduce$_reduce$arity$3 = function(v, f, start) {
  var this__8185 = this;
  return cljs.core.ci_reduce.call(null, this__8185.array, f, start)
};
cljs.core.Vector.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__8186 = this;
  if(this__8186.array.length > 0) {
    var vector_seq__8187 = function vector_seq(i) {
      return new cljs.core.LazySeq(null, false, function() {
        if(i < this__8186.array.length) {
          return cljs.core.cons.call(null, this__8186.array[i], vector_seq.call(null, i + 1))
        }else {
          return null
        }
      }, null)
    };
    return vector_seq__8187.call(null, 0)
  }else {
    return null
  }
};
cljs.core.Vector.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__8188 = this;
  return this__8188.array.length
};
cljs.core.Vector.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__8189 = this;
  var count__8190 = this__8189.array.length;
  if(count__8190 > 0) {
    return this__8189.array[count__8190 - 1]
  }else {
    return null
  }
};
cljs.core.Vector.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__8191 = this;
  if(this__8191.array.length > 0) {
    var new_array__8192 = this__8191.array.slice();
    new_array__8192.pop();
    return new cljs.core.Vector(this__8191.meta, new_array__8192, null)
  }else {
    throw new Error("Can't pop empty vector");
  }
};
cljs.core.Vector.prototype.cljs$core$IVector$_assoc_n$arity$3 = function(coll, n, val) {
  var this__8193 = this;
  return coll.cljs$core$IAssociative$_assoc$arity$3(coll, n, val)
};
cljs.core.Vector.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__8194 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.Vector.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__8195 = this;
  return new cljs.core.Vector(meta, this__8195.array, this__8195.__hash)
};
cljs.core.Vector.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__8196 = this;
  return this__8196.meta
};
cljs.core.Vector.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, n) {
  var this__8197 = this;
  if(function() {
    var and__3822__auto____8198 = 0 <= n;
    if(and__3822__auto____8198) {
      return n < this__8197.array.length
    }else {
      return and__3822__auto____8198
    }
  }()) {
    return this__8197.array[n]
  }else {
    return null
  }
};
cljs.core.Vector.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, n, not_found) {
  var this__8199 = this;
  if(function() {
    var and__3822__auto____8200 = 0 <= n;
    if(and__3822__auto____8200) {
      return n < this__8199.array.length
    }else {
      return and__3822__auto____8200
    }
  }()) {
    return this__8199.array[n]
  }else {
    return not_found
  }
};
cljs.core.Vector.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__8201 = this;
  return cljs.core.with_meta.call(null, cljs.core.Vector.EMPTY, this__8201.meta)
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
  var cnt__8204 = pv.cnt;
  if(cnt__8204 < 32) {
    return 0
  }else {
    return cnt__8204 - 1 >>> 5 << 5
  }
};
cljs.core.new_path = function new_path(edit, level, node) {
  var ll__8210 = level;
  var ret__8211 = node;
  while(true) {
    if(ll__8210 === 0) {
      return ret__8211
    }else {
      var embed__8212 = ret__8211;
      var r__8213 = cljs.core.pv_fresh_node.call(null, edit);
      var ___8214 = cljs.core.pv_aset.call(null, r__8213, 0, embed__8212);
      var G__8215 = ll__8210 - 5;
      var G__8216 = r__8213;
      ll__8210 = G__8215;
      ret__8211 = G__8216;
      continue
    }
    break
  }
};
cljs.core.push_tail = function push_tail(pv, level, parent, tailnode) {
  var ret__8222 = cljs.core.pv_clone_node.call(null, parent);
  var subidx__8223 = pv.cnt - 1 >>> level & 31;
  if(5 === level) {
    cljs.core.pv_aset.call(null, ret__8222, subidx__8223, tailnode);
    return ret__8222
  }else {
    var child__8224 = cljs.core.pv_aget.call(null, parent, subidx__8223);
    if(!(child__8224 == null)) {
      var node_to_insert__8225 = push_tail.call(null, pv, level - 5, child__8224, tailnode);
      cljs.core.pv_aset.call(null, ret__8222, subidx__8223, node_to_insert__8225);
      return ret__8222
    }else {
      var node_to_insert__8226 = cljs.core.new_path.call(null, null, level - 5, tailnode);
      cljs.core.pv_aset.call(null, ret__8222, subidx__8223, node_to_insert__8226);
      return ret__8222
    }
  }
};
cljs.core.array_for = function array_for(pv, i) {
  if(function() {
    var and__3822__auto____8230 = 0 <= i;
    if(and__3822__auto____8230) {
      return i < pv.cnt
    }else {
      return and__3822__auto____8230
    }
  }()) {
    if(i >= cljs.core.tail_off.call(null, pv)) {
      return pv.tail
    }else {
      var node__8231 = pv.root;
      var level__8232 = pv.shift;
      while(true) {
        if(level__8232 > 0) {
          var G__8233 = cljs.core.pv_aget.call(null, node__8231, i >>> level__8232 & 31);
          var G__8234 = level__8232 - 5;
          node__8231 = G__8233;
          level__8232 = G__8234;
          continue
        }else {
          return node__8231.arr
        }
        break
      }
    }
  }else {
    throw new Error([cljs.core.str("No item "), cljs.core.str(i), cljs.core.str(" in vector of length "), cljs.core.str(pv.cnt)].join(""));
  }
};
cljs.core.do_assoc = function do_assoc(pv, level, node, i, val) {
  var ret__8237 = cljs.core.pv_clone_node.call(null, node);
  if(level === 0) {
    cljs.core.pv_aset.call(null, ret__8237, i & 31, val);
    return ret__8237
  }else {
    var subidx__8238 = i >>> level & 31;
    cljs.core.pv_aset.call(null, ret__8237, subidx__8238, do_assoc.call(null, pv, level - 5, cljs.core.pv_aget.call(null, node, subidx__8238), i, val));
    return ret__8237
  }
};
cljs.core.pop_tail = function pop_tail(pv, level, node) {
  var subidx__8244 = pv.cnt - 2 >>> level & 31;
  if(level > 5) {
    var new_child__8245 = pop_tail.call(null, pv, level - 5, cljs.core.pv_aget.call(null, node, subidx__8244));
    if(function() {
      var and__3822__auto____8246 = new_child__8245 == null;
      if(and__3822__auto____8246) {
        return subidx__8244 === 0
      }else {
        return and__3822__auto____8246
      }
    }()) {
      return null
    }else {
      var ret__8247 = cljs.core.pv_clone_node.call(null, node);
      cljs.core.pv_aset.call(null, ret__8247, subidx__8244, new_child__8245);
      return ret__8247
    }
  }else {
    if(subidx__8244 === 0) {
      return null
    }else {
      if("\ufdd0'else") {
        var ret__8248 = cljs.core.pv_clone_node.call(null, node);
        cljs.core.pv_aset.call(null, ret__8248, subidx__8244, null);
        return ret__8248
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
  var this__8251 = this;
  return new cljs.core.TransientVector(this__8251.cnt, this__8251.shift, cljs.core.tv_editable_root.call(null, this__8251.root), cljs.core.tv_editable_tail.call(null, this__8251.tail))
};
cljs.core.PersistentVector.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__8252 = this;
  var h__2194__auto____8253 = this__8252.__hash;
  if(!(h__2194__auto____8253 == null)) {
    return h__2194__auto____8253
  }else {
    var h__2194__auto____8254 = cljs.core.hash_coll.call(null, coll);
    this__8252.__hash = h__2194__auto____8254;
    return h__2194__auto____8254
  }
};
cljs.core.PersistentVector.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__8255 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, null)
};
cljs.core.PersistentVector.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__8256 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, not_found)
};
cljs.core.PersistentVector.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__8257 = this;
  if(function() {
    var and__3822__auto____8258 = 0 <= k;
    if(and__3822__auto____8258) {
      return k < this__8257.cnt
    }else {
      return and__3822__auto____8258
    }
  }()) {
    if(cljs.core.tail_off.call(null, coll) <= k) {
      var new_tail__8259 = this__8257.tail.slice();
      new_tail__8259[k & 31] = v;
      return new cljs.core.PersistentVector(this__8257.meta, this__8257.cnt, this__8257.shift, this__8257.root, new_tail__8259, null)
    }else {
      return new cljs.core.PersistentVector(this__8257.meta, this__8257.cnt, this__8257.shift, cljs.core.do_assoc.call(null, coll, this__8257.shift, this__8257.root, k, v), this__8257.tail, null)
    }
  }else {
    if(k === this__8257.cnt) {
      return coll.cljs$core$ICollection$_conj$arity$2(coll, v)
    }else {
      if("\ufdd0'else") {
        throw new Error([cljs.core.str("Index "), cljs.core.str(k), cljs.core.str(" out of bounds  [0,"), cljs.core.str(this__8257.cnt), cljs.core.str("]")].join(""));
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentVector.prototype.call = function() {
  var G__8307 = null;
  var G__8307__2 = function(this_sym8260, k) {
    var this__8262 = this;
    var this_sym8260__8263 = this;
    var coll__8264 = this_sym8260__8263;
    return coll__8264.cljs$core$ILookup$_lookup$arity$2(coll__8264, k)
  };
  var G__8307__3 = function(this_sym8261, k, not_found) {
    var this__8262 = this;
    var this_sym8261__8265 = this;
    var coll__8266 = this_sym8261__8265;
    return coll__8266.cljs$core$ILookup$_lookup$arity$3(coll__8266, k, not_found)
  };
  G__8307 = function(this_sym8261, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__8307__2.call(this, this_sym8261, k);
      case 3:
        return G__8307__3.call(this, this_sym8261, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__8307
}();
cljs.core.PersistentVector.prototype.apply = function(this_sym8249, args8250) {
  var this__8267 = this;
  return this_sym8249.call.apply(this_sym8249, [this_sym8249].concat(args8250.slice()))
};
cljs.core.PersistentVector.prototype.cljs$core$IKVReduce$_kv_reduce$arity$3 = function(v, f, init) {
  var this__8268 = this;
  var step_init__8269 = [0, init];
  var i__8270 = 0;
  while(true) {
    if(i__8270 < this__8268.cnt) {
      var arr__8271 = cljs.core.array_for.call(null, v, i__8270);
      var len__8272 = arr__8271.length;
      var init__8276 = function() {
        var j__8273 = 0;
        var init__8274 = step_init__8269[1];
        while(true) {
          if(j__8273 < len__8272) {
            var init__8275 = f.call(null, init__8274, j__8273 + i__8270, arr__8271[j__8273]);
            if(cljs.core.reduced_QMARK_.call(null, init__8275)) {
              return init__8275
            }else {
              var G__8308 = j__8273 + 1;
              var G__8309 = init__8275;
              j__8273 = G__8308;
              init__8274 = G__8309;
              continue
            }
          }else {
            step_init__8269[0] = len__8272;
            step_init__8269[1] = init__8274;
            return init__8274
          }
          break
        }
      }();
      if(cljs.core.reduced_QMARK_.call(null, init__8276)) {
        return cljs.core.deref.call(null, init__8276)
      }else {
        var G__8310 = i__8270 + step_init__8269[0];
        i__8270 = G__8310;
        continue
      }
    }else {
      return step_init__8269[1]
    }
    break
  }
};
cljs.core.PersistentVector.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__8277 = this;
  if(this__8277.cnt - cljs.core.tail_off.call(null, coll) < 32) {
    var new_tail__8278 = this__8277.tail.slice();
    new_tail__8278.push(o);
    return new cljs.core.PersistentVector(this__8277.meta, this__8277.cnt + 1, this__8277.shift, this__8277.root, new_tail__8278, null)
  }else {
    var root_overflow_QMARK___8279 = this__8277.cnt >>> 5 > 1 << this__8277.shift;
    var new_shift__8280 = root_overflow_QMARK___8279 ? this__8277.shift + 5 : this__8277.shift;
    var new_root__8282 = root_overflow_QMARK___8279 ? function() {
      var n_r__8281 = cljs.core.pv_fresh_node.call(null, null);
      cljs.core.pv_aset.call(null, n_r__8281, 0, this__8277.root);
      cljs.core.pv_aset.call(null, n_r__8281, 1, cljs.core.new_path.call(null, null, this__8277.shift, new cljs.core.VectorNode(null, this__8277.tail)));
      return n_r__8281
    }() : cljs.core.push_tail.call(null, coll, this__8277.shift, this__8277.root, new cljs.core.VectorNode(null, this__8277.tail));
    return new cljs.core.PersistentVector(this__8277.meta, this__8277.cnt + 1, new_shift__8280, new_root__8282, [o], null)
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IReversible$_rseq$arity$1 = function(coll) {
  var this__8283 = this;
  if(this__8283.cnt > 0) {
    return new cljs.core.RSeq(coll, this__8283.cnt - 1, null)
  }else {
    return cljs.core.List.EMPTY
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IMapEntry$_key$arity$1 = function(coll) {
  var this__8284 = this;
  return coll.cljs$core$IIndexed$_nth$arity$2(coll, 0)
};
cljs.core.PersistentVector.prototype.cljs$core$IMapEntry$_val$arity$1 = function(coll) {
  var this__8285 = this;
  return coll.cljs$core$IIndexed$_nth$arity$2(coll, 1)
};
cljs.core.PersistentVector.prototype.toString = function() {
  var this__8286 = this;
  var this__8287 = this;
  return cljs.core.pr_str.call(null, this__8287)
};
cljs.core.PersistentVector.prototype.cljs$core$IReduce$_reduce$arity$2 = function(v, f) {
  var this__8288 = this;
  return cljs.core.ci_reduce.call(null, v, f)
};
cljs.core.PersistentVector.prototype.cljs$core$IReduce$_reduce$arity$3 = function(v, f, start) {
  var this__8289 = this;
  return cljs.core.ci_reduce.call(null, v, f, start)
};
cljs.core.PersistentVector.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__8290 = this;
  if(this__8290.cnt === 0) {
    return null
  }else {
    return cljs.core.chunked_seq.call(null, coll, 0, 0)
  }
};
cljs.core.PersistentVector.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__8291 = this;
  return this__8291.cnt
};
cljs.core.PersistentVector.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__8292 = this;
  if(this__8292.cnt > 0) {
    return coll.cljs$core$IIndexed$_nth$arity$2(coll, this__8292.cnt - 1)
  }else {
    return null
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__8293 = this;
  if(this__8293.cnt === 0) {
    throw new Error("Can't pop empty vector");
  }else {
    if(1 === this__8293.cnt) {
      return cljs.core._with_meta.call(null, cljs.core.PersistentVector.EMPTY, this__8293.meta)
    }else {
      if(1 < this__8293.cnt - cljs.core.tail_off.call(null, coll)) {
        return new cljs.core.PersistentVector(this__8293.meta, this__8293.cnt - 1, this__8293.shift, this__8293.root, this__8293.tail.slice(0, -1), null)
      }else {
        if("\ufdd0'else") {
          var new_tail__8294 = cljs.core.array_for.call(null, coll, this__8293.cnt - 2);
          var nr__8295 = cljs.core.pop_tail.call(null, coll, this__8293.shift, this__8293.root);
          var new_root__8296 = nr__8295 == null ? cljs.core.PersistentVector.EMPTY_NODE : nr__8295;
          var cnt_1__8297 = this__8293.cnt - 1;
          if(function() {
            var and__3822__auto____8298 = 5 < this__8293.shift;
            if(and__3822__auto____8298) {
              return cljs.core.pv_aget.call(null, new_root__8296, 1) == null
            }else {
              return and__3822__auto____8298
            }
          }()) {
            return new cljs.core.PersistentVector(this__8293.meta, cnt_1__8297, this__8293.shift - 5, cljs.core.pv_aget.call(null, new_root__8296, 0), new_tail__8294, null)
          }else {
            return new cljs.core.PersistentVector(this__8293.meta, cnt_1__8297, this__8293.shift, new_root__8296, new_tail__8294, null)
          }
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IVector$_assoc_n$arity$3 = function(coll, n, val) {
  var this__8299 = this;
  return coll.cljs$core$IAssociative$_assoc$arity$3(coll, n, val)
};
cljs.core.PersistentVector.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__8300 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.PersistentVector.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__8301 = this;
  return new cljs.core.PersistentVector(meta, this__8301.cnt, this__8301.shift, this__8301.root, this__8301.tail, this__8301.__hash)
};
cljs.core.PersistentVector.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__8302 = this;
  return this__8302.meta
};
cljs.core.PersistentVector.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, n) {
  var this__8303 = this;
  return cljs.core.array_for.call(null, coll, n)[n & 31]
};
cljs.core.PersistentVector.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, n, not_found) {
  var this__8304 = this;
  if(function() {
    var and__3822__auto____8305 = 0 <= n;
    if(and__3822__auto____8305) {
      return n < this__8304.cnt
    }else {
      return and__3822__auto____8305
    }
  }()) {
    return coll.cljs$core$IIndexed$_nth$arity$2(coll, n)
  }else {
    return not_found
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__8306 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentVector.EMPTY, this__8306.meta)
};
cljs.core.PersistentVector;
cljs.core.PersistentVector.EMPTY_NODE = cljs.core.pv_fresh_node.call(null, null);
cljs.core.PersistentVector.EMPTY = new cljs.core.PersistentVector(null, 0, 5, cljs.core.PersistentVector.EMPTY_NODE, [], 0);
cljs.core.PersistentVector.fromArray = function(xs, no_clone) {
  var l__8311 = xs.length;
  var xs__8312 = no_clone === true ? xs : xs.slice();
  if(l__8311 < 32) {
    return new cljs.core.PersistentVector(null, l__8311, 5, cljs.core.PersistentVector.EMPTY_NODE, xs__8312, null)
  }else {
    var node__8313 = xs__8312.slice(0, 32);
    var v__8314 = new cljs.core.PersistentVector(null, 32, 5, cljs.core.PersistentVector.EMPTY_NODE, node__8313, null);
    var i__8315 = 32;
    var out__8316 = cljs.core._as_transient.call(null, v__8314);
    while(true) {
      if(i__8315 < l__8311) {
        var G__8317 = i__8315 + 1;
        var G__8318 = cljs.core.conj_BANG_.call(null, out__8316, xs__8312[i__8315]);
        i__8315 = G__8317;
        out__8316 = G__8318;
        continue
      }else {
        return cljs.core.persistent_BANG_.call(null, out__8316)
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
  vector.cljs$lang$applyTo = function(arglist__8319) {
    var args = cljs.core.seq(arglist__8319);
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
  var this__8320 = this;
  if(this__8320.off + 1 < this__8320.node.length) {
    var s__8321 = cljs.core.chunked_seq.call(null, this__8320.vec, this__8320.node, this__8320.i, this__8320.off + 1);
    if(s__8321 == null) {
      return null
    }else {
      return s__8321
    }
  }else {
    return coll.cljs$core$IChunkedNext$_chunked_next$arity$1(coll)
  }
};
cljs.core.ChunkedSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__8322 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.ChunkedSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__8323 = this;
  return coll
};
cljs.core.ChunkedSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__8324 = this;
  return this__8324.node[this__8324.off]
};
cljs.core.ChunkedSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__8325 = this;
  if(this__8325.off + 1 < this__8325.node.length) {
    var s__8326 = cljs.core.chunked_seq.call(null, this__8325.vec, this__8325.node, this__8325.i, this__8325.off + 1);
    if(s__8326 == null) {
      return cljs.core.List.EMPTY
    }else {
      return s__8326
    }
  }else {
    return coll.cljs$core$IChunkedSeq$_chunked_rest$arity$1(coll)
  }
};
cljs.core.ChunkedSeq.prototype.cljs$core$IChunkedNext$ = true;
cljs.core.ChunkedSeq.prototype.cljs$core$IChunkedNext$_chunked_next$arity$1 = function(coll) {
  var this__8327 = this;
  var l__8328 = this__8327.node.length;
  var s__8329 = this__8327.i + l__8328 < cljs.core._count.call(null, this__8327.vec) ? cljs.core.chunked_seq.call(null, this__8327.vec, this__8327.i + l__8328, 0) : null;
  if(s__8329 == null) {
    return null
  }else {
    return s__8329
  }
};
cljs.core.ChunkedSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__8330 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.ChunkedSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, m) {
  var this__8331 = this;
  return cljs.core.chunked_seq.call(null, this__8331.vec, this__8331.node, this__8331.i, this__8331.off, m)
};
cljs.core.ChunkedSeq.prototype.cljs$core$IWithMeta$_meta$arity$1 = function(coll) {
  var this__8332 = this;
  return this__8332.meta
};
cljs.core.ChunkedSeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__8333 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentVector.EMPTY, this__8333.meta)
};
cljs.core.ChunkedSeq.prototype.cljs$core$IChunkedSeq$ = true;
cljs.core.ChunkedSeq.prototype.cljs$core$IChunkedSeq$_chunked_first$arity$1 = function(coll) {
  var this__8334 = this;
  return cljs.core.array_chunk.call(null, this__8334.node, this__8334.off)
};
cljs.core.ChunkedSeq.prototype.cljs$core$IChunkedSeq$_chunked_rest$arity$1 = function(coll) {
  var this__8335 = this;
  var l__8336 = this__8335.node.length;
  var s__8337 = this__8335.i + l__8336 < cljs.core._count.call(null, this__8335.vec) ? cljs.core.chunked_seq.call(null, this__8335.vec, this__8335.i + l__8336, 0) : null;
  if(s__8337 == null) {
    return cljs.core.List.EMPTY
  }else {
    return s__8337
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
  var this__8340 = this;
  var h__2194__auto____8341 = this__8340.__hash;
  if(!(h__2194__auto____8341 == null)) {
    return h__2194__auto____8341
  }else {
    var h__2194__auto____8342 = cljs.core.hash_coll.call(null, coll);
    this__8340.__hash = h__2194__auto____8342;
    return h__2194__auto____8342
  }
};
cljs.core.Subvec.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__8343 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, null)
};
cljs.core.Subvec.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__8344 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, not_found)
};
cljs.core.Subvec.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, key, val) {
  var this__8345 = this;
  var v_pos__8346 = this__8345.start + key;
  return new cljs.core.Subvec(this__8345.meta, cljs.core._assoc.call(null, this__8345.v, v_pos__8346, val), this__8345.start, this__8345.end > v_pos__8346 + 1 ? this__8345.end : v_pos__8346 + 1, null)
};
cljs.core.Subvec.prototype.call = function() {
  var G__8372 = null;
  var G__8372__2 = function(this_sym8347, k) {
    var this__8349 = this;
    var this_sym8347__8350 = this;
    var coll__8351 = this_sym8347__8350;
    return coll__8351.cljs$core$ILookup$_lookup$arity$2(coll__8351, k)
  };
  var G__8372__3 = function(this_sym8348, k, not_found) {
    var this__8349 = this;
    var this_sym8348__8352 = this;
    var coll__8353 = this_sym8348__8352;
    return coll__8353.cljs$core$ILookup$_lookup$arity$3(coll__8353, k, not_found)
  };
  G__8372 = function(this_sym8348, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__8372__2.call(this, this_sym8348, k);
      case 3:
        return G__8372__3.call(this, this_sym8348, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__8372
}();
cljs.core.Subvec.prototype.apply = function(this_sym8338, args8339) {
  var this__8354 = this;
  return this_sym8338.call.apply(this_sym8338, [this_sym8338].concat(args8339.slice()))
};
cljs.core.Subvec.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__8355 = this;
  return new cljs.core.Subvec(this__8355.meta, cljs.core._assoc_n.call(null, this__8355.v, this__8355.end, o), this__8355.start, this__8355.end + 1, null)
};
cljs.core.Subvec.prototype.toString = function() {
  var this__8356 = this;
  var this__8357 = this;
  return cljs.core.pr_str.call(null, this__8357)
};
cljs.core.Subvec.prototype.cljs$core$IReduce$_reduce$arity$2 = function(coll, f) {
  var this__8358 = this;
  return cljs.core.ci_reduce.call(null, coll, f)
};
cljs.core.Subvec.prototype.cljs$core$IReduce$_reduce$arity$3 = function(coll, f, start) {
  var this__8359 = this;
  return cljs.core.ci_reduce.call(null, coll, f, start)
};
cljs.core.Subvec.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__8360 = this;
  var subvec_seq__8361 = function subvec_seq(i) {
    if(i === this__8360.end) {
      return null
    }else {
      return cljs.core.cons.call(null, cljs.core._nth.call(null, this__8360.v, i), new cljs.core.LazySeq(null, false, function() {
        return subvec_seq.call(null, i + 1)
      }, null))
    }
  };
  return subvec_seq__8361.call(null, this__8360.start)
};
cljs.core.Subvec.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__8362 = this;
  return this__8362.end - this__8362.start
};
cljs.core.Subvec.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__8363 = this;
  return cljs.core._nth.call(null, this__8363.v, this__8363.end - 1)
};
cljs.core.Subvec.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__8364 = this;
  if(this__8364.start === this__8364.end) {
    throw new Error("Can't pop empty vector");
  }else {
    return new cljs.core.Subvec(this__8364.meta, this__8364.v, this__8364.start, this__8364.end - 1, null)
  }
};
cljs.core.Subvec.prototype.cljs$core$IVector$_assoc_n$arity$3 = function(coll, n, val) {
  var this__8365 = this;
  return coll.cljs$core$IAssociative$_assoc$arity$3(coll, n, val)
};
cljs.core.Subvec.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__8366 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.Subvec.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__8367 = this;
  return new cljs.core.Subvec(meta, this__8367.v, this__8367.start, this__8367.end, this__8367.__hash)
};
cljs.core.Subvec.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__8368 = this;
  return this__8368.meta
};
cljs.core.Subvec.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, n) {
  var this__8369 = this;
  return cljs.core._nth.call(null, this__8369.v, this__8369.start + n)
};
cljs.core.Subvec.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, n, not_found) {
  var this__8370 = this;
  return cljs.core._nth.call(null, this__8370.v, this__8370.start + n, not_found)
};
cljs.core.Subvec.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__8371 = this;
  return cljs.core.with_meta.call(null, cljs.core.Vector.EMPTY, this__8371.meta)
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
  var ret__8374 = cljs.core.make_array.call(null, 32);
  cljs.core.array_copy.call(null, tl, 0, ret__8374, 0, tl.length);
  return ret__8374
};
cljs.core.tv_push_tail = function tv_push_tail(tv, level, parent, tail_node) {
  var ret__8378 = cljs.core.tv_ensure_editable.call(null, tv.root.edit, parent);
  var subidx__8379 = tv.cnt - 1 >>> level & 31;
  cljs.core.pv_aset.call(null, ret__8378, subidx__8379, level === 5 ? tail_node : function() {
    var child__8380 = cljs.core.pv_aget.call(null, ret__8378, subidx__8379);
    if(!(child__8380 == null)) {
      return tv_push_tail.call(null, tv, level - 5, child__8380, tail_node)
    }else {
      return cljs.core.new_path.call(null, tv.root.edit, level - 5, tail_node)
    }
  }());
  return ret__8378
};
cljs.core.tv_pop_tail = function tv_pop_tail(tv, level, node) {
  var node__8385 = cljs.core.tv_ensure_editable.call(null, tv.root.edit, node);
  var subidx__8386 = tv.cnt - 2 >>> level & 31;
  if(level > 5) {
    var new_child__8387 = tv_pop_tail.call(null, tv, level - 5, cljs.core.pv_aget.call(null, node__8385, subidx__8386));
    if(function() {
      var and__3822__auto____8388 = new_child__8387 == null;
      if(and__3822__auto____8388) {
        return subidx__8386 === 0
      }else {
        return and__3822__auto____8388
      }
    }()) {
      return null
    }else {
      cljs.core.pv_aset.call(null, node__8385, subidx__8386, new_child__8387);
      return node__8385
    }
  }else {
    if(subidx__8386 === 0) {
      return null
    }else {
      if("\ufdd0'else") {
        cljs.core.pv_aset.call(null, node__8385, subidx__8386, null);
        return node__8385
      }else {
        return null
      }
    }
  }
};
cljs.core.editable_array_for = function editable_array_for(tv, i) {
  if(function() {
    var and__3822__auto____8393 = 0 <= i;
    if(and__3822__auto____8393) {
      return i < tv.cnt
    }else {
      return and__3822__auto____8393
    }
  }()) {
    if(i >= cljs.core.tail_off.call(null, tv)) {
      return tv.tail
    }else {
      var root__8394 = tv.root;
      var node__8395 = root__8394;
      var level__8396 = tv.shift;
      while(true) {
        if(level__8396 > 0) {
          var G__8397 = cljs.core.tv_ensure_editable.call(null, root__8394.edit, cljs.core.pv_aget.call(null, node__8395, i >>> level__8396 & 31));
          var G__8398 = level__8396 - 5;
          node__8395 = G__8397;
          level__8396 = G__8398;
          continue
        }else {
          return node__8395.arr
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
  var G__8438 = null;
  var G__8438__2 = function(this_sym8401, k) {
    var this__8403 = this;
    var this_sym8401__8404 = this;
    var coll__8405 = this_sym8401__8404;
    return coll__8405.cljs$core$ILookup$_lookup$arity$2(coll__8405, k)
  };
  var G__8438__3 = function(this_sym8402, k, not_found) {
    var this__8403 = this;
    var this_sym8402__8406 = this;
    var coll__8407 = this_sym8402__8406;
    return coll__8407.cljs$core$ILookup$_lookup$arity$3(coll__8407, k, not_found)
  };
  G__8438 = function(this_sym8402, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__8438__2.call(this, this_sym8402, k);
      case 3:
        return G__8438__3.call(this, this_sym8402, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__8438
}();
cljs.core.TransientVector.prototype.apply = function(this_sym8399, args8400) {
  var this__8408 = this;
  return this_sym8399.call.apply(this_sym8399, [this_sym8399].concat(args8400.slice()))
};
cljs.core.TransientVector.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__8409 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, null)
};
cljs.core.TransientVector.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__8410 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, not_found)
};
cljs.core.TransientVector.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, n) {
  var this__8411 = this;
  if(this__8411.root.edit) {
    return cljs.core.array_for.call(null, coll, n)[n & 31]
  }else {
    throw new Error("nth after persistent!");
  }
};
cljs.core.TransientVector.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, n, not_found) {
  var this__8412 = this;
  if(function() {
    var and__3822__auto____8413 = 0 <= n;
    if(and__3822__auto____8413) {
      return n < this__8412.cnt
    }else {
      return and__3822__auto____8413
    }
  }()) {
    return coll.cljs$core$IIndexed$_nth$arity$2(coll, n)
  }else {
    return not_found
  }
};
cljs.core.TransientVector.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__8414 = this;
  if(this__8414.root.edit) {
    return this__8414.cnt
  }else {
    throw new Error("count after persistent!");
  }
};
cljs.core.TransientVector.prototype.cljs$core$ITransientVector$_assoc_n_BANG_$arity$3 = function(tcoll, n, val) {
  var this__8415 = this;
  if(this__8415.root.edit) {
    if(function() {
      var and__3822__auto____8416 = 0 <= n;
      if(and__3822__auto____8416) {
        return n < this__8415.cnt
      }else {
        return and__3822__auto____8416
      }
    }()) {
      if(cljs.core.tail_off.call(null, tcoll) <= n) {
        this__8415.tail[n & 31] = val;
        return tcoll
      }else {
        var new_root__8421 = function go(level, node) {
          var node__8419 = cljs.core.tv_ensure_editable.call(null, this__8415.root.edit, node);
          if(level === 0) {
            cljs.core.pv_aset.call(null, node__8419, n & 31, val);
            return node__8419
          }else {
            var subidx__8420 = n >>> level & 31;
            cljs.core.pv_aset.call(null, node__8419, subidx__8420, go.call(null, level - 5, cljs.core.pv_aget.call(null, node__8419, subidx__8420)));
            return node__8419
          }
        }.call(null, this__8415.shift, this__8415.root);
        this__8415.root = new_root__8421;
        return tcoll
      }
    }else {
      if(n === this__8415.cnt) {
        return tcoll.cljs$core$ITransientCollection$_conj_BANG_$arity$2(tcoll, val)
      }else {
        if("\ufdd0'else") {
          throw new Error([cljs.core.str("Index "), cljs.core.str(n), cljs.core.str(" out of bounds for TransientVector of length"), cljs.core.str(this__8415.cnt)].join(""));
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
  var this__8422 = this;
  if(this__8422.root.edit) {
    if(this__8422.cnt === 0) {
      throw new Error("Can't pop empty vector");
    }else {
      if(1 === this__8422.cnt) {
        this__8422.cnt = 0;
        return tcoll
      }else {
        if((this__8422.cnt - 1 & 31) > 0) {
          this__8422.cnt = this__8422.cnt - 1;
          return tcoll
        }else {
          if("\ufdd0'else") {
            var new_tail__8423 = cljs.core.editable_array_for.call(null, tcoll, this__8422.cnt - 2);
            var new_root__8425 = function() {
              var nr__8424 = cljs.core.tv_pop_tail.call(null, tcoll, this__8422.shift, this__8422.root);
              if(!(nr__8424 == null)) {
                return nr__8424
              }else {
                return new cljs.core.VectorNode(this__8422.root.edit, cljs.core.make_array.call(null, 32))
              }
            }();
            if(function() {
              var and__3822__auto____8426 = 5 < this__8422.shift;
              if(and__3822__auto____8426) {
                return cljs.core.pv_aget.call(null, new_root__8425, 1) == null
              }else {
                return and__3822__auto____8426
              }
            }()) {
              var new_root__8427 = cljs.core.tv_ensure_editable.call(null, this__8422.root.edit, cljs.core.pv_aget.call(null, new_root__8425, 0));
              this__8422.root = new_root__8427;
              this__8422.shift = this__8422.shift - 5;
              this__8422.cnt = this__8422.cnt - 1;
              this__8422.tail = new_tail__8423;
              return tcoll
            }else {
              this__8422.root = new_root__8425;
              this__8422.cnt = this__8422.cnt - 1;
              this__8422.tail = new_tail__8423;
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
  var this__8428 = this;
  return tcoll.cljs$core$ITransientVector$_assoc_n_BANG_$arity$3(tcoll, key, val)
};
cljs.core.TransientVector.prototype.cljs$core$ITransientCollection$_conj_BANG_$arity$2 = function(tcoll, o) {
  var this__8429 = this;
  if(this__8429.root.edit) {
    if(this__8429.cnt - cljs.core.tail_off.call(null, tcoll) < 32) {
      this__8429.tail[this__8429.cnt & 31] = o;
      this__8429.cnt = this__8429.cnt + 1;
      return tcoll
    }else {
      var tail_node__8430 = new cljs.core.VectorNode(this__8429.root.edit, this__8429.tail);
      var new_tail__8431 = cljs.core.make_array.call(null, 32);
      new_tail__8431[0] = o;
      this__8429.tail = new_tail__8431;
      if(this__8429.cnt >>> 5 > 1 << this__8429.shift) {
        var new_root_array__8432 = cljs.core.make_array.call(null, 32);
        var new_shift__8433 = this__8429.shift + 5;
        new_root_array__8432[0] = this__8429.root;
        new_root_array__8432[1] = cljs.core.new_path.call(null, this__8429.root.edit, this__8429.shift, tail_node__8430);
        this__8429.root = new cljs.core.VectorNode(this__8429.root.edit, new_root_array__8432);
        this__8429.shift = new_shift__8433;
        this__8429.cnt = this__8429.cnt + 1;
        return tcoll
      }else {
        var new_root__8434 = cljs.core.tv_push_tail.call(null, tcoll, this__8429.shift, this__8429.root, tail_node__8430);
        this__8429.root = new_root__8434;
        this__8429.cnt = this__8429.cnt + 1;
        return tcoll
      }
    }
  }else {
    throw new Error("conj! after persistent!");
  }
};
cljs.core.TransientVector.prototype.cljs$core$ITransientCollection$_persistent_BANG_$arity$1 = function(tcoll) {
  var this__8435 = this;
  if(this__8435.root.edit) {
    this__8435.root.edit = null;
    var len__8436 = this__8435.cnt - cljs.core.tail_off.call(null, tcoll);
    var trimmed_tail__8437 = cljs.core.make_array.call(null, len__8436);
    cljs.core.array_copy.call(null, this__8435.tail, 0, trimmed_tail__8437, 0, len__8436);
    return new cljs.core.PersistentVector(null, this__8435.cnt, this__8435.shift, this__8435.root, trimmed_tail__8437, null)
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
  var this__8439 = this;
  var h__2194__auto____8440 = this__8439.__hash;
  if(!(h__2194__auto____8440 == null)) {
    return h__2194__auto____8440
  }else {
    var h__2194__auto____8441 = cljs.core.hash_coll.call(null, coll);
    this__8439.__hash = h__2194__auto____8441;
    return h__2194__auto____8441
  }
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__8442 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.PersistentQueueSeq.prototype.toString = function() {
  var this__8443 = this;
  var this__8444 = this;
  return cljs.core.pr_str.call(null, this__8444)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__8445 = this;
  return coll
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__8446 = this;
  return cljs.core._first.call(null, this__8446.front)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__8447 = this;
  var temp__3971__auto____8448 = cljs.core.next.call(null, this__8447.front);
  if(temp__3971__auto____8448) {
    var f1__8449 = temp__3971__auto____8448;
    return new cljs.core.PersistentQueueSeq(this__8447.meta, f1__8449, this__8447.rear, null)
  }else {
    if(this__8447.rear == null) {
      return coll.cljs$core$IEmptyableCollection$_empty$arity$1(coll)
    }else {
      return new cljs.core.PersistentQueueSeq(this__8447.meta, this__8447.rear, null, null)
    }
  }
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__8450 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__8451 = this;
  return new cljs.core.PersistentQueueSeq(meta, this__8451.front, this__8451.rear, this__8451.__hash)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__8452 = this;
  return this__8452.meta
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__8453 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__8453.meta)
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
  var this__8454 = this;
  var h__2194__auto____8455 = this__8454.__hash;
  if(!(h__2194__auto____8455 == null)) {
    return h__2194__auto____8455
  }else {
    var h__2194__auto____8456 = cljs.core.hash_coll.call(null, coll);
    this__8454.__hash = h__2194__auto____8456;
    return h__2194__auto____8456
  }
};
cljs.core.PersistentQueue.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__8457 = this;
  if(cljs.core.truth_(this__8457.front)) {
    return new cljs.core.PersistentQueue(this__8457.meta, this__8457.count + 1, this__8457.front, cljs.core.conj.call(null, function() {
      var or__3824__auto____8458 = this__8457.rear;
      if(cljs.core.truth_(or__3824__auto____8458)) {
        return or__3824__auto____8458
      }else {
        return cljs.core.PersistentVector.EMPTY
      }
    }(), o), null)
  }else {
    return new cljs.core.PersistentQueue(this__8457.meta, this__8457.count + 1, cljs.core.conj.call(null, this__8457.front, o), cljs.core.PersistentVector.EMPTY, null)
  }
};
cljs.core.PersistentQueue.prototype.toString = function() {
  var this__8459 = this;
  var this__8460 = this;
  return cljs.core.pr_str.call(null, this__8460)
};
cljs.core.PersistentQueue.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__8461 = this;
  var rear__8462 = cljs.core.seq.call(null, this__8461.rear);
  if(cljs.core.truth_(function() {
    var or__3824__auto____8463 = this__8461.front;
    if(cljs.core.truth_(or__3824__auto____8463)) {
      return or__3824__auto____8463
    }else {
      return rear__8462
    }
  }())) {
    return new cljs.core.PersistentQueueSeq(null, this__8461.front, cljs.core.seq.call(null, rear__8462), null)
  }else {
    return null
  }
};
cljs.core.PersistentQueue.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__8464 = this;
  return this__8464.count
};
cljs.core.PersistentQueue.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__8465 = this;
  return cljs.core._first.call(null, this__8465.front)
};
cljs.core.PersistentQueue.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__8466 = this;
  if(cljs.core.truth_(this__8466.front)) {
    var temp__3971__auto____8467 = cljs.core.next.call(null, this__8466.front);
    if(temp__3971__auto____8467) {
      var f1__8468 = temp__3971__auto____8467;
      return new cljs.core.PersistentQueue(this__8466.meta, this__8466.count - 1, f1__8468, this__8466.rear, null)
    }else {
      return new cljs.core.PersistentQueue(this__8466.meta, this__8466.count - 1, cljs.core.seq.call(null, this__8466.rear), cljs.core.PersistentVector.EMPTY, null)
    }
  }else {
    return coll
  }
};
cljs.core.PersistentQueue.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__8469 = this;
  return cljs.core.first.call(null, this__8469.front)
};
cljs.core.PersistentQueue.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__8470 = this;
  return cljs.core.rest.call(null, cljs.core.seq.call(null, coll))
};
cljs.core.PersistentQueue.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__8471 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.PersistentQueue.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__8472 = this;
  return new cljs.core.PersistentQueue(meta, this__8472.count, this__8472.front, this__8472.rear, this__8472.__hash)
};
cljs.core.PersistentQueue.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__8473 = this;
  return this__8473.meta
};
cljs.core.PersistentQueue.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__8474 = this;
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
  var this__8475 = this;
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
  var len__8478 = array.length;
  var i__8479 = 0;
  while(true) {
    if(i__8479 < len__8478) {
      if(k === array[i__8479]) {
        return i__8479
      }else {
        var G__8480 = i__8479 + incr;
        i__8479 = G__8480;
        continue
      }
    }else {
      return null
    }
    break
  }
};
cljs.core.obj_map_compare_keys = function obj_map_compare_keys(a, b) {
  var a__8483 = cljs.core.hash.call(null, a);
  var b__8484 = cljs.core.hash.call(null, b);
  if(a__8483 < b__8484) {
    return-1
  }else {
    if(a__8483 > b__8484) {
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
  var ks__8492 = m.keys;
  var len__8493 = ks__8492.length;
  var so__8494 = m.strobj;
  var out__8495 = cljs.core.with_meta.call(null, cljs.core.PersistentHashMap.EMPTY, cljs.core.meta.call(null, m));
  var i__8496 = 0;
  var out__8497 = cljs.core.transient$.call(null, out__8495);
  while(true) {
    if(i__8496 < len__8493) {
      var k__8498 = ks__8492[i__8496];
      var G__8499 = i__8496 + 1;
      var G__8500 = cljs.core.assoc_BANG_.call(null, out__8497, k__8498, so__8494[k__8498]);
      i__8496 = G__8499;
      out__8497 = G__8500;
      continue
    }else {
      return cljs.core.persistent_BANG_.call(null, cljs.core.assoc_BANG_.call(null, out__8497, k, v))
    }
    break
  }
};
cljs.core.obj_clone = function obj_clone(obj, ks) {
  var new_obj__8506 = {};
  var l__8507 = ks.length;
  var i__8508 = 0;
  while(true) {
    if(i__8508 < l__8507) {
      var k__8509 = ks[i__8508];
      new_obj__8506[k__8509] = obj[k__8509];
      var G__8510 = i__8508 + 1;
      i__8508 = G__8510;
      continue
    }else {
    }
    break
  }
  return new_obj__8506
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
  var this__8513 = this;
  return cljs.core.transient$.call(null, cljs.core.into.call(null, cljs.core.hash_map.call(null), coll))
};
cljs.core.ObjMap.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__8514 = this;
  var h__2194__auto____8515 = this__8514.__hash;
  if(!(h__2194__auto____8515 == null)) {
    return h__2194__auto____8515
  }else {
    var h__2194__auto____8516 = cljs.core.hash_imap.call(null, coll);
    this__8514.__hash = h__2194__auto____8516;
    return h__2194__auto____8516
  }
};
cljs.core.ObjMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__8517 = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(coll, k, null)
};
cljs.core.ObjMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__8518 = this;
  if(function() {
    var and__3822__auto____8519 = goog.isString(k);
    if(and__3822__auto____8519) {
      return!(cljs.core.scan_array.call(null, 1, k, this__8518.keys) == null)
    }else {
      return and__3822__auto____8519
    }
  }()) {
    return this__8518.strobj[k]
  }else {
    return not_found
  }
};
cljs.core.ObjMap.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__8520 = this;
  if(goog.isString(k)) {
    if(function() {
      var or__3824__auto____8521 = this__8520.update_count > cljs.core.ObjMap.HASHMAP_THRESHOLD;
      if(or__3824__auto____8521) {
        return or__3824__auto____8521
      }else {
        return this__8520.keys.length >= cljs.core.ObjMap.HASHMAP_THRESHOLD
      }
    }()) {
      return cljs.core.obj_map__GT_hash_map.call(null, coll, k, v)
    }else {
      if(!(cljs.core.scan_array.call(null, 1, k, this__8520.keys) == null)) {
        var new_strobj__8522 = cljs.core.obj_clone.call(null, this__8520.strobj, this__8520.keys);
        new_strobj__8522[k] = v;
        return new cljs.core.ObjMap(this__8520.meta, this__8520.keys, new_strobj__8522, this__8520.update_count + 1, null)
      }else {
        var new_strobj__8523 = cljs.core.obj_clone.call(null, this__8520.strobj, this__8520.keys);
        var new_keys__8524 = this__8520.keys.slice();
        new_strobj__8523[k] = v;
        new_keys__8524.push(k);
        return new cljs.core.ObjMap(this__8520.meta, new_keys__8524, new_strobj__8523, this__8520.update_count + 1, null)
      }
    }
  }else {
    return cljs.core.obj_map__GT_hash_map.call(null, coll, k, v)
  }
};
cljs.core.ObjMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = function(coll, k) {
  var this__8525 = this;
  if(function() {
    var and__3822__auto____8526 = goog.isString(k);
    if(and__3822__auto____8526) {
      return!(cljs.core.scan_array.call(null, 1, k, this__8525.keys) == null)
    }else {
      return and__3822__auto____8526
    }
  }()) {
    return true
  }else {
    return false
  }
};
cljs.core.ObjMap.prototype.call = function() {
  var G__8548 = null;
  var G__8548__2 = function(this_sym8527, k) {
    var this__8529 = this;
    var this_sym8527__8530 = this;
    var coll__8531 = this_sym8527__8530;
    return coll__8531.cljs$core$ILookup$_lookup$arity$2(coll__8531, k)
  };
  var G__8548__3 = function(this_sym8528, k, not_found) {
    var this__8529 = this;
    var this_sym8528__8532 = this;
    var coll__8533 = this_sym8528__8532;
    return coll__8533.cljs$core$ILookup$_lookup$arity$3(coll__8533, k, not_found)
  };
  G__8548 = function(this_sym8528, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__8548__2.call(this, this_sym8528, k);
      case 3:
        return G__8548__3.call(this, this_sym8528, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__8548
}();
cljs.core.ObjMap.prototype.apply = function(this_sym8511, args8512) {
  var this__8534 = this;
  return this_sym8511.call.apply(this_sym8511, [this_sym8511].concat(args8512.slice()))
};
cljs.core.ObjMap.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, entry) {
  var this__8535 = this;
  if(cljs.core.vector_QMARK_.call(null, entry)) {
    return coll.cljs$core$IAssociative$_assoc$arity$3(coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.ObjMap.prototype.toString = function() {
  var this__8536 = this;
  var this__8537 = this;
  return cljs.core.pr_str.call(null, this__8537)
};
cljs.core.ObjMap.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__8538 = this;
  if(this__8538.keys.length > 0) {
    return cljs.core.map.call(null, function(p1__8501_SHARP_) {
      return cljs.core.vector.call(null, p1__8501_SHARP_, this__8538.strobj[p1__8501_SHARP_])
    }, this__8538.keys.sort(cljs.core.obj_map_compare_keys))
  }else {
    return null
  }
};
cljs.core.ObjMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__8539 = this;
  return this__8539.keys.length
};
cljs.core.ObjMap.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__8540 = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.ObjMap.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__8541 = this;
  return new cljs.core.ObjMap(meta, this__8541.keys, this__8541.strobj, this__8541.update_count, this__8541.__hash)
};
cljs.core.ObjMap.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__8542 = this;
  return this__8542.meta
};
cljs.core.ObjMap.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__8543 = this;
  return cljs.core.with_meta.call(null, cljs.core.ObjMap.EMPTY, this__8543.meta)
};
cljs.core.ObjMap.prototype.cljs$core$IMap$_dissoc$arity$2 = function(coll, k) {
  var this__8544 = this;
  if(function() {
    var and__3822__auto____8545 = goog.isString(k);
    if(and__3822__auto____8545) {
      return!(cljs.core.scan_array.call(null, 1, k, this__8544.keys) == null)
    }else {
      return and__3822__auto____8545
    }
  }()) {
    var new_keys__8546 = this__8544.keys.slice();
    var new_strobj__8547 = cljs.core.obj_clone.call(null, this__8544.strobj, this__8544.keys);
    new_keys__8546.splice(cljs.core.scan_array.call(null, 1, k, new_keys__8546), 1);
    cljs.core.js_delete.call(null, new_strobj__8547, k);
    return new cljs.core.ObjMap(this__8544.meta, new_keys__8546, new_strobj__8547, this__8544.update_count + 1, null)
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
  var this__8552 = this;
  var h__2194__auto____8553 = this__8552.__hash;
  if(!(h__2194__auto____8553 == null)) {
    return h__2194__auto____8553
  }else {
    var h__2194__auto____8554 = cljs.core.hash_imap.call(null, coll);
    this__8552.__hash = h__2194__auto____8554;
    return h__2194__auto____8554
  }
};
cljs.core.HashMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__8555 = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(coll, k, null)
};
cljs.core.HashMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__8556 = this;
  var bucket__8557 = this__8556.hashobj[cljs.core.hash.call(null, k)];
  var i__8558 = cljs.core.truth_(bucket__8557) ? cljs.core.scan_array.call(null, 2, k, bucket__8557) : null;
  if(cljs.core.truth_(i__8558)) {
    return bucket__8557[i__8558 + 1]
  }else {
    return not_found
  }
};
cljs.core.HashMap.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__8559 = this;
  var h__8560 = cljs.core.hash.call(null, k);
  var bucket__8561 = this__8559.hashobj[h__8560];
  if(cljs.core.truth_(bucket__8561)) {
    var new_bucket__8562 = bucket__8561.slice();
    var new_hashobj__8563 = goog.object.clone(this__8559.hashobj);
    new_hashobj__8563[h__8560] = new_bucket__8562;
    var temp__3971__auto____8564 = cljs.core.scan_array.call(null, 2, k, new_bucket__8562);
    if(cljs.core.truth_(temp__3971__auto____8564)) {
      var i__8565 = temp__3971__auto____8564;
      new_bucket__8562[i__8565 + 1] = v;
      return new cljs.core.HashMap(this__8559.meta, this__8559.count, new_hashobj__8563, null)
    }else {
      new_bucket__8562.push(k, v);
      return new cljs.core.HashMap(this__8559.meta, this__8559.count + 1, new_hashobj__8563, null)
    }
  }else {
    var new_hashobj__8566 = goog.object.clone(this__8559.hashobj);
    new_hashobj__8566[h__8560] = [k, v];
    return new cljs.core.HashMap(this__8559.meta, this__8559.count + 1, new_hashobj__8566, null)
  }
};
cljs.core.HashMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = function(coll, k) {
  var this__8567 = this;
  var bucket__8568 = this__8567.hashobj[cljs.core.hash.call(null, k)];
  var i__8569 = cljs.core.truth_(bucket__8568) ? cljs.core.scan_array.call(null, 2, k, bucket__8568) : null;
  if(cljs.core.truth_(i__8569)) {
    return true
  }else {
    return false
  }
};
cljs.core.HashMap.prototype.call = function() {
  var G__8594 = null;
  var G__8594__2 = function(this_sym8570, k) {
    var this__8572 = this;
    var this_sym8570__8573 = this;
    var coll__8574 = this_sym8570__8573;
    return coll__8574.cljs$core$ILookup$_lookup$arity$2(coll__8574, k)
  };
  var G__8594__3 = function(this_sym8571, k, not_found) {
    var this__8572 = this;
    var this_sym8571__8575 = this;
    var coll__8576 = this_sym8571__8575;
    return coll__8576.cljs$core$ILookup$_lookup$arity$3(coll__8576, k, not_found)
  };
  G__8594 = function(this_sym8571, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__8594__2.call(this, this_sym8571, k);
      case 3:
        return G__8594__3.call(this, this_sym8571, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__8594
}();
cljs.core.HashMap.prototype.apply = function(this_sym8550, args8551) {
  var this__8577 = this;
  return this_sym8550.call.apply(this_sym8550, [this_sym8550].concat(args8551.slice()))
};
cljs.core.HashMap.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, entry) {
  var this__8578 = this;
  if(cljs.core.vector_QMARK_.call(null, entry)) {
    return coll.cljs$core$IAssociative$_assoc$arity$3(coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.HashMap.prototype.toString = function() {
  var this__8579 = this;
  var this__8580 = this;
  return cljs.core.pr_str.call(null, this__8580)
};
cljs.core.HashMap.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__8581 = this;
  if(this__8581.count > 0) {
    var hashes__8582 = cljs.core.js_keys.call(null, this__8581.hashobj).sort();
    return cljs.core.mapcat.call(null, function(p1__8549_SHARP_) {
      return cljs.core.map.call(null, cljs.core.vec, cljs.core.partition.call(null, 2, this__8581.hashobj[p1__8549_SHARP_]))
    }, hashes__8582)
  }else {
    return null
  }
};
cljs.core.HashMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__8583 = this;
  return this__8583.count
};
cljs.core.HashMap.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__8584 = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.HashMap.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__8585 = this;
  return new cljs.core.HashMap(meta, this__8585.count, this__8585.hashobj, this__8585.__hash)
};
cljs.core.HashMap.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__8586 = this;
  return this__8586.meta
};
cljs.core.HashMap.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__8587 = this;
  return cljs.core.with_meta.call(null, cljs.core.HashMap.EMPTY, this__8587.meta)
};
cljs.core.HashMap.prototype.cljs$core$IMap$_dissoc$arity$2 = function(coll, k) {
  var this__8588 = this;
  var h__8589 = cljs.core.hash.call(null, k);
  var bucket__8590 = this__8588.hashobj[h__8589];
  var i__8591 = cljs.core.truth_(bucket__8590) ? cljs.core.scan_array.call(null, 2, k, bucket__8590) : null;
  if(cljs.core.not.call(null, i__8591)) {
    return coll
  }else {
    var new_hashobj__8592 = goog.object.clone(this__8588.hashobj);
    if(3 > bucket__8590.length) {
      cljs.core.js_delete.call(null, new_hashobj__8592, h__8589)
    }else {
      var new_bucket__8593 = bucket__8590.slice();
      new_bucket__8593.splice(i__8591, 2);
      new_hashobj__8592[h__8589] = new_bucket__8593
    }
    return new cljs.core.HashMap(this__8588.meta, this__8588.count - 1, new_hashobj__8592, null)
  }
};
cljs.core.HashMap;
cljs.core.HashMap.EMPTY = new cljs.core.HashMap(null, 0, {}, 0);
cljs.core.HashMap.fromArrays = function(ks, vs) {
  var len__8595 = ks.length;
  var i__8596 = 0;
  var out__8597 = cljs.core.HashMap.EMPTY;
  while(true) {
    if(i__8596 < len__8595) {
      var G__8598 = i__8596 + 1;
      var G__8599 = cljs.core.assoc.call(null, out__8597, ks[i__8596], vs[i__8596]);
      i__8596 = G__8598;
      out__8597 = G__8599;
      continue
    }else {
      return out__8597
    }
    break
  }
};
cljs.core.array_map_index_of = function array_map_index_of(m, k) {
  var arr__8603 = m.arr;
  var len__8604 = arr__8603.length;
  var i__8605 = 0;
  while(true) {
    if(len__8604 <= i__8605) {
      return-1
    }else {
      if(cljs.core._EQ_.call(null, arr__8603[i__8605], k)) {
        return i__8605
      }else {
        if("\ufdd0'else") {
          var G__8606 = i__8605 + 2;
          i__8605 = G__8606;
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
  var this__8609 = this;
  return new cljs.core.TransientArrayMap({}, this__8609.arr.length, this__8609.arr.slice())
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__8610 = this;
  var h__2194__auto____8611 = this__8610.__hash;
  if(!(h__2194__auto____8611 == null)) {
    return h__2194__auto____8611
  }else {
    var h__2194__auto____8612 = cljs.core.hash_imap.call(null, coll);
    this__8610.__hash = h__2194__auto____8612;
    return h__2194__auto____8612
  }
};
cljs.core.PersistentArrayMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__8613 = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(coll, k, null)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__8614 = this;
  var idx__8615 = cljs.core.array_map_index_of.call(null, coll, k);
  if(idx__8615 === -1) {
    return not_found
  }else {
    return this__8614.arr[idx__8615 + 1]
  }
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__8616 = this;
  var idx__8617 = cljs.core.array_map_index_of.call(null, coll, k);
  if(idx__8617 === -1) {
    if(this__8616.cnt < cljs.core.PersistentArrayMap.HASHMAP_THRESHOLD) {
      return new cljs.core.PersistentArrayMap(this__8616.meta, this__8616.cnt + 1, function() {
        var G__8618__8619 = this__8616.arr.slice();
        G__8618__8619.push(k);
        G__8618__8619.push(v);
        return G__8618__8619
      }(), null)
    }else {
      return cljs.core.persistent_BANG_.call(null, cljs.core.assoc_BANG_.call(null, cljs.core.transient$.call(null, cljs.core.into.call(null, cljs.core.PersistentHashMap.EMPTY, coll)), k, v))
    }
  }else {
    if(v === this__8616.arr[idx__8617 + 1]) {
      return coll
    }else {
      if("\ufdd0'else") {
        return new cljs.core.PersistentArrayMap(this__8616.meta, this__8616.cnt, function() {
          var G__8620__8621 = this__8616.arr.slice();
          G__8620__8621[idx__8617 + 1] = v;
          return G__8620__8621
        }(), null)
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = function(coll, k) {
  var this__8622 = this;
  return!(cljs.core.array_map_index_of.call(null, coll, k) === -1)
};
cljs.core.PersistentArrayMap.prototype.call = function() {
  var G__8654 = null;
  var G__8654__2 = function(this_sym8623, k) {
    var this__8625 = this;
    var this_sym8623__8626 = this;
    var coll__8627 = this_sym8623__8626;
    return coll__8627.cljs$core$ILookup$_lookup$arity$2(coll__8627, k)
  };
  var G__8654__3 = function(this_sym8624, k, not_found) {
    var this__8625 = this;
    var this_sym8624__8628 = this;
    var coll__8629 = this_sym8624__8628;
    return coll__8629.cljs$core$ILookup$_lookup$arity$3(coll__8629, k, not_found)
  };
  G__8654 = function(this_sym8624, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__8654__2.call(this, this_sym8624, k);
      case 3:
        return G__8654__3.call(this, this_sym8624, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__8654
}();
cljs.core.PersistentArrayMap.prototype.apply = function(this_sym8607, args8608) {
  var this__8630 = this;
  return this_sym8607.call.apply(this_sym8607, [this_sym8607].concat(args8608.slice()))
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IKVReduce$_kv_reduce$arity$3 = function(coll, f, init) {
  var this__8631 = this;
  var len__8632 = this__8631.arr.length;
  var i__8633 = 0;
  var init__8634 = init;
  while(true) {
    if(i__8633 < len__8632) {
      var init__8635 = f.call(null, init__8634, this__8631.arr[i__8633], this__8631.arr[i__8633 + 1]);
      if(cljs.core.reduced_QMARK_.call(null, init__8635)) {
        return cljs.core.deref.call(null, init__8635)
      }else {
        var G__8655 = i__8633 + 2;
        var G__8656 = init__8635;
        i__8633 = G__8655;
        init__8634 = G__8656;
        continue
      }
    }else {
      return null
    }
    break
  }
};
cljs.core.PersistentArrayMap.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, entry) {
  var this__8636 = this;
  if(cljs.core.vector_QMARK_.call(null, entry)) {
    return coll.cljs$core$IAssociative$_assoc$arity$3(coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.PersistentArrayMap.prototype.toString = function() {
  var this__8637 = this;
  var this__8638 = this;
  return cljs.core.pr_str.call(null, this__8638)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__8639 = this;
  if(this__8639.cnt > 0) {
    var len__8640 = this__8639.arr.length;
    var array_map_seq__8641 = function array_map_seq(i) {
      return new cljs.core.LazySeq(null, false, function() {
        if(i < len__8640) {
          return cljs.core.cons.call(null, cljs.core.PersistentVector.fromArray([this__8639.arr[i], this__8639.arr[i + 1]], true), array_map_seq.call(null, i + 2))
        }else {
          return null
        }
      }, null)
    };
    return array_map_seq__8641.call(null, 0)
  }else {
    return null
  }
};
cljs.core.PersistentArrayMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__8642 = this;
  return this__8642.cnt
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__8643 = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__8644 = this;
  return new cljs.core.PersistentArrayMap(meta, this__8644.cnt, this__8644.arr, this__8644.__hash)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__8645 = this;
  return this__8645.meta
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__8646 = this;
  return cljs.core._with_meta.call(null, cljs.core.PersistentArrayMap.EMPTY, this__8646.meta)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IMap$_dissoc$arity$2 = function(coll, k) {
  var this__8647 = this;
  var idx__8648 = cljs.core.array_map_index_of.call(null, coll, k);
  if(idx__8648 >= 0) {
    var len__8649 = this__8647.arr.length;
    var new_len__8650 = len__8649 - 2;
    if(new_len__8650 === 0) {
      return coll.cljs$core$IEmptyableCollection$_empty$arity$1(coll)
    }else {
      var new_arr__8651 = cljs.core.make_array.call(null, new_len__8650);
      var s__8652 = 0;
      var d__8653 = 0;
      while(true) {
        if(s__8652 >= len__8649) {
          return new cljs.core.PersistentArrayMap(this__8647.meta, this__8647.cnt - 1, new_arr__8651, null)
        }else {
          if(cljs.core._EQ_.call(null, k, this__8647.arr[s__8652])) {
            var G__8657 = s__8652 + 2;
            var G__8658 = d__8653;
            s__8652 = G__8657;
            d__8653 = G__8658;
            continue
          }else {
            if("\ufdd0'else") {
              new_arr__8651[d__8653] = this__8647.arr[s__8652];
              new_arr__8651[d__8653 + 1] = this__8647.arr[s__8652 + 1];
              var G__8659 = s__8652 + 2;
              var G__8660 = d__8653 + 2;
              s__8652 = G__8659;
              d__8653 = G__8660;
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
  var len__8661 = cljs.core.count.call(null, ks);
  var i__8662 = 0;
  var out__8663 = cljs.core.transient$.call(null, cljs.core.PersistentArrayMap.EMPTY);
  while(true) {
    if(i__8662 < len__8661) {
      var G__8664 = i__8662 + 1;
      var G__8665 = cljs.core.assoc_BANG_.call(null, out__8663, ks[i__8662], vs[i__8662]);
      i__8662 = G__8664;
      out__8663 = G__8665;
      continue
    }else {
      return cljs.core.persistent_BANG_.call(null, out__8663)
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
  var this__8666 = this;
  if(cljs.core.truth_(this__8666.editable_QMARK_)) {
    var idx__8667 = cljs.core.array_map_index_of.call(null, tcoll, key);
    if(idx__8667 >= 0) {
      this__8666.arr[idx__8667] = this__8666.arr[this__8666.len - 2];
      this__8666.arr[idx__8667 + 1] = this__8666.arr[this__8666.len - 1];
      var G__8668__8669 = this__8666.arr;
      G__8668__8669.pop();
      G__8668__8669.pop();
      G__8668__8669;
      this__8666.len = this__8666.len - 2
    }else {
    }
    return tcoll
  }else {
    throw new Error("dissoc! after persistent!");
  }
};
cljs.core.TransientArrayMap.prototype.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3 = function(tcoll, key, val) {
  var this__8670 = this;
  if(cljs.core.truth_(this__8670.editable_QMARK_)) {
    var idx__8671 = cljs.core.array_map_index_of.call(null, tcoll, key);
    if(idx__8671 === -1) {
      if(this__8670.len + 2 <= 2 * cljs.core.PersistentArrayMap.HASHMAP_THRESHOLD) {
        this__8670.len = this__8670.len + 2;
        this__8670.arr.push(key);
        this__8670.arr.push(val);
        return tcoll
      }else {
        return cljs.core.assoc_BANG_.call(null, cljs.core.array__GT_transient_hash_map.call(null, this__8670.len, this__8670.arr), key, val)
      }
    }else {
      if(val === this__8670.arr[idx__8671 + 1]) {
        return tcoll
      }else {
        this__8670.arr[idx__8671 + 1] = val;
        return tcoll
      }
    }
  }else {
    throw new Error("assoc! after persistent!");
  }
};
cljs.core.TransientArrayMap.prototype.cljs$core$ITransientCollection$_conj_BANG_$arity$2 = function(tcoll, o) {
  var this__8672 = this;
  if(cljs.core.truth_(this__8672.editable_QMARK_)) {
    if(function() {
      var G__8673__8674 = o;
      if(G__8673__8674) {
        if(function() {
          var or__3824__auto____8675 = G__8673__8674.cljs$lang$protocol_mask$partition0$ & 2048;
          if(or__3824__auto____8675) {
            return or__3824__auto____8675
          }else {
            return G__8673__8674.cljs$core$IMapEntry$
          }
        }()) {
          return true
        }else {
          if(!G__8673__8674.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.IMapEntry, G__8673__8674)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.IMapEntry, G__8673__8674)
      }
    }()) {
      return tcoll.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3(tcoll, cljs.core.key.call(null, o), cljs.core.val.call(null, o))
    }else {
      var es__8676 = cljs.core.seq.call(null, o);
      var tcoll__8677 = tcoll;
      while(true) {
        var temp__3971__auto____8678 = cljs.core.first.call(null, es__8676);
        if(cljs.core.truth_(temp__3971__auto____8678)) {
          var e__8679 = temp__3971__auto____8678;
          var G__8685 = cljs.core.next.call(null, es__8676);
          var G__8686 = tcoll__8677.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3(tcoll__8677, cljs.core.key.call(null, e__8679), cljs.core.val.call(null, e__8679));
          es__8676 = G__8685;
          tcoll__8677 = G__8686;
          continue
        }else {
          return tcoll__8677
        }
        break
      }
    }
  }else {
    throw new Error("conj! after persistent!");
  }
};
cljs.core.TransientArrayMap.prototype.cljs$core$ITransientCollection$_persistent_BANG_$arity$1 = function(tcoll) {
  var this__8680 = this;
  if(cljs.core.truth_(this__8680.editable_QMARK_)) {
    this__8680.editable_QMARK_ = false;
    return new cljs.core.PersistentArrayMap(null, cljs.core.quot.call(null, this__8680.len, 2), this__8680.arr, null)
  }else {
    throw new Error("persistent! called twice");
  }
};
cljs.core.TransientArrayMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(tcoll, k) {
  var this__8681 = this;
  return tcoll.cljs$core$ILookup$_lookup$arity$3(tcoll, k, null)
};
cljs.core.TransientArrayMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(tcoll, k, not_found) {
  var this__8682 = this;
  if(cljs.core.truth_(this__8682.editable_QMARK_)) {
    var idx__8683 = cljs.core.array_map_index_of.call(null, tcoll, k);
    if(idx__8683 === -1) {
      return not_found
    }else {
      return this__8682.arr[idx__8683 + 1]
    }
  }else {
    throw new Error("lookup after persistent!");
  }
};
cljs.core.TransientArrayMap.prototype.cljs$core$ICounted$_count$arity$1 = function(tcoll) {
  var this__8684 = this;
  if(cljs.core.truth_(this__8684.editable_QMARK_)) {
    return cljs.core.quot.call(null, this__8684.len, 2)
  }else {
    throw new Error("count after persistent!");
  }
};
cljs.core.TransientArrayMap;
cljs.core.array__GT_transient_hash_map = function array__GT_transient_hash_map(len, arr) {
  var out__8689 = cljs.core.transient$.call(null, cljs.core.ObjMap.EMPTY);
  var i__8690 = 0;
  while(true) {
    if(i__8690 < len) {
      var G__8691 = cljs.core.assoc_BANG_.call(null, out__8689, arr[i__8690], arr[i__8690 + 1]);
      var G__8692 = i__8690 + 2;
      out__8689 = G__8691;
      i__8690 = G__8692;
      continue
    }else {
      return out__8689
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
    var G__8697__8698 = arr.slice();
    G__8697__8698[i] = a;
    return G__8697__8698
  };
  var clone_and_set__5 = function(arr, i, a, j, b) {
    var G__8699__8700 = arr.slice();
    G__8699__8700[i] = a;
    G__8699__8700[j] = b;
    return G__8699__8700
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
  var new_arr__8702 = cljs.core.make_array.call(null, arr.length - 2);
  cljs.core.array_copy.call(null, arr, 0, new_arr__8702, 0, 2 * i);
  cljs.core.array_copy.call(null, arr, 2 * (i + 1), new_arr__8702, 2 * i, new_arr__8702.length - 2 * i);
  return new_arr__8702
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
    var editable__8705 = inode.ensure_editable(edit);
    editable__8705.arr[i] = a;
    return editable__8705
  };
  var edit_and_set__6 = function(inode, edit, i, a, j, b) {
    var editable__8706 = inode.ensure_editable(edit);
    editable__8706.arr[i] = a;
    editable__8706.arr[j] = b;
    return editable__8706
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
  var len__8713 = arr.length;
  var i__8714 = 0;
  var init__8715 = init;
  while(true) {
    if(i__8714 < len__8713) {
      var init__8718 = function() {
        var k__8716 = arr[i__8714];
        if(!(k__8716 == null)) {
          return f.call(null, init__8715, k__8716, arr[i__8714 + 1])
        }else {
          var node__8717 = arr[i__8714 + 1];
          if(!(node__8717 == null)) {
            return node__8717.kv_reduce(f, init__8715)
          }else {
            return init__8715
          }
        }
      }();
      if(cljs.core.reduced_QMARK_.call(null, init__8718)) {
        return cljs.core.deref.call(null, init__8718)
      }else {
        var G__8719 = i__8714 + 2;
        var G__8720 = init__8718;
        i__8714 = G__8719;
        init__8715 = G__8720;
        continue
      }
    }else {
      return init__8715
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
  var this__8721 = this;
  var inode__8722 = this;
  if(this__8721.bitmap === bit) {
    return null
  }else {
    var editable__8723 = inode__8722.ensure_editable(e);
    var earr__8724 = editable__8723.arr;
    var len__8725 = earr__8724.length;
    editable__8723.bitmap = bit ^ editable__8723.bitmap;
    cljs.core.array_copy.call(null, earr__8724, 2 * (i + 1), earr__8724, 2 * i, len__8725 - 2 * (i + 1));
    earr__8724[len__8725 - 2] = null;
    earr__8724[len__8725 - 1] = null;
    return editable__8723
  }
};
cljs.core.BitmapIndexedNode.prototype.inode_assoc_BANG_ = function(edit, shift, hash, key, val, added_leaf_QMARK_) {
  var this__8726 = this;
  var inode__8727 = this;
  var bit__8728 = 1 << (hash >>> shift & 31);
  var idx__8729 = cljs.core.bitmap_indexed_node_index.call(null, this__8726.bitmap, bit__8728);
  if((this__8726.bitmap & bit__8728) === 0) {
    var n__8730 = cljs.core.bit_count.call(null, this__8726.bitmap);
    if(2 * n__8730 < this__8726.arr.length) {
      var editable__8731 = inode__8727.ensure_editable(edit);
      var earr__8732 = editable__8731.arr;
      added_leaf_QMARK_.val = true;
      cljs.core.array_copy_downward.call(null, earr__8732, 2 * idx__8729, earr__8732, 2 * (idx__8729 + 1), 2 * (n__8730 - idx__8729));
      earr__8732[2 * idx__8729] = key;
      earr__8732[2 * idx__8729 + 1] = val;
      editable__8731.bitmap = editable__8731.bitmap | bit__8728;
      return editable__8731
    }else {
      if(n__8730 >= 16) {
        var nodes__8733 = cljs.core.make_array.call(null, 32);
        var jdx__8734 = hash >>> shift & 31;
        nodes__8733[jdx__8734] = cljs.core.BitmapIndexedNode.EMPTY.inode_assoc_BANG_(edit, shift + 5, hash, key, val, added_leaf_QMARK_);
        var i__8735 = 0;
        var j__8736 = 0;
        while(true) {
          if(i__8735 < 32) {
            if((this__8726.bitmap >>> i__8735 & 1) === 0) {
              var G__8789 = i__8735 + 1;
              var G__8790 = j__8736;
              i__8735 = G__8789;
              j__8736 = G__8790;
              continue
            }else {
              nodes__8733[i__8735] = !(this__8726.arr[j__8736] == null) ? cljs.core.BitmapIndexedNode.EMPTY.inode_assoc_BANG_(edit, shift + 5, cljs.core.hash.call(null, this__8726.arr[j__8736]), this__8726.arr[j__8736], this__8726.arr[j__8736 + 1], added_leaf_QMARK_) : this__8726.arr[j__8736 + 1];
              var G__8791 = i__8735 + 1;
              var G__8792 = j__8736 + 2;
              i__8735 = G__8791;
              j__8736 = G__8792;
              continue
            }
          }else {
          }
          break
        }
        return new cljs.core.ArrayNode(edit, n__8730 + 1, nodes__8733)
      }else {
        if("\ufdd0'else") {
          var new_arr__8737 = cljs.core.make_array.call(null, 2 * (n__8730 + 4));
          cljs.core.array_copy.call(null, this__8726.arr, 0, new_arr__8737, 0, 2 * idx__8729);
          new_arr__8737[2 * idx__8729] = key;
          new_arr__8737[2 * idx__8729 + 1] = val;
          cljs.core.array_copy.call(null, this__8726.arr, 2 * idx__8729, new_arr__8737, 2 * (idx__8729 + 1), 2 * (n__8730 - idx__8729));
          added_leaf_QMARK_.val = true;
          var editable__8738 = inode__8727.ensure_editable(edit);
          editable__8738.arr = new_arr__8737;
          editable__8738.bitmap = editable__8738.bitmap | bit__8728;
          return editable__8738
        }else {
          return null
        }
      }
    }
  }else {
    var key_or_nil__8739 = this__8726.arr[2 * idx__8729];
    var val_or_node__8740 = this__8726.arr[2 * idx__8729 + 1];
    if(key_or_nil__8739 == null) {
      var n__8741 = val_or_node__8740.inode_assoc_BANG_(edit, shift + 5, hash, key, val, added_leaf_QMARK_);
      if(n__8741 === val_or_node__8740) {
        return inode__8727
      }else {
        return cljs.core.edit_and_set.call(null, inode__8727, edit, 2 * idx__8729 + 1, n__8741)
      }
    }else {
      if(cljs.core.key_test.call(null, key, key_or_nil__8739)) {
        if(val === val_or_node__8740) {
          return inode__8727
        }else {
          return cljs.core.edit_and_set.call(null, inode__8727, edit, 2 * idx__8729 + 1, val)
        }
      }else {
        if("\ufdd0'else") {
          added_leaf_QMARK_.val = true;
          return cljs.core.edit_and_set.call(null, inode__8727, edit, 2 * idx__8729, null, 2 * idx__8729 + 1, cljs.core.create_node.call(null, edit, shift + 5, key_or_nil__8739, val_or_node__8740, hash, key, val))
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.BitmapIndexedNode.prototype.inode_seq = function() {
  var this__8742 = this;
  var inode__8743 = this;
  return cljs.core.create_inode_seq.call(null, this__8742.arr)
};
cljs.core.BitmapIndexedNode.prototype.inode_without_BANG_ = function(edit, shift, hash, key, removed_leaf_QMARK_) {
  var this__8744 = this;
  var inode__8745 = this;
  var bit__8746 = 1 << (hash >>> shift & 31);
  if((this__8744.bitmap & bit__8746) === 0) {
    return inode__8745
  }else {
    var idx__8747 = cljs.core.bitmap_indexed_node_index.call(null, this__8744.bitmap, bit__8746);
    var key_or_nil__8748 = this__8744.arr[2 * idx__8747];
    var val_or_node__8749 = this__8744.arr[2 * idx__8747 + 1];
    if(key_or_nil__8748 == null) {
      var n__8750 = val_or_node__8749.inode_without_BANG_(edit, shift + 5, hash, key, removed_leaf_QMARK_);
      if(n__8750 === val_or_node__8749) {
        return inode__8745
      }else {
        if(!(n__8750 == null)) {
          return cljs.core.edit_and_set.call(null, inode__8745, edit, 2 * idx__8747 + 1, n__8750)
        }else {
          if(this__8744.bitmap === bit__8746) {
            return null
          }else {
            if("\ufdd0'else") {
              return inode__8745.edit_and_remove_pair(edit, bit__8746, idx__8747)
            }else {
              return null
            }
          }
        }
      }
    }else {
      if(cljs.core.key_test.call(null, key, key_or_nil__8748)) {
        removed_leaf_QMARK_[0] = true;
        return inode__8745.edit_and_remove_pair(edit, bit__8746, idx__8747)
      }else {
        if("\ufdd0'else") {
          return inode__8745
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.BitmapIndexedNode.prototype.ensure_editable = function(e) {
  var this__8751 = this;
  var inode__8752 = this;
  if(e === this__8751.edit) {
    return inode__8752
  }else {
    var n__8753 = cljs.core.bit_count.call(null, this__8751.bitmap);
    var new_arr__8754 = cljs.core.make_array.call(null, n__8753 < 0 ? 4 : 2 * (n__8753 + 1));
    cljs.core.array_copy.call(null, this__8751.arr, 0, new_arr__8754, 0, 2 * n__8753);
    return new cljs.core.BitmapIndexedNode(e, this__8751.bitmap, new_arr__8754)
  }
};
cljs.core.BitmapIndexedNode.prototype.kv_reduce = function(f, init) {
  var this__8755 = this;
  var inode__8756 = this;
  return cljs.core.inode_kv_reduce.call(null, this__8755.arr, f, init)
};
cljs.core.BitmapIndexedNode.prototype.inode_find = function(shift, hash, key, not_found) {
  var this__8757 = this;
  var inode__8758 = this;
  var bit__8759 = 1 << (hash >>> shift & 31);
  if((this__8757.bitmap & bit__8759) === 0) {
    return not_found
  }else {
    var idx__8760 = cljs.core.bitmap_indexed_node_index.call(null, this__8757.bitmap, bit__8759);
    var key_or_nil__8761 = this__8757.arr[2 * idx__8760];
    var val_or_node__8762 = this__8757.arr[2 * idx__8760 + 1];
    if(key_or_nil__8761 == null) {
      return val_or_node__8762.inode_find(shift + 5, hash, key, not_found)
    }else {
      if(cljs.core.key_test.call(null, key, key_or_nil__8761)) {
        return cljs.core.PersistentVector.fromArray([key_or_nil__8761, val_or_node__8762], true)
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
  var this__8763 = this;
  var inode__8764 = this;
  var bit__8765 = 1 << (hash >>> shift & 31);
  if((this__8763.bitmap & bit__8765) === 0) {
    return inode__8764
  }else {
    var idx__8766 = cljs.core.bitmap_indexed_node_index.call(null, this__8763.bitmap, bit__8765);
    var key_or_nil__8767 = this__8763.arr[2 * idx__8766];
    var val_or_node__8768 = this__8763.arr[2 * idx__8766 + 1];
    if(key_or_nil__8767 == null) {
      var n__8769 = val_or_node__8768.inode_without(shift + 5, hash, key);
      if(n__8769 === val_or_node__8768) {
        return inode__8764
      }else {
        if(!(n__8769 == null)) {
          return new cljs.core.BitmapIndexedNode(null, this__8763.bitmap, cljs.core.clone_and_set.call(null, this__8763.arr, 2 * idx__8766 + 1, n__8769))
        }else {
          if(this__8763.bitmap === bit__8765) {
            return null
          }else {
            if("\ufdd0'else") {
              return new cljs.core.BitmapIndexedNode(null, this__8763.bitmap ^ bit__8765, cljs.core.remove_pair.call(null, this__8763.arr, idx__8766))
            }else {
              return null
            }
          }
        }
      }
    }else {
      if(cljs.core.key_test.call(null, key, key_or_nil__8767)) {
        return new cljs.core.BitmapIndexedNode(null, this__8763.bitmap ^ bit__8765, cljs.core.remove_pair.call(null, this__8763.arr, idx__8766))
      }else {
        if("\ufdd0'else") {
          return inode__8764
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.BitmapIndexedNode.prototype.inode_assoc = function(shift, hash, key, val, added_leaf_QMARK_) {
  var this__8770 = this;
  var inode__8771 = this;
  var bit__8772 = 1 << (hash >>> shift & 31);
  var idx__8773 = cljs.core.bitmap_indexed_node_index.call(null, this__8770.bitmap, bit__8772);
  if((this__8770.bitmap & bit__8772) === 0) {
    var n__8774 = cljs.core.bit_count.call(null, this__8770.bitmap);
    if(n__8774 >= 16) {
      var nodes__8775 = cljs.core.make_array.call(null, 32);
      var jdx__8776 = hash >>> shift & 31;
      nodes__8775[jdx__8776] = cljs.core.BitmapIndexedNode.EMPTY.inode_assoc(shift + 5, hash, key, val, added_leaf_QMARK_);
      var i__8777 = 0;
      var j__8778 = 0;
      while(true) {
        if(i__8777 < 32) {
          if((this__8770.bitmap >>> i__8777 & 1) === 0) {
            var G__8793 = i__8777 + 1;
            var G__8794 = j__8778;
            i__8777 = G__8793;
            j__8778 = G__8794;
            continue
          }else {
            nodes__8775[i__8777] = !(this__8770.arr[j__8778] == null) ? cljs.core.BitmapIndexedNode.EMPTY.inode_assoc(shift + 5, cljs.core.hash.call(null, this__8770.arr[j__8778]), this__8770.arr[j__8778], this__8770.arr[j__8778 + 1], added_leaf_QMARK_) : this__8770.arr[j__8778 + 1];
            var G__8795 = i__8777 + 1;
            var G__8796 = j__8778 + 2;
            i__8777 = G__8795;
            j__8778 = G__8796;
            continue
          }
        }else {
        }
        break
      }
      return new cljs.core.ArrayNode(null, n__8774 + 1, nodes__8775)
    }else {
      var new_arr__8779 = cljs.core.make_array.call(null, 2 * (n__8774 + 1));
      cljs.core.array_copy.call(null, this__8770.arr, 0, new_arr__8779, 0, 2 * idx__8773);
      new_arr__8779[2 * idx__8773] = key;
      new_arr__8779[2 * idx__8773 + 1] = val;
      cljs.core.array_copy.call(null, this__8770.arr, 2 * idx__8773, new_arr__8779, 2 * (idx__8773 + 1), 2 * (n__8774 - idx__8773));
      added_leaf_QMARK_.val = true;
      return new cljs.core.BitmapIndexedNode(null, this__8770.bitmap | bit__8772, new_arr__8779)
    }
  }else {
    var key_or_nil__8780 = this__8770.arr[2 * idx__8773];
    var val_or_node__8781 = this__8770.arr[2 * idx__8773 + 1];
    if(key_or_nil__8780 == null) {
      var n__8782 = val_or_node__8781.inode_assoc(shift + 5, hash, key, val, added_leaf_QMARK_);
      if(n__8782 === val_or_node__8781) {
        return inode__8771
      }else {
        return new cljs.core.BitmapIndexedNode(null, this__8770.bitmap, cljs.core.clone_and_set.call(null, this__8770.arr, 2 * idx__8773 + 1, n__8782))
      }
    }else {
      if(cljs.core.key_test.call(null, key, key_or_nil__8780)) {
        if(val === val_or_node__8781) {
          return inode__8771
        }else {
          return new cljs.core.BitmapIndexedNode(null, this__8770.bitmap, cljs.core.clone_and_set.call(null, this__8770.arr, 2 * idx__8773 + 1, val))
        }
      }else {
        if("\ufdd0'else") {
          added_leaf_QMARK_.val = true;
          return new cljs.core.BitmapIndexedNode(null, this__8770.bitmap, cljs.core.clone_and_set.call(null, this__8770.arr, 2 * idx__8773, null, 2 * idx__8773 + 1, cljs.core.create_node.call(null, shift + 5, key_or_nil__8780, val_or_node__8781, hash, key, val)))
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.BitmapIndexedNode.prototype.inode_lookup = function(shift, hash, key, not_found) {
  var this__8783 = this;
  var inode__8784 = this;
  var bit__8785 = 1 << (hash >>> shift & 31);
  if((this__8783.bitmap & bit__8785) === 0) {
    return not_found
  }else {
    var idx__8786 = cljs.core.bitmap_indexed_node_index.call(null, this__8783.bitmap, bit__8785);
    var key_or_nil__8787 = this__8783.arr[2 * idx__8786];
    var val_or_node__8788 = this__8783.arr[2 * idx__8786 + 1];
    if(key_or_nil__8787 == null) {
      return val_or_node__8788.inode_lookup(shift + 5, hash, key, not_found)
    }else {
      if(cljs.core.key_test.call(null, key, key_or_nil__8787)) {
        return val_or_node__8788
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
  var arr__8804 = array_node.arr;
  var len__8805 = 2 * (array_node.cnt - 1);
  var new_arr__8806 = cljs.core.make_array.call(null, len__8805);
  var i__8807 = 0;
  var j__8808 = 1;
  var bitmap__8809 = 0;
  while(true) {
    if(i__8807 < len__8805) {
      if(function() {
        var and__3822__auto____8810 = !(i__8807 === idx);
        if(and__3822__auto____8810) {
          return!(arr__8804[i__8807] == null)
        }else {
          return and__3822__auto____8810
        }
      }()) {
        new_arr__8806[j__8808] = arr__8804[i__8807];
        var G__8811 = i__8807 + 1;
        var G__8812 = j__8808 + 2;
        var G__8813 = bitmap__8809 | 1 << i__8807;
        i__8807 = G__8811;
        j__8808 = G__8812;
        bitmap__8809 = G__8813;
        continue
      }else {
        var G__8814 = i__8807 + 1;
        var G__8815 = j__8808;
        var G__8816 = bitmap__8809;
        i__8807 = G__8814;
        j__8808 = G__8815;
        bitmap__8809 = G__8816;
        continue
      }
    }else {
      return new cljs.core.BitmapIndexedNode(edit, bitmap__8809, new_arr__8806)
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
  var this__8817 = this;
  var inode__8818 = this;
  var idx__8819 = hash >>> shift & 31;
  var node__8820 = this__8817.arr[idx__8819];
  if(node__8820 == null) {
    var editable__8821 = cljs.core.edit_and_set.call(null, inode__8818, edit, idx__8819, cljs.core.BitmapIndexedNode.EMPTY.inode_assoc_BANG_(edit, shift + 5, hash, key, val, added_leaf_QMARK_));
    editable__8821.cnt = editable__8821.cnt + 1;
    return editable__8821
  }else {
    var n__8822 = node__8820.inode_assoc_BANG_(edit, shift + 5, hash, key, val, added_leaf_QMARK_);
    if(n__8822 === node__8820) {
      return inode__8818
    }else {
      return cljs.core.edit_and_set.call(null, inode__8818, edit, idx__8819, n__8822)
    }
  }
};
cljs.core.ArrayNode.prototype.inode_seq = function() {
  var this__8823 = this;
  var inode__8824 = this;
  return cljs.core.create_array_node_seq.call(null, this__8823.arr)
};
cljs.core.ArrayNode.prototype.inode_without_BANG_ = function(edit, shift, hash, key, removed_leaf_QMARK_) {
  var this__8825 = this;
  var inode__8826 = this;
  var idx__8827 = hash >>> shift & 31;
  var node__8828 = this__8825.arr[idx__8827];
  if(node__8828 == null) {
    return inode__8826
  }else {
    var n__8829 = node__8828.inode_without_BANG_(edit, shift + 5, hash, key, removed_leaf_QMARK_);
    if(n__8829 === node__8828) {
      return inode__8826
    }else {
      if(n__8829 == null) {
        if(this__8825.cnt <= 8) {
          return cljs.core.pack_array_node.call(null, inode__8826, edit, idx__8827)
        }else {
          var editable__8830 = cljs.core.edit_and_set.call(null, inode__8826, edit, idx__8827, n__8829);
          editable__8830.cnt = editable__8830.cnt - 1;
          return editable__8830
        }
      }else {
        if("\ufdd0'else") {
          return cljs.core.edit_and_set.call(null, inode__8826, edit, idx__8827, n__8829)
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.ArrayNode.prototype.ensure_editable = function(e) {
  var this__8831 = this;
  var inode__8832 = this;
  if(e === this__8831.edit) {
    return inode__8832
  }else {
    return new cljs.core.ArrayNode(e, this__8831.cnt, this__8831.arr.slice())
  }
};
cljs.core.ArrayNode.prototype.kv_reduce = function(f, init) {
  var this__8833 = this;
  var inode__8834 = this;
  var len__8835 = this__8833.arr.length;
  var i__8836 = 0;
  var init__8837 = init;
  while(true) {
    if(i__8836 < len__8835) {
      var node__8838 = this__8833.arr[i__8836];
      if(!(node__8838 == null)) {
        var init__8839 = node__8838.kv_reduce(f, init__8837);
        if(cljs.core.reduced_QMARK_.call(null, init__8839)) {
          return cljs.core.deref.call(null, init__8839)
        }else {
          var G__8858 = i__8836 + 1;
          var G__8859 = init__8839;
          i__8836 = G__8858;
          init__8837 = G__8859;
          continue
        }
      }else {
        return null
      }
    }else {
      return init__8837
    }
    break
  }
};
cljs.core.ArrayNode.prototype.inode_find = function(shift, hash, key, not_found) {
  var this__8840 = this;
  var inode__8841 = this;
  var idx__8842 = hash >>> shift & 31;
  var node__8843 = this__8840.arr[idx__8842];
  if(!(node__8843 == null)) {
    return node__8843.inode_find(shift + 5, hash, key, not_found)
  }else {
    return not_found
  }
};
cljs.core.ArrayNode.prototype.inode_without = function(shift, hash, key) {
  var this__8844 = this;
  var inode__8845 = this;
  var idx__8846 = hash >>> shift & 31;
  var node__8847 = this__8844.arr[idx__8846];
  if(!(node__8847 == null)) {
    var n__8848 = node__8847.inode_without(shift + 5, hash, key);
    if(n__8848 === node__8847) {
      return inode__8845
    }else {
      if(n__8848 == null) {
        if(this__8844.cnt <= 8) {
          return cljs.core.pack_array_node.call(null, inode__8845, null, idx__8846)
        }else {
          return new cljs.core.ArrayNode(null, this__8844.cnt - 1, cljs.core.clone_and_set.call(null, this__8844.arr, idx__8846, n__8848))
        }
      }else {
        if("\ufdd0'else") {
          return new cljs.core.ArrayNode(null, this__8844.cnt, cljs.core.clone_and_set.call(null, this__8844.arr, idx__8846, n__8848))
        }else {
          return null
        }
      }
    }
  }else {
    return inode__8845
  }
};
cljs.core.ArrayNode.prototype.inode_assoc = function(shift, hash, key, val, added_leaf_QMARK_) {
  var this__8849 = this;
  var inode__8850 = this;
  var idx__8851 = hash >>> shift & 31;
  var node__8852 = this__8849.arr[idx__8851];
  if(node__8852 == null) {
    return new cljs.core.ArrayNode(null, this__8849.cnt + 1, cljs.core.clone_and_set.call(null, this__8849.arr, idx__8851, cljs.core.BitmapIndexedNode.EMPTY.inode_assoc(shift + 5, hash, key, val, added_leaf_QMARK_)))
  }else {
    var n__8853 = node__8852.inode_assoc(shift + 5, hash, key, val, added_leaf_QMARK_);
    if(n__8853 === node__8852) {
      return inode__8850
    }else {
      return new cljs.core.ArrayNode(null, this__8849.cnt, cljs.core.clone_and_set.call(null, this__8849.arr, idx__8851, n__8853))
    }
  }
};
cljs.core.ArrayNode.prototype.inode_lookup = function(shift, hash, key, not_found) {
  var this__8854 = this;
  var inode__8855 = this;
  var idx__8856 = hash >>> shift & 31;
  var node__8857 = this__8854.arr[idx__8856];
  if(!(node__8857 == null)) {
    return node__8857.inode_lookup(shift + 5, hash, key, not_found)
  }else {
    return not_found
  }
};
cljs.core.ArrayNode;
cljs.core.hash_collision_node_find_index = function hash_collision_node_find_index(arr, cnt, key) {
  var lim__8862 = 2 * cnt;
  var i__8863 = 0;
  while(true) {
    if(i__8863 < lim__8862) {
      if(cljs.core.key_test.call(null, key, arr[i__8863])) {
        return i__8863
      }else {
        var G__8864 = i__8863 + 2;
        i__8863 = G__8864;
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
  var this__8865 = this;
  var inode__8866 = this;
  if(hash === this__8865.collision_hash) {
    var idx__8867 = cljs.core.hash_collision_node_find_index.call(null, this__8865.arr, this__8865.cnt, key);
    if(idx__8867 === -1) {
      if(this__8865.arr.length > 2 * this__8865.cnt) {
        var editable__8868 = cljs.core.edit_and_set.call(null, inode__8866, edit, 2 * this__8865.cnt, key, 2 * this__8865.cnt + 1, val);
        added_leaf_QMARK_.val = true;
        editable__8868.cnt = editable__8868.cnt + 1;
        return editable__8868
      }else {
        var len__8869 = this__8865.arr.length;
        var new_arr__8870 = cljs.core.make_array.call(null, len__8869 + 2);
        cljs.core.array_copy.call(null, this__8865.arr, 0, new_arr__8870, 0, len__8869);
        new_arr__8870[len__8869] = key;
        new_arr__8870[len__8869 + 1] = val;
        added_leaf_QMARK_.val = true;
        return inode__8866.ensure_editable_array(edit, this__8865.cnt + 1, new_arr__8870)
      }
    }else {
      if(this__8865.arr[idx__8867 + 1] === val) {
        return inode__8866
      }else {
        return cljs.core.edit_and_set.call(null, inode__8866, edit, idx__8867 + 1, val)
      }
    }
  }else {
    return(new cljs.core.BitmapIndexedNode(edit, 1 << (this__8865.collision_hash >>> shift & 31), [null, inode__8866, null, null])).inode_assoc_BANG_(edit, shift, hash, key, val, added_leaf_QMARK_)
  }
};
cljs.core.HashCollisionNode.prototype.inode_seq = function() {
  var this__8871 = this;
  var inode__8872 = this;
  return cljs.core.create_inode_seq.call(null, this__8871.arr)
};
cljs.core.HashCollisionNode.prototype.inode_without_BANG_ = function(edit, shift, hash, key, removed_leaf_QMARK_) {
  var this__8873 = this;
  var inode__8874 = this;
  var idx__8875 = cljs.core.hash_collision_node_find_index.call(null, this__8873.arr, this__8873.cnt, key);
  if(idx__8875 === -1) {
    return inode__8874
  }else {
    removed_leaf_QMARK_[0] = true;
    if(this__8873.cnt === 1) {
      return null
    }else {
      var editable__8876 = inode__8874.ensure_editable(edit);
      var earr__8877 = editable__8876.arr;
      earr__8877[idx__8875] = earr__8877[2 * this__8873.cnt - 2];
      earr__8877[idx__8875 + 1] = earr__8877[2 * this__8873.cnt - 1];
      earr__8877[2 * this__8873.cnt - 1] = null;
      earr__8877[2 * this__8873.cnt - 2] = null;
      editable__8876.cnt = editable__8876.cnt - 1;
      return editable__8876
    }
  }
};
cljs.core.HashCollisionNode.prototype.ensure_editable = function(e) {
  var this__8878 = this;
  var inode__8879 = this;
  if(e === this__8878.edit) {
    return inode__8879
  }else {
    var new_arr__8880 = cljs.core.make_array.call(null, 2 * (this__8878.cnt + 1));
    cljs.core.array_copy.call(null, this__8878.arr, 0, new_arr__8880, 0, 2 * this__8878.cnt);
    return new cljs.core.HashCollisionNode(e, this__8878.collision_hash, this__8878.cnt, new_arr__8880)
  }
};
cljs.core.HashCollisionNode.prototype.kv_reduce = function(f, init) {
  var this__8881 = this;
  var inode__8882 = this;
  return cljs.core.inode_kv_reduce.call(null, this__8881.arr, f, init)
};
cljs.core.HashCollisionNode.prototype.inode_find = function(shift, hash, key, not_found) {
  var this__8883 = this;
  var inode__8884 = this;
  var idx__8885 = cljs.core.hash_collision_node_find_index.call(null, this__8883.arr, this__8883.cnt, key);
  if(idx__8885 < 0) {
    return not_found
  }else {
    if(cljs.core.key_test.call(null, key, this__8883.arr[idx__8885])) {
      return cljs.core.PersistentVector.fromArray([this__8883.arr[idx__8885], this__8883.arr[idx__8885 + 1]], true)
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
  var this__8886 = this;
  var inode__8887 = this;
  var idx__8888 = cljs.core.hash_collision_node_find_index.call(null, this__8886.arr, this__8886.cnt, key);
  if(idx__8888 === -1) {
    return inode__8887
  }else {
    if(this__8886.cnt === 1) {
      return null
    }else {
      if("\ufdd0'else") {
        return new cljs.core.HashCollisionNode(null, this__8886.collision_hash, this__8886.cnt - 1, cljs.core.remove_pair.call(null, this__8886.arr, cljs.core.quot.call(null, idx__8888, 2)))
      }else {
        return null
      }
    }
  }
};
cljs.core.HashCollisionNode.prototype.inode_assoc = function(shift, hash, key, val, added_leaf_QMARK_) {
  var this__8889 = this;
  var inode__8890 = this;
  if(hash === this__8889.collision_hash) {
    var idx__8891 = cljs.core.hash_collision_node_find_index.call(null, this__8889.arr, this__8889.cnt, key);
    if(idx__8891 === -1) {
      var len__8892 = this__8889.arr.length;
      var new_arr__8893 = cljs.core.make_array.call(null, len__8892 + 2);
      cljs.core.array_copy.call(null, this__8889.arr, 0, new_arr__8893, 0, len__8892);
      new_arr__8893[len__8892] = key;
      new_arr__8893[len__8892 + 1] = val;
      added_leaf_QMARK_.val = true;
      return new cljs.core.HashCollisionNode(null, this__8889.collision_hash, this__8889.cnt + 1, new_arr__8893)
    }else {
      if(cljs.core._EQ_.call(null, this__8889.arr[idx__8891], val)) {
        return inode__8890
      }else {
        return new cljs.core.HashCollisionNode(null, this__8889.collision_hash, this__8889.cnt, cljs.core.clone_and_set.call(null, this__8889.arr, idx__8891 + 1, val))
      }
    }
  }else {
    return(new cljs.core.BitmapIndexedNode(null, 1 << (this__8889.collision_hash >>> shift & 31), [null, inode__8890])).inode_assoc(shift, hash, key, val, added_leaf_QMARK_)
  }
};
cljs.core.HashCollisionNode.prototype.inode_lookup = function(shift, hash, key, not_found) {
  var this__8894 = this;
  var inode__8895 = this;
  var idx__8896 = cljs.core.hash_collision_node_find_index.call(null, this__8894.arr, this__8894.cnt, key);
  if(idx__8896 < 0) {
    return not_found
  }else {
    if(cljs.core.key_test.call(null, key, this__8894.arr[idx__8896])) {
      return this__8894.arr[idx__8896 + 1]
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
  var this__8897 = this;
  var inode__8898 = this;
  if(e === this__8897.edit) {
    this__8897.arr = array;
    this__8897.cnt = count;
    return inode__8898
  }else {
    return new cljs.core.HashCollisionNode(this__8897.edit, this__8897.collision_hash, count, array)
  }
};
cljs.core.HashCollisionNode;
cljs.core.create_node = function() {
  var create_node = null;
  var create_node__6 = function(shift, key1, val1, key2hash, key2, val2) {
    var key1hash__8903 = cljs.core.hash.call(null, key1);
    if(key1hash__8903 === key2hash) {
      return new cljs.core.HashCollisionNode(null, key1hash__8903, 2, [key1, val1, key2, val2])
    }else {
      var added_leaf_QMARK___8904 = new cljs.core.Box(false);
      return cljs.core.BitmapIndexedNode.EMPTY.inode_assoc(shift, key1hash__8903, key1, val1, added_leaf_QMARK___8904).inode_assoc(shift, key2hash, key2, val2, added_leaf_QMARK___8904)
    }
  };
  var create_node__7 = function(edit, shift, key1, val1, key2hash, key2, val2) {
    var key1hash__8905 = cljs.core.hash.call(null, key1);
    if(key1hash__8905 === key2hash) {
      return new cljs.core.HashCollisionNode(null, key1hash__8905, 2, [key1, val1, key2, val2])
    }else {
      var added_leaf_QMARK___8906 = new cljs.core.Box(false);
      return cljs.core.BitmapIndexedNode.EMPTY.inode_assoc_BANG_(edit, shift, key1hash__8905, key1, val1, added_leaf_QMARK___8906).inode_assoc_BANG_(edit, shift, key2hash, key2, val2, added_leaf_QMARK___8906)
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
  var this__8907 = this;
  var h__2194__auto____8908 = this__8907.__hash;
  if(!(h__2194__auto____8908 == null)) {
    return h__2194__auto____8908
  }else {
    var h__2194__auto____8909 = cljs.core.hash_coll.call(null, coll);
    this__8907.__hash = h__2194__auto____8909;
    return h__2194__auto____8909
  }
};
cljs.core.NodeSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__8910 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.NodeSeq.prototype.toString = function() {
  var this__8911 = this;
  var this__8912 = this;
  return cljs.core.pr_str.call(null, this__8912)
};
cljs.core.NodeSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(this$) {
  var this__8913 = this;
  return this$
};
cljs.core.NodeSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__8914 = this;
  if(this__8914.s == null) {
    return cljs.core.PersistentVector.fromArray([this__8914.nodes[this__8914.i], this__8914.nodes[this__8914.i + 1]], true)
  }else {
    return cljs.core.first.call(null, this__8914.s)
  }
};
cljs.core.NodeSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__8915 = this;
  if(this__8915.s == null) {
    return cljs.core.create_inode_seq.call(null, this__8915.nodes, this__8915.i + 2, null)
  }else {
    return cljs.core.create_inode_seq.call(null, this__8915.nodes, this__8915.i, cljs.core.next.call(null, this__8915.s))
  }
};
cljs.core.NodeSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__8916 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.NodeSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__8917 = this;
  return new cljs.core.NodeSeq(meta, this__8917.nodes, this__8917.i, this__8917.s, this__8917.__hash)
};
cljs.core.NodeSeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__8918 = this;
  return this__8918.meta
};
cljs.core.NodeSeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__8919 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__8919.meta)
};
cljs.core.NodeSeq;
cljs.core.create_inode_seq = function() {
  var create_inode_seq = null;
  var create_inode_seq__1 = function(nodes) {
    return create_inode_seq.call(null, nodes, 0, null)
  };
  var create_inode_seq__3 = function(nodes, i, s) {
    if(s == null) {
      var len__8926 = nodes.length;
      var j__8927 = i;
      while(true) {
        if(j__8927 < len__8926) {
          if(!(nodes[j__8927] == null)) {
            return new cljs.core.NodeSeq(null, nodes, j__8927, null, null)
          }else {
            var temp__3971__auto____8928 = nodes[j__8927 + 1];
            if(cljs.core.truth_(temp__3971__auto____8928)) {
              var node__8929 = temp__3971__auto____8928;
              var temp__3971__auto____8930 = node__8929.inode_seq();
              if(cljs.core.truth_(temp__3971__auto____8930)) {
                var node_seq__8931 = temp__3971__auto____8930;
                return new cljs.core.NodeSeq(null, nodes, j__8927 + 2, node_seq__8931, null)
              }else {
                var G__8932 = j__8927 + 2;
                j__8927 = G__8932;
                continue
              }
            }else {
              var G__8933 = j__8927 + 2;
              j__8927 = G__8933;
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
  var this__8934 = this;
  var h__2194__auto____8935 = this__8934.__hash;
  if(!(h__2194__auto____8935 == null)) {
    return h__2194__auto____8935
  }else {
    var h__2194__auto____8936 = cljs.core.hash_coll.call(null, coll);
    this__8934.__hash = h__2194__auto____8936;
    return h__2194__auto____8936
  }
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__8937 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.ArrayNodeSeq.prototype.toString = function() {
  var this__8938 = this;
  var this__8939 = this;
  return cljs.core.pr_str.call(null, this__8939)
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(this$) {
  var this__8940 = this;
  return this$
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__8941 = this;
  return cljs.core.first.call(null, this__8941.s)
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__8942 = this;
  return cljs.core.create_array_node_seq.call(null, null, this__8942.nodes, this__8942.i, cljs.core.next.call(null, this__8942.s))
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__8943 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__8944 = this;
  return new cljs.core.ArrayNodeSeq(meta, this__8944.nodes, this__8944.i, this__8944.s, this__8944.__hash)
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__8945 = this;
  return this__8945.meta
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__8946 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__8946.meta)
};
cljs.core.ArrayNodeSeq;
cljs.core.create_array_node_seq = function() {
  var create_array_node_seq = null;
  var create_array_node_seq__1 = function(nodes) {
    return create_array_node_seq.call(null, null, nodes, 0, null)
  };
  var create_array_node_seq__4 = function(meta, nodes, i, s) {
    if(s == null) {
      var len__8953 = nodes.length;
      var j__8954 = i;
      while(true) {
        if(j__8954 < len__8953) {
          var temp__3971__auto____8955 = nodes[j__8954];
          if(cljs.core.truth_(temp__3971__auto____8955)) {
            var nj__8956 = temp__3971__auto____8955;
            var temp__3971__auto____8957 = nj__8956.inode_seq();
            if(cljs.core.truth_(temp__3971__auto____8957)) {
              var ns__8958 = temp__3971__auto____8957;
              return new cljs.core.ArrayNodeSeq(meta, nodes, j__8954 + 1, ns__8958, null)
            }else {
              var G__8959 = j__8954 + 1;
              j__8954 = G__8959;
              continue
            }
          }else {
            var G__8960 = j__8954 + 1;
            j__8954 = G__8960;
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
  var this__8963 = this;
  return new cljs.core.TransientHashMap({}, this__8963.root, this__8963.cnt, this__8963.has_nil_QMARK_, this__8963.nil_val)
};
cljs.core.PersistentHashMap.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__8964 = this;
  var h__2194__auto____8965 = this__8964.__hash;
  if(!(h__2194__auto____8965 == null)) {
    return h__2194__auto____8965
  }else {
    var h__2194__auto____8966 = cljs.core.hash_imap.call(null, coll);
    this__8964.__hash = h__2194__auto____8966;
    return h__2194__auto____8966
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__8967 = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(coll, k, null)
};
cljs.core.PersistentHashMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__8968 = this;
  if(k == null) {
    if(this__8968.has_nil_QMARK_) {
      return this__8968.nil_val
    }else {
      return not_found
    }
  }else {
    if(this__8968.root == null) {
      return not_found
    }else {
      if("\ufdd0'else") {
        return this__8968.root.inode_lookup(0, cljs.core.hash.call(null, k), k, not_found)
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__8969 = this;
  if(k == null) {
    if(function() {
      var and__3822__auto____8970 = this__8969.has_nil_QMARK_;
      if(and__3822__auto____8970) {
        return v === this__8969.nil_val
      }else {
        return and__3822__auto____8970
      }
    }()) {
      return coll
    }else {
      return new cljs.core.PersistentHashMap(this__8969.meta, this__8969.has_nil_QMARK_ ? this__8969.cnt : this__8969.cnt + 1, this__8969.root, true, v, null)
    }
  }else {
    var added_leaf_QMARK___8971 = new cljs.core.Box(false);
    var new_root__8972 = (this__8969.root == null ? cljs.core.BitmapIndexedNode.EMPTY : this__8969.root).inode_assoc(0, cljs.core.hash.call(null, k), k, v, added_leaf_QMARK___8971);
    if(new_root__8972 === this__8969.root) {
      return coll
    }else {
      return new cljs.core.PersistentHashMap(this__8969.meta, added_leaf_QMARK___8971.val ? this__8969.cnt + 1 : this__8969.cnt, new_root__8972, this__8969.has_nil_QMARK_, this__8969.nil_val, null)
    }
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = function(coll, k) {
  var this__8973 = this;
  if(k == null) {
    return this__8973.has_nil_QMARK_
  }else {
    if(this__8973.root == null) {
      return false
    }else {
      if("\ufdd0'else") {
        return!(this__8973.root.inode_lookup(0, cljs.core.hash.call(null, k), k, cljs.core.lookup_sentinel) === cljs.core.lookup_sentinel)
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentHashMap.prototype.call = function() {
  var G__8996 = null;
  var G__8996__2 = function(this_sym8974, k) {
    var this__8976 = this;
    var this_sym8974__8977 = this;
    var coll__8978 = this_sym8974__8977;
    return coll__8978.cljs$core$ILookup$_lookup$arity$2(coll__8978, k)
  };
  var G__8996__3 = function(this_sym8975, k, not_found) {
    var this__8976 = this;
    var this_sym8975__8979 = this;
    var coll__8980 = this_sym8975__8979;
    return coll__8980.cljs$core$ILookup$_lookup$arity$3(coll__8980, k, not_found)
  };
  G__8996 = function(this_sym8975, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__8996__2.call(this, this_sym8975, k);
      case 3:
        return G__8996__3.call(this, this_sym8975, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__8996
}();
cljs.core.PersistentHashMap.prototype.apply = function(this_sym8961, args8962) {
  var this__8981 = this;
  return this_sym8961.call.apply(this_sym8961, [this_sym8961].concat(args8962.slice()))
};
cljs.core.PersistentHashMap.prototype.cljs$core$IKVReduce$_kv_reduce$arity$3 = function(coll, f, init) {
  var this__8982 = this;
  var init__8983 = this__8982.has_nil_QMARK_ ? f.call(null, init, null, this__8982.nil_val) : init;
  if(cljs.core.reduced_QMARK_.call(null, init__8983)) {
    return cljs.core.deref.call(null, init__8983)
  }else {
    if(!(this__8982.root == null)) {
      return this__8982.root.kv_reduce(f, init__8983)
    }else {
      if("\ufdd0'else") {
        return init__8983
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, entry) {
  var this__8984 = this;
  if(cljs.core.vector_QMARK_.call(null, entry)) {
    return coll.cljs$core$IAssociative$_assoc$arity$3(coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.PersistentHashMap.prototype.toString = function() {
  var this__8985 = this;
  var this__8986 = this;
  return cljs.core.pr_str.call(null, this__8986)
};
cljs.core.PersistentHashMap.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__8987 = this;
  if(this__8987.cnt > 0) {
    var s__8988 = !(this__8987.root == null) ? this__8987.root.inode_seq() : null;
    if(this__8987.has_nil_QMARK_) {
      return cljs.core.cons.call(null, cljs.core.PersistentVector.fromArray([null, this__8987.nil_val], true), s__8988)
    }else {
      return s__8988
    }
  }else {
    return null
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__8989 = this;
  return this__8989.cnt
};
cljs.core.PersistentHashMap.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__8990 = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.PersistentHashMap.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__8991 = this;
  return new cljs.core.PersistentHashMap(meta, this__8991.cnt, this__8991.root, this__8991.has_nil_QMARK_, this__8991.nil_val, this__8991.__hash)
};
cljs.core.PersistentHashMap.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__8992 = this;
  return this__8992.meta
};
cljs.core.PersistentHashMap.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__8993 = this;
  return cljs.core._with_meta.call(null, cljs.core.PersistentHashMap.EMPTY, this__8993.meta)
};
cljs.core.PersistentHashMap.prototype.cljs$core$IMap$_dissoc$arity$2 = function(coll, k) {
  var this__8994 = this;
  if(k == null) {
    if(this__8994.has_nil_QMARK_) {
      return new cljs.core.PersistentHashMap(this__8994.meta, this__8994.cnt - 1, this__8994.root, false, null, null)
    }else {
      return coll
    }
  }else {
    if(this__8994.root == null) {
      return coll
    }else {
      if("\ufdd0'else") {
        var new_root__8995 = this__8994.root.inode_without(0, cljs.core.hash.call(null, k), k);
        if(new_root__8995 === this__8994.root) {
          return coll
        }else {
          return new cljs.core.PersistentHashMap(this__8994.meta, this__8994.cnt - 1, new_root__8995, this__8994.has_nil_QMARK_, this__8994.nil_val, null)
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
  var len__8997 = ks.length;
  var i__8998 = 0;
  var out__8999 = cljs.core.transient$.call(null, cljs.core.PersistentHashMap.EMPTY);
  while(true) {
    if(i__8998 < len__8997) {
      var G__9000 = i__8998 + 1;
      var G__9001 = cljs.core.assoc_BANG_.call(null, out__8999, ks[i__8998], vs[i__8998]);
      i__8998 = G__9000;
      out__8999 = G__9001;
      continue
    }else {
      return cljs.core.persistent_BANG_.call(null, out__8999)
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
  var this__9002 = this;
  return tcoll.without_BANG_(key)
};
cljs.core.TransientHashMap.prototype.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3 = function(tcoll, key, val) {
  var this__9003 = this;
  return tcoll.assoc_BANG_(key, val)
};
cljs.core.TransientHashMap.prototype.cljs$core$ITransientCollection$_conj_BANG_$arity$2 = function(tcoll, val) {
  var this__9004 = this;
  return tcoll.conj_BANG_(val)
};
cljs.core.TransientHashMap.prototype.cljs$core$ITransientCollection$_persistent_BANG_$arity$1 = function(tcoll) {
  var this__9005 = this;
  return tcoll.persistent_BANG_()
};
cljs.core.TransientHashMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(tcoll, k) {
  var this__9006 = this;
  if(k == null) {
    if(this__9006.has_nil_QMARK_) {
      return this__9006.nil_val
    }else {
      return null
    }
  }else {
    if(this__9006.root == null) {
      return null
    }else {
      return this__9006.root.inode_lookup(0, cljs.core.hash.call(null, k), k)
    }
  }
};
cljs.core.TransientHashMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(tcoll, k, not_found) {
  var this__9007 = this;
  if(k == null) {
    if(this__9007.has_nil_QMARK_) {
      return this__9007.nil_val
    }else {
      return not_found
    }
  }else {
    if(this__9007.root == null) {
      return not_found
    }else {
      return this__9007.root.inode_lookup(0, cljs.core.hash.call(null, k), k, not_found)
    }
  }
};
cljs.core.TransientHashMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__9008 = this;
  if(this__9008.edit) {
    return this__9008.count
  }else {
    throw new Error("count after persistent!");
  }
};
cljs.core.TransientHashMap.prototype.conj_BANG_ = function(o) {
  var this__9009 = this;
  var tcoll__9010 = this;
  if(this__9009.edit) {
    if(function() {
      var G__9011__9012 = o;
      if(G__9011__9012) {
        if(function() {
          var or__3824__auto____9013 = G__9011__9012.cljs$lang$protocol_mask$partition0$ & 2048;
          if(or__3824__auto____9013) {
            return or__3824__auto____9013
          }else {
            return G__9011__9012.cljs$core$IMapEntry$
          }
        }()) {
          return true
        }else {
          if(!G__9011__9012.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.IMapEntry, G__9011__9012)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.IMapEntry, G__9011__9012)
      }
    }()) {
      return tcoll__9010.assoc_BANG_(cljs.core.key.call(null, o), cljs.core.val.call(null, o))
    }else {
      var es__9014 = cljs.core.seq.call(null, o);
      var tcoll__9015 = tcoll__9010;
      while(true) {
        var temp__3971__auto____9016 = cljs.core.first.call(null, es__9014);
        if(cljs.core.truth_(temp__3971__auto____9016)) {
          var e__9017 = temp__3971__auto____9016;
          var G__9028 = cljs.core.next.call(null, es__9014);
          var G__9029 = tcoll__9015.assoc_BANG_(cljs.core.key.call(null, e__9017), cljs.core.val.call(null, e__9017));
          es__9014 = G__9028;
          tcoll__9015 = G__9029;
          continue
        }else {
          return tcoll__9015
        }
        break
      }
    }
  }else {
    throw new Error("conj! after persistent");
  }
};
cljs.core.TransientHashMap.prototype.assoc_BANG_ = function(k, v) {
  var this__9018 = this;
  var tcoll__9019 = this;
  if(this__9018.edit) {
    if(k == null) {
      if(this__9018.nil_val === v) {
      }else {
        this__9018.nil_val = v
      }
      if(this__9018.has_nil_QMARK_) {
      }else {
        this__9018.count = this__9018.count + 1;
        this__9018.has_nil_QMARK_ = true
      }
      return tcoll__9019
    }else {
      var added_leaf_QMARK___9020 = new cljs.core.Box(false);
      var node__9021 = (this__9018.root == null ? cljs.core.BitmapIndexedNode.EMPTY : this__9018.root).inode_assoc_BANG_(this__9018.edit, 0, cljs.core.hash.call(null, k), k, v, added_leaf_QMARK___9020);
      if(node__9021 === this__9018.root) {
      }else {
        this__9018.root = node__9021
      }
      if(added_leaf_QMARK___9020.val) {
        this__9018.count = this__9018.count + 1
      }else {
      }
      return tcoll__9019
    }
  }else {
    throw new Error("assoc! after persistent!");
  }
};
cljs.core.TransientHashMap.prototype.without_BANG_ = function(k) {
  var this__9022 = this;
  var tcoll__9023 = this;
  if(this__9022.edit) {
    if(k == null) {
      if(this__9022.has_nil_QMARK_) {
        this__9022.has_nil_QMARK_ = false;
        this__9022.nil_val = null;
        this__9022.count = this__9022.count - 1;
        return tcoll__9023
      }else {
        return tcoll__9023
      }
    }else {
      if(this__9022.root == null) {
        return tcoll__9023
      }else {
        var removed_leaf_QMARK___9024 = new cljs.core.Box(false);
        var node__9025 = this__9022.root.inode_without_BANG_(this__9022.edit, 0, cljs.core.hash.call(null, k), k, removed_leaf_QMARK___9024);
        if(node__9025 === this__9022.root) {
        }else {
          this__9022.root = node__9025
        }
        if(cljs.core.truth_(removed_leaf_QMARK___9024[0])) {
          this__9022.count = this__9022.count - 1
        }else {
        }
        return tcoll__9023
      }
    }
  }else {
    throw new Error("dissoc! after persistent!");
  }
};
cljs.core.TransientHashMap.prototype.persistent_BANG_ = function() {
  var this__9026 = this;
  var tcoll__9027 = this;
  if(this__9026.edit) {
    this__9026.edit = null;
    return new cljs.core.PersistentHashMap(null, this__9026.count, this__9026.root, this__9026.has_nil_QMARK_, this__9026.nil_val, null)
  }else {
    throw new Error("persistent! called twice");
  }
};
cljs.core.TransientHashMap;
cljs.core.tree_map_seq_push = function tree_map_seq_push(node, stack, ascending_QMARK_) {
  var t__9032 = node;
  var stack__9033 = stack;
  while(true) {
    if(!(t__9032 == null)) {
      var G__9034 = ascending_QMARK_ ? t__9032.left : t__9032.right;
      var G__9035 = cljs.core.conj.call(null, stack__9033, t__9032);
      t__9032 = G__9034;
      stack__9033 = G__9035;
      continue
    }else {
      return stack__9033
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
  var this__9036 = this;
  var h__2194__auto____9037 = this__9036.__hash;
  if(!(h__2194__auto____9037 == null)) {
    return h__2194__auto____9037
  }else {
    var h__2194__auto____9038 = cljs.core.hash_coll.call(null, coll);
    this__9036.__hash = h__2194__auto____9038;
    return h__2194__auto____9038
  }
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__9039 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.PersistentTreeMapSeq.prototype.toString = function() {
  var this__9040 = this;
  var this__9041 = this;
  return cljs.core.pr_str.call(null, this__9041)
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(this$) {
  var this__9042 = this;
  return this$
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__9043 = this;
  if(this__9043.cnt < 0) {
    return cljs.core.count.call(null, cljs.core.next.call(null, coll)) + 1
  }else {
    return this__9043.cnt
  }
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(this$) {
  var this__9044 = this;
  return cljs.core.peek.call(null, this__9044.stack)
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(this$) {
  var this__9045 = this;
  var t__9046 = cljs.core.first.call(null, this__9045.stack);
  var next_stack__9047 = cljs.core.tree_map_seq_push.call(null, this__9045.ascending_QMARK_ ? t__9046.right : t__9046.left, cljs.core.next.call(null, this__9045.stack), this__9045.ascending_QMARK_);
  if(!(next_stack__9047 == null)) {
    return new cljs.core.PersistentTreeMapSeq(null, next_stack__9047, this__9045.ascending_QMARK_, this__9045.cnt - 1, null)
  }else {
    return cljs.core.List.EMPTY
  }
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__9048 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__9049 = this;
  return new cljs.core.PersistentTreeMapSeq(meta, this__9049.stack, this__9049.ascending_QMARK_, this__9049.cnt, this__9049.__hash)
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__9050 = this;
  return this__9050.meta
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
        var and__3822__auto____9052 = cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, right);
        if(and__3822__auto____9052) {
          return cljs.core.instance_QMARK_.call(null, cljs.core.BlackNode, right.left)
        }else {
          return and__3822__auto____9052
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
        var and__3822__auto____9054 = cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, left);
        if(and__3822__auto____9054) {
          return cljs.core.instance_QMARK_.call(null, cljs.core.BlackNode, left.right)
        }else {
          return and__3822__auto____9054
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
  var init__9058 = f.call(null, init, node.key, node.val);
  if(cljs.core.reduced_QMARK_.call(null, init__9058)) {
    return cljs.core.deref.call(null, init__9058)
  }else {
    var init__9059 = !(node.left == null) ? tree_map_kv_reduce.call(null, node.left, f, init__9058) : init__9058;
    if(cljs.core.reduced_QMARK_.call(null, init__9059)) {
      return cljs.core.deref.call(null, init__9059)
    }else {
      var init__9060 = !(node.right == null) ? tree_map_kv_reduce.call(null, node.right, f, init__9059) : init__9059;
      if(cljs.core.reduced_QMARK_.call(null, init__9060)) {
        return cljs.core.deref.call(null, init__9060)
      }else {
        return init__9060
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
  var this__9063 = this;
  var h__2194__auto____9064 = this__9063.__hash;
  if(!(h__2194__auto____9064 == null)) {
    return h__2194__auto____9064
  }else {
    var h__2194__auto____9065 = cljs.core.hash_coll.call(null, coll);
    this__9063.__hash = h__2194__auto____9065;
    return h__2194__auto____9065
  }
};
cljs.core.BlackNode.prototype.cljs$core$ILookup$_lookup$arity$2 = function(node, k) {
  var this__9066 = this;
  return node.cljs$core$IIndexed$_nth$arity$3(node, k, null)
};
cljs.core.BlackNode.prototype.cljs$core$ILookup$_lookup$arity$3 = function(node, k, not_found) {
  var this__9067 = this;
  return node.cljs$core$IIndexed$_nth$arity$3(node, k, not_found)
};
cljs.core.BlackNode.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(node, k, v) {
  var this__9068 = this;
  return cljs.core.assoc.call(null, cljs.core.PersistentVector.fromArray([this__9068.key, this__9068.val], true), k, v)
};
cljs.core.BlackNode.prototype.call = function() {
  var G__9116 = null;
  var G__9116__2 = function(this_sym9069, k) {
    var this__9071 = this;
    var this_sym9069__9072 = this;
    var node__9073 = this_sym9069__9072;
    return node__9073.cljs$core$ILookup$_lookup$arity$2(node__9073, k)
  };
  var G__9116__3 = function(this_sym9070, k, not_found) {
    var this__9071 = this;
    var this_sym9070__9074 = this;
    var node__9075 = this_sym9070__9074;
    return node__9075.cljs$core$ILookup$_lookup$arity$3(node__9075, k, not_found)
  };
  G__9116 = function(this_sym9070, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__9116__2.call(this, this_sym9070, k);
      case 3:
        return G__9116__3.call(this, this_sym9070, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__9116
}();
cljs.core.BlackNode.prototype.apply = function(this_sym9061, args9062) {
  var this__9076 = this;
  return this_sym9061.call.apply(this_sym9061, [this_sym9061].concat(args9062.slice()))
};
cljs.core.BlackNode.prototype.cljs$core$ICollection$_conj$arity$2 = function(node, o) {
  var this__9077 = this;
  return cljs.core.PersistentVector.fromArray([this__9077.key, this__9077.val, o], true)
};
cljs.core.BlackNode.prototype.cljs$core$IMapEntry$_key$arity$1 = function(node) {
  var this__9078 = this;
  return this__9078.key
};
cljs.core.BlackNode.prototype.cljs$core$IMapEntry$_val$arity$1 = function(node) {
  var this__9079 = this;
  return this__9079.val
};
cljs.core.BlackNode.prototype.add_right = function(ins) {
  var this__9080 = this;
  var node__9081 = this;
  return ins.balance_right(node__9081)
};
cljs.core.BlackNode.prototype.redden = function() {
  var this__9082 = this;
  var node__9083 = this;
  return new cljs.core.RedNode(this__9082.key, this__9082.val, this__9082.left, this__9082.right, null)
};
cljs.core.BlackNode.prototype.remove_right = function(del) {
  var this__9084 = this;
  var node__9085 = this;
  return cljs.core.balance_right_del.call(null, this__9084.key, this__9084.val, this__9084.left, del)
};
cljs.core.BlackNode.prototype.replace = function(key, val, left, right) {
  var this__9086 = this;
  var node__9087 = this;
  return new cljs.core.BlackNode(key, val, left, right, null)
};
cljs.core.BlackNode.prototype.kv_reduce = function(f, init) {
  var this__9088 = this;
  var node__9089 = this;
  return cljs.core.tree_map_kv_reduce.call(null, node__9089, f, init)
};
cljs.core.BlackNode.prototype.remove_left = function(del) {
  var this__9090 = this;
  var node__9091 = this;
  return cljs.core.balance_left_del.call(null, this__9090.key, this__9090.val, del, this__9090.right)
};
cljs.core.BlackNode.prototype.add_left = function(ins) {
  var this__9092 = this;
  var node__9093 = this;
  return ins.balance_left(node__9093)
};
cljs.core.BlackNode.prototype.balance_left = function(parent) {
  var this__9094 = this;
  var node__9095 = this;
  return new cljs.core.BlackNode(parent.key, parent.val, node__9095, parent.right, null)
};
cljs.core.BlackNode.prototype.toString = function() {
  var G__9117 = null;
  var G__9117__0 = function() {
    var this__9096 = this;
    var this__9098 = this;
    return cljs.core.pr_str.call(null, this__9098)
  };
  G__9117 = function() {
    switch(arguments.length) {
      case 0:
        return G__9117__0.call(this)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__9117
}();
cljs.core.BlackNode.prototype.balance_right = function(parent) {
  var this__9099 = this;
  var node__9100 = this;
  return new cljs.core.BlackNode(parent.key, parent.val, parent.left, node__9100, null)
};
cljs.core.BlackNode.prototype.blacken = function() {
  var this__9101 = this;
  var node__9102 = this;
  return node__9102
};
cljs.core.BlackNode.prototype.cljs$core$IReduce$_reduce$arity$2 = function(node, f) {
  var this__9103 = this;
  return cljs.core.ci_reduce.call(null, node, f)
};
cljs.core.BlackNode.prototype.cljs$core$IReduce$_reduce$arity$3 = function(node, f, start) {
  var this__9104 = this;
  return cljs.core.ci_reduce.call(null, node, f, start)
};
cljs.core.BlackNode.prototype.cljs$core$ISeqable$_seq$arity$1 = function(node) {
  var this__9105 = this;
  return cljs.core.list.call(null, this__9105.key, this__9105.val)
};
cljs.core.BlackNode.prototype.cljs$core$ICounted$_count$arity$1 = function(node) {
  var this__9106 = this;
  return 2
};
cljs.core.BlackNode.prototype.cljs$core$IStack$_peek$arity$1 = function(node) {
  var this__9107 = this;
  return this__9107.val
};
cljs.core.BlackNode.prototype.cljs$core$IStack$_pop$arity$1 = function(node) {
  var this__9108 = this;
  return cljs.core.PersistentVector.fromArray([this__9108.key], true)
};
cljs.core.BlackNode.prototype.cljs$core$IVector$_assoc_n$arity$3 = function(node, n, v) {
  var this__9109 = this;
  return cljs.core._assoc_n.call(null, cljs.core.PersistentVector.fromArray([this__9109.key, this__9109.val], true), n, v)
};
cljs.core.BlackNode.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__9110 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.BlackNode.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(node, meta) {
  var this__9111 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentVector.fromArray([this__9111.key, this__9111.val], true), meta)
};
cljs.core.BlackNode.prototype.cljs$core$IMeta$_meta$arity$1 = function(node) {
  var this__9112 = this;
  return null
};
cljs.core.BlackNode.prototype.cljs$core$IIndexed$_nth$arity$2 = function(node, n) {
  var this__9113 = this;
  if(n === 0) {
    return this__9113.key
  }else {
    if(n === 1) {
      return this__9113.val
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
  var this__9114 = this;
  if(n === 0) {
    return this__9114.key
  }else {
    if(n === 1) {
      return this__9114.val
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
  var this__9115 = this;
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
  var this__9120 = this;
  var h__2194__auto____9121 = this__9120.__hash;
  if(!(h__2194__auto____9121 == null)) {
    return h__2194__auto____9121
  }else {
    var h__2194__auto____9122 = cljs.core.hash_coll.call(null, coll);
    this__9120.__hash = h__2194__auto____9122;
    return h__2194__auto____9122
  }
};
cljs.core.RedNode.prototype.cljs$core$ILookup$_lookup$arity$2 = function(node, k) {
  var this__9123 = this;
  return node.cljs$core$IIndexed$_nth$arity$3(node, k, null)
};
cljs.core.RedNode.prototype.cljs$core$ILookup$_lookup$arity$3 = function(node, k, not_found) {
  var this__9124 = this;
  return node.cljs$core$IIndexed$_nth$arity$3(node, k, not_found)
};
cljs.core.RedNode.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(node, k, v) {
  var this__9125 = this;
  return cljs.core.assoc.call(null, cljs.core.PersistentVector.fromArray([this__9125.key, this__9125.val], true), k, v)
};
cljs.core.RedNode.prototype.call = function() {
  var G__9173 = null;
  var G__9173__2 = function(this_sym9126, k) {
    var this__9128 = this;
    var this_sym9126__9129 = this;
    var node__9130 = this_sym9126__9129;
    return node__9130.cljs$core$ILookup$_lookup$arity$2(node__9130, k)
  };
  var G__9173__3 = function(this_sym9127, k, not_found) {
    var this__9128 = this;
    var this_sym9127__9131 = this;
    var node__9132 = this_sym9127__9131;
    return node__9132.cljs$core$ILookup$_lookup$arity$3(node__9132, k, not_found)
  };
  G__9173 = function(this_sym9127, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__9173__2.call(this, this_sym9127, k);
      case 3:
        return G__9173__3.call(this, this_sym9127, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__9173
}();
cljs.core.RedNode.prototype.apply = function(this_sym9118, args9119) {
  var this__9133 = this;
  return this_sym9118.call.apply(this_sym9118, [this_sym9118].concat(args9119.slice()))
};
cljs.core.RedNode.prototype.cljs$core$ICollection$_conj$arity$2 = function(node, o) {
  var this__9134 = this;
  return cljs.core.PersistentVector.fromArray([this__9134.key, this__9134.val, o], true)
};
cljs.core.RedNode.prototype.cljs$core$IMapEntry$_key$arity$1 = function(node) {
  var this__9135 = this;
  return this__9135.key
};
cljs.core.RedNode.prototype.cljs$core$IMapEntry$_val$arity$1 = function(node) {
  var this__9136 = this;
  return this__9136.val
};
cljs.core.RedNode.prototype.add_right = function(ins) {
  var this__9137 = this;
  var node__9138 = this;
  return new cljs.core.RedNode(this__9137.key, this__9137.val, this__9137.left, ins, null)
};
cljs.core.RedNode.prototype.redden = function() {
  var this__9139 = this;
  var node__9140 = this;
  throw new Error("red-black tree invariant violation");
};
cljs.core.RedNode.prototype.remove_right = function(del) {
  var this__9141 = this;
  var node__9142 = this;
  return new cljs.core.RedNode(this__9141.key, this__9141.val, this__9141.left, del, null)
};
cljs.core.RedNode.prototype.replace = function(key, val, left, right) {
  var this__9143 = this;
  var node__9144 = this;
  return new cljs.core.RedNode(key, val, left, right, null)
};
cljs.core.RedNode.prototype.kv_reduce = function(f, init) {
  var this__9145 = this;
  var node__9146 = this;
  return cljs.core.tree_map_kv_reduce.call(null, node__9146, f, init)
};
cljs.core.RedNode.prototype.remove_left = function(del) {
  var this__9147 = this;
  var node__9148 = this;
  return new cljs.core.RedNode(this__9147.key, this__9147.val, del, this__9147.right, null)
};
cljs.core.RedNode.prototype.add_left = function(ins) {
  var this__9149 = this;
  var node__9150 = this;
  return new cljs.core.RedNode(this__9149.key, this__9149.val, ins, this__9149.right, null)
};
cljs.core.RedNode.prototype.balance_left = function(parent) {
  var this__9151 = this;
  var node__9152 = this;
  if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, this__9151.left)) {
    return new cljs.core.RedNode(this__9151.key, this__9151.val, this__9151.left.blacken(), new cljs.core.BlackNode(parent.key, parent.val, this__9151.right, parent.right, null), null)
  }else {
    if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, this__9151.right)) {
      return new cljs.core.RedNode(this__9151.right.key, this__9151.right.val, new cljs.core.BlackNode(this__9151.key, this__9151.val, this__9151.left, this__9151.right.left, null), new cljs.core.BlackNode(parent.key, parent.val, this__9151.right.right, parent.right, null), null)
    }else {
      if("\ufdd0'else") {
        return new cljs.core.BlackNode(parent.key, parent.val, node__9152, parent.right, null)
      }else {
        return null
      }
    }
  }
};
cljs.core.RedNode.prototype.toString = function() {
  var G__9174 = null;
  var G__9174__0 = function() {
    var this__9153 = this;
    var this__9155 = this;
    return cljs.core.pr_str.call(null, this__9155)
  };
  G__9174 = function() {
    switch(arguments.length) {
      case 0:
        return G__9174__0.call(this)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__9174
}();
cljs.core.RedNode.prototype.balance_right = function(parent) {
  var this__9156 = this;
  var node__9157 = this;
  if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, this__9156.right)) {
    return new cljs.core.RedNode(this__9156.key, this__9156.val, new cljs.core.BlackNode(parent.key, parent.val, parent.left, this__9156.left, null), this__9156.right.blacken(), null)
  }else {
    if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, this__9156.left)) {
      return new cljs.core.RedNode(this__9156.left.key, this__9156.left.val, new cljs.core.BlackNode(parent.key, parent.val, parent.left, this__9156.left.left, null), new cljs.core.BlackNode(this__9156.key, this__9156.val, this__9156.left.right, this__9156.right, null), null)
    }else {
      if("\ufdd0'else") {
        return new cljs.core.BlackNode(parent.key, parent.val, parent.left, node__9157, null)
      }else {
        return null
      }
    }
  }
};
cljs.core.RedNode.prototype.blacken = function() {
  var this__9158 = this;
  var node__9159 = this;
  return new cljs.core.BlackNode(this__9158.key, this__9158.val, this__9158.left, this__9158.right, null)
};
cljs.core.RedNode.prototype.cljs$core$IReduce$_reduce$arity$2 = function(node, f) {
  var this__9160 = this;
  return cljs.core.ci_reduce.call(null, node, f)
};
cljs.core.RedNode.prototype.cljs$core$IReduce$_reduce$arity$3 = function(node, f, start) {
  var this__9161 = this;
  return cljs.core.ci_reduce.call(null, node, f, start)
};
cljs.core.RedNode.prototype.cljs$core$ISeqable$_seq$arity$1 = function(node) {
  var this__9162 = this;
  return cljs.core.list.call(null, this__9162.key, this__9162.val)
};
cljs.core.RedNode.prototype.cljs$core$ICounted$_count$arity$1 = function(node) {
  var this__9163 = this;
  return 2
};
cljs.core.RedNode.prototype.cljs$core$IStack$_peek$arity$1 = function(node) {
  var this__9164 = this;
  return this__9164.val
};
cljs.core.RedNode.prototype.cljs$core$IStack$_pop$arity$1 = function(node) {
  var this__9165 = this;
  return cljs.core.PersistentVector.fromArray([this__9165.key], true)
};
cljs.core.RedNode.prototype.cljs$core$IVector$_assoc_n$arity$3 = function(node, n, v) {
  var this__9166 = this;
  return cljs.core._assoc_n.call(null, cljs.core.PersistentVector.fromArray([this__9166.key, this__9166.val], true), n, v)
};
cljs.core.RedNode.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__9167 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.RedNode.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(node, meta) {
  var this__9168 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentVector.fromArray([this__9168.key, this__9168.val], true), meta)
};
cljs.core.RedNode.prototype.cljs$core$IMeta$_meta$arity$1 = function(node) {
  var this__9169 = this;
  return null
};
cljs.core.RedNode.prototype.cljs$core$IIndexed$_nth$arity$2 = function(node, n) {
  var this__9170 = this;
  if(n === 0) {
    return this__9170.key
  }else {
    if(n === 1) {
      return this__9170.val
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
  var this__9171 = this;
  if(n === 0) {
    return this__9171.key
  }else {
    if(n === 1) {
      return this__9171.val
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
  var this__9172 = this;
  return cljs.core.PersistentVector.EMPTY
};
cljs.core.RedNode;
cljs.core.tree_map_add = function tree_map_add(comp, tree, k, v, found) {
  if(tree == null) {
    return new cljs.core.RedNode(k, v, null, null, null)
  }else {
    var c__9178 = comp.call(null, k, tree.key);
    if(c__9178 === 0) {
      found[0] = tree;
      return null
    }else {
      if(c__9178 < 0) {
        var ins__9179 = tree_map_add.call(null, comp, tree.left, k, v, found);
        if(!(ins__9179 == null)) {
          return tree.add_left(ins__9179)
        }else {
          return null
        }
      }else {
        if("\ufdd0'else") {
          var ins__9180 = tree_map_add.call(null, comp, tree.right, k, v, found);
          if(!(ins__9180 == null)) {
            return tree.add_right(ins__9180)
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
          var app__9183 = tree_map_append.call(null, left.right, right.left);
          if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, app__9183)) {
            return new cljs.core.RedNode(app__9183.key, app__9183.val, new cljs.core.RedNode(left.key, left.val, left.left, app__9183.left, null), new cljs.core.RedNode(right.key, right.val, app__9183.right, right.right, null), null)
          }else {
            return new cljs.core.RedNode(left.key, left.val, left.left, new cljs.core.RedNode(right.key, right.val, app__9183, right.right, null), null)
          }
        }else {
          return new cljs.core.RedNode(left.key, left.val, left.left, tree_map_append.call(null, left.right, right), null)
        }
      }else {
        if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, right)) {
          return new cljs.core.RedNode(right.key, right.val, tree_map_append.call(null, left, right.left), right.right, null)
        }else {
          if("\ufdd0'else") {
            var app__9184 = tree_map_append.call(null, left.right, right.left);
            if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, app__9184)) {
              return new cljs.core.RedNode(app__9184.key, app__9184.val, new cljs.core.BlackNode(left.key, left.val, left.left, app__9184.left, null), new cljs.core.BlackNode(right.key, right.val, app__9184.right, right.right, null), null)
            }else {
              return cljs.core.balance_left_del.call(null, left.key, left.val, left.left, new cljs.core.BlackNode(right.key, right.val, app__9184, right.right, null))
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
    var c__9190 = comp.call(null, k, tree.key);
    if(c__9190 === 0) {
      found[0] = tree;
      return cljs.core.tree_map_append.call(null, tree.left, tree.right)
    }else {
      if(c__9190 < 0) {
        var del__9191 = tree_map_remove.call(null, comp, tree.left, k, found);
        if(function() {
          var or__3824__auto____9192 = !(del__9191 == null);
          if(or__3824__auto____9192) {
            return or__3824__auto____9192
          }else {
            return!(found[0] == null)
          }
        }()) {
          if(cljs.core.instance_QMARK_.call(null, cljs.core.BlackNode, tree.left)) {
            return cljs.core.balance_left_del.call(null, tree.key, tree.val, del__9191, tree.right)
          }else {
            return new cljs.core.RedNode(tree.key, tree.val, del__9191, tree.right, null)
          }
        }else {
          return null
        }
      }else {
        if("\ufdd0'else") {
          var del__9193 = tree_map_remove.call(null, comp, tree.right, k, found);
          if(function() {
            var or__3824__auto____9194 = !(del__9193 == null);
            if(or__3824__auto____9194) {
              return or__3824__auto____9194
            }else {
              return!(found[0] == null)
            }
          }()) {
            if(cljs.core.instance_QMARK_.call(null, cljs.core.BlackNode, tree.right)) {
              return cljs.core.balance_right_del.call(null, tree.key, tree.val, tree.left, del__9193)
            }else {
              return new cljs.core.RedNode(tree.key, tree.val, tree.left, del__9193, null)
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
  var tk__9197 = tree.key;
  var c__9198 = comp.call(null, k, tk__9197);
  if(c__9198 === 0) {
    return tree.replace(tk__9197, v, tree.left, tree.right)
  }else {
    if(c__9198 < 0) {
      return tree.replace(tk__9197, tree.val, tree_map_replace.call(null, comp, tree.left, k, v), tree.right)
    }else {
      if("\ufdd0'else") {
        return tree.replace(tk__9197, tree.val, tree.left, tree_map_replace.call(null, comp, tree.right, k, v))
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
  var this__9201 = this;
  var h__2194__auto____9202 = this__9201.__hash;
  if(!(h__2194__auto____9202 == null)) {
    return h__2194__auto____9202
  }else {
    var h__2194__auto____9203 = cljs.core.hash_imap.call(null, coll);
    this__9201.__hash = h__2194__auto____9203;
    return h__2194__auto____9203
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__9204 = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(coll, k, null)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__9205 = this;
  var n__9206 = coll.entry_at(k);
  if(!(n__9206 == null)) {
    return n__9206.val
  }else {
    return not_found
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__9207 = this;
  var found__9208 = [null];
  var t__9209 = cljs.core.tree_map_add.call(null, this__9207.comp, this__9207.tree, k, v, found__9208);
  if(t__9209 == null) {
    var found_node__9210 = cljs.core.nth.call(null, found__9208, 0);
    if(cljs.core._EQ_.call(null, v, found_node__9210.val)) {
      return coll
    }else {
      return new cljs.core.PersistentTreeMap(this__9207.comp, cljs.core.tree_map_replace.call(null, this__9207.comp, this__9207.tree, k, v), this__9207.cnt, this__9207.meta, null)
    }
  }else {
    return new cljs.core.PersistentTreeMap(this__9207.comp, t__9209.blacken(), this__9207.cnt + 1, this__9207.meta, null)
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = function(coll, k) {
  var this__9211 = this;
  return!(coll.entry_at(k) == null)
};
cljs.core.PersistentTreeMap.prototype.call = function() {
  var G__9245 = null;
  var G__9245__2 = function(this_sym9212, k) {
    var this__9214 = this;
    var this_sym9212__9215 = this;
    var coll__9216 = this_sym9212__9215;
    return coll__9216.cljs$core$ILookup$_lookup$arity$2(coll__9216, k)
  };
  var G__9245__3 = function(this_sym9213, k, not_found) {
    var this__9214 = this;
    var this_sym9213__9217 = this;
    var coll__9218 = this_sym9213__9217;
    return coll__9218.cljs$core$ILookup$_lookup$arity$3(coll__9218, k, not_found)
  };
  G__9245 = function(this_sym9213, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__9245__2.call(this, this_sym9213, k);
      case 3:
        return G__9245__3.call(this, this_sym9213, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__9245
}();
cljs.core.PersistentTreeMap.prototype.apply = function(this_sym9199, args9200) {
  var this__9219 = this;
  return this_sym9199.call.apply(this_sym9199, [this_sym9199].concat(args9200.slice()))
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IKVReduce$_kv_reduce$arity$3 = function(coll, f, init) {
  var this__9220 = this;
  if(!(this__9220.tree == null)) {
    return cljs.core.tree_map_kv_reduce.call(null, this__9220.tree, f, init)
  }else {
    return init
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, entry) {
  var this__9221 = this;
  if(cljs.core.vector_QMARK_.call(null, entry)) {
    return coll.cljs$core$IAssociative$_assoc$arity$3(coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IReversible$_rseq$arity$1 = function(coll) {
  var this__9222 = this;
  if(this__9222.cnt > 0) {
    return cljs.core.create_tree_map_seq.call(null, this__9222.tree, false, this__9222.cnt)
  }else {
    return null
  }
};
cljs.core.PersistentTreeMap.prototype.toString = function() {
  var this__9223 = this;
  var this__9224 = this;
  return cljs.core.pr_str.call(null, this__9224)
};
cljs.core.PersistentTreeMap.prototype.entry_at = function(k) {
  var this__9225 = this;
  var coll__9226 = this;
  var t__9227 = this__9225.tree;
  while(true) {
    if(!(t__9227 == null)) {
      var c__9228 = this__9225.comp.call(null, k, t__9227.key);
      if(c__9228 === 0) {
        return t__9227
      }else {
        if(c__9228 < 0) {
          var G__9246 = t__9227.left;
          t__9227 = G__9246;
          continue
        }else {
          if("\ufdd0'else") {
            var G__9247 = t__9227.right;
            t__9227 = G__9247;
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
  var this__9229 = this;
  if(this__9229.cnt > 0) {
    return cljs.core.create_tree_map_seq.call(null, this__9229.tree, ascending_QMARK_, this__9229.cnt)
  }else {
    return null
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ISorted$_sorted_seq_from$arity$3 = function(coll, k, ascending_QMARK_) {
  var this__9230 = this;
  if(this__9230.cnt > 0) {
    var stack__9231 = null;
    var t__9232 = this__9230.tree;
    while(true) {
      if(!(t__9232 == null)) {
        var c__9233 = this__9230.comp.call(null, k, t__9232.key);
        if(c__9233 === 0) {
          return new cljs.core.PersistentTreeMapSeq(null, cljs.core.conj.call(null, stack__9231, t__9232), ascending_QMARK_, -1, null)
        }else {
          if(cljs.core.truth_(ascending_QMARK_)) {
            if(c__9233 < 0) {
              var G__9248 = cljs.core.conj.call(null, stack__9231, t__9232);
              var G__9249 = t__9232.left;
              stack__9231 = G__9248;
              t__9232 = G__9249;
              continue
            }else {
              var G__9250 = stack__9231;
              var G__9251 = t__9232.right;
              stack__9231 = G__9250;
              t__9232 = G__9251;
              continue
            }
          }else {
            if("\ufdd0'else") {
              if(c__9233 > 0) {
                var G__9252 = cljs.core.conj.call(null, stack__9231, t__9232);
                var G__9253 = t__9232.right;
                stack__9231 = G__9252;
                t__9232 = G__9253;
                continue
              }else {
                var G__9254 = stack__9231;
                var G__9255 = t__9232.left;
                stack__9231 = G__9254;
                t__9232 = G__9255;
                continue
              }
            }else {
              return null
            }
          }
        }
      }else {
        if(stack__9231 == null) {
          return new cljs.core.PersistentTreeMapSeq(null, stack__9231, ascending_QMARK_, -1, null)
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
  var this__9234 = this;
  return cljs.core.key.call(null, entry)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ISorted$_comparator$arity$1 = function(coll) {
  var this__9235 = this;
  return this__9235.comp
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__9236 = this;
  if(this__9236.cnt > 0) {
    return cljs.core.create_tree_map_seq.call(null, this__9236.tree, true, this__9236.cnt)
  }else {
    return null
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__9237 = this;
  return this__9237.cnt
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__9238 = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__9239 = this;
  return new cljs.core.PersistentTreeMap(this__9239.comp, this__9239.tree, this__9239.cnt, meta, this__9239.__hash)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__9240 = this;
  return this__9240.meta
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__9241 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentTreeMap.EMPTY, this__9241.meta)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IMap$_dissoc$arity$2 = function(coll, k) {
  var this__9242 = this;
  var found__9243 = [null];
  var t__9244 = cljs.core.tree_map_remove.call(null, this__9242.comp, this__9242.tree, k, found__9243);
  if(t__9244 == null) {
    if(cljs.core.nth.call(null, found__9243, 0) == null) {
      return coll
    }else {
      return new cljs.core.PersistentTreeMap(this__9242.comp, null, 0, this__9242.meta, null)
    }
  }else {
    return new cljs.core.PersistentTreeMap(this__9242.comp, t__9244.blacken(), this__9242.cnt - 1, this__9242.meta, null)
  }
};
cljs.core.PersistentTreeMap;
cljs.core.PersistentTreeMap.EMPTY = new cljs.core.PersistentTreeMap(cljs.core.compare, null, 0, null, 0);
cljs.core.hash_map = function() {
  var hash_map__delegate = function(keyvals) {
    var in__9258 = cljs.core.seq.call(null, keyvals);
    var out__9259 = cljs.core.transient$.call(null, cljs.core.PersistentHashMap.EMPTY);
    while(true) {
      if(in__9258) {
        var G__9260 = cljs.core.nnext.call(null, in__9258);
        var G__9261 = cljs.core.assoc_BANG_.call(null, out__9259, cljs.core.first.call(null, in__9258), cljs.core.second.call(null, in__9258));
        in__9258 = G__9260;
        out__9259 = G__9261;
        continue
      }else {
        return cljs.core.persistent_BANG_.call(null, out__9259)
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
  hash_map.cljs$lang$applyTo = function(arglist__9262) {
    var keyvals = cljs.core.seq(arglist__9262);
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
  array_map.cljs$lang$applyTo = function(arglist__9263) {
    var keyvals = cljs.core.seq(arglist__9263);
    return array_map__delegate(keyvals)
  };
  array_map.cljs$lang$arity$variadic = array_map__delegate;
  return array_map
}();
cljs.core.obj_map = function() {
  var obj_map__delegate = function(keyvals) {
    var ks__9267 = [];
    var obj__9268 = {};
    var kvs__9269 = cljs.core.seq.call(null, keyvals);
    while(true) {
      if(kvs__9269) {
        ks__9267.push(cljs.core.first.call(null, kvs__9269));
        obj__9268[cljs.core.first.call(null, kvs__9269)] = cljs.core.second.call(null, kvs__9269);
        var G__9270 = cljs.core.nnext.call(null, kvs__9269);
        kvs__9269 = G__9270;
        continue
      }else {
        return cljs.core.ObjMap.fromObject.call(null, ks__9267, obj__9268)
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
  obj_map.cljs$lang$applyTo = function(arglist__9271) {
    var keyvals = cljs.core.seq(arglist__9271);
    return obj_map__delegate(keyvals)
  };
  obj_map.cljs$lang$arity$variadic = obj_map__delegate;
  return obj_map
}();
cljs.core.sorted_map = function() {
  var sorted_map__delegate = function(keyvals) {
    var in__9274 = cljs.core.seq.call(null, keyvals);
    var out__9275 = cljs.core.PersistentTreeMap.EMPTY;
    while(true) {
      if(in__9274) {
        var G__9276 = cljs.core.nnext.call(null, in__9274);
        var G__9277 = cljs.core.assoc.call(null, out__9275, cljs.core.first.call(null, in__9274), cljs.core.second.call(null, in__9274));
        in__9274 = G__9276;
        out__9275 = G__9277;
        continue
      }else {
        return out__9275
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
  sorted_map.cljs$lang$applyTo = function(arglist__9278) {
    var keyvals = cljs.core.seq(arglist__9278);
    return sorted_map__delegate(keyvals)
  };
  sorted_map.cljs$lang$arity$variadic = sorted_map__delegate;
  return sorted_map
}();
cljs.core.sorted_map_by = function() {
  var sorted_map_by__delegate = function(comparator, keyvals) {
    var in__9281 = cljs.core.seq.call(null, keyvals);
    var out__9282 = new cljs.core.PersistentTreeMap(comparator, null, 0, null, 0);
    while(true) {
      if(in__9281) {
        var G__9283 = cljs.core.nnext.call(null, in__9281);
        var G__9284 = cljs.core.assoc.call(null, out__9282, cljs.core.first.call(null, in__9281), cljs.core.second.call(null, in__9281));
        in__9281 = G__9283;
        out__9282 = G__9284;
        continue
      }else {
        return out__9282
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
  sorted_map_by.cljs$lang$applyTo = function(arglist__9285) {
    var comparator = cljs.core.first(arglist__9285);
    var keyvals = cljs.core.rest(arglist__9285);
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
      return cljs.core.reduce.call(null, function(p1__9286_SHARP_, p2__9287_SHARP_) {
        return cljs.core.conj.call(null, function() {
          var or__3824__auto____9289 = p1__9286_SHARP_;
          if(cljs.core.truth_(or__3824__auto____9289)) {
            return or__3824__auto____9289
          }else {
            return cljs.core.ObjMap.EMPTY
          }
        }(), p2__9287_SHARP_)
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
  merge.cljs$lang$applyTo = function(arglist__9290) {
    var maps = cljs.core.seq(arglist__9290);
    return merge__delegate(maps)
  };
  merge.cljs$lang$arity$variadic = merge__delegate;
  return merge
}();
cljs.core.merge_with = function() {
  var merge_with__delegate = function(f, maps) {
    if(cljs.core.truth_(cljs.core.some.call(null, cljs.core.identity, maps))) {
      var merge_entry__9298 = function(m, e) {
        var k__9296 = cljs.core.first.call(null, e);
        var v__9297 = cljs.core.second.call(null, e);
        if(cljs.core.contains_QMARK_.call(null, m, k__9296)) {
          return cljs.core.assoc.call(null, m, k__9296, f.call(null, cljs.core._lookup.call(null, m, k__9296, null), v__9297))
        }else {
          return cljs.core.assoc.call(null, m, k__9296, v__9297)
        }
      };
      var merge2__9300 = function(m1, m2) {
        return cljs.core.reduce.call(null, merge_entry__9298, function() {
          var or__3824__auto____9299 = m1;
          if(cljs.core.truth_(or__3824__auto____9299)) {
            return or__3824__auto____9299
          }else {
            return cljs.core.ObjMap.EMPTY
          }
        }(), cljs.core.seq.call(null, m2))
      };
      return cljs.core.reduce.call(null, merge2__9300, maps)
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
  merge_with.cljs$lang$applyTo = function(arglist__9301) {
    var f = cljs.core.first(arglist__9301);
    var maps = cljs.core.rest(arglist__9301);
    return merge_with__delegate(f, maps)
  };
  merge_with.cljs$lang$arity$variadic = merge_with__delegate;
  return merge_with
}();
cljs.core.select_keys = function select_keys(map, keyseq) {
  var ret__9306 = cljs.core.ObjMap.EMPTY;
  var keys__9307 = cljs.core.seq.call(null, keyseq);
  while(true) {
    if(keys__9307) {
      var key__9308 = cljs.core.first.call(null, keys__9307);
      var entry__9309 = cljs.core._lookup.call(null, map, key__9308, "\ufdd0'cljs.core/not-found");
      var G__9310 = cljs.core.not_EQ_.call(null, entry__9309, "\ufdd0'cljs.core/not-found") ? cljs.core.assoc.call(null, ret__9306, key__9308, entry__9309) : ret__9306;
      var G__9311 = cljs.core.next.call(null, keys__9307);
      ret__9306 = G__9310;
      keys__9307 = G__9311;
      continue
    }else {
      return ret__9306
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
  var this__9315 = this;
  return new cljs.core.TransientHashSet(cljs.core.transient$.call(null, this__9315.hash_map))
};
cljs.core.PersistentHashSet.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__9316 = this;
  var h__2194__auto____9317 = this__9316.__hash;
  if(!(h__2194__auto____9317 == null)) {
    return h__2194__auto____9317
  }else {
    var h__2194__auto____9318 = cljs.core.hash_iset.call(null, coll);
    this__9316.__hash = h__2194__auto____9318;
    return h__2194__auto____9318
  }
};
cljs.core.PersistentHashSet.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, v) {
  var this__9319 = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(coll, v, null)
};
cljs.core.PersistentHashSet.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, v, not_found) {
  var this__9320 = this;
  if(cljs.core.truth_(cljs.core._contains_key_QMARK_.call(null, this__9320.hash_map, v))) {
    return v
  }else {
    return not_found
  }
};
cljs.core.PersistentHashSet.prototype.call = function() {
  var G__9341 = null;
  var G__9341__2 = function(this_sym9321, k) {
    var this__9323 = this;
    var this_sym9321__9324 = this;
    var coll__9325 = this_sym9321__9324;
    return coll__9325.cljs$core$ILookup$_lookup$arity$2(coll__9325, k)
  };
  var G__9341__3 = function(this_sym9322, k, not_found) {
    var this__9323 = this;
    var this_sym9322__9326 = this;
    var coll__9327 = this_sym9322__9326;
    return coll__9327.cljs$core$ILookup$_lookup$arity$3(coll__9327, k, not_found)
  };
  G__9341 = function(this_sym9322, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__9341__2.call(this, this_sym9322, k);
      case 3:
        return G__9341__3.call(this, this_sym9322, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__9341
}();
cljs.core.PersistentHashSet.prototype.apply = function(this_sym9313, args9314) {
  var this__9328 = this;
  return this_sym9313.call.apply(this_sym9313, [this_sym9313].concat(args9314.slice()))
};
cljs.core.PersistentHashSet.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__9329 = this;
  return new cljs.core.PersistentHashSet(this__9329.meta, cljs.core.assoc.call(null, this__9329.hash_map, o, null), null)
};
cljs.core.PersistentHashSet.prototype.toString = function() {
  var this__9330 = this;
  var this__9331 = this;
  return cljs.core.pr_str.call(null, this__9331)
};
cljs.core.PersistentHashSet.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__9332 = this;
  return cljs.core.keys.call(null, this__9332.hash_map)
};
cljs.core.PersistentHashSet.prototype.cljs$core$ISet$_disjoin$arity$2 = function(coll, v) {
  var this__9333 = this;
  return new cljs.core.PersistentHashSet(this__9333.meta, cljs.core.dissoc.call(null, this__9333.hash_map, v), null)
};
cljs.core.PersistentHashSet.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__9334 = this;
  return cljs.core.count.call(null, cljs.core.seq.call(null, coll))
};
cljs.core.PersistentHashSet.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__9335 = this;
  var and__3822__auto____9336 = cljs.core.set_QMARK_.call(null, other);
  if(and__3822__auto____9336) {
    var and__3822__auto____9337 = cljs.core.count.call(null, coll) === cljs.core.count.call(null, other);
    if(and__3822__auto____9337) {
      return cljs.core.every_QMARK_.call(null, function(p1__9312_SHARP_) {
        return cljs.core.contains_QMARK_.call(null, coll, p1__9312_SHARP_)
      }, other)
    }else {
      return and__3822__auto____9337
    }
  }else {
    return and__3822__auto____9336
  }
};
cljs.core.PersistentHashSet.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__9338 = this;
  return new cljs.core.PersistentHashSet(meta, this__9338.hash_map, this__9338.__hash)
};
cljs.core.PersistentHashSet.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__9339 = this;
  return this__9339.meta
};
cljs.core.PersistentHashSet.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__9340 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentHashSet.EMPTY, this__9340.meta)
};
cljs.core.PersistentHashSet;
cljs.core.PersistentHashSet.EMPTY = new cljs.core.PersistentHashSet(null, cljs.core.hash_map.call(null), 0);
cljs.core.PersistentHashSet.fromArray = function(items) {
  var len__9342 = cljs.core.count.call(null, items);
  var i__9343 = 0;
  var out__9344 = cljs.core.transient$.call(null, cljs.core.PersistentHashSet.EMPTY);
  while(true) {
    if(i__9343 < len__9342) {
      var G__9345 = i__9343 + 1;
      var G__9346 = cljs.core.conj_BANG_.call(null, out__9344, items[i__9343]);
      i__9343 = G__9345;
      out__9344 = G__9346;
      continue
    }else {
      return cljs.core.persistent_BANG_.call(null, out__9344)
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
  var G__9364 = null;
  var G__9364__2 = function(this_sym9350, k) {
    var this__9352 = this;
    var this_sym9350__9353 = this;
    var tcoll__9354 = this_sym9350__9353;
    if(cljs.core._lookup.call(null, this__9352.transient_map, k, cljs.core.lookup_sentinel) === cljs.core.lookup_sentinel) {
      return null
    }else {
      return k
    }
  };
  var G__9364__3 = function(this_sym9351, k, not_found) {
    var this__9352 = this;
    var this_sym9351__9355 = this;
    var tcoll__9356 = this_sym9351__9355;
    if(cljs.core._lookup.call(null, this__9352.transient_map, k, cljs.core.lookup_sentinel) === cljs.core.lookup_sentinel) {
      return not_found
    }else {
      return k
    }
  };
  G__9364 = function(this_sym9351, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__9364__2.call(this, this_sym9351, k);
      case 3:
        return G__9364__3.call(this, this_sym9351, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__9364
}();
cljs.core.TransientHashSet.prototype.apply = function(this_sym9348, args9349) {
  var this__9357 = this;
  return this_sym9348.call.apply(this_sym9348, [this_sym9348].concat(args9349.slice()))
};
cljs.core.TransientHashSet.prototype.cljs$core$ILookup$_lookup$arity$2 = function(tcoll, v) {
  var this__9358 = this;
  return tcoll.cljs$core$ILookup$_lookup$arity$3(tcoll, v, null)
};
cljs.core.TransientHashSet.prototype.cljs$core$ILookup$_lookup$arity$3 = function(tcoll, v, not_found) {
  var this__9359 = this;
  if(cljs.core._lookup.call(null, this__9359.transient_map, v, cljs.core.lookup_sentinel) === cljs.core.lookup_sentinel) {
    return not_found
  }else {
    return v
  }
};
cljs.core.TransientHashSet.prototype.cljs$core$ICounted$_count$arity$1 = function(tcoll) {
  var this__9360 = this;
  return cljs.core.count.call(null, this__9360.transient_map)
};
cljs.core.TransientHashSet.prototype.cljs$core$ITransientSet$_disjoin_BANG_$arity$2 = function(tcoll, v) {
  var this__9361 = this;
  this__9361.transient_map = cljs.core.dissoc_BANG_.call(null, this__9361.transient_map, v);
  return tcoll
};
cljs.core.TransientHashSet.prototype.cljs$core$ITransientCollection$_conj_BANG_$arity$2 = function(tcoll, o) {
  var this__9362 = this;
  this__9362.transient_map = cljs.core.assoc_BANG_.call(null, this__9362.transient_map, o, null);
  return tcoll
};
cljs.core.TransientHashSet.prototype.cljs$core$ITransientCollection$_persistent_BANG_$arity$1 = function(tcoll) {
  var this__9363 = this;
  return new cljs.core.PersistentHashSet(null, cljs.core.persistent_BANG_.call(null, this__9363.transient_map), null)
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
  var this__9367 = this;
  var h__2194__auto____9368 = this__9367.__hash;
  if(!(h__2194__auto____9368 == null)) {
    return h__2194__auto____9368
  }else {
    var h__2194__auto____9369 = cljs.core.hash_iset.call(null, coll);
    this__9367.__hash = h__2194__auto____9369;
    return h__2194__auto____9369
  }
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, v) {
  var this__9370 = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(coll, v, null)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, v, not_found) {
  var this__9371 = this;
  if(cljs.core.truth_(cljs.core._contains_key_QMARK_.call(null, this__9371.tree_map, v))) {
    return v
  }else {
    return not_found
  }
};
cljs.core.PersistentTreeSet.prototype.call = function() {
  var G__9397 = null;
  var G__9397__2 = function(this_sym9372, k) {
    var this__9374 = this;
    var this_sym9372__9375 = this;
    var coll__9376 = this_sym9372__9375;
    return coll__9376.cljs$core$ILookup$_lookup$arity$2(coll__9376, k)
  };
  var G__9397__3 = function(this_sym9373, k, not_found) {
    var this__9374 = this;
    var this_sym9373__9377 = this;
    var coll__9378 = this_sym9373__9377;
    return coll__9378.cljs$core$ILookup$_lookup$arity$3(coll__9378, k, not_found)
  };
  G__9397 = function(this_sym9373, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__9397__2.call(this, this_sym9373, k);
      case 3:
        return G__9397__3.call(this, this_sym9373, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__9397
}();
cljs.core.PersistentTreeSet.prototype.apply = function(this_sym9365, args9366) {
  var this__9379 = this;
  return this_sym9365.call.apply(this_sym9365, [this_sym9365].concat(args9366.slice()))
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__9380 = this;
  return new cljs.core.PersistentTreeSet(this__9380.meta, cljs.core.assoc.call(null, this__9380.tree_map, o, null), null)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IReversible$_rseq$arity$1 = function(coll) {
  var this__9381 = this;
  return cljs.core.map.call(null, cljs.core.key, cljs.core.rseq.call(null, this__9381.tree_map))
};
cljs.core.PersistentTreeSet.prototype.toString = function() {
  var this__9382 = this;
  var this__9383 = this;
  return cljs.core.pr_str.call(null, this__9383)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISorted$_sorted_seq$arity$2 = function(coll, ascending_QMARK_) {
  var this__9384 = this;
  return cljs.core.map.call(null, cljs.core.key, cljs.core._sorted_seq.call(null, this__9384.tree_map, ascending_QMARK_))
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISorted$_sorted_seq_from$arity$3 = function(coll, k, ascending_QMARK_) {
  var this__9385 = this;
  return cljs.core.map.call(null, cljs.core.key, cljs.core._sorted_seq_from.call(null, this__9385.tree_map, k, ascending_QMARK_))
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISorted$_entry_key$arity$2 = function(coll, entry) {
  var this__9386 = this;
  return entry
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISorted$_comparator$arity$1 = function(coll) {
  var this__9387 = this;
  return cljs.core._comparator.call(null, this__9387.tree_map)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__9388 = this;
  return cljs.core.keys.call(null, this__9388.tree_map)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISet$_disjoin$arity$2 = function(coll, v) {
  var this__9389 = this;
  return new cljs.core.PersistentTreeSet(this__9389.meta, cljs.core.dissoc.call(null, this__9389.tree_map, v), null)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__9390 = this;
  return cljs.core.count.call(null, this__9390.tree_map)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__9391 = this;
  var and__3822__auto____9392 = cljs.core.set_QMARK_.call(null, other);
  if(and__3822__auto____9392) {
    var and__3822__auto____9393 = cljs.core.count.call(null, coll) === cljs.core.count.call(null, other);
    if(and__3822__auto____9393) {
      return cljs.core.every_QMARK_.call(null, function(p1__9347_SHARP_) {
        return cljs.core.contains_QMARK_.call(null, coll, p1__9347_SHARP_)
      }, other)
    }else {
      return and__3822__auto____9393
    }
  }else {
    return and__3822__auto____9392
  }
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__9394 = this;
  return new cljs.core.PersistentTreeSet(meta, this__9394.tree_map, this__9394.__hash)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__9395 = this;
  return this__9395.meta
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__9396 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentTreeSet.EMPTY, this__9396.meta)
};
cljs.core.PersistentTreeSet;
cljs.core.PersistentTreeSet.EMPTY = new cljs.core.PersistentTreeSet(null, cljs.core.sorted_map.call(null), 0);
cljs.core.hash_set = function() {
  var hash_set = null;
  var hash_set__0 = function() {
    return cljs.core.PersistentHashSet.EMPTY
  };
  var hash_set__1 = function() {
    var G__9402__delegate = function(keys) {
      var in__9400 = cljs.core.seq.call(null, keys);
      var out__9401 = cljs.core.transient$.call(null, cljs.core.PersistentHashSet.EMPTY);
      while(true) {
        if(cljs.core.seq.call(null, in__9400)) {
          var G__9403 = cljs.core.next.call(null, in__9400);
          var G__9404 = cljs.core.conj_BANG_.call(null, out__9401, cljs.core.first.call(null, in__9400));
          in__9400 = G__9403;
          out__9401 = G__9404;
          continue
        }else {
          return cljs.core.persistent_BANG_.call(null, out__9401)
        }
        break
      }
    };
    var G__9402 = function(var_args) {
      var keys = null;
      if(goog.isDef(var_args)) {
        keys = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
      }
      return G__9402__delegate.call(this, keys)
    };
    G__9402.cljs$lang$maxFixedArity = 0;
    G__9402.cljs$lang$applyTo = function(arglist__9405) {
      var keys = cljs.core.seq(arglist__9405);
      return G__9402__delegate(keys)
    };
    G__9402.cljs$lang$arity$variadic = G__9402__delegate;
    return G__9402
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
  sorted_set.cljs$lang$applyTo = function(arglist__9406) {
    var keys = cljs.core.seq(arglist__9406);
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
  sorted_set_by.cljs$lang$applyTo = function(arglist__9408) {
    var comparator = cljs.core.first(arglist__9408);
    var keys = cljs.core.rest(arglist__9408);
    return sorted_set_by__delegate(comparator, keys)
  };
  sorted_set_by.cljs$lang$arity$variadic = sorted_set_by__delegate;
  return sorted_set_by
}();
cljs.core.replace = function replace(smap, coll) {
  if(cljs.core.vector_QMARK_.call(null, coll)) {
    var n__9414 = cljs.core.count.call(null, coll);
    return cljs.core.reduce.call(null, function(v, i) {
      var temp__3971__auto____9415 = cljs.core.find.call(null, smap, cljs.core.nth.call(null, v, i));
      if(cljs.core.truth_(temp__3971__auto____9415)) {
        var e__9416 = temp__3971__auto____9415;
        return cljs.core.assoc.call(null, v, i, cljs.core.second.call(null, e__9416))
      }else {
        return v
      }
    }, coll, cljs.core.take.call(null, n__9414, cljs.core.iterate.call(null, cljs.core.inc, 0)))
  }else {
    return cljs.core.map.call(null, function(p1__9407_SHARP_) {
      var temp__3971__auto____9417 = cljs.core.find.call(null, smap, p1__9407_SHARP_);
      if(cljs.core.truth_(temp__3971__auto____9417)) {
        var e__9418 = temp__3971__auto____9417;
        return cljs.core.second.call(null, e__9418)
      }else {
        return p1__9407_SHARP_
      }
    }, coll)
  }
};
cljs.core.distinct = function distinct(coll) {
  var step__9448 = function step(xs, seen) {
    return new cljs.core.LazySeq(null, false, function() {
      return function(p__9441, seen) {
        while(true) {
          var vec__9442__9443 = p__9441;
          var f__9444 = cljs.core.nth.call(null, vec__9442__9443, 0, null);
          var xs__9445 = vec__9442__9443;
          var temp__3974__auto____9446 = cljs.core.seq.call(null, xs__9445);
          if(temp__3974__auto____9446) {
            var s__9447 = temp__3974__auto____9446;
            if(cljs.core.contains_QMARK_.call(null, seen, f__9444)) {
              var G__9449 = cljs.core.rest.call(null, s__9447);
              var G__9450 = seen;
              p__9441 = G__9449;
              seen = G__9450;
              continue
            }else {
              return cljs.core.cons.call(null, f__9444, step.call(null, cljs.core.rest.call(null, s__9447), cljs.core.conj.call(null, seen, f__9444)))
            }
          }else {
            return null
          }
          break
        }
      }.call(null, xs, seen)
    }, null)
  };
  return step__9448.call(null, coll, cljs.core.PersistentHashSet.EMPTY)
};
cljs.core.butlast = function butlast(s) {
  var ret__9453 = cljs.core.PersistentVector.EMPTY;
  var s__9454 = s;
  while(true) {
    if(cljs.core.next.call(null, s__9454)) {
      var G__9455 = cljs.core.conj.call(null, ret__9453, cljs.core.first.call(null, s__9454));
      var G__9456 = cljs.core.next.call(null, s__9454);
      ret__9453 = G__9455;
      s__9454 = G__9456;
      continue
    }else {
      return cljs.core.seq.call(null, ret__9453)
    }
    break
  }
};
cljs.core.name = function name(x) {
  if(cljs.core.string_QMARK_.call(null, x)) {
    return x
  }else {
    if(function() {
      var or__3824__auto____9459 = cljs.core.keyword_QMARK_.call(null, x);
      if(or__3824__auto____9459) {
        return or__3824__auto____9459
      }else {
        return cljs.core.symbol_QMARK_.call(null, x)
      }
    }()) {
      var i__9460 = x.lastIndexOf("/");
      if(i__9460 < 0) {
        return cljs.core.subs.call(null, x, 2)
      }else {
        return cljs.core.subs.call(null, x, i__9460 + 1)
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
    var or__3824__auto____9463 = cljs.core.keyword_QMARK_.call(null, x);
    if(or__3824__auto____9463) {
      return or__3824__auto____9463
    }else {
      return cljs.core.symbol_QMARK_.call(null, x)
    }
  }()) {
    var i__9464 = x.lastIndexOf("/");
    if(i__9464 > -1) {
      return cljs.core.subs.call(null, x, 2, i__9464)
    }else {
      return null
    }
  }else {
    throw new Error([cljs.core.str("Doesn't support namespace: "), cljs.core.str(x)].join(""));
  }
};
cljs.core.zipmap = function zipmap(keys, vals) {
  var map__9471 = cljs.core.ObjMap.EMPTY;
  var ks__9472 = cljs.core.seq.call(null, keys);
  var vs__9473 = cljs.core.seq.call(null, vals);
  while(true) {
    if(function() {
      var and__3822__auto____9474 = ks__9472;
      if(and__3822__auto____9474) {
        return vs__9473
      }else {
        return and__3822__auto____9474
      }
    }()) {
      var G__9475 = cljs.core.assoc.call(null, map__9471, cljs.core.first.call(null, ks__9472), cljs.core.first.call(null, vs__9473));
      var G__9476 = cljs.core.next.call(null, ks__9472);
      var G__9477 = cljs.core.next.call(null, vs__9473);
      map__9471 = G__9475;
      ks__9472 = G__9476;
      vs__9473 = G__9477;
      continue
    }else {
      return map__9471
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
    var G__9480__delegate = function(k, x, y, more) {
      return cljs.core.reduce.call(null, function(p1__9465_SHARP_, p2__9466_SHARP_) {
        return max_key.call(null, k, p1__9465_SHARP_, p2__9466_SHARP_)
      }, max_key.call(null, k, x, y), more)
    };
    var G__9480 = function(k, x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__9480__delegate.call(this, k, x, y, more)
    };
    G__9480.cljs$lang$maxFixedArity = 3;
    G__9480.cljs$lang$applyTo = function(arglist__9481) {
      var k = cljs.core.first(arglist__9481);
      var x = cljs.core.first(cljs.core.next(arglist__9481));
      var y = cljs.core.first(cljs.core.next(cljs.core.next(arglist__9481)));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__9481)));
      return G__9480__delegate(k, x, y, more)
    };
    G__9480.cljs$lang$arity$variadic = G__9480__delegate;
    return G__9480
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
    var G__9482__delegate = function(k, x, y, more) {
      return cljs.core.reduce.call(null, function(p1__9478_SHARP_, p2__9479_SHARP_) {
        return min_key.call(null, k, p1__9478_SHARP_, p2__9479_SHARP_)
      }, min_key.call(null, k, x, y), more)
    };
    var G__9482 = function(k, x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__9482__delegate.call(this, k, x, y, more)
    };
    G__9482.cljs$lang$maxFixedArity = 3;
    G__9482.cljs$lang$applyTo = function(arglist__9483) {
      var k = cljs.core.first(arglist__9483);
      var x = cljs.core.first(cljs.core.next(arglist__9483));
      var y = cljs.core.first(cljs.core.next(cljs.core.next(arglist__9483)));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__9483)));
      return G__9482__delegate(k, x, y, more)
    };
    G__9482.cljs$lang$arity$variadic = G__9482__delegate;
    return G__9482
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
      var temp__3974__auto____9486 = cljs.core.seq.call(null, coll);
      if(temp__3974__auto____9486) {
        var s__9487 = temp__3974__auto____9486;
        return cljs.core.cons.call(null, cljs.core.take.call(null, n, s__9487), partition_all.call(null, n, step, cljs.core.drop.call(null, step, s__9487)))
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
    var temp__3974__auto____9490 = cljs.core.seq.call(null, coll);
    if(temp__3974__auto____9490) {
      var s__9491 = temp__3974__auto____9490;
      if(cljs.core.truth_(pred.call(null, cljs.core.first.call(null, s__9491)))) {
        return cljs.core.cons.call(null, cljs.core.first.call(null, s__9491), take_while.call(null, pred, cljs.core.rest.call(null, s__9491)))
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
    var comp__9493 = cljs.core._comparator.call(null, sc);
    return test.call(null, comp__9493.call(null, cljs.core._entry_key.call(null, sc, e), key), 0)
  }
};
cljs.core.subseq = function() {
  var subseq = null;
  var subseq__3 = function(sc, test, key) {
    var include__9505 = cljs.core.mk_bound_fn.call(null, sc, test, key);
    if(cljs.core.truth_(cljs.core.PersistentHashSet.fromArray([cljs.core._GT_, cljs.core._GT__EQ_]).call(null, test))) {
      var temp__3974__auto____9506 = cljs.core._sorted_seq_from.call(null, sc, key, true);
      if(cljs.core.truth_(temp__3974__auto____9506)) {
        var vec__9507__9508 = temp__3974__auto____9506;
        var e__9509 = cljs.core.nth.call(null, vec__9507__9508, 0, null);
        var s__9510 = vec__9507__9508;
        if(cljs.core.truth_(include__9505.call(null, e__9509))) {
          return s__9510
        }else {
          return cljs.core.next.call(null, s__9510)
        }
      }else {
        return null
      }
    }else {
      return cljs.core.take_while.call(null, include__9505, cljs.core._sorted_seq.call(null, sc, true))
    }
  };
  var subseq__5 = function(sc, start_test, start_key, end_test, end_key) {
    var temp__3974__auto____9511 = cljs.core._sorted_seq_from.call(null, sc, start_key, true);
    if(cljs.core.truth_(temp__3974__auto____9511)) {
      var vec__9512__9513 = temp__3974__auto____9511;
      var e__9514 = cljs.core.nth.call(null, vec__9512__9513, 0, null);
      var s__9515 = vec__9512__9513;
      return cljs.core.take_while.call(null, cljs.core.mk_bound_fn.call(null, sc, end_test, end_key), cljs.core.truth_(cljs.core.mk_bound_fn.call(null, sc, start_test, start_key).call(null, e__9514)) ? s__9515 : cljs.core.next.call(null, s__9515))
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
    var include__9527 = cljs.core.mk_bound_fn.call(null, sc, test, key);
    if(cljs.core.truth_(cljs.core.PersistentHashSet.fromArray([cljs.core._LT_, cljs.core._LT__EQ_]).call(null, test))) {
      var temp__3974__auto____9528 = cljs.core._sorted_seq_from.call(null, sc, key, false);
      if(cljs.core.truth_(temp__3974__auto____9528)) {
        var vec__9529__9530 = temp__3974__auto____9528;
        var e__9531 = cljs.core.nth.call(null, vec__9529__9530, 0, null);
        var s__9532 = vec__9529__9530;
        if(cljs.core.truth_(include__9527.call(null, e__9531))) {
          return s__9532
        }else {
          return cljs.core.next.call(null, s__9532)
        }
      }else {
        return null
      }
    }else {
      return cljs.core.take_while.call(null, include__9527, cljs.core._sorted_seq.call(null, sc, false))
    }
  };
  var rsubseq__5 = function(sc, start_test, start_key, end_test, end_key) {
    var temp__3974__auto____9533 = cljs.core._sorted_seq_from.call(null, sc, end_key, false);
    if(cljs.core.truth_(temp__3974__auto____9533)) {
      var vec__9534__9535 = temp__3974__auto____9533;
      var e__9536 = cljs.core.nth.call(null, vec__9534__9535, 0, null);
      var s__9537 = vec__9534__9535;
      return cljs.core.take_while.call(null, cljs.core.mk_bound_fn.call(null, sc, start_test, start_key), cljs.core.truth_(cljs.core.mk_bound_fn.call(null, sc, end_test, end_key).call(null, e__9536)) ? s__9537 : cljs.core.next.call(null, s__9537))
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
  var this__9538 = this;
  var h__2194__auto____9539 = this__9538.__hash;
  if(!(h__2194__auto____9539 == null)) {
    return h__2194__auto____9539
  }else {
    var h__2194__auto____9540 = cljs.core.hash_coll.call(null, rng);
    this__9538.__hash = h__2194__auto____9540;
    return h__2194__auto____9540
  }
};
cljs.core.Range.prototype.cljs$core$INext$_next$arity$1 = function(rng) {
  var this__9541 = this;
  if(this__9541.step > 0) {
    if(this__9541.start + this__9541.step < this__9541.end) {
      return new cljs.core.Range(this__9541.meta, this__9541.start + this__9541.step, this__9541.end, this__9541.step, null)
    }else {
      return null
    }
  }else {
    if(this__9541.start + this__9541.step > this__9541.end) {
      return new cljs.core.Range(this__9541.meta, this__9541.start + this__9541.step, this__9541.end, this__9541.step, null)
    }else {
      return null
    }
  }
};
cljs.core.Range.prototype.cljs$core$ICollection$_conj$arity$2 = function(rng, o) {
  var this__9542 = this;
  return cljs.core.cons.call(null, o, rng)
};
cljs.core.Range.prototype.toString = function() {
  var this__9543 = this;
  var this__9544 = this;
  return cljs.core.pr_str.call(null, this__9544)
};
cljs.core.Range.prototype.cljs$core$IReduce$_reduce$arity$2 = function(rng, f) {
  var this__9545 = this;
  return cljs.core.ci_reduce.call(null, rng, f)
};
cljs.core.Range.prototype.cljs$core$IReduce$_reduce$arity$3 = function(rng, f, s) {
  var this__9546 = this;
  return cljs.core.ci_reduce.call(null, rng, f, s)
};
cljs.core.Range.prototype.cljs$core$ISeqable$_seq$arity$1 = function(rng) {
  var this__9547 = this;
  if(this__9547.step > 0) {
    if(this__9547.start < this__9547.end) {
      return rng
    }else {
      return null
    }
  }else {
    if(this__9547.start > this__9547.end) {
      return rng
    }else {
      return null
    }
  }
};
cljs.core.Range.prototype.cljs$core$ICounted$_count$arity$1 = function(rng) {
  var this__9548 = this;
  if(cljs.core.not.call(null, rng.cljs$core$ISeqable$_seq$arity$1(rng))) {
    return 0
  }else {
    return Math.ceil((this__9548.end - this__9548.start) / this__9548.step)
  }
};
cljs.core.Range.prototype.cljs$core$ISeq$_first$arity$1 = function(rng) {
  var this__9549 = this;
  return this__9549.start
};
cljs.core.Range.prototype.cljs$core$ISeq$_rest$arity$1 = function(rng) {
  var this__9550 = this;
  if(!(rng.cljs$core$ISeqable$_seq$arity$1(rng) == null)) {
    return new cljs.core.Range(this__9550.meta, this__9550.start + this__9550.step, this__9550.end, this__9550.step, null)
  }else {
    return cljs.core.List.EMPTY
  }
};
cljs.core.Range.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(rng, other) {
  var this__9551 = this;
  return cljs.core.equiv_sequential.call(null, rng, other)
};
cljs.core.Range.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(rng, meta) {
  var this__9552 = this;
  return new cljs.core.Range(meta, this__9552.start, this__9552.end, this__9552.step, this__9552.__hash)
};
cljs.core.Range.prototype.cljs$core$IMeta$_meta$arity$1 = function(rng) {
  var this__9553 = this;
  return this__9553.meta
};
cljs.core.Range.prototype.cljs$core$IIndexed$_nth$arity$2 = function(rng, n) {
  var this__9554 = this;
  if(n < rng.cljs$core$ICounted$_count$arity$1(rng)) {
    return this__9554.start + n * this__9554.step
  }else {
    if(function() {
      var and__3822__auto____9555 = this__9554.start > this__9554.end;
      if(and__3822__auto____9555) {
        return this__9554.step === 0
      }else {
        return and__3822__auto____9555
      }
    }()) {
      return this__9554.start
    }else {
      throw new Error("Index out of bounds");
    }
  }
};
cljs.core.Range.prototype.cljs$core$IIndexed$_nth$arity$3 = function(rng, n, not_found) {
  var this__9556 = this;
  if(n < rng.cljs$core$ICounted$_count$arity$1(rng)) {
    return this__9556.start + n * this__9556.step
  }else {
    if(function() {
      var and__3822__auto____9557 = this__9556.start > this__9556.end;
      if(and__3822__auto____9557) {
        return this__9556.step === 0
      }else {
        return and__3822__auto____9557
      }
    }()) {
      return this__9556.start
    }else {
      return not_found
    }
  }
};
cljs.core.Range.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(rng) {
  var this__9558 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__9558.meta)
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
    var temp__3974__auto____9561 = cljs.core.seq.call(null, coll);
    if(temp__3974__auto____9561) {
      var s__9562 = temp__3974__auto____9561;
      return cljs.core.cons.call(null, cljs.core.first.call(null, s__9562), take_nth.call(null, n, cljs.core.drop.call(null, n, s__9562)))
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
    var temp__3974__auto____9569 = cljs.core.seq.call(null, coll);
    if(temp__3974__auto____9569) {
      var s__9570 = temp__3974__auto____9569;
      var fst__9571 = cljs.core.first.call(null, s__9570);
      var fv__9572 = f.call(null, fst__9571);
      var run__9573 = cljs.core.cons.call(null, fst__9571, cljs.core.take_while.call(null, function(p1__9563_SHARP_) {
        return cljs.core._EQ_.call(null, fv__9572, f.call(null, p1__9563_SHARP_))
      }, cljs.core.next.call(null, s__9570)));
      return cljs.core.cons.call(null, run__9573, partition_by.call(null, f, cljs.core.seq.call(null, cljs.core.drop.call(null, cljs.core.count.call(null, run__9573), s__9570))))
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
      var temp__3971__auto____9588 = cljs.core.seq.call(null, coll);
      if(temp__3971__auto____9588) {
        var s__9589 = temp__3971__auto____9588;
        return reductions.call(null, f, cljs.core.first.call(null, s__9589), cljs.core.rest.call(null, s__9589))
      }else {
        return cljs.core.list.call(null, f.call(null))
      }
    }, null)
  };
  var reductions__3 = function(f, init, coll) {
    return cljs.core.cons.call(null, init, new cljs.core.LazySeq(null, false, function() {
      var temp__3974__auto____9590 = cljs.core.seq.call(null, coll);
      if(temp__3974__auto____9590) {
        var s__9591 = temp__3974__auto____9590;
        return reductions.call(null, f, f.call(null, init, cljs.core.first.call(null, s__9591)), cljs.core.rest.call(null, s__9591))
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
      var G__9594 = null;
      var G__9594__0 = function() {
        return cljs.core.vector.call(null, f.call(null))
      };
      var G__9594__1 = function(x) {
        return cljs.core.vector.call(null, f.call(null, x))
      };
      var G__9594__2 = function(x, y) {
        return cljs.core.vector.call(null, f.call(null, x, y))
      };
      var G__9594__3 = function(x, y, z) {
        return cljs.core.vector.call(null, f.call(null, x, y, z))
      };
      var G__9594__4 = function() {
        var G__9595__delegate = function(x, y, z, args) {
          return cljs.core.vector.call(null, cljs.core.apply.call(null, f, x, y, z, args))
        };
        var G__9595 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__9595__delegate.call(this, x, y, z, args)
        };
        G__9595.cljs$lang$maxFixedArity = 3;
        G__9595.cljs$lang$applyTo = function(arglist__9596) {
          var x = cljs.core.first(arglist__9596);
          var y = cljs.core.first(cljs.core.next(arglist__9596));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__9596)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__9596)));
          return G__9595__delegate(x, y, z, args)
        };
        G__9595.cljs$lang$arity$variadic = G__9595__delegate;
        return G__9595
      }();
      G__9594 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__9594__0.call(this);
          case 1:
            return G__9594__1.call(this, x);
          case 2:
            return G__9594__2.call(this, x, y);
          case 3:
            return G__9594__3.call(this, x, y, z);
          default:
            return G__9594__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__9594.cljs$lang$maxFixedArity = 3;
      G__9594.cljs$lang$applyTo = G__9594__4.cljs$lang$applyTo;
      return G__9594
    }()
  };
  var juxt__2 = function(f, g) {
    return function() {
      var G__9597 = null;
      var G__9597__0 = function() {
        return cljs.core.vector.call(null, f.call(null), g.call(null))
      };
      var G__9597__1 = function(x) {
        return cljs.core.vector.call(null, f.call(null, x), g.call(null, x))
      };
      var G__9597__2 = function(x, y) {
        return cljs.core.vector.call(null, f.call(null, x, y), g.call(null, x, y))
      };
      var G__9597__3 = function(x, y, z) {
        return cljs.core.vector.call(null, f.call(null, x, y, z), g.call(null, x, y, z))
      };
      var G__9597__4 = function() {
        var G__9598__delegate = function(x, y, z, args) {
          return cljs.core.vector.call(null, cljs.core.apply.call(null, f, x, y, z, args), cljs.core.apply.call(null, g, x, y, z, args))
        };
        var G__9598 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__9598__delegate.call(this, x, y, z, args)
        };
        G__9598.cljs$lang$maxFixedArity = 3;
        G__9598.cljs$lang$applyTo = function(arglist__9599) {
          var x = cljs.core.first(arglist__9599);
          var y = cljs.core.first(cljs.core.next(arglist__9599));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__9599)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__9599)));
          return G__9598__delegate(x, y, z, args)
        };
        G__9598.cljs$lang$arity$variadic = G__9598__delegate;
        return G__9598
      }();
      G__9597 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__9597__0.call(this);
          case 1:
            return G__9597__1.call(this, x);
          case 2:
            return G__9597__2.call(this, x, y);
          case 3:
            return G__9597__3.call(this, x, y, z);
          default:
            return G__9597__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__9597.cljs$lang$maxFixedArity = 3;
      G__9597.cljs$lang$applyTo = G__9597__4.cljs$lang$applyTo;
      return G__9597
    }()
  };
  var juxt__3 = function(f, g, h) {
    return function() {
      var G__9600 = null;
      var G__9600__0 = function() {
        return cljs.core.vector.call(null, f.call(null), g.call(null), h.call(null))
      };
      var G__9600__1 = function(x) {
        return cljs.core.vector.call(null, f.call(null, x), g.call(null, x), h.call(null, x))
      };
      var G__9600__2 = function(x, y) {
        return cljs.core.vector.call(null, f.call(null, x, y), g.call(null, x, y), h.call(null, x, y))
      };
      var G__9600__3 = function(x, y, z) {
        return cljs.core.vector.call(null, f.call(null, x, y, z), g.call(null, x, y, z), h.call(null, x, y, z))
      };
      var G__9600__4 = function() {
        var G__9601__delegate = function(x, y, z, args) {
          return cljs.core.vector.call(null, cljs.core.apply.call(null, f, x, y, z, args), cljs.core.apply.call(null, g, x, y, z, args), cljs.core.apply.call(null, h, x, y, z, args))
        };
        var G__9601 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__9601__delegate.call(this, x, y, z, args)
        };
        G__9601.cljs$lang$maxFixedArity = 3;
        G__9601.cljs$lang$applyTo = function(arglist__9602) {
          var x = cljs.core.first(arglist__9602);
          var y = cljs.core.first(cljs.core.next(arglist__9602));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__9602)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__9602)));
          return G__9601__delegate(x, y, z, args)
        };
        G__9601.cljs$lang$arity$variadic = G__9601__delegate;
        return G__9601
      }();
      G__9600 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__9600__0.call(this);
          case 1:
            return G__9600__1.call(this, x);
          case 2:
            return G__9600__2.call(this, x, y);
          case 3:
            return G__9600__3.call(this, x, y, z);
          default:
            return G__9600__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__9600.cljs$lang$maxFixedArity = 3;
      G__9600.cljs$lang$applyTo = G__9600__4.cljs$lang$applyTo;
      return G__9600
    }()
  };
  var juxt__4 = function() {
    var G__9603__delegate = function(f, g, h, fs) {
      var fs__9593 = cljs.core.list_STAR_.call(null, f, g, h, fs);
      return function() {
        var G__9604 = null;
        var G__9604__0 = function() {
          return cljs.core.reduce.call(null, function(p1__9574_SHARP_, p2__9575_SHARP_) {
            return cljs.core.conj.call(null, p1__9574_SHARP_, p2__9575_SHARP_.call(null))
          }, cljs.core.PersistentVector.EMPTY, fs__9593)
        };
        var G__9604__1 = function(x) {
          return cljs.core.reduce.call(null, function(p1__9576_SHARP_, p2__9577_SHARP_) {
            return cljs.core.conj.call(null, p1__9576_SHARP_, p2__9577_SHARP_.call(null, x))
          }, cljs.core.PersistentVector.EMPTY, fs__9593)
        };
        var G__9604__2 = function(x, y) {
          return cljs.core.reduce.call(null, function(p1__9578_SHARP_, p2__9579_SHARP_) {
            return cljs.core.conj.call(null, p1__9578_SHARP_, p2__9579_SHARP_.call(null, x, y))
          }, cljs.core.PersistentVector.EMPTY, fs__9593)
        };
        var G__9604__3 = function(x, y, z) {
          return cljs.core.reduce.call(null, function(p1__9580_SHARP_, p2__9581_SHARP_) {
            return cljs.core.conj.call(null, p1__9580_SHARP_, p2__9581_SHARP_.call(null, x, y, z))
          }, cljs.core.PersistentVector.EMPTY, fs__9593)
        };
        var G__9604__4 = function() {
          var G__9605__delegate = function(x, y, z, args) {
            return cljs.core.reduce.call(null, function(p1__9582_SHARP_, p2__9583_SHARP_) {
              return cljs.core.conj.call(null, p1__9582_SHARP_, cljs.core.apply.call(null, p2__9583_SHARP_, x, y, z, args))
            }, cljs.core.PersistentVector.EMPTY, fs__9593)
          };
          var G__9605 = function(x, y, z, var_args) {
            var args = null;
            if(goog.isDef(var_args)) {
              args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
            }
            return G__9605__delegate.call(this, x, y, z, args)
          };
          G__9605.cljs$lang$maxFixedArity = 3;
          G__9605.cljs$lang$applyTo = function(arglist__9606) {
            var x = cljs.core.first(arglist__9606);
            var y = cljs.core.first(cljs.core.next(arglist__9606));
            var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__9606)));
            var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__9606)));
            return G__9605__delegate(x, y, z, args)
          };
          G__9605.cljs$lang$arity$variadic = G__9605__delegate;
          return G__9605
        }();
        G__9604 = function(x, y, z, var_args) {
          var args = var_args;
          switch(arguments.length) {
            case 0:
              return G__9604__0.call(this);
            case 1:
              return G__9604__1.call(this, x);
            case 2:
              return G__9604__2.call(this, x, y);
            case 3:
              return G__9604__3.call(this, x, y, z);
            default:
              return G__9604__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
          }
          throw"Invalid arity: " + arguments.length;
        };
        G__9604.cljs$lang$maxFixedArity = 3;
        G__9604.cljs$lang$applyTo = G__9604__4.cljs$lang$applyTo;
        return G__9604
      }()
    };
    var G__9603 = function(f, g, h, var_args) {
      var fs = null;
      if(goog.isDef(var_args)) {
        fs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__9603__delegate.call(this, f, g, h, fs)
    };
    G__9603.cljs$lang$maxFixedArity = 3;
    G__9603.cljs$lang$applyTo = function(arglist__9607) {
      var f = cljs.core.first(arglist__9607);
      var g = cljs.core.first(cljs.core.next(arglist__9607));
      var h = cljs.core.first(cljs.core.next(cljs.core.next(arglist__9607)));
      var fs = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__9607)));
      return G__9603__delegate(f, g, h, fs)
    };
    G__9603.cljs$lang$arity$variadic = G__9603__delegate;
    return G__9603
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
        var G__9610 = cljs.core.next.call(null, coll);
        coll = G__9610;
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
        var and__3822__auto____9609 = cljs.core.seq.call(null, coll);
        if(and__3822__auto____9609) {
          return n > 0
        }else {
          return and__3822__auto____9609
        }
      }())) {
        var G__9611 = n - 1;
        var G__9612 = cljs.core.next.call(null, coll);
        n = G__9611;
        coll = G__9612;
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
  var matches__9614 = re.exec(s);
  if(cljs.core._EQ_.call(null, cljs.core.first.call(null, matches__9614), s)) {
    if(cljs.core.count.call(null, matches__9614) === 1) {
      return cljs.core.first.call(null, matches__9614)
    }else {
      return cljs.core.vec.call(null, matches__9614)
    }
  }else {
    return null
  }
};
cljs.core.re_find = function re_find(re, s) {
  var matches__9616 = re.exec(s);
  if(matches__9616 == null) {
    return null
  }else {
    if(cljs.core.count.call(null, matches__9616) === 1) {
      return cljs.core.first.call(null, matches__9616)
    }else {
      return cljs.core.vec.call(null, matches__9616)
    }
  }
};
cljs.core.re_seq = function re_seq(re, s) {
  var match_data__9621 = cljs.core.re_find.call(null, re, s);
  var match_idx__9622 = s.search(re);
  var match_str__9623 = cljs.core.coll_QMARK_.call(null, match_data__9621) ? cljs.core.first.call(null, match_data__9621) : match_data__9621;
  var post_match__9624 = cljs.core.subs.call(null, s, match_idx__9622 + cljs.core.count.call(null, match_str__9623));
  if(cljs.core.truth_(match_data__9621)) {
    return new cljs.core.LazySeq(null, false, function() {
      return cljs.core.cons.call(null, match_data__9621, re_seq.call(null, re, post_match__9624))
    }, null)
  }else {
    return null
  }
};
cljs.core.re_pattern = function re_pattern(s) {
  var vec__9631__9632 = cljs.core.re_find.call(null, /^(?:\(\?([idmsux]*)\))?(.*)/, s);
  var ___9633 = cljs.core.nth.call(null, vec__9631__9632, 0, null);
  var flags__9634 = cljs.core.nth.call(null, vec__9631__9632, 1, null);
  var pattern__9635 = cljs.core.nth.call(null, vec__9631__9632, 2, null);
  return new RegExp(pattern__9635, flags__9634)
};
cljs.core.pr_sequential = function pr_sequential(print_one, begin, sep, end, opts, coll) {
  return cljs.core.concat.call(null, cljs.core.PersistentVector.fromArray([begin], true), cljs.core.flatten1.call(null, cljs.core.interpose.call(null, cljs.core.PersistentVector.fromArray([sep], true), cljs.core.map.call(null, function(p1__9625_SHARP_) {
    return print_one.call(null, p1__9625_SHARP_, opts)
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
          var and__3822__auto____9645 = cljs.core._lookup.call(null, opts, "\ufdd0'meta", null);
          if(cljs.core.truth_(and__3822__auto____9645)) {
            var and__3822__auto____9649 = function() {
              var G__9646__9647 = obj;
              if(G__9646__9647) {
                if(function() {
                  var or__3824__auto____9648 = G__9646__9647.cljs$lang$protocol_mask$partition0$ & 131072;
                  if(or__3824__auto____9648) {
                    return or__3824__auto____9648
                  }else {
                    return G__9646__9647.cljs$core$IMeta$
                  }
                }()) {
                  return true
                }else {
                  if(!G__9646__9647.cljs$lang$protocol_mask$partition0$) {
                    return cljs.core.type_satisfies_.call(null, cljs.core.IMeta, G__9646__9647)
                  }else {
                    return false
                  }
                }
              }else {
                return cljs.core.type_satisfies_.call(null, cljs.core.IMeta, G__9646__9647)
              }
            }();
            if(cljs.core.truth_(and__3822__auto____9649)) {
              return cljs.core.meta.call(null, obj)
            }else {
              return and__3822__auto____9649
            }
          }else {
            return and__3822__auto____9645
          }
        }()) ? cljs.core.concat.call(null, cljs.core.PersistentVector.fromArray(["^"], true), pr_seq.call(null, cljs.core.meta.call(null, obj), opts), cljs.core.PersistentVector.fromArray([" "], true)) : null, function() {
          var and__3822__auto____9650 = !(obj == null);
          if(and__3822__auto____9650) {
            return obj.cljs$lang$type
          }else {
            return and__3822__auto____9650
          }
        }() ? obj.cljs$lang$ctorPrSeq(obj) : function() {
          var G__9651__9652 = obj;
          if(G__9651__9652) {
            if(function() {
              var or__3824__auto____9653 = G__9651__9652.cljs$lang$protocol_mask$partition0$ & 536870912;
              if(or__3824__auto____9653) {
                return or__3824__auto____9653
              }else {
                return G__9651__9652.cljs$core$IPrintable$
              }
            }()) {
              return true
            }else {
              if(!G__9651__9652.cljs$lang$protocol_mask$partition0$) {
                return cljs.core.type_satisfies_.call(null, cljs.core.IPrintable, G__9651__9652)
              }else {
                return false
              }
            }
          }else {
            return cljs.core.type_satisfies_.call(null, cljs.core.IPrintable, G__9651__9652)
          }
        }() ? cljs.core._pr_seq.call(null, obj, opts) : cljs.core.truth_(cljs.core.regexp_QMARK_.call(null, obj)) ? cljs.core.list.call(null, '#"', obj.source, '"') : "\ufdd0'else" ? cljs.core.list.call(null, "#<", [cljs.core.str(obj)].join(""), ">") : null)
      }else {
        return null
      }
    }
  }
};
cljs.core.pr_sb = function pr_sb(objs, opts) {
  var sb__9673 = new goog.string.StringBuffer;
  var G__9674__9675 = cljs.core.seq.call(null, cljs.core.pr_seq.call(null, cljs.core.first.call(null, objs), opts));
  if(G__9674__9675) {
    var string__9676 = cljs.core.first.call(null, G__9674__9675);
    var G__9674__9677 = G__9674__9675;
    while(true) {
      sb__9673.append(string__9676);
      var temp__3974__auto____9678 = cljs.core.next.call(null, G__9674__9677);
      if(temp__3974__auto____9678) {
        var G__9674__9679 = temp__3974__auto____9678;
        var G__9692 = cljs.core.first.call(null, G__9674__9679);
        var G__9693 = G__9674__9679;
        string__9676 = G__9692;
        G__9674__9677 = G__9693;
        continue
      }else {
      }
      break
    }
  }else {
  }
  var G__9680__9681 = cljs.core.seq.call(null, cljs.core.next.call(null, objs));
  if(G__9680__9681) {
    var obj__9682 = cljs.core.first.call(null, G__9680__9681);
    var G__9680__9683 = G__9680__9681;
    while(true) {
      sb__9673.append(" ");
      var G__9684__9685 = cljs.core.seq.call(null, cljs.core.pr_seq.call(null, obj__9682, opts));
      if(G__9684__9685) {
        var string__9686 = cljs.core.first.call(null, G__9684__9685);
        var G__9684__9687 = G__9684__9685;
        while(true) {
          sb__9673.append(string__9686);
          var temp__3974__auto____9688 = cljs.core.next.call(null, G__9684__9687);
          if(temp__3974__auto____9688) {
            var G__9684__9689 = temp__3974__auto____9688;
            var G__9694 = cljs.core.first.call(null, G__9684__9689);
            var G__9695 = G__9684__9689;
            string__9686 = G__9694;
            G__9684__9687 = G__9695;
            continue
          }else {
          }
          break
        }
      }else {
      }
      var temp__3974__auto____9690 = cljs.core.next.call(null, G__9680__9683);
      if(temp__3974__auto____9690) {
        var G__9680__9691 = temp__3974__auto____9690;
        var G__9696 = cljs.core.first.call(null, G__9680__9691);
        var G__9697 = G__9680__9691;
        obj__9682 = G__9696;
        G__9680__9683 = G__9697;
        continue
      }else {
      }
      break
    }
  }else {
  }
  return sb__9673
};
cljs.core.pr_str_with_opts = function pr_str_with_opts(objs, opts) {
  return[cljs.core.str(cljs.core.pr_sb.call(null, objs, opts))].join("")
};
cljs.core.prn_str_with_opts = function prn_str_with_opts(objs, opts) {
  var sb__9699 = cljs.core.pr_sb.call(null, objs, opts);
  sb__9699.append("\n");
  return[cljs.core.str(sb__9699)].join("")
};
cljs.core.pr_with_opts = function pr_with_opts(objs, opts) {
  var G__9718__9719 = cljs.core.seq.call(null, cljs.core.pr_seq.call(null, cljs.core.first.call(null, objs), opts));
  if(G__9718__9719) {
    var string__9720 = cljs.core.first.call(null, G__9718__9719);
    var G__9718__9721 = G__9718__9719;
    while(true) {
      cljs.core.string_print.call(null, string__9720);
      var temp__3974__auto____9722 = cljs.core.next.call(null, G__9718__9721);
      if(temp__3974__auto____9722) {
        var G__9718__9723 = temp__3974__auto____9722;
        var G__9736 = cljs.core.first.call(null, G__9718__9723);
        var G__9737 = G__9718__9723;
        string__9720 = G__9736;
        G__9718__9721 = G__9737;
        continue
      }else {
      }
      break
    }
  }else {
  }
  var G__9724__9725 = cljs.core.seq.call(null, cljs.core.next.call(null, objs));
  if(G__9724__9725) {
    var obj__9726 = cljs.core.first.call(null, G__9724__9725);
    var G__9724__9727 = G__9724__9725;
    while(true) {
      cljs.core.string_print.call(null, " ");
      var G__9728__9729 = cljs.core.seq.call(null, cljs.core.pr_seq.call(null, obj__9726, opts));
      if(G__9728__9729) {
        var string__9730 = cljs.core.first.call(null, G__9728__9729);
        var G__9728__9731 = G__9728__9729;
        while(true) {
          cljs.core.string_print.call(null, string__9730);
          var temp__3974__auto____9732 = cljs.core.next.call(null, G__9728__9731);
          if(temp__3974__auto____9732) {
            var G__9728__9733 = temp__3974__auto____9732;
            var G__9738 = cljs.core.first.call(null, G__9728__9733);
            var G__9739 = G__9728__9733;
            string__9730 = G__9738;
            G__9728__9731 = G__9739;
            continue
          }else {
          }
          break
        }
      }else {
      }
      var temp__3974__auto____9734 = cljs.core.next.call(null, G__9724__9727);
      if(temp__3974__auto____9734) {
        var G__9724__9735 = temp__3974__auto____9734;
        var G__9740 = cljs.core.first.call(null, G__9724__9735);
        var G__9741 = G__9724__9735;
        obj__9726 = G__9740;
        G__9724__9727 = G__9741;
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
  pr_str.cljs$lang$applyTo = function(arglist__9742) {
    var objs = cljs.core.seq(arglist__9742);
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
  prn_str.cljs$lang$applyTo = function(arglist__9743) {
    var objs = cljs.core.seq(arglist__9743);
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
  pr.cljs$lang$applyTo = function(arglist__9744) {
    var objs = cljs.core.seq(arglist__9744);
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
  cljs_core_print.cljs$lang$applyTo = function(arglist__9745) {
    var objs = cljs.core.seq(arglist__9745);
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
  print_str.cljs$lang$applyTo = function(arglist__9746) {
    var objs = cljs.core.seq(arglist__9746);
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
  println.cljs$lang$applyTo = function(arglist__9747) {
    var objs = cljs.core.seq(arglist__9747);
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
  println_str.cljs$lang$applyTo = function(arglist__9748) {
    var objs = cljs.core.seq(arglist__9748);
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
  prn.cljs$lang$applyTo = function(arglist__9749) {
    var objs = cljs.core.seq(arglist__9749);
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
  printf.cljs$lang$applyTo = function(arglist__9750) {
    var fmt = cljs.core.first(arglist__9750);
    var args = cljs.core.rest(arglist__9750);
    return printf__delegate(fmt, args)
  };
  printf.cljs$lang$arity$variadic = printf__delegate;
  return printf
}();
cljs.core.HashMap.prototype.cljs$core$IPrintable$ = true;
cljs.core.HashMap.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  var pr_pair__9751 = function(keyval) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential.call(null, pr_pair__9751, "{", ", ", "}", opts, coll)
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
  var pr_pair__9752 = function(keyval) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential.call(null, pr_pair__9752, "{", ", ", "}", opts, coll)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentArrayMap.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  var pr_pair__9753 = function(keyval) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential.call(null, pr_pair__9753, "{", ", ", "}", opts, coll)
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
      var temp__3974__auto____9754 = cljs.core.namespace.call(null, obj);
      if(cljs.core.truth_(temp__3974__auto____9754)) {
        var nspc__9755 = temp__3974__auto____9754;
        return[cljs.core.str(nspc__9755), cljs.core.str("/")].join("")
      }else {
        return null
      }
    }()), cljs.core.str(cljs.core.name.call(null, obj))].join(""))
  }else {
    if(cljs.core.symbol_QMARK_.call(null, obj)) {
      return cljs.core.list.call(null, [cljs.core.str(function() {
        var temp__3974__auto____9756 = cljs.core.namespace.call(null, obj);
        if(cljs.core.truth_(temp__3974__auto____9756)) {
          var nspc__9757 = temp__3974__auto____9756;
          return[cljs.core.str(nspc__9757), cljs.core.str("/")].join("")
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
  var pr_pair__9758 = function(keyval) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential.call(null, pr_pair__9758, "{", ", ", "}", opts, coll)
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
  var normalize__9760 = function(n, len) {
    var ns__9759 = [cljs.core.str(n)].join("");
    while(true) {
      if(cljs.core.count.call(null, ns__9759) < len) {
        var G__9762 = [cljs.core.str("0"), cljs.core.str(ns__9759)].join("");
        ns__9759 = G__9762;
        continue
      }else {
        return ns__9759
      }
      break
    }
  };
  return cljs.core.list.call(null, [cljs.core.str('#inst "'), cljs.core.str(d.getUTCFullYear()), cljs.core.str("-"), cljs.core.str(normalize__9760.call(null, d.getUTCMonth() + 1, 2)), cljs.core.str("-"), cljs.core.str(normalize__9760.call(null, d.getUTCDate(), 2)), cljs.core.str("T"), cljs.core.str(normalize__9760.call(null, d.getUTCHours(), 2)), cljs.core.str(":"), cljs.core.str(normalize__9760.call(null, d.getUTCMinutes(), 2)), cljs.core.str(":"), cljs.core.str(normalize__9760.call(null, d.getUTCSeconds(), 
  2)), cljs.core.str("."), cljs.core.str(normalize__9760.call(null, d.getUTCMilliseconds(), 3)), cljs.core.str("-"), cljs.core.str('00:00"')].join(""))
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
  var pr_pair__9761 = function(keyval) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential.call(null, pr_pair__9761, "{", ", ", "}", opts, coll)
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
  var this__9763 = this;
  return goog.getUid(this$)
};
cljs.core.Atom.prototype.cljs$core$IWatchable$_notify_watches$arity$3 = function(this$, oldval, newval) {
  var this__9764 = this;
  var G__9765__9766 = cljs.core.seq.call(null, this__9764.watches);
  if(G__9765__9766) {
    var G__9768__9770 = cljs.core.first.call(null, G__9765__9766);
    var vec__9769__9771 = G__9768__9770;
    var key__9772 = cljs.core.nth.call(null, vec__9769__9771, 0, null);
    var f__9773 = cljs.core.nth.call(null, vec__9769__9771, 1, null);
    var G__9765__9774 = G__9765__9766;
    var G__9768__9775 = G__9768__9770;
    var G__9765__9776 = G__9765__9774;
    while(true) {
      var vec__9777__9778 = G__9768__9775;
      var key__9779 = cljs.core.nth.call(null, vec__9777__9778, 0, null);
      var f__9780 = cljs.core.nth.call(null, vec__9777__9778, 1, null);
      var G__9765__9781 = G__9765__9776;
      f__9780.call(null, key__9779, this$, oldval, newval);
      var temp__3974__auto____9782 = cljs.core.next.call(null, G__9765__9781);
      if(temp__3974__auto____9782) {
        var G__9765__9783 = temp__3974__auto____9782;
        var G__9790 = cljs.core.first.call(null, G__9765__9783);
        var G__9791 = G__9765__9783;
        G__9768__9775 = G__9790;
        G__9765__9776 = G__9791;
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
  var this__9784 = this;
  return this$.watches = cljs.core.assoc.call(null, this__9784.watches, key, f)
};
cljs.core.Atom.prototype.cljs$core$IWatchable$_remove_watch$arity$2 = function(this$, key) {
  var this__9785 = this;
  return this$.watches = cljs.core.dissoc.call(null, this__9785.watches, key)
};
cljs.core.Atom.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(a, opts) {
  var this__9786 = this;
  return cljs.core.concat.call(null, cljs.core.PersistentVector.fromArray(["#<Atom: "], true), cljs.core._pr_seq.call(null, this__9786.state, opts), ">")
};
cljs.core.Atom.prototype.cljs$core$IMeta$_meta$arity$1 = function(_) {
  var this__9787 = this;
  return this__9787.meta
};
cljs.core.Atom.prototype.cljs$core$IDeref$_deref$arity$1 = function(_) {
  var this__9788 = this;
  return this__9788.state
};
cljs.core.Atom.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(o, other) {
  var this__9789 = this;
  return o === other
};
cljs.core.Atom;
cljs.core.atom = function() {
  var atom = null;
  var atom__1 = function(x) {
    return new cljs.core.Atom(x, null, null, null)
  };
  var atom__2 = function() {
    var G__9803__delegate = function(x, p__9792) {
      var map__9798__9799 = p__9792;
      var map__9798__9800 = cljs.core.seq_QMARK_.call(null, map__9798__9799) ? cljs.core.apply.call(null, cljs.core.hash_map, map__9798__9799) : map__9798__9799;
      var validator__9801 = cljs.core._lookup.call(null, map__9798__9800, "\ufdd0'validator", null);
      var meta__9802 = cljs.core._lookup.call(null, map__9798__9800, "\ufdd0'meta", null);
      return new cljs.core.Atom(x, meta__9802, validator__9801, null)
    };
    var G__9803 = function(x, var_args) {
      var p__9792 = null;
      if(goog.isDef(var_args)) {
        p__9792 = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__9803__delegate.call(this, x, p__9792)
    };
    G__9803.cljs$lang$maxFixedArity = 1;
    G__9803.cljs$lang$applyTo = function(arglist__9804) {
      var x = cljs.core.first(arglist__9804);
      var p__9792 = cljs.core.rest(arglist__9804);
      return G__9803__delegate(x, p__9792)
    };
    G__9803.cljs$lang$arity$variadic = G__9803__delegate;
    return G__9803
  }();
  atom = function(x, var_args) {
    var p__9792 = var_args;
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
  var temp__3974__auto____9808 = a.validator;
  if(cljs.core.truth_(temp__3974__auto____9808)) {
    var validate__9809 = temp__3974__auto____9808;
    if(cljs.core.truth_(validate__9809.call(null, new_value))) {
    }else {
      throw new Error([cljs.core.str("Assert failed: "), cljs.core.str("Validator rejected reference state"), cljs.core.str("\n"), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'validate", "\ufdd1'new-value"), cljs.core.hash_map("\ufdd0'line", 6440))))].join(""));
    }
  }else {
  }
  var old_value__9810 = a.state;
  a.state = new_value;
  cljs.core._notify_watches.call(null, a, old_value__9810, new_value);
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
    var G__9811__delegate = function(a, f, x, y, z, more) {
      return cljs.core.reset_BANG_.call(null, a, cljs.core.apply.call(null, f, a.state, x, y, z, more))
    };
    var G__9811 = function(a, f, x, y, z, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 5), 0)
      }
      return G__9811__delegate.call(this, a, f, x, y, z, more)
    };
    G__9811.cljs$lang$maxFixedArity = 5;
    G__9811.cljs$lang$applyTo = function(arglist__9812) {
      var a = cljs.core.first(arglist__9812);
      var f = cljs.core.first(cljs.core.next(arglist__9812));
      var x = cljs.core.first(cljs.core.next(cljs.core.next(arglist__9812)));
      var y = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__9812))));
      var z = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(cljs.core.next(arglist__9812)))));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(cljs.core.next(arglist__9812)))));
      return G__9811__delegate(a, f, x, y, z, more)
    };
    G__9811.cljs$lang$arity$variadic = G__9811__delegate;
    return G__9811
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
  alter_meta_BANG_.cljs$lang$applyTo = function(arglist__9813) {
    var iref = cljs.core.first(arglist__9813);
    var f = cljs.core.first(cljs.core.next(arglist__9813));
    var args = cljs.core.rest(cljs.core.next(arglist__9813));
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
  var this__9814 = this;
  return(new cljs.core.Keyword("\ufdd0'done")).call(null, cljs.core.deref.call(null, this__9814.state))
};
cljs.core.Delay.prototype.cljs$core$IDeref$_deref$arity$1 = function(_) {
  var this__9815 = this;
  return(new cljs.core.Keyword("\ufdd0'value")).call(null, cljs.core.swap_BANG_.call(null, this__9815.state, function(p__9816) {
    var map__9817__9818 = p__9816;
    var map__9817__9819 = cljs.core.seq_QMARK_.call(null, map__9817__9818) ? cljs.core.apply.call(null, cljs.core.hash_map, map__9817__9818) : map__9817__9818;
    var curr_state__9820 = map__9817__9819;
    var done__9821 = cljs.core._lookup.call(null, map__9817__9819, "\ufdd0'done", null);
    if(cljs.core.truth_(done__9821)) {
      return curr_state__9820
    }else {
      return cljs.core.ObjMap.fromObject(["\ufdd0'done", "\ufdd0'value"], {"\ufdd0'done":true, "\ufdd0'value":this__9815.f.call(null)})
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
    var map__9842__9843 = options;
    var map__9842__9844 = cljs.core.seq_QMARK_.call(null, map__9842__9843) ? cljs.core.apply.call(null, cljs.core.hash_map, map__9842__9843) : map__9842__9843;
    var keywordize_keys__9845 = cljs.core._lookup.call(null, map__9842__9844, "\ufdd0'keywordize-keys", null);
    var keyfn__9846 = cljs.core.truth_(keywordize_keys__9845) ? cljs.core.keyword : cljs.core.str;
    var f__9861 = function thisfn(x) {
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
                var iter__2464__auto____9860 = function iter__9854(s__9855) {
                  return new cljs.core.LazySeq(null, false, function() {
                    var s__9855__9858 = s__9855;
                    while(true) {
                      if(cljs.core.seq.call(null, s__9855__9858)) {
                        var k__9859 = cljs.core.first.call(null, s__9855__9858);
                        return cljs.core.cons.call(null, cljs.core.PersistentVector.fromArray([keyfn__9846.call(null, k__9859), thisfn.call(null, x[k__9859])], true), iter__9854.call(null, cljs.core.rest.call(null, s__9855__9858)))
                      }else {
                        return null
                      }
                      break
                    }
                  }, null)
                };
                return iter__2464__auto____9860.call(null, cljs.core.js_keys.call(null, x))
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
    return f__9861.call(null, x)
  };
  var js__GT_clj = function(x, var_args) {
    var options = null;
    if(goog.isDef(var_args)) {
      options = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return js__GT_clj__delegate.call(this, x, options)
  };
  js__GT_clj.cljs$lang$maxFixedArity = 1;
  js__GT_clj.cljs$lang$applyTo = function(arglist__9862) {
    var x = cljs.core.first(arglist__9862);
    var options = cljs.core.rest(arglist__9862);
    return js__GT_clj__delegate(x, options)
  };
  js__GT_clj.cljs$lang$arity$variadic = js__GT_clj__delegate;
  return js__GT_clj
}();
cljs.core.memoize = function memoize(f) {
  var mem__9867 = cljs.core.atom.call(null, cljs.core.ObjMap.EMPTY);
  return function() {
    var G__9871__delegate = function(args) {
      var temp__3971__auto____9868 = cljs.core._lookup.call(null, cljs.core.deref.call(null, mem__9867), args, null);
      if(cljs.core.truth_(temp__3971__auto____9868)) {
        var v__9869 = temp__3971__auto____9868;
        return v__9869
      }else {
        var ret__9870 = cljs.core.apply.call(null, f, args);
        cljs.core.swap_BANG_.call(null, mem__9867, cljs.core.assoc, args, ret__9870);
        return ret__9870
      }
    };
    var G__9871 = function(var_args) {
      var args = null;
      if(goog.isDef(var_args)) {
        args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
      }
      return G__9871__delegate.call(this, args)
    };
    G__9871.cljs$lang$maxFixedArity = 0;
    G__9871.cljs$lang$applyTo = function(arglist__9872) {
      var args = cljs.core.seq(arglist__9872);
      return G__9871__delegate(args)
    };
    G__9871.cljs$lang$arity$variadic = G__9871__delegate;
    return G__9871
  }()
};
cljs.core.trampoline = function() {
  var trampoline = null;
  var trampoline__1 = function(f) {
    while(true) {
      var ret__9874 = f.call(null);
      if(cljs.core.fn_QMARK_.call(null, ret__9874)) {
        var G__9875 = ret__9874;
        f = G__9875;
        continue
      }else {
        return ret__9874
      }
      break
    }
  };
  var trampoline__2 = function() {
    var G__9876__delegate = function(f, args) {
      return trampoline.call(null, function() {
        return cljs.core.apply.call(null, f, args)
      })
    };
    var G__9876 = function(f, var_args) {
      var args = null;
      if(goog.isDef(var_args)) {
        args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__9876__delegate.call(this, f, args)
    };
    G__9876.cljs$lang$maxFixedArity = 1;
    G__9876.cljs$lang$applyTo = function(arglist__9877) {
      var f = cljs.core.first(arglist__9877);
      var args = cljs.core.rest(arglist__9877);
      return G__9876__delegate(f, args)
    };
    G__9876.cljs$lang$arity$variadic = G__9876__delegate;
    return G__9876
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
    var k__9879 = f.call(null, x);
    return cljs.core.assoc.call(null, ret, k__9879, cljs.core.conj.call(null, cljs.core._lookup.call(null, ret, k__9879, cljs.core.PersistentVector.EMPTY), x))
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
    var or__3824__auto____9888 = cljs.core._EQ_.call(null, child, parent);
    if(or__3824__auto____9888) {
      return or__3824__auto____9888
    }else {
      var or__3824__auto____9889 = cljs.core.contains_QMARK_.call(null, (new cljs.core.Keyword("\ufdd0'ancestors")).call(null, h).call(null, child), parent);
      if(or__3824__auto____9889) {
        return or__3824__auto____9889
      }else {
        var and__3822__auto____9890 = cljs.core.vector_QMARK_.call(null, parent);
        if(and__3822__auto____9890) {
          var and__3822__auto____9891 = cljs.core.vector_QMARK_.call(null, child);
          if(and__3822__auto____9891) {
            var and__3822__auto____9892 = cljs.core.count.call(null, parent) === cljs.core.count.call(null, child);
            if(and__3822__auto____9892) {
              var ret__9893 = true;
              var i__9894 = 0;
              while(true) {
                if(function() {
                  var or__3824__auto____9895 = cljs.core.not.call(null, ret__9893);
                  if(or__3824__auto____9895) {
                    return or__3824__auto____9895
                  }else {
                    return i__9894 === cljs.core.count.call(null, parent)
                  }
                }()) {
                  return ret__9893
                }else {
                  var G__9896 = isa_QMARK_.call(null, h, child.call(null, i__9894), parent.call(null, i__9894));
                  var G__9897 = i__9894 + 1;
                  ret__9893 = G__9896;
                  i__9894 = G__9897;
                  continue
                }
                break
              }
            }else {
              return and__3822__auto____9892
            }
          }else {
            return and__3822__auto____9891
          }
        }else {
          return and__3822__auto____9890
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
    var tp__9906 = (new cljs.core.Keyword("\ufdd0'parents")).call(null, h);
    var td__9907 = (new cljs.core.Keyword("\ufdd0'descendants")).call(null, h);
    var ta__9908 = (new cljs.core.Keyword("\ufdd0'ancestors")).call(null, h);
    var tf__9909 = function(m, source, sources, target, targets) {
      return cljs.core.reduce.call(null, function(ret, k) {
        return cljs.core.assoc.call(null, ret, k, cljs.core.reduce.call(null, cljs.core.conj, cljs.core._lookup.call(null, targets, k, cljs.core.PersistentHashSet.EMPTY), cljs.core.cons.call(null, target, targets.call(null, target))))
      }, m, cljs.core.cons.call(null, source, sources.call(null, source)))
    };
    var or__3824__auto____9910 = cljs.core.contains_QMARK_.call(null, tp__9906.call(null, tag), parent) ? null : function() {
      if(cljs.core.contains_QMARK_.call(null, ta__9908.call(null, tag), parent)) {
        throw new Error([cljs.core.str(tag), cljs.core.str("already has"), cljs.core.str(parent), cljs.core.str("as ancestor")].join(""));
      }else {
      }
      if(cljs.core.contains_QMARK_.call(null, ta__9908.call(null, parent), tag)) {
        throw new Error([cljs.core.str("Cyclic derivation:"), cljs.core.str(parent), cljs.core.str("has"), cljs.core.str(tag), cljs.core.str("as ancestor")].join(""));
      }else {
      }
      return cljs.core.ObjMap.fromObject(["\ufdd0'parents", "\ufdd0'ancestors", "\ufdd0'descendants"], {"\ufdd0'parents":cljs.core.assoc.call(null, (new cljs.core.Keyword("\ufdd0'parents")).call(null, h), tag, cljs.core.conj.call(null, cljs.core._lookup.call(null, tp__9906, tag, cljs.core.PersistentHashSet.EMPTY), parent)), "\ufdd0'ancestors":tf__9909.call(null, (new cljs.core.Keyword("\ufdd0'ancestors")).call(null, h), tag, td__9907, parent, ta__9908), "\ufdd0'descendants":tf__9909.call(null, (new cljs.core.Keyword("\ufdd0'descendants")).call(null, 
      h), parent, ta__9908, tag, td__9907)})
    }();
    if(cljs.core.truth_(or__3824__auto____9910)) {
      return or__3824__auto____9910
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
    var parentMap__9915 = (new cljs.core.Keyword("\ufdd0'parents")).call(null, h);
    var childsParents__9916 = cljs.core.truth_(parentMap__9915.call(null, tag)) ? cljs.core.disj.call(null, parentMap__9915.call(null, tag), parent) : cljs.core.PersistentHashSet.EMPTY;
    var newParents__9917 = cljs.core.truth_(cljs.core.not_empty.call(null, childsParents__9916)) ? cljs.core.assoc.call(null, parentMap__9915, tag, childsParents__9916) : cljs.core.dissoc.call(null, parentMap__9915, tag);
    var deriv_seq__9918 = cljs.core.flatten.call(null, cljs.core.map.call(null, function(p1__9898_SHARP_) {
      return cljs.core.cons.call(null, cljs.core.first.call(null, p1__9898_SHARP_), cljs.core.interpose.call(null, cljs.core.first.call(null, p1__9898_SHARP_), cljs.core.second.call(null, p1__9898_SHARP_)))
    }, cljs.core.seq.call(null, newParents__9917)));
    if(cljs.core.contains_QMARK_.call(null, parentMap__9915.call(null, tag), parent)) {
      return cljs.core.reduce.call(null, function(p1__9899_SHARP_, p2__9900_SHARP_) {
        return cljs.core.apply.call(null, cljs.core.derive, p1__9899_SHARP_, p2__9900_SHARP_)
      }, cljs.core.make_hierarchy.call(null), cljs.core.partition.call(null, 2, deriv_seq__9918))
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
  var xprefs__9926 = cljs.core.deref.call(null, prefer_table).call(null, x);
  var or__3824__auto____9928 = cljs.core.truth_(function() {
    var and__3822__auto____9927 = xprefs__9926;
    if(cljs.core.truth_(and__3822__auto____9927)) {
      return xprefs__9926.call(null, y)
    }else {
      return and__3822__auto____9927
    }
  }()) ? true : null;
  if(cljs.core.truth_(or__3824__auto____9928)) {
    return or__3824__auto____9928
  }else {
    var or__3824__auto____9930 = function() {
      var ps__9929 = cljs.core.parents.call(null, y);
      while(true) {
        if(cljs.core.count.call(null, ps__9929) > 0) {
          if(cljs.core.truth_(prefers_STAR_.call(null, x, cljs.core.first.call(null, ps__9929), prefer_table))) {
          }else {
          }
          var G__9933 = cljs.core.rest.call(null, ps__9929);
          ps__9929 = G__9933;
          continue
        }else {
          return null
        }
        break
      }
    }();
    if(cljs.core.truth_(or__3824__auto____9930)) {
      return or__3824__auto____9930
    }else {
      var or__3824__auto____9932 = function() {
        var ps__9931 = cljs.core.parents.call(null, x);
        while(true) {
          if(cljs.core.count.call(null, ps__9931) > 0) {
            if(cljs.core.truth_(prefers_STAR_.call(null, cljs.core.first.call(null, ps__9931), y, prefer_table))) {
            }else {
            }
            var G__9934 = cljs.core.rest.call(null, ps__9931);
            ps__9931 = G__9934;
            continue
          }else {
            return null
          }
          break
        }
      }();
      if(cljs.core.truth_(or__3824__auto____9932)) {
        return or__3824__auto____9932
      }else {
        return false
      }
    }
  }
};
cljs.core.dominates = function dominates(x, y, prefer_table) {
  var or__3824__auto____9936 = cljs.core.prefers_STAR_.call(null, x, y, prefer_table);
  if(cljs.core.truth_(or__3824__auto____9936)) {
    return or__3824__auto____9936
  }else {
    return cljs.core.isa_QMARK_.call(null, x, y)
  }
};
cljs.core.find_and_cache_best_method = function find_and_cache_best_method(name, dispatch_val, hierarchy, method_table, prefer_table, method_cache, cached_hierarchy) {
  var best_entry__9954 = cljs.core.reduce.call(null, function(be, p__9946) {
    var vec__9947__9948 = p__9946;
    var k__9949 = cljs.core.nth.call(null, vec__9947__9948, 0, null);
    var ___9950 = cljs.core.nth.call(null, vec__9947__9948, 1, null);
    var e__9951 = vec__9947__9948;
    if(cljs.core.isa_QMARK_.call(null, dispatch_val, k__9949)) {
      var be2__9953 = cljs.core.truth_(function() {
        var or__3824__auto____9952 = be == null;
        if(or__3824__auto____9952) {
          return or__3824__auto____9952
        }else {
          return cljs.core.dominates.call(null, k__9949, cljs.core.first.call(null, be), prefer_table)
        }
      }()) ? e__9951 : be;
      if(cljs.core.truth_(cljs.core.dominates.call(null, cljs.core.first.call(null, be2__9953), k__9949, prefer_table))) {
      }else {
        throw new Error([cljs.core.str("Multiple methods in multimethod '"), cljs.core.str(name), cljs.core.str("' match dispatch value: "), cljs.core.str(dispatch_val), cljs.core.str(" -> "), cljs.core.str(k__9949), cljs.core.str(" and "), cljs.core.str(cljs.core.first.call(null, be2__9953)), cljs.core.str(", and neither is preferred")].join(""));
      }
      return be2__9953
    }else {
      return be
    }
  }, null, cljs.core.deref.call(null, method_table));
  if(cljs.core.truth_(best_entry__9954)) {
    if(cljs.core._EQ_.call(null, cljs.core.deref.call(null, cached_hierarchy), cljs.core.deref.call(null, hierarchy))) {
      cljs.core.swap_BANG_.call(null, method_cache, cljs.core.assoc, dispatch_val, cljs.core.second.call(null, best_entry__9954));
      return cljs.core.second.call(null, best_entry__9954)
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
    var and__3822__auto____9959 = mf;
    if(and__3822__auto____9959) {
      return mf.cljs$core$IMultiFn$_reset$arity$1
    }else {
      return and__3822__auto____9959
    }
  }()) {
    return mf.cljs$core$IMultiFn$_reset$arity$1(mf)
  }else {
    var x__2365__auto____9960 = mf == null ? null : mf;
    return function() {
      var or__3824__auto____9961 = cljs.core._reset[goog.typeOf(x__2365__auto____9960)];
      if(or__3824__auto____9961) {
        return or__3824__auto____9961
      }else {
        var or__3824__auto____9962 = cljs.core._reset["_"];
        if(or__3824__auto____9962) {
          return or__3824__auto____9962
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-reset", mf);
        }
      }
    }().call(null, mf)
  }
};
cljs.core._add_method = function _add_method(mf, dispatch_val, method) {
  if(function() {
    var and__3822__auto____9967 = mf;
    if(and__3822__auto____9967) {
      return mf.cljs$core$IMultiFn$_add_method$arity$3
    }else {
      return and__3822__auto____9967
    }
  }()) {
    return mf.cljs$core$IMultiFn$_add_method$arity$3(mf, dispatch_val, method)
  }else {
    var x__2365__auto____9968 = mf == null ? null : mf;
    return function() {
      var or__3824__auto____9969 = cljs.core._add_method[goog.typeOf(x__2365__auto____9968)];
      if(or__3824__auto____9969) {
        return or__3824__auto____9969
      }else {
        var or__3824__auto____9970 = cljs.core._add_method["_"];
        if(or__3824__auto____9970) {
          return or__3824__auto____9970
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-add-method", mf);
        }
      }
    }().call(null, mf, dispatch_val, method)
  }
};
cljs.core._remove_method = function _remove_method(mf, dispatch_val) {
  if(function() {
    var and__3822__auto____9975 = mf;
    if(and__3822__auto____9975) {
      return mf.cljs$core$IMultiFn$_remove_method$arity$2
    }else {
      return and__3822__auto____9975
    }
  }()) {
    return mf.cljs$core$IMultiFn$_remove_method$arity$2(mf, dispatch_val)
  }else {
    var x__2365__auto____9976 = mf == null ? null : mf;
    return function() {
      var or__3824__auto____9977 = cljs.core._remove_method[goog.typeOf(x__2365__auto____9976)];
      if(or__3824__auto____9977) {
        return or__3824__auto____9977
      }else {
        var or__3824__auto____9978 = cljs.core._remove_method["_"];
        if(or__3824__auto____9978) {
          return or__3824__auto____9978
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-remove-method", mf);
        }
      }
    }().call(null, mf, dispatch_val)
  }
};
cljs.core._prefer_method = function _prefer_method(mf, dispatch_val, dispatch_val_y) {
  if(function() {
    var and__3822__auto____9983 = mf;
    if(and__3822__auto____9983) {
      return mf.cljs$core$IMultiFn$_prefer_method$arity$3
    }else {
      return and__3822__auto____9983
    }
  }()) {
    return mf.cljs$core$IMultiFn$_prefer_method$arity$3(mf, dispatch_val, dispatch_val_y)
  }else {
    var x__2365__auto____9984 = mf == null ? null : mf;
    return function() {
      var or__3824__auto____9985 = cljs.core._prefer_method[goog.typeOf(x__2365__auto____9984)];
      if(or__3824__auto____9985) {
        return or__3824__auto____9985
      }else {
        var or__3824__auto____9986 = cljs.core._prefer_method["_"];
        if(or__3824__auto____9986) {
          return or__3824__auto____9986
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-prefer-method", mf);
        }
      }
    }().call(null, mf, dispatch_val, dispatch_val_y)
  }
};
cljs.core._get_method = function _get_method(mf, dispatch_val) {
  if(function() {
    var and__3822__auto____9991 = mf;
    if(and__3822__auto____9991) {
      return mf.cljs$core$IMultiFn$_get_method$arity$2
    }else {
      return and__3822__auto____9991
    }
  }()) {
    return mf.cljs$core$IMultiFn$_get_method$arity$2(mf, dispatch_val)
  }else {
    var x__2365__auto____9992 = mf == null ? null : mf;
    return function() {
      var or__3824__auto____9993 = cljs.core._get_method[goog.typeOf(x__2365__auto____9992)];
      if(or__3824__auto____9993) {
        return or__3824__auto____9993
      }else {
        var or__3824__auto____9994 = cljs.core._get_method["_"];
        if(or__3824__auto____9994) {
          return or__3824__auto____9994
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-get-method", mf);
        }
      }
    }().call(null, mf, dispatch_val)
  }
};
cljs.core._methods = function _methods(mf) {
  if(function() {
    var and__3822__auto____9999 = mf;
    if(and__3822__auto____9999) {
      return mf.cljs$core$IMultiFn$_methods$arity$1
    }else {
      return and__3822__auto____9999
    }
  }()) {
    return mf.cljs$core$IMultiFn$_methods$arity$1(mf)
  }else {
    var x__2365__auto____10000 = mf == null ? null : mf;
    return function() {
      var or__3824__auto____10001 = cljs.core._methods[goog.typeOf(x__2365__auto____10000)];
      if(or__3824__auto____10001) {
        return or__3824__auto____10001
      }else {
        var or__3824__auto____10002 = cljs.core._methods["_"];
        if(or__3824__auto____10002) {
          return or__3824__auto____10002
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-methods", mf);
        }
      }
    }().call(null, mf)
  }
};
cljs.core._prefers = function _prefers(mf) {
  if(function() {
    var and__3822__auto____10007 = mf;
    if(and__3822__auto____10007) {
      return mf.cljs$core$IMultiFn$_prefers$arity$1
    }else {
      return and__3822__auto____10007
    }
  }()) {
    return mf.cljs$core$IMultiFn$_prefers$arity$1(mf)
  }else {
    var x__2365__auto____10008 = mf == null ? null : mf;
    return function() {
      var or__3824__auto____10009 = cljs.core._prefers[goog.typeOf(x__2365__auto____10008)];
      if(or__3824__auto____10009) {
        return or__3824__auto____10009
      }else {
        var or__3824__auto____10010 = cljs.core._prefers["_"];
        if(or__3824__auto____10010) {
          return or__3824__auto____10010
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-prefers", mf);
        }
      }
    }().call(null, mf)
  }
};
cljs.core._dispatch = function _dispatch(mf, args) {
  if(function() {
    var and__3822__auto____10015 = mf;
    if(and__3822__auto____10015) {
      return mf.cljs$core$IMultiFn$_dispatch$arity$2
    }else {
      return and__3822__auto____10015
    }
  }()) {
    return mf.cljs$core$IMultiFn$_dispatch$arity$2(mf, args)
  }else {
    var x__2365__auto____10016 = mf == null ? null : mf;
    return function() {
      var or__3824__auto____10017 = cljs.core._dispatch[goog.typeOf(x__2365__auto____10016)];
      if(or__3824__auto____10017) {
        return or__3824__auto____10017
      }else {
        var or__3824__auto____10018 = cljs.core._dispatch["_"];
        if(or__3824__auto____10018) {
          return or__3824__auto____10018
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-dispatch", mf);
        }
      }
    }().call(null, mf, args)
  }
};
cljs.core.do_dispatch = function do_dispatch(mf, dispatch_fn, args) {
  var dispatch_val__10021 = cljs.core.apply.call(null, dispatch_fn, args);
  var target_fn__10022 = cljs.core._get_method.call(null, mf, dispatch_val__10021);
  if(cljs.core.truth_(target_fn__10022)) {
  }else {
    throw new Error([cljs.core.str("No method in multimethod '"), cljs.core.str(cljs.core.name), cljs.core.str("' for dispatch value: "), cljs.core.str(dispatch_val__10021)].join(""));
  }
  return cljs.core.apply.call(null, target_fn__10022, args)
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
  var this__10023 = this;
  return goog.getUid(this$)
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_reset$arity$1 = function(mf) {
  var this__10024 = this;
  cljs.core.swap_BANG_.call(null, this__10024.method_table, function(mf) {
    return cljs.core.ObjMap.EMPTY
  });
  cljs.core.swap_BANG_.call(null, this__10024.method_cache, function(mf) {
    return cljs.core.ObjMap.EMPTY
  });
  cljs.core.swap_BANG_.call(null, this__10024.prefer_table, function(mf) {
    return cljs.core.ObjMap.EMPTY
  });
  cljs.core.swap_BANG_.call(null, this__10024.cached_hierarchy, function(mf) {
    return null
  });
  return mf
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_add_method$arity$3 = function(mf, dispatch_val, method) {
  var this__10025 = this;
  cljs.core.swap_BANG_.call(null, this__10025.method_table, cljs.core.assoc, dispatch_val, method);
  cljs.core.reset_cache.call(null, this__10025.method_cache, this__10025.method_table, this__10025.cached_hierarchy, this__10025.hierarchy);
  return mf
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_remove_method$arity$2 = function(mf, dispatch_val) {
  var this__10026 = this;
  cljs.core.swap_BANG_.call(null, this__10026.method_table, cljs.core.dissoc, dispatch_val);
  cljs.core.reset_cache.call(null, this__10026.method_cache, this__10026.method_table, this__10026.cached_hierarchy, this__10026.hierarchy);
  return mf
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_get_method$arity$2 = function(mf, dispatch_val) {
  var this__10027 = this;
  if(cljs.core._EQ_.call(null, cljs.core.deref.call(null, this__10027.cached_hierarchy), cljs.core.deref.call(null, this__10027.hierarchy))) {
  }else {
    cljs.core.reset_cache.call(null, this__10027.method_cache, this__10027.method_table, this__10027.cached_hierarchy, this__10027.hierarchy)
  }
  var temp__3971__auto____10028 = cljs.core.deref.call(null, this__10027.method_cache).call(null, dispatch_val);
  if(cljs.core.truth_(temp__3971__auto____10028)) {
    var target_fn__10029 = temp__3971__auto____10028;
    return target_fn__10029
  }else {
    var temp__3971__auto____10030 = cljs.core.find_and_cache_best_method.call(null, this__10027.name, dispatch_val, this__10027.hierarchy, this__10027.method_table, this__10027.prefer_table, this__10027.method_cache, this__10027.cached_hierarchy);
    if(cljs.core.truth_(temp__3971__auto____10030)) {
      var target_fn__10031 = temp__3971__auto____10030;
      return target_fn__10031
    }else {
      return cljs.core.deref.call(null, this__10027.method_table).call(null, this__10027.default_dispatch_val)
    }
  }
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_prefer_method$arity$3 = function(mf, dispatch_val_x, dispatch_val_y) {
  var this__10032 = this;
  if(cljs.core.truth_(cljs.core.prefers_STAR_.call(null, dispatch_val_x, dispatch_val_y, this__10032.prefer_table))) {
    throw new Error([cljs.core.str("Preference conflict in multimethod '"), cljs.core.str(this__10032.name), cljs.core.str("': "), cljs.core.str(dispatch_val_y), cljs.core.str(" is already preferred to "), cljs.core.str(dispatch_val_x)].join(""));
  }else {
  }
  cljs.core.swap_BANG_.call(null, this__10032.prefer_table, function(old) {
    return cljs.core.assoc.call(null, old, dispatch_val_x, cljs.core.conj.call(null, cljs.core._lookup.call(null, old, dispatch_val_x, cljs.core.PersistentHashSet.EMPTY), dispatch_val_y))
  });
  return cljs.core.reset_cache.call(null, this__10032.method_cache, this__10032.method_table, this__10032.cached_hierarchy, this__10032.hierarchy)
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_methods$arity$1 = function(mf) {
  var this__10033 = this;
  return cljs.core.deref.call(null, this__10033.method_table)
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_prefers$arity$1 = function(mf) {
  var this__10034 = this;
  return cljs.core.deref.call(null, this__10034.prefer_table)
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_dispatch$arity$2 = function(mf, args) {
  var this__10035 = this;
  return cljs.core.do_dispatch.call(null, mf, this__10035.dispatch_fn, args)
};
cljs.core.MultiFn;
cljs.core.MultiFn.prototype.call = function() {
  var G__10037__delegate = function(_, args) {
    var self__10036 = this;
    return cljs.core._dispatch.call(null, self__10036, args)
  };
  var G__10037 = function(_, var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return G__10037__delegate.call(this, _, args)
  };
  G__10037.cljs$lang$maxFixedArity = 1;
  G__10037.cljs$lang$applyTo = function(arglist__10038) {
    var _ = cljs.core.first(arglist__10038);
    var args = cljs.core.rest(arglist__10038);
    return G__10037__delegate(_, args)
  };
  G__10037.cljs$lang$arity$variadic = G__10037__delegate;
  return G__10037
}();
cljs.core.MultiFn.prototype.apply = function(_, args) {
  var self__10039 = this;
  return cljs.core._dispatch.call(null, self__10039, args)
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
  var this__10040 = this;
  return goog.string.hashCode(cljs.core.pr_str.call(null, this$))
};
cljs.core.UUID.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(_10042, _) {
  var this__10041 = this;
  return cljs.core.list.call(null, [cljs.core.str('#uuid "'), cljs.core.str(this__10041.uuid), cljs.core.str('"')].join(""))
};
cljs.core.UUID.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(_, other) {
  var this__10043 = this;
  var and__3822__auto____10044 = cljs.core.instance_QMARK_.call(null, cljs.core.UUID, other);
  if(and__3822__auto____10044) {
    return this__10043.uuid === other.uuid
  }else {
    return and__3822__auto____10044
  }
};
cljs.core.UUID.prototype.toString = function() {
  var this__10045 = this;
  var this__10046 = this;
  return cljs.core.pr_str.call(null, this__10046)
};
cljs.core.UUID;
goog.provide("yapin.global");
goog.require("cljs.core");
yapin.global.find_bookmarks = function find_bookmarks(criteria) {
  return cljs.core.PersistentVector.fromArray([cljs.core.ObjMap.fromObject(["\ufdd0'title", "\ufdd0'url", "\ufdd0'description", "\ufdd0'tags"], {"\ufdd0'title":"DailyCred", "\ufdd0'url":"https://www.dailycred.com/", "\ufdd0'description":"Social Authentication Done Right", "\ufdd0'tags":cljs.core.PersistentVector.fromArray(["api", "service"], true)})], true)
};
goog.exportSymbol("yapin.global.find_bookmarks", yapin.global.find_bookmarks);
yapin.global.open_browser_window = function open_browser_window(url) {
  var window__6105 = safari.application.openBrowserWindow();
  var tab__6106 = window__6105.activeTab;
  return tab__6106.url = url
};
yapin.global.handle_toolbar_item_clicked = function handle_toolbar_item_clicked(event) {
  if(cljs.core._EQ_.call(null, "black", event.command)) {
    alert("dispatched");
    alert(safari.application.activeBrowserWindow.activeTab.page);
    safari.application.activeBrowserWindow.activeTab.page.dispatchMessage("open-window", "test");
    return alert("there")
  }else {
    return null
  }
};
goog.exportSymbol("yapin.global.handle_toolbar_item_clicked", yapin.global.handle_toolbar_item_clicked);
