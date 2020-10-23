 /*\
 |*|
 |*|    JXON framework - Copyleft 2011 by Mozilla Developer Network
 |*|
 |*|    https://developer.mozilla.org/en-US/docs/JXON
 |*|
 |*|    This framework is released under the GNU Public License, version 3 or later.
 |*|    http://www.gnu.org/licenses/gpl-3.0-standalone.html
 |*|
 \*/

/*  CORRECTED AND ADDED: 20:12 2013-05-13
//	- array in array
//	- associative arrays ( Array with Object properties )
//	- functions as strings
//	- non XML tag-able names of properties
//	- builtToString
//	- unbuiltToString
*/ 
/*  CORRECTED AND ADDED: 12:20 2013-06-25
//	- parseText incorrect Date.parse recognize
*/ 

if (! String.prototype.hexDecode) {
	String.prototype.hexDecode = function(){
		var r='';
		for(var i=0;i<this.length;i+=2){
			r+=unescape('%'+this.substr(i,2));
		}
		return r;
	}
	String.prototype.hexEncode = function(){
		var r='';
		var i=0;
		var h;
		while(i<this.length){
			h=this.charCodeAt(i++).toString(16);
			while(h.length<2){
				h='0'+h;
			}
			r+=h;
		}return r;
	}
}
if (! String.prototype.utf8_to_b64) {
	String.prototype.utf8_to_b64 = function() {	//function utf8_to_b64( str ) {
		return window.btoa(unescape(encodeURIComponent( this /* str */ )));
	}
	String.prototype.b64_to_utf8 = function() {	//function b64_to_utf8( str ) {
		return decodeURIComponent(escape(window.atob( this /* str */ )));
	}
	//		"!?~éí=špä+úpo+\x01däúp" == b64_to_utf8(utf8_to_b64("!?~éí=špä+úpo+\x01däúp"));		//true
	//		"!?~éí=špä+úpo+\x01däúp" == ("!?~éí=špä+úpo+\x01däúp".utf8_to_b64()).b64_to_utf8();	//true
}

//	https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Working_with_Objects
//	for prop in obj
//	Object.keys(obj)
//	Object.getOwnPropertyNames(obj)
function listAllProperties(o){     
	var objectToInspect;     
	var result = [];
	
	for(objectToInspect = o; objectToInspect !== null; objectToInspect = Object.getPrototypeOf(objectToInspect)){  
		result = result.concat(Object.getOwnPropertyNames(objectToInspect));  
	}
	
	return result; 
}

///<class code="javascript" type="instanceClass">
///<desc> XML to JS object and back converter
/// primarnym cielom je konverzia Javascript objektov do XML-u,
/// a nasledne spracovanie XSLT prostriedkami, hlavne s moznostou 
/// pouzitia XPath ako o dost silnejsieho query jazyka miesto nahraziek ako JPath
///</desc>

// FOR NODEJS
if (typeof XMLSerializer === 'undefined') {
  XMLSerializer = require("xmldom").XMLSerializer;
  document = {};
  document.implementation = new (require("xmldom").DOMImplementation)();
}

