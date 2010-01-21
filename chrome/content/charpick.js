var charpick = {

	version : '0.4',

	selected : '',
	selectedText : '',

// utils begin
	prefManager : Components
		.classes["@mozilla.org/preferences-service;1"]
		.getService(Components.interfaces.nsIPrefBranch),

	getStringPref : function(key) {
		var val;
		try {
			val = this.prefManager.
			getComplexValue("extensions.charpick." + key, Components.interfaces.nsISupportsString)
			.data;
		}
		catch (e) {
			return null;
		}
		return val;
	},

	setStringPref : function(key, val) {
		var str = Components
			.classes["@mozilla.org/supports-string;1"]
			.createInstance(Components.interfaces.nsISupportsString);
		str.data = val;
		this.prefManager
			.setComplexValue("extensions.charpick." + key, Components.interfaces.nsISupportsString, str);
	},

	getIntegerPref : function(key) {
		var val;
		try {
			val = this.prefManager.getIntPref("extensions.charpick." + key);
		}
		catch (e) {
			return null;
		}
		return val;
	},

	setIntegerPref : function(key, val) {
		this.prefManager.setIntPref("extensions.charpick." + key, val);
	},

	getClipboard : function() {
		try {
			var ret = new Object();
			var clip = Components
				.classes["@mozilla.org/widget/clipboard;1"]
				.getService(Components.interfaces.nsIClipboard);
			var supportsSelection;
			supportsSelection = clip.supportsSelectionClipboard();

			var trans = Components
				.classes["@mozilla.org/widget/transferable;1"]
				.createInstance(Components.interfaces.nsITransferable);
			trans.addDataFlavor("text/unicode");

			// kGlobalClipboard
			try {
				var str = new Object();
				var strLength = new Object();

				clip.getData(trans, clip.kGlobalClipboard);

				trans.getTransferData("text/unicode", str, strLength);
				if (str) {
					str = str.value.QueryInterface(Components.interfaces.nsISupportsString);
				}
				if (str) {
					ret.Global = str.data.substring(0, strLength.value / 2);
				}
			}
			catch (e) {
				ret.Global = false;
			}

			// kSelectionClipboard - only for X
			try {
				if (supportsSelection) {
					var str_ = new Object();
					var strLength_ = new Object();
					clip.getData(trans, clip.kSelectionClipboard);

					trans.getTransferData("text/unicode", str_, strLength_);
					if (str_) {
						str_ = str_.value.QueryInterface(Components.interfaces.nsISupportsString);
					}
					if (str) {
						ret.Selection = str_.data.substring(0, strLength_.value / 2);
					}
				}
				else {
					ret.Selection = false;
				}
			}
			catch (e) {
				ret.Selection = false;
			}

			return ret;
		}
		catch (e) {
			return {Global: false, Selection: false};
		}
	},

	setClipboard : function(str) {
		const gClipboardHelper = Components
			.classes["@mozilla.org/widget/clipboardhelper;1"]
			.getService(Components.interfaces.nsIClipboardHelper);
		gClipboardHelper.copyString(str);
	},
// utils end

// palette prefs begin
	getPalettes : function() {
		var palettes = charpick.getStringPref("palettes");
		var index = 0;
		var ret = new Array();
		while (index < palettes.length) {
			var current = new String();
			while (index < palettes.length) {
				if (palettes[index] != ';') {
					current += palettes[index];
					++index;
				}
				else if (index < palettes.length - 1 && palettes[index + 1] == ';') {
					current += ';';
					index += 2;
				}
				else {
					++index;
					break;
				}
			}
			if (current.length) {
				ret.push(current);
			}
		}
		return ret;
	},

	setPalettes : function(a) {
		var merged = new String();
		for (var index in a) {
			merged += a[index].replace(/;/g, ';;') + ';';
		}
		charpick.setStringPref('palettes', merged);
	},
// palette prefs end

// toolbar actions begin
	loadPalettes : function() {
		var palettes = charpick.getPalettes();
		var popup = document.getElementById("charpick-popup");
		var seperator = document.getElementById("charpick-menu-seperator");

		while (popup.getElementsByClassName("charset").length) {
			popup.removeChild(popup.getElementsByClassName("charset")[0]);
		}

		for (var index in palettes) {
			var palette = document.createElement("menuitem");
			palette.setAttribute("class", "charset");
			palette.setAttribute("group", "charset");
			palette.setAttribute("type", "radio");
			palette.setAttribute("oncommand", "charpick.selectPalette(" + index + ", this.label);");
			palette.setAttribute("label", palettes[index]);
			popup.insertBefore(palette, seperator);
		}
		var selected = 0;
		if (charpick.getIntegerPref("selected")) {
			selected = charpick.getIntegerPref("selected");
		}
		if (!popup.getElementsByClassName("charset")[selected]) {
			selected = 0;
		}
		popup.getElementsByClassName("charset")[selected].setAttribute("checked", "true");
		charpick.selectPalette(selected, palettes[selected]);
	},

	getWholeCharAndI : function (str, i) {
		var code = str.charCodeAt(i);
		if (0xD800 <= code && code <= 0xDBFF) { // High surrogate (could change last hex to 0xDB7F to treat high private surrogates as single characters)
			if (str.length <= (i+1))  {
				throw 'High surrogate without following low surrogate';
			}
			var next = str.charCodeAt(i+1);
			if (0xDC00 > next || next > 0xDFFF) {
				throw 'High surrogate without following low surrogate';
			}
			return [str.charAt(i)+str.charAt(i+1), i+1];
		}
		else if (0xDC00 <= code && code <= 0xDFFF) { // Low surrogate
			if (i === 0) {
				throw 'Low surrogate without preceding high surrogate';
			}
			var prev = str.charCodeAt(i-1);
			if (0xD800 > prev || prev > 0xDBFF) { // (could change last hex to 0xDB7F to treat high private surrogates as single characters)
				throw 'Low surrogate without preceding high surrogate';
			}
			return [str.charAt(i+1), i+1]; // Return the next character instead (and increment)
		}
		return [str.charAt(i), i]; // Normal character, keeping 'i' the same
	},

	selectPalette : function(index, charset) {
		this.selected = '';
		this.selectedText = '';
		charpick.setIntegerPref("selected", index);
		var container = document.getElementById("charpick-buttons");
		while (container.childNodes.length) {
			container.removeChild(container.firstChild);
		}

		var copyString = document.getElementById('charpick-strings').getString('copy');

		for (var i=0, chr; i < charset.length; i++) {
			[chr, i] = this.getWholeCharAndI(charset, i);
			var charButton = document.createElement("toolbarbutton");
			charButton.setAttribute("id", "charpick-char-" + i);
			charButton.setAttribute("class", "charpick-char");
			charButton.setAttribute("group", "charpick-char");
			charButton.setAttribute("type", "radio");
			charButton.setAttribute("tooltiptext", copyString);
			charButton.setAttribute("oncommand", "charpick.selectChar(this);");
			charButton.setAttribute("label", chr);
			container.appendChild(charButton);
		}
	},

	selectChar : function(obj) {
		if (obj.id == this.selected) {
			obj.setAttribute("checked", false);
			this.selected = '';
			this.selectedText = '';
		}
		else {
			var text = obj.getAttribute('label');
			this.selected = obj.id;
			this.selectedText = text;
			charpick.setClipboard(text);
		}
	},

	clearSelection : function() {
		var button = document.getElementById(this.selected);
		if (button) {
			button.setAttribute('checked', false);
		}
		this.selected = '';
		this.selectedText = '';
	},

	clipboardListener : function() {
		var text = charpick.selectedText;
		var selection = charpick.getClipboard();
		if (text) {
			if ((selection.Global !== false && selection.Global !== text)
				|| (selection.Selection !== false && selection.Selection !== text)) {
				charpick.clearSelection();
			}
		}
	},
// toolbar actions end

// preferences dialog begin
	loadPaletteList : function() {
		var list = document.getElementById("charpick-palette-list");
		var palettes = charpick.getPalettes();
		for (index in palettes) {
			list.appendItem(palettes[index]);
		}
	},

	savePalettes : function() {
		var list = document.getElementById("charpick-palette-list");
		if (list == null) {
			return true;
		}
		var palettes = new Array();
		for (var child = list.firstChild; child != null; child = child.nextSibling) {
			palettes.push(child.getAttribute('label'));
		}
		charpick.setPalettes(palettes);
		return true;
	},

	addPalette : function() {
		var list = document.getElementById("charpick-palette-list");
		var params = {add: false, palette: ""};
		window.openDialog('chrome://charpick/content/add-palette.xul',
			'charpick-add-palette-dialog', 'centerscreen,chrome,modal', params);
		if (params.add) {
			list.appendItem(params.palette);
		}
	},

	editPalette : function() {
		var list = document.getElementById("charpick-palette-list");
		if (list)
		{
			var selected = list.selectedItem;
			if (selected)
			{
				var orig = selected.label;
				var params = {edit: false, palette: orig};
				window.openDialog('chrome://charpick/content/edit-palette.xul',
					'charpick-edit-palette-dialog', 'centerscreen,chrome,modal', params);
				if (params.edit) {
					selected.label = params.palette;
				}
			}
		}
	},

	deletePalette : function() {
		var list = document.getElementById("charpick-palette-list");
		if (list) {
			list.removeItemAt(list.selectedIndex);
		}
	},

	setTextBox : function() {
		var textbox = document.getElementById("charpick-textbox");
		textbox.value = window.arguments[0].palette;
	},

	loadMiddleClick : function() {
		var middleClick = document.getElementById("charpick-middle-click-paste");
		var enabled = this.prefManager.getBoolPref("middlemouse.paste");
		middleClick.setAttribute('checked', enabled);
	},

	saveMiddleClick : function() {
		var middleClick = document.getElementById("charpick-middle-click-paste");
		this.prefManager.setBoolPref("middlemouse.paste", middleClick.hasAttribute('checked'));
		return true;
	},

	loadPrefs : function() {
		charpick.loadPaletteList();
		charpick.loadMiddleClick();
	},

	savePrefs : function() {
		return charpick.savePalettes() && charpick.saveMiddleClick();
	},
// preferences dialog end

// first run begin
	getWikiURI : function() {
		var host = 'http://wiki.github.com/ryanli/charpick/';
		var version = this.version.replace(/\./g, '');
		var uri = host + "version-" + version;
		return uri;
	},

	firstRun : function() {
		var version = this.getStringPref("version");
		if (version !== this.version) {
			this.setStringPref("version", this.version);
			gBrowser.selectedTab = gBrowser.addTab(charpick.getWikiURI());
		}
	},
// first run end

// listener begin
	init : function() {
		charpick.loadPalettes();
		charpick.firstRun();
	}
// listener end
};

window.addEventListener("load", charpick.init, false);

// We need many event listeners in order to monitor clipboard change.
// Besides user-triggered copy events, external applications and scripts
// may also modify the clipboard. So we need copy and a frenquently used
// event, here is mousemove.
// Under Unix-like systems, there's an extra selection clipboard, and selection
// itself will not trigger oncopy(), so we introduced click, mouseup, mousemove
// for selection by mouse, and keypress, keyup for selection by keyboard.
// copy event itself
window.addEventListener("copy", charpick.clipboardListener, false);
// selection by mouse
window.addEventListener("click", charpick.clipboardListener, false);
window.addEventListener("mouseup", charpick.clipboardListener, false);
window.addEventListener("mousemove", charpick.clipboardListener, false);
// selection by keyboard
window.addEventListener("keypress", charpick.clipboardListener, false);
window.addEventListener("keyup", charpick.clipboardListener, false);
