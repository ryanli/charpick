if (!com)
	var com = {};
if (!com.ryanium)
	com.ryanium = {};
if (!com.ryanium.charpick)
	com.ryanium.charpick = {};

com.ryanium.charpick = {

// utils begin
	prefManager : Components
		.classes["@mozilla.org/preferences-service;1"]
		.getService(Components.interfaces.nsIPrefBranch),

	getStringPref : function(key)
	{
		return this.prefManager.
			getComplexValue("extensions.charpick." + key, Components.interfaces.nsISupportsString)
			.data;
	},

	setStringPref : function(key, val)
	{
		var str = Components
			.classes["@mozilla.org/supports-string;1"]
			.createInstance(Components.interfaces.nsISupportsString);
		str.data = val;
		this.prefManager
			.setComplexValue("extensions.charpick." + key, Components.interfaces.nsISupportsString, str);
	},

	getIntegerPref : function(key)
	{
		return this.prefManager.getIntPref("extensions.charpick." + key);
	},

	setIntegerPref : function(key, val)
	{
		this.prefManager.setIntPref("extensions.charpick." + key, val);
	},

	setClipboard : function(str)
	{
		const gClipboardHelper = Components
			.classes["@mozilla.org/widget/clipboardhelper;1"]
			.getService(Components.interfaces.nsIClipboardHelper);
		gClipboardHelper.copyString(str);
	},
// utils end

// palette prefs begin
	getPalettes : function()
	{
		var palettes = com.ryanium.charpick.getStringPref("palettes");
		var index = 0;
		var ret = new Array();
		while (index < palettes.length)
		{
			var current = new String();
			while (index < palettes.length)
			{
				if (palettes[index] != ';')
				{
					current += palettes[index];
					++index;
				}
				else if (index < palettes.length - 1 && palettes[index + 1] == ';')
				{
					current += ';';
					index += 2;
				}
				else
				{
					++index;
					break;
				}
			}
			if (current.length)
				ret.push(current);
		}
		return ret;
	},

	setPalettes : function(a)
	{
		var merged = new String();
		for (var index in a)
			merged += a[index].replace(/;/g, ';;') + ';';
		com.ryanium.charpick.setStringPref('palettes', merged);
	},
// palette prefs end

// toolbar actions begin
	loadPalettes : function()
	{
		var palettes = com.ryanium.charpick.getPalettes();
		var popup = document.getElementById("charpick-popup");
		var seperator = document.getElementById("charpick-menu-seperator");

		while (popup.getElementsByClassName("charset").length)
			popup.removeChild(popup.getElementsByClassName("charset")[0]);

		for (var index in palettes)
		{
			var palette = document.createElement("menuitem");
			palette.setAttribute("class", "charset");
			palette.setAttribute("group", "charset");
			palette.setAttribute("type", "radio");
			palette.setAttribute("oncommand", "com.ryanium.charpick.selectPalette(" + index + ", this.label);");
			palette.setAttribute("label", palettes[index]);
			popup.insertBefore(palette, seperator);
		}
		var selected = 0;
		if (com.ryanium.charpick.getIntegerPref("selected"))
			selected = com.ryanium.charpick.getIntegerPref("selected");
		if (!popup.getElementsByClassName("charset")[selected])
			selected = 0;
		popup.getElementsByClassName("charset")[selected].setAttribute("checked", "true");
		com.ryanium.charpick.selectPalette(selected, palettes[selected]);
	},

	selectPalette : function(index, charset)
	{
		this.selected = '';
		com.ryanium.charpick.setIntegerPref("selected", index);
		var container = document.getElementById("charpick-buttons");
		while (container.childNodes.length)
			container.removeChild(container.firstChild);

		for (var charIndex in charset)
		{
			var charButton = document.createElement("toolbarbutton");
			charButton.setAttribute("id", "charpick-char-" + charIndex);
			charButton.setAttribute("class", "charpick-char");
			charButton.setAttribute("group", "charpick-char");
			charButton.setAttribute("type", "radio");
			charButton.setAttribute("oncommand", "com.ryanium.charpick.selectChar(this);");
			charButton.setAttribute("label", charset[charIndex]);
			container.appendChild(charButton);
		}
	},

	selectChar : function(obj)
	{
		if (obj.id == this.selected)
		{
			obj.setAttribute("checked", false);
			this.selected = '';
		}
		else
		{
			this.selected = obj.id;
			com.ryanium.charpick.setClipboard(obj.getAttribute('label'));
		}
	},
// toolbar actions end

// preferences dialog begin
	loadPaletteList : function()
	{
		var list = document.getElementById("charpick-palette-list");
		var palettes = com.ryanium.charpick.getPalettes();
		for (index in palettes)
			list.appendItem(palettes[index]);
	},

	savePalettes : function()
	{
		var list = document.getElementById("charpick-palette-list");
		if (list == null)
			return true;
		var palettes = new Array();
		for (var child = list.firstChild; child != null; child = child.nextSibling)
			palettes.push(child.getAttribute('label'));
		com.ryanium.charpick.setPalettes(palettes);
		return true;
	},

	addPalette : function()
	{
		var list = document.getElementById("charpick-palette-list");
		var params = {add: false, palette: ""};
		window.openDialog('chrome://charpick/content/add-palette.xul',
			'charpick-add-palette-dialog', 'centerscreen,chrome,modal', params);
		if (params.add)
			list.appendItem(params.palette);
	},

	editPalette : function()
	{
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

	deletePalette : function()
	{
		var list = document.getElementById("charpick-palette-list");
		if (list)
			list.removeItemAt(list.selectedIndex);
	},

	setTextBox : function()
	{
		var textbox = document.getElementById("charpick-textbox");
		textbox.value = window.arguments[0].palette;
	},

	loadMiddleClick : function()
	{
		var middleClick = document.getElementById("charpick-middle-click-paste");
		var enabled = this.prefManager.getBoolPref("middlemouse.paste");
		middleClick.setAttribute('checked', enabled);
	},

	saveMiddleClick : function()
	{
		var middleClick = document.getElementById("charpick-middle-click-paste");
		this.prefManager.setBoolPref("middlemouse.paste", middleClick.hasAttribute('checked'));
		return true;
	},

	loadPrefs : function()
	{
		com.ryanium.charpick.loadPaletteList();
		com.ryanium.charpick.loadMiddleClick();
	},

	savePrefs : function()
	{
		return com.ryanium.charpick.savePalettes() && com.ryanium.charpick.saveMiddleClick();
	},
// preferences dialog end

// listener begin
	init : function()
	{
		com.ryanium.charpick.loadPalettes();
	}
// listener end
};

window.addEventListener("load", com.ryanium.charpick.init, false);
