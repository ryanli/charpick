characterpalette_loadPalette = function(charset)
{
	var container = document.getElementById("character-palette-buttons");
	while (container.childNodes.length)
		container.removeChild(container.firstChild);

	for (var index in charset)
	{
		var charButton = document.createElement("toolbarbutton");
		charButton.setAttribute("class", "character-palette-char");
		charButton.setAttribute("oncommand", "characterpalette_append(this);");
		charButton.setAttribute("label", charset[index]);
		container.appendChild(charButton);
	}
};

characterpalette_append = function(obj)
{
	document.getElementById("character-palette-pickbox").value += obj.label;
};

characterpalette_copy = function()
{
	var pickbox = document.getElementById("character-palette-pickbox");
	const gClipboardHelper = Components.classes["@mozilla.org/widget/clipboardhelper;1"].
	getService(Components.interfaces.nsIClipboardHelper);
	gClipboardHelper.copyString(pickbox.value);
};

characterpalette_clear = function()
{
	var pickbox = document.getElementById("character-palette-pickbox");
	pickbox.value = "";
};

characterpalette_addPalettes = function()
{
	var palettes = ["ÁÀĂÂǍÄÃȀÅĀ", "áàăâǎäãȁåā", "ĆćĈĉČčÇç¢ñ", "ÉéÈèĔĕÊêĚě", "ÍÌĬÎǏÏĮĨĪȈ", "íìĭîǐïįĩīȉ",
		"ǑȌÝýỲỳŶŷ¥£", "óòŏôǒöőõøȍ", "ÚÙŬÛǓŮÜŰŨŪ", "úùŭûǔůüűũū"];
	var popup = document.getElementById("character-palette-popup");
	var seperator = document.getElementById("character-palette-menu-seperator");
	for (var index in palettes)
	{
		var palette = document.createElement("menuitem");
		palette.setAttribute("class", "charset");
		palette.setAttribute("group", "charset");
		palette.setAttribute("type", "radio");
		palette.setAttribute("oncommand", "characterpalette_loadPalette(this.label);");
		palette.setAttribute("label", palettes[index]);
		popup.insertBefore(palette, seperator);
	}
	popup.getElementsByClassName("charset")[0].setAttribute("checked", "true");
	characterpalette_loadPalette(palettes[0]);
};

window.addEventListener("load", characterpalette_addPalettes, false);
