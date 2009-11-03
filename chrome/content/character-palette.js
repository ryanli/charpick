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
