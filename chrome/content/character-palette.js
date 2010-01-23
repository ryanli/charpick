if (!com)
	var com = {};
if (!com.ryanium)
	com.ryanium = {};
if (!com.ryanium.characterpalette)
	com.ryanium.characterpalette = {};
com.ryanium.characterpalette = {
	prefManager : Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefBranch),
	getString : function(key)
	{
		return this.prefManager.getComplexValue("extensions.character-palette." + key, Components.interfaces.nsISupportsString).data;
	},
	setString : function(key, val)
	{
		var str = Components.classes["@mozilla.org/supports-string;1"].createInstance(Components.interfaces.nsISupportsString);
		str.data = val;
		this.prefManager.setComplexValue("extensions.character-palette." + key, Components.interfaces.nsISupportsString, str);
	},
	getInteger : function(key)
	{
		var val;
		try
		{
			val = this.prefManager.getIntPref("extensions.character-palette." + key);
		}
		catch (e)
		{
			return null;
		}
		return val;
	},
	setInteger : function(key, val)
	{
		this.prefManager.setIntPref("extensions.character-palette." + key, val);
	},
	getPalettes : function()
	{
		var palettes = com.ryanium.characterpalette.getString("palettes");
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
		com.ryanium.characterpalette.setString('palettes', merged);
	},
	addPalettes : function()
	{
		var palettes = com.ryanium.characterpalette.getPalettes();
		var popup = document.getElementById("character-palette-popup");
		var seperator = document.getElementById("character-palette-menu-seperator");

		while (popup.getElementsByClassName("charset").length)
			popup.removeChild(popup.getElementsByClassName("charset")[0]);
	
		for (var index in palettes)
		{
			var palette = document.createElement("menuitem");
			palette.setAttribute("class", "charset");
			palette.setAttribute("group", "charset");
			palette.setAttribute("type", "radio");
			palette.setAttribute("oncommand", "com.ryanium.characterpalette.loadPalette(" + index + ", this.label);");
			palette.setAttribute("label", palettes[index]);
			popup.insertBefore(palette, seperator);
		}
		var selected = 0;
		if (com.ryanium.characterpalette.getInteger("selected"))
			selected = com.ryanium.characterpalette.getInteger("selected");
		if (!popup.getElementsByClassName("charset")[selected])
			selected = 0;
		popup.getElementsByClassName("charset")[selected].setAttribute("checked", "true");
		com.ryanium.characterpalette.loadPalette(selected, palettes[selected]);
	},
	loadPalette : function(index, charset)
	{
		com.ryanium.characterpalette.setInteger("selected", index);
		var container = document.getElementById("character-palette-buttons");
		while (container.childNodes.length)
			container.removeChild(container.firstChild);

		for (var charIndex in charset)
		{
			var charButton = document.createElement("toolbarbutton");
			charButton.setAttribute("class", "character-palette-char");
			charButton.setAttribute("oncommand", "com.ryanium.characterpalette.append(this);");
			charButton.setAttribute("label", charset[charIndex]);
			container.appendChild(charButton);
		}
	},
	append : function(obj)
	{
		document.getElementById("character-palette-pickbox").value += obj.label;
	},
	copy : function()
	{
		var pickbox = document.getElementById("character-palette-pickbox");
		const gClipboardHelper = Components.classes["@mozilla.org/widget/clipboardhelper;1"].getService(Components.interfaces.nsIClipboardHelper);
		gClipboardHelper.copyString(pickbox.value);
	},
	clear : function()
	{
		var pickbox = document.getElementById("character-palette-pickbox");
		pickbox.value = "";
	},
	loadList : function()
	{
		var list = document.getElementById("character-palette-palette-list");
		var palettes = com.ryanium.characterpalette.getPalettes();
		for (index in palettes)
			list.appendItem(palettes[index]);
	},
	save : function()
	{
		var list = document.getElementById("character-palette-palette-list");
		if (list == null)
			return true;
		var palettes = new Array();
		for (var child = list.firstChild; child != null; child = child.nextSibling)
			palettes.push(child.getAttribute('label'));
		com.ryanium.characterpalette.setPalettes(palettes);
		return true;
	},
	addPalette : function()
	{
		var list = document.getElementById("character-palette-palette-list");
		var params = {add: false, palette: ""};
		window.openDialog('chrome://character-palette/content/add-palette.xul', 'character-palette-add-palette-dialog', 'centerscreen,chrome,modal', params);
		if (params.add)
			list.appendItem(params.palette);
	},
	editPalette : function()
	{
		var list = document.getElementById("character-palette-palette-list");
		if (list)
		{
			var selected = list.selectedItem;
			if (selected)
			{
				var orig = selected.label;
				var params = {edit: false, palette: orig};
				window.openDialog('chrome://character-palette/content/edit-palette.xul', 'character-palette-edit-palette-dialog', 'centerscreen,chrome,modal', params);
				if (params.edit)
					selected.label = params.palette;
			}
		}
	},
	deletePalette : function()
	{
		var list = document.getElementById("character-palette-palette-list");
		if (list)
			list.removeItemAt(list.selectedIndex);
	},
	setTextBox : function()
	{
		var textbox = document.getElementById("character-palette-textbox");
		textbox.value = window.arguments[0].palette;
	},
	openUpdatePage : function()
	{
		window.openUILinkIn("http://wiki.github.com/ryanli/charpick/updating-from-03", "tab");
	},
	checkUpdate : function()
	{
		var shown = com.ryanium.characterpalette.getInteger("updateShown");
		if (shown != 1)
		{
			setTimeout(com.ryanium.characterpalette.openUpdatePage, 500);
			com.ryanium.characterpalette.setInteger("updateShown", 1);
		}
	}
};
window.addEventListener("load", com.ryanium.characterpalette.addPalettes, false);
window.addEventListener("load", com.ryanium.characterpalette.checkUpdate, false);
