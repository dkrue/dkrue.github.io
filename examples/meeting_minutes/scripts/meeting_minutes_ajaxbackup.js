/*****************************************************************************
 Copyright © by Solid Design Software Solution LLC (assumed name SolidCircle)
*****************************************************************************/


// *** Global Variables ***
var meeting_minutes_intro_templateid;
var meeting_minutes_intro_categoryid;
var meeting_minutes_recordid;
var meeting_minutes_historical = false;

// *** JQuery Document Ready ***

$(function () {
    
});

function meetingMinutesModalShow() {
    meeting_minutes_program_team_setup();
    meeting_minutes_reset_modal_continue();

    $("#meeting_minutes_modal").modal({
        backdrop: "static",
        keyboard: false
    });
}

function meeting_minutes_close_modal() {
    meeting_minutes_reset_modal(meeting_minutes_close_modal_continue);
}

function meeting_minutes_close_modal_continue() {
    // clear out program / template values to avoid problems reopening the widget
    $("#meeting_minutes_program_team").data("kendoComboBox").value(null);
    $("#meeting_minutes_template").data("kendoComboBox").value(null);
    $("#meeting_minutes_previous_button,#meeting_minutes_history_button").prop("disabled", true);
    $("#meeting_minutes_grid").data("kendoGrid").dataSource.data([]);

    // unblock in case we are continuing from saving all before closing
    $.unblockUI();

    $("#meeting_minutes_modal").modal("hide");
}

function meeting_minutes_reset_modal(continueFunction) {
    // Autosave current meeting if not historical before resetting
    if (meeting_minutes_recordid && !meeting_minutes_historical) {
        meeting_minutes_save_all(meeting_minutes_reset_modal_continue, [continueFunction]);
    } else {
        if (meeting_minutes_historical) {
            meeting_minutes_reset_modal_continue(continueFunction);
        } else {
            showGenericWarningModalWithCancelFunction("Meeting Minutes", "Are you sure you want to clear unsaved changes to this meeting?", meeting_minutes_reset_modal_continue, [continueFunction]);
        }
    }
}

function meeting_minutes_reset_modal_continue(continueFunction) {
    meeting_minutes_reset_categories();

    meeting_minutes_recordid = null;
    meeting_minutes_historical = false;
    $("#meeting_minutes_historical_label,#meeting_minutes_history_collapse").hide();

    $("#meeting_minutes_print_button,#meeting_minutes_tab_button_group :button").prop("disabled", true);
    $("#meeting_minutes_program_team").data("kendoComboBox").enable(true);
    $("#meeting_minutes_template").data("kendoComboBox").enable(true);
    $("#meeting_minutes_location").val("");
    $("#meeting_minutes_date").data("kendoDateTimePicker").value(new Date());
    $("#meeting_minutes_calltoorder").val("");
    $("#meeting_minutes_other_free_text").val("");
    $("#meeting_minutes_date_next").data("kendoDateTimePicker").value(null);
    $("#meeting_minutes_location_next").val("");

    meeting_minutes_participants_grid_setup();
    meeting_minutes_intro_grid_setup();

    // Trigger template change in case we are resetting to a new meeting from the clear button, to auto-load default participants & tabs
    $("#meeting_minutes_template").data("kendoComboBox").trigger("change");

    if (typeof continueFunction === "function") {
        continueFunction.apply(this);
    }
}

function meeting_minutes_program_team_setup() {
    program_combobox_setup("meeting_minutes_program_team");

    var queryString = "[{'SearchVariable': 'Active', 'SearchValue': 'Yes'}]";

    $.ajax({
        type: "POST",
        url: REST_URL + "/records/search?RecordTypeID=" + RECORDID_MEETINGTEAMNAME,
        dataType: 'json',
        contentType: "application/json",
        data: queryString,
        headers: {
            "Authorization": "DocMgt " + btoa(loggedInUserGuid)
        },
        success: function (data) {
            var programsAndTeams = [];

            $.each(userProgramOptions, function () {
                programsAndTeams.push({ Text: this, Value: this, IsProgram: true, IsTeam: false });
            });
            
            $.each(data, function () {
                var teamName = valueFromDocMgtRecord(this.Data, "TeamName");

                programsAndTeams.push({ Text: teamName, Value: teamName, IsProgram: false, IsTeam: true });
            });

            var dataSource = new kendo.data.DataSource({
                data: programsAndTeams,
                schema: {
                    model: {
                        id: "Value",
                        fields: {
                            Text: { type: "string"},
                            Value: { type: "string" },
                            IsProgram: {type: "boolean" },
                            IsTeam: {type: "boolean" }
                        }
                    }
                },
                sort: { field: "Text", dir: "asc" }
            });

            $("#meeting_minutes_program_team").data("kendoComboBox").setDataSource(dataSource);
        }
    });
}

function meeting_minutes_reset_categories() {
    // Reset meeting category buttons
    $("#meeting_minutes_tab_button_group :button").not(".default-focus-ignore").remove();
    $("#meeting_minutes_tab_button_group :button").removeClass("active");
    $("#meeting_minutes_tab_button_intro").addClass("active");
    $("#meeting_minutes_add_to_agenda_button").hide();

    $("#meeting_minutes_intro_panel").show();
    $("#meeting_minutes_other_notes,#meeting_minutes_next_meeting_panel").hide();
}

function meeting_minutes_participants_grid_setup() {
    // Set up datasource for grid
    var dataSource = new kendo.data.DataSource({
        data: [],
        schema: {
            model: {
                id: "RecordId",
                fields: {
                    RecordId: { type: "numeric", defaultValue: 0 },
                    DisplayOrder: { type: "numeric", defaultValue: 0 },
                    Name: { type: "string", validation: { required: { message: "Name is required" } } },
                    Late: { type: "boolean", defaultValue: false },
                    Excused: { type: "boolean", defaultValue: false },
                    Unexcused: { type: "boolean", defaultValue: false },
                    GuestNames: { type: "string" }
                }
            }
        }
    });

    // Initialize grid
    $("#meeting_minutes_participants").kendoGrid({
        dataSource: dataSource,
        filterable: false,
        groupable: false,
        pageable: false,
        selectable: false,
        editable: { createAt: "bottom", confirmation: false },
        navigatable: true,
        toolbar: kendo.template($("#meeting_minutes_participants_toolbar").html()),
        columns: [
            { field: "Name", title: "Name", width: "30%" },
            { field: "Late", title: "Late", template: '<input type="checkbox" #= Late ? checked="checked" : "" #></input>', width: "10%" },
            { field: "Excused", title: "Excused", template: '<input type="checkbox" #= Excused ? checked="checked" : "" #></input>', width: "10%" },
            { field: "Unexcused", title: "Unexcused", template: '<input type="checkbox" #= Unexcused ? checked="checked" : "" #></input>', width: "10%" },
            { field: "GuestNames", title: "Guest Name(s)", width: "30%" },
            { command: "destroy", title: " ", width: "10%" }
        ]
    });
}

