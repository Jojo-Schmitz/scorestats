S C O R E   S T A T I S T I C S
===
A plugin for MuseScore - version 0.4 - 18.06.2012

---

'Score Statistics' is a MuseScore plugin which lists some statistics about the
current scores; data can also be saved in a .CSV file.

Copyright: 'Score Statistics' has been made by Maurizio M. Gavioli, fixes for 
    voice 4 and checking for a Score being open got provided by Joachim Schmitz


    Do with it whatever you like. The author cannot be held responsible of
    ANYTHING in ANY way! You have been warned.


## INSTALLATION

1.  Extract the files in the "plugins" sub-folder of the main folder where your
    copy of MuseScore is installed in. This creates a "scorestats" sub-folder of
    the "plugins" folder.
2.  Start or re-start MuseScore.

Once run, 'Score Statistics' creates a configuration file, pluginScoreStats.ini,
in the following folder:

- Windows:		%APPDATA%\MusE\
- Linux & Mac OS X:	$HOME/.config/MusE/


## OBTAINING THE STATISTICS

1.  Select the "Score Statistics" plugin from the "Plugins" menu list.
    A dialogue box will be shown with the statistics for the current score.

2.  All durations are expressed as mutiples (or fractions) of a musical note
    value; by default the unit is the quarter note; select a different value
    in the "Unit of measure for lengths" combo box to have the durations
    expressed in a different unit of measure. The plugin will remember the
    selected unit.


## SAVING THE STATISTICS

1.  Select the unit of measure for duration in the "(using ... as a unit) combo
    box; this unit can be different from the unit selected at the top and used
    for showing lengths in the dialogue box (also this setting will be
    remembered byt the plugin).
2.  Press the "Save .csv" button: a dialogue box opens to select a destination file.
3.  Enter a file name and press ENTER: the stats data are saved in the file.
	The plugin will remember the last folder used to export data.

The output file contains all the data displayed by the dialogue box and should
be loadable in a spreadsheet easily.

Distribution of note and, when available, rest lenghts are listed last, to keep
all the fixed parts together at the beginning.


## KNWON LIMITATIONS

'Score Statistics' has the following limitations:

1.  'Score Statistics' requires at least MuseScore version 0.9.6 beta 2 in
    order to run.

2.  Tied notes are not taken into account yet: each note is considered an
    indipendent note and accounted as such.


Any suggestion is welcome!

Enjoy!
	Maurizio M. Gavioli & Joachim Schmitz
