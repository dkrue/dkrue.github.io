/*****************************************************************************
 Copyright © by Solid Design Software Solution LLC (assumed name SolidCircle)
*****************************************************************************/


// Start of the URL for API calls
const REST_URL = "https://holycrossservices.docmgt.com/rest";

// These constants correspond to recordtypeids for search purposes
const RECORDID_EMERGENCYDRILLREPORT = 1;
const RECORDID_PROGRAM = 3;
const RECORDID_REVIEWQUESTIONNAIRE = 5;
const RECORDID_REVIEWTEMPLATE = 6;
const RECORDID_REVIEW = 7;
const RECORDID_REVIEWCORRECTIVEACTION = 9;
const RECORDID_EMERGENCYDRILLREQUIREMENT = 10;
const RECORDID_HEALTHANDSAFETYREVIEWREQUIREMENT = 16;
const RECORDID_EMERGENCYDRILLREPORT_V2 = 18;
const RECORDID_EMERGENCYDRILLREQUIREMENT_V2 = 19;
const RECORDID_MEETINGMINUTESTEMPLATE = 27;
const RECORDID_MEETINGMINUTESCATEGORY = 28;
const RECORDID_MEETINGMINUTESITEM = 29;
const RECORDID_MEETINGTEAMNAME = 30;
const RECORDID_MEETINGMINUTESDATA = 31;
const RECORDID_MEETINGDATA = 32;
const RECORDID_MEETINGPARTICIPANTDATA = 33;


const DATEPARSINGFORMATS = [
    "MMddyyyy", "MMddyy",
    "M/dd/yyyy", "MM/d/yyyy", "M/d/yyyy",
    "MM/dd/yy", "M/dd/yy", "MM/d/yy", "M/d/yy",
    "M-dd-yyyy", "MM-d-yyyy", "M-d-yyyy",
    "MM-dd-yy", "M-dd-yy", "MM-d-yy", "M-d-yy"
];

var windowFocus = true;
var windowRefreshOverdue = false;
var refreshInterval = 300000;
var interval;
var dataBounds = {};

// Once the user has been authenticated, we can use their GUID to perform more API calls
var loggedInUserGuid = null;

// This array will hold the programs that are available to the user based on their teams
var userProgramOptions = [];

// Keep the logged in user's id handy
var loggedInUserId = null;
var loggedInUserName = null;

// Arrays to hold lists of items and their Ids that can be used to display words instead of ids
var allPrograms = [];
var allReviewTypes = [];
var allTeams = [];

// *** JQuery Document Ready ***
$(function () {

    // First, use the token to attempt to authenticate the user
    $.ajax
        ({
            type: "GET",
            url: REST_URL + "/login",
            dataType: 'json',
            contentType: "application/json",
            processData: false,
            data: "[]",
            async: false,
            headers: authorizationHeader,
            success: function (user) {
                // Now that the user is authenticated, get some information about them them.

                loggedInUserId = user.ID;
                loggedInUserGuid = user.GUID;
                loggedInUserName = user.UserName;

                // Load some general information to populate dropdowns and whatnot
                // This call is structured like this so the ajax calls happen in the right order without nesting them all in success functions


                loadAllPrograms(loadAllReviewTypes, [loadAllTeams, [setupUserProgramList, [user.TeamIDs]]]);  
            },
            error: function (error) {
                console.log("Failed authenticating the logged in user");
                console.log(error);
                $.unblockUI();
            }
        });

    kendo.ui.FilterMenu.prototype.options.operators =
      $.extend(kendo.ui.FilterMenu.prototype.options.operators, {
          string: {
              startswith: "Starts with",
              contains: "Contains",
              endswith: "Ends with"
          },
          number: {
              gte: "Is greater than or equal to",
              lte: "Is less than or equal to",
              eq: "Is equal to"
          },
          date: {
              eq: "Is equal to",
              neq: "Is not equal to",
              gte: "Is after or equal to",
              gt: "Is after",
              lte: "Is before or equal to",
              lt: "Is before"
          },
          enums: {
              eq: "Is equal to",
              neq: "Is not equal to"
          }
      });

    kendo.ui.FilterMenu.prototype.options.extra = false;

});

function loadActivePrograms() {

    return new Promise(function (resolve, reject) {

        var activeProgramsDataString = "[{'SearchVariable': 'RecordType', 'SearchValue': 'Program}]";
    });
}

/**
 * Set up an array of program names that the logged in user is a part of based on their teams
 * @param {any} userTeamIds array of ids for the teams the currently logged in user is a part of
 */
