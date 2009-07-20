#!/bin/bash

SL_LENGTH=83
# SL_STEAM {{{
STEAM_HEIGHT=6
STEAM_0_0="                      (@@) (  ) (@)  ( )  @@    ()    @     O     @     O      @"
STEAM_0_1="                 (   )"
STEAM_0_2="             (@@@@)"
STEAM_0_3="          (    )"
STEAM_0_4=""
STEAM_0_5="        (@@@)"
STEAM_1_0="                      (  ) (@@) ( )  (@)  ()    @@    O     @     O     @      O"
STEAM_1_1="                 (@@@)"
STEAM_1_2="             (    )"
STEAM_1_3="          (@@@@)"
STEAM_1_4=""
STEAM_1_5="        (   )"
# }}}
# COAL {{{
COAL_HEIGTH=10
COAL[0]="                              "
COAL[1]="                              "
COAL[2]="    _________________         "
COAL[3]="   _|                \\_____A  "
COAL[4]=" =|                        |  "
COAL[5]=" -|                        |  "
COAL[6]="__|________________________|_ "
COAL[7]="|__________________________|_ "
COAL[8]="   |_D__D__D_|  |_D__D__D_|   "
COAL[9]="    \\_/   \\_/    \\_/   \\_/    "
# }}}
# SL BODY {{{
D51STR_WIDTH=54
D51STR_HEIGHT=7
D51STR[0]="      ====        ________                ___________ "
D51STR[1]="  _D _|  |_______/        \\__I_I_____===__|_________| "
D51STR[2]="   |(_)---  |   H\\________/ |   |        =|___ ___|   ${COAL[2]}"
D51STR[3]="   /     |  |   H  |  |     |   |         ||_| |_||   ${COAL[3]}"
D51STR[4]="  |      |  |   H  |__--------------------| [___] |   ${COAL[4]}"
D51STR[5]="  | ________|___H__/__|_____/[][]~\\_______|       |   ${COAL[5]}"
D51STR[6]="  |/ |   |-----------I_____I [][] []  D   |=======|__ ${COAL[6]}"
# }}}
# SL WHEEL {{{
D51WHL_HEIGHT=3
D51WHL_0_0="__/ =| o |=-~~\\  /~~\\  /~~\\  /~~\\ ____Y___________|__ ${COAL[7]}"
D51WHL_0_1=" |/-=|___|=    ||    ||    ||    |_____/~\\___/        ${COAL[8]}"
D51WHL_0_2="  \\_/      \\O=====O=====O=====O_/      \\_/            ${COAL[9]}"

D51WHL_1_0="__/ =| o |=-~~\\  /~~\\  /~~\\  /~~\\ ____Y___________|__ ${COAL[7]}"
D51WHL_1_1=" |/-=|___|=O=====O=====O=====O   |_____/~\\___/        ${COAL[8]}"
D51WHL_1_2="  \\_/      \\__/  \\__/  \\__/  \\__/      \\_/            ${COAL[9]}"

D51WHL_2_0="__/ =| o |=-O=====O=====O=====O \\ ____Y___________|__ ${COAL[7]}"
D51WHL_2_1=" |/-=|___|=    ||    ||    ||    |_____/~\\___/        ${COAL[8]}"
D51WHL_2_2="  \\_/      \\__/  \\__/  \\__/  \\__/      \\_/            ${COAL[9]}"

D51WHL_3_0="__/ =| o |=-~O=====O=====O=====O\\ ____Y___________|__ ${COAL[7]}"
D51WHL_3_1=" |/-=|___|=    ||    ||    ||    |_____/~\\___/        ${COAL[8]}"
D51WHL_3_2="  \\_/      \\__/  \\__/  \\__/  \\__/      \\_/            ${COAL[9]}"

D51WHL_4_0="__/ =| o |=-~~\\  /~~\\  /~~\\  /~~\\ ____Y___________|__ ${COAL[7]}"
D51WHL_4_1=" |/-=|___|=   O=====O=====O=====O|_____/~\\___/        ${COAL[8]}"
D51WHL_4_2="  \\_/      \\__/  \\__/  \\__/  \\__/      \\_/            ${COAL[9]}"

D51WHL_5_0="__/ =| o |=-~~\\  /~~\\  /~~\\  /~~\\ ____Y___________|__ ${COAL[7]}"
D51WHL_5_1=" |/-=|___|=    ||    ||    ||    |_____/~\\___/        ${COAL[8]}"
D51WHL_5_2="  \\_/      \\_O=====O=====O=====O/      \\_/            ${COAL[9]}"
# }}}

clr() {
  echo -e '\033[H\033[2J\c'
}
cursor() {
  echo -e '\033['$2';'$1'H\c'
}
new_screen() {
  echo -e '\033\067\033[?47h\c'
}
exit_screen() {
  echo -e '\033[?47l\033\070\c'
}
substr(){
  local start=$1
  shift
  local length=$1
  shift
  str="$*"
  echo "${str:$start:$length}"
}
sl_steam(){
  local x=$1
  local start=0
  (( x < 0 )) && start=$(( 0 - x )) && x=0
  for (( i=0; i<6; i++ ));do
    cursor $x $(( $2 + i ))
    eval substr $start $(( COLUMNS - $1 )) \""\$STEAM_$3_$i"\"
  done
}
sl_body() {
  local length=$(( COLUMNS - $1 ))
  (( length < 0 )) && return
  local x=$1
  local start=0
  (( x < 0 )) && start=$(( - x )) && x=0
  for (( i=0; i<7; i++ ));do
    cursor $x $(( $2 + i ))
    substr $start $length "${D51STR[$i]}"
  done
}
sl_wheel(){
  local length=$(( COLUMNS - $1 ))
  (( length < 0 )) && return
  local x=$1
  local start=0
  (( x < 0 )) && start=$(( - x )) && x=0
  for (( i=0; i<3; i++ ));do
    cursor $x $(( $2 + i ))
    eval substr $start $length \""\$D51WHL_$3_$i"\"
  done
}

eval `resize`
new_screen
clr
h=$(( (LINES - 16) / 2 ))
c=0;
while (( c < COLUMNS + SL_LENGTH )); do
  x=$(( COLUMNS - c ))
  sl_steam $x $h $(( c % 2 ))
  sl_body $x $(( h + STEAM_HEIGHT ))
  sl_wheel $x $(( h + STEAM_HEIGHT + D51STR_HEIGHT )) $(( c % 6 ))
  for (( i=0; i<500; i++));do
    echo "OK" >/dev/null
  done
  c=$(( c + 1 ))
  clr
done
exit_screen

# vim: sw=2 ts=2 et fdm=marker:
