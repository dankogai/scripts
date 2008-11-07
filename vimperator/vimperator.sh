#!/bin/sh

FIREFOX=~/opt/firefox/firefox

DEFAULT_PROFILE=def
ARGS="-P"
export VIMPERATOR_HOME=~/vimperator/${1:-${DEFAULT_PROFILE}}

function run {
	echo "$@" > ~/bin/fx.log
	${FIREFOX} "$@"
	exit $?;
}
for arg in "$@"
do
	case $arg in
	-ProfileManager) run $arg;;
	-h) run $arg;;
	-help) run $arg;;
	*?) ARGS="${ARGS} $arg"
	esac
done

[ "$ARGS" = "-P" ] && ARGS="-P ${DEFAULT_PROFILE}"
run ${ARGS} 

