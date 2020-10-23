///<file name="globals.js" path="/LIBRARY/HELPERS/globals.js">
/// jeden z DEEP CORE skriptov, volany prakticky vsetkymi ostatnymi skriptami systemu
/// obsahujuci vseobecne potrebne globalne objekty a funkcie
/// ako CORE musi fungovat aj pod BROWSER javascript, aj pod NODEJS

__MOBI = navigator.userAgent.match(/Android|BlackBerry|iPhone|iPad|iPod|Opera Mini|IEMobile/i); 

///<section name="dependances">
/// script ma jedinu zavislost na ES_HASH_WEB.JS, aj to podmienenu
/// ide o proste pouzitie hash-ovacej funkcie na zoznam do GLOBAL(WINDOW)
/// pridanych objektov a funkcii
if (typeof loadman != 'undefined') { loadman('/LIBRARY/HELPERS/es-hash-web.js'); }
///</section>

///<section name="registration">
/*# evidencia existencie file v aktualnej instancii systemu (browser window)
je zabezpecovana samotnym LOADMAN-om, 
preto samostatna evidencia formou window.__scripts je uz OBSOLETE
*/
/*
if (typeof window != "undefined") {
	window.___scripts = window.___scripts || {}; window.___scripts["globals.js"]={n:"globals.js",p:"/LIBRARY/HELPERS/globals.js"}; 
}
*/
// vypada to, ze JavaScript funguje (podobne ako PHP) tak, ze najprv prebehne text skriptu, 
// a pokial najde o definicie formou					  function(...) { ... }
// vykona ich skor, ako sa pusti do vlastneho prechadzania var ... a ostatneho inline kodu
// (s najvacsou pravdepodobnostou takto spracovava aj vlastny inline , closure code)
// PRETO:
// pokial do TOHTO globals.js SUBORU vlozim globalne funkcie horeuvedenou formou, 
// nebudu viditepne v ramci retrieveNewGlobals !!!
//   nezavisle od umiestnenia pred, ci za funkcnou definiciou retrieveNewGlobals samotneho !!!
///</section>

