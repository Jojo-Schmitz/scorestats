//=============================================================================
//  MuseScore
//  Linux Music Score Editor
//
//  " S C O R E  S T A T I S T I C S " plugin
//
//	Collects and lists some statistics about the current score.
//	Version 0.3 - Date 02.06.2012
//
//	By Maurizio M. Gavioli, 2010.
//
//  MuseScore: Copyright (C)2008 Werner Schweer and others
//
//  This program is free software; you can redistribute it and/or modify
//  it under the terms of the GNU General Public License version 2.
//
//  This program is distributed in the hope that it will be useful,
//  but WITHOUT ANY WARRANTY; without even the implied warranty of
//  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
//  GNU General Public License for more details.
//
//  You should have received a copy of the GNU General Public License
//  along with this program; if not, write to the Free Software
//  Foundation, Inc., 675 Mass Ave, Cambridge, MA 02139, USA.
//=============================================================================

// Arrays containing the number of occurrences and the total duration of each pitch
var g_numOfPitches = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
var g_lenOfPitches = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

// Arrays containing the occurrences of each note duration and of each rest duration
var g_noteLengths = [];
var g_restLengths = [];

// Array with the note names used for output
var g_noteNames = ["C", "C#/Db", "D", "D#/Eb", "E", "F", "F#/Gb", "G", "G#/Ab", "A", "A#/Bb", "B"];

// array with duration of each unit
var g_nDurations = [0, 30, 60, 120, 240, 480, 960, 1920];
var	g_szDurNames= ["-", "1/64", "1/32", "1/16", "Crochet", "Quaver", "Half note", "Whole note"];

// variables with totals
var g_numOfPages = 0;
var g_numOfBars  = 0;
var g_numOfParts = 0;
var g_lenOfNotes = 0;
var g_lenOfRests = 0;
var g_numOfNotes = 0;
var g_numOfRests = 0;

// the INI settings
var	g_szOrgName		= "MusE"
var	g_szAppName		= "pluginScorestats";
var	g_szPathsSect	= "Paths";
var	g_szCSVPathKey	= g_szPathsSect + "/CSVPath";
var	g_szUnitsSect	= "Units";
var g_szCSVUnit		= g_szUnitsSect + "/csv";
var g_szUIUnit		= g_szUnitsSect + "/ui";
var	g_szExportPath;
var g_nCSVUnit		= 5;
var g_nUIUnit		= 5;
var	g_bDirty		= false;

var g_form;			// the UI dialog box

//---------------------------------------------------------
//	init()
//	this function will be called on startup of mscore
//---------------------------------------------------------

function init()
{
};

//-------------------------------------------------------------------
//	run()
//	this function will be called when activating the plugin menu entry
//
//	global Variables:
//	pluginPath - contains the plugin path; file separator is "/"
//-------------------------------------------------------------------

