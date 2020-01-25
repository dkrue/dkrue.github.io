---
layout: post
title:  "Easy reset button for forms with Kendo UI and jQuery"
date:   2016-03-18 18:53:54 -0500
categories: kendo javascript jquery
---
Here is a short and sweet all-JavaScript way to create a reset button on a form with a mixture of Kendo UI controls and HTML controls.

{% highlight js %}
var form_cancel_values = [];

// On form load - Save current values of form controls into an array
function readCancelValues() {
    form_cancel_values = $('#UserForm').serializeArray();
}

// User clicked cancel - Reset all form fields to value in array
function recallCancelValues() {
    $("#UserForm [type='checkbox']").prop("checked", false);

    $.each(form_cancel_values, function () {
        if (kendo.widgetInstance($('#' + this.name))) {
            kendo.widgetInstance($('#' + this.name)).value(this.value);
        } else {
            $('#' + this.name).val(this.value).prop("checked", true);
        }
        $('#' + this.name).blur(); // clear Kendo validator tooltip
    });
}
{% endhighlight %}

When recalling the cancellation values, first all checkboxes in the form are cleared. Any checked checkboxes will be re-checked later. This is due to the default HTML behavior of checkboxes- they are not defined unless checked.

Using `kendo.widgetInstance` here allows us to set the value of the Kendo control, regardless of the type of control. That way we don't concern ourselves with whether it is a DatePicker, ComboBox, etc.

The final touch is to trigger the blur _(lose focus)_ event on each control, so that any _"This field is required"_ Kendo validator tooltips are hidden.