function meeting_minutes_intro_grid_setup() {

    // Initialize grid, then get meeting minutes template data from DocMgt
    $("#meeting_minutes_grid").kendoGrid({
        dataSource: {
            data: [],
            schema: {
                model: {
                    id: "RecordId",
                    fields: {
                        RecordId: { type: "numeric", defaultValue: 0 },
                        MinutesEntry: { type: "string" },
                        IsEntry: { type: "boolean", defaultValue: true },
                        DisplayOrder: { type: "numeric", defaultValue: 0, editable: false },
                        OrderNumber: { type: "numeric", defaultValue: 0, editable: false },
                        Status: { type: "string", editable: false }, // this column displays corrective action, and "add to template" when new meeting agenda item
                        IsNewMeetingItem: { type: "boolean", defaultValue: false }
                    }
                }
            }
        },

        filterable: false,
        groupable: false,
        pageable: false,
        selectable: true,
        editable: { createAt: "bottom", confirmation: false },
        navigatable: true,
        beforeEdit: meeting_minutes_opencell,
        change: meeting_minutes_grid_select,
        dataBound: meeting_minutes_databound,
        remove: meeting_minutes_remove_row,
        toolbar: kendo.template($("#meeting_minutes_grid_toolbar").html()),
        columns: [
            { field: "OrderNumber", title: " ", template: "#=IsEntry ? OrderNumber + '.' : ''#", width: "2%" },
            { field: "MinutesEntry", template: "#=IsEntry ? (MinutesEntry != null ? MinutesEntry : '') : '<em>' + MinutesEntry + '</em>'#", title: "Minutes", width: "73%" },
            { field: "Status", title: "Status", template: "#=$.type(Status) == 'boolean' ? '<input type=checkbox ' + (Status ? 'checked' : '') + '/> &nbsp; Add to Template' : (Status != null ? Status : '')#", encoded: false, width: "15%" },
            { command: "destroy", title: " ", width: "10%" }
        ]
    });

    meeting_minutes_addnewrowontab("meeting_minutes_grid", 2);
}

function meeting_minutes_data_request(queryObject, recordType, successFunction) {
    if (REST_URL) {
        $.ajax({
            type: "POST",
            // if record type is not specified, send query object as advanced search
            url: REST_URL + "/records/" + (recordType ? ("search?numPerPage=0&RecordTypeID=" + recordType) : "searchadv"),
            dataType: 'json',
            contentType: "application/json",
            data: JSON.stringify(queryObject),
            headers: {
                "Authorization": "DocMgt " + btoa(loggedInUserGuid)
            },
            success: successFunction,
            error: function (error) {
                console.error("Error getting data for queryObject:");
                console.error(queryObject);
                console.error(error);
            },
        });
    } else {
        console.error("No data endpoint configured");
    }
}

function meeting_minutes_data_persist(recordObject, context, successFunction) {
    if (REST_URL) {
        $.ajax({
            type: recordObject.ID ? "PUT" : "POST",
            url: REST_URL + "/records",
            dataType: 'json',
            contentType: "application/json",
            data: JSON.stringify(recordObject),
            context: context,
            headers: {
                "Authorization": "DocMgt " + btoa(loggedInUserGuid)
            },
            success: successFunction,
            error: function (error) {
                console.error("Error presisting data for queryObject:");
                console.error(queryObject);
                console.error(error);
            },
        });
    } else {
        console.error("No data endpoint configured");
    }
}

function meeting_minutes_data_delete(recordId, recordType, successFunction) {
    if (REST_URL) {
        $.ajax({
            type: "DELETE",
            url: REST_URL + "/records/" + recordId,
            dataType: 'json',
            contentType: "application/json",
            headers: {
                "Authorization": "DocMgt " + btoa(loggedInUserGuid)
            },
            success: successFunction,
            error: function (error) {
                console.error("Error deleting data for record id:");
                console.error(recordId);
                console.error(error);
            },
        });
    } else {
        console.error("No data endpoint configured");
    }
}


function meeting_minutes_load_template_categories(templateId) {

    // Display Loading... when loading category tabs
    if (templateId != meeting_minutes_intro_templateid) {
        var buttonHtml = '<button type="button" class="btn btn-default" style="border-radius: 0 !important" id="meeting_minutes_tab_button_loading" disabled><em>Loading...</em></button>';
        $("#meeting_minutes_tab_button_other").before(buttonHtml);
    }

    var queryObj = [{'SearchVariable': 'MeetingTemplateId', 'SearchValue': templateId }, {'SearchVariable': 'Active', 'SearchValue': 'Yes'}];

    meeting_minutes_data_request(queryObj, RECORDID_MEETINGMINUTESCATEGORY, function (data) {

        if (data.length > 0) {
            if (templateId == meeting_minutes_intro_templateid) { // introductory items not assigned to any program or team
                // Set grid toolbar label
                var name = valueFromDocMgtRecord(data[0].Data, "CategoryName");
                $("#minutes_grid_label").text(name);

                // Get all meeting items in category
                var categoryId = valueFromDocMgtRecord(data[0].Data, "CategoryId");

                // Set category value of intro tab, for saving with meeting minutes later
                $("#meeting_minutes_tab_button_intro").val(categoryId);
                meeting_minutes_intro_categoryid = categoryId;

                if (meeting_minutes_recordid) {
                    meeting_minutes_load_saved_minutes(categoryId);
                } else {
                    meeting_minutes_load_template_items(categoryId);
                }

            } else { // else load category tabs for chosen program/team

                var tabData = [];

                // Create array of meeting categories
                $.each(data, function () {
                    tabData.push({
                        CategoryId: parseInt(valueFromDocMgtRecord(this.Data, "CategoryId")),
                        CategoryName: valueFromDocMgtRecord(this.Data, "CategoryName"),
                        OrderNumber: parseInt(valueFromDocMgtRecord(this.Data, "DisplayOrder"))
                    });
                });

                // Sort by category order number
                tabData.sort(meeting_minutes_displayorder_sort);

                // Set up tabs for each category in template
                for (var i = 0; i < tabData.length; i++) {
                    var buttonHtml = '<button type="button" class="btn btn-primary" style="border-radius: 0 !important" value="' + tabData[i].CategoryId + '">' + tabData[i].CategoryName + '</button>';
                    $("#meeting_minutes_tab_button_other").before(buttonHtml);
                }

                $("#meeting_minutes_tab_button_loading").remove();
                $("#meeting_minutes_tab_button_group :button").off("click").on("click", meeting_minutes_tab_select);
            }
        }
        else {
            $("#meeting_minutes_tab_button_loading").hide();
            showGenericErrorModal("Meeting Minutes", "No meeting categories found for this meeting minutes template");
        }
    });

}

