characterpalette_loadPalette = function(charset)
{
	for (var i = 0; i < 10; ++i)
		document.getElementById("characterpalette" + i).label = charset[i];
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
};

window.addEventListener("load", characterpalette_addPalettes, false);