function setupUserProgramList(userTeamIds) {
    var IsAdminAllPrograms = false;
    var definedTeamsNameList = []; // This will accumulate the team names that are explicitly assigned to the user

    userProgramOptions.length = 0;
    
    // Iterate over the logged in user's teams and find matching programs. Also determine if the user is in admin groups
    for (var i = 0; i < userTeamIds.length; i++) {

        for (var j = 0; j < allTeams.length; j++) {
            
            if (allTeams[j].id === userTeamIds[i]) {

                for (var k = 0; k < allPrograms.length; k++) {
                    
                    if (allTeams[j].name === allPrograms[k].programName) {
                        definedTeamsNameList.push(allPrograms[k].programName);
                        break;
                    }

                    if (allTeams[j].name === "ReviewAdmin") {
                        $("#dashboardactions_reviewtemplates_button").css("display", "");
                        break;
                    }

                    if (allTeams[j].name === "MeetingMinutes") {
                        $("#dashboardactions_meetingminutes_button").css("display", "");
                        break;
                    }

                    if (allTeams[j].name === "ClinicalSupervision") {
                        $("#clinical_supervision_log_widget").css("display", "");
                        break;
                    }

                    if (allTeams[j].name === "AdministrativeReports") {
                        $("#administrative_reports_widget").css("display", "");
                        break;
                    }

                    if (allTeams[j].name === "AdminAllPrograms") {
                        IsAdminAllPrograms = true;
                        break;
                    }
                }
            }
        }
    }

    if (IsAdminAllPrograms) {

        for (var m = 0; m < allPrograms.length; m++) {
            userProgramOptions.push(allPrograms[m].programName);
        } 
    } else {
        userProgramOptions = definedTeamsNameList;
    }

    $.unblockUI();
}

/**
 * Function to retrieve a DataValue from a Data array based on the DataName property. 
 * Returns undefined if no matching element is found.
 * @param {any} dataArray The array you are looking for an element in
 * @param {any} dataName The name of the value that you are trying to get
 * @returns {any} value of the specified data from the data array or null if no such item exists
 */
function getDataValue(dataArray, dataName) {
    var result = null;

    for (var i = 0; i < dataArray.length; i++) {
        if (dataArray[i].DataName === dataName) {
            result = dataArray[i].DataValue;
            break;
        }
    }

    return result;
}

/**
 * Generate a list of all programs and their ids
 * @param {any} successFunction function to run on ajax success
 * @param {any} successArgs arg array for successFunction
 */
function loadAllPrograms(successFunction, successArgs) {
    $.ajax
        ({
            type: "POST",
            url: REST_URL + "/records/search?numPerPage=0&RecordTypeID=" + RECORDID_PROGRAM,
            dataType: 'json',
            contentType: "application/json",
            processData: false,
            data: "[]",
            async: false,
            headers: { "Authorization": "DocMgt " + btoa(loggedInUserGuid) },
            success: function (programs) {
                allPrograms.length = 0;

                $.each(programs, function (key, value) {
                    var programIsActive = getDataValue(value.Data, "Status") === "Active";

                    if (programIsActive) {
                        allPrograms.push({ "id": value.ID, "programName": getDataValue(value.Data, "ProgramName"), "status": getDataValue(value.Data, "Status") });
                    }
                });

                if (successFunction) {

                    if (typeof successFunction === "function")
                    {
                        successFunction.apply(this, successArgs);
                    }
                }
            },
            error: function (e) {
                console.log(e);
                console.log("There was an error loading the Programs");
            }
        });
}

/**
 * Generate a list of review template names and their ids
 * @param {any} successFunction function to run on ajax success
 * @param {any} successArgs arg array for successFunction
 */
function loadAllReviewTypes(successFunction, successArgs) {
    $.ajax
        ({
            type: "POST",
            url: REST_URL + "/records/search?numPerPage=0&RecordTypeID=" + RECORDID_REVIEWTEMPLATE,
            dataType: 'json',
            contentType: "application/json",
            processData: false,
            data: "[]",
            async: false,
            headers: { "Authorization": "DocMgt " + btoa(loggedInUserGuid) },
            success: function (reviewTemplates) {
                allReviewTypes.length = 0;
                
                $.each(reviewTemplates, function (key, value) {
                    allReviewTypes.push({ "value": value.ID, "text": getDataValue(value.Data, "Name")});
                });

                if (successFunction) {

                    if (typeof successFunction === "function")
                    {
                        successFunction.apply(this, successArgs);
                    }
                }
            },
            error: function (x) {
                console.log("Failed getting review types");
                console.log(x);
            }
        });
}

/**
 * Generate a list of all teams in the system and their ids
 * @param {any} successFunction function to run on ajax success
 * @param {any} successArgs arg array for successFunction
 */
function loadAllTeams(successFunction, successArgs) {

    $.ajax
        ({
            type: "GET",
            url: REST_URL + "/teams",
            dataType: 'json',
            contentType: "application/json",
            processData: false,
            data: "[]",
            async: true,
            headers: {
                "Authorization": "DocMgt " + btoa(loggedInUserGuid)
            },
            success: function (teams) {
                allTeams.length = 0;

                $.each(teams, function (key, value) {
                    allTeams.push({ "id": value.ID, "name": value.Name });
                });

                if (successFunction) {

                    if (typeof successFunction === "function")
                    {
                        successFunction.apply(this, successArgs);
                    }
                }
            },
            error: function (e) {
                console.log(e);
                console.log("Error loading all teams");
            }
        });
    
}

/**
 * Set the date values of a to/from combination of date pickers based on a quarter and year
 * @param {any} quarter -
 * @param {any} dateFrom_id -
 * @param {any} dateTo_id - 
 * @param {any} year_id -
 */
function chooseQuarter(quarter, dateFrom_id, dateTo_id, year_id) {
    var year = $("#" + year_id).data("kendoComboBox").value();

    switch (quarter) {
        case 1:
            // Quarter 1 is in the previous year
            $("#" + dateFrom_id).data("kendoDatePicker").value("10/01/" + (year - 1));
            $("#" + dateTo_id).data("kendoDatePicker").value("12/31/" + (year - 1));
            break;
        case 2:
            $("#" + dateFrom_id).data("kendoDatePicker").value("01/01/" + year);
            $("#" + dateTo_id).data("kendoDatePicker").value("03/31/" + year);
            break;
        case 3:
            $("#" + dateFrom_id).data("kendoDatePicker").value("04/01/" + year);
            $("#" + dateTo_id).data("kendoDatePicker").value("06/30/" + year);
            break;
        case 4:
            $("#" + dateFrom_id).data("kendoDatePicker").value("07/01/" + year);
            $("#" + dateTo_id).data("kendoDatePicker").value("09/30/" + year);
            break;
        default:
            // Default to the whole financial year if anything else gets passed in
            $("#" + dateFrom_id).data("kendoDatePicker").value("10/01/" + (year - 1));
            $("#" + dateTo_id).data("kendoDatePicker").value("9/30/" + year);
            break;
    }
}

/**
 * Set to/from date pickers to the current quarter
 * @param {any} dateFrom_id -
 * @param {any} dateTo_id -
 */
function setFromToDates_CurrentQuarter(dateFrom_id, dateTo_id) {
    var currentDate = new Date();
    var year = currentDate.getUTCFullYear();
    var month = currentDate.getMonth();

    if (month >= 9 && month <= 11) {
        //Q1
        $("#" + dateFrom_id).data("kendoDatePicker").value("10/01/" + year);
        $("#" + dateTo_id).data("kendoDatePicker").value("12/31/" + year);
    } else if (month >= 0 && month <= 2) {
        //Q2
        $("#" + dateFrom_id).data("kendoDatePicker").value("01/01/" + year);
        $("#" + dateTo_id).data("kendoDatePicker").value("03/31/" + year);
    } else if (month >= 3 && month <= 5) {
        //Q3
        $("#" + dateFrom_id).data("kendoDatePicker").value("04/01/" + year);
        $("#" + dateTo_id).data("kendoDatePicker").value("06/30/" + year);
    } else if (month >= 6 && month <= 8) {
        //Q4
        $("#" + dateFrom_id).data("kendoDatePicker").value("07/01/" + year);
        $("#" + dateTo_id).data("kendoDatePicker").value("09/30/" + year);
    }
}

/**
 * Set up the datasource of a program multiselect
 * @param {String} multiselectId The id of the multiselect you are setting the datasource for
 */
function program_multiselect_setup(multiselectId) {
    var programList = userProgramOptions;

    if (programList.indexOf("All") === -1) {
        programList.push("All");
    }

    var dataSource = new kendo.data.DataSource({
        data: programList,
        sort: { dir: "asc" }
    });

    $("#" + multiselectId).data("kendoMultiSelect").setDataSource(dataSource);
    $("#" + multiselectId).data("kendoMultiSelect").value(["All"]);
}

/**
 * Set up the datasource of a program combobox
 * @param {String} comboboxId The id of the combobox you are setting the datasource for
 */