function run()
{	var		chordnote, staff, voice;
	var		cursor;
	var		idx;
	var		length, note, pitch;
	var		numOfChordNotes;

	loadIni();

	// determine version
	if( !(this.mscoreVersion != undefined && this.mscoreVersion >= 906) )
	{	QMessageBox.critical(null, "Unsupported version", "This version of MuseScore is not suppored.\nPlease upgrade to a more recent version.");
		return;
	}
	// no score open (MuseScore 2.0+, can't happen earlier)
	if (typeof curScore === 'undefined')
		return;

	// score totals (not implemented in some older MuseScore versions)
	if(curScore.parts != undefined)
		g_numOfParts	= curScore.parts;
	if(curScore.pages != undefined)
		g_numOfPages	= curScore.pages;
	if(curScore.measures != undefined)
		g_numOfBars		= curScore.measures;
	cursor = new Cursor(curScore);

	// for each cursor step of each voice of each staff
	for (staff = 0; staff < curScore.staves; ++staff)
	{	cursor.staff = staff;
		for (voice = 0; voice < 4; voice++)
		{	cursor.voice = voice;
			cursor.rewind();  // set cursor to first chord/rest
			while (!cursor.eos())
			{	// if cursor is at a chord, get chord duration
				if (cursor.isChord())
				{	length			= cursor.chord().tickLen;
					numOfChordNotes	= cursor.chord().notes;
					g_numOfNotes += numOfChordNotes;
					// enumerate chord notes and get the pitch and the duration of each
					for (chordnote = 0; chordnote < numOfChordNotes; chordnote++)
					{	note	= cursor.chord().note(chordnote);
						pitch	= note.pitch % 12;
						g_numOfPitches[pitch]++;
						g_lenOfPitches[pitch] += length;
						g_lenOfNotes += length;
						if(g_noteLengths[length] == undefined)
							g_noteLengths[length] = 1;
						else
							g_noteLengths[length]++;
					}
				}
				// if cursor is at a rest, get its duration
				else if (cursor.isRest())
				{	g_numOfRests++;
					length = cursor.rest().tickLen;
					g_lenOfRests += length;
					if(g_restLengths[length] == undefined)
						g_restLengths[length] = 1;
					else
						g_restLengths[length]++;
				}
				cursor.next();
			}
		}
	}

	// create UI
	var loader = new QUiLoader(null);
	var file   = new QFile(pluginPath + "/scorestats.ui");
	file.open(QIODevice.OpenMode(QIODevice.ReadOnly, QIODevice.Text));
	g_form = loader.load(file, null);
	// init dlg controls
	g_form.comboCSVUnit.setCurrentIndex(g_nCSVUnit-1);
	g_form.comboUIUnit.setCurrentIndex(g_nUIUnit-1);
	// connect signals to slots
	g_form.comboCSVUnit["currentIndexChanged(int)"].connect(dlgSetCSVUnit);
	g_form.comboUIUnit["currentIndexChanged(int)"].connect(dlgSetUIUnit);
	g_form.pushSave.clicked.connect(dlgSave);
	g_form.pushOk.clicked.connect(dlgAccept);

	// fill summary
	if(g_numOfParts != 0)
		g_form.listParts.setText("" + g_numOfParts);
	if(g_numOfPages != 0)
		g_form.listPages.setText("" + g_numOfPages);
	if(g_numOfBars != 0)
		g_form.listBars.setText("" + g_numOfBars);

	// fill number of occurrences of pitches
	for(idx=0; idx < 12; idx++)
	{	g_form["lName"+idx].setText   ("<b>" + g_noteNames[idx] + "</b>");
		g_form["lOccurr"+idx].setText ("" + g_numOfPitches[idx]);
	}

	// fill notes and rest totals
	g_form.listNoteTotNum.setText("" + g_numOfNotes);
	g_form.listRestTotNum.setText("" + g_numOfRests);

	dlgDisplayDurations();

	g_form.show();								// show the dlg
};

//---------------------------------------------------------
//	dlgSetUIUnit(int)
//	called when user changes the selected item in the comboUIUnit
//	sets the new UI unit and updates the duration values in the dlg
//---------------------------------------------------------

function dlgSetUIUnit(nUIUnit)
{
	g_nUIUnit	= nUIUnit + 1;
	g_bDirty	= true;
	dlgDisplayDurations();
};

//---------------------------------------------------------
//	dlgSetCSVUnit(int)
//	called when user changes the selected item in the comboCSVUnit:
//	simply sets the configuration flag as dirty.
//---------------------------------------------------------

function dlgSetCSVUnit(nUIUnit)
{
	g_bDirty	= true;
};

//---------------------------------------------------------
//	dlgDisplayDurations()
//	sets the text of the dlg controls showing a duration, using the
//	current g:nUIUnit as duration unit.
//---------------------------------------------------------

function dlgDisplayDurations()
{	var		idx, text, unit;

	unit = g_nDurations[g_nUIUnit];
	// fill durations of pitches
	for(idx=0; idx < 12; idx++)
		g_form["lLen"+idx].setText("" + (g_lenOfPitches[idx] / unit).toPrecision(6));

	// build and show summary of note and rest length distribution
	text = "";
	for(idx in g_noteLengths)
	{	text += "" + (idx/unit).toPrecision(6) + ":\t" + g_noteLengths[idx] + "\n";
	}
	g_form.listNoteLen.setPlainText(text);
	text = "";
	for(idx in g_restLengths)
	{	text += "" + (idx/unit).toPrecision(6) + ":\t" + g_restLengths[idx] + "\n";
	}
	g_form.listRestLen.setPlainText(text);

	// show note and rest totals
	g_form.listNoteTotLen.setText("" + (g_lenOfNotes/unit).toPrecision(6) );
	if(g_lenOfRests != 0)
		g_form.listRestTotLen.setText("" + (g_lenOfRests/unit).toPrecision(6) );

};

//---------------------------------------------------------
//	dlgSave()
//	called when user presses the "Save" button
//	saves the collected data in a .CSV text file
//---------------------------------------------------------