function meeting_minutes_load_template_items(categoryId) {

    if (categoryId == "other") {
        $("#meeting_minutes_grid").data("kendoGrid").dataSource.data([{
            RecordId: 0,
            MinutesEntry: "Other Matters",
            IsEntry: false,
            OrderNumber: 1,
            Status: null,
            IsNewMeetingItem: false
        },
        {
            RecordId: 0,
            MinutesEntry: null,
            IsEntry: true,
            OrderNumber: 1,
            Status: null,
            IsNewMeetingItem: false
        }]);

        kendo.ui.progress($("#meeting_minutes_grid"), false);
        return;
    }

    var queryObj = [{'SearchVariable': 'MeetingCategoryId', 'SearchValue': categoryId }, {'SearchVariable': 'Active', 'SearchValue': 'Yes'}];
    
    meeting_minutes_data_request(queryObj, RECORDID_MEETINGMINUTESITEM, function (records) {
            
        var gridData = [];

        // Create array of meeting template items
        $.each(records, function () {
            gridData.push({
                RecordId: 0,
                MinutesEntry: valueFromDocMgtRecord(this.Data, "Text"),
                IsEntry: false,
                DisplayOrder: parseInt(valueFromDocMgtRecord(this.Data, "DisplayOrder")),
                OrderNumber: parseInt(valueFromDocMgtRecord(this.Data, "DisplayOrder")),
                Status: null,
                IsNewMeetingItem: false
            });
        });

        gridData.sort(meeting_minutes_displayorder_sort);

        // Add blank entry after each template item
        for (var i = gridData.length; i > 0; i--) {
            gridData.splice(i, 0, {
                RecordId: 0,
                MinutesEntry: null,
                IsEntry: true,
                OrderNumber: 1,
                Status: null,
                IsNewMeetingItem: false
            });
        }

        // Done loading meeting template data, set as grid datasource
        $("#meeting_minutes_grid").data("kendoGrid").dataSource.data(gridData);

        if (categoryId == meeting_minutes_intro_categoryid && $("#meeting_minutes_program_team").data("kendoComboBox").value()) {
            // Load corrective actions from previous meeting into intro items grid
            meeting_minutes_load_previous_actions();
        } else {
            kendo.ui.progress($("#meeting_minutes_grid"), false);
        }
    });
}

function meeting_minutes_load_saved_minutes(categoryId, continueFunction) {
    
    var queryObj = [{ 'SearchVariable': 'MeetingRecordId', 'SearchValue': meeting_minutes_recordid }];

    // If no category is specified, load all categories at once for printing purposes
    if (categoryId) {
        queryObj.push({ 'SearchVariable': 'MeetingCategoryId', 'SearchValue': String(categoryId) });
    }

    meeting_minutes_data_request(queryObj, RECORDID_MEETINGMINUTESDATA, function (records) {

        var gridData = [];

        if (records.length > 0) {

            // Create array of meeting template items
            $.each(records, function () {

                // Order by category, then display order for printing multiple categories. "Other" category is always at the end.
                //var meetingCategoryIdStr = valueFromDocMgtRecord(this.Data, "MeetingCategoryId");
                //meetingCategoryIdStr = meetingCategoryIdStr != "other" ? meetingCategoryIdStr : "999999";

                gridData.push({
                    RecordId: this.ID,
                    MeetingCategoryId: valueFromDocMgtRecord(this.Data, "MeetingCategoryId"),
                    MinutesEntry: valueFromDocMgtRecord(this.Data, "Text"),
                    IsEntry: valueFromDocMgtRecord(this.Data, "IsEntry") == "Yes" ? true : false,
                    DisplayOrder: parseInt(valueFromDocMgtRecord(this.Data, "DisplayOrder")),
                    OrderNumber: parseInt(valueFromDocMgtRecord(this.Data, "OrderNumber")),
                    Status: valueFromDocMgtRecord(this.Data, "Status"),
                    IsNewMeetingItem: false
                });
            });

            gridData.sort(meeting_minutes_displayorder_sort);

            // Done loading meeting template data, set as grid datasource
            $("#meeting_minutes_grid").data("kendoGrid").dataSource.data(gridData);
            kendo.ui.progress($("#meeting_minutes_grid"), false);
        }
        else { // else meeting records have not been saved for this meeting id and category, load from template
            console.log("No minutes found for this meeting id, loading from template");
            meeting_minutes_load_template_items(categoryId);
        }

        if (typeof continueFunction === "function") {
            continueFunction.apply(this);
        }
    });
}

function meeting_minutes_load_saved_participants() {
    kendo.ui.progress($("#meeting_minutes_participants"), true);

    var queryObj = [{'SearchVariable': 'MeetingRecordId', 'SearchValue': meeting_minutes_recordid }];

    meeting_minutes_data_request(queryObj, RECORDID_MEETINGPARTICIPANTDATA,  function (records) {

        var gridData = [];

        // Create array of meeting participants
        $.each(records, function () {
            gridData.push({
                RecordId: this.ID,
                DisplayOrder: parseInt(valueFromDocMgtRecord(this.Data, "DisplayOrder")),
                Name: valueFromDocMgtRecord(this.Data, "Name"),
                Late: valueFromDocMgtRecord(this.Data, "Late") == "Yes" ? true : false,
                Excused: valueFromDocMgtRecord(this.Data, "Excused") == "Yes" ? true : false,
                Unexcused: valueFromDocMgtRecord(this.Data, "Unexcused") == "Yes" ? true : false,
                GuestNames: valueFromDocMgtRecord(this.Data, "GuestNames"),
            });
        });

        gridData.sort(meeting_minutes_displayorder_sort);

        // Done loading meeting participant data, set as grid datasource
        $("#meeting_minutes_participants").data("kendoGrid").dataSource.data(gridData);
        kendo.ui.progress($("#meeting_minutes_participants"), false);
    });
}

function meeting_minutes_previous_meeting_query(maxResults) {
    var searchValues = [];

    var programTeamDataItem = $("#meeting_minutes_program_team").data("kendoComboBox").dataItem();

    if (programTeamDataItem.IsProgram) {
        searchValues.push({ 'SearchVariable': 'ProgramName', 'SearchValue': programTeamDataItem.Value });
    }
    if (programTeamDataItem.IsTeam) {
        searchValues.push({ 'SearchVariable': 'TeamName', 'SearchValue': programTeamDataItem.Value });
    }

    var meetingDateTime = $("#meeting_minutes_date").data("kendoDateTimePicker").value();
    if (!meetingDateTime) {
        meetingDateTime = new Date();
    }
    // subtract a milli to make a less-than date search
    searchValues.push({ 'SearchVariable': 'DateTime', 'SearchValueTo': new Date(meetingDateTime - 1), 'Range': true });

    return { 'RecordTypeID': RECORDID_MEETINGDATA, 'SearchValues': searchValues, 'SortField': 'DateTime DESC', 'NumPerPage': (maxResults ? maxResults : 0) };
}