(function(glob) {

	function EmptyTree () {}
	EmptyTree.prototype.toString = function () { return "null"; }; 
	EmptyTree.prototype.valueOf = function () { return null; };

	JXONo = function ( /*obj,*/ opts, fillMe ) {	// fillMe ... true ... opts object is filled by auto setted values 
		if (!(this instanceof JXONo)) {
			return new JXONo( /*obj,*/ opts, fillMe );
		}
		var p;
	//	this.obj = obj;
		this.aCache = [];
		this.circ_refs = [];
//maintain options
		if (fillMe) {
			this.opts = isObj(opts) ? opts : {};
		} else {
			this.opts = {};	if (isObj(opts)) { for (p in opts) { if (p != 's') { this.opts[p] = opts[p]; } } } ;
		}
		for(var prop in this.d) { 
			if ( ! isDef(this.opts[prop]) ) {
				this.opts[prop] = this.d[prop];
			}
		}
		if (fillMe) {
			this.opts.s = isObj(this.opts.s) ? this.opts.s :  {};
		} else {
			this.opts.s = {};	if (opts && isObj(opts.s)) { for (p in opts.s) { this.opts.s[p] = opts.s[p]; } } ;
		}
		for(var prop in this.s) { 
			if ( ! isDef(this.opts.s[prop]) ) {
				this.opts.s[prop] = this.s[prop];
			}
		}
	}
//#constants
	JXONo.CLBK_OBJECT_VALUE  = 0;
	JXONo.CLBK_OBJECT_PROPERTY_NAME = 1;
	JXONo.CLBK_OBJECT_ARRAY_INDEX = 2;
	JXONo.CLBK_ATTRIBUTE_VALUE = 3;
	JXONo.CLBK_RESULT_VALUE = 4;
	JXONo.CLBK_OBJECT_TEXT = 5;
	JXONo.CLBK_OBJECT_ARRAY_ORDERER = 6;

	JXONo.prototype = {
		s : {	// conversion setup 
			ValProp : "keyValue"
		,	AttrProp : "keyAttributes"
		,	AttrsPref : "@"
		,	ArrayItem : "item"
		,	AttribMarking : "__jsType"
		,	NonXmlNamePrefix : "_hexa64."	//,	sFunction = "function", 	//,	orderAttrib = "__jsOrder"
		,	NonXmlNumberNamePrefix : "_-"
		,	EmptyNodeVal : ""				//	/* put here the default value for empty nodes: */ true	
		,	HandlePrefixedNodes : false			// boolean ... handle prefixed Nodes or not		my option always TRUE (XHTML)
		,	EvaluateFunctions : false
		,	HTMLNodes : function(oParentObj) { return { html_elem : (typeof cssPath != "undefined") ? cssPath(oParentObj) : true }; }
		,	KnownObjectTypes : [ 
				"[object Undefined]"
			,	"[object Null]"
			,	"[object Object]"
			,	"[object Array]"
			,	"[object Boolean]"
			,	"[object Number]"
			,	"[object Function]"
			,	"[object Date]"
			,	"[object String]"
			]
        ,   positioning : '' // '__pos' ... every element obtains '__pos' attribute  
		}
	,	d : {	// default argument values
			traverseToLevel : 10
//arguments for xtoj conversion
		,	nVerbosity : 1
		,	bFreeze : false
		,	bNesteAttributes : false
		
		,	xtoj_callback : null
		,	xtoj_clbkArg : undefined
		,	xtoj_filterFnc : null
		,	acceptedSelectors : []
//arguments for jtox conversion
		,	bodyName : 'xml'
		,	namespace : null
		,	markTypes : false
		
		,	jtox_callback : null
		,	jtox_clbkArg : undefined
		,	jtox_filterFnc : null
		,	acceptedTagNames : []
		}

// xtoj
	,	parseText : function  (sValue) {
			var rIsNull = /^\s*$/
			,	rIsBool = /^(?:true|false)$/i
			;
			if (rIsNull.test(sValue)) { return null; }
			if (rIsBool.test(sValue)) { return (sValue.toLowerCase() === "true") }
//	// 010 je nakoniec cislo po JXONo , ALE TO NECHCEM , nenulove cisla NESMU zacinat nulou !!!
// a nula musi byt proste 0, alebo 0.0 !!!
			if (isFinite(sValue)) {	// always string ???
				var num = parseFloat(sValue)
				,   nn = true
				;
				//if ( !( (sValue[0]=='0') && (num != 0) ) ) {
				if ((num != 0) && (sValue[0]=='0') && (sValue[1]!='.')) {
					nn = false;
				}
				if (nn) {
					return num; 
				}
			}
			// Date.parse  '#000000' ... correct Date ??  '100%' ... correct Date ??  FAKE !!!
			if ( ! sValue.match(/(?:\s*\d+\s*\%)|(?:\s*\#\d+\s*)/)) {
				var regexIso8601 = /^(\d{4}|\+\d{6})(?:-(\d{2})(?:-(\d{2})(?:T(\d{2}):(\d{2}):(\d{2})\.(\d{1,})(Z|([\-+])(\d{2}):(\d{2}))?)?)?)?$/
				,	match
				;
// urobi ako Date aj BN.AI.405   DEBIL				if (isFinite(Date.parse(sValue))) { return new Date(sValue); }
				if (typeof sValue === "string" && (match = sValue.match(regexIso8601))) {
					var milliseconds = Date.parse(match[0]);
					if (!isNaN(milliseconds)) {
						return new Date(milliseconds);
					}
				}
			}
			return sValue;
		}
	,	objectify : function  (vVal) {
			return vVal === null ? new EmptyTree() : vVal instanceof Object ? vVal : new vVal.constructor(vVal);
		}
	,	createObjTree : function  (oParentNode, nVerb, bFreeze, bNesteAttr, callback, clbkArg) {
//maintain arguments:
		//	oParentNode = isDef(oParentNode) ? oParentNode : this.opts.oParentNode;
		//	nVerb = isDef(nVerb) ? nVerb : this.opts.nVerb;
			bFreeze = isDef(bFreeze) ? bFreeze : this.opts.bFreeze;
		//	bNesteAttr = isDef(bNesteAttr) ? bNesteAttr : this.opts.bNesteAttr;
			callback = isDef(callback) ? callback : this.opts.xtoj_callback;
			clbkArg = isDef(clbkArg) ? clbkArg : this.opts.xtoj_clbkArg;
			
			var	s = this.opts.s
			,	nLevelStart = this.aCache.length
			,	bChildren = oParentNode.hasChildNodes()
			,	bAttributes = oParentNode.hasAttributes ? oParentNode.hasAttributes() : false	// document has not method hasAttributes 
			,	bHighVerb = Boolean(nVerb & 2)
			,	writingO = true,	writingP = true,	writingT = true
			,	writing = true
			,	clbkFn = isFnc(callback) ? callback : null
			,	clbk
			,	handleClbk = function(state, item) {
/*# callback return meanings:
explicit: (ability set result object property to any value, NaN, Infinity, null, undefined TOO)
	undefined		continue traversal 					writing acording actual setup		dont change provided input
	NaN				stop traversal actual branch		------------
	object {	traverse: [true,false], write:[true,false], value : any	}
*/
					var clbk = clbkFn ? clbkFn( state, item,		oParentNode, nVerb, bFreeze, bNesteAttr, clbkArg) : undefined;
					if (isNan(clbk)) { return NaN; }	// enable block traversal by simple return NaN instead { traverse:false }
					if (isObj(clbk)) { 
						writing = (clbk.writing !== false);
						if (clbk.traverse === false) { return NaN; }
						return clbk.value;
					}
					return;		// = undefined
				}
			,	sProp
			,	vContent
			,	nLength = 0
			, 	sCollectedTxt = ""
			,	vResult = bHighVerb ? {} : s.EmptyNodeVal
			;
//#callback checked object VALUE		if don't want node at all ... return to upper layer
			if ( isNan(clbk = handleClbk(JXONo.CLBK_OBJECT_VALUE, oParentNode)) ) {	return; }
			else if (isDef(clbk)) {	oParentNode = clbk.value; }
			writingO = writing; writing = true;
	
			if (bChildren) {
				for (var oNode, nItem = 0; nItem < oParentNode.childNodes.length; nItem++) {
					oNode = oParentNode.childNodes.item(nItem);
					if (oNode.nodeType === 4) { sCollectedTxt += oNode.nodeValue; } /* nodeType is "CDATASection" (4) */
					else if (oNode.nodeType === 3) { sCollectedTxt += oNode.nodeValue.trim(); } /* nodeType is "Text" (3) */
					/*	We chose to ignore nodes which have a prefix (for example: <ding:dong>binnen</ding:dong>), 
					//	due to their special case (they are often used in order to represents an XML Schema, 
					//	which is meta-information concerning how to organize the information of the document, reserved for the XML parser). 
					//	You can include them removing the string && !oNode.prefix from our algorithms 
					//	(by doing so the whole tag will become the property name: { "ding:dong": "binnen" }).
					*/
					else if (oNode.nodeType === 1 && ( s.HandlePrefixedNodes || !oNode.prefix ) ) { this.aCache.push(oNode); } /* nodeType is "Element" (1) */
				}
			}
			var nLevelEnd = this.aCache.length
			,	vBuiltVal = this.parseText(sCollectedTxt)
			;
//#callback checked object TEXT (collected text nodes)		if don't want text ... simple clear vBuiltVal (! let vResult object create !)
			if ( isNan(clbk = handleClbk(JXONo.CLBK_OBJECT_TEXT, vBuiltVal)) ) {	vBuiltVal=""; }
			else if (isDef(clbk)) {	vBuiltVal = clbk; }
			writingT = writing; writing = true;
 
			if (!bHighVerb && (bChildren || bAttributes)) { vResult = nVerb === 0 ? this.objectify(vBuiltVal) : {}; }
 
			for (var nElId = nLevelStart, pos=0; nElId < nLevelEnd; nElId++, pos++) {
				sProp = this.aCache[nElId].nodeName;	// ????  .toLowerCase();
				if (sProp.indexOf(s.NonXmlNamePrefix) == 0) {
					sProp = (sProp.substr(s.NonXmlNamePrefix.length).hexDecode()).b64_to_utf8();
				}
				if (sProp.indexOf(s.NonXmlNumberNamePrefix) == 0) {
					sProp = sProp.substr(s.NonXmlNumberNamePrefix.length);
				}
//#callback checked object PROPERTY NAME		if don't want child ... continue with next child
				if ( isNan(clbk = handleClbk(JXONo.CLBK_OBJECT_PROPERTY_NAME, sProp)) ) {	continue; }
				else if (isDef(clbk)) {	sProp = clbk; }
				writingP = writing; writing = true;
				  
				vContent = this.createObjTree(this.aCache[nElId], nVerb, bFreeze, bNesteAttr, callback, clbkArg);
				if (isDef(vContent) && ( writingP || !isEmp(vContent) ) ) {  
					if (vContent && isStr(vContent) && vContent.substr(0,8) == "function") {
//simple function string parser and works good in case (comments are trimmed)
//  /*jkskdaklj*/ funtion(a,b,c) { if(a) { return b;} else { return c;} } /* }}}} */
//but have problems in embedded comments
//  /*jkskdaklj*/ funtion(a,/*a1,a2)*/b,c) /*{{{*/ { if(a) { return b;} else { return c;} } /* }}}} */
//SOLUTION is possible (with loose of comments) by (regexp)parcelator.js 
						if ( typeof parcelator != "undefined" ) {
							vContent = parcelator.prototype.oftenUsed.removeClikeComments.do(vContent);
						}
						var startBody = vContent.indexOf("{") + 1;
						var endBody = vContent.lastIndexOf("}");
						var startArgs = vContent.indexOf("(") + 1;
						var endArgs = vContent.indexOf(")");

						vContent = new Function(vContent.substring(startArgs, endArgs), vContent.substring(startBody, endBody));
					}
					if (!writingP) {
						sProp = s.ArrayItem;
					}
                    if (s.positioning) {
                        vContent[s.positioning] = pos;    //vContent.__pos = pos;
                    }
					if (sProp == s.ArrayItem) {
						if (vResult.constructor !== Array) {
							//special treatment for (item) array in array with potential associative array : 
							var arrClone = []; for (var k in vResult) { arrClone[k] = vResult[k]; }
							vResult = arrClone;
						}
						vResult.push(vContent);
					} 
					if (vResult.hasOwnProperty(sProp)) {
						if (vResult[sProp].constructor !== Array) { vResult[sProp] = [vResult[sProp]]; }
						vResult[sProp].push(vContent);
					} else {
						vResult[sProp] = vContent;
						nLength++;
					}
				}
			}
 
			if (writingO) {
				if (bAttributes) {
					var nAttrLen = oParentNode.attributes.length
					,	sAPrefix = bNesteAttr ? "" : s.AttrsPref
					,	oAttrParent = bNesteAttr ? {} : vResult
					;
					for (var oAttrib, tAttrib, nAttrib = 0; nAttrib < nAttrLen; nLength++, nAttrib++) {
						oAttrib = oParentNode.attributes.item(nAttrib);
//#callback checked object ATTRIBUTE VALUE
						if ( isNan(clbk = handleClbk(JXONo.CLBK_ATTRIBUTE_VALUE, oAttrib)) ) {	continue; }	// don't want ... continue to next attr
						else if (isDef(clbk)) {	oAttrib = clbk; }

						tAttrib = this.parseText(oAttrib.value.trim());
						if ( writing && (nAttrLen == 1) && (oAttrib.name == s.AttribMarking)) {
							switch(oAttrib.value.trim()) {
								case "undefined": vBuiltVal = undefined; break;
								case "null": vBuiltVal = null; break;
								case "boolean": vBuiltVal = !! vBuiltVal; break;
								case "number": vBuiltVal = Number(vBuiltVal); break;
								case "string": vBuiltVal = ""+vBuiltVal; break;
							}
							nLength = 0; sCollectedTxt = true;	// force !
							break;
						} else {
								if (writing) {	oAttrParent[sAPrefix + oAttrib.name] = tAttrib;	} 
						}
						writing = true;
					}

					if ( bNesteAttr && !isEmp(oAttrParent) ) {
						if (bFreeze) { Object.freeze(oAttrParent); }
						vResult[s.AttrProp] = oAttrParent;
						nLength -= nAttrLen - 1;
					}
				}

				if (nVerb === 3 || (nVerb === 2 || nVerb === 1 && nLength > 0) && sCollectedTxt) {
					vResult[s.ValProp] = vBuiltVal;
				} else if (!bHighVerb && nLength === 0 && sCollectedTxt) {
					vResult = vBuiltVal;
				}
			}

			if (bFreeze && (bHighVerb || nLength > 0)) { Object.freeze(vResult); }

			this.aCache.length = nLevelStart;

//#callback checked object RESULT VALUE ... last chance to change
			if ( isNan(clbk = handleClbk(JXONo.CLBK_RESULT_VALUE, vResult)) ) {	return; }
			else if (isDef(clbk)) {	vResult = clbk; }

			return writing ? vResult : undefined;

		}

// jtox
	,	checkCircDeps : function (oParentObj) {
			var s = this.s
			,	kt = getType(oParentObj)
			;
//html elements default extract from circ_refs, provide css selector !
			if (isNOD(oParentObj)) {
				//return { html_elem : (typeof cssPath != "undefined") ? cssPath(oParentObj) : true };
				return isFnc(s.HTMLNodes) ? s.HTMLNodes(oParentObj) : s.HTMLNodes;
			}
			if (s.KnownObjectTypes.indexOf(kt) == -1) {
				return { unknownObjectType : kt }
			}
//native code extract from circ_refs
			if (oParentObj.toString().match(/\{\s*\[native\s*code\]\s*\}\s*$/i)) {
				return oParentObj;
			}
			for (var i=0; i < this.circ_refs.length; i++) {
				if (this.circ_refs[i] === oParentObj) {
					return { circular : true };
				}
			}
			this.circ_refs.push(oParentObj);
			return oParentObj;
		}
	,	elementCreator : function ( sName, oXMLDoc, namespace ) {
			var oChild, s=this.opts.s;
			sName = (namespace == "http://www.w3.org/1999/xhtml" ? sName.toLowerCase() : sName);
			try {	//special treatment for XML not allowable names: 
				oChild = oXMLDoc.createElementNS( namespace, sName);
			} catch(e) {
				if (isFinite(sName) && isDef(s.NonXmlNumberNamePrefix)) {
					oChild = oXMLDoc.createElementNS( namespace, s.NonXmlNumberNamePrefix + sName );
				} else {
					oChild = oXMLDoc.createElementNS( namespace, s.NonXmlNamePrefix + (sName.utf8_to_b64()).hexEncode() );
				}
			}
			return oChild;
		}
	,	loadObjTree : function (oXMLDoc, oParentEl, oParentObj, markTypes, callback, clbkArg, level) {
			level = isNum(level) ? level : -1;
//if ( ! level) {	console.log(oParentObj);}
			if (++level > this.opts.traverseToLevel) {
				oParentEl.appendChild(oXMLDoc.createTextNode("traverseToLevel "+level+" reached"));
				return;
			}
//maintain arguments:
		//	oXMLDoc = isDef(oXMLDoc) ? oXMLDoc : this.opts.oXMLDoc;
		//	oParentEl = isDef(oParentEl) ? oParentEl : this.opts.oParentEl;
		//	oParentObj = isDef(oParentObj) ? oParentObj : this.opts.oParentObj;
			markTypes = isDef(markTypes) ? markTypes : this.opts.markTypes;
			callback = isDef(callback) ? callback : this.opts.jtox_callback;
			clbkArg = isDef(clbkArg) ? clbkArg : this.opts.jtox_clbkArg;

// callback can do anything with parameter, even modify them
			var	s = this.opts.s
			,	writing = isDef(writing) ? writing : true
			,	clbkFn = isFnc(callback) ? callback : null
			,	clbk
			,	handleClbk = function(state, item, detail) {
/* callback return meanings:
	undefined		continue traversal 					writing acording actual setup		dont change provided input
	-Infinity		continue traversal					stop writing actual branch			dont change provided input
	+Infinity		continue traversal					continue writing actual branch		dont change provided input
	NaN				stop traversal actual branch		------------
	any else		continue traversal 					continue writing					replace provided input value
*/
					var clbk = clbkFn ? clbkFn( state, item,				oXMLDoc, oParentEl, detail, markTypes, clbkArg) : undefined;
					if (clbk === +Infinity)	{	writing = true;		return;	}
					if (clbk === -Infinity)	{	writing = false;	return;	}
					return clbk;
				}
			;
//#callback checked object VALUE
			if ( isNan(clbk = handleClbk(JXONo.CLBK_OBJECT_VALUE, oParentObj, oParentObj)) ) {	return; }
			else if (isDef(clbk)) {	oParentNode = clbk; }
	
		//marking primitive types, object and array are implicit 
			var vValue, oChild;
/*	javascript typeof:	
	[ Type ]	[ Result ]
	Undefined	"undefined"
	Null		"object"
	Boolean		"boolean"
	Number		"number"
	String		"string"
//	Host object (provided by the JS environment)	Implementation-dependent
	Function object (implements [[Call]] in ECMA-262 terms)	"function"
//	E4X XML object		"xml"
//	E4X XMLList object	"xml"
	Any other object	"object"
*/
		// missing PRIMITIVES !!! are not OBJECT (instaceof)
			if (oParentObj == null) {	/* || oParentObj===false */		// undefined == null  TRUE !
				if (markTypes) { oParentEl.setAttribute( s.AttribMarking, typeof oParentObj ); }
				return;
			} else if (typeof oParentObj != "object") {
				if (markTypes) { oParentEl.setAttribute( s.AttribMarking, typeof oParentObj ); }
				oParentEl.appendChild(oXMLDoc.createTextNode(oParentObj.toString())); 
				if (typeof oParentObj != "function") {	// function ... continue
					return;
				}
			} else if (oParentObj instanceof String || oParentObj instanceof Number || oParentObj instanceof Boolean) {
				oParentEl.appendChild(oXMLDoc.createTextNode(oParentObj.toString())); /* verbosity level is 0 */
			} else if (oParentObj.constructor === Date) {
				oParentEl.appendChild(oXMLDoc.createTextNode(oParentObj.toGMTString()));
			}
			oParentObj = this.checkCircDeps(oParentObj);
			
			var pNamespace = oParentObj[this.s.AttrsPref+'xmlns'] || oParentEl.namespaceURI || null;	// exact or parent namespace
			
			//for (var sName in oParentObj) {	
//automatic or manual explicit interested properties specification ?
			var	sName, gOPNi, gOPD
		//	,	snames = Object.getOwnPropertyNames(JXONo)
			,	snames = []
			;
			for (var sName in oParentObj) {	snames.push(sName); }
// sem by sa hodila funkcia zarucujuca pozadovane poradie poloziek			
			var nOrder = handleClbk(JXONo.CLBK_OBJECT_ARRAY_ORDERER, snames, level);
			if (isArr(nOrder)) {
				snames = nOrder;
			}
			
			if ((typeof oParentObj == "function") && (oParentObj.prototype)) { 
				var cp = 0, ip; for (ip in oParentObj.prototype) { cp++; }
				if (cp) { snames.push('prototype'); }
			}
			
			for (gOPNi=0; gOPNi<snames.length; gOPNi++) { //(gOPNi in snames) {	
				sName = snames[gOPNi];
				gOPD = Object.getOwnPropertyDescriptor(oParentObj, sName);
/*
gOPD: Object
	configurable: true
	enumerable: true
	value: "3.0.0"
	writable: true
	__proto__: Object

gOPD: Object
	configurable: true
	enumerable: true
	value: Object
	writable: true
	__proto__: Object

gOPD: Object
	configurable: true
	enumerable: true
	value: function () {
	writable: true
	__proto__: Object

gOPD: Object
	configurable: true
	enumerable: true
	get: function () {
	set: function (a) {
	__proto__: Object

*/
//#callback checked object PROPERTY NAME
				if ( isNan(clbk = handleClbk(JXONo.CLBK_OBJECT_PROPERTY_NAME, sName, oParentObj)) ) {	continue; }
				else if (isDef(clbk)) {	sName = clbk; }

				if ( ! gOPD ) { 
					vValue = sName;
				} else {
					try { 
			//			if (gOPD && isDef(gOPD.set)) { ???? }
						if (gOPD && isDef(gOPD.get)) {
							vValue = gOPD.get.toString();	// getter function string
						} else {
							vValue = oParentObj[sName];	// HTML elements: "An attempt was made to use an object that is not, or is no longer, usable."
						}
					} catch(e) {	//	console.log(e.stack);	debugger;		
						continue;
					}
				}
				//array in array ... continue ? !!      if (isFinite(sName) || vValue instanceof Function) { continue; } /* verbosity level is 0 */
				if ( isFinite(sName) && isArr(oParentObj) ) {
					oChild = this.elementCreator(s.ArrayItem, oXMLDoc, pNamespace, level);
					this.loadObjTree(oXMLDoc, oChild, vValue, markTypes, callback, clbkArg, level);
					oParentEl.appendChild(oChild);
					continue;
				}
				if (vValue instanceof Function && s.EvaluateFunctions) { 
					vValue = vValue();	//.toString();
				} 

				if (sName === s.ValProp) {
					if (vValue !== null && vValue !== true) {
						oParentEl.appendChild(oXMLDoc.createTextNode(vValue.constructor === Date ? vValue.toGMTString() : String(vValue)));
					}
				} else if (sName === s.AttrProp) { /* verbosity level is 3 */
					for (var sAttrib in vValue) { 
						oParentEl.setAttribute(sAttrib, vValue[sAttrib]); 
					}
				} else if (sName.charAt(0) === s.AttrsPref) {
					oParentEl.setAttribute(sName.slice(1), vValue);
				} else if (vValue && vValue.constructor === Array) {
					//special treatment for associative array : 
					var arrClone = {}
					,	arrCount = 0
					; 
					for (var k in vValue) { 
						arrClone[k] = vValue[k]; arrCount++; 
					}
					if ( ! arrCount) {	// treat empty array
						oChild = this.elementCreator(sName, oXMLDoc, pNamespace);
						oParentEl.appendChild(oChild);
					}
					for (var nItem = 0; nItem < vValue.length; nItem++) {
						delete arrClone[nItem]; 
						arrCount--;
//callback checked object ARRAY INDEX					!!! vValue instead oParentObj !!!
						if ( isNan(clbk = handleClbk(JXONo.CLBK_OBJECT_ARRAY_INDEX, nItem, vValue)) ) {	continue; }
						else if (isDef(clbk)) {	nItem = clbk; }

						oChild = this.elementCreator(sName, oXMLDoc, pNamespace);
						this.loadObjTree(oXMLDoc, oChild, vValue[nItem], markTypes, callback, clbkArg, level);
						oParentEl.appendChild(oChild);
					}
					if (arrCount) {
						this.loadObjTree(oXMLDoc, oParentEl, arrClone, markTypes, callback, clbkArg, level);
					}
				} else {
					oChild = this.elementCreator(sName, oXMLDoc, pNamespace);
					this.loadObjTree(oXMLDoc, oChild, vValue, markTypes, callback, clbkArg, level);	// SOLVE PRIMITIVES 
					oParentEl.appendChild(oChild);
				}
			}
		}


///<functions prog="javascipt" level="classProperty" title="JS Object to XML convertor">
///xtoj, xtojText
///<desc> 
///</desc>
///<example>
/// tabxx = JXONo.xtoj($0/*some table*/, 1,false,false, function(inf, obj){console.log(inf, obj);})
///</example>
///<example>
/// tabxx = JXONo.xtoj($0, 1,false,false, function(inf, vec, obj){if (inf==4){console.log(inf, vec, obj); vec.__reference=obj;}})
///</example>
	,	xtoj : function (	oXMLParent
				,	nVerbosity /* optional */, bFreeze /* optional */, bNesteAttributes /* optional */
				,	callback, clbkArg
			) {
//maintain arguments:
			nVerbosity = isDef(nVerbosity) ? nVerbosity : this.opts.nVerbosity;
			var nVerbMask = (isNum(nVerbosity) ? nVerbosity : this.d.nVerbosity) & 3;
			bNesteAttributes = isDef(bNesteAttributes) ? bNesteAttributes : ((nVerbMask === 3) ? true : this.opts.bNesteAttributes);

			//var nVerbMask = arguments.length > 1 && typeof nVerbosity === "number" ? nVerbosity & 3 : /* put here the default verbosity level: */ 1;
			//return this.createObjTree(oXMLParent, nVerbMask, bFreeze || false, arguments.length > 3 ? bNesteAttributes : nVerbMask === 3, callback, clbkArg);
			return this.createObjTree(oXMLParent, nVerbMask, bFreeze, bNesteAttributes, callback, clbkArg);
		}
	,	xtojText : function (	oXMLParent
				,	nVerbosity /* optional */, bFreeze /* optional */, bNesteAttributes /* optional */
				,	ufnc /* optional */, space /* optional */	// user defined function(key,value), pretty print  	
				,	callback, clbkArg
				) {
			var obj = this.xtoj (oXMLParent, nVerbosity, bFreeze, bNesteAttributes, callback, clbkArg);
//ALERT, ACHTUNG, WARNING !!!  JSON.stringiify  work ONLY with VALID JSON --- NONE associative Arrays !!!!
			return JSON.stringify(obj,function(key, value){
					var preVal = ( typeof ufnc == "function") ? ufnc(key,value) : value;
					return (typeof preVal === 'function' ) ? preVal.toString() : preVal;
				}, space );
			}
	,	textXtoj : function(	oXMLParentXmlTxt
				,	nVerbosity /* optional */, bFreeze /* optional */, bNesteAttributes /* optional */
				,	callback, clbkArg
				) {
			var oXMLParent = (new DOMParser).parseFromString(oXMLParentXmlTxt, "application/xml");
			return this.xtoj (oXMLParent, nVerbosity, bFreeze, bNesteAttributes, callback, clbkArg);
		  }
///</functions>

///<functions prog="javascipt" level="classProperty" title="XML document to JS convertor">
///jtox, jtoxText
///<desc> 
///</desc>
	,	jtox : function (	oObjTree
				,	bodyName /* optional */, namespace /* optional */, markTypes /* optional */
				,	callback, clbkArg
				) {
//maintain arguments:
			bodyName = isDef(bodyName) ? bodyName : this.opts.bodyName;
			namespace = isDef(namespace) ? namespace : this.opts.namespace;

			var oNewDoc = document.implementation.createDocument(namespace || null, bodyName || 'xml', null);
			this.circ_refs = []; this.level = -1;
			this.loadObjTree(oNewDoc, oNewDoc.documentElement, oObjTree, markTypes, callback, clbkArg);
			return oNewDoc;
		}
	,	jtoxText : function (	oObjTree
				,	bodyName /* optional */, namespace /* optional */, markTypes /* optional */
				,	callback, clbkArg
				) {
			var docTxt = "", doc = this.jtox( oObjTree, bodyName, namespace, markTypes, callback, clbkArg );
			if (doc) {
				docTxt = (new XMLSerializer).serializeToString( doc );
			}
			return docTxt;
		}
	,	textJtox : function(	oObjTreeJsonTxt
				,	bodyName /* optional */, namespace /* optional */, markTypes /* optional */
				,	callback, clbkArg
				) {
			var oObjTree = JSON.parse(  trim(oObjTreeJsonTxt,'[\\x00\\n\\r\\s]') );
			return this.jtox( oObjTree, bodyName, namespace, markTypes, callback, clbkArg );
		}
///</functions>

// testare especiale
	,	test : function( obj, bodyName, namespace, markTypes ) {
			var specarr = [1,2,{a:1,b:2},[9,8,7,6]];	
				specarr.spec="!?~éí=špä+úpo+\x01däúp";	
				specarr.obj={aa:1,bb:[false, 3, true ,2,null, undefined ,1], fn : function(i,j,k) { return i+j+k; } 
					, funArr :[	String.prototype.utf8_to_b64 
						,String.prototype.b64_to_utf8
					]
				};
				specarr["!?~éí=špä+úpo+\x01däúp"] = specarr.spec;	
			obj = obj || specarr;
			var xdxd = this.jtox(obj, bodyName, namespace, markTypes);
			return this.xtoj(xdxd);
		}
// JXONo.test(0, 0, false)	... not the same as specarr without markedTypes
// JXONo.test(0, 0, true)	... seems the same as specarr 

	,	xtoj_defaultFilter  : function( handle,  oNode,	oParentNode, nVerb, bFreeze, bNesteAttr,	acceptedSelectors ) {
		/* defautFilter vybera iba object properties, zodpovedajuce acceptedTagNames
		*/
			var accepted = true; 
			switch (handle) {
				case JXONo.CLBK_OBJECT_VALUE	:	{	//callback checked object VALUE
					break;
				}
				case JXONo.CLBK_OBJECT_TEXT	:	{	//callback checked object TEXT (collected text nodes)
					break;
				}
				case JXONo.CLBK_OBJECT_PROPERTY_NAME	:	{	//callback checked object PROPERTY NAME
					if (acceptedSelectors && acceptedSelectors.length) {
						accepted = false; 
						for( i=0; i < acceptedSelectors.length; i++ ) {
							var comparer = acceptedSelectors[i];
							if (isStr(comparer)) {
								if ( matchesSelector(item,comparer) ) {	// comparer == item
									accepted = true;
									break; 
								}
							} else if ( comparer instanceof RegExp ) {
								if ( item.match(comparer) ) {
									accepted = true;
									break; 
								}
							} else if ( isFnc(comparer) ) {
								if (comparer(item)) {
									accepted = true;
									break; 
								}
							}
						}
					}
					break;
				}
				case JXONo.CLBK_ATTRIBUTE_VALUE	:	{	//callback checked object ATTRIBUTE VALUE
					break;
				}
				case JXONo.CLBK_RESULT_VALUE	:	{	//callback checked object RESULT VALUE ... last chance to change
			//ALERT ...  oNode is RESULTING (in actual traversing level) JAVASCRIPT OBJECT !!! not XML Node or Attribute as at uppers
		//console.log(oNode, oParentNode);
					break;
				}
			}
			if (! accepted ) {
				return NaN; // NaN as:  I DONT WANT THIS PROP to convert	//	{ traverse:false };	
			}
		}
	,	xtoj_filter  : function(oXMLParent, filterFnc, acceptedSelectors		, nVerbosity, bFreeze, bNesteAttributes ) {
			var fnc = isFnc(filterFnc) ? filterFnc : ( isFnc(this.opts.xtoj_filterFnc) ? this.opts.xtoj_filterFnc : this.xtoj_defaultFilter);
			acceptedSelectors = isArr(acceptedSelectors) ? acceptedSelectors : (isArr(this.opts.acceptedSelectors) ? this.opts.acceptedSelectors : this.d.acceptedSelectors);
			return this.xtoj(oXMLParent, nVerbosity, bFreeze, bNesteAttributes,		fnc,	acceptedSelectors ); 
		}
	,	xtojText_filter  : function(oXMLParent, filterFnc, acceptedSelectors		, nVerbosity, bFreeze, bNesteAttributes ) {
			var fnc = isFnc(filterFnc) ? filterFnc : ( isFnc(this.opts.xtoj_filterFnc) ? this.opts.xtoj_filterFnc : this.xtoj_defaultFilter);
			acceptedSelectors = isArr(acceptedSelectors) ? acceptedSelectors : (isArr(this.opts.acceptedSelectors) ? this.opts.acceptedSelectors : this.d.acceptedSelectors);
			return this.xtojText(oXMLParent, nVerbosity, bFreeze, bNesteAttributes,		fnc,	acceptedSelectors ); 
		}
	
	,	jtox_defaultFilter  : function( handle, item, 		oXMLDoc, oParentEl, oParentObj, markTypes,	acceptedTagNames ) {
/* defautFilter vybera iba object properties, zodpovedajuce acceptedTagNames
*/
			var accepted = true; 
			switch (handle) {
				case JXONo.CLBK_OBJECT_VALUE	:	{	//callback checked object VALUE
					break;
				}
				case JXONo.CLBK_OBJECT_PROPERTY_NAME	:	{	//callback checked object PROPERTY NAME
					if (acceptedTagNames && acceptedTagNames.length) {
						accepted = false; 
						for( i=0; i < acceptedTagNames.length; i++ ) {
							var comparer = acceptedTagNames[i];
							if (isStr(comparer)) {
								if ( comparer == item ) {
									accepted = true;
									break; 
								}
							} else if ( comparer instanceof RegExp ) {
								if ( item.match(comparer) ) {
									accepted = true;
									break; 
								}
							} else if ( isFnc(comparer) ) {
								if (comparer(item)) {
									accepted = true;
									break; 
								}
							}
						}
					}
					break;
				}
				case JXONo.CLBK_OBJECT_ARRAY_INDEX :	{	//callback checked object ARRAY INDEX					!!! vValue instead oParentObj !!!
					break;
				}
			}
			if (! accepted ) {
				return NaN; // NaN as:  I DONT WANT THIS PROP to convert	//	{ traverse:false };	
			}
		}
	,	jtox_filter  : function(obj, filterFnc, acceptedTagNames		, bodyName, namespace, markTypes ) {
			var fnc = isFnc(filterFnc) ? filterFnc : ( isFnc(this.opts.jtox_filterFnc) ? this.opts.jtox_filterFnc : this.jtox_defaultFilter);
			acceptedTagNames = isArr(acceptedTagNames) ? acceptedTagNames : (isArr(this.opts.acceptedTagNames) ? this.opts.acceptedTagNames : this.d.acceptedTagNames);
			return this.jtox(obj, bodyName, namespace, markTypes, fnc,	acceptedTagNames ); 
		}
	,	jtoxText_filter  : function(obj, filterFnc, acceptedTagNames		, bodyName, namespace, markTypes ) {
			var fnc = isFnc(filterFnc) ? filterFnc : ( isFnc(this.opts.jtox_filterFnc) ? this.opts.jtox_filterFnc : this.jtox_defaultFilter);
			acceptedTagNames = isArr(acceptedTagNames) ? acceptedTagNames : (isArr(this.opts.acceptedTagNames) ? this.opts.acceptedTagNames : this.d.acceptedTagNames);
			return this.jtoxText(obj, bodyName, namespace, markTypes, fnc,	acceptedTagNames ); 
		}

	,	actions : [ "jtox","jtoxText","jtox_filter","jtoxText_filter","textJtox",	"xtoj","xtojText","xtoj_filter","xtojText_filter","textXtoj" ]
	,	do : function( obj, action ) {
			// obj ... javascript object or xml document or text
			if ( ! obj ) { return; }
			action = ( action && ( this.actions.indexOf( action ) >=0 ) ) 
					? action 
					: ( isNOD(obj) ? 'xtoj' 
						: ( isStr(obj) ? ( obj.match(/^\s*</g) ? 'textXtoj' : 'textJtox' )
							: 'jtox' 
						)
					)
			switch (action) {
				case "jtox":
				case "jtoxText":
				case "textJtox":
					result = this[action](obj);
					break;
				case "jtox_filter":
				case "jtoxText_filter":
					result = this[action](obj/*, filterFnc, acceptedTagNames */);
					break;
				case "xtoj":
				case "xtojText":
				case "textXtoj":
					result = this[action](obj);
					break;
				case "xtoj_filter":
				case "xtojText_filter":
					result = this[action](obj);
					break;
			}
			return result;
		}
	}

//___ORIGINAL_BUT_TOTALLY_MISUNDERSTANDABLE_FUNCTION_NAMES_________________________________________________________________
	JXONo.prototype.build = JXONo.prototype.xtoj;
	JXONo.prototype.buildToString = JXONo.prototype.xtojText;
	JXONo.prototype.unbuild = JXONo.prototype.jtox;
	JXONo.prototype.unbuildToString = JXONo.prototype.jtoxText;

	glob.JXONo = JXONo;  

}) (	(typeof window != "undefined") ? window : (	(typeof global != "undefined") ? global : this )   );

///<function name="formatXML" access="global">
///<param name="xml" type="XML document"> document to output </param>
///<param name="formast" type="String"> text, json, __ </param>
//# helper global function formatXML 
function formatXML( xml, format ) {
	switch (format) {
		case 'text' :
			return xml ? xml.documentElement.outerXML : '';
		case 'js' : 
		case 'jsobject' : 
			return xml ? (new JXONo).do(xml) : null;
		case 'json' : 
		case 'jsontext' : 
			return xml ? (new JXONo).do(xml,'xtojText') : null;
		default : 
			return xml;
	}
}
///</function>