///<section name="is.xxx library">
/// nakolko javascript je weakly typed language, pomerne casto je problem identifikovat,
/// co za predmet (parameter, premenna) mam vlastne v rukach.
/// Aby sa nemuselo zdlhavo v kode vypisovat ' if (typeof VEC == 'something')
/// hodi sa sada funkcii umoznujuca skratkovito detekovat, co je vec vlastne zac
/*# is library definicia je zabalena podla
VZORu moznosti univerzalnej definicie kontext-u (browser...window, nodejs...global)
a teda funkcna aj v browser-i, aj pre nodejs server-side funkcionalitu
*/
(function(glob){	//! is.xxx library
//http://ejohn.org/blog/ecmascript-5-strict-mode-json-and-more/
// Non-strict code...
  "use strict";
// Define your library strictly...

///<var name="__" type="undefined" access="global"> alias for undefined
//# Moznost pouzivat v kode '__' miesto 'undefined' sa mi paci omnoho viac
//# preto vyrobim globalnu premennu '__'
  glob.__ = undefined; // __ double undescore like a undefined
///</var>

///<function name="getType" access="global"> 
//# funkcia getType vola javascript_core funkciu na urcenie 'pisaneho' typu 
//# produkujucou napr. getType(window) ... "[object global]"
	function getType(thing){
		if(thing===null)return "[object Null]"; // special case
		return Object.prototype.toString.call(thing);
	}
///</function>
///<function name="getObjectType"> 
//# funkcia getObjectType vyhryzne z getType odpovede to podstatne
//# napr. iS._objType(window) ... "global" 
	function getObjectType(thing){
		var oT = getType(thing);
		var matches = /\[object\s+(.+)\]/.exec(oT);
		if (matches && matches[1]) {
			return matches[1];
		}
		return null;
	}
///</function>
///<object name="is">
/*# identifikacia druhu javascript objektov nie je uplne jednoducha,
ale pouzity kod by mal byt uz dostatocne otestovany.

Dolezita poznamka : pomerne casto je potrebne v kode vediet, ci nieco uz bolo definovane
ci uz v globalnom kontexte (univarzalne pristupne odkialkolvek),
alebo v closure (v kontextoch hierarchicky nadbalane nad kusom kodu, v ktorom sa nachadzam
- v nodejs aj kazdy volany modul predstavuje closure, standartne kazda funkcia vytvara
closure, takze funkcia definovana vnutri funkcie pozna aj premenne funkcie, do ktorej
je vnorena ako closure premenne).
	Testovanie pomocou funkcie isDef (is._def) je mozne len na parametre funkcii
(ktore tiez moznu byt zadane ako undefined), nakolko taketo parametre existuju ako
javascriptove veci s hodnotou undefined.
	Ked vsak ide o zistovanie, ci existuje globalna premenna , ci closure premenna,
javascript vyhlasi chybu pri pokuse vlozit meno nedefinovanej premennej do parametra
funkcie isDef ... a preto neostava nic ineho, len konstrukcia
	if (typeof TOTO == 'undefined') ....
Aj tak funkcia isDef statocne pomaha pri identifikacii parametrov s hodnotou undefined
*/
  var is = {	
	 _type : getType	//access direct to getType
	,_objType : getObjectType	//access direct to getType
  
	,_null : function(thing) {	return thing === null; }
	,_false: function(thing) {	return thing === false; }
	,_true : function(thing) {	return thing === true; }
//	,_empty: function(thing) {	return (	( thing instanceof Object )
//										? 	(Object.getOwnPropertyNames(thing).length == 0) 
//										: (! thing)
//										);
//							}
	,_empty : function(thing) {
		var op = ( thing instanceof Object ) ? Object.getOwnPropertyNames(thing) : null;
		return (	op
				? 	(   (op.length == 0) 
					 || ( ( thing instanceof Array ) 
							&& (op.length == 1)
							&&( op[0] == "length" )   )
					)
				: (! thing)
				);
	}
	,_def: function(thing) { return (thing !== undefined); }
	,_undef: function(thing) { return (thing === undefined); }
	,_none: function(thing) { return (thing === undefined) || (thing === null); }
	/* test
	x = undefined; y=false; z=""; w=null; q="q";
	f=isSet;alert('func:isSet x(undefined):'+f(x)+' y(false):'+f(y)+' z(""):'+f(z)+' w(null):'+f(w)+' q("q"):'+f(q));
	f=isFalse;alert('func:isFalse x(undefined):'+f(x)+' y(false):'+f(y)+' z(""):'+f(z)+' w(null):'+f(w)+' q("q"):'+f(q));
	f=isTrue;alert('func:isTrue x(undefined):'+f(x)+' y(false):'+f(y)+' z(""):'+f(z)+' w(null):'+f(w)+' q("q"):'+f(q));
	f=isEmpty;alert('func:isEmpty x(undefined):'+f(x)+' y(false):'+f(y)+' z(""):'+f(z)+' w(null):'+f(w)+' q("q"):'+f(q));
	*/

	,_object  : function(thing) { return getType(thing) == "[object Object]"; }
	,_bool    : function(thing) { return getType(thing) == "[object Boolean]"; }
	,_number  : function(thing) { return getType(thing) == "[object Number]"; }
// `NaN` is the only value for which `===` is not reflexive.
	,_isNaN   : function(obj) { return obj !== obj; }
	,_string  : function(thing) { return getType(thing) == "[object String]"; }
	,_array   : function(thing) { return Array.isArray ? Array.isArray(thing) : getType(thing) == "[object Array]"; }
	,_function: function(thing) { return getType(thing) == "[object Function]"; }

	,_node: function(thing) { return thing instanceof Node; }
	,_element: function(thing) { return thing instanceof Element; }
	,_svg: function(thing) { return thing instanceof SVGElement; }
	,_html: function(thing) { return thing instanceof HTMLElement; }
	,_xml: function(thing) { return thing instanceof Element && !(is._html(thing)) && !(is._svg(thing)); }	//????
	
	,_inDOM	: function(el) {
			if (!isNOD(el)) {
				return false;
			}
			do {
				if (el instanceof Document) {
					return true;
				}
				el = el.parentNode;
			} while(el);
			return false;
		}
  }
///</object>
///<object name="iS" access="global"> globalized object <ref>is</ref>
//# kniznicka is je uvedena do globalneho kontextu ako iS 
//# kvoli existencii inych kniznic, ktore pojem 'is' pouzivaju
  glob.iS = is;
///</object>

///<section name="is_aliases"> direct global access to is_XXX functions
/*# definicny zoznam is_XXX skratiek pristupnych kedykolvek a kdekolvek
	isDef 	: is._def
	isNul 	: is._null
	isFal 	: is._false
	isTru 	: is._true
	isEmp 	: is._empty
	isNon	: is._none
	isObj 	: is._object
	isBoo 	: is._bool
	isNum 	: is._number
	isNan 	: is._isNaN
	isStr 	: is._string
	isArr 	: is._array
	isFnc 	: is._function

	isNOD 	: is._node
	isELE 	: is._element
	isSVG 	: is._svg
	isHTM 	: is._html
	isXML 	: is._xml
	
	isInDOM : is._inDOM
*/
  var aliases = {  
		isTyp 	: is._type
	,	getType : is._type
	,	objType : is._objType
		//-------------- my favourites:
	,	isDef 	: is._def
	,	isNul 	: is._null
	,	isFal 	: is._false
	,	isTru 	: is._true
	,	isEmp 	: is._empty
	,	isNon	: is._none
	,	isObj 	: is._object
	,	isBoo 	: is._bool
	,	isNum 	: is._number
	,	isNan 	: is._isNaN
	,	isNbr 	: function(thing) { return is._number(thing) && ! (is._isNaN(thing)); } 
	,	isStr 	: is._string
	,	isArr 	: is._array
	,	isFnc 	: is._function

	,	isNOD 	: is._node
	,	isELE 	: is._element
	,	isSVG 	: is._svg
	,	isHTM 	: is._html
	,	isXML 	: is._xml
	
	,	isInDOM : is._inDOM
/*
	//-------------- more verbose: // uncomment if unconditionally needed - not recommended due to compatibility issuses
	,	isSet 		: is._def
	,	isDefined 	: is._def
	,	isNull 		: is._null
	,	isFalse 	: is._false;
	,	isTrue 		: is._true
	,	isEmpty 	: is._empty
	,	isNone		: is._none
	,	isObject 	: is._object
	,	isBool 		: is._bool
	,	isNumber 	: is._number
	,	isString 	: is._string
	,	isArray 	: is._array
	,	isFunction 	: is._function

	,	isSVG 		: is._svg
	,	isHTML	 	: is._html
	,	isXML 		: is._xml
*/
	};
	
//# a zavedenie skratkovitych funkcii do globalneho kontextu
// extend glob if You like :
  for (var item in aliases) {
	glob[item] = aliases[item];
  }
///</section>
//# a uzavierame obal kniznicky is 
//# rozlisenim podla VZOR-u moznosti univerzalnej definicie kontext-u 
//# ci ide o browser...window, alebo nodejs...global  
})(
	(typeof window != "undefined") ? window : ((typeof global != "undefined") ? global : this)
   );