function meeting_minutes_load_previous_actions() {
    kendo.ui.progress($("#meeting_minutes_grid"), true);

    // First get id of previous meeting for this program or team
    var queryObjAdvanced = meeting_minutes_previous_meeting_query(1);

    meeting_minutes_data_request(queryObjAdvanced, null, function (data) {

        if (data.length > 0) {

            var previousMeeting = data[0];

            // Get all corrective actions made in the past for this program/team not marked completed as "approved"
            // OR any made for the previous meeting in any status
            var queryObj = [];

            var programTeamDataItem = $("#meeting_minutes_program_team").data("kendoComboBox").dataItem();

            if (programTeamDataItem.IsProgram) {
                queryObj.push({ 'SearchVariable': 'MeetingProgramName', 'SearchValue': programTeamDataItem.Value });
            }
            if (programTeamDataItem.IsTeam) {
                queryObj.push({ 'SearchVariable': 'MeetingTeamName', 'SearchValue': programTeamDataItem.Value });
            }

            var meetingDateTime = $("#meeting_minutes_date").data("kendoDateTimePicker").value();
            if (!meetingDateTime) {
                meetingDateTime = new Date();
            }
            queryObj.push({ 'SearchVariable': 'DateReported', 'SearchValueTo': meetingDateTime, 'Range': true });
            queryObj.push({ 'SearchVariable': 'Status', 'SearchValue': "!Approved", 'OrSearches': [{ 'SearchVariable': 'MeetingRecordId', 'SearchValue': previousMeeting.ID }] });

            meeting_minutes_data_request(queryObj, RECORDID_REVIEWCORRECTIVEACTION, function (records) {
                if (records.length > 0) {

                    // Remove action/follow-up item review blank row
                    $("#meeting_minutes_grid").data("kendoGrid").removeRow("tr:last");

                    // Wait for row removal to finish
                    setTimeout(function () {
                        var i = 0;

                        // Add previous corrective actions to the minutes grid
                        $.each(records, function () {
                            $("#meeting_minutes_grid").data("kendoGrid").dataSource.add({
                                RecordId: 0,
                                MinutesEntry: valueFromDocMgtRecord(this.Data, "TaskAssigned"),
                                IsEntry: true,
                                DisplayOrder: 0,
                                OrderNumber: ++i,
                                Status: "<em>" + valueFromDocMgtRecord(this.Data, "Status") + ": <a href='#' onclick='meeting_minutes_goto_action_record(" + this.ID + ")'>" + valueFromDocMgtRecord(this.Data, "AssignedToUser") + "</a></em>",
                                IsNewMeetingItem: false
                            });
                        });
                    })
                } else {
                    console.log("No corrective actions found for previous meeting id " + previousMeeting.ID);
                }

                kendo.ui.progress($("#meeting_minutes_grid"), false);
            });
        } else {
            console.log("No previous meetings found");
            kendo.ui.progress($("#meeting_minutes_grid"), false);
        }
    });
}

function meeting_minutes_goto_action_record(recordId) {
    meeting_minutes_openinnewtab("https://meeting_minutes.docmgt.com/App/Record/" + recordId);
}

function meeting_minutes_opencell(e) {
    // Do not allow editing of non-entry header rows from template
    if (!e.model.IsEntry && !e.model.IsNewMeetingItem) {
        e.preventDefault();
    }
}

function meeting_minutes_remove_row(e) {
    var grid = e.sender;
    // Get selected item
    var sel = grid.select();
    // Remember index of selected element
    var sel_idx = sel.index();
    // Get order number of minutes entry removed
    var orderNumber = e.model.OrderNumber-1;
    // Get the index in the datasource
    var idx = grid.dataSource.indexOf(e.model);
    // Reorder subsequent minutes entries in this section
    for (var i = idx+1; i < grid.dataSource.data().length; i++) {
        if (!grid.dataSource.data()[i].IsEntry) {
            break;
        }
        grid.dataSource.data()[i].OrderNumber = ++orderNumber;
    }
    // Manually refresh order number as it is not an editable column
    grid.refresh();
    // Select row above deleted row for subsequent inserts
    setTimeout(function () { grid.select($("#" + grid.element[0].id + " tr:eq(" + (sel_idx >= idx ? sel_idx : sel_idx+1) + ")")); });
}

function meeting_minutes_add_row() {
    var grid = $("#meeting_minutes_grid").data("kendoGrid");
    // Get selected item
    var sel = grid.select();
    // Remember index of selected element
    var sel_idx = sel.index();
    // Get the item
    var item = grid.dataItem(sel);
    // Get the index in the datasource
    var idx = grid.dataSource.indexOf(item);
    // Get order number of minutes entry or start at one if template row is selected
    var orderNumber = item.IsEntry ? item.OrderNumber + 1 : 1;
    // Insert element after
    grid.dataSource.insert(idx + 1, { OrderNumber: orderNumber, IsEntry: true, MinutesEntry: null, Status: null, IsNewMeetingItem: false });
    // Reorder subsequent minutes entries in this section
    for (var i = idx + 2; i < grid.dataSource.data().length; i++) {
        if (!grid.dataSource.data()[i].IsEntry) {
            break;
        }
        grid.dataSource.data()[i].OrderNumber = ++orderNumber;
    }
    // Manually refresh order number as it is not an editable column
    grid.refresh();
    // Select inserted row for subsequent inserts
    grid.select($("#" + grid.element[0].id + " tr:eq(" + (sel_idx + 2) + ")"));
    // Edit second cell of inserted row
    grid.editCell($("#" + grid.element[0].id + " tr:eq(" + (sel_idx + 2) + ")  td:eq(1)"));
}

function meeting_minutes_add_template_item_row() {
    var grid = $("#meeting_minutes_grid").data("kendoGrid");

    grid.dataSource.insert(grid.dataSource.total(), {
        RecordId: 0,
        MinutesEntry: null,
        IsEntry: false,
        Status: "<input type='checkbox' /> &nbsp; Add to Template",
        DisplayOrder: 0,
        IsNewMeetingItem: true
    })
    // Select inserted row for subsequent inserts
    grid.select($("#" + grid.element[0].id + " tr:eq(" + grid.dataSource.total() + ")"));
    // Edit second cell of inserted row
    grid.editCell($("#" + grid.element[0].id + " tr:eq(" + grid.dataSource.total() + ")  td:eq(1)"));
}

function meeting_minutes_addnewrowontab() {
    // Automatically add new row when tabbing in grid
    var grid = $("#meeting_minutes_grid").data("kendoGrid");
    if (meeting_minutes_nulloremptycheck(grid) != null) {
        grid.tbody.off("keydown").on("keydown", function (e) {
            var keyCode = e.keyCode || e.which;

            if (!e.shiftKey && keyCode == 9) {
                setTimeout(meeting_minutes_add_row);
            }
        })
    }
}