function dlgSave()
{	var		idx, unit;

	// open a file selection dlg
	var fName = QFileDialog.getSaveFileName(g_form, "Select .csv file to create",
			g_szCSVPath, "CSV file (*.csv)", 0);
	if(fName == null || fName == "")
		return;

	// open data file as a text stream
	var file = new QFile(fName);
	if(file.exists())
		file.remove();
	if( !file.open(QIODevice.ReadWrite) )
	{	QMessageBox.critical(g_form, "File Error", "Could not create csv file " + fName);
		return;
	}
	var textStream = new QTextStream(file);

	// get user-requested unit
	unit = g_nDurations[g_form.comboCSVUnit.currentIndex + 1];
	// output title and lenght unit
//	textStream.writeString("\"Statistics for '" + curScore.name + "'\"\n");
	textStream.writeString("\"Lenght unit:\",\"" +
			g_szDurNames[g_form.comboCSVUnit.currentIndex + 1] + "\"\n");
	// output summary
	textStream.writeString("\"Parts:\"," + g_numOfParts + "\n");
	textStream.writeString("\"Pages:\"," + g_numOfPages + "\n");
	textStream.writeString("\"Bars:\","  + g_numOfBars  + "\n");

	// output pitch occurrences and durations
	for(idx=0; idx < 12; idx++)
		textStream.writeString("\"" + g_noteNames[idx] + "\"," + g_numOfPitches[idx] + "," + (g_lenOfPitches[idx]/unit).toPrecision(6) + "\n");

	// output totals
	textStream.writeString("\"Total number of notes:\","   + g_numOfNotes + "\n");
	textStream.writeString("\"Total duration of notes:\"," + (g_lenOfNotes/unit).toPrecision(6) + "\n");
	textStream.writeString("\"Total number of rests:\","   + g_numOfRests + "\n");
	textStream.writeString("\"Total duration of rests:\"," + (g_lenOfRests/unit).toPrecision(6) + "\n");

	// output summary of note and rest length distribution
	textStream.writeString("\"Occurences of note lengths\"\n");
	for(idx in g_noteLengths)
		textStream.writeString("" + (idx/unit).toPrecision(6) + "," + g_noteLengths[idx] + "\n");
	textStream.writeString("\"Occurences of rest lengths\"\n");
	for(idx in g_restLengths)
		textStream.writeString("" + (idx/unit).toPrecision(6) + "," + g_restLengths[idx] + "\n");

	file.close();
	// store last export path
	idx = fName.lastIndexOf("/");
	if(idx != -1)
		g_szCSVPath = fName.substring(0, idx);
	g_bDirty = true;
};

//---------------------------------------------------------
//	dlgAccept()
//	called when user presses the "OK" button
//---------------------------------------------------------

function dlgAccept()
{
	saveIni();
	g_form.accept();
};

//---------------------------------------------------------
//	loadIni()
//	loads the configuration.
//---------------------------------------------------------

function loadIni()
{	var		settings;

	settings = new QSettings(QSettings.IniFormat, QSettings.UserScope,
			g_szOrgName, g_szAppName, null);
	g_nUIUnit	= settings.value(g_szUIUnit, 5);
	g_nCSVUnit	= settings.value(g_szCSVUnit,5);
	g_szCSVPath	= settings.value(g_szCSVPathKey, pluginPath);

	g_bDirty = false;
}

//---------------------------------------------------------
//	saveIni()
//	saves the configuration.
//---------------------------------------------------------

function saveIni()
{	var		settings;

	if(!g_bDirty)						// if settings are not dirty, do nothing
			return;
	settings = new QSettings(QSettings.IniFormat, QSettings.UserScope,
			g_szOrgName, g_szAppName, null);
	settings.setValue(g_szCSVUnit, g_form.comboCSVUnit.currentIndex+ 1);
	settings.setValue(g_szUIUnit,  g_form.comboUIUnit.currentIndex + 1);
	settings.setValue(g_szCSVPathKey, g_szCSVPath);
	settings.sync();					// flush file
	g_bDirty = false;
}

//---------------------------------------------------------
//    menu:  defines were the function will be placed
//           in the MuseScore menu structure
//---------------------------------------------------------

var mscorePlugin =
{
	menu: 'Plugins.Score Statistics',
	init: init,
	run:  run,
	majorVersion:  1,
	minorVersion:  1,
	onClose: null
};

mscorePlugin;
