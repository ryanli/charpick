var charpick = {

	selected : "",
	selectedText : "",

// utils begin
	prefs : null,

	getStringPref : function(key) {
		var val;
		try {
			val = this.prefs.
			getComplexValue(key, Components.interfaces.nsISupportsString)
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
		this.prefs
			.setComplexValue(key, Components.interfaces.nsISupportsString, str);
	},

	getIntegerPref : function(key) {
		var val;
		try {
			val = this.prefs.getIntPref(key);
		}
		catch (e) {
			return null;
		}
		return val;
	},

	setIntegerPref : function(key, val) {
		this.prefs.setIntPref(key, val);
	},

	/*
		return type: {Global: String(), Selection: String()};
		value false means the corresponding clipboard is unavailable
	*/
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
				ret.Global = null;
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
				ret.Selection = null;
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
				throw "High surrogate without following low surrogate";
			}
			var next = str.charCodeAt(i + 1);
			if (0xDC00 > next || next > 0xDFFF) {
				throw "High surrogate without following low surrogate";
			}
			return [str.charAt(i) + str.charAt(i + 1), i + 1];
		}
		// Low surrogate
		else if (0xDC00 <= code && code <= 0xDFFF) {
			if (i === 0) {
				throw "Low surrogate without preceding high surrogate";
			}
			var prev = str.charCodeAt(i - 1);
			// (could change last hex to 0xDB7F to treat high private surrogates as single characters)
			if (0xD800 > prev || prev > 0xDBFF) {
				throw "Low surrogate without preceding high surrogate";
			}
			// Return the next character instead (and increment)
			return [str.charAt(i + 1), i + 1];
		}
		return [str.charAt(i), i]; // Normal character, keeping i the same
	},
// utils end

// palette operations begin
	splitPaletteList : function(palettes) {
		var ret = new Array();
		var current = new String();
		for (var index = 0; index <= palettes.length; ++index) {
			if (index >= palettes.length || palettes[index] == ";") {
				// semicolon is the separator of two palettes
				// go on to proceed next palette
				if (current.length > 0) {
					ret.push(current);
				}
				current = new String();
			}
			else if (palettes[index] == "\\") {
				// we use backslash to escape special characters
				if (index < palettes.length) {
					current += palettes[++index];
				}
			}
			else {
				// normal character
				current += palettes[index];
			}
		}
		return ret;
	},

	mergePaletteList : function(palettes) {
		var merged = new String();
		for (var index in palettes) {
			// ignore empty palettes
			if (palettes[index]) {
				merged += palettes[index].replace(/\\/g, "\\\\").replace(/;/g, "\\;") + ";";
			}
		}
		return merged;
	},

	splitPalette : function(palette) {
		var ret = new Array();
		for (var index = 0; index < palette.length; ++index) {
			var chr;
			[chr, index] = charpick.getWholeCharAndIndex(palette, index);
			ret.push(chr);
		}
		return ret;
	},

// palette operations end

// pref begin
	getPalettes : function() {
		var palettes = charpick.getStringPref("palettes");
		return charpick.splitPaletteList(palettes);
	},
// pref end