function meeting_minutes_databound(e) {
    $(e.sender.element).find("tr .k-grid-delete").each(function () {
        var row = $(this).closest("tr");
        var data = e.sender.dataItem(row);

        // Hide delete button for header template rows
        if (!data.IsEntry) {
            $(this).remove();
        }
    });

    $("#meeting_minutes_grid_add,#meeting_minutes_grid_corrective_action").prop("disabled", true);
}

function meeting_minutes_grid_select(e) {
    var dataItem = e.sender.dataItem(e.sender.select());

    $("#meeting_minutes_grid_add").prop("disabled", !dataItem);
    $("#meeting_minutes_grid_corrective_action").prop("disabled", !dataItem || !dataItem.IsEntry);
}

function meeting_minutes_displayorder_sort(a, b) {
    // First sort by category id, used when printing all meeting minutes
    if (a.MeetingCategoryId < b.MeetingCategoryId) {
        return -1;
    }
    else if (a.MeetingCategoryId > b.MeetingCategoryId) {
        return 1;
    }

    // Then sort by item display order
    return (a.DisplayOrder < b.DisplayOrder) ? -1 : ((a.DisplayOrder > b.DisplayOrder) ? 1 : 0);
}

function meeting_minutes_recordid_sort(a, b) {
    return (a.ID < b.ID) ? -1 : ((a.ID > b.ID) ? 1 : 0);
}

function meeting_minutes_tab_select() {
    // Don't save data when navigating a historical meeting
    if (meeting_minutes_historical) {
        meeting_minutes_tab_select_continue($(this)[0]);
    } else {
        var currentTab = $("#meeting_minutes_tab_button_group .active")[0].value;

        // Save the minutes grid before switching tabs and forward which button was clicked to the continue function
        if (meeting_minutes_recordid && currentTab != "other") {
            meeting_minutes_save_minutes(meeting_minutes_tab_select_continue, $(this));
        } else {
            // Save all sections if no meeting id has been saved yet or we're leaving the "other" tab
            // This logic could be replaced with a dirty fields check
            console.log("saving all before navigating to tab");
            meeting_minutes_save_all(meeting_minutes_tab_select_continue, $(this));
        }
    }
}

function meeting_minutes_tab_select_continue(buttonClicked) {
    // unblock in case we are continuing from saving all before navigating tabs
    $.unblockUI();

    kendo.ui.progress($("#meeting_minutes_grid"), true);
    $("#meeting_minutes_grid").data("kendoGrid").dataSource.data([]);

    $("#meeting_minutes_tab_button_group :input").removeClass("active");
    $(buttonClicked).addClass("active");

    $("#minutes_grid_label").html(buttonClicked.innerHTML);
    
    var categoryId = buttonClicked.value;
    $("#meeting_minutes_intro_panel").toggle(categoryId == meeting_minutes_intro_categoryid || categoryId == "intro");
    $("#meeting_minutes_other_notes,#meeting_minutes_next_meeting_panel").toggle(categoryId == "other");
    $("#meeting_minutes_add_to_agenda_button").toggle($.isNumeric(categoryId) && categoryId != meeting_minutes_intro_categoryid);

    if (categoryId == meeting_minutes_intro_categoryid || categoryId == "intro") {
        // Intro is triggered once, to find out the intro category, after which the category id of the intro button is set
        meeting_minutes_load_template_categories(meeting_minutes_intro_templateid);

    } else {
        if (meeting_minutes_recordid) {
            meeting_minutes_load_saved_minutes(categoryId);
        } else {
            meeting_minutes_load_template_items(categoryId);
        }
    }
}

function meeting_minutes_add_corrective_action() {
    if (meeting_minutes_recordid) {
        meeting_minutes_add_corrective_action_continue();
    } else {
        meeting_minutes_save_all(meeting_minutes_add_corrective_action_continue);
    }
}

function meeting_minutes_add_corrective_action_continue() {
    var grid = $("#meeting_minutes_grid").data("kendoGrid");
    var selectedMinutes = grid.dataItem(grid.select());

    // set action status manually as this column is not editable
    selectedMinutes.Status = "<em>Action created</em>";
    grid.refresh();

    $.unblockUI();
    kendo.ui.progress($("#meeting_minutes_grid"), false);

    var programTeamDataItem = $("#meeting_minutes_program_team").data("kendoComboBox").dataItem();

    var url = "https://meeting_minutes.docmgt.com/Eforms/Form/17?"
    url += "ProgramAddressLocation=" + encodeURIComponent(programTeamDataItem.Value);
    url += "&DateReported=" + (new Date().toLocaleDateString("en-US"));
    url += "&TaskAssigned=" + encodeURIComponent(selectedMinutes.MinutesEntry);
    url += "&MeetingRecordId=" + meeting_minutes_recordid;
    if (programTeamDataItem.IsProgram) {
        url += "&MeetingProgramName=" + encodeURIComponent(programTeamDataItem.Value);
    }
    if (programTeamDataItem.IsTeam) {
        url += "&MeetingTeamName=" + encodeURIComponent(programTeamDataItem.Value);
    }

    meeting_minutes_openinnewtab(url);
}

function meeting_minutes_program_team_change(e) {
    meeting_minutes_reset_categories();

    $("#meeting_minutes_history_collapse").hide();
    $("#meeting_minutes_template").data("kendoComboBox").value(null);
    $("#meeting_minutes_participants").data("kendoGrid").dataSource.data([]);
    $("#meeting_minutes_previous_button,#meeting_minutes_history_button").prop("disabled", !e.sender.value());
    $("#meeting_minutes_print_button").prop("disabled", true);
    $("#meeting_minutes_save_button,#meeting_minutes_tab_button_group :button").prop("disabled", true);

    var dataItem = e.sender.dataItem();

    if (dataItem) {
        meeting_minutes_load_template(dataItem.IsProgram ? dataItem.Value : null, dataItem.IsTeam ? dataItem.Value : null);
    } else {
        $("#meeting_minutes_template").data("kendoComboBox").value(null);
        $("#meeting_minutes_template").data("kendoComboBox").dataSource.data([]);
    }
}

function meeting_minutes_program_template_change(e) {
    meeting_minutes_reset_categories();

    if (e.sender.dataItem()) {

        if (e.sender.dataItem().Location) {
            $("#meeting_minutes_location").val(e.sender.dataItem().Location);
        }

        var participants = [];

        if (e.sender.dataItem().Participants) {

            $.each(e.sender.dataItem().Participants.split(","), function () {
                participants.push({
                    Name: this.trim(),
                    Late: false,
                    Excused: false,
                    Unexcused: false
                });
            });
        }

        $("#meeting_minutes_participants").data("kendoGrid").dataSource.data(participants);

        // Load meeting minutes introductory items template from DocMgt - should be assigned to no programs or teams
        kendo.ui.progress($("#meeting_minutes_grid"), true);
        meeting_minutes_load_template();

        // Load template categories assigned to template
        meeting_minutes_load_template_categories(e.sender.value());
    }

    $("#meeting_minutes_save_button,#meeting_minutes_tab_button_group :button").prop("disabled", !e.sender.value());
}

