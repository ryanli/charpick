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

	// This function can get a whole Unicode char at a certain position of a string
	// it receives two arguments: string and index
	// it returns an 2 element array of the char at the index, and the index itself
	// since a Unicode char beyond 0xFFFF may require more space, so the index
	// is mutable, and there's need to return it
	getWholeCharAndIndex : function (str, i) {
		var code = str.charCodeAt(i);
		// High surrogate (could change last hex to 0xDB7F to treat high private surrogates as single characters)
		if (0xD800 <= code && code <= 0xDBFF) {
			if (str.length <= (i + 1)) {
				throw 'High surrogate without following low surrogate';
			}
			var next = str.charCodeAt(i + 1);
			if (0xDC00 > next || next > 0xDFFF) {
				throw 'High surrogate without following low surrogate';
			}
			return [str.charAt(i) + str.charAt(i + 1), i + 1];
		}
		// Low surrogate
		else if (0xDC00 <= code && code <= 0xDFFF) {
			if (i === 0) {
				throw 'Low surrogate without preceding high surrogate';
			}
			var prev = str.charCodeAt(i - 1);
			// (could change last hex to 0xDB7F to treat high private surrogates as single characters)
			if (0xD800 > prev || prev > 0xDBFF) {
				throw 'Low surrogate without preceding high surrogate';
			}
			// Return the next character instead (and increment)
			return [str.charAt(i + 1), i + 1];
		}
		return [str.charAt(i), i]; // Normal character, keeping 'i' the same
	},
// utils end

// palette prefs begin
	splitPaletteList : function(palettes) {
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

	mergePaletteList : function(palettes) {
		var merged = new String();
		for (var index in palettes) {
			merged += palettes[index].replace(/;/g, ';;') + ';';
		}
		return merged;
	},

	getPalettes : function() {
		var palettes = charpick.getStringPref("palettes");
		return charpick.splitPaletteList(palettes);
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

	selectPalette : function(index, charset) {
		this.selected = '';
		this.selectedText = '';
		charpick.setIntegerPref("selected", index);
		var container = document.getElementById("charpick-buttons");
		while (container.childNodes.length) {
			container.removeChild(container.firstChild);
		}

		var copyString = document.getElementById('charpick-strings').getString('copy');

		for (var i = 0, chr; i < charset.length; ++i) {
			[chr, i] = this.getWholeCharAndIndex(charset, i);
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
	fillPaletteList : function() {
		var pref = document.getElementById("palettes");
		var palettes = charpick.splitPaletteList(pref.value);
		var list = document.getElementById("charpick-palette-list");
		while (list.itemCount > 0) {
			list.removeItemAt(0);
		}
		for (var index in palettes) {
			list.appendItem(palettes[index]);
		}
	},

	addPalette : function() {
		var pref = document.getElementById("palettes");
		var palettes = charpick.splitPaletteList(pref.value);
		var params = {add: false, palette: ""};
		window.openDialog('chrome://charpick/content/add-palette.xul',
			'charpick-add-palette-dialog', 'centerscreen,chrome,modal', params);
		if (params.add) {
			palettes.push(params.palette);
		}
		pref.value = charpick.mergePaletteList(palettes);
	},

	editPalette : function() {
		var pref = document.getElementById("palettes");
		var palettes = charpick.splitPaletteList(pref.value);
		var list = document.getElementById("charpick-palette-list");
		var index = list.selectedIndex;
		if (index >= 0) {
			var params = {edit: false, palette: palettes[index]};
			window.openDialog('chrome://charpick/content/edit-palette.xul',
				'charpick-edit-palette-dialog', 'centerscreen,chrome,modal', params);
			if (params.edit) {
				palettes[index] = params.palette;
			}
			pref.value = charpick.mergePaletteList(palettes);
		}
	},

	deletePalette : function() {
		var pref = document.getElementById("palettes");
		var palettes = charpick.splitPaletteList(pref.value);
		var list = document.getElementById("charpick-palette-list");
		var index = list.selectedIndex;
		if (index >= 0) {
			palettes.splice(index, 1);
			pref.value = charpick.mergePaletteList(palettes);
		}
	},

	setTextBox : function() {
		var textbox = document.getElementById("charpick-textbox");
		textbox.value = window.arguments[0].palette;
	},

	loadPrefs : function() {
		charpick.loadPaletteList();
	},

	savePrefs : function() {
		return charpick.savePalettes();
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