// toolbar actions begin
	loadPalettes : function() {
		var palettes = charpick.getPalettes();

		var popup = document.getElementById("charpick-popup");
		var separator = document.getElementById("charpick-menu-separator");

		while (popup.getElementsByClassName("charpick-palette").length) {
			popup.removeChild(popup.getElementsByClassName("charpick-palette")[0]);
		}

		for (var index in palettes) {
			var palette = document.createElement("menuitem");
			palette.setAttribute("id", "charpick-palette-" + index);
			palette.setAttribute("class", "charpick-palette");
			palette.setAttribute("group", "charpick-palette");
			palette.setAttribute("type", "radio");
			palette.setAttribute("oncommand", "charpick.selectPalette(" + index + ");");
			palette.setAttribute("label", palettes[index]);
			popup.insertBefore(palette, separator);
		}

		// Select the last-selected palette according to value from preferences,
		// or if the value is larger than palette num, select the first.
		// If there are no palettes at all(palettes.length == 0), selectPalette()
		// will clear the buttons.
		var selected = charpick.getIntegerPref("selected");
		if (selected == null || selected >= palettes.length) {
			selected = 0;
		}
		charpick.selectPalette(selected);
	},

	selectPalette : function(index) {
		this.selected = "";
		this.selectedText = "";
		charpick.setIntegerPref("selected", index);

		var container = document.getElementById("charpick-buttons");
		while (container.childNodes.length) {
			container.removeChild(container.firstChild);
		}

		var palette = document.getElementById("charpick-palette-" + index);
		if (!palette) {
			return;
		}
		palette.setAttribute("checked", "true");
		var paletteLabel = palette.getAttribute("label");

		var copyString = document.getElementById("charpick-strings").getString("copy");

		var charArray = charpick.splitPalette(paletteLabel);
		for (var index in charArray) {
			var charButton = document.createElement("toolbarbutton");
			charButton.setAttribute("id", "charpick-char-" + index);
			charButton.setAttribute("class", "charpick-char");
			charButton.setAttribute("group", "charpick-char");
			charButton.setAttribute("type", "radio");
			charButton.setAttribute("tooltiptext", copyString);
			charButton.setAttribute("oncommand", "charpick.selectChar(this);");
			charButton.setAttribute("label", charArray[index]);
			container.appendChild(charButton);
		}
	},

	selectChar : function(obj) {
		if (obj.id == this.selected) {
			obj.setAttribute("checked", false);
			this.selected = "";
			this.selectedText = "";
		}
		else {
			var text = obj.getAttribute("label");
			this.selected = obj.id;
			this.selectedText = text;
			charpick.setClipboard(text);
		}
	},

	clearSelection : function() {
		var button = document.getElementById(this.selected);
		if (button) {
			button.setAttribute("checked", false);
		}
		this.selected = "";
		this.selectedText = "";
	},
// toolbar actions end

// preferences dialog begin
	listToPref : function() {
		var pref = document.getElementById("palettes");
		var list = document.getElementById("charpick-palette-list");
		var palettes = [];
		for (var index = 0; index < list.itemCount; ++index) {
			palettes.push(list.getItemAtIndex(index).getAttribute("label"));
		}
		pref.value = charpick.mergePaletteList(palettes);
	},

	listFromPref : function() {
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
		var list = document.getElementById("charpick-palette-list");
		var params = {add: false, palette: ""};
		window.openDialog("chrome://charpick/content/add-palette.xul",
			"charpick-add-palette-dialog", "centerscreen,chrome,modal", params);
		if (params.add) {
			var last = list.appendItem(params.palette);
			list.ensureElementIsVisible(last);
			list.selectItem(last);
		}
		charpick.listToPref();
	},

	editPalette : function() {
		var list = document.getElementById("charpick-palette-list");
		if (list.selectedItem) {
			var params = {edit: false, palette: list.selectedItem.label};
			window.openDialog("chrome://charpick/content/edit-palette.xul",
				"charpick-edit-palette-dialog", "centerscreen,chrome,modal", params);
			if (params.edit) {
				list.selectedItem.label = params.palette;
			}
		}
		charpick.listToPref();
	},

	deletePalette : function() {
		var list = document.getElementById("charpick-palette-list");
		if (list.selectedItem) {
			var selectedIndex = list.selectedIndex;
			list.removeItemAt(selectedIndex);
			if (selectedIndex >= list.itemCount) {
				selectedIndex = list.itemCount - 1;
			}
			if (selectedIndex >= 0) {
				var next = list.getItemAtIndex(selectedIndex);
				list.ensureElementIsVisible(next);
				list.selectItem(next);
			}
		}
		charpick.listToPref();
	},

	setTextBox : function() {
		var textbox = document.getElementById("charpick-textbox");
		textbox.value = window.arguments[0].palette;
	},
// preferences dialog end

// listener begin
// Note: the keyword `this' should not be used in event listeners
//       use charpick instead.

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

	observe : function(subject, topic, data) {
		if (topic === "nsPref:changed" && data === "palettes") {
			// reload the palettes whenever the value of
			// extensions.charpick.palettes is changed.
			charpick.loadPalettes();
		}
	},

	init : function() {
		charpick.prefs = Components.classes["@mozilla.org/preferences-service;1"]
			.getService(Components.interfaces.nsIPrefService)
			.getBranch("extensions.charpick.");
		charpick.prefs.QueryInterface(Components.interfaces.nsIPrefBranch2);
		charpick.prefs.addObserver("", charpick, false);

		charpick.loadPalettes();
	},

	terminate : function() {
		charpick.prefs.removeObserver("", charpick);
	}
// listener end
};

window.addEventListener("load", charpick.init, false);
window.addEventListener("unload", charpick.terminate, false);

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