function meeting_minutes_load_template(programName, teamName) {
    var queryObj = [{ 'SearchVariable': 'Active', 'SearchValue': 'Yes' }];
    queryObj.push({ 'SearchVariable': 'ProgramName', 'SearchValue': programName ? programName : "#" });
    queryObj.push({ 'SearchVariable': 'TeamName', 'SearchValue': teamName ? teamName : "#" });

    // Get template id
    meeting_minutes_data_request(queryObj, RECORDID_MEETINGMINUTESTEMPLATE, function (data) {
            
        if (data.length > 0) {
            if (!programName & !teamName) { // auto load introductory items not assigned to any program or team
                meeting_minutes_intro_templateid = parseInt(valueFromDocMgtRecord(data[0].Data, "TemplateId"));
                meeting_minutes_load_template_categories(meeting_minutes_intro_templateid);

            } else { // else load template for chosen program/team
                var templateData = [];

                $.each(data, function () {
                    templateData.push({
                        Value: parseInt(valueFromDocMgtRecord(this.Data, "TemplateId")),
                        Text: valueFromDocMgtRecord(this.Data, "TemplateName"),
                        Location: valueFromDocMgtRecord(this.Data, "Location"),
                        Participants: valueFromDocMgtRecord(this.Data, "Participants")
                    });
                });

                var dataSource = new kendo.data.DataSource({
                    data: templateData,
                    schema: {
                        model: {
                            id: "Value",
                            fields: {
                                Text: { type: "string" },
                                Value: { type: "string" },
                                Location: { type: "string" },
                                Participants: { type: "string" }
                            }
                        }
                    },
                    sort: { field: "Text", dir: "asc" }
                });

                $("#meeting_minutes_template").data("kendoComboBox").setDataSource(dataSource);

                if (templateData.length == 1) {
                    $("#meeting_minutes_template").data("kendoComboBox").select(0);
                    $("#meeting_minutes_template").data("kendoComboBox").trigger("change");
                }

                $("#meeting_minutes_template").data("kendoComboBox").input.focus();
            }
        }
        else {
            showGenericErrorModal("Meeting Minutes", "No meeting templates found for selected program or team");
            $("#meeting_minutes_template").data("kendoComboBox").value(null);
            $("#meeting_minutes_template").data("kendoComboBox").dataSource.data([]);
            $("#meeting_minutes_save_button,#meeting_minutes_tab_button_group :button").prop("disabled", true);
        }
    });
}

function meeting_minutes_save_all(continueFunction, continueArgs) {

    var programTeamDataItem = $("#meeting_minutes_program_team").data("kendoComboBox").dataItem();

    var meetingRecord = {
        "Data": [
            {
                "DataName": "RecordType",
                "DataValue": "Meeting Data"
            },
            {
                "DataName": "ProgramName",
                "DataValue": programTeamDataItem.IsProgram ? programTeamDataItem.Value : null
            },
            {
                "DataName": "TeamName",
                "DataValue": programTeamDataItem.IsTeam ? programTeamDataItem.Value : null
            },
            {
                "DataName": "TemplateId",
                "DataValue": $("#meeting_minutes_template").data("kendoComboBox").value()
            },
            {
                "DataName": "DateTime",
                "DataValue": $("#meeting_minutes_date").data("kendoDateTimePicker").value()
            },
            {
                "DataName": "Location",
                "DataValue": $("#meeting_minutes_location").val()
            },
            {
                "DataName": "CallToOrder",
                "DataValue": $("#meeting_minutes_calltoorder").val()
            },
            {
                "DataName": "OtherNotes",
                "DataValue": $("#meeting_minutes_other_free_text").val()
            },
            {
                "DataName": "NextMeetingDateTime",
                "DataValue": $("#meeting_minutes_date_next").data("kendoDateTimePicker").value()
            },
            {
                "DataName": "NextMeetingLocation",
                "DataValue": $("#meeting_minutes_location_next").val()
            }]
    };

    if (meeting_minutes_recordid) {
        meetingRecord.ID = meeting_minutes_recordid;
    }
    
    $.blockUI();

    meeting_minutes_data_persist(meetingRecord, this, function (data) {
        meeting_minutes_recordid = data.ID;

        $("#meeting_minutes_print_button,#meeting_minutes_tab_button_group :button").prop("disabled", false);
        $("#meeting_minutes_program_team").data("kendoComboBox").enable(false);
        $("#meeting_minutes_template").data("kendoComboBox").enable(false);

        meeting_minutes_save_participants();
        meeting_minutes_save_minutes(continueFunction, continueArgs);
    });
}

function meeting_minutes_save_participants() {
    kendo.ui.progress($("#meeting_minutes_participants"), true);

    // Set up an event to fire once all grid rows have been saved
    $(document).ajaxStop(function () {
        $(document).off("ajaxStop");

        $.unblockUI();
        kendo.ui.progress($("#meeting_minutes_participants"), false);
        $("#meeting_minutes_participants").data("kendoGrid").refresh(); // refresh dirty cell indicators
    });

    // Delete each destroyed grid row in DocMgt
    $.each($("#meeting_minutes_participants").data("kendoGrid").dataSource._destroyed, function () {
        meeting_minutes_data_delete(this.RecordId, RECORDID_MEETINGPARTICIPANTDATA);
    });

    var gridData = $("#meeting_minutes_participants").data("kendoGrid").dataSource.data();
    var i = 0;

    // Send each grid row to DocMgt
    $.each(gridData, function () {
        var meetingParticipantRecord = {
            "Data": [
                {
                    "DataName": "RecordType",
                    "DataValue": "Meeting Participant Data"
                },
                {
                    "DataName": "DisplayOrder",
                    "DataValue": i++
                },
                {
                    "DataName": "Name",
                    "DataValue": this.Name
                },
                {
                    "DataName": "Late",
                    "DataValue": this.Late ? "Yes" : "No"
                },
                {
                    "DataName": "Excused",
                    "DataValue": this.Excused ? "Yes" : "No"
                },
                {
                    "DataName": "Unexcused",
                    "DataValue": this.Unexcused ? "Yes" : "No"
                },
                {
                    "DataName": "GuestNames",
                    "DataValue": this.GuestNames
                },
                {
                    "DataName": "MeetingRecordId",
                    "DataValue": meeting_minutes_recordid
                }
            ]
        };

        if (this.RecordId) {
            meetingParticipantRecord.ID = this.RecordId;
        }

        meeting_minutes_data_persist(meetingParticipantRecord, this, function (data) {
            this.RecordId = data.ID;
            this.id = data.ID;
            this.dirty = false;
        });
    });

}

