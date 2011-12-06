#!/bin/bash
#
# CAT
#

CAT_LENGTH=85
CAT_HEIGHT=13
CAT[0]='                    lヽ、                   /ヽ'
CAT[1]="                    i!  ﾞヽ、            ／   ﾞi!           ..,,  .,,.\;\;\'\'⌒ヽ"
CAT[2]="                    l       ゝ-─‐-／\'       i!   , ,__,,;\'\"   \"\';       ,ﾉ\""
CAT[3]="                  ,／\"                        i!\'\'\"   ....ﾞ\'\'\;\;..,,\;\;    ,,Y\""
CAT[4]="                ,/\'                           〈                  \'i\;\;- ､,,    "
CAT[5]="                i\'                             \'i,                         ﾞ\"ヽ、  "
CAT[6]="                i!  ●          ●       ＊ ,\'i                             ﾞ）"
CAT[7]="                \'i,:::    ﾄ─‐ｲ      :::::::    ,/        \'          ﾞ\",;\'\'i,-‐\'\""
CAT[8]="          ,,-‐\'\'\"ヽ､    ヽ,_ノ         ,,-‐                  ,..\;\;\;ﾞ\""
CAT[9]="        （        ,,, \'\'          ,,.-‐\'\'\"              ,,\'\"´｀\'´"
CAT[10]="         ヽ,..-‐\'\'       ,.-‐\'\'\"            ノ-‐\'\'\"´"
CAT[11]="                      （             ,. -\'\""
CAT[12]="                         ヽ、,,.. -‐\'\'\'\""


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
show_cat() {
  local length=$(( COLUMNS - $1 ))
  (( length < 0 )) && return
  local x=$1
  local y=$2
  local start=0
  local length=$(( COLUMNS - $1 ))
  local p1=$(( $3 % 2 ))
  local p2=$(( $3 % 6 ))
  (( x < 0 )) && start=$(( - x )) x=0
  for (( i=0; i < CAT_HEIGHT; i++ ));do
    cursor $x $(( y++ ))
    substr $start $length "${CAT[$i]}"
  done
}

#eval `resize`
COLUMNS=`tput cols`
LINES=`tput lines`
new_screen
clr
#h=$(( (LINES - STEAM_HEIGHT - D51STR_HEIGHT - D51WHL_HEIGHT) / 2 ))
h=$(( (LINES - CAT_HEIGHT) / 2 ))
c=0;
# while (( c < COLUMNS + SL_LENGTH )); do
while (( c < COLUMNS + CAT_LENGTH )); do
  x=$(( COLUMNS - c ))
  show_cat $x $h $c
  for (( i=0; i<100; i++));do
    echo "" >/dev/null
  done
  #sleep 0.01
  c=$(( c + 1 ))
  clr
done
exit_screen

# vim: sw=2 ts=2 et fdm=marker:
