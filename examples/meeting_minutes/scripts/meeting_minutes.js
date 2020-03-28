
var meeting_minutes_intro_templateid;
var meeting_minutes_intro_categoryid;
var meeting_minutes_recordid;
var meeting_minutes_historical = false;
var isOnline = false;
var db; // IndexedDB local storage


$(function () {

    if (!("indexedDB" in window)) {
        console.error("This browser doesn't support IndexedDB storage - your changes will not be saved.");
        return;
    } else {

        // Start IndexedDB local storage database
        var request = window.indexedDB.open("Meeting Minutes", 1);
        request.onupgradeneeded = function (event) {

            db = event.target.result;

            // Blank stores for meeting data
            var objectStore = db.createObjectStore("Meeting Data", { keyPath: "RecordId", autoIncrement: true });
            objectStore.createIndex("TeamName", "TeamName", { unique: false });
            var objectStore = db.createObjectStore("Meeting Participant Data", { keyPath: "RecordId", autoIncrement: true });
            objectStore.createIndex("MeetingRecordId", "MeetingRecordId", { unique: false });
            var objectStore = db.createObjectStore("Meeting Minutes Data", { keyPath: "RecordId", autoIncrement: true });
            objectStore.createIndex("MeetingRecordId", "MeetingRecordId", { unique: false });

            // Populate default meeting template stores
            var objectStore = db.createObjectStore("Meeting Team", { keyPath: "TeamName" });
            objectStore.add({ "TeamName": "Team One" });
            objectStore.add({ "TeamName": "Team Two" });

            var objectStore = db.createObjectStore("Meeting Template", { keyPath: "RecordId", autoIncrement: true });
            objectStore.createIndex("TeamName", "TeamName", { unique: false });
            objectStore.add({ "RecordId": 1, "TemplateName": "Introductory Items", "Active": "Yes", "TeamName": "#" });
            objectStore.add({ "RecordId": 2, "TemplateName": "Monthly Meeting", "Active": "Yes", "TeamName": "Team One", "Participants": "Dan,Gabbie,Kim", "Location": "Conference room" });
            objectStore.add({ "RecordId": 3, "TemplateName": "Online Meeting", "Active": "Yes", "TeamName": "Team One", "Participants": "Chad,Brandon,Katie", "Location": "Video chat" });
            objectStore.add({ "RecordId": 4, "TemplateName": "Weekly Meeting", "Active": "Yes", "TeamName": "Team Two", "Participants": "Marcus,Henry,Amanda", "Location": "Office" });

            var objectStore = db.createObjectStore("Meeting Category", { keyPath: "RecordId", autoIncrement: true });
            objectStore.createIndex("MeetingTemplateId", "MeetingTemplateId", { unique: false });
            objectStore.add({ "RecordId": 1, "MeetingTemplateId": 1, "CategoryName": "Introductory Items", "Active": "Yes", "DisplayOrder": 1 });
            objectStore.add({ "RecordId": 2, "MeetingTemplateId": 2, "CategoryName": "Agenda Items", "Active": "Yes", "DisplayOrder": 1 });
            objectStore.add({ "RecordId": 3, "MeetingTemplateId": 2, "CategoryName": "Secondary Matters", "Active": "Yes", "DisplayOrder": 2 });
            objectStore.add({ "RecordId": 4, "MeetingTemplateId": 3, "CategoryName": "Daily Update", "Active": "Yes", "DisplayOrder": 1 });
            objectStore.add({ "RecordId": 5, "MeetingTemplateId": 4, "CategoryName": "Weekly Progress", "Active": "Yes", "DisplayOrder": 1 });

            var objectStore = db.createObjectStore("Meeting Item", { keyPath: "RecordId", autoIncrement: true });
            objectStore.createIndex("MeetingTemplateId", "MeetingTemplateId", { unique: false });
            objectStore.createIndex("MeetingCategoryId", "MeetingCategoryId", { unique: false });
            objectStore.add({ "RecordId": 1, "MeetingTemplateId": 1, "MeetingCategoryId": 1, "Active": "Yes", "DisplayOrder": 1, "Text": "Agenda review & approval of last meeting" });
            objectStore.add({ "RecordId": 2, "MeetingTemplateId": 1, "MeetingCategoryId": 1, "Active": "Yes", "DisplayOrder": 2, "Text": "Announcements" });
            objectStore.add({ "RecordId": 3, "MeetingTemplateId": 1, "MeetingCategoryId": 1, "Active": "Yes", "DisplayOrder": 3, "Text": "Training topics" });
            objectStore.add({ "RecordId": 4, "MeetingTemplateId": 1, "MeetingCategoryId": 1, "Active": "Yes", "DisplayOrder": 4, "Text": "Review follow-up items of last meeting" });
            objectStore.add({ "RecordId": 5, "MeetingTemplateId": 2, "MeetingCategoryId": 2, "Active": "Yes", "DisplayOrder": 1, "Text": "Discuss future goals" });
            objectStore.add({ "RecordId": 6, "MeetingTemplateId": 2, "MeetingCategoryId": 2, "Active": "Yes", "DisplayOrder": 2, "Text": "Create actionable list to achieve those goals" });
            objectStore.add({ "RecordId": 7, "MeetingTemplateId": 2, "MeetingCategoryId": 3, "Active": "Yes", "DisplayOrder": 1, "Text": "Additional safety concerns to be addressed" });
            objectStore.add({ "RecordId": 8, "MeetingTemplateId": 2, "MeetingCategoryId": 3, "Active": "Yes", "DisplayOrder": 2, "Text": "Public relations message" });
            objectStore.add({ "RecordId": 9, "MeetingTemplateId": 3, "MeetingCategoryId": 4, "Active": "Yes", "DisplayOrder": 1, "Text": "What is your plan for the day?" });
            objectStore.add({ "RecordId": 10, "MeetingTemplateId": 3, "MeetingCategoryId": 4, "Active": "Yes", "DisplayOrder": 2, "Text": "Are there any hurdles to your progress?" });
            objectStore.add({ "RecordId": 11, "MeetingTemplateId": 4, "MeetingCategoryId": 5, "Active": "Yes", "DisplayOrder": 1, "Text": "What issues should the oversight team review?" });

            console.log("Created new IndexedDB database");
        };
        request.onsuccess = function (event) {
            db = event.target.result;
            console.log("Opened IndexedDB database");
        };
        request.onerror = function (event) {
            console.error("Problem opening IndexedDB storage. Make sure you are not browsing in private mode to store your changes.", request.error);
        };
    }
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
    // Clear out template values to avoid problems reopening the widget
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

function meeting_minutes_reset_categories() {
    // Reset meeting category buttons
    $("#meeting_minutes_tab_button_group :button").not("#meeting_minutes_tab_button_intro,#meeting_minutes_tab_button_other").remove();
    $("#meeting_minutes_tab_button_group :button").removeClass("active");
    $("#meeting_minutes_tab_button_intro").addClass("active");
    $("#meeting_minutes_add_to_agenda_button").hide();

    $("#meeting_minutes_intro_panel").show();
    $("#meeting_minutes_other_notes,#meeting_minutes_next_meeting_panel").hide();
}

function meeting_minutes_data_request(queryObject, recordType, successFunction) {
    if (isOnline) {
        $.ajax({
            type: "POST",
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
        // Access records locally from IndexedDB storage
        var transaction = db.transaction(recordType, "readonly");

        var resultData = [];

        transaction.oncomplete = function (event) {
            successFunction(resultData);
        };
        transaction.onerror = function (event) {
            console.log("read transaction error");
        };

        var objectStore = transaction.objectStore(recordType);
        
        if (queryObject) {
            var index = objectStore.index(queryObject.SearchVariable);
            var singleKeyRange = IDBKeyRange.only(queryObject.SearchValue);

            index.openCursor(singleKeyRange).onsuccess = function (event) {
                var cursor = event.target.result;
                if (cursor) {
                    resultData.push(cursor.value);
                    cursor.continue();
                }
            };
        } else {
            objectStore.getAll().onsuccess = function (event) {
                resultData = event.target.result;
            };
        }
    }
}

function meeting_minutes_data_persist(recordObjects, recordType, successFunction) {

    if (isOnline) {
        $.ajax({
            type: "POST",
            url: REST_URL + "/records",
            dataType: 'json',
            contentType: "application/json",
            data: JSON.stringify(recordObjects),
            success: successFunction,
            error: function (error) {
                console.error("Error presisting data for queryObject:");
                console.error(queryObject);
                console.error(error);
            },
        });
    } else {
        // Store records locally to IndexedDB storage
        var transaction = db.transaction(recordType, 'readwrite');

        transaction.oncomplete = function (event) {
            if (typeof successFunction === "function") {
                successFunction();
            }
        };
        transaction.onerror = function (event) {
            console.log("write transaction error");
        };

        var objectStore = transaction.objectStore(recordType);

        // Insert or update each record within one transaction
        $.each(recordObjects, function () {
            var record = this;

            var request = record.RecordData.RecordId ? objectStore.put(record.RecordData) : objectStore.add(record.RecordData);
            request.onsuccess = function (event) {

                if (recordType == "Meeting Data") {
                    meeting_minutes_recordid = event.target.result;
                } else {
                    record.RecordId = event.target.result;
                    record.id = event.target.result;
                    record.dirty = false;
                }
            }
            request.onerror = function (event) {
                console.log('request.onerror', event);
            };
        });
    }
}

function meeting_minutes_data_delete(recordObjects, recordType, successFunction) {
    if (isOnline) {
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
                console.error("Error deleting data for record id:", recordId);
                console.error(error);
            },
        });
    } else {
        // Store records locally to IndexedDB storage
        var transaction = db.transaction(recordType, 'readwrite');

        transaction.oncomplete = function (event) {
            if (typeof successFunction === "function") {
                successFunction();
            }
        };
        transaction.onerror = function (event) {
            console.log("delete transaction error");
        };

        var objectStore = transaction.objectStore(recordType);

        // Delete each record within one transaction
        $.each(recordObjects, function () {

            var request = objectStore.delete(this.RecordId);
            request.onsuccess = function (event) {

            }
            request.onerror = function (event) {
                console.log('request.onerror', event);
            };
        });
    }
}

function meeting_minutes_program_team_setup() {

    var queryObj = null;//[{ 'SearchVariable': 'Active', 'SearchValue': 'Yes' }];

    meeting_minutes_data_request(queryObj, "Meeting Team", function (data) {

        var programsAndTeams = [];

        $.each(data, function () {
            var teamName = this.TeamName;

            programsAndTeams.push({ Text: teamName, Value: teamName, IsProgram: false, IsTeam: true });
        });

        var dataSource = new kendo.data.DataSource({
            data: programsAndTeams,
            schema: {
                model: {
                    id: "Value",
                    fields: {
                        Text: { type: "string" },
                        Value: { type: "string" },
                        IsProgram: { type: "boolean" },
                        IsTeam: { type: "boolean" }
                    }
                }
            },
            sort: { field: "Text", dir: "asc" }
        });

        $("#meeting_minutes_program_team").data("kendoComboBox").setDataSource(dataSource);
        
        // Auto select first team for demo purposes
        $("#meeting_minutes_program_team").data("kendoComboBox").select(0);
        $("#meeting_minutes_program_team").data("kendoComboBox").trigger("change");
    });
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

    // Initialize grid, then get meeting minutes template data
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

        // Load meeting minutes introductory items template - should be assigned to no programs or teams
        kendo.ui.progress($("#meeting_minutes_grid"), true);
        meeting_minutes_load_template();

        // Load template categories assigned to template
        meeting_minutes_load_template_categories(parseInt(e.sender.value()));
    }

    $("#meeting_minutes_save_button,#meeting_minutes_tab_button_group :button").prop("disabled", !e.sender.value());
}

function meeting_minutes_load_template(programName, teamName) {

    var queryObj = { 'SearchVariable': 'TeamName', 'SearchValue': teamName ? teamName : "#" };

    // Get template id
    meeting_minutes_data_request(queryObj, "Meeting Template", function (data) {

        if (data.length > 0) {
            if (!programName & !teamName) { // auto load introductory items not assigned to any program or team
                meeting_minutes_intro_templateid = data[0].RecordId;
                meeting_minutes_load_template_categories(meeting_minutes_intro_templateid);

            } else { // else load template for chosen program/team
                var templateData = [];

                $.each(data, function () {
                    templateData.push({
                        Value: this.RecordId,
                        Text: this.TemplateName,
                        Location: this.Location,
                        Participants: this.Participants
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

                //if (templateData.length == 1) { // select the first meeting template for demo purposes
                    $("#meeting_minutes_template").data("kendoComboBox").select(0);
                    $("#meeting_minutes_template").data("kendoComboBox").trigger("change");
                //}

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

function meeting_minutes_load_template_categories(templateId) {

    // Display Loading... when loading category tabs
    if (templateId != meeting_minutes_intro_templateid) {
        var buttonHtml = '<button type="button" class="btn btn-default" style="border-radius: 0 !important" id="meeting_minutes_tab_button_loading" disabled><em>Loading...</em></button>';
        $("#meeting_minutes_tab_button_other").before(buttonHtml);
    }

    var queryObj = { 'SearchVariable': 'MeetingTemplateId', 'SearchValue': templateId };//, { 'SearchVariable': 'Active', 'SearchValue': 'Yes' }];

    meeting_minutes_data_request(queryObj, "Meeting Category", function (data) {

        if (data.length > 0) {
            if (templateId == meeting_minutes_intro_templateid) { // introductory items not assigned to any program or team

                // Set grid toolbar label
                var name = data[0].CategoryName;
                $("#minutes_grid_label").text(name);

                // Get all meeting items in category
                var categoryId = data[0].RecordId;

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
                        CategoryId: this.RecordId,
                        CategoryName: this.CategoryName,
                        OrderNumber: this.DisplayOrder
                    });
                });

                // Sort by category order number
                tabData.sort(meeting_minutes_displayorder_sort);

                // Set up tabs for each category in template
                for (var i = 0; i < tabData.length; i++) {
                    var buttonHtml = '<button type="button" class="btn btn-primary default-focus-ignore" style="border-radius: 0 !important" value="' + tabData[i].CategoryId + '">' + tabData[i].CategoryName + '</button>';
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

    var queryObj = { 'SearchVariable': 'MeetingCategoryId', 'SearchValue': parseInt(categoryId) };//, { 'SearchVariable': 'Active', 'SearchValue': 'Yes' }];

    meeting_minutes_data_request(queryObj, "Meeting Item", function (records) {

        var gridData = [];

        // Create array of meeting template items
        $.each(records, function () {
            gridData.push({
                RecordId: 0,
                MinutesEntry: this.Text,
                IsEntry: false,
                DisplayOrder: this.DisplayOrder,
                OrderNumber: this.DisplayOrder,
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
            //meeting_minutes_load_previous_actions();
            kendo.ui.progress($("#meeting_minutes_grid"), false);
        } else {
            kendo.ui.progress($("#meeting_minutes_grid"), false);
        }
    });
}

function meeting_minutes_load_saved_minutes(categoryId, continueFunction) {

    var queryObj = { 'SearchVariable': 'MeetingRecordId', 'SearchValue': meeting_minutes_recordid }; 

    // If no category is specified, load all categories at once for printing purposes
    if (categoryId) {
        queryObj.FilterVariable = "MeetingCategoryId";
        queryObj.FilterValue =  String(categoryId);
    }

    meeting_minutes_data_request(queryObj, "Meeting Minutes Data", function (records) {

        var gridData = [];

        if(queryObj.FilterVariable) {
            records = records.filter(function (value) {
                return value[queryObj.FilterVariable] == queryObj.FilterValue;
            });
        }

        if (records.length > 0) {

            // Create array of meeting template items
            $.each(records, function () {

                // Order by category, then display order for printing multiple categories. "Other" category is always at the end.
                //var meetingCategoryIdStr = valueFromDocMgtRecord(this.Data, "MeetingCategoryId");
                //meetingCategoryIdStr = meetingCategoryIdStr != "other" ? meetingCategoryIdStr : "999999";

                gridData.push({
                    RecordId: this.RecordId,
                    MeetingCategoryId: this.MeetingCategoryId,
                    MinutesEntry: this.Text,
                    IsEntry: this.IsEntry == "Yes" ? true : false,
                    DisplayOrder: this.DisplayOrder,
                    OrderNumber: this.OrderNumber,
                    Status: this.Status,
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

    var queryObj = { 'SearchVariable': 'MeetingRecordId', 'SearchValue': meeting_minutes_recordid };

    meeting_minutes_data_request(queryObj, "Meeting Participant Data", function (records) {

        var gridData = [];

        // Create array of meeting participants
        $.each(records, function () {
            gridData.push({
                RecordId: this.RecordId,
                DisplayOrder: this.DisplayOrder,
                Name: this.Name,
                Late: this.Late == "Yes" ? true : false,
                Excused: this.Excused == "Yes" ? true : false,
                Unexcused: this.Unexcused == "Yes" ? true : false,
                GuestNames: this.GuestNames,
            });
        });

        gridData.sort(meeting_minutes_displayorder_sort);

        // Done loading meeting participant data, set as grid datasource
        $("#meeting_minutes_participants").data("kendoGrid").dataSource.data(gridData);
        kendo.ui.progress($("#meeting_minutes_participants"), false);
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

    meeting_minutes_data_request(queryObj, "Meeting Data", function (records) {

        // Filter out meetings occurring after the current meeting
        var meetingDateTime = $("#meeting_minutes_date").data("kendoDateTimePicker").value();
        if (!meetingDateTime) {
            meetingDateTime = new Date();
        }

        records = records.filter(function (value) {
            return value.DateTime < meetingDateTime;
        });

        if (records.length > 0) {
            // Load the most recent meeting prior to the current meeting
            var data = records[records.length-1];

            meeting_minutes_recordid = data.RecordId;
            meeting_minutes_historical = true;
            $("#meeting_minutes_historical_label").show();

            $("#meeting_minutes_print_button,#meeting_minutes_save_button,#meeting_minutes_tab_button_group :button").prop("disabled", false);
            $("#meeting_minutes_program_team").data("kendoComboBox").enable(false);
            $("#meeting_minutes_template").data("kendoComboBox").enable(false);
            $("#meeting_minutes_template").data("kendoComboBox").value(data.TemplateId);
            $("#meeting_minutes_date").data("kendoDateTimePicker").value(data.DateTime);
            $("#meeting_minutes_location").val(data.Location);
            $("#meeting_minutes_calltoorder").val(data.CallToOrder);
            $("#meeting_minutes_other_free_text").val(data.OtherNotes);
            var nextMeetingDateTime = data.NextMeetingDateTime;
            $("#meeting_minutes_date_next").data("kendoDateTimePicker").value(nextMeetingDateTime ? new Date(nextMeetingDateTime) : null);
            $("#meeting_minutes_location_next").val(data.NextMeetingLocation);

            // Select this meeting in the historical meetings grid, if exists
            var historicalGrid = $("#meeting_minutes_history_grid").data("kendoGrid");
            if (historicalGrid) {
                var item = historicalGrid.dataSource.get(meeting_minutes_recordid);
                if(item) {
                    var tr = $("[data-uid='" + item.uid + "']", historicalGrid.tbody);
                    historicalGrid.select(tr);
                }
            }

            // Load meeting tabs for the template
            meeting_minutes_reset_categories();
            meeting_minutes_load_template_categories(parseInt(data.TemplateId));

            meeting_minutes_load_saved_participants();

            // Load saved intro items for meeting
            kendo.ui.progress($("#meeting_minutes_grid"), true);
            meeting_minutes_tab_select_continue($("#meeting_minutes_tab_button_intro")[0]);
        }
        else {
            showGenericErrorModal("Meeting Minutes", "No more previous meetings were found for this program or team.");
            kendo.ui.progress($("#meeting_minutes_grid"), false);
        }
    });
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

function meeting_minutes_previous_meeting_query(maxResults) {
    var programTeamDataItem = $("#meeting_minutes_program_team").data("kendoComboBox").dataItem();

    // Don't use date filtering below in order to support IndexedDB storage accessable by a single index
    return { 'SearchVariable': 'TeamName', 'SearchValue': programTeamDataItem.Value };
     /*
    var searchValues = [];

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
    
    return { 'RecordTypeID': "Meeting Data", 'SearchValues': searchValues, 'SortField': 'DateTime DESC', 'NumPerPage': (maxResults ? maxResults : 0) };    
    */
}

function meeting_minutes_goto_action_record(recordId) {
    meeting_minutes_openinnewtab("/" + recordId);
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
    if (grid) {
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
    var orderNumber = e.model.OrderNumber - 1;
    // Get the index in the datasource
    var idx = grid.dataSource.indexOf(e.model);
    // Reorder subsequent minutes entries in this section
    for (var i = idx + 1; i < grid.dataSource.data().length; i++) {
        if (!grid.dataSource.data()[i].IsEntry) {
            break;
        }
        grid.dataSource.data()[i].OrderNumber = ++orderNumber;
    }
    // Manually refresh order number as it is not an editable column
    grid.refresh();
    // Select row above deleted row for subsequent inserts
    setTimeout(function () { grid.select($("#" + grid.element[0].id + " tr:eq(" + (sel_idx >= idx ? sel_idx : sel_idx + 1) + ")")); });
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
    selectedMinutes.Status = "<em>Action assigned</em>";
    grid.refresh();

    $.unblockUI();
    kendo.ui.progress($("#meeting_minutes_grid"), false);
  
    var programTeamDataItem = $("#meeting_minutes_program_team").data("kendoComboBox").dataItem();
    
    /*
    var url = "/?"
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
*/
    var url = "mailto:testuser@example.com?subject=";
    url += encodeURIComponent(selectedMinutes.MinutesEntry);
    url += "&body=Assign this task to a " + encodeURIComponent(programTeamDataItem.Value) + " member. ";
    url += "Meeting minutes can be integrated to scheduling software and other workflow applications.";

    meeting_minutes_openinnewtab(url);
}

function meeting_minutes_save_all(continueFunction, continueArgs) {

    var programTeamDataItem = $("#meeting_minutes_program_team").data("kendoComboBox").dataItem();

    var meetingRecord = {
        RecordData: {
            "ProgramName": programTeamDataItem.IsProgram ? programTeamDataItem.Value : null,
            "TeamName": programTeamDataItem.IsTeam ? programTeamDataItem.Value : null,
            "TemplateId": $("#meeting_minutes_template").data("kendoComboBox").value(),
            "DateTime": $("#meeting_minutes_date").data("kendoDateTimePicker").value(),
            "Location": $("#meeting_minutes_location").val(),
            "CallToOrder": $("#meeting_minutes_calltoorder").val(),
            "OtherNotes": $("#meeting_minutes_other_free_text").val(),
            "NextMeetingDateTime": $("#meeting_minutes_date_next").data("kendoDateTimePicker").value(),
            "NextMeetingLocation": $("#meeting_minutes_location_next").val()
        }
    };

    if(meeting_minutes_recordid) {
        meetingRecord.RecordData.RecordId = meeting_minutes_recordid;
    }

    meeting_minutes_data_persist([meetingRecord], "Meeting Data", function () {
        $("#meeting_minutes_print_button,#meeting_minutes_tab_button_group :button").prop("disabled", false);
        $("#meeting_minutes_program_team").data("kendoComboBox").enable(false);
        $("#meeting_minutes_template").data("kendoComboBox").enable(false);

        meeting_minutes_save_participants();
        meeting_minutes_save_minutes(continueFunction, continueArgs);
    });
}

function meeting_minutes_save_participants() {
    kendo.ui.progress($("#meeting_minutes_participants"), true);

    // Delete each destroyed grid row
    var gridDataDestroyed = $("#meeting_minutes_participants").data("kendoGrid").dataSource._destroyed;
    meeting_minutes_data_delete(gridDataDestroyed, "Meeting Participant Data");

    var gridData = $("#meeting_minutes_participants").data("kendoGrid").dataSource.data();
    var i = 0;

    $.each(gridData, function () {
        this.RecordData = {
            "DisplayOrder": i++,
            "Name": this.Name,
            "Late": this.Late ? "Yes" : "No",
            "Excused": this.Excused ? "Yes" : "No",
            "Unexcused": this.Unexcused ? "Yes" : "No",
            "GuestNames": this.GuestNames,
            "MeetingRecordId": meeting_minutes_recordid,
        };

        if(this.RecordId) {
            this.RecordData.RecordId = this.RecordId;
        }
    });

    meeting_minutes_data_persist(gridData, "Meeting Participant Data", function () {
        kendo.ui.progress($("#meeting_minutes_participants"), false);
        $("#meeting_minutes_participants").data("kendoGrid").refresh(); // refresh dirty cell indicators
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

    // Delete each destroyed grid row
    var gridDataDestroyed = $("#meeting_minutes_grid").data("kendoGrid").dataSource._destroyed;
    meeting_minutes_data_delete(gridDataDestroyed, "Meeting Minutes Data");

    var gridData = $("#meeting_minutes_grid").data("kendoGrid").dataSource.data();
    var i = 0;
    var prevDisplayOrder = 0;

    // Send each grid row to DocMgt
    $.each(gridData, function () {
        this.RecordData = {
            "IsEntry": this.IsEntry ? "Yes" : "No",
            "Text": this.MinutesEntry,
            "Status": this.IsNewMeetingItem ? ($.type(this.Status) == 'boolean' && this.Status == true ? "<em>Added to template</em>" : null) : this.Status,
            "DisplayOrder": i++,
            "OrderNumber": this.OrderNumber,
            "MeetingCategoryId": $("#meeting_minutes_tab_button_group .active").val(),
            "MeetingRecordId": meeting_minutes_recordid
        };

        if(this.RecordId) {
            this.RecordData.RecordId = this.RecordId;
        }

        // Maintain ordering of any new meeting agenda items
        if (!this.IsEntry) {
            if (this.DisplayOrder < prevDisplayOrder) {
                this.DisplayOrder = ++prevDisplayOrder;
            } else {
                prevDisplayOrder = this.DisplayOrder;
            }
        }

        // Save new agenda item to future template if "add to template" is checked
        if (this.IsNewMeetingItem && $.type(this.Status) == 'boolean' && this.Status == true) {
            meeting_minutes_save_item_to_template(this);
        }
    });

    meeting_minutes_data_persist(gridData, "Meeting Minutes Data", meeting_minutes_save_minutes_complete);
}

function meeting_minutes_save_item_to_template(gridRow) {

    var meetingTemplateItem = {
        RecordData : {
        "MeetingTemplateId": parseInt($("#meeting_minutes_template").data("kendoComboBox").value()),
        "Text": gridRow.MinutesEntry,
        "DisplayOrder": gridRow.DisplayOrder,
        "Active": "Yes",
        "MeetingCategoryId": parseInt($("#meeting_minutes_tab_button_group .active").val())
        }
    };

    meeting_minutes_data_persist([meetingTemplateItem], "Meeting Item", function () {
        gridRow.IsNewMeetingItem = false;
        gridRow.Status = "<em>Added to template</em>";
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
            toolbar: kendo.template($("#meeting_minutes_history_toolbar").html()),
            columns: [
                { field: "DateTime", title: "Date", template: '#= kendo.toString(DateTime, "M/dd/yyyy h:mm tt")#' },
                { field: "Location", title: "Location" },
                { field: "NextMeetingDateTime", title: "Next Meeting", template: '#= NextMeetingDateTime ? kendo.toString(NextMeetingDateTime, "M/dd/yyyy h:mm tt") : ""#' }
            ]
        });

        $("#meeting_minutes_history_grid").find(".k-grid-content").css("max-height", "150px");
        $("#meeting_minutes_history_grid").off("dblclick").on("dblclick", "tr.k-state-selected", meeting_minutes_historical_select);
        kendo.ui.progress($("#meeting_minutes_history_grid"), true);

        // Get one years worth of weekly meetings. If the historical grid is collapsed and expanded again, it will go farther back as you view older meetings.
        var queryObj = meeting_minutes_previous_meeting_query(52);

        meeting_minutes_data_request(queryObj, "Meeting Data", function (records) {
            var gridData = [];

            $.each(records, function () {
                gridData.push({
                    RecordId: this.RecordId,
                    TemplateId: this.TemplateId,
                    DateTime: this.DateTime,
                    Location: this.Location,
                    CallToOrder: this.CallToOrder,
                    OtherNotes: this.OtherNotes,
                    NextMeetingDateTime: this.NextMeetingDateTime,
                    NextMeetingLocation: this.NextMeetingLocation
                });
            });

            // Done loading historical meetings, set as grid datasource
            $("#meeting_minutes_history_grid").data("kendoGrid").dataSource.data(gridData);

            kendo.ui.progress($("#meeting_minutes_history_grid"), false);

            // Sometimes expanding the history section loses the scrollbar, make sure user can scroll
            $("body").addClass("modal-open");
        });
    }
}

function meeting_minutes_historical_select() {
    // Save currrent meeting if not historical before loading another meeting
    if (meeting_minutes_recordid && !meeting_minutes_historical) {
        meeting_minutes_save_all(meeting_minutes_historical_select_continue);
    } else {
        meeting_minutes_historical_select_continue();
    }
}

function meeting_minutes_historical_select_continue() {
    var grid = $("#meeting_minutes_history_grid").data("kendoGrid");
    var dataItem = grid.dataItem(grid.select());

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
        meeting_minutes_load_template_categories(parseInt(dataItem.TemplateId));

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
    kendo.ui.progress($("#meeting_minutes_grid"), true);

    // Load meeting minutes for all categories and then print
    meeting_minutes_load_saved_minutes(null, function () {
        var subtitle = $("#meeting_minutes_program_team").data("kendoComboBox").text();
        subtitle += " - " + $("#meeting_minutes_template").data("kendoComboBox").text();

        meeting_minutes_grid_print("Meeting Minutes",
            [$("#meeting_minutes_participants"), $("#meeting_minutes_grid")],
            null,
            subtitle,
            $("#meeting_minutes_date").data("kendoDateTimePicker").value());

        $.unblockUI();

        // Reset grid back to current category after printing
        kendo.ui.progress($("#meeting_minutes_grid"), true);
        meeting_minutes_load_saved_minutes($("#meeting_minutes_tab_button_group .active")[0].value);
    });
}