function meeting_minutes_save_minutes(continueFunction, continueArgs) {

    function meeting_minutes_save_minutes_complete() {
        $(document).off("ajaxStop");

        if (typeof continueFunction === "function") {
            continueFunction.apply(this, continueArgs);
        } else {
            $.unblockUI();
            kendo.ui.progress($("#meeting_minutes_grid"), false);
            $("#meeting_minutes_grid").data("kendoGrid").refresh(); // refresh dirty cell indicators
        }
    }

    // Skip update if no minutes exist
    if ($("#meeting_minutes_grid").data("kendoGrid").dataSource._destroyed.length == 0 &&
        $("#meeting_minutes_grid").data("kendoGrid").dataSource.total() == 0) {
        meeting_minutes_save_minutes_complete();
        return;
    }

    // Set up an event to fire once all grid rows have been saved
    $(document).ajaxStop(meeting_minutes_save_minutes_complete);

    kendo.ui.progress($("#meeting_minutes_grid"), true);

    // Delete each destroyed grid row in DocMgt
    $.each($("#meeting_minutes_grid").data("kendoGrid").dataSource._destroyed, function () {
        meeting_minutes_data_delete(this.RecordId, RECORDID_MEETINGMINUTESDATA);
    });

    var gridData = $("#meeting_minutes_grid").data("kendoGrid").dataSource.data();
    var i = 0;
    var prevDisplayOrder = 0;

    // Send each grid row to DocMgt
    $.each(gridData, function () {
        
        var meetingMinutesRecord = {
            "Data": [
                {
                    "DataName": "RecordType",
                    "DataValue": "Meeting Minutes Data"
                },
                {
                    "DataName": "IsEntry",
                    "DataValue": this.IsEntry ? "Yes" : "No"
                },
                {
                    "DataName": "Text",
                    "DataValue": this.MinutesEntry
                },
                {
                    "DataName": "Status",
                    "DataValue": this.IsNewMeetingItem ? ($.type(this.Status) == 'boolean' && this.Status == true ? "<em>Added to template</em>" : null) : this.Status
                },
                {
                    "DataName": "DisplayOrder",
                    "DataValue": i++ 
                },
                {
                    "DataName": "OrderNumber",
                    "DataValue": this.OrderNumber
                },
                {
                    "DataName": "MeetingCategoryId",
                    "DataValue": $("#meeting_minutes_tab_button_group .active").val()
                },
                {
                    "DataName": "MeetingRecordId",
                    "DataValue": meeting_minutes_recordid
                }
            ]
        };

        if (this.RecordId) {
            meetingMinutesRecord.ID = this.RecordId;
        }

        // Maintain ordering of any new meeting agenda items
        if (!this.IsEntry) {
            if (this.DisplayOrder < prevDisplayOrder) {
                this.DisplayOrder = ++prevDisplayOrder;
                console.log("new template agenda item detected, displayorder setting to: " + this.DisplayOrder);
            } else {
                prevDisplayOrder = this.DisplayOrder;
            }
        }

        meeting_minutes_data_persist(meetingMinutesRecord, this, function (data) {
            this.RecordId = data.ID;
            this.id = data.ID;
            this.dirty = false;

            // Save new agenda item to future template if "add to template" is checked
            if (this.IsNewMeetingItem && $.type(this.Status) == 'boolean' && this.Status == true) {
                meeting_minutes_save_item_to_template(this);
            }
        });
    });
}

function meeting_minutes_save_item_to_template(gridRow) {
    var meetingTemplateItem = {
        "Data": [
            {
                "DataName": "RecordType",
                "DataValue": "Meeting Item"
            },
            {
                "DataName": "MeetingTemplateId",
                "DataValue": $("#meeting_minutes_template").data("kendoComboBox").value()
            },
            {
                "DataName": "Text",
                "DataValue": gridRow.MinutesEntry
            },
            {
                "DataName": "DisplayOrder",
                "DataValue": gridRow.DisplayOrder
            },
            {
                "DataName": "Active",
                "DataValue": "Yes"
            },
            {
                "DataName": "MeetingCategoryId",
                "DataValue": $("#meeting_minutes_tab_button_group .active").val()
            }
        ]
    };

    meeting_minutes_data_persist(meetingTemplateItem, gridRow, function (data) {
        console.log("created new template agenda item ");
        console.log("record id = " + data.ID);

        this.IsNewMeetingItem = false;
        this.Status = "<em>Added to template</em>";
    });
}

function meeting_minutes_load_previous() {

    // Save currrent meeting if not historical before loading another meeting
    if (meeting_minutes_recordid && !meeting_minutes_historical) {
        meeting_minutes_save_all(meeting_minutes_load_previous_continue);
    } else {
        meeting_minutes_load_previous_continue();
    }
}

function meeting_minutes_load_previous_continue() {
    // Get previous meeting for this program or team
    var queryObj = meeting_minutes_previous_meeting_query(1);

    meeting_minutes_data_request(queryObj, null, function (data) {
        if (data.length > 0) {

            var previousMeeting = data[0];
            meeting_minutes_recordid = previousMeeting.ID;
            meeting_minutes_historical = true;
            $("#meeting_minutes_historical_label").show();

            $("#meeting_minutes_print_button,#meeting_minutes_save_button,#meeting_minutes_tab_button_group :button").prop("disabled", false);
            $("#meeting_minutes_program_team").data("kendoComboBox").enable(false);
            $("#meeting_minutes_template").data("kendoComboBox").enable(false);
            $("#meeting_minutes_template").data("kendoComboBox").value(valueFromDocMgtRecord(previousMeeting.Data, "TemplateId"));
            $("#meeting_minutes_date").data("kendoDateTimePicker").value(new Date(valueFromDocMgtRecord(previousMeeting.Data, "DateTime")));
            $("#meeting_minutes_location").val(valueFromDocMgtRecord(previousMeeting.Data, "Location"));
            $("#meeting_minutes_calltoorder").val(valueFromDocMgtRecord(previousMeeting.Data, "CallToOrder"));
            $("#meeting_minutes_other_free_text").val(valueFromDocMgtRecord(previousMeeting.Data, "OtherNotes"));
            var nextMeetingDateTime = valueFromDocMgtRecord(previousMeeting.Data, "NextMeetingDateTime");
            $("#meeting_minutes_date_next").data("kendoDateTimePicker").value(nextMeetingDateTime ? new Date(nextMeetingDateTime) : null);
            $("#meeting_minutes_location_next").val(valueFromDocMgtRecord(previousMeeting.Data, "NextMeetingLocation"));

            // Select this meeting in the historical meetings grid, if exists
            var historicalGrid = $("#meeting_minutes_history_grid").data("kendoGrid");
            if (historicalGrid) {
                var item = historicalGrid.dataSource.get(meeting_minutes_recordid);
                var tr = $("[data-uid='" + item.uid + "']", historicalGrid.tbody);
                historicalGrid.select(tr);
            }

            // Load meeting tabs for the template
            meeting_minutes_reset_categories();
            meeting_minutes_load_template_categories(valueFromDocMgtRecord(previousMeeting.Data, "TemplateId"));

            meeting_minutes_load_saved_participants();

            // Load saved intro items for meeting
            kendo.ui.progress($("#meeting_minutes_grid"), true);
            meeting_minutes_tab_select_continue($("#meeting_minutes_tab_button_intro")[0]);
        }
        else {
            showGenericErrorModal("Meeting Minutes", "No more previous meetings were found for this program or team.");
        }
    });
}

