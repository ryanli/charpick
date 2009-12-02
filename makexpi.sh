#!/bin/bash
# makexpi.sh
# This script is used for generate xpi file
# from the latest source.
#
# Only tested under GNU/Linux, for maintainer
# use only.
#
# Licensed under GNU GPLv3.
# Copyright (c) 2009, Ryan Li <ryan@ryanium.com>

zip -q charpick.xpi -r * -x makexpi.sh screenshot.png charpick.xpi