function program_combobox_setup(comboboxId) {
    var dataSource = new kendo.data.DataSource({
        data: userProgramOptions,
        sort: { dir: "asc" }
    });

    $("#" + comboboxId).data("kendoComboBox").setDataSource(dataSource);
   
    if (userProgramOptions.length === 1) {
        $("#" + comboboxId).data("kendoComboBox").value(userProgramOptions[0]);
    }
}

/**
 * Set up the datasource of a review type combobox
 * @param {String} comboboxId The id of the combobox you are setting the datasource for
 */
function reviewtype_combobox_setup(comboboxId) {

    var dataSource = new kendo.data.DataSource({
        data: allReviewTypes
    });

    $("#" + comboboxId).data("kendoComboBox").setDataSource(dataSource);
}

// Change event to handle including an 'All' option in the 
function program_multiselect_withAll_change(e) {
    var multiSelect = $("#" + e.sender.element[0].id).data("kendoMultiSelect");
    var indexOfAll = multiSelect.value().indexOf("All");

    // Keep "All" selected if they user removes all values
    if (multiSelect.value().length === 0) {
        multiSelect.value(["All"]);
    }

    if (multiSelect.value().length > 1 && indexOfAll >= 0) {
        var removedAll = multiSelect.value();
        removedAll.splice(indexOfAll, 1);

        multiSelect.value(removedAll);
    }
}

/**
 * Generate a search string for Program for API calls based on a list of programs
 * @param {Array} programList The list of programs that you want included in the search
 * @returns {String} search string for API query
 */
function generateProgramSearchString(programList) {
    var result;

    // Handle the "All" case
    if (programList.length === 1 && programList[0] === "All") {
        
        if (userProgramOptions.length === 1) {
            // The user only has 1 valid program
            result = "{'SearchVariable': 'Program', 'SearchValue': '" + userProgramOptions[0] + "'}";
        }
        else if (userProgramOptions.length > 1) {
            // The user has multiple valid programs
            result = "{'SearchVariable': 'Program', 'SearchValue': '" + userProgramOptions[0] + "', 'OrSearches': [";


            for (var i = 1; i < userProgramOptions.length; i++) {

                if (userProgramOptions[i] !== "All") {
                    result += "{'SearchVariable': 'Program', 'SearchValue': '" + userProgramOptions[i] + "'}";

                    if (userProgramOptions[i + 1] && userProgramOptions[i + 1] !== "All") {
                        result += ",";
                    }
                }
            }
            result += "]}";
        }
        else {
            // The user has no valid programs and shouldn't be here anyway
            result = null;
        }
    }
    else if (programList.length === 1) {
        // There is only one program and it's not 'All'
        result = "{'SearchVariable': 'Program', 'SearchValue': '" + programList[0] + "'}";
    }
    else {
            // There are multiple programs, so use the OR options
        result = "{'SearchVariable': 'Program', 'SearchValue': '" + programList[0] + "', 'OrSearches': [";

        for (var j = 1; j < programList.length; j++) {
        result += "{'SearchVariable': 'Program', 'SearchValue': '" + programList[j] + "'}";

        if (programList[j + 1]) {
            result += ",";
        }
    }

        result += "]}";
    }
    return result;
}

// Set up data source for year comboboxes 
function setupYearSearchBox(comboBoxId) {
    var data = [];
    var currentYear = new Date().getUTCFullYear();
    var currentMonth = new Date().getMonth();

    data.push(currentYear + 1);
    data.push(currentYear);
   
    for (var i = 1; i < 20; i++) {
        data.push(currentYear - i);
    }

    var dataSource = new kendo.data.DataSource({
        data: data
    });

    $("#" + comboBoxId).data("kendoComboBox").setDataSource(dataSource);

    if (currentMonth >= 9 && currentMonth <= 11) {
        // If we are in Q1, then show current year + 1
        $("#" + comboBoxId).data("kendoComboBox").value(currentYear + 1);
    } else {
        $("#" + comboBoxId).data("kendoComboBox").value(currentYear);
    }
}

// Change function for year selection comboboxes
function searchYearOnChange(e) {
    var yearBox = $("#" + e.sender.element[0].id).data("kendoComboBox");

    // Reset the box to the current year if it is cleared
    if (yearBox.value() === "" || yearBox.value() === undefined || yearBox.value() === null) {
        yearBox.value(new Date().getUTCFullYear());
    }
}

function valueFromDocMgtRecord(recordData, dataName) {
    var recordField = $.grep(recordData, function (data) { return data.DataName == dataName; });

    if (recordField.length > 0) {
        return recordField[0].DataValue;
    }

    return null;
}