function meeting_minutes_historical_toggle() {
    $("#meeting_minutes_history_collapse").toggle();

    if ($("#meeting_minutes_history_collapse").is(":visible")) {

        // Set up datasource for grid
        var dataSource = new kendo.data.DataSource({
            data: [],
            schema: {
                model: {
                    id: "RecordId",
                    fields: {
                        RecordId: { type: "numeric", defaultValue: 0 },
                        TemplateId: { type: "string" },
                        DateTime: { type: "datetime" },
                        Location: { type: "string" },
                        CallToOrder: { type: "string" },
                        OtherNotes: { type: "string" },
                        NextMeetingDateTime: { type: "datetime" },
                        NextMeetingLocation: { type: "string" }
                    }
                }
            }
        });

        // Initialize grid
        $("#meeting_minutes_history_grid").kendoGrid({
            dataSource: dataSource,
            filterable: false,
            groupable: false,
            pageable: false,
            selectable: true,
            editable: false,
            navigatable: true,
            change: meeting_minutes_historical_select,
            toolbar: kendo.template($("#meeting_minutes_history_toolbar").html()),
            columns: [
                { field: "DateTime", title: "Date", template: '#= kendo.toString(DateTime, "M/dd/yyyy h:mm tt")#' },
                { field: "Location", title: "Location" },
                { field: "NextMeetingDateTime", title: "Next Meeting", template: '#= kendo.toString(NextMeetingDateTime, "M/dd/yyyy h:mm tt")#' }
            ]
        });

        $("#meeting_minutes_history_grid").find(".k-grid-content").css("max-height", "150px");
        kendo.ui.progress($("#meeting_minutes_history_grid"), true);

        // Get one years worth of weekly meetings. If the historical grid is collapsed and expanded again, it will go farther back as you view older meetings.
        var queryObjAdvanced = meeting_minutes_previous_meeting_query(52);

        meeting_minutes_data_request(queryObjAdvanced, null, function (records) {

            var gridData = [];

            $.each(records, function () {
                var dateTimeNext = valueFromDocMgtRecord(this.Data, "NextMeetingDateTime");
                gridData.push({
                    RecordId: this.ID,
                    TemplateId: valueFromDocMgtRecord(this.Data, "TemplateId"),
                    DateTime: new Date(valueFromDocMgtRecord(this.Data, "DateTime")),
                    Location: valueFromDocMgtRecord(this.Data, "Location"),
                    CallToOrder: valueFromDocMgtRecord(this.Data, "CallToOrder"),
                    OtherNotes: valueFromDocMgtRecord(this.Data, "OtherNotes"),
                    NextMeetingDateTime: dateTimeNext ? new Date(dateTimeNext) : "",
                    NextMeetingLocation: valueFromDocMgtRecord(this.Data, "NextMeetingLocation")
                });
            });

            // Done loading historical meetings, set as grid datasource
            $("#meeting_minutes_history_grid").data("kendoGrid").dataSource.data(gridData);

            kendo.ui.progress($("#meeting_minutes_history_grid"), false);
        });
    }
}

function meeting_minutes_historical_select(e) {
    // Save currrent meeting if not historical before loading another meeting
    if (meeting_minutes_recordid && !meeting_minutes_historical) {
        meeting_minutes_save_all(meeting_minutes_historical_select_continue, [e]);
    } else {
        meeting_minutes_historical_select_continue(e);
    }
}

function meeting_minutes_historical_select_continue(e) {
    var dataItem = e.sender.dataItem(e.sender.select());

    if (dataItem) {
        meeting_minutes_recordid = dataItem.RecordId;
        meeting_minutes_historical = true;
        $("#meeting_minutes_historical_label").show();

        $("#meeting_minutes_print_button,#meeting_minutes_save_button,#meeting_minutes_tab_button_group :button").prop("disabled", false);
        $("#meeting_minutes_program_team").data("kendoComboBox").enable(false);
        $("#meeting_minutes_template").data("kendoComboBox").enable(false);
        $("#meeting_minutes_template").data("kendoComboBox").value(dataItem.TemplateId);
        $("#meeting_minutes_date").data("kendoDateTimePicker").value(dataItem.DateTime);
        $("#meeting_minutes_location").val(dataItem.Location);
        $("#meeting_minutes_calltoorder").val(dataItem.CallToOrder);
        $("#meeting_minutes_other_free_text").val(dataItem.OtherNotes);
        $("#meeting_minutes_date_next").data("kendoDateTimePicker").value(dataItem.NextMeetingDateTime);
        $("#meeting_minutes_location_next").val(dataItem.NextMeetingLocation);

        // Load meeting tabs for the template
        meeting_minutes_reset_categories();
        meeting_minutes_load_template_categories(dataItem.TemplateId);

        meeting_minutes_load_saved_participants();

        // Load saved intro items for meeting
        kendo.ui.progress($("#meeting_minutes_grid"), true);
        meeting_minutes_tab_select_continue($("#meeting_minutes_tab_button_intro")[0]);
    }
}

function meeting_minutes_grid_cancel(gridId) {
    showGenericWarningModalWithCancelFunction("Meeting Minutes", "Are you sure you want to cancel changes to this grid?", meeting_minutes_grid_cancel_continue, [gridId]);
}

function meeting_minutes_grid_cancel_continue(gridId) {
    $("#" + gridId).data("kendoGrid").cancelChanges();
}

function meeting_minutes_print() {
    meeting_minutes_save_all(meeting_minutes_print_continue);
}

function meeting_minutes_print_continue() {
    $.blockUI();
    kendo.ui.progress($("#meeting_minutes_grid"), true);

    // Load meeting minutes for all categories and then print
    meeting_minutes_load_saved_minutes(null, function () {
        var subtitle = $("#meeting_minutes_program_team").data("kendoComboBox").text();
        subtitle += " - " + $("#meeting_minutes_template").data("kendoComboBox").text();

        meeting_minutes_grid_print("Holy Cross Services Meeting Minutes",
            [$("#meeting_minutes_participants"), $("#meeting_minutes_grid")],
            null,
            subtitle,
            $("#meeting_minutes_date").data("kendoDateTimePicker").value());

        // Reset grid back to current category after printing
        kendo.ui.progress($("#meeting_minutes_grid"), true);
        meeting_minutes_load_saved_minutes($("#meeting_minutes_tab_button_group .active")[0].value);
    });
}