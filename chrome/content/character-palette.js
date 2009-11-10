function characterpalette_prefManager()
{
	return Components.classes["@mozilla.org/preferences-service;1"].
		getService(Components.interfaces.nsIPrefBranch);
}

function characterpalette_getString(key)
{
	return characterpalette_prefManager().getComplexValue("extensions.character-palette." + key,
		Components.interfaces.nsISupportsString).data;
}

function characterpalette_setString(key, val)
{
	var str = Components.classes["@mozilla.org/supports-string;1"]
		.createInstance(Components.interfaces.nsISupportsString);
	str.data = val;
	characterpalette_prefManager().setComplexValue("extensions.character-palette." + key,
		Components.interfaces.nsISupportsString, str);
}

function characterpalette_getInteger(key)
{
	return characterpalette_prefManager().getIntPref("extensions.character-palette." + key);
}

function characterpalette_setInteger(key, val)
{
	characterpalette_prefManager().setIntPref("extensions.character-palette." + key, val);
}

function characterpalette_getPalettes()
{
	var palettes = characterpalette_getString("palettes");
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
}

function characterpalette_setPalettes(a)
{
	var merged = new String();
	for (var index in a)
		merged += a[index].replace(/;/g, ';;') + ';';
	characterpalette_setString('palettes', merged);
}

function characterpalette_addPalettes()
{
	var palettes = characterpalette_getPalettes();
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
		palette.setAttribute("oncommand", "characterpalette_loadPalette(" + index + ", this.label);");
		palette.setAttribute("label", palettes[index]);
		popup.insertBefore(palette, seperator);
	}
	var selected = 0;
	if (characterpalette_getInteger("selected"))
		selected = characterpalette_getInteger("selected");
	if (!popup.getElementsByClassName("charset")[selected])
		selected = 0;
	popup.getElementsByClassName("charset")[selected].setAttribute("checked", "true");
	characterpalette_loadPalette(selected, palettes[selected]);
}

function characterpalette_loadPalette(index, charset)
{
	characterpalette_setInteger("selected", index);
	var container = document.getElementById("character-palette-buttons");
	while (container.childNodes.length)
		container.removeChild(container.firstChild);

	for (var charIndex in charset)
	{
		var charButton = document.createElement("toolbarbutton");
		charButton.setAttribute("class", "character-palette-char");
		charButton.setAttribute("oncommand", "characterpalette_append(this);");
		charButton.setAttribute("label", charset[charIndex]);
		container.appendChild(charButton);
	}
}

function characterpalette_append(obj)
{
	document.getElementById("character-palette-pickbox").value += obj.label;
}

function characterpalette_copy()
{
	var pickbox = document.getElementById("character-palette-pickbox");
	const gClipboardHelper = Components.classes["@mozilla.org/widget/clipboardhelper;1"].
		getService(Components.interfaces.nsIClipboardHelper);
	gClipboardHelper.copyString(pickbox.value);
}

function characterpalette_clear()
{
	var pickbox = document.getElementById("character-palette-pickbox");
	pickbox.value = "";
}

function characterpalette_loadList()
{
	var list = document.getElementById("character-palette-palette-list");
	var palettes = characterpalette_getPalettes();
	for (index in palettes)
		list.appendItem(palettes[index]);
}

function characterpalette_save()
{
	var list = document.getElementById("character-palette-palette-list");
	if (list == null)
		return true;
	var palettes = new Array();
	for (var child = list.firstChild; child != null; child = child.nextSibling)
		palettes.push(child.getAttribute('label'));
	characterpalette_setPalettes(palettes);
	return true;
}

function characterpalette_addPalette()
{
}

function characterpalette_editPalette()
{
}

function characterpalette_deletePalette()
{
	var list = document.getElementById("character-palette-palette-list");
	if (list)
		list.removeItemAt(list.selectedIndex);
}

window.addEventListener("load", characterpalette_addPalettes, false);
