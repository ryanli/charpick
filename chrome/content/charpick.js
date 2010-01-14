var charpick = {

	selected : '',
	selectedText : '',

// utils begin
	prefManager : Components
		.classes["@mozilla.org/preferences-service;1"]
		.getService(Components.interfaces.nsIPrefBranch),

	getStringPref : function(key) {
		return this.prefManager.
			getComplexValue("extensions.charpick." + key, Components.interfaces.nsISupportsString)
			.data;
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
		return this.prefManager.getIntPref("extensions.charpick." + key);
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
			if (!clip)
				return false;

			var trans = Components
				.classes["@mozilla.org/widget/transferable;1"]
				.createInstance(Components.interfaces.nsITransferable);
			if (!trans)
				return false;
			trans.addDataFlavor("text/unicode");

			var str = new Object();
			var strLength = new Object();

			clip.getData(trans, clip.kGlobalClipboard);

			trans.getTransferData("text/unicode", str, strLength);
			if (str)
				str = str.value.QueryInterface(Components.interfaces.nsISupportsString);
			if (str)
				ret.Global = str.data.substring(0, strLength.value / 2);

			var str_ = new Object();
			var strLength_ = new Object();

			clip.getData(trans, clip.kSelectionClipboard);

			trans.getTransferData("text/unicode", str_, strLength_);
			if (str_)
				str_ = str_.value.QueryInterface(Components.interfaces.nsISupportsString);
			if (str)
				ret.Selection = str_.data.substring(0, strLength_.value / 2);

			return ret;
		}
		catch (e) {
			return false;
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

	selectPalette : function(index, charset) {
		this.selected = '';
		this.selectedText = '';
		charpick.setIntegerPref("selected", index);
		var container = document.getElementById("charpick-buttons");
		while (container.childNodes.length) {
			container.removeChild(container.firstChild);
		}

		var copyString = document.getElementById('charpick-strings').getString('copy');

		for (var charIndex in charset) {
			var charButton = document.createElement("toolbarbutton");
			charButton.setAttribute("id", "charpick-char-" + charIndex);
			charButton.setAttribute("class", "charpick-char");
			charButton.setAttribute("group", "charpick-char");
			charButton.setAttribute("type", "radio");
			charButton.setAttribute("tooltiptext", copyString);
			charButton.setAttribute("oncommand", "charpick.selectChar(this);");
			charButton.setAttribute("label", charset[charIndex]);
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
			if (selection.Global != text || selection.Selection != text) {
				charpick.clearSelection();
			}
		}
	},
// toolbar actions end

// preferences dialog begin
	loadPaletteList : function() {
		var list = document.getElementById("charpick-palette-list");
		var palettes = charpick.getPalettes();
		for (index in palettes)
			list.appendItem(palettes[index]);
	},

	savePalettes : function() {
		var list = document.getElementById("charpick-palette-list");
		if (list == null)
			return true;
		var palettes = new Array();
		for (var child = list.firstChild; child != null; child = child.nextSibling)
			palettes.push(child.getAttribute('label'));
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
				if (params.edit)
					selected.label = params.palette;
			}
		}
	},

	deletePalette : function() {
		var list = document.getElementById("charpick-palette-list");
		if (list)
			list.removeItemAt(list.selectedIndex);
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

// listener begin
	init : function() {
		charpick.loadPalettes();
		charpick.clipboardListener();
	}
// listener end
};

window.addEventListener("load", charpick.init, false);

// so we need many event listeners in order to monitor clipboard change
window.addEventListener("focus", charpick.clipboardListener, false);
window.addEventListener("blur", charpick.clipboardListener, false);
window.addEventListener("click", charpick.clipboardListener, false);
window.addEventListener("mouseover", charpick.clipboardListener, false);
window.addEventListener("mouseout", charpick.clipboardListener, false);
window.addEventListener("mousedown", charpick.clipboardListener, false);
window.addEventListener("mouseup", charpick.clipboardListener, false);
window.addEventListener("mousemove", charpick.clipboardListener, false);
