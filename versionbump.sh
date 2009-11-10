#!/bin/bash
# versiondump.sh
# Script used for updating version strings
# in source files.
#
# Usage:
# ./versiondump.sh {VERSION}
# Example:
# ./versiondump.sh 0.1
#
# Copyright (c) 2009 Ryan Li

sed -i "s|\"version\">.*<|\"version\">$1<|g" ./chrome/content/about.xul
sed -i "s|<em:version>.*</em:version>|<em:version>$1</em:version>|g" ./install.rdf
