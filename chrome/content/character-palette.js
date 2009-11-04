characterpalette_loadPalette = function(charset)
{
	var container = document.getElementById("characterpalette-buttons");
	var textbox = document.getElementById("charbox");
	while (container.childNodes.length)
		container.removeChild(container.firstChild);

	for (var index in charset)
	{
		var charButton = document.createElement("toolbarbutton");
		charButton.setAttribute("class", "characterpalette-char");
		charButton.setAttribute("oncommand", "characterpalette_append(this);");
		charButton.setAttribute("label", charset[index]);
		container.appendChild(charButton);
	}
};

characterpalette_append = function(obj)
{
	document.getElementById("charbox").value += obj.label;
};

characterpalette_copyToClipboard = function(str)
{
	const gClipboardHelper = Components.classes["@mozilla.org/widget/clipboardhelper;1"].
	getService(Components.interfaces.nsIClipboardHelper);
	gClipboardHelper.copyString(str);
};

characterpalette_addPalettes = function()
{
	var palettes = ["ÁÀĂÂǍÄÃȀÅĀ", "áàăâǎäãȁåā", "ĆćĈĉČčÇç¢ñ", "ÉéÈèĔĕÊêĚě", "ÍÌĬÎǏÏĮĨĪȈ", "íìĭîǐïįĩīȉ",
		"ǑȌÝýỲỳŶŷ¥£", "óòŏôǒöőõøȍ", "ÚÙŬÛǓŮÜŰŨŪ", "úùŭûǔůüűũū"];
	var popup = document.getElementById("characterpalette-popup");
	var seperator = document.getElementById("characterpalette-menu-seperator");
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