// Non-strict code... 
///</section>
 
///<section name="String.prototype Addons">
/// hodi sa zopar uzitocnych doplnkovych metod do String.prototype
///<function name="capitalize" type="method" of="String.prototype">
/// capitalize ... Zmeni male, velke pismena retazca tak, aby kazde slovo zacinalo Velkym pismenom
///<testex><example>"anoTattiDk kRTT".toLowerCase().capitalize()</example>
///<result>"Anotattidk Krtt"</result></testex>
String.prototype.capitalize = function(){
       return this.replace( /(^|\s)([a-z])/g , function(m,p1,p2){ return p1+p2.toUpperCase(); } );
      };
///</function>
///<function name="repeat" type="method" of="String.prototype">
///<param name="count" type="Number">pocet opakovani</param>
/// repeat ... zopakuje zadany pocet krat retazec a vrati taky predlzeny
///<testex><example>"anoTattiDk kRTT".repeat(4)</example>
///<result>"anoTattiDk kRTTanoTattiDk kRTTanoTattiDk kRTTanoTattiDk kRTT"</result></testex>
//# http://stackoverflow.com/questions/202605/repeat-string-javascript
String.prototype.repeat = function(count) {	
    if (count < 1) return '';
    var result = '', pattern = this.valueOf();
	if (pattern) {	//sometimes we have empty string - no need to proceed
		while (count > 0) {
			if (count & 1) result += pattern;
			count >>= 1, pattern += pattern;
		}
	}
    return result;
};
///</function>
///<function name="hexEncode" type="method" of="String.prototype">
/// hexEncode ... vrati retazec v hexadecimalnej forme
///<testex><example>"anoTattiDk kRTT".hexEncode()</example>
///<result>"616e6f5461747469446b206b525454"</result></testex>
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
///</function>
///<function name="hexDecode" type="method" of="String.prototype">
/// hexDecode ... vrati retazec konvertovany z hexadecimalnej formy, ak je zadana nespravna hexadecimalna forma, proste to domrvi snahou
/// o konvertovanie funkciou unescape z html standartu hexa znakov pomocou %
///<testex><example>"616e6f5461747469446b206b525454".hexEncode()</example>
///<result>"anoTattiDk kRTT"</result></testex>
///<testex><example>"anoTattiDk kRTT".hexEncode()</example>
///<result>"%an%oT%at%ti%Dk% k%RT%T"</result></testex>
String.prototype.hexDecode = function(){
	var r='';
	for(var i=0;i<this.length;i+=2){
		r+=unescape('%'+this.substr(i,2));
	}
	return r;
}
///</function>
///</section>

///<section name="Object.prototype Addons">
//# do Object.prototype radsej nesiaham
/*
Object.prototype.isEmpty = function() {
    for (var prop in this) {
        if (this.hasOwnProperty(prop)) return false;
    }
    return true;
// odstranenie vlastnosti objektu ...
// delete vec.vlastnost;
};
Object.prototype.listKeys = function() {
	var list = [];
	for (var prop in this) {
		if (this.hasOwnProperty(prop)) {
			list.push(prop);
		}
	}
	return list;
}
*/
///</section>

///<section name="browser dependant functions Addons">
/// browsery obsahuju niektore funkcie a objekty, ktore nie su este plne standartizovane
/// (ale obvykle prakticky take iste v roznych browseroch) so specialnymi predponami podla druhu browsera
/// Tato sekcia obsahuje pomocky pre ulahcene volanie takychto funkcii, ci objektov,
/// aby sa nemuselo zlozito a zakazdym zistovat, co vlastne mozeme volat
/// sekcia samozrejme funguje len pre browsery (nie nodejs), co identifikujeme
/// prostou existenciou globalneho objektu 'document'
if (typeof document != 'undefined') {
// var tn = this.transformStyleName = FirstSupportedPropertyName([ "MSTransform", "msTransform", "MsTransform", '-ms-transform', "MozTransform", '-moz-transform', "webkitTransform", "WebkitTransform", '-webkit-transform', "OTransform", '-o-transform', "transform" ]);
	var BDprefixes = [
		''
	,	'webkit','Webkit','WebKit','-webkit-'
	,	'moz','Moz','-moz-'
	,	'ms','Ms','MS','-ms-'
	,	'o','O','-o-'
	];
///<function name="BD">
///<param name="fnc" type="String">nazov funkcie bez browser dependant predpony</param>
///<param name="el" type="Element" optional="optional">pripadny Element, ktoreho browser dependant funkciu chceme volat</param>
///helper fo selecting proper BrowserDepend (non-standart) function
///<testex><example>BD("ConvertPointFromNodeToPage")</example>
///<result>function webkitConvertPointFromNodeToPage() { [native code] }</result></testex>
function BD(fnc,el) { 
	fnc = fnc.capitalize().replace(/^(css\w)(\w+)/i,function(m,p0,p1){ return p0.toUpperCase() + p1; });
	el = el || window;
	for (var i=0;i<BDprefixes.length;i++) {
		var bd = BDprefixes[i]; 
		var f = bd + (bd[bd.length-1]=='-' ? fnc.toLowerCase(): fnc.toCamelCase());	//.capitalize()); 
		if (el[f]) {
			return el[f];
		}
	}
	return null;	//function(){};
}
///</function>

///<function name="BDS">
/// get-set helper fo selecting proper BrowserDepend (non-standart) style attributes
///<param name="el" type="Element"> Element, which style is managed </param>
///<param name="styleItem" type="String"> name of style item (without browser dependant prefix) </param>
///<param name="value" type="String" optional="optional"> optional value to set </param>
///<testex><desc>ekvivalent $0.style.webkitPerspective </desc>
///<example>BDS($0,'perspective')</example>
///<result>""</result></testex>
function BDS(el,styleItem,value) { 
	styleItem = styleItem.capitalize();
	el = el || document.body;
	for (var i=0;i<BDprefixes.length;i++) {
		var bd = BDprefixes[i]; 
		var f = bd+ (bd[length-1]=='-' ? styleItem.toLowerCase(): styleItem.toCamelCase());	//.capitalize()); 
		if (isDef(el.style[f])) {
			if (isDef(value)) {
				el.style[f] = value;
			}
			return el.style[f];
		}
	}
	return null;
}
///</function>

///<function name="BDCS">
///helper fo selecting proper BrowserDepend (non-standart) getComputedStyle attributes
///<param name="el" type="Element"> Element, which style is managed </param>
///<param name="styleItem" type="String"> name of style item (without browser dependant prefix) </param>
///<testex><desc>ekvivalent getComputedStyle($0).webkitPerspective </desc>
///<example>BDCS($0,'perspective')</example>
///<result>"none"</result></testex>
function BDCS(el,styleItem) { 
	styleItem = styleItem.capitalize();
	el = el || document.body;
	var cs = getComputedStyle(el);
	for (var i=0;i<BDprefixes.length;i++) {
		var bd = BDprefixes[i]; 
		var f = bd+ (bd[length-1]=='-' ? styleItem.toLowerCase(): styleItem.toCamelCase());	//.capitalize()); 
		if (isDef(cs[f])) {
			return cs[f];
		}
	}
	return null;
}
///</function>

function _dom_trackActiveElement(evt) {
  if (evt && evt.target) { 
    document.activeElement = 
        evt.target == document ? null : evt.target;
  }
}
 
function _dom_trackActiveElementLost(evt) { 
  document.activeElement = null; 
}
 
if (! document.activeElement) {
	if (document.addEventListener) {
	  document.addEventListener("focus",_dom_trackActiveElement,true);
//	  document.addEventListener("blur",_dom_trackActiveElementLost,true);
	}
}
 
}
///</section>
///